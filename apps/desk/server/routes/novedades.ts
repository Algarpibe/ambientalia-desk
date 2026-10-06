import type { Express, Response } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { novedadesActivas, puedeMantenerNovedades, altaNovedadDelCuerpo, cambioNovedadDelCuerpo, type RechazoNovedad } from '@ambientalia/shared'
import { requireAuth } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'
import { listNovedades, crearNovedad, actualizarNovedad } from '../db/novedades'

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

  // F1B-04 (RQ-RE-29): mantenimiento de la lista. Lo puede quien diga `puedeMantenerNovedades` (área Servicio Técnico y
  // cargo Director Técnico; el admin pasa). Orden de F1B-10: existencia (404) → permiso (403) → contenido (422) → unicidad (409).
  // No hay DELETE a propósito: una novedad se retira con `activo = false` y sigue legible para las remisiones que la marcaron.
  const sinPermiso = 'Mantener la lista de novedades requiere el área Servicio Técnico y el cargo Director Técnico'
  const rechazar = (res: Response, r: RechazoNovedad) => { res.status(r.tipo === 'unicidad' ? 409 : 422).json({ error: r.error }) }

  app.get('/api/novedades-remision/todas', requireAuth(db), asyncHandler(async (req, res) => {
    if (!puedeMantenerNovedades(req.user!)) { res.status(403).json({ error: sinPermiso }); return }
    res.json(await listNovedades(db))
  }))

  app.post('/api/novedades-remision', requireAuth(db), asyncHandler(async (req, res) => {
    if (!puedeMantenerNovedades(req.user!)) { res.status(403).json({ error: sinPermiso }); return }
    const alta = altaNovedadDelCuerpo(req.body, await listNovedades(db))
    if (!alta.ok) { rechazar(res, alta); return }
    await crearNovedad(db, alta.novedad)
    res.status(201).json(alta.novedad)
  }))

  app.patch('/api/novedades-remision/:clave', requireAuth(db), asyncHandler(async (req, res) => {
    const catalogo = await listNovedades(db)
    const actual = catalogo.find((n) => n.clave === String(req.params.clave))
    if (!actual) { res.status(404).json({ error: 'Novedad no encontrada' }); return }
    if (!puedeMantenerNovedades(req.user!)) { res.status(403).json({ error: sinPermiso }); return }
    const cambio = cambioNovedadDelCuerpo(req.body, actual, catalogo)
    if (!cambio.ok) { rechazar(res, cambio); return }
    await actualizarNovedad(db, actual.clave, cambio.cambios)
    res.json({ ...actual, ...cambio.cambios })
  }))
}
