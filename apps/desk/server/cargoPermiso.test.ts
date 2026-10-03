import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { AREAS, TRANSITIONS, canExecuteTransition, transicionPorId } from '@ambientalia/shared'
import { createUser } from './auth/users'
import { createRole } from './auth/roles'
import { createSession } from './auth/sessions'
import { hashPassword } from './auth/passwords'
import { db, instalarArnes, appWith, adminCookie, userCookie, valoresValidos } from './testing/appHarness'; import { conRemisionVigente } from './testing/remisionDePrueba'

instalarArnes()

/**
 * PERMISOS POR CARGO (F1C-05, nivel CARGO), contra el servidor.
 *
 * El cargo sólo RESTRINGE: la única excepción de hoy es `liberacion_sin_factura`, que además del área
 * Comercial exige el cargo `Director Comercial` (`EXCEPCIONES_POR_CARGO`, `packages/shared/src/cargos.ts`).
 * El 403 de cargo lo lanza `ticketService.ts:131`, DETRÁS del de área (`:129-130`) y DELANTE del 422
 * (`:132-134`); los 409 de flujo y de estado (`:125-128`) corren antes que los dos.
 *
 * ⚠️ Las pruebas de POSICIÓN (regla de mutación 1) activan las dos guardas a la vez: con una sola, mover
 * la guarda de sitio no rompería nada y el orden declarado sería sólo un comentario.
 */
const T = transicionPorId('liberacion_sin_factura')!

async function ticket(id: string, number: number, status = 'Por Facturar', classification: string | null = null) {
  await db.query('INSERT INTO tickets (id, number, subject, status, classification) VALUES ($1,$2,$3,$4,$5)',
    [id, number, 'Cargo de permiso', status, classification])
}
const liberar = (app: ReturnType<typeof appWith>['app'], cookie: string, id: string, values: Record<string, unknown> = valoresValidos(T, 1)) =>
  request(app).post(`/api/tickets/${id}/transition`).set('Cookie', cookie).send({ transitionId: T.id, values })
const estadoDe = async (id: string) => ((await db.query('SELECT status FROM tickets WHERE id=$1', [id])).rows[0] as { status: string }).status
const cargoEnBase = async (email: string) => ((await db.query('SELECT cargo_permiso FROM users WHERE email=$1', [email])).rows[0] as { cargo_permiso: string | null }).cargo_permiso
const idDe = async (email: string) => ((await db.query('SELECT id FROM users WHERE email=$1', [email])).rows[0] as { id: string }).id

describe('sesión: el cargo de permiso llega a req.user', () => {
  it('S8 · una sesión real con cargo_permiso = Director Comercial lo lleva en /api/auth/me', async () => {
    const cookie = await userCookie(['Comercial'], 'Director Comercial')
    const { app } = appWith()
    const res = await request(app).get('/api/auth/me').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.cargoPermiso).toBe('Director Comercial')
  })
})

