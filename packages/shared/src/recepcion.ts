import { faltaFotoPorNovedad } from './remision'
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

/** Cómo se nombra cada categoría de foto en los motivos de rechazo («Faltan fotos obligatorias: del equipo…»). */
export const ETIQUETA_CATEGORIA_FOTO: Record<CategoriaFoto, string> = {
  equipo: 'del equipo', accesorios: 'de los accesorios', embalaje: 'del embalaje', novedad: 'de la novedad',
}

/** El motivo de la remisión de LEGADO (`novedades` NULL), letra por letra el de antes de este cambio (RQ-RE-27). */
export const MOTIVO_FOTO_LEGADO = 'El equipo llegó con novedad y la remisión no tiene fotos: sube al menos una antes de enviarla.'

/** Lo mínimo de una remisión que las puertas de foto necesitan; `novedades` NULL = legado. */
export interface RemisionRecepcion { hayNovedad: boolean | null; novedades: NovedadMarcada[] | null; rotuladoAt: string | null }
/** Lo mínimo de una foto: su etiqueta de categoría y de novedad (ambas pueden ser NULL: foto sin clasificar). */
export interface FotoClasificada { categoria?: string | null; novedad?: string | null }

/**
 * Lo que falta para enviar una remisión del formulario nuevo: las categorías mínimas sin foto y las novedades
 * marcadas sin la suya. Una foto cuenta sólo para su categoría (la de `equipo` no vale para `accesorios`) y una
 * sin categoría no cuenta para ninguna. Las marcas se leen del catálogo POR CLAVE aunque la fila esté inactiva:
 * retirar una novedad no relaja la exigencia de una remisión que ya la marcó (RQ-RE-26). Legado: nada.
 */
export function fotosQueFaltan(
  rem: RemisionRecepcion, fotos: readonly FotoClasificada[], catalogo: readonly NovedadCatalogo[],
): { categorias: CategoriaFoto[]; novedades: NovedadMarcada[] } {
  if (!rem.novedades) return { categorias: [], novedades: [] }
  return {
    categorias: CATEGORIAS_FOTO_MINIMAS.filter((c) => !fotos.some((f) => f.categoria === c)),
    novedades: rem.novedades.filter((n) =>
      catalogo.find((c) => c.clave === n.clave)?.excluyeDemas !== true
      && !fotos.some((f) => f.categoria === 'novedad' && f.novedad === n.clave)),
  }
}

/**
 * Motivo por el que la remisión NO se puede enviar, o `null`. Legado: la regla anterior. Formulario nuevo, en
 * ORDEN FIJO (regla de mutación 1; PE-3): (a) rotulado, (b) fotos mínimas, (c) foto de cada novedad; cada motivo
 * nombra TODO lo que falta de su paso.
 */
export function motivoNoEnviable(
  rem: RemisionRecepcion, fotos: readonly FotoClasificada[], catalogo: readonly NovedadCatalogo[],
): string | null {
  if (!rem.novedades) return faltaFotoPorNovedad(rem.hayNovedad, fotos.length) ? MOTIVO_FOTO_LEGADO : null
  if (!rem.rotuladoAt) return 'Falta confirmar que el equipo quedó rotulado y guardado.'
  const falta = fotosQueFaltan(rem, fotos, catalogo)
  if (falta.categorias.length) {
    return `Faltan fotos obligatorias: ${falta.categorias.map((c) => ETIQUETA_CATEGORIA_FOTO[c]).join(', ')}.`
  }
  if (falta.novedades.length) return `Falta la foto de cada novedad marcada: ${falta.novedades.map((n) => n.etiqueta).join(', ')}.`
  return null
}

/**
 * Valida la categoría que trae la subida de una foto (RQ-RE-25; en legado también, C4). Sin `categoria` → `null`
 * (la foto vieja: cuenta para la regla de legado y para ninguna categoría). `novedad` sólo vale con
 * `categoria = 'novedad'` y debe ser la clave de una novedad MARCADA en la remisión; con otra categoría se descarta.
 */
export function categoriaDeFoto(
  rem: RemisionRecepcion, cuerpo: { categoria?: unknown; novedad?: unknown },
): { ok: true; categoria: CategoriaFoto | null; novedad: string | null } | { ok: false; error: string } {
  const c = cuerpo.categoria
  if (c === undefined || c === null) return { ok: true, categoria: null, novedad: null }
  if (typeof c !== 'string' || !(CATEGORIAS_FOTO as readonly string[]).includes(c)) {
    return { ok: false, error: `Categoría de foto no válida: usa ${CATEGORIAS_FOTO.join(', ')}.` }
  }
  if (c !== 'novedad') return { ok: true, categoria: c as CategoriaFoto, novedad: null }
  const clave = cuerpo.novedad
  if (typeof clave !== 'string' || !rem.novedades?.some((n) => n.clave === clave)) {
    return { ok: false, error: 'La foto de novedad debe indicar una novedad marcada en esta remisión.' }
  }
  return { ok: true, categoria: 'novedad', novedad: clave }
}
