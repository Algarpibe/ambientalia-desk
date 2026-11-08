import type { Entidad, EntradaConocida, ListaConocidas } from './conocidas'

/**
 * verificacion-completitud (1G-03, D3, RQ-ZS-34) · clasificación pura de una diferencia: por id, luego por herencia del padre, luego por regla,
 * y si no «sin explicar». Lo concreto gana: con las reglas primero, una regla taparía la causa escrita para un caso y dejaría su entrada sin uso.
 * Las reglas sólo explican «falta en Zoho»; lo demás sólo lo explica un id. Un hueco de lista no es diferencia: no tiene clase.
 */
export type Lado = 'faltaEnDesk' | 'faltaEnZoho' | 'otroTamano' | 'volumen' | 'huecoDeLista'
export interface Clasificacion { clase: 'conocida' | 'sin explicar'; causa?: string; entrada?: string; heredadaDe?: string; indice?: number }
/** El padre que ya es diferencia (el motor sólo lo pasa si lo es), con la etiqueta que se anota en `heredadaDe`. Primero el más cercano. */
export interface Padre { etiqueta: string; lado: Lado; clasificacion: Clasificacion }
export interface FilaDiferencia {
  entidad: Entidad; lado: Lado; id: string; numero?: number
  fuente?: string | null; managedByApp?: boolean; ausenteEnZoho?: boolean; padres?: Padre[]
}

const SIN_EXPLICAR: Clasificacion = { clase: 'sin explicar' }
const conocida = (e: EntradaConocida, indice: number): Clasificacion => ({ clase: 'conocida', causa: e.causa, entrada: e.entrada, indice })

export function clasificar(lista: ListaConocidas, f: FilaDiferencia): Clasificacion | null {
  if (f.lado === 'huecoDeLista') return null
  const porId = (g: FilaDiferencia): Clasificacion | null => {
    const i = lista.entradas.findIndex((e) => e.entidad === g.entidad && (e.ids?.includes(g.id) || (g.numero !== undefined && e.numeros?.includes(g.numero))))
    return i === -1 ? null : conocida(lista.entradas[i], i)
  }
  const porHerencia = (g: FilaDiferencia): Clasificacion | null => {
    const p = g.padres?.find((x) => x.lado === g.lado)
    return p ? { ...p.clasificacion, heredadaDe: p.etiqueta } : null
  }
  const cumple = (g: FilaDiferencia, regla: string): boolean => {
    if (regla === 'conversacionAusenteEnZoho') return g.entidad === 'conversaciones' && g.ausenteEnZoho === true
    if (g.entidad === 'tickets') return g.id.startsWith('app-')
    if (g.entidad === 'conversaciones') return g.fuente != null && g.fuente !== 'zoho'
    return g.managedByApp === true || (g.fuente != null && g.fuente !== 'zoho')
  }
  const porRegla = (g: FilaDiferencia): Clasificacion | null => {
    const i = g.lado !== 'faltaEnZoho' ? -1 : lista.entradas.findIndex((e) => e.entidad === g.entidad && e.regla !== undefined && cumple(g, e.regla))
    return i === -1 ? null : conocida(lista.entradas[i], i)
  }
  return porId(f) ?? porHerencia(f) ?? porRegla(f) ?? SIN_EXPLICAR
}

/** Las entradas que no explicaron ninguna fila de las clasificadas (la herencia copia el `indice`): no tocan el veredicto. */
export function conocidasSinUso(lista: ListaConocidas, usadas: Clasificacion[]): { indice: number; entidad: Entidad; entrada: string }[] {
  const usos = new Set(usadas.map((c) => c.indice))
  return lista.entradas.flatMap((e, indice) => (usos.has(indice) ? [] : [{ indice, entidad: e.entidad, entrada: e.entrada }]))
}
