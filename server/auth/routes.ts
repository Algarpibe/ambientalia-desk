import type { Express } from 'express'
import type { Queryable } from '../db/migrate'
import { hashPassword, verifyPassword } from './passwords'
import { createUser, getUserByEmail, getUserById, listUsers, updateUser, setPassword, countActiveAdmins } from './users'
import { createRole, listRoles, getRole, updateRole } from './roles'
import { createSession, deleteSession, deleteUserSessions } from './sessions'
import { requireAuth, requireAdmin } from './middleware'

const COOKIE = 'sid'
const SECURE = process.env.NODE_ENV === 'production' // cookie solo por HTTPS en producción
const COOKIE_OPTS = { httpOnly: true, sameSite: 'lax' as const, secure: SECURE, maxAge: 30 * 24 * 60 * 60 * 1000 }
const CLEAR_OPTS = { httpOnly: true, sameSite: 'lax' as const, secure: SECURE } // mismas opciones para que clearCookie funcione

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
    res.json(await getUserById(db, u.id))
  })

  app.post('/api/auth/logout', auth, async (req, res) => {
    const token = req.cookies?.sid
    if (token) await deleteSession(db, String(token))
    res.clearCookie(COOKIE, CLEAR_OPTS)
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
    let roleId: string | null = null
    if (req.body.roleId) {
      roleId = String(req.body.roleId)
      if (!(await getRole(db, roleId))) { res.status(422).json({ error: 'Rol no encontrado' }); return }
    }
    const created = await createUser(db, { email, name, passwordHash: await hashPassword(password), isAdmin: Boolean(req.body.isAdmin), roleId })
    res.status(201).json(created)
  })

  app.patch('/api/users/:id', auth, requireAdmin, async (req, res) => {
    const id = String(req.params.id)
    const patch: { name?: string; isAdmin?: boolean; active?: boolean; roleId?: string | null } = {}
    if (req.body.name !== undefined) patch.name = String(req.body.name)
    if (req.body.isAdmin !== undefined) patch.isAdmin = Boolean(req.body.isAdmin)
    if (req.body.active !== undefined) patch.active = Boolean(req.body.active)
    if (req.body.roleId !== undefined) {
      const roleId = req.body.roleId === null ? null : String(req.body.roleId)
      if (roleId !== null && !(await getRole(db, roleId))) { res.status(422).json({ error: 'Rol no encontrado' }); return }
      patch.roleId = roleId
    }
    // Protección: no dejar el sistema sin administradores activos.
    if (patch.isAdmin === false || patch.active === false) {
      const target = await getUserById(db, id)
      if (target?.isAdmin && target.active && (await countActiveAdmins(db)) <= 1) {
        res.status(409).json({ error: 'No puedes quitar el último administrador activo' }); return
      }
    }
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

  app.get('/api/roles', auth, requireAdmin, async (_req, res) => {
    res.json(await listRoles(db))
  })

  app.post('/api/roles', auth, requireAdmin, async (req, res) => {
    const name = String(req.body.name ?? '').trim()
    const areas = Array.isArray(req.body.areas) ? req.body.areas : []
    if (!name) { res.status(422).json({ error: 'El nombre del rol es obligatorio' }); return }
    if ((await listRoles(db)).some((r) => r.name.toLowerCase() === name.toLowerCase())) {
      res.status(409).json({ error: 'Ya existe un rol con ese nombre' }); return
    }
    res.status(201).json(await createRole(db, { name, areas }))
  })

  app.patch('/api/roles/:id', auth, requireAdmin, async (req, res) => {
    const id = String(req.params.id)
    const patch: { name?: string; areas?: string[]; active?: boolean } = {}
    if (req.body.name !== undefined) patch.name = String(req.body.name)
    if (req.body.areas !== undefined) patch.areas = Array.isArray(req.body.areas) ? req.body.areas : []
    if (req.body.active !== undefined) patch.active = Boolean(req.body.active)
    await updateRole(db, id, patch)
    const updated = await getRole(db, id)
    if (!updated) { res.status(404).json({ error: 'Rol no encontrado' }); return }
    res.json(updated)
  })
}
