import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { TRANSITIONS, TRANSITIONS_EQUIPO_NUEVO, ESTADOS_SIN_SALIDA } from '@ambientalia/shared'
import { db, instalarArnes, appWith, adminCookie, valoresValidos } from './testing/appHarness'

instalarArnes()

/**
 * C1 — EL CHECKBOX OBLIGATORIO QUE AHORA SÍ FRENA. Cerrado en F1A-01.
 *
 * QUÉ ERA. `transitionExec.ts` procesaba la rama del `checkbox` y hacía `continue` ANTES del chequeo
 * genérico de obligatorio, así que un checkbox `required` no se validaba nunca: sin marcar se
 * guardaba como `false` y la transición seguía adelante. El único que existe es `transitions.ts:247`
 * —`cfCheck('Liberación del ticket sin facturar', true)` en `liberacion_sin_factura`, área
 * Comercial—, y era la única guarda de esa liberación.
 *
 * QUÉ SE ARREGLÓ, Y POR QUÉ SON DOS PIEZAS. La estimación del acta —«Una línea» (`acta:258`)— sale
 * de mirar sólo la primera:
 *
 *   (a) el chequeo de obligatorio pasa a ir ANTES del bloque del checkbox. Va ahí y no detrás del
 *       `if (empty) continue`: detrás, un checkbox OPCIONAL ausente dejaría de escribirse como
 *       `false`, que es otro cambio de comportamiento y no estaba pedido. Lo fija
 *       `transitionExec.test.ts`, «un checkbox opcional ausente se sigue escribiendo como false».
 *   (b) y para un checkbox la condición es `asBool(raw) !== true`, NO `empty`. Porque `empty` no
 *       captura `false`, y `false` es lo que manda el navegador cuando la casilla existe y está sin
 *       marcar. VERIFICADO POR MUTACIÓN al cerrar C1: con sólo (a) aplicada, la prueba de la vía
 *       FALSE seguía ROJA con «expected 200 to be 422». El arreglo de una sola pieza dejaba el
 *       defecto vivo por el camino normal del formulario.
 *
 * POR QUÉ TRES PRUEBAS Y NO UNA. Las dos vías de entrada del defecto fallan por motivos distintos
 * —`undefined` la caza la pieza (a), `false` sólo la (b)—, así que cada una necesita la suya. Y la
 * tercera es la que impide el arreglo por exceso: una guarda que rechazara también la casilla
 * MARCADA frenaría la transición entera y las dos primeras seguirían verdes.
 *
 * ⚠️ CONSECUENCIA QUE EL ARREGLO NO REPARA. `liberacion_sin_facturar` es columna promovida
 * (`rows.ts:121`, `schema.sql:39`), luego HAY FILAS EN PRODUCCIÓN con `false` en esa columna y el
 * ticket avanzado igualmente. El arreglo detiene la sangría; no repara el histórico. Quien audite
 * liberaciones sin factura sobre esos datos estará auditando un dato falso. Va al Anexo D como punto
 * nuevo, en la misma entrada que C1.
 */
