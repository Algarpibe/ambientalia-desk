import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
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
      const { codigo, texto } = ejecutar({ argv: [], entrada, cwd: r.dir, env: r.env })
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
      expect(ejecutar({ argv: [], entrada: `esto no son cuatro campos${SALTO}`, cwd: r.dir, env: r.env }).codigo).toBe(2)

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
      const salida = ejecutar({ argv: [], entrada: `refs/heads/main ${local} refs/heads/main ${CEROS}${SALTO}`, cwd: r.dir, env: envRoto })
      expect(salida.codigo).toBe(2)
      expect(salida.texto).toContain('citas: fallo operativo')
    } finally {
      r.borrar()
    }
  }, LENTO)
})

describe('hook · ruta no ASCII y salida de `git grep` por encima de 1 MB (tareas 2.18-2.19)', () => {
  it('un fichero con nombre no ASCII se cosecha y se comprueba con normalidad (core.quotepath=off)', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({ 'año-2026.md': 'uno\ndos', 'doc.md': `Ver ${cita('año-2026.md', 2)}.` })
      const local = r.commit('ruta no ASCII')
      expect(push(r, local, CEROS).codigo).toBe(0)
      r.escribir({ 'doc.md': `Ver ${cita('año-2026.md', 9)}.` })
      expect(push(r, r.commit('rota'), local).codigo).toBe(1)
    } finally {
      r.borrar()
    }
  }, LENTO)

  it('una salida de `git grep` por encima de 1 MB no se trunca ni falla por tamaño de búfer', () => {
    const r = repoGitTemporal()
    try {
      const N = 20_000
      const lineasCitadas = Array.from({ length: N }, (_, i) => `línea ${i}`)
      const lineasDoc = Array.from({ length: N }, (_, i) => `Línea ${i}: ${cita('citado.md', i + 1)}.`)
      r.escribir({ 'citado.md': lineasCitadas.join(SALTO), 'doc.md': lineasDoc.join(SALTO) })
      const local = r.commit('más de 1 MB de líneas candidatas')
      const { codigo, texto } = push(r, local, CEROS)
      expect(codigo).toBe(0)
      expect(texto).toMatch(new RegExp(`comprobadas \\.+ ${N}$`, 'm'))
    } finally {
      r.borrar()
    }
  }, 60_000)
})

describe('hook · M20 (RQ-CV-06): el ancla protege contra el desfase de CONTENIDO — SÓLO en repositorio sintético (tarea 2.20)', () => {
  it('desanclada, tras insertar una línea delante, cae en línea vacía y bloquea; anclada a la revisión ANTERIOR, pasa', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({ 'citado.md': lineas('uno', 'dos', 'tres') })
      const anterior = r.commit('antes de insertar')
      r.escribir({ 'citado.md': lineas('', 'uno', 'dos', 'tres') }) // inserta una línea vacía delante
      const conInsercion = r.commit('inserta una línea delante')
      r.escribir({ 'doc.md': `Desanclada: ${cita('citado.md', 1)}. Anclada: ${anclada(cita('citado.md', 1), anterior)}.` })
      const { codigo, texto } = push(r, r.commit('doc con las dos formas'), conInsercion)
      expect(codigo).toBe(1)
      expect(texto).toContain(`doc.md, línea 1: ${cita('citado.md', 1)} — extremo inicial en línea vacía`)
      expect(texto).not.toContain(anclada(cita('citado.md', 1), anterior)) // la anclada NO está entre las bloqueantes
    } finally {
      r.borrar()
    }
  }, LENTO)
})

