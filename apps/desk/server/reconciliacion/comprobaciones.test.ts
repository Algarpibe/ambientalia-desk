import { describe, expect, it } from 'vitest'
import { HEAD_DE_PRUEBA, arbolEnMemoria } from '../testing/arbolDePrueba'
import { reconciliar } from './comprobaciones'

const SALTO = String.fromCharCode(10)

/** Cinco `externa` + seis `interna` = ONCE. Las `ninguna` no cuentan, y los comentarios tampoco. */
const ESTADOS_CON_ONCE = [
  'export const CLASIFICACION_EN_ESPERA = {',
  '  // externa (5)',
  "  'uno': 'externa',",
  "  'dos': 'externa',",
  "  'tres': 'externa',",
  "  'cuatro': 'externa',",
  "  'cinco': 'externa',",
  '  // interna (6) — este comentario nombra una clase y NO debe contarse',
  "  'seis': 'interna',",
  "  'siete': 'interna',",
  "  'ocho': 'interna',",
  "  'nueve': 'interna',",
  "  'diez': 'interna',",
  "  'once': 'interna',",
  '  // ninguna (2)',
  "  'doce': 'ninguna',",
  "  'trece': 'ninguna',",
  '} as const',
].join(SALTO)

/**
 * La trampa que `RQ-RC-04` existe para cerrar: el propio `config.yaml` AFIRMA una cifra de código
 * distinta de la real. El 2026-09-17 un hallazgo salió falso exactamente así, por leer este fichero
 * en vez de `packages/shared`.
 */
const CONFIG_QUE_MIENTE = [
  'capabilities:',
  '  - alfa',
  'cifras_ancladas:',
  '  - id: esperas',
  '    maestro: "4 — M1.3.4 y glosario del Anexo E"',
  '    codigo: "SIETE, segun este documento — y es FALSO: estados.ts declara once"',
  '    divergencia: "LEGITIMA. El código va por delante del maestro."',
].join(SALTO)

const arbol = arbolEnMemoria({
  ficheros: {
    'openspec/config.yaml': CONFIG_QUE_MIENTE,
    'openspec/specs/alfa/spec.md': '# alfa',
    'packages/shared/src/estados.ts': ESTADOS_CON_ONCE,
  },
  head: HEAD_DE_PRUEBA,
})

const comprobacion5 = () => reconciliar(arbol).find((c) => c.id === 5)

describe('comprobaciones · RQ-RC-04: la 5 saca la cifra de `packages/shared`, NUNCA del registro (R2.1.3)', () => {
  it('cuenta ONCE leyendo `estados.ts`, aunque `config.yaml` afirme otra cosa', () => {
    const c = comprobacion5()
    expect(c).toBeDefined()
    expect(c?.cifras.join(' ')).toContain('11')
  })

  it('no toma la cifra del documento: la SIETE que el registro afirma no aparece como cifra del código', () => {
    const c = comprobacion5()
    expect(c?.cifras.join(' ')).not.toContain('SIETE')
  })

  it('enfrenta las dos cifras: el 4 del maestro sigue apareciendo al lado del 11 del código', () => {
    const c = comprobacion5()
    expect(c?.cifras.join(' ')).toContain('4')
  })

  it('la divergencia declarada LEGÍTIMA no convierte la 5 en bloqueante (RQ-RC-03)', () => {
    expect(comprobacion5()?.bloqueante).toBe(false)
  })
})

/**
 * Tres entradas que cubren los TRES casos del dominio: una cerrada, una viva DECLARADA, y una a la
 * que nadie escribió el campo. La tercera es la que importa: hoy cae en «no cerrada» y se cuenta
 * como viva, que es justo lo que `RQ-RC-08` prohíbe — «un barrido que cuenta ausencias miente en
 * cuanto alguien añade una entrada y se olvida del campo».
 */
