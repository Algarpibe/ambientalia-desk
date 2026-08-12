import { describe, it, expect } from 'vitest'
import { buildTransitionPlan } from './transitionExec'
import { transitionById } from '@ambientalia/shared'

describe('buildTransitionPlan', () => {
  it('mapea a columnas tipadas + comentario para "Habilitar Servicio"', () => {
    const t = transitionById('habilitar_servicio')!
    const plan = buildTransitionPlan(t, {
      comment: 'condiciones ok',
      'Orden de Venta': 'OV-2026-081',
      'Fecha Orden De Venta': '2026-05-19',
      Serial: '18A20070',
      'Cumple condiciones comerciales': true,
    })
    // La etapa pide EXACTAMENTE esto. Se fija la lista para que sumar o quitar un campo sea una
    // decisión y no un descuido: la cotización y la orden de compra se quitaron de aquí a propósito
    // —pueden no existir todavía— y cada una tiene su propia etapa más adelante.
    expect(t.fields.map((f) => f.key)).toEqual([
      'comment', 'Orden de Venta', 'Serial', 'Fecha Orden De Venta', 'Cumple condiciones comerciales',
      // La derivación va la última en todas las etapas, y es opcional: no aparece en el filtro de
      // obligatorios de abajo.
      'derivado_a',
    ])
    // Lo que la etapa EXIGE. El comentario y la casilla no: el asterisco de la casilla además mentía,
    // porque un checkbox obligatorio se guarda como `false` sin error si nadie lo marca (M-2).
    expect(t.fields.filter((f) => f.required).map((f) => f.key)).toEqual(['Orden de Venta', 'Serial'])
    expect(plan.errors).toEqual([])
    expect(plan.status).toBe('Ingresado')
    expect(plan.statusType).toBe('Open')
    expect(plan.comment).toBe('condiciones ok')
    expect(plan.columns.orden_venta).toBe('OV-2026-081')
    expect(plan.columns.fecha_orden_venta).toBe('2026-05-19')
    expect(plan.columns.cumple_condiciones_comerciales).toBe(true)
    // El serial es el dato que ata el ticket a su equipo, y los que vienen de Zoho llegan sin él.
    // Va a la COLUMNA `serial` y no a `custom_fields`: es una columna promovida, y de ahí lo leen la
    // hoja de vida, el buscador y el gate de creación.
    expect(plan.columns.serial).toBe('18A20070')
    expect(plan.customFields).toEqual({})
  })

  // El buscador de OV es cosa de la pantalla; para el motor tiene que seguir siendo texto que acaba
  // en `orden_venta`. Si el `kind` nuevo se colara como campo desconocido, la OV terminaría en el
  // `custom_fields` jsonb y dejaría de verse en el tablero y en la reportería, sin fallar nada.
  it('el campo de orden de venta, pese a su kind propio, sigue yendo a su columna', () => {
    const t = transitionById('habilitar_servicio')!
    const ov = t.fields.find((f) => f.key === 'Orden de Venta')!
    expect(ov.kind).toBe('ordenVenta')
    expect(ov.campoFecha).toBe('Fecha Orden De Venta') // la fecha que se rellena sola con la de la OV
    const plan = buildTransitionPlan(t, { comment: 'x', 'Orden de Venta': 'OV-9', Serial: 'S1', 'Cumple condiciones comerciales': true })
    expect(plan.columns.orden_venta).toBe('OV-9')
    expect(plan.customFields).toEqual({})
  })

  /**
   * La derivación tiene que aterrizar en su COLUMNA. Con `target: 'customField'` acabaría en el jsonb
   * `custom_fields` —porque su clave no está en `PROMOTED_COLUMNS`— y dejaría de verse en el tablero,
   * la tabla y el filtro, sin fallar nada. Es el mismo fallo silencioso que ya vigila el test del
   * campo de orden de venta.
   */
  it('la derivación va a su columna, nunca a custom_fields', () => {
    const t = transitionById('habilitar_servicio')!
    const plan = buildTransitionPlan(t, { comment: 'x', 'Orden de Venta': 'OV-9', Serial: 'S1', derivado_a: 'u-1' })
    expect(plan.columns.derivado_a).toBe('u-1')
    expect(plan.customFields).toEqual({})
  })

  /**
   * Los dos silencios que hay que distinguir, y que ningún otro campo necesita distinguir.
   *
   * La casilla NO llega (una transición ejecutada desde una pantalla que no la ofrece) ⇒ no se toca
   * lo que hubiera. La casilla llega VACIADA a propósito ⇒ se borra la derivación. Sin la diferencia,
   * o no se puede des-derivar un ticket, o cada transición lo des-deriva sin querer.
   */
  it('la clave ausente no toca la derivación; la clave vacía la borra', () => {
    const t = transitionById('habilitar_servicio')!
    const base = { comment: 'x', 'Orden de Venta': 'OV-9', Serial: 'S1' }

    expect('derivado_a' in buildTransitionPlan(t, base).columns).toBe(false)
    expect(buildTransitionPlan(t, { ...base, derivado_a: '' }).columns.derivado_a).toBeNull()
  })

  it('reporta obligatorios faltantes', () => {
    const t = transitionById('ingreso_a_servicio')!
    const plan = buildTransitionPlan(t, { comment: '' })
    expect(plan.errors.length).toBeGreaterThan(0)
    expect(plan.errors).toContain('Falta el comentario')
  })

  it('prioridad va a su campo y número a columna int', () => {
    const t = transitionById('escalado_a_revision')!
    const plan = buildTransitionPlan(t, { comment: 'x', priority: 'High', 'Días de entrega': '20' })
    expect(plan.errors).toEqual([])
    expect(plan.priority).toBe('High')
    expect(plan.columns.dias_entrega).toBe(20)
  })

  it('statusType=Closed al transicionar a Finalizado', () => {
    const t = transitionById('facturado_cierre')! // Por Facturar → Finalizado
    const plan = buildTransitionPlan(t, { comment: 'facturado', 'Fecha De Factura': '2026-06-01' })
    expect(plan.status).toBe('Finalizado')
    expect(plan.statusType).toBe('Closed')
    expect(plan.columns.fecha_factura).toBe('2026-06-01')
  })
})
