import { describe, it, expect, vi } from 'vitest'
import { createMeasurer } from './measure'
import type { AppConfig } from '@ambientalia/zoho-sync/config'

const config = { departmentId: 'DEP' } as AppConfig

function json(obj: unknown) {
  return new Response(JSON.stringify(obj), { status: 200 })
}

describe('measurer', () => {
  it('recorre tickets y totaliza adjuntos (cantidad y bytes)', async () => {
    const zohoFetch = vi.fn(async (path: string) => {
      if (path.startsWith('/tickets?')) {
        // primera página con 2 tickets, luego vacía
        return zohoFetch.mock.calls.filter((c) => String(c[0]).startsWith('/tickets?')).length === 1
          ? json({ data: [{ id: '1' }, { id: '2' }] })
          : json({ data: [] })
      }
      if (path.startsWith('/tickets/1/conversations')) {
        return json({ data: [{ attachments: [{ size: '1000' }, { size: '2000' }] }] })
      }
      if (path.startsWith('/tickets/2/conversations')) {
        return json({ data: [{ attachments: [{ size: '500' }] }, { attachments: [] }] })
      }
      return json({ data: [] })
    })

    const m = createMeasurer({ zohoFetch, config, delayMs: 0 })
    m.start()
    // espera a que termine
    for (let i = 0; i < 50 && !m.state().done; i++) await new Promise((r) => setTimeout(r, 5))

    const s = m.state()
    expect(s.done).toBe(true)
    expect(s.ticketsScanned).toBe(2)
    expect(s.attachmentCount).toBe(3)
    expect(s.totalBytes).toBe(3500)
  })
})
