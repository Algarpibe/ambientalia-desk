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
    expect(resultadoRoto.bloqueantes[0]).toMatchObject({ fichero: 'origen.md', linea: 1, motivo: expect.stringContaining('línea 3 de citado.md') })

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
    // DCE-P3 (a): igualdad, no `stringContaining` — «fuera de rango» y «en línea vacía» son motivos
    // distintos y no intercambiables (RQ-CV-08), y la cuarta rama corrida antes de ésta los confundiría
    // (DCE-M2): `lineaVacia(undefined)` es verdadero.
    expect(resultado.bloqueantes[0]).toMatchObject({ fichero: 'origen.md', motivo: 'extremo final fuera de rango (línea 9 de citado.md)' })
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
    // DCE-P3 (b): igualdad, no `stringContaining` — fija el motivo entero del extremo inicial vacío.
    expect(resultado.bloqueantes[0]).toMatchObject({ fichero: 'origen.md', motivo: 'extremo inicial en línea vacía (línea 1 de citado.md)' })
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
    expect(resultadoInventada.bloqueantes[0]).toMatchObject({ fichero: 'origen.md', motivo: expect.stringContaining('revisión') })
  })

  it('DCE-P1: el extremo FINAL en línea vacía bloquea, con el motivo exacto (cuarta rama de rotura())', () => {
    const repo = repoEnMemoria({
      LOCAL: {
        'origen.md': `Ver ${cita('citado.md', 1, 3)}.`,
        // tres líneas: la 1 con contenido, la 3 VACÍA — hoy sólo se mira el extremo inicial
        'citado.md': 'uno\ndos\n',
      },
    })
    const resultado = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.bloquea).toBe(true)
    expect(resultado.bloqueantes[0]).toMatchObject({
      fichero: 'origen.md',
      linea: 1,
      motivo: 'extremo final en línea vacía (línea 3 de citado.md)',
    })
  })

  it('DCE-P3 (c): con los DOS extremos en línea vacía el motivo nombra el INICIAL, nunca el final (DCE-M1)', () => {
    const repo = repoEnMemoria({
      LOCAL: {
        'origen.md': `Ver ${cita('citado.md', 1, 3)}.`,
        'citado.md': '\ndos\n', // la 1 y la 3, las dos vacías
      },
    })
    const resultado = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.bloquea).toBe(true)
    expect(resultado.bloqueantes[0]).toMatchObject({ motivo: 'extremo inicial en línea vacía (línea 1 de citado.md)' })
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
    const entradaCaduca = { fichero: 'origen.md', linea: 1, cita: cita('citado.md', 3), motivo: 'línea vacía' }

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
    const entrada = { fichero: 'origen.md', linea: 1, cita: cita('citado.md', 3), motivo: 'línea vacía' }
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
    // H6: el motivo de una abreviada rota por contenido lleva DETRÁS el del extremo que falla, con su
    // línea — el mismo que RQ-CV-08 da a la completa. `citado.md` tiene la 3 vacía.
    expect(resultadoRota.abreviadasRotas[0]).toMatchObject({ fichero: 'origen.md', linea: 1, motivo: 'abreviada rota (atribuida a citado.md): extremo inicial en línea vacía (línea 3 de citado.md)' })

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

describe('detectar · RQ-CV-06: la abreviada se lee en su ancla, propia o heredada', () => {
  it('DCE-P4 (i): hereda el ancla de la completa anterior de su línea — válida en la revisión, vacía en LOCAL', () => {
    const base = repoEnMemoria({
      LOCAL: {
        'origen.md': `Ver ${anclada(cita('citado.md', 1), 'rev1')} y ${abreviada(3)}.`,
        'citado.md': 'uno\ndos\n', // la 3, VACÍA en el sha local: leerla aquí la daría por rota
      },
      rev1: { 'citado.md': 'uno\ndos\ntres' }, // la 3, con contenido en la revisión heredada
    })
    let llamadas = 0
    const repoContado: typeof base = { ...base, arbol(rev) { llamadas++; return base.arbol(rev) } }
    const resultado = detectar({ repo: repoContado, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.abreviadasRotas).toHaveLength(0)
    expect(resultado.comprobadas).toBe(2) // la completa anclada y la abreviada heredada
    // RQ-CV-13 / DCE-M11: la abreviada comparte la caché de árboles con la completa de su misma revisión.
    expect(llamadas).toBe(1)
  })

  it('DCE-P4 (ii), el otro signo: rota EN la revisión heredada, el motivo nombra la revisión y el extremo', () => {
    const repo = repoEnMemoria({
      LOCAL: {
        'origen.md': `Ver ${anclada(cita('citado.md', 1), 'rev1')} y ${abreviada(3)}.`,
        'citado.md': 'uno\ndos\ntres', // válida en LOCAL: si se leyera aquí, no saldría rota
      },
      rev1: { 'citado.md': 'uno\ndos\n' }, // la 3, VACÍA en la revisión heredada
    })
    const resultado = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.abreviadasRotas).toHaveLength(1)
    expect(resultado.abreviadasRotas[0]).toMatchObject({
      fichero: 'origen.md',
      linea: 1,
      motivo: 'abreviada rota (atribuida a citado.md en rev1): extremo inicial en línea vacía (línea 3 de citado.md)',
    })
    expect(resultado.bloquea).toBe(false) // una abreviada nunca bloquea (Q9)
  })

  it('DCE-P4 (iii), b.2: una completa válida SIN ancla en medio deja la abreviada en el sha local, y su motivo no nombra revisión (DCE-M7)', () => {
    const repo = repoEnMemoria({
      LOCAL: {
        'origen.md': `Ver ${anclada(cita('citado.md', 1), 'rev1')}, también ${cita('citado.md', 2)} y ${abreviada(3)}.`,
        'citado.md': 'uno\ndos\n', // la 3, VACÍA en el sha local, que es donde hay que leerla
      },
      rev1: { 'citado.md': 'uno\ndos\ntres' },
    })
    const resultado = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.abreviadasRotas).toHaveLength(1)
    expect(resultado.abreviadasRotas[0]).toMatchObject({
      motivo: 'abreviada rota (atribuida a citado.md): extremo inicial en línea vacía (línea 3 de citado.md)',
    })
  })

  it('DCE-P5: el ancla PROPIA de la abreviada gana sobre la heredada (DCE-M4)', () => {
    const repo = repoEnMemoria({
      LOCAL: {
        'origen.md': `Ver ${anclada(cita('citado.md', 1), 'rev1')} y ${anclada(abreviada(3), 'rev2')}.`,
        'citado.md': 'uno\ndos\n', // la 3, vacía en el sha local
      },
      rev1: { 'citado.md': 'uno\ndos\n' }, // y vacía también en la heredada
      rev2: { 'citado.md': 'uno\ndos\ntres' }, // sólo en su ancla PROPIA tiene contenido
    })
    const resultado = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.abreviadasRotas).toHaveLength(0)
    expect(resultado.comprobadas).toBe(2)
  })

  it('DCE-P6 (a): una mención pelada de OTRO fichero corta la herencia; la abreviada vuelve al sha local (DCE-M3)', () => {
    const repo = repoEnMemoria({
      LOCAL: {
        'origen.md': `Ver ${anclada(cita('citado.md', 1), 'rev1')} y \`otro.md\` ${abreviada(3)}.`,
        'citado.md': 'uno\ndos\ntres',
        'otro.md': 'x\ny\nz', // la 3 válida en LOCAL; `otro.md` NO existe en rev1
      },
      rev1: { 'citado.md': 'uno\ndos\ntres' },
    })
    const resultado = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.abreviadasRotas).toHaveLength(0)
    expect(resultado.comprobadas).toBe(2) // la completa y la abreviada, leída en LOCAL
  })

  it('DCE-P6 (b), b.1: una mención pelada del MISMO fichero NO corta la herencia', () => {
    const repo = repoEnMemoria({
      LOCAL: {
        'origen.md': `Ver ${anclada(cita('citado.md', 1), 'rev1')} y \`citado.md\` ${abreviada(3)}.`,
        'citado.md': 'uno\ndos\n', // la 3, vacía en el sha local
      },
      rev1: { 'citado.md': 'uno\ndos\ntres' },
    })
    const resultado = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.abreviadasRotas).toHaveLength(0)
    expect(resultado.comprobadas).toBe(2)
  })

  it('DCE-P7 (i): ancla propia a una revisión que NO pela — rota informativa, ni bloqueante ni «no legible»', () => {
    const repo = repoEnMemoria({
      LOCAL: {
        'origen.md': `Ver ${cita('citado.md', 1)} y ${anclada(abreviada(3), 'inventada')}.`,
        'citado.md': 'uno\ndos\ntres', // válida en LOCAL: el rojo viene del ancla, no del contenido
      },
    })
    const resultado = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.abreviadasRotas).toHaveLength(1)
    expect(resultado.abreviadasRotas[0]).toMatchObject({
      fichero: 'origen.md',
      motivo: 'abreviada rota (atribuida a citado.md en inventada): revisión inexistente',
    })
    expect(resultado.bloquea).toBe(false)
    expect(resultado.saltadas.noLegibles).toBe(0)
  })

  it('DCE-P7 (ii): ancla propia a una revisión REAL que no contiene el fichero atribuido (DCE-M8)', () => {
    const repo = repoEnMemoria({
      LOCAL: {
        'origen.md': `Ver ${cita('citado.md', 1)} y ${anclada(abreviada(3), 'rev1')}.`,
        'citado.md': 'uno\ndos\ntres',
      },
      rev1: { 'otro.md': 'la revisión existe, pero sin el fichero atribuido' },
    })
    const resultado = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.abreviadasRotas).toHaveLength(1)
    expect(resultado.abreviadasRotas[0]).toMatchObject({
      motivo: 'abreviada rota (atribuida a citado.md en rev1): fichero inexistente en la revisión',
    })
    expect(resultado.bloquea).toBe(false)
    expect(resultado.saltadas.noLegibles).toBe(0)
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

describe('detectar · 3.8: una sola resolución de árbol por revisión DISTINTA (RQ-CV-13, D11)', () => {
  it('tres anclas a la MISMA revisión cuestan 1 llamada a arbol() (hoy 2N: dos pasadas por cita)', () => {
    const base = repoEnMemoria({
      LOCAL: {
        'doc.md': [
          `Una: ${anclada(cita('a.md', 1), 'rev1')}.`,
          `Dos: ${anclada(cita('b.md', 1), 'rev1')}.`,
          `Tres: ${anclada(cita('c.md', 1), 'rev1')}.`,
        ].join('\n'),
      },
      rev1: { 'a.md': 'uno', 'b.md': 'uno', 'c.md': 'uno' },
    })
    let llamadas = 0
    const repoContado: typeof base = { ...base, arbol(rev) { llamadas++; return base.arbol(rev) } }
    const resultado = detectar({ repo: repoContado, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.comprobadas).toBe(3)
    expect(llamadas).toBe(1)
  })

  it('dos anclas a revisiones DISTINTAS cuestan 2 llamadas a arbol()', () => {
    const base = repoEnMemoria({
      LOCAL: {
        'doc.md': [
          `Una: ${anclada(cita('a.md', 1), 'rev1')}.`,
          `Dos: ${anclada(cita('b.md', 1), 'rev2')}.`,
        ].join('\n'),
      },
      rev1: { 'a.md': 'uno' },
      rev2: { 'b.md': 'uno' },
    })
    let llamadas = 0
    const repoContado: typeof base = { ...base, arbol(rev) { llamadas++; return base.arbol(rev) } }
    const resultado = detectar({ repo: repoContado, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.comprobadas).toBe(2)
    expect(llamadas).toBe(2)
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

describe('detectar · RQ-CV-06 de punta a punta: nombre con punto inicial y mención pelada (M25, M27)', () => {
  it('abreviadas válidas tras un nombre con punto inicial: todas entre las comprobadas, ninguna huérfana ni rota', () => {
    // `Dockerfile` tiene 2 líneas y `.dockerignore` 4: las abreviadas 3 y 4 sólo son válidas atribuidas a
    // `.dockerignore`. Si el nombre con punto no contara, irían a `Dockerfile` y saldrían rotas.
    const repo = repoEnMemoria({
      LOCAL: {
        'doc.md': `${cita('Dockerfile', 1)} ${abreviada(2)} y \`.dockerignore\` ${abreviada(3)} ${abreviada(4)}`,
        Dockerfile: 'FROM node\nEXPOSE 3000',
        '.dockerignore': 'node_modules\ndist\n.env\ncoverage',
      },
    })
    const resultado = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.comprobadas).toBe(4) // la completa y las tres abreviadas
    expect(resultado.saltadas.huerfanas).toBe(0)
    expect(resultado.abreviadasRotas).toHaveLength(0)
    expect(resultado.bloquea).toBe(false)
  })

  // `.dockerignore` resuelve; `.git` no está trackeado y `docs` es un directorio: ninguno de los dos resuelve.
  const lineaConPeladas = (ultima: number) =>
    `\`.dockerignore\` ${abreviada(1)} cerca de \`.git\` ${abreviada(2)} y \`docs\` ${abreviada(ultima)}`
  const arbolConPeladas = { '.dockerignore': 'node_modules\ndist\n.env', 'docs/guia.md': 'guía' }

  it('(d) la mención pelada que resuelve captura; .git y docs no: las tres abreviadas válidas, comprobadas y ninguna huérfana', () => {
    const repo = repoEnMemoria({ LOCAL: { ...arbolConPeladas, 'doc.md': lineaConPeladas(3) } })
    const resultado = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.comprobadas).toBe(3)
    expect(resultado.saltadas.huerfanas).toBe(0)
    expect(resultado.saltadas.noLegibles).toBe(0)
    expect(resultado.abreviadasRotas).toHaveLength(0)
    expect(resultado.bloquea).toBe(false)
  })

  it('(d) la misma línea con la última abreviada fuera de rango: figura en la lista de abreviadas rotas y sale 0', () => {
    const repo = repoEnMemoria({ LOCAL: { ...arbolConPeladas, 'doc.md': lineaConPeladas(9) } })
    const resultado = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.abreviadasRotas).toHaveLength(1)
    // H6: con el extremo detrás. `.dockerignore` tiene 3 líneas, así que la 9 queda FUERA DE RANGO.
    expect(resultado.abreviadasRotas[0]).toMatchObject({ fichero: 'doc.md', linea: 1, motivo: 'abreviada rota (atribuida a .dockerignore): extremo inicial fuera de rango (línea 9 de .dockerignore)' })
    expect(resultado.bloquea).toBe(false)
    expect(resultado.comprobadas).toBe(2)
  })
})

describe('detectar · RQ-CV-05, pasos 6-8 de D4: lo que no resuelve', () => {
  it('con barra y sin resolver bloquea como fichero inexistente; sin barra se salta e informa (1.28)', () => {
    const repo = repoEnMemoria({ LOCAL: { 'doc.md': `${cita('no/existe.md', 3)} y ${cita('noexiste.md', 3)}.` } })
    const resultado = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.bloqueantes).toEqual([expect.objectContaining({ fichero: 'doc.md', cita: cita('no/existe.md', 3), motivo: 'fichero inexistente' })])
    expect(resultado.saltadas.sinBarra).toBe(1)
  })
})

describe('detectar · RQ-CV-03: una ambigua bloquea sólo si está rota en TODAS sus candidatas (M15)', () => {
  const doc = { 'doc.md': `Ver ${cita('comun.md', 2)}.` }

  it('rota en todas sus candidatas bloquea', () => {
    const repo = repoEnMemoria({ LOCAL: { ...doc, 'a/comun.md': 'uno\n', 'b/comun.md': 'uno' } })
    const resultado = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.bloqueantes).toEqual([expect.objectContaining({ fichero: 'doc.md', linea: 1, cita: cita('comun.md', 2) })])
  })

  it('válida en una sola candidata se salta, no bloquea y suma 1 a las ambiguas saltadas', () => {
    const repo = repoEnMemoria({ LOCAL: { ...doc, 'a/comun.md': 'uno\ndos', 'b/comun.md': 'uno' } })
    const resultado = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.bloquea).toBe(false)
    expect(resultado.saltadas.ambiguas).toBe(1)
  })

  const docConRango = { 'doc.md': `Ver ${cita('comun.md', 1, 3)}.` }

  it('DCE-P2: el extremo final vacío cuenta como rota EN SU CANDIDATA; con la otra rota también, la ambigua bloquea', () => {
    const repo = repoEnMemoria({
      // a/comun.md tiene la 3 VACÍA (cuarta rama); b/comun.md, una sola línea (final fuera de rango)
      LOCAL: { ...docConRango, 'a/comun.md': 'uno\ndos\n', 'b/comun.md': 'uno' },
    })
    const resultado = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.bloquea).toBe(true)
    expect(resultado.bloqueantes[0]).toMatchObject({
      fichero: 'doc.md',
      linea: 1,
      motivo: 'ambigua, rota en sus 2 candidatas (línea 3 de comun.md)',
    })
  })

  it('DCE-P2, control del otro signo: con la otra candidata VÁLIDA se salta como ambigua y no bloquea (RQ-CV-03)', () => {
    const repo = repoEnMemoria({
      LOCAL: { ...docConRango, 'a/comun.md': 'uno\ndos\n', 'b/comun.md': 'uno\ndos\ntres' },
    })
    const resultado = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.bloquea).toBe(false)
    expect(resultado.saltadas.ambiguas).toBe(1)
  })
})

