import { describe, it, expect, beforeEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { avisarFacturacionesVencidas, marcarYAvisarFacturacion, pasadaFacturacionVencida } from './avisoFacturacionVencida'
import { ticketsPendientesDeFacturarSinAvisar } from '../db/facturacionVencida'
import { createRole, actualizarRecibeAvisos } from '../auth/roles'
import { createUser } from '../auth/users'
import { logger } from '../util/logger'

/**
 * RQ-AV-23 (delta `derivacion-avisos`, F1C-02 lote 2): aviso al Director Comercial cuando vence la fecha prevista de
 * facturación de un ticket en `Pendiente de facturar`. Vence el día SIGUIENTE a la fecha (S-4); una sola vez por ticket y
 * fecha, con la marca en la propia fila (S-6); respaldo al área Comercial y, sin nadie, no se marca (S-7). Sólo bandeja.
 *
 * Atomicidad por ESTRUCTURA, no por filas: pg-mem no revierte un `ROLLBACK` (`db/transaccion.test.ts:25`).
 */
let db: Queryable
let n = 0
beforeEach(async () => { n = 0; const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

const PREVISTA = '2027-01-10'
const MISMO_DIA = '2027-01-10'
const SIGUIENTE = '2027-01-11'

async function director(email = 'dc@x.co') {
  return (await createUser(db, { email, name: email, passwordHash: 'h', cargoPermiso: 'Director Comercial' })).id
}
async function areaComercial(email = 'co@x.co') {
  const rol = await createRole(db, { name: 'CO', areas: ['Comercial'] })
  await actualizarRecibeAvisos(db, rol.id, true)
  return (await createUser(db, { email, name: email, passwordHash: 'h', roleId: rol.id })).id
}
async function ticket(status = 'Pendiente de facturar', prevista: string | null = PREVISTA): Promise<string> {
  n++
  await db.query('INSERT INTO tickets (id, number, subject, status, fecha_prevista_facturacion) VALUES ($1, $2, $3, $4, $5)',
    [`t${n}`, 5000 + n, 's', status, prevista])
  return `t${n}`
}
const avisos = async () => (await db.query('SELECT user_id, ticket_id, texto, enviado_at FROM avisos ORDER BY created_at')).rows as Array<{ user_id: string; ticket_id: string | null; texto: string; enviado_at: unknown }>
const marca = async (id: string) => {
  const m = (await db.query('SELECT facturacion_avisada_para AS m FROM tickets WHERE id = $1', [id])).rows[0].m
  return m == null ? null : new Date(m).toISOString().slice(0, 10)
}

describe('avisarFacturacionesVencidas · cuándo avisa', () => {
  it('fecha vencida en Pendiente de facturar: avisa al Director Comercial, sólo bandeja, y marca la fecha', async () => {
    const dc = await director()
    const id = await ticket()
    expect(await avisarFacturacionesVencidas(db, SIGUIENTE)).toBe(1)
    const a = await avisos()
    expect(a).toHaveLength(1)
    expect([a[0]!.user_id, a[0]!.ticket_id, a[0]!.enviado_at]).toEqual([dc, id, null])
    expect(a[0]!.texto).toBe('El ticket #5001 sigue en «Pendiente de facturar»: la fecha prevista de facturación era el 2027-01-10.')
    expect(await marca(id)).toBe(PREVISTA)
  })

  it.each([['el día anterior', '2027-01-09'], ['el mismo día', MISMO_DIA]])('%s no avisa ni marca', async (_t, hoy) => {
    await director()
    const id = await ticket()
    expect(await avisarFacturacionesVencidas(db, hoy)).toBe(0)
    expect(await avisos()).toEqual([])
    expect(await marca(id)).toBeNull()
  })

  it('un ticket facturado (Finalizado) no avisa aunque la fecha haya pasado', async () => {
    await director()
    await ticket('Finalizado')
    expect(await avisarFacturacionesVencidas(db, SIGUIENTE)).toBe(0)
    expect(await avisos()).toEqual([])
  })

  it('un ticket en otro estado, con fecha vencida, tampoco (p. ej. todavía Por Entregar / Sin facturar)', async () => {
    await director()
    await ticket('Por Entregar / Sin facturar')
    expect(await avisarFacturacionesVencidas(db, SIGUIENTE)).toBe(0)
  })

  it('sin fecha prevista no avisa nunca (histórico anterior al 09/09)', async () => {
    await director()
    await ticket('Pendiente de facturar', null)
    expect(await avisarFacturacionesVencidas(db, '2099-01-01')).toBe(0)
  })
})

describe('avisarFacturacionesVencidas · una sola vez por ticket y fecha', () => {
  it('dos pasadas sobre el mismo vencimiento, también otro día, dan un solo aviso', async () => {
    await director()
    await ticket()
    expect(await avisarFacturacionesVencidas(db, SIGUIENTE)).toBe(1)
    expect(await avisarFacturacionesVencidas(db, SIGUIENTE)).toBe(0)
    expect(await avisarFacturacionesVencidas(db, '2027-02-01')).toBe(0)
    expect(await avisos()).toHaveLength(1)
  })

  it('una fecha prevista NUEVA sobre el mismo ticket vuelve a poder avisar (S-6, regularización)', async () => {
    await director()
    const id = await ticket()
    await avisarFacturacionesVencidas(db, SIGUIENTE)
    await db.query("UPDATE tickets SET fecha_prevista_facturacion = '2027-01-20' WHERE id = $1", [id])
    expect(await avisarFacturacionesVencidas(db, '2027-01-21')).toBe(1)
    expect(await marca(id)).toBe('2027-01-20')
  })
})

describe('avisarFacturacionesVencidas · a quién', () => {
  it('sin Director Comercial, avisa al área Comercial', async () => {
    const co = await areaComercial()
    await ticket()
    expect(await avisarFacturacionesVencidas(db, SIGUIENTE)).toBe(1)
    expect((await avisos()).map((a) => a.user_id)).toEqual([co])
  })

  it('sin nadie, no marca; cuando aparece un destinatario, la pasada siguiente avisa', async () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => logger)
    const id = await ticket()
    expect(await avisarFacturacionesVencidas(db, SIGUIENTE)).toBe(0)
    expect(await marca(id)).toBeNull()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
    await director()
    expect(await avisarFacturacionesVencidas(db, '2027-01-12')).toBe(1)
  })
})

describe('avisarFacturacionesVencidas · nunca ejecuta una salida', () => {
  it('el ticket sigue en Pendiente de facturar y no gana ninguna fila de traza', async () => {
    await director()
    const id = await ticket()
    await avisarFacturacionesVencidas(db, SIGUIENTE)
    expect((await db.query('SELECT status FROM tickets WHERE id = $1', [id])).rows[0].status).toBe('Pendiente de facturar')
    expect((await db.query('SELECT * FROM ticket_transitions WHERE ticket_id = $1', [id])).rows).toEqual([])
  })
})

describe('pasadaFacturacionVencida', () => {
  it('evalúa como mucho una vez por día civil y no lanza aunque la base falle', async () => {
    await director()
    await ticket()
    await pasadaFacturacionVencida(db, '2027-03-01')
    expect(await avisos()).toHaveLength(1)
    await db.query("INSERT INTO tickets (id, number, subject, status, fecha_prevista_facturacion) VALUES ('tx', 9999, 's', 'Pendiente de facturar', '2027-01-10')")
    await pasadaFacturacionVencida(db, '2027-03-01')
    expect(await avisos(), 'mismo día: no vuelve a evaluar').toHaveLength(1)
    await pasadaFacturacionVencida(db, '2027-03-02')
    expect(await avisos(), 'día siguiente: evalúa y avisa el nuevo').toHaveLength(2)
    const error = vi.spyOn(logger, 'error').mockImplementation(() => logger)
    const rota = { query: () => Promise.reject(new Error('caída')) } as unknown as Queryable
    await expect(pasadaFacturacionVencida(rota, '2027-03-03')).resolves.toBeUndefined()
    expect(error).toHaveBeenCalled()
    error.mockRestore()
  })
})

/**
 * Cada capa, por separado. La consulta de candidatos y el `UPDATE` de la marca filtran los dos por estado y por marca, y
 * por eso una prueba de extremo a extremo no distingue si falta uno: el otro lo tapa. Lo enseñó la mutación (M9, M9b, M10
 * y M10b de `apply-progress.md` sobrevivían). El `UPDATE` es el que cierra la carrera: alguien factura, o corre otra
 * pasada, entre la lectura de candidatos y la marca.
 */
describe('las dos capas, por separado', () => {
  it('la consulta de candidatos sólo trae Pendiente de facturar con fecha y sin esa marca', async () => {
    const vale = await ticket()
    await ticket('Finalizado')
    await ticket('Pendiente de facturar', null)
    const marcado = await ticket()
    await db.query('UPDATE tickets SET facturacion_avisada_para = fecha_prevista_facturacion WHERE id = $1', [marcado])
    expect((await ticketsPendientesDeFacturarSinAvisar(db)).map((t) => [t.id, t.fechaPrevista])).toEqual([[vale, PREVISTA]])
  })

  it('carrera: si el ticket se factura entre la lectura y la marca, no marca ni avisa', async () => {
    await director()
    await ticket()
    const [c] = await ticketsPendientesDeFacturarSinAvisar(db)
    await db.query("UPDATE tickets SET status = 'Finalizado' WHERE id = $1", [c!.id])
    expect(await marcarYAvisarFacturacion(db, c!, 'x')).toBe(false)
    expect(await avisos()).toEqual([])
    expect(await marca(c!.id)).toBeNull()
  })

  it('carrera: dos pasadas con el mismo candidato dan un solo aviso', async () => {
    await director()
    await ticket()
    const [c] = await ticketsPendientesDeFacturarSinAvisar(db)
    expect(await marcarYAvisarFacturacion(db, c!, 'x')).toBe(true)
    expect(await marcarYAvisarFacturacion(db, c!, 'x')).toBe(false)
    expect(await avisos()).toHaveLength(1)
  })
})
