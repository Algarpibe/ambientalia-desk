import { describe, it, expect } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, schemaStatements, PUBLIC_TABLES, type Queryable } from './migrate'

/**
 * calificaciones-cuadre-conversaciones · RQ-ZS-49 · `public.relleno_conversaciones_pasadas` es el registro operativo de cada pasada del relleno.
 *
 * Vigila `schema.sql` (regla de mutación 2): se rompe ensuciando el fichero, no el guardián. La posición se ancla a la ÚLTIMA sentencia (D-4).
 */
async function freshDb(): Promise<Queryable> {
  const pg = newDb().adapters.createPg()
  const db = new pg.Pool()
  await migrate(db)
  return db
}

const sinComentarios = (stmt: string): string => stmt.replace(/^(?:\s*--[^\n]*\n)+/, '').trim()
const limpias = (): string[] => schemaStatements().map((s) => sinComentarios(s.replace(/\r\n/g, '\n')))

describe('calificaciones-cuadre-conversaciones · public.relleno_conversaciones_pasadas (RQ-ZS-49)', () => {
  it('tras migrate la tabla existe en public y está vacía', async () => {
    const db = await freshDb()
    const t = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='relleno_conversaciones_pasadas'")
    expect(t.rows).toHaveLength(1)
    expect((await db.query('SELECT * FROM public.relleno_conversaciones_pasadas')).rows).toEqual([])
  })

  it('el CREATE va calificado con public. y es la ÚLTIMA sentencia; la única que la menciona', () => {
    const l = limpias()
    expect(l[l.length - 1]).toMatch(/^CREATE TABLE IF NOT EXISTS public\.relleno_conversaciones_pasadas \(/)
    expect(l.filter((s) => /relleno_conversaciones_pasadas/.test(s)), 'sentencias que mencionan la tabla').toHaveLength(1)
  })

  it('trae sus cuatro columnas y ningún dato de cliente', () => {
    const l = limpias()
    const crear = l[l.length - 1]
    for (const col of ['id', 'lanzada_at', 'terminada_at', 'resumen']) expect(crear, `columna ${col}`).toMatch(new RegExp(`\\b${col}\\b`))
    for (const dato of ['subject', 'contact', 'account']) expect(crear, `sin ${dato}`).not.toMatch(new RegExp(dato, 'i'))
  })

  it('PUBLIC_TABLES la contiene una sola vez', () => {
    expect(PUBLIC_TABLES.filter((t) => t === 'relleno_conversaciones_pasadas')).toHaveLength(1)
  })

  it('el resumen es obligatorio, terminada_at nace nula y lanzada_at toma el reloj de la base', async () => {
    const db = await freshDb()
    await expect(db.query('INSERT INTO public.relleno_conversaciones_pasadas (resumen) VALUES (NULL)')).rejects.toThrow()
    const r = await db.query("INSERT INTO public.relleno_conversaciones_pasadas (resumen) VALUES ('{\"peticiones\":3}') RETURNING id, lanzada_at, terminada_at, resumen")
    expect(r.rows).toHaveLength(1)
    expect(r.rows[0].terminada_at).toBeNull()
    expect(r.rows[0].lanzada_at).toBeInstanceOf(Date)
  })
})
