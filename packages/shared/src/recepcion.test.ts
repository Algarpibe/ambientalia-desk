import { describe, it, expect } from 'vitest'
import {
  novedadesActivas, validarRecepcion, componerObservaciones,
  type NovedadCatalogo, type NovedadMarcada,
} from './recepcion'

/**
 * F1B-04 (`recepcion-rotulacion-foto-entrada`) · lote 2, parte pura: validación de la recepción, derivación de
 * `hayNovedad` y composición de `observaciones` (RQ-RE-23, RQ-RE-24). El catálogo entra como argumento y las
 * reglas se deciden por las marcas, no por la clave: el catálogo de prueba lo demuestra con claves ajenas.
 */
const fila = (clave: string, etiqueta: string, orden: number, extra: Partial<NovedadCatalogo> = {}): NovedadCatalogo =>
  ({ clave, etiqueta, orden, activo: true, excluyeDemas: false, exigeTexto: false, ...extra })

const CATALOGO: NovedadCatalogo[] = [
  fila('sin_novedad', 'Sin novedad', 10, { excluyeDemas: true }),
  fila('golpe_carcasa', 'Golpe o abolladura en la carcasa', 20),
  fila('rayon_estetico', 'Rayón o daño estético', 30),
  fila('falta_accesorio', 'Falta un accesorio', 60),
  fila('sello_roto', 'Sello o precinto roto', 90, { activo: false }),
  fila('otro', 'Otro', 100, { exigeTexto: true }),
]

const OK = { rotulado: true }
const valida = (novedades: unknown, extra: { novedadOtro?: unknown; rotulado?: unknown } = {}, catalogo = CATALOGO) =>
  validarRecepcion(catalogo, { novedades, ...OK, ...extra })

describe('novedadesActivas', () => {
  it('descarta las inactivas y ordena por `orden`, sin mutar la entrada', () => {
    const entrada = [fila('b', 'B', 20), fila('a', 'A', 10), fila('c', 'C', 5, { activo: false })]
    const antes = entrada.map((n) => n.clave)
    expect(novedadesActivas(entrada).map((n) => n.clave)).toEqual(['a', 'b'])
    expect(entrada.map((n) => n.clave), 'la entrada no se muta').toEqual(antes)
  })

  it('con el catálogo de prueba, no sirve la inactiva y respeta el orden', () => {
    expect(novedadesActivas(CATALOGO).map((n) => n.clave))
      .toEqual(['sin_novedad', 'golpe_carcasa', 'rayon_estetico', 'falta_accesorio', 'otro'])
  })
})

describe('RQ-RE-23 · validarRecepcion — los seis rechazos, con su texto', () => {
  it('1 · catálogo sin filas activas: la lista no está cargada', () => {
    const vacio = valida(['rayon_estetico'], {}, [])
    expect(vacio).toEqual({ ok: false, error: 'La lista de novedades no está cargada: avisa a un administrador.' })
    const todasInactivas = valida(['rayon_estetico'], {}, CATALOGO.map((n) => ({ ...n, activo: false })))
    expect(todasInactivas).toEqual({ ok: false, error: 'La lista de novedades no está cargada: avisa a un administrador.' })
  })

  it('2 · no es lista de textos o está vacía: marca al menos una', () => {
    const esperado = { ok: false, error: 'Marca al menos una novedad, o «Sin novedad».' }
    expect(valida([])).toEqual(esperado)
    expect(valida(null)).toEqual(esperado)
    expect(valida('rayon_estetico')).toEqual(esperado)
    expect(valida(['rayon_estetico', 3])).toEqual(esperado)
  })

  it('3 · clave desconocida o inactiva: nombra la causa', () => {
    expect(valida(['zzz'])).toEqual({ ok: false, error: 'Novedades fuera de la lista: zzz' })
    // inactiva: existe en el catálogo pero no se puede marcar
    expect(valida(['sello_roto', 'rayon_estetico'])).toEqual({ ok: false, error: 'Novedades fuera de la lista: sello_roto' })
    expect(valida(['zzz', 'sello_roto'])).toEqual({ ok: false, error: 'Novedades fuera de la lista: zzz, sello_roto' })
  })

  it('4 · la excluyente no convive con otra: nombra la etiqueta', () => {
    expect(valida(['sin_novedad', 'rayon_estetico'])).toEqual({
      ok: false, error: '«Sin novedad» no se puede marcar junto con otra novedad.',
    })
  })

  it('5 · la que exige texto, sin texto o sólo espacios: pide describir', () => {
    const esperado = { ok: false, error: '«Otro» exige describir la novedad.' }
    expect(valida(['otro'])).toEqual(esperado)
    expect(valida(['otro'], { novedadOtro: '' })).toEqual(esperado)
    expect(valida(['otro'], { novedadOtro: '   ' })).toEqual(esperado)
    expect(valida(['otro'], { novedadOtro: 42 })).toEqual(esperado)
  })

  it('6 · el rotulado debe valer exactamente `true`', () => {
    const esperado = { ok: false, error: 'Confirma que el equipo quedó rotulado y guardado.' }
    expect(validarRecepcion(CATALOGO, { novedades: ['rayon_estetico'] })).toEqual(esperado)
    expect(validarRecepcion(CATALOGO, { novedades: ['rayon_estetico'], rotulado: false })).toEqual(esperado)
    expect(validarRecepcion(CATALOGO, { novedades: ['rayon_estetico'], rotulado: 'true' })).toEqual(esperado)
    expect(validarRecepcion(CATALOGO, { novedades: ['rayon_estetico'], rotulado: 1 })).toEqual(esperado)
  })
})

