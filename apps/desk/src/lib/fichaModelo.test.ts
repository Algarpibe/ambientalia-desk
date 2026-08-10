import { describe, it, expect } from 'vitest'
import { cambiosFicha, hayCambios } from './fichaModelo'

describe('cambiosFicha', () => {
  it('sin tocar nada no hay nada que guardar', () => {
    const c = cambiosFicha({ tipoId: 't1', sku: 'ABC' }, { tipoId: 't1', sku: 'ABC', fotoPendiente: false })
    expect(c).toStrictEqual({})
    expect(hayCambios(c)).toBe(false)
  })

  // El campo se recorta antes de comparar, no solo antes de enviar: sin esto, un espacio de más al
  // pegar el codigo dejaria el boton activo y mandaria un PATCH que no cambia nada.
  it('el mismo SKU con espacios de sobra no es un cambio', () => {
    expect(cambiosFicha({ tipoId: null, sku: 'ABC' }, { tipoId: '', sku: '  ABC  ', fotoPendiente: false }))
      .toStrictEqual({})
  })

  /**
   * El caso que separa «no cambió» de «cambió a vacío», y el que se rompe solo si la ausencia de la
   * clave se confunde con `null`: vaciar el campo tiene que llegar al servidor como un borrado
   * explícito, no como un campo que no se manda.
   */
  it('vaciar el SKU es un cambio, y viaja como null', () => {
    const c = cambiosFicha({ tipoId: null, sku: 'ABC' }, { tipoId: '', sku: '   ', fotoPendiente: false })
    expect(c).toStrictEqual({ sku: null })
    expect(hayCambios(c)).toBe(true)
  })

  it('un SKU vacío sobre un modelo que nunca lo tuvo no es un cambio', () => {
    expect(cambiosFicha({ tipoId: null, sku: null }, { tipoId: '', sku: '', fotoPendiente: false }))
      .toStrictEqual({})
  })

  it('elegir otro tipo es un cambio', () => {
    expect(cambiosFicha({ tipoId: 't1', sku: null }, { tipoId: 't2', sku: '', fotoPendiente: false }))
      .toStrictEqual({ tipoId: 't2' })
  })

  // «Sin tipo» es la opción de valor vacío del desplegable, y dejarlo así sobre un modelo que tenía
  // tipo es una decisión con consecuencias (el padre la confirma), no un no-cambio.
  it('dejar el modelo sin tipo es un cambio, y viaja como null', () => {
    expect(cambiosFicha({ tipoId: 't1', sku: null }, { tipoId: '', sku: '', fotoPendiente: false }))
      .toStrictEqual({ tipoId: null })
  })

  it('sin tipo antes y sin tipo ahora no es un cambio', () => {
    expect(cambiosFicha({ tipoId: null, sku: null }, { tipoId: '', sku: '', fotoPendiente: false }))
      .toStrictEqual({})
  })

  // La foto ya no se sube al elegirla: queda pendiente hasta Guardar, así que por sí sola tiene que
  // bastar para que haya algo que guardar.
  it('una foto elegida basta para que haya cambios', () => {
    const c = cambiosFicha({ tipoId: 't1', sku: 'ABC' }, { tipoId: 't1', sku: 'ABC', fotoPendiente: true })
    expect(c).toStrictEqual({ foto: true })
    expect(hayCambios(c)).toBe(true)
  })

  it('los tres campos cambiados salen juntos', () => {
    expect(cambiosFicha({ tipoId: 't1', sku: 'ABC' }, { tipoId: 't2', sku: 'XYZ', fotoPendiente: true }))
      .toStrictEqual({ tipoId: 't2', sku: 'XYZ', foto: true })
  })
})
