import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { getTicketWithRefs, createTicket, applyTransition, ticketConOrdenVenta } from '@ambientalia/zoho-sync/db/repo'
import { rowToTicketDetail } from '@ambientalia/zoho-sync/db/mappers'
import { getClient, getSalesOrder } from '@ambientalia/zoho-sync/books/repo'
import { getEquipo } from '../db/equipos'
import { buildSubject, buildCodigoServicio, PREFIJOS } from '@ambientalia/shared'
import { transitionById, canExecuteTransition, CLAVE_DERIVACION } from '@ambientalia/shared'
import { getUserById } from '../auth/users'
import { avisoDerivacion } from './avisoDerivacion'
import { areasAAvisar, textoAvisoArea } from './avisoArea'
import { crearAviso, destinatariosDeArea, marcarEnviados } from '../db/avisos'
import { dispararAvisos, type AvisoParaEnviar } from '../avisosWebhook'
import { logger } from '../util/logger'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import { buildTransitionPlan } from '../transitionExec'
import { TRANSITION_ACTOR } from '../transitionActor'
import { HttpError } from '../util/httpError'

// Crea un ticket gestionado por la app en "Ticket creado" (Subsistema C). Pivota opcionalmente en una OV de Books.
export async function createManagedTicket(db: Queryable, body: unknown, actorName: string): Promise<unknown> {
  const b = (body ?? {}) as Record<string, unknown>
  const equipoId = b.equipoId ? String(b.equipoId) : ''
  if (!equipoId) throw new HttpError(422, { error: 'Falta el equipo' })
  const equipo = await getEquipo(db, equipoId)
  if (!equipo) throw new HttpError(422, { error: 'Equipo no registrado' })

  let clientId: string | null = b.clientId ? String(b.clientId) : null
  let ordenVenta: string | null = b.ordenVenta ? String(b.ordenVenta) : null
  let salesorderId: string | null = null
  // La FECHA de la orden viaja con su número. Es el mismo gesto que ya hace el alta de remisión
  // (`routes/remision.ts:193`), y omitirlo dejaba «Habilitar Servicio» pidiendo una fecha que nadie
  // podía rellenar: allí el campo de la orden llega bloqueado, y con él bloqueado no se pinta el
  // buscador que la arrastra.
  let fechaOrdenVenta: string | null = null
  if (b.salesOrderId) {
    const ov = await getSalesOrder(db, String(b.salesOrderId))
    if (!ov) throw new HttpError(422, { error: 'Orden de venta no encontrada' })
    salesorderId = ov.id
    clientId = clientId ?? ov.clientId ?? null
    ordenVenta = ordenVenta ?? ov.number ?? null
    fechaOrdenVenta = ov.date ?? null
  }
  // Una OV, un ticket. El buscador ya solo ofrece las libres, pero una lista no es una frontera: sin
  // esto basta con mandar el id a mano —o llegar con la lista cacheada— para duplicar la orden.
  const enUso = await ticketConOrdenVenta(db, { salesorderId, numero: ordenVenta })
  if (enUso) {
    const cual = ordenVenta ? `La orden de venta ${ordenVenta}` : 'Esa orden de venta'
    throw new HttpError(409, { error: `${cual} ya está asociada al ticket #${enUso.number}` })
  }
  const tipoServicio = b.tipoServicio ? String(b.tipoServicio) : ''
  const clasificaciones = b.clasificaciones ? String(b.clasificaciones) : ''
  const prefijo = b.prefijo ? String(b.prefijo) : ''
  const missing: string[] = []
  if (!clientId) missing.push('cliente')
  if (!tipoServicio) missing.push('tipo de servicio')
  if (!clasificaciones) missing.push('clasificaciones')
  if (!prefijo || !(PREFIJOS as readonly string[]).includes(prefijo)) missing.push('prefijo')
  if (missing.length) throw new HttpError(422, { error: `Faltan campos obligatorios: ${missing.join(', ')}` })
  const cliente = await getClient(db, clientId!)
  if (!cliente) throw new HttpError(422, { error: 'Cliente no encontrado' })
  const codigoServicio = b.codigoServicio ? String(b.codigoServicio) : buildCodigoServicio({ prefijo, serie: equipo.serial, modelo: equipo.modelo ?? '', fecha: new Date() })
  const subject = b.subject ? String(b.subject) : buildSubject({ cliente: cliente.name, tipoEquipo: equipo.tipo ?? '', codigo: codigoServicio })
  const id = await createTicket(db, {
    subject, codigoServicio, classification: clasificaciones, tipoServicio, equipo: equipo.tipo ?? null,
    marca: equipo.marca ?? null, modelo: equipo.modelo ?? null, serial: equipo.serial,
    ordenVenta, fechaOrdenVenta, priority: b.prioridad ? String(b.prioridad) : null,
    clientId: clientId!, salesorderId, equipoId: equipo.id, actor: actorName,
  })
  const created = await getTicketWithRefs(db, id)
  return created ? rowToTicketDetail(created.row, created.refs) : {}
}

