import { describe, it, expect } from 'vitest'
import request from 'supertest'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { createUser } from './auth/users'
import { db, instalarArnes, appWith, adminCookie, userCookie } from './testing/appHarness'

instalarArnes()

/**
 * DECISIONALES POR CARGO (F1C-05, RQ-PM-28, RQ-PM-30 y RQ-PM-31), contra el servidor.
 *
 * Con `DECISIONALES_POR_CARGO` cerrado todo es como antes; abierto, una Decisional sólo la ejecuta el Director o el
 * Coordinador del área de la decisión (y el Especialista técnico mientras el Coordinador Técnico esté vacante). El `403`
 * nuevo va en `ticketService.ts:131`, detrás del `403` de cargo de la lista corta; los de POSICIÓN activan las dos guardas
 * a la vez (regla de mutación 1).
 */
const ESCALADO = 'escalado_a_revision'
const VALORES = { 'Días de entrega': 5 }   // sin `priority`: un Técnico no puede cambiarla (F1B-07) y el 403 de prioridad taparía el de Decisionales
const ST = ['Servicio Técnico']

async function ticket(id: string, status: string, number = 9100) {
  await db.query('INSERT INTO tickets (id, number, subject, status) VALUES ($1,$2,$3,$4)', [id, number, 'Decisionales por cargo', status])
}
const ejecutar = (app: ReturnType<typeof appWith>['app'], cookie: string, id: string, transitionId = ESCALADO, values: Record<string, unknown> = VALORES) =>
  request(app).post(`/api/tickets/${id}/transition`).set('Cookie', cookie).send({ transitionId, values })
const estadoDe = async (id: string) => ((await db.query('SELECT status FROM tickets WHERE id=$1', [id])).rows[0] as { status: string }).status
const encendido = () => appWith({ decisionalesPorCargo: true })
const coordinadorTecnico = (active = true) => createUser(db, { email: `coord${active ? '' : '-baja'}@x.co`, name: 'Coord', passwordHash: 'h', cargoPermiso: 'Coordinador Técnico' })
  .then(async (u) => { if (!active) await db.query('UPDATE users SET active=false WHERE id=$1', [u.id]); return u })

/** Un `db` que apunta las sentencias, para probar que apagado no se consulta el cargo de nadie. */
function espiado(): { db: Queryable; sqls: string[] } {
  const sqls: string[] = []
  return { sqls, db: { query: (text: string, params?: unknown[]) => { sqls.push(text); return db.query(text, params) } } as Queryable }
}
const CONSULTA_DE_VACANTE = /cargo_permiso\s*=\s*\$1/

describe('apagado (RQ-PM-28): todo como hoy', () => {
  it('CARACTERIZACIÓN · un Técnico ejecuta escalado_a_revision y el ticket avanza', async () => {
    await ticket('t1', 'Rev./Diagnostico')
    const res = await ejecutar(appWith().app, await userCookie(ST, 'Técnico'), 't1')
    expect(res.status, JSON.stringify(res.body)).toBe(200)
    expect(await estadoDe('t1')).toBe('Notificado')
  })

  it('no consulta quién tiene el cargo Coordinador Técnico, ni al ejecutar ni en la ruta de contexto', async () => {
    await ticket('t1', 'Rev./Diagnostico')
    const cookie = await userCookie(ST, 'Técnico')
    const e = espiado()
    const { app } = appWith({}, e.db)
    expect((await ejecutar(app, cookie, 't1')).status).toBe(200)
    expect((await request(app).get('/api/permisos/decisionales').set('Cookie', cookie)).status).toBe(200)
    expect(e.sqls.filter((s) => CONSULTA_DE_VACANTE.test(s))).toEqual([])
  })
})

