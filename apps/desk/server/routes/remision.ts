import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { RemisionNueva } from '@ambientalia/shared'
import { perfilChecklist } from '@ambientalia/shared'
import { getTicketWithRefs, ticketConOrdenVenta } from '@ambientalia/zoho-sync/db/repo'
import { getEquipoFull } from '../db/equipos'
import { hayChecklist } from '../db/remisionChecklist'
import { checklistDeRemision } from '../db/checklistRemision'
import { createRemision, getRemision, listRemisionesByTicket, listRemisionesListado, addFoto, listFotos, getFotoContent, setResultadoRemision, remisionPendienteDe, reclamarEnvio, liberarEnvio, listFotosConContenido, anularRemision, restaurarRemision } from '../db/remisiones'
import { getClient, getSalesOrder } from '@ambientalia/zoho-sync/books/repo'
import { buildRemisionPayload, dispararRemision } from '../remisionWebhook'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import { requireAuth, requireAdmin } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'
import { crearSubida } from '../util/subida'
import { sincronizarEstadoPorRemision } from '../db/estadoPorRemision'
import { TRANSITION_ACTOR } from '../transitionActor'

// Mismo criterio que los adjuntos de resolución: solo imágenes, y SVG fuera (permite script embebido).
const TIPOS_FOTO = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])
const upload = crearSubida()

/**
 * Rutas de remisiones. Van bajo `/api/remisiones` y no bajo `/api/tickets/:id/…` a propósito: el
 * callback que n8n usará para avisar del resultado NO puede autenticarse con la cookie de sesión,
 * así que este grupo necesita su propio criterio de acceso por ruta.
 */
