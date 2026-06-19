import type { Express } from 'express'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { getAnalisisRowsCached, rangeToFromTo } from '../analisis'
import { computeAnalisis } from '@ambientalia/shared'
import { requireAuth, requireAdmin as requireSuperAdmin } from '../auth/middleware'
import { asyncHandler } from '../util/asyncHandler'

export function registerAnalisisRoutes(app: Express, deps: { db: Queryable }): void {
  const { db } = deps

  app.get('/api/analisis', requireAuth(db), requireSuperAdmin, asyncHandler(async (req, res) => {
      const { from, to } = rangeToFromTo(String(req.query.range ?? 'todo'), new Date())
      const rows = await getAnalisisRowsCached(db)
      res.json(computeAnalisis(rows, from, to))
  }))
}