describe('encendido (RQ-PM-30): el servidor impone la regla', () => {
  it('un Técnico recibe 403 que nombra los cargos, y el ticket no cambia', async () => {
    await ticket('t1', 'Rev./Diagnostico')
    const res = await ejecutar(encendido().app, await userCookie(ST, 'Técnico'), 't1')
    expect(res.status).toBe(403)
    expect(res.body.error).toBe('La transición "Escalado a Revisión" es Decisional: sólo la ejecutan los cargos Director Técnico, Coordinador Técnico, Especialista técnico')
    expect(await estadoDe('t1')).toBe('Rev./Diagnostico')
  })

  it('el Director Técnico pasa', async () => {
    await ticket('t1', 'Rev./Diagnostico')
    expect((await ejecutar(encendido().app, await userCookie(ST, 'Director Técnico'), 't1')).status).toBe(200)
  })

  it('el Especialista técnico pasa sin Coordinador Técnico activo (uno dado de baja no cuenta)', async () => {
    await ticket('t1', 'Rev./Diagnostico')
    await coordinadorTecnico(false)
    const res = await ejecutar(encendido().app, await userCookie(ST, 'Especialista técnico'), 't1')
    expect(res.status, JSON.stringify(res.body)).toBe(200)
  })

  it('el Especialista técnico recibe 403 con un Coordinador Técnico activo, y el mensaje ya no lo nombra', async () => {
    await ticket('t1', 'Rev./Diagnostico')
    await coordinadorTecnico()
    const res = await ejecutar(encendido().app, await userCookie(ST, 'Especialista técnico'), 't1')
    expect(res.status).toBe(403)
    expect(res.body.error).toBe('La transición "Escalado a Revisión" es Decisional: sólo la ejecutan los cargos Director Técnico, Coordinador Técnico')
  })

  it('las mixtas por su área de decisión: rechazo_revision no la ejecuta un Director Comercial; rechazo_comercial no la ejecuta un Director Técnico', async () => {
    await ticket('t1', 'Rev./Diagnostico', 9101); await ticket('t2', 'Notificación Comercial', 9102)
    const ambas = ['Comercial', 'Servicio Técnico']
    const { app } = encendido()
    const cookie = await userCookie(ambas, 'Director Comercial')
    const dc = await ejecutar(app, cookie, 't1', 'rechazo_revision', { comment: 'x' })
    expect(dc.status).toBe(403)
    expect(dc.body.error).toContain('Director Técnico')
    await db.query("UPDATE users SET cargo_permiso='Director Técnico' WHERE email='op@x.co'") // la sesión relee el cargo (RQ-PM-16)
    const dt = await ejecutar(app, cookie, 't2', 'rechazo_comercial', { comment: 'x' })
    expect(dt.status).toBe(403)
    expect(dt.body.error).toContain('Director Comercial')
  })

  it('el administrador sin cargo pasa', async () => {
    await ticket('t1', 'Rev./Diagnostico')
    expect((await ejecutar(encendido().app, await adminCookie(), 't1')).status).toBe(200)
  })
})

describe('posición del 403 nuevo (RQ-PM-30; regla de mutación 1, orden de F1B-10)', () => {
  it('el 409 de estado va antes: un Técnico con el ticket fuera de Rev./Diagnostico recibe 409', async () => {
    await ticket('t1', 'Notificado')
    expect((await ejecutar(encendido().app, await userCookie(ST, 'Técnico'), 't1')).status).toBe(409)
  })

  it('el 403 de área va antes: un usuario de Compras sin cargo recibe el 403 que nombra el área', async () => {
    await ticket('t1', 'Rev./Diagnostico')
    const res = await ejecutar(encendido().app, await userCookie(['Compras']), 't1')
    expect(res.status).toBe(403)
    expect(res.body.error).toBe('Tu rol no tiene permiso para esta transición (área: Servicio Técnico)')
  })

  it('el 403 de cargo de la lista corta manda en liberacion_sin_factura: un Comercial sin cargo recibe el de hoy, que nombra sólo al Director Comercial', async () => {
    await ticket('t1', 'Por Facturar')
    const res = await ejecutar(encendido().app, await userCookie(['Comercial']), 't1', 'liberacion_sin_factura', {})
    expect(res.status).toBe(403)
    expect(res.body.error).toBe('La transición "Liberación sin factura" sólo la ejecuta el cargo Director Comercial')
  })

  it('la lista corta no se relaja: un Coordinador Comercial sigue sin ejecutar liberacion_sin_factura', async () => {
    await ticket('t1', 'Por Facturar')
    const res = await ejecutar(encendido().app, await userCookie(['Comercial'], 'Coordinador Comercial'), 't1', 'liberacion_sin_factura', {})
    expect(res.status).toBe(403)
    expect(res.body.error).toContain('sólo la ejecuta el cargo Director Comercial')
  })

  it('el 403 nuevo va antes que un 422: un Técnico con un cuerpo inválido recibe 403; un Director Técnico, el 422', async () => {
    await ticket('t1', 'Rev./Diagnostico')
    const malo = { ...VALORES, derivado_a: 'no-existe' }
    const { app } = encendido()
    const cookie = await userCookie(ST, 'Técnico')
    expect((await ejecutar(app, cookie, 't1', ESCALADO, malo)).status).toBe(403)
    await db.query("UPDATE users SET cargo_permiso='Director Técnico' WHERE email='op@x.co'")
    const res = await ejecutar(app, cookie, 't1', ESCALADO, malo)
    expect(res.status).toBe(422)
    expect(res.body.errors).toEqual(['La persona a la que se deriva no existe o está dada de baja'])
  })
})

describe('la ruta de contexto (RQ-PM-31)', () => {
  const pedir = (app: ReturnType<typeof appWith>['app'], cookie?: string) => {
    const r = request(app).get('/api/permisos/decisionales')
    return cookie ? r.set('Cookie', cookie) : r
  }

  it('exige sesión', async () => {
    expect((await pedir(encendido().app)).status).toBe(401)
  })

  it('apagado responde el contexto apagado', async () => {
    const res = await pedir(appWith().app, await userCookie(ST, 'Técnico'))
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ activo: false, coordinadorTecnicoVacante: false })
  })

  it('encendido dice si el Coordinador Técnico está vacante, igual que la guarda', async () => {
    const cookie = await userCookie(ST, 'Técnico')
    const { app } = encendido()
    expect((await pedir(app, cookie)).body).toEqual({ activo: true, coordinadorTecnicoVacante: true })
    await coordinadorTecnico()
    expect((await pedir(app, cookie)).body).toEqual({ activo: true, coordinadorTecnicoVacante: false })
  })
})
