import type { Transition } from '@ambientalia/shared'
import { PROMOTED_COLUMNS } from '@ambientalia/zoho-sync/db/rows'

const LABEL_TO_COL = new Map(PROMOTED_COLUMNS.map((p) => [p.label, p]))
const CLOSED_STATUSES = new Set(['Finalizado'])

/**
 * La columna de la derivación. Es una constante del código, no una etiqueta de Zoho: por eso NO está
 * en `PROMOTED_COLUMNS` —ese mapa describe los campos personalizados de Zoho, y publicar ahí un id de
 * usuario lo pintaría crudo en la ficha— y por eso el `SET` que construye `writeTransition` sigue sin
 * poder recibir un nombre de columna que venga de fuera.
 */
const COL_DERIVACION = 'derivado_a'

export interface TransitionPlan {
  status: string
  statusType: string
  columns: Record<string, unknown>
  customFields: Record<string, string | null>
  priority?: string
  comment?: string
  errors: string[]
}

function asBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  const s = String(v).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  return ['true', 'si', 'yes', 'y', '1'].includes(s)
}
function convert(kind: 'text' | 'date' | 'bool' | 'int', raw: unknown): unknown {
  if (kind === 'bool') return asBool(raw)
  if (kind === 'int') { const n = Number(raw); return Number.isNaN(n) ? null : n }
  if (kind === 'date') return String(raw).slice(0, 10)
  return String(raw)
}

export function buildTransitionPlan(t: Transition, values: Record<string, unknown>): TransitionPlan {
  const plan: TransitionPlan = {
    status: t.to, statusType: CLOSED_STATUSES.has(t.to) ? 'Closed' : 'Open',
    columns: {}, customFields: {}, errors: [],
  }
  for (const f of t.fields) {
    const raw = values[f.key]
    const empty = raw === undefined || raw === null || raw === ''

    if (f.target === 'comment') { if (!empty) plan.comment = String(raw); continue }

    /*
     * La derivación va a SU columna, y va antes del `if (empty) continue` de abajo porque necesita
     * distinguir dos silencios que ningún otro campo distingue:
     *
     * - la clave NO llega  ⇒ no se toca lo que hubiera. Una transición ejecutada desde una pantalla
     *   que no ofrezca la casilla no puede des-derivar el ticket de rebote.
     * - la clave llega VACÍA ⇒ se borra. Es la única forma de quitarle el responsable a un ticket.
     *
     * Con el `continue` genérico, lo segundo sería imposible y vaciar la casilla no haría nada.
     */
    if (f.target === 'derivacion') {
      if (raw !== undefined) plan.columns[COL_DERIVACION] = empty ? null : String(raw)
      continue
    }

    if (f.kind === 'checkbox') {
      const col = LABEL_TO_COL.get(f.key)
      if (col) plan.columns[col.col as string] = asBool(raw)
      else plan.customFields[f.key] = asBool(raw) ? 'true' : 'false'
      continue
    }

    if (f.required && empty) { plan.errors.push(`Falta el campo obligatorio: ${f.label}`); continue }
    if (empty) continue

    if (f.target === 'priority') { plan.priority = String(raw); continue }

    const col = LABEL_TO_COL.get(f.key)
    if (col) plan.columns[col.col as string] = convert(col.kind, raw)
    else plan.customFields[f.key] = String(raw)
  }

  // Sin guarda para el comentario: el campo se salta el chequeo genérico de obligatorios —se procesa
  // arriba con su propio `continue`—, así que tenía la suya aparte. Ya no puede declararse obligatorio
  // (`comment()` no admite parámetro), y una guarda que nunca salta es una que nadie mantiene.
  return plan
}
