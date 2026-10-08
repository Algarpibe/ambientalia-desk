// indicadores-51-55 (F1F-05), lote 2a · RQ-KP-19: la huella de una respuesta de la encuesta. Es la identidad del almacén y vive
// aparte del analizador (DD-6): cambiar el analizador cuando llegue la muestra (P-1) no debe cambiar qué cuenta como duplicado.
import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { huellaRespuesta } from './respuesta'

const base = { numeroTicket: 12345, calificacion: 'Excelente', respondidaAt: '2027-01-12T13:00:00.000Z' }

describe('huellaRespuesta (RQ-KP-19)', () => {
  it('es determinista y es un sha256 en hexadecimal', () => {
    expect(huellaRespuesta(base)).toBe(huellaRespuesta({ ...base }))
    expect(huellaRespuesta(base)).toMatch(/^[0-9a-f]{64}$/)
  })

  it('cada campo de la huella cuenta: el ticket, la calificación y el instante', () => {
    const h = huellaRespuesta(base)
    expect(huellaRespuesta({ ...base, numeroTicket: 12346 })).not.toBe(h)
    expect(huellaRespuesta({ ...base, calificacion: 'Regular' })).not.toBe(h)
    expect(huellaRespuesta({ ...base, respondidaAt: '2027-01-12T13:00:01.000Z' })).not.toBe(h)
  })

  it('no cambia con espacios sobrantes ni con espacios repetidos de la calificación', () => {
    expect(huellaRespuesta({ ...base, calificacion: '  Muy   buena  ' })).toBe(huellaRespuesta({ ...base, calificacion: 'Muy buena' }))
  })

  it('no cambia con la forma de escribir un mismo instante (otro desplazamiento horario)', () => {
    expect(huellaRespuesta({ ...base, respondidaAt: '2027-01-12T08:00:00-05:00' })).toBe(huellaRespuesta(base))
  })

  it('normaliza la calificación en NFC: la misma letra compuesta o descompuesta da la misma huella', () => {
    expect(huellaRespuesta({ ...base, calificacion: 'Excelenté' })).toBe(huellaRespuesta({ ...base, calificacion: 'Excelenté' }))
  })

  it('no pliega mayúsculas: dos calificaciones que sólo difieren en la caja son otra respuesta', () => {
    expect(huellaRespuesta({ ...base, calificacion: 'excelente' })).not.toBe(huellaRespuesta(base))
  })

  it('no admite en su firma lo que no es contenido: cargadoPor, la fila ni el fichero cambian nada', () => {
    const extra = { ...base, cargadoPor: 'otra persona', fila: 7, fichero: 'otro.csv' } as typeof base
    expect(huellaRespuesta(extra)).toBe(huellaRespuesta(base))
  })

  it('la fórmula es la de la spec: sha256 de v1, número, ISO UTC con milisegundos y calificación, unidos por salto de línea', () => {
    const esperada = createHash('sha256').update(['v1', '12345', '2027-01-12T13:00:00.000Z', 'Excelente'].join('\n')).digest('hex')
    expect(huellaRespuesta(base)).toBe(esperada)
  })
})
