/**
 * Detector de citas (capacidad `citas-verificables`).
 *
 * Este fichero viaja a la imagen de producción como código INERTE: no lo ejecuta el servidor, sólo
 * el hook de `pre-push` bajo `tsx` (RQ-CV-18). NADA de producción lo importa — `guardianes.test.ts`
 * recorre el grafo de imports desde `apps/desk/server/index.ts` y lo comprueba.
 *
 * El adaptador: implementa el puerto `Repo` con git de verdad (§5 del diseño). Argumentos en lista y
 * sin shell; stdin CERRADO en los hijos salvo en el lote (`git shortlog` lee stdin si no ve
 * revisiones); `maxBuffer` explícito; rutas con `-z` o `--null`, sin las comillas de `core.quotePath`.
 * Lee SIEMPRE por sha, nunca el árbol de trabajo ni el índice (M8).
 */
import { spawnSync } from 'node:child_process'
import type { LineaFuente, Repo } from './detector'

const NUL = String.fromCharCode(0)
const SALTO = String.fromCharCode(10)
const TAB = String.fromCharCode(9)
const MAX_BUFFER = 512 * 1024 * 1024

/** Un fallo operativo de git: el CLI lo convierte en salida 2, nunca en un pase (D12). */
export class ErrorDeGit extends Error {}

const EXTENSION_DE_TEXTO = /\.(ts|tsx|js|mjs|md|yaml|yml|json|jsonl|sql|sh)$/

/** RQ-CV-10 (decisión b, tarea 2.25): ficheros trackeados con extensión de texto que `git grep -I` se
 *  salta EN SILENCIO por tratarlos como binarios — `-` `-` en el numstat del diff desde el árbol vacío.
 *  Sin `revision`, compara contra el árbol de TRABAJO (guardián estático, 1.0); con ella, contra ese sha
 *  commiteado (uso del CLI, por push). Antes vivía sólo en `guardianes.test.ts`; ahora el guardián la
 *  importa de aquí. */
export function textoQueGitCreeBinario(cwd: string, env: NodeJS.ProcessEnv, revision?: string): string[] {
  const arbolVacio = spawnSync('git', ['hash-object', '-t', 'tree', '--stdin'], { cwd, env, input: '', encoding: 'utf8' }).stdout.trim()
  const args = ['-c', 'core.quotepath=off', 'diff', '--numstat', '-z', '--no-renames', '--no-ext-diff', '--no-textconv', arbolVacio, ...(revision ? [revision] : [])]
  const salida = spawnSync('git', args, { cwd, env, encoding: 'utf8', maxBuffer: MAX_BUFFER }).stdout
  return salida.split(NUL).filter((e) => e.startsWith(`-${TAB}-${TAB}`)).map((e) => e.slice(4)).filter((ruta) => EXTENSION_DE_TEXTO.test(ruta))
}

export function repoGit(cwd: string, env: NodeJS.ProcessEnv = process.env): Repo {
  function git(args: string[], opciones: { entrada?: string; admite?: number[] } = {}): Buffer | null {
    const r = spawnSync('git', ['-c', 'core.quotepath=off', ...args], {
      cwd,
      env,
      maxBuffer: MAX_BUFFER,
      input: opciones.entrada,
      stdio: [opciones.entrada === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'],
    })
    if (r.error) throw new ErrorDeGit(`git ${args[0]}: ${r.error.message}`)
    if (r.status === 0) return r.stdout
    if (r.status !== null && opciones.admite?.includes(r.status)) return null
    throw new ErrorDeGit(`git ${args.join(' ')} salió ${r.status}: ${r.stderr.toString('utf8')}`)
  }

  return {
    rutas(rev) {
      const salida = git(['ls-tree', '-r', '--name-only', '-z', rev], { admite: [128] })
      return salida === null ? null : salida.toString('utf8').split(NUL).filter(Boolean)
    },

    lineas(arbol, exclusiones): LineaFuente[] {
      const pathspecs = ['.', ...exclusiones.map((e) => `:(exclude)${e}`)]
      const salida = git(['grep', '--null', '-n', '-I', '-E', ':[0-9]', arbol, '--', ...pathspecs], { admite: [1] })
      if (salida === null) return [] // 1 = ninguna coincidencia
      const prefijo = `${arbol}:`
      return salida.toString('utf8').split(SALTO).filter(Boolean).map((linea) => {
        const [conArbol, n, ...texto] = linea.split(NUL)
        return { fichero: conArbol.slice(prefijo.length), n: Number(n), texto: texto.join(NUL) }
      })
    },

    leerLote(objetos) {
      const mapa = new Map<string, string | null>()
      if (objetos.length === 0) return mapa
      const salida = git(['cat-file', '--batch'], { entrada: objetos.join(SALTO) + SALTO }) as Buffer
      let pos = 0
      for (const objeto of objetos) {
        const finCabecera = salida.indexOf(SALTO, pos)
        const cabecera = /^[0-9a-f]+ (\w+) (\d+)$/.exec(salida.subarray(pos, finCabecera).toString('utf8'))
        pos = finCabecera + 1
        if (!cabecera) {
          mapa.set(objeto, null) // «missing» o «ambiguous»
          continue
        }
        const tamano = Number(cabecera[2])
        mapa.set(objeto, cabecera[1] === 'blob' ? salida.subarray(pos, pos + tamano).toString('utf8') : null)
        pos += tamano + 1
      }
      return mapa
    },

    arbol(rev) {
      const salida = git(['rev-parse', '--verify', '-q', `${rev}^{tree}`], { admite: [1, 128] })
      return salida === null ? null : salida.toString('utf8').trim()
    },

    identidades() {
      const salida = git(['shortlog', '-sne', '--all']) as Buffer
      return salida.toString('utf8').split(SALTO).filter(Boolean).map((l) => l.split(TAB).slice(1).join(TAB))
    },
  }
}
