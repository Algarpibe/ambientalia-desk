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

/** Se construye en ejecución: un `tanda:` literal de un ID real lo leería el barrido de cabeceras. */
const proposal = (tanda: string, maestro: string): string =>
  ['---', 'tanda: ' + tanda, 'motivo: ""', 'capacidad: []', 'maestro: [' + maestro + ']',
    'cierra: si', 'toca_maestro: no', 'origen_cabecera: declarada', '---', '', '# Propuesta'].join(SALTO)

/** Dos filas del §5 con la MISMA columna de fuentes; lo que cambia es el `maestro:` que las reclama. */
const PLAN = [
  '| ID | Nombre | Capacidad | Fuente | Gate | Tamaño | Semana |',
  '|---|---|---|---|---|---|---|',
  '| F0-91 | La que cruza | cap | M1.3, Anexo G | — | S | S38 |',
  '| F0-92 | La que NO cruza | cap | M1.3, Anexo G | — | S | S38 |',
].join(SALTO)

const arbolDelAutocertificado = arbolEnMemoria({
  ficheros: {
    'openspec/config.yaml': 'capabilities:' + SALTO + '  - alfa',
    'openspec/specs/alfa/spec.md': '# alfa',
    'docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.1.md': PLAN,
    // Cruza: reclama `Anexo G`, que la columna de su fila declara.
    'openspec/changes/cruza/proposal.md': proposal('F0-91', '"Anexo G"'),
    // NO cruza: reclama `Anexo H`, que su fila no declara por ninguna parte.
    'openspec/changes/no-cruza/proposal.md': proposal('F0-92', '"Anexo H"'),
  },
  head: HEAD_DE_PRUEBA,
})

const comprobacion2 = () => reconciliar(arbolDelAutocertificado).find((c) => c.id === 2)

describe('comprobaciones · RQ-RC-06: la guarda (b) del autocertificado MARCA, no rechaza (R2.2.5)', () => {
  it('una fila dada por cerrada cuyo `maestro:` no cruza con su columna del §5 sale «sin verificar»', () => {
    const h = comprobacion2()?.hallazgos.find((x) => x.clave === 'F0-92')
    expect(h).toBeDefined()
    expect(h?.detalle).toContain('sin verificar')
  })

  it('la que SÍ cruza no se marca: la guarda distingue, no sospecha de todas', () => {
    expect(comprobacion2()?.hallazgos.map((x) => x.clave)).not.toContain('F0-91')
  })

  it('marcar NO es rechazar: la 2 sigue sin ser bloqueante (RQ-RC-06)', () => {
    expect(comprobacion2()?.bloqueante).toBe(false)
  })

  it('y las dos cifras del numerador siguen SEPARADAS, nunca sumadas (RQ-RC-05)', () => {
    const cifras = comprobacion2()?.cifras.join(' ') ?? ''
    expect(cifras).toContain('derivables de cabecera')
    expect(cifras).toContain('declarados por commit')
  })
})
