import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import { puedeReasignar, reasignacionDelCuerpo, MENSAJES_REASIGNACION } from '@ambientalia/shared'
import { requireAuth } from '../auth/middleware'
import { getUserById } from '../auth/users'
import { asyncHandler } from '../util/asyncHandler'
import { ticketParaReasignar, reasignar } from '../db/reasignaciones'
import { notificarReasignacion } from '../services/avisoReasignacion'

/**
 * API de la reasignación de la persona a cargo, sin cambiar de estado (reasignacion-con-motivo, F1B-05; `tickets-core`
 * RQ-TC-50 y RQ-TC-51, `permissions` RQ-PM-27, `derivacion-avisos` RQ-AV-20).
 *
 * ESCALERA de F1B-10 (A existencia < B permiso < C contenido < D unicidad), con los siete pasos de `design.md` §5; cada
 * uno tiene su prueba de POSICIÓN en `reasignacion.test.ts`. El permiso es `puedeReasignar` de `shared` y el cuerpo lo
 * valida `reasignacionDelCuerpo`: se CONSUMEN (regla invariable 13), aquí no se reescriben. El panel del cliente es
 * comodidad; la imposición es esta.
 */
export function registerReasignacionRoutes(app: Express, deps: { db: Queryable; config: AppConfig }): void {
  const { db, config } = deps

  app.post('/api/tickets/:id/reasignar', requireAuth(db), asyncHandler(async (req, res) => {
    const user = req.user!
    const t = await ticketParaReasignar(db, String(req.params.id))
    // A · existencia
    if (!t) { res.status(404).json({ error: 'Ticket no encontrado' }); return }
    // B · permiso: el área de alguna transición que sale del estado actual, o administrador
    if (!puedeReasignar(user, t)) { res.status(403).json({ error: MENSAJES_REASIGNACION.permiso }); return }
    // C · contenido: motivo < destino ausente < destino igual al actual (los tres, en este orden, los da el validador de `shared`)
    const cuerpo = reasignacionDelCuerpo(req.body, t.derivadoA)
    if (!cuerpo.ok) { res.status(422).json({ error: cuerpo.error }); return }
    // C · contenido: el destino existe y está activo (mismo criterio que la derivación del alta, `ticketService.ts`)
    const destino = await getUserById(db, cuerpo.destino)
    if (!destino?.active) { res.status(422).json({ error: MENSAJES_REASIGNACION.inexistente }); return }
    // D · carrera: el `UPDATE` sólo acierta si el ticket sigue a cargo de la persona que se leyó; si no, ni traza ni aviso
    if (!(await reasignar(db, { ticketId: t.id, de: t.derivadoA, a: destino.id, motivo: cuerpo.motivo, por: user.name }))) {
      res.status(409).json({ error: MENSAJES_REASIGNACION.carrera }); return
    }
    // Aviso al destino: DESPUÉS de la transacción y fuera de ella; el correo nunca tumba la respuesta
    await notificarReasignacion(db, config, { ticketId: t.id, ticketNumero: t.numero, actorId: user.id, actorNombre: user.name, motivo: cuerpo.motivo, destino: { id: destino.id, email: destino.email, name: destino.name } })
    res.json({ ticketId: t.id, derivadoA: destino.id })
  }))
}
