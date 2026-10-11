import { describe, it, expect, afterEach, vi } from 'vitest'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { marcasDeGarantia } from './garantiaTickets'
import { logger } from '../util/logger'

/**
 * F1B-18 · `marcasDeGarantia` (RQ-TC-59): la marca la calcula el SERVIDOR por lote, con UNA lectura de `equipos`, y no
 * escribe nada. Los `Queryable` son falsos: lo que se prueba es la forma de la consulta y la traducción de la fila.
 */
const G1 = new Date('2026-03-16T01:00:00Z') // 15/03 en Bogotá

/** Un `Queryable` que registra cada sentencia y responde con las filas de `equipos` dadas. */
function falso(equipos: Array<{ id: string; fin_garantia: unknown }>) {
  const sentencias: Array<{ texto: string; params?: unknown[] }> = []
  const db: Queryable = {
    query: async (texto, params) => { sentencias.push({ texto, params }); return { rows: equipos } },
  }
  return { db, sentencias }
}

describe('marcasDeGarantia', () => {
  it('S1 · un equipo con fin 15/03 (medianoche local, como lo construye pg) y creación G1 → en_garantia', async () => {
    const { db } = falso([{ id: 'eq1', fin_garantia: new Date(2026, 2, 15) }])
    const m = await marcasDeGarantia(db, [{ id: 't1', equipo_id: 'eq1', created_time: G1 }])
    expect(m.get('t1')).toBe('en_garantia')
  })

  it('S1 · con el fin anterior al día de creación → vencida', async () => {
    const { db } = falso([{ id: 'eq1', fin_garantia: new Date(2026, 2, 14) }])
    const m = await marcasDeGarantia(db, [{ id: 't1', equipo_id: 'eq1', created_time: G1 }])
    expect(m.get('t1')).toBe('vencida')
  })

  it('S2 · sin equipo_id, o con un equipo que no existe, el ticket no entra en el mapa', async () => {
    const { db } = falso([{ id: 'eq1', fin_garantia: new Date(2026, 2, 15) }])
    const m = await marcasDeGarantia(db, [{ id: 'sin', created_time: G1 }, { id: 'fantasma', equipo_id: 'eqX', created_time: G1 }, { id: 'ok', equipo_id: 'eq1', created_time: G1 }])
    expect([...m.keys()]).toEqual(['ok'])
  })

  it('S2 · un equipo con fin null → sin_dato', async () => {
    const { db } = falso([{ id: 'eq1', fin_garantia: null }])
    const m = await marcasDeGarantia(db, [{ id: 't1', equipo_id: 'eq1', created_time: G1 }])
    expect(m.get('t1')).toBe('sin_dato')
  })

  it('creación ilegible → sin marca (D6)', async () => {
    const { db } = falso([{ id: 'eq1', fin_garantia: new Date(2026, 2, 15) }])
    const m = await marcasDeGarantia(db, [{ id: 't1', equipo_id: 'eq1', created_time: 'basura' }])
    expect(m.size).toBe(0)
  })

  it('S3 · UNA consulta para N tickets, con los equipos distintos como marcadores', async () => {
    const { db, sentencias } = falso([{ id: 'eq1', fin_garantia: null }, { id: 'eq2', fin_garantia: null }])
    const m = await marcasDeGarantia(db, [
      { id: 't1', equipo_id: 'eq1', created_time: G1 }, { id: 't2', equipo_id: 'eq2', created_time: G1 },
      { id: 't3', equipo_id: 'eq1', created_time: G1 }, { id: 't4', equipo_id: 'eq2', created_time: G1 },
    ])
    expect(sentencias).toHaveLength(1)
    expect(sentencias[0].texto).toContain('IN ($1, $2)')
    expect(sentencias[0].params).toEqual(['eq1', 'eq2'])
    expect(m.size).toBe(4)
  })

  it('S3 · cero consultas si ningún ticket tiene equipo', async () => {
    const { db, sentencias } = falso([])
    const m = await marcasDeGarantia(db, [{ id: 't1', created_time: G1 }, { id: 't2', equipo_id: '', created_time: G1 }])
    expect(sentencias).toHaveLength(0)
    expect(m.size).toBe(0)
  })

  it('S4 · si la consulta lanza, devuelve el mapa vacío y deja un warn (nunca tumba el tablero)', async () => {
    const warn = vi.spyOn(logger, 'warn')
    const db: Queryable = { query: async () => { throw new Error('boom') } }
    const m = await marcasDeGarantia(db, [{ id: 't1', equipo_id: 'eq1', created_time: G1 }])
    expect(m.size).toBe(0)
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })

  it('RQ-TC-59 · calcular la marca no escribe nada: toda sentencia es un SELECT', async () => {
    const { db, sentencias } = falso([{ id: 'eq1', fin_garantia: null }])
    await marcasDeGarantia(db, [{ id: 't1', equipo_id: 'eq1', created_time: G1 }])
    expect(sentencias.length).toBeGreaterThan(0)
    for (const s of sentencias) {
      expect(s.texto.trim().toUpperCase()).toMatch(/^SELECT\b/)
      expect(s.texto.toUpperCase()).not.toMatch(/\b(INSERT|UPDATE|DELETE)\b/)
    }
  })
})

describe('marcasDeGarantia · S5 el día del fin no depende de la zona del proceso', () => {
  const tzInicial = process.env.TZ
  afterEach(() => { if (tzInicial === undefined) delete process.env.TZ; else process.env.TZ = tzInicial })

  it('con TZ=Asia/Tokyo la medianoche local sigue siendo el 15/03', async () => {
    process.env.TZ = 'Asia/Tokyo'
    const { db } = falso([{ id: 'eq1', fin_garantia: new Date(2026, 2, 15) }])
    const m = await marcasDeGarantia(db, [{ id: 't1', equipo_id: 'eq1', created_time: G1 }])
    expect(m.get('t1')).toBe('en_garantia')
  })
})
