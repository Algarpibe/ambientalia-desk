import { describe, it, expect, beforeEach } from 'vitest'
import { ID_TRANSICION_MIGRACION, NOMBRE_TRANSICION_MIGRACION, ACTOR_MIGRACION } from '@ambientalia/shared'
import { db, instalarArnes } from './testing/appHarness'
import { entradasActuales } from './db/sla'
import { leerEntradasIndicadores, tablaIndicadores } from './indicadores'
import { instanteUltimaTransicion } from './db/fechasTicket'
import { primerDerivado } from './db/primerDerivado'
import { fechasHabilitacion } from './db/colaTaller'
import { ultimaLiberacion } from './db/certificadosFabrica'
import { usosDeUsuario } from './auth/users'
import { getHistorialTicket } from './db/historial'
import { getConversacionTicket } from './db/conversacion'
import { getEquipoHistorial } from './db/equipos'

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
  it('apps/desk/server/db/sla.ts:88 · el marcador de identidad no cuenta como entrada al estado; el de una regla que cambia el estado sí', async () => {
    const m = await entradasActuales(db, [{ id: 'z1', status: 'En Proceso' }, { id: 'z2', status: 'En Proceso' }], ['En Proceso'])
    expect([...m.keys()]).toEqual(['z2'])
  })

  it('lectores por transition_id y por valores no ven el marcador', async () => {
    expect(await instanteUltimaTransicion(db, 'z1', 'escalado_a_revision')).toBeNull()
    expect(await primerDerivado(db, 'z1')).toBeNull()
    expect([...(await fechasHabilitacion(db)).keys()]).toEqual([])
    expect(await ultimaLiberacion(db, 'z1')).toBeNull()
    expect(await usosDeUsuario(db, 'u-x')).toBe(0)
  })

  it('apps/desk/server/indicadores.ts:76 · el marcador entra como un paso del historial y vuelve «reentrante» falso donde antes era «sin dato»', async () => {
    const e = await leerEntradasIndicadores(db, { desde: null, hasta: null })
    expect(e.historial.get('z1')?.map((p) => p.transitionId)).toEqual([ID_TRANSICION_MIGRACION])
    const fila = tablaIndicadores(e).find((f) => f.ticketId === 'z1')!
    // Sin marcador sería `null` (`packages/shared/src/indicadores.ts:134`, historial vacío). Se comporta raro: bandeja.
    expect([...new Set(fila.indicadores.map((i) => i.reentrante))]).toEqual([false])
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
