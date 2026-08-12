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
export type FieldTarget = 'comment' | 'status' | 'priority' | 'classification' | 'customField' | 'derivacion'

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
  /**
   * Solo para `derivacion`: el CARGO al que la etapa le pasa el trabajo. La pantalla lo resuelve a
   * persona y lo propone en la casilla, por encima de lo que el ticket trajera.
   *
   * Es un cargo y no un id de usuario a propósito: un id ataría el Blueprint a que esa persona siga
   * en la empresa, y el día que el puesto cambie de manos la etapa derivaría a quien ya no está.
   */
  cargoPorDefecto?: string
}

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
 * es lo que da valor al historial, pero exigirlo en las 35 etapas lo convierte en un peaje que se paga
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
  ({ key: 'priority', label: 'Prioridad', kind: 'select', required: true, target: 'priority', options: ['High', 'Medium', 'Low'] })
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
const derivacion = (cargoPorDefecto?: string): TransitionField =>
  ({ key: CLAVE_DERIVACION, label: 'Derivado a', kind: 'usuario', required: false, target: 'derivacion', cargoPorDefecto })

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
export const TRANSICION_REMISION_CONFIRMADA = { id: 'remision_confirmada', name: 'Remisión creada', area: 'Servicio Técnico' }
export const TRANSICION_REMISION_RETIRADA = { id: 'remision_retirada', name: 'Remisión anulada', area: 'Servicio Técnico' }

/**
 * Si en este estado todavía tiene sentido ofrecer "Crear remisión".
 *
 * La remisión de entrada documenta que el equipo ENTRA, así que solo cabe mientras el ticket sigue en
 * la fase inicial. En `Remisión creada` la etapa ya está hecha, y de `Ingresado` en adelante el
 * equipo lleva tiempo dentro: ahí el botón solo servía para crear un documento fuera de sitio.
 *
 * Es una lista de lo PERMITIDO y no de lo prohibido: con la lista negra, cada estado nuevo del
 * Blueprint —hay 20— aparecería con el botón por omisión, y nadie se enteraría.
 */
export function puedeCrearRemisionDeEntrada(status: string): boolean {
  return status === STATUS_OV_ASIGNADA || status === STATUS_TICKET_CREADO
}

