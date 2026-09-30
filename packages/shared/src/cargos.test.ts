import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import {
  CARGOS, EXCEPCIONES_POR_CARGO, esCargo, cargoQueFaltaParaTransicion, puedeEjecutarTransicion,
  puedeLiberarSinFactura, puedeCrearOVIGarantia, puedeFijarPrioridadTop5, cargoPermisoDelCuerpo,
  type SujetoDePermiso,
} from './cargos'
import { AREAS, TRANSITIONS, TRANSITIONS_EQUIPO_NUEVO, TRANSITIONS_SOPORTE_REMOTO } from './transitions'
import { canExecuteTransition } from './permissions'

/**
 * Permisos por cargo (F1C-05, nivel CARGO; RQ-PM-12..22). Todo es puro: node, sin base ni HTTP.
 * El cargo SÓLO restringe: la compuesta exige el área (`canExecuteTransition`, intacta) Y, si la
 * transición tiene excepción, el cargo. Nunca amplía.
 */
const sujeto = (areas: string[], cargoPermiso?: unknown, isAdmin = false): SujetoDePermiso =>
  ({ areas, isAdmin, cargoPermiso: cargoPermiso as SujetoDePermiso['cargoPermiso'] })

const LIBERACION = TRANSITIONS.find((t) => t.id === 'liberacion_sin_factura')!

describe('CARGOS · la lista cerrada de siete (RQ-PM-12, S1)', () => {
  it('son siete, escritos a mano y EN ORDEN', () => {
    expect([...CARGOS]).toEqual([
      'Director Técnico', 'Coordinador Técnico', 'Técnico', 'Técnico de campo',
      'Director Comercial', 'Coordinador Comercial', 'Asistente Comercial',
    ])
    expect(CARGOS).toHaveLength(7)
    expect(CARGOS as readonly string[]).not.toContain('Gerente comercial')
  })

  it('esCargo compara exacto, sin plegar mayúsculas ni espacios', () => {
    for (const c of CARGOS) expect(esCargo(c)).toBe(true)
    for (const v of ['director comercial', ' Director Comercial', 'Director Comercial ', 'Gerente comercial', '', 7, null, undefined, {}]) {
      expect(esCargo(v)).toBe(false)
    }
  })
})

describe('CARGOS · guardián contra la decisión de Gerencia (regla de mutación 2)', () => {
  // Lee el fichero VIGILADO: si alguien cambia la respuesta de Gerencia o la lista, esto cae.
  const RUTA = fileURLToPath(new URL('../../../openspec/config.yaml', import.meta.url))
  const CLAVE = 'clave: "decision/c10b-gerente-director"'

  function cargosDeLaDecision(): string[] {
    const yaml = readFileSync(RUTA, 'utf8')
    const ini = yaml.indexOf(CLAVE)
    if (ini < 0) throw new Error(`Guardián sin objeto: no aparece ${CLAVE} en openspec/config.yaml`)
    const resto = yaml.slice(ini + CLAVE.length)
    const fin = resto.search(/\n {2}- clave:/)
    const bloque = (fin < 0 ? resto : resto.slice(0, fin)).replace(/\s+/g, ' ')
    const m = /respuesta_textual: .*?Los cargos son siete: ([^.»]+)[.»]/.exec(bloque)
    if (!m) throw new Error('Guardián sin objeto: no aparece «Los cargos son siete: …» en la respuesta_textual de decision/c10b-gerente-director')
    return m[1].split(/,\s*| y /).map((s) => s.trim()).filter(Boolean)
  }

  it('la frase «Los cargos son siete: …» de decision/c10b-gerente-director coincide con CARGOS', () => {
    const extraidos = cargosDeLaDecision()
    expect(extraidos).toHaveLength(7)
    expect(extraidos).toEqual([...CARGOS]) // mismo orden
    expect(new Set(extraidos)).toEqual(new Set(CARGOS)) // y mismo conjunto
  })
})

