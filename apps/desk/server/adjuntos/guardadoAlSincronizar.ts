import type { AppConfig } from '@ambientalia/zoho-sync/config'
import { PAUSA_ENTRE_TICKETS_MS, type ConversacionesDeps } from '@ambientalia/zoho-sync/conversaciones'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { guardarAdjunto, estadoCopia, dirAdjuntos, ErrorDisco, NOMBRE_ADJUNTO, RUTA_ADJUNTO_ZOHO, type FilaAdjunto } from './almacen'
import { logger } from '../util/logger'

/**
 * persistencia-adjuntos (1G-02, RQ-ZS-33, D5). El gancho `trasGuardar` de la pasada periódica de conversaciones: al final del ciclo,
 * con los ids de los tickets cuyas conversaciones se acaban de guardar, trae sus adjuntos PENDIENTES (D3) con la unidad común
 * `guardarAdjunto`, hasta `TOPE_ADJUNTOS_POR_CICLO` peticiones. Sólo lo pasa la App y sólo con el interruptor abierto y un directorio
 * válido; `createSync` se limita a reenviar la función y no lee interruptores (S-1b). El worker y la apertura de un ticket no lo ven.
 * NUNCA rechaza, y no escribe ni nombra datos del cliente en el log (S-12): sólo ids de adjunto y cuentas.
 */
type Opciones = NonNullable<ConversacionesDeps['conversaciones']>
type ZohoFetch = (path: string, init?: RequestInit) => Promise<Response>

/** Peticiones de adjuntos por ciclo (D5): ~6 tickets y ~21 MB por ciclo frente a los 180.000 ms del intervalo. */
export const TOPE_ADJUNTOS_POR_CICLO = 20

interface FilaPendiente extends FilaAdjunto { id: string; size: number | string | null; zoho_href: string | null; storage_path: string | null }

const dormir = (ms: number) => new Promise<void>((res) => setTimeout(res, ms))

/**
 * Devuelve `op` con `trasGuardar` añadido SÓLO si `config.guardarAdjuntosAlSincronizar === true` y el directorio es válido; si no,
 * devuelve `op` tal cual. Los ids con `404` o `fallido:tamano` se recuerdan en el cierre (creado una vez) y no se vuelven a pedir (S-7).
 */
export function conGuardadoDeAdjuntos(
  op: Opciones,
  config: Pick<AppConfig, 'guardarAdjuntosAlSincronizar' | 'adjuntosDir'>,
  deps: { zohoFetch: ZohoFetch; db: Queryable },
): Opciones {
  const dir = config.guardarAdjuntosAlSincronizar === true ? dirAdjuntos(config.adjuntosDir) : null
  if (dir === null) return op
  const descartados = new Set<string>()
  const pausaMs = op.pausaMs ?? PAUSA_ENTRE_TICKETS_MS

  async function trasGuardar(ticketIds: string[]): Promise<void> {
    try {
      if (ticketIds.length === 0) return
      const marcas = ticketIds.map((_, i) => `$${i + 1}`).join(', ')
      const filas = (await deps.db.query(
        `SELECT a.id, a.size, a.zoho_href, a.storage_path FROM attachments a JOIN tickets t ON t.id = a.ticket_id WHERE a.ticket_id IN (${marcas}) ORDER BY t.number, a.id`,
        ticketIds,
      )).rows as FilaPendiente[]
      const cuentas = { guardados: 0, ausentes: 0, fallidos: [] as { adjunto: string; motivo: string }[] }
      let peticiones = 0
      let corte: '429' | 'disco' | null = null
      for (const fila of filas) {
        if (descartados.has(fila.id) || !NOMBRE_ADJUNTO.test(fila.id) || !RUTA_ADJUNTO_ZOHO.test(fila.zoho_href ?? '')) continue
        try {
          if ((await estadoCopia(dir!, fila)) === 'presente') continue
          if (peticiones >= TOPE_ADJUNTOS_POR_CICLO) break
          if (peticiones > 0 && pausaMs > 0) await dormir(pausaMs)
          peticiones++
          const r = await guardarAdjunto({ zohoFetch: deps.zohoFetch, db: deps.db, dir: dir! }, fila)
          if (r.estado === 'guardado') cuentas.guardados++
          else if (r.estado === 'respuesta' && r.status === 429) { corte = '429'; break }
          else if (r.estado === 'respuesta' && r.status === 404) { descartados.add(fila.id); cuentas.ausentes++ }
          else if (r.estado === 'respuesta') cuentas.fallidos.push({ adjunto: fila.id, motivo: 'http' })
          else if (r.estado === 'fallido') {
            if (r.motivo === 'tamano') descartados.add(fila.id)
            cuentas.fallidos.push({ adjunto: fila.id, motivo: r.motivo })
          }
        } catch (e) {
          if (!(e instanceof ErrorDisco)) throw e
          corte = 'disco'
          break
        }
      }
      if (peticiones > 0) logger.info({ tickets: ticketIds.length, peticiones, ...cuentas, corte }, 'adjuntos guardados al sincronizar')
    } catch (e) {
      logger.error({ error: e instanceof Error ? e.message : String(e) }, 'el guardado de adjuntos al sincronizar falló')
    }
  }

  return { ...op, trasGuardar }
}
