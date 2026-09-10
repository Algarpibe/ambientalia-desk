import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { STATUS_TICKET_CREADO } from '@ambientalia/shared'
import { HttpError } from '../util/httpError'
import { createManagedTicket, executeTransition } from './ticketService'

/**
 * `executeTransition` y `createManagedTicket` A NIVEL DE UNIDAD (§9 del proposal F0-04).
 *
 * QUÉ HABÍA. Las dos sólo se probaban por HTTP. Eso basta para saber QUÉ código devuelve cada caso
 * por separado, y es lo que ya barren `permisos.test.ts` (403/200 por área en las 34) y
 * `transicionesEjecucion.test.ts` (409 por origen inválido, 422 por obligatorio).
 *
 * QUÉ NO SE VEÍA ASÍ, Y ES LO QUE ESTAS PRUEBAS FIJAN: **el ORDEN en que se evalúan las guardas**.
 * Una prueba HTTP que rompe UNA sola guarda no puede distinguir «primero se comprueba el estado y
 * después el área» de lo contrario: las dos disposiciones dan el mismo código en todos sus casos.
 * La precedencia sólo se ve con un ticket que falla DOS guardas a la vez, y entonces sí importa
 * cuál contesta:
 *
 *   · es una decisión de FUGA DE INFORMACIÓN — un 403 le dice a quien pregunta que el ticket existe
 *     y está en el estado bueno; un 409, que no lo está;
 *   · y es una decisión de USABILIDAD — un 422 con la lista de campos que faltan es accionable, un
 *     403 no lo es, y quien reciba el que llegue primero no verá nunca el otro.
 *
 * Hoy nadie la había declarado, así que cualquiera podía reordenar esas líneas sin que nada diera
 * rojo. Estas pruebas la declaran. **NO la cambian**: F0-04 no toca comportamiento (§12).
 *
 * ⚠️ CADA CASO DE PRECEDENCIA ROMPE DOS GUARDAS A LA VEZ, a propósito, y por eso el nombre dice las
 * dos. Un caso que sólo rompiera una no probaría ningún orden.
 */

let db: Queryable

beforeEach(async () => {
  const pg = newDb().adapters.createPg()
  db = new pg.Pool()
  await migrate(db)
})

const ADMIN = { areas: [], isAdmin: true, name: 'Admin', id: 'u-admin' }
const SERVICIO = { areas: ['Servicio Técnico'], isAdmin: false, name: 'Tec', id: 'u-tec' }
const COMERCIAL = { areas: ['Comercial'], isAdmin: false, name: 'Com', id: 'u-com' }

/** El `HttpError` que lanzó la llamada, con su código y su cuerpo. Falla si NO lanzó. */
async function fallo(fn: () => Promise<unknown>): Promise<{ status: number; body: Record<string, unknown> }> {
  try {
    await fn()
  } catch (e) {
    if (e instanceof HttpError) return { status: e.status, body: e.body as Record<string, unknown> }
    throw e
  }
  throw new Error('se esperaba un HttpError y la llamada no lanzó ninguno')
}

