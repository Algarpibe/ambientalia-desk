import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { getClient } from '@ambientalia/zoho-sync/books/repo'
import { puedeFijarPrioridadTop5, prioridadClienteDelCuerpo } from '@ambientalia/shared'
import { requireAuth } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'
import { filaPrioridadCliente, listarTop5, fijarPrioridadCliente } from '../db/prioridadCliente'

/**
 * API de la prioridad del cliente y el Top 5 (prioridad-top5-cliente, F1B-07; `tickets-core` RQ-TC-27).
 *
 * LECTURAS (lista Top 5, prioridad de un cliente): cualquier usuario con sesión; leer no decide nada.
 *
 * ESCRITURA, escalera de F1B-10: A el cliente no existe (`404`) < B sin permiso (`403`) < C contenido (`422`).
 * El permiso es `puedeFijarPrioridadTop5` de `shared` y se CONSUME (regla invariable 13): aquí no se reescribe.
 * El botón del cliente es comodidad; la imposición es esta.
 */
export function registerPrioridadRoutes(app: Express, deps: { db: Queryable }): void {
  const { db } = deps

  app.get('/api/top5', requireAuth(db), asyncHandler(async (_req, res) => {
    res.json(await listarTop5(db))
  }))

  app.get('/api/clients/:id/prioridad', requireAuth(db), asyncHandler(async (req, res) => {
    const clientId = String(req.params.id)
    // A · existencia
    if (!(await getClient(db, clientId))) { res.status(404).json({ error: 'Cliente no encontrado' }); return }
    res.json((await filaPrioridadCliente(db, clientId)) ?? { clientId, top5: false, prioridad: null, actualizadoPor: null, actualizadoAt: null })
  }))

  app.put('/api/clients/:id/prioridad', requireAuth(db), asyncHandler(async (req, res) => {
    const user = req.user!
    const clientId = String(req.params.id)
    // A · existencia
    if (!(await getClient(db, clientId))) { res.status(404).json({ error: 'Cliente no encontrado' }); return }
    // B · permiso
    if (!puedeFijarPrioridadTop5(user)) { res.status(403).json({ error: 'Fijar la prioridad de un cliente requiere el área Comercial y el cargo Director Comercial' }); return }
    // C · contenido
    const cuerpo = prioridadClienteDelCuerpo(req.body)
    if (!cuerpo.ok) { res.status(422).json({ error: cuerpo.errors[0], errors: cuerpo.errors }); return }
    res.json(await fijarPrioridadCliente(db, { clientId, top5: cuerpo.top5, prioridad: cuerpo.prioridad, por: user.name }))
  }))
}
