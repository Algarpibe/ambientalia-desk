import { describe, it, expect } from 'vitest'
import { avisoDerivacion } from './avisoDerivacion'

const base = {
  anterior: null as string | null,
  nuevo: 'u-2' as string | null,
  actorId: 'u-1',
  actorNombre: 'Ana Ruiz',
  ticketNumero: 1024,
  transicion: 'Habilitar Servicio',
}

describe('avisoDerivacion', () => {
  it('avisa a quien recibe el ticket, diciendo quién y en qué etapa', () => {
    expect(avisoDerivacion(base)).toEqual({
      userId: 'u-2',
      texto: 'Ana Ruiz te derivó el ticket #1024 en «Habilitar Servicio»',
    })
  })

  /**
   * La regla que evita el spam, y la razón por la que esto no es un simple `if (nuevo)`.
   *
   * La casilla llega PRELLENADA en cada etapa, así que confirmar cinco transiciones seguidas sin
   * tocarla reenviaría el mismo aviso cinco veces a la misma persona. Solo se avisa cuando la
   * derivación CAMBIA de manos.
   */
  it('no avisa si la persona no cambia', () => {
    expect(avisoDerivacion({ ...base, anterior: 'u-2', nuevo: 'u-2' })).toBeNull()
  })

  it('sí avisa cuando el ticket pasa de una persona a otra', () => {
    expect(avisoDerivacion({ ...base, anterior: 'u-9', nuevo: 'u-2' })?.userId).toBe('u-2')
  })

  // Quien se autoasigna ya sabe que lo hizo; avisarle es ruido en su propia campana.
  it('no avisa a quien se deriva el ticket a sí mismo', () => {
    expect(avisoDerivacion({ ...base, nuevo: 'u-1' })).toBeNull()
  })

  // Quitar la derivación no le da trabajo a nadie, así que no hay a quién avisar.
  it('no avisa al vaciar la derivación', () => {
    expect(avisoDerivacion({ ...base, anterior: 'u-2', nuevo: null })).toBeNull()
  })
})
