import { describe, it, expect } from 'vitest'
import { MENSAJES_REASIGNACION, reasignacionDelCuerpo, type PersonaLite } from '@ambientalia/shared'
import { opcionesReasignacion, puedeEnviarReasignacion } from './reasignacion'

const activas: PersonaLite[] = [
  { id: 'u-1', nombre: 'Ana Gómez', cargo: 'Técnica' },
  { id: 'u-2', nombre: 'Beto Ruiz', cargo: null },
  { id: 'u-3', nombre: 'Carla Díaz', cargo: 'Coordinadora' },
]

describe('opcionesReasignacion', () => {
  // RQ-TC-52: la persona a cargo no se ofrece, y «Sin derivar» tampoco (no se puede vaciar por esta ruta).
  it('no incluye a la persona a cargo ni «Sin derivar»', () => {
    const o = opcionesReasignacion(activas, 'u-1')
    expect(o.map((x) => x.valor)).toEqual(['u-2', 'u-3'])
    expect(o.some((x) => x.etiqueta === 'Sin derivar' || x.valor === '')).toBe(false)
  })

  it('con el ticket sin persona a cargo ofrece a todas las activas, con su etiqueta', () => {
    expect(opcionesReasignacion(activas, null)).toEqual([
      { valor: 'u-1', etiqueta: 'Ana Gómez · Técnica' },
      { valor: 'u-2', etiqueta: 'Beto Ruiz' },
      { valor: 'u-3', etiqueta: 'Carla Díaz · Coordinadora' },
    ])
  })

  it('si la persona a cargo no está entre las activas no quita a nadie', () => {
    expect(opcionesReasignacion(activas, 'u-9').map((x) => x.valor)).toEqual(['u-1', 'u-2', 'u-3'])
  })
})

describe('puedeEnviarReasignacion', () => {
  it('con destino distinto del actual y motivo con texto, habilita', () => {
    expect(puedeEnviarReasignacion('u-2', 'Se va de vacaciones', 'u-1')).toBe(true)
  })

  it('el motivo vacío o de sólo espacios desactiva', () => {
    expect(puedeEnviarReasignacion('u-2', '', 'u-1')).toBe(false)
    expect(puedeEnviarReasignacion('u-2', '   \t ', 'u-1')).toBe(false)
  })

  it('el destino igual al actual desactiva; sin destino también', () => {
    expect(puedeEnviarReasignacion('u-1', 'motivo', 'u-1')).toBe(false)
    expect(puedeEnviarReasignacion('', 'motivo', 'u-1')).toBe(false)
  })

  it('con el ticket sin persona a cargo, cualquier destino con motivo habilita', () => {
    expect(puedeEnviarReasignacion('u-3', 'motivo', null)).toBe(true)
  })

  // RQ-TC-52 «un solo validador del motivo»: el resultado coincide con el de `shared` en cada caso.
  it('coincide con `reasignacionDelCuerpo(...).ok` de shared', () => {
    const casos: Array<[string, string, string | null]> = [
      ['u-2', 'x', 'u-1'], ['u-2', ' ', 'u-1'], ['u-1', 'x', 'u-1'], ['', 'x', null], [' u-2 ', ' x ', null],
    ]
    for (const [destino, motivo, actual] of casos) {
      expect(puedeEnviarReasignacion(destino, motivo, actual)).toBe(reasignacionDelCuerpo({ destino, motivo }, actual).ok)
    }
    expect(MENSAJES_REASIGNACION.motivo).toBe('El motivo es obligatorio')
  })
})
