import { describe, it, expect } from 'vitest'
import {
  BODEGAJES, CAMPO_AVISO_CLIENTE, HITO_INDICADORES_ROTOS,
  periodosDeBodegaje, diasDeBodegaje, marcaIngresoAServicio,
  type PasoDelHistorial,
} from './bodegaje'
import { TRANSITIONS, transitionById } from './transitions'
import { camposFechaReentrantes } from './reentrancia'

/**
 * LOS TRES BODEGAJES — corrección C9, punto abierto nº 41.
 *
 * Fuente: `R08.1.md:1685-1705`, «Los tres bodegajes [DEFINIDO — R08]». No es una interpretación: la
 * R08 los da en tabla, con el hecho que abre cada periodo, el que lo cierra y la resta que lo
 * calcula (`:1691-1702`).
 *
 * ⚠️ EL PLAN CITA EL HITO EQUIVOCADO PARA UNO DE LOS TRES. `plan:141` manda recalcular el bodegaje
 * de entrada «contra la marca de tiempo de `Ingreso a Servicio`». Eso es la prescripción de la R05
 * (`:1684`), y la R08 la SUSTITUYÓ: el bodegaje de entrada se calcula con
 * `Fecha Orden De Venta − Fecha Remisión Entrada` (`:1694`), que son dos VALORES de campo, no la
 * marca de tiempo de ninguna transición. Anclarlo en el instante del clic mediría cuándo alguien
 * pulsó el botón, no cuándo llegó el equipo, que es lo que `:1692` dice que abre el periodo.
 *
 * La marca de `Ingreso a Servicio` SÍ es el hito correcto de los otros dos indicadores rotos —48
 * tiempo de inicio de servicio y 49 tiempo de diagnóstico (`:2330`)—, y por eso este módulo la
 * expone aparte. Son dos averías distintas con dos arreglos distintos, y `plan:141` las mete en la
 * misma frase.
 */
