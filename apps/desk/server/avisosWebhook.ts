import type { AppConfig } from '@ambientalia/zoho-sync/config'

/** Un aviso ya persistido, listo para salir por correo. */
export interface AvisoParaEnviar {
  id: string
  email: string
  nombre: string
  texto: string
  ticketNumero: number
}

/**
 * Manda los avisos a n8n, que los reparte por correo.
 *
 * Calcado de `dispararRemision`, con las mismas tres reglas: `fetch` inyectable para los tests, config
 * vacía = no-op explícito con motivo, y **nunca lanza** — devuelve el motivo. Quien lo llama está justo
 * detrás de una transición ya escrita, y un problema de red no puede deshacerla.
 *
 * El asunto y el enlace se arman AQUÍ y no en n8n: el flujo debe ser tonto (recibir y enviar), para que
 * cambiar la redacción sea un cambio de código con test y no una edición a mano en una interfaz web.
 *
 * `AbortSignal.timeout` acota la espera: sin él, un n8n colgado colgaría la respuesta de la transición,
 * que es una acción de una persona esperando delante de la pantalla.
 */
export async function dispararAvisos(
  config: AppConfig,
  avisos: AvisoParaEnviar[],
  fetchImpl: typeof fetch = fetch,
): Promise<{ disparado: boolean; motivo?: string }> {
  if (!config.avisosWebhookUrl) return { disparado: false, motivo: 'N8N_AVISOS_WEBHOOK_URL sin configurar' }
  if (avisos.length === 0) return { disparado: false, motivo: 'sin avisos que mandar' }
  const payload = {
    avisos: avisos.map((a) => ({
      id: a.id,
      email: a.email,
      nombre: a.nombre,
      asunto: `Ticket #${a.ticketNumero} · Desk Ambientalia`,
      texto: a.texto,
      url: config.appBaseUrl,
    })),
  }
  let res: Response
  try {
    res = await fetchImpl(config.avisosWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Avisos-Token': config.avisosWebhookToken },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    })
  } catch (e) {
    // El `fetch` de Node casi siempre rechaza con "fetch failed" y guarda el detalle real en `cause`.
    const mensaje = e instanceof Error ? e.message : String(e)
    const causa = e instanceof Error && e.cause ? `: ${e.cause instanceof Error ? e.cause.message : String(e.cause)}` : ''
    return { disparado: false, motivo: `no se pudo contactar con n8n: ${mensaje}${causa}` }
  }
  if (!res.ok) {
    const detalle = await res.text().catch(() => '')
    return { disparado: false, motivo: `n8n respondió ${res.status}: ${detalle.slice(0, 200)}` }
  }
  return { disparado: true }
}
