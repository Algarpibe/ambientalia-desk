// F1F-05 (lote 2), RQ-KP-24 y RQ-KP-25: el cruce de la exportación con los tickets del periodo. PURO: sin base ni red.
import { describe, it, expect } from 'vitest'
import type { TicketParaIndicadores } from '@ambientalia/shared'
import { cruzarExportacion, repartirSinCruzar } from './cruzarExportacion'
import type { FilaExportacion } from './leerExportacion'

const ticket = (id: string, numero: number, sobre: Partial<TicketParaIndicadores> = {}): TicketParaIndicadores =>
  ({ id, numero, estado: 'Ingresado', codigoServicio: null, creadoEn: '2027-01-12T13:00:00.000Z', diasEntrega: null, fechas: {}, camposZoho: {}, ...sobre })
const fila = (id: string, numero: number | null, campos: Record<string, string> = { 'Tiempo de orden de Venta': '2' }, n = 2): FilaExportacion =>
  ({ fila: n, id, numero, campos })

describe('cruzarExportacion · clave (RQ-KP-24)', () => {
  it('cruce por ID: la fila se empareja con el ticket de ese id', () => {
    const r = cruzarExportacion([fila('111', 1001)], [ticket('111', 1001)])
    expect(r.cruzados.map((t) => t.id)).toEqual(['111'])
    expect(r.sinCruzar).toEqual([])
    expect(r.soloEnDesk).toEqual([])
    expect(r.numeroDistinto).toEqual([])
  })

  it('mismo número, otro ID: NO cruza; la fila queda sin cruzar y el ticket sólo en Desk', () => {
    const r = cruzarExportacion([fila('999', 1001)], [ticket('111', 1001)])
    expect(r.cruzados).toEqual([])
    expect(r.sinCruzar.map((f) => f.id)).toEqual(['999'])
    expect(r.soloEnDesk).toEqual([{ id: '111', numero: 1001 }])
    expect(r.numeroDistinto).toEqual([])
  })

  it('número distinto: el id cruza, se lista la discrepancia y el par se conserva', () => {
    const r = cruzarExportacion([fila('111', 2002)], [ticket('111', 1001)])
    expect(r.cruzados.map((t) => t.id)).toEqual(['111'])
    expect(r.numeroDistinto).toEqual([{ id: '111', numeroFichero: 2002, numeroDesk: 1001 }])
  })

  it('número del fichero ilegible (null): también es discrepancia, con numeroFichero null', () => {
    const r = cruzarExportacion([fila('111', null)], [ticket('111', 1001)])
    expect(r.cruzados).toHaveLength(1)
    expect(r.numeroDistinto).toEqual([{ id: '111', numeroFichero: null, numeroDesk: 1001 }])
  })

  it('el mismo número no es discrepancia', () => {
    expect(cruzarExportacion([fila('111', 1001)], [ticket('111', 1001)]).numeroDistinto).toEqual([])
  })

  it('la clave es igualdad de texto: «111» no cruza con «0111»', () => {
    const r = cruzarExportacion([fila('0111', 1)], [ticket('111', 1)])
    expect(r.cruzados).toEqual([])
    expect(r.sinCruzar).toHaveLength(1)
  })
})

describe('cruzarExportacion · los dos sentidos (RQ-KP-25)', () => {
  it('sólo en el fichero: la fila sin ticket del periodo va a sinCruzar, no a los pares', () => {
    const r = cruzarExportacion([fila('111', 1001), fila('555', 5005, undefined, 3)], [ticket('111', 1001)])
    expect(r.cruzados.map((t) => t.id)).toEqual(['111'])
    expect(r.sinCruzar.map((f) => [f.id, f.numero])).toEqual([['555', 5005]])
  })

  it('sólo en Desk: el ticket del periodo ausente del fichero se lista con su número y NO entra en los pares', () => {
    const r = cruzarExportacion([fila('111', 1001)], [ticket('111', 1001), ticket('222', 2002)])
    expect(r.soloEnDesk).toEqual([{ id: '222', numero: 2002 }])
    expect(r.cruzados.map((t) => t.id)).toEqual(['111'])
  })

  it('los dos sentidos a la vez: una lista de cada lado y ninguna se funde con la otra', () => {
    const r = cruzarExportacion([fila('555', 5005)], [ticket('222', 2002)])
    expect(r.soloEnDesk).toEqual([{ id: '222', numero: 2002 }])
    expect(r.sinCruzar.map((f) => f.id)).toEqual(['555'])
    expect(r.cruzados).toEqual([])
  })

  it('sin filas ni tickets: las cuatro listas están presentes y vacías', () => {
    expect(cruzarExportacion([], [])).toEqual({ cruzados: [], soloEnDesk: [], sinCruzar: [], numeroDistinto: [] })
  })
})

