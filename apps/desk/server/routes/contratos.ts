import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { getClient } from '@ambientalia/zoho-sync/books/repo'
import { saldoPorLote } from '@ambientalia/zoho-sync/books/subOV'
import { canExecuteTransition, esLote, fechaCalendario, estadoContrato, hoyEnZona, MENSAJES_AMPLIACION, ampliacionDelCuerpo, fechaFinOriginal, type DiaCivil } from '@ambientalia/shared'
import { requireAuth } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'
import { informeContrato } from '../db/informeContrato'
import { crearContrato, listarContratos, contratoPorId, contratoDelLote, contratoDelTicket, ContratoDuplicadoError, ampliarContrato, ampliacionesDelContrato, ContratoCambiadoError } from '../db/contratos'

/**
 * API de contratos (registro-contrato, lote 3; `tickets-core` RQ-TC-21 y RQ-TC-23).
 *
 * LECTURAS (lista, ficha, derivación del ticket): cualquier usuario con sesión (S-16, como `ovAsociaciones.ts:13-14`).
 *
 * ALTA, escalera de F1B-10: B sin Comercial (`403`) < C contenido (`422`) < D lote ya registrado (`409`). El permiso
 * se decide ANTES de leer el cuerpo y se CONSUME de `shared` (regla invariable 13). El lote se reconoce con
 * `clasificarOV` (vía `esLote`), no con una regex propia. De la petición sólo se leen cliente, lote y fechas:
 * `creado_por` es el de la sesión y el «ticket de contrato» no es un campo de nadie — se deriva al leer (RQ-TC-23).
 */
export function registerContratosRoutes(app: Express, deps: { db: Queryable; hoy?: () => DiaCivil }): void {
  const { db } = deps; const hoy = deps.hoy ?? hoyEnZona

  app.get('/api/contratos', requireAuth(db), asyncHandler(async (_req, res) => {
    res.json(await listarContratos(db))
  }))

  app.get('/api/contratos/:id', requireAuth(db), asyncHandler(async (req, res) => {
    const id = String(req.params.id)
    // A · existencia: un id no numérico no llega a la base
    const contrato = /^\d+$/.test(id) ? await contratoPorId(db, Number(id)) : null
    if (!contrato) { res.status(404).json({ error: 'Contrato no encontrado' }); return }
    const ampliaciones = await ampliacionesDelContrato(db, contrato.id); res.json({ contrato, estado: estadoContrato(contrato, hoyEnZona()), saldo: await saldoPorLote(db, contrato.lote), ampliaciones, fechaFinOriginal: fechaFinOriginal(contrato.fechaFin, ampliaciones) })
  }))

  app.get('/api/tickets/:id/contrato', requireAuth(db), asyncHandler(async (req, res) => {
    res.json(await contratoDelTicket(db, String(req.params.id)))
  }))

  app.post('/api/contratos', requireAuth(db), asyncHandler(async (req, res) => {
    const user = req.user!
    // B · permiso
    if (!canExecuteTransition(user.areas, user.isAdmin, 'Comercial')) { res.status(403).json({ error: 'Registrar un contrato requiere el área Comercial' }); return }
    // C · contenido
    const b = (req.body ?? {}) as Record<string, unknown>
    const clientId = typeof b.clientId === 'string' ? b.clientId.trim() : ''
    const fechaInicio = fechaCalendario(b.fechaInicio)
    const fechaFin = fechaCalendario(b.fechaFin)
    if (!esLote(b.lote)) { res.status(422).json({ error: 'El lote debe tener el formato OV-AAAA-NNN (la OV madre, sin sufijo)' }); return }
    if (!fechaInicio || !fechaFin) { res.status(422).json({ error: 'Las fechas de inicio y fin son obligatorias, en formato AAAA-MM-DD' }); return }
    if (fechaFin < fechaInicio) { res.status(422).json({ error: 'La fecha de fin no puede ser anterior a la de inicio' }); return }
    if (!clientId || !(await getClient(db, clientId))) { res.status(422).json({ error: 'El cliente no existe' }); return }
    // D · unicidad (la consulta previa da el mensaje; el índice único cubre la carrera)
    const lote = b.lote as string
    if (await contratoDelLote(db, lote)) { res.status(409).json({ error: `El lote ${lote} ya tiene un contrato registrado` }); return }
    try {
      res.status(201).json(await crearContrato(db, { clientId, lote, fechaInicio, fechaFin, creadoPor: user.name }))
    } catch (e) {
      if (e instanceof ContratoDuplicadoError) { res.status(409).json({ error: e.message }); return }
      throw e
    }
  }))

  // Lote 4 — informe trimestral (RQ-ZS-15). A · existencia: un id no numérico no llega a la base.
  app.get('/api/contratos/:id/informe', requireAuth(db), asyncHandler(async (req, res) => {
    const id = String(req.params.id)
    const contrato = /^\d+$/.test(id) ? await contratoPorId(db, Number(id)) : null
    if (!contrato) { res.status(404).json({ error: 'Contrato no encontrado' }); return }
    res.json(await informeContrato(db, contrato, hoyEnZona()))
  }))

  // ampliacion-contrato (F1B-11, RQ-TC-54) — escalera: A existencia `404` < B permiso `403` (antes de leer el cuerpo) < C contenido
  // `422` (`ampliacionDelCuerpo`, de `shared`) < D carrera `409`. De la petición sólo se leen `fechaFin` y `motivo`: `ampliado_por` es la sesión.
  app.post('/api/contratos/:id/ampliar', requireAuth(db), asyncHandler(async (req, res) => {
    const user = req.user!
    const id = String(req.params.id)
    const contrato = /^\d+$/.test(id) ? await contratoPorId(db, Number(id)) : null
    if (!contrato) { res.status(404).json({ error: MENSAJES_AMPLIACION.inexistente }); return }
    if (!canExecuteTransition(user.areas, user.isAdmin, 'Comercial')) { res.status(403).json({ error: MENSAJES_AMPLIACION.permiso }); return }
    const cuerpo = ampliacionDelCuerpo(req.body, contrato, hoy())
    if (!cuerpo.ok) { res.status(422).json({ error: cuerpo.error }); return }
    try {
      const ampliado = await ampliarContrato(db, { contratoId: contrato.id, fechaAnterior: contrato.fechaFin, fechaNueva: cuerpo.fechaFin, motivo: cuerpo.motivo, ampliadoPor: user.name })
      const ampliaciones = await ampliacionesDelContrato(db, contrato.id)
      res.status(200).json({ contrato: ampliado, ampliaciones, fechaFinOriginal: fechaFinOriginal(ampliado.fechaFin, ampliaciones) })
    } catch (e) {
      if (e instanceof ContratoCambiadoError) { res.status(409).json({ error: e.message }); return }
      throw e
    }
  }))
}
