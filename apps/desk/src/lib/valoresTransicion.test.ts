import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { transitionById, CLAVE_DERIVACION } from '@ambientalia/shared'
import { valoresConocidos } from './valoresTransicion'

const sinNada = { customFields: {} as Record<string, string | null> }

describe('valoresConocidos', () => {
  // Estas dos fechas las escribe la propia transición "Ingreso a Servicio", así que su columna está
  // vacía justo cuando el formulario las pregunta: sin derivarlas, el técnico tenía que teclear a
  // mano dos datos que el sistema ya conoce.
  it('rellena las dos fechas de Ingreso a Servicio desde su fuente real', () => {
    const v = valoresConocidos(
      { ...sinNada, createdAt: '2026-08-06T16:14:00.000Z' },
      [{ tipo: 'entrada', fecha: '2026-08-04' }],
    )
    expect(v['Fecha creación ticket']).toBe('2026-08-06')
    expect(v['Fecha Remisión Entrada']).toBe('2026-08-04')
  })

  // Las claves salen del Blueprint y no de una constante propia: si alguien renombra el campo allí,
  // este test cae en vez de dejar el formulario pidiendo a mano un dato que sí se sabía.
  it('las claves son exactamente las que declara la transición', () => {
    const t = transitionById('ingreso_a_servicio')!
    const v = valoresConocidos({ ...sinNada, createdAt: '2026-08-06T16:14:00.000Z' }, [{ tipo: 'entrada', fecha: '2026-08-04' }])
    for (const clave of ['Fecha creación ticket', 'Fecha Remisión Entrada']) {
      expect(t.fields.map((f) => f.key)).toContain(clave)
      expect(v[clave]).toBeTruthy()
    }
  })

  // INVERTIDA (B.1.1, D-1): el servidor recalcula SIEMPRE que hay fuente — ya no gana lo que el
  // ticket tenía guardado. Antes esta prueba afirmaba lo contrario; la comodidad de "lo tecleado
  // manda" queda para cuando NO hay fuente en absoluto (ver el caso nuevo, abajo).
  it('con fuente disponible, gana SIEMPRE lo derivado, no lo que el ticket ya guardaba', () => {
    const v = valoresConocidos(
      { customFields: { 'Fecha creación ticket': '2026-01-01', 'Fecha Remisión Entrada': '2026-01-02' }, createdAt: '2026-08-06T16:14:00.000Z' },
      [{ tipo: 'entrada', fecha: '2026-08-04' }],
    )
    expect(v['Fecha creación ticket']).toBe('2026-08-06')
    expect(v['Fecha Remisión Entrada']).toBe('2026-08-04')
  })

  // NUEVA (B.1.2): SIN fuente en absoluto no hay nada que recalcular, así que ahí sí manda lo que
  // el ticket ya trae — se conserva para teclear encima si hace falta (D-3).
  it('sin fuente, la columna se prellena con lo que el ticket ya trae', () => {
    const v = valoresConocidos({ customFields: { 'Fecha creación ticket': '2026-03-03' } }, [])
    expect(v['Fecha creación ticket']).toBe('2026-03-03')
  })

  // Un ticket de Zoho sin remisión: el campo se queda vacío y por tanto EDITABLE, que es lo correcto
  // —hay que poder teclearlo—. Rellenarlo con cualquier cosa sería inventarse una fecha.
  it('sin remisión de entrada deja el campo vacío, no lo inventa', () => {
    expect(valoresConocidos({ ...sinNada, createdAt: '2026-08-06T16:14:00.000Z' }, [])['Fecha Remisión Entrada']).toBeNull()
    expect(valoresConocidos({ ...sinNada, createdAt: '2026-08-06T16:14:00.000Z' }, null)['Fecha Remisión Entrada']).toBeNull()
    // Una remisión de SALIDA tampoco vale para el campo de ENTRADA.
    expect(valoresConocidos({ ...sinNada, createdAt: null }, [{ tipo: 'salida', fecha: '2026-08-09' }])['Fecha Remisión Entrada']).toBeNull()
  })

  /**
   * La derivación llega prellenada para que la etapa siguiente no empiece en blanco y borre sin
   * querer al responsable. La clave se toma del propio catálogo y no de un literal: renombrarla allí
   * tiene que romper aquí.
   */
  it('la derivación vigente llega prellenada, con la clave del catálogo', () => {
    const clave = transitionById('habilitar_servicio')!.fields.at(-1)!.key
    const v = valoresConocidos({ ...sinNada, derivado: { id: 'u-7' } }, [])
    expect(v[clave]).toBe('u-7')
  })

  // Un ticket sin derivar deja la casilla vacía: prellenarla con cualquiera sería inventar un
  // responsable, y el servidor lo guardaría como si alguien lo hubiera elegido.
  it('un ticket sin derivar deja la casilla vacía', () => {
    expect(valoresConocidos(sinNada, [])[CLAVE_DERIVACION]).toBeNull()
  })

  it('conserva el resto de columnas del ticket sin tocarlas', () => {
    const v = valoresConocidos({ customFields: { 'Código Servicio': 'CG_X', 'Orden de Venta': null }, createdAt: null }, [])
    expect(v['Código Servicio']).toBe('CG_X')
    expect(v['Orden de Venta']).toBeNull()
    expect(v['Fecha creación ticket']).toBeNull()
  })
})

