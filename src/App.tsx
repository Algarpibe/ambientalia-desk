import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TicketCard } from './components/TicketCard';
import { TicketDetailView } from './components/TicketDetailView';
import { COLUMNS } from '../shared/columns';
import { groupTicketsByColumn, visibleColumns } from './board';
import { useHideEmptyColumns } from './boardSettings';
import { useAsync } from './hooks/useAsync';
import { fetchTickets } from './api/client';
import { useAuth } from './auth/AuthContext';
import { Login } from './components/Login';
import { UsersAdmin } from './components/UsersAdmin'
import { RolesAdmin } from './components/RolesAdmin'
import { CreateTicket } from './components/CreateTicket'
import { BoardConfig } from './components/BoardConfig'

function App() {
  const { user, loading: authLoading } = useAuth();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showUsers, setShowUsers] = useState(false)
  const [showRoles, setShowRoles] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const hideEmpty = useHideEmptyColumns()
  const { data: tickets, loading, error, reload } = useAsync(fetchTickets, [user?.id]);
  const groups = groupTicketsByColumn(tickets ?? []);
  const counts = Object.fromEntries(COLUMNS.map((c) => [c.id, groups[c.id]?.length ?? 0]));

  if (authLoading) return <div className="h-screen flex items-center justify-center text-slate-400">Cargando…</div>
  if (!user) return <Login />

  return (
    <div className="bg-[#E9EDF2] dark:bg-slate-950 text-slate-900 dark:text-slate-100 h-screen flex flex-col overflow-hidden">
      <Header onOpenUsers={() => setShowUsers(true)} onOpenRoles={() => setShowRoles(true)} onOpenConfig={() => setShowConfig(true)} />

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
            <button onClick={() => setShowCreate(true)} className="bg-[#2C7BE5] text-white px-3 py-1.5 rounded text-[13px] font-bold">Nuevo ticket</button>
          </div>

          {error && (
            <div className="bg-red-50 border-b border-red-200 text-red-700 text-[12px] px-4 py-2 flex items-center justify-between">
              <span>Error al cargar tickets: {error}</span>
              <button onClick={reload} className="font-bold underline">Reintentar</button>
            </div>
          )}

          <main className="flex-1 flex overflow-x-auto p-3 gap-2 bg-[#E9EDF2] dark:bg-slate-950">
            {visibleColumns(COLUMNS, counts, hideEmpty).map((column) => {
              const colTickets = groups[column.id] ?? [];
              return (
                <section key={column.id} className="w-[280px] min-w-[280px] flex flex-col">
                  <div className="px-1 py-2 flex items-center justify-between">
                    <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      {column.label} ({colTickets.length})
                    </h3>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 hide-scrollbar">
                    {loading && <div className="h-20 rounded-lg bg-slate-200/60 animate-pulse" />}
                    {!loading && colTickets.map((ticket) => (
                      <TicketCard key={ticket.id} ticket={ticket} onClick={() => setSelectedTicketId(ticket.id)} />
                    ))}
                    {!loading && colTickets.length === 0 && (
                      <div className="h-20 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center opacity-40">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Sin Tickets</span>
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </main>
        </div>
      </div>

      {selectedTicketId && (
        <TicketDetailView ticketId={selectedTicketId} onClose={() => setSelectedTicketId(null)} onChanged={reload} />
      )}

      {showUsers && <UsersAdmin onClose={() => setShowUsers(false)} />}
      {showRoles && <RolesAdmin onClose={() => setShowRoles(false)} />}
      {showCreate && <CreateTicket onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); reload() }} />}
      {showConfig && <BoardConfig onClose={() => setShowConfig(false)} />}
    </div>
  );
}

export default App;
