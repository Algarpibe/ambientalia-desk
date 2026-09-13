import type { Repo, LineaFuente } from '../citas/detector'

/**
 * Arnés del detector de citas (capacidad `citas-verificables`, unidad 1a).
 *
 * Construye citas en TIEMPO DE EJECUCIÓN, nunca como texto literal en este fichero: si una prueba
 * escribiera a secas una ruta, dos puntos y un número entre comillas invertidas, el propio detector
 * la leería como una afirmación real sobre este
 * repositorio en cuanto exista el hook. Por eso `cita`, `abreviada` y `anclada` concatenan sus partes
 * — el fuente de este fichero no contiene ningún dos-puntos seguido de un dígito.
 *
 * Esta porción es sólo la de MEMORIA (unidad 1a: núcleo puro, sin git de verdad). La porción con un
 * repositorio git temporal aislado se añade en la unidad 1b.
 */

/** Un fichero visto en `` `<ruta>:<línea>` ``, sin forma de cita en el propio fuente. */
export function cita(ruta: string, desde: number, hasta?: number): string {
  const rango = hasta !== undefined && hasta !== desde ? `${desde}-${hasta}` : String(desde)
  return '`' + ruta + ':' + rango + '`'
}

/** La forma abreviada `` `:<línea>` ``. */
export function abreviada(desde: number, hasta?: number): string {
  const rango = hasta !== undefined && hasta !== desde ? `${desde}-${hasta}` : String(desde)
  return '`:' + rango + '`'
}

/** Añade el anclaje `en \`<revisión>\`` a una cita ya construida (completa o abreviada). */
export function anclada(citaTexto: string, revision: string): string {
  return citaTexto + ' en `' + revision + '`'
}

/** Un árbol sintético: ruta de fichero → contenido completo, indexado por revisión. */
export type ArbolMemoria = Record<string, string>

const coincideExclusion = (ruta: string, patron: string): boolean => {
  if (patron.endsWith('/')) return ruta.startsWith(patron)
  if (patron.startsWith('*.')) return ruta.endsWith(patron.slice(1))
  return ruta === patron
}

/**
 * `Repo` en memoria: cada clave es una revisión (un sha corto, una rama, o cualquier nombre que la
 * prueba decida), y su valor es el árbol completo de esa revisión. No lanza ningún proceso; sirve
 * para las pruebas del núcleo puro (`detector.test.ts`, `cosecha.test.ts`, `resolucion.test.ts`).
 */
export function repoEnMemoria(arboles: Record<string, ArbolMemoria>, identidades: string[] = ['Autora Única <autora@example.com>']): Repo {
  return {
    rutas(rev: string): string[] | null {
      const arbol = arboles[rev]
      return arbol ? Object.keys(arbol) : null
    },
    lineas(arbol: string, exclusiones: readonly string[]): LineaFuente[] {
      const contenido = arboles[arbol]
      if (!contenido) return []
      const resultado: LineaFuente[] = []
      for (const [fichero, texto] of Object.entries(contenido)) {
        if (exclusiones.some((patron) => coincideExclusion(fichero, patron))) continue
        texto.split('\n').forEach((linea, i) => {
          if (/:\d/.test(linea)) resultado.push({ fichero, n: i + 1, texto: linea })
        })
      }
      return resultado
    },
    leerLote(objetos: readonly string[]): Map<string, string | null> {
      const mapa = new Map<string, string | null>()
      for (const objeto of objetos) {
        const separador = objeto.indexOf(':')
        const rev = objeto.slice(0, separador)
        const ruta = objeto.slice(separador + 1)
        const arbol = arboles[rev]
        mapa.set(objeto, arbol && ruta in arbol ? arbol[ruta] : null)
      }
      return mapa
    },
    arbol(rev: string): string | null {
      return arboles[rev] ? rev : null
    },
    identidades(): string[] {
      return identidades
    },
  }
}
