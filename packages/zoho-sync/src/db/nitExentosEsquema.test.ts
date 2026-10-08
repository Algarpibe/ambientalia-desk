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
