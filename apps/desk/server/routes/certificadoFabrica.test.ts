import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { LIMITE_SUBIDA_BYTES } from '../util/subida'
import { db, instalarArnes, appWith, adminCookie, userCookie } from '../testing/appHarness'

/**
 * PDF OPCIONAL DEL CERTIFICADO DE FÁBRICA (F1A-03, lote 3; `transitions-equipo-nuevo` RQ-EN-11, matriz de amenazas del diseño).
 *
 * La escalera de la subida es 404 ticket < 400 falta el archivo < 403 fuera de Servicio Técnico < 409 sin liberación < 415 tipo.
 * Las pruebas de POSICIÓN activan DOS guardas a la vez a propósito: con una sola, mover una guarda de sitio no rompería nada
 * (regla de mutación 1 de `CLAUDE.md`).
 */
instalarArnes()

const PDF = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF\n')
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00])
const RUTA = '/api/tickets/t1/certificado-fabrica'

async function ticket(conLiberacion: boolean): Promise<void> {
  await db.query("INSERT INTO tickets (id, number, subject, status, classification) VALUES ('t1', 9400, 'PDF del certificado', 'Verificación', 'Equipo nuevo')")
  if (conLiberacion) await liberacion()
}
async function liberacion(): Promise<number> {
  const r = await db.query(
    "INSERT INTO ticket_transitions (ticket_id, transition_id, transition_name, from_status, to_status, area, performed_by) VALUES ('t1','liberacion','Liberación','Verificación','Finalizado','Servicio Técnico','Tec') RETURNING id",
  )
  return Number((r.rows[0] as { id: string | number }).id)
}
const subidos = async () => (await db.query('SELECT id FROM public.certificados_fabrica')).rows.length
const subir = (cookie: string, buf: Buffer, contentType: string, ruta = RUTA) =>
  request(appWith().app).post(ruta).set('Cookie', cookie).attach('file', buf, { filename: 'cert.pdf', contentType })

describe('RQ-EN-11 · la subida del PDF', () => {
  it('EN11-2 · un PDF válido: 201 con { id, filename, size, transicionId } vinculado a la ÚLTIMA liberación', async () => {
    await ticket(true); const ultima = await liberacion()
    const res = await subir(await userCookie(['Servicio Técnico']), PDF, 'application/pdf')
    expect(res.status).toBe(201)
    expect(Object.keys(res.body).sort()).toEqual(['filename', 'id', 'size', 'transicionId'])
    expect(res.body).toMatchObject({ filename: 'cert.pdf', size: PDF.length, transicionId: ultima })
    expect(await subidos()).toBe(1)
  })
  it('EN11-3 · image/png: 415 y no se guarda nada', async () => {
    await ticket(true)
    const res = await subir(await userCookie(['Servicio Técnico']), PNG, 'image/png')
    expect(res.status).toBe(415)
    expect(await subidos()).toBe(0)
  })
  it('m-10b · application/pdf con bytes de PNG: 415 (el tipo declarado miente)', async () => {
    await ticket(true)
    const res = await subir(await userCookie(['Servicio Técnico']), PNG, 'application/pdf')
    expect(res.status).toBe(415)
    expect(await subidos()).toBe(0)
  })
  it('m-10a · bytes de PDF declarados como image/png: 415 (el tipo declarado también cuenta)', async () => {
    await ticket(true)
    const res = await subir(await userCookie(['Servicio Técnico']), PDF, 'image/png')
    expect(res.status).toBe(415)
    expect(await subidos()).toBe(0)
  })
  it('EN11-4 · más grande que el límite: se rechaza nombrando los MB', async () => {
    await ticket(true)
    const grande = Buffer.concat([PDF, Buffer.alloc(LIMITE_SUBIDA_BYTES)])
    const res = await subir(await userCookie(['Servicio Técnico']), grande, 'application/pdf')
    expect(res.status).toBe(413)
    expect(String(res.body.error)).toContain(`${LIMITE_SUBIDA_BYTES / 1024 / 1024} MB`)
    expect(await subidos()).toBe(0)
  })
  it('EN11-5 · el PDF no exime del número: con un PDF ya adjunto, `liberacion` sin número sigue en 422', async () => {
    await ticket(false)
    await db.query("INSERT INTO public.certificados_fabrica (id, ticket_id, transicion_id, filename, content_b64, size) VALUES ('c1','t1',1,'a.pdf','AA==',1)")
    const res = await request(appWith().app).post('/api/tickets/t1/transition').set('Cookie', await userCookie(['Servicio Técnico']))
      .send({ transitionId: 'liberacion', values: { comment: 'x' } })
    expect(res.status).toBe(422)
    expect(JSON.stringify(res.body)).toContain('certificado')
  })
  it('sin sesión: 401', async () => {
    await ticket(true)
    const res = await request(appWith().app).post(RUTA).attach('file', PDF, { filename: 'c.pdf', contentType: 'application/pdf' })
    expect(res.status).toBe(401)
  })
})

