import { describe, it, expect } from 'vitest'
import { opcionesPersona } from './personas'

const activas = [
  { id: 'u-1', nombre: 'Johny Luna Roa', cargo: 'Director Técnico' },
  { id: 'u-2', nombre: 'Julián Maya', cargo: null },
]

describe('opcionesPersona', () => {
  // Derivar es opcional, así que quitar la derivación tiene que ser tan fácil como ponerla.
  it('ofrece siempre «Sin derivar» la primera', () => {
    expect(opcionesPersona(activas, null)[0]).toEqual({ valor: '', etiqueta: 'Sin derivar' })
  })

  it('etiqueta a cada persona con su cargo cuando lo tiene', () => {
    expect(opcionesPersona(activas, null).map((o) => o.etiqueta))
      .toEqual(['Sin derivar', 'Johny Luna Roa · Director Técnico', 'Julián Maya'])
  })

  /**
   * El fallo silencioso que esto evita: un ticket derivado a alguien que después se da de baja. Esa
   * persona ya no viene en la lista de activas, así que el desplegable no encontraría su valor, se
   * pintaría en blanco, y la siguiente transición mandaría la casilla vacía — borrando la derivación
   * sin que nadie lo pidiera ni se enterara.
   */
  it('conserva al derivado actual aunque ya no esté activo, y lo marca', () => {
    const o = opcionesPersona(activas, { id: 'u-9', nombre: 'Ex Empleado', cargo: 'Técnico' })
    expect(o[1]).toEqual({ valor: 'u-9', etiqueta: 'Ex Empleado · Técnico (inactivo)' })
    expect(o.map((x) => x.valor)).toEqual(['', 'u-9', 'u-1', 'u-2'])
  })

  it('no lo duplica si el derivado actual sigue activo', () => {
    const o = opcionesPersona(activas, { id: 'u-1', nombre: 'Johny Luna Roa', cargo: 'Director Técnico' })
    expect(o.map((x) => x.valor)).toEqual(['', 'u-1', 'u-2'])
  })
})
