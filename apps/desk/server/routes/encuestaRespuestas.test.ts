// indicadores-51-55 (F1F-05), lote 3 · RQ-KP-21 y RQ-KP-18: la ruta de carga de las respuestas de la encuesta.
// La escalera es 401 sesión < 403 administrador < multer (413 límite, 400 campo) < 400 sin fichero o fichero malo < carga.
// Las pruebas de POSICIÓN activan DOS guardas a la vez a propósito (regla de mutación 1 de `CLAUDE.md`): los pares «↔ multer» y
// «↔ 413» son los que hacen OBSERVABLE el orden de multer; sin ellos, moverlo no rompería nada porque el 403 saldría igual.
// El espía es un `Queryable` SIN `connect`, para que vea también lo que corre dentro de `enTransaccion`.
import { describe, it, expect } from 'vitest'
import http from 'node:http'
import type { AddressInfo } from 'node:net'
import request from 'supertest'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { LIMITE_SUBIDA_BYTES } from '../util/subida'
import { MOTIVO_TICKET_INEXISTENTE } from '../db/encuestaRespuestas'
import { ERRORES_CABECERA, MOTIVOS_FILA } from '../encuesta/analizarRespuestas'
import { MENSAJE_SIN_FICHERO } from './encuestaRespuestas'
import { db, instalarArnes, appWith, adminCookie, userCookie } from '../testing/appHarness'

instalarArnes()

const RUTA = '/api/indicadores/encuesta'
const CAB = 'Marca temporal;Número de ticket;Calificación de satisfacción'
const MARCA = '2027-01-12 08:00:00'
/** Fichero con BOM, separador `;` y fin de registro `\r\n`: la forma que declara el diseño (S-E, supuesto). */
const csv = (...filas: string[]): Buffer => Buffer.from('﻿' + [CAB, ...filas].join('\r\n') + '\r\n', 'utf8')
const VALIDO = csv(`${MARCA};100;Excelente`)
const SIN_COLUMNAS = Buffer.from('a;b\r\n1;2\r\n', 'utf8')
const VACIO = Buffer.alloc(0)
const SOBRE_EL_LIMITE = Buffer.alloc(LIMITE_SUBIDA_BYTES + 1, 0x61)

async function tickets(...numeros: number[]): Promise<void> {
  for (const n of numeros) await db.query('INSERT INTO tickets (id, number, subject, status, classification) VALUES ($1, $2, $3, $4, $5)', [`t${n}`, n, 's', 'Ingresado', 'Servicio'])
}
const guardadas = async () => (await db.query('SELECT ticket_id, calificacion, cargado_por FROM public.encuesta_respuestas ORDER BY id')).rows as Array<Record<string, unknown>>

function conEspia(): { app: ReturnType<typeof appWith>['app']; vistas: string[]; tabla: () => string[] } {
  const vistas: string[] = []
  const q: Queryable = { query: ((sql: string, p?: unknown[]) => { vistas.push(sql); return db.query(sql, p) }) as Queryable['query'] }
  return { app: appWith({}, q).app, vistas, tabla: () => vistas.filter((s) => /encuesta_respuestas/i.test(s)) }
}
/**
 * Estado de un POST con un fichero sobre el límite SIN pasar por supertest (hipótesis 8 del diseño, resuelta en contra): cuando el
 * servidor contesta 401 o 403 sin leer el cuerpo de más de 10 MB, cierra el socket y supertest da ECONNRESET en vez de entregar la
 * respuesta. Aquí se guarda el estado de la respuesta y se ignora el error de socket que llega DESPUÉS de haberla recibido.
 */
