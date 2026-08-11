import { describe, it, expect } from 'vitest'
import { etiquetaPersona } from './personas'

describe('etiquetaPersona', () => {
  /**
   * El cargo viaja para que se pueda BUSCAR por él —«quién es el director técnico»— aunque lo que se
   * guarde sea la persona. Por eso va en la misma etiqueta y no en una columna aparte.
   */
  it('junta nombre y cargo con un punto medio', () => {
    expect(etiquetaPersona({ nombre: 'Johny Luna Roa', cargo: 'Director Técnico' }))
      .toBe('Johny Luna Roa · Director Técnico')
  })

  it('sin cargo, solo el nombre', () => {
    expect(etiquetaPersona({ nombre: 'Julián Maya', cargo: null })).toBe('Julián Maya')
  })

  /**
   * `cargo` es texto libre que se edita por `prompt()`, así que un espacio suelto es cuestión de
   * tiempo. Sin recortar antes de decidir, la etiqueta acabaría en «Julián Maya · » con el separador
   * colgando y nada detrás.
   */
  it('un cargo en blanco cuenta como sin cargo, sin dejar el separador colgando', () => {
    expect(etiquetaPersona({ nombre: 'Julián Maya', cargo: '   ' })).toBe('Julián Maya')
  })
})
