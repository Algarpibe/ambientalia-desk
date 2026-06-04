import { useState } from 'react'
import { getHideEmptyColumns, setHideEmptyColumns } from '../boardSettings'

type Item = { label: string; desc?: string; onClick?: () => void; soon?: boolean }
type Category = { title: string; items: Item[] }

function TopBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="bg-[#2C2E3E] text-white h-[48px] flex items-center px-4 gap-3 shrink-0">
      <button onClick={onBack} className="hover:bg-white/10 p-1 rounded" title="Volver">
        <span className="material-symbols-outlined">arrow_back</span>
      </button>
      <h1 className="text-[15px] font-bold">{title}</h1>
    </div>
  )
}

export function Configuracion({ onClose, onOpenUsers, onOpenRoles, isAdmin }: {
  onClose: () => void
  onOpenUsers: () => void
  onOpenRoles: () => void
  isAdmin: boolean
}) {
  const [section, setSection] = useState<'home' | 'tablero'>('home')
  const [query, setQuery] = useState('')
  const [hideEmpty, setHide] = useState(getHideEmptyColumns)

  function toggleHideEmpty(value: boolean) {
    setHide(value)
    setHideEmptyColumns(value)
  }

  // ---- Detalle: Tablero ----
  if (section === 'tablero') {
    return (
      <div className="fixed inset-0 z-[70] bg-white flex flex-col">
        <TopBar title="Configuración · Tablero" onBack={() => setSection('home')} />
        <div className="flex-1 overflow-auto p-6">
          <section className="max-w-[640px]">
            <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-wider mb-3">Columnas y visualización</h2>
            <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
              <input type="checkbox" className="mt-0.5" checked={hideEmpty} onChange={(e) => toggleHideEmpty(e.target.checked)} />
              <span>
                <span className="block text-[14px] font-medium text-slate-800">Ocultar columnas vacías</span>
                <span className="block text-[12px] text-slate-500">
                  No mostrar en el tablero los estados que no tienen ningún ticket (0). Desactívalo para ver todas las columnas del flujo.
                </span>
              </span>
            </label>
            <p className="text-[11px] text-slate-400 mt-3">La preferencia se guarda en este navegador.</p>
          </section>
        </div>
      </div>
    )
  }

  // ---- Home: rejilla de categorías (estilo Zoho Desk) ----
  const categories: Category[] = [
    {
      title: 'Tablero',
      items: [{ label: 'Columnas y visualización', desc: 'Ocultar columnas vacías', onClick: () => setSection('tablero') }],
    },
    ...(isAdmin
      ? [{
          title: 'Administración de usuarios',
          items: [
            { label: 'Usuarios', desc: 'Crear y gestionar usuarios', onClick: onOpenUsers },
            { label: 'Roles', desc: 'Roles y áreas (permisos)', onClick: onOpenRoles },
          ],
        } as Category]
      : []),
    {
      title: 'Datos',
      items: [
        { label: 'Clientes (Zoho Books)', soon: true },
        { label: 'Órdenes de venta (Zoho Books)', soon: true },
        { label: 'Registro de equipos', soon: true },
      ],
    },
    {
      title: 'Flujo de trabajo',
      items: [
        { label: 'Blueprint (estados y transiciones)', soon: true },
        { label: 'Áreas y permisos', soon: true },
      ],
    },
    {
      title: 'Canales',
      items: [
        { label: 'Correo electrónico', soon: true },
        { label: 'Remisiones', soon: true },
      ],
    },
    {
      title: 'Organización',
      items: [
        { label: 'Empresa', soon: true },
        { label: 'Reportería e indicadores', soon: true },
      ],
    },
  ]

  const q = query.trim().toLowerCase()
  const filtered = q
    ? categories
        .map((c) => ({ ...c, items: c.items.filter((i) => i.label.toLowerCase().includes(q)) }))
        .filter((c) => c.items.length > 0)
    : categories

  return (
    <div className="fixed inset-0 z-[70] bg-[#f6f7f9] flex flex-col">
      <TopBar title="Configuración" onBack={onClose} />

      <div className="bg-white border-b border-slate-200 py-3 px-4 flex justify-center shrink-0">
        <div className="relative w-full max-w-[520px]">
          <span className="material-symbols-outlined absolute left-2.5 top-1.5 text-[18px] text-slate-400">search</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en la configuración…"
            className="w-full border border-slate-200 rounded-full pl-9 pr-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-7">
          {filtered.map((cat) => (
            <div key={cat.title}>
              <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-2 mb-2">{cat.title}</h3>
              <ul className="flex flex-col">
                {cat.items.map((it) => (
                  <li key={it.label}>
                    {it.soon ? (
                      <div className="py-1.5 flex items-center gap-2" title="Próximamente">
                        <span className="text-[13px] text-slate-400">{it.label}</span>
                        <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">Pronto</span>
                      </div>
                    ) : (
                      <button onClick={it.onClick} className="w-full text-left py-1.5 group">
                        <span className="text-[13px] text-slate-700 group-hover:text-blue-600">{it.label}</span>
                        {it.desc && <span className="block text-[11px] text-slate-400">{it.desc}</span>}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-[13px] text-slate-400">Sin resultados para “{query}”.</p>}
        </div>
      </div>
    </div>
  )
}
