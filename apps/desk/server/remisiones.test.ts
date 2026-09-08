import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { upsertEquipo } from './db/equipos'
import type { RemisionListado } from '@ambientalia/shared'
import { db, instalarArnes, equipoRow, appWith, adminCookie, userCookie } from './testing/appHarness'

instalarArnes()

/**
 * La lista de personas a las que se puede derivar un ticket. Vive aparte de `/api/users` a propósito:
 * derivar lo hace CUALQUIERA que ejecute una transición, no solo un administrador, y `/api/users`
 * publica correo, rol y áreas —el modelo de autorización entero— además de los usuarios dados de baja.
 */

describe('GET /api/remisiones/nueva', () => {
  /** Ticket 't1' de la app, con cliente de Books y una copia propia de marca/modelo/serie del equipo. */
  const conTicket = async (equipoId: string | null) => {
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli1','Gecelca S.A. E.S.P.')")
    await db.query(
      `INSERT INTO tickets (id, number, status, managed_by_app, client_id, tipo_servicio, equipo_id, marca, modelo, serial)
       VALUES ('t1', 10000, 'OV asignada', true, 'cli1', 'Mantenimiento', $1, 'Grimm', 'EDM180C', '18A1')`,
      [equipoId],
    )
  }

  it('prellena desde el ticket y devuelve el checklist del perfil', async () => {
    const cookie = await adminCookie()
    await upsertEquipo(db, equipoRow('eq-r1', '18A20070'))              // Grimm / EDM180C
    await db.query("INSERT INTO remision_checklist (perfil,item,orden) VALUES ('grimm_edm180','Manuales',0),('grimm_edm180','Datalogger',1)")
    await conTicket('eq-r1')
    const { app } = appWith()
    const res = await request(app).get('/api/remisiones/nueva?ticketId=t1').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      ticketNumber: '10000', cliente: 'Gecelca S.A. E.S.P.', tipoServicio: 'Mantenimiento', perfil: 'grimm_edm180',
      equipo: { serial: '18A20070', marca: 'Grimm', modelo: 'EDM180C' },
    })
    expect(res.body.incluye).toEqual(['Manuales', 'Datalogger']) // en el orden del catálogo, no alfabético
  })

  /**
   * FASE 2, de punta a punta: con el equipo enlazado a un modelo del catálogo, el checklist sale de la
   * lista de ACCESORIOS de ese modelo y ya no del perfil. Es lo que separa a un APMA de un APSA, que
   * compartían perfil y por tanto lista.
   *
   * El perfil se siembra a propósito con un ítem distinto: si apareciera en la respuesta, la
   * conmutación no habría ocurrido y el resto de tests no lo notaría —los suyos no enlazan modelo—.
   */
  it('con el equipo enlazado a un modelo, el checklist sale de sus accesorios y no del perfil', async () => {
    const cookie = await adminCookie()
    await upsertEquipo(db, equipoRow('eq-r1', '18A20070'))
    await db.query("INSERT INTO remision_checklist (perfil,item,orden) VALUES ('grimm_edm180','Del perfil viejo',0)")
    await db.query("INSERT INTO catalogo_marcas (id,nombre) VALUES ('cmar-1','Grimm')")
    await db.query("INSERT INTO catalogo_modelos (id,marca_id,nombre) VALUES ('cmod-1','cmar-1','EDM180C')")
    await db.query(`INSERT INTO catalogo_articulos (id,modelo_id,clase,nombre,orden) VALUES
      ('art-1','cmod-1','accesorio','Sensor 157-L',0),
      ('art-2','cmod-1','accesorio','Cable RJ45',1),
      ('art-3','cmod-1','consumible_repuesto','Filtro PM10',0)`)
    await db.query("UPDATE equipos SET modelo_id='cmod-1' WHERE id='eq-r1'")
    await conTicket('eq-r1')
    const { app } = appWith()

    const res = await request(app).get('/api/remisiones/nueva?ticketId=t1').set('Cookie', cookie)
    expect(res.body.origenChecklist).toBe('modelo')
    // En el orden de la ficha, y sin el consumible: «Incluye» es lo que ACOMPAÑA al equipo.
    expect(res.body.incluye).toEqual(['Sensor 157-L', 'Cable RJ45'])

    // Y la puerta de creación valida contra la MISMA fuente. Si leyeran de sitios distintos, lo que el
    // técnico ve marcable dejaría de ser lo que el servidor acepta.
    const viejo = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-11', incluye: ['Del perfil viejo'] })
    expect(viejo.status).toBe(422)
    const nuevo = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-11', incluye: ['Cable RJ45'] })
    expect(nuevo.status).toBe(201)
  })

  // Los datos del equipo mandan sobre la copia que el ticket guardó al crearse.
  it('si el equipo se corrigió después, gana el registro del equipo', async () => {
    const cookie = await adminCookie()
    await upsertEquipo(db, { ...equipoRow('eq-r2', 'SERIE-NUEVA'), modelo: 'EDM 280' })
    await conTicket('eq-r2')
    const { app } = appWith()
    const res = await request(app).get('/api/remisiones/nueva?ticketId=t1').set('Cookie', cookie)
    expect(res.body.equipo).toMatchObject({ serial: 'SERIE-NUEVA', modelo: 'EDM 280' })
    expect(res.body.perfil).toBe('grimm_edm280') // el perfil se recalcula con el modelo corregido
  })

  // Los tickets históricos de Zoho no tienen equipo_id: se cae a las columnas del propio ticket.
  it('sin equipo_id usa las columnas del ticket', async () => {
    const cookie = await adminCookie()
    await conTicket(null)
    const { app } = appWith()
    const res = await request(app).get('/api/remisiones/nueva?ticketId=t1').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.equipo).toMatchObject({ serial: '18A1', marca: 'Grimm', modelo: 'EDM180C' })
  })

  // Kunak sin ítems y catálogo sin sembrar dejan ambos `incluye` vacío. `catalogoCargado` es lo único
  // que los separa: sin él la app diría "este equipo no lleva accesorios" con el catálogo a medio cargar.
  it('distingue un perfil sin checklist del catálogo aún sin sembrar', async () => {
    const cookie = await adminCookie()
    await upsertEquipo(db, { ...equipoRow('eq-r3', 'K1'), marca: 'Kunak', modelo: 'AIR' })
    await conTicket('eq-r3')
    const { app } = appWith()

    const sinSembrar = await request(app).get('/api/remisiones/nueva?ticketId=t1').set('Cookie', cookie)
    expect(sinSembrar.body).toMatchObject({ perfil: 'kunak', incluye: [], catalogoCargado: false })

    await db.query("INSERT INTO remision_checklist (perfil,item,orden) VALUES ('grimm_edm180','Manuales',0)")
    const sembrado = await request(app).get('/api/remisiones/nueva?ticketId=t1').set('Cookie', cookie)
    expect(sembrado.body).toMatchObject({ perfil: 'kunak', incluye: [], catalogoCargado: true })
  })

  it('404 si el ticket no existe, 400 sin ticketId, 401 sin sesión', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    expect((await request(app).get('/api/remisiones/nueva?ticketId=nope').set('Cookie', cookie)).status).toBe(404)
    expect((await request(app).get('/api/remisiones/nueva').set('Cookie', cookie)).status).toBe(400)
    expect((await request(app).get('/api/remisiones/nueva?ticketId=t1')).status).toBe(401)
  })
})

