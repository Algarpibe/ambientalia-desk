import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { Sync } from '@ambientalia/zoho-sync/sync'
import {
  leerConversaciones, guardarYReflejar, esperadoDeZoho, instanteBase,
  REINTENTOS_429, PAUSA_429_MS, PAUSA_ENTRE_TICKETS_MS,
} from '@ambientalia/zoho-sync/conversaciones'
import { nacidoEnLaApp } from './db/ticketFuentes'

/**
 * relleno-completo-conversaciones (1G-01, RQ-ZS-28 y RQ-ZS-29). La pasada que una persona lanza a mano: recorre los ids de
 * `desk.tickets` de Zoho (nunca los `app-`), pide el detalle FRESCO de cada uno, lo persiste por la vía de hoy
 * (`syncTicket(id, detalle)`, `packages/zoho-sync/src/sync.ts:178-179`), lee la lista entera de conversaciones y clasifica el
 * ticket contra los recuentos del detalle fresco, nunca contra `tickets.raw` (S-5). Vive junto a su molde,
 * `createDetailBackfiller` (`apps/desk/server/backfill.ts:29`), porque sólo la corre la App (D1).
 *
 * LOTE L1. Quedan para L2, a propósito, y por eso aquí no existen: el reintento y el corte por 429 (detalle y páginas) con
 * `cortadoEn`, la verificación sobre lo GUARDADO Y VISIBLE (D3), `enMarcha` antes del primer `await` y el rechazo del segundo
 * `lanzar`, el resumen con `registrar` y `motivoPrimerFallo`. Hoy la clase sale de lo RECIBIDO (`completa` de
 * `guardarYReflejar` y los ids únicos de la lista).
 */
type ZohoFetch = (path: string, init?: RequestInit) => Promise<Response>
type ZohoRecord = Record<string, unknown>

export interface EstadoRelleno {
  enMarcha: boolean; terminado: boolean; cortadoEn: number | null; error?: string; desde: number | null
  limite: number | null; aRecorrer: number; saltadosApp: number; recorridos: number; peticiones: number; vistos429: number
  cuentas: { completo: number; descuadrado: number; sinRecuento: number; conError: number; noEstaEnZoho: number }
  descuadrados: { numero: number; esperado: number; guardadas: number }[]; sinRecuento: number[]; conError: number[]
  noEstaEnZoho: number[]; motivoPrimerFallo?: string; inicio?: string; fin?: string   // números de ticket; nunca datos de cliente
}

export interface DepsRelleno {
  zohoFetch: ZohoFetch; db: Queryable; sync: Pick<Sync, 'syncTicket'>; marcar: boolean
  pausaMs?: number; pausa429Ms?: number; registrar?: (r: EstadoRelleno) => void
}

const estadoInicial = (): EstadoRelleno => ({
  enMarcha: false, terminado: false, cortadoEn: null, desde: null, limite: null, aRecorrer: 0, saltadosApp: 0, recorridos: 0,
  peticiones: 0, vistos429: 0, cuentas: { completo: 0, descuadrado: 0, sinRecuento: 0, conError: 0, noEstaEnZoho: 0 },
  descuadrados: [], sinRecuento: [], conError: [], noEstaEnZoho: [],
})

const dormir = (ms: number) => (ms > 0 ? new Promise<void>((r) => setTimeout(r, ms)) : Promise.resolve())
async function leerCuerpo(res: Response): Promise<ZohoRecord> { const t = await res.text(); return t ? JSON.parse(t) : {} }
/** Zoho marca un ticket borrado o en la papelera con `isDeleted` / `isTrashed`, a veces como texto (S-6). */
const verdadero = (v: unknown) => v === true || v === 'true'

