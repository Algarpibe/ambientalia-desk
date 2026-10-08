import { describe, it, expect } from 'vitest'
import {
  PRIORIDADES_ASIGNABLES, esPrioridadAsignable, prioridadMasAlta, prioridadTop5, prioridadClienteDelCuerpo,
  ajusteDelCuerpo, cambiaPrioridadSinPermiso, MENSAJE_PRIORIDAD_BLOQUEADA, ordenarColaTaller, esDeMisTickets,
} from './prioridad'
import { TRANSITIONS, transitionById } from './transitions'

describe('PRIORIDADES_ASIGNABLES · la lista blanca es la de transitions.ts:84 (RQ-TC-24, D-2)', () => {
  it('es literalmente High, Medium (la lista asignable es de dos niveles)', () => {
    expect([...PRIORIDADES_ASIGNABLES]).toEqual(['High', 'Medium'])
  })
  it('es igual a las opciones del campo target priority de cada transición que lo declara (dos copias vigiladas por prueba)', () => {
    const conCampo = TRANSITIONS.filter((t) => t.fields.some((f) => f.target === 'priority'))
    expect(conCampo.length).toBeGreaterThan(0)
    for (const t of conCampo) {
      const campo = t.fields.find((f) => f.target === 'priority')!
      expect(campo.options, t.id).toEqual([...PRIORIDADES_ASIGNABLES])
    }
  })
})

describe('esPrioridadAsignable · igualdad exacta, sin plegar mayúsculas ni idioma (TC24-7)', () => {
  it.each(['High', 'Medium'])('%s es asignable', (v) => expect(esPrioridadAsignable(v)).toBe(true))
  it.each<unknown>(['Low', 'high', 'Alta', 'Urgent', '', ' High', 7, null, undefined, {}])('%j no lo es (Low ya no es asignable)', (v) => expect(esPrioridadAsignable(v)).toBe(false))
})

describe('prioridadMasAlta · manda la más alta; desconocida pierde; empate gana a (S-3)', () => {
  it.each<[string | null, string | null, string | null]>([
    ['High', 'Medium', 'High'], ['Medium', 'High', 'High'],
    ['Low', 'Medium', 'Medium'], ['Medium', 'Low', 'Medium'],
    ['High', 'Low', 'High'], ['Low', 'High', 'High'],
    ['Urgent', 'High', 'Urgent'], ['High', 'Urgent', 'Urgent'],
    ['High', null, 'High'], [null, 'Low', 'Low'],
    ['Alta', 'Low', 'Low'], ['Low', 'Alta', 'Low'],
    [null, null, null],
  ])('(%j, %j) → %j', (a, b, esperada) => expect(prioridadMasAlta(a, b)).toBe(esperada))
  it('empate: devuelve a (dos desconocidas distintas, la primera)', () => {
    expect(prioridadMasAlta('Alta', 'Baja')).toBe('Alta')
  })
})

describe('prioridadTop5 · lee la fila a prueba de fallos (D-6): lo que no es asignable es null', () => {
  it('sin fila o con top5 falso → null', () => {
    expect(prioridadTop5(null)).toBeNull()
    expect(prioridadTop5({ top5: false, prioridad: 'High' })).toBeNull()
  })
  it('valor sucio en la base → null', () => {
    expect(prioridadTop5({ top5: true, prioridad: 'Alta' })).toBeNull()
    expect(prioridadTop5({ top5: true, prioridad: null })).toBeNull()
  })
  it('un Top 5 guardado con Low no impone (Low ya no es de la lista; falla cerrado)', () => {
    expect(prioridadTop5({ top5: true, prioridad: 'Low' })).toBeNull()
  })
})

