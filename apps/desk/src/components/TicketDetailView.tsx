import React from 'react';
import { useState } from 'react';
import DOMPurify from 'dompurify';
import type { TicketDetail, Message, Ticket, Activity } from '@ambientalia/shared';
import { useAsync } from '../hooks/useAsync';
import { useResizable } from '../hooks/useResizable';
import { fetchTicket, fetchConversations, replyTicket, fetchActivities, fetchRemisiones, type RemisionConFotos } from '../api/client';
import { TicketProperties } from './TicketProperties';
import { TransitionPanel } from './TransitionPanel';
import { HojaDeVida } from './HojaDeVida';
import { Adjuntos } from './Adjuntos';
import { valoresConocidos } from '../lib/valoresTransicion';
import { ActividadesPanel } from './ActividadesPanel';
import { CrearRemision } from './CrearRemision';
import { PanelRemisiones } from './PanelRemisiones';

/** Manija de arrastre entre columnas (reemplaza el borde). */
function ResizeHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return <div onMouseDown={onMouseDown} className="w-1 shrink-0 cursor-col-resize bg-slate-200 hover:bg-blue-400 transition-colors" />
}
import { ResolucionPanel } from './ResolucionPanel';
import { HistoriaPanel } from './HistoriaPanel';

interface TicketDetailViewProps {
    ticketId: string;
    onClose: () => void;
    /** Se llama cuando el ticket cambia (p.ej. tras una transición) para refrescar el tablero. */
    onChanged?: () => void;
    /** Lista de tickets cargada en el tablero, para la barra lateral de tickets del mismo estado. */
    tickets?: Ticket[];
    /** Abrir otro ticket desde la barra lateral. */
    onSelect?: (id: string) => void;
}

