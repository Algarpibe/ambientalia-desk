import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import { ALARMAS_SLA } from '@ambientalia/shared'
import { marcarYAvisarAlarma, pasadaAlarmas } from './alarmasSla'
import { createRole, actualizarRecibeAvisos } from '../auth/roles'
import { createUser } from '../auth/users'
import { logger } from '../util/logger'

/**
 * alarmas-horas-habiles (F1B-08, lote 3) · la pasada de alarmas de SLA vencido.
 *
 * `derivacion-avisos` RQ-AV-15..17. Tres cosas se prueban aquí y no en `db/sla.test.ts`: que cada entrada vencida se
 * avise UNA vez aunque dos evaluaciones coincidan (la clave primaria de `public.alarmas_avisadas`), que lo vencido
 * antes del corte de la primera pasada se marque SIN avisar (S-13), y a quién va el aviso cuando nadie tiene el cargo
 * (S-4). Atomicidad por ESTRUCTURA: pg-mem no revierte un `ROLLBACK` (`db/transaccion.test.ts:25`), así que se mira
 * que la marca y los avisos vayan por el MISMO cliente entre `BEGIN` y `COMMIT`.
 *
 * Fechas de 2026 en Bogotá (UTC-5), escritas en UTC. Jornada 08:00-17:00.
 */
let db: Queryable
let eventos: string[]
beforeEach(async () => {
  const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db)
  eventos = []
  // Registro de lo que pasa por los clientes de transacción: la estructura BEGIN → marca → avisos → COMMIT.
  const pool = db as unknown as { connect: () => Promise<{ query: (t: string, p?: unknown[]) => Promise<unknown> }> }
  const connect = pool.connect.bind(pool)
  const envueltos = new WeakSet<object>() // pg-mem reutiliza el mismo cliente: se envuelve una sola vez
  pool.connect = async () => {
    const c = await connect()
    if (!envueltos.has(c)) {
      envueltos.add(c); const q = c.query.bind(c)
      c.query = (t: string, p?: unknown[]) => { eventos.push(resumen(t)); return q(t, p) }
    }
    return c
  }
})
afterEach(() => { vi.restoreAllMocks() })

function resumen(sql: string): string {
  if (/alarmas_avisadas/.test(sql)) return 'marca'
  if (/INSERT INTO avisos/.test(sql)) return 'aviso'
  return sql.trim().split(/\s+/)[0]!.toUpperCase()
}

const CONFIG = { avisosWebhookUrl: 'http://n8n.local/avisos', avisosWebhookToken: 't', appBaseUrl: 'http://app', avisosCopiaEmail: '' } as unknown as AppConfig
const LUNES8 = '2026-09-14T13:00:00.000Z'
const JUEVES10 = new Date('2026-09-17T15:00:00.000Z')

const ticket = async (id: string, number: number, status: string, entrada: string, ov: { orden_venta?: string } = {}) => {
  await db.query('INSERT INTO tickets (id, number, subject, status, orden_venta) VALUES ($1,$2,$3,$4,$5)', [id, number, 'SLA', status, ov.orden_venta ?? null])
  await db.query('INSERT INTO ticket_transitions (ticket_id, transition_id, to_status, performed_at) VALUES ($1,$2,$3,$4)', [id, 'x', status, new Date(entrada)])
}
const conCargo = (email: string, cargo: string) => createUser(db, { email, name: email, passwordHash: 'h', cargo })
const receptorComercial = async (email: string) => {
  const rol = await createRole(db, { name: `Comercial ${email}`, areas: ['Comercial'] })
  await actualizarRecibeAvisos(db, rol.id, true)
  return createUser(db, { email, name: email, passwordHash: 'h', roleId: rol.id })
}
/** Un corte muy anterior: nada de lo vencido en estas pruebas cae antes de él. */
const corteAntiguo = () => db.query("INSERT INTO public.alarmas_corte (id, corte_at) VALUES (1, '2026-01-01T00:00:00Z')")
const avisosDe = async (userId: string) => (await db.query('SELECT texto, enviado_at FROM avisos WHERE user_id = $1', [userId])).rows as Array<{ texto: string; enviado_at: unknown }>
const marcas = async () => (await db.query('SELECT ticket_id, estado, avisos_creados FROM public.alarmas_avisadas ORDER BY ticket_id')).rows
const fetchOk = () => vi.fn(async () => { eventos.push('fetch'); return new Response('{}', { status: 200 }) })
const warnsSinCargo = (espia: ReturnType<typeof vi.spyOn>) => espia.mock.calls.filter((c) => String(c[1] ?? c[0]).includes('sin Coordinador Comercial'))