async function estadoSobreElLimite(app: ReturnType<typeof appWith>['app'], cookie: string | null): Promise<number> {
  const servidor = app.listen(0)
  try {
    const { port } = servidor.address() as AddressInfo
    const borde = 'borde-de-prueba'
    const cabeza = Buffer.from(`--${borde}\r\nContent-Disposition: form-data; name="file"; filename="r.csv"\r\nContent-Type: text/csv\r\n\r\n`)
    const cuerpo = Buffer.concat([cabeza, SOBRE_EL_LIMITE, Buffer.from(`\r\n--${borde}--\r\n`)])
    const headers: Record<string, string | number> = { 'Content-Type': `multipart/form-data; boundary=${borde}`, 'Content-Length': cuerpo.length }
    if (cookie) headers.Cookie = cookie
    return await new Promise<number>((resolve, reject) => {
      let respondida = false
      const req = http.request({ port, path: RUTA, method: 'POST', headers }, (res) => { respondida = true; res.resume(); resolve(res.statusCode ?? 0) })
      req.on('error', (e) => { if (!respondida) reject(e) })
      req.end(cuerpo)
    })
  } finally { servidor.close() }
}
/** Adjunta el fichero en el campo dado (por omisión `file`); sin cookie no manda sesión. */
function subir(app: ReturnType<typeof appWith>['app'], cookie: string | null, buf: Buffer | null, campo = 'file') {
  let r = request(app).post(RUTA)
  if (cookie) r = r.set('Cookie', cookie)
  return buf === null ? r : r.attach(campo, buf, { filename: 'respuestas.csv', contentType: 'text/csv' })
}

describe('RQ-KP-21 · el cuerpo de la carga', () => {
  it('carga válida: 200 con { leidas: 4, insertadas: 4, duplicadas: 0, rechazadas: [] } y cargado_por es el administrador', async () => {
    await tickets(101, 102, 103, 104)
    const f = csv(`${MARCA};101;Excelente`, `${MARCA};102;Regular`, `${MARCA};103;Bien`, `${MARCA};104;Mala`)
    const res = await subir(appWith().app, await adminCookie(), f)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ leidas: 4, insertadas: 4, duplicadas: 0, rechazadas: [] })
    const g = await guardadas()
    expect(g).toHaveLength(4)
    expect(g.every((x) => x.cargado_por === 'Admin')).toBe(true)
    expect(g.map((x) => x.ticket_id)).toEqual(['t101', 't102', 't103', 't104'])
  })

  it('ticket inexistente: leidas 3, insertadas 2 y una rechazada con fila 3 (la cabecera es la 1); las otras dos entran', async () => {
    await tickets(101, 103)
    const res = await subir(appWith().app, await adminCookie(), csv(`${MARCA};101;Excelente`, `${MARCA};999;Regular`, `${MARCA};103;Bien`))
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ leidas: 3, insertadas: 2, duplicadas: 0, rechazadas: [{ fila: 3, motivo: MOTIVO_TICKET_INEXISTENTE }] })
    expect((await guardadas()).map((x) => x.ticket_id)).toEqual(['t101', 't103'])
  })

  it('recarga del mismo fichero: insertadas 0, duplicadas N y la tabla conserva las mismas filas', async () => {
    await tickets(101, 102)
    const f = csv(`${MARCA};101;Excelente`, `${MARCA};102;Regular`)
    const cookie = await adminCookie()
    await subir(appWith().app, cookie, f)
    const res = await subir(appWith().app, cookie, f)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ leidas: 2, insertadas: 0, duplicadas: 2, rechazadas: [] })
    expect(await guardadas()).toHaveLength(2)
  })

  it('dos respuestas del mismo ticket con distinta marca de tiempo: entran las dos', async () => {
    await tickets(101)
    const res = await subir(appWith().app, await adminCookie(), csv(`${MARCA};101;Regular`, `2027-01-14 09:00:00;101;Excelente`))
    expect(res.body).toMatchObject({ leidas: 2, insertadas: 2, duplicadas: 0 })
    expect(await guardadas()).toHaveLength(2)
  })

  it('filas malas mezcladas: una sin calificación y dos válidas dan 200 (no 400) con la mala en rechazadas', async () => {
    await tickets(101, 102, 103)
    const res = await subir(appWith().app, await adminCookie(), csv(`${MARCA};101;Excelente`, `${MARCA};102;`, `${MARCA};103;Bien`))
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ leidas: 3, insertadas: 2, duplicadas: 0, rechazadas: [{ fila: 3, motivo: MOTIVOS_FILA.sinCalificacion }] })
  })

  it('huella repetida dentro del fichero: insertadas 1 y duplicadas 1', async () => {
    await tickets(101)
    const res = await subir(appWith().app, await adminCookie(), csv(`${MARCA};101;Excelente`, `${MARCA};101;Excelente`))
    expect(res.body).toEqual({ leidas: 2, insertadas: 1, duplicadas: 1, rechazadas: [] })
  })

  it('el actor sale de la sesión: un campo de formulario cargado_por de otra persona no cuenta (M26)', async () => {
    await tickets(101)
    const res = await subir(appWith().app, await adminCookie(), csv(`${MARCA};101;Excelente`)).field('cargado_por', 'Otra Persona')
    expect(res.status).toBe(200)
    expect((await guardadas()).map((x) => x.cargado_por)).toEqual(['Admin'])
  })

  it('rechazadas es la unión del analizador y de la comprobación de tickets, ordenada por fila, y leidas = insertadas + duplicadas + rechazadas', async () => {
    await tickets(101)
    const res = await subir(appWith().app, await adminCookie(), csv(
      `${MARCA};999;Regular`,      // fila 2 · ticket inexistente (capa de datos)
      `${MARCA};101;`,             // fila 3 · sin calificación (analizador)
      `${MARCA};101;Excelente`,    // fila 4 · entra
      `${MARCA};101;Excelente`,    // fila 5 · duplicada dentro del fichero
      `${MARCA};998;Bien`,         // fila 6 · ticket inexistente (capa de datos)
    ))
    expect(res.status).toBe(200)
    expect(res.body.rechazadas.map((r: { fila: number }) => r.fila)).toEqual([2, 3, 6])
    expect(res.body.leidas).toBe(5)
    expect(res.body.leidas).toBe(res.body.insertadas + res.body.duplicadas + res.body.rechazadas.length)
    expect(res.body).toMatchObject({ insertadas: 1, duplicadas: 1 })
  })
})

