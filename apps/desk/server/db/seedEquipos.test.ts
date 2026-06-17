import { describe, it, expect } from 'vitest'
import { parseEquiposCsv } from './seedEquipos'
import { newDb } from 'pg-mem'
import { migrate } from '@ambientalia/zoho-sync/db/migrate'
import { seedEquipos } from './seedEquipos'
import { countEquipos } from './equipos'

const sample = [
  'Nombre cliente;Marca;Modelo;Numero serie;Tipo;;;',
  'Airlab Consulting S.A.S.;Grimm;EDM180C;18A21058;Monitor PM10/PM2.5;;;',
  'Airlab Consulting S.A.S.;Grimm;EDM180C;18A21058;Monitor PM10/PM2.5;;;',
  'CIMA;Grimm;EDM180C;18Aprueba_prueba;Monitor;;;',
  ';;;;;;;',
  'Ser As S.A.S.;Horiba;APMA-370;191TE0NC;Analizador CO;;;',
  'SGS Colombia S.A.S.;Horiba;APMA-370;191TE0NC;Analizador CO;;;',
].join('\n')

describe('parseEquiposCsv', () => {
  it('omite encabezado/vacías/prueba, deduplica y mapea columnas (incl. tipo)', () => {
    const rows = parseEquiposCsv(sample)
    expect(rows.map((r) => r.serial)).toEqual(['18A21058', '191TE0NC', '191TE0NC'])
    expect(rows).toHaveLength(3) // Airlab (dedupe a 1) + Ser As + SGS (mismo serial, distinto cliente)
    const airlab = rows[0]
    expect(airlab).toMatchObject({ serial: '18A21058', marca: 'Grimm', modelo: 'EDM180C', tipo: 'Monitor PM10/PM2.5', cliente_nombre: 'Airlab Consulting S.A.S.', source: 'seed' })
    expect(airlab.id).toMatch(/^eq-/)
    expect(rows[1].id).not.toBe(rows[2].id)
  })
})

describe('seedEquipos', () => {
  const csv = [
    'Nombre cliente;Marca;Modelo;Numero serie;Tipo',
    'Corola Ambiental S.A.S.;Horiba;APMA-370;85HHP0N0;Analizador CO',
    'Gecelca S.A. E.S.P.;Grimm;EDM180C;18A22052;Monitor PM10/PM2.5',
  ].join('\n')

  it('inserta y es idempotente', async () => {
    const pg = newDb().adapters.createPg()
    const db = new pg.Pool()
    await migrate(db)
    expect(await seedEquipos(db, csv)).toBe(2)
    expect(await countEquipos(db)).toBe(2)
    await seedEquipos(db, csv)
    expect(await countEquipos(db)).toBe(2)
  })
})
