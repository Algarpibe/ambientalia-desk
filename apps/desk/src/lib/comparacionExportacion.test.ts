import { describe, it, expect } from 'vitest'
import { NOMBRES_ZOHO, type ComparacionExportacion } from '@ambientalia/shared'
import { urlComparacion, ACEPTA_EXPORTACION, puedeComparar, mensajeDeError, vistaComparacion } from './comparacionExportacion'

/** F1F-05, lote 4 (RQ-KP-28): lo decidible del cliente de la comparación. El `.tsx` sólo pinta; el servidor decide. */
describe('urlComparacion (RQ-KP-28: el periodo se envía tal como se escribe)', () => {
  it('sin periodo: la ruta sola', () => { expect(urlComparacion({})).toBe('/api/indicadores/comparacion') })
  it('con periodo: desde y hasta', () => {
    expect(urlComparacion({ desde: '2026-01-01', hasta: '2026-01-31' })).toBe('/api/indicadores/comparacion?desde=2026-01-01&hasta=2026-01-31')
  })
  it('vacíos y sólo espacios en blanco: se omiten los vacíos, lo demás no se toca', () => {
    expect(urlComparacion({ desde: '', hasta: '' })).toBe('/api/indicadores/comparacion')
    expect(urlComparacion({ desde: '', hasta: '2026-01-31' })).toBe('/api/indicadores/comparacion?hasta=2026-01-31')
  })
  it('un periodo mal escrito viaja igual (lo rechaza el servidor con 400, no el cliente)', () => {
    expect(urlComparacion({ desde: '31/01/2026', hasta: 'mañana' })).toBe('/api/indicadores/comparacion?desde=31%2F01%2F2026&hasta=ma%C3%B1ana')
    expect(urlComparacion({ desde: '2026-02-30', hasta: '2026-01-01' })).toBe('/api/indicadores/comparacion?desde=2026-02-30&hasta=2026-01-01')
  })
  it('es de mismo origen: ruta relativa y sin `formato`', () => {
    expect(urlComparacion({ desde: '2026-01-01' })).toMatch(/^\/api\/indicadores\/comparacion/)
    expect(urlComparacion({ desde: '2026-01-01' })).not.toContain('formato')
  })
})

describe('ACEPTA_EXPORTACION, puedeComparar', () => {
  it('el selector sólo ofrece .csv', () => { expect(ACEPTA_EXPORTACION).toBe('.csv') })
  it.each([[true, false, true], [false, false, false], [true, true, false], [false, true, false]])('fichero %s, enviando %s → %s', (hay, env, esperado) => {
    expect(puedeComparar(hay, env)).toBe(esperado)
  })
})

describe('mensajeDeError (el error del servidor, tal cual)', () => {
  it('usa el `error` del cuerpo sin tocarlo', () => {
    expect(mensajeDeError(400, { error: 'Faltan las columnas: «ID», «Estado»' })).toBe('Faltan las columnas: «ID», «Estado»')
    expect(mensajeDeError(413, { error: 'El archivo supera el límite de 10 MB' })).toBe('El archivo supera el límite de 10 MB')
  })
  it('un 400 de columnas no se sustituye por un texto propio', () => {
    const e = 'La exportación no trae las columnas: Tiempo de servicio'
    expect(mensajeDeError(400, { error: e })).toBe(e)
  })
  it.each([[500, {}], [502, null], [400, { error: '' }], [403, { error: 7 }], [401, 'texto'], [500, undefined]])('sin `error` de texto (%s, %j): HTTP nnn', (estado, cuerpo) => {
    expect(mensajeDeError(estado, cuerpo)).toBe(`HTTP ${estado}`)
  })
})

function respuesta(sobre: Partial<ComparacionExportacion> = {}): ComparacionExportacion {
  const base: ComparacionExportacion = {
    periodo: { desde: '2026-01-01', hasta: '2026-01-31' },
    fichero: { leidas: 12, rechazadas: [{ fila: 4, columna: 'ID', motivo: 'ID vacío' }] },
    cruce: {
      cruzados: 7,
      soloEnFichero: { total: 2, tickets: [{ id: '111111111111111111', numero: 501 }, { id: '222222222222222222', numero: null }] },
      fueraDelPeriodo: { total: 1, tickets: [{ id: '333333333333333333', numero: 77 }] },
      soloEnDesk: { total: 1, tickets: [{ id: '444444444444444444', numero: 88 }] },
      numeroDistinto: { total: 1, tickets: [{ id: '555555555555555555', numeroFichero: 9, numeroDesk: 10 }] },
      valoresIlegibles: { total: 2, porColumna: { 'Tiempo de servicio': 2 }, valores: [{ fila: 3, columna: 'Tiempo de servicio' }, { fila: 5, columna: 'Tiempo de servicio' }] },
    },
    comparacion: {
      comparable: true, mensaje: null, tolerancia: 1,
      porColumna: [
        { columna: '49', comparados: 5, coincidentes: 4, diferentes: 1, sinComparar: 2, porcentaje: 80, diferencias: [], variante: { comparados: 5, coincidentes: 5, diferentes: 0, sinComparar: 2, porcentaje: 100, diferencias: [] } },
        { columna: '54', comparados: 0, coincidentes: 0, diferentes: 0, sinComparar: 7, porcentaje: null, diferencias: [], variante: { comparados: 0, coincidentes: 0, diferentes: 0, sinComparar: 7, porcentaje: null, diferencias: [] } },
      ],
      tickets: { comparados: 5, coincidentes: 4, porcentaje: 80 },
      nota: 'Nota del servidor',
    },
  }
  return { ...base, ...sobre }
}

