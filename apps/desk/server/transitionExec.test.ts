import { describe, it, expect } from 'vitest'
import { buildTransitionPlan } from './transitionExec'
import { transitionById, TRANSITIONS } from '@ambientalia/shared'; import { PROMOTED_COLUMNS } from '@ambientalia/zoho-sync/db/rows'

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

/**
 * C9 · LA FECHA DE AVISO ATERRIZA EN SU COLUMNA, Y NO ES UNA PREFERENCIA.
 *
 * Es el mismo fallo silencioso que ya vigilan los dos tests de arriba, pero con una vuelta de tuerca:
 * aquí el jsonb no es sólo «menos visible», es DESTRUCTIVO. `repo.ts:88` hace
 * `custom_fields=EXCLUDED.custom_fields` en cada upsert, y el sync corre cada 3 minutos, así que un
 * ticket venido de Zoho —cualquiera que no sea `managed_by_app`— perdería la fecha de aviso antes de
 * que nadie la mirase, y con ella el bodegaje de salida de M1.10.
 *
 * Lo que lo evita es que «Fecha de aviso al cliente» esté en `PROMOTED_COLUMNS` (`rows.ts:117-123`)
 * pese a no ser un campo de Zoho, que es la única excepción de esa lista y va explicada allí.
 */
describe('C9 · Fecha de aviso al cliente', () => {
  it('va a su columna, nunca a custom_fields: el jsonb lo pisa el sync cada 3 min', () => {
    const t = transitionById('habilitado_para_entrega')!
    const plan = buildTransitionPlan(t, { comment: 'avisado por teléfono', 'Fecha de aviso al cliente': '2026-05-02' })
    expect(plan.columns.fecha_aviso_cliente).toBe('2026-05-02')
    expect(plan.customFields, 'si cae aquí, el próximo sync la borra').toEqual({})
  })

  it('y es obligatoria: sin ella el bodegaje de salida no vale cero, es incalculable', () => {
    const t = transitionById('habilitado_para_entrega')!
    const plan = buildTransitionPlan(t, { comment: 'sin avisar' })
    expect(plan.errors.length, 'debe frenar la transición, no dejarla pasar en blanco').toBeGreaterThan(0)
  })
})

/**
 * asociacion-ov-ticket · lote 3 · el destino `ovAdicional` (riesgo de diseño §4).
 *
 * Un campo de OV con clave `'Orden de Venta'` casaría en `LABEL_TO_COL` con la columna `orden_venta` y la
 * SOBRESCRIBIRÍA —la OV de entrada del ticket—, y con cualquier otra clave acabaría en `custom_fields`.
 * El destino `ovAdicional` no aterriza en ninguno de los dos: va a `plan.ovAdicional`, y de ahí sólo lo
 * lee `asociarDesdeTransicion`. La prueba usa a propósito la clave que COLISIONA con la columna: si el
 * despacho por destino desapareciera, la clave casaría y la OV de entrada se pisaría sin que nada fallara.
 */
describe('asociacion-ov-ticket · destino ovAdicional', () => {
  const t = {
    id: 'x', name: 'x', from: ['a'], to: 'b', area: 'Comercial',
    fields: [{ key: 'Orden de Venta', label: 'OV adicional', kind: 'ordenVenta', required: false, target: 'ovAdicional' }],
  } as unknown as Parameters<typeof buildTransitionPlan>[0]

  it('3.1 · escribe plan.ovAdicional y no toca ni las columnas ni custom_fields', () => {
    const plan = buildTransitionPlan(t, { 'Orden de Venta': 'OV-2026-777' })
    expect(plan.ovAdicional).toBe('OV-2026-777')
    expect(plan.columns, 'la clave colisiona con orden_venta: no debe llegar a la columna').toEqual({})
    expect(plan.customFields).toEqual({})
  })

  it('3.1 · vacío u omitido no deja nada (es opcional, S-10)', () => {
    expect(buildTransitionPlan(t, {}).ovAdicional).toBeUndefined()
    expect(buildTransitionPlan(t, { 'Orden de Venta': '' }).ovAdicional).toBeUndefined()
  })
})

/**
 * GUARDIÁN DEL CATÁLOGO (regla de mutación 2): vigila el catálogo real, no el motor. Un campo con destino
 * `ovAdicional` cuya clave casara con una etiqueta de `PROMOTED_COLUMNS` sería inofensivo HOY (el despacho por
 * destino gana), pero el día que alguien lo pase a `customField` sobrescribiría `orden_venta`. Y es opcional
 * en las dos aprobaciones (S-10): obligarlo rompería las aprobaciones que no añaden OV.
 */
