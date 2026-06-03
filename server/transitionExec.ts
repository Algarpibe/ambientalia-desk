import type { Transition } from '../shared/transitions'
import { cfApiName } from './cfApiNames'

export interface BuiltTransition {
  status: string
  cf: Record<string, unknown>
  priority?: string
  classification?: string
  comment?: string
  errors: string[]
}

/** Construye el cuerpo de updateTicket + comentario para una transición, validando obligatorios. */
export function buildTransitionUpdate(t: Transition, values: Record<string, unknown>): BuiltTransition {
  const out: BuiltTransition = { status: t.to, cf: {}, errors: [] }

  for (const f of t.fields) {
    const raw = values[f.key]
    const empty = raw === undefined || raw === null || raw === ''

    if (f.target === 'comment') {
      if (!empty) out.comment = String(raw)
      continue
    }
    if (f.kind === 'checkbox') {
      // los checkbox siempre se envían (false si no marcado); no aplican obligatoriedad por vacío
      out.cf[cfApiName(f.key) ?? f.key] = Boolean(raw)
      continue
    }
    if (f.required && empty) {
      out.errors.push(`Falta el campo obligatorio: ${f.label}`)
      continue
    }
    if (empty) continue
    if (f.target === 'priority') { out.priority = String(raw); continue }
    if (f.target === 'classification') { out.classification = String(raw); continue }
    const api = cfApiName(f.key)
    if (!api) { out.errors.push(`Sin api-name configurado para: ${f.label}`); continue }
    out.cf[api] = f.kind === 'number' ? Number(raw) : String(raw)
  }

  const commentField = t.fields.find((f) => f.target === 'comment')
  if (commentField?.required && !out.comment) out.errors.push('Falta el comentario')
  return out
}
