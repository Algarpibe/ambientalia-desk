import type { Queryable } from './db/migrate'
import { upsertConversation, upsertAttachment } from './db/repo'
import { conversationRowFromZoho, attachmentRowsFrom } from './db/mappers'

/**
 * sync-conversaciones-zoho (1G-01, RQ-ZS-25 y RQ-ZS-26). La lectura paginada de las conversaciones de un ticket y el
 * reflejo de lo que Zoho ya no devuelve, en un módulo propio para no insertar ni borrar líneas en `sync.ts` ni en
 * `repo.ts` (citados por número en casi toda su longitud). NO importa nada de `sync.ts`: repite los dos ayudantes de
 * lectura de dos líneas para no abrir un ciclo de importación.
 */
type ZohoRecord = Record<string, unknown>
type ZohoFetch = (path: string, init?: RequestInit) => Promise<Response>
async function readData(res: Response): Promise<ZohoRecord> { const t = await res.text(); return t ? JSON.parse(t) : {} }
function dataArray(payload: ZohoRecord): ZohoRecord[] {
  return Array.isArray(payload.data) ? (payload.data as ZohoRecord[]) : []
}

/** Zoho fija para este recurso un `limit` de 1 a 200 y 100 por omisión; se pide 100 de manera explícita (S-9). */
export const LIMITE_CONVERSACIONES = 100
/** Tope de páginas por ticket: 2.000 conversaciones. Al alcanzarlo la lista se da por incompleta (S-9). */
export const TOPE_PAGINAS_CONVERSACIONES = 20
/** Espera ante un 429 y número de repeticiones de la misma página en la pasada periódica (S-5). */
export const PAUSA_429_MS = 2000
export const REINTENTOS_429 = 3
/** Pausa entre ticket y ticket en la pasada periódica (S-6). */
export const PAUSA_ENTRE_TICKETS_MS = 150

/**
 * La opción que sólo pasa la App (S-1b): `createSync` NO lee los interruptores de `config`, así que el worker, que lo
 * construye sin ella, no pide conversaciones aunque las variables valgan `'true'` en su entorno. `pausaMs` y
 * `pausa429Ms` existen para que las pruebas pasen 0; la App no los pasa.
 */
export interface ConversacionesDeps {
  conversaciones?: { periodica?: boolean; marcarAusentes?: boolean; pausaMs?: number; pausa429Ms?: number }
}

export interface ListaConversaciones { items: ZohoRecord[]; error: string | null; por429: boolean }

/** Un recuento de Zoho vale sólo si ESTÁ y es un entero finito >= 0, número o texto numérico: nunca `Number(undefined)`. */
function recuento(v: unknown): number | null {
  if (typeof v === 'number') return Number.isInteger(v) && v >= 0 ? v : null
  if (typeof v === 'string' && /^\d+$/.test(v.trim())) return Number(v.trim())
  return null
}

/**
 * Cuántas conversaciones cuenta Zoho para el ticket: `commentCount` + `threadCount` (S-3). Acepta el objeto o el `jsonb`
 * como texto, que es como lo entrega pg-mem. Si falta uno de los dos es `null`, que NO es cero: «no sé» no autoriza a marcar.
 */
export function esperadoDeZoho(raw: unknown): number | null {
  let obj = raw
  if (typeof raw === 'string') { try { obj = JSON.parse(raw) } catch { return null } }
  if (typeof obj !== 'object' || obj === null) return null
  const { commentCount, threadCount } = obj as ZohoRecord
  const c = recuento(commentCount); const t = recuento(threadCount)
  return c === null || t === null ? null : c + t
}

const dormir = (ms: number) => (ms > 0 ? new Promise<void>((r) => setTimeout(r, ms)) : Promise.resolve())

/**
 * Lee la lista ENTERA de conversaciones de un ticket, por páginas de 100 desde `from=0`, hasta la primera página con menos
 * de 100. NUNCA lanza: devuelve lo recibido hasta el fallo y el error aparte, para que quien llama guarde lo recibido y
 * decida (S-10). Por respuesta, el orden de las guardas es deliberado: primero el 429 (espera y repite la MISMA página
 * mientras queden reintentos) y después `!res.ok`, que es donde caería un 429 si fuera antes.
 */
export async function leerConversaciones(
  zohoFetch: ZohoFetch,
  id: string,
  { reintentos429 = 0, pausa429Ms = PAUSA_429_MS }: { reintentos429?: number; pausa429Ms?: number } = {},
): Promise<ListaConversaciones> {
  const items: ZohoRecord[] = []
  const falla = (error: string, por429 = false): ListaConversaciones => ({ items, error, por429 })
  try {
    let from = 0; let pagina = 1; let repetidas = 0
    for (;;) {
      const res = await zohoFetch(`/tickets/${id}/conversations?from=${from}&limit=${LIMITE_CONVERSACIONES}`)
      if (res.status === 429) {
        if (repetidas++ < reintentos429) { await dormir(pausa429Ms); continue }
        return falla(`Zoho /tickets/${id}/conversations ${res.status}`, true)
      }
      if (!res.ok) return falla(`Zoho /tickets/${id}/conversations ${res.status}`)
      repetidas = 0
      const pag = dataArray(await readData(res))
      items.push(...pag)
      if (pag.length < LIMITE_CONVERSACIONES) return { items, error: null, por429: false }
      if (pagina === TOPE_PAGINAS_CONVERSACIONES) return falla(`tope de ${TOPE_PAGINAS_CONVERSACIONES} páginas`)
      pagina++; from += LIMITE_CONVERSACIONES
    }
  } catch (e) {
    return falla(`Zoho /tickets/${id}/conversations: ${e instanceof Error ? e.message : String(e)}`)
  }
}

