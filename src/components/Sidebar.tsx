import React, { useState } from 'react';
import { FUNCTIONAL_BY_LABEL } from '../lib/boardView';

// Estructura del menú lateral (réplica de Zoho Desk). Por ahora decorativo — el filtrado por vista llega después.
const TODAS_LAS_VISTAS = [
    'Todos los Tickets',
    'Tickets cerrados',
    'Tickets respondidos por mí',
    'Chats pendientes',
    'Mis Tickets',
    'Mis Tickets en espera',
    'Mis Tickets abierto',
    'Mis Tickets vencidos',
    'Mis Tickets con respuesta',
    'Apertura de Mi equipo Tickets',
    'Tickets en espera',
    'Tickets abiertos',
    'Tickets vencidos',
    'Tickets para revisión',
    'Tickets con respuesta del técnico',
    'Compartido Tickets',
    'Tickets compartidos por mí',
    'Tickets con información solicitada',
    'Tickets con información',
    'Tickets Calificados',
    'Tickets abiertos y no asignados',
];

const VISTAS_BLUEPRINT = [
    'Actuar blueprint Tickets',
    'Todas las transiciones',
    'Mis transiciones de equipo',
    'Mis transiciones',
    'Transiciones no asignadas',
];

// Sección colplegable: la cabecera (con chevron) pliega/despliega sus ítems.
function Section({ label, defaultOpen = true, children }: { label: string; defaultOpen?: boolean; children?: React.ReactNode }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <>
            <button
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-3 pt-3 pb-1 text-white/40 hover:text-white/70 transition-colors"
            >
                <span className="text-[10px] font-bold tracking-wider uppercase">{label}</span>
                <span className={`material-symbols-outlined text-[16px] transition-transform ${open ? '' : '-rotate-90'}`}>expand_more</span>
            </button>
            {open && children}
        </>
    );
}

function ViewItem({ label, active, onClick, disabled }: { label: string; active?: boolean; onClick?: () => void; disabled?: boolean }) {
    if (disabled) {
        return (
            <div className="w-full text-left px-3 py-1.5 pl-6 text-[12px] font-medium truncate text-white/30 cursor-default" title={label}>
                {label}
            </div>
        );
    }
    return (
        <button
            onClick={onClick}
            className={`w-full text-left px-3 py-1.5 pl-6 transition-colors text-[12px] font-medium truncate ${active ? 'bg-blue-600/20 text-blue-300 border-l-2 border-blue-500' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            title={label}
        >
            {label}
        </button>
    );
}

function BottomItem({ icon, label }: { icon: string; label: string }) {
    return (
        <button className="w-full flex items-center gap-3 px-3 py-2 text-white/90 hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
            <span className="text-[13px] font-medium truncate">{label}</span>
        </button>
    );
}

export const Sidebar: React.FC<{ activeView: string; onSelectView: (key: string) => void }> = ({ activeView, onSelectView }) => {
    return (
        <aside className="w-[200px] bg-[#2C2E3E] text-white flex flex-col shrink-0 overflow-y-auto hide-scrollbar border-r border-white/5" id="sidebar">
            <div className="flex flex-col py-2 flex-1">
                <div className="px-2 mb-3">
                    <img
                        alt="Ambientalia logo"
                        className="h-8 w-auto brightness-200 px-2"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQUDuAX5d0l2fLAWAMNVwrv8DB5wyqIffalv4MddS6zecsX-Irjz4ZM9FWeFySP_DFDlyyIB6-0RgX2EQEO2XuoS5gZQe4Lid-NNuMbzC5kEMsFaX6Sx4VnCg-k_zYMZJyExkUu-0ulMVkmq3bph-9kSaKczmUOTRT752wpMKCYTVCvj2J0E1-kednWAcAAKh4zlq9vnBsfFpe9tsyra-qVYOmrQwauQxDyFyqoKcQQBdepbYi0aTtn83V0ZOlyJM5ftDkxB-EVefh"
                    />
                </div>

                <button className="w-full flex items-center gap-3 px-3 py-2 text-white/90 hover:bg-white/5 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">grid_view</span>
                    <span className="text-[13px] font-medium">Oficina Principal</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-white/90 hover:bg-white/5 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">chat</span>
                    <span className="text-[13px] font-medium">Comentarios Del Equipo</span>
                </button>

                <div className="mt-2">
                    <button className="w-full flex items-center justify-between px-3 py-2 text-white/90 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[20px]">folder</span>
                            <span className="text-[13px] font-medium">Vistas</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px] text-white/40">search</span>
                            <span className="material-symbols-outlined text-[16px] text-white/40">add</span>
                        </div>
                    </button>
                </div>

                <Section label="Todas las vistas">
                    {TODAS_LAS_VISTAS.map((v) => {
                        const key = FUNCTIONAL_BY_LABEL[v];
                        return key
                            ? <ViewItem key={v} label={v} active={activeView === key} onClick={() => onSelectView(key)} />
                            : <ViewItem key={v} label={v} disabled />;
                    })}
                </Section>

                <Section label="Views created by me" defaultOpen={false} />
                <Section label="Views shared to me" defaultOpen={false} />

                <Section label="Vistas de Blueprint" defaultOpen={false}>
                    {VISTAS_BLUEPRINT.map((v) => (
                        <ViewItem key={v} label={v} disabled />
                    ))}
                </Section>

                <Section label="Archivado" defaultOpen={false} />

                <div className="border-t border-white/10 mt-3 pt-2">
                    <BottomItem icon="person_check" label="Cola De Agentes" />
                    <BottomItem icon="groups" label="Cola De Equipo" />
                    <BottomItem icon="label" label="Etiquetas" />
                    <BottomItem icon="history" label="Respuestas Programadas" />
                </div>
            </div>

            <div className="p-3 flex justify-end shrink-0">
                <button className="text-white/40 hover:text-white">
                    <span className="material-symbols-outlined">first_page</span>
                </button>
            </div>
        </aside>
    );
};
