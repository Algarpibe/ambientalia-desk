import { describe, it, expect } from 'vitest'
import type { Transition } from '@ambientalia/shared'
import { TRANSITIONS_EQUIPO_NUEVO, TRANSITIONS_SOPORTE_REMOTO, areasSiguientes } from '@ambientalia/shared'
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

/**
 * F1B-06, RQ-AV-04 (delta `derivacion-avisos`): `areasAAvisar` gana un tercer parámetro OPCIONAL, el
 * catálogo del flujo del ticket. Sin él, `Análisis y acciones` (catálogo Equipo nuevo, `Notificado` →
 * `Ingresado`) calcularía sus áreas siguientes sobre `TRANSITIONS` (servicio) en vez de sobre el
 * catálogo del flujo aplicable — mismo nombre de estado, catálogo distinto.
 *
 * El catálogo SINTÉTICO de abajo tiene, a propósito, áreas siguientes DISTINTAS de las de servicio
 * desde `Notificado` (`escalado_a_comercial`/`reporte_por_garantia` → Comercial/Compras): así M13
 * (7.6 de `tasks.md`) es detectable aquí aunque no lo sea con el catálogo real (s2, las cinco EN son
 * todas Servicio Técnico).
 */
describe('areasAAvisar con catálogo inyectado (F1B-06)', () => {
  const CATALOGO_SINTETICO: Transition[] = [
    { id: 'sintetica_1', name: 'Sintética 1', from: ['Notificado'], to: 'Ingresado', area: 'Compras', fields: [] },
  ]

  it('con catálogo inyectado, las áreas siguientes salen de ESE catálogo, no de TRANSITIONS', () => {
    expect(areasAAvisar('Notificado', [], CATALOGO_SINTETICO)).toEqual(['Compras'])
  })

  it('sin catálogo inyectado, sigue calculando sobre TRANSITIONS (compatibilidad)', () => {
    expect(areasAAvisar('Notificado', [])).toEqual(['Servicio Técnico'])
  })
})

describe('textoAvisoArea', () => {
  it('dice el ticket, el estado nuevo y quién lo movió', () => {
    expect(textoAvisoArea({ ticketNumero: 1234, estado: 'Por Facturar', actorNombre: 'Ana' }))
      .toBe('Ana dejó el ticket #1234 en «Por Facturar»: le toca a tu área')
  })
})

/**
 * F1A-03 — `Verificación` gana salida en el catálogo EN, y `areasAAvisar` no dispara aviso nuevo.
 *
 * `verificacion` (la transición que LLEGA a `Verificación`) ya exige `Servicio Técnico`, y las dos
 * salidas nuevas (`liberacion`, `rechazo_verificacion`) también son de esa área: `areasAAvisar` resta
 * las áreas de quien acaba de actuar (`avisoArea.ts:16`), así que ningún actor autorizado genera aviso.
 */
describe('Verificación gana salida sin generar aviso nuevo (F1A-03)', () => {
  it('areasSiguientes(Verificación, EN) es Servicio Técnico', () => {
    expect(areasSiguientes('Verificación', TRANSITIONS_EQUIPO_NUEVO)).toEqual(['Servicio Técnico'])
  })

  it('areasAAvisar(Verificación, [Servicio Técnico], EN) no avisa a nadie', () => {
    expect(areasAAvisar('Verificación', ['Servicio Técnico'], TRANSITIONS_EQUIPO_NUEVO)).toEqual([])
  })
})

/**
 * F1B-06 (cambio 2) — `Solicitud Soporte` es el estado de nacimiento del soporte remoto y su única salida
 * (`asignacion_soporte`) es de `Servicio Técnico`: quien la ejecuta es esa misma área, y `areasAAvisar` la resta.
 */
describe('Solicitud Soporte, primer estado del catálogo de soporte remoto (F1B-06, cambio 2)', () => {
  it('areasSiguientes(Solicitud Soporte, SR) es Servicio Técnico', () => {
    expect(areasSiguientes('Solicitud Soporte', TRANSITIONS_SOPORTE_REMOTO)).toEqual(['Servicio Técnico'])
  })

  it('areasAAvisar(Solicitud Soporte, [Servicio Técnico], SR) no avisa a nadie, y un usuario de Comercial sí avisaría a Servicio Técnico', () => {
    expect(areasAAvisar('Solicitud Soporte', ['Servicio Técnico'], TRANSITIONS_SOPORTE_REMOTO)).toEqual([])
    expect(areasAAvisar('Solicitud Soporte', ['Comercial'], TRANSITIONS_SOPORTE_REMOTO)).toEqual(['Servicio Técnico'])
  })
})
