import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { upsertEquipo } from './db/equipos'
import { reclamarEnvio } from './db/remisiones'
import { db, instalarArnes, equipoRow, appWith, adminCookie, userCookie } from './testing/appHarness'

instalarArnes()

/**
 * F1B-04 (`rotulado-tras-enviar`) · lote 1a: quién envió (RQ-RE-42, R42-a, R42-b, R42-d).
 * `reclamarEnvio` escribe `enviado_por_id` en el MISMO UPDATE que gana la reclamación; `liberarEnvio` lo limpia.
 */
type App = import('express').Express
const URL_N8N = { remisionWebhookUrl: 'https://n8n/webhook/remision-entrada' }
const PNG = Buffer.from('89504e470d0a1a0a', 'hex')

const preparar = async () => {
  await upsertEquipo(db, equipoRow('eq-rc1', '18A20070'))
  await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli1','Gecelca S.A. E.S.P.')")
  await db.query(`INSERT INTO tickets (id, number, status, managed_by_app, client_id, tipo_servicio, equipo_id, marca, modelo, serial)
                  VALUES ('t1', 10000, 'OV asignada', true, 'cli1', 'Mantenimiento', 'eq-rc1', 'Grimm', 'EDM180C', '18A1')`)
}
const conN8n = async (prueba: (fetchMock: ReturnType<typeof vi.fn>) => Promise<void>) => {
  const fetchMock = vi.fn(async (...args: [string, RequestInit]) => { void args; return new Response('{}', { status: 202 }) })
  vi.stubGlobal('fetch', fetchMock)
  try { await prueba(fetchMock) } finally { vi.unstubAllGlobals() }
}
const nueva = async (app: App, cookie: string) =>
  (await request(app).post('/api/remisiones').set('Cookie', cookie).send({ ticketId: 't1', fecha: '2026-08-03', incluye: [], novedades: ['sin_novedad'], rotulado: true })).body.id as string
const subirTodas = async (app: App, cookie: string, id: string) => {
  for (const categoria of ['equipo', 'accesorios', 'embalaje']) {
    const r = await request(app).post(`/api/remisiones/${id}/fotos`).set('Cookie', cookie).field('categoria', categoria).attach('file', PNG, { filename: 'f.png', contentType: 'image/png' })
    expect(r.status).toBe(201)
  }
}
const enviar = (app: App, cookie: string, id: string) => request(app).post(`/api/remisiones/${id}/enviar`).set('Cookie', cookie)
const idDe = async (email: string) => String((await db.query('SELECT id FROM users WHERE email = $1', [email])).rows[0].id)
const enviadoPor = async (id: string) => (await db.query('SELECT enviado_por_id FROM remisiones WHERE id = $1', [id])).rows[0].enviado_por_id
const enviadoAt = async (id: string) => (await db.query('SELECT enviado_at FROM remisiones WHERE id = $1', [id])).rows[0].enviado_at

describe('RQ-RE-42 · quién envió: enviado_por_id (R42-a, R42-b, R42-d)', () => {
  it('R42-a · el envío ganador guarda el id de quien envió, y un reenvío tras un error lo sobrescribe con el de quien reenvía', () => conN8n(async () => {
    const admin = await adminCookie(); const op = await userCookie(['Servicio Técnico']); await preparar(); const { app } = appWith(URL_N8N)
    const id = await nueva(app, admin); await subirTodas(app, admin, id)
    expect(await enviadoPor(id), 'antes de enviar nadie envió').toBeNull()
    expect((await enviar(app, admin, id)).status).toBe(200)
    expect(await enviadoPor(id)).toBe(await idDe('admin@x.co'))
    // el callback informa un error: el envío ya no está en curso y se puede reenviar
    await db.query("UPDATE remisiones SET estado = 'error', resuelto_at = now() WHERE id = $1", [id])
    expect((await enviar(app, op, id)).status).toBe(200)
    expect(await enviadoPor(id), 'el reenvío sobrescribe').toBe(await idDe('op@x.co'))
  }))

  it('R42-b · quien pierde la reclamación no escribe, y el 422 de contenido tampoco', () => conN8n(async (n8n) => {
    const admin = await adminCookie(); const op = await userCookie(['Servicio Técnico']); await preparar(); const { app } = appWith(URL_N8N)
    const id = await nueva(app, admin)
    expect((await enviar(app, admin, id)).status, 'sin fotos: puerta de contenido').toBe(422)
    expect(await enviadoPor(id), 'el 422 de contenido no escribe').toBeNull()
    expect(n8n).not.toHaveBeenCalled()
    await subirTodas(app, admin, id)
    expect((await enviar(app, admin, id)).status).toBe(200)
    const ganador = await enviadoPor(id)
    expect(ganador).toBe(await idDe('admin@x.co'))
    expect((await enviar(app, op, id)).status, 'quien llega tarde pierde la reclamación').toBe(409)
    expect(await enviadoPor(id), 'quien pierde no escribe').toBe(ganador)
  }))

  it('R42-d · si el disparo no sale, liberarEnvio limpia enviado_por_id junto con enviado_at', () => conN8n(async () => {
    const admin = await adminCookie(); await preparar(); const { app } = appWith() // sin remisionWebhookUrl: el disparo no sale
    const id = await nueva(app, admin); await subirTodas(app, admin, id)
    const r = await enviar(app, admin, id)
    expect(r.status).toBe(502)
    expect(await enviadoAt(id)).toBeNull()
    expect(await enviadoPor(id), 'quien no llegó a enviar no es «quien envió»').toBeNull()
  }))

  it('R42-e · pg-mem acepta `enviado_por_id = $4` con el parámetro en null:reclamarEnvio sin el cuarto argumento gana y deja NULL (nace verde)', async () => {
    const admin = await adminCookie(); await preparar(); const { app } = appWith(URL_N8N)
    const id = await nueva(app, admin)
    expect(await reclamarEnvio(db, id)).toBe(true)
    expect(await enviadoAt(id)).not.toBeNull()
    expect(await enviadoPor(id)).toBeNull()
  })
})

