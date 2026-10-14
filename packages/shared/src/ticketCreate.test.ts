import { describe, it, expect } from 'vitest'
import { buildCodigoServicio, buildSubject, prefijoDeducido, extractServiceCode, TIPOS_SERVICIO, PREFIJOS } from './ticketCreate'

describe('prefijoDeducido', () => {
  // RQ-TC-61: la clasificación manda (HV, SR); si no, el tipo (CG, PRO); lo demás, MT.
  it('Equipo nuevo → HV', () => {
    expect(prefijoDeducido('Equipo nuevo', 'Mantenimiento')).toBe('HV')
  })
  it('Soporte remoto → SR', () => {
    expect(prefijoDeducido('Soporte remoto', 'Mantenimiento')).toBe('SR')
  })
  it('Calibración → CG', () => {
    expect(prefijoDeducido('Equipo para servicio de mantenimiento', 'Calibración')).toBe('CG')
  })
  it('Protocolo → PRO', () => {
    expect(prefijoDeducido('Equipo para servicio de mantenimiento', 'Protocolo')).toBe('PRO')
  })
  it('el resto de tipos → MT', () => {
    for (const t of ['Diagnóstico', 'Garantía', 'Mantenimiento', 'Reparación', 'No aplica', 'Otro']) {
      expect(prefijoDeducido('Equipo para servicio de mantenimiento', t)).toBe('MT')
    }
  })
  it('un tipo fuera de la lista → MT', () => {
    expect(prefijoDeducido('Equipo para servicio de mantenimiento', 'Inspección')).toBe('MT')
  })
  it('la clasificación gana al tipo', () => {
    expect(prefijoDeducido('Equipo nuevo', 'Calibración')).toBe('HV')
    expect(prefijoDeducido('Soporte remoto', 'Protocolo')).toBe('SR')
  })
  it('clasificación desconocida o vacía: decide el tipo y nunca lanza', () => {
    for (const c of ['Otra cosa', '', null, undefined]) {
      expect(prefijoDeducido(c, 'Calibración')).toBe('CG')
      expect(prefijoDeducido(c, 'Protocolo')).toBe('PRO')
      expect(prefijoDeducido(c, 'Garantía')).toBe('MT')
    }
    expect(prefijoDeducido(null, null)).toBe('MT')
  })
  it('reconoce la clasificación con los mismos predicados que el grafo', () => {
    expect(prefijoDeducido('equipo nuevo', 'Mantenimiento')).toBe('HV')
    expect(prefijoDeducido(' Equipo   Nuevo ', 'Mantenimiento')).toBe('HV')
    expect(prefijoDeducido('soporte REMOTO', 'Mantenimiento')).toBe('SR')
    expect(prefijoDeducido('Equipo nuevo usado', 'Mantenimiento')).toBe('MT')
  })
  it('el tipo se compara por literal exacto', () => {
    expect(prefijoDeducido('Equipo para servicio de mantenimiento', 'calibracion')).toBe('MT')
    expect(prefijoDeducido('Equipo para servicio de mantenimiento', 'PROTOCOLO')).toBe('MT')
  })
  it('los cinco prefijos son alcanzables y no hay otro', () => {
    const c = 'Equipo para servicio de mantenimiento'
    const salidas = new Set([
      prefijoDeducido('Equipo nuevo', 'Otro'), prefijoDeducido('Soporte remoto', 'Otro'),
      prefijoDeducido(c, 'Calibración'), prefijoDeducido(c, 'Protocolo'), prefijoDeducido(c, 'Otro'),
    ])
    expect([...salidas].sort()).toEqual([...PREFIJOS].sort())
  })
})

describe('TIPOS_SERVICIO', () => {
  // Lista unificada con la del formulario de remisiones, que aporta 'Reparación'.
  it('incluye Reparación y deja los comodines al final', () => {
    expect(TIPOS_SERVICIO).toContain('Reparación')
    expect(TIPOS_SERVICIO.slice(-2)).toEqual(['No aplica', 'Otro'])
  })
  // RQ-TC-61: «Protocolo» es el sexto tipo, antes de los comodines.
  it('son ocho, en orden exacto, con Protocolo en el índice 5', () => {
    expect([...TIPOS_SERVICIO]).toEqual(['Calibración', 'Diagnóstico', 'Garantía', 'Mantenimiento', 'Reparación', 'Protocolo', 'No aplica', 'Otro'])
    expect(TIPOS_SERVICIO.indexOf('Protocolo')).toBe(5)
  })
})

describe('buildCodigoServicio', () => {
  it('arma PREFIJO_serie_modelo_AAMMDD', () => {
    expect(buildCodigoServicio({ prefijo: 'MT', serie: '18A20070', modelo: 'EDM180C', fecha: new Date('2026-06-04T12:00:00-05:00') }))
      .toBe('MT_18A20070_EDM180C_260604')
  })
})

