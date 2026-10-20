import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import { requireAuth } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'

/**
 * El estado del interruptor del control de calidad para el cliente (F1C-07, RQ-PM-37): `{ activo }` igual a
 * `config.controlCalidadLiberacion === true`, la misma lectura que usa la guarda de `executeTransition`. El cliente sólo pinta;
 * la guarda es el `409` del servidor.
 */
export function registerPermisosControlCalidadRoutes(app: Express, deps: { db: Queryable; config: AppConfig }): void {
  const { db, config } = deps

  app.get('/api/permisos/control-calidad', requireAuth(db), asyncHandler(async (_req, res) => {
    res.json({ activo: config.controlCalidadLiberacion === true })
  }))
}
