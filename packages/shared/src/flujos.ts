// Registro de flujos (F1B-06, D2 de `design.md`): qué catálogo de transiciones aplica a un ticket,
// según su clasificación y su estado actual. Fichero NUEVO y no al final de `transitions.ts` porque
// necesita importar `CLASIFICACIONES` (`ticketCreate.ts:5`), y un `import` nuevo al PRINCIPIO de
// `transitions.ts` desplazaría sus 334 líneas ya citadas (regla de mutación 4 de `CLAUDE.md`).

import { CLASIFICACIONES } from './ticketCreate'
import { TRANSITIONS, TRANSITIONS_EQUIPO_NUEVO, type Transition } from './transitions'

/** Los dos flujos que puede seguir un ticket. `servicio` es el histórico; `equipo-nuevo` es F1B-06. */
export type Flujo = 'servicio' | 'equipo-nuevo'

/** Datos mínimos de un ticket que el registro necesita para decidir su flujo. */
export interface TicketDeFlujo {
  classification?: string | null
  status: string
}

/** El catálogo de cada flujo, por nombre. Único punto que enumera «todos los catálogos». */
export const CATALOGO_POR_FLUJO: Record<Flujo, readonly Transition[]> = {
  servicio: TRANSITIONS,
  'equipo-nuevo': TRANSITIONS_EQUIPO_NUEVO,
}

/**
 * Tipada contra `CLASIFICACIONES` (`ticketCreate.ts:5`) y no como literal suelto: si ese array
 * cambia el texto exacto, `tsc` rompe aquí en vez de dejar la comparación comparando contra un
 * string que ya no significa lo mismo.
 */
const CLASIFICACION_EQUIPO_NUEVO: (typeof CLASIFICACIONES)[number] = 'Equipo nuevo'

/** trim + colapso de espacios internos + minúsculas — para comparar por IGUALDAD, no por `includes`. */
function normalizar(valor: string): string {
  return valor.trim().replace(/\s+/g, ' ').toLowerCase()
}

/**
 * ¿Esta clasificación (tal como llega, con la mayúscula variable de Zoho — «Equipo Nuevo») es
 * «Equipo nuevo»? Igualdad y no `includes`: «Equipo nuevo usado» NO es equipo nuevo (M6).
 */
export function esClasificacionEquipoNuevo(clasificacion: string | null | undefined): boolean {
  if (!clasificacion) return false
  return normalizar(clasificacion) === normalizar(CLASIFICACION_EQUIPO_NUEVO)
}

/** Los estados que aparecen en el catálogo de equipo nuevo, como `from` o como `to` (los 5, s5). */
const ESTADOS_DEL_CATALOGO_EQUIPO_NUEVO = new Set<string>(
  TRANSITIONS_EQUIPO_NUEVO.flatMap((t) => [...t.from, t.to]),
)

/**
 * El flujo aplicable a un ticket (RQ-EN-04). `equipo-nuevo` SÓLO si la clasificación normaliza a
 * «Equipo nuevo» Y el estado actual pertenece al catálogo EN (M7) — así un ticket heredado en un
 * estado que ese catálogo no cubre (p. ej. `Rev./Diagnostico`) no queda varado (s5): sigue viendo
 * las transiciones de `servicio`.
 */
export function flujoDelTicket(ticket: TicketDeFlujo): Flujo {
  if (esClasificacionEquipoNuevo(ticket.classification) && ESTADOS_DEL_CATALOGO_EQUIPO_NUEVO.has(ticket.status)) {
    return 'equipo-nuevo'
  }
  return 'servicio'
}

/** El catálogo de transiciones que le aplica a un ticket, según `flujoDelTicket`. */
export function catalogoDelTicket(ticket: TicketDeFlujo): readonly Transition[] {
  return CATALOGO_POR_FLUJO[flujoDelTicket(ticket)]
}

/** Las transiciones ejecutables desde el estado actual del ticket, dentro de SU flujo. */
export function transicionesDelTicket(ticket: TicketDeFlujo): Transition[] {
  return catalogoDelTicket(ticket).filter((t) => t.from.includes(ticket.status))
}

/** Busca una transición por id en TODOS los catálogos del registro, no sólo en `TRANSITIONS`. */
export function transicionPorId(id: string): Transition | undefined {
  for (const catalogo of Object.values(CATALOGO_POR_FLUJO)) {
    const encontrada = catalogo.find((t) => t.id === id)
    if (encontrada) return encontrada
  }
  return undefined
}

/** El flujo al que pertenece una transición, por su id — `undefined` si no existe en ningún catálogo. */
export function flujoDeTransicion(id: string): Flujo | undefined {
  for (const [flujo, catalogo] of Object.entries(CATALOGO_POR_FLUJO) as [Flujo, readonly Transition[]][]) {
    if (catalogo.some((t) => t.id === id)) return flujo
  }
  return undefined
}

function nombreFlujo(flujo: Flujo): string {
  return flujo === 'equipo-nuevo' ? 'equipo nuevo' : 'servicio técnico'
}

/**
 * Si la transición `t` NO pertenece al flujo del `ticket`, el mensaje del `409` (RQ-EN-05), nombrando
 * los dos flujos para que se entienda sin explicación adicional (comprobación de persona Persona-3).
 * Si SÍ pertenece, `null`. Una transición que no está en ningún catálogo del registro no puede estar
 * «fuera de flujo» por definición de esta función — ese caso lo rechaza antes el `400` de «transición
 * desconocida» (`ticketService.ts`, guarda A, ajena a este fichero).
 */
export function fueraDeFlujo(t: Transition, ticket: TicketDeFlujo): string | null {
  const flujoDeLaTransicion = flujoDeTransicion(t.id)
  const flujoDelTicketActual = flujoDelTicket(ticket)
  if (flujoDeLaTransicion === undefined || flujoDeLaTransicion === flujoDelTicketActual) return null
  return `La transición "${t.name}" es del flujo de ${nombreFlujo(flujoDeLaTransicion)} y este ticket sigue el flujo de ${nombreFlujo(flujoDelTicketActual)}`
}
