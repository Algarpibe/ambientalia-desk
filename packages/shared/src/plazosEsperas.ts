import { diasEntre } from './contratos'
import { diaEnZona } from './fechasDerivadas'

/**
 * salidas-esperas (F1C-03, RQ-AV-25): el registro de plazos de las cuatro esperas (`ESTADOS_SIN_SALIDA`), en DÍAS NATURALES.
 *
 * Los números son LITERALES de la medición `medicion/p90-esperas-2026-10-21` (P90 medido por Gerencia, provisional): no se
 * derivan de las horas hábiles de las alarmas de permanencia de `sla.ts` —es otra noción— y este módulo no lo importa
 * (una prueba de fuente lo fija). Recalcularlos con una medición nueva es un cambio nuevo con su medición fechada.
 */
export const MEDICION_PLAZOS_ESPERAS = { clave: 'medicion/p90-esperas-2026-10-21', fecha: '2026-10-21' } as const

export const PLAZO_DIAS_ESPERA = {
  'En Espera de Repuestos': 79,
  'Solicitado': 13,
  'Servicio externo': 31,
  'En espera de SKU inventario': 20,
} as const

/** Días civiles (zona de negocio) entre la entrada a la espera y `hoy` (`YYYY-MM-DD`). 0 si la entrada no es una fecha legible. */
export function diasEnEspera(desde: unknown, hoy: string): number {
  const entrada = diaEnZona(desde)
  return entrada === null ? 0 : diasEntre(entrada, hoy)
}

/** ¿La espera ya venció? `dias >= plazo` (S-4: el día del plazo ya cuenta). Un estado sin plazo no vence. */
export function esperaVencida(estado: string, dias: number): boolean {
  const plazo = (PLAZO_DIAS_ESPERA as Record<string, number | undefined>)[estado]
  return plazo !== undefined && dias >= plazo
}
