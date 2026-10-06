import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { listarAsociaciones } from '@ambientalia/zoho-sync/db/ovAsociaciones'
import {
  esOVI, ORIGEN_VALOR_MANUAL,
  type DatosFicha, type EstadoReclamacion, type GarantiaProveedor, type PasoReclamacion, type RespuestaReclamacion,
} from '@ambientalia/shared'

/**
 * Acceso a `public.garantia_proveedor` (F1B-13, RQ-TC-44 a RQ-TC-48). Consultas sin calificar, como `contratos.ts`:
 * la app conecta con `search_path=desk,public` y la tabla sólo existe en `public`. Las decisiones (quién, qué
 * orden de guardas) son de la ruta y de `shared`; aquí sólo se escribe y se lee, y las dos escrituras que mueven
 * una ficha van CONDICIONADAS en SQL para que una carrera no pise el estado que otro acaba de poner.
 */

/** Ya hay una respuesta para esa asociación: el `23505` del índice único `idx_garantia_proveedor_asociacion`, traducido. */
export class ReclamacionYaRespondidaError extends Error {
  constructor(readonly asociacionId: number) {
    super('La asociación ya tiene respuesta sobre la reclamación al fabricante')
  }
}

export interface AsociacionParaReclamar { id: number; ticketId: string; numero: string; liberada: boolean }

export interface OviDelTicket {
  asociacionId: number
  numero: string
  liberada: boolean
  respuesta: GarantiaProveedor | null
  /** Vigente y sin respuesta: la única que ofrece la pregunta. */
  pendiente: boolean
}

export interface GarantiaDelTicket { fabricantePropuesto: string | null; ovis: OviDelTicket[] }

const COLUMNAS = `id, asociacion_id, ticket_id, ovi_numero, reclama, motivo_no_reclama, respondida_por, respondida_at, fabricante,
  pieza_referencia, pieza_serial, rma, valor_reclamado, origen_valor_reclamado, estado, resultado, valor_recuperado,
  enviada_at, resuelta_at, aviso_60_at`

type Fila = Record<string, unknown>

const texto = (v: unknown): string | null => (v == null ? null : String(v))
/** `numeric` llega como texto de node-postgres y como número de pg-mem: se normaliza a `number` (H-2). */
const numero = (v: unknown): number | null => (v == null ? null : Number(v))
const instante = (v: unknown): string | null => (v == null ? null : v instanceof Date ? v.toISOString() : String(v))

function aGarantia(f: Fila): GarantiaProveedor {
  return {
    id: Number(f.id),
    asociacionId: Number(f.asociacion_id),
    ticketId: String(f.ticket_id),
    oviNumero: String(f.ovi_numero),
    reclama: f.reclama === true,
    motivoNoReclama: texto(f.motivo_no_reclama) as GarantiaProveedor['motivoNoReclama'],
    respondidaPor: String(f.respondida_por),
    respondidaAt: instante(f.respondida_at)!,
    fabricante: texto(f.fabricante),
    piezaReferencia: texto(f.pieza_referencia),
    piezaSerial: texto(f.pieza_serial),
    rma: texto(f.rma),
    valorReclamado: numero(f.valor_reclamado),
    origenValorReclamado: texto(f.origen_valor_reclamado),
    estado: texto(f.estado) as GarantiaProveedor['estado'],
    resultado: texto(f.resultado) as GarantiaProveedor['resultado'],
    valorRecuperado: numero(f.valor_recuperado),
    enviadaAt: instante(f.enviada_at),
    resueltaAt: instante(f.resuelta_at),
    aviso60At: instante(f.aviso_60_at),
  }
}

const filas = (rows: unknown[]): GarantiaProveedor[] => (rows as Fila[]).map(aGarantia)

export async function asociacionPorId(db: Queryable, id: number): Promise<AsociacionParaReclamar | null> {
  const f = (await db.query('SELECT id, ticket_id, numero, liberada_at FROM ov_asociaciones WHERE id = $1', [id])).rows[0] as Fila | undefined
  return f ? { id: Number(f.id), ticketId: String(f.ticket_id), numero: String(f.numero), liberada: f.liberada_at != null } : null
}

export async function respuestaDeAsociacion(db: Queryable, asociacionId: number): Promise<GarantiaProveedor | null> {
  return filas((await db.query(`SELECT ${COLUMNAS} FROM garantia_proveedor WHERE asociacion_id = $1`, [asociacionId])).rows)[0] ?? null
}

export async function reclamacionPorId(db: Queryable, id: number): Promise<GarantiaProveedor | null> {
  return filas((await db.query(`SELECT ${COLUMNAS} FROM garantia_proveedor WHERE id = $1`, [id])).rows)[0] ?? null
}

