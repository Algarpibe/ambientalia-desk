import { describe, it, expect } from 'vitest'
import {
  AREA_DE_DECISION_MIXTAS, DECISIONALES_APAGADO, areaDeDecision, cargosDecisionales, cargosQueFaltanParaDecisional,
  mensajeDecisional, puedeEjecutarTransicionConDecisionales, type AreaDeDecision, type ContextoDecisionales,
} from './decisionales'
import type { SujetoDePermiso } from './cargos'
import { CATALOGO_POR_FLUJO, transicionPorId } from './flujos'

/**
 * Decisionales por cargo (F1C-05, RQ-PM-29; `decision/f1c05-decisionales-por-cargo`). Todo es puro: node, sin base ni HTTP.
 * La tabla de las 14 se escribe A MANO desde la decisión y la delta, nunca se calcula del catálogo (un valor calculado se
 * valida a sí mismo).
 */
const ST: AreaDeDecision = 'Servicio Técnico'
const CO: AreaDeDecision = 'Comercial'
const LISTA_CORTA = 'lista corta'; const FIRMA_CC = 'firma de control de calidad' // F1C-07: en la línea de LISTA_CORTA para no desplazar la tabla (citas)
const DECISIONALES: Record<string, AreaDeDecision | typeof LISTA_CORTA | typeof FIRMA_CC> = {
  escalado_a_revision: ST, devolucion_a_correccion: ST, rechazo_revision: ST,
  producto_no_conforme: ST, liberacion: ST, rechazo_verificacion: ST,
  aprobacion: CO, rechazo_garantia: CO, rechazo_comercial: CO, rechazo_cliente: CO,
  anulacion: CO, anulacion_equipo_nuevo: CO, anulacion_soporte: CO,
  liberacion_sin_factura: LISTA_CORTA, aprobacion_control_calidad: FIRMA_CC, rechazo_control_calidad: FIRMA_CC,
}

const ENCENDIDO_VACANTE: ContextoDecisionales = { activo: true, coordinadorTecnicoVacante: true }
const ENCENDIDO_CUBIERTO: ContextoDecisionales = { activo: true, coordinadorTecnicoVacante: false }
const sujeto = (areas: string[], cargoPermiso?: unknown, isAdmin = false): SujetoDePermiso =>
  ({ areas, isAdmin, cargoPermiso: cargoPermiso as SujetoDePermiso['cargoPermiso'] })
const t = (id: string) => transicionPorId(id)!
const AMBAS = ['Comercial', 'Servicio Técnico']

describe('las 16 Decisionales y su área de decisión (RQ-PM-29, RQ-PM-35)', () => {
  it('el barrido de los tres catálogos da exactamente las 16 de la tabla: las 14 de F1C-05 y las dos de firma de control de calidad', () => {
    const barridas = Object.values(CATALOGO_POR_FLUJO).flat().filter((x) => x.tipoEvento === 'Decisional').map((x) => x.id)
    expect(barridas.sort()).toEqual(Object.keys(DECISIONALES).sort())
  })

  it('cada una resuelve el área de la tabla; la de la lista corta, la suya (Comercial)', () => {
    for (const [id, area] of Object.entries(DECISIONALES)) expect(areaDeDecision(t(id)), id).toBe(area === LISTA_CORTA ? CO : area === FIRMA_CC ? ST : area)
  })

  it('las mixtas, por la tabla: rechazo_revision → Servicio Técnico; rechazo_comercial y rechazo_garantia → Comercial', () => {
    expect({ ...AREA_DE_DECISION_MIXTAS }).toEqual({ rechazo_revision: ST, rechazo_comercial: CO, rechazo_garantia: CO })
    expect(t('rechazo_garantia').area).toBe('Comercial / Compras')
  })

  it('un área que no es Comercial ni Servicio Técnico no tiene área de decisión (S-6)', () => {
    expect(areaDeDecision({ id: 'inventada', area: 'Compras' })).toBeNull()
    expect(areaDeDecision({ id: 'inventada', area: 'Comercial / Compras' })).toBeNull()
  })
})

