import { describe, it, expect } from 'vitest'
import {
  esClasificacionEquipoNuevo, esClasificacionSoporteRemoto, estadoInicialDelAlta, modalidadDelAlta, MODALIDADES, flujoDelTicket, catalogoDelTicket, transicionesDelTicket,
  transicionPorId, flujoDeTransicion, fueraDeFlujo, CATALOGO_POR_FLUJO,
} from './flujos'
import { TRANSITIONS, TRANSITIONS_EQUIPO_NUEVO, TRANSITIONS_SOPORTE_REMOTO } from './transitions'
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

  it('corrección (a) INVERTIDA (RQ-TC-10; en `66ab783` decía «SIEMPRE servicio»): Soporte remoto enruta a soporte-remoto en los cuatro estados de su catálogo y a servicio fuera de él', () => {
    for (const status of ['Solicitud Soporte', 'En Proceso', 'Pendiente', 'Finalizado']) expect(flujoDelTicket({ classification: 'Soporte remoto', status }), status).toBe('soporte-remoto')
    for (const status of ['Ticket creado', 'Rev./Diagnostico', 'Ingresado']) expect(flujoDelTicket({ classification: 'Soporte remoto', status }), status).toBe('servicio')
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
  it('tiene exactamente las tres entradas servicio/equipo-nuevo/soporte-remoto, con los catálogos correctos', () => {
    expect(CATALOGO_POR_FLUJO.servicio).toBe(TRANSITIONS)
    expect(CATALOGO_POR_FLUJO['equipo-nuevo']).toBe(TRANSITIONS_EQUIPO_NUEVO); expect(CATALOGO_POR_FLUJO['soporte-remoto']).toBe(TRANSITIONS_SOPORTE_REMOTO); expect(Object.keys(CATALOGO_POR_FLUJO)).toEqual(['servicio', 'equipo-nuevo', 'soporte-remoto'])
  })
})

/**
 * `soporte-remoto`, tercer flujo (F1B-06, cambio 2 de 2, RQ-SR-05/RQ-EN-04). La MISMA normalización que
 * `esClasificacionEquipoNuevo` (molde de arriba): igualdad y no `includes`, con la mayúscula variable de Zoho.
 */
describe('esClasificacionSoporteRemoto — normalización (RQ-EN-04)', () => {
  it('reconoce el literal de la app y la variante de Zoho con otra grafía', () => {
    expect(esClasificacionSoporteRemoto('Soporte remoto')).toBe(true)
    expect(esClasificacionSoporteRemoto('Soporte Remoto')).toBe(true)
    expect(esClasificacionSoporteRemoto('  soporte   remoto ')).toBe(true)
  })

  it('NO reconoce «Soporte remoto extra» ni otras clasificaciones: es igualdad, no includes', () => {
    expect(esClasificacionSoporteRemoto('Soporte remoto extra')).toBe(false)
    expect(esClasificacionSoporteRemoto('Equipo nuevo')).toBe(false)
  })

  it('devuelve false para null/undefined, sin lanzar', () => {
    expect(esClasificacionSoporteRemoto(null)).toBe(false)
    expect(esClasificacionSoporteRemoto(undefined)).toBe(false)
  })
})

