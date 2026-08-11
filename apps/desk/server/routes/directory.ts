import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { searchArticulos, categoriasDisponibles, searchClients, searchSalesOrders } from '@ambientalia/zoho-sync/books/repo'
import { getContacts, getAccounts, getContactDetail, getAccountDetail } from '../db/directory'
import { getAllActivities } from '@ambientalia/zoho-sync/db/activities'
import { requireAuth } from '../auth/middleware'
import { listPersonas } from '../auth/users'
import { asyncHandler } from '../util/asyncHandler'

export function registerDirectoryRoutes(app: Express, deps: { db: Queryable }): void {
  const { db } = deps

  // Búsqueda de clientes/órdenes de venta (Books) para los selectores de creación de tickets.
  // Requieren sesión: son datos de negocio. Cada uno con su propio requireAuth (no van bajo /api/tickets).
  app.get('/api/clients', requireAuth(db), asyncHandler(async (req, res) => {
    res.json(await searchClients(db, String(req.query.search ?? '')))
  }))

  // Artículos de Books (`books.items`, replicada del hub). Alimenta el SKU de la ficha del modelo, y
  // será la misma fuente de la futura gestión de accesorios/consumibles/repuestos por modelo.
  app.get('/api/articulos', requireAuth(db), asyncHandler(async (req, res) => {
    res.json(await searchArticulos(db, String(req.query.search ?? '')))
  }))

  // Las categorías con las que se configuran los artículos de un modelo. Se ofrecen TODAS y no solo las
  // de prefijo `C&R`/`Opcional`: hay artículos relevantes en `Accesorios`, `Meteorología` o
  // `Kunak Air Series`, y filtrar por prefijo dejaría modelos sin poder configurarse.
  app.get('/api/articulos/categorias', requireAuth(db), asyncHandler(async (_req, res) => {
    res.json(await categoriasDisponibles(db))
  }))

  /**
   * Las personas a las que se puede derivar un ticket. Vive aquí y no en `auth/routes.ts` porque no es
   * administración: derivar lo hace cualquiera que ejecute una transición, igual que buscar un cliente
   * o un artículo. `/api/users` sigue siendo de administradores y no se toca.
   */
  app.get('/api/personas', requireAuth(db), asyncHandler(async (_req, res) => {
    res.json(await listPersonas(db))
  }))

  app.get('/api/sales-orders', requireAuth(db), asyncHandler(async (req, res) => {
    const clientId = req.query.clientId ? String(req.query.clientId) : undefined
    // `soloLibres` lo piden los buscadores que eligen una OV para un ticket (remisión y transición).
    // La creación de tickets NO lo pide todavía: cambiarlo ahí es otra decisión.
    const soloLibres = req.query.soloLibres === '1' || req.query.soloLibres === 'true'
    res.json(await searchSalesOrders(db, String(req.query.search ?? ''), clientId, 20, soloLibres))
  }))

  app.get('/api/activities', requireAuth(db), asyncHandler(async (req, res) => {
    const filter = String(req.query.filter ?? 'todas')
    const search = String(req.query.search ?? '')
    const limit = Math.min(1000, Math.max(1, Number(req.query.limit) || 300))
    res.json(await getAllActivities(db, { filter, search, limit }))
  }))

  app.get('/api/contacts', requireAuth(db), asyncHandler(async (_req, res) => {
    res.json(await getContacts(db))
  }))
  app.get('/api/accounts', requireAuth(db), asyncHandler(async (_req, res) => {
    res.json(await getAccounts(db))
  }))
  app.get('/api/contacts/:id', requireAuth(db), asyncHandler(async (req, res) => {
    const d = await getContactDetail(db, String(req.params.id)); if (!d) { res.status(404).json({ error: 'No encontrado' }); return } res.json(d)
  }))
  app.get('/api/accounts/:id', requireAuth(db), asyncHandler(async (req, res) => {
    const d = await getAccountDetail(db, String(req.params.id)); if (!d) { res.status(404).json({ error: 'No encontrado' }); return } res.json(d)
  }))
}