const CONFIG_CON_UNA_SIN_CAMPO = [
  'capabilities:',
  '  - alfa',
  'incumplimientos_vivos:',
  '  - id: IV-CERRADA',
  '    estado: CERRADO',
  '    descripcion: cerrada y declarada',
  '  - id: IV-VIVA',
  '    estado: VIVO',
  '    descripcion: viva y declarada',
  '  - id: IV-SIN-CAMPO',
  '    descripcion: nadie le escribio el campo',
].join(SALTO)

const arbolDeIncumplimientos = arbolEnMemoria({
  ficheros: {
    'openspec/config.yaml': CONFIG_CON_UNA_SIN_CAMPO,
    'openspec/specs/alfa/spec.md': '# alfa',
  },
  head: HEAD_DE_PRUEBA,
})

const comprobacion4 = () => reconciliar(arbolDeIncumplimientos).find((c) => c.id === 4)

describe('comprobaciones · RQ-RC-08: la 4 cuenta los vivos POR EL CAMPO `estado`, nunca por su ausencia (R2.2.1)', () => {
  it('una entrada SIN el campo se reporta como DEFECTO DE REGISTRO, no como viva', () => {
    const h = comprobacion4()?.hallazgos.find((x) => x.clave === 'IV-SIN-CAMPO')
    expect(h).toBeDefined()
    expect(h?.detalle).toContain('defecto de registro')
  })

  it('y NO entra en el recuento de vivos: vivo es el que lo declara, no el que no dice nada', () => {
    expect(comprobacion4()?.cifras.join(' ')).toContain('1 vivos')
  })

  it('la que declara `estado: VIVO` sí sale como viva, con su clave', () => {
    const h = comprobacion4()?.hallazgos.find((x) => x.clave === 'IV-VIVA')
    expect(h?.detalle).toContain('vivo')
  })

  it('la cerrada no aparece entre los hallazgos', () => {
    expect(comprobacion4()?.hallazgos.map((x) => x.clave)).not.toContain('IV-CERRADA')
  })

  it('la 4 informa y NO bloquea (RQ-RC-03)', () => {
    expect(comprobacion4()?.bloqueante).toBe(false)
  })
})

const RUTA_R14 = 'docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md'
const RUTA_R11 = 'docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md'
const CONFIG_BASE = 'capabilities:' + SALTO + '  - alfa'

/** Cabecera R-1 de siete campos. Se construye en ejecución: un `tanda:` literal de un ID real lo leería el barrido. */
const cabecera = (c: Record<string, string>): string => {
  const base: Record<string, string> = {
    tanda: '', motivo: '""', capacidad: '[]', maestro: '[]', cierra: 'si', toca_maestro: 'no', origen_cabecera: 'declarada', ...c,
  }
  return ['---', ...Object.entries(base).map(([k, v]) => k + ': ' + v), '---', '', '# Propuesta'].join(SALTO)
}

/** Se construye en ejecución: un `tanda:` literal de un ID real lo leería el barrido de cabeceras. */
const proposal = (tanda: string, maestro: string, cierra = 'si'): string => cabecera({ tanda, maestro: '[' + maestro + ']', cierra })

const archivada = (nombre: string): string => 'openspec/changes/archive/2026-01-01-' + nombre + '/proposal.md'
const viva = (nombre: string): string => 'openspec/changes/' + nombre + '/proposal.md'

/** La R01.4 sintética: el §C con sus filas, un `---`, y después el §F.3 y el §G, que repiten IDs. */
const r14 = (idsC: readonly string[], idsFuera: readonly string[] = [], encabezadoC = '## C · §5 consolidado de la R01.4'): string =>
  [
    '# Plan', '', '## B · Estado', '', '| F1B-04 | cifra de otra tabla | x |', '', '---', '',
    encabezadoC, '', '| ID | Contenido | Talla |', '|---|---|---|',
    ...idsC.map((id) => '| ' + id + ' | contenido | S |'),
    '', '---', '', '## F.3 · repite IDs', '', '|---|---|',
    ...idsFuera.map((id) => '| ' + id + ' | repetido | x |'),
  ].join(SALTO)

