import type { RemisionConFotos } from '../api/client'
import { pasos, urlSegura, ESTADO_REMISION, ESTADO_REMISION_DESCONOCIDA } from '../lib/remisionResultado'

/** Formatea "2026-05-19" a "19 may 2026" (es-CO), evitando el corrimiento de un día por zona horaria. */
function fmtFecha(v: string): string {
  const d = new Date(v.length === 10 ? `${v}T00:00:00` : v)
  if (Number.isNaN(d.getTime())) return v
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
}

// `ok` de una remisión histórica no pasó por el flujo de n8n —nunca hubo flujo que evaluar—, así que
// no lleva el mismo distintivo que una remisión creada por la app. Por eso el histórico tiene su
// propia marca ("Importada del histórico") y no entra en `ESTADO_REMISION` (compartido con
// `RemisionesPage`, ver `lib/remisionResultado.ts`).

function Tarjeta({ r }: { r: RemisionConFotos }) {
  const historica = r.origen === 'historico'
  // `resultado` es null en el histórico —nunca pasó por n8n— así que `pasos()`/`urlSegura()` devuelven
  // vacío/null por sí solos; no hace falta un `if (historica)` aparte para no pintar esas secciones.
  const avisos = pasos(r.resultado?.avisos)
  const fallos = pasos(r.resultado?.fallos)
  const urlCarpeta = urlSegura(r.resultado?.carpetaUrl)
  const badge = ESTADO_REMISION[r.estado] ?? ESTADO_REMISION_DESCONOCIDA

  return (
    <div className="border border-slate-200 rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[13px] font-bold text-slate-800">{fmtFecha(r.fecha)} · {r.tipoServicio ?? 'Sin tipo de servicio'}</div>
          <div className="text-[11px] text-slate-400">{r.creadoPor ? `Creada por ${r.creadoPor}` : 'Sin autor registrado'}</div>
        </div>
        {historica ? (
          <span className="text-[11px] px-2 py-0.5 rounded border font-bold shrink-0 bg-slate-50 text-slate-500 border-slate-200">
            Importada del histórico
          </span>
        ) : (
          <span className={`text-[11px] px-2 py-0.5 rounded border font-bold shrink-0 ${badge.className}`}>
            {badge.label}
          </span>
        )}
      </div>

      {/* Sin ticket, la empresa es el único dato que dice de quién era el equipo: por eso se destaca
          aquí solo para el histórico, que es donde hace falta (las de la app ya están en un ticket). */}
      {historica && r.empresa && (
        <div className="text-[12px] text-slate-500">Empresa: <span className="font-medium text-slate-700">{r.empresa}</span></div>
      )}

      {(r.estado === 'ok_con_avisos' || r.estado === 'error') && (avisos.length > 0 || fallos.length > 0) && (
        <ul className={`list-disc ml-4 text-[12px] ${r.estado === 'error' ? 'text-red-600' : 'text-amber-800'}`}>
          {(r.estado === 'error' ? fallos : avisos).map((p, i) => (
            <li key={i}>{p.paso}{p.mensaje && <span className="opacity-70"> — {p.mensaje}</span>}</li>
          ))}
        </ul>
      )}

      <div className="text-[12px] text-slate-600">Equipo: <span className="font-medium">{r.serial ?? '—'}</span></div>

      <div className="text-[12px] text-slate-600">
        Incluye: {r.incluye.length > 0 ? r.incluye.join(', ') : <span className="text-slate-400">Sin ítems</span>}
      </div>

      {r.observaciones && <div className="text-[12px] text-slate-600">Observaciones: {r.observaciones}</div>}

      {urlCarpeta && (
        <a className="text-[12px] text-[#2C7BE5] underline w-fit" href={urlCarpeta} target="_blank" rel="noreferrer">
          Abrir la carpeta en Drive
        </a>
      )}

      {r.fotos.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {r.fotos.map((f) => (
            <a key={f.id} href={`/api/remisiones/${r.id}/fotos/${f.id}`} target="_blank" rel="noreferrer">
              <img
                src={`/api/remisiones/${r.id}/fotos/${f.id}`}
                alt={f.filename}
                className="h-16 w-16 object-cover rounded border border-slate-200"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Remisiones de entrada del ticket, la más reciente primero (el orden ya lo trae el servidor).
 *
 * Recibe los datos por prop en vez de pedirlos aquí —al estilo de `ActividadesPanel`— porque
 * `TicketDetailView` ya los pide para el contador de la pestaña: volver a pedirlos aquí sería la
 * misma petición dos veces. `loading`/`error` también llegan del padre para que este panel siga
 * mostrando sus propios estados de carga y de fallo sin gestionar su propio `useAsync`.
 */
export function PanelRemisiones({ items, loading, error }: {
  items: RemisionConFotos[] | null
  loading: boolean
  error: string | null
}) {
  if (loading && !items) return <div className="p-4 text-[13px] text-slate-400">Cargando…</div>
  if (error) return <div className="p-4 text-[13px] text-red-600">No se pudieron cargar las remisiones: {error}</div>

  const lista = items ?? []
  if (lista.length === 0) return <div className="p-4 text-[13px] text-slate-400">Este ticket no tiene remisiones registradas.</div>

  return (
    <div className="p-4 flex flex-col gap-3 max-w-[820px]">
      {lista.map((r) => <Tarjeta key={r.id} r={r} />)}
    </div>
  )
}
