import { describe, it, expect } from 'vitest'
// Partido por el RPC de vitest (60 s): los bordes y los tres modos del CLI están en hook.bordes.test.ts.
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { EXCLUSIONES, ejecutar } from './cli'
import { detectar } from './detector'
import { repoGit } from './git'
import { repoGitTemporal, cita, anclada, abreviada, type RepoGitDePrueba } from '../testing/reposDePrueba'

// Pruebas SINTÉTICAS del hook: git de verdad, en repositorios temporales aislados (§8 del diseño).
const LENTO = 30_000
const SALTO = String.fromCharCode(10)
const CEROS = '0'.repeat(40)
const lineas = (...l: string[]): string => l.join(SALTO)

/** Lo que git le pasa a `pre-push`: una línea por referencia, `<ref local> <sha local> <ref remota> <sha remoto>`.
 *  Tarea 3.10(a): `entrada` es una función perezosa; sólo el modo hook la invoca. */
function push(r: RepoGitDePrueba, local: string, remoto: string, ref = 'refs/heads/main') {
  const texto = `${ref} ${local} ${ref} ${remoto}${SALTO}`
  return ejecutar({ argv: ['origin', 'https://example.invalid/repo.git'], entrada: () => texto, cwd: r.dir, env: r.env })
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

describe('hook · divergencia nº 8, primera mitad: la anclada resuelve su fichero por el índice del sha local (tarea 2.26)', () => {
  it('ancla pelada válida en su revisión → comprobada (i); a línea vacía → bloquea (ii); a ruta ausente en la revisión → bloquea «fichero inexistente» (iii)', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({ 'otro.md': 'nada' })
      const sinFichero = r.commit('sin sub/citado.md todavía')
      r.escribir({ 'sub/citado.md': lineas('uno', '', 'tres') })
      const conFichero = r.commit('añade sub/citado.md')
      r.escribir({
        'doc.md': [
          `(i) ${anclada(cita('citado.md', 1), conFichero)}.`,
          `(ii) ${anclada(cita('citado.md', 2), conFichero)}.`,
          `(iii) ${anclada(cita('citado.md', 1), sinFichero)}.`,
        ].join(SALTO),
      })
      const { codigo, texto } = push(r, r.commit('doc con las tres anclas peladas'), conFichero)
      expect(codigo).toBe(1)
      expect(texto).toMatch(/comprobadas \.+ 1$/m)
      expect(texto).toContain(`doc.md, línea 2: ${cita('citado.md', 2)} en \`${conFichero}\` — extremo inicial en línea vacía`)
      expect(texto).toContain(`doc.md, línea 3: ${cita('citado.md', 1)} en \`${sinFichero}\` — fichero inexistente`)
    } finally {
      r.borrar()
    }
  }, LENTO)
})

