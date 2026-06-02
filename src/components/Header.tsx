import React from 'react';

const NAV_TABS = [
    { label: 'Tickets', active: true },
    { label: 'Análisis' },
    { label: 'Actividades' },
    { label: 'Mensajería Instantánea' },
    { label: 'Clientes' },
    { label: 'Base de Conocimientos' }
];

export const Header: React.FC = () => {
    return (
        <header className="bg-[#2C2E3E] text-white h-[48px] flex items-center justify-between px-3 shrink-0 z-30">
            <div className="flex items-center h-full">
                <div className="flex items-center gap-2 mr-6">
                    <img
                        alt="Ambientalia logo"
                        className="h-6 w-auto brightness-200"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQUDuAX5d0l2fLAWAMNVwrv8DB5wyqIffalv4MddS6zecsX-Irjz4ZM9FWeFySP_DFDlyyIB6-0RgX2EQEO2XuoS5gZQe4Lid-NNuMbzC5kEMsFaX6Sx4VnCg-k_zYMZJyExkUu-0ulMVkmq3bph-9kSaKczmUOTRT752wpMKCYTVCvj2J0E1-kednWAcAAKh4zlq9vnBsfFpe9tsyra-qVYOmrQwauQxDyFyqoKcQQBdepbYi0aTtn83V0ZOlyJM5ftDkxB-EVefh"
                    />
                </div>

                <nav className="flex h-full items-center">
                    {NAV_TABS.map((tab, idx) => (
                        <button
                            key={idx}
                            className={`px-4 h-full text-[13px] font-medium transition-colors border-b-2 ${tab.active ? 'text-white border-blue-500 bg-white/5' : 'text-white/60 border-transparent hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                    <button className="px-2 text-white/60 hover:text-white">
                        <span className="material-symbols-outlined text-lg">menu</span>
                    </button>
                </nav>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right mr-2 hidden md:block">
                    <div className="text-[12px] font-medium">Ambientalia Soporte y Servicio Técnico</div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="w-8 h-8 rounded-md bg-blue-600/20 text-blue-400 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                    </button>
                    <button className="p-1.5 text-white/60 hover:text-white">
                        <span className="material-symbols-outlined text-[20px]">search</span>
                    </button>
                    <button className="p-1.5 text-white/60 hover:text-white relative">
                        <span className="material-symbols-outlined text-[20px]">notifications</span>
                        <span className="absolute top-1 right-1 bg-red-500 text-[9px] text-white font-bold h-4 w-4 flex items-center justify-center rounded-full border-2 border-[#2C2E3E]">44</span>
                    </button>
                    <button className="p-1.5 text-white/60 hover:text-white">
                        <span className="material-symbols-outlined text-[20px]">apps</span>
                    </button>
                    <button className="p-1.5 text-white/60 hover:text-white">
                        <span className="material-symbols-outlined text-[20px]">settings</span>
                    </button>
                    <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden shrink-0 ml-1">
                        <img
                            alt="User profile"
                            className="w-full h-full object-cover"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDb1Z8QaQ0vAqypu2DT6aKkL5AwtX-XxPjZ9ZkCCV7tA63ibiO7RLf7SBItFwsMzn3hOv3zyqiuLI-U4H8RZtJWZraijGzsRhF0tORHiBIQg3zE7NpN2dKNS-bj8CRwV5dnn2wgydcJxi8NPcOAZnb3ge5THsFAyg-7rjnIMllaGlV4PXvbbpDA7WymWAHGuNAPBioDw2s6YpYhUGpMbd8XZQpiHx2WuVZbguU-j_wvdZQBBO_6pRmGrAX9W0zlQixzw1IUGDExM1J_"
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};
