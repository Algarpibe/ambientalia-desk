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
    // Lo que la etapa EXIGE. El comentario y la casilla no. Antes había además un asterisco que
    // mentía —un checkbox obligatorio se guardaba como `false` sin error si nadie lo marcaba—: eso
    // era C1, y lo cerró F1A-01 (spec `transitions-st` §3.1). Hoy sin marcar es un obligatorio que falta.
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
    expect(plan.errors).toContain('Falta el campo obligatorio: Código Servicio')
  })

  /**
   * C1 · LO QUE EL ARREGLO NO DEBÍA CAMBIAR, y que es lo que fija DÓNDE va el chequeo de obligatorio.
   *
   * F1A-01 movió ese chequeo a ANTES del bloque del checkbox. Tenía que quedar ahí y no detrás del
   * `if (empty) continue`: detrás, un checkbox OPCIONAL ausente dejaría de escribirse, y su columna
   * pasaría de ponerse en `false` a no tocarse — un cambio de comportamiento distinto, no pedido y
   * silencioso, porque la columna se quedaría con lo que hubiera de antes.
   *
   * `Cumple condiciones comerciales` (`transitions.ts:189`) es el checkbox opcional que lo prueba, y
   * es columna promovida, así que el efecto se ve en `plan.columns`. Los otros cuatro opcionales
   * están en `finalizacion_servicio` (`:223`).
   */
  it('un checkbox OPCIONAL ausente se sigue escribiendo como false', () => {
    const t = transitionById('habilitar_servicio')!
    const casilla = t.fields.find((f) => f.key === 'Cumple condiciones comerciales')!
    // Si mañana se declarara obligatoria, esta prueba dejaría de decir lo que dice.
    expect(casilla.kind).toBe('checkbox')
    expect(casilla.required).toBe(false)

    const plan = buildTransitionPlan(t, { comment: 'x', 'Orden de Venta': 'OV-9', Serial: 'S1' })
    expect(plan.errors).toEqual([])
    expect(plan.columns.cumple_condiciones_comerciales).toBe(false)
  })

  /**
   * El comentario NO frena la transición, en ninguna etapa. Se comprueba desde el motor y no solo
   * desde el catálogo porque son dos formas distintas de romperlo: el catálogo puede dejar de exigirlo
   * y el servidor seguir rechazándolo por su cuenta, que es lo que hacía la guarda aparte que había
   * aquí —el comentario se salta el chequeo genérico de obligatorios, así que tenía la suya.
   */
  it('un comentario vacío no es un error, ni siquiera con todo lo demás relleno', () => {
    const t = transitionById('ingreso_a_servicio')!
    const relleno = {
      comment: '',
      'Código Servicio': 'CG_A123_260812',
      'Fecha creación ticket': '2026-08-12',
      'Fecha Remisión Entrada': '2026-08-12',
    }
    expect(buildTransitionPlan(t, relleno).errors).toEqual([])
    // Y la clave puede no llegar siquiera: la pantalla no manda lo que está vacío.
    const sinClave: Record<string, unknown> = { ...relleno }
    delete sinClave.comment
    expect(buildTransitionPlan(t, sinClave).errors).toEqual([])
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
