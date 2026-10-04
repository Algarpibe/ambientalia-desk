import { describe, it, expect } from 'vitest'
import type { NovedadCatalogo } from '@ambientalia/shared'
import { MOTIVO_FOTO_LEGADO } from '@ambientalia/shared'
import { alternarNovedad, planDeFotos, motivoNoCreable, puedeContinuarSinPendientes, vistaDelFormulario, FOTOS_VACIAS } from './recepcionForm'

const nov = (clave: string, orden: number, over: Partial<NovedadCatalogo> = {}): NovedadCatalogo =>
  ({ clave, etiqueta: `Etiqueta ${clave}`, orden, activo: true, excluyeDemas: false, exigeTexto: false, ...over })

// Las marcas viajan en el dato: la clave no decide nada. `ninguna` excluye, `libre` exige texto.
const CAT: NovedadCatalogo[] = [
  nov('ninguna', 1, { excluyeDemas: true }), nov('golpe', 2), nov('falta', 3), nov('libre', 4, { exigeTexto: true }),
]
const f = (n: string) => ({ name: n })

describe('alternarNovedad', () => {
  it('marcar la que excluye a las demás desmarca todo lo demás (por marca, no por clave)', () => {
    expect(alternarNovedad(CAT, ['golpe', 'falta'], 'ninguna')).toEqual(['ninguna'])
  })
  it('marcar otra con la excluyente puesta la desmarca', () => {
    expect(alternarNovedad(CAT, ['ninguna'], 'golpe')).toEqual(['golpe'])
  })
  it('la marca la decide el catálogo: una clave cualquiera con excluyeDemas excluye', () => {
    const cat = [nov('a', 1), nov('b', 2, { excluyeDemas: true })]
    expect(alternarNovedad(cat, ['a'], 'b')).toEqual(['b'])
    expect(alternarNovedad(cat, ['b'], 'a')).toEqual(['a'])
  })
  it('una clave que se llame sin_novedad pero sin la marca NO excluye', () => {
    const cat = [nov('sin_novedad', 1), nov('golpe', 2)]
    expect(alternarNovedad(cat, ['golpe'], 'sin_novedad')).toEqual(['golpe', 'sin_novedad'])
  })
  it('marcar una normal suma, y volver a pulsarla la quita', () => {
    expect(alternarNovedad(CAT, ['golpe'], 'falta')).toEqual(['golpe', 'falta'])
    expect(alternarNovedad(CAT, ['golpe', 'falta'], 'golpe')).toEqual(['falta'])
  })
})

describe('planDeFotos', () => {
  it('aplana en orden: equipo, accesorios, embalaje y novedades por el orden de lo marcado', () => {
    const plan = planDeFotos({
      equipo: [f('e1')], accesorios: [f('a1'), f('a2')], embalaje: [f('m1')],
      porNovedad: { falta: [f('f1')], golpe: [f('g1'), f('g2')] },
    }, [{ clave: 'golpe', etiqueta: 'G' }, { clave: 'falta', etiqueta: 'F' }])
    expect(plan.map((p) => [p.file.name, p.categoria, p.novedad])).toEqual([
      ['e1', 'equipo', null], ['a1', 'accesorios', null], ['a2', 'accesorios', null], ['m1', 'embalaje', null],
      ['g1', 'novedad', 'golpe'], ['g2', 'novedad', 'golpe'], ['f1', 'novedad', 'falta'],
    ])
  })
  it('descarta las fotos de novedades ya desmarcadas', () => {
    const plan = planDeFotos({ ...FOTOS_VACIAS, porNovedad: { golpe: [f('g1')], falta: [f('f1')] } }, [{ clave: 'falta', etiqueta: 'F' }])
    expect(plan.map((p) => p.file.name)).toEqual(['f1'])
  })
})

const MIN = { equipo: [f('e')], accesorios: [f('a')], embalaje: [f('m')], porNovedad: {} }
const sel = (claves: string[]) => ({ novedades: claves, novedadOtro: 'texto', rotulado: true })

