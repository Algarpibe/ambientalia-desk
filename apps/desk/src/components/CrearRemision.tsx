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
   * `estado` entra por parámetro en vez de leerse de `envio` para que cada intento declare de dónde
   * parte: el punto de partida es una decisión de quien llama, no un implícito del render. Habrá
   * llamantes que arranquen de un estado que todavía no está en `envio`.
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

  const creada = envio.remisionId !== null
  const fotosPendientes = fotos.length - envio.fotosSubidas

  /**
   * Marca la ventana en la que ya puede existir una remisión en la base: `creada` no se enciende hasta
   * que `setEnvio` aterriza, y para entonces `crearRemision` lleva un rato en vuelo. De ahí que mire
   * también a `busy` — durante ese hueco la remisión puede existir sin que el formulario lo sepa aún.
   *
   * Congela los campos porque a partir de ahí ya no mandan: con la remisión creada sus datos están
   * guardados y no se reescriben desde aquí, y en vuelo `crear()` los lee del closure fijado al
   * pulsar, así que teclear en ellos no cambia lo que se persiste — solo deja en pantalla un texto
   * que nunca llegó a la base. En las fotos es peor que una mentira en pantalla: `fotosSubidas` es un
   * índice posicional sobre esa misma lista, y cambiarla resubiría unas y se saltaría otras sin
   * lanzar ningún error.
   */
  const congelado = creada || !!busy

  /**
   * Salir dejando una remisión creada la deja en `pendiente` sin enviar. No se puede borrar desde aquí
   * (anular es solo de administradores), así que al menos hay que decirlo. `congelado` es justo la
   * ventana a cubrir: no hay `AbortController`, así que cerrar el formulario no cancela el
   * `crearRemision` que ya salió y el servidor la crea igual.
   */
  function cancelar() {
    if (congelado && !confirm('La remisión ya se creó —o se está creando ahora mismo— y quedaría sin enviar. Aparecerá en la pantalla de Remisiones y un administrador puede anularla. ¿Salir de todos modos?')) return
    // Salir por `onCreada` y no por `onClose` porque solo aquella recarga el ticket: si no se recarga,
    // la pestaña sigue diciendo "0 REMISIONES", el técnico no ve la que acaba de dejar y crea otra.
    // Con la petición aún en vuelo la recarga puede adelantarse al servidor, pero nunca es peor que
    // no recargar.
    if (congelado) onCreada()
    else onClose()
  }

  // Un campo congelado se pinta como los de solo lectura (`fijo`): el gris nativo del navegador sobre
  // un borde `slate-200` propio casi no se nota, y el técnico tiene que ver que ya no manda.
  const campo = 'border border-slate-200 rounded p-2 text-[13px] disabled:bg-slate-50 disabled:text-slate-600 disabled:cursor-default'
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
                <input type="date" className={`${campo} w-full`} value={fecha} onChange={(e) => setFecha(e.target.value)} disabled={congelado} required />
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
                    <label key={item} className={`flex items-start gap-2 text-[12px] ${congelado ? 'text-slate-500 cursor-default' : 'cursor-pointer'}`}>
                      <input type="checkbox" className="accent-blue-600 mt-0.5 disabled:opacity-50" checked={!!marcados[item]} onChange={() => alternar(item)} disabled={congelado} />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Observaciones</label>
              <textarea className={`${campo} h-20 resize-none`} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} disabled={congelado} placeholder="Estado del equipo, golpes, faltantes…" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Registro fotográfico</label>
              <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="text-[12px] disabled:opacity-50 disabled:cursor-default" disabled={congelado}
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
              Continuar sin {fotosPendientes === 1 ? 'la foto que falta' : `las ${fotosPendientes} fotos que faltan`}
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
