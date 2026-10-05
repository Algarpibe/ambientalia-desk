import { ESTADOS, type Estado } from './estados'
import { esClasificacionSoporteRemoto } from './flujos'
import { PREFIJO_TICKET_APP, STATUS_OV_ASIGNADA, STATUS_TICKET_CREADO } from './transitions'

/**
 * migracion-tickets-abiertos (F1F-01) · el núcleo puro de la migración de los tickets abiertos de Zoho Desk:
 * tabla de equivalencias (RQ-TC-40), plan por ticket y resumen para el informe (RQ-TC-41).
 *
 * Sin base de datos, sin reloj y sin red: la lectura, la vigencia de la remisión y la escritura son del ejecutor
 * (`apps/desk/server/db`). Consume `ESTADOS` y `esClasificacionSoporteRemoto`; no reescribe ninguno (regla invariable 13).
 */

/** El marcador que el ejecutor deja en `ticket_transitions`; el procedimiento de reversión lo filtra por este id. */
export const ID_TRANSICION_MIGRACION = 'migracion_f1f01_abiertos'
export const NOMBRE_TRANSICION_MIGRACION = 'Migración de ticket abierto de Zoho (F1F-01)'
export const ACTOR_MIGRACION = 'Migración F1F-01'

export type ReglaEquivalencia = 'identidad' | 'entregado-a-finalizado' | 'pendiente-servicio-a-en-proceso' | 'pendiente-soporte-se-conserva'

export interface Equivalencia {
  destino: Estado
  regla: ReglaEquivalencia
  /** `null` = el `status_type` no se cambia. */
  statusTypeDestino: string | null
}

const ESTADOS_DE_LA_APP: ReadonlySet<string> = new Set<string>(ESTADOS)

/** `null` = sin equivalencia. «Pendiente» y «Entregado» se deciden ANTES que la identidad (D-9: igualdad exacta). */
export function equivalenciaDeEstado(estadoZoho: string, clasificacion: string | null): Equivalencia | null {
  if (estadoZoho === 'Pendiente') {
    return esClasificacionSoporteRemoto(clasificacion)
      ? { destino: 'Pendiente', regla: 'pendiente-soporte-se-conserva', statusTypeDestino: null }
      : { destino: 'En Proceso', regla: 'pendiente-servicio-a-en-proceso', statusTypeDestino: 'Open' }
  }
  if (estadoZoho === 'Entregado') return { destino: 'Finalizado', regla: 'entregado-a-finalizado', statusTypeDestino: 'Closed' }
  if (ESTADOS_DE_LA_APP.has(estadoZoho)) return { destino: estadoZoho as Estado, regla: 'identidad', statusTypeDestino: null }
  return null
}

export interface TicketParaMigrar {
  id: string
  number: number
  status: string
  statusType: string | null
  classification: string | null
  managedByApp: boolean
  createdTime: string | null
}

export type AccionMigracion = 'migrar' | 'ya-gobernado' | 'tras-el-corte' | 'sin-equivalencia'

export interface PlanTicket {
  ticket: TicketParaMigrar
  accion: AccionMigracion
  equivalencia: Equivalencia | null
}

/** Precedencia fija (D-8): ya-gobernado → tras-el-corte → sin-equivalencia → migrar. `created_time` nulo cuenta como anterior al corte. */
export function planDeTicket(t: TicketParaMigrar, corte: Date): PlanTicket {
  if (Number.isNaN(corte.getTime())) throw new RangeError('La fecha de corte no es una fecha válida')
  const equivalencia = equivalenciaDeEstado(t.status, t.classification)
  let accion: AccionMigracion
  if (t.managedByApp) accion = 'ya-gobernado'
  else if (t.createdTime !== null && new Date(t.createdTime).getTime() > corte.getTime()) accion = 'tras-el-corte'
  else if (equivalencia === null) accion = 'sin-equivalencia'
  else accion = 'migrar'
  return { ticket: t, accion, equivalencia }
}

/** ¿El estado destino espera remisión de entrada? (S-6: «OV asignada» y «Ticket creado»). La vigencia la decide el ejecutor. */
export function esperaRemisionDeEntrada(estado: string): boolean {
  return estado === STATUS_OV_ASIGNADA || estado === STATUS_TICKET_CREADO
}

export interface ResumenMigracion {
  abiertos: number
  migrables: number
  porEstado: { origen: string; destino: string; regla: ReglaEquivalencia; cambiaEstado: boolean; tickets: number }[]
  sinEquivalencia: { estado: string; tickets: number; numeros: number[] }[]
  yaGobernados: { nacidosEnLaApp: number; deZoho: number }
  trasElCorte: { numero: number; estado: string; creado: string | null }[]
  pendientes: { numero: number; clasificacion: string | null; destino: string }[]
  /** El número más alto entre los que se marcarían; `null` si ninguno. */
  masAltoAMarcar: number | null
}

/** Agrega los planes. `numeracion.arrastra` y `base` no están aquí: `APP_TICKET_NUMBER_BASE` es de `zoho-sync`. */
export function resumenDeMigracion(planes: readonly PlanTicket[]): ResumenMigracion {
  const r: ResumenMigracion = {
    abiertos: planes.length, migrables: 0, porEstado: [], sinEquivalencia: [],
    yaGobernados: { nacidosEnLaApp: 0, deZoho: 0 }, trasElCorte: [], pendientes: [], masAltoAMarcar: null,
  }
  for (const { ticket: t, accion, equivalencia: eq } of planes) {
    if (accion === 'ya-gobernado') {
      if (t.id.startsWith(PREFIJO_TICKET_APP)) r.yaGobernados.nacidosEnLaApp++
      else r.yaGobernados.deZoho++
    } else if (accion === 'tras-el-corte') {
      r.trasElCorte.push({ numero: t.number, estado: t.status, creado: t.createdTime })
    } else if (accion === 'sin-equivalencia') {
      const g = r.sinEquivalencia.find((x) => x.estado === t.status)
      if (g) { g.tickets++; g.numeros.push(t.number) } else r.sinEquivalencia.push({ estado: t.status, tickets: 1, numeros: [t.number] })
    } else if (eq) {
      r.migrables++
      r.masAltoAMarcar = r.masAltoAMarcar === null ? t.number : Math.max(r.masAltoAMarcar, t.number)
      const par = r.porEstado.find((x) => x.origen === t.status && x.destino === eq.destino)
      if (par) par.tickets++
      else r.porEstado.push({ origen: t.status, destino: eq.destino, regla: eq.regla, cambiaEstado: eq.destino !== t.status, tickets: 1 })
      if (t.status === 'Pendiente') r.pendientes.push({ numero: t.number, clasificacion: t.classification, destino: eq.destino })
    }
  }
  return r
}
