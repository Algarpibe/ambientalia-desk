import { describe, it, expect } from 'vitest'
import {
  TRANSITIONS, TRANSICION_REMISION_CONFIRMADA, TRANSICION_REMISION_RETIRADA, STATUS_TICKET_CREADO, STATUS_REMISION_CREADA,
} from './transitions'
import { ESTADOS } from './estados'
import { camposFechaReentrantes } from './reentrancia'

/**
 * LOS SIETE INVARIANTES DEL GRAFO (§2 del proposal F0-04).
 *
 * Cinco tandas de la Fase 1 tocan `transitions.ts` —F1A-01, F1B-06, F1C-02, F1C-05 y C9— y hoy
 * ninguna tiene red debajo: F1B-06 añade dos grafos enteros y puede romper el de servicio técnico
 * sin que nada dé rojo. Esto es esa red.
 *
 * ⚠️ SE AFIRMA SOBRE `TRANSITIONS`, NUNCA SOBRE `TRANSICIONES_BASE`.
 * `TRANSITIONS = TRANSICIONES_BASE.map(...)` (`transitions.ts:288-291`) y es lo que consumen
 * `transitionsForStatus` y `transitionById` (`:293-300`), o sea lo que ejecuta el servidor por
 * `ticketService`. Hoy las dos listas son idénticas, pero el comentario de `transitions.ts:286` ya
 * contempla que ese `map` lleve algún día un `Set` de excepciones: la divergencia no es hipotética,
 * y el día que llegue el invariante tiene que hablar de lo que se ejecuta, no de la declaración.
 * (`TRANSICIONES_BASE` no se exporta, así que además no hay forma de equivocarse desde fuera.)
 *
 * El invariante 7 —la superficie saliente— vive en `apps/desk/server/superficieSaliente.test.ts`:
 * es un barrido del repositorio entero, no cabe en `shared` (que no hace ninguna llamada HTTP) y
 * lee ficheros de disco, así que dejarlo aquí sacaría de un segundo el ciclo focalizado del motor.
 */
