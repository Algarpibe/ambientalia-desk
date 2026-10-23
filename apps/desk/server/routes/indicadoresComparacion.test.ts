// F1F-05 (comparacion-exportacion-zoho), lote 3 · RQ-KP-26, -27 y los escenarios nuevos de RQ-KP-14, -17 y -18: la ruta de comparación.
// Escalera: 401 sesión < 403 administrador < multer (413 límite, 400 campo) < 400 periodo < 400 sin fichero < 400 del lector < consultas.
// Las pruebas de POSICIÓN activan DOS guardas a la vez a propósito (regla de mutación 1 de `CLAUDE.md`). El espía es un `Queryable`
// SIN `connect`; «consulta de tickets» es toda sentencia que case `TICKETS`. El fixture es sintético (`../testing/exportacionZoho`).
import { describe, it, expect, vi, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { inspect } from 'node:util'
import request from 'supertest'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { CABECERA_MUESTRA, CENTINELA_CORREO, CENTINELA_NOMBRE, RELLENO_MUESTRA, csvMuestra, filaMuestra } from '../testing/exportacionZoho'
import { LIMITE_SUBIDA_BYTES, LIMITE_SUBIDA_MB } from '../util/subida'
import { logger } from '../util/logger'
import { validarPeriodo } from '../indicadores'
import { COLUMNAS_INDICADOR, ERRORES_EXPORTACION, MOTIVOS_EXPORTACION } from '../comparacion/leerExportacion'
import { MENSAJE_SIN_EXPORTACION } from './indicadoresComparacion'
import { db, instalarArnes, appWith, adminCookie, userCookie, estadoDePostGrande } from '../testing/appHarness'

instalarArnes()
afterEach(() => { vi.restoreAllMocks() })

const RUTA = '/api/indicadores/comparacion'
const TICKETS = /\btickets\b|ticket_transitions/i
const DATOS = /ticket_transitions|calendario_cierres|encuesta_respuestas|FROM tickets/i
const noSelect = (sentencias: string[]): string[] => sentencias.filter((s) => !/^\s*SELECT\b/i.test(s))
const INVERTIDO = { desde: '2026-12-31', hasta: '2026-12-01' }
const errorDe = (q: { desde?: string; hasta?: string }): string => { const p = validarPeriodo(q); if (p.ok) throw new Error('el periodo era válido'); return p.error }
const SERVICIO = 'Tiempo de servicio', DIAGNOSTICO = 'Tiempo de diagnóstico', VENTA = 'Tiempo de orden de Venta', PROMESA = 'Cumplimiento del tiempo  promesa'

const fila = (id: string, numero: number | string, sobre: Record<string, string> = {}) => filaMuestra({ ID: id, 'ID de la solicitud': String(numero), ...sobre })
const VALIDO = csvMuestra([fila('100000000000000001', 1001)])
const SIN_COLUMNAS = csvMuestra([fila('1', 1)], { quitar: ['ID de la solicitud', SERVICIO] })
const SIN_ID = csvMuestra([fila('1', 1)], { quitar: ['ID'] })
const SOBRE_EL_LIMITE = Buffer.alloc(LIMITE_SUBIDA_BYTES + 1, 0x61)

/** Un ticket con 59 de la aplicación = días entre el 2026-12-01 y `venta` (cotización fija). */
const sembrar = (id: string, number: number, venta: string, creado = '2026-12-01T15:00:00Z', zoho = '{}') =>
  db.query("INSERT INTO tickets (id, number, subject, status, created_time, status_type, closed_time, fecha_cotizacion, fecha_orden_venta, custom_fields) VALUES ($1, $2, 's', 'x', $3, 'Closed', $3, '2026-12-01', $4, $5)", [id, number, creado, venta, zoho])

function conEspia(): { app: ReturnType<typeof appWith>['app']; zohoFetch: ReturnType<typeof appWith>['zohoFetch']; todas: string[]; tickets: () => string[]; datos: () => string[] } {
  const todas: string[] = []
  const q: Queryable = { query: ((sql: string, p?: unknown[]) => { todas.push(sql); return db.query(sql, p) }) as Queryable['query'] }
  const { app, zohoFetch } = appWith({}, q)
  return { app, zohoFetch, todas, tickets: () => todas.filter((s) => TICKETS.test(s)), datos: () => todas.filter((s) => DATOS.test(s)) }
}
/** Adjunta el fichero en el campo dado (por omisión `file`); sin cookie no manda sesión. */
function subir(app: ReturnType<typeof appWith>['app'], cookie: string | null, buf: Buffer | null, o: { campo?: string; query?: Record<string, string> } = {}) {
  let r = request(app).post(RUTA).query(o.query ?? {})
  if (cookie) r = r.set('Cookie', cookie)
  return buf === null ? r : r.attach(o.campo ?? 'file', buf, { filename: 'tickets.csv', contentType: 'text/csv' })
}
/** Todas las claves de un JSON, a cualquier profundidad. */
const claves = (v: unknown): string[] => (v !== null && typeof v === 'object' ? Object.entries(v).flatMap(([k, x]) => [k, ...claves(x)]) : [])
const col = (c: { porColumna: Array<{ columna: string }> }, columna: string) => c.porColumna.find((x) => x.columna === columna) as unknown as Record<string, number> & { diferencias: Array<Record<string, unknown>> }

/** Dos tickets del periodo que cruzan, uno del periodo ausente del fichero, uno de Desk fuera del periodo, uno ajeno y una fila mala. */
async function escenarioMixto(): Promise<Buffer> {
  await sembrar('111', 1001, '2026-12-03'); await sembrar('222', 1002, '2026-12-04')
  await sembrar('333', 1003, '2026-12-03', '2026-12-01T15:00:00Z', `{"${VENTA}": 2}`)
  await sembrar('444', 1004, '2026-06-03', '2026-06-01T15:00:00Z')
  return csvMuestra([fila('111', 1001), fila('222', 1099), fila('444', 1004), fila('555', 5005), fila('', 7007)])
}
const PERIODO = { desde: '2026-12-01', hasta: '2026-12-31' }

describe('RQ-KP-26 · el cuerpo de la comparación', () => {
  it('todo cruza: 200 con la forma de D4, listas siempre presentes y vacías, el periodo y cuatro consultas de datos', async () => {
    await sembrar('100000000000000001', 1001, '2026-12-03'); await sembrar('100000000000000002', 1002, '2026-12-03')
    const { app, datos } = conEspia()
    const res = await subir(app, await adminCookie(), csvMuestra([fila('100000000000000001', 1001), fila('100000000000000002', 1002)]), { query: { desde: '2026-12-01' } })
    expect(res.status).toBe(200)
    expect(Object.keys(res.body).sort()).toEqual(['comparacion', 'cruce', 'fichero', 'periodo'])
    expect(res.body.periodo).toEqual({ desde: '2026-12-01', hasta: null })
    expect(res.body.fichero).toEqual({ leidas: 2, rechazadas: [] })
    expect(Object.keys(res.body.cruce).sort()).toEqual(['cruzados', 'fueraDelPeriodo', 'numeroDistinto', 'soloEnDesk', 'soloEnFichero', 'valoresIlegibles'])
    expect(res.body.cruce).toMatchObject({ cruzados: 2, soloEnFichero: { total: 0, tickets: [] }, fueraDelPeriodo: { total: 0, tickets: [] }, soloEnDesk: { total: 0, tickets: [] }, numeroDistinto: { total: 0, tickets: [] }, valoresIlegibles: { total: 0, porColumna: {}, valores: [] } })
    expect(res.body.comparacion.porColumna).toHaveLength(9)
    expect(col(res.body.comparacion, '59')).toMatchObject({ comparados: 2, coincidentes: 2, porcentaje: 100 })
    expect(datos()).toHaveLength(4)
  })

  it('los cuatro grupos a la vez: cada ticket va a su lista y valen los invariantes del fichero, del periodo y de cada columna', async () => {
    const f = await escenarioMixto()
    const { app, datos } = conEspia()
    const res = await subir(app, await adminCookie(), f, { query: PERIODO })
    expect(res.status).toBe(200)
    const { cruce, fichero, comparacion } = res.body
    expect(fichero).toEqual({ leidas: 5, rechazadas: [{ fila: 6, columna: 'ID', motivo: MOTIVOS_EXPORTACION.idVacio }] })
    expect(cruce.cruzados).toBe(2)
    expect(cruce.soloEnFichero).toEqual({ total: 1, tickets: [{ id: '555', numero: 5005 }] })
    expect(cruce.fueraDelPeriodo).toEqual({ total: 1, tickets: [{ id: '444', numero: 1004 }] })
    expect(cruce.soloEnDesk).toEqual({ total: 1, tickets: [{ id: '333', numero: 1003 }] })
    expect(cruce.numeroDistinto).toEqual({ total: 1, tickets: [{ id: '222', numeroFichero: 1099, numeroDesk: 1002 }] })
    expect(fichero.leidas).toBe(fichero.rechazadas.length + cruce.cruzados + cruce.soloEnFichero.total + cruce.fueraDelPeriodo.total)
    expect(cruce.cruzados + cruce.soloEnDesk.total).toBe(3)
    for (const c of comparacion.porColumna) expect(c.comparados + c.sinComparar).toBe(cruce.cruzados)
    expect(col(comparacion, '59')).toMatchObject({ comparados: 2, coincidentes: 2 })
    expect(datos()).toHaveLength(5)
  })

  it('una fila mala no tumba la carga: la de clave vacía va a rechazadas con su fila y las demás se comparan', async () => {
    await sembrar('111', 1001, '2026-12-03'); await sembrar('222', 1002, '2026-12-03')
    const res = await subir(appWith().app, await adminCookie(), csvMuestra([fila('111', 1001), fila('', 9), fila('222', 1002)]))
    expect(res.status).toBe(200)
    expect(res.body.fichero).toEqual({ leidas: 3, rechazadas: [{ fila: 3, columna: 'ID', motivo: MOTIVOS_EXPORTACION.idVacio }] })
    expect(res.body.cruce.cruzados).toBe(2)
    expect(col(res.body.comparacion, '59').comparados).toBe(2)
  })

  it('tolerancia de un día y sin veredicto: la diferencia de uno coincide, la de tres es diferencia mayor y no hay color, meta ni bandera', async () => {
    await sembrar('111', 1001, '2026-12-04'); await sembrar('222', 1002, '2026-12-06')   // 59 de la aplicación: 3 y 5 contra 2 del fichero
    const res = await subir(appWith().app, await adminCookie(), csvMuestra([fila('111', 1001), fila('222', 1002)]))
    const c = col(res.body.comparacion, '59')
    expect(c).toMatchObject({ comparados: 2, coincidentes: 1, diferentes: 1, porcentaje: 50 })
    expect(c.diferencias).toHaveLength(1)
    expect(c.diferencias[0]).toMatchObject({ ticketId: '222', columna: '59', contra: 'valor', app: 5, zoho: 2, delta: 3 })
    expect(claves(res.body).filter((k) => /color|meta|sem[aá]foro|umbral|veredicto|aprob/i.test(k))).toEqual([])
    expect(JSON.stringify(res.body.comparacion)).not.toMatch(/aprob|sem[aá]foro|umbral|veredicto/i)
  })

  it('camino único: «2.5» no es legible y el par queda sin comparar y listado; la celda no se lee con Number', async () => {
    await sembrar('111', 1001, '2026-12-04')   // 59 de la aplicación = 3; con Number(«2.5») coincidiría dentro del día
    const res = await subir(appWith().app, await adminCookie(), csvMuestra([fila('111', 1001, { [VENTA]: '2.5' })]))
    expect(col(res.body.comparacion, '59')).toMatchObject({ comparados: 0, sinComparar: 1, porcentaje: null })
    expect(res.body.cruce.valoresIlegibles).toEqual({ total: 1, porColumna: { [VENTA]: 1 }, valores: [{ fila: 2, columna: VENTA }] })
  })

  it.each([['  Cumple  ', 1, 0], ['no cumple', 0, 1]])('camino único del 54: «%s» llega por el recorte de valorDeZoho y se compara con el valor de la aplicación', async (celda, coincide, difiere) => {
    await db.query("INSERT INTO tickets (id, number, subject, status, created_time, status_type, closed_time, codigo_servicio, dias_entrega, fecha_orden_venta, fecha_finalizacion_st) VALUES ('777', 7, 's', 'Finalizado', '2026-10-02T15:00:00Z', 'Closed', '2026-10-02T15:00:00Z', 'ST-1', 4, '2026-10-08', '2026-10-15')")
    const res = await subir(appWith().app, await adminCookie(), csvMuestra([fila('777', 7, { [PROMESA]: celda })]))
    expect(col(res.body.comparacion, '54')).toMatchObject({ comparados: 1, coincidentes: coincide, diferentes: difiere })
  })

  it('todo es lectura: toda sentencia es un SELECT, ninguna tabla cambia, no hay llamada a Zoho ni se importa node:fs', async () => {
    const f = await escenarioMixto()
    const antes = (await db.query('SELECT count(*) AS n FROM tickets')).rows[0]
    const { app, todas, zohoFetch } = conEspia()
    expect((await subir(app, await adminCookie(), f, { query: PERIODO })).status).toBe(200)
    expect(todas.length).toBeGreaterThan(5)
    expect(noSelect(todas)).toEqual([])
    expect((await db.query('SELECT count(*) AS n FROM tickets')).rows[0]).toEqual(antes)
    expect(zohoFetch).not.toHaveBeenCalled()
    for (const ruta of ['./indicadoresComparacion.ts', '../comparacion/leerExportacion.ts', '../comparacion/cruzarExportacion.ts', '../db/ticketsPorId.ts']) {
      expect(readFileSync(new URL(ruta, import.meta.url), 'utf8'), ruta).not.toMatch(/node:fs|from 'fs'|\bconsole\b/)
    }
    const fuente = readFileSync(new URL('./indicadoresComparacion.ts', import.meta.url), 'utf8')
    for (const pieza of ['leerEntradasIndicadores', 'tablaIndicadores', 'parDeIndicador', 'compararIndicadores']) expect(fuente).toContain(pieza)
  })
})

describe('RQ-KP-26 · la escalera y el orden de multer (pruebas de posición)', () => {
  it.each([
    ['fichero y periodo válidos', VALIDO, 'file', PERIODO],
    ['el fichero en el campo «intruso» (401 ↔ multer: 401, no 400)', VALIDO, 'intruso', PERIODO],
    ['periodo invertido (401 ↔ 400 del periodo)', VALIDO, 'file', INVERTIDO],
    ['cabecera incompleta (401 ↔ 400 del lector)', SIN_COLUMNAS, 'file', PERIODO],
  ])('sin cookie con %s: 401 y ninguna consulta de tickets', async (_n, buf, campo, query) => {
    const { app, tickets } = conEspia()
    expect((await subir(app, null, buf, { campo, query })).status).toBe(401)
    expect(tickets()).toEqual([])
  })
  it('sin cookie y sin fichero: 401', async () => {
    const { app, tickets } = conEspia()
    expect((await subir(app, null, null)).status).toBe(401)
    expect(tickets()).toEqual([])
  })
  it('sin cookie con un fichero sobre el límite (401 ↔ 413): 401, no 413, y ninguna consulta de tickets', async () => {
    const { app, tickets } = conEspia()
    expect(await estadoDePostGrande(app, RUTA, null, LIMITE_SUBIDA_BYTES + 1)).toBe(401)
    expect(tickets()).toEqual([])
  })

  it.each([
    ['fichero y periodo válidos', VALIDO, 'file', PERIODO],
    ['el fichero en el campo «intruso» (403 ↔ multer: 403, no 400)', VALIDO, 'intruso', PERIODO],
    ['periodo invertido (403 ↔ 400 del periodo)', VALIDO, 'file', INVERTIDO],
    ['cabecera incompleta (403 ↔ 400 del lector)', SIN_COLUMNAS, 'file', PERIODO],
  ])('usuario sin administrador con %s: 403 y ninguna consulta de tickets', async (_n, buf, campo, query) => {
    const { app, tickets } = conEspia()
    expect((await subir(app, await userCookie(['Comercial']), buf, { campo, query })).status).toBe(403)
    expect(tickets()).toEqual([])
  })
  it('usuario sin administrador con un fichero sobre el límite (403 ↔ 413): 403, no 413, y ninguna consulta de tickets', async () => {
    const { app, tickets } = conEspia()
    expect(await estadoDePostGrande(app, RUTA, await userCookie(['Comercial']), LIMITE_SUBIDA_BYTES + 1)).toBe(403)
    expect(tickets()).toEqual([])
  })

  it('administrador con un fichero sobre el límite y el periodo invertido (413 ↔ 400 del periodo): 413 con el límite en MB', async () => {
    const { app, tickets } = conEspia()
    const res = await subir(app, await adminCookie(), SOBRE_EL_LIMITE, { query: INVERTIDO })
    expect(res.status).toBe(413)
    expect(res.body).toEqual({ error: `El archivo supera el límite de ${LIMITE_SUBIDA_MB} MB` })
    expect(tickets()).toEqual([])
  })
  it('el límite es el común de 10 MB: un fichero un byte por debajo pasa multer y cae en el lector, no en 413', async () => {
    expect(LIMITE_SUBIDA_BYTES).toBe(10 * 1024 * 1024)
    const res = await subir(appWith().app, await adminCookie(), Buffer.alloc(LIMITE_SUBIDA_BYTES - 1, 0x61))
    expect(res.status).toBe(400)
    expect(res.body.error).toBe(ERRORES_EXPORTACION.faltan(['ID', 'ID de la solicitud', ...COLUMNAS_INDICADOR.map((c) => c.nombre)]))
  })
  it('administrador con el fichero en el campo «intruso»: 400 de multer y ninguna consulta de tickets', async () => {
    const { app, tickets } = conEspia()
    expect((await subir(app, await adminCookie(), VALIDO, { campo: 'intruso', query: PERIODO })).status).toBe(400)
    expect(tickets()).toEqual([])
  })

  it.each([['sin fichero', null], ['con un fichero sin «ID»', SIN_ID]])('administrador, periodo invertido y %s (400 del periodo ↔ 400 del fichero): gana el error del periodo', async (_n, buf) => {
    const { app, tickets } = conEspia()
    const res = await subir(app, await adminCookie(), buf, { query: INVERTIDO })
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: errorDe(INVERTIDO) })
    expect(tickets()).toEqual([])
  })
  it('administrador con periodo válido y sin fichero (400 sin fichero ↔ 400 del lector): MENSAJE_SIN_EXPORTACION', async () => {
    const { app, tickets } = conEspia()
    const res = await subir(app, await adminCookie(), null, { query: PERIODO })
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: MENSAJE_SIN_EXPORTACION })
    expect(tickets()).toEqual([])
  })
  it('administrador con un fichero sin dos columnas (400 del lector ↔ consultas): el mensaje nombra las dos y no se lee ningún ticket', async () => {
    await sembrar('1', 1, '2026-12-03')
    const { app, tickets } = conEspia()
    const res = await subir(app, await adminCookie(), SIN_COLUMNAS, { query: PERIODO })
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: ERRORES_EXPORTACION.faltan(['ID de la solicitud', SERVICIO]) })
    expect(tickets()).toEqual([])
  })
  it.each([
    ['de cero bytes (hipótesis 4)', Buffer.alloc(0), null],
    ['con un NUL (binario)', Buffer.concat([Buffer.from('ID,'), Buffer.from([0])]), ERRORES_EXPORTACION.binario],
    ['con la cabecera y ninguna fila', csvMuestra([]), ERRORES_EXPORTACION.sinFilas],
    ['con una columna repetida', Buffer.from(`${CABECERA_MUESTRA.join(',')},ID\r\n`), ERRORES_EXPORTACION.repetida('ID')],
  ])('administrador con un fichero %s: 400 del lector y ninguna consulta de tickets', async (_n, buf, esperado) => {
    const { app, tickets } = conEspia()
    const res = await subir(app, await adminCookie(), buf, { query: PERIODO })
    expect(res.status).toBe(400)
    if (esperado === null) expect(typeof res.body.error).toBe('string'); else expect(res.body).toEqual({ error: esperado })
    expect(tickets()).toEqual([])
  })
})

