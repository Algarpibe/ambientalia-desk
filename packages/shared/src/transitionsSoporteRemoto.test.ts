import { describe, it, expect } from 'vitest'
import { TRANSITIONS, TRANSITIONS_EQUIPO_NUEVO, TRANSITIONS_SOPORTE_REMOTO } from './transitions'
import { transicionPorId, flujoDeTransicion } from './flujos'

/**
 * El catálogo del flujo `soporte-remoto` (F1B-06, `blueprint-soporte-remoto`, RQ-SR-01/02/03/06/10): las cuatro
 * filas de M1.5 (`R08.2.md:1556-1567`). Registro SEPARADO de `TRANSITIONS` y de `TRANSITIONS_EQUIPO_NUEVO`:
 * `En Proceso`, `Pendiente` y `Finalizado` son homónimos de servicio y fundirlos mezclaría los grafos.
 */
describe('TRANSITIONS_SOPORTE_REMOTO — catálogo (RQ-SR-01)', () => {
  it('(a) son exactamente estos cuatro pares from → to, y ninguno más', () => {
    expect(TRANSITIONS_SOPORTE_REMOTO.map((t) => [t.id, t.from, t.to])).toEqual([
      ['asignacion_soporte', ['Solicitud Soporte'], 'En Proceso'],
      ['ejecutar_soporte', ['En Proceso'], 'Finalizado'],
      ['soporte_pendiente', ['En Proceso'], 'Pendiente'],
      ['continuacion_soporte', ['Pendiente'], 'En Proceso'],
    ])
  })

  it('(b) las salidas de Solicitud Soporte son exactamente asignacion_soporte: sin anulación (S-5)', () => {
    const salidas = TRANSITIONS_SOPORTE_REMOTO.filter((t) => t.from.includes('Solicitud Soporte')).map((t) => t.id)
    expect(salidas).toEqual(['asignacion_soporte'])
  })

  it('(c) las cuatro declaran sólo comentario y derivación: sin modalidad, sin fecha ni motivo obligatorio (RQ-SR-10)', () => {
    expect(TRANSITIONS_SOPORTE_REMOTO).toHaveLength(4)
    for (const t of TRANSITIONS_SOPORTE_REMOTO) {
      expect(t.fields.map((f) => f.key), `${t.id} declara campos de más`).toEqual(['comment', 'derivado_a'])
      expect(t.fields.some((f) => f.required), `${t.id} declara un campo obligatorio`).toBe(false)
      expect(t.fields.some((f) => f.kind === 'date'), `${t.id} declara un campo de fecha`).toBe(false)
    }
  })

  it('(d) las cuatro son del área Servicio Técnico por equivalencia (S-1, RQ-SR-02)', () => {
    expect(TRANSITIONS_SOPORTE_REMOTO).toHaveLength(4)
    for (const t of TRANSITIONS_SOPORTE_REMOTO) {
      expect(t.area, `${t.id} no es de Servicio Técnico`).toBe('Servicio Técnico')
    }
  })

  it('(f) entradas y salidas por estado: Finalizado recibe sólo ejecutar_soporte, y cada estado del catálogo entra y sale como debe', () => {
    const entradas = (estado: string) => TRANSITIONS_SOPORTE_REMOTO.filter((t) => t.to === estado).map((t) => t.id)
    const salidas = (estado: string) => TRANSITIONS_SOPORTE_REMOTO.filter((t) => t.from.includes(estado)).map((t) => t.id)
    expect(entradas('Finalizado')).toEqual(['ejecutar_soporte'])
    expect(entradas('Solicitud Soporte')).toEqual([])
    expect(entradas('En Proceso')).toEqual(['asignacion_soporte', 'continuacion_soporte'])
    expect(entradas('Pendiente')).toEqual(['soporte_pendiente'])
    expect(salidas('Finalizado')).toEqual([])
    expect(salidas('Pendiente')).toEqual(['continuacion_soporte'])
    expect(salidas('En Proceso')).toEqual(['ejecutar_soporte', 'soporte_pendiente'])
  })
})

describe('TRANSITIONS_SOPORTE_REMOTO — ids únicos entre los tres catálogos (RQ-SR-06, S-8)', () => {
  it('(e) ningún id se repite entre TRANSITIONS, TRANSITIONS_EQUIPO_NUEVO y el catálogo de soporte remoto', () => {
    const ids = [...TRANSITIONS, ...TRANSITIONS_EQUIPO_NUEVO, ...TRANSITIONS_SOPORTE_REMOTO].map((t) => t.id)
    expect(ids).toHaveLength(34 + 6 + 4)
    expect(new Set(ids).size, 'hay ids repetidos entre catálogos').toBe(44)
  })

  it('(e) marcar_pendiente sigue resolviendo a servicio y soporte_pendiente a soporte-remoto', () => {
    expect(flujoDeTransicion('marcar_pendiente')).toBe('servicio')
    expect(transicionPorId('marcar_pendiente')).toBe(TRANSITIONS.find((t) => t.id === 'marcar_pendiente'))
    expect(flujoDeTransicion('soporte_pendiente')).toBe('soporte-remoto')
    expect(transicionPorId('soporte_pendiente')?.to).toBe('Pendiente')
  })
})
