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
