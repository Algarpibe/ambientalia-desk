import { describe, it, expect } from 'vitest'
import { normalizarEstado, normalizarSiTexto, conEstadoNormalizado, sqlEstadoNormalizado } from './normalizarEstado'
import { ESTADOS } from './estados'
import { CATALOGO_POR_FLUJO } from './flujos'
import { TRANSICION_REMISION_CONFIRMADA, TRANSICION_REMISION_RETIRADA } from './transitions'
import { COLUMNS } from './columns'

// RQ-ZS-24: la regla única de nombres de estado. Sólo U+0020 (S-1); mayúsculas, tildes y otros blancos no se tocan.
describe('normalizarEstado', () => {
  it('colapsa dos y tres espacios entre palabras', () => {
    expect(normalizarEstado('Notificación  Comercial')).toBe('Notificación Comercial')
    expect(normalizarEstado('Notificación   Comercial')).toBe('Notificación Comercial')
  })

  it('recorta los extremos', () => {
    expect(normalizarEstado(' En Proceso')).toBe('En Proceso')
    expect(normalizarEstado('En Proceso ')).toBe('En Proceso')
    expect(normalizarEstado('  En   Proceso  ')).toBe('En Proceso')
  })

  it('es idempotente y deja intacto un nombre limpio', () => {
    const una = normalizarEstado('  Notificación   Comercial ')
    expect(una).toBe('Notificación Comercial')
    expect(normalizarEstado(una)).toBe(una)
    expect(normalizarEstado('Notificación Comercial')).toBe('Notificación Comercial')
  })

  it('no toca mayúsculas, tildes, tabuladores ni NBSP', () => {
    for (const s of ['notificación comercial', 'Notificacion Comercial', 'Rev./Diagnostico', 'Notificación\tComercial', 'Notificación\u00a0Comercial']) {
      expect(normalizarEstado(s)).toBe(s)
    }
  })

  it('vacío y sólo espacios dan vacío sin lanzar', () => {
    expect(normalizarEstado('')).toBe('')
    expect(normalizarEstado('     ')).toBe('')
  })
})

describe('normalizarSiTexto', () => {
  it('normaliza el texto y deja pasar lo que no lo es', () => {
    expect(normalizarSiTexto('Notificación  Comercial')).toBe('Notificación Comercial')
    expect(normalizarSiTexto(null)).toBeNull()
    expect(normalizarSiTexto(undefined)).toBeUndefined()
    expect(normalizarSiTexto(5)).toBe(5)
  })
})

describe('conEstadoNormalizado', () => {
  it('devuelve una copia con status normalizado y el resto intacto, sin mutar la entrada', () => {
    const fila = { id: 't1', status: 'Notificación  Comercial', otro: 7 }
    const copia = conEstadoNormalizado(fila)
    expect(copia).toEqual({ id: 't1', status: 'Notificación Comercial', otro: 7 })
    expect(copia).not.toBe(fila)
    expect(fila.status).toBe('Notificación  Comercial')
  })

  it('un status que no es texto pasa tal cual', () => {
    expect(conEstadoNormalizado({ id: 't2', status: null })).toEqual({ id: 't2', status: null })
  })
})

describe('sqlEstadoNormalizado', () => {
  it('emite el texto exacto de la forma SQL', () => {
    expect(sqlEstadoNormalizado('status')).toBe("regexp_replace(btrim(status), ' {2,}', ' ', 'g')")
    expect(sqlEstadoNormalizado('t.status')).toBe("regexp_replace(btrim(t.status), ' {2,}', ' ', 'g')")
  })

  it('rechaza lo que no es un identificador de columna', () => {
    for (const malo of ["status'; DROP TABLE tickets;--", 'a b', '', 'Status', '1x', 'a.b.c', 'status)']) {
      expect(() => sqlEstadoNormalizado(malo)).toThrow(/no es un identificador/)
    }
  })
})

describe('puntos fijos del catálogo (fila 28)', () => {
  it('los 26 nombres de ESTADOS no cambian', () => {
    expect(ESTADOS).toHaveLength(26)
    for (const e of ESTADOS) expect(normalizarEstado(e)).toBe(e)
  })

  it('todo from y to de CATALOGO_POR_FLUJO no cambia', () => {
    const nombres = Object.values(CATALOGO_POR_FLUJO).flatMap((c) => c.flatMap((t) => [...t.from, t.to]))
    expect(nombres.length).toBeGreaterThan(50)
    for (const n of nombres) expect(normalizarEstado(n)).toBe(n)
  })

  it('TRANSICION_REMISION_* no cambia', () => {
    const nombres = [TRANSICION_REMISION_CONFIRMADA, TRANSICION_REMISION_RETIRADA].flatMap((t) => [...t.from, t.to])
    expect(nombres).toHaveLength(4)
    for (const n of nombres) expect(normalizarEstado(n)).toBe(n)
  })

  it('todo estado de COLUMNS no cambia', () => {
    const nombres = COLUMNS.flatMap((c) => c.statuses)
    expect(nombres.length).toBeGreaterThan(20)
    for (const n of nombres) expect(normalizarEstado(n)).toBe(n)
  })
})
