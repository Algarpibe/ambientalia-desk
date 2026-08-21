import { describe, it, expect } from 'vitest'
import { ticketDeRemision } from './hojaDeVida'

const tickets = [
  { id: 't-enero', createdAt: '2026-01-10T10:00:00.000Z' },
  { id: 't-julio', createdAt: '2026-07-24T10:00:00.000Z' },
]

describe('ticketDeRemision', () => {
  // Lo normal: la remisión sabe de qué ticket es porque la creó ese ticket.
  it('cuando consta el ticket, va a ese y no se adivina nada', () => {
    expect(ticketDeRemision({ ticketId: 't-enero', cuando: '2026-07-20' }, tickets))
      .toEqual({ ticketId: 't-enero', porFecha: false })
  })

  /**
   * El caso de las 56 remisiones históricas que no casaron con ningún ticket: se enlazaron al equipo
   * por el serial y nada más. Sin fecha de por medio se quedarían fuera de toda tarjeta, que es lo que
   * las hacía parecer de otro rango.
   */
  it('sin ticket, se cuelga del más cercano en fecha y lo dice', () => {
    expect(ticketDeRemision({ ticketId: null, cuando: '2026-07-15' }, tickets))
      .toEqual({ ticketId: 't-julio', porFecha: true })
    expect(ticketDeRemision({ ticketId: null, cuando: '2026-01-03' }, tickets))
      .toEqual({ ticketId: 't-enero', porFecha: true })
  })

  /**
   * Un `ticket_id` que no está entre los tickets del equipo tampoco sirve: apunta a un ticket que esta
   * hoja de vida no enseña, así que colgarla de él sería esconderla. Se trata como huérfana.
   */
  it('un ticket que no es de este equipo cuenta como no constar', () => {
    expect(ticketDeRemision({ ticketId: 't-de-otro-equipo', cuando: '2026-07-15' }, tickets))
      .toEqual({ ticketId: 't-julio', porFecha: true })
  })

  // Sin tickets no hay dónde colgarla: la hoja de vida la enseña suelta, como hasta ahora.
  it('sin tickets no la cuelga de ninguno', () => {
    expect(ticketDeRemision({ ticketId: null, cuando: '2026-07-15' }, [])).toBeNull()
  })

  /**
   * Sin fecha no se puede adivinar, y adivinar igualmente sería peor que no hacerlo: la marca diría
   * «asociada por fecha» sobre una asociación que no miró ninguna fecha.
   */
  it('sin fecha no adivina', () => {
    expect(ticketDeRemision({ ticketId: null, cuando: null }, tickets)).toBeNull()
    expect(ticketDeRemision({ ticketId: null, cuando: 'no es una fecha' }, tickets)).toBeNull()
  })

  // Un ticket sin fecha de creación no puede ganar una comparación de fechas, pero tampoco puede
  // tumbarla: se ignora y compiten los demás.
  it('los tickets sin fecha no participan', () => {
    const conHueco = [{ id: 't-sin-fecha', createdAt: null }, ...tickets]
    expect(ticketDeRemision({ ticketId: null, cuando: '2026-07-15' }, conHueco))
      .toEqual({ ticketId: 't-julio', porFecha: true })
    expect(ticketDeRemision({ ticketId: null, cuando: '2026-07-15' }, [{ id: 't-sin-fecha', createdAt: null }]))
      .toBeNull()
  })

  // Con dos igual de cerca gana el primero de la lista, que llega ordenada: la hoja de vida de un
  // equipo no puede cambiar de forma entre dos recargas.
  it('con empate, siempre el mismo', () => {
    const empatados = [
      { id: 't-a', createdAt: '2026-07-14T00:00:00.000Z' },
      { id: 't-b', createdAt: '2026-07-16T00:00:00.000Z' },
    ]
    expect(ticketDeRemision({ ticketId: null, cuando: '2026-07-15T00:00:00.000Z' }, empatados)?.ticketId).toBe('t-a')
  })
})
