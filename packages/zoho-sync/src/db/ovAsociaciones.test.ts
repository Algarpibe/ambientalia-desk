import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './migrate'
import { OvYaAsociadaError, asociarOV, asociarDesdeTransicion, listarAsociaciones, liberarAsociacion, liberarAsociacionesDeTicket } from './ovAsociaciones'
import { ticketConOrdenVenta } from './repo'

/**
 * `ov_asociaciones` no tiene FK a `tickets` (mismo caso que `public.remisiones`,
 * `schema.sql:271-288`): `ticket_id` es `text` libre, así que los tests usan ids sintéticos sin
 * necesidad de sembrar la tabla `tickets`.
 */
let db: Queryable
beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

describe('asociarOV', () => {
  it('crea una fila vigente para el ticket y la OV dados', async () => {
    const fila = await asociarOV(db, {
      ticketId: 't1', numero: 'OV-2026-001', salesorderId: 'so-1',
      origen: 'alta', actor: 'tester', fechaOrdenCompra: null,
    })
    expect(fila.ticket_id).toBe('t1')
    expect(fila.numero).toBe('OV-2026-001')
    expect(fila.salesorder_id).toBe('so-1')
    expect(fila.origen).toBe('alta')
    expect(fila.liberada_at).toBeNull()
  })

  // RQ-TC-17, escenario "Segunda asociación vigente sobre la misma OV es rechazada por la base".
  it('una segunda asociación vigente con el mismo numero/salesorderId para otro ticket es rechazada por la base (23505) y sale como OvYaAsociadaError 409', async () => {
    await asociarOV(db, {
      ticketId: 't1', numero: 'OV-2026-002', salesorderId: 'so-2',
      origen: 'alta', actor: 'tester', fechaOrdenCompra: null,
    })
    await expect(
      asociarOV(db, {
        ticketId: 't2', numero: 'OV-2026-002', salesorderId: 'so-2',
        origen: 'alta', actor: 'tester', fechaOrdenCompra: null,
      }),
      // pg-mem etiqueta mal la restricción violada como `_pkey` en el mensaje: se comprueba el
      // código 23505, nunca el nombre de la restricción.
    ).rejects.toSatisfy((e: unknown) => e instanceof OvYaAsociadaError && e.status === 409 && e.numero === 'OV-2026-002' && (e.body as { error: string }).error === 'La orden de venta OV-2026-002 ya está asociada a otro ticket')
  })

  it('es idempotente: repetir el mismo numero/ticketId no crea una segunda fila', async () => {
    const primera = await asociarOV(db, {
      ticketId: 't3', numero: 'OV-2026-003', salesorderId: 'so-3',
      origen: 'alta', actor: 'tester', fechaOrdenCompra: null,
    })
    const segunda = await asociarOV(db, {
      ticketId: 't3', numero: 'OV-2026-003', salesorderId: 'so-3',
      origen: 'alta', actor: 'tester', fechaOrdenCompra: null,
    })
    expect(segunda.id).toBe(primera.id)
    expect(await listarAsociaciones(db, 't3')).toHaveLength(1)
  })
})

