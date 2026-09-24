import { randomUUID } from 'node:crypto'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { fechaSolo } from '@ambientalia/zoho-sync/books/repo'
import type { EquipoLite, EquipoFull } from '@ambientalia/shared'
import type { EntradaHojaDeVida, EquipoHistorial, HistorialRemision, HistorialTicket, HistorialTransition, PasoHojaDeVida } from '@ambientalia/shared'
import { etapasDesdeHistoria, ticketDeRemision } from '@ambientalia/shared'
import { esCreacion, iso, json, porFechaDesc } from './ticketFuentes'
import { adjuntosRemision, fotosPorRemision } from './remisionAdjuntos'

const J = (v: unknown) => JSON.stringify(v ?? null)

/** Fila cruda de `equipos` con id propio (no lo genera la BD). */
export interface EquipoRow {
  id: string
  serial: string
  marca: string | null
  modelo: string | null
  tipo: string | null
  cliente_nombre: string | null
  source: string
  raw: unknown
}

/**
 * Upsert por id, sin tocar `client_id` ni `active`.
 * Sin uso en producción desde que se retiró la siembra por CSV; lo mantiene la reconciliación
 * pendiente de `cliente_nombre` → `client_id` (ver debt.md), que escribirá por esta vía.
 */
export async function upsertEquipo(db: Queryable, r: EquipoRow): Promise<void> {
  await db.query(
    `INSERT INTO equipos (id,serial,marca,modelo,tipo,cliente_nombre,source,active,raw,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8,now())
     ON CONFLICT (id) DO UPDATE SET serial=EXCLUDED.serial,marca=EXCLUDED.marca,modelo=EXCLUDED.modelo,
       tipo=EXCLUDED.tipo,cliente_nombre=EXCLUDED.cliente_nombre,source=EXCLUDED.source,raw=EXCLUDED.raw,updated_at=now()`,
    [r.id, r.serial, r.marca, r.modelo, r.tipo, r.cliente_nombre, r.source, J(r.raw)],
  )
}

function toLite(r: any): EquipoLite {
  return {
    id: r.id, serial: r.serial, marca: r.marca ?? undefined, modelo: r.modelo ?? undefined, tipo: r.tipo ?? undefined,
    clienteNombre: r.cliente_nombre ?? undefined, clientId: r.client_id ?? undefined, modeloId: r.modelo_id ?? undefined, codigoInterno: r.codigo_interno ?? undefined,
  }
}

/**
 * Busca equipos activos, opcionalmente acotados a un cliente.
 *
 * **La acotación es por `client_id` y nada más.** Hasta 2026-08-09 cruzaba además el nombre por
 * contención en los dos sentidos, porque la carga inicial dejó ~352 equipos con `client_id` NULL y el
 * cliente como texto libre del CSV ("AMBIENTALIA" vs "Ambientalia S.A.S."). Ese apaño dejó de hacer
 * falta cuando `backfill-client-id` enlazó el 96,6 %, y cobraba un precio: bastaba que dos clientes
 * compartieran un fragmento del nombre para que salieran los equipos del otro. Colar el equipo de un
 * cliente ajeno en el formulario es peor que no encontrar el propio, que tiene salida.
 *
 * Sin cliente devuelve todos: es esa salida, y también lo que mantiene alcanzables los pocos equipos
 * a los que aún les falte el `client_id`.
 */
export async function searchEquipos(db: Queryable, q: string, clientId?: string | null, limit = 20): Promise<EquipoLite[]> {
  const like = `%${q.toLowerCase()}%`
  const params: unknown[] = [like]
  let clienteFilter = ''
  if (clientId) { params.push(clientId); clienteFilter = `AND client_id = $${params.length}` }
  params.push(limit)
  const r = await db.query(
    `SELECT id,serial,marca,modelo,tipo,cliente_nombre,client_id,codigo_interno FROM equipos
     WHERE active = true AND (LOWER(serial) LIKE $1 OR LOWER(COALESCE(cliente_nombre,'')) LIKE $1
       OR LOWER(COALESCE(marca,'')) LIKE $1 OR LOWER(COALESCE(modelo,'')) LIKE $1 OR LOWER(COALESCE(tipo,'')) LIKE $1
       OR LOWER(COALESCE(codigo_interno,'')) LIKE $1)
     ${clienteFilter}
     ORDER BY serial LIMIT $${params.length}`,
    params,
  )
  return r.rows.map(toLite)
}

