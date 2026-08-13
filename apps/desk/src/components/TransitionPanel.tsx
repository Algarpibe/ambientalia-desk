import { useEffect, useMemo, useState } from 'react';
import { transitionsForStatus, type Transition, type TransitionField, type PersonaLite, type Remision } from '@ambientalia/shared';
import { executeTransition, getPersonas } from '../api/client';
import { opcionesPersona, derivacionInicial, type OpcionPersona } from '../lib/personas';
import { botonRemision } from '../lib/botonRemision';
import { BuscadorOrdenVenta } from './BuscadorOrdenVenta';
import { useAuth } from '../auth/AuthContext'
import { canExecuteTransition } from '@ambientalia/shared'

/**
 * Renderiza los botones de transición válidos para el estado actual y su formulario.
 *
 * Junto a ellos va "Crear remisión", que no está en `TRANSITIONS` porque ahí solo va lo que se
 * ejecuta por `POST /api/tickets/:id/transition`: ésta abre un formulario. El ticket SÍ acaba
 * moviéndose, pero más tarde y por otra vía — cuando n8n confirma el documento, el servidor lo lleva
 * a `Remisión creada` (ver `server/db/estadoPorRemision.ts`).
 *
 * Y el botón solo se ofrece mientras el ticket sigue en la fase inicial (`puedeCrearRemisionDeEntrada`):
 * la remisión de entrada documenta que el equipo ENTRA, así que a partir de `Ingresado` crear una
 * sería fabricar un documento fuera de sitio.
 */
/**
 * Un dato que el ticket YA trae no se vuelve a pedir: se enseña bloqueado.
 *
 * Vale para las 35 transiciones porque `customFields` del ticket indexa las columnas promovidas por
 * la MISMA etiqueta que usa `key` en los campos — así que la correspondencia no hay que declararla.
 *
 * Quedan fuera tres clases, y por motivos distintos: el comentario y la prioridad son de la
 * transición y no del ticket, y el checkbox porque un `false` es indistinguible de "sin contestar"
 * y bloquearlo dejaría la casilla clavada en «no» para siempre.
 */
function yaLoTraeElTicket(f: TransitionField, delTicket: Record<string, string | null>): boolean {
  if (f.target !== 'customField' || f.kind === 'checkbox') return false
  const v = delTicket[f.key]
  return v != null && String(v).trim() !== ''
}

