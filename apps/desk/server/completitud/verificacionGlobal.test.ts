import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { PAUSA_ENTRE_TICKETS_MS, REINTENTOS_429 } from '@ambientalia/zoho-sync/conversaciones'
import { logger } from '../util/logger'
import { crearVerificacionCompletitud, type EstadoVerificacion, type Informe } from './verificacion'

/**
 * verificacion-completitud (1G-03, D7, D10, D11, RQ-ZS-35, RQ-ZS-37) · el motor, fase A (listas globales) y su envoltura.
 * QUÉ COMPRUEBA: CA-1 (un id que falta a cada lado sale en su lado y ordenado), archivados, hueco de lista (S-l), la re-verificación por id antes de
 * «falta en Zoho», el `app-` sin petición por id, una lista que falla ⇒ «sin comparar», el corte `429` en la A, `limite=0` sin llamar a Zoho,
 * una pasada a la vez, la lista inválida, y que no se escribe nada (`escriturasRechazadas`). Pg-mem y `zohoFetch` falsa, sin red.
 * QUÉ NO COMPRUEBA: la fase por ticket ni el volumen (L5, L6) ni la ruta (L6). Nada de esto exige que el global sea verde: aún no hay B ni C.
 */
type Salida = unknown[] | number | { cuerpo: unknown } | ((n: number) => unknown[] | number | { cuerpo: unknown })
const responder = (s: unknown[] | number | { cuerpo: unknown }) =>
  Array.isArray(s) ? new Response(JSON.stringify({ data: s })) : typeof s === 'number' ? new Response('', { status: s }) : new Response(JSON.stringify(s.cuerpo))
/** Zoho falso: `tabla` da la salida de cada ruta sin parámetros (una función recibe el número de llamada); lo no listado es `404`. */
function zoho(tabla: Record<string, Salida>) {
  const rutas: string[] = []; const cuenta = new Map<string, number>()
  const f = async (path: string) => {
    rutas.push(path); const p = path.split('?')[0]; const n = (cuenta.get(p) ?? 0) + 1; cuenta.set(p, n)
    const s = tabla[p] ?? 404
    return responder(typeof s === 'function' ? s(n) : s)
  }
  return { f, rutas, pedidos: (p: string) => rutas.filter((r) => r.split('?')[0] === p).length }
}
const VACIAS: Record<string, Salida> = { '/tickets': [], '/tickets/archivedTickets': [], '/contacts': [], '/accounts': [] }
const zt = (n: number) => ({ id: String(n), ticketNumber: String(n) })
const SIN_REGLAS = JSON.stringify({ version: 1, entradas: [] })

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

const ticketDesk = (id: string, numero: number) => db.query('INSERT INTO tickets (id, number, status) VALUES ($1, $2, $3)', [id, numero, 'Abierto'])
const contactoDesk = (id: string, source = 'zoho', app = false) => db.query('INSERT INTO contacts (id, source, managed_by_app) VALUES ($1, $2, $3)', [id, source, app])
const cuentaDesk = (id: string) => db.query('INSERT INTO accounts (id, name) VALUES ($1, $2)', [id, 'Cuenta'])

function montar(tabla: Record<string, Salida> = {}, extra: Partial<Parameters<typeof crearVerificacionCompletitud>[0]> = {}) {
  const z = zoho({ ...VACIAS, ...tabla }); const registrado: EstadoVerificacion[] = []
  const v = crearVerificacionCompletitud({ zohoFetch: z.f, db, departmentId: '77', dir: null, pausaMs: 0, pausa429Ms: 0, registrar: (r) => registrado.push(r), ...extra })
  return { v, z, registrado }
}
async function esperar(v: { estado(): EstadoVerificacion }): Promise<EstadoVerificacion> {
  for (let i = 0; i < 5000 && !v.estado().terminado; i++) await new Promise<void>((r) => setImmediate(r))
  expect(v.estado().terminado).toBe(true)
  return v.estado()
}
async function correr(m: ReturnType<typeof montar>): Promise<Informe> {
  m.v.lanzar()
  const { informe } = await esperar(m.v)
  if (!informe) throw new Error('la pasada no dejó informe')
  return informe
}
const ids = (filas: { id: string }[]) => filas.map((f) => f.id)