describe('POST /api/remisiones', () => {
  const preparar = async () => {
    await upsertEquipo(db, equipoRow('eq-p1', '18A20070'))  // Grimm / EDM180C → grimm_edm180
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli1','Gecelca S.A. E.S.P.')")
    await db.query("INSERT INTO remision_checklist (perfil,item,orden) VALUES ('grimm_edm180','Manuales',0),('grimm_edm180','Datalogger',1)")
    await db.query(`INSERT INTO tickets (id, number, status, managed_by_app, client_id, tipo_servicio, equipo_id, marca, modelo, serial)
                    VALUES ('t1', 10000, 'OV asignada', true, 'cli1', 'Mantenimiento', 'eq-p1', 'Grimm', 'EDM180C', '18A1')`)
  }

  it('crea la remisión en estado pendiente y la lista en el ticket', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const res = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: ['Manuales'], observaciones: 'Llega con golpe' })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      ticketId: 't1', estado: 'pendiente', perfil: 'grimm_edm180',
      serial: '18A20070', incluye: ['Manuales'], creadoPor: 'Admin', tipoServicio: 'Mantenimiento',
    })
    const lista = await request(app).get('/api/remisiones?ticketId=t1').set('Cookie', cookie)
    expect(lista.body).toHaveLength(1)
    expect(lista.body[0].fotos).toEqual([])
  })

  // Autocontenida: la remisión guarda empresa y persona de contacto del cliente TAL COMO ERAN al
  // crearla, tomados de Books con el mismo respaldo (companyName → name) que usa el flujo de n8n.
  it('guarda empresa y personaContacto del cliente del ticket al crearla (con companyName)', async () => {
    const cookie = await adminCookie(); await preparar()
    await db.query("UPDATE books.contacts SET company_name = 'SERAMBIENTE S.A.S.', persona_contacto = 'Edgar Barrera' WHERE contact_id = 'cli1'")
    const { app } = appWith()
    const res = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: ['Manuales'] })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ empresa: 'SERAMBIENTE S.A.S.', personaContacto: 'Edgar Barrera' })
    const lista = await request(app).get('/api/remisiones?ticketId=t1').set('Cookie', cookie)
    expect(lista.body[0]).toMatchObject({ empresa: 'SERAMBIENTE S.A.S.', personaContacto: 'Edgar Barrera' })
  })

  // Caso mayoritario en producción: muchos contactos de Books no traen `company_name`. Sin respaldo,
  // `empresa` quedaría NULL en casi toda remisión nueva mientras las 149 históricas sí la traen (se
  // llenaron con el NOMBRE del cliente, no con `company_name`) — la columna significaría cosas
  // distintas según la fila. `preparar()` ya inserta 'cli1' sin `company_name`, así que es el caso.
  it('si el cliente no tiene companyName, usa el name (mismo respaldo que el histórico y n8n)', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const res = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: ['Manuales'] })
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ empresa: 'Gecelca S.A. E.S.P.', personaContacto: null })
  })

  // El perfil decide qué checklist aplica, así que no puede venir del navegador: se recalcula aquí.
  it('rechaza ítems que no estén en el checklist del perfil', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const res = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: ['Manuales', 'Cabezal TSP'] })
    expect(res.status).toBe(422)
    expect(res.body.error).toContain('Cabezal TSP')
  })

  it('valida ticket y fecha', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    expect((await request(app).post('/api/remisiones').set('Cookie', cookie).send({ fecha: '2026-08-03' })).status).toBe(422)
    expect((await request(app).post('/api/remisiones').set('Cookie', cookie).send({ ticketId: 'nope', fecha: '2026-08-03' })).status).toBe(422)
    expect((await request(app).post('/api/remisiones').set('Cookie', cookie).send({ ticketId: 't1', fecha: '03/08/2026' })).status).toBe(422)
    expect((await request(app).post('/api/remisiones').send({ ticketId: 't1', fecha: '2026-08-03' })).status).toBe(401)
  })

  // La orden de venta se puede capturar aquí para no tener que hacerlo en Habilitar Servicio. NO es
  // obligatoria: cuando el equipo entra, la OV puede no existir todavía.
  it('captura la orden de venta en el ticket, resolviéndola de Books y sin pisar la que ya hubiera', async () => {
    const cookie = await adminCookie(); await preparar()
    await db.query("INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_id,date,raw) VALUES ('ov1','OV-2026-300','cli1','2026-07-15','{\"order_status\":\"open\"}')")
    const { app } = appWith()

    // Sin orden de venta: se crea igual. Es el caso normal cuando el equipo llega antes que la venta.
    expect((await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })).status).toBe(201)

    const conOV = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [], salesOrderId: 'ov1', permitirSegunda: true })
    expect(conOV.status).toBe(201)
    // El NÚMERO y la FECHA salen de Books, no del navegador: es un dato de otro sistema.
    const t = (await db.query("SELECT orden_venta, fecha_orden_venta, salesorder_id FROM tickets WHERE id='t1'")).rows[0]
    expect(t.orden_venta).toBe('OV-2026-300')
    // `date` vuelve como Date, no como texto. La suite corre en UTC (vitest.config), así que el ISO
    // no corre de día.
    expect((t.fecha_orden_venta as Date).toISOString().slice(0, 10)).toBe('2026-07-15')
    expect(t.salesorder_id).toBe('ov1')

    // Ya la tiene: una remisión posterior no puede cambiarla. En el formulario sale en gris.
    await db.query("INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_id,date,raw) VALUES ('ov2','OV-OTRA','cli1','2026-07-20','{\"order_status\":\"open\"}')")
    await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [], salesOrderId: 'ov2', permitirSegunda: true })
    expect((await db.query("SELECT orden_venta FROM tickets WHERE id='t1'")).rows[0].orden_venta).toBe('OV-2026-300')
  })

  it('una orden de venta que no existe en Books no crea la remisión', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const res = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [], salesOrderId: 'no-existe' })
    expect(res.status).toBe(422)
    expect((await db.query("SELECT COUNT(*)::int AS n FROM remisiones WHERE ticket_id='t1'")).rows[0].n).toBe(0)
  })

  it('el formulario recibe la orden de venta que el ticket ya tiene', async () => {
    const cookie = await adminCookie(); await preparar()
    await db.query("UPDATE tickets SET orden_venta='OV-YA' WHERE id='t1'")
    const { app } = appWith()
    const res = await request(app).get('/api/remisiones/nueva?ticketId=t1').set('Cookie', cookie)
    expect(res.body.ordenVenta).toBe('OV-YA')
  })

  // El cartel del formulario era un consejo, no una barrera: si la consulta que lo alimenta falla, no
  // aparece y el duplicado vuelve a ser posible en silencio. Y un cliente directo de la API nunca lo
  // ve. Dos `pendiente` a la vez en un ticket son hoy dos entradas DEL MISMO equipo —el equipo se
  // deriva del ticket, no se acepta del navegador—, o sea un duplicado.
  it('no deja una segunda remisión pendiente en el ticket, salvo que se pida a propósito', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const crear = (extra: object = {}) => request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [], ...extra })

    const primera = await crear()
    expect(primera.status).toBe(201)

    const segunda = await crear()
    expect(segunda.status).toBe(409)
    // Con el id de la que ya existe el cliente puede enviarla; sin él solo puede reintentar a ciegas.
    expect(segunda.body.remisionId).toBe(primera.body.id)

    // La salida deliberada sigue abierta: bloquear del todo dejaría al técnico sin poder crear otra
    // si n8n se cae y la primera se queda en `pendiente` para siempre.
    expect((await crear({ permitirSegunda: true })).status).toBe(201)
  })

  it('solo bloquea una PENDIENTE vigente: con desenlace, o anulada, deja crear la siguiente', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const crear = () => request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })

    const conDesenlace = await crear()
    await db.query("UPDATE remisiones SET estado='ok' WHERE id=$1", [conDesenlace.body.id])
    const segunda = await crear()
    expect(segunda.status).toBe(201) // la cerrada no estorba

    await db.query('UPDATE remisiones SET anulada_at=now() WHERE id=$1', [segunda.body.id])
    expect((await crear()).status).toBe(201) // la anulada tampoco
  })

  // El callback es la única vía de sacar una remisión de `pendiente`, y n8n no tiene sesión.
  // El envío va separado de la creación porque las fotos se suben en medio: si se disparase al
  // crear, el documento saldría sin registro fotográfico.
  it('enviar manda las fotos en base64 dentro del payload', async () => {
    const cookie = await adminCookie(); await preparar()
    const llamadas: Array<{ url: string; body: string }> = []
    const fakeFetch = vi.fn(async (url: string, init: RequestInit) => {
      llamadas.push({ url, body: String(init.body) })
      return new Response('{}', { status: 202 })
    })
    vi.stubGlobal('fetch', fakeFetch)
    try {
      const { app } = appWith({ remisionWebhookUrl: 'https://n8n/webhook/remision-entrada' })
      const rem = await request(app).post('/api/remisiones').set('Cookie', cookie).send({ ticketId: 't1', fecha: '2026-08-03', incluye: ['Manuales'] })
      expect(llamadas).toHaveLength(0) // crear NO dispara

      const png = Buffer.from('89504e470d0a1a0a', 'hex')
      await request(app).post(`/api/remisiones/${rem.body.id}/fotos`).set('Cookie', cookie)
        .attach('file', png, { filename: 'equipo.png', contentType: 'image/png' })

      const env = await request(app).post(`/api/remisiones/${rem.body.id}/enviar`).set('Cookie', cookie)
      expect(env.status).toBe(200)
      expect(llamadas).toHaveLength(1)
      const enviado = JSON.parse(llamadas[0].body)
      expect(enviado.fotos).toHaveLength(1)
      expect(enviado.fotos[0]).toMatchObject({ fileName: 'equipo.png', mimeType: 'image/png' })
      expect(enviado.fotos[0].data).toBe(png.toString('base64'))
    } finally { vi.unstubAllGlobals() }
  })

  // El documento que genera n8n debe reflejar lo que la remisión capturó AL CREARSE, no un getClient
  // fresco en el momento de enviar: hay ventana de reenvío y botón de reintentar, así que si alguien
  // corrige el cliente en Books entre medias, el documento no puede desdecir lo que la remisión dice.
  it('enviar manda a n8n la empresa y personaContacto GUARDADOS en la remisión, no los del cliente actual', async () => {
    const cookie = await adminCookie(); await preparar()
    await db.query("UPDATE books.contacts SET company_name = 'Nombre original S.A.S.', persona_contacto = 'Persona original' WHERE contact_id = 'cli1'")
    const llamadas: Array<{ url: string; body: string }> = []
    const fakeFetch = vi.fn(async (url: string, init: RequestInit) => {
      llamadas.push({ url, body: String(init.body) })
      return new Response('{}', { status: 202 })
    })
    vi.stubGlobal('fetch', fakeFetch)
    try {
      const { app } = appWith({ remisionWebhookUrl: 'https://n8n/webhook/remision-entrada' })
      const rem = await request(app).post('/api/remisiones').set('Cookie', cookie)
        .send({ ticketId: 't1', fecha: '2026-08-03', incluye: ['Manuales'] })
      expect(rem.body).toMatchObject({ empresa: 'Nombre original S.A.S.', personaContacto: 'Persona original' })

      // El cliente se corrige en Books DESPUÉS de crear la remisión.
      await db.query("UPDATE books.contacts SET company_name = 'Nombre corregido S.A.S.', persona_contacto = 'Persona corregida' WHERE contact_id = 'cli1'")

      const env = await request(app).post(`/api/remisiones/${rem.body.id}/enviar`).set('Cookie', cookie)
      expect(env.status).toBe(200)
      const enviado = JSON.parse(llamadas[0].body)
      expect(enviado.cliente).toMatchObject({ empresa: 'Nombre original S.A.S.', personaContacto: 'Persona original' })
    } finally { vi.unstubAllGlobals() }
  })

  /**
   * La transición a «Remisión creada» la escribe el CALLBACK de n8n, que no tiene sesión —n8n no manda
   * la cookie—. Firmarla con el marcador `TRANSITION_ACTOR` ponía «Equipo Técnico» en el hilo de un
   * ticket que había llevado una sola persona de principio a fin, y esa firma parece un usuario que
   * nunca intervino. El autor correcto ya está guardado en la propia remisión.
   */
  it('la transición del callback la firma quien creó la remisión, no el marcador', async () => {
    const cookie = await adminCookie(); await preparar()
    // `preparar()` deja el ticket en «OV asignada», el nombre de Zoho, y esa fase no entra nunca en la
    // sincronización: moverla marcaría el ticket como gestionado por la app. Solo avanzan los nacidos
    // aquí, que es el caso que este test reproduce.
    await db.query("UPDATE tickets SET status='Ticket creado' WHERE id='t1'")
    const { app } = appWith({ remisionCallbackToken: 'secreto-cb' })
    const rem = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })

    await request(app).post(`/api/remisiones/${rem.body.id}/callback`)
      .set('X-Remision-Callback', 'secreto-cb').send({ estado: 'ok' })

    const tr = await db.query(
      "SELECT performed_by FROM ticket_transitions WHERE ticket_id='t1' AND to_status='Remisión creada'",
    )
    expect(tr.rows).toHaveLength(1)
    expect((tr.rows[0] as { performed_by: string }).performed_by).toBe('Admin')
  })

  // Reenviar una remisión ya cerrada crearía un segundo documento y una segunda carpeta en Drive para
  // el mismo equipo. Solo se reenvía lo que no llegó a buen puerto.
  it('no reenvía una remisión ya cerrada; reenviar una fallida la devuelve a pendiente', async () => {
    const cookie = await adminCookie(); await preparar()
    const fakeFetch = vi.fn(async () => new Response('{}', { status: 202 }))
    vi.stubGlobal('fetch', fakeFetch)
    try {
      const { app } = appWith({ remisionWebhookUrl: 'https://n8n/webhook/remision-entrada', remisionCallbackToken: 'secreto-cb' })
      const rem = await request(app).post('/api/remisiones').set('Cookie', cookie)
        .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })
      const id = rem.body.id
      const callback = (body: object) => request(app).post(`/api/remisiones/${id}/callback`)
        .set('X-Remision-Callback', 'secreto-cb').send(body)
      const enviar = () => request(app).post(`/api/remisiones/${id}/enviar`).set('Cookie', cookie)

      await callback({ estado: 'ok' })
      expect((await enviar()).status).toBe(409)

      await callback({ estado: 'ok_con_avisos', resultado: { avisos: [{ paso: 'el correo al técnico' }] } })
      expect((await enviar()).status).toBe(409) // con avisos también cuenta como cerrada
      // El detalle que manda n8n se guarda entero: es lo que el panel enseña al técnico.
      const conAvisos = await request(app).get(`/api/remisiones/${id}`).set('Cookie', cookie)
      expect(conAvisos.body.resultado.avisos).toEqual([{ paso: 'el correo al técnico' }])

      await callback({ estado: 'error', resultado: { fallos: [{ paso: 'el PDF de la remisión' }] } })
      expect((await enviar()).status).toBe(200)
      const tras = await request(app).get(`/api/remisiones/${id}`).set('Cookie', cookie)
      expect(tras.body.estado).toBe('pendiente')
      expect(tras.body.resultado).toBeNull() // el detalle del intento anterior no se queda pegado
    } finally { vi.unstubAllGlobals() }
  })

  // Escenario real: técnico en campo con mala cobertura. El servidor dispara el webhook con éxito,
  // el técnico pierde la red antes de recibir la respuesta, y la pantalla le ofrece reintentar. Leer
  // el estado y luego decidir no basta —dos peticiones simultáneas pasarían las dos ese filtro—, así
  // que la garantía tiene que estar en la propia reclamación atómica, no en la comprobación previa.
  it('dos /enviar seguidos sobre una remisión pendiente: el segundo no duplica el disparo a n8n', async () => {
    const cookie = await adminCookie(); await preparar()
    const fakeFetch = vi.fn(async () => new Response('{}', { status: 202 }))
    vi.stubGlobal('fetch', fakeFetch)
    try {
      const { app } = appWith({ remisionWebhookUrl: 'https://n8n/webhook/remision-entrada' })
      const rem = await request(app).post('/api/remisiones').set('Cookie', cookie)
        .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })
      const id = rem.body.id
      const enviar = () => request(app).post(`/api/remisiones/${id}/enviar`).set('Cookie', cookie)

      expect((await enviar()).status).toBe(200)
      expect((await enviar()).status).toBe(409) // la ventana de reenvío sigue abierta: no se reclama de nuevo
      expect(fakeFetch).toHaveBeenCalledTimes(1) // la prueba de que no se generó un segundo documento
    } finally { vi.unstubAllGlobals() }
  })

  // Si el disparo ni siquiera llegó a salir (webhook mal configurado, por ejemplo), obligar a esperar
  // la ventana entera para reintentar sería absurdo: no se ganó nada guardando la reclamación.
  it('si el disparo a n8n falla, la reclamación se suelta y se puede reintentar de inmediato', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith() // sin remisionWebhookUrl: dispararRemision falla con 502, sin llamar a fetch
    const rem = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })
    const id = rem.body.id
    const enviar = () => request(app).post(`/api/remisiones/${id}/enviar`).set('Cookie', cookie)

    expect((await enviar()).status).toBe(502)
    expect((await enviar()).status).toBe(502) // no 409: si no se hubiera soltado, esto sería 409
  })

  // `resuelto_at` es justo lo que distingue un intento que ya terminó de uno todavía en vuelo, así
  // que un error reciente se puede reenviar aunque `enviado_at` esté dentro de la ventana de reenvío.
  it('tras un callback de error se puede reenviar de inmediato aunque enviado_at sea reciente', async () => {
    const cookie = await adminCookie(); await preparar()
    const fakeFetch = vi.fn(async () => new Response('{}', { status: 202 }))
    vi.stubGlobal('fetch', fakeFetch)
    try {
      const { app } = appWith({ remisionWebhookUrl: 'https://n8n/webhook/remision-entrada', remisionCallbackToken: 'secreto-cb' })
      const rem = await request(app).post('/api/remisiones').set('Cookie', cookie)
        .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })
      const id = rem.body.id
      const enviar = () => request(app).post(`/api/remisiones/${id}/enviar`).set('Cookie', cookie)

      expect((await enviar()).status).toBe(200) // deja enviado_at reciente
      await request(app).post(`/api/remisiones/${id}/callback`).set('X-Remision-Callback', 'secreto-cb')
        .send({ estado: 'error', resultado: { fallos: [{ paso: 'el PDF de la remisión' }] } })

      expect((await enviar()).status).toBe(200) // no 409 pese a estar dentro de la ventana
      expect(fakeFetch).toHaveBeenCalledTimes(2)
    } finally { vi.unstubAllGlobals() }
  })

  // Si n8n está caído, `fetch` rechaza en vez de devolver una respuesta con error. Sin capturarlo en
  // `dispararRemision`, la excepción caería en el manejador central (500 genérico) sin pasar por
  // `liberarEnvio`, y el técnico se quedaría sin poder reintentar durante toda la ventana de reenvío.
  it('si n8n está caído (fetch rechaza), la ruta responde 502 —no 500— y suelta la reclamación', async () => {
    const cookie = await adminCookie(); await preparar()
    const fakeFetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))
    vi.stubGlobal('fetch', fakeFetch)
    try {
      const { app } = appWith({ remisionWebhookUrl: 'https://n8n/webhook/remision-entrada' })
      const rem = await request(app).post('/api/remisiones').set('Cookie', cookie)
        .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })
      const id = rem.body.id
      const enviar = () => request(app).post(`/api/remisiones/${id}/enviar`).set('Cookie', cookie)

      expect((await enviar()).status).toBe(502)
      expect((await enviar()).status).toBe(502) // no 409: la reclamación se soltó pese al fallo de red
    } finally { vi.unstubAllGlobals() }
  })

  // Los tests anteriores llaman a enviar() con await, uno tras otro: eso prueba que el estado
  // persiste entre llamadas, pero no ejercita la condición de carrera que reclamarEnvio existe para
  // cerrar. Si alguien reintrodujera un leer-y-decidir en dos pasos, esos tests seguirían en verde;
  // este no. pg-mem es de un solo hilo, así que no reproduce la carrera real de Postgres, pero sí
  // detecta la regresión estructural: que el UPDATE deje de ser atómico.
  it('dos /enviar simultáneos: exactamente uno gana, el otro 409, un solo disparo a n8n', async () => {
    const cookie = await adminCookie(); await preparar()
    const fakeFetch = vi.fn(async () => new Response('{}', { status: 202 }))
    vi.stubGlobal('fetch', fakeFetch)
    try {
      const { app } = appWith({ remisionWebhookUrl: 'https://n8n/webhook/remision-entrada' })
      const rem = await request(app).post('/api/remisiones').set('Cookie', cookie)
        .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })
      const id = rem.body.id
      const enviar = () => request(app).post(`/api/remisiones/${id}/enviar`).set('Cookie', cookie)

      const [a, b] = await Promise.all([enviar(), enviar()])
      const estados = [a.status, b.status].sort()
      expect(estados).toEqual([200, 409])
      expect(fakeFetch).toHaveBeenCalledTimes(1)
    } finally { vi.unstubAllGlobals() }
  })

  it('el callback exige el secreto compartido y solo acepta estados conocidos', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith({ remisionCallbackToken: 'secreto-cb' })
    const rem = await request(app).post('/api/remisiones').set('Cookie', cookie).send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })
    const id = rem.body.id

    expect((await request(app).post(`/api/remisiones/${id}/callback`).send({ estado: 'ok' })).status).toBe(401)
    expect((await request(app).post(`/api/remisiones/${id}/callback`).set('X-Remision-Callback', 'otro').send({ estado: 'ok' })).status).toBe(401)
    expect((await request(app).post(`/api/remisiones/${id}/callback`).set('X-Remision-Callback', 'secreto-cb').send({ estado: 'raro' })).status).toBe(422)

    const ok = await request(app).post(`/api/remisiones/${id}/callback`).set('X-Remision-Callback', 'secreto-cb')
      .send({ estado: 'ok_con_avisos', resultado: { pdfId: 'drive-pdf-1', avisos: [{ paso: 'el correo al técnico' }] } })
    expect(ok.status).toBe(200)
    const lista = await request(app).get('/api/remisiones?ticketId=t1').set('Cookie', cookie)
    expect(lista.body[0]).toMatchObject({ estado: 'ok_con_avisos', resultado: { pdfId: 'drive-pdf-1' } })
  })

  // Sin secreto configurado la ruta NO puede quedar abierta: se cierra con 503.
  it('sin REMISION_CALLBACK_TOKEN el callback responde 503, no 200', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const rem = await request(app).post('/api/remisiones').set('Cookie', cookie).send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })
    const r = await request(app).post(`/api/remisiones/${rem.body.id}/callback`).set('X-Remision-Callback', '').send({ estado: 'ok' })
    expect(r.status).toBe(503)
  })

  it('sube fotos, las lista sin el base64 y las sirve con nosniff', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const rem = await request(app).post('/api/remisiones').set('Cookie', cookie).send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })
    const id = rem.body.id
    const png = Buffer.from('89504e470d0a1a0a', 'hex')
    const up = await request(app).post(`/api/remisiones/${id}/fotos`).set('Cookie', cookie).attach('file', png, { filename: 'equipo.png', contentType: 'image/png' })
    expect(up.status).toBe(201)
    expect(up.body).toMatchObject({ filename: 'equipo.png', contentType: 'image/png' })
    expect(up.body.contentB64).toBeUndefined() // el listado nunca devuelve el contenido

    const bajada = await request(app).get(`/api/remisiones/${id}/fotos/${up.body.id}`).set('Cookie', cookie)
    expect(bajada.status).toBe(200)
    expect(bajada.headers['x-content-type-options']).toBe('nosniff')

    const svg = Buffer.from('<svg/>')
    const malo = await request(app).post(`/api/remisiones/${id}/fotos`).set('Cookie', cookie).attach('file', svg, { filename: 'x.svg', contentType: 'image/svg+xml' })
    expect(malo.status).toBe(415) // SVG fuera: puede llevar script embebido
  })

  // El formulario sondea esta ruta tras enviar, esperando el desenlace que escribirá el callback.
  it('GET /:id devuelve la remisión con sus fotos; 404 si no existe; 401 sin sesión', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const rem = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: ['Manuales'] })
    const id = rem.body.id
    const png = Buffer.from('89504e470d0a1a0a', 'hex')
    await request(app).post(`/api/remisiones/${id}/fotos`).set('Cookie', cookie)
      .attach('file', png, { filename: 'equipo.png', contentType: 'image/png' })

    const res = await request(app).get(`/api/remisiones/${id}`).set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ id, estado: 'pendiente', incluye: ['Manuales'] })
    expect(res.body.fotos).toHaveLength(1)
    expect(res.body.fotos[0].contentB64).toBeUndefined() // el listado nunca lleva el base64

    expect((await request(app).get('/api/remisiones/rem-nope').set('Cookie', cookie)).status).toBe(404)
    expect((await request(app).get(`/api/remisiones/${id}`)).status).toBe(401)
  })

  // Anular es reversible A PROPÓSITO: la remisión es un documento que puede haberse mandado ya a un
  // cliente y su PDF sigue en Drive, así que la fila se marca y no se borra. Por eso desaparece de los
  // dos sitios donde se lista (panel del ticket y listado) y restaurar la devuelve a los dos.
  it('anular saca la remisión del listado y del panel del ticket; restaurar la devuelve a los dos', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const rem = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })
    const id = rem.body.id

    expect((await request(app).post(`/api/remisiones/${id}/anular`).set('Cookie', cookie)).status).toBe(200)

    const panelTrasAnular = await request(app).get('/api/remisiones?ticketId=t1').set('Cookie', cookie)
    expect(panelTrasAnular.body).toHaveLength(0)
    const listadoTrasAnular = await request(app).get('/api/remisiones/listado').set('Cookie', cookie)
    expect(listadoTrasAnular.body.find((r: RemisionListado) => r.id === id)).toBeUndefined()

    expect((await request(app).post(`/api/remisiones/${id}/restaurar`).set('Cookie', cookie)).status).toBe(200)

    const panelTrasRestaurar = await request(app).get('/api/remisiones?ticketId=t1').set('Cookie', cookie)
    expect(panelTrasRestaurar.body).toHaveLength(1)
    const listadoTrasRestaurar = await request(app).get('/api/remisiones/listado').set('Cookie', cookie)
    expect(listadoTrasRestaurar.body.find((r: RemisionListado) => r.id === id)).toBeDefined()
  })

  it('anuladaPor guarda quién anuló; el listado solo la trae con el flag de incluir anuladas', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    const rem = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })
    const id = rem.body.id
    await request(app).post(`/api/remisiones/${id}/anular`).set('Cookie', cookie)

    const sinFlag = await request(app).get('/api/remisiones/listado').set('Cookie', cookie)
    expect(sinFlag.body.find((r: RemisionListado) => r.id === id)).toBeUndefined()

    const conFlag = await request(app).get('/api/remisiones/listado?incluirAnuladas=1').set('Cookie', cookie)
    const fila = conFlag.body.find((r: RemisionListado) => r.id === id)
    expect(fila).toBeDefined()
    expect(fila.anuladaPor).toBe('Admin')
    expect(fila.anuladaAt).toBeTruthy()
  })

  // Mismo criterio que borrar un equipo o una resolución: solo administradores. requireAdmin va
  // DESPUÉS de requireAuth, así que sin sesión el corte es 401 y con sesión no-admin es 403.
  it('anular y restaurar exigen admin: 403 sin serlo, 401 sin sesión', async () => {
    const cookie = await adminCookie(); await preparar()
    const opCookie = await userCookie(['soporte'])
    const { app } = appWith()
    const rem = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })
    const id = rem.body.id

    expect((await request(app).post(`/api/remisiones/${id}/anular`).set('Cookie', opCookie)).status).toBe(403)
    expect((await request(app).post(`/api/remisiones/${id}/anular`)).status).toBe(401)

    expect((await request(app).post(`/api/remisiones/${id}/anular`).set('Cookie', cookie)).status).toBe(200)

    expect((await request(app).post(`/api/remisiones/${id}/restaurar`).set('Cookie', opCookie)).status).toBe(403)
    expect((await request(app).post(`/api/remisiones/${id}/restaurar`)).status).toBe(401)
  })

  it('anular y restaurar responden 404 si la remisión no existe', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()
    expect((await request(app).post('/api/remisiones/rem-nope/anular').set('Cookie', cookie)).status).toBe(404)
    expect((await request(app).post('/api/remisiones/rem-nope/restaurar').set('Cookie', cookie)).status).toBe(404)
  })

  // Enviar una remisión que se acaba de anular generaría un documento en Drive de algo que ya no
  // debería existir como tal: absurdo, y por eso se corta con 409 antes de llegar a n8n.
  it('una remisión anulada no se puede enviar', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith({ remisionWebhookUrl: 'https://n8n/webhook/remision-entrada' })
    const rem = await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: 't1', fecha: '2026-08-03', incluye: [] })
    const id = rem.body.id
    await request(app).post(`/api/remisiones/${id}/anular`).set('Cookie', cookie)

    const env = await request(app).post(`/api/remisiones/${id}/enviar`).set('Cookie', cookie)
    expect(env.status).toBe(409)
    expect(env.body.error).toMatch(/anulad/i)
  })
})

