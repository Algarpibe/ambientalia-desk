import type { Remision } from '@ambientalia/shared'
import { puedeCrearRemisionDeEntrada } from '@ambientalia/shared'

export interface BotonRemision {
  visible: boolean
  texto: string
  /** Si hay una remisión sin enviar, su id: el botón abre ÉSA en vez de empezar otra. */
  pendienteId: string | null
}

/**
 * Qué hace el botón de remisión de entrada según el estado del ticket y lo que ya se creó.
 *
 * Vive aquí y no en el componente porque es la lógica que se rompe en silencio: equivocarse no
 * revienta nada, solo deja al técnico creando un documento de más o sin poder crear ninguno.
 *
 * **El caso que motivó extraerlo**: el ticket solo pasa a `Remisión creada` —y el botón solo
 * desaparece— cuando n8n confirma que el documento existe en Drive. Entre crear la remisión y esa
 * confirmación, el botón seguía diciendo «Crear remisión» sobre un ticket que ya tenía una. El
 * servidor lo rechazaba con un 409, pero el botón invitaba a intentarlo.
 *
 * **Sigue visible con una pendiente, y eso es deliberado**: si n8n se cae y la remisión se queda
 * colgada para siempre, esconder el botón dejaría al técnico sin salida desde la pantalla. Es el
 * callejón sin salida que este subsistema ya se ha comido dos veces. Se reetiqueta y lleva a la que
 * hay; desde allí se reenvía, o se crea otra a propósito.
 *
 * Un `error` NO cuenta como pendiente: significa que no se produjo documento, así que la siguiente no
 * duplica nada. Una anulada tampoco: ya está fuera de en medio.
 */
export function botonRemision(status: string, remisiones: Remision[] | null): BotonRemision {
  if (!puedeCrearRemisionDeEntrada(status)) return { visible: false, texto: 'Crear remisión', pendienteId: null }

  const vigentes = (remisiones ?? []).filter((r) => !r.anuladaAt && r.tipo === 'entrada')
  const pendiente = vigentes.find((r) => r.estado === 'pendiente')
  if (pendiente) return { visible: true, texto: 'Remisión pendiente de envío', pendienteId: pendiente.id }

  // Ya confirmada: el ticket estará a punto de pasar a `Remisión creada`. No se ofrece crear otra
  // encima solo porque el estado aún no se haya refrescado en pantalla.
  const confirmada = vigentes.some((r) => r.estado === 'ok' || r.estado === 'ok_con_avisos')
  if (confirmada) return { visible: false, texto: 'Crear remisión', pendienteId: null }

  return { visible: true, texto: 'Crear remisión', pendienteId: null }
}
