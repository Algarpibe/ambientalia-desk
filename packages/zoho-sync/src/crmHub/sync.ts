import type { AppConfig } from '../config'
import type { Queryable } from '../db/migrate'
import { MODULES, type CrmModule } from './modules'
import { upsertRow, maxModifiedTime } from './repo'

interface Deps { crmFetch: (path: string, init?: RequestInit) => Promise<Response>; db: Queryable; config: AppConfig }
export type CrmCounts = Record<string, number>
export interface CrmSync { backfillAll(): Promise<CrmCounts>; syncRecent(): Promise<CrmCounts> }
const PER_PAGE = 200
async function readData(res: Response): Promise<any> { const t = await res.text(); return t ? JSON.parse(t) : {} }

export function createCrmSync({ crmFetch, db, config }: Deps): CrmSync {
  void config
  async function fetchPage(m: CrmModule, extra: string): Promise<{ data: any[]; info: any }> {
    const res = await crmFetch(`/${m.apiName}?fields=${m.fields}&per_page=${PER_PAGE}&${extra}`)
    if (!res.ok) throw new Error(`CRM /${m.apiName} ${res.status}`)
    const d = await readData(res)
    return { data: d.data ?? [], info: d.info ?? {} }
  }
  async function forEachSafe(items: any[], m: CrmModule): Promise<number> {
    let ok = 0
    for (const r of items) {
      try { await upsertRow(db, m.table, m.toRow(r)); ok++ }
      catch (e: any) { console.error(`crm ${m.table}(${r?.id ?? '?'}) falló:`, String(e?.message ?? e)) }
    }
    return ok
  }
  /** Backfill completo de un módulo vía next_page_token (paginación profunda). */
  async function backfillModule(m: CrmModule): Promise<number> {
    let total = 0, token: string | null = null
    for (;;) {
      const extra = token ? `page_token=${token}&sort_by=Modified_Time&sort_order=desc` : `page=1&sort_by=Modified_Time&sort_order=desc`
      const { data, info } = await fetchPage(m, extra)
      total += await forEachSafe(data, m)
      if (!info.more_records || !info.next_page_token) break
      token = info.next_page_token
    }
    return total
  }
  /**
   * Incremental: descendente por Modified_Time hasta la marca de agua.
   * Nota: usa paginación page-based (tope ~2000 registros en CRM v8). Suficiente para deltas recientes;
   * si cambiaran >2000 desde el último ciclo, el exceso lo recupera el backfill (no es exhaustivo aquí).
   */
  async function incrementalModule(m: CrmModule): Promise<number> {
    const wmRaw = await maxModifiedTime(db, m.table)
    const wm = wmRaw ? new Date(wmRaw).getTime() : 0
    let count = 0, page = 1
    for (;;) {
      const { data, info } = await fetchPage(m, `page=${page}&sort_by=Modified_Time&sort_order=desc`)
      if (!data.length) break
      const fresh: any[] = []
      let reachedOld = false
      for (const r of data) {
        const t = r.Modified_Time ? new Date(r.Modified_Time).getTime() : 0
        if (wm && t <= wm) { reachedOld = true; break }
        fresh.push(r)
      }
      count += await forEachSafe(fresh, m)
      if (reachedOld || !info.more_records) break
      page++
    }
    return count
  }
  async function runAll(fn: (m: CrmModule) => Promise<number>): Promise<CrmCounts> {
    const counts: CrmCounts = {}
    for (const m of MODULES) {
      try { counts[m.table] = await fn(m) }
      catch (e) { console.error(`crm módulo ${m.table} falló:`, String(e)); counts[m.table] = 0 }
    }
    return counts
  }
  return { backfillAll: () => runAll(backfillModule), syncRecent: () => runAll(incrementalModule) }
}
