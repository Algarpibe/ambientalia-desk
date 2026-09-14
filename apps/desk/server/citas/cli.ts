/**
 * Detector de citas (capacidad `citas-verificables`).
 *
 * Este fichero viaja a la imagen de producción como código INERTE: no lo ejecuta el servidor, sólo
 * el hook de `pre-push` bajo `tsx` (RQ-CV-18). NADA de producción lo importa — `guardianes.test.ts`
 * recorre el grafo de imports desde `apps/desk/server/index.ts` y lo comprueba.
 *
 * El CLI (§5 del diseño): lee el stdin de `pre-push`, llama al núcleo sobre el sha local, arma el
 * informe y fija el código de salida. `ejecutar` es puro respecto al proceso para que las pruebas lo
 * llamen en proceso y el adaptador cuente en la cobertura; sólo se autoejecuta como punto de entrada.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { detectar, type EntradaBase, type Repo } from './detector'
import { repoGit } from './git'
import { informe } from './informe'

export interface EntradaCli {
  argv: string[]
  entrada: string
  cwd: string
  env?: NodeJS.ProcessEnv
}

export interface SalidaCli {
  codigo: 0 | 1 | 2
  texto: string
}

const SALTO = String.fromCharCode(10)

/** La base viaja en el mismo sha que se empuja (D6). Se excluye del barrido porque tiene forma de cita. */
const RUTA_BASE = 'apps/desk/server/citas/lineaBase.jsonl'
/** D5 y D6. Aquí sólo la base, que la necesita la tarea 2.11; las otras cinco llegan con la 2.15. */
const EXCLUSIONES = [RUTA_BASE]

function leerBase(repo: Repo, arbol: string): EntradaBase[] {
  const objeto = `${arbol}:${RUTA_BASE}`
  const texto = repo.leerLote([objeto]).get(objeto) ?? ''
  return texto.split(SALTO).filter((l) => l.trim() !== '').map((l) => JSON.parse(l) as EntradaBase)
}

/** D12: el sha remoto; en ceros (rama nueva), `origin/main`. Si no hay índice, el informe lo DICE. */
function indiceRemoto(repo: Repo, shaRemoto: string): { remoto?: { en: string; rutas: string[] }; etiqueta: string } {
  const nueva = /^0+$/.test(shaRemoto)
  const en = nueva ? 'origin/main' : shaRemoto.slice(0, 7)
  const rutas = repo.rutas(nueva ? 'refs/remotes/origin/main' : shaRemoto)
  if (rutas === null) return { etiqueta: nueva ? 'NO HECHO: no hay origin/main' : 'NO HECHO: objeto ausente' }
  return { remoto: { en, rutas }, etiqueta: en }
}

export function ejecutar({ entrada, cwd, env = process.env }: EntradaCli): SalidaCli {
  const repo = repoGit(cwd, env)
  const textos: string[] = []
  let codigo: 0 | 1 = 0
  for (const linea of entrada.split(SALTO).filter((l) => l.trim() !== '')) {
    const [ref, shaLocal, , shaRemoto] = linea.trim().split(' ')
    const arbol = repo.arbol(shaLocal)
    if (arbol === null) continue
    const { remoto, etiqueta } = indiceRemoto(repo, shaRemoto)
    // RQ-CV-01: barrido COMPLETO del árbol del sha local, nunca limitado a lo que cambia el push (M29).
    const resultado = detectar({ repo, arbolLocal: arbol, exclusiones: EXCLUSIONES, base: leerBase(repo, arbol), remoto })
    textos.push(informe(resultado, { sha: shaLocal.slice(0, 7), ref, indiceRemoto: etiqueta }))
    if (resultado.bloquea) codigo = 1
  }
  return { codigo, texto: textos.join(SALTO) }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { codigo, texto } = ejecutar({ argv: process.argv.slice(2), entrada: readFileSync(0, 'utf8'), cwd: process.cwd() })
  process.stderr.write(texto + SALTO)
  process.exitCode = codigo
}