describe('cargosDecisionales', () => {
  it('Servicio Técnico: Director y Coordinador, más el Especialista sólo con el Coordinador vacante', () => {
    expect(cargosDecisionales(ST, false)).toEqual(['Director Técnico', 'Coordinador Técnico'])
    expect(cargosDecisionales(ST, true)).toEqual(['Director Técnico', 'Coordinador Técnico', 'Especialista técnico'])
  })
  it('Comercial: Director y Coordinador, con o sin vacante', () => {
    expect(cargosDecisionales(CO, false)).toEqual(['Director Comercial', 'Coordinador Comercial'])
    expect(cargosDecisionales(CO, true)).toEqual(['Director Comercial', 'Coordinador Comercial'])
  })
})

describe('cargosQueFaltanParaDecisional', () => {
  it('apagado no restringe nada, ni a un Técnico ni a alguien sin cargo', () => {
    for (const id of Object.keys(DECISIONALES)) {
      expect(cargosQueFaltanParaDecisional(t(id), sujeto(AMBAS, 'Técnico'), DECISIONALES_APAGADO), id).toBeNull()
      expect(cargosQueFaltanParaDecisional(t(id), sujeto(AMBAS), DECISIONALES_APAGADO), id).toBeNull()
    }
    expect(Object.isFrozen(DECISIONALES_APAGADO)).toBe(true)
  })

  it('encendido, un Técnico no ejecuta una Decisional técnica', () => {
    expect(cargosQueFaltanParaDecisional(t('escalado_a_revision'), sujeto([ST], 'Técnico'), ENCENDIDO_CUBIERTO))
      .toEqual(['Director Técnico', 'Coordinador Técnico'])
    expect(cargosQueFaltanParaDecisional(t('escalado_a_revision'), sujeto([ST], 'Técnico'), ENCENDIDO_VACANTE))
      .toEqual(['Director Técnico', 'Coordinador Técnico', 'Especialista técnico'])
  })

  it('el Especialista técnico pasa con el Coordinador vacante y no con él cubierto', () => {
    const esp = sujeto([ST], 'Especialista técnico')
    for (const id of ['escalado_a_revision', 'liberacion', 'rechazo_revision']) {
      expect(cargosQueFaltanParaDecisional(t(id), esp, ENCENDIDO_VACANTE), id).toBeNull()
      expect(cargosQueFaltanParaDecisional(t(id), esp, ENCENDIDO_CUBIERTO), id).not.toBeNull()
    }
  })

  it('Director y Coordinador de cada área pasan las suyas, nunca las de la otra', () => {
    for (const [id, area] of Object.entries(DECISIONALES)) {
      if (area === LISTA_CORTA || area === FIRMA_CC) continue
      const propios = area === ST ? ['Director Técnico', 'Coordinador Técnico'] : ['Director Comercial', 'Coordinador Comercial']
      const ajenos = area === ST ? ['Director Comercial', 'Coordinador Comercial'] : ['Director Técnico', 'Coordinador Técnico', 'Especialista técnico']
      for (const c of propios) expect(cargosQueFaltanParaDecisional(t(id), sujeto(AMBAS, c), ENCENDIDO_VACANTE), `${id} · ${c}`).toBeNull()
      for (const c of ajenos) expect(cargosQueFaltanParaDecisional(t(id), sujeto(AMBAS, c), ENCENDIDO_VACANTE), `${id} · ${c}`).not.toBeNull()
    }
  })

  it('las mixtas por su área de decisión, con las dos áreas en el sujeto', () => {
    expect(puedeEjecutarTransicionConDecisionales(sujeto(AMBAS, 'Director Comercial'), t('rechazo_revision'), ENCENDIDO_VACANTE)).toBe(false)
    expect(puedeEjecutarTransicionConDecisionales(sujeto(AMBAS, 'Director Técnico'), t('rechazo_comercial'), ENCENDIDO_VACANTE)).toBe(false)
    expect(puedeEjecutarTransicionConDecisionales(sujeto(AMBAS, 'Director Técnico'), t('rechazo_garantia'), ENCENDIDO_VACANTE)).toBe(false)
    expect(puedeEjecutarTransicionConDecisionales(sujeto(AMBAS, 'Director Técnico'), t('rechazo_revision'), ENCENDIDO_VACANTE)).toBe(true)
    expect(puedeEjecutarTransicionConDecisionales(sujeto(['Comercial'], 'Coordinador Comercial'), t('rechazo_garantia'), ENCENDIDO_VACANTE)).toBe(true)
  })

  it('la lista corta manda en liberacion_sin_factura: la regla nueva no la reclama y la compuesta exige Director Comercial', () => {
    const coord = sujeto(['Comercial'], 'Coordinador Comercial')
    expect(cargosQueFaltanParaDecisional(t('liberacion_sin_factura'), coord, ENCENDIDO_VACANTE)).toBeNull()
    expect(cargosQueFaltanParaDecisional(t('liberacion_sin_factura'), sujeto(['Comercial']), ENCENDIDO_VACANTE)).toBeNull()
    expect(puedeEjecutarTransicionConDecisionales(coord, t('liberacion_sin_factura'), ENCENDIDO_VACANTE)).toBe(false)
    expect(puedeEjecutarTransicionConDecisionales(sujeto(['Comercial'], 'Director Comercial'), t('liberacion_sin_factura'), ENCENDIDO_VACANTE)).toBe(true)
  })

  it('el administrador pasa; sin cargo o con uno fuera de la lista, no', () => {
    for (const id of Object.keys(DECISIONALES)) {
      expect(cargosQueFaltanParaDecisional(t(id), sujeto([], null, true), ENCENDIDO_CUBIERTO), id).toBeNull()
      expect(puedeEjecutarTransicionConDecisionales(sujeto([], null, true), t(id), ENCENDIDO_CUBIERTO), id).toBe(true)
    }
    expect(cargosQueFaltanParaDecisional(t('aprobacion'), sujeto(['Comercial']), ENCENDIDO_VACANTE)).toEqual(['Director Comercial', 'Coordinador Comercial'])
    expect(cargosQueFaltanParaDecisional(t('aprobacion'), sujeto(['Comercial'], 'director comercial'), ENCENDIDO_VACANTE)).not.toBeNull()
  })

  it('una transición no Decisional no cambia', () => {
    const operativa = t('finalizacion_servicio')
    expect(operativa.tipoEvento).toBe('Operativo')
    expect(cargosQueFaltanParaDecisional(operativa, sujeto([ST], 'Técnico'), ENCENDIDO_CUBIERTO)).toBeNull()
  })

  it('el tipo se resuelve por id: un objeto sin tipoEvento no esquiva la regla', () => {
    expect(cargosQueFaltanParaDecisional({ id: 'escalado_a_revision', area: ST }, sujeto([ST], 'Técnico'), ENCENDIDO_CUBIERTO)).not.toBeNull()
  })

  it('una Decisional sin área de decisión falla cerrada: ningún cargo la ejecuta (S-6)', () => {
    expect(cargosQueFaltanParaDecisional({ id: 'escalado_a_revision', area: 'Compras' }, sujeto(['Compras'], 'Director Técnico'), ENCENDIDO_VACANTE)).toEqual([])
  })

  it('la compuesta nunca concede lo que el área niega', () => {
    expect(puedeEjecutarTransicionConDecisionales(sujeto(['Compras'], 'Director Técnico'), t('escalado_a_revision'), ENCENDIDO_VACANTE)).toBe(false)
  })
})