/**
 * F1B-04 (`rotulado-tras-enviar`) · lote 1b: la acción de confirmar (RQ-RE-40, R40-a…f, R40-d1…d6) y la marca
 * `pendienteRotular` (RQ-RE-41, R41-b, R41-c). Las pruebas de POSICIÓN (R40-d1…d6) activan LAS DOS guardas del par a la
 * vez y afirman código Y texto (regla de mutación 1): si se intercambian dos guardas vecinas, la del par se pone roja.
 */
const T = {
  noExiste: 'Remisión no encontrada',
  permiso: 'Confirmar el rotulado requiere el área Servicio Técnico',
  anulada: 'Esta remisión fue anulada: no admite confirmar el rotulado',
  legado: 'Esta remisión es anterior al registro de recepción y no lleva confirmación de rotulado',
  sinEnvio: 'El rotulado se confirma después de enviar: esta remisión todavía no se envió con éxito',
  yaConfirmada: 'El rotulado de esta remisión ya estaba confirmado',
}
const confirmar = (app: App, cookie: string | null, id: string) => {
  const r = request(app).post(`/api/remisiones/${id}/rotulado`)
  return cookie ? r.set('Cookie', cookie) : r
}
const fijar = async (id: string, sql: string) => { await db.query(`UPDATE remisiones SET ${sql} WHERE id = $1`, [id]) }
const traza = async (id: string) => (await db.query('SELECT rotulado_at, rotulado_por FROM remisiones WHERE id = $1', [id])).rows[0] as { rotulado_at: Date | null; rotulado_por: string | null }
const leer = async (app: App, cookie: string, id: string) => (await request(app).get(`/api/remisiones/${id}`).set('Cookie', cookie)).body
const NO_AUTORIZADO = ['Comercial']

