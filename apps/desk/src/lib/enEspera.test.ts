import { describe, it, expect } from 'vitest'
import { ESTADOS, ESTADOS_EN_ESPERA } from '@ambientalia/shared'
import { esEstadoEnEspera } from './enEspera'

/**
 * El contrato del predicado compartido (D1 de `design.md`). Es INVARIANTE al salto de 9 a 11 estados
 * `en_espera`: no enumera el registro, lo DERIVA. La enumeración vive en `estados.test.ts`, que es su
 * sitio, y no se mantiene dos veces aquí.
 *
 * NO es tautológico con la implementación identidad: la mutación M4 —sustituir el registro por
 * `/espera|hold/i` dentro del módulo— pone rojo el aserto 1 en los estados `en_espera` que ni
 * contienen «espera» ni «hold» (`Servicio externo`, `Notificación a Compras`, `Notificación
 * Comercial`, `Solicitado`, `Liberación Comercial`, `Remisión creada`).
 */
describe('esEstadoEnEspera — el predicado compartido de los dos consumidores que CLASIFICAN', () => {
  it('todo estado de ESTADOS_EN_ESPERA da true', () => {
    for (const estado of ESTADOS_EN_ESPERA) {
      expect(esEstadoEnEspera(estado), `«${estado}» debería ser en espera`).toBe(true)
    }
  })

  it('todo estado de ESTADOS que no esté en ESTADOS_EN_ESPERA da false', () => {
    const enEspera = new Set<string>(ESTADOS_EN_ESPERA)
    for (const estado of ESTADOS) {
      if (enEspera.has(estado)) continue
      expect(esEstadoEnEspera(estado), `«${estado}» NO debería ser en espera`).toBe(false)
    }
  })

  it('undefined, null y cadena vacía dan false — fija la firma de D1.1', () => {
    expect(esEstadoEnEspera(undefined)).toBe(false)
    expect(esEstadoEnEspera(null)).toBe(false)
    expect(esEstadoEnEspera('')).toBe(false)
  })

  it('un estado inexistente da false — la decisión del desconocido, D1.3', () => {
    expect(esEstadoEnEspera('Estado inventado')).toBe(false)
  })

  /**
   * Caso anclado, testigo del salto 9→11 desde el lado del CLIENTE (Fase 2.4 de `tasks.md`). Va aquí y
   * no en la Fase 1 porque antes de reclasificar `Por Entregar` en `estados.ts` este aserto sería
   * rojo: el contrato genérico de arriba ya lo cubre, pero un caso nombrado deja constancia explícita
   * de la decisión de Gerencia (`decision/por-entregar-es-espera`, 2026-09-12) en el módulo que la
   * consume, no sólo en el registro que la declara.
   */
  it('esEstadoEnEspera("Por Entregar") es true — decisión de Gerencia 2026-09-12', () => {
    expect(esEstadoEnEspera('Por Entregar')).toBe(true)
  })
})