describe('RQ-KP-14, -17 y -18 · escenarios nuevos', () => {
  it('el GET no cambia por existir la ruta ni usa el fichero: tras un POST responde lo mismo, con cuatro consultas y sin el valor 99 del fichero', async () => {
    await sembrar('111', 1001, '2026-12-03')
    const cookie = await adminCookie()
    const get = async () => { const { app, datos } = conEspia(); const r = await request(app).get('/api/indicadores').set('Cookie', cookie); return { status: r.status, cuerpo: r.body, consultas: datos().length } }
    const antes = await get()
    const post = await subir(appWith().app, cookie, csvMuestra([fila('111', 1001, { [VENTA]: '99' })]))
    expect(post.status).toBe(200)
    expect(col(post.body.comparacion, '59')).toMatchObject({ comparados: 1, diferentes: 1 })
    const despues = await get()
    expect(despues).toEqual(antes)
    expect(despues.consultas).toBe(4)
    expect(despues.cuerpo.comparacion).toMatchObject({ comparable: false, mensaje: 'sin valor de Zoho con que comparar' })
  })
  it('el POST ignora «formato» (DD-10): con ?formato=xml y un fichero válido responde 200, no el 400 del GET', async () => {
    await sembrar('100000000000000001', 1001, '2026-12-03')
    const res = await subir(appWith().app, await adminCookie(), VALIDO, { query: { ...PERIODO, formato: 'xml' } })
    expect(validarPeriodo({ ...PERIODO, formato: 'xml' }).ok).toBe(false)   // el validador común sí lo rechazaría
    expect(res.status).toBe(200)
    expect(res.body.cruce.cruzados).toBe(1)
  })
})