describe('prioridadClienteDelCuerpo · valida el PUT (TC27-5, TC27-6, S-9)', () => {
  it('top5 no booleano → error', () => {
    for (const malo of ['true', 1, null, undefined]) {
      const r = prioridadClienteDelCuerpo({ top5: malo, prioridad: 'High' })
      expect(r.ok, String(malo)).toBe(false)
    }
  })
  it('top5 verdadero sin prioridad → error', () => {
    expect(prioridadClienteDelCuerpo({ top5: true }).ok).toBe(false)
  })
  it('top5 verdadero con Low, Urgent o Alta → error (rechaza Low)', () => {
    for (const mala of ['Low', 'Urgent', 'Alta', 'high', '']) expect(prioridadClienteDelCuerpo({ top5: true, prioridad: mala }).ok, mala).toBe(false)
  })
  it('top5 verdadero con valor de la lista → ok', () => {
    expect(prioridadClienteDelCuerpo({ top5: true, prioridad: 'Medium' })).toEqual({ ok: true, top5: true, prioridad: 'Medium' })
  })
  it('top5 falso → prioridad null aunque venga valor (S-9)', () => {
    expect(prioridadClienteDelCuerpo({ top5: false, prioridad: 'High' })).toEqual({ ok: true, top5: false, prioridad: null })
    expect(prioridadClienteDelCuerpo({ top5: false })).toEqual({ ok: true, top5: false, prioridad: null })
  })
  it('cuerpo que no es objeto → error', () => {
    for (const malo of [null, undefined, 'x', 7, []]) expect(prioridadClienteDelCuerpo(malo).ok, JSON.stringify(malo)).toBe(false)
  })
})

/**
 * Obligatorios de las 34 transiciones de `TRANSITIONS`, medidos ANTES de tocar `transitions.ts:84` (tarea 2.1).
 * Pegado como literal a propósito: así «sólo difiere `priority` en esas dos» discrimina de verdad.
 */
const OBLIGATORIOS_ANTES: Record<string, string[]> = {
  habilitar_servicio: ['Orden de Venta', 'Serial'],
  ingreso_a_servicio: ['Código Servicio', 'Fecha creación ticket', 'Fecha Remisión Entrada'],
  escalado_a_revision: ['priority', 'Días de entrega'],
  devolucion_a_correccion: ['priority'],
  llegada_repuestos: ['Fecha Recepción de repuestos'],
  aprobacion_y_repuestos: ['Fecha Orden de Compra', 'Fecha Orden De Venta'],
  solicitud_repuestos: [], aprobacion: [], entrega_repuestos: [],
  notif_por_garantia: ['Fecha Notificación por garantía'],
  notif_cliente_comercial: ['Fecha de Cotización'],
  notif_cliente_sku: ['Fecha de Cotización'],
  rechazo_garantia: [],
  solicitud_sku: ['Fecha solicitud SKU'],
  reporte_por_garantia: ['Fecha Revisión Informe'],
  escalado_a_comercial: ['Días de entrega', 'Fecha Revisión Informe'],
  finalizacion_servicio: ['Fecha Finalización ST'],
  cal_sensores_proceso: ['Fecha Salida Servicio externo'],
  cal_sensores_revision: ['Fecha Salida Servicio externo'],
  retorno_servicio_externo: ['Fecha Entrada de servicio externo', 'Conformidad'],
  rechazo_comercial: [], rechazo_cliente: [], rechazo_revision: [],
  facturado: ['Fecha De Factura'], facturado_cierre: ['Fecha De Factura'], diagnostico_complementario: [],
  liberacion_sin_factura: ['Liberación del ticket sin facturar'],
  entrega_sin_factura: ['Fecha Remisión de Salida'], entrega_al_cliente: ['Fecha Remisión de Salida'],
  habilitado_para_entrega: ['Fecha de aviso al cliente'], notif_recotizacion: [],
}

describe('priority deja de ser obligatorio (RQ-TS-20, S-2)', () => {
  it('TS20-3 · el campo sigue en las dos transiciones, con target priority, opciones High/Medium y no obligatorio', () => {
    for (const id of ['escalado_a_revision', 'devolucion_a_correccion']) {
      const campo = transitionById(id)!.fields.find((f) => f.target === 'priority')
      expect(campo, id).toMatchObject({ key: 'priority', kind: 'select', required: false, options: ['High', 'Medium'] })
    }
  })
  it('TS20-4 · los obligatorios de las 31 son los de antes SALVO priority en esas dos y la liberación sin factura (F1C-05: ya no hay casilla)', () => {
    expect(TRANSITIONS).toHaveLength(31)
    const esperado = Object.fromEntries(Object.entries({ ...OBLIGATORIOS_ANTES, liberacion_sin_factura: ['Motivo de liberación sin factura', 'Fecha prevista de facturación'] }).map(([id, ks]) => [id, ks.filter((k) => k !== 'priority')]))
    const hoy = Object.fromEntries(TRANSITIONS.map((t) => [t.id, t.fields.filter((f) => f.required).map((f) => f.key)]))
    expect(hoy).toEqual(esperado)
  })
})

