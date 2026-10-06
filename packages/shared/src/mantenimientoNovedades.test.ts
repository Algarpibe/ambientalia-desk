import { describe, it, expect } from 'vitest'
import type { NovedadCatalogo } from './recepcion'
import { puedeMantenerNovedades, altaNovedadDelCuerpo, cambioNovedadDelCuerpo } from './mantenimientoNovedades'

/** F1B-04 (RQ-RE-29): quién mantiene la lista de novedades y qué cambios admite (`decision/f1b04-desplegables`). */
const CAT: NovedadCatalogo[] = [
  { clave: 'sin_novedad', etiqueta: 'Sin novedad', orden: 10, activo: true, excluyeDemas: true, exigeTexto: false },
  { clave: 'sello_roto', etiqueta: 'Sello o precinto roto', orden: 90, activo: true, excluyeDemas: false, exigeTexto: false },
  { clave: 'otro', etiqueta: 'Otro', orden: 100, activo: true, excluyeDemas: false, exigeTexto: true },
]
const ST = ['Servicio Técnico']

describe('puedeMantenerNovedades', () => {
  it('Servicio Técnico y Director Técnico, sí; el admin pasa sin área ni cargo', () => {
    expect(puedeMantenerNovedades({ areas: ST, isAdmin: false, cargoPermiso: 'Director Técnico' })).toBe(true)
    expect(puedeMantenerNovedades({ areas: [], isAdmin: true, cargoPermiso: null })).toBe(true)
  })
  it('el cargo sin el área, el área sin el cargo, u otro cargo: no', () => {
    expect(puedeMantenerNovedades({ areas: ['Comercial'], isAdmin: false, cargoPermiso: 'Director Técnico' })).toBe(false)
    expect(puedeMantenerNovedades({ areas: ST, isAdmin: false, cargoPermiso: null })).toBe(false)
    expect(puedeMantenerNovedades({ areas: ST, isAdmin: false, cargoPermiso: 'Técnico' })).toBe(false)
  })
  it('un cargo fuera de la lista no cuenta aunque el texto se parezca', () => {
    expect(puedeMantenerNovedades({ areas: ST, isAdmin: false, cargoPermiso: 'director técnico' as never })).toBe(false)
  })
})

describe('altaNovedadDelCuerpo', () => {
  it('válida: recorta la etiqueta, toma el orden pedido, nunca excluye a las demás', () => {
    expect(altaNovedadDelCuerpo({ clave: 'tapa_suelta', etiqueta: '  Tapa suelta ', orden: 95, exigeTexto: false }, CAT))
      .toEqual({ ok: true, novedad: { clave: 'tapa_suelta', etiqueta: 'Tapa suelta', orden: 95, activo: true, excluyeDemas: false, exigeTexto: false } })
  })
  it('sin orden va detrás de la última; sin exigeTexto, no lo exige', () => {
    const r = altaNovedadDelCuerpo({ clave: 'tapa_suelta', etiqueta: 'Tapa suelta' }, CAT)
    expect(r).toMatchObject({ ok: true, novedad: { orden: 110, exigeTexto: false } })
  })
  it('pedir que excluya a las demás no la convierte en exclusiva: es contenido inválido', () => {
    expect(altaNovedadDelCuerpo({ clave: 'nada', etiqueta: 'Nada', excluyeDemas: true }, CAT)).toMatchObject({ ok: false, tipo: 'contenido' })
  })
  it.each([
    ['clave con mayúsculas', { clave: 'Tapa', etiqueta: 'Tapa' }], ['clave con espacio', { clave: 'tapa suelta', etiqueta: 'Tapa' }],
    ['clave de una letra', { clave: 't', etiqueta: 'Tapa' }], ['clave de 41', { clave: 'a'.repeat(41), etiqueta: 'Tapa' }],
    ['sin etiqueta', { clave: 'tapa', etiqueta: '   ' }], ['etiqueta de 81', { clave: 'tapa', etiqueta: 'x'.repeat(81) }],
    ['orden decimal', { clave: 'tapa', etiqueta: 'Tapa', orden: 2.5 }], ['orden 0', { clave: 'tapa', etiqueta: 'Tapa', orden: 0 }],
    ['exigeTexto no booleano', { clave: 'tapa', etiqueta: 'Tapa', exigeTexto: 'sí' }], ['cuerpo nulo', null],
  ])('contenido inválido: %s', (_n, cuerpo) => {
    expect(altaNovedadDelCuerpo(cuerpo, CAT)).toMatchObject({ ok: false, tipo: 'contenido' })
  })
  it('clave repetida o etiqueta repetida sin distinguir mayúsculas ni bordes: unicidad, no contenido', () => {
    expect(altaNovedadDelCuerpo({ clave: 'otro', etiqueta: 'Distinta' }, CAT)).toMatchObject({ ok: false, tipo: 'unicidad' })
    expect(altaNovedadDelCuerpo({ clave: 'otra', etiqueta: '  OTRO ' }, CAT)).toMatchObject({ ok: false, tipo: 'unicidad' })
  })
  it('una etiqueta guardada con espacios por SQL también choca: se recortan las dos', () => {
    const conEspacios = [...CAT, { clave: 'humedad', etiqueta: ' Humedad ', orden: 80, activo: true, excluyeDemas: false, exigeTexto: false }]
    expect(altaNovedadDelCuerpo({ clave: 'humedad_2', etiqueta: 'humedad' }, conEspacios)).toMatchObject({ ok: false, tipo: 'unicidad' })
  })
  it('el contenido se mira antes que la unicidad', () => {
    expect(altaNovedadDelCuerpo({ clave: 'otro', etiqueta: '' }, CAT)).toMatchObject({ ok: false, tipo: 'contenido' })
  })
})

