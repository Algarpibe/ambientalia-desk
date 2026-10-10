import { describe, it, expect } from 'vitest'
import { distintivoGarantia } from './distintivoGarantia'

// F1B-18 (RQ-VT-15): el cliente sólo traduce la marca que manda el servidor; no la calcula.
describe('distintivoGarantia', () => {
  it('en_garantia dice «En garantía» y va en verde, nunca en ámbar', () => {
    const d = distintivoGarantia('en_garantia')
    expect(d?.texto).toBe('En garantía')
    expect(d?.clase).toMatch(/green/)
    expect(d?.clase).not.toMatch(/amber|yellow|orange/)
  })

  it('sin_dato dice «Garantía sin dato», va en gris y remite a Comercial y a la hoja de vida', () => {
    const d = distintivoGarantia('sin_dato')
    expect(d?.texto).toBe('Garantía sin dato')
    expect(d?.clase).toMatch(/slate|gray/)
    expect(d?.clase).not.toMatch(/amber|yellow|orange|green/)
    expect(d?.titulo).toMatch(/Comercial/)
    expect(d?.titulo).toMatch(/hoja de vida/)
  })

  it('las dos marcas se distinguen por texto y por clase', () => {
    expect(distintivoGarantia('en_garantia')?.clase).not.toBe(distintivoGarantia('sin_dato')?.clase)
    expect(distintivoGarantia('en_garantia')?.texto).not.toBe(distintivoGarantia('sin_dato')?.texto)
  })

  it.each([['vencida' as const], [undefined], [null]])('%s no pinta nada', (marca) => {
    expect(distintivoGarantia(marca)).toBeNull()
  })
})