describe('RQ-KP-21 · la escalera y el orden de multer (pruebas de posición)', () => {
  it.each([
    ['sin cookie con fichero válido', VALIDO, 'file'],
    ['sin cookie con fichero vacío (401 ↔ 400)', VACIO, 'file'],
    ['sin cookie con el fichero en el campo «intruso» (401 ↔ multer: 401, no 400)', VALIDO, 'intruso'],
  ])('%s: 401 y ninguna sentencia nombra la tabla', async (_n, buf, campo) => {
    const { app, tabla } = conEspia()
    const res = await subir(app, null, buf, campo)
    expect(res.status).toBe(401)
    expect(tabla()).toEqual([])
  })

  it('sin cookie con un fichero sobre el límite (401 ↔ 413): 401 y ninguna sentencia nombra la tabla', async () => {
    const { app, tabla } = conEspia()
    expect(await estadoSobreElLimite(app, null)).toBe(401)
    expect(tabla()).toEqual([])
  })

  it('usuario sin administrador con un fichero mayor que el límite (403 ↔ 413): 403, no 413, y ninguna sentencia nombra la tabla', async () => {
    const cookie = await userCookie(['Comercial'])
    const { app, tabla } = conEspia()
    expect(await estadoSobreElLimite(app, cookie)).toBe(403)
    expect(tabla()).toEqual([])
  })

  it('sin cookie y sin fichero: 401', async () => {
    const { app, tabla } = conEspia()
    expect((await subir(app, null, null)).status).toBe(401)
    expect(tabla()).toEqual([])
  })

  it.each([
    ['fichero válido', VALIDO, 'file'],
    ['fichero vacío (403 ↔ 400)', VACIO, 'file'],
    ['cabecera irreconocible (403 ↔ 400)', SIN_COLUMNAS, 'file'],
    ['el fichero en el campo «intruso» (403 ↔ multer: 403, no 400)', VALIDO, 'intruso'],
  ])('usuario sin administrador con %s: 403 y ninguna sentencia nombra la tabla', async (_n, buf, campo) => {
    const cookie = await userCookie(['Comercial'])
    const { app, tabla } = conEspia()
    const res = await subir(app, cookie, buf, campo)
    expect(res.status).toBe(403)
    expect(tabla()).toEqual([])
  })

  it('usuario sin administrador y sin fichero: 403', async () => {
    const cookie = await userCookie(['Comercial'])
    const { app, tabla } = conEspia()
    expect((await subir(app, cookie, null)).status).toBe(403)
    expect(tabla()).toEqual([])
  })

  it('administrador sin fichero: 400 con MENSAJE_SIN_FICHERO y ninguna sentencia nombra la tabla', async () => {
    const cookie = await adminCookie()
    const { app, tabla } = conEspia()
    const res = await subir(app, cookie, null)
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: MENSAJE_SIN_FICHERO })
    expect(tabla()).toEqual([])
  })

  it('administrador con fichero de cero bytes (hipótesis 4): 400 con { error } y ninguna sentencia nombra la tabla', async () => {
    const cookie = await adminCookie()
    const { app, tabla } = conEspia()
    const res = await subir(app, cookie, VACIO)
    expect(res.status).toBe(400)
    expect(typeof res.body.error).toBe('string')
    expect(tabla()).toEqual([])
  })

  it('administrador con cabecera irreconocible: 400 con el error de cabecera y ninguna sentencia nombra la tabla', async () => {
    const cookie = await adminCookie()
    const { app, tabla } = conEspia()
    const res = await subir(app, cookie, SIN_COLUMNAS)
    expect(res.status).toBe(400)
    expect(String(res.body.error).startsWith(ERRORES_CABECERA.faltan([]))).toBe(true)
    expect(tabla()).toEqual([])
  })

  it('administrador con el fichero en el campo «intruso»: 400 y ninguna sentencia nombra la tabla', async () => {
    await tickets(100)
    const cookie = await adminCookie()
    const { app, tabla } = conEspia()
    const res = await subir(app, cookie, VALIDO, 'intruso')
    expect(res.status).toBe(400)
    expect(tabla()).toEqual([])
  })

  it('administrador con un fichero sobre el límite: 413 y ninguna sentencia nombra la tabla', async () => {
    const cookie = await adminCookie()
    const { app, tabla } = conEspia()
    const res = await subir(app, cookie, SOBRE_EL_LIMITE)
    expect(res.status).toBe(413)
    expect(tabla()).toEqual([])
  })

  it('el fichero malo gana a la carga: un fichero vacío y un ticket que existe no dejan rastro en la tabla (400 ↔ carga)', async () => {
    await tickets(100)
    const cookie = await adminCookie()
    const { app, tabla } = conEspia()
    expect((await subir(app, cookie, VACIO)).status).toBe(400)
    expect((await subir(app, cookie, SIN_COLUMNAS)).status).toBe(400)
    expect(tabla()).toEqual([])
    expect(await guardadas()).toEqual([])
  })
})

describe('RQ-KP-18 · la carga no abre la puerta a otras escrituras', () => {
  it('tras una carga válida las únicas sentencias de escritura nombran public.encuesta_respuestas y ninguna otra tabla', async () => {
    await tickets(100)
    const cookie = await adminCookie()
    const { app, vistas } = conEspia()
    const res = await subir(app, cookie, VALIDO)
    expect(res.status).toBe(200)
    const escrituras = vistas.filter((s) => /^\s*(INSERT|UPDATE|DELETE)\b/i.test(s))
    expect(escrituras.length).toBeGreaterThan(0)
    expect(escrituras.every((s) => /^\s*INSERT INTO public\.encuesta_respuestas\b/i.test(s))).toBe(true)
    expect(escrituras.some((s) => /\btickets\b|ticket_transitions/i.test(s))).toBe(false)
  })
})
