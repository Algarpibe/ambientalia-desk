import { describe, it, expect, vi, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './db/migrate'
import { upsertConversation } from './db/repo'
import { conversationRowFromZoho } from './db/mappers'
import {
  esperadoDeZoho, leerConversaciones, guardarYReflejar, instanteBase,
  LIMITE_CONVERSACIONES, TOPE_PAGINAS_CONVERSACIONES, PAUSA_429_MS, REINTENTOS_429, PAUSA_ENTRE_TICKETS_MS,
} from './conversaciones'

/**
 * sync-conversaciones-zoho (1G-01, RQ-ZS-25 y RQ-ZS-26). Las funciones de `conversaciones.ts` se prueban sin
 * `createSync`: la lectura paginada con una `zohoFetch` falsa ENRUTADA POR RUTA (mira `from` y `limit`, no el
 * orden de llamada) y el reflejo de lo ausente contra pg-mem. Las filas previas llevan `created_at` explícito
 * en el pasado, para que la guarda de «guardada antes de empezar a leer» (S-15) no dependa del milisegundo.
 */
const PASADO = '2026-01-01T00:00:00.000Z'
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const vacio = (status = 204) => new Response(null, { status })
const conv = (id: string) => ({ id, type: 'comment', content: 'c' + id, commentedTime: '2026-10-01T10:00:00.000Z', commenter: { name: 'A', type: 'AGENT' }, visibility: 'public' })
const ids = (prefijo: string, desde: number, hasta: number) => Array.from({ length: hasta - desde }, (_, i) => prefijo + (desde + i))

/** `zohoFetch` falso que sirve `total` conversaciones, `c0`…`c{total-1}`, troceadas por `from` y `limit` de la petición. */
function servidor(total: number, opciones: { fallaEn?: number; vacioDesde?: number } = {}) {
  const peticiones: string[] = []
  const zohoFetch = vi.fn(async (path: string) => {
    peticiones.push(path)
    const q = new URLSearchParams(path.split('?')[1])
    const from = Number(q.get('from')); const limit = Number(q.get('limit'))
    if (opciones.fallaEn === from) return json({}, 500)
    const data = ids('c', from, Math.min(from + limit, total)).map(conv)
    if (!data.length) return vacio()
    return json({ data })
  })
  return { zohoFetch, peticiones }
}

describe('constantes', () => {
  it('fijan los números de S-5, S-6 y S-9', () => {
    expect([LIMITE_CONVERSACIONES, TOPE_PAGINAS_CONVERSACIONES, PAUSA_429_MS, REINTENTOS_429, PAUSA_ENTRE_TICKETS_MS]).toEqual([100, 20, 2000, 3, 150])
  })
})

describe('esperadoDeZoho', () => {
  it('suma commentCount y threadCount cuando son números', () => {
    expect(esperadoDeZoho({ commentCount: 5, threadCount: 1 })).toBe(6)
    expect(esperadoDeZoho({ commentCount: 0, threadCount: 0 })).toBe(0)
  })
  it('acepta texto numérico', () => {
    expect(esperadoDeZoho({ commentCount: '4', threadCount: '2' })).toBe(6)
  })
  it('acepta el jsonb como texto (pg-mem lo entrega así)', () => {
    expect(esperadoDeZoho(JSON.stringify({ commentCount: 5, threadCount: 3 }))).toBe(8)
  })
  it('si falta uno de los dos recuentos es null, no cero', () => {
    expect(esperadoDeZoho({ commentCount: 5 })).toBeNull()
    expect(esperadoDeZoho({ threadCount: 5 })).toBeNull()
    expect(esperadoDeZoho({})).toBeNull()
  })
  it('null, indefinido, texto que no es JSON o un valor que no es objeto dan null', () => {
    expect(esperadoDeZoho(null)).toBeNull()
    expect(esperadoDeZoho(undefined)).toBeNull()
    expect(esperadoDeZoho('no es json')).toBeNull()
    expect(esperadoDeZoho(7)).toBeNull()
  })
  it('un recuento no numérico, nulo, fraccionario o infinito da null', () => {
    expect(esperadoDeZoho({ commentCount: 'cinco', threadCount: 0 })).toBeNull()
    expect(esperadoDeZoho({ commentCount: null, threadCount: 0 })).toBeNull()
    expect(esperadoDeZoho({ commentCount: 1.5, threadCount: 0 })).toBeNull()
    expect(esperadoDeZoho({ commentCount: Infinity, threadCount: 0 })).toBeNull()
    expect(esperadoDeZoho({ commentCount: '', threadCount: 0 })).toBeNull()
  })
  it('un recuento negativo da null', () => {
    expect(esperadoDeZoho({ commentCount: -1, threadCount: 3 })).toBeNull()
  })
})

describe('leerConversaciones', () => {
  it('250 conversaciones llegan en tres páginas con from=0, 100 y 200 y limit=100', async () => {
    const s = servidor(250)
    const l = await leerConversaciones(s.zohoFetch, 'T1')
    expect(s.peticiones).toEqual([
      '/tickets/T1/conversations?from=0&limit=100',
      '/tickets/T1/conversations?from=100&limit=100',
      '/tickets/T1/conversations?from=200&limit=100',
    ])
    expect(l.items.map((i) => i.id)).toEqual(ids('c', 0, 250))
    expect(l.error).toBeNull()
    expect(l.por429).toBe(false)
  })
  it('200 exactas piden una tercera página, que responde 204, y la lista queda completa', async () => {
    const s = servidor(200)
    const l = await leerConversaciones(s.zohoFetch, 'T1')
    expect(s.peticiones).toHaveLength(3)
    expect(l.items).toHaveLength(200)
    expect(l.error).toBeNull()
  })
  it('una página corta termina a la primera', async () => {
    const s = servidor(40)
    const l = await leerConversaciones(s.zohoFetch, 'T1')
    expect(s.peticiones).toHaveLength(1)
    expect(l.items).toHaveLength(40)
  })
  it('un 500 en la segunda devuelve las 100 de la primera y el error con el texto de siempre', async () => {
    const s = servidor(250, { fallaEn: 100 })
    const l = await leerConversaciones(s.zohoFetch, 'T7')
    expect(l.items).toHaveLength(100)
    expect(l.error).toBe('Zoho /tickets/T7/conversations 500')
    expect(l.por429).toBe(false)
    expect(s.peticiones).toHaveLength(2)
  })
  it('el tope de 20 páginas da error y no pide la 21', async () => {
    const s = servidor(100_000)
    const l = await leerConversaciones(s.zohoFetch, 'T1')
    expect(s.peticiones).toHaveLength(20)
    expect(s.peticiones[19]).toBe('/tickets/T1/conversations?from=1900&limit=100')
    expect(l.items).toHaveLength(2000)
    expect(l.error).toBe('tope de 20 páginas')
  })
  it('un 429 con reintentos repite la MISMA página y sigue', async () => {
    const peticiones: string[] = []
    let n = 0
    const zohoFetch = vi.fn(async (path: string) => {
      peticiones.push(path)
      return n++ === 0 ? json({}, 429) : json({ data: ids('c', 0, 3).map(conv) })
    })
    const l = await leerConversaciones(zohoFetch, 'T1', { reintentos429: 3, pausa429Ms: 0 })
    expect(peticiones).toEqual(['/tickets/T1/conversations?from=0&limit=100', '/tickets/T1/conversations?from=0&limit=100'])
    expect(l.items).toHaveLength(3)
    expect(l.error).toBeNull()
    expect(l.por429).toBe(false)
  })
  it('un 429 sin reintentos es error y por429', async () => {
    const zohoFetch = vi.fn(async () => json({}, 429))
    const l = await leerConversaciones(zohoFetch, 'T1')
    expect(zohoFetch).toHaveBeenCalledTimes(1)
    expect(l.error).toBe('Zoho /tickets/T1/conversations 429')
    expect(l.por429).toBe(true)
    expect(l.items).toEqual([])
  })
  it('cuatro 429 seguidos con tres reintentos agotan y marcan por429', async () => {
    const zohoFetch = vi.fn(async () => json({}, 429))
    const l = await leerConversaciones(zohoFetch, 'T1', { reintentos429: 3, pausa429Ms: 0 })
    expect(zohoFetch).toHaveBeenCalledTimes(4)
    expect(l.por429).toBe(true)
    expect(l.error).toBe('Zoho /tickets/T1/conversations 429')
  })
  it('una excepción de red en la segunda página no lanza: devuelve lo recibido y el mensaje', async () => {
    let n = 0
    const zohoFetch = vi.fn(async () => {
      if (n++ === 0) return json({ data: ids('c', 0, 100).map(conv) })
      throw new Error('ECONNRESET')
    })
    const l = await leerConversaciones(zohoFetch, 'T1')
    expect(l.items).toHaveLength(100)
    expect(l.error).toContain('ECONNRESET')
  })
})

let db: Queryable
let errores: ReturnType<typeof vi.spyOn>
beforeEach(async () => {
  const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db)
  vi.restoreAllMocks()
  errores = vi.spyOn(console, 'error').mockImplementation(() => {})
})
const textoErrores = () => errores.mock.calls.map((c) => c.map(String).join(' ')).join('\n')
const fila = (id: string, ticket: string, source = 'zoho', creada = PASADO) =>
  db.query('INSERT INTO conversations (id, ticket_id, source, created_at) VALUES ($1, $2, $3, $4)', [id, ticket, source, creada])
