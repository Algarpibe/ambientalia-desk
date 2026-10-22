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

import { FLUJOS, NOMBRE_FLUJO } from '@ambientalia/shared'
import { opcionesFlujo } from './indicadoresUrl'

/** F1F-05 (RQ-KP-33, M7): el flujo viaja en la URL de descarga; «Todos» no envía `flujo`, ni vacío. El cliente no lo valida (`validarFlujo`, 400). */
describe('urlIndicadores con flujo (RQ-KP-33, M7)', () => {
  it('con flujo: `flujo=equipo-nuevo` tras el formato', () => {
    expect(urlIndicadores('csv', undefined, 'equipo-nuevo')).toBe('/api/indicadores?formato=csv&flujo=equipo-nuevo')
  })
  it('con periodo y flujo: el flujo va tras `hasta`', () => {
    expect(urlIndicadores('csv', { desde: '2026-10-01', hasta: '2026-10-31' }, 'soporte-remoto')).toBe('/api/indicadores?formato=csv&desde=2026-10-01&hasta=2026-10-31&flujo=soporte-remoto')
  })
  it('«Todos» (vacío) y ausente: la URL de hoy, sin `flujo` ni siquiera vacío', () => {
    expect(urlIndicadores('csv', undefined, '')).toBe('/api/indicadores?formato=csv')
    expect(urlIndicadores('csv', undefined, undefined)).toBe('/api/indicadores?formato=csv')
    expect(urlIndicadores('json', { desde: '2026-10-01' }, '')).not.toContain('flujo')
  })
  it('el cliente no valida: un valor desconocido viaja tal cual (lo rechaza el servidor con 400)', () => {
    expect(urlIndicadores('csv', undefined, 'otro')).toBe('/api/indicadores?formato=csv&flujo=otro')
  })
})

describe('opcionesFlujo (RQ-KP-33): «Todos» y la lista de `shared`, con sus rótulos', () => {
  it('la primera es «Todos» con valor vacío', () => {
    expect(opcionesFlujo()[0]).toEqual({ valor: '', etiqueta: 'Todos' })
  })
  it('las demás salen de FLUJOS, en su orden, con el rótulo de NOMBRE_FLUJO en mayúscula inicial', () => {
    expect(opcionesFlujo().slice(1).map((o) => o.valor)).toEqual([...FLUJOS])
    expect(opcionesFlujo().slice(1).map((o) => o.etiqueta)).toEqual(FLUJOS.map((f) => NOMBRE_FLUJO[f].charAt(0).toUpperCase() + NOMBRE_FLUJO[f].slice(1)))
  })
  it('los rótulos son los de la spec: Servicio técnico, Equipo nuevo, Soporte remoto', () => {
    expect(opcionesFlujo().map((o) => o.etiqueta)).toEqual(['Todos', 'Servicio técnico', 'Equipo nuevo', 'Soporte remoto'])
  })
})
