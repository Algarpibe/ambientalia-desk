import { describe, it, expect, beforeEach } from 'vitest'
import { ID_TRANSICION_MIGRACION, NOMBRE_TRANSICION_MIGRACION, ACTOR_MIGRACION, etapasDesdeHistoria, instanteDeJornada } from '@ambientalia/shared'
import { db, instalarArnes } from './testing/appHarness'
import { entradasActuales } from './db/sla'; import { secuenciaDelReloj, tiemposDelRelojPorTicket } from './db/relojSla'; import { ticketsEnEspera } from './db/esperasVencidas'
import { leerEntradasIndicadores, tablaIndicadores } from './indicadores'
import { instanteUltimaTransicion } from './db/fechasTicket'
import { primerDerivado } from './db/primerDerivado'
import { fechasHabilitacion } from './db/colaTaller'
import { ultimaLiberacion } from './db/certificadosFabrica'
import { usosDeUsuario } from './auth/users'
import { getHistorialTicket } from './db/historial'
import { getConversacionTicket } from './db/conversacion'
import { getEquipoHistorial } from './db/equipos'; import { json } from './db/ticketFuentes'

instalarArnes()

/**
 * migracion-tickets-abiertos (F1F-01), tarea 2.3: caracterización de cada lector de `ticket_transitions` frente a la
 * fila marcador de la migración, con `transition_id` que ningún lector conoce y `to_status` NULL (identidad, D-6) o
 * relleno (las dos reglas que cambian el estado). Los lectores que se comportan raro quedan FIJADOS aquí como
 * caracterización y anotados para la bandeja; ninguno se arregla en este cambio (fuera de alcance).
 */
const VALORES = { estado_previo: 'En Proceso', estado_destino: 'En Proceso', status_type_previo: 'Open', managed_by_app_previo: false, regla: 'identidad', corte: '2026-12-01T05:00:00.000Z', ejecutado_por: 'Admin' }

async function marcador(ticketId: string, desde: string, hasta: string | null): Promise<void> {
  await db.query(
    `INSERT INTO ticket_transitions (ticket_id, transition_id, transition_name, from_status, to_status, area, performed_by, values)
     VALUES ($1,$2,$3,$4,$5,'Servicio Técnico',$6,$7)`,
    [ticketId, ID_TRANSICION_MIGRACION, NOMBRE_TRANSICION_MIGRACION, desde, hasta, ACTOR_MIGRACION, JSON.stringify(VALORES)],
  )
}

beforeEach(async () => {
  await db.query("INSERT INTO equipos (id, serial, marca, modelo, tipo, cliente_nombre, source) VALUES ('eq-1','S1','Grimm','EDM180C','Monitor','Cliente','seed')")
  await db.query("INSERT INTO tickets (id, number, subject, status, status_type, created_time, equipo_id) VALUES ('z1', 4100, 'Identidad', 'En Proceso', 'Open', '2026-10-01T10:00:00Z', 'eq-1'), ('z2', 4200, 'Cambia', 'En Proceso', 'Open', '2026-10-01T10:00:00Z', 'eq-1')")
  await marcador('z1', 'En Proceso', null)
  await marcador('z2', 'Pendiente', 'En Proceso')
})

