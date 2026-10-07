import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { clasificarOV, estadoContrato, hoyEnZona, motivoVencido, type Contrato, MENSAJES_AMPLIACION, type AmpliacionContrato } from '@ambientalia/shared'
import { comoDiaCivil } from './calendarioCierres'; import { enTransaccion } from './transaccion'

/**
 * Acceso a `public.contratos` (registro-contrato, RQ-TC-21). Consultas sin calificar, como `ov_asociaciones`: la
 * app conecta con `search_path=desk,public` y `contratos` sólo existe en `public`. Este cambio sólo CREA contratos:
 * no hay `DELETE`. `UPDATE` sólo hay dos: la marca de ritmo y la ampliación de `fecha_fin` (al final), siempre con traza.
 */

/** Ya existe un contrato para ese lote: el `23505` del índice único `idx_contratos_lote`, traducido. */
export class ContratoDuplicadoError extends Error {
  constructor(readonly lote: string) {
    super(`El lote ${lote} ya tiene un contrato registrado`)
  }
}

export interface AltaContrato {
  clientId: string
  lote: string
  fechaInicio: string
  fechaFin: string
  creadoPor: string
}

const COLUMNAS = 'id, client_id, lote, fecha_inicio, fecha_fin, creado_por, created_at, ritmo_avisado_trimestre'

function aContrato(f: Record<string, unknown>): Contrato {
  return {
    id: Number(f.id),
    clientId: String(f.client_id),
    lote: String(f.lote),
    fechaInicio: comoDiaCivil(f.fecha_inicio),
    fechaFin: comoDiaCivil(f.fecha_fin),
    creadoPor: String(f.creado_por),
    createdAt: f.created_at instanceof Date ? f.created_at.toISOString() : String(f.created_at),
    ritmoAvisadoTrimestre: f.ritmo_avisado_trimestre == null ? null : Number(f.ritmo_avisado_trimestre),
  }
}

const filas = (rows: unknown[]): Contrato[] => (rows as Array<Record<string, unknown>>).map(aContrato)

export async function crearContrato(db: Queryable, a: AltaContrato): Promise<Contrato> {
  try {
    const r = await db.query(
      `INSERT INTO contratos (client_id, lote, fecha_inicio, fecha_fin, creado_por) VALUES ($1, $2, $3, $4, $5) RETURNING ${COLUMNAS}`,
      [a.clientId, a.lote, a.fechaInicio, a.fechaFin, a.creadoPor],
    )
    return filas(r.rows)[0]!
  } catch (e) {
    if ((e as { code?: string }).code === '23505') throw new ContratoDuplicadoError(a.lote)
    throw e
  }
}

export async function listarContratos(db: Queryable): Promise<Contrato[]> {
  return filas((await db.query(`SELECT ${COLUMNAS} FROM contratos ORDER BY id`)).rows)
}

export async function contratoPorId(db: Queryable, id: number): Promise<Contrato | null> {
  return filas((await db.query(`SELECT ${COLUMNAS} FROM contratos WHERE id = $1`, [id])).rows)[0] ?? null
}

export async function contratoDelLote(db: Queryable, lote: string): Promise<Contrato | null> {
  return filas((await db.query(`SELECT ${COLUMNAS} FROM contratos WHERE lote = $1`, [lote])).rows)[0] ?? null
}

export async function contratosDelCliente(db: Queryable, clientId: string): Promise<Contrato[]> {
  return filas((await db.query(`SELECT ${COLUMNAS} FROM contratos WHERE client_id = $1 ORDER BY id`, [clientId])).rows)
}

/*
 * Lote 2 — lo que consultan las puertas. Leen la fila y DELEGAN la decisión en `shared` (`estadoContrato`,
 * `motivoVencido`): la vigencia no se reescribe en SQL (design.md §4). `hoy` es inyectable para las pruebas; por
 * defecto, el día en la zona de negocio (S-11).
 */

/** Si el cliente tiene algún contrato vigente hoy (prioridad al nacer, RQ-TC-24). */
export async function hayContratoVigente(db: Queryable, clientId: string, hoy: string = hoyEnZona()): Promise<boolean> {
  return (await contratosDelCliente(db, clientId)).some((c) => estadoContrato(c, hoy) === 'vigente')
}