const bloqueCommit = (id: string, campos: readonly string[] = ['    commit: abc1234', '    prueba: "docs/x.md:1"']): string[] => [
  '  - id: ' + id,
  ...campos,
]
const configConCierres = (...bloques: string[][]): string =>
  [CONFIG_BASE, 'cierres_declarados_por_commit:', ...bloques.flat()].join(SALTO)

const barrido = (ficheros: Record<string, string>) =>
  reconciliar(arbolEnMemoria({ ficheros: { 'openspec/config.yaml': CONFIG_BASE, 'openspec/specs/alfa/spec.md': '# alfa', ...ficheros }, head: HEAD_DE_PRUEBA }))
const dos = (ficheros: Record<string, string>) => {
  const c = barrido(ficheros).find((x) => x.id === 2)
  if (!c) throw new Error('falta la comprobación 2')
  return c
}

/** La lista de tandas de una cifra `N <etiqueta>: A, B`. Si la cifra no existe, FALLA: no devuelve vacío. */
const lista = (c: { cifras: readonly string[] }, etiqueta: string): string[] => {
  const texto = c.cifras.find((x) => x.includes(etiqueta))
  if (texto === undefined) throw new Error('falta la cifra «' + etiqueta + '»: ' + c.cifras.join(' | '))
  const resto = texto.slice(texto.indexOf(': ') + 2)
  return resto === '—' ? [] : resto.split(', ')
}
const porArchivo = (c: { cifras: readonly string[] }) => lista(c, 'cerradas por archivo')
const porCommit = (c: { cifras: readonly string[] }) => lista(c, 'cerradas por commit declarado')
const enCurso = (c: { cifras: readonly string[] }) => lista(c, 'en curso, aparte y sin sumar')
const denominador = (c: { cifras: readonly string[] }): string => c.cifras.find((x) => x.startsWith('denominador')) ?? ''

/** Dos filas del §5 de la R01.1 con la MISMA columna de fuentes; lo que cambia es el `maestro:` que las reclama. */
const PLAN = [
  '| ID | Nombre | Capacidad | Fuente | Gate | Tamaño | Semana |',
  '|---|---|---|---|---|---|---|',
  '| F0-91 | La que cruza | cap | M1.3, Anexo G | — | S | S38 |',
  '| F0-92 | La que NO cruza | cap | M1.3, Anexo G | — | S | S38 |',
].join(SALTO)

const FIXTURE_AUTOCERTIFICADO = {
  [RUTA_R11]: PLAN,
  [RUTA_R14]: r14(['F0-91', 'F0-92']),
  // Cruza: reclama `Anexo G`, que la columna de su fila declara.
  [archivada('cruza')]: proposal('F0-91', '"Anexo G"'),
  // NO cruza: reclama `Anexo H`, que su fila no declara por ninguna parte.
  [archivada('no-cruza')]: proposal('F0-92', '"Anexo H"'),
}

