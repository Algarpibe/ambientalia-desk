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

/**
 * L2: lectores SELECT-only del servidor y reloj (filas 8-11 y 13-15 de la tabla de `design.md`). Mismo molde que L1: el de dos
 * espacios y su gemelo limpio dan lo mismo, y la columna guardada no se reescribe por leer.
 */
import { getAnalisisRows } from './analisis'
import { leerEntradasIndicadores } from './indicadores'
import { migrarTicketsAbiertos } from './db/migracionTicketsAbiertos'
import { sincronizarEstadoPorRemision } from './db/estadoPorRemision'
import { secuenciaDelReloj } from './db/relojSla'
import { userCookie } from './testing/appHarness'
import type { HistorialTransition } from '@ambientalia/shared'

// Siembra cruda con SQL, para lo que `sembrar` no cubre (estado cerrado, remisión, cliente): la columna conserva el valor tal cual.
async function insertarCrudo(id: string, number: number, status: string, statusType = 'On Hold'): Promise<void> {
  await db.query("INSERT INTO tickets (id, number, subject, status, status_type, created_time) VALUES ($1, $2, 'S', $3, $4, '2026-10-02T15:00:00Z')", [id, number, status, statusType])
}

describe('L2 · ficha de cliente (fila 8)', () => {
  it('GET /api/accounts/:id enseña el estado normalizado del ticket de dos espacios, igual que el de su gemelo', async () => {
    await db.query("INSERT INTO accounts (id, name) VALUES ('c1', 'Cliente')")
    await sembrarPar()
    await db.query("UPDATE tickets SET account_id = 'c1' WHERE id IN ('dos', 'uno')")
    const { app } = appWith()
    const res = await request(app).get('/api/accounts/c1').set('Cookie', await adminCookie())
    expect(res.status).toBe(200)
    expect(Object.fromEntries(res.body.tickets.map((t: any) => [t.id, t.status]))).toEqual({ dos: UNO, uno: UNO })
    expect(await crudo('dos')).toBe(DOS)
  })
})

describe('L2 · Análisis (fila 9, y la 17 que llega normalizada)', () => {
  it('getAnalisisRows da el mismo status a los gemelos', async () => {
    await sembrarPar()
    const filas = await getAnalisisRows(db)
    expect(filas.map((f) => f.status)).toEqual([UNO, UNO])
    expect(await crudo('dos')).toBe(DOS)
  })
})

describe('L2 · indicadores (fila 10)', () => {
  it('` Anulado` y `Anulado` cerrados no entran; el Finalizado de control sí entra', async () => {
    await insertarCrudo('a1', 1, ' Anulado', 'Closed')
    await insertarCrudo('a2', 2, 'Anulado', 'Closed')
    await insertarCrudo('ok', 3, 'Finalizado', 'Closed')
    expect(await crudo('a1')).toBe(' Anulado')
    const e = await leerEntradasIndicadores(db, { desde: null, hasta: null })
    expect(e.tickets.map((t) => [t.id, t.estado])).toEqual([['ok', 'Finalizado']])
  })
})

describe('L2 · reasignar (fila 11)', () => {
  it('con rol Comercial y cuerpo vacío, el de dos espacios recibe el mismo código que su gemelo y no el 403 del permiso', async () => {
    await sembrarPar()
    const { app } = appWith()
    const cookie = await userCookie(['Comercial'])
    const dos = await request(app).post('/api/tickets/dos/reasignar').set('Cookie', cookie).send({})
    const uno = await request(app).post('/api/tickets/uno/reasignar').set('Cookie', cookie).send({})
    expect(uno.status).toBe(422) // el gemelo pasa el permiso y cae en el contenido: falta el motivo
    expect(dos.status).toBe(uno.status)
    expect(dos.body).toEqual(uno.body)
  })
})

describe('L2 · migración de abiertos en seco (fila 13)', () => {
  it('el par de gemelos es identidad: negativa nula y un solo renglón con 2 tickets; la columna no cambia', async () => {
    await sembrarPar()
    const inf = await migrarTicketsAbiertos(db, { corte: new Date('2026-12-01T05:00:00Z'), actor: 'Admin' })
    expect(inf.negativa).toBeNull()
    expect(inf.sinEquivalencia).toEqual([])
    expect(inf.porEstado).toEqual([{ origen: UNO, destino: UNO, regla: 'identidad', cambiaEstado: false, tickets: 2 }])
    expect(await crudo('dos')).toBe(DOS)
  })
})

describe('L2 · estado por remisión (fila 14)', () => {
  it('`Ticket  creado` con remisión ok pasa a `Remisión creada` como su gemelo, con from_status `Ticket creado`', async () => {
    await insertarCrudo('dos', 1004, 'Ticket  creado')
    await insertarCrudo('uno', 1005, 'Ticket creado')
    expect(await crudo('dos')).toBe('Ticket  creado')
    for (const [id, rem] of [['dos', 'r1'], ['uno', 'r2']]) {
      await db.query("INSERT INTO remisiones (id, ticket_id, fecha, estado) VALUES ($1, $2, '2026-10-02', 'ok')", [rem, id])
      await sincronizarEstadoPorRemision(db, id, 'Prueba')
      expect(await crudo(id)).toBe('Remisión creada')
      const filas = (await db.query('SELECT from_status, to_status FROM ticket_transitions WHERE ticket_id = $1', [id])).rows
      expect(filas).toEqual([{ from_status: 'Ticket creado', to_status: 'Remisión creada' }])
    }
  })
})

describe('L2 · reloj del SLA (fila 15)', () => {
  const T = (h: number) => new Date(Date.UTC(2026, 9, 5, h))
  const etapa = (de: string, hacia: string, cuando: Date): HistorialTransition => ({
    transitionName: null, fromStatus: de, toStatus: hacia, area: null, performedBy: null, performedAt: cuando.toISOString(),
  })

  it('espacio de más sólo en el ticket: la secuencia no es null', () => {
    const pasos = secuenciaDelReloj({ status: DOS, createdAt: T(8) }, [], [etapa('Ingresado', UNO, T(12))])
    expect(pasos).toEqual([{ estado: 'Ingresado', desde: T(8) }, { estado: UNO, desde: T(12) }])
  })

  it('espacio de más sólo en el historial: la secuencia no es null y los pasos salen normalizados', () => {
    const pasos = secuenciaDelReloj({ status: UNO, createdAt: T(8) }, [], [etapa('Ingresado', DOS, T(12))])
    expect(pasos).toEqual([{ estado: 'Ingresado', desde: T(8) }, { estado: UNO, desde: T(12) }])
  })

  it('el origen de la primera etapa también se normaliza; el gemelo limpio da lo mismo', () => {
    const sucio = secuenciaDelReloj({ status: UNO, createdAt: T(8) }, [], [etapa('Ingresado  ', UNO, T(12))])
    const limpio = secuenciaDelReloj({ status: UNO, createdAt: T(8) }, [], [etapa('Ingresado', UNO, T(12))])
    expect(limpio).toEqual([{ estado: 'Ingresado', desde: T(8) }, { estado: UNO, desde: T(12) }])
    expect(sucio).toEqual(limpio)
  })
})
