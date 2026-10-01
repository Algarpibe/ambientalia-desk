import { describe, it, expect, vi, afterEach } from 'vitest'
import request from 'supertest'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { transicionPorId, type Cargo } from '@ambientalia/shared'
import { HttpError } from '../util/httpError'
import { executeTransition } from './ticketService'
import { db, instalarArnes, appWith, adminCookie, valoresValidos } from '../testing/appHarness'

/**
 * GUARDA DE VERIFICACIÓN POR GAS PATRÓN Y CERTIFICADO DE FÁBRICA (F1A-03, lote 2; `transitions-equipo-nuevo`
 * RQ-EN-08 a RQ-EN-12, `gases-patron` RQ-GP-03 a RQ-GP-05), a nivel de unidad sobre `executeTransition`.
 *
 * Las pruebas de POSICIÓN (EN08-7, EN08-8, EN08-9, EN10-9) activan DOS guardas a la vez, a propósito: con una sola,
 * mover la guarda de sitio no rompería nada (regla de mutación 1 de `CLAUDE.md`).
 */
instalarArnes()
afterEach(() => { vi.useRealTimers() })

type Sujeto = { areas: string[]; isAdmin: boolean; cargoPermiso?: Cargo | null; name: string; id: string }
const ADMIN: Sujeto = { areas: [], isAdmin: true, name: 'Admin', id: 'u-admin' }
const SERVICIO: Sujeto = { areas: ['Servicio Técnico'], isAdmin: false, name: 'Tec', id: 'u-tec' }
const COMERCIAL: Sujeto = { areas: ['Comercial'], isAdmin: false, name: 'Com', id: 'u-com' }

const LIBERACION = 'liberacion'
const MANANA = '2099-01-01'
const AYER = '2020-01-01'

async function fallo(fn: () => Promise<unknown>): Promise<{ status: number; body: Record<string, unknown> }> {
  try { await fn() } catch (e) {
    if (e instanceof HttpError) return { status: e.status, body: e.body as Record<string, unknown> }
    throw e
  }
  throw new Error('se esperaba un HttpError y la llamada no lanzó ninguno')
}

/** Ticket del flujo `Equipo nuevo`; con `compuesto` crea además su equipo (`undefined` → sin equipo). */
async function ticket(estado: string, compuesto?: string | null): Promise<void> {
  const conEquipo = compuesto !== undefined
  if (conEquipo) await db.query('INSERT INTO equipos (id, serial, compuesto) VALUES ($1,$2,$3)', ['e1', 'SER-1', compuesto])
  await db.query(
    "INSERT INTO tickets (id, number, subject, status, classification, equipo_id) VALUES ('t1', 9300, 'Guarda de gas patrón', $1, 'Equipo nuevo', $2)",
    [estado, conEquipo ? 'e1' : null],
  )
}
let cilindros = 0
async function gas(compuesto: string, over: { disponible?: boolean; vence?: string } = {}): Promise<void> {
  await db.query(
    'INSERT INTO public.gases_patron (cilindro, compuesto, disponible, vence, registrado_por) VALUES ($1,$2,$3,$4,$5)',
    [`CIL-${++cilindros}`, compuesto, over.disponible ?? true, over.vence ?? MANANA, 'director'],
  )
}
const liberar = (values: Record<string, unknown> = {}, quien: Sujeto = SERVICIO, cliente: Queryable = db) =>
  executeTransition(cliente, 't1', { transitionId: LIBERACION, values: { comment: 'x', ...values } }, quien)
const estado = async () => ((await db.query("SELECT status FROM tickets WHERE id='t1'")).rows[0] as { status: string }).status
const trazas = async () => (await db.query("SELECT 1 FROM ticket_transitions WHERE ticket_id='t1'")).rows.length
const valoresGuardados = async () => {
  const v = (await db.query("SELECT values FROM ticket_transitions WHERE ticket_id='t1' ORDER BY id DESC LIMIT 1")).rows[0].values
  return (typeof v === 'string' ? JSON.parse(v) : v) as Record<string, unknown>
}