describe('alta y edición de usuarios: el cargo de permiso', () => {
  it('S5 · el alta con un cargo fuera de la lista da 422 y NO crea la fila', async () => {
    const admin = await adminCookie()
    const { app } = appWith()
    for (const malo of ['Gerente comercial', 'director comercial']) {
      const res = await request(app).post('/api/users').set('Cookie', admin)
        .send({ email: 'nuevo@x.co', name: 'Nuevo', password: 'password123', cargoPermiso: malo })
      expect(res.status, malo).toBe(422)
      expect(res.body.error).toContain('Director Comercial')
    }
    expect((await db.query("SELECT 1 FROM users WHERE email='nuevo@x.co'")).rows).toEqual([])
  })

  it('S5 + (k) · la edición con un cargo fuera de la lista da 422 y NO escribe nada: ni el cargo previo ni el resto del parche', async () => {
    const admin = await adminCookie()
    const { app } = appWith()
    const u = await createUser(db, { email: 'e@x.co', name: 'Original', passwordHash: 'h', cargoPermiso: 'Director Comercial' })
    const res = await request(app).patch(`/api/users/${u.id}`).set('Cookie', admin).send({ name: 'Cambiado', cargoPermiso: 'Gerente comercial' })
    expect(res.status).toBe(422)
    const fila = (await db.query('SELECT name, cargo_permiso FROM users WHERE id=$1', [u.id])).rows[0]
    expect(fila).toEqual({ name: 'Original', cargo_permiso: 'Director Comercial' })
  })

  it('S6 · un NO admin recibe 403 al crear usuarios con cargo y al fijarse el cargo a sí mismo; la columna no cambia', async () => {
    const cookie = await userCookie(['Comercial'])
    const { app } = appWith()
    const alta = await request(app).post('/api/users').set('Cookie', cookie)
      .send({ email: 'otro@x.co', name: 'Otro', password: 'password123', cargoPermiso: 'Director Comercial' })
    expect(alta.status).toBe(403)
    expect((await db.query("SELECT 1 FROM users WHERE email='otro@x.co'")).rows).toEqual([])

    const propio = await idDe('op@x.co')
    const parche = await request(app).patch(`/api/users/${propio}`).set('Cookie', cookie).send({ cargoPermiso: 'Director Comercial' })
    expect(parche.status).toBe(403)
    expect(await cargoEnBase('op@x.co')).toBeNull()
  })

  it('S7 · alta con cargo lo guarda, alta sin el campo da null, "" lo vacía y una edición sin el campo no lo borra', async () => {
    const admin = await adminCookie()
    const { app } = appWith()
    const con = await request(app).post('/api/users').set('Cookie', admin)
      .send({ email: 'con@x.co', name: 'Con', password: 'password123', cargoPermiso: ' Director Comercial ' })
    expect(con.status).toBe(201)
    expect(con.body.cargoPermiso).toBe('Director Comercial')
    const sin = await request(app).post('/api/users').set('Cookie', admin).send({ email: 'sin@x.co', name: 'Sin', password: 'password123' })
    expect(sin.status).toBe(201)
    expect(sin.body.cargoPermiso).toBeNull()

    await request(app).patch(`/api/users/${con.body.id}`).set('Cookie', admin).send({ name: 'Con 2' })
    expect(await cargoEnBase('con@x.co')).toBe('Director Comercial')
    const vaciar = await request(app).patch(`/api/users/${con.body.id}`).set('Cookie', admin).send({ cargoPermiso: '' })
    expect(vaciar.status).toBe(200)
    expect(await cargoEnBase('con@x.co')).toBeNull()
  })
})