describe('hook · invariante de conservación (decisión c de Gerencia, 2026-09-14): toda cita cosechada cae en EXACTAMENTE una cifra', () => {
  it('un caso de cada categoría, más el ancla ilegible: la suma de cifras cuadra con `cosechadas`', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({
        'a.md': lineas('uno', 'dos'),
        'a/comun.md': lineas('uno', 'dos'),
        'b/comun.md': 'uno',
        'dir/sub/x.md': 'x',
      })
      const anterior = r.commit('base')
      r.escribir({
        'doc.md': [
          `Comprobada ${cita('a.md', 1)} y abreviada rota ${abreviada(9)}.`,
          `Sin barra ${cita('nada.md', 1)} y directorio ${cita('dir/sub', 1)}.`,
          `Ambigua ${cita('comun.md', 1)} y huérfana ${abreviada(1)}.`,
          `Fuera ${cita('~/x.md', 3)}, hora ${cita('10', 30)} y puerto ${cita('http://localhost', 3001)}.`,
          `Rota nueva ${cita('a.md', 7)} y rota en la base ${cita('a.md', 8)}.`,
          `Ancla ilegible ${anclada(cita('inventado.md', 1), anterior)}.`,
        ].join(SALTO),
      })
      const local = r.commit('doc con un caso de cada categoría')
      const repo = repoGit(r.dir, r.env)
      const arbol = repo.arbol(local) as string
      const base = [{ fichero: 'doc.md', linea: 5, cita: cita('a.md', 8), motivo: 'extremo inicial fuera de rango' }]
      const resultado = detectar({ repo, arbolLocal: arbol, exclusiones: [], base })

      const CITAS_ESCRITAS = 12 // cuenta LITERAL de las citas del doc, no derivada del propio detector
      expect(resultado.cosechadas).toBe(CITAS_ESCRITAS)
      const sumaSaltadas = Object.values(resultado.saltadas).reduce((a, b) => a + b, 0)
      const suma = resultado.comprobadas + sumaSaltadas + resultado.fueraDelRepositorio + resultado.noSonCitas +
        resultado.abreviadasRotas.length + resultado.bloqueantes.length + resultado.informadas
      expect(suma).toBe(CITAS_ESCRITAS)

      expect(resultado.comprobadas).toBe(1)
      expect(resultado.saltadas).toEqual({ sinBarra: 1, ambiguas: 1, directorios: 1, huerfanas: 1, anclasSinResolver: 1, noLegibles: 0 })
      expect(resultado.fueraDelRepositorio).toBe(1)
      expect(resultado.noSonCitas).toBe(2)
      expect(resultado.abreviadasRotas).toHaveLength(1)
      expect(resultado.bloqueantes).toHaveLength(1)
      expect(resultado.informadas).toBe(1)
    } finally {
      r.borrar()
    }
  }, LENTO)

  it('DCE-P8: un caso de cada camino NUEVO (RQ-CV-06 y RQ-CV-08) — la suma cuadra Y el desglose es exacto', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({ 'citado.md': lineas('uno', 'dos', 'tres') })
      const conTres = r.commit('citado.md con la línea 3 llena; ausente.md todavía no existe')
      r.escribir({ 'citado.md': lineas('uno', 'dos', ''), 'ausente.md': lineas('a', 'b', 'c') })
      const sinTres = r.commit('la línea 3 de citado.md queda vacía; aparece ausente.md')
      r.escribir({
        'doc.md': [
          `Heredada válida ${anclada(cita('citado.md', 1), conTres)} y ${abreviada(3)}.`,
          `Heredada rota por contenido ${anclada(cita('citado.md', 1), sinTres)} y ${abreviada(3)}.`,
          `Ancla propia que no pela ${cita('citado.md', 1)} y ${anclada(abreviada(1), 'noesunarevision')}.`,
          `Fichero ausente en su revisión ${cita('ausente.md', 1)} y ${anclada(abreviada(1), conTres)}.`,
          `Ancla propia que gana ${anclada(cita('citado.md', 1), sinTres)} y ${anclada(abreviada(3), conTres)}.`,
          `Huérfana con ancla propia ${anclada(abreviada(2), 'inventada')}.`,
          `Completa con el final vacío ${cita('citado.md', 1, 3)}.`,
        ].join(SALTO),
      })
      const local = r.commit('doc con un caso de cada camino nuevo')
      const repo = repoGit(r.dir, r.env)
      const arbol = repo.arbol(local) as string
      const resultado = detectar({ repo, arbolLocal: arbol, exclusiones: [], base: [] })

      const CITAS_ESCRITAS = 12 // cuenta LITERAL de las citas del doc, no derivada del propio detector
      expect(resultado.cosechadas).toBe(CITAS_ESCRITAS)
      const sumaSaltadas = Object.values(resultado.saltadas).reduce((a, b) => a + b, 0)
      const suma = resultado.comprobadas + sumaSaltadas + resultado.fueraDelRepositorio + resultado.noSonCitas +
        resultado.abreviadasRotas.length + resultado.bloqueantes.length + resultado.informadas
      expect(suma).toBe(CITAS_ESCRITAS)

      // D5: la suma sola NO distingue DCE-M5 —mandar el fallo de ancla a otro sumando no la cambia—.
      // El desglose sí: 7 comprobadas (las 5 completas válidas, la heredada válida y la de ancla propia),
      // 3 abreviadas rotas (la heredada rota y los dos fallos de ancla), 1 huérfana y 1 bloqueante.
      expect({
        comprobadas: resultado.comprobadas,
        saltadas: resultado.saltadas,
        fueraDelRepositorio: resultado.fueraDelRepositorio,
        noSonCitas: resultado.noSonCitas,
        abreviadasRotas: resultado.abreviadasRotas.length,
        bloqueantes: resultado.bloqueantes.length,
        informadas: resultado.informadas,
      }).toEqual({
        comprobadas: 7,
        saltadas: { sinBarra: 0, ambiguas: 0, directorios: 0, huerfanas: 1, anclasSinResolver: 0, noLegibles: 0 },
        fueraDelRepositorio: 0,
        noSonCitas: 0,
        abreviadasRotas: 3,
        bloqueantes: 1,
        informadas: 0,
      })
    } finally {
      r.borrar()
    }
  }, LENTO)
})

describe('hook · M5, divergencia #1 del diseño: el barrido lee el sha COMMITEADO, nunca el índice ni el disco (tareas 2.12-2.13)', () => {
  it('cita rota en fichero sin trackear se ignora; el mismo fichero, con `git add` Y COMMIT, bloquea', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({ 'citado.md': 'uno' })
      const base = r.commit('base')
      r.escribir({ 'doc.md': `Ver ${cita('citado.md', 5)}.` }) // rota; citado.md sólo tiene 1 línea
      expect(push(r, base, CEROS).codigo).toBe(0) // doc.md sigue sin trackear: el push ni lo ve
      const conDoc = r.commit('trackea y commitea doc.md')
      expect(push(r, conDoc, base).codigo).toBe(1)
    } finally {
      r.borrar()
    }
  }, LENTO)
})

