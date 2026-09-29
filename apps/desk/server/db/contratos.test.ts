// registro-contrato, lote 1 — `public.contratos` (RQ-TC-21): alta, lecturas, unicidad por lote en la base y
// `CHECK` de fechas. Molde de `calendarioCierres.test.ts:1-9`.
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { comoDiaCivil } from './calendarioCierres'
import {
  crearContrato, listarContratos, contratoPorId, contratoDelLote, contratosDelCliente, ContratoDuplicadoError,
  hayContratoVigente, motivoContratoVencido, erroresContratoVencido,
} from './contratos'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

const alta = { clientId: 'C-1', lote: 'OV-2026-170', fechaInicio: '2026-10-01', fechaFin: '2027-09-30', creadoPor: 'comercial@x' }

describe('crearContrato y sus lecturas', () => {
  it('ida y vuelta: las fechas vuelven como día civil YYYY-MM-DD, sin desplazarse', async () => {
    const c = await crearContrato(db, alta)
    expect(c).toMatchObject({ ...alta, ritmoAvisadoTrimestre: null })
    expect(typeof c.id).toBe('number')
    expect(await contratoPorId(db, c.id)).toEqual(c)
  })

  it('comoDiaCivil normaliza el Date de node-postgres (medianoche UTC) y el string de pg-mem al mismo día', () => {
    expect(comoDiaCivil(new Date(Date.UTC(2026, 11, 31)))).toBe('2026-12-31')
    expect(comoDiaCivil('2026-12-31')).toBe('2026-12-31')
  })

  it('contratoDelLote, contratosDelCliente y listarContratos; lo que no existe es null o vacío', async () => {
    const a = await crearContrato(db, alta)
    const b = await crearContrato(db, { ...alta, lote: 'OV-2026-1700' })
    const otro = await crearContrato(db, { ...alta, clientId: 'C-2', lote: 'OV-2026-171' })
    expect(await contratoDelLote(db, 'OV-2026-1700')).toEqual(b)
    expect(await contratoDelLote(db, 'OV-2026-999')).toBeNull()
    expect(await contratoPorId(db, 999)).toBeNull()
    expect((await contratosDelCliente(db, 'C-1')).map((c) => c.id)).toEqual([a.id, b.id])
    expect(await contratosDelCliente(db, 'C-9')).toEqual([])
    expect((await listarContratos(db)).map((c) => c.id)).toEqual([a.id, b.id, otro.id])
  })
})

describe('la base impone lo que la ruta también comprueba (defensa en profundidad)', () => {
  it('un segundo contrato del mismo lote → ContratoDuplicadoError (el 23505 traducido)', async () => {
    await crearContrato(db, alta)
    await expect(crearContrato(db, { ...alta, clientId: 'C-2' })).rejects.toBeInstanceOf(ContratoDuplicadoError)
  })

  it('un INSERT directo con el lote repetido lo rechaza el índice único (23505)', async () => {
    const insertar = () => db.query(
      "INSERT INTO contratos (client_id, lote, fecha_inicio, fecha_fin, creado_por) VALUES ('C-1', 'OV-2026-170', '2026-10-01', '2027-09-30', 'x')")
    await insertar()
    await expect(insertar()).rejects.toMatchObject({ code: '23505' })
  })

  it('un INSERT directo con fecha_fin anterior a fecha_inicio lo rechaza el CHECK; fin = inicio se admite', async () => {
    await expect(db.query(
      "INSERT INTO contratos (client_id, lote, fecha_inicio, fecha_fin, creado_por) VALUES ('C-1', 'OV-2026-170', '2026-10-01', '2026-09-30', 'x')",
    )).rejects.toThrow()
    await db.query(
      "INSERT INTO contratos (client_id, lote, fecha_inicio, fecha_fin, creado_por) VALUES ('C-1', 'OV-2026-171', '2026-10-01', '2026-10-01', 'x')")
  })
})

// lote 2 — los ayudantes de las tres puertas leen la fila y DELEGAN la decisión en `shared` (design.md §4).
describe('hayContratoVigente, motivoContratoVencido y erroresContratoVencido', () => {
  const HOY = '2026-07-01'
  const contrato = (lote: string, fechaInicio: string, fechaFin: string, clientId = 'C-1') =>
    crearContrato(db, { clientId, lote, fechaInicio, fechaFin, creadoPor: 'x' })

  it.each<[string, string, string, boolean]>([
    ['vigente', '2026-01-01', '2026-12-31', true],
    ['fin = hoy', '2026-01-01', HOY, true],
    ['vencido ayer', '2026-01-01', '2026-06-30', false],
    ['empieza mañana', '2026-07-02', '2026-12-31', false],
  ])('hayContratoVigente · %s → %s', async (_, inicio, fin, esperado) => {
    await contrato('OV-2026-170', inicio, fin)
    expect(await hayContratoVigente(db, 'C-1', HOY)).toBe(esperado)
  })

  it('hayContratoVigente · un contrato vigente de OTRO cliente no cuenta; uno vigente entre varios basta', async () => {
    await contrato('OV-2026-170', '2026-01-01', '2026-12-31', 'C-2')
    expect(await hayContratoVigente(db, 'C-1', HOY)).toBe(false)
    await contrato('OV-2026-171', '2025-01-01', '2025-12-31')
    await contrato('OV-2026-172', '2026-01-01', '2026-12-31')
    expect(await hayContratoVigente(db, 'C-1', HOY)).toBe(true)
  })

  it('motivoContratoVencido · subOV de lote vencido → texto; sin contrato, ordinaria, OVI, cuarentena, no iniciado y fin = hoy → null', async () => {
    const vencido = await contrato('OV-2026-170', '2026-01-01', '2026-06-30')
    await contrato('OV-2026-171', '2026-07-02', '2026-12-31')
    await contrato('OV-2026-172', '2026-01-01', HOY)
    expect(await motivoContratoVencido(db, 'OV-2026-170-01', HOY)).toContain(`contrato nº ${vencido.id}`)
    for (const n of ['OV-2026-999-01', 'OV-2026-170', 'OVI-2026-170', 'OV-2026-170-X9', 'OV-2026-171-01', 'OV-2026-172-01', null, '']) {
      expect(await motivoContratoVencido(db, n, HOY), String(n)).toBeNull()
    }
  })

  it('erroresContratoVencido · un texto por número vencido, en orden; los demás no dicen nada', async () => {
    await contrato('OV-2026-170', '2026-01-01', '2026-06-30')
    await contrato('OV-2026-180', '2026-01-01', '2026-05-31')
    const e = await erroresContratoVencido(db, ['OV-2026-170-01', undefined, 'OV-2026-999-01', 'OV-2026-180-02'], HOY)
    expect(e).toHaveLength(2)
    expect(e[0]).toContain('OV-2026-170-01')
    expect(e[1]).toContain('OV-2026-180-02')
  })
})
