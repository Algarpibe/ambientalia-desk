import React from 'react';
import { VIEWS } from '../data/mockData';

export const Sidebar: React.FC = () => {
    return (
        <aside className="w-[200px] bg-[#2C2E3E] text-white flex flex-col shrink-0 overflow-y-auto hide-scrollbar border-r border-white/5" id="sidebar">
            <div className="flex flex-col py-2">
                <div className="px-2 mb-4">
                    <img
                        alt="Ambientalia logo"
                        className="h-8 w-auto brightness-200 px-2"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQUDuAX5d0l2fLAWAMNVwrv8DB5wyqIffalv4MddS6zecsX-Irjz4ZM9FWeFySP_DFDlyyIB6-0RgX2EQEO2XuoS5gZQe4Lid-NNuMbzC5kEMsFaX6Sx4VnCg-k_zYMZJyExkUu-0ulMVkmq3bph-9kSaKczmUOTRT752wpMKCYTVCvj2J0E1-kednWAcAAKh4zlq9vnBsfFpe9tsyra-qVYOmrQwauQxDyFyqoKcQQBdepbYi0aTtn83V0ZOlyJM5ftDkxB-EVefh"
                    />
                </div>

                <div className="space-y-1">
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-white/90 hover:bg-white/5 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">grid_view</span>
                        <span className="text-[13px] font-medium">Oficina Principal</span>
                    </button>

                    <button className="w-full flex items-center gap-3 px-3 py-2 text-white/90 hover:bg-white/5 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">chat</span>
                        <span className="text-[13px] font-medium">Comentarios Del Equipo</span>
                    </button>

                    <div className="mt-4">
                        <button className="w-full flex items-center justify-between px-3 py-2 text-white/90 hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[20px]">folder</span>
                                <span className="text-[13px] font-medium">Vistas</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px] text-white/40">search</span>
                                <span className="material-symbols-outlined text-[16px] text-white/40">add</span>
                            </div>
                        </button>

                        <div className="mt-1">
                            {VIEWS.map(view => (
                                <button
                                    key={view.id}
                                    className={`w-full text-left px-3 py-1.5 pl-6 transition-colors text-[12px] font-medium ${view.active ? 'bg-blue-600/20 text-blue-300 border-l-2 border-blue-500' : 'text-white/60 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {view.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button className="w-full flex items-center gap-3 px-3 py-4 text-white/90 hover:bg-white/5 transition-colors mt-2">
                        <span className="material-symbols-outlined text-[20px]">person_check</span>
                        <span className="text-[13px] font-medium">Cola De Agentes</span>
                    </button>

                    <button className="w-full flex items-center gap-3 px-3 py-2 text-white/90 hover:bg-white/5 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">groups</span>
                        <span className="text-[13px] font-medium">Cola De Equipo</span>
                    </button>

                    <button className="w-full flex items-center gap-3 px-3 py-2 text-white/90 hover:bg-white/5 transition-colors mt-2">
                        <span className="material-symbols-outlined text-[20px]">label</span>
                        <span className="text-[13px] font-medium">Etiquetas</span>
                    </button>

                    <button className="w-full flex items-center gap-3 px-3 py-2 text-white/90 hover:bg-white/5 transition-colors mt-2">
                        <span className="material-symbols-outlined text-[20px]">history</span>
                        <span className="text-[13px] font-medium">Respuestas Programada...</span>
                    </button>
                </div>
            </div>

            <div className="mt-auto p-4 flex justify-end">
                <button className="text-white/40 hover:text-white">
                    <span className="material-symbols-outlined">first_page</span>
                </button>
            </div>
        </aside>
    );
};