export async function getEquipo(db: Queryable, id: string): Promise<EquipoLite | null> {
  const r = await db.query('SELECT id,serial,marca,modelo,tipo,cliente_nombre,client_id,modelo_id,codigo_interno FROM equipos WHERE id=$1', [id])
  return r.rows[0] ? toLite(r.rows[0]) : null
}

export async function countEquipos(db: Queryable): Promise<number> {
  const r = await db.query('SELECT COUNT(*)::int AS n FROM equipos')
  return r.rows[0].n as number
}

export interface EquipoInput {
  serial: string
  marca: string | null
  modelo: string | null
  tipo: string | null
  clienteNombre: string | null
  clientId: string | null
  /** FK al catálogo maestro. Marca/modelo/tipo se derivan de él; ver `registerEquipoRoutes`. */
  modeloId: string | null
  /** F1B-02: seis campos comerciales de la hoja de vida, todos opcionales y validados en la ruta.
   *  Opcionales aquí también: los llamadores que no conocen la hoja de vida (siembra, backfill,
   *  las pruebas de este mismo fichero) no tienen por qué mandarlos. */
  fechaAdquisicion?: string | null
  fechaFacturaCompra?: string | null
  finGarantia?: string | null
  codigoInterno?: string | null
  mantenedorId?: string | null
  driveUrl?: string | null
}

function toFull(r: any): EquipoFull {
  return {
    id: r.id, serial: r.serial, marca: r.marca ?? undefined, modelo: r.modelo ?? undefined,
    tipo: r.tipo ?? undefined, clienteNombre: r.cliente_nombre ?? undefined,
    active: r.active === true, clientId: r.client_id ?? undefined, modeloId: r.modelo_id ?? undefined,
    codigoInterno: r.codigo_interno ?? undefined,
    fechaAdquisicion: fechaSolo(r.fecha_adquisicion), fechaFacturaCompra: fechaSolo(r.fecha_factura_compra),
    finGarantia: fechaSolo(r.fin_garantia), mantenedorId: r.mantenedor_id ?? undefined,
    mantenedorNombre: r.mantenedor_nombre ?? undefined, driveUrl: r.drive_url ?? undefined,
  }
}

export async function createEquipo(db: Queryable, input: EquipoInput): Promise<string> {
  const id = 'eq-' + randomUUID()
  await db.query(
    `INSERT INTO equipos (id,serial,marca,modelo,tipo,cliente_nombre,client_id,modelo_id,
       fecha_adquisicion,fecha_factura_compra,fin_garantia,codigo_interno,mantenedor_id,drive_url,
       source,active,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'app',true,now())`,
    [id, input.serial, input.marca, input.modelo, input.tipo, input.clienteNombre, input.clientId, input.modeloId,
      input.fechaAdquisicion ?? null, input.fechaFacturaCompra ?? null, input.finGarantia ?? null,
      input.codigoInterno ?? null, input.mantenedorId ?? null, input.driveUrl ?? null],
  )
  return id
}

