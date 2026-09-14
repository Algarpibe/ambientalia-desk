import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
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
 * Dos porciones: la de MEMORIA (unidad 1a, núcleo puro) y un repositorio git temporal AISLADO (unidad
 * 1b, `repoGitTemporal`), para el adaptador y el CLI con git de verdad.
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

/** Variables con las que un proceso padre (un hook, otra prueba) apuntaría git a OTRO repositorio. */
const VARIABLES_DE_REPOSITORIO = [
  'GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR', 'GIT_OBJECT_DIRECTORY',
  'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_CONFIG_PARAMETERS', 'GIT_CONFIG_COUNT',
]

export interface RepoGitDePrueba {
  dir: string
  env: NodeJS.ProcessEnv
  git(...args: string[]): string
  escribir(ficheros: Record<string, string>): void
  /** `git add -A` y commit; devuelve el sha. */
  commit(mensaje: string): string
  borrar(): void
}

/**
 * Repositorio git temporal y aislado (§8 del diseño): sin las variables de repositorio del padre, sin
 * configuración de sistema ni global, con techo de directorios, identidad por entorno y
 * `core.autocrlf=false`. El `env` que devuelve es el que el CLI tiene que usar.
 */
export function repoGitTemporal(): RepoGitDePrueba {
  const raiz = mkdtempSync(path.join(tmpdir(), 'citas-'))
  const dir = path.join(raiz, 'repo')
  mkdirSync(dir)
  const configVacia = path.join(raiz, 'gitconfig')
  writeFileSync(configVacia, '')
  const env: NodeJS.ProcessEnv = { ...process.env }
  for (const variable of VARIABLES_DE_REPOSITORIO) delete env[variable]
  Object.assign(env, {
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: configVacia,
    GIT_CEILING_DIRECTORIES: raiz,
    GIT_AUTHOR_NAME: 'Autora Única',
    GIT_AUTHOR_EMAIL: 'autora@example.com',
    GIT_COMMITTER_NAME: 'Autora Única',
    GIT_COMMITTER_EMAIL: 'autora@example.com',
  })
  const git = (...args: string[]): string => {
    const r = spawnSync('git', args, { cwd: dir, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    if (r.status !== 0) throw new Error(`git ${args.join(' ')} salió ${r.status}: ${r.stderr}`)
    return r.stdout.trim()
  }
  git('init', '-q', '-b', 'main')
  git('config', 'core.autocrlf', 'false')
  return {
    dir,
    env,
    git,
    escribir(ficheros) {
      for (const [ruta, contenido] of Object.entries(ficheros)) {
        mkdirSync(path.dirname(path.join(dir, ruta)), { recursive: true })
        writeFileSync(path.join(dir, ruta), contenido)
      }
    },
    commit(mensaje) {
      git('add', '-A')
      git('commit', '-q', '--allow-empty', '-m', mensaje)
      return git('rev-parse', 'HEAD')
    },
    borrar() {
      rmSync(raiz, { recursive: true, force: true })
    },
  }
}
