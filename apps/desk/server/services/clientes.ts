import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { searchClients, getClient } from '@ambientalia/zoho-sync/books/repo'
import { esIdProvisional, type ClientLite } from '@ambientalia/shared'
import { getProvisional, searchProvisionales, type ProvisionalRow } from '../db/clientesProvisionales'

/**
 * Resolución de clientes de la app (F1B-15, RQ-TC-34, D2). Books se consulta SIEMPRE primero y sin cambios
 * (`books/repo.ts`); los provisionales son una segunda consulta, y sólo cuando el id lleva el prefijo
 * `PREFIJO_PROVISIONAL`. Así un id de Books nunca toca `public.clientes_provisionales` (prioridad de Books).
 */

function delProvisional(p: ProvisionalRow): ClientLite {
  return { id: p.id, name: p.razonSocial, nit: p.nit, email: p.correo, telefono: p.telefono, personaContacto: p.contacto, provisional: true }
}

/**
 * La ficha de un cliente. Un provisional ya enlazado se resuelve por su contacto de Books (`enlazado_a`),
 * así que sólo se devuelve como `provisional: true` el que sigue sin enlazar. `null` si no existe en ninguno.
 */
export async function obtenerCliente(db: Queryable, id: string): Promise<ClientLite | null> {
  const books = await getClient(db, id)
  if (books) return { ...books, provisional: false }
  if (!esIdProvisional(id)) return null
  const p = await getProvisional(db, id)
  if (!p) return null
  if (p.enlazadoA) {
    const enlazado = await getClient(db, p.enlazadoA)
    return enlazado ? { ...enlazado, provisional: false } : null
  }
  return delProvisional(p)
}

/** Búsqueda: los de Books (`provisional:false`) y, sólo si se pide (D13), los provisionales no enlazados. */
export async function buscarClientes(db: Queryable, q: string, incluirProvisionales: boolean, limit = 20): Promise<ClientLite[]> {
  const books = (await searchClients(db, q, limit)).map((c) => ({ ...c, provisional: false }))
  if (!incluirProvisionales) return books
  const provisionales = (await searchProvisionales(db, q, limit)).map(delProvisional)
  return [...books, ...provisionales]
}

/**
 * El cliente que se le puede poner a un equipo: uno de Books, o el MISMO provisional que el equipo ya
 * tiene (`clientIdActual`). Cualquier otro provisional es `null`: reasignar un equipo a un provisional
 * ajeno no es un alta, es un cambio que decide Comercial con el enlace.
 */
export async function clienteParaEquipo(db: Queryable, id: string, clientIdActual: string | null | undefined): Promise<ClientLite | null> {
  const books = await getClient(db, id)
  if (books) return { ...books, provisional: false }
  if (!esIdProvisional(id) || id !== clientIdActual) return null
  return obtenerCliente(db, id)
}
