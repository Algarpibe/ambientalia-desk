// registro-contrato, lote 1 — `public.contratos` (RQ-TC-21): alta, lecturas, unicidad por lote en la base y
// `CHECK` de fechas. Molde de `calendarioCierres.test.ts:1-9`.
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'; import { MENSAJES_AMPLIACION, fechaFinOriginal } from '@ambientalia/shared'
import { comoDiaCivil } from './calendarioCierres'; import { asociarOV, liberarAsociacion } from '@ambientalia/zoho-sync/db/ovAsociaciones'
import {
  crearContrato, listarContratos, contratoPorId, contratoDelLote, contratosDelCliente, ContratoDuplicadoError,
  hayContratoVigente, motivoContratoVencido, erroresContratoVencido, contratoDelTicket, ampliarContrato, ampliacionesDelContrato, ContratoCambiadoError,
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

/*
 * Lote 3 — el ticket de contrato es DERIVADO (RQ-TC-23, S-3): se calcula al leer desde las asociaciones vigentes y
 * el contrato del lote; ninguna columna lo guarda y nadie lo marca a mano (`decision/anexo-53-contratos`).
 */
describe('contratoDelTicket · derivado al leer, nunca guardado', () => {
  const HOY = '2026-06-01'
  const vigente = { clientId: 'C-A', lote: 'OV-2026-170', fechaInicio: '2026-01-15', fechaFin: '2026-12-31', creadoPor: 'c' }
  const asociar = (ticketId: string, numero: string) =>
    asociarOV(db, { ticketId, numero, salesorderId: null, origen: 'alta', actor: 't', fechaOrdenCompra: null })
  const foto = async () => ({
    tickets: (await db.query("SELECT * FROM tickets WHERE id = 't1'")).rows,
    asociaciones: (await db.query('SELECT * FROM ov_asociaciones ORDER BY id')).rows,
  })
  beforeEach(async () => {
    await db.query("INSERT INTO tickets (id, number, subject, status, client_id) VALUES ('t1', 1, 's', 'Ingresado', 'C-B')")
  })

  it('asociación vigente a una subOV de un lote con contrato vigente → de contrato, con su lote y su subOV', async () => {
    const c = await crearContrato(db, vigente)
    await asociar('t1', 'OV-2026-170-01')
    expect(await contratoDelTicket(db, 't1', HOY)).toEqual({ deContrato: true, contrato: c, subOV: 'OV-2026-170-01' })
  })

  it('con el contrato vencido deja de serlo, y ni `tickets` ni `ov_asociaciones` han cambiado', async () => {
    await crearContrato(db, { ...vigente, fechaFin: '2026-05-31' })
    await asociar('t1', 'OV-2026-170-01')
    const antes = await foto()
    expect(await contratoDelTicket(db, 't1', HOY)).toEqual({ deContrato: false })
    expect(await foto()).toEqual(antes)
  })

  it('una asociación liberada no cuenta', async () => {
    await crearContrato(db, vigente)
    const a = await asociar('t1', 'OV-2026-170-01')
    await liberarAsociacion(db, a.id, 'c', 'error de tecleo')
    expect(await contratoDelTicket(db, 't1', HOY)).toEqual({ deContrato: false })
  })

  it('la OV ordinaria del lote (con contrato registrado) y una subOV de un lote sin contrato no la convierten', async () => {
    await crearContrato(db, vigente)
    await asociar('t1', 'OV-2026-170')
    await asociar('t1', 'OV-2026-180-01')
    expect(await contratoDelTicket(db, 't1', HOY)).toEqual({ deContrato: false })
  })

  it('contrato del cliente A y ticket del cliente B: sigue siendo de contrato (no compara clientes, S-9)', async () => {
    await crearContrato(db, vigente)
    await asociar('t1', 'OV-2026-170-02')
    expect((await contratoDelTicket(db, 't1', HOY)).deContrato).toBe(true)
  })

  it('un ticket sin asociaciones no es de contrato', async () => {
    expect(await contratoDelTicket(db, 't1', HOY)).toEqual({ deContrato: false })
  })
})

/*
 * ampliacion-contrato (F1B-11, RQ-TC-54) — `ampliarContrato` amplía la fecha vigente y deja la traza en UNA transacción;
 * `ampliacionesDelContrato` la lee de la más antigua a la más reciente. La atomicidad real no se prueba (sin pool no hay
 * transacción): se prueba por estructura, con el doble de `reasignaciones.test.ts`.
 */
describe('ampliarContrato · fecha vigente y traza', () => {
  const base = { clientId: 'C-1', lote: 'OV-2031-170', fechaInicio: '2030-07-01', fechaFin: '2031-06-30', creadoPor: 'c' }
  const pedido = (id: number, extra: Partial<Parameters<typeof ampliarContrato>[1]> = {}) =>
    ({ contratoId: id, fechaAnterior: '2031-06-30', fechaNueva: '2031-09-30', motivo: 'prórroga acordada', ampliadoPor: 'Ana', ...extra })
  const traza = async () => (await db.query('SELECT * FROM contrato_ampliaciones ORDER BY id')).rows

  it('escribe la fecha vigente y una fila con los cinco datos (anterior, nueva, motivo, quién y cuándo)', async () => {
    const c = await crearContrato(db, base)
    const r = await ampliarContrato(db, pedido(c.id))
    expect(r).toEqual({ ...c, fechaFin: '2031-09-30' })
    expect((await contratoPorId(db, c.id))!.fechaFin).toBe('2031-09-30')
    const filas = await traza()
    expect(filas).toHaveLength(1)
    expect(filas[0]).toMatchObject({ contrato_id: c.id, motivo: 'prórroga acordada', ampliado_por: 'Ana' })
    expect(comoDiaCivil(filas[0].fecha_anterior)).toBe('2031-06-30')
    expect(comoDiaCivil(filas[0].fecha_nueva)).toBe('2031-09-30')
    expect(filas[0].ampliado_at).toBeInstanceOf(Date)
  })

  it('dos ampliaciones encadenadas dejan dos filas en orden y la fecha original sigue siendo la del alta', async () => {
    const c = await crearContrato(db, base)
    await ampliarContrato(db, pedido(c.id))
    await ampliarContrato(db, pedido(c.id, { fechaAnterior: '2031-09-30', fechaNueva: '2031-12-31', motivo: 'otra vez' }))
    const lista = await ampliacionesDelContrato(db, c.id)
    expect(lista.map((a) => [a.fechaAnterior, a.fechaNueva, a.motivo])).toEqual([['2031-06-30', '2031-09-30', 'prórroga acordada'], ['2031-09-30', '2031-12-31', 'otra vez']])
    expect(fechaFinOriginal('2031-12-31', lista)).toBe('2031-06-30')
    expect(lista[0]!.fechaAnterior).toBe(base.fechaFin)
  })

  it('con la fecha leída desfasada lanza ContratoCambiadoError y NO escribe ni la fecha ni la traza', async () => {
    const c = await crearContrato(db, base)
    const e = await ampliarContrato(db, pedido(c.id, { fechaAnterior: '2031-05-31' })).catch((x) => x)
    expect(e).toBeInstanceOf(ContratoCambiadoError)
    expect(e.message).toBe(MENSAJES_AMPLIACION.carrera)
    expect(e.contratoId).toBe(c.id)
    expect((await contratoPorId(db, c.id))!.fechaFin).toBe('2031-06-30')
    expect(await traza()).toEqual([])
  })

  it('un motivo nulo se guarda como nulo', async () => {
    const c = await crearContrato(db, base)
    await ampliarContrato(db, pedido(c.id, { motivo: null }))
    expect((await traza())[0].motivo).toBeNull()
  })

  it('ampliacionesDelContrato: de la más antigua a la más reciente, con ampliadoAt en ISO, y sólo las de ese contrato', async () => {
    const a = await crearContrato(db, base)
    const b = await crearContrato(db, { ...base, lote: 'OV-2031-171' })
    await ampliarContrato(db, pedido(a.id))
    await ampliarContrato(db, pedido(b.id))
    await ampliarContrato(db, pedido(a.id, { fechaAnterior: '2031-09-30', fechaNueva: '2031-10-31', ampliadoPor: 'Beto' }))
    const lista = await ampliacionesDelContrato(db, a.id)
    expect(lista.map((x) => x.ampliadoPor)).toEqual(['Ana', 'Beto'])
    expect(lista[0]!.ampliadoAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    expect(await ampliacionesDelContrato(db, 9999)).toEqual([])
  })

  it('estructura de la transacción: BEGIN, UPDATE, ROLLBACK y NINGÚN INSERT cuando el UPDATE no acierta fila', async () => {
    const calls: string[] = []
    const cliente = { query: async (sql: string) => { calls.push(sql.trim()); return { rows: [] } }, release: () => {} }
    const falso = { query: async () => ({ rows: [] }), connect: async () => cliente } as unknown as Queryable
    await expect(ampliarContrato(falso, pedido(1))).rejects.toBeInstanceOf(ContratoCambiadoError)
    expect(calls.map((s) => s.split(/\s+/)[0].toUpperCase())).toEqual(['BEGIN', 'UPDATE', 'ROLLBACK'])
    expect(calls[1]).toMatch(/^UPDATE contratos SET fecha_fin/)
  })

  it('estructura de la transacción con éxito: BEGIN, UPDATE, INSERT, COMMIT, todo por la conexión de la transacción', async () => {
    const calls: string[] = []
    const fila = { id: 1, client_id: 'C-1', lote: 'L', fecha_inicio: '2030-07-01', fecha_fin: '2031-09-30', creado_por: 'c', created_at: new Date(), ritmo_avisado_trimestre: null }
    const ejecutar = (origen: string) => async (sql: string) => { const v = sql.trim().split(/\s+/)[0].toUpperCase(); calls.push(`${origen}:${v}`); return { rows: v === 'UPDATE' ? [fila] : [] } }
    const falso = { query: ejecutar('pool'), connect: async () => ({ query: ejecutar('tx'), release: () => {} }) } as unknown as Queryable
    await ampliarContrato(falso, pedido(1))
    expect(calls).toEqual(['tx:BEGIN', 'tx:UPDATE', 'tx:INSERT', 'tx:COMMIT'])
  })
})

describe('remediación del verify · lector del motivo nulo y tipo de las columnas de fecha', () => {
  it('D13: una ampliación con motivo nulo se SIRVE con motivo null, no con cadena vacía', async () => {
    const c = await crearContrato(db, { ...alta, fechaInicio: '2031-01-01', fechaFin: '2031-06-30' })
    await ampliarContrato(db, { contratoId: c.id, fechaAnterior: '2031-06-30', fechaNueva: '2031-09-30', motivo: null, ampliadoPor: 'Ana' })
    expect((await ampliacionesDelContrato(db, c.id))[0]!.motivo).toBeNull()
  })

  it('Q18: fecha_anterior y fecha_nueva son de tipo fecha: un texto que no es fecha se rechaza', async () => {
    const insertar = (col: 'fecha_anterior' | 'fecha_nueva', v: string) => db.query(
      `INSERT INTO contrato_ampliaciones (contrato_id, fecha_anterior, fecha_nueva, ampliado_por) VALUES (1, ${col === 'fecha_anterior' ? '$1' : "'2031-06-30'"}, ${col === 'fecha_nueva' ? '$1' : "'2031-06-30'"}, 'x')`, [v])
    await expect(insertar('fecha_anterior', 'no-es-fecha')).rejects.toThrow()
    await expect(insertar('fecha_nueva', 'no-es-fecha')).rejects.toThrow()
  })
})