describe('ajusteDelCuerpo · cuerpo del POST de ajuste (RQ-TC-29, D-9)', () => {
  it('válido: prioridad asignable y motivo recortado', () => {
    expect(ajusteDelCuerpo({ prioridad: 'High', motivo: '  cliente crítico  ' }, 'Low')).toEqual({ ok: true, prioridad: 'High', motivo: 'cliente crítico' })
  })
  it('motivo vacío o de sólo espacios → error', () => {
    for (const m of ['', '   ', undefined, 7]) expect(ajusteDelCuerpo({ prioridad: 'High', motivo: m }, 'Low').ok, String(m)).toBe(false)
  })
  it('Low, Urgent y Alta no son asignables (rechaza Low)', () => {
    for (const p of ['Low', 'Urgent', 'Alta', 'high', undefined]) expect(ajusteDelCuerpo({ prioridad: p, motivo: 'x' }, 'Low').ok, String(p)).toBe(false)
  })
  it('igual a la actual → error (D-9)', () => {
    expect(ajusteDelCuerpo({ prioridad: 'High', motivo: 'x' }, 'High').ok).toBe(false)
  })
  it('motivo Y prioridad malos a la vez → DOS errores en errors[]', () => {
    const r = ajusteDelCuerpo({ prioridad: 'Urgent', motivo: ' ' }, 'Low')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors).toHaveLength(2)
  })
  it('cuerpo que no es objeto → error', () => {
    for (const malo of [null, undefined, 'x', 7, []]) expect(ajusteDelCuerpo(malo, null).ok, JSON.stringify(malo)).toBe(false)
  })
})

describe('cambiaPrioridadSinPermiso · la guarda del técnico (RQ-TS-21)', () => {
  const ESCALADO = transitionById('escalado_a_revision')!
  const SIN_CAMPO = transitionById('ingreso_a_servicio')!
  const TEC = { areas: ['Servicio Técnico'], isAdmin: false }
  it('el mensaje nombra al Director Comercial', () => expect(MENSAJE_PRIORIDAD_BLOQUEADA).toContain('Director Comercial'))
  it('D-8 · transición sin campo priority → false aunque venga valor (TS21-10)', () => {
    expect(cambiaPrioridadSinPermiso(SIN_CAMPO, { priority: 'High' }, 'Low', TEC)).toBe(false)
  })
  it('ausente, vacía o igual a la actual → false', () => {
    expect(cambiaPrioridadSinPermiso(ESCALADO, {}, 'Low', TEC)).toBe(false)
    expect(cambiaPrioridadSinPermiso(ESCALADO, { priority: '' }, 'Low', TEC)).toBe(false)
    expect(cambiaPrioridadSinPermiso(ESCALADO, { priority: 'Low' }, 'Low', TEC)).toBe(false)
    expect(cambiaPrioridadSinPermiso(ESCALADO, undefined, 'Low', TEC)).toBe(false)
  })
  it('distinta y sin permiso → true; actual null + Medium → true (TS21-5)', () => {
    expect(cambiaPrioridadSinPermiso(ESCALADO, { priority: 'High' }, 'Low', TEC)).toBe(true)
    expect(cambiaPrioridadSinPermiso(ESCALADO, { priority: 'Medium' }, null, TEC)).toBe(true)
  })
  it('admin → false; Comercial + Servicio Técnico + Director Comercial → false; sin Comercial → true', () => {
    expect(cambiaPrioridadSinPermiso(ESCALADO, { priority: 'High' }, 'Low', { areas: [], isAdmin: true })).toBe(false)
    expect(cambiaPrioridadSinPermiso(ESCALADO, { priority: 'High' }, 'Low', { areas: ['Servicio Técnico', 'Comercial'], isAdmin: false, cargoPermiso: 'Director Comercial' })).toBe(false)
    expect(cambiaPrioridadSinPermiso(ESCALADO, { priority: 'High' }, 'Low', { areas: ['Servicio Técnico'], isAdmin: false, cargoPermiso: 'Director Comercial' })).toBe(true)
  })
})

