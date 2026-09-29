import { describe, it, expect } from 'vitest'
import { ALARMAS_SLA, SLA_HORAS_POR_ESTADO, destinatarioDelEscalado, estadosConAlarmaSinCargo, slaVencido } from './sla'
import { ESTADOS, ESTADOS_EN_ESPERA, ESTADOS_SIN_SALIDA } from './estados'
import { AREAS, CLAVE_DERIVACION, type DerivacionPorDefecto, type Transition } from './transitions'
import { CATALOGO_POR_FLUJO } from './flujos'

/** Una transición mínima con su casilla de derivación, para los grafos sintéticos de más abajo. */
const trans = (id: string, from: string, porDefecto: DerivacionPorDefecto): Transition => ({
  id, name: id, from: [from], to: 'Z', area: 'Servicio Técnico',
  fields: [{ key: CLAVE_DERIVACION, label: 'Derivado a', kind: 'usuario', required: false, target: 'derivacion', porDefecto }],
})

/**
 * C11 — EL RELOJ. F1A-02.
 *
 * El SLA de un día sobre `Notificado` existe en el blueprint de Zoho y la aplicación no lo trajo
 * (maestro M1.7, `R08.1.md:1570`; punto abierto nº 40). Es la ÚNICA regla por tiempo que el proceso
 * tiene, y hasta esta tanda el código no tenía ninguna: `R08.1.md:1588` lo dice como `[ABIERTO —
 * AS-BUILT]`, «no existe hoy ninguna transición por tiempo en el blueprint implementado».
 *
 * SE DECLARA COMO DATO, igual que `ESTADOS_SIN_SALIDA` y por la misma razón: es una decisión de
 * negocio y no una propiedad que el grafo pueda contestar. Nadie puede deducir de las 34 transiciones
 * que `Notificado` merece un día y `Pendiente` no.
 *
 * LA UNIDAD ES LA HORA, no el día, y no es cosmético: el propio maestro deja abierto el plazo de la
 * otra regla por tiempo en «24/48 h» (`:1586`). Declarar días obligaría a cambiar la unidad —y todas
 * las pruebas— el día que Gerencia elija 48.
 */
describe('C11 · el reloj del SLA', () => {
  it('declara las TRES alarmas de decision/anexo-3-alerta, en horas HÁBILES, y ninguna más', () => {
    // Se afirma el objeto entero, no un estado suelto: añadir o quitar una alarma es decisión de
    // Gerencia, y así aparece aquí en rojo en vez de colarse. Hasta 6516e5f era `{ 'Notificado': 24 }` de reloj.
    expect(SLA_HORAS_POR_ESTADO).toEqual({ 'Notificado': 9, 'Remisión creada': 27, 'Notificación cliente': 36 })
  })

  it('todo estado con SLA es un estado declarado del registro', () => {
    const declarados = new Set<string>(ESTADOS)
    const fantasmas = Object.keys(SLA_HORAS_POR_ESTADO).filter((e) => !declarados.has(e))
    expect(fantasmas, 'estados con SLA que no existen en el registro').toEqual([])
  })

  /**
   * LA COHERENCIA QUE §3.7 DE `transitions-st` PEDÍA — y desde F1B-08 se prueba por INDEPENDENCIA.
   *
   * `estados.ts:28` avisa: «La vista muestra las once. El reloj del SLA NO lee esta clasificación.»
   * En 6516e5f se probaba con exclusión (el único estado con SLA, `Notificado`, estaba fuera de las
   * once). Con tres alarmas eso ya no vale: `Remisión creada` y `Notificación cliente` SÍ están en la
   * vista. Lo que se prueba es que ninguna lista sale de la otra: hay alarmas dentro y fuera de las
   * once, y estados de espera sin alarma. Si el reloj leyera `ESTADOS_EN_ESPERA`, se pone roja.
   */
  it('el reloj y la vista no leen la misma lista: hay alarmas dentro y fuera de las once', () => {
    const conSla = Object.keys(SLA_HORAS_POR_ESTADO), espera = ESTADOS_EN_ESPERA as string[]
    expect([conSla.some((e) => espera.includes(e)), conSla.some((e) => !espera.includes(e))]).toEqual([true, true])
    expect(espera.some((e) => !conSla.includes(e)), 'algún estado de espera sin alarma').toBe(true)
  })

  // ── El cálculo, en horas HÁBILES: jornada 08:00-17:00 en ZONA_NEGOCIO (`calendarioLaboral.ts:174`) ──

  const sinCierres: ReadonlySet<string> = new Set()
  const lunes8 = new Date('2026-09-14T13:00:00.000Z') // lunes 14/09/2026, 08:00 en Bogotá (UTC-5)

  it('Notificado: 9 h hábiles exactas no vencen, ni fuera de jornada; el milisegundo siguiente sí', () => {
    expect(slaVencido('Notificado', lunes8, new Date('2026-09-14T22:00:00.000Z'), sinCierres)).toBe(false) // lunes 17:00
    expect(slaVencido('Notificado', lunes8, new Date('2026-09-15T04:00:00.000Z'), sinCierres)).toBe(false) // lunes 23:00
    expect(slaVencido('Notificado', lunes8, new Date('2026-09-15T13:00:00.000Z'), sinCierres)).toBe(false) // martes 08:00
    expect(slaVencido('Notificado', lunes8, new Date('2026-09-15T13:00:00.001Z'), sinCierres)).toBe(true)
  })

  it('un estado sin alarma no vence nunca', () => {
    expect(slaVencido('En Proceso', lunes8, new Date('2027-01-01T00:00:00.000Z'), sinCierres)).toBe(false)
  })

  /**
   * EL BORDE, y va en positivo y en negativo. Justo en el umbral NO está vencido: la comparación es
   * estricta. Antes del umbral tampoco, por mucho que se acerque.
   */
  it('antes del umbral no está vencido, por mucho que se acerque', () => {
    expect(slaVencido('Notificado', lunes8, new Date('2026-09-14T21:59:59.999Z'), sinCierres)).toBe(false)
    expect(slaVencido('Remisión creada', lunes8, new Date('2026-09-16T21:59:59.999Z'), sinCierres)).toBe(false)
    expect(slaVencido('Notificación cliente', lunes8, new Date('2026-09-17T21:59:59.999Z'), sinCierres)).toBe(false)
  })
})

