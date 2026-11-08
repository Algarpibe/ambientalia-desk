import { leerConversaciones, PAUSA_429_MS, REINTENTOS_429 } from '@ambientalia/zoho-sync/conversaciones'

/**
 * verificacion-completitud (1G-03, D5, D6, RQ-ZS-37) · lectores de Zoho de sólo lectura. NUNCA lanzan (molde `conversaciones.ts:67-93`).
 * Por respuesta, cada guarda va en SU línea y en este orden: `429` (espera y repite la MISMA petición hasta `REINTENTOS_429`; agotados, `corte`),
 * `404` (`noEsta` por id; error en una lista) y `!res.ok`, que incluye a los otros dos y por eso va el último. Se llama a `zohoFetch(ruta)` sin `init`.
 * Los motivos son de un conjunto cerrado y nunca llevan `e.message`: el de `JSON.parse` cita el cuerpo, y `leerConversaciones` mete el mensaje en su error.
 */
type ZohoFetch = (path: string, init?: RequestInit) => Promise<Response>
export type Registro = Record<string, unknown>
export type ResultadoLista = { estado: 'ok'; items: Registro[] } | { estado: 'error'; motivo: string } | { estado: 'corte' }
export type ResultadoPorId = { estado: 'vivo'; dato: Registro } | { estado: 'noEsta' } | { estado: 'error'; motivo: string } | { estado: 'corte' }
export interface OpcionesLector { pausa429Ms?: number }
/** `clave` da el id con que se deduplica un ítem (`null` ⇒ motivo `forma`); por omisión, su `id`. La historia no lo trae: se pasa `eventId`. */
export interface OpcionesLista extends OpcionesLector { clave?: (item: Registro) => string | null }

/** Tope de páginas por lista (molde `TOPE_PAGINAS_CONVERSACIONES`). */
export const TOPE_PAGINAS = 200
const RECURSOS = new Set(['tickets', 'archivedTickets', 'contacts', 'accounts', 'attachments', 'History', 'conversations'])
/** El nombre del recurso sale de la ruta SÓLO con segmentos de un conjunto cerrado: un id nunca entra en un motivo. */
const nombreRecurso = (ruta: string): string => ruta.split('?')[0].split('/').filter((s) => RECURSOS.has(s)).join('/') || 'recurso'
const dormir = (ms: number) => (ms > 0 ? new Promise<void>((r) => setTimeout(r, ms)) : Promise.resolve())
const claveId = (item: Registro): string | null => (item && item.id !== undefined && item.id !== null ? String(item.id) : null)

/** Un cuerpo vacío es `{}`; lo que no es un objeto JSON es `null`. */
async function leerCuerpo(res: Response): Promise<Registro | null> {
  const t = await res.text()
  if (!t) return {}
  try { const v = JSON.parse(t); return typeof v === 'object' && v !== null && !Array.isArray(v) ? v : null } catch { return null }
}

/** Suma los ítems por su clave (el primero gana). `false` si alguno no tiene clave. */
function agregar(unicos: Map<string, Registro>, pagina: Registro[], clave: (item: Registro) => string | null): boolean {
  for (const item of pagina) { const k = clave(item); if (k === null) return false; if (!unicos.has(k)) unicos.set(k, item) }
  return true
}

export async function leerPaginas(f: ZohoFetch, ruta: string, params: Record<string, string>, limite: number, { pausa429Ms = PAUSA_429_MS, clave = claveId }: OpcionesLista = {}): Promise<ResultadoLista> {
  const unicos = new Map<string, Registro>(); const recurso = nombreRecurso(ruta)
  try {
    let from = 1; let pagina = 1; let repetidas = 0
    for (;;) {
      const res = await f(`${ruta}?${new URLSearchParams({ ...params, from: String(from), limit: String(limite) })}`)
      if (res.status === 429) { if (repetidas++ < REINTENTOS_429) { await dormir(pausa429Ms); continue } return { estado: 'corte' } }
      if (res.status === 404) return { estado: 'error', motivo: `${recurso} http 404` }
      if (!res.ok) return { estado: 'error', motivo: `${recurso} http ${res.status}` }
      repetidas = 0
      const cuerpo = await leerCuerpo(res)
      if (cuerpo === null) return { estado: 'error', motivo: 'json' }
      const pag = Array.isArray(cuerpo.data) ? (cuerpo.data as Registro[]) : []
      if (!agregar(unicos, pag, clave)) return { estado: 'error', motivo: 'forma' }
      if (pag.length < limite) return { estado: 'ok', items: [...unicos.values()] }
      if (pagina === TOPE_PAGINAS) return { estado: 'error', motivo: 'tope' }
      pagina++; from += limite
    }
  } catch { return { estado: 'error', motivo: 'red' } }
}

/** Una petición por id. Vivo con `isDeleted` o `isTrashed` (booleano o texto) ⇒ `noEsta` (molde `rellenoConversaciones.ts:45`, `:99`). */
export async function leerPorId(f: ZohoFetch, ruta: string, { pausa429Ms = PAUSA_429_MS }: OpcionesLector = {}): Promise<ResultadoPorId> {
  const recurso = nombreRecurso(ruta)
  try {
    let repetidas = 0
    for (;;) {
      const res = await f(ruta)
      if (res.status === 429) { if (repetidas++ < REINTENTOS_429) { await dormir(pausa429Ms); continue } return { estado: 'corte' } }
      if (res.status === 404) return { estado: 'noEsta' }
      if (!res.ok) return { estado: 'error', motivo: `${recurso} http ${res.status}` }
      const dato = await leerCuerpo(res)
      if (dato === null) return { estado: 'error', motivo: 'json' }
      return [dato.isDeleted, dato.isTrashed].some((v) => v === true || v === 'true') ? { estado: 'noEsta' } : { estado: 'vivo', dato }
    }
  } catch { return { estado: 'error', motivo: 'red' } }
}

/** El error de `leerConversaciones` cita el cuerpo o el mensaje de Node: se traduce a un conjunto cerrado. */
function motivoConversaciones(error: string): string {
  const http = /^Zoho \/tickets\/[^/\s]+\/conversations (\d{3})$/.exec(error)
  if (http) return `conversaciones http ${http[1]}`
  return error.startsWith('tope de ') ? 'conversaciones tope' : 'conversaciones red'
}

/** `leerConversaciones` con los reintentos SIEMPRE pasados (su omisión es 0, `conversaciones.ts:70`); la lista se cuenta por id único. */
export async function leerConversacionesDe(f: ZohoFetch, ticketId: string, { pausa429Ms = PAUSA_429_MS }: OpcionesLector = {}): Promise<ResultadoLista> {
  const r = await leerConversaciones(f, ticketId, { reintentos429: REINTENTOS_429, pausa429Ms })
  if (r.por429) return { estado: 'corte' }
  if (r.error !== null) return { estado: 'error', motivo: motivoConversaciones(r.error) }
  const unicos = new Map<string, Registro>()
  return agregar(unicos, r.items, claveId) ? { estado: 'ok', items: [...unicos.values()] } : { estado: 'error', motivo: 'forma' }
}
