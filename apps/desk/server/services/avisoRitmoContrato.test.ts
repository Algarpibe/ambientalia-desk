import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { asociarOV } from '@ambientalia/zoho-sync/db/ovAsociaciones'
import { avisarRitmoContratos, marcarYAvisarRitmo, pasadaRitmoContratos } from './avisoRitmoContrato'
import { crearContrato } from '../db/contratos'
import { createRole, actualizarRecibeAvisos } from '../auth/roles'
import { createUser } from '../auth/users'

/**
 * RQ-AV-14 (delta `derivacion-avisos`, registro-contrato lote 5): aviso de ritmo a Comercial, una vez por contrato y
 * trimestre. Anti-ruido en el propio `UPDATE` (`COALESCE(ritmo_avisado_trimestre,0) < $2`) y, además, una evaluación
 * como mucho por día civil y proceso. La pasada NUNCA lanza: va antes de la sincronización en `index.ts:88`.
 *
 * Atomicidad por ESTRUCTURA, no por filas: pg-mem no revierte un `ROLLBACK` (`db/transaccion.test.ts:25`, T0), así
 * que «un fallo de crearAviso deja la marca sin cambiar» no se puede ver mirando la tabla después. Se prueba que el
 * `UPDATE` de la marca y el `INSERT` del aviso van por el MISMO cliente entre `BEGIN` y `ROLLBACK`, que es lo que en
 * Postgres de verdad revierte los dos.
 */
let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

const LOTE = 'OV-2026-170'
// Contrato 2026-01-01 → 2026-12-31: t1 ene-mar, t2 abr-jun, t3 jul-sep, t4 oct-dic.
const EN_T2 = '2026-04-15' // transcurridos 105, restantes 260
const EN_T3 = '2026-07-15'

async function destinatarios(): Promise<{ comercial: string }> {
  const rol = await createRole(db, { name: 'Comercial', areas: ['Comercial'] })
  await actualizarRecibeAvisos(db, rol.id, true)
  const u = await createUser(db, { email: 'ana@x.co', name: 'Ana', passwordHash: 'h', roleId: rol.id })
  const st = await createRole(db, { name: 'ST', areas: ['Servicio Técnico'] })
  await actualizarRecibeAvisos(db, st.id, true)
  await createUser(db, { email: 'tec@x.co', name: 'Tec', passwordHash: 'h', roleId: st.id })
  return { comercial: u.id }
}

/** Contrato con `creadas` subOV y las `ejecutadas` primeras con ticket en `Finalizado`. */
async function contratoCon(creadas: number, ejecutadas: number, fechas = { fechaInicio: '2026-01-01', fechaFin: '2026-12-31' }) {
  await db.query("INSERT INTO books.contacts (contact_id, contact_name) VALUES ('C-1', 'Corola S.A.')")
  const c = await crearContrato(db, { clientId: 'C-1', lote: LOTE, creadoPor: 'c', ...fechas })
  for (let i = 1; i <= creadas; i++) {
    const n = String(i).padStart(2, '0')
    await db.query("INSERT INTO books.sales_orders (salesorder_id, salesorder_number, customer_id, date, status) VALUES ($1, $2, 'C-1', '2026-01-10', 'open')", [`so-${n}`, `${LOTE}-${n}`])
    if (i <= ejecutadas) await finalizar(n)
  }
  return c
}
async function finalizar(n: string): Promise<void> {
  await db.query("INSERT INTO tickets (id, number, subject, status) VALUES ($1, $2, 's', 'Finalizado')", [`t-${n}`, Number(n)])
  await db.query("INSERT INTO ticket_transitions (ticket_id, to_status, performed_at) VALUES ($1, 'Finalizado', '2026-02-10T15:00:00Z')", [`t-${n}`])
  await asociarOV(db, { ticketId: `t-${n}`, numero: `${LOTE}-${n}`, salesorderId: `so-${n}`, origen: 'alta', actor: 't', fechaOrdenCompra: null })
}
const avisos = async () => (await db.query('SELECT user_id, ticket_id, texto, enviado_at FROM avisos ORDER BY created_at')).rows as Array<{ user_id: string; ticket_id: string | null; texto: string; enviado_at: unknown }>
const marca = async (id: number) => (await db.query('SELECT ritmo_avisado_trimestre AS m FROM contratos WHERE id = $1', [id])).rows[0].m

