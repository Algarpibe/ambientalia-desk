import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { fechaSolo } from '@ambientalia/zoho-sync/books/repo'
import type { DiaCivil, GasPatronLeido } from '@ambientalia/shared'

/**
 * Lectura de `public.gases_patron` para la guarda de `liberacion` (F1A-03, `gases-patron` RQ-GP-04, RQ-GP-05).
 * Sólo LEE: no hay ruta ni función de escritura (alta directa del Director Técnico, sin pantalla). Consulta sin
 * calificar, como `db/contratos.ts`: la app conecta con `search_path=desk,public`.
 *
 * UNA consulta por ejecución —equipo y gases juntos— y nunca N+1. La comparación de compuestos NO se hace en SQL:
 * `SO2` frente a `SO₂` por texto fallaría hacia abierto sin avisar (molde H5), así que se devuelven los dos lados
 * crudos y los compara `shared`. Sin equipo o equipo borrado, cero filas y `compuestoEquipo: null`.
 */
export async function leerContextoGas(db: Queryable, equipoId: string | null | undefined): Promise<{ compuestoEquipo: string | null; gases: GasPatronLeido[] }> {
  if (!equipoId) return { compuestoEquipo: null, gases: [] }
  const r = await db.query(
    'SELECT e.compuesto AS compuesto_equipo, g.compuesto, g.disponible, g.vence FROM equipos e LEFT JOIN gases_patron g ON g.compuesto IS NOT NULL WHERE e.id = $1',
    [equipoId],
  )
  if (!r.rows.length) return { compuestoEquipo: null, gases: [] }
  const gases: GasPatronLeido[] = r.rows
    .filter((f) => f.compuesto !== null && f.compuesto !== undefined)
    // pg entrega `date` como medianoche LOCAL: `fechaSolo` evita que el día ruede (D-11, `books/repo.ts:89-92`).
    .map((f) => ({ compuesto: f.compuesto as string, disponible: f.disponible as boolean | null, vence: (fechaSolo(f.vence) ?? null) as DiaCivil | null }))
  return { compuestoEquipo: r.rows[0].compuesto_equipo ?? null, gases }
}
