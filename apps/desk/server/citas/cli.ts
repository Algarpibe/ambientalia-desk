/**
 * Detector de citas (capacidad `citas-verificables`).
 *
 * Este fichero viaja a la imagen de producción como código INERTE: no lo ejecuta el servidor, sólo
 * el hook de `pre-push` bajo `tsx` (RQ-CV-18). NADA de producción lo importa — `guardianes.test.ts`
 * recorre el grafo de imports desde `apps/desk/server/index.ts` y lo comprueba.
 *
 * El CLI (§5 del diseño): tres modos. Sin argumentos, el modo HOOK lee el stdin de `pre-push`, llama al
 * núcleo sobre el sha local, arma el informe y fija el código de salida. `--sha <rev>` comprueba una
 * revisión concreta a mano (§8 de la propuesta), con el índice remoto de `origin/main`. `--generar-base`
 * escribe `lineaBase.jsonl` para el árbol de `HEAD` (D6). `ejecutar` es puro respecto al proceso para
 * que las pruebas lo llamen en proceso y el adaptador cuente en la cobertura; sólo se autoejecuta como
 * punto de entrada.
 *
 * Tarea 3.10(a): `entrada` es una LECTURA PEREZOSA (`() => string`), no el texto ya leído. `ejecutar` la
 * invoca sólo en modo HOOK: a mano, desde una terminal, el stdin es un TTY y una lectura en `--sha` o
 * `--generar-base` esperaría un EOF que no llega.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { detectar, type EntradaBase, type Repo } from './detector'
import { ErrorDeGit, repoGit, textoQueGitCreeBinario } from './git'
import { informe } from './informe'

export interface EntradaCli {
  argv: string[]
  /** Lectura perezosa del stdin: sólo el modo hook la invoca (tarea 3.10a). */
  entrada: () => string
  cwd: string
  env?: NodeJS.ProcessEnv
}

export interface SalidaCli {
  codigo: 0 | 1 | 2
  texto: string
}

const SALTO = String.fromCharCode(10)
const CEROS_RE = /^0+$/
const CEROS = '0'.repeat(40)

/** La base viaja en el mismo sha que se empuja (D6). Se excluye del barrido porque tiene forma de cita. */
const RUTA_BASE = 'apps/desk/server/citas/lineaBase.jsonl'
/** D5, D6 y RQ-CV-07: las SEIS exclusiones del barrido (tarea 2.15). */
export const EXCLUSIONES = [
  RUTA_BASE,
  'openspec/changes/archive/',
  '.claude/skills/superpowers-main/',
  '.agent/skills/',
  'docs/artefactos/',
  '*.csv',
]

function leerBase(repo: Repo, arbol: string): EntradaBase[] {
  const objeto = `${arbol}:${RUTA_BASE}`
  const texto = repo.leerLote([objeto]).get(objeto) ?? ''
  return texto.split(SALTO).filter((l) => l.trim() !== '').map((l) => JSON.parse(l) as EntradaBase)
}

/** D12: el sha remoto; en ceros (rama nueva), `origin/main`. Si no hay índice, el informe lo DICE. */
function indiceRemoto(repo: Repo, shaRemoto: string): { remoto?: { en: string; rutas: string[] }; etiqueta: string } {
  const nueva = CEROS_RE.test(shaRemoto)
  const en = nueva ? 'origin/main' : shaRemoto.slice(0, 7)
  const rutas = repo.rutas(nueva ? 'refs/remotes/origin/main' : shaRemoto)
  if (rutas === null) return { etiqueta: nueva ? 'NO HECHO: no hay origin/main' : 'NO HECHO: objeto ausente' }
  return { remoto: { en, rutas }, etiqueta: en }
}

/** RQ-CV-11 (M21): más de una identidad → aviso visible, sin tocar el código de salida. */
function avisoDeEscalada(repo: Repo): string | null {
  const identidades = repo.identidades()
  if (identidades.length <= 1) return null
  return `⚠️ más de una identidad de autor (${identidades.length}): añade el job de CI con fetch-depth: 0 para la comprobación remota.`
}

/** D12: un árbol con varias referencias/remotos comparte UN solo barrido; sus índices remotos se unen. */
function indiceRemotoUnido(repo: Repo, remotos: readonly string[]): { remoto?: { en: string; rutas: string[] }; etiqueta: string } {
  const indices = remotos.map((sr) => indiceRemoto(repo, sr))
  const rutas = new Set<string>()
  let en: string | undefined
  for (const ix of indices) {
    if (ix.remoto) {
      for (const ruta of ix.remoto.rutas) rutas.add(ruta)
      en = ix.remoto.en
    }
  }
  return en !== undefined ? { remoto: { en, rutas: [...rutas] }, etiqueta: en } : { etiqueta: indices[0].etiqueta }
}

type Modo = { modo: 'hook' } | { modo: 'sha'; rev: string } | { modo: 'generar-base' }

/** Tarea 3.10: `--sha <rev>` (comprobación manual) y `--generar-base` (escribe la línea base); sin
 *  ninguno de los dos, modo HOOK (lee el stdin de `pre-push`). */
function parseArgv(argv: readonly string[]): Modo {
  const i = argv.indexOf('--sha')
  if (i !== -1 && argv[i + 1] !== undefined) return { modo: 'sha', rev: argv[i + 1] }
  if (argv.includes('--generar-base')) return { modo: 'generar-base' }
  return { modo: 'hook' }
}

/** Tarea 3.10(b): `--sha <rev>` — comprobación manual del §8 de la propuesta. El índice remoto SALE
 *  SIEMPRE de `origin/main` (o "NO HECHO" si no existe): mismo camino que una rama nueva en modo hook,
 *  reutilizando `indiceRemoto` con el sha remoto en ceros. */
