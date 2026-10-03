import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { novedadesActivas } from '@ambientalia/shared'
import { requireAuth } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'
import { listNovedades } from '../db/novedades'

/**
 * Lista de novedades de la remisión de entrada (`recepcion-rotulacion-foto-entrada`, F1B-04; RQ-RE-22).
 *
 * Lectura con sesión: sólo las ACTIVAS, por `orden`, con sus dos marcas en camelCase (`excluyeDemas`,
 * `exigeTexto`). Va FUERA de `/api/remisiones/`: bajo ese prefijo, `/:id` se la comería.
 */
export function registerNovedadesRoutes(app: Express, deps: { db: Queryable }): void {
  const { db } = deps
  app.get('/api/novedades-remision', requireAuth(db), asyncHandler(async (_req, res) => {
    res.json(novedadesActivas(await listNovedades(db)))
  }))
}
