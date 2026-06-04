import type { Request, Response, NextFunction } from 'express'
import type { Queryable } from '../db/migrate'
import type { UserPublic } from '../../shared/types'
import { getSessionUser } from './sessions'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request { user?: UserPublic }
  }
}

/** Exige sesión válida (cookie `sid`). Adjunta `req.user`. */
export function requireAuth(db: Queryable) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = req.cookies?.sid
    if (!token) { res.status(401).json({ error: 'No autenticado' }); return }
    const user = await getSessionUser(db, String(token))
    if (!user) { res.status(401).json({ error: 'Sesión inválida o expirada' }); return }
    req.user = user
    next()
  }
}

/** Exige que `req.user` sea admin (usar tras requireAuth). */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.isAdmin) { res.status(403).json({ error: 'Requiere permisos de administrador' }); return }
  next()
}