describe('C1 · el checkbox obligatorio de «Liberación sin factura»', () => {
  async function ticketPorFacturar() {
    await db.query("INSERT INTO tickets (id, number, subject, status) VALUES ('t1', 4100, 'C1', 'Por Facturar')")
  }

  const CASILLA = 'Liberación del ticket sin facturar'

  /** Ejecuta la liberación con los `values` dados, sobre un ticket recién puesto en «Por Facturar». */
  async function liberar(values: Record<string, unknown>) {
    const cookie = await adminCookie()
    await ticketPorFacturar()
    const { app } = appWith()
    return request(app).post('/api/tickets/t1/transition').set('Cookie', cookie)
      .send({ transitionId: 'liberacion_sin_factura', values })
  }

  /** El estado y la casilla como quedaron en la base. */
  async function filaTicket() {
    const t = await db.query('SELECT status, liberacion_sin_facturar FROM tickets WHERE id = $1', ['t1'])
    return t.rows[0] as { status: string; liberacion_sin_facturar: boolean | null }
  }

  // ── VÍA 1 · el campo llega AUSENTE ───────────────────────────────────────────────────────────
  // `raw` es `undefined`, luego `empty` es `true`: la vía que cierra la pieza (a).

  it('con el checkbox obligatorio AUSENTE, la liberación se rechaza con 422', async () => {
    const res = await liberar({ comment: 'sin mandar la casilla' })

    expect(res.status).toBe(422)
    expect(res.body.errors).toContain(`Falta el campo obligatorio: ${CASILLA}`)
    // Y el ticket NO se mueve: un 422 que ya hubiera transicionado no sería una validación.
    expect((await filaTicket()).status).toBe('Por Facturar')
  })

  // ── VÍA 2 · el campo llega presente y en FALSE ───────────────────────────────────────────────
  // `raw` es `false`, luego `empty` es FALSE. Es el camino NORMAL —un formulario con la casilla
  // desmarcada manda `false`, no `undefined`— y sólo lo cierra la pieza (b).

  it('con el checkbox obligatorio en FALSE, la liberación se rechaza con 422', async () => {
    const res = await liberar({ comment: 'casilla desmarcada', [CASILLA]: false })

    expect(res.status).toBe(422)
    expect(res.body.errors).toContain(`Falta el campo obligatorio: ${CASILLA}`)
    expect((await filaTicket()).status).toBe('Por Facturar')
  })

  // ── LO QUE LA GUARDA TIENE QUE DEJAR PASAR ───────────────────────────────────────────────────
  // Sin esta prueba, un arreglo que rechazara SIEMPRE la liberación dejaría verdes las dos de
  // arriba. Es la mitad del requisito que las dos negativas no pueden afirmar.

  it('con el checkbox MARCADO, la liberación se ejecuta y la casilla queda en true', async () => {
    const res = await liberar({ comment: 'liberado sin factura', [CASILLA]: true })

    expect(res.status).toBe(200)
    expect(res.body.errors).toBeUndefined()

    const fila = await filaTicket()
    expect(fila.status).toBe('Por Entregar / Sin facturar')
    // La columna promovida guarda `true`: a partir de aquí, quien audite liberaciones sin factura
    // lee un dato que se corresponde con el estado del ticket.
    expect(fila.liberacion_sin_facturar).toBe(true)
  })
})

/**
 * LAS 34 TRANSICIONES, EJECUTADAS CONTRA EL SERVIDOR (§5 del proposal F0-04).
 *
 * QUÉ HABÍA Y QUÉ FALTABA. La matriz de `permisos.test.ts` (§4) ya barre las 34 contra el servidor,
 * pero sólo mira el CÓDIGO HTTP: comprueba quién puede pulsar el botón, no adónde lleva. Nadie
 * comprobaba que el ticket acabe en el estado declarado ni que quede constancia de la etapa. La
 * traza sólo se verificaba en UNA transición (`remisiones.test.ts:356`), y M1.10 `[DECIDIDO — R08]`
 * la exige «sin excepciones».
 *
 * ⚠️ CUIDADO CON EL MONTAJE, que es lo que demostró la matriz de permisos: con el ticket en un
 * estado de origen INVÁLIDO el servidor contesta 409 (`ticketService.ts:86`) y la prueba no
 * comprueba nada de lo que cree comprobar. Por eso cada caso declara su origen y se ejercitan TODOS
 * los `from` de cada transición —`habilitar_servicio` tiene tres—: 34 transiciones, 36 ejecuciones.
 *
 * ⚠️ POR QUÉ HAY UNA TABLA ESCRITA A MANO Y NO SÓLO UN BARRIDO DERIVADO DEL GRAFO. Un barrido
 * derivado se adapta solo a lo que `transitions.ts` diga, así que un `to` cambiado por descuido
 * seguiría en verde: la prueba se movería con el error. La tabla es la declaración INDEPENDIENTE de
 * los extremos —de dónde sale y adónde llega cada etapa—, y por eso puede contradecir al grafo. Se
 * comparan las dos, y quien las ejecuta es el servidor: hacen falta las tres puntas.
 *
 * ⚠️ Y POR QUÉ LA TABLA ES ADEMÁS EL REGISTRO DE COBERTURA. «Huérfana» en §5 es la transición que no
 * se cita en ninguna prueba, y la lista se DERIVA cruzando los ids de `TRANSITIONS` contra los
 * ficheros de prueba del repositorio. Cruzado sobre el commit base del proposal (`a3a8f03`) da
 * EXACTAMENTE 22: el número de §5 es correcto. Al llegar aquí quedaban 9, porque los invariantes, la
 * tabla de reentrancia, el registro de estados y la matriz de permisos —§§1-4, escritas antes en
 * esta misma tanda— ya habían nombrado 13 por el camino.
 *
 * Pero MENCIONAR NO ES CUBRIR: `reentrancia.test.ts` nombra diez ids sin ejecutar ninguno, y las 34
 * que barre `permisos.test.ts` sólo se comprueban por su código HTTP. Por eso las 34 tienen caso
 * aquí y no sólo las 9 que quedaban sueltas: la cobertura que §5 pide es la ejecutada. El guardián
 * de más abajo compara la tabla con el grafo, así que una transición nueva de cualquier catálogo se
 * pone roja el día que llegue sin caso.
 */
