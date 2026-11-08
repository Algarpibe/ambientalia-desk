import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { crearVerificacionCompletitud, type EstadoVerificacion, type Informe } from './verificacion'

/**
 * verificacion-completitud (1G-03, D9, D10, RQ-ZS-36, RQ-ZS-37, RQ-ZS-38) · el motor, fase C (volumen) y continuación.
 * QUÉ COMPRUEBA: la fase C con `fs` inyectado (sinCopia, ausente, otroTamano, sin descargar; `dir` nulo ⇒ «sin comparar» con ADJUNTOS_DIR; el fallo de disco
 * sale con el código de Node y sin la ruta), el adjuntos como el peor de sus dos partes, CA-7 (corte, error por ticket y parte previa perdida son «incompleto»
 * aunque no haya «sin explicar»), la continuación (`?limite` y luego `desde=<cortadoEn>` dan UNA pasada completa, sin repetir la A), CA-9 (`429` agotado corta y
 * `desde` reanuda) y CA-12 (dos pasadas iguales). QUÉ NO COMPRUEBA: la ruta (verificacionRutas.test.ts). Pg-mem, `zohoFetch` y `fs` falsos, sin red.
 */
type Cuerpo = unknown[] | number | Response
type Salida = Cuerpo | ((n: number) => Cuerpo)
const responder = (s: Cuerpo) => (s instanceof Response ? s : Array.isArray(s) ? new Response(JSON.stringify({ data: s })) : new Response('', { status: s }))
function zoho(tabla: Record<string, Salida>) {
  const rutas: string[] = []; const inits: unknown[] = []; const cuenta = new Map<string, number>()
  const f = async (path: string, init?: RequestInit) => {
    rutas.push(path); inits.push(init); const p = path.split('?')[0]; const n = (cuenta.get(p) ?? 0) + 1; cuenta.set(p, n)
    const s = tabla[p] ?? 404
    return responder(typeof s === 'function' ? s(n) : s)
  }
  return { f, rutas, inits, pedidos: (p: string) => rutas.filter((r) => r.split('?')[0] === p).length }
}
const VACIAS: Record<string, Salida> = { '/tickets': [], '/tickets/archivedTickets': [], '/contacts': [], '/accounts': [] }
const zt = (n: number) => ({ id: String(n), ticketNumber: String(n) })
const hijos = (id: string, h: { conv?: Salida; adj?: Salida } = {}): Record<string, Salida> =>
  ({ [`/tickets/${id}/conversations`]: h.conv ?? [], [`/tickets/${id}/attachments`]: h.adj ?? [], [`/tickets/${id}/History`]: [] })
const lista = (entradas: unknown[]) => JSON.stringify({ version: 1, entradas })
const DIR = '/volumen-secreto-8842'

/** `fs` falso: el tamaño del fichero por id, o el fallo de `stat` con su código de Node y la ruta dentro del mensaje (que NO debe salir). */
type Copia = number | { code: string }
function fsFalso(copias: Record<string, Copia>) {
  const pedidos: string[] = []
  const fs = { stat: async (p: string) => {
    const id = p.split(/[\\/]/).pop() ?? ''; pedidos.push(id); const c = copias[id]
    if (c === undefined) throw Object.assign(new Error(`ENOENT: no such file, stat '${p}'`), { code: 'ENOENT' })
    if (typeof c !== 'number') throw Object.assign(new Error(`${c.code}: permission denied, stat '${p}'`), { code: c.code })
    return { isFile: () => true, size: c }
  } }
  return { fs: fs as never, pedidos }
}

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

const ticketDesk = (id: string, numero: number) => db.query('INSERT INTO tickets (id, number, status) VALUES ($1, $2, $3)', [id, numero, 'Abierto'])
const adjDesk = (id: string, ticket: string, size: number | null, storage: string | null) =>
  db.query('INSERT INTO attachments (id, ticket_id, size, storage_path) VALUES ($1, $2, $3, $4)', [id, ticket, size, storage])