describe('marcarYAvisarAlarma · la marca va PRIMERO y la unicidad la da la clave primaria (H1 corregida)', () => {
  const v = { id: 't1', estado: 'Notificado' as const, desde: new Date(LUNES8) }
  const dos = [{ id: 'u1' }, { id: 'u2' }]

  it('(a) dos llamadas seguidas: una marca y un solo juego de avisos', async () => {
    expect(await marcarYAvisarAlarma(db, v, dos, 'texto')).toHaveLength(2)
    expect(await marcarYAvisarAlarma(db, v, dos, 'texto')).toBeNull()
    expect(Number((await db.query('SELECT count(*) AS n FROM avisos')).rows[0].n)).toBe(2)
    expect(await marcas()).toEqual([{ ticket_id: 't1', estado: 'Notificado', avisos_creados: 2 }])
  })

  it('(b) con la marca ya presente: cero avisos y ningún error hacia fuera', async () => {
    await db.query('INSERT INTO public.alarmas_avisadas (ticket_id, estado, entrada_at, avisos_creados) VALUES ($1,$2,$3,0)', ['t1', 'Notificado', v.desde])
    await expect(marcarYAvisarAlarma(db, v, dos, 'texto')).resolves.toBeNull()
    expect(Number((await db.query('SELECT count(*) AS n FROM avisos')).rows[0].n)).toBe(0)
  })

  it('(E) estructura: BEGIN → marca → avisos → COMMIT por el mismo cliente; si la marca ya existe, ROLLBACK sin avisos', async () => {
    await marcarYAvisarAlarma(db, v, dos, 'texto')
    expect(eventos).toEqual(['BEGIN', 'marca', 'aviso', 'aviso', 'COMMIT'])
    eventos.length = 0
    await marcarYAvisarAlarma(db, v, dos, 'texto')
    expect(eventos).toEqual(['BEGIN', 'marca', 'ROLLBACK'])
  })

  it('un error que no es de clave duplicada sí sale, y la transacción se revierte sin COMMIT', async () => {
    await expect(marcarYAvisarAlarma(db, v, [{ id: null as unknown as string }], 'texto')).rejects.toThrow()
    expect(eventos).toContain('ROLLBACK')
    expect(eventos).not.toContain('COMMIT')
  })
})

