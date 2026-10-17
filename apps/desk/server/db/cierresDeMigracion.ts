import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { ID_TRANSICION_MIGRACION, cierrePuestoPorMigracion } from '@ambientalia/shared'

/**
 * Por ticket, el `closed_time` que puso la migración (F1F-01, `fecha-migracion-fuera-de-cifras`, RQ-TC-69), leído del `values`
 * de su marcador. Una consulta aparte y no un JOIN: la consumen Análisis, la ficha de cliente y, con su propia lectura del
 * paso, el informe de contrato; un JOIN repetido en cada uno serían tres implementaciones de la misma noción (molde de H5).
 */
export async function cierresPuestosPorMigracion(db: Queryable): Promise<Map<string, string>> {
  const r = await db.query('SELECT ticket_id, values FROM ticket_transitions WHERE transition_id = $1', [ID_TRANSICION_MIGRACION])
  const puestos = new Map<string, string>()
  for (const f of r.rows as Array<{ ticket_id: string; values: unknown }>) {
    const v = typeof f.values === 'string' ? JSON.parse(f.values) : f.values
    const cierre = cierrePuestoPorMigracion(v)
    if (cierre !== null) puestos.set(String(f.ticket_id), cierre)
  }
  return puestos
}
