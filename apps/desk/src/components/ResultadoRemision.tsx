import { useEffect, useRef, useState } from 'react'
import { ESPERA_DESENLACE_SEGUNDOS } from '@ambientalia/shared'
import { fetchRemision, enviarRemision, type RemisionConFotos } from '../api/client'
import { pasos, urlSegura } from '../lib/remisionResultado'

const INTERVALO_MS = 2000

/**
 * Desenlace de una remisión recién enviada.
 *
 * El resultado real lo escribe n8n por el callback, decenas de segundos después de que el técnico
 * termine, así que esta pantalla sondea `GET /api/remisiones/:id` en vez de esperar a la respuesta
 * del envío. El estado ya está guardado en Postgres: cerrar el panel no pierde nada, y por eso el
 * sondeo se corta al desmontar.
 *
 * `errorEnvio` es el fallo del disparo inicial, si lo hubo. En ese caso no se sondea nada —el
 * desenlace no va a llegar— y se ofrece reintentar de inmediato en vez de esperar el minuto.
 */
export function ResultadoRemision({ remisionId, errorEnvio, onCerrar }: {
  remisionId: string
  errorEnvio?: string | null
  onCerrar: () => void
}) {
  const [rem, setRem] = useState<RemisionConFotos | null>(null)
  const [nota, setNota] = useState<string | null>(errorEnvio ?? null)
  const [envioFallido, setEnvioFallido] = useState(!!errorEnvio)
  const [agotado, setAgotado] = useState(false)
  const [reintentando, setReintentando] = useState(false)
  const [intento, setIntento] = useState(0)
  const desde = useRef(Date.now())

  useEffect(() => {
    if (envioFallido) return
    let vivo = true
    let temporizador: ReturnType<typeof setTimeout> | undefined
    async function mirar() {
      try {
        const r = await fetchRemision(remisionId)
        if (!vivo) return
        setRem(r)
        setNota(null) // una lectura buena borra el aviso que dejó la anterior
        if (r.estado !== 'pendiente') return // ya hay desenlace: se deja de sondear
      } catch (e) {
        if (!vivo) return
        // Un fallo de red aquí es casi siempre pasajero —el técnico está en campo, con cobertura
        // irregular— y no dice nada sobre cómo fue la remisión. Se avisa, pero se sigue sondeando:
        // rendirse a la primera dejaría la pantalla diciendo "generando" para siempre, sin desenlace
        // y sin botón de reintentar, que es la única salida que le queda al técnico.
        setNota(e instanceof Error ? e.message : String(e))
      }
      // Fuera del try a propósito: el tiempo corre igual haya habido lectura buena o tropiezo, y es
      // lo único que decide cuándo dejar de esperar.
      if (Date.now() - desde.current >= ESPERA_DESENLACE_SEGUNDOS * 1000) { setAgotado(true); return }
      temporizador = setTimeout(mirar, INTERVALO_MS)
    }
    void mirar()
    return () => { vivo = false; if (temporizador) clearTimeout(temporizador) }
  }, [remisionId, intento, envioFallido])

  async function reintentar() {
    setReintentando(true); setNota(null); setAgotado(false)
    try {
      await enviarRemision(remisionId)
    } catch (e) {
      // Que el reenvío falle no significa que no haya nada en marcha: el servidor responde 409
      // cuando el envío anterior sigue vivo. Se enseña el motivo, pero se vuelve a sondear igual
      // porque el desenlace puede llegar de todos modos.
      setNota(e instanceof Error ? e.message : String(e))
    } finally {
      setReintentando(false)
      desde.current = Date.now()
      setEnvioFallido(false)
      setIntento((n) => n + 1) // relanza el efecto y con él el sondeo
    }
  }

  const resultado = rem?.resultado ?? null
  const esperando = !envioFallido && !agotado && (!rem || rem.estado === 'pendiente')
  const puedeReintentar = envioFallido || agotado || rem?.estado === 'error'

  const urlCarpeta = urlSegura(resultado?.carpetaUrl)
  const carpeta = urlCarpeta ? (
    <a className="text-[#2C7BE5] underline" href={urlCarpeta} target="_blank" rel="noreferrer">
      Abrir la carpeta en Drive
    </a>
  ) : null

  return (
    <div className="fixed inset-0 z-[85] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-5 w-[560px] max-h-[90vh] overflow-auto flex flex-col gap-3">
        <h3 className="text-[15px] font-bold text-slate-800">Remisión de entrada</h3>

        {esperando && <div className="text-[13px] text-slate-500">Generando la remisión…</div>}

        {nota && <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded p-2">{nota}</div>}

        {agotado && (
          <div className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
            n8n no ha respondido todavía. La remisión está guardada, así que puedes reintentar el envío
            ahora o cerrar y revisarla más tarde.
          </div>
        )}

        {rem?.estado === 'ok' && (
          <div className="text-[13px] text-slate-700 flex flex-col gap-1">
            <span>Remisión creada.</span>
            {carpeta}
          </div>
        )}

        {rem?.estado === 'ok_con_avisos' && (
          <div className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2 flex flex-col gap-1">
            <span className="font-bold">Remisión creada, con avisos</span>
            <ul className="list-disc ml-4">
              {pasos(resultado?.avisos).map((a, i) => (
                <li key={i}>No se pudo completar {a.paso}.{a.mensaje && <span className="opacity-70"> {a.mensaje}</span>}</li>
              ))}
            </ul>
            <span>El documento sí se generó; solo falló el aviso.</span>
            {carpeta}
          </div>
        )}

        {rem?.estado === 'error' && (
          <div className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded p-2 flex flex-col gap-1">
            <span className="font-bold">No se pudo generar la remisión</span>
            <ul className="list-disc ml-4">
              {/* El mensaje viene de n8n y suele ser tecnico y en ingles. Se enseña igual, atenuado: sin el,
                  "falló el registro fotográfico" no distingue que no subiera ninguna foto de que fallara
                  una de tres, y esa diferencia es la que decide si hay que rehacer la remisión. */}
              {pasos(resultado?.fallos).map((f, i) => (
                <li key={i}>Falló {f.paso}.{f.mensaje && <span className="opacity-70"> {f.mensaje}</span>}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end items-center gap-2">
          {puedeReintentar && (
            <button type="button" onClick={reintentar} disabled={reintentando}
              className="px-3 py-1.5 text-[13px] text-slate-600 disabled:opacity-50">
              {reintentando ? 'Reenviando…' : 'Reintentar'}
            </button>
          )}
          <button type="button" onClick={onCerrar}
            className="px-4 py-1.5 bg-[#2C7BE5] text-white rounded text-[13px] font-bold">Cerrar</button>
        </div>
      </div>
    </div>
  )
}