describe('pasadaAlarmas · el corte de la primera pasada (S-13)', () => {
  it('lo vencido en el corte se marca SIN avisar ni mandar correo; lo que vence después avisa normal', async () => {
    const coord = await conCargo('coord@x.co', 'Coordinador Comercial')
    await ticket('tA', 700, 'Notificado', LUNES8)                    // vencido ya en el corte
    await ticket('tB', 701, 'Notificado', '2026-09-17T14:00:00.000Z') // 1 h en el corte: no vencido
    const f = fetchOk()
    await pasadaAlarmas(db, CONFIG, JUEVES10, f)
    const corte = (await db.query('SELECT corte_at FROM public.alarmas_corte')).rows
    expect(corte.map((r: { corte_at: Date }) => new Date(r.corte_at).getTime())).toEqual([JUEVES10.getTime()])
    expect(await marcas()).toEqual([{ ticket_id: 'tA', estado: 'Notificado', avisos_creados: 0 }])
    expect(await avisosDe(coord.id)).toEqual([])
    expect(f).not.toHaveBeenCalled()

    await pasadaAlarmas(db, CONFIG, new Date('2026-09-18T17:00:00.000Z'), f) // viernes 12:00: tB lleva 12 h hábiles
    expect(await marcas()).toEqual([
      { ticket_id: 'tA', estado: 'Notificado', avisos_creados: 0 },
      { ticket_id: 'tB', estado: 'Notificado', avisos_creados: 1 },
    ])
    const [aviso] = await avisosDe(coord.id)
    expect(aviso!.texto).toMatch(/#701.*9 horas hábiles.*«Notificado»/)
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('S46: un reinicio no mueve el corte, y lo vencido después de él avisa', async () => {
    const T0 = new Date('2026-09-15T13:00:00.000Z')
    await db.query('INSERT INTO public.alarmas_corte (id, corte_at) VALUES (1, $1)', [T0])
    const coord = await conCargo('coord@x.co', 'Coordinador Comercial')
    await ticket('tC', 702, 'Notificado', '2026-09-15T14:00:00.000Z') // entra después del corte
    await pasadaAlarmas(db, CONFIG, JUEVES10, fetchOk()) // un proceso nuevo: la primera pasada tras el arranque
    const corte = (await db.query('SELECT corte_at FROM public.alarmas_corte')).rows
    expect(corte.map((r: { corte_at: Date }) => new Date(r.corte_at).getTime())).toEqual([T0.getTime()])
    expect(await avisosDe(coord.id)).toHaveLength(1)
  })
})

describe('pasadaAlarmas · a quién va el aviso (S-4, los dos caminos)', () => {
  beforeEach(async () => { await corteAntiguo() })

  it('S25: con alguien en el cargo, avisa sólo al cargo y no al área, sin warn', async () => {
    const warn = vi.spyOn(logger, 'warn')
    const coord = await conCargo('coord@x.co', 'Coordinador Comercial')
    const comercial = await receptorComercial('ana@x.co')
    await ticket('t1', 710, 'Notificado', LUNES8)
    await pasadaAlarmas(db, CONFIG, JUEVES10, fetchOk())
    expect([(await avisosDe(coord.id)).length, (await avisosDe(comercial.id)).length]).toEqual([1, 0])
    expect(warnsSinCargo(warn)).toHaveLength(0)
  })

  it('S24: sin nadie en el cargo, avisa al área Comercial con UN warn «sin Coordinador Comercial», también tras otra pasada', async () => {
    const warn = vi.spyOn(logger, 'warn')
    await conCargo('otro@x.co', 'Coord. Comercial') // texto libre que NO casa
    const comercial = await receptorComercial('ana@x.co')
    await ticket('t1', 711, 'Notificado', LUNES8)
    await pasadaAlarmas(db, CONFIG, JUEVES10, fetchOk())
    await pasadaAlarmas(db, CONFIG, new Date(JUEVES10.getTime() + 3_600_000), fetchOk())
    expect(await avisosDe(comercial.id)).toHaveLength(1)
    expect(await marcas()).toEqual([{ ticket_id: 't1', estado: 'Notificado', avisos_creados: 1 }])
    expect(warnsSinCargo(warn)).toHaveLength(1)
  })

  it('dos pasadas CONCURRENTES (las dos leen «sin marca»): un solo juego de avisos y un solo warn', async () => {
    const warn = vi.spyOn(logger, 'warn')
    const comercial = await receptorComercial('ana@x.co')
    await ticket('t1', 715, 'Notificado', LUNES8)
    await Promise.all([pasadaAlarmas(db, CONFIG, JUEVES10, fetchOk()), pasadaAlarmas(db, CONFIG, JUEVES10, fetchOk())])
    expect(await avisosDe(comercial.id)).toHaveLength(1)
    expect(warnsSinCargo(warn)).toHaveLength(1)
  })

  it('sin nadie ni en el cargo ni en el área: marca con cero avisos y el mismo warn', async () => {
    const warn = vi.spyOn(logger, 'warn')
    await ticket('t1', 712, 'Notificado', LUNES8)
    await pasadaAlarmas(db, CONFIG, JUEVES10, fetchOk())
    expect(await marcas()).toEqual([{ ticket_id: 't1', estado: 'Notificado', avisos_creados: 0 }])
    expect(warnsSinCargo(warn)).toHaveLength(1)
  })

  it('S15: el cargo es el que declara ALARMAS_SLA, no uno fijo en el servicio', async () => {
    const original = ALARMAS_SLA['Notificado']!.cargo
    try {
      ALARMAS_SLA['Notificado']!.cargo = 'Director Técnico'
      const director = await conCargo('dir@x.co', 'Director Técnico')
      const coord = await conCargo('coord@x.co', 'Coordinador Comercial')
      await ticket('t1', 713, 'Notificado', LUNES8)
      await pasadaAlarmas(db, CONFIG, JUEVES10, fetchOk())
      expect([(await avisosDe(director.id)).length, (await avisosDe(coord.id)).length]).toEqual([1, 0])
    } finally {
      ALARMAS_SLA['Notificado']!.cargo = original
    }
  })

  it('Remisión creada con orden de venta no deja marca ni aviso', async () => {
    const coord = await conCargo('coord@x.co', 'Coordinador Comercial')
    await ticket('t1', 714, 'Remisión creada', LUNES8, { orden_venta: 'SO-1' })
    await pasadaAlarmas(db, CONFIG, JUEVES10, fetchOk())
    expect([await marcas(), await avisosDe(coord.id)]).toEqual([[], []])
  })
})

describe('pasadaAlarmas · correo después de la transacción, y nunca lanza', () => {
  beforeEach(async () => { await corteAntiguo() })

  it('el correo sale en UN lote, después de todos los COMMIT, y sella enviado_at', async () => {
    const coord = await conCargo('coord@x.co', 'Coordinador Comercial')
    await ticket('t1', 720, 'Notificado', LUNES8)
    await ticket('t2', 721, 'Remisión creada', LUNES8)
    const f = fetchOk()
    await pasadaAlarmas(db, CONFIG, JUEVES10, f)
    expect(f).toHaveBeenCalledTimes(1)
    expect(JSON.parse(String((f.mock.calls[0] as unknown[])[1] && ((f.mock.calls[0] as unknown[])[1] as RequestInit).body)).avisos).toHaveLength(2)
    expect(eventos.indexOf('fetch')).toBeGreaterThan(eventos.lastIndexOf('COMMIT'))
    expect((await avisosDe(coord.id)).every((a) => a.enviado_at != null)).toBe(true)
  })

  it('si el correo falla, el aviso y la marca quedan, enviado_at queda NULL y la pasada no lanza', async () => {
    const coord = await conCargo('coord@x.co', 'Coordinador Comercial')
    await ticket('t1', 722, 'Notificado', LUNES8)
    const cae = vi.fn(async () => { throw new Error('n8n caído') })
    await expect(pasadaAlarmas(db, CONFIG, JUEVES10, cae as unknown as typeof fetch)).resolves.toBeUndefined()
    expect((await avisosDe(coord.id)).map((a) => a.enviado_at)).toEqual([null])
    expect(await marcas()).toHaveLength(1)
  })

  it('un fallo en un ticket no impide avisar el siguiente', async () => {
    const coord = await conCargo('coord@x.co', 'Coordinador Comercial')
    await ticket('tA', 723, 'Notificado', LUNES8)
    await ticket('tB', 724, 'Notificado', LUNES8)
    const conFallo: Queryable = {
      query: (t: string, p?: unknown[]) => (/INSERT INTO avisos/.test(t) && p?.[2] === 'tA' ? Promise.reject(new Error('x')) : db.query(t, p)),
    }
    await pasadaAlarmas(conFallo, CONFIG, JUEVES10, fetchOk())
    expect((await avisosDe(coord.id)).map((a) => a.texto)).toEqual([expect.stringContaining('#724')])
  })

  it('con la base caída, la pasada resuelve sin lanzar y deja un logger.error', async () => {
    const error = vi.spyOn(logger, 'error')
    const rota: Queryable = { query: (() => { throw new Error('base caída') }) as Queryable['query'] }
    await expect(pasadaAlarmas(rota, CONFIG, JUEVES10, fetchOk())).resolves.toBeUndefined()
    expect(error).toHaveBeenCalled()
  })
})

describe('index.ts · la pasada de alarmas va encadenada en el setInterval (fichero vigilado)', () => {
  it('importa pasadaAlarmas y el ORDEN es alarmas → ritmo → sincronización, en la misma cadena', () => {
    const texto = readFileSync(fileURLToPath(new URL('../index.ts', import.meta.url)), 'utf8')
    expect(texto).toMatch(/import\s*\{[^}]*\bpasadaAlarmas\b[^}]*\}\s*from\s*['"]\.\/services\/alarmasSla['"]/)
    const cuerpo = /setInterval\(\s*\(\)\s*=>\s*\{([\s\S]*?)\n\s*\},\s*config\.syncIntervalMs\s*\)/.exec(texto)?.[1] ?? ''
    const conSync = cuerpo.split(/\r?\n/).filter((l) => l.includes('sync.syncRecent()'))
    expect(conSync).toHaveLength(1)
    const [linea] = conSync
    const pos = ['pasadaAlarmas(pool, config)', 'pasadaRitmoContratos(pool)', 'sync.syncRecent()'].map((s) => linea!.indexOf(s))
    expect(pos.every((p) => p >= 0), `falta alguna de las tres llamadas en: ${linea}`).toBe(true)
    expect([...pos].sort((a, b) => a - b)).toEqual(pos)
  })
})