describe('EXCEPCIONES_POR_CARGO · la tabla como dato', () => {
  it('toda clave existe en TRANSITIONS y en ningún otro catálogo; su valor es un Cargo', () => {
    const idsEquipo = TRANSITIONS_EQUIPO_NUEVO.map((t) => t.id)
    const idsSoporte = TRANSITIONS_SOPORTE_REMOTO.map((t) => t.id)
    const claves = Object.keys(EXCEPCIONES_POR_CARGO.transiciones)
    expect(claves.length).toBeGreaterThan(0)
    for (const id of claves) {
      expect(TRANSITIONS.map((t) => t.id)).toContain(id)
      expect(idsEquipo).not.toContain(id)
      expect(idsSoporte).not.toContain(id)
      expect(esCargo(EXCEPCIONES_POR_CARGO.transiciones[id])).toBe(true)
    }
  })

  it('contenido exacto, escrito a mano', () => {
    expect(EXCEPCIONES_POR_CARGO.transiciones).toEqual({ liberacion_sin_factura: 'Director Comercial' })
    expect(EXCEPCIONES_POR_CARGO.crearOVIGarantia).toBe('Director Técnico')
    expect(EXCEPCIONES_POR_CARGO.fijarPrioridadTop5).toBe('Director Comercial')
  })
})

describe('cargoQueFaltaParaTransicion', () => {
  it('el administrador nunca echa en falta un cargo', () => {
    expect(cargoQueFaltaParaTransicion('liberacion_sin_factura', { isAdmin: true, cargoPermiso: null })).toBeNull()
  })
  it('una transición sin excepción no exige cargo', () => {
    expect(cargoQueFaltaParaTransicion('facturado', { isAdmin: false, cargoPermiso: null })).toBeNull()
    expect(cargoQueFaltaParaTransicion('toString', { isAdmin: false, cargoPermiso: null })).toBeNull()
  })
  it('con el cargo exigido, no falta nada', () => {
    expect(cargoQueFaltaParaTransicion('liberacion_sin_factura', { isAdmin: false, cargoPermiso: 'Director Comercial' })).toBeNull()
  })
  it('sin cargo, con otro cargo o con undefined, falta «Director Comercial»', () => {
    for (const c of [null, 'Coordinador Comercial', 'Director Técnico', undefined] as const) {
      expect(cargoQueFaltaParaTransicion('liberacion_sin_factura', { isAdmin: false, cargoPermiso: c })).toBe('Director Comercial')
    }
  })
})

describe('puedeEjecutarTransicion · la compuesta', () => {
  it('Comercial + Director Comercial ejecuta la liberación; Comercial sin cargo, no', () => {
    expect(puedeEjecutarTransicion(sujeto(['Comercial'], 'Director Comercial'), LIBERACION)).toBe(true)
    expect(puedeEjecutarTransicion(sujeto(['Comercial'], null), LIBERACION)).toBe(false)
  })
  it('el cargo sin el área no concede (Servicio Técnico + Director Comercial)', () => {
    expect(puedeEjecutarTransicion(sujeto(['Servicio Técnico'], 'Director Comercial'), LIBERACION)).toBe(false)
  })
  it('el administrador pasa por las 34, con o sin cargo', () => {
    for (const t of TRANSITIONS) expect(puedeEjecutarTransicion(sujeto([], null, true), t)).toBe(true)
  })
})

describe('primitivas por cargo · HOY NO LAS LLAMA NADIE (F1B-03 y F1B-07, RQ-PM-20)', () => {
  it('puedeCrearOVIGarantia: área Servicio Técnico Y Director Técnico', () => {
    for (const c of CARGOS) expect(puedeCrearOVIGarantia(sujeto(['Servicio Técnico'], c))).toBe(c === 'Director Técnico')
    expect(puedeCrearOVIGarantia(sujeto(['Servicio Técnico'], null))).toBe(false)
    expect(puedeCrearOVIGarantia(sujeto(['Comercial'], 'Director Técnico'))).toBe(false) // cargo sin área
    expect(puedeCrearOVIGarantia(sujeto([], null, true))).toBe(true)
  })
  it('puedeFijarPrioridadTop5: área Comercial Y Director Comercial', () => {
    for (const c of CARGOS) expect(puedeFijarPrioridadTop5(sujeto(['Comercial'], c))).toBe(c === 'Director Comercial')
    expect(puedeFijarPrioridadTop5(sujeto(['Comercial'], null))).toBe(false)
    expect(puedeFijarPrioridadTop5(sujeto(['Servicio Técnico'], 'Director Comercial'))).toBe(false)
    expect(puedeFijarPrioridadTop5(sujeto([], null, true))).toBe(true)
  })
  it('puedeLiberarSinFactura es la compuesta sobre la transición liberacion_sin_factura', () => {
    for (const areas of [[], ['Comercial'], ['Servicio Técnico'], ['Compras'], [...AREAS]]) {
      for (const c of [...CARGOS, null]) {
        for (const isAdmin of [false, true]) {
          const s = sujeto(areas, c, isAdmin)
          expect(puedeLiberarSinFactura(s)).toBe(puedeEjecutarTransicion(s, LIBERACION))
        }
      }
    }
    expect(puedeLiberarSinFactura(sujeto(['Comercial'], 'Director Comercial'))).toBe(true)
    expect(puedeLiberarSinFactura(sujeto(['Comercial'], null))).toBe(false)
  })
})

