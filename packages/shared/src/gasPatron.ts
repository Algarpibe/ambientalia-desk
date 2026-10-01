/**
 * Gases patrón (F1A-03, `gases-patron` RQ-GP-01, RQ-GP-03): dominio puro, apto para navegador.
 *
 * Parte 1: la lista cerrada de compuestos con su grafía canónica, la vigencia de un gas y «un compuesto
 * tiene patrón vigente». Es la ÚNICA fuente de la lista (regla invariable 13, punto 1): la guarda, el alta,
 * la corrección del equipo y la siembra no la reescriben. La comparación es canónica en los DOS lados y en
 * JS —no por texto en SQL—, porque «SO2» frente a «SO₂» sería dos nociones distintas (molde H5).
 * «Hoy» lo da quien llama (`hoyEnZona`, `contratos.ts:61-63`): aquí no se lee el reloj.
 */
import type { DiaCivil } from './calendarioLaboral'

/** Lista cerrada (supuesto s4), con la grafía canónica que se guarda. */
export const COMPUESTOS = ['SO₂', 'NOₓ', 'CO', 'O₃', 'H₂S', 'TRS', 'NH₃'] as const
export type Compuesto = (typeof COMPUESTOS)[number]

/** `NFKC` pliega `₂`→`2` y `ₓ`→`x`; después mayúsculas y sin espacios. */
const clave = (v: string): string => v.normalize('NFKC').toUpperCase().replace(/\s+/g, '')

/** La grafía canónica de un valor, o `null` si está vacío, no es texto o no pertenece a la lista. */
export function compuestoCanonico(v: unknown): Compuesto | null {
  if (typeof v !== 'string') return null
  const k = clave(v)
  return COMPUESTOS.find((c) => clave(c) === k) ?? null
}

/** Lo que llega por HTTP: vacío o nulo limpia; un valor de la lista se guarda canónico; el resto es error. */
export function compuestoDelCuerpo(v: unknown): { ok: true; valor: Compuesto | null } | { ok: false; error: string } {
  if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) return { ok: true, valor: null }
  const valor = compuestoCanonico(v)
  if (valor) return { ok: true, valor }
  return { ok: false, error: `El compuesto debe ser uno de: ${COMPUESTOS.join(', ')}` }
}

/** Una fila de `public.gases_patron` tal como la lee el servidor (`vence` ya como día civil). */
export interface GasPatronLeido { compuesto: string | null; disponible: boolean | null; vence: DiaCivil | null }

/** Vigente: disponible y con vencimiento igual o posterior a hoy (los días civiles se comparan como cadenas). */
export function patronVigente(g: GasPatronLeido, hoy: DiaCivil): boolean {
  return g.disponible === true && g.vence !== null && g.vence >= hoy
}

/** ¿Alguna fila vigente es del compuesto del equipo? Un compuesto no reconocido no casa con nada. */
export function tienePatronVigente(compuestoEquipo: string | null, gases: readonly GasPatronLeido[], hoy: DiaCivil): boolean {
  const canonico = compuestoCanonico(compuestoEquipo)
  if (canonico === null) return false
  return gases.some((g) => compuestoCanonico(g.compuesto) === canonico && patronVigente(g, hoy))
}

export const CLAVE_CERTIFICADO_FABRICA = 'certificado_fabrica'
export const CLAVE_MOTIVO_SIN_VERIFICACION = 'motivo_sin_verificacion'

/** Etiquetas legibles de las dos claves que el historial no puede deducir de la clave. */
export const ETIQUETA_CLAVE_PROPIA: Record<string, string> = {
  [CLAVE_CERTIFICADO_FABRICA]: 'Número del certificado de fábrica',
  [CLAVE_MOTIVO_SIN_VERIFICACION]: 'Liberado sin Verificación',
}