describe('vistaComparacion (RQ-KP-28: repite lo que el servidor devolvió, sin sumar ni dividir)', () => {
  it('repite los recuentos tal cual', () => {
    const v = vistaComparacion(respuesta())
    const p = Object.fromEntries(v.recuentos.map((f) => [f.etiqueta, f.valor]))
    expect(p).toMatchObject({
      'Filas leídas': '12', 'Filas rechazadas': '1', 'Tickets cruzados': '7', 'Sólo en el fichero': '2',
      'Fuera del periodo': '1', 'Sólo en Desk': '1', 'Número de solicitud distinto': '1', 'Valores ilegibles': '2',
    })
  })
  it('no suma ni resta: un total incoherente se repite como llegó', () => {
    const r = respuesta()
    r.cruce.cruzados = 999
    r.fichero.leidas = 3
    const p = Object.fromEntries(vistaComparacion(r).recuentos.map((f) => [f.etiqueta, f.valor]))
    expect(p['Tickets cruzados']).toBe('999')
    expect(p['Filas leídas']).toBe('3')
  })
  it('una fila por columna, con el primer nombre de Zoho y el porcentaje del servidor', () => {
    const v = vistaComparacion(respuesta())
    expect(v.columnas.map((c) => c.nombre)).toEqual([NOMBRES_ZOHO['49'][0], NOMBRES_ZOHO['54'][0]])
    expect(v.columnas[0]).toMatchObject({ comparados: '5', coincidentes: '4', diferentes: '1', sinComparar: '2', porcentaje: '80 %' })
  })
  it('porcentaje null: «—», nunca 0 ni 100', () => {
    const v = vistaComparacion(respuesta())
    expect(v.columnas[1].porcentaje).toBe('—')
    const r = respuesta()
    r.comparacion.tickets.porcentaje = null
    expect(vistaComparacion(r).tickets.porcentaje).toBe('—')
  })
  it('no recalcula el porcentaje: un 55,5 incoherente con los recuentos se repite', () => {
    const r = respuesta()
    r.comparacion.porColumna[0].porcentaje = 55.5
    expect(vistaComparacion(r).columnas[0].porcentaje).toBe('55,5 %')
  })
  it('los listados llevan el total del servidor y un ticket por línea; el número ilegible se dice', () => {
    const v = vistaComparacion(respuesta())
    const l = Object.fromEntries(v.listas.map((x) => [x.titulo, x]))
    expect(l['Sólo en el fichero'].total).toBe('2')
    expect(l['Sólo en el fichero'].lineas).toEqual(['111111111111111111 · solicitud 501', '222222222222222222 · solicitud ilegible'])
    expect(l['Número de solicitud distinto'].lineas).toEqual(['555555555555555555 · fichero 9, Desk 10'])
    expect(l['Filas rechazadas'].lineas).toEqual(['Fila 4 · ID · ID vacío'])
    expect(l['Valores ilegibles'].lineas).toEqual(['Fila 3 · Tiempo de servicio', 'Fila 5 · Tiempo de servicio'])
  })
  it('un listado vacío no se descarta ni se inventa: total 0 y sin líneas', () => {
    const r = respuesta()
    r.cruce.soloEnDesk = { total: 0, tickets: [] }
    const l = vistaComparacion(r).listas.find((x) => x.titulo === 'Sólo en Desk')
    expect(l).toEqual({ titulo: 'Sólo en Desk', total: '0', lineas: [] })
  })
  it('el mensaje y la nota del servidor pasan tal cual; periodo abierto se dice', () => {
    const r = respuesta({ periodo: { desde: null, hasta: null } })
    r.comparacion.mensaje = 'No hay nada que comparar'
    const v = vistaComparacion(r)
    expect(v.mensaje).toBe('No hay nada que comparar')
    expect(v.nota).toBe('Nota del servidor')
    expect(v.periodo).toBe('Sin periodo')
    expect(vistaComparacion(respuesta()).periodo).toBe('Periodo: 2026-01-01 a 2026-01-31')
    expect(vistaComparacion(respuesta()).mensaje).toBeNull()
  })
  it('sin color, meta, semáforo ni veredicto: ninguna clave de la vista lo nombra', () => {
    const texto = JSON.stringify(vistaComparacion(respuesta())).toLowerCase()
    for (const palabra of ['color', 'semaforo', 'semáforo', 'meta', 'aprob', 'suspen', 'cumple', 'veredicto', 'tone', 'severity']) {
      expect(texto).not.toContain(palabra)
    }
  })
  it('no muta la respuesta', () => {
    const r = respuesta()
    const copia = JSON.parse(JSON.stringify(r))
    vistaComparacion(r)
    expect(r).toEqual(copia)
  })
})
