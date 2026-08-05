import type { RemisionPasoFallido } from '@ambientalia/shared'
import { ETIQUETA_ESTADO_REMISION, ETIQUETA_ESTADO_REMISION_DESCONOCIDA } from '@ambientalia/shared'

/**
 * Formatea la `fecha` de una remisión ("2026-05-19") al formato largo de es-CO ("19 de may de 2026").
 *
 * Existe SOLO por el corrimiento de un día: `fecha` es un `date` de Postgres que llega como
 * "YYYY-MM-DD", y `new Date("2026-05-19")` se interpreta como medianoche UTC, que en Bogotá (UTC-5)
 * se pinta como el 18. Añadirle la hora la ancla a medianoche LOCAL, que es lo que el técnico tecleó.
 * De ahí que esté probada: es una función de tres líneas cuyo único motivo de ser es un caso límite.
 *
 * Vive aquí —presentación compartida de las pantallas de remisiones, junto a `ESTADO_REMISION`—
 * porque la usan las tres: `PanelRemisiones`, `RemisionesPage` y `CrearRemision`. Ojo: NO es la misma
 * función que las `fmtFecha` de `ActividadesPage`, `ClienteDetalle` y `HojaDeVida`, que aceptan `null`
 * y devuelven cadena vacía; unificar las seis no es un cambio de forma sino de contrato.
 */
export function fmtFecha(v: string): string {
  const d = new Date(v.length === 10 ? `${v}T00:00:00` : v)
  if (Number.isNaN(d.getTime())) return v
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
}

/**
 * Igual que `fmtFecha` pero para un instante completo (`createdAt`), con hora. No comparte cuerpo con
 * ella a propósito: aquí el ISO trae zona horaria propia y anclarlo a medianoche local lo estropearía.
 *
 * Es lo que hay que enseñar cuando la pregunta es "¿cuándo se hizo ESTE intento?": `fecha` es la del
 * servicio, la teclea el técnico y por defecto es hoy, así que no distingue un intento de otro.
 */
export function fmtFechaHora(v: string): string {
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(d)
}

/**
 * `resultado` llega de n8n y se guarda tal cual, sin validar. Una remisión anterior al contrato
 * actual, o un flujo modificado, pueden traer cualquier cosa donde el tipo promete una lista, así
 * que se filtra aquí: un dato raro no puede tumbar la pantalla que le da el resultado al técnico.
 *
 * Vive en `lib/` y no dentro de `ResultadoRemision.tsx` porque `PanelRemisiones` necesita el mismo
 * criterio y un archivo de componente solo puede exportar componentes (fast refresh de Vite se queja
 * si no); moverla aquí evita reimplementarla dos veces.
 */
export function pasos(v: RemisionPasoFallido[] | undefined): RemisionPasoFallido[] {
  return Array.isArray(v) ? v.filter((p) => typeof p?.paso === 'string') : []
}

// Se mudó a `packages/shared` porque el servidor la necesita para la historia del ticket. Se
// reexporta para que los paneles la sigan importando de donde siempre.
export { urlSegura } from '@ambientalia/shared'

/**
 * Clases de Tailwind por estado. El TEXTO vive en `packages/shared` porque lo necesita también el
 * servidor; aquí queda solo lo que es de cliente. Se componen para que las pantallas sigan
 * consumiendo un único objeto `{ label, className }` y no tengan que juntar dos mapas cada una.
 */
const CLASES_ESTADO_REMISION: Record<string, string> = {
  pendiente: 'bg-slate-100 text-slate-600 border-slate-200',
  ok: 'bg-green-50 text-green-700 border-green-200',
  ok_con_avisos: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-red-50 text-red-600 border-red-100',
}

export const ESTADO_REMISION: Record<string, { label: string; className: string }> = Object.fromEntries(
  Object.entries(ETIQUETA_ESTADO_REMISION).map(([k, label]) => [k, { label, className: CLASES_ESTADO_REMISION[k] ?? '' }]),
)

// Sin este valor por defecto, un estado fuera de los cuatro conocidos tumbaría el render de TODA la
// vista que lo use —no solo la fila—: no hay ErrorBoundary en el árbol que lo contenga.
export const ESTADO_REMISION_DESCONOCIDA = {
  label: ETIQUETA_ESTADO_REMISION_DESCONOCIDA,
  className: 'bg-slate-100 text-slate-500 border-slate-200',
}