function montar(tabla: Record<string, Salida> = {}, copias: Record<string, Copia> = {}, extra: Partial<Parameters<typeof crearVerificacionCompletitud>[0]> = {}) {
  const z = zoho({ ...VACIAS, ...tabla }); const registrado: EstadoVerificacion[] = []; const d = fsFalso(copias)
  const v = crearVerificacionCompletitud({ zohoFetch: z.f, db, departmentId: '77', dir: DIR, fs: d.fs, pausaMs: 0, pausa429Ms: 0, registrar: (r) => registrado.push(r), ...extra })
  return { v, z, d, registrado }
}
type Montaje = ReturnType<typeof montar>
async function esperar(v: { estado(): EstadoVerificacion }): Promise<EstadoVerificacion> {
  for (let i = 0; i < 5000 && !v.estado().terminado; i++) await new Promise<void>((r) => setImmediate(r))
  expect(v.estado().terminado).toBe(true)
  return v.estado()
}
async function correr(m: Montaje, opciones: { desde?: number; limite?: number } = {}): Promise<Informe> {
  expect(m.v.lanzar(opciones).lanzada).toBe(true)
  const { informe } = await esperar(m.v)
  if (!informe) throw new Error('la pasada no dejó informe')
  return informe
}
const ids = (filas: { id: string }[]) => filas.map((f) => f.id)
/** El informe sin lo que difiere entre dos pasadas iguales: instantes y peticiones (CA-12). */
function estable(i: Informe): unknown {
  const c = structuredClone(i) as unknown as { entidades: Record<string, Record<string, unknown>> } & Record<string, unknown>
  delete c.peticiones; delete c.vistos429
  for (const e of Object.values(c.entidades)) { delete e.peticiones; delete e.vistos429 }
  return c
}

/** Los tres tickets 10, 20 y 30 en los dos lados, sin diferencia alguna (el verde sólo lo quitan el corte, el error o la parte perdida). */
async function limpios(extra: Record<string, Salida> = {}) {
  for (const n of [10, 20, 30]) await ticketDesk(String(n), n)
  return { '/tickets': [zt(10), zt(20), zt(30)], ...hijos('10'), ...hijos('20'), ...hijos('30'), ...extra } as Record<string, Salida>
}

describe('fase C · el volumen se juzga con estadoCopia, sin descargar nada', () => {
  async function tres() {
    await ticketDesk('1', 1)
    await adjDesk('4001', '1', 100, '4001'); await adjDesk('4002', '1', 100, '4002'); await adjDesk('4003', '1', 100, '4003'); await adjDesk('4004', '1', 100, null)
    return { '/tickets': [zt(1)], ...hijos('1', { adj: ['4001', '4002', '4003', '4004'].map((id) => ({ id, size: 100 })) }) }
  }

  it('sin copia, ausente y otro tamaño son diferencia de adjuntos.volumen; la íntegra no; ninguna petición descarga', async () => {
    const m = montar(await tres(), { 4001: 100, 4003: 50 })
    const a = (await correr(m)).entidades.adjuntos
    expect([ids(a.volumen?.sinCopia ?? []), ids(a.volumen?.ausente ?? []), ids(a.volumen?.otroTamano ?? []), a.volumen?.filas, a.volumen?.estado]).toEqual([['4004'], ['4002'], ['4003'], 4, 'rojo'])
    expect([a.casan, a.sinExplicar, a.estado]).toEqual([4, 0, 'rojo'])
    expect(m.d.pedidos).toEqual(['4001', '4002', '4003'])
    expect(m.z.rutas.some((r) => r.includes('/content'))).toBe(false)
    expect(m.z.inits.every((x) => x === undefined)).toBe(true)
  })

  it('todas íntegras: volumen, adjuntos y el global son verdes y la cobertura es completa', async () => {
    await ticketDesk('1', 1); await adjDesk('4001', '1', 100, '4001')
    const i = await correr(montar({ '/tickets': [zt(1)], ...hijos('1', { adj: [{ id: '4001', size: 100 }] }) }, { 4001: 100 }))
    expect([i.entidades.adjuntos.volumen?.estado, i.entidades.adjuntos.volumen?.filas, i.entidades.adjuntos.estado, i.veredicto, i.cobertura.completa]).toEqual(['verde', 1, 'verde', 'verde', true])
  })

  it('una diferencia del volumen cubierta por su id sale conocida (volumen verde) y la entrada usada deja de estar «sin uso»; la otra sigue sin uso', async () => {
    const leerLista = () => lista([{ entidad: 'adjuntos', ids: ['4002'], causa: 'Zoho no tiene el fichero', entrada: 'E-1' }, { entidad: 'adjuntos', ids: ['9999'], causa: 'otra', entrada: 'E-2' }])
    await ticketDesk('1', 1); await adjDesk('4002', '1', 100, '4002')
    const i = await correr(montar({ '/tickets': [zt(1)], ...hijos('1', { adj: [{ id: '4002', size: 100 }] }) }, {}, { leerLista }))
    expect(i.entidades.adjuntos.volumen?.ausente).toMatchObject([{ id: '4002', clase: 'conocida', entrada: 'E-1' }])
    expect([i.entidades.adjuntos.volumen?.estado, i.conocidasSinUso]).toEqual(['verde', [{ indice: 1, entidad: 'adjuntos', entrada: 'E-2' }]])
  })

  it('sin ADJUNTOS_DIR el volumen queda «sin comparar» con ese motivo, adjuntos no es verde, el global es incompleto y no se mira el disco', async () => {
    await ticketDesk('1', 1); await adjDesk('4001', '1', 100, '4001')
    const m = montar({ '/tickets': [zt(1)], ...hijos('1', { adj: [{ id: '4001', size: 100 }] }) }, { 4001: 100 }, { dir: null })
    const i = await correr(m)
    expect([i.entidades.adjuntos.volumen?.estado, i.entidades.adjuntos.volumen?.motivo, i.entidades.adjuntos.estado, i.veredicto, i.cobertura.completa]).toEqual(['sin comparar', 'ADJUNTOS_DIR', 'sin comparar', 'incompleto', false])
    expect(m.d.pedidos).toEqual([])
  })

  it('un fallo de disco deja el volumen «sin comparar» con el código de Node y sin filas parciales; la ruta no sale en ninguna parte', async () => {
    const m = montar(await tres(), { 4001: 100, 4002: { code: 'EACCES' } })
    const e = await esperar((m.v.lanzar(), m.v))
    const v = e.informe?.entidades.adjuntos.volumen
    expect([v?.estado, v?.motivo, v?.filas, v?.sinCopia, v?.ausente, v?.otroTamano]).toEqual(['sin comparar', 'disco EACCES', 0, [], [], []])
    expect(e.informe?.veredicto).toBe('incompleto')
    expect(JSON.stringify(e) + JSON.stringify(m.registrado)).not.toMatch(/secreto|permission denied/)
  })
})

