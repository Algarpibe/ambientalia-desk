import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { textoQueGitCreeBinario } from './git'
import { repoGitTemporal } from '../testing/reposDePrueba'

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

/**
 * RQ-CV-12, M16: el hook invoca `tsx` con `node_modules/.bin/tsx` o `npx --no tsx`, NUNCA con
 * `npx tsx` a secas, `npm exec tsx` ni `npm x tsx` sin `--no`. Guardián ESTÁTICO, sin red: lee
 * `.githooks/pre-push` (regla de mutación 2 del proyecto: se ensucia el FICHERO VIGILADO, no el
 * guardián). Las tres formas sucias se aplican sobre el CONTENIDO REAL del hook, en memoria — nunca
 * se escribe una forma sucia en el árbol de trabajo (tareas 4.1-4.3).
 */
function invocaTsxDeFormaSegura(contenido: string): boolean {
  const segura = /node_modules\/\.bin\/tsx\b|npx\s+--no\s+tsx\b/
  const insegura = /npx\s+tsx\b|npm\s+exec\s+tsx\b|npm\s+x\s+tsx\b/
  return segura.test(contenido) && !insegura.test(contenido)
}

describe('guardián · M16 estático: `.githooks/pre-push` invoca tsx de forma segura (tareas 4.1-4.3)', () => {
  const real = readFileSync('.githooks/pre-push', 'utf8')

  it('el hook real invoca tsx con `node_modules/.bin/tsx` o `npx --no tsx`', () => {
    expect(invocaTsxDeFormaSegura(real)).toBe(true)
  })

  it.each([
    ['npx tsx', 'npx tsx'],
    ['npm exec tsx', 'npm exec tsx'],
    ['npm x tsx', 'npm x tsx'],
  ])('MUT (regla de mutación 2): ensuciar el hook con "%s" pone el guardián en rojo', (_nombre, formaSucia) => {
    const sucio = real.replace('node_modules/.bin/tsx', formaSucia)
    expect(sucio).not.toBe(real) // control: la sustitución sí cambió el contenido
    expect(invocaTsxDeFormaSegura(sucio)).toBe(false)
  })
})

/**
 * D10: `.githooks/pre-push` no tiene extensión, así que `*.sh text eol=lf` no lo protege y
 * `* text=auto` lo deja depender de `core.autocrlf` de cada máquina. Un hook con CRLF en el árbol
 * de trabajo no se ejecuta bajo `sh` (tareas 4.4-4.6). El guardián estático lee el atributo del
 * REPOSITORIO REAL con `git check-attr`; el de dos signos usa un repositorio SINTÉTICO (regla de
 * mutación 2: se ensucia el fichero vigilado —aquí, `.gitattributes`—, nunca dentro de este
 * repositorio).
 */
function eolDeclarado(cwd: string, env: NodeJS.ProcessEnv, ruta: string): string {
  const r = spawnSync('git', ['check-attr', 'eol', '--', ruta], { cwd, env, encoding: 'utf8' })
  const m = /: eol: (\S+)/.exec(r.stdout)
  return m ? m[1] : 'unspecified'
}