const CASOS: Record<string, { desde: string[]; a: string }> = {
  // ── 1 · LAS CUATRO SALIDAS ÚNICAS DE LOS ESTADOS SIN SALIDA — gate de F1C-03 ──────────────────
  // Son los cuatro `ESTADOS_SIN_SALIDA` de M1.3.4 (`estados.ts`): su única salida depende de un
  // suceso de fuera —un camión, un laboratorio, un alta en otro sistema—. F1C-03 tiene que darles
  // un escape, y para eso necesita saber qué hace hoy la única que hay.
  llegada_repuestos: { desde: ['En Espera de Repuestos'], a: 'En Proceso' },
  entrega_repuestos: { desde: ['Solicitado'], a: 'En Proceso' },
  retorno_servicio_externo: { desde: ['Servicio externo'], a: 'En Proceso' },
  notif_cliente_sku: { desde: ['En espera de SKU inventario'], a: 'Notificación cliente' },

  // ── 2 · LAS DOS RAMAS DEL CICLO DE FACTURACIÓN — gate de F1C-02 ───────────────────────────────
  // El componente C1 de la tabla de reentrancia: `Por Facturar` ⇄ `Por Entregar / Sin facturar`. La
  // vuelta escribe «Fecha Remisión de Salida», que es el campo reentrante de la columna 47. La ida
  // es además la que lleva el checkbox obligatorio del defecto C1, arriba.
  liberacion_sin_factura: { desde: ['Por Facturar'], a: 'Por Entregar / Sin facturar' },
  entrega_sin_factura: { desde: ['Por Entregar / Sin facturar'], a: 'Por Facturar' },

  // ── 3 · EL RESTO, en el orden del grafo ──────────────────────────────────────────────────────
  // Las tres formas de entrar: los dos nombres de la fase inicial —el de Zoho y el de la app— y la
  // fase de la remisión, que sin este tercer origen dejaría al ticket en un callejón.
  habilitar_servicio: { desde: ['OV asignada', 'Ticket creado', 'Remisión creada'], a: 'Ingresado' },
  ingreso_a_servicio: { desde: ['Ingresado'], a: 'Rev./Diagnostico' },
  escalado_a_revision: { desde: ['Rev./Diagnostico'], a: 'Notificado' },
  devolucion_a_correccion: { desde: ['Notificado'], a: 'Rev./Diagnostico' },
  aprobacion_y_repuestos: { desde: ['Notificación cliente'], a: 'En Espera de Repuestos' },
  solicitud_repuestos: { desde: ['En Proceso'], a: 'Solicitado' },
  aprobacion: { desde: ['Notificación cliente'], a: 'En Proceso' },
  marcar_pendiente: { desde: ['En Proceso'], a: 'Pendiente' },
  notif_por_garantia: { desde: ['Notificación a Compras'], a: 'En Espera de Repuestos' },
  notif_cliente_comercial: { desde: ['Notificación Comercial'], a: 'Notificación cliente' },
  rechazo_garantia: { desde: ['Notificación a Compras'], a: 'Notificación Comercial' },
  solicitud_sku: { desde: ['Notificación Comercial'], a: 'En espera de SKU inventario' },
  reporte_por_garantia: { desde: ['Notificado'], a: 'Notificación a Compras' },
  escalado_a_comercial: { desde: ['Notificado'], a: 'Notificación Comercial' },
  finalizacion_servicio: { desde: ['En Proceso'], a: 'Por Facturar' },
  cal_sensores_proceso: { desde: ['En Proceso'], a: 'Servicio externo' },
  cal_sensores_revision: { desde: ['Rev./Diagnostico'], a: 'Servicio externo' },
  servicio_externo_pendiente: { desde: ['Pendiente'], a: 'Por Facturar' },
  servicio_externo_notificado: { desde: ['Notificado'], a: 'Por Facturar' },
  rechazo_comercial: { desde: ['Notificación Comercial'], a: 'Por Facturar' },
  rechazo_cliente: { desde: ['Notificación cliente'], a: 'Por Facturar' },
  rechazo_revision: { desde: ['Rev./Diagnostico'], a: 'Por Facturar' },
  facturado: { desde: ['Por Facturar'], a: 'Liberación Comercial' },
  facturado_cierre: { desde: ['Por Facturar'], a: 'Finalizado' },
  diagnostico_complementario: { desde: ['Pendiente'], a: 'Continuación del proceso' },
  entrega_al_cliente: { desde: ['Por Entregar'], a: 'Finalizado' },
  habilitado_para_entrega: { desde: ['Liberación Comercial'], a: 'Por Entregar' },
  notif_recotizacion: { desde: ['Continuación del proceso'], a: 'Notificación Comercial' },
}

