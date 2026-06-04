import { useState } from 'react'
import { getHideEmptyColumns, setHideEmptyColumns } from '../boardSettings'

type Item = { label: string; onClick?: () => void; soon?: boolean }
type Category = { title: string; items: Item[] }

// Novedades del producto (panel derecho, estilo "Actualizaciones de producto" de Zoho Desk).
const NOVEDADES = [
  { title: 'Creación de tickets en la app', body: 'Crea tickets desde una Orden de Venta de Zoho Books, atados a un equipo registrado. Asunto y código estandarizados automáticamente.' },
  { title: 'Registro de equipos', body: 'Catálogo de equipos vendidos (serie → marca / modelo / tipo / cliente). No se puede abrir un ticket sin un equipo registrado.' },
  { title: 'Sincronización con Zoho Books', body: 'Clientes (con NIT) y órdenes de venta sincronizados a la plataforma para los buscadores del alta de tickets.' },
  { title: 'Tablero configurable', body: 'Oculta las columnas vacías del tablero desde esta misma página de Configuración.' },
]

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
        <div className="bg-white border-b border-slate-200 h-[46px] flex items-center px-4 gap-3 shrink-0">
          <button onClick={() => setSection('home')} className="p-1 text-slate-500 hover:text-slate-800 rounded" title="Volver">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <span className="text-[14px] font-semibold text-slate-700">Personalización · Tablero</span>
        </div>
        <div className="flex-1 overflow-auto p-6 bg-[#f4f5f7]">
          <section className="max-w-[640px] bg-white border border-slate-200 rounded-md p-5">
            <h2 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-2 mb-3">Columnas y visualización</h2>
            <label className="flex items-start gap-3 cursor-pointer">
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

  // ---- Home: rejilla de categorías (réplica del hub de Zoho Desk) ----
  const categories: Category[] = [
    {
      title: 'Organización',
      items: [
        { label: 'Empresa', soon: true },
        { label: 'Horario laboral', soon: true },
        { label: 'Departamentos / Áreas', soon: true },
        { label: 'Reportería e indicadores', soon: true },
      ],
    },
    ...(isAdmin
      ? [{
          title: 'Administración de usuarios',
          items: [
            { label: 'Usuarios', onClick: onOpenUsers },
            { label: 'Roles', onClick: onOpenRoles },
            { label: 'Perfiles', soon: true },
          ],
        } as Category]
      : []),
    {
      title: 'Canales',
      items: [
        { label: 'Correo electrónico', soon: true },
        { label: 'Remisiones', soon: true },
      ],
    },
    {
      title: 'Autoservicio',
      items: [{ label: 'Base de conocimientos', soon: true }],
    },
    {
      title: 'Personalización',
      items: [
        { label: 'Tablero (columnas)', onClick: () => setSection('tablero') },
        { label: 'Diseños y campos', soon: true },
        { label: 'Plantillas de tickets', soon: true },
      ],
    },
    {
      title: 'Automatización',
      items: [
        { label: 'Blueprint (estados y transiciones)', soon: true },
        { label: 'Reglas de asignación', soon: true },
        { label: 'Flujos de trabajo', soon: true },
      ],
    },
    {
      title: 'Administración de datos',
      items: [
        { label: 'Clientes (Zoho Books)', soon: true },
        { label: 'Órdenes de venta (Zoho Books)', soon: true },
        { label: 'Registro de equipos', soon: true },
        { label: 'Importar / Exportar', soon: true },
      ],
    },
    {
      title: 'Integraciones',
      items: [
        { label: 'Zoho Books', soon: true },
        { label: 'Zoho Desk', soon: true },
      ],
    },
    {
      title: 'Espacio del desarrollador',
      items: [
        { label: 'API', soon: true },
        { label: 'Webhooks', soon: true },
      ],
    },
    {
      title: 'Privacidad y seguridad',
      items: [
        { label: 'Registro de auditoría', soon: true },
        { label: 'Sesiones', soon: true },
      ],
    },
    {
      title: 'Mi cuenta',
      items: [
        { label: 'Mi perfil', soon: true },
        { label: 'Cambiar contraseña', soon: true },
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
    <div className="fixed inset-0 z-[70] bg-white flex flex-col">
      {/* Barra superior clara con buscador centrado + cerrar */}
      <div className="bg-white border-b border-slate-200 h-[46px] flex items-center px-4 gap-4 shrink-0">
        <span className="text-[14px] font-semibold text-slate-700 whitespace-nowrap">Configuración</span>
        <div className="flex-1 flex justify-center">
          <div className="relative w-full max-w-[480px]">
            <span className="material-symbols-outlined absolute left-2.5 top-1.5 text-[18px] text-slate-400">search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Configuración de la búsqueda"
              className="w-full border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-[13px] bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white"
            />
          </div>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700" title="Cerrar">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Área principal: rejilla de categorías + panel de novedades, sobre fondo con textura */}
      <div
        className="flex-1 overflow-auto"
        style={{ backgroundColor: '#f4f5f7', backgroundImage: 'radial-gradient(#e4e7ea 1px, transparent 1px)', backgroundSize: '22px 22px' }}
      >
        <div className="flex gap-6 p-6 max-w-[1400px] mx-auto">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
            {filtered.map((cat) => (
              <div key={cat.title} className="bg-white border border-slate-200 rounded-md px-4 py-3">
                <h3 className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200 pb-2 mb-1">{cat.title}</h3>
                <ul className="flex flex-col">
                  {cat.items.map((it) => (
                    <li key={it.label}>
                      {it.soon ? (
                        <div className="py-[5px] flex items-center gap-2" title="Próximamente">
                          <span className="text-[13px] text-slate-400">{it.label}</span>
                          <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">Pronto</span>
                        </div>
                      ) : (
                        <button onClick={it.onClick} className="block w-full text-left py-[5px] text-[13px] text-slate-600 hover:text-blue-600">
                          {it.label}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-[13px] text-slate-400 col-span-full">Sin resultados para “{query}”.</p>}
          </div>

          {/* Panel derecho: Actualizaciones de producto */}
          <aside className="w-[300px] shrink-0 hidden xl:block">
            <h2 className="text-[14px] font-semibold text-slate-700 mb-3 flex items-center gap-1">
              Actualizaciones de producto <span className="material-symbols-outlined text-[16px] text-amber-500">auto_awesome</span>
            </h2>
            <div className="flex flex-col gap-3">
              {NOVEDADES.map((n) => (
                <div key={n.title} className="bg-white border border-slate-200 rounded-md p-3">
                  <div className="text-[13px] font-semibold text-slate-800 mb-1">{n.title}</div>
                  <p className="text-[12px] text-slate-500 leading-snug">{n.body}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