describe('RQ-KP-27 · privacidad', () => {
  const espiar = () => [
    ...(['log', 'info', 'warn', 'error', 'debug'] as const).map((n) => vi.spyOn(console, n).mockImplementation(() => {})),
    ...(['debug', 'info', 'warn', 'error'] as const).map((n) => vi.spyOn(logger, n)),
  ]
  const capturado = (espias: ReturnType<typeof espiar>) => inspect(espias.map((e) => e.mock.calls), { depth: 10 })
  const SECRETOS = [CENTINELA_NOMBRE, CENTINELA_CORREO, 'xyz', '1.23457E+17', RELLENO_MUESTRA]
  const SUBIDA = () => csvMuestra([fila('111', 1001, { [DIAGNOSTICO]: 'xyz' }), fila('1.23457E+17', 1002)])

  it('datos de contacto centinela: ni la respuesta, ni los motivos, ni lo escrito en consola o registro los llevan', async () => {
    await sembrar('111', 1001, '2026-12-03')
    const espias = espiar()
    const res = await subir(appWith().app, await adminCookie(), SUBIDA(), { query: { columnas: 'Correo electrónico' } })
    expect(res.status).toBe(200)
    expect(res.body.cruce.valoresIlegibles.total).toBe(1)
    expect(res.body.fichero.rechazadas).toHaveLength(1)
    const texto = JSON.stringify(res.body) + capturado(espias)
    for (const s of SECRETOS) expect(texto, s).not.toContain(s)
  })
  it('una columna de contacto no sale aunque se pida: ninguna de las 47 cabeceras que no se leen es clave de la respuesta y ningún relleno aparece', async () => {
    await sembrar('111', 1001, '2026-12-03')
    const res = await subir(appWith().app, await adminCookie(), SUBIDA(), { query: { columnas: 'todas' } })
    const leidas = new Set(['ID', 'ID de la solicitud', ...COLUMNAS_INDICADOR.map((c) => c.nombre)])
    const noLeidas = CABECERA_MUESTRA.filter((c) => !leidas.has(c))
    expect(noLeidas).toHaveLength(47)
    expect(res.status).toBe(200)
    const presentes = claves(res.body)
    expect(presentes.length).toBeGreaterThan(20)
    for (const c of noLeidas) expect(presentes, c).not.toContain(c)
    expect(JSON.stringify(res.body)).not.toContain(RELLENO_MUESTRA)
  })
  it('un fallo inesperado en la lectura de tickets da 500 «Error interno» y ni la respuesta ni lo registrado llevan celdas', async () => {
    const espias = espiar()
    const q: Queryable = { query: ((sql: string, p?: unknown[]) => { if (/FROM tickets t/i.test(sql)) throw new Error('fallo simulado de lectura'); return db.query(sql, p) }) as Queryable['query'] }
    const res = await subir(appWith({}, q).app, await adminCookie(), SUBIDA())
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Error interno' })
    const registro = capturado(espias)
    expect(registro).toContain('fallo simulado de lectura')
    for (const s of SECRETOS) expect(registro + JSON.stringify(res.body), s).not.toContain(s)
  })
})

