import { EXCEPCIONES_POR_CARGO, puedeCrearOVIGarantia, type SujetoDePermiso } from './cargos'
import type { DiaCivil } from './calendarioLaboral'
import { diasEntre } from './contratos'

/**
 * Reclamación al fabricante sobre una OVI de garantía (F1B-13, `decision/anexo-7-garantia-proveedor`).
 * Regla pura: el servidor la impone y el cliente la consume (regla invariable 13). Una respuesta por
 * asociación: «no» (con motivo) o «sí», que abre una ficha con tres estados sin retroceso.
 */

/** Por qué no se reclama al fabricante. Se guarda la clave; la etiqueta es sólo de presentación. */
export const MOTIVOS_NO_RECLAMA = ['fuera_de_garantia', 'mal_uso', 'costo_envio'] as const
export const ESTADOS_RECLAMACION = ['abierta', 'enviada', 'resuelta'] as const
export const RESULTADOS_RECLAMACION = ['reposicion', 'nota_credito', 'rechazada'] as const

export type MotivoNoReclama = (typeof MOTIVOS_NO_RECLAMA)[number]
export type EstadoReclamacion = (typeof ESTADOS_RECLAMACION)[number]
export type ResultadoReclamacion = (typeof RESULTADOS_RECLAMACION)[number]

export const ETIQUETA_MOTIVO_NO_RECLAMA: Record<MotivoNoReclama, string> = {
  fuera_de_garantia: 'Fuera de garantía',
  mal_uso: 'Mal uso',
  costo_envio: 'El costo del envío supera el valor',
}
export const ETIQUETA_ESTADO_RECLAMACION: Record<EstadoReclamacion, string> = {
  abierta: 'Abierta',
  enviada: 'Enviada al fabricante',
  resuelta: 'Resuelta',
}
export const ETIQUETA_RESULTADO_RECLAMACION: Record<ResultadoReclamacion, string> = {
  reposicion: 'Reposición',
  nota_credito: 'Nota crédito',
  rechazada: 'Rechazada',
}

/** Origen del valor reclamado mientras no se calcule solo (S-4): lo escribe una persona. */
export const ORIGEN_VALOR_MANUAL = 'manual'
/** Días naturales tras los que una reclamación sin resolver avisa; el 60 no avisa, el 61 sí (S-7). */
export const DIAS_AVISO_RECLAMACION = 60
export const MENSAJE_SIN_CARGO_RECLAMACION =
  `Responder o gestionar la reclamación al fabricante sólo lo hace el cargo ${EXCEPCIONES_POR_CARGO.crearOVIGarantia}`

export interface GarantiaProveedor {
  id: number
  asociacionId: number
  ticketId: string
  oviNumero: string
  reclama: boolean
  motivoNoReclama: MotivoNoReclama | null
  respondidaPor: string
  respondidaAt: string
  fabricante: string | null
  piezaReferencia: string | null
  piezaSerial: string | null
  rma: string | null
  valorReclamado: number | null
  origenValorReclamado: string | null
  estado: EstadoReclamacion | null
  resultado: ResultadoReclamacion | null
  valorRecuperado: number | null
  enviadaAt: string | null
  resueltaAt: string | null
  aviso60At: string | null
}

export type Validado<T> = { ok: true; valor: T } | { ok: false; error: string }

export type RespuestaReclamacion =
  | { reclama: false; motivo: MotivoNoReclama }
  | { reclama: true; fabricante: string; piezaReferencia: string | null; piezaSerial: string | null; valorReclamado: number | null }

export interface DatosFicha {
  fabricante: string
  piezaReferencia: string | null
  piezaSerial: string | null
  rma: string | null
  valorReclamado: number | null
}

export type PasoReclamacion =
  | { a: 'enviada' }
  | { a: 'resuelta'; resultado: ResultadoReclamacion; valorRecuperado: number }

/**
 * Quién gestiona la reclamación (S-2): el mismo cargo que asocia una OVI. Envoltorio con nombre propio para que
 * la lista de llamadores de la primitiva de `cargos.ts` no crezca con cada ruta o panel nuevo (PM20-2), y para
 * que revertir S-2 sea un solo sitio. Un sujeto ausente no puede.
 */
export function puedeGestionarReclamacion(s: Pick<SujetoDePermiso, 'isAdmin' | 'cargoPermiso'> | null | undefined): boolean {
  if (!s) return false
  return puedeCrearOVIGarantia(s)
}

/** El estado que sigue a `estado`; `null` en el último y ante cualquier valor desconocido. */
export function siguienteEstado(estado: unknown): EstadoReclamacion | null {
  if (estado === 'abierta') return 'enviada'
  if (estado === 'enviada') return 'resuelta'
  return null
}