describe('RQ-EN-08 · el 409 de Verificación', () => {
  it('EN08-1 · compuesto y patrón vigente desde En Proceso: 409 que nombra Verificación, sin cambio ni traza', async () => {
    await ticket('En Proceso', 'SO₂'); await gas('SO₂')
    const r = await fallo(() => liberar({ certificado_fabrica: 'CF-1' }))
    expect(r.status).toBe(409)
    expect(String(r.body.error)).toContain('Verificación')
    expect(await estado()).toBe('En Proceso')
    expect(await trazas()).toBe(0)
  })
  it('EN08-2 · desde Verificación con el mismo equipo y patrón: 200', async () => {
    await ticket('Verificación', 'SO₂'); await gas('SO₂')
    await liberar({ certificado_fabrica: 'CF-1' })
    expect(await estado()).toBe('Finalizado')
  })
  it('EN08-3 · equipo sin compuesto con patrones vigentes: 200', async () => {
    await ticket('En Proceso', null); await gas('SO₂'); await gas('CO')
    await liberar()
    expect(await estado()).toBe('Finalizado')
  })
  it('EN08-4 · ticket sin equipo: 200', async () => {
    await ticket('En Proceso'); await gas('SO₂')
    await liberar()
    expect(await estado()).toBe('Finalizado')
  })
  it('EN08-5 · el patrón vigente de otro compuesto no bloquea: 200', async () => {
    await ticket('En Proceso', 'CO'); await gas('SO₂')
    await liberar({ certificado_fabrica: 'CF-1' })
    expect(await estado()).toBe('Finalizado')
  })
  it('EN08-6 · `verificacion` no se bloquea', async () => {
    await ticket('En Proceso', 'SO₂'); await gas('SO₂')
    await executeTransition(db, 't1', { transitionId: 'verificacion', values: { comment: 'x' } }, SERVICIO)
    expect(await estado()).toBe('Verificación')
  })
  it('EN08-7 · POSICIÓN: el 409 de estado de origen gana (por mensaje) a la guarda de Verificación', async () => {
    await ticket('Ingresado', 'SO₂'); await gas('SO₂')
    const r = await fallo(() => liberar({ certificado_fabrica: 'CF-1' }))
    expect(r.status).toBe(409)
    expect(String(r.body.error)).toContain('no aplica desde el estado')
  })
  it('EN08-8 · POSICIÓN: el 403 de área gana a la guarda de Verificación', async () => {
    await ticket('En Proceso', 'SO₂'); await gas('SO₂')
    const r = await fallo(() => liberar({ certificado_fabrica: 'CF-1' }, COMERCIAL))
    expect(r.status).toBe(403)
  })
  it('EN08-9 · POSICIÓN: la guarda gana al 422 del certificado (sin número y con patrón vigente: 409)', async () => {
    await ticket('En Proceso', 'SO₂'); await gas('SO₂')
    const r = await fallo(() => liberar())
    expect(r.status).toBe(409)
    expect(String(r.body.error)).toContain('Verificación')
  })
  it('GP03-4 · el día es el de Bogotá: a las 03:00Z del 2 de octubre un gas que vence el 1 sigue vigente y bloquea', async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-02T03:00:00Z'))
    await ticket('En Proceso', 'SO₂'); await gas('SO₂', { vence: '2026-10-01' })
    const r = await fallo(() => liberar({ certificado_fabrica: 'CF-1' }))
    expect(r.status).toBe(409)
  })
})

