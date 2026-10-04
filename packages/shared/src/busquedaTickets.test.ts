import { describe, it, expect } from 'vitest'
import { BUSQUEDA_MAX, patronSerial, leerBusquedaTickets } from './busquedaTickets'

const ok = (numero: number | null, patron: string) => ({ ok: true, filtro: { numero, patron } })

describe('patronSerial: la única noción del patrón de serial', () => {
  it('recorta los extremos, pasa a minúsculas y envuelve en %', () => {
    expect(patronSerial('  ABC-123  ')).toBe('%abc-123%')
    expect(patronSerial('2517')).toBe('%2517%')
  })

  it('conserva espacios interiores, % y _ tal cual', () => {
    expect(patronSerial('AB 12')).toBe('%ab 12%')
    expect(patronSerial('a%b_c')).toBe('%a%b_c%')
  })

  it('el texto vacío da %%, igual que hacía el autocompletado', () => {
    expect(patronSerial('')).toBe('%%')
    expect(patronSerial('   ')).toBe('%%')
  })
})

describe('leerBusquedaTickets: tabla del diseño', () => {
  it('sin q o con q vacío o de espacios: sin búsqueda', () => {
    expect(leerBusquedaTickets(undefined)).toEqual({ ok: true, filtro: null })
    expect(leerBusquedaTickets('')).toEqual({ ok: true, filtro: null })
    expect(leerBusquedaTickets('   ')).toEqual({ ok: true, filtro: null })
  })

  it('lo que no es texto (lista, objeto) es una búsqueda inválida', () => {
    expect(leerBusquedaTickets(['a', 'b'])).toEqual({ ok: false, error: 'Búsqueda inválida' })
    expect(leerBusquedaTickets({ a: 1 })).toEqual({ ok: false, error: 'Búsqueda inválida' })
  })

  it('el tope de 64 se mide sobre el texto YA recortado', () => {
    const justo = 'a'.repeat(BUSQUEDA_MAX)
    expect(BUSQUEDA_MAX).toBe(64)
    expect(leerBusquedaTickets(justo)).toEqual(ok(null, `%${justo}%`))
    expect(leerBusquedaTickets(`   ${justo}   `)).toEqual(ok(null, `%${justo}%`))
    expect(leerBusquedaTickets(`${justo}a`)).toEqual({ ok: false, error: 'La búsqueda admite 64 caracteres como máximo' })
    expect(leerBusquedaTickets(' '.repeat(80))).toEqual({ ok: true, filtro: null })
  })

  it('los dígitos buscan por número y por serial', () => {
    expect(leerBusquedaTickets('864')).toEqual(ok(864, '%864%'))
    expect(leerBusquedaTickets('0864')).toEqual(ok(864, '%0864%'))
    expect(leerBusquedaTickets('22052 ')).toEqual(ok(22052, '%22052%'))
  })

  it('un # inicial da número, pero el patrón lleva el texto entero', () => {
    expect(leerBusquedaTickets(' #864 ')).toEqual(ok(864, '%#864%'))
  })

  it('lo que no es sólo dígitos tras un # opcional no es número', () => {
    expect(leerBusquedaTickets('# 864')).toEqual(ok(null, '%# 864%'))
    expect(leerBusquedaTickets('86a')).toEqual(ok(null, '%86a%'))
    expect(leerBusquedaTickets('#')).toEqual(ok(null, '%#%'))
    expect(leerBusquedaTickets('85HHP')).toEqual(ok(null, '%85hhp%'))
  })

  it('dígitos que no caben en integer no son número, y no rompen', () => {
    expect(leerBusquedaTickets('2147483647')).toEqual(ok(2147483647, '%2147483647%'))
    expect(leerBusquedaTickets('2147483648')).toEqual(ok(null, '%2147483648%'))
    expect(leerBusquedaTickets('12345678901')).toEqual(ok(null, '%12345678901%'))
  })
})
