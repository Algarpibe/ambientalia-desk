import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { STATUS_TICKET_CREADO } from '@ambientalia/shared'
import { db, instalarArnes, appWith, adminCookie } from './testing/appHarness'

instalarArnes()

/**
 * «UNA OV, UN TICKET» EN SUS TRES PUERTAS (§9 del proposal F0-04; IV-4, cerrado por
 * `tercera-puerta-orden-venta`).
 *
 * LA REGLA. Una orden de venta pertenece a UN solo servicio. La misma orden en dos tickets deja el
 * trabajo facturado dos veces contra el mismo pedido y nadie sabe cuál de los dos es el bueno. Lo
 * dice el comentario de `repo.ts:317-320`, encima de `ticketConOrdenVenta`, que es la única función
 * que sabe comprobarlo.
 *
 * LAS TRES PUERTAS POR LAS QUE UNA OV ENTRA EN UN TICKET, Y HOY LAS TRES LA COMPRUEBAN:
 *
 *   1. la CREACIÓN del ticket .................. `ticketService.ts:45-49`   → 409  ✅
 *   2. «Habilitar Servicio» .................... `ticketService.ts:132-136` → 409  ✅
 *   3. la REMISIÓN DE ENTRADA .................. `remision.ts:218-240`      → 409  ✅
 *
 * ⚠️ EL DEFECTO, VERIFICADO — cierto hasta `b99d47a` (árbol de partida de esta tanda), se conserva
 * por su valor de registro. La evidencia era de una línea: `ticketConOrdenVenta` sólo se llamaba en
 * `ticketService.ts:45` y `:134` en `b99d47a`. La tercera puerta no la llamaba. Lo que tenía en su
 * lugar era una condición dentro del propio `UPDATE` (`remision.ts:223` en `b99d47a`):
 *
 *     WHERE id = $1 AND COALESCE(orden_venta, '') = ''
 *
 * Y esa condición protegía LA OTRA COSA: mira si el ticket DESTINO ya tiene orden —para no pisarla—,
 * no si la orden que llega ya está en otro ticket. Son dos preguntas distintas, y la que faltaba era
 * la segunda. El resultado era que remisionar metía la OV en un ticket nuevo sin preguntar a nadie.
 *
 * **CERRADO por `tercera-puerta-orden-venta`.** La tercera puerta llama hoy a `ticketConOrdenVenta`
 * desde `remision.ts:230`, por las DOS vías —`salesorder_id` y número— y con el propio ticket
 * excluido (`RQ-RE-16`, `openspec/specs/remisiones/spec.md`). El `WHERE` de arriba sigue existiendo
 * (hoy `remision.ts:237`), pero deja de estar EN LUGAR DE la guarda: queda ADEMÁS de ella, protegiendo
 * la carrera de dos remisiones sobre el MISMO ticket, que es otra pregunta.
 *
 * ══ ⚠️ ANTES DE TAPARLA HABÍA QUE CORRER LA CONSULTA 4.1 DEL RUNBOOK. NO ERA UN TRÁMITE ══════════════
 *
 *   SELECT salesorder_id, COUNT(*), array_agg(number ORDER BY number)
 *   FROM desk.tickets WHERE COALESCE(salesorder_id,'') <> ''
 *   GROUP BY salesorder_id HAVING COUNT(*) > 1;
 *
 * Esta puerta llevaba abierta desde que existía, y las dos que sí cerraban devolvían 409. Si alguien
 * en Comercial hubiera descubierto que remisionando SÍ se podía, esa habría sido su vía de trabajo —
 * y taparla sin mirar antes no habría arreglado un defecto: habría roto un flujo real, en producción,
 * sin aviso.
 *
 * **RESULTADO, Gerencia en `psql` contra producción el 2026-09-16:** `0` filas sobre población `1`
 * (detalle en `openspec/changes/archive/2026-09-17-tercera-puerta-orden-venta/apply-progress.md` y `proposal.md` §12.1).
 * **La cifra se cumple POR VACÍO, no por comprobación:** con población 1 un duplicado es
 * aritméticamente imposible, así que el `0` dice que nadie PUDO usar la puerta abierta, no que nadie
 * la usó. La ventana en la que esa cifra empieza a tener poder de refutación es F1F-03 (`plan:214`),
 * cuando la población deje de ser 1.
 * ═══════════════════════════════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ POR QUÉ TRES PRUEBAS Y NO CUATRO, y por qué la puerta 3 ya no lleva pareja `.fails`. Mientras la
 * tercera puerta seguía abierta, la pareja positiva/`.fails` (mismo patrón que C1,
 * `transicionesEjecucion.test.ts:24-28`) hacía falta porque un `it.fails` a solas pasa cuando el test
 * falla POR CUALQUIER MOTIVO —un import roto, un 500 en vez del 201, una ruta renombrada—, y la
 * positiva fijaba lo que HOY ocurría para que un rojo futuro señalara el motivo correcto. Esa razón
 * muere con el `.fails`: un `it` normal que afirma `409` ya se pone rojo por el motivo correcto él
 * solo. Mantener la pareja habría sido conservar el andamio después del edificio — y su única
 * aserción propia, `expect(res.body.error).toBeUndefined()`, se habría vuelto absurda en cuanto el
 * error pasó a ser justo lo que se espera. Resultado: **tres puertas, tres pruebas**, una cada una,
 * como ya están la 1 y la 2.
 *
 * ══ QUÉ HIZO `tercera-puerta-orden-venta`, Y EN ESTE ORDEN (`design.md` §5, R1→R4) ═══════════════════
 *   0. Gerencia corrió la consulta 4.1 el 2026-09-16 y decidió sobre lo que devolvió (arriba).
 *   1. Se quitó el `.fails` de la cuarta y se vio ROJA por «expected 201 to be 409» — el motivo
 *      correcto, no un import roto, ni un 404, ni un 500.
 *   2. Se llamó a `ticketConOrdenVenta` en `remision.ts`, entre el 422 de la orden no encontrada y el
 *      `UPDATE`. La condición del `WHERE` se QUEDÓ: sigue haciendo falta para que dos remisiones
 *      simultáneas no cuelen cada una la suya.
 *   3. Se vio la cuarta VERDE, y la positiva de entonces (`:141-159` en `b99d47a`) se puso ROJA por
 *      «expected 409 to be 201» — prevista y deseada: es la prueba por mutación de que la guarda fue
 *      lo que cambió el comportamiento.
 *   4. Se fundieron las dos en una sola (esta reescritura): la positiva se retiró y sobrevive la que
 *      hoy afirma el `409` en positivo.
 * ═══════════════════════════════════════════════════════════════════════════════════════════════════
 *
 * VERIFICADO POR MUTACIÓN al escribirla, en `b99d47a`: añadir la llamada a `ticketConOrdenVenta` en
 * `remision.ts` puso ROJAS LAS DOS de la tercera puerta, la positiva por «expected 409 to be 201» y la
 * `it.fails` por «Expect test to fail». Las dos primeras siguieron verdes, que es lo que dice que el
 * arreglo no las toca. Y las pruebas de `remisiones.test.ts` también siguieron verdes con la puerta
 * tapada, incluida la que captura la orden desde la remisión (`remisiones.test.ts:196`): esa usa
 * órdenes libres, así que el arreglo no la contradice. **La inversa, por la regla de mutación 1 de
 * `CLAUDE.md`:** desplazar la llamada fuera de su posición (mutaciones M-a/M-b, `remisiones.test.ts`)
 * vuelve a poner roja esta puerta.
 */