describe('las 34 transiciones, ejecutadas contra el servidor', () => {
  /**
   * EL GUARDIÁN DE COBERTURA: el conjunto de huérfanas tiene que estar VACÍO.
   *
   * Se afirma en los DOS sentidos porque los dos fallos existen y no son el mismo: una transición
   * nueva sin caso (cualquier catálogo del registro de flujos puede añadir una) y un caso que sobrevive a la transición que
   * documentaba —un id renombrado deja el caso apuntando a nada, y el barrido de más abajo dejaría
   * de ejecutar esa transición sin que nadie se entere.
   */
  it('ninguna transición se queda sin caso: el conjunto de huérfanas está vacío', () => {
    const conCaso = new Set(Object.keys(CASOS))
    const huerfanas = TRANSITIONS.filter((t) => !conCaso.has(t.id)).map((t) => t.id)
    expect(huerfanas, 'transiciones del grafo sin caso en CASOS').toEqual([])

    const declaradas = new Set(TRANSITIONS.map((t) => t.id))
    const sobrantes = Object.keys(CASOS).filter((id) => !declaradas.has(id))
    expect(sobrantes, 'casos que ya no corresponden a ninguna transición').toEqual([])
  })

  /**
   * LA TABLA CONTRA EL GRAFO. Es lo que convierte los extremos escritos a mano en una segunda
   * opinión: si `transitions.ts` cambia un `to` por descuido, aquí sale el par que no cuadra con su
   * id delante, y hay que moverlo A PROPÓSITO en los dos sitios.
   */
  it('cada caso declara los mismos extremos que el grafo', () => {
    const delGrafo: Record<string, { desde: string[]; a: string }> = {}
    for (const t of TRANSITIONS) delGrafo[t.id] = { desde: t.from, a: t.to }
    expect(CASOS).toEqual(delGrafo)
  })

  /**
   * LAS CUATRO SALIDAS ÚNICAS, NOMBRADAS — gate de F1C-03 (grupo 1 de §5).
   *
   * `estados.test.ts:160` ya deja escrito que DOCE estados tienen una sola salida, así que «salida
   * única» no clasifica nada por sí sola; lo que aquí se fija es CUÁL es la de cada uno de los
   * cuatro `sin_salida`, que es lo que F1C-03 tiene que reconsiderar. Si mañana un estado sin salida
   * gana una segunda transición, esta prueba lo dice antes de que nadie diseñe el escape.
   */
  it('los cuatro estados sin salida tienen exactamente la salida que dice la tabla', () => {
    const salidas: Record<string, string[]> = {}
    for (const e of ESTADOS_SIN_SALIDA) salidas[e] = TRANSITIONS.filter((t) => t.from.includes(e)).map((t) => t.id)
    expect(salidas).toEqual({
      'En Espera de Repuestos': ['llegada_repuestos'],
      'Solicitado': ['entrega_repuestos'],
      'Servicio externo': ['retorno_servicio_externo'],
      'En espera de SKU inventario': ['notif_cliente_sku'],
    })
  })

  /**
   * EL BARRIDO: las 36 ejecuciones, cada una desde un origen VÁLIDO, contra el servidor de verdad.
   *
   * Se comprueban las tres cosas de un tirón y en una sola comparación —código HTTP, estado final
   * del ticket y fila de `ticket_transitions`— porque separarlas multiplicaría por tres las bases
   * pg-mem, y el diff de `toEqual` sobre el registro ya dice exactamente qué transición falló y en
   * cuál de las tres.
   *
   * LA TRAZA VA AQUÍ y no en una prueba aparte por M1.10 `[DECIDIDO — R08]`: se exige «sin
   * excepciones», y una prueba de traza que sólo mire algunas transiciones documenta lo contrario de
   * lo que la decisión dice. Se afirma que hay UNA fila —ni cero ni dos— con su id, sus dos
   * extremos, su área y su actor.
   */
  it('las 34 salen de su origen, llegan a su destino y dejan traza', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()

    const observado: Record<string, string[]> = {}
    const esperado: Record<string, string[]> = {}
    let n = 0
    for (const t of TRANSITIONS) {
      observado[t.id] = []
      esperado[t.id] = []
      for (const origen of CASOS[t.id].desde) {
        n += 1
        const id = `eje-${n}`
        await db.query('INSERT INTO tickets (id, number, subject, status) VALUES ($1,$2,$3,$4)',
          [id, 70000 + n, 'Barrido de ejecución', origen])

        const res = await request(app).post(`/api/tickets/${id}/transition`).set('Cookie', cookie)
          .send({ transitionId: t.id, values: valoresValidos(t, n) })

        const ticket = await db.query('SELECT status FROM tickets WHERE id = $1', [id])
        const estado = (ticket.rows[0] as { status: string }).status
        const traza = await db.query(
          'SELECT transition_id, from_status, to_status, area, performed_by FROM ticket_transitions WHERE ticket_id = $1', [id])
        const f = traza.rows[0] as { transition_id: string; from_status: string; to_status: string; area: string; performed_by: string } | undefined

        observado[t.id].push(`${res.status} · ${estado} · ${traza.rows.length} traza(s)`
          + (f ? `: ${f.transition_id} ${f.from_status}→${f.to_status} [${f.area}] por ${f.performed_by}` : ''))
        esperado[t.id].push(`200 · ${CASOS[t.id].a} · 1 traza(s)`
          + `: ${t.id} ${origen}→${CASOS[t.id].a} [${t.area}] por Admin`)
      }
    }

    expect(observado).toEqual(esperado)
    // Y que el barrido no se haya quedado corto: 34 transiciones y 36 ejecuciones, porque
    // `habilitar_servicio` sale de tres estados. Un barrido sobre un grafo vacío también daría verde.
    expect(n, 'ejecuciones del barrido').toBe(36)
  }, 60_000)
})

