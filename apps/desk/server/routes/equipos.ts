import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { getClient } from '@ambientalia/zoho-sync/books/repo'
import { searchEquipos, createEquipo, updateEquipo, setEquipoActive, listEquiposManage, equipoFacets, getEquipoFull, deleteEquipo, getEquipoHistorial } from '../db/equipos'
import { requireAuth, requireAdmin as requireSuperAdmin } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'

export function registerEquipoRoutes(app: Express, deps: { db: Queryable }): void {
  const { db } = deps

  app.get('/api/equipos', requireAuth(db), asyncHandler(async (req, res) => {
    res.json(await searchEquipos(db, String(req.query.search ?? '')))
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

  app.post('/api/equipos', requireAuth(db), asyncHandler(async (req, res) => {
      const b = (req.body ?? {}) as Record<string, unknown>
      const serial = b.serial ? String(b.serial).trim() : ''
      const clientId = b.clientId ? String(b.clientId) : ''
      if (!serial) { res.status(422).json({ error: 'El número de serie es obligatorio' }); return }
      if (!clientId) { res.status(422).json({ error: 'El cliente es obligatorio' }); return }
      const cliente = await getClient(db, clientId)
      if (!cliente) { res.status(422).json({ error: 'Cliente no encontrado' }); return }
      const id = await createEquipo(db, {
        serial, marca: b.marca ? String(b.marca) : null, modelo: b.modelo ? String(b.modelo) : null,
        tipo: b.tipo ? String(b.tipo) : null, clienteNombre: cliente.name, clientId,
      })
      res.status(201).json(await getEquipoFull(db, id))
  }))

  app.patch('/api/equipos/:id', requireAuth(db), asyncHandler(async (req, res) => {
      const id = String(req.params.id)
      if (!(await getEquipoFull(db, id))) { res.status(404).json({ error: 'Equipo no encontrado' }); return }
      const b = (req.body ?? {}) as Record<string, unknown>
      const patch: Record<string, unknown> = {}
      if (b.serial !== undefined) patch.serial = String(b.serial).trim()
      if (b.marca !== undefined) patch.marca = b.marca ? String(b.marca) : null
      if (b.modelo !== undefined) patch.modelo = b.modelo ? String(b.modelo) : null
      if (b.tipo !== undefined) patch.tipo = b.tipo ? String(b.tipo) : null
      if (b.clientId !== undefined && b.clientId) {
        const cliente = await getClient(db, String(b.clientId))
        if (!cliente) { res.status(422).json({ error: 'Cliente no encontrado' }); return }
        patch.clientId = String(b.clientId); patch.clienteNombre = cliente.name
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