describe('avisarRitmoContratos · la regla y el anti-ruido', () => {
  it('ritmo insuficiente en t2 → un aviso a cada destinatario de Comercial, sólo de bandeja, con lote, cliente, 1, 10 y fin', async () => {
    const { comercial } = await destinatarios()
    const c = await contratoCon(10, 1)
    expect(await avisarRitmoContratos(db, EN_T2)).toBe(1)
    const a = await avisos()
    expect(a.map((x) => x.user_id)).toEqual([comercial])
    expect(a[0]).toMatchObject({ ticket_id: null, enviado_at: null })
    for (const trozo of [LOTE, 'Corola S.A.', '1 de 10', '2026-12-31']) expect(a[0]!.texto).toContain(trozo)
    expect(await marca(c.id)).toBe(2)
  })

  it('una segunda evaluación en el mismo trimestre, otro día y con una ejecutada más, no repite el aviso', async () => {
    await destinatarios()
    await contratoCon(10, 1)
    await avisarRitmoContratos(db, EN_T2)
    await finalizar('02')
    expect(await avisarRitmoContratos(db, '2026-05-20')).toBe(0)
    expect(await avisos()).toHaveLength(1)
  })

  it('el UPDATE condicional por sí solo: dos marcas del mismo trimestre (dos lecturas previas a la escritura) → un aviso', async () => {
    await destinatarios()
    const c = await contratoCon(10, 1)
    expect(await marcarYAvisarRitmo(db, c.id, 2, 'primero')).toBe(true)
    expect(await marcarYAvisarRitmo(db, c.id, 2, 'segundo')).toBe(false)
    expect((await avisos()).map((a) => a.texto)).toEqual(['primero'])
  })

  it('el trimestre siguiente puede avisar de nuevo', async () => {
    await destinatarios()
    const c = await contratoCon(10, 1)
    await avisarRitmoContratos(db, EN_T2)
    expect(await avisarRitmoContratos(db, EN_T3)).toBe(1)
    expect(await avisos()).toHaveLength(2)
    expect(await marca(c.id)).toBe(3)
  })

  it.each<[string, number, number, string, { fechaInicio: string; fechaFin: string } | undefined]>([
    ['ritmo suficiente (9 de 10)', 10, 9, EN_T2, undefined],
    ['dentro del trimestre 1', 10, 0, '2026-03-31', undefined],
    ['sin subOV creadas', 0, 0, EN_T2, undefined],
    ['contrato vencido con ritmo malo', 10, 1, '2027-01-05', undefined],
  ])('%s → ningún aviso ni marca', async (_n, creadas, ejecutadas, hoy, fechas) => {
    await destinatarios()
    const c = await contratoCon(creadas, ejecutadas, fechas)
    expect(await avisarRitmoContratos(db, hoy)).toBe(0)
    expect(await avisos()).toEqual([])
    expect(await marca(c.id)).toBeNull()
  })
})

// ── Atomicidad por estructura (Plan B de `db/transaccion.test.ts`): quién recibe cada sentencia ──
interface ConPool { connect: () => Promise<{ query: Queryable['query']; release: () => void }> }
function rastreador(fallaEn: string): { db: Queryable & ConPool; calls: string[] } {
  const calls: string[] = []
  const hacer = (quien: string) => async (sql: string) => {
    const verbo = sql.trim().split(/\s+/)[0]!.toUpperCase()
    calls.push(`${quien}:${verbo}`)
    if (verbo === fallaEn) throw new Error(`boom (${fallaEn})`)
    if (/UPDATE contratos/i.test(sql)) return { rows: [{ id: 7 }] }
    if (/FROM users/i.test(sql)) return { rows: [{ id: 'u1', email: 'a@x.co', name: 'A', is_admin: false, role_areas: ['Comercial'] }] }
    return { rows: [] }
  }
  const pool = { query: hacer('pool') as Queryable['query'], connect: async () => ({ query: hacer('cliente') as Queryable['query'], release: () => {} }) }
  return { db: pool, calls }
}

