import { readFileSync, readdirSync } from 'node:fs'; import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import {
  CARGOS, EXCEPCIONES_POR_CARGO, esCargo, cargoQueFaltaParaTransicion, puedeEjecutarTransicion,
  puedeLiberarSinFactura, puedeCrearOVIGarantia, puedeFijarPrioridadTop5, puedeAjustarPrioridadTicket, cargoPermisoDelCuerpo,
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

describe('CARGOS · la lista cerrada de ocho (RQ-PM-12, S1; el octavo, F1C-11)', () => {
  it('son ocho, escritos a mano y EN ORDEN', () => {
    expect([...CARGOS]).toEqual([
      'Director Técnico', 'Coordinador Técnico', 'Técnico', 'Técnico de campo',
      'Director Comercial', 'Coordinador Comercial', 'Asistente Comercial', 'Especialista técnico',
    ])
    expect(CARGOS).toHaveLength(8)
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

  it('los siete de decision/c10b-gerente-director y el octavo de decision/cargo-encargado-de-inventario coinciden con CARGOS', () => {
    const extraidos = [...cargosDeLaDecision(), cargoDeRespaldoDeLaDecision()]
    expect(extraidos).toHaveLength(8)
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
  it('el administrador pasa por las 31, con o sin cargo', () => {
    for (const t of TRANSITIONS) expect(puedeEjecutarTransicion(sujeto([], null, true), t)).toBe(true)
  })
})

describe('primitivas por cargo · la de Top 5 la llama el PUT (F1B-07); la de la OVI la llama ordenOVI.ts (F1B-03, RQ-PM-20)', () => {
  it('puedeCrearOVIGarantia: sin área, basta el cargo Director Técnico (RQ-PM-24)', () => {
    for (const areas of [[], ['Comercial'], ['Servicio Técnico']]) expect(puedeCrearOVIGarantia(sujeto(areas, 'Director Técnico'))).toBe(true)
    for (const c of CARGOS) expect(puedeCrearOVIGarantia(sujeto(['Servicio Técnico'], c))).toBe(c === 'Director Técnico')
    expect(puedeCrearOVIGarantia(sujeto(['Servicio Técnico'], null))).toBe(false) // sin cargo: el área ya no concede
    expect(puedeCrearOVIGarantia(sujeto([], null, true))).toBe(true) // el administrador pasa sin cargo
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
    // puedeCrearOVIGarantia ya no lleva área (F1B-03, RQ-PM-24): sólo AÑADE condición y no entra en este barrido.
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
    // 5 subconjuntos × 11 valores de cargo (8 + 3) × (31 transiciones + 2 primitivas) = 1.815, a mano.
    expect(casos).toBe(1815)
    expect(concedidos).toBeGreaterThan(0) // no pasa en vacío
  })
})

describe('RQ-PM-20 · quién llama a las primitivas por cargo (hipótesis de 1.12: node:fs funciona en environment node)', () => {
  const RAIZ = fileURLToPath(new URL('../../../', import.meta.url))
  /** Todos los .ts y .tsx de apps/ y packages/ que no son pruebas, sin node_modules ni dist. */
  function fuentes(dir: string): string[] {
    const salida: string[] = []
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const ruta = join(dir, e.name)
      if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== 'dist' && e.name !== '.git') salida.push(...fuentes(ruta)) }
      else if (/\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) salida.push(ruta)
    }
    return salida
  }
  /** Ficheros, distintos de cargos.ts, que contienen una llamada a `nombre(`. */
  const llamadores = (nombre: string): string[] =>
    [...fuentes(join(RAIZ, 'apps')), ...fuentes(join(RAIZ, 'packages'))]
      .filter((f) => !f.endsWith(join('shared', 'src', 'cargos.ts')) && readFileSync(f, 'utf8').includes(`${nombre}(`))
  it('PM20-2 · las dos primitivas tienen llamador fuera de cargos.ts; los de puedeCrearOVIGarantia son garantiaProveedor.ts (envoltorio) y ordenOVI.ts', () => {
    expect(llamadores('puedeFijarPrioridadTop5').length).toBeGreaterThanOrEqual(1); expect(llamadores('puedeAjustarPrioridadTicket').length).toBeGreaterThanOrEqual(1) // tercer llamador
    expect(llamadores('puedeCrearOVIGarantia').map((r) => r.split(/[\\/]/).slice(-3).join('/'))).toEqual(['shared/src/garantiaProveedor.ts', 'shared/src/ordenOVI.ts'])
  })
})

/**
 * El octavo cargo (F1C-11) no lo escribe c10b —«Los cargos son siete»— sino la decisión de respaldo, en la
 * nota «X» no está entre los siete cargos decididos el 24/09. Se lee del fichero vigilado y SÓLO entre
 * `respuesta_textual:` y `consecuencias:`, para no confundirlo con el «Especialista técnico» de las consecuencias.
 */
function cargoDeRespaldoDeLaDecision(): string {
  const yaml = readFileSync(fileURLToPath(new URL('../../../openspec/config.yaml', import.meta.url)), 'utf8')
  const clave = 'clave: "decision/cargo-encargado-de-inventario"'
  const ini = yaml.indexOf(clave)
  if (ini < 0) throw new Error(`Guardián sin objeto: no aparece ${clave} en openspec/config.yaml`)
  const resto = yaml.slice(ini + clave.length)
  const fin = resto.search(/\n {2}- clave:/)
  const bloque = (fin < 0 ? resto : resto.slice(0, fin)).replace(/\s+/g, ' ')
  const desde = bloque.indexOf('respuesta_textual:')
  const hasta = bloque.indexOf('consecuencias:')
  const respuesta = desde < 0 || hasta < desde ? '' : bloque.slice(desde, hasta)
  const m = /«([^«»]+)» no está entre los siete cargos decididos el 24\/09/.exec(respuesta)
  if (!m) throw new Error('Guardián sin objeto: no aparece «… no está entre los siete cargos decididos el 24/09» en la respuesta_textual de decision/cargo-encargado-de-inventario')
  return m[1].trim()
}

describe('N2 · el octavo cargo «Especialista técnico» se comporta como «Técnico» (F1C-11)', () => {
  it('esCargo y cargoPermisoDelCuerpo lo aceptan, con su minúscula exacta', () => {
    expect(esCargo('Especialista técnico')).toBe(true)
    expect(esCargo('Especialista Técnico')).toBe(false)
    expect(cargoPermisoDelCuerpo('  Especialista técnico ')).toEqual({ ok: true, cargo: 'Especialista técnico' })
  })

  it('sus veredictos sobre las 31 transiciones y las tres primitivas son los de «Técnico»', () => {
    let comparadas = 0
    for (const areas of [[], ['Comercial'], ['Servicio Técnico'], [...AREAS]]) {
      const esp = sujeto(areas, 'Especialista técnico')
      const tec = sujeto(areas, 'Técnico')
      for (const t of TRANSITIONS) { comparadas += 1; expect(puedeEjecutarTransicion(esp, t), `${t.id} · [${areas}]`).toBe(puedeEjecutarTransicion(tec, t)) }
      expect(puedeLiberarSinFactura(esp)).toBe(puedeLiberarSinFactura(tec))
      expect(puedeCrearOVIGarantia(esp)).toBe(puedeCrearOVIGarantia(tec))
      expect(puedeFijarPrioridadTop5(esp)).toBe(puedeFijarPrioridadTop5(tec))
    }
    expect(comparadas).toBe(4 * TRANSITIONS.length)
    expect(cargoQueFaltaParaTransicion('liberacion_sin_factura', { isAdmin: false, cargoPermiso: 'Especialista técnico' })).toBe('Director Comercial')
  })
})

describe('puedeAjustarPrioridadTicket · ajuste por ticket (F1B-07, prioridad-tres-niveles; RQ-PM-21)', () => {
  // Segunda primitiva SIN área para el Director Técnico, como puedeCrearOVIGarantia: queda fuera del barrido «el cargo sólo restringe».
  const AREAS_PROBADAS: string[][] = [['Comercial'], ['Servicio Técnico'], []]
  it('matriz de los ocho cargos y «sin cargo», con Comercial, con Servicio Técnico y sin área (no admin)', () => {
    let aceptados = 0
    for (const areas of AREAS_PROBADAS) {
      for (const cargo of [...CARGOS, null]) {
        const esperado = cargo === 'Director Técnico' || (cargo === 'Director Comercial' && areas.includes('Comercial'))
        expect(puedeAjustarPrioridadTicket(sujeto(areas, cargo)), `${areas} · ${cargo}`).toBe(esperado)
        if (esperado) aceptados += 1
      }
    }
    expect(aceptados).toBe(4) // Director Técnico en las tres áreas + Director Comercial con Comercial
  })
  it('el Director Técnico pasa SIN área alguna (S-F) y el Director Comercial sin Comercial no', () => {
    expect(puedeAjustarPrioridadTicket(sujeto([], 'Director Técnico'))).toBe(true)
    expect(puedeAjustarPrioridadTicket(sujeto(['Servicio Técnico'], 'Director Comercial'))).toBe(false)
  })
  it('el administrador pasa con o sin cargo; un cargo fuera de la lista no cuenta', () => {
    expect(puedeAjustarPrioridadTicket(sujeto([], null, true))).toBe(true)
    expect(puedeAjustarPrioridadTicket(sujeto(['Comercial'], 'Gerente comercial'))).toBe(false)
  })
  it('puedeFijarPrioridadTop5 NO cambia: el Director Técnico sigue sin poder fijar un Top 5', () => {
    expect(puedeFijarPrioridadTop5(sujeto(['Servicio Técnico', 'Comercial'], 'Director Técnico'))).toBe(false)
  })
})
