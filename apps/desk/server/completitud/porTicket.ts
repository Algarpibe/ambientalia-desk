import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { eventId } from '@ambientalia/zoho-sync/db/history'
import type { Entidad } from './conocidas'
import { compararAdjuntos, compararIds, unirPorId, type AdjuntoId } from './comparar'
import { leerConversacionesDe, leerPaginas, type Registro } from './lectores'

/**
 * verificacion-completitud (1G-03, D8, RQ-ZS-36) · la fase B de UN ticket: sus conversaciones, adjuntos e historia en Zoho frente a Desk, como listas
 * de ids. Acumula en local y sólo devuelve filas si el ticket termina: un `429` agotado da `{ tipo: 'corte' }` y nada de ese ticket se publica.
 * El error de una fuente es error del ticket en esa entidad (la comparación no se hace, no es ausencia) y el de conversaciones arrastra a adjuntos.
 * Sólo ids, tamaños y recuentos salen de aquí: ningún asunto, nombre, correo ni contenido (CA-11).
 */
type ZohoFetch = (path: string, init?: RequestInit) => Promise<Response>
export type Hijo = Extract<Entidad, 'conversaciones' | 'adjuntos' | 'historia'>
export interface DiferenciaHijo {
  entidad: Hijo; lado: 'faltaEnDesk' | 'faltaEnZoho' | 'otroTamano'; id: string
  fuente?: string | null; ausenteEnZoho?: boolean; conversacionId?: string | null; tamano?: { zoho: number | null; desk: number | null }
}
export interface ConteoHijo { enZoho: number; enDesk: number; casan: number }
export type ResultadoPorTicket =
  | { tipo: 'corte' }
  | { tipo: 'ok'; difs: DiferenciaHijo[]; conteo: Partial<Record<Hijo, ConteoHijo>>; errores: { entidad: Hijo; motivo: string }[]; bytes: { zoho: number; desk: number } }
export interface AccesoPorTicket { f: ZohoFetch; lee: Queryable; pausa429Ms: number; entidad: (e: Entidad) => void }

export class ErrorBase extends Error {}

/** Las lecturas de Desk: un fallo de la base se traduce a un código cerrado, sin el mensaje del driver. */
export async function filas(lee: Queryable, sql: string, params?: unknown[]): Promise<Record<string, unknown>[]> {
  try { return (await lee.query(sql, params)).rows as Record<string, unknown>[] } catch { throw new ErrorBase() }
}

const tamano = (v: unknown): number | null => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v))
const suma = (a: AdjuntoId[]): number => a.reduce((s, x) => s + (x.size ?? 0), 0)
const adjuntoDe = (a: Registro): AdjuntoId => ({ id: String(a.id), size: a.size ? tamano(a.size) : null })
const adjuntosDe = (lista: unknown): AdjuntoId[] => (Array.isArray(lista) ? (lista as Registro[]) : []).filter((a) => a?.id).map(adjuntoDe)

const deskConversaciones = (lee: Queryable, id: string) => filas(lee, 'SELECT id, source, ausente_en_zoho_at FROM conversations WHERE ticket_id = $1', [id])
const deskAdjuntos = (lee: Queryable, id: string) => filas(lee, 'SELECT id, size, conversation_id FROM attachments WHERE ticket_id = $1', [id])
const deskHistoria = (lee: Queryable, id: string) => filas(lee, 'SELECT id FROM ticket_history WHERE ticket_id = $1', [id])

/** Los hijos de un ticket que sólo está en Desk (el `app-`, el #1017): todos «falta en Zoho», sin pedir nada a Zoho. */
export async function hijosSoloDesk(lee: Queryable, ticketId: string): Promise<DiferenciaHijo[]> {
  const convs = (await deskConversaciones(lee, ticketId)).map((r): DiferenciaHijo => ({ entidad: 'conversaciones', lado: 'faltaEnZoho', id: String(r.id), fuente: r.source as string | null, ausenteEnZoho: r.ausente_en_zoho_at != null }))
  const adjs = (await deskAdjuntos(lee, ticketId)).map((r): DiferenciaHijo => ({ entidad: 'adjuntos', lado: 'faltaEnZoho', id: String(r.id), conversacionId: r.conversation_id as string | null }))
  const hist = (await deskHistoria(lee, ticketId)).map((r): DiferenciaHijo => ({ entidad: 'historia', lado: 'faltaEnZoho', id: String(r.id) }))
  return [...convs, ...adjs, ...hist]
}

