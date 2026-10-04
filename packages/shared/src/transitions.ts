// Motor de transiciones (Plan B): replicamos el Blueprint de Servicio Técnico en la app,
// porque Zoho Desk NO expone Blueprint por API REST. La ejecución se hace vía updateTicket
// (status destino + customFields) + comentario. Ver docs/blueprint-servicio-tecnico.md.
//
// IMPORTANTE: los strings de `from`/`to` deben ser los ESTADOS REALES de Zoho (confirmados en
// vivo), p.ej. "Rev./Diagnostico" (sin tilde) y "Liberación Comercial".

/**
 * `ordenVenta` se comporta como un `text` para el motor —acaba en la columna `orden_venta`— pero la
 * pantalla lo pinta como buscador contra las órdenes de venta de Books en vez de como campo libre:
 * teclear a mano el número de una OV que existe en otro sistema es la vía más corta a un dato que no
 * casa con nada.
 */
export type FieldKind = 'comment' | 'text' | 'date' | 'number' | 'checkbox' | 'select' | 'ordenVenta' | 'usuario'

/** Dónde se escribe el valor del campo al ejecutar la transición. */
export type FieldTarget = 'comment' | 'status' | 'priority' | 'classification' | 'customField' | 'derivacion' | 'ovAdicional'

export interface TransitionField {
  /** Para customField: la ETIQUETA exacta de Zoho (se mapea a su api-name en el backend). */
  key: string
  label: string
  kind: FieldKind
  required: boolean
  target: FieldTarget
  options?: string[]
  /**
   * Solo para `ordenVenta`: la etiqueta del campo de fecha que se rellena con la fecha de la OV
   * elegida, y que por eso no se teclea. Se declara aquí y no se cablea en la pantalla para que la
   * pareja viva junto a los campos y no escondida en el componente.
   */
  campoFecha?: string
  /** Solo para `derivacion`: a quién propone la etapa. Ausente = se hereda el derivado vigente. */
  porDefecto?: DerivacionPorDefecto
}

/**
 * A quién propone una etapa en la casilla «Derivado a», por encima de lo que el ticket trajera.
 *
 * Es una unión y no dos campos sueltos para que «las dos cosas a la vez» ni siquiera se pueda
 * escribir: serían dos propuestas compitiendo por la misma casilla y habría que inventar un orden
 * entre ellas, que es justo la clase de regla que nadie recuerda al añadir la tercera etapa.
 *
 * - `cargo`: el PUESTO al que le toca después. Se declara el cargo y no un id de usuario a propósito:
 *   un id ataría el Blueprint a que esa persona siga en la empresa, y el día que el puesto cambie de
 *   manos la etapa derivaría a quien ya no está.
 * - `primerDerivado`: la persona que tomó el ticket primero. Para las etapas que devuelven el trabajo
 *   a donde estaba —«Aprobación» lo saca de Comercial y lo manda de vuelta a quien lo diagnosticó—,
 *   donde el destinatario no es un puesto fijo sino alguien de la historia de ESE ticket.
 */
export type DerivacionPorDefecto =
  | { tipo: 'cargo'; cargo: import('./cargos').Cargo }
  | { tipo: 'primerDerivado' }

export interface Transition {
  id: string
  name: string
  from: string[]
  to: string
  area: string
  fields: TransitionField[]
}

// Helpers para declarar campos de forma compacta.
/**
 * El comentario de la etapa. NUNCA obligatorio, y por eso no admite parámetro: contar lo que se hizo
 * es lo que da valor al historial, pero exigirlo en las 32 etapas lo convierte en un peaje que se paga
 * escribiendo «ok» —y entonces el historial dice menos que si estuviera vacío—.
 *
 * Sin parámetro a propósito: mientras no se pueda declarar obligatorio, el asterisco de la pantalla no
 * puede mentir y el motor no necesita una guarda aparte que lo compruebe.
 */
