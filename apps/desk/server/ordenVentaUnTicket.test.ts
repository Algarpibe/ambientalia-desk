import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { STATUS_TICKET_CREADO } from '@ambientalia/shared'
import { db, instalarArnes, appWith, adminCookie } from './testing/appHarness'

instalarArnes()

/**
 * «UNA OV, UN TICKET» EN SUS TRES PUERTAS (§9 del proposal F0-04).
 *
 * LA REGLA. Una orden de venta pertenece a UN solo servicio. La misma orden en dos tickets deja el
 * trabajo facturado dos veces contra el mismo pedido y nadie sabe cuál de los dos es el bueno. Lo
 * dice el comentario de `repo.ts:317-320`, encima de `ticketConOrdenVenta`, que es la única función
 * que sabe comprobarlo.
 *
 * SON TRES LAS PUERTAS POR LAS QUE UNA OV ENTRA EN UN TICKET, y sólo DOS la comprueban:
 *
 *   1. la CREACIÓN del ticket .................. `ticketService.ts:45-49`  → 409  ✅
 *   2. «Habilitar Servicio» .................... `ticketService.ts:99-102` → 409  ✅
 *   3. la REMISIÓN DE ENTRADA .................. `remision.ts:189-197`     → 201  ❌
 *
 * ⚠️ EL DEFECTO, VERIFICADO. La evidencia es de una línea: `ticketConOrdenVenta` sólo se llama en
 * `ticketService.ts:45` y `:100`. La tercera puerta no la llama. Lo que tiene en su lugar es una
 * condición dentro del propio `UPDATE` (`remision.ts:194`):
 *
 *     WHERE id = $1 AND COALESCE(orden_venta, '') = ''
 *
 * Y esa condición protege LA OTRA COSA: mira si el ticket DESTINO ya tiene orden —para no pisarla—,
 * no si la orden que llega ya está en otro ticket. Son dos preguntas distintas, y la que aquí falta
 * es la segunda. El resultado es que remisionar mete la OV en un ticket nuevo sin preguntar a nadie.
 *
 * ⚠️ ESTA TANDA NO LO ARREGLA. F0-04 no cambia comportamiento (§12 del proposal); el arreglo es de
 * F1A, «consumiendo lo que esta tanda deja».
 *
 * ══ ⚠️ ANTES DE TAPARLA HAY QUE CORRER LA CONSULTA 4.1 DEL RUNBOOK. NO ES UN TRÁMITE ═══════════════
 *
 *   SELECT salesorder_id, COUNT(*), array_agg(number ORDER BY number)
 *   FROM desk.tickets WHERE COALESCE(salesorder_id,'') <> ''
 *   GROUP BY salesorder_id HAVING COUNT(*) > 1;
 *
 * Esta puerta lleva abierta desde que existe, y las dos que sí cierran devuelven 409. Si alguien en
 * Comercial descubrió que remisionando SÍ se puede, esa es hoy la vía por la que trabaja — y taparla
 * sin mirar antes no arregla un defecto: rompe un flujo real, en producción, sin aviso. La consulta
 * dice si eso está pasando y en cuántos pedidos. Filas > 0 significa que el arreglo necesita además
 * una decisión sobre el histórico y un plan para quien lo esté usando.
 * ═══════════════════════════════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ POR QUÉ CUATRO PRUEBAS Y NO UNA, y por qué la tercera afirma en POSITIVO el defecto. Es el mismo
 * patrón de la pareja de C1 (`transicionesEjecucion.test.ts:24-28`): un `it.fails` a solas pasa
 * cuando el test falla POR CUALQUIER MOTIVO —un import roto, un 500 en vez del 201, una ruta
 * renombrada—, y es justo la prueba que existe para fijar un defecto concreto. La positiva afirma lo
 * que HOY ocurre, así que si mañana rompe otra cosa se pone roja por el motivo correcto en vez de
 * esconderse detrás del `.fails` de su pareja.
 *
 * ══ QUÉ TIENE QUE HACER F1A CON ESTAS CUATRO, EN ESTE ORDEN ════════════════════════════════════════
 *   0. Correr la consulta 4.1 y decidir sobre lo que devuelva. Este paso va ANTES del código.
 *   1. Quitar el `.fails` de la cuarta y verla ROJA — comprobando que falla por el 201 que devuelve
 *      hoy, no por otra cosa.
 *   2. Llamar a `ticketConOrdenVenta` en `remision.ts`, antes del `UPDATE`. La condición del `WHERE`
 *      se QUEDA: sigue haciendo falta para que dos remisiones simultáneas no cuelen cada una la suya.
 *   3. Ver la cuarta VERDE.
 *   4. INVERTIR la tercera: pasa a comprobar 409, y su nombre y su comentario dejan de hablar de
 *      «comportamiento actual, defecto».
 * ═══════════════════════════════════════════════════════════════════════════════════════════════════
 *
 * VERIFICADO POR MUTACIÓN al escribirlas: añadiendo la llamada a `ticketConOrdenVenta` en
 * `remision.ts` —el arreglo de F1A— se ponen ROJAS LAS DOS de la tercera puerta, la positiva por
 * «expected 409 to be 201» y la `it.fails` por «Expect test to fail». Las dos primeras siguen verdes,
 * que es lo que dice que el arreglo no las toca. Y las 47 de `remisiones.test.ts` también siguen
 * verdes con la puerta tapada, incluida la que captura la orden desde la remisión
 * (`remisiones.test.ts:196`): esa usa órdenes libres, así que el arreglo no la contradice.
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

describe('una OV, un ticket · puerta 3 · la REMISIÓN DE ENTRADA (la que no comprueba nada)', () => {
  /** El ticket destino: sin orden, para que la condición del `WHERE` de `remision.ts:194` deje pasar. */
  async function ticketSinOrden(): Promise<void> {
    await db.query("INSERT INTO tickets (id,number,subject,status,equipo_id,client_id) VALUES ('t-nuevo',7002,'El que la quiere',$1,'eq-1','cli1')", [STATUS_TICKET_CREADO])
  }

  it('hoy ACEPTA una orden de venta que ya está en otro ticket, y la duplica — comportamiento actual, defecto', async () => {
    const cookie = await adminCookie()
    await ticketQueYaTieneLaOrden()
    await equipo()
    await ticketSinOrden()
    const { app } = appWith()

    const res = await request(app).post('/api/remisiones').set('Cookie', cookie).send({
      ticketId: 't-nuevo', fecha: '2026-08-03', incluye: [], salesOrderId: 'soX',
    })

    // El modo de fallo EXACTO, fijado en positivo: 201, sin queja de ningún tipo.
    expect(res.status).toBe(201)
    expect(res.body.error).toBeUndefined()

    // Y la guinda: la orden queda EN LOS DOS TICKETS, por sus dos vías. Es exactamente lo que las
    // puertas 1 y 2 devuelven 409 para impedir.
    expect(await ticketsConLaOrden()).toEqual({ porId: [7001, 7002], porNumero: [7001, 7002] })
  })

  it.fails('la remisión de entrada debería rechazar con 409 una orden ya asociada — verde cuando F1A cierre la tercera puerta', async () => {
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
})
