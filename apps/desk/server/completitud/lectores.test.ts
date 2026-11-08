import { describe, it, expect, afterEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate } from '@ambientalia/zoho-sync/db/migrate'
import { eventId, upsertHistoryEvent } from '@ambientalia/zoho-sync/db/history'
import { compararIds } from './comparar'
import { leerConversacionesDe, leerPaginas, leerPorId } from './lectores'

/**
 * verificacion-completitud (1G-03, D5, D6, RQ-ZS-37, CA-4) · lectores de Zoho de sólo lectura que nunca lanzan.
 * QUÉ COMPRUEBA: `429` reintentado ANTES de `404` y de `!res.ok` (con pausa de 2.000 ms), agotado ⇒ `corte`; `404` por id ⇒ `noEsta` y en una lista ⇒ error;
 * `from=1`, deduplicación, vacío y `204`, tope de 200 páginas; motivos de un conjunto cerrado (nunca `e.message`, que puede citar el cuerpo);
 * `reintentos429` siempre pasado a `leerConversaciones`; y que la historia casa por el id que escribe `upsertHistoryEvent`.
 * QUÉ NO COMPRUEBA: qué hace el motor con el resultado (L4-L5). Sin red: `zohoFetch` falsa; las pausas, a 0 o con reloj falso.
 */
const MARCADOR = 'marcador-secreto-9921'
type Paso = number | Error | { estado: number; cuerpo: unknown }
const respuesta = (p: Exclude<Paso, Error>) => {
  const { estado, cuerpo } = typeof p === 'number' ? { estado: p, cuerpo: '' } : p
  return new Response(estado === 204 ? null : typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo), { status: estado })
}
/** Zoho falso: sirve los pasos en orden (el último se repite) y registra cada ruta y cuántos argumentos recibió. */
function zoho(...pasos: Paso[]) {
  const rutas: string[] = []; const argumentos: number[] = []
  const f = async (...args: [string, RequestInit?]) => {
    rutas.push(args[0]); argumentos.push(args.length)
    const p = pasos[Math.min(rutas.length - 1, pasos.length - 1)]
    if (p instanceof Error) throw p
    return respuesta(p)
  }
  return { f, rutas, argumentos }
}
const pagina = (desde: number, n: number) => ({ estado: 200, cuerpo: { data: Array.from({ length: n }, (_, i) => ({ id: String(desde + i) })) } })
const SIN_PAUSA = { pausa429Ms: 0 }

afterEach(() => { vi.useRealTimers() })

describe('leerPorId · 429, luego 404, luego !res.ok', () => {
  it('429, 429, 404 ⇒ «no está» tras DOS pausas de 2.000 ms, no antes', async () => {
    vi.useFakeTimers()
    const z = zoho(429, 429, 404)
    const p = leerPorId(z.f, '/tickets/1')
    await vi.advanceTimersByTimeAsync(1999); expect(z.rutas).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(1); expect(z.rutas).toHaveLength(2)
    await vi.advanceTimersByTimeAsync(2000)
    expect(await p).toEqual({ estado: 'noEsta' })
    expect(z.rutas).toEqual(['/tickets/1', '/tickets/1', '/tickets/1'])
  })

  it('429, 500 ⇒ error de ese recurso tras la pausa, no «no está»', async () => {
    const z = zoho(429, 500)
    expect(await leerPorId(z.f, '/tickets/77', SIN_PAUSA)).toEqual({ estado: 'error', motivo: 'tickets http 500' })
    expect(z.rutas).toHaveLength(2)
  })

  it('404 a la primera ⇒ «no está»; vivo con isDeleted o isTrashed (booleano o texto) ⇒ «no está»; vivo ⇒ el dato', async () => {
    expect(await leerPorId(zoho(404).f, '/contacts/5', SIN_PAUSA)).toEqual({ estado: 'noEsta' })
    for (const marca of [{ isDeleted: true }, { isTrashed: 'true' }]) expect(await leerPorId(zoho({ estado: 200, cuerpo: { id: '5', ...marca } }).f, '/contacts/5', SIN_PAUSA)).toEqual({ estado: 'noEsta' })
    expect(await leerPorId(zoho({ estado: 200, cuerpo: { id: '5', isDeleted: false } }).f, '/contacts/5', SIN_PAUSA)).toEqual({ estado: 'vivo', dato: { id: '5', isDeleted: false } })
  })

  it('429 agotado (tres repeticiones) ⇒ corte, con cuatro peticiones', async () => {
    const z = zoho(429)
    expect(await leerPorId(z.f, '/tickets/9', SIN_PAUSA)).toEqual({ estado: 'corte' })
    expect(z.rutas).toHaveLength(4)
  })

  it('motivos cerrados: red y json no llevan el mensaje, que puede citar el cuerpo; el id no entra en el motivo', async () => {
    expect(await leerPorId(zoho(new Error(MARCADOR)).f, '/tickets/123456', SIN_PAUSA)).toEqual({ estado: 'error', motivo: 'red' })
    expect(await leerPorId(zoho({ estado: 200, cuerpo: `{"asunto": "${MARCADOR}` }).f, '/tickets/123456', SIN_PAUSA)).toEqual({ estado: 'error', motivo: 'json' })
    expect(await leerPorId(zoho(503).f, '/tickets/123456', SIN_PAUSA)).toEqual({ estado: 'error', motivo: 'tickets http 503' })
  })

  it('llama a zohoFetch sin init (un solo argumento)', async () => {
    const z = zoho({ estado: 200, cuerpo: { id: '1' } })
    await leerPorId(z.f, '/tickets/1', SIN_PAUSA)
    expect(z.argumentos).toEqual([1])
  })
})

