import { describe, it, expect } from 'vitest'
import { TRANSITIONS, TRANSITIONS_EQUIPO_NUEVO, transitionById } from './transitions'
import {
  INDICADORES_G6, camposFechaReentrantes, camposFechaReentrantesObligatorios,
  componenteQueContiene, tablaDeReentrancia,
} from './reentrancia'

/**
 * LA TABLA DE REENTRANCIA (§3 del proposal F0-04) — el entregable nuevo de la tanda.
 *
 * Es la entrada de F1C-02, F1C-06, C9 y la spec `kpis`. Tres columnas: ciclos del grafo × campos de
 * fecha escritos dentro × indicadores de G.6 que los consumen.
 *
 * Lo que la hace valer es que NO está escrita a mano: los componentes salen de Tarjan sobre
 * `TRANSITIONS` y los campos de las declaraciones de cada etapa. Un ciclo nuevo introducido por
 * cualquier catálogo del registro de flujos —F1B-06 añadió el primero aparte de `TRANSITIONS`—
 * aparece aquí en rojo el día que se añade, no el día que alguien recalcula la tabla.
 *
 * ⚠️ F0-04 NO DISEÑA LA SOLUCIÓN. Esta tanda produce el dato; el diseño es F1C-02 desde M1.3.5 y
 * P34. Lo que aquí da verde son defectos DOCUMENTADOS, no defectos arreglados.
 */