export const TicketDetailView: React.FC<TicketDetailViewProps> = ({ ticketId, onClose, onChanged, tickets, onSelect }) => {
    const { data: ticket, loading, reload: reloadTicket } = useAsync<TicketDetail>(() => fetchTicket(ticketId), [ticketId]);
    const listCol = useResizable('ticket:listW', 300, 220, 520);
    const propsCol = useResizable('ticket:propsW', 300, 240, 520);
    // Solo los tickets en el MISMO estado que el ticket abierto (incluye el actual, resaltado).
    const siblings = (tickets ?? []).filter((t) => ticket != null && t.status === ticket.status);
    const { data: messages, reload: reloadMessages } = useAsync<Message[]>(() => fetchConversations(ticketId), [ticketId]);
    const convCount = (messages ?? []).length;
    const adjuntosCount = (messages ?? []).reduce((n, m) => n + (m.attachments?.length ?? 0), 0);
    const { data: actividades } = useAsync<Activity[]>(() => fetchActivities(ticketId), [ticketId]);
    const actCount = (actividades ?? []).length;
    // Se pide aquí y no dentro de PanelRemisiones porque el contador de la pestaña ya necesita este
    // mismo listado: pedirlo también dentro del panel duplicaría la petición.
    const { data: remisiones, loading: remisionesLoading, error: remisionesError, reload: reloadRemisiones } = useAsync<RemisionConFotos[]>(() => fetchRemisiones(ticketId), [ticketId]);
    const remCount = (remisiones ?? []).length;
    const [activeTabId, setActiveTabId] = useState<string>('conv');
    const TABS = [
        { id: 'conv', label: `${convCount} ${convCount === 1 ? 'CONVERSACIÓN' : 'CONVERSACIONES'}`, view: 'conversaciones' },
        { id: 'res', label: 'RESOLUCIÓN', view: 'resolucion' },
        { id: 'tiempo', label: 'ENTRADA DE TIEMPO', view: 'otros' },
        { id: 'adj', label: `${adjuntosCount} ${adjuntosCount === 1 ? 'ADJUNTO' : 'ADJUNTOS'}`, view: 'otros' },
        { id: 'act', label: `${actCount} ACTIVIDADES`, view: 'actividades' },
        { id: 'rem', label: `${remCount} ${remCount === 1 ? 'REMISIÓN' : 'REMISIONES'}`, view: 'remisiones' },
        // Junto a REMISIONES y no al final: son las dos pestañas que hablan del equipo y no del ticket.
        { id: 'hdv', label: 'HOJA DE VIDA', view: 'hojadevida' },
        { id: 'apr', label: 'APROBACIÓN', view: 'otros' },
        { id: 'his', label: 'HISTORIA', view: 'historia' },
    ];
    const activeView = TABS.find((t) => t.id === activeTabId)?.view ?? 'conversaciones';
    const [replyText, setReplyText] = useState('');
    const [confirmingReply, setConfirmingReply] = useState(false);
    const [showHistorial, setShowHistorial] = useState(false);
    const [showRemision, setShowRemision] = useState(false);

    /**
     * Lo que hay que refrescar cuando una remisión se mueve, sea al crearla o al reenviar una que
     * falló. Son las CUATRO cosas que toca, y no solo el ticket: el hilo gana su entrada, la pestaña
     * su contador, la cabecera el estado nuevo —desde que el desenlace confirmado lleva el ticket a
     * "Remisión creada"— y el tablero de detrás, que si no se queda con el ticket en la columna
     * anterior. Está aquí y no repetido en cada sitio porque olvidar una es un fallo silencioso.
     */
    const refrescarTrasRemision = () => { reloadTicket(); reloadRemisiones(); reloadMessages(); onChanged?.(); };

    async function doReply() {
        try {
            await replyTicket(ticketId, replyText);
            reloadMessages(); // refresca el hilo tras enviar la respuesta
            setConfirmingReply(false);
            setReplyText('');
        } catch (e) {
            alert('La acción falló: ' + String(e));
        }
    }

    return (
        // Arranca bajo los 48px de la cabecera real, igual que RemisionesPage, ClientesPage y las
        // demás secciones. Antes era `inset-0` y tapaba la cabecera, así que pintaba encima su
        // propia barra de navegación —una copia del maquetado original de Zoho, con botones sin
        // `onClick`— y desde el detalle de un ticket no se podía llegar a ninguna sección: ni a
        // Remisiones, que en aquella copia ni siquiera figuraba. Cerrar sigue estando en el
        // "Volver al tablero" de la columna de la izquierda.
        <div className="fixed inset-x-0 bottom-0 top-[48px] z-[60] bg-white flex flex-col overflow-hidden animate-in fade-in duration-200">
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar List — tickets en el mismo estado que el abierto */}
                <div style={{ width: listCol.w }} className="bg-[#F8F9FA] flex flex-col shrink-0">
                    <div className="p-2 border-b border-slate-200 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-2 min-w-0">
                            <button onClick={onClose} title="Volver al tablero" className="text-slate-400 hover:text-slate-700 flex items-center">
                                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                            </button>
                            <span className="text-[13px] font-bold text-slate-700 truncate">{ticket?.status ?? 'Tickets'}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-bold shrink-0">{siblings.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {siblings.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => onSelect?.(t.id)}
                                className={`w-full text-left p-3 border-b border-slate-200 hover:bg-white transition-colors ${t.id === ticketId ? 'bg-white border-l-4 border-l-blue-500' : ''}`}
                            >
                                <h4 className="text-[12px] font-bold text-slate-800 leading-tight truncate mb-1">{t.title}</h4>
                                <div className="text-[11px] text-slate-500 mb-2 truncate">{t.number} • {t.assignee?.name} • {t.company}</div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[14px] text-slate-400">schedule</span>
                                        <span className="text-[11px] text-slate-400 font-medium">{t.time}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded">{t.status}</span>
                                </div>
                            </button>
                        ))}
                        {siblings.length === 0 && (
                            <div className="p-4 text-[12px] text-slate-400">{ticket ? 'Sin otros tickets en este estado.' : 'Cargando…'}</div>
                        )}
                    </div>
                </div>

                <ResizeHandle onMouseDown={listCol.start} />

                {/* Vertical Icon Bar (Narrow) */}
                <div className="w-[45px] border-r border-slate-200 bg-white flex flex-col items-center py-4 gap-6 shrink-0">
                    {['content_paste', 'group', 'lightbulb', 'schedule', 'attach_money', 'link', 'psychology', 'chat'].map((icon, idx) => (
                        <span key={idx} className="material-symbols-outlined text-slate-400 text-[20px] cursor-pointer hover:text-blue-500">{icon}</span>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Properties Panel — datos reales del ticket */}
                    {ticket ? (
                        <TicketProperties detail={ticket} width={propsCol.w} />
                    ) : (
                        <div style={{ width: propsCol.w }} className="border-r border-slate-200 bg-white p-4 shrink-0">
                            <div className="h-5 w-40 bg-slate-200/70 rounded animate-pulse mb-4" />
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="h-10 bg-slate-100 rounded animate-pulse mb-3" />
                            ))}
                        </div>
                    )}
                    <ResizeHandle onMouseDown={propsCol.start} />

                    {/* Chat/Thread Content (Right side) */}
                    <div className="flex-1 flex flex-col bg-[#F3F5F7] overflow-hidden">
                        <div className="bg-white border-b border-slate-200 p-6 flex-shrink-0">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h2 className="text-[20px] font-bold text-slate-800 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[24px]">mail</span>
                                        {ticket?.title ?? (loading ? 'Cargando…' : '')}
                                    </h2>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="text-[12px] font-bold text-slate-500">{ticket?.number}</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[12px] font-medium text-slate-400">{ticket?.assignee?.name}</span>
                                            <span className="text-[12px] text-slate-400">•</span>
                                            <span className="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
                                            <span className="text-[12px] font-medium text-slate-400">{ticket?.time}</span>
                                        </div>
                                        {ticket?.equipoId && (
                                          <button onClick={() => setShowHistorial(true)} className="text-[11px] text-blue-600 font-bold border border-blue-200 rounded px-2 py-0.5 hover:bg-blue-50 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">history</span> Hoja de vida del equipo
                                          </button>
                                        )}
                                        <span className="text-[11px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 font-bold flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[16px]">psychology</span> Resumen
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="bg-[#2C7BE5] text-white px-4 py-2 rounded flex items-center gap-2 text-[13px] font-bold">
                                        <span className="material-symbols-outlined text-[18px]">reply_all</span>
                                        Responder A Todos
                                    </button>
                                    <div className="flex border border-slate-200 rounded overflow-hidden">
                                        <button className="p-2 hover:bg-slate-50 text-blue-500"><span className="material-symbols-outlined text-[18px]">chat</span></button>
                                        <button className="p-2 border-l border-slate-200 hover:bg-slate-50 text-green-500"><span className="material-symbols-outlined text-[18px]">call</span></button>
                                    </div>
                                    <button className="p-2 border border-slate-200 rounded hover:bg-slate-50"><span className="material-symbols-outlined text-slate-400 text-[18px]">more_horiz</span></button>
                                </div>
                            </div>

                            {/* La insignia de estado comparte fila con las pestañas en vez de flotar
                                sobre ellas con un margen negativo: al ir después en el DOM y llevar
                                fondo sólido, tapaba las de la derecha —REMISIONES entre ellas— y les
                                robaba el clic. El `flex-wrap` cubre la otra mitad del problema: son
                                ocho pestañas, y al ensanchar la columna de propiedades las últimas se
                                salían de la caja y el `overflow-hidden` del padre las recortaba.
                                Envolver deja siempre todas alcanzables; un scroll horizontal no,
                                porque nadie descubre lo que no se ve. */}
                            <div className="flex items-start justify-between gap-4">
                                <nav className="flex flex-wrap gap-x-6 gap-y-1 min-w-0">
                                    {TABS.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTabId(tab.id)}
                                            className={`text-[11px] font-bold py-2 whitespace-nowrap transition-colors ${activeTabId === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </nav>
                                {ticket && (
                                    <span className={`shrink-0 mt-2 text-[11px] text-white px-3 py-1 rounded font-black tracking-widest ${ticket.statusType === 'Closed' ? 'bg-green-500' : /espera|hold/i.test(ticket.status) ? 'bg-amber-500' : 'bg-blue-500'}`}>{ticket.status.toUpperCase()}</span>
                                )}
                            </div>
                        </div>

                        <div className={`flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-white relative ${activeView === 'conversaciones' ? '' : 'hidden'}`}>
                            {/* Vertical connection line */}
                            <div className="absolute left-[38px] top-0 bottom-0 w-[2px] bg-slate-100"></div>

                            {(messages ?? []).map((msg) => (
                              <div key={msg.id} className="flex gap-4 relative z-10">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm font-bold text-[12px] bg-slate-100 text-slate-700">
                                  {msg.author.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="text-[13px] font-bold text-slate-800">{msg.author}</span>
                                    <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-bold border border-amber-100">{msg.type}</span>
                                    <span className="text-[11px] text-slate-400 font-medium">{msg.time}</span>
                                  </div>
                                  {msg.isHtml ? (
                                    <div
                                      className="text-[13px] text-slate-700 leading-relaxed max-w-[800px] overflow-x-auto [&_img]:max-w-full [&_a]:text-blue-600 [&_a]:underline"
                                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.content) }}
                                    />
                                  ) : (
                                    <div className="text-[13px] text-slate-700 leading-relaxed max-w-[800px] whitespace-pre-line">{msg.content}</div>
                                  )}
                                  {msg.attachments && <Adjuntos items={msg.attachments} />}
                                </div>
                              </div>
                            ))}
                        </div>

                        {activeView === 'actividades' && (
                            <div className="flex-1 overflow-y-auto p-4 bg-white">
                                <ActividadesPanel items={actividades ?? []} />
                            </div>
                        )}
                        {activeView === 'resolucion' && (
                            <div className="flex-1 overflow-y-auto bg-white">
                                <ResolucionPanel ticketId={ticketId} />
                            </div>
                        )}
                        {activeView === 'historia' && (
                            <div className="flex-1 overflow-y-auto bg-white">
                                <HistoriaPanel ticketId={ticketId} />
                            </div>
                        )}
                        {activeView === 'remisiones' && (
                            <div className="flex-1 overflow-y-auto bg-white">
                                <PanelRemisiones items={remisiones} loading={remisionesLoading} error={remisionesError} onCambio={refrescarTrasRemision} />
                            </div>
                        )}
                        {activeView === 'hojadevida' && (
                            <div className="flex-1 overflow-y-auto bg-white">
                                {ticket?.equipoId ? (
                                    /* Sin `onClose` se monta en línea: el scroll lo pone este contenedor. */
                                    <HojaDeVida equipoId={ticket.equipoId} />
                                ) : (
                                    /* El caso mayoritario en el histórico: los tickets que vinieron de Zoho no
                                       traen el equipo en su ficha —el número de serie vive solo en el asunto—,
                                       así que no hay a qué equipo mirarle la hoja de vida. Decirlo evita que se
                                       lea como un fallo de carga. */
                                    <div className="p-8 text-center text-[13px] text-slate-400">
                                        Este ticket no tiene un equipo registrado, así que no hay hoja de vida que enseñar.
                                    </div>
                                )}
                            </div>
                        )}
                        {activeView === 'otros' && (
                            <div className="flex-1 overflow-y-auto p-8 bg-white text-center text-[13px] text-slate-400">Pronto.</div>
                        )}

                        {/* Caja de respuesta + transiciones — al pie del hilo, en el flujo (sin solapar) */}
                        <div className="border-t border-slate-200 bg-white p-3 flex flex-col gap-2 shrink-0">
                          {ticket && (
                            <TransitionPanel
                              ticketId={ticketId}
                              status={ticket.status}
                              // Lo que ya se sabe, para no volver a pedirlo. No basta con
                              // `customFields` —que son las columnas del ticket— porque las fechas de
                              // "Ingreso a Servicio" las escribe esa misma transición: se derivan de
                              // su fuente real (la creación del ticket y la remisión de entrada).
                              delTicket={valoresConocidos(ticket, remisiones)}
                              clientId={ticket.clientId}
                              // Para que el desplegable conserve al derivado actual aunque ya no esté
                              // activo: si desapareciera, confirmar la etapa lo borraría en silencio.
                              derivadoActual={ticket.derivado ?? null}
                              onDone={() => { reloadTicket(); reloadMessages(); onChanged?.(); }}
                              onCrearRemision={() => setShowRemision(true)}
                            />
                          )}
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Escribe una respuesta…"
                            className="border border-slate-200 rounded p-2 text-[13px] resize-none h-16"
                          />
                          <div className="flex justify-end">
                            <button
                              onClick={() => setConfirmingReply(true)}
                              disabled={!replyText.trim()}
                              className="bg-[#2C7BE5] text-white px-4 py-1.5 rounded text-[13px] font-bold disabled:opacity-40"
                            >
                              Responder
                            </button>
                          </div>
                        </div>

                        {/* Bottom Footer Bar */}
                        <div className="h-[40px] border-t border-slate-200 bg-[#F8F9FA] flex items-center justify-between px-4 shrink-0">
                            <div className="flex items-center gap-6">
                                <button className="flex items-center gap-1 text-slate-500 hover:text-slate-800">
                                    <span className="material-symbols-outlined text-[18px]">terminal</span>
                                    <span className="text-[11px] font-bold">Aplicar macro</span>
                                </button>
                                <button className="flex items-center gap-1 text-slate-500 hover:text-slate-800">
                                    <span className="material-symbols-outlined text-[18px]">desktop_windows</span>
                                    <span className="text-[11px] font-bold">Asistencia remota</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-4">
                                <button className="text-[11px] font-bold text-blue-600 border border-blue-600 px-3 py-1 rounded hover:bg-blue-50">Volver a abrir Ticket</button>
                                <div className="h-4 w-px bg-slate-200"></div>
                                <span className="material-symbols-outlined text-slate-400 text-[18px]">chat</span>
                                <span className="material-symbols-outlined text-slate-400 text-[18px]">history</span>
                                <span className="material-symbols-outlined text-slate-400 text-[18px]">lightbulb</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {confirmingReply && (
              <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center">
                <div className="bg-white rounded-lg p-6 w-[360px] flex flex-col gap-4">
                  <p className="text-[14px] text-slate-700">¿Enviar esta respuesta al cliente en Zoho Desk?</p>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setConfirmingReply(false)} className="px-3 py-1.5 text-[13px] text-slate-600">Cancelar</button>
                    <button onClick={doReply} className="px-4 py-1.5 bg-[#2C7BE5] text-white rounded text-[13px] font-bold">Confirmar</button>
                  </div>
                </div>
              </div>
            )}

            {showHistorial && ticket?.equipoId && <HojaDeVida equipoId={ticket.equipoId} onClose={() => setShowHistorial(false)} />}
            {showRemision && (
              <CrearRemision
                ticketId={ticketId}
                onClose={() => setShowRemision(false)}
                onCreada={() => { setShowRemision(false); refrescarTrasRemision(); }}
              />
            )}

            {/* Help Button */}
            <button className="fixed bottom-4 right-4 bg-[#2C7BE5] text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-[13px] font-bold">
                <span className="material-symbols-outlined text-[20px]">help</span> Need Help
            </button>
        </div>
    );
};