describe('comprobaciones · RQ-RC-06: la guarda (b) del autocertificado MARCA, no rechaza (R2.2.5)', () => {
  const c2 = dos(FIXTURE_AUTOCERTIFICADO)

  it('una fila dada por cerrada cuyo `maestro:` no cruza con su columna de la R01.1 sale «sin verificar»', () => {
    const h = c2.hallazgos.find((x) => x.clave === 'F0-92')
    expect(h).toBeDefined()
    expect(h?.detalle).toContain('sin verificar')
  })

  it('la que SÍ cruza no se marca: la guarda distingue, no sospecha de todas', () => {
    expect(c2.hallazgos.map((x) => x.clave)).not.toContain('F0-91')
  })

  it('marcar NO es rechazar: la 2 sigue sin ser bloqueante (RQ-RC-06)', () => {
    expect(c2.bloqueante).toBe(false)
  })

  it('06a · una cerrada POR COMMIT con cabecera fuera de `archive/` y `maestro:` ajeno también se marca', () => {
    const c = dos({
      'openspec/config.yaml': configConCierres(bloqueCommit('F0-92')),
      [RUTA_R11]: PLAN,
      [RUTA_R14]: r14(['F0-92']),
      [viva('f0-92')]: proposal('F0-92', '"Anexo H"'),
    })
    expect(porCommit(c)).toEqual(['F0-92'])
    expect(c.hallazgos.find((x) => x.clave === 'F0-92')?.detalle).toContain('sin verificar')
  })

  it('06b · una tanda cerrada que sólo existe en la R01.4 NO se marca «sin verificar» y se dice «sin fuente»', () => {
    const c = dos({ [RUTA_R14]: r14(['F1B-90']), [archivada('nueva')]: proposal('F1B-90', '"Anexo Z"'), [RUTA_R11]: PLAN })
    expect(porArchivo(c)).toEqual(['F1B-90'])
    expect(c.hallazgos.filter((x) => x.clave === 'F1B-90')).toEqual([])
    expect(lista(c, 'cerradas sin fuente declarada en la R01.1')).toEqual(['F1B-90'])
  })

  it('06c · la fuente se lee de la R01.1: un `Anexo H` en la columna 4 de la R01.4 NO la salva', () => {
    const r14ConFuente = r14(['F0-92']).replace('| F0-92 | contenido | S |', '| F0-92 | contenido | Anexo H | S |')
    const c = dos({ [RUTA_R14]: r14ConFuente, [RUTA_R11]: PLAN, [archivada('no-cruza')]: proposal('F0-92', '"Anexo H"') })
    expect(r14ConFuente).toContain('Anexo H')
    expect(c.hallazgos.find((x) => x.clave === 'F0-92')?.detalle).toContain('sin verificar')
  })

  it('06c · el otro signo: una `M9.9` en la R01.4 no es fuente, y sin fila en la R01.1 no hay nada que cruzar', () => {
    const r14ConM99 = r14(['F0-93']).replace('| F0-93 | contenido | S |', '| F0-93 | contenido | M9.9 | S |')
    const c = dos({ [RUTA_R14]: r14ConM99, [RUTA_R11]: PLAN, [archivada('m99')]: proposal('F0-93', '"M1.3"') })
    expect(c.hallazgos.map((x) => x.clave)).not.toContain('F0-93')
    expect(lista(c, 'cerradas sin fuente declarada en la R01.1')).toEqual(['F0-93'])
  })
})