describe('marcarYAvisarRitmo · la marca y el aviso, en el MISMO cliente entre BEGIN y COMMIT/ROLLBACK', () => {
  it('si crearAviso falla (INSERT), la marca va en la misma transacción revertida y nada toca el pool', async () => {
    const { db: d, calls } = rastreador('INSERT')
    await expect(marcarYAvisarRitmo(d, 7, 2, 'texto')).rejects.toThrow('boom')
    expect(calls).toEqual(['cliente:BEGIN', 'cliente:UPDATE', 'cliente:SELECT', 'cliente:INSERT', 'cliente:ROLLBACK'])
  })

  it('sin fallo: BEGIN, UPDATE, SELECT, INSERT, COMMIT, todo por el cliente', async () => {
    const { db: d, calls } = rastreador('NINGUNO')
    await expect(marcarYAvisarRitmo(d, 7, 2, 'texto')).resolves.toBe(true)
    expect(calls).toEqual(['cliente:BEGIN', 'cliente:UPDATE', 'cliente:SELECT', 'cliente:INSERT', 'cliente:COMMIT'])
  })

  it('avisarRitmoContratos no lanza aunque crearAviso falle en una base real (pg-mem)', async () => {
    await destinatarios()
    await contratoCon(10, 1)
    const pool = db as unknown as ConPool
    const rota: Queryable & ConPool = {
      query: db.query.bind(db),
      connect: async () => {
        const c = await pool.connect()
        return { query: ((s: string, p?: unknown[]) => (/INSERT INTO avisos/.test(s) ? Promise.reject(new Error('boom')) : c.query(s, p))) as Queryable['query'], release: () => c.release() }
      },
    }
    await expect(avisarRitmoContratos(rota, EN_T2)).resolves.toBe(0)
    expect(await avisos()).toEqual([])
  })
})

describe('pasadaRitmoContratos · una vez por día civil y proceso, y NUNCA lanza', () => {
  const contando = (base: Queryable) => {
    const n = { consultas: 0 }
    return { n, db: { query: ((s: string, p?: unknown[]) => { n.consultas++; return base.query(s, p) }) as Queryable['query'] } }
  }

  it('dos pasadas el mismo día evalúan una sola vez; la de otro día vuelve a evaluar', async () => {
    await destinatarios()
    await contratoCon(10, 1)
    const { n, db: d } = contando(db)
    await pasadaRitmoContratos(d, '2026-04-16')
    const tras1 = n.consultas
    expect(tras1).toBeGreaterThan(0)
    await pasadaRitmoContratos(d, '2026-04-16')
    expect(n.consultas).toBe(tras1)
    expect(await avisos()).toHaveLength(1)
    await pasadaRitmoContratos(d, '2026-04-17')
    expect(n.consultas).toBeGreaterThan(tras1)
    expect(await avisos()).toHaveLength(1) // mismo trimestre: el UPDATE condicional tampoco deja repetir
  })

  it('con la base caída, la pasada resuelve y la sincronización encadenada como en index.ts:88 corre igual', async () => {
    const rota: Queryable = { query: (() => { throw new Error('base caída') }) as Queryable['query'] }
    const syncRecent = vi.fn().mockResolvedValue(undefined)
    await expect(pasadaRitmoContratos(rota, '2026-04-18')).resolves.toBeUndefined()
    await pasadaRitmoContratos(rota, '2026-04-19').then(() => syncRecent())
    expect(syncRecent).toHaveBeenCalledTimes(1)
  })

  it('index.ts:88 encadena la pasada ANTES de la sincronización (fichero vigilado, regla de mutación 2)', () => {
    const lineas = readFileSync(fileURLToPath(new URL('../index.ts', import.meta.url)), 'utf8').split(/\r?\n/)
    expect(lineas[87]).toBe('    let p: Promise<unknown> = pasadaRitmoContratos(pool).then(() => sync.syncRecent())')
    expect(lineas[14]).toContain("import { pasadaRitmoContratos } from './services/avisoRitmoContrato'")
  })
})