/**
 * F1B-06 — LAS CINCO TRANSICIONES DE `TRANSITIONS_EQUIPO_NUEVO`, EJECUTADAS CONTRA EL SERVIDOR.
 *
 * Mismo molde que el barrido de las 34 de arriba, escrita a mano y NO derivada — con cinco casos la
 * derivación no aporta la segunda opinión que sí aporta con 34, y el guardián de huérfanas es el que
 * cuida que ninguna quede sin caso.
 *
 * ⚠️ CORRECCIÓN (c), OBLIGATORIA. Cada ticket sembrado lleva `classification: 'Equipo nuevo'`
 * EXPLÍCITO y se coloca en `t.from[0]` de SU transición EN: sin la clasificación, la guarda 3
 * (Fase 6) respondería 409 de flujo antes de llegar al 200 que este barrido comprueba, y la prueba
 * estaría comprobando la guarda 3 en vez de la ejecución — mismo riesgo que ya advierte el
 * comentario de `permisos.test.ts:24-33` sobre el estado de origen.
 */
const CASOS_EQUIPO_NUEVO: Record<string, { desde: string[]; a: string }> = {
  ingreso_equipo_nuevo: { desde: ['Ingresado'], a: 'En Proceso' },
  producto_no_conforme: { desde: ['En Proceso'], a: 'Notificado' },
  analisis_y_acciones: { desde: ['Notificado'], a: 'Ingresado' },
  verificacion: { desde: ['En Proceso'], a: 'Verificación' },
  liberacion: { desde: ['En Proceso'], a: 'Finalizado' },
}

