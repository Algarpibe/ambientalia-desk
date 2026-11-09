import { describe, it, expect } from 'vitest'
import { cadenaDelCiclo, type EvaluacionesDelCiclo, type PasosDeDesk } from './cicloPeriodico'

/**
 * 1G-04 (RQ-ZS-44.1, D-4): la cadena del temporizador vive en una unidad que se puede ejecutar. Los pasos son falsos y apuntan su
 * nombre al ejecutarse, así que la prueba fija el ORDEN real de ejecución y no sólo la presencia de un literal.
 */
function armar() {
  const orden: string[] = []
  const paso = (nombre: string) => () => { orden.push(nombre); return Promise.resolve(nombre) }
  const ev: EvaluacionesDelCiclo = {
    alarmas: paso('alarmas'),
    reclamaciones: paso('reclamaciones'),
    facturacionVencida: paso('facturacionVencida'),
    salidasEsperas: paso('salidasEsperas'),
    provisionalesEnBooks: paso('provisionalesEnBooks'),
    ritmoContratos: paso('ritmoContratos'),
    ritmoYSincronizacion: paso('ritmoYSincronizacion'),
  }
  const desk: PasosDeDesk = { syncActivities: paso('syncActivities'), syncContacts: paso('syncContacts') }
  return { orden, ev, desk }
}

const CINCO = ['alarmas', 'reclamaciones', 'facturacionVencida', 'salidasEsperas', 'provisionalesEnBooks']
const cfg = (modoSinZohoDesk: boolean, syncActivities = true, syncContacts = true) => ({ modoSinZohoDesk, syncActivities, syncContacts })

describe('cadenaDelCiclo · modo abierto: las seis evaluaciones y nada de Desk', () => {
  it('corre las cinco y ritmoContratos en orden, sin ritmoYSincronizacion ni Desk', async () => {
    const { orden, ev, desk } = armar()
    await cadenaDelCiclo(ev, desk, cfg(true))
    expect(orden).toEqual([...CINCO, 'ritmoContratos'])
  })

  it('con los flags de actividades y contactos apagados, igual', async () => {
    const { orden, ev, desk } = armar()
    await cadenaDelCiclo(ev, desk, cfg(true, false, false))
    expect(orden).toEqual([...CINCO, 'ritmoContratos'])
  })
})

describe('cadenaDelCiclo · modo cerrado: el ciclo de hoy', () => {
  it('corre las cinco, ritmoYSincronizacion (sin ritmoContratos), actividades y contactos', async () => {
    const { orden, ev, desk } = armar()
    await cadenaDelCiclo(ev, desk, cfg(false))
    expect(orden).toEqual([...CINCO, 'ritmoYSincronizacion', 'syncActivities', 'syncContacts'])
  })

  it('con actividades apagado, sin su paso', async () => {
    const { orden, ev, desk } = armar()
    await cadenaDelCiclo(ev, desk, cfg(false, false, true))
    expect(orden).toEqual([...CINCO, 'ritmoYSincronizacion', 'syncContacts'])
  })

  it('con contactos apagado, sin su paso', async () => {
    const { orden, ev, desk } = armar()
    await cadenaDelCiclo(ev, desk, cfg(false, true, false))
    expect(orden).toEqual([...CINCO, 'ritmoYSincronizacion', 'syncActivities'])
  })

  it('con los dos apagados, sólo las seis', async () => {
    const { orden, ev, desk } = armar()
    await cadenaDelCiclo(ev, desk, cfg(false, false, false))
    expect(orden).toEqual([...CINCO, 'ritmoYSincronizacion'])
  })
})

describe('cadenaDelCiclo · la promesa devuelta', () => {
  it('rechaza si un paso falla y no corre los siguientes (el catch del temporizador lo registra)', async () => {
    const { orden, ev, desk } = armar()
    ev.facturacionVencida = () => { orden.push('facturacionVencida'); return Promise.reject(new Error('rota')) }
    await expect(cadenaDelCiclo(ev, desk, cfg(false))).rejects.toThrow('rota')
    expect(orden).toEqual(['alarmas', 'reclamaciones', 'facturacionVencida'])
  })
})
