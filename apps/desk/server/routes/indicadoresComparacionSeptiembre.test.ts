import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import request from 'supertest'
import { db, instalarArnes, appWith, adminCookie } from '../testing/appHarness'
import { TICKETS_SEPTIEMBRE, sembrarSeptiembre, type TicketSeptiembre } from '../testing/septiembre2026'
import { COLUMNA_ID, COLUMNA_NUMERO, COLUMNAS_INDICADOR } from '../comparacion/leerExportacion'

/**
 * F1F-05, aceptación de septiembre por la ruta de comparación (RQ-KP-42, S-4): el fixture anonimizado sembrado y un CSV generado EN MEMORIA
 * desde las celdas de Gerencia, con las doce cabeceras que lee el lector. Nada se escribe a disco y el CSV de Gerencia no se copia.
 * Con la variante de Zoho se juzga el 95 % (`decision/f1f05-variante-juzga-el-95`); a la letra no se le exige ningún porcentaje.
 */
instalarArnes()

const RUTA = '/api/indicadores/comparacion'
const PERIODO = { desde: '2026-09-01', hasta: '2026-09-30' }
type Gerencia = TicketSeptiembre['gerencia']
type Columna = keyof Gerencia
/** El «ID» de Zoho tiene dieciocho dígitos: el lector rechaza todo lo que no sean sólo dígitos. */
const idDe = (t: TicketSeptiembre): string => `9${String(t.numero).padStart(17, '0')}`
const COLUMNAS_PROBADAS = ['47', '49', '50_53', '51', '54', '57', '58', '59'] as const
/** [columna, comparados con valor en septiembre]: las cifras que fija RQ-KP-42. */
const ESPERADOS: ReadonlyArray<[(typeof COLUMNAS_PROBADAS)[number], number]> = [['47', 11], ['49', 9], ['50_53', 11], ['51', 12], ['54', 9], ['57', 9], ['58', 9], ['59', 9]]

/** Cabecera = las doce del lector; la celda de cada indicador es la de Gerencia o vacía (la 55 no está en el fixture). */
function csvDeSeptiembre(alterar: Partial<Record<string, string>> = {}): Buffer {
  const cabecera = [COLUMNA_ID, COLUMNA_NUMERO, ...COLUMNAS_INDICADOR.map((c) => c.nombre)]
  const filas = TICKETS_SEPTIEMBRE.map((t) => {
    const celdas = COLUMNAS_INDICADOR.map((c) => {
      const propia = alterar[`${t.numero}|${c.columna}`]
      if (propia !== undefined) return propia
      const g = (t.gerencia as Partial<Record<string, number | string | null>>)[c.columna]
      return g === undefined || g === null ? '' : String(g)
    })
    return [idDe(t), String(t.numero), ...celdas].join(',')
  })
  return Buffer.from([cabecera.join(','), ...filas].join('\r\n') + '\r\n', 'utf8')
}

/** La base es nueva en cada prueba: una sola sesión de administrador por prueba. */
let galleta: { d: unknown; c: string } | null = null
const cookieDeLaPrueba = async (): Promise<string> => { if (galleta?.d !== db) galleta = { d: db, c: await adminCookie() }; return galleta.c }

async function postSeptiembre(csv: Buffer = csvDeSeptiembre()) {
  await sembrarSeptiembre(db, idDe)
  const cookie = await cookieDeLaPrueba()
  const res = await request(appWith().app).post(RUTA).query(PERIODO).set('Cookie', cookie).attach('file', csv, { filename: 'tickets.csv', contentType: 'text/csv' })
  expect(res.status).toBe(200)
  return res.body
}
const colDe = (body: { comparacion: { porColumna: Array<{ columna: string; variante: Record<string, unknown> }> } }, columna: string) =>
  body.comparacion.porColumna.find((c) => c.columna === columna)!

