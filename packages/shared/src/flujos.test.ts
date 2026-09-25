import { describe, it, expect } from 'vitest'
import {
  esClasificacionEquipoNuevo, flujoDelTicket, catalogoDelTicket, transicionesDelTicket,
  transicionPorId, flujoDeTransicion, fueraDeFlujo, CATALOGO_POR_FLUJO,
} from './flujos'
import { TRANSITIONS, TRANSITIONS_EQUIPO_NUEVO } from './transitions'
import { columnForStatus } from './columns'

/**
 * El registro de flujos (F1B-06, D2 de `design.md`): clasificación + estado → flujo → catálogo.
 * Fichero nuevo porque necesita `CLASIFICACIONES` (`ticketCreate.ts:5`) y un `import` nuevo al
 * principio de `transitions.ts` desplazaría sus 334 líneas ya citadas (regla de mutación 4).
 */
describe('esClasificacionEquipoNuevo — normalización (M6, RQ-EN-02/RQ-EN-04)', () => {
  it('reconoce «Equipo Nuevo» tal como lo escribe Zoho (mayúscula distinta, igualdad no includes)', () => {
    expect(esClasificacionEquipoNuevo('Equipo Nuevo')).toBe(true)
  })

  it('reconoce el literal exacto de la app, «Equipo nuevo»', () => {
    expect(esClasificacionEquipoNuevo('Equipo nuevo')).toBe(true)
  })

  it('NO reconoce «Equipo nuevo usado»: es igualdad, no includes', () => {
    expect(esClasificacionEquipoNuevo('Equipo nuevo usado')).toBe(false)
  })

  it('devuelve false para null/undefined, sin lanzar', () => {
    expect(esClasificacionEquipoNuevo(null)).toBe(false)
    expect(esClasificacionEquipoNuevo(undefined)).toBe(false)
  })
})

describe('flujoDelTicket — enrutado (RQ-EN-04)', () => {
  it('ticket Equipo nuevo en Ingresado enruta a equipo-nuevo', () => {
    expect(flujoDelTicket({ classification: 'Equipo Nuevo', status: 'Ingresado' })).toBe('equipo-nuevo')
  })

  it('ticket Equipo nuevo en En Proceso también enruta a equipo-nuevo (triangulación, otro estado del catálogo)', () => {
    expect(flujoDelTicket({ classification: 'Equipo Nuevo', status: 'En Proceso' })).toBe('equipo-nuevo')
  })

  it('corrección (a), RQ-TC-10: ticket Soporte remoto SIEMPRE enruta a servicio, en cualquier estado', () => {
    expect(flujoDelTicket({ classification: 'Soporte remoto', status: 'Ingresado' })).toBe('servicio')
    expect(flujoDelTicket({ classification: 'Soporte remoto', status: 'En Proceso' })).toBe('servicio')
  })

  it('heredados (M7, s5): ticket Equipo nuevo en un estado FUERA del catálogo EN sigue en servicio, no queda varado', () => {
    expect(flujoDelTicket({ classification: 'Equipo Nuevo', status: 'Rev./Diagnostico' })).toBe('servicio')
  })

  it('un ticket sin clasificación (mantenimiento, valor por defecto) enruta a servicio', () => {
    expect(flujoDelTicket({ classification: 'Equipo para servicio de mantenimiento', status: 'Ingresado' })).toBe('servicio')
  })
})

