import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { ticketsConSlaVencido, tieneOrdenVenta } from './sla'; import { ticketConOrdenVenta } from '@ambientalia/zoho-sync/db/repo'

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
   * Y dice QUÉ HACER con él. Desde F1B-08 el destinatario no sale del grafo sino de `ALARMAS_SLA`
   * (`packages/shared/src/sla.ts`, S-8): cargo, área de respaldo y si mira la orden de venta o marca
   * el tablero. `horas` es el umbral HÁBIL que se pasó. Hasta 55eac92 devolvía `escalarA`, derivado
   * de `escalado_a_comercial`; el cargo es el mismo, y `sla.test.ts` vigila que no diverjan.
   */
  it('un ticket que lleva dos días en Notificado está vencido, y dice desde cuándo y qué alarma', async () => {
    await ticket('t1', 4200, 'Notificado')
    await entroEn('t1', 'Notificado', '2026-09-08T12:00:00.000Z')
    expect(await ticketsConSlaVencido(db, AHORA)).toEqual([
      {
        id: 't1', number: 4200, estado: 'Notificado', desde: new Date('2026-09-08T12:00:00.000Z'), horas: 9,
        alarma: { cargo: 'Coordinador Comercial', areaRespaldo: 'Comercial' },
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

/**
 * alarmas-horas-habiles (F1B-08, lote 2) · las TRES alarmas sobre la base.
 *
 * Todas las entradas son del lunes 14/09/2026 a las 08:00 en Bogotá y se evalúa el jueves 17/09 a
 * las 10:00: 29 h hábiles. Vence `Notificado` (9) y `Remisión creada` (27); `Notificación cliente`
 * (36) entra antes, el miércoles 09/09, para que también venza.
 */
describe('F1B-08 · candidatos a alarma, con la orden de venta y los cierres de la base', () => {
  const JUEVES = new Date('2026-09-17T15:00:00.000Z')
  const LUNES = '2026-09-14T13:00:00.000Z'

  const conOV = (id: string, number: number, status: string, ov: { orden_venta?: string; salesorder_id?: string } = {}) =>
    db.query('INSERT INTO tickets (id, number, subject, status, orden_venta, salesorder_id) VALUES ($1,$2,$3,$4,$5,$6)',
      [id, number, 'SLA', status, ov.orden_venta ?? null, ov.salesorder_id ?? null])
  const asociar = (ticketId: string, numero: string, salesorderId: string, liberada = false) =>
    db.query(`INSERT INTO ov_asociaciones (ticket_id, numero, salesorder_id, origen, liberada_at) VALUES ($1,$2,$3,'alta',$4)`,
      [ticketId, numero, salesorderId, liberada ? new Date('2026-09-15T15:00:00.000Z') : null])
  const ids = async () => (await ticketsConSlaVencido(db, JUEVES)).map((v) => v.id).sort()

  it('Remisión creada con 29 h hábiles y sin orden de venta está vencida, con su alarma', async () => {
    await conOV('r0', 5000, 'Remisión creada')
    await entroEn('r0', 'Remisión creada', LUNES)
    expect(await ticketsConSlaVencido(db, JUEVES)).toEqual([{
      id: 'r0', number: 5000, estado: 'Remisión creada', desde: new Date(LUNES), horas: 27,
      alarma: { cargo: 'Coordinador Comercial', areaRespaldo: 'Comercial', soloSinOrdenVenta: true },
    }])
  })

  /**
   * LA MISMA NOCIÓN, TRES IMPLEMENTACIONES (molde H5). «Este ticket tiene orden de venta» ya lo
   * contestan las puertas de «una OV, un ticket» con `ticketConOrdenVenta` (`repo.ts:362-379`: la
   * columna, `salesorder_id` y —la tercera vía— la asociación VIGENTE de `ov_asociaciones`). Esa
   * función contesta la pregunta inversa (dada una OV, qué ticket la usa), así que no se puede
   * reutilizar sin conocer la OV; `tieneOrdenVenta` es la tercera implementación. Esta prueba las
   * enfrenta sobre los mismos cinco casos y exige que den lo mismo: si una cambia, se pone roja.
   */
  const CASOS = [
    { caso: 'columna orden_venta', id: 'c1', ov: { orden_venta: 'SO-1' }, ref: { numero: 'SO-1', salesorderId: 'so-1' }, tiene: true },
    { caso: 'sólo salesorder_id', id: 'c2', ov: { salesorder_id: 'so-2' }, ref: { numero: 'SO-2', salesorderId: 'so-2' }, tiene: true },
    { caso: 'asociación vigente', id: 'c3', ov: {}, asoc: { numero: 'SO-3', so: 'so-3', liberada: false }, ref: { numero: 'SO-3', salesorderId: 'so-3' }, tiene: true },
    { caso: 'asociación liberada', id: 'c4', ov: {}, asoc: { numero: 'SO-4', so: 'so-4', liberada: true }, ref: { numero: 'SO-4', salesorderId: 'so-4' }, tiene: false },
    { caso: 'ninguna', id: 'c5', ov: {}, ref: { numero: 'SO-5', salesorderId: 'so-5' }, tiene: false },
  ]

  it('tieneOrdenVenta, ticketConOrdenVenta y la consulta de vencidos dan lo mismo en los cinco casos', async () => {
    for (const [i, c] of CASOS.entries()) {
      await conOV(c.id, 5100 + i, 'Remisión creada', c.ov)
      await entroEn(c.id, 'Remisión creada', LUNES)
      if (c.asoc) await asociar(c.id, c.asoc.numero, c.asoc.so, c.asoc.liberada)
    }
    const vencidos = await ids()
    const tabla = await Promise.all(CASOS.map(async (c) => ({
      caso: c.caso,
      puertas: (await ticketConOrdenVenta(db, c.ref)) !== null,
      tieneOrdenVenta: tieneOrdenVenta(
        { orden_venta: c.ov.orden_venta ?? null, salesorder_id: c.ov.salesorder_id ?? null }, Boolean(c.asoc && !c.asoc.liberada)),
      consulta: !vencidos.includes(c.id),
    })))
    expect(tabla).toEqual(CASOS.map((c) => ({ caso: c.caso, puertas: c.tiene, tieneOrdenVenta: c.tiene, consulta: c.tiene })))
  })

  it('una orden_venta en blanco no es una orden de venta, igual que en las puertas (COALESCE <> \'\')', () => {
    expect(tieneOrdenVenta({ orden_venta: '', salesorder_id: null }, false)).toBe(false)
    expect(tieneOrdenVenta({ orden_venta: null, salesorder_id: '' }, false)).toBe(false)
  })

  it('Notificado y Notificación cliente vencidos avisan aunque tengan orden de venta', async () => {
    await conOV('n1', 5200, 'Notificado', { orden_venta: 'SO-6' })
    await entroEn('n1', 'Notificado', LUNES)
    await conOV('n2', 5201, 'Notificación cliente', { salesorder_id: 'so-7' })
    await entroEn('n2', 'Notificación cliente', '2026-09-09T13:00:00.000Z')
    expect(await ids()).toEqual(['n1', 'n2'])
  })

  it('la entrada que cuenta es la del estado ACTUAL, aunque haya otra más reciente a otro estado con alarma', async () => {
    await conOV('e1', 5300, 'Remisión creada')
    await entroEn('e1', 'Remisión creada', LUNES)                      // la del estado actual: 29 h, vencida
    await entroEn('e1', 'Notificado', '2026-09-17T14:00:00.000Z')      // más reciente, pero a otro estado
    expect(await ids()).toEqual(['e1'])
  })

  it('los cierres de public.calendario_cierres se leen de la base y no cuentan', async () => {
    await conOV('k1', 5400, 'Remisión creada')
    await entroEn('k1', 'Remisión creada', LUNES)
    for (const fecha of ['2026-09-15', '2026-09-16'])
      await db.query(`INSERT INTO calendario_cierres (fecha, motivo, registrado_por) VALUES ($1, 'inventario', 'prueba')`, [fecha])
    expect(await ids(), 'lunes 9 h + jueves 2 h = 11 h hábiles, lejos de 27').toEqual([])
  })

  /**
   * SIN N+1. Se cuentan las consultas por tabla con 1 candidato y con 5 (de los tres estados): tienen
   * que ser las MISMAS. Una consulta al historial o a las asociaciones por ticket daría 5 contra 1.
   */
  it('el número de consultas no crece con el número de candidatos', async () => {
    const contar = async () => {
      const consultas: string[] = []
      const espia: Queryable = { query: (text: string, params?: unknown[]) => { consultas.push(text); return db.query(text, params) } }
      await ticketsConSlaVencido(espia, JUEVES)
      const de = (tabla: string) => consultas.filter((q) => q.includes(tabla)).length
      return { total: consultas.length, historial: de('ticket_transitions'), asociaciones: de('ov_asociaciones'), cierres: de('calendario_cierres') }
    }
    await conOV('p0', 5500, 'Remisión creada')
    await entroEn('p0', 'Remisión creada', LUNES)
    const conUno = await contar()
    for (const [i, estado] of ['Notificado', 'Remisión creada', 'Notificación cliente', 'Remisión creada'].entries()) {
      await conOV(`p${i + 1}`, 5501 + i, estado)
      await entroEn(`p${i + 1}`, estado, estado === 'Notificación cliente' ? '2026-09-09T13:00:00.000Z' : LUNES)
    }
    expect(await ids()).toHaveLength(5)
    expect(await contar()).toEqual(conUno)
    expect(conUno).toMatchObject({ historial: 1, asociaciones: 1, cierres: 1 })
  })

  /**
   * H3 de `design.md`, comprobada el 2026-09-29: pg-mem TRUNCA a milisegundos un `performed_at`
   * escrito con microsegundos. La hipótesis de que la igualdad en SQL fallaría queda SIN DEMOSTRAR
   * aquí (en producción PostgreSQL sí guarda µs); por eso la marca se compara en TS por `getTime()`.
   */
  it('un performed_at con microsegundos sale como Date de milisegundos (H3 en pg-mem)', async () => {
    await conOV('u1', 5600, 'Notificado')
    await db.query(`INSERT INTO ticket_transitions (ticket_id, transition_id, to_status, performed_at)
      VALUES ('u1', 'x', 'Notificado', '2026-09-14 13:00:00.123456+00')`)
    const [v] = await ticketsConSlaVencido(db, JUEVES)
    expect(v!.desde.toISOString()).toBe('2026-09-14T13:00:00.123Z')
  })
})
