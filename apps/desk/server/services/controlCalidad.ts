import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import {
  esCargo, esFirmaControlCalidad, quedaHabilitadoLibre, ID_ENVIO_CC, veredictoFirma, exigeGasPatron, erroresContenidoControlCalidad, hoyEnZona, ID_APROBACION_CC,
  type ContextoFirma, type FilaDeTraza, type Transition, type UsuarioParaFirma, type VeredictoFirma,
} from '@ambientalia/shared'
import { leerContextoGas } from '../db/gasesPatron'
import { crearAviso, destinatariosAdministradores } from '../db/avisos'
import { logger } from '../util/logger'

/**
 * Lecturas de la firma del control de calidad (F1C-07, lote 2b; `permissions` RQ-PM-33, RQ-PM-34; `transitions-st` RQ-TS-48).
 * Molde de `services/decisionales.ts`: la regla es pura y vive en `@ambientalia/shared`; aquí sólo se leen sus tres entradas
 * (usuarios ACTIVOS, `derivado_a` del ticket y la traza) y SÓLO para `aprobacion_control_calidad` y `rechazo_control_calidad`:
 * en las otras 46 transiciones las dos funciones salen sin consultar nada. Consultas sin calificar, como `db/gasesPatron.ts`.
 */
export async function contextoFirma(db: Queryable, ticketId: string): Promise<ContextoFirma> {
  const usuarios = await db.query('SELECT id, name, is_admin, cargo_permiso FROM users WHERE active = true')
  const ticket = await db.query('SELECT derivado_a FROM tickets WHERE id = $1', [ticketId])
  const traza = await db.query('SELECT transition_id, performed_by, performed_by_id FROM ticket_transitions WHERE ticket_id = $1', [ticketId])
  return {
    usuariosActivos: usuarios.rows.map((u): UsuarioParaFirma => ({ id: String(u.id), name: String(u.name ?? ''), isAdmin: u.is_admin === true, cargoPermiso: esCargo(u.cargo_permiso) ? u.cargo_permiso : null })),
    derivadoA: (ticket.rows[0]?.derivado_a as string | null | undefined) ?? null,
    traza: traza.rows.map((f): FilaDeTraza => ({ transitionId: f.transition_id ?? null, performedBy: f.performed_by ?? null, performedById: f.performed_by_id ?? null })),
  }
}

/** El veredicto de firma de quien ejecuta; `null` fuera de las dos de firma, sin consultar nada. */
export async function veredictoFirmaControlCalidad(db: Queryable, t: Transition, ticketId: string, user: { id?: string; name?: string; isAdmin: boolean }): Promise<VeredictoFirma | null> {
  if (!esFirmaControlCalidad(t.id)) return null
  return veredictoFirma({ id: user.id ?? '', name: user.name ?? '', isAdmin: user.isAdmin }, await contextoFirma(db, ticketId))
}

/** Los errores de contenido de las dos de firma (escalón C); el gas sólo se lee en la aprobación. Fuera de ellas, `[]` sin consultar. */
export async function erroresControlCalidad(db: Queryable, t: Transition, row: { equipo_id?: string | null }, values: Record<string, unknown>, v: VeredictoFirma | null): Promise<string[]> {
  if (!esFirmaControlCalidad(t.id)) return []
  let gasExigido = false
  if (t.id === ID_APROBACION_CC) {
    const { compuestoEquipo, gases } = await leerContextoGas(db, row.equipo_id)
    gasExigido = exigeGasPatron(t.id, compuestoEquipo, gases, hoyEnZona())
  }
  return erroresContenidoControlCalidad({ transitionId: t.id, values, via: v?.puede ? v.via : null, gasExigido })
}

/**
 * Aviso de bandeja a los administradores ACTIVOS cuando el ticket llega a `Control de calidad` y ya no queda un habilitado que no
 * haya intervenido (F1C-07, lote 2c; RQ-AV-24, S-12, S-13, S-18). Sólo actúa en `envio_control_calidad`; relee el contexto, ya con
 * la fila del envío. No va al Director Técnico, ni al actor, ni por correo, y nunca lanza: si falla, se registra y el envío sigue.
 */
export async function avisarSinFirmanteLibre(db: Queryable, t: Transition, ticketId: string, numero: number, actorId: string): Promise<void> {
  if (t.id !== ID_ENVIO_CC) return
  try {
    if (quedaHabilitadoLibre(await contextoFirma(db, ticketId))) return
    const texto = `El ticket #${numero} está en «Control de calidad» y no queda nadie que pueda firmarlo: firma un administrador, con motivo.`
    for (const d of await destinatariosAdministradores(db, actorId)) await crearAviso(db, { userId: d.id, ticketId, texto })
  } catch (e) {
    logger.warn({ err: e, ticketId }, 'no se pudo avisar a los administradores del control de calidad sin firmante')
  }
}
