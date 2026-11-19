import { esPasoDeMigracion, llegadaQueCuenta } from './cierreEnCifras'
import { normalizarSiTexto } from './normalizarEstado'
import type { HistorialTransition, HistoryDetail } from './types'; import type { ReglaEquivalencia } from './migracionTickets'

/**
 * marcador-migracion-lectores (F1F-01): qué aporta el marcador de la migración a «desde cuándo está el ticket en su estado».
 * Regla pura, sin base de datos ni reloj: el servidor lee la fila y la historia de Zoho y se las pasa (regla invariable 13).
 * El marcador se reconoce SÓLO con `esPasoDeMigracion`; ningún otro lector compara el id de la transición (RQ-TZ-28).
 *
 * Es la ÚNICA noción de «entrada con fecha de Zoho» del repositorio: `entradasActuales` y `secuenciaDelReloj` la consumen
 * (y, por ésta, las esperas y el reloj de Análisis); no hay una segunda (molde H5).
 */

/** Fila de `ticket_transitions` como la leen los lectores; `values` ya como objeto (D-7), el módulo no parsea texto. */
export interface FilaConMarcador { transition_id?: unknown; from_status?: unknown; to_status?: unknown; values?: unknown }

/** `ninguna` = no da entrada (identidad). `entrada` con `desde` nulo = sin dato (S-6). */
export type EntradaDelMarcador = { tipo: 'ninguna' } | { tipo: 'entrada'; de: string | null; estado: string; desde: string | null }

const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const texto = (v: unknown): string | null => (typeof v === 'string' ? v : null)

/** D-2: la ÚLTIMA entrada en Zoho a `estadoPrevio`, comparando con el estado normalizado (la historia lo trae en crudo). */
function ultimaEntradaA(estadoPrevio: string | null, etapasZoho: readonly HistorialTransition[]): string | null {
  if (estadoPrevio === null) return null
  const buscado = normalizarSiTexto(estadoPrevio)
  let mejor: { t: number; cuando: string } | null = null
  for (const e of etapasZoho) {
    if (normalizarSiTexto(e.toStatus) !== buscado || e.performedAt === null) continue
    const t = new Date(e.performedAt).getTime()
    if (Number.isNaN(t)) continue
    if (mejor === null || t >= mejor.t) mejor = { t, cuando: e.performedAt }
  }
  return mejor === null ? null : mejor.cuando
}

/**
 * `null` si la fila no es el marcador. Con destino nulo (identidad, o «Pendiente» de soporte que se conserva) no es entrada.
 * Con destino decide `values.regla` (D-4): «Entregado» → «Finalizado» fecha como `llegadaQueCuenta` (D-3); «Pendiente» de servicio →
 * «En Proceso», con la última entrada a «Pendiente» (D-2); cualquier otra regla no fecha (S-13).
 */
export function entradaDelMarcador(fila: FilaConMarcador, etapasZoho: readonly HistorialTransition[]): EntradaDelMarcador | null {
  if (!esPasoDeMigracion(fila.transition_id)) return null
  const estado = texto(fila.to_status)
  if (estado === null) return { tipo: 'ninguna' }
  const de = texto(fila.from_status)
  const regla = esObjeto(fila.values) ? fila.values.regla : undefined
  let desde: string | null = null
  if (regla === 'entregado-a-finalizado') desde = llegadaQueCuenta({ transitionId: fila.transition_id, performedAt: '', values: fila.values })
  else if (regla === 'pendiente-servicio-a-en-proceso') desde = ultimaEntradaA(de, etapasZoho)
  return { tipo: 'entrada', de, estado, desde }
}

/**
 * Quita los marcadores de `filasApp` y, por cada uno que cambia el estado, añade AL FINAL de las etapas de Zoho una etapa
 * sintética `{ fromStatus, toStatus, performedAt: fecha }` (D-5). Al final, porque el orden estable de `secuenciaDelReloj` deja
 * a la app antes que a Zoho en un empate: la sintética queda detrás de la entrada a «Pendiente» del mismo instante. `null` si
 * algún marcador que cambia el estado no tiene fecha (S-11): no se inventa un origen.
 */
export function resolverMarcador<F extends FilaConMarcador>(
  filasApp: readonly F[], etapasZoho: readonly HistorialTransition[],
): { filasApp: F[]; etapasZoho: HistorialTransition[] } | null {
  const reales: F[] = []
  const sinteticas: HistorialTransition[] = []
  for (const f of filasApp) {
    const entrada = entradaDelMarcador(f, etapasZoho)
    if (entrada === null) { reales.push(f); continue }
    if (entrada.tipo === 'ninguna') continue
    if (entrada.desde === null) return null
    sinteticas.push({ transitionName: null, fromStatus: entrada.de, toStatus: entrada.estado, area: null, performedBy: null, performedAt: entrada.desde })
  }
  return { filasApp: reales, etapasZoho: [...etapasZoho, ...sinteticas] }
}

export const TITULO_MARCADOR_MIGRACION = 'Migración desde Zoho Desk'

/** Las cuatro reglas de `ReglaEquivalencia` (`migracionTickets.ts`) en español; el historial no enseña el id de la regla (S-1). */
export const TEXTO_REGLA_MIGRACION: Readonly<Record<ReglaEquivalencia, string>> = {
  identidad: 'El estado existe igual en Desk y se conserva',
  'pendiente-servicio-a-en-proceso': '"Pendiente" de servicio técnico pasa a "En Proceso"',
  'entregado-a-finalizado': '"Entregado" pasa a "Finalizado"',
  'pendiente-soporte-se-conserva': '"Pendiente" de soporte remoto se conserva',
}

const textoDeRegla = (regla: unknown): string | null =>
  typeof regla === 'string' && Object.prototype.hasOwnProperty.call(TEXTO_REGLA_MIGRACION, regla) ? TEXTO_REGLA_MIGRACION[regla as ReglaEquivalencia] : null

/**
 * Título y detalles del marcador para el historial (S-1, S-12). Las etiquetas son propias, nunca una clave de `values` (la
 * etiqueta automática de `regla` daba «Regla»), y salen en este orden omitiendo lo que falte; no salen `status_type_previo`,
 * `managed_by_app_previo`, `closed_time_*` ni `cierre_origen`. El corte se enseña como se guardó (ISO, UTC). Tolera `values`
 * nulo, vacío o que no es un objeto: sólo el título, sin lanzar.
 */
export function presentarMarcador(values: unknown): { title: string; details: HistoryDetail[] } {
  const v = esObjeto(values) ? values : {}
  const pares: Array<[string, string | null]> = [
    ['Estado en Zoho', texto(v.estado_previo)], ['Estado en Desk', texto(v.estado_destino)], ['Regla aplicada', textoDeRegla(v.regla)],
    ['Corte de la migración', texto(v.corte)], ['Ejecutada por', texto(v.ejecutado_por)],
  ]
  const details: HistoryDetail[] = []
  for (const [label, value] of pares) if (value !== null && value.trim() !== '') details.push({ label, value })
  return { title: TITULO_MARCADOR_MIGRACION, details }
}
