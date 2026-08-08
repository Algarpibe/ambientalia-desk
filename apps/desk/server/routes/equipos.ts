import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { getClient } from '@ambientalia/zoho-sync/books/repo'
import { searchEquipos, createEquipo, updateEquipo, setEquipoActive, listEquiposManage, equipoFacets, getEquipoFull, deleteEquipo, getEquipoHistorial } from '../db/equipos'
import { getModelo } from '../db/catalogo'
import { requireAuth, requireAdmin as requireSuperAdmin } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'

export function registerEquipoRoutes(app: Express, deps: { db: Queryable }): void {
  const { db } = deps

  // `clientId` acota la búsqueda a los equipos de ese cliente. El nombre se resuelve en el
  // servidor (no se acepta del cliente) porque el cruce con `equipos.cliente_nombre` depende de él.
  // Si el id no resuelve, se devuelve sin acotar en vez de vaciar la lista.
  app.get('/api/equipos', requireAuth(db), asyncHandler(async (req, res) => {
    const clientId = req.query.clientId ? String(req.query.clientId) : ''
    const cliente = clientId ? await getClient(db, clientId) : null
    res.json(await searchEquipos(db, String(req.query.search ?? ''), cliente && { id: cliente.id, name: cliente.name }))
  }))

  app.get('/api/equipos/manage', requireAuth(db), asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const items = await listEquiposManage(db, String(req.query.search ?? ''), 50, (page - 1) * 50)
    res.json({ items, page })
  }))

  app.get('/api/equipos/facets', requireAuth(db), asyncHandler(async (_req, res) => {
    res.json(await equipoFacets(db))
  }))

  app.get('/api/equipos/:id/historial', requireAuth(db), asyncHandler(async (req, res) => {
    const h = await getEquipoHistorial(db, String(req.params.id))
    if (!h) { res.status(404).json({ error: 'Equipo no encontrado' }); return }
    res.json(h)
  }))

  // El catálogo es la fuente de marca/modelo/tipo: se eligen por `modeloId` y el servidor rellena los
  // tres textos a partir de él. No se aceptan del cuerpo — así no pueden divergir del catálogo, que es
  // justo el problema que esta fase cierra (un equipo mal registrado dejaba de ser un error para
  // convertirse en opción oficial del formulario, porque las listas se derivaban de `equipos`).
  app.post('/api/equipos', requireAuth(db), asyncHandler(async (req, res) => {
      const b = (req.body ?? {}) as Record<string, unknown>
      const serial = b.serial ? String(b.serial).trim() : ''
      const clientId = b.clientId ? String(b.clientId) : ''
      const modeloId = b.modeloId ? String(b.modeloId) : ''
      if (!serial) { res.status(422).json({ error: 'El número de serie es obligatorio' }); return }
      if (!clientId) { res.status(422).json({ error: 'El cliente es obligatorio' }); return }
      if (!modeloId) { res.status(422).json({ error: 'El modelo es obligatorio' }); return }
      const cliente = await getClient(db, clientId)
      if (!cliente) { res.status(422).json({ error: 'Cliente no encontrado' }); return }
      const modelo = await getModelo(db, modeloId)
      if (!modelo) { res.status(422).json({ error: 'Modelo no encontrado' }); return }
      const id = await createEquipo(db, {
        serial, marca: modelo.marca, modelo: modelo.nombre, tipo: modelo.tipo,
        clienteNombre: cliente.name, clientId, modeloId,
      })
      res.status(201).json(await getEquipoFull(db, id))
  }))

  app.patch('/api/equipos/:id', requireAuth(db), asyncHandler(async (req, res) => {
      const id = String(req.params.id)
      if (!(await getEquipoFull(db, id))) { res.status(404).json({ error: 'Equipo no encontrado' }); return }
      const b = (req.body ?? {}) as Record<string, unknown>
      const patch: Record<string, unknown> = {}
      if (b.serial !== undefined) patch.serial = String(b.serial).trim()
      if (b.clientId !== undefined && b.clientId) {
        const cliente = await getClient(db, String(b.clientId))
        if (!cliente) { res.status(422).json({ error: 'Cliente no encontrado' }); return }
        patch.clientId = String(b.clientId); patch.clienteNombre = cliente.name
      }
      // `modeloId` NO es obligatorio aquí, a propósito: el botón «Desactivar» del listado manda un
      // PATCH con solo { active }, y exigir el modelo en cada PATCH rompería esa desactivación. La
      // regla real es «no se puede guardar el FORMULARIO sin modelo» (lo exige quien construye el
      // payload, en una tarea posterior), no «no se puede tocar la fila sin mandar el modelo». Cuando
      // sí viene, se valida igual que en el alta y reescribe los tres textos desde el catálogo.
      if (b.modeloId !== undefined) {
        const modeloId = b.modeloId ? String(b.modeloId) : ''
        if (!modeloId) { res.status(422).json({ error: 'El modelo es obligatorio' }); return }
        const modelo = await getModelo(db, modeloId)
        if (!modelo) { res.status(422).json({ error: 'Modelo no encontrado' }); return }
        patch.modeloId = modeloId; patch.marca = modelo.marca; patch.modelo = modelo.nombre; patch.tipo = modelo.tipo
      }
      if (Object.keys(patch).length) await updateEquipo(db, id, patch)
      if (b.active !== undefined) await setEquipoActive(db, id, Boolean(b.active))
      res.json(await getEquipoFull(db, id))
  }))

  // Borrado físico de un equipo: SOLO super administrador.
  app.delete('/api/equipos/:id', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
      const id = String(req.params.id)
      if (!(await getEquipoFull(db, id))) { res.status(404).json({ error: 'Equipo no encontrado' }); return }
      await deleteEquipo(db, id)
      res.json({ ok: true })
  }))
}
