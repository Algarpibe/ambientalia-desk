import { describe, it, expect } from 'vitest'
import { construirIndice, resolverRuta } from './resolucion'

// Los seis package.json y el único ci.yml trackeados hoy (git ls-files, 2026-09-13).
const monorepo = construirIndice([
  'package.json',
  '.agent/skills/react-components/package.json',
  'apps/desk/package.json',
  'apps/hub-sync/package.json',
  'packages/shared/package.json',
  'packages/zoho-sync/package.json',
  '.github/workflows/ci.yml',
])

describe('resolverRuta · RQ-CV-02: la coincidencia exacta antes que el sufijo (M23)', () => {
  it('package.json, con seis candidatos, resuelve a la raíz y no a una lista ambigua', () => {
    expect(resolverRuta('package.json', monorepo)).toEqual({ tipo: 'unico', ruta: 'package.json' })
  })

  it('control del otro signo: ci.yml, sin candidato exacto, resuelve por sufijo; una subcadena del nombre no', () => {
    expect(resolverRuta('ci.yml', monorepo)).toEqual({ tipo: 'unico', ruta: '.github/workflows/ci.yml' })
    expect(resolverRuta('i.yml', monorepo)).toEqual({ tipo: 'sin-barra' })
  })
})

describe('resolverRuta · D4: el paso de directorio (4) va ANTES que el de «lleva barra» (7)', () => {
  it('un token con barra que nombra un directorio se salta, nunca es «fichero inexistente»', () => {
    expect(resolverRuta('apps/desk', monorepo)).toEqual({ tipo: 'directorio' })
  })

  it('control del otro signo: con barra y sin fichero ni directorio sigue siendo inexistente', () => {
    expect(resolverRuta('apps/nada', monorepo)).toEqual({ tipo: 'inexistente' })
  })
})

describe('resolverRuta · D3: marcas ISO y horas que no resuelven no son citas', () => {
  it('sin barra y sin resolver: marca ISO con hora, hora pelada y hora con segundos son «no es cita»', () => {
    for (const nombre of ['2026-09-13T10', '2026-09-13T10:30', '10', '10:30']) {
      expect(resolverRuta(nombre, monorepo)).toEqual({ tipo: 'no-es-cita' })
    }
  })

  it('control del otro signo: un fichero trackeado con nombre de sólo dígitos se resuelve y se comprueba', () => {
    expect(resolverRuta('2024', construirIndice(['notas/2024']))).toEqual({ tipo: 'unico', ruta: 'notas/2024' })
  })
})
