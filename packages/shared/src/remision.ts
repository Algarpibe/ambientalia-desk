/**
 * Perfiles de checklist "Incluye" de una remisión de ENTRADA.
 *
 * No hay uno por marca: `Grimm EDM180` y `Grimm EDM 280` comparten marca pero tienen listas distintas,
 * y Horiba se parte por modelo. Replican los perfiles del flujo n8n `Remisiones_ST_3.13_Desk`.
 * `kunak` existe a propósito aunque hoy no tenga ítems: su formulario nunca tuvo checklist.
 */
export const PERFILES_CHECKLIST = ['grimm_edm280', 'grimm_edm180', 'horiba_ap', 'environics', 'kunak', 'otro'] as const

export type PerfilChecklist = (typeof PERFILES_CHECKLIST)[number]

const norm = (v: string | null | undefined): string => (v ?? '').trim().toLowerCase()

/**
 * Perfil de checklist para un equipo, a partir de su marca y modelo.
 *
 * Replica las reglas del nodo `Switch Entrada - Marca` **en su mismo orden**, que evalúa el MODELO antes
 * que la marca: un equipo cuyo modelo contenga `EDM180` cae en ese perfil sea cual sea su marca. Hoy es
 * inocuo (esos modelos solo existen en Grimm) y se conserva para no divergir del flujo.
 *
 * Dos diferencias deliberadas respecto al original:
 * - **Comparación sin distinguir mayúsculas ni espacios sobrantes.** El Switch usa igualdad exacta, así que
 *   un `GRIMM` de la carga inicial no habría casado.
 * - **Fallback explícito a `otro`.** El Switch no define `options.fallbackOutput`, de modo que una marca
 *   desconocida se descartaba en silencio. `otro` es además el perfil con el checklist más completo.
 */
export function perfilChecklist(marca: string | null | undefined, modelo: string | null | undefined): PerfilChecklist {
  const ma = norm(marca)
  const mo = norm(modelo)

  if (mo === 'edm 280') return 'grimm_edm280'
  if (mo.includes('edm180')) return 'grimm_edm180'
  if (ma === 'horiba') return mo.startsWith('ap') ? 'horiba_ap' : 'otro'
  if (ma === 'environics') return 'environics'
  if (ma === 'kunak') return 'kunak'
  return 'otro'
}

/**
 * Cuánto espera la pantalla el desenlace de n8n antes de decir que no ha contestado.
 * Es cuándo se le ofrece al técnico reintentar, no cuándo se da por perdido el envío.
 */
export const ESPERA_DESENLACE_SEGUNDOS = 60

/**
 * Cuánto tarda un envío sin respuesta en darse por perdido y poder repetirse.
 *
 * Es DELIBERADAMENTE mayor que `ESPERA_DESENLACE_SEGUNDOS`: si fueran iguales, el reintento que
 * ofrece la pantalla caería justo cuando la reclamación caduca, y un n8n simplemente lento —subir
 * varias fotos a Drive pasa del minuto— acabaría generando un segundo documento mientras el primero
 * sigue vivo. Con la ventana más larga, ese reintento recibe un 409 que dice la verdad: sigue en curso.
 */
export const VENTANA_REENVIO_SEGUNDOS = 120

/**
 * Los cuatro estados que la app sabe producir. Existe para que los mapas que dependen del estado
 * —la etiqueta de aquí y las clases de Tailwind del cliente— no puedan quedarse cojos: el `satisfies`
 * de más abajo obliga a que cada uno los cubra todos.
 */
export const ESTADOS_REMISION = ['pendiente', 'ok', 'ok_con_avisos', 'error'] as const
export type EstadoRemision = (typeof ESTADOS_REMISION)[number]

/**
 * Etiquetas en español del `estado` de una remisión. Viven aquí y no en la capa de presentación
 * porque las necesitan las dos orillas: las pantallas de remisiones y la historia del ticket, que se
 * compone en el servidor. Solo el TEXTO — las clases de Tailwind se quedan en el cliente, que es el
 * único que las entiende.
 *
 * La anotación y el `satisfies` conviven a propósito, y cada uno resuelve un problema distinto:
 * - `Record<string, string>` permite INDEXAR con cualquier cadena. `estado` sale de Postgres con un
 *   cast sin validar y la columna no tiene `CHECK`, así que el tipo promete uno de estos cuatro
 *   valores pero la base no lo garantiza; indexarlo debe poder fallar sin lanzar — de ahí
 *   `ETIQUETA_ESTADO_REMISION_DESCONOCIDA`. Con `Record<EstadoRemision, string>` a secas, el servidor
 *   no podría ni consultar el mapa con lo que le llega de la base.
 * - `satisfies` exige que estén los cuatro estados CONOCIDOS. Sin él, la anotación se traga un mapa
 *   incompleto y el estado que falte se degrada en silencio.
 */
export const ETIQUETA_ESTADO_REMISION: Record<string, string> = {
  pendiente: 'Enviando…',
  ok: 'Creada',
  ok_con_avisos: 'Creada con avisos',
  error: 'Falló',
} satisfies Record<EstadoRemision, string>
export const ETIQUETA_ESTADO_REMISION_DESCONOCIDA = 'Estado desconocido'

/**
 * `carpetaUrl` llega de n8n por el callback, sin validar, y acaba en un `href`. El callback está tras
 * un secreto compartido, así que el riesgo es bajo, pero es la única entrada de estos paneles que
 * llega a un atributo peligroso: si el secreto se filtrara, un `javascript:` colado ahí se ejecutaría
 * al clic. Exigir `https://` cierra esa puerta sin coste — mejor sin enlace que con uno malo.
 *
 * En shared porque ahora la usan el cliente (paneles de remisión) y el servidor (historia del ticket).
 *
 * También rechaza la comilla doble, y no la escapa quien construye el HTML, porque la historia del
 * ticket interpola el resultado en `href="…"` y devuelve ese HTML por la API: una comilla se saldría
 * del atributo (`https://x" onmouseover=…`) y dejaría la seguridad entera en manos de quien lo pinte
 * —hoy DOMPurify en `HistoriaPanel`, mañana cualquier otro consumidor—. Filtrar aquí la cierra en un
 * único sitio y no le quita ningún enlace legítimo a nadie: una URL real trae la comilla como `%22`.
 */
export function urlSegura(v: string | null | undefined): string | null {
  return typeof v === 'string' && v.startsWith('https://') && !v.includes('"') ? v : null
}

/**
 * RQ-RE-18. Predicado compartido: la remisión queda bloqueada por esta regla sólo cuando el equipo
 * llegó con novedad DECLARADA (`true`, no ausente ni `null`) y no tiene ninguna foto todavía. Lo
 * consumen el servidor (guarda de `/enviar`, RQ-RE-08) y el formulario (RQ-RE-19) — regla invariable
 * 13, punto 1: la misma función en las dos orillas, no una reescritura del cliente.
 */
export function faltaFotoPorNovedad(hayNovedad: boolean | null | undefined, numFotos: number): boolean {
  return hayNovedad === true && numFotos < 1
}
