import type { Cargo } from './cargos'
import { diasEntre } from './contratos'
import { enEsperaDe } from './estados'
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

/**
 * A quién avisa la alarma de caducidad de cada espera (RQ-AV-26, S-6): los cargos de permiso que reciben el aviso y, si nadie los
 * lleva, el área de respaldo (S-19). El derivado de Comercial se suma aparte, sólo en las externas (la clase sale de `enEsperaDe`).
 */
export const ALARMA_ESPERA: Record<keyof typeof PLAZO_DIAS_ESPERA, { cargos: readonly Cargo[]; areaRespaldo: 'Comercial' | 'Servicio Técnico' }> = {
  'En Espera de Repuestos': { cargos: ['Director Comercial', 'Coordinador Comercial'], areaRespaldo: 'Comercial' },
  'Solicitado': { cargos: ['Director Técnico', 'Coordinador Técnico'], areaRespaldo: 'Servicio Técnico' },
  'Servicio externo': { cargos: ['Director Comercial', 'Coordinador Comercial'], areaRespaldo: 'Comercial' },
  'En espera de SKU inventario': { cargos: ['Director Comercial', 'Coordinador Comercial'], areaRespaldo: 'Comercial' },
}

/**
 * El texto del aviso de una espera vencida. Las externas SUGIEREN la decisión de Comercial; las internas ESCALAN y no nombran
 * ninguna salida: la clase sale de `enEsperaDe`, no se redeclara. `Solicitado` escala al área técnica y la espera de SKU pide crearlo.
 */
export function textoAvisoEspera(estado: string, numero: number, dias: number): string {
  const base = `El ticket #${numero} lleva ${dias} días en «${estado}» (plazo: ${(PLAZO_DIAS_ESPERA as Record<string, number | undefined>)[estado]})`
  if (enEsperaDe(estado) === 'externa') return `${base}. Comercial decide su salida: cobrar el diagnóstico o anular.`
  return estado === 'Solicitado' ? `${base} sin entregarse la pieza: se escala a Servicio Técnico.` : `${base}: hay que crear el SKU.`
}
