import { describe, it, expect } from 'vitest'
import type { Queryable } from '@ambientalia/zoho-sync/db/migrate'
import type { CreateTicketInput } from '@ambientalia/zoho-sync/db/repo'
import { crearTicketConEquipo, type EquipoAResolver } from './equipoNuevo'

/** Lo que hace falta de un pool para abrir una transacción, igual que en `eliminarTicket.ts:166`. */
interface ConPool { connect: () => Promise<{ query: Queryable['query']; release: () => void }> }

/**
 * Rastreador de verbos, Plan B de T0 (`db/transaccion.test.ts`, T0 rojo: pg-mem no revierte un
 * `ROLLBACK` de verdad). Registra el verbo de cada llamada —de `connect()` y de `db.query`
 * directo— y, opcionalmente, lanza en la N-ésima vez que aparece `failOnNthOf`.
 */
function rastreador(failOnNthOf?: { verb: string; n: number }): { db: Queryable & ConPool; calls: string[]; releases: () => number } {
  const calls: string[] = []
  let released = 0
  let contador = 0
  const ejecutar = async (sql: string) => {
    const verb = sql.trim().split(/\s+/)[0].toUpperCase()
    calls.push(verb)
    if (failOnNthOf && verb === failOnNthOf.verb) {
      contador += 1
      if (contador === failOnNthOf.n) throw new Error(`boom (${verb} #${failOnNthOf.n})`)
    }
    // `nextTicketNumber` (`repo.ts:229-232`) lee `rows[0].n`: el rastreador no tiene BD real detrás,
    // así que le da un valor fijo para que `createTicket` pueda seguir su curso normal.
    if (sql.includes('nextval')) return { rows: [{ n: 1 }] }
    return { rows: [] }
  }
  const db: Queryable & ConPool = { query: ejecutar, connect: async () => ({ query: ejecutar, release: () => { released += 1 } }) }
  return { db, calls, releases: () => released }
}

const INPUT: CreateTicketInput = {
  subject: 'x', codigoServicio: null, classification: null, tipoServicio: null, equipo: null,
  marca: null, modelo: null, serial: 'SN-X', ordenVenta: null, priority: null,
  clientId: 'cli-1', salesorderId: null, equipoId: null, actor: 'Admin',
}

