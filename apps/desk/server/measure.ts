import type { AppConfig } from '@ambientalia/zoho-sync/config'

interface Deps {
  zohoFetch: (path: string, init?: RequestInit) => Promise<Response>
  config: AppConfig
  delayMs?: number // pausa entre tickets para no chocar con el rate limit de Zoho
}

export interface MeasureState {
  running: boolean
  done: boolean
  ticketsScanned: number
  attachmentCount: number
  totalBytes: number
  startedAt?: number
  finishedAt?: number
  error?: string
}

const PAGE = 100

async function readData(res: Response): Promise<any> {
  const text = await res.text()
  return text ? JSON.parse(text) : {}
}

/** Mide cantidad y tamaño total de adjuntos recorriendo todos los tickets, SIN descargarlos. */
export function createMeasurer({ zohoFetch, config, delayMs = 150 }: Deps) {
  const state: MeasureState = { running: false, done: false, ticketsScanned: 0, attachmentCount: 0, totalBytes: 0 }
  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

  async function run(): Promise<void> {
    Object.assign(state, { running: true, done: false, ticketsScanned: 0, attachmentCount: 0, totalBytes: 0, error: undefined })
    try {
      let from = 1
      for (;;) {
        const params = new URLSearchParams({ departmentId: config.departmentId, from: String(from), limit: String(PAGE), sortBy: 'createdTime' })
        const res = await zohoFetch(`/tickets?${params.toString()}`)
        if (res.status === 429) { await sleep(2000); continue }
        if (!res.ok) throw new Error(`/tickets ${res.status}`)
        const page = ((await readData(res)).data ?? []) as Array<{ id: string }>
        if (page.length === 0) break
        for (const t of page) {
          if (delayMs) await sleep(delayMs)
          let cres = await zohoFetch(`/tickets/${t.id}/conversations?limit=100`)
          if (cres.status === 429) { await sleep(2000); cres = await zohoFetch(`/tickets/${t.id}/conversations?limit=100`) }
          if (cres.ok) {
            const items = ((await readData(cres)).data ?? []) as Array<{ attachments?: Array<{ size?: string | number }> }>
            for (const it of items) {
              for (const a of it.attachments ?? []) {
                state.attachmentCount++
                state.totalBytes += Number(a.size) || 0
              }
            }
          }
          state.ticketsScanned++
        }
        if (page.length < PAGE) break
        from += PAGE
      }
      state.done = true
      state.finishedAt = Date.now()
    } catch (e) {
      state.error = String(e)
    } finally {
      state.running = false
    }
  }

  return {
    start(): MeasureState {
      if (!state.running) {
        state.startedAt = Date.now()
        void run()
      }
      return state
    },
    state(): MeasureState {
      return state
    },
  }
}