// Transiciones 2–35 del Blueprint (la 1 es creación de ticket, se maneja aparte).
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
    fields: [comment(), cfDate('Fecha Orden de Compra'), cfDate('Fecha Orden De Venta')] },
  { id: 'solicitud_repuestos', name: 'Solicitud repuestos', from: ['En Proceso'], to: 'Solicitado', area: 'Servicio Técnico',
    fields: [comment()] },
  { id: 'aprobacion', name: 'Aprobación', from: ['Notificación cliente'], to: 'En Proceso', area: 'Comercial',
    fields: [comment(), cfDate('Fecha Orden de Compra Final', false), cfDate('Fecha Orden de Venta Final', false)] },
  { id: 'entrega_repuestos', name: 'Entrega de Repuestos', from: ['Solicitado'], to: 'En Proceso', area: 'Servicio Técnico',
    fields: [comment()] },
  { id: 'marcar_pendiente', name: 'Marcar como pendiente', from: ['En Proceso'], to: 'Pendiente', area: 'Servicio Técnico',
    fields: [comment()] },
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
  { id: 'servicio_externo_pendiente', name: 'Servicio externo', from: ['Pendiente'], to: 'Por Facturar', area: 'Servicio Técnico',
    fields: [comment()] },
  { id: 'servicio_externo_notificado', name: 'Servicio externo', from: ['Notificado'], to: 'Por Facturar', area: 'Servicio Técnico',
    fields: [comment()] },
  { id: 'rechazo_comercial', name: 'Rechazo', from: ['Notificación Comercial'], to: 'Por Facturar', area: 'Comercial / Servicio Técnico',
    fields: [comment()] },
  { id: 'rechazo_cliente', name: 'Rechazo', from: ['Notificación cliente'], to: 'Por Facturar', area: 'Comercial / Servicio Técnico',
    fields: [comment()] },
  { id: 'rechazo_revision', name: 'Rechazo', from: ['Rev./Diagnostico'], to: 'Por Facturar', area: 'Comercial / Servicio Técnico',
    fields: [comment()] },
  { id: 'facturado', name: 'Facturado', from: ['Por Facturar'], to: 'Liberación Comercial', area: 'Comercial',
    fields: [comment(), cfDate('Fecha De Factura')] },
  { id: 'facturado_cierre', name: 'facturado y cierre de TK', from: ['Por Facturar'], to: 'Finalizado', area: 'Comercial',
    fields: [comment(), cfDate('Fecha De Factura')] },
  { id: 'diagnostico_complementario', name: 'Diagnóstico complementario', from: ['Pendiente'], to: 'Continuación del proceso', area: 'Servicio Técnico',
    fields: [comment()] },
  { id: 'liberacion_sin_factura', name: 'Liberación sin factura', from: ['Por Facturar'], to: 'Por Entregar / Sin facturar', area: 'Comercial',
    fields: [comment(), cfCheck('Liberación del ticket sin facturar', true)] },
  { id: 'entrega_sin_factura', name: 'Entrega al cliente sin factura', from: ['Por Entregar / Sin facturar'], to: 'Por Facturar', area: 'Servicio Técnico',
    fields: [comment(), cfDate('Fecha Remisión de Salida')] },
  { id: 'entrega_al_cliente', name: 'Entrega al cliente', from: ['Por Entregar'], to: 'Finalizado', area: 'Servicio Técnico',
    fields: [comment(), cfDate('Fecha Remisión de Salida')] },
  { id: 'habilitado_para_entrega', name: 'Habilitado para entrega', from: ['Liberación Comercial'], to: 'Por Entregar', area: 'Comercial',
    fields: [comment()] },
  { id: 'notif_recotizacion', name: 'Notificación re cotización', from: ['Continuación del proceso'], to: 'Notificación Comercial', area: 'Comercial',
    fields: [comment()] },
]

/**
 * Etapas que ya saben a qué CARGO le pasan el trabajo, para proponerlo en la casilla de derivación.
 *
 * Solo cabe aquí la etapa que cambia el trabajo de manos de forma fija. «Escalado a comercial» lo es
 * por definición: sale de Servicio Técnico y deja el ticket en «Notificación Comercial», así que
 * heredar al técnico —lo que hacen las otras 34— lo derivaría justo a quien deja de tocarle.
 *
 * Es un mapa y no un campo suelto en cada entrada porque proponer cargo es la EXCEPCIÓN: en una lista
 * de una línea se ve de un vistazo cuáles pisan lo heredado, y en 35 declaraciones no.
 */
const CARGO_POR_DEFECTO: Record<string, string> = {
  escalado_a_comercial: 'Coordinador Comercial',
}

/**
 * El catálogo real: cada etapa con sus campos MÁS la casilla de «Derivado a».
 *
 * Se añade aquí y no una a una porque el usuario la quiere en todas: si en «Habilitar Servicio» se
 * deja vacía, tiene que poder rellenarse más adelante, y «Revisión diagnóstico» ni siquiera es una
 * transición —es un estado al que se llega por `ingreso_a_servicio`—. Repetirla en las 34 entradas
 * garantizaría olvidarla en la 35.ª.
 *
 * Va la ÚLTIMA para no colarse entre los campos de negocio del formulario. Si algún día una etapa no
 * debe ofrecerla, la salida es un `Set` de excepciones aquí, nunca volver a las 34 copias.
 */
export const TRANSITIONS: Transition[] = TRANSICIONES_BASE.map((t) => ({
  ...t,
  fields: [...t.fields, derivacion(CARGO_POR_DEFECTO[t.id])],
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
export function areasSiguientes(estado: string): string[] {
  const areas = new Set<string>()
  for (const t of TRANSITIONS) {
    if (!t.from.includes(estado)) continue
    for (const a of areasForTransition(t.area)) areas.add(a)
  }
  return [...areas]
}
