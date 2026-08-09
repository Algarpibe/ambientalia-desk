/**
 * Decide si el formulario de equipo debe frenar porque hay un cliente tecleado a mano sin vincular.
 *
 * El campo «Cliente» parece de texto libre pero es un buscador: el nombre no se guarda nunca escrito
 * a mano. El formulario solo manda `clientId`, y el servidor deriva `cliente_nombre` del cliente de
 * Books —igual que hace con marca, modelo y tipo desde el catálogo—. Sin este aviso, teclear un
 * nombre y guardar respondía «guardado» sin cambiar nada, que es la peor de las respuestas posibles.
 *
 * **Solo frena si el texto CAMBIÓ.** Que falte el vínculo no basta: un equipo cuyo cliente no existe
 * en Books (el caso Sensus) no puede elegirse de una lista donde no está, y bloquearlo por eso lo
 * dejaría imposible de editar para cualquier otra cosa. Ese callejón sin salida ya se pagó dos veces
 * en remisiones; aquí no se repite. Quien no toca el cliente, guarda.
 *
 * Devuelve el mensaje a mostrar, o `null` si no hay nada que avisar.
 */
export function avisoClienteSinVincular(input: {
  /** Lo que hay ahora en el campo. */
  textoActual: string
  /** Lo que había al abrir el formulario ('' en un alta). */
  textoOriginal: string
  /** El cliente elegido de la lista, si lo hay. */
  clientId: string | null
}): string | null {
  if (input.clientId) return null
  if (input.textoActual.trim() === input.textoOriginal.trim()) return null
  if (!input.textoActual.trim()) return null // en el alta lo cubre el campo obligatorio
  return 'Elige el cliente de la lista: el nombre escrito a mano no se guarda.'
}
