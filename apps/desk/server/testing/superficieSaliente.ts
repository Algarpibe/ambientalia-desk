// Barrido de la superficie HTTP del repositorio, para el invariante 7 de F0-04.
//
// Es arnés de pruebas, no código de producción: vive en `testing/` por lo mismo que `appHarness.ts`,
// y por eso el propio barrido se salta ese directorio —si no, la expresión regular de este fichero
// se encontraría a sí misma y se contaría como una llamada.

import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, relative } from 'node:path'

export interface LlamadaHttp {
  /** Ruta relativa a la raíz del repositorio, siempre con `/`, también en Windows. */
  archivo: string
  linea: number
  verbo: string
  /** La función invocada: `fetch`, `fetchImpl`, `zohoFetch`… */
  funcion: string
  /** El primer argumento tal cual está escrito, recortado. Es lo que dice si sale de la casa. */
  destino: string
}

export interface SuperficieHttp {
  /** Llamadas no-GET que salen hacia un tercero. Ordenadas por fichero. */
  salientes: LlamadaHttp[]
  /** Llamadas no-GET del navegador contra nuestro propio servidor (`/api/...`). */
  mismoOrigen: LlamadaHttp[]
  /** Ficheros donde el verbo NO es un literal y el barrido no puede saber qué manda. */
  verboDinamico: string[]
}

/** La raíz del repositorio, desde este fichero: `<raíz>/apps/desk/server/testing/`. */
const RAIZ = fileURLToPath(new URL('../../../../', import.meta.url))

/** Sólo se mira código propio. Fuera: dependencias, compilados y el andamio de las pruebas. */
const DIRECTORIOS = ['apps', 'packages']
const IGNORAR = new Set(['node_modules', 'dist', 'build', 'coverage', '.git', '.codegraph', '.atl', 'testing'])

/** El verbo escrito como literal dentro del objeto de opciones. Cubre TODOS los verbos, no sólo POST. */
const VERBO_LITERAL = /\bmethod\s*:\s*(['"`])([A-Za-z]+)\1/g
/** El verbo pasado como variable —`{ method, ... }`—: el barrido no puede leerlo. */
const VERBO_DINAMICO = /[{,]\s*method\s*,/

/**
 * Recorre `apps/` y `packages/` y clasifica cada escritura HTTP.
 *
 * LÍMITES CONOCIDOS, escritos para que nadie los descubra confiando de más:
 * - Sólo ve el verbo cuando está escrito como literal en el objeto de opciones. El caso dinámico se
 *   devuelve aparte, en `verboDinamico`, precisamente para que no pase por el hueco.
 * - Los transportes que reenvían el `init` de su llamador —`call()` en `zohoClient`, `booksClient` y
 *   `crmClient`— no aparecen: el verbo lo elige quien los llama, y son esas llamadas las que este
 *   barrido enumera. Es lo correcto: la puerta la abre quien decide el verbo, no quien la cruza.
 * - Empareja paréntesis sobre el texto plano, sin analizar la sintaxis. Un paréntesis dentro de una
 *   cadena de texto podría despistarlo; a cambio no hace falta un analizador para un guardia.
 */
export function escanearSuperficieHttp(): SuperficieHttp {
  const salientes: LlamadaHttp[] = []
  const mismoOrigen: LlamadaHttp[] = []
  const verboDinamico: string[] = []

  for (const dir of DIRECTORIOS) {
    for (const ruta of ficherosDeCodigo(join(RAIZ, dir))) {
      const archivo = relative(RAIZ, ruta).split('\\').join('/')
      const texto = readFileSync(ruta, 'utf8')
      if (VERBO_DINAMICO.test(texto)) verboDinamico.push(archivo)

      VERBO_LITERAL.lastIndex = 0
      let m: RegExpExecArray | null
      while ((m = VERBO_LITERAL.exec(texto)) !== null) {
        const verbo = m[2].toUpperCase()
        if (verbo === 'GET') continue
        const llamada = llamadaQueEnvuelve(texto, m.index)
        const linea = texto.slice(0, m.index).split('\n').length
        const entrada: LlamadaHttp = { archivo, linea, verbo, ...llamada }
        ;(esMismoOrigen(llamada) ? mismoOrigen : salientes).push(entrada)
      }
    }
  }

  const porFichero = (a: LlamadaHttp, b: LlamadaHttp) =>
    a.archivo.localeCompare(b.archivo) || a.linea - b.linea
  return {
    salientes: salientes.sort(porFichero),
    mismoOrigen: mismoOrigen.sort(porFichero),
    verboDinamico: [...new Set(verboDinamico)].sort(),
  }
}

/**
 * Una llamada es del mismo origen cuando la hace `fetch` (o el `fetchImpl` inyectable) contra una
 * ruta que empieza por `/`: eso es el navegador hablando con nuestro propio servidor.
 *
 * Todo lo demás cuenta como saliente, incluidas las de `zohoFetch` —cuya ruta también empieza por
 * `/` pero se pega a una base `https://…`—. La regla es deliberadamente estricta por ese lado: ante
 * la duda, una llamada aparece en la lista de las que salen y alguien tiene que mirarla.
 */
function esMismoOrigen({ funcion, destino }: { funcion: string; destino: string }): boolean {
  return (funcion === 'fetch' || funcion === 'fetchImpl') && /^['"`]\//.test(destino.trim())
}

/** La función y el primer argumento de la llamada que envuelve la posición dada. */
function llamadaQueEnvuelve(texto: string, pos: number): { funcion: string; destino: string } {
  let profundidad = 0
  let abre = -1
  for (let i = pos; i >= 0; i--) {
    const c = texto[i]
    if (c === ')') profundidad++
    else if (c === '(') {
      if (profundidad === 0) { abre = i; break }
      profundidad--
    }
  }
  if (abre < 0) return { funcion: '', destino: '' }

  let fin = abre
  while (fin > 0 && /\s/.test(texto[fin - 1])) fin--
  let ini = fin
  while (ini > 0 && /[\w$.]/.test(texto[ini - 1])) ini--
  const funcion = texto.slice(ini, fin).split('.').pop() ?? ''

  return { funcion, destino: primerArgumento(texto, abre + 1) }
}

/** El primer argumento tal cual, hasta la coma de nivel cero. Recortado: sólo se usa para clasificar. */
function primerArgumento(texto: string, desde: number): string {
  let profundidad = 0
  for (let i = desde; i < texto.length && i < desde + 200; i++) {
    const c = texto[i]
    if (c === '(' || c === '[' || c === '{') profundidad++
    else if (c === ')' || c === ']' || c === '}') { if (profundidad === 0) return texto.slice(desde, i).trim(); profundidad-- }
    else if (c === ',' && profundidad === 0) return texto.slice(desde, i).trim()
  }
  return texto.slice(desde, desde + 200).trim()
}

/** Los `.ts`/`.tsx` propios: sin dependencias, sin compilados, sin pruebas y sin andamio. */
function ficherosDeCodigo(raiz: string): string[] {
  const encontrados: string[] = []
  for (const entrada of readdirSync(raiz, { withFileTypes: true })) {
    if (IGNORAR.has(entrada.name)) continue
    const ruta = join(raiz, entrada.name)
    if (entrada.isDirectory()) encontrados.push(...ficherosDeCodigo(ruta))
    else if (/\.tsx?$/.test(entrada.name) && !/\.test\.tsx?$/.test(entrada.name)) encontrados.push(ruta)
  }
  return encontrados
}