describe('invariantes del grafo de transiciones', () => {
  /**
   * INVARIANTE 1 — la condición innegociable de §1.3.
   *
   * Sin esta prueba, el registro de estados cambia una regex frágil por una lista frágil, que es
   * PEOR: parece rigurosa. Atrapa el estado nuevo sin clasificar y el `to` mal escrito, que son las
   * dos formas de romper el grafo sin que nada más se entere.
   */
  it('1 · los estados declarados son exactamente los derivados de los from/to', () => {
    const derivados = new Set<string>()
    for (const t of TRANSITIONS) {
      for (const f of t.from) derivados.add(f)
      derivados.add(t.to)
    }
    expect([...derivados].sort()).toEqual([...ESTADOS].sort())
  })

  /**
   * INVARIANTE 2 — el recuento. Atrapa la transición perdida al editar un array de 34 entradas.
   *
   * Vale menos que los demás y por eso va acompañado: un número solo no dice QUÉ se perdió. Va con
   * el conjunto de ids, que sí lo dice.
   */
  it('2 · 34 transiciones sobre 21 estados', () => {
    expect(TRANSITIONS).toHaveLength(34)
    expect(ESTADOS).toHaveLength(21)
    expect(new Set(TRANSITIONS.map((t) => t.id)).size, 'hay ids repetidos').toBe(34)
  })

  /**
   * INVARIANTE 3 — `Finalizado` es el único callejón sin salida.
   *
   * Un estado sin salida introducido por descuido deja tickets clavados sin que nadie pueda moverlos
   * desde la interfaz, y no hay pantalla que lo avise: la de transiciones simplemente sale vacía.
   */
  it('3 · Finalizado es el único estado sin transición de salida', () => {
    const conSalida = new Set(TRANSITIONS.flatMap((t) => t.from))
    const sinSalida = ESTADOS.filter((e) => !conSalida.has(e))
    expect(sinSalida).toEqual(['Finalizado'])
  })

  /**
   * INVARIANTE 4 — ningún `from` ni ningún `to` apunta fuera del registro.
   *
   * Es la otra mitad del 1: el 1 compara conjuntos y por tanto ya lo cubre hoy, pero se escribe
   * aparte porque el mensaje de fallo es el que importa —dice QUÉ estado no existe— y porque el día
   * que el registro declare un estado todavía sin transiciones (F1B-06 añade dos grafos) el 1 se
   * relajará y este seguirá siendo exacto.
   */
  it('4 · ninguna transición apunta a un estado no declarado', () => {
    const declarados = new Set<string>(ESTADOS)
    for (const t of TRANSITIONS) {
      for (const f of t.from) expect(declarados.has(f), `${t.id}: from «${f}» no está declarado`).toBe(true)
      expect(declarados.has(t.to), `${t.id}: to «${t.to}» no está declarado`).toBe(true)
    }
  })

  /**
   * INVARIANTE 5 — el CONJUNTO de las ocho compartidas, emparejado id → área. Fija M1.9.1.
   *
   * ⚠️ Se afirma el emparejamiento, NO el número. «Exactamente 8» pasa igual si alguien cambia
   * `rechazo_cliente` de `Comercial / Servicio Técnico` a `Comercial / Compras`: siguen siendo ocho,
   * con otro significado, y la matriz de F1C-05 se construye mal sin que nada dé rojo.
   */
  it('5 · las ocho compartidas son estas, cada una con su pareja de áreas', () => {
    const compartidas: Record<string, string> = {}
    for (const t of TRANSITIONS) {
      if (t.area.includes(' / ')) compartidas[t.id] = t.area
    }
    expect(compartidas).toEqual({
      llegada_repuestos: 'Comercial / Compras',
      aprobacion_y_repuestos: 'Comercial / Compras',
      notif_por_garantia: 'Comercial / Compras',
      rechazo_garantia: 'Comercial / Compras',
      solicitud_sku: 'Comercial / Compras',
      rechazo_comercial: 'Comercial / Servicio Técnico',
      rechazo_cliente: 'Comercial / Servicio Técnico',
      rechazo_revision: 'Comercial / Servicio Técnico',
    })
  })

  /**
   * LA EXCLUSIÓN, ESCRITA, para que el siguiente no la descubra tropezando — invertida por P-2.
   *
   * `TRANSICION_REMISION_CONFIRMADA` y `TRANSICION_REMISION_RETIRADA` (`transitions.ts:150-151`)
   * AHORA declaran `from`/`to`, con el par exacto: se cierra la tercera copia que
   * `estadoPorRemision.ts` reconstruía con literales sueltos (P-2 del proposal). Siguen sin ser
   * botones — las aplica el servidor solo cuando n8n confirma o anula el documento.
   *
   * El discriminador de «no es botón» ya no puede ser `from`/`to` ausente: pasa a ser `fields`
   * ausente, porque las 34 de `TRANSITIONS` siempre lo llevan. Ninguna de las dos mueve el ocho
   * del invariante 5: las dos siguen siendo de `Servicio Técnico` a secas.
   */
  it('5b · las dos sin botón declaran su par exacto y siguen fuera de TRANSITIONS', () => {
    for (const [t, from, to] of [[TRANSICION_REMISION_CONFIRMADA, STATUS_TICKET_CREADO, STATUS_REMISION_CREADA], [TRANSICION_REMISION_RETIRADA, STATUS_REMISION_CREADA, STATUS_TICKET_CREADO]] as const) {
      expect([t.from, t.to], `${t.id} ya no declara su par`).toEqual([[from], to])
      expect(t, `${t.id} ganó fields: ya es un botón`).not.toHaveProperty('fields')
      expect(t.area, `${t.id} dejó de ser de Servicio Técnico a secas`).toBe('Servicio Técnico')
      expect(TRANSITIONS.some((x) => x.id === t.id), `${t.id} se coló en TRANSITIONS`).toBe(false)
    }
  })

  /**
   * INVARIANTE 6 — la lista de campos de fecha reentrantes no crece sin declararlo.
   *
   * Los diez son la entrada de F1C-02, F1C-06, C9 y la spec `kpis`: cada uno es un campo que una
   * segunda pasada por su ciclo vuelve a escribir. La tabla completa —componente por componente y
   * cruzada con G.6— está en `reentrancia.test.ts`; aquí va sólo el conjunto, que es lo que no puede
   * crecer en silencio.
   */
  it('6 · los campos de fecha reentrantes son exactamente estos diez', () => {
    expect(camposFechaReentrantes()).toEqual([
      'Fecha Recepción de repuestos',
      'Fecha Orden de Compra',
      'Fecha Orden De Venta',
      'Fecha Orden de Compra Final',
      'Fecha Orden de Venta Final',
      'Fecha de Cotización',
      'Fecha solicitud SKU',
      'Fecha Salida Servicio externo',
      'Fecha Entrada de servicio externo',
      'Fecha Remisión de Salida',
    ])
  })
})
