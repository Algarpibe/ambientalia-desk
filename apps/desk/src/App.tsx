import { lazy, Suspense, useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TicketDetailView } from './components/TicketDetailView';
import { COLUMNS } from '@ambientalia/shared';
import type { Ticket } from '@ambientalia/shared';
import { groupTicketsByColumn, groupByPriority, groupByDueDate, PRIORITY_COLUMNS, DUEDATE_COLUMNS } from './board';
import { applyBoardView, viewLabel, type VistaKey } from './lib/boardView';
import { useHideEmptyColumns } from './boardSettings';
import { useViewMode } from './viewSettings';
import { KanbanBoard } from './components/KanbanBoard';
import { TicketList } from './components/TicketList';
import { TicketTable } from './components/TicketTable';
import { ViewModeMenu } from './components/ViewModeMenu';
import { useAsync } from './hooks/useAsync';
import { fetchActiveTickets, fetchClosedTickets, setTicketRead, type ClosedPage } from './api/client';
import { Pagination } from './components/Pagination';
import { useAuth } from './auth/AuthContext';
import { Login } from './components/Login';

const UsersAdmin = lazy(() => import('./components/UsersAdmin').then(m => ({ default: m.UsersAdmin })))
const EquiposAdmin = lazy(() => import('./components/EquiposAdmin').then(m => ({ default: m.EquiposAdmin })))
const RolesAdmin = lazy(() => import('./components/RolesAdmin').then(m => ({ default: m.RolesAdmin })))
const CreateTicket = lazy(() => import('./components/CreateTicket').then(m => ({ default: m.CreateTicket })))
const Configuracion = lazy(() => import('./components/Configuracion').then(m => ({ default: m.Configuracion })))
const CatalogoEquipos = lazy(() => import('./components/CatalogoEquipos').then(m => ({ default: m.CatalogoEquipos })))
const Analisis = lazy(() => import('./components/Analisis').then(m => ({ default: m.Analisis })))
const ClientesPage = lazy(() => import('./components/ClientesPage').then(m => ({ default: m.ClientesPage })))
const ActividadesPage = lazy(() => import('./components/ActividadesPage').then(m => ({ default: m.ActividadesPage })))
const RemisionesPage = lazy(() => import('./components/RemisionesPage').then(m => ({ default: m.RemisionesPage })))