/**
 * C11 · A QUIÉN SE ESCALA. F1A-02.
 *
 * La R08 amplía C11 con un escalado «al inmediato superior» (`R08.1.md:1574`) y dice **de dónde sale
 * el destinatario** en la línea siguiente, que es la que resuelve el problema:
 *
 *   `:1575` — «Encaja con la derivación de M1.9.2, que ya sabe a qué cargo corresponde cada etapa:
 *   el escalado puede apoyarse en esa misma tabla en lugar de mantener una jerarquía aparte.»
 *
 * Y la tabla ya lo trae. `DERIVACION_POR_DEFECTO` (`transitions.ts:267-276`) declara el cargo que
 * propone cada etapa, y su primera entrada lleva escrito el mismo concepto con las mismas palabras:
 * «escalar una revisión es **subirla al inmediato superior**» (`:268`).
 *
 * NO HACE FALTA UNA JERARQUÍA APARTE, y por eso este escalado se puede construir hoy: el
 * destinatario del escalado de un estado es **el cargo que proponen sus transiciones salientes**.
 * Para `Notificado` —el único estado con SLA— es `escalado_a_comercial` → `Coordinador Comercial`.
 *
 * LO QUE SIGUE SIENDO CIERTO es que no hay jerarquía GENERAL: nadie sabe quién está por encima de
 * quién fuera de las etapas que lo declaran. Por eso la función NO MIENTE sobre los demás estados —
 * devuelve «sin destinatario» con su motivo— en vez de inventar uno.
 */
