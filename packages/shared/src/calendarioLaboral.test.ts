// F1B-12 — pruebas del calendario laboral: Pascua, festivos de Colombia, jornada y horas/días hábiles.
// Fase 1 (RED→GREEN): Pascua y los 18 festivos de 2026/2027, fecha a fecha contra la spec (RQ-CL-02/03/04).
import { describe, it, expect } from 'vitest'
import {
  domingoDePascua,
  festivosDeColombia,
  FESTIVOS_FIJOS,
  FESTIVOS_TRASLADABLES,
  FESTIVOS_DE_PASCUA,
  JORNADA,
  esDiaHabil,
  horasHabilesEntre,
  diasHabilesEntre,
} from './calendarioLaboral'

const SIN_CIERRES: ReadonlySet<string> = new Set()

describe('domingoDePascua', () => {
  // RQ-CL-02: base de los festivos de Pascua. Dos años concretos + uno extremo, contra la fuente oficial.
  it('calcula el domingo de Pascua de 2026', () => {
    expect(domingoDePascua(2026)).toBe('2026-04-05')
  })

  it('calcula el domingo de Pascua de 2027', () => {
    expect(domingoDePascua(2027)).toBe('2027-03-28')
  })

  // Año extremo: 2000, contrastado contra el calendario litúrgico oficial (23 de abril de 2000).
  it('calcula el domingo de Pascua de un año extremo (2000)', () => {
    expect(domingoDePascua(2000)).toBe('2000-04-23')
  })
})

describe('festivosDeColombia — 2026, fecha a fecha (RQ-CL-03)', () => {
  const FESTIVOS_2026 = [
    '2026-01-01', // Año Nuevo (fija)
    '2026-01-12', // Reyes Magos, trasladada desde 01-06 (martes)
    '2026-03-23', // San José, trasladada desde 03-19 (jueves)
    '2026-04-02', // Jueves Santo, Pascua-3
    '2026-04-03', // Viernes Santo, Pascua-2
    '2026-05-01', // Día del Trabajo (fija)
    '2026-05-18', // Ascensión, Pascua+43, trasladada desde 05-14 (jueves)
    '2026-06-08', // Corpus Christi, Pascua+64, trasladada desde 06-04 (jueves)
    '2026-06-15', // Sagrado Corazón, Pascua+71, trasladada desde 06-12 (viernes)
    '2026-06-29', // San Pedro y San Pablo, ya cae en lunes
    '2026-07-20', // Independencia de Colombia (fija)
    '2026-08-07', // Batalla de Boyacá (fija)
    '2026-08-17', // Asunción, trasladada desde 08-15 (sábado)
    '2026-10-12', // Día de la Raza, ya cae en lunes
    '2026-11-02', // Todos los Santos, trasladada desde 11-01 (domingo)
    '2026-11-16', // Independencia de Cartagena, trasladada desde 11-11 (miércoles)
    '2026-12-08', // Inmaculada Concepción (fija)
    '2026-12-25', // Navidad (fija)
  ]

  it('son exactamente las 18 fechas de la spec, en orden, sin repetidos', () => {
    const resultado = festivosDeColombia(2026)
    expect(resultado).toEqual(FESTIVOS_2026)
    expect(resultado.length).toBe(18)
    expect(new Set(resultado).size).toBe(18)
  })
})

describe('festivosDeColombia — 2027, fecha a fecha (RQ-CL-04)', () => {
  const FESTIVOS_2027 = [
    '2027-01-01', // Año Nuevo (fija)
    '2027-01-11', // Reyes Magos, trasladada desde 01-06 (miércoles)
    '2027-03-22', // San José, trasladada desde 03-19 (viernes)
    '2027-03-25', // Jueves Santo, Pascua-3
    '2027-03-26', // Viernes Santo, Pascua-2
    '2027-05-01', // Día del Trabajo (fija)
    '2027-05-10', // Ascensión, Pascua+43, trasladada desde 05-06 (jueves)
    '2027-05-31', // Corpus Christi, Pascua+64, trasladada desde 05-27 (jueves)
    '2027-06-07', // Sagrado Corazón, Pascua+71, trasladada desde 06-04 (viernes)
    '2027-07-05', // San Pedro y San Pablo, trasladada desde 06-29 (martes)
    '2027-07-20', // Independencia de Colombia (fija)
    '2027-08-07', // Batalla de Boyacá (fija)
    '2027-08-16', // Asunción, trasladada desde 08-15 (domingo)
    '2027-10-18', // Día de la Raza, trasladada desde 10-12 (martes)
    '2027-11-01', // Todos los Santos, ya cae en lunes
    '2027-11-15', // Independencia de Cartagena, trasladada desde 11-11 (jueves)
    '2027-12-08', // Inmaculada Concepción (fija)
    '2027-12-25', // Navidad (fija)
  ]

  it('son exactamente las 18 fechas de la spec, en orden, sin repetidos', () => {
    const resultado = festivosDeColombia(2027)
    expect(resultado).toEqual(FESTIVOS_2027)
    expect(resultado.length).toBe(18)
    expect(new Set(resultado).size).toBe(18)
  })
})

describe('traslados al lunes (RQ-CL-02)', () => {
  it('6-ene-2027 (miércoles) se traslada a 11-ene (lunes)', () => {
    expect(festivosDeColombia(2027)).toContain('2027-01-11')
    expect(festivosDeColombia(2027)).not.toContain('2027-01-06')
  })

  it('15-ago-2027 (domingo) se traslada a 16-ago (lunes)', () => {
    expect(festivosDeColombia(2027)).toContain('2027-08-16')
    expect(festivosDeColombia(2027)).not.toContain('2027-08-15')
  })

  it('29-jun-2026 (ya lunes) no se mueve', () => {
    expect(festivosDeColombia(2026)).toContain('2026-06-29')
  })

  it('20-jul (fija) no se mueve aunque no sea lunes', () => {
    // 2026-07-20 es lunes; 2027-07-20 es martes y sigue sin moverse (RQ-CL-02, festivos fijos).
    expect(festivosDeColombia(2027)).toContain('2027-07-20')
  })
})

