export const PREFIJOS = ['MT', 'CG', 'HV', 'SR', 'PRO'] as const
// 'Reparación' viene del formulario de remisiones: al heredar la remisión el tipo de servicio del
// ticket, ambas listas se unifican aquí; 'Protocolo' es de donde se deduce PRO (RQ-TC-61). Van tras 'Mantenimiento', comodines al final.
export const TIPOS_SERVICIO = ['Calibración', 'Diagnóstico', 'Garantía', 'Mantenimiento', 'Reparación', 'Protocolo', 'No aplica', 'Otro'] as const
export const CLASIFICACIONES = ['Equipo para servicio de mantenimiento', 'Equipo nuevo', 'Soporte remoto'] as const
import { diaEnZona } from './fechasDerivadas'; import { esClasificacionEquipoNuevo, esClasificacionSoporteRemoto } from './flujos'
function yymmdd(d: unknown): string {
  const dia = diaEnZona(d) ?? ''
  return dia.slice(2).replace(/-/g, '')
}

export function buildCodigoServicio(input: { prefijo: string; serie: string; modelo: string; fecha: Date | string | null }): string {
  return [input.prefijo, input.serie, input.modelo, yymmdd(input.fecha)].filter((p) => p != null && p !== '').join('_')
}

export function buildSubject(input: { cliente: string; tipoEquipo: string; codigo: string }): string {
  return `Servicio Técnico ${input.cliente} ${input.tipoEquipo} ${input.codigo}`.replace(/\s+/g, ' ').trim()
}

// Retirada (RQ-TC-61, S-3): aquí vivía `parseCodigoFromPotential`, que leía el prefijo del nombre de la oportunidad
// de CRM. Con el prefijo deducido de la clasificación y el tipo ya no tenía lector, y la oportunidad no manda sobre él.
// Dejaba un código de otra época colarse en el formulario. Sus cinco líneas siguen en la revisión `968bb53`
// (`git show 968bb53:packages/shared/src/ticketCreate.ts`); se sustituyen por este comentario para que
// `extractServiceCode` y `prefijoDeducido` conserven su número de línea.

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

/** RQ-TC-61: la clasificación (mismos predicados que el grafo) y luego el tipo; nunca lanza. */
export function prefijoDeducido(clasificacion: string | null | undefined, tipoServicio: string | null | undefined): (typeof PREFIJOS)[number] {
  return esClasificacionEquipoNuevo(clasificacion) ? 'HV' : esClasificacionSoporteRemoto(clasificacion) ? 'SR' : tipoServicio === TIPO_CALIBRACION ? 'CG' : tipoServicio === TIPO_PROTOCOLO ? 'PRO' : 'MT'
}
// Tipadas contra TIPOS_SERVICIO: si el texto sale de la lista, rompe tsc (DD-5); se leen sólo al llamar.
export const TIPO_CALIBRACION: (typeof TIPOS_SERVICIO)[number] = 'Calibración'
const TIPO_PROTOCOLO: (typeof TIPOS_SERVICIO)[number] = 'Protocolo'
