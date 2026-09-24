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
 * EL ORDEN, DECLARADO. `executeTransition`, de arriba abajo:
 *
 *   400 transición desconocida → 404 ticket → 409 estado → 403 área → 422 plan → 422 derivación → 409 OV
 *
 * Es la escalera de precedencia de `transitions-st` §3.8, aplicada como ORDEN TOTAL —nunca por código
 * HTTP—: **A** existencia (transición, ticket) < **B** estado y permiso < **C** contenido (plan,
 * derivación) < **D** unicidad (OV ya usada).
 *
 * UN TRAMO DE ESE ORDEN NO ES OBVIO Y CONVIENE MIRARLO DOS VECES:
 *
 * **409 antes que 403.** El estado se comprueba ANTES que el permiso, así que a quien no tiene el
 * área se le contesta por el estado del ticket. Es información que un 403 no daría. No es gratuito
 * —el 403 llegaría igual en cuanto el ticket estuviera en el estado bueno, así que no oculta nada
 * duradero—, pero es una decisión, y hasta hoy no estaba escrita en ningún sitio (§3.8(b) del delta,
 * conservado sin reordenar).
 *
 * El 422 de la derivación antes que el 409 de la OV YA NO ES UNA RAREZA (F1B-10): es la MISMA regla
 * —contenido antes que unicidad— aplicada dos veces, consecuencia de la escalera de arriba, no una
 * excepción que haya que excusar.
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
   * ESTA PRUEBA Y LA DEL ALTA DE TICKET DICEN LO MISMO, Y LAS DOS ESTÁN EN VERDE. Compara los
   * títulos:
   *
   *   aquí → «los obligatorios que faltan ganan a la orden de venta ya usada: 422, no 409»
   *   alta → «los obligatorios que faltan ganan a la orden de venta ya usada: 422, no 409»
   *
   * Son la MISMA pareja de guardas con el MISMO ganador en las dos puertas: la escalera A/B/C/D
   * (`transitions-st` §3.8) es un orden único aplicado dos veces, no dos reglas independientes que
   * casualmente coinciden.
   *
   * **La precedencia YA ESTÁ DECIDIDA (F1B-10).** Antes vivía en dos comentarios que se
   * contradecían —`transitions-st` §3.8 (que declaraba DOS inversiones) y `tickets-core` §4.1—, los
   * dos con destino «F1A» y F1A cerró sin tocarlos. Era la fila que faltaba en el plan, entrada 5.a de
   * `docs/sdd/F0-01_Correcciones_para_el_plan.md`; esta tanda es la que la cierra.
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

  it('la persona de derivación inexistente gana a la orden de venta ya usada: 422, no 409', async () => {
    await ticket('ocupado', 'Ingresado', 8101, { orden_venta: 'OV-DUP' })
    await ticket('t1', STATUS_TICKET_CREADO, 8102)
    const r = await fallo(() => executeTransition(db, 't1', {
      transitionId: 'habilitar_servicio',
      values: { 'Orden de Venta': 'OV-DUP', Serial: '18A20070', derivado_a: 'no-existe' },
    }, ADMIN))
    expect(r.status).toBe(422)
    expect(r.body.errors).toEqual(['La persona a la que se deriva no existe o está dada de baja'])
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

/** Los campos que dejan pasar el bloque de obligatorios y el de cliente de `ticketService.ts:83-90`. */
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
 * EL ORDEN, DECLARADO. `createManagedTicket`, de arriba abajo:
 *
 *   422 equipo → 422 equipo no registrado → 422 OV inexistente → 422 equipo↔cliente →
 *   422 obligatorios → 422 cliente → **409 OV ya usada**
 *
 * Es la escalera de precedencia de `transitions-st` §3.8, la misma que en `executeTransition`:
 * **A** existencia (equipo, catálogo, OV) < **C** contenido (equipo↔cliente, obligatorios, cliente en
 * Books) < **D** unicidad (OV ya usada). El 409 de la orden de venta YA NO va antes de los
 * obligatorios: va AL FINAL, el mismo lugar que ocupa su equivalente en `executeTransition` — es la
 * MISMA regla aplicada dos veces (F1B-10), no dos arreglos que sólo se parecen.
 *
 * La consecuencia práctica: quien manda un formulario a medias con una orden ya usada recibe la queja
 * del contenido que le falta, y sólo se entera de que la orden estaba cogida cuando ya no le falta
 * nada más. Es la misma escalera que la puerta de Habilitar Servicio.
 */
describe('createManagedTicket · el ORDEN en que se evalúan las guardas', () => {
  // N1 (F1B-10, design §5.2) — G4 vs G5. Hoy responde 409 (rojo NATURAL, sin tocar producción): G4
  // (OV ya usada) corre antes que G5 (equipo↔cliente). Se pone en verde moviendo G4 al final (§2 de
  // esta tanda).
  it('N1 · la discrepancia equipo↔cliente gana a la orden de venta ya usada: 422, no 409', async () => {
    await equipoConCliente('eq-1', 'cli-A')
    await ticket('ocupado', 'Ingresado', 8101, { orden_venta: 'OV-DUP' })
    const r = await fallo(() => createManagedTicket(db, {
      equipoId: 'eq-1', clientId: 'cli-B', ordenVenta: 'OV-DUP',
      tipoServicio: 'Mantenimiento', clasificaciones: 'Correctivo', prefijo: 'MT',
    }, 'Admin'))
    expect(r.status).toBe(422)
    expect(r.body.error).toContain('cli-A')
  })

  it('el equipo que falta gana a la orden de venta inexistente: «Falta el equipo», no la de la OV', async () => {
    const r = await fallo(() => createManagedTicket(db, { salesOrderId: 'no-existe' }, 'Admin'))
    expect(r.body.error).toBe('Falta el equipo')
  })

  /**
   * ESTA PRUEBA Y LA DE `executeTransition` («los obligatorios que faltan ganan a la orden de venta
   * ya usada») DICEN LO MISMO, Y LAS DOS ESTÁN EN VERDE. Misma pareja de guardas, mismo ganador en
   * las dos puertas: la escalera A/B/C/D (`transitions-st` §3.8) fija un orden único, y esta tanda
   * (F1B-10) es la que lo aplica en las dos.
   */
  it('los obligatorios que faltan ganan a la orden de venta ya usada: 422, no 409', async () => {
    await equipo()
    await ticket('ocupado', 'Ingresado', 8101, { orden_venta: 'OV-DUP' })
    // Sin `clientId`, sin `tipoServicio`, sin `clasificaciones` y sin `prefijo`: el 422 de
    // obligatorios está servido, y ahora gana porque el contenido (escalón C) precede a la unicidad
    // (escalón D).
    const r = await fallo(() => createManagedTicket(db, { equipoId: 'eq-1', ordenVenta: 'OV-DUP' }, 'Admin'))
    expect(r.status).toBe(422)
    expect(r.body.error).toBe('Faltan campos obligatorios: cliente, tipo de servicio, clasificaciones, prefijo')
  })

  it('el cliente inexistente gana a la orden de venta ya usada: 422, no 409', async () => {
    await equipo()
    await ticket('ocupado', 'Ingresado', 8101, { orden_venta: 'OV-DUP' })
    const r = await fallo(() => createManagedTicket(db, { equipoId: 'eq-1', ...CAMPOS_OK, ordenVenta: 'OV-DUP' }, 'Admin'))
    expect(r.status).toBe(422)
    expect(r.body.error).toBe('Cliente no encontrado')
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

  // N2 (F1B-10, design §5.2) — G5 vs G6, DENTRO del escalón C. Nace VERDE: el equipo ya rellena el
  // hueco (regla i) antes de que el bloque de obligatorios cuente «cliente» como ausente. El rojo se
  // obtiene por MUTACIÓN (moviendo G5 detrás de G6 y revirtiendo), no de forma natural — ver
  // `apply-progress` para la evidencia.
  it('N2 · dentro del escalón C, el equipo↔cliente se resuelve antes de contar los obligatorios: «cliente» no aparece', async () => {
    await equipoConCliente('eq-1', 'cli-A')
    const r = await fallo(() => createManagedTicket(db, { equipoId: 'eq-1' }, 'Admin'))
    expect(r.status).toBe(422)
    expect(r.body.error).toBe('Faltan campos obligatorios: tipo de servicio, clasificaciones, prefijo')
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

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// createManagedTicket · rama «Equipo nuevo» (alta-equipo-nuevo-en-ticket, RQ-TC-15, RQ-TC-16)
// ══════════════════════════════════════════════════════════════════════════════════════════════════

/** Un modelo del catálogo, con marca y tipo propios (id `${id}-marca`/`${id}-tipo`). */
async function modeloCatalogo(id: string, marca: string, nombreModelo: string, tipo = 'Monitor'): Promise<void> {
  await db.query('INSERT INTO catalogo_marcas (id,nombre) VALUES ($1,$2)', [`${id}-marca`, marca])
  await db.query('INSERT INTO catalogo_tipos (id,nombre) VALUES ($1,$2)', [`${id}-tipo`, tipo])
  await db.query('INSERT INTO catalogo_modelos (id,marca_id,nombre,tipo_id) VALUES ($1,$2,$3,$4)', [id, `${id}-marca`, nombreModelo, `${id}-tipo`])
}

describe('createManagedTicket · rama «Equipo nuevo», criterios de aceptación (proposal.md)', () => {
  it('criterio 1 · datos válidos crea un equipo nuevo con el clientId del ticket, y el ticket queda enlazado a él', async () => {
    await modeloCatalogo('mo-1', 'Grimm', 'EDM180C')
    await cliente('cli-1')
    await createManagedTicket(db, {
      clasificaciones: 'Equipo nuevo', tipoServicio: 'Mantenimiento', prefijo: 'MT', clientId: 'cli-1',
      equipoNuevo: { serial: 'SN-NUEVO-1', modeloId: 'mo-1', fechaFacturaCompra: '2026-01-15' },
    }, 'Admin')
    const eq = (await db.query("SELECT id, client_id, marca, modelo FROM equipos WHERE serial='SN-NUEVO-1'")).rows[0]
    expect(eq).toMatchObject({ client_id: 'cli-1', marca: 'Grimm', modelo: 'EDM180C' })
    const t = (await db.query('SELECT client_id, equipo_id FROM tickets')).rows[0]
    expect(t).toMatchObject({ client_id: 'cli-1', equipo_id: eq.id })
  })

  it('criterio 2 · serial ya existente (espacios y mayúsculas distintos) se reutiliza: no se crea un segundo equipo', async () => {
    await modeloCatalogo('mo-2', 'Grimm', 'EDM180C')
    await cliente('cli-2')
    await db.query("INSERT INTO equipos (id, serial, marca, modelo, tipo) VALUES ('eq-existente','SN-2','Grimm','EDM180C','Monitor')")
    await createManagedTicket(db, {
      clasificaciones: 'Equipo nuevo', tipoServicio: 'Mantenimiento', prefijo: 'MT', clientId: 'cli-2',
      equipoNuevo: { serial: ' sn-2 ', modeloId: 'mo-2', fechaFacturaCompra: '2026-01-15' },
    }, 'Admin')
    expect((await db.query('SELECT COUNT(*)::int AS n FROM equipos')).rows[0].n).toBe(1)
    const t = (await db.query('SELECT equipo_id FROM tickets')).rows[0]
    expect(t.equipo_id).toBe('eq-existente')
  })

  it('criterio 3 · faltan datos del equipo nuevo: 422 listando TODOS los que faltan, y no se escribe nada', async () => {
    const r = await fallo(() => createManagedTicket(db, { clasificaciones: 'Equipo nuevo' }, 'Admin'))
    expect(r.status).toBe(422)
    expect(r.body.error).toBe('Faltan datos del equipo nuevo: el serial, el modelo, la fecha de factura de compra')
    expect((await db.query('SELECT COUNT(*)::int AS n FROM equipos')).rows[0].n).toBe(0)
    expect((await db.query('SELECT COUNT(*)::int AS n FROM tickets')).rows[0].n).toBe(0)
  })

  it('criterio 4 · un dato opcional inválido (Drive): 422 con el mensaje de camposHojaDeVida (F1B-02), y no se escribe nada', async () => {
    await modeloCatalogo('mo-4', 'Grimm', 'EDM180C')
    await cliente('cli-4')
    const r = await fallo(() => createManagedTicket(db, {
      clasificaciones: 'Equipo nuevo', tipoServicio: 'Mantenimiento', prefijo: 'MT', clientId: 'cli-4',
      equipoNuevo: { serial: 'SN-4', modeloId: 'mo-4', fechaFacturaCompra: '2026-01-15', driveUrl: 'javascript:alert(1)' },
    }, 'Admin'))
    expect(r.status).toBe(422)
    expect(r.body.error).toBe('El enlace de Drive debe empezar por https:// y no llevar comillas')
    expect((await db.query('SELECT COUNT(*)::int AS n FROM equipos')).rows[0].n).toBe(0)
  })

  // Aprobación (strict-tdd.md): fija que Mantenimiento y Soporte remoto NO cambian — la guarda 1
  // sigue exigiendo `equipoId` sin excepción salvo para 'Equipo nuevo' (RQ-TC-04, escenario
  // «Mantenimiento sin equipo sigue rechazándose»).
  it('criterio 5 · una guarda posterior falla (OV ya usada): 409 y no queda ningún equipo nuevo escrito', async () => {
    await modeloCatalogo('mo-5', 'Grimm', 'EDM180C')
    await cliente('cli-5')
    await ticket('ocupado', 'Ingresado', 8101, { orden_venta: 'OV-DUP-5' })
    const r = await fallo(() => createManagedTicket(db, {
      clasificaciones: 'Equipo nuevo', tipoServicio: 'Mantenimiento', prefijo: 'MT', clientId: 'cli-5',
      ordenVenta: 'OV-DUP-5',
      equipoNuevo: { serial: 'SN-5', modeloId: 'mo-5', fechaFacturaCompra: '2026-01-15' },
    }, 'Admin'))
    expect(r.status).toBe(409)
    expect((await db.query("SELECT COUNT(*)::int AS n FROM equipos WHERE serial='SN-5'")).rows[0].n).toBe(0)
  })

  it('criterio 6 · Mantenimiento y Soporte remoto sin equipoId siguen en 422 «Falta el equipo»', async () => {
    const r1 = await fallo(() => createManagedTicket(db, { clasificaciones: 'Equipo para servicio de mantenimiento' }, 'Admin'))
    expect(r1.status).toBe(422)
    expect(r1.body.error).toBe('Falta el equipo')
    const r2 = await fallo(() => createManagedTicket(db, { clasificaciones: 'Soporte remoto' }, 'Admin'))
    expect(r2.status).toBe(422)
    expect(r2.body.error).toBe('Falta el equipo')
  })
})

/**
 * P1-P7 — pruebas de POSICIÓN de la rama «Equipo nuevo» (regla de mutación 1, `CLAUDE.md`;
 * design.md §1). Cada una activa DOS guardas a la vez con el orden CORRECTO de hoy; la mutación (que
 * NO vive en el código de producción final, sólo se aplicó y revirtió durante `sdd-apply` para
 * confirmar el rojo) está documentada en `apply-progress.md` §Fase 7, con su diff de reversión.
 */
describe('createManagedTicket · rama «Equipo nuevo», P1-P7 (regla de mutación 1)', () => {
  it('P1 · faltan datos del equipo nuevo + OV inexistente → 422 de datos, no de la OV', async () => {
    const r = await fallo(() => createManagedTicket(db, { clasificaciones: 'Equipo nuevo', salesOrderId: 'no-existe' }, 'Admin'))
    expect(r.status).toBe(422)
    expect(r.body.error).toContain('Faltan datos del equipo nuevo')
  })

  it('P2 · modelo inexistente + fecha opcional inválida → 422 «Modelo no encontrado», no la de la fecha', async () => {
    const r = await fallo(() => createManagedTicket(db, {
      clasificaciones: 'Equipo nuevo',
      equipoNuevo: { serial: 'SN-P2', modeloId: 'no-existe', fechaFacturaCompra: '2026-01-15', fechaAdquisicion: 'no-es-fecha' },
    }, 'Admin'))
    expect(r.status).toBe(422)
    expect(r.body.error).toBe('Modelo no encontrado')
  })

  it('P3 · OV inexistente + Drive inválido → 422 de la OV, no de Drive (molde IV-12)', async () => {
    await modeloCatalogo('mo-p3', 'Grimm', 'EDM180C')
    const r = await fallo(() => createManagedTicket(db, {
      clasificaciones: 'Equipo nuevo', salesOrderId: 'no-existe',
      equipoNuevo: { serial: 'SN-P3', modeloId: 'mo-p3', fechaFacturaCompra: '2026-01-15', driveUrl: 'http://no-seguro' },
    }, 'Admin'))
    expect(r.status).toBe(422)
    expect(r.body.error).toBe('Orden de venta no encontrada')
  })

  it('P4 · serial reutilizado de otro cliente + Drive inválido → 422 equipo↔cliente, no de Drive', async () => {
    await modeloCatalogo('mo-p4', 'Grimm', 'EDM180C')
    await equipoConCliente('eq-p4', 'cli-A')
    await cliente('cli-B')
    const r = await fallo(() => createManagedTicket(db, {
      clasificaciones: 'Equipo nuevo', clientId: 'cli-B',
      equipoNuevo: { serial: '18A20070', modeloId: 'mo-p4', fechaFacturaCompra: '2026-01-15', driveUrl: 'http://no-seguro' },
    }, 'Admin'))
    expect(r.status).toBe(422)
    expect(r.body.error).toContain('cli-A')
  })

  it('P5 · cliente inexistente + Drive inválido → 422 «Cliente no encontrado», no de Drive', async () => {
    await modeloCatalogo('mo-p5', 'Grimm', 'EDM180C')
    const r = await fallo(() => createManagedTicket(db, {
      clasificaciones: 'Equipo nuevo', clientId: 'no-existe', tipoServicio: 'Mantenimiento', prefijo: 'MT',
      equipoNuevo: { serial: 'SN-P5', modeloId: 'mo-p5', fechaFacturaCompra: '2026-01-15', driveUrl: 'http://no-seguro' },
    }, 'Admin'))
    expect(r.status).toBe(422)
    expect(r.body.error).toBe('Cliente no encontrado')
  })

  it('P6 · Drive inválido + OV ya usada → 422 de Drive, no 409 de la OV', async () => {
    await modeloCatalogo('mo-p6', 'Grimm', 'EDM180C')
    await cliente('cli-p6')
    await ticket('ocupado-p6', 'Ingresado', 8199, { orden_venta: 'OV-DUP-P6' })
    const r = await fallo(() => createManagedTicket(db, {
      clasificaciones: 'Equipo nuevo', clientId: 'cli-p6', tipoServicio: 'Mantenimiento', prefijo: 'MT', ordenVenta: 'OV-DUP-P6',
      equipoNuevo: { serial: 'SN-P6', modeloId: 'mo-p6', fechaFacturaCompra: '2026-01-15', driveUrl: 'http://no-seguro' },
    }, 'Admin'))
    expect(r.status).toBe(422)
    expect(r.body.error).toBe('El enlace de Drive debe empezar por https:// y no llevar comillas')
  })

  // P7 reutiliza el escenario de «criterio 5» de arriba (equipo nuevo válido + OV ya usada → 409, sin
  // equipo escrito): es la MISMA pareja de guardas, así que no duplica el `it`. Su mutación —crear el
  // equipo ANTES de la guarda de la OV— se aplicó y revirtió sobre ESE test; ver `apply-progress.md`.
})