describe('tablas de datos de festivos (design.md, interfaces)', () => {
  it('FESTIVOS_FIJOS tiene 6 entradas', () => {
    expect(FESTIVOS_FIJOS.length).toBe(6)
  })

  it('FESTIVOS_TRASLADABLES tiene 7 entradas', () => {
    expect(FESTIVOS_TRASLADABLES.length).toBe(7)
  })

  it('FESTIVOS_DE_PASCUA tiene 5 entradas', () => {
    expect(FESTIVOS_DE_PASCUA.length).toBe(5)
  })
})

// Fase 2 (RED→GREEN): jornada, horas/días hábiles, UTC y cierres.

describe('JORNADA (RQ-CL-01)', () => {
  it('es lunes a viernes, 8 a 17 h', () => {
    expect(JORNADA).toEqual({ diasSemana: [1, 2, 3, 4, 5], inicioHora: 8, finHora: 17 })
  })
})

describe('esDiaHabil', () => {
  it('un lunes sin festivo ni cierre es hábil', () => {
    expect(esDiaHabil('2026-06-01', SIN_CIERRES)).toBe(true)
  })

  it('un sábado no es hábil', () => {
    expect(esDiaHabil('2026-06-06', SIN_CIERRES)).toBe(false)
  })

  it('un festivo legal no es hábil', () => {
    expect(esDiaHabil('2026-06-08', SIN_CIERRES)).toBe(false) // Corpus Christi 2026
  })

  it('un cierre inyectado hace que el día no sea hábil, aunque no sea festivo', () => {
    expect(esDiaHabil('2026-12-31', new Set(['2026-12-31']))).toBe(false)
  })
})

describe('horasHabilesEntre (RQ-CL-07/RQ-CL-09)', () => {
  it('un lunes sin festivo cuenta la jornada completa: 9 horas', () => {
    const desde = new Date('2026-06-01T08:00:00-05:00')
    const hasta = new Date('2026-06-01T17:00:00-05:00')
    expect(horasHabilesEntre(desde, hasta, SIN_CIERRES)).toBe(9)
  })

  it('un sábado no cuenta: 0 horas', () => {
    const desde = new Date('2026-06-06T10:00:00-05:00')
    const hasta = new Date('2026-06-06T14:00:00-05:00')
    expect(horasHabilesEntre(desde, hasta, SIN_CIERRES)).toBe(0)
  })

  it('viernes 16:00 a lunes 9:00, sin festivo: 2 horas hábiles', () => {
    const desde = new Date('2026-05-22T16:00:00-05:00') // viernes
    const hasta = new Date('2026-05-25T09:00:00-05:00') // lunes
    expect(horasHabilesEntre(desde, hasta, SIN_CIERRES)).toBe(2)
  })

  it('viernes 16:00 a lunes 9:00, con el lunes festivo (Corpus Christi): 1 hora hábil', () => {
    const desde = new Date('2026-06-05T16:00:00-05:00') // viernes
    const hasta = new Date('2026-06-08T09:00:00-05:00') // lunes, Corpus Christi
    expect(horasHabilesEntre(desde, hasta, SIN_CIERRES)).toBe(1)
  })

  it('el fin anterior al inicio da 0 horas, sin lanzar excepción', () => {
    const desde = new Date('2026-06-05T17:00:00-05:00')
    const hasta = new Date('2026-06-01T08:00:00-05:00')
    expect(horasHabilesEntre(desde, hasta, SIN_CIERRES)).toBe(0)
  })

  it('un instante antes de la jornada no amplía el resultado: sigue siendo 9, no 12', () => {
    const desde = new Date('2026-06-01T05:00:00-05:00')
    const hasta = new Date('2026-06-01T17:00:00-05:00')
    expect(horasHabilesEntre(desde, hasta, SIN_CIERRES)).toBe(9)
  })

  it('un instante UTC de madrugada pertenece al día anterior en Bogotá (RQ-CL-10)', () => {
    // 2026-06-08T03:00:00Z = 2026-06-07T22:00 en Bogotá (domingo noche), no el lunes 8 (Corpus Christi).
    const desde = new Date('2026-06-08T03:00:00Z')
    const hasta = new Date('2026-06-08T04:00:00Z') // domingo 23:00-00:00 Bogotá: sigue sin ser hábil
    expect(horasHabilesEntre(desde, hasta, SIN_CIERRES)).toBe(0)
  })
})

describe('diasHabilesEntre (RQ-CL-08)', () => {
  it('(2026-06-04, 2026-06-10] cuenta 3 días hábiles: 05, 09 y 10 — el lunes 08 es Corpus Christi', () => {
    expect(diasHabilesEntre('2026-06-04', '2026-06-10', SIN_CIERRES)).toBe(3)
  })
})

describe('cierres inyectados (RQ-CL-05)', () => {
  it('un cierre inyectado resta su día completo', () => {
    const conCierre = diasHabilesEntre('2026-12-29', '2027-01-04', new Set(['2026-12-31']))
    const sinCierre = diasHabilesEntre('2026-12-29', '2027-01-04', SIN_CIERRES)
    expect(sinCierre - conCierre).toBe(1)
  })

  it('sin cierres inyectados, el resultado depende sólo de la ley: 2026-12-31 sí cuenta', () => {
    expect(esDiaHabil('2026-12-31', SIN_CIERRES)).toBe(true)
  })
})
