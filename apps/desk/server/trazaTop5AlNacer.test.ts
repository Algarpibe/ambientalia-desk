import { describe, it, expect } from 'vitest'
import request from 'supertest'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { hoyEnZona, sumarDias } from '@ambientalia/shared'
import { createManagedTicket } from './services/ticketService'
import { crearTicketConEquipo } from './services/equipoNuevo'
import { crearContrato } from './db/contratos'
import { fijarYPropagarPrioridadCliente } from './db/prioridadCliente'
import { db, instalarArnes, appWith, adminCookie } from './testing/appHarness'

instalarArnes()

/**
 * TRAZA AL NACER BAJO TOP 5 (F1B-07, L2b; `tickets-core` RQ-TC-38, resolución D-1: la base es la prioridad PEDIDA).
 * Un ticket que nace bajo el Top 5 de su cliente con una prioridad distinta de la pedida deja, en la misma transacción
 * que el ticket, una fila `top5_al_nacer` (`de` = pedida, `a` = la escrita, autor = quien da el alta). Sin ella, desmarcar
 * al cliente no tendría base y el ticket se quedaría alto. La imposición es del servidor (`services/equipoNuevo.ts`).
 */
const CAMPOS = { clientId: 'cli-1', tipoServicio: 'Mantenimiento', clasificaciones: 'Correctivo', prefijo: 'MT' }
const cliente = async () => { await db.query("INSERT INTO books.contacts (contact_id, contact_name) VALUES ('cli-1','Cliente 1')") }
const equipo = async () => { await db.query("INSERT INTO equipos (id, serial, marca, modelo, tipo) VALUES ('eq-1','S1','Grimm','EDM180C','Monitor')") }
const top5 = async (prioridad: string, activo = true) => { await db.query("INSERT INTO public.cliente_prioridad (client_id, top5, prioridad, actualizado_por) VALUES ('cli-1',$1,$2,'seed')", [activo, prioridad]) }
const vigente = async () => { await crearContrato(db, { clientId: 'cli-1', lote: 'OV-2026-170', fechaInicio: sumarDias(hoyEnZona(), -10), fechaFin: sumarDias(hoyEnZona(), 100), creadoPor: 'Comercial' }) }
const alta = async (prioridad?: string) => (await createManagedTicket(db, { equipoId: 'eq-1', ...CAMPOS, prioridad }, 'Ana')) as { id: string }
const trazas = async () => (await db.query('SELECT ticket_id, de, a, motivo, ajustado_por, ajustado_at, origen FROM public.prioridad_ajustes ORDER BY id')).rows as Record<string, unknown>[]
const prio = async (id: string) => ((await db.query('SELECT priority FROM tickets WHERE id=$1', [id])).rows[0] as { priority: string | null }).priority
const desmarcar = () => fijarYPropagarPrioridadCliente(db, { clientId: 'cli-1', top5: false, prioridad: null, por: 'Dir' })

describe('la traza al nacer bajo Top 5 (D-1: la base es la pedida)', () => {
  it('nace bajo Top 5 con prioridad distinta de la pedida: fila top5_al_nacer con de = pedida, a = la escrita y el autor del alta', async () => {
    await cliente(); await equipo(); await top5('High')
    const t = await alta('Low')
    expect(await prio(t.id)).toBe('High')
    expect(await trazas()).toMatchObject([{ ticket_id: t.id, de: 'Low', a: 'High', ajustado_por: 'Ana', origen: 'top5_al_nacer' }])
    expect((await trazas())[0].ajustado_at).toBeTruthy()
    expect((await trazas())[0].motivo).toBeTruthy()
  })

  it('criterio 8 · desmarcar al cliente devuelve el ticket nacido bajo Top 5 a su calculada, con traza de reversión', async () => {
    await cliente(); await equipo(); await top5('High')
    const t = await alta('Low')
    expect((await desmarcar()).ticketsCambiados).toBe(1)
    expect(await prio(t.id)).toBe('Low')
    expect((await trazas()).map((x) => [x.de, x.a, x.origen])).toEqual([['Low', 'High', 'top5_al_nacer'], ['High', 'Low', 'top5_revertido']])
  })

  it('sin pedida: de es NULL y desmarcar lo devuelve a «sin prioridad»', async () => {
    await cliente(); await equipo(); await top5('Medium')
    const t = await alta()
    expect(await trazas()).toMatchObject([{ de: null, a: 'Medium', origen: 'top5_al_nacer' }])
    await desmarcar()
    expect(await prio(t.id)).toBeNull()
  })

  it('con contrato vigente y Top 5 Low, cuerpo Low: nace High y SÍ hay fila, con de = Low (D-1: la base no lleva el contrato)', async () => {
    await cliente(); await equipo(); await top5('Low'); await vigente()
    const t = await alta('Low')
    expect(await prio(t.id)).toBe('High')
    expect(await trazas()).toMatchObject([{ de: 'Low', a: 'High', origen: 'top5_al_nacer' }])
  })

  it('nace sin Top 5 (sin fila de cliente, o con top5 falso): sin traza', async () => {
    await cliente(); await equipo()
    await alta('Low')
    await top5('High', false)
    await alta('Low')
    expect(await trazas()).toEqual([])
  })

  it('con contrato vigente y SIN Top 5, cuerpo Low: nace High por el contrato y NO hay traza (la traza es del Top 5)', async () => {
    await cliente(); await equipo(); await vigente()
    const t = await alta('Low')
    expect(await prio(t.id)).toBe('High')
    expect(await trazas()).toEqual([])
  })

  it('nace con Top 5 y la misma prioridad que la pedida: sin traza', async () => {
    await cliente(); await equipo(); await top5('High')
    const t = await alta('High')
    expect(await prio(t.id)).toBe('High')
    expect(await trazas()).toEqual([])
  })

  it('con contrato vigente, Top 5 Low y cuerpo High: nace High, igual a la pedida, sin traza', async () => {
    await cliente(); await equipo(); await top5('Low'); await vigente()
    await alta('High')
    expect(await trazas()).toEqual([])
  })

  it('un ticket previo al despliegue, nacido bajo Top 5 SIN traza, no se toca al desmarcar (S-10)', async () => {
    await cliente(); await equipo(); await top5('High')
    await db.query("INSERT INTO tickets (id, number, subject, status, status_type, client_id, priority) VALUES ('viejo', 1, 'v', 'Ingresado', 'Open', 'cli-1', 'High')")
    await desmarcar()
    expect(await prio('viejo')).toBe('High')
    expect(await trazas()).toEqual([])
  })
})

