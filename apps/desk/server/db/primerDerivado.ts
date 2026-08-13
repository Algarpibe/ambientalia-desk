import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { CLAVE_DERIVACION } from '@ambientalia/shared'
import { json } from './ticketFuentes'

/**
 * A quién se derivó el ticket la PRIMERA vez: quien lo tomó.
 *
 * Lo usa «Aprobación», que devuelve el trabajo al taller cuando el cliente acepta. Para entonces el
 * ticket viene derivado a Comercial —quien acaba de aprobar—, y ahí no hay un puesto fijo al que
 * mandarlo: hay que devolvérselo a quien tomó ESE ticket.
 *
 * No hay tabla de derivaciones: `ticket_transitions.values` guarda la cadena etapa a etapa. Se recorre
 * de la más vieja a la más nueva y se para en la primera que derive a alguien — saltándose las que no
 * lo hicieron, que son varias: el ticket nace y pasa por «Habilitar Servicio» sin responsable, así que
 * mirar solo la fila más antigua daría `null` en todos los tickets del mundo real.
 *
 * Una cadena vacía es «se quitó la derivación», no una persona: contarla devolvería un id que el
 * desplegable no encuentra, y confirmar la etapa borraría la derivación sin que nadie lo pidiera.
 *
 * El filtro se hace en JS y no con `values->>'derivado_a' IS NOT NULL` en SQL porque pg-mem —el motor
 * de los tests— no resuelve los operadores de jsonb; un ticket tiene unas pocas transiciones.
 */
export async function primerDerivado(db: Queryable, ticketId: string): Promise<string | null> {
  const r = await db.query(
    'SELECT values FROM ticket_transitions WHERE ticket_id = $1 ORDER BY performed_at ASC, id ASC',
    [ticketId],
  )
  for (const fila of r.rows as Array<Record<string, unknown>>) {
    const id = json(fila.values)[CLAVE_DERIVACION]
    if (typeof id === 'string' && id.trim() !== '') return id
  }
  return null
}