describe('C9 · los tres bodegajes de M1.10', () => {
  /** Un paso del historial: `ticket_transitions` tal como la escribe `repo.ts:282-286`. */
  const paso = (transitionId: string, performedAt: string, values: Record<string, unknown> = {}): PasoDelHistorial =>
    ({ transitionId, performedAt, values })

  /**
   * 1 · LA TABLA DE M1.10, COMO DATO.
   *
   * Va declarada y no derivada por la misma razón que `SLA_HORAS_POR_ESTADO` (`sla.ts:32`) y
   * `ESTADOS_SIN_SALIDA` (`estados.ts:140`): de las 34 transiciones no se deduce que la espera del
   * cliente empiece en la remisión de entrada y no en la fecha de creación. Es una decisión de
   * negocio, y la R08 es quien la firma.
   */
  it('1 · son tres, con los pares de campos que declara el maestro', () => {
    expect(BODEGAJES.map((b) => [b.clase, b.abre, b.cierra])).toEqual([
      ['entrada', 'Fecha Remisión Entrada', 'Fecha Orden De Venta'],
      ['proceso', 'Fecha de Cotización', 'Fecha Orden de Compra'],
      ['salida', CAMPO_AVISO_CLIENTE, 'Fecha Remisión de Salida'],
    ])
  })

  /**
   * 2 · LOS SEIS OPERANDOS EXISTEN COMO CAMPOS DECLARADOS.
   *
   * Sin esta prueba la tabla de arriba es una lista de cadenas que no casa con nada: un cambio de
   * etiqueta en `transitions.ts` dejaría el bodegaje calculando siempre `null` y en silencio, que es
   * exactamente la avería de la columna 42 que `reentrancia.test.ts:118-140` documenta.
   */
  it('2 · los seis operandos son campos de fecha declarados en alguna transición', () => {
    const etiquetas = new Set(
      TRANSITIONS.flatMap((t) => t.fields.filter((f) => f.kind === 'date').map((f) => f.label)),
    )
    for (const b of BODEGAJES) {
      expect(etiquetas.has(b.abre), `«${b.abre}» (abre ${b.clase}) no lo escribe ninguna transición`).toBe(true)
      expect(etiquetas.has(b.cierra), `«${b.cierra}» (cierra ${b.clase}) no lo escribe ninguna transición`).toBe(true)
    }
  })

  /**
   * 3 · EL CAMPO QUE FALTABA, EN LA TRANSICIÓN QUE MANDA EL MAESTRO.
   *
   * `:1704` — «No hay ninguna columna que registre cuándo se avisó al cliente de que el equipo estaba
   * listo […] Hay que añadir el campo, y lo natural es que lo escriba la propia transición que
   * habilita la entrega.» Esa transición es `habilitado_para_entrega` (`transitions.ts:252`), que
   * hasta esta tanda sólo llevaba comentario.
   */
  it('3 · «Fecha de aviso al cliente» la escribe «Habilitado para entrega»', () => {
    const t = transitionById('habilitado_para_entrega')!
    const campo = t.fields.find((f) => f.label === CAMPO_AVISO_CLIENTE)
    expect(campo, 'la transición que habilita la entrega no escribe el campo de aviso').toBeDefined()
    expect(campo!.kind).toBe('date')
    expect(t.to).toBe('Por Entregar')
  })

  /**
   * 4 · MUTACIÓN M5 — el campo es OBLIGATORIO, y eso no cambia ningún resultado: cambia quién paga.
   *
   * Opcional, el bodegaje de salida sale idéntico siempre que alguien rellene la fecha. Lo que cambia
   * es que puede no rellenarla, y entonces el periodo no es que valga cero: es INCALCULABLE, para ese
   * ticket y para siempre, porque nadie vuelve a pasar por esa etapa.
   *
   * Es exactamente la avería de la columna 42 —`reentrancia.test.ts:118-140`: la rama sin repuestos
   * escribe «Final», deja la 42 vacía, y el bodegaje de proceso deja de ser calculable para NINGÚN
   * ticket de esa rama—. Aquí el coste recae en Comercial, que no puede habilitar la entrega sin
   * decir cuándo avisó. Ése es el precio, y va declarado.
   */
  it('4 · y es obligatorio: un aviso opcional vuelve incalculable el bodegaje de salida', () => {
    const campo = transitionById('habilitado_para_entrega')!.fields.find((f) => f.label === CAMPO_AVISO_CLIENTE)!
    expect(campo.required, 'opcional, el bodegaje de salida repite la avería de la columna 42').toBe(true)
  })

  /**
   * 5 · EL INVARIANTE 6 NO SE MUEVE, y hay que demostrarlo, no suponerlo.
   *
   * `habilitado_para_entrega` va de `Liberación Comercial` a `Por Entregar`, y ninguno de los dos
   * está en los tres ciclos del grafo (`reentrancia.ts:189`). Por eso el campo nuevo NO entra en los
   * diez reentrantes del invariante 6 y `invariantesGrafo.test.ts:137-149` sigue verde sin tocarlo.
   *
   * Se afirma aquí porque el que añade un campo de fecha es esta tanda: si mañana alguien mueve esa
   * transición dentro de un ciclo, el rojo tiene que salir junto al campo, no a tres ficheros de
   * distancia.
   */
  it('5 · el campo nuevo no entra en los diez reentrantes: su transición no está en ningún ciclo', () => {
    expect(camposFechaReentrantes()).not.toContain(CAMPO_AVISO_CLIENTE)
    expect(camposFechaReentrantes()).toHaveLength(10)
  })

  /**
   * 6 · SE CALCULA SOBRE EL HISTORIAL, NUNCA SOBRE LAS COLUMNAS DE `tickets`.
   *
   * No es una preferencia de estilo: es la regla que F0-04 dejó escrita en `reentrancia.ts:24`, y
   * este módulo es el primero que tiene que obedecerla. CUATRO de los cinco operandos que ya existían
   * son reentrantes —`Fecha Orden De Venta`, `Fecha Orden de Compra`, `Fecha de Cotización` y
   * `Fecha Remisión de Salida`—, así que `tickets.*` guarda sólo la ÚLTIMA pasada.
   *
   * El caso: dos cotizaciones y dos órdenes de compra. Por columna sale UN bodegaje, el de la segunda
   * vuelta. Por historial salen DOS, que es lo que el equipo esperó de verdad.
   */
  it('6 · una segunda vuelta por el ciclo da DOS bodegajes de proceso, no uno', () => {
    const historial = [
      paso('notif_cliente_comercial', '2026-03-01T10:00:00Z', { 'Fecha de Cotización': '2026-03-01' }),
      paso('aprobacion_y_repuestos', '2026-03-06T10:00:00Z', { 'Fecha Orden de Compra': '2026-03-06' }),
      paso('notif_cliente_comercial', '2026-04-01T10:00:00Z', { 'Fecha de Cotización': '2026-04-01' }),
      paso('aprobacion_y_repuestos', '2026-04-11T10:00:00Z', { 'Fecha Orden de Compra': '2026-04-11' }),
    ]
    expect(periodosDeBodegaje(historial).filter((p) => p.clase === 'proceso')).toEqual([
      { clase: 'proceso', desde: '2026-03-01', hasta: '2026-03-06', dias: 5 },
      { clase: 'proceso', desde: '2026-04-01', hasta: '2026-04-11', dias: 10 },
    ])
    expect(diasDeBodegaje(historial, 'proceso'), 'la suma es lo que C7 tiene que descontar del reloj').toBe(15)
  })

  /**
   * 7 · EL CASO QUE ROMPIÓ EL INDICADOR EN 2026, y que ahora tiene respuesta.
   *
   * Comercial crea el ticket por anticipado con su orden de venta (decisión del 20/08, `:1682`), así
   * que la OV YA EXISTE cuando el equipo llega. El hecho que cierra el periodo ocurrió antes de que
   * el periodo se abriera: la espera es de CERO días, no negativa y tampoco inexistente.
   *
   * La diferencia importa y no es cosmética: devolver «nada» sacaría estos tickets del promedio y lo
   * dejaría midiendo sólo a los que sí esperaron. Cero días es un dato; ausencia es un sesgo.
   */
  it('7 · si la OV llega antes que el equipo, el bodegaje de entrada es cero, no negativo', () => {
    const historial = [
      paso('habilitar_servicio', '2026-02-01T10:00:00Z', { 'Fecha Orden De Venta': '2026-02-01' }),
      paso('ingreso_a_servicio', '2026-02-20T10:00:00Z', { 'Fecha Remisión Entrada': '2026-02-20' }),
    ]
    expect(periodosDeBodegaje(historial)).toEqual([
      { clase: 'entrada', desde: '2026-02-20', hasta: '2026-02-01', dias: 0 },
    ])
  })

  /**
   * 8 · EL ORDEN NORMAL: el equipo llega y la OV se genera después.
   *
   * `:1103` — «Si la OV llega después de la recepción, la fecha de la OV es precisamente el hito que
   * cierra el bodegaje de entrada.»
   */
  it('8 · el equipo llega primero y la OV después: el periodo es la espera real', () => {
    const historial = [
      paso('ingreso_a_servicio', '2026-02-01T10:00:00Z', { 'Fecha Remisión Entrada': '2026-02-01' }),
      paso('aprobacion_y_repuestos', '2026-02-09T10:00:00Z', { 'Fecha Orden De Venta': '2026-02-09' }),
    ]
    expect(periodosDeBodegaje(historial)).toEqual([
      { clase: 'entrada', desde: '2026-02-01', hasta: '2026-02-09', dias: 8 },
    ])
  })

  /**
   * 9 · UN PERIODO ABIERTO NO SE INVENTA UN CIERRE.
   *
   * El equipo llegó y todavía no hay orden de venta: el bodegaje está corriendo. Cerrarlo con «hoy»
   * convertiría un dato en una estimación que cambia cada vez que se consulta, y este módulo es puro
   * a propósito —igual que `sla.ts`, que recibe el instante y no lo lee del reloj—.
   */
  it('9 · sin fecha de cierre no hay periodo: el bodegaje sigue corriendo', () => {
    const historial = [paso('ingreso_a_servicio', '2026-02-01T10:00:00Z', { 'Fecha Remisión Entrada': '2026-02-01' })]
    expect(periodosDeBodegaje(historial)).toEqual([])
    expect(diasDeBodegaje(historial)).toBe(0)
  })

  /**
   * 10 · RECOTIZAR NO REABRE EL PERIODO.
   *
   * `notif_recotizacion` (`transitions.ts:254`) devuelve el ticket a `Notificación Comercial` y de
   * ahí sale otra `Fecha de Cotización`. Si eso abriera un periodo nuevo, el tiempo entre la primera
   * cotización y la segunda desaparecería del cómputo — y el equipo lo pasó en Ambientalia igual.
   *
   * La regla, escrita para que no se descubra tropezando: **el periodo lo abre la PRIMERA fecha, y
   * sólo un cierre lo vuelve a dejar libre.**
   */
  it('10 · dos cotizaciones seguidas sin orden de compra cuentan desde la primera', () => {
    const historial = [
      paso('notif_cliente_comercial', '2026-03-01T10:00:00Z', { 'Fecha de Cotización': '2026-03-01' }),
      paso('notif_cliente_comercial', '2026-03-15T10:00:00Z', { 'Fecha de Cotización': '2026-03-15' }),
      paso('aprobacion_y_repuestos', '2026-03-21T10:00:00Z', { 'Fecha Orden de Compra': '2026-03-21' }),
    ]
    expect(periodosDeBodegaje(historial).filter((p) => p.clase === 'proceso')).toEqual([
      { clase: 'proceso', desde: '2026-03-01', hasta: '2026-03-21', dias: 20 },
    ])
  })

  /**
   * 11 · EL HISTORIAL SE ORDENA POR `performed_at`, no por el orden en que venga la lista.
   *
   * `repo.ts` la lee con un `ORDER BY` que nadie garantiza aquí, y el módulo es puro: si el orden
   * viniera al revés, la pasada del ciclo se emparejaría con el cierre equivocado y el número saldría
   * plausible. Un fallo plausible es peor que uno ruidoso.
   */
  it('11 · ordena por la marca de tiempo aunque la lista llegue desordenada', () => {
    const desordenado = [
      paso('aprobacion_y_repuestos', '2026-02-09T10:00:00Z', { 'Fecha Orden De Venta': '2026-02-09' }),
      paso('ingreso_a_servicio', '2026-02-01T10:00:00Z', { 'Fecha Remisión Entrada': '2026-02-01' }),
    ]
    expect(periodosDeBodegaje(desordenado)).toEqual([
      { clase: 'entrada', desde: '2026-02-01', hasta: '2026-02-09', dias: 8 },
    ])
  })

  /**
   * 12 · EL BODEGAJE DE SALIDA, ENTERO, con el campo que esta tanda añade.
   *
   * `:1700-1702` — empieza cuando se avisa al cliente de que puede recoger, termina cuando lo recoge,
   * y se calcula `Fecha Remisión de Salida − fecha de aviso al cliente`.
   */
  it('12 · el bodegaje de salida se mide entre el aviso y la recogida', () => {
    const historial = [
      paso('habilitado_para_entrega', '2026-05-02T10:00:00Z', { [CAMPO_AVISO_CLIENTE]: '2026-05-02' }),
      paso('entrega_al_cliente', '2026-05-14T10:00:00Z', { 'Fecha Remisión de Salida': '2026-05-14' }),
    ]
    expect(periodosDeBodegaje(historial)).toEqual([
      { clase: 'salida', desde: '2026-05-02', hasta: '2026-05-14', dias: 12 },
    ])
  })

  /**
   * 13 · UNA FECHA ILEGIBLE NO PRODUCE UN NÚMERO.
   *
   * `values` es `jsonb` y nadie garantiza su forma: lo que no parsea se ignora, y el periodo se queda
   * sin abrir. Devolver `NaN` días o tratar la basura como el epoch daría un bodegaje enorme y
   * silencioso.
   */
  it('13 · una fecha ilegible se ignora, no envenena el cómputo', () => {
    const historial = [
      paso('ingreso_a_servicio', '2026-02-01T10:00:00Z', { 'Fecha Remisión Entrada': 'sin fecha' }),
      paso('aprobacion_y_repuestos', '2026-02-09T10:00:00Z', { 'Fecha Orden De Venta': '2026-02-09' }),
    ]
    expect(periodosDeBodegaje(historial)).toEqual([])
  })

  /**
   * 13b · UNA FECHA DE CIERRE RETROACTIVA TAMPOCO DA UN NÚMERO NEGATIVO.
   *
   * ⚠️ ESTA PRUEBA LA TRAJO UNA MUTACIÓN QUE SOBREVIVIÓ, y merece quedar escrito porque el hueco no
   * se veía: la nº 7 comprueba el cero del cierre anticipado, pero ese camino devuelve `0` literal y
   * NO pasa por `diasEntre`. El suelo de esa función se quedaba sin ejercitar, así que quitarlo no
   * ponía nada en rojo.
   *
   * Y sí es alcanzable, que es lo que lo convierte en hueco y no en código muerto: el orden del
   * HISTORIAL no es el orden de las FECHAS. Los dos operandos se teclean en un formulario, así que
   * una orden de venta registrada tarde con fecha retroactiva cierra un periodo abierto después con
   * una fecha anterior. Sin suelo, ese ticket restaría 25 días del bodegaje de otro en cualquier
   * promedio o suma.
   */
  it('13b · un cierre con fecha anterior a la apertura da cero, no un negativo', () => {
    const historial = [
      paso('ingreso_a_servicio', '2026-03-01T10:00:00Z', { 'Fecha Remisión Entrada': '2026-03-01' }),
      paso('aprobacion_y_repuestos', '2026-03-20T10:00:00Z', { 'Fecha Orden De Venta': '2026-02-04' }),
    ]
    expect(periodosDeBodegaje(historial)).toEqual([
      { clase: 'entrada', desde: '2026-03-01', hasta: '2026-02-04', dias: 0 },
    ])
    expect(diasDeBodegaje(historial), 'un negativo aquí resta del bodegaje de los demás').toBe(0)
  })

  /**
   * 14 · LOS TRES A LA VEZ, que es como llega un ticket real.
   *
   * `diasDeBodegaje` sin clase suma los tres: es el total de tiempo ajeno, y es exactamente lo que
   * C7 tiene que descontar del reloj del SLA (`:1706` — «Conviene construir C7 y C9 juntas, porque
   * son la misma idea vista desde dos sitios»).
   */
  it('14 · un ticket con los tres periodos suma el tiempo que no es de Ambientalia', () => {
    const historial = [
      paso('ingreso_a_servicio', '2026-02-01T10:00:00Z', { 'Fecha Remisión Entrada': '2026-02-01' }),
      paso('aprobacion_y_repuestos', '2026-02-09T10:00:00Z', { 'Fecha Orden De Venta': '2026-02-09' }),
      paso('notif_cliente_comercial', '2026-03-01T10:00:00Z', { 'Fecha de Cotización': '2026-03-01' }),
      paso('aprobacion_y_repuestos', '2026-03-06T10:00:00Z', { 'Fecha Orden de Compra': '2026-03-06' }),
      paso('habilitado_para_entrega', '2026-05-02T10:00:00Z', { [CAMPO_AVISO_CLIENTE]: '2026-05-02' }),
      paso('entrega_al_cliente', '2026-05-14T10:00:00Z', { 'Fecha Remisión de Salida': '2026-05-14' }),
    ]
    expect(diasDeBodegaje(historial)).toBe(8 + 5 + 12)
    expect(periodosDeBodegaje(historial).map((p) => p.clase)).toEqual(['entrada', 'proceso', 'salida'])
  })
})

