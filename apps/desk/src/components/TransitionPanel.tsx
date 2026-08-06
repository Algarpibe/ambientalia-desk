import { useState } from 'react';
import { transitionsForStatus, STATUS_REMISION_CREADA, type Transition, type TransitionField, type SalesOrderLite } from '@ambientalia/shared';
import { executeTransition, searchSalesOrders } from '../api/client';
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
 * Y por eso el botón desaparece justo en ese estado: la etapa ya está hecha. Desaparece SOLO ahí, no
 * para siempre, porque un ticket puede recibir dos equipos y necesitar una segunda remisión más
 * adelante en el flujo.
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

export function TransitionPanel({ ticketId, status, delTicket, clientId, onDone, onCrearRemision }: {
  ticketId: string
  status: string
  /** `customFields` del ticket: lo que ya se sabe, para prellenar y bloquear. */
  delTicket: Record<string, string | null>
  /** Acota el buscador de órdenes de venta al cliente del ticket. */
  clientId?: string | null
  onDone: () => void
  onCrearRemision?: () => void
}) {
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

  function open(t: Transition) {
    // Lo que el ticket ya trae entra como valor inicial y se manda igual al confirmar: el servidor
    // exige los obligatorios, y omitirlos por estar bloqueados los daría por faltantes.
    const previos: Record<string, unknown> = {}
    for (const f of t.fields) {
      if (yaLoTraeElTicket(f, delTicket)) previos[f.key] = delTicket[f.key]
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
        {/* Acción, no transición: en gris para que no se lea como un cambio de estado. */}
        {status !== STATUS_REMISION_CREADA && (
          <button
            type="button"
            onClick={onCrearRemision}
            className="text-[12px] font-bold text-slate-600 border border-slate-300 px-3 py-1 rounded hover:bg-slate-50"
          >
            Crear remisión
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
                bloqueado={yaLoTraeElTicket(f, delTicket) || fechasDeOV(active).has(f.key)}
                clientId={clientId}
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

function Field({ f, value, onChange, bloqueado, clientId, onElegirOrdenVenta }: {
  f: TransitionField
  value: unknown
  onChange: (v: unknown) => void
  bloqueado: boolean
  clientId?: string | null
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
  if (f.kind === 'ordenVenta' && !bloqueado) {
    return (
      <div className="flex flex-col gap-1">
        {label}
        <BuscadorOrdenVenta clientId={clientId} valor={(value as string) ?? ''} onElegir={onElegirOrdenVenta} />
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

/**
 * Buscador de órdenes de venta de Books, acotado al cliente del ticket.
 *
 * Se busca en vez de teclear porque el número de una OV vive en otro sistema: escrito a mano es la
 * vía más corta a un dato que no casa con nada. El servidor ya devuelve solo las CONFIRMADAS, así
 * que las anuladas y las facturadas no aparecen.
 *
 * Lo que NO se puede hacer, aunque la especificación lo pedía: filtrar por número de serie. Books no
 * lo tiene —una línea de OV apunta a un artículo de catálogo, no a una unidad serializada— y sus
 * líneas ni siquiera se replican a esta base. Lo que sí hay es `ticketNumber`, que sale del campo
 * `cf_n_ticket` de la OV, y por eso cada resultado dice a qué ticket se refiere: es la señal buena
 * para reconocer la OV que corresponde.
 */
function BuscadorOrdenVenta({ clientId, valor, onElegir }: {
  clientId?: string | null
  valor: string
  onElegir: (numero: string, fecha?: string) => void
}) {
  const [q, setQ] = useState('')
  const [opciones, setOpciones] = useState<SalesOrderLite[] | null>(null)
  const [buscando, setBuscando] = useState(false)

  async function buscar(texto: string) {
    setQ(texto)
    setBuscando(true)
    try {
      setOpciones(await searchSalesOrders(texto, clientId ?? undefined))
    } catch {
      // Un fallo al buscar no puede dejar el campo inservible: se avisa con la lista vacía y el
      // usuario puede reintentar tecleando otra vez.
      setOpciones([])
    } finally {
      setBuscando(false)
    }
  }

  if (valor) {
    return (
      <div className="flex items-center gap-2">
        <input value={valor} disabled className="flex-1 border border-slate-200 rounded p-2 text-[13px] bg-slate-50 text-slate-600" />
        <button type="button" onClick={() => { onElegir('', undefined); setOpciones(null); setQ('') }} className="text-[12px] text-slate-500 underline">
          Cambiar
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        value={q}
        onChange={(e) => void buscar(e.target.value)}
        placeholder={clientId ? 'Buscar orden de venta del cliente…' : 'Buscar orden de venta…'}
        className="border border-slate-200 rounded p-2 text-[13px]"
      />
      {buscando && <span className="text-[11px] text-slate-400">Buscando…</span>}
      {opciones && opciones.length === 0 && !buscando && (
        <span className="text-[11px] text-slate-400">Sin órdenes de venta confirmadas para esa búsqueda.</span>
      )}
      {opciones && opciones.length > 0 && (
        <ul className="border border-slate-200 rounded max-h-[180px] overflow-auto">
          {opciones.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => onElegir(o.number, o.date)}
                className="w-full text-left px-2 py-1.5 text-[12px] hover:bg-blue-50 flex flex-col"
              >
                <span className="font-bold text-slate-700">
                  {o.number}
                  {o.ticketNumber && <span className="ml-2 text-[10px] font-bold text-blue-600">Ticket #{o.ticketNumber}</span>}
                </span>
                <span className="text-slate-400">{[o.customerName, o.date].filter(Boolean).join(' · ')}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
