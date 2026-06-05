import { useMemo, useState } from 'react'
import type { ContactLite, AccountLite } from '../../shared/types'
import { useAsync } from '../hooks/useAsync'
import { fetchContacts, fetchAccounts } from '../api/client'

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
function inicial(s: string): string { const c = (s.trim()[0] || '#').toUpperCase(); return /[A-Z]/.test(c) ? c : '#' }
function iniciales(name: string): string { return name.split(/\s+/).map((p) => p[0] ?? '').slice(0, 2).join('').toUpperCase() }

export function ClientesPage({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'contactos' | 'empresas'>('contactos')
  const [q, setQ] = useState('')
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

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col">
      <div className="bg-[#2C2E3E] text-white h-[48px] flex items-center px-4 gap-3 shrink-0">
        <button onClick={onClose} className="hover:bg-white/10 p-1 rounded"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="text-[15px] font-bold">Clientes</h1>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[220px] border-r border-slate-200 bg-white flex flex-col shrink-0">
          <div className="px-4 pt-3 text-[11px] font-bold text-slate-400">VISTAS CON ESTRELLAS</div>
          <div className="px-4 py-2 text-[13px] bg-blue-50 text-blue-600 font-medium">{tab === 'contactos' ? 'Todos los Contactos' : 'Todas las Empresas'}</div>
          <div className="px-4 pt-4 text-[11px] font-bold text-slate-400">TODAS LAS VISTAS</div>
          <div className="mt-auto border-t border-slate-200 flex">
            <button onClick={() => setTab('contactos')} className={`flex-1 py-2 text-[12px] ${tab === 'contactos' ? 'text-blue-600 font-bold border-t-2 border-blue-500 -mt-px' : 'text-slate-500'}`}>Contactos</button>
            <button onClick={() => setTab('empresas')} className={`flex-1 py-2 text-[12px] ${tab === 'empresas' ? 'text-blue-600 font-bold border-t-2 border-blue-500 -mt-px' : 'text-slate-500'}`}>Empresas</button>
          </div>
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="border-b border-slate-200 px-4 py-2 flex items-center gap-3">
            <span className="material-symbols-outlined text-[18px] text-amber-400">star</span>
            <h2 className="text-[14px] font-semibold text-slate-700">{tab === 'contactos' ? 'Todos los Contactos' : 'Todas las Empresas'}</h2>
            <span className="text-[12px] text-slate-400">{rows.length} total</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className="ml-auto border border-slate-200 rounded px-3 py-1 text-[13px] w-[260px]" />
          </div>
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              {rows.length === 0 && <div className="p-4 text-[13px] text-slate-400">Sin resultados.</div>}
              {rows.map((r) => (
                <div key={r.id} id={`row-${r.id}`} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 hover:bg-slate-50">
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[12px] font-bold shrink-0">{iniciales(r.name)}</div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-slate-800 truncate">{r.name}</div>
                    {r.lines && <div className="text-[12px] text-slate-500 truncate">{r.lines}</div>}
                  </div>
                </div>
              ))}
            </div>
            <div className="w-7 flex flex-col items-center justify-center text-[10px] select-none shrink-0">
              {LETRAS.map((l) => (
                <button key={l} onClick={() => jump(l)} disabled={!lettersPresent.has(l)} className={`leading-tight ${lettersPresent.has(l) ? 'text-blue-500 hover:font-bold' : 'text-slate-300 cursor-default'}`}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