export function registerRemisionRoutes(app: Express, deps: { db: Queryable; config: AppConfig }): void {
  const { db, config } = deps

  /**
   * Datos con los que abrir el formulario de remisión de entrada ya prellenado.
   *
   * Todo se resuelve en el servidor a partir del ticket: el navegador solo manda el id. Los datos del
   * equipo salen de `equipos` (la fuente de verdad) y no de las columnas del ticket, que son una copia
   * tomada al crearlo; si el equipo se corrigió después, manda el registro del equipo. Cuando el ticket
   * no tiene `equipo_id` —los históricos de Zoho— se cae a esas columnas para no dejar la remisión sin datos.
   */
  app.get('/api/remisiones/nueva', requireAuth(db), asyncHandler(async (req, res) => {
    const ticketId = String(req.query.ticketId ?? '')
    if (!ticketId) { res.status(400).json({ error: 'Falta ticketId' }); return }
    const found = await getTicketWithRefs(db, ticketId)
    if (!found) { res.status(404).json({ error: 'Ticket no encontrado' }); return }
    const { row, refs } = found

    const eq = row.equipo_id ? await getEquipoFull(db, row.equipo_id) : null
    const equipo = {
      id: eq?.id ?? row.equipo_id ?? null,
      serial: eq?.serial ?? row.serial ?? null,
      marca: eq?.marca ?? row.marca ?? null,
      modelo: eq?.modelo ?? row.modelo ?? null,
      tipo: eq?.tipo ?? row.equipo ?? null,
    }
    const perfil = perfilChecklist(equipo.marca, equipo.modelo)
    // FASE 2: el checklist sale de la lista de accesorios del MODELO del equipo. Al perfil solo se cae
    // cuando el ticket no tiene equipo enlazado, que es la única forma de no dejar sin lista a los
    // históricos que nunca se pudieron enlazar.
    const checklist = await checklistDeRemision(db, { modeloId: eq?.modeloId ?? null, perfil })
    const payload: RemisionNueva = {
      ticketId: row.id,
      ticketNumber: String(row.number),
      cliente: refs.accountName ?? null,
      clientId: row.client_id ?? null,
      equipo,
      tipoServicio: row.tipo_servicio ?? null,
      ordenVenta: row.orden_venta ?? null,
      perfil,
      incluye: checklist.items,
      origenChecklist: checklist.origen,
      catalogoCargado: await hayChecklist(db),
    }
    res.json(payload)
  }))

  /**
   * Vista tabular de TODAS las remisiones (históricas + app), para la sección propia de la
   * cabecera. Va ANTES de `/api/remisiones/:id` por el mismo motivo que `/nueva` arriba:
   * registrada después, `:id` se comería el literal `listado`.
   *
   * `?incluirAnuladas=1` es lo que usa el interruptor "Ver anuladas" (solo administradores en la
   * UI); sin él, una remisión anulada no aparece aquí ni en el CSV que se exporta de esta vista.
   *
   * Ocultar el interruptor en la UI no basta: sin esta comprobación, cualquier usuario con sesión
   * podría pedir esta URL a mano y ver quién anuló qué y cuándo. `requireAdmin` no puede ir en la
   * ruta entera —un no-admin sigue pudiendo ver el listado normal—, así que el corte va dentro del
   * handler y solo cuando de verdad se pidieron las anuladas.
   */
  app.get('/api/remisiones/listado', requireAuth(db), asyncHandler(async (req, res) => {
    const incluirAnuladas = req.query.incluirAnuladas === '1' || req.query.incluirAnuladas === 'true'
    if (incluirAnuladas && !req.user?.isAdmin) {
      res.status(403).json({ error: 'Requiere permisos de administrador' }); return
    }
    res.json(await listRemisionesListado(db, incluirAnuladas))
  }))

  /** Remisiones ya registradas de un ticket, con sus fotos. Alimenta el panel del detalle. */
  app.get('/api/remisiones', requireAuth(db), asyncHandler(async (req, res) => {
    const ticketId = String(req.query.ticketId ?? '')
    if (!ticketId) { res.status(400).json({ error: 'Falta ticketId' }); return }
    const items = await listRemisionesByTicket(db, ticketId)
    res.json(await Promise.all(items.map(async (r) => ({ ...r, fotos: await listFotos(db, r.id) }))))
  }))

  /**
   * Una remisión con sus fotos. La sondea el formulario mientras espera el desenlace de n8n, que
   * llega por el callback y puede tardar decenas de segundos.
   *
   * Va DESPUÉS de `/api/remisiones/nueva`: registrada antes, `:id` se tragaría esa ruta.
   */
  app.get('/api/remisiones/:id', requireAuth(db), asyncHandler(async (req, res) => {
    const r = await getRemision(db, String(req.params.id))
    if (!r) { res.status(404).json({ error: 'Remisión no encontrada' }); return }
    res.json({ ...r, fotos: await listFotos(db, r.id) })
  }))

  /**
   * Registra la remisión. Queda en `pendiente`: el disparo al flujo de n8n llega después, y el
   * resultado lo escribirá el callback. Las fotos se suben aparte, contra la remisión ya creada.
   */
  app.post('/api/remisiones', requireAuth(db), asyncHandler(async (req, res) => {
    const b = (req.body ?? {}) as Record<string, unknown>
    const ticketId = b.ticketId ? String(b.ticketId) : ''
    if (!ticketId) { res.status(422).json({ error: 'Falta el ticket' }); return }
    const found = await getTicketWithRefs(db, ticketId)
    if (!found) { res.status(422).json({ error: 'Ticket no encontrado' }); return }
    const fecha = b.fecha ? String(b.fecha).slice(0, 10) : ''
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) { res.status(422).json({ error: 'Fecha inválida' }); return }

    /*
     * F1B-01 · EL SERIAL ES OBLIGATORIO. `R08.1.md:1045` — «[DECIDIDO] El campo número de serie es
     * obligatorio al crear la remisión.»
     *
     * Se resuelve por la MISMA precedencia que se guarda abajo —el equipo del catálogo manda sobre la
     * copia propia del ticket— y no sobre `found.row.serial` a secas: una guarda que mirase sólo la
     * copia rechazaría tickets que SÍ tienen equipo, que es lo contrario de lo que se pide.
     *
     * A QUIÉN AFECTA DE VERDAD. Un ticket nacido en la app siempre lo trae: el alta exige `equipoId`
     * del catálogo (`ticketService.ts:22-25`) y el equipo trae serial. Lo que esto cierra es la otra
     * entrada —la que M1.3.2 llama la que «nunca se cruza» con aquélla—: un ticket sincronizado desde
     * Zoho llega SIN serial, y por eso `habilitar_servicio` lo exige (`transitions.ts:189`). Hasta
     * hoy nada impedía remisionarlo antes de pasar por ahí, y la remisión salía sin identificar el
     * equipo que acompaña.
     *
     * VA CON LOS OTROS 422 Y ANTES DEL 409, a propósito y no por descuido: este manejador ya valida
     * ticket y fecha como 422 antes del conflicto de estado, así que el serial entra en su misma
     * clase en vez de inaugurar un tercer orden. (La inversión 409/422 del ALTA sigue abierta y es
     * otra cosa: `tickets-core` §4.1 con `transitions-st` §3.8.)
     *
     * Por eso el equipo se resuelve aquí arriba y no más abajo: la guarda tiene que ir antes de
     * cualquier escritura, y el bloque de la orden de venta ya escribe en `tickets`.
     */
    const eq = found.row.equipo_id ? await getEquipoFull(db, found.row.equipo_id) : null
    const serial = (eq?.serial ?? found.row.serial ?? '').trim()
    if (!serial) {
      res.status(422).json({ error: 'Falta el serial del equipo: el ticket no tiene equipo del catálogo ni serial propio' })
      return
    }

    /*
     * Una sola remisión sin desenlace por ticket. Hasta ahora esto lo "defendía" un cartel del
     * formulario, que es un consejo y no una barrera: si la consulta que lo alimenta falla no
     * aparece, y un cliente directo de la API no lo ve nunca. Dos `pendiente` a la vez son hoy dos
     * entradas DEL MISMO equipo —el equipo se deriva del ticket, no se acepta del navegador—, así
     * que son un duplicado y no dos equipos.
     *
     * Se rechaza por defecto pero NO del todo: bloquear sin salida dejaría al técnico sin poder
     * crear otra si n8n se cae y la primera se queda en `pendiente` para siempre, que es justo la
     * clase de callejón que este subsistema ya ha tenido dos veces. `permitirSegunda` es el
     * formulario diciendo que el humano lo confirmó; el servidor no puede distinguirlo por su cuenta.
     *
     * El 409 devuelve el id de la que ya existe: sin él, lo único que puede hacer quien lo recibe es
     * volver a intentarlo a ciegas.
     */
    if (b.permitirSegunda !== true) {
      const pendiente = await remisionPendienteDe(db, ticketId)
      if (pendiente) {
        res.status(409).json({
          error: 'Este ticket ya tiene una remisión sin desenlace. Vuelve a abrir el formulario para enviarla, o crear otra a propósito.',
          remisionId: pendiente,
        })
        return
      }
    }
    // El perfil se recalcula aquí, no se acepta del navegador: es el que decide qué checklist aplica,
    // y confiar en el cliente permitiría remisionar con la lista equivocada. El equipo ya se resolvió
    // arriba, con la guarda del serial.
    const marca = eq?.marca ?? found.row.marca ?? null
    const modelo = eq?.modelo ?? found.row.modelo ?? null
    const perfil = perfilChecklist(marca, modelo)

    // Solo se aceptan ítems que estén de verdad en el checklist. Se resuelve por la MISMA vía que al
    // abrir el formulario: si las dos puertas no leyeran de la misma fuente, lo que el técnico ve
    // marcable dejaría de ser lo que el servidor acepta.
    const validos = new Set((await checklistDeRemision(db, { modeloId: eq?.modeloId ?? null, perfil })).items)
    const pedidos = Array.isArray(b.incluye) ? b.incluye.map(String) : []
    const desconocidos = pedidos.filter((i) => !validos.has(i))
    if (desconocidos.length) { res.status(422).json({ error: `Ítems fuera del checklist: ${desconocidos.join(', ')}` }); return }

    // Empresa y persona de contacto se guardan EN la remisión, no se derivan del ticket cada vez que
    // se muestra: la remisión es un documento, no una vista. Si el ticket cambia de cliente, o el
    // cliente se renombra en Books, la remisión debe seguir diciendo a qué empresa y a qué persona
    // correspondió cuando se hizo.
    const cliente = found.row.client_id ? await getClient(db, found.row.client_id) : null

    /*
     * La orden de venta se puede capturar aquí para no tener que hacerlo en Habilitar Servicio. Es
     * OPCIONAL: cuando el equipo entra, la venta puede no existir todavía, y exigirla dejaría al
     * técnico sin poder remisionar.
     *
     * Llega el ID y se resuelven aquí el número y la fecha contra Books —mismo criterio que el
     * equipo y el perfil unas líneas más arriba—: son datos de otro sistema y aceptarlos del
     * navegador es la vía corta a una OV que no casa con ninguna.
     *
     * El `UPDATE` es condicional en el propio SQL y no con un `if` previo: la que ya está no se pisa
     * —por eso el formulario la enseña en gris— y así dos remisiones simultáneas no pueden colar
     * cada una la suya.
     */
    if (b.salesOrderId) {
      const ov = await getSalesOrder(db, String(b.salesOrderId))
      if (!ov) { res.status(422).json({ error: 'Orden de venta no encontrada' }); return }
      /*
       * TERCERA PUERTA de «una OV, un ticket» (IV-4, RQ-RE-16). Transitoria: se retira el día en que
       * la tabla propia con `salesorder_id` como PRIMARY KEY (`Decisiones_Gerencia_2026-09-10.md:147-150`)
       * sustituya a las tres guardas de aplicación; retirar sólo ésta sin retirar las otras dos sería
       * el defecto. Las DOS vías son requisito, no preferencia: el sync puede dejar a un ticket con
       * sólo una de las dos columnas vigente (IV-11, fuera de alcance), y comprobar sólo por número
       * dejaría ese ticket sin protección. El propio ticket va excluido: reenviar la misma orden al
       * mismo ticket no es duplicarla.
       */
      const enUso = await ticketConOrdenVenta(db, { salesorderId: ov.id, numero: ov.number }, ticketId)
      if (enUso) {
        res.status(409).json({ error: `La orden de venta ${ov.number} ya está asociada al ticket #${enUso.number}` })
        return
      }
      await db.query(
        `UPDATE tickets SET orden_venta = $2, fecha_orden_venta = $3, salesorder_id = $4, updated_at = now()
          WHERE id = $1 AND COALESCE(orden_venta, '') = ''`,
        [ticketId, ov.number, ov.date ?? null, ov.id],
      )
    }

    const id = await createRemision(db, {
      ticketId, fecha, tipoServicio: found.row.tipo_servicio ?? null, perfil,
      equipoId: eq?.id ?? found.row.equipo_id ?? null, serial, // ya resuelto y recortado en la guarda de arriba: una sola resolución, un solo valor
      incluye: pedidos, observaciones: b.observaciones ? String(b.observaciones) : null,
      creadoPor: req.user?.name ?? null,
      // `companyName` con respaldo en `name`, no solo `companyName`: el histórico importado de la hoja
      // se llenó con el NOMBRE del cliente (así lo escribía el flujo de n8n, que solo usa `empresa` con
      // el mismo respaldo al armar el documento — ver `Code Parsing Datos Agente IA`), y muchos
      // contactos de Books no traen `company_name`. Sin este respaldo, `empresa` quedaría NULL en casi
      // toda remisión nueva mientras las históricas sí la traen: la columna significaría una cosa en
      // unas filas y nada en otras. `personaContacto` no lleva respaldo porque es un campo propio de
      // Books sin equivalente al que caer.
      empresa: cliente?.companyName ?? cliente?.name ?? null, personaContacto: cliente?.personaContacto ?? null,
    })
    // NO se dispara el flujo aquí: las fotos se suben después, contra la remisión ya creada, así
    // que en este punto todavía no existen y el documento saldría sin ellas. El envío es un paso
    // explícito (`/enviar`) que el formulario invoca cuando ya ha subido todo.
    res.status(201).json(await getRemision(db, id))
  }))

  /**
   * Envía la remisión al flujo de n8n. Paso separado de la creación porque las fotos se suben
   * después: dispararlo al crear mandaba el documento sin registro fotográfico.
   *
   * No espera al trabajo — n8n responde 202 en cuanto valida — y si el disparo falla la remisión
   * sigue guardada en `pendiente`, así que se puede reintentar sin rehacer el formulario.
   */
  app.post('/api/remisiones/:id/enviar', requireAuth(db), asyncHandler(async (req, res) => {
    const id = String(req.params.id)
    const rem = await getRemision(db, id)
    if (!rem) { res.status(404).json({ error: 'Remisión no encontrada' }); return }
    // Generar un documento en Drive de algo que se acaba de anular sería absurdo: la anulación
    // corta el envío antes de mirar siquiera el estado del flujo n8n.
    if (rem.anuladaAt) {
      res.status(409).json({ error: 'Esta remisión fue anulada y no se puede enviar' }); return
    }
    // Reenviar una remisión ya cerrada generaría un segundo documento y una segunda carpeta en Drive
    // para el mismo equipo. Solo se reenvía lo que no llegó a buen puerto.
    if (rem.estado === 'ok' || rem.estado === 'ok_con_avisos') {
      res.status(409).json({ error: 'Esta remisión ya se envió' }); return
    }
    // Reclamación atómica: cubre el reintento tras perder cobertura justo después de un disparo que
    // sí salió bien, y el doble clic o las dos pestañas. Leer el estado y decidir no es suficiente,
    // porque dos peticiones simultáneas pasarían las dos esa comprobación.
    if (!(await reclamarEnvio(db, id))) {
      res.status(409).json({ error: 'Esta remisión se envió hace un momento; espera a que termine.' }); return
    }
    // `ticketId` es NULL-able en el tipo (las remisiones históricas pueden no tener ticket), y esta
    // rama necesita uno para poder buscar el ticket y armar el payload de n8n.
    if (!rem.ticketId) { res.status(422).json({ error: 'Remisión sin ticket asociado' }); return }
    const found = await getTicketWithRefs(db, rem.ticketId)
    if (!found) { res.status(422).json({ error: 'Ticket no encontrado' }); return }

    const eq = rem.equipoId ? await getEquipoFull(db, rem.equipoId) : null
    const cliente = found.row.client_id ? await getClient(db, found.row.client_id) : null
    const payload = buildRemisionPayload({
      remision: rem, ticketNumero: String(found.row.number), cliente, equipo: eq,
      usuario: { name: req.user!.name, email: req.user!.email, cargo: req.user!.cargo ?? null },
      fotos: await listFotosConContenido(db, id),
    })
    const r = await dispararRemision(config, payload)
    if (!r.disparado) {
      // Sin soltar la reclamación, un webhook mal configurado obligaría a esperar toda la ventana de
      // reenvío (`VENTANA_REENVIO_SEGUNDOS`, ver db/remisiones.ts) para poder reintentar, aunque el
      // disparo ni siquiera llegó a salir.
      await liberarEnvio(db, id)
      req.log?.warn(`Remisión ${id} no disparada: ${r.motivo}`)
      res.status(502).json({ error: 'No se pudo enviar a n8n', detalle: r.motivo }); return
    }
    res.json({ enviado: true })
  }))

  /**
   * Anula la remisión: no la borra, la marca (ver el comentario de `anularRemision`). Solo
   * administradores, mismo criterio que borrar un equipo o una resolución.
   */
  app.post('/api/remisiones/:id/anular', requireAuth(db), requireAdmin, asyncHandler(async (req, res) => {
    const id = String(req.params.id)
    if (!(await getRemision(db, id))) { res.status(404).json({ error: 'Remisión no encontrada' }); return }
    const rem = await getRemision(db, id)
    await anularRemision(db, id, req.user?.name ?? null)
    // Si era la última confirmada, el ticket vuelve a "Ticket creado": dejarlo en "Remisión creada"
    // sin ninguna detrás es justo la mentira que el estado tiene que evitar.
    await sincronizarEstadoPorRemision(db, rem!.ticketId, req.user?.name ?? TRANSITION_ACTOR)
    res.json(await getRemision(db, id))
  }))

  /** Deshace una anulación. Solo administradores, mismo criterio que anular. */
  app.post('/api/remisiones/:id/restaurar', requireAuth(db), requireAdmin, asyncHandler(async (req, res) => {
    const id = String(req.params.id)
    if (!(await getRemision(db, id))) { res.status(404).json({ error: 'Remisión no encontrada' }); return }
    await restaurarRemision(db, id)
    const rem = await getRemision(db, id)
    await sincronizarEstadoPorRemision(db, rem!.ticketId, req.user?.name ?? TRANSITION_ACTOR)
    res.json(rem)
  }))

  /**
   * Callback de n8n con el desenlace. NO usa la cookie de sesión —n8n no la tiene— sino un secreto
   * compartido en cabecera. Sin `REMISION_CALLBACK_TOKEN` configurado la ruta responde 503 en vez de
   * quedar abierta: una remisión que nadie puede cerrar es mejor que un endpoint sin autenticar.
   */
  app.post('/api/remisiones/:id/callback', asyncHandler(async (req, res) => {
    if (!config.remisionCallbackToken) { res.status(503).json({ error: 'Callback no configurado' }); return }
    if (req.get('X-Remision-Callback') !== config.remisionCallbackToken) { res.status(401).json({ error: 'No autorizado' }); return }
    const id = String(req.params.id)
    const rem = await getRemision(db, id)
    if (!rem) { res.status(404).json({ error: 'Remisión no encontrada' }); return }
    const b = (req.body ?? {}) as { estado?: string; resultado?: unknown }
    const estado = b.estado === 'ok' || b.estado === 'ok_con_avisos' || b.estado === 'error' ? b.estado : null
    if (!estado) { res.status(422).json({ error: 'Estado inválido' }); return }
    await setResultadoRemision(db, id, estado, b.resultado ?? null)
    // Aquí es donde el ticket avanza a "Remisión creada", y no al crear la remisión: es este
    // callback el que dice que el documento existe de verdad en Drive. Un desenlace en `error` no
    // mueve nada, porque el recuento de confirmadas no lo suma.
    //
    // Firma quien CREÓ la remisión, no el marcador. Esta petición no tiene sesión —n8n no manda la
    // cookie—, así que aquí no hay `req.user`; pero el autor no se ha perdido, está guardado en la
    // propia remisión. Sin esto, el hilo de un ticket llevado por una sola persona enseñaba un
    // «Equipo Técnico» que parece un usuario y que nunca intervino. El marcador queda solo como
    // último recurso, para las remisiones históricas que no traen autor.
    await sincronizarEstadoPorRemision(db, rem.ticketId, rem.creadoPor ?? TRANSITION_ACTOR)
    res.json({ ok: true })
  }))

  app.post('/api/remisiones/:id/fotos', requireAuth(db), upload.single('file'), asyncHandler(async (req, res) => {
    const id = String(req.params.id)
    if (!(await getRemision(db, id))) { res.status(404).json({ error: 'Remisión no encontrada' }); return }
    const f = req.file
    if (!f) { res.status(400).json({ error: 'Falta el archivo' }); return }
    if (!TIPOS_FOTO.has(f.mimetype)) { res.status(415).json({ error: 'Tipo de imagen no permitido' }); return }
    res.status(201).json(await addFoto(db, {
      remisionId: id, filename: f.originalname, contentType: f.mimetype,
      contentB64: f.buffer.toString('base64'), size: f.size,
    }))
  }))

  app.get('/api/remisiones/:id/fotos/:fotoId', requireAuth(db), asyncHandler(async (req, res) => {
    const c = await getFotoContent(db, String(req.params.id), String(req.params.fotoId))
    if (!c) { res.status(404).json({ error: 'No encontrada' }); return }
    res.set('Content-Type', c.contentType)
    res.set('X-Content-Type-Options', 'nosniff')
    res.send(Buffer.from(c.contentB64, 'base64'))
  }))
}
