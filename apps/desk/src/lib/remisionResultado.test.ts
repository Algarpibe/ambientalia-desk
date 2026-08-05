import { describe, it, expect } from 'vitest'
import { fmtFecha, fmtFechaHora } from './remisionResultado'

/**
 * Las aserciones miran el DÍA y no la cadena entera: el texto exacto ("19 de may de 2026") depende de
 * la versión de ICU del runtime, y el día es lo único que la función existe para no estropear. Por el
 * mismo motivo se comprueba sobre una fecha sin hora: anclada a medianoche local, el día es el mismo
 * en cualquier zona horaria, así que el test vale igual en el portátil del técnico que en el VPS.
 */
describe('fmtFecha', () => {
  it('no se corre un día: "2026-05-19" se pinta como el 19, no como el 18', () => {
    const out = fmtFecha('2026-05-19')
    expect(out).toContain('19')
    expect(out).not.toContain('18')
    expect(out).toContain('2026')
  })

  it('un valor que no es fecha se devuelve tal cual en vez de pintar "Invalid Date"', () => {
    expect(fmtFecha('')).toBe('')
    expect(fmtFecha('sin fecha')).toBe('sin fecha')
  })
})

describe('fmtFechaHora', () => {
  it('añade la hora al instante ISO', () => {
    const out = fmtFechaHora('2026-05-19T19:32:00.000Z')
    expect(out).toContain('2026')
    expect(out).toContain(':') // la hora, sea cual sea la zona del navegador
  })

  it('un valor que no es instante se devuelve tal cual', () => {
    expect(fmtFechaHora('')).toBe('')
  })
})
