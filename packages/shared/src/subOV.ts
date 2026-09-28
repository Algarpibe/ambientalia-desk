/**
 * Clasificador de subOV (asociacion-ov-ticket, lote 4; `tickets-core` RQ-TC-18, S-2, S-8).
 *
 * Una subOV canónica es `OV-AAAA-NNN(N)-SS`: la OV madre (el lote) más un sufijo de exactamente dos dígitos.
 * Lo que lleva sufijo pero NO es canónico se pone en CUARENTENA: no se asocia a ningún ticket ni sale en el
 * buscador, porque no se sabe de qué lote es ni si el sufijo es un error de tecleo.
 *
 * Regla, tras `trim` (las tres ramas, en este orden):
 *   1. `^OV-(\d{4})-(\d{3,4})-(\d{2})$`  → `subov`, con el lote `OV-AAAA-NNN(N)` y el sufijo.
 *   2. `^OVI?-\d{4}-\d{3,}$`            → `ordinaria` (OV u OVI simple; cinco o más dígitos SIN sufijo también).
 *   3. `^OVI?-\d{4}-\d{3,}[^\d]…`       → `cuarentena`: sufijo = resto que EMPIEZA por un no-dígito tras la base. Una
 *      `OVI` nunca tiene subOV canónica, así que `OVI-…-01` es cuarentena (S-8). Consecuencia declarada:
 *      `OV-2026-00123-01` tiene sufijo y su base de cinco dígitos no casa la subOV (exacta), luego es cuarentena.
 *   4. cualquier otro formato (`SO-00123`, vacío, no-texto) → `ordinaria`: no es asunto de este clasificador.
 *
 * Es sensible a mayúsculas, como el resto de comparaciones de número de OV del repositorio.
 *
 * Escalón de precedencia (F1B-10): la cuarentena es escalón **C** —validez del CONTENIDO: la OV existe, es el
 * formato de su número el que no vale—, no **A**. Por eso cada puerta la evalúa después de la existencia y
 * antes de la unicidad (**D**).
 */

const SUBOV = /^OV-(\d{4})-(\d{3,4})-(\d{2})$/
const BASE = /^OVI?-\d{4}-\d{3,}$/
const BASE_CON_RESTO = /^OVI?-\d{4}-\d{3,}[^\d][\s\S]*$/

export type ClasificacionOV =
  | { tipo: 'ordinaria' }
  | { tipo: 'subov'; lote: string; sufijo: string }
  | { tipo: 'cuarentena'; motivo: string }

export function clasificarOV(numero: unknown): ClasificacionOV {
  if (typeof numero !== 'string') return { tipo: 'ordinaria' }
  const n = numero.trim()
  const s = SUBOV.exec(n)
  if (s) return { tipo: 'subov', lote: `OV-${s[1]}-${s[2]}`, sufijo: s[3] }
  if (BASE.test(n)) return { tipo: 'ordinaria' }
  if (BASE_CON_RESTO.test(n)) {
    return { tipo: 'cuarentena', motivo: `La orden de venta ${n} tiene un sufijo que no es canónico (se espera OV-AAAA-NNN-NN, con dos dígitos): corrige el número en Books antes de asociarla` }
  }
  return { tipo: 'ordinaria' }
}

export const esCuarentena = (numero: unknown): boolean => clasificarOV(numero).tipo === 'cuarentena'

/** El motivo de la cuarentena, o `null` si el número no está en ella. */
export function motivoCuarentena(numero: unknown): string | null {
  const c = clasificarOV(numero)
  return c.tipo === 'cuarentena' ? c.motivo : null
}

/** Un motivo por cada número en cuarentena, en orden; lo que no es texto o no está en cuarentena se salta. */
export function erroresCuarentena(numeros: unknown[]): string[] {
  return numeros.flatMap((n) => motivoCuarentena(n) ?? [])
}
