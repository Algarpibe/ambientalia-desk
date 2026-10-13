import { describe, it, expect } from 'vitest'
import {
  novedadesActivas, validarRecepcion, componerObservaciones, fotosQueFaltan, motivoNoEnviable, categoriaDeFoto, MOTIVO_FOTO_LEGADO, aplicaDeRemision,
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

  it('6 · retirado (rotulado-tras-enviar): el rotulado del cuerpo se ignora: ausente, false, "true" o 1 dan ok', () => {
    const esperado = { ok: true }
    expect(validarRecepcion(CATALOGO, { novedades: ['rayon_estetico'] })).toMatchObject(esperado)
    expect(validarRecepcion(CATALOGO, { novedades: ['rayon_estetico'], rotulado: false })).toMatchObject(esperado)
    expect(validarRecepcion(CATALOGO, { novedades: ['rayon_estetico'], rotulado: 'true' })).toMatchObject(esperado)
    expect(validarRecepcion(CATALOGO, { novedades: ['rayon_estetico'], rotulado: 1 })).toMatchObject(esperado)
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
  // MSG6 RETIRADO (rotulado-tras-enviar): el paso (6) ya no existe, el rotulado se confirma tras el envío (RQ-RE-40).
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
  it('(5,6) «Otro» sin texto y rotulado ausente → el 5 (el rotulado ya no es un paso)', () => {
    expect(error(valida(['otro'], { rotulado: undefined }))).toContain(MSG5)
  })
  it('(2,6) lista vacía y rotulado falso → el 2 (el rotulado ya no es un paso)', () => {
    expect(error(valida([], { rotulado: false }))).toContain(MSG2)
  })
  it('(4,6) excluyente combinada y rotulado falso → el 4 (el rotulado ya no es un paso)', () => {
    expect(error(valida(['sin_novedad', 'rayon_estetico'], { rotulado: false }))).toContain(MSG4)
  })
  it('(3,6) clave desconocida y rotulado falso → el 3 (el rotulado ya no es un paso)', () => {
    expect(error(valida(['zzz'], { rotulado: false }))).toContain(MSG3)
  })
  it('sin ningún defecto pasa, y con `rotulado: false` también: el rotulado se ignora', () => {
    expect(error(valida(['rayon_estetico']))).toBe('OK')
    expect(error(valida(['rayon_estetico'], { rotulado: false }))).toBe('OK')
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

/**
 * Lote 3 · lo que falta para enviar y la categoría de la foto (RQ-RE-25, RQ-RE-26). Las marcas de cada novedad
 * se leen del catálogo POR CLAVE aunque la fila esté inactiva (C5: manda la spec).
 */
describe('lote 3 · fotos por categoría y puertas de envío', () => {
  const m = (...claves: string[]): NovedadMarcada[] => claves.map((c) => ({ clave: c, etiqueta: CATALOGO.find((n) => n.clave === c)!.etiqueta }))
  const rem = (claves: string[] | null, extra: Record<string, unknown> = {}) =>
    ({ hayNovedad: claves ? claves.some((c) => c !== 'sin_novedad') : null, novedades: claves ? m(...claves) : null, rotuladoAt: '2026-10-03T10:00:00Z', ...extra })
  const f = (categoria: string | null, novedad: string | null = null) => ({ categoria, novedad })
  const MINIMAS = [f('equipo'), f('accesorios'), f('embalaje')]

  it('fotosQueFaltan: nombra todas las mínimas ausentes; una foto sólo cuenta para su categoría; sin categoría no cuenta', () => {
    expect(fotosQueFaltan(rem(['sin_novedad']), [], CATALOGO).categorias).toEqual(['equipo', 'accesorios', 'embalaje'])
    expect(fotosQueFaltan(rem(['sin_novedad']), [f('equipo'), f(null), f('novedad', 'sin_novedad')], CATALOGO).categorias).toEqual(['accesorios', 'embalaje'])
    expect(fotosQueFaltan(rem(['sin_novedad']), MINIMAS, CATALOGO)).toEqual({ categorias: [], novedades: [] })
  })

  it('fotosQueFaltan: cada novedad con su foto, una foto no sirve para dos; la que excluye a las demás no exige', () => {
    const r = rem(['golpe_carcasa', 'rayon_estetico'])
    expect(fotosQueFaltan(r, [...MINIMAS, f('novedad', 'golpe_carcasa')], CATALOGO).novedades.map((n) => n.clave)).toEqual(['rayon_estetico'])
    expect(fotosQueFaltan(r, [...MINIMAS, f('novedad', 'golpe_carcasa'), f('novedad', 'rayon_estetico')], CATALOGO).novedades).toEqual([])
    expect(fotosQueFaltan(r, [...MINIMAS, f('equipo', 'golpe_carcasa')], CATALOGO).novedades).toHaveLength(2)
    expect(fotosQueFaltan(rem(['sin_novedad']), MINIMAS, CATALOGO).novedades).toEqual([])
  })

  it('fotosQueFaltan: una novedad retirada del catálogo (inactiva) sigue exigiendo su foto (C5)', () => {
    expect(fotosQueFaltan(rem(['sello_roto']), MINIMAS, CATALOGO).novedades.map((n) => n.clave)).toEqual(['sello_roto'])
  })

  it('fotosQueFaltan: la marca se lee del catálogo, no de la clave (la que excluye ya no es `sin_novedad`)', () => {
    const otro = CATALOGO.map((n) => (n.clave === 'golpe_carcasa' ? { ...n, excluyeDemas: true } : n.clave === 'sin_novedad' ? { ...n, excluyeDemas: false } : n))
    expect(fotosQueFaltan(rem(['golpe_carcasa']), MINIMAS, otro).novedades).toEqual([])
    expect(fotosQueFaltan(rem(['sin_novedad']), MINIMAS, otro).novedades.map((n) => n.clave)).toEqual(['sin_novedad'])
  })

  it('motivoNoEnviable: legado = la regla anterior con el texto literal de hoy', () => {
    expect(MOTIVO_FOTO_LEGADO).toBe('El equipo llegó con novedad y la remisión no tiene fotos: sube al menos una antes de enviarla.')
    expect(motivoNoEnviable(rem(null, { hayNovedad: true, rotuladoAt: null }), [], CATALOGO)).toBe(MOTIVO_FOTO_LEGADO)
    expect(motivoNoEnviable(rem(null, { hayNovedad: true }), [f(null)], CATALOGO)).toBeNull()
    expect(motivoNoEnviable(rem(null, { hayNovedad: false, rotuladoAt: null }), [], CATALOGO)).toBeNull()
    expect(motivoNoEnviable(rem(null, { hayNovedad: null }), [], CATALOGO)).toBeNull()
  })

  it('motivoNoEnviable: formulario nuevo, un motivo por rama y nombra todo lo que falta', () => {
    expect(motivoNoEnviable(rem(['rayon_estetico'], { rotuladoAt: null }), MINIMAS, CATALOGO)).toMatch(/Falta la foto de cada novedad marcada: Rayón o daño estético/) // cambiada a propósito (rotulado-tras-enviar)
    expect(motivoNoEnviable(rem(['rayon_estetico']), [f('equipo')], CATALOGO)).toMatch(/Faltan fotos obligatorias: .*accesorios.*embalaje/)
    expect(motivoNoEnviable(rem(['golpe_carcasa', 'rayon_estetico']), MINIMAS, CATALOGO))
      .toMatch(/Falta la foto de cada novedad marcada: Golpe o abolladura en la carcasa, Rayón o daño estético/)
    expect(motivoNoEnviable(rem(['sin_novedad']), MINIMAS, CATALOGO)).toBeNull()
    expect(motivoNoEnviable(rem(['rayon_estetico']), [...MINIMAS, f('novedad', 'rayon_estetico')], CATALOGO)).toBeNull()
  })

  it('PE-3 · el primer motivo del orden: mínimas antes que novedades; rotuladoAt nulo no interviene', () => {
    expect(motivoNoEnviable(rem(['rayon_estetico'], { rotuladoAt: null }), [], CATALOGO)).toMatch(/Faltan fotos obligatorias/)
    expect(motivoNoEnviable(rem(['rayon_estetico']), [f('equipo'), f('accesorios')], CATALOGO)).toMatch(/Faltan fotos obligatorias: .*embalaje/)
  })

  const NUEVO = rem(['rayon_estetico'])
  it.each([
    ['legado, sin categoría', rem(null), {}, { ok: true, categoria: null, novedad: null }],
    ['nuevo, sin categoría', NUEVO, {}, { ok: true, categoria: null, novedad: null }],
    ['sin categoría y con `novedad`: se ignora', NUEVO, { novedad: 'rayon_estetico' }, { ok: true, categoria: null, novedad: null }],
    ['categoría válida en legado', rem(null), { categoria: 'embalaje' }, { ok: true, categoria: 'embalaje', novedad: null }],
    ['otra categoría descarta `novedad`', NUEVO, { categoria: 'equipo', novedad: 'rayon_estetico' }, { ok: true, categoria: 'equipo', novedad: null }],
    ['novedad marcada', NUEVO, { categoria: 'novedad', novedad: 'rayon_estetico' }, { ok: true, categoria: 'novedad', novedad: 'rayon_estetico' }],
  ])('categoriaDeFoto · %s', (_n, r, cuerpo, esperado) => {
    expect(categoriaDeFoto(r, cuerpo)).toEqual(esperado)
  })

  it.each([
    ['categoría inválida (nuevo)', NUEVO, { categoria: 'otra' }],
    ['categoría inválida (legado)', rem(null), { categoria: 'otra' }],
    ['categoría que no es texto', NUEVO, { categoria: 7 }],
    ['`novedad` ausente', NUEVO, { categoria: 'novedad' }],
    ['`novedad` no marcada', NUEVO, { categoria: 'novedad', novedad: 'golpe_carcasa' }],
    ['`novedad` sobre legado', rem(null), { categoria: 'novedad', novedad: 'rayon_estetico' }],
  ])('categoriaDeFoto · %s → error', (_n, r, cuerpo) => {
    expect(categoriaDeFoto(r, cuerpo)).toMatchObject({ ok: false, error: expect.any(String) })
  })
})

/**
 * recepcion-exencion-foto-y-casilla (F1B-04) · RQ-RE-26 puntos 2 y 3, RQ-RE-37, RQ-RE-38. La exención de una novedad se
 * decide por su MARCA (`exentaDeFoto`), nunca por la clave; cada casilla quita sólo la foto de su categoría y la del
 * equipo se exige siempre.
 */
describe('PF · fotosQueFaltan y motivoNoEnviable con exención y casillas', () => {
  const CAT_EXENTA: NovedadCatalogo[] = CATALOGO.map((n) => (n.clave === 'falta_accesorio' ? { ...n, exentaDeFoto: true } : n))
  const m = (...claves: string[]): NovedadMarcada[] => claves.map((c) => ({ clave: c, etiqueta: CATALOGO.find((n) => n.clave === c)!.etiqueta }))
  const rem = (claves: string[], extra: Record<string, unknown> = {}) =>
    ({ hayNovedad: true, novedades: m(...claves), rotuladoAt: '2026-10-12T10:00:00Z', ...extra })
  const f = (categoria: string | null, novedad: string | null = null) => ({ categoria, novedad })
  const MINIMAS = [f('equipo'), f('accesorios'), f('embalaje')]

  it('PF-1 · la novedad exenta no exige foto y la no exenta sí; la exención sigue a la marca y no a la clave', () => {
    const claves = (r: ReturnType<typeof rem>, cat = CAT_EXENTA) => fotosQueFaltan(r, MINIMAS, cat).novedades.map((n) => n.clave)
    expect(claves(rem(['falta_accesorio']))).toEqual([])
    expect(claves(rem(['falta_accesorio', 'golpe_carcasa']))).toEqual(['golpe_carcasa'])
    expect(claves(rem(['golpe_carcasa']))).toEqual(['golpe_carcasa'])
    // sin la marca, la misma clave exige su foto
    expect(claves(rem(['falta_accesorio']), CATALOGO)).toEqual(['falta_accesorio'])
    // la marca en OTRA clave exime a esa y deja a `falta_accesorio` exigiendo
    const otraMarca = CATALOGO.map((n) => (n.clave === 'rayon_estetico' ? { ...n, exentaDeFoto: true } : n))
    expect(claves(rem(['rayon_estetico', 'falta_accesorio']), otraMarca)).toEqual(['falta_accesorio'])
    // `exentaDeFoto: false` explícito se lee como no exenta
    expect(claves(rem(['falta_accesorio']), CATALOGO.map((n) => ({ ...n, exentaDeFoto: false })))).toEqual(['falta_accesorio'])
  })

  it('PF-2 · una novedad exenta que hoy está inactiva sigue exenta; una inactiva sin marca sigue exigiendo', () => {
    const inactiva = CAT_EXENTA.map((n) => (n.clave === 'falta_accesorio' ? { ...n, activo: false } : n))
    expect(fotosQueFaltan(rem(['falta_accesorio']), MINIMAS, inactiva).novedades).toEqual([])
    expect(fotosQueFaltan(rem(['sello_roto']), MINIMAS, inactiva).novedades.map((n) => n.clave)).toEqual(['sello_roto'])
  })

  it('PF-3 · cada casilla quita sólo la categoría de su foto; `equipo` falta siempre', () => {
    const cat = (extra: Record<string, unknown>) => fotosQueFaltan(rem(['rayon_estetico'], extra), [], CATALOGO).categorias
    expect(cat({})).toEqual(['equipo', 'accesorios', 'embalaje'])
    expect(cat({ sinAccesoriosAt: '2026-10-12T10:01:00Z' })).toEqual(['equipo', 'embalaje'])
    expect(cat({ sinEmbalajeAt: '2026-10-12T10:01:00Z' })).toEqual(['equipo', 'accesorios'])
    expect(cat({ sinAccesoriosAt: '2026-10-12T10:01:00Z', sinEmbalajeAt: '2026-10-12T10:02:00Z' })).toEqual(['equipo'])
    // `null` es «sin marcar»: lo mismo que ausente
    expect(cat({ sinAccesoriosAt: null, sinEmbalajeAt: null })).toEqual(['equipo', 'accesorios', 'embalaje'])
    // con las dos casillas y la foto del equipo no falta nada
    const dos = rem(['rayon_estetico'], { sinAccesoriosAt: '2026-10-12T10:01:00Z', sinEmbalajeAt: '2026-10-12T10:02:00Z' })
    expect(fotosQueFaltan(dos, [f('equipo')], CATALOGO).categorias).toEqual([])
  })

  it('PF-4 · el motivo de no enviable nombra sólo lo que no está eximido', () => {
    const conCasilla = rem(['falta_accesorio', 'golpe_carcasa'], { sinAccesoriosAt: '2026-10-12T10:01:00Z' })
    expect(motivoNoEnviable(conCasilla, [f('equipo')], CAT_EXENTA)).toBe('Faltan fotos obligatorias: del embalaje.')
    const motivo = motivoNoEnviable(conCasilla, [f('equipo'), f('embalaje')], CAT_EXENTA)
    expect(motivo).toBe('Falta la foto de cada novedad marcada: Golpe o abolladura en la carcasa.')
    expect(motivo).not.toContain('Falta un accesorio')
    expect(motivoNoEnviable(conCasilla, [f('equipo'), f('embalaje'), f('novedad', 'golpe_carcasa')], CAT_EXENTA)).toBeNull()
    // sin la foto del equipo no hay envío aunque las dos casillas estén marcadas
    const dos = rem(['falta_accesorio'], { sinAccesoriosAt: '2026-10-12T10:01:00Z', sinEmbalajeAt: '2026-10-12T10:02:00Z' })
    expect(motivoNoEnviable(dos, [], CAT_EXENTA)).toBe('Faltan fotos obligatorias: del equipo.')
  })
})

describe('PI · validarRecepcion con las casillas (paso 7 y orden interno)', () => {
  const MSG_S4 = 'no admite accesorios marcados en «Incluye»'
  const error = (r: ReturnType<typeof validarRecepcion>) => (r.ok ? 'OK' : r.error)
  const con = (extra: Record<string, unknown>, catalogo = CATALOGO) => validarRecepcion(catalogo, { rotulado: true, ...extra } as never)

  it('PI-7 · «Llegó sin accesorios» con accesorios marcados se rechaza, y los pasos (1) a (5) ganan al (7)', () => {
    const S4 = { sinAccesorios: true, incluye: ['Cable'] }
    expect(error(con({ novedades: ['rayon_estetico'], ...S4 }))).toContain(MSG_S4)
    expect(error(con({ novedades: ['rayon_estetico'], ...S4 }))).toBe('«Llegó sin accesorios» no admite accesorios marcados en «Incluye»: desmarca la casilla o la lista.')
    expect(error(con({ novedades: ['rayon_estetico'], ...S4 }, []))).toContain('La lista de novedades no está cargada')
    expect(error(con({ novedades: [], ...S4 }))).toContain('Marca al menos una novedad')
    expect(error(con({ novedades: ['zzz'], ...S4 }))).toContain('Novedades fuera de la lista')
    expect(error(con({ novedades: ['sin_novedad', 'rayon_estetico'], ...S4 }))).toContain('no se puede marcar junto con otra novedad')
    expect(error(con({ novedades: ['otro'], ...S4 }))).toContain('exige describir la novedad')
    expect(error(con({ novedades: ['rayon_estetico'], rotulado: false, ...S4 }))).toContain(MSG_S4) // PI-7, cambiada a propósito: con rotulado falso responde el (7)
  })

  it('PI-8 · sin accesorios marcados el paso (7) no actúa; sólo `=== true` activa; «sin embalaje» no tiene esa incompatibilidad', () => {
    for (const incluye of [[], undefined, null, 'Cable', 7, {}]) {
      expect(error(con({ novedades: ['rayon_estetico'], sinAccesorios: true, incluye })), `incluye ${JSON.stringify(incluye)}`).toBe('OK')
    }
    expect(error(con({ novedades: ['rayon_estetico'], sinEmbalaje: true, incluye: ['Cable'] }))).toBe('OK')
    // nace cerrado: lo que no es exactamente `true` no marca la casilla ni dispara el paso (7)
    for (const casilla of ['true', 1, 'sí', null]) {
      const r = con({ novedades: ['rayon_estetico'], sinAccesorios: casilla, incluye: ['Cable'] })
      expect(error(r), `sinAccesorios ${JSON.stringify(casilla)}`).toBe('OK')
      expect(r.ok && r.valor.sinAccesorios).toBe(false)
    }
  })

  it('PI-8b · el valor devuelto trae las dos casillas ya normalizadas a booleano', () => {
    const r = con({ novedades: ['rayon_estetico'], sinEmbalaje: true })
    expect(r.ok && [r.valor.sinAccesorios, r.valor.sinEmbalaje]).toEqual([false, true])
    const s = con({ novedades: ['rayon_estetico'], sinAccesorios: true, sinEmbalaje: true })
    expect(s.ok && [s.valor.sinAccesorios, s.valor.sinEmbalaje]).toEqual([true, true])
  })
})

describe('PO · observaciones con la frase de cada casilla (RQ-RE-38)', () => {
  const ok = (extra: Record<string, unknown>) => {
    const r = validarRecepcion(CATALOGO, { rotulado: true, ...extra } as never)
    if (!r.ok) throw new Error(r.error)
    return r.valor.observaciones
  }

  it('PO-1 · cada casilla añade su frase tras las novedades, en orden fijo (accesorios, embalaje), unidas por `; `', () => {
    expect(ok({ novedades: ['rayon_estetico'] })).toBe('Rayón o daño estético')
    expect(ok({ novedades: ['rayon_estetico'], sinAccesorios: true })).toBe('Rayón o daño estético; Llegó sin accesorios')
    expect(ok({ novedades: ['rayon_estetico'], sinEmbalaje: true })).toBe('Rayón o daño estético; Llegó sin embalaje')
    expect(ok({ novedades: ['rayon_estetico'], sinEmbalaje: true, sinAccesorios: true })).toBe('Rayón o daño estético; Llegó sin accesorios; Llegó sin embalaje')
    expect(ok({ novedades: ['otro'], novedadOtro: 'Pantalla rota', sinAccesorios: true })).toBe('Otro: Pantalla rota; Llegó sin accesorios')
  })

  it('PO-1b · componerObservaciones directo: sin el cuarto parámetro nada cambia', () => {
    const marcada = [{ clave: 'rayon_estetico', etiqueta: 'Rayón o daño estético' }]
    expect(componerObservaciones(CATALOGO, marcada, null)).toBe('Rayón o daño estético')
    expect(componerObservaciones(CATALOGO, marcada, null, {})).toBe('Rayón o daño estético')
    expect(componerObservaciones(CATALOGO, marcada, null, { sinAccesorios: false, sinEmbalaje: true })).toBe('Rayón o daño estético; Llegó sin embalaje')
  })
})

describe('AP · «Aplica» resuelto desde lo guardado (RQ-RE-39)', () => {
  const NUEVO = [{ clave: 'sin_novedad', etiqueta: 'Sin novedad' }]
  const base = { novedades: NUEVO, hayNovedad: false, incluye: [] as string[], sinAccesoriosAt: null, sinEmbalajeAt: null }

  it('AP-1 · «Sin novedad» sola, sin lista ni casillas → false', () => {
    expect(aplicaDeRemision(base)).toBe(false)
  })
  it('AP-2 · una novedad real sin accesorios → true', () => {
    expect(aplicaDeRemision({ ...base, hayNovedad: true })).toBe(true)
  })
  it('AP-3 · accesorios en «Incluye» con «Sin novedad» → true', () => {
    expect(aplicaDeRemision({ ...base, incluye: ['Cable USB'] })).toBe(true)
  })
  it('AP-4 · sólo la casilla «Llegó sin accesorios» → true', () => {
    expect(aplicaDeRemision({ ...base, sinAccesoriosAt: '2026-10-12T10:00:00Z' })).toBe(true)
  })
  it('AP-5 · sólo la casilla «Llegó sin embalaje» → true', () => {
    expect(aplicaDeRemision({ ...base, sinEmbalajeAt: '2026-10-12T10:00:00Z' })).toBe(true)
  })
  it('AP-6 · «Incluye» de cadenas vacías o de espacios no cuenta como accesorios → false', () => {
    expect(aplicaDeRemision({ ...base, incluye: ['', '  '] })).toBe(false)
  })
  it('AP-7 · legado (`novedades` NULL) no se calcula aunque haya novedad y accesorios → null', () => {
    expect(aplicaDeRemision({ novedades: null, hayNovedad: true, incluye: ['Cable USB'] })).toBeNull()
  })
  it('AP-8 · `novedades` ausente cuenta como legado → null', () => {
    expect(aplicaDeRemision({ hayNovedad: true, incluye: ['Cable USB'] })).toBeNull()
  })
  it('AP-9 · formulario nuevo con `hayNovedad` NULL y nada más → false, no null', () => {
    expect(aplicaDeRemision({ ...base, hayNovedad: null })).toBe(false)
  })
  it('AP-10 · `incluye` ausente o NULL → false, sin lanzar', () => {
    expect(aplicaDeRemision({ novedades: NUEVO, hayNovedad: false })).toBe(false)
    expect(aplicaDeRemision({ novedades: NUEVO, hayNovedad: false, incluye: null })).toBe(false)
  })
})