describe('mensajeDecisional', () => {
  it('nombra la transición y los cargos; sin cargos, dice que no tiene área de decisión', () => {
    expect(mensajeDecisional('Escalado a Revisión', ['Director Técnico', 'Coordinador Técnico']))
      .toBe('La transición "Escalado a Revisión" es Decisional: sólo la ejecutan los cargos Director Técnico, Coordinador Técnico')
    expect(mensajeDecisional('X', [])).toBe('La transición "X" es Decisional y no tiene área de decisión asignada')
  })
})

// F1C-07 (RQ-PM-35): al final del fichero para no desplazar las citas de arriba.
describe('las dos de firma de control de calidad (RQ-PM-35)', () => {
  it('RQ-PM-35 · las dos de firma de control de calidad quedan fuera de la regla por cargo con el contexto encendido', () => {
    for (const id of ['aprobacion_control_calidad', 'rechazo_control_calidad']) {
      expect(cargosQueFaltanParaDecisional(t(id), sujeto([ST], 'Técnico'), ENCENDIDO_CUBIERTO), id).toBeNull()
      expect(cargosQueFaltanParaDecisional(t(id), sujeto([ST], 'Especialista técnico'), ENCENDIDO_CUBIERTO), id).toBeNull()
    }
    expect(cargosQueFaltanParaDecisional(t('escalado_a_revision'), sujeto([ST], 'Técnico'), ENCENDIDO_CUBIERTO)).not.toBeNull()
  })
})
