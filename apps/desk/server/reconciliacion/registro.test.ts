import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { arbolEnMemoria } from '../testing/arbolDePrueba'
import { reconciliar } from './comprobaciones'

/**
 * Guardián del REGISTRO: comprueba que `openspec/config.yaml` cumple lo que `RQ-RC-07` y `RQ-RC-08`
 * exigen de él.
 *
 * Regla de mutación 2: un guardián que lee un fichero de datos se prueba **ensuciando el fichero
 * vigilado**, no retocando el guardián. Por eso cada comprobación va con su control del otro signo,
 * que le da el mismo texto con el desvío metido dentro y exige que se ponga roja. Mutar el guardián
 * sólo demostraría que se ejecuta; mutar lo vigilado demuestra que DISCRIMINA.
 */

const SALTO = String.fromCharCode(10)
const RUTA_CONFIG = 'openspec/config.yaml'
const RAIZ = path.resolve(__dirname, '../../../..')

const configReal = (): string => readFileSync(path.join(RAIZ, RUTA_CONFIG), 'utf8')

/** Los `- id:` del bloque `reglas_de_lectura`, en su orden. Parser mínimo, como el del núcleo. */
function idsDeReglasDeLectura(texto: string): string[] {
  const lineas = texto.split(SALTO).map((l) => l.replace(/\r$/, ''))
  const inicio = lineas.findIndex((l) => l.trimEnd() === '  reglas_de_lectura:')
  if (inicio === -1) return []
  const ids: string[] = []
  for (const linea of lineas.slice(inicio + 1)) {
    const m = /^ {4}- id: (.+)$/.exec(linea)
    if (m) {
      ids.push(m[1]!.trim())
      continue
    }
    if (linea.trim() === '' || linea.startsWith('    ')) continue
    break
  }
  return ids
}

/** La comprobación 4 del núcleo, corrida sobre un `config.yaml` cualquiera. */
const defectosDeRegistro = (textoConfig: string): string => {
  const c = reconciliar(arbolEnMemoria({ ficheros: { [RUTA_CONFIG]: textoConfig } })).find((x) => x.id === 4)
  return (c?.cifras ?? []).join(' ')
}

