import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import { crearAviso, marcarEnviados } from '../db/avisos'
import { dispararAvisos, type AvisoParaEnviar } from '../avisosWebhook'
import { logger } from '../util/logger'
import type { AvisoNuevo } from './avisoDerivacion'

/**
 * El aviso al destino de una reasignación (RQ-AV-20). Función pura y aparte de la escritura, como `avisoDerivacion`:
 * un aviso de más no falla nada, solo convierte la campana en ruido.
 *
 * - **Reasignarse a uno mismo** → nada (S-5). Ya lo sabe: acaba de hacerlo.
 * - No hay otra supresión: la persona de origen no se avisa porque esta función ni la recibe, y el destino distinto
 *   del actor siempre recibe aviso, aunque el ticket ya fuera suyo en otro momento.
 */
export function avisoReasignacion(c: { nuevo: string; actorId: string; actorNombre: string; ticketNumero: number; motivo: string }): AvisoNuevo | null {
  if (c.nuevo === c.actorId) return null
  return { userId: c.nuevo, texto: `${c.actorNombre} te reasignó el ticket #${c.ticketNumero}. Motivo: ${c.motivo}` }
}

/**
 * Escribe el aviso de la reasignación y lo manda por correo, DESPUÉS de la transacción y fuera de ella: `avisos` es de la
 * app y lo que importa —`derivado_a` y su traza— ya está escrito (RQ-AV-20). Misma secuencia que el aviso de derivación de
 * `ticketService.ts`: crear la fila, mandar UN elemento con `conCopia` (S-7; el administrador que sea además el destino
 * no recibe dos, lo evita `dispararAvisos`) y sellar solo si salió; si no, `enviado_at` queda en NULL, que es la cola de
 * reintento. El correo nunca lanza. Límite declarado: si falla el `INSERT` del aviso, esto lanza con la reasignación ya hecha.
 */
export async function notificarReasignacion(
  db: Queryable,
  config: AppConfig,
  c: { ticketId: string; ticketNumero: number; actorId: string; actorNombre: string; motivo: string; destino: { id: string; email: string; name: string } },
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const aviso = avisoReasignacion({ nuevo: c.destino.id, actorId: c.actorId, actorNombre: c.actorNombre, ticketNumero: c.ticketNumero, motivo: c.motivo })
  if (!aviso) return
  const avisoId = await crearAviso(db, { userId: aviso.userId, ticketId: c.ticketId, texto: aviso.texto })
  const porCorreo: AvisoParaEnviar[] = [{ id: avisoId, email: c.destino.email, nombre: c.destino.name, texto: aviso.texto, ticketNumero: c.ticketNumero, conCopia: true }]
  const r = await dispararAvisos(config, porCorreo, fetchImpl)
  if (r.disparado) await marcarEnviados(db, [avisoId])
  else logger.warn({ motivo: r.motivo, ticketId: c.ticketId, avisos: porCorreo.length }, 'no se pudo mandar el aviso de reasignación por correo')
}