/**
 * PA-3 · regla de mutación 1 sobre el orden INTERNO: cada par vecino de pasos, activos a la vez, debe dar el
 * primero del orden. El par (2, 3) no puede activarse a la vez por construcción —una lista vacía o que no es
 * lista no tiene claves que puedan ser desconocidas—, así que permutarlos es equivalente y no se prueba.
 */
describe('PA-3 · orden interno de validarRecepcion: cada par vecino activo a la vez', () => {
  const MSG1 = 'La lista de novedades no está cargada'
  const MSG2 = 'Marca al menos una novedad'
  const MSG3 = 'Novedades fuera de la lista'
  const MSG4 = 'no se puede marcar junto con otra novedad'
  const MSG5 = 'exige describir la novedad'
  const MSG6 = 'Confirma que el equipo quedó rotulado'
  const error = (r: ReturnType<typeof validarRecepcion>) => (r.ok ? 'OK' : r.error)

  it('(1,2) catálogo vacío y lista vacía → el 1', () => {
    expect(error(valida([], {}, []))).toContain(MSG1)
  })
  it('(1,3) catálogo vacío y claves ajenas → el 1', () => {
    expect(error(valida(['zzz'], {}, []))).toContain(MSG1)
  })
  it('(3,4) clave desconocida y excluyente combinada → el 3', () => {
    expect(error(valida(['sin_novedad', 'zzz']))).toContain(MSG3)
  })
  it('(3,5) clave desconocida y «Otro» sin texto → el 3', () => {
    expect(error(valida(['otro', 'zzz']))).toContain(MSG3)
  })
  it('(4,5) excluyente combinada y «Otro» sin texto → el 4', () => {
    expect(error(valida(['sin_novedad', 'otro']))).toContain(MSG4)
  })
  it('(5,6) «Otro» sin texto y sin rotulado → el 5', () => {
    expect(error(valida(['otro'], { rotulado: undefined }))).toContain(MSG5)
  })
  it('(2,6) lista vacía y sin rotulado → el 2', () => {
    expect(error(valida([], { rotulado: false }))).toContain(MSG2)
  })
  it('(4,6) excluyente combinada y sin rotulado → el 4', () => {
    expect(error(valida(['sin_novedad', 'rayon_estetico'], { rotulado: false }))).toContain(MSG4)
  })
  it('(3,6) clave desconocida y sin rotulado → el 3', () => {
    expect(error(valida(['zzz'], { rotulado: false }))).toContain(MSG3)
  })
  it('sin ningún defecto, el último paso (6) es el único que queda y con `true` pasa', () => {
    expect(error(valida(['rayon_estetico']))).toBe('OK')
    expect(error(valida(['rayon_estetico'], { rotulado: false }))).toContain(MSG6)
  })
})

