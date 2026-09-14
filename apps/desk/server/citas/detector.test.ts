import { describe, it, expect } from 'vitest'
import { detectar } from './detector'
import { repoEnMemoria, cita, anclada, abreviada } from '../testing/reposDePrueba'

describe('detectar · RQ-CV-08 comprobación mecánica básica', () => {
  it('una cita a una línea vacía bloquea; la misma cita a una línea con contenido pasa (rojos a, b)', () => {
    const rota = repoEnMemoria({
      LOCAL: {
        'origen.md': `Ver ${cita('citado.md', 3)}.`,
        'citado.md': 'uno\ndos\n\ncuatro',
      },
    })
    const resultadoRoto = detectar({ repo: rota, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultadoRoto.bloquea).toBe(true)
    expect(resultadoRoto.bloqueantes).toHaveLength(1)
    expect(resultadoRoto.bloqueantes[0]).toMatchObject({ fichero: 'citado.md', linea: 3 })

    const valida = repoEnMemoria({
      LOCAL: {
        'origen.md': `Ver ${cita('citado.md', 3)}.`,
        'citado.md': 'uno\ndos\ncontenido real\ncuatro',
      },
    })
    const resultadoValido = detectar({ repo: valida, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultadoValido.bloquea).toBe(false)
    expect(resultadoValido.comprobadas).toBe(1)
  })

  it('el extremo FINAL fuera de rango con el inicial OK bloquea nombrando el extremo final (rojo c, M4)', () => {
    const repo = repoEnMemoria({
      LOCAL: {
        'origen.md': `Ver ${cita('citado.md', 2, 9)}.`,
        'citado.md': 'uno\ndos\ntres',
      },
    })
    const resultado = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.bloquea).toBe(true)
    expect(resultado.bloqueantes[0]).toMatchObject({ fichero: 'citado.md', motivo: expect.stringContaining('final') })
  })

  it('el extremo INICIAL en línea en blanco con el final OK bloquea nombrando el extremo inicial (control de la otra dirección, M4)', () => {
    const repo = repoEnMemoria({
      LOCAL: {
        'origen.md': `Ver ${cita('citado.md', 1, 3)}.`,
        'citado.md': '\ndos\ntres',
      },
    })
    const resultado = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.bloquea).toBe(true)
    expect(resultado.bloqueantes[0]).toMatchObject({ fichero: 'citado.md', motivo: expect.stringContaining('inicial') })
  })

  it('cita anclada a una revisión real pasa; anclada a una revisión inventada bloquea (rojo d, M3)', () => {
    const repoReal = repoEnMemoria({
      LOCAL: { 'origen.md': `Ver ${anclada(cita('citado.md', 2), 'rev1')}.` },
      rev1: { 'citado.md': 'uno\ndos\ntres' },
    })
    const resultadoReal = detectar({ repo: repoReal, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultadoReal.bloquea).toBe(false)
    expect(resultadoReal.comprobadas).toBe(1)

    const repoInventada = repoEnMemoria({
      LOCAL: { 'origen.md': `Ver ${anclada(cita('citado.md', 2), 'noexiste')}.` },
    })
    const resultadoInventada = detectar({ repo: repoInventada, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultadoInventada.bloquea).toBe(true)
    expect(resultadoInventada.bloqueantes[0]).toMatchObject({ fichero: 'citado.md', motivo: expect.stringContaining('revisión') })
  })
})

describe('detectar · línea base (RQ-CV-09, M9, M10, M17)', () => {
  const arbolConCitaRota = () => repoEnMemoria({
    LOCAL: {
      'origen.md': `Ver ${cita('citado.md', 3)}.`,
      'citado.md': 'uno\ndos\n\ncuatro',
    },
  })

  it('una entrada de la base ya reparada, sin quitarla, pone el hook rojo; quitándola también, pasa (M9)', () => {
    const repoReparado = repoEnMemoria({
      LOCAL: {
        'origen.md': `Ver ${cita('citado.md', 3)}.`,
        'citado.md': 'uno\ndos\ntres\ncuatro',
      },
    })
    const entradaCaduca = { fichero: 'citado.md', linea: 3, cita: cita('citado.md', 3), motivo: 'línea vacía' }

    const conBase = detectar({ repo: repoReparado, arbolLocal: 'LOCAL', exclusiones: [], base: [entradaCaduca] })
    expect(conBase.bloquea).toBe(true)

    const sinEsaEntrada = detectar({ repo: repoReparado, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(sinEsaEntrada.bloquea).toBe(false)
    // «Reparada» significa comprobada y válida: sin esto, la prueba pasa también si no se cosecha nada.
    expect(sinEsaEntrada.comprobadas).toBe(1)
  })

  it('una cita rota nueva que no está en la base bloquea: la base no la absorbe sola (M10)', () => {
    const repo = arbolConCitaRota()
    const resultado = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.bloquea).toBe(true)
  })

  it('la misma cita rota, ya presente en la base, informa y no bloquea', () => {
    const repo = arbolConCitaRota()
    const entrada = { fichero: 'citado.md', linea: 3, cita: cita('citado.md', 3), motivo: 'línea vacía' }
    const resultado = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [entrada] })
    expect(resultado.bloquea).toBe(false)
  })
})

describe('detectar · abreviadas: se informan, nunca bloquean (RQ-CV-06, RQ-CV-09, M30)', () => {
  it('abreviada rota: aparece en el informe, no bloquea, no entra en la base; abreviada válida: entre las comprobadas', () => {
    const repoRota = repoEnMemoria({
      LOCAL: {
        'origen.md': `Primero ${cita('citado.md', 1)}, luego ${abreviada(3)}.`,
        'citado.md': 'uno\ndos\n\ncuatro',
      },
    })
    const resultadoRota = detectar({ repo: repoRota, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultadoRota.bloquea).toBe(false)
    expect(resultadoRota.bloqueantes).toHaveLength(0)
    expect(resultadoRota.abreviadasRotas).toHaveLength(1)
    expect(resultadoRota.abreviadasRotas[0]).toMatchObject({ fichero: 'citado.md', linea: 3 })

    const repoValida = repoEnMemoria({
      LOCAL: {
        'origen.md': `Primero ${cita('citado.md', 1)}, luego ${abreviada(2)}.`,
        'citado.md': 'uno\ndos\ntres\ncuatro',
      },
    })
    const resultadoValida = detectar({ repo: repoValida, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultadoValida.abreviadasRotas).toHaveLength(0)
    expect(resultadoValida.comprobadas).toBe(2) // la completa y la abreviada válida
  })
})

describe('detectar · un solo lote por árbol (D11)', () => {
  it('varias citas, con y sin ancla, se leen en UNA sola llamada a leerLote', () => {
    const base = repoEnMemoria({
      LOCAL: {
        'origen.md': [
          `Una: ${cita('a.md', 1)}.`,
          `Dos: ${cita('b.md', 1)}.`,
          `Tres: ${anclada(cita('c.md', 1), 'rev1')}.`,
        ].join('\n'),
        'a.md': 'contenido a',
        'b.md': 'contenido b',
      },
      rev1: { 'c.md': 'contenido c' },
    })
    let llamadas = 0
    const repoContado: typeof base = {
      ...base,
      leerLote(objetos) {
        llamadas++
        return base.leerLote(objetos)
      },
    }
    const resultado = detectar({ repo: repoContado, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.comprobadas).toBe(3)
    expect(llamadas).toBe(1)
  })

  it('una anclada vuelve al índice de SU PROPIA revisión sólo si el fichero no está en el sha local', () => {
    const repo = repoEnMemoria({
      LOCAL: { 'origen.md': `Ver ${anclada(cita('viejo.md', 2), 'rev1')}.` },
      rev1: { 'viejo.md': 'uno\ndos\ntres' },
    })
    const resultado = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.bloquea).toBe(false)
    expect(resultado.comprobadas).toBe(1)
  })
})

describe('detectar · M22 — un ejemplo de cita rota CON forma de cita bloquea; en prosa, sin forma, pasa', () => {
  it('regla de mutación 4: un ejemplo con forma de cita se trata como cita real', () => {
    const repoConEjemploEnFormaDeCita = repoEnMemoria({
      LOCAL: {
        // "vacio.md" no tiene línea 5: es justo el ejemplo de cita rota que la regla de mutación 4
        // pide escribir SIN forma de cita, porque el detector no distingue un ejemplo de una cita real.
        'doc.md': `Un ejemplo roto sería ${cita('vacio.md', 5)}.`,
        'vacio.md': 'uno\ndos',
      },
    })
    const resultadoConForma = detectar({ repo: repoConEjemploEnFormaDeCita, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultadoConForma.bloquea).toBe(true)

    const repoConEjemploEnProsa = repoEnMemoria({
      LOCAL: {
        'doc.md': 'Un ejemplo roto sería vacio.md en su línea 5, pero así no se escribe.',
        'vacio.md': 'uno\ndos',
      },
    })
    const resultadoEnProsa = detectar({ repo: repoConEjemploEnProsa, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultadoEnProsa.bloquea).toBe(false)
  })
})

describe('detectar · (a) y (b) también bloquean cuando la línea citada está fuera de rango (M24, M25)', () => {
  it('Dockerfile y .dockerignore: la cita válida pasa, la misma fuera de rango bloquea', () => {
    const repoValido = repoEnMemoria({
      LOCAL: {
        'doc.md': `${cita('Dockerfile', 2)} y ${cita('.dockerignore', 1)}.`,
        Dockerfile: 'FROM node\nEXPOSE 3000',
        '.dockerignore': 'node_modules',
      },
    })
    const resultadoValido = detectar({ repo: repoValido, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultadoValido.bloquea).toBe(false)
    expect(resultadoValido.comprobadas).toBe(2)

    const repoFueraDeRango = repoEnMemoria({
      LOCAL: {
        'doc.md': `${cita('Dockerfile', 9)} y ${cita('.dockerignore', 9)}.`,
        Dockerfile: 'FROM node\nEXPOSE 3000',
        '.dockerignore': 'node_modules',
      },
    })
    const resultadoRoto = detectar({ repo: repoFueraDeRango, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultadoRoto.bloquea).toBe(true)
    expect(resultadoRoto.bloqueantes).toHaveLength(2)
  })
})

describe('detectar · (c) la abreviada va SIEMPRE al fichero anterior, en los dos órdenes de validez (M26)', () => {
  it('«fichero A, abreviada, fichero B»: válida en A/vacía en B → comprobada; A y B intercambiados → rota', () => {
    // La cita PROPIA de A y de B apunta a la línea 1 (válida en ambos repos): lo único que cambia
    // entre los dos es la línea 3, que es la que la abreviada realmente comprueba.
    const doc = `${cita('a.md', 1)} abreviada ${abreviada(3)} luego ${cita('b.md', 1)}`

    const repoAValidaBVacia = repoEnMemoria({
      LOCAL: { 'doc.md': doc, 'a.md': 'uno\ndos\ntres', 'b.md': 'uno\ndos\n' },
    })
    const resultado1 = detectar({ repo: repoAValidaBVacia, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado1.abreviadasRotas).toHaveLength(0)

    const repoAVaciaBValida = repoEnMemoria({
      LOCAL: { 'doc.md': doc, 'a.md': 'uno\ndos\n', 'b.md': 'uno\ndos\ntres' },
    })
    const resultado2 = detectar({ repo: repoAVaciaBValida, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado2.abreviadasRotas).toHaveLength(1)
    expect(resultado2.bloquea).toBe(false) // una abreviada nunca bloquea (Q9)
  })
})

describe('detectar · RQ-CV-05, pasos 6-8 de D4: lo que no resuelve', () => {
  it('con barra y sin resolver bloquea como fichero inexistente; sin barra se salta e informa (1.28)', () => {
    const repo = repoEnMemoria({ LOCAL: { 'doc.md': `${cita('no/existe.md', 3)} y ${cita('noexiste.md', 3)}.` } })
    const resultado = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.bloqueantes).toEqual([expect.objectContaining({ fichero: 'no/existe.md', motivo: 'fichero inexistente' })])
    expect(resultado.saltadas.sinBarra).toBe(1)
  })
})

describe('detectar · RQ-CV-03: una ambigua bloquea sólo si está rota en TODAS sus candidatas (M15)', () => {
  const doc = { 'doc.md': `Ver ${cita('comun.md', 2)}.` }

  it('rota en todas sus candidatas bloquea', () => {
    const repo = repoEnMemoria({ LOCAL: { ...doc, 'a/comun.md': 'uno\n', 'b/comun.md': 'uno' } })
    const resultado = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.bloqueantes).toEqual([expect.objectContaining({ fichero: 'comun.md', linea: 2 })])
  })

  it('válida en una sola candidata se salta, no bloquea y suma 1 a las ambiguas saltadas', () => {
    const repo = repoEnMemoria({ LOCAL: { ...doc, 'a/comun.md': 'uno\ndos', 'b/comun.md': 'uno' } })
    const resultado = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.bloquea).toBe(false)
    expect(resultado.saltadas.ambiguas).toBe(1)
  })
})