describe('RQ-RE-40 · confirmar el rotulado (R40-a, R40-b, R40-c)', () => {
  it('R40-a · confirma tras `ok` y tras `ok_con_avisos`, y escribe la traza del servidor aunque el cuerpo diga otra cosa', async () => {
    const op = await userCookie(['Servicio Técnico']); const admin = await adminCookie(); await preparar(); const { app } = appWith()
    for (const estado of ['ok', 'ok_con_avisos']) {
      const id = await nueva(app, admin); await fijar(id, `estado = '${estado}'`)
      const antes = Date.now() - 1000
      const r = await confirmar(app, op, id).send({ rotuladoPor: 'Otra Persona', rotuladoAt: '2020-01-01T00:00:00Z' })
      const despues = Date.now() + 1000
      expect(r.status, estado).toBe(200)
      expect(r.body.rotuladoPor, 'la persona sale de la sesión').toBe('Op')
      const t = Date.parse(r.body.rotuladoAt)
      expect(t >= antes && t <= despues, 'la hora sale del servidor').toBe(true)
      expect(r.body.pendienteRotular).toBe(false)
      expect(r.body.id).toBe(id)
    }
  })

  it('R40-b · un administrador sin el área confirma; quien tiene otra área recibe 403 y no escribe', async () => {
    const admin = await adminCookie(); const otro = await userCookie(NO_AUTORIZADO); await preparar(); const { app } = appWith()
    const id = await nueva(app, admin); await fijar(id, "estado = 'ok'")
    const no = await confirmar(app, otro, id)
    expect(no.status).toBe(403); expect(no.body.error).toBe(T.permiso)
    expect((await traza(id)).rotulado_at).toBeNull()
    const si = await confirmar(app, admin, id)
    expect(si.status).toBe(200); expect(si.body.rotuladoPor).toBe('Admin')
  })

  it('R40-c · repetir responde 409 y no reescribe la traza; de dos simultáneas exactamente una gana', async () => {
    const admin = await adminCookie(); const op = await userCookie(['Servicio Técnico']); await preparar(); const { app } = appWith()
    const id = await nueva(app, admin); await fijar(id, "estado = 'ok'")
    expect((await confirmar(app, op, id)).status).toBe(200)
    const t1 = await traza(id)
    const otra = await confirmar(app, admin, id)
    expect(otra.status).toBe(409); expect(otra.body.error).toBe(T.yaConfirmada)
    const t2 = await traza(id)
    expect(t2.rotulado_por, 'intacta').toBe(t1.rotulado_por); expect(t2.rotulado_at?.getTime()).toBe(t1.rotulado_at?.getTime())
    // dos simultáneas sobre una sin confirmar
    const id2 = await nueva(app, admin); await fijar(id2, "estado = 'ok'")
    const [a, b] = await Promise.all([confirmar(app, op, id2), confirmar(app, admin, id2)])
    expect([a.status, b.status].sort(), 'exactamente una gana').toEqual([200, 409])
    const perdedora = a.status === 409 ? a : b
    expect(perdedora.body.error).toBe(T.yaConfirmada)
    const ganadora = a.status === 200 ? a : b
    expect((await traza(id2)).rotulado_por, 'queda la traza de la ganadora').toBe(ganadora.body.rotuladoPor)
  })
})

describe('RQ-RE-40 · orden total de guardas: una prueba de posición por par vecino (R40-d1…d6)', () => {
  it('R40-d1 · sin sesión gana a la inexistente: 401 < 404', async () => {
    await preparar(); const { app } = appWith()
    const r = await confirmar(app, null, 'no-existe')
    expect(r.status).toBe(401)
    expect(r.body.error).not.toBe(T.noExiste)
  })

  it('R40-d2 · la inexistente gana al permiso: 404 < 403', async () => {
    const otro = await userCookie(NO_AUTORIZADO); await preparar(); const { app } = appWith()
    const r = await confirmar(app, otro, 'no-existe')
    expect(r.status).toBe(404); expect(r.body.error).toBe(T.noExiste)
  })

  it('R40-d3 · el permiso gana a la anulada: 403 < 409', async () => {
    const admin = await adminCookie(); const otro = await userCookie(NO_AUTORIZADO); await preparar(); const { app } = appWith()
    const id = await nueva(app, admin); await fijar(id, "estado = 'ok', anulada_at = now()")
    const r = await confirmar(app, otro, id)
    expect(r.status).toBe(403); expect(r.body.error).toBe(T.permiso)
  })

  it('R40-d4 · la anulada gana a la de legado: 409 < 422', async () => {
    const admin = await adminCookie(); await preparar(); const { app } = appWith()
    const id = await nueva(app, admin); await fijar(id, "estado = 'ok', anulada_at = now(), novedades = NULL")
    const r = await confirmar(app, admin, id)
    expect(r.status).toBe(409); expect(r.body.error).toBe(T.anulada)
  })

  it('R40-d5 · la de legado gana a la que no se envió con éxito: 422 de legado < 422 de «sin envío»', async () => {
    const admin = await adminCookie(); await preparar(); const { app } = appWith()
    const id = await nueva(app, admin); await fijar(id, "estado = 'pendiente', novedades = NULL")
    const r = await confirmar(app, admin, id)
    expect(r.status).toBe(422); expect(r.body.error).toBe(T.legado)
  })

  it('R40-d6 · «sin envío con éxito» gana a «ya confirmada»: B < D (S11, la traza no cambia)', async () => {
    const admin = await adminCookie(); await preparar(); const { app } = appWith()
    const id = await nueva(app, admin); await fijar(id, "estado = 'error', rotulado_at = '2026-10-01T10:00:00Z', rotulado_por = 'Quien Sea'")
    const antes = await traza(id)
    const r = await confirmar(app, admin, id)
    expect(r.status).toBe(422); expect(r.body.error).toBe(T.sinEnvio)
    const despues = await traza(id)
    expect(despues.rotulado_por).toBe('Quien Sea'); expect(despues.rotulado_at?.getTime()).toBe(antes.rotulado_at?.getTime())
  })
})

