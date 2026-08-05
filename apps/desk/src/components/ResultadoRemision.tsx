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
 * `errorEnvio` es lo que dijo el disparo inicial si no salió. Adelanta el botón de reintentar, pero
 * NO corta el sondeo: el motivo más común es el 409 del cerrojo de reenvío, que significa justo lo
 * contrario —hay un envío vivo y su desenlace va a llegar—. Darlo por muerto pintaba de rojo un envío
 * que iba bien, y la reacción natural del técnico ante ese rojo es crear otra remisión.
 */
export function ResultadoRemision({ remisionId, errorEnvio, onCerrar }: {
  remisionId: string
  errorEnvio?: string | null
  onCerrar: () => void
}) {
  const [rem, setRem] = useState<RemisionConFotos | null>(null)
  // Aviso pasajero del sondeo (un tropiezo de red al leer, o lo que contestó un reenvío). Se borra en
  // cuanto una lectura sale bien: no dice nada sobre cómo fue la remisión.
  const [nota, setNota] = useState<string | null>(null)
  // Lo que contestó el disparo cuando no confirmó. Separado de `nota` porque no es pasajero: mientras
  // no haya desenlace sigue siendo la única explicación de por qué esto no avanza.
  const [falloDisparo, setFalloDisparo] = useState<string | null>(errorEnvio ?? null)
  const [agotado, setAgotado] = useState(false)
  const [reintentando, setReintentando] = useState(false)
  const [intento, setIntento] = useState(0)
  const desde = useRef(Date.now())

  useEffect(() => {
    let vivo = true
    let temporizador: ReturnType<typeof setTimeout> | undefined
    async function mirar() {
      try {
        const r = await fetchRemision(remisionId)
        if (!vivo) return
        setRem(r)
        setNota(null) // una lectura buena borra el aviso que dejó la anterior
        if (r.estado !== 'pendiente') {
          // Hay desenlace: se deja de sondear. Y sea cual sea, manda sobre lo que dijo el disparo —si
          // el flujo llegó a arrancar, aquel mensaje describía como fallo algo que sí salió—, así que
          // se retira para no enseñar dos veredictos a la vez.
          setFalloDisparo(null)
          return
        }
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
  }, [remisionId, intento])

  async function reintentar() {
    // Lo que dijo el disparo anterior queda superado por este intento; si este tampoco confirma, el
    // motivo nuevo lo pone el `catch`.
    setReintentando(true); setNota(null); setAgotado(false); setFalloDisparo(null)
    try {
      await enviarRemision(remisionId)
    } catch (e) {
      // Que el reenvío falle no significa que no haya nada en marcha: el servidor responde 409
      // cuando el envío anterior sigue vivo. Va a `falloDisparo` y no a `nota` por eso mismo —es la
      // misma situación que un `errorEnvio` de entrada, y aquí `nota` la borraría la primera lectura
      // buena, dos segundos después—, y se vuelve a sondear igual: el desenlace puede llegar.
      setFalloDisparo(e instanceof Error ? e.message : String(e))
    } finally {
      setReintentando(false)
      desde.current = Date.now()
      setIntento((n) => n + 1) // relanza el efecto y con él el sondeo
    }
  }

  const resultado = rem?.resultado ?? null
  const esperando = !agotado && (!rem || rem.estado === 'pendiente')
  const puedeReintentar = !!falloDisparo || agotado || rem?.estado === 'error'

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

        {esperando && (
          <div className="text-[13px] text-slate-500">
            {/* Con el disparo sin confirmar no se puede prometer que se esté generando nada: puede que
                sí (409 del cerrojo) o que no (n8n caído). Decir qué se está haciendo es lo único
                cierto, y explica por qué la pantalla sigue mirando pese al aviso de abajo. */}
            {falloDisparo ? 'Comprobando si la remisión llegó a generarse…' : 'Generando la remisión…'}
          </div>
        )}

        {/* Ámbar y no rojo: que el disparo no confirmara no es un veredicto sobre la remisión. El rojo
            queda para el `error` que informa n8n, que sí lo es. */}
        {falloDisparo && (
          <div className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2 flex flex-col gap-1">
            <span>No se pudo confirmar el envío: {falloDisparo}</span>
            <span>La remisión está guardada y se sigue comprobando por si el envío sí llegó a salir. También puedes reintentar ahora.</span>
          </div>
        )}

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
