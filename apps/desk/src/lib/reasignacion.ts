import { etiquetaPersona, reasignacionDelCuerpo, type PersonaLite } from '@ambientalia/shared'
import type { OpcionPersona } from './personas'

/**
 * Las opciones del desplegable del panel «Reasignar» (F1B-05, RQ-TC-52).
 *
 * No ofrece a la persona a cargo actual (el servidor responde 422 «ya está a cargo de esa persona») ni «Sin derivar» (por
 * esta vía no se puede vaciar: 422 de destino obligatorio). Las personas llegan ya filtradas a activas desde `/api/personas`;
 * esto es comodidad, la guarda es el servidor (regla invariable 13).
 */
export function opcionesReasignacion(activas: PersonaLite[], actualId: string | null): OpcionPersona[] {
  return activas.filter((p) => p.id !== actualId).map((p) => ({ valor: p.id, etiqueta: etiquetaPersona(p) }))
}

/**
 * ¿Se habilita el botón de enviar? Es EL MISMO validador de `shared` que usa la ruta (`reasignacionDelCuerpo`): no se
 * reescribe ninguna regla del motivo ni del destino, sólo se pregunta si pasaría.
 */
export function puedeEnviarReasignacion(destino: string, motivo: string, actualId: string | null): boolean {
  return reasignacionDelCuerpo({ destino, motivo }, actualId).ok
}
