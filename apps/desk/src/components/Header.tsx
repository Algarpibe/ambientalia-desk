import React, { useEffect, useState } from 'react';
import type { Aviso } from '@ambientalia/shared';
import { useAuth } from '../auth/AuthContext';
import { getAvisos, marcarAvisosLeidos } from '../api/client';

type SectionKey = 'tickets' | 'analisis' | 'clientes' | 'actividades' | 'remisiones'

/**
 * La campana de avisos. Hasta ahora enseñaba un «44» escrito a mano en el HTML.
 *
 * Se refresca al montar y cada minuto: sin websockets, y con ese intervalo un aviso tarda como mucho
 * un minuto en aparecer, que para una derivación de trabajo es de sobra. Abrirla marca todo como
 * leído — quien la abre ya los ha visto, y dejar la cuenta encendida la vuelve ruido.
 */
function Campana() {
    const [avisos, setAvisos] = useState<Aviso[]>([])
    const [abierta, setAbierta] = useState(false)

    useEffect(() => {
        const cargar = () => { getAvisos().then(setAvisos).catch(() => {}) }
        cargar()
        const t = setInterval(cargar, 60_000)
        return () => clearInterval(t)
    }, [])

    const sinLeer = avisos.filter((a) => !a.leido)

    async function alternar() {
        const abriendo = !abierta
        setAbierta(abriendo)
        if (!abriendo || sinLeer.length === 0) return
        setAvisos((s) => s.map((a) => ({ ...a, leido: true })))
        await marcarAvisosLeidos(sinLeer.map((a) => a.id)).catch(() => {})
    }

    return (
        <div className="relative">
            <button onClick={alternar} onBlur={() => setTimeout(() => setAbierta(false), 150)} className="p-1.5 text-white/60 hover:text-white relative">
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {sinLeer.length > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-[9px] text-white font-bold h-4 w-4 flex items-center justify-center rounded-full border-2 border-[#2C2E3E]">
                        {sinLeer.length > 9 ? '9+' : sinLeer.length}
                    </span>
                )}
            </button>
            {abierta && (
                <div className="absolute right-0 top-full mt-1 w-[320px] max-h-[360px] overflow-auto bg-white text-slate-700 rounded shadow-lg border border-slate-200 z-40">
                    {avisos.length === 0 ? (
                        <div className="px-3 py-4 text-[12px] text-slate-400">Sin avisos.</div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {avisos.map((a) => (
                                <li key={a.id} className="px-3 py-2 text-[12px]">{a.texto}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    )
}

const NAV_TABS: { label: string; key?: SectionKey }[] = [
    { label: 'Tickets', key: 'tickets' },
    { label: 'Análisis', key: 'analisis' },
    { label: 'Actividades', key: 'actividades' },
    { label: 'Remisiones', key: 'remisiones' },
    { label: 'Mensajería Instantánea' },
    { label: 'Clientes', key: 'clientes' },
    { label: 'Base de Conocimientos' }
];

export const Header: React.FC<{ onOpenUsers: () => void; onOpenRoles: () => void; onOpenConfig: () => void; onOpenEquipos: () => void; activeSection: SectionKey; onOpenTickets: () => void; onOpenAnalisis: () => void; onOpenClientes: () => void; onOpenActividades: () => void; onOpenRemisiones: () => void }> = ({ onOpenUsers, onOpenRoles, onOpenConfig, onOpenEquipos, activeSection, onOpenTickets, onOpenAnalisis, onOpenClientes, onOpenActividades, onOpenRemisiones }) => {
    const { user } = useAuth()
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
                    {NAV_TABS.map((tab, idx) => {
                        const handler =
                            tab.key === 'tickets' ? onOpenTickets
                            : tab.key === 'analisis' && user?.isAdmin ? onOpenAnalisis
                            : tab.key === 'clientes' ? onOpenClientes
                            : tab.key === 'actividades' ? onOpenActividades
                            : tab.key === 'remisiones' ? onOpenRemisiones
                            : undefined
                        const isActive = tab.key === activeSection
                        return (
                        <button
                            key={idx}
                            onClick={handler}
                            className={`px-4 h-full text-[13px] font-medium transition-colors border-b-2 ${isActive ? 'text-white border-blue-500 bg-white/5' : 'text-white/60 border-transparent hover:text-white hover:bg-white/5'} ${handler ? 'cursor-pointer' : ''}`}
                        >
                            {tab.label}
                        </button>
                        )
                    })}
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
                    <Campana />
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
