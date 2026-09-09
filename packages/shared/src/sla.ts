import type { Estado } from './estados'

/**
 * EL RELOJ DEL SLA — corrección C11, punto abierto nº 40.
 *
 * El blueprint de Zoho Desk tiene un SLA de 1 día sobre `Notificado` —el estado en el que un
 * diagnóstico espera revisión— y la aplicación no lo trajo (M1.7, `R08.1.md:1570`). Importa porque
 * `Notificado` es la antesala de todo lo comercial: de ahí salen el reporte por garantía, el escalado
 * a comercial y la devolución a corrección, y un diagnóstico parado ahí retrasa la cotización, que es
 * el reloj que el cliente percibe (`:1571`).
 *
 * SE DECLARA COMO DATO, igual que `ESTADOS_SIN_SALIDA` y por la misma razón: es una decisión de
 * negocio, no una propiedad que el grafo pueda contestar. De las 34 transiciones no se deduce que
 * `Notificado` merezca un día y `Pendiente` no.
 *
 * LA UNIDAD ES LA HORA, no el día. El maestro deja abierto en «24/48 h» el plazo de la otra regla por
 * tiempo que tiene pensada (`:1586`), así que declarar días obligaría a cambiar la unidad —y todas
 * sus pruebas— el día que Gerencia elija 48.
 *
 * ⚠️ ESTE MÓDULO NO DISPARA NADA. Es la regla, y la regla es pura: recibe el instante en que el
 * ticket entró en el estado y el instante actual. Quién la consulta y cada cuánto es otra cosa, y hoy
 * NO EXISTE: `R08.1.md:1588` lo dice como `[ABIERTO — AS-BUILT]` —«no existe hoy ninguna transición
 * por tiempo en el blueprint implementado»— y sigue siendo cierto después de F1A-02. Ver la spec
 * `transitions-st` §3.10.
 *
 * ⚠️ Y NO ESCALA. El escalado «al inmediato superior» que la R08 añade a C11 (`:1574`) necesita una
 * jerarquía de cargos que el modelo NO TIENE: `DERIVACION_POR_DEFECTO` sabe qué cargo corresponde a
 * una etapa, no quién está por encima de quién. Queda como punto abierto, no se inventa aquí.
 */
export const SLA_HORAS_POR_ESTADO: Partial<Record<Estado, number>> = {
  // El único que el maestro decidió. Un día = 24 h.
  'Notificado': 24,
}

const HORA_EN_MS = 60 * 60 * 1000

/** Cuándo vence el SLA de un ticket que entró en `estado` en `desde`. `null` si ese estado no tiene. */
export function venceSlaEn(estado: Estado, desde: Date): Date | null {
  const horas = SLA_HORAS_POR_ESTADO[estado]
  if (horas === undefined) return null
  return new Date(desde.getTime() + horas * HORA_EN_MS)
}

/**
 * ¿Se pasó el plazo?
 *
 * En el instante EXACTO del vencimiento todavía no: un SLA de «un día» que saltara a las 23:59:59.999
 * no sería un día. La comparación es estricta a propósito.
 */
export function slaVencido(estado: Estado, desde: Date, ahora: Date): boolean {
  const vence = venceSlaEn(estado, desde)
  return vence !== null && ahora.getTime() > vence.getTime()
}
