import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { ejecutar } from './cli'
import { detectar } from './detector'
import { repoGit } from './git'
import { repoGitTemporal, cita, anclada, type RepoGitDePrueba } from '../testing/reposDePrueba'

// Pruebas SINTÉTICAS del hook: git de verdad, en repositorios temporales aislados (§8 del diseño).
//
// Segunda mitad de hook.test.ts, partida el 2026-09-16. Juntos, los 19 bloques tardaban 66-70 s en un
// solo worker, y el RPC de vitest vence a los 60 s (DEFAULT_TIMEOUT de birpc): la suite salía con código
// 1 sin ninguna prueba rota. Aquí viven los ocho bloques del FINAL —los bordes y los tres modos del CLI—,
// elegidos porque el de «ruta no ASCII y git grep por encima de 1 MB» cuesta él solo 20,6 s: dejarlo
// arriba mantenía ese fichero en 55,9 s. Ni una aserción, ni un orden, ni un fixture cambian con el corte.
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

describe('hook · 3.10(a): SÓLO el modo hook lee stdin — `entrada` es una lectura perezosa', () => {
  it('con --sha, la lectura de stdin NO se invoca; en modo hook, se invoca UNA vez', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({ 'a.md': 'uno' })
      const local = r.commit('base')
      let llamadas = 0
      const entradaContada = () => { llamadas++; return `refs/heads/main ${local} refs/heads/main ${CEROS}${SALTO}` }

      const conSha = ejecutar({ argv: ['--sha', local], entrada: entradaContada, cwd: r.dir, env: r.env })
      expect(llamadas).toBe(0)
      expect(conSha.codigo).toBe(0)

      const enHook = ejecutar({ argv: [], entrada: entradaContada, cwd: r.dir, env: r.env })
      expect(llamadas).toBe(1)
      expect(enHook.codigo).toBe(0)
    } finally {
      r.borrar()
    }
  }, LENTO)
})

describe('hook · 3.10(b): --sha <rev> comprueba una revisión concreta, con índice remoto de origin/main', () => {
  it('cita rota en la revisión → salida 1; la misma cita válida → 0; sin origin/main dice NO HECHO, con él lo nombra', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({ 'citado.md': 'uno', 'doc.md': `Ver ${cita('citado.md', 5)}.` }) // rota: citado.md sólo tiene 1 línea
      const rota = r.commit('cita rota')
      const rojo = ejecutar({ argv: ['--sha', rota], entrada: () => '', cwd: r.dir, env: r.env })
      expect(rojo.codigo).toBe(1)
      expect(rojo.texto).toMatch(/índice remoto \.+ NO HECHO: no hay origin\/main/)

      r.escribir({ 'doc.md': `Ver ${cita('citado.md', 1)}.` })
      const valida = r.commit('cita válida')
      const verde = ejecutar({ argv: ['--sha', valida], entrada: () => '', cwd: r.dir, env: r.env })
      expect(verde.codigo).toBe(0)

      r.git('update-ref', 'refs/remotes/origin/main', valida)
      const conOrigin = ejecutar({ argv: ['--sha', valida], entrada: () => '', cwd: r.dir, env: r.env })
      expect(conOrigin.codigo).toBe(0)
      expect(conOrigin.texto).toMatch(/índice remoto \.+ origin\/main/)
    } finally {
      r.borrar()
    }
  }, LENTO)
})

describe('hook · 3.10(c): --generar-base escribe lineaBase.jsonl él mismo, ordenada, sin BOM ni CR', () => {
  it('una entrada por bloqueante, ordenada por documento y línea incluso con la MISMA cita repetida en el documento; commiteada, el hook pasa en verde (M8)', () => {
    const r = repoGitTemporal()
    try {
      r.escribir({
        'citado.md': 'uno',
        'b.md': [`Rota 1: ${cita('citado.md', 5)}.`, `Rota 2: ${cita('citado.md', 9)}.`].join(SALTO),
        // 'a.md' repite la MISMA cita (línea 1 y línea 3) con otra cita DISTINTA entre medias (línea 2):
        // `agrupar()` (detector.ts) casa por (documento, cita), así que las dos ocurrencias de la línea 1
        // caen en la MISMA entrada del Map y salen JUNTAS al iterar — sin el `.sort()` de `generarBase`
        // el orden natural sería a.md:1, a.md:3, a.md:2, no a.md:1, a.md:2, a.md:3.
        'a.md': [`Rota 1: ${cita('citado.md', 6)}.`, `Rota 2: ${cita('citado.md', 7)}.`, `Rota 1 otra vez: ${cita('citado.md', 6)}.`].join(SALTO),
      })
      r.commit('cinco roturas, dos documentos, una cita repetida en a.md')
      const { codigo, texto } = ejecutar({ argv: ['--generar-base'], entrada: () => '', cwd: r.dir, env: r.env })
      expect(codigo).toBe(0)
      expect(texto).toContain('5')

      const rutaAbs = path.join(r.dir, 'apps/desk/server/citas/lineaBase.jsonl')
      expect(existsSync(rutaAbs)).toBe(true)
      const bytes = readFileSync(rutaAbs)
      expect(bytes[0]).not.toBe(0xef) // el BOM UTF-8 empieza con el byte 0xEF; sin BOM, éste no es su primer byte
      expect(bytes.toString('utf8')).not.toContain('\r')
      const lineasBase = bytes.toString('utf8').split(SALTO).filter((l) => l.trim() !== '')
      expect(lineasBase).toHaveLength(5)
      const orden = lineasBase.map((l) => { const o = JSON.parse(l); return `${o.fichero}:${o.linea}` })
      expect(orden).toEqual(['a.md:1', 'a.md:2', 'a.md:3', 'b.md:1', 'b.md:2'])

      const local = r.commit('línea base generada')
      const { codigo: codigoHook, texto: textoHook } = push(r, local, CEROS)
      expect(codigoHook).toBe(0)
      expect(textoHook).toMatch(/línea base \.+ 5 informadas · 0 caducadas/)
    } finally {
      r.borrar()
    }
  }, LENTO)
})
