import { describe, it, expect } from 'vitest'
import request from 'supertest'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { ID_TRANSICION_MIGRACION, NOMBRE_TRANSICION_MIGRACION, ACTOR_MIGRACION } from '@ambientalia/shared'
import { db, instalarArnes, appWith, adminCookie } from './testing/appHarness'
import { leerEntradasIndicadores } from './indicadores'

instalarArnes()

/**
 * F1F-05, `poblacion-cierre-variante-47-51` (L2): RQ-KP-35 y RQ-KP-36. La población de los indicadores son los cerrados NO anulados cuyo
 * día de cierre (RQ-KP-34, en Bogotá) cae en el periodo; el corte en SQL es por `status_type` y el del día, en memoria. Cuatro consultas,
 * sólo lectura, y el marcador de la migración sale en la misma consulta que el historial sin llegar a los indicadores.
 */
const PERIODO = { desde: '2026-09-01', hasta: '2026-09-30' }
const sinPeriodo = { desde: null, hasta: null }
/** Mediodía de Bogotá: nunca cae en el borde del día. */
const mediodia = (dia: string): string => `${dia}T17:00:00Z`

interface Alta { creado?: string; cerrado?: string | null; estado?: string; tipo?: 'Closed' | 'Open'; clasificacion?: string | null }
let n = 9000
async function ticket(id: string, o: Alta = {}): Promise<void> {
  const cerrado = o.cerrado == null ? null : mediodia(o.cerrado)
  await db.query(
    "INSERT INTO tickets (id, number, subject, status, status_type, created_time, closed_time, classification) VALUES ($1, $2, 's', $3, $4, $5, $6, $7)",
    [id, ++n, o.estado ?? 'Finalizado', o.tipo ?? 'Closed', mediodia(o.creado ?? '2026-08-01'), cerrado, o.clasificacion ?? null],
  )
}
async function paso(id: string, transicion: string, cuando: string): Promise<void> {
  await db.query('INSERT INTO ticket_transitions (ticket_id, transition_id, values, performed_at) VALUES ($1, $2, $3, $4)', [id, transicion, '{}', cuando])
}
async function marcador(ticketId: string, origen: 'zoho' | 'migracion', destino: string): Promise<void> {
  await db.query(
    `INSERT INTO ticket_transitions (ticket_id, transition_id, transition_name, from_status, to_status, area, performed_by, values, performed_at)
     VALUES ($1, $2, $3, 'Entregado', 'Finalizado', 'Servicio Técnico', $4, $5, $6)`,
    [ticketId, ID_TRANSICION_MIGRACION, NOMBRE_TRANSICION_MIGRACION, ACTOR_MIGRACION,
      JSON.stringify({ regla: 'entregado-a-finalizado', closed_time_previo: origen === 'zoho' ? destino : null, closed_time_destino: destino, cierre_origen: origen }), '2026-12-12T15:00:00Z'],
  )
}
function espia(): { q: Queryable; textos: string[] } {
  const textos: string[] = []
  return { textos, q: { query: ((sql: string, p?: unknown[]) => { textos.push(sql); return db.query(sql, p) }) as Queryable['query'] } }
}
const idsDe = async (p: { desde: string | null; hasta: string | null } = PERIODO): Promise<string[]> => (await leerEntradasIndicadores(db, p)).tickets.map((t) => t.id)

