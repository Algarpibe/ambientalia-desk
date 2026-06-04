export const PREFIJOS = ['MT', 'CG', 'HV', 'SR', 'PRO'] as const
export const TIPOS_SERVICIO = ['Calibración', 'Diagnóstico', 'Garantía', 'Mantenimiento', 'No aplica', 'Otro'] as const
export const CLASIFICACIONES = ['Equipo para servicio de mantenimiento', 'Equipo nuevo', 'Soporte remoto'] as const

function yymmdd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getFullYear() % 100)}${p(d.getMonth() + 1)}${p(d.getDate())}`
}

export function buildCodigoServicio(input: { prefijo: string; serie: string; modelo: string; fecha: Date }): string {
  return [input.prefijo, input.serie, input.modelo, yymmdd(input.fecha)].filter((p) => p != null && p !== '').join('_')
}

export function buildSubject(input: { cliente: string; tipoEquipo: string; codigo: string }): string {
  return `Servicio Técnico ${input.cliente} ${input.tipoEquipo} ${input.codigo}`.replace(/\s+/g, ' ').trim()
}

export function parseCodigoFromPotential(potentialName: string | null | undefined): { prefijo: string; serie: string; modelo: string } | null {
  if (!potentialName) return null
  const m = potentialName.match(/\b(MT|CG|HV|SR|PRO)_([^_\s]+)_([^_\s]+)_(\d{6})\b/)
  return m ? { prefijo: m[1], serie: m[2], modelo: m[3] } : null
}

/** El prefijo del Código Servicio se deriva del Tipo de Servicio (editable). Calibración → CG; el resto → MT. */
export function defaultPrefijoFor(tipoServicio: string): string {
  return tipoServicio === 'Calibración' ? 'CG' : 'MT'
}
