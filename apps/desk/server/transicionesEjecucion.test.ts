import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { TRANSITIONS, ESTADOS_SIN_SALIDA } from '@ambientalia/shared'
import { db, instalarArnes, appWith, adminCookie, valoresValidos } from './testing/appHarness'

instalarArnes()

/**
 * C1 — EL CHECKBOX OBLIGATORIO QUE NO FRENA NADA (§5.3 del proposal F0-04).
 *
 * EL DEFECTO, verificado: `transitionExec.ts:63-68` procesa la rama del `checkbox` y hace `continue`
 * en `:67`, ANTES del chequeo genérico de obligatorio de `:70` (`if (f.required && empty)`). Un
 * checkbox marcado `required` nunca llega a ese chequeo, así que nunca se valida: sin marcar se
 * guarda como `false` y la transición sigue adelante.
 *
 * El único que existe es `transitions.ts:247` — `cfCheck('Liberación del ticket sin facturar', true)`
 * en `liberacion_sin_factura` (`Por Facturar` → `Por Entregar / Sin facturar`, área Comercial). La
 * prueba de obligatorios que había (`transitionExec.test.ts:82-86`) usa un campo de TEXTO, y por eso
 * nunca tocó este camino.
 *
 * ⚠️ ESTA TANDA NO LO ARREGLA. F0-04 no cambia comportamiento (§12): las pruebas documentan el
 * as-built y el arreglo es F1A-01.
 *
 * ⚠️ POR QUÉ SON DOS Y NO UNA. Un `it.fails` solo tiene un agujero: pasa cuando el test falla POR
 * CUALQUIER MOTIVO —un import roto, un 500 en vez del 422, una ruta renombrada— y es justo la prueba
 * que existe para fijar un defecto concreto. La primera afirma en POSITIVO lo que hoy ocurre, así
 * que si mañana rompe otra cosa se pone roja por el motivo correcto en vez de esconderse detrás del
 * `.fails` de su pareja.
 *
 * VERIFICADO POR MUTACIÓN al escribirlas: con el bloque del checkbox movido detrás del chequeo de
 * obligatorio —el arreglo de F1A-01— se ponen ROJAS LAS DOS, la primera por «expected 422 to be 200»
 * y la segunda por «Expect test to fail». Y son las ÚNICAS: de las 611 pruebas de
 * `apps/desk/server/` + `packages/shared/` no se movió ninguna otra, así que este par es hoy toda la
 * red que hay debajo de C1.
 *
 * ══ QUÉ TIENE QUE HACER F1A-01 CON ESTAS DOS, EN ESTE ORDEN ══════════════════════════════════════
 *   1. Quitar el `.fails` de la segunda y verla ROJA — comprobando que falla por el 200 que devuelve
 *      hoy, no por otra cosa.
 *   2. Arreglar `transitionExec.ts`: el chequeo de obligatorio de `:70` tiene que correr TAMBIÉN para
 *      los checkbox. El movimiento es mover el bloque `if (f.kind === 'checkbox')` a ENTRE `:70` y
 *      `:71`, no detrás de `:71`: detrás del `if (empty) continue` un checkbox OPCIONAL ausente
 *      dejaría de escribirse como `false`, que es un cambio de comportamiento distinto y no pedido.
 *   3. Ver la segunda VERDE.
 *   4. INVERTIR la primera: pasa a comprobar 422, y su nombre y su comentario dejan de hablar de
 *      «comportamiento actual, defecto C1».
 * ════════════════════════════════════════════════════════════════════════════════════════════════
 */
describe('C1 · el checkbox obligatorio de «Liberación sin factura»', () => {
  async function ticketPorFacturar() {
    await db.query("INSERT INTO tickets (id, number, subject, status) VALUES ('t1', 4100, 'C1', 'Por Facturar')")
  }

  it('hoy una transición con checkbox obligatorio vacío se ejecuta igual — comportamiento actual, defecto C1', async () => {
    const cookie = await adminCookie()
    await ticketPorFacturar()
    const { app } = appWith()

    const res = await request(app).post('/api/tickets/t1/transition').set('Cookie', cookie)
      .send({ transitionId: 'liberacion_sin_factura', values: { comment: 'sin marcar la casilla' } })

    // El modo de fallo EXACTO, fijado en positivo: 200 y sin lista de errores.
    expect(res.status).toBe(200)
    expect(res.body.errors).toBeUndefined()

    // Y la transición se EJECUTA: el ticket acaba en el estado destino.
    const t = await db.query('SELECT status, liberacion_sin_facturar FROM tickets WHERE id = $1', ['t1'])
    const fila = t.rows[0] as { status: string; liberacion_sin_facturar: boolean | null }
    expect(fila.status).toBe('Por Entregar / Sin facturar')
    // La guinda del defecto: la casilla se guarda como `false` —es columna promovida
    // (`rows.ts:121`)—, así que la base afirma que el ticket NO se liberó sin facturar mientras el
    // ticket está exactamente en «Por Entregar / Sin facturar».
    expect(fila.liberacion_sin_facturar).toBe(false)
  })

  it.fails('el checkbox obligatorio debería dar 422 — verde cuando F1A-01 cierre C1', async () => {
    const cookie = await adminCookie()
    await ticketPorFacturar()
    const { app } = appWith()

    const res = await request(app).post('/api/tickets/t1/transition').set('Cookie', cookie)
      .send({ transitionId: 'liberacion_sin_factura', values: { comment: 'sin marcar la casilla' } })

    expect(res.status).toBe(422)
    expect(res.body.errors).toContain('Falta el campo obligatorio: Liberación del ticket sin facturar')
    // Y el ticket no se mueve: un 422 que ya hubiera transicionado no sería una validación.
    const t = await db.query('SELECT status FROM tickets WHERE id = $1', ['t1'])
    expect((t.rows[0] as { status: string }).status).toBe('Por Facturar')
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
 * de más abajo compara la tabla con el grafo, así que la transición 35 que añada F1B-06 se pone roja
 * el día que llegue sin caso.
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
   * nueva sin caso (F1B-06 añade dos grafos enteros) y un caso que sobrevive a la transición que
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