export function TransitionPanel({ ticketId, status, delTicket, primerDerivado, clientId, derivadoActual, remisiones, onDone, onCrearRemision }: {
  ticketId: string
  status: string
  /** `customFields` del ticket: lo que ya se sabe, para prellenar y bloquear. */
  delTicket: Record<string, string | null>
  /** Quien tomó el ticket. Lo propone «Aprobación», que devuelve el trabajo al taller. */
  primerDerivado?: string | null
  /** Acota el buscador de órdenes de venta al cliente del ticket. */
  clientId?: string | null
  /** A quién está derivado el ticket ahora, para conservarlo en el desplegable aunque esté de baja. */
  derivadoActual?: PersonaLite | null
  /** Las remisiones vigentes del ticket: deciden si el botón ofrece crear una o abrir la que ya hay. */
  remisiones?: Remision[] | null
  onDone: () => void
  onCrearRemision?: () => void
}) {
  const boton = botonRemision(status, remisiones ?? null)
  const { user } = useAuth()
  const transitions = transitionsForStatus(status).filter(
    (t) => !!user && canExecuteTransition(user.areas, user.isAdmin, t.area),
  )
  const [active, setActive] = useState<Transition | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Las fechas que rellena una OV: se muestran, pero no se teclean. */
  const fechasDeOV = (t: Transition) =>
    new Set(t.fields.map((f) => f.campoFecha).filter((x): x is string => !!x))

  // Las personas activas se piden UNA vez al montar: son pocas y no cambian mientras dura el panel.
  const [personas, setPersonas] = useState<PersonaLite[]>([])
  useEffect(() => { getPersonas().then(setPersonas).catch(() => {}) }, [])
  // Al derivado actual se le conserva su opción aunque ya no esté activo: si no, el desplegable se
  // pintaría en blanco y confirmar la etapa borraría la derivación sin que nadie lo pidiera.
  const opciones = useMemo(() => opcionesPersona(personas, derivadoActual ?? null), [personas, derivadoActual])

  function open(t: Transition) {
    // Lo que el ticket ya trae entra como valor inicial y se manda igual al confirmar: el servidor
    // exige los obligatorios, y omitirlos por estar bloqueados los daría por faltantes.
    const previos: Record<string, unknown> = {}
    for (const f of t.fields) {
      if (yaLoTraeElTicket(f, delTicket)) previos[f.key] = delTicket[f.key]
      // La derivación es el primer campo que llega PRELLENADO pero NO bloqueado, y hasta ahora las dos
      // cosas eran la misma. Sin esta segunda vía, la casilla abriría vacía en cada etapa y el técnico
      // se encontraría con que confirmar la etapa le borra el responsable que ya tenía.
      //
      // Y una etapa puede proponer a quién le pasa el trabajo, que pisa lo heredado: quién gana lo
      // decide `derivacionInicial`, que es donde se puede probar.
      else if (f.target === 'derivacion') {
        const inicial = derivacionInicial(f.porDefecto, {
          activas: personas,
          primerDerivado: primerDerivado ?? null,
          heredado: delTicket[f.key] ?? null,
        })
        if (inicial) previos[f.key] = inicial
      }
    }
    setActive(t);
    setValues(previos);
    setError(null);
  }

  /** Al elegir una OV se arrastra su fecha: es un dato de Books, no algo que se teclee aquí. */
  function elegirOrdenVenta(f: TransitionField, numero: string, fecha?: string) {
    setValues((s) => ({ ...s, [f.key]: numero, ...(f.campoFecha ? { [f.campoFecha]: fecha ?? '' } : {}) }))
  }

  async function submit() {
    if (!active) return;
    setBusy(true);
    setError(null);
    try {
      await executeTransition(ticketId, active.id, values);
      setActive(null);
      setValues({});
      onDone();
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Transiciones</span>
        {transitions.length === 0 ? (
          <span className="text-[11px] text-slate-400">Sin transiciones disponibles para tu rol en el estado «{status}».</span>
        ) : transitions.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => open(t)}
            className="text-[12px] font-bold text-[#2C7BE5] border border-[#2C7BE5] px-3 py-1 rounded hover:bg-blue-50"
          >
            {t.name} → {t.to}
          </button>
        ))}
        {/* Acción, no transición: en gris para que no se lea como un cambio de estado. Con una
            remisión ya creada y sin enviar, cambia de texto y lleva a ÉSA — el ticket no se mueve
            hasta que n8n confirma, así que sin esto seguía diciendo «Crear remisión» sobre un ticket
            que ya tenía una. */}
        {boton.visible && (
          <button
            type="button"
            onClick={onCrearRemision}
            className="text-[12px] font-bold text-slate-600 border border-slate-300 px-3 py-1 rounded hover:bg-slate-50"
          >
            {boton.texto}
          </button>
        )}
      </div>

      {active && (
        <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-5 w-[440px] max-h-[85vh] overflow-y-auto flex flex-col gap-3">
            <div>
              <h3 className="text-[15px] font-bold text-slate-800">{active.name}</h3>
              <p className="text-[12px] text-slate-500">Estado destino: <span className="font-bold">{active.to}</span> · Área: {active.area}</p>
            </div>
            {active.fields.map((f) => (
              <Field
                key={f.key}
                f={f}
                value={values[f.key]}
                onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))}
                // Bloqueado por dos motivos distintos que se ven igual: o el ticket ya lo trae, o lo
                // rellena la OV elegida (su fecha, que sale de Books y no se teclea aquí).
                //
                // Lo segundo solo mientras HAYA valor. Vacía se puede teclear, y esa condición no es
                // un capricho: cuando el ticket ya trae la orden, su campo llega bloqueado y entonces
                // no se pinta el buscador que arrastra la fecha, así que bloquearla también la dejaba
                // imposible de rellenar para siempre. Pasa con los tickets creados antes de que el
                // alta guardara la fecha, y con las órdenes de Books que no traen ninguna.
                bloqueado={yaLoTraeElTicket(f, delTicket) || (fechasDeOV(active).has(f.key) && !!values[f.key])}
                clientId={clientId}
                opciones={opciones}
                onElegirOrdenVenta={(n, fecha) => elegirOrdenVenta(f, n, fecha)}
              />
            ))}
            {error && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
            <div className="flex justify-end gap-2 mt-1">
              <button onClick={() => setActive(null)} className="px-3 py-1.5 text-[13px] text-slate-600">Cancelar</button>
              <button onClick={submit} disabled={busy} className="px-4 py-1.5 bg-[#2C7BE5] text-white rounded text-[13px] font-bold disabled:opacity-50">
                {busy ? 'Ejecutando…' : 'Confirmar transición'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ f, value, onChange, bloqueado, clientId, opciones, onElegirOrdenVenta }: {
  f: TransitionField
  value: unknown
  onChange: (v: unknown) => void
  bloqueado: boolean
  clientId?: string | null
  /** Personas a las que se puede derivar, ya etiquetadas. Solo la usa `kind: 'usuario'`. */
  opciones: OpcionPersona[]
  onElegirOrdenVenta: (numero: string, fecha?: string) => void
}) {
  const label = (
    <span className="text-[12px] font-medium text-slate-700">
      {f.label}
      {/* El asterisco sobra en lo que ya está resuelto: sigue siendo obligatorio, pero al usuario no
          le queda nada que hacer con él. */}
      {f.required && !bloqueado && <span className="text-red-500"> *</span>}
    </span>
  );
  // Un campo bloqueado se pinta como los de solo lectura, igual que en el formulario de remisión.
  const cls = `border border-slate-200 rounded p-2 text-[13px] disabled:bg-slate-50 disabled:text-slate-600 disabled:cursor-default`;

  if (f.kind === 'checkbox') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="accent-blue-600" />
        {label}
      </label>
    );
  }
  // Las personas no son `options` del catálogo —cambian, y hay que enseñar «Nombre · Cargo» pero
  // mandar el id—, así que el desplegable se alimenta de la lista que trae el panel.
  if (f.kind === 'usuario') {
    return (
      <div className="flex flex-col gap-1">
        {label}
        <select value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} className={cls}>
          {opciones.map((o) => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
        </select>
        <span className="text-[11px] text-slate-400">Opcional. Se puede cambiar en cada etapa.</span>
      </div>
    )
  }
  if (f.kind === 'ordenVenta' && !bloqueado) {
    return (
      <div className="flex flex-col gap-1">
        {label}
        <BuscadorOrdenVenta
          clientId={clientId}
          elegida={value ? { number: String(value) } : null}
          onElegir={(ov) => onElegirOrdenVenta(ov?.number ?? '', ov?.date)}
        />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      {label}
      {f.kind === 'comment' ? (
        <textarea value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} disabled={bloqueado} className={`${cls} h-20 resize-none`} />
      ) : f.kind === 'date' ? (
        <input type="date" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} disabled={bloqueado} className={cls} />
      ) : f.kind === 'number' ? (
        <input type="number" value={(value as number | string) ?? ''} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} disabled={bloqueado} className={cls} />
      ) : f.kind === 'select' ? (
        <select value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} disabled={bloqueado} className={cls}>
          <option value="" disabled>Elegir…</option>
          {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type="text" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} disabled={bloqueado} className={cls} />
      )}
    </div>
  );
}
