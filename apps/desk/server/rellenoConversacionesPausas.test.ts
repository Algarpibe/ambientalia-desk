import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { createSync } from '@ambientalia/zoho-sync/sync'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import { PAUSA_429_MS, PAUSA_ENTRE_TICKETS_MS } from '@ambientalia/zoho-sync/conversaciones'
import { crearRellenoConversaciones } from './rellenoConversaciones'

/**
 * relleno-completo-conversaciones (1G-01, RQ-ZS-29), lote L2. Las dos esperas de la pasada se prueban por CONDUCTA y con sus
 * valores por omisión —la App no pasa `pausaMs` ni `pausa429Ms`—. Molde: `packages/zoho-sync/src/conversacionesPausas.test.ts:16-51`.
 * Sólo se falsea `setTimeout`, que es lo único que usa `dormir`. La espera entre tickets es CARACTERIZACIÓN (nace verde desde L1,
 * su detector es quitar el `await dormir(pausaMs)`); la del 429 del detalle nace roja en L2.
 */
const config = { departmentId: 'DEP' } as AppConfig
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const vacio = () => new Response(null, { status: 204 })
const detalle = (id: string, numero: number) => ({ id, ticketNumber: String(numero), subject: 'S' + id, status: 'Ingresado', commentCount: '0', threadCount: '0' })

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db)
  for (const [id, n] of [['A', 1], ['B', 2]] as const) await db.query("INSERT INTO tickets (id, number, subject, status) VALUES ($1, $2, 'Viejo', 'Ingresado')", [id, n])
  vi.useFakeTimers({ toFake: ['setTimeout'] })
})
afterEach(() => { vi.useRealTimers() })

// Entre avance y avance del reloj falso el trabajo en pg-mem tiene que asentarse (`setImmediate` es real): se asienta hasta 200
// vueltas o hasta que `listo()` se cumple, así una espera ausente o más corta que la de por omisión pone rojas las aserciones.
const asentar = async (listo: () => boolean) => { for (let i = 0; i < 200 && !listo(); i++) await new Promise((r) => setImmediate(r)) }

describe('las esperas de la pasada del relleno, por conducta y con los valores por omisión (RQ-ZS-29, S-11)', () => {
  it(`ante un 429 del detalle la misma petición se repite a los ${PAUSA_429_MS} ms, no antes`, async () => {
    const pedidas: string[] = []
    let n = 0
    const zohoFetch = vi.fn(async (path: string) => {
      pedidas.push(path)
      if (path.includes('/conversations?')) return vacio()
      return n++ === 0 ? json({}, 429) : json(detalle('A', 1))
    })
    const sync = createSync({ zohoFetch, db, config })
    const r = crearRellenoConversaciones({ zohoFetch, db, sync, marcar: false, registrar: () => {} })
    r.lanzar({ limite: 1 })
    await asentar(() => pedidas.length >= 1)
    expect(pedidas).toEqual(['/tickets/A?include=contacts,assignee'])
    await vi.advanceTimersByTimeAsync(PAUSA_429_MS - 1); await asentar(() => pedidas.length >= 2)
    expect(pedidas).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(1); await asentar(() => pedidas.length >= 2)
    expect(pedidas.slice(0, 2)).toEqual(['/tickets/A?include=contacts,assignee', '/tickets/A?include=contacts,assignee'])
    await asentar(() => r.estado().terminado)
    expect(r.estado().terminado).toBe(true)
  })

  it(`entre un ticket y el siguiente la pasada espera ${PAUSA_ENTRE_TICKETS_MS} ms, y antes del primero no`, async () => {
    const pedidas: string[] = []
    const zohoFetch = vi.fn(async (path: string) => {
      pedidas.push(path.split('?')[0])
      if (path.includes('/conversations?')) return vacio()
      return json(detalle(path.split('?')[0].split('/')[2], path.includes('/A?') ? 1 : 2))
    })
    const sync = createSync({ zohoFetch, db, config })
    const r = crearRellenoConversaciones({ zohoFetch, db, sync, marcar: false, registrar: () => {} })
    r.lanzar()
    await asentar(() => pedidas.length >= 3)
    expect(pedidas).toEqual(['/tickets/A', '/tickets/A/conversations'])
    await vi.advanceTimersByTimeAsync(PAUSA_ENTRE_TICKETS_MS - 1); await asentar(() => pedidas.length >= 3)
    expect(pedidas).toEqual(['/tickets/A', '/tickets/A/conversations'])
    await vi.advanceTimersByTimeAsync(1); await asentar(() => pedidas.length >= 3)
    expect(pedidas.slice(0, 3)).toEqual(['/tickets/A', '/tickets/A/conversations', '/tickets/B'])
    await asentar(() => r.estado().terminado)
    expect(r.estado().terminado).toBe(true)
  })
})
