import { useEffect, useMemo, useState } from 'react'
import type { ClientLite, SalesOrderLite, EquipoLite } from '@ambientalia/shared'
import { PREFIJOS, TIPOS_SERVICIO, CLASIFICACIONES, buildCodigoServicio, buildSubject, parseCodigoFromPotential, defaultPrefijoFor } from '@ambientalia/shared'
import { searchClients, searchSalesOrders, searchEquipos, createTicket } from '../api/client'

export function CreateTicket({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [ovQuery, setOvQuery] = useState('')
  const [ovResults, setOvResults] = useState<SalesOrderLite[]>([])
  const [salesOrderId, setSalesOrderId] = useState<string | null>(null)

  const [clientQuery, setClientQuery] = useState('')
  const [clientResults, setClientResults] = useState<ClientLite[]>([])
  const [clientId, setClientId] = useState<string | null>(null)
  const [clientName, setClientName] = useState('')

  const [equipoQuery, setEquipoQuery] = useState('')
  const [equipoResults, setEquipoResults] = useState<EquipoLite[]>([])
  const [equipo, setEquipo] = useState<EquipoLite | null>(null)

  const [tipoServicio, setTipoServicio] = useState('')
  const [clasificaciones, setClasificaciones] = useState('')
  const [prefijo, setPrefijo] = useState('MT')
  const [ordenVenta, setOrdenVenta] = useState('')
  const [prioridad, setPrioridad] = useState('')

  const [subjectOverride, setSubjectOverride] = useState<string | null>(null)
  const [codigoOverride, setCodigoOverride] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Qué desplegable está abierto: solo el del campo con foco, y como mucho uno a la vez.
  // Con esto el clic fuera lo cierra (vía blur) sin listeners en document, y una lista nunca
  // aparece sobre un campo que el usuario no está usando (p.ej. las OVs del cliente que
  // `pickEquipo` autocompleta: antes se abrían solas y no había forma de cerrarlas).
  type Combo = 'ov' | 'cliente' | 'equipo'
  const [openCombo, setOpenCombo] = useState<Combo | null>(null)
  const comboProps = (key: Combo) => ({
    onFocus: () => setOpenCombo(key),
    onBlur: () => setOpenCombo(null),
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Escape') setOpenCombo(null) },
  })
  // El blur del input se dispara ANTES del click en la opción: sin esto, la lista se
  // desmontaría antes de registrar la selección. También permite arrastrar su scrollbar.
  const keepFocus = { onMouseDown: (e: React.MouseEvent) => e.preventDefault() }

  // Los tres buscadores comparten una regla: si YA hay algo elegido, no se busca ni se reabre el
  // desplegable. Sin esto, elegir una opción reescribe el texto del input (y `pickOv` además el del
  // cliente) → el efecto se re-dispara y repuebla la lista, que queda abierta encima del campo
  // siguiente y aparenta un duplicado. Al escribir, el onChange limpia la selección y se vuelve a buscar.
  useEffect(() => {
    if (salesOrderId) { setOvResults([]); return }
    if (!clientId && ovQuery.trim().length < 2) { setOvResults([]); return }
    let alive = true
    searchSalesOrders(ovQuery, clientId ?? undefined).then((r) => { if (alive) setOvResults(r) }).catch(() => {})
    return () => { alive = false }
  }, [ovQuery, clientId, salesOrderId])
  useEffect(() => {
    if (clientId) { setClientResults([]); return }
    if (clientQuery.trim().length < 2) { setClientResults([]); return }
    let alive = true
    searchClients(clientQuery).then((r) => { if (alive) setClientResults(r) }).catch(() => {})
    return () => { alive = false }
  }, [clientQuery, clientId])
  useEffect(() => {
    if (equipo) { setEquipoResults([]); return }
    if (equipoQuery.trim().length < 2) { setEquipoResults([]); return }
    let alive = true
    searchEquipos(equipoQuery).then((r) => { if (alive) setEquipoResults(r) }).catch(() => {})
    return () => { alive = false }
  }, [equipoQuery, equipo])

  const codigo = codigoOverride ?? buildCodigoServicio({ prefijo, serie: equipo?.serial ?? '', modelo: equipo?.modelo ?? '', fecha: new Date() })
  const subject = useMemo(
    () => subjectOverride ?? buildSubject({ cliente: clientName, tipoEquipo: equipo?.tipo ?? '', codigo }),
    [subjectOverride, clientName, equipo, codigo],
  )

  function pickOv(ov: SalesOrderLite) {
    setSalesOrderId(ov.id)
    setOvQuery(ov.number)
    setOvResults([])
    if (ov.clientId) setClientId(ov.clientId)
    if (ov.customerName) { setClientName(ov.customerName); setClientQuery(ov.customerName) }
    setOrdenVenta(ov.number)
    const parsed = parseCodigoFromPotential(ov.potentialName)
    if (parsed) setPrefijo(parsed.prefijo)
  }
  function pickClient(c: ClientLite) {
    setClientId(c.id); setClientName(c.name); setClientQuery(c.name); setClientResults([])
  }
  function pickEquipo(e: EquipoLite) {
    setEquipo(e); setEquipoQuery(`${e.serial} · ${e.marca ?? ''} ${e.modelo ?? ''}`.trim()); setEquipoResults([])
    // Autocompletar el cliente con el dueño del equipo (buscando su cliente de Books).
    if (e.clienteNombre && !clientId) {
      setClientName(e.clienteNombre)
      setClientQuery(e.clienteNombre)
      const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
      searchClients(e.clienteNombre).then((res) => {
        const match = res.find((c) => norm(c.name) === norm(e.clienteNombre!)) ?? (res.length === 1 ? res[0] : null)
        if (match) { setClientId(match.id); setClientName(match.name); setClientQuery(match.name); setClientResults([]) }
      }).catch(() => {})
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null)
    try {
      if (!equipo) { setError('Selecciona un equipo registrado'); setBusy(false); return }
      await createTicket({
        salesOrderId: salesOrderId ?? undefined,
        clientId: clientId ?? undefined,
        equipoId: equipo.id,
        tipoServicio, clasificaciones, prefijo,
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
            {...comboProps('ov')}
            onChange={(e) => { setOvQuery(e.target.value); setSalesOrderId(null); setOpenCombo('ov') }} />
          {openCombo === 'ov' && ovResults.length > 0 && (
            <ul {...keepFocus} className="absolute z-10 bg-white border border-slate-200 rounded w-full max-h-44 overflow-auto shadow">
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
            {...comboProps('cliente')}
            onChange={(e) => { setClientQuery(e.target.value); setClientId(null); setClientName(e.target.value); setOpenCombo('cliente') }} required={!clientId} />
          {openCombo === 'cliente' && clientResults.length > 0 && (
            <ul {...keepFocus} className="absolute z-10 bg-white border border-slate-200 rounded w-full max-h-44 overflow-auto shadow">
              {clientResults.map((c) => (
                <li key={c.id}><button type="button" onClick={() => pickClient(c)} className="w-full text-left px-2 py-1.5 text-[12px] hover:bg-slate-100">
                  {c.name} {c.nit ? `· NIT ${c.nit}` : ''}
                </button></li>
              ))}
            </ul>
          )}
        </div>

        <div className="relative">
          <label className="text-[11px] font-bold text-slate-500 uppercase">Equipo * (por serie / cliente / modelo)</label>
          <input className={`${field} w-full`} placeholder="Buscar equipo registrado…" value={equipoQuery}
            {...comboProps('equipo')}
            onChange={(e) => { setEquipoQuery(e.target.value); setEquipo(null); setOpenCombo('equipo') }} required={!equipo} />
          {openCombo === 'equipo' && equipoResults.length > 0 && (
            <ul {...keepFocus} className="absolute z-10 bg-white border border-slate-200 rounded w-full max-h-44 overflow-auto shadow">
              {equipoResults.map((e) => (
                <li key={e.id}><button type="button" onClick={() => pickEquipo(e)} className="w-full text-left px-2 py-1.5 text-[12px] hover:bg-slate-100">
                  <b>{e.serial}</b> — {e.marca ?? ''} {e.modelo ?? ''} · {e.tipo ?? ''} <span className="text-slate-400">· {e.clienteNombre ?? ''}</span>
                </button></li>
              ))}
            </ul>
          )}
          {equipo && (
            <div className="mt-1 text-[12px] text-slate-600 bg-slate-50 border border-slate-200 rounded p-2">
              <b>{equipo.marca} {equipo.modelo}</b> · {equipo.tipo} · serie {equipo.serial}
              <span className="text-slate-400"> · dueño: {equipo.clienteNombre}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select className={field} value={tipoServicio} onChange={(e) => { setTipoServicio(e.target.value); setPrefijo(defaultPrefijoFor(e.target.value)); setCodigoOverride(null) }} required>
            <option value="">Tipo de Servicio *</option>
            {TIPOS_SERVICIO.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className={field} value={clasificaciones} onChange={(e) => setClasificaciones(e.target.value)} required>
            <option value="">Clasificaciones *</option>
            {CLASIFICACIONES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className={field} value={prefijo} onChange={(e) => setPrefijo(e.target.value)}>
            {PREFIJOS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className={field} value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
            <option value="">Prioridad (opcional)</option>
            <option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
          </select>
          {/* Solo si NO se eligió una OV arriba. Al elegirla, `pickOv` ya puso su número en
              `ordenVenta` y este campo se veía como un duplicado. Se mantiene para el caso
              contrario: registrar el número de una OV que todavía no existe en Books. */}
          {!salesOrderId && (
            <input className={`${field} col-span-2`} placeholder="Orden de Venta (si aún no está en Books)" value={ordenVenta} onChange={(e) => setOrdenVenta(e.target.value)} />
          )}
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
