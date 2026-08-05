import { useMemo, useState } from 'react'
import type { RemisionListado } from '@ambientalia/shared'
import { useAsync } from '../hooks/useAsync'
import { fetchRemisionesListado } from '../api/client'
import { ESTADO_REMISION, ESTADO_REMISION_DESCONOCIDA } from '../lib/remisionResultado'

/** Formatea "2026-05-19" a "19 may 2026" (es-CO), evitando el corrimiento de un día por zona horaria. */
function fmtFecha(v: string): string {
  const d = new Date(v.length === 10 ? `${v}T00:00:00` : v)
  if (Number.isNaN(d.getTime())) return v
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
}

type EstadoVisual = { key: string; label: string; className: string }

/**
 * `ok` de una remisión histórica nunca pasó por el flujo de n8n —no hubo flujo que evaluar—, así
 * que no puede llevar la misma etiqueta que un `ok` de la app o se leería como que el flujo
 * funcionó. Mismo criterio que `PanelRemisiones` (detalle del ticket), con el mapa de estados
 * compartido en `lib/remisionResultado` para no mantener dos copias.
 */
function estadoVisual(r: RemisionListado): EstadoVisual {
  if (r.origen === 'historico') {
    return { key: 'historico', label: 'Importada del histórico', className: 'bg-slate-50 text-slate-500 border-slate-200' }
  }
  const badge = ESTADO_REMISION[r.estado] ?? ESTADO_REMISION_DESCONOCIDA
  return { key: r.estado, ...badge }
}

function origenLabel(o: string): string { return o === 'historico' ? 'Histórico' : 'App' }

const ESTADO_FILTROS: { value: string; label: string }[] = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'pendiente', label: 'Enviando…' },
  { value: 'ok', label: 'Creada' },
  { value: 'ok_con_avisos', label: 'Creada con avisos' },
  { value: 'error', label: 'Falló' },
  { value: 'historico', label: 'Importada del histórico' },
]
const ORIGEN_FILTROS: { value: string; label: string }[] = [
  { value: 'todos', label: 'Todos los orígenes' },
  { value: 'app', label: 'App' },
  { value: 'historico', label: 'Histórico' },
]

const COLS = ['Fecha', 'Técnico', 'Empresa', 'Persona Contacto', 'Marca', 'Modelo', 'Número de Serie', 'Incluye', 'Tipo de servicio', 'Ticket', 'Observaciones', 'Estado', 'Origen']

