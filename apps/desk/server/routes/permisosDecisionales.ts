import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import { requireAuth } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'
import { contextoDecisionales } from '../services/decisionales'

/**
 * El contexto de las Decisionales por cargo para el cliente (F1C-05, RQ-PM-31): si `DECISIONALES_POR_CARGO` está encendido
 * y si el Coordinador Técnico está vacante. Lo calcula la misma función que usa la guarda de `executeTransition`, así que
 * el filtro de botones no puede decidir distinto que el servidor; sigue siendo comodidad, la guarda es el `403`.
 */
export function registerPermisosDecisionalesRoutes(app: Express, deps: { db: Queryable; config: AppConfig }): void {
  const { db, config } = deps

  app.get('/api/permisos/decisionales', requireAuth(db), asyncHandler(async (_req, res) => {
    res.json(await contextoDecisionales(db, config.decisionalesPorCargo === true))
  }))
}
