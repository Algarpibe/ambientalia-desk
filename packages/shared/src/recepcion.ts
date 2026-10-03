/**
 * Recepción de la remisión de entrada: lista de novedades como dato, y categorías de foto
 * (`recepcion-rotulacion-foto-entrada`, F1B-04; `remisiones` RQ-RE-21, RQ-RE-22).
 *
 * Puro, sin base ni red: el catálogo entra como ARGUMENTO. El servidor lo lee de `public.catalogo_novedades`
 * y el cliente de `GET /api/novedades-remision`; las reglas se deciden por las marcas (`excluyeDemas`,
 * `exigeTexto`, `activo`) y nunca por la clave ni por la etiqueta.
 */

/** Una fila del catálogo de novedades, tal como la sirve la ruta de lectura (camelCase, como el resto de la API). */
export interface NovedadCatalogo {
  clave: string
  etiqueta: string
  orden: number
  activo: boolean
  excluyeDemas: boolean
  exigeTexto: boolean
}

/** Categorías con que se etiqueta cada foto de la remisión de entrada. */
export const CATEGORIAS_FOTO = ['equipo', 'accesorios', 'embalaje', 'novedad'] as const
export type CategoriaFoto = (typeof CATEGORIAS_FOTO)[number]

/** Las tres que se exigen siempre en el formulario nuevo; la de `novedad` depende de lo marcado. */
export const CATEGORIAS_FOTO_MINIMAS = ['equipo', 'accesorios', 'embalaje'] as const

/** Novedades que se pueden marcar hoy: las activas, por `orden` (y por `clave` si empatan). No muta la entrada. */
export function novedadesActivas(catalogo: readonly NovedadCatalogo[]): NovedadCatalogo[] {
  return catalogo
    .filter((n) => n.activo)
    .sort((a, b) => a.orden - b.orden || a.clave.localeCompare(b.clave))
}

/** Lo que guarda la remisión de cada novedad marcada: una instantánea (clave y etiqueta de ese día). */
export interface NovedadMarcada {
  clave: string
  etiqueta: string
}

/** Lo que `validarRecepcion` entrega al alta cuando todo está en orden. */
export interface RecepcionValidada {
  novedades: NovedadMarcada[]
  novedadOtro: string | null
  hayNovedad: boolean
  observaciones: string
}

export type ResultadoRecepcion = { ok: true; valor: RecepcionValidada } | { ok: false; error: string }

/**
 * Compone `observaciones` con las etiquetas de lo marcado, unidas por `; ` (la spec manda sobre el diseño, C2).
 * La que exige texto —por su marca en el catálogo, no por su clave— se escribe `{etiqueta}: {texto}`.
 * La etiqueta sale de la instantánea y no del catálogo de hoy: corregir una etiqueta después no reescribe nada.
 */
export function componerObservaciones(
  catalogo: readonly NovedadCatalogo[], marcadas: readonly NovedadMarcada[], otro: string | null,
): string {
  const exigen = new Set(catalogo.filter((n) => n.exigeTexto).map((n) => n.clave))
  return marcadas.map((m) => (exigen.has(m.clave) && otro ? `${m.etiqueta}: ${otro}` : m.etiqueta)).join('; ')
}

const ERR_SIN_CATALOGO = 'La lista de novedades no está cargada: avisa a un administrador.'
const ERR_SIN_MARCAS = 'Marca al menos una novedad, o «Sin novedad».'
const ERR_SIN_ROTULADO = 'Confirma que el equipo quedó rotulado y guardado.'

/**
 * Valida lo que el alta trae de la recepción y deriva `hayNovedad` y `observaciones`.
 *
 * ORDEN INTERNO FIJO de los pasos (regla de mutación 1; la prueba PA-3 lo fija por pares): (1) catálogo sin
 * filas activas, (2) no es lista de textos o está vacía, (3) claves desconocidas o inactivas, (4) una que
 * excluye a las demás combinada con otra, (5) una que exige texto sin texto, (6) rotulado distinto de `true`.
 * Duplicados se pliegan; la salida va por `orden`. Se decide por las marcas del catálogo, nunca por la clave.
 */
export function validarRecepcion(
  catalogo: readonly NovedadCatalogo[],
  cuerpo: { novedades: unknown; novedadOtro?: unknown; rotulado?: unknown },
): ResultadoRecepcion {
  const activas = novedadesActivas(catalogo)
  if (activas.length === 0) return { ok: false, error: ERR_SIN_CATALOGO }

  const pedidas = cuerpo.novedades
  if (!Array.isArray(pedidas) || pedidas.length === 0 || !pedidas.every((c) => typeof c === 'string')) {
    return { ok: false, error: ERR_SIN_MARCAS }
  }
  const claves = new Set(pedidas as string[])

  const fuera = [...claves].filter((c) => !activas.some((n) => n.clave === c))
  if (fuera.length) return { ok: false, error: `Novedades fuera de la lista: ${fuera.join(', ')}` }

  const marcadas = activas.filter((n) => claves.has(n.clave))
  const excluyente = marcadas.find((n) => n.excluyeDemas)
  if (excluyente && marcadas.length > 1) {
    return { ok: false, error: `«${excluyente.etiqueta}» no se puede marcar junto con otra novedad.` }
  }

  const texto = typeof cuerpo.novedadOtro === 'string' ? cuerpo.novedadOtro.trim() : ''
  const exigeTexto = marcadas.find((n) => n.exigeTexto)
  if (exigeTexto && !texto) return { ok: false, error: `«${exigeTexto.etiqueta}» exige describir la novedad.` }

  if (cuerpo.rotulado !== true) return { ok: false, error: ERR_SIN_ROTULADO }

  const novedades = marcadas.map((n) => ({ clave: n.clave, etiqueta: n.etiqueta }))
  const novedadOtro = exigeTexto ? texto : null
  return {
    ok: true,
    valor: {
      novedades, novedadOtro,
      hayNovedad: marcadas.some((n) => !n.excluyeDemas),
      observaciones: componerObservaciones(catalogo, novedades, novedadOtro),
    },
  }
}
