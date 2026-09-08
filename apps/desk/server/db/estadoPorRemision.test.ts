import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { STATUS_OV_ASIGNADA, STATUS_REMISION_CREADA, STATUS_TICKET_CREADO } from '@ambientalia/shared'
import { sincronizarEstadoPorRemision } from './estadoPorRemision'

/**
 * LA REGLA INVARIABLE 7, NOMBRADA (§9 del proposal F0-04).
 *
 * `estadoPorRemision.ts` no tenía fichero de prueba. Lo que hacía falta no era «cobertura» —el
 * enganche ya se ejercitaba de refilón por HTTP desde `remisiones.test.ts`, al anular y al recibir el
 * callback— sino una prueba que DIGA la regla, porque una regla que ninguna prueba nombra se borra
 * sin que nadie note que la borró.
 *
 * LA REGLA ES ESTA LÍNEA, y es toda la línea:
 *
 *   `estadoPorRemision.ts:41` → `if (actual !== STATUS_TICKET_CREADO && actual !== STATUS_REMISION_CREADA) return`
 *
 * Dice que este enganche SOLO manda en la fase temprana, y por tanto que las dos entradas al flujo
 * —la remisión, que es automática, y la transición que hace una persona— no se cruzan. Fuera de esas
 * dos casillas el estado lo manda la transición y esta función no tiene voz.
 *
 * ⚠️ POR QUÉ IMPORTA, en las dos direcciones. Sin la guarda:
 *
 *   · un ticket YA EN SERVICIO al que le confirman una remisión retrocedería a `Remisión creada`,
 *     borrando de un plumazo la fase real en la que estaba; y
 *   · anular la remisión de un ticket que ya avanzó lo tiraría hacia atrás hasta `Ticket creado`,
 *     que es la mentira que el comentario de la función se compromete a no contar.
 *
 * Y hay un tercer efecto que la guarda tapa de paso: un ticket venido de Zoho está en `OV asignada`,
 * que no es ninguna de las dos, así que nunca entra. Moverlo lo marcaría `managed_by_app`
 * —lo hace `writeTransition`— y lo sacaría del sync de Zoho sin que nadie lo haya pedido.
 *
 * ⚠️ ESTA TANDA NO CAMBIA NADA (§12 del proposal). Las pruebas documentan el as-built.
 *
 * VERIFICADO POR MUTACIÓN al escribirlas: quitando la guarda de `:41` se ponen ROJAS las cuatro del
 * primer bloque (las tres del barrido y la de `OV asignada`), cada una por el estado al que el
 * ticket se va cuando nadie le corta el paso.
 */

let db: Queryable

beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

/** Ticket suelto en el estado que se le diga. `number` es UNIQUE, así que cada uno lleva el suyo. */
async function ticket(id: string, estado: string, numero = 9100): Promise<void> {
  await db.query('INSERT INTO tickets (id, number, subject, status) VALUES ($1,$2,$3,$4)',
    [id, numero, 'Regla invariable 7', estado])
}

/** Una remisión de ese ticket, con el desenlace que se le diga. `anulada` la deja fuera del recuento. */
async function remision(ticketId: string, id: string, estado: string, anulada = false): Promise<void> {
  await db.query(
    `INSERT INTO remisiones (id, ticket_id, fecha, estado, anulada_at)
     VALUES ($1,$2,'2026-03-01',$3,$4)`,
    [id, ticketId, estado, anulada ? new Date() : null],
  )
}

/** El estado en el que quedó el ticket. */
async function estadoDe(id: string): Promise<string> {
  const r = await db.query('SELECT status FROM tickets WHERE id = $1', [id])
  return (r.rows[0] as { status: string }).status
}

/** Las transiciones que el enganche dejó escritas. Vacío = no tocó nada, que es lo que se afirma abajo. */
async function trazasDe(id: string): Promise<{ transition_id: string; from_status: string; to_status: string }[]> {
  const r = await db.query(
    'SELECT transition_id, from_status, to_status FROM ticket_transitions WHERE ticket_id = $1 ORDER BY id', [id])
  return r.rows as { transition_id: string; from_status: string; to_status: string }[]
}

