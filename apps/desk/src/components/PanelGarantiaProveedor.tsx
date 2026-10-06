import { useState } from 'react'
import {
  MOTIVOS_NO_RECLAMA, RESULTADOS_RECLAMACION, ETIQUETA_MOTIVO_NO_RECLAMA, ETIQUETA_ESTADO_RECLAMACION, ETIQUETA_RESULTADO_RECLAMACION,
  puedeGestionarReclamacion, siguienteEstado, diaEnZona, type GarantiaProveedor,
} from '@ambientalia/shared'
import { useAuth } from '../auth/AuthContext'
import { useAsync } from '../hooks/useAsync'
import {
  garantiaDelTicket, responderReclamacion, editarReclamacion, avanzarReclamacion, mensajeDelServidor,
  type GarantiaDelTicket, type OviDelTicket,
} from '../api/client'

/**
 * La reclamación de garantía al fabricante de cada OVI de un ticket (F1B-13, lote 2; `tickets-core` RQ-TC-49).
 *
 * REGLA 13 — qué es comodidad y qué es guarda (la tabla con las líneas del servidor está en `apply-progress.md`):
 *  - La pregunta, los formularios y los botones sólo se ENSEÑAN a quien `puedeGestionarReclamacion` (consumido de
 *    `@ambientalia/shared`, no reescrito). La guarda es el servidor: `403` en responder, avanzar y editar.
 *  - El paso que se ofrece es `siguienteEstado`; el servidor rechaza cualquier otro con `409`.
 *  - NINGÚN número ni texto se valida aquí: se manda lo escrito y el error del servidor (403, 409, 422) se ENSEÑA tal cual.
 *    Un campo numérico vacío viaja como `null` (ausente); uno que no es número viaja como texto, para que el servidor lo rechace.
 *  - Los `.tsx` de `apps/desk/src` están fuera de la red de pruebas por decisión de Gerencia (F0-00): este fichero no lleva rojo previo.
 */

const fmtDia = (iso: string | null) => diaEnZona(iso) ?? '—' // mismo día civil que nombra el aviso de 60 días
const fmtValor = (v: number | null) => (v == null ? '—' : v.toLocaleString('es-CO'))
const numeroDelCampo = (t: string): number | string | null => (t.trim() === '' ? null : Number.isFinite(Number(t)) ? Number(t) : t)

const INPUT = 'border border-slate-200 rounded px-2 py-1 text-[12px]'
const BOTON = 'text-[11px] font-bold bg-blue-600 text-white px-2 py-1 rounded disabled:opacity-50'
const ENLACE = 'text-[11px] font-bold text-blue-600 hover:underline'

/** Corre una petición enseñando el error del servidor tal cual; al terminar bien, recarga el panel. */
function useAccion(onCambio: () => void) {
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function correr(fn: () => Promise<unknown>): Promise<boolean> {
    setOcupado(true)
    setError(null)
    try { await fn(); onCambio(); return true } catch (e) { setError(mensajeDelServidor(e)); return false } finally { setOcupado(false) }
  }
  return { ocupado, error, correr }
}

interface Campos { fabricante: string; piezaReferencia: string; piezaSerial: string; rma: string; valorReclamado: string }

function FormularioFicha({ inicial, conRma, textoBoton, ocupado, onEnviar, onCancelar }: {
  inicial: Campos; conRma: boolean; textoBoton: string; ocupado: boolean; onEnviar: (c: Campos) => void; onCancelar: () => void
}) {
  const [c, setC] = useState(inicial)
  const campo = (k: keyof Campos, etiqueta: string) => (
    <label className="flex flex-col gap-0.5 text-[11px] text-slate-500">
      {etiqueta}
      <input value={c[k]} onChange={(e) => setC({ ...c, [k]: e.target.value })} className={INPUT} />
    </label>
  )
  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="flex gap-2 flex-wrap">
        {campo('fabricante', 'Fabricante')}{campo('piezaReferencia', 'Referencia de la pieza')}{campo('piezaSerial', 'Serial de la pieza')}
        {conRma && campo('rma', 'RMA')}{campo('valorReclamado', 'Valor reclamado')}
      </div>
      <div className="flex gap-2 items-center">
        <button disabled={ocupado} onClick={() => onEnviar(c)} className={BOTON}>{textoBoton}</button>
        <button disabled={ocupado} onClick={onCancelar} className="text-[11px] text-slate-500 hover:underline">Cancelar</button>
      </div>
    </div>
  )
}