describe('RQ-RE-40 · el rotulado no bloquea (R40-e, R40-f)', () => {
  it('R40-e · sin confirmar, el callback `ok` lleva el ticket a «Remisión creada» con rotulado_at en NULL', async () => {
    const admin = await adminCookie(); await preparar()
    await db.query("UPDATE tickets SET status='Ticket creado' WHERE id='t1'") // ver remisiones.test.ts: sólo avanzan los nacidos en la app
    const { app } = appWith({ remisionCallbackToken: 'secreto-cb' })
    const id = await nueva(app, admin)
    const cb = await request(app).post(`/api/remisiones/${id}/callback`).set('X-Remision-Callback', 'secreto-cb').send({ estado: 'ok' })
    expect(cb.status).toBe(200)
    expect((await db.query("SELECT status FROM tickets WHERE id='t1'")).rows[0].status).toBe('Remisión creada')
    expect((await traza(id)).rotulado_at, 'sin confirmar').toBeNull()
  })

  it('R40-f · un callback `error` posterior no borra la confirmación', async () => {
    const admin = await adminCookie(); await preparar(); const { app } = appWith({ remisionCallbackToken: 'secreto-cb' })
    const id = await nueva(app, admin); await fijar(id, "estado = 'ok'")
    expect((await confirmar(app, admin, id)).status).toBe(200)
    const antes = await traza(id)
    const cb = await request(app).post(`/api/remisiones/${id}/callback`).set('X-Remision-Callback', 'secreto-cb').send({ estado: 'error', resultado: { error: 'x' } })
    expect(cb.status).toBe(200)
    expect((await db.query('SELECT estado FROM remisiones WHERE id = $1', [id])).rows[0].estado).toBe('error')
    const despues = await traza(id)
    expect(despues.rotulado_por).toBe('Admin'); expect(despues.rotulado_at?.getTime()).toBe(antes.rotulado_at?.getTime())
  })
})

describe('RQ-RE-41 · pendienteRotular lo calcula el servidor (R41-b, R41-c)', () => {
  it('R41-b · el campo viaja en las dos lecturas (por ticket y por id) y pasa a falso al confirmar', async () => {
    const admin = await adminCookie(); await preparar(); const { app } = appWith()
    const id = await nueva(app, admin); await fijar(id, "estado = 'ok'")
    const porTicket = async () => ((await request(app).get('/api/remisiones').query({ ticketId: 't1' }).set('Cookie', admin)).body as { id: string; pendienteRotular: boolean }[]).find((x) => x.id === id)!.pendienteRotular
    expect(await porTicket()).toBe(true)
    expect((await leer(app, admin, id)).pendienteRotular).toBe(true)
    expect((await confirmar(app, admin, id)).status).toBe(200)
    expect(await porTicket()).toBe(false)
    expect((await leer(app, admin, id)).pendienteRotular).toBe(false)
  })

  // Una por fila de la tabla de RQ-RE-41. Enfrenta las dos implementaciones de la misma noción (molde H5).
  const FILAS: { caso: string; set: string }[] = [
    { caso: '`pendiente`, sin rotulado_at', set: "estado = 'pendiente'" },
    { caso: '`error`, sin rotulado_at', set: "estado = 'error'" },
    { caso: '`ok`, sin rotulado_at', set: "estado = 'ok'" },
    { caso: '`ok_con_avisos`, sin rotulado_at', set: "estado = 'ok_con_avisos'" },
    { caso: '`ok`, con rotulado_at', set: "estado = 'ok', rotulado_at = '2026-10-01T10:00:00Z', rotulado_por = 'X'" },
    { caso: '`ok_con_avisos`, con rotulado_at', set: "estado = 'ok_con_avisos', rotulado_at = '2026-10-01T10:00:00Z', rotulado_por = 'X'" },
    { caso: '`ok` anulada, sin rotulado_at', set: "estado = 'ok', anulada_at = now()" },
    { caso: '`ok` de legado (novedades NULL)', set: "estado = 'ok', novedades = NULL" },
  ]
  it.each(FILAS)('R41-c · $caso: la acción responde 200 si y sólo si la marca era verdadera', async ({ set }) => {
    const admin = await adminCookie(); const op = await userCookie(['Servicio Técnico']); await preparar(); const { app } = appWith()
    const id = await nueva(app, admin); await fijar(id, set)
    const marca = (await leer(app, admin, id)).pendienteRotular
    expect(typeof marca).toBe('boolean')
    expect((await confirmar(app, op, id)).status === 200).toBe(marca)
  })
})
