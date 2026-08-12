import type { AppConfig } from '@ambientalia/zoho-sync/config'

/** Un aviso ya persistido, listo para salir por correo. */
export interface AvisoParaEnviar {
  id: string
  email: string
  nombre: string
  texto: string
  ticketNumero: number
  /**
   * Si además hay que mandarle una copia a `avisosCopiaEmail`. Se marca aviso por aviso y no se copia
   * todo: los avisos de ÁREA ya le llegan al administrador como destinatario de pleno derecho
   * (`destinatariosDeArea` mete a todos los administradores activos), así que copiarlos también le
   * mandaría el mismo texto tantas veces como personas tuviera el área.
   */
  conCopia?: boolean
}

/**
 * La copia de verificación de un aviso: el mismo correo, dirigido al administrador.
 *
 * NO hereda el `id` del aviso original, y eso importa: quien llama sella con `marcarEnviados` los ids
 * que mandó, así que un id compartido dejaría marcado como enviado un aviso cuyo destinatario real
 * pudo no recibirlo. La copia no es una fila de `avisos`, es un correo de más.
 *
 * El texto dice a quién iba dirigido el original, porque si no es indistinguible de un aviso propio y
 * no sirve para verificar nada.
 */
function copiaDe(a: AvisoParaEnviar, email: string, url: string) {
  return {
    id: `${a.id}-copia`,
    email,
    nombre: 'Administrador',
    asunto: `[Copia] Ticket #${a.ticketNumero} · Desk Ambientalia`,
    texto: `Copia de verificación · dirigido a ${a.nombre} <${a.email}>: ${a.texto}`,
    url,
  }
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
  const items = avisos.map((a) => ({
    id: a.id,
    email: a.email,
    nombre: a.nombre,
    asunto: `Ticket #${a.ticketNumero} · Desk Ambientalia`,
    texto: a.texto,
    url: config.appBaseUrl,
  }))
  // Las copias van DETRÁS y como items normales: para n8n son correos más, así que el flujo no se
  // entera de que existen. Se salta al propio destinatario —el mismo correo dos veces no verifica
  // nada— comparando en minúsculas, que es como se guarda el correo en el alta.
  const copia = config.avisosCopiaEmail.trim().toLowerCase()
  if (copia) {
    for (const a of avisos) {
      if (a.conCopia && a.email.trim().toLowerCase() !== copia) items.push(copiaDe(a, copia, config.appBaseUrl))
    }
  }
  const payload = { avisos: items }
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