function App() {
  const { user, loading: authLoading } = useAuth();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showUsers, setShowUsers] = useState(false)
  const [showRoles, setShowRoles] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [showEquipos, setShowEquipos] = useState(false)
  const [showCatalogo, setShowCatalogo] = useState(false)
  const [showAnalisis, setShowAnalisis] = useState(false)
  const [showClientes, setShowClientes] = useState(false)
  const [clientesInitial, setClientesInitial] = useState<{ kind: 'contacto' | 'empresa'; id: string } | null>(null)
  const [showActividades, setShowActividades] = useState(false)
  const [showRemisiones, setShowRemisiones] = useState(false)
  const activeSection: 'analisis' | 'clientes' | 'actividades' | 'remisiones' | 'tickets' = showAnalisis ? 'analisis' : showClientes ? 'clientes' : showActividades ? 'actividades' : showRemisiones ? 'remisiones' : 'tickets'
  const abrirSeccion = (s: 'analisis' | 'clientes' | 'actividades' | 'remisiones' | 'tickets') => {
    setShowAnalisis(s === 'analisis'); setShowClientes(s === 'clientes'); setShowActividades(s === 'actividades'); setShowRemisiones(s === 'remisiones')
    if (s !== 'clientes') setClientesInitial(null)
    // El detalle del ticket vive en una capa por encima de las secciones: si se queda abierto, la
    // sección recién elegida se carga debajo y no se ve. Ir a una sección es salir del ticket.
    setSelectedTicketId(null)
  }
  const abrirCliente = (kind: 'contacto' | 'empresa', id: string) => { setClientesInitial({ kind, id }); setShowAnalisis(false); setShowActividades(false); setShowClientes(true) }
  const hideEmpty = useHideEmptyColumns()
  const [mode, setMode] = useViewMode()
  const [view, setView] = useState<VistaKey>('todos');
  const [closedPage, setClosedPage] = useState(1)
  useEffect(() => { setClosedPage(1) }, [view])
  const isClosed = view === 'cerrados'
  const { data: resp, loading, error, reload } = useAsync<Ticket[] | ClosedPage>(
    () => (isClosed ? fetchClosedTickets(closedPage) : fetchActiveTickets()),
    [user?.id, view, closedPage],
  );
  const tickets: Ticket[] = isClosed ? ((resp as ClosedPage | null)?.items ?? []) : ((resp as Ticket[] | null) ?? []);
  const closedMeta = isClosed ? (resp as ClosedPage | null) : null;
  const all = tickets;
  // `user.id` solo lo usa la vista «Mis Tickets». El servidor sigue devolviendo TODOS los tickets:
  // esto filtra lo que se enseña, nunca lo que se puede ver.
  const base = applyBoardView(all, view, new Date(), user?.id);
  const [readOverrides, setReadOverrides] = useState<Record<string, boolean>>({})
  // Al llegar datos frescos del servidor, descarta los overrides optimistas (deja mandar al servidor,
  // p.ej. para que la reactivación "no leído" por actividad nueva se refleje tras recargar).
  useEffect(() => { setReadOverrides({}) }, [resp])
  const baseRead = base.map((t) => (t.id in readOverrides ? { ...t, read: readOverrides[t.id] } : t))
  const marcarLeido = (id: string, read: boolean) => { setReadOverrides((o) => ({ ...o, [id]: read })); setTicketRead(id, read).catch(() => {}) }
  const abrirTicket = (id: string) => { setSelectedTicketId(id); marcarLeido(id, true) }

  if (authLoading) return <div className="h-screen flex items-center justify-center text-slate-400">Cargando…</div>
  if (!user) return <Login />

  return (
    <div className="bg-[#E9EDF2] dark:bg-slate-950 text-slate-900 dark:text-slate-100 h-screen flex flex-col overflow-hidden">
      <Header onOpenUsers={() => setShowUsers(true)} onOpenRoles={() => setShowRoles(true)} onOpenConfig={() => setShowConfig(true)} onOpenEquipos={() => setShowEquipos(true)} activeSection={activeSection} onOpenTickets={() => abrirSeccion('tickets')} onOpenAnalisis={() => abrirSeccion('analisis')} onOpenClientes={() => abrirSeccion('clientes')} onOpenActividades={() => abrirSeccion('actividades')} onOpenRemisiones={() => abrirSeccion('remisiones')} />

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
          {isClosed && closedMeta && (
            <Pagination
              page={closedPage}
              pageSize={closedMeta.pageSize}
              total={closedMeta.total}
              onPrev={() => setClosedPage((p) => Math.max(1, p - 1))}
              onNext={() => setClosedPage((p) => Math.min(Math.max(1, Math.ceil(closedMeta.total / closedMeta.pageSize)), p + 1))}
            />
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

      <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 text-sm text-slate-600">Cargando…</div>}>
        {showUsers && <UsersAdmin onClose={() => setShowUsers(false)} />}
        {showEquipos && <EquiposAdmin onClose={() => setShowEquipos(false)} onAbrirCatalogo={() => { setShowEquipos(false); setShowCatalogo(true) }} />}
        {showCatalogo && <CatalogoEquipos onClose={() => setShowCatalogo(false)} />}
        {showAnalisis && <Analisis onClose={() => setShowAnalisis(false)} />}
        {showClientes && <ClientesPage initial={clientesInitial} onClose={() => { setShowClientes(false); setClientesInitial(null) }} onSelectTicket={(id) => { setShowClientes(false); setClientesInitial(null); setSelectedTicketId(id) }} onAgregarTicket={() => setShowCreate(true)} />}
        {showActividades && <ActividadesPage onClose={() => setShowActividades(false)} onSelectTicket={(id) => { setShowActividades(false); setSelectedTicketId(id) }} />}
        {showRemisiones && <RemisionesPage onClose={() => setShowRemisiones(false)} onSelectTicket={(id) => { setShowRemisiones(false); setSelectedTicketId(id) }} isAdmin={!!user.isAdmin} />}
        {showRoles && <RolesAdmin onClose={() => setShowRoles(false)} />}
        {/* El alta se cierra sola cuando termina, con remisión o sin ella: los dos pasos viven dentro
            de `CreateTicket`, así que aquí el tablero se recarga UNA vez y no a mitad del trámite. */}
        {showCreate && <CreateTicket onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); reload() }} />}
        {showConfig && (
          <Configuracion
            onClose={() => setShowConfig(false)}
            onOpenUsers={() => { setShowConfig(false); setShowUsers(true) }}
            onOpenRoles={() => { setShowConfig(false); setShowRoles(true) }}
            onOpenEquipos={() => { setShowConfig(false); setShowEquipos(true) }}
            onOpenCatalogo={() => { setShowConfig(false); setShowCatalogo(true) }}
            isAdmin={!!user.isAdmin}
          />
        )}
      </Suspense>
    </div>
  );
}

export default App;
