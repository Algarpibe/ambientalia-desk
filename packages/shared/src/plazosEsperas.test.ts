import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { ESTADOS_SIN_SALIDA, enEsperaDe } from './estados'
import { SLA_HORAS_POR_ESTADO, ALARMAS_SLA } from './sla'
import { MEDICION_PLAZOS_ESPERAS, PLAZO_DIAS_ESPERA, ALARMA_ESPERA, diasEnEspera, esperaVencida, textoAvisoEspera } from './plazosEsperas'

/**
 * salidas-esperas (F1C-03, RQ-AV-25): el registro de plazos de las cuatro esperas. Los números son literales de la medición
 * `medicion/p90-esperas-2026-10-21` y NO se derivan del SLA de `sla.ts` (es otra noción: aquí, días naturales de espera).
 */
describe('RQ-AV-25 · registro de plazos de las cuatro esperas', () => {
  it('plazos literales de la medición y su clave fechada', () => {
    expect(PLAZO_DIAS_ESPERA).toEqual({ 'En Espera de Repuestos': 79, 'Solicitado': 13, 'Servicio externo': 31, 'En espera de SKU inventario': 20 })
    expect(MEDICION_PLAZOS_ESPERAS).toEqual({ clave: 'medicion/p90-esperas-2026-10-21', fecha: '2026-10-21' })
  })

  it('hay un plazo por cada estado sin salida, y ninguno más', () => {
    expect(Object.keys(PLAZO_DIAS_ESPERA).sort()).toEqual([...ESTADOS_SIN_SALIDA].sort())
  })

  it('diasEnEspera cuenta días civiles de Bogotá entre la entrada y hoy', () => {
    expect(diasEnEspera('2026-10-01', '2026-10-21')).toBe(20)
    expect(diasEnEspera(new Date('2026-10-01T12:00:00Z'), '2026-10-01')).toBe(0)
    // 02:00 UTC del 02/10 es todavía el 01/10 en Bogotá (UTC-5)
    expect(diasEnEspera('2026-10-02T02:00:00Z', '2026-10-21')).toBe(20)
  })

  it('esperaVencida es dias >= plazo: el día del plazo vence, el anterior no', () => {
    expect(esperaVencida('Solicitado', 12)).toBe(false)
    expect(esperaVencida('Solicitado', 13)).toBe(true)
    expect(esperaVencida('En Espera de Repuestos', 78)).toBe(false)
    expect(esperaVencida('En Espera de Repuestos', 79)).toBe(true)
    expect(esperaVencida('Servicio externo', 30)).toBe(false)
    expect(esperaVencida('Servicio externo', 31)).toBe(true)
    expect(esperaVencida('En espera de SKU inventario', 19)).toBe(false)
    expect(esperaVencida('En espera de SKU inventario', 20)).toBe(true)
  })

  it('esperaVencida no opina de un estado sin plazo', () => {
    expect(esperaVencida('Ingresado', 9999)).toBe(false)
  })

  it('disjunción: ninguna espera tiene SLA de permanencia ni alarma de sla.ts (si una lo gana, esta prueba lo dice antes de que una marca se trague a la otra)', () => {
    for (const e of ESTADOS_SIN_SALIDA) {
      expect(Object.keys(SLA_HORAS_POR_ESTADO), `${e} ya tiene SLA`).not.toContain(e)
      expect(Object.keys(ALARMAS_SLA), `${e} ya tiene alarma`).not.toContain(e)
    }
  })

  it('fuente: plazosEsperas.ts no importa sla.ts (mutación 6: los plazos no se derivan de SLA_HORAS_POR_ESTADO)', () => {
    const fuente = readFileSync(fileURLToPath(new URL('./plazosEsperas.ts', import.meta.url)), 'utf8')
    expect(fuente).not.toMatch(/from\s+['"]\.\/sla['"]/)
    expect(fuente).not.toContain('SLA_HORAS_POR_ESTADO')
  })
})

/**
 * RQ-AV-26 (D4 c y d): quién recibe cada alarma y qué dice. Las externas SUGIEREN la decisión de Comercial; las internas ESCALAN y no
 * nombran ninguna salida (mutación 4). La clase sale de `enEsperaDe`, no se redeclara.
 */
describe('RQ-AV-26 · textos de la alarma de caducidad', () => {
  it('las externas nombran la decisión: cobrar el diagnóstico o anular', () => {
    expect(textoAvisoEspera('En Espera de Repuestos', 5001, 79))
      .toBe('El ticket #5001 lleva 79 días en «En Espera de Repuestos» (plazo: 79). Comercial decide su salida: cobrar el diagnóstico o anular.')
    expect(textoAvisoEspera('Servicio externo', 5002, 40))
      .toBe('El ticket #5002 lleva 40 días en «Servicio externo» (plazo: 31). Comercial decide su salida: cobrar el diagnóstico o anular.')
  })

  it('las internas escalan: Solicitado al área técnica y SKU a crear el SKU', () => {
    expect(textoAvisoEspera('Solicitado', 5003, 13))
      .toBe('El ticket #5003 lleva 13 días en «Solicitado» (plazo: 13) sin entregarse la pieza: se escala a Servicio Técnico.')
    expect(textoAvisoEspera('En espera de SKU inventario', 5004, 20))
      .toBe('El ticket #5004 lleva 20 días en «En espera de SKU inventario» (plazo: 20): hay que crear el SKU.')
  })

  it('los textos de las internas no nombran ninguna salida (ni Anulado, ni Por Facturar, ni anular, ni cobrar)', () => {
    for (const e of ESTADOS_SIN_SALIDA.filter((x) => enEsperaDe(x) === 'interna')) {
      expect(textoAvisoEspera(e, 1, 99), e).not.toMatch(/anul|cobr|por facturar/i)
    }
  })

  it('la clase sale de enEsperaDe: sugiere la salida exactamente en las externas', () => {
    for (const e of ESTADOS_SIN_SALIDA) {
      expect(textoAvisoEspera(e, 1, 99).includes('cobrar el diagnóstico'), e).toBe(enEsperaDe(e) === 'externa')
    }
    const fuente = readFileSync(fileURLToPath(new URL('./plazosEsperas.ts', import.meta.url)), 'utf8')
    expect(fuente).toContain('enEsperaDe(')
  })

  it('ALARMA_ESPERA: cargos y área de respaldo por espera, con las claves de los plazos', () => {
    expect(Object.keys(ALARMA_ESPERA).sort()).toEqual(Object.keys(PLAZO_DIAS_ESPERA).sort())
    expect(ALARMA_ESPERA['En Espera de Repuestos']).toEqual({ cargos: ['Director Comercial', 'Coordinador Comercial'], areaRespaldo: 'Comercial' })
    expect(ALARMA_ESPERA['Servicio externo']).toEqual({ cargos: ['Director Comercial', 'Coordinador Comercial'], areaRespaldo: 'Comercial' })
    expect(ALARMA_ESPERA['Solicitado']).toEqual({ cargos: ['Director Técnico', 'Coordinador Técnico'], areaRespaldo: 'Servicio Técnico' })
    expect(ALARMA_ESPERA['En espera de SKU inventario']).toEqual({ cargos: ['Director Comercial', 'Coordinador Comercial'], areaRespaldo: 'Comercial' })
  })
})