// ── filtro-indicadores-por-flujo (F1F-05, L1a): caracterización de M2 del POST (RQ-KP-32, «el cuerpo de hoy») ─────────────────────────────
// Escrita ANTES de tocar producción: el `sha256` es el del cuerpo de ese día, sobre un fixture con los cuatro flujos.
import { createHash } from 'node:crypto'

describe('M2 · caracterización del POST sin flujo: los bytes de hoy', () => {
  it('sin parámetro `flujo`: ni clave `flujo` ni `deOtroFlujo`, las claves en su orden y el cuerpo idéntico byte a byte', async () => {
    const alta = (id: string, n: number, estado: string, clasificacion: string | null) =>
      db.query("INSERT INTO tickets (id, number, subject, status, created_time, status_type, closed_time, fecha_cotizacion, fecha_orden_venta, classification) VALUES ($1, $2, 's', $3, '2026-12-01T15:00:00Z', 'Closed', '2026-12-01T15:00:00Z', '2026-12-01', '2026-12-03', $4)", [id, n, estado, clasificacion])
    await alta('101', 1001, 'Ticket creado', 'Equipo nuevo'); await alta('102', 1002, 'Rev./Diagnostico', 'Soporte remoto')
    await alta('103', 1003, 'Por Facturar', 'Servicio'); await alta('104', 1004, 'Ticket creado', null)
    await alta('105', 1005, 'Ticket creado', 'Equipo nuevo')
    await db.query("UPDATE tickets SET created_time = '2026-06-01T15:00:00Z', closed_time = '2026-06-01T15:00:00Z' WHERE id = '105'")
    const f = csvMuestra([fila('101', 1001), fila('102', 1002), fila('103', 1003), fila('105', 1005), fila('999', 9009)])
    const res = await subir(appWith().app, await adminCookie(), f, { query: PERIODO })
    expect(res.status).toBe(200)
    expect(Object.keys(res.body)).toEqual(['periodo', 'fichero', 'cruce', 'comparacion'])
    expect(Object.keys(res.body.cruce)).toEqual(['cruzados', 'soloEnFichero', 'fueraDelPeriodo', 'soloEnDesk', 'numeroDistinto', 'valoresIlegibles'])
    expect(res.body.cruce).toMatchObject({ cruzados: 3, soloEnFichero: { total: 1 }, fueraDelPeriodo: { total: 1 }, soloEnDesk: { total: 1 } })
    expect(createHash('sha256').update(res.text).digest('hex')).toBe('862d1958da8da38ec164e10ddd2158bcb0f1fc66f5e835af60a0f4cbc10623a7')
  })
})