describe('CA-7 · cortada, con error por ticket o con la parte previa perdida es «incompleto», aunque no haya «sin explicar»', () => {
  it('cortada por 429 en el 20: incompleto, no completa, con cero «sin explicar»', async () => {
    const i = await correr(montar(await limpios({ '/tickets/20/conversations': 429 })))
    expect([i.cortadoEn, i.motivoCorte, i.cobertura.completa, i.cobertura.comparados, i.veredicto]).toEqual([{ fase: 'B', numero: 20 }, '429', false, 1, 'incompleto'])
    expect(Object.values(i.entidades).map((e) => e.sinExplicar)).toEqual([0, 0, 0, 0, 0, 0])
  })

  it('un error por ticket: incompleto, y el id y el número del ticket constan', async () => {
    const i = await correr(montar(await limpios({ '/tickets/20/conversations': 500 })))
    expect([i.errores.map((e) => [e.entidad, e.numero]), i.entidades.conversaciones.estado, i.veredicto]).toEqual([[['conversaciones', 20], ['adjuntos', 20]], 'incompleto', 'incompleto'])
  })

  it('con la parte previa perdida (un redespliegue vacía la memoria) `desde` es una pasada nueva y parcial: incompleto, nunca verde', async () => {
    const m = montar(await limpios())
    const i = await correr(m, { desde: 20 })
    expect([i.cobertura.desde, i.cobertura.comparados, i.cobertura.completa, i.veredicto, m.z.pedidos('/tickets')]).toEqual([20, 2, false, 'incompleto', 1])
    expect(i.conocidasSinUso).toEqual([])
  })

  it('los mismos datos sin corte, sin error y desde el principio son verdes (el contraejemplo de las tres)', async () => {
    const i = await correr(montar(await limpios()))
    expect([i.cobertura.completa, i.cobertura.comparados, i.veredicto]).toEqual([true, 3, 'verde'])
  })
})

