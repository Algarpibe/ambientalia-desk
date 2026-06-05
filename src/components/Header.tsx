import React from 'react';
import { useAuth } from '../auth/AuthContext';

const NAV_TABS = [
    { label: 'Tickets', active: true },
    { label: 'Análisis' },
    { label: 'Actividades' },
    { label: 'Mensajería Instantánea' },
    { label: 'Clientes' },
    { label: 'Base de Conocimientos' }
];

export const Header: React.FC<{ onOpenUsers: () => void; onOpenRoles: () => void; onOpenConfig: () => void; onOpenEquipos: () => void }> = ({ onOpenUsers, onOpenRoles, onOpenConfig, onOpenEquipos }) => {
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
                    <button onClick={onOpenConfig} title="Configuración" className="p-1.5 text-white/60 hover:text-white">
                        <span className="material-symbols-outlined text-[20px]">settings</span>
                    </button>
                    <UserMenu onOpenUsers={onOpenUsers} onOpenRoles={onOpenRoles} onOpenEquipos={onOpenEquipos} />
                </div>
            </div>
        </header>
    );
};

function UserMenu({ onOpenUsers, onOpenRoles, onOpenEquipos }: { onOpenUsers: () => void; onOpenRoles: () => void; onOpenEquipos: () => void }) {
  const { user, logout } = useAuth()
  if (!user) return null
  return (
    <div className="flex items-center gap-3 ml-1">
      <button onClick={onOpenEquipos} title="Equipos" className="p-1.5 text-white/60 hover:text-white">
        <span className="material-symbols-outlined text-[20px]">precision_manufacturing</span>
      </button>
      {user.isAdmin && (
        <>
          <button onClick={onOpenUsers} title="Usuarios" className="p-1.5 text-white/60 hover:text-white">
            <span className="material-symbols-outlined text-[20px]">group</span>
          </button>
          <button onClick={onOpenRoles} title="Roles" className="p-1.5 text-white/60 hover:text-white">
            <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
          </button>
        </>
      )}
      <span className="text-[12px] font-medium hidden md:block">{user.name}{user.isAdmin ? ' · Admin' : ''}</span>
      <button onClick={() => logout()} title="Cerrar sesión" className="p-1.5 text-white/60 hover:text-white">
        <span className="material-symbols-outlined text-[20px]">logout</span>
      </button>
    </div>
  )
}
