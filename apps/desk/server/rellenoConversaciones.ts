import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { Sync } from '@ambientalia/zoho-sync/sync'
import {
  leerConversaciones, guardarYReflejar, esperadoDeZoho, instanteBase, esCalificacion,
  REINTENTOS_429, PAUSA_429_MS, PAUSA_ENTRE_TICKETS_MS,
} from '@ambientalia/zoho-sync/conversaciones'
import { nacidoEnLaApp } from './db/ticketFuentes'
import { logger } from './util/logger'; import { guardaEnBase, conResumenGuardado, type GuardaResumen } from './rellenoConversacionesResumen'

/**
 * relleno-completo-conversaciones (1G-01, RQ-ZS-28 y RQ-ZS-29). La pasada que una persona lanza a mano: recorre los ids de
 * `desk.tickets` de Zoho (nunca los `app-`), pide el detalle FRESCO de cada uno, lo persiste por la vía de hoy
 * (`syncTicket(id, detalle)`, `packages/zoho-sync/src/sync.ts:178-179`), lee la lista entera de conversaciones y clasifica el
 * ticket contra los recuentos del detalle fresco, nunca contra `tickets.raw` (S-5). Vive junto a su molde,
 * `createDetailBackfiller` (`apps/desk/server/backfill.ts:29`), porque sólo la corre la App (D1).
 *
 * LOTE L2 (completo). Verificación sobre lo GUARDADO Y VISIBLE tras marcar (D3), `429` reintentado y, agotado, corte con `cortadoEn` (D5),
 * `enMarcha` antes del primer `await` y rechazo del segundo `lanzar` (S-2), y resumen con `registrar` (D6, S-10).
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
  pausaMs?: number; pausa429Ms?: number; registrar?: (r: EstadoRelleno) => void; guardar?: GuardaResumen
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

/** El resumen de la pasada va al logger de la App como UNA línea (D6, S-10): sólo números de ticket y recuentos, nunca datos de cliente. */
const registrarEnLog = (r: EstadoRelleno) => logger.info({ resumen: r }, `relleno-completo-conversaciones: ${r.cortadoEn === null ? 'terminada' : `cortada en el ticket ${r.cortadoEn}`}, ${r.recorridos} de ${r.aRecorrer} recorridos`)