export async function porTicket(a: AccesoPorTicket, t: { id: string }): Promise<ResultadoPorTicket> {
  const { f, lee, pausa429Ms } = a
  const difs: DiferenciaHijo[] = []; const conteo: Partial<Record<Hijo, ConteoHijo>> = {}; const errores: { entidad: Hijo; motivo: string }[] = []
  const bytes = { zoho: 0, desk: 0 }
  a.entidad('conversaciones')
  const rc = await leerConversacionesDe(f, t.id, { pausa429Ms })
  if (rc.estado === 'corte') return { tipo: 'corte' }
  let segunda: AdjuntoId[] | null = null
  if (rc.estado === 'error') { errores.push({ entidad: 'conversaciones', motivo: rc.motivo }, { entidad: 'adjuntos', motivo: 'sin lista de conversaciones' }) } else {
    a.entidad('adjuntos')
    const ra = await leerPaginas(f, `/tickets/${t.id}/attachments`, {}, 100, { pausa429Ms })
    if (ra.estado === 'corte') return { tipo: 'corte' }
    if (ra.estado === 'error') errores.push({ entidad: 'adjuntos', motivo: ra.motivo }); else segunda = adjuntosDe(ra.items)
  }
  a.entidad('historia')
  const rh = await leerPaginas(f, `/tickets/${t.id}/History`, {}, 50, { pausa429Ms, clave: (ev) => eventId(t.id, ev) })
  if (rh.estado === 'corte') return { tipo: 'corte' }
  if (rh.estado === 'error') errores.push({ entidad: 'historia', motivo: rh.motivo })

  if (rc.estado === 'ok') {
    const zohoConv = rc.items.map((c) => String(c.id))
    const desk = await deskConversaciones(lee, t.id)
    const deskConv = desk.map((r) => String(r.id))
    const cc = compararIds(zohoConv, deskConv)
    const delDesk = new Map(desk.map((r) => [String(r.id), r]))
    for (const id of cc.faltaEnDesk) difs.push({ entidad: 'conversaciones', lado: 'faltaEnDesk', id })
    for (const id of cc.faltaEnZoho) difs.push({ entidad: 'conversaciones', lado: 'faltaEnZoho', id, fuente: delDesk.get(id)?.source as string | null, ausenteEnZoho: delDesk.get(id)?.ausente_en_zoho_at != null })
    conteo.conversaciones = { enZoho: zohoConv.length, enDesk: deskConv.length, casan: cc.casan }
    if (segunda !== null) {
      const deConversaciones = rc.items.flatMap((c) => adjuntosDe(c.attachments))
      const deZoho = unirPorId(deConversaciones, segunda)
      const rows = await deskAdjuntos(lee, t.id)
      const deDesk = rows.map((r): AdjuntoId => ({ id: String(r.id), size: tamano(r.size) }))
      const ca = compararAdjuntos(deZoho, deDesk)
      for (const id of ca.faltaEnDesk) difs.push({ entidad: 'adjuntos', lado: 'faltaEnDesk', id })
      for (const id of ca.faltaEnZoho) difs.push({ entidad: 'adjuntos', lado: 'faltaEnZoho', id, conversacionId: rows.find((r) => String(r.id) === id)?.conversation_id as string | null })
      for (const d of ca.distintoTamano) difs.push({ entidad: 'adjuntos', lado: 'otroTamano', id: d.id, tamano: { zoho: d.zoho, desk: d.desk } })
      conteo.adjuntos = { enZoho: deZoho.length, enDesk: deDesk.length, casan: ca.casan }
      Object.assign(bytes, { zoho: suma(deZoho), desk: suma(deDesk) })
    }
  }
  if (rh.estado === 'ok') {
    const zohoHist = rh.items.map((ev) => eventId(t.id, ev))
    const deskHist = (await deskHistoria(lee, t.id)).map((r) => String(r.id))
    const ch = compararIds(zohoHist, deskHist)
    for (const id of ch.faltaEnDesk) difs.push({ entidad: 'historia', lado: 'faltaEnDesk', id })
    for (const id of ch.faltaEnZoho) difs.push({ entidad: 'historia', lado: 'faltaEnZoho', id })
    conteo.historia = { enZoho: zohoHist.length, enDesk: deskHist.length, casan: ch.casan }
  }
  return { tipo: 'ok', difs, conteo, errores, bytes }
}
