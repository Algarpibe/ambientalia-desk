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

describe('Hoja de vida — F1B-02', () => {
  /** Cliente y modelo mínimos, con id único por caso para no colisionar entre pruebas. */
  async function clienteYModelo(sufijo: string): Promise<{ clientId: string; modeloId: string }> {
    const clientId = `cli-hv-${sufijo}`
    const modeloId = `mo-hv-${sufijo}`
    await db.query('INSERT INTO books.contacts (contact_id,contact_name) VALUES ($1,$2)', [clientId, `Cliente ${sufijo}`])
    await db.query('INSERT INTO catalogo_marcas (id,nombre) VALUES ($1,$2)', [`m-hv-${sufijo}`, 'Grimm'])
    await db.query('INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ($1,$2,$3)', [modeloId, `m-hv-${sufijo}`, 'EDM180C'])
    return { clientId, modeloId }
  }

  it('[RQ-HV-01] POST mínimo sin los seis campos comerciales sigue creando el equipo, y PATCH {active} sigue', async () => {
    const cookie = await adminCookie()
    const { clientId, modeloId } = await clienteYModelo('01')
    const { app } = appWith()
    const create = await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'SN-HV1', modeloId, clientId })
    expect(create.status).toBe(201)
    expect(create.body).toMatchObject({ serial: 'SN-HV1' })
    expect(create.body.fechaAdquisicion).toBeUndefined()
    expect(create.body.fechaFacturaCompra).toBeUndefined()
    expect(create.body.finGarantia).toBeUndefined()
    expect(create.body.codigoInterno).toBeUndefined()
    expect(create.body.mantenedorId).toBeUndefined()
    expect(create.body.mantenedorNombre).toBeUndefined()
    expect(create.body.driveUrl).toBeUndefined()
    const patch = await request(app).patch(`/api/equipos/${create.body.id}`).set('Cookie', cookie).send({ active: false })
    expect(patch.status).toBe(200)
    expect(patch.body.active).toBe(false)
  })

  it('[RQ-HV-01/02] POST con los seis campos comerciales → 201, los devuelve con mantenedorNombre', async () => {
    const cookie = await adminCookie()
    const { clientId, modeloId } = await clienteYModelo('02')
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli-mant-02','Mantenedor Dos')")
    const { app } = appWith()
    const create = await request(app).post('/api/equipos').set('Cookie', cookie).send({
      serial: 'SN-HV2', modeloId, clientId,
      fechaAdquisicion: '2024-01-10', fechaFacturaCompra: '2024-01-12', finGarantia: '2026-01-10',
      codigoInterno: 'INT-002', mantenedorId: 'cli-mant-02', driveUrl: 'https://drive.google.com/drive/folders/abc',
    })
    expect(create.status).toBe(201)
    expect(create.body).toMatchObject({
      fechaAdquisicion: '2024-01-10', fechaFacturaCompra: '2024-01-12', finGarantia: '2026-01-10',
      codigoInterno: 'INT-002', mantenedorId: 'cli-mant-02', mantenedorNombre: 'Mantenedor Dos',
      driveUrl: 'https://drive.google.com/drive/folders/abc',
    })
  })

  it('[RQ-HV-02] PATCH sólo con codigoInterno deja los otros cinco campos comerciales intactos', async () => {
    const cookie = await adminCookie()
    const { clientId, modeloId } = await clienteYModelo('03')
    const { app } = appWith()
    const create = await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'SN-HV3', modeloId, clientId })
    const id = create.body.id
    const patch = await request(app).patch(`/api/equipos/${id}`).set('Cookie', cookie).send({ codigoInterno: 'INT-003' })
    expect(patch.status).toBe(200)
    expect(patch.body.codigoInterno).toBe('INT-003')
    expect(patch.body.fechaAdquisicion).toBeUndefined()
    expect(patch.body.driveUrl).toBeUndefined()
    expect(patch.body.mantenedorId).toBeUndefined()
    expect(patch.body.serial).toBe('SN-HV3')
  })

  it('[RQ-HV-03] Fecha inválida en POST y fecha imposible en PATCH → 422 sin escritura', async () => {
    const cookie = await adminCookie()
    const { clientId, modeloId } = await clienteYModelo('04')
    const { app } = appWith()
    const bad = await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'SN-HV4', modeloId, clientId, fechaAdquisicion: '2026/01/01' })
    expect(bad.status).toBe(422)
    expect((await listEquiposManage(db, 'SN-HV4')).length).toBe(0)

    const create = await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'SN-HV4b', modeloId, clientId })
    const id = create.body.id
    const patch = await request(app).patch(`/api/equipos/${id}`).set('Cookie', cookie).send({ finGarantia: '2026-02-30' })
    expect(patch.status).toBe(422)
    const after = await request(app).get(`/api/equipos/${id}`).set('Cookie', cookie)
    expect(after.body.finGarantia).toBeUndefined()
  })

  it('[RQ-HV-04] Enlace de Drive con http:// → 422, no queda escrito', async () => {
    const cookie = await adminCookie()
    const { clientId, modeloId } = await clienteYModelo('05')
    const { app } = appWith()
    const create = await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'SN-HV5', modeloId, clientId, driveUrl: 'http://drive.google.com/x' })
    expect(create.status).toBe(422)
    expect((await listEquiposManage(db, 'SN-HV5')).length).toBe(0)
  })

  it('[RQ-HV-04] Enlace de Drive https:// con comilla doble → 422 (distingue urlSegura de un startsWith desnudo)', async () => {
    const cookie = await adminCookie()
    const { clientId, modeloId } = await clienteYModelo('06')
    const { app } = appWith()
    const create = await request(app).post('/api/equipos').set('Cookie', cookie).send({
      serial: 'SN-HV6', modeloId, clientId,
      driveUrl: 'https://drive.google.com/x" onmouseover="alert(1)',
    })
    expect(create.status).toBe(422)
    expect((await listEquiposManage(db, 'SN-HV6')).length).toBe(0)
  })

  it('[RQ-HV-05] Mantenedor que no resuelve a ningún cliente de Books → 422', async () => {
    const cookie = await adminCookie()
    const { clientId, modeloId } = await clienteYModelo('07')
    const { app } = appWith()
    const create = await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'SN-HV7', modeloId, clientId, mantenedorId: 'no-existe' })
    expect(create.status).toBe(422)
    expect((await listEquiposManage(db, 'SN-HV7')).length).toBe(0)
  })

  // Regla de mutación 1: fija la POSICIÓN de la guarda. Si el helper corriera DESPUÉS de
  // updateEquipo/setEquipoActive, el driveUrl inválido llegaría tarde: codigoInterno ya estaría
  // escrito y el equipo ya desactivado. Aquí el 422 tiene que tumbar el PATCH entero.
  it('[posición] PATCH con codigoInterno válido + active + driveUrl inválido rechaza el conjunto, sin desactivar ni escribir el código', async () => {
    const cookie = await adminCookie()
    const { clientId, modeloId } = await clienteYModelo('08')
    const { app } = appWith()
    const create = await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'SN-HV8', modeloId, clientId })
    const id = create.body.id
    const patch = await request(app).patch(`/api/equipos/${id}`).set('Cookie', cookie)
      .send({ codigoInterno: 'INT-008', active: false, driveUrl: 'http://x' })
    expect(patch.status).toBe(422)
    const after = await request(app).get(`/api/equipos/${id}`).set('Cookie', cookie)
    expect(after.body.codigoInterno).toBeUndefined()
    expect(after.body.active).toBe(true)
  })

  it('[RQ-HV-06] Buscar por código interno (con y sin mayúsculas) devuelve el mismo equipo que por serial', async () => {
    const cookie = await adminCookie()
    const { clientId, modeloId } = await clienteYModelo('09')
    const { app } = appWith()
    const create = await request(app).post('/api/equipos').set('Cookie', cookie).send({ serial: 'SN-1-HV9', modeloId, clientId, codigoInterno: 'INT-001' })
    const id = create.body.id
    const porSerial = await request(app).get('/api/equipos?search=SN-1-HV9').set('Cookie', cookie)
    const porCodigo = await request(app).get('/api/equipos?search=INT-001').set('Cookie', cookie)
    const porCodigoMin = await request(app).get('/api/equipos?search=int-001').set('Cookie', cookie)
    expect(porSerial.body.map((e: { id: string }) => e.id)).toContain(id)
    expect(porCodigo.body.map((e: { id: string }) => e.id)).toContain(id)
    expect(porCodigoMin.body.map((e: { id: string }) => e.id)).toContain(id)
  })

  it("[RQ-HV-07 servidor] /historial trae los seis campos comerciales, y vaciar driveUrl con '' lo deja nulo", async () => {
    const cookie = await adminCookie()
    const { clientId, modeloId } = await clienteYModelo('10')
    const { app } = appWith()
    const create = await request(app).post('/api/equipos').set('Cookie', cookie).send({
      serial: 'SN-HV10', modeloId, clientId,
      codigoInterno: 'INT-010', driveUrl: 'https://drive.google.com/drive/folders/x10',
    })
    const id = create.body.id
    const hist1 = await request(app).get(`/api/equipos/${id}/historial`).set('Cookie', cookie)
    expect(hist1.status).toBe(200)
    expect(hist1.body.equipo).toMatchObject({ codigoInterno: 'INT-010', driveUrl: 'https://drive.google.com/drive/folders/x10' })

    await request(app).patch(`/api/equipos/${id}`).set('Cookie', cookie).send({ driveUrl: '' })
    const hist2 = await request(app).get(`/api/equipos/${id}/historial`).set('Cookie', cookie)
    expect(hist2.body.equipo.driveUrl).toBeUndefined()
  })
})
