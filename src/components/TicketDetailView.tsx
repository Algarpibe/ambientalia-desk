import React from 'react';
import { useState } from 'react';
import DOMPurify from 'dompurify';
import type { TicketDetail, Message, Ticket, Activity } from '../../shared/types';
import { useAsync } from '../hooks/useAsync';
import { fetchTicket, fetchConversations, replyTicket, fetchActivities } from '../api/client';
import { TicketProperties } from './TicketProperties';
import { TransitionPanel } from './TransitionPanel';
import { HojaDeVida } from './HojaDeVida';
import { ActividadesPanel } from './ActividadesPanel';
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
    // Solo los tickets en el MISMO estado que el ticket abierto (incluye el actual, resaltado).
    const siblings = (tickets ?? []).filter((t) => ticket != null && t.status === ticket.status);
    const { data: messages, reload: reloadMessages } = useAsync<Message[]>(() => fetchConversations(ticketId), [ticketId]);
    const convCount = (messages ?? []).length;
    const adjuntosCount = (messages ?? []).reduce((n, m) => n + (m.attachments?.length ?? 0), 0);
    const { data: actividades } = useAsync<Activity[]>(() => fetchActivities(ticketId), [ticketId]);
    const actCount = (actividades ?? []).length;
    const [activeTabId, setActiveTabId] = useState<string>('conv');
    const TABS = [
        { id: 'conv', label: `${convCount} ${convCount === 1 ? 'CONVERSACIÓN' : 'CONVERSACIONES'}`, view: 'conversaciones' },
        { id: 'res', label: 'RESOLUCIÓN', view: 'resolucion' },
        { id: 'tiempo', label: 'ENTRADA DE TIEMPO', view: 'otros' },
        { id: 'adj', label: `${adjuntosCount} ${adjuntosCount === 1 ? 'ADJUNTO' : 'ADJUNTOS'}`, view: 'otros' },
        { id: 'act', label: `${actCount} ACTIVIDADES`, view: 'actividades' },
        { id: 'apr', label: 'APROBACIÓN', view: 'otros' },
        { id: 'his', label: 'HISTORIA', view: 'historia' },
    ];
    const activeView = TABS.find((t) => t.id === activeTabId)?.view ?? 'conversaciones';
    const [replyText, setReplyText] = useState('');
    const [confirmingReply, setConfirmingReply] = useState(false);
    const [showHistorial, setShowHistorial] = useState(false);

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
        <div className="fixed inset-0 z-[60] bg-white flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Top Bar with Navigation Tabs */}
            <div className="bg-[#2C2E3E] text-white h-[48px] flex items-center justify-between px-3 shrink-0">
                <div className="flex items-center h-full">
                    <button onClick={onClose} className="mr-4 hover:bg-white/10 p-1 rounded transition-colors">
                        <span className="material-symbols-outlined text-white">arrow_back</span>
                    </button>
                    <div className="flex items-center gap-2 mr-6 shrink-0">
                        <img
                            alt="Ambientalia logo"
                            className="h-6 w-auto brightness-200"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQUDuAX5d0l2fLAWAMNVwrv8DB5wyqIffalv4MddS6zecsX-Irjz4ZM9FWeFySP_DFDlyyIB6-0RgX2EQEO2XuoS5gZQe4Lid-NNuMbzC5kEMsFaX6Sx4VnCg-k_zYMZJyExkUu-0ulMVkmq3bph-9kSaKczmUOTRT752wpMKCYTVCvj2J0E1-kednWAcAAKh4zlq9vnBsfFpe9tsyra-qVYOmrQwauQxDyFyqoKcQQBdepbYi0aTtn83V0ZOlyJM5ftDkxB-EVefh"
                        />
                    </div>
                    <nav className="flex h-full items-center overflow-x-auto hide-scrollbar whitespace-nowrap">
                        {['Tickets', 'Análisis', 'Actividades', 'Mensajería Instantánea', 'Clientes', 'Base de Conocimientos', 'Custom Dashboards', 'Bookmarks'].map((tab, idx) => (
                            <button
                                key={idx}
                                className={`px-4 h-full text-[13px] font-medium transition-colors border-b-2 flex items-center ${idx === 0 ? 'text-white border-blue-500 bg-white/5' : 'text-white/60 border-transparent hover:text-white'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right mr-2 hidden md:block">
                        <div className="text-[12px] font-medium">Ambientalia Soporte y Servicio Técnico</div>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar List — tickets en el mismo estado que el abierto */}
                <div className="w-[300px] border-r border-slate-200 bg-[#F8F9FA] flex flex-col shrink-0">
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
                        <TicketProperties detail={ticket} />
                    ) : (
                        <div className="w-[300px] border-r border-slate-200 bg-white p-4 shrink-0">
                            <div className="h-5 w-40 bg-slate-200/70 rounded animate-pulse mb-4" />
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="h-10 bg-slate-100 rounded animate-pulse mb-3" />
                            ))}
                        </div>
                    )}

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

                            <nav className="flex gap-8 border-b-0">
                                {TABS.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTabId(tab.id)}
                                        className={`text-[11px] font-bold py-2 transition-colors ${activeTabId === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>

                            <div className="flex justify-end mt-[-35px]">
                                {ticket && (
                                    <span className={`text-[11px] text-white px-3 py-1 rounded font-black tracking-widest ${ticket.statusType === 'Closed' ? 'bg-green-500' : /espera|hold/i.test(ticket.status) ? 'bg-amber-500' : 'bg-blue-500'}`}>{ticket.status.toUpperCase()}</span>
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
                                  {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                      {msg.attachments.map((att) => (
                                        <a
                                          key={att.path}
                                          href={`/api/attachment?path=${encodeURIComponent(att.path)}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded w-[200px] hover:bg-slate-100"
                                        >
                                          <span className="material-symbols-outlined text-slate-400">description</span>
                                          <div className="flex-1 overflow-hidden">
                                            <div className="text-[11px] font-bold text-slate-700 truncate">{att.name}</div>
                                            <div className="text-[10px] text-slate-400 uppercase">{att.size}</div>
                                          </div>
                                          <span className="material-symbols-outlined text-slate-400 text-[18px]">download</span>
                                        </a>
                                      ))}
                                    </div>
                                  )}
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
                        {activeView === 'otros' && (
                            <div className="flex-1 overflow-y-auto p-8 bg-white text-center text-[13px] text-slate-400">Pronto.</div>
                        )}

                        {/* Caja de respuesta + transiciones — al pie del hilo, en el flujo (sin solapar) */}
                        <div className="border-t border-slate-200 bg-white p-3 flex flex-col gap-2 shrink-0">
                          {ticket && (
                            <TransitionPanel
                              ticketId={ticketId}
                              status={ticket.status}
                              onDone={() => { reloadTicket(); reloadMessages(); onChanged?.(); }}
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

            {/* Help Button */}
            <button className="fixed bottom-4 right-4 bg-[#2C7BE5] text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-[13px] font-bold">
                <span className="material-symbols-outlined text-[20px]">help</span> Need Help
            </button>
        </div>
    );
};
