import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { APP_TICKET_NUMBER_BASE } from '@ambientalia/zoho-sync/db/migrate'
import {
  ACTOR_MIGRACION, ID_TRANSICION_MIGRACION, NOMBRE_TRANSICION_MIGRACION, esperaRemisionDeEntrada, motivoSinRemisionVigente,
  planDeTicket, resumenDeMigracion, type PlanTicket, type ResumenMigracion,
} from '@ambientalia/shared'
import { enTransaccion } from './transaccion'
import { vigenciaDeRemisiones } from './remisiones'

/**
 * migracion-tickets-abiertos (F1F-01), `zoho-sync` RQ-ZS-17: el ejecutor de la migración de los tickets abiertos de Zoho.
 *
 * Lee los abiertos, clasifica con el núcleo de `@ambientalia/shared` y arma el informe. Sólo con `aplicar === true` y SIN
 * negativa escribe, dentro de UNA transacción (D-1): por ticket, el marcador en `ticket_transitions` y después el `UPDATE`
 * con `WHERE managed_by_app = false RETURNING id` (D-3). En seco no abre transacción (D-2). Idempotente: lo ya gobernado
 * no se vuelve a elegir. Nunca se ejecuta contra una base real desde las pruebas: el arnés es pg-mem.
 */
export interface InformeMigracion extends Omit<ResumenMigracion, 'masAltoAMarcar'> {
  corte: string
  aplicar: boolean
  aplicado: boolean
  negativa: { motivo: 'estados-sin-equivalencia'; estados: string[] } | null
  sinRemisionVigente: { numero: number; estado: string }[]
  numeracion: { masAltoAMarcar: number | null; base: number; arrastra: boolean }
  avisos: string[]
}

const iso = (v: unknown): string | null => (v == null ? null : new Date(v as string | Date).toISOString())

/** «Abierto» (S-4): el mismo predicado que el tablero (`packages/zoho-sync/src/db/repo.ts:151`). Lectura única, sin `NOT EXISTS` ni `TRIM`. */
async function leerPlanes(q: Queryable, corte: Date): Promise<PlanTicket[]> {
  const r = await q.query(
    "SELECT id, number, status, status_type, classification, managed_by_app, created_time FROM tickets WHERE (status_type <> 'Closed' OR status_type IS NULL) ORDER BY number",
  )
  return (r.rows as Array<Record<string, unknown>>).map((f) => planDeTicket({
    id: String(f.id), number: Number(f.number), status: String(f.status), statusType: (f.status_type as string | null) ?? null,
    classification: (f.classification as string | null) ?? null, managedByApp: f.managed_by_app === true, createdTime: iso(f.created_time),
  }, corte))
}

async function prepararInforme(q: Queryable, corte: Date, aplicar: boolean): Promise<{ informe: InformeMigracion; aMigrar: PlanTicket[] }> {
  const planes = await leerPlanes(q, corte)
  const { masAltoAMarcar, ...resumen } = resumenDeMigracion(planes)
  const aMigrar = planes.filter((p) => p.accion === 'migrar')
  // La vigencia es de la misma pareja que la guarda de «Habilitar Servicio»: no hay segunda implementación (RQ-TS-33).
  const sinRemisionVigente: InformeMigracion['sinRemisionVigente'] = []
  for (const p of aMigrar) {
    if (p.equivalencia && esperaRemisionDeEntrada(p.equivalencia.destino) && motivoSinRemisionVigente(await vigenciaDeRemisiones(q, p.ticket.id)) !== null) {
      sinRemisionVigente.push({ numero: p.ticket.number, estado: p.equivalencia.destino })
    }
  }
  const arrastra = masAltoAMarcar !== null && masAltoAMarcar >= APP_TICKET_NUMBER_BASE
  const avisos = ['Antes de aplicar: copia de la base y sincronización completa reciente (S-7).']
  if (arrastra) avisos.push(`La numeración propia saltaría por encima de ${masAltoAMarcar}: no aplicar y consultar a Gerencia (el salto no tiene vuelta atrás).`)
  const informe: InformeMigracion = {
    corte: corte.toISOString(), aplicar, aplicado: false,
    negativa: resumen.sinEquivalencia.length > 0 ? { motivo: 'estados-sin-equivalencia', estados: resumen.sinEquivalencia.map((s) => s.estado) } : null,
    ...resumen, sinRemisionVigente, numeracion: { masAltoAMarcar, base: APP_TICKET_NUMBER_BASE, arrastra }, avisos,
  }
  return { informe, aMigrar }
}

export async function migrarTicketsAbiertos(
  db: Queryable, opts: { corte: Date; aplicar?: boolean; actor: string },
): Promise<InformeMigracion> {
  const aplicar = opts.aplicar === true
  if (!aplicar) return (await prepararInforme(db, opts.corte, false)).informe
  return enTransaccion(db, async (q) => {
    const { informe, aMigrar } = await prepararInforme(q, opts.corte, true)
    if (informe.negativa) return informe // la negativa va ANTES del primer INSERT (diseño §7, guarda 4)
    for (const { ticket: t, equivalencia: eq } of aMigrar) {
      if (!eq) continue
      const valores = {
        estado_previo: t.status, estado_destino: eq.destino, status_type_previo: t.statusType, managed_by_app_previo: t.managedByApp,
        regla: eq.regla, corte: opts.corte.toISOString(), ejecutado_por: opts.actor,
      }
      // D-6: en identidad `to_status` va NULL (un valor reiniciaría el reloj de `entradasActuales`); el destino va en `values`.
      await q.query(
        `INSERT INTO ticket_transitions (ticket_id, transition_id, transition_name, from_status, to_status, area, performed_by, values)
         VALUES ($1,$2,$3,$4,$5,'Servicio Técnico',$6,$7)`,
        [t.id, ID_TRANSICION_MIGRACION, NOMBRE_TRANSICION_MIGRACION, t.status, eq.destino === t.status ? null : eq.destino, ACTOR_MIGRACION, JSON.stringify(valores)],
      )
      // D-4 y D-5: `source` y `modified_time` NO se tocan; `updated_at` sí. D-10: `status_type` sólo si la regla lo cambia.
      const r = await q.query(
        `UPDATE tickets SET status = $2, status_type = COALESCE($3::text, status_type),
                managed_by_app = true, updated_at = now()
          WHERE id = $1 AND managed_by_app = false RETURNING id`,
        [t.id, eq.destino, eq.statusTypeDestino],
      )
      if (r.rows.length === 0) throw new Error(`El ticket ${t.number} pasó a estar gobernado entre la lectura y la escritura: se deshace la migración entera`)
    }
    informe.aplicado = true
    return informe
  })
}
