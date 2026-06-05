import { describe, it, expect, beforeEach } from 'vitest'
import { newDb } from 'pg-mem'
import { migrate, type Queryable } from './migrate'
import { parseEquiposCsv } from './seedEquipos'
import { upsertEquipo, searchEquipos, getEquipo, countEquipos } from './equipos'
import { createEquipo, updateEquipo, setEquipoActive, listEquiposManage, equipoFacets, getEquipoFull } from './equipos'

const rows = parseEquiposCsv([
  'Nombre cliente;Marca;Modelo;Numero serie;Tipo',
  'Corola Ambiental S.A.S.;Horiba;APMA-370;85HHP0N0;Analizador de Monóxido de Carbono (CO)',
  'Gecelca S.A. E.S.P.;Grimm;EDM180C;18A22052;Monitor de Material Particulado PM10/PM2.5',
].join('\n'))

let db: Queryable
beforeEach(async () => { const pg = newDb().adapters.createPg(); db = new pg.Pool(); await migrate(db) })

describe('equipos repo', () => {
  it('upsert + búsqueda por serie/cliente/tipo + count', async () => {
    for (const r of rows) await upsertEquipo(db, r)
    expect(await countEquipos(db)).toBe(2)
    expect((await searchEquipos(db, '85HHP')).map((e) => e.serial)).toEqual(['85HHP0N0'])
    expect((await searchEquipos(db, 'gecelca')).map((e) => e.marca)).toEqual(['Grimm'])
    expect((await searchEquipos(db, 'monóxido')).length).toBe(1)
    const e = await getEquipo(db, rows[0].id)
    expect(e).toMatchObject({ serial: '85HHP0N0', tipo: 'Analizador de Monóxido de Carbono (CO)', clienteNombre: 'Corola Ambiental S.A.S.' })
  })

  it('upsert es idempotente (mismo id no duplica)', async () => {
    await upsertEquipo(db, rows[0])
    await upsertEquipo(db, rows[0])
    expect(await countEquipos(db)).toBe(1)
  })
})

describe('equipos CRUD (Subsistema F)', () => {
  it('create (id propio + client_id), getFull, y aparece en searchEquipos', async () => {
    const id = await createEquipo(db, { serial: 'NEW1', marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor', clienteNombre: 'ACME', clientId: 'cli1' })
    expect(id).toMatch(/^eq-/)
    expect(await getEquipoFull(db, id)).toMatchObject({ serial: 'NEW1', marca: 'Grimm', active: true, clientId: 'cli1', clienteNombre: 'ACME' })
    expect((await searchEquipos(db, 'NEW1')).length).toBe(1)
  })

  it('desactivar lo saca de searchEquipos pero sigue en listEquiposManage', async () => {
    const id = await createEquipo(db, { serial: 'NEW2', marca: 'Horiba', modelo: 'APMA', tipo: 'CO', clienteNombre: 'X', clientId: 'cli1' })
    await setEquipoActive(db, id, false)
    expect((await searchEquipos(db, 'NEW2')).length).toBe(0)
    expect((await listEquiposManage(db, 'NEW2')).map((e) => e.active)).toEqual([false])
  })

  it('update cambia campos y reconcilia cliente', async () => {
    const id = await createEquipo(db, { serial: 'NEW3', marca: 'Grimm', modelo: 'm', tipo: 'Monitor', clienteNombre: 'Viejo', clientId: null })
    await updateEquipo(db, id, { tipo: 'Analizador CO', clientId: 'cli9', clienteNombre: 'Nuevo' })
    expect(await getEquipoFull(db, id)).toMatchObject({ tipo: 'Analizador CO', clientId: 'cli9', clienteNombre: 'Nuevo' })
  })

  it('facets devuelve marcas y tipos distintos', async () => {
    await createEquipo(db, { serial: 'A', marca: 'Grimm', modelo: null, tipo: 'Monitor', clienteNombre: null, clientId: null })
    await createEquipo(db, { serial: 'B', marca: 'Horiba', modelo: null, tipo: 'Monitor', clienteNombre: null, clientId: null })
    await createEquipo(db, { serial: 'C', marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor', clienteNombre: null, clientId: null })
    const f = await equipoFacets(db)
    expect(f.marcas).toEqual(expect.arrayContaining(['Grimm', 'Horiba']))
    expect(f.byMarca['Grimm'].tipos).toContain('Monitor')
    expect(f.byMarca['Grimm'].modelos).toContain('EDM180C')
  })
})
