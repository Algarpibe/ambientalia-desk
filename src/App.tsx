import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TicketCard } from './components/TicketCard';
import { TicketDetailView } from './components/TicketDetailView';
import { TICKETS, TABS } from './data/mockData';

function App() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  return (
    <div className="bg-[#E9EDF2] dark:bg-slate-950 text-slate-900 dark:text-slate-100 h-screen flex flex-col overflow-hidden">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Sub-Header / Breadcrumb */}
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px] text-slate-400">star</span>
              <h1 className="text-[14px] font-semibold text-slate-700">Todos los Tickets</h1>
              <button className="p-1 hover:bg-slate-100 rounded">
                <span className="material-symbols-outlined text-[18px] text-slate-400">refresh</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded text-[12px] font-medium text-slate-600 hover:bg-slate-50">
                <span className="material-symbols-outlined text-[16px]">tune</span>
                Modo de estado
              </button>
              <button className="p-1 text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-[18px]">more_horiz</span>
              </button>
              <button className="p-1 text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-[18px]">info</span>
              </button>
            </div>
          </div>

          {/* Kanban Board */}
          <main className="flex-1 flex overflow-x-auto p-3 gap-2 bg-[#E9EDF2] dark:bg-slate-950">
            {TABS.map((column) => (
              <section key={column.id} className="w-[280px] min-w-[280px] flex flex-col">
                <div className="px-1 py-2 flex items-center justify-between">
                  <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    {column.label} ({column.count})
                  </h3>
                  <button className="text-slate-400 hover:text-slate-600">
                    <span className="material-symbols-outlined text-[16px]">expand_less</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 hide-scrollbar">
                  {TICKETS.filter(t => t.status === column.status).map(ticket => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onClick={() => setSelectedTicketId(ticket.id)}
                    />
                  ))}

                  {/* Empty state for demo if no tickets in column */}
                  {TICKETS.filter(t => t.status === column.status).length === 0 && (
                    <div className="h-20 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center opacity-40">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Sin Tickets</span>
                    </div>
                  )}
                </div>
              </section>
            ))}
          </main>
        </div>
      </div>

      {/* Ticket Detail Modal/View */}
      {selectedTicketId && (
        <TicketDetailView onClose={() => setSelectedTicketId(null)} />
      )}
    </div>
  );
}

export default App;
