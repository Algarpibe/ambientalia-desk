import { describe, it, expect } from 'vitest'
import { responsableVisible } from './responsable'

const derivado = { id: 'u-1', nombre: 'Johny Luna', cargo: 'Director Técnico', initials: 'JL' }

describe('responsableVisible', () => {
  /**
   * La derivación gana, y la dirección importa: es la persona de ESTA plataforma a la que le toca el
   * trabajo ahora. El propietario de Zoho es un dato heredado que además está vacío en todo ticket
   * nacido aquí; anteponerlo enseñaría lo viejo y escondería lo accionable.
   */
  it('la derivación gana al propietario de Zoho', () => {
    expect(responsableVisible({ derivado, assignee: { name: 'Otro de Zoho', initials: 'OZ' } }))
      .toEqual({ nombre: 'Johny Luna', iniciales: 'JL', origen: 'derivacion' })
  })

  it('sin derivación se cae al propietario de Zoho', () => {
    expect(responsableVisible({ derivado: null, assignee: { name: 'Ana Ruiz', initials: 'AR' } }))
      .toEqual({ nombre: 'Ana Ruiz', iniciales: 'AR', origen: 'zoho' })
  })

  /**
   * `rowToTicket` rellena el propietario con la CADENA «Sin asignar» cuando no hay ninguno, así que
   * llega como si fuera un nombre. Devolverla tal cual haría que la interfaz pintara un avatar con
   * las iniciales «SA» para una persona que no existe.
   */
  it('«Sin asignar» no es un nombre: cuenta como no haber nadie', () => {
    expect(responsableVisible({ derivado: null, assignee: { name: 'Sin asignar', initials: 'SA' } }))
      .toEqual({ nombre: null, iniciales: null, origen: 'ninguno' })
  })

  it('sin nada devuelve «ninguno», no una cadena vacía disfrazada de nombre', () => {
    expect(responsableVisible({})).toEqual({ nombre: null, iniciales: null, origen: 'ninguno' })
  })
})
