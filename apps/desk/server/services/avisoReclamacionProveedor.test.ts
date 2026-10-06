import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { asociarOV } from '@ambientalia/zoho-sync/db/ovAsociaciones'
import type { RespuestaReclamacion } from '@ambientalia/shared'
import { avisarReclamacionesVencidas, marcarYAvisarReclamacion, pasadaReclamaciones } from './avisoReclamacionProveedor'
import { asociacionPorId, avanzarFicha, reclamacionPorId, registrarRespuesta } from '../db/garantiaProveedor'
import { destinatariosDeCargoPermiso } from '../db/avisos'
import { createRole, actualizarRecibeAvisos } from '../auth/roles'
import { createUser } from '../auth/users'
import { logger } from '../util/logger'

/**
 * RQ-AV-19 (delta `derivacion-avisos`, F1B-13 lote 2): aviso de 60 días de una reclamación al fabricante sin resolver.
 * Frontera estricta sobre días naturales (el 60 no avisa, el 61 sí), una sola marca por ficha en el propio `UPDATE`,
 * destinatarios por `cargo_permiso` con respaldo al área, y sin destinatarios NO se marca (D-11).
 *
 * Atomicidad por ESTRUCTURA, no por filas: pg-mem no revierte un `ROLLBACK` (`db/transaccion.test.ts:25`).
 */
