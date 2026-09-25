import { describe, it, expect } from 'vitest'
import { FASE_POR_ESTADO, FASES } from './fasesBlueprint'
import { ESTADOS_SERVICIO, ESTADOS_SIN_SALIDA } from './estados'

/**
 * `fasesBlueprint.ts` declara la partición estado → fase como DATO (P-3 del proposal
 * `generador-mapa-blueprint`, M1.3.1 del maestro, `R08.2.md:1187-1191`). Esta prueba fija tres
 * cosas: que la tabla cubre exactamente `ESTADOS` (ni uno de más ni de menos), el recuento 4/12/5,
 * y las tres asignaciones que NO se derivan mecánicamente de otro dato ya existente — las demás se
 * leen de un vistazo en `design.md` §7.
 */
describe('fasesBlueprint — partición estado → fase', () => {
  it('cubre exactamente los estados declarados, ni uno de más ni de menos', () => {
    expect(Object.keys(FASE_POR_ESTADO).sort()).toEqual([...ESTADOS_SERVICIO].sort())
  })

  it('reparte los 21 estados en 4 · 12 · 5, entrada · diagnóstico · cierre', () => {
    const porFase = { entrada: 0, diagnostico: 0, cierre: 0 }
    for (const fase of Object.values(FASE_POR_ESTADO)) porFase[fase]++
    expect(porFase).toEqual({ entrada: 4, diagnostico: 12, cierre: 5 })
    expect(FASES.map((f) => f.id)).toEqual(['entrada', 'diagnostico', 'cierre'])
  })

  it('«Ingresado» cierra la fase de entrada, no abre la de diagnóstico (R08.2.md:1188)', () => {
    expect(FASE_POR_ESTADO['Ingresado']).toBe('entrada')
  })

  it('«Pendiente» cae en diagnóstico, derivado de sus dos salidas de Servicio Técnico (estados.ts:101-105)', () => {
    expect(FASE_POR_ESTADO['Pendiente']).toBe('diagnostico')
  })

  it('los cuatro ESTADOS_SIN_SALIDA caen en diagnóstico (estados.ts:151-160)', () => {
    for (const estado of ESTADOS_SIN_SALIDA) expect(FASE_POR_ESTADO[estado]).toBe('diagnostico')
  })
})
