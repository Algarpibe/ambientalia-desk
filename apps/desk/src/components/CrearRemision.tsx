import { useState } from 'react'
import type { RemisionNueva } from '@ambientalia/shared'
import { useAsync } from '../hooks/useAsync'
import { fetchRemisionNueva, crearRemision, subirFotoRemision, enviarRemision } from '../api/client'
import { redimensionarImagen, hoyISO } from '../lib/imagen'
import { ejecutarEnvio, type EstadoEnvio, type ResultadoEnvio } from '../lib/envioRemision'
import { ResultadoRemision } from './ResultadoRemision'

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
  // Lo que sobrevive a un fallo a mitad: sin esto, el id de la remisión ya creada se perdía al volver
  // al formulario y el siguiente intento creaba una segunda.
  const [envio, setEnvio] = useState<EstadoEnvio>({ remisionId: null, fotosSubidas: 0 })
  const [resultado, setResultado] = useState<ResultadoEnvio | null>(null)

  const alternar = (item: string) => setMarcados((m) => ({ ...m, [item]: !m[item] }))

  /**
   * `estado` viaja como parámetro y no se lee de `envio` porque hay que poder invocarlo con un estado
   * recién calculado, antes de que React haya aplicado el `setEnvio` correspondiente.
   */
  async function ejecutar(estado: EstadoEnvio, omitirFotosPendientes: boolean) {
    setErr(null)
    try {
      const r = await ejecutarEnvio(estado, fotos.length, {
        crear: async () => {
          const incluye = Object.entries(marcados).filter(([, v]) => v).map(([k]) => k)
          const rem = await crearRemision({ ticketId, fecha, incluye, observaciones: observaciones || undefined })
          return rem.id
        },
        subirFoto: async (id, i) => { await subirFotoRemision(id, await redimensionarImagen(fotos[i])) },
        enviar: (id) => enviarRemision(id),
        onAvance: setEnvio,
        onProgreso: setBusy,
      }, { omitirFotosPendientes })
      setResultado(r)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    void ejecutar(envio, false)
  }

  /**
   * La remisión ya existe: los datos del formulario están guardados y no se pueden cambiar desde aquí,
   * así que se congelan. Cambiarlos daría la impresión de editar algo que ya no se va a reescribir.
   */
  const creada = envio.remisionId !== null
  const fotosPendientes = fotos.length - envio.fotosSubidas

  // Salir dejando una remisión creada la deja en `pendiente` sin enviar. No se puede borrar desde aquí
  // (anular es solo de administradores), así que al menos hay que decirlo.
  function cancelar() {
    if (creada && !confirm('La remisión ya se creó y quedaría sin enviar. Aparecerá en la pantalla de Remisiones y un administrador puede anularla. ¿Salir de todos modos?')) return
    onClose()
  }

  const campo = 'border border-slate-200 rounded p-2 text-[13px]'
  const fijo = `${campo} w-full bg-slate-50 text-slate-600 cursor-default`

  // `onCreada` recarga el ticket y cierra: se invoca al cerrar el panel, no al enviar.
  // El `key` ata el panel a esta remisión concreta, para que su temporizador de espera no se herede
  // si alguna vez se abre otro sin desmontar el anterior.
  if (resultado) return <ResultadoRemision key={resultado.remisionId} remisionId={resultado.remisionId} errorEnvio={resultado.errorEnvio} onCerrar={onCreada} />

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
                <input type="date" className={`${campo} w-full`} value={fecha} onChange={(e) => setFecha(e.target.value)} disabled={creada} required />
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
                      <input type="checkbox" className="accent-blue-600 mt-0.5" checked={!!marcados[item]} onChange={() => alternar(item)} disabled={creada} />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Observaciones</label>
              <textarea className={`${campo} h-20 resize-none`} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} disabled={creada} placeholder="Estado del equipo, golpes, faltantes…" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Registro fotográfico</label>
              {/* Congelado con la remisión creada porque `fotosSubidas` es un índice sobre esta misma
                  lista: cambiar los ficheros la invalidaría y resubiría fotos ya subidas. */}
              <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="text-[12px]" disabled={creada}
                onChange={(e) => setFotos(Array.from(e.target.files ?? []))} />
              {fotos.length > 0 && (
                <div className="text-[11px] text-slate-400">
                  {fotos.length} {fotos.length === 1 ? 'foto' : 'fotos'} · se reducen a 1600 px antes de subirlas
                </div>
              )}
            </div>
          </>
        )}

        {creada && (
          <div className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
            La remisión ya se creó y no se va a duplicar: al reintentar se continúa con ella.
            {fotos.length > 0 && ` Fotos subidas: ${envio.fotosSubidas} de ${fotos.length}.`}
          </div>
        )}
        {err && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded p-2">{err}</div>}
        <div className="flex justify-end items-center gap-2">
          {busy && <span className="text-[12px] text-slate-500 mr-auto">{busy}</span>}
          {/* Salida para una foto que no sube nunca (corrupta, o demasiado pesada): sin esto el técnico
              se queda atrapado reintentando. Lo que ya subió sí viaja, y el flujo de n8n concilia
              contra lo que se mandó, así que una remisión con menos fotos no cuenta como error. */}
          {creada && fotosPendientes > 0 && !busy && (
            <button type="button" onClick={() => void ejecutar(envio, true)} className="px-3 py-1.5 text-[13px] text-slate-600 underline">
              Continuar sin las {fotosPendientes} fotos que faltan
            </button>
          )}
          <button type="button" onClick={cancelar} className="px-3 py-1.5 text-[13px] text-slate-600">Cancelar</button>
          {/* El progreso lo cuenta el `busy` de la izquierda; repetirlo aquí solo haría bailar el ancho
              del botón a cada foto. */}
          <button type="submit" disabled={!data || !!busy} className="px-4 py-1.5 bg-[#2C7BE5] text-white rounded text-[13px] font-bold disabled:opacity-50">
            {creada ? 'Reintentar' : 'Crear remisión'}
          </button>
        </div>
      </form>
    </div>
  )
}
