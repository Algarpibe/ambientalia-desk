import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { DiaCivil } from '@ambientalia/shared'

const filas = (rows: unknown[]): Array<Record<string, unknown>> => rows as Array<Record<string, unknown>>

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * `fecha` como `DiaCivil` ('YYYY-MM-DD'). *Hipótesis* de `design.md` confirmada FALSA en pg-mem:
 * `fecha::text` no castea (`cannot cast type date to text`), así que se lee sin castear y se
 * normaliza aquí. `node-postgres` (producción) da un `Date` a medianoche **UTC** para una columna
 * `date`; pg-mem da directamente el literal insertado como `string`. Los getters son UTC a propósito
 * (nunca locales): el servidor corre en UTC (riesgo anotado en `proposal.md`), y un getter local
 * desplazaría el día en cualquier máquina con zona horaria distinta.
 */
function comoDiaCivil(valor: unknown): DiaCivil {
  if (valor instanceof Date) {
    return `${valor.getUTCFullYear()}-${pad(valor.getUTCMonth() + 1)}-${pad(valor.getUTCDate())}`
  }
  return String(valor).slice(0, 10)
}

/**
 * Los cierres de empresa dados de alta directamente en `public.calendario_cierres` (RQ-CL-06). Sin
 * ruta HTTP: el alta es un `INSERT` directo a cargo de una persona (proposal, pregunta 1; D6, YAGNI —
 * ningún consumidor existe en esta tanda). El resultado va ORDENADO para que quien construya el
 * `Set<DiaCivil>` de `horasHabilesEntre`/`diasHabilesEntre` no tenga que ordenarlo de nuevo.
 */
export async function listarCierres(db: Queryable): Promise<DiaCivil[]> {
  const r = await db.query('SELECT fecha FROM calendario_cierres ORDER BY fecha')
  return filas(r.rows).map((x) => comoDiaCivil(x.fecha))
}