describe('CA-1 · un id que falta en cada lado sale en su lado y ordenado', () => {
  it('tickets: Zoho 3, 1 y 5; Desk 1, 2 y 5, y el 2 borrado por id ⇒ falta en Desk [3] y falta en Zoho [2]', async () => {
    await ticketDesk('1', 1); await ticketDesk('2', 2); await ticketDesk('5', 5)
    const m = montar({ '/tickets': [zt(3), zt(1), zt(5)], '/tickets/2': 404 })
    const t = (await correr(m)).entidades.tickets
    expect(t.faltaEnDesk).toEqual([{ id: '3', numero: 3, clase: 'sin explicar' }])
    expect(t.faltaEnZoho).toEqual([{ id: '2', numero: 2, clase: 'sin explicar' }])
    expect([t.enZoho, t.enDesk, t.casan, t.sinExplicar, t.estado]).toEqual([3, 3, 2, 2, 'rojo'])
    expect(m.v.estado().informe?.cobertura.aComparar).toBe(2)
  })

  it('con datos idénticos ambas salen vacías y la entidad es verde', async () => {
    await ticketDesk('1', 1); await ticketDesk('5', 5)
    const t = (await correr(montar({ '/tickets': [zt(1), zt(5)] }))).entidades.tickets
    expect([t.faltaEnDesk, t.faltaEnZoho, t.casan, t.estado]).toEqual([[], [], 2, 'verde'])
  })

  it('los ids salen por longitud y luego texto: 9 antes que 10 y que 100', async () => {
    const t = (await correr(montar({ '/tickets': [zt(100), zt(9), zt(10)] }))).entidades.tickets
    expect(ids(t.faltaEnDesk)).toEqual(['9', '10', '100'])
  })

  it.each([['contactos', '/contacts', contactoDesk], ['cuentas', '/accounts', cuentaDesk]] as const)('%s: lo mismo que tickets, por id', async (nombre, ruta, poner) => {
    await poner('c1'); await poner('c2')
    const e = (await correr(montar({ [ruta]: [{ id: 'c3' }, { id: 'c1' }], [`${ruta}/c2`]: 404 }))).entidades[nombre]
    expect([ids(e.faltaEnDesk), ids(e.faltaEnZoho), e.casan, e.estado]).toEqual([['c3'], ['c2'], 1, 'rojo'])
  })
})

describe('archivados, hueco de lista y re-verificación por id', () => {
  it('un archivado ausente de la lista del departamento y presente en Desk no es «falta en Zoho», y no se pide por id', async () => {
    await ticketDesk('7', 7)
    const m = montar({ '/tickets/archivedTickets': [zt(7)] })
    const t = (await correr(m)).entidades.tickets
    expect([t.faltaEnZoho, t.casan, t.estado]).toEqual([[], 1, 'verde'])
    expect(m.v.estado().informe?.cobertura.aComparar).toBe(1)
    expect(m.z.pedidos('/tickets/archivedTickets')).toBe(1)
    expect(m.z.pedidos('/tickets/7')).toBe(0)
  })

  it('S-l: ausente de la lista, el que responde 404 es «falta en Zoho» y el que responde vivo es «hueco de lista»; ambos se piden por id', async () => {
    await contactoDesk('c1'); await contactoDesk('c2')
    const m = montar({ '/contacts/c1': 404, '/contacts/c2': { cuerpo: { id: 'c2' } } })
    const e = (await correr(m)).entidades.contactos
    expect(ids(e.faltaEnZoho)).toEqual(['c1'])
    expect(e.huecosDeLista).toEqual([{ id: 'c2' }])
    expect([m.z.pedidos('/contacts/c1'), m.z.pedidos('/contacts/c2')]).toEqual([1, 1])
  })

  it('borrado o en papelera por id (vivo con isDeleted) también es «falta en Zoho»', async () => {
    await cuentaDesk('a1')
    const e = (await correr(montar({ '/accounts/a1': { cuerpo: { id: 'a1', isDeleted: true } } }))).entidades.cuentas
    expect([ids(e.faltaEnZoho), e.huecosDeLista]).toEqual([['a1'], []])
  })

  it('un error por id (500) deja la entidad «incompleto» con su error, sin clasificar el id', async () => {
    await contactoDesk('c1')
    const i = await correr(montar({ '/contacts/c1': 500 }))
    expect([i.entidades.contactos.estado, i.entidades.contactos.faltaEnZoho]).toEqual(['incompleto', []])
    expect(i.errores).toEqual([{ entidad: 'contactos', id: 'c1', motivo: 'contacts http 500' }])
  })
})

