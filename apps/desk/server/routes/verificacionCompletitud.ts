import type { Express, RequestHandler } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { requireAuth, requireAdmin as requireSuperAdmin } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'
import type { crearVerificacionCompletitud } from '../completitud/verificacion'

type Verificacion = ReturnType<typeof crearVerificacionCompletitud>

const RUTA = '/api/admin/verificacion-completitud'

/**
 * verificacion-completitud (1G-03, RQ-ZS-39) · el interruptor, escalón B (permiso) del orden total de F1B-10: `VERIFICACION_COMPLETITUD_HABILITADA`
 * nace cerrada (`=== 'true'` en `packages/zoho-sync/src/config.ts`). Sólo gobierna el lanzamiento: con `limite=0` el `POST` se limita a contar y queda
 * libre (no llama a Zoho). Va en la cadena detrás del rol y delante de la validación, así que cerrado y con `limite=abc` responde 403 y no 400.
 * Molde: `interruptorAdjuntos` de `apps/desk/server/routes/rellenoAdjuntos.ts`.
 */
function interruptorVerificacion(habilitado: boolean): RequestHandler {
  return (req, res, next) => {
    if (req.query.limite === '0' || habilitado) { next(); return }
    res.status(403).json({ error: 'La verificación de completitud está deshabilitada en este entorno: hace falta VERIFICACION_COMPLETITUD_HABILITADA=true. El recuento (sin Zoho ni escritura) sigue disponible con limite=0.' })
  }
}

/** Un parámetro que viene, viene como entero no negativo; ausente es válido (escalón C, contenido). */
const entero = (v: unknown): boolean => v === undefined || (typeof v === 'string' && /^\d+$/.test(v))
const validarParametros: RequestHandler = (req, res, next) => {
  if (!entero(req.query.desde) || !entero(req.query.limite)) { res.status(400).json({ error: '`desde` y `limite` sólo admiten enteros no negativos' }); return }
  next()
}

/**
 * `POST /api/admin/verificacion-completitud` lanza la pasada en segundo plano y responde sin esperarla; con una en marcha devuelve su estado y no lanza
 * otra. `GET` devuelve sólo el estado y NUNCA lanza ni depende del interruptor. La decisión (rol, interruptor y contenido) es del servidor; el cliente
 * no participa (regla invariable 13). SOLO super administrador.
 */
export function registerVerificacionCompletitudRoutes(app: Express, { db, verificacion, habilitado }: { db: Queryable; verificacion: Verificacion; habilitado: boolean }): void {
  app.post(RUTA, requireAuth(db), requireSuperAdmin, interruptorVerificacion(habilitado), validarParametros, asyncHandler(async (req, res) => {
    const { desde, limite } = req.query
    const d = desde === undefined ? undefined : Number(desde)
    if (limite === '0') { res.json(await verificacion.recuento({ desde: d })); return }
    res.json(verificacion.lanzar({ desde: d, limite: limite === undefined ? undefined : Number(limite) }))
  }))

  app.get(RUTA, requireAuth(db), requireSuperAdmin, (_req, res) => {
    res.json(verificacion.estado())
  })
}