/** El ticket que YA tiene la orden, y con el que las tres puertas chocan (o deberían). */
async function ticketQueYaTieneLaOrden(): Promise<void> {
  await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli1','Gecelca S.A. E.S.P.')")
  await db.query("INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_id,date) VALUES ('soX','OV-2026-300','cli1','2026-07-15')")
  await db.query(
    "INSERT INTO tickets (id,number,subject,status,orden_venta,salesorder_id) VALUES ('t-dueno',7001,'El que ya la tiene','Ingresado','OV-2026-300','soX')")
}

/** Un equipo cualquiera: la creación lo exige y la remisión lo usa para resolver el perfil. */
async function equipo(): Promise<void> {
  await db.query("INSERT INTO equipos (id, serial, marca, modelo, tipo) VALUES ('eq-1','18A20070','Grimm','EDM180C','Monitor')")
}

/** Los tickets que hoy comparten esa orden de venta, por sus dos vías. Es la foto del defecto. */
async function ticketsConLaOrden(): Promise<{ porId: number[]; porNumero: number[] }> {
  const porId = await db.query("SELECT number FROM tickets WHERE salesorder_id='soX' ORDER BY number")
  const porNumero = await db.query("SELECT number FROM tickets WHERE orden_venta='OV-2026-300' ORDER BY number")
  return {
    porId: porId.rows.map((r: { number: number }) => Number(r.number)),
    porNumero: porNumero.rows.map((r: { number: number }) => Number(r.number)),
  }
}

describe('una OV, un ticket · puerta 1 · la CREACIÓN del ticket', () => {
  it('rechaza con 409 una orden de venta que ya está en otro ticket', async () => {
    const cookie = await adminCookie()
    await ticketQueYaTieneLaOrden()
    await equipo()
    const { app } = appWith()

    const res = await request(app).post('/api/tickets').set('Cookie', cookie).send({
      equipoId: 'eq-1', salesOrderId: 'soX', tipoServicio: 'Mantenimiento', clasificaciones: 'Equipo nuevo', prefijo: 'MT',
    })

    expect(res.status).toBe(409)
    expect(res.body.error).toContain('7001') // el 409 dice CUÁL es el ticket que la tiene
    // Y no se creó nada: la orden sigue en un solo ticket.
    expect(await ticketsConLaOrden()).toEqual({ porId: [7001], porNumero: [7001] })
  })
})