describe('cruzarExportacion · la bolsa y el orden', () => {
  it('camposZoho es la bolsa de la fila y NO conserva ninguna clave sincronizada del ticket', () => {
    const t = ticket('111', 1001, { camposZoho: { 'Tiempo de orden de Venta': '9', 'Clave sincronizada': 'x', 'Tiempo de servicio': '7' } })
    const campos = { 'Tiempo de orden de Venta': '2' }
    const [c] = cruzarExportacion([fila('111', 1001, campos)], [t]).cruzados
    expect(c.camposZoho).toEqual(campos)
    expect(Object.keys(c.camposZoho)).not.toContain('Clave sincronizada')
    expect(Object.keys(c.camposZoho)).not.toContain('Tiempo de servicio')
  })

  it('el cruzado es el mismo ticket de Desk con la bolsa cambiada: lo demás no se toca', () => {
    const t = ticket('111', 1001, { estado: 'Facturado', diasEntrega: 4 })
    const [c] = cruzarExportacion([fila('111', 1001)], [t]).cruzados
    expect({ ...c, camposZoho: {} }).toEqual({ ...t, camposZoho: {} })
  })

  it('no muta los tickets de entrada', () => {
    const t = ticket('111', 1001, { camposZoho: { a: 'b' } })
    cruzarExportacion([fila('111', 1001)], [t])
    expect(t.camposZoho).toEqual({ a: 'b' })
  })

  it('cruzados, soloEnDesk y numeroDistinto salen en el orden de delPeriodo, no en el del fichero', () => {
    const periodo = [ticket('111', 1), ticket('222', 2), ticket('333', 3), ticket('444', 4)]
    const r = cruzarExportacion([fila('333', 30), fila('111', 10)], periodo)
    expect(r.cruzados.map((t) => t.id)).toEqual(['111', '333'])
    expect(r.numeroDistinto.map((n) => n.id)).toEqual(['111', '333'])
    expect(r.soloEnDesk.map((t) => t.id)).toEqual(['222', '444'])
  })

  it('sinCruzar conserva el orden del fichero', () => {
    const r = cruzarExportacion([fila('9', 1), fila('7', 2, undefined, 3), fila('8', 3, undefined, 4)], [])
    expect(r.sinCruzar.map((f) => f.id)).toEqual(['9', '7', '8'])
  })
})

describe('repartirSinCruzar · sólo en el fichero o en Desk fuera del periodo (S-N)', () => {
  it('el ID que Desk tiene va a «fuera del periodo» y el que no, a «sólo en el fichero»; el número es el del fichero', () => {
    const r = repartirSinCruzar([fila('555', 5005), fila('666', 6006, undefined, 3), fila('777', null, undefined, 4)], new Map([['666', 1234]]))
    expect(r.fueraDelPeriodo).toEqual([{ id: '666', numero: 6006 }])
    expect(r.soloEnFichero).toEqual([{ id: '555', numero: 5005 }, { id: '777', numero: null }])
  })

  it('un ID en Desk no se dice «sólo en el fichero»: las dos listas no comparten elementos', () => {
    const r = repartirSinCruzar([fila('666', 6006)], new Map([['666', 1]]))
    expect(r.soloEnFichero).toEqual([])
    expect(r.fueraDelPeriodo).toHaveLength(1)
  })

  it('sin filas ni mapa: las dos listas presentes y vacías', () => {
    expect(repartirSinCruzar([], new Map())).toEqual({ soloEnFichero: [], fueraDelPeriodo: [] })
  })

  it('los elementos son sólo «ID» y número: ninguna celda del fichero', () => {
    const r = repartirSinCruzar([fila('555', 5005, { 'Tiempo de servicio': 'secreto' })], new Map())
    expect(Object.keys(r.soloEnFichero[0]).sort()).toEqual(['id', 'numero'])
  })
})

// ── filtro-indicadores-por-flujo (F1F-05, L1b): `cruzarPorFlujo` (RQ-KP-32, D6, M4 y M6). PURO: el flujo sale de la clasificación ─────────────
import { ESTADOS } from '@ambientalia/shared'
import { cruzarPorFlujo, type TicketExistente } from './cruzarExportacion'

const clases = (t: TicketParaIndicadores[], c: Array<string | null>): Map<string, string | null> => new Map(t.map((x, i) => [x.id, c[i]]))
const existente = (numero: number, clasificacion: string | null): TicketExistente => ({ numero, clasificacion })

