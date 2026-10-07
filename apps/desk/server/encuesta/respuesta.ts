import { createHash } from 'node:crypto'

// indicadores-51-55 (F1F-05), RQ-KP-19: tipos e identidad de una respuesta de la encuesta. Vive aparte del analizador (DD-6):
// sustituir el analizador cuando llegue la muestra (P-1) no debe cambiar qué cuenta como duplicado.

/** Una fila de datos ya leída y válida. `fila` es la posición en el fichero (la cabecera es la 1). */
export interface FilaEncuesta { fila: number; numeroTicket: number; calificacion: string; respondidaAt: string; huella: string }

/** Una fila que no se carga, con su posición y el motivo. */
export interface FilaRechazada { fila: number; motivo: string }

/**
 * sha256 en hexadecimal de: 'v1', número en decimal, instante en ISO UTC con milisegundos y calificación (NFC, espacios
 * colapsados, recortada), unidos por salto de línea. Entran SÓLO el ticket, la calificación y el instante: ni quién carga, ni
 * cuándo, ni la posición de la fila, ni el fichero. No se pliegan mayúsculas. El salto de línea no puede aparecer dentro de un
 * campo, porque los espacios (saltos incluidos) se colapsan antes.
 */
export function huellaRespuesta(r: { numeroTicket: number; calificacion: string; respondidaAt: string }): string {
  const calificacion = r.calificacion.normalize('NFC').replace(/\s+/g, ' ').trim()
  const instante = new Date(r.respondidaAt).toISOString()
  return createHash('sha256').update(['v1', String(r.numeroTicket), instante, calificacion].join('\n')).digest('hex')
}
