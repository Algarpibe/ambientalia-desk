import { describe, it, expect } from 'vitest'
import { puedeReasignar, reasignacionDelCuerpo, MENSAJES_REASIGNACION } from './reasignacion'
import { CATALOGO_POR_FLUJO, flujoDelTicket } from './flujos'
import { AREAS, areasForTransition } from './transitions'

/**
 * Reasignar la persona a cargo (F1B-05, RQ-PM-27, RQ-TC-50, RQ-TC-52). Todo es puro: node, sin base ni HTTP.
 * La compuerta es la ruta de la transición: pasa quien tiene el área de alguna transición que SALE del estado
 * actual, dentro del catálogo de SU flujo. El esperado se calcula aquí desde `from` y `area`, no se copia de la
 * implementación.
 */
const sujeto = (areas: string[], isAdmin = false) => ({ areas, isAdmin })

/** Todos los estados que nombra algún catálogo, como origen o como destino (los terminales entran por `to`). */
const ESTADOS = [...new Set(Object.values(CATALOGO_POR_FLUJO).flatMap((c) => c.flatMap((t) => [...t.from, t.to])))]

/** Una clasificación por flujo, para que el barrido recorra los tres catálogos. */
const CLASIFICACIONES_DE_PRUEBA = [null, 'Equipo nuevo', 'Soporte remoto']

describe('puedeReasignar · barrido de estados por áreas contra la ruta (RQ-PM-27)', () => {
  it('cada estado de los tres catálogos, por cada área, coincide con «alguna transición que sale de él es de esa área»', () => {
    expect(ESTADOS.length).toBeGreaterThan(10)
    let comparados = 0
    for (const classification of CLASIFICACIONES_DE_PRUEBA) {
      for (const status of ESTADOS) {
        const catalogo = CATALOGO_POR_FLUJO[flujoDelTicket({ status, classification })]
        for (const area of AREAS) {
          const esperado = catalogo.some((t) => t.from.includes(status) && areasForTransition(t.area).includes(area))
          expect(puedeReasignar(sujeto([area]), { status, classification }), `${classification ?? 'servicio'} · ${status} · ${area}`).toBe(esperado)
          comparados++
        }
      }
    }
    expect(comparados).toBe(CLASIFICACIONES_DE_PRUEBA.length * ESTADOS.length * AREAS.length)
  })

  it('hay estados donde sí pasa un área y estados donde no (el barrido discrimina)', () => {
    const resultados = ESTADOS.map((status) => puedeReasignar(sujeto(['Comercial']), { status, classification: null }))
    expect(resultados).toContain(true)
    expect(resultados).toContain(false)
  })

  it('el administrador pasa en cualquier estado, tenga o no área', () => {
    for (const classification of CLASIFICACIONES_DE_PRUEBA) {
      for (const status of ESTADOS) {
        expect(puedeReasignar(sujeto([], true), { status, classification }), `${classification ?? 'servicio'} · ${status}`).toBe(true)
      }
    }
  })

  it('un estado sin salida («Finalizado»): sólo el administrador (S-2)', () => {
    const t = { status: 'Finalizado', classification: null }
    expect(CATALOGO_POR_FLUJO.servicio.some((x) => x.from.includes('Finalizado'))).toBe(false)
    for (const area of AREAS) expect(puedeReasignar(sujeto([area]), t)).toBe(false)
    expect(puedeReasignar(sujeto([], true), t)).toBe(true)
  })

  it('el cargo no abre la puerta (S-3): un sujeto sin área y con cargo no pasa', () => {
    const s = { areas: [], isAdmin: false, cargoPermiso: 'Director Comercial' } as const
    for (const status of ESTADOS) expect(puedeReasignar(s, { status, classification: null }), status).toBe(false)
  })

  it('sin áreas y sin ser administrador no pasa en ningún estado', () => {
    for (const status of ESTADOS) expect(puedeReasignar(sujeto([]), { status, classification: null }), status).toBe(false)
  })

  it('sujeto ausente falla cerrado, sin lanzar', () => {
    expect(puedeReasignar(undefined as never, { status: 'Ingresado', classification: null })).toBe(false)
    expect(puedeReasignar(null as never, { status: 'Ingresado', classification: null })).toBe(false)
  })

  it('no hace falta ser la persona a cargo: la firma ni siquiera recibe quién es', () => {
    expect(puedeReasignar.length).toBe(2)
    expect(puedeReasignar(sujeto(['Servicio Técnico']), { status: 'Ingresado', classification: null })).toBe(true)
  })
})