describe('un cargo desconocido o vacío se comporta como «sin cargo» (no se confía en el tipo)', () => {
  const RAROS: unknown[] = ['', 'director comercial', ' Director Comercial', 'Gerente comercial', undefined, null, 7, {}]
  it.each(RAROS.map((v) => [JSON.stringify(v) ?? 'undefined', v] as const))('%s', (_n, raro) => {
    for (const areas of [['Comercial'], ['Servicio Técnico'], [...AREAS]]) {
      const s = sujeto(areas, raro)
      const sin = sujeto(areas, null)
      expect(cargoQueFaltaParaTransicion('liberacion_sin_factura', s)).toBe('Director Comercial')
      expect(puedeEjecutarTransicion(s, LIBERACION)).toBe(false)
      expect(puedeLiberarSinFactura(s)).toBe(false)
      expect(puedeCrearOVIGarantia(s)).toBe(false)
      expect(puedeFijarPrioridadTop5(s)).toBe(false)
      for (const t of TRANSITIONS) expect(puedeEjecutarTransicion(s, t)).toBe(puedeEjecutarTransicion(sin, t))
    }
  })
})

describe('cargoPermisoDelCuerpo · validación del cuerpo HTTP', () => {
  it('null, «» y undefined → sin cargo (C-5: el alta sin el campo es válida)', () => {
    for (const v of [null, '', undefined]) expect(cargoPermisoDelCuerpo(v)).toEqual({ ok: true, cargo: null })
  })
  it('una cadena de la lista, recortada, → el cargo', () => {
    expect(cargoPermisoDelCuerpo('  Director Comercial ')).toEqual({ ok: true, cargo: 'Director Comercial' })
    for (const c of CARGOS) expect(cargoPermisoDelCuerpo(c)).toEqual({ ok: true, cargo: c })
  })
  it('todo lo demás → error', () => {
    for (const v of ['Gerente comercial', 'director comercial', 5, {}, [], true]) {
      const r = cargoPermisoDelCuerpo(v)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.error).toEqual(expect.any(String))
    }
  })
})

describe('el cargo SÓLO restringe · barrido área × cargo × acción (RQ-PM-21)', () => {
  const SUBCONJUNTOS: string[][] = [[], ...AREAS.map((a) => [a]), [...AREAS]]
  const CARGOS_BARRIDO: unknown[] = [...CARGOS, null, '', 'Gerente comercial']

  interface Accion { nombre: string; area: string; puede: (s: SujetoDePermiso) => boolean }
  const ACCIONES: Accion[] = [
    ...TRANSITIONS.map((t) => ({ nombre: t.id, area: t.area, puede: (s: SujetoDePermiso) => puedeEjecutarTransicion(s, t) })),
    { nombre: 'puedeLiberarSinFactura', area: 'Comercial', puede: puedeLiberarSinFactura },
    { nombre: 'puedeCrearOVIGarantia', area: 'Servicio Técnico', puede: puedeCrearOVIGarantia },
    { nombre: 'puedeFijarPrioridadTop5', area: 'Comercial', puede: puedeFijarPrioridadTop5 },
  ]

  it('ningún caso concede lo que el área niega', () => {
    let casos = 0
    let concedidos = 0
    const violaciones: string[] = []
    for (const areas of SUBCONJUNTOS) {
      for (const cargo of CARGOS_BARRIDO) {
        for (const a of ACCIONES) {
          casos += 1
          const puede = a.puede(sujeto(areas, cargo, false))
          if (puede) concedidos += 1
          if (puede && !canExecuteTransition(areas, false, a.area)) violaciones.push(`${a.nombre} · [${areas}] · ${JSON.stringify(cargo)}`)
        }
      }
    }
    expect(violaciones).toEqual([])
    // 5 subconjuntos × 10 valores de cargo × (34 transiciones + 3 primitivas) = 1.850, a mano.
    expect(casos).toBe(1850)
    expect(concedidos).toBeGreaterThan(0) // no pasa en vacío
  })
})
