import { describe, it, expect } from 'vitest'
import {
  TRANSITIONS, TRANSITIONS_EQUIPO_NUEVO, TRANSITIONS_SOPORTE_REMOTO, TRANSICION_REMISION_CONFIRMADA, TRANSICION_REMISION_RETIRADA, STATUS_TICKET_CREADO, STATUS_REMISION_CREADA,
} from './transitions'
import { ESTADOS, ESTADOS_SERVICIO, ESTADOS_SOLO_EQUIPO_NUEVO, ESTADOS_SOLO_SOPORTE_REMOTO } from './estados'
import { camposFechaReentrantes } from './reentrancia'; import { estadoInicialDelAlta, transicionesDelTicket } from './flujos'; import { CLASIFICACIONES } from './ticketCreate'

/**
 * LOS SIETE INVARIANTES DEL GRAFO (§2 del proposal F0-04).
 *
 * Cinco tandas de la Fase 1 tocan `transitions.ts` —F1A-01, F1B-06, F1C-02, F1C-05 y C9—. F1B-06
 * añade catálogos al registro de flujos (`flujos.ts`); la red cubre la unión, y ninguna de las cinco
 * puede romper el de servicio técnico sin que nada dé rojo. Esto es esa red.
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
    expect([...derivados].sort()).toEqual([...ESTADOS_SERVICIO].sort())
  })

  /**
   * INVARIANTE 2 — el recuento. Atrapa la transición perdida al editar un array de 34 entradas.
   *
   * Vale menos que los demás y por eso va acompañado: un número solo no dice QUÉ se perdió. Va con
   * el conjunto de ids, que sí lo dice.
   */
  it('2 · 34 transiciones sobre 21 estados', () => {
    expect(TRANSITIONS).toHaveLength(34)
    expect(ESTADOS_SERVICIO).toHaveLength(21)
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
    const sinSalida = ESTADOS_SERVICIO.filter((e) => !conSalida.has(e))
    expect(sinSalida).toEqual(['Finalizado'])
  })

  /**
   * INVARIANTE 4 — ningún `from` ni ningún `to` apunta fuera del registro.
   *
   * Es la otra mitad del 1: el 1 compara conjuntos y por tanto ya lo cubre hoy, pero se escribe
   * aparte porque el mensaje de fallo es el que importa —dice QUÉ estado no existe— y porque el día
   * que el registro de flujos gane un catálogo con un estado todavía sin transiciones, el 1 se
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

/**
 * INVARIANTES DE LA UNIÓN (F1B-06). `TRANSITIONS_EQUIPO_NUEVO` y `TRANSITIONS_SOPORTE_REMOTO` son catálogos SEPARADOS (D1 de
 * `design.md`): los siete invariantes de arriba siguen hablando sólo del flujo de servicio
 * (`ESTADOS_SERVICIO`). Éstos comprueban la red completa — la unión de los tres catálogos — para que
 * un estado nuevo sin registrar, un `from`/`to` fuera de sitio o un id repetido entre los tres flujos
 * no se cuele sin que nada dé rojo.
 */
