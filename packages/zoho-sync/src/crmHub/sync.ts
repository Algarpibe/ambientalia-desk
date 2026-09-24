import type { AppConfig } from '../config'
import type { Queryable } from '../db/migrate'
import { MODULES, quoteLineRow, type CrmModule } from './modules'
import { upsertRow, maxModifiedTime, replaceQuoteLines } from './repo'
import { sweepEntity, type SweepOpts, type SweepReport, type SweepEntity } from '../sweep/sweep'

interface Deps { crmFetch: (path: string, init?: RequestInit) => Promise<Response>; db: Queryable; config: AppConfig }
export type CrmCounts = Record<string, number>
export interface CrmSync extends FasesGanadasPendientes { backfillAll(): Promise<CrmCounts>; syncRecent(): Promise<CrmCounts>; backfillIfEmpty(): Promise<CrmCounts>; sweep(opts: SweepOpts): Promise<SweepReport[]> }
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
  /** Todos los IDs vivos de un módulo CRM (paginación profunda por next_page_token). Lanza si una página falla. */
  async function collectLiveIds(m: CrmModule): Promise<Set<string>> {
    const ids = new Set<string>()
    let token: string | null = null
    for (;;) {
      const extra = token ? `page_token=${token}` : `page=1`
      const { data, info } = await fetchPage(m, extra)
      for (const r of data) { if (r?.id != null) ids.add(String(r.id)) }
      if (!info.more_records || !info.next_page_token) break
      token = info.next_page_token
    }
    return ids
  }

  /** Re-verifica por id en CRM: true si Zoho ya NO lo tiene; false si existe; lanza si es indeterminado.
   *  CRM v8 GET /{Module}/{id}: 200 con data[] = existe; 204/404 = no existe. */
  async function verifyDeleted(m: CrmModule, id: string): Promise<boolean> {
    const res = await crmFetch(`/${m.apiName}/${id}`)
    if (res.status === 204 || res.status === 404) return true
    if (res.ok) { const d = await readData(res); return !(Array.isArray(d.data) && d.data.length > 0) }
    throw new Error(`CRM verify /${m.apiName}/${id} ${res.status}`)
  }

  /** Para módulos con hasLines (Quotes): trae el detalle (el subform NO viene en bulk) y reemplaza las líneas. */
  async function persistLines(record: any): Promise<void> {
    const res = await crmFetch(`/Quotes/${record.id}`)
    if (!res.ok) throw new Error(`CRM /Quotes/${record.id} ${res.status}`)
    const d = await readData(res)
    const rec = d.data?.[0] ?? {}
    const lines = (rec.Quoted_Items ?? []).map((l: any) => quoteLineRow(String(record.id), l))
    await replaceQuoteLines(db, String(record.id), lines)
  }
  async function forEachSafe(items: any[], m: CrmModule): Promise<number> {
    let ok = 0
    for (const r of items) {
      try { await upsertRow(db, m.table, m.toRow(r)); if (m.hasLines) await persistLines(r); ok++ }
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
  async function backfillIfEmpty(): Promise<CrmCounts> {
    const counts: CrmCounts = {}
    for (const m of MODULES) {
      try { counts[m.table] = (await maxModifiedTime(db, m.table)) == null ? await backfillModule(m) : 0 }
      catch (e) { console.error(`crm backfillIfEmpty ${m.table} falló:`, String(e)); counts[m.table] = 0 }
    }
    return counts
  }
  async function sweep(opts: SweepOpts): Promise<SweepReport[]> {
    const reports: SweepReport[] = []
    for (const m of MODULES) {
      const e: SweepEntity = {
        schema: 'crm', table: m.table, pk: 'id',
        childTable: m.hasLines ? 'quote_line_items' : undefined,
        childFk: m.hasLines ? 'quote_id' : undefined,
        collectLive: () => collectLiveIds(m),
        confirmDeleted: (id) => verifyDeleted(m, id),
      }
      try { reports.push(await sweepEntity(db, e, opts)) }
      catch (err: any) { reports.push({ table: `crm.${m.table}`, live: 0, replica: 0, orphans: 0, confirmed: 0, liveGaps: 0, uncertain: 0, deleted: 0, dryRun: opts.dryRun, skipped: `abortado: ${String(err?.message ?? err)}` }) }
    }
    return reports
  }
  /**
   * Trae la hora de entrada en la fase de los tratos ganados cuya copia puede estar desfasada: los que
   * nunca se han leído (`stage_history_synced_at` nulo) y los que Zoho ha modificado después de la última
   * vez (`stage_history_synced_at` anterior a `modified_time`). Lo corre el worker en cada ciclo de CRM.
   *
   * La hora sale del historial de fases del trato, no de `Stage_Modified_Time` de la ficha: una
   * operación masiva en Zoho del 2026-03-06 reescribió ese campo en cientos de tratos ganados, de cierres
   * de 2020 a 2026, con la fecha de ese día y sin añadir nada a su historial. El historial conserva la
   * hora real. El listado de Zoho, además, da `Stage_Modified_Time` siempre nulo y COQL rechaza la columna.
   * Solo se piden los ganados, por economía de llamadas: el KPI no necesita las demás fases.
   *
   * - De las entradas del historial en una fase ganada cuenta la MÁS RECIENTE por instante, sin fiarse
   *   del orden de la respuesta: un trato ganado, reabierto y ganado otra vez se cuenta por la última.
   * - La hora se guarda como la da el historial, igual que `ts()` en los módulos: PostgreSQL convierte el
   *   texto con su desfase en el instante.
   * - La marca es el `modified_time` LEÍDO al elegir el trato, no `now()`: si Zoho lo cambia mientras se
   *   lee su historial, su `modified_time` avanza y la pasada siguiente lo vuelve a elegir.
   * - La marca es `stage_history_synced_at` y no la de la ficha (`stage_detail_synced_at`, que ya no se
   *   usa): así todos los tratos que se rellenaron desde la ficha nacen sin marca y se recalculan solos.
   * - Un trato sin `modified_time` se marca con el epoch: se lee una vez y no vuelve a salir hasta que
   *   Zoho le ponga fecha. Marcarlo con nulo lo haría salir en todas las pasadas.
   * - Tolerante: un fallo (HTTP, historial vacío o sin entrada en una fase ganada) se cuenta, se guarda el
   *   motivo del primero y se sigue. El trato fallido no se marca y vuelve a salir en la pasada siguiente.
   * - Una sola consulta simple: pg-mem, el motor de los tests, no resuelve subconsultas correlacionadas.
   */
  async function syncPendingWonStages({ limite, pausaMs = 500 }: FasesGanadasOpts): Promise<ResultadoFasesGanadas> {
    const r = await db.query(
      `SELECT id, modified_time FROM crm.deals
       WHERE stage = ANY($1) AND (stage_history_synced_at IS NULL OR stage_history_synced_at < modified_time)
       ORDER BY modified_time DESC NULLS LAST LIMIT $2`,
      [FASES_GANADAS, limite],
    )
    const tanda = r.rows as { id: string; modified_time: Date | null }[]
    let poblados = 0, fallidos = 0
    let motivoPrimerFallo: string | undefined
    for (const [i, t] of tanda.entries()) {
      if (i > 0 && pausaMs > 0) await new Promise((res) => setTimeout(res, pausaMs))
      try {
        // Una sola página de 200 basta: el historial tiene una entrada por cambio de fase de ESE trato, y
        // un trato con más de 200 cambios de fase no es realista. Por eso `info.more_records` no se sigue.
        const res = await crmFetch(`/Deals/${t.id}/Stage_History?fields=Stage,Modified_Time&per_page=200`)
        if (!res.ok) throw new Error(`CRM /Deals/${t.id}/Stage_History ${res.status}`)
        const hora = ultimaEntradaGanada((await readData(res)).data)
        if (!hora) throw new Error(`CRM /Deals/${t.id}/Stage_History sin entrada en ${FASES_GANADAS.join(' o ')}`)
        await db.query(
          'UPDATE crm.deals SET stage_modified_time = $1, stage_history_synced_at = $2 WHERE id = $3',
          [hora, t.modified_time ?? new Date(0), t.id],
        )
        poblados++
      } catch (e) {
        fallidos++
        motivoPrimerFallo ??= e instanceof Error ? e.message : String(e)
      }
    }
    return { intentados: tanda.length, poblados, fallidos, motivoPrimerFallo }
  }
  return { backfillAll: () => runAll(backfillModule), syncRecent: () => runAll(incrementalModule), backfillIfEmpty, sweep, syncPendingWonStages }
}

/**
 * Las fases de CRM que cuentan como trato ganado. TIENE QUE COINCIDIR con `WON_DEAL_STAGES` de
 * SalesTracker, que cuenta los ganados por `stage_modified_time`: una fase que esté allí y no aquí
 * contaría tratos cuya hora este worker nunca rellena.
 */
export const FASES_GANADAS: readonly string[] = ['Cerrado ganado']

/**
 * El `Modified_Time` de la entrada más reciente del historial de fases en una fase ganada, tal como lo
 * da Zoho, o `undefined` si no hay ninguna. Compara por instante porque Zoho no garantiza el orden y las
 * horas llevan desfase. Una hora que no es fecha no cuenta.
 */
function ultimaEntradaGanada(entradas: unknown): string | undefined {
  if (!Array.isArray(entradas)) return undefined
  let mejor: { texto: string; ms: number } | undefined
  for (const e of entradas as { Stage?: unknown; Modified_Time?: unknown }[]) {
    if (typeof e?.Stage !== 'string' || !FASES_GANADAS.includes(e.Stage) || typeof e.Modified_Time !== 'string') continue
    const ms = Date.parse(e.Modified_Time)
    if (Number.isNaN(ms)) continue
    if (!mejor || ms > mejor.ms) mejor = { texto: e.Modified_Time, ms }
  }
  return mejor?.texto
}

/**
 * La hora de entrada en la fase ganada que corre el worker `hub-sync`. Va en una interfaz aparte y al
 * final del fichero, como `HistoriaPendiente` en el sync de Desk, para no mover las líneas de arriba.
 */
export interface FasesGanadasPendientes {
  syncPendingWonStages(opts: FasesGanadasOpts): Promise<ResultadoFasesGanadas>
}
export interface FasesGanadasOpts {
  /** Cuántos tratos como mucho en esta pasada. Obligatorio: sin tope, el primer arranque pediría todas las fichas de golpe. */
  limite: number
  /** Espera entre fichas. `crmFetch` no reintenta ante un 429. Por omisión 500 ms, como la historia de Desk. */
  pausaMs?: number
}
export interface ResultadoFasesGanadas {
  intentados: number
  poblados: number
  fallidos: number
  /** Por qué falló el PRIMERO que falló. Ausente si no falló ninguno. */
  motivoPrimerFallo?: string
}