describe('continuación · el corte en la B se reanuda con desde=<cortadoEn> sin repetir la A y funde las filas', () => {
  /** 10 y 30 con una diferencia «sin explicar» cada uno (la conversación que sólo está en Zoho): las filas de las dos mitades deben quedar en UN informe. */
  async function datos(extra: Record<string, Salida> = {}) {
    return limpios({ ...hijos('10', { conv: [{ id: 'c10' }] }), ...hijos('30', { conv: [{ id: 'c30' }] }), ...extra })
  }
  const entera = (tabla: Record<string, Salida>): Promise<Informe> => correr(montar(tabla))

  it('429 agotado en el 20: la primera termina cortada en el 20 sin pedir el 30; desde=20 pide sólo el 20 y el 30 y completa UNA pasada igual a la de un tirón', async () => {
    let bien = false
    const tabla = await datos({ '/tickets/20/conversations': () => (bien ? [] : 429) })
    const m = montar(tabla)
    const primera = await correr(m)
    expect([primera.cortadoEn, primera.cobertura.comparados, m.z.pedidos('/tickets/30/conversations')]).toEqual([{ fase: 'B', numero: 20 }, 1, 0])
    bien = true; const antes = m.z.rutas.length
    m.v.lanzar({ desde: 20 })
    const i = (await esperar(m.v)).informe as Informe
    expect(m.z.rutas.slice(antes).map((r) => r.split('?')[0]).filter((r) => r.endsWith('/conversations'))).toEqual(['/tickets/20/conversations', '/tickets/30/conversations'])
    expect(m.z.pedidos('/tickets')).toBe(1)
    expect([i.cortadoEn, i.motivoCorte, i.cobertura.desde, i.cobertura.hasta, i.cobertura.comparados, i.cobertura.completa, i.veredicto]).toEqual([null, undefined, null, 30, 3, true, 'rojo'])
    expect(ids(i.entidades.conversaciones.faltaEnDesk)).toEqual(['c10', 'c30'])
    expect(estable(i)).toEqual(estable(await entera(tabla)))
  })

  it('?limite=2 corta en el 30 y desde=30 completa; sin ese desde, la parte guardada se descarta', async () => {
    const tabla = await datos(); const m = montar(tabla)
    const primera = await correr(m, { limite: 2 })
    expect([primera.cortadoEn, primera.motivoCorte, primera.cobertura.completa, primera.veredicto]).toEqual([{ fase: 'B', numero: 30 }, 'limite', false, 'incompleto'])
    const i = await correr(m, { desde: 30 })
    expect([i.cortadoEn, i.cobertura.comparados, i.cobertura.completa, m.z.pedidos('/tickets')]).toEqual([null, 3, true, 1])
    expect(estable(i)).toEqual(estable(await entera(tabla)))
  })

  it('un desde distinto del cortadoEn, o un lanzar sin desde entre medias, es una pasada nueva (repite la A); continuar una parcial la deja parcial', async () => {
    const m = montar(await datos())
    await correr(m, { limite: 1 })
    const otro = await correr(m, { desde: 10, limite: 1 })
    expect([otro.cobertura.desde, otro.cobertura.completa, otro.veredicto, m.z.pedidos('/tickets')]).toEqual([10, false, 'incompleto', 2])
    const sigue = await correr(m, { desde: 20 })
    expect([sigue.cobertura.desde, sigue.cobertura.comparados, sigue.cobertura.completa, sigue.veredicto, m.z.pedidos('/tickets')]).toEqual([10, 3, false, 'incompleto', 2])
    await correr(m, { limite: 1 })
    await correr(m, {}) /* sin desde: descarta lo guardado y hace una pasada entera */
    const tras = await correr(m, { desde: 20 })
    expect([tras.cobertura.desde, tras.cobertura.completa, tras.veredicto, m.z.pedidos('/tickets')]).toEqual([20, false, 'incompleto', 5])
  })

  it('un redespliegue (motor nuevo, sin memoria) con desde=<cortadoEn> tampoco continúa: es parcial', async () => {
    const tabla = await datos()
    await correr(montar(tabla), { limite: 1 })
    const i = await correr(montar(tabla), { desde: 20 })
    expect([i.cobertura.desde, i.cobertura.completa, i.veredicto]).toEqual([20, false, 'incompleto'])
  })
})

describe('CA-12 · dos pasadas iguales dan el mismo informe salvo instantes y peticiones', () => {
  it('dos pasadas seguidas: idénticas, con ids ordenados por longitud y luego texto, la versión del esquema y la de la lista', async () => {
    await ticketDesk('1', 1)
    for (const id of ['10', '9', '100']) await adjDesk(id, '1', 5, null)
    const m = montar({ '/tickets': [zt(1)], ...hijos('1', { adj: ['10', '9', '100'].map((id) => ({ id, size: 5 })) }) })
    const a = await correr(m); const ia = estable(a)
    const b = await correr(m)
    expect(ids(b.entidades.adjuntos.volumen?.sinCopia ?? [])).toEqual(['9', '10', '100'])
    expect([a.esquema, a.versionLista]).toEqual([1, 1])
    expect(estable(b)).toEqual(ia)
  })
})
