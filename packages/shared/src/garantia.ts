import type { Ticket } from './types'
import { diaEnZona, esFechaCalendarioReal } from './fechasDerivadas'

/** La marca de garantía de un ticket (F1B-18; `tickets-core` RQ-TC-58). Sale de `Ticket['garantia']`: un solo literal. */
export type EstadoGarantia = NonNullable<Ticket['garantia']>

/**
 * ¿Estaba el equipo en garantía el DÍA en que se creó el ticket? Fórmula única: la calcula el servidor y el alta del
 * formulario la reutiliza con `new Date()` (regla invariable 13, punto 1).
 *
 * `creadoEn` es un `Date` o un ISO con desplazamiento (lo que acepta `diaEnZona`) y se mide en `ZONA_NEGOCIO`; si no es
 * legible la marca no existe (`null`). `finGarantia` es una fecha de calendario `YYYY-MM-DD`: cualquier otra cosa
 * —vacío, `null`, un ISO con hora, un día inexistente— es `sin_dato`, porque `diaEnZona` aceptaría un `Date` y lo
 * reduciría a Bogotá, y un `date` de pg es medianoche local. Mismo día o anterior al fin: `en_garantia`; si no, `vencida`.
 */
export function estadoGarantia(creadoEn: unknown, finGarantia: string | null | undefined): EstadoGarantia | null {
  const dia = diaEnZona(creadoEn)
  if (dia === null) return null
  const fin = typeof finGarantia === 'string' ? finGarantia.trim() : ''
  if (!esFechaCalendarioReal(fin)) return 'sin_dato'
  return dia <= fin ? 'en_garantia' : 'vencida'
}

/** La transición que se destaca (no se impone) en «Notificado» cuando el equipo estaba en garantía (RQ-TC-60). */
export function sugerenciaPorGarantia(status: string, garantia: EstadoGarantia | null | undefined): 'reporte_por_garantia' | null {
  return status === 'Notificado' && garantia === 'en_garantia' ? 'reporte_por_garantia' : null
}