const comment = (): TransitionField =>
  ({ key: 'comment', label: 'Comentario', kind: 'comment', required: false, target: 'comment' })
const cfDate = (label: string, required = true): TransitionField =>
  ({ key: label, label, kind: 'date', required, target: 'customField' })
const cfText = (label: string, required = true): TransitionField =>
  ({ key: label, label, kind: 'text', required, target: 'customField' })
const cfNum = (label: string, required = true): TransitionField =>
  ({ key: label, label, kind: 'number', required, target: 'customField' })
const cfCheck = (label: string, required = false): TransitionField =>
  ({ key: label, label, kind: 'checkbox', required, target: 'customField' })
const priority = (): TransitionField =>
  ({ key: 'priority', label: 'Prioridad', kind: 'select', required: false, target: 'priority', options: ['High', 'Medium', 'Low'] })
/** Buscador de órdenes de venta. `campoFecha` es la fecha que se rellena sola con la de la OV elegida. */
const cfOrdenVenta = (label: string, campoFecha: string, required = true): TransitionField =>
  ({ key: label, label, kind: 'ordenVenta', required, target: 'customField', campoFecha })

/**
 * La clave de la derivación. Es a la vez la clave en `values` y el NOMBRE DE LA COLUMNA, por eso va en
 * snake_case como `comment` o `priority` y no como una etiqueta de Zoho: no es un campo de Zoho, es
 * nuestro.
 */
export const CLAVE_DERIVACION = 'derivado_a'

/** A quién le toca el trabajo tras esta etapa. Nunca obligatoria: derivar no puede frenar un ticket. */
const derivacion = (porDefecto?: DerivacionPorDefecto): TransitionField =>
  ({ key: CLAVE_DERIVACION, label: 'Derivado a', kind: 'usuario', required: false, target: 'derivacion', porDefecto })

/**
 * `from_status` de la fila que `createTicket` escribe al nacer el ticket. No es un estado de Zoho
 * —de ahí los paréntesis—: es la marca de que esa fila de `ticket_transitions` no es una transición
 * sino la foto de la creación.
 *
 * Vive en shared porque la escribe `zoho-sync/db/repo` y la leen los dos compositores del ticket
 * (`historial.ts` y `conversacion.ts`). Con el literal repetido, cambiarlo en el escritor dejaba a
 * los dos paneles degradando la entrada de creación a transición genérica EN SILENCIO, y con los
 * tests en verde porque codificaban el mismo literal por su cuenta.
 */
export const FROM_STATUS_CREACION = '(creación)'

/**
 * El prefijo del id de un ticket nacido en la app. Los de Zoho son numéricos.
 *
 * Vive en shared por lo mismo que `FROM_STATUS_CREACION`: lo ACUÑA `zoho-sync/db/repo.createTicket` y
 * lo leen varios sitios para decidir si a Zoho se le puede preguntar por ese ticket. Con el literal
 * repetido, cambiarlo en el acuñador dejaría a los lectores dando por venido de Zoho lo que nació
 * aquí, y ningún test fallaría porque cada uno codifica el mismo literal por su cuenta.
 *
 * Es el ÚNICO guardia fiable de «nació en la app»: `managed_by_app` y `source` NO lo son —
 * `writeTransition` las pone en true en cualquier transición hecha desde Desk, también sobre un
 * ticket que vino de Zoho—, mientras que el id es inmutable y ningún UPDATE lo toca.
 */
export const PREFIJO_TICKET_APP = 'app-'

/**
 * Las dos fases tempranas del flujo, con nombre propio de la app.
 *
 * `OV asignada` es como llama Zoho a la fase en la que queda un ticket recién creado, y se conserva:
 * los tickets siguen llegando de Zoho con ese estado y renombrarlo en la base los dejaría sin
 * columna en el tablero y sin transición aplicable. Los que nacen aquí usan `Ticket creado`, que es
 * lo que la fase significa de verdad para el servicio técnico. Las dos son la MISMA fase y por eso
 * `habilitar_servicio` sale de las dos.
 *
 * `Remisión creada` es fase nueva: antes, un ticket con remisión y otro sin ella estaban en el mismo
 * sitio de la máquina de estados. Se llega a ella sola, cuando n8n confirma el documento — no hay
 * botón, así que no está en `TRANSITIONS`.
 *
 * Son constantes y no literales sueltos por lo mismo que `FROM_STATUS_CREACION`: los escribe
 * `zoho-sync/db/repo` y los leen el tablero, el motor de transiciones y el enganche de la remisión.
 */