describe('liberarAsociacion', () => {
  // RQ-TC-19, escenario "Liberar conserva la fila con su motivo".
  it('conserva la fila con fecha, persona y motivo de liberacion, y deja de contar como vigente', async () => {
    const fila = await asociarOV(db, {
      ticketId: 't4', numero: 'OV-2026-004', salesorderId: 'so-4',
      origen: 'alta', actor: 'tester', fechaOrdenCompra: null,
    })

    const liberada = await liberarAsociacion(db, fila.id, 'comercial-1', 'Cliente canceló el servicio')

    expect(liberada).not.toBeNull()
    expect(liberada!.id).toBe(fila.id)
    expect(liberada!.liberada_at).not.toBeNull()
    expect(liberada!.liberada_por).toBe('comercial-1')
    expect(liberada!.motivo_liberacion).toBe('Cliente canceló el servicio')

    const [restante] = await listarAsociaciones(db, 't4')
    expect(restante.liberada_at).not.toBeNull()
    expect(restante.motivo_liberacion).toBe('Cliente canceló el servicio')
  })

  // RQ-TC-19, escenario "Tras liberar, la OV es reasociable". El numero Y el salesorderId se repiten
  // A PROPOSITO entre la asociacion original y la nueva (misma OV real): así la mutación de la regla 2
  // sobre CUALQUIERA de los dos índices únicos parciales (numero, salesorder_id) pone esta prueba roja.
  it('tras liberar, la misma OV (numero y salesorderId) es reasociable a otro ticket', async () => {
    const original = await asociarOV(db, {
      ticketId: 't5', numero: 'OV-2026-005', salesorderId: 'so-5',
      origen: 'alta', actor: 'tester', fechaOrdenCompra: null,
    })
    await liberarAsociacion(db, original.id, 'comercial-1', 'Ticket cerrado sin usar la OV')

    const reasociada = await asociarOV(db, {
      ticketId: 't6', numero: 'OV-2026-005', salesorderId: 'so-5',
      origen: 'alta', actor: 'tester', fechaOrdenCompra: null,
    })

    expect(reasociada.ticket_id).toBe('t6')
    expect(reasociada.liberada_at).toBeNull()
    expect(reasociada.id).not.toBe(original.id)
  })
})

describe('liberarAsociacionesDeTicket', () => {
  it('libera todas las asociaciones vigentes de un ticket con el mismo motivo', async () => {
    await asociarOV(db, { ticketId: 't7', numero: 'OV-2026-006', salesorderId: 'so-6', origen: 'alta', actor: 'tester', fechaOrdenCompra: null })
    await asociarOV(db, { ticketId: 't7', numero: 'OV-2026-007', salesorderId: 'so-7', origen: 'remision', actor: 'tester', fechaOrdenCompra: null })

    await liberarAsociacionesDeTicket(db, 't7', 'Ticket eliminado', 'Beto')

    const filas = await listarAsociaciones(db, 't7')
    expect(filas).toHaveLength(2)
    expect(filas.every((f) => f.liberada_at !== null && f.motivo_liberacion === 'Ticket eliminado')).toBe(true)
  })
})

/**
 * Lote 2 · la TERCERA VÍA de `ticketConOrdenVenta` (RQ-TC-17, base de RQ-TC-08 escenario 2). Ninguno de
 * estos tickets guarda la OV en sus columnas: la única traza es la fila de `ov_asociaciones`, que es
 * justo lo que las dos vías de columna no ven.
 */
describe('ticketConOrdenVenta · tercera vía (asociación vigente sin coincidencia por columna)', () => {
  const ticketSinColumnas = (id: string, numero: number) =>
    db.query("INSERT INTO tickets (id, number, subject, status) VALUES ($1,$2,'Sin OV en columnas','Ingresado')", [id, numero])
  const asociar = (ticketId: string) =>
    asociarOV(db, { ticketId, numero: 'OV-2026-401', salesorderId: 'so-401', origen: 'alta', actor: 'tester', fechaOrdenCompra: null })

  it('encuentra el ticket que sólo tiene la OV en una asociación vigente, por número y por id', async () => {
    await ticketSinColumnas('t-a', 9001)
    await asociar('t-a')

    expect(await ticketConOrdenVenta(db, { salesorderId: 'so-401', numero: 'OV-2026-401' })).toEqual({ id: 't-a', number: 9001 })
    expect(await ticketConOrdenVenta(db, { numero: 'OV-2026-401' })).toEqual({ id: 't-a', number: 9001 })
    expect(await ticketConOrdenVenta(db, { salesorderId: 'so-401' })).toEqual({ id: 't-a', number: 9001 })
  })

  it('excluye al propio ticket también en la tercera vía, y una OV distinta no casa', async () => {
    await ticketSinColumnas('t-a', 9001)
    await asociar('t-a')

    expect(await ticketConOrdenVenta(db, { numero: 'OV-2026-401' }, 't-a')).toBeNull()
    expect(await ticketConOrdenVenta(db, { salesorderId: 'so-otro', numero: 'OV-2026-999' })).toBeNull()
  })

  it('una asociación liberada ya no cuenta: la OV vuelve a quedar libre para las tres puertas', async () => {
    await ticketSinColumnas('t-a', 9001)
    const fila = await asociar('t-a')
    await liberarAsociacion(db, fila.id, 'tester', 'Se asoció a otro servicio')

    expect(await ticketConOrdenVenta(db, { salesorderId: 'so-401', numero: 'OV-2026-401' })).toBeNull()
  })
})

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// asociacion-ov-ticket · lote 4 (tarea 4.0c): el origen de la OV adicional lo da la TRANSICIÓN, no la fecha de OC
// ══════════════════════════════════════════════════════════════════════════════════════════════════