// ── filtro-indicadores-por-flujo (F1F-05, L1b): el POST con `flujo` (RQ-KP-29 y RQ-KP-32; M3, M4, M6, M8 y M10 del POST) ─────────────────────
import { MENSAJE_FLUJO } from '../indicadores'

/** Un ticket con estado y clasificación a elección; los estados que usa el fixture separan `flujoDelTicket` del predicado por clasificación (M6). */
const altaFlujo = (id: string, number: number, estado: string, clasificacion: string | null, creado = '2026-12-01T15:00:00Z') =>
  db.query("INSERT INTO tickets (id, number, subject, status, created_time, status_type, closed_time, fecha_cotizacion, fecha_orden_venta, classification) VALUES ($1, $2, 's', $3, $4, 'Closed', $4, '2026-12-01', '2026-12-03', $5)", [id, number, estado, creado, clasificacion])
const FUERA = '2026-06-01T15:00:00Z'
/** Periodo: 111 EN, 222 SR, 333 EN heredado (ausente del fichero), 777 servicio (ausente). Fuera: 444 servicio, 555 EN. Ausente de Desk: 666. Una fila mala. */
async function escenarioFlujos(): Promise<Buffer> {
  await altaFlujo('111', 1001, 'Ticket creado', 'Equipo nuevo'); await altaFlujo('222', 1002, 'Rev./Diagnostico', 'Soporte remoto')
  await altaFlujo('333', 1003, 'Por Facturar', 'Equipo nuevo'); await altaFlujo('777', 1007, 'Ticket creado', 'Servicio')
  await altaFlujo('444', 1004, 'Ticket creado', 'Servicio', FUERA); await altaFlujo('555', 1005, 'Ticket creado', 'Equipo nuevo', FUERA)
  return csvMuestra([fila('111', 1001), fila('222', 1002), fila('444', 1004), fila('555', 1005), fila('666', 1006), fila('', 7007)])
}
const porId = (todas: string[]): string[] => todas.filter((s) => /FROM tickets WHERE id IN/i.test(s))
/** Con la cadena de consulta tal cual: permite `flujo=` vacío y repetido. */
let galleta: { d: unknown; c: string } | null = null   // la base es nueva en cada prueba: una sola sesión de administrador por prueba
const adminDeLaPrueba = async (): Promise<string> => { if (galleta?.d !== db) galleta = { d: db, c: await adminCookie() }; return galleta.c }
const subirQs = async (app: ReturnType<typeof appWith>['app'], buf: Buffer | null, qs: string) => {
  const r = request(app).post(`${RUTA}?${qs}`).set('Cookie', await adminDeLaPrueba())
  return buf === null ? r : r.attach('file', buf, { filename: 'tickets.csv', contentType: 'text/csv' })
}
const PERIODO_QS = 'desde=2026-12-01&hasta=2026-12-31'
const idsDe = (c: { tickets: Array<{ id: string }> }): string[] => c.tickets.map((t) => t.id)

