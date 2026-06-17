import React from 'react';
import type { Ticket } from '../data/mockData';
import { ClienteLink, type ClienteKind } from './ClienteLink'
import { ReadToggle } from './ReadToggle'

interface TicketCardProps {
    ticket: Ticket;
    onClick?: () => void;
    onOpenCliente?: (kind: ClienteKind, id: string) => void;
    onToggleRead?: (id: string, read: boolean) => void;
}

const statusColorMap: Record<string, { bg: string, text: string, label: string }> = {
    'INGRESADO': { bg: 'bg-[#FFF5F5]', text: 'text-[#E53E3E]', label: 'Ingresado' },
    'COMERCIAL': { bg: 'bg-[#FFF9E6]', text: 'text-[#D97706]', label: 'Notificación Comercial' },
    'PROCESO': { bg: 'bg-[#EBF8FF]', text: 'text-[#3182CE]', label: 'En Proceso' },
    'NOTIFICACION_CLIENTE': { bg: 'bg-[#FFF9E6]', text: 'text-[#D97706]', label: 'Notificación cliente' },
    'POR_FACTURAR': { bg: 'bg-[#FFF9E6]', text: 'text-[#D97706]', label: 'Por Facturar' },
    'POR_ENTREGAR_SIN_FACTURAR': { bg: 'bg-[#FFF9E6]', text: 'text-[#D97706]', label: 'Por Entregar / Sin facturar' },
    'POR_ENTREGAR': { bg: 'bg-[#EBF8FF]', text: 'text-[#3182CE]', label: 'Por Entregar' },
    'ESPERA_REPUESTOS': { bg: 'bg-[#FFF9E6]', text: 'text-[#D97706]', label: 'En Espera de Repues...' }
};

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, onClick, onOpenCliente, onToggleRead }) => {
    const statusStyle = statusColorMap[ticket.status] || { bg: 'bg-slate-100', text: 'text-slate-600', label: ticket.status };

    return (
        <div
            onClick={onClick}
            className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 p-3 flex flex-col gap-2 hover:shadow-md transition-shadow group relative cursor-pointer"
        >
            <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-8">
                    <h4 className={`text-[12px] leading-tight mb-1 dark:text-slate-100 ${ticket.read ? 'font-normal text-slate-600' : 'font-bold text-slate-800'}`}>
                        {ticket.title}
                    </h4>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400">
                                {ticket.number}
                            </span>
                            <span className="text-[10px] text-slate-500">•</span>
                            <span className="text-[10px] text-slate-500 font-medium truncate">
                                {ticket.assignee?.name}
                            </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium truncate">
                            <ClienteLink label={ticket.contactName} kind="contacto" id={ticket.contactId} onOpen={onOpenCliente} />
                            {ticket.contactName && ticket.company ? ' · ' : ''}
                            <ClienteLink label={ticket.company} kind="empresa" id={ticket.accountId} onOpen={onOpenCliente} />
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[14px] text-red-500">schedule</span>
                            <span className="text-[10px] text-slate-500 font-medium">{ticket.time}</span>
                        </div>
                    </div>
                </div>

                <div className="absolute top-3 right-3 shrink-0">
                    {ticket.assignee?.avatar ? (
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-100 shadow-sm">
                            <img alt="Avatar" className="w-full h-full object-cover" src={ticket.assignee.avatar} />
                        </div>
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-500 border border-slate-200">
                            {ticket.assignee?.initials || ticket.assignee?.name.substring(0, 2).toUpperCase()}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between mt-1">
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusStyle.bg} ${statusStyle.text} border-current/20`}>
                    {statusStyle.label}
                </div>

                <div className="flex items-center gap-2">
                    <ReadToggle read={ticket.read} onToggle={(r) => onToggleRead?.(ticket.id, r)} className="text-[16px]" />
                    <button className="text-slate-400 hover:text-slate-600">
                        <span className="material-symbols-outlined text-[16px]">mail</span>
                    </button>
                    <button className="text-slate-400 hover:text-slate-600 flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[16px]">notes</span>
                        {ticket.messages && <span className="text-[10px] font-bold">{ticket.messages}</span>}
                    </button>
                </div>
            </div>

            {/* Hover actions seen in the image (like common in Kanban boards) */}
            <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 pointer-events-none transition-colors rounded"></div>
        </div>
    );
};