export async function updateEquipo(db: Queryable, id: string, patch: Partial<EquipoInput>): Promise<void> {
  const sets = ['updated_at=now()']
  const params: unknown[] = [id]
  const add = (col: string, val: unknown) => { params.push(val); sets.push(`${col}=$${params.length}`) }
  if (patch.serial !== undefined) add('serial', patch.serial)
  if (patch.marca !== undefined) add('marca', patch.marca)
  if (patch.modelo !== undefined) add('modelo', patch.modelo)
  if (patch.tipo !== undefined) add('tipo', patch.tipo)
  if (patch.clienteNombre !== undefined) add('cliente_nombre', patch.clienteNombre)
  if (patch.clientId !== undefined) add('client_id', patch.clientId)
  if (patch.modeloId !== undefined) add('modelo_id', patch.modeloId)
  if (patch.fechaAdquisicion !== undefined) add('fecha_adquisicion', patch.fechaAdquisicion)
  if (patch.fechaFacturaCompra !== undefined) add('fecha_factura_compra', patch.fechaFacturaCompra)
  if (patch.finGarantia !== undefined) add('fin_garantia', patch.finGarantia)
  if (patch.codigoInterno !== undefined) add('codigo_interno', patch.codigoInterno)
  if (patch.mantenedorId !== undefined) add('mantenedor_id', patch.mantenedorId)
  if (patch.driveUrl !== undefined) add('drive_url', patch.driveUrl)
  await db.query(`UPDATE equipos SET ${sets.join(',')} WHERE id=$1`, params)
}

export async function setEquipoActive(db: Queryable, id: string, active: boolean): Promise<void> {
  await db.query('UPDATE equipos SET active=$2, updated_at=now() WHERE id=$1', [id, active])
}

/** Borrado físico (solo super administrador). Los tickets conservan sus datos de equipo denormalizados. */
export async function deleteEquipo(db: Queryable, id: string): Promise<void> {
  await db.query('DELETE FROM equipos WHERE id=$1', [id])
}

/** Columnas + JOIN comunes a `getEquipoFull` y `listEquiposManage`: sin séptima columna propia,
 *  el nombre del mantenedor se deriva de `clients` (precedente: `analisis.ts:16`). */
const SELECT_EQUIPO_FULL = `SELECT e.id,e.serial,e.marca,e.modelo,e.tipo,e.cliente_nombre,e.client_id,e.active,e.modelo_id,
       e.fecha_adquisicion,e.fecha_factura_compra,e.fin_garantia,e.codigo_interno,e.mantenedor_id,e.drive_url,
       cl.name AS mantenedor_nombre
     FROM equipos e LEFT JOIN clients cl ON e.mantenedor_id = cl.id`

export async function getEquipoFull(db: Queryable, id: string): Promise<EquipoFull | null> {
  const r = await db.query(`${SELECT_EQUIPO_FULL} WHERE e.id=$1`, [id])
  return r.rows[0] ? toFull(r.rows[0]) : null
}

export async function listEquiposManage(db: Queryable, q: string, limit = 50, offset = 0): Promise<EquipoFull[]> {
  const like = `%${q.toLowerCase()}%`
  const r = await db.query(
    `${SELECT_EQUIPO_FULL}
     WHERE LOWER(e.serial) LIKE $1 OR LOWER(COALESCE(e.cliente_nombre,'')) LIKE $1
       OR LOWER(COALESCE(e.marca,'')) LIKE $1 OR LOWER(COALESCE(e.modelo,'')) LIKE $1 OR LOWER(COALESCE(e.tipo,'')) LIKE $1
       OR LOWER(COALESCE(e.codigo_interno,'')) LIKE $1
     ORDER BY e.serial LIMIT $2 OFFSET $3`,
    [like, limit, offset],
  )
  return r.rows.map(toFull)
}