describe('C11 · a quién se escala', () => {
  it('el escalado de Notificado va al Coordinador Comercial, vía escalado_a_comercial', () => {
    expect(destinatarioDelEscalado('Notificado')).toEqual({
      hay: true, cargo: 'Coordinador Comercial', via: ['escalado_a_comercial'],
    })
  })

  /**
   * El caso que impide que la función mienta. `En Proceso` no tiene ninguna saliente que proponga
   * cargo, así que no hay a quién escalar y hay que decirlo, no inventarlo.
   */
  it('un estado sin transición que proponga cargo no tiene destinatario', () => {
    expect(destinatarioDelEscalado('En Proceso')).toEqual({ hay: false, motivo: 'ningun_cargo' })
    expect(destinatarioDelEscalado('Por Facturar')).toEqual({ hay: false, motivo: 'ningun_cargo' })
  })

  /**
   * ⚠️ `primerDerivado` NO SIRVE PARA ESCALAR, y es el caso que más fácil se cuela.
   *
   * `Notificación cliente` sí tiene una saliente en la tabla —`aprobacion`— pero su propuesta es
   * `{ tipo: 'primerDerivado' }`: devolver el trabajo a quien tomó el ticket. Eso es exactamente lo
   * CONTRARIO de escalar. Una implementación que leyera la tabla sin mirar el `tipo` devolvería un
   * destinatario donde no lo hay.
   *
   * En 6516e5f `Notificación cliente` no tenía SLA; desde F1B-08 tiene alarma con cargo DECLARADO, y
   * esta prueba impide que el grafo le invente un destinatario que la contradiga (ver `:189`).
   */
  it('primerDerivado no es un cargo: no sirve para escalar', () => {
    expect(destinatarioDelEscalado('Notificación cliente')).toEqual({ hay: false, motivo: 'ningun_cargo' })
  })

  /**
   * ⚠️ DOS CARGOS DISTINTOS NO SE RESUELVEN ELIGIENDO EL PRIMERO.
   *
   * Hoy no ocurre —la prueba de coherencia de abajo lo fija—, así que con el grafo real una
   * implementación que devolviera «el primero que encuentre» daría el mismo resultado que ésta. Se
   * prueba con un grafo sintético porque es la única forma de que esa mutación tenga detector.
   *
   * Elegir el primero sería inventar un orden entre dos cargos, que es la misma clase de regla que
   * `DerivacionPorDefecto` evita al ser una unión y no dos campos sueltos (`transitions.ts:38-43`).
   */
  it('dos cargos distintos son ambiguos, y no se elige el primero', () => {
    const sintetico = [
      trans('sube_a_tecnica', 'X', { tipo: 'cargo', cargo: 'Director Técnico' }),
      trans('sube_a_comercial', 'X', { tipo: 'cargo', cargo: 'Coordinador Comercial' }),
    ]
    expect(destinatarioDelEscalado('X' as never, sintetico)).toEqual({ hay: false, motivo: 'ambiguo' })
  })

  /** El mismo cargo por dos caminos NO es ambiguo: el destinatario es uno, y se dicen los dos. */
  it('el mismo cargo por dos vías es un solo destinatario', () => {
    const sintetico = [
      trans('via_a', 'X', { tipo: 'cargo', cargo: 'Director Técnico' }),
      trans('via_b', 'X', { tipo: 'cargo', cargo: 'Director Técnico' }),
    ]
    expect(destinatarioDelEscalado('X' as never, sintetico)).toEqual({
      hay: true, cargo: 'Director Técnico', via: ['via_a', 'via_b'],
    })
  })

  /**
   * EL GUARDIÁN, y es el que importa para cualquier catálogo del registro de flujos: hoy NINGÚN estado del
   * registro es ambiguo. El día que una tanda declare un segundo cargo saliente sobre un estado que
   * ya tenía uno, esta prueba lo dice antes de que el escalado empiece a elegir en silencio.
   */
  it('hoy ningún estado del registro tiene un escalado ambiguo', () => {
    const ambiguos = ESTADOS.filter((e) => {
      const d = destinatarioDelEscalado(e)
      return !d.hay && d.motivo === 'ambiguo'
    })
    expect(ambiguos, 'estados con dos cargos salientes distintos').toEqual([])
  })

  /** Y los que SÍ tienen destinatario son exactamente estos dos. Se afirma la lista, no el número. */
  it('sólo dos estados tienen a quién escalar, y son los que declaran cargo', () => {
    const conDestinatario = ESTADOS.filter((e) => destinatarioDelEscalado(e).hay)
    expect(conDestinatario).toEqual(['Rev./Diagnostico', 'Notificado'])
  })

  /**
   * LA CONEXIÓN CON LA ALARMA (S-8): el cargo es DATO de `ALARMAS_SLA`, no sale del grafo. Pero si el
   * grafo propone un cargo para un estado con alarma, tiene que ser el mismo: dos fuentes que discrepan
   * sobre a quién se escala son el molde de H5. Hasta 6516e5f exigía «destinatario derivado del grafo».
   */
  it('todo estado con alarma declara cargo, y coincide con el del grafo si el grafo propone uno', () => {
    const choques = Object.keys(SLA_HORAS_POR_ESTADO).filter((e) => chocaConElGrafo(e as never))
    expect(choques, 'estados con alarma sin cargo, o con un cargo distinto del que propone el grafo').toEqual([])
  })

  /**
   * F1B-06 — el guardián de ambigüedad se extiende MÁS ALLÁ de `TRANSITIONS`: ningún estado de
   * NINGÚN catálogo del registro de flujos (`flujos.ts`) puede tener un escalado ambiguo. Con las
   * cinco entradas de `TRANSITIONS_EQUIPO_NUEVO` sin `porDefecto` (sólo comentario y derivación
   * heredada), hoy ninguna propone cargo — así que el catálogo EN no aporta ningún destinatario y,
   * por tanto, tampoco ninguna ambigüedad.
   */
  it('ningún estado de ningún catálogo del registro de flujos tiene un escalado ambiguo', () => {
    for (const catalogo of Object.values(CATALOGO_POR_FLUJO)) {
      const estados = new Set<string>(catalogo.flatMap((t) => [...t.from, t.to]))
      for (const estado of estados) {
        const d = destinatarioDelEscalado(estado as never, catalogo as Transition[])
        expect(!d.hay && d.motivo === 'ambiguo', `${estado} tiene un escalado ambiguo`).toBe(false)
      }
    }
  })
})