describe('guardián · D10: `.githooks/pre-push` declara `eol=lf` en `.gitattributes` (tareas 4.4-4.6)', () => {
  it('sobre el repositorio real, `git check-attr eol` devuelve `lf` (tarea 4.4-4.5)', () => {
    expect(eolDeclarado(process.cwd(), process.env, '.githooks/pre-push')).toBe('lf')
  })

  it('MUT (regla de mutación 2, repositorio sintético SIN la línea) → no es `lf` (tarea 4.6)', () => {
    const r = repoGitTemporal()
    try {
      mkdirSync(path.join(r.dir, '.githooks'), { recursive: true })
      writeFileSync(path.join(r.dir, '.githooks', 'pre-push'), '#!/bin/sh\nexit 0\n')
      // `.gitattributes` SIN la regla `.githooks/* text eol=lf` — control del signo roto.
      writeFileSync(path.join(r.dir, '.gitattributes'), '* text=auto\n')
      r.commit('sin la regla eol=lf')
      expect(eolDeclarado(r.dir, r.env, '.githooks/pre-push')).not.toBe('lf')
    } finally {
      r.borrar()
    }
  })

  it('control del otro signo, mismo repositorio sintético CON la línea → `lf` (tarea 4.6)', () => {
    const r = repoGitTemporal()
    try {
      mkdirSync(path.join(r.dir, '.githooks'), { recursive: true })
      writeFileSync(path.join(r.dir, '.githooks', 'pre-push'), '#!/bin/sh\nexit 0\n')
      writeFileSync(path.join(r.dir, '.gitattributes'), '* text=auto\n.githooks/* text eol=lf\n')
      r.commit('con la regla eol=lf')
      expect(eolDeclarado(r.dir, r.env, '.githooks/pre-push')).toBe('lf')
    } finally {
      r.borrar()
    }
  })
})

/**
 * AÑADIDO 1 (Gerencia, 2026-09-14): el `prepare` nuevo de la tarea 4.13 hace que la etapa 2 del
 * `Dockerfile` (runtime) ejecute `scripts/instalar-hooks.mjs` dentro de `npm ci`. Esa etapa copia
 * sólo `package.json`, `package-lock.json`, `packages` y `apps` antes de `npm ci`: sin `scripts/`
 * copiado, el build de Docker falla. Guardián ESTÁTICO: toda etapa del `Dockerfile` (partida por
 * `FROM`) que ejecuta `npm ci` copia `scripts/` ANTES (un `COPY scripts …` o un `COPY . .`) o usa
 * `--ignore-scripts`. Regla de mutación 2: se ensucia el CONTENIDO del `Dockerfile` (en memoria, a
 * partir del real), nunca el guardián.
 */
function etapasNpmCiSinScripts(contenido: string): string[] {
  const etapas = contenido.split(/(?=^FROM )/m).filter((e) => e.startsWith('FROM '))
  const problematicas: string[] = []
  etapas.forEach((etapa, i) => {
    const lineas = etapa.split('\n')
    lineas.forEach((linea, j) => {
      const t = linea.trim()
      if (/^RUN\s+npm\s+ci\b/.test(t) && !/--ignore-scripts/.test(t)) {
        const anterior = lineas.slice(0, j).map((l) => l.trim())
        const copiaScripts = anterior.some((l) => /^COPY\s+scripts\b/.test(l) || /^COPY\s+\.\s+\.\s*$/.test(l))
        if (!copiaScripts) problematicas.push(`etapa ${i + 1}, línea "${t}"`)
      }
    })
  })
  return problematicas
}

describe('guardián · toda etapa del Dockerfile que ejecuta `npm ci` copia `scripts/` antes, o usa `--ignore-scripts` (AÑADIDO 1)', () => {
  const real = readFileSync('Dockerfile', 'utf8')

  it('el Dockerfile real no tiene ninguna etapa sin `scripts/`', () => {
    expect(etapasNpmCiSinScripts(real)).toEqual([])
  })

  it('MUT (regla de mutación 2): quitar el `COPY scripts` de la etapa 2 → rojo', () => {
    const sucio = real.replace(/^COPY scripts \.\/scripts\r?\n/m, '')
    expect(sucio).not.toBe(real) // control: la sustitución sí cambió el contenido
    expect(etapasNpmCiSinScripts(sucio)).not.toEqual([])
  })

  it('MUT posición (regla de mutación 1): mover `COPY scripts` DESPUÉS de `npm ci` → rojo', () => {
    const sinCopy = real.replace(/^COPY scripts \.\/scripts\r?\n/m, '')
    expect(sinCopy).not.toBe(real)
    const conCopyDespues = sinCopy.replace(/^(RUN npm ci\r?\n)/m, '$1COPY scripts ./scripts\n')
    expect(conCopyDespues).not.toBe(sinCopy)
    expect(etapasNpmCiSinScripts(conCopyDespues)).not.toEqual([])
  })
})
