import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import {
  esOVI, puedeGestionarReclamacion, MENSAJE_SIN_CARGO_RECLAMACION, motivoPasoNoPermitido,
  validarRespuesta, validarDatosFicha, validarPaso, type EstadoReclamacion,
} from '@ambientalia/shared'
import { requireAuth } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'
import {
  asociacionPorId, respuestaDeAsociacion, registrarRespuesta, reclamacionPorId, editarFicha, avanzarFicha,
  garantiaDelTicket, ReclamacionYaRespondidaError,
} from '../db/garantiaProveedor'

/**
 * API de la reclamación de garantía al fabricante (F1B-13, lote 1b; `tickets-core` RQ-TC-44, RQ-TC-46 a RQ-TC-48 y
 * `permissions` RQ-PM-26).
 *
 * LECTURA: cualquier usuario con sesión (S-2). Leer no decide nada y el panel la usa para decidir qué ofrecer.
 *
 * ESCRITURAS, escalera de F1B-10 (A existencia < B estado y permiso < C contenido < D unicidad). Los ids G1 a G14 son
 * los de `design.md` §6 y cada uno tiene su prueba de POSICIÓN en `garantiaProveedor.test.ts`. El permiso se CONSUME
 * de `shared` (`puedeGestionarReclamacion`, regla invariable 13): aquí no se reescribe. El panel es comodidad; la
 * imposición es esta.
 */

const idNumerico = (v: unknown): number | null => (/^\d+$/.test(String(v)) ? Number(String(v)) : null)

export function registerGarantiaProveedorRoutes(app: Express, deps: { db: Queryable }): void {
  const { db } = deps

  app.get('/api/tickets/:id/garantia-proveedor', requireAuth(db), asyncHandler(async (req, res) => {
    res.json(await garantiaDelTicket(db, String(req.params.id)))
  }))

  // Responder: G1 asociación (A) < G2 cargo (B) < G3 liberada (B) < G4 es OVI (C) < G5 contenido (C) < G6 ya respondida (D)
  app.post('/api/ov-asociaciones/:id/garantia-proveedor', requireAuth(db), asyncHandler(async (req, res) => {
    const user = req.user!
    const id = idNumerico(req.params.id)
    const asociacion = id === null ? null : await asociacionPorId(db, id)
    // G1 · existencia
    if (!asociacion) { res.status(404).json({ error: 'Asociación no encontrada' }); return }
    // G2 · permiso
    if (!puedeGestionarReclamacion(user)) { res.status(403).json({ error: MENSAJE_SIN_CARGO_RECLAMACION }); return }
    // G3 · estado
    if (asociacion.liberada) { res.status(409).json({ error: 'La orden de venta ya está liberada de este ticket: no admite respuesta' }); return }
    // G4 · contenido: sólo una OVI se responde
    if (!esOVI(asociacion.numero)) {
      res.status(422).json({ error: `La orden de venta ${asociacion.numero} no es una OVI: la reclamación al fabricante sólo se responde sobre una OVI` }); return
    }
    // G5 · contenido
    const respuesta = validarRespuesta(req.body)
    if (!respuesta.ok) { res.status(422).json({ error: respuesta.error }); return }
    // G6 · unicidad (la consulta previa da el mensaje; el índice único cubre la carrera)
    const yaRespondida = { error: `La orden de venta ${asociacion.numero} ya tiene respuesta sobre la reclamación al fabricante` }
    if (await respuestaDeAsociacion(db, asociacion.id)) { res.status(409).json(yaRespondida); return }
    try {
      res.status(201).json(await registrarRespuesta(db, { asociacion, respuesta: respuesta.valor, por: user.name }))
    } catch (e) {
      if (e instanceof ReclamacionYaRespondidaError) { res.status(409).json(yaRespondida); return }
      throw e
    }
  }))

  // Editar: G11 ficha (A) < G12 cargo (B) < G13 resuelta (B) < G14 contenido (C)
  app.put('/api/garantia-proveedor/:id', requireAuth(db), asyncHandler(async (req, res) => {
    const id = idNumerico(req.params.id)
    const ficha = id === null ? null : await reclamacionPorId(db, id)
    // G11 · existencia: una respuesta «no» no tiene ficha
    if (!ficha || !ficha.reclama) { res.status(404).json({ error: 'Reclamación no encontrada' }); return }
    // G12 · permiso
    if (!puedeGestionarReclamacion(req.user)) { res.status(403).json({ error: MENSAJE_SIN_CARGO_RECLAMACION }); return }
    // G13 · estado
    const resuelta = { error: 'La reclamación está resuelta y ya no se edita' }
    if (ficha.estado === 'resuelta') { res.status(409).json(resuelta); return }
    // G14 · contenido
    const datos = validarDatosFicha(req.body)
    if (!datos.ok) { res.status(422).json({ error: datos.error }); return }
    const editada = await editarFicha(db, ficha.id, datos.valor)
    // Carrera: otra persona la resolvió entre la lectura y la escritura
    if (!editada) { res.status(409).json(resuelta); return }
    res.json(editada)
  }))

  // Avanzar: G7 ficha (A) < G8 cargo (B) < G9 paso permitido (B) < G10 contenido (C)
  app.post('/api/garantia-proveedor/:id/avanzar', requireAuth(db), asyncHandler(async (req, res) => {
    const id = idNumerico(req.params.id)
    const a = (req.body as { a?: unknown } | undefined)?.a // el destino se lee antes de las guardas; ninguna lo usa hasta G9
    const ficha = id === null ? null : await reclamacionPorId(db, id)
    // G7 · existencia: una respuesta «no» no tiene ficha
    if (!ficha || !ficha.reclama) { res.status(404).json({ error: 'Reclamación no encontrada' }); return }
    // G8 · permiso
    if (!puedeGestionarReclamacion(req.user)) { res.status(403).json({ error: MENSAJE_SIN_CARGO_RECLAMACION }); return }
    // G9 · estado: sólo el paso siguiente, nombrado en el cuerpo (D-5)
    const motivo = motivoPasoNoPermitido(ficha.estado, a)
    if (motivo !== null) { res.status(409).json({ error: motivo }); return }
    // G10 · contenido
    const paso = validarPaso(a as EstadoReclamacion, req.body)
    if (!paso.ok) { res.status(422).json({ error: paso.error }); return }
    const avanzada = await avanzarFicha(db, ficha.id, ficha.estado!, paso.valor)
    // Carrera: otra persona movió la ficha entre la lectura y la escritura
    if (!avanzada) {
      const actual = await reclamacionPorId(db, ficha.id)
      res.status(409).json({ error: motivoPasoNoPermitido(actual?.estado, a) ?? 'La reclamación ya cambió de estado: recarga e inténtalo de nuevo' }); return
    }
    res.json(avanzada)
  }))
}
