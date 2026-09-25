import { useState } from 'react'
import type { RemisionNueva, SalesOrderLite } from '@ambientalia/shared'
import { faltaFotoPorNovedad } from '@ambientalia/shared'
import { useAsync } from '../hooks/useAsync'
import { fetchRemisionNueva, crearRemision, subirFotoRemision, enviarRemision, fetchRemisiones, type RemisionConFotos } from '../api/client'
import { redimensionarImagen, hoyISO } from '../lib/imagen'
import { ejecutarEnvio, type EstadoEnvio, type ResultadoEnvio } from '../lib/envioRemision'
import { fmtFechaHora } from '../lib/remisionResultado'
import { ResultadoRemision } from './ResultadoRemision'
import { BuscadorOrdenVenta } from './BuscadorOrdenVenta'

/**
 * Formulario de remisión de ENTRADA. Sustituye al formulario de n8n: los datos que allí se volvían a
 * teclear (ticket, cliente, equipo, tipo de servicio) llegan ya resueltos del ticket y no se pueden
 * alterar aquí — el servidor los recalcula de todos modos al guardar.
 */
export function CrearRemision({ ticketId, onClose, onCreada, recienCreado }: {
  ticketId: string
  onClose: () => void
  onCreada: () => void
  /**
   * Llega como PASO 2 del alta de un ticket. Sin decirlo, quien cancela aquí se queda sin saber que
   * el ticket sí quedó creado — y el número que ve arriba parecería el de un ticket que no existe.
   */
  recienCreado?: boolean
}) {
  const { data, loading, error } = useAsync<RemisionNueva>(() => fetchRemisionNueva(ticketId), [ticketId])
  /**
   * Una remisión de este ticket que quedó creada y sin desenlace, de un intento anterior que se
   * cortó. Ofrecerla evita el duplicado: sin esto, "Crear remisión" arrancaría una segunda desde cero.
   *
   * Se vuelve a pedir aquí aunque `TicketDetailView` ya sostenga esta misma lista: la suya se cargó al
   * abrir el ticket y este formulario se abre después, así que reusarla sería decidir con una foto
   * vieja — y el caso que importa es justo el de la remisión que otra sesión acaba de dejar.
   *
   * `loading` y `error` se descartan a propósito: esto es una ayuda, no un requisito, y el formulario
   * tiene que seguir sirviendo aunque la consulta no conteste. El precio es que si falla no hay cartel
   * ni aviso y el duplicado vuelve a ser posible en silencio; es la grieta que queda abierta.
   */
  const { data: previas } = useAsync<RemisionConFotos[]>(() => fetchRemisiones(ticketId), [ticketId])
  // La más reciente: el servidor las devuelve por `created_at DESC` y ya deja fuera las anuladas.
  const pendiente = (previas ?? []).find((r) => r.estado === 'pendiente') ?? null
  // `createdAt` y no `fecha`: la fecha es la del SERVICIO, la teclea el técnico y por defecto es hoy,
  // así que casi nunca distingue un intento de otro. La hora del intento sí responde a "¿esa cuál es?".
  const cuandoPendiente = pendiente ? fmtFechaHora(pendiente.createdAt) : ''
  const [fecha, setFecha] = useState(hoyISO())
  // La OV que el técnico elija aquí, cuando el ticket no la traiga. Se manda el ID: el número y la
  // fecha los resuelve el servidor contra Books, que es donde vive el dato.
  const [ordenVenta, setOrdenVenta] = useState<SalesOrderLite | null>(null)
  const [marcados, setMarcados] = useState<Record<string, boolean>>({})
  const [observaciones, setObservaciones] = useState('')
  const [fotos, setFotos] = useState<File[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  // Lo que sobrevive a un fallo a mitad: sin esto, el id de la remisión ya creada se perdía al volver
  // al formulario y el siguiente intento creaba una segunda.
  const [envio, setEnvio] = useState<EstadoEnvio>({ remisionId: null, fotosSubidas: 0 })
  const [resultado, setResultado] = useState<ResultadoEnvio | null>(null)
  // RQ-RE-19. Sin valor por defecto a propósito: enviar `false` sin contestar y contestar `false` son
  // elusiones equivalentes (regla 13, punto 2 — la obligación de contestar vive sólo aquí).
  const [hayNovedad, setHayNovedad] = useState<boolean | null>(null)
  // Qué es lo que está en vuelo, porque `busy` no lo distingue: crear una remisión nueva y reenviar la
  // que quedó pendiente lo encienden igual, y los avisos de salida dicen cosas distintas en cada caso.
  const [enviandoPrevia, setEnviandoPrevia] = useState(false)

  const alternar = (item: string) => setMarcados((m) => ({ ...m, [item]: !m[item] }))

  /**
   * `estado` entra por parámetro en vez de leerse de `envio` para que cada intento declare de dónde
   * parte: el punto de partida es una decisión de quien llama, no un implícito del render. Habrá
   * llamantes que arranquen de un estado que todavía no está en `envio`.
   */
  async function ejecutar(estado: EstadoEnvio, omitirFotosPendientes: boolean, permitirSegunda = false) {
    setErr(null)
    try {
      const r = await ejecutarEnvio(estado, fotos.length, {
        crear: async () => {
          const incluye = Object.entries(marcados).filter(([, v]) => v).map(([k]) => k)
          const rem = await crearRemision({ ticketId, fecha, incluye, observaciones: observaciones || undefined, permitirSegunda, salesOrderId: ordenVenta?.id, hayNovedad: hayNovedad ?? undefined })
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
    // RQ-RE-19: la obligación de contestar y la de traer foto con «Sí» viven sólo aquí (regla 13,
    // punto 2) — el alta del servidor no las exige (IV-12 no toca el alta); la consecuencia sí la
    // impone el servidor, más adelante, en `/enviar` (RQ-RE-08).
    if (hayNovedad === null) { setErr('Indica si el equipo llega con novedad.'); return }
    if (hayNovedad === true && fotos.length === 0) { setErr('El equipo llega con novedad: sube al menos una foto antes de crear la remisión.'); return }
    // El cartel de abajo es solo un consejo, y sin esta pregunta ignorarlo cuesta un clic: se crearía
    // una SEGUNDA remisión pendiente, y la primera quedaría fuera de alcance para siempre (al crear,
    // `creada` esconde el cartel, y aunque se recargara solo se ofrece la más reciente). No se bloquea
    // porque dos remisiones en un ticket son legítimas —un ticket puede recibir dos equipos—, pero
    // tiene que ser una decisión, no un descuido: `cancelar()` ya pregunta por bastante menos.
    if (pendiente && !creada && !confirm('Este ticket ya tiene una remisión sin desenlace. Si creas otra quedarán dos, y quitar la anterior solo puede hacerlo un administrador. ¿Crear una segunda de todos modos?')) return
    setEnviandoPrevia(false) // lo que salga de aquí sí es una remisión de esta sesión
    // Haber pasado por el `confirm` es lo único que autoriza la segunda: el servidor rechaza con 409
    // si no se le dice. Y cuando `pendiente` es null porque la consulta que lo alimenta falló, aquí
    // va `false` y el 409 salta — que es justo la grieta que este cartel no podía cubrir solo.
    void ejecutar(envio, false, !!pendiente)
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
    // Reenviar la remisión de otra sesión también enciende `congelado` (por `busy`), pero ahí no se
    // está creando nada ni queda nada a medias: el envío ya salió y su desenlace se guarda en la base
    // lo mires o no. Decirle lo de siempre sería alarmarlo por algo que no está pasando.
    const aviso = enviandoPrevia
      ? 'El envío ya salió. Si sales ahora no verás cómo terminó, pero el resultado queda guardado y lo puedes mirar en la pestaña de Remisiones del ticket. ¿Salir de todos modos?'
      : 'La remisión ya se creó —o se está creando ahora mismo— y quedaría sin enviar. Aparecerá en la pantalla de Remisiones y un administrador puede anularla. ¿Salir de todos modos?'
    if (congelado && !confirm(aviso)) return
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
            {recienCreado && (
              <div className="text-[12px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded p-2">
                Ticket <strong>#{data.ticketNumber}</strong> creado. Ahora su remisión de entrada — si la
                cancelas, el ticket se queda igualmente y podrás remisionarlo después.
              </div>
            )}
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
              {/* F1B-01 · el serial es obligatorio al crear la remisión (`R08.1.md:1045`), y lo impone
                  el servidor (`routes/remision.ts`, 422). Esto es COMODIDAD, no guarda: dice antes de
                  pulsar lo que el servidor diría después, y sobre todo dice QUÉ HACER. Pasa sólo en
                  tickets venidos de Zoho que aún no han pasado por «Habilitar Servicio», que es donde
                  se captura el serial (`transitions.ts:189`). */}
              {!(data.equipo.serial ?? '').trim() && (
                <div className="mt-1 text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
                  Este ticket no tiene número de serie, y la remisión no puede emitirse sin él: es lo que
                  identifica al equipo que entra. Captúralo en <b>Habilitar Servicio</b>, o enlaza el equipo
                  desde el catálogo, y vuelve a abrir este formulario.
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Tipo de Servicio</label>
              <input className={fijo} readOnly value={data.tipoServicio ?? '—'} />
            </div>

            {/* La orden de venta del TICKET, no de la remisión: por eso si ya está no se toca —como
                el cliente o el equipo— y si no está se puede capturar aquí, y así no hay que hacerlo
                en Habilitar Servicio. Sin asterisco a propósito: cuando el equipo entra, la venta
                puede no existir todavía, y exigirla dejaría al técnico sin poder remisionar. */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Orden de Venta</label>
              {data.ordenVenta ? (
                <input className={fijo} readOnly value={data.ordenVenta} />
              ) : (
                <div className="mt-1">
                  <BuscadorOrdenVenta
                    clientId={data.clientId}
                    elegida={ordenVenta}
                    onElegir={setOrdenVenta}
                    placeholder="Opcional · buscar si ya existe…"
                    disabled={congelado}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Incluye</label>
              {data.origenChecklist === 'modelo' && data.incluye.length === 0 ? (
                // «Cero» NUNCA significa «este equipo no lleva accesorios»: eso nadie lo ha comprobado.
                // Significa que a ese modelo todavía no se le ha definido la lista, y el mensaje empuja
                // a completarla en vez de dejar remisionar sin nada creyendo que está bien.
                <div className="mt-1 text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
                  Este modelo aún no tiene definida su lista de accesorios, así que no hay nada que
                  verificar. Se da de alta en Catálogo de equipos → ficha del modelo → Accesorios.
                </div>
              ) : data.origenChecklist === 'perfil' && !data.catalogoCargado ? (
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

            {/* RQ-RE-19. Sin valor preseleccionado (Persona-1): ni "Sí" ni "No" parten marcados, para
                que quien abre el formulario tenga que decidir. */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">¿El equipo llega con novedad?</label>
              <div className="flex gap-3 text-[13px]">
                <label className={`flex items-center gap-1.5 ${congelado ? 'text-slate-500 cursor-default' : 'cursor-pointer'}`}>
                  <input type="radio" name="hayNovedad" className="accent-blue-600" checked={hayNovedad === true} onChange={() => setHayNovedad(true)} disabled={congelado} />
                  Sí
                </label>
                <label className={`flex items-center gap-1.5 ${congelado ? 'text-slate-500 cursor-default' : 'cursor-pointer'}`}>
                  <input type="radio" name="hayNovedad" className="accent-blue-600" checked={hayNovedad === false} onChange={() => setHayNovedad(false)} disabled={congelado} />
                  No
                </label>
              </div>
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
        {/* Solo mientras no se haya creado nada en esta sesión: si ya hay una `creada`, el aviso de
            arriba manda y este sobraría.

            El texto no afirma que no se enviara, aunque ese sea el caso que motiva el cartel: desde el
            navegador `pendiente` no distingue tres situaciones —nunca se disparó, se disparó y sigue en
            vuelo, o se disparó y n8n aún no ha contestado— y el panel del mismo ticket etiqueta ese
            estado como "Enviando…" (`ESTADO_REMISION`). Prometer aquí lo contrario, a un clic de
            distancia, sería contradecirse. Pulsar es seguro en las tres: si el envío sigue vivo el
            servidor responde 409 y el panel de desenlace acaba enseñando cómo terminó de verdad. */}
        {!creada && pendiente && (
          <div className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2 flex items-center gap-2">
            <span className="flex-1">
              Este ticket ya tiene una remisión sin desenlace{cuandoPendiente && ` (creada el ${cuandoPendiente})`}:
              puede que no llegara a enviarse, o que n8n aún no haya contestado.
              Se envía con lo que se guardó entonces; lo que haya ahora en el formulario no entra.
            </span>
            {/* No pasa por `setEnvio` a propósito, aunque encendería `creada` y cuadraría el aviso de
                arriba: `envio.fotosSubidas` es un índice sobre las fotos de ESTA sesión, así que meter
                ahí una remisión ajena haría que el aviso contara "Fotos subidas: 0 de N" sobre fotos
                que ni le pertenecen ni se van a subir. A cambio, esta ruta depende de un invariante de
                `envioRemision.ts`: con `remisionId` puesto y `omitirFotosPendientes`, ni `crear` ni
                `subirFoto` llegan a llamarse, y `enviar` no lanza — así que siempre acaba en
                `setResultado` y nunca vuelve al formulario con el id perdido.

                `busy` ya está encendido durante el disparo: sin el guardia, un segundo clic manda otro
                envío que el servidor rechaza con 409. */}
            <button
              type="button"
              onClick={() => { setEnviandoPrevia(true); void ejecutar({ remisionId: pendiente.id, fotosSubidas: 0 }, true) }}
              disabled={!!busy}
              className="shrink-0 font-bold underline disabled:opacity-50"
            >
              Enviar esa
            </button>
          </div>
        )}
        {err && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded p-2">{err}</div>}
        <div className="flex justify-end items-center gap-2">
          {busy && <span className="text-[12px] text-slate-500 mr-auto">{busy}</span>}
          {/* Salida para una foto que no sube nunca (corrupta, o demasiado pesada): sin esto el técnico
              se queda atrapado reintentando. Lo que ya subió sí viaja, y el flujo de n8n concilia
              contra lo que se mandó, así que una remisión con menos fotos no cuenta como error. */}
          {creada && fotosPendientes > 0 && !busy && !faltaFotoPorNovedad(hayNovedad, envio.fotosSubidas) && (
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