describe('cruzarPorFlujo · los cubos con flujo (M4)', () => {
  // Del periodo: 1 EN y 5 EN (cruzan; el 5 con otro número), 2 SR y 4 servicio (otro flujo), 3 EN ausente del fichero.
  const periodo = [ticket('1', 1001), ticket('2', 1002), ticket('3', 1003), ticket('4', 1004), ticket('5', 1005)]
  const clasificaciones = clases(periodo, ['Equipo nuevo', 'Soporte remoto', 'Equipo nuevo', 'Servicio', 'Equipo nuevo'])
  // Fuera del periodo: 10 de servicio, 11 de equipo nuevo; el 12 no existe en Desk.
  const existentes = new Map([['10', existente(2010, 'Servicio')], ['11', existente(2011, 'Equipo nuevo')]])
  const filas = [fila('1', 1001), fila('2', 1002), fila('5', 9999), fila('10', 3010), fila('11', 3011), fila('12', 3012)]
  const r = cruzarPorFlujo(filas, periodo, clasificaciones, existentes, 'equipo-nuevo')

  it('cruzados, «sólo en Desk» y «número distinto» son sólo del flujo pedido', () => {
    expect(r.cruzados.map((t) => t.id)).toEqual(['1', '5'])
    expect(r.soloEnDesk).toEqual([{ id: '3', numero: 1003 }])
    expect(r.numeroDistinto).toEqual([{ id: '5', numeroFichero: 9999, numeroDesk: 1005 }])
  })
  it('un SR del periodo y un servicio de fuera caen en `deOtroFlujo`, con el número del fichero y en el orden del fichero', () => {
    expect(r.deOtroFlujo).toEqual([{ id: '2', numero: 1002 }, { id: '10', numero: 3010 }])
  })
  it('el equipo nuevo de fuera es «fuera del periodo» y el ausente de Desk es «sólo en el fichero»; ninguno es «de otro flujo»', () => {
    expect(r.fueraDelPeriodo).toEqual([{ id: '11', numero: 3011 }])
    expect(r.soloEnFichero).toEqual([{ id: '12', numero: 3012 }])
  })
  it('invariante de D6: filas = cruzados + soloEnFichero + fueraDelPeriodo + deOtroFlujo', () => {
    expect(filas.length).toBe(6)
    expect(filas.length).toBe(r.cruzados.length + r.soloEnFichero.length + r.fueraDelPeriodo.length + (r.deOtroFlujo ?? []).length)
  })
  it('con otro flujo el reparto cambia de lado: soporte-remoto cruza el 2 y deja el resto en `deOtroFlujo` o en sus cubos', () => {
    const s = cruzarPorFlujo(filas, periodo, clasificaciones, existentes, 'soporte-remoto')
    expect(s.cruzados.map((t) => t.id)).toEqual(['2'])
    expect(s.soloEnDesk).toEqual([])
    expect(s.deOtroFlujo?.map((f) => f.id)).toEqual(['1', '5', '10', '11'])
    expect(s.fueraDelPeriodo).toEqual([])
    expect(s.soloEnFichero).toEqual([{ id: '12', numero: 3012 }])
  })
  it('`deOtroFlujo` gana a «fuera del periodo» y a «sólo en el fichero»: ningún «ID» sale en dos cubos', () => {
    const ids = [...r.cruzados.map((t) => t.id), ...r.soloEnFichero.map((f) => f.id), ...r.fueraDelPeriodo.map((f) => f.id), ...(r.deOtroFlujo ?? []).map((f) => f.id)]
    expect(ids).toHaveLength(new Set(ids).size)
  })
  it('un número ilegible del fichero (null) se conserva en `deOtroFlujo`', () => {
    const x = cruzarPorFlujo([fila('2', null)], periodo, clasificaciones, existentes, 'equipo-nuevo')
    expect(x.deOtroFlujo).toEqual([{ id: '2', numero: null }])
  })
})

describe('cruzarPorFlujo · el flujo no depende del estado (M6)', () => {
  it.each([['Equipo nuevo', 'equipo-nuevo'], ['Soporte remoto', 'soporte-remoto']] as const)('«%s» cruza con %s en cada uno de los estados del registro, también `Ticket creado`, `Por Facturar` y `Rev./Diagnostico`', (clasificacion, flujo) => {
    expect(ESTADOS).toHaveLength(26)
    for (const estado of ESTADOS) {
      const t = ticket('7', 7, { estado })
      const x = cruzarPorFlujo([fila('7', 7)], [t], clases([t], [clasificacion]), new Map(), flujo)
      expect(x.cruzados.map((c) => c.id), estado).toEqual(['7'])
      expect(x.deOtroFlujo, estado).toEqual([])
    }
  })
  it('el mismo ticket con otro flujo pedido sale `deOtroFlujo` en cada estado: el estado no lo rescata', () => {
    for (const estado of ['Ticket creado', 'Por Facturar', 'Rev./Diagnostico', 'Finalizado']) {
      const t = ticket('7', 7, { estado })
      const x = cruzarPorFlujo([fila('7', 7)], [t], clases([t], ['Equipo nuevo']), new Map(), 'servicio')
      expect(x.cruzados, estado).toEqual([])
      expect(x.deOtroFlujo, estado).toEqual([{ id: '7', numero: 7 }])
    }
  })
  it('la clasificación de fuera del periodo también se normaliza: «  equipo   NUEVO » es equipo-nuevo y null es servicio', () => {
    const e = new Map([['8', existente(8, '  equipo   NUEVO ')], ['9', existente(9, null)]])
    const x = cruzarPorFlujo([fila('8', 8), fila('9', 9)], [], new Map(), e, 'equipo-nuevo')
    expect(x.fueraDelPeriodo).toEqual([{ id: '8', numero: 8 }])
    expect(x.deOtroFlujo).toEqual([{ id: '9', numero: 9 }])
  })
})