describe('comprobaciones · RQ-RC-05: sólo cuenta lo ARCHIVADO, en cifras separadas, nunca una suma', () => {
  it('05b · un `archive/*/proposal.md` con cabecera válida y `cierra: si` cuenta por archivo, con el denominador de la R01.4', () => {
    const c = dos(FIXTURE_AUTOCERTIFICADO)
    expect(porArchivo(c)).toEqual(['F0-91', 'F0-92'])
    expect(denominador(c)).toBe('denominador: 2 tandas del §C de la R01.4')
  })

  it('05a · el mismo proposal FUERA de `archive/` no cuenta por archivo y va a «en curso»', () => {
    const c = dos({ [RUTA_R14]: r14(['F1A-09']), [viva('x')]: proposal('F1A-09', '') })
    expect(porArchivo(c)).toEqual([])
    expect(enCurso(c)).toEqual(['F1A-09'])
  })

  it('05a · y `openspec/changes/no-archive/` no es `archive/`: el predicado es de PREFIJO, no de `includes`', () => {
    const c = dos({ [RUTA_R14]: r14(['F1A-09']), 'openspec/changes/no-archive/proposal.md': proposal('F1A-09', '') })
    expect(porArchivo(c)).toEqual([])
    expect(enCurso(c)).toEqual(['F1A-09'])
  })

  it('05b · el otro signo: el MISMO proposal archivado cuenta una vez y deja de estar en curso', () => {
    const c = dos({ [RUTA_R14]: r14(['F1A-09']), [archivada('x')]: proposal('F1A-09', '') })
    expect(porArchivo(c)).toEqual(['F1A-09'])
    expect(enCurso(c)).toEqual([])
  })

  it('05c · una cabecera inválida (sin `capacidad`) no cuenta aunque esté archivada', () => {
    const sinCapacidad = proposal('F1A-09', '').replace('capacidad: []' + SALTO, '')
    expect(sinCapacidad).not.toContain('capacidad')
    const c = dos({ [RUTA_R14]: r14(['F1A-09']), [archivada('rota')]: sinCapacidad })
    expect(porArchivo(c)).toEqual([])
    expect(porCommit(c)).toEqual([])
  })

  it('05d · un archivado con `cierra: no` no es cierre, y la tanda queda «en curso»', () => {
    const c = dos({ [RUTA_R14]: r14(['F1B-07']), [archivada('parcial')]: proposal('F1B-07', '', 'no') })
    expect(porArchivo(c)).toEqual([])
    expect(porCommit(c)).toEqual([])
    expect(enCurso(c)).toEqual(['F1B-07'])
  })

  it('11d · archivada `si` y otra archivada `no` de la MISMA tanda: sólo «por archivo», no «en curso»', () => {
    const c = dos({
      [RUTA_R14]: r14(['F1B-08']),
      [archivada('parte-uno')]: proposal('F1B-08', '', 'no'),
      [archivada('parte-dos')]: proposal('F1B-08', '', 'si'),
    })
    expect(porArchivo(c)).toEqual(['F1B-08'])
    expect(enCurso(c)).toEqual([])
  })

  it('05e · una tanda en las DOS poblaciones produce hallazgo con las dos fuentes, y no mueve el código de salida', () => {
    const resultado = barrido({
      'openspec/config.yaml': configConCierres(bloqueCommit('F0-91')),
      [RUTA_R14]: r14(['F0-91']),
      [archivada('doble')]: proposal('F0-91', ''),
    })
    const c = resultado.find((x) => x.id === 2)!
    const h = c.hallazgos.find((x) => x.clave === 'F0-91')
    expect(h?.detalle).toContain('archive/')
    expect(h?.detalle).toContain('cierres_declarados_por_commit')
    expect(c.bloqueante).toBe(false)
    expect(resultado.filter((x) => x.bloqueante && x.hallazgos.length > 0)).toEqual([])
  })

  it('05f · seis cifras, en su orden, y NINGUNA línea de total', () => {
    const c = dos({ [RUTA_R14]: r14(['F0-91', 'F1A-09']), [archivada('a')]: proposal('F0-91', ''), [viva('b')]: proposal('F1A-09', '') })
    expect(c.cifras).toHaveLength(6)
    expect(c.cifras.map((x) => x.replace(/^\d+ /, '').split(':')[0])).toEqual([
      'cerradas por archivo',
      'cerradas por commit declarado',
      'en curso, aparte y sin sumar',
      'denominador',
      'cerradas sin fuente declarada en la R01.1',
      'marcadas sin verificar',
    ])
    expect(c.cifras.join(' ')).not.toMatch(/total/i)
  })

  it('05g · F0-04 con `cierra: no` y sin entrada por commit está «en curso» y no «por commit»', () => {
    const c = dos({ [RUTA_R14]: r14(['F0-04']), [viva('f0-04')]: proposal('F0-04', '', 'no') })
    expect(enCurso(c)).toEqual(['F0-04'])
    expect(porCommit(c)).toEqual([])
  })
})