export const STATUS_OV_ASIGNADA = 'OV asignada'
export const STATUS_TICKET_CREADO = 'Ticket creado'
export const STATUS_REMISION_CREADA = 'Remisión creada'

/**
 * La transición que dispara el desenlace de n8n, y su inversa al anular. NO están en `TRANSITIONS`
 * porque ahí solo va lo que la interfaz ofrece como botón: éstas las aplica el servidor solo.
 */
export const TRANSICION_REMISION_CONFIRMADA = { id: 'remision_confirmada', name: 'Remisión creada', from: [STATUS_TICKET_CREADO], to: STATUS_REMISION_CREADA, area: 'Servicio Técnico' }
export const TRANSICION_REMISION_RETIRADA = { id: 'remision_retirada', name: 'Remisión anulada', from: [STATUS_REMISION_CREADA], to: STATUS_TICKET_CREADO, area: 'Servicio Técnico' }

/**
 * Si en este estado todavía tiene sentido ofrecer "Crear remisión".
 *
 * Cabe en los tres orígenes de `habilitar_servicio`: la fase inicial, en sus dos nombres, y `Remisión
 * creada`, donde sirve al ticket que quedó sin entrada vigente (la anularon, o era de salida); con
 * una confirmada, `botonRemision` lo esconde. De `Ingresado` en adelante el equipo lleva tiempo
 * dentro: ahí el botón solo servía para crear un documento fuera de sitio.
 *
 * Lista de lo PERMITIDO, no de lo prohibido: con la negra, cada estado nuevo aparecería con el botón.
 */
export function puedeCrearRemisionDeEntrada(status: string): boolean {
  return status === STATUS_OV_ASIGNADA || status === STATUS_TICKET_CREADO || status === STATUS_REMISION_CREADA
}

