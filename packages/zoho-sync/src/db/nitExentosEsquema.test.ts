import { describe, it, expect } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, schemaStatements, type Queryable } from './migrate'

/**
 * nit-exentos-aviso-provisional (F1B-19) · RQ-TC-57 · `public.nit_exentos` es DATO sembrado con UNA fila.
 *
 * Vigila `schema.sql` (regla de mutación 2): cada prueba se rompe ensuciando el fichero, no el guardián.
 * Las pruebas de posición anclan por orden RELATIVO, para que la siguiente tabla no las toque.
 */
async function freshDb(): Promise<Queryable> {
  const pg = newDb().adapters.createPg()
  const db = new pg.Pool()
  await migrate(db)
  return db
}

const sinComentarios = (stmt: string): string => stmt.replace(/^(?:\s*--[^\n]*\n)+/, '').trim()
const limpias = (): string[] => schemaStatements().map(sinComentarios)
const sentenciasDeSiembra = (): string[] => limpias().filter((s) => /^INSERT INTO public\.nit_exentos\b/i.test(s))

describe('F1B-19 · public.nit_exentos (RQ-TC-57)', () => {
  it('tras migrate hay UNA fila: 222222222222, activa, «Consumidor final»', async () => {
    const db = await freshDb()
    const r = await db.query('SELECT nit, motivo, activo FROM public.nit_exentos')
    expect(r.rows).toEqual([{ nit: '222222222222', motivo: 'Consumidor final', activo: true }])
  })

  it('una fila sin motivo se rechaza (motivo NOT NULL)', async () => {
    const db = await freshDb()
    await expect(db.query("INSERT INTO public.nit_exentos (nit, motivo) VALUES ('800111222', NULL)")).rejects.toThrow()
    await expect(db.query("INSERT INTO public.nit_exentos (nit) VALUES ('800111222')")).rejects.toThrow()
    expect((await db.query('SELECT nit FROM public.nit_exentos')).rows).toEqual([{ nit: '222222222222' }])
  })

  it('migrar dos veces conserva la fila retirada con activo = false', async () => {
    const db = await freshDb()
    await db.query("UPDATE public.nit_exentos SET activo = false WHERE nit = '222222222222'")
    await migrate(db)
    const r = await db.query('SELECT nit, activo FROM public.nit_exentos')
    expect(r.rows).toEqual([{ nit: '222222222222', activo: false }])
  })

  it('hay una sola sentencia de siembra, con ON CONFLICT (nit) DO NOTHING, y no siembra ningún otro NIT', () => {
    const siembra = sentenciasDeSiembra()
    expect(siembra).toHaveLength(1)
    expect(siembra[0]).toMatch(/ON CONFLICT \(nit\) DO NOTHING$/)
    expect(siembra[0]!.match(/'\d+'/g)).toEqual(["'222222222222'"])
  })

  it('el CREATE va calificado con public. y viene DESPUÉS de idx_encuesta_respuestas_ticket (orden relativo)', () => {
    const l = limpias()
    const crear = l.findIndex((s) => /nit_exentos \(/.test(s) && /^CREATE TABLE/i.test(s))
    const previa = l.findIndex((s) => /idx_encuesta_respuestas_ticket/.test(s))
    expect(crear).toBeGreaterThanOrEqual(0)
    expect(l[crear]).toMatch(/^CREATE TABLE IF NOT EXISTS public\.nit_exentos \(/)
    expect(previa).toBeGreaterThanOrEqual(0)
    expect(crear).toBeGreaterThan(previa)
    expect(l.filter((s) => /nit_exentos/.test(s))).toHaveLength(2)
  })
})

/**
 * F1B-19, lote 2 · RQ-AV-21 · `public.provisional_books_avisados`: la marca anti-duplicado del aviso. La unicidad la da la
 * clave primaria de la base (molde de `public.alarmas_avisadas`). Regla de mutación 2: se ensucia `schema.sql`.
 */
describe('F1B-19 · public.provisional_books_avisados (RQ-AV-21)', () => {
  const INSERTAR = 'INSERT INTO public.provisional_books_avisados (provisional_id, contacto_id, avisos_creados) VALUES ($1, $2, $3)'

  it('la tabla existe tras migrate, en public, y nace vacía', async () => {
    const db = await freshDb()
    expect((await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='provisional_books_avisados'")).rows).toHaveLength(1)
    expect((await db.query('SELECT * FROM public.provisional_books_avisados')).rows).toEqual([])
  })

  it('la pareja repetida da 23505; otro contacto del mismo provisional, o el mismo contacto de otro provisional, no', async () => {
    const db = await freshDb()
    await db.query(INSERTAR, ['p1', 'c1', 2])
    await expect(db.query(INSERTAR, ['p1', 'c1', 2])).rejects.toMatchObject({ code: '23505' })
    await db.query(INSERTAR, ['p1', 'c2', 2])
    await db.query(INSERTAR, ['p2', 'c1', 2])
    expect((await db.query('SELECT * FROM public.provisional_books_avisados')).rows).toHaveLength(3)
  })

  it('avisos_creados nulo se rechaza, y avisado_at nace con valor', async () => {
    const db = await freshDb()
    await expect(db.query(INSERTAR, ['p1', 'c1', null])).rejects.toThrow()
    await db.query(INSERTAR, ['p1', 'c1', 0])
    expect((await db.query('SELECT avisado_at FROM public.provisional_books_avisados')).rows[0].avisado_at).toBeTruthy()
  })

  it('el CREATE va calificado con public., una sola sentencia lo menciona y viene DESPUÉS de la siembra de nit_exentos (orden relativo)', () => {
    const l = limpias()
    const crear = l.findIndex((s) => /^CREATE TABLE/i.test(s) && /provisional_books_avisados \(/.test(s))
    const siembra = l.findIndex((s) => /^INSERT INTO public\.nit_exentos\b/i.test(s))
    expect(crear).toBeGreaterThanOrEqual(0)
    expect(siembra).toBeGreaterThanOrEqual(0)
    expect(l[crear]).toMatch(/^CREATE TABLE IF NOT EXISTS public\.provisional_books_avisados \(/)
    expect(l[crear]).toMatch(/PRIMARY KEY \(provisional_id, contacto_id\)/)
    expect(crear).toBeGreaterThan(siembra)
    expect(l.filter((s) => /provisional_books_avisados/.test(s))).toHaveLength(1)
  })
})
