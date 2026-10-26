import { describe, it, expect } from 'vitest'
import request from 'supertest'
import type { Cargo, RespuestaReclamacion } from '@ambientalia/shared'
import { medirGarantias, conNumerosDeTicket } from '@ambientalia/shared'
import { asociarOV } from '@ambientalia/zoho-sync/db/ovAsociaciones'
import { db, instalarArnes, appWith, adminCookie } from '../testing/appHarness'
import { createUser } from '../auth/users'
import { createSession } from '../auth/sessions'
import { createRole } from '../auth/roles'
import { asociacionPorId, registrarRespuesta, reclamacionPorId, avanzarFicha, fichasReclamadas } from '../db/garantiaProveedor'

instalarArnes()

/**
 * `GET /api/medicion-garantia-proveedor` (F1B-13, `medicion-garantias-por-marca`; `tickets-core` RQ-TC-67 y RQ-TC-68).
 * Dos guardas, en este orden: la sesión (`401`) y `puedeVerMedicionGarantias` (`403`), de
 * `decision/medicion-garantias-acceso` (17/10), que sustituye al S-4 del cambio. La prueba «sin sesión da 401, no 403»
 * fija el ORDEN (regla de mutación 1). M-1b y M-7 son de `design.md` §6.
 */

let n = 0
/** Cookie de un usuario con ese cargo (o sin él), con área Comercial y sin admin. */
async function usuario(cargoPermiso: Cargo | null): Promise<string> {
  n += 1
  const role = await createRole(db, { name: `Rol-mg-${n}`, areas: ['Comercial'] })
  const u = await createUser(db, { email: `mg${n}@x.co`, name: `M${n}`, passwordHash: 'h', roleId: role.id, cargoPermiso })
  return `sid=${await createSession(db, u.id)}`
}
const director = () => usuario('Director Técnico')

/** Los tickets de `sembrarVarias` que existen en `tickets`: t1 es el #996; t2 no existe (ticket borrado). */
async function sembrarTickets() {
  await db.query(`INSERT INTO tickets (id, number, status) VALUES ('t1', 996, 'Ingresado'), ('t3', 997, 'Ingresado')`)
}

let k = 0
async function sembrar(respuesta: RespuestaReclamacion & { valor?: number | null }, ticketId = 't1') {
  k += 1
  const a = await asociarOV(db, { ticketId, numero: `OVI-${k}`, salesorderId: null, origen: 'alta', actor: 't', fechaOrdenCompra: null })
  const asociacion = (await asociacionPorId(db, Number(a.id)))!
  return registrarRespuesta(db, { asociacion, respuesta, por: 'semilla', foto: { valorReclamado: respuesta.valor ?? null, origenValorReclamado: 'ovi' } })
}
const sub = (fabricante: string, valor: number | null, piezaReferencia = 'P-1'): RespuestaReclamacion & { valor: number | null } =>
  ({ reclama: true, fabricante, piezaReferencia, piezaSerial: 'S-1', valor })

async function sembrarVarias() {
  const a = await sembrar(sub('Acme', 1000))
  await avanzarFicha(db, a.id, 'abierta', { a: 'enviada' })
  await avanzarFicha(db, a.id, 'enviada', { a: 'resuelta', resultado: 'reposicion', valorRecuperado: 400 })
  await sembrar(sub('  ACME ', 500, 'p-1'), 't2')
  await sembrar(sub('Otra', null, 'Z-9'), 't3')
  await sembrar({ reclama: false, motivo: 'mal_uso' }, 't4')
}

const leer = (cookie?: string) => {
  const r = request(appWith().app).get('/api/medicion-garantia-proveedor')
  return cookie ? r.set('Cookie', cookie) : r
}

