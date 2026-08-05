import { useMemo, useState } from 'react'
import type { RemisionListado } from '@ambientalia/shared'
import { useAsync } from '../hooks/useAsync'
import { fetchRemisionesListado, anularRemision, restaurarRemision } from '../api/client'
import { ESTADO_REMISION, ESTADO_REMISION_DESCONOCIDA } from '../lib/remisionResultado'

/** Formatea "2026-05-19" a "19 may 2026" (es-CO), evitando el corrimiento de un día por zona horaria. */
function fmtFecha(v: string): string {
  const d = new Date(v.length === 10 ? `${v}T00:00:00` : v)
  if (Number.isNaN(d.getTime())) return v
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
}

/**
 * La hora que la columna Fecha no puede dar por sí sola: `fecha` es un `date` en la base, sin hora.
 * La única que existe es `created_at`, y solo significa "cuándo se hizo la remisión" en las de la
 * app. En una histórica es el instante en que se importó la hoja de Google —las 149 comparten
 * minuto—, así que pintarla ahí sería presentar un dato de la migración como si fuera del servicio.
 * Devuelve cadena vacía cuando no hay hora que enseñar.
 */
function horaVisible(r: RemisionListado): string {
  if (r.origen !== 'app') return ''
  const d = new Date(r.createdAt)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' }).format(d)
}

type EstadoVisual = { key: string; label: string; className: string }

/**
 * `ok` de una remisión histórica nunca pasó por el flujo de n8n —no hubo flujo que evaluar—, así
 * que no puede llevar la misma etiqueta que un `ok` de la app o se leería como que el flujo
 * funcionó. Mismo criterio que `PanelRemisiones` (detalle del ticket), con el mapa de estados
 * compartido en `lib/remisionResultado` para no mantener dos copias.
 *
 * Anulada gana sobre cualquier otro estado —incluido histórico—: es la única marca que dice "esto
 * ya no cuenta", y por venir de `estadoVisual` la recibe también el CSV (mismo criterio: exporta
 * exactamente lo que se ve).
 */