describe('lo nacido en la app: sin petición por id', () => {
  it('un ticket app- ausente de Zoho no se pide por id; con la regla sale conocido, sin ella «sin explicar»', async () => {
    await ticketDesk('app-9', 900)
    const con = montar(); const sin = montar({}, { leerLista: () => SIN_REGLAS })
    const f1 = (await correr(con)).entidades.tickets.faltaEnZoho
    const f2 = (await correr(sin)).entidades.tickets.faltaEnZoho
    expect([f1[0].id, f1[0].clase, f1[0].entrada]).toEqual(['app-9', 'conocida', 'DEPLOY.md §23'])
    expect([f2[0].id, f2[0].clase]).toEqual(['app-9', 'sin explicar'])
    expect(con.z.pedidos('/tickets/app-9') + sin.z.pedidos('/tickets/app-9')).toBe(0)
  })

  it('un contacto con managed_by_app sí se pide por id (la excepción es sólo de los tickets app-) y sale conocido', async () => {
    await contactoDesk('c1', 'app', true)
    const m = montar({ '/contacts/c1': 404 })
    const f = (await correr(m)).entidades.contactos.faltaEnZoho
    expect([f[0].id, f[0].clase, m.z.pedidos('/contacts/c1')]).toEqual(['c1', 'conocida', 1])
  })
})

describe('una lista que falla deja su entidad «sin comparar»', () => {
  it('`GET /accounts` en 500: cuentas «sin comparar», el global no es verde y las demás conservan su veredicto', async () => {
    await ticketDesk('1', 1)
    const i = await correr(montar({ '/tickets': [zt(1)], '/accounts': 500 }))
    expect([i.entidades.cuentas.estado, i.entidades.cuentas.motivo]).toEqual(['sin comparar', 'accounts http 500'])
    expect([i.entidades.tickets.estado, i.entidades.contactos.estado, i.veredicto]).toEqual(['verde', 'verde', 'incompleto'])
  })

  it('la lista de tickets que falla deja «sin comparar» también las tres por ticket', async () => {
    const e = (await correr(montar({ '/tickets': 500 }))).entidades
    expect([e.tickets, e.conversaciones, e.adjuntos, e.historia].map((x) => x.estado)).toEqual(['sin comparar', 'sin comparar', 'sin comparar', 'sin comparar'])
    expect(e.tickets.motivo).toBe('tickets http 500')
    expect([e.conversaciones.motivo, e.adjuntos.motivo, e.historia.motivo]).toEqual(Array(3).fill('sin lista de tickets'))
  })
})

describe('corte 429 en la fase A', () => {
  it('el 429 agotado corta con cortadoEn de la A sin número, se reintenta tres veces y no sigue con las demás listas', async () => {
    const m = montar({ '/tickets': 429 })
    const i = await correr(m)
    expect([i.cortadoEn, i.motivoCorte, i.veredicto, i.cobertura.completa]).toEqual([{ fase: 'A', numero: null }, '429', 'incompleto', false])
    expect(m.z.pedidos('/tickets')).toBe(1 + REINTENTOS_429)
    expect(m.z.pedidos('/contacts') + m.z.pedidos('/accounts')).toBe(0)
  })

  it('un 429 que se recupera no corta y queda contado en la entidad y en el total', async () => {
    const i = await correr(montar({ '/contacts': (n) => (n === 1 ? 429 : []) }))
    expect([i.cortadoEn, i.entidades.contactos.peticiones, i.entidades.contactos.vistos429, i.vistos429, i.entidades.cuentas.vistos429]).toEqual([null, 2, 1, 1, 0])
  })
})