describe('liberacion_sin_factura: el 403 de cargo', () => {
  it('S9 · Comercial sin cargo recibe 403 que nombra Director Comercial, y el ticket no cambia', async () => {
    await ticket('t-9', 95001)
    const { app } = appWith()
    const res = await liberar(app, await userCookie(['Comercial']), 't-9')
    expect(res.status).toBe(403)
    expect(res.body.error).toContain('Director Comercial')
    expect(res.body.error).toContain('Liberación sin factura')
    expect(await estadoDe('t-9')).toBe('Por Facturar')
  })

  it('S10 · Comercial + Director Comercial lo ejecuta: 200 y el ticket pasa a Por Entregar / Sin facturar', async () => {
    await ticket('t-10', 95002)
    const { app } = appWith()
    const res = await liberar(app, await userCookie(['Comercial'], 'Director Comercial'), 't-10')
    expect(res.status).toBe(200)
    expect(await estadoDe('t-10')).toBe('Por Entregar / Sin facturar')
  })

  it('S11 · otros cargos no bastan: Coordinador Comercial y Director Técnico dan 403', async () => {
    for (const [i, cargo] of (['Coordinador Comercial', 'Director Técnico'] as const).entries()) {
      const id = `t-11-${i}`
      await ticket(id, 95010 + i)
      const { app } = appWith()
      const u = await createUser(db, { email: `c${i}@x.co`, name: 'C', passwordHash: 'h', roleId: (await createRole(db, { name: `Rol-${i}`, areas: ['Comercial'] })).id, cargoPermiso: cargo })
      const res = await liberar(app, `sid=${await createSession(db, u.id)}`, id)
      expect(res.status, cargo).toBe(403)
      expect(res.body.error, cargo).toContain('Director Comercial')
    }
  })

  it('S17 · un cargo sin el área no concede: Servicio Técnico + Director Comercial da 403 de ÁREA', async () => {
    await ticket('t-17', 95020)
    const { app } = appWith()
    const res = await liberar(app, await userCookie(['Servicio Técnico'], 'Director Comercial'), 't-17')
    expect(res.status).toBe(403)
    expect(res.body.error).toContain('área: Comercial')
  })

  it('S4 (HTTP) · un valor fuera de la lista escrito por SQL no concede: 403', async () => {
    await ticket('t-4', 95030)
    const { app } = appWith()
    const cookie = await userCookie(['Comercial'], 'Director Comercial')
    await db.query("UPDATE users SET cargo_permiso = 'Gerente comercial' WHERE email='op@x.co'")
    const res = await liberar(app, cookie, 't-4')
    expect(res.status).toBe(403)
    expect(await estadoDe('t-4')).toBe('Por Facturar')
  })

  it('S2 · el cargo de FIRMA no da permiso: users.cargo = Director Comercial con cargo_permiso nulo da 403', async () => {
    await ticket('t-2', 95040)
    const { app } = appWith()
    const role = await createRole(db, { name: 'Rol-firma', areas: ['Comercial'] })
    const u = await createUser(db, { email: 'firma@x.co', name: 'Firma', passwordHash: 'h', roleId: role.id, cargo: 'Director Comercial' })
    const res = await liberar(app, `sid=${await createSession(db, u.id)}`, 't-2')
    expect(res.status).toBe(403)
    expect(res.body.error).toContain('Director Comercial')
  })

  it('S15 + S18 · con NADIE con cargo en la base, el Comercial no admin da 403 y el administrador 200', async () => {
    await ticket('t-18a', 95050)
    await ticket('t-18b', 95051)
    const { app } = appWith()
    const comercial = await userCookie(['Comercial'])
    const admin = await adminCookie()
    expect((await db.query('SELECT 1 FROM users WHERE cargo_permiso IS NOT NULL')).rows).toEqual([])
    const no = await liberar(app, comercial, 't-18a')
    expect(no.status).toBe(403)
    expect(no.body.error).toContain('Director Comercial')
    expect((await liberar(app, admin, 't-18b')).status).toBe(200)
  })

  it('S20 · la prohibición por área sigue: Compras ejecutando facturado da 403 y nombra el área', async () => {
    await ticket('t-20', 95060)
    const { app } = appWith()
    const res = await request(app).post('/api/tickets/t-20/transition').set('Cookie', await userCookie(['Compras']))
      .send({ transitionId: 'facturado', values: valoresValidos(transicionPorId('facturado')!, 2) })
    expect(res.status).toBe(403)
    expect(res.body.error).toContain('área: Comercial')
  })

  /**
   * CUÁNDO SURTE EFECTO un cambio de cargo. `requireAuth` llama a `getSessionUser` en CADA petición
   * (`auth/middleware.ts:18`) y éste hace el JOIN sessions↔users por token (`auth/sessions.ts:17-21`): la
   * sesión no guarda el cargo, lo relee. Esta prueba lo fija con la MISMA cookie, sin volver a entrar.
   */
  it('surte efecto en la siguiente petición, sin volver a entrar: el admin asigna el cargo y la MISMA cookie pasa de 403 a 200', async () => {
    await ticket('t-se-1', 95070)
    await ticket('t-se-2', 95071)
    const { app } = appWith()
    const comercial = await userCookie(['Comercial'])
    const admin = await adminCookie()
    expect((await liberar(app, comercial, 't-se-1')).status).toBe(403)

    const propio = await idDe('op@x.co')
    const asigna = await request(app).patch(`/api/users/${propio}`).set('Cookie', admin).send({ cargoPermiso: 'Director Comercial' })
    expect(asigna.status).toBe(200)
    expect(asigna.body.cargoPermiso).toBe('Director Comercial')

    expect((await request(app).get('/api/auth/me').set('Cookie', comercial)).body.cargoPermiso).toBe('Director Comercial')
    expect((await liberar(app, comercial, 't-se-2')).status).toBe(200)
  })
})

