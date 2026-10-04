import type { Transition } from './transitions'
import { esFechaCalendarioReal } from './fechasDerivadas'

/**
 * liberacion-sin-factura-motivo-fecha (F1C-05) · la guarda de CONTENIDO de «Liberación sin factura» (escalón C).
 *
 * Es una función pura sobre la transición y los valores. Se activa por el CAMPO y no por el id (diseño D4): si la
 * transición no declara el campo del motivo, no hace nada. La lista de motivos es la de las `options` de ese mismo
 * campo (D5): este módulo no la repite, sólo nombra el motivo que exige texto, y una prueba lo ata al catálogo.
 * La PRESENCIA no es suya: un valor vacío lo dice `buildTransitionPlan` (`apps/desk/server/transitionExec.ts:77`).
 */
export const CLAVE_MOTIVO_LIBERACION = 'Motivo de liberación sin factura'
export const CLAVE_FECHA_PREVISTA_FACTURACION = 'Fecha prevista de facturación'
export const CLAVE_TEXTO_AUTORIZACION = 'Texto de la autorización'
export const MOTIVO_QUE_EXIGE_TEXTO = 'Autorización excepcional de Dirección Comercial'

const CLAVES_QUE_SE_PIDEN_DE_NUEVO: readonly string[] = [CLAVE_MOTIVO_LIBERACION, CLAVE_FECHA_PREVISTA_FACTURACION, CLAVE_TEXTO_AUTORIZACION]

const vacio = (x: unknown) => x === undefined || x === null || x === ''
const leer = (valores: unknown, clave: string): unknown =>
  typeof valores === 'object' && valores !== null ? (valores as Record<string, unknown>)[clave] : undefined

export function erroresLiberacionSinFactura(t: Pick<Transition, 'fields'>, valores: unknown): string[] {
  const campo = t.fields.find((f) => f.key === CLAVE_MOTIVO_LIBERACION)
  if (!campo) return []
  const opciones = campo.options ?? []
  const motivo = leer(valores, CLAVE_MOTIVO_LIBERACION)
  const fecha = leer(valores, CLAVE_FECHA_PREVISTA_FACTURACION)
  const texto = leer(valores, CLAVE_TEXTO_AUTORIZACION)
  const errores: string[] = []
  if (!vacio(motivo) && !(typeof motivo === 'string' && opciones.includes(motivo))) errores.push(`El motivo debe ser uno de: ${opciones.join(' · ')}`)
  if (!vacio(fecha) && !(typeof fecha === 'string' && esFechaCalendarioReal(fecha))) errores.push(`Fecha inválida en el campo: ${CLAVE_FECHA_PREVISTA_FACTURACION}`)
  if (motivo === MOTIVO_QUE_EXIGE_TEXTO && !(typeof texto === 'string' && texto.trim() !== '')) {
    errores.push(`Falta el texto de la autorización: es obligatorio con el motivo «${MOTIVO_QUE_EXIGE_TEXTO}»`)
  }
  return errores
}

/** `undefined` si la transición no declara el campo; si no, el texto recortado o `null` (D7: se escribe SIEMPRE). */
export function textoAutorizacionAGuardar(t: Pick<Transition, 'fields'>, valores: unknown): string | null | undefined {
  if (!t.fields.some((f) => f.key === CLAVE_MOTIVO_LIBERACION)) return undefined
  const texto = leer(valores, CLAVE_TEXTO_AUTORIZACION)
  return typeof texto === 'string' && texto.trim() !== '' ? texto.trim() : null
}

export function seVuelveAPedirEnCadaLiberacion(clave: string): boolean {
  return CLAVES_QUE_SE_PIDEN_DE_NUEVO.includes(clave)
}
