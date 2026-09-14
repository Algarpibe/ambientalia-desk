import { describe, it, expect } from 'vitest'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { ejecutar } from './cli'
import { repoGitTemporal, cita, type RepoGitDePrueba } from '../testing/reposDePrueba'

// Pruebas SINTÉTICAS del hook: git de verdad, en repositorios temporales aislados (§8 del diseño).
const LENTO = 30_000
const SALTO = String.fromCharCode(10)
const CEROS = '0'.repeat(40)
const lineas = (...l: string[]): string => l.join(SALTO)

/** Lo que git le pasa a `pre-push`: una línea por referencia, `<ref local> <sha local> <ref remota> <sha remoto>`. */
function push(r: RepoGitDePrueba, local: string, remoto: string, ref = 'refs/heads/main') {
  return ejecutar({ argv: ['origin', 'https://example.invalid/repo.git'], entrada: `${ref} ${local} ${ref} ${remoto}${SALTO}`, cwd: r.dir, env: r.env })
}

describe('arnés · repositorio git temporal aislado (tarea 2.1)', () => {
  it('un GIT_DIR hostil heredado del padre no desvía el repositorio sintético (§9 del diseño)', () => {
    const senuelo = mkdtempSync(path.join(tmpdir(), 'citas-senuelo-'))
    const anterior = process.env.GIT_DIR
    process.env.GIT_DIR = path.join(senuelo, 'git')
    try {
      const r = repoGitTemporal()
      try {
        r.escribir({ 'a.md': 'a' })
        r.commit('uno')
        expect(existsSync(path.join(r.dir, '.git'))).toBe(true)
        expect(existsSync(path.join(senuelo, 'git'))).toBe(false)
      } finally {
        r.borrar()
      }
    } finally {
      if (anterior === undefined) delete process.env.GIT_DIR
      else process.env.GIT_DIR = anterior
      rmSync(senuelo, { recursive: true, force: true })
    }
  }, LENTO)
})

describe('hook · M1: un push que sólo mueve líneas en el fichero citado bloquea (tareas 2.2-2.3)', () => {
  it('mover líneas del citado sin tocar el documento bloquea; con la cita reparada, pasa', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({ 'citado.md': lineas('a', 'b', 'c', '', 'e'), 'doc.md': `Ver ${cita('citado.md', 3)}.` })
      const remoto = r.commit('base')
      r.escribir({ 'citado.md': lineas('a', 'b', '', 'e', 'c') })
      const movido = r.commit('mueve c al final')
      expect(push(r, movido, remoto).codigo).toBe(1)
      r.escribir({ 'doc.md': `Ver ${cita('citado.md', 5)}.` })
      expect(push(r, r.commit('repara la cita'), movido).codigo).toBe(0)
    } finally {
      r.borrar()
    }
  }, LENTO)
})

describe('hook · rojo g y M7: el push que renombra un fichero hace bloquear sus citas (tareas 2.4-2.5)', () => {
  it('la cita con barra y la pelada bloquean como «existía en <sha remoto>»; la pelada no se salta', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({ 'docs/viejo.md': 'uno', 'doc.md': `${cita('docs/viejo.md', 1)} y ${cita('viejo.md', 1)}` })
      const remoto = r.commit('base')
      r.git('mv', 'docs/viejo.md', 'docs/nuevo.md')
      const { codigo, texto } = push(r, r.commit('renombra'), remoto)
      expect(texto).toMatch(/sin barra y sin resolver 0/)
      expect(texto.split(`existía en ${remoto.slice(0, 7)}`)).toHaveLength(3)
      expect(codigo).toBe(1)
    } finally {
      r.borrar()
    }
  }, LENTO)
})

describe('hook · rama nueva: el índice remoto sale de origin/main, y si no se puede se dice (tareas 2.6-2.7)', () => {
  it('con origin/main la pelada al fichero renombrado bloquea; sin él, o con el objeto ausente, NO HECHO', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({ 'viejo.md': 'uno', 'doc.md': `Ver ${cita('viejo.md', 1)}.` })
      const base = r.commit('base')
      r.git('mv', 'viejo.md', 'nuevo.md')
      const local = r.commit('renombra')
      const sinOrigin = push(r, local, CEROS, 'refs/heads/rama')
      expect(sinOrigin.texto).toMatch(/índice remoto \.+ NO HECHO: no hay origin\/main/)
      expect(sinOrigin.codigo).toBe(0)
      expect(push(r, local, 'f'.repeat(40)).texto).toMatch(/índice remoto \.+ NO HECHO: objeto ausente/)
      r.git('update-ref', 'refs/remotes/origin/main', base)
      const conOrigin = push(r, local, CEROS, 'refs/heads/rama')
      expect(conOrigin.texto).toMatch(/índice remoto \.+ origin\/main/)
      expect(conOrigin.codigo).toBe(1)
    } finally {
      r.borrar()
    }
  }, LENTO)
})

describe('hook · M8: una reparación sin commitear no cuenta (tareas 2.8-2.9)', () => {
  it('la cita reparada sólo en el árbol de trabajo sigue bloqueando el commit que se empuja', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({ 'citado.md': 'uno', 'doc.md': `Ver ${cita('citado.md', 2)}.` })
      const roto = r.commit('cita rota')
      r.escribir({ 'doc.md': `Ver ${cita('citado.md', 1)}.` })
      expect(push(r, roto, CEROS).codigo).toBe(1)
    } finally {
      r.borrar()
    }
  }, LENTO)
})

describe('hook · M29: una rotura que entró sin hook la caza el push siguiente, aunque no la toque (tareas 2.10-2.11)', () => {
  it('bloquea sin base; con esa cita en la base, la informa y sale 0', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({ 'citado.md': lineas('uno', 'dos'), 'doc.md': `Ver ${cita('citado.md', 2)}.` })
      r.commit('base')
      r.escribir({ 'citado.md': 'uno' })
      const sinHook = r.commit('acorta el citado; se empujó sin hook')
      r.escribir({ 'otro.md': 'nada' })
      expect(push(r, r.commit('no toca ni el documento ni el citado'), sinHook).codigo).toBe(1)
      const entrada = { fichero: 'doc.md', linea: 1, cita: cita('citado.md', 2), motivo: 'extremo inicial fuera de rango' }
      r.escribir({ 'apps/desk/server/citas/lineaBase.jsonl': JSON.stringify(entrada) + SALTO })
      const conBase = push(r, r.commit('la cita entra en la base a mano'), sinHook)
      expect(conBase.texto).toMatch(/línea base \.+ 1 informadas · 0 caducadas/)
      expect(conBase.codigo).toBe(0)
    } finally {
      r.borrar()
    }
  }, LENTO)
})