describe('RQ-KP-35 · población por cierre', () => {
  it('cierre en el periodo, creación fuera (mutación: cortar por creación): sale el creado en agosto y cerrado el 10/09, no el creado el 03/09 y cerrado el 02/10', async () => {
    await ticket('agosto', { creado: '2026-08-15', cerrado: '2026-09-10' })
    await ticket('octubre', { creado: '2026-09-03', cerrado: '2026-10-02' })
    expect(await idsDe()).toEqual(['agosto'])
  })
  it('un anulado no entra (mutación: dejar entrar anulados), aunque tenga status_type Closed y su cierre caiga dentro', async () => {
    await ticket('anulado', { creado: '2026-09-02', cerrado: '2026-09-10', estado: 'Anulado' })
    await ticket('normal', { creado: '2026-09-02', cerrado: '2026-09-10' })
    expect(await idsDe()).toEqual(['normal'])
  })
  it('un abierto no entra (mutación: dejar entrar abiertos), aunque su closed_time caiga dentro del periodo', async () => {
    await ticket('abierto', { creado: '2026-09-02', cerrado: '2026-09-10', estado: 'En Proceso', tipo: 'Open' })
    await ticket('cerrado', { creado: '2026-09-02', cerrado: '2026-09-10' })
    expect(await idsDe()).toEqual(['cerrado'])
  })
  it('migrado con la fecha de Zoho (mutación: la fecha de la migración): la que puso la migración no cuenta; la de Zoho sí', async () => {
    await ticket('migrado', { creado: '2026-08-02', cerrado: '2026-09-15' }); await marcador('migrado', 'migracion', mediodia('2026-09-15'))
    await ticket('zoho', { creado: '2026-08-02', cerrado: '2026-09-16' }); await marcador('zoho', 'zoho', mediodia('2026-09-16'))
    await ticket('zohoFuera', { creado: '2026-08-02', cerrado: '2026-10-16' }); await marcador('zohoFuera', 'zoho', mediodia('2026-10-16'))
    expect(await idsDe()).toEqual(['zoho'])
  })
  it('la transición a «Finalizado» manda sobre closed_time: cierra en el periodo por la transición aunque closed_time caiga fuera, y al revés', async () => {
    await ticket('porPaso', { creado: '2026-08-02', cerrado: '2026-10-20' }); await paso('porPaso', 'entrega_al_cliente', mediodia('2026-09-12'))
    await ticket('porClosed', { creado: '2026-08-02', cerrado: '2026-09-20' }); await paso('porClosed', 'entrega_al_cliente', mediodia('2026-10-12'))
    expect(await idsDe()).toEqual(['porPaso'])
  })
  it('los bordes del periodo: salen el día `desde` y el día `hasta`, y no el día anterior a `desde` ni el siguiente a `hasta`', async () => {
    await ticket('antes', { cerrado: '2026-08-31' }); await ticket('desde', { cerrado: '2026-09-01' })
    await ticket('hasta', { cerrado: '2026-09-30' }); await ticket('despues', { cerrado: '2026-10-01' })
    expect(await idsDe()).toEqual(['desde', 'hasta'])
  })
  it('el día se mide en Bogotá: el 01/10 a las 03:00Z es el 30/09 y entra con hasta=2026-09-30', async () => {
    await ticket('tarde', { cerrado: null }); await db.query("UPDATE tickets SET closed_time = '2026-10-01T03:00:00Z' WHERE id = 'tarde'")
    expect(await idsDe()).toEqual(['tarde'])
  })
  it('sin periodo (S-4): sale el cerrado sin cierre que cuente y no el abierto ni el anulado; con periodo, el cerrado sin cierre no sale', async () => {
    await ticket('sinCierre', { cerrado: null }); await ticket('abierto', { cerrado: null, estado: 'En Proceso', tipo: 'Open' })
    await ticket('anulado', { cerrado: null, estado: 'Anulado' })
    expect(await idsDe(sinPeriodo)).toEqual(['sinCierre'])
    expect(await idsDe(PERIODO)).toEqual([])
    expect(await idsDe({ desde: '2026-09-01', hasta: null })).toEqual([])
    expect(await idsDe({ desde: null, hasta: '2026-09-30' })).toEqual([])
  })
  it('cada ticket admitido lleva su día de cierre en diaDeCierre', async () => {
    await ticket('a', { cerrado: '2026-09-10' }); await ticket('b', { cerrado: '2026-09-11' }); await paso('b', 'entrega_al_cliente', mediodia('2026-09-12'))
    const e = await leerEntradasIndicadores(db, PERIODO)
    expect(e.tickets.map((t) => [t.id, t.diaDeCierre])).toEqual([['a', '2026-09-10'], ['b', '2026-09-12']])
  })
  it('el historial, la encuesta y las clasificaciones sólo traen a los admitidos: un cerrado fuera del periodo no viaja', async () => {
    await ticket('dentro', { cerrado: '2026-09-10', clasificacion: 'Servicio' }); await ticket('fuera', { cerrado: '2026-10-10', clasificacion: 'Servicio' })
    await paso('dentro', 'x', mediodia('2026-09-05')); await paso('fuera', 'x', mediodia('2026-09-06'))
    for (const id of ['dentro', 'fuera']) await db.query("INSERT INTO public.encuesta_respuestas (ticket_id, calificacion, respondida_at, huella, cargado_por) VALUES ($1, 'Bien', '2026-10-20T10:00:00Z', $2, 'prueba')", [id, `h-${id}`])
    const e = await leerEntradasIndicadores(db, PERIODO)
    expect(e.tickets.map((t) => t.id)).toEqual(['dentro'])
    expect([...e.historial.keys()]).toEqual(['dentro'])
    expect([...e.calificaciones.keys()]).toEqual(['dentro'])
    expect([...e.clasificaciones.keys()]).toEqual(['dentro'])
  })
  it('respuestas de tickets fuera de la población (cerrado fuera del periodo, abierto y anulado): no viajan y no afectan a ningún otro', async () => {
    await ticket('dentro', { cerrado: '2026-09-10' }); await ticket('fuera', { cerrado: '2026-10-10' })
    await ticket('abierto', { cerrado: '2026-09-10', estado: 'En Proceso', tipo: 'Open' }); await ticket('anulado', { cerrado: '2026-09-10', estado: 'Anulado' })
    for (const id of ['fuera', 'abierto', 'anulado']) await db.query("INSERT INTO public.encuesta_respuestas (ticket_id, calificacion, respondida_at, huella, cargado_por) VALUES ($1, 'Mala', '2026-10-20T10:00:00Z', $2, 'prueba')", [id, `h-${id}`])
    const e = await leerEntradasIndicadores(db, PERIODO)
    expect(e.tickets.map((t) => t.id)).toEqual(['dentro'])
    expect([...e.calificaciones.keys()]).toEqual([])
  })
  it('El flujo se compone (mutación: dejar de componerlo): el GET con flujo=equipo-nuevo sólo trae el cerrado de equipo nuevo', async () => {
    await ticket('en', { cerrado: '2026-09-10', clasificacion: 'Equipo nuevo' }); await ticket('sv', { cerrado: '2026-09-11', clasificacion: 'Servicio' })
    const res = await request(appWith().app).get('/api/indicadores').query({ ...PERIODO, flujo: 'equipo-nuevo' }).set('Cookie', await adminCookie())
    expect(res.status).toBe(200)
    expect(res.body.tickets.map((t: { ticketId: string }) => t.ticketId)).toEqual(['en'])
  })
})