const NUEVO_PROVISIONAL: EquipoAResolver = {
  equipo: { id: '', serial: 'SN-X', marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor' },
  datos: { serial: 'SN-X', marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor', modeloId: 'mo-1' },
}

/**
 * `crearTicketConEquipo` — atomicidad de RQ-TC-16 (Fase 6, Plan B de T0). Confirmado por T0
 * (`db/transaccion.test.ts`): pg-mem no revierte un `ROLLBACK` de verdad, así que la prueba mira la
 * SECUENCIA DE VERBOS —no filas reales tras el rollback— para confirmar que no queda a medias.
 */
describe('crearTicketConEquipo', () => {
  it('equipo registrado o reutilizado (id no vacío): createTicket idéntico a hoy, sin tocar `datos`', async () => {
    const { db, calls } = rastreador()
    const nuevo: EquipoAResolver = { equipo: { id: 'eq-existente', serial: 'SN-X' }, datos: null }
    const id = await crearTicketConEquipo(db, nuevo, 'Cliente', INPUT)
    expect(id).toMatch(/^app-/)
    // No hay ningún INSERT sobre `equipos`: sólo los dos de `createTicket` (ticket + transición).
    expect(calls.filter((v) => v === 'INSERT').length).toBe(2)
  })

  it('sin `nuevo` (equipoId directo): idéntico a hoy', async () => {
    const { db, calls } = rastreador()
    const id = await crearTicketConEquipo(db, null, 'Cliente', INPUT)
    expect(id).toMatch(/^app-/)
    expect(calls.filter((v) => v === 'INSERT').length).toBe(2)
  })

  it('equipo provisional, todo bien: crea el equipo Y el ticket en la misma transacción, y libera el cliente', async () => {
    const { db, calls, releases } = rastreador()
    const id = await crearTicketConEquipo(db, NUEVO_PROVISIONAL, 'Cliente', INPUT)
    expect(id).toMatch(/^app-/)
    // Los 3 INSERT (equipo, ticket, transición) quedan DENTRO de un único BEGIN…COMMIT.
    expect(calls[0]).toBe('BEGIN')
    expect(calls.at(-1)).toBe('COMMIT')
    expect(calls.filter((v) => v === 'INSERT').length).toBe(3)
    expect(calls).not.toContain('ROLLBACK')
    expect(releases()).toBe(1)
  })

  it('criterio 5 / RQ-TC-16 · si el INSERT del ticket falla, hace ROLLBACK y NO queda equipo confirmado', async () => {
    // El 2.º INSERT de la secuencia es el del ticket (el 1.º es el del equipo): fallarlo simula que
    // `createTicket` no pudo escribir aunque el equipo ya se había insertado dentro de la misma
    // transacción abierta.
    const { db, calls, releases } = rastreador({ verb: 'INSERT', n: 2 })
    await expect(crearTicketConEquipo(db, NUEVO_PROVISIONAL, 'Cliente', INPUT)).rejects.toThrow('boom (INSERT #2)')
    expect(calls[0]).toBe('BEGIN')
    expect(calls.at(-1)).toBe('ROLLBACK')
    expect(calls).not.toContain('COMMIT')
    // 2 INSERT emitidos (equipo, y el del ticket que falla); el `ROLLBACK` es lo que evita que el
    // primero quede confirmado — sin transacción, esa fila del equipo se habría quedado escrita.
    expect(calls.filter((v) => v === 'INSERT').length).toBe(2)
    expect(releases()).toBe(1)
  })
})

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// verificacion-gas-patron-certificado (F1A-03, lote 1 · `hojas-vida` RQ-HV-13, RQ-HV-14): el equipo
// provisional del ticket «Equipo nuevo» hereda el compuesto del modelo y NUNCA lo toma del cuerpo. A
// diferencia de las de arriba, éstas corren sobre pg-mem de verdad: lo que se mira son filas.
// ══════════════════════════════════════════════════════════════════════════════════════════════════
import { beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate } from '@ambientalia/zoho-sync/db/migrate'
import { createManagedTicket } from './ticketService'

describe('alta con «Equipo nuevo» · compuesto del equipo (F1A-03)', () => {
  let real: Queryable
  beforeEach(async () => {
    const pg = newDb().adapters.createPg()
    real = new pg.Pool()
    await migrate(real)
    await real.query("INSERT INTO books.contacts (contact_id, contact_name) VALUES ('cli-c','Cliente C')")
  })

  async function modelo(id: string, compuesto: string | null): Promise<void> {
    await real.query('INSERT INTO catalogo_marcas (id,nombre) VALUES ($1,$2)', [`${id}-marca`, 'Horiba'])
    await real.query('INSERT INTO catalogo_tipos (id,nombre) VALUES ($1,$2)', [`${id}-tipo`, 'Analizador'])
    await real.query('INSERT INTO catalogo_modelos (id,marca_id,nombre,tipo_id,compuesto) VALUES ($1,$2,$3,$4,$5)', [id, `${id}-marca`, 'APSA-370', `${id}-tipo`, compuesto])
  }
  const alta = (serial: string, modeloId: string, extra: Record<string, unknown> = {}) =>
    createManagedTicket(real, {
      clasificaciones: 'Equipo nuevo', tipoServicio: 'Mantenimiento', prefijo: 'MT', clientId: 'cli-c',
      equipoNuevo: { serial, modeloId, fechaFacturaCompra: '2026-01-15', ...extra },
    }, 'Admin')
  const compuestoDe = async (serial: string) => (await real.query('SELECT compuesto FROM equipos WHERE serial=$1', [serial])).rows

  it('HV14-3 · el equipo provisional hereda NOₓ del modelo, canónico', async () => {
    await modelo('mo-c1', 'NOx')
    await alta('SN-C1', 'mo-c1')
    expect(await compuestoDe('SN-C1')).toEqual([{ compuesto: 'NOₓ' }])
  })

  it('HV13-3 · equipoNuevo.compuesto («metano») se ignora sin error: el alta resuelve y el compuesto queda nulo', async () => {
    await modelo('mo-c2', null)
    await expect(alta('SN-C2', 'mo-c2', { compuesto: 'metano' })).resolves.toBeDefined()
    expect(await compuestoDe('SN-C2')).toEqual([{ compuesto: null }])
  })

  it('HV14-2 en el ticket · un equipoNuevo.compuesto válido (H₂S) tampoco gana al del modelo (SO₂)', async () => {
    await modelo('mo-c3', 'SO₂')
    await alta('SN-C3', 'mo-c3', { compuesto: 'H₂S' })
    expect(await compuestoDe('SN-C3')).toEqual([{ compuesto: 'SO₂' }])
  })

  it('HV14-7 · reutilizar un serial ya registrado con H₂S y un modelo SO₂ no toca el compuesto ni crea otro equipo', async () => {
    await modelo('mo-c4', 'SO₂')
    await real.query("INSERT INTO equipos (id, serial, marca, modelo, tipo, compuesto) VALUES ('eq-c4','SN-C4','Horiba','APSA-370','Analizador','H₂S')")
    await alta('SN-C4', 'mo-c4')
    expect(await compuestoDe('SN-C4')).toEqual([{ compuesto: 'H₂S' }])
    expect((await real.query('SELECT COUNT(*)::int AS n FROM equipos')).rows[0].n).toBe(1)
  })
})
