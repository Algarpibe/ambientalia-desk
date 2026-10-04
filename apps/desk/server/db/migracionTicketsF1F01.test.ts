import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { equivalenciaDeEstado, ID_TRANSICION_MIGRACION } from '@ambientalia/shared'
import { migrarTicketsAbiertos } from './migracionTicketsAbiertos'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'

/**
 * Guardián de `docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql` (RQ-ZS-18). El script NO se ejecuta contra ninguna base real:
 * lo ejecuta una persona. Aquí se corre sobre pg-mem, por sentencias, con un fixture DERIVADO de `schema.sql` y calificado
 * `desk.`. El marcador lo escribe el EJECUTOR de verdad (`apps/desk/server/db/migracionTicketsAbiertos.ts`), con un
 * envoltorio que califica `tickets` y `ticket_transitions` con `desk.` (el ejecutor corre con el `search_path` de la app;
 * el `.sql`, no). La atomicidad se comprueba por lectura estática, no por rollback real.
 */
const DIR = path.dirname(fileURLToPath(import.meta.url))
const RUTA_SQL = path.join(DIR, '../../../../docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql')
const RUTA_SCHEMA = path.join(DIR, '../../../../packages/zoho-sync/src/db/schema.sql')
const CORTE = new Date('2026-12-01T05:00:00Z')

const leerScript = (): string => readFileSync(RUTA_SQL, 'utf8').replace(/\r\n/g, '\n')

/** Líneas activas: sin comentarios; con `reversion` se les quita el prefijo `-- REV ` antes. */
function sentencias(texto: string, reversion: boolean): string[] {
  const lineas = texto.split('\n').map((l) => (reversion ? l.replace(/^-- REV /, '') : l))
  return lineas.filter((l) => !/^\s*--/.test(l)).join('\n').split(';').map((s) => s.trim()).filter(Boolean)
}
const activas = () => sentencias(leerScript(), false)
const reversion = () => sentencias(leerScript(), true).slice(activas().length)

function ddlDerivado(): string[] {
  const schema = readFileSync(RUTA_SCHEMA, 'utf8').replace(/\r\n/g, '\n')
  const bloques = [...schema.matchAll(/CREATE TABLE IF NOT EXISTS (tickets|ticket_transitions) \(([\s\S]*?)\n\);/g)]
  expect(bloques.map((b) => b[1]), 'el fixture deriva de DOS bloques de schema.sql').toEqual(['tickets', 'ticket_transitions'])
  return ['CREATE SCHEMA desk', ...bloques.map((b) => `CREATE TABLE desk.${b[1]} (${b[2]}\n)`)]
}