describe('flujo soporte-remoto — enrutado, catálogo y guarda de flujo (RQ-SR-05, RQ-EN-04)', () => {
  it('la clasificación desambigua En Proceso entre equipo-nuevo, soporte-remoto y servicio', () => {
    expect(flujoDelTicket({ classification: 'Equipo Nuevo', status: 'En Proceso' })).toBe('equipo-nuevo')
    expect(flujoDelTicket({ classification: 'Soporte Remoto', status: 'En Proceso' })).toBe('soporte-remoto')
    expect(flujoDelTicket({ classification: 'Equipo para servicio de mantenimiento', status: 'En Proceso' })).toBe('servicio')
  })

  it('heredado (S-6): SR en Rev./Diagnostico ve las de TRANSITIONS desde ese estado, no []', () => {
    const ids = transicionesDelTicket({ classification: 'Soporte remoto', status: 'Rev./Diagnostico' }).map((t) => t.id)
    expect(ids.sort()).toEqual(['cal_sensores_revision', 'escalado_a_revision', 'rechazo_revision'].sort())
  })

  it('heredado (S-6): SR en Ticket creado ve las de TRANSITIONS desde ese estado, no []', () => {
    const esperadas = TRANSITIONS.filter((t) => t.from.includes('Ticket creado')).map((t) => t.id)
    expect(esperadas.length).toBeGreaterThan(0)
    expect(transicionesDelTicket({ classification: 'Soporte remoto', status: 'Ticket creado' }).map((t) => t.id)).toEqual(esperadas)
  })

  it('un SR en Solicitud Soporte ve sólo asignacion_soporte', () => {
    expect(transicionesDelTicket({ classification: 'Soporte remoto', status: 'Solicitud Soporte' }).map((t) => t.id)).toEqual(['asignacion_soporte'])
  })

  it('el catálogo de un SR en En Proceso es TRANSITIONS_SOPORTE_REMOTO, y flujoDeTransicion(soporte_pendiente) es soporte-remoto', () => {
    expect(catalogoDelTicket({ classification: 'Soporte remoto', status: 'En Proceso' })).toBe(TRANSITIONS_SOPORTE_REMOTO)
    expect(flujoDeTransicion('soporte_pendiente')).toBe('soporte-remoto')
    expect(flujoDeTransicion('marcar_pendiente')).toBe('servicio')
  })

  it('fueraDeFlujo: marcar_pendiente sobre un SR en En Proceso nombra «soporte remoto» y «servicio técnico»', () => {
    const mensaje = fueraDeFlujo(transicionPorId('marcar_pendiente')!, { classification: 'Soporte remoto', status: 'En Proceso' })
    expect(mensaje).toContain('soporte remoto')
    expect(mensaje).toContain('servicio técnico')
  })

  it('fueraDeFlujo (posición): asignacion_soporte sobre un ticket de servicio en Rev./Diagnostico da el mensaje de flujo', () => {
    const mensaje = fueraDeFlujo(transicionPorId('asignacion_soporte')!, { classification: 'Equipo para servicio de mantenimiento', status: 'Rev./Diagnostico' })
    expect(mensaje).toContain('soporte remoto')
    expect(mensaje).toContain('servicio técnico')
  })

  it('S-10 · Solicitud Soporte cae en la columna Otros (sin columna propia; F1B-09)', () => {
    expect(columnForStatus('Solicitud Soporte')).toBe('otros')
  })
})

describe('estadoInicialDelAlta — el nacimiento lo decide shared (D4, RQ-SR-04, RQ-TC-07)', () => {
  it('Soporte remoto, literal o normalizado, nace en Solicitud Soporte (mismo predicado que el enrutado, molde H5)', () => {
    expect(estadoInicialDelAlta('Soporte remoto')).toBe('Solicitud Soporte')
    expect(estadoInicialDelAlta('soporte remoto')).toBe('Solicitud Soporte')
  })

  it('las otras dos clasificaciones, null y undefined nacen en Ticket creado', () => {
    expect(estadoInicialDelAlta('Equipo nuevo')).toBe('Ticket creado')
    expect(estadoInicialDelAlta('Equipo para servicio de mantenimiento')).toBe('Ticket creado')
    expect(estadoInicialDelAlta(null)).toBe('Ticket creado')
    expect(estadoInicialDelAlta(undefined)).toBe('Ticket creado')
  })

  it('nacimiento y enrutado coinciden: el estado de nacimiento de un SR ya es del flujo soporte-remoto', () => {
    const status = estadoInicialDelAlta('soporte remoto')
    expect(flujoDelTicket({ classification: 'soporte remoto', status })).toBe('soporte-remoto')
  })
})

describe('MODALIDADES y modalidadDelAlta — tabla de D5 (RQ-SR-07/08/09)', () => {
  it('el dominio es exactamente remoto y en sitio', () => {
    expect([...MODALIDADES]).toEqual(['remoto', 'en sitio'])
  })

  it.each([
    ['SR', 'Soporte remoto', undefined, 'remoto'],
    ['SR normalizado', 'soporte remoto', undefined, 'remoto'],
    ['SR', 'Soporte remoto', 'remoto', 'remoto'],
    ['SR', 'Soporte remoto', 'en sitio', 'en sitio'],
    ['otra ausente', 'Equipo nuevo', undefined, null],
    ['otra ausente', 'Equipo para servicio de mantenimiento', undefined, null],
    ['sin clasificación', null, undefined, null],
  ] as const)('%s (%s) con modalidad %j → valor %j', (_caso, clasificacion, entrada, esperado) => {
    expect(modalidadDelAlta(clasificacion, entrada)).toEqual({ valor: esperado })
  })

  it.each([
    ['SR', 'Soporte remoto', ''],
    ['SR', 'Soporte remoto', null],
    ['SR', 'Soporte remoto', 'Remoto'],
    ['SR', 'Soporte remoto', 'presencial'],
    ['Equipo nuevo con valor válido', 'Equipo nuevo', 'remoto'],
    ['mantenimiento con valor válido', 'Equipo para servicio de mantenimiento', 'en sitio'],
    ['Equipo nuevo con null', 'Equipo nuevo', null],
  ] as const)('%s (%s) con modalidad %j → error que nombra modalidad', (_caso, clasificacion, entrada) => {
    const r = modalidadDelAlta(clasificacion, entrada)
    expect(r).toHaveProperty('error')
    expect((r as { error: string }).error).toContain('modalidad')
  })
})
