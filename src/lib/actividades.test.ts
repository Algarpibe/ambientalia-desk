import { describe, it, expect } from 'vitest'
import { traducirEstado, traducirPrioridad, estadoBadgeClass } from './actividades'

describe('actividades util', () => {
  it('traduce estados/prioridades + fallback', () => {
    expect(traducirEstado('In Progress')).toBe('En proceso')
    expect(traducirEstado(null)).toBe('—')
    expect(traducirEstado('Custom X')).toBe('Custom X')
    expect(traducirPrioridad('High')).toBe('Alta')
    expect(traducirPrioridad(null)).toBe('')
  })
  it('badge por estado/tipo', () => {
    expect(estadoBadgeClass('Completed', 'Closed')).toContain('green')
    expect(estadoBadgeClass('In Progress', 'Open')).toContain('blue')
    expect(estadoBadgeClass('Waiting on someone else', 'Open')).toContain('amber')
    expect(estadoBadgeClass('Not Started', 'Open')).toContain('slate')
  })
})
