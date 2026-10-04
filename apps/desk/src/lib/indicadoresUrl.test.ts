import { describe, it, expect } from 'vitest'
import { urlIndicadores, mostrarDescargaIndicadores } from './indicadoresUrl'

/** F1F-05, lote 4 (RQ-KP-18): la URL de descarga y quién ve el enlace. El `.tsx` sólo pinta. */
describe('urlIndicadores', () => {
  it('sin periodo: sólo el formato', () => { expect(urlIndicadores('csv')).toBe('/api/indicadores?formato=csv') })
  it('con periodo: desde y hasta', () => {
    expect(urlIndicadores('csv', { desde: '2026-10-01', hasta: '2026-10-31' })).toBe('/api/indicadores?formato=csv&desde=2026-10-01&hasta=2026-10-31')
  })
  it('periodo parcial: sólo lo que viene', () => { expect(urlIndicadores('json', { desde: '2026-10-01' })).toBe('/api/indicadores?formato=json&desde=2026-10-01') })
  it('valores vacíos no entran', () => { expect(urlIndicadores('csv', { desde: '', hasta: undefined })).toBe('/api/indicadores?formato=csv') })
  it('codifica los caracteres especiales', () => { expect(urlIndicadores('csv', { desde: 'a&b=c d' })).toBe('/api/indicadores?formato=csv&desde=a%26b%3Dc+d') })
  it('es de mismo origen: ruta relativa, sin esquema ni anfitrión', () => { expect(urlIndicadores('csv')).toMatch(/^\/api\//) })
})

describe('mostrarDescargaIndicadores (comodidad: lo impone el 403 del servidor, RQ-KP-12)', () => {
  it.each([[{ isAdmin: true }, true], [{ isAdmin: false }, false], [{}, false], [null, false], [undefined, false]])('usuario %j → %s', (u, esperado) => {
    expect(mostrarDescargaIndicadores(u as { isAdmin?: boolean } | null | undefined)).toBe(esperado)
  })
})
