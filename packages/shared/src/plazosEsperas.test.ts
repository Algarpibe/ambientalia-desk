import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { ESTADOS_SIN_SALIDA } from './estados'
import { SLA_HORAS_POR_ESTADO, ALARMAS_SLA } from './sla'
import { MEDICION_PLAZOS_ESPERAS, PLAZO_DIAS_ESPERA, diasEnEspera, esperaVencida } from './plazosEsperas'

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
