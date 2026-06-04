import { describe, it, expect } from 'vitest'
import { parseEquiposCsv } from './seedEquipos'

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
