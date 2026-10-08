// indicadores-51-55 (F1F-05), lote 2a · RQ-KP-19 y la parte de la capa de datos de RQ-KP-21: la carga de las respuestas en UNA
// transacción, idempotente por huella y sin consulta por fila. pg-mem con `migrate`; el doble de `connect` es el molde de
// `reasignaciones.test.ts`.
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { cargarRespuestas, MOTIVO_TICKET_INEXISTENTE } from './encuestaRespuestas'
import { huellaRespuesta, type FilaEncuesta } from '../encuesta/respuesta'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

async function ticket(numero: number): Promise<void> {
  await db.query('INSERT INTO tickets (id, number, subject, status, classification) VALUES ($1, $2, $3, $4, $5)', [`t${numero}`, numero, 's', 'Ingresado', 'Servicio'])
}
const fila = (numero: number, calificacion = 'Excelente', respondidaAt = '2027-01-12T13:00:00.000Z', n = 2): FilaEncuesta =>
  ({ fila: n, numeroTicket: numero, calificacion, respondidaAt, huella: huellaRespuesta({ numeroTicket: numero, calificacion, respondidaAt }) })
const guardadas = async () => (await db.query('SELECT * FROM public.encuesta_respuestas ORDER BY id')).rows as Array<Record<string, unknown>>

describe('cargarRespuestas · carga y recarga (RQ-KP-19, RQ-KP-21)', () => {
  it('carga las filas de tickets que existen y las cuenta; la tabla guarda ticket_id (el id, no el número), calificación e instante', async () => {
    await ticket(101); await ticket(102)
    const r = await cargarRespuestas(db, [fila(101, 'Excelente', '2027-01-12T13:00:00.000Z', 2), fila(102, 'Regular', '2027-01-13T13:00:00.000Z', 3)], 'ana')
    expect(r).toEqual({ insertadas: 2, duplicadas: 0, rechazadas: [] })
    const g = await guardadas()
    expect(g.map((f) => [f.ticket_id, f.calificacion])).toEqual([['t101', 'Excelente'], ['t102', 'Regular']])
    expect((g[0].respondida_at as Date).toISOString()).toBe('2027-01-12T13:00:00.000Z')
  })

  it('recarga del mismo fichero: insertadas 0, duplicadas N y la tabla no crece', async () => {
    await ticket(101); await ticket(102)
    const filas = [fila(101, 'Excelente', '2027-01-12T13:00:00.000Z', 2), fila(102, 'Regular', '2027-01-13T13:00:00.000Z', 3)]
    await cargarRespuestas(db, filas, 'ana')
    expect(await cargarRespuestas(db, filas, 'beto')).toEqual({ insertadas: 0, duplicadas: 2, rechazadas: [] })
    expect(await guardadas()).toHaveLength(2)
  })

  it('una huella repetida dentro del mismo fichero: la segunda cuenta como duplicada', async () => {
    await ticket(101)
    const r = await cargarRespuestas(db, [fila(101, 'Excelente', '2027-01-12T13:00:00.000Z', 2), fila(101, 'Excelente', '2027-01-12T13:00:00.000Z', 3)], 'ana')
    expect(r).toEqual({ insertadas: 1, duplicadas: 1, rechazadas: [] })
    expect(await guardadas()).toHaveLength(1)
  })

  it('ticket inexistente: va a rechazadas con su fila y MOTIVO_TICKET_INEXISTENTE, sin impedir las demás', async () => {
    await ticket(101)
    const r = await cargarRespuestas(db, [fila(101, 'Excelente', '2027-01-12T13:00:00.000Z', 2), fila(999, 'Regular', '2027-01-12T13:00:00.000Z', 3)], 'ana')
    expect(r).toEqual({ insertadas: 1, duplicadas: 0, rechazadas: [{ fila: 3, motivo: MOTIVO_TICKET_INEXISTENTE }] })
    expect(await guardadas()).toHaveLength(1)
  })

  it('dos respuestas del mismo ticket con distinta marca entran las dos, con huellas distintas', async () => {
    await ticket(101)
    const r = await cargarRespuestas(db, [fila(101, 'Regular', '2027-01-10T13:00:00.000Z', 2), fila(101, 'Excelente', '2027-01-12T13:00:00.000Z', 3)], 'ana')
    expect(r.insertadas).toBe(2)
    const g = await guardadas()
    expect(new Set(g.map((f) => f.huella)).size).toBe(2)
  })

  it('cargado_por queda con quien cargó y cargado_at lo pone la base', async () => {
    await ticket(101)
    await cargarRespuestas(db, [fila(101)], 'Gerencia')
    const g = await guardadas()
    expect(g[0].cargado_por).toBe('Gerencia')
    expect(g[0].cargado_at).toBeInstanceOf(Date)
  })

  it('una recarga por otra persona sigue siendo duplicada: cargado_por no entra en la identidad', async () => {
    await ticket(101)
    await cargarRespuestas(db, [fila(101)], 'ana')
    expect((await cargarRespuestas(db, [fila(101)], 'beto')).insertadas).toBe(0)
    expect((await guardadas())[0].cargado_por).toBe('ana')
  })

  // Hipótesis 1 y 2 del diseño (pg-mem): la red `ON CONFLICT (huella) DO NOTHING` sobre un UNIQUE que no es clave primaria, con
  // un INSERT de varias filas y parámetros, deja UNA fila y no falla. La lectura previa de huellas la haría innecesaria aquí, así
  // que se prueba la sentencia directa.
  it('la red de la base: un INSERT de dos filas con la misma huella y ON CONFLICT (huella) DO NOTHING deja una sola', async () => {
    const h = fila(101).huella
    await db.query('INSERT INTO public.encuesta_respuestas (ticket_id, calificacion, respondida_at, huella, cargado_por) VALUES ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $10) ON CONFLICT (huella) DO NOTHING',
      ['t101', 'Excelente', '2027-01-12T13:00:00.000Z', h, 'ana', 't101', 'Excelente', '2027-01-12T13:00:00.000Z', h, 'beto'])
    expect(await guardadas()).toHaveLength(1)
  })
})