describe('hook · M21, RQ-CV-11: el aviso de escalada — más de una identidad, sin tocar el código de salida (tareas 2.22-2.23)', () => {
  it('una identidad: sin aviso; dos identidades: aviso visible, MISMO código de salida', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({ 'a.md': 'uno' })
      const c1 = r.commit('autora única')
      expect(push(r, c1, CEROS).texto).not.toMatch(/identidad/)

      r.escribir({ 'b.md': 'dos' })
      spawnSync('git', ['add', '-A'], { cwd: r.dir, env: r.env })
      const envSegunda = { ...r.env, GIT_AUTHOR_NAME: 'Otra Persona', GIT_AUTHOR_EMAIL: 'otra@example.com', GIT_COMMITTER_NAME: 'Otra Persona', GIT_COMMITTER_EMAIL: 'otra@example.com' }
      spawnSync('git', ['commit', '-q', '-m', 'segunda identidad'], { cwd: r.dir, env: envSegunda })
      const c2 = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: r.dir, env: r.env, encoding: 'utf8' }).stdout.trim()
      const dos = push(r, c2, c1)
      expect(dos.texto).toMatch(/identidad/)
      expect(dos.codigo).toBe(0) // el aviso NUNCA cambia el código de salida
    } finally {
      r.borrar()
    }
  }, LENTO)
})

describe('hook · confirmación (RQ-CV-01, coste): las anclas se leen agrupadas por (revisión, fichero) en UN solo lote (tarea 2.24)', () => {
  it('cuatro anclas en DOS revisiones distintas se resuelven en una sola llamada a leerLote', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({ 'a.md': 'uno', 'b.md': 'uno' })
      const rev1 = r.commit('rev1')
      r.escribir({ 'a.md': lineas('uno', 'dos'), 'b.md': lineas('uno', 'dos'), 'c.md': 'uno' })
      const rev2 = r.commit('rev2')
      r.escribir({
        'doc.md': [
          anclada(cita('a.md', 1), rev1),
          anclada(cita('b.md', 1), rev1),
          anclada(cita('a.md', 2), rev2),
          anclada(cita('c.md', 1), rev2),
        ].join(SALTO),
      })
      const local = r.commit('cuatro anclas, dos revisiones')
      const repoBase = repoGit(r.dir, r.env)
      let llamadas = 0
      const repoContado: typeof repoBase = { ...repoBase, leerLote: (objetos) => { llamadas++; return repoBase.leerLote(objetos) } }
      const arbol = repoBase.arbol(local) as string
      const resultado = detectar({ repo: repoContado, arbolLocal: arbol, exclusiones: [], base: [] })
      expect(resultado.comprobadas).toBe(4)
      expect(llamadas).toBe(1)
    } finally {
      r.borrar()
    }
  }, LENTO)
})

describe('hook · RQ-CV-10 (decisión b): un fichero de texto que git cree binario se declara en el informe, no se calla (tarea 2.25)', () => {
  it('un .md trackeado con un NUL en sus primeros 8.000 bytes: la cita no se cosecha ni bloquea, y la línea dice 1; sin el NUL, dice 0 y bloquea', () => {
    const r = repoGitTemporal()
    try {
      const conNul = Buffer.concat([Buffer.from(`Ver ${cita('citado.md', 5)}.` + SALTO), Buffer.from([0])])
      writeFileSync(path.join(r.dir, 'citado.md'), 'uno')
      writeFileSync(path.join(r.dir, 'doc.md'), conNul)
      const local = r.commit('doc con un NUL: git lo cree binario')
      const con = push(r, local, CEROS)
      expect(con.codigo).toBe(0) // no se cosecha, así que no bloquea aunque la cita esté rota
      expect(con.texto).toMatch(/texto que git cree binario \.+ 1 +\(no barridos\)/)

      writeFileSync(path.join(r.dir, 'doc.md'), `Ver ${cita('citado.md', 5)}.`) // el mismo texto, SIN el NUL
      const sinNul = push(r, r.commit('quita el NUL'), local)
      expect(sinNul.texto).toMatch(/texto que git cree binario \.+ 0 +\(no barridos\)/)
      expect(sinNul.codigo).toBe(1) // ahora sí se cosecha, y bloquea
    } finally {
      r.borrar()
    }
  }, LENTO)
})