describe('invariantes de la unión de catálogos (F1B-06)', () => {
  const UNION = [...TRANSITIONS, ...TRANSITIONS_EQUIPO_NUEVO, ...TRANSITIONS_SOPORTE_REMOTO]

  it('1 · los estados derivados de la unión son exactamente ESTADOS (23)', () => {
    const derivados = new Set<string>()
    for (const t of UNION) {
      for (const f of t.from) derivados.add(f)
      derivados.add(t.to)
    }
    expect([...derivados].sort()).toEqual([...ESTADOS].sort())
  })

  it('la unión tiene 44 entradas (34 + 6 + 4), con ids únicos', () => {
    expect(UNION).toHaveLength(44)
    expect(new Set(UNION.map((t) => t.id)).size, 'hay ids repetidos entre los tres catálogos').toBe(44)
  })

  it('3 · sin salida en la unión es exactamente Finalizado', () => {
    const conSalida = new Set(UNION.flatMap((t) => t.from))
    const sinSalida = ESTADOS.filter((e) => !conSalida.has(e))
    expect(sinSalida).toEqual(['Finalizado'])
  })

  it('4 · ninguna transición de ningún catálogo apunta a un estado fuera del registro', () => {
    const declarados = new Set<string>(ESTADOS)
    for (const t of UNION) {
      for (const f of t.from) expect(declarados.has(f), `${t.id}: from «${f}» no está declarado`).toBe(true)
      expect(declarados.has(t.to), `${t.id}: to «${t.to}» no está declarado`).toBe(true)
    }
  })

  it('ESTADOS_SOLO_EQUIPO_NUEVO es exactamente derivados(EN) − derivados(servicio)', () => {
    const derivadosServicio = new Set<string>()
    for (const t of TRANSITIONS) { for (const f of t.from) derivadosServicio.add(f); derivadosServicio.add(t.to) }
    const derivadosEquipoNuevo = new Set<string>()
    for (const t of TRANSITIONS_EQUIPO_NUEVO) { for (const f of t.from) derivadosEquipoNuevo.add(f); derivadosEquipoNuevo.add(t.to) }
    const diferencia = [...derivadosEquipoNuevo].filter((e) => !derivadosServicio.has(e))
    expect(diferencia).toEqual([...ESTADOS_SOLO_EQUIPO_NUEVO])
  })

  it('RQ-EN-01 · las seis transiciones cubren exactamente los pares del catálogo, y las salidas de Verificación son exactamente liberación y rechazo de verificación', () => {
    expect(TRANSITIONS_EQUIPO_NUEVO.map((t) => [t.id, t.from, t.to])).toEqual([
      ['ingreso_equipo_nuevo', ['Ingresado'], 'En Proceso'],
      ['producto_no_conforme', ['En Proceso'], 'Notificado'],
      ['analisis_y_acciones', ['Notificado'], 'Ingresado'],
      ['verificacion', ['En Proceso'], 'Verificación'],
      ['liberacion', ['En Proceso', 'Verificación'], 'Finalizado'],
      ['rechazo_verificacion', ['Verificación'], 'Notificado'],
    ])
    const salidasDeVerificacion = TRANSITIONS_EQUIPO_NUEVO.filter((t) => t.from.includes('Verificación')).map((t) => t.id)
    expect(salidasDeVerificacion).toEqual(['liberacion', 'rechazo_verificacion'])
  })

  it('corrección (b) · las seis entradas de Equipo nuevo declaran exactamente comentario y derivación', () => {
    for (const t of TRANSITIONS_EQUIPO_NUEVO) {
      expect(t.area, `${t.id} no es de Servicio Técnico (s2)`).toBe('Servicio Técnico')
      expect(t.fields.map((f) => f.key), `${t.id} declara campos de negocio de más`).toEqual(['comment', 'derivado_a'])
    }
  })
})

/**
 * INVARIANTES DEL CATÁLOGO `TRANSITIONS_SOPORTE_REMOTO` (F1B-06, `blueprint-soporte-remoto`, D7 de `design.md`).
 * La unión de arriba ya suma el tercer catálogo; aquí se fija lo que sólo el catálogo nuevo aporta: el estado
 * exclusivo, los pares de RQ-SR-01 y la ausencia de una salida de anulación desde `Solicitud Soporte` (S-5).
 */
