import type { AppConfig } from './config'
import type { Queryable } from './db/migrate'
import { upsertTicket, upsertConversation, upsertAttachment, upsertAccount, upsertContact, upsertAgent } from './db/repo'
import { upsertActivity } from './db/activities'
import { upsertHistoryEvent } from './db/history'
import { PREFIJO_TICKET_APP } from '@ambientalia/shared'
import { ticketRowFromZoho, conversationRowFromZoho, attachmentRowsFrom, accountRowFromZoho, contactRowFromZoho, agentRowFromZoho, activityRowFromZoho } from './db/mappers'

interface Deps {
  zohoFetch: (path: string, init?: RequestInit) => Promise<Response>
  db: Queryable
  config: AppConfig
}
export interface Sync {
  backfillTickets(): Promise<number>
  backfillArchivedTickets(): Promise<number>
  syncRecent(): Promise<number>
  syncTicket(id: string): Promise<void>
  syncConversations(id: string): Promise<void>
  syncTicketHistory(id: string): Promise<void>
  backfillTicketHistory(opts?: BackfillHistoriaOpts): Promise<ResultadoBackfillHistoria>
  syncActivities(): Promise<number>
  syncContacts(): Promise<number>
}
const PAGE_SIZE = 100

export interface BackfillHistoriaOpts {
  /** Cuántos tickets como mucho en esta pasada. Sin él, todos los que falten. */
  limite?: number
  /** Espera entre tickets. `zohoFetch` no reintenta ante un 429, así que la cautela va aquí. */
  pausaMs?: number
}
export interface ResultadoBackfillHistoria {
  intentados: number
  poblados: number
  fallidos: number
  /** Cuántos siguen sin historia después de esta pasada. Con `limite`, lo que queda por delante. */
  restantes: number
}
type ZohoRecord = Record<string, unknown>
async function readData(res: Response): Promise<ZohoRecord> { const t = await res.text(); return t ? JSON.parse(t) : {} }
/** Extrae el array `data` de una respuesta de lista de Zoho, narrowing a registros. */
function dataArray(payload: ZohoRecord): ZohoRecord[] {
  return Array.isArray(payload.data) ? (payload.data as ZohoRecord[]) : []
}

