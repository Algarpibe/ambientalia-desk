import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import {
  DIAS_AVISO_RECLAMACION, ETIQUETA_ESTADO_RECLAMACION, EXCEPCIONES_POR_CARGO, diaEnZona, hoyEnZona, reclamacionVencida,
  type DiaCivil, type GarantiaProveedor,
} from '@ambientalia/shared'
import { crearAviso, destinatariosDeArea, destinatariosDeCargoPermiso } from '../db/avisos'
import { fichasSinResolverNiAvisar } from '../db/garantiaProveedor'
import { enTransaccion } from '../db/transaccion'
import { logger } from '../util/logger'

/**
 * Aviso de 60 días de una reclamación al fabricante sin resolver (F1B-13, lote 2; `derivacion-avisos` RQ-AV-19;
 * `design.md` §7). Molde de `avisoRitmoContrato.ts:25-37`.
 *
 * **Anti-ruido en una sola sentencia.** El `UPDATE` sólo toca la ficha si `aviso_60_at` sigue vacía y no está resuelta,
 * así que una segunda pasada (o una concurrente) devuelve 0 filas y no crea nada: un solo aviso por ficha (S-12).
 *
 * **Destinatarios ANTES de la marca (D-11).** Si no hay nadie ni en el cargo ni en el área, NO se marca: la pasada
 * siguiente reintenta. Marcar sin avisar dejaría la ficha callada para siempre.
 *
 * **Marca y avisos en UNA transacción, por el mismo cliente** (`enTransaccion`): si `crearAviso` falla, el `ROLLBACK`
 * revierte también la marca. Sólo de bandeja (S-9): `crearAviso` no rellena `enviado_at`.
 */

/** Marca la ficha y avisa a quien lleva el cargo (o, en su defecto, al área), todo en una transacción. `false` si no avisó. */
export async function marcarYAvisarReclamacion(db: Queryable, f: GarantiaProveedor, texto: string): Promise<boolean> {
  return enTransaccion(db, async (q) => {
    let destinatarios = await destinatariosDeCargoPermiso(q, EXCEPCIONES_POR_CARGO.crearOVIGarantia)
    if (destinatarios.length === 0) destinatarios = await destinatariosDeArea(q, 'Servicio Técnico', '')
    if (destinatarios.length === 0) {
      logger.warn({ fichaId: f.id }, `Reclamación al fabricante ${f.id}: sin destinatarios (ni el cargo ni el área Servicio Técnico), no se marca y se reintenta`)
      return false
    }
    const r = await q.query(
      "UPDATE garantia_proveedor SET aviso_60_at = now() WHERE id = $1 AND aviso_60_at IS NULL AND estado <> 'resuelta' RETURNING id",
      [f.id],
    )
    if (r.rows.length === 0) return false
    for (const dest of destinatarios) {
      await crearAviso(q, { userId: dest.id, ticketId: f.ticketId, texto })
    }
    return true
  })
}

function textoDelAviso(f: GarantiaProveedor, abiertaEl: string): string {
  const etiqueta = f.estado ? ETIQUETA_ESTADO_RECLAMACION[f.estado] : ''
  return `La reclamación al fabricante ${f.fabricante} por la orden ${f.oviNumero} lleva más de ${DIAS_AVISO_RECLAMACION} días abierta: se abrió el ${abiertaEl} y sigue «${etiqueta}».`
}

/** Evalúa las fichas sin resolver ni avisar y avisa las vencidas. Devuelve cuántas avisó. Un fallo en una no para a las demás. */
export async function avisarReclamacionesVencidas(db: Queryable, hoy: DiaCivil): Promise<number> {
  let avisadas = 0
  for (const f of await fichasSinResolverNiAvisar(db)) {
    try {
      const abiertaEl = diaEnZona(f.respondidaAt)
      if (abiertaEl == null || !reclamacionVencida(abiertaEl, hoy)) continue
      if (await marcarYAvisarReclamacion(db, f, textoDelAviso(f, abiertaEl))) avisadas++
    } catch (e) {
      logger.error({ err: e }, `avisarReclamacionesVencidas(ficha ${f.id}) falló`)
    }
  }
  return avisadas
}

let ultimoDia: DiaCivil | null = null

/**
 * La pasada periódica (`index.ts:88`, entre las alarmas y el ritmo de contratos): como mucho una evaluación por día
 * civil y proceso, y NUNCA lanza, para que un fallo aquí no impida la sincronización.
 */
export async function pasadaReclamaciones(db: Queryable, hoy: DiaCivil = hoyEnZona()): Promise<void> {
  if (ultimoDia === hoy) return
  ultimoDia = hoy
  try {
    await avisarReclamacionesVencidas(db, hoy)
  } catch (e) {
    logger.error({ err: e }, 'pasadaReclamaciones falló')
  }
}