function Pregunta({ o, fabricantePropuesto, onCambio }: { o: OviDelTicket; fabricantePropuesto: string | null; onCambio: () => void }) {
  const [modo, setModo] = useState<'si' | 'no' | null>(null)
  const [motivo, setMotivo] = useState<string>(MOTIVOS_NO_RECLAMA[0])
  const { ocupado, error, correr } = useAccion(onCambio)
  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-bold text-slate-700">¿Se reclama al fabricante?</span>
        <button onClick={() => setModo('si')} className={ENLACE}>Sí</button>
        <button onClick={() => setModo('no')} className={ENLACE}>No</button>
      </div>
      {modo === 'si' && (
        <FormularioFicha
          inicial={{ fabricante: fabricantePropuesto ?? '', piezaReferencia: '', piezaSerial: '', rma: '', valorReclamado: '' }}
          conRma={false} textoBoton="Abrir reclamación" ocupado={ocupado} onCancelar={() => setModo(null)}
          onEnviar={(c) => correr(() => responderReclamacion(o.asociacionId, {
            reclama: true, fabricante: c.fabricante, piezaReferencia: c.piezaReferencia, piezaSerial: c.piezaSerial, valorReclamado: numeroDelCampo(c.valorReclamado) as number | null,
          }))}
        />
      )}
      {modo === 'no' && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <select value={motivo} onChange={(e) => setMotivo(e.target.value)} className={INPUT}>
            {MOTIVOS_NO_RECLAMA.map((m) => <option key={m} value={m}>{ETIQUETA_MOTIVO_NO_RECLAMA[m]}</option>)}
          </select>
          <button disabled={ocupado} onClick={() => correr(() => responderReclamacion(o.asociacionId, { reclama: false, motivo }))} className={BOTON}>Confirmar</button>
          <button disabled={ocupado} onClick={() => setModo(null)} className="text-[11px] text-slate-500 hover:underline">Cancelar</button>
        </div>
      )}
      {error && <div className="mt-1 text-red-600">{error}</div>}
    </div>
  )
}

function Ficha({ f, puede, onCambio }: { f: GarantiaProveedor; puede: boolean; onCambio: () => void }) {
  const [editando, setEditando] = useState(false)
  const [resolviendo, setResolviendo] = useState(false)
  const [resultado, setResultado] = useState<string>(RESULTADOS_RECLAMACION[0])
  const [recuperado, setRecuperado] = useState('')
  const { ocupado, error, correr } = useAccion(onCambio)
  const siguiente = siguienteEstado(f.estado)
  return (
    <div className="mt-1">
      <div className="flex gap-x-4 gap-y-0.5 flex-wrap">
        <span>Fabricante: <b>{f.fabricante}</b></span>
        <span>Pieza: {f.piezaReferencia ?? '—'}{f.piezaSerial ? ` (serial ${f.piezaSerial})` : ''}</span>
        <span>RMA: {f.rma ?? '—'}</span>
        <span>Valor reclamado: {fmtValor(f.valorReclamado)}</span>
        <span>Abierta el {fmtDia(f.respondidaAt)}{f.enviadaAt ? `, enviada el ${fmtDia(f.enviadaAt)}` : ''}</span>
        {f.resultado && <span>Resultado: {ETIQUETA_RESULTADO_RECLAMACION[f.resultado]}, recuperado {fmtValor(f.valorRecuperado)} el {fmtDia(f.resueltaAt)}</span>}
      </div>
      {puede && f.estado !== 'resuelta' && !editando && !resolviendo && (
        <div className="mt-1 flex gap-3 items-center">
          <button onClick={() => setEditando(true)} className={ENLACE}>Editar</button>
          {siguiente === 'enviada' && <button disabled={ocupado} onClick={() => correr(() => avanzarReclamacion(f.id, { a: siguiente }))} className={ENLACE}>Marcar como enviada al fabricante</button>}
          {siguiente === 'resuelta' && <button onClick={() => setResolviendo(true)} className={ENLACE}>Resolver</button>}
        </div>
      )}
      {puede && editando && (
        <FormularioFicha
          inicial={{ fabricante: f.fabricante ?? '', piezaReferencia: f.piezaReferencia ?? '', piezaSerial: f.piezaSerial ?? '', rma: f.rma ?? '', valorReclamado: f.valorReclamado == null ? '' : String(f.valorReclamado) }}
          conRma textoBoton="Guardar" ocupado={ocupado} onCancelar={() => setEditando(false)}
          onEnviar={async (c) => {
            const bien = await correr(() => editarReclamacion(f.id, {
              fabricante: c.fabricante, piezaReferencia: c.piezaReferencia, piezaSerial: c.piezaSerial, rma: c.rma, valorReclamado: numeroDelCampo(c.valorReclamado) as number | null,
            }))
            if (bien) setEditando(false)
          }}
        />
      )}
      {puede && resolviendo && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <select value={resultado} onChange={(e) => setResultado(e.target.value)} className={INPUT}>
            {RESULTADOS_RECLAMACION.map((r) => <option key={r} value={r}>{ETIQUETA_RESULTADO_RECLAMACION[r]}</option>)}
          </select>
          {resultado !== 'rechazada' && <input value={recuperado} onChange={(e) => setRecuperado(e.target.value)} placeholder="Valor recuperado" className={INPUT} />}
          <button disabled={ocupado} onClick={() => correr(() => avanzarReclamacion(f.id, { a: 'resuelta', resultado, valorRecuperado: resultado === 'rechazada' ? undefined : (numeroDelCampo(recuperado) as number | undefined) }))} className={BOTON}>Resolver</button>
          <button disabled={ocupado} onClick={() => setResolviendo(false)} className="text-[11px] text-slate-500 hover:underline">Cancelar</button>
        </div>
      )}
      {error && <div className="mt-1 text-red-600">{error}</div>}
    </div>
  )
}

