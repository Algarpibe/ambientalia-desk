import { useEffect, useMemo, useState } from 'react'
import type { ClientLite, SalesOrderLite, EquipoLite } from '@ambientalia/shared'
import { PREFIJOS, TIPOS_SERVICIO, CLASIFICACIONES, buildCodigoServicio, buildSubject, parseCodigoFromPotential, defaultPrefijoFor } from '@ambientalia/shared'
import { searchClients, searchSalesOrders, searchEquipos, createTicket, fetchNextTicketNumber } from '../api/client'

export function CreateTicket({ onClose, onCreated }: {
  onClose: () => void
  /**
   * `conRemision` pide encadenar el formulario de remisión de entrada al ticket recién creado. El
   * equipo operativo suele recibir el equipo en el mismo acto de abrir el ticket, y obligarles a
   * buscarlo después para remisionarlo era un paso de más en el momento de más prisa.
   */
  onCreated: (ticketId: string, conRemision: boolean) => void
}) {
  // Sin marcar por defecto: no todo ticket nace con el equipo delante, y una remisión de más es un
  // documento en Drive que alguien tiene que ir a anular.
  const [conRemision, setConRemision] = useState(false)
  const [ovQuery, setOvQuery] = useState('')
  const [ovResults, setOvResults] = useState<SalesOrderLite[]>([])
  const [salesOrderId, setSalesOrderId] = useState<string | null>(null)
  const [buscandoOv, setBuscandoOv] = useState(false)

  const [clientQuery, setClientQuery] = useState('')
  const [clientResults, setClientResults] = useState<ClientLite[]>([])
  const [clientId, setClientId] = useState<string | null>(null)
  const [clientName, setClientName] = useState('')

  const [equipoQuery, setEquipoQuery] = useState('')
  const [equipoResults, setEquipoResults] = useState<EquipoLite[]>([])
  const [equipo, setEquipo] = useState<EquipoLite | null>(null)
  const [buscandoEquipo, setBuscandoEquipo] = useState(false)
  /** Con cliente elegido, el buscador se acota SIEMPRE a sus equipos: no hay forma de colar el de
   *  otra empresa. Y al ir acotada, la caja vacía ya es una consulta útil (basta abrir el campo);
   *  sin cliente se siguen exigiendo 2 caracteres — listar los ~350 equipos de golpe no ayudaría.
   *  Si un equipo no aparece bajo su cliente, se corrige vinculándolo en la página Equipos. */
  const equiposAcotados = !!clientId

  const [tipoServicio, setTipoServicio] = useState('')
  const [clasificaciones, setClasificaciones] = useState('')
  const [prefijo, setPrefijo] = useState('MT')
  const [prioridad, setPrioridad] = useState('')

  const [subjectOverride, setSubjectOverride] = useState<string | null>(null)
  const [codigoOverride, setCodigoOverride] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // Previsión, no reserva: el número definitivo lo asigna la secuencia al crear.
  const [numeroPrevisto, setNumeroPrevisto] = useState<number | null>(null)
  useEffect(() => {
    let alive = true
    fetchNextTicketNumber().then((r) => { if (alive) setNumeroPrevisto(r.number) }).catch(() => {})
    return () => { alive = false }
  }, [])

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
  // `soloLibres`: una orden de venta pertenece a UN servicio, así que las que ya están en otro ticket
  // no se ofrecen — el servidor las rechaza igualmente (409), y enseñarlas solo era ofrecer el error.
  // `buscandoOv` evita anunciar "ninguna libre coincide" mientras la búsqueda está en vuelo.
  useEffect(() => {
    if (salesOrderId) { setOvResults([]); return }
    if (!clientId && ovQuery.trim().length < 2) { setOvResults([]); return }
    let alive = true
    setBuscandoOv(true)
    searchSalesOrders(ovQuery, clientId ?? undefined, true)
      .then((r) => { if (alive) setOvResults(r) })
      .catch(() => {})
      .finally(() => { if (alive) setBuscandoOv(false) })
    return () => { alive = false }
  }, [ovQuery, clientId, salesOrderId])
  useEffect(() => {
    if (clientId) { setClientResults([]); return }
    if (clientQuery.trim().length < 2) { setClientResults([]); return }
    let alive = true
    searchClients(clientQuery).then((r) => { if (alive) setClientResults(r) }).catch(() => {})
    return () => { alive = false }
  }, [clientQuery, clientId])
  // `buscandoEquipo` evita anunciar "no hay coincidencias" mientras la búsqueda está en vuelo.
  useEffect(() => {
    if (equipo) { setEquipoResults([]); return }
    if (!equiposAcotados && equipoQuery.trim().length < 2) { setEquipoResults([]); return }
    let alive = true
    setBuscandoEquipo(true)
    searchEquipos(equipoQuery, clientId)
      .then((r) => { if (alive) setEquipoResults(r) })
      .catch(() => {})
      .finally(() => { if (alive) setBuscandoEquipo(false) })
    return () => { alive = false }
  }, [equipoQuery, equipo, clientId, equiposAcotados])

  // El cliente lo determina la OV o el equipo; dejarlo editable permitiría que el ticket acabara a
  // nombre de otra empresa. Se bloquea SOLO si hay un cliente real resuelto (`clientId`): si el
  // equipo trae un dueño que no casa con ningún cliente de Books, el campo sigue editable y se
  // avisa — bloquearlo ahí dejaría el formulario en un callejón sin salida (el alta exige clientId).
  const clienteBloqueado = !!clientId && (!!salesOrderId || !!equipo)

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
    // El número de OV no se manda: el servidor lo deriva de `salesOrderId` (ticketService).
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
      const creado = await createTicket({
        salesOrderId: salesOrderId ?? undefined,
        clientId: clientId ?? undefined,
        equipoId: equipo.id,
        tipoServicio, clasificaciones, prefijo,
        prioridad: prioridad || undefined,
        subject, codigoServicio: codigo,
      })
      onCreated(creado.id, conRemision)
    } catch (err) { setError(err instanceof Error ? err.message : String(err)) }
    finally { setBusy(false) }
  }

  const field = 'border border-slate-200 rounded p-2 text-[13px]'

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-lg p-5 w-[560px] max-h-[90vh] overflow-auto flex flex-col gap-3">
        <h3 className="text-[15px] font-bold text-slate-800">Nuevo ticket</h3>

        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase">Número de ticket</label>
          <input className={`${field} w-full bg-slate-50 text-slate-600 cursor-default`} readOnly
            value={numeroPrevisto == null ? '…' : `#${numeroPrevisto}`} />
        </div>

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
          {/* Sin este aviso, filtrar las cogidas se ve como un buscador roto: se teclea el número de
              una OV que existe y no aparece nada, sin explicación. */}
          {!salesOrderId && !buscandoOv && ovResults.length === 0 && ovQuery.trim().length > 0 && (!!clientId || ovQuery.trim().length >= 2) && (
            <div className="mt-1 text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
              Ninguna orden de venta libre coincide con <b>«{ovQuery.trim()}»</b>. Las que ya están en otro
              ticket no se ofrecen: una orden de venta pertenece a un solo servicio.
            </div>
          )}
        </div>

        <div className="relative">
          <label className="text-[11px] font-bold text-slate-500 uppercase">Cliente *</label>
          <input className={`${field} w-full ${clienteBloqueado ? 'bg-slate-50 text-slate-600 cursor-default' : ''}`}
            placeholder="Buscar cliente…" value={clientQuery} readOnly={clienteBloqueado}
            {...(clienteBloqueado ? {} : comboProps('cliente'))}
            onChange={(e) => { setClientQuery(e.target.value); setClientId(null); setClientName(e.target.value); setOpenCombo('cliente') }} required={!clientId} />
          {equipo && !clientId && (
            <div className="mt-1 text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
              El equipo figura a nombre de <b>{equipo.clienteNombre}</b>, que no coincide con ningún cliente de Books.
              Elige tú el cliente para poder crear el ticket.
            </div>
          )}
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
          {/* Ámbar mientras hay texto sin equipo elegido: escribir un serial NO basta, hay que
              seleccionar uno del listado (el servidor exige `equipoId` y responde 422 si no). */}
          <input className={`${field} w-full ${equipoQuery.trim() && !equipo ? 'border-amber-400' : ''}`} placeholder="Buscar equipo registrado…" value={equipoQuery}
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
          {!equipo && !buscandoEquipo && equipoResults.length === 0 && (equiposAcotados || equipoQuery.trim().length >= 2) && (
            <div className="mt-1 text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
              {equiposAcotados && !equipoQuery.trim() ? (
                <><b>{clientName}</b> no tiene equipos registrados. Si los tiene pero figuran a otro nombre,
                  vincúlalos a este cliente desde <b>Equipos</b>.</>
              ) : equiposAcotados ? (
                <>Ningún equipo de <b>{clientName}</b> coincide con <b>«{equipoQuery.trim()}»</b>. Si el equipo existe
                  pero figura a otro nombre, corrige su cliente desde <b>Equipos</b>.</>
              ) : (
                <>No hay ningún equipo registrado que coincida con <b>«{equipoQuery.trim()}»</b>.
                  Regístralo primero en <b>Equipos</b> (icono de la barra superior) y vuelve a crear el ticket.</>
              )}
            </div>
          )}
          {!equipo && !equiposAcotados && equipoQuery.trim().length === 1 && (
            <div className="mt-1 text-[12px] text-slate-400">Escribe al menos 2 caracteres para buscar.</div>
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
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase">Código Servicio</label>
          <input className={field} value={codigo} onChange={(e) => setCodigoOverride(e.target.value)} />
          <label className="text-[11px] font-bold text-slate-500 uppercase mt-1">Asunto</label>
          <input className={field} value={subject} onChange={(e) => setSubjectOverride(e.target.value)} />
        </div>

        {error && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}

        {/* El equipo suele llegar en el mismo acto de abrir el ticket. Sin esto había que crear el
            ticket, buscarlo y entrar en él para remisionar, justo en el momento de más prisa. */}
        <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer border-t border-slate-100 pt-3">
          <input type="checkbox" checked={conRemision} onChange={(e) => setConRemision(e.target.checked)} className="accent-blue-600" />
          Crear también la remisión de entrada
        </label>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-[13px] text-slate-600">Cancelar</button>
          <button type="submit" disabled={busy} className="px-4 py-1.5 bg-[#2C7BE5] text-white rounded text-[13px] font-bold disabled:opacity-50">{busy ? 'Creando…' : 'Crear ticket'}</button>
        </div>
      </form>
    </div>
  )
}
