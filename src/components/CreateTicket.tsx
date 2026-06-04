import { useEffect, useMemo, useState } from 'react'
import type { ClientLite, SalesOrderLite } from '../../shared/types'
import { PREFIJOS, TIPOS_SERVICIO, CLASIFICACIONES, buildCodigoServicio, buildSubject, parseCodigoFromPotential } from '../../shared/ticketCreate'
import { searchClients, searchSalesOrders, createTicket } from '../api/client'

export function CreateTicket({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [ovQuery, setOvQuery] = useState('')
  const [ovResults, setOvResults] = useState<SalesOrderLite[]>([])
  const [salesOrderId, setSalesOrderId] = useState<string | null>(null)

  const [clientQuery, setClientQuery] = useState('')
  const [clientResults, setClientResults] = useState<ClientLite[]>([])
  const [clientId, setClientId] = useState<string | null>(null)
  const [clientName, setClientName] = useState('')

  const [tipoServicio, setTipoServicio] = useState('')
  const [clasificaciones, setClasificaciones] = useState('')
  const [tipoEquipo, setTipoEquipo] = useState('')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [serie, setSerie] = useState('')
  const [prefijo, setPrefijo] = useState('MT')
  const [ordenVenta, setOrdenVenta] = useState('')
  const [prioridad, setPrioridad] = useState('')

  const [subjectOverride, setSubjectOverride] = useState<string | null>(null)
  const [codigoOverride, setCodigoOverride] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (ovQuery.trim().length < 2) { setOvResults([]); return }
    let alive = true
    searchSalesOrders(ovQuery).then((r) => { if (alive) setOvResults(r) }).catch(() => {})
    return () => { alive = false }
  }, [ovQuery])
  useEffect(() => {
    if (clientQuery.trim().length < 2) { setClientResults([]); return }
    let alive = true
    searchClients(clientQuery).then((r) => { if (alive) setClientResults(r) }).catch(() => {})
    return () => { alive = false }
  }, [clientQuery])

  const codigo = codigoOverride ?? buildCodigoServicio({ prefijo, serie, modelo, fecha: new Date() })
  const subject = useMemo(
    () => subjectOverride ?? buildSubject({ cliente: clientName, tipoEquipo, codigo }),
    [subjectOverride, clientName, tipoEquipo, codigo],
  )

  function pickOv(ov: SalesOrderLite) {
    setSalesOrderId(ov.id)
    setOvQuery(ov.number)
    setOvResults([])
    if (ov.clientId) setClientId(ov.clientId)
    if (ov.customerName) { setClientName(ov.customerName); setClientQuery(ov.customerName) }
    setOrdenVenta(ov.number)
    const parsed = parseCodigoFromPotential(ov.potentialName)
    if (parsed) { setPrefijo(parsed.prefijo); setSerie(parsed.serie); setModelo(parsed.modelo) }
  }

  function pickClient(c: ClientLite) {
    setClientId(c.id)
    setClientName(c.name)
    setClientQuery(c.name)
    setClientResults([])
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null)
    try {
      await createTicket({
        salesOrderId: salesOrderId ?? undefined,
        clientId: clientId ?? undefined,
        tipoServicio, clasificaciones, tipoEquipo, marca, modelo, serie, prefijo,
        ordenVenta: ordenVenta || undefined,
        prioridad: prioridad || undefined,
        subject, codigoServicio: codigo,
      })
      onCreated()
    } catch (err) { setError(err instanceof Error ? err.message : String(err)) }
    finally { setBusy(false) }
  }

  const field = 'border border-slate-200 rounded p-2 text-[13px]'

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-lg p-5 w-[560px] max-h-[90vh] overflow-auto flex flex-col gap-3">
        <h3 className="text-[15px] font-bold text-slate-800">Nuevo ticket</h3>

        <div className="relative">
          <label className="text-[11px] font-bold text-slate-500 uppercase">Orden de Venta (opcional)</label>
          <input className={`${field} w-full`} placeholder="Buscar OV (número o cliente)…" value={ovQuery}
            onChange={(e) => { setOvQuery(e.target.value); setSalesOrderId(null) }} />
          {ovResults.length > 0 && (
            <ul className="absolute z-10 bg-white border border-slate-200 rounded w-full max-h-44 overflow-auto shadow">
              {ovResults.map((ov) => (
                <li key={ov.id}><button type="button" onClick={() => pickOv(ov)} className="w-full text-left px-2 py-1.5 text-[12px] hover:bg-slate-100">
                  <b>{ov.number}</b> — {ov.customerName ?? ''} {ov.ticketNumber ? `· ticket ${ov.ticketNumber}` : ''}
                </button></li>
              ))}
            </ul>
          )}
        </div>

        <div className="relative">
          <label className="text-[11px] font-bold text-slate-500 uppercase">Cliente *</label>
          <input className={`${field} w-full`} placeholder="Buscar cliente…" value={clientQuery}
            onChange={(e) => { setClientQuery(e.target.value); setClientId(null); setClientName(e.target.value) }} required={!clientId} />
          {clientResults.length > 0 && (
            <ul className="absolute z-10 bg-white border border-slate-200 rounded w-full max-h-44 overflow-auto shadow">
              {clientResults.map((c) => (
                <li key={c.id}><button type="button" onClick={() => pickClient(c)} className="w-full text-left px-2 py-1.5 text-[12px] hover:bg-slate-100">
                  {c.name} {c.nit ? `· NIT ${c.nit}` : ''}
                </button></li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select className={field} value={tipoServicio} onChange={(e) => setTipoServicio(e.target.value)} required>
            <option value="">Tipo de Servicio *</option>
            {TIPOS_SERVICIO.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className={field} value={clasificaciones} onChange={(e) => setClasificaciones(e.target.value)} required>
            <option value="">Clasificaciones *</option>
            {CLASIFICACIONES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input className={field} placeholder="Tipo de equipo *" value={tipoEquipo} onChange={(e) => setTipoEquipo(e.target.value)} required />
          <input className={field} placeholder="Marca *" value={marca} onChange={(e) => setMarca(e.target.value)} required />
          <input className={field} placeholder="Modelo *" value={modelo} onChange={(e) => setModelo(e.target.value)} required />
          <input className={field} placeholder="Número de serie *" value={serie} onChange={(e) => setSerie(e.target.value)} required />
          <select className={field} value={prefijo} onChange={(e) => setPrefijo(e.target.value)}>
            {PREFIJOS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className={field} value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
            <option value="">Prioridad (opcional)</option>
            <option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
          </select>
          <input className={`${field} col-span-2`} placeholder="Orden de Venta (texto)" value={ordenVenta} onChange={(e) => setOrdenVenta(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase">Código Servicio</label>
          <input className={field} value={codigo} onChange={(e) => setCodigoOverride(e.target.value)} />
          <label className="text-[11px] font-bold text-slate-500 uppercase mt-1">Asunto</label>
          <input className={field} value={subject} onChange={(e) => setSubjectOverride(e.target.value)} />
        </div>

        {error && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-[13px] text-slate-600">Cancelar</button>
          <button type="submit" disabled={busy} className="px-4 py-1.5 bg-[#2C7BE5] text-white rounded text-[13px] font-bold disabled:opacity-50">{busy ? 'Creando…' : 'Crear ticket'}</button>
        </div>
      </form>
    </div>
  )
}