/** El serial como token delimitado por caracteres no alfanuméricos (evita falsos positivos por subcadena). */
function serialBoundaryRegex(serial: string): RegExp {
  const esc = serial.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^A-Za-z0-9])${esc}([^A-Za-z0-9]|$)`)
}

/**
 * Las remisiones del equipo, vigentes y ordenadas como el resto de la cronología.
 *
 * Empareja por `equipo_id` O por `serial`, la misma simetría que los tickets: la importación del
 * histórico resolvió `equipo_id` cruzando por serial, pero las filas que no casaron con ningún
 * equipo lo tienen NULL y el serial es su única vía. No hace falta la guarda de token del asunto —
 * eso es un apaño para los tickets de Zoho, que no traen el serial en su columna.
 *
 * Deja fuera las anuladas por la misma razón que el hilo del ticket: la hoja de vida es el relato de
 * lo que le pasó al equipo, y una anulada es un documento que un administrador retiró de en medio.
 * Donde eso consta es en HISTORIA, que es el log.
 */
async function remisionesDelEquipo(db: Queryable, id: string, serial: string): Promise<Array<{ at: string | null; remision: HistorialRemision }>> {
  const r = await db.query(
    `SELECT r.id, r.fecha, r.tipo, r.tipo_servicio, r.creado_por, r.observaciones, r.incluye, r.empresa,
            r.origen, r.estado, r.resultado, r.created_at, r.ticket_id, t.number AS ticket_number
       FROM remisiones r LEFT JOIN tickets t ON r.ticket_id = t.id
      WHERE r.anulada_at IS NULL
        AND (r.equipo_id = $1 OR (COALESCE(r.serial,'') <> '' AND r.serial = $2))`,
    [id, serial],
  )
  const filas = r.rows as Record<string, unknown>[]
  const fotos = await fotosPorRemision(db, filas.map((f) => String(f.id)))
  return filas.map((f) => {
    const idRem = String(f.id)
    const tipo = String(f.tipo ?? 'entrada')
    return {
      at: iso(f.created_at),
      remision: {
        id: idRem,
        fecha: f.fecha instanceof Date ? f.fecha.toISOString().slice(0, 10) : (f.fecha as string) ?? null,
        tipo,
        tipoServicio: (f.tipo_servicio as string) ?? null,
        tecnico: (f.creado_por as string) ?? null,
        observaciones: (f.observaciones as string) ?? null,
        // `incluye` es un jsonb: pg lo entrega parseado, pg-mem como texto.
        incluye: typeof f.incluye === 'string' ? JSON.parse(f.incluye) : ((f.incluye as string[]) ?? []),
        empresa: (f.empresa as string) ?? null,
        origen: String(f.origen ?? 'app'),
        estado: String(f.estado),
        ticketId: (f.ticket_id as string) ?? null,
        ticketNumero: f.ticket_number != null ? `#${f.ticket_number}` : null,
        adjuntos: adjuntosRemision(json(f.resultado), tipo, idRem, fotos.get(idRem) ?? []),
      },
    }
  })
}

/**
 * La hoja de vida del equipo: sus tickets y sus remisiones en UNA sola cronología.
 *
 * Se ordena por el instante de registro y no por la fecha que se muestra: la remisión enseña su día
 * de SERVICIO —un `date` sin hora— y ordenar por él dejaría el orden de dos remisiones del mismo día
 * al azar. `created_at` sirve para las dos procedencias porque el histórico ya lo trae corregido a su
 * día de servicio en la propia columna (ver el backfill de `schema.sql`).
 */
