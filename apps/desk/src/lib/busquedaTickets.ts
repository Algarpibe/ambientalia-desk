// Piezas del cliente para la búsqueda del listado (RQ-VT-11). Sin lógica de dominio: el servidor
// recorta, normaliza y valida; aquí sólo se decide si hay algo que enviar y cuándo.

/** Espera entre pulsaciones antes de pedir al servidor. */
export const ESPERA_BUSQUEDA_MS = 300

/** Añade `q` a la URL si hay texto (con `?` o `&` según proceda); con `q` vacío devuelve la URL intacta. */
export function conBusqueda(url: string, q: string): string {
  if (q === '') return url
  return `${url}${url.includes('?') ? '&' : '?'}q=${encodeURIComponent(q)}`
}

/** Llama a `fn` pasados `ms`. Devuelve la cancelación: una llamada cancelada no se produce. */
export function aplazar(fn: () => void, ms: number): () => void {
  const id = setTimeout(fn, ms)
  return () => clearTimeout(id)
}
