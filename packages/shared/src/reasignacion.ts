// Reasignar la persona a cargo sin cambiar de estado (F1B-05, RQ-TC-50, RQ-PM-27, RQ-TC-52). Dominio puro, apto para
// navegador: el servidor y el cliente CONSUMEN este módulo, nunca lo reescriben (regla invariable 13).

import { areasSiguientes } from './transitions'
import { catalogoDelTicket, type TicketDeFlujo } from './flujos'
import type { SujetoDePermiso } from './cargos'

/** Los textos de error de la ruta, en un solo sitio: las pruebas los comparan contra esta constante, no contra literales. */
export const MENSAJES_REASIGNACION = {
  permiso: 'No tienes permiso para reasignar este ticket',
  motivo: 'El motivo es obligatorio',
  destino: 'Falta la persona a la que se reasigna',
  mismo: 'El ticket ya está a cargo de esa persona',
  inexistente: 'La persona elegida no existe o está inactiva',
  carrera: 'La persona a cargo cambió mientras reasignabas: recarga el ticket y vuelve a decidir',
}

/**
 * ¿Puede este sujeto reasignar el ticket? Pasa el administrador, o quien tiene el área de alguna transición que SALE del
 * estado actual dentro del catálogo de SU flujo (`areasSiguientes`): la misma ruta que decide quién actúa sobre el ticket.
 * Un estado sin salida («Finalizado») no da área a nadie, así que sólo pasa el administrador (S-2). El cargo no cuenta
 * (S-3) y no hace falta ser la persona a cargo. Un sujeto ausente falla cerrado.
 */
export function puedeReasignar(s: Pick<SujetoDePermiso, 'areas' | 'isAdmin'>, ticket: TicketDeFlujo): boolean {
  if (!s) return false
  return s.isAdmin || areasSiguientes(ticket.status, catalogoDelTicket(ticket)).some((a) => s.areas.includes(a))
}

export type CuerpoReasignacion = { ok: true; destino: string; motivo: string } | { ok: false; error: string }

/** Lo que no es cadena vale vacío; el resto se recorta. */
const textoRecortado = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

/**
 * Valida el cuerpo HTTP y devuelve UN solo error, el primero en el orden motivo, destino ausente, destino igual al actual
 * (RQ-TC-50: con un solo error el orden es observable y mutable; molde de `cargoPermisoDelCuerpo`). El destino recortado se
 * compara con `actual ?? ''`. La existencia del destino no es de este módulo: necesita la base.
 */
export function reasignacionDelCuerpo(v: unknown, actual: string | null): CuerpoReasignacion {
  const cuerpo = typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
  const motivo = textoRecortado(cuerpo.motivo)
  const destino = textoRecortado(cuerpo.destino)
  if (motivo === '') return { ok: false, error: MENSAJES_REASIGNACION.motivo }
  if (destino === '') return { ok: false, error: MENSAJES_REASIGNACION.destino }
  if (destino === (actual ?? '')) return { ok: false, error: MENSAJES_REASIGNACION.mismo }
  return { ok: true, destino, motivo }
}
