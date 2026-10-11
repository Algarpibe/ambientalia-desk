import { describe, it, expect } from 'vitest'
import { diasHabilesEnEstado, textoTiempoEnEstado } from './tiempoEnEstado'
import { horasHabilesEntre } from './calendarioLaboral'
import { slaVencido } from './sla'

/**
 * EL TIEMPO EN EL ESTADO (F1B-07, `vistas-tablero` RQ-VT-16). Días hábiles POSTERIORES al día de entrada y hasta hoy
 * inclusive, con el día tomado en la zona de negocio. Instantes con desplazamiento explícito: las pruebas corren en UTC.
 */
const SIN = new Set<string>()
const dias = (desde: string | null | undefined | Date, ahora: string, cierres: ReadonlySet<string> = SIN) =>
  diasHabilesEnEstado(desde, new Date(ahora), cierres)

describe('diasHabilesEnEstado (RQ-VT-16)', () => {
  it('T-1 · el día de entrada no cuenta', () => {
    expect(dias('2026-03-05T10:00:00-05:00', '2026-03-05T16:00:00-05:00')).toBe(0)
  })

  it('T-2 · entre semana: martes a jueves son 2', () => {
    expect(dias('2026-03-03T12:00:00-05:00', '2026-03-05T12:00:00-05:00')).toBe(2)
  })

  it('T-3 · salta el fin de semana: viernes a lunes es 1', () => {
    expect(dias('2026-03-06T12:00:00-05:00', '2026-03-09T12:00:00-05:00')).toBe(1)
  })

  it('T-4 · salta un festivo: el lunes 23 es San José trasladado', () => {
    expect(dias('2026-03-20T12:00:00-05:00', '2026-03-24T12:00:00-05:00')).toBe(1)
  })

  it('T-5 · salta un cierre sembrado', () => {
    expect(dias('2026-03-09T12:00:00-05:00', '2026-03-12T12:00:00-05:00', new Set(['2026-03-11']))).toBe(2)
    expect(dias('2026-03-09T12:00:00-05:00', '2026-03-12T12:00:00-05:00', SIN)).toBe(3)
  })

  it('T-6 · el día se toma en la zona de negocio, por el lado de la entrada y por el de hoy', () => {
    // 02:00Z del 10 es el 9 a las 21:00 en Bogotá: desde el 9, el 10 cuenta.
    expect(dias('2026-03-10T02:00:00Z', '2026-03-10T17:00:00Z')).toBe(1)
    // 02:00Z del 11 es el 10 a las 21:00 en Bogotá: hoy es el 10, no el 11.
    expect(dias('2026-03-09T17:00:00Z', '2026-03-11T02:00:00Z')).toBe(1)
  })

  it('T-7 · sin entrada legible es null; con `ahora` anterior a la entrada es 0', () => {
    const ahora = new Date('2026-03-10T17:00:00Z')
    for (const malo of [null, undefined, 'no es fecha', new Date(NaN)]) expect(diasHabilesEnEstado(malo, ahora, SIN)).toBeNull()
    expect(dias('2026-03-12T12:00:00-05:00', '2026-03-10T12:00:00-05:00')).toBe(0)
  })
})

describe('textoTiempoEnEstado (RQ-VT-16)', () => {
  it('T-8 · los textos exactos, y el campo ausente no pinta nada', () => {
    expect(textoTiempoEnEstado(0)).toBe('Menos de 1 día hábil')
    expect(textoTiempoEnEstado(1)).toBe('1 día hábil')
    expect(textoTiempoEnEstado(2)).toBe('2 días hábiles')
    expect(textoTiempoEnEstado(3)).toBe('3 días hábiles')
    expect(textoTiempoEnEstado(null)).toBe('Sin fecha de entrada')
    expect(textoTiempoEnEstado(undefined)).toBeNull()
  })
})

describe('los dos relojes (H5)', () => {
  it('T-9 · el mismo «3 días hábiles» convive con la alarma callada y con la alarma vencida', () => {
    const de = new Date('2026-03-02T16:00:00-05:00'), hasta = new Date('2026-03-05T09:00:00-05:00')
    expect(diasHabilesEnEstado(de, hasta, SIN)).toBe(3)
    expect(horasHabilesEntre(de, hasta, SIN)).toBe(20)
    expect(slaVencido('Remisión creada', de, hasta, SIN)).toBe(false)
    const de2 = new Date('2026-03-02T08:00:00-05:00'), hasta2 = new Date('2026-03-05T08:01:00-05:00')
    expect(diasHabilesEnEstado(de2, hasta2, SIN)).toBe(3)
    expect(slaVencido('Remisión creada', de2, hasta2, SIN)).toBe(true)
  })
})
