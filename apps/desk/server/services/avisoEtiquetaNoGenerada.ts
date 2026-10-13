import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { etiquetaNoGenerada } from '@ambientalia/shared'
import { crearAviso, destinatariosDeArea, destinatariosDeCargoPermiso } from '../db/avisos'
import { enTransaccion } from '../db/transaccion'
import { logger } from '../util/logger'

/**
 * Aviso de «la etiqueta no se generó» (F1B-04, `rotulado-tras-enviar`; `derivacion-avisos` RQ-AV-22; `design.md` D6).
 * Molde de `apps/desk/server/services/avisoReclamacionProveedor.ts:26-44`.
 *
 * **Cuándo** lo decide `etiquetaNoGenerada` (`packages/shared/src/rotulado.ts`): desenlace `ok`/`ok_con_avisos` con `dymoId`
 * vacío, según datos de segunda mano del analista (flujo de n8n, leído el 2026-10-12; hipótesis). Nunca por el texto de los pasos.
 *
 * **Una sola vez por remisión.** La marca `aviso_sin_etiqueta_at` se pone con un `UPDATE` condicional a `IS NULL … RETURNING`
 * en la MISMA transacción que los avisos: quien no recibe la fila no crea nada (callback repetido, simultáneo o reenvío).
 *
 * **Destinatarios ANTES de la marca.** Sin ninguno NO se marca, para que el siguiente callback reintente.
 *
 * **Nunca lanza.** Todo el cuerpo va en `try`/`catch`: el callback ya guardó el resultado y no debe caerse por un aviso.
 * **Sólo bandeja (S9):** `crearAviso` es un `INSERT`; no se invoca el canal de correo.
 */

type Persona = { id: string; email: string; name: string }
export interface DatosTextoAviso { ticketNumber: number | string | null; fecha: string; serial: string | null; avisos: unknown }

/** Texto del aviso. Cada entrada de `avisos` con `paso` de texto se copia tal cual (`paso — mensaje`), sin seleccionar por el paso. */
export function textoAvisoSinEtiqueta(d: DatosTextoAviso): string {
  const inicio = d.ticketNumber != null ? `Ticket #${d.ticketNumber}: la remisión de entrada` : `La remisión de entrada del ${d.fecha}`
  const serial = d.serial != null && d.serial.trim() !== '' ? `(serial ${d.serial})` : '(sin serial registrado)'
  const entradas = (Array.isArray(d.avisos) ? d.avisos : [])
    .filter((a): a is { paso: string; mensaje?: unknown } => a != null && typeof a === 'object' && typeof (a as { paso?: unknown }).paso === 'string')
    .map((a) => (typeof a.mensaje === 'string' && a.mensaje !== '' ? `${a.paso} — ${a.mensaje}` : a.paso))
  const informado = entradas.length > 0 ? ` Lo que informó n8n: ${entradas.join('; ')}.` : ''
  return `${inicio} se generó, pero la etiqueta DYMO no quedó en su carpeta de Drive. El equipo ${serial} sigue sin etiqueta para rotular: hay que generarla a mano.${informado}`
}

/** Avisa a quien envió y al Director Técnico (respaldo: área Servicio Técnico). `true` si creó avisos; nunca lanza. */
export async function avisarEtiquetaNoGenerada(db: Queryable, remisionId: string, estado: string, resultado: unknown): Promise<boolean> {
  try {
    if (!etiquetaNoGenerada(estado, resultado)) return false
    const rem = (await db.query('SELECT ticket_id, fecha, serial, enviado_por_id FROM remisiones WHERE id = $1', [remisionId])).rows[0] as Record<string, unknown> | undefined
    if (!rem) return false
    const ticketId = (rem.ticket_id as string | null) ?? null
    const numero = ticketId ? ((await db.query('SELECT number FROM tickets WHERE id = $1', [ticketId])).rows[0] as { number?: number | string } | undefined)?.number ?? null : null
    const fecha = rem.fecha instanceof Date ? rem.fecha.toISOString().slice(0, 10) : String(rem.fecha ?? '')
    const texto = textoAvisoSinEtiqueta({ ticketNumber: numero, fecha, serial: (rem.serial as string | null) ?? null, avisos: (resultado as { avisos?: unknown } | null)?.avisos })
    return await enTransaccion(db, async (q) => {
      const porId = new Map<string, Persona>()
      if (rem.enviado_por_id) {
        for (const x of (await q.query('SELECT id, email, name FROM users WHERE id = $1 AND active = true', [String(rem.enviado_por_id)])).rows as Array<Record<string, unknown>>) {
          porId.set(String(x.id), { id: String(x.id), email: String(x.email), name: String(x.name) })
        }
      }
      const cargo = await destinatariosDeCargoPermiso(q, 'Director Técnico')
      for (const p of cargo.length > 0 ? cargo : await destinatariosDeArea(q, 'Servicio Técnico', '')) porId.set(p.id, p)
      if (porId.size === 0) {
        logger.warn({ remisionId }, `Remisión ${remisionId}: la etiqueta no se generó y no hay a quién avisar (ni quien envió, ni el cargo, ni el área Servicio Técnico); no se marca y se reintenta`)
        return false
      }
      const marcada = await q.query('UPDATE remisiones SET aviso_sin_etiqueta_at = now() WHERE id = $1 AND aviso_sin_etiqueta_at IS NULL RETURNING id', [remisionId])
      if (marcada.rows.length === 0) return false
      for (const dest of porId.values()) await crearAviso(q, { userId: dest.id, ticketId, texto })
      return true
    })
  } catch (e) {
    logger.error({ err: e }, `avisarEtiquetaNoGenerada(remisión ${remisionId}) falló`)
    return false
  }
}