describe('comprobaciones · RQ-RC-11: «en curso» se publica aparte', () => {
  it('11a/11b · fuera de `archive/` va a «en curso» con `cierra: si` y con `cierra: no`, una sola vez por tanda', () => {
    const c = dos({
      [RUTA_R14]: r14(['F1B-09', 'F1B-10', 'F1B-11']),
      [viva('a')]: proposal('F1B-09', '', 'si'),
      [viva('b')]: proposal('F1B-10', '', 'no'),
      [viva('c')]: proposal('F1B-11', '', 'no'),
      [archivada('c2')]: proposal('F1B-11', '', 'no'),
    })
    expect(enCurso(c)).toEqual(['F1B-09', 'F1B-10', 'F1B-11'])
    expect(porArchivo(c)).toEqual([])
  })

  it('11e · `fuera-del-plan` no es «en curso» ni tiene fila en el denominador', () => {
    const fuera = cabecera({ tanda: 'fuera-del-plan', motivo: '"ajuste directo"' })
    const c = dos({ [RUTA_R14]: r14(['F1B-09']), [viva('fuera')]: fuera })
    expect(enCurso(c)).toEqual([])
  })

  it('una tanda sin fila en el §C no entra en «en curso»: el denominador es el límite', () => {
    const c = dos({ [RUTA_R14]: r14(['F1B-09']), [viva('ajena')]: proposal('F1B-99', '', 'no') })
    expect(enCurso(c)).toEqual([])
  })

  it('P1 · mutación de POSICIÓN: F0-91 por commit Y con cabecera `si` fuera de `archive/` NO está «en curso»', () => {
    const c = dos({
      'openspec/config.yaml': configConCierres(bloqueCommit('F0-91')),
      [RUTA_R14]: r14(['F0-91']),
      [viva('f0-91')]: proposal('F0-91', ''),
    })
    expect(porCommit(c)).toEqual(['F0-91'])
    expect(enCurso(c)).toEqual([])
  })

  it('P2 · mutación de POSICIÓN: bloque INCOMPLETO de F1B-09 Y su proposal vivo → sigue «en curso» y no cuenta por commit', () => {
    const c = dos({
      'openspec/config.yaml': configConCierres(bloqueCommit('F1B-09', ['    commit: abc1234'])),
      [RUTA_R14]: r14(['F1B-09']),
      [viva('f1b-09')]: proposal('F1B-09', ''),
    })
    expect(porCommit(c)).toEqual([])
    expect(enCurso(c)).toEqual(['F1B-09'])
    expect(c.hallazgos.find((x) => x.clave === 'F1B-09')?.detalle).toContain('`prueba`')
  })
})

describe('comprobaciones · RQ-RC-10: `cierres_declarados_por_commit` son BLOQUES; una entrada incompleta es defecto y no cuenta', () => {
  const config = configConCierres(
    bloqueCommit('F0-91'),
    bloqueCommit('F0-92', ['    commit: abc1234']),
    bloqueCommit('F0-93', ['    commit: ""', '    prueba: "docs/x.md:1"']),
    bloqueCommit('F0-94', ['    commit: abc1234', '    prueba: >', '      plegado a otra linea']),
  )
  const c = dos({ 'openspec/config.yaml': config, [RUTA_R14]: r14([]) })

  it('10a · la entrada completa cuenta y no lleva defecto', () => {
    expect(porCommit(c)).toEqual(['F0-91'])
    expect(c.hallazgos.map((h) => h.clave)).not.toContain('F0-91')
  })

  it('10b · sin `prueba:` es defecto que nombra el id y el campo, y no cuenta', () => {
    const h = c.hallazgos.find((x) => x.clave === 'F0-92')
    expect(h?.detalle).toContain('defecto de registro')
    expect(h?.detalle).toContain('`prueba`')
  })

  it('10c · con `commit: ""` es defecto que nombra el campo', () => {
    expect(c.hallazgos.find((x) => x.clave === 'F0-93')?.detalle).toContain('`commit`')
  })

  it('10d · `prueba: >` plegado se lee vacío: defecto, falla cerrado', () => {
    expect(c.hallazgos.find((x) => x.clave === 'F0-94')?.detalle).toContain('`prueba`')
  })

  it('10d · la lista plana antigua (`- F0-91`) no cuenta y cada elemento es defecto «sin forma de bloque»', () => {
    const plana = [CONFIG_BASE, 'cierres_declarados_por_commit:', '  - F0-91', '  - F0-92'].join(SALTO)
    const cp = dos({ 'openspec/config.yaml': plana, [RUTA_R14]: r14([]) })
    expect(porCommit(cp)).toEqual([])
    expect(cp.hallazgos.filter((h) => h.detalle.includes('sin forma de bloque')).map((h) => h.clave)).toEqual(['F0-91', 'F0-92'])
  })

  it('la clave AUSENTE da «0 por commit» sin defecto ni hallazgo «sin declarar» (D10)', () => {
    const sin = dos({ [RUTA_R14]: r14(['F0-91']) })
    expect(sin.cifras.find((x) => x.includes('cerradas por commit declarado'))).toBe('0 cerradas por commit declarado: —')
    expect(sin.hallazgos).toEqual([])
  })
})

