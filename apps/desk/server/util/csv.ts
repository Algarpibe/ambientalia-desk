// CSV de los indicadores (F1F-05, RQ-KP-15): separador `;`, CRLF y BOM UTF-8 para que Excel en español lo abra sin asistente.

const BOM = '﻿'
const SEPARADOR = ';'
const FIN_DE_LINEA = '\r\n'
/** Un texto que empiece por uno de estos lo interpreta la hoja de cálculo como fórmula. */
const INICIO_DE_FORMULA = /^[=+\-@\t\r]/
const NECESITA_COMILLAS = /[;"\r\n]/

function celda(v: string | number | null): string {
  if (v === null) return ''
  // Un número NO es texto: un `-228` numérico se emite tal cual, sin apóstrofo.
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : ''
  const texto = INICIO_DE_FORMULA.test(v) ? `'${v}` : v
  return NECESITA_COMILLAS.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

/** Cabecera y filas a texto CSV. Cada fila, la cabecera incluida, termina en CRLF. */
export function aCsv(cabeceras: string[], filas: Array<Array<string | number | null>>): string {
  return BOM + [cabeceras, ...filas].map((f) => f.map(celda).join(SEPARADOR) + FIN_DE_LINEA).join('')
}