// Transiciones 2–32 del Blueprint (la 1 es creación de ticket, se maneja aparte); F1C-09 retiró tres.
// Nota: campos de tipo "Adjuntar archivos" se omiten en v1 (subida de archivos = deuda).
// ⚠️ Esta lista NO es la que consume la app: la de verdad es `TRANSITIONS`, al final del fichero, que
// le añade la casilla de derivación a todas. Declarar los campos propios de cada etapa aquí.
const TRANSICIONES_BASE: Transition[] = [
  // Sale de las tres: las dos formas de nombrar la fase inicial —Zoho y la app— y la fase de la
  // remisión, que si no dejaría al ticket en un callejón sin salida en cuanto se le creara una.
  // Es la etapa donde se completa lo que la creación no capturó, así que pide también el `Serial`:
  // un ticket nacido en la app siempre lo trae —la creación exige equipo— pero uno venido de Zoho
  // llega sin él, y es el dato que ata el ticket a su equipo. Los campos que el ticket ya tenga se
  // enseñan bloqueados, no se vuelven a pedir.
  { id: 'habilitar_servicio', name: 'Habilitar Servicio', from: [STATUS_OV_ASIGNADA, STATUS_TICKET_CREADO, STATUS_REMISION_CREADA], to: 'Ingresado', area: 'Comercial',
    // Sin `Fecha de Cotización` ni `Fecha Orden de Compra`: en esta etapa no aportan —la cotización y
    // la compra pueden no existir todavía, igual que la orden de venta— y las dos tienen su propia
    // etapa más adelante, así que no se pierde el dato: la cotización se captura en las dos
    // transiciones de Notificación cliente, y la orden de compra en Aprobación y S. Repuestos.
    // La casilla NO es obligatoria: lo que esta etapa tiene que dejar atado es la orden de venta y el
    // serial. Además, exigirla era una promesa que no se cumplía —un `checkbox` obligatorio se guarda
    // como `false` sin error si nadie lo marca (M-2 en debt.md)—, así que el asterisco solo mentía.
    // `Fecha Orden De Venta` tampoco es obligatoria, y aquí no es una preferencia sino una trampa
    // que se cierra: el campo va BLOQUEADO porque lo rellena la OV elegida, y una OV de Books puede
    // no traer fecha. Exigiéndola, quien cayera en ese caso no podría ni avanzar ni corregirlo.
    fields: [comment(), cfOrdenVenta('Orden de Venta', 'Fecha Orden De Venta'), cfText('Serial'), cfDate('Fecha Orden De Venta', false), cfCheck('Cumple condiciones comerciales')] },
  { id: 'ingreso_a_servicio', name: 'Ingreso a Servicio', from: ['Ingresado'], to: 'Rev./Diagnostico', area: 'Servicio Técnico',
    fields: [comment(), cfText('Código Servicio'), cfDate('Fecha creación ticket'), cfDate('Fecha Remisión Entrada')] },
  { id: 'escalado_a_revision', name: 'Escalado a Revisión', from: ['Rev./Diagnostico'], to: 'Notificado', area: 'Servicio Técnico',
    fields: [comment(), priority(), cfNum('Días de entrega')] },
  { id: 'devolucion_a_correccion', name: 'Devolución a corrección', from: ['Notificado'], to: 'Rev./Diagnostico', area: 'Servicio Técnico',
    fields: [comment(), priority()] },
  { id: 'llegada_repuestos', name: 'Llegada de repuestos', from: ['En Espera de Repuestos'], to: 'En Proceso', area: 'Comercial / Compras',
    fields: [comment(), cfDate('Fecha Recepción de repuestos')] },
  { id: 'aprobacion_y_repuestos', name: 'Aprobación y S. Repuestos', from: ['Notificación cliente'], to: 'En Espera de Repuestos', area: 'Comercial / Compras',
    fields: [comment(), cfDate('Fecha Orden de Compra'), cfDate('Fecha Orden De Venta'), cfOvAdicional()] },
  { id: 'solicitud_repuestos', name: 'Solicitud repuestos', from: ['En Proceso'], to: 'Solicitado', area: 'Servicio Técnico',
    fields: [comment()] },
  { id: 'aprobacion', name: 'Aprobación', from: ['Notificación cliente'], to: 'En Proceso', area: 'Comercial',
    fields: [comment(), cfDate('Fecha Orden de Compra Final', false), cfDate('Fecha Orden de Venta Final', false), cfOvAdicional('Fecha Orden de Venta Final', false)] },
  { id: 'entrega_repuestos', name: 'Entrega de Repuestos', from: ['Solicitado'], to: 'En Proceso', area: 'Servicio Técnico',
    fields: [comment()] },
  // Retirada por F1C-09 (E-103, E-140): «Marcar como pendiente» ya no existe en servicio; «Pendiente» sólo vive en soporte remoto.
  // Esta línea y la anterior hacen de relleno a propósito: borrarlas desplazaría las citas que apuntan más abajo.
  { id: 'notif_por_garantia', name: 'Notificación por garantía', from: ['Notificación a Compras'], to: 'En Espera de Repuestos', area: 'Comercial / Compras',
    fields: [comment(), cfDate('Fecha Notificación por garantía')] },
  { id: 'notif_cliente_comercial', name: 'Notificación cliente', from: ['Notificación Comercial'], to: 'Notificación cliente', area: 'Comercial',
    fields: [comment(), cfDate('Fecha de Cotización')] },
  { id: 'notif_cliente_sku', name: 'Notificación cliente (SKU)', from: ['En espera de SKU inventario'], to: 'Notificación cliente', area: 'Comercial',
    fields: [comment(), cfDate('Fecha de Cotización')] },
  { id: 'rechazo_garantia', name: 'Rechazo de garantía', from: ['Notificación a Compras'], to: 'Notificación Comercial', area: 'Comercial / Compras',
    fields: [comment()] },
  { id: 'solicitud_sku', name: 'Solicitud SKU', from: ['Notificación Comercial'], to: 'En espera de SKU inventario', area: 'Comercial / Compras',
    fields: [comment(), cfDate('Fecha solicitud SKU')] },
  { id: 'reporte_por_garantia', name: 'Reporte por garantía', from: ['Notificado'], to: 'Notificación a Compras', area: 'Servicio Técnico',
    fields: [comment(), cfDate('Fecha Revisión Informe')] },
  { id: 'escalado_a_comercial', name: 'Escalado a comercial', from: ['Notificado'], to: 'Notificación Comercial', area: 'Servicio Técnico',
    fields: [comment(), cfNum('Días de entrega'), cfDate('Fecha Revisión Informe')] },
  { id: 'finalizacion_servicio', name: 'finalización de servicio', from: ['En Proceso'], to: 'Por Facturar', area: 'Servicio Técnico',
    fields: [comment(), cfDate('Fecha Finalización ST'), cfCheck('Equipo y/o partes listas para entrega al cliente?'), cfCheck('Archivo de trazabilidad Actualizado?'), cfCheck('Documentacion Almacenada en el Drive?'), cfCheck('H. V Actualizada?')] },
  { id: 'cal_sensores_proceso', name: 'Calibración de sensores ext.', from: ['En Proceso'], to: 'Servicio externo', area: 'Servicio Técnico',
    fields: [comment(), cfDate('Fecha Salida Servicio externo')] },
  { id: 'cal_sensores_revision', name: 'Calibración de sensores ext.', from: ['Rev./Diagnostico'], to: 'Servicio externo', area: 'Servicio Técnico',
    fields: [comment(), cfDate('Fecha Salida Servicio externo')] },
  { id: 'retorno_servicio_externo', name: 'Retorno de servicios externos', from: ['Servicio externo'], to: 'En Proceso', area: 'Servicio Técnico',
    fields: [comment(), cfDate('Fecha Entrada de servicio externo'), cfText('Conformidad')] },
  // Retirada por F1C-09 (E-106, E-140): «Servicio externo» desde Pendiente; el estado Pendiente dejó de ser de servicio.
  // «Servicio externo» queda como ida y vuelta por la calibración de sensores y el retorno de servicios externos.
  // Retirada por F1C-09 (E-106, E-140): «Servicio externo» desde Notificado, por la misma razón que la anterior.
  // Notificado conserva sus tres salidas: devolución a corrección, reporte por garantía y escalado a comercial.
  { id: 'rechazo_comercial', name: 'Rechazo', from: ['Notificación Comercial'], to: 'Por Facturar', area: 'Comercial / Servicio Técnico',
    fields: [comment()] },
  { id: 'rechazo_cliente', name: 'Rechazo', from: ['Notificación cliente'], to: 'Por Facturar', area: 'Comercial',
    fields: [comment()] },
  { id: 'rechazo_revision', name: 'Rechazo', from: ['Rev./Diagnostico'], to: 'Por Facturar', area: 'Comercial / Servicio Técnico',
    fields: [comment()] },
  { id: 'facturado', name: 'Facturado', from: ['Por Facturar'], to: 'Liberación Comercial', area: 'Comercial',
    fields: [comment(), cfDate('Fecha De Factura')] },
  { id: 'facturado_cierre', name: 'facturado y cierre de TK', from: ['Por Facturar'], to: 'Finalizado', area: 'Comercial',
    fields: [comment(), cfDate('Fecha De Factura')] },
  { id: 'diagnostico_complementario', name: 'Diagnóstico complementario', from: ['En Proceso'], to: 'Continuación del proceso', area: 'Servicio Técnico',
    fields: [comment()] },
  { id: 'liberacion_sin_factura', name: 'Liberación sin factura', from: ['Por Facturar'], to: 'Por Entregar / Sin facturar', area: 'Comercial',
    fields: [comment(), cfCheck('Liberación del ticket sin facturar', true)] },
  { id: 'entrega_sin_factura', name: 'Entrega al cliente sin factura', from: ['Por Entregar / Sin facturar'], to: 'Por Facturar', area: 'Servicio Técnico',
    fields: [comment(), cfDate('Fecha Remisión de Salida')] },
  { id: 'entrega_al_cliente', name: 'Entrega al cliente', from: ['Por Entregar'], to: 'Finalizado', area: 'Servicio Técnico',
    fields: [comment(), cfDate('Fecha Remisión de Salida')] },
  // La fecha del aviso es el hito que ABRE el bodegaje de salida (M1.10, `R08.1.md:1700`), y hasta C9
  // no existía: la columna 51 lo aproximaba con la hora del último cambio de estado, que atribuye al
  // cliente la demora en avisarle (`:1704`). Va aquí porque ésta es «la propia transición que habilita
  // la entrega» de esa misma línea.
  // OBLIGATORIA, y ése es el precio que paga Comercial: opcional, el bodegaje de salida no valdría
  // cero —sería INCALCULABLE para siempre, porque nadie vuelve a pasar por esta etapa—, que es la
  // avería de la columna 42 documentada en `reentrancia.test.ts:118-140`.
  { id: 'habilitado_para_entrega', name: 'Habilitado para entrega', from: ['Liberación Comercial'], to: 'Por Entregar', area: 'Comercial',
    fields: [comment(), cfDate('Fecha de aviso al cliente')] },
  { id: 'notif_recotizacion', name: 'Notificación re cotización', from: ['Continuación del proceso'], to: 'Notificación Comercial', area: 'Comercial',
    fields: [comment()] },
]

