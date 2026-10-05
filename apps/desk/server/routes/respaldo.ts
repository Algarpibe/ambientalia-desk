import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { requireAuth, requireAdmin } from '../auth/middleware'
import { logger } from '../util/logger'
import type { Motivo } from '../respaldo/respaldo'

/** Lo que la ruta necesita del respaldador (`crearRespaldador`); en las pruebas se sustituye por un doble. */
export interface RespaldadorRuta {
  habilitado: boolean
  enCurso: () => boolean
  lanzar: (motivo: Motivo) => Promise<unknown>
}

/**
 * F1F-02 (RQ-ZS-20): la copia previa a un cambio. Se lanza ANTES de publicar (`decision/p55-backup`: «una copia extra
 * antes de cada cambio que se suba a la aplicación»). Responde `202` en cuanto arranca: un volcado puede tardar más que
 * la paciencia de un proxy, y si falla, el aviso por correo llega igual. Orden: sesión → rol → interruptor → en curso.
 */
export function registerRespaldoRoutes(app: Express, { db, respaldador }: { db: Queryable; respaldador: RespaldadorRuta }): void {
  app.post('/api/admin/respaldo', requireAuth(db), requireAdmin, (_req, res) => {
    if (!respaldador.habilitado) { res.status(403).json({ error: 'El respaldo está deshabilitado en este entorno: hace falta RESPALDO_HABILITADO=true.' }); return }
    if (respaldador.enCurso()) { res.status(409).json({ error: 'Ya hay una copia en curso; espera a que termine.' }); return }
    respaldador.lanzar('previa')
      .then((r) => logger.info({ r }, 'Respaldo previo terminado'))
      .catch((err) => logger.error({ err }, 'Respaldo previo falló'))
    res.status(202).json({ iniciado: true, motivo: 'previa' })
  })
}
