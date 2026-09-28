import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { listarAsociaciones, liberarAsociacion } from '@ambientalia/zoho-sync/db/ovAsociaciones'
import { listarCuarentena, saldoPorLote } from '@ambientalia/zoho-sync/books/subOV'
import { canExecuteTransition } from '@ambientalia/shared'
import { requireAuth } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'

/**
 * API de `ov_asociaciones` (asociacion-ov-ticket, lote 5; `tickets-core` RQ-TC-19 y RQ-TC-20).
 *
 * LECTURAS (ficha, cuarentena, saldo): cualquier usuario con sesión. Supuesto reversible: leer no decide
 * nada y la ficha del ticket la ve también Servicio Técnico; sólo la liberación exige Comercial.
 *
 * LIBERAR sigue la escalera de precedencia de F1B-10: A la asociación no existe (`404`) < B sin Comercial
 * (`403`) / ya liberada (`409`) < C motivo vacío tras `trim` (`422`). La fila NUNCA se borra (`RQ-TC-17`).
 * El permiso se CONSUME de `@ambientalia/shared` (`canExecuteTransition`, regla invariable 13): aquí no se
 * reescribe. El botón del cliente es comodidad; la imposición es esta.
 */
const LOTE = /^OV-\d{4}-\d{3,4}$/

export function registerOvAsociacionesRoutes(app: Express, deps: { db: Queryable }): void {
  const { db } = deps

  app.get('/api/tickets/:id/ov-asociaciones', requireAuth(db), asyncHandler(async (req, res) => {
    res.json(await listarAsociaciones(db, String(req.params.id)))
  }))

  app.get('/api/ov-asociaciones/cuarentena', requireAuth(db), asyncHandler(async (_req, res) => {
    res.json(await listarCuarentena(db))
  }))

  app.get('/api/ov-asociaciones/saldo/:lote', requireAuth(db), asyncHandler(async (req, res) => {
    const lote = String(req.params.lote)
    if (!LOTE.test(lote)) { res.status(422).json({ error: 'El lote debe tener el formato OV-AAAA-NNN' }); return }
    res.json(await saldoPorLote(db, lote))
  }))

  app.put('/api/ov-asociaciones/:id/liberar', requireAuth(db), asyncHandler(async (req, res) => {
    const user = req.user!
    const id = String(req.params.id)
    // A · existencia
    const fila = /^\d+$/.test(id) ? (await db.query('SELECT id, liberada_at FROM ov_asociaciones WHERE id = $1', [Number(id)])).rows[0] : undefined
    if (!fila) { res.status(404).json({ error: 'Asociación no encontrada' }); return }
    // B · estado y permiso
    if (!canExecuteTransition(user.areas, user.isAdmin, 'Comercial')) { res.status(403).json({ error: 'Liberar una orden de venta requiere el área Comercial' }); return }
    if (fila.liberada_at) { res.status(409).json({ error: 'La asociación ya estaba liberada' }); return }
    // C · contenido
    const motivo = typeof (req.body as { motivo?: unknown })?.motivo === 'string' ? (req.body as { motivo: string }).motivo.trim() : ''
    if (motivo === '') { res.status(422).json({ error: 'El motivo de la liberación es obligatorio' }); return }

    const liberada = await liberarAsociacion(db, Number(id), user.name, motivo)
    if (!liberada) { res.status(409).json({ error: 'La asociación ya estaba liberada' }); return }
    res.json(liberada)
  }))
}
