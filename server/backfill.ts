import type { AppConfig } from './config'
import type { Sync } from './sync'

interface Deps {
  zohoFetch: (path: string, init?: RequestInit) => Promise<Response>
  sync: Sync
  config: AppConfig
  delayMs?: number // pausa entre tickets para no chocar con el rate limit de Zoho
}

export interface BackfillState {
  running: boolean
  done: boolean
  ticketsProcessed: number
  errors: number
  startedAt?: number
  finishedAt?: number
  error?: string
}

const PAGE = 100

async function readData(res: Response): Promise<any> {
  const text = await res.text()
  return text ? JSON.parse(text) : {}
}

/** Recorre TODOS los tickets y persiste detalle (customFields) + conversaciones de cada uno. */
export function createDetailBackfiller({ zohoFetch, sync, config, delayMs = 150 }: Deps) {
  const state: BackfillState = { running: false, done: false, ticketsProcessed: 0, errors: 0 }
  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

  async function run(): Promise<void> {
    Object.assign(state, { running: true, done: false, ticketsProcessed: 0, errors: 0, error: undefined })
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
          try {
            await sync.syncTicket(t.id)
            await sync.syncConversations(t.id)
          } catch {
            state.errors++
          }
          state.ticketsProcessed++
          if (delayMs) await sleep(delayMs)
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
    start(): BackfillState {
      if (!state.running) {
        state.startedAt = Date.now()
        void run()
      }
      return state
    },
    state(): BackfillState {
      return state
    },
  }
}
