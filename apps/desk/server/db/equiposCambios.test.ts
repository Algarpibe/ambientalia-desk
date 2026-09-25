import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from '@ambientalia/zoho-sync/db/migrate'
import { createEquipo, deleteEquipo } from './equipos'
import { registrarEdicion, listarCambiosEquipo } from './equiposCambios'

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

async function crearEquipo(serial = 'SN-1'): Promise<string> {
  return createEquipo(db, { serial, marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor', clienteNombre: 'ACME', clientId: 'c1', modeloId: null })
}

describe('registrarEdicion + listarCambiosEquipo (D3, D5)', () => {
  it('inserta una fila por cada campo de cambios, con persona, anterior y nuevo', async () => {
    const eqId = await crearEquipo()
    await registrarEdicion(db, eqId, [
      { campo: 'codigoInterno', anterior: null, nuevo: 'INT-1' },
      { campo: 'driveUrl', anterior: null, nuevo: 'https://drive.google.com/x' },
    ], { id: 'u-1', nombre: 'Ana' }, async () => {})
    const filas = await listarCambiosEquipo(db, eqId)
    expect(filas).toHaveLength(2)
    expect(filas.map((f) => f.campo).sort()).toEqual(['codigoInterno', 'driveUrl'])
    expect(filas.every((f) => f.usuarioNombre === 'Ana')).toBe(true)
    const deCodigo = filas.find((f) => f.campo === 'codigoInterno')!
    expect(deCodigo).toMatchObject({ anterior: null, nuevo: 'INT-1' })
    expect(typeof deCodigo.fecha).toBe('string')
  })

  it('lee del cambio más reciente al más antiguo (created_at DESC, id DESC)', async () => {
    const eqId = await crearEquipo('SN-2')
    await registrarEdicion(db, eqId, [{ campo: 'codigoInterno', anterior: null, nuevo: 'A' }], { id: 'u-1', nombre: 'Ana' }, async () => {})
    await registrarEdicion(db, eqId, [{ campo: 'codigoInterno', anterior: 'A', nuevo: 'B' }], { id: 'u-1', nombre: 'Ana' }, async () => {})
    const filas = await listarCambiosEquipo(db, eqId)
    expect(filas.map((f) => f.nuevo)).toEqual(['B', 'A'])
  })

  it('resuelve el nombre del mantenedor, anterior y nuevo (LEFT JOIN clients … AND campo = mantenedorId)', async () => {
    const eqId = await crearEquipo('SN-3')
    await db.query("INSERT INTO books.contacts (contact_id,contact_name) VALUES ('cli-mant-a','Mantenedor A'),('cli-mant-b','Mantenedor B')")
    await registrarEdicion(db, eqId, [{ campo: 'mantenedorId', anterior: 'cli-mant-a', nuevo: 'cli-mant-b' }], { id: 'u-1', nombre: 'Ana' }, async () => {})
    const [fila] = await listarCambiosEquipo(db, eqId)
    expect(fila).toMatchObject({ campo: 'mantenedorId', anteriorTexto: 'Mantenedor A', nuevoTexto: 'Mantenedor B' })
  })

  it('un campo que no es mantenedorId no lleva anteriorTexto ni nuevoTexto', async () => {
    const eqId = await crearEquipo('SN-3b')
    await registrarEdicion(db, eqId, [{ campo: 'driveUrl', anterior: null, nuevo: 'https://drive.google.com/y' }], { id: 'u-1', nombre: 'Ana' }, async () => {})
    const [fila] = await listarCambiosEquipo(db, eqId)
    expect(fila.anteriorTexto).toBeUndefined()
    expect(fila.nuevoTexto).toBeUndefined()
  })

  it('las filas sobreviven al borrado físico del equipo', async () => {
    const eqId = await crearEquipo('SN-4')
    await registrarEdicion(db, eqId, [{ campo: 'codigoInterno', anterior: null, nuevo: 'A' }], { id: 'u-1', nombre: 'Ana' }, async () => {})
    await deleteEquipo(db, eqId)
    expect(await listarCambiosEquipo(db, eqId)).toHaveLength(1)
  })

  it('un equipo sin cambios devuelve un registro vacío', async () => {
    const eqId = await crearEquipo('SN-5')
    expect(await listarCambiosEquipo(db, eqId)).toEqual([])
  })
})

// ══════════════════════════════════════════════════════════════════════════════════════════════════
// Atomicidad (Fase 6, D5) — mismo molde que `transaccion.test.ts:59` (`rastreadorDeVerbos`), copiado
// aquí en vez de importado: importar un `.test.ts` reejecuta sus propios `describe` (T0 y
// `enTransaccion`) dentro de este fichero — comprobado con una sonda antes de escribir esto — y esa
// duplicación de suites no aporta nada a este fichero.
// ══════════════════════════════════════════════════════════════════════════════════════════════════

interface LlamadaTracker { verb: string; params?: unknown[] }

function rastreadorDeVerbos(failOn?: string): { db: Queryable; calls: LlamadaTracker[] } {
  const calls: LlamadaTracker[] = []
  const ejecutar = async (sql: string, params?: unknown[]) => {
    const verb = sql.trim().split(/\s+/)[0].toUpperCase()
    calls.push({ verb, params })
    if (failOn && verb === failOn) throw new Error('boom (rastreador)')
    return { rows: [] }
  }
  const db = {
    query: ejecutar,
    connect: async () => ({ query: ejecutar, release: () => {} }),
  }
  return { db: db as unknown as Queryable, calls }
}

describe('registrarEdicion — atomicidad (Fase 6, D5)', () => {
  it('camino feliz: BEGIN, UPDATE (escribir), INSERT×N (registro), COMMIT', async () => {
    const { db: mockDb, calls } = rastreadorDeVerbos()
    await registrarEdicion(mockDb, 'eq-1', [
      { campo: 'codigoInterno', anterior: null, nuevo: 'A' },
      { campo: 'driveUrl', anterior: null, nuevo: 'https://x' },
    ], { id: 'u-1', nombre: 'Ana' }, async (q) => { await q.query('UPDATE equipos SET codigo_interno=$1 WHERE id=$2', ['A', 'eq-1']) })
    expect(calls.map((c) => c.verb)).toEqual(['BEGIN', 'UPDATE', 'INSERT', 'INSERT', 'COMMIT'])
  })

  it('si escribir (el UPDATE) falla: BEGIN, UPDATE, ROLLBACK — sin INSERT de registro ni COMMIT', async () => {
    const { db: mockDb, calls } = rastreadorDeVerbos('UPDATE')
    await expect(registrarEdicion(mockDb, 'eq-1', [
      { campo: 'codigoInterno', anterior: null, nuevo: 'A' },
    ], { id: 'u-1', nombre: 'Ana' }, async (q) => { await q.query('UPDATE equipos SET codigo_interno=$1 WHERE id=$2', ['A', 'eq-1']) })).rejects.toThrow('boom (rastreador)')
    expect(calls.map((c) => c.verb)).toEqual(['BEGIN', 'UPDATE', 'ROLLBACK'])
  })
})
