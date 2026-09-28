import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { DiscrepanciaOV } from '@ambientalia/zoho-sync/db/repo'
import { crearAviso, destinatariosDeArea } from '../db/avisos'
import { enTransaccion } from '../db/transaccion'
import { logger } from '../util/logger'

/**
 * Aviso a Comercial cuando el sincronizador detecta que Zoho trae, para un ticket con la orden de
 * venta protegida (`ov_elegida_en_app_at`), un valor distinto al que la aplicación tiene guardado
 * (parche-iv11-orden-venta, RQ-AV-13, `zoho-sync` RQ-ZS-01 modificado).
 *
 * **Anti-ruido en una sola sentencia (D4).** El `UPDATE` sólo afecta la fila cuando el valor de Zoho
 * es distinto del ya avisado (`ov_zoho_avisada`), así que una segunda pasada con el mismo valor no
 * genera un segundo aviso; `RETURNING` da 0 filas y el servicio no crea nada.
 *
 * **Todo en UNA transacción**, al contrario que `ticketService.ts:157-164` (el aviso de derivación
 * queda fuera de la transacción de `applyTransition` a propósito, porque ese paquete es de
 * `zoho-sync` y `avisos` es de la app): aquí SÍ se puede atar, porque este servicio y la tabla
 * `avisos` viven los dos en la app, sobre la misma base. Un fallo tras el `UPDATE` revierte también
 * la marca anti-ruido, así que la siguiente pasada vuelve a intentar avisar.
 *
 * **Nunca lanza**: un fallo aquí no debe tumbar la pasada del sincronizador que lo invoca.
 */
export async function avisarDiscrepanciaOV(db: Queryable, d: DiscrepanciaOV): Promise<void> {
  try {
    await enTransaccion(db, async (q) => {
      const r = await q.query(
        `UPDATE tickets SET ov_zoho_avisada = $2
           WHERE id = $1 AND ov_elegida_en_app_at IS NOT NULL
             AND COALESCE(orden_venta,'') <> $2 AND COALESCE(ov_zoho_avisada,'') <> $2
           RETURNING number, orden_venta`,
        [d.ticketId, d.ovZoho],
      )
      if (r.rows.length === 0) return // ya avisado con este mismo valor, o la fila ya no está protegida
      const fila = r.rows[0] as { number: number | null; orden_venta: string | null }
      const numero = fila.number ?? d.numero
      const ovApp = fila.orden_venta ?? d.ovApp
      const texto = `Zoho trae la orden de venta ${d.ovZoho} para el ticket #${numero}, pero la aplicación tiene ${ovApp}. Se conserva la de la aplicación: revise cuál es la correcta.`
      for (const dest of await destinatariosDeArea(q, 'Comercial', '')) {
        await crearAviso(q, { userId: dest.id, ticketId: d.ticketId, texto })
      }
    })
  } catch (e) {
    logger.error({ err: e }, `avisarDiscrepanciaOV(${d.ticketId}) falló`)
  }
}