/** `null` sólo si `a` es el siguiente de `estado`: sin saltos, sin retrocesos y sin tocar una ficha resuelta. */
export function motivoPasoNoPermitido(estado: unknown, a: unknown): string | null {
  const siguiente = siguienteEstado(estado)
  if (siguiente !== null && a === siguiente) return null
  if (siguiente === null) return 'La reclamación ya está resuelta o su estado no admite más pasos'
  return `Desde «${ETIQUETA_ESTADO_RECLAMACION[estado as EstadoReclamacion]}» sólo se puede pasar a «${ETIQUETA_ESTADO_RECLAMACION[siguiente]}»`
}

const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

/** Texto opcional: ausente o vacío → `null`; recortado; algo que no es texto es error (`undefined`). */
function textoOpcional(v: unknown): string | null | undefined {
  if (v === undefined || v === null) return null
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t === '' ? null : t
}

/** Número opcional: ausente → `null`; finito y ≥ 0; lo demás es error (`undefined`). */
function numeroOpcional(v: unknown): number | null | undefined {
  if (v === undefined || v === null) return null
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : undefined
}

function fabricanteDe(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null
}

/** Pieza, serial, valor y fabricante de una ficha «sí»; `rma` aparte, porque la respuesta inicial no lo lleva. */
function datosComunes(c: Record<string, unknown>): Validado<Omit<DatosFicha, 'rma'>> {
  const fabricante = fabricanteDe(c.fabricante)
  if (fabricante === null) return { ok: false, error: 'El fabricante es obligatorio' }
  const piezaReferencia = textoOpcional(c.piezaReferencia)
  if (piezaReferencia === undefined) return { ok: false, error: 'La referencia de la pieza debe ser texto' }
  const piezaSerial = textoOpcional(c.piezaSerial)
  if (piezaSerial === undefined) return { ok: false, error: 'El serial de la pieza debe ser texto' }
  const valorReclamado = numeroOpcional(c.valorReclamado)
  if (valorReclamado === undefined) return { ok: false, error: 'El valor reclamado debe ser un número mayor o igual a 0' }
  return { ok: true, valor: { fabricante, piezaReferencia, piezaSerial, valorReclamado } }
}

export function validarRespuesta(cuerpo: unknown): Validado<RespuestaReclamacion> {
  if (!esObjeto(cuerpo) || typeof cuerpo.reclama !== 'boolean') return { ok: false, error: 'Indica si se reclama al fabricante (true o false)' }
  if (!cuerpo.reclama) {
    const motivo = cuerpo.motivo
    if (!(MOTIVOS_NO_RECLAMA as readonly unknown[]).includes(motivo)) {
      return { ok: false, error: `El motivo debe ser uno de: ${MOTIVOS_NO_RECLAMA.join(', ')}` }
    }
    return { ok: true, valor: { reclama: false, motivo: motivo as MotivoNoReclama } }
  }
  const d = datosComunes(cuerpo)
  if (!d.ok) return d
  return { ok: true, valor: { reclama: true, ...d.valor } }
}

/** Reemplazo completo de los cinco datos editables de una ficha abierta o enviada. */
export function validarDatosFicha(cuerpo: unknown): Validado<DatosFicha> {
  if (!esObjeto(cuerpo)) return { ok: false, error: 'Faltan los datos de la reclamación' }
  const d = datosComunes(cuerpo)
  if (!d.ok) return d
  const rma = textoOpcional(cuerpo.rma)
  if (rma === undefined) return { ok: false, error: 'El RMA debe ser texto' }
  return { ok: true, valor: { ...d.valor, rma } }
}

/** Contenido del paso al estado `a`: «enviada» no exige nada; «resuelta» exige resultado y valor recuperado. */
export function validarPaso(a: EstadoReclamacion, cuerpo: unknown): Validado<PasoReclamacion> {
  if (a === 'enviada') return { ok: true, valor: { a: 'enviada' } }
  if (a !== 'resuelta') return { ok: false, error: 'Destino de paso no válido' }
  const c = esObjeto(cuerpo) ? cuerpo : {}
  const resultado = c.resultado
  if (!(RESULTADOS_RECLAMACION as readonly unknown[]).includes(resultado)) {
    return { ok: false, error: `El resultado debe ser uno de: ${RESULTADOS_RECLAMACION.join(', ')}` }
  }
  if (resultado === 'rechazada') {
    if (c.valorRecuperado !== undefined && c.valorRecuperado !== null && c.valorRecuperado !== 0) {
      return { ok: false, error: 'Una reclamación rechazada no recupera valor: déjalo vacío o en 0' }
    }
    return { ok: true, valor: { a: 'resuelta', resultado: 'rechazada', valorRecuperado: 0 } }
  }
  const v = c.valorRecuperado
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) {
    return { ok: false, error: 'El valor recuperado debe ser un número mayor o igual a 0' }
  }
  return { ok: true, valor: { a: 'resuelta', resultado: resultado as ResultadoReclamacion, valorRecuperado: v } }
}

/** Estricto: el día 60 no avisa, el 61 sí (días naturales, S-7). */
export function reclamacionVencida(abiertaEl: DiaCivil, hoy: DiaCivil): boolean {
  return diasEntre(abiertaEl, hoy) > DIAS_AVISO_RECLAMACION
}
