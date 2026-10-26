import { describe, it, expect } from 'vitest'
import { newDb } from 'pg-mem'
import { normalizarEstado, sqlEstadoNormalizado } from '@ambientalia/shared'
import { conFuncionesDeEstado } from './pgMemEstado'

/**
 * La imitación de pg-mem frente a la regla (RQ-ZS-24, escenario «SQL = TS»; `design.md` «pg-mem»). pg-mem 3.0.14 no trae `btrim` ni
 * `regexp_replace`: `conFuncionesDeEstado` registra SÓLO lo que emite `sqlEstadoNormalizado`. Aquí se evalúa esa forma SQL en pg-mem
 * sobre las muestras de la spec y se exige lo mismo que `normalizarEstado`; y se exige que cualquier otro patrón NO se imite en silencio.
 */
const NBSP = '\u00a0'
const MUESTRAS = [
  'Notificación  Comercial', 'Notificación   Comercial', ' En Proceso', 'En Proceso ', '  En   Proceso  ',
  'Notificación Comercial', 'notificación comercial', 'Notificacion Comercial', 'Rev./Diagnostico',
  `Notificación\tComercial`, `Notificación${NBSP}Comercial`, `${NBSP}En Proceso`, '', '   ',
]

function baseConMuestras() {
  const mem = conFuncionesDeEstado(newDb())
  const pg = mem.adapters.createPg()
  const pool = new pg.Pool()
  return { mem, pool }
}

describe('la forma SQL en pg-mem da lo mismo que normalizarEstado', () => {
  it.each(MUESTRAS.map((m) => [JSON.stringify(m), m] as const))('muestra %s', async (_nombre, muestra) => {
    const { pool } = baseConMuestras()
    await pool.query('CREATE TABLE t (v text)')
    await pool.query('INSERT INTO t (v) VALUES ($1)', [muestra])
    const r = await pool.query(`SELECT ${sqlEstadoNormalizado('v')} AS r FROM t`)
    expect(r.rows).toEqual([{ r: normalizarEstado(muestra) }])
  })

  it('btrim recorta sólo U+0020: el tabulador y el NBSP de los extremos quedan', async () => {
    const { pool } = baseConMuestras()
    await pool.query('CREATE TABLE t (v text)')
    await pool.query('INSERT INTO t (v) VALUES ($1)', [`\t En${NBSP}`])
    const r = await pool.query('SELECT btrim(v) AS r FROM t')
    expect(r.rows).toEqual([{ r: `\t En${NBSP}` }])
  })

  it('NULL entra y NULL sale, como en PostgreSQL', async () => {
    const { pool } = baseConMuestras()
    await pool.query('CREATE TABLE t (v text)')
    await pool.query('INSERT INTO t (v) VALUES (NULL)')
    const r = await pool.query(`SELECT ${sqlEstadoNormalizado('v')} AS r FROM t`)
    expect(r.rows).toEqual([{ r: null }])
  })

  it('la expresión sirve dentro de un WHERE ... IN, como la usan las consultas', async () => {
    const { pool } = baseConMuestras()
    await pool.query('CREATE TABLE t (id int, v text)')
    await pool.query("INSERT INTO t (id, v) VALUES (1, 'Notificado '), (2, 'Notificado'), (3, 'Notificado X')")
    const r = await pool.query(`SELECT id FROM t WHERE ${sqlEstadoNormalizado('v')} IN ($1) ORDER BY id`, ['Notificado'])
    expect(r.rows).toEqual([{ id: 1 }, { id: 2 }])
  })
})

describe('la imitación no inventa lo que no emite el módulo', () => {
  it.each([
    ["regexp_replace(v, '\\s+', ' ', 'g')", 'otro patrón'],
    ["regexp_replace(v, ' {2,}', '', 'g')", 'otro reemplazo'],
    ["regexp_replace(v, ' {2,}', ' ', 'i')", 'otras banderas'],
  ])('%s (%s) lanza «imitación fuera de alcance»', async (expresion) => {
    const { pool } = baseConMuestras()
    await pool.query('CREATE TABLE t (v text)')
    await pool.query("INSERT INTO t (v) VALUES ('a  b')")
    await expect(pool.query(`SELECT ${expresion} AS r FROM t`)).rejects.toThrow(/imitación fuera de alcance/)
  })
})
