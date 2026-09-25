import { useState } from 'react'
import type { CambioEquipo, EquipoHistorial, HistorialRemision, HistorialTicket, HistorialTransition } from '@ambientalia/shared'
import { ETIQUETA_CAMPO_COMERCIAL, urlSegura } from '@ambientalia/shared'
import { useAsync } from '../hooks/useAsync'
import { fetchEquipoHistorial } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { ESTADO_REMISION, ESTADO_REMISION_DESCONOCIDA } from '../lib/remisionResultado'
import { Adjuntos } from './Adjuntos'
import { FichaTecnica } from './FichaTecnica'
import { EquipoForm } from './EquiposAdmin'

function fmtFecha(s: string | null): string {
  if (!s) return ''
  const d = new Date(s)
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
}

/** Fecha y hora de una fila del registro de cambios (RQ-HV-10): a diferencia de `fmtFecha`, que sólo
 * pinta el día de las fechas comerciales (`AAAA-MM-DD`), aquí `fecha` es una marca de tiempo completa. */
function fmtFechaHora(s: string): string {
  const d = new Date(s)
  return isNaN(d.getTime()) ? '' : d.toLocaleString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** Une lo que tenga contenido con el separador de siempre, saltándose los huecos. */
const meta = (partes: Array<string | null | undefined>) => partes.filter(Boolean).join(' · ')

function TarjetaRemision({ r }: { r: HistorialRemision }) {
  const historica = r.origen === 'historico'
  // Mismo criterio que el panel del ticket: una remisión histórica no pasó por el flujo de n8n, así
  // que su `ok` no significa lo mismo y lleva su propia marca en vez del distintivo de estado.
  const badge = ESTADO_REMISION[r.estado] ?? ESTADO_REMISION_DESCONOCIDA

  return (
    <div className="bg-white border border-slate-200 rounded-md p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-[#2C7BE5] uppercase tracking-wide">
            Remisión de {r.tipo}
          </div>
          <div className="text-[12px] text-slate-500 mt-0.5">
            {meta([fmtFecha(r.fecha), r.tipoServicio, r.tecnico])}
          </div>
        </div>
        <span className={`text-[11px] px-2 py-0.5 rounded border font-bold shrink-0 ${historica ? 'bg-slate-50 text-slate-500 border-slate-200' : badge.className}`}>
          {historica ? 'Del histórico' : badge.label}
        </span>
      </div>

      {/* Las observaciones del técnico, tal cual y sin etiqueta: son la prosa de la entrada. */}
      {r.observaciones && <div className="text-[13px] text-slate-700 mt-2 whitespace-pre-line">{r.observaciones}</div>}

      {r.incluye.length > 0 && (
        <div className="text-[12px] text-slate-500 mt-1">Incluye: {r.incluye.join(', ')}</div>
      )}

      <div className="text-[12px] text-slate-400 mt-1">
        {r.ticketNumero
          ? `Ticket ${r.ticketNumero}`
          : /* De las 149 históricas, 56 no casaron con ningún ticket. Decirlo evita que se lea como
               un dato que falta por cargar: es un estado legítimo. */
            'Sin ticket asociado'}
        {/* Sin ticket, la empresa es lo único que dice de quién era el equipo ese día — y el equipo
            puede haber cambiado de manos desde entonces, así que no vale el cliente de la cabecera. */}
        {!r.ticketNumero && r.empresa && ` · ${r.empresa}`}
      </div>

      <Adjuntos items={r.adjuntos} />
    </div>
  )
}

function TarjetaTicket({ t }: { t: HistorialTicket }) {
  return (
    <div className="bg-white border border-slate-200 rounded-md p-4">
      <div className="text-[13px] font-bold text-slate-500 uppercase tracking-wide">
        Ticket {t.number}
      </div>
      <div className="text-[14px] font-bold text-slate-800 mt-0.5">{t.subject}</div>
      <div className="text-[12px] text-slate-500 mt-0.5">
        {meta([t.status, t.tecnico ?? 'Sin asignar', t.codigoServicio, fmtFecha(t.createdAt ?? null)])}
      </div>
      {t.pasos.length > 0 && (
        <ol className="mt-3 border-l-2 border-slate-100 pl-4 flex flex-col gap-2">
          {t.pasos.map((p, i) => p.clase === 'remision' ? (
            <PasoRemision key={i} r={p.remision} />
          ) : (
            <PasoEtapa key={i} x={p.etapa} />
          ))}
        </ol>
      )}
    </div>
  )
}

/** Una etapa del flujo, dentro de la línea de tiempo del ticket. */
function PasoEtapa({ x }: { x: HistorialTransition }) {
  return (
    <li className="text-[12px] text-slate-600 relative">
      <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-blue-400" />
      <b>{x.transitionName ?? 'Transición'}</b>
      {(x.fromStatus || x.toStatus) && <span> · {x.fromStatus ?? '—'} → {x.toStatus ?? '—'}</span>}
      {[x.area, x.performedBy, fmtFecha(x.performedAt)].filter(Boolean).length > 0 && (
        <span className="text-slate-400"> · {[x.area, x.performedBy, fmtFecha(x.performedAt)].filter(Boolean).join(' · ')}</span>
      )}
      {/* Lo que se hizo, que es lo que de verdad busca quien abre una hoja de vida. Llega en
          TEXTO plano desde el servidor y se pinta como texto: React lo escapa, así que no
          hace falta DOMPurify como en los paneles que sí reciben HTML. */}
      {x.comentario && (
        <div className="mt-0.5 text-slate-500 italic">«{x.comentario}»</div>
      )}
      {x.adjuntos && x.adjuntos.length > 0 && (
        <div className="mt-0.5 text-slate-400">
          {/* Solo los nombres: los ficheros viven en Zoho y esta pantalla no los descarga.
              Verlos nombrados ya dice qué informe se emitió y permite buscarlo en el Drive. */}
          {x.adjuntos.join(' · ')}
        </div>
      )}
    </li>
  )
}

/**
 * Una remisión, dentro de la línea de tiempo del ticket y al mismo nivel que las etapas.
 *
 * Antes iba en una tarjeta suelta al nivel del ticket, y eso la hacía parecer otra cosa de otro rango:
 * para quien lee una hoja de vida, recibir el equipo es un paso del servicio igual que diagnosticarlo.
 * Conserva su punto en azul más fuerte para que siga distinguiéndose de una etapa del flujo.
 */
function PasoRemision({ r }: { r: HistorialRemision }) {
  return (
    <li className="text-[12px] text-slate-600 relative">
      <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-[#2C7BE5]" />
      <b className="text-[#2C7BE5]">Remisión de {r.tipo}</b>
      {[r.tipoServicio, r.tecnico, fmtFecha(r.fecha)].filter(Boolean).length > 0 && (
        <span className="text-slate-400"> · {[r.tipoServicio, r.tecnico, fmtFecha(r.fecha)].filter(Boolean).join(' · ')}</span>
      )}
      {r.origen === 'historico' && <span className="text-slate-400"> · Del histórico</span>}
      {r.observaciones && <div className="mt-0.5 text-slate-500 italic">«{r.observaciones}»</div>}
      {r.incluye.length > 0 && <div className="mt-0.5 text-slate-400">Incluye: {r.incluye.join(', ')}</div>}
      <Adjuntos items={r.adjuntos} />
    </li>
  )
}

/** Una fila del registro de cambios de los seis campos comerciales (RQ-HV-10). El mantenedor enseña su
 * nombre (`anteriorTexto`/`nuevoTexto`, resuelto en el servidor) en vez del id crudo. */
function FilaCambio({ c }: { c: CambioEquipo }) {
  const anterior = c.anteriorTexto ?? c.anterior ?? '—'
  const nuevo = c.nuevoTexto ?? c.nuevo ?? '—'
  return (
    <li className="text-[12px] text-slate-600 py-2 border-b border-slate-100 last:border-0">
      <span className="font-bold text-slate-700">{ETIQUETA_CAMPO_COMERCIAL[c.campo]}</span>
      <span className="text-slate-400"> · {c.usuarioNombre} · {fmtFechaHora(c.fecha)}</span>
      <div className="mt-0.5">{anterior} → {nuevo}</div>
    </li>
  )
}

/** Sección «Cambios» de la hoja de vida (RQ-HV-12): el registro de RQ-HV-10, más reciente primero
 * (ya lo devuelve así `GET /historial`, sin reordenar aquí). */
function SeccionCambios({ cambios }: { cambios: CambioEquipo[] }) {
  if (cambios.length === 0) return null
  return (
    <section className="bg-white border border-slate-200 rounded-md p-4 mb-4">
      <h3 className="text-[13px] font-bold text-slate-700 uppercase tracking-wide mb-2">Cambios</h3>
      <ul>{cambios.map((c, i) => <FilaCambio key={i} c={c} />)}</ul>
    </section>
  )
}

/**
 * La hoja de vida del equipo, en dos montajes y con una sola petición.
 *
 * CON `onClose` se monta como capa a pantalla completa —la abren el botón de la cabecera del ticket
 * y la pantalla de Equipos—, y sin él se monta en línea, que es como la usa la pestaña HOJA DE VIDA
 * del ticket. La diferencia es solo el cromo: el cuerpo es el mismo y por eso vive en un único sitio.
 *
 * En línea NO trae su propio contenedor con scroll: el de la pestaña ya lo pone, y anidar dos deja
 * una barra de desplazamiento dentro de otra.
 */
export function HojaDeVida({ equipoId, onClose }: { equipoId: string; onClose?: () => void }) {
  const { user } = useAuth()
  const { data, loading, error, reload } = useAsync<EquipoHistorial>(() => fetchEquipoHistorial(equipoId), [equipoId])
  const eq = data?.equipo
  const cronologia = data?.cronologia ?? []
  const cambios = data?.cambios ?? []
  const nTickets = cronologia.filter((e) => e.clase === 'ticket').length
  const nRemisiones = cronologia.length - nTickets
  // Botón «Editar» (RQ-HV-12): reutiliza el mismo `EquipoForm` que el listado de Equipos; el
  // servidor impone qué campos quedan en solo lectura (RQ-HV-09), aquí sólo es comodidad probada.
  const [editando, setEditando] = useState(false)

  const aviso = error ? <div className="bg-red-50 text-red-700 text-[12px] px-4 py-2">{error}</div> : null

  const cuerpo = (
    <div className="bg-[#f4f5f7] p-6 min-h-full">
      {loading && !eq && <div className="text-center text-slate-400 text-[13px]">Cargando…</div>}
      {eq && data && (
        <div className="max-w-[900px] mx-auto">
          <section className="bg-white border border-slate-200 rounded-md p-4 mb-4">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-[16px] font-bold text-slate-800">{eq.marca} {eq.modelo} <span className="text-slate-400 font-normal">· {eq.tipo}</span></h2>
              <button type="button" onClick={() => setEditando(true)} className="text-[12px] text-blue-600 shrink-0">Editar</button>
            </div>
            <div className="text-[13px] text-slate-500 mt-1">Serie <b className="text-slate-700">{eq.serial}</b> · Cliente {eq.clienteNombre ?? '—'} · {eq.active ? 'Activo' : 'Inactivo'}</div>
            {/* Los seis campos comerciales (F1B-02), con '—' explícito si están vacíos: no son
                obligatorios (RQ-HV-01) y esta cabecera no puede fallar por su ausencia. Las fechas
                se enseñan TAL CUAL (AAAA-MM-DD), sin `fmtFecha` — que desfasa un día en UTC-5. */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-[12px] text-slate-500 mt-2">
              <div>Adquisición: <span className="text-slate-700">{eq.fechaAdquisicion ?? '—'}</span></div>
              <div>Factura de compra: <span className="text-slate-700">{eq.fechaFacturaCompra ?? '—'}</span></div>
              <div>Fin de garantía: <span className="text-slate-700">{eq.finGarantia ?? '—'}</span></div>
              <div>Código interno: <span className="text-slate-700">{eq.codigoInterno ?? '—'}</span></div>
              <div>Mantenedor: <span className="text-slate-700">{eq.mantenedorNombre ?? '—'}</span></div>
              <div>
                Drive:{' '}
                {urlSegura(eq.driveUrl ?? null) ? (
                  <a href={eq.driveUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Ver en Google Drive</a>
                ) : '—'}
              </div>
            </div>
            <div className="text-[12px] text-slate-400 mt-1">
              {nTickets} {nTickets === 1 ? 'ticket' : 'tickets'} · {nRemisiones} {nRemisiones === 1 ? 'remisión' : 'remisiones'}
            </div>
          </section>

          <SeccionCambios cambios={cambios} />

          {/* Arriba, antes de la cronología: con esto, la hoja de vida pasa a ser el sitio único del
              equipo — qué es (ficha técnica), qué le ha pasado (cronología) y cómo se repara. */}
          {eq.modeloId && (
            <div className="mb-4">
              <FichaTecnica modeloId={eq.modeloId} />
            </div>
          )}

          {cronologia.length === 0 && (
            <div className="text-[13px] text-slate-400">Este equipo aún no tiene tickets ni remisiones.</div>
          )}

          {/* Una sola línea de tiempo, no dos inventarios: lo que se quiere leer de un equipo es
              qué le ha pasado y en qué orden. El punto distingue de un vistazo qué clase de
              parada es cada una, que es lo que el color tiene que resolver aquí. */}
          <div className="relative border-l-2 border-slate-200 pl-6 flex flex-col gap-4">
            {cronologia.map((e) => (
              <div key={e.clase === 'ticket' ? `t-${e.ticket.id}` : `r-${e.remision.id}`} className="relative">
                <span
                  className={`absolute -left-[31px] top-4 w-3 h-3 rounded-full border-2 border-[#f4f5f7] ${
                    e.clase === 'remision' ? 'bg-[#2C7BE5]' : 'bg-slate-400'
                  }`}
                />
                {e.clase === 'remision' ? <TarjetaRemision r={e.remision} /> : <TarjetaTicket t={e.ticket} />}
              </div>
            ))}
          </div>
        </div>
      )}
      {editando && eq && (
        <EquipoForm
          equipo={eq}
          isAdmin={!!user?.isAdmin}
          areas={user?.areas ?? []}
          onClose={() => setEditando(false)}
          onSaved={() => { setEditando(false); reload() }}
        />
      )}
    </div>
  )

  if (!onClose) return <>{aviso}{cuerpo}</>

  return (
    <div className="fixed inset-0 z-[75] bg-white flex flex-col">
      <div className="bg-[#2C2E3E] text-white h-[48px] flex items-center px-4 gap-3 shrink-0">
        <button onClick={onClose} className="hover:bg-white/10 p-1 rounded"><span className="material-symbols-outlined">arrow_back</span></button>
        <h1 className="text-[15px] font-bold">Hoja de vida</h1>
        {eq && <span className="text-[13px] text-white/70 truncate">· {eq.serial} · {eq.marca} {eq.modelo}</span>}
      </div>
      {aviso}
      <div className="flex-1 overflow-auto">{cuerpo}</div>
    </div>
  )
}
