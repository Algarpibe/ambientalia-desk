import type { PersonaLite } from '@ambientalia/shared'
import { etiquetaPersona } from '@ambientalia/shared'

export interface OpcionPersona { valor: string; etiqueta: string }

/**
 * Las opciones del desplegable «Derivado a».
 *
 * Vive aquí y no en el componente por la razón de siempre: no hay harness de React, y esto es lógica
 * que se rompe en silencio.
 *
 * **El caso que justifica la función entera**: un ticket derivado a alguien que después se da de baja.
 * Esa persona ya no viene entre las activas, así que el desplegable no encontraría su valor y se
 * pintaría en blanco; la siguiente transición mandaría la casilla vacía y **borraría la derivación sin
 * que nadie lo pidiera**. Por eso al derivado actual se le conserva su opción aunque esté inactivo, y
 * se le marca para que quien mire sepa que hay que reasignar.
 */
export function opcionesPersona(
  activas: PersonaLite[],
  derivadoActual: PersonaLite | null,
): OpcionPersona[] {
  // Derivar es opcional: quitar la derivación tiene que ser tan fácil como ponerla.
  const opciones: OpcionPersona[] = [{ valor: '', etiqueta: 'Sin derivar' }]

  if (derivadoActual && !activas.some((p) => p.id === derivadoActual.id)) {
    opciones.push({ valor: derivadoActual.id, etiqueta: `${etiquetaPersona(derivadoActual)} (inactivo)` })
  }
  for (const p of activas) opciones.push({ valor: p.id, etiqueta: etiquetaPersona(p) })
  return opciones
}
