/**
 * De qué ticket es una remisión, para poder enseñarla DENTRO de su tarjeta.
 *
 * Para quien lee una hoja de vida, recibir el equipo es un paso del servicio igual que
 * diagnosticarlo. Enseñar las remisiones en tarjetas aparte, al mismo nivel que los tickets, las
 * hacía parecer otra cosa de otro rango.
 *
 * Casi todas lo saben: las creó un ticket y lo llevan escrito. Las que no son las históricas cuyo
 * número de ticket de Zoho ya no existe en la base —se enlazaron al equipo por el serial y nada más—,
 * y a esas se les adivina el ticket por cercanía de fecha.
 *
 * Adivinar aquí es reversible: la remisión sigue enseñando su fecha y su contenido, así que un
 * emparejamiento malo se ve leyendo. Aun así el resultado dice si fue supuesto (`porFecha`), y eso se
 * conserva aunque la pantalla ya no lo pinte — un equipo con dos servicios seguidos puede recibir la
 * remisión bajo el ticket equivocado, y ese dato es lo único que permitiría encontrarlo después.
 */
export function ticketDeRemision(
  rem: { ticketId: string | null; cuando: string | null },
  tickets: Array<{ id: string; createdAt: string | null }>,
): { ticketId: string; porFecha: boolean } | null {
  // Que conste el ticket no basta: tiene que ser uno de los que esta hoja de vida enseña. Si apunta a
  // otro, colgarla de él sería esconderla en una tarjeta que no está en pantalla.
  if (rem.ticketId && tickets.some((t) => t.id === rem.ticketId)) {
    return { ticketId: rem.ticketId, porFecha: false }
  }

  const cuando = Date.parse(String(rem.cuando ?? ''))
  // Sin fecha no se adivina: colgarla igualmente marcaría «asociada por fecha» una asociación que no
  // miró ninguna fecha. El bucle de abajo llegaría al mismo `null` por su cuenta —toda comparación
  // con `NaN` es falsa—, y por eso ningún test distingue si esta línea está o no. Se queda para que
  // la regla no dependa de esa sutileza el día que alguien reescriba el bucle.
  if (Number.isNaN(cuando)) return null

  let mejor: string | null = null
  let distancia = Infinity
  for (const t of tickets) {
    const suyo = Date.parse(String(t.createdAt ?? ''))
    // Un ticket sin fecha no puede ganar una comparación de fechas, pero tampoco tumbarla.
    if (Number.isNaN(suyo)) continue
    const d = Math.abs(suyo - cuando)
    // Estrictamente menor: con dos igual de cerca gana el primero de la lista, que llega ordenada. Una
    // hoja de vida no puede cambiar de forma entre dos recargas.
    if (d < distancia) { mejor = t.id; distancia = d }
  }
  return mejor ? { ticketId: mejor, porFecha: true } : null
}