/** Un solo `INSERT`: un «sí» abre la ficha en `abierta` (S-6) y un «no» guarda su motivo. */
export async function registrarRespuesta(
  db: Queryable,
  a: { asociacion: AsociacionParaReclamar; respuesta: RespuestaReclamacion; por: string },
): Promise<GarantiaProveedor> {
  const { asociacion, respuesta } = a
  const comunes = [asociacion.id, asociacion.ticketId, asociacion.numero, respuesta.reclama, a.por]
  try {
    const r = respuesta.reclama
      ? await db.query(
        `INSERT INTO garantia_proveedor (asociacion_id, ticket_id, ovi_numero, reclama, respondida_por, fabricante, pieza_referencia,
           pieza_serial, valor_reclamado, origen_valor_reclamado, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'abierta') RETURNING ${COLUMNAS}`,
        [...comunes, respuesta.fabricante, respuesta.piezaReferencia, respuesta.piezaSerial, respuesta.valorReclamado, ORIGEN_VALOR_MANUAL],
      )
      : await db.query(
        `INSERT INTO garantia_proveedor (asociacion_id, ticket_id, ovi_numero, reclama, respondida_por, motivo_no_reclama)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${COLUMNAS}`,
        [...comunes, respuesta.motivo],
      )
    return filas(r.rows)[0]!
  } catch (e) {
    if ((e as { code?: string }).code === '23505') throw new ReclamacionYaRespondidaError(asociacion.id)
    throw e
  }
}

/** Reemplaza los cinco datos editables; `null` si no tocó nada (no existe, es un «no» o ya está resuelta). */
export async function editarFicha(db: Queryable, id: number, d: DatosFicha): Promise<GarantiaProveedor | null> {
  const r = await db.query(
    `UPDATE garantia_proveedor SET fabricante = $2, pieza_referencia = $3, pieza_serial = $4, rma = $5, valor_reclamado = $6
     WHERE id = $1 AND reclama = true AND estado <> 'resuelta' RETURNING ${COLUMNAS}`,
    [id, d.fabricante, d.piezaReferencia, d.piezaSerial, d.rma, d.valorReclamado],
  )
  return filas(r.rows)[0] ?? null
}

/** Mueve la ficha de `desde` al destino del paso; `null` si el estado ya no es `desde` (otra persona se adelantó). */
export async function avanzarFicha(db: Queryable, id: number, desde: EstadoReclamacion, paso: PasoReclamacion): Promise<GarantiaProveedor | null> {
  const r = paso.a === 'enviada'
    ? await db.query(
      `UPDATE garantia_proveedor SET estado = 'enviada', enviada_at = now() WHERE id = $1 AND estado = $2 RETURNING ${COLUMNAS}`,
      [id, desde],
    )
    : await db.query(
      `UPDATE garantia_proveedor SET estado = 'resuelta', resultado = $3, valor_recuperado = $4, resuelta_at = now()
       WHERE id = $1 AND estado = $2 RETURNING ${COLUMNAS}`,
      [id, desde, paso.resultado, paso.valorRecuperado],
    )
  return filas(r.rows)[0] ?? null
}

/**
 * Lo que enseña el panel de un ticket. «Es OVI» se decide con `esOVI` de `shared` y no en SQL (una sola
 * implementación). Una OVI liberada SIN respuesta no sale (S-11); liberada CON respuesta sí, con su ficha intacta (S-8).
 */
export async function garantiaDelTicket(db: Queryable, ticketId: string): Promise<GarantiaDelTicket> {
  const asociaciones = (await listarAsociaciones(db, ticketId)).filter((a) => esOVI(a.numero))
  const respuestas = filas((await db.query(`SELECT ${COLUMNAS} FROM garantia_proveedor WHERE ticket_id = $1`, [ticketId])).rows)
  const marca = (await db.query('SELECT marca FROM tickets WHERE id = $1', [ticketId])).rows[0] as Fila | undefined
  const ovis: OviDelTicket[] = []
  for (const a of asociaciones) {
    const respuesta = respuestas.find((r) => r.asociacionId === Number(a.id)) ?? null
    const liberada = a.liberada_at != null
    if (liberada && respuesta === null) continue
    ovis.push({ asociacionId: Number(a.id), numero: a.numero, liberada, respuesta, pendiente: !liberada && respuesta === null })
  }
  return { fabricantePropuesto: texto(marca?.marca), ovis }
}

/** Las fichas «sí» abiertas o enviadas a las que aún no se avisó (marca `aviso_60_at` vacía): la lee el aviso de 60 días (lote 2). */
export async function fichasSinResolverNiAvisar(db: Queryable): Promise<GarantiaProveedor[]> {
  return filas((await db.query(
    `SELECT ${COLUMNAS} FROM garantia_proveedor WHERE reclama = true AND estado <> 'resuelta' AND aviso_60_at IS NULL ORDER BY id`,
  )).rows)
}