function Fila({ o, fabricantePropuesto, puede, onCambio }: { o: OviDelTicket; fabricantePropuesto: string | null; puede: boolean; onCambio: () => void }) {
  const r = o.respuesta
  const marca = o.pendiente ? 'Pendiente de respuesta' : r && !r.reclama ? `No se reclama: ${r.motivoNoReclama ? ETIQUETA_MOTIVO_NO_RECLAMA[r.motivoNoReclama] : '—'}` : r?.estado ? ETIQUETA_ESTADO_RECLAMACION[r.estado] : ''
  return (
    <li className={`px-3 py-2 text-[12px] ${o.liberada ? 'bg-slate-50 text-slate-500' : 'text-slate-700'}`}>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-bold text-slate-800">{o.numero}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${o.pendiente ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{marca}</span>
        {o.liberada && <span className="text-[10px] px-1.5 py-0.5 rounded border font-bold bg-slate-100 text-slate-500 border-slate-200">Liberada</span>}
      </div>
      {o.pendiente && puede && <Pregunta o={o} fabricantePropuesto={fabricantePropuesto} onCambio={onCambio} />}
      {r?.reclama && <Ficha f={r} puede={puede} onCambio={onCambio} />}
    </li>
  )
}

export function PanelGarantiaProveedor({ ticketId }: { ticketId: string }) {
  const { user } = useAuth()
  const { data, loading, error, reload } = useAsync<GarantiaDelTicket>(() => garantiaDelTicket(ticketId), [ticketId])
  const [abierto, setAbierto] = useState(false)
  const puede = puedeGestionarReclamacion(user)
  const ovis = data?.ovis ?? []
  if (!error && !loading && ovis.length === 0) return null
  const pendientes = ovis.filter((o) => o.pendiente).length

  return (
    <div className="border-t border-slate-200 bg-white shrink-0">
      <button onClick={() => setAbierto((v) => !v)} className="w-full text-left px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800">
        RECLAMACIÓN AL FABRICANTE ({loading ? '…' : `${pendientes} pendientes de respuesta`})
      </button>
      {abierto && (
        <div className="max-h-[260px] overflow-y-auto">
          {error && <div className="px-3 py-2 text-[12px] text-red-600">No se pudo cargar la reclamación al fabricante: {error}</div>}
          <ul className="divide-y divide-slate-100">
            {ovis.map((o) => <Fila key={o.asociacionId} o={o} fabricantePropuesto={data?.fabricantePropuesto ?? null} puede={puede} onCambio={reload} />)}
          </ul>
        </div>
      )}
    </div>
  )
}
