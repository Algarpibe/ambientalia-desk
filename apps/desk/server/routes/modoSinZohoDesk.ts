import type { Express, Request, Response, RequestHandler } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import { crearRegistroModoSinZoho, type RegistroModoSinZoho } from '@ambientalia/zoho-sync/modoSinZoho'
import { requireAuth, requireAdmin as requireSuperAdmin } from '../auth/middleware'

/**
 * modo-sin-zoho (1G-04, RQ-ZS-43 y RQ-ZS-44, D-5 y D-6) · la guarda común de las rutas que sólo Zoho Desk puede dar y el `GET` de estado.
 * El `503` es un RECHAZO que una persona recibió, no un corte: va al registro aparte y nunca lleva ids, query ni cuerpos (la ruta es el
 * patrón de Express). La decisión es del servidor; el cliente no participa (regla invariable 13).
 */
export const MENSAJE_MODO_SIN_ZOHO_DESK = 'La app está en modo sin Zoho Desk: esta función necesita Zoho Desk y no está disponible mientras dure el modo. Lo que ya está en la base de datos sigue disponible.'
export const MENSAJE_ADJUNTO_SIN_COPIA = 'Este adjunto no está en el almacenamiento propio y la app está en modo sin Zoho Desk: no se puede traer de Zoho mientras dure el modo.'

export interface ModoSinZoho { activo: boolean; registro: RegistroModoSinZoho }

/** Abre sólo con el literal `true` (la misma lectura que `config.ts`); sin registro propio crea uno nuevo. */
export function crearModoSinZoho(config: AppConfig, registro: RegistroModoSinZoho = crearRegistroModoSinZoho()): ModoSinZoho {
  return { activo: config.modoSinZohoDesk === true, registro }
}

/**
 * Suma el rechazo con el patrón de la ruta —`<verbo> <baseUrl><route.path>`, nunca la URL pedida— y responde `503`. Con las cabeceras ya
 * enviadas sólo suma (molde: el manejador central de `app.ts`). Sin `req.route`, la ruta sale `(ruta desconocida)`, que no lleva datos.
 */
export function responderModoSinZoho(req: Request, res: Response, modo: ModoSinZoho, mensaje: string = MENSAJE_MODO_SIN_ZOHO_DESK): void {
  const ruta = req.route ? `${req.method} ${req.baseUrl}${req.route.path}` : '(ruta desconocida)'
  modo.registro.rechazar(ruta)
  if (res.headersSent) return
  res.status(503).json({ error: mensaje, motivo: 'modo-sin-zoho-desk' })
}

/**
 * Escalón B (permiso) del orden total de F1B-10: va tras el rol y ANTES del interruptor propio y de la validación. Cerrado el modo, o si
 * `libre(req)` dice que la petición no llama a Zoho, deja pasar.
 */
export function guardaModoSinZoho(modo: ModoSinZoho, libre?: (req: Request) => boolean): RequestHandler {
  return (req, res, next) => {
    if (!modo.activo || libre?.(req)) { next(); return }
    responderModoSinZoho(req, res, modo)
  }
}

/** La noción de recuento de los tres rellenos y la verificación: sólo la cadena `'0'` (`rellenoConversaciones.ts`, `rellenoAdjuntos.ts`, `verificacionCompletitud.ts`). */
export const esRecuento = (req: Request): boolean => req.query.limite === '0'

/** La noción de `backfill-history` (`admin.ts`): presente y `Number(limite) === 0`, así que `''` y `'00'` también cuentan. */
export const esConteoHistoria = (req: Request): boolean => req.query.limite != null && Number(req.query.limite) === 0

/** `GET /api/admin/modo-sin-zoho-desk`: sólo lee memoria, no lleva guarda (no se suma a sí mismo) y no llama a Zoho ni a la base. */
export function registerModoSinZohoRoutes(app: Express, { db, modo }: { db: Queryable; modo: ModoSinZoho }): void {
  app.get('/api/admin/modo-sin-zoho-desk', requireAuth(db), requireSuperAdmin, (_req, res) => {
    res.json({ activo: modo.activo, ...modo.registro.leer() })
  })
}