describe('asociacion-ov-ticket · el catálogo declara bien el campo de OV adicional', () => {
  const etiquetas = new Set(PROMOTED_COLUMNS.map((p) => p.label))
  const campos = TRANSITIONS.flatMap((t) => t.fields.filter((f) => f.target === 'ovAdicional').map((f) => ({ t: t.id, f })))

  it('sólo lo llevan las dos aprobaciones', () => {
    expect(campos.map((c) => c.t).sort()).toEqual(['aprobacion', 'aprobacion_y_repuestos'])
  })

  it('su clave no casa con ninguna columna promovida', () => {
    for (const { t, f } of campos) expect(etiquetas.has(f.key), `${t}: la clave "${f.key}" pisaría una columna`).toBe(false)
  })

  it('es un buscador de OV y es opcional (S-10)', () => {
    for (const { t, f } of campos) {
      expect(f.kind, t).toBe('ordenVenta')
      expect(f.required, `${t}: obligarlo rompe las aprobaciones sin OV adicional`).toBe(false)
    }
  })

  it('ningún buscador de OV con destino customField escribe una clave promovida, salvo la OV de entrada', () => {
    const otros = TRANSITIONS.flatMap((t) => t.fields.filter((f) => f.kind === 'ordenVenta' && f.target === 'customField' && etiquetas.has(f.key)).map(() => t.id))
    expect(otros).toEqual(['habilitar_servicio'])
  })
})

/**
 * GUARDIÁN DEL CATÁLOGO (asociacion-ov-ticket, lote 4, corrección de RQ-TS-18): el `campoFecha` de un buscador
 * de OV lo escribe el cliente con la fecha de la OV elegida (`TransitionPanel.tsx:103`). Si el campo de OV
 * ADICIONAL declarara uno que resuelve a `orden_venta` o `fecha_orden_venta`, elegir la OV adicional pisaría
 * la OV de entrada (RQ-TS-18: «sin tocar la OV de entrada»). Vigila el catálogo real, no el motor.
 */
describe('asociacion-ov-ticket · la OV adicional no autorrellena columnas de la OV de entrada', () => {
  it('ningún campo con destino ovAdicional tiene un campoFecha que resuelva a orden_venta o fecha_orden_venta', () => {
    const porEtiqueta = new Map(PROMOTED_COLUMNS.map((p) => [p.label, p.col]))
    for (const t of TRANSITIONS) {
      for (const f of t.fields.filter((x) => x.target === 'ovAdicional' && x.campoFecha)) {
        const col = porEtiqueta.get(f.campoFecha!)
        expect(['orden_venta', 'fecha_orden_venta'], `${t.id}: campoFecha "${f.campoFecha}" → ${col}`).not.toContain(col)
      }
    }
  })
})

/**
 * GUARDIÁN DEL CATÁLOGO (asociacion-ov-ticket, lote 6, comprobación de `TransitionPanel.tsx:66`/`:103`): el panel
 * oculta al teclado toda fecha que sea `campoFecha` de algún campo (`fechasDeOV`, `:65-66`) y la escribe al elegir
 * la OV (`:103`). Se fija con el catálogo real lo que la pantalla da por supuesto, sin tocar `.tsx`:
 *  - `aprobacion_y_repuestos`: ningún campo declara `campoFecha`, así que `Fecha Orden De Venta` se TECLEA.
 *  - `aprobacion`: la OV adicional escribe `Fecha Orden de Venta Final`, que es su propia fecha de venta final
 *    (no resuelve a `fecha_orden_venta`, lo cubre el guardián de arriba).
 * Nace verde: describe el catálogo de hoy; lo pone rojo ensuciarlo (mutación M2 del lote 6).
 */
describe('asociacion-ov-ticket · lo que TransitionPanel da por supuesto del catálogo', () => {
  const campoFechas = (id: string) => (TRANSITIONS.find((t) => t.id === id)?.fields ?? []).map((f) => f.campoFecha).filter((x): x is string => !!x)

  it('aprobacion_y_repuestos: ninguna fecha se oculta al teclado (Fecha Orden De Venta es tecleable)', () => {
    expect(campoFechas('aprobacion_y_repuestos')).toEqual([])
  })

  it('aprobacion: sólo la OV adicional autorrellena, y con Fecha Orden de Venta Final', () => {
    expect(campoFechas('aprobacion')).toEqual(['Fecha Orden de Venta Final'])
  })
})

describe('buildTransitionPlan · priority opcional (RQ-TS-20)', () => {
  it('TS20-1 · escalado_a_revision sin prioridad no da error', () => {
    expect(buildTransitionPlan(transitionById('escalado_a_revision')!, { comment: 'x', 'Días de entrega': '20' }).errors).toEqual([])
  })
})