/**
 * EL OTRO ARREGLO DE C9, que NO es un bodegaje y por eso va en su propio bloque.
 *
 * `:2330` — «El bodegaje (56) y el tiempo de inicio de servicio (48) dependen de la fecha de creación
 * del ticket y quedaron inválidos en 2026; el tiempo de diagnóstico (49) usa la misma referencia y
 * hereda el problema aunque el diccionario no lo señale.»
 *
 * De los tres, el 56 lo resuelve la tabla de M1.10 de arriba. Los otros dos siguen necesitando un
 * hito, y ése SÍ es la marca de tiempo de `Ingreso a Servicio` (`:1684`, `:3062`). Los KPIs 48 y 49
 * no existen todavía como código —no hay módulo de indicadores—, así que esta tanda entrega el hito
 * y no el indicador: es lo que impide que quien los construya vuelva a anclar en la fecha de
 * creación, que es la avería.
 */
describe('C9 · el hito de los indicadores 48 y 49', () => {
  const paso = (transitionId: string, performedAt: string, values: Record<string, unknown> = {}): PasoDelHistorial =>
    ({ transitionId, performedAt, values })

  it('15 · el hito es la transición «Ingreso a Servicio», declarada por id y no por nombre', () => {
    expect(HITO_INDICADORES_ROTOS).toBe('ingreso_a_servicio')
    expect(transitionById(HITO_INDICADORES_ROTOS)!.name).toBe('Ingreso a Servicio')
  })

  it('16 · devuelve la marca de tiempo de esa transición, no la del ticket', () => {
    const historial = [
      paso('habilitar_servicio', '2026-01-05T09:00:00Z', { 'Fecha Orden De Venta': '2026-01-05' }),
      paso('ingreso_a_servicio', '2026-02-20T14:30:00Z', { 'Fecha Remisión Entrada': '2026-02-20' }),
    ]
    expect(marcaIngresoAServicio(historial)).toBe('2026-02-20T14:30:00Z')
  })

  /**
   * LA AVERÍA, ESCRITA COMO PRUEBA. `Fecha creación ticket` la escribe la MISMA transición
   * (`transitions.ts:191`), así que está a un carácter de distancia de la correcta. Y desde que
   * Comercial da de alta los tickets por anticipado, las dos fechas se separan meses: aquí, 46 días.
   */
  it('17 · y NO la fecha de creación del ticket, que es lo que rompió los tres indicadores', () => {
    const historial = [
      paso('ingreso_a_servicio', '2026-02-20T14:30:00Z', {
        'Fecha creación ticket': '2026-01-05',
        'Fecha Remisión Entrada': '2026-02-20',
      }),
    ]
    expect(marcaIngresoAServicio(historial)).not.toBe('2026-01-05')
    expect(marcaIngresoAServicio(historial)).toBe('2026-02-20T14:30:00Z')
  })

  it('18 · un ticket que aún no entró a servicio no tiene hito', () => {
    expect(marcaIngresoAServicio([paso('habilitar_servicio', '2026-01-05T09:00:00Z')])).toBeNull()
  })
})