describe('tabla de reentrancia', () => {
  /**
   * El guardia de `TRANSITIONS` —cualquier catálogo del registro tiene el suyo—: tres ciclos, ni uno
   * más. Un cuarto componente fuertemente conexo es un ciclo nuevo que nadie ha visto.
   */
  it('el grafo tiene exactamente tres ciclos, y son estos', () => {
    expect(tablaDeReentrancia().map((c) => c.estados)).toEqual([
      // C2 — diagnóstico / cotización / repuestos / servicio externo. Nueve estados.
      [
        'En Espera de Repuestos', 'En Proceso', 'Notificación cliente', 'Solicitado', 'Pendiente',
        'Notificación Comercial', 'En espera de SKU inventario', 'Servicio externo',
        'Continuación del proceso',
      ],
      // C3 — devolución a corrección.
      ['Rev./Diagnostico', 'Notificado'],
      // C1 — ciclo de facturación.
      ['Por Facturar', 'Por Entregar / Sin facturar'],
    ])
  })

  /** C1 — ciclo de facturación: `Por Facturar` ⇄ `Por Entregar / Sin facturar`. Una reentrante. */
  it('C1 · ciclo de facturación: una sola transición reentrante con fecha', () => {
    const c1 = componenteQueContiene('Por Facturar')!
    expect(c1.estados).toEqual(['Por Facturar', 'Por Entregar / Sin facturar'])
    expect(c1.transiciones).toEqual([
      { id: 'entrega_sin_factura', from: 'Por Entregar / Sin facturar', to: 'Por Facturar', campos: ['Fecha Remisión de Salida'] },
    ])
    // La otra rama del ciclo —`liberacion_sin_factura`— no escribe fecha: su único campo propio es
    // el checkbox de liberación. Por eso el ciclo tiene dos transiciones y una sola reentrante.
    expect(transitionById('liberacion_sin_factura')!.fields.some((f) => f.kind === 'date')).toBe(false)
  })

  /** C2 — el grande: nueve estados y OCHO transiciones reentrantes con fecha. */
  it('C2 · diagnóstico / cotización / repuestos / servicio externo: ocho reentrantes con fecha', () => {
    const c2 = componenteQueContiene('En Proceso')!
    expect(c2.estados).toHaveLength(9)
    expect(c2.transiciones).toEqual([
      { id: 'llegada_repuestos', from: 'En Espera de Repuestos', to: 'En Proceso', campos: ['Fecha Recepción de repuestos'] },
      { id: 'aprobacion_y_repuestos', from: 'Notificación cliente', to: 'En Espera de Repuestos', campos: ['Fecha Orden de Compra', 'Fecha Orden De Venta'] },
      { id: 'aprobacion', from: 'Notificación cliente', to: 'En Proceso', campos: ['Fecha Orden de Compra Final', 'Fecha Orden de Venta Final'] },
      { id: 'notif_cliente_comercial', from: 'Notificación Comercial', to: 'Notificación cliente', campos: ['Fecha de Cotización'] },
      { id: 'notif_cliente_sku', from: 'En espera de SKU inventario', to: 'Notificación cliente', campos: ['Fecha de Cotización'] },
      { id: 'solicitud_sku', from: 'Notificación Comercial', to: 'En espera de SKU inventario', campos: ['Fecha solicitud SKU'] },
      { id: 'cal_sensores_proceso', from: 'En Proceso', to: 'Servicio externo', campos: ['Fecha Salida Servicio externo'] },
      { id: 'retorno_servicio_externo', from: 'Servicio externo', to: 'En Proceso', campos: ['Fecha Entrada de servicio externo'] },
    ])
  })

  /**
   * C3 — devolución a corrección: `Notificado` ⇄ `Rev./Diagnostico`. CERO campos de fecha.
   *
   * Es el ciclo que se puede recorrer las veces que haga falta sin perder nada, y va en la tabla
   * precisamente por eso: sin él, «hay ciclos» y «los ciclos pisan datos» se leerían como la misma
   * frase. Un ciclo sólo es un problema cuando escribe.
   */
  it('C3 · devolución a corrección: ciclo sin ningún campo de fecha, y por eso inofensivo', () => {
    const c3 = componenteQueContiene('Notificado')!
    expect(c3.estados).toEqual(['Rev./Diagnostico', 'Notificado'])
    expect(c3.transiciones).toEqual([])
  })

  it('nueve casos en total: 1 de C1 + 8 de C2 + 0 de C3', () => {
    expect(tablaDeReentrancia().flatMap((c) => c.transiciones)).toHaveLength(9)
  })

  /**
   * Diez campos, OCHO obligatorios. `cfDate` es `required = true` por omisión
   * (`transitions.ts:75-76`), y en un campo obligatorio la segunda pasada por el ciclo no *puede*
   * dejar el valor anterior: pisa siempre. Los dos opcionales son los de `aprobacion`.
   */
  it('diez campos de fecha reentrantes, de los que ocho son obligatorios', () => {
    expect(camposFechaReentrantes()).toHaveLength(10)
    const obligatorios = camposFechaReentrantesObligatorios()
    expect(obligatorios).toHaveLength(8)
    expect(camposFechaReentrantes().filter((c) => !obligatorios.includes(c))).toEqual([
      'Fecha Orden de Compra Final',
      'Fecha Orden de Venta Final',
    ])
  })

  /**
   * EL PEOR CASO, y no era ninguno de los conocidos.
   *
   * `notif_cliente_comercial` y `notif_cliente_sku` escriben AMBOS «Fecha de Cotización» y AMBOS
   * aterrizan en `Notificación cliente`. Una recotización —volver a pasar por cualquiera de las dos—
   * borra la fecha de la primera cotización, y la columna 57 de G.6 mide desde ahí.
   */
  it('documenta el peor caso: dos etapas escriben «Fecha de Cotización» y las dos aterrizan en Notificación cliente', () => {
    const escriben = TRANSITIONS.filter((t) => t.fields.some((f) => f.kind === 'date' && f.label === 'Fecha de Cotización'))
    expect(escriben.map((t) => t.id)).toEqual(['notif_cliente_comercial', 'notif_cliente_sku'])
    expect(new Set(escriben.map((t) => t.to))).toEqual(new Set(['Notificación cliente']))
    for (const t of escriben) {
      expect(t.fields.find((f) => f.label === 'Fecha de Cotización')!.required, `${t.id} dejó de exigirla`).toBe(true)
    }
  })

  /**
   * §3.3 — un defecto que NO es sobreescritura: se escribe en la columna equivocada.
   *
   * La columna 58 de G.6 es el bodegaje de proceso (M1.10) y se calcula sobre `fecha_orden_compra`.
   * La rama sin repuestos —`aprobacion`— escribe «Fecha Orden de Compra **Final**» y deja la 42
   * vacía: el bodegaje de proceso no es calculable para NINGÚN ticket aprobado sin repuestos. No se
   * pisa el valor; nunca llega a escribirse.
   *
   * F0-04 lo documenta. Arreglarlo es F1C-02.
   */
  it('documenta el defecto de la columna 58: la rama sin repuestos escribe «Final» y deja vacía la 42', () => {
    const aprobacion = transitionById('aprobacion')!
    const conRepuestos = transitionById('aprobacion_y_repuestos')!
    expect(aprobacion.fields.filter((f) => f.kind === 'date').map((f) => f.label)).toEqual([
      'Fecha Orden de Compra Final', 'Fecha Orden de Venta Final',
    ])
    expect(conRepuestos.fields.filter((f) => f.kind === 'date').map((f) => f.label)).toEqual([
      'Fecha Orden de Compra', 'Fecha Orden De Venta',
    ])
    // Y encima las dos de `aprobacion` son opcionales, así que la rama sin repuestos puede además no
    // escribir nada en absoluto.
    expect(aprobacion.fields.filter((f) => f.kind === 'date').every((f) => !f.required)).toBe(true)
  })
})