/**
 * La tercera fecha derivada, y va por el MISMO canal que las dos de arriba: entrar en
 * `valoresConocidos` es lo que hace que el panel la enseñe bloqueada. No es una preferencia de
 * maquetado — es un dato que el sistema tiene anotado y que nadie debería poder contradecir a mano.
 */
describe('valoresConocidos · Fecha Revisión Informe', () => {
  /**
   * Se pregunta al salir de «Notificado», y el ticket entró ahí por el escalado a revisión: esa ES la
   * fecha en que se revisó el informe. Se pedía a mano un dato que el sistema ya tenía anotado.
   */
  it('la deriva del escalado a revisión', () => {
    const v = valoresConocidos({ ...sinNada, escaladoARevisionAt: '2026-08-10T15:00:00.000Z' }, [])
    expect(v['Fecha Revisión Informe']).toBe('2026-08-10')
  })

  /**
   * DEMOSTRACIÓN DE ZONA (B.1.3, repropósito del viejo "día local" — ya tautológico desde que el
   * cálculo deja de depender de la zona del navegador). Mismas TRES condiciones del analista que
   * `fechasDerivadas.test.ts` A.1.5 (obs. #846): autocomprobación propia por bloque, `vi.stubEnv('TZ', …)`
   * por bloque, y la fase roja documentada en `apply-progress.md`.
   */
  describe.each(['UTC', 'America/Bogota'])('zona · %s', (zona) => {
    beforeAll(() => { vi.stubEnv('TZ', zona) })
    afterAll(() => { vi.unstubAllEnvs() })

    it(`autocomprobación propia — new Date('2026-09-10').getDate() en ${zona}`, () => {
      const esperado = zona === 'America/Bogota' ? 9 : 10
      expect(new Date('2026-09-10').getDate()).toBe(esperado)
    })

    it(`el día de 2026-09-10T00:30:00Z en Fecha creación ticket y Fecha Revisión Informe no depende de la zona del proceso`, () => {
      const v = valoresConocidos({ ...sinNada, createdAt: '2026-09-10T00:30:00Z', escaladoARevisionAt: '2026-09-10T00:30:00Z' }, [])
      expect(v['Fecha creación ticket']).toBe('2026-09-09')
      expect(v['Fecha Revisión Informe']).toBe('2026-09-09')
    })
  })

  /**
   * Un ticket que nunca pasó por revisión —o que la pasó en Zoho, antes de Desk— deja el campo VACÍO,
   * y con eso EDITABLE, que es justo lo que hace falta: bloquear una casilla vacía la dejaría
   * imposible de rellenar para siempre. Inventar una fecha sería peor que no poner ninguna.
   */
  it('sin escalado a revisión queda vacía, y por tanto editable', () => {
    expect(valoresConocidos({ ...sinNada, escaladoARevisionAt: null }, [])['Fecha Revisión Informe']).toBeNull()
    expect(valoresConocidos(sinNada, [])['Fecha Revisión Informe']).toBeNull()
  })

  // INVERTIDA (B.1.1, D-1): misma regla que las otras dos — gana lo derivado, no lo ya guardado.
  it('con fuente disponible, gana SIEMPRE lo derivado, no lo que el ticket ya guardaba', () => {
    const v = valoresConocidos(
      { customFields: { 'Fecha Revisión Informe': '2026-01-01' }, escaladoARevisionAt: '2026-08-10T15:00:00.000Z' },
      [],
    )
    expect(v['Fecha Revisión Informe']).toBe('2026-08-10')
  })

  // La clave sale del Blueprint y no de una constante propia: si alguien renombra el campo allí, esto
  // cae en vez de dejar el formulario pidiendo a mano un dato que sí se sabía.
  it('la clave es exactamente la que declaran las dos etapas que la piden', () => {
    for (const id of ['escalado_a_comercial', 'reporte_por_garantia']) {
      expect(transitionById(id)!.fields.map((f) => f.key)).toContain('Fecha Revisión Informe')
    }
  })
})