function estadoVisual(r: RemisionListado): EstadoVisual {
  if (r.anuladaAt) {
    return { key: 'anulada', label: 'Anulada', className: 'bg-slate-100 text-slate-500 border-slate-300' }
  }
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
// Solo tiene sentido cuando "Ver anuladas" está activo: sin eso el servidor ni siquiera manda
// anuladas, así que el filtro estaría siempre vacío. Aparte de la lista de arriba —no dentro de
// ella— porque es la única opción condicionada al interruptor.
const FILTRO_ANULADA = { value: 'anulada', label: 'Anuladas' }
const ORIGEN_FILTROS: { value: string; label: string }[] = [
  { value: 'todos', label: 'Todos los orígenes' },
  { value: 'app', label: 'App' },
  { value: 'historico', label: 'Histórico' },
]

// Mismo orden que la cabecera real de `Entrada.xlsx` (Técnico va antes que Fecha), para que quien
// usaba la hoja no tenga que reaprender dónde está cada dato. Estado y Origen van al final: la
// hoja no los tenía.
const COLS = ['Técnico', 'Fecha', 'Empresa', 'Persona Contacto', 'Marca', 'Modelo', 'Número de Serie', 'Incluye', 'Tipo de servicio', 'Ticket', 'Observaciones', 'Estado', 'Origen']

/**
 * El número de ticket sin el `#` que sí lleva en pantalla. La hoja original guardaba `804` como
 * número, no como texto; si el CSV sale con `#804`, Excel lo abre como texto y se pierde poder
 * ordenar y filtrar por número — justo lo que un export existe para preservar.
 */
function ticketNumeroPlano(r: RemisionListado): string {
  return r.ticketNumero ? r.ticketNumero.replace(/^#/, '') : ''
}

/**
 * Envuelve entre comillas y escapa las internas cuando el campo trae coma, comilla o salto de
 * línea. Antes de eso, neutraliza la inyección de fórmulas: Excel (y Sheets) interpretan un valor
 * que EMPIEZA por `=`, `+`, `-` o `@` como una fórmula, no como texto —una observación tan normal
 * como "- Sin cable" saldría como error en la celda—. Anteponer una comilla simple es la marca
 * estándar de "esto es texto"; Excel la usa para decidir y no la muestra.
 */
function csvCampo(v: string): string {
  const seguro = /^[=+\-@]/.test(v) ? `'${v}` : v
  return /[",\r\n]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro
}

/**
 * Exporta EXACTAMENTE lo que se está viendo —con los filtros ya aplicados— en el mismo orden de
 * columnas que la tabla. El BOM UTF-8 al inicio es la parte que nadie nota hasta que falta: sin
 * él, Excel abre el archivo con la codificación local y "Diagnóstico" sale como "DiagnÃ³stico".
 */
/**
 * La fecha para el CSV. Lleva la hora cuando la hay —mismo criterio que la tabla— pero en 24h
 * pegada al ISO (`2026-07-24 14:41`) y no en el formato de pantalla: así Excel lo sigue leyendo
 * como fecha-hora y se puede ordenar por él, que es media razón para exportar.
 */
function fechaCSV(r: RemisionListado): string {
  if (r.origen !== 'app') return r.fecha
  const d = new Date(r.createdAt)
  if (Number.isNaN(d.getTime())) return r.fecha
  return `${r.fecha} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function exportarCSV(filas: RemisionListado[]) {
  const cuerpo = filas.map((r) => [
    r.tecnico ?? '', fechaCSV(r), r.empresa ?? '', r.personaContacto ?? '', r.marca ?? '', r.modelo ?? '',
    r.serial ?? '', r.incluye.join(', '), r.tipoServicio ?? '', ticketNumeroPlano(r), r.observaciones ?? '',
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
 * lleva `q`/`estadoFiltro`/`origenFiltro` en las dependencias. `verAnuladas` es la excepción: ese
 * filtro SÍ va en el servidor (es el que decide si las anuladas ni siquiera viajan), así que necesita
 * volver a pedir los datos cuando cambia.
 */
export function RemisionesPage({ onSelectTicket, isAdmin }: { onClose: () => void; onSelectTicket: (id: string) => void; isAdmin: boolean }) {
  const [verAnuladas, setVerAnuladas] = useState(false)
  const { data, loading, error, reload } = useAsync<RemisionListado[]>(() => fetchRemisionesListado(verAnuladas), [verAnuladas])
  const [q, setQ] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('todos')
  const [origenFiltro, setOrigenFiltro] = useState('todos')
  // Rango de fechas, ambos extremos incluidos y ambos opcionales: solo "Desde" es "de ahí en
  // adelante", solo "Hasta" es "hasta ese día". Vacío = sin límite por ese lado.
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [accionandoId, setAccionandoId] = useState<string | null>(null)
  const [accionError, setAccionError] = useState<string | null>(null)

  // "Anuladas" solo aparece como opción de filtro con el interruptor activo: es el caso de uso
  // real (se activa "Ver anuladas" precisamente para buscarlas, no para verlas mezcladas), y sin
  // el interruptor el filtro quedaría siempre vacío porque el servidor ni las manda.
  const estadoFiltros = verAnuladas ? [...ESTADO_FILTROS, FILTRO_ANULADA] : ESTADO_FILTROS

  function alternarVerAnuladas(v: boolean) {
    setVerAnuladas(v)
    if (!v && estadoFiltro === 'anulada') setEstadoFiltro('todos') // si no, el filtro queda inservible y nadie ve por qué la tabla está vacía
  }

  const filas = useMemo(() => {
    const ql = q.trim().toLowerCase()
    return (data ?? []).filter((r) => {
      // Se comparan las cadenas tal cual, sin `new Date`: `r.fecha` y lo que da un `input[type=date]`
      // son los dos "AAAA-MM-DD", y en ese formato el orden alfabético ES el cronológico. Convertir
      // a Date solo abriría la puerta al corrimiento de un día por zona horaria que `fmtFecha` ya
      // esquiva.
      if (desde && r.fecha < desde) return false
      if (hasta && r.fecha > hasta) return false
      if (origenFiltro !== 'todos' && r.origen !== origenFiltro) return false
      if (estadoFiltro !== 'todos' && estadoVisual(r).key !== estadoFiltro) return false
      if (!ql) return true
      return [r.empresa, r.serial, r.tecnico, r.ticketNumero, r.observaciones].some((v) => (v ?? '').toLowerCase().includes(ql))
    })
  }, [data, q, estadoFiltro, origenFiltro, desde, hasta])

  // Confirmación previa porque a ojos de quien usa la app es destructiva —desaparece de la
  // pantalla—, aunque por dentro sea reversible; el aviso de Drive evita que alguien crea que
  // también se limpia el documento allá.
  async function anular(r: RemisionListado) {
    if (!confirm('¿Anular esta remisión? Se ocultará del listado y podrás restaurarla con "Ver anuladas". El documento y el PDF seguirán existiendo en Drive: eso no se puede deshacer desde aquí.')) return
    setAccionandoId(r.id); setAccionError(null)
    try { await anularRemision(r.id); reload() }
    catch (e) { setAccionError(e instanceof Error ? e.message : String(e)) }
    finally { setAccionandoId(null) }
  }

  async function restaurar(r: RemisionListado) {
    setAccionandoId(r.id); setAccionError(null)
    try { await restaurarRemision(r.id); reload() }
    catch (e) { setAccionError(e instanceof Error ? e.message : String(e)) }
    finally { setAccionandoId(null) }
  }

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
          {estadoFiltros.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <select value={origenFiltro} onChange={(e) => setOrigenFiltro(e.target.value)} className="border border-slate-200 rounded px-2 py-1.5 text-[13px] text-slate-600">
          {ORIGEN_FILTROS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        {/* `max`/`min` cruzados impiden componer un rango invertido, que solo sabría dar una tabla
            vacía sin explicar por qué. */}
        <label className="flex items-center gap-1.5 text-[13px] text-slate-600 whitespace-nowrap">
          Desde
          <input
            type="date" value={desde} max={hasta || undefined}
            onChange={(e) => setDesde(e.target.value)}
            className="border border-slate-200 rounded px-2 py-1.5 text-[13px] text-slate-600"
          />
        </label>
        <label className="flex items-center gap-1.5 text-[13px] text-slate-600 whitespace-nowrap">
          Hasta
          <input
            type="date" value={hasta} min={desde || undefined}
            onChange={(e) => setHasta(e.target.value)}
            className="border border-slate-200 rounded px-2 py-1.5 text-[13px] text-slate-600"
          />
        </label>
        {/* Solo cuando hay algo que limpiar: vaciar un `input[type=date]` a mano es incómodo, y un
            rango olvidado se lee como "no hay remisiones" en vez de "las escondiste tú". */}
        {(desde || hasta) && (
          <button onClick={() => { setDesde(''); setHasta('') }} className="text-[12px] text-[#2C7BE5] hover:underline">
            Limpiar fechas
          </button>
        )}
        {isAdmin && (
          <label className="flex items-center gap-1.5 text-[13px] text-slate-600 select-none">
            <input type="checkbox" className="accent-blue-600" checked={verAnuladas} onChange={(e) => alternarVerAnuladas(e.target.checked)} />
            Ver anuladas
          </label>
        )}
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
      {accionError && <div className="p-2 px-4 text-[12px] text-red-600 bg-red-50 border-b border-red-100">{accionError}</div>}
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
                {isAdmin && <th className="px-3 py-2 font-semibold whitespace-nowrap">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filas.map((r) => {
                const badge = estadoVisual(r)
                const incluye = r.incluye.join(', ')
                const hora = horaVisible(r)
                const anulando = accionandoId === r.id
                return (
                  <tr key={r.id} className={`border-b border-slate-100 hover:bg-slate-50 ${r.anuladaAt ? 'opacity-60' : ''}`}>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{r.tecnico}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                      {fmtFecha(r.fecha)}
                      {hora && <span className="text-slate-400"> · {hora}</span>}
                    </td>
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
                      {/* Quién y cuándo, solo cuando está anulada: es lo que hace la reversibilidad
                          algo más que teórico —sin saber quién, nadie se atreve a restaurar. */}
                      {r.anuladaAt && (
                        <div className="text-[10px] text-slate-400 whitespace-nowrap mt-0.5">
                          {r.anuladaPor ? `${r.anuladaPor} · ` : ''}{fmtFecha(r.anuladaAt)}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`text-[11px] px-2 py-0.5 rounded border font-bold ${r.origen === 'historico' ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                        {origenLabel(r.origen)}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-3 py-2 whitespace-nowrap">
                        {r.anuladaAt ? (
                          <button onClick={() => restaurar(r)} disabled={anulando} className="text-[12px] text-[#2C7BE5] hover:underline disabled:opacity-40">
                            {anulando ? 'Restaurando…' : 'Restaurar'}
                          </button>
                        ) : (
                          <button onClick={() => anular(r)} disabled={anulando} className="text-[12px] text-red-600 hover:underline disabled:opacity-40">
                            {anulando ? 'Anulando…' : 'Anular'}
                          </button>
                        )}
                      </td>
                    )}
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