// Alimenta la sección "Remisiones" de la cabecera: la vista tabular que tenía la hoja de Google,
// ahora con históricas y de la app juntas.

describe('GET /api/remisiones/listado', () => {
  it('remisión con equipo enlazado trae marca y modelo del equipo (no del ticket)', async () => {
    await upsertEquipo(db, equipoRow('eq-l1', '18A20070'))
    await db.query(
      `INSERT INTO remisiones (id, ticket_id, tipo, fecha, tipo_servicio, perfil, equipo_id, serial, incluye, observaciones, creado_por, estado, empresa, persona_contacto, origen)
       VALUES ('rem-l1', NULL, 'entrada', '2026-08-01', 'Mantenimiento', 'grimm_edm180', 'eq-l1', '18A20070', '["Manuales"]'::jsonb, 'Sin novedad', 'Julián Maya', 'ok', 'ACME', 'Juan Gómez', 'app')`,
    )
    const cookie = await adminCookie()
    const { app } = appWith()
    const res = await request(app).get('/api/remisiones/listado').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0]).toMatchObject({
      id: 'rem-l1', fecha: '2026-08-01', tecnico: 'Julián Maya', empresa: 'ACME',
      personaContacto: 'Juan Gómez', marca: 'Grimm', modelo: 'EDM180C', serial: '18A20070',
      incluye: ['Manuales'], tipoServicio: 'Mantenimiento', observaciones: 'Sin novedad',
      estado: 'ok', origen: 'app', ticketId: null, ticketNumero: null,
    })
  })

  it('sin equipo enlazado, marca y modelo salen NULL sin reventar', async () => {
    await db.query(
      `INSERT INTO remisiones (id, tipo, fecha, creado_por, estado, origen)
       VALUES ('rem-l2', 'entrada', '2026-07-01', 'Ana Pérez', 'ok', 'historico')`,
    )
    const cookie = await adminCookie()
    const { app } = appWith()
    const res = await request(app).get('/api/remisiones/listado').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body[0]).toMatchObject({ id: 'rem-l2', marca: null, modelo: null })
  })

  it('sin ticket, ticketId y ticketNumero salen NULL', async () => {
    await db.query(
      `INSERT INTO remisiones (id, tipo, fecha, creado_por, estado, origen)
       VALUES ('rem-l3', 'entrada', '2026-06-01', 'Ana Pérez', 'ok', 'historico')`,
    )
    const cookie = await adminCookie()
    const { app } = appWith()
    const res = await request(app).get('/api/remisiones/listado').set('Cookie', cookie)
    expect(res.body[0]).toMatchObject({ id: 'rem-l3', ticketId: null, ticketNumero: null })
  })

  it('con ticket, trae el número correcto', async () => {
    await db.query("INSERT INTO tickets (id,number,status) VALUES ('t-l4', 4200, 'Finalizado')")
    await db.query(
      `INSERT INTO remisiones (id, ticket_id, tipo, fecha, creado_por, estado, origen)
       VALUES ('rem-l4', 't-l4', 'entrada', '2026-05-01', 'Ana Pérez', 'ok', 'app')`,
    )
    const cookie = await adminCookie()
    const { app } = appWith()
    const res = await request(app).get('/api/remisiones/listado').set('Cookie', cookie)
    expect(res.body[0]).toMatchObject({ id: 'rem-l4', ticketId: 't-l4', ticketNumero: '#4200' })
  })

  it('ordena por fecha descendente', async () => {
    await db.query(
      `INSERT INTO remisiones (id, tipo, fecha, creado_por, estado, origen) VALUES
        ('rem-l5', 'entrada', '2026-01-01', 'A', 'ok', 'historico'),
        ('rem-l6', 'entrada', '2026-03-01', 'B', 'ok', 'historico'),
        ('rem-l7', 'entrada', '2026-02-01', 'C', 'ok', 'historico')`,
    )
    const cookie = await adminCookie()
    const { app } = appWith()
    const res = await request(app).get('/api/remisiones/listado').set('Cookie', cookie)
    expect(res.body.map((r: any) => r.id)).toEqual(['rem-l6', 'rem-l7', 'rem-l5'])
  })

  // `fecha` es un `date`: no tiene hora. La única hora que existe es `created_at`, y la pantalla la
  // muestra solo en las de la app (en una histórica sería la hora de la importación, no la del
  // servicio). Por eso el listado tiene que traerla, aunque la tabla decida cuándo pintarla.
  it('trae createdAt, que es donde vive la hora que `fecha` no tiene', async () => {
    await db.query(
      `INSERT INTO remisiones (id, tipo, fecha, creado_por, estado, origen, created_at)
       VALUES ('rem-l9', 'entrada', '2026-07-24', 'Julián Maya', 'ok', 'app', '2026-07-24T19:41:00Z')`,
    )
    const cookie = await adminCookie()
    const { app } = appWith()
    const res = await request(app).get('/api/remisiones/listado').set('Cookie', cookie)
    expect(res.body[0].id).toBe('rem-l9')
    expect(new Date(res.body[0].createdAt).toISOString()).toBe('2026-07-24T19:41:00.000Z')
  })

  it('401 sin sesión', async () => {
    const { app } = appWith()
    expect((await request(app).get('/api/remisiones/listado')).status).toBe(401)
  })

  // Ocultar el interruptor "Ver anuladas" en la UI no protege nada: sin este corte, cualquier
  // usuario con sesión podía pedir esta URL a mano (barra de direcciones, curl) y ver quién anuló
  // qué y cuándo. El listado normal (sin el flag) sigue abierto a cualquier usuario autenticado.
  it('incluirAnuladas exige admin: 403 sin serlo; el listado normal sigue abierto a cualquier sesión', async () => {
    await db.query(
      `INSERT INTO remisiones (id, tipo, fecha, creado_por, estado, origen, anulada_at, anulada_por)
       VALUES ('rem-l9', 'entrada', '2026-08-01', 'Ana Pérez', 'ok', 'app', now(), 'Admin')`,
    )
    const opCookie = await userCookie(['soporte'])
    const { app } = appWith()

    expect((await request(app).get('/api/remisiones/listado?incluirAnuladas=1').set('Cookie', opCookie)).status).toBe(403)

    const normal = await request(app).get('/api/remisiones/listado').set('Cookie', opCookie)
    expect(normal.status).toBe(200)
    expect(normal.body.find((r: RemisionListado) => r.id === 'rem-l9')).toBeUndefined()

    const cookie = await adminCookie()
    const conFlag = await request(app).get('/api/remisiones/listado?incluirAnuladas=1').set('Cookie', cookie)
    expect(conFlag.status).toBe(200)
    expect(conFlag.body.find((r: RemisionListado) => r.id === 'rem-l9')).toBeDefined()
  })

  // El riesgo de registrar /listado junto a /nueva: si quedara DESPUÉS de /:id, Express lo trataría
  // como si 'listado' fuera un id. Este test lo cubre desde los dos lados: la ruta nueva no se come
  // /nueva ni /:id, y tampoco al revés.
  it('no rompe /nueva ni /:id, y /listado no cae en /:id (regresión del orden de rutas)', async () => {
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli1','Gecelca S.A. E.S.P.')")
    await db.query(
      `INSERT INTO tickets (id, number, status, managed_by_app, client_id, tipo_servicio, serial)
       VALUES ('t-l8', 4300, 'OV asignada', true, 'cli1', 'Mantenimiento', '18A1')`,
    )
    await db.query(
      `INSERT INTO remisiones (id, ticket_id, tipo, fecha, creado_por, estado, origen)
       VALUES ('rem-l8', 't-l8', 'entrada', '2026-08-03', 'Ana Pérez', 'pendiente', 'app')`,
    )
    const cookie = await adminCookie()
    const { app } = appWith()

    const listado = await request(app).get('/api/remisiones/listado').set('Cookie', cookie)
    expect(listado.status).toBe(200)
    expect(Array.isArray(listado.body)).toBe(true)

    const nueva = await request(app).get('/api/remisiones/nueva?ticketId=t-l8').set('Cookie', cookie)
    expect(nueva.status).toBe(200)

    const porId = await request(app).get('/api/remisiones/rem-l8').set('Cookie', cookie)
    expect(porId.status).toBe(200)
    expect(porId.body.id).toBe('rem-l8')
  })
})

