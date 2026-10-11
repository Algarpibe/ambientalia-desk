import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { fechaSolo } from '@ambientalia/zoho-sync/books/repo'
import { estadoGarantia, type EstadoGarantia } from '@ambientalia/shared'
import { logger } from '../util/logger'

/**
 * La marca de garantía de los tickets (F1B-18; `tickets-core` RQ-TC-59, `vistas-tablero` RQ-VT-14).
 *
 * La decide el SERVIDOR (regla invariable 13) con la fórmula de `shared` (`estadoGarantia`): el día de creación del ticket
 * contra el fin de garantía de la hoja de vida de su equipo. UNA lectura de `equipos` sea cual sea el número de tickets
 * (`IN ($1..$n)`; pg-mem no tipa los arrays enlazados), y ninguna si ningún ticket tiene equipo. El fin se normaliza con
 * `fechaSolo` (getters locales: pg construye el `date` como medianoche local). Un ticket sin equipo, con el equipo
 * ausente o con la creación ilegible no entra en el mapa. Es una vista: no escribe nada.
 *
 * NUNCA lanza: ante un error deja un `warn` y devuelve el mapa vacío, porque la marca no puede tumbar el tablero.
 */
export async function marcasDeGarantia(
  db: Queryable,
  filas: ReadonlyArray<{ id: unknown; equipo_id?: unknown; created_time?: unknown }>,
): Promise<Map<string, EstadoGarantia>> {
  const marcas = new Map<string, EstadoGarantia>()
  try {
    const equipos = [...new Set(filas.map((f) => f.equipo_id).filter((e): e is string => typeof e === 'string' && e !== ''))]
    if (equipos.length === 0) return marcas
    const m = equipos.map((_, i) => `$${i + 1}`).join(', ')
    const r = await db.query(`SELECT id, fin_garantia FROM equipos WHERE id IN (${m})`, equipos)
    const fin = new Map((r.rows as Array<{ id: string; fin_garantia: unknown }>).map((x) => [String(x.id), fechaSolo(x.fin_garantia) ?? null]))
    for (const f of filas) {
      const equipo = typeof f.equipo_id === 'string' ? f.equipo_id : ''
      if (!fin.has(equipo)) continue
      const estado = estadoGarantia(f.created_time, fin.get(equipo))
      if (estado !== null) marcas.set(String(f.id), estado)
    }
    return marcas
  } catch (e) {
    logger.warn({ err: e }, 'no se pudo leer la marca de garantía; el tablero sale sin ella')
    return new Map()
  }
}