describe('cambioNovedadDelCuerpo', () => {
  const sello = CAT[1]; const sin = CAT[0]
  it('cambia etiqueta, orden, activo y exigeTexto, y sólo lo que viene', () => {
    expect(cambioNovedadDelCuerpo({ etiqueta: 'Precinto roto', activo: false }, sello, CAT)).toEqual({ ok: true, cambios: { etiqueta: 'Precinto roto', activo: false } })
    expect(cambioNovedadDelCuerpo({ orden: 5, exigeTexto: true }, sello, CAT)).toEqual({ ok: true, cambios: { orden: 5, exigeTexto: true } })
  })
  it('la clave no se cambia, aunque venga igual a otra', () => {
    expect(cambioNovedadDelCuerpo({ clave: 'precinto' }, sello, CAT)).toMatchObject({ ok: false, tipo: 'contenido' })
  })
  it('la clave igual a la suya se acepta y no cuenta como cambio', () => {
    expect(cambioNovedadDelCuerpo({ clave: 'sello_roto', orden: 91 }, sello, CAT)).toEqual({ ok: true, cambios: { orden: 91 } })
  })
  it('«Sin novedad» no se retira ni pierde su marca, y ninguna otra la gana', () => {
    expect(cambioNovedadDelCuerpo({ activo: false }, sin, CAT)).toMatchObject({ ok: false, tipo: 'contenido' })
    expect(cambioNovedadDelCuerpo({ excluyeDemas: false }, sin, CAT)).toMatchObject({ ok: false, tipo: 'contenido' })
    expect(cambioNovedadDelCuerpo({ excluyeDemas: true }, sello, CAT)).toMatchObject({ ok: false, tipo: 'contenido' })
  })
  it('«Sin novedad» sí admite cambiar su etiqueta y su orden', () => {
    expect(cambioNovedadDelCuerpo({ etiqueta: 'Llega sin novedad', orden: 1 }, sin, CAT)).toEqual({ ok: true, cambios: { etiqueta: 'Llega sin novedad', orden: 1 } })
  })
  it('un cuerpo sin ningún campo que cambiar es contenido inválido', () => {
    expect(cambioNovedadDelCuerpo({}, sello, CAT)).toMatchObject({ ok: false, tipo: 'contenido' })
  })
  it('una etiqueta que ya tiene OTRA es unicidad; la suya propia, no', () => {
    expect(cambioNovedadDelCuerpo({ etiqueta: 'otro' }, sello, CAT)).toMatchObject({ ok: false, tipo: 'unicidad' })
    expect(cambioNovedadDelCuerpo({ etiqueta: 'SELLO O PRECINTO ROTO' }, sello, CAT)).toEqual({ ok: true, cambios: { etiqueta: 'SELLO O PRECINTO ROTO' } })
  })
})