export function createSync({ zohoFetch, db, config }: Deps): Sync {
  // Cachés por proceso para no re-pedir la misma cuenta/contacto en el backfill (menos riesgo de 429).
  const accountSeen = new Set<string>()
  // contactId → accountId del contacto (el endpoint de LISTA de tickets no trae accountId).
  const contactAccount = new Map<string, string | null>()

  /**
   * La historia de UN ticket, paginada. Es función suelta y no solo un método porque la llaman dos: la
   * ruta del historial (a través de `syncTicketHistory`) y el barrido de tickets antiguos. Llamarla
   * como método desde el barrido obligaría a un `this` que este objeto literal no tiene.
   */
  async function traerHistoria(id: string): Promise<void> {
    let from = 1
    for (;;) {
      const res = await zohoFetch(`/tickets/${id}/History?from=${from}&limit=${PAGE_SIZE}`)
      if (!res.ok) throw new Error(`Zoho /tickets/${id}/History ${res.status}`)
      const items = dataArray(await readData(res))
      if (items.length === 0) break
      for (const e of items) await upsertHistoryEvent(db, id, e)
      if (items.length < PAGE_SIZE) break
      from += PAGE_SIZE
    }
  }

  async function ensureAccount(accountId: string | null | undefined): Promise<void> {
    if (!accountId || accountSeen.has(accountId)) return
    accountSeen.add(accountId)
    try {
      const res = await zohoFetch(`/accounts/${accountId}`)
      if (res.ok) await upsertAccount(db, accountRowFromZoho(await readData(res)))
    } catch { /* sin empresa si falla */ }
  }
  /** Asegura el contacto y devuelve su accountId (para propagarlo al ticket). */
  async function ensureContact(contactId: string | null | undefined): Promise<string | null> {
    if (!contactId) return null
    if (contactAccount.has(contactId)) return contactAccount.get(contactId)!
    let accountId: string | null = null
    try {
      const res = await zohoFetch(`/contacts/${contactId}`)
      if (res.ok) {
        const c = await readData(res)
        accountId = (c.accountId as string) ?? null
        await ensureAccount(accountId)
        await upsertContact(db, contactRowFromZoho(c))
      }
    } catch { /* */ }
    contactAccount.set(contactId, accountId)
    return accountId
  }

  async function persistTicket(t: ZohoRecord): Promise<void> {
    await ensureAccount(t.accountId as string | null | undefined)
    const contactAccountId = await ensureContact(t.contactId as string | null | undefined)
    if (t.assignee) await upsertAgent(db, agentRowFromZoho(t.assignee as ZohoRecord))
    const row = ticketRowFromZoho(t)
    // El endpoint de LISTA omite accountId; recuperarlo del contacto para que el JOIN dé la empresa.
    if (!row.account_id) row.account_id = contactAccountId
    await upsertTicket(db, row)
  }

  /** Persiste cada item aislando fallos: uno malo no aborta el lote. Devuelve cuántos persistieron OK. */
  async function persistEach(items: ZohoRecord[]): Promise<number> {
    let ok = 0
    for (const t of items) {
      try { await persistTicket(t); ok++ }
      catch (e) {
        const err = e as { detail?: unknown; message?: unknown }
        console.error(`persistTicket(${t?.id ?? '?'}) falló:`, String(err?.detail ?? err?.message ?? e))
      }
    }
    return ok
  }

  async function fetchTicketPage(from: number, sortBy = 'createdTime'): Promise<ZohoRecord[]> {
    const params = new URLSearchParams({ departmentId: config.departmentId, from: String(from), limit: String(PAGE_SIZE), sortBy, include: 'contacts,assignee' })
    const res = await zohoFetch(`/tickets?${params.toString()}`)
    if (!res.ok) throw new Error(`Zoho /tickets ${res.status}`)
    return dataArray(await readData(res))
  }

  return {
    async backfillTickets(): Promise<number> {
      let from = 1, total = 0
      for (;;) {
        const pageItems = await fetchTicketPage(from)
        if (pageItems.length === 0) break
        await persistEach(pageItems)
        total += pageItems.length
        if (pageItems.length < PAGE_SIZE) break
        from += PAGE_SIZE
      }
      return total
    },
    async backfillArchivedTickets(): Promise<number> {
      let from = 1, total = 0
      for (;;) {
        const params = new URLSearchParams({ departmentId: config.departmentId, from: String(from), limit: String(PAGE_SIZE), include: 'contacts,assignee' })
        const res = await zohoFetch(`/tickets/archivedTickets?${params.toString()}`)
        if (!res.ok) throw new Error(`Zoho /tickets/archivedTickets ${res.status}`)
        const items = dataArray(await readData(res))
        if (items.length === 0) break
        await persistEach(items)
        total += items.length
        if (items.length < PAGE_SIZE) break
        from += PAGE_SIZE
      }
      return total
    },
    async syncRecent(): Promise<number> {
      const pageItems = await fetchTicketPage(1, '-recentThread')
      await persistEach(pageItems)
      return pageItems.length
    },
    async syncTicket(id: string): Promise<void> {
      const res = await zohoFetch(`/tickets/${id}?include=contacts,assignee`)
      if (!res.ok) throw new Error(`Zoho /tickets/${id} ${res.status}`)
      await persistTicket(await readData(res))
    },
    async syncConversations(id: string): Promise<void> {
      const res = await zohoFetch(`/tickets/${id}/conversations`)
      if (!res.ok) throw new Error(`Zoho /tickets/${id}/conversations ${res.status}`)
      const items = dataArray(await readData(res))
      for (const c of items) {
        await upsertConversation(db, conversationRowFromZoho(c, id))
        for (const a of attachmentRowsFrom(c, id)) await upsertAttachment(db, a)
      }
    },
    syncTicketHistory: traerHistoria,
    /**
     * Trae de Zoho la historia de los tickets ANTIGUOS, los que nadie ha abierto todavía en Desk.
     *
     * La historia por ticket ya se poblaba sola al abrirlo (`syncTicketHistory` desde la ruta del
     * historial). Esto es lo mismo pero sin esperar a que alguien entre: con ~800 tickets heredados de
     * Zoho, el relato completo solo existía para los pocos que se hubieran mirado.
     *
     * Tres decisiones que lo hacen soportable contra un Zoho con cuota:
     *
     * - **Reanudable**: la lista de pendientes es «tickets sin ninguna fila en `ticket_history`». Si la
     *   pasada se corta —por cuota, por un redespliegue— volver a lanzarlo sigue por donde iba. No hay
     *   cursor que guardar ni que se pueda quedar desfasado.
     * - **Tolerante**: un ticket que falla NO corta el barrido. Sin esto, un solo 404 dejaría sin
     *   historia a los cientos que vienen detrás, y el resultado sería indistinguible de «Zoho no
     *   tiene esos datos».
     * - **Con pausa**: `zohoFetch` no reintenta ante un 429 (solo refresca el token en un 401), así
     *   que el freno lo pone el barrido. `limite` permite además una primera pasada corta de tanteo.
     *
     * Los nacidos en la app quedan fuera: Zoho no los conoce y preguntarle sería un 404 por cabeza. Su
     * historia ya la cuenta `ticket_transitions`, que es lo que el compositor une con la de Zoho.
     */
    async backfillTicketHistory(opts: BackfillHistoriaOpts = {}): Promise<ResultadoBackfillHistoria> {
      const { limite, pausaMs = 500 } = opts
      // Dos consultas sueltas y ningún `NOT EXISTS`: pg-mem —el motor de los tests— no resuelve
      // subconsultas correlacionadas. Son dos listas de ids, caben de sobra en memoria.
      const todos = await db.query('SELECT id FROM tickets ORDER BY created_time DESC NULLS LAST')
      const conHistoria = await db.query('SELECT DISTINCT ticket_id FROM ticket_history')
      const yaTienen = new Set((conHistoria.rows as ZohoRecord[]).map((r) => String(r.ticket_id)))

      const pendientes = (todos.rows as ZohoRecord[])
        .map((r) => String(r.id))
        .filter((id) => !id.startsWith(PREFIJO_TICKET_APP) && !yaTienen.has(id))

      const tanda = limite != null ? pendientes.slice(0, limite) : pendientes
      let poblados = 0, fallidos = 0
      for (const id of tanda) {
        try {
          await traerHistoria(id)
          poblados++
        } catch {
          // Se cuenta y se sigue: lo que importa es que la pasada llegue al final. Los fallidos vuelven
          // a salir como pendientes en la siguiente, sin hacer nada.
          fallidos++
        }
        if (pausaMs > 0) await new Promise((r) => setTimeout(r, pausaMs))
      }
      return { intentados: tanda.length, poblados, fallidos, restantes: pendientes.length - poblados }
    },
    async syncActivities(): Promise<number> {
      const wmRow = (await db.query('SELECT max(modified_time) AS m FROM activities')).rows[0]
      const watermark = wmRow?.m ? new Date(wmRow.m).getTime() : 0
      let from = 1, total = 0
      for (;;) {
        const params = new URLSearchParams({ departmentId: config.departmentId, from: String(from), limit: String(PAGE_SIZE), include: 'tickets,assignee', sortBy: '-modifiedTime' })
        const res = await zohoFetch(`/tasks?${params.toString()}`)
        if (!res.ok) throw new Error(`Zoho /tasks ${res.status}`)
        const items = dataArray(await readData(res))
        if (items.length === 0) break
        let reachedOld = false
        for (const t of items) {
          await upsertActivity(db, activityRowFromZoho(t))
          total++
          const mt = t.modifiedTime ? new Date(t.modifiedTime as string).getTime() : 0
          if (watermark && mt <= watermark) reachedOld = true
        }
        if (reachedOld || items.length < PAGE_SIZE) break
        from += PAGE_SIZE
      }
      return total
    },
    async syncContacts(): Promise<number> {
      const wmRow = (await db.query('SELECT max(modified_time) AS m FROM contacts')).rows[0]
      const watermark = wmRow?.m ? new Date(wmRow.m).getTime() : 0
      let from = 1, total = 0
      for (;;) {
        const params = new URLSearchParams({ from: String(from), limit: String(PAGE_SIZE), sortBy: '-modifiedTime' })
        const res = await zohoFetch(`/contacts?${params.toString()}`)
        if (!res.ok) throw new Error(`Zoho /contacts ${res.status}`)
        const items = dataArray(await readData(res))
        if (items.length === 0) break
        let reachedOld = false
        for (const c of items) {
          await ensureAccount(c.accountId as string | null | undefined)
          await upsertContact(db, contactRowFromZoho(c))
          total++
          const mt = c.modifiedTime ? new Date(c.modifiedTime as string).getTime() : 0
          if (watermark && mt <= watermark) reachedOld = true
        }
        if (reachedOld || items.length < PAGE_SIZE) break
        from += PAGE_SIZE
      }
      return total
    },
  }
}