/**
 * Etapas que ya saben a quién le pasan el trabajo, para proponerlo en la casilla de derivación.
 *
 * Solo caben aquí las que cambian el trabajo de manos de forma predecible. Heredar al derivado
 * anterior —lo que hacen las otras 26— lo dejaría justo en manos de quien deja de tocarle.
 *
 * Es un mapa y no un campo suelto en cada entrada porque proponer es la EXCEPCIÓN: en una lista de
 * cinco entradas se ve de un vistazo cuáles pisan lo heredado, y en 31 declaraciones no.
 */
const DERIVACION_POR_DEFECTO: Record<string, DerivacionPorDefecto> = {
  // Rev./Diagnostico → Notificado: escalar una revisión es subirla al inmediato superior. En Proceso → Solicitado: al encargado de inventario, que es ese mismo cargo.
  escalado_a_revision: { tipo: 'cargo', cargo: 'Director Técnico' }, solicitud_repuestos: { tipo: 'cargo', cargo: 'Director Técnico' },
  // Notificado → Notificación Comercial: sale de Servicio Técnico y pasa a Comercial.
  escalado_a_comercial: { tipo: 'cargo', cargo: 'Coordinador Comercial' },
  // Notificación cliente → En Proceso: el cliente aprobó y el trabajo VUELVE al taller. No hay un
  // puesto fijo al que mandarlo — hay que devolvérselo a quien tomó ese ticket. Solicitado → En Proceso: entregadas las piezas, vuelve a ese mismo técnico.
  aprobacion: { tipo: 'primerDerivado' }, entrega_repuestos: { tipo: 'primerDerivado' },
}

