import { useState } from 'react'
import type { Catalogo, ClientLite } from '@ambientalia/shared'
import { serialesCoinciden, esIdProvisional } from '@ambientalia/shared'
import { searchClients, enlazarClienteProvisional, validarEquipoManual, type CandidatoNit } from '../api/client'
import type { AltaManualEstado } from '../lib/altaManualEstado'

/**
 * Interfaz del alta manual de equipo y cliente desconocidos (F1B-15, lote 4). Todo lo de aquí es presentación: el
 * servidor es quien exige, compara y rechaza (`ticketService.ts`, `services/altaManual.ts`, `routes/altaManual.ts`) y
 * esta pantalla sólo lo muestra y ofrece. Vive en un fichero propio para no desplazar las citas a `CreateTicket.tsx`.
 */
const field = 'border border-slate-200 rounded p-2 text-[13px]'

type Cambio = (m: AltaManualEstado) => AltaManualEstado

/** Interruptor + campos del cliente provisional. Los cinco datos y el motivo los exige el servidor (`exigirClienteProvisional`). */
export function AltaManualCliente({ m, setM, visible }: { m: AltaManualEstado; setM: (f: Cambio) => void; visible: boolean }) {
  if (!visible) return null
  const campo = (k: keyof AltaManualEstado['c'], etiqueta: string, tipo = 'text') => (
    <input type={tipo} className={`${field} w-full`} placeholder={`${etiqueta} *`} value={m.c[k]} required
      onChange={(e) => setM((s) => ({ ...s, c: { ...s.c, [k]: e.target.value } }))} />
  )
  if (!m.cliente) {
    return (
      <button type="button" onClick={() => setM((s) => ({ ...s, cliente: true }))} className="mt-1 text-[12px] text-blue-600 text-left">
        El cliente no está en la lista: registrarlo como provisional
      </button>
    )
  }
  return (
    <div className="mt-2 border border-slate-200 rounded p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-bold text-slate-500 uppercase">Cliente provisional</div>
        <button type="button" onClick={() => setM((s) => ({ ...s, cliente: false }))} className="text-[12px] text-slate-500">Cancelar</button>
      </div>
      {campo('razonSocial', 'Razón social')}
      {campo('nit', 'NIT')}
      <div className="grid grid-cols-2 gap-2">
        {campo('contacto', 'Contacto')}
        {campo('telefono', 'Teléfono')}
      </div>
      {campo('correo', 'Correo', 'email')}
      {campo('motivo', 'Motivo del alta manual')}
      <div className="text-[11px] text-slate-500">
        Queda marcado «provisional» hasta que Comercial lo enlace con su contacto de Books. Con un cliente provisional no se puede
        elegir orden de venta, y «Habilitar Servicio» espera a ese enlace.
      </div>
    </div>
  )
}

/** Interruptor + campos del equipo manual. Los tres campos comerciales no se piden, salvo la fecha de factura en «Equipo nuevo» (C-1). */
export function AltaManualEquipo({ m, setM, catalogo, enEquipoNuevo, visible }: { m: AltaManualEstado; setM: (f: Cambio) => void; catalogo: Catalogo | null; enEquipoNuevo: boolean; visible: boolean }) {
  if (!visible) return null
  if (!m.equipo) {
    return (
      <button type="button" onClick={() => setM((s) => ({ ...s, equipo: true }))} className="mt-1 text-[12px] text-blue-600 text-left">
        El equipo no está registrado: darlo de alta manualmente
      </button>
    )
  }
  const e = m.e
  const poner = (k: keyof AltaManualEstado['e'], v: string) => setM((s) => ({ ...s, e: { ...s.e, [k]: v } }))
  const confirmacionDifiere = !!e.serial.trim() && !!e.confirmacionSerial.trim() && !serialesCoinciden(e.serial, e.confirmacionSerial)
  return (
    <div className="mt-2 border border-slate-200 rounded p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-bold text-slate-500 uppercase">Equipo manual</div>
        <button type="button" onClick={() => setM((s) => ({ ...s, equipo: false }))} className="text-[12px] text-slate-500">Cancelar</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input className={`${field} w-full`} placeholder="Serie *" value={e.serial} onChange={(ev) => poner('serial', ev.target.value)} required />
        <input className={`${field} w-full ${confirmacionDifiere ? 'border-amber-400' : ''}`} placeholder="Repite la serie *" value={e.confirmacionSerial} onChange={(ev) => poner('confirmacionSerial', ev.target.value)} required />
      </div>
      {confirmacionDifiere && (
        <div className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">La serie y su repetición no coinciden. El servidor no crea el equipo hasta que coincidan.</div>
      )}
      {!e.noCatalogado ? (
        <select className={field} value={e.modeloId} onChange={(ev) => poner('modeloId', ev.target.value)} required>
          <option value="">Modelo del catálogo *</option>
          {(catalogo?.modelos ?? []).map((mo) => (
            <option key={mo.id} value={mo.id}>{catalogo?.marcas.find((ma) => ma.id === mo.marcaId)?.nombre ?? ''} {mo.nombre}</option>
          ))}
        </select>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <input className={`${field} w-full`} placeholder="Marca *" value={e.marca} onChange={(ev) => poner('marca', ev.target.value)} required />
          <input className={`${field} w-full`} placeholder="Modelo *" value={e.modeloTexto} onChange={(ev) => poner('modeloTexto', ev.target.value)} required />
          <input className={`${field} w-full`} placeholder="Tipo *" value={e.tipo} onChange={(ev) => poner('tipo', ev.target.value)} required />
        </div>
      )}
      <label className="flex items-center gap-2 text-[12px] text-slate-600 cursor-pointer">
        <input type="checkbox" checked={e.noCatalogado} onChange={(ev) => setM((s) => ({ ...s, e: { ...s.e, noCatalogado: ev.target.checked } }))} className="accent-blue-600" />
        El modelo no está en el catálogo
      </label>
      {enEquipoNuevo && (
        <div>
          <label className="text-[10px] text-slate-500">Factura de compra *</label>
          <input type="date" className={`${field} w-full`} value={e.fechaFacturaCompra} onChange={(ev) => poner('fechaFacturaCompra', ev.target.value)} required />
        </div>
      )}
      <input className={`${field} w-full`} placeholder="Motivo del alta manual *" value={e.motivo} onChange={(ev) => poner('motivo', ev.target.value)} required />
      <div className="text-[11px] text-slate-500">
        Nace «pendiente de validar»: Comercial completa fin de garantía, mantenedor y demás datos comerciales después. Si la serie ya
        está registrada, el servidor reutiliza ese equipo.
      </div>
    </div>
  )
}