describe('RQ-KP-36 · cuatro consultas, sólo lectura, marcador en la misma consulta', () => {
  it.each([1, 20])('con %i cerrados, varios con marcador de la migración: EXACTAMENTE cuatro consultas, todas SELECT', async (cuantos) => {
    for (let i = 1; i <= cuantos; i++) {
      await ticket(`t${i}`, { cerrado: '2026-09-10' }); await paso(`t${i}`, 'p', mediodia('2026-09-05'))
      if (i % 3 === 0) await marcador(`t${i}`, 'zoho', mediodia('2026-09-10'))
    }
    const { q, textos } = espia()
    const e = await leerEntradasIndicadores(q, PERIODO)
    expect(e.tickets).toHaveLength(cuantos)
    expect(textos).toHaveLength(4)
    expect(textos.every((s) => /^\s*SELECT/i.test(s))).toBe(true)
  })
  it('el marcador sale en la MISMA consulta del historial: una sola consulta nombra ticket_transitions', async () => {
    await ticket('m', { cerrado: '2026-09-10' }); await marcador('m', 'zoho', mediodia('2026-09-10'))
    const { q, textos } = espia()
    await leerEntradasIndicadores(q, PERIODO)
    expect(textos.filter((s) => /ticket_transitions/.test(s))).toHaveLength(1)
  })
  it('el marcador no es un paso del cálculo: no está en el historial de los indicadores, pero el cierre sí lo tuvo en cuenta', async () => {
    await ticket('m', { cerrado: '2026-09-15' }); await marcador('m', 'migracion', mediodia('2026-09-15')); await paso('m', 'x', mediodia('2026-09-05'))
    const sin = await leerEntradasIndicadores(db, sinPeriodo)
    expect(sin.historial.get('m')?.map((p) => p.transitionId)).toEqual(['x'])
    expect(sin.tickets[0].diaDeCierre).toBeNull()
    expect(await idsDe()).toEqual([])
  })
  it('sólo lectura: ninguna sentencia de escritura y closed_time queda como estaba', async () => {
    await ticket('a', { cerrado: '2026-09-10' }); await marcador('a', 'migracion', mediodia('2026-09-10'))
    const antes = (await db.query('SELECT id, closed_time FROM tickets ORDER BY id')).rows
    const { q, textos } = espia()
    await leerEntradasIndicadores(q, PERIODO)
    expect(textos.filter((s) => !/^\s*SELECT/i.test(s))).toEqual([])
    expect((await db.query('SELECT id, closed_time FROM tickets ORDER BY id')).rows).toEqual(antes)
  })
})
