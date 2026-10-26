import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { newDb } from 'pg-mem'; import { conFuncionesDeEstado } from '../testing/pgMemEstado'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { Cargo } from '@ambientalia/shared'
import { avisarSalidasEsperas, pasadaSalidasEsperas } from './avisoSalidasEsperas'
import { createRole, actualizarRecibeAvisos } from '../auth/roles'
import { createUser, updateUser } from '../auth/users'
import { logger } from '../util/logger'

/**
 * RQ-AV-26 y RQ-AV-27 (F1C-03, `design.md` D4): la alarma de caducidad de las cuatro esperas. Las externas sugieren la salida a Comercial;
 * las internas escalan al área responsable; NUNCA ejecuta; un solo aviso por (ticket, estado, entrada) vía `marcarYAvisarAlarma`.
 * Atomicidad por ESTRUCTURA, no por filas: pg-mem no revierte un `ROLLBACK` (`db/transaccion.test.ts:25`).
 */
let db: Queryable
let n = 0
beforeEach(async () => { n = 0; const pg = conFuncionesDeEstado(newDb()).adapters.createPg(); db = new pg.Pool(); await migrate(db) })

const NACIO = new Date('2026-01-05T15:00:00Z')
const ENTRADA = new Date('2026-09-01T15:00:00Z') // 01/09/2026 en Bogotá
const mas = (d: number): string => new Date(Date.UTC(2026, 8, 1 + d)).toISOString().slice(0, 10)

async function persona(email: string, cargoPermiso: Cargo | null, areas: string[] | null = null): Promise<string> {
  let roleId: string | null = null
  if (areas) { const rol = await createRole(db, { name: `R-${email}`, areas }); await actualizarRecibeAvisos(db, rol.id, true); roleId = rol.id }
  return (await createUser(db, { email, name: email, passwordHash: 'h', cargoPermiso, roleId })).id
}
async function espera(status: string, entrada: Date | null = ENTRADA, derivadoA: string | null = null): Promise<string> {
  n++
  await db.query('INSERT INTO tickets (id, number, subject, status, created_time, derivado_a) VALUES ($1,$2,$3,$4,$5,$6)', [`t${n}`, 5000 + n, 's', status, NACIO, derivadoA])
  if (entrada) await db.query('INSERT INTO ticket_transitions (ticket_id, transition_id, from_status, to_status, performed_at) VALUES ($1,$2,$3,$4,$5)', [`t${n}`, 'x', 'En Proceso', status, entrada])
  return `t${n}`
}
const avisos = async () => (await db.query('SELECT user_id, ticket_id, texto, enviado_at FROM avisos ORDER BY created_at')).rows as Array<{ user_id: string; ticket_id: string | null; texto: string; enviado_at: unknown }>
const marcas = async () => (await db.query('SELECT ticket_id, estado FROM public.alarmas_avisadas ORDER BY ticket_id')).rows as Array<{ ticket_id: string; estado: string }>
const destinos = async () => (await avisos()).map((a) => a.user_id).sort()

describe('avisarSalidasEsperas · cuándo avisa (RQ-AV-26)', () => {
  it('una externa vencida sugiere a Comercial: derivado de Comercial, Director y Coordinador Comercial; sólo bandeja', async () => {
    const dir = await persona('dir@x.co', 'Director Comercial')
    const coo = await persona('coo@x.co', 'Coordinador Comercial')
    const der = await persona('der@x.co', null, ['Comercial'])
    const id = await espera('En Espera de Repuestos', ENTRADA, der)
    expect(await avisarSalidasEsperas(db, mas(79))).toBe(1)
    expect(await destinos()).toEqual([dir, coo, der].sort())
    const a = await avisos()
    expect(a.every((x) => x.ticket_id === id && x.enviado_at === null)).toBe(true)
    expect(a[0]!.texto).toBe('El ticket #5001 lleva 79 días en «En Espera de Repuestos» (plazo: 79). Comercial decide su salida: cobrar el diagnóstico o anular.')
  })

  it.each([['En Espera de Repuestos', 79], ['Servicio externo', 31], ['Solicitado', 13], ['En espera de SKU inventario', 20]])(
    '%s: un día antes del plazo no avisa ni marca; el día del plazo sí', async (estado, plazo) => {
      await persona('dir@x.co', 'Director Comercial'); await persona('dt@x.co', 'Director Técnico')
      await espera(estado)
      expect(await avisarSalidasEsperas(db, mas(plazo - 1))).toBe(0)
      expect(await avisos()).toEqual([])
      expect(await marcas()).toEqual([])
      expect(await avisarSalidasEsperas(db, mas(plazo))).toBe(1)
    })

  it('las internas escalan: Solicitado a Director y Coordinador Técnico; SKU a Director y Coordinador Comercial con «crear el SKU»', async () => {
    const dt = await persona('dt@x.co', 'Director Técnico'); const ct = await persona('ct@x.co', 'Coordinador Técnico')
    const dc = await persona('dc@x.co', 'Director Comercial'); const cc = await persona('cc@x.co', 'Coordinador Comercial')
    const sol = await espera('Solicitado'); const sku = await espera('En espera de SKU inventario')
    expect(await avisarSalidasEsperas(db, mas(20))).toBe(2)
    const a = await avisos()
    expect(a.filter((x) => x.ticket_id === sol).map((x) => x.user_id).sort()).toEqual([dt, ct].sort())
    expect(a.filter((x) => x.ticket_id === sku).map((x) => x.user_id).sort()).toEqual([dc, cc].sort())
    expect(a.find((x) => x.ticket_id === sku)!.texto).toContain('crear el SKU')
    for (const x of a) expect(x.texto).not.toMatch(/anul|cobr|por facturar/i)
  })

  it('un ticket de Zoho sin historial en la app también vence: la entrada sale de ticket_history', async () => {
    await persona('dir@x.co', 'Director Comercial')
    n++
    await db.query('INSERT INTO tickets (id, number, subject, status, created_time) VALUES ($1,$2,$3,$4,$5)', ['z1', 7001, 's', 'Servicio externo', NACIO])
    await db.query('INSERT INTO ticket_history (id, ticket_id, event_name, event_time, raw) VALUES ($1,$2,$3,$4,$5)', ['h1', 'z1', 'TicketUpdated', ENTRADA, JSON.stringify({
      eventName: 'TicketUpdated', eventTime: ENTRADA.toISOString(), actor: { id: 'bp', name: 'Blueprint', type: 'Blueprint' },
      eventInfo: [{ propertyName: 'Status', propertyValue: { previousValue: 'En Proceso', updatedValue: 'Servicio externo', type: 'Text' }, propertyType: 'ValueTransition' }], actorInfo: [] })])
    expect(await avisarSalidasEsperas(db, mas(31))).toBe(1)
  })

  it('sin entrada medible no avisa (S-16)', async () => {
    await persona('dir@x.co', 'Director Comercial')
    await espera('Servicio externo', null)
    expect(await avisarSalidasEsperas(db, mas(500))).toBe(0)
  })
})