type Pool = { query: (s: string, p?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>; connect: () => Promise<{ query: Pool['query']; release: () => void }> }
let pool: Pool
let ejecutor: Queryable

const califica = (sql: string) => sql.replace(/\b(FROM|INTO|UPDATE)\s+(tickets|ticket_transitions)\b/g, '$1 desk.$2')

async function sql(lista: string[]): Promise<void> { for (const s of lista) await pool.query(s) }

type Opt = { st?: string | null; cls?: string | null; managed?: boolean; closed?: string | null }
async function tk(id: string, number: number, status: string, o: Opt = {}): Promise<void> {
  await pool.query(
    `INSERT INTO desk.tickets (id, number, status, status_type, classification, managed_by_app, created_time, modified_time, closed_time, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,'2026-10-01T10:00:00Z','2026-09-01T00:00:00Z',$7,'2026-01-01T00:00:00Z')`,
    [id, number, status, o.st === undefined ? 'Open' : o.st, o.cls ?? null, o.managed ?? false, o.closed ?? null],
  )
}
const fotoTickets = async () =>
  (await pool.query('SELECT id, status, status_type, managed_by_app, modified_time, closed_time FROM desk.tickets ORDER BY id')).rows
const idsMarcador = async () =>
  (await pool.query(`SELECT ticket_id FROM desk.ticket_transitions WHERE transition_id = '${ID_TRANSICION_MIGRACION}' ORDER BY ticket_id`)).rows.map((r) => String(r.ticket_id))

/** Siembra los tres tipos de regla que cambian algo, la identidad, el soporte remoto, y controles que no se tocan. */
async function sembrar(): Promise<void> {
  await tk('e1', 4100, 'Entregado', { st: 'Open', closed: '2026-09-15T00:00:00Z' }) // entregado-a-finalizado
  await tk('e2', 4101, 'Entregado', { st: null }) // status_type previo NULL
  await tk('p1', 4200, 'Pendiente', { cls: 'Servicio Técnico' }) // servicio: tendrá transición posterior
  await tk('p3', 4202, 'Pendiente', { cls: null }) // servicio, NULL cuenta como servicio
  await tk('p2', 4201, 'Pendiente', { cls: 'Soporte remoto' }) // conserva
  await tk('i1', 4300, 'En Proceso') // identidad
  await tk('i2', 4301, 'En Proceso') // identidad con transición posterior
  await tk('g1', 4400, 'En Proceso', { managed: true }) // gobernado: ni se migra ni se revierte
  await tk('c1', 4500, 'Finalizado', { st: 'Closed' }) // cerrado: fuera
}

beforeEach(async () => {
  pool = new (newDb().adapters.createPg().Pool)() as unknown as Pool
  await sql(ddlDerivado())
  ejecutor = {
    query: (s: string, p?: unknown[]) => pool.query(califica(s), p),
    connect: async () => { const c = await pool.connect(); return { query: (s: string, p?: unknown[]) => c.query(califica(s), p), release: () => c.release() } },
  } as unknown as Queryable
  await sembrar()
})

/** Migra con el ejecutor y simula que la app movió `p1` e `i2` DESPUÉS: una transición posterior al marcador. */
async function migrarYMoverDosDespues(): Promise<void> {
  const inf = await migrarTicketsAbiertos(ejecutor, { corte: CORTE, aplicar: true, actor: 'Admin' })
  expect(inf).toMatchObject({ aplicado: true, negativa: null, migrables: 7 })
  for (const id of ['p1', 'i2']) {
    await pool.query(`INSERT INTO desk.ticket_transitions (ticket_id, transition_id, from_status, to_status, performed_by) VALUES ('${id}', 'x', 'En Proceso', 'Reparación', 'tester')`)
  }
}

describe('Migracion_Tickets_Abiertos_F1F-01.sql (pg-mem, por sentencias)', () => {
  it('(a) la reversión restaura status, status_type y managed_by_app de lo que el marcador recuerda, y deja intactos closed_time y los tickets sin revertir', async () => {
    const antes = await fotoTickets()
    await migrarYMoverDosDespues()
    const migrado = await fotoTickets()
    expect(migrado.find((t) => t.id === 'e1')).toMatchObject({ status: 'Finalizado', status_type: 'Closed', managed_by_app: true })
    expect(migrado.find((t) => t.id === 'p3')).toMatchObject({ status: 'En Proceso', status_type: 'Open', managed_by_app: true })
    await sql(reversion())
    const despues = await fotoTickets()
    for (const id of ['e1', 'e2', 'p3', 'p2', 'i1', 'g1', 'c1']) {
      expect(despues.find((t) => t.id === id), `ticket ${id} restaurado`).toEqual(antes.find((t) => t.id === id))
    }
    // Con una transición posterior al marcador no se revierte nada: ni el estado ni la marca de gobierno.
    for (const id of ['p1', 'i2']) expect(despues.find((t) => t.id === id), `ticket ${id} sin revertir`).toEqual(migrado.find((t) => t.id === id))
  })

  it('(b) borra sólo los marcadores de lo restaurado y conserva el de quien tiene una transición posterior', async () => {
    await migrarYMoverDosDespues()
    expect(await idsMarcador()).toHaveLength(7)
    await sql(reversion())
    expect(await idsMarcador()).toEqual(['i2', 'p1'])
    expect((await pool.query(`SELECT id FROM desk.ticket_transitions WHERE transition_id = 'x'`)).rows).toHaveLength(2)
  })

  it('(c) el procedimiento lista los no revertidos para decisión de una persona', async () => {
    await migrarYMoverDosDespues()
    await sql(reversion().filter((s) => !/^SELECT\b/i.test(s)))
    const listados = reversion().filter((s) => /^SELECT\b/i.test(s))
    expect(listados.length, 'el bloque REV trae un SELECT de los movidos después').toBeGreaterThan(0)
    const filas = (await pool.query(listados[listados.length - 1])).rows
    expect(filas.map((r) => r.number)).toEqual([4200, 4301])
  })

  it('(d) una reversión repetida no cambia nada', async () => {
    await migrarYMoverDosDespues()
    await sql(reversion())
    const tras1 = { t: await fotoTickets(), m: await idsMarcador() }
    await sql(reversion())
    expect({ t: await fotoTickets(), m: await idsMarcador() }).toEqual(tras1)
  })

  it('(e) los pasos de lectura previos sólo leen y corren sobre el esquema', async () => {
    const previas = activas()
    expect(previas.length, 'guarda contra el bucle fantasma').toBeGreaterThanOrEqual(3)
    for (const s of previas) expect(s, `el procedimiento activo sólo lee: ${s.slice(0, 40)}`).toMatch(/^SELECT\b/i)
    const antes = { t: await fotoTickets(), m: await idsMarcador() }
    for (const s of previas) await pool.query(s)
    expect({ t: await fotoTickets(), m: await idsMarcador() }).toEqual(antes)
  })

  it('(f) toda tabla va calificada por esquema, también la reversión, y no queda ninguna desnuda', () => {
    const todo = sentencias(leerScript(), true).join(';\n')
    const refs = [...todo.matchAll(/\b(?:FROM|INTO|UPDATE|JOIN)\s+([^\s(]+)/gi)].map((m) => m[1])
    expect(refs.length, 'guarda contra el bucle fantasma').toBeGreaterThanOrEqual(8)
    for (const r of refs) expect(r, `tabla sin calificar: ${r}`).toMatch(/^desk\.(tickets|ticket_transitions)$/)
    expect(todo.match(/(?<!desk\.)\b(tickets|ticket_transitions)\b/g), 'ninguna mención sin calificar').toBeNull()
  })

  it('(g) un único BEGIN y un único COMMIT, los dos en la reversión, y nada que escriba fuera del prefijo «-- REV »', () => {
    const rev = reversion().map((s) => s.trim())
    expect(rev.filter((x) => /^BEGIN$/i.test(x))).toHaveLength(1)
    expect(rev.filter((x) => /^COMMIT$/i.test(x))).toHaveLength(1)
    expect(rev.findIndex((x) => /^BEGIN$/i.test(x))).toBeLessThan(rev.findIndex((x) => /^UPDATE\b/i.test(x)))
    expect(rev.findIndex((x) => /^DELETE\b/i.test(x))).toBeLessThan(rev.findIndex((x) => /^COMMIT$/i.test(x)))
    expect(activas().filter((x) => /^(BEGIN|COMMIT|UPDATE|DELETE|INSERT)\b/i.test(x)), 'la parte activa no escribe').toEqual([])
    const crudo = leerScript().split('\n')
    expect(crudo.filter((l) => /^(BEGIN|COMMIT|UPDATE|DELETE|INSERT)\b/i.test(l.trim())), 'sin sentencia que escriba sin prefijo').toEqual([])
  })

  it('(h) una sentencia de reversión por cada regla que cambia el estado, más una de identidad que sólo restaura managed_by_app', () => {
    const muestras: Array<[string, string | null]> = [['Entregado', null], ['Pendiente', 'Servicio Técnico'], ['Pendiente', 'Soporte remoto'], ['En Proceso', null]]
    const reglas = muestras.map(([e, c]) => equivalenciaDeEstado(e, c)!)
    const cambian = reglas.filter((r) => r.statusTypeDestino !== null).map((r) => r.regla)
    expect(cambian.sort()).toEqual(['entregado-a-finalizado', 'pendiente-servicio-a-en-proceso'])
    const updates = reversion().filter((s) => /^UPDATE\s+desk\.tickets/i.test(s))
    expect(updates, 'una por regla que cambia el estado más la de identidad').toHaveLength(cambian.length + 1)
    for (const regla of cambian) expect(updates.filter((u) => u.includes(`'${regla}'`)), `una sola sentencia para ${regla}`).toHaveLength(1)
    const identidad = updates.filter((u) => u.includes("'identidad'"))
    expect(identidad).toHaveLength(1)
    expect(identidad[0]).toContain("'pendiente-soporte-se-conserva'")
    const set = /SET([\s\S]*?)\bFROM\b/i.exec(identidad[0])
    expect(set![1]).toMatch(/managed_by_app/)
    expect(set![1]).not.toMatch(/\bstatus\b|status_type/)
    for (const u of updates) expect(u, 'filtra por el marcador y por su última transición').toMatch(new RegExp(`'${ID_TRANSICION_MIGRACION}'[\\s\\S]*max\\(id\\)`))
  })

  it('(i) no toca closed_time ni modified_time, ni lleva metacomandos ni secretos', () => {
    const texto = leerScript()
    const rev = reversion().join(';\n')
    expect(rev).not.toMatch(/closed_time|modified_time/i)
    expect(texto).not.toMatch(/^\\/m)
    expect(texto).not.toMatch(/password|secret|token|postgres(ql)?:\/\//i)
  })
})