const adjunto = (id: string, conversacion: string, ticket: string) =>
  db.query('INSERT INTO attachments (id, conversation_id, ticket_id) VALUES ($1, $2, $3)', [id, conversacion, ticket])
const marcadas = async (ticket: string) =>
  ((await db.query('SELECT id FROM conversations WHERE ticket_id=$1 AND ausente_en_zoho_at IS NOT NULL ORDER BY id', [ticket])).rows as { id: string }[]).map((r) => r.id)
const cuenta = async (tabla: 'conversations' | 'attachments') => Number(((await db.query(`SELECT count(*) AS n FROM ${tabla}`)).rows[0] as { n: unknown }).n)
const lista = (idsRecibidos: string[], error: string | null = null) => ({ items: idsRecibidos.map(conv), error, por429: false })
const HILO = '495552000057899091'

describe('instanteBase', () => {
  it('devuelve el reloj de la base como fecha', async () => {
    const antes = Date.now()
    const t = await instanteBase(db)
    expect(t).toBeInstanceOf(Date)
    expect(Math.abs(t.getTime() - antes)).toBeLessThan(60_000)
  })
})

describe('guardarYReflejar · lo recibido', () => {
  it('guarda cada conversación con sus adjuntos aunque no marque', async () => {
    const inicio = await instanteBase(db)
    const c = { ...conv('x1'), attachments: [{ id: 'a1', name: 'f.pdf', size: '10', href: 'https://desk.zoho.com/api/v1/tickets/T1/attachments/a1' }] }
    const r = await guardarYReflejar(db, 'T1', { items: [c], error: null, por429: false }, { esperado: 1, marcar: false, inicio })
    expect(r).toEqual({ marcadas: [], completa: true })
    expect(await cuenta('conversations')).toBe(1)
    expect(await cuenta('attachments')).toBe(1)
  })
})