/** El motivo del `422` si `numero` es una subOV de un lote con contrato vencido, o `null` (RQ-TC-25). */
export async function motivoContratoVencido(db: Queryable, numero: unknown, hoy: string = hoyEnZona()): Promise<string | null> {
  const c = clasificarOV(numero)
  if (c.tipo !== 'subov') return null
  return motivoVencido(numero, await contratoDelLote(db, c.lote), hoy)
}

/** Un motivo por cada número vencido, en su orden; los que no lo están no aportan nada (transición). */
export async function erroresContratoVencido(db: Queryable, numeros: unknown[], hoy: string = hoyEnZona()): Promise<string[]> {
  const errores: string[] = []
  for (const n of numeros) {
    const m = await motivoContratoVencido(db, n, hoy)
    if (m) errores.push(m)
  }
  return errores
}

/*
 * Lote 3 — el ticket de contrato es DERIVADO (RQ-TC-23): se calcula al leer, no se guarda en ninguna columna (S-3) y
 * nadie lo marca a mano. No compara el cliente del contrato con el del ticket (mantenedor, S-9).
 */
export interface TicketDeContrato { deContrato: boolean; contrato?: Contrato; subOV?: string }

export async function contratoDelTicket(db: Queryable, ticketId: string, hoy: string = hoyEnZona()): Promise<TicketDeContrato> {
  const r = await db.query('SELECT numero FROM ov_asociaciones WHERE ticket_id = $1 AND liberada_at IS NULL ORDER BY id', [ticketId])
  for (const { numero } of r.rows as Array<{ numero: string }>) {
    const c = clasificarOV(numero)
    if (c.tipo !== 'subov') continue
    const contrato = await contratoDelLote(db, c.lote)
    if (contrato && estadoContrato(contrato, hoy) === 'vigente') return { deContrato: true, contrato, subOV: numero.trim() }
  }
  return { deContrato: false }
}

/*
 * ampliacion-contrato (F1B-11, RQ-TC-54) — la fecha de fin se amplía en UNA transacción: el `UPDATE` condicionado a la
 * fecha que leyó la ruta y la fila de traza en `contrato_ampliaciones` (sin `DELETE` ni clave foránea).
 */

/** La fecha de fin ya no era la que la ruta leyó: otra ampliación se coló. No se escribió nada. */
export class ContratoCambiadoError extends Error {
  constructor(readonly contratoId: number) { super(MENSAJES_AMPLIACION.carrera) }
}

export interface Ampliar { contratoId: number; fechaAnterior: string; fechaNueva: string; motivo: string | null; ampliadoPor: string }

/** Amplía y deja la traza en UNA transacción. Devuelve el contrato ya ampliado. */
export async function ampliarContrato(db: Queryable, a: Ampliar): Promise<Contrato> {
  return enTransaccion(db, async (q) => {
    const r = await q.query(
      `UPDATE contratos SET fecha_fin = $2 WHERE id = $1 AND fecha_fin = $3 RETURNING ${COLUMNAS}`,
      [a.contratoId, a.fechaNueva, a.fechaAnterior],
    )
    if (r.rows.length === 0) throw new ContratoCambiadoError(a.contratoId)
    await q.query(
      'INSERT INTO contrato_ampliaciones (contrato_id, fecha_anterior, fecha_nueva, motivo, ampliado_por) VALUES ($1, $2, $3, $4, $5)',
      [a.contratoId, a.fechaAnterior, a.fechaNueva, a.motivo, a.ampliadoPor],
    )
    return filas(r.rows)[0]!
  })
}

/** La traza de un contrato, de la más antigua a la más reciente (`ORDER BY id`). */
export async function ampliacionesDelContrato(db: Queryable, contratoId: number): Promise<AmpliacionContrato[]> {
  const r = await db.query(
    'SELECT fecha_anterior, fecha_nueva, motivo, ampliado_por, ampliado_at FROM contrato_ampliaciones WHERE contrato_id = $1 ORDER BY id',
    [contratoId],
  )
  return (r.rows as Array<Record<string, unknown>>).map((f) => ({
    fechaAnterior: comoDiaCivil(f.fecha_anterior),
    fechaNueva: comoDiaCivil(f.fecha_nueva),
    motivo: f.motivo == null ? null : String(f.motivo),
    ampliadoPor: String(f.ampliado_por),
    ampliadoAt: f.ampliado_at instanceof Date ? f.ampliado_at.toISOString() : String(f.ampliado_at),
  }))
}
