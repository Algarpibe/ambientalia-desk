/**
 * Borrar un ticket con todo lo que cuelga de él.
 *
 * El esquema **no tiene claves foráneas**: `DELETE FROM tickets` siempre funciona y deja las filas
 * hijas huérfanas en silencio. Ya mordió dos veces a mano (`debt.md:421`), y por eso la lista de tablas
 * vive AQUÍ y en un solo sitio.
 *
 * Sustituye al runbook `docs/runbooks/borrar-tickets-de-prueba.md`, que sigue siendo la vía de rescate
 * si la aplicación no arranca.
 */
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { FilaBorrada, RastroDrive, ResumenEliminacion } from '@ambientalia/shared'
import { urlSegura } from '@ambientalia/shared'
import { nacidoEnLaApp, json } from './ticketFuentes'
import { enlaceDrive, enlaceDoc, enlaceCarpeta } from './remisionAdjuntos'

export class TicketNoEncontrado extends Error {
  constructor(public readonly ticketId: string) {
    super(`Ticket ${ticketId} no encontrado`)
    this.name = 'TicketNoEncontrado'
  }
}

export class TicketNoBorrable extends Error {
  constructor(public readonly ticketId: string) {
    super(`El ticket ${ticketId} vino de Zoho`)
    this.name = 'TicketNoBorrable'
  }
}

/**
 * Las nueve hijas más la cabecera, EN ORDEN DE BORRADO.
 *
 * `remision_fotos` va primero y es la única que no enlaza con el ticket: cuelga de la remisión. Si se
 * borrara la remisión antes, sus fotos quedarían inalcanzables para siempre — no hay `CASCADE` que las
 * recoja.
 *
 * ⚠️ `activities` NO está y no debe estar: está replicada desde el hub por `zoho_ref_pub` y borrar sus
 * filas a mano diverge la réplica. Se cuenta aparte, para que se vea que se miró.
 *
 * ⚠️ Los nombres van SIN esquema a propósito: en producción las tablas de Desk viven en `desk` y las de
 * la app en `public`, y las resuelve el `search_path`; en los tests (pg-mem) todo vive en `public`.
 * Calificarlas a mano rompería una de las dos.
 */
const TABLAS: ReadonlyArray<{ tabla: string; etiqueta: string; col: string }> = [
  { tabla: 'remision_fotos', etiqueta: 'Fotos de remisión', col: 'remision_id' },
  { tabla: 'remisiones', etiqueta: 'Remisiones', col: 'ticket_id' },
  { tabla: 'avisos', etiqueta: 'Avisos', col: 'ticket_id' },
  { tabla: 'ticket_reads', etiqueta: 'Marcas de leído', col: 'ticket_id' },
  { tabla: 'resolution_attachments', etiqueta: 'Adjuntos de resolución', col: 'ticket_id' },
  { tabla: 'attachments', etiqueta: 'Adjuntos', col: 'ticket_id' },
  { tabla: 'conversations', etiqueta: 'Conversaciones', col: 'ticket_id' },
  { tabla: 'ticket_transitions', etiqueta: 'Transiciones', col: 'ticket_id' },
  { tabla: 'ticket_history', etiqueta: 'Historial de Zoho', col: 'ticket_id' },
  { tabla: 'tickets', etiqueta: 'El ticket', col: 'id' },
]

const filas = (rows: unknown[]): Array<Record<string, unknown>> => rows as Array<Record<string, unknown>>

/** `date`: pg lo entrega como `Date`, el histórico puede traer texto. Mismo idiom que `db/remisiones.ts`. */
const fechaISO = (v: unknown): string => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? ''))

async function contar(db: Queryable, tabla: string, col: string, valores: string[]): Promise<number> {
  if (valores.length === 0) return 0
  // `IN ($1,$2,…)` y NO `= ANY($1::text[])`: pg-mem no ejecuta la segunda forma —deja las filas
  // intactas y no se queja—, así que los tests pasarían en verde sin borrar nada (ver `sweep.ts:78`).
  const ph = valores.map((_, i) => `$${i + 1}`).join(',')
  const r = await db.query(`SELECT COUNT(*)::int AS n FROM ${tabla} WHERE ${col} IN (${ph})`, valores)
  return Number((r.rows[0] as Record<string, unknown>).n)
}

/** Los punteros a Drive de una remisión, o `null` si no dejó ninguno. */
function rastroDe(remisionId: string, tipo: unknown, fecha: unknown, resultado: unknown): RastroDrive | null {
  const r = json(resultado)
  const carpetaUrl = urlSegura(r.carpetaUrl as string | null | undefined) ?? enlaceCarpeta(r.carpetaId)
  const rastro: RastroDrive = {
    remisionId,
    etiqueta: `Remisión de ${String(tipo ?? 'entrada')} del ${fechaISO(fecha)}`,
    carpetaUrl,
    documentoUrl: enlaceDoc(r.docId),
    pdfUrl: enlaceDrive(r.pdfId),
    dymoUrl: enlaceDrive(r.dymoId),
  }
  const hayAlguno = rastro.carpetaUrl || rastro.documentoUrl || rastro.pdfUrl || rastro.dymoUrl
  return hayAlguno ? rastro : null
}