export function crearRellenoConversaciones({ zohoFetch, db, sync, marcar, pausaMs = PAUSA_ENTRE_TICKETS_MS, pausa429Ms = PAUSA_429_MS }: DepsRelleno) {
  let estado = estadoInicial()

  /** La lista de la pasada (D4): una consulta simple y el filtro en código, porque pg-mem no resuelve subconsultas correlacionadas. */
  async function tramo(desde: number | null): Promise<{ zoho: { id: string; numero: number }[]; saltadosApp: number }> {
    const r = await db.query('SELECT id, number FROM tickets ORDER BY number')
    const filas = (r.rows as { id: string; number: unknown }[])
      .map((f) => ({ id: String(f.id), numero: Number(f.number) }))
      .filter((f) => desde === null || f.numero >= desde)
    return { zoho: filas.filter((f) => !nacidoEnLaApp(f.id)), saltadosApp: filas.filter((f) => nacidoEnLaApp(f.id)).length }
  }

  const contado: ZohoFetch = async (path, init) => { estado.peticiones++; return zohoFetch(path, init) }
  const aError = (numero: number) => { estado.conError.push(numero); estado.cuentas.conError++ }
  const aNoEsta = (numero: number) => { estado.noEstaEnZoho.push(numero); estado.cuentas.noEstaEnZoho++ }

  /** Un ticket: detalle fresco → persistir → `inicio` → leer → guardar → clase. Cualquier fallo se cuenta y la pasada sigue (RQ-ZS-29). */
  async function uno(id: string, numero: number): Promise<void> {
    try {
      const res = await contado(`/tickets/${id}?include=contacts,assignee`)
      if (res.status === 404) return aNoEsta(numero)
      if (!res.ok) throw new Error(`Zoho /tickets/${id} ${res.status}`)
      const detalle = await leerCuerpo(res)
      if (verdadero(detalle.isDeleted) || verdadero(detalle.isTrashed)) return aNoEsta(numero)
      await sync.syncTicket(id, detalle)
      const inicio = await instanteBase(db)
      const lista = await leerConversaciones(contado, id, { reintentos429: REINTENTOS_429, pausa429Ms })
      const esperado = esperadoDeZoho(detalle)
      const { completa } = await guardarYReflejar(db, id, lista, { esperado, marcar, inicio })
      if (lista.error) return aError(numero)
      if (esperado === null) { estado.sinRecuento.push(numero); estado.cuentas.sinRecuento++; return }
      if (completa) { estado.cuentas.completo++; return }
      estado.cuentas.descuadrado++
      estado.descuadrados.push({ numero, esperado, guardadas: new Set(lista.items.map((c) => String(c.id))).size })
    } catch {
      aError(numero)
    }
  }

  async function pasada(desde: number | null, limite: number | null): Promise<void> {
    try {
      const t = await tramo(desde)
      estado.enMarcha = true
      estado.inicio = new Date().toISOString()
      estado.saltadosApp = t.saltadosApp
      const lista = limite === null ? t.zoho : t.zoho.slice(0, limite)
      estado.aRecorrer = lista.length
      for (const [i, f] of lista.entries()) {
        if (i > 0) await dormir(pausaMs)
        await uno(f.id, f.numero)
        estado.recorridos++
      }
    } catch (e) {
      estado.error = e instanceof Error ? e.message : String(e)
    } finally {
      estado.enMarcha = false
      estado.terminado = true
      estado.fin = new Date().toISOString()
    }
  }

  return {
    /** Lanza la pasada en segundo plano y devuelve ya. En L1 no hay guarda de «en marcha»: es de L2 (S-2). */
    lanzar({ desde, limite }: { desde?: number; limite?: number } = {}): { lanzada: boolean; estado: EstadoRelleno } {
      estado = { ...estadoInicial(), desde: desde ?? null, limite: limite ?? null }
      void pasada(estado.desde, estado.limite)
      return { lanzada: true, estado: structuredClone(estado) }
    },
    /** Cuántos ids recorrería la pasada y cuántos `app-` salta, sin Zoho ni escritura (S-3). */
    async recuento({ desde }: { desde?: number } = {}): Promise<{ aRecorrer: number; saltadosApp: number }> {
      const t = await tramo(desde ?? null)
      return { aRecorrer: t.zoho.length, saltadosApp: t.saltadosApp }
    },
    estado(): EstadoRelleno { return structuredClone(estado) },
  }
}
