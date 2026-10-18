import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { facturacionVencida, hoyEnZona, type Cargo, type DiaCivil } from '@ambientalia/shared'
import { crearAviso, destinatariosDeArea, destinatariosDeCargoPermiso } from '../db/avisos'
import { ticketsPendientesDeFacturarSinAvisar, type PendienteDeFacturar } from '../db/facturacionVencida'
import { enTransaccion } from '../db/transaccion'
import { logger } from '../util/logger'

/**
 * Aviso de fecha prevista de facturación vencida (facturar-dos-ramas, F1C-02 lote 2; `derivacion-avisos` RQ-AV-23;
 * `design.md` D6). Molde de `avisoReclamacionProveedor.ts`.
 *
 * `decision/anexo-33-checkbox`: «Si esa fecha pasa y el ticket sigue en «Pendiente de facturar», el sistema avisa al
 * Director Comercial». Quién decide si venció es la regla pura `facturacionVencida`; aquí sólo se lee, se marca y se avisa.
 *
 * **Una sola vez por ticket y fecha, en una sola sentencia.** El `UPDATE` sólo toca la fila si sigue en `Pendiente de
 * facturar`, con ESA fecha prevista y sin esa marca: una segunda pasada, o una concurrente, devuelve 0 filas y no crea nada.
 *
 * **Destinatarios ANTES de la marca.** Director Comercial por `cargo_permiso`, el que nombra la decisión (no se lee de
 * `EXCEPCIONES_POR_CARGO`: vaciar esa tabla no debe dejar la alarma sin destino); si nadie lo lleva, el área Comercial; si tampoco hay nadie, NO se marca y la pasada siguiente
 * reintenta (S-7). Marca y avisos van en UNA transacción, por el mismo cliente.
 *
 * **Sólo bandeja (S-11)** y **nunca ejecuta una salida**: no hay transición, sólo la marca de la fila.
 */

const ESTADO = 'Pendiente de facturar'
const CARGO: Cargo = 'Director Comercial'

/** Marca el ticket y avisa a quien lleva el cargo (o, en su defecto, al área), todo en una transacción. `false` si no avisó. */
export async function marcarYAvisarFacturacion(db: Queryable, t: PendienteDeFacturar, texto: string): Promise<boolean> {
  return enTransaccion(db, async (q) => {
    let destinatarios = await destinatariosDeCargoPermiso(q, CARGO)
    if (destinatarios.length === 0) destinatarios = await destinatariosDeArea(q, 'Comercial', '')
    if (destinatarios.length === 0) {
      logger.warn({ ticketId: t.id }, `Facturación vencida del ticket #${t.number}: sin destinatarios (ni ${CARGO} ni el área Comercial), no se marca y se reintenta`)
      return false
    }
    const r = await q.query(
      `UPDATE tickets SET facturacion_avisada_para = $2
        WHERE id = $1 AND status = $3 AND fecha_prevista_facturacion = $2
          AND (facturacion_avisada_para IS NULL OR facturacion_avisada_para <> $2) RETURNING id`,
      [t.id, t.fechaPrevista, ESTADO],
    )
    if (r.rows.length === 0) return false
    for (const dest of destinatarios) await crearAviso(q, { userId: dest.id, ticketId: t.id, texto })
    return true
  })
}

function textoDelAviso(t: PendienteDeFacturar): string {
  return `El ticket #${t.number} sigue en «${ESTADO}»: la fecha prevista de facturación era el ${t.fechaPrevista}.`
}

/** Evalúa los candidatos y avisa los vencidos. Devuelve cuántos avisó. Un fallo en uno no para a los demás. */
export async function avisarFacturacionesVencidas(db: Queryable, hoy: DiaCivil): Promise<number> {
  let avisados = 0
  for (const t of await ticketsPendientesDeFacturarSinAvisar(db)) {
    try {
      if (!facturacionVencida(t.fechaPrevista, hoy)) continue
      if (await marcarYAvisarFacturacion(db, t, textoDelAviso(t))) avisados++
    } catch (e) {
      logger.error({ err: e }, `avisarFacturacionesVencidas(ticket ${t.id}) falló`)
    }
  }
  return avisados
}

let ultimoDia: DiaCivil | null = null

/**
 * La pasada periódica (`index.ts:88`, detrás de la de reclamaciones): como mucho una evaluación por día civil y proceso
 * (S-5), y NUNCA lanza, para que un fallo aquí no impida la sincronización.
 */
export async function pasadaFacturacionVencida(db: Queryable, hoy: DiaCivil = hoyEnZona()): Promise<void> {
  if (ultimoDia === hoy) return
  ultimoDia = hoy
  try {
    await avisarFacturacionesVencidas(db, hoy)
  } catch (e) {
    logger.error({ err: e }, 'pasadaFacturacionVencida falló')
  }
}