let db: Queryable
let n = 0
beforeEach(async () => { n = 0; const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

const si: RespuestaReclamacion = { reclama: true, fabricante: 'Acme', piezaReferencia: null, piezaSerial: null, valorReclamado: null }
const no: RespuestaReclamacion = { reclama: false, motivo: 'mal_uso' }
// La ficha se abre el 2026-03-01 (UTC mediodía, mismo día civil en la zona de negocio): el día 60 es el 2026-04-30.
const ABIERTA = '2026-03-01T12:00:00Z'
const DIA_59 = '2026-04-29'
const DIA_60 = '2026-04-30'
const DIA_61 = '2026-05-01'

async function director(email = 'dt@x.co', activo = true, firma: string | null = null) {
  const u = await createUser(db, { email, name: email, passwordHash: 'h', cargoPermiso: 'Director Técnico', cargo: firma })
  if (!activo) await db.query('UPDATE users SET active = false WHERE id = $1', [u.id])
  return u.id
}
async function areaServicioTecnico(email = 'st@x.co') {
  const rol = await createRole(db, { name: 'ST', areas: ['Servicio Técnico'] })
  await actualizarRecibeAvisos(db, rol.id, true)
  return (await createUser(db, { email, name: email, passwordHash: 'h', roleId: rol.id })).id
}
/** Abre una ficha en el estado dado, con su apertura en `ABIERTA`, y devuelve su id. */
async function ficha(r: RespuestaReclamacion = si, abiertaEl = ABIERTA): Promise<number> {
  n++
  await db.query('INSERT INTO tickets (id, number, subject, status) VALUES ($1, $2, $3, $4)', [`t${n}`, n, 's', 'Ingresado'])
  const a = await asociarOV(db, { ticketId: `t${n}`, numero: `OVI-${n}`, salesorderId: null, origen: 'alta', actor: 't', fechaOrdenCompra: null })
  const f = await registrarRespuesta(db, { asociacion: (await asociacionPorId(db, a.id))!, respuesta: r, por: 'dt@x.co' })
  await db.query('UPDATE garantia_proveedor SET respondida_at = $2 WHERE id = $1', [f.id, abiertaEl])
  return f.id
}
const avisos = async () => (await db.query('SELECT user_id, ticket_id, texto, enviado_at FROM avisos ORDER BY created_at')).rows as Array<{ user_id: string; ticket_id: string | null; texto: string; enviado_at: unknown }>
const marca = async (id: number) => (await db.query('SELECT aviso_60_at AS m FROM garantia_proveedor WHERE id = $1', [id])).rows[0].m

describe('avisarReclamacionesVencidas · la frontera de los 60 días naturales', () => {
  it.each<[string, string, number]>([['día 59', DIA_59, 0], ['día 60', DIA_60, 0], ['día 61', DIA_61, 1]])('%s → %i aviso(s)', async (_t, hoy, esperado) => {
    await director()
    const id = await ficha()
    expect(await avisarReclamacionesVencidas(db, hoy)).toBe(esperado)
    expect(await avisos()).toHaveLength(esperado)
    expect(await marca(id) != null).toBe(esperado === 1)
  })

  it('días naturales: una ficha abierta en sábado no avisa el día 60 y sí el 61', async () => {
    await director()
    await ficha(si, '2026-02-28T12:00:00Z') // sábado; el día 60 es el 2026-04-29
    expect(await avisarReclamacionesVencidas(db, '2026-04-29')).toBe(0)
    expect(await avisarReclamacionesVencidas(db, '2026-04-30')).toBe(1)
  })

  it('una ficha «enviada» a 75 días avisa', async () => {
    await director()
    const id = await ficha()
    await avanzarFicha(db, id, 'abierta', { a: 'enviada' })
    expect(await avisarReclamacionesVencidas(db, '2026-05-15')).toBe(1)
  })

  it('una ficha resuelta no avisa, ni una respuesta «no»', async () => {
    await director()
    const id = await ficha()
    await avanzarFicha(db, id, 'abierta', { a: 'enviada' })
    await avanzarFicha(db, id, 'enviada', { a: 'resuelta', resultado: 'rechazada', valorRecuperado: 0 })
    await ficha(no)
    expect(await avisarReclamacionesVencidas(db, '2026-09-01')).toBe(0)
    expect(await avisos()).toEqual([])
  })

  it('un solo aviso por ficha aunque la pasada corra varias veces (S-12)', async () => {
    await director()
    const id = await ficha()
    expect(await avisarReclamacionesVencidas(db, DIA_61)).toBe(1)
    expect(await avisarReclamacionesVencidas(db, '2026-05-02')).toBe(0)
    expect(await avisarReclamacionesVencidas(db, '2026-06-30')).toBe(0)
    expect(await avisos()).toHaveLength(1)
    expect(await marca(id)).not.toBeNull()
  })
})

describe('marcarYAvisarReclamacion · el UPDATE condicional y el texto', () => {
  it('el UPDATE por sí solo: dos marcas de la misma ficha → un aviso', async () => {
    await director()
    const id = await ficha()
    const reg = () => reclamacionPorId(db, id)
    expect(await marcarYAvisarReclamacion(db, (await reg())!, 'primero')).toBe(true)
    expect(await marcarYAvisarReclamacion(db, (await reg())!, 'segundo')).toBe(false)
    expect((await avisos()).map((a) => a.texto)).toEqual(['primero'])
  })

  it('texto: OVI, fabricante, «más de 60 días», fecha de apertura y estado; con el ticket de la ficha y sólo de bandeja', async () => {
    const dt = await director()
    await ficha()
    await avanzarFicha(db, 1, 'abierta', { a: 'enviada' })
    await avisarReclamacionesVencidas(db, DIA_61)
    const a = await avisos()
    expect(a).toHaveLength(1)
    expect(a[0]).toMatchObject({ user_id: dt, ticket_id: `t${n}`, enviado_at: null })
    for (const trozo of [`OVI-${n}`, 'Acme', 'más de 60 días', '2026-03-01', '«Enviada al fabricante»']) expect(a[0]!.texto).toContain(trozo)
  })
})

describe('destinatarios · cargo de permiso, respaldo al área y D-11', () => {
  it('destinatariosDeCargoPermiso filtra por cargo_permiso y usuario activo, no por la firma users.cargo', async () => {
    const porPermiso = await director('perm@x.co')
    await director('inactivo@x.co', false)
    await createUser(db, { email: 'firma@x.co', name: 'Firma', passwordHash: 'h', cargo: 'Director Técnico' }) // firma sin permiso
    expect((await destinatariosDeCargoPermiso(db, 'Director Técnico')).map((d) => d.id)).toEqual([porPermiso])
  })

  it('con alguien en el cargo se le avisa a él y NO también al área (CARACTERIZACIÓN)', async () => {
    const dt = await director()
    await areaServicioTecnico()
    await ficha()
    await avisarReclamacionesVencidas(db, DIA_61)
    expect((await avisos()).map((a) => a.user_id)).toEqual([dt])
  })

  it('un usuario inactivo del cargo queda fuera y avisa el área', async () => {
    await director('baja@x.co', false)
    const st = await areaServicioTecnico()
    await ficha()
    await avisarReclamacionesVencidas(db, DIA_61)
    expect((await avisos()).map((a) => a.user_id)).toEqual([st])
  })

  it('respaldo: si nadie lleva el cargo, avisa al área Servicio Técnico', async () => {
    const st = await areaServicioTecnico()
    const id = await ficha()
    expect(await avisarReclamacionesVencidas(db, DIA_61)).toBe(1)
    expect((await avisos()).map((a) => a.user_id)).toEqual([st])
    expect(await marca(id)).not.toBeNull()
  })

  it('sin nadie ni en el cargo ni en el área: no se marca, no hay aviso, se registra un warn, y al aparecer alguien la pasada siguiente avisa (D-11)', async () => {
    const warn = vi.spyOn(logger, 'warn')
    const id = await ficha()
    expect(await avisarReclamacionesVencidas(db, DIA_61)).toBe(0)
    expect(await marca(id)).toBeNull()
    expect(await avisos()).toEqual([])
    expect(warn).toHaveBeenCalled()
    const dt = await director()
    expect(await avisarReclamacionesVencidas(db, '2026-05-02')).toBe(1)
    expect((await avisos()).map((a) => a.user_id)).toEqual([dt])
    warn.mockRestore()
  })
})

// ── Atomicidad por estructura: quién recibe cada sentencia ──
interface ConPool { connect: () => Promise<{ query: Queryable['query']; release: () => void }> }
function rastreador(fallaEn: string): { db: Queryable & ConPool; calls: string[] } {
  const calls: string[] = []
  const hacer = (quien: string) => async (sql: string) => {
    const verbo = sql.trim().split(/\s+/)[0]!.toUpperCase()
    calls.push(`${quien}:${verbo}`)
    if (verbo === fallaEn) throw new Error(`boom (${fallaEn})`)
    if (/UPDATE garantia_proveedor/i.test(sql)) return { rows: [{ id: 7 }] }
    if (/FROM users/i.test(sql)) return { rows: [{ id: 'u1', email: 'a@x.co', name: 'A' }] }
    return { rows: [] }
  }
  const pool = { query: hacer('pool') as Queryable['query'], connect: async () => ({ query: hacer('cliente') as Queryable['query'], release: () => {} }) }
  return { db: pool, calls }
}
const fichaFalsa = { id: 7, ticketId: 't', oviNumero: 'OVI-1', fabricante: 'Acme', estado: 'abierta' } as unknown as Parameters<typeof marcarYAvisarReclamacion>[1]

describe('marcarYAvisarReclamacion · destinatarios, marca y aviso en el MISMO cliente entre BEGIN y COMMIT/ROLLBACK', () => {
  it('si crearAviso falla (INSERT), la marca va en la misma transacción revertida y nada toca el pool', async () => {
    const { db: d, calls } = rastreador('INSERT')
    await expect(marcarYAvisarReclamacion(d, fichaFalsa, 'texto')).rejects.toThrow('boom')
    expect(calls).toEqual(['cliente:BEGIN', 'cliente:SELECT', 'cliente:UPDATE', 'cliente:INSERT', 'cliente:ROLLBACK'])
  })

  it('sin fallo: BEGIN, SELECT (destinatarios), UPDATE (marca), INSERT, COMMIT, todo por el cliente', async () => {
    const { db: d, calls } = rastreador('NINGUNO')
    await expect(marcarYAvisarReclamacion(d, fichaFalsa, 'texto')).resolves.toBe(true)
    expect(calls).toEqual(['cliente:BEGIN', 'cliente:SELECT', 'cliente:UPDATE', 'cliente:INSERT', 'cliente:COMMIT'])
  })

  it('la pasada no lanza aunque crearAviso falle en una base real (pg-mem), y la ficha sigue sin avisar a las demás', async () => {
    await director()
    await ficha()
    const pool = db as unknown as ConPool
    const rota: Queryable & ConPool = {
      query: db.query.bind(db),
      connect: async () => {
        const c = await pool.connect()
        return { query: ((s: string, p?: unknown[]) => (/INSERT INTO avisos/.test(s) ? Promise.reject(new Error('boom')) : c.query(s, p))) as Queryable['query'], release: () => c.release() }
      },
    }
    await expect(avisarReclamacionesVencidas(rota, DIA_61)).resolves.toBe(0)
    expect(await avisos()).toEqual([])
  })

  it('dos pasadas concurrentes sobre la misma ficha: sólo una marca y un solo aviso', async () => {
    await director()
    await ficha()
    const [a, b] = await Promise.all([avisarReclamacionesVencidas(db, DIA_61), avisarReclamacionesVencidas(db, DIA_61)])
    expect(a + b).toBe(1)
    expect(await avisos()).toHaveLength(1)
  })
})

describe('pasadaReclamaciones · una vez por día civil y proceso, y NUNCA lanza', () => {
  const contando = (base: Queryable) => {
    const c = { consultas: 0 }
    return { c, db: { query: ((s: string, p?: unknown[]) => { c.consultas++; return base.query(s, p) }) as Queryable['query'] } }
  }

  it('dos pasadas el mismo día evalúan una sola vez; la de otro día vuelve a evaluar', async () => {
    await director()
    await ficha()
    const { c, db: d } = contando(db)
    await pasadaReclamaciones(d, '2026-06-10')
    const tras1 = c.consultas
    expect(tras1).toBeGreaterThan(0)
    await pasadaReclamaciones(d, '2026-06-10')
    expect(c.consultas).toBe(tras1)
    expect(await avisos()).toHaveLength(1)
    await pasadaReclamaciones(d, '2026-06-11')
    expect(c.consultas).toBeGreaterThan(tras1)
    expect(await avisos()).toHaveLength(1)
  })

  it('con la base caída, la pasada resuelve y la sincronización encadenada corre igual', async () => {
    const rota: Queryable = { query: (() => { throw new Error('base caída') }) as Queryable['query'] }
    const syncRecent = vi.fn().mockResolvedValue(undefined)
    await expect(pasadaReclamaciones(rota, '2026-07-01')).resolves.toBeUndefined()
    await pasadaReclamaciones(rota, '2026-07-02').then(() => syncRecent())
    expect(syncRecent).toHaveBeenCalledTimes(1)
  })

  it('index.ts: la línea de la pasada periódica lleva pasadaReclamaciones(pool) y ANTES de sync.syncRecent() (fichero vigilado)', () => {
    const texto = readFileSync(fileURLToPath(new URL('../index.ts', import.meta.url)), 'utf8')
    expect(texto).toMatch(/import\s*\{[^}]*\bpasadaReclamaciones\b[^}]*\}\s*from\s*['"]\.\/services\/avisoReclamacionProveedor['"]/)
    const cuerpo = /setInterval\(\s*\(\)\s*=>\s*\{([\s\S]*?)\n\s*\},\s*config\.syncIntervalMs\s*\)/.exec(texto)?.[1]
    expect(cuerpo, 'no se encuentra el setInterval de la sincronización').toBeDefined()
    const conSync = cuerpo!.split(/\r?\n/).map((l) => l.replace(/\s+/g, ' ').trim()).filter((l) => l.includes('sync.syncRecent()'))
    expect(conSync).toHaveLength(1)
    expect(conSync[0]).toContain('pasadaReclamaciones(pool)')
    expect(conSync[0]!.indexOf('pasadaReclamaciones(pool)')).toBeLessThan(conSync[0]!.indexOf('sync.syncRecent()'))
  })
})

// ── Cierre del verify: W-2 (a cada destinatario) y S-2 (la guarda de estado del UPDATE de la marca) ──
describe('cierre · a CADA destinatario y la guarda de carrera de la marca (W-2, S-2)', () => {
  it('con dos usuarios en el cargo, la pasada avisa a los dos y marca la ficha una sola vez (W-2)', async () => {
    const a = await director('dt1@x.co')
    const b = await director('dt2@x.co')
    const id = await ficha()
    expect(await avisarReclamacionesVencidas(db, DIA_61)).toBe(1)
    expect((await avisos()).map((x) => x.user_id).sort()).toEqual([a, b].sort())
    expect(await marca(id)).not.toBeNull()
    expect(await avisarReclamacionesVencidas(db, '2026-05-02')).toBe(0)
    expect(await avisos()).toHaveLength(2)
  })

  it('en el respaldo, con dos usuarios del área Servicio Técnico, avisa a los dos y no al cargo ausente (W-2)', async () => {
    const rol = await createRole(db, { name: 'ST2', areas: ['Servicio Técnico'] })
    await actualizarRecibeAvisos(db, rol.id, true)
    const u1 = (await createUser(db, { email: 'st1@x.co', name: 'st1', passwordHash: 'h', roleId: rol.id })).id
    const u2 = (await createUser(db, { email: 'st2@x.co', name: 'st2', passwordHash: 'h', roleId: rol.id })).id
    await ficha()
    expect(await avisarReclamacionesVencidas(db, DIA_61)).toBe(1)
    expect((await avisos()).map((x) => x.user_id).sort()).toEqual([u1, u2].sort())
  })

  it('una ficha que pasa a resuelta entre la selección y el UPDATE no se marca ni avisa (S-2)', async () => {
    await director()
    const id = await ficha()
    const leida = (await reclamacionPorId(db, id))! // lo que la pasada habría seleccionado
    await avanzarFicha(db, id, 'abierta', { a: 'enviada' })
    await avanzarFicha(db, id, 'enviada', { a: 'resuelta', resultado: 'reposicion', valorRecuperado: 1 })
    expect(await marcarYAvisarReclamacion(db, leida, 'tarde')).toBe(false)
    expect(await marca(id)).toBeNull()
    expect(await avisos()).toEqual([])
  })
})