/**
 * EL CRUCE CON G.6 — la tercera columna de la tabla.
 *
 * Qué indicadores del informe de Gerencia consumen campos que un ciclo vuelve a escribir, y cuáles
 * de esos indicadores tienen dueño. G.8 limita C4 a una fila y C9 a tres columnas: los cuatro que
 * quedan fuera son el hallazgo de esta tanda.
 */
describe('cruce de la reentrancia con los indicadores de G.6', () => {
  /**
   * La lista de indicadores es dato externo —viene de G.6, no del grafo—, así que lo que se
   * comprueba por código es lo único comprobable: que cada campo que nombra SIGUE siendo un campo
   * reentrante. El día que F1C-02 saque uno del ciclo, esta prueba avisa de que la fila sobra en vez
   * de dejarla envejeciendo como cierta.
   */
  it('todos los campos que nombra G.6 son campos reentrantes de verdad', () => {
    const reentrantes = new Set(camposFechaReentrantes())
    for (const i of INDICADORES_G6) {
      for (const campo of i.campos) {
        expect(reentrantes.has(campo), `col. ${i.columnas.join('·')} nombra «${campo}», que ya no es reentrante`).toBe(true)
      }
    }
  })

  it('cinco indicadores afectados, y CUATRO sin dueño', () => {
    const columnas = INDICADORES_G6.flatMap((i) => i.columnas)
    expect(columnas).toEqual([47, 50, 53, 57, 58])
    const sinDuenio = INDICADORES_G6.filter((i) => i.alcance === null).flatMap((i) => i.columnas)
    expect(sinDuenio).toEqual([50, 53, 57, 58])
  })

  it('el único con dueño es la columna 47, y su dueño es C4', () => {
    const conDuenio = INDICADORES_G6.filter((i) => i.alcance !== null)
    expect(conDuenio).toEqual([
      { columnas: [47], nombre: 'Tiempo permanencia', campos: ['Fecha Remisión de Salida'], alcance: 'C4' },
    ])
  })
})

/**
 * F1B-06 · EL CATÁLOGO `TRANSITIONS_EQUIPO_NUEVO` TIENE SU PROPIO CICLO.
 *
 * `tablaDeReentrancia`/`camposFechaReentrantes` ya son genéricas sobre `Transition[]` (aceptan un
 * catálogo inyectado); esto no exige ningún cambio de producción, sólo la aserción sobre el catálogo
 * nuevo. `ingreso_equipo_nuevo → producto_no_conforme → analisis_y_acciones` cierra el ciclo
 * `Ingresado → En Proceso → Notificado → Ingresado`, y ninguna de las tres escribe fecha —el único
 * campo de las cinco es el comentario—, así que el ciclo es CERO campos reentrantes.
 */
describe('reentrancia del catálogo equipo-nuevo (F1B-06)', () => {
  it('el catálogo EN tiene exactamente un ciclo: Ingresado, En Proceso, Notificado', () => {
    expect(tablaDeReentrancia(TRANSITIONS_EQUIPO_NUEVO).map((c) => c.estados)).toEqual([
      ['Ingresado', 'En Proceso', 'Notificado'],
    ])
  })

  it('el ciclo EN no tiene ningún campo de fecha reentrante', () => {
    expect(camposFechaReentrantes(TRANSITIONS_EQUIPO_NUEVO)).toEqual([])
  })
})
