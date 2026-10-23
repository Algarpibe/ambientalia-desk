import { describe, it, expect } from 'vitest'
import { TRANSICIONES_A_FINALIZADO, diaDeCierreDelTicket } from './diaDeCierre'
import { CATALOGO_POR_FLUJO } from './flujos'
import { ID_TRANSICION_MIGRACION } from './migracionTickets'

// RQ-KP-34 (F1F-05, `poblacion-cierre-variante-47-51`): el día de cierre de un ticket.
const paso = (transitionId: string, performedAt: string, values: unknown = {}) => ({ transitionId, performedAt, values })
const marcador = (origen: string, destino: string) =>
  paso(ID_TRANSICION_MIGRACION, '2026-10-20T15:00:00Z', { regla: 'entregado-a-finalizado', closed_time_destino: destino, cierre_origen: origen })

describe('diaDeCierreDelTicket (RQ-KP-34, S-1)', () => {
  it('la transición a «Finalizado» manda sobre closed_time (regla de mutación 1: la transición manda)', () => {
    const pasos = [paso('facturar', '2026-09-10T17:00:00Z')]
    expect(diaDeCierreDelTicket(pasos, '2026-09-20T17:00:00Z')).toBe('2026-09-10')
  })
  it('vale la ÚLTIMA transición a «Finalizado» y una a «Anulado» no cuenta como cierre', () => {
    const pasos = [
      paso('liberacion', '2026-09-12T17:00:00Z'), paso('facturar', '2026-09-05T17:00:00Z'), paso('anulacion', '2026-09-20T17:00:00Z'),
    ]
    expect(diaDeCierreDelTicket(pasos, null)).toBe('2026-09-12')
  })
  it('sin transición a «Finalizado», closed_time', () => {
    expect(diaDeCierreDelTicket([paso('anulacion', '2026-09-20T17:00:00Z')], '2026-09-15T17:00:00Z')).toBe('2026-09-15')
  })
  it('sin historial ni closed_time no hay día de cierre', () => {
    expect(diaDeCierreDelTicket([], null)).toBeNull()
  })
  it('el cierre de la migración no cuenta: ni el marcador ni ese closed_time', () => {
    const destino = '2026-10-20T15:00:00Z'
    expect(diaDeCierreDelTicket([marcador('migracion', destino)], destino)).toBeNull()
  })
  it('migrado con la fecha de Zoho: cuenta el closed_time de Zoho', () => {
    const destino = '2026-09-03T17:00:00Z'
    expect(diaDeCierreDelTicket([marcador('zoho', destino)], destino)).toBe('2026-09-03')
  })
  it('con varios marcadores manda el ÚLTIMO de la lista', () => {
    const viejo = '2026-09-01T17:00:00Z', ultimo = '2026-09-03T17:00:00Z'
    expect(diaDeCierreDelTicket([marcador('migracion', viejo), marcador('migracion', ultimo)], ultimo)).toBeNull()
    expect(diaDeCierreDelTicket([marcador('migracion', ultimo), marcador('migracion', viejo)], ultimo)).toBe('2026-09-03')
  })
  it('el día es el de Bogotá: 23:30 local no salta y 04:30Z cae el día anterior', () => {
    expect(diaDeCierreDelTicket([paso('facturar', '2026-09-30T23:30:00-05:00')], null)).toBe('2026-09-30')
    expect(diaDeCierreDelTicket([], '2026-10-01T04:30:00Z')).toBe('2026-09-30')
  })
})

describe('guardián de TRANSICIONES_A_FINALIZADO (S-7, regla de mutación 2)', () => {
  it('son exactamente las cinco de D1', () => {
    expect([...TRANSICIONES_A_FINALIZADO].sort()).toEqual(['ejecutar_soporte', 'entrega_al_cliente', 'facturado_cierre', 'facturar', 'liberacion'])
  })
  it('cada id del conjunto tiene to === «Finalizado» en TODOS los catálogos donde aparece', () => {
    for (const id of TRANSICIONES_A_FINALIZADO) {
      const apariciones = Object.values(CATALOGO_POR_FLUJO).flatMap((c) => c.filter((t) => t.id === id))
      expect(apariciones.length, id).toBeGreaterThan(0)
      for (const t of apariciones) expect(t.to, id).toBe('Finalizado')
    }
  })
  it('toda transición con destino «Finalizado» de cualquier catálogo está en el conjunto', () => {
    for (const c of Object.values(CATALOGO_POR_FLUJO)) for (const t of c) if (t.to === 'Finalizado') expect(TRANSICIONES_A_FINALIZADO.has(t.id), t.id).toBe(true)
  })
})