describe('RQ-KP-32 · el POST con flujo: los cubos y la forma (M4, M6)', () => {
  it('Otro flujo dentro del periodo: el SR del periodo va a `deOtroFlujo`, no a «fuera del periodo», y el flujo sale tras `periodo`', async () => {
    const f = await escenarioFlujos()
    const preguntados: unknown[] = [], porIdVistas: string[] = []
    const q: Queryable = { query: ((sql: string, p?: unknown[]) => { if (/FROM tickets WHERE id IN/i.test(sql)) { porIdVistas.push(sql); preguntados.push(...(p ?? [])) } return db.query(sql, p) }) as Queryable['query'] }
    const res = await subirQs(appWith({}, q).app, f, `${PERIODO_QS}&flujo=equipo-nuevo`)
    expect(res.status).toBe(200)
    expect(preguntados).not.toContain('222')   // cruzó con los del periodo (todos los flujos): no se pregunta por ID
    expect(Object.keys(res.body)).toEqual(['periodo', 'flujo', 'fichero', 'cruce', 'comparacion'])
    expect(res.body.flujo).toBe('equipo-nuevo')
    expect(Object.keys(res.body.cruce)).toEqual(['cruzados', 'soloEnFichero', 'fueraDelPeriodo', 'deOtroFlujo', 'soloEnDesk', 'numeroDistinto', 'valoresIlegibles'])
    expect(res.body.cruce.deOtroFlujo.tickets).toContainEqual({ id: '222', numero: 1002 })
    expect(idsDe(res.body.cruce.fueraDelPeriodo)).not.toContain('222')
    expect(porIdVistas).toHaveLength(1)
  })
  it('Otro flujo fuera del periodo: el servicio de fuera va a `deOtroFlujo` y el equipo nuevo de fuera a «fuera del periodo»', async () => {
    const f = await escenarioFlujos()
    const res = await subirQs(appWith().app, f, `${PERIODO_QS}&flujo=equipo-nuevo`)
    const { cruce, fichero } = res.body
    expect(cruce.cruzados).toBe(1)
    expect(cruce.deOtroFlujo).toEqual({ total: 2, tickets: [{ id: '222', numero: 1002 }, { id: '444', numero: 1004 }] })
    expect(cruce.fueraDelPeriodo).toEqual({ total: 1, tickets: [{ id: '555', numero: 1005 }] })
    expect(cruce.soloEnFichero).toEqual({ total: 1, tickets: [{ id: '666', numero: 1006 }] })
    expect(cruce.soloEnDesk).toEqual({ total: 1, tickets: [{ id: '333', numero: 1003 }] })
    expect(fichero.leidas).toBe(fichero.rechazadas.length + cruce.cruzados + cruce.soloEnFichero.total + cruce.fueraDelPeriodo.total + cruce.deOtroFlujo.total)
  })
  it('con otro flujo el mismo fichero se reparte distinto: soporte-remoto cruza el 222 y deja el resto de los existentes como `deOtroFlujo`', async () => {
    const f = await escenarioFlujos()
    const { cruce, fichero } = (await subirQs(appWith().app, f, `${PERIODO_QS}&flujo=soporte-remoto`)).body
    expect(cruce.cruzados).toBe(1)
    expect(idsDe(cruce.deOtroFlujo)).toEqual(['111', '444', '555'])
    expect(cruce.fueraDelPeriodo.total).toBe(0)
    expect(cruce.soloEnDesk.total).toBe(0)
    expect(fichero.leidas).toBe(fichero.rechazadas.length + cruce.cruzados + cruce.soloEnFichero.total + cruce.fueraDelPeriodo.total + cruce.deOtroFlujo.total)
  })
  it('la comparación sale sólo de los cruzados del flujo: con equipo-nuevo compara 1 ticket y sin flujo cruzan 2', async () => {
    const f = await escenarioFlujos()
    const con = (await subirQs(appWith().app, f, `${PERIODO_QS}&flujo=equipo-nuevo`)).body
    expect(col(con.comparacion, '59').comparados).toBe(1)
    expect((await subirQs(appWith().app, f, PERIODO_QS)).body.cruce.cruzados).toBe(2)
  })
  it('M6 · el estado no decide: «Equipo nuevo» en `Ticket creado` y en `Por Facturar` es de equipo nuevo, y «Soporte remoto» en `Rev./Diagnostico` de soporte remoto', async () => {
    await altaFlujo('111', 1001, 'Ticket creado', 'Equipo nuevo'); await altaFlujo('333', 1003, 'Por Facturar', 'Equipo nuevo'); await altaFlujo('222', 1002, 'Rev./Diagnostico', 'Soporte remoto')
    const f = csvMuestra([fila('111', 1001), fila('333', 1003), fila('222', 1002)])
    const en = (await subirQs(appWith().app, f, `${PERIODO_QS}&flujo=equipo-nuevo`)).body.cruce
    expect(en.cruzados).toBe(2)
    expect(en.deOtroFlujo.tickets).toEqual([{ id: '222', numero: 1002 }])
    const sr = (await subirQs(appWith().app, f, `${PERIODO_QS}&flujo=soporte-remoto`)).body.cruce
    expect(sr.cruzados).toBe(1)
    expect(sr.deOtroFlujo.total).toBe(2)
  })
  it('con flujo, `deOtroFlujo` está siempre, aunque vacío', async () => {
    await altaFlujo('111', 1001, 'Ticket creado', 'Equipo nuevo')
    const res = await subirQs(appWith().app, csvMuestra([fila('111', 1001)]), 'flujo=equipo-nuevo')
    expect(res.status).toBe(200)
    expect(res.body.cruce.deOtroFlujo).toEqual({ total: 0, tickets: [] })
  })
  it('sin flujo (M2): ni la clave `flujo` ni `deOtroFlujo`, y el servicio y el equipo nuevo del periodo cruzan juntos', async () => {
    const f = await escenarioFlujos()
    const res = await subirQs(appWith().app, f, PERIODO_QS)
    expect(Object.keys(res.body)).toEqual(['periodo', 'fichero', 'cruce', 'comparacion'])
    expect(Object.keys(res.body.cruce)).toEqual(['cruzados', 'soloEnFichero', 'fueraDelPeriodo', 'soloEnDesk', 'numeroDistinto', 'valoresIlegibles'])
    expect(res.body.cruce.cruzados).toBe(2)
    expect(idsDe(res.body.cruce.fueraDelPeriodo)).toEqual(['444', '555'])
  })
})