function comprobarSha(repo: Repo, cwd: string, env: NodeJS.ProcessEnv, rev: string): SalidaCli {
  const arbol = repo.arbol(rev)
  if (arbol === null) return { codigo: 2, texto: `citas: fallo operativo — revisión inexistente (${rev})` }
  const { remoto, etiqueta } = indiceRemoto(repo, CEROS)
  const resultado = detectar({ repo, arbolLocal: arbol, exclusiones: EXCLUSIONES, base: leerBase(repo, arbol), remoto })
  const binarios = textoQueGitCreeBinario(cwd, env, rev).length
  const texto = informe(resultado, { sha: rev.slice(0, 7), ref: rev, indiceRemoto: etiqueta, binarios })
  return { codigo: resultado.bloquea ? 1 : 0, texto }
}

/** Tarea 3.10(c): `--generar-base` escribe `lineaBase.jsonl` ÉL MISMO (UTF-8 sin BOM, LF), nunca por
 *  redirección — en PowerShell 5.1 la redirección escribe UTF-16 (§5, D6). Calculada con la base VACÍA,
 *  para que una base previa no esconda entradas; ordenada por documento y línea (a igualdad, por orden
 *  de aparición: `Array.prototype.sort` es estable). Una entrada por CANDIDATO DE BLOQUEO, nunca por
 *  abreviada (RQ-CV-09). */
function generarBase(repo: Repo, cwd: string): SalidaCli {
  const arbol = repo.arbol('HEAD')
  if (arbol === null) return { codigo: 2, texto: 'citas: fallo operativo — HEAD no pela a un árbol' }
  const resultado = detectar({ repo, arbolLocal: arbol, exclusiones: EXCLUSIONES, base: [] })
  const entradas: EntradaBase[] = resultado.bloqueantes
    .map(({ fichero, linea, cita, motivo }): EntradaBase => ({ fichero, linea, cita, motivo }))
    .sort((a, b) => (a.fichero === b.fichero ? a.linea - b.linea : a.fichero < b.fichero ? -1 : 1))
  const texto = entradas.map((e) => JSON.stringify(e)).join(SALTO) + (entradas.length > 0 ? SALTO : '')
  const rutaAbsoluta = path.join(cwd, RUTA_BASE)
  mkdirSync(path.dirname(rutaAbsoluta), { recursive: true })
  writeFileSync(rutaAbsoluta, texto, 'utf8') // Node no antepone BOM; el propio CLI la escribe, no por redirección
  return { codigo: 0, texto: `citas: línea base generada · ${entradas.length} entradas` }
}

export function ejecutar({ argv, entrada, cwd, env = process.env }: EntradaCli): SalidaCli {
  try {
    const repo = repoGit(cwd, env)
    const modo = parseArgv(argv)
    if (modo.modo === 'generar-base') return generarBase(repo, cwd)
    if (modo.modo === 'sha') return comprobarSha(repo, cwd, env, modo.rev)
    // modo hook (tarea 3.10a): ÚNICA rama que invoca `entrada()`.
    const textos: string[] = []
    let codigo: 0 | 1 = 0
    // D12: dedup por ÁRBOL — dos referencias con el MISMO sha local cuestan un solo barrido.
    const porArbol = new Map<string, { ref: string; shaLocal: string; remotos: string[] }>()
    for (const linea of entrada().split(SALTO).filter((l) => l.trim() !== '')) {
      const partes = linea.trim().split(' ')
      if (partes.length !== 4) throw new ErrorDeGit(`línea de stdin mal formada (se esperaban 4 campos): "${linea}"`)
      const [ref, shaLocal, , shaRemoto] = partes
      if (CEROS_RE.test(shaLocal)) {
        textos.push(`citas · ${ref}: rama borrada, no se comprueba`)
        continue
      }
      const arbol = repo.arbol(shaLocal)
      if (arbol === null) {
        textos.push(`citas · ${shaLocal.slice(0, 7)} · ${ref}: no comprobado, el sha local no pela a un árbol`)
        continue
      }
      const grupo = porArbol.get(arbol) ?? { ref, shaLocal, remotos: [] as string[] }
      grupo.remotos.push(shaRemoto)
      porArbol.set(arbol, grupo)
    }
    for (const [arbol, { ref, shaLocal, remotos }] of porArbol) {
      const { remoto, etiqueta } = indiceRemotoUnido(repo, remotos)
      // RQ-CV-01: barrido COMPLETO del árbol del sha local, nunca limitado a lo que cambia el push (M29).
      const resultado = detectar({ repo, arbolLocal: arbol, exclusiones: EXCLUSIONES, base: leerBase(repo, arbol), remoto })
      const binarios = textoQueGitCreeBinario(cwd, env, shaLocal).length
      textos.push(informe(resultado, { sha: shaLocal.slice(0, 7), ref, indiceRemoto: etiqueta, binarios }))
      if (resultado.bloquea) codigo = 1
    }
    const aviso = avisoDeEscalada(repo)
    if (aviso !== null) textos.push(aviso)
    return { codigo, texto: textos.join(SALTO) }
  } catch (e) {
    // D12, defecto cerrado: git falla, la base es ilegible o una línea de stdin está mal formada →
    // salida 2 con mensaje, NUNCA una excepción sin capturar ni un pase silencioso (M16, falla cerrado).
    const mensaje = e instanceof Error ? e.message : String(e)
    return { codigo: 2, texto: `citas: fallo operativo — ${mensaje}` }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { codigo, texto } = ejecutar({ argv: process.argv.slice(2), entrada: () => readFileSync(0, 'utf8'), cwd: process.cwd() })
  process.stderr.write(texto + SALTO)
  process.exitCode = codigo
}
