import { useMemo, useState } from 'react'
import type { ContactLite, AccountLite } from '../../shared/types'
import { useAsync } from '../hooks/useAsync'
import { fetchContacts, fetchAccounts } from '../api/client'
import { ClienteDetalle } from './ClienteDetalle'

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
function inicial(s: string): string { const c = (s.trim()[0] || '#').toUpperCase(); return /[A-Z]/.test(c) ? c : '#' }
function iniciales(name: string): string { return name.split(/\s+/).map((p) => p[0] ?? '').slice(0, 2).join('').toUpperCase() }

export function ClientesPage({ onClose, onSelectTicket, onAgregarTicket }: { onClose: () => void; onSelectTicket: (id: string) => void; onAgregarTicket: () => void }) {
  const [tab, setTab] = useState<'contactos' | 'empresas'>('contactos')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<{ kind: 'contacto' | 'empresa'; id: string } | null>(null)
  const { data: contactos } = useAsync<ContactLite[]>(() => fetchContacts(), [])
  const { data: empresas } = useAsync<AccountLite[]>(() => fetchAccounts(), [])

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase()
    if (tab === 'contactos') {
      return (contactos ?? [])
        .filter((c) => !ql || c.name.toLowerCase().includes(ql) || (c.company ?? '').toLowerCase().includes(ql) || (c.email ?? '').toLowerCase().includes(ql))
        .map((c) => ({ id: c.id, name: c.name, letter: inicial(c.name), lines: [c.company, c.email, c.phone].filter(Boolean).join('  ·  ') }))
    }
    return (empresas ?? [])
      .filter((e) => !ql || e.name.toLowerCase().includes(ql) || (e.nit ?? '').includes(ql))
      .map((e) => ({ id: e.id, name: e.name, letter: inicial(e.name), lines: [e.nit ? `NIT ${e.nit}` : null, e.email, e.phone, e.city].filter(Boolean).join('  ·  ') }))
  }, [tab, q, contactos, empresas])

  const lettersPresent = useMemo(() => new Set(rows.map((r) => r.letter)), [rows])
  const firstByLetter = useMemo(() => { const m: Record<string, string> = {}; for (const r of rows) if (!m[r.letter]) m[r.letter] = r.id; return m }, [rows])
  function jump(l: string) { const id = firstByLetter[l]; if (id) document.getElementById(`row-${id}`)?.scrollIntoView({ block: 'start' }) }
  const kind: 'contacto' | 'empresa' = tab === 'contactos' ? 'contacto' : 'empresa'

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col">
      <div className="bg-[#2C2E3E] text-white h-[48px] flex items-center px-4 gap-3 shrink-0">
        <button onClick={onClose} className="hover:bg-white/10 p-1 rounded"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="text-[15px] font-bold">Clientes</h1>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[200px] border-r border-slate-200 bg-white flex flex-col shrink-0">
          <div className="px-4 pt-3 text-[11px] font-bold text-slate-400">VISTAS CON ESTRELLAS</div>
          <div className="px-4 py-2 text-[13px] bg-blue-50 text-blue-600 font-medium">{tab === 'contactos' ? 'Todos los Contactos' : 'Todas las Empresas'}</div>
          <div className="px-4 pt-4 text-[11px] font-bold text-slate-400">TODAS LAS VISTAS</div>
          <div className="mt-auto border-t border-slate-200 flex">
            <button onClick={() => { setTab('contactos'); setSelected(null) }} className={`flex-1 py-2 text-[12px] ${tab === 'contactos' ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>Contactos</button>
            <button onClick={() => { setTab('empresas'); setSelected(null) }} className={`flex-1 py-2 text-[12px] ${tab === 'empresas' ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>Empresas</button>
          </div>
        </div>
        <div className="w-[320px] border-r border-slate-200 flex flex-col shrink-0 min-w-0">
          <div className="border-b border-slate-200 px-3 py-2 flex items-center gap-2">
            <span className="text-[13px] font-semibold text-slate-700">{rows.length}</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className="ml-auto border border-slate-200 rounded px-2 py-1 text-[12px] w-[170px]" />
          </div>
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              {rows.length === 0 && <div className="p-4 text-[13px] text-slate-400">Sin resultados.</div>}
              {rows.map((r) => (
                <button key={r.id} id={`row-${r.id}`} onClick={() => setSelected({ kind, id: r.id })} className={`w-full text-left flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 hover:bg-slate-50 ${selected?.id === r.id ? 'bg-blue-50' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-bold shrink-0">{iniciales(r.name)}</div>
                  <div className="min-w-0"><div className="text-[13px] font-bold text-slate-800 truncate">{r.name}</div>{r.lines && <div className="text-[11px] text-slate-500 truncate">{r.lines}</div>}</div>
                </button>
              ))}
            </div>
            <div className="w-6 flex flex-col items-center justify-between py-2 text-[10px] select-none shrink-0">
              {LETRAS.map((l) => (
                <button key={l} onClick={() => jump(l)} disabled={!lettersPresent.has(l)} className={`leading-none ${lettersPresent.has(l) ? 'text-blue-500 hover:font-bold' : 'text-slate-300 cursor-default'}`}>{l}</button>
              ))}
            </div>
          </div>
        </div>
        {selected
          ? <ClienteDetalle key={`${selected.kind}-${selected.id}`} kind={selected.kind} id={selected.id} onSelectTicket={onSelectTicket} onSelectContacto={(cid) => setSelected({ kind: 'contacto', id: cid })} onAgregarTicket={onAgregarTicket} />
          : <div className="flex-1 flex items-center justify-center text-slate-400 text-[13px]">Selecciona un contacto o empresa.</div>}
      </div>
    </div>
  )
}
