import { useEffect, useState } from 'react'
import type { EquipoFull, ClientLite, Catalogo } from '@ambientalia/shared'
import { listEquiposManage, getCatalogo, createEquipo, updateEquipo, setEquipoActive, deleteEquipo, searchClients } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { avisoClienteSinVincular } from '../lib/clienteEquipo'
import { HojaDeVida } from './HojaDeVida'

const PAGE_SIZE = 50

/**
 * `onAbrirCatalogo` es opcional a propósito: quien la cablea a la pantalla `CatalogoEquipos` es una
 * tarea posterior (montarla en App.tsx). Sin ella, el atajo del administrador se degrada a pedirle a
 * alguien que lo haga desde Configuración, en vez de romper la compilación de quien todavía no la pasa.
 */
export function EquiposAdmin({ onClose, onAbrirCatalogo }: { onClose: () => void; onAbrirCatalogo?: () => void }) {
  const { user } = useAuth()
  const [items, setItems] = useState<EquipoFull[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<EquipoFull | null>(null)
  const [creating, setCreating] = useState(false)
  const [historial, setHistorial] = useState<EquipoFull | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    try { setItems((await listEquiposManage(search, page)).items) }
    catch (e) { setError(String(e instanceof Error ? e.message : e)) }
  }
  useEffect(() => { reload() }, [search, page])

  async function toggleActive(e: EquipoFull) {
    try { await setEquipoActive(e.id, !e.active); reload() }
    catch (err) { alert('Error: ' + String(err instanceof Error ? err.message : err)) }
  }

  async function remove(e: EquipoFull) {
    if (!confirm(`¿Eliminar definitivamente el equipo ${e.serial}? Esta acción no se puede deshacer.`)) return
    try { await deleteEquipo(e.id); reload() }
    catch (err) { alert('Error: ' + String(err instanceof Error ? err.message : err)) }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col">
      <div className="bg-[#2C2E3E] text-white h-[48px] flex items-center px-4 gap-3 shrink-0">
        <button onClick={onClose} className="hover:bg-white/10 p-1 rounded"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="text-[15px] font-bold">Equipos</h1>
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Buscar por serie, cliente, marca, modelo, tipo…" className="ml-4 bg-white/10 text-white placeholder-white/50 rounded px-3 py-1.5 text-[13px] w-[360px] outline-none" />
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
                  <button onClick={() => setHistorial(e)} className="text-[12px] text-blue-600 mr-3">Hoja de vida</button>
                  <button onClick={() => setEditing(e)} className="text-[12px] text-blue-600 mr-3">Editar</button>
                  <button onClick={() => toggleActive(e)} className="text-[12px] text-blue-600">{e.active ? 'Desactivar' : 'Activar'}</button>
                  {user?.isAdmin && <button onClick={() => remove(e)} className="text-[12px] text-red-600 ml-3">Eliminar</button>}
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-slate-400">Sin equipos.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 text-[12px] text-slate-500 shrink-0">
        <span>Página {page}{items.length === PAGE_SIZE ? '' : ' (última)'}</span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 border border-slate-200 rounded disabled:opacity-40">Anterior</button>
          <button disabled={items.length < PAGE_SIZE} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border border-slate-200 rounded disabled:opacity-40">Siguiente</button>
        </div>
      </div>
      {(creating || editing) && (
        <EquipoForm
          equipo={editing}
          isAdmin={!!user?.isAdmin}
          onAbrirCatalogo={onAbrirCatalogo}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSaved={() => { setCreating(false); setEditing(null); reload() }}
        />
      )}
      {historial && <HojaDeVida equipoId={historial.id} onClose={() => setHistorial(null)} />}
    </div>
  )
}

