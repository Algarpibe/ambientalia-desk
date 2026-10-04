import type { Request, Response, NextFunction } from 'express'
import { leerBusquedaTickets, type BusquedaTickets } from '@ambientalia/shared'

/**
 * Middleware de RUTA: lee `?q=` con la pieza compartida y deja el filtro en `res.locals.busqueda`.
 * Va SIEMPRE detrás de `requireAuth`: sin sesión es `401` (escalón B) antes que `422` (escalón C).
 */
export function leerBusqueda(req: Request, res: Response, next: NextFunction): void {
  const l = leerBusquedaTickets(req.query.q)
  if (!l.ok) { res.status(422).json({ error: l.error }); return }
  res.locals.busqueda = l.filtro
  next()
}

/** El filtro que dejó `leerBusqueda`; `null` si no hay búsqueda. */
export function busquedaDe(res: Response): BusquedaTickets | null {
  return (res.locals.busqueda as BusquedaTickets | null | undefined) ?? null
}
