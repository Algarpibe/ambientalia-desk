import { useEffect, useState } from 'react'
import { AREAS } from '../../shared/transitions'
import { listRoles, createRole, updateRole, type Role } from '../api/client'

export function RolesAdmin({ onClose }: { onClose: () => void }) {
  const [roles, setRoles] = useState<Role[]>([])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    try { setRoles(await listRoles()) } catch (e) { setError(String(e instanceof Error ? e.message : e)) }
  }
  useEffect(() => { reload() }, [])

  async function toggleActive(r: Role) { await updateRole(r.id, { active: !r.active }); reload() }
  async function toggleArea(r: Role, area: string) {
    const areas = r.areas.includes(area) ? r.areas.filter((a) => a !== area) : [...r.areas, area]
    await updateRole(r.id, { areas }); reload()
  }

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col">
      <div className="bg-[#2C2E3E] text-white h-[48px] flex items-center px-4 gap-3 shrink-0">
        <button onClick={onClose} className="hover:bg-white/10 p-1 rounded"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="text-[15px] font-bold">Roles y permisos</h1>
        <button onClick={() => setCreating(true)} className="ml-auto bg-[#2C7BE5] text-white px-3 py-1.5 rounded text-[13px] font-bold">Nuevo rol</button>
      </div>
      {error && <div className="bg-red-50 text-red-700 text-[12px] px-4 py-2">{error}</div>}
      <div className="flex-1 overflow-auto p-4">
        <table className="w-full text-[13px]">
          <thead><tr className="text-left text-slate-500 border-b">
            <th className="py-2">Rol</th>{AREAS.map((a) => <th key={a} className="px-2">{a}</th>)}<th>Activo</th><th></th>
          </tr></thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="py-2 font-medium">{r.name}</td>
                {AREAS.map((a) => (
                  <td key={a} className="px-2 text-center">
                    <input type="checkbox" checked={r.areas.includes(a)} onChange={() => toggleArea(r, a)} className="accent-blue-600" />
                  </td>
                ))}
                <td>{r.active ? 'Sí' : 'No'}</td>
                <td className="text-right">
                  <button onClick={() => toggleActive(r)} className="text-[12px] text-blue-600">{r.active ? 'Desactivar' : 'Activar'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[11px] text-slate-400 mt-3">Cada rol puede ejecutar las transiciones de las áreas marcadas. Un rol con las 3 áreas equivale a "Gerencia/Director".</p>
      </div>
      {creating && <CreateRole onClose={() => setCreating(false)} onCreated={() => { setCreating(false); reload() }} />}
    </div>
  )
}

function CreateRole({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [areas, setAreas] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function toggle(area: string) {
    setAreas((s) => (s.includes(area) ? s.filter((a) => a !== area) : [...s, area]))
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null)
    try { await createRole({ name, areas }); onCreated() }
    catch (err) { setError(err instanceof Error ? err.message : String(err)) }
    finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-lg p-5 w-[400px] flex flex-col gap-3">
        <h3 className="text-[15px] font-bold text-slate-800">Nuevo rol</h3>
        <input type="text" placeholder="Nombre (p.ej. Técnico, Comercial, Gerencia)" value={name} onChange={(e) => setName(e.target.value)} required className="border border-slate-200 rounded p-2 text-[13px]" />
        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-medium text-slate-600">Áreas</span>
          {AREAS.map((a) => (
            <label key={a} className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={areas.includes(a)} onChange={() => toggle(a)} /> {a}</label>
          ))}
        </div>
        {error && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-[13px] text-slate-600">Cancelar</button>
          <button type="submit" disabled={busy} className="px-4 py-1.5 bg-[#2C7BE5] text-white rounded text-[13px] font-bold disabled:opacity-50">{busy ? 'Creando…' : 'Crear'}</button>
        </div>
      </form>
    </div>
  )
}
