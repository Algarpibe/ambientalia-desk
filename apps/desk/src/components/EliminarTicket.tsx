import { useEffect, useState } from 'react'
import type { ResumenEliminacion } from '@ambientalia/shared'
import { previsualizarEliminarTicket, eliminarTicket } from '../api/client'
import { hayRastroEnDrive, resumenEnTexto } from '../lib/eliminarTicket'

/**
 * Ventana de borrado en dos pasos: primero se pregunta al servidor qué se iría, se enseña, y solo
 * entonces aparece el botón de confirmar.
 *
 * El paso previo no es cortesía: la aplicación **no puede borrar en Google Drive** —no tiene
 * credenciales— así que los documentos de las remisiones sobreviven al ticket, y esta lista es lo
 * único que permite encontrarlos después. Ya se perdieron cuatro carpetas por borrar sin mirarla.
 */
export function EliminarTicket(
  { ticketId, onCancelar, onBorrado }: { ticketId: string; onCancelar: () => void; onBorrado: () => void },
) {
  const [resumen, setResumen] = useState<ResumenEliminacion | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    let vivo = true
    previsualizarEliminarTicket(ticketId)
      .then((r) => { if (vivo) setResumen(r) })
      .catch((e) => { if (vivo) setError(e instanceof Error ? e.message : String(e)) })
    return () => { vivo = false }
  }, [ticketId])

  async function confirmar() {
    setBusy(true); setError(null)
    try {
      // Se pinta el resumen que devuelve la CONFIRMACIÓN y no el del simulacro: entre los dos pasos
      // alguien pudo crear una remisión, y lo que importa enseñar es lo que de verdad se fue.
      setResumen(await eliminarTicket(ticketId))
      onBorrado()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setBusy(false)
    }
  }

  const campo = 'text-[12px] text-slate-600'
  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-5 w-[560px] max-h-[85vh] overflow-y-auto flex flex-col gap-3">
        <h3 className="text-[15px] font-bold text-slate-800">
          {resumen ? `Eliminar ticket #${resumen.ticket.numero}` : 'Eliminar ticket'}
        </h3>

        {error && <div className="text-[12px] text-red-700 bg-red-50 border border-red-100 rounded p-2">{error}</div>}
        {!resumen && !error && <p className={campo}>Comprobando qué se borraría…</p>}

        {resumen && (
          <>
            <p className={campo}>
              <strong>{resumen.ticket.asunto || '(sin asunto)'}</strong> · {resumen.ticket.estado}
            </p>
            <div className="border border-slate-200 rounded">
              {/* Se listan TODAS, también las que van a cero: el cero es la prueba de que se miró esa
                  tabla. Sin claves foráneas, lo que no se barre queda huérfano en silencio. */}
              {resumen.filas.map((f) => (
                <div key={f.tabla} className="flex justify-between px-2 py-1 text-[12px] border-b border-slate-100 last:border-0">
                  <span className={f.borradas > 0 ? 'text-slate-700' : 'text-slate-400'}>{f.etiqueta}</span>
                  <span className={f.borradas > 0 ? 'font-bold text-slate-800' : 'text-slate-400'}>{f.borradas}</span>
                </div>
              ))}
            </div>

            {hayRastroEnDrive(resumen) && (
              <div className="border border-amber-200 bg-amber-50 rounded p-2">
                <p className="text-[12px] font-bold text-amber-900 mb-1">
                  Esto queda en Google Drive y la aplicación no puede borrarlo
                </p>
                <p className="text-[11px] text-amber-800 mb-2">
                  Al borrar la remisión se pierde el único enlace a estos documentos. Guárdalos antes de continuar.
                </p>
                {resumen.drive.map((d) => (
                  <div key={d.remisionId} className="mb-1.5 last:mb-0">
                    <div className="text-[11px] font-medium text-amber-900">{d.etiqueta}</div>
                    {([['Carpeta', d.carpetaUrl], ['Documento', d.documentoUrl], ['PDF', d.pdfUrl], ['Etiqueta', d.dymoUrl]] as Array<[string, string | null]>)
                      .filter(([, url]) => url)
                      .map(([nombre, url]) => (
                        <a key={nombre} href={url!} target="_blank" rel="noopener noreferrer"
                          className="block text-[11px] text-blue-700 hover:underline truncate">{nombre}: {url}</a>
                      ))}
                  </div>
                ))}
                <button
                  onClick={() => { navigator.clipboard?.writeText(resumenEnTexto(resumen)).then(() => setCopiado(true)).catch(() => {}) }}
                  className="mt-1 text-[11px] text-blue-700 hover:underline">
                  {copiado ? 'Copiado' : 'Copiar el resumen con los enlaces'}
                </button>
              </div>
            )}

            {resumen.remisionesSinRastro > 0 && (
              <p className="text-[11px] text-slate-400">
                {resumen.remisionesSinRastro} remisión(es) sin documentos en Drive: no hay nada que rescatar en ellas.
              </p>
            )}
            {resumen.actividadesQueQuedan > 0 && (
              <p className="text-[11px] text-amber-700">
                {resumen.actividadesQueQuedan} actividad(es) de Zoho quedarán apuntando a este ticket: están replicadas
                del hub y no se pueden borrar desde aquí.
              </p>
            )}
            <p className="text-[12px] text-slate-500">Son {resumen.total} filas en total. No se puede deshacer.</p>
          </>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onCancelar} className="px-3 py-1.5 text-[13px] text-slate-600">Cancelar</button>
          <button onClick={confirmar} disabled={!resumen || busy}
            className="px-4 py-1.5 bg-red-600 text-white rounded text-[13px] font-bold disabled:opacity-50">
            {busy ? 'Eliminando…' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}