describe('guardarYReflejar · reflejo de lo ausente (RQ-ZS-26)', () => {
  it('#958: cinco comentarios y el hilo guardados, Zoho devuelve los cinco → marca el hilo y sólo él, sin borrar nada', async () => {
    const cinco = ids('c', 0, 5)
    for (const id of [...cinco, HILO]) await fila(id, '958')
    await adjunto('att-hilo', HILO, '958'); await adjunto('att-c0', 'c0', '958')
    const inicio = await instanteBase(db)
    const r = await guardarYReflejar(db, '958', lista(cinco), { esperado: 5, marcar: true, inicio })
    expect(r).toEqual({ marcadas: [HILO], completa: true })
    expect(await marcadas('958')).toEqual([HILO])
    expect(await cuenta('conversations')).toBe(6)
    expect(await cuenta('attachments')).toBe(2)
  })
  it('un recuento que no coincide no marca nada y el log dice ticket, recibidos y contados', async () => {
    for (const id of [...ids('c', 0, 5), HILO]) await fila(id, '958')
    const inicio = await instanteBase(db)
    const r = await guardarYReflejar(db, '958', lista(ids('c', 0, 5)), { esperado: 6, marcar: true, inicio })
    expect(r.completa).toBe(false)
    expect(await marcadas('958')).toEqual([])
    const log = textoErrores()
    expect(log).toContain('958')
    expect(log).toContain('recibidos 5')
    expect(log).toContain('Zoho cuenta 6')
  })
  it('un recuento ausente (null) no vale cero: no marca y el log dice «sin recuento»', async () => {
    await fila('viejo1', 'T2'); await fila('viejo2', 'T2')
    const inicio = await instanteBase(db)
    const r = await guardarYReflejar(db, 'T2', lista([]), { esperado: null, marcar: true, inicio })
    expect(r).toEqual({ marcadas: [], completa: false })
    expect(await marcadas('T2')).toEqual([])
    expect(textoErrores()).toContain('sin recuento')
  })
  it('con el recuento 0 de verdad y lista vacía, las dos filas guardadas sí se marcan', async () => {
    await fila('viejo1', 'T2'); await fila('viejo2', 'T2')
    const inicio = await instanteBase(db)
    const r = await guardarYReflejar(db, 'T2', lista([]), { esperado: 0, marcar: true, inicio })
    expect(r.completa).toBe(true)
    expect(await marcadas('T2')).toEqual(['viejo1', 'viejo2'])
  })
  it('una lista con error nunca marca, aunque el recuento de lo recibido coincida', async () => {
    for (const id of [...ids('c', 0, 3), 'sobra']) await fila(id, 'T3')
    const inicio = await instanteBase(db)
    const r = await guardarYReflejar(db, 'T3', lista(ids('c', 0, 3), 'Zoho /tickets/T3/conversations 500'), { esperado: 3, marcar: true, inicio })
    expect(r.completa).toBe(false)
    expect(await marcadas('T3')).toEqual([])
    expect(textoErrores()).toContain('Zoho /tickets/T3/conversations 500')
  })
  it('con marcar apagado no marca aunque la lista esté completa, y no escribe log', async () => {
    for (const id of [...ids('c', 0, 5), HILO]) await fila(id, '958')
    const inicio = await instanteBase(db)
    const r = await guardarYReflejar(db, '958', lista(ids('c', 0, 5)), { esperado: 5, marcar: false, inicio })
    expect(r.marcadas).toEqual([])
    expect(await marcadas('958')).toEqual([])
    expect(errores).not.toHaveBeenCalled()
  })
  it('una fila marcada que Zoho vuelve a devolver se desmarca, con marcar encendido y con marcar apagado', async () => {
    for (const marcar of [true, false]) {
      await db.query('DELETE FROM conversations')
      await fila('c0', 'T4'); await fila('c1', 'T4')
      await db.query("UPDATE conversations SET ausente_en_zoho_at = now() WHERE id = 'c0'")
      expect(await marcadas('T4')).toEqual(['c0'])
      const inicio = await instanteBase(db)
      await guardarYReflejar(db, 'T4', lista(['c0', 'c1']), { esperado: 2, marcar, inicio })
      expect(await marcadas('T4')).toEqual([])
    }
  })
  it('upsertConversation, por sí solo, desmarca la fila que vuelve a guardar', async () => {
    await fila('c0', 'T4')
    await db.query("UPDATE conversations SET ausente_en_zoho_at = now() WHERE id = 'c0'")
    await upsertConversation(db, conversationRowFromZoho(conv('c0'), 'T4'))
    expect(await marcadas('T4')).toEqual([])
  })
  it('una fila source=app nunca se marca', async () => {
    await fila('c0', 'T5'); await fila('app1', 'T5', 'app')
    const inicio = await instanteBase(db)
    const r = await guardarYReflejar(db, 'T5', lista(['c0']), { esperado: 1, marcar: true, inicio })
    expect(r.marcadas).toEqual([])
    expect(await marcadas('T5')).toEqual([])
  })
  it('una fila con created_at posterior a inicio no se marca; la anterior que no vino sí', async () => {
    await fila('c0', 'T6'); await fila('vieja', 'T6')
    const inicio = await instanteBase(db)
    await fila('nueva', 'T6', 'zoho', new Date(inicio.getTime() + 3_600_000).toISOString())
    const r = await guardarYReflejar(db, 'T6', lista(['c0']), { esperado: 1, marcar: true, inicio })
    expect(r.marcadas).toEqual(['vieja'])
    expect(await marcadas('T6')).toEqual(['vieja'])
  })
  it('las filas de otro ticket no se tocan', async () => {
    await fila('c0', 'T7'); await fila('ajena', 'OTRO')
    const inicio = await instanteBase(db)
    await guardarYReflejar(db, 'T7', lista(['c0']), { esperado: 1, marcar: true, inicio })
    expect(await marcadas('OTRO')).toEqual([])
  })
  it('un id repetido entre páginas cuenta una vez: dos ids únicos con esperado 2 es lista completa', async () => {
    await fila('c0', 'T8'); await fila('c1', 'T8'); await fila('fuera', 'T8')
    const inicio = await instanteBase(db)
    const r = await guardarYReflejar(db, 'T8', lista(['c0', 'c1', 'c0']), { esperado: 2, marcar: true, inicio })
    expect(r.completa).toBe(true)
    expect(r.marcadas).toEqual(['fuera'])
  })
  it('tres elementos con un repetido NO completan un recuento de 3 (cuenta únicos, no elementos)', async () => {
    await fila('c0', 'T8'); await fila('c1', 'T8'); await fila('fuera', 'T8')
    const inicio = await instanteBase(db)
    const r = await guardarYReflejar(db, 'T8', lista(['c0', 'c1', 'c0']), { esperado: 3, marcar: true, inicio })
    expect(r.completa).toBe(false)
    expect(await marcadas('T8')).toEqual([])
  })
  it('M1: 151 guardadas y 150 recibidas en dos páginas marcan exactamente 1 (con la lista parcial serían 0)', async () => {
    for (const id of ids('c', 0, 151)) await fila(id, 'T9')
    const inicio = await instanteBase(db)
    const completa = await leerConversaciones(servidor(150).zohoFetch, 'T9')
    const r = await guardarYReflejar(db, 'T9', completa, { esperado: 150, marcar: true, inicio })
    expect(r).toEqual({ marcadas: ['c150'], completa: true })
    expect(await marcadas('T9')).toEqual(['c150'])
  })
})
