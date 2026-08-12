import { useEffect, useState } from 'react'
import type { UserPublic } from '@ambientalia/shared'
import { listUsers, createUser, updateUser, listRoles, type Role } from '../api/client'

export function UsersAdmin({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<UserPublic[]>([])
  const [creating, setCreating] = useState(false)
  const [editando, setEditando] = useState<UserPublic | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  useEffect(() => { listRoles().then(setRoles).catch(() => {}) }, [])

  async function reload() {
    try { setUsers(await listUsers()) } catch (e) { setError(String(e instanceof Error ? e.message : e)) }
  }
  useEffect(() => { reload() }, [])

  async function toggleActive(u: UserPublic) {
    try { await updateUser(u.id, { active: !u.active }); reload() }
    catch (e) { alert('Error: ' + String(e instanceof Error ? e.message : e)) }
  }
  async function toggleAdmin(u: UserPublic) {
    try { await updateUser(u.id, { isAdmin: !u.isAdmin }); reload() }
    catch (e) { alert('Error: ' + String(e instanceof Error ? e.message : e)) }
  }
  async function changeRole(u: UserPublic, roleId: string) {
    await updateUser(u.id, { roleId: roleId || null }); reload()
  }
  async function resetPassword(u: UserPublic) {
    const pw = prompt(`Nueva contraseña para ${u.email} (mínimo 8 caracteres):`)
    if (!pw) return
    try { await updateUser(u.id, { password: pw }); alert('Contraseña actualizada') }
    catch (e) { alert('Error: ' + String(e instanceof Error ? e.message : e)) }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col">
      <div className="bg-[#2C2E3E] text-white h-[48px] flex items-center px-4 gap-3 shrink-0">
        <button onClick={onClose} className="hover:bg-white/10 p-1 rounded"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="text-[15px] font-bold">Usuarios</h1>
        <button onClick={() => setCreating(true)} className="ml-auto bg-[#2C7BE5] text-white px-3 py-1.5 rounded text-[13px] font-bold">Nuevo usuario</button>
      </div>
      {error && <div className="bg-red-50 text-red-700 text-[12px] px-4 py-2">{error}</div>}
      <div className="flex-1 overflow-auto p-4">
        <table className="w-full text-[13px]">
          <thead><tr className="text-left text-slate-500 border-b">
            <th className="py-2">Correo</th><th>Nombre</th><th>Cargo</th><th>Empresa</th><th>Admin</th><th>Activo</th><th>Rol</th><th></th>
          </tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="py-2">{u.email}</td>
                <td>{u.name}</td>
                <td className={`text-[12px] ${u.cargo ? 'text-slate-700' : 'text-slate-400 italic'}`}>{u.cargo || 'Sin definir'}</td>
                <td className={`text-[12px] ${u.empresa ? 'text-slate-700' : 'text-slate-400 italic'}`}>{u.empresa || 'Sin definir'}</td>
                <td>{u.isAdmin ? 'Sí' : 'No'}</td>
                <td>{u.active ? 'Sí' : 'No'}</td>
                <td>
                  {u.isAdmin ? (
                    <span className="text-[12px] text-slate-400 italic">Acceso total (Admin)</span>
                  ) : (
                    <select value={u.roleId ?? ''} onChange={(e) => changeRole(u, e.target.value)} className="border border-slate-200 rounded p-1 text-[12px]">
                      <option value="">— Sin rol —</option>
                      {roles.filter((r) => r.active).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  )}
                </td>
                <td className="text-right whitespace-nowrap">
                  <button onClick={() => setEditando(u)} className="text-[12px] text-blue-600 mr-3">Editar</button>
                  <button onClick={() => toggleAdmin(u)} className="text-[12px] text-blue-600 mr-3">{u.isAdmin ? 'Quitar admin' : 'Hacer admin'}</button>
                  <button onClick={() => toggleActive(u)} className="text-[12px] text-blue-600 mr-3">{u.active ? 'Desactivar' : 'Activar'}</button>
                  <button onClick={() => resetPassword(u)} className="text-[12px] text-blue-600">Resetear contraseña</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {creating && <CreateUser roles={roles} onClose={() => setCreating(false)} onCreated={() => { setCreating(false); reload() }} />}
      {editando && <EditarUsuario usuario={editando} onClose={() => setEditando(null)} onGuardado={() => { setEditando(null); reload() }} />}
    </div>
  )
}

function CreateUser({ roles, onClose, onCreated }: { roles: Role[]; onClose: () => void; onCreated: () => void }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  // Empresa prellenada: casi todos los usuarios son personal de Ambientalia; quien no, la sobreescribe.
  const [cargo, setCargo] = useState('')
  const [empresa, setEmpresa] = useState('Ambientalia S.A.S.')
  const [isAdmin, setIsAdmin] = useState(false)
  const [roleId, setRoleId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null)
    // Un admin nunca lleva rol (lo cortocircuita): se descarta aunque se hubiera elegido antes de marcar la casilla.
    try { await createUser({ email, name, password, isAdmin, roleId: isAdmin ? null : roleId || null, cargo, empresa }); onCreated() }
    catch (err) { setError(err instanceof Error ? err.message : String(err)) }
    finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-lg p-5 w-[400px] flex flex-col gap-3">
        <h3 className="text-[15px] font-bold text-slate-800">Nuevo usuario</h3>
        <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required className="border border-slate-200 rounded p-2 text-[13px]" />
        <input type="text" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} required className="border border-slate-200 rounded p-2 text-[13px]" />
        <input type="text" placeholder="Cargo (opcional)" value={cargo} onChange={(e) => setCargo(e.target.value)} className="border border-slate-200 rounded p-2 text-[13px]" />
        <input type="text" placeholder="Empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)} className="border border-slate-200 rounded p-2 text-[13px]" />
        <input type="password" placeholder="Contraseña inicial (mín. 8)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="border border-slate-200 rounded p-2 text-[13px]" />
        {isAdmin ? (
          <select disabled className="border border-slate-200 rounded p-2 text-[13px] bg-slate-50 text-slate-400">
            <option>Acceso total (Admin)</option>
          </select>
        ) : (
          <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="border border-slate-200 rounded p-2 text-[13px]">
            <option value="">— Sin rol —</option>
            {roles.filter((r) => r.active).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        )}
        <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} /> Administrador</label>
        {error && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-[13px] text-slate-600">Cancelar</button>
          <button type="submit" disabled={busy} className="px-4 py-1.5 bg-[#2C7BE5] text-white rounded text-[13px] font-bold disabled:opacity-50">{busy ? 'Creando…' : 'Crear'}</button>
        </div>
      </form>
    </div>
  )
}

/**
 * Edita QUIÉN es la persona: correo, nombre, cargo y empresa.
 *
 * No toca Admin, Activo ni Rol a propósito: esos tres ya tienen su control en la fila, y repetirlos
 * aquí serían dos formas de hacer lo mismo con el riesgo de que una pisara a la otra.
 */
function EditarUsuario({ usuario, onClose, onGuardado }: { usuario: UserPublic; onClose: () => void; onGuardado: () => void }) {
  const [email, setEmail] = useState(usuario.email)
  const [name, setName] = useState(usuario.name)
  const [cargo, setCargo] = useState(usuario.cargo ?? '')
  const [empresa, setEmpresa] = useState(usuario.empresa ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null)
    try { await updateUser(usuario.id, { email, name, cargo, empresa }); onGuardado() }
    catch (err) { setError(err instanceof Error ? err.message : String(err)) }
    finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-lg p-5 w-[400px] flex flex-col gap-3">
        <h3 className="text-[15px] font-bold text-slate-800">Editar usuario</h3>
        <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required className="border border-slate-200 rounded p-2 text-[13px]" />
        <input type="text" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} required className="border border-slate-200 rounded p-2 text-[13px]" />
        <input type="text" placeholder="Cargo (opcional)" value={cargo} onChange={(e) => setCargo(e.target.value)} className="border border-slate-200 rounded p-2 text-[13px]" />
        <input type="text" placeholder="Empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)} className="border border-slate-200 rounded p-2 text-[13px]" />
        {/* Cambiar el correo no cierra su sesión —van por id— pero a partir de ahora entra con el nuevo. */}
        <p className="text-[11px] text-slate-400">Si cambias el correo, avísale: es con el que iniciará sesión.</p>
        {error && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-[13px] text-slate-600">Cancelar</button>
          <button type="submit" disabled={busy} className="px-4 py-1.5 bg-[#2C7BE5] text-white rounded text-[13px] font-bold disabled:opacity-50">{busy ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </div>
  )
}
