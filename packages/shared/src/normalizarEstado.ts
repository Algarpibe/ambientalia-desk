/** Regla única de nombres de estado (RQ-ZS-24; decision/e249-normalizar-al-leer). Sólo U+0020 (S-1). */
export function normalizarEstado(estado: string): string {
  return estado.replace(/^ +| +$/g, '').replace(/ {2,}/g, ' ')
}
/** La misma regla para lo que puede no ser texto: `null`, `undefined` o cualquier no-cadena pasan tal cual. */
export function normalizarSiTexto<T>(valor: T): T {
  return (typeof valor === 'string' ? normalizarEstado(valor) : valor) as T
}
/** Copia de la fila con `status` normalizado y el resto intacto; no muta la entrada. */
export function conEstadoNormalizado<F extends { status?: unknown }>(fila: F): F {
  return { ...fila, status: normalizarSiTexto(fila.status) }
}
const IDENTIFICADOR = /^[a-z_][a-z0-9_]*(\.[a-z_][a-z0-9_]*)?$/
/** La forma SQL de la MISMA regla sobre una columna. Sólo identificadores: nunca texto de usuario. */
export function sqlEstadoNormalizado(columna: string): string {
  if (!IDENTIFICADOR.test(columna)) throw new Error(`sqlEstadoNormalizado: «${columna}» no es un identificador de columna`)
  return `regexp_replace(btrim(${columna}), ' {2,}', ' ', 'g')`
}
