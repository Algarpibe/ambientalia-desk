import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { requireAuth, requireAdmin } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'
import { crearSubida } from '../util/subida'
import { cargarRespuestas } from '../db/encuestaRespuestas'
import { analizarRespuestasEncuesta, decodificarFichero } from '../encuesta/analizarRespuestas'

// indicadores-51-55 (F1F-05), RQ-KP-21: la carga del fichero de respuestas de la encuesta, sólo para administradores. Sin interruptor
// y sin pantalla (S-F). Orden EXACTO de los middlewares: sesión (401) < administrador (403) < multer (413 límite, 400 campo) <
// manejador (400 sin fichero o fichero malo, 200 carga). Multer va DESPUÉS de las dos guardas para que quien no tiene permiso no llegue
// a subir el fichero: el molde del orden es `routes/indicadores.ts`, no `certificadoFabrica.ts` (que pone multer delante de su 403).

export const MENSAJE_SIN_FICHERO = 'Falta el fichero de respuestas'

export function registerEncuestaRespuestasRoutes(app: Express, deps: { db: Queryable }): void {
  const { db } = deps
  const subida = crearSubida()
  app.post('/api/indicadores/encuesta', requireAuth(db), requireAdmin, subida.single('file'), asyncHandler(async (req, res) => {
    if (!req.file) { res.status(400).json({ error: MENSAJE_SIN_FICHERO }); return }
    const a = analizarRespuestasEncuesta(decodificarFichero(req.file.buffer))
    if (!a.ok) { res.status(400).json({ error: a.error }); return }
    // Del cuerpo sólo se lee el fichero: el actor es el usuario de la sesión, nunca un campo del formulario.
    const c = await cargarRespuestas(db, a.filas, req.user!.name)
    const rechazadas = [...a.rechazadas, ...c.rechazadas].sort((x, y) => x.fila - y.fila)
    res.status(200).json({ leidas: a.leidas, insertadas: c.insertadas, duplicadas: c.duplicadas, rechazadas })
  }))
}
