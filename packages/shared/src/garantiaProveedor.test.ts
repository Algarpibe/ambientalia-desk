// ficha-garantia-proveedor (F1B-13), lote 1a: la regla pura de la reclamación al fabricante.
import { describe, it, expect } from 'vitest'
import {
  MOTIVOS_NO_RECLAMA, ESTADOS_RECLAMACION, RESULTADOS_RECLAMACION,
  ETIQUETA_MOTIVO_NO_RECLAMA, ETIQUETA_ESTADO_RECLAMACION, ETIQUETA_RESULTADO_RECLAMACION,
  ORIGEN_VALOR_MANUAL, DIAS_AVISO_RECLAMACION, MENSAJE_SIN_CARGO_RECLAMACION,
  puedeGestionarReclamacion, siguienteEstado, motivoPasoNoPermitido,
  validarRespuesta, validarDatosFicha, validarPaso, reclamacionVencida,
} from './garantiaProveedor'
import { CARGOS, EXCEPCIONES_POR_CARGO, puedeCrearOVIGarantia } from './cargos'
import { sumarDias } from './calendarioLaboral'

describe('las tres listas cerradas y sus etiquetas (RQ-TC-45)', () => {
  it('cada lista tiene tres valores y cada clave tiene etiqueta', () => {
    expect(MOTIVOS_NO_RECLAMA).toEqual(['fuera_de_garantia', 'mal_uso', 'costo_envio'])
    expect(ESTADOS_RECLAMACION).toEqual(['abierta', 'enviada', 'resuelta'])
    expect(RESULTADOS_RECLAMACION).toEqual(['reposicion', 'nota_credito', 'rechazada'])
    for (const k of MOTIVOS_NO_RECLAMA) expect(ETIQUETA_MOTIVO_NO_RECLAMA[k]).toMatch(/\S/)
    for (const k of ESTADOS_RECLAMACION) expect(ETIQUETA_ESTADO_RECLAMACION[k]).toMatch(/\S/)
    for (const k of RESULTADOS_RECLAMACION) expect(ETIQUETA_RESULTADO_RECLAMACION[k]).toMatch(/\S/)
  })

  it('constantes: origen manual, 60 días y el mensaje nombra el cargo', () => {
    expect(ORIGEN_VALOR_MANUAL).toBe('manual')
    expect(DIAS_AVISO_RECLAMACION).toBe(60)
    expect(MENSAJE_SIN_CARGO_RECLAMACION).toContain(EXCEPCIONES_POR_CARGO.crearOVIGarantia)
  })
})

describe('siguienteEstado y motivoPasoNoPermitido (RQ-TC-46)', () => {
  it('abierta → enviada → resuelta → null; lo desconocido es null', () => {
    expect(siguienteEstado('abierta')).toBe('enviada')
    expect(siguienteEstado('enviada')).toBe('resuelta')
    expect(siguienteEstado('resuelta')).toBeNull()
    expect(siguienteEstado('otra')).toBeNull()
    expect(siguienteEstado(undefined)).toBeNull()
  })

  it('null sólo si el destino es el siguiente; salto, retroceso, resuelta y destino desconocido dan texto', () => {
    expect(motivoPasoNoPermitido('abierta', 'enviada')).toBeNull()
    expect(motivoPasoNoPermitido('enviada', 'resuelta')).toBeNull()
    expect(motivoPasoNoPermitido('abierta', 'resuelta')).toMatch(/\S/)
    expect(motivoPasoNoPermitido('enviada', 'abierta')).toMatch(/\S/)
    expect(motivoPasoNoPermitido('resuelta', 'enviada')).toMatch(/\S/)
    expect(motivoPasoNoPermitido('resuelta', 'resuelta')).toMatch(/\S/)
    expect(motivoPasoNoPermitido('abierta', 'cerrada')).toMatch(/\S/)
    expect(motivoPasoNoPermitido('abierta', undefined)).toMatch(/\S/)
  })
})

describe('validarRespuesta (RQ-TC-44, RQ-TC-45)', () => {
  it('«sí» con fabricante: recorta y normaliza; valor ausente → null', () => {
    expect(validarRespuesta({ reclama: true, fabricante: '  Acme  ' })).toEqual({
      ok: true,
      valor: { reclama: true, fabricante: 'Acme', piezaReferencia: null, piezaSerial: null, valorReclamado: null },
    })
    const r = validarRespuesta({ reclama: true, fabricante: 'Acme', piezaReferencia: 'P-1', piezaSerial: 'S-9', valorReclamado: 800000 })
    expect(r).toEqual({ ok: true, valor: { reclama: true, fabricante: 'Acme', piezaReferencia: 'P-1', piezaSerial: 'S-9', valorReclamado: 800000 } })
  })

  it.each([
    ['sin fabricante', { reclama: true }],
    ['fabricante de sólo espacios', { reclama: true, fabricante: '   ' }],
    ['fabricante no texto', { reclama: true, fabricante: 5 }],
    ['valor negativo', { reclama: true, fabricante: 'A', valorReclamado: -1 }],
    ['valor no numérico', { reclama: true, fabricante: 'A', valorReclamado: 'abc' }],
    ['valor no finito', { reclama: true, fabricante: 'A', valorReclamado: Infinity }],
    ['reclama no booleano', { reclama: 'si', fabricante: 'A' }],
    ['cuerpo ausente', undefined],
    ['sin reclama', {}],
  ])('«sí»/cuerpo inválido: %s → error', (_t, cuerpo) => {
    const r = validarRespuesta(cuerpo)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/\S/)
  })

  it('«no» exige motivo de la lista; ignora lo demás', () => {
    expect(validarRespuesta({ reclama: false, motivo: 'mal_uso', fabricante: 'X' })).toEqual({ ok: true, valor: { reclama: false, motivo: 'mal_uso' } })
    for (const motivo of [undefined, '', 'otro', 5]) expect(validarRespuesta({ reclama: false, motivo }).ok).toBe(false)
  })
})

