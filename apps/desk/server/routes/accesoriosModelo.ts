import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { getArticuloPorId } from '@ambientalia/zoho-sync/books/repo'
import { puedeAnadirAccesorios, accesorioDelCuerpo, MENSAJES_ACCESORIOS, CLASE_ACCESORIO } from '@ambientalia/shared'
import { requireAuth } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'
import { getModelo } from '../db/catalogo'
import { crearArticulo, ArticuloRepetido } from '../db/catalogoArticulos'

/**
 * Alta de un accesorio en la lista de un modelo por el Director Técnico (`accesorios-lista-por-modelo`, F1B-04; RQ-RE-35).
 *
 * Sólo AÑADE: retirar, reordenar, copiar y borrar siguen siendo del super administrador (`routes/catalogo.ts`). Va con
 * `requireAuth` y SIN `requireSuperAdmin`: el permiso se comprueba dentro, porque el orden de F1B-10 pide el `404` ANTES del
 * `403` y un middleware correría antes que cualquier lectura. Orden: existencia (A, 404) → permiso (B, 403) → contenido (C,
 * 422 falta el artículo; 422 no está en Books) → unicidad (D, 409).
 *
 * La clase la fija el servidor y nombre y SKU salen de Books: `clase`, `nombre` y `sku` del cuerpo se ignoran.
 */
export function registerAccesoriosModeloRoutes(app: Express, deps: { db: Queryable }): void {
  const { db } = deps
  app.post('/api/catalogo/modelos/:id/accesorios', requireAuth(db), asyncHandler(async (req, res) => {
    const modeloId = String(req.params.id)
    if (!(await getModelo(db, modeloId))) { res.status(404).json({ error: MENSAJES_ACCESORIOS.modelo }); return }
    if (!puedeAnadirAccesorios(req.user!)) { res.status(403).json({ error: MENSAJES_ACCESORIOS.permiso }); return }
    const cuerpo = accesorioDelCuerpo(req.body)
    if (!cuerpo.ok) { res.status(422).json({ error: cuerpo.error }); return }
    const art = await getArticuloPorId(db, cuerpo.itemId)
    if (!art) { res.status(422).json({ error: MENSAJES_ACCESORIOS.noEnBooks }); return }
    try {
      res.status(201).json({ id: await crearArticulo(db, modeloId, { clase: CLASE_ACCESORIO, itemId: art.id, sku: art.sku || null, nombre: art.nombre }) })
    } catch (e) {
      if (e instanceof ArticuloRepetido) { res.status(409).json({ error: e.message }); return }
      throw e
    }
  }))
}