describe('cargarRespuestas · sentencias y transacción (RQ-KP-21)', () => {
  /** Envuelve la base y anota cada sentencia que pasa, para contar lecturas y escrituras. */
  function espiar(real: Queryable): { espia: Queryable; sentencias: string[] } {
    const sentencias: string[] = []
    const espia = { query: async (sql: string, p?: unknown[]) => { sentencias.push(sql.replace(/\s+/g, ' ').trim()); return real.query(sql, p) } } as unknown as Queryable
    return { espia, sentencias }
  }

  it('lote vacío: no toca la base', async () => {
    const { espia, sentencias } = espiar(db)
    expect(await cargarRespuestas(espia, [], 'ana')).toEqual({ insertadas: 0, duplicadas: 0, rechazadas: [] })
    expect(sentencias).toEqual([])
  })

  it('con 20 filas: exactamente una lectura de tickets, una de huellas y un INSERT cuyo texto empieza por INSERT INTO public.encuesta_respuestas', async () => {
    for (let n = 1; n <= 20; n++) await ticket(500 + n)
    const filas = Array.from({ length: 20 }, (_, i) => fila(501 + i, 'Excelente', '2027-01-12T13:00:00.000Z', i + 2))
    const { espia, sentencias } = espiar(db)
    expect(await cargarRespuestas(espia, filas, 'ana')).toEqual({ insertadas: 20, duplicadas: 0, rechazadas: [] })
    expect(sentencias.filter((s) => /FROM tickets/i.test(s))).toHaveLength(1)
    expect(sentencias.filter((s) => /SELECT huella FROM public\.encuesta_respuestas/i.test(s))).toHaveLength(1)
    const inserts = sentencias.filter((s) => /^INSERT/i.test(s))
    expect(inserts).toHaveLength(1)
    expect(inserts[0].startsWith('INSERT INTO public.encuesta_respuestas')).toBe(true)
    expect(sentencias).toHaveLength(3)
  })

  it('con trozo = 2 las listas IN y el INSERT van por bloques', async () => {
    for (let n = 1; n <= 5; n++) await ticket(600 + n)
    const filas = Array.from({ length: 5 }, (_, i) => fila(601 + i, 'Excelente', '2027-01-12T13:00:00.000Z', i + 2))
    const { espia, sentencias } = espiar(db)
    expect(await cargarRespuestas(espia, filas, 'ana', 2)).toEqual({ insertadas: 5, duplicadas: 0, rechazadas: [] })
    expect(sentencias.filter((s) => /FROM tickets/i.test(s))).toHaveLength(3)
    expect(sentencias.filter((s) => /SELECT huella FROM/i.test(s))).toHaveLength(3)
    expect(sentencias.filter((s) => /^INSERT/i.test(s))).toHaveLength(3)
    expect(await guardadas()).toHaveLength(5)
  })

  it('estructura BEGIN, lecturas, INSERT y COMMIT por la conexión de la transacción (doble de connect)', async () => {
    const calls: string[] = []
    const consulta = (origen: string) => async (sql: string) => {
      const verbo = sql.trim().split(/\s+/)[0].toUpperCase()
      calls.push(`${origen}:${verbo}`)
      return { rows: verbo === 'SELECT' && /FROM tickets/i.test(sql) ? [{ id: 't101', number: 101 }] : [] }
    }
    const falso = { query: consulta('pool'), connect: async () => ({ query: consulta('tx'), release: () => {} }) } as unknown as Queryable
    expect(await cargarRespuestas(falso, [fila(101)], 'ana')).toEqual({ insertadas: 1, duplicadas: 0, rechazadas: [] })
    expect(calls).toEqual(['tx:BEGIN', 'tx:SELECT', 'tx:SELECT', 'tx:INSERT', 'tx:COMMIT'])
  })

  it('si el INSERT falla: BEGIN, lecturas, INSERT y ROLLBACK, sin COMMIT', async () => {
    const calls: string[] = []
    const consulta = (origen: string) => async (sql: string) => {
      const verbo = sql.trim().split(/\s+/)[0].toUpperCase()
      calls.push(`${origen}:${verbo}`)
      if (verbo === 'INSERT') throw new Error('boom (rastreador)')
      return { rows: /FROM tickets/i.test(sql) ? [{ id: 't101', number: 101 }] : [] }
    }
    const falso = { query: consulta('pool'), connect: async () => ({ query: consulta('tx'), release: () => {} }) } as unknown as Queryable
    await expect(cargarRespuestas(falso, [fila(101)], 'ana')).rejects.toThrow('boom (rastreador)')
    expect(calls).toEqual(['tx:BEGIN', 'tx:SELECT', 'tx:SELECT', 'tx:INSERT', 'tx:ROLLBACK'])
  })
})
