import type { Express, RequestHandler } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { requireAuth, requireAdmin as requireSuperAdmin } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'
import type { crearRellenoAdjuntos } from '../adjuntos/rellenoAdjuntos'

type Relleno = ReturnType<typeof crearRellenoAdjuntos>

/**
 * persistencia-adjuntos (1G-02, RQ-ZS-32) · dos guardas, las dos escalón B (permiso) del orden total de F1B-10: `RELLENO_ADJUNTOS_HABILITADO`,
 * que nace cerrado (`=== 'true'` en `packages/zoho-sync/src/config.ts`), y un directorio válido en `ADJUNTOS_DIR` (absoluto y fuera de `dist/`,
 * ya resuelto por `dirAdjuntos`; aquí llega sólo como `hayDir`). Sólo gobiernan el lanzamiento: con `limite=0` el `POST` se limita a contar
 * y queda libre de las dos (S-3). Van en la cadena detrás del rol y delante del manejador, así que corren antes de validar `desde` y `limite`
 * (el contenido, C, va después). El interruptor va primero: si está cerrado, sobra hablar del directorio. Molde: `interruptorRelleno` de
 * `apps/desk/server/routes/rellenoConversaciones.ts`.
 */
function interruptorAdjuntos(habilitado: boolean, hayDir: boolean): RequestHandler {
  return (req, res, next) => {
    if (req.query.limite === '0') { next(); return }
    if (!habilitado) {
      res.status(403).json({ error: 'El relleno de adjuntos está deshabilitado en este entorno: hace falta RELLENO_ADJUNTOS_HABILITADO=true. El recuento (sin Zoho ni escritura) sigue disponible con limite=0.' })
      return
    }
    if (!hayDir) {
      res.status(403).json({ error: 'El relleno de adjuntos no tiene dónde escribir: hace falta ADJUNTOS_DIR con una ruta absoluta fuera de dist/. El recuento (sin Zoho ni escritura) sigue disponible con limite=0.' })
      return
    }
    next()
  }
}

/** Un parámetro que viene, viene como entero no negativo; ausente es válido. */
const entero = (v: unknown): boolean => v === undefined || (typeof v === 'string' && /^\d+$/.test(v))

/**
 * `POST /api/admin/relleno-adjuntos` lanza la pasada en segundo plano y responde sin esperarla; con una en marcha devuelve su estado y no
 * lanza otra (S-2). `GET` devuelve sólo el estado y NUNCA lanza ni depende de los interruptores. La decisión (rol, interruptor, directorio y
 * contenido) es del servidor; el cliente no participa (regla invariable 13). SOLO super administrador.
 */
export function registerRellenoAdjuntosRoutes(
  app: Express, { db, relleno, habilitado, hayDir }: { db: Queryable; relleno: Relleno; habilitado: boolean; hayDir: boolean },
): void {
  app.post('/api/admin/relleno-adjuntos', requireAuth(db), requireSuperAdmin, interruptorAdjuntos(habilitado, hayDir), asyncHandler(async (req, res) => {
    const { desde, limite } = req.query
    if (!entero(desde) || !entero(limite)) { res.status(400).json({ error: '`desde` y `limite` sólo admiten enteros no negativos' }); return }
    if (limite === '0') { res.json(await relleno.recuento({ desde: desde === undefined ? undefined : Number(desde) })); return }
    res.json(relleno.lanzar({
      desde: desde === undefined ? undefined : Number(desde),
      limite: limite === undefined ? undefined : Number(limite),
    }))
  }))

  app.get('/api/admin/relleno-adjuntos', requireAuth(db), requireSuperAdmin, (_req, res) => {
    res.json(relleno.estado())
  })
}
