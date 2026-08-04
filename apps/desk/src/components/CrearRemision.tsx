import { useState } from 'react'
import type { RemisionNueva } from '@ambientalia/shared'
import { useAsync } from '../hooks/useAsync'
import { fetchRemisionNueva, crearRemision, subirFotoRemision, enviarRemision } from '../api/client'
import { redimensionarImagen, hoyISO } from '../lib/imagen'

/**
 * Formulario de remisión de ENTRADA. Sustituye al formulario de n8n: los datos que allí se volvían a
 * teclear (ticket, cliente, equipo, tipo de servicio) llegan ya resueltos del ticket y no se pueden
 * alterar aquí — el servidor los recalcula de todos modos al guardar.
 */
export function CrearRemision({ ticketId, onClose, onCreada }: { ticketId: string; onClose: () => void; onCreada: () => void }) {
  const { data, loading, error } = useAsync<RemisionNueva>(() => fetchRemisionNueva(ticketId), [ticketId])
  const [fecha, setFecha] = useState(hoyISO())
  const [marcados, setMarcados] = useState<Record<string, boolean>>({})
  const [observaciones, setObservaciones] = useState('')
  const [fotos, setFotos] = useState<File[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const alternar = (item: string) => setMarcados((m) => ({ ...m, [item]: !m[item] }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setBusy('Guardando…')
    try {
      const incluye = Object.entries(marcados).filter(([, v]) => v).map(([k]) => k)
      const rem = await crearRemision({ ticketId, fecha, incluye, observaciones: observaciones || undefined })
      // Las fotos van después, contra la remisión ya creada: si una falla, la remisión no se pierde.
      for (const [i, f] of fotos.entries()) {
        setBusy(`Subiendo foto ${i + 1} de ${fotos.length}…`)
        await subirFotoRemision(rem.id, await redimensionarImagen(f))
      }
      // El envío va al final, no al crear: las fotos viajan dentro del payload y hasta aquí no existían.
      setBusy('Enviando…')
      await enviarRemision(rem.id)
      onCreada()
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : String(e2))
    } finally {
      setBusy(null)
    }
  }

  const campo = 'border border-slate-200 rounded p-2 text-[13px]'
  const fijo = `${campo} w-full bg-slate-50 text-slate-600 cursor-default`

  return (
    <div className="fixed inset-0 z-[85] bg-black/40 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-lg p-5 w-[560px] max-h-[90vh] overflow-auto flex flex-col gap-3">
        <h3 className="text-[15px] font-bold text-slate-800">Remisión de entrada</h3>

        {loading && <div className="text-[13px] text-slate-500">Cargando datos del ticket…</div>}
        {error && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}

        {data && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Ticket</label>
                <input className={fijo} readOnly value={`#${data.ticketNumber}`} />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Fecha</label>
                <input type="date" className={`${campo} w-full`} value={fecha} onChange={(e) => setFecha(e.target.value)} required />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Cliente</label>
              <input className={fijo} readOnly value={data.cliente ?? '—'} />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Equipo</label>
              <input className={fijo} readOnly value={[data.equipo.marca, data.equipo.modelo].filter(Boolean).join(' ') + (data.equipo.serial ? ` · serie ${data.equipo.serial}` : '')} />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Tipo de Servicio</label>
              <input className={fijo} readOnly value={data.tipoServicio ?? '—'} />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Incluye</label>
              {!data.catalogoCargado ? (
                // El catálogo sin sembrar deja `incluye` vacío igual que Kunak. Decir aquí "este equipo
                // no tiene lista" sería falso y llevaría a remisionar sin accesorios sin saberlo.
                <div className="mt-1 text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
                  El catálogo de accesorios aún no se ha cargado, así que no se puede marcar nada.
                  Pídele a un administrador que ejecute la carga inicial antes de crear remisiones.
                </div>
              ) : data.incluye.length === 0 ? (
                // Kunak no tiene checklist en el flujo original: es un caso legítimo, no un fallo.
                <div className="text-[12px] text-slate-400 mt-1">Este tipo de equipo no tiene lista de elementos.</div>
              ) : (
                <div className="mt-1 border border-slate-200 rounded p-2 max-h-52 overflow-auto grid grid-cols-2 gap-x-3 gap-y-1">
                  {data.incluye.map((item) => (
                    <label key={item} className="flex items-start gap-2 text-[12px] cursor-pointer">
                      <input type="checkbox" className="accent-blue-600 mt-0.5" checked={!!marcados[item]} onChange={() => alternar(item)} />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Observaciones</label>
              <textarea className={`${campo} h-20 resize-none`} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Estado del equipo, golpes, faltantes…" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Registro fotográfico</label>
              <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="text-[12px]"
                onChange={(e) => setFotos(Array.from(e.target.files ?? []))} />
              {fotos.length > 0 && (
                <div className="text-[11px] text-slate-400">
                  {fotos.length} {fotos.length === 1 ? 'foto' : 'fotos'} · se reducen a 1600 px antes de subirlas
                </div>
              )}
            </div>
          </>
        )}

        {err && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded p-2">{err}</div>}
        <div className="flex justify-end items-center gap-2">
          {busy && <span className="text-[12px] text-slate-500 mr-auto">{busy}</span>}
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-[13px] text-slate-600">Cancelar</button>
          <button type="submit" disabled={!data || !!busy} className="px-4 py-1.5 bg-[#2C7BE5] text-white rounded text-[13px] font-bold disabled:opacity-50">
            {busy ? 'Guardando…' : 'Crear remisión'}
          </button>
        </div>
      </form>
    </div>
  )
}