/** El 409 de P-B: el NIT ya está en Books. Sólo muestra y ofrece los candidatos que devolvió el servidor; elegir uno vuelve al alta con ese cliente. */
export function CandidatosNit({ candidatos, onElegir }: { candidatos: CandidatoNit[]; onElegir: (c: CandidatoNit) => void }) {
  if (candidatos.length === 0) return null
  return (
    <div className="text-[12px] text-slate-700 bg-slate-50 border border-slate-200 rounded p-2 flex flex-col gap-1">
      <div className="font-bold">{candidatos.length === 1 ? 'Cliente ya registrado en Books' : 'Clientes ya registrados en Books con ese NIT'}</div>
      {candidatos.map((c) => (
        <div key={c.id} className="flex items-center justify-between gap-2">
          <span>{c.name}</span>
          <button type="button" onClick={() => onElegir(c)} className="text-blue-600 shrink-0">Usar este cliente</button>
        </div>
      ))}
    </div>
  )
}

/**
 * Acciones de la hoja de vida sobre un alta manual pendiente: «Enlazar» el cliente provisional con su contacto de Books y
 * «Validar» el equipo. Sólo se ofrecen a Comercial o administración (`puede`, de `puedeEditarCamposRestringidos`); la
 * imposición es el `403` de `routes/altaManual.ts`, y un fallo se enseña tal cual lo dice el servidor.
 */
export function AccionesAltaPendiente({ equipo, puede, onHecho }: { equipo: { id: string; clientId?: string; clienteNombre?: string; pendienteValidar?: boolean }; puede: boolean; onHecho: () => void }) {
  const provisional = esIdProvisional(equipo.clientId)
  const [q, setQ] = useState('')
  const [res, setRes] = useState<ClientLite[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  if (!provisional && !equipo.pendienteValidar) return null
  async function hacer(f: () => Promise<void>) {
    setBusy(true); setError(null)
    try { await f(); onHecho() } catch (e) { setError(e instanceof Error ? e.message : String(e)) } finally { setBusy(false) }
  }
  return (
    <div className="mt-2 text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2 flex flex-col gap-1">
      {provisional && <div>El cliente <b>{equipo.clienteNombre}</b> es provisional: falta enlazarlo con su contacto de Books.</div>}
      {equipo.pendienteValidar && <div>El equipo está pendiente de validar.</div>}
      {puede && provisional && (
        <div className="flex flex-col gap-1">
          <input className={`${field} w-full bg-white`} placeholder="Buscar el contacto de Books…" value={q}
            onChange={(e) => { setQ(e.target.value); if (e.target.value.trim().length >= 2) searchClients(e.target.value).then(setRes).catch(() => {}); else setRes([]) }} />
          {res.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded px-2 py-1">
              <span className="text-slate-700">{c.name}{c.nit ? ` · NIT ${c.nit}` : ''}</span>
              <button type="button" disabled={busy} onClick={() => hacer(() => enlazarClienteProvisional(equipo.clientId!, c.id))} className="text-blue-600 shrink-0 disabled:opacity-50">Enlazar</button>
            </div>
          ))}
        </div>
      )}
      {puede && equipo.pendienteValidar && (
        <div><button type="button" disabled={busy} onClick={() => hacer(() => validarEquipoManual(equipo.id))} className="text-blue-600 disabled:opacity-50">Validar equipo</button></div>
      )}
      {error && <div className="text-red-600">{error}</div>}
    </div>
  )
}
