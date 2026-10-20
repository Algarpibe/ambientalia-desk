import type { DiaCivil } from './calendarioLaboral'
import { type Cargo } from './cargos'
import {
  CLAVE_GAS_CC, CLAVE_MOTIVO_FIRMA_ADMIN, CLAVE_MOTIVO_RECHAZO_CC, ID_APROBACION_CC, ID_ENVIO_CC, ID_RECHAZO_CC, IDS_FIRMA_CC,
} from './camposControlCalidad'
import { tienePatronVigente, type GasPatronLeido } from './gasPatron'
import { tipoEventoDeTransicion } from './tipoEvento'

/**
 * control-calidad-liberacion (F1C-07, D2): regla pura de quién firma el control de calidad, qué contenido exige la firma,
 * la prioridad tras el rechazo, el conteo de retrabajos y la visibilidad según el interruptor. Sin reloj, sin base de
 * datos: la lee igual el servidor (que la impone) y el cliente (que sólo la pinta, regla invariable 13).
 */
export interface UsuarioParaFirma { id: string; name: string; isAdmin: boolean; cargoPermiso: Cargo | null }
export interface FilaDeTraza { transitionId: string | null; performedBy: string | null; performedById: string | null }
export interface ContextoFirma { usuariosActivos: readonly UsuarioParaFirma[]; derivadoA: string | null; traza: readonly FilaDeTraza[] }
export type CausaSinFirma = 'no_habilitado' | 'intervino' | 'habilitado_libre'
export type VeredictoFirma = { puede: true; via: 'habilitado' | 'administrador' } | { puede: false; causa: CausaSinFirma; cargos: readonly Cargo[] }

const CARGOS_COORDINADOR: readonly Cargo[] = ['Coordinador Técnico']
const CARGOS_VACANTE: readonly Cargo[] = ['Director Técnico', 'Especialista técnico']

export function esFirmaControlCalidad(transitionId: string): boolean {
  return IDS_FIRMA_CC.has(transitionId)
}

/** Con algún Coordinador Técnico ACTIVO, sólo él; vacante, el Director Técnico y el Especialista técnico (RQ-PM-33). */
export function cargosHabilitados(usuarios: readonly UsuarioParaFirma[]): readonly Cargo[] {
  return usuarios.some((x) => x.cargoPermiso === 'Coordinador Técnico') ? CARGOS_COORDINADOR : CARGOS_VACANTE
}

const habilitados = (usuarios: readonly UsuarioParaFirma[]): UsuarioParaFirma[] => {
  const cargos = cargosHabilitados(usuarios)
  return usuarios.filter((x) => x.cargoPermiso !== null && cargos.includes(x.cargoPermiso))
}

/** Asignado (`derivado_a`, por id) o autor de una fila Operativa: por id si la fila lo trae, si no por nombre exacto (S-5). */
export function intervino(p: Pick<UsuarioParaFirma, 'id' | 'name'>, ctx: Pick<ContextoFirma, 'derivadoA' | 'traza'>): boolean {
  if (ctx.derivadoA !== null && p.id === ctx.derivadoA) return true
  return ctx.traza.some((f) => {
    if (tipoEventoDeTransicion(f.transitionId) !== 'Operativo') return false
    return f.performedById !== null ? f.performedById === p.id : f.performedBy === p.name
  })
}

/** ¿Queda algún habilitado activo que no haya intervenido? */
export function quedaHabilitadoLibre(ctx: ContextoFirma): boolean {
  return habilitados(ctx.usuariosActivos).some((h) => !intervino(h, ctx))
}

export function veredictoFirma(s: Pick<UsuarioParaFirma, 'id' | 'name' | 'isAdmin'>, ctx: ContextoFirma): VeredictoFirma {
  const cargos = cargosHabilitados(ctx.usuariosActivos)
  if (habilitados(ctx.usuariosActivos).some((h) => h.id === s.id)) {
    return intervino(s, ctx) ? { puede: false, causa: 'intervino', cargos } : { puede: true, via: 'habilitado' }
  }
  if (s.isAdmin) {
    if (intervino(s, ctx)) return { puede: false, causa: 'intervino', cargos }
    return quedaHabilitadoLibre(ctx) ? { puede: false, causa: 'habilitado_libre', cargos } : { puede: true, via: 'administrador' }
  }
  return { puede: false, causa: 'no_habilitado', cargos }
}

