import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { creadasDelLote, saldoPorLote } from '@ambientalia/zoho-sync/books/subOV'
import {
  diaEnZona, diasEntre, estadoContrato, estadoSubOV, porcentaje, trimestresDelContrato, INFORME_NO_DISPONIBLE,
  type Contrato, type DiaCivil, type InformeContrato, type ServicioDelInforme, type SubOVDelInforme,
} from '@ambientalia/shared'

/**
 * Informe trimestral de un contrato (registro-contrato, lote 4; `zoho-sync` RQ-ZS-15; `design.md` §6).
 *
 * Todo se LEE hoy, nada se graba: una asociación liberada devuelve la subOV a libre y un ticket reabierto deja de
 * estar ejecutado, sin ninguna escritura. Ejecutada = ticket de la asociación vigente HOY en `Finalizado` (S-6),
 * fechada por su PRIMERA llegada a ese estado en `ticket_transitions` (S-15). Los trimestres salen de
 * `trimestresDelContrato` (lote 1), no se recalculan aquí. Agregación en TS, no `GROUP BY` (pg-mem).
 */
const VIGENTES = 'SELECT ticket_id FROM ov_asociaciones WHERE liberada_at IS NULL'

const HUECOS = [
  `informe: el documento del servicio no está en los datos (sólo existe fecha_revision_informe); la columna dice «${INFORME_NO_DISPONIBLE}»`,
  'sinFecha: ejecutadas sin transición registrada a Finalizado (p. ej. venidas de Zoho); cuentan hoy, no en los acumulados',
]

interface TicketFila { id: string; number: number | null; status: string; equipo: string | null; serial: string | null; tipo_servicio: string | null }

export async function informeContrato(db: Queryable, contrato: Contrato, hoy: DiaCivil): Promise<InformeContrato> {
  const creadas = await creadasDelLote(db, contrato.lote)

  // Asociaciones vigentes, casadas por número o por id como `saldoPorLote` (`subOV.ts:41-44`).
  const asoc = (await db.query('SELECT numero, salesorder_id, ticket_id FROM ov_asociaciones WHERE liberada_at IS NULL')).rows as Array<{ numero: string; salesorder_id: string | null; ticket_id: string }>
  const tickets = new Map(((await db.query(
    `SELECT id, number, status, equipo, serial, tipo_servicio FROM tickets WHERE id IN (${VIGENTES})`)).rows as TicketFila[]).map((t) => [String(t.id), t]))
  const primera = new Map<string, Date>()
  for (const f of (await db.query(
    `SELECT ticket_id, performed_at FROM ticket_transitions WHERE to_status = 'Finalizado' AND ticket_id IN (${VIGENTES})`)).rows as Array<{ ticket_id: string; performed_at: unknown }>) {
    const at = f.performed_at instanceof Date ? f.performed_at : new Date(String(f.performed_at))
    const antes = primera.get(String(f.ticket_id))
    if (!antes || at.getTime() < antes.getTime()) primera.set(String(f.ticket_id), at)
  }

  const subOV: SubOVDelInforme[] = []
  const servicios: ServicioDelInforme[] = []
  for (const so of creadas) {
    const a = asoc.find((x) => x.numero === so.number || (x.salesorder_id != null && String(x.salesorder_id) === so.id))
    const t = a ? tickets.get(String(a.ticket_id)) : undefined
    const estado = estadoSubOV(t ? t.status : null)
    const llegada = estado === 'ejecutada' && t ? primera.get(String(t.id)) : undefined
    const fechaEjecucion = llegada ? diaEnZona(llegada) : null
    subOV.push({ numero: so.number, salesorderId: so.id, estado, ticketId: t ? String(t.id) : null, ticketNumber: t?.number ?? null, fechaEjecucion })
    if (t && fechaEjecucion) {
      servicios.push({ subOV: so.number, ticketId: String(t.id), ticketNumber: t.number ?? null, equipo: t.equipo ?? null, serial: t.serial ?? null, tipoServicio: t.tipo_servicio ?? null, fecha: fechaEjecucion, informe: INFORME_NO_DISPONIBLE })
    }
  }

  const ejecutadas = subOV.filter((s) => s.estado === 'ejecutada').length
  const trimestres = trimestresDelContrato(contrato.fechaInicio, contrato.fechaFin)
    .filter((t) => t.inicio <= hoy)
    .map((t) => {
      const ejecutadasAlCierre = servicios.filter((s) => s.fecha <= t.fin).length
      return {
        ...t, ejecutadasAlCierre, porcentajeEjecutado: porcentaje(ejecutadasAlCierre, creadas.length),
        servicios: servicios.filter((s) => t.inicio <= s.fecha && s.fecha <= t.fin),
      }
    })

  return {
    contrato, estado: estadoContrato(contrato, hoy), hoy,
    creadas: creadas.length, ejecutadas,
    enCurso: subOV.filter((s) => s.estado === 'en_curso').length,
    libres: subOV.filter((s) => s.estado === 'libre').length,
    porcentajeEjecutado: porcentaje(ejecutadas, creadas.length),
    consumido: (await saldoPorLote(db, contrato.lote)).consumido,
    diasHastaFin: diasEntre(hoy, contrato.fechaFin),
    subOV, trimestres,
    sinFecha: subOV.filter((s) => s.estado === 'ejecutada' && s.fechaEjecucion == null),
    huecos: HUECOS,
  }
}