describe('asociarDesdeTransicion · origen de la OV adicional', () => {
  it('4.0c · el origen es el id de la transición aunque la fecha de OC diga otra (discrimina: fecha_orden_compra la escribe aprobacion_y_repuestos, pero la transición es aprobacion)', async () => {
    await asociarDesdeTransicion(
      db, 't-o1', { columns: { fecha_orden_compra: '2026-06-01' }, ovAdicional: 'OV-2026-960' }, 'Admin', 'aprobacion',
    )
    const fila = (await listarAsociaciones(db, 't-o1'))[0]
    expect(fila.origen).toBe('aprobacion')
  })

  it('4.0c · aprobacion_y_repuestos, con la fecha de la otra aprobación, sigue diciendo aprobacion_y_repuestos', async () => {
    await asociarDesdeTransicion(
      db, 't-o2', { columns: { fecha_orden_compra_final: '2026-06-01' }, ovAdicional: 'OV-2026-961' }, 'Admin', 'aprobacion_y_repuestos',
    )
    const fila = (await listarAsociaciones(db, 't-o2'))[0]
    expect(fila.origen).toBe('aprobacion_y_repuestos')
    expect(String(fila.fecha_orden_compra)).toContain('2026')
  })
})

/** RQ-TZ-15 · la liberación por borrado del ticket nombra a la persona que borra. */
describe('liberarAsociacionesDeTicket · actor (RQ-TZ-15)', () => {
  const asociar = (ticketId: string, numero: string, so: string) =>
    asociarOV(db, { ticketId, numero, salesorderId: so, origen: 'alta', actor: 'tester', fechaOrdenCompra: null })

  it('dos vigentes quedan con `liberada_por` y la ya liberada conserva el suyo y su instante', async () => {
    await asociar('t-l1', 'OV-2026-801', 'so-801'); await asociar('t-l1', 'OV-2026-802', 'so-802')
    const previa = await asociar('t-l1', 'OV-2026-803', 'so-803')
    await liberarAsociacion(db, previa.id, 'Carla', 'Error de captura')
    const antes = (await listarAsociaciones(db, 't-l1')).find((f) => f.numero === 'OV-2026-803')!

    await liberarAsociacionesDeTicket(db, 't-l1', 'Ticket eliminado', 'Beto')

    const filas = await listarAsociaciones(db, 't-l1')
    const vigentes = filas.filter((f) => f.numero !== 'OV-2026-803')
    expect(vigentes).toHaveLength(2)
    expect(vigentes.map((f) => [f.liberada_por, f.motivo_liberacion])).toEqual([['Beto', 'Ticket eliminado'], ['Beto', 'Ticket eliminado']])
    expect(vigentes.every((f) => f.liberada_at !== null)).toBe(true)
    const despues = filas.find((f) => f.numero === 'OV-2026-803')!
    expect(despues).toMatchObject({ liberada_por: 'Carla', motivo_liberacion: 'Error de captura' })
    expect(despues.liberada_at).toEqual(antes.liberada_at)
  })

  it('un ticket sin vigentes no falla ni actualiza: la liberada de otro ticket no se toca', async () => {
    await asociar('t-l2', 'OV-2026-811', 'so-811')
    await expect(liberarAsociacionesDeTicket(db, 't-sin-ninguna', 'Ticket eliminado', 'Beto')).resolves.toBeUndefined()
    expect(await listarAsociaciones(db, 't-sin-ninguna')).toEqual([])
    expect((await listarAsociaciones(db, 't-l2'))[0]).toMatchObject({ liberada_at: null, liberada_por: null })
  })
})
