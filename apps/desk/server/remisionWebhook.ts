import type { AppConfig } from '@ambientalia/zoho-sync/config'
import type { Remision, ClientLite, EquipoFull, UserPublic } from '@ambientalia/shared'

/** Cuerpo que espera el nodo `Validar payload` del flujo `Remisiones_ST_3.13_Desk`. */
export interface RemisionWebhookPayload {
  remisionId: string
  ticketNumero: string
  fecha: string
  tipoServicio: string | null
  observaciones: string | null
  incluye: string[]
  tecnico: { nombre: string; cargo: string | null; correo: string }
  cliente: {
    nombre: string; empresa: string | null; personaContacto: string | null
    direccion: string | null; telefono: string | null; nit: string | null; email: string | null
  }
  equipo: { serial: string; marca: string | null; modelo: string | null; tipo: string | null }
  /**
   * Fotos en base64. El nodo `Code fotos Entrada` del flujo las busca por una clave cuyo nombre
   * normalizado contenga "fotos" y acepta objetos `{data|base64|dataUrl, mimeType, fileName}`,
   * así que este es el formato que ya entiende sin tocarlo — y ese nodo es el más delicado del flujo.
   */
  fotos: Array<{ fileName: string; mimeType: string; data: string }>
}

/**
 * Arma el cuerpo del webhook. Los nombres de los campos son un CONTRATO con el flujo: `Validar payload`
 * exige remisionId, ticketNumero, fecha, cliente, tecnico, equipo.serial e incluye, y devuelve 400
 * enumerando los que falten.
 */
export function buildRemisionPayload(input: {
  remision: Remision
  ticketNumero: string
  cliente: ClientLite | null
  equipo: EquipoFull | null
  usuario: Pick<UserPublic, 'name' | 'email' | 'cargo'>
  fotos?: Array<{ fileName: string; mimeType: string; data: string }>
}): RemisionWebhookPayload {
  const { remision: r, cliente: c, equipo: e, usuario: u } = input
  return {
    remisionId: r.id,
    ticketNumero: input.ticketNumero,
    fecha: r.fecha,
    tipoServicio: r.tipoServicio,
    observaciones: r.observaciones,
    incluye: r.incluye,
    tecnico: { nombre: u.name, cargo: u.cargo ?? null, correo: u.email },
    cliente: {
      nombre: c?.name ?? '', empresa: c?.companyName ?? null, personaContacto: c?.personaContacto ?? null,
      direccion: c?.direccion ?? null, telefono: c?.telefono ?? null, nit: c?.nit ?? null, email: c?.email ?? null,
    },
    equipo: {
      serial: e?.serial ?? r.serial ?? '',
      marca: e?.marca ?? null, modelo: e?.modelo ?? null, tipo: e?.tipo ?? null,
    },
    fotos: input.fotos ?? [],
  }
}

/**
 * Dispara el webhook. **No espera al trabajo**: n8n responde 202 en cuanto valida, y el resultado real
 * llega después por el callback. Devuelve si la llamada fue aceptada, para poder registrarlo.
 *
 * Sin `remisionWebhookUrl` configurada no hace nada y lo dice: la remisión se queda en `pendiente`,
 * que es un estado legítimo y visible, no un fallo silencioso.
 */
export async function dispararRemision(
  config: AppConfig,
  payload: RemisionWebhookPayload,
  fetchImpl: typeof fetch = fetch,
): Promise<{ disparado: boolean; motivo?: string }> {
  if (!config.remisionWebhookUrl) return { disparado: false, motivo: 'N8N_REMISION_WEBHOOK_URL sin configurar' }
  const res = await fetchImpl(config.remisionWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Remision-Token': config.remisionWebhookToken },
    body: JSON.stringify(payload),
  })
  if (!res.ok) return { disparado: false, motivo: `n8n respondió ${res.status}: ${(await res.text()).slice(0, 200)}` }
  return { disparado: true }
}
