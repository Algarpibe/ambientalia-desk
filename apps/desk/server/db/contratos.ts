import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { clasificarOV, estadoContrato, hoyEnZona, motivoVencido, type Contrato } from '@ambientalia/shared'
import { comoDiaCivil } from './calendarioCierres'

/**
 * Acceso a `public.contratos` (registro-contrato, RQ-TC-21). Consultas sin calificar, como `ov_asociaciones`: la
 * app conecta con `search_path=desk,public` y `contratos` sólo existe en `public`. Este cambio sólo CREA contratos:
 * no hay `DELETE` ni `UPDATE` de sus datos (S-13); el único `UPDATE` será la marca de ritmo (lote 5).
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