async function ticket(id: string, estado: string, numero = 8100, extra: Record<string, string> = {}): Promise<void> {
  const cols = Object.keys(extra)
  await db.query(
    `INSERT INTO tickets (id, number, subject, status${cols.map((c) => `, ${c}`).join('')})
     VALUES ($1,$2,$3,$4${cols.map((_, i) => `, $${i + 5}`).join('')})`,
    [id, numero, 'Unidad de ticketService', estado, ...cols.map((c) => extra[c])],
  )
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// executeTransition
// ══════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * `escalado_a_revision`: `Rev./Diagnostico` → `Notificado`, área **Servicio Técnico**, con dos campos
 * obligatorios (`Prioridad` y `Días de entrega`). Sirve para las tres guardas de golpe.
 */
const ESCALADO = 'escalado_a_revision'
const VALORES_ESCALADO = { priority: 'High', 'Días de entrega': 5 }

describe('executeTransition · cada guarda por separado', () => {
  it('una transición que no existe en el grafo es 400', async () => {
    await ticket('t1', 'Rev./Diagnostico')
    const r = await fallo(() => executeTransition(db, 't1', { transitionId: 'no-existe' }, ADMIN))
    expect(r.status).toBe(400)
    expect(r.body.error).toBe('Transición desconocida')
  })

  it('un ticket que no existe es 404', async () => {
    const r = await fallo(() => executeTransition(db, 'no-existe', { transitionId: ESCALADO }, ADMIN))
    expect(r.status).toBe(404)
  })

  it('el estado de origen equivocado es 409, y el mensaje nombra la transición y el estado', async () => {
    await ticket('t1', 'Ingresado')
    const r = await fallo(() => executeTransition(db, 't1', { transitionId: ESCALADO, values: VALORES_ESCALADO }, ADMIN))
    expect(r.status).toBe(409)
    expect(r.body.error).toBe('La transición "Escalado a Revisión" no aplica desde el estado "Ingresado"')
  })

  it('un área que no es la de la transición es 403, y el mensaje nombra el área que hacía falta', async () => {
    await ticket('t1', 'Rev./Diagnostico')
    const r = await fallo(() => executeTransition(db, 't1', { transitionId: ESCALADO, values: VALORES_ESCALADO }, COMERCIAL))
    expect(r.status).toBe(403)
    expect(r.body.error).toBe('Tu rol no tiene permiso para esta transición (área: Servicio Técnico)')
  })

  it('los obligatorios que faltan son 422, y vienen TODOS en una lista, no de uno en uno', async () => {
    await ticket('t1', 'Rev./Diagnostico')
    const r = await fallo(() => executeTransition(db, 't1', { transitionId: ESCALADO, values: {} }, ADMIN))
    expect(r.status).toBe(422)
    // Los dos a la vez: un 422 que sólo dijera el primero obligaría a descubrir el segundo enviando
    // otra vez, y `buildTransitionPlan` los acumula precisamente para no hacer eso.
    expect(r.body.errors).toEqual(['Falta el campo obligatorio: Prioridad', 'Falta el campo obligatorio: Días de entrega'])
  })

  it('el administrador pasa la guarda de área sin tener ninguna', async () => {
    await ticket('t1', 'Rev./Diagnostico')
    await executeTransition(db, 't1', { transitionId: ESCALADO, values: VALORES_ESCALADO }, ADMIN)
    expect((await db.query("SELECT status FROM tickets WHERE id='t1'")).rows[0].status).toBe('Notificado')
  })

  it('con el área correcta la transición se ejecuta y deja traza a nombre de quien la hizo', async () => {
    await ticket('t1', 'Rev./Diagnostico')
    await executeTransition(db, 't1', { transitionId: ESCALADO, values: VALORES_ESCALADO }, SERVICIO)
    const t = await db.query('SELECT transition_id, from_status, to_status, area, performed_by FROM ticket_transitions WHERE ticket_id=$1', ['t1'])
    expect(t.rows).toEqual([{ transition_id: ESCALADO, from_status: 'Rev./Diagnostico', to_status: 'Notificado', area: 'Servicio Técnico', performed_by: 'Tec' }])
  })
})

/**
 * EL ORDEN, DECLARADO. `ticketService.ts:82-110`, de arriba abajo:
 *
 *   400 transición desconocida → 404 ticket → 409 estado → 403 área → 422 plan → 409 OV → 422 derivación
 *
 * DOS TRAMOS DE ESE ORDEN NO SON OBVIOS Y CONVIENE MIRARLOS DOS VECES:
 *
 * 1. **409 antes que 403.** El estado se comprueba ANTES que el permiso, así que a quien no tiene el
 *    área se le contesta por el estado del ticket. Es información que un 403 no daría. No es
 *    gratuito —el 403 llegaría igual en cuanto el ticket estuviera en el estado bueno, así que no
 *    oculta nada duradero—, pero es una decisión, y hasta hoy no estaba escrita en ningún sitio.
 *
 * 2. **422 antes que 409 de la OV.** Quien manda una orden de venta ya usada Y se deja el serial
 *    recibe la queja del serial, no la de la orden. Arregla el serial, vuelve a enviar, y entonces
 *    —y sólo entonces— se entera de que la orden estaba cogida. Dos viajes para dos problemas que ya
 *    se conocían en el primero.
 */
describe('executeTransition · el ORDEN en que se evalúan las guardas', () => {
  it('transición desconocida gana a ticket inexistente: 400, no 404', async () => {
    const r = await fallo(() => executeTransition(db, 'no-existe', { transitionId: 'no-existe' }, ADMIN))
    expect(r.status).toBe(400)
  })

  it('ticket inexistente gana al área ajena: 404, no 403', async () => {
    const r = await fallo(() => executeTransition(db, 'no-existe', { transitionId: ESCALADO, values: VALORES_ESCALADO }, COMERCIAL))
    expect(r.status).toBe(404)
  })

  it('el estado de origen gana al área ajena: 409, no 403', async () => {
    await ticket('t1', 'Ingresado')
    const r = await fallo(() => executeTransition(db, 't1', { transitionId: ESCALADO, values: VALORES_ESCALADO }, COMERCIAL))
    expect(r.status).toBe(409)
  })

  it('el estado de origen gana también a los obligatorios que faltan: 409, no 422', async () => {
    await ticket('t1', 'Ingresado')
    const r = await fallo(() => executeTransition(db, 't1', { transitionId: ESCALADO, values: {} }, ADMIN))
    expect(r.status).toBe(409)
  })

  it('el área ajena gana a los obligatorios que faltan: 403, no 422', async () => {
    await ticket('t1', 'Rev./Diagnostico')
    const r = await fallo(() => executeTransition(db, 't1', { transitionId: ESCALADO, values: {} }, COMERCIAL))
    expect(r.status).toBe(403)
  })

  /**
   * `habilitar_servicio` es la única transición que lleva las dos cosas: campos obligatorios Y la
   * puerta de la orden de venta. Por eso los dos casos de abajo son suyos.
   *
   * ⚠️ ESTA PRUEBA Y LA DE `:327` DICEN LO CONTRARIO, Y LAS DOS ESTÁN EN VERDE. Compara los títulos:
   *
   *   aquí   → «los obligatorios que faltan ganan a la orden de venta ya usada: 422, no 409»
   *   `:327` → «la orden de venta ya usada gana a los obligatorios que faltan: 409, no 422»
   *
   * Son la MISMA pareja de guardas con el ganador invertido, según por qué puerta se entre. No es un
   * descuido de nadie: `executeTransition` y `createManagedTicket` se escribieron por separado y cada
   * una fijó el orden que le salió. Lo que sí es un problema es que, leída sola, cada una parece
   * declarar que la precedencia está decidida — y no lo está.
   *
   * **La precedencia NO está decidida.** El defecto vive en `transitions-st` §3.8 (que son DOS
   * inversiones, no una) y en `tickets-core` §4.1; las dos decían «destino F1A» y F1A cerró sin
   * tocarlas. No hay ninguna fila del plan que lo cubra: es una fila que falta, redactada como
   * entrada 5.a de `docs/sdd/F0-01_Correcciones_para_el_plan.md`.
   *
   * Cuando se fije el orden único, **una de las dos cambia sí o sí**. No hace falta decidir cuál
   * desde aquí; hace falta que quien lea una no crea que ya está resuelto.
   */
  it('los obligatorios que faltan ganan a la orden de venta ya usada: 422, no 409', async () => {
    await ticket('ocupado', 'Ingresado', 8101, { orden_venta: 'OV-DUP' })
    await ticket('t1', STATUS_TICKET_CREADO, 8102)
    const r = await fallo(() => executeTransition(db, 't1', {
      transitionId: 'habilitar_servicio',
      values: { 'Orden de Venta': 'OV-DUP' }, // sin `Serial`, que también es obligatorio
    }, ADMIN))
    expect(r.status).toBe(422)
    expect(r.body.errors).toEqual(['Falta el campo obligatorio: Serial'])
  })

  it('la orden de venta ya usada gana a la persona de derivación inexistente: 409, no 422', async () => {
    await ticket('ocupado', 'Ingresado', 8101, { orden_venta: 'OV-DUP' })
    await ticket('t1', STATUS_TICKET_CREADO, 8102)
    const r = await fallo(() => executeTransition(db, 't1', {
      transitionId: 'habilitar_servicio',
      values: { 'Orden de Venta': 'OV-DUP', Serial: '18A20070', derivado_a: 'no-existe' },
    }, ADMIN))
    expect(r.status).toBe(409)
    expect(r.body.error).toBe('La orden de venta OV-DUP ya está asociada al ticket #8101')
  })

  // La última de la cadena, para que el tramo quede cerrado por los dos extremos: sin la OV de por
  // medio, la derivación inexistente sí contesta.
  it('sin ninguna guarda anterior rota, la persona de derivación inexistente es 422', async () => {
    await ticket('t1', 'Rev./Diagnostico')
    const r = await fallo(() => executeTransition(db, 't1', {
      transitionId: ESCALADO, values: { ...VALORES_ESCALADO, derivado_a: 'no-existe' },
    }, ADMIN))
    expect(r.status).toBe(422)
    expect(r.body.errors).toEqual(['La persona a la que se deriva no existe o está dada de baja'])
  })
})

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// createManagedTicket
// ══════════════════════════════════════════════════════════════════════════════════════════════════

/** Equipo mínimo con el que la creación no se queda en la primera guarda. */
async function equipo(id = 'eq-1'): Promise<void> {
  await db.query("INSERT INTO equipos (id, serial, marca, modelo, tipo) VALUES ($1,'18A20070','Grimm','EDM180C','Monitor')", [id])
}

/** Equipo con `client_id` (y opcionalmente `cliente_nombre`), para la guarda equipo↔cliente. */
async function equipoConCliente(id: string, clientId: string, clienteNombre?: string): Promise<void> {
  await db.query(
    "INSERT INTO equipos (id, serial, marca, modelo, tipo, client_id, cliente_nombre) VALUES ($1,'18A20070','Grimm','EDM180C','Monitor',$2,$3)",
    [id, clientId, clienteNombre ?? null],
  )
}

/** Cliente de Books, que es de donde `getClient` lee (a través de la vista `clients`). */
async function cliente(id = 'cli-1'): Promise<void> {
  await db.query("INSERT INTO books.contacts (contact_id, contact_name) VALUES ($1,'Gecelca S.A. E.S.P.')", [id])
}

/** Los campos que dejan pasar el bloque de obligatorios de `ticketService.ts:87-92`. */
const CAMPOS_OK = { clientId: 'cli-1', tipoServicio: 'Mantenimiento', clasificaciones: 'Correctivo', prefijo: 'MT' }

describe('createManagedTicket · cada guarda por separado', () => {
  it('sin equipo es 422', async () => {
    const r = await fallo(() => createManagedTicket(db, {}, 'Admin'))
    expect(r.status).toBe(422)
    expect(r.body.error).toBe('Falta el equipo')
  })

  it('con un equipo que no está registrado es 422', async () => {
    const r = await fallo(() => createManagedTicket(db, { equipoId: 'no-existe' }, 'Admin'))
    expect(r.status).toBe(422)
    expect(r.body.error).toBe('Equipo no registrado')
  })

  it('con una orden de venta que no está en Books es 422', async () => {
    await equipo()
    const r = await fallo(() => createManagedTicket(db, { equipoId: 'eq-1', salesOrderId: 'no-existe' }, 'Admin'))
    expect(r.status).toBe(422)
    expect(r.body.error).toBe('Orden de venta no encontrada')
  })

  it('los obligatorios que faltan son 422, y el mensaje los lista todos', async () => {
    await equipo()
    const r = await fallo(() => createManagedTicket(db, { equipoId: 'eq-1' }, 'Admin'))
    expect(r.status).toBe(422)
    expect(r.body.error).toBe('Faltan campos obligatorios: cliente, tipo de servicio, clasificaciones, prefijo')
  })

  it('un prefijo que no está en la lista cuenta como prefijo ausente', async () => {
    await equipo(); await cliente()
    const r = await fallo(() => createManagedTicket(db, { equipoId: 'eq-1', ...CAMPOS_OK, prefijo: 'XXX' }, 'Admin'))
    expect(r.status).toBe(422)
    expect(r.body.error).toBe('Faltan campos obligatorios: prefijo')
  })

  it('un cliente que no está en Books es 422', async () => {
    await equipo()
    const r = await fallo(() => createManagedTicket(db, { equipoId: 'eq-1', ...CAMPOS_OK }, 'Admin'))
    expect(r.status).toBe(422)
    expect(r.body.error).toBe('Cliente no encontrado')
  })

  it(`con todo en regla nace en «${STATUS_TICKET_CREADO}» y gestionado por la app`, async () => {
    await equipo(); await cliente()
    await createManagedTicket(db, { equipoId: 'eq-1', ...CAMPOS_OK }, 'Admin')
    const t = (await db.query('SELECT status, managed_by_app, serial, marca, modelo FROM tickets')).rows[0]
    expect(t).toMatchObject({ status: STATUS_TICKET_CREADO, managed_by_app: true, serial: '18A20070', marca: 'Grimm', modelo: 'EDM180C' })
  })
})

/**
 * EL ORDEN, DECLARADO. `ticketService.ts:22-94`, de arriba abajo:
 *
 *   422 equipo → 422 OV inexistente → **409 OV ya usada** → 422 obligatorios → 422 cliente
 *
 * ⚠️ EL TRAMO QUE SORPRENDE: el 409 de la orden de venta va ANTES del 422 de los obligatorios, al
 * revés que en `executeTransition`, donde el 422 del plan va antes del 409 de la misma regla. Las
 * dos puertas de «una OV, un ticket» evalúan la misma comprobación en órdenes OPUESTOS.
 *
 * La consecuencia práctica: quien manda un formulario a medias con una orden ya usada recibe aquí la
 * queja de la orden, y en Habilitar Servicio la de los campos. Es la misma pantalla del mismo flujo
 * contestando distinto al mismo error doble.
 */
describe('createManagedTicket · el ORDEN en que se evalúan las guardas', () => {
  it('el equipo que falta gana a la orden de venta inexistente: «Falta el equipo», no la de la OV', async () => {
    const r = await fallo(() => createManagedTicket(db, { salesOrderId: 'no-existe' }, 'Admin'))
    expect(r.body.error).toBe('Falta el equipo')
  })

  /**
   * ⚠️ ESTA PRUEBA Y LA DE `:194` DICEN LO CONTRARIO, Y LAS DOS ESTÁN EN VERDE. Ver el bloque de
   * `:171-193` para el contraste completo: misma pareja de guardas, ganador invertido según la
   * puerta. **La precedencia no está decidida** —`transitions-st` §3.8 y `tickets-core` §4.1, ambas
   * huérfanas desde que cerró F1A—, y al fijarla una de las dos pruebas cambiará de expectativa.
   */
  it('la orden de venta ya usada gana a los obligatorios que faltan: 409, no 422', async () => {
    await equipo()
    await ticket('ocupado', 'Ingresado', 8101, { orden_venta: 'OV-DUP' })
    // Sin `tipoServicio`, sin `clasificaciones` y sin `prefijo`: el 422 de obligatorios está servido.
    const r = await fallo(() => createManagedTicket(db, { equipoId: 'eq-1', ordenVenta: 'OV-DUP' }, 'Admin'))
    expect(r.status).toBe(409)
    expect(r.body.error).toBe('La orden de venta OV-DUP ya está asociada al ticket #8101')
  })

  it('la orden de venta ya usada gana también al cliente inexistente: 409, no 422', async () => {
    await equipo()
    await ticket('ocupado', 'Ingresado', 8101, { orden_venta: 'OV-DUP' })
    const r = await fallo(() => createManagedTicket(db, { equipoId: 'eq-1', ...CAMPOS_OK, ordenVenta: 'OV-DUP' }, 'Admin'))
    expect(r.status).toBe(409)
  })

  it('los obligatorios que faltan ganan al cliente inexistente: la lista, no «Cliente no encontrado»', async () => {
    await equipo()
    const r = await fallo(() => createManagedTicket(db, { equipoId: 'eq-1', clientId: 'no-existe' }, 'Admin'))
    expect(r.body.error).toBe('Faltan campos obligatorios: tipo de servicio, clasificaciones, prefijo')
  })
})

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// createManagedTicket · la guarda equipo↔cliente (cerrar-hallazgos-revision-f1b-01, design §1)
// ══════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Compara el `clientId` YA RESUELTO (cuerpo o, en su defecto, la orden de venta —`:39`—) contra
 * `equipo.clientId`. Es integridad de datos, no autorización: `tickets.client_id` no filtra ni
 * autoriza nada, sólo resuelve el nombre a mostrar. Corre DESPUÉS del 409 de la OV (`:45-49`) y ANTES
 * de los obligatorios (`:88` exige `clientId`), porque la regla (i) de abajo tiene que rellenar el
 * hueco antes de esa comprobación.
 */
describe('createManagedTicket · la guarda equipo↔cliente', () => {
  it('discrepancia entre el cuerpo y el equipo: 422, y el mensaje nombra al cliente del equipo', async () => {
    await equipoConCliente('eq-1', 'cli-A')
    await cliente('cli-B')
    const r = await fallo(() => createManagedTicket(db, {
      equipoId: 'eq-1', clientId: 'cli-B', tipoServicio: 'Mantenimiento', clasificaciones: 'Correctivo', prefijo: 'MT',
    }, 'Admin'))
    expect(r.status).toBe(422)
    expect(r.body.error).toContain('cli-A')
  })

  // El cuerpo calla: `clientId` se resuelve de la OV (`:39`) y ES ESE valor —no el del cuerpo— el que
  // se contrasta contra el equipo. Guardar sólo el cuerpo dejaría esta puerta abierta (design §1.1).
  // `cliente('cli-B')` y los demás obligatorios están puestos para que, SIN la guarda, la llamada
  // llegue de verdad a 201 (silencioso) y la prueba sea RED por la razón correcta, no por un 422
  // accidental de «Cliente no encontrado» o de obligatorios.
  it('la orden de venta manda sobre el equipo cuando el cuerpo calla el cliente: 422', async () => {
    await equipoConCliente('eq-1', 'cli-A')
    await cliente('cli-B')
    await db.query(
      "INSERT INTO books.sales_orders (salesorder_id,salesorder_number,customer_id,date,raw) VALUES ('ov1','OV-1','cli-B','2026-07-15','{\"order_status\":\"open\"}')",
    )
    const r = await fallo(() => createManagedTicket(db, {
      equipoId: 'eq-1', salesOrderId: 'ov1', tipoServicio: 'Mantenimiento', clasificaciones: 'Correctivo', prefijo: 'MT',
    }, 'Admin'))
    expect(r.status).toBe(422)
  })

  // MUTACIÓN M5 (design §3, fila 2): sin cliente en el cuerpo ni en la OV, el equipo rellena el hueco
  // (regla i) y el ticket nace con SU client_id — no con NULL.
  it('M5 · el equipo manda cuando el cuerpo calla el cliente y no hay orden de venta: 201', async () => {
    await equipoConCliente('eq-1', 'cli-A')
    await cliente('cli-A')
    await createManagedTicket(db, { equipoId: 'eq-1', tipoServicio: 'Mantenimiento', clasificaciones: 'Correctivo', prefijo: 'MT' }, 'Admin')
    const t = (await db.query('SELECT client_id FROM tickets')).rows[0]
    expect(t.client_id).toBe('cli-A')
  })

  // mensaje-422-cliente-duplicado — design §1. Las cuatro pruebas afirman con `toBe` sobre la cadena
  // completa del 422, no con `toContain`: el caso que motiva la tanda es que los dos nombres pueden
  // ser IGUALES (`getClient` no filtra por `contact_type`, a propósito — `books/repo.ts:111-116`), así
  // que sólo el id distingue a los dos clientes y el mensaje tiene que mostrar los dos.
  it('T1 · nombres duplicados: el mensaje distingue a los dos clientes por id aunque compartan nombre', async () => {
    await equipoConCliente('eq-1', 'cli-A', 'Gecelca S.A. E.S.P.')
    await cliente('cli-B')
    const r = await fallo(() => createManagedTicket(db, {
      equipoId: 'eq-1', clientId: 'cli-B', tipoServicio: 'Mantenimiento', clasificaciones: 'Correctivo', prefijo: 'MT',
    }, 'Admin'))
    expect(r.status).toBe(422)
    expect(r.body.error).toBe(
      'El equipo 18A20070 es de «Gecelca S.A. E.S.P.» (cli-A) y el ticket se está creando para «Gecelca S.A. E.S.P.» (cli-B). Corrige el cliente o el equipo.',
    )
  })

  it('T2 · nombres distintos: el mensaje nombra a los dos clientes', async () => {
    await equipoConCliente('eq-1', 'cli-A', 'Ambientalia S.A.S.')
    await cliente('cli-B')
    const r = await fallo(() => createManagedTicket(db, {
      equipoId: 'eq-1', clientId: 'cli-B', tipoServicio: 'Mantenimiento', clasificaciones: 'Correctivo', prefijo: 'MT',
    }, 'Admin'))
    expect(r.status).toBe(422)
    expect(r.body.error).toBe(
      'El equipo 18A20070 es de «Ambientalia S.A.S.» (cli-A) y el ticket se está creando para «Gecelca S.A. E.S.P.» (cli-B). Corrige el cliente o el equipo.',
    )
  })

  it('T3 · el cliente solicitado no tiene ficha en Books: nota «sin ficha en Books», no «Cliente no encontrado»', async () => {
    await equipoConCliente('eq-1', 'cli-A', 'Gecelca S.A. E.S.P.')
    const r = await fallo(() => createManagedTicket(db, {
      equipoId: 'eq-1', clientId: 'cli-B', tipoServicio: 'Mantenimiento', clasificaciones: 'Correctivo', prefijo: 'MT',
    }, 'Admin'))
    expect(r.status).toBe(422)
    expect(r.body.error).toBe(
      'El equipo 18A20070 es de «Gecelca S.A. E.S.P.» (cli-A) y el ticket se está creando para cli-B (sin ficha en Books). Corrige el cliente o el equipo.',
    )
  })

  it('T4 · el equipo no tiene cliente_nombre: nota «sin nombre en el equipo»', async () => {
    await equipoConCliente('eq-1', 'cli-A')
    await cliente('cli-B')
    const r = await fallo(() => createManagedTicket(db, {
      equipoId: 'eq-1', clientId: 'cli-B', tipoServicio: 'Mantenimiento', clasificaciones: 'Correctivo', prefijo: 'MT',
    }, 'Admin'))
    expect(r.status).toBe(422)
    expect(r.body.error).toBe(
      'El equipo 18A20070 es de cli-A (sin nombre en el equipo) y el ticket se está creando para «Gecelca S.A. E.S.P.» (cli-B). Corrige el cliente o el equipo.',
    )
  })
})

/**
 * Regresión (design §3, fila 3): la guarda NO debe alterar lo que ya pasaba. El caso NULL
 * (`equipo.clientId` sin enlazar, el ~3,4 % de `backfillClientId.ts`) ya lo cubre
 * «con todo en regla nace en…» de arriba —equipo() nunca fija `client_id`—; aquí se fija el caso IGUAL,
 * que es el otro que `tickets-core` (spec) declara en el mismo escenario.
 */
describe('createManagedTicket · la guarda equipo↔cliente no cambia lo que ya pasaba', () => {
  it('el alta sin discrepancia no cambia: equipo con el mismo client_id que el cuerpo → 201', async () => {
    await equipoConCliente('eq-1', 'cli-1')
    await cliente('cli-1')
    await createManagedTicket(db, { equipoId: 'eq-1', ...CAMPOS_OK }, 'Admin')
    const t = (await db.query('SELECT client_id FROM tickets')).rows[0]
    expect(t.client_id).toBe('cli-1')
  })
})
