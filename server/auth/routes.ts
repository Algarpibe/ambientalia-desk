import type { Express } from 'express'
import type { Queryable } from '../db/migrate'
import { hashPassword, verifyPassword } from './passwords'
import { createUser, getUserByEmail, getUserById, listUsers, updateUser, setPassword } from './users'
import { createSession, deleteSession, deleteUserSessions } from './sessions'
import { requireAuth, requireAdmin } from './middleware'

const COOKIE = 'sid'
const COOKIE_OPTS = { httpOnly: true, sameSite: 'lax' as const, maxAge: 30 * 24 * 60 * 60 * 1000 }

export function registerAuthRoutes(app: Express, db: Queryable): void {
  const auth = requireAuth(db)

  app.post('/api/auth/login', async (req, res) => {
    const email = String(req.body.email ?? '')
    const password = String(req.body.password ?? '')
    const u = await getUserByEmail(db, email)
    if (!u || !u.active || !(await verifyPassword(password, u.passwordHash))) {
      res.status(401).json({ error: 'Correo o contraseña incorrectos' }); return
    }
    const token = await createSession(db, u.id)
    res.cookie(COOKIE, token, COOKIE_OPTS)
    res.json({ id: u.id, email: u.email, name: u.name, isAdmin: u.isAdmin, active: u.active })
  })

  app.post('/api/auth/logout', auth, async (req, res) => {
    const token = req.cookies?.sid
    if (token) await deleteSession(db, String(token))
    res.clearCookie(COOKIE)
    res.json({ ok: true })
  })

  app.get('/api/auth/me', auth, (req, res) => { res.json(req.user) })

  app.post('/api/auth/change-password', auth, async (req, res) => {
    const current = String(req.body.currentPassword ?? '')
    const next = String(req.body.newPassword ?? '')
    if (next.length < 8) { res.status(422).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' }); return }
    const u = await getUserByEmail(db, req.user!.email)
    if (!u || !(await verifyPassword(current, u.passwordHash))) { res.status(401).json({ error: 'Contraseña actual incorrecta' }); return }
    await setPassword(db, u.id, await hashPassword(next))
    await deleteUserSessions(db, u.id)
    const token = await createSession(db, u.id) // mantener al propio usuario logueado
    res.cookie(COOKIE, token, COOKIE_OPTS)
    res.json({ ok: true })
  })

  app.get('/api/users', auth, requireAdmin, async (_req, res) => {
    res.json(await listUsers(db))
  })

  app.post('/api/users', auth, requireAdmin, async (req, res) => {
    const email = String(req.body.email ?? '').trim().toLowerCase()
    const name = String(req.body.name ?? '').trim()
    const password = String(req.body.password ?? '')
    if (!email || !name) { res.status(422).json({ error: 'Correo y nombre son obligatorios' }); return }
    if (password.length < 8) { res.status(422).json({ error: 'La contraseña debe tener al menos 8 caracteres' }); return }
    if (await getUserByEmail(db, email)) { res.status(409).json({ error: 'Ya existe un usuario con ese correo' }); return }
    const created = await createUser(db, { email, name, passwordHash: await hashPassword(password), isAdmin: Boolean(req.body.isAdmin) })
    res.status(201).json(created)
  })

  app.patch('/api/users/:id', auth, requireAdmin, async (req, res) => {
    const id = String(req.params.id)
    const patch: { name?: string; isAdmin?: boolean; active?: boolean } = {}
    if (req.body.name !== undefined) patch.name = String(req.body.name)
    if (req.body.isAdmin !== undefined) patch.isAdmin = Boolean(req.body.isAdmin)
    if (req.body.active !== undefined) patch.active = Boolean(req.body.active)
    await updateUser(db, id, patch)
    if (req.body.password !== undefined) {
      const pw = String(req.body.password)
      if (pw.length < 8) { res.status(422).json({ error: 'La contraseña debe tener al menos 8 caracteres' }); return }
      await setPassword(db, id, await hashPassword(pw))
    }
    if (patch.active === false || req.body.password !== undefined) await deleteUserSessions(db, id)
    const updated = await getUserById(db, id)
    if (!updated) { res.status(404).json({ error: 'Usuario no encontrado' }); return }
    res.json(updated)
  })
}
