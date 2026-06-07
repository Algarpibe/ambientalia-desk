import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TicketDetailView } from './components/TicketDetailView';
import { COLUMNS } from '../shared/columns';
import { groupTicketsByColumn, groupByPriority, groupByDueDate, PRIORITY_COLUMNS, DUEDATE_COLUMNS } from './board';
import { applyBoardView, viewLabel } from './lib/boardView';
import { useHideEmptyColumns } from './boardSettings';
import { useViewMode } from './viewSettings';
import { KanbanBoard } from './components/KanbanBoard';
import { TicketList } from './components/TicketList';
import { TicketTable } from './components/TicketTable';
import { ViewModeMenu } from './components/ViewModeMenu';
import { useAsync } from './hooks/useAsync';
import { fetchTickets, setTicketRead } from './api/client';
import { useAuth } from './auth/AuthContext';
import { Login } from './components/Login';
import { UsersAdmin } from './components/UsersAdmin'
import { EquiposAdmin } from './components/EquiposAdmin'
import { RolesAdmin } from './components/RolesAdmin'
import { CreateTicket } from './components/CreateTicket'
import { Configuracion } from './components/Configuracion'
import { Analisis } from './components/Analisis'
import { ClientesPage } from './components/ClientesPage'
import { ActividadesPage } from './components/ActividadesPage'

function App() {
  const { user, loading: authLoading } = useAuth();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showUsers, setShowUsers] = useState(false)
  const [showRoles, setShowRoles] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [showEquipos, setShowEquipos] = useState(false)
  const [showAnalisis, setShowAnalisis] = useState(false)
  const [showClientes, setShowClientes] = useState(false)
  const [clientesInitial, setClientesInitial] = useState<{ kind: 'contacto' | 'empresa'; id: string } | null>(null)
  const abrirCliente = (kind: 'contacto' | 'empresa', id: string) => { setClientesInitial({ kind, id }); setShowClientes(true) }
  const [showActividades, setShowActividades] = useState(false)
  const hideEmpty = useHideEmptyColumns()
  const [mode, setMode] = useViewMode()
  const { data: tickets, loading, error, reload } = useAsync(() => fetchTickets('all'), [user?.id]);
  const all = tickets ?? [];
  const [view, setView] = useState('todos');
  const base = applyBoardView(all, view, new Date());
  const [readOverrides, setReadOverrides] = useState<Record<string, boolean>>({})
  // Al llegar datos frescos del servidor, descarta los overrides optimistas (deja mandar al servidor,
  // p.ej. para que la reactivación "no leído" por actividad nueva se refleje tras recargar).
  useEffect(() => { setReadOverrides({}) }, [tickets])
  const baseRead = base.map((t) => (t.id in readOverrides ? { ...t, read: readOverrides[t.id] } : t))
  const marcarLeido = (id: string, read: boolean) => { setReadOverrides((o) => ({ ...o, [id]: read })); setTicketRead(id, read).catch(() => {}) }
  const abrirTicket = (id: string) => { setSelectedTicketId(id); marcarLeido(id, true) }

  if (authLoading) return <div className="h-screen flex items-center justify-center text-slate-400">Cargando…</div>
  if (!user) return <Login />

  return (
    <div className="bg-[#E9EDF2] dark:bg-slate-950 text-slate-900 dark:text-slate-100 h-screen flex flex-col overflow-hidden">
      <Header onOpenUsers={() => setShowUsers(true)} onOpenRoles={() => setShowRoles(true)} onOpenConfig={() => setShowConfig(true)} onOpenEquipos={() => setShowEquipos(true)} onOpenAnalisis={() => setShowAnalisis(true)} onOpenClientes={() => { setClientesInitial(null); setShowClientes(true) }} onOpenActividades={() => setShowActividades(true)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeView={view} onSelectView={setView} />

        <div className="flex-1 flex flex-col min-w-0">
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px] text-slate-400">star</span>
              <h1 className="text-[14px] font-semibold text-slate-700">{viewLabel(view)}</h1>
              <button onClick={reload} className="p-1 hover:bg-slate-100 rounded">
                <span className="material-symbols-outlined text-[18px] text-slate-400">refresh</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <ViewModeMenu mode={mode} onChange={setMode} />
              <button onClick={() => setShowCreate(true)} className="bg-[#2C7BE5] text-white px-3 py-1.5 rounded text-[13px] font-bold">Nuevo ticket</button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-b border-red-200 text-red-700 text-[12px] px-4 py-2 flex items-center justify-between">
              <span>Error al cargar tickets: {error}</span>
              <button onClick={reload} className="font-bold underline">Reintentar</button>
            </div>
          )}

          {mode === 'estado' && (
            <KanbanBoard columns={COLUMNS} groups={groupTicketsByColumn(baseRead)} hideEmpty={hideEmpty} loading={loading} onSelect={abrirTicket} onToggleRead={marcarLeido} onOpenCliente={abrirCliente} />
          )}
          {mode === 'prioridad' && (
            <KanbanBoard columns={PRIORITY_COLUMNS} groups={groupByPriority(baseRead)} hideEmpty={hideEmpty} loading={loading} onSelect={abrirTicket} onToggleRead={marcarLeido} onOpenCliente={abrirCliente} />
          )}
          {mode === 'cuenta-regresiva' && (
            <KanbanBoard columns={DUEDATE_COLUMNS} groups={groupByDueDate(baseRead, new Date())} hideEmpty={hideEmpty} loading={loading} onSelect={abrirTicket} onToggleRead={marcarLeido} onOpenCliente={abrirCliente} />
          )}
          {(mode === 'clasica' || mode === 'compacta') && (
            <TicketList tickets={baseRead} dense={mode === 'compacta'} onSelect={abrirTicket} onToggleRead={marcarLeido} onOpenCliente={abrirCliente} />
          )}
          {mode === 'tabla' && (
            <TicketTable tickets={baseRead} onSelect={abrirTicket} onToggleRead={marcarLeido} onOpenCliente={abrirCliente} />
          )}
        </div>
      </div>

      {selectedTicketId && (
        <TicketDetailView
          ticketId={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
          onChanged={reload}
          tickets={all}
          onSelect={setSelectedTicketId}
        />
      )}

      {showUsers && <UsersAdmin onClose={() => setShowUsers(false)} />}
      {showEquipos && <EquiposAdmin onClose={() => setShowEquipos(false)} />}
      {showAnalisis && <Analisis onClose={() => setShowAnalisis(false)} />}
      {showClientes && <ClientesPage initial={clientesInitial} onClose={() => { setShowClientes(false); setClientesInitial(null) }} onSelectTicket={(id) => { setShowClientes(false); setClientesInitial(null); setSelectedTicketId(id) }} onAgregarTicket={() => setShowCreate(true)} />}
      {showActividades && <ActividadesPage onClose={() => setShowActividades(false)} onSelectTicket={(id) => { setShowActividades(false); setSelectedTicketId(id) }} />}
      {showRoles && <RolesAdmin onClose={() => setShowRoles(false)} />}
      {showCreate && <CreateTicket onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); reload() }} />}
      {showConfig && (
        <Configuracion
          onClose={() => setShowConfig(false)}
          onOpenUsers={() => { setShowConfig(false); setShowUsers(true) }}
          onOpenRoles={() => { setShowConfig(false); setShowRoles(true) }}
          onOpenEquipos={() => { setShowConfig(false); setShowEquipos(true) }}
          isAdmin={!!user.isAdmin}
        />
      )}
    </div>
  );
}

export default App;
