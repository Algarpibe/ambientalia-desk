import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import { requireAuth } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'
import { contextoSalidasEsperas } from '../services/decisionales'

/**
 * El contexto de las salidas de las esperas para el cliente (F1C-03, RQ-PM-45): si `SALIDAS_ESPERAS` está encendido; nada más desde
 * `decision/f1c03-quien-ejecuta-salidas`. Lo calcula la MISMA función que usa la guarda de `executeTransition`, así que el panel no puede decidir distinto
 * que el servidor; sigue siendo comodidad, la guarda es el `409` y el `403`.
 */
export function registerPermisosSalidasEsperasRoutes(app: Express, deps: { db: Queryable; config: AppConfig }): void {
  const { db, config } = deps

  app.get('/api/permisos/salidas-esperas', requireAuth(db), asyncHandler(async (_req, res) => {
    res.json(contextoSalidasEsperas(config.salidasEsperas === true))
  }))
}
