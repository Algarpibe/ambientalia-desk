import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { searchClients, searchSalesOrders } from '@ambientalia/zoho-sync/books/repo'
import { getContacts, getAccounts, getContactDetail, getAccountDetail } from '../db/directory'
import { getAllActivities } from '@ambientalia/zoho-sync/db/activities'
import { requireAuth } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'

export function registerDirectoryRoutes(app: Express, deps: { db: Queryable }): void {
  const { db } = deps

  // Búsqueda de clientes/órdenes de venta (Books) para los selectores de creación de tickets.
  // Requieren sesión: son datos de negocio. Cada uno con su propio requireAuth (no van bajo /api/tickets).
  app.get('/api/clients', requireAuth(db), asyncHandler(async (req, res) => {
    res.json(await searchClients(db, String(req.query.search ?? '')))
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
