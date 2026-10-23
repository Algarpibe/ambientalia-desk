import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { db, instalarArnes, appWith, adminCookie } from '../testing/appHarness'
import { TICKETS_SEPTIEMBRE, CLAVES_DEL_FIXTURE, CLAVES_DE_GERENCIA, sembrarSeptiembre, type TicketSeptiembre } from '../testing/septiembre2026'

/**
 * F1F-05, aceptación de septiembre (RQ-KP-38, S-9 y S-10): los trece tickets cerrados en septiembre de 2026, anonimizados,
 * contra las celdas de Gerencia. La ruta se pide con el periodo de septiembre; la comparación es de `formulaZoho`.
 * El CSV de origen NO está en el repositorio (sin trackear en el checkout principal): el fixture lleva sólo lo de S-10.
 */
instalarArnes()

const RUTA = '/api/indicadores'
const PERIODO = { desde: '2026-09-01', hasta: '2026-09-30' }
type Celda = number | string | null
interface FilaApi { ticketId: string; indicadores: Array<{ columna: string; formulaZoho: Celda }> }

async function septiembre(): Promise<FilaApi[]> {
  await sembrarSeptiembre(db)
  const res = await request(appWith().app).get(RUTA).query(PERIODO).set('Cookie', await adminCookie())
  expect(res.status).toBe(200)
  return res.body.tickets as FilaApi[]
}
const formulaDe = (filas: FilaApi[], id: string, columna: string): Celda => filas.find((f) => f.ticketId === id)?.indicadores.find((i) => i.columna === columna)?.formulaZoho ?? null
/** ±1 en números (S-9) e igualdad de texto en el 54; `null` de la fórmula contra una celda con valor es discrepancia. */
const coincide = (formula: Celda, celda: number | string): boolean =>
  typeof celda === 'number' ? typeof formula === 'number' && Math.abs(formula - celda) <= 1 : formula === celda

describe('RQ-KP-38 · aceptación con los trece tickets de septiembre', () => {
  it('septiembre por cierre son trece tickets (por creación salía uno)', async () => {
    const filas = await septiembre()
    expect(filas.map((f) => f.ticketId).sort()).toEqual(TICKETS_SEPTIEMBRE.map((t) => t.id).sort())
    expect(filas).toHaveLength(13)
  })

  it('en el fixture, el único creado en septiembre es el 998 (deja escrita la mutación 1)', () => {
    const creadosEnSeptiembre = TICKETS_SEPTIEMBRE.filter((t) => t.creado >= PERIODO.desde && t.creado <= PERIODO.hasta)
    expect(creadosEnSeptiembre.map((t) => t.numero)).toEqual([998])
  })

  // [indicador, columna de la respuesta, clave de Gerencia, celdas con valor]: las que el delta fija (RQ-KP-38).
  it.each<[string, string, keyof TicketSeptiembre['gerencia'], number]>([
    ['47', '47', '47', 11], ['49', '49', '49', 9], ['50·53', '50_53', '50_53', 11], ['51', '51', '51', 12],
    ['54', '54', '54', 9], ['57', '57', '57', 9], ['58', '58', '58', 9], ['59', '59', '59', 9],
  ])('indicador %s: formulaZoho coincide con la celda de Gerencia (±1 en números, igualdad en el 54)', async (_nombre, columna, clave, esperadas) => {
    const filas = await septiembre()
    const conValor = TICKETS_SEPTIEMBRE.filter((t) => t.gerencia[clave] !== null)
    expect(conValor).toHaveLength(esperadas)
    const discrepancias = conValor
      .filter((t) => !coincide(formulaDe(filas, t.id, columna), t.gerencia[clave] as number | string))
      .map((t) => `${t.id}: Gerencia ${String(t.gerencia[clave])}, Desk ${String(formulaDe(filas, t.id, columna))}`)
    expect(discrepancias).toEqual([])
  })

  it('toda clave del fixture pertenece a la lista cerrada de S-10 (sin contacto, asunto, serial, código de servicio ni tipo)', () => {
    for (const t of TICKETS_SEPTIEMBRE) {
      expect(Object.keys(t).filter((k) => !CLAVES_DEL_FIXTURE.includes(k))).toEqual([])
      expect(Object.keys(t.gerencia).filter((k) => !CLAVES_DE_GERENCIA.includes(k))).toEqual([])
    }
    for (const prohibida of ['contacto', 'asunto', 'serial', 'codigoServicio', 'tipoServicio', 'cf_codigo_servicio']) {
      expect(CLAVES_DEL_FIXTURE).not.toContain(prohibida)
    }
  })
})
