import type { Ticket } from '@ambientalia/shared'
import { ESTADOS_EN_ESPERA } from '@ambientalia/shared'

export interface BoardViewDef { key: string; label: string }

// Fuente de verdad de las vistas funcionales (orden = el de la imagen del Sidebar).
export const FUNCTIONAL_VIEWS = [
  { key: 'todos', label: 'Todos los Tickets' },
  { key: 'abiertos', label: 'Tickets abiertos' },
  { key: 'cerrados', label: 'Tickets cerrados' },
  { key: 'espera', label: 'Tickets en espera' },
  { key: 'vencidos', label: 'Tickets vencidos' },
  // Reutiliza la etiqueta que el Sidebar ya tenía como ítem decorativo: no aparece nada nuevo en el
  // menú, se enciende lo que ya estaba.
  { key: 'mios', label: 'Mis Tickets' },
] as const satisfies readonly BoardViewDef[]

/** Las claves de vista funcional, derivadas del catálogo — no hay una segunda lista que mantener. */
export type VistaKey = typeof FUNCTIONAL_VIEWS[number]['key']

// label -> key, para que el Sidebar sepa qué ítems son funcionales.
export const FUNCTIONAL_BY_LABEL: Record<string, VistaKey> =
  Object.fromEntries(FUNCTIONAL_VIEWS.map((v) => [v.label, v.key]))

export function viewLabel(key: VistaKey): string {
  return FUNCTIONAL_VIEWS.find((v) => v.key === key)?.label ?? 'Vista no reconocida'
}

/**
 * El filtro de la vista elegida. `userId` solo lo usa «Mis Tickets» y por eso es opcional: las demás
 * llamadas siguen igual.
 *
 * ⚠️ Esto es un filtro de VISTA y vive en el cliente a propósito. El servidor devuelve todos los
 * tickets a todo el mundo, y así tiene que seguir: `docs/modelo-autorizacion.md` decidió que no hay
 * propiedad por ticket ni segmentación de visibilidad —el equipo se cubre entre sí—. La derivación
 * dice de quién es el trabajo, no quién puede verlo.
 */
export function applyBoardView(tickets: Ticket[], key: VistaKey, now: Date, userId?: string): Ticket[] {
  const enEspera = (t: Ticket) => (ESTADOS_EN_ESPERA as readonly string[]).includes(t.status ?? '')
  switch (key) {
    case 'cerrados': return tickets.filter((t) => t.statusType === 'Closed')
    // Sin usuario devuelve VACÍO, no todo: enseñar el tablero entero bajo el rótulo «Mis Tickets»
    // haría creer que todo eso es suyo, que es la peor de las dos mentiras posibles.
    case 'mios': return userId
      ? tickets.filter((t) => t.statusType !== 'Closed' && t.derivado?.id === userId)
      : []
    case 'abiertos': return tickets.filter((t) => t.statusType !== 'Closed' && !enEspera(t))
    case 'espera': return tickets.filter((t) => t.statusType !== 'Closed' && enEspera(t))
    case 'vencidos': return tickets.filter((t) => {
      if (t.statusType === 'Closed' || !t.dueDate) return false
      const d = new Date(t.dueDate); return !isNaN(d.getTime()) && d.getTime() < now.getTime()
    })
    case 'todos': return tickets
    default: return vistaNoReconocida(key)
  }
}

/** Si `tsc` se queja aquí, alguien añadió una vista a `FUNCTIONAL_VIEWS` y olvidó su `case`. */
function vistaNoReconocida(_key: never): Ticket[] { void _key; return [] }
