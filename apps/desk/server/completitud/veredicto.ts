/**
 * verificacion-completitud (1G-03, D11, RQ-ZS-38) · el veredicto. UNA sola precedencia, para cada entidad, para las dos partes de adjuntos y
 * para el global: sin comparar > incompleto > rojo > verde. El global no tiene «sin comparar»: en su lugar es «incompleto».
 */
export type Estado = 'verde' | 'rojo' | 'incompleto' | 'sin comparar'
export interface CorteVerificacion { fase: 'A' | 'B'; numero: number | null }

const PRECEDENCIA: Estado[] = ['sin comparar', 'incompleto', 'rojo', 'verde']

export const peorEstado = (estados: Estado[]): Estado => PRECEDENCIA.find((e) => estados.includes(e)) ?? 'verde'

/** «Sin comparar» si falló su fuente; «incompleto» si tiene errores o su cobertura no es completa; «rojo» si hay algún «sin explicar». */
export function veredictoEntidad(e: { sinComparar: boolean; errores: number; completa: boolean; sinExplicar: number }): Estado {
  return peorEstado([e.sinComparar ? 'sin comparar' : 'verde', e.errores > 0 || !e.completa ? 'incompleto' : 'verde', e.sinExplicar > 0 ? 'rojo' : 'verde'])
}

export function veredictoGlobal(estados: Estado[], g: { completa: boolean; cortadoEn: CorteVerificacion | null; escriturasRechazadas: number }): Exclude<Estado, 'sin comparar'> {
  if (estados.some((e) => e === 'sin comparar' || e === 'incompleto') || !g.completa || g.cortadoEn !== null || g.escriturasRechazadas > 0) return 'incompleto'
  return estados.includes('rojo') ? 'rojo' : 'verde'
}