describe('regla invariable 7 · las dos entradas del flujo no se cruzan', () => {
  /**
   * LOS ESTADOS EN LOS QUE LA REMISIÓN YA NO MANDA, uno por cada forma de haberse ido de la fase
   * temprana: la de después de Habilitar Servicio, una del medio del proceso y una terminal.
   *
   * Se barren varios y no uno porque la guarda no enumera lo prohibido sino lo permitido —dos
   * estados—, y un solo caso dejaría creer que la regla es «no retroceder desde Ingresado».
   */
  const YA_FUERA_DE_LA_FASE_TEMPRANA = ['Ingresado', 'Rev./Diagnostico', 'Finalizado']

  for (const estado of YA_FUERA_DE_LA_FASE_TEMPRANA) {
    it(`un ticket en «${estado}» NO se mueve aunque le confirmen una remisión — la fase avanzada la manda la transición, no la remisión`, async () => {
      await ticket('t1', estado)
      await remision('t1', 'r1', 'ok')

      await sincronizarEstadoPorRemision(db, 't1', 'Prueba')

      expect(await estadoDe('t1')).toBe(estado)
      // Y NO es sólo que el estado coincida por casualidad: no se escribió ninguna transición, así
      // que el ticket tampoco quedó marcado `managed_by_app` ni le apareció una etapa inventada en
      // el historial.
      expect(await trazasDe('t1')).toEqual([])
    })

    it(`un ticket en «${estado}» NO retrocede aunque le anulen la última remisión — anular no tira del ticket hacia atrás`, async () => {
      await ticket('t1', estado)
      await remision('t1', 'r1', 'ok', true) // anulada: el recuento de confirmadas queda en cero

      await sincronizarEstadoPorRemision(db, 't1', 'Prueba')

      expect(await estadoDe('t1')).toBe(estado)
      expect(await trazasDe('t1')).toEqual([])
    })
  }

  /**
   * `OV asignada` es el nombre que la fase temprana tiene EN ZOHO, y la guarda tampoco lo admite. No
   * es un descuido: mover un ticket de Zoho lo marcaría `managed_by_app` y lo sacaría del sync.
   */
  it(`un ticket de Zoho en «${STATUS_OV_ASIGNADA}» NO entra, aunque sea la misma fase con otro nombre`, async () => {
    await ticket('t1', STATUS_OV_ASIGNADA)
    await remision('t1', 'r1', 'ok')

    await sincronizarEstadoPorRemision(db, 't1', 'Prueba')

    expect(await estadoDe('t1')).toBe(STATUS_OV_ASIGNADA)
    expect(await trazasDe('t1')).toEqual([])
  })
})

describe('regla invariable 7 · dentro de la fase temprana, el recuento manda', () => {
  it(`con una remisión confirmada, «${STATUS_TICKET_CREADO}» avanza a «${STATUS_REMISION_CREADA}» y deja traza`, async () => {
    await ticket('t1', STATUS_TICKET_CREADO)
    await remision('t1', 'r1', 'ok')

    await sincronizarEstadoPorRemision(db, 't1', 'Ana')

    expect(await estadoDe('t1')).toBe(STATUS_REMISION_CREADA)
    expect(await trazasDe('t1')).toEqual([
      { transition_id: 'remision_confirmada', from_status: STATUS_TICKET_CREADO, to_status: STATUS_REMISION_CREADA },
    ])
  })

  it(`anulada la última confirmada, «${STATUS_REMISION_CREADA}» vuelve a «${STATUS_TICKET_CREADO}»`, async () => {
    await ticket('t1', STATUS_REMISION_CREADA)
    await remision('t1', 'r1', 'ok', true)

    await sincronizarEstadoPorRemision(db, 't1', 'Ana')

    expect(await estadoDe('t1')).toBe(STATUS_TICKET_CREADO)
    expect(await trazasDe('t1')).toEqual([
      { transition_id: 'remision_retirada', from_status: STATUS_REMISION_CREADA, to_status: STATUS_TICKET_CREADO },
    ])
  })

  // `ok_con_avisos` SÍ cuenta: el documento se generó y lo que falló fue un aviso. `error` no, porque
  // no ha producido ningún documento y avanzar el ticket sería decir que existe una remisión que no.
  it('sólo cuentan las confirmadas: `error` no avanza el ticket y `ok_con_avisos` sí', async () => {
    await ticket('t1', STATUS_TICKET_CREADO, 9101)
    await remision('t1', 'r1', 'error')
    await sincronizarEstadoPorRemision(db, 't1', 'Ana')
    expect(await estadoDe('t1')).toBe(STATUS_TICKET_CREADO)

    await ticket('t2', STATUS_TICKET_CREADO, 9102)
    await remision('t2', 'r2', 'ok_con_avisos')
    await sincronizarEstadoPorRemision(db, 't2', 'Ana')
    expect(await estadoDe('t2')).toBe(STATUS_REMISION_CREADA)
  })

  // Queda una confirmada viva, así que el ticket NO vuelve: la vuelta es del recuento a cero, no de
  // «alguien anuló algo».
  it('con otra confirmada todavía viva, anular una no devuelve el ticket', async () => {
    await ticket('t1', STATUS_REMISION_CREADA)
    await remision('t1', 'r1', 'ok', true)
    await remision('t1', 'r2', 'ok')

    await sincronizarEstadoPorRemision(db, 't1', 'Ana')

    expect(await estadoDe('t1')).toBe(STATUS_REMISION_CREADA)
    expect(await trazasDe('t1')).toEqual([]) // el destino ya era el actual: no se escribe nada
  })

  // Es lo que hace que llamarla dos veces —el callback que se reintenta, el par anular/restaurar— no
  // llene el historial de etapas repetidas.
  it('llamarla dos veces seguidas escribe UNA sola transición', async () => {
    await ticket('t1', STATUS_TICKET_CREADO)
    await remision('t1', 'r1', 'ok')

    await sincronizarEstadoPorRemision(db, 't1', 'Ana')
    await sincronizarEstadoPorRemision(db, 't1', 'Ana')

    expect((await trazasDe('t1')).length).toBe(1)
  })

  // Las remisiones históricas pueden no tener ticket. Sin esta salida temprana, la consulta buscaría
  // un ticket `null` y el enganche se caería en el callback.
  it('sin ticket asociado no hace nada', async () => {
    await expect(sincronizarEstadoPorRemision(db, null, 'Ana')).resolves.toBeUndefined()
  })
})