/**
 * El catálogo real: cada etapa con sus campos MÁS la casilla de «Derivado a».
 *
 * Se añade aquí y no una a una porque el usuario la quiere en todas: si en «Habilitar Servicio» se
 * deja vacía, tiene que poder rellenarse más adelante, y «Revisión diagnóstico» ni siquiera es una
 * transición —es un estado al que se llega por `ingreso_a_servicio`—. Repetirla en las 31 entradas
 * garantizaría olvidarla en la 32.ª.
 *
 * Va la ÚLTIMA para no colarse entre los campos de negocio del formulario. Si algún día una etapa no
 * debe ofrecerla, la salida es un `Set` de excepciones aquí, nunca volver a las 31 copias.
 */
export const TRANSITIONS: Transition[] = TRANSICIONES_BASE.map((t) => ({
  ...t,
  fields: [...t.fields, derivacion(DERIVACION_POR_DEFECTO[t.id])],
}))

/** Transiciones disponibles para un ticket según su estado actual. */
export function transitionsForStatus(status: string): Transition[] {
  return TRANSITIONS.filter((t) => t.from.includes(status))
}

export function transitionById(id: string): Transition | undefined {
  return TRANSITIONS.find((t) => t.id === id)
}

/** Áreas base de permiso (las del Blueprint, descompuestas). */
export const AREAS = ['Comercial', 'Servicio Técnico', 'Compras'] as const

