import { describe, it, expect } from 'vitest'
import { transitionById, CLAVE_DERIVACION } from '@ambientalia/shared'
import { valoresConocidos, valoresPropuestos } from './valoresTransicion'

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

  // Si la transición ya se ejecutó una vez, manda lo que quedó guardado: derivarlo otra vez
  // reescribiría con la fecha de hoy algo que se decidió entonces.
  it('lo que el ticket ya guarda gana sobre lo derivado', () => {
    const v = valoresConocidos(
      { customFields: { 'Fecha creación ticket': '2026-01-01', 'Fecha Remisión Entrada': '2026-01-02' }, createdAt: '2026-08-06T16:14:00.000Z' },
      [{ tipo: 'entrada', fecha: '2026-08-04' }],
    )
    expect(v['Fecha creación ticket']).toBe('2026-01-01')
    expect(v['Fecha Remisión Entrada']).toBe('2026-01-02')
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
 * Lo PROPUESTO va aparte de lo conocido, y la diferencia es de fondo: `TransitionPanel` bloquea todo
 * lo que salga de `valoresConocidos`, porque es un dato que el ticket ya guarda y no hay nada que
 * decidir. Esto no — es una fecha derivada del historial, y quien la mira tiene que poder corregirla.
 */
describe('valoresPropuestos', () => {
  /**
   * «Fecha Revisión Informe» se pregunta al salir de «Notificado», y el ticket entró ahí por el
   * escalado a revisión: esa ES la fecha en que se revisó el informe. Se pedía a mano un dato que el
   * sistema ya tenía anotado.
   */
  it('propone la fecha del escalado a revisión', () => {
    expect(valoresPropuestos({ escaladoARevisionAt: '2026-08-10T15:00:00.000Z' })['Fecha Revisión Informe'])
      .toBe('2026-08-10')
  })

  /**
   * El día es el del NAVEGADOR, no el del ISO recortado. `performed_at` es un instante en UTC, así que
   * un escalado a las 20:00 en Colombia (UTC-5) se guarda como la 01:00Z del día siguiente y
   * `slice(0, 10)` daría un día de más. Es la misma trampa que ya costó un bug con las remisiones.
   *
   * El instante se construye con getters LOCALES para que el test valga sea cual sea la zona de la
   * máquina. Donde la zona es UTC —local y UTC coinciden— las dos implementaciones dan lo mismo y esto
   * no discrimina; en Colombia, que es donde se usa, sí.
   */
  it('el día es el local, no el recorte del instante en UTC', () => {
    const casiMedianoche = new Date(2026, 7, 10, 23, 30).toISOString()
    expect(valoresPropuestos({ escaladoARevisionAt: casiMedianoche })['Fecha Revisión Informe'])
      .toBe('2026-08-10')
  })

  // Un ticket que nunca pasó por revisión —o que la pasó en Zoho, antes de Desk— no tiene nada que
  // proponer. Se deja vacío para que se teclee: inventar una fecha sería peor que no poner ninguna.
  it('sin escalado a revisión no propone nada', () => {
    expect(valoresPropuestos({ escaladoARevisionAt: null })['Fecha Revisión Informe']).toBeNull()
    expect(valoresPropuestos({})['Fecha Revisión Informe']).toBeNull()
  })

  // La clave sale del Blueprint y no de una constante propia: si alguien renombra el campo allí, esto
  // cae en vez de dejar el formulario pidiendo a mano un dato que sí se sabía.
  it('la clave es exactamente la que declaran las dos etapas que la piden', () => {
    for (const id of ['escalado_a_comercial', 'reporte_por_garantia']) {
      expect(transitionById(id)!.fields.map((f) => f.key)).toContain('Fecha Revisión Informe')
    }
  })
})
