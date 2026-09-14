import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { textoQueGitCreeBinario } from './git'

/**
 * Guardianes estáticos del detector de citas (capacidad `citas-verificables`): leen ficheros
 * vigilados del propio repositorio, así que se prueban ENSUCIANDO lo vigilado (regla de mutación 2).
 *
 * La función vigilada vive en `git.ts` (tarea 2.25): contra el árbol de TRABAJO, no contra HEAD —
 * en CI (clon limpio) es lo mismo, y en local deja ver el verde sin commitear (tarea 1.0).
 */
describe('guardián · ningún fichero de texto trackeado es binario para git (tarea 1.0)', () => {
  it('`git grep -I` se salta EN SILENCIO lo que git cree binario, así que la lista tiene que estar vacía', () => {
    expect(textoQueGitCreeBinario(process.cwd(), process.env)).toEqual([])
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