describe('leerPaginas', () => {
  it('empieza en from=1, avanza de limit en limit hasta la página corta y no repite ids', async () => {
    const z = zoho(pagina(1, 2), { estado: 200, cuerpo: { data: [{ id: '2' }, { id: '3' }] } }, pagina(4, 1))
    const r = await leerPaginas(z.f, '/tickets', { departmentId: 'D1' }, 2, SIN_PAUSA)
    expect(z.rutas).toEqual(['/tickets?departmentId=D1&from=1&limit=2', '/tickets?departmentId=D1&from=3&limit=2', '/tickets?departmentId=D1&from=5&limit=2'])
    expect(r).toMatchObject({ estado: 'ok' })
    expect(r.estado === 'ok' && r.items.map((i) => i.id)).toEqual(['1', '2', '3', '4'])
  })

  it('un 200 vacío y un 204 son una página vacía, no un error', async () => {
    for (const vacio of [{ estado: 200, cuerpo: '' }, 204, { estado: 200, cuerpo: {} }]) expect(await leerPaginas(zoho(vacio).f, '/contacts', {}, 100, SIN_PAUSA)).toEqual({ estado: 'ok', items: [] })
  })

  it('429 se reintenta la MISMA petición antes de decidir; agotado ⇒ corte', async () => {
    const z = zoho(429, pagina(1, 1))
    expect(await leerPaginas(z.f, '/tickets', {}, 100, SIN_PAUSA)).toMatchObject({ estado: 'ok' })
    expect(z.rutas[0]).toBe(z.rutas[1])
    expect(await leerPaginas(zoho(429).f, '/tickets', {}, 100, SIN_PAUSA)).toEqual({ estado: 'corte' })
  })

  it('en una lista, 404 y 500 son error de ese recurso (el id del ticket no entra en el motivo)', async () => {
    expect(await leerPaginas(zoho(404).f, '/tickets/555/History', {}, 50, SIN_PAUSA)).toEqual({ estado: 'error', motivo: 'tickets/History http 404' })
    expect(await leerPaginas(zoho(429, 500).f, '/tickets/555/attachments', {}, 100, SIN_PAUSA)).toEqual({ estado: 'error', motivo: 'tickets/attachments http 500' })
  })

  it('tope de 200 páginas ⇒ error `tope`, con exactamente 200 peticiones', async () => {
    const z = zoho({ estado: 200, cuerpo: { data: [{ id: 'a' }, { id: 'b' }] } })
    const r = await leerPaginas(z.f, '/tickets', {}, 2, SIN_PAUSA)
    expect(r).toEqual({ estado: 'error', motivo: 'tope' })
    expect(z.rutas).toHaveLength(200)
  })

  it('motivos cerrados: red, json y un ítem sin id; ninguno lleva el mensaje', async () => {
    expect(await leerPaginas(zoho(new Error(MARCADOR)).f, '/tickets', {}, 100, SIN_PAUSA)).toEqual({ estado: 'error', motivo: 'red' })
    expect(await leerPaginas(zoho({ estado: 200, cuerpo: `[${MARCADOR}` }).f, '/tickets', {}, 100, SIN_PAUSA)).toEqual({ estado: 'error', motivo: 'json' })
    expect(await leerPaginas(zoho({ estado: 200, cuerpo: { data: [{ subject: MARCADOR }] } }).f, '/tickets', {}, 100, SIN_PAUSA)).toEqual({ estado: 'error', motivo: 'forma' })
  })
})

