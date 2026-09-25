import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { ticketsConSlaVencido } from './sla'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

const AHORA = new Date('2026-09-10T12:00:00.000Z')

const ticket = (id: string, number: number, status: string, classification: string | null = null) =>
  db.query('INSERT INTO tickets (id, number, subject, status, classification) VALUES ($1,$2,$3,$4,$5)', [id, number, 'SLA', status, classification])

const entroEn = (ticketId: string, estado: string, cuando: string) =>
  db.query(
    'INSERT INTO ticket_transitions (ticket_id, transition_id, to_status, performed_at) VALUES ($1,$2,$3,$4)',
    [ticketId, 'x', estado, new Date(cuando)],
  )

/**
 * C11 · QUIÉN LLEVA DEMASIADO PARADO. F1A-02.
 *
 * La regla vive en `packages/shared/src/sla.ts` y es pura. Esto es lo único que hace falta para
 * aplicarla sobre la base: saber DESDE CUÁNDO está el ticket en su estado actual. No hay columna que
 * lo diga —`tickets.modified_time` es «la última vez que cambió algo», no «cuándo entró aquí»—, así
 * que sale de `ticket_transitions`, que es donde M1.10 obliga a dejar traza de cada etapa.
 *
 * ⚠️ ESTO NO DISPARA NADA Y NO ESCALA A NADIE. Es la consulta que un planificador llamaría; el
 * planificador no existe (`R08.1.md:1588`) y esta tanda no lo inventa.
 */