describe('las cinco transiciones de Equipo nuevo, ejecutadas contra el servidor (F1B-06)', () => {
  it('ninguna transición del catálogo EN se queda sin caso, y ningún caso sobra', () => {
    const conCaso = new Set(Object.keys(CASOS_EQUIPO_NUEVO))
    const huerfanas = TRANSITIONS_EQUIPO_NUEVO.filter((t) => !conCaso.has(t.id)).map((t) => t.id)
    expect(huerfanas, 'transiciones EN sin caso en CASOS_EQUIPO_NUEVO').toEqual([])

    const declaradas = new Set(TRANSITIONS_EQUIPO_NUEVO.map((t) => t.id))
    const sobrantes = Object.keys(CASOS_EQUIPO_NUEVO).filter((id) => !declaradas.has(id))
    expect(sobrantes, 'casos que ya no corresponden a ninguna transición EN').toEqual([])
  })

  it('cada caso EN declara los mismos extremos que el catálogo EN', () => {
    const delGrafo: Record<string, { desde: string[]; a: string }> = {}
    for (const t of TRANSITIONS_EQUIPO_NUEVO) delGrafo[t.id] = { desde: t.from, a: t.to }
    expect(CASOS_EQUIPO_NUEVO).toEqual(delGrafo)
  })

  it('las cinco salen de su origen, llegan a su destino y dejan traza', async () => {
    const cookie = await adminCookie()
    const { app } = appWith()

    const observado: Record<string, string> = {}
    const esperado: Record<string, string> = {}
    let n = 0
    for (const t of TRANSITIONS_EQUIPO_NUEVO) {
      n += 1
      const id = `eje-en-${n}`
      // Corrección (c): classification explícita, y el ticket nace en t.from[0] — la guarda 3 exige
      // las dos cosas a la vez para reconocer el flujo equipo-nuevo (s5, `flujoDelTicket`).
      await db.query('INSERT INTO tickets (id, number, subject, status, classification) VALUES ($1,$2,$3,$4,$5)',
        [id, 71000 + n, 'Barrido de ejecución EN', t.from[0], 'Equipo nuevo'])

      const res = await request(app).post(`/api/tickets/${id}/transition`).set('Cookie', cookie)
        .send({ transitionId: t.id, values: valoresValidos(t, n) })

      const ticket = await db.query('SELECT status FROM tickets WHERE id = $1', [id])
      const estado = (ticket.rows[0] as { status: string }).status
      const traza = await db.query(
        'SELECT transition_id, from_status, to_status, area, performed_by FROM ticket_transitions WHERE ticket_id = $1', [id])
      const f = traza.rows[0] as { transition_id: string; from_status: string; to_status: string; area: string; performed_by: string } | undefined

      observado[t.id] = `${res.status} · ${estado} · ${traza.rows.length} traza(s)`
        + (f ? `: ${f.transition_id} ${f.from_status}→${f.to_status} [${f.area}] por ${f.performed_by}` : '')
      esperado[t.id] = `200 · ${CASOS_EQUIPO_NUEVO[t.id].a} · 1 traza(s)`
        + `: ${t.id} ${t.from[0]}→${CASOS_EQUIPO_NUEVO[t.id].a} [${t.area}] por Admin`
    }

    expect(observado).toEqual(esperado)
    expect(n, 'ejecuciones del barrido EN').toBe(5)
  })
})
