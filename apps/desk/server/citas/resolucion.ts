/**
 * Detector de citas (capacidad `citas-verificables`).
 *
 * Este fichero viaja a la imagen de producción como código INERTE: no lo ejecuta el servidor, sólo
 * el hook de `pre-push` bajo `tsx` (RQ-CV-18). NADA de producción lo importa — `guardianes.test.ts`
 * (unidad 3) recorre el grafo de imports desde `apps/desk/server/index.ts` y lo comprueba.
 *
 * Índices por árbol y la regla de resolución de una ruta, en el orden de D4 (§4 del diseño). Esta
 * unidad (1a) sólo construye el índice LOCAL; el índice remoto (paso 5 de D4) lo añade la unidad 1b.
 */

export interface IndiceArbol {
  exactos: Set<string>
  porSufijo: Map<string, string[]>
}

/** Construye el índice de un árbol a partir de sus rutas trackeadas (RQ-CV-02). */
export function construirIndice(rutas: readonly string[]): IndiceArbol {
  const exactos = new Set(rutas)
  const porSufijo = new Map<string, string[]>()
  for (const ruta of rutas) {
    const partes = ruta.split('/')
    for (let i = 0; i < partes.length; i++) {
      const sufijo = partes.slice(i).join('/')
      const lista = porSufijo.get(sufijo)
      if (lista) lista.push(ruta)
      else porSufijo.set(sufijo, [ruta])
    }
  }
  return { exactos, porSufijo }
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
