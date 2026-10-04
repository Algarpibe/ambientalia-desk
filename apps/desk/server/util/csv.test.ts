import { describe, it, expect } from 'vitest'
import { aCsv } from './csv'

/** F1F-05, lote 4 (RQ-KP-15): escapado de celdas, BOM y fin de línea. Se prueba una celda a la vez. */
const BOM = '﻿'
const celda = (v: string | number | null): string => aCsv(['c'], [[v]]).slice(BOM.length).split('\r\n')[1]!

describe('RQ-KP-15 · escapado de una celda', () => {
  it('comillas dobles: se duplican y la celda va entrecomillada', () => { expect(celda('a"b')).toBe('"a""b"') })
  it('salto de línea LF dentro de la celda: entrecomillada, con el salto dentro', () => { expect(celda('a\nb')).toBe('"a\nb"') })
  it('retorno de carro dentro de la celda: entrecomillada', () => { expect(celda('a\rb')).toBe('"a\rb"') })
  it('separador `;` dentro de la celda: entrecomillada', () => { expect(celda('a;b')).toBe('"a;b"') })
  it('una coma no es separador: no se entrecomilla', () => { expect(celda('a,b')).toBe('a,b') })
  it.each([['=1+1', "'=1+1"], ['+57', "'+57"], ['-x', "'-x"], ['@a', "'@a"], ['\tx', "'\tx"]])('texto %j empieza por carácter de fórmula: apóstrofo delante', (t, esperado) => {
    expect(celda(t)).toBe(esperado)
  })
  it('texto que empieza por retorno de carro: apóstrofo y entrecomillado', () => { expect(aCsv(['c'], [['\rx']])).toBe(`${BOM}c\r\n"'\rx"\r\n`) })
  it('`=A"` → `"\'=A"""` (apóstrofo, comillas duplicadas y entrecomillado)', () => { expect(celda('=A"')).toBe('"\'=A"""') })
  it('`=HYPERLINK("x")` del escenario de la spec', () => { expect(celda('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"') })
  it('texto `-5 casos` lleva apóstrofo', () => { expect(celda('-5 casos')).toBe("'-5 casos") })
  it('el NÚMERO −228 sale como número, sin apóstrofo', () => { expect(celda(-228)).toBe('-228') })
  it('el TEXTO `-228` sí lleva apóstrofo', () => { expect(celda('-228')).toBe("'-228") })
  it('números: positivo, cero y decimal tal cual', () => { expect([celda(4), celda(0), celda(2.5)]).toEqual(['4', '0', '2.5']) })
  it('null → celda vacía', () => { expect(celda(null)).toBe('') })
  it('texto sin caracteres especiales no cambia', () => { expect(celda('Cumple')).toBe('Cumple') })
})

describe('RQ-KP-15 · forma del fichero', () => {
  it('empieza con BOM UTF-8', () => { expect(aCsv(['a'], []).startsWith(BOM)).toBe(true) })
  it('separador `;` entre celdas, CRLF al final de cada fila, y la cabecera escapada como cualquier celda', () => {
    expect(aCsv(['a', '=b'], [['x', 1], [null, 'y']])).toBe(`${BOM}a;'=b\r\nx;1\r\n;y\r\n`)
  })
  it('sin ningún LF suelto: todo salto de fila es CRLF', () => {
    expect(aCsv(['a'], [['x'], ['y']]).replace(/\r\n/g, '')).not.toMatch(/\n/)
  })
})
