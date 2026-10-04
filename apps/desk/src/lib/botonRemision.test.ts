import { describe, it, expect } from 'vitest'
import type { Remision } from '@ambientalia/shared'
import { STATUS_TICKET_CREADO, STATUS_OV_ASIGNADA, STATUS_REMISION_CREADA } from '@ambientalia/shared'
import { botonRemision } from './botonRemision'

const R = (over: Partial<Remision>): Remision =>
  ({ id: 'r1', tipo: 'entrada', estado: 'pendiente', anuladaAt: null, ...over } as Remision)

describe('botonRemision', () => {
  it('en la fase inicial y sin remisiones, ofrece crear una', () => {
    expect(botonRemision(STATUS_TICKET_CREADO, [])).toEqual({ visible: true, texto: 'Crear remisión', pendienteId: null })
    expect(botonRemision(STATUS_OV_ASIGNADA, []).visible).toBe(true)
  })

  // La remisión de entrada documenta que el equipo ENTRA: pasada esa fase, crear una sería fabricar
  // un documento fuera de sitio. (`Remisión creada` sin entrada vigente es la excepción: ver más abajo.)
  it('fuera de la fase inicial no se ofrece', () => {
    expect(botonRemision('Ingresado', []).visible).toBe(false)
    expect(botonRemision('Rev./Diagnostico', []).visible).toBe(false)
  })

  /**
   * La ventana real del duplicado: la remisión ya existe pero n8n todavía no ha confirmado, así que el
   * ticket NO se ha movido y el botón seguía diciendo «Crear remisión». El servidor lo rechazaba con
   * un 409, pero el botón invitaba a intentarlo.
   */
  it('con una remisión pendiente, cambia de texto y lleva a la que hay', () => {
    expect(botonRemision(STATUS_TICKET_CREADO, [R({ id: 'r9' })]))
      .toEqual({ visible: true, texto: 'Remisión pendiente de envío', pendienteId: 'r9' })
  })

  /**
   * Y sigue VISIBLE, que es la mitad que importa: si n8n se cae y la remisión se queda pendiente para
   * siempre, esconder el botón dejaría al técnico sin ninguna salida desde la pantalla. Es el callejón
   * que este subsistema ya se ha comido dos veces.
   */
  it('una remisión pendiente no esconde el botón, solo lo reetiqueta', () => {
    expect(botonRemision(STATUS_TICKET_CREADO, [R({})]).visible).toBe(true)
  })

  // Una remisión anulada está fuera de en medio: no debe bloquear ni reetiquetar nada.
  it('una remisión anulada no cuenta', () => {
    expect(botonRemision(STATUS_TICKET_CREADO, [R({ anuladaAt: '2026-08-11T10:00:00Z' })]))
      .toEqual({ visible: true, texto: 'Crear remisión', pendienteId: null })
  })

  /**
   * Un desenlace en `error` significa que NO se produjo documento, así que crear otra es legítimo y no
   * duplica nada — el servidor tampoco lo bloquea. Confundirlo con «pendiente» dejaría al técnico sin
   * poder rehacer una remisión que falló.
   */
  it('una remisión fallida deja crear otra', () => {
    expect(botonRemision(STATUS_TICKET_CREADO, [R({ estado: 'error' })]).texto).toBe('Crear remisión')
  })

  // Si ya hay una confirmada, el ticket habrá pasado a `Remisión creada` y el botón ni se pinta; pero
  // mientras el estado no se haya refrescado, tampoco se ofrece crear otra encima.
  it('una remisión confirmada no ofrece crear otra', () => {
    expect(botonRemision(STATUS_TICKET_CREADO, [R({ estado: 'ok' })]).visible).toBe(false)
  })
})

// F1B-03: la mutación `vigentes.some(() => true)` de la línea 39 no caía ninguna prueba: un `error` vigente NO es confirmada, así que el botón sigue ofreciendo crear.
describe('botonRemision: una vigente en error no cuenta como confirmada', () => {
  it('con una remisión en error sigue ofreciendo crear otra', () => {
    expect(botonRemision(STATUS_TICKET_CREADO, [R({ estado: 'error' })])).toEqual({ visible: true, texto: 'Crear remisión', pendienteId: null })
  })
})

// F1B-03 (remision-creada-sin-salida): en `Remisión creada` el botón sirve al ticket que quedó sin entrada vigente.
describe('botonRemision: Remisión creada sin entrada vigente', () => {
  const ofrece = { visible: true, texto: 'Crear remisión', pendienteId: null }
  it('con la lista vacía ofrece crear una', () => {
    expect(botonRemision(STATUS_REMISION_CREADA, [])).toEqual(ofrece)
  })
  it('con sólo una anulada ofrece crear una', () => {
    expect(botonRemision(STATUS_REMISION_CREADA, [R({ estado: 'ok', anuladaAt: '2026-08-11T10:00:00Z' })])).toEqual(ofrece)
  })
  it('con sólo una confirmada de salida ofrece crear una (no es de entrada)', () => {
    expect(botonRemision(STATUS_REMISION_CREADA, [R({ tipo: 'salida', estado: 'ok' })])).toEqual(ofrece)
  })
  it('con una pendiente se reetiqueta y lleva a la que hay', () => {
    expect(botonRemision(STATUS_REMISION_CREADA, [R({ id: 'r7' })])).toEqual({ visible: true, texto: 'Remisión pendiente de envío', pendienteId: 'r7' })
  })
  it('con sólo una fallida ofrece crear otra', () => {
    expect(botonRemision(STATUS_REMISION_CREADA, [R({ estado: 'error' })])).toEqual(ofrece)
  })
  // Caracterización (nacen verdes): el ticket sano no ofrece nada.
  it('con una confirmada de entrada no se ofrece (ok y ok_con_avisos)', () => {
    expect(botonRemision(STATUS_REMISION_CREADA, [R({ estado: 'ok' })]).visible).toBe(false)
    expect(botonRemision(STATUS_REMISION_CREADA, [R({ estado: 'ok_con_avisos' })]).visible).toBe(false)
  })
  // Caracterización con rojo intermedio: mientras las remisiones cargan (`null`) no se ofrece, o parpadearía en un ticket sano.
  it('mientras las remisiones no han cargado (null) no se ofrece', () => {
    expect(botonRemision(STATUS_REMISION_CREADA, null).visible).toBe(false)
  })
  // Caracterización: en los dos orígenes de la fase inicial `null` sigue tratándose como lista vacía.
  it('null en la fase inicial sigue ofreciendo crear', () => {
    expect(botonRemision(STATUS_OV_ASIGNADA, null)).toEqual(ofrece)
    expect(botonRemision(STATUS_TICKET_CREADO, null)).toEqual(ofrece)
  })
})