// Ejecuta una transición del Blueprint escribiendo en Postgres (Subsistema B).
export async function executeTransition(
  db: Queryable,
  id: string,
  body: unknown,
  user: { areas: string[]; isAdmin: boolean; name?: string; id?: string },
  config?: AppConfig,
): Promise<unknown> {
  const b = (body ?? {}) as Record<string, unknown>
  const t = transitionById(String(b.transitionId))
  if (!t) throw new HttpError(400, { error: 'Transición desconocida' })
  const current = await getTicketWithRefs(db, id)
  if (!current) throw new HttpError(404, { error: 'Ticket no encontrado' })
  if (!t.from.includes(current.row.status)) {
    throw new HttpError(409, { error: `La transición "${t.name}" no aplica desde el estado "${current.row.status}"` })
  }
  if (!canExecuteTransition(user.areas, user.isAdmin, t.area)) {
    throw new HttpError(403, { error: `Tu rol no tiene permiso para esta transición (área: ${t.area})` })
  }
  const values = (b.values ?? {}) as Record<string, unknown>
  const plan = buildTransitionPlan(t, values)
  if (plan.errors.length) throw new HttpError(422, { errors: plan.errors })
  // La segunda puerta por la que una OV entra en un ticket (Habilitar Servicio). Misma regla que en
  // la creación: una orden, un servicio. Se excluye el propio ticket, porque reconfirmar la OV que ya
  // tiene no es duplicarla.
  const nuevaOrdenVenta = plan.columns.orden_venta
  if (typeof nuevaOrdenVenta === 'string' && nuevaOrdenVenta) {
    const enUso = await ticketConOrdenVenta(db, { numero: nuevaOrdenVenta }, id)
    if (enUso) throw new HttpError(409, { error: `La orden de venta ${nuevaOrdenVenta} ya está asociada al ticket #${enUso.number}` })
  }
  // El navegador manda un id de persona, y un id sin comprobar es una FK rota: el ticket quedaría
  // apuntando a alguien que no existe y la ficha no sabría a quién enseñar. Se rechaza también a los
  // dados de baja, por lo mismo que no salen en el desplegable — nunca van a abrir ese ticket.
  const derivadoA = plan.columns[CLAVE_DERIVACION]
  if (typeof derivadoA === 'string' && derivadoA) {
    const persona = await getUserById(db, derivadoA)
    if (!persona?.active) throw new HttpError(422, { errors: ['La persona a la que se deriva no existe o está dada de baja'] })
  }
  const actor = user.name ?? TRANSITION_ACTOR
  const derivadoAntes = current.row.derivado_a ?? null
  await applyTransition(db, id, current.row.status, { id: t.id, name: t.name, area: t.area }, plan, actor, values)

  /*
   * El aviso va DESPUÉS de la transición y fuera de su transacción, a propósito.
   *
   * `applyTransition` vive en `packages/zoho-sync` y `avisos` es una tabla de la app: meterla dentro
   * ataría el paquete de sincronización a un concepto que no es suyo. La contrapartida es que una
   * caída justo entre las dos escrituras pierde el aviso; se acepta porque lo que importa —la
   * derivación— sí queda en el ticket y en el historial, y el destinatario la ve igual en su vista.
   */
  // Se acumulan aquí para mandarlos en UNA sola llamada a n8n: una transición puede generar el aviso
  // de derivación y varios de área, y un webhook por cabeza sería ruido de red por nada.
  const porCorreo: AvisoParaEnviar[] = []

  if (typeof derivadoA === 'string' || derivadoA === null) {
    const aviso = avisoDerivacion({
      anterior: derivadoAntes,
      nuevo: typeof derivadoA === 'string' ? derivadoA : null,
      actorId: user.id ?? '',
      actorNombre: actor,
      ticketNumero: Number(current.row.number),
      transicion: t.name,
    })
    if (aviso) {
      const avisoId = await crearAviso(db, { userId: aviso.userId, ticketId: id, texto: aviso.texto })
      const dest = await getUserById(db, aviso.userId)
      // `conCopia` solo aquí: el aviso de ÁREA de más abajo ya le llega al administrador como
      // destinatario de pleno derecho, y copiárselo además sería mandárselo dos veces.
      if (dest) porCorreo.push({ id: avisoId, email: dest.email, nombre: dest.name, texto: aviso.texto, ticketNumero: Number(current.row.number), conCopia: true })
    }
  }

  /*
   * El segundo aviso: el ticket entró en una fase que le toca a otra área. Va aquí, junto al de
   * derivación y por la misma razón —fuera de la transacción, porque `avisos` es de la app y
   * `applyTransition` vive en el paquete de sincronización—, y con la misma tolerancia al fallo: lo
   * que importa es la transición, que ya está escrita.
   *
   * Se deduplica por persona ANTES de escribir: quien sea destinataria por dos áreas a la vez
   * (Comercial y Compras salen juntas de varias fases) recibiría el mismo aviso dos veces.
   */
  const areasAvisar = areasAAvisar(t.to, user.areas)
  if (areasAvisar.length) {
    const porPersona = new Map<string, { id: string; email: string; name: string }>()
    for (const area of areasAvisar) {
      for (const d of await destinatariosDeArea(db, area, user.id ?? '')) porPersona.set(d.id, d)
    }
    const texto = textoAvisoArea({ ticketNumero: Number(current.row.number), estado: t.to, actorNombre: actor })
    for (const d of porPersona.values()) {
      const avisoId = await crearAviso(db, { userId: d.id, ticketId: id, texto })
      porCorreo.push({ id: avisoId, email: d.email, nombre: d.name, texto, ticketNumero: Number(current.row.number) })
    }
  }

  /*
   * El correo va al final y NUNCA puede tumbar la transición, que a estas alturas lleva rato escrita.
   * Se espera al resultado —en vez de soltarlo— porque `enviado_at` solo tiene sentido si se conoce, y
   * `dispararAvisos` ya acota la espera con su propio timeout. Lo que no se selle queda en NULL, que es
   * la cola de reintento.
   */
  if (config && porCorreo.length) {
    const r = await dispararAvisos(config, porCorreo)
    if (r.disparado) await marcarEnviados(db, porCorreo.map((a) => a.id))
    else logger.warn({ motivo: r.motivo, ticketId: id, avisos: porCorreo.length }, 'no se pudieron mandar los avisos por correo')
  }

  const updated = await getTicketWithRefs(db, id)
  return updated ? rowToTicketDetail(updated.row, updated.refs) : {}
}