/** Envuelve entre comillas y escapa las internas cuando el campo trae coma, comilla o salto de línea. */
function csvCampo(v: string): string {
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

/**
 * Exporta EXACTAMENTE lo que se está viendo —con los filtros ya aplicados— en el mismo orden de
 * columnas que la tabla. El BOM UTF-8 al inicio es la parte que nadie nota hasta que falta: sin
 * él, Excel abre el archivo con la codificación local y "Diagnóstico" sale como "DiagnÃ³stico".
 */
function exportarCSV(filas: RemisionListado[]) {
  const cuerpo = filas.map((r) => [
    r.fecha, r.tecnico ?? '', r.empresa ?? '', r.personaContacto ?? '', r.marca ?? '', r.modelo ?? '',
    r.serial ?? '', r.incluye.join(', '), r.tipoServicio ?? '', r.ticketNumero ?? '', r.observaciones ?? '',
    estadoVisual(r).label, origenLabel(r.origen),
  ])
  const csv = [COLS, ...cuerpo].map((fila) => fila.map(csvCampo).join(',')).join('\r\n')
  const BOM = String.fromCharCode(0xfeff)
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `remisiones-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Recupera la vista tabular que tenía `Entrada.xlsx` (149 filas históricas, migradas y
 * desconectadas), ahora sobre `remisiones` y con las de la app juntas. Todo se carga una sola vez
 * —hoy son ~170 filas, creciendo despacio— y el filtrado va en el cliente: por eso `useAsync` no
 * lleva `q`/`estadoFiltro`/`origenFiltro` en las dependencias.
 */
export function RemisionesPage({ onSelectTicket }: { onClose: () => void; onSelectTicket: (id: string) => void }) {
  const { data, loading, error } = useAsync<RemisionListado[]>(() => fetchRemisionesListado(), [])
  const [q, setQ] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('todos')
  const [origenFiltro, setOrigenFiltro] = useState('todos')

  const filas = useMemo(() => {
    const ql = q.trim().toLowerCase()
    return (data ?? []).filter((r) => {
      if (origenFiltro !== 'todos' && r.origen !== origenFiltro) return false
      if (estadoFiltro !== 'todos' && estadoVisual(r).key !== estadoFiltro) return false
      if (!ql) return true
      return [r.empresa, r.serial, r.tecnico, r.ticketNumero, r.observaciones].some((v) => (v ?? '').toLowerCase().includes(ql))
    })
  }, [data, q, estadoFiltro, origenFiltro])

  const hayDatos = !!data && data.length > 0
  const sinResultadosTrasFiltrar = hayDatos && filas.length === 0

  return (
    <div className="fixed inset-x-0 bottom-0 top-[48px] z-20 bg-white flex flex-col">
      <div className="border-b border-slate-200 px-4 py-2.5 flex items-center gap-2 shrink-0 flex-wrap">
        <h2 className="text-[14px] font-semibold text-slate-700 mr-1">Remisiones</h2>
        <span className="text-[12px] text-slate-400">{filas.length}</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por empresa, serial, técnico, ticket u observaciones…"
          className="ml-3 border border-slate-200 rounded px-3 py-1.5 text-[13px] w-[320px]"
        />
        <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)} className="border border-slate-200 rounded px-2 py-1.5 text-[13px] text-slate-600">
          {ESTADO_FILTROS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <select value={origenFiltro} onChange={(e) => setOrigenFiltro(e.target.value)} className="border border-slate-200 rounded px-2 py-1.5 text-[13px] text-slate-600">
          {ORIGEN_FILTROS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <button
          onClick={() => exportarCSV(filas)}
          disabled={filas.length === 0}
          className="ml-auto bg-[#2C7BE5] text-white px-3 py-1.5 rounded text-[13px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Exportar CSV
        </button>
      </div>

      {loading && !data && <div className="p-4 text-[13px] text-slate-400">Cargando…</div>}
      {error && <div className="p-4 text-[13px] text-red-600">No se pudieron cargar las remisiones: {error}</div>}
      {!loading && !error && data && data.length === 0 && (
        <div className="p-4 text-[13px] text-slate-400">No hay remisiones registradas.</div>
      )}
      {!loading && !error && sinResultadosTrasFiltrar && (
        <div className="p-4 text-[13px] text-slate-400">Ninguna remisión coincide con estos filtros.</div>
      )}

      {!loading && !error && filas.length > 0 && (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-slate-50 text-slate-500 uppercase text-[11px]">
              <tr className="text-left border-b border-slate-200">
                {COLS.map((c) => <th key={c} className="px-3 py-2 font-semibold whitespace-nowrap">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {filas.map((r) => {
                const badge = estadoVisual(r)
                const incluye = r.incluye.join(', ')
                return (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{fmtFecha(r.fecha)}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{r.tecnico}</td>
                    <td className="px-3 py-2 text-slate-600 max-w-[200px] truncate" title={r.empresa || undefined}>{r.empresa}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{r.personaContacto}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{r.marca}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{r.modelo}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{r.serial}</td>
                    {/* Incluye puede ser largo (varios ítems del checklist): se trunca visualmente y
                        el título nativo del navegador deja verlo entero al pasar el mouse, sin
                        empujar el resto de columnas fuera de la pantalla. */}
                    <td className="px-3 py-2 text-slate-600 max-w-[220px] truncate" title={incluye || undefined}>{incluye}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{r.tipoServicio}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.ticketNumero && (
                        <button onClick={() => r.ticketId && onSelectTicket(r.ticketId)} className="text-[#2C7BE5] hover:underline font-medium">
                          {r.ticketNumero}
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-600 max-w-[280px] truncate" title={r.observaciones || undefined}>{r.observaciones}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`text-[11px] px-2 py-0.5 rounded border font-bold ${badge.className}`}>{badge.label}</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`text-[11px] px-2 py-0.5 rounded border font-bold ${r.origen === 'historico' ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                        {origenLabel(r.origen)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