describe('RQ-KP-29 · el parámetro flujo del POST y su orden (M3, M8)', () => {
  it.each([['Valor desconocido', 'flujo=otro'], ['vacío', 'flujo='], ['Vacío, repetido y otra grafía: repetido', 'flujo=servicio&flujo=servicio'], ['Vacío, repetido y otra grafía: otra grafía', 'flujo=Servicio']])('%s (%s): 400 con MENSAJE_FLUJO y ninguna consulta de datos', async (_n, qs) => {
    const { app, datos, tickets } = conEspia()
    const res = await subirQs(app, VALIDO, qs)
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: MENSAJE_FLUJO })
    expect(datos()).toEqual([])
    expect(tickets()).toEqual([])
  })
  it('Periodo antes que flujo (regla de mutación 1): periodo invertido + flujo=otro → el mensaje del periodo, que no nombra «flujo»', async () => {
    const { app, tickets } = conEspia()
    const res = await subirQs(app, VALIDO, 'desde=2026-12-31&hasta=2026-12-01&flujo=otro')
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: errorDe(INVERTIDO) })
    expect(res.body.error).not.toContain('flujo')
    expect(tickets()).toEqual([])
  })
  it.each([['sin fichero', null], ['con un fichero sin «ID»', SIN_ID]])('Flujo antes que «falta el fichero» y que el lector: flujo=otro %s → MENSAJE_FLUJO', async (_n, buf) => {
    const { app, tickets } = conEspia()
    const res = await subirQs(app, buf, 'flujo=otro')
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: MENSAJE_FLUJO })
    expect(tickets()).toEqual([])
  })
  it('un flujo válido sin fichero da el 400 de siempre, MENSAJE_SIN_EXPORTACION: el flujo bueno no tapa la falta del fichero', async () => {
    const res = await subirQs(appWith().app, null, 'flujo=servicio')
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: MENSAJE_SIN_EXPORTACION })
  })
  it('flujo=otro sin sesión → 401 y sin administrador → 403, no 400', async () => {
    expect((await request(appWith().app).post(`${RUTA}?flujo=otro`)).status).toBe(401)
    expect((await request(appWith().app).post(`${RUTA}?flujo=otro`).set('Cookie', await userCookie(['Comercial']))).status).toBe(403)
  })
  it.each(['servicio', 'equipo-nuevo', 'soporte-remoto'])('flujo=%s es válido: 200 y se devuelve en el cuerpo', async (flujo) => {
    const res = await subirQs(appWith().app, VALIDO, `flujo=${flujo}`)
    expect(res.status).toBe(200)
    expect(res.body.flujo).toBe(flujo)
  })
})

