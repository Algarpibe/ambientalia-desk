import type { Transition } from './transitions'
import { esFechaCalendarioReal } from './fechasDerivadas'
import type { DiaCivil } from './calendarioLaboral'

/**
 * facturar-dos-ramas (F1C-02) · «Facturar», la salida de `Pendiente de facturar` a `Finalizado` (`decision/c4-dos-ramas`:
 * «se sale con la transición Facturar, que registra la factura y su fecha»).
 *
 * La guarda es de CONTENIDO (escalón C) y pura, molde de `liberacionSinFactura.ts`: se activa por el campo del número,
 * no por el id. La PRESENCIA no es suya: un valor ausente o vacío lo dice `buildTransitionPlan`
 * (`apps/desk/server/transitionExec.ts:77`), y en el `422` agregado esos errores van delante.
 *
 * `CLAVE_FECHA_FACTURA` es exactamente la etiqueta de `PROMOTED_COLUMNS` para `tickets.fecha_factura`: el hecho de estar
 * facturado vive ahí, en un solo sitio. El número no tiene columna (S-1): va a `custom_fields` y a la traza.
 */
export const CLAVE_NUMERO_FACTURA = 'Número de factura'
export const CLAVE_FECHA_FACTURA = 'Fecha De Factura'

const vacio = (x: unknown) => x === undefined || x === null || x === ''
const leer = (valores: unknown, clave: string): unknown =>
  typeof valores === 'object' && valores !== null ? (valores as Record<string, unknown>)[clave] : undefined

export function erroresFacturar(t: Pick<Transition, 'fields'>, valores: unknown): string[] {
  if (!t.fields.some((f) => f.key === CLAVE_NUMERO_FACTURA)) return []
  const numero = leer(valores, CLAVE_NUMERO_FACTURA)
  const fecha = leer(valores, CLAVE_FECHA_FACTURA)
  const errores: string[] = []
  if (!vacio(numero) && !(typeof numero === 'string' && numero.trim() !== '')) errores.push('Falta el número de factura: no puede quedar en blanco')
  if (!vacio(fecha) && !(typeof fecha === 'string' && esFechaCalendarioReal(fecha))) errores.push(`Fecha inválida en el campo: ${CLAVE_FECHA_FACTURA}`)
  return errores
}

/** S-12: el número y la fecha de factura son los de la factura que se registra AHORA; el cliente no los hereda del ticket. */
export function seRegistraEnCadaFactura(clave: string): boolean {
  return clave === CLAVE_NUMERO_FACTURA || clave === CLAVE_FECHA_FACTURA
}

/**
 * La alarma de facturación (RQ-AV-23, `decision/anexo-33-checkbox`: «Si esa fecha pasa y el ticket sigue en Pendiente de
 * facturar, el sistema avisa al Director Comercial»). Pura: decide si la fecha prevista ya pasó, en día civil (S-4).
 * El mismo día de la fecha todavía no ha pasado; el siguiente, sí. Sin fecha —el histórico anterior al 09/09, que no se
 * reescribe— no vence nunca. Las dos fechas son `AAAA-MM-DD`, así que su orden de cadena es el del calendario.
 * No es una alarma de SLA: no mide horas desde la entrada al estado, y por eso no vive en `SLA_HORAS_POR_ESTADO`.
 */
export function facturacionVencida(fechaPrevista: DiaCivil | null, hoy: DiaCivil): boolean {
  return fechaPrevista !== null && fechaPrevista < hoy
}