/** Descompone el `area` de una transición en áreas base (las compuestas usan ' / '). */
export function areasForTransition(area: string): string[] {
  return area.split(' / ').map((s) => s.trim()).filter(Boolean)
}

/**
 * Qué áreas pueden actuar sobre un ticket que está en `estado`.
 *
 * Es lo contrario de mirar el `area` de la transición que se acaba de ejecutar: ese `area` dice quién
 * la EJECUTA, no a quién le toca después. `escalado_a_comercial` es de Servicio Técnico y deja el
 * ticket en «Notificación Comercial», donde quien tiene que actuar es Comercial — avisar por el área
 * de la transición ejecutada mandaría el aviso justo a quien acaba de hacer el trabajo.
 *
 * Un estado terminal («Finalizado») devuelve lista vacía: no hay a quién pasarle el testigo.
 */
export function areasSiguientes(estado: string, transiciones: readonly Transition[] = TRANSITIONS): string[] {
  const areas = new Set<string>()
  for (const t of transiciones) {
    if (!t.from.includes(estado)) continue
    for (const a of areasForTransition(t.area)) areas.add(a)
  }
  return [...areas]
}

/**
 * Catálogo del flujo `equipo-nuevo` (F1B-06, M1.4 del maestro, RQ-EN-01). Registro SEPARADO de
 * `TRANSITIONS`: los cinco estados comparten NOMBRE con los de servicio (`Ingresado`, `En Proceso`,
 * `Notificado`, `Finalizado`) pero no el grafo — fundirlo mezclaría los dos flujos en
 * `transitionsForStatus`, `areasSiguientes` y `destinatarioDelEscalado` (`design.md` D1). El
 * enrutado de un ticket a este catálogo vive en `flujos.ts`.
 *
 * `Verificación` tiene hoy sus dos salidas en este catálogo (F1A-03): `Liberación` amplía su origen
 * a `Verificación` (D1 de `design.md`) hacia `Finalizado`, y `rechazo_verificacion` (D2) hacia
 * `Notificado`, con la misma forma que el resto: sólo `comment()` y `derivacion()` (s3).
 *
 * Área: las seis son `Servicio Técnico` por equivalencia (supuesto s2, ninguna fuente accesible la
 * contradice). Campos: sólo `comment()` — ninguna fuente da otro campo de negocio (RQ-EN-07).
 */