export async function getEquipoHistorial(db: Queryable, id: string): Promise<EquipoHistorial | null> {
  const equipo = await getEquipoFull(db, id)
  if (!equipo) return null
  const serial = equipo.serial
  // Históricos de Zoho: el serial vive solo en el asunto (no en serial/codigo_servicio).
  // Filtramos ampliamente en SQL y refinamos en JS con guarda de token.
  const tk = await db.query(
    `SELECT t.id, t.number, t.subject, t.status, t.status_type, t.created_time, t.codigo_servicio, t.tipo_servicio,
            t.serial AS t_serial, t.equipo_id AS t_equipo_id, g.name AS agent_name
     FROM tickets t LEFT JOIN agents g ON t.assignee_id=g.id
     WHERE t.equipo_id=$1
        OR (COALESCE(t.serial,'') <> '' AND t.serial=$2)
        OR (COALESCE(t.subject,'') <> '' AND LOWER(t.subject) LIKE LOWER($3))
     ORDER BY t.created_time DESC NULLS LAST`,
    [id, serial, `%${serial}%`],
  )
  const re = serialBoundaryRegex(serial)
  const rows = (tk.rows as any[]).filter(
    (r) => r.t_equipo_id === id || (r.t_serial && r.t_serial === serial) || re.test(r.subject ?? ''),
  )
  const ids = rows.map((r) => r.id)
  const byTicket = new Map<string, HistorialTransition[]>()
  if (ids.length) {
    const ph = ids.map((_, i) => `$${i + 1}`).join(',')
    const tr = await db.query(
      `SELECT ticket_id, transition_name, from_status, to_status, area, performed_by, performed_at
       FROM ticket_transitions WHERE ticket_id IN (${ph}) ORDER BY performed_at`,
      ids,
    )
    for (const r of tr.rows as any[]) {
      const list = byTicket.get(r.ticket_id) ?? []
      // La foto de la creación NO es una transición, y sin este caso la hoja de vida enseñaba el
      // centinela tal cual: "Enviar · (creación) → OV asignada". Se reconoce con `esCreacion` —el
      // mismo que usan los otros dos lectores— y se anulan los dos estados: el de partida no existe,
      // y el de llegada ya lo dice la propia tarjeta del ticket.
      const creacion = esCreacion(r)
      list.push({
        transitionName: creacion ? 'Ticket creado' : (r.transition_name ?? null),
        fromStatus: creacion ? null : (r.from_status ?? null),
        toStatus: creacion ? null : (r.to_status ?? null),
        area: r.area ?? null, performedBy: r.performed_by ?? null, performedAt: r.performed_at ?? null,
      })
      byTicket.set(r.ticket_id, list)
    }

    /*
     * Y las etapas que NO pasaron por Desk, reconstruidas desde la historia de Zoho.
     *
     * Sin esto, los cientos de tickets heredados salían aquí como tarjetas sin una sola etapa debajo:
     * `ticket_transitions` solo guarda lo que se hizo desde la app, así que la hoja de vida de un
     * equipo con años de servicio en Zoho no contaba nada de esos años.
     *
     * Las dos listas se JUNTAN en vez de elegir una: un ticket que empezó en Zoho y siguió en Desk
     * tiene etapas de las dos épocas, y quedarse con una perdería media historia. No se duplican
     * porque Desk no escribe sus transiciones en Zoho — lo que hay en `ticket_history` es siempre de
     * la otra época.
     */
    const hist = await db.query(
      `SELECT ticket_id, raw FROM ticket_history WHERE ticket_id IN (${ph}) ORDER BY event_time`,
      ids,
    )
    const crudosPorTicket = new Map<string, unknown[]>()
    for (const r of hist.rows as Array<Record<string, unknown>>) {
      const ticketId = String(r.ticket_id)
      const list = crudosPorTicket.get(ticketId) ?? []
      list.push(json(r.raw))
      crudosPorTicket.set(ticketId, list)
    }
    for (const [ticketId, crudos] of crudosPorTicket) {
      const deZoho = etapasDesdeHistoria(crudos)
      if (!deZoho.length) continue
      const juntas = [...(byTicket.get(ticketId) ?? []), ...deZoho]
      // De la más vieja a la más nueva, como ya venían las de Desk: sin reordenar, la mezcla saldría
      // con la época de Zoho detrás de la de Desk aunque sea anterior.
      juntas.sort((a, b) => Date.parse(a.performedAt ?? '') - Date.parse(b.performedAt ?? ''))
      byTicket.set(ticketId, juntas)
    }
  }
  const deTickets = rows.map((r) => ({
    at: iso(r.created_time),
    ticket: {
      id: r.id, number: `#${r.number}`, subject: r.subject ?? '', status: r.status, statusType: r.status_type ?? null,
      createdAt: iso(r.created_time), tecnico: r.agent_name ?? null, codigoServicio: r.codigo_servicio ?? null,
      tipoServicio: r.tipo_servicio ?? null, pasos: [],
    } as HistorialTicket,
  }))
  const deRemisiones = await remisionesDelEquipo(db, id, serial)

  /*
   * Cada remisión se mete DENTRO de la tarjeta de su ticket, al mismo nivel que las etapas.
   *
   * Para quien lee una hoja de vida, recibir el equipo es un paso del servicio igual que
   * diagnosticarlo; en tarjetas aparte parecían otra cosa de otro rango. A qué ticket va cada una lo
   * decide `ticketDeRemision`, que es donde se puede probar: casi todas lo llevan escrito, y las
   * históricas huérfanas se cuelgan de la más cercana en fecha, con `asociadaPorFecha` para dejar
   * constancia de que fue una suposición (el dato viaja aunque la pantalla ya no lo pinte).
   *
   * La que no encuentra ticket se queda suelta en la cronología: un equipo puede tener remisiones sin
   * un solo ticket en la base, y esconderlas sería peor que enseñarlas fuera de sitio.
   */
  const candidatos = deTickets.map((t) => ({ id: t.ticket.id, createdAt: t.ticket.createdAt ?? null }))
  const porTicket = new Map<string, HistorialRemision[]>()
  const sueltas: Array<{ at: string | null; remision: HistorialRemision }> = []
  for (const r of deRemisiones) {
    // Se empareja por la FECHA de la remisión —el día del servicio— y no por `created_at`, que en las
    // históricas es el día en que se importaron y no dice nada del equipo.
    const destino = ticketDeRemision({ ticketId: r.remision.ticketId, cuando: r.remision.fecha ?? r.at }, candidatos)
    if (!destino) { sueltas.push(r); continue }
    const lista = porTicket.get(destino.ticketId) ?? []
    lista.push(destino.porFecha ? { ...r.remision, asociadaPorFecha: true } : r.remision)
    porTicket.set(destino.ticketId, lista)
  }

  for (const t of deTickets) {
    const conFecha: Array<{ at: string | null; paso: PasoHojaDeVida }> = [
      ...(byTicket.get(t.ticket.id) ?? []).map((etapa) => ({ at: etapa.performedAt, paso: { clase: 'etapa' as const, etapa } })),
      ...(porTicket.get(t.ticket.id) ?? []).map((remision) => ({ at: remision.fecha, paso: { clase: 'remision' as const, remision } })),
    ]
    // De la más vieja a la más nueva, que es como se lee un historial de servicio. Las etapas ya
    // venían así; sin reordenar, las remisiones se irían todas al final.
    t.ticket.pasos = conFecha
      .sort((a, b) => Date.parse(a.at ?? '') - Date.parse(b.at ?? ''))
      .map((x) => x.paso)
  }

  const paradas: Array<{ at: string | null; entrada: EntradaHojaDeVida }> = [
    ...deTickets.map((t) => ({ at: t.at, entrada: { clase: 'ticket' as const, ticket: t.ticket } })),
    ...sueltas.map((r) => ({ at: r.at, entrada: { clase: 'remision' as const, remision: r.remision } })),
  ]
  const cronologia = paradas.sort(porFechaDesc((p) => p.at)).map((p) => p.entrada)
  return { equipo, cronologia }
}