describe('avisarSalidasEsperas · un solo aviso por (ticket, estado, entrada) (RQ-AV-27)', () => {
  it('dos pasadas, también otro día, dan un solo conjunto de avisos y una sola marca', async () => {
    await persona('dir@x.co', 'Director Comercial')
    await espera('Servicio externo')
    expect(await avisarSalidasEsperas(db, mas(31))).toBe(1)
    expect(await avisarSalidasEsperas(db, mas(31))).toBe(0)
    expect(await avisarSalidasEsperas(db, mas(60))).toBe(0)
    expect(await avisos()).toHaveLength(1)
    expect(await marcas()).toHaveLength(1)
  })

  it('la reentrada da otra entrada y otro aviso', async () => {
    await persona('dt@x.co', 'Director Técnico')
    const id = await espera('Solicitado')
    await avisarSalidasEsperas(db, mas(13))
    const t = (d: string) => new Date(`${d}T15:00:00Z`)
    await db.query('INSERT INTO ticket_transitions (ticket_id, transition_id, from_status, to_status, performed_at) VALUES ($1,$2,$3,$4,$5)', [id, 'x', 'Solicitado', 'En Proceso', t(mas(14))])
    await db.query('INSERT INTO ticket_transitions (ticket_id, transition_id, from_status, to_status, performed_at) VALUES ($1,$2,$3,$4,$5)', [id, 'x', 'En Proceso', 'Solicitado', t(mas(20))])
    expect(await avisarSalidasEsperas(db, mas(32))).toBe(0)
    expect(await avisarSalidasEsperas(db, mas(33))).toBe(1)
    expect(await avisos()).toHaveLength(2)
    expect(await marcas()).toHaveLength(2)
  })

  it('el fallo al avisar un ticket no impide los demás', async () => {
    await persona('dir@x.co', 'Director Comercial')
    const primero = await espera('Servicio externo'); const segundo = await espera('Servicio externo')
    const error = vi.spyOn(logger, 'error').mockImplementation(() => logger)
    const rota: Queryable = { query: (sql, params) => (sql.startsWith('INSERT INTO avisos') && params?.[2] === primero ? Promise.reject(new Error('caída')) : db.query(sql, params)) }
    expect(await avisarSalidasEsperas(rota, mas(31))).toBe(1)
    expect((await avisos()).map((a) => a.ticket_id)).toEqual([segundo])
    expect(error).toHaveBeenCalled()
    error.mockRestore()
  })
})

