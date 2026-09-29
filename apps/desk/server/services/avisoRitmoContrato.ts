import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { getClient } from '@ambientalia/zoho-sync/books/repo'
import { estadoContrato, hoyEnZona, ritmoInsuficiente, trimestreEn, type Contrato, type DiaCivil } from '@ambientalia/shared'
import { crearAviso, destinatariosDeArea } from '../db/avisos'
import { listarContratos } from '../db/contratos'
import { informeContrato } from '../db/informeContrato'
import { enTransaccion } from '../db/transaccion'
import { logger } from '../util/logger'

/**
 * Aviso de ritmo de contrato a Comercial (registro-contrato, lote 5; `derivacion-avisos` RQ-AV-14; `design.md` §7).
 * Patrón de `avisoDiscrepanciaOV.ts:24-46`.
 *
 * **Anti-ruido en una sola sentencia.** El `UPDATE` sólo toca la fila si la marca es de un trimestre anterior, así que
 * otra evaluación en el mismo trimestre devuelve 0 filas y no crea nada, aunque la proyección haya cambiado.
 *
 * **Marca y aviso en UNA transacción, por el mismo cliente** (`enTransaccion`): si `crearAviso` falla, el `ROLLBACK`
 * revierte también la marca y la pasada siguiente vuelve a intentarlo. pg-mem no honra el `ROLLBACK`
 * (`db/transaccion.test.ts:25`), así que la prueba lo fija por estructura, no por filas.
 *
 * Sólo de bandeja: `crearAviso` no rellena `enviado_at` ni llama al canal de correo.
 */

/** Marca el trimestre `k` del contrato y avisa a Comercial, todo en una transacción. `false` si ya estaba avisado. */
export async function marcarYAvisarRitmo(db: Queryable, contratoId: number, k: number, texto: string): Promise<boolean> {
  return enTransaccion(db, async (q) => {
    const r = await q.query(
      'UPDATE contratos SET ritmo_avisado_trimestre = $2 WHERE id = $1 AND COALESCE(ritmo_avisado_trimestre, 0) < $2 RETURNING id',
      [contratoId, k],
    )
    if (r.rows.length === 0) return false
    for (const dest of await destinatariosDeArea(q, 'Comercial', '')) {
      await crearAviso(q, { userId: dest.id, ticketId: null, texto })
    }
    return true
  })
}

async function textoDelAviso(db: Queryable, c: Contrato, ejecutadas: number, creadas: number): Promise<string> {
  const cliente = (await getClient(db, c.clientId))?.name ?? c.clientId
  return `El contrato nº ${c.id} del lote ${c.lote} (${cliente}) lleva ${ejecutadas} de ${creadas} subOV ejecutadas y vence el ${c.fechaFin}: al ritmo actual no se consumirán todas. Conviene proponer la ampliación.`
}

/** Evalúa todos los contratos y avisa los que toque. Devuelve cuántos avisó. Un fallo en uno no para a los demás. */
export async function avisarRitmoContratos(db: Queryable, hoy: DiaCivil): Promise<number> {
  let avisados = 0
  for (const c of await listarContratos(db)) {
    const k = trimestreEn(c, hoy)
    if (estadoContrato(c, hoy) !== 'vigente' || k == null || k < 2 || (c.ritmoAvisadoTrimestre ?? 0) >= k) continue
    try {
      const inf = await informeContrato(db, c, hoy)
      if (!ritmoInsuficiente(c, inf.creadas, inf.ejecutadas, hoy)) continue
      if (await marcarYAvisarRitmo(db, c.id, k, await textoDelAviso(db, c, inf.ejecutadas, inf.creadas))) avisados++
    } catch (e) {
      logger.error({ err: e }, `avisarRitmoContratos(contrato ${c.id}) falló`)
    }
  }
  return avisados
}

let ultimoDia: DiaCivil | null = null

/**
 * La pasada periódica (`index.ts:88`, antes de `sync.syncRecent()`): como mucho una evaluación por día civil y
 * proceso, y NUNCA lanza, para que un fallo aquí no impida la sincronización.
 */
export async function pasadaRitmoContratos(db: Queryable, hoy: DiaCivil = hoyEnZona()): Promise<void> {
  if (ultimoDia === hoy) return
  ultimoDia = hoy
  try {
    await avisarRitmoContratos(db, hoy)
  } catch (e) {
    logger.error({ err: e }, 'pasadaRitmoContratos falló')
  }
}
