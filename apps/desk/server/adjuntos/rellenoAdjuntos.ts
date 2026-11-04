import * as fsReal from 'node:fs/promises'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { REINTENTOS_429, PAUSA_429_MS, PAUSA_ENTRE_TICKETS_MS } from '@ambientalia/zoho-sync/conversaciones'
import { guardarAdjunto, estadoCopia, ErrorDisco, NOMBRE_ADJUNTO, RUTA_ADJUNTO_ZOHO, type DepsAlmacen, type FilaAdjunto } from './almacen'
import { logger } from '../util/logger'

/**
 * persistencia-adjuntos (1G-02, RQ-ZS-32, D3, D4 y D8). La pasada que una persona lanza a mano: recorre los adjuntos de
 * `desk.attachments` por número de ticket y luego id, trae los pendientes con la unidad común `guardarAdjunto` (`./almacen`) y deja un
 * resumen en memoria y UNA línea en el log. Vive en la App porque sólo ella tiene el volumen (D1). Molde:
 * `apps/desk/server/rellenoConversaciones.ts` (estado, `enMarcha` antes del primer `await`, `zohoFetch` contada, `429` reintentado).
 * El resumen y el log llevan sólo ids de adjunto y números de ticket: nunca el nombre del fichero, el asunto ni datos del cliente (S-12).
 */
type ZohoFetch = (path: string, init?: RequestInit) => Promise<Response>
export type Motivo = 'id' | 'tamano' | 'http' | 'red' | 'base'

export interface EstadoRellenoAdjuntos {
  enMarcha: boolean; terminado: boolean; cortadoEn: number | null; motivoCorte?: '429' | 'disco'; error?: string
  desde: number | null; limite: number | null; aRecorrer: number; pedidos: number; peticiones: number; vistos429: number; bytes: number
  cuentas: { guardados: number; yaPresentes: number; ausentes: number; sinRuta: number; sinTamanoComprobable: number; fallidos: Record<Motivo, number> }
  ausentes: { adjunto: string; numero: number }[]; fallidos: { adjunto: string; numero: number; motivo: Motivo }[]
  motivoPrimerFallo?: string; inicio?: string; fin?: string   // ids y números de ticket; nunca datos de cliente
}

export interface DepsRellenoAdjuntos {
  zohoFetch: ZohoFetch; db: Queryable
  /** `dirAdjuntos(...)`: `null` si `ADJUNTOS_DIR` falta o no es válido; el motor no lanza nada sin él. */
  dir: string | null
  pausaMs?: number; pausa429Ms?: number
  /** Sólo para provocar fallos de disco en las pruebas. */
  fs?: DepsAlmacen['fs']
  registrar?: (r: EstadoRellenoAdjuntos) => void
}

export interface RecuentoAdjuntos { pendientes: number; bytes: number; mb: number; sinTamano: number; sinRuta: number; yaPresentes: number }

const MB = 1048576

const estadoInicial = (): EstadoRellenoAdjuntos => ({
  enMarcha: false, terminado: false, cortadoEn: null, desde: null, limite: null, aRecorrer: 0, pedidos: 0, peticiones: 0, vistos429: 0, bytes: 0,
  cuentas: { guardados: 0, yaPresentes: 0, ausentes: 0, sinRuta: 0, sinTamanoComprobable: 0, fallidos: { id: 0, tamano: 0, http: 0, red: 0, base: 0 } },
  ausentes: [], fallidos: [],
})

const dormir = (ms: number) => (ms > 0 ? new Promise<void>((r) => setTimeout(r, ms)) : Promise.resolve())

/** El código de Node de un fallo de disco (`ENOSPC`...), nunca su mensaje: el mensaje trae la ruta. */
const codigoDe = (e: unknown): string => {
  const c = typeof e === 'object' && e !== null ? (e as { code?: unknown }).code : undefined
  return typeof c === 'string' ? c : 'DESCONOCIDO'
}

interface FilaLista extends FilaAdjunto { id: string; numero: number }

