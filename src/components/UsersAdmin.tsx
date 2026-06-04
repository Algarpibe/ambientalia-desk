import { useEffect, useState } from 'react'
import type { UserPublic } from '../../shared/types'
import { listUsers, createUser, updateUser, listRoles, type Role } from '../api/client'

export function UsersAdmin({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<UserPublic[]>([])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  useEffect(() => { listRoles().then(setRoles).catch(() => {}) }, [])

  async function reload() {
    try { setUsers(await listUsers()) } catch (e) { setError(String(e instanceof Error ? e.message : e)) }
  }
  useEffect(() => { reload() }, [])

  async function toggleActive(u: UserPublic) {
    await updateUser(u.id, { active: !u.active }); reload()
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
            <th className="py-2">Correo</th><th>Nombre</th><th>Admin</th><th>Activo</th><th>Rol</th><th></th>
          </tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="py-2">{u.email}</td>
                <td>{u.name}</td>
                <td>{u.isAdmin ? 'Sí' : 'No'}</td>
                <td>{u.active ? 'Sí' : 'No'}</td>
                <td>
                  <select value={u.roleId ?? ''} onChange={(e) => changeRole(u, e.target.value)} className="border border-slate-200 rounded p-1 text-[12px]">
                    <option value="">— Sin rol —</option>
                    {roles.filter((r) => r.active).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </td>
                <td className="text-right">
                  <button onClick={() => toggleActive(u)} className="text-[12px] text-blue-600 mr-3">{u.active ? 'Desactivar' : 'Activar'}</button>
                  <button onClick={() => resetPassword(u)} className="text-[12px] text-blue-600">Resetear contraseña</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {creating && <CreateUser onClose={() => setCreating(false)} onCreated={() => { setCreating(false); reload() }} />}
    </div>
  )
}

function CreateUser({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null)
    try { await createUser({ email, name, password, isAdmin }); onCreated() }
    catch (err) { setError(err instanceof Error ? err.message : String(err)) }
    finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-lg p-5 w-[400px] flex flex-col gap-3">
        <h3 className="text-[15px] font-bold text-slate-800">Nuevo usuario</h3>
        <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required className="border border-slate-200 rounded p-2 text-[13px]" />
        <input type="text" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} required className="border border-slate-200 rounded p-2 text-[13px]" />
        <input type="password" placeholder="Contraseña inicial (mín. 8)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="border border-slate-200 rounded p-2 text-[13px]" />
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