describe('catalogoDelTicket / transicionesDelTicket', () => {
  it('el catálogo de un ticket Equipo nuevo en Ingresado es TRANSITIONS_EQUIPO_NUEVO', () => {
    expect(catalogoDelTicket({ classification: 'Equipo Nuevo', status: 'Ingresado' })).toBe(TRANSITIONS_EQUIPO_NUEVO)
  })

  it('el catálogo de un ticket de servicio en Ingresado es TRANSITIONS', () => {
    expect(catalogoDelTicket({ classification: 'Equipo para servicio de mantenimiento', status: 'Ingresado' })).toBe(TRANSITIONS)
  })

  it('heredados (M7): transicionesDelTicket devuelve las de TRANSITIONS desde Rev./Diagnostico, no []', () => {
    const transiciones = transicionesDelTicket({ classification: 'Equipo Nuevo', status: 'Rev./Diagnostico' })
    expect(transiciones.map((t) => t.id).sort()).toEqual(
      ['cal_sensores_revision', 'escalado_a_revision', 'rechazo_revision'].sort(),
    )
  })

  it('un ticket Equipo nuevo en Ingresado sólo ve «Ingreso equipo nuevo»', () => {
    const transiciones = transicionesDelTicket({ classification: 'Equipo Nuevo', status: 'Ingresado' })
    expect(transiciones.map((t) => t.id)).toEqual(['ingreso_equipo_nuevo'])
  })
})

describe('transicionPorId / flujoDeTransicion — buscan en TODOS los catálogos', () => {
  it('transicionPorId encuentra una transición del catálogo de equipo nuevo', () => {
    expect(transicionPorId('ingreso_equipo_nuevo')?.to).toBe('En Proceso')
  })

  it('transicionPorId encuentra una transición del catálogo de servicio', () => {
    expect(transicionPorId('ingreso_a_servicio')?.to).toBe('Rev./Diagnostico')
  })

  it('transicionPorId devuelve undefined para un id que no existe en ningún catálogo', () => {
    expect(transicionPorId('id-que-no-existe')).toBeUndefined()
  })

  it('flujoDeTransicion identifica el flujo de una transición de equipo nuevo', () => {
    expect(flujoDeTransicion('liberacion')).toBe('equipo-nuevo')
  })

  it('flujoDeTransicion identifica el flujo de una transición de servicio', () => {
    expect(flujoDeTransicion('ingreso_a_servicio')).toBe('servicio')
  })

  it('flujoDeTransicion devuelve undefined para un id inexistente', () => {
    expect(flujoDeTransicion('id-que-no-existe')).toBeUndefined()
  })
})

describe('fueraDeFlujo — mensaje del 409 (RQ-EN-05)', () => {
  it('devuelve null cuando la transición SÍ es del flujo del ticket', () => {
    const t = transicionPorId('ingreso_equipo_nuevo')!
    expect(fueraDeFlujo(t, { classification: 'Equipo Nuevo', status: 'Ingresado' })).toBeNull()
  })

  it('nombra los dos flujos cuando un ticket de equipo nuevo intenta una transición de servicio', () => {
    const t = transicionPorId('ingreso_a_servicio')!
    const mensaje = fueraDeFlujo(t, { classification: 'Equipo Nuevo', status: 'Ingresado' })
    expect(mensaje).toContain('servicio técnico')
    expect(mensaje).toContain('equipo nuevo')
  })

  it('nombra los dos flujos cuando un ticket de servicio intenta una transición de equipo nuevo (posición, regla de mutación 1)', () => {
    const t = transicionPorId('ingreso_equipo_nuevo')!
    const mensaje = fueraDeFlujo(t, { classification: 'Equipo para servicio de mantenimiento', status: 'Ingresado' })
    expect(mensaje).toContain('equipo nuevo')
    expect(mensaje).toContain('servicio técnico')
  })
})

describe('RQ-EN-07 (tablero) · Verificación cae en la columna Otros', () => {
  it('columnForStatus("Verificación") es "otros" (FALLBACK_COLUMN_ID, sin columna propia)', () => {
    expect(columnForStatus('Verificación')).toBe('otros')
  })

  it('contraste: un estado con columna propia NO cae en "otros"', () => {
    expect(columnForStatus('Ingresado')).toBe('ingresado')
  })
})

describe('CATALOGO_POR_FLUJO — superficie del registro', () => {
  it('tiene exactamente las dos entradas servicio/equipo-nuevo, con los catálogos correctos', () => {
    expect(CATALOGO_POR_FLUJO.servicio).toBe(TRANSITIONS)
    expect(CATALOGO_POR_FLUJO['equipo-nuevo']).toBe(TRANSITIONS_EQUIPO_NUEVO)
  })
})