describe('C11 · los tickets con el SLA vencido', () => {
  it('sin tickets no hay vencidos', async () => {
    expect(await ticketsConSlaVencido(db, AHORA)).toEqual([])
  })

  /**
   * Y dice A QUIÉN ESCALARLO. El destinatario no es un dato nuevo: sale de la tabla de derivación por
   * cargo que ya existe (`R08.1.md:1575`), y para `Notificado` es el `Coordinador Comercial` por vía
   * de `escalado_a_comercial`. Sin este campo, la consulta diría que hay un retraso y no a quién
   * comunicárselo, que es justo lo que la R08 pedía arreglar.
   */
  it('un ticket que lleva dos días en Notificado está vencido, y dice desde cuándo y a quién escalarlo', async () => {
    await ticket('t1', 4200, 'Notificado')
    await entroEn('t1', 'Notificado', '2026-09-08T12:00:00.000Z')
    expect(await ticketsConSlaVencido(db, AHORA)).toEqual([
      {
        id: 't1', number: 4200, estado: 'Notificado', desde: new Date('2026-09-08T12:00:00.000Z'),
        escalarA: { hay: true, cargo: 'Coordinador Comercial', via: ['escalado_a_comercial'] },
      },
    ])
  })

  it('un ticket que lleva dos horas en Notificado no está vencido', async () => {
    await ticket('t2', 4201, 'Notificado')
    await entroEn('t2', 'Notificado', '2026-09-10T10:00:00.000Z')
    expect(await ticketsConSlaVencido(db, AHORA)).toEqual([])
  })

  /**
   * Un estado SIN SLA no vence por mucho que lleve parado. Se prueba con `En Proceso` y con diez
   * días: sin esta prueba, una consulta que se olvidara del filtro por estado devolvería medio
   * tablero y las otras seguirían en verde.
   */
  it('un estado sin SLA no vence nunca, lleve lo que lleve', async () => {
    await ticket('t3', 4202, 'En Proceso')
    await entroEn('t3', 'En Proceso', '2026-08-31T12:00:00.000Z')
    expect(await ticketsConSlaVencido(db, AHORA)).toEqual([])
  })

  /**
   * LA REENTRANCIA, que es donde una consulta ingenua se equivoca.
   *
   * `Notificado` está en un ciclo: `escalado_a_revision` entra desde `Rev./Diagnostico` y
   * `devolucion_a_correccion` sale de vuelta (componente C3 de la tabla de reentrancia de F0-04). Un
   * ticket puede entrar, salir y volver a entrar. El «desde» es la ÚLTIMA entrada: leer la primera
   * daría un vencimiento FALSO sobre un ticket que acaba de llegar.
   */
  it('el desde es la ÚLTIMA entrada al estado, no la primera', async () => {
    await ticket('t4', 4203, 'Notificado')
    await entroEn('t4', 'Notificado', '2026-09-01T12:00:00.000Z')       // primera vuelta: hace nueve días
    await entroEn('t4', 'Rev./Diagnostico', '2026-09-02T12:00:00.000Z') // se devolvió a corrección
    await entroEn('t4', 'Notificado', '2026-09-10T11:00:00.000Z')       // volvió hace una hora
    expect(await ticketsConSlaVencido(db, AHORA)).toEqual([])
  })

  /**
   * EL CASO DOMINANTE EN PRODUCCIÓN, y por eso tiene prueba propia.
   *
   * Los tickets replicados de Zoho no tienen ninguna fila en `ticket_transitions`: el motor de la app
   * nunca los movió. De un ticket así NO SE SABE desde cuándo está en su estado, y un SLA sobre una
   * fecha desconocida no es un SLA. Se omite en vez de inventarle un origen —`created_time` o
   * `modified_time` dirían otra cosa— y quien consuma esto tiene que saber que la lista está acotada
   * a los tickets que la aplicación ha movido.
   */
  it('un ticket sin traza no se puede medir, y no se reporta', async () => {
    // Nace hace diez días y NUNCA se movió: es el retrato del ticket replicado. La fecha vieja está
    // puesta a propósito, para que la prueba distinga de verdad — una implementación que cayera en
    // usar `created_time` como origen lo daría por vencido, y esta prueba se pondría roja.
    await db.query(
      'INSERT INTO tickets (id, number, subject, status, created_time) VALUES ($1,$2,$3,$4,$5)',
      ['t5', 4204, 'SLA', 'Notificado', new Date('2026-08-31T12:00:00.000Z')],
    )
    expect(await ticketsConSlaVencido(db, AHORA)).toEqual([])
  })

  /**
   * EL FILTRO POR ESTADO NO ES DECORATIVO, Y ESTA ES LA ÚNICA PRUEBA QUE LO NOTA.
   *
   * Descubierto por mutación al escribir esta tanda: quitar el `WHERE status IN (…)` de la consulta
   * NO ponía ninguna prueba en rojo. Y es lógico —la regla pura ya descarta los estados sin SLA, así
   * que el resultado no cambia—, pero el coste sí: sin filtro se recorre la tabla ENTERA de tickets
   * haciendo una consulta al historial por cada uno. En producción son 751 tickets para encontrar los
   * de un solo estado.
   *
   * Una mutación que no pone nada rojo es una pieza sin prueba. Se cuenta lo observable —cuántas
   * veces se toca `ticket_transitions`— en vez de medir tiempos, que con pg-mem sería teatro.
   */
  it('no pregunta por el historial de tickets cuyo estado no tiene SLA', async () => {
    await ticket('t6', 4205, 'Notificado')
    await entroEn('t6', 'Notificado', '2026-09-08T12:00:00.000Z')
    await ticket('t7', 4206, 'En Proceso')
    await ticket('t8', 4207, 'Por Facturar')
    await ticket('t9', 4208, 'Finalizado')

    const consultas: string[] = []
    const espia: Queryable = {
      query: (text: string, params?: unknown[]) => { consultas.push(text); return db.query(text, params) },
    }

    expect(await ticketsConSlaVencido(espia, AHORA)).toHaveLength(1)
    const alHistorial = consultas.filter((q) => q.includes('ticket_transitions'))
    expect(alHistorial, 'una consulta al historial por cada ticket con SLA, y ni una más').toHaveLength(1)
  })

  /**
   * F1B-06, RQ-TS-15 (delta `transitions-st`), RQ-EN-06. `Notificado` también es un estado del
   * catálogo `equipo-nuevo` (`analisis_y_acciones`, `from: ['Notificado']`), y el SLA de 24h es una
   * regla del flujo de SERVICIO (M1.7 del maestro): un ticket `Equipo nuevo` en `Notificado` NO
   * cuenta, aunque el nombre del estado coincida.
   */
  it('un ticket Equipo nuevo en Notificado no cuenta para el SLA, aunque lleve más de 24 h', async () => {
    await ticket('t10', 4209, 'Notificado', 'Equipo nuevo')
    await entroEn('t10', 'Notificado', '2026-09-08T12:00:00.000Z')
    expect(await ticketsConSlaVencido(db, AHORA)).toEqual([])
  })
})