// Los artículos salen de `books.items`, replicada del hub. Alimenta la validación del SKU de la ficha
// técnica y, más adelante, la elección de accesorios/consumibles/repuestos por modelo.

describe('Estados tempranos: Ticket creado → Remisión creada', () => {
  const preparar = async () => {
    await upsertEquipo(db, equipoRow('eq-e1', '18A20070'))
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli-e','Gecelca S.A. E.S.P.')")
  }
  /** Un ticket nacido de verdad por la API: el estado inicial lo pone `createTicket`, no el test. */
  const crearTicket = async (app: ReturnType<typeof appWith>['app'], cookie: string) => {
    const r = await request(app).post('/api/tickets').set('Cookie', cookie).send({
      clientId: 'cli-e', equipoId: 'eq-e1', tipoServicio: 'Calibración', clasificaciones: 'Equipo nuevo',
      prefijo: 'CG', ordenVenta: 'OV-1', prioridad: 'Media',
    })
    expect(r.status).toBe(201)
    return r.body.id as string
  }
  const estadoDe = async (id: string) =>
    (await db.query('SELECT status FROM tickets WHERE id=$1', [id])).rows[0].status

  it('el ticket nace en "Ticket creado", no en "OV asignada"', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith()
    expect(await estadoDe(await crearTicket(app, cookie))).toBe('Ticket creado')
  })

  // El ticket avanza cuando el documento EXISTE, no cuando se registró la intención: un envío que
  // falla dejaría al ticket diciendo "Remisión creada" sin PDF ni carpeta detrás.
  it('el desenlace confirmado lo mueve a "Remisión creada"; uno en error lo deja donde estaba', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith({ remisionCallbackToken: 'cb' })
    const ticketId = await crearTicket(app, cookie)
    const remId = async () => (await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId, fecha: '2026-08-03', incluye: [] })).body.id
    const callback = (id: string, estado: string) => request(app).post(`/api/remisiones/${id}/callback`)
      .set('X-Remision-Callback', 'cb').send({ estado })

    const fallida = await remId()
    await callback(fallida, 'error')
    expect(await estadoDe(ticketId)).toBe('Ticket creado')

    const buena = await remId()
    await callback(buena, 'ok')
    expect(await estadoDe(ticketId)).toBe('Remisión creada')
  })

  it('anular la única remisión confirmada lo devuelve, y restaurarla lo vuelve a adelantar', async () => {
    const cookie = await adminCookie(); await preparar()
    const { app } = appWith({ remisionCallbackToken: 'cb' })
    const ticketId = await crearTicket(app, cookie)
    const id = (await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId, fecha: '2026-08-03', incluye: [] })).body.id
    await request(app).post(`/api/remisiones/${id}/callback`).set('X-Remision-Callback', 'cb').send({ estado: 'ok' })
    expect(await estadoDe(ticketId)).toBe('Remisión creada')

    await request(app).post(`/api/remisiones/${id}/anular`).set('Cookie', cookie).send()
    expect(await estadoDe(ticketId)).toBe('Ticket creado')

    await request(app).post(`/api/remisiones/${id}/restaurar`).set('Cookie', cookie).send()
    expect(await estadoDe(ticketId)).toBe('Remisión creada')
  })

  // La decisión del usuario: los estados nuevos son de los tickets de la app. Un ticket de Zoho
  // conserva el suyo, porque moverlo lo marcaría `managed_by_app` y lo sacaría del sync sin pedirlo.
  it('un ticket venido de Zoho conserva "OV asignada" aunque su remisión se confirme', async () => {
    const cookie = await adminCookie(); await preparar()
    await db.query(`INSERT INTO tickets (id, number, status, client_id, tipo_servicio, equipo_id, marca, modelo, serial)
                    VALUES ('90210', 700, 'OV asignada', 'cli-e', 'Calibración', 'eq-e1', 'Grimm', 'EDM180C', '18A20070')`)
    const { app } = appWith({ remisionCallbackToken: 'cb' })
    const id = (await request(app).post('/api/remisiones').set('Cookie', cookie)
      .send({ ticketId: '90210', fecha: '2026-08-03', incluye: [] })).body.id
    await request(app).post(`/api/remisiones/${id}/callback`).set('X-Remision-Callback', 'cb').send({ estado: 'ok' })
    expect(await estadoDe('90210')).toBe('OV asignada')
  })
})
