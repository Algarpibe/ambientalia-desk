import type { Express, RequestHandler } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { requireAuth, requireAdmin as requireSuperAdmin } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'; import { guardaModoSinZoho, esRecuento, type ModoSinZoho } from './modoSinZohoDesk'
import type { crearRellenoConversaciones } from '../rellenoConversaciones'

type Relleno = ReturnType<typeof crearRellenoConversaciones>

/**
 * relleno-completo-conversaciones (1G-01, RQ-ZS-29) · `RELLENO_CONVERSACIONES_HABILITADO`, que nace cerrado (`=== 'true'` en
 * `packages/zoho-sync/src/config.ts`). Sólo gobierna el lanzamiento: con `limite=0` el `POST` se limita a contar y queda libre (S-3).
 * Va en la cadena detrás del rol y delante del manejador, así que corre antes de validar `desde` y `limite`: es escalón B (permiso)
 * del orden total de F1B-10 y el contenido (C) va después. Molde: `interruptorMigracion` de `apps/desk/server/routes/admin.ts`.
 */
function interruptorRelleno(habilitado: boolean): RequestHandler {
  return (req, res, next) => {
    if (!habilitado && req.query.limite !== '0') {
      res.status(403).json({ error: 'El relleno completo de conversaciones está deshabilitado en este entorno: hace falta RELLENO_CONVERSACIONES_HABILITADO=true. El recuento (sin Zoho ni escritura) sigue disponible con limite=0.' })
      return
    }
    next()
  }
}

/** Un parámetro que viene, viene como entero no negativo; ausente es válido. */
const entero = (v: unknown): boolean => v === undefined || (typeof v === 'string' && /^\d+$/.test(v))

/**
 * `POST /api/admin/relleno-conversaciones` lanza la pasada en segundo plano y responde sin esperarla; con una en marcha devuelve su
 * estado y no lanza otra (S-2). `GET` devuelve el estado y la última pasada guardada, y NUNCA lanza, al revés que `backfill-details`. La decisión (rol e
 * interruptor) es del servidor; el cliente no participa (regla invariable 13). SOLO super administrador.
 */
export function registerRellenoConversacionesRoutes(
  app: Express, { db, relleno, habilitado, modo }: { db: Queryable; relleno: Relleno; habilitado: boolean; modo: ModoSinZoho },
): void {
  app.post('/api/admin/relleno-conversaciones', requireAuth(db), requireSuperAdmin, guardaModoSinZoho(modo, esRecuento), interruptorRelleno(habilitado), asyncHandler(async (req, res) => {
    const { desde, limite, numeros } = req.query
    if (!entero(desde) || !entero(limite) || !numerosValidos(numeros) || (numeros !== undefined && desde !== undefined)) { res.status(400).json({ error: '`desde` y `limite` sólo admiten enteros no negativos, y `numeros`, hasta 200 enteros separados por comas y nunca junto a `desde`' }); return }
    if (limite === '0') { res.json(await relleno.recuento({ desde: desde === undefined ? undefined : Number(desde), numeros: aNumeros(numeros) })); return }
    res.json(relleno.lanzar({
      desde: desde === undefined ? undefined : Number(desde),
      limite: limite === undefined ? undefined : Number(limite), numeros: aNumeros(numeros),
    }))
  }))

  app.get('/api/admin/relleno-conversaciones', requireAuth(db), requireSuperAdmin, asyncHandler(async (_req, res) => {
    res.json({ ...relleno.estado(), ultimaGuardada: await relleno.ultimaGuardada() })
  }))
}

/** `numeros` (RQ-ZS-50): ausente vale; si viene, UNA cadena de enteros separados por comas y como mucho 200 (repetido en la query llega como lista y no vale). */
function numerosValidos(v: unknown): boolean {
  return v === undefined || (typeof v === 'string' && /^\d+(,\d+)*$/.test(v) && v.split(',').length <= 200)
}

/** Los `numeros` ya validados, sin repetidos y en orden ascendente; `undefined` si no vinieron. */
function aNumeros(v: unknown): number[] | undefined {
  return typeof v === 'string' ? [...new Set(v.split(',').map(Number))].sort((a, b) => a - b) : undefined
}