describe('RQ-EN-09 · sin patrón vigente la liberación pasa con motivo', () => {
  const MOTIVO = 'Sin gas patrón vigente de SO₂'
  it.each<[string, () => Promise<void>]>([
    ['EN09-1 · tabla vacía', async () => {}],
    ['EN09-2 · gas vencido', async () => { await gas('SO₂', { vence: AYER }) }],
    ['EN09-3 · gas no disponible', async () => { await gas('SO₂', { disponible: false }) }],
  ])('%s: 200 con el motivo en `values`', async (_n, preparar) => {
    await ticket('En Proceso', 'SO₂'); await preparar()
    await liberar({ certificado_fabrica: 'CF-1' })
    expect(await estado()).toBe('Finalizado')
    expect((await valoresGuardados()).motivo_sin_verificacion).toBe(MOTIVO)
  })
  it('EN09-4 · sin equipo, sin compuesto o desde Verificación no hay motivo', async () => {
    for (const [i, [desde, compuesto]] of ([['En Proceso', undefined], ['En Proceso', null], ['Verificación', 'SO₂']] as const).entries()) {
      await db.query('DELETE FROM ticket_transitions'); await db.query('DELETE FROM tickets'); await db.query('DELETE FROM equipos')
      await ticket(desde, compuesto)
      await liberar(desde === 'Verificación' ? { certificado_fabrica: 'CF-1' } : {})
      expect(Object.keys(await valoresGuardados()), `caso ${i}`).not.toContain('motivo_sin_verificacion')
    }
  })
  it('EN09-5 · el motivo lo impone el servidor: con cuerpo propio y sin cuerpo', async () => {
    await ticket('En Proceso', 'SO₂')
    await liberar({ certificado_fabrica: 'CF-1', motivo_sin_verificacion: 'texto forjado' })
    expect((await valoresGuardados()).motivo_sin_verificacion).toBe(MOTIVO)
  })
  it('EN09-5b · y un motivo forjado sin guarda que explicar se descarta', async () => {
    await ticket('Verificación', 'SO₂')
    await liberar({ certificado_fabrica: 'CF-1', motivo_sin_verificacion: 'texto forjado' })
    expect(Object.keys(await valoresGuardados())).not.toContain('motivo_sin_verificacion')
  })
  it('EN09-6 · la tabla se lee en cada ejecución: 422, luego un gas, luego 409', async () => {
    await ticket('En Proceso', 'SO₂')
    expect((await fallo(() => liberar())).status).toBe(422)
    await gas('SO₂')
    expect((await fallo(() => liberar())).status).toBe(409)
  })
  it('EN09-7 · compuesto no reconocido en el equipo: pasa con motivo que nombra XYZ', async () => {
    await ticket('En Proceso', 'XYZ'); await gas('SO₂')
    await liberar({ certificado_fabrica: 'CF-1' })
    expect((await valoresGuardados()).motivo_sin_verificacion).toBe('Sin gas patrón vigente de XYZ')
  })
})

describe('RQ-EN-10 · el certificado de fábrica, 422 escalón C', () => {
  it('EN10-1 · Verificación sin número: 422 que nombra el certificado, sin traza', async () => {
    await ticket('Verificación', 'SO₂')
    const r = await fallo(() => liberar())
    expect(r.status).toBe(422)
    expect(JSON.stringify(r.body)).toContain('certificado')
    expect(await estado()).toBe('Verificación')
    expect(await trazas()).toBe(0)
  })
  it('EN10-2 · sólo espacios equivale a faltar', async () => {
    await ticket('Verificación', 'SO₂')
    expect((await fallo(() => liberar({ certificado_fabrica: '   ' }))).status).toBe(422)
  })
  it('EN10-3 · con número: 200 y se guarda recortado', async () => {
    await ticket('Verificación', 'SO₂')
    await liberar({ certificado_fabrica: ' CF-2024-0117 ' })
    expect(await estado()).toBe('Finalizado')
    expect((await valoresGuardados()).certificado_fabrica).toBe('CF-2024-0117')
  })
  it('EN10-4 · Verificación sin equipo también lo exige', async () => {
    await ticket('Verificación')
    expect((await fallo(() => liberar())).status).toBe(422)
  })
  it('EN10-5 · En Proceso con compuesto y sin patrón: sin número 422, con número 200', async () => {
    await ticket('En Proceso', 'CO')
    expect((await fallo(() => liberar())).status).toBe(422)
    await liberar({ certificado_fabrica: 'CF-9' })
    expect(await estado()).toBe('Finalizado')
  })
  it.each<[string, string | null | undefined]>([['sin compuesto', null], ['sin equipo', undefined]])('EN10-6 · En Proceso %s: no se exige', async (_n, compuesto) => {
    await ticket('En Proceso', compuesto)
    await liberar()
    expect(await estado()).toBe('Finalizado')
  })
  it('EN10-7 · sólo se exige en liberacion: `rechazo_verificacion` sin número pasa', async () => {
    await ticket('Verificación', 'SO₂')
    await executeTransition(db, 't1', { transitionId: 'rechazo_verificacion', values: { comment: 'x' } }, SERVICIO)
    expect(await estado()).toBe('Notificado')
  })
  it('EN10-8 · un ticket que ya estaba en Verificación sin dato de certificado en su historial no se exime', async () => {
    await ticket('Verificación', 'SO₂')
    await db.query("INSERT INTO ticket_transitions (ticket_id, transition_name, from_status, to_status, performed_by, performed_at, values) VALUES ('t1','Verificación','En Proceso','Verificación','Tec',now(),'{}')")
    expect((await fallo(() => liberar())).status).toBe(422)
  })
  it('EN10-9 · POSICIÓN: Comercial en Verificación sin número recibe 403, no 422', async () => {
    await ticket('Verificación', 'SO₂')
    expect((await fallo(() => liberar({}, COMERCIAL))).status).toBe(403)
  })
})