describe('GET /api/tickets/:id/prioridad · lee el origen (RQ-TC-38)', () => {
  it('trae el origen de todas las filas: la manual con origen null y a NULL como null, no como la cadena «null»', async () => {
    await cliente(); await equipo(); await top5('Medium')
    const t = await alta('Low')
    await db.query("INSERT INTO public.prioridad_ajustes (ticket_id, de, a, motivo, ajustado_por) VALUES ($1,'Medium','Low','a mano','Dir')", [t.id])
    await db.query("INSERT INTO public.prioridad_ajustes (ticket_id, de, a, motivo, ajustado_por, origen) VALUES ($1,'Low',NULL,'revertido','Dir','top5_revertido')", [t.id])
    const res = await request(appWith().app).get(`/api/tickets/${t.id}/prioridad`).set('Cookie', await adminCookie())
    expect(res.status).toBe(200)
    expect(res.body.ajustes.map((a: { a: unknown; origen: unknown }) => [a.a, a.origen])).toEqual([['Medium', 'top5_al_nacer'], ['Low', null], [null, 'top5_revertido']])
  })
})

describe('atomicidad del alta (D-2: manda la spec) · un fallo posterior no deja ni ticket ni traza', () => {
  /** Un pool falso que anota `origen:VERBO tabla` y hace caer el `INSERT` de `ov_asociaciones`, que va DESPUÉS de la traza. */
  function poolFalso(): { db: Queryable; calls: string[] } {
    const calls: string[] = []
    const ejecutar = (origen: string) => async (sql: string) => {
      const t = sql.trim().replace(/\s+/g, ' ')
      const verbo = t.split(' ')[0].toUpperCase()
      calls.push(verbo === 'INSERT' ? `${origen}:INSERT ${t.split(' ')[2]}` : `${origen}:${verbo}`)
      if (t.startsWith('INSERT INTO ov_asociaciones')) throw new Error('boom (rastreador)')
      return { rows: verbo === 'SELECT' && t.includes('nextval') ? [{ n: 1 }] : [] }
    }
    return { db: { query: ejecutar('pool'), connect: async () => ({ query: ejecutar('tx'), release: () => {} }) } as unknown as Queryable, calls }
  }
  const input = { subject: 's', codigoServicio: null, classification: 'Correctivo', tipoServicio: 'M', equipo: null, marca: null, modelo: null, serial: 'S1', ordenVenta: 'OV-1', priority: 'High', clientId: 'cli-1', salesorderId: 'so-1', equipoId: 'eq-1', actor: 'Ana' }

  it('la traza va tras el INSERT del ticket y dentro de la transacción; si la asociación de la OV falla todo acaba en ROLLBACK, sin COMMIT ni escritura por el pool', async () => {
    const { db: falso, calls } = poolFalso()
    await expect(crearTicketConEquipo(falso, null, 'Cliente', input, null, { de: 'Low' })).rejects.toThrow('boom (rastreador)')
    expect(calls).toEqual(['tx:BEGIN', 'tx:SELECT', 'tx:INSERT tickets', 'tx:INSERT ticket_transitions', 'tx:INSERT public.prioridad_ajustes', 'tx:SELECT', 'tx:INSERT ov_asociaciones', 'tx:ROLLBACK'])
  })

  it('sin base al nacer (cliente no Top 5) no se escribe ninguna traza', async () => {
    const { db: falso, calls } = poolFalso()
    await expect(crearTicketConEquipo(falso, null, 'Cliente', input, null, null)).rejects.toThrow('boom (rastreador)')
    expect(calls.filter((c) => c.includes('prioridad_ajustes'))).toEqual([])
  })

  it('con la misma prioridad que la base no se escribe ninguna traza', async () => {
    const { db: falso, calls } = poolFalso()
    await expect(crearTicketConEquipo(falso, null, 'Cliente', input, null, { de: 'High' })).rejects.toThrow('boom (rastreador)')
    expect(calls.filter((c) => c.includes('prioridad_ajustes'))).toEqual([])
  })
})