describe('registro · RQ-RC-07: `unidad_de_avance` declara CINCO reglas de lectura', () => {
  it('los ids son exactamente `a`, `b`, `c`, `d` y `e`, en ese orden', () => {
    expect(idsDeReglasDeLectura(configReal())).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('las TRES primeras siguen intactas: el denominador fechado, las dos cifras y el alcance hasta F1F', () => {
    const texto = configReal()
    expect(texto).toContain('El denominador se mueve, y se fecha en cada corte.')
    expect(texto).toContain('Se publican SIEMPRE dos cifras, nunca una.')
    expect(texto).toContain('El §5 sólo cubre Fase 0 y Fase 1')
  })

  it('M3, control del otro signo: quitando la regla (d) de una COPIA, el guardián se pone rojo', () => {
    const sucio = configReal().replace(/^ {4}- id: d$[\s\S]*?(?=^ {4}- id: |^ {2}[a-z_]+:)/m, '')
    expect(idsDeReglasDeLectura(sucio)).not.toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(idsDeReglasDeLectura(sucio)).toEqual(['a', 'b', 'c', 'e'])
  })
})

describe('registro · RQ-RC-08: las DOCE entradas de `incumplimientos_vivos` declaran `estado`', () => {
  it('cero defectos de registro sobre el fichero real', () => {
    expect(defectosDeRegistro(configReal())).toContain('0 defectos de registro')
  })

  it('las doce están, y ninguna se cuenta por ausencia', () => {
    expect(defectosDeRegistro(configReal())).toContain('12 entradas')
  })

  it('control del otro signo: borrando UN `estado` de una copia, aparece el defecto', () => {
    const sucio = configReal().replace(/^ {4}estado: CERRADO$/m, '    verificado: true')
    expect(defectosDeRegistro(sucio)).toContain('1 defectos de registro')
  })
})

/** La comprobación 1 del núcleo, corrida sobre el `config.yaml` real y las specs de disco. */
const capacidades = (textoConfig: string, specs: readonly string[]) => {
  const ficheros: Record<string, string> = { [RUTA_CONFIG]: textoConfig }
  for (const n of specs) ficheros['openspec/specs/' + n + '/spec.md'] = '# ' + n
  return reconciliar(arbolEnMemoria({ ficheros })).find((x) => x.id === 1)
}

const specsEnDisco = (): string[] =>
  readdirSync(path.join(RAIZ, 'openspec/specs'), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)

describe('registro · RQ-RC-01 y RQ-RC-09: ninguna spec de disco queda fuera de `capabilities`', () => {
  it('cero huérfanas sobre el fichero real: las entradas son objetos con `name:`, no una lista plana', () => {
    const c = capacidades(configReal(), specsEnDisco())
    expect(c?.hallazgos.map((h) => h.clave)).toEqual([])
  })

  it('control del otro signo: una spec en disco que NO está declarada sí sale huérfana', () => {
    const c = capacidades(configReal(), [...specsEnDisco(), 'una-que-nadie-declaro'])
    expect(c?.hallazgos.map((h) => h.clave)).toEqual(['una-que-nadie-declaro'])
  })
})

describe('registro · el barrido real destapa lo que un árbol sintético no puede (R2.3.3)', () => {
  it('cuenta las capacidades UNA vez: `- name: X` no es además un elemento de lista plana', () => {
    const c = capacidades(configReal(), specsEnDisco())
    expect(c?.cifras[0]).toBe('21 declaradas') // F1B-12: alta de `calendario-laboral` (R-2, RQ-CL-12); F1A-03: alta de `gases-patron`
  })

  it('sin lectura de código no hay divergencia que reportar: decirla sería inventar el hallazgo', () => {
    const c5 = reconciliar(arbolEnMemoria({ ficheros: { [RUTA_CONFIG]: configReal() } })).find((x) => x.id === 5)
    // `transiciones` y `estados` declaran «ERROR si difiere», pero el barrido NO lee su cifra del
    // código todavía: marcarlas afirma una divergencia que nadie ha medido.
    expect(c5?.hallazgos.map((h) => h.clave)).not.toContain('transiciones')
    expect(c5?.hallazgos.map((h) => h.clave)).not.toContain('estados')
  })

  it('y `esperas`, que sí se lee del código, tampoco se marca: su divergencia es LEGÍTIMA', () => {
    const c5 = reconciliar(arbolEnMemoria({ ficheros: { [RUTA_CONFIG]: configReal() } })).find((x) => x.id === 5)
    expect(c5?.hallazgos.map((h) => h.clave)).not.toContain('esperas')
  })
})

/** El bloque `- id: <id>` … hasta el siguiente id o clave de dos espacios (misma regex acotada que M3). */
const bloqueDeRegla = (texto: string, id: string): string => {
  const patron = new RegExp(`^ {4}- id: ${id}$[\\s\\S]*?(?=^ {4}- id: |^ {2}[a-z_]+:)`, 'm')
  return patron.exec(texto)?.[0] ?? ''
}

describe('registro · RQ-RC-07: el TEXTO de las reglas (d) y (e) está en el registro', () => {
  it('el bloque de la regla (d) declara el motivo: "por trabajo" y "por dictamen"', () => {
    const bloqueD = bloqueDeRegla(configReal(), 'd')
    expect(bloqueD).toContain('por trabajo')
    expect(bloqueD).toContain('por dictamen')
  })

  it('control del otro signo: quitando el motivo del bloque (d) de una COPIA, deja de contenerlo', () => {
    const sucio = configReal().replace('por trabajo o por dictamen', 'sin decir el motivo')
    const bloqueD = bloqueDeRegla(sucio, 'd')
    expect(bloqueD).not.toContain('por trabajo')
    expect(bloqueD).not.toContain('por dictamen')
  })

  it('el bloque de la regla (e) declara: UN SOLO `tanda:` y «cuenta en parte»', () => {
    const bloqueE = bloqueDeRegla(configReal(), 'e')
    expect(bloqueE).toContain('UN SOLO `tanda:`')
    expect(bloqueE).toContain('cuenta en parte')
  })

  it('control del otro signo: quitando la regla (e) completa de una COPIA, su bloque deja de contener el texto', () => {
    const sucio = configReal().replace(/^ {4}- id: e$[\s\S]*?(?=^ {4}- id: |^ {2}[a-z_]+:)/m, '')
    const bloqueE = bloqueDeRegla(sucio, 'e')
    expect(bloqueE).not.toContain('UN SOLO `tanda:`')
    expect(bloqueE).not.toContain('cuenta en parte')
  })
})

const RUTA_R14 = 'docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md'
const r14Real = (): string => readFileSync(path.join(RAIZ, RUTA_R14), 'utf8')

/** Todos los `proposal.md` bajo `openspec/changes/`, con la ruta relativa y de barras normales. */
function proposalsReales(dir = 'openspec/changes'): Record<string, string> {
  const salida: Record<string, string> = {}
  for (const e of readdirSync(path.join(RAIZ, dir), { withFileTypes: true })) {
    const ruta = dir + '/' + e.name
    if (e.isDirectory()) Object.assign(salida, proposalsReales(ruta))
    else if (e.name === 'proposal.md') salida[ruta] = readFileSync(path.join(RAIZ, ruta), 'utf8')
  }
  return salida
}

/** La comprobación 2 del núcleo sobre un `config.yaml` y una R01.4 cualesquiera, con los proposals reales. */
const numeradorSobre = (textoConfig: string, plan: string) => {
  const ficheros = { ...proposalsReales(), [RUTA_CONFIG]: textoConfig, [RUTA_R14]: plan }
  return reconciliar(arbolEnMemoria({ ficheros })).find((x) => x.id === 2)!
}

const tandas = (c: { cifras: readonly string[] }, etiqueta: string): string[] => {
  const texto = c.cifras.find((x) => x.includes(etiqueta))
  if (texto === undefined) throw new Error('falta la cifra «' + etiqueta + '»')
  const resto = texto.slice(texto.indexOf(': ') + 2)
  return resto === '—' ? [] : resto.split(', ')
}

/** La R01.4 con una fila de ID NUEVO, dentro del §C (antes de su `---`) o justo después de él. */
function conFilaNueva(plan: string, dentro: boolean): string {
  const lineas = plan.split(SALTO)
  const inicio = lineas.findIndex((l) => l.startsWith('## C · '))
  const fin = inicio + 1 + lineas.slice(inicio + 1).findIndex((l) => /^---\s*$/.test(l.replace(/\r$/, '')))
  lineas.splice(dentro ? fin : fin + 1, 0, '| F2-09 | fila de prueba | S | 2027 | pendiente | — |')
  return lineas.join(SALTO)
}

describe('registro · RQ-RC-10: el árbol real registra NUEVE cierres por commit, sin defectos', () => {
  it('10e · F0-00, F0-01, F0-02, F0-03, F1A-01, F1A-02, F1A-04, F1A-05 y F1B-01 cuentan por commit, y la comprobación 2 no trae ningún defecto de registro', () => {
    const c = numeradorSobre(configReal(), r14Real())
    expect(tandas(c, 'cerradas por commit declarado')).toEqual(['F0-00', 'F0-01', 'F0-02', 'F0-03', 'F1A-01', 'F1A-02', 'F1A-04', 'F1A-05', 'F1B-01'])
    expect(c.hallazgos.filter((h) => h.detalle.includes('defecto de registro'))).toEqual([])
  })

  it('mutación 2 · quitando el `prueba:` de F0-02 de una COPIA del config, cuentan 8 y el defecto nombra F0-02 y `prueba`', () => {
    const sucio = configReal().replace(/^ {4}prueba: "openspec\/changes\/F0-03\/proposal\.md:21[^\r\n]*\r?\n/m, '')
    expect(sucio).not.toBe(configReal())
    const c = numeradorSobre(sucio, r14Real())
    expect(tandas(c, 'cerradas por commit declarado')).toEqual(['F0-00', 'F0-01', 'F0-03', 'F1A-01', 'F1A-02', 'F1A-04', 'F1A-05', 'F1B-01'])
    const h = c.hallazgos.find((x) => x.detalle.includes('defecto de registro'))
    expect(h?.clave).toBe('F0-02')
    expect(h?.detalle).toContain('`prueba`')
  })
})

describe('registro · RQ-RC-11 y RQ-RC-12 sobre la R01.4 real y los proposals reales', () => {
  it('12a · el denominador es 78', () => {
    expect(numeradorSobre(configReal(), r14Real()).cifras.find((x) => x.startsWith('denominador'))).toBe('denominador: 78 tandas del §C de la R01.4')
  })

  it('11f/05g · «en curso» son exactamente SEIS, con F0-04, y F0-04 no cuenta por commit', () => {
    const c = numeradorSobre(configReal(), r14Real())
    expect(tandas(c, 'en curso, aparte y sin sumar')).toEqual(['F0-04', 'F1B-04', 'F1B-07', 'F1B-08', 'F1B-11', 'F1C-05'])
    expect(tandas(c, 'cerradas por commit declarado')).not.toContain('F0-04')
  })

  it('una cabecera de F0-01..03 fuera de `archive/` no las mete «en curso»: las cuenta el commit (P1 sobre ficheros reales)', () => {
    const c = numeradorSobre(configReal(), r14Real())
    for (const t of ['F0-01', 'F0-02', 'F0-03']) expect(tandas(c, 'en curso, aparte y sin sumar')).not.toContain(t)
  })

  it('mutación 2 · una fila de ID NUEVO tras el `---` que cierra el §C NO mueve el denominador: sigue 78', () => {
    const sucio = conFilaNueva(r14Real(), false)
    expect(sucio).not.toBe(r14Real())
    expect(numeradorSobre(configReal(), sucio).cifras.find((x) => x.startsWith('denominador'))).toBe('denominador: 78 tandas del §C de la R01.4')
  })

  it('mutación 2 · la misma fila DENTRO del §C sí lo mueve: 79', () => {
    expect(numeradorSobre(configReal(), conFilaNueva(r14Real(), true)).cifras.find((x) => x.startsWith('denominador'))).toBe(
      'denominador: 79 tandas del §C de la R01.4',
    )
  })

  it('12d · mutación 2 · con `## C ·` renombrado, el barrido lo dice y NO publica 78', () => {
    const sucio = r14Real().replace('## C · ', '## Z · ')
    const c = numeradorSobre(configReal(), sucio)
    expect(c.cifras.find((x) => x.startsWith('denominador'))).toContain('sin leer')
    expect(c.hallazgos.some((h) => h.detalle.includes('§C'))).toBe(true)
    expect(c.bloqueante).toBe(false)
  })
})
