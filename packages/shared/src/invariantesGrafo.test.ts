import { describe, it, expect } from 'vitest'
import {
  TRANSITIONS, TRANSITIONS_EQUIPO_NUEVO, TRANSITIONS_SOPORTE_REMOTO, TRANSICION_REMISION_CONFIRMADA, TRANSICION_REMISION_RETIRADA, STATUS_TICKET_CREADO, STATUS_REMISION_CREADA, type Transition,
} from './transitions'
import { ESTADOS, ESTADOS_SERVICIO, ESTADOS_SOLO_EQUIPO_NUEVO, ESTADOS_SOLO_SOPORTE_REMOTO, CLASIFICACION_EN_ESPERA, ESTADOS_SIN_SALIDA } from './estados'
import { camposFechaReentrantes, componentesFuertementeConexos } from './reentrancia'; import { FASE_POR_ESTADO } from './fasesBlueprint'; import { CLAVE_NUMERO_FACTURA, CLAVE_FECHA_FACTURA } from './facturar'; import { estadoInicialDelAlta, transicionesDelTicket } from './flujos'; import { CLASIFICACIONES } from './ticketCreate'; import { CLAVE_CERTIFICADO_FABRICA } from './gasPatron'; import { entradasAPorFacturarSinControlCalidad } from './controlCalidad'; import { tipoEventoDeTransicion } from './tipoEvento' // F1C-08 (RQ-TS-56): en esta línea para no desplazar citas

