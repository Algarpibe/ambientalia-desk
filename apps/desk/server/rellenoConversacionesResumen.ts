import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { EstadoRelleno } from './rellenoConversaciones'
import { logger } from './util/logger'

/**
 * calificaciones-cuadre-conversaciones (RQ-ZS-49, D-5). El resumen de cada pasada del relleno se guarda en
 * `public.relleno_conversaciones_pasadas`: una fila al lanzar, completada al terminar, de modo que un redespliegue a mitad
 * deje rastro. NINGUNA operación rechaza: cada una lleva su `catch` y avisa con UNA línea de `logger.error`, de modo que un fallo de
 * la base ni corta la pasada ni deja un rechazo sin manejar. Sólo números de ticket y recuentos: nunca datos de cliente (S-10).
 * Importa `EstadoRelleno` sólo como tipo, así que no hay ciclo en ejecución.
 */
const TABLA = 'public.relleno_conversaciones_pasadas'

/** El límite de S-6 (D-8): las lecturas de contacto y cuenta van por el `Sync` compartido, no por `contado`. */
export const LIMITE_PETICIONES = 'no cuenta las lecturas de contacto y cuenta del Sync compartido: a lo sumo 3 por ticket recorrido, menos por su caché'

export interface PasadaGuardada { id: number; lanzadaAt: string; terminadaAt: string | null; resumen: Record<string, unknown> }
export interface GuardaResumen {   // NINGUNO rechaza: cada uno lleva su catch
  abrir(e: EstadoRelleno): Promise<number | null>
  cerrar(id: number | null, e: EstadoRelleno): Promise<void>
  ultima(): Promise<PasadaGuardada | null>
}

const resumenDe = (e: EstadoRelleno): string => JSON.stringify({ ...structuredClone(e), limitePeticiones: LIMITE_PETICIONES })
const iso = (v: unknown): string => (v instanceof Date ? v : new Date(String(v))).toISOString()
const comoObjeto = (v: unknown): Record<string, unknown> => (typeof v === 'string' ? JSON.parse(v) : v) as Record<string, unknown>

export function guardaEnBase(db: Queryable, avisar: (linea: string) => void = (linea) => logger.error(linea)): GuardaResumen {
  /** La escritura no depende del log ni el log de ella: el aviso va en su PROPIO `try`. */
  const fallo = (operacion: string, e: unknown) => {
    try {
      avisar(`relleno-completo-conversaciones: no se pudo ${operacion} el resumen guardado (${e instanceof Error ? e.message : String(e)})`)
    } catch { /* el log no puede tumbar la pasada */ }
  }
  return {
    async abrir(e) {
      try {
        const r = await db.query(`INSERT INTO ${TABLA} (resumen) VALUES ($1) RETURNING id`, [resumenDe(e)])
        return Number(r.rows[0].id)
      } catch (err) { fallo('abrir', err); return null }
    },
    async cerrar(id, e) {
      try {
        if (id === null) await db.query(`INSERT INTO ${TABLA} (terminada_at, resumen) VALUES (now(), $1)`, [resumenDe(e)])
        else await db.query(`UPDATE ${TABLA} SET terminada_at = now(), resumen = $2 WHERE id = $1`, [id, resumenDe(e)])
      } catch (err) { fallo('cerrar', err) }
    },
    async ultima() {
      try {
        const r = await db.query(`SELECT id, lanzada_at, terminada_at, resumen FROM ${TABLA} ORDER BY id DESC LIMIT 1`)
        const f = r.rows[0]
        if (!f) return null
        return { id: Number(f.id), lanzadaAt: iso(f.lanzada_at), terminadaAt: f.terminada_at == null ? null : iso(f.terminada_at), resumen: comoObjeto(f.resumen) }
      } catch (err) { fallo('leer', err); return null }
    },
  }
}

/**
 * Con `limite === 0` sólo corre (no deja fila). Si no, lanza `abrir` SIN esperarlo —la fila nace al lanzar y la primera petición a
 * Zoho no se retrasa—, corre la pasada y cierra con la foto FINAL del estado, que llega por referencia.
 */
export async function conResumenGuardado({ guardar, estado, correr }: { guardar: GuardaResumen; estado: EstadoRelleno; correr: () => Promise<void> }): Promise<void> {
  if (estado.limite === 0) return correr()
  const abierta = guardar.abrir(estado).catch(() => null)
  await correr()
  try { await guardar.cerrar(await abierta, estado) } catch { /* ninguna guarda debe rechazar; si lo hiciera, la pasada no cuenta con ello */ }
}
