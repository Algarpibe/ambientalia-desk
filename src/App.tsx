import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TicketDetailView } from './components/TicketDetailView';
import { COLUMNS } from '../shared/columns';
import { groupTicketsByColumn, groupByPriority, groupByDueDate, PRIORITY_COLUMNS, DUEDATE_COLUMNS } from './board';
import { useHideEmptyColumns } from './boardSettings';
import { useViewMode } from './viewSettings';
import { KanbanBoard } from './components/KanbanBoard';
import { TicketList } from './components/TicketList';
import { TicketTable } from './components/TicketTable';
import { ViewModeMenu } from './components/ViewModeMenu';
import { useAsync } from './hooks/useAsync';
import { fetchTickets } from './api/client';
import { useAuth } from './auth/AuthContext';
import { Login } from './components/Login';
import { UsersAdmin } from './components/UsersAdmin'
import { EquiposAdmin } from './components/EquiposAdmin'
import { RolesAdmin } from './components/RolesAdmin'
import { CreateTicket } from './components/CreateTicket'
import { Configuracion } from './components/Configuracion'

function App() {
  const { user, loading: authLoading } = useAuth();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showUsers, setShowUsers] = useState(false)
  const [showRoles, setShowRoles] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [showEquipos, setShowEquipos] = useState(false)
  const hideEmpty = useHideEmptyColumns()
  const [mode, setMode] = useViewMode()
  const { data: tickets, loading, error, reload } = useAsync(() => fetchTickets('all'), [user?.id]);
  const all = tickets ?? [];
  const activos = all.filter((t) => t.statusType !== 'Closed');

  if (authLoading) return <div className="h-screen flex items-center justify-center text-slate-400">Cargando…</div>
  if (!user) return <Login />

  return (
    <div className="bg-[#E9EDF2] dark:bg-slate-950 text-slate-900 dark:text-slate-100 h-screen flex flex-col overflow-hidden">
      <Header onOpenUsers={() => setShowUsers(true)} onOpenRoles={() => setShowRoles(true)} onOpenConfig={() => setShowConfig(true)} onOpenEquipos={() => setShowEquipos(true)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px] text-slate-400">star</span>
              <h1 className="text-[14px] font-semibold text-slate-700">Todos los Tickets</h1>
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
            <KanbanBoard columns={COLUMNS} groups={groupTicketsByColumn(activos)} hideEmpty={hideEmpty} loading={loading} onSelect={setSelectedTicketId} />
          )}
          {mode === 'prioridad' && (
            <KanbanBoard columns={PRIORITY_COLUMNS} groups={groupByPriority(all)} hideEmpty={hideEmpty} loading={loading} onSelect={setSelectedTicketId} />
          )}
          {mode === 'cuenta-regresiva' && (
            <KanbanBoard columns={DUEDATE_COLUMNS} groups={groupByDueDate(all, new Date())} hideEmpty={hideEmpty} loading={loading} onSelect={setSelectedTicketId} />
          )}
          {(mode === 'clasica' || mode === 'compacta') && (
            <TicketList tickets={all} dense={mode === 'compacta'} onSelect={setSelectedTicketId} />
          )}
          {mode === 'tabla' && (
            <TicketTable tickets={all} onSelect={setSelectedTicketId} />
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
