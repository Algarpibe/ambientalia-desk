import { describe, it, expect } from 'vitest'
import { cosechar } from './cosecha'
import { cita, abreviada } from '../testing/reposDePrueba'

const linea = (fichero: string, texto: string, n = 1) => ({ fichero, n, texto })

describe('cosechar · requisitos (a) y (b) de la cosecha', () => {
  it('(a) un nombre sin extensión, como Dockerfile, se cosecha como cita completa (M24)', () => {
    const citas = cosechar([linea('doc.md', `Ver ${cita('Dockerfile', 18)}.`)], { resuelveAFichero: () => true })
    expect(citas).toHaveLength(1)
    expect(citas[0]).toMatchObject({ tipo: 'completa', fichero: 'Dockerfile', desde: 18 })
  })

  it('(b) un nombre que empieza por punto, como .dockerignore, se cosecha como cita completa (M25)', () => {
    const citas = cosechar([linea('doc.md', `Ver ${cita('.dockerignore', 3)}.`)], { resuelveAFichero: () => true })
    expect(citas).toHaveLength(1)
    expect(citas[0]).toMatchObject({ tipo: 'completa', fichero: '.dockerignore', desde: 3 })
  })
})

describe('cosechar · (d) la mención pelada que resuelve cuenta como fichero al que atribuir (M27)', () => {
  it('.dockerignore (resuelve), .git y docs (no resuelven) — las abreviadas siguen atribuidas a .dockerignore', () => {
    const resuelve = (nombre: string) => nombre === '.dockerignore'
    const texto = `\`.dockerignore\` cerca de \`.git\` y \`docs\` ${abreviada(1)} y ${abreviada(9)}`
    const citas = cosechar([linea('doc.md', texto)], { resuelveAFichero: resuelve })
    const abreviadas = citas.filter((c) => c.tipo === 'abreviada')
    expect(abreviadas).toHaveLength(2)
    expect(abreviadas.every((a) => a.atribuidoA === '.dockerignore')).toBe(true)
  })

  it('control: sin (d), o capturando cualquier token pelado resuelva o no, la atribución se pierde', () => {
    // Control de un signo: si la mención pelada NUNCA cuenta (aunque resuelva), la abreviada queda huérfana.
    const noCuentaNunca = () => false
    const texto = `\`.dockerignore\` ${abreviada(1)}`
    const citas = cosechar([linea('doc.md', texto)], { resuelveAFichero: noCuentaNunca })
    const abrev = citas.find((c) => c.tipo === 'abreviada')
    expect(abrev).toMatchObject({ atribuidoA: null })
  })
})

describe('cosechar · (c) atribución de la abreviada al fichero ANTERIOR por índice (RQ-CV-06, M26)', () => {
  it('«fichero A, abreviada, fichero B»: la abreviada se atribuye a A, nunca al B posterior', () => {
    const texto = `${cita('a.md', 1)} abreviada ${abreviada(2)} luego ${cita('b.md', 1)}`
    const citas = cosechar([linea('doc.md', texto)], { resuelveAFichero: () => true })
    const abrev = citas.find((c) => c.tipo === 'abreviada')
    expect(abrev).toMatchObject({ atribuidoA: 'a.md' })
  })
})

describe('cosechar · D1, los dos cortes de Lbc', () => {
  it('corte 1: una completa que NO resuelve, aunque haya un fichero válido antes, deja la abreviada huérfana', () => {
    const resuelve = (nombre: string) => nombre === 'valido.md'
    const texto = `${cita('valido.md', 1)} luego ${cita('noresuelve.md', 1)} y ${abreviada(2)}`
    const citas = cosechar([linea('doc.md', texto)], { resuelveAFichero: resuelve })
    const abrev = citas.find((c) => c.tipo === 'abreviada')
    expect(abrev).toMatchObject({ atribuidoA: null })
  })

  it('corte 2: una abreviada tras la barra de una celda de tabla queda huérfana', () => {
    const texto = `| ${cita('valido.md', 1)} | ${abreviada(2)} |`
    const citas = cosechar([linea('doc.md', texto)], { resuelveAFichero: () => true })
    const abrev = citas.find((c) => c.tipo === 'abreviada')
    expect(abrev).toMatchObject({ atribuidoA: null })
  })

  it('control del otro signo: sin barra de por medio, la misma abreviada SÍ se atribuye', () => {
    const texto = `${cita('valido.md', 1)} y ${abreviada(2)}`
    const citas = cosechar([linea('doc.md', texto)], { resuelveAFichero: () => true })
    const abrev = citas.find((c) => c.tipo === 'abreviada')
    expect(abrev).toMatchObject({ atribuidoA: 'valido.md' })
  })
})

describe('cosechar · RQ-CV-16 y D3: host:puerto dentro de una URL no es cita', () => {
  it('un host:puerto dentro de una URL con esquema no se cuenta ni comprobada ni saltada', () => {
    const citas = cosechar([linea('doc.md', 'Ver `http://localhost:3001` para el servidor.')], { resuelveAFichero: () => false })
    expect(citas).toHaveLength(1)
    expect(citas[0].tipo).toBe('no-es-cita')
  })

  it('control del otro signo: una cita real de dos puntos fuera de una URL se cosecha con normalidad', () => {
    const citas = cosechar([linea('doc.md', `Ver ${cita('imagen/Dockerfile', 18)}.`)], { resuelveAFichero: () => true })
    expect(citas).toHaveLength(1)
    expect(citas[0].tipo).toBe('completa')
  })
})

describe('cosechar · RQ-CV-04, M28: la categoría "fuera del repositorio"', () => {
  it('un token que empieza por ~/ se clasifica fuera del repositorio, nunca como bloqueante', () => {
    const citas = cosechar([linea('doc.md', 'Ver `~/.claude/skills/foo.md:3` para el contrato.')], { resuelveAFichero: () => false })
    expect(citas).toHaveLength(1)
    expect(citas[0].tipo).toBe('fuera-de-repositorio')
  })

  it('control del otro signo: una ruta relativa que no existe sigue siendo una cita completa (bloqueante aguas abajo)', () => {
    const citas = cosechar([linea('doc.md', `Ver ${cita('no/existe.md', 3)}.`)], { resuelveAFichero: () => false })
    expect(citas).toHaveLength(1)
    expect(citas[0].tipo).toBe('completa')
  })
})
