import { describe, it, expect } from 'vitest'
import request from 'supertest'
import type { RespuestaReclamacion } from '@ambientalia/shared'
import { medirGarantias } from '@ambientalia/shared'
import { asociarOV } from '@ambientalia/zoho-sync/db/ovAsociaciones'
import { db, instalarArnes, appWith, adminCookie } from '../testing/appHarness'
import { createUser } from '../auth/users'
import { createSession } from '../auth/sessions'
import { createRole } from '../auth/roles'
import { asociacionPorId, registrarRespuesta, reclamacionPorId, avanzarFicha, fichasReclamadas } from '../db/garantiaProveedor'

instalarArnes()

/**
 * `GET /api/medicion-garantia-proveedor` (F1B-13, `medicion-garantias-por-marca`; `tickets-core` RQ-TC-67 y RQ-TC-68).
 * La ruta tiene UNA sola guarda (la sesión): no hay par de guardas que ordenar (regla de mutación 1). La prueba de
 * igualdad entre un usuario sin cargo y un admin fija que no hay un segundo permiso. M-1b y M-7 son de `design.md` §6.
 */

let n = 0
/** Cookie de un usuario sin cargo ni admin: el que menos puede, y aun así lee la medición. */
async function usuarioSimple(): Promise<string> {
  n += 1
  const role = await createRole(db, { name: `Rol-mg-${n}`, areas: ['Comercial'] })
  const u = await createUser(db, { email: `mg${n}@x.co`, name: `M${n}`, passwordHash: 'h', roleId: role.id, cargoPermiso: null })
  return `sid=${await createSession(db, u.id)}`
}

let k = 0
async function sembrar(respuesta: RespuestaReclamacion, ticketId = 't1') {
  k += 1
  const a = await asociarOV(db, { ticketId, numero: `OVI-${k}`, salesorderId: null, origen: 'alta', actor: 't', fechaOrdenCompra: null })
  const asociacion = (await asociacionPorId(db, Number(a.id)))!
  return registrarRespuesta(db, { asociacion, respuesta, por: 'semilla' })
}
const sub = (fabricante: string, valorReclamado: number | null, piezaReferencia = 'P-1'): RespuestaReclamacion =>
  ({ reclama: true, fabricante, piezaReferencia, piezaSerial: 'S-1', valorReclamado })

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

  it('un usuario sin cargo ni admin recibe éxito', async () => {
    const res = await leer(await usuarioSimple())
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ porFabricante: [], fallasRepetidas: [] })
  })

  it('admin y no admin reciben el MISMO cuerpo: no hay un segundo permiso', async () => {
    await sembrarVarias()
    const simple = await leer(await usuarioSimple())
    const admin = await leer(await adminCookie())
    expect(simple.status).toBe(200)
    expect(admin.status).toBe(200)
    expect(admin.body).toEqual(simple.body)
  })

  it('el cuerpo es lo que da medirGarantias sobre las mismas fichas', async () => {
    await sembrarVarias()
    const res = await leer(await usuarioSimple())
    const esperado = medirGarantias(await fichasReclamadas(db))
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
    await leer(await usuarioSimple())
    await leer(await usuarioSimple())
    const despues = (await db.query('SELECT * FROM garantia_proveedor ORDER BY id')).rows
    expect(despues).toEqual(antes)
    expect((await reclamacionPorId(db, Number((antes[0] as { id: number }).id)))!.estado).toBe('resuelta')
  })
})
