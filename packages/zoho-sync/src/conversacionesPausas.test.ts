import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { leerConversaciones, crearPasadaConversaciones, PAUSA_429_MS, PAUSA_ENTRE_TICKETS_MS } from './conversaciones'

/**
 * sync-conversaciones-zoho, corrección de W-1 del verify-report: las dos esperas de RQ-ZS-27 se prueban por CONDUCTA, con sus valores
 * por omisión —los que recibe la App, que no pasa `pausaMs` ni `pausa429Ms`—. Antes sólo se fijaban las constantes, y quitar el
 * `await dormir(…)` no ponía nada rojo. CARACTERIZACIÓN: nacen verdes; su valor está en las mutaciones X1 y X2.
 * Sólo se falsea `setTimeout`, que es lo único que usa `dormir`; pg-mem y la `zohoFetch` falsa no usan temporizadores.
 */
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const vacio = () => new Response(null, { status: 204 })

let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db)
  vi.useFakeTimers({ toFake: ['setTimeout'] })
})
afterEach(() => { vi.useRealTimers() })

describe('las esperas de la pasada, por conducta (RQ-ZS-27, S-5, S-6)', () => {
  it(`ante un 429 la misma página se repide a los ${PAUSA_429_MS} ms, no antes`, async () => {
    let n = 0
    const zohoFetch = vi.fn(async () => (n++ === 0 ? json({}, 429) : vacio()))
    const lectura = leerConversaciones(zohoFetch, 'T1', { reintentos429: 3 })
    await vi.advanceTimersByTimeAsync(PAUSA_429_MS - 1)
    expect(zohoFetch).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(zohoFetch).toHaveBeenCalledTimes(2)
    expect(zohoFetch.mock.calls[1][0]).toBe(zohoFetch.mock.calls[0][0])
    expect(await lectura).toEqual({ items: [], error: null, por429: false })
  })

  it(`entre un ticket y el siguiente la pasada espera ${PAUSA_ENTRE_TICKETS_MS} ms, y antes del primero no`, async () => {
    const pedidas: string[] = []
    const zohoFetch = vi.fn(async (path: string) => { pedidas.push(path.split('?')[0]); return vacio() })
    const pasada = crearPasadaConversaciones({ zohoFetch, db, marcar: false })
    const corrida = pasada([{ id: 'A', modifiedTime: '2026-10-29T10:00:00.000Z' }, { id: 'B', modifiedTime: '2026-10-29T10:00:00.000Z' }])
    // Entre avance y avance del reloj falso, el trabajo en pg-mem tiene que asentarse (con `setImmediate`, que es real): si no, la
    // espera se programaría más tarde de lo que se cuenta. Se asienta hasta 200 vueltas o hasta que B ya se pidió: así una espera
    // ausente (B antes de tiempo) o más corta que la de por omisión pone rojas las dos primeras aserciones.
    const asentar = async () => { for (let i = 0; i < 200 && pedidas.length < 2; i++) await new Promise((r) => setImmediate(r)) }
    await asentar()
    expect(pedidas).toEqual(['/tickets/A/conversations'])
    await vi.advanceTimersByTimeAsync(PAUSA_ENTRE_TICKETS_MS - 1); await asentar()
    expect(pedidas).toEqual(['/tickets/A/conversations'])
    await vi.advanceTimersByTimeAsync(1); await asentar()
    expect(pedidas).toEqual(['/tickets/A/conversations', '/tickets/B/conversations'])
    await corrida
  })
})