describe('una OV, un ticket · puerta 2 · «Habilitar Servicio»', () => {
  it('rechaza con 409 una orden de venta que ya está en otro ticket', async () => {
    const cookie = await adminCookie()
    await ticketQueYaTieneLaOrden()
    await db.query("INSERT INTO tickets (id,number,subject,status) VALUES ('t-nuevo',7002,'El que la quiere',$1)", [STATUS_TICKET_CREADO])
    const { app } = appWith()

    const res = await request(app).post('/api/tickets/t-nuevo/transition').set('Cookie', cookie).send({
      transitionId: 'habilitar_servicio',
      values: { 'Orden de Venta': 'OV-2026-300', Serial: '18A20070' },
    })

    expect(res.status).toBe(409)
    expect(res.body.error).toBe('La orden de venta OV-2026-300 ya está asociada al ticket #7001')
    // Y el ticket no se movió: un 409 que ya hubiera transicionado no sería una guarda.
    expect((await db.query("SELECT status FROM tickets WHERE id='t-nuevo'")).rows[0].status).toBe(STATUS_TICKET_CREADO)
    expect((await ticketsConLaOrden()).porNumero).toEqual([7001])
  })
})

describe('una OV, un ticket · puerta 3 · la REMISIÓN DE ENTRADA', () => {
  /** El ticket destino: sin orden, para que la condición del `WHERE` de `remision.ts:237` deje pasar. */
  async function ticketSinOrden(): Promise<void> {
    await db.query("INSERT INTO tickets (id,number,subject,status,equipo_id,client_id) VALUES ('t-nuevo',7002,'El que la quiere',$1,'eq-1','cli1')", [STATUS_TICKET_CREADO])
  }

  it('rechaza con 409 una orden de venta que ya está en otro ticket', async () => {
    const cookie = await adminCookie()
    await ticketQueYaTieneLaOrden()
    await equipo()
    await ticketSinOrden()
    const { app } = appWith()

    const res = await request(app).post('/api/remisiones').set('Cookie', cookie).send({
      ticketId: 't-nuevo', fecha: '2026-08-03', incluye: [], salesOrderId: 'soX',
    })

    expect(res.status).toBe(409)
    expect(res.body.error).toContain('7001')
    // Y la orden se queda donde estaba: un 409 que ya hubiera escrito la columna no sería una guarda.
    expect(await ticketsConLaOrden()).toEqual({ porId: [7001], porNumero: [7001] })
  })

  /**
   * Escenario 3 de RQ-RE-16 (`specs/remisiones/spec.md:74-80`): reenviar a un ticket la orden que
   * YA es suya —reintento de red, doble clic en el formulario— no es duplicarla. `ticketConOrdenVenta`
   * excluye al propio ticket destino (`remision.ts:230`, tercer argumento `ticketId`), así que la
   * comprobación no llega al `409`, y el `UPDATE` es no-op porque `orden_venta` ya no está vacía
   * (`remision.ts:237`, `COALESCE(orden_venta,'') = ''`).
   */
  it('reenviar la misma orden al propio ticket no se rechaza a sí mismo: 201 y el UPDATE es no-op', async () => {
    const cookie = await adminCookie()
    await equipo()
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli1','Gecelca S.A. E.S.P.')")
    await db.query("INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_id,date) VALUES ('soX','OV-2026-300','cli1','2026-07-15')")
    await db.query(
      "INSERT INTO tickets (id,number,subject,status,equipo_id,client_id,orden_venta,salesorder_id) VALUES ('t-propia',7003,'El que reenvía su propia orden','Ingresado','eq-1','cli1','OV-2026-300','soX')")
    const antes = (await db.query(
      "SELECT orden_venta, salesorder_id, fecha_orden_venta FROM tickets WHERE id='t-propia'")).rows[0]
    const { app } = appWith()

    const res = await request(app).post('/api/remisiones').set('Cookie', cookie).send({
      ticketId: 't-propia', fecha: '2026-08-03', incluye: [], salesOrderId: 'soX',
    })

    expect(res.status).toBe(201)
    expect(res.body.error).toBeUndefined()
    const despues = (await db.query(
      "SELECT orden_venta, salesorder_id, fecha_orden_venta FROM tickets WHERE id='t-propia'")).rows[0]
    expect(despues).toEqual(antes) // no-op: mismos valores antes y después, no sólo el mismo número de filas
  })
})