function EquipoForm({ equipo, isAdmin, onAbrirCatalogo, onClose, onSaved }: {
  equipo: EquipoFull | null
  isAdmin: boolean
  onAbrirCatalogo?: () => void
  onClose: () => void
  onSaved: () => void
}) {
  const [serial, setSerial] = useState(equipo?.serial ?? '')
  const [marcaId, setMarcaId] = useState('')
  const [modeloId, setModeloId] = useState(equipo?.modeloId ?? '')
  const [clientId, setClientId] = useState<string | null>(equipo?.clientId ?? null)
  const [clientName, setClientName] = useState(equipo?.clienteNombre ?? '')
  const [clientQuery, setClientQuery] = useState(equipo?.clienteNombre ?? '')
  const [clientResults, setClientResults] = useState<ClientLite[]>([])
  const [catalogo, setCatalogo] = useState<Catalogo>({ tipos: [], marcas: [], modelos: [] })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // Mismo patrón que CreateTicket: la lista solo se abre con el foco en su campo, y no se
  // reabre al elegir (elegir reescribe `clientQuery`, lo que re-disparaba la búsqueda).
  const [clienteOpen, setClienteOpen] = useState(false)

  useEffect(() => {
    // `incluir` trae el modelo del equipo aunque esté desactivado (junto con su marca): sin eso,
    // editar un equipo cuyo modelo se retiró del catálogo dejaría el campo en blanco y obligaría a
    // cambiárselo solo para poder guardar.
    getCatalogo(equipo?.modeloId ?? null).then((c) => {
      setCatalogo(c)
      // Precarga la marca a partir del modelo del equipo: sin esto el desplegable de modelo saldría
      // vacío (está acotado por marca) aunque el de modelo ya traiga el valor correcto.
      if (equipo?.modeloId) {
        const m = c.modelos.find((mo) => mo.id === equipo.modeloId)
        if (m) setMarcaId(m.marcaId)
      }
    }).catch(() => {})
  }, [equipo])
  useEffect(() => {
    if (clientId) { setClientResults([]); return }
    if (clientQuery.trim().length < 2) { setClientResults([]); return }
    let alive = true
    searchClients(clientQuery).then((r) => { if (alive) setClientResults(r) }).catch(() => {})
    return () => { alive = false }
  }, [clientQuery, clientId])

  // La misma regla alimenta la pista bajo el campo y el freno al enviar: si se separaran, una diría
  // que hay problema y la otra dejaría guardar.
  const avisoCliente = avisoClienteSinVincular({ textoActual: clientQuery, textoOriginal: equipo?.clienteNombre ?? '', clientId })

  async function submit(ev: React.FormEvent) {
    ev.preventDefault(); setBusy(true); setError(null)
    try {
      // El nombre del cliente no viaja en el payload ni el servidor lo aceptaría —lo deriva del
      // cliente de Books—, así que teclearlo sin elegir de la lista guardaba «bien» sin cambiar nada.
      if (avisoCliente) { setError(avisoCliente); return }
      const payload = { serial, modeloId, clientId: clientId ?? undefined }
      if (equipo) await updateEquipo(equipo.id, payload)
      else await createEquipo(payload)
      onSaved()
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setBusy(false) }
  }

  const field = 'border border-slate-200 rounded p-2 text-[13px]'
  // Catálogo CERRADO: los modelos se acotan a los de la marca elegida, sin «Otro…». El servidor ya
  // devuelve solo marcas/modelos activos (más el del equipo en edición, aunque esté desactivado), así
  // que no hace falta filtrar nada más aquí.
  const modelosDeMarca = catalogo.modelos.filter((m) => m.marcaId === marcaId)
  const modeloSeleccionado = modeloId ? catalogo.modelos.find((m) => m.id === modeloId) : undefined
  const tipoTexto = !modeloId ? '' : (modeloSeleccionado?.tipoNombre ?? 'Este modelo no tiene tipo asignado en el catálogo.')

  // El atajo del administrador: la marca elegida no tiene modelos, o el catálogo no tiene marcas en
  // absoluto. En ambos casos no hay nada que elegir, así que se dice y se ofrece salida en vez de
  // dejar el desplegable de modelo vacío sin explicación.
  const marcaSinModelos = !!marcaId && modelosDeMarca.length === 0
  const catalogoSinMarcas = catalogo.marcas.length === 0
  const mostrarAtajo = catalogoSinMarcas || marcaSinModelos
  const marcaElegidaNombre = catalogo.marcas.find((m) => m.id === marcaId)?.nombre ?? ''

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-lg p-5 w-[480px] max-h-[90vh] overflow-auto flex flex-col gap-3">
        <h3 className="text-[15px] font-bold text-slate-800">{equipo ? 'Editar equipo' : 'Nuevo equipo'}</h3>
        <input className={field} placeholder="Número de serie *" value={serial} onChange={(e) => setSerial(e.target.value)} required />
        <div className="grid grid-cols-2 gap-2">
          <select className={field} value={marcaId} onChange={(e) => { setMarcaId(e.target.value); setModeloId('') }}>
            <option value="">Marca…</option>
            {catalogo.marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
          <select className={field} value={modeloId} disabled={!marcaId} onChange={(e) => setModeloId(e.target.value)}>
            <option value="">{marcaId ? 'Modelo…' : 'Elige marca primero'}</option>
            {modelosDeMarca.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </div>
        {/* Solo lectura: el tipo lo determina el modelo elegido, se enseña para confirmar que es el
            equipo correcto, no para tocarlo. */}
        <input className={`${field} bg-slate-50 text-slate-500`} placeholder="Tipo (según el modelo elegido)" value={tipoTexto} disabled readOnly />
        {mostrarAtajo && (
          <div className="text-[12px] text-amber-700 bg-amber-50 border border-amber-100 rounded p-2">
            {catalogoSinMarcas
              ? 'El catálogo de equipos todavía no tiene marcas dadas de alta.'
              : `La marca "${marcaElegidaNombre}" no tiene ningún modelo dado de alta en el catálogo.`}
            {' '}
            {isAdmin && onAbrirCatalogo ? (
              <button type="button" onClick={onAbrirCatalogo} className="text-blue-600 underline">Ir al catálogo de equipos</button>
            ) : (
              'Pídeselo a un administrador desde Configuración → Catálogo de equipos.'
            )}
          </div>
        )}
        <div className="relative">
          <input className={`${field} w-full`} placeholder="Cliente (Books) *" value={clientQuery}
            onFocus={() => setClienteOpen(true)} onBlur={() => setClienteOpen(false)}
            onKeyDown={(e) => { if (e.key === 'Escape') setClienteOpen(false) }}
            onChange={(e) => { setClientQuery(e.target.value); setClientId(null); setClientName(e.target.value); setClienteOpen(true) }} required={!equipo && !clientId} />
          {clienteOpen && clientResults.length > 0 && (
            <ul onMouseDown={(e) => e.preventDefault()} className="absolute z-10 bg-white border border-slate-200 rounded w-full max-h-44 overflow-auto shadow">
              {clientResults.map((c) => (
                <li key={c.id}><button type="button" onClick={() => { setClientId(c.id); setClientName(c.name); setClientQuery(c.name); setClientResults([]) }} className="w-full text-left px-2 py-1.5 text-[12px] hover:bg-slate-100">{c.name} {c.nit ? `· NIT ${c.nit}` : ''}</button></li>
              ))}
            </ul>
          )}
          {clientId
            ? <div className="text-[11px] text-slate-400 mt-1">Cliente vinculado: {clientName}</div>
            : avisoCliente && <div className="text-[11px] text-amber-600 mt-1">{avisoCliente}</div>}
        </div>
        {error && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-[13px] text-slate-600">Cancelar</button>
          <button type="submit" disabled={busy || !modeloId} className="px-4 py-1.5 bg-[#2C7BE5] text-white rounded text-[13px] font-bold disabled:opacity-50">{busy ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </div>
  )
}