describe('medición de garantías (RQ-TC-67, RQ-TC-68)', () => {
  it('sin cookie da 401 (M-7)', async () => {
    expect((await leer()).status).toBe(401)
  })

  it('sin sesión da 401 y NO 403, también con una cookie que no es sesión (orden de las guardas)', async () => {
    const sin = await leer()
    expect(sin.status).toBe(401)
    expect(sin.status).not.toBe(403)
    expect((await leer('sid=no-existe')).status).toBe(401)
  })

  it.each<[string, Cargo | null]>([['Técnico', 'Técnico'], ['Coordinador Técnico', 'Coordinador Técnico'], ['sin cargo', null]])(
    '%s recibe 403 con el mensaje del permiso', async (_n, cargo) => {
      const res = await leer(await usuario(cargo))
      expect(res.status).toBe(403)
      expect(res.body.error).toMatch(/Director Técnico y Director Comercial/)
    })

  it.each<[Cargo]>([['Director Técnico'], ['Director Comercial']])('%s recibe 200', async (cargo) => {
    const res = await leer(await usuario(cargo))
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ porFabricante: [], fallasRepetidas: [] })
  })

  it('el administrador sin cargo recibe 200 y el MISMO cuerpo que un director', async () => {
    await sembrarVarias()
    const admin = await leer(await adminCookie())
    const dir = await leer(await director())
    expect(admin.status).toBe(200)
    expect(dir.status).toBe(200)
    expect(admin.body).toEqual(dir.body)
  })

  it('las fallas repetidas llevan el número del ticket, null si ya no existe, y ningún id interno', async () => {
    await sembrarVarias()
    await sembrarTickets()
    const res = await leer(await director())
    expect(res.body.fallasRepetidas).toEqual([{ fabricante: 'Acme', piezaReferencia: 'P-1', fichas: 2, numerosTicket: [996, null] }])
    expect(JSON.stringify(res.body)).not.toMatch(/"t[123]"/)
  })

  it('el cuerpo es lo que da medirGarantias sobre las mismas fichas, con los números de ticket', async () => {
    await sembrarVarias()
    await sembrarTickets()
    const res = await leer(await director())
    const esperado = conNumerosDeTicket(medirGarantias(await fichasReclamadas(db)), new Map([['t1', 996], ['t3', 997]]))
    expect(res.body).toEqual(JSON.parse(JSON.stringify(esperado)))
    const acme = res.body.porFabricante.find((g: { fabricante: string }) => g.fabricante === 'Acme')
    expect(acme).toMatchObject({ fichas: 2, reclamado: 1500, recuperado: 400, sinResolver: 1 })
    expect(res.body.porFabricante.find((g: { fabricante: string }) => g.fabricante === 'Otra')).toMatchObject({ sinValorReclamado: 1, cociente: null })
    expect(res.body.fallasRepetidas).toHaveLength(1)
  })

  it('fichasReclamadas no devuelve el «no» sembrado (M-1b)', async () => {
    await sembrarVarias()
    const fichas = await fichasReclamadas(db)
    expect(fichas).toHaveLength(3)
    expect(fichas.every((f) => f.reclama)).toBe(true)
    expect(fichas.map((f) => f.id)).toEqual([...fichas.map((f) => f.id)].sort((a, b) => a - b))
  })

  it('el GET no escribe', async () => {
    await sembrarVarias()
    const antes = (await db.query('SELECT * FROM garantia_proveedor ORDER BY id')).rows
    await leer(await director())
    await leer(await director())
    const despues = (await db.query('SELECT * FROM garantia_proveedor ORDER BY id')).rows
    expect(despues).toEqual(antes)
    expect((await reclamacionPorId(db, Number((antes[0] as { id: number }).id)))!.estado).toBe('resuelta')
  })
})

// valor-reclamado-usd (F1B-13), lote L1: la moneda por grupo llega por la ruta tal como la da `shared` (RQ-TC-80).
describe('medición de garantías · moneda por grupo (RQ-TC-80)', () => {
  it('cada grupo trae moneda USD y la ruta devuelve exactamente lo de shared', async () => {
    await sembrarVarias()
    await sembrarTickets()
    const res = await leer(await director())
    expect(res.status).toBe(200)
    expect(res.body.porFabricante.length).toBeGreaterThan(1)
    for (const g of res.body.porFabricante) expect(g.moneda).toBe('USD')
    const esperado = conNumerosDeTicket(medirGarantias(await fichasReclamadas(db)), new Map([['t1', 996], ['t3', 997]]))
    expect(esperado.porFabricante.every(g => g.moneda === 'USD')).toBe(true)
    expect(res.body).toEqual(JSON.parse(JSON.stringify(esperado)))
  })
})
