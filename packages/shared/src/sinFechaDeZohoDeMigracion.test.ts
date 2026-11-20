// pasada-en-seco-sin-fecha-zoho (F1F-01), RQ-ZS-68 y RQ-ZS-69: la regla pura que cuenta los migrados que S-11 dejaría sin fecha de Zoho.
import { describe, it, expect } from 'vitest'
import { ID_TRANSICION_MIGRACION, planDeTicket, cierresDeMigracion, equivalenciaDeEstado, filaDelMarcadorDeMigracion, type TicketParaMigrar } from './migracionTickets'
import { esPasoDeMigracion } from './cierreEnCifras'
import { sinFechaDeZohoDeMigracion } from './marcadorMigracion'
import type { HistorialTransition } from './types'

const CORTE = new Date('2026-12-01T05:00:00.000Z')
const AHORA = new Date('2026-12-01T12:00:00.000Z')
const ANTES = '2026-10-01T10:00:00.000Z'
const DESPUES = '2026-12-02T10:00:00.000Z'
const etapa = (de: string | null, hacia: string | null, cuando: string): HistorialTransition => ({
  transitionName: null, fromStatus: de, toStatus: hacia, area: null, performedBy: null, performedAt: cuando,
})
const tk = (id: string, number: number, status: string, over: Partial<TicketParaMigrar> = {}) => planDeTicket({
  id, number, status, statusType: 'Open', classification: 'Reparación', managedByApp: false, createdTime: ANTES, ...over,
}, CORTE)
const VACIO = { tickets: 0, porRegla: [] }
const sinHistoria = new Map<string, readonly HistorialTransition[]>()

describe('sinFechaDeZohoDeMigracion', () => {
  it('U1 · sólo cuentan los planes «migrar»: ya gobernado, tras el corte y sin equivalencia dan cero', () => {
    const planes = [tk('a', 1, 'Pendiente', { managedByApp: true }), tk('b', 2, 'Pendiente', { createdTime: DESPUES }), tk('c', 3, 'Estado raro')]
    expect(planes.map((p) => p.accion)).toEqual(['ya-gobernado', 'tras-el-corte', 'sin-equivalencia'])
    expect(sinFechaDeZohoDeMigracion(planes, sinHistoria, AHORA)).toEqual(VACIO)
  })

  it('U2 · «Pendiente» de servicio: sin entrada a «Pendiente» cuenta con su número; con ella figura a cero; la etapa de OTRO ticket no le vale', () => {
    const plan = tk('a', 10, 'Pendiente')
    expect(sinFechaDeZohoDeMigracion([plan], sinHistoria, AHORA))
      .toEqual({ tickets: 1, porRegla: [{ regla: 'pendiente-servicio-a-en-proceso', tickets: 1, numeros: [10] }] })
    const con = new Map([['a', [etapa('Ingresado', 'Pendiente', '2026-10-20T14:00:00Z')]]])
    expect(sinFechaDeZohoDeMigracion([plan], con, AHORA))
      .toEqual({ tickets: 0, porRegla: [{ regla: 'pendiente-servicio-a-en-proceso', tickets: 0, numeros: [] }] })
    const ajena = new Map([['otro', [etapa('Ingresado', 'Pendiente', '2026-10-20T14:00:00Z')]]])
    expect(sinFechaDeZohoDeMigracion([plan], ajena, AHORA).tickets).toBe(1)
  })

  it('U3 · identidad y «Pendiente» de Soporte remoto no figuran', () => {
    const planes = [tk('a', 1, 'En Proceso'), tk('b', 2, 'Pendiente', { classification: 'Soporte remoto' })]
    expect(planes.every((p) => p.accion === 'migrar')).toBe(true)
    expect(sinFechaDeZohoDeMigracion(planes, sinHistoria, AHORA)).toEqual(VACIO)
  })

  it('U4 · «Entregado» sin closedTime cuenta, con él no, y coincide con cierresDeMigracion.conFechaDeMigracion', () => {
    const planes = [tk('a', 1, 'Entregado'), tk('b', 2, 'Entregado', { closedTime: '2026-11-30T15:00:00.000Z' })]
    expect(sinFechaDeZohoDeMigracion(planes, sinHistoria, AHORA))
      .toEqual({ tickets: 1, porRegla: [{ regla: 'entregado-a-finalizado', tickets: 1, numeros: [1] }] })
    expect(cierresDeMigracion(planes).conFechaDeMigracion).toBe(1)
  })

  it('U5 · orden de primera aparición y suma', () => {
    const planes = [tk('a', 1, 'Pendiente'), tk('b', 2, 'Entregado'), tk('c', 3, 'Pendiente'), tk('d', 4, 'Entregado')]
    expect(sinFechaDeZohoDeMigracion(planes, sinHistoria, AHORA)).toEqual({
      tickets: 4,
      porRegla: [
        { regla: 'pendiente-servicio-a-en-proceso', tickets: 2, numeros: [1, 3] },
        { regla: 'entregado-a-finalizado', tickets: 2, numeros: [2, 4] },
      ],
    })
  })

  it('U6 · filaDelMarcadorDeMigracion: to_status nulo en identidad y soporte, el destino en las otras dos; sólo «Entregado» lleva cierre_origen', () => {
    const fila = (estado: string, clasificacion: string | null, closed: string | null = null) => {
      const eq = equivalenciaDeEstado(estado, clasificacion)
      if (!eq) throw new Error('sin equivalencia')
      return filaDelMarcadorDeMigracion({ id: 'x', number: 1, status: estado, statusType: 'Open', classification: clasificacion, managedByApp: false, createdTime: ANTES, closedTime: closed }, eq, AHORA)
    }
    expect(fila('En Proceso', 'Reparación').to_status).toBeNull()
    expect(fila('Pendiente', 'Soporte remoto').to_status).toBeNull()
    expect(fila('Pendiente', 'Reparación').to_status).toBe('En Proceso')
    const entregado = fila('Entregado', 'Reparación')
    expect(entregado.to_status).toBe('Finalizado')
    expect(entregado.values).toMatchObject({ regla: 'entregado-a-finalizado', cierre_origen: 'migracion' })
    expect(Object.keys(fila('Pendiente', 'Reparación').values)).toEqual(['regla'])
    expect(esPasoDeMigracion(entregado.transition_id)).toBe(true)
    expect(entregado.transition_id).toBe(ID_TRANSICION_MIGRACION)
  })

  it('U7 · sin planes: { tickets: 0, porRegla: [] }', () => {
    expect(sinFechaDeZohoDeMigracion([], sinHistoria, AHORA)).toEqual(VACIO)
  })
})
