import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { generarMapaBlueprint } from './mapaBlueprint'
import { TRANSITIONS, TRANSICION_REMISION_CONFIRMADA, TRANSICION_REMISION_RETIRADA } from './transitions'
import { ESTADOS_SERVICIO, ESTADOS_SIN_SALIDA } from './estados'
import { FASES, FASE_POR_ESTADO } from './fasesBlueprint'

/**
 * LAS TRES CIFRAS ANCLADAS DEL MAESTRO CONTRA EL CÓDIGO (F1C-09, D5).
 *
 * `openspec/config.yaml → cifras_ancladas` guarda tres números que el maestro fija a mano:
 * `transiciones`, `estados` y `pasos_del_mapa`. La comprobación 5 de `npm run reconcile` sólo lee
 * código para `esperas`; las otras tres se imprimen «sin lectura de código» y no bloquean, así que
 * ensuciar `maestro: "34"` no ponía nada en rojo: el detector no existía (regla de mutación 2).
 * Este guardián LEE EL FICHERO VIGILADO y exige tres cosas por cifra: que el registro diga el valor
 * decidido, que el código lo cuente igual, y que las dos lecturas coincidan.
 *
 * Los literales están escritos a propósito: si el maestro y el código se mueven juntos por una
 * decisión, este fichero se toca A PROPÓSITO, en el mismo commit.
 */
const RUTA = fileURLToPath(new URL('../../../openspec/config.yaml', import.meta.url))

const DECIDIDAS = { transiciones: 31, estados: 20, pasos_del_mapa: 35 } as const

const INICIO_SECCION = '\ncifras_ancladas:\n'

function cifraDelRegistro(id: keyof typeof DECIDIDAS): number {
  const yaml = readFileSync(RUTA, 'utf8').replace(/\r\n/g, '\n')
  const ini = yaml.indexOf(INICIO_SECCION)
  if (ini < 0) throw new Error('Guardián sin objeto: no aparece `cifras_ancladas:` en openspec/config.yaml')
  const resto = yaml.slice(ini + INICIO_SECCION.length)
  const fin = resto.search(/\n(?=[#A-Za-z_])/) // la siguiente línea de primer nivel
  const seccion = fin < 0 ? resto : resto.slice(0, fin)
  const marca = `  - id: ${id}\n`
  const desde = seccion.indexOf(marca)
  if (desde < 0) throw new Error(`Guardián sin objeto: no aparece «${marca.trim()}» en cifras_ancladas`)
  const bloque = seccion.slice(desde + marca.length)
  const hasta = bloque.search(/\n {2}- id:/)
  const m = /maestro: "(\d+)/.exec(hasta < 0 ? bloque : bloque.slice(0, hasta))
  if (!m) throw new Error(`Guardián sin objeto: la entrada ${id} no tiene \`maestro: "N…\``)
  return Number(m[1])
}

function aristasDelMapaCompleto(): number {
  const completo = generarMapaBlueprint({
    transiciones: TRANSITIONS,
    sinBoton: [TRANSICION_REMISION_CONFIRMADA, TRANSICION_REMISION_RETIRADA],
    estados: ESTADOS_SERVICIO,
    sinSalida: ESTADOS_SIN_SALIDA,
    fases: FASES,
    fasePorEstado: FASE_POR_ESTADO,
  })['blueprint-completo.md']
  return (completo.match(/e\d{2} --> e\d{2}/g) ?? []).length
}

describe('cifras ancladas · openspec/config.yaml contra el código', () => {
  it('transiciones: el registro dice 31 y TRANSITIONS tiene 31', () => {
    expect(cifraDelRegistro('transiciones')).toBe(DECIDIDAS.transiciones)
    expect(TRANSITIONS).toHaveLength(DECIDIDAS.transiciones)
    expect(cifraDelRegistro('transiciones')).toBe(TRANSITIONS.length)
  })

  it('estados: el registro dice 20 y ESTADOS_SERVICIO tiene 20', () => {
    expect(cifraDelRegistro('estados')).toBe(DECIDIDAS.estados)
    expect(ESTADOS_SERVICIO).toHaveLength(DECIDIDAS.estados)
    expect(cifraDelRegistro('estados')).toBe(ESTADOS_SERVICIO.length)
  })

  it('pasos_del_mapa: el registro dice 35 y el diagrama completo tiene 35 aristas', () => {
    expect(cifraDelRegistro('pasos_del_mapa')).toBe(DECIDIDAS.pasos_del_mapa)
    expect(aristasDelMapaCompleto()).toBe(DECIDIDAS.pasos_del_mapa)
    expect(cifraDelRegistro('pasos_del_mapa')).toBe(aristasDelMapaCompleto())
  })
})