/**
 * El instante de la base, el mismo reloj que llena `conversations.created_at` (`schema.sql:48`). Se toma ANTES de leer la
 * lista: lo guardado por otra vía mientras se leía lleva un `created_at` posterior y no se marca (S-15, posición fijada).
 */
export async function instanteBase(db: Queryable): Promise<Date> {
  const r = await db.query('SELECT now() AS t')
  return new Date(r.rows[0].t)
}

/**
 * Guarda lo recibido (siempre, aunque la lista traiga error) y, con `marcar` y la lista COMPLETA, marca las filas de Zoho
 * del ticket que ya no vinieron. Completa = sin error, con recuento de Zoho, e ids ÚNICOS recibidos igual a ese recuento.
 * Marca, no borra: ninguna fila de `conversations` ni de `attachments` se elimina nunca (RQ-ZS-26).
 */
export async function guardarYReflejar(
  db: Queryable,
  ticketId: string,
  lista: ListaConversaciones,
  { esperado, marcar, inicio }: { esperado: number | null; marcar: boolean; inicio: Date },
): Promise<{ marcadas: string[]; completa: boolean }> {
  for (const c of lista.items) {
    await upsertConversation(db, conversationRowFromZoho(c, ticketId))
    for (const a of attachmentRowsFrom(c, ticketId)) await upsertAttachment(db, a)
  }
  const recibidos = new Set(lista.items.map((c) => String(c.id)))
  const completa = lista.error === null && esperado !== null && recibidos.size === esperado
  if (!marcar) return { marcadas: [], completa }
  if (!completa) {
    console.error(
      `conversaciones: ticket ${ticketId} sin marcar ausentes, recibidos ${recibidos.size} únicos, ${esperado === null ? 'sin recuento' : `Zoho cuenta ${esperado}`}${lista.error ? `, error: ${lista.error}` : ''}`,
    )
    return { marcadas: [], completa }
  }
  const guardadas = await db.query(
    "SELECT id FROM conversations WHERE ticket_id=$1 AND source='zoho' AND ausente_en_zoho_at IS NULL AND created_at < $2 ORDER BY id",
    [ticketId, inicio],
  )
  const marcadas: string[] = []
  // Una a una: pg-mem no tipa los arrays enlazados (`= ANY($1)`), y son pocas.
  for (const { id } of guardadas.rows as { id: string }[]) {
    if (recibidos.has(id)) continue
    await db.query('UPDATE conversations SET ausente_en_zoho_at=now() WHERE id=$1', [id])
    marcadas.push(id)
  }
  return { marcadas, completa }
}

/**
 * La pasada periódica (RQ-ZS-27, D2): la que `syncRecent` ejecuta tras leer los tickets modificados. Cada llamada a esta
 * función crea SU memoria `id → modifiedTime` (S-7), así que vive lo que vive el `createSync` que la creó. Un ticket cuyo
 * `modifiedTime` ya se pidió completo en este proceso no se vuelve a pedir; el que falló no se recuerda, para reintentarlo.
 * NUNCA rechaza: cada ticket va en su `try`, y un 429 que agota los reintentos corta la pasada ENTERA (S-5) nombrando los
 * ids que se quedan sin pedir. Los recuentos son los del detalle que se acaba de leer (`t`), no los de `tickets.raw` (S-4).
 */
export function crearPasadaConversaciones({ zohoFetch, db, marcar, pausaMs = PAUSA_ENTRE_TICKETS_MS, pausa429Ms = PAUSA_429_MS }: {
  zohoFetch: ZohoFetch; db: Queryable; marcar: boolean; pausaMs?: number; pausa429Ms?: number
}): (tickets: ZohoRecord[]) => Promise<void> {
  const pedidos = new Map<string, string>()
  return async (tickets) => {
    let pedidoAlguno = false
    for (const [i, t] of tickets.entries()) {
      const id = String(t.id)
      if (pedidos.has(id) && pedidos.get(id) === String(t.modifiedTime)) continue
      try {
        if (pedidoAlguno) await dormir(pausaMs)
        pedidoAlguno = true
        const inicio = await instanteBase(db)
        const lista = await leerConversaciones(zohoFetch, id, { reintentos429: REINTENTOS_429, pausa429Ms })
        await guardarYReflejar(db, id, lista, { esperado: esperadoDeZoho(t), marcar, inicio })
        if (lista.por429) {
          console.error(`conversaciones: pasada cortada por 429 en el ticket ${id}; sin pedir: ${tickets.slice(i).map((x) => String(x.id)).join(', ')}`)
          return
        }
        if (lista.error) console.error(`conversaciones: ticket ${id} con error: ${lista.error}`)
        else if (typeof t.modifiedTime === 'string' && t.modifiedTime !== '') pedidos.set(id, t.modifiedTime)
      } catch (e) {
        console.error(`conversaciones: ticket ${id} falló al guardar:`, e instanceof Error ? e.message : String(e))
      }
    }
  }
}