describe('RQ-EN-01, RQ-EN-11, RQ-EN-12 · las salidas de Verificación y lo que no se toca', () => {
  it('EN01-5 · `liberacion` desde Verificación con número: 200', async () => {
    await ticket('Verificación', 'SO₂')
    await liberar({ certificado_fabrica: 'CF-1' })
    expect(await estado()).toBe('Finalizado')
  })
  it('EN01-6 · `rechazo_verificacion` desde Verificación: 200', async () => {
    await ticket('Verificación', 'SO₂')
    await executeTransition(db, 't1', { transitionId: 'rechazo_verificacion', values: { comment: 'x' } }, SERVICIO)
    expect(await estado()).toBe('Notificado')
  })
  it('EN11-1 · sin PDF adjunto la liberación pasa: el PDF no condiciona nada', async () => {
    await ticket('Verificación', 'SO₂')
    await liberar({ certificado_fabrica: 'CF-1' })
    expect(await estado()).toBe('Finalizado')
  })
  it('EN12-1 · `liberacion_sin_factura` con equipo SO₂ y patrón vigente: 200 sin certificado', async () => {
    await db.query("INSERT INTO equipos (id, serial, compuesto) VALUES ('e1','SER-1','SO₂')")
    await db.query("INSERT INTO tickets (id, number, subject, status, equipo_id) VALUES ('t1', 9300, 'Sin factura', 'Por Facturar', 'e1')")
    await gas('SO₂')
    const t = transicionPorId('liberacion_sin_factura')!
    await executeTransition(db, 't1', { transitionId: t.id, values: valoresValidos(t, 1) }, ADMIN)
    expect(await estado()).toBe('Por Entregar / Sin facturar')
  })
})

describe('RQ-GP-04, RQ-GP-05 · la consulta de gases', () => {
  it('GP04-3 · la consulta no escribe: las filas de gases_patron son las mismas antes y después', async () => {
    await ticket('En Proceso', 'SO₂'); await gas('SO₂', { vence: AYER })
    const antes = JSON.stringify((await db.query('SELECT * FROM public.gases_patron ORDER BY id')).rows)
    await liberar({ certificado_fabrica: 'CF-1' })
    expect(JSON.stringify((await db.query('SELECT * FROM public.gases_patron ORDER BY id')).rows)).toBe(antes)
  })
  it('GP05-1 · no existe ninguna ruta de escritura de gases: POST, PATCH y DELETE dan el 404 del comodín', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const comodin = await request(app).get('/api/gases-patron-que-no-existe').set('Cookie', cookie)
    expect(comodin.status).toBe(404)
    for (const metodo of ['post', 'patch', 'delete'] as const) {
      const r = await request(app)[metodo]('/api/gases-patron').set('Cookie', cookie).send({ cilindro: 'C', compuesto: 'SO₂', vence: MANANA })
      expect(r.status, metodo).toBe(404)
      expect(r.body).toEqual(comodin.body)
    }
  })
  it('m-11 · una consulta de gases sólo en liberacion, y una (no N+1) cuando la hay', async () => {
    await ticket('En Proceso', 'SO₂'); await gas('SO₂', { vence: AYER }); await gas('CO'); await gas('NH₃')
    const log: string[] = []
    const espia: Queryable = { query: (text, params) => { log.push(text); return db.query(text, params) } }
    await executeTransition(espia, 't1', { transitionId: 'verificacion', values: { comment: 'x' } }, SERVICIO)
    expect(log.filter((q) => /gases_patron/.test(q))).toHaveLength(0)
    log.length = 0
    await liberar({ certificado_fabrica: 'CF-1' }, SERVICIO, espia)
    expect(log.filter((q) => /gases_patron/.test(q)).length).toBeLessThanOrEqual(2)
    expect(log.filter((q) => /gases_patron/.test(q)).length).toBeGreaterThanOrEqual(1)
  })
})

describe('C-8 · el número del certificado vive en la traza y no se duplica en el ticket', () => {
  it('tickets.custom_fields no recibe `certificado_fabrica` (el sync lo pisaría y nadie lo lee)', async () => {
    await ticket('Verificación', 'SO₂')
    await liberar({ certificado_fabrica: 'CF-1' })
    const cf = (await db.query("SELECT custom_fields FROM tickets WHERE id='t1'")).rows[0].custom_fields
    expect(JSON.stringify(cf)).not.toContain('certificado_fabrica')
    expect((await valoresGuardados()).certificado_fabrica).toBe('CF-1')
  })
})