export const TRANSITIONS_EQUIPO_NUEVO: Transition[] = [
  { id: 'ingreso_equipo_nuevo', name: 'Ingreso equipo nuevo', from: ['Ingresado'], to: 'En Proceso', area: 'Servicio Técnico',
    fields: [comment(), derivacion()] },
  { id: 'producto_no_conforme', name: 'Producto no conforme', from: ['En Proceso'], to: 'Notificado', area: 'Servicio Técnico',
    fields: [comment(), derivacion()] },
  { id: 'analisis_y_acciones', name: 'Análisis y acciones', from: ['Notificado'], to: 'Ingresado', area: 'Servicio Técnico',
    fields: [comment(), derivacion()] },
  { id: 'verificacion', name: 'Verificación', from: ['En Proceso'], to: 'Verificación', area: 'Servicio Técnico',
    fields: [comment(), derivacion()] },
  { id: 'liberacion', name: 'Liberación', from: ['En Proceso', 'Verificación'], to: 'Finalizado', area: 'Servicio Técnico',
    fields: [comment(), { key: 'certificado_fabrica', label: 'Número del certificado de fábrica', kind: 'text', required: false, target: 'customField' }, derivacion()] },
  { id: 'rechazo_verificacion', name: 'Rechazo de verificación', from: ['Verificación'], to: 'Notificado', area: 'Servicio Técnico',
    fields: [comment(), derivacion()] },
]

/**
 * Buscador de una OV ADICIONAL (asociacion-ov-ticket, lote 3, S-10: opcional). Va detrás de `TRANSICIONES_BASE` y como
 * `function` —se eleva— porque `TRANSICIONES_BASE` se evalúa al cargar el módulo: un `const` aquí daría error
 * de zona muerta, y insertarlo junto a `cfOrdenVenta` desplazaría las 217 citas de este fichero.
 *
 * Su clave NO es una etiqueta de Zoho (`'OV adicional'` no está en `PROMOTED_COLUMNS`) y su destino es
 * `ovAdicional`, no `customField`: la OV de entrada vive en la columna `orden_venta`, y una clave que casara
 * con ella la sobrescribiría. Aquí sólo se elige la OV; `campoFecha` es opcional y NO puede ser la fecha de la OV de entrada (RQ-TS-18).
 */
function cfOvAdicional(campoFecha?: string, required = false): TransitionField {
  return { key: 'OV adicional', label: 'OV adicional', kind: 'ordenVenta', required, target: 'ovAdicional', campoFecha }
}

/**
 * Catálogo del flujo `soporte-remoto` (F1B-06, cambio 2 de 2, M1.5 del maestro, `R08.2.md:1556-1567`, RQ-SR-01).
 * Registro SEPARADO como `TRANSITIONS_EQUIPO_NUEVO`: `En Proceso`, `Pendiente` y `Finalizado` son homónimos de
 * servicio y fundirlos mezclaría los grafos en `transitionsForStatus` y `areasSiguientes` (`design.md` D1). Va
 * tras `cfOvAdicional` y no junto al de equipo nuevo para no desplazar las citas de `:365-376` (regla de mutación 4).
 *
 * Área: las cuatro son `Servicio Técnico` por equivalencia (S-1): la columna `ÁREA_RESPONSABLE` de la hoja de
 * mapeo está vacía. Campos: sólo `comment()` y `derivacion()` (S-3); ninguno lleva `modalidad` (RQ-SR-10) ni fecha.
 * El id de `soporte_pendiente` NO reutiliza `marcar_pendiente` (`:206`, retirada por F1C-09): buscar por id da un único catálogo (S-8).
 */
export const TRANSITIONS_SOPORTE_REMOTO: Transition[] = [
  { id: 'asignacion_soporte', name: 'Asignación', from: ['Solicitud Soporte'], to: 'En Proceso', area: 'Servicio Técnico',
    fields: [comment(), derivacion()] },
  { id: 'ejecutar_soporte', name: 'Ejecutar', from: ['En Proceso'], to: 'Finalizado', area: 'Servicio Técnico',
    fields: [comment(), derivacion()] },
  { id: 'soporte_pendiente', name: 'Soporte pendiente', from: ['En Proceso'], to: 'Pendiente', area: 'Servicio Técnico',
    fields: [comment(), derivacion()] },
  { id: 'continuacion_soporte', name: 'Continuación soporte', from: ['Pendiente'], to: 'En Proceso', area: 'Servicio Técnico',
    fields: [comment(), derivacion()] },
]