/**
 * LOS SIETE INVARIANTES DEL GRAFO (§2 del proposal F0-04).
 *
 * Cinco tandas de la Fase 1 tocan `transitions.ts` —F1A-01, F1B-06, F1C-02, F1C-05 y C9—. F1B-06
 * añade catálogos al registro de flujos (`flujos.ts`); la red cubre la unión, y ninguna de las cinco
 * puede romper el de servicio técnico sin que nada dé rojo. Esto es esa red.
 *
 * ⚠️ SE AFIRMA SOBRE `TRANSITIONS`, NUNCA SOBRE `TRANSICIONES_BASE`.
 * `TRANSITIONS = TRANSICIONES_BASE.map(...)` (`transitions.ts:295-298`) y es lo que consumen
 * `transitionsForStatus` y `transitionById` (`:301-307`), o sea lo que ejecuta el servidor por
 * `ticketService`. Hoy las dos listas son idénticas, pero el comentario de `transitions.ts:292-293` ya
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
   * INVARIANTE 2 — el recuento. Atrapa la transición perdida al editar un array de 31 entradas.
   *
   * Vale menos que los demás y por eso va acompañado: un número solo no dice QUÉ se perdió. Va con
   * el conjunto de ids, que sí lo dice.
   */
  it('2 · 40 transiciones sobre 23 estados', () => {
    expect(TRANSITIONS).toHaveLength(40)
    expect(ESTADOS_SERVICIO).toHaveLength(23)
    expect(new Set(TRANSITIONS.map((t) => t.id)).size, 'hay ids repetidos').toBe(40)
  })

  /**
   * INVARIANTE 3 — `Finalizado` es el único callejón sin salida.
   *
   * Un estado sin salida introducido por descuido deja tickets clavados sin que nadie pueda moverlos
   * desde la interfaz, y no hay pantalla que lo avise: la de transiciones simplemente sale vacía.
   */
  it('3 · Finalizado y Anulado son los únicos estados sin transición de salida (F1C-01)', () => {
    const conSalida = new Set(TRANSITIONS.flatMap((t) => t.from))
    const sinSalida = ESTADOS_SERVICIO.filter((e) => !conSalida.has(e))
    expect(sinSalida).toEqual(['Finalizado', 'Anulado'])
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
   * INVARIANTE 5 — el CONJUNTO de las siete compartidas, emparejado id → área. Fija M1.9.1.
   *
   * ⚠️ Se afirma el emparejamiento, NO el número. «Exactamente 7» pasa igual si alguien cambia
   * `rechazo_comercial` de `Comercial / Servicio Técnico` a `Comercial / Compras`: siguen siendo siete,
   * con otro significado, y la matriz de F1C-05 se construye mal sin que nada dé rojo.
   */
  it('5 · las siete compartidas son estas, cada una con su pareja de áreas', () => {
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
      // rechazo_cliente: 'Comercial' desde F1C-10 (E-114); ya no es compartida.
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
   * ausente, porque las 31 de `TRANSITIONS` siempre lo llevan. Ninguna de las dos mueve el ocho
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
   * Los doce (diez hasta F1C-07, once hasta F1C-02, diez hasta F1C-05) son la entrada de F1C-02, F1C-06, C9 y la spec `kpis`: cada uno es un campo que una
   * segunda pasada por su ciclo vuelve a escribir. La tabla completa —componente por componente y
   * cruzada con G.6— está en `reentrancia.test.ts`; aquí va sólo el conjunto, que es lo que no puede
   * crecer en silencio.
   */
  it('6 · los campos de fecha reentrantes son exactamente estos doce (diez hasta F1C-07; F1C-08 suma los dos del escape, RQ-TS-57)', () => {
    expect(camposFechaReentrantes()).toEqual([
      'Fecha Recepción de repuestos',
      'Fecha Orden de Compra',
      'Fecha Orden De Venta',
      'Fecha Orden de Compra Final',
      'Fecha Orden de Venta Final', 'Fecha Notificación por garantía',
      'Fecha de Cotización',
      'Fecha solicitud SKU', 'Fecha Revisión Informe',
      'Fecha Salida Servicio externo',
      'Fecha Entrada de servicio externo', 'Fecha Finalización ST', // F1C-07 (S-16): el envío a control de calidad entra en el ciclo En Proceso ⇄ Control de calidad; en la misma línea para no desplazar citas
      // 'Fecha prevista de facturación' y 'Fecha Remisión de Salida' salieron con F1C-02: el ciclo de cierre ya no existe (RQ-TS-43)
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

  it('la unión tiene 52 entradas (40 + 7 + 5), con ids únicos', () => {
    expect(UNION).toHaveLength(52)
    expect(new Set(UNION.map((t) => t.id)).size, 'hay ids repetidos entre los tres catálogos').toBe(52)
  })

  it('3 · sin salida en la unión es exactamente Finalizado y Anulado (F1C-01)', () => {
    const conSalida = new Set(UNION.flatMap((t) => t.from))
    const sinSalida = ESTADOS.filter((e) => !conSalida.has(e))
    expect(sinSalida).toEqual(['Finalizado', 'Anulado'])
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

  it('RQ-EN-01 · las siete transiciones cubren exactamente los pares del catálogo, y las salidas de Verificación son exactamente liberación, rechazo de verificación y anulación', () => {
    expect(TRANSITIONS_EQUIPO_NUEVO.map((t) => [t.id, t.from, t.to])).toEqual([
      ['ingreso_equipo_nuevo', ['Ingresado'], 'En Proceso'],
      ['producto_no_conforme', ['En Proceso'], 'Notificado'],
      ['analisis_y_acciones', ['Notificado'], 'Ingresado'],
      ['verificacion', ['En Proceso'], 'Verificación'],
      ['liberacion', ['En Proceso', 'Verificación'], 'Finalizado'],
      ['rechazo_verificacion', ['Verificación'], 'Notificado'], ['anulacion_equipo_nuevo', ['Ingresado', 'En Proceso', 'Notificado', 'Verificación'], 'Anulado'],
    ])
    const salidasDeVerificacion = TRANSITIONS_EQUIPO_NUEVO.filter((t) => t.from.includes('Verificación')).map((t) => t.id)
    expect(salidasDeVerificacion).toEqual(['liberacion', 'rechazo_verificacion', 'anulacion_equipo_nuevo'])
  })

  it('corrección (b) · las seis de trabajo de Equipo nuevo declaran comentario y derivación (liberacion, además, el certificado) y la séptima, de Comercial, el motivo (F1C-01)', () => {
    for (const t of TRANSITIONS_EQUIPO_NUEVO) {
      expect(t.area, `${t.id} no es de Servicio Técnico (E-226)`).toBe(t.id === 'anulacion_equipo_nuevo' ? 'Comercial' : 'Servicio Técnico')
      expect(t.fields.map((f) => f.key), `${t.id} declara campos de negocio de más`).toEqual(t.id === 'anulacion_equipo_nuevo' ? ['comment', 'Motivo de anulación', 'Detalle del motivo de anulación'] : t.id === 'liberacion' ? ['comment', 'certificado_fabrica', 'derivado_a'] : ['comment', 'derivado_a'])
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
    expect(diferencia).toEqual(['Solicitud Soporte', 'Pendiente'])
  })

  it('RQ-SR-01 · las cinco cubren exactamente los pares del catálogo', () => {
    expect(TRANSITIONS_SOPORTE_REMOTO.map((t) => [t.id, t.from, t.to])).toEqual([
      ['asignacion_soporte', ['Solicitud Soporte'], 'En Proceso'],
      ['ejecutar_soporte', ['En Proceso'], 'Finalizado'],
      ['soporte_pendiente', ['En Proceso'], 'Pendiente'],
      ['continuacion_soporte', ['Pendiente'], 'En Proceso'], ['anulacion_soporte', ['En Proceso', 'Pendiente'], 'Anulado'],
    ])
  })

  it('S-5 · las salidas de Solicitud Soporte son exactamente asignacion_soporte', () => {
    const salidas = TRANSITIONS_SOPORTE_REMOTO.filter((t) => t.from.includes('Solicitud Soporte')).map((t) => t.id)
    expect(salidas).toEqual(['asignacion_soporte'])
  })

  it('corrección (b) · las cuatro de trabajo declaran comentario y derivación y son de Servicio Técnico; la quinta, de Comercial, el motivo (F1C-01)', () => {
    expect(TRANSITIONS_SOPORTE_REMOTO).toHaveLength(5)
    for (const t of TRANSITIONS_SOPORTE_REMOTO) {
      expect(t.area, `${t.id} no es de Servicio Técnico (S-1)`).toBe(t.id === 'anulacion_soporte' ? 'Comercial' : 'Servicio Técnico')
      expect(t.fields.map((f) => f.key), `${t.id} declara campos de negocio de más`).toEqual(t.id === 'anulacion_soporte' ? ['comment', 'Motivo de anulación', 'Detalle del motivo de anulación'] : ['comment', 'derivado_a'])
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

/**
 * El campo `certificado_fabrica` de `liberacion` (F1A-03, RQ-EN-10): la obligatoriedad es contextual y la impone el
 * servidor (`erroresCertificado`), no el catálogo. Marcarlo `required` rompería la liberación sin equipo.
 */
describe('liberacion · el campo del certificado de fábrica', () => {
  const campo = TRANSITIONS_EQUIPO_NUEVO.find((t) => t.id === 'liberacion')!.fields.find((f) => f.key === 'certificado_fabrica')
  it('EN10-6 · es de texto, no obligatorio y se guarda como campo propio', () => {
    expect(campo).toBeDefined()
    expect(campo).toMatchObject({ kind: 'text', required: false, target: 'customField' })
  })
  it('su clave es la de shared: dos copias vigiladas', () => {
    expect(campo?.key).toBe(CLAVE_CERTIFICADO_FABRICA)
  })
  it('EN01-8, EN08-10 · liberacion sigue saliendo de En Proceso y Verificación, y Finalizado es el único sin salida', () => {
    expect(TRANSITIONS_EQUIPO_NUEVO.find((t) => t.id === 'liberacion')!.from).toEqual(['En Proceso', 'Verificación'])
  })
})

/**
 * F1C-09 (E-103, E-106, E-119, E-140): tres transiciones salen del catálogo de servicio y
 * `diagnostico_complementario` pasa a salir de `En Proceso`. Se afirma por ids y no sólo por recuento.
 */
describe('F1C-09 · tres transiciones retiradas y el diagnóstico complementario', () => {
  it('ninguna de las tres ids retiradas sigue en los tres catálogos', () => {
    const ids = new Set([...TRANSITIONS, ...TRANSITIONS_EQUIPO_NUEVO, ...TRANSITIONS_SOPORTE_REMOTO].map((t) => t.id))
    for (const retirada of ['marcar_pendiente', 'servicio_externo_pendiente', 'servicio_externo_notificado']) {
      expect(ids.has(retirada), retirada).toBe(false)
    }
  })

  it('diagnostico_complementario sale sólo de En Proceso y sigue yendo a Continuación del proceso', () => {
    const t = TRANSITIONS.find((x) => x.id === 'diagnostico_complementario')!
    expect(t.from).toEqual(['En Proceso'])
    expect(t.to).toBe('Continuación del proceso')
  })

  it('Pendiente ya no es estado de servicio y sólo lo declara soporte remoto', () => {
    expect((ESTADOS_SERVICIO as readonly string[]).includes('Pendiente')).toBe(false)
    expect((ESTADOS_SOLO_SOPORTE_REMOTO as readonly string[]).includes('Pendiente')).toBe(true)
  })
})

/**
 * facturar-dos-ramas (F1C-02) · las dos ramas de cierre (RQ-TS-42, RQ-TS-43; `design.md` D4).
 *
 * El ciclo `Por Facturar` ⇄ `Por Entregar / Sin facturar` desaparece: la rama sin factura acaba en `Pendiente de
 * facturar`, de donde sólo se sale a `Finalizado`. Los cinco estados de cierre van escritos aquí a propósito: el
 * invariante tiene que fallar si un catálogo vuelve a enlazarlos en ciclo, y eso se comprueba ensuciando el CATÁLOGO
 * en memoria (regla de mutación 2), no tocando la prueba.
 */
const ESTADOS_DE_CIERRE = ['Por Facturar', 'Liberación Comercial', 'Por Entregar', 'Por Entregar / Sin facturar', 'Pendiente de facturar']
const cicloEnElCierre = (ts: Transition[]) => componentesFuertementeConexos(ts).filter((c) => c.some((e) => ESTADOS_DE_CIERRE.includes(e)))
const salidasDe = (ts: Transition[], estado: string) => ts.filter((t) => t.from.includes(estado))

describe('las dos ramas de cierre (F1C-02)', () => {
  it('RQ-TS-42 · el catálogo declara el estado, la rama sin factura y «Facturar»', () => {
    expect(TRANSITIONS.find((t) => t.id === 'entrega_sin_factura')!.to).toBe('Pendiente de facturar')
    const f = TRANSITIONS.find((t) => t.id === 'facturar')!
    expect([f.name, f.from, f.to, f.area]).toEqual(['Facturar', ['Pendiente de facturar'], 'Finalizado', 'Comercial'])
    const campo = (k: string) => f.fields.find((x) => x.key === k)
    expect([campo(CLAVE_NUMERO_FACTURA)?.kind, campo(CLAVE_NUMERO_FACTURA)?.required]).toEqual(['text', true])
    expect([campo(CLAVE_FECHA_FACTURA)?.kind, campo(CLAVE_FECHA_FACTURA)?.required]).toEqual(['date', true])
    expect((CLASIFICACION_EN_ESPERA as Record<string, string>)['Pendiente de facturar']).toBe('ninguna')
    expect((FASE_POR_ESTADO as Record<string, string>)['Pendiente de facturar']).toBe('cierre')
    expect((ESTADOS_SERVICIO as readonly string[]).includes('Pendiente de facturar')).toBe(true)
    expect((ESTADOS_SIN_SALIDA as readonly string[]).includes('Pendiente de facturar')).toBe(false)
  })

  it('RQ-TS-43 · ningún ciclo del grafo toca un estado de cierre', () => {
    expect(cicloEnElCierre(TRANSITIONS)).toEqual([])
  })

  it('RQ-TS-43 · de Pendiente de facturar sólo se sale con «Facturar», a Finalizado', () => {
    expect(salidasDe(TRANSITIONS, 'Pendiente de facturar').map((t) => [t.id, t.to])).toEqual([['facturar', 'Finalizado']])
  })

  it('RQ-TS-43 · mutación: un catálogo que vuelve a cerrar el ciclo lo pone en rojo', () => {
    const devuelta = TRANSITIONS.map((t) => (t.id === 'entrega_sin_factura' ? { ...t, to: 'Por Facturar' } : t))
    expect(cicloEnElCierre(devuelta)).not.toEqual([])
    const atras = [...TRANSITIONS, { ...TRANSITIONS.find((t) => t.id === 'facturar')!, id: 'reabrir', to: 'Por Facturar' }]
    expect(cicloEnElCierre(atras)).not.toEqual([])
    expect(salidasDe(atras, 'Pendiente de facturar').map((t) => t.to)).not.toEqual(['Finalizado'])
  })
})

/**
 * calibracion-directa (F1C-08, RQ-TS-56, D6, S-14) · la condición (3) como PROPIEDAD DEL GRAFO: con el interruptor encendido, las
 * únicas entradas a `Por Facturar` alcanzables desde `En Proceso` sin cruzar `Control de calidad` son los tres rechazos Decisionales
 * (el cliente no aprueba y no hay trabajo que liberar). Apagado, además `finalizacion_servicio`. Se rompe ensuciando el CATÁLOGO en
 * memoria (regla de mutación 2), no la prueba. El recorrido HTTP del atajo hasta `Por Facturar` es del lote 2.
 */
describe('F1C-08 · entradas a Por Facturar sin pasar por Control de calidad (RQ-TS-56)', () => {
  const ordenadas = (ts: Transition[], activo: boolean) => [...entradasAPorFacturarSinControlCalidad(ts, activo)].sort()
  const RECHAZOS = ['rechazo_cliente', 'rechazo_comercial', 'rechazo_revision']

  it('encendido: exactamente los tres rechazos, y los tres son Decisionales', () => {
    expect(ordenadas(TRANSITIONS, true)).toEqual(RECHAZOS)
    for (const id of RECHAZOS) expect(tipoEventoDeTransicion(id), `${id} no es Decisional`).toBe('Decisional')
  })

  it('apagado: finalizacion_servicio sí cuenta (el interruptor la quita al encender) y rechazo_revision no, porque el escape también cuelga del interruptor', () => {
    expect(ordenadas(TRANSITIONS, false)).toEqual(['finalizacion_servicio', 'rechazo_cliente', 'rechazo_comercial'])
  })

  it('rechazo_revision entra por el escape: sin falla_calibracion en memoria son dos', () => {
    const sinEscape = TRANSITIONS.filter((t) => t.id !== 'falla_calibracion')
    expect(ordenadas(sinEscape, true)).toEqual(['rechazo_cliente', 'rechazo_comercial'])
  })

  it('M3 · un atajo sucio a Por Facturar desde En Proceso hace crecer el conjunto', () => {
    const sucio = [...TRANSITIONS, { ...TRANSITIONS.find((t) => t.id === 'finalizacion_servicio')!, id: 'atajo_sucio' }]
    expect(ordenadas(sucio, true)).toContain('atajo_sucio')
    expect(ordenadas(sucio, true)).not.toEqual(RECHAZOS)
  })

  it('M3 · una Operativa de Rev./Diagnostico a Por Facturar también lo hace crecer', () => {
    const base = TRANSITIONS.find((t) => t.id === 'finalizacion_servicio')!
    const sucio = [...TRANSITIONS, { ...base, id: 'atajo_desde_diagnostico', from: ['Rev./Diagnostico'], to: 'Por Facturar' }]
    expect(tipoEventoDeTransicion('atajo_desde_diagnostico')).not.toBe('Decisional')
    expect(ordenadas(sucio, true)).toContain('atajo_desde_diagnostico')
  })
})

/**
 * salidas-esperas (F1C-03, RQ-TS-56 modificado, RQ-TS-62, RQ-TS-63, c3) · con `SALIDAS_ESPERAS` encendido la condición (3) gana una
 * cuarta entrada, `cobro_diagnostico_espera` (Decisional, sin reparación que liberar), y `Solicitado` y la espera de SKU no se abandonan
 * ni se anulan. Se rompe ensuciando el CATÁLOGO en memoria (regla de mutación 2), no la prueba. El tercer parámetro de
 * `entradasAPorFacturarSinControlCalidad` vale `false` por omisión: las pruebas de F1C-08 de arriba no cambian.
 */
describe('F1C-03 · las salidas de las esperas en el grafo (RQ-TS-56, RQ-TS-62, RQ-TS-63)', () => {
  const ordenadas = (ts: Transition[], cc: boolean, salidas: boolean) => [...entradasAPorFacturarSinControlCalidad(ts, cc, salidas)].sort()
  const RECHAZOS = ['rechazo_cliente', 'rechazo_comercial', 'rechazo_revision']
  const CUATRO = ['cobro_diagnostico_espera', ...RECHAZOS]
  const salidasDe = (ts: readonly Transition[], estado: string) => ts.filter((t) => t.from.includes(estado))

  it('encendidos los dos interruptores: cuatro entradas, las cuatro Decisionales', () => {
    expect(ordenadas(TRANSITIONS, true, true)).toEqual(CUATRO)
    for (const id of CUATRO) expect(tipoEventoDeTransicion(id), `${id} no es Decisional`).toBe('Decisional')
  })

  it('SALIDAS_ESPERAS apagado, el conjunto es el de F1C-08: tres, y el tercer parámetro vale false por omisión', () => {
    expect(ordenadas(TRANSITIONS, true, false)).toEqual(RECHAZOS)
    expect([...entradasAPorFacturarSinControlCalidad(TRANSITIONS, true)].sort()).toEqual(RECHAZOS)
    expect([...entradasAPorFacturarSinControlCalidad(TRANSITIONS, false)].sort()).toEqual(['finalizacion_servicio', 'rechazo_cliente', 'rechazo_comercial'])
  })

  it('control de calidad apagado y salidas encendidas: finalizacion_servicio y los dos rechazos sin escape, más el cobro', () => {
    expect(ordenadas(TRANSITIONS, false, true)).toEqual(['cobro_diagnostico_espera', 'finalizacion_servicio', 'rechazo_cliente', 'rechazo_comercial'])
  })

  it('RQ-TS-63 · Solicitado sale por entrega_repuestos y sin_pieza_en_almacen; la espera de SKU sólo por notif_cliente_sku', () => {
    expect(salidasDe(TRANSITIONS, 'Solicitado').map((t) => t.id).sort()).toEqual(['entrega_repuestos', 'sin_pieza_en_almacen'])
    expect(salidasDe(TRANSITIONS, 'En espera de SKU inventario').map((t) => t.id)).toEqual(['notif_cliente_sku'])
  })

  it('RQ-TS-63 · ninguna de las dos va a Anulado ni a Por Facturar, con o sin interruptor', () => {
    for (const estado of ['Solicitado', 'En espera de SKU inventario']) {
      for (const t of salidasDe(TRANSITIONS, estado)) expect(['Anulado', 'Por Facturar'], `${t.id} desde ${estado}`).not.toContain(t.to)
    }
  })

  it('M5 · anulacion también desde Solicitado o desde la espera de SKU rompe la invariante', () => {
    const anulacion = TRANSITIONS.find((t) => t.id === 'anulacion')!
    for (const origen of ['Solicitado', 'En espera de SKU inventario']) {
      const sucio = TRANSITIONS.map((t) => (t.id === 'anulacion' ? { ...anulacion, from: [...anulacion.from, origen] } : t))
      expect(salidasDe(sucio, origen).some((t) => t.to === 'Anulado'), `desde ${origen}`).toBe(true)
      expect(salidasDe(sucio, origen).map((t) => t.id).sort()).not.toEqual(salidasDe(TRANSITIONS, origen).map((t) => t.id).sort())
    }
  })

  it('M5 · el cobro también desde la espera de SKU, o una salida de Solicitado a Por Facturar, hace crecer el conjunto', () => {
    const cobro = TRANSITIONS.find((t) => t.id === 'cobro_diagnostico_espera')!
    const conSku = TRANSITIONS.map((t) => (t.id === 'cobro_diagnostico_espera' ? { ...cobro, from: [...cobro.from, 'En espera de SKU inventario'] } : t))
    expect(salidasDe(conSku, 'En espera de SKU inventario').some((t) => t.to === 'Por Facturar')).toBe(true)
    const solicitado = [...TRANSITIONS, { ...cobro, id: 'atajo_sucio', from: ['Solicitado'] }]
    expect(salidasDe(solicitado, 'Solicitado').some((t) => t.to === 'Por Facturar')).toBe(true)
    expect(ordenadas(solicitado, true, true)).toContain('atajo_sucio')
  })

  it('M5 · sin sin_pieza_en_almacen en memoria, Solicitado deja de tener sus dos salidas', () => {
    const sin = TRANSITIONS.filter((t) => t.id !== 'sin_pieza_en_almacen')
    expect(salidasDe(sin, 'Solicitado').map((t) => t.id)).toEqual(['entrega_repuestos'])
  })

  it('mutación sobre el catálogo en memoria · un atajo finalizacion_servicio renombrado a Por Facturar hace crecer el conjunto de las cuatro', () => {
    const sucio = [...TRANSITIONS, { ...TRANSITIONS.find((t) => t.id === 'finalizacion_servicio')!, id: 'atajo_sucio' }]
    expect(ordenadas(sucio, true, true)).toContain('atajo_sucio')
    expect(ordenadas(sucio, true, true)).not.toEqual(CUATRO)
  })

  it('la unión de catálogos tiene las dos ids una sola vez', () => {
    for (const id of ['cobro_diagnostico_espera', 'sin_pieza_en_almacen']) expect([...TRANSITIONS, ...TRANSITIONS_EQUIPO_NUEVO, ...TRANSITIONS_SOPORTE_REMOTO].filter((t) => t.id === id)).toHaveLength(1)
  })
})