export function crearRellenoConversaciones({
  zohoFetch, db, sync, marcar, pausaMs = PAUSA_ENTRE_TICKETS_MS, pausa429Ms = PAUSA_429_MS, registrar = registrarEnLog, guardar = guardaEnBase(db),
}: DepsRelleno) {
  let estado = estadoInicial()

  /** La lista de la pasada (D4): una consulta simple y el filtro en código, porque pg-mem no resuelve subconsultas correlacionadas. */
  async function tramo(desde: number | null): Promise<{ zoho: { id: string; numero: number }[]; saltadosApp: number }> {
    const r = await db.query('SELECT id, number FROM tickets ORDER BY number')
    const filas = (r.rows as { id: string; number: unknown }[])
      .map((f) => ({ id: String(f.id), numero: Number(f.number) }))
      .filter((f) => desde === null || f.numero >= desde)
    return { zoho: filas.filter((f) => !nacidoEnLaApp(f.id)), saltadosApp: filas.filter((f) => nacidoEnLaApp(f.id)).length }
  }

  /** Cuenta toda petición de detalle y de página, y todo `429` visto en ellas (D6); la de contacto y cuenta va por la `zohoFetch` del `Sync`. */
  const contado: ZohoFetch = async (path, init) => {
    estado.peticiones++
    const res = await zohoFetch(path, init)
    if (res.status === 429) estado.vistos429++
    return res
  }
  /** Un fallo se cuenta y su texto, el primero, se guarda como `motivoPrimerFallo` (S-10; molde `packages/zoho-sync/src/sync.ts:228`, `:238`). */
  const aError = (numero: number, motivo: string) => { estado.conError.push(numero); estado.cuentas.conError++; estado.motivoPrimerFallo ??= motivo }
  const aNoEsta = (numero: number) => { estado.noEstaEnZoho.push(numero); estado.cuentas.noEstaEnZoho++ }
  /** Lo guardado y VISIBLE de Zoho para el ticket, DESPUÉS de guardar y marcar (D3), sin calificaciones (RQ-ZS-48): `id` es clave primaria, así que son ids únicos. */
  const visibles = async (id: string): Promise<number> => {
    const r = await db.query("SELECT raw FROM conversations WHERE ticket_id=$1 AND source='zoho' AND ausente_en_zoho_at IS NULL", [id])
    return (r.rows as { raw: unknown }[]).filter((f) => !esCalificacion(f.raw)).length
  }

  /**
   * Un ticket: detalle fresco → persistir → `inicio` → leer → guardar → clase. Devuelve `'corte'` si un `429` agota los reintentos
   * (detalle o página); cualquier otro fallo se cuenta y la pasada sigue (RQ-ZS-29).
   */
  async function uno(id: string, numero: number): Promise<'corte' | void> {
    try {
      let res: Response
      for (let repetidas = 0; ; repetidas++) {
        res = await contado(`/tickets/${id}?include=contacts,assignee`)
        // El orden es deliberado: el 429 va ANTES del 404 y de `!res.ok`, que es donde caería un 429 si fuera después (P2).
        if (res.status === 429) {
          if (repetidas < REINTENTOS_429) { await dormir(pausa429Ms); continue }
          return 'corte'
        }
        break
      }
      if (res.status === 404) return aNoEsta(numero)
      if (!res.ok) throw new Error(`Zoho /tickets/${id} ${res.status}`)
      const detalle = await leerCuerpo(res)
      if (verdadero(detalle.isDeleted) || verdadero(detalle.isTrashed)) return aNoEsta(numero)
      await sync.syncTicket(id, detalle)
      const inicio = await instanteBase(db)
      const lista = await leerConversaciones(contado, id, { reintentos429: REINTENTOS_429, pausa429Ms })
      const esperado = esperadoDeZoho(detalle)
      await guardarYReflejar(db, id, lista, { esperado, marcar, inicio })
      if (lista.por429) return 'corte'
      if (lista.error) return aError(numero, lista.error)
      if (esperado === null) { estado.sinRecuento.push(numero); estado.cuentas.sinRecuento++; return }
      const guardadas = await visibles(id)
      if (guardadas === esperado) { estado.cuentas.completo++; return }
      estado.cuentas.descuadrado++
      estado.descuadrados.push({ numero, esperado, guardadas })
    } catch (e) {
      aError(numero, e instanceof Error ? e.message : String(e))
    }
  }

  async function pasada(desde: number | null, limite: number | null): Promise<void> {
    try {
      const t = await tramo(desde)
      estado.inicio = new Date().toISOString()
      estado.saltadosApp = t.saltadosApp
      const lista = limite === null ? t.zoho : t.zoho.slice(0, limite)
      estado.aRecorrer = lista.length
      for (const [i, f] of lista.entries()) {
        if (i > 0) await dormir(pausaMs)
        if (await uno(f.id, f.numero) === 'corte') { estado.cortadoEn = f.numero; break }
        estado.recorridos++
      }
    } catch (e) {
      estado.error = e instanceof Error ? e.message : String(e)
    } finally {
      estado.enMarcha = false
      estado.terminado = true
      estado.fin = new Date().toISOString()
      try { registrar(structuredClone(estado)) } catch { /* el resumen no puede tumbar la pasada */ }
    }
  }

  return {
    /** Lanza la pasada en segundo plano y devuelve ya. `enMarcha` va ANTES del primer `await`; con una en marcha no lanza otra (S-2, P4). */
    lanzar({ desde, limite }: { desde?: number; limite?: number } = {}): { lanzada: boolean; estado: EstadoRelleno } {
      if (estado.enMarcha) return { lanzada: false, estado: structuredClone(estado) }
      estado = { ...estadoInicial(), enMarcha: true, desde: desde ?? null, limite: limite ?? null }
      void conResumenGuardado({ guardar, estado, correr: () => pasada(estado.desde, estado.limite) })
      return { lanzada: true, estado: structuredClone(estado) }
    },
    /** Cuántos ids recorrería la pasada y cuántos `app-` salta, sin Zoho ni escritura (S-3). */
    async recuento({ desde }: { desde?: number } = {}): Promise<{ aRecorrer: number; saltadosApp: number }> {
      const t = await tramo(desde ?? null)
      return { aRecorrer: t.zoho.length, saltadosApp: t.saltadosApp }
    },
    estado(): EstadoRelleno { return structuredClone(estado) }, ultimaGuardada: () => guardar.ultima(),
  }
}
