import { describe, it, expect } from 'vitest'
import type { Ticket } from '@ambientalia/shared'
import { applyBoardView } from './boardView'

/**
 * E-226 (`decision/e226-espera-y-areas-equipo-nuevo`, RQ-TS-39): las tres que eran `sin_clasificar`, en el tablero.
 * `Pendiente` depende de alguien de fuera y sale en «Espera»; `Verificación` y `Solicitud Soporte` no esperan a nadie y
 * siguen en «Abiertos». Las dos últimas ya caían ahí siendo `sin_clasificar`: aquí se fija que lo hacen por decisión.
 */
const now = new Date('2026-10-17T00:00:00Z')
const enVista = (status: string) => {
  const t = [{ id: 'e', number: '#1', subject: 's', status, statusType: 'Open', dueDate: null } as unknown as Ticket]
  return { espera: applyBoardView(t, 'espera', now).length, abiertos: applyBoardView(t, 'abiertos', now).length }
}

describe('E-226 · las tres que eran sin_clasificar, en las vistas del tablero', () => {
  it('Pendiente sale en «Espera» y no en «Abiertos»', () => {
    expect(enVista('Pendiente')).toEqual({ espera: 1, abiertos: 0 })
  })

  it('Verificación sale en «Abiertos»: es trabajo propio de Servicio Técnico', () => {
    expect(enVista('Verificación')).toEqual({ espera: 0, abiertos: 1 })
  })

  it('Solicitud Soporte sale en «Abiertos»: es cola propia (supuesto del analista)', () => {
    expect(enVista('Solicitud Soporte')).toEqual({ espera: 0, abiertos: 1 })
  })
})
