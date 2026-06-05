import { useEffect, useState } from 'react'
import type { EquipoFull, ClientLite } from '../../shared/types'
import { listEquiposManage, equipoFacets, createEquipo, updateEquipo, setEquipoActive, searchClients } from '../api/client'

export function EquiposAdmin({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<EquipoFull[]>([])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<EquipoFull | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    try { setItems((await listEquiposManage(search, 1)).items) }
    catch (e) { setError(String(e instanceof Error ? e.message : e)) }
  }
  useEffect(() => { reload() }, [search])

  async function toggleActive(e: EquipoFull) {
    try { await setEquipoActive(e.id, !e.active); reload() }
    catch (err) { alert('Error: ' + String(err instanceof Error ? err.message : err)) }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col">
      <div className="bg-[#2C2E3E] text-white h-[48px] flex items-center px-4 gap-3 shrink-0">
        <button onClick={onClose} className="hover:bg-white/10 p-1 rounded"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="text-[15px] font-bold">Equipos</h1>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por serie, cliente, marca, modelo, tipo…" className="ml-4 bg-white/10 text-white placeholder-white/50 rounded px-3 py-1.5 text-[13px] w-[360px] outline-none" />
        <button onClick={() => setCreating(true)} className="ml-auto bg-[#2C7BE5] text-white px-3 py-1.5 rounded text-[13px] font-bold">Nuevo equipo</button>
      </div>
      {error && <div className="bg-red-50 text-red-700 text-[12px] px-4 py-2">{error}</div>}
      <div className="flex-1 overflow-auto p-4">
        <table className="w-full text-[13px]">
          <thead><tr className="text-left text-slate-500 border-b">
            <th className="py-2">Serie</th><th>Marca</th><th>Modelo</th><th>Tipo</th><th>Cliente</th><th>Estado</th><th></th>
          </tr></thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id} className={`border-b ${e.active ? '' : 'opacity-50'}`}>
                <td className="py-2 font-bold">{e.serial}</td>
                <td>{e.marca}</td><td>{e.modelo}</td><td>{e.tipo}</td><td>{e.clienteNombre}</td>
                <td>{e.active ? 'Activo' : 'Inactivo'}</td>
                <td className="text-right whitespace-nowrap">
                  <button onClick={() => setEditing(e)} className="text-[12px] text-blue-600 mr-3">Editar</button>
                  <button onClick={() => toggleActive(e)} className="text-[12px] text-blue-600">{e.active ? 'Desactivar' : 'Activar'}</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-slate-400">Sin equipos.</td></tr>}
          </tbody>
        </table>
      </div>
      {(creating || editing) && (
        <EquipoForm equipo={editing} onClose={() => { setCreating(false); setEditing(null) }} onSaved={() => { setCreating(false); setEditing(null); reload() }} />
      )}
    </div>
  )
}

function EquipoForm({ equipo, onClose, onSaved }: { equipo: EquipoFull | null; onClose: () => void; onSaved: () => void }) {
  const [serial, setSerial] = useState(equipo?.serial ?? '')
  const [marca, setMarca] = useState(equipo?.marca ?? '')
  const [modelo, setModelo] = useState(equipo?.modelo ?? '')
  const [tipo, setTipo] = useState(equipo?.tipo ?? '')
  const [clientId, setClientId] = useState<string | null>(equipo?.clientId ?? null)
  const [clientName, setClientName] = useState(equipo?.clienteNombre ?? '')
  const [clientQuery, setClientQuery] = useState(equipo?.clienteNombre ?? '')
  const [clientResults, setClientResults] = useState<ClientLite[]>([])
  const [facets, setFacets] = useState<{ marcas: string[]; tipos: string[] }>({ marcas: [], tipos: [] })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { equipoFacets().then(setFacets).catch(() => {}) }, [])
  useEffect(() => {
    if (clientQuery.trim().length < 2) { setClientResults([]); return }
    let alive = true
    searchClients(clientQuery).then((r) => { if (alive) setClientResults(r) }).catch(() => {})
    return () => { alive = false }
  }, [clientQuery])

  async function submit(ev: React.FormEvent) {
    ev.preventDefault(); setBusy(true); setError(null)
    try {
      const payload = { serial, marca: marca || null, modelo: modelo || null, tipo: tipo || null, clientId: clientId ?? undefined }
      if (equipo) await updateEquipo(equipo.id, payload)
      else await createEquipo(payload)
      onSaved()
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setBusy(false) }
  }

  const field = 'border border-slate-200 rounded p-2 text-[13px]'
  const marcas = !marca || facets.marcas.includes(marca) ? facets.marcas : [marca, ...facets.marcas]
  const tipos = !tipo || facets.tipos.includes(tipo) ? facets.tipos : [tipo, ...facets.tipos]

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-lg p-5 w-[480px] max-h-[90vh] overflow-auto flex flex-col gap-3">
        <h3 className="text-[15px] font-bold text-slate-800">{equipo ? 'Editar equipo' : 'Nuevo equipo'}</h3>
        <input className={field} placeholder="Número de serie *" value={serial} onChange={(e) => setSerial(e.target.value)} required />
        <div className="grid grid-cols-2 gap-2">
          <select className={field} value={marca} onChange={(e) => setMarca(e.target.value)}>
            <option value="">Marca…</option>
            {marcas.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <input className={field} placeholder="Modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} />
        </div>
        <select className={field} value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="">Tipo de equipo…</option>
          {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="relative">
          <input className={`${field} w-full`} placeholder="Cliente (Books) *" value={clientQuery}
            onChange={(e) => { setClientQuery(e.target.value); setClientId(null); setClientName(e.target.value) }} required={!equipo && !clientId} />
          {clientResults.length > 0 && (
            <ul className="absolute z-10 bg-white border border-slate-200 rounded w-full max-h-44 overflow-auto shadow">
              {clientResults.map((c) => (
                <li key={c.id}><button type="button" onClick={() => { setClientId(c.id); setClientName(c.name); setClientQuery(c.name); setClientResults([]) }} className="w-full text-left px-2 py-1.5 text-[12px] hover:bg-slate-100">{c.name} {c.nit ? `· NIT ${c.nit}` : ''}</button></li>
              ))}
            </ul>
          )}
          {clientId && <div className="text-[11px] text-slate-400 mt-1">Cliente vinculado: {clientName}</div>}
        </div>
        {error && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-[13px] text-slate-600">Cancelar</button>
          <button type="submit" disabled={busy} className="px-4 py-1.5 bg-[#2C7BE5] text-white rounded text-[13px] font-bold disabled:opacity-50">{busy ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </div>
  )
}
