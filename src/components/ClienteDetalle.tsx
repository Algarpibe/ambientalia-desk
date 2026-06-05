import { useMemo, useState } from 'react'
import type { ContactDetail, AccountDetail, TicketLite } from '../../shared/types'
import { useAsync } from '../hooks/useAsync'
import { fetchContactDetail, fetchAccountDetail } from '../api/client'

function iniciales(name: string): string { return name.split(/\s+/).map((p) => p[0] ?? '').slice(0, 2).join('').toUpperCase() }
function fmtFecha(s: string | null): string { if (!s) return ''; const d = new Date(s); return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) }
function fmtFechaHora(s: string | null): string { if (!s) return '—'; const d = new Date(s); return isNaN(d.getTime()) ? '—' : d.toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }

const CLOSED = 'Closed'
const esAbierto = (t: TicketLite) => t.statusType !== CLOSED
const esEspera = (t: TicketLite) => /espera/i.test(t.status)
const esAtrasado = (t: TicketLite) => !!t.dueDate && new Date(t.dueDate).getTime() < Date.now() && esAbierto(t)
function badgeClass(t: TicketLite): string {
  if (t.statusType === CLOSED || /finaliz/i.test(t.status)) return 'bg-green-50 text-green-600 border-green-200'
  if (/espera/i.test(t.status)) return 'bg-amber-50 text-amber-600 border-amber-200'
  return 'bg-blue-50 text-blue-600 border-blue-200'
}

const TABS_CONTACTO = ['INFORMACIÓN GENERAL', 'HISTORIA', 'ACTIVIDADES', 'INTERACCIÓN CON TICKET', 'TICKETS', 'ENTRADA DE TIEMPO', 'CALIFICACIÓN DE SATISFACCIÓN', 'PRODUCTOS']
const TABS_EMPRESA = ['INFORMACIÓN GENERAL', 'HISTORIA', 'ACTIVIDADES', 'INTERACCIÓN CON TICKET', 'TICKETS', 'ENTRADA DE TIEMPO', 'CONTACTOS', 'CALIFICACIÓN DE SATISFACCIÓN', 'PRODUCTOS']

function Prop({ label, value }: { label: string; value: string | null }) {
  return <div className="mb-4"><div className="text-[11px] text-slate-400">{label}</div><div className="text-[13px] text-slate-700 break-words">{value || '—'}</div></div>
}
function Kpi({ label, value, red, onClick }: { label: string; value: string; red?: boolean; onClick?: () => void }) {
  const inner = (
    <>
      <div className="text-[12px] text-slate-500">{label}</div>
      <div className={`text-[24px] font-bold ${onClick ? 'text-blue-600' : red ? 'text-red-500' : 'text-slate-800'}`}>{value}</div>
    </>
  )
  return onClick
    ? <button onClick={onClick} className="bg-white border border-slate-200 rounded-md p-4 text-left w-full hover:border-blue-300 cursor-pointer">{inner}</button>
    : <div className="bg-white border border-slate-200 rounded-md p-4">{inner}</div>
}
function TicketRow({ t, company, onClick }: { t: TicketLite; company: string | null; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left flex items-center gap-3 px-4 py-3 border-b border-slate-100 hover:bg-slate-50">
      <span className="material-symbols-outlined text-slate-300 text-[18px]">mail</span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-slate-700 truncate">{t.subject}</div>
        <div className="text-[11px] text-slate-400 truncate">{[t.number, company, fmtFecha(t.createdAt)].filter(Boolean).join(' · ')}</div>
      </div>
      <span className={`text-[11px] px-2 py-0.5 rounded border shrink-0 ${badgeClass(t)}`}>{t.status}</span>
    </button>
  )
}
function Tiempo({ label, value }: { label: string; value: string }) {
  return <div className="mb-3"><div className="flex justify-between text-[12px] text-slate-600"><span>{label}</span><span className="font-bold">{value}</span></div><div className="h-1 bg-slate-100 rounded mt-1"><div className="h-1 bg-blue-400 rounded" style={{ width: value === '00:00' ? '0%' : '60%' }} /></div></div>
}
function Donut({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const colors = ['#2C7BE5', '#22c55e', '#f59e0b', '#a855f7', '#64748b']
  const r = 52, c = 2 * Math.PI * r
  let acc = 0
  return (
    <div className="flex items-center gap-6">
      <svg width="130" height="130" viewBox="0 0 130 130" className="-rotate-90">
        <circle cx="65" cy="65" r={r} fill="none" stroke="#eef2f7" strokeWidth="16" />
        {data.map((d, i) => {
          const frac = d.value / total
          const el = <circle key={i} cx="65" cy="65" r={r} fill="none" stroke={colors[i % colors.length]} strokeWidth="16" strokeDasharray={`${frac * c} ${c}`} strokeDashoffset={-acc * c} />
          acc += frac
          return el
        })}
      </svg>
      <div className="flex flex-col gap-1 text-[12px]">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: colors[i % colors.length] }} />{d.value} {d.label} ({Math.round((d.value / total) * 100)}%)</div>
        ))}
      </div>
    </div>
  )
}

