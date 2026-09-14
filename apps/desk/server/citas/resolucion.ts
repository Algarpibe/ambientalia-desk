/**
 * Detector de citas (capacidad `citas-verificables`).
 *
 * Este fichero viaja a la imagen de producción como código INERTE: no lo ejecuta el servidor, sólo
 * el hook de `pre-push` bajo `tsx` (RQ-CV-18). NADA de producción lo importa — `guardianes.test.ts`
 * recorre el grafo de imports desde `apps/desk/server/index.ts` y lo comprueba.
 *
 * Índices por árbol y la regla de resolución de una ruta, en el orden de D4 (§4 del diseño). Esta
 * unidad (1a) sólo construye el índice LOCAL; el índice remoto (paso 5 de D4) lo añade la unidad 1b.
 */

export interface IndiceArbol {
  exactos: Set<string>
  porSufijo: Map<string, string[]>
  directorios: Set<string>
}

/** Construye el índice de un árbol a partir de sus rutas trackeadas (RQ-CV-02). */
export function construirIndice(rutas: readonly string[]): IndiceArbol {
  const exactos = new Set(rutas)
  const porSufijo = new Map<string, string[]>()
  const directorios = new Set<string>()
  for (const ruta of rutas) {
    const partes = ruta.split('/')
    for (let i = 0; i < partes.length; i++) {
      if (i > 0) directorios.add(partes.slice(0, i).join('/'))
      const sufijo = partes.slice(i).join('/')
      const lista = porSufijo.get(sufijo)
      if (lista) lista.push(ruta)
      else porSufijo.set(sufijo, [ruta])
    }
  }
  return { exactos, porSufijo, directorios }
}

export type ResolucionLocal =
  | { tipo: 'unico'; ruta: string }
  | { tipo: 'ambiguo'; candidatos: string[] }
  | { tipo: 'no-resuelto' }

/** Coincidencia EXACTA de ruta tiene precedencia sobre el sufijo con frontera de segmento (RQ-CV-02). */
export function resolverToken(nombre: string, indice: IndiceArbol): ResolucionLocal {
  if (indice.exactos.has(nombre)) return { tipo: 'unico', ruta: nombre }
  const candidatos = indice.porSufijo.get(nombre)
  if (!candidatos || candidatos.length === 0) return { tipo: 'no-resuelto' }
  if (candidatos.length === 1) return { tipo: 'unico', ruta: candidatos[0] }
  return { tipo: 'ambiguo', candidatos }
}

export type Resolucion =
  | { tipo: 'unico'; ruta: string }
  | { tipo: 'ambiguo'; candidatos: string[] }
  | { tipo: 'directorio' }
  | { tipo: 'no-es-cita' }
  | { tipo: 'inexistente' }
  | { tipo: 'sin-barra' }

/** D3: sólo dígitos (una hora, con o sin segundos) o fecha ISO con hora. Sólo reclasifica lo que ya
 *  iba a saltarse: nunca cambia un resultado comprobado ni bloqueante. */
const MARCA_DE_TIEMPO = /^(?:\d+(?::\d+)*|\d{4}-\d{2}-\d{2}T\d{2}(?::\d{2})*)$/

/** Un directorio del árbol, por ruta exacta o por sufijo con frontera de segmento. */
function esDirectorio(nombre: string, indice: IndiceArbol): boolean {
  if (indice.directorios.has(nombre)) return true
  for (const d of indice.directorios) if (d.endsWith(`/${nombre}`)) return true
  return false
}

/** La regla de D4 en su orden, para un token que ya no es «fuera del repositorio» ni puerto de URL
 *  (pasos 1-2, en la cosecha). El paso 5, índice remoto, lo añade la unidad 1b. */
export function resolverRuta(nombre: string, indice: IndiceArbol): Resolucion {
  const local = resolverToken(nombre, indice) // paso 3
  if (local.tipo !== 'no-resuelto') return local
  if (esDirectorio(nombre, indice)) return { tipo: 'directorio' } // paso 4: ANTES que el 7 (regla de mutación 1)
  if (!nombre.includes('/') && MARCA_DE_TIEMPO.test(nombre)) return { tipo: 'no-es-cita' } // paso 6
  if (nombre.includes('/')) return { tipo: 'inexistente' } // paso 7
  return { tipo: 'sin-barra' } // paso 8
}
