import { describe, it, expect } from 'vitest'
import { opcionesPersona, derivacionInicial } from './personas'

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

const comerciales = [
  { id: 'u-1', nombre: 'Johny Luna Roa', cargo: 'Director Técnico' },
  { id: 'u-7', nombre: 'Ángela Mora', cargo: 'Coordinador Comercial' },
]

describe('derivacionInicial', () => {
  // El caso de siempre: la casilla llega prellenada con quien ya lo tenía, y confirmar la etapa no
  // puede quitarle el responsable a nadie.
  it('sin cargo propuesto, hereda lo que ya traía el ticket', () => {
    expect(derivacionInicial(undefined, comerciales, 'u-1')).toBe('u-1')
    expect(derivacionInicial(undefined, comerciales, null)).toBeNull()
  })

  /**
   * Lo que justifica la función: el cargo propuesto PISA lo heredado. Escalar a comercial cambia el
   * trabajo de manos, así que heredar al técnico —que es lo que hace el resto de etapas— dejaría el
   * ticket derivado justo a quien deja de tocarle.
   */
  it('el cargo propuesto gana sobre lo heredado', () => {
    expect(derivacionInicial('Coordinador Comercial', comerciales, 'u-1')).toBe('u-7')
  })

  /**
   * `cargo` es texto libre que se teclea a mano, así que «coordinador comercial» y «Coordinador
   * Comercial» son la misma persona. Sin normalizar, una tilde o una mayúscula de más apagan la
   * propuesta en silencio y nadie relaciona la causa con el efecto.
   */
  it('empareja el cargo sin distinguir mayúsculas, tildes ni espacios de sobra', () => {
    const raros = [{ id: 'u-8', nombre: 'Ángela Mora', cargo: '  coordinadór  COMERCIAL ' }]
    expect(derivacionInicial('Coordinador Comercial', raros, null)).toBe('u-8')
  })

  // Cero coincidencias es «sin definir todavía», no «no lleva»: se cae a lo heredado, que es el
  // comportamiento de las otras 34 etapas.
  it('si nadie tiene ese cargo, se queda con lo heredado', () => {
    expect(derivacionInicial('Coordinador Comercial', activas, 'u-1')).toBe('u-1')
    expect(derivacionInicial('Coordinador Comercial', activas, null)).toBeNull()
  })

  // Dos personas con el mismo cargo no pueden dejar la casilla al azar: la lista viene ordenada por
  // nombre desde `listPersonas`, así que la primera es siempre la misma.
  it('con varias del mismo cargo toma la primera de la lista', () => {
    const dos = [
      { id: 'u-7', nombre: 'Ángela Mora', cargo: 'Coordinador Comercial' },
      { id: 'u-9', nombre: 'Beatriz Ruiz', cargo: 'Coordinador Comercial' },
    ]
    expect(derivacionInicial('Coordinador Comercial', dos, null)).toBe('u-7')
  })

  // Sin personas cargadas todavía no hay a quién proponer, y eso no puede borrar lo heredado.
  it('con la lista vacía no propone nada', () => {
    expect(derivacionInicial('Coordinador Comercial', [], 'u-1')).toBe('u-1')
  })
})
