import express, { type Express, type Request, type Response, type NextFunction } from 'express'
import pinoHttp from 'pino-http'
import { randomUUID } from 'node:crypto'
import { logger } from './util/logger'
import type { AppConfig } from '@ambientalia/zoho-sync/config'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { Sync } from '@ambientalia/zoho-sync/sync'
import { createMeasurer } from './measure'
import { createDetailBackfiller } from './backfill'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { registerAuthRoutes } from './auth/routes'
import { registerTicketRoutes } from './routes/tickets'
import { registerDirectoryRoutes } from './routes/directory'
import { registerCatalogoRoutes } from './routes/catalogo'
import { registerEquipoRoutes } from './routes/equipos'
import { registerAnalisisRoutes } from './routes/analisis'
import { registerAdminRoutes } from './routes/admin'
import { registerAttachmentRoutes } from './routes/attachment'
import { registerRemisionRoutes } from './routes/remision'
import { HttpError } from './util/httpError'
import multer from 'multer'
import { LIMITE_SUBIDA_MB } from './util/subida'

interface Deps {
  db: Queryable
  zohoFetch: (path: string, init?: RequestInit) => Promise<globalThis.Response>
  sync: Sync
  config: AppConfig
}

export function createApp({ db, zohoFetch, sync, config }: Deps): Express {
  const app = express()
  app.set('trust proxy', 1) // detrás del proxy de EasyPanel → IP real para el rate-limit
  app.use(helmet({ contentSecurityPolicy: false })) // CSP afinada = deuda (no romper el SPA)
  app.use(express.json())
  app.use(cookieParser())
  app.use(pinoHttp({ logger, genReqId: (req) => (req.headers['x-request-id'] as string) || randomUUID() }))
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false,
    skipSuccessfulRequests: true, message: { error: 'Demasiados intentos, intenta más tarde' },
  })
  app.use('/api/auth/login', loginLimiter)
  app.use('/api/auth/change-password', loginLimiter)
  registerAuthRoutes(app, db)

  const measurer = createMeasurer({ zohoFetch, config })
  const detailBackfiller = createDetailBackfiller({ zohoFetch, sync, config })

  registerTicketRoutes(app, { db, sync, zohoFetch, config })
  registerDirectoryRoutes(app, { db })
  registerCatalogoRoutes(app, { db })
  registerEquipoRoutes(app, { db })
  registerAnalisisRoutes(app, { db })
  registerAdminRoutes(app, { db, sync, measurer, detailBackfiller })
  registerAttachmentRoutes(app, { db, zohoFetch })
  registerRemisionRoutes(app, { db, config })

  // Manejador central de errores: registra el error real pero NO lo filtra al cliente.
  // (Express identifica los error-handlers por su aridad de 4 args; `_next` debe existir.)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) { res.status(err.status).json(err.body); return }
    // Un fichero rechazado por multer es culpa de quien sube, no del servidor: sin esta rama caía en el
    // 500 genérico de abajo, que ni dice el límite ni distingue el fallo real de Postgres en el log.
    // No se hace un `switch` exhaustivo sobre `err.code` a propósito: @types/multer declara 7 códigos y
    // el runtime emite 9, así que un mapeo "completo" dejaría dos cayendo por un hueco invisible.
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({ error: `El archivo supera el límite de ${LIMITE_SUBIDA_MB} MB` }); return
      }
      res.status(400).json({ error: 'No se pudo procesar el archivo enviado' }); return
    }
    logger.error({ err }, 'Error no manejado')
    if (res.headersSent) return
    res.status(500).json({ error: 'Error interno' })
  })

  return app
}