describe('detectar · defensivo: contenido "tracked" pero no legible por git no se descarta en silencio (tarea 2.26, decisión c)', () => {
  it('una completa y una abreviada cuyo contenido llega null desde leerLote pese a estar en el índice cuentan como noLegibles', () => {
    const base = repoEnMemoria({
      LOCAL: {
        'origen.md': `Ver ${cita('gitlink', 1)} y luego ${abreviada(1)}.`,
        gitlink: 'contenido que no debería leerse',
      },
    })
    const repoIlegible: typeof base = {
      ...base,
      leerLote(objetos) {
        const mapa = base.leerLote(objetos)
        mapa.set('LOCAL:gitlink', null) // simula un submódulo: tracked, pero sin blob legible
        return mapa
      },
    }
    const resultado = detectar({ repo: repoIlegible, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.saltadas.noLegibles).toBe(2)
    expect(resultado.bloquea).toBe(false)
    expect(resultado.comprobadas).toBe(0)

    // control del otro signo: sin el defecto, las dos se comprueban con normalidad
    const resultadoNormal = detectar({ repo: base, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultadoNormal.saltadas.noLegibles).toBe(0)
    expect(resultadoNormal.comprobadas).toBe(2)
  })
})

describe('detectar · divergencia nº 8 (tarea 2.26): la anclada ambigua se resuelve por el índice del sha local (RQ-CV-03)', () => {
  it('rota en todas sus candidatas de la revisión ancla bloquea; válida en una sola se salta como ambigua', () => {
    const repoRota = repoEnMemoria({
      LOCAL: { 'doc.md': `Ver ${anclada(cita('comun.md', 2), 'rev1')}.`, 'a/comun.md': 'uno', 'b/comun.md': 'uno' },
      rev1: { 'a/comun.md': 'uno', 'b/comun.md': 'uno' },
    })
    const resultadoRota = detectar({ repo: repoRota, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultadoRota.bloqueantes).toHaveLength(1)

    const repoValida = repoEnMemoria({
      LOCAL: { 'doc.md': `Ver ${anclada(cita('comun.md', 2), 'rev1')}.`, 'a/comun.md': 'uno', 'b/comun.md': 'uno' },
      rev1: { 'a/comun.md': 'uno\ndos', 'b/comun.md': 'uno' },
    })
    const resultadoValida = detectar({ repo: repoValida, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultadoValida.bloquea).toBe(false)
    expect(resultadoValida.saltadas.ambiguas).toBe(1)
  })
})

describe('detectar · 3.9: RQ-CV-03 en ancladas AMBIGUAS — una candidata AUSENTE en la revisión no bloquea sola', () => {
  it('una candidata ausente en la revisión y otra válida: no bloquea, cuenta como ambigua', () => {
    const repo = repoEnMemoria({
      LOCAL: { 'doc.md': `Ver ${anclada(cita('comun.md', 1), 'rev1')}.`, 'a/comun.md': 'uno', 'b/comun.md': 'uno' },
      rev1: { 'a/comun.md': 'uno\ndos' }, // sólo a/comun.md existe en rev1; b/comun.md está AUSENTE, no rota
    })
    const resultado = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.bloquea).toBe(false)
    expect(resultado.saltadas.ambiguas).toBe(1)
  })

  it('control del otro signo: TODAS las candidatas ausentes en la revisión sigue bloqueando', () => {
    const repo = repoEnMemoria({
      LOCAL: { 'doc.md': `Ver ${anclada(cita('comun.md', 1), 'rev1')}.`, 'a/comun.md': 'uno', 'b/comun.md': 'uno' },
      rev1: {}, // ni a/comun.md ni b/comun.md existen en rev1
    })
    const resultado = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(resultado.bloquea).toBe(true)
    expect(resultado.bloqueantes[0]).toMatchObject({ motivo: 'fichero inexistente' })
  })
})

describe('detectar · D6: la base y el informe llevan el DOCUMENTO que cita y la línea de la cita (tarea 2.0)', () => {
  const SALTO = String.fromCharCode(10)

  it('(i) bloqueante, abreviada rota y entrada de base van por el documento y su línea, no por el fichero citado', () => {
    const repo = repoEnMemoria({
      LOCAL: { 'doc.md': ['título', `Ver ${cita('citado.md', 9)} y ${abreviada(8)}.`].join(SALTO), 'citado.md': 'uno' },
    })
    const sinBase = detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [] })
    expect(sinBase.bloqueantes).toEqual([expect.objectContaining({ fichero: 'doc.md', linea: 2 })])
    expect(sinBase.abreviadasRotas).toEqual([expect.objectContaining({ fichero: 'doc.md', linea: 2 })])
    const entrada = { fichero: 'doc.md', linea: 2, cita: cita('citado.md', 9), motivo: 'extremo inicial fuera de rango' }
    expect(detectar({ repo, arbolLocal: 'LOCAL', exclusiones: [], base: [entrada] }).bloquea).toBe(false)
  })

  it('(ii) la misma cita rota en A y en B, con la base de A: reparar en A y romper en B NO se compensa', () => {
    const citado = ['uno', 'dos'].join(SALTO)
    const antes = repoEnMemoria({ LOCAL: { 'A.md': `Ver ${cita('citado.md', 9)}.`, 'B.md': `Ver ${cita('citado.md', 2)}.`, 'citado.md': citado } })
    const base = detectar({ repo: antes, arbolLocal: 'LOCAL', exclusiones: [], base: [] }).bloqueantes // lo que generaría --generar-base
    const despues = repoEnMemoria({ LOCAL: { 'A.md': `Ver ${cita('citado.md', 2)}.`, 'B.md': `Ver ${cita('citado.md', 9)}.`, 'citado.md': citado } })
    const resultado = detectar({ repo: despues, arbolLocal: 'LOCAL', exclusiones: [], base })
    expect(resultado.bloquea).toBe(true)
    expect(resultado.bloqueantes).toEqual([expect.objectContaining({ fichero: 'B.md' })])
    expect(resultado.caducadas).toEqual([expect.objectContaining({ fichero: 'A.md' })])
  })
})
