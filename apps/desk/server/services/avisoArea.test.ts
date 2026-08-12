import { describe, it, expect } from 'vitest'
import { areasAAvisar, textoAvisoArea } from './avisoArea'

describe('areasAAvisar', () => {
  // El caso que motivó la funcionalidad: el técnico termina y le toca facturar a Comercial.
  it('avisa al área que recibe el testigo', () => {
    expect(areasAAvisar('Por Facturar', ['Servicio Técnico'])).toEqual(['Comercial'])
  })

  // Sin la resta, «Facturado» (Comercial → Liberación Comercial, cuya siguiente también es Comercial)
  // le avisaría a Comercial de que le toca a Comercial.
  it('no avisa al área que acaba de actuar', () => {
    expect(areasAAvisar('Liberación Comercial', ['Comercial'])).toEqual([])
  })

  // Un admin tiene las tres áreas: la resta lo deja vacío. Decisión consciente del spec — si hace el
  // trabajo de las tres áreas no hay «otro perfil» a quien pasarle el testigo.
  it('quien tiene todas las áreas no le pasa el testigo a nadie', () => {
    expect(areasAAvisar('Por Facturar', ['Comercial', 'Servicio Técnico', 'Compras'])).toEqual([])
  })

  // De «Notificación Comercial» salen Comercial, Compras y Servicio Técnico; el técnico que acaba de
  // escalar se resta a sí mismo y quedan las otras dos.
  it('resta solo lo suyo cuando hay varias áreas siguientes', () => {
    expect(areasAAvisar('Notificación Comercial', ['Servicio Técnico']).sort()).toEqual(['Comercial', 'Compras'])
  })

  it('un estado final no avisa a nadie', () => {
    expect(areasAAvisar('Finalizado', ['Servicio Técnico'])).toEqual([])
  })
})

describe('textoAvisoArea', () => {
  it('dice el ticket, el estado nuevo y quién lo movió', () => {
    expect(textoAvisoArea({ ticketNumero: 1234, estado: 'Por Facturar', actorNombre: 'Ana' }))
      .toBe('Ana dejó el ticket #1234 en «Por Facturar»: le toca a tu área')
  })
})
