import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { ticketsEnEspera } from './esperasVencidas'

/**
 * RQ-AV-26 (D4 a, F1C-03): la ENTRADA a cada una de las cuatro esperas. Sale del último paso de `secuenciaDelReloj`, que funde las
 * transiciones de la app con las etapas de Zoho; sin secuencia el ticket no se mide (S-16). Es una LECTURA: tres consultas fijas.
 * El filtro por flujo (`flujoDelTicket === 'servicio'`) es defensivo: ninguna de las cuatro esperas está en los catálogos de
 * `equipo-nuevo` ni de `soporte-remoto`, así que no hay ticket real que lo ejercite; se declara aquí y no se mide.
 */
let db: Queryable
let n = 0
beforeEach(async () => { n = 0; const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

const NACIO = new Date('2026-01-05T15:00:00Z')
const dia = (d: string) => new Date(`${d}T15:00:00Z`)

async function ticket(status: string, derivadoA: string | null = null, creado: Date | null = NACIO): Promise<string> {
  n++
  await db.query('INSERT INTO tickets (id, number, subject, status, created_time, derivado_a) VALUES ($1,$2,$3,$4,$5,$6)',
    [`t${n}`, 5000 + n, 's', status, creado, derivadoA])
  return `t${n}`
}
const deApp = (id: string, de: string, hacia: string, cuando: Date) =>
  db.query('INSERT INTO ticket_transitions (ticket_id, transition_id, from_status, to_status, performed_at) VALUES ($1,$2,$3,$4,$5)', [id, 'x', de, hacia, cuando])
let evento = 0
const deZoho = (id: string, de: string, hacia: string, cuando: Date) =>
  db.query('INSERT INTO ticket_history (id, ticket_id, event_name, event_time, raw) VALUES ($1,$2,$3,$4,$5)', [`h${++evento}`, id, 'TicketUpdated', cuando,
    JSON.stringify({
      eventName: 'TicketUpdated', eventTime: cuando.toISOString(), actor: { id: 'bp', name: 'Blueprint', type: 'Blueprint' },
      eventInfo: [{ propertyName: 'Status', propertyValue: { previousValue: de, updatedValue: hacia, type: 'Text' }, propertyType: 'ValueTransition' }], actorInfo: [],
    })])

describe('ticketsEnEspera · la entrada a la espera', () => {
  it('un ticket movido por la app: la entrada es la última transición hacia su estado', async () => {
    const id = await ticket('Solicitado', 'u9')
    await deApp(id, 'En Proceso', 'Solicitado', dia('2026-02-01'))
    expect(await ticketsEnEspera(db)).toEqual([{ id, number: 5001, estado: 'Solicitado', desde: dia('2026-02-01'), derivadoA: 'u9' }])
  })

  it('un ticket de Zoho sin historial en la app también se mide: la entrada sale de ticket_history (S-16)', async () => {
    const id = await ticket('Servicio externo')
    await deZoho(id, 'En Proceso', 'Servicio externo', dia('2026-02-10'))
    const r = await ticketsEnEspera(db)
    expect(r.map((x) => [x.id, x.estado, x.desde, x.derivadoA])).toEqual([[id, 'Servicio externo', dia('2026-02-10'), null]])
  })

  it('funde las dos épocas: gana el paso más reciente, sea de la app o de Zoho', async () => {
    const a = await ticket('En Espera de Repuestos')
    await deZoho(a, 'Notificación cliente', 'En Espera de Repuestos', dia('2026-02-01'))
    await deApp(a, 'En Espera de Repuestos', 'En Proceso', dia('2026-02-05'))
    await deApp(a, 'En Proceso', 'En Espera de Repuestos', dia('2026-03-01'))
    const b = await ticket('En espera de SKU inventario')
    await deApp(b, 'Notificación Comercial', 'En espera de SKU inventario', dia('2026-02-01'))
    await deZoho(b, 'En espera de SKU inventario', 'Notificación cliente', dia('2026-02-02'))
    await deZoho(b, 'Notificación cliente', 'En espera de SKU inventario', dia('2026-04-01'))
    const por = new Map((await ticketsEnEspera(db)).map((x) => [x.id, x.desde]))
    expect(por.get(a)).toEqual(dia('2026-03-01'))
    expect(por.get(b)).toEqual(dia('2026-04-01'))
  })

  it('la reentrada da OTRA entrada: la última, no la primera', async () => {
    const id = await ticket('Solicitado')
    await deApp(id, 'En Proceso', 'Solicitado', dia('2026-02-01'))
    await deApp(id, 'Solicitado', 'En Proceso', dia('2026-02-20'))
    await deApp(id, 'En Proceso', 'Solicitado', dia('2026-03-05'))
    expect((await ticketsEnEspera(db))[0]!.desde).toEqual(dia('2026-03-05'))
  })

  it('sin secuencia no se mide (S-16): sin historia, sin fecha de creación, o con el último paso en otro estado', async () => {
    await ticket('Solicitado') // sin ninguna fila
    const sinCreacion = await ticket('Servicio externo', null, null)
    await deApp(sinCreacion, 'En Proceso', 'Servicio externo', dia('2026-02-01'))
    const hueco = await ticket('Solicitado')
    await deApp(hueco, 'En Proceso', 'En Espera de Repuestos', dia('2026-02-01')) // el último paso no es el estado actual
    expect(await ticketsEnEspera(db)).toEqual([])
  })

  it('sólo trae las cuatro esperas: un ticket en otro estado no entra aunque tenga historia', async () => {
    const otro = await ticket('En Proceso')
    await deApp(otro, 'Solicitado', 'En Proceso', dia('2026-02-01'))
    const cerrado = await ticket('Finalizado')
    await deApp(cerrado, 'En Proceso', 'Finalizado', dia('2026-02-01'))
    expect(await ticketsEnEspera(db)).toEqual([])
  })
})