/**
 * POSICIÓN (regla de mutación 1). Orden de F1B-10: 400 · 404 y 409 de flujo (`ticketService.ts:125`) · 409
 * de estado (`:126-128`) · 403 de área (`:129-130`) · 403 de cargo (`:131`) · 422 (`:132-134`). Cada caso
 * activa las DOS guardas vecinas a la vez y compara el MENSAJE, no sólo el código.
 */
describe('liberacion_sin_factura: orden de las guardas', () => {
  it('P1 · el 403 de ÁREA gana al de cargo: Servicio Técnico sin cargo en Por Facturar oye «área: Comercial», no el cargo', async () => {
    await ticket('p-1', 96001)
    const { app } = appWith()
    const res = await liberar(app, await userCookie(['Servicio Técnico']), 'p-1')
    expect(res.status).toBe(403)
    expect(res.body.error).toContain('área: Comercial')
    expect(res.body.error).not.toContain('Director Comercial')
  })

  it('P2 · el 409 de ESTADO gana al 403 de cargo: Comercial sin cargo con el ticket fuera de Por Facturar', async () => {
    await ticket('p-2', 96002, 'Ingresado')
    const { app } = appWith()
    const res = await liberar(app, await userCookie(['Comercial']), 'p-2')
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('no aplica desde el estado')
  })

  it('P3 · el 409 de FLUJO gana al 403 de cargo: Comercial sin cargo con un ticket de Equipo nuevo', async () => {
    await ticket('p-3', 96003, 'Ingresado', 'Equipo nuevo')
    const { app } = appWith()
    const res = await liberar(app, await userCookie(['Comercial']), 'p-3')
    expect(res.status).toBe(409)
    expect(res.body.error).toContain('equipo nuevo')
  })

  it('P4 · el 403 de CARGO gana al 422: Comercial sin cargo y sin los campos obligatorios oye el cargo; el administrador, con el mismo cuerpo, oye el 422', async () => {
    await ticket('p-4a', 96004)
    await ticket('p-4b', 96005)
    const { app } = appWith()
    const sinCargo = await liberar(app, await userCookie(['Comercial']), 'p-4a', {})
    expect(sinCargo.status).toBe(403)
    expect(sinCargo.body.error).toContain('Director Comercial')
    // Control: el mismo cuerpo vacío SÍ activa el 422 cuando la persona pasa el cargo (aquí, el admin).
    const control = await liberar(app, await adminCookie(), 'p-4b', {})
    expect(control.status).toBe(422)
  })
})

describe('la matriz HTTP de área, con la compuesta', () => {
  it('S21 · de las 93 celdas (31 transiciones × 3 áreas) difiere de la de área UNA sola: Comercial sin cargo × liberacion_sin_factura (200 → 403)', async () => {
    const { app } = appWith()
    const diferencias: Array<{ area: string; transitionId: string; observado: number }> = []
    let n = 0
    for (const [i, area] of AREAS.entries()) {
      const role = await createRole(db, { name: `Rol-mtx-${i}`, areas: [area] })
      const u = await createUser(db, { email: `mtx${i}@x.co`, name: 'Mtx', passwordHash: await hashPassword('password123'), roleId: role.id })
      const cookie = `sid=${await createSession(db, u.id)}`
      for (const t of TRANSITIONS) {
        n += 1
        await db.query('INSERT INTO tickets (id, number, subject, status) VALUES ($1,$2,$3,$4)', [`s21-${n}`, 97000 + n, 'S21', t.from[0]]); if (t.id === 'habilitar_servicio') await conRemisionVigente(db, `s21-${n}`)
        const res = await request(app).post(`/api/tickets/s21-${n}/transition`).set('Cookie', cookie)
          .send({ transitionId: t.id, values: valoresValidos(t, n) })
        if (res.status !== (canExecuteTransition([area], false, t.area) ? 200 : 403)) diferencias.push({ area, transitionId: t.id, observado: res.status })
      }
    }
    expect(n).toBe(93)
    expect(diferencias).toEqual([{ area: 'Comercial', transitionId: 'liberacion_sin_factura', observado: 403 }])
  }, 90_000)
})