describe('lectores de ticket_transitions frente al marcador de la migración', () => {
  it('apps/desk/server/db/sla.ts:88 · ningún marcador entra con su performed_at: el de identidad no es entrada y el de z2 (regla desconocida con destino, S-13) queda sin dato', async () => {
    const m = await entradasActuales(db, [{ id: 'z1', status: 'En Proceso' }, { id: 'z2', status: 'En Proceso' }], ['En Proceso'])
    expect([...m.keys()]).toEqual([])
  })

  it('lectores por transition_id y por valores no ven el marcador', async () => {
    expect(await instanteUltimaTransicion(db, 'z1', 'escalado_a_revision')).toBeNull()
    expect(await primerDerivado(db, 'z1')).toBeNull()
    expect([...(await fechasHabilitacion(db)).keys()]).toEqual([])
    expect(await ultimaLiberacion(db, 'z1')).toBeNull()
    expect(await usosDeUsuario(db, 'u-x')).toBe(0)
  })

  it('apps/desk/server/indicadores.ts:76 · el marcador NO es un paso del historial y «reentrante» sigue «sin dato» (RQ-TC-69, S-5; antes lo volvía falso)', async () => {
    await db.query("UPDATE tickets SET status_type = 'Closed'"); const e = await leerEntradasIndicadores(db, { desde: null, hasta: null })
    expect(e.historial.get('z1')).toBeUndefined()
    const fila = tablaIndicadores(e).find((f) => f.ticketId === 'z1')!
    // Historial vacío da `null` (`packages/shared/src/indicadores.ts:134`): el salto del marcador en `apps/desk/server/indicadores.ts:81` lo consigue.
    expect([...new Set(fila.indicadores.map((i) => i.reentrante))]).toEqual([null])
  })

  it('apps/desk/server/db/historial.ts:137 y apps/desk/server/db/conversacion.ts:140 · lo enseñan como «Transición» con «—» de llegada y las claves de values en crudo', async () => {
    const h = await getHistorialTicket(db, 'z1')
    const ev = h.eventos.find((x) => x.eventName === 'AppTransition')!
    expect(ev.title).toBe(`Transición: ${NOMBRE_TRANSICION_MIGRACION}`)
    expect(ev.details).toContainEqual({ label: 'Estado', value: 'En Proceso → —' })
    // Se comporta raro: etiquetas con la clave en español pegada a un «previo» y un booleano en inglés (`etiquetaCampo`). Bandeja.
    expect(ev.details?.map((d) => d.label)).toContain('Managed by app previo')
    const c = await getConversacionTicket(db, 'z1')
    expect(c.mensajes.some((m) => m.content.includes('En Proceso → —') && m.content.includes('Regla: identidad'))).toBe(true)
  })

  it('apps/desk/server/db/equipos.ts:275 · la hoja de vida lo lista como una etapa sin estado de llegada y no falla', async () => {
    const hv = await getEquipoHistorial(db, 'eq-1')
    const pasos = (hv?.cronologia ?? []).flatMap((i) => (i.clase === 'ticket' ? i.ticket.pasos.flatMap((p) => (p.clase === 'etapa' ? [p.etapa] : [])) : []))
    expect(pasos.filter((p) => p.transitionName === NOMBRE_TRANSICION_MIGRACION).map((p) => p.toStatus).sort()).toEqual(['En Proceso', null])
  })
})

/**
 * marcador-migracion-lectores (F1F-01), L1: `entradasActuales` y los tres relojes fechan el marcador con la fecha de Zoho y no con su
 * `performed_at` (RQ-TC-84, RQ-TC-85, RQ-TC-86). Los `values` son los que escribe la migración real (`migracionTicketsAbiertos.ts`).
 */
const REGLA_PENDIENTE = { estado_previo: 'Pendiente', estado_destino: 'En Proceso', status_type_previo: 'Open', managed_by_app_previo: false, regla: 'pendiente-servicio-a-en-proceso', corte: '2026-12-01T05:00:00.000Z', ejecutado_por: 'Admin' }
const REGLA_ENTREGADO = { estado_previo: 'Entregado', estado_destino: 'Finalizado', status_type_previo: 'Closed', managed_by_app_previo: false, regla: 'entregado-a-finalizado', corte: '2026-12-01T05:00:00.000Z', ejecutado_por: 'Admin', closed_time_previo: '2026-11-30T15:00:00.000Z', closed_time_destino: '2026-11-30T15:00:00.000Z', cierre_origen: 'zoho' }
const REGLA_IDENTIDAD = { estado_previo: 'En Proceso', estado_destino: 'En Proceso', status_type_previo: 'Open', managed_by_app_previo: false, regla: 'identidad', corte: '2026-12-01T05:00:00.000Z', ejecutado_por: 'Admin' }
const CREADO = '2026-10-01T09:00:00Z'

async function ticketL1(id: string, number: number, status: string, statusType = 'Open', creado: string = CREADO): Promise<void> {
  await db.query('INSERT INTO tickets (id, number, subject, status, status_type, created_time) VALUES ($1,$2,$3,$4,$5,$6)', [id, number, 'L1', status, statusType, creado])
}
const marcadorDe = (ticketId: string, desde: string, hasta: string | null, values: object) => db.query(
  `INSERT INTO ticket_transitions (ticket_id, transition_id, transition_name, from_status, to_status, area, performed_by, values)
   VALUES ($1,$2,$3,$4,$5,'Servicio Técnico',$6,$7)`,
  [ticketId, ID_TRANSICION_MIGRACION, NOMBRE_TRANSICION_MIGRACION, desde, hasta, ACTOR_MIGRACION, JSON.stringify(values)],
)
const transicionReal = (ticketId: string, desde: string, hasta: string, cuando: string) => db.query(
  'INSERT INTO ticket_transitions (ticket_id, transition_id, from_status, to_status, performed_at) VALUES ($1,$2,$3,$4,$5)', [ticketId, 'x', desde, hasta, cuando],
)
let nHistoria = 0
// Un `TicketUpdated` de `ticket_history` (`packages/zoho-sync/src/db/schema.sql:244-253`, con `id` propio) con el `raw` que lee `etapasDesdeHistoria`.
const cambioDeZoho = (ticketId: string, de: string, hacia: string, cuando: string) => db.query(
  'INSERT INTO ticket_history (id, ticket_id, event_name, event_time, raw) VALUES ($1,$2,$3,$4,$5)',
  [`h-l1-${++nHistoria}`, ticketId, 'TicketUpdated', cuando, JSON.stringify({
    eventName: 'TicketUpdated', eventTime: cuando, actor: { id: 'bp', name: 'Blueprint', type: 'Blueprint' },
    eventInfo: [{ propertyName: 'Status', propertyValue: { previousValue: de, updatedValue: hacia, type: 'Text' }, propertyType: 'ValueTransition' }], actorInfo: [],
  })],
)
const filasDe = async (ticketId: string) => (await db.query('SELECT id, ticket_id, transition_id, from_status, to_status, performed_at, values FROM ticket_transitions WHERE ticket_id = $1 ORDER BY id', [ticketId])).rows as Record<string, unknown>[]
const etapasDe = async (ticketId: string) => etapasDesdeHistoria(((await db.query('SELECT raw FROM ticket_history WHERE ticket_id = $1', [ticketId])).rows as Array<{ raw: unknown }>).map((r) => json(r.raw)))

