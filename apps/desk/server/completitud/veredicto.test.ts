import { describe, it, expect } from 'vitest'
import { veredictoEntidad, peorEstado, veredictoGlobal } from './veredicto'

/**
 * verificacion-completitud (1G-03, D11, RQ-ZS-38) · UNA precedencia: sin comparar > incompleto > rojo > verde, para cada entidad, para las dos
 * partes de adjuntos y para el global (que no tiene «sin comparar»: en su lugar es «incompleto»).
 * QUÉ COMPRUEBA: cada causa de «incompleto» por separado (cortadoEn, cobertura no completa, escrituras rechazadas) y que el global nunca es verde con ellas (M5).
 * QUÉ NO COMPRUEBA: de dónde salen los recuentos que se le pasan (motor, L4 a L6).
 */
const ok = { completa: true, cortadoEn: null, escriturasRechazadas: 0 }
const entidad = { sinComparar: false, errores: 0, completa: true, sinExplicar: 0 }

describe('veredictoEntidad', () => {
  it('cero sin explicar, sin errores y cobertura completa es verde', () => {
    expect(veredictoEntidad(entidad)).toBe('verde')
  })

  it('un sin explicar la deja en rojo', () => {
    expect(veredictoEntidad({ ...entidad, sinExplicar: 1 })).toBe('rojo')
  })

  it('errores o cobertura no completa la dejan incompleta, aunque haya sin explicar', () => {
    expect(veredictoEntidad({ ...entidad, errores: 1, sinExplicar: 3 })).toBe('incompleto')
    expect(veredictoEntidad({ ...entidad, completa: false })).toBe('incompleto')
  })

  it('si falló su fuente queda sin comparar, por encima de todo', () => {
    expect(veredictoEntidad({ sinComparar: true, errores: 2, completa: false, sinExplicar: 5 })).toBe('sin comparar')
  })
})

describe('peorEstado', () => {
  it('toma el peor con la precedencia sin comparar > incompleto > rojo > verde', () => {
    expect(peorEstado(['verde', 'rojo'])).toBe('rojo')
    expect(peorEstado(['rojo', 'incompleto', 'verde'])).toBe('incompleto')
    expect(peorEstado(['verde', 'incompleto', 'sin comparar', 'rojo'])).toBe('sin comparar')
    expect(peorEstado(['verde', 'verde'])).toBe('verde')
  })
})

describe('veredictoGlobal', () => {
  it('todo verde, completa, sin corte y sin escrituras rechazadas es verde', () => {
    expect(veredictoGlobal(['verde', 'verde', 'verde'], ok)).toBe('verde')
  })

  it('un rojo da rojo', () => {
    expect(veredictoGlobal(['verde', 'rojo'], ok)).toBe('rojo')
  })

  it('una entidad sin comparar o incompleta lo deja incompleto, nunca sin comparar, y gana al rojo', () => {
    expect(veredictoGlobal(['verde', 'sin comparar'], ok)).toBe('incompleto')
    expect(veredictoGlobal(['rojo', 'sin comparar'], ok)).toBe('incompleto')
    expect(veredictoGlobal(['rojo', 'incompleto'], ok)).toBe('incompleto')
  })

  it('un corte lo deja incompleto aunque todo salga verde', () => {
    expect(veredictoGlobal(['verde'], { ...ok, cortadoEn: { fase: 'B', numero: 20 } })).toBe('incompleto')
  })

  it('cobertura no completa lo deja incompleto aunque todo salga verde', () => {
    expect(veredictoGlobal(['verde'], { ...ok, completa: false })).toBe('incompleto')
  })

  it('escrituras rechazadas lo dejan incompleto aunque todo salga verde', () => {
    expect(veredictoGlobal(['verde'], { ...ok, escriturasRechazadas: 1 })).toBe('incompleto')
  })
})