describe('ordenarColaTaller · la cola del taller (RQ-VT-09, E-099)', () => {
  const t = (id: string, priority: string | null, habilitadoAt?: string | null, createdAt?: string | null) => ({ id, priority, habilitadoAt, createdAt })
  const ids = (xs: Array<{ id: string }>) => xs.map((x) => x.id)

  it('VT09-1 · las cinco prioridades en orden: Urgent, High, Medium, Low, null', () => {
    const r = ordenarColaTaller([t('low', 'Low'), t('nul', null), t('urg', 'Urgent'), t('med', 'Medium'), t('hig', 'High')])
    expect(ids(r)).toEqual(['urg', 'hig', 'med', 'low', 'nul'])
  })
  it('VT09-2 · en la misma prioridad manda la habilitación ascendente aunque createdAt diga lo contrario', () => {
    const r = ordenarColaTaller([
      t('viejoCreadoPeroHabilitadoDespues', 'High', '2026-09-20T10:00:00Z', '2026-08-01T00:00:00Z'),
      t('nuevoCreadoPeroHabilitadoAntes', 'High', '2026-09-01T10:00:00Z', '2026-09-30T00:00:00Z'),
    ])
    expect(ids(r)).toEqual(['nuevoCreadoPeroHabilitadoAntes', 'viejoCreadoPeroHabilitadoDespues'])
  })
  it('VT09-4 · sin habilitadoAt cuenta createdAt (S-10b)', () => {
    const r = ordenarColaTaller([t('b', 'Medium', null, '2026-09-10T00:00:00Z'), t('a', 'Medium', null, '2026-09-01T00:00:00Z')])
    expect(ids(r)).toEqual(['a', 'b'])
  })
  it('sin ninguna de las dos fechas, al final de su rango y antes del rango siguiente', () => {
    const r = ordenarColaTaller([t('sinFecha', 'High'), t('baja', 'Low', '2026-01-01T00:00:00Z'), t('conFecha', 'High', '2026-09-01T00:00:00Z'), t('basura', 'High', 'no es fecha')])
    expect(ids(r)).toEqual(['conFecha', 'sinFecha', 'basura', 'baja'])
  })
  it('VT09-5 · Low habilitado antes que High: High va delante (la urgencia manda)', () => {
    const r = ordenarColaTaller([t('low', 'Low', '2026-01-01T00:00:00Z'), t('high', 'High', '2026-09-01T00:00:00Z')])
    expect(ids(r)).toEqual(['high', 'low'])
  })
  it('VT09-6 · «Alta», vacío y null van al final', () => {
    const r = ordenarColaTaller([t('alta', 'Alta'), t('vacia', ''), t('nul', null), t('low', 'Low')])
    expect(ids(r)).toEqual(['low', 'alta', 'vacia', 'nul'])
  })
  it('estable con instantes iguales y no muta la entrada', () => {
    const entrada = [t('x', 'High', '2026-09-01T00:00:00Z'), t('y', 'High', '2026-09-01T00:00:00Z'), t('z', 'Urgent')]
    const copia = [...entrada]
    const r = ordenarColaTaller(entrada)
    expect(ids(r)).toEqual(['z', 'x', 'y'])
    expect(entrada).toEqual(copia)
    expect(r).not.toBe(entrada)
  })
})

describe('esDeMisTickets · el predicado de «Mis tickets» (RQ-VT-09)', () => {
  const yo = { id: 'u1' }
  it('abierto derivado al usuario → true', () => { expect(esDeMisTickets({ statusType: 'Open', derivado: yo }, 'u1')).toBe(true) })
  it('cerrado → false', () => { expect(esDeMisTickets({ statusType: 'Closed', derivado: yo }, 'u1')).toBe(false) })
  it('derivado a otro → false', () => { expect(esDeMisTickets({ statusType: 'Open', derivado: { id: 'u2' } }, 'u1')).toBe(false) })
  it('derivado null o ausente → false', () => {
    expect(esDeMisTickets({ statusType: 'Open', derivado: null }, 'u1')).toBe(false)
    expect(esDeMisTickets({ statusType: 'Open' }, 'u1')).toBe(false)
  })
})
