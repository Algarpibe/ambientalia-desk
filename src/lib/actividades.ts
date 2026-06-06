const ESTADOS: Record<string, string> = {
  'not started': 'No iniciada',
  'in progress': 'En proceso',
  'waiting on someone else': 'En espera',
  waiting: 'En espera',
  deferred: 'Aplazada',
  completed: 'Completada',
}
export function traducirEstado(s: string | null): string {
  if (!s) return '—'
  return ESTADOS[s.trim().toLowerCase()] ?? s
}

const PRIORIDADES: Record<string, string> = { highest: 'Muy alta', high: 'Alta', normal: 'Normal', low: 'Baja', lowest: 'Muy baja' }
export function traducirPrioridad(p: string | null): string {
  if (!p) return ''
  return PRIORIDADES[p.trim().toLowerCase()] ?? p
}

export function estadoBadgeClass(status: string | null, statusType: string | null): string {
  const t = (status ?? '').toLowerCase()
  if (statusType === 'Closed' || t.includes('complet')) return 'bg-green-50 text-green-600 border-green-200'
  if (t.includes('progress') || t.includes('proceso')) return 'bg-blue-50 text-blue-600 border-blue-200'
  if (t.includes('wait') || t.includes('espera')) return 'bg-amber-50 text-amber-600 border-amber-200'
  return 'bg-slate-50 text-slate-500 border-slate-200'
}