/** El resumen de la pasada va al logger de la App como UNA línea (S-12): sólo recuentos, ids y números de ticket. */
const registrarEnLog = (r: EstadoRellenoAdjuntos) => logger.info(
  { resumen: r },
  `relleno-adjuntos: ${r.cortadoEn === null ? 'terminada' : `cortada en el ticket ${r.cortadoEn} (${r.motivoCorte})`}, ${r.cuentas.guardados} guardados de ${r.aRecorrer} recorridos`,
)

export function crearRellenoAdjuntos({
  zohoFetch, db, dir, pausaMs = PAUSA_ENTRE_TICKETS_MS, pausa429Ms = PAUSA_429_MS, fs, registrar = registrarEnLog,
}: DepsRellenoAdjuntos) {
  let estado = estadoInicial()

  /** La lista de la pasada (D3): una consulta simple con el filtro por `desde` en código; se fija al lanzar. */
  async function lista(desde: number | null): Promise<FilaLista[]> {
    const r = await db.query(
      'SELECT a.id, a.size, a.zoho_href, a.storage_path, t.number FROM attachments a JOIN tickets t ON t.id = a.ticket_id ORDER BY t.number, a.id',
    )
    return (r.rows as { id: unknown; size: number | string | null; zoho_href: string | null; storage_path: string | null; number: unknown }[])
      .map((f) => ({ id: String(f.id), size: f.size, zoho_href: f.zoho_href, storage_path: f.storage_path, numero: Number(f.number) }))
      .filter((f) => desde === null || f.numero >= desde)
  }

  /**
   * Estado de la copia justo antes de pedir (D3): la lista se fijó al lanzar, así que si otra vía (la pasada periódica) guardó el adjunto
   * entretanto, su `storage_path` se relee de la base antes de dar el adjunto por pendiente.
   */
  async function copiaActual(f: FilaLista): Promise<Awaited<ReturnType<typeof estadoCopia>>> {
    const e = await estadoCopia(String(dir), f, fs)
    if (e === 'presente') return e
    const r = await db.query('SELECT storage_path FROM attachments WHERE id=$1', [f.id])
    const fresco = (r.rows[0] as { storage_path: string | null } | undefined)?.storage_path ?? null
    return fresco === f.storage_path ? e : estadoCopia(String(dir), { ...f, storage_path: fresco }, fs)
  }

  /** Cuenta toda petición y todo `429` visto en ellas (D8). */
  const contado: ZohoFetch = async (path, init) => {
    estado.peticiones++
    const res = await zohoFetch(path, init)
    if (res.status === 429) estado.vistos429++
    return res
  }
  /** El primer fallo guarda su texto como `motivoPrimerFallo`: sólo rutas de la API con ids numéricos o el `code` de Node. */
  const aFallido = (f: FilaLista, motivo: Motivo, texto: string) => {
    estado.fallidos.push({ adjunto: f.id, numero: f.numero, motivo }); estado.cuentas.fallidos[motivo]++
    estado.motivoPrimerFallo ??= texto
  }
  const aAusente = (f: FilaLista) => { estado.ausentes.push({ adjunto: f.id, numero: f.numero }); estado.cuentas.ausentes++ }

  /** Pide UN adjunto. Devuelve `'corte'` si un `429` agota los reintentos; cualquier otro fallo se cuenta y la pasada sigue. */
  async function pedir(f: FilaLista): Promise<'corte' | void> {
    const href = String(f.zoho_href)   // ya pasó RUTA_ADJUNTO_ZOHO: sólo ids numéricos
    for (let repetidas = 0; ; repetidas++) {
      const r = await guardarAdjunto({ zohoFetch: contado, db, dir: String(dir), fs }, f)
      if (r.estado === 'guardado') {
        estado.cuentas.guardados++; estado.bytes += r.bytes
        if (!r.comprobado) estado.cuentas.sinTamanoComprobable++
        return
      }
      if (r.estado === 'sinRuta') { estado.cuentas.sinRuta++; return }
      if (r.estado === 'fallido') return aFallido(f, r.motivo, r.motivo === 'base' ? 'no se pudo fijar storage_path' : `Zoho ${href} ${r.motivo}`)
      // El orden es deliberado: el 429 y el 404 van ANTES del caso general `!res.ok`, que los incluye (P3).
      if (r.status === 429) {
        if (repetidas < REINTENTOS_429) { await dormir(pausa429Ms); continue }
        return 'corte'
      }
      if (r.status === 404) return aAusente(f)
      return aFallido(f, 'http', `Zoho ${href} ${r.status}`)
    }
  }

  /** `stat` del directorio antes del primer pedido: sin volumen se corta sin llamar a Zoho (D4). */
  async function directorioValido(): Promise<void> {
    let st
    try { st = await (fs?.stat ?? fsReal.stat)(String(dir)) } catch (e) { throw new ErrorDisco(codigoDe(e)) }
    if (!st.isDirectory()) throw new ErrorDisco('ENOTDIR')
  }

  async function pasada(desde: number | null, limite: number | null): Promise<void> {
    let actual: FilaLista | undefined
    try {
      const filas = await lista(desde)
      estado.inicio = new Date().toISOString()
      estado.aRecorrer = filas.length
      let verificado = false
      for (const f of filas) {
        actual = f
        if (!NOMBRE_ADJUNTO.test(f.id)) { aFallido(f, 'id', 'adjunto con id no numérico'); continue }
        if (typeof f.zoho_href !== 'string' || !RUTA_ADJUNTO_ZOHO.test(f.zoho_href)) { estado.cuentas.sinRuta++; continue }
        if (await copiaActual(f) === 'presente') { estado.cuentas.yaPresentes++; continue }
        if (limite !== null && estado.pedidos >= limite) break
        if (!verificado) { await directorioValido(); verificado = true }
        if (estado.pedidos > 0) await dormir(pausaMs)
        estado.pedidos++
        if (await pedir(f) === 'corte') { estado.cortadoEn = f.numero; estado.motivoCorte = '429'; break }
      }
    } catch (e) {
      if (e instanceof ErrorDisco) {
        estado.cortadoEn = actual?.numero ?? null; estado.motivoCorte = 'disco'; estado.motivoPrimerFallo ??= e.code
      } else {
        estado.error = e instanceof Error ? e.message : String(e)
      }
    } finally {
      estado.enMarcha = false
      estado.terminado = true
      estado.fin = new Date().toISOString()
      try { registrar(structuredClone(estado)) } catch { /* el resumen no puede tumbar la pasada */ }
    }
  }

  return {
    /** Lanza la pasada en segundo plano y devuelve ya. `enMarcha` va ANTES del primer `await`; con una en marcha, o sin directorio, no lanza (S-2, D8). */
    lanzar({ desde, limite }: { desde?: number; limite?: number } = {}): { lanzada: boolean; estado: EstadoRellenoAdjuntos } {
      if (estado.enMarcha) return { lanzada: false, estado: structuredClone(estado) }
      if (dir === null) {
        estado = { ...estadoInicial(), error: 'ADJUNTOS_DIR no está definido o no es un directorio válido' }
        return { lanzada: false, estado: structuredClone(estado) }
      }
      estado = { ...estadoInicial(), enMarcha: true, desde: desde ?? null, limite: limite ?? null }
      void pasada(estado.desde, estado.limite)
      return { lanzada: true, estado: structuredClone(estado) }
    },
    /** Cuántos adjuntos pediría la pasada y cuánto pesan, sin Zoho ni escritura (`limite=0`, S-3). Sin directorio válido, todo es pendiente. */
    async recuento({ desde }: { desde?: number } = {}): Promise<RecuentoAdjuntos> {
      const r: RecuentoAdjuntos = { pendientes: 0, bytes: 0, mb: 0, sinTamano: 0, sinRuta: 0, yaPresentes: 0 }
      for (const f of await lista(desde ?? null)) {
        if (!NOMBRE_ADJUNTO.test(f.id)) continue   // la pasada lo cuenta fallido:id; aquí no es ni pendiente ni sin ruta
        if (typeof f.zoho_href !== 'string' || !RUTA_ADJUNTO_ZOHO.test(f.zoho_href)) { r.sinRuta++; continue }
        if (dir !== null && await estadoCopia(dir, f, fs) === 'presente') { r.yaPresentes++; continue }
        r.pendientes++
        if (f.size === null || f.size === undefined || f.size === '') r.sinTamano++
        else r.bytes += Number(f.size)
      }
      r.mb = r.bytes / MB
      return r
    },
    estado(): EstadoRellenoAdjuntos { return structuredClone(estado) },
  }
}