describe('invariantes del catálogo soporte-remoto (F1B-06)', () => {
  const derivados = (catalogo: readonly { from: string[]; to: string }[]) => {
    const s = new Set<string>()
    for (const t of catalogo) { for (const f of t.from) s.add(f); s.add(t.to) }
    return s
  }

  it('ESTADOS_SOLO_SOPORTE_REMOTO es exactamente derivados(SR) − derivados(servicio ∪ EN)', () => {
    const ajenos = derivados([...TRANSITIONS, ...TRANSITIONS_EQUIPO_NUEVO])
    const diferencia = [...derivados(TRANSITIONS_SOPORTE_REMOTO)].filter((e) => !ajenos.has(e))
    expect(diferencia).toEqual([...ESTADOS_SOLO_SOPORTE_REMOTO])
    expect(diferencia).toEqual(['Solicitud Soporte'])
  })

  it('RQ-SR-01 · las cuatro cubren exactamente los pares del catálogo', () => {
    expect(TRANSITIONS_SOPORTE_REMOTO.map((t) => [t.id, t.from, t.to])).toEqual([
      ['asignacion_soporte', ['Solicitud Soporte'], 'En Proceso'],
      ['ejecutar_soporte', ['En Proceso'], 'Finalizado'],
      ['soporte_pendiente', ['En Proceso'], 'Pendiente'],
      ['continuacion_soporte', ['Pendiente'], 'En Proceso'],
    ])
  })

  it('S-5 · las salidas de Solicitud Soporte son exactamente asignacion_soporte', () => {
    const salidas = TRANSITIONS_SOPORTE_REMOTO.filter((t) => t.from.includes('Solicitud Soporte')).map((t) => t.id)
    expect(salidas).toEqual(['asignacion_soporte'])
  })

  it('corrección (b) · las cuatro declaran exactamente comentario y derivación, y son de Servicio Técnico', () => {
    expect(TRANSITIONS_SOPORTE_REMOTO).toHaveLength(4)
    for (const t of TRANSITIONS_SOPORTE_REMOTO) {
      expect(t.area, `${t.id} no es de Servicio Técnico (S-1)`).toBe('Servicio Técnico')
      expect(t.fields.map((f) => f.key), `${t.id} declara campos de negocio de más`).toEqual(['comment', 'derivado_a'])
    }
  })
})

/**
 * LOS ESTADOS DE ENTRADA (F1B-06, D7 de `design.md`, RQ-TC-07). No existía un invariante de alcanzabilidad: el 1
 * deriva estados de `from`/`to`, y un estado que sólo figura como `from` pasa igual. Este fija cuáles no tienen
 * transición de entrada en la unión y por qué: `Remisión creada` la aplica n8n, `OV asignada` la pone Zoho, y
 * `Ticket creado` y `Solicitud Soporte` son los dos estados de NACIMIENTO que decide `estadoInicialDelAlta`.
 */
describe('estados de entrada de la unión (F1B-06, D7)', () => {
  const UNION = [...TRANSITIONS, ...TRANSITIONS_EQUIPO_NUEVO, ...TRANSITIONS_SOPORTE_REMOTO]

  it('los estados sin transición de entrada son exactamente Remisión creada, OV asignada, Ticket creado y Solicitud Soporte', () => {
    const conEntrada = new Set(UNION.map((t) => t.to))
    const sinEntrada = ESTADOS.filter((e) => !conEntrada.has(e))
    expect(sinEntrada.sort()).toEqual(['OV asignada', 'Remisión creada', 'Solicitud Soporte', 'Ticket creado'])
  })

  it('cada clasificación nace en un estado declarado, con salida, y los de nacimiento son exactamente Ticket creado y Solicitud Soporte', () => {
    expect(CLASIFICACIONES).toHaveLength(3)
    for (const c of CLASIFICACIONES) {
      const inicial = estadoInicialDelAlta(c)
      expect(ESTADOS.includes(inicial as never), `«${c}» nace en «${inicial}», que no es un estado declarado`).toBe(true)
      expect(transicionesDelTicket({ classification: c, status: inicial }).length, `«${c}» nace en «${inicial}» sin ninguna transición de salida`).toBeGreaterThan(0)
    }
    expect([...new Set(CLASIFICACIONES.map((c) => estadoInicialDelAlta(c)))].sort()).toEqual(['Solicitud Soporte', 'Ticket creado'])
  })
})