describe('L1 · el marcador fecha con la fecha de Zoho', () => {
  it('P1 · entradasActuales: «Pendiente» → «En Proceso» entra con la ÚLTIMA entrada de Zoho a «Pendiente», no con el performed_at del marcador', async () => {
    await ticketL1('T-201', 5201, 'En Proceso'); await ticketL1('T-205', 5205, 'En Proceso')
    await cambioDeZoho('T-201', 'Ingresado', 'Pendiente', '2026-10-10T10:00:00Z'); await cambioDeZoho('T-201', 'Pendiente', 'Ingresado', '2026-10-15T10:00:00Z')
    await cambioDeZoho('T-201', 'Ingresado', 'Pendiente', '2026-10-20T14:00:00Z')
    await marcadorDe('T-201', 'Pendiente', 'En Proceso', REGLA_PENDIENTE)
    await marcadorDe('T-205', 'Pendiente', 'En Proceso', REGLA_PENDIENTE) // sin historia de Zoho: sin fecha, no entra
    const m = await entradasActuales(db, [{ id: 'T-201', status: 'En Proceso' }, { id: 'T-205', status: 'En Proceso' }], ['En Proceso'])
    expect([...m.keys()]).toEqual(['T-201'])
    expect(m.get('T-201')).toEqual(new Date('2026-10-20T14:00:00Z'))
  })

  it('P2 · entradasActuales: «Entregado» → «Finalizado» entra con el cierre de Zoho (D-3); con el cierre de la migración, sin dato', async () => {
    await ticketL1('T-203', 5203, 'Finalizado', 'Closed'); await ticketL1('T-208', 5208, 'Finalizado', 'Closed')
    await cambioDeZoho('T-203', 'En Proceso', 'Entregado', '2026-11-20T10:00:00Z'); await cambioDeZoho('T-208', 'En Proceso', 'Entregado', '2026-11-20T10:00:00Z')
    await marcadorDe('T-203', 'Entregado', 'Finalizado', { ...REGLA_ENTREGADO, closed_time_destino: '2026-11-30T15:00:00.000Z' })
    await marcadorDe('T-208', 'Entregado', 'Finalizado', { ...REGLA_ENTREGADO, cierre_origen: 'migracion' })
    const m = await entradasActuales(db, [{ id: 'T-203', status: 'Finalizado' }, { id: 'T-208', status: 'Finalizado' }], ['Finalizado'])
    expect([...m.keys()]).toEqual(['T-203'])
    expect(m.get('T-203')).toEqual(new Date('2026-11-30T15:00:00.000Z'))
  })

  it('P3 · entradasActuales sin marcador: gana la última de dos transiciones reales (caracterización)', async () => {
    await ticketL1('T-206', 5206, 'En Proceso')
    await transicionReal('T-206', 'Ingresado', 'En Proceso', '2026-10-01T10:00:00Z'); await transicionReal('T-206', 'Pendiente', 'En Proceso', '2026-10-03T10:00:00Z')
    const m = await entradasActuales(db, [{ id: 'T-206', status: 'En Proceso' }], ['En Proceso'])
    expect(m.get('T-206')).toEqual(new Date('2026-10-03T10:00:00Z'))
  })

  it('P4 · secuenciaDelReloj: el marcador de identidad no la vuelve null y no cambia nada', async () => {
    await ticketL1('T-202', 5202, 'En Proceso'); await cambioDeZoho('T-202', 'Ingresado', 'En Proceso', '2026-10-05T09:00:00Z')
    const t = { status: 'En Proceso', createdAt: CREADO }
    const sin = secuenciaDelReloj(t, [], await etapasDe('T-202'))
    expect(sin).toEqual([{ estado: 'Ingresado', desde: new Date(CREADO) }, { estado: 'En Proceso', desde: new Date('2026-10-05T09:00:00Z') }])
    await marcadorDe('T-202', 'En Proceso', null, REGLA_IDENTIDAD)
    expect(secuenciaDelReloj(t, await filasDe('T-202'), await etapasDe('T-202'))).toEqual(sin)
  })

  it('P5 · secuenciaDelReloj: «Pendiente» → «En Proceso» arranca el destino en la fecha de Zoho, detrás de la entrada a «Pendiente» del mismo instante', async () => {
    await ticketL1('T-201', 5201, 'En Proceso')
    await cambioDeZoho('T-201', 'Ingresado', 'Pendiente', '2026-10-10T10:00:00Z'); await cambioDeZoho('T-201', 'Pendiente', 'Ingresado', '2026-10-15T10:00:00Z')
    await cambioDeZoho('T-201', 'Ingresado', 'Pendiente', '2026-10-20T14:00:00Z')
    await marcadorDe('T-201', 'Pendiente', 'En Proceso', REGLA_PENDIENTE)
    const pasos = secuenciaDelReloj({ status: 'En Proceso', createdAt: CREADO }, await filasDe('T-201'), await etapasDe('T-201'))
    expect(pasos?.[pasos.length - 1]).toEqual({ estado: 'En Proceso', desde: new Date('2026-10-20T14:00:00Z') })
    expect(pasos?.[pasos.length - 2]).toEqual({ estado: 'Pendiente', desde: new Date('2026-10-20T14:00:00Z') })
    expect(pasos).toHaveLength(5)
  })

  it('P6 · secuenciaDelReloj: «Pendiente» → «En Proceso» sin «Pendiente» en la historia de Zoho (que sí llega a «En Proceso») da null (S-11)', async () => {
    await ticketL1('T-207', 5207, 'En Proceso'); await cambioDeZoho('T-207', 'Ingresado', 'En Proceso', '2026-10-10T10:00:00Z')
    await marcadorDe('T-207', 'Pendiente', 'En Proceso', REGLA_PENDIENTE)
    expect(secuenciaDelReloj({ status: 'En Proceso', createdAt: CREADO }, await filasDe('T-207'), await etapasDe('T-207'))).toBeNull()
  })

  it('P7 · tiemposDelRelojPorTicket: marcador de identidad y luego una transición real a «Finalizado» da horas, no null', async () => {
    const a = (dia: string, hora: number): Date => instanteDeJornada(dia, hora)
    await ticketL1('T-202', 5202, 'Finalizado', 'Closed', a('2026-10-26', 8).toISOString())
    await marcadorDe('T-202', 'En Proceso', null, REGLA_IDENTIDAD)
    await transicionReal('T-202', 'En Proceso', 'Finalizado', a('2026-10-27', 17).toISOString())
    const mapa = await tiemposDelRelojPorTicket(db, [{ id: 'T-202', status: 'Finalizado', status_type: 'Closed', created_time: a('2026-10-26', 8) }], a('2026-10-28', 17))
    expect(mapa.get('T-202')).toEqual({ slaHoras: 18, totalHoras: 18 })
  })

  it('P8 · ticketsEnEspera: el marcador de identidad no borra la espera; se mide desde la entrada de Zoho', async () => {
    await ticketL1('T-202', 5202, 'En Espera de Repuestos'); await cambioDeZoho('T-202', 'En Proceso', 'En Espera de Repuestos', '2026-10-05T09:00:00Z')
    await marcadorDe('T-202', 'En Espera de Repuestos', null, { ...REGLA_IDENTIDAD, estado_previo: 'En Espera de Repuestos', estado_destino: 'En Espera de Repuestos' })
    expect((await ticketsEnEspera(db)).map((e) => ({ id: e.id, estado: e.estado, desde: e.desde }))).toEqual([{ id: 'T-202', estado: 'En Espera de Repuestos', desde: new Date('2026-10-05T09:00:00Z') }])
  })

  it('P9 · ticketsEnEspera: sin historia de Zoho ni transición real no figura (caracterización)', async () => {
    await ticketL1('T-204', 5204, 'En Espera de Repuestos')
    await marcadorDe('T-204', 'En Espera de Repuestos', null, REGLA_IDENTIDAD)
    expect(await ticketsEnEspera(db)).toEqual([])
  })
})