describe('Escalera de la subida (POSICIONES)', () => {
  it('404 ticket gana a 400 y a 403: ticket inexistente, sin archivo y con un área que no libera', async () => {
    const res = await request(appWith().app).post('/api/tickets/no-existe/certificado-fabrica').set('Cookie', await userCookie(['Comercial']))
    expect(res.status).toBe(404)
    expect(String(res.body.error)).toContain('Ticket no encontrado')
  })
  it('404 ticket gana a 415', async () => {
    const res = await subir(await userCookie(['Servicio Técnico']), PNG, 'image/png', '/api/tickets/no-existe/certificado-fabrica')
    expect(res.status).toBe(404)
    expect(String(res.body.error)).toContain('Ticket no encontrado')
  })
  it('400 «Falta el archivo» gana a 403', async () => {
    await ticket(true)
    const res = await request(appWith().app).post(RUTA).set('Cookie', await userCookie(['Comercial']))
    expect(res.status).toBe(400)
    expect(String(res.body.error)).toContain('Falta el archivo')
  })
  it('403 gana a 415: Comercial con un PNG, con liberación registrada', async () => {
    await ticket(true)
    const res = await subir(await userCookie(['Comercial']), PNG, 'image/png')
    expect(res.status).toBe(403)
    expect(await subidos()).toBe(0)
  })
  it('403 gana a 409: Comercial con un PDF válido, sin liberación registrada', async () => {
    await ticket(false)
    const res = await subir(await userCookie(['Comercial']), PDF, 'application/pdf')
    expect(res.status).toBe(403)
  })
  it('409 «sin liberación registrada»: Servicio Técnico con un PDF válido', async () => {
    await ticket(false)
    const res = await subir(await userCookie(['Servicio Técnico']), PDF, 'application/pdf')
    expect(res.status).toBe(409)
    expect(await subidos()).toBe(0)
  })
  it('409 gana a 415: Servicio Técnico con un PNG, sin liberación registrada', async () => {
    await ticket(false)
    const res = await subir(await userCookie(['Servicio Técnico']), PNG, 'image/png')
    expect(res.status).toBe(409)
  })
  it('un administrador sube aunque no tenga el área', async () => {
    await ticket(true)
    expect((await subir(await adminCookie(), PDF, 'application/pdf')).status).toBe(201)
  })
})

describe('Lectura y borrado', () => {
  /** Sube un PDF como administrador y devuelve su id y la cookie (el correo del administrador es único por base). */
  async function conUnPdf(): Promise<{ id: string; admin: string }> {
    await ticket(true)
    const admin = await adminCookie()
    const res = await subir(admin, PDF, 'application/pdf')
    return { id: String(res.body.id), admin }
  }
  it('GET lista: metadatos, sin contenido', async () => {
    const { id } = await conUnPdf()
    const res = await request(appWith().app).get(RUTA).set('Cookie', await userCookie(['Comercial']))
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(Object.keys(res.body[0]).sort()).toEqual(['filename', 'id', 'size', 'transicionId'])
    expect(res.body[0].id).toBe(id)
  })
  it('GET del PDF: Content-Type FIJO, nosniff y attachment; el cuerpo son los bytes subidos', async () => {
    const { id } = await conUnPdf()
    const res = await request(appWith().app).get(`${RUTA}/${id}`).set('Cookie', await userCookie(['Comercial'])).buffer(true).parse((r, cb) => {
      const trozos: Buffer[] = []; r.on('data', (c: Buffer) => trozos.push(c)); r.on('end', () => cb(null, Buffer.concat(trozos)))
    })
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toBe('application/pdf')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['content-disposition']).toMatch(/^attachment/)
    expect((res.body as Buffer).equals(PDF)).toBe(true)
  })
  it('GET de un PDF que no existe, o que es de otro ticket: 404', async () => {
    const { id, admin } = await conUnPdf()
    await db.query("INSERT INTO tickets (id, number, subject, status, classification) VALUES ('t2', 9401, 'otro', 'Verificación', 'Equipo nuevo')")
    expect((await request(appWith().app).get(`${RUTA}/inexistente`).set('Cookie', admin)).status).toBe(404)
    expect((await request(appWith().app).get(`/api/tickets/t2/certificado-fabrica/${id}`).set('Cookie', admin)).status).toBe(404)
  })
  it('DELETE: sólo el superadministrador', async () => {
    const { id, admin } = await conUnPdf()
    const sinPermiso = await request(appWith().app).delete(`${RUTA}/${id}`).set('Cookie', await userCookie(['Servicio Técnico']))
    expect(sinPermiso.status).toBe(403)
    expect(await subidos()).toBe(1)
    const ok = await request(appWith().app).delete(`${RUTA}/${id}`).set('Cookie', admin)
    expect(ok.status).toBe(204)
    expect(await subidos()).toBe(0)
  })
})
