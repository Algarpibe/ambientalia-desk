import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { createTicket, type CreateTicketInput } from '@ambientalia/zoho-sync/db/repo'
import type { EquipoLite } from '@ambientalia/shared'
import { getModelo } from '../db/catalogo'
import { getEquipoBySerial, createEquipo, type EquipoInput } from '../db/equipos'
import { camposHojaDeVida } from '../routes/equipos'
import { enTransaccion } from '../db/transaccion'
import { HttpError } from '../util/httpError'

/** Los campos que el cuerpo del alta trae bajo `equipoNuevo` (RQ-TC-15). Sin tipar sus valores: se
 *  normalizan aquí, igual que el resto de `createManagedTicket` normaliza `body`. */
type EquipoNuevoBody = Record<string, unknown>

/** Datos para `createEquipo` si el equipo es provisional; `null` si ya está registrado o reutilizado. */
type DatosEquipoNuevo = Omit<EquipoInput, 'clienteNombre' | 'clientId'>

export interface EquipoAResolver {
  /** El equipo a usar: registrado o reutilizado (`id` no vacío) o provisional (`id ''`). */
  equipo: EquipoLite
  datos: DatosEquipoNuevo | null
}

/**
 * Guarda 1 (existencia de serial/modeloId/fechaFacturaCompra, escalón A) + guarda 2 (el modelo está
 * en el catálogo, escalón A) + resolución (reutilizar por serial o dejar un equipo provisional para
 * que `crearTicketConEquipo` lo cree en transacción). Se llama pronto, junto a la guarda 1 de siempre
 * (`ticketService.ts:24`) — design.md §1, filas 1-2.
 *
 * NO valida los campos opcionales de la hoja de vida: eso es `validarCamposEquipoNuevo`, aparte y
 * tarde a propósito (design.md §1 fila 7, P2/P3 — regla de mutación 1).
 */
export async function exigirEquipoNuevo(db: Queryable, body: Record<string, unknown>): Promise<EquipoAResolver> {
  const en = (body.equipoNuevo ?? {}) as EquipoNuevoBody
  const serial = en.serial ? String(en.serial).trim() : ''
  const modeloId = en.modeloId ? String(en.modeloId) : ''
  const fechaFacturaCompra = en.fechaFacturaCompra ? String(en.fechaFacturaCompra) : ''
  const faltan: string[] = []
  if (!serial) faltan.push('el serial')
  if (!modeloId) faltan.push('el modelo')
  if (!fechaFacturaCompra) faltan.push('la fecha de factura de compra')
  if (faltan.length) throw new HttpError(422, { error: `Faltan datos del equipo nuevo: ${faltan.join(', ')}` })

  const modelo = await getModelo(db, modeloId)
  if (!modelo) throw new HttpError(422, { error: 'Modelo no encontrado' })

  const existente = await getEquipoBySerial(db, serial)
  if (existente) return { equipo: existente, datos: null }

  const provisional: EquipoLite = { id: '', serial, marca: modelo.marca, modelo: modelo.nombre, tipo: modelo.tipo ?? undefined }
  const datos: DatosEquipoNuevo = {
    serial, marca: modelo.marca, modelo: modelo.nombre, tipo: modelo.tipo, modeloId,
    fechaAdquisicion: en.fechaAdquisicion ? String(en.fechaAdquisicion) : null,
    fechaFacturaCompra,
    finGarantia: en.finGarantia ? String(en.finGarantia) : null,
    codigoInterno: en.codigoInterno ? String(en.codigoInterno) : null,
    mantenedorId: en.mantenedorId ? String(en.mantenedorId) : null,
    driveUrl: en.driveUrl ? String(en.driveUrl) : null,
  }
  return { equipo: provisional, datos }
}

/**
 * Validación C de los campos opcionales del equipo nuevo (mantenedor, tres fechas, Drive),
 * reutilizando `camposHojaDeVida` (F1B-02/F1B-14, `routes/equipos.ts:164-211`). Se llama APARTE de
 * `exigirEquipoNuevo` y TARDE a propósito —`ticketService.ts:89`, la última guarda del escalón C,
 * justo antes del `409` de unicidad de la OV (escalón D)— para que la escalera de precedencia
 * (`transitions-st` §3.8) trate el contenido de este bloque igual que el resto del escalón C.
 */
export async function validarCamposEquipoNuevo(db: Queryable, body: Record<string, unknown>): Promise<void> {
  const en = (body.equipoNuevo ?? {}) as EquipoNuevoBody
  const resultado = await camposHojaDeVida(db, en)
  if ('error' in resultado) throw new HttpError(422, { error: resultado.error })
}

/**
 * Crea el ticket y, si el equipo es provisional (`nuevo.equipo.id === ''`), lo crea también en la
 * MISMA transacción (RQ-TC-16) — así no queda un equipo huérfano si el `INSERT` del ticket falla.
 * Si el equipo ya está registrado o reutilizado, es idéntico a hoy: sólo `createTicket`.
 */
export async function crearTicketConEquipo(
  db: Queryable,
  nuevo: EquipoAResolver | null,
  clienteNombre: string | null,
  input: CreateTicketInput,
): Promise<string> {
  if (!nuevo || nuevo.equipo.id) return createTicket(db, input)
  const datos = nuevo.datos!
  return enTransaccion(db, async (q) => {
    const equipoId = await createEquipo(q, { ...datos, clienteNombre, clientId: input.clientId })
    return createTicket(q, { ...input, equipoId }, { transaccionAbierta: true })
  })
}
