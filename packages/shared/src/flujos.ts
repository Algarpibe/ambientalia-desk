// Registro de flujos (F1B-06, D2 de `design.md`): qué catálogo de transiciones aplica a un ticket,
// según su clasificación y su estado actual. Fichero NUEVO y no al final de `transitions.ts` porque
// necesita importar `CLASIFICACIONES` (`ticketCreate.ts:5`), y un `import` nuevo al PRINCIPIO de
// `transitions.ts` desplazaría sus 334 líneas ya citadas (regla de mutación 4 de `CLAUDE.md`).

import { CLASIFICACIONES } from './ticketCreate'
import { TRANSITIONS, TRANSITIONS_EQUIPO_NUEVO, TRANSITIONS_SOPORTE_REMOTO, type Transition } from './transitions'

/** Los flujos que puede seguir un ticket. `servicio` es el histórico; `equipo-nuevo` y `soporte-remoto` son F1B-06. */
export type Flujo = 'servicio' | 'equipo-nuevo' | 'soporte-remoto'

/** Datos mínimos de un ticket que el registro necesita para decidir su flujo. */
export interface TicketDeFlujo {
  classification?: string | null
  status: string
}

/** El catálogo de cada flujo, por nombre. Único punto que enumera «todos los catálogos». */
export const CATALOGO_POR_FLUJO: Record<Flujo, readonly Transition[]> = {
  servicio: TRANSITIONS,
  'equipo-nuevo': TRANSITIONS_EQUIPO_NUEVO, 'soporte-remoto': TRANSITIONS_SOPORTE_REMOTO,
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
  if (esClasificacionSoporteRemoto(ticket.classification) && ESTADOS_DEL_CATALOGO_SOPORTE_REMOTO.has(ticket.status)) return 'soporte-remoto'; if (esClasificacionEquipoNuevo(ticket.classification) && ESTADOS_DEL_CATALOGO_EQUIPO_NUEVO.has(ticket.status)) {
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
  return NOMBRE_FLUJO[flujo]
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

// ── F1B-06, cambio 2 de 2 (`blueprint-soporte-remoto`): `soporte-remoto`, nacimiento y Modalidad ──────────────
// Todo lo de abajo se declara DESPUÉS de `flujoDelTicket` y sólo se LEE al llamarla: ningún módulo de `shared`
// la invoca al cargar (hipótesis de `design.md` D2, confirmada por el orden de carga de la suite).

/** Como `CLASIFICACION_EQUIPO_NUEVO`: tipada contra `CLASIFICACIONES` para que `tsc` rompa si el texto cambia. */
const CLASIFICACION_SOPORTE_REMOTO: (typeof CLASIFICACIONES)[number] = 'Soporte remoto'

/** ¿Esta clasificación (con la mayúscula variable de Zoho) es «Soporte remoto»? Igualdad, no `includes`. */
export function esClasificacionSoporteRemoto(clasificacion: string | null | undefined): boolean {
  if (!clasificacion) return false
  return normalizar(clasificacion) === normalizar(CLASIFICACION_SOPORTE_REMOTO)
}

/** Los estados que aparecen en el catálogo de soporte remoto, como `from` o como `to` (los 4, RQ-SR-01). */
const ESTADOS_DEL_CATALOGO_SOPORTE_REMOTO = new Set<string>(
  TRANSITIONS_SOPORTE_REMOTO.flatMap((t) => [...t.from, t.to]),
)

/** El nombre humano de cada flujo, para el `409` de la guarda 3. Un cuarto flujo sin nombre rompe `tsc`. */
const NOMBRE_FLUJO: Record<Flujo, string> = {
  servicio: 'servicio técnico',
  'equipo-nuevo': 'equipo nuevo',
  'soporte-remoto': 'soporte remoto',
}

/**
 * El estado en que NACE un ticket según su clasificación (D4, RQ-SR-04). Usa el MISMO predicado que
 * `flujoDelTicket`, así que el nacimiento y el enrutado no pueden divergir (molde H5): un soporte remoto
 * nace en `Solicitud Soporte`, el primero de su catálogo; cualquier otro, en `Ticket creado`.
 */
export function estadoInicialDelAlta(clasificacion: string | null | undefined): string {
  return esClasificacionSoporteRemoto(clasificacion) ? 'Solicitud Soporte' : 'Ticket creado'
}

/** El dominio de Modalidad (S-4, `decision/anexo-43-en-sitio`). Sin `CHECK` en la columna: la lista blanca vive aquí. */
export const MODALIDADES = ['remoto', 'en sitio'] as const
export type Modalidad = (typeof MODALIDADES)[number]

/**
 * La modalidad con que se guarda el alta (D5, RQ-SR-07/08/09). Soporte remoto: ausente (`undefined`) → `remoto`;
 * `remoto`/`en sitio` exactos → ese valor; cualquier otro (incluidos `''`, `null`, `'Remoto'`) → error. Otra
 * clasificación: ausente → `null`; cualquier valor, incluso válido, → error. El error nombra `modalidad`.
 */
export function modalidadDelAlta(
  clasificacion: string | null | undefined,
  valor: string | null | undefined,
): { valor: Modalidad | null } | { error: string } {
  if (esClasificacionSoporteRemoto(clasificacion)) {
    if (valor === undefined) return { valor: 'remoto' }
    const valida = MODALIDADES.find((m) => m === valor)
    if (valida) return { valor: valida }
    return { error: `La modalidad ${JSON.stringify(valor)} no es válida: debe ser «remoto» o «en sitio»` }
  }
  if (valor === undefined) return { valor: null }
  return { error: 'La modalidad sólo aplica a los tickets de soporte remoto' }
}