export function ClienteDetalle({ kind, id, onSelectTicket, onSelectContacto, onAgregarTicket }: {
  kind: 'contacto' | 'empresa'; id: string
  onSelectTicket: (id: string) => void
  onSelectContacto: (id: string) => void
  onAgregarTicket: () => void
}) {
  const { data, loading } = useAsync<ContactDetail | AccountDetail>(() => (kind === 'contacto' ? fetchContactDetail(id) : fetchAccountDetail(id)), [kind, id])
  const [tab, setTab] = useState('INFORMACIÓN GENERAL')
  const [sub, setSub] = useState<'todo' | 'abierto' | 'espera'>('todo')

  const tickets = useMemo(() => data?.tickets ?? [], [data])
  const abiertos = useMemo(() => tickets.filter(esAbierto), [tickets])
  const espera = useMemo(() => tickets.filter(esEspera), [tickets])
  const atrasados = useMemo(() => tickets.filter(esAtrasado), [tickets])
  const visibles = sub === 'abierto' ? abiertos : sub === 'espera' ? espera : tickets
  const canal = useMemo(() => {
    const m = new Map<string, number>()
    for (const t of tickets) { const k = t.channel || 'Otro'; m.set(k, (m.get(k) ?? 0) + 1) }
    return [...m.entries()].map(([label, value]) => ({ label, value }))
  }, [tickets])
  const resolucion = useMemo(() => {
    const cer = tickets.filter((t) => t.statusType === CLOSED && t.createdAt && t.closedAt)
    if (!cer.length) return '00:00'
    const ms = cer.reduce((s, t) => s + (new Date(t.closedAt!).getTime() - new Date(t.createdAt!).getTime()), 0) / cer.length
    return `${Math.floor(ms / 3600000)}:${String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0')}`
  }, [tickets])

  if (loading && !data) return <div className="flex-1 p-6 text-[13px] text-slate-400">Cargando…</div>
  if (!data) return <div className="flex-1 p-6 text-[13px] text-slate-400">No encontrado.</div>

  const acc = kind === 'empresa' ? (data as AccountDetail) : null
  const con = kind === 'contacto' ? (data as ContactDetail) : null
  const companyLabel = con?.company ?? acc?.name ?? null
  const tabs = kind === 'empresa' ? TABS_EMPRESA : TABS_CONTACTO

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="w-[290px] border-r border-slate-200 overflow-y-auto p-4 shrink-0">
        <div className="text-[13px] font-bold text-slate-700 mb-4">Propiedades de {kind === 'empresa' ? 'Empresa' : 'Contacto'}</div>
        <Prop label={`Propietario de ${kind === 'empresa' ? 'Empresa' : 'Contacto'}`} value={data.owner} />
        <Prop label="Correo electrónico" value={data.email} />
        {con && <Prop label="Número de móvil" value={con.mobile} />}
        <Prop label="Número de teléfono" value={data.phone} />
        {acc && <Prop label="Página web" value={acc.website} />}
        <Prop label="Dirección" value={acc?.address ?? null} />
        {acc && <Prop label="NIT" value={acc.nit} />}
        <Prop label={`Hora de creación de ${kind === 'empresa' ? 'Empresa' : 'Contact'}`} value={fmtFechaHora(data.createdAt)} />
        <Prop label="Diseño" value="Ambientalia Soporte y Servicio Técnico" />
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[13px] font-bold shrink-0">{iniciales(data.name)}</div>
          <div className="min-w-0">
            <div className="text-[16px] font-bold text-slate-800 truncate">{data.name}</div>
            {con?.company && <div className="text-[12px] text-slate-500 truncate">{con.company}</div>}
          </div>
          <button onClick={onAgregarTicket} className="ml-auto bg-[#2C7BE5] text-white px-3 py-1.5 rounded text-[13px] font-bold flex items-center gap-1 shrink-0"><span className="material-symbols-outlined text-[16px]">add</span>Agregar Ticket</button>
        </div>
        <nav className="px-6 flex gap-5 border-b border-slate-200 overflow-x-auto hide-scrollbar">
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`text-[11px] font-bold py-2 whitespace-nowrap ${tab === t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>{t}</button>
          ))}
        </nav>
        <div className="flex-1 overflow-y-auto p-6 bg-[#f7f8fa]">
          {tab === 'INFORMACIÓN GENERAL' && (
            <div className="flex flex-col gap-6 max-w-[1100px]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Kpi label="Todas las Tickets" value={String(tickets.length)} onClick={() => setTab('TICKETS')} />
                <Kpi label="Tickets abierto" value={String(abiertos.length)} />
                <Kpi label="Tickets atrasados" value={String(atrasados.length)} red />
                <Kpi label="Calificación de satisfacción" value="0 %" />
              </div>
              <section className="bg-white border border-slate-200 rounded-md">
                <div className="px-4 pt-3 text-[13px] font-bold text-slate-700">Tickets</div>
                <div className="px-4 flex gap-4 border-b border-slate-200 text-[12px]">
                  <button onClick={() => setSub('todo')} className={`py-2 ${sub === 'todo' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'text-slate-500'}`}>TODO ({tickets.length})</button>
                  <button onClick={() => setSub('abierto')} className={`py-2 ${sub === 'abierto' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'text-slate-500'}`}>ABIERTO ({abiertos.length})</button>
                  <button onClick={() => setSub('espera')} className={`py-2 ${sub === 'espera' ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'text-slate-500'}`}>EN ESPERA ({espera.length})</button>
                </div>
                {visibles.length === 0 && <div className="p-6 text-center text-[13px] text-slate-400">No hay ningún Tickets disponible</div>}
                {visibles.map((t) => <TicketRow key={t.id} t={t} company={companyLabel} onClick={() => onSelectTicket(t.id)} />)}
              </section>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <section className="bg-white border border-slate-200 rounded-md p-4">
                  <div className="text-[13px] font-bold text-slate-700 mb-3">Análisis del tráfico</div>
                  {tickets.length ? <Donut data={canal} /> : <div className="text-[13px] text-slate-400">Sin datos.</div>}
                </section>
                <section className="bg-white border border-slate-200 rounded-md p-4">
                  <div className="text-[13px] font-bold text-slate-700 mb-3">Tiempo promedio de operación <span className="text-[11px] text-slate-400 font-normal">Últimos 6 meses</span></div>
                  <Tiempo label="Tiempo de primera respuesta" value="00:00" />
                  <Tiempo label="Tiempo de respuesta" value="00:00" />
                  <Tiempo label="Tiempo de resolución" value={resolucion} />
                </section>
              </div>
            </div>
          )}
          {tab === 'CONTACTOS' && acc && (
            <div className="max-w-[700px] bg-white border border-slate-200 rounded-md divide-y divide-slate-100">
              {acc.contacts.length === 0 && <div className="p-4 text-[13px] text-slate-400">Sin contactos.</div>}
              {acc.contacts.map((c) => (
                <button key={c.id} onClick={() => onSelectContacto(c.id)} className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-bold">{iniciales(c.name)}</div>
                  <div className="min-w-0"><div className="text-[13px] font-bold text-slate-800 truncate">{c.name}</div><div className="text-[12px] text-slate-500 truncate">{[c.email, c.phone].filter(Boolean).join('  ·  ')}</div></div>
                </button>
              ))}
            </div>
          )}
          {tab === 'TICKETS' && (
            <div className="max-w-[1100px] bg-white border border-slate-200 rounded-md">
              <div className="px-4 py-3 text-[13px] font-bold text-slate-700">Todas Las Tickets ({tickets.length})</div>
              {tickets.length === 0 && <div className="p-6 text-center text-[13px] text-slate-400">No hay ningún Tickets disponible</div>}
              {tickets.map((t) => <TicketRow key={t.id} t={t} company={companyLabel} onClick={() => onSelectTicket(t.id)} />)}
            </div>
          )}
          {tab !== 'INFORMACIÓN GENERAL' && tab !== 'CONTACTOS' && tab !== 'TICKETS' && <div className="text-center text-[13px] text-slate-400 py-10">Pronto.</div>}
        </div>
      </div>
    </div>
  )
}
