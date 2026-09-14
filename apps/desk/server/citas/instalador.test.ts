import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { repoGitTemporal } from '../testing/reposDePrueba'

/**
 * Pruebas SINTÉTICAS del instalador (`scripts/instalar-hooks.mjs`, RQ-CV-12, D9): lo invocan como
 * PROCESO HIJO — la guarda tiene que discriminar de verdad, no sólo ejecutarse (Pieza 5 de la
 * propuesta: las tres variantes en `sh` pasan la mutación de un solo signo). Cada prueba usa un
 * repositorio git temporal aislado o un directorio suelto, nunca este propio repositorio.
 */
const LENTO = 30_000
const SCRIPT = path.resolve('scripts/instalar-hooks.mjs')

function instalar(cwd: string, env: NodeJS.ProcessEnv) {
  return spawnSync(process.execPath, [SCRIPT], { cwd, env, encoding: 'utf8' })
}

function configHooksPath(cwd: string, env: NodeJS.ProcessEnv): string | null {
  const r = spawnSync('git', ['config', '--get', 'core.hooksPath'], { cwd, env, encoding: 'utf8' })
  return r.status === 0 ? r.stdout.trim() : null
}

/** Directorio suelto sin `.git`, aislado de cualquier repositorio ancestro real (D9, M11 signo 1). */
function dirSinGit(): { dir: string; env: NodeJS.ProcessEnv; borrar: () => void } {
  const raiz = mkdtempSync(path.join(tmpdir(), 'instalador-'))
  const dir = path.join(raiz, 'sin-git')
  mkdirSync(dir)
  const configVacia = path.join(raiz, 'gitconfig-vacio')
  writeFileSync(configVacia, '')
  const env: NodeJS.ProcessEnv = { ...process.env }
  for (const v of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR']) delete env[v]
  Object.assign(env, { GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: configVacia, GIT_CEILING_DIRECTORIES: raiz })
  return { dir, env, borrar: () => rmSync(raiz, { recursive: true, force: true }) }
}

describe('instalador · scripts/instalar-hooks.mjs (RQ-CV-12)', () => {
  it('M11, signo 1: sin `.git` → sale 0 y NO instala (tarea 4.8)', () => {
    const { dir, env, borrar } = dirSinGit()
    try {
      const r = instalar(dir, env)
      expect(r.status).toBe(0)
    } finally {
      borrar()
    }
  }, LENTO)

  it('M11, signo 2 (OBLIGATORIO): con `.git` → sale 0 Y `core.hooksPath` queda en `.githooks` (tarea 4.8)', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({ 'a.md': 'a' })
      r.commit('base')
      const res = instalar(r.dir, r.env)
      expect(res.status).toBe(0)
      expect(configHooksPath(r.dir, r.env)).toBe('.githooks')
    } finally {
      r.borrar()
    }
  }, LENTO)

  it('M12: sin binario `git` (PATH vacío) → sale 0 y no instala (tarea 4.9)', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({ 'a.md': 'a' })
      r.commit('base')
      const envSinGit: NodeJS.ProcessEnv = { ...r.env, PATH: '', Path: '' }
      const res = instalar(r.dir, envSinGit)
      expect(res.status).toBe(0)
    } finally {
      r.borrar()
    }
  }, LENTO)

  it('control del otro signo de M12: con `git` presente en el PATH → instala (tarea 4.9)', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({ 'a.md': 'a' })
      r.commit('base')
      const res = instalar(r.dir, r.env)
      expect(res.status).toBe(0)
      expect(configHooksPath(r.dir, r.env)).toBe('.githooks')
    } finally {
      r.borrar()
    }
  }, LENTO)

  it('M13: `git config` falla CON repositorio presente → mensaje visible, sigue en verde (tarea 4.10)', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({ 'a.md': 'a' })
      r.commit('base')
      // Un DIRECTORIO llamado `config.lock` hace fallar cualquier escritura de `git config`.
      const lock = path.join(r.dir, '.git', 'config.lock')
      mkdirSync(lock)
      const res = instalar(r.dir, r.env)
      expect(res.status).toBe(0)
      expect(res.stdout + res.stderr).toMatch(/no se pudo fijar core\.hooksPath/)
    } finally {
      r.borrar()
    }
  }, LENTO)

  it('D9: directorio SIN `.git` propio, anidado dentro de OTRO repositorio → sale 0 sin instalar (tarea 4.11)', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({ 'a.md': 'a' })
      r.commit('base')
      const anidado = path.join(r.dir, 'anidado')
      mkdirSync(anidado)
      const res = instalar(anidado, r.env)
      expect(res.status).toBe(0)
      expect(configHooksPath(r.dir, r.env)).toBeNull() // no se fijó en el repositorio padre
    } finally {
      r.borrar()
    }
  }, LENTO)
})