describe('RQ-KP-42 · septiembre por la ruta de comparación, juzgado con la variante', () => {
  it('el cruce es limpio: trece cruzados y nada rechazado, ilegible, sólo en Desk ni con número distinto', async () => {
    const body = await postSeptiembre()
    expect(body.fichero).toEqual({ leidas: 13, rechazadas: [] })
    expect(body.cruce).toMatchObject({
      cruzados: 13, soloEnFichero: { total: 0 }, fueraDelPeriodo: { total: 0 }, soloEnDesk: { total: 0 },
      numeroDistinto: { total: 0 }, valoresIlegibles: { total: 0 },
    })
  })

  it('ticketsVariante da 13 comparados, 13 coincidentes y 100 %', async () => {
    const body = await postSeptiembre()
    expect(body.comparacion.ticketsVariante).toEqual({ comparados: 13, coincidentes: 13, porcentaje: 100 })
  })

  it.each(ESPERADOS)('indicador %s: la variante da %i comparados y todos coinciden (100 %%)', async (columna, comparados) => {
    const body = await postSeptiembre()
    expect(colDe(body, columna).variante).toMatchObject({ comparados, coincidentes: comparados, porcentaje: 100 })
  })

  it('la 55 queda sin pares comparables: comparados 0 y porcentaje null en la variante', async () => {
    const body = await postSeptiembre()
    expect(colDe(body, '55').variante).toMatchObject({ comparados: 0, coincidentes: 0, porcentaje: null })
  })

  // La mutación escrita (regla de mutación 2): se ensucia la celda vigilada del primer ticket con valor, fuera de ±1.
  it.each(COLUMNAS_PROBADAS)('un valor alterado en el %s rompe el 100 %% por ticket: 13 comparados, 12 coinciden, 92.3', async (columna) => {
    const primero = TICKETS_SEPTIEMBRE.find((t) => t.gerencia[columna as Columna] !== null)!
    const valor = primero.gerencia[columna as Columna] as number | string
    const nueva = typeof valor === 'number' ? String(valor + 5) : valor === 'Cumple' ? 'No cumple' : 'Cumple'
    const body = await postSeptiembre(csvDeSeptiembre({ [`${primero.numero}|${columna}`]: nueva }))
    expect(body.comparacion.ticketsVariante).toEqual({ comparados: 13, coincidentes: 12, porcentaje: 92.3 })
    expect(colDe(body, columna).variante.porcentaje as number).toBeLessThan(100)
  })

  it('las claves de comparacion van en su orden en el POST y en el GET (ticketsVariante entre tickets y nota)', async () => {
    const orden = ['comparable', 'mensaje', 'tolerancia', 'porColumna', 'tickets', 'ticketsVariante', 'nota']
    const post = await postSeptiembre()
    expect(Object.keys(post.comparacion)).toEqual(orden)
    const get = await request(appWith().app).get('/api/indicadores').query(PERIODO).set('Cookie', await cookieDeLaPrueba())
    expect(get.status).toBe(200)
    expect(Object.keys(get.body.comparacion)).toEqual(orden)
  })

  it('la letra no se exige: se publica como información, sin que la prueba le fije un porcentaje', async () => {
    const body = await postSeptiembre()
    expect(Object.keys(body.comparacion.tickets)).toEqual(['comparados', 'coincidentes', 'porcentaje'])
  })

  it('esta prueba no escribe a disco: el CSV vive en memoria', () => {
    const fuente = readFileSync(new URL('./indicadoresComparacionSeptiembre.test.ts', import.meta.url), 'utf8')
    const importaFs = fuente.split(/\r?\n/).filter((l) => /^import .* from '(node:)?fs/.test(l))
    expect(importaFs).toEqual(["import { readFileSync } from 'node:fs'"])
    expect(fuente).not.toMatch(/\bw[r]ite(File|Stream)|\bappendFile|\bcopyFile|\bmkdtemp/)
  })
})
