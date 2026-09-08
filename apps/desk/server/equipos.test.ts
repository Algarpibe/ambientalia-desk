import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { upsertEquipo, listEquiposManage } from './db/equipos'
import { db, instalarArnes, equipoRow, appWith, adminCookie, userCookie } from './testing/appHarness'

instalarArnes()

describe('GET /api/equipos', () => {
  it('busca equipos (con sesión)', async () => {
    const cookie = await adminCookie()
    await upsertEquipo(db, equipoRow('eq-t1', '18A22052'))
    const { app } = appWith()
    const res = await request(app).get('/api/equipos?search=18A22052').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body[0]).toMatchObject({ serial: '18A22052', marca: 'Grimm', tipo: 'Monitor PM10/PM2.5' })
  })

  it('GET /api/equipos sin sesión → 401', async () => {
    const { app } = appWith()
    const res = await request(app).get('/api/equipos?search=x')
    expect(res.status).toBe(401)
  })
})

describe('Gestión de equipos (Subsistema F)', () => {
  it('crea un equipo (cliente de Books) y lo desactiva', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cliF','Cliente F')")
    await db.query("INSERT INTO catalogo_tipos (id,nombre) VALUES ('t-f1','Monitor PM10')")
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('m-f1','Grimm')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,tipo_id) VALUES ('mo-f1','m-f1','EDM180C','t-f1')")
    const { app } = appWith()
    const create = await request(app).post('/api/equipos').set('Cookie', cookie).send({
      serial: 'SN-F1', modeloId: 'mo-f1', clientId: 'cliF',
    })
    expect(create.status).toBe(201)
    expect(create.body).toMatchObject({ serial: 'SN-F1', marca: 'Grimm', active: true, clientId: 'cliF', clienteNombre: 'Cliente F' })
    const id = create.body.id
    // El PATCH ya no acepta marca/modelo/tipo sueltos: los escribe el catálogo (vía `modeloId`) y
    // ningún otro camino los toca. Se manda a propósito junto con `active` para comprobar que se
    // ignoran en vez de limitarnos a no mandarlos — si alguien reintroduce su lectura del cuerpo
    // (de buena fe, porque un formulario "quiere" editar el tipo), este test debe reventar.
    const patch = await request(app).patch(`/api/equipos/${id}`).set('Cookie', cookie)
      .send({ active: false, tipo: 'Analizador CO', marca: 'FALSA', modelo: 'FALSO' })
    expect(patch.status).toBe(200)
    expect(patch.body).toMatchObject({ active: false, marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor PM10' })
    expect((await listEquiposManage(db, 'SN-F1')).length).toBe(1)
  })

  it('422 sin serial o sin cliente; 422 si el cliente no existe', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    expect((await request(app).post('/api/equipos').set('Cookie', cookie).send({ clientId: 'x' })).status).toBe(422)
    expect((await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'S' })).status).toBe(422)
    expect((await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'S', clientId: 'no-existe' })).status).toBe(422)
  })

  // `/api/equipos/facets` se retiró: derivaba las listas del propio inventario y lo sustituye
  // `/api/catalogo`. Su 404 queda fijado abajo para que nadie la resucite por costumbre.
  it('manage lista; 401 sin sesión', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cliG','G')")
    await db.query("INSERT INTO catalogo_tipos (id,nombre) VALUES ('t-g','O3')")
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('m-g','Horiba')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,tipo_id) VALUES ('mo-g','m-g','APOA-370','t-g')")
    const { app } = appWith()
    await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'SN-G', modeloId: 'mo-g', clientId: 'cliG' })
    const m = await request(app).get('/api/equipos/manage?search=SN-G').set('Cookie', cookie)
    expect(m.status).toBe(200)
    expect(m.body.items[0]).toMatchObject({ serial: 'SN-G' })
    expect((await request(app).get('/api/equipos/manage')).status).toBe(401)
  })

  // La ruta vieja ya no existe. Sin este test, retirarla y que algo siguiera llamándola solo se
  // notaría en producción, porque `/api/equipos/:id/historial` NO la captura (rutas distintas).
  it('la ruta retirada /api/equipos/facets responde 404', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    expect((await request(app).get('/api/equipos/facets').set('Cookie', cookie)).status).toBe(404)
  })

  it('DELETE solo super admin: no-admin 403, sin sesión 401, admin 200', async () => {
    const admin = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cliD','D')")
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('m-d','Grimm')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('mo-d','m-d','EDM180C')")
    const { app } = appWith()
    const id = (await request(app).post('/api/equipos').set('Cookie', admin).send({ serial: 'SN-DEL', modeloId: 'mo-d', clientId: 'cliD' })).body.id
    const op = await userCookie([])
    expect((await request(app).delete(`/api/equipos/${id}`).set('Cookie', op)).status).toBe(403)
    expect((await request(app).delete(`/api/equipos/${id}`)).status).toBe(401)
    expect((await request(app).delete(`/api/equipos/${id}`).set('Cookie', admin)).status).toBe(200)
    expect((await listEquiposManage(db, 'SN-DEL')).length).toBe(0)
  })

  it('GET /api/equipos/:id/historial → equipo + cronología de tickets y remisiones; 404; 401', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cH','H')")
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('m-h','Grimm')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('mo-h','m-h','EDM180C')")
    const { app } = appWith()
    const eqId = (await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'SN-H', modeloId: 'mo-h', clientId: 'cH' })).body.id
    await db.query(`INSERT INTO tickets (id,number,subject,status,status_type,serial,equipo_id,created_time) VALUES ('h1',777,'T','Ingresado','Open','SN-H',$1,'2026-08-05T10:00:00Z')`, [eqId])
    await db.query(
      `INSERT INTO remisiones (id,ticket_id,tipo,fecha,tipo_servicio,equipo_id,creado_por,estado,created_at)
       VALUES ('rem-h','h1','entrada','2026-08-05','Calibración',$1,'Julián','ok','2026-08-05T11:00:00Z')`,
      [eqId],
    )
    const res = await request(app).get(`/api/equipos/${eqId}/historial`).set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.equipo.serial).toBe('SN-H')
    // La cronología es de TICKETS, y la remisión va dentro del suyo: recibir el equipo es un paso del
    // servicio, no un suceso de otro rango que merezca su propia tarjeta al mismo nivel.
    expect(res.body.cronologia).toHaveLength(1)
    expect(res.body.cronologia[0]).toMatchObject({ clase: 'ticket', ticket: { id: 'h1', number: '#777' } })
    expect(res.body.cronologia[0].ticket.pasos).toEqual([
      { clase: 'remision', remision: expect.objectContaining({ id: 'rem-h', ticketNumero: '#777' }) },
    ])
    expect((await request(app).get('/api/equipos/eq-nope/historial').set('Cookie', cookie)).status).toBe(404)
    expect((await request(app).get(`/api/equipos/${eqId}/historial`)).status).toBe(401)
  })

  // El catálogo es la fuente: los textos marca/modelo/tipo del equipo se rellenan DESDE él y no se
  // aceptan del navegador. Así no pueden divergir, que es lo que esta fase viene a cerrar.
  it('crear un equipo toma marca, modelo y tipo del modelo del catálogo, ignorando lo que mande el cliente', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cliC','Cliente C')")
    await db.query("INSERT INTO catalogo_tipos (id,nombre) VALUES ('t-1','Analizador de SO2')")
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('m-1','Horiba')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,tipo_id) VALUES ('mo-1','m-1','APSA-370','t-1')")
    const { app } = appWith()

    const res = await request(app).post('/api/equipos').set('Cookie', cookie)
      .send({ serial: 'SN-CAT', clientId: 'cliC', modeloId: 'mo-1', marca: 'INVENTADA', modelo: 'FALSA', tipo: 'MENTIRA' })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ marca: 'Horiba', modelo: 'APSA-370', tipo: 'Analizador de SO2', modeloId: 'mo-1' })
  })

  it('422 sin modeloId, y 422 si el modelo no existe', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cliD2','D')")
    const { app } = appWith()
    expect((await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'S1', clientId: 'cliD2' })).status).toBe(422)
    expect((await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'S2', clientId: 'cliD2', modeloId: 'no-existe' })).status).toBe(422)
  })

  it('editar el modelo reescribe los tres textos del equipo', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cliE2','E')")
    await db.query("INSERT INTO catalogo_tipos (id,nombre) VALUES ('t-a','Analizador de SO2'),('t-b','Monitor PM10')")
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('m-a','Horiba'),('m-b','Grimm')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre,tipo_id) VALUES ('mo-a','m-a','APSA-370','t-a'),('mo-b','m-b','EDM180C','t-b')")
    const { app } = appWith()
    const id = (await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'SN-ED', clientId: 'cliE2', modeloId: 'mo-a' })).body.id

    const res = await request(app).patch(`/api/equipos/${id}`).set('Cookie', cookie).send({ modeloId: 'mo-b' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor PM10', modeloId: 'mo-b' })
  })

  // Regla deliberada: el PATCH no exige modeloId. El botón «Desactivar» del listado manda solo
  // { active }, y exigir el modelo en cada PATCH rompería la desactivación. Quien fuerza el modelo al
  // editar es el formulario (tarea posterior), no esta ruta.
  it('PATCH con solo { active } no exige modeloId', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cliF2','F')")
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('m-f','Grimm')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('mo-f','m-f','EDM180C')")
    const { app } = appWith()
    const id = (await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'SN-DES', clientId: 'cliF2', modeloId: 'mo-f' })).body.id

    const res = await request(app).patch(`/api/equipos/${id}`).set('Cookie', cookie).send({ active: false })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ active: false, marca: 'Grimm', modelo: 'EDM180C' })
  })

  it('GET /api/equipos/:id devuelve el equipo con su modeloId; 404 si no existe; 401 sin sesión', async () => {
    const cookie = await adminCookie()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cliQ','Q')")
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('m-q','Horiba')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('mo-q','m-q','APSA-370')")
    const { app } = appWith()
    const id = (await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'SN-Q', clientId: 'cliQ', modeloId: 'mo-q' })).body.id

    const res = await request(app).get(`/api/equipos/${id}`).set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ serial: 'SN-Q', modeloId: 'mo-q' })
    expect((await request(app).get('/api/equipos/no-existe').set('Cookie', cookie)).status).toBe(404)
    expect((await request(app).get(`/api/equipos/${id}`)).status).toBe(401)
  })

  // `manage` es una ruta literal: si `/api/equipos/:id` se registrara antes, la capturaría como si
  // `manage` fuese el id de un equipo y el listado dejaría de funcionar.
  it('la ruta literal /api/equipos/manage no la captura /api/equipos/:id', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    const res = await request(app).get('/api/equipos/manage').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.items)).toBe(true)
  })
})