describe('motivoNoCreable', () => {
  it('sin ninguna marcada: el motivo de validarRecepcion', () => {
    expect(motivoNoCreable(CAT, { novedades: [], rotulado: true }, planDeFotos(MIN, []))).toBe('Marca al menos una novedad, o «Sin novedad».')
  })
  it('«Otro» sin texto', () => {
    expect(motivoNoCreable(CAT, { novedades: ['libre'], novedadOtro: '  ', rotulado: true }, planDeFotos(MIN, [])))
      .toBe('«Etiqueta libre» exige describir la novedad.')
  })
  it('sin rotulado', () => {
    expect(motivoNoCreable(CAT, { novedades: ['ninguna'], rotulado: false }, planDeFotos(MIN, []))).toBe('Confirma que el equipo quedó rotulado y guardado.')
  })
  it('lista no cargada', () => {
    expect(motivoNoCreable([], sel(['ninguna']), planDeFotos(MIN, []))).toBe('La lista de novedades no está cargada: avisa a un administrador.')
  })
  it('faltan las mínimas: nombra todas las que faltan', () => {
    const plan = planDeFotos({ ...FOTOS_VACIAS, equipo: [f('e')] }, [])
    expect(motivoNoCreable(CAT, sel(['ninguna']), plan)).toBe('Faltan fotos obligatorias: de los accesorios, del embalaje.')
  })
  it('falta la foto de una novedad marcada', () => {
    const marcadas = [{ clave: 'golpe', etiqueta: 'Etiqueta golpe' }, { clave: 'falta', etiqueta: 'Etiqueta falta' }]
    const plan = planDeFotos({ ...MIN, porNovedad: { golpe: [f('g')] } }, marcadas)
    expect(motivoNoCreable(CAT, sel(['golpe', 'falta']), plan)).toBe('Falta la foto de cada novedad marcada: Etiqueta falta.')
  })
  it('«Sin novedad» con las tres mínimas: nada que objetar', () => {
    expect(motivoNoCreable(CAT, sel(['ninguna']), planDeFotos(MIN, []))).toBeNull()
  })
  it('con novedades y todas sus fotos: nada que objetar', () => {
    const marcadas = [{ clave: 'golpe', etiqueta: 'Etiqueta golpe' }]
    expect(motivoNoCreable(CAT, sel(['golpe']), planDeFotos({ ...MIN, porNovedad: { golpe: [f('g')] } }, marcadas))).toBeNull()
  })
  it('el motivo del formulario precede al de las fotos', () => {
    expect(motivoNoCreable(CAT, { novedades: ['ninguna'], rotulado: false }, [])).toBe('Confirma que el equipo quedó rotulado y guardado.')
  })
})

describe('puedeContinuarSinPendientes', () => {
  const rem = { hayNovedad: false, novedades: [{ clave: 'ninguna', etiqueta: 'Etiqueta ninguna' }], rotuladoAt: 'x' }
  const plan = planDeFotos(MIN, [])
  it('prefijo insuficiente: no deja continuar', () => {
    expect(puedeContinuarSinPendientes(rem, plan, CAT, 2)).toBe(false)
  })
  it('prefijo suficiente: sí deja continuar', () => {
    expect(puedeContinuarSinPendientes(rem, [...plan, ...planDeFotos({ ...FOTOS_VACIAS, equipo: [f('x')] }, [])], CAT, 3)).toBe(true)
  })
  it('legado sin novedades: se rige por la regla de antes', () => {
    const legado = { hayNovedad: true, novedades: null, rotuladoAt: null }
    expect(puedeContinuarSinPendientes(legado, plan, CAT, 0)).toBe(false)
    expect(puedeContinuarSinPendientes(legado, plan, CAT, 1)).toBe(true)
    expect(MOTIVO_FOTO_LEGADO).toBeTruthy()
  })
})

describe('vistaDelFormulario', () => {
  it('une lista, marcadas por orden del catálogo, plan, cuerpo y motivo', () => {
    const v = vistaDelFormulario(CAT, ['falta', 'golpe'], '', true, { ...MIN, porNovedad: { golpe: [f('g')] } })
    expect(v.lista.map((n) => n.clave)).toEqual(['ninguna', 'golpe', 'falta', 'libre'])
    expect(v.marcadas.map((m) => m.clave)).toEqual(['golpe', 'falta'])
    expect(v.plan.map((p) => p.file.name)).toEqual(['e', 'a', 'm', 'g'])
    expect(v.cuerpo).toEqual({ novedades: ['falta', 'golpe'], novedadOtro: '', rotulado: true })
    expect(v.motivo).toBe('Falta la foto de cada novedad marcada: Etiqueta falta.')
  })
  it('sin marcar nada: motivo de la lista y sin remisión para continuar', () => {
    const v = vistaDelFormulario(CAT, [], '', false, MIN)
    expect(v.motivo).toBe('Marca al menos una novedad, o «Sin novedad».')
    expect(v.remision).toBeNull()
  })
  it('lista aún sin cargar: el motivo es el de lista no cargada', () => {
    expect(vistaDelFormulario([], [], '', true, FOTOS_VACIAS).motivo).toBe('La lista de novedades no está cargada: avisa a un administrador.')
  })
  it('todo en orden: sin motivo y con la remisión derivada de validarRecepcion', () => {
    const v = vistaDelFormulario(CAT, ['golpe'], '', true, { ...MIN, porNovedad: { golpe: [f('g')] } })
    expect(v.motivo).toBeNull()
    expect(v.remision).toEqual({ hayNovedad: true, novedades: [{ clave: 'golpe', etiqueta: 'Etiqueta golpe' }], rotuladoAt: 'rotulado' })
  })
})
