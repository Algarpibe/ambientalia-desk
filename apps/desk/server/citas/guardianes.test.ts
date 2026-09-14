import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

/**
 * Guardianes estáticos del detector de citas (capacidad `citas-verificables`): leen ficheros
 * vigilados del propio repositorio, así que se prueban ENSUCIANDO lo vigilado (regla de mutación 2).
 */

function git(args: string[], input?: string): string {
  const r = spawnSync('git', args, { encoding: 'utf8', input, maxBuffer: 64 * 1024 * 1024 })
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} salió ${r.status}: ${r.stderr}`)
  return r.stdout
}

const TAB = String.fromCharCode(9)
const EXTENSION_DE_TEXTO = /\.(ts|tsx|js|mjs|md|yaml|yml|json|jsonl|sql|sh)$/

/**
 * Ficheros trackeados con extensión de texto que git trata como binarios: `-` `-` en el numstat del
 * diff desde el árbol vacío. Va contra lo trackeado del árbol de trabajo, no contra HEAD: en CI (clon
 * limpio) es lo mismo, y en local deja ver el verde sin commitear (desviación aceptada, tarea 1.0).
 */
function textoQueGitCreeBinario(): string[] {
  const arbolVacio = git(['hash-object', '-t', 'tree', '--stdin'], '').trim()
  const salida = git(['-c', 'core.quotepath=off', 'diff', '--numstat', '-z', '--no-renames', '--no-ext-diff', '--no-textconv', arbolVacio])
  return salida
    .split(String.fromCharCode(0))
    .filter((entrada) => entrada.startsWith(`-${TAB}-${TAB}`))
    .map((entrada) => entrada.slice(4))
    .filter((ruta) => EXTENSION_DE_TEXTO.test(ruta))
}

describe('guardián · ningún fichero de texto trackeado es binario para git (tarea 1.0)', () => {
  it('`git grep -I` se salta EN SILENCIO lo que git cree binario, así que la lista tiene que estar vacía', () => {
    expect(textoQueGitCreeBinario()).toEqual([])
  })
})

// RQ-CV-18: sólo especificadores RELATIVOS (`import … from`, `export … from`, `import '…'` e `import()`
// literal). Hipótesis declarada en el §8 del diseño: nada de `packages/` importa el servidor por ruta relativa.
const IMPORT_RELATIVO = /(?:import|export)\s[^'"]*?from\s*['"](\.[^'"]+)['"]|import\s*\(\s*['"](\.[^'"]+)['"]\s*\)|import\s+['"](\.[^'"]+)['"]/g

function alcanzables(entrada: string, leer: (ruta: string) => string | null): Set<string> {
  const vistos = new Set<string>()
  const pendientes = [entrada]
  while (pendientes.length > 0) {
    const ruta = pendientes.pop() as string
    const fuente = vistos.has(ruta) ? null : leer(ruta)
    if (fuente === null) continue
    vistos.add(ruta)
    for (const m of fuente.matchAll(IMPORT_RELATIVO)) {
      const base = path.posix.join(path.posix.dirname(ruta), m[1] ?? m[2] ?? m[3]).replace(/\.js$/, '')
      const destino = [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`, base].find((r) => leer(r) !== null)
      if (destino) pendientes.push(destino)
    }
  }
  return vistos
}

function leerDelDisco(ruta: string): string | null {
  try {
    return readFileSync(ruta, 'utf8')
  } catch {
    return null
  }
}

describe('guardián · RQ-CV-18: nada de producción importa el detector, y cada fichero lo declara (tarea 1.42)', () => {
  it('el grafo de imports desde apps/desk/server/index.ts no alcanza citas/ (y sí alcanza el servidor)', () => {
    const grafo = alcanzables('apps/desk/server/index.ts', leerDelDisco)
    expect(grafo.has('apps/desk/server/app.ts')).toBe(true) // control: el recorrido camina de verdad
    expect([...grafo].filter((ruta) => ruta.startsWith('apps/desk/server/citas/'))).toEqual([])
  })

  it('control del otro signo, en memoria: un módulo de producción que reexporta el detector lo alcanza', () => {
    const grafo: Record<string, string> = {
      'srv/index.ts': "import { crear } from './app'",
      'srv/app.ts': "export { detectar } from './citas/detector.js'",
      'srv/citas/detector.ts': 'export const detectar = 1',
    }
    expect(alcanzables('srv/index.ts', (ruta) => grafo[ruta] ?? null).has('srv/citas/detector.ts')).toBe(true)
  })

  it('cada fichero del detector declara que viaja inerte y que nada de producción lo importa', () => {
    const carpeta = 'apps/desk/server/citas'
    const ficheros = readdirSync(carpeta).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
    expect(ficheros.length).toBeGreaterThanOrEqual(4)
    for (const f of ficheros) {
      const fuente = readFileSync(path.posix.join(carpeta, f), 'utf8')
      expect(fuente, f).toContain('código INERTE')
      expect(fuente, f).toContain('NADA de producción lo importa')
    }
  })
})