describe('comprobaciones · RQ-RC-12: el denominador sale del §C de la R01.4, acotado a esa sección', () => {
  it('12c · se reconocen las cinco familias y la negrita; `F6-`, `F1-` y `F1G-` no existen', () => {
    const buenas = ['**F1A-10**', '1G-01', '1H-00', 'F2-01', 'F4-01']
    const malas = ['F6-01', 'F1-01', 'F1G-01']
    const c = dos({ [RUTA_R14]: r14([...buenas, ...malas]) })
    expect(denominador(c)).toBe('denominador: 5 tandas del §C de la R01.4')
  })

  it('12b · un ID repetido en el §F.3 no altera la cuenta, y cada ID cuenta una vez', () => {
    const c = dos({ [RUTA_R14]: r14(['F1B-04', 'F1B-05'], ['F1B-04', 'F1B-05', 'F1B-04']) })
    expect(denominador(c)).toBe('denominador: 2 tandas del §C de la R01.4')
  })

  it('12e · una fila escrita sólo FUERA del §C no entra', () => {
    const c = dos({ [RUTA_R14]: r14(['F1A-01'], ['F1A-99']) })
    expect(denominador(c)).toBe('denominador: 1 tandas del §C de la R01.4')
  })

  it('12d · mutar el fichero vigilado: con `## C ·` renombrado, el barrido lo dice y no publica otro denominador', () => {
    const c = dos({ [RUTA_R14]: r14(['F1A-01', 'F1A-02'], ['F1A-03'], '## Z · otro apartado') })
    const h = c.hallazgos.find((x) => x.detalle.includes('§C'))
    expect(h?.detalle).toContain(RUTA_R14)
    expect(denominador(c)).toContain('sin leer')
    expect(c.bloqueante).toBe(false)
  })

  it('01a · la fila 2 nombra la R01.4, y NO lee la R01.1 como plan del denominador', () => {
    const c = dos({ [RUTA_R11]: PLAN })
    expect(c.titulo).toContain('R01.4')
    expect(c.titulo).not.toContain('R01.1')
    expect(denominador(c)).toContain('sin leer')
  })

  it('01b · las comprobaciones 1, 3, 4, 5 y 6 no dependen del plan ni de los cierres: idénticas con otro §C y otro bloque', () => {
    const otras = (ficheros: Record<string, string>) =>
      JSON.stringify(barrido(ficheros).filter((x) => x.id !== 2))
    const uno = otras({ [RUTA_R14]: r14(['F0-91']), [archivada('a')]: proposal('F0-91', '') })
    const otro = otras({
      'openspec/config.yaml': configConCierres(bloqueCommit('F0-92')),
      [RUTA_R14]: r14(['F1A-01', 'F1A-02']),
      [viva('b')]: proposal('F1A-01', '', 'no'),
    })
    expect(uno).toContain('"id":6')
    expect(uno).toBe(otro)
  })
})
