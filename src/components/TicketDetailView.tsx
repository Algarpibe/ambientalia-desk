import React from 'react';
import { useState } from 'react';
import type { Ticket, Message } from '../../shared/types';
import { useAsync } from '../hooks/useAsync';
import { fetchTicket, fetchConversations, updateTicketStatus, replyTicket } from '../api/client';
import { COLUMNS } from '../../shared/columns';

interface TicketDetailViewProps {
    ticketId: string;
    onClose: () => void;
}

export const TicketDetailView: React.FC<TicketDetailViewProps> = ({ ticketId, onClose }) => {
    const { data: ticket, loading } = useAsync<Ticket>(() => fetchTicket(ticketId), [ticketId]);
    const { data: messages } = useAsync<Message[]>(() => fetchConversations(ticketId), [ticketId]);
    const [replyText, setReplyText] = useState('');
    const [confirming, setConfirming] = useState<null | { kind: 'reply' } | { kind: 'status'; status: string }>(null);

    async function doConfirm() {
        if (!confirming) return;
        try {
            if (confirming.kind === 'reply') await replyTicket(ticketId, replyText);
            else await updateTicketStatus(ticketId, confirming.status);
            setConfirming(null);
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
                {/* Left Sidebar List (Recent/Related Tickets) */}
                <div className="w-[300px] border-r border-slate-200 bg-[#F8F9FA] flex flex-col shrink-0">
                    <div className="p-2 border-b border-slate-200 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px] text-slate-400">chevron_left</span>
                            <span className="text-[14px] font-bold">18a20021</span>
                        </div>
                        <span className="material-symbols-outlined text-[18px] text-slate-400">push_pin</span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className={`p-4 border-b border-slate-200 cursor-pointer hover:bg-white transition-colors ${i === 3 ? 'bg-white border-l-4 border-blue-500' : ''}`}>
                                <div className="flex justify-between mb-1">
                                    <h4 className="text-[12px] font-bold text-slate-800 leading-tight truncate w-[200px]">Servicio Técnico COROLA Monitor de particulas...</h4>
                                    <span className="material-symbols-outlined text-slate-400 text-[18px]">person</span>
                                </div>
                                <div className="text-[11px] text-slate-500 mb-2">#303 • Nestor Armando Martinez Patiño • Corola Ambiental S.A.S.</div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[14px] text-slate-400">schedule</span>
                                        <span className="text-[11px] text-slate-400 font-medium">25 Ago 2022</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] font-bold text-green-600 px-1.5 py-0.5 bg-green-50 border border-green-100 rounded">Finalizado</span>
                                        <span className="material-symbols-outlined text-[16px] text-slate-400">mail</span>
                                        <span className="material-symbols-outlined text-[16px] text-slate-400">notes</span>
                                    </div>
                                </div>
                            </div>
                        ))}
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
                    {/* Properties Panel (Left side of main scroll) */}
                    <div className="w-[300px] border-r border-slate-200 overflow-y-auto bg-white p-4">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[14px] font-bold text-slate-800">Propiedades de Ticket</h3>
                            <span className="material-symbols-outlined text-slate-400 text-[18px]">mode_edit</span>
                        </div>

                        <div className="space-y-6">
                            <div className="border-b border-slate-100 pb-3 cursor-pointer flex items-center justify-between">
                                <span className="text-[13px] font-bold text-slate-700">Zia Insights</span>
                                <span className="material-symbols-outlined text-slate-400">expand_more</span>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-4 cursor-pointer">
                                    <span className="text-[13px] font-bold text-slate-700">Información de Contacto</span>
                                    <span className="material-symbols-outlined text-slate-400">expand_less</span>
                                </div>
                                <div className="space-y-3 pl-1">
                                    <div className="text-[14px] font-bold text-slate-800">Mario Ávila</div>
                                    <div className="text-[12px] text-slate-500">Corola Ambiental S.A.S.</div>
                                    <div className="text-[12px] text-blue-600 truncate">mario.avila@corolaambiental.com</div>
                                    <div className="text-[12px] text-slate-500">3212865332</div>
                                    <div className="text-[12px] text-slate-500">corolaambiental.com</div>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-4 cursor-pointer">
                                    <span className="text-[13px] font-bold text-slate-700">Información clave</span>
                                    <span className="material-symbols-outlined text-slate-400 font-bold">expand_less</span>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-[11px] text-slate-400 mb-1">Propietario de Ticket</div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">ET</div>
                                            <span className="text-[12px] font-medium text-slate-700">Equipo Técnico</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] text-slate-400 mb-1">Estado</div>
                                        <span className="text-[11px] text-green-600 px-2 py-0.5 bg-green-50 border border-green-100 rounded font-bold">Finalizado <span className="material-symbols-outlined text-[14px] align-middle">expand_more</span></span>
                                    </div>
                                    <div>
                                        <div className="text-[11px] text-slate-400 mb-1">Hora de cierre</div>
                                        <div className="text-[12px] font-medium text-slate-700">09 Dic 2025 02:22 PM</div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-4 cursor-pointer">
                                    <span className="text-[13px] font-bold text-slate-700">Campos Criterio</span>
                                    <span className="material-symbols-outlined text-slate-400">expand_less</span>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-[11px] text-slate-400 mb-1">Último Servicio</div>
                                        <div className="text-[12px] font-medium text-slate-700 leading-tight">Servicio Técnico COROLA Monitor de p...</div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] text-slate-400 mb-1">Clasificaciones</div>
                                        <span className="text-[11px] text-orange-600 px-2 py-0.5 bg-orange-50 rounded-full font-bold">Equipo Para Servicio</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

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
                                {['14 CONVERSACIONES', 'RESOLUCIÓN', 'ENTRADA DE TIEMPO', '1 ADJUNTO', '8 ACTIVIDADES', 'APROBACIÓN', 'HISTORIA'].map((item, idx) => (
                                    <button key={idx} className={`text-[11px] font-bold py-2 transition-colors ${idx === 0 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
                                        {item}
                                    </button>
                                ))}
                            </nav>

                            <div className="flex justify-end mt-[-35px]">
                                <span className="text-[11px] bg-green-500 text-white px-3 py-1 rounded font-black tracking-widest">CERRADO</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-white relative">
                            {/* Vertical connection line */}
                            <div className="absolute left-[38px] top-0 bottom-0 w-[2px] bg-slate-100"></div>

                            {(messages ?? []).map((msg) => (
                              <div key={msg.id} className="flex gap-4 relative z-10">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm font-bold text-[12px] bg-slate-100 text-slate-700">
                                  {msg.author.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="text-[13px] font-bold text-slate-800">{msg.author}</span>
                                    <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-bold border border-amber-100">{msg.type}</span>
                                    <span className="text-[11px] text-slate-400 font-medium">{msg.time}</span>
                                  </div>
                                  <div className="text-[13px] text-slate-700 leading-relaxed max-w-[800px] whitespace-pre-line">{msg.content}</div>
                                </div>
                              </div>
                            ))}
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
            <div className="absolute bottom-16 right-4 left-[660px] bg-white border border-slate-200 rounded-lg shadow-lg p-3 flex flex-col gap-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Escribe una respuesta…"
                className="border border-slate-200 rounded p-2 text-[13px] resize-none h-16"
              />
              <div className="flex items-center justify-between">
                <select
                  defaultValue=""
                  onChange={(e) => e.target.value && setConfirming({ kind: 'status', status: e.target.value })}
                  className="border border-slate-200 rounded text-[12px] px-2 py-1"
                >
                  <option value="" disabled>Cambiar estado…</option>
                  {COLUMNS.map((c) => <option key={c.id} value={c.statuses[0]}>{c.label}</option>)}
                </select>
                <button
                  onClick={() => setConfirming({ kind: 'reply' })}
                  disabled={!replyText.trim()}
                  className="bg-[#2C7BE5] text-white px-4 py-1.5 rounded text-[13px] font-bold disabled:opacity-40"
                >
                  Responder
                </button>
              </div>
            </div>

            {confirming && (
              <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center">
                <div className="bg-white rounded-lg p-6 w-[360px] flex flex-col gap-4">
                  <p className="text-[14px] text-slate-700">
                    {confirming.kind === 'reply'
                      ? '¿Enviar esta respuesta al cliente en Zoho Desk?'
                      : `¿Cambiar el estado del ticket a "${confirming.status}"?`}
                  </p>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setConfirming(null)} className="px-3 py-1.5 text-[13px] text-slate-600">Cancelar</button>
                    <button onClick={doConfirm} className="px-4 py-1.5 bg-[#2C7BE5] text-white rounded text-[13px] font-bold">Confirmar</button>
                  </div>
                </div>
              </div>
            )}

            {/* Help Button */}
            <button className="fixed bottom-4 right-4 bg-[#2C7BE5] text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-[13px] font-bold">
                <span className="material-symbols-outlined text-[20px]">help</span> Need Help
            </button>
        </div>
    );
};