describe('avisarSalidasEsperas · a quién (D4 c, S-6, S-19)', () => {
  it('el área de respaldo sólo recibe si nadie lleva los cargos', async () => {
    const area = await persona('co@x.co', null, ['Comercial'])
    await espera('Servicio externo')
    expect(await avisarSalidasEsperas(db, mas(31))).toBe(1)
    expect(await destinos()).toEqual([area])
  })

  it('con un cargo presente, el área de respaldo no recibe', async () => {
    const dir = await persona('dir@x.co', 'Director Comercial')
    await persona('co@x.co', null, ['Comercial'])
    await espera('En espera de SKU inventario')
    await avisarSalidasEsperas(db, mas(20))
    expect(await destinos()).toEqual([dir])
  })

  it('Solicitado sin cargos técnicos: respaldo al área Servicio Técnico', async () => {
    await persona('dc@x.co', 'Director Comercial')
    const st = await persona('st@x.co', null, ['Servicio Técnico'])
    await espera('Solicitado')
    await avisarSalidasEsperas(db, mas(13))
    expect(await destinos()).toEqual([st])
  })

  it('el derivado se suma sólo en las externas, sólo si es de Comercial y está activo, y sin duplicar', async () => {
    const dir = await persona('dir@x.co', 'Director Comercial')
    const otra = await persona('otra@x.co', null, ['Servicio Técnico'])
    const baja = await persona('baja@x.co', null, ['Comercial']); await updateUser(db, baja, { active: false })
    await espera('Servicio externo', ENTRADA, otra); await espera('Servicio externo', ENTRADA, baja); await espera('Servicio externo', ENTRADA, dir)
    await espera('En espera de SKU inventario', ENTRADA, await persona('com@x.co', null, ['Comercial']))
    await avisarSalidasEsperas(db, mas(31))
    const a = await avisos()
    expect(a.filter((x) => x.ticket_id === 't1').map((x) => x.user_id)).toEqual([dir])
    expect(a.filter((x) => x.ticket_id === 't2').map((x) => x.user_id)).toEqual([dir])
    expect(a.filter((x) => x.ticket_id === 't3').map((x) => x.user_id)).toEqual([dir])
    expect(a.filter((x) => x.ticket_id === 't4').map((x) => x.user_id), 'una interna no suma al derivado').toEqual([dir])
  })

  it('sin nadie, no marca y avisa en el log; cuando aparece un destinatario, la pasada siguiente avisa (S-18)', async () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => logger)
    await espera('Servicio externo')
    expect(await avisarSalidasEsperas(db, mas(31))).toBe(0)
    expect(await marcas()).toEqual([])
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
    await persona('dir@x.co', 'Director Comercial')
    expect(await avisarSalidasEsperas(db, mas(32))).toBe(1)
  })
})

describe('avisarSalidasEsperas · nunca ejecuta una salida (RQ-AV-26)', () => {
  it('dos pasadas sobre un vencido en cada espera: ningún estado cambia y la traza no gana filas', async () => {
    await persona('dc@x.co', 'Director Comercial'); await persona('dt@x.co', 'Director Técnico')
    const estados = ['En Espera de Repuestos', 'Solicitado', 'Servicio externo', 'En espera de SKU inventario']
    for (const e of estados) await espera(e)
    const antes = (await db.query('SELECT * FROM ticket_transitions')).rows.length
    await avisarSalidasEsperas(db, mas(200)); await avisarSalidasEsperas(db, mas(201))
    expect((await db.query('SELECT status FROM tickets ORDER BY id')).rows.map((r) => r.status)).toEqual(estados)
    expect((await db.query('SELECT * FROM ticket_transitions')).rows).toHaveLength(antes)
  })

  it('fuente: los dos ficheros nuevos no importan el motor ni escriben en tickets ni en la traza', () => {
    for (const f of ['./avisoSalidasEsperas.ts', '../db/esperasVencidas.ts']) {
      const fuente = readFileSync(fileURLToPath(new URL(f, import.meta.url)), 'utf8')
      expect(fuente, f).not.toMatch(/ticketService|applyTransition|writeTransition/)
      expect(fuente, f).not.toContain('UPDATE tickets')
      expect(fuente, f).not.toContain('INSERT INTO ticket_transitions')
    }
  })
})

describe('pasadaSalidasEsperas', () => {
  it('apagado no corre, no crea avisos ni marcas y no consume el día', async () => {
    await persona('dir@x.co', 'Director Comercial')
    await espera('Servicio externo')
    await pasadaSalidasEsperas(db, { salidasEsperas: false }, mas(40))
    expect(await avisos()).toEqual([]); expect(await marcas()).toEqual([])
    await pasadaSalidasEsperas(db, { salidasEsperas: true }, mas(40))
    expect(await avisos(), 'el mismo día, ya encendido, evalúa').toHaveLength(1)
  })

  it('evalúa como mucho una vez por día civil y no lanza aunque la base falle', async () => {
    await persona('dir@x.co', 'Director Comercial')
    await espera('Servicio externo')
    await pasadaSalidasEsperas(db, { salidasEsperas: true }, mas(100))
    await espera('Servicio externo')
    await pasadaSalidasEsperas(db, { salidasEsperas: true }, mas(100))
    expect(await avisos(), 'mismo día: no vuelve a evaluar').toHaveLength(1)
    await pasadaSalidasEsperas(db, { salidasEsperas: true }, mas(101))
    expect(await avisos(), 'día siguiente: avisa el nuevo').toHaveLength(2)
    const error = vi.spyOn(logger, 'error').mockImplementation(() => logger)
    const rota = { query: () => Promise.reject(new Error('caída')) } as unknown as Queryable
    await expect(pasadaSalidasEsperas(rota, { salidasEsperas: true }, mas(102))).resolves.toBeUndefined()
    expect(error).toHaveBeenCalled()
    error.mockRestore()
  })
})