describe('RQ-KP-32 · las mismas consultas con y sin flujo (M10)', () => {
  it('Mismas consultas: con y sin flujo son cuatro de datos más UNA por bloque de «ID» sin cruzar; sólo SELECT, y sólo con flujo se lee la clasificación por ID', async () => {
    const f = await escenarioFlujos()
    const sin = conEspia()
    const sinRes = await subirQs(sin.app, f, PERIODO_QS)
    const con = conEspia()
    const conRes = await subirQs(con.app, f, `${PERIODO_QS}&flujo=equipo-nuevo`)
    expect([sinRes.status, conRes.status]).toEqual([200, 200])
    expect(sin.datos()).toHaveLength(5)
    expect(con.datos()).toHaveLength(5)
    expect(porId(sin.todas)).toHaveLength(1)
    expect(porId(con.todas)).toHaveLength(1)
    expect(noSelect(con.todas)).toEqual([])
    expect(porId(con.todas)[0]).toMatch(/\bclassification\b/)
    expect(porId(sin.todas)[0]).not.toMatch(/\bclassification\b/)
  })
  it('los «ID» que se preguntan por separado son los mismos con y sin flujo: los del fichero que no están en NINGÚN flujo del periodo', async () => {
    const f = await escenarioFlujos()
    const parametros = async (qs: string): Promise<unknown[]> => {
      const registro: Array<{ sql: string; p: unknown[] }> = []
      const q: Queryable = { query: ((sql: string, p?: unknown[]) => { registro.push({ sql, p: p ?? [] }); return db.query(sql, p) }) as Queryable['query'] }
      await subirQs(appWith({}, q).app, f, qs)
      return registro.filter((r) => /FROM tickets WHERE id IN/i.test(r.sql)).flatMap((r) => r.p)
    }
    const sin = await parametros(PERIODO_QS)
    const con = await parametros(`${PERIODO_QS}&flujo=equipo-nuevo`)
    expect(sin).toEqual(['444', '555', '666'])
    expect(con).toEqual(sin)
  })
})

// ── poblacion-cierre-variante-47-51 (F1F-05, L2): el POST hereda la población por cierre (RQ-KP-35, S-8, D5) ───────────────────────────────
/** Un ticket con estado, tipo de estado, creación y cierre a elección (el periodo de estas pruebas es diciembre de 2026). */
const altaCierre = (id: string, number: number, estado: string, tipo: 'Open' | 'Closed', creado: string, cerrado: string | null, clasificacion: string | null = null) =>
  db.query("INSERT INTO tickets (id, number, subject, status, status_type, created_time, closed_time, classification) VALUES ($1, $2, 's', $3, $4, $5, $6, $7)", [id, number, estado, tipo, creado, cerrado, clasificacion])

describe('RQ-KP-35 · el POST lee la misma población por cierre', () => {
  it('un «ID» que existe en Desk como abierto, anulado o cerrado fuera del periodo cae en fueraDelPeriodo; el cuarto cubo mantiene su nombre (S-8)', async () => {
    await altaCierre('901', 2001, 'En Proceso', 'Open', '2026-12-02T15:00:00Z', '2026-12-10T15:00:00Z')
    await altaCierre('902', 2002, 'Anulado', 'Closed', '2026-12-02T15:00:00Z', '2026-12-10T15:00:00Z')
    await altaCierre('903', 2003, 'Finalizado', 'Closed', '2026-12-02T15:00:00Z', '2027-01-10T15:00:00Z')
    await altaCierre('904', 2004, 'Finalizado', 'Closed', '2026-11-02T15:00:00Z', '2026-12-10T15:00:00Z')
    const f = csvMuestra([fila('901', 2001), fila('902', 2002), fila('903', 2003), fila('904', 2004)])
    const res = await subirQs(appWith().app, f, PERIODO_QS)
    expect(res.status).toBe(200)
    expect(Object.keys(res.body.cruce)).toEqual(['cruzados', 'soloEnFichero', 'fueraDelPeriodo', 'soloEnDesk', 'numeroDistinto', 'valoresIlegibles'])
    expect(res.body.cruce.cruzados).toBe(1)
    expect(idsDe(res.body.cruce.fueraDelPeriodo)).toEqual(['901', '902', '903'])
    expect(res.body.cruce.soloEnFichero.total).toBe(0)
    expect(res.body.cruce.soloEnDesk.total).toBe(0)
  })
  it('El flujo se compone en el POST (mutación: dejar de componerlo): con flujo=equipo-nuevo cruza el de equipo nuevo y el de servicio cae en «De otro flujo»', async () => {
    await altaCierre('911', 2101, 'Finalizado', 'Closed', '2026-12-02T15:00:00Z', '2026-12-10T15:00:00Z', 'Equipo nuevo')
    await altaCierre('912', 2102, 'Finalizado', 'Closed', '2026-12-02T15:00:00Z', '2026-12-10T15:00:00Z', 'Servicio')
    const f = csvMuestra([fila('911', 2101), fila('912', 2102)])
    const res = await subirQs(appWith().app, f, `${PERIODO_QS}&flujo=equipo-nuevo`)
    expect(res.status).toBe(200)
    expect(res.body.cruce.cruzados).toBe(1)
    expect(res.body.cruce.deOtroFlujo).toEqual({ total: 1, tickets: [{ id: '912', numero: 2102 }] })
    expect(res.body.cruce.fueraDelPeriodo.total).toBe(0)
  })
})