describe('RQ-RE-23 · validarRecepcion — valor devuelto', () => {
  it('pliega los duplicados y ordena por `orden`, no por el orden en que llegan', () => {
    const r = valida(['otro', 'rayon_estetico', 'golpe_carcasa', 'rayon_estetico'], { novedadOtro: ' pantalla rota ' })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.valor.novedades).toEqual([
      { clave: 'golpe_carcasa', etiqueta: 'Golpe o abolladura en la carcasa' },
      { clave: 'rayon_estetico', etiqueta: 'Rayón o daño estético' },
      { clave: 'otro', etiqueta: 'Otro' },
    ])
  })

  it('hayNovedad es true con una marcada sin `excluyeDemas`', () => {
    const r = valida(['rayon_estetico', 'otro'], { novedadOtro: 'x' })
    expect(r.ok && r.valor.hayNovedad).toBe(true)
  })

  it('hayNovedad es false cuando sólo está la que excluye a las demás', () => {
    const r = valida(['sin_novedad'])
    expect(r.ok && r.valor.hayNovedad).toBe(false)
  })

  it('novedadOtro: texto recortado cuando una marcada exige texto; null en otro caso, aunque el cuerpo traiga texto', () => {
    const con = valida(['otro'], { novedadOtro: '  pantalla rota  ' })
    expect(con.ok && con.valor.novedadOtro).toBe('pantalla rota')
    const sin = valida(['rayon_estetico'], { novedadOtro: 'texto suelto' })
    expect(sin.ok && sin.valor.novedadOtro).toBeNull()
  })

  it('decide por las marcas y no por la clave: «otro» sin `exigeTexto` no exige texto', () => {
    const catalogo = CATALOGO.map((n) => (n.clave === 'otro' ? { ...n, exigeTexto: false } : n))
    const r = valida(['otro'], {}, catalogo)
    expect(r.ok).toBe(true)
  })

  it('decide por las marcas y no por la clave: otra fila con `exigeTexto` lo exige', () => {
    const catalogo = CATALOGO.map((n) => (n.clave === 'falta_accesorio' ? { ...n, exigeTexto: true } : n))
    expect(valida(['falta_accesorio'], {}, catalogo)).toEqual({ ok: false, error: '«Falta un accesorio» exige describir la novedad.' })
    const con = valida(['falta_accesorio'], { novedadOtro: 'el cable' }, catalogo)
    expect(con.ok && con.valor.observaciones).toBe('Falta un accesorio: el cable')
  })

  it('decide por las marcas y no por la clave: «sin_novedad» sin `excluyeDemas` convive con otra', () => {
    const catalogo = CATALOGO.map((n) => (n.clave === 'sin_novedad' ? { ...n, excluyeDemas: false } : n))
    const r = valida(['sin_novedad', 'rayon_estetico'], {}, catalogo)
    expect(r.ok && r.valor.hayNovedad).toBe(true)
  })

  it('decide por las marcas y no por la clave: otra fila con `excluyeDemas` no convive', () => {
    const catalogo = CATALOGO.map((n) => (n.clave === 'golpe_carcasa' ? { ...n, excluyeDemas: true } : n))
    expect(valida(['golpe_carcasa', 'rayon_estetico'], {}, catalogo))
      .toEqual({ ok: false, error: '«Golpe o abolladura en la carcasa» no se puede marcar junto con otra novedad.' })
  })
})

describe('RQ-RE-23 · componerObservaciones — separador `; ` (C2: manda la spec)', () => {
  const marcada = (clave: string): NovedadMarcada => {
    const n = CATALOGO.find((x) => x.clave === clave)!
    return { clave: n.clave, etiqueta: n.etiqueta }
  }

  it('una sola novedad: su etiqueta', () => {
    expect(componerObservaciones(CATALOGO, [marcada('rayon_estetico')], null)).toBe('Rayón o daño estético')
  })

  it('varias: unidas por `; `, en el orden recibido', () => {
    expect(componerObservaciones(CATALOGO, [marcada('golpe_carcasa'), marcada('rayon_estetico')], null))
      .toBe('Golpe o abolladura en la carcasa; Rayón o daño estético')
  })

  it('la que exige texto va como `{etiqueta}: {texto}`', () => {
    expect(componerObservaciones(CATALOGO, [marcada('rayon_estetico'), marcada('otro')], 'pantalla rota'))
      .toBe('Rayón o daño estético; Otro: pantalla rota')
  })

  it('«Sin novedad»: su etiqueta, sin texto', () => {
    expect(componerObservaciones(CATALOGO, [marcada('sin_novedad')], null)).toBe('Sin novedad')
  })

  it('usa la etiqueta de la instantánea, no la del catálogo de hoy', () => {
    const renombrado = CATALOGO.map((n) => (n.clave === 'rayon_estetico' ? { ...n, etiqueta: 'Etiqueta nueva' } : n))
    expect(componerObservaciones(renombrado, [marcada('rayon_estetico')], null)).toBe('Rayón o daño estético')
  })
})