/** Un estado con alarma choca si no declara cargo, o si el grafo propone un cargo distinto (`:189`). */
function chocaConElGrafo(estado: Parameters<typeof destinatarioDelEscalado>[0]): boolean {
  const cargo = ALARMAS_SLA[estado]?.cargo.trim()
  const grafo = destinatarioDelEscalado(estado)
  return !cargo || (grafo.hay && grafo.cargo !== cargo)
}

/**
 * F1B-08 — LAS TRES ALARMAS EN HORAS HÁBILES (`alarmas-horas-habiles`, RQ-TS-15 y RQ-TS-16).
 *
 * El umbral se mide con `horasHabilesEntre` (`calendarioLaboral.ts:174`), no con un cálculo propio
 * (`decision/calendario-habil`): jornada 08:00-17:00 en `ZONA_NEGOCIO`, sin fines de semana, sin
 * festivos de Colombia y sin los cierres de `public.calendario_cierres`, que llegan por parámetro.
 * Todas las fechas son de 2026 en Bogotá (UTC-5, sin horario de verano), escritas en UTC.
 */
describe('F1B-08 · alarmas de SLA en horas hábiles', () => {
  const sinCierres: ReadonlySet<string> = new Set()

  /**
   * EL BORDE EXACTO CRUZANDO UN FIN DE SEMANA Y UN CIERRE. Entra el viernes 18/09 a las 14:00: 3 h
   * ese viernes; sábado y domingo no cuentan; el lunes 21/09 es cierre de empresa y no cuenta; el
   * martes 22/09 faltan 6 h, así que las 9 h hábiles se cumplen EXACTAMENTE el martes a las 14:00.
   * Sin el cierre, habrían vencido el lunes a las 14:00: la última aserción prueba que el cierre pesa.
   */
  it('9 h hábiles cruzando un fin de semana y un cierre: el martes 14:00 no vence, +1 ms sí', () => {
    const viernes14 = new Date('2026-09-18T19:00:00.000Z')
    const cierreLunes: ReadonlySet<string> = new Set(['2026-09-21'])
    expect(slaVencido('Notificado', viernes14, new Date('2026-09-22T19:00:00.000Z'), cierreLunes)).toBe(false)
    expect(slaVencido('Notificado', viernes14, new Date('2026-09-22T19:00:00.001Z'), cierreLunes)).toBe(true)
    expect(slaVencido('Notificado', viernes14, new Date('2026-09-21T19:00:00.001Z'), cierreLunes)).toBe(false)
    expect(slaVencido('Notificado', viernes14, new Date('2026-09-21T19:00:00.001Z'), sinCierres)).toBe(true)
  })

  it('el fin de semana no cuenta: viernes 16:00 → lunes 16:00 no vence, +1 ms sí', () => {
    const viernes16 = new Date('2026-09-18T21:00:00.000Z')
    expect(slaVencido('Notificado', viernes16, new Date('2026-09-21T21:00:00.000Z'), sinCierres)).toBe(false)
    expect(slaVencido('Notificado', viernes16, new Date('2026-09-21T21:00:00.001Z'), sinCierres)).toBe(true)
  })

  it('un festivo no cuenta: viernes 09/10 12:00, lunes 12/10 festivo → martes 12:00 no vence, +1 ms sí', () => {
    const viernes12 = new Date('2026-10-09T17:00:00.000Z')
    expect(slaVencido('Notificado', viernes12, new Date('2026-10-12T22:00:00.000Z'), sinCierres)).toBe(false)
    expect(slaVencido('Notificado', viernes12, new Date('2026-10-13T17:00:00.000Z'), sinCierres)).toBe(false)
    expect(slaVencido('Notificado', viernes12, new Date('2026-10-13T17:00:00.001Z'), sinCierres)).toBe(true)
  })

  it('un cierre de empresa no cuenta: lunes 12:00, martes cerrado → miércoles 12:00 no vence, +1 ms sí', () => {
    const lunes12 = new Date('2026-09-14T17:00:00.000Z')
    const cierreMartes: ReadonlySet<string> = new Set(['2026-09-15'])
    expect(slaVencido('Notificado', lunes12, new Date('2026-09-16T17:00:00.000Z'), cierreMartes)).toBe(false)
    expect(slaVencido('Notificado', lunes12, new Date('2026-09-16T17:00:00.001Z'), cierreMartes)).toBe(true)
  })

  it('Remisión creada vence pasadas 27 h hábiles exactas; Notificación cliente, 36', () => {
    const lunes8 = new Date('2026-09-14T13:00:00.000Z')
    expect(slaVencido('Remisión creada', lunes8, new Date('2026-09-16T22:00:00.000Z'), sinCierres)).toBe(false) // miércoles 17:00
    expect(slaVencido('Remisión creada', lunes8, new Date('2026-09-17T13:00:00.001Z'), sinCierres)).toBe(true) // jueves 08:00
    expect(slaVencido('Notificación cliente', lunes8, new Date('2026-09-17T22:00:00.000Z'), sinCierres)).toBe(false) // jueves 17:00
    expect(slaVencido('Notificación cliente', lunes8, new Date('2026-09-18T13:00:00.001Z'), sinCierres)).toBe(true) // viernes 08:00
  })

  /**
   * EL BORDE FRACCIONARIO, medido y no supuesto. `Remisión creada` entra el lunes a las 08:02 y se
   * evalúa el jueves a las 08:02: son 27 h hábiles exactas, pero `horasHabilesEntre` las suma en
   * tramos fraccionarios y devuelve 27,000000000000004 (sondeo del 2026-09-29 sobre 9.720 entradas
   * de los tres umbrales: 220 casos por encima del umbral exacto). Sin el redondeo a milisegundo de `slaVencido` vencería EN el umbral. Con 9 h y
   * entrada a las 08:20 no pasa, y por eso no sirve de fixture.
   */
  it('borde fraccionario: Remisión creada lunes 08:02 → jueves 08:02 son 27 h exactas y no vencen', () => {
    const lunes0802 = new Date('2026-09-14T13:02:00.000Z')
    expect(slaVencido('Remisión creada', lunes0802, new Date('2026-09-17T13:02:00.000Z'), sinCierres)).toBe(false)
    expect(slaVencido('Remisión creada', lunes0802, new Date('2026-09-17T13:02:00.001Z'), sinCierres)).toBe(true)
  })

  it('ninguna alarma está en un estado sin salida', () => {
    const conSla = Object.keys(SLA_HORAS_POR_ESTADO)
    expect(conSla.filter((e) => (ESTADOS_SIN_SALIDA as string[]).includes(e))).toEqual([])
  })

  // ── ALARMAS_SLA: qué se hace al vencer (RQ-TS-16, S-4 y S-8) ────────────────────────────────

  it('ALARMAS_SLA y SLA_HORAS_POR_ESTADO tienen exactamente las mismas claves', () => {
    expect(Object.keys(ALARMAS_SLA).sort()).toEqual(Object.keys(SLA_HORAS_POR_ESTADO).sort())
  })

  it('las tres escalan al Coordinador Comercial, con el área Comercial de respaldo', () => {
    for (const alarma of Object.values(ALARMAS_SLA)) {
      expect(alarma).toMatchObject({ cargo: 'Coordinador Comercial', areaRespaldo: 'Comercial' })
      expect(AREAS as readonly string[]).toContain(alarma!.areaRespaldo)
    }
  })

  it('sólo Remisión creada mira la orden de venta y sólo Notificación cliente marca el tablero', () => {
    const conOv = Object.entries(ALARMAS_SLA).filter(([, a]) => a?.soloSinOrdenVenta).map(([e]) => e)
    const conMarca = Object.entries(ALARMAS_SLA).filter(([, a]) => a?.marcaTablero).map(([e]) => e)
    expect([conOv, conMarca]).toEqual([['Remisión creada'], ['Notificación cliente']])
  })

  it('ninguna alarma real está sin cargo', () => {
    expect(estadosConAlarmaSinCargo(), 'alarmas sin cargo declarado').toEqual([])
  })

  it('una alarma con el cargo vacío o sólo espacios se detecta y se nombra', () => {
    const sintetica = {
      'Notificado': { cargo: 'Coordinador Comercial', areaRespaldo: 'Comercial' as const },
      'Remisión creada': { cargo: '   ', areaRespaldo: 'Comercial' as const },
      'Notificación cliente': { cargo: '', areaRespaldo: 'Comercial' as const },
    }
    expect(estadosConAlarmaSinCargo(sintetica)).toEqual(['Remisión creada', 'Notificación cliente'])
  })
})