describe('hook · M14, RQ-CV-07: las SEIS exclusiones del barrido, y el control fuera de ellas bloquea (tareas 2.14-2.15)', () => {
  it('las cinco de directorio/extensión, verificadas de punta a punta con el hook (sin lineaBase.jsonl presente)', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({
        'citado.md': 'uno',
        'openspec/changes/archive/x.md': `Ver ${cita('citado.md', 5)}.`,
        '.claude/skills/superpowers-main/x.md': `Ver ${cita('citado.md', 5)}.`,
        '.agent/skills/x.md': `Ver ${cita('citado.md', 5)}.`,
        'docs/artefactos/x.md': `Ver ${cita('citado.md', 5)}.`,
        'datos.csv': `Ver ${cita('citado.md', 5)}.`,
      })
      const sinControl = r.commit('cinco exclusiones, sin el control')
      expect(push(r, sinControl, CEROS).codigo).toBe(0)
      r.escribir({ 'doc.md': `Ver ${cita('citado.md', 5)}.` })
      const conControl = r.commit('añade el control fuera de las exclusiones')
      expect(push(r, conControl, sinControl).codigo).toBe(1)
    } finally {
      r.borrar()
    }
  }, LENTO)

  it('la sexta, apps/desk/server/citas/lineaBase.jsonl, verificada directamente sobre `repo.lineas()` (D6: tiene forma de cita dentro)', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({
        'citado.md': 'uno',
        'openspec/changes/archive/x.md': `Ver ${cita('citado.md', 5)}.`,
        'apps/desk/server/citas/lineaBase.jsonl': `Ver ${cita('citado.md', 5)}.`,
      })
      const local = r.commit('la base con forma de cita dentro')
      const repo = repoGit(r.dir, r.env)
      const arbol = repo.arbol(local) as string
      expect(repo.lineas(arbol, EXCLUSIONES)).toEqual([])
    } finally {
      r.borrar()
    }
  }, LENTO)
})

describe('hook · D12: borrado de rama, sha que no pela a árbol, y dos referencias al mismo árbol (tareas 2.16-2.17)', () => {
  it('borrado de rama (sha local en ceros) sale 0 con una línea que lo dice, nunca cuelga ni bloquea sin comprobar', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({ citado: 'uno' })
      const base = r.commit('base')
      const { codigo, texto } = push(r, CEROS, base)
      expect(codigo).toBe(0)
      expect(texto).toContain('rama borrada')
    } finally {
      r.borrar()
    }
  }, LENTO)

  it('un sha local que no pela a árbol (una etiqueta a un blob) se informa "no comprobado" y no bloquea', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({ citado: 'uno' })
      r.commit('base')
      const shaBlob = r.git('rev-parse', 'HEAD:citado') // el blob de "citado" YA existente, NUNCA un árbol
      const { codigo, texto } = push(r, shaBlob, CEROS)
      expect(codigo).toBe(0)
      expect(texto).toContain('no comprobado')
    } finally {
      r.borrar()
    }
  }, LENTO)

  it('dos referencias que comparten el MISMO árbol cuestan un solo barrido (un solo bloque "citas ·")', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({ 'citado.md': 'uno', 'doc.md': `Ver ${cita('citado.md', 1)}.` })
      const local = r.commit('mismo árbol para dos refs')
      const entrada = `refs/heads/main ${local} refs/heads/main ${CEROS}${SALTO}refs/heads/otra ${local} refs/heads/otra ${CEROS}${SALTO}`
      const { codigo, texto } = ejecutar({ argv: [], entrada: () => entrada, cwd: r.dir, env: r.env })
      expect(codigo).toBe(0)
      expect(texto.split('citas ·')).toHaveLength(2) // UN solo bloque (una cadena vacía antes + un bloque)
    } finally {
      r.borrar()
    }
  }, LENTO)

  it('base ilegible o línea de stdin mal formada: salida 2 con mensaje, nunca una excepción sin capturar (defecto D12 cerrado)', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({ 'citado.md': 'uno' })
      const local = r.commit('base')
      expect(ejecutar({ argv: [], entrada: () => `esto no son cuatro campos${SALTO}`, cwd: r.dir, env: r.env }).codigo).toBe(2)

      r.escribir({ 'apps/desk/server/citas/lineaBase.jsonl': 'esto no es JSON' })
      const conBaseIlegible = r.commit('base ilegible')
      expect(push(r, conBaseIlegible, local).codigo).toBe(2)
    } finally {
      r.borrar()
    }
  }, LENTO)

  it('un fallo de git (ErrorDeGit) en cualquier operación se convierte en salida 2 con mensaje, NUNCA se escapa (mismo catch compartido)', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({ 'citado.md': 'uno' })
      const local = r.commit('base')
      // GIT_DIR a una ruta inexistente: `identidades()` (git shortlog, SIN lista de `admite`) falla con
      // un status que el catch compartido convierte en salida 2 — nunca una excepción sin capturar.
      const envRoto = { ...r.env, GIT_DIR: path.join(r.dir, 'no-existe', '.git') }
      const salida = ejecutar({ argv: [], entrada: () => `refs/heads/main ${local} refs/heads/main ${CEROS}${SALTO}`, cwd: r.dir, env: envRoto })
      expect(salida.codigo).toBe(2)
      expect(salida.texto).toContain('citas: fallo operativo')
    } finally {
      r.borrar()
    }
  }, LENTO)
})