describe('buildSubject', () => {
  it('arma el asunto estandarizado y colapsa espacios', () => {
    expect(buildSubject({ cliente: 'Gecelca S.A. E.S.P.', tipoEquipo: 'Monitor de partículas', codigo: 'MT_18A20070_EDM180C_260604' }))
      .toBe('Servicio Técnico Gecelca S.A. E.S.P. Monitor de partículas MT_18A20070_EDM180C_260604')
  })
})

describe('extractServiceCode', () => {
  it('extrae serial + código de 4 partes', () => {
    expect(extractServiceCode('Servicio Técnico CHEMILAB GRIMM EDM 180C MT_18A19042_EDM180C_260305'))
      .toEqual({ serial: '18A19042', codigo: 'MT_18A19042_EDM180C_260305' })
  })
  it('extrae código de 3 partes (sin fecha)', () => {
    expect(extractServiceCode('Equipo Nuevo Laboratorio HV_219587_Defender520'))
      .toEqual({ serial: '219587', codigo: 'HV_219587_Defender520' })
  })
  /**
   * Casos REALES del histórico de Zoho: un lote entero de asuntos trae un espacio pegado al guion
   * bajo. El patrón viejo usaba `[^_\s]+`, que lo rechazaba, y esos tickets se quedaban sin serial
   * —y por tanto sin poder enlazarse con su equipo— sin que nada lo delatara.
   */
  it('tolera espacios pegados a los guiones bajos y normaliza el código que devuelve', () => {
    // Lote del 2024-07-05: espacio tras el prefijo.
    expect(extractServiceCode('Equipo Nuevo  Analizador de óxidos de nitrógeno HV_ S2X9CPH3_APNA-370'))
      .toEqual({ serial: 'S2X9CPH3', codigo: 'HV_S2X9CPH3_APNA-370' })
    // Espacio antes del segundo guion bajo, y fecha de 5 dígitos que NO es fecha válida.
    expect(extractServiceCode('Servicio Técnico A&MA Monitor de Partículas CG_18A18102 _EDM180C_26031'))
      .toEqual({ serial: '18A18102', codigo: 'CG_18A18102_EDM180C' })
  })

  // El código que se guarda no debe arrastrar los espacios del asunto: es el que después se compara
  // y se enseña, y `MT_ 18A19042 _EDM180C` y `MT_18A19042_EDM180C` tienen que ser el mismo dato.
  it('el código normalizado es idéntico venga con espacios o sin ellos', () => {
    const conEspacios = extractServiceCode('X MT_ 18A19042 _EDM180C_260305')
    const sinEspacios = extractServiceCode('X MT_18A19042_EDM180C_260305')
    expect(conEspacios).toEqual(sinEspacios)
    expect(conEspacios).toEqual({ serial: '18A19042', codigo: 'MT_18A19042_EDM180C_260305' })
  })

  // Lo que NO se puede recuperar y debe seguir dando null: sin segmento de modelo no hay código.
  it('sigue devolviendo null cuando falta el modelo, aunque haya prefijo y serial', () => {
    expect(extractServiceCode('AGQ Colombia S.A.S. Monitor de partículas CG_18A1204')).toBeNull()
    expect(extractServiceCode('Ambienciq Ingenieros S.A.S. Analizador de O3 MT_ NW6')).toBeNull()
  })

  it('null si no hay código', () => {
    expect(extractServiceCode('Servicio Técnico sin código')).toBeNull()
    expect(extractServiceCode(null)).toBeNull()
  })
})

describe('AAMMDD del código: el día civil de Bogotá (RQ-TC-61)', () => {
  const codigo = (iso: string) => buildCodigoServicio({ prefijo: 'MT', serie: 'S1', modelo: 'M1', fecha: new Date(iso) })

  it('las 20:00 de Bogotá siguen siendo el mismo día, aunque en UTC ya sea el siguiente', () => {
    expect(codigo('2026-10-14T20:00:00-05:00')).toBe('MT_S1_M1_261014')
  })
  it('las 00:30 de Bogotá ya son el día nuevo', () => {
    expect(codigo('2026-10-14T00:30:00-05:00')).toBe('MT_S1_M1_261014')
  })
  it('no depende de la zona del proceso (TZ=America/Bogota)', () => {
    const antes = process.env.TZ
    process.env.TZ = 'America/Bogota'
    try {
      expect(codigo('2026-10-14T20:00:00-05:00')).toBe('MT_S1_M1_261014')
      expect(codigo('2026-10-14T00:30:00-05:00')).toBe('MT_S1_M1_261014')
    } finally {
      if (antes === undefined) delete process.env.TZ
      else process.env.TZ = antes
    }
  })
})