/**
 * Cuenta primero, borra después.
 *
 * Recolectarlo TODO antes de tocar nada convierte el orden de borrado en un detalle de presentación en
 * vez de un campo de minas, y es lo que hace que el simulacro y la ejecución real devuelvan los mismos
 * números: los conteos salen de los `SELECT`, nunca del `DELETE` (que además no expone `rowCount` en
 * el `Queryable` de este proyecto).
 *
 * Lanza `TicketNoEncontrado` (404) y `TicketNoBorrable` (409) — las dos puertas viven aquí y no en la
 * ruta, para que ningún llamador futuro pueda saltárselas y para que el simulacro las evalúe igual.
 */
export async function eliminarTicket(
  db: Queryable,
  ticketId: string,
  opts: { dryRun?: boolean } = {},
): Promise<ResumenEliminacion> {
  const t = await db.query('SELECT id, number, subject, status, managed_by_app FROM tickets WHERE id = $1', [ticketId])
  const fila = filas(t.rows)[0]
  if (!fila) throw new TicketNoEncontrado(ticketId)
  /*
   * El guardia es el PREFIJO del id, no `managed_by_app`.
   *
   * `managed_by_app` parece decir «nació en la app» y no lo dice: `writeTransition` la pone en `true`
   * en CUALQUIER transición hecha desde Desk, también sobre un ticket de Zoho (ver `ticketFuentes.ts`).
   * Con ese guardia, un ticket de Zoho que alguien movió una vez se borraría aquí y volvería en la
   * siguiente pasada de `syncRecent`, porque la guarda de `upsertTicket` mira la fila EXISTENTE y ya no
   * habría ninguna. El prefijo `app-` sí es inmutable: solo lo acuña `createTicket`.
   */
  if (!nacidoEnLaApp(ticketId) || fila.managed_by_app !== true) throw new TicketNoBorrable(ticketId)

  const rems = await db.query('SELECT id, tipo, fecha, resultado FROM remisiones WHERE ticket_id = $1', [ticketId])
  const remisionIds: string[] = []
  const drive: RastroDrive[] = []
  let remisionesSinRastro = 0
  for (const r of filas(rems.rows)) {
    const id = String(r.id)
    remisionIds.push(id)
    const rastro = rastroDe(id, r.tipo, r.fecha, r.resultado)
    if (rastro) drive.push(rastro)
    else remisionesSinRastro++
  }

  const cuenta = new Map<string, number>()
  for (const { tabla, col } of TABLAS) {
    cuenta.set(tabla, await contar(db, tabla, col, col === 'remision_id' ? remisionIds : [ticketId]))
  }
  const filasResumen: FilaBorrada[] = TABLAS.map(({ tabla, etiqueta }) => ({
    tabla, etiqueta, borradas: cuenta.get(tabla) ?? 0,
  }))

  const resumen: ResumenEliminacion = {
    ticket: {
      id: String(fila.id),
      numero: Number(fila.number),
      asunto: (fila.subject as string | null) ?? null,
      estado: String(fila.status),
    },
    filas: filasResumen,
    total: filasResumen.reduce((n, f) => n + f.borradas, 0),
    drive,
    remisionesSinRastro,
    actividadesQueQuedan: await contar(db, 'activities', 'ticket_id', [ticketId]),
    dryRun: true,
  }
  if (opts.dryRun) return resumen

  await enTransaccion(db, async (q) => {
    for (const { tabla, col } of TABLAS) {
      const valores = col === 'remision_id' ? remisionIds : [ticketId]
      if (valores.length === 0) continue
      const ph = valores.map((_, i) => `$${i + 1}`).join(',')
      await q.query(`DELETE FROM ${tabla} WHERE ${col} IN (${ph})`, valores)
    }
  })
  return { ...resumen, dryRun: false }
}

/** Lo que hace falta de un pool para abrir una transacción. `Queryable` no lo declara. */
interface ConPool { connect?: () => Promise<{ query: Queryable['query']; release: () => void }> }

/**
 * Envuelve el barrido en una transacción cuando el `db` es un pool de verdad.
 *
 * Mismo patrón que `applyTransition` en `packages/zoho-sync/src/db/repo.ts`: sin él, una caída a mitad
 * dejaría exactamente las huérfanas que esta función existe para evitar. Se copia en vez de extraerse
 * porque el helper de allí vive en el paquete que también usa el worker, y este cambio ya es grande.
 */
async function enTransaccion(db: Queryable, fn: (q: Queryable) => Promise<void>): Promise<void> {
  const pool = db as unknown as ConPool
  if (typeof pool.connect !== 'function') { await fn(db); return }
  const cliente = await pool.connect()
  try {
    await cliente.query('BEGIN', [])
    await fn(cliente as unknown as Queryable)
    await cliente.query('COMMIT', [])
  } catch (e) {
    await cliente.query('ROLLBACK', []).catch(() => {})
    throw e
  } finally {
    cliente.release()
  }
}
