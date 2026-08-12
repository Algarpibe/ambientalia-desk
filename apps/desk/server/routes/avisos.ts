import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { listarAvisos, marcarLeidos } from '../db/avisos'
import { requireAuth } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'

/**
 * La bandeja de avisos de quien tiene la sesión abierta.
 *
 * No hay parámetro de usuario en ninguna de las dos rutas, y es deliberado: el destinatario sale
 * SIEMPRE de `req.user`. Aceptarlo del cliente permitiría leer —o vaciar— la campana de otro.
 */
export function registerAvisosRoutes(app: Express, deps: { db: Queryable }): void {
  const { db } = deps

  app.get('/api/avisos', requireAuth(db), asyncHandler(async (req, res) => {
    res.json(await listarAvisos(db, req.user!.id))
  }))

  app.post('/api/avisos/leidos', requireAuth(db), asyncHandler(async (req, res) => {
    const ids = Array.isArray((req.body as { ids?: unknown[] })?.ids) ? (req.body as { ids: unknown[] }).ids.map(String) : []
    await marcarLeidos(db, req.user!.id, ids)
    res.status(204).end()
  }))
}