describe('leerConversacionesDe · sobre leerConversaciones', () => {
  it('pasa SIEMPRE los reintentos: 429, 429, página ⇒ ok (por omisión no reintenta); from=0 tal cual', async () => {
    const z = zoho(429, 429, pagina(1, 2))
    const r = await leerConversacionesDe(z.f, '7', SIN_PAUSA)
    expect(r.estado === 'ok' && r.items.map((i) => i.id)).toEqual(['1', '2'])
    expect(z.rutas).toEqual(Array(3).fill('/tickets/7/conversations?from=0&limit=100'))
  })

  it('Zoho repite la última de cada página con from=0: se cuenta por id único', async () => {
    const r = await leerConversacionesDe(zoho(pagina(1, 100), pagina(100, 1)).f, '7', SIN_PAUSA)
    expect(r.estado === 'ok' && r.items).toHaveLength(100)
  })

  it('429 agotado ⇒ corte; los errores de leerConversaciones pasan a un conjunto cerrado', async () => {
    expect(await leerConversacionesDe(zoho(429).f, '7', SIN_PAUSA)).toEqual({ estado: 'corte' })
    expect(await leerConversacionesDe(zoho(500).f, '7', SIN_PAUSA)).toEqual({ estado: 'error', motivo: 'conversaciones http 500' })
    expect(await leerConversacionesDe(zoho(pagina(1, 100)).f, '7', SIN_PAUSA)).toEqual({ estado: 'error', motivo: 'conversaciones tope' })
    for (const roto of [new Error(MARCADOR), { estado: 200, cuerpo: `{"a": "${MARCADOR}` }]) expect(await leerConversacionesDe(zoho(roto).f, '7', SIN_PAUSA)).toEqual({ estado: 'error', motivo: 'conversaciones red' })
  })
})

describe('historia · CA-4 con el upsertHistoryEvent real', () => {
  it('el evento guardado casa por el id derivado; el de Zoho sin guardar sale «falta en Desk»; el repetido cuenta una vez', async () => {
    const pg = newDb().adapters.createPg(); const db = new pg.Pool(); await migrate(db)
    const guardado = { eventName: 'TicketUpdate', eventTime: '2026-11-01T10:00:00Z', eventInfo: [{ propertyName: 'Status', propertyValue: 'Open' }] }
    const nuevo = { eventName: 'CommentAdded', eventTime: '2026-11-02T11:00:00Z', eventInfo: [{ propertyName: 'CommentType', propertyValue: 'Public' }] }
    await upsertHistoryEvent(db, 't1', guardado)
    const enDesk = (await db.query("SELECT id FROM ticket_history WHERE ticket_id = 't1'")).rows.map((r: { id: string }) => r.id)
    expect(enDesk).toEqual([eventId('t1', guardado)])
    const clave = (e: Record<string, unknown>) => eventId('t1', e)
    const r = await leerPaginas(zoho({ estado: 200, cuerpo: { data: [guardado, nuevo, guardado] } }).f, '/tickets/t1/History', {}, 50, { ...SIN_PAUSA, clave })
    const ids = r.estado === 'ok' ? r.items.map(clave) : []
    expect(ids).toHaveLength(2)
    expect(compararIds(ids, enDesk)).toEqual({ faltaEnDesk: [eventId('t1', nuevo)], faltaEnZoho: [], casan: 1 })
  })
})
