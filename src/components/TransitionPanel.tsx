import { useState } from 'react';
import { transitionsForStatus, type Transition, type TransitionField } from '../../shared/transitions';
import { executeTransition } from '../api/client';

/** Renderiza los botones de transición válidos para el estado actual y su formulario. */
export function TransitionPanel({ ticketId, status, onDone }: { ticketId: string; status: string; onDone: () => void }) {
  const transitions = transitionsForStatus(status);
  const [active, setActive] = useState<Transition | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (transitions.length === 0) {
    return <div className="text-[11px] text-slate-400">Sin transiciones disponibles para el estado «{status}».</div>;
  }

  function open(t: Transition) {
    setActive(t);
    setValues({});
    setError(null);
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
        {transitions.map((t) => (
          <button
            key={t.id}
            onClick={() => open(t)}
            className="text-[12px] font-bold text-[#2C7BE5] border border-[#2C7BE5] px-3 py-1 rounded hover:bg-blue-50"
          >
            {t.name} → {t.to}
          </button>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-5 w-[440px] max-h-[85vh] overflow-y-auto flex flex-col gap-3">
            <div>
              <h3 className="text-[15px] font-bold text-slate-800">{active.name}</h3>
              <p className="text-[12px] text-slate-500">Estado destino: <span className="font-bold">{active.to}</span> · Área: {active.area}</p>
            </div>
            {active.fields.map((f) => (
              <Field key={f.key} f={f} value={values[f.key]} onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))} />
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

function Field({ f, value, onChange }: { f: TransitionField; value: unknown; onChange: (v: unknown) => void }) {
  const label = (
    <span className="text-[12px] font-medium text-slate-700">
      {f.label}{f.required && <span className="text-red-500"> *</span>}
    </span>
  );
  const cls = 'border border-slate-200 rounded p-2 text-[13px]';

  if (f.kind === 'checkbox') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="accent-blue-600" />
        {label}
      </label>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      {label}
      {f.kind === 'comment' ? (
        <textarea value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} className={`${cls} h-20 resize-none`} />
      ) : f.kind === 'date' ? (
        <input type="date" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} className={cls} />
      ) : f.kind === 'number' ? (
        <input type="number" value={(value as number | string) ?? ''} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} className={cls} />
      ) : f.kind === 'select' ? (
        <select value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} className={cls}>
          <option value="" disabled>Elegir…</option>
          {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type="text" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </div>
  );
}