/** El texto del `403` de firmante: nombra la transición y distingue la causa. */
export function mensajeSinFirma(nombreTransicion: string, v: Extract<VeredictoFirma, { puede: false }>): string {
  if (v.causa === 'intervino') return `No puedes firmar "${nombreTransicion}": intervinieron en el trabajo de este ticket y la firma es de alguien que no lo hizo`
  if (v.causa === 'habilitado_libre') return `No puedes firmar "${nombreTransicion}" como administrador: queda un habilitado que no intervino y le corresponde a él`
  return `No puedes firmar "${nombreTransicion}": la firma es de ${v.cargos.join(' o ')}`
}

/** La casilla del gas se exige en la aprobación cuando el compuesto del equipo tiene patrón vigente (RQ-TS-48). */
export function exigeGasPatron(transitionId: string, compuestoEquipo: string | null, gases: readonly GasPatronLeido[], hoy: DiaCivil): boolean {
  return transitionId === ID_APROBACION_CC && tienePatronVigente(compuestoEquipo, gases, hoy)
}

const sinMarcar = (v: unknown): boolean => v !== true
const enBlanco = (v: unknown): boolean => typeof v !== 'string' || v.trim() === ''

/** Errores de contenido de las dos de firma (escalón C, RQ-TS-48). Un motivo ausente en el rechazo lo da el obligatorio de `transitionExec.ts`. */
export function erroresContenidoControlCalidad(e: { transitionId: string; values: Record<string, unknown>; via: 'habilitado' | 'administrador' | null; gasExigido: boolean }): string[] {
  const errores: string[] = []
  if (e.transitionId === ID_APROBACION_CC) {
    if (e.gasExigido && sinMarcar(e.values[CLAVE_GAS_CC])) errores.push(`Marca "${CLAVE_GAS_CC}": el compuesto del equipo tiene gas patrón vigente`)
    if (e.via === 'administrador' && enBlanco(e.values[CLAVE_MOTIVO_FIRMA_ADMIN])) errores.push(`"${CLAVE_MOTIVO_FIRMA_ADMIN}" es obligatorio cuando firma un administrador`)
  } else if (e.transitionId === ID_RECHAZO_CC) {
    const m = e.values[CLAVE_MOTIVO_RECHAZO_CC]
    if (typeof m === 'string' && m.length > 0 && m.trim() === '') errores.push(`"${CLAVE_MOTIVO_RECHAZO_CC}" no puede estar en blanco`)
  }
  return errores
}

/** El rechazo sube a `High` salvo que ya sea `Urgent` (S-10); fuera del rechazo, `null`. */
export function prioridadTrasRechazo(transitionId: string, actual: string | null): 'High' | null {
  if (transitionId !== ID_RECHAZO_CC || actual === 'Urgent') return null
  return 'High'
}

/** Retrabajos = filas de rechazo (RQ-TZ-24). */
export function contarRetrabajos(traza: readonly { transitionId?: string | null }[]): number {
  return traza.filter((f) => f.transitionId === ID_RECHAZO_CC).length
}

/** Por qué el interruptor quita la transición del panel; `null` si se queda. `visibleConControlCalidad` = (… === null). */
export function motivoQuitadaPorInterruptor(transitionId: string, activo: boolean): string | null {
  if (transitionId === ID_ENVIO_CC && !activo) return 'El envío a control de calidad está apagado'
  if (transitionId === 'finalizacion_servicio' && activo) return 'Con control de calidad encendido, el servicio se envía a control de calidad'
  return null
}

export function visibleConControlCalidad(transitionId: string, activo: boolean): boolean {
  return motivoQuitadaPorInterruptor(transitionId, activo) === null
}

// Las claves y etiquetas del acto las leen el servidor y el cliente por aquí (F1C-07, lote 2b): una sola puerta, sin tocar `index.ts`.
export * from './camposControlCalidad'