/**
 * Busca un equipo por serial, coincidencia EXACTA tras normalizar (`trim` + minúsculas). La usa el
 * alta de «Equipo nuevo» (`services/equipoNuevo.ts`, RQ-TC-15) para reutilizar el equipo en vez de
 * duplicarlo cuando el serial ya existe.
 *
 * `equipos.serial` no es `UNIQUE` (riesgo declarado, fuera de alcance de esta fase). Con duplicados,
 * el ACTIVO más antiguo (`ORDER BY active DESC, created_at ASC`); si ninguno está activo, el
 * INACTIVO más antiguo — determinista y reversible (design.md §3, supuesto a3′).
 */
export async function getEquipoBySerial(db: Queryable, serial: string): Promise<EquipoLite | null> {
  // El recorte se hace en JS, no con `trim()` en SQL: pg-mem no lo implementa («function trim(text)
  // does not exist», verificado al ejecutar la sonda de este fichero) y el resto del repositorio ya
  // sigue esa misma convención (`routes/equipos.ts:50`, `db/catalogo.ts:227`). El serial almacenado
  // ya llega recortado por esa vía; sólo hace falta plegar mayúsculas en la comparación.
  const normalizado = serial.trim().toLowerCase()
  const r = await db.query(
    `SELECT id,serial,marca,modelo,tipo,cliente_nombre,client_id,modelo_id,codigo_interno FROM equipos
     WHERE lower(serial) = $1 ORDER BY active DESC, created_at ASC, id ASC LIMIT 1`,
    [normalizado],
  )
  return r.rows[0] ? toLite(r.rows[0]) : null
}