describe('MENSAJES_REASIGNACION · textos únicos, no vacíos y distintos entre sí', () => {
  it('seis textos distintos', () => {
    const textos = Object.values(MENSAJES_REASIGNACION)
    expect(textos).toHaveLength(6)
    expect(textos.every((m) => m.trim() !== '')).toBe(true)
    expect(new Set(textos).size).toBe(6)
  })
})

describe('reasignacionDelCuerpo · un solo error, en el orden motivo, destino ausente, destino igual al actual (RQ-TC-50, RQ-TC-52)', () => {
  const M = MENSAJES_REASIGNACION

  it('cuerpo válido: devuelve destino y motivo recortados', () => {
    expect(reasignacionDelCuerpo({ destino: '  u2 ', motivo: '  vacaciones  ' }, 'u1')).toEqual({ ok: true, destino: 'u2', motivo: 'vacaciones' })
  })

  it('sin motivo (ausente, vacío, espacios, no cadena) → el error del motivo', () => {
    for (const motivo of [undefined, '', '   ', 7, null, {}]) {
      expect(reasignacionDelCuerpo({ destino: 'u2', motivo }, 'u1'), String(motivo)).toEqual({ ok: false, error: M.motivo })
    }
  })

  it('el motivo va antes que el destino: motivo de espacios y sin destino → el texto del motivo', () => {
    expect(reasignacionDelCuerpo({ motivo: '   ' }, 'u1')).toEqual({ ok: false, error: M.motivo })
  })

  it('el motivo va antes que cada falla del destino: con motivo vacío y destino igual al actual, ausente o no cadena → el texto del motivo', () => {
    for (const destino of ['u1', undefined, '', 5]) {
      expect(reasignacionDelCuerpo({ destino, motivo: '' }, 'u1'), String(destino)).toEqual({ ok: false, error: M.motivo })
    }
  })

  it('destino ausente, vacío, de espacios o no cadena → el texto de destino (no se puede vaciar por esta ruta)', () => {
    for (const destino of [undefined, '', '  ', null, 3, []]) {
      expect(reasignacionDelCuerpo({ destino, motivo: 'x' }, 'u1'), String(destino)).toEqual({ ok: false, error: M.destino })
    }
  })

  it('destino igual a la persona a cargo actual (tras recortar) → el texto de «mismo» (S-4)', () => {
    expect(reasignacionDelCuerpo({ destino: ' u1 ', motivo: 'x' }, 'u1')).toEqual({ ok: false, error: M.mismo })
  })

  it('ticket sin persona a cargo: el destino ausente da el texto de destino, no el de «mismo» (par 4 y 5)', () => {
    expect(reasignacionDelCuerpo({ motivo: 'x' }, null)).toEqual({ ok: false, error: M.destino })
  })

  it('origen nulo se compara con la cadena vacía: cualquier destino real pasa', () => {
    expect(reasignacionDelCuerpo({ destino: 'u1', motivo: 'x' }, null)).toEqual({ ok: true, destino: 'u1', motivo: 'x' })
  })

  it('un cuerpo que no es objeto (null, cadena, arreglo, undefined) falla con el texto del motivo, sin lanzar', () => {
    for (const cuerpo of [null, undefined, 'x', 7, [], [1]]) {
      expect(reasignacionDelCuerpo(cuerpo, 'u1'), JSON.stringify(cuerpo)).toEqual({ ok: false, error: M.motivo })
    }
  })
})