describe('limite=0: cuenta y estima sin llamar a Zoho', () => {
  it('3 tickets en Desk (uno app-): cero llamadas, recuentos de Desk y estimación mínima', async () => {
    await ticketDesk('1', 1); await ticketDesk('2', 2); await ticketDesk('app-3', 3); await contactoDesk('c1'); await cuentaDesk('a1'); await cuentaDesk('a2')
    const m = montar()
    const r = await m.v.recuento({})
    expect(m.z.rutas).toEqual([])
    expect(r).toMatchObject({ lista: { version: 1 }, desk: { tickets: 3, contactos: 1, cuentas: 2, conversaciones: 0, adjuntos: 0, historia: 0 }, appNacidos: 1, porComparar: 2, bytesAdjuntos: 0, peticionesMinimas: 4 + 3 * 2 })
  })

  it('`desde` acota los tickets por comparar, y una lista inválida se dice en lugar de lanzar', async () => {
    await ticketDesk('1', 1); await ticketDesk('2', 2); await ticketDesk('3', 3)
    const m = montar()
    expect(await m.v.recuento({ desde: 2 })).toMatchObject({ desde: 2, porComparar: 2, peticionesMinimas: 4 + 3 * 2 })
    const rota = montar({}, { leerLista: () => 'no es json' })
    expect((await rota.v.recuento({})).lista).toEqual({ error: 'lista: JSON no válido' })
    expect(rota.z.rutas).toEqual([])
  })
})

describe('una pasada a la vez', () => {
  it('dos lanzar seguidos lanzan uno: el segundo devuelve el estado en marcha sin tocar Zoho otra vez', async () => {
    const m = montar()
    const a = m.v.lanzar(); const b = m.v.lanzar()
    expect([a.lanzada, b.lanzada, b.estado.enMarcha]).toEqual([true, false, true])
    await esperar(m.v)
    expect(m.z.pedidos('/tickets')).toBe(1)
    expect(m.v.estado().enMarcha).toBe(false)
    expect(m.v.lanzar().lanzada).toBe(true)
    await esperar(m.v)
  })

  it('sin pasada, el estado es «sin pasada» y es una copia', () => {
    const v = montar().v
    const e = v.estado()
    expect(e).toEqual({ enMarcha: false, terminado: false, fase: null, desde: null, limite: null, informe: null })
    e.enMarcha = true
    expect(v.estado().enMarcha).toBe(false)
  })
})

describe('la lista inválida impide lanzar y nombra la entrada', () => {
  const sucia = JSON.stringify({ version: 1, entradas: [{ entidad: 'tickets', numeros: [5], entrada: 'E-1' }] })
  it('`{ lanzada: false }` con el error, sin Zoho; se lee en cada lanzar, así que corregirla basta', async () => {
    let texto = sucia
    const m = montar({}, { leerLista: () => texto })
    const r = m.v.lanzar()
    expect([r.lanzada, r.estado.error, r.estado.enMarcha, r.estado.informe]).toEqual([false, 'lista: entrada 0 (tickets, E-1): falta `causa`', false, null])
    expect(m.v.estado().error).toBe('lista: entrada 0 (tickets, E-1): falta `causa`')
    expect(m.z.rutas).toEqual([])
    texto = SIN_REGLAS
    expect(m.v.lanzar().lanzada).toBe(true)
    await esperar(m.v)
  })
})

