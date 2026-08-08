export const PREFIJOS = ['MT', 'CG', 'HV', 'SR', 'PRO'] as const
// 'Reparación' viene del formulario de remisiones: al heredar la remisión el tipo de servicio del
// ticket, ambas listas se unifican aquí. Va tras 'Mantenimiento' para dejar los comodines al final.
export const TIPOS_SERVICIO = ['Calibración', 'Diagnóstico', 'Garantía', 'Mantenimiento', 'Reparación', 'No aplica', 'Otro'] as const
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

/**
 * Extrae el código de servicio y su serial de un texto (p.ej. el asunto del ticket). Fecha opcional.
 *
 * Tolera **espacios pegados a los guiones bajos** (`HV_ S2X9CPH3_APNA-370`, `CG_18A18102 _EDM180C`).
 * No es una concesión teórica: un lote entero del histórico de Zoho viene así, y el patrón anterior
 * —que usaba `[^_\s]+` a secas— los rechazaba en silencio. Esos tickets se quedaban sin serial y por
 * tanto sin poder enlazarse nunca con su equipo, sin que nada lo delatara.
 *
 * El código se **reconstruye desde los grupos** en vez de devolver la coincidencia entera (`m[0]`):
 * si no, arrastraría los espacios del asunto y `MT_ 18A19042 _EDM180C` quedaría guardado como un
 * dato distinto de `MT_18A19042_EDM180C`, que es el mismo código escrito de otra forma.
 */
export function extractServiceCode(text: string | null | undefined): { serial: string; codigo: string } | null {
  if (!text) return null
  const m = text.match(/\b(MT|CG|HV|SR|PRO)_\s*([^_\s]+)\s*_\s*([^_\s]+)(?:\s*_\s*(\d{6})\b)?/)
  if (!m) return null
  const partes = [m[1], m[2], m[3], m[4]].filter((p): p is string => p != null && p !== '')
  return { serial: m[2], codigo: partes.join('_') }
}

/** El prefijo del Código Servicio se deriva del Tipo de Servicio (editable). Calibración → CG; el resto → MT. */
export function defaultPrefijoFor(tipoServicio: string): string {
  return tipoServicio === 'Calibración' ? 'CG' : 'MT'
}
