import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { upsertTicket, insertTransition, getActiveTickets } from '@ambientalia/zoho-sync/db/repo'
import { ticketRowFromZoho } from '@ambientalia/zoho-sync/db/mappers'
import { columnForStatus, transicionesDelTicket, transicionPorId } from '@ambientalia/shared'
import { db, instalarArnes, appWith, adminCookie, valoresValidos } from './testing/appHarness'

instalarArnes()

/**
 * Aceptación de `normalizar-estados-zoho` (F1F-01, RQ-ZS-24), por lotes que se AÑADEN al final (D7).
 * L1: filas 2, 3 y 4 de la tabla de `design.md`. Un ticket con `Notificación  Comercial` (dos espacios, como lo guarda Zoho
 * para el #1004) se comporta como su gemelo limpio; la columna guardada no se reescribe nunca.
 */
const DOS = 'Notificación  Comercial'
const UNO = 'Notificación Comercial'
const crudo = async (id: string) => ((await db.query('SELECT status FROM tickets WHERE id=$1', [id])).rows[0] as { status: string }).status

// Siembra a mano, sin pasar por el mapeador de la sincronización: la columna conserva el valor tal cual (molde de `tickets.test.ts:14`).
async function sembrar(id: string, number: number, status: string) {
  await upsertTicket(db, { ...ticketRowFromZoho({ id, ticketNumber: String(number), subject: 'S', status: UNO, statusType: 'On Hold', customFields: {} } as any), status })
}

async function sembrarPar() {
  await sembrar('dos', 1004, DOS)
  await sembrar('uno', 1005, UNO)
  // Precondición: la siembra no pasó por la regla.
  expect(await crudo('dos')).toBe(DOS)
  expect(await crudo('uno')).toBe(UNO)
}

describe('L1 · lectura de la lista y del detalle (filas 2 y 3)', () => {
  it('GET /api/tickets devuelve el estado normalizado y el tablero lo coloca en notif_comercial', async () => {
    await sembrarPar()
    const { app } = appWith()
    const res = await request(app).get('/api/tickets').set('Cookie', await adminCookie())
    expect(res.status).toBe(200)
    const dos = res.body.find((t: any) => t.id === 'dos')
    const uno = res.body.find((t: any) => t.id === 'uno')
    expect(dos.status).toBe(UNO)
    expect(uno.status).toBe(UNO)
    expect(columnForStatus(dos.status)).toBe('notif_comercial')
    expect(columnForStatus(uno.status)).toBe('notif_comercial')
  })

  it('GET /api/tickets/:id devuelve el estado normalizado', async () => {
    await sembrarPar()
    const { app } = appWith()
    const cookie = await adminCookie()
    const dos = await request(app).get('/api/tickets/dos').set('Cookie', cookie)
    expect(dos.status).toBe(200)
    expect(dos.body.status).toBe(UNO)
  })

  it('los botones del de dos espacios son los del gemelo y no están vacíos', async () => {
    await sembrarPar()
    const { app } = appWith()
    const cookie = await adminCookie()
    const lista = (await request(app).get('/api/tickets').set('Cookie', cookie)).body
    const botones = (id: string) => transicionesDelTicket({ classification: null, status: lista.find((t: any) => t.id === id).status }).map((t) => t.id)
    expect(botones('dos').length).toBeGreaterThan(0)
    expect(botones('dos')).toEqual(botones('uno'))
  })

  it('las lecturas no escriben: la columna sigue con dos espacios y no hay UPDATE sobre tickets.status', async () => {
    await sembrarPar()
    const { app } = appWith()
    const cookie = await adminCookie()
    const espia = vi.spyOn(db, 'query')
    await request(app).get('/api/tickets').set('Cookie', cookie)
    await request(app).get('/api/tickets/dos').set('Cookie', cookie)
    await getActiveTickets(db)
    const escrituras = espia.mock.calls.filter(([sql]) => /UPDATE\s+tickets\b[\s\S]*\bstatus\b/i.test(String(sql)))
    expect(espia.mock.calls.length).toBeGreaterThan(0)
    expect(escrituras).toEqual([])
    espia.mockRestore()
    expect(await crudo('dos')).toBe(DOS)
  })
})

describe('L1 · la transición del ticket de dos espacios (filas 3 y 4)', () => {
  const ID = 'notif_cliente_comercial'

  it('responde 200 y no 409; la fila nueva lleva from_status normalizado; las previas no cambian; no se llama a Zoho', async () => {
    await sembrar('dos', 1004, DOS)
    // Una fila de historia previa con el valor crudo: la regla no reescribe lo existente.
    await insertTransition(db, { ticketId: 'dos', transitionId: 'previa', transitionName: 'Previa', fromStatus: DOS, toStatus: DOS, area: 'Comercial', performedBy: 'x', values: {}, commentId: null } as any)
    const { app, zohoFetch } = appWith()
    const cookie = await adminCookie()
    const res = await request(app).post('/api/tickets/dos/transition').set('Cookie', cookie).send({ transitionId: ID, values: valoresValidos(transicionPorId(ID)!, 1) })
    expect(res.status).toBe(200)
    const filas = (await db.query('SELECT transition_id, from_status FROM ticket_transitions WHERE ticket_id=$1 ORDER BY id', ['dos'])).rows as { transition_id: string; from_status: string }[]
    expect(filas).toEqual([
      { transition_id: 'previa', from_status: DOS },
      { transition_id: ID, from_status: UNO },
    ])
    expect(zohoFetch).not.toHaveBeenCalled()
  })

  it('el gemelo limpio responde lo mismo', async () => {
    await sembrar('uno', 1005, UNO)
    const { app } = appWith()
    const res = await request(app).post('/api/tickets/uno/transition').set('Cookie', await adminCookie()).send({ transitionId: ID, values: valoresValidos(transicionPorId(ID)!, 2) })
    expect(res.status).toBe(200)
  })
})