describe('validarDatosFicha (RQ-TC-45)', () => {
  it('reemplazo completo de los cinco datos, con las mismas reglas', () => {
    expect(validarDatosFicha({ fabricante: ' Acme ', piezaReferencia: null, piezaSerial: 'S', rma: ' R-1 ', valorReclamado: 10 })).toEqual({
      ok: true,
      valor: { fabricante: 'Acme', piezaReferencia: null, piezaSerial: 'S', rma: 'R-1', valorReclamado: 10 },
    })
    expect(validarDatosFicha({ fabricante: 'Acme' })).toEqual({
      ok: true,
      valor: { fabricante: 'Acme', piezaReferencia: null, piezaSerial: null, rma: null, valorReclamado: null },
    })
  })

  it('fabricante vacío, valor negativo y valor no numérico son error', () => {
    expect(validarDatosFicha({ fabricante: '  ' }).ok).toBe(false)
    expect(validarDatosFicha({ fabricante: 'A', valorReclamado: -1 }).ok).toBe(false)
    expect(validarDatosFicha({ fabricante: 'A', valorReclamado: 'abc' }).ok).toBe(false)
    expect(validarDatosFicha(null).ok).toBe(false)
  })
})

describe('validarPaso (RQ-TC-46, RQ-TC-47)', () => {
  it('a «enviada» no exige nada', () => {
    expect(validarPaso('enviada', {})).toEqual({ ok: true, valor: { a: 'enviada' } })
  })

  it('«reposición» y «nota crédito» exigen un número finito ≥ 0', () => {
    expect(validarPaso('resuelta', { resultado: 'reposicion', valorRecuperado: 800000 })).toEqual({
      ok: true, valor: { a: 'resuelta', resultado: 'reposicion', valorRecuperado: 800000 },
    })
    expect(validarPaso('resuelta', { resultado: 'nota_credito', valorRecuperado: 0 }).ok).toBe(true)
    for (const resultado of ['reposicion', 'nota_credito']) {
      for (const valorRecuperado of [undefined, null, -1, 'abc', NaN]) {
        expect(validarPaso('resuelta', { resultado, valorRecuperado }).ok, `${resultado} ${String(valorRecuperado)}`).toBe(false)
      }
    }
  })

  it('«rechazada» acepta ausente y 0 y guarda 0; cualquier otro valor es error', () => {
    const esperado = { ok: true, valor: { a: 'resuelta', resultado: 'rechazada', valorRecuperado: 0 } }
    expect(validarPaso('resuelta', { resultado: 'rechazada' })).toEqual(esperado)
    expect(validarPaso('resuelta', { resultado: 'rechazada', valorRecuperado: 0 })).toEqual(esperado)
    expect(validarPaso('resuelta', { resultado: 'rechazada', valorRecuperado: 5 }).ok).toBe(false)
  })

  it('resultado fuera de la lista o ausente es error', () => {
    expect(validarPaso('resuelta', { resultado: 'otro', valorRecuperado: 1 }).ok).toBe(false)
    expect(validarPaso('resuelta', {}).ok).toBe(false)
  })
})

describe('reclamacionVencida: frontera estricta, días naturales (RQ-AV-19)', () => {
  const abierta = '2026-08-01'
  it('el día 59 no, el 60 no, el 61 sí', () => {
    expect(reclamacionVencida(abierta, sumarDias(abierta, 59))).toBe(false)
    expect(reclamacionVencida(abierta, sumarDias(abierta, 60))).toBe(false)
    expect(reclamacionVencida(abierta, sumarDias(abierta, 61))).toBe(true)
  })
})

describe('puedeGestionarReclamacion (RQ-PM-26)', () => {
  it('coincide con puedeCrearOVIGarantia para los ocho cargos, sin cargo y administrador', () => {
    for (const cargoPermiso of CARGOS) {
      const s = { isAdmin: false, cargoPermiso }
      expect(puedeGestionarReclamacion(s), cargoPermiso).toBe(puedeCrearOVIGarantia(s))
    }
    expect(puedeGestionarReclamacion({ isAdmin: false, cargoPermiso: 'Director Técnico' })).toBe(true)
    expect(puedeGestionarReclamacion({ isAdmin: false, cargoPermiso: 'Director Comercial' })).toBe(false)
    expect(puedeGestionarReclamacion({ isAdmin: false, cargoPermiso: null })).toBe(false)
    expect(puedeGestionarReclamacion({ isAdmin: false })).toBe(false)
    expect(puedeGestionarReclamacion({ isAdmin: true })).toBe(true)
  })

  it('un sujeto ausente no puede', () => {
    expect(puedeGestionarReclamacion(undefined)).toBe(false)
    expect(puedeGestionarReclamacion(null)).toBe(false)
  })
})