describe('sólo lectura y sin datos de clientes', () => {
  it('una pasada completa no escribe nada: escriturasRechazadas.total es 0 y no hay error', async () => {
    await ticketDesk('1', 1)
    const m = montar({ '/tickets': [{ ...zt(1), subject: 'x', status: 'Open', statusType: 'Open' }, { ...zt(2), subject: 'y', status: 'Open', statusType: 'Open' }] })
    const i = await correr(m)
    expect(i.escriturasRechazadas.total).toBe(0)
    expect(i.escriturasRechazadas.tipos).toEqual([])
    expect([m.v.estado().error, i.entidades.tickets.faltaEnDesk.length]).toEqual([undefined, 1])
  })

  it('un fallo de la base da el código «base»; la pasada termina y no queda en marcha', async () => {
    const m = montar({}, { db: { query: async () => { throw new Error('contraseña-de-la-base') } } })
    m.v.lanzar()
    const e = await esperar(m.v)
    expect([e.error, e.enMarcha, e.informe?.veredicto]).toEqual(['base', false, 'incompleto'])
  })

  it('el estado, el informe y el log llevan ids y números, no asuntos, nombres ni correos', async () => {
    await contactoDesk('c1')
    const MARCA = 'marcador-secreto-4417'
    const m = montar({ '/tickets': [{ ...zt(4), subject: MARCA }], '/contacts': [{ id: 'c9', firstName: MARCA, email: `${MARCA}@x.co` }], '/contacts/c1': 404 })
    await correr(m)
    expect(JSON.stringify(m.v.estado())).toContain('"c9"')
    expect(JSON.stringify(m.v.estado()) + JSON.stringify(m.registrado)).not.toContain(MARCA)
    expect(m.registrado).toHaveLength(1)
  })
})

describe('pausa entre peticiones', () => {
  it('PAUSA_ENTRE_TICKETS_MS antes de cada petición salvo la primera: 4 listas, 3 esperas', async () => {
    const esperas: number[] = []
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((fn: () => void, ms?: number) => { esperas.push(Number(ms)); queueMicrotask(fn); return 0 }) as unknown as typeof setTimeout)
    const m = montar({}, { pausaMs: PAUSA_ENTRE_TICKETS_MS })
    const i = await correr(m)
    expect([i.peticiones, esperas.filter((ms) => ms === PAUSA_ENTRE_TICKETS_MS).length]).toEqual([4, 3])
  })
})

describe('el log por omisión', () => {
  it('deja UNA línea con el veredicto y los recuentos, sin ids ni datos de clientes', async () => {
    const info = vi.spyOn(logger, 'info').mockImplementation((() => undefined) as never)
    await contactoDesk('c1')
    // Sin `registrar` inyectado (`montar` pasa el suyo): se ejerce el de la App.
    const v = crearVerificacionCompletitud({ zohoFetch: zoho({ ...VACIAS, '/contacts': [{ id: 'c9', firstName: 'marcador-secreto-2290' }], '/contacts/c1': 404 }).f, db, departmentId: '77', dir: null, pausaMs: 0, pausa429Ms: 0 })
    v.lanzar(); await esperar(v)
    expect(info).toHaveBeenCalledTimes(1)
    const [datos, linea] = info.mock.calls[0] as unknown as [Record<string, unknown>, string]
    expect(linea).toBe('verificacion-completitud: incompleto')
    expect(JSON.stringify(datos)).toContain('"contactos":{"estado":"rojo","enZoho":1,"enDesk":1,"sinExplicar":2,"conocidas":0}')
    expect(JSON.stringify(datos) + linea).not.toMatch(/c9|c1|marcador-secreto/)
  })
})

describe('verify W-1 y W-2 · el departamento de las listas y la cobertura sin fase B', () => {
  it('W-1 · las dos listas de tickets salen con el departmentId de la sincronización (S-k)', async () => {
    const m = montar({ '/tickets': [zt(1)] })
    await correr(m)
    const listas = m.z.rutas.filter((r) => /^\/tickets(\/archivedTickets)?\?/.test(r))
    expect(listas.map((r) => r.split('?')[0]).sort()).toEqual(['/tickets', '/tickets/archivedTickets'])
    expect(listas.map((r) => new URLSearchParams(r.split('?')[1]).get('departmentId'))).toEqual(['77', '77'])
  })

  it('W-2 · con la lista de tickets en 500 y ADJUNTOS_DIR válida la fase B no corre y la cobertura no es completa', async () => {
    const i = await correr(montar({ '/tickets': 500 }, { dir: '/volumen-no-usado' }))
    expect([i.cobertura.completa, i.veredicto]).toEqual([false, 'incompleto'])
  })
})
