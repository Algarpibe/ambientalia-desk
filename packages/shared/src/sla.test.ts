import { describe, it, expect } from 'vitest'
import { SLA_HORAS_POR_ESTADO, destinatarioDelEscalado, slaVencido, venceSlaEn } from './sla'
import { ESTADOS, ESTADOS_EN_ESPERA, ESTADOS_SIN_SALIDA } from './estados'
import { CLAVE_DERIVACION, type DerivacionPorDefecto, type Transition } from './transitions'
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
  it('declara UN solo SLA, y es el único que el maestro decidió', () => {
    // Se afirma el objeto entero, no `Notificado` suelto: añadir un estado con SLA es una decisión de
    // Gerencia, y así aparece aquí en rojo en vez de colarse.
    expect(SLA_HORAS_POR_ESTADO).toEqual({ 'Notificado': 24 })
  })

  it('todo estado con SLA es un estado declarado del registro', () => {
    const declarados = new Set<string>(ESTADOS)
    const fantasmas = Object.keys(SLA_HORAS_POR_ESTADO).filter((e) => !declarados.has(e))
    expect(fantasmas, 'estados con SLA que no existen en el registro').toEqual([])
  })

  /**
   * LA COHERENCIA QUE §3.7 DE `transitions-st` PEDÍA, Y QUE HASTA HOY ERA HIPOTÉTICA.
   *
   * `estados.ts:28` avisa: «La vista muestra las once. El reloj del SLA NO lee esta clasificación.»
   * Era una advertencia sin caso que la demostrase. Ya lo hay: el ÚNICO estado con SLA está
   * clasificado `ninguna` (`estados.ts:91`), así que no es ninguno de los once de la vista ni de los
   * cuatro sin salida. Si alguien «arreglara» el reloj haciéndolo leer `ESTADOS_EN_ESPERA`, esta
   * prueba se pone roja.
   */
  it('el reloj y la vista no leen la misma lista: el único estado con SLA no está en las once', () => {
    const conSla = Object.keys(SLA_HORAS_POR_ESTADO)
    expect(conSla.filter((e) => (ESTADOS_EN_ESPERA as string[]).includes(e))).toEqual([])
    expect(conSla.filter((e) => (ESTADOS_SIN_SALIDA as string[]).includes(e))).toEqual([])
  })

  // ── El cálculo ───────────────────────────────────────────────────────────────────────────────

  const entro = new Date('2026-09-01T10:00:00.000Z')

  it('vence exactamente 24 h después de entrar en el estado', () => {
    expect(venceSlaEn('Notificado', entro)).toEqual(new Date('2026-09-02T10:00:00.000Z'))
  })

  it('un estado sin SLA no vence nunca', () => {
    expect(venceSlaEn('En Proceso', entro)).toBeNull()
    expect(slaVencido('En Proceso', entro, new Date('2027-01-01T00:00:00.000Z'))).toBe(false)
  })

  /**
   * EL BORDE, y va en positivo y en negativo. Justo en el vencimiento NO está vencido: un SLA de «un
   * día» que salta a las 23:59:59.999 no es un día. El milisegundo siguiente sí.
   */
  it('en el instante exacto del vencimiento todavía no está vencido', () => {
    expect(slaVencido('Notificado', entro, new Date('2026-09-02T10:00:00.000Z'))).toBe(false)
    expect(slaVencido('Notificado', entro, new Date('2026-09-02T10:00:00.001Z'))).toBe(true)
  })

  it('antes del vencimiento no está vencido, por mucho que se acerque', () => {
    expect(slaVencido('Notificado', entro, new Date('2026-09-02T09:59:59.999Z'))).toBe(false)
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
   * Y no cambia nada para C11 —`Notificación cliente` no tiene SLA—, así que sin esta prueba el
   * error viviría escondido hasta que alguien declarara un SLA sobre ese estado.
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
   * LA CONEXIÓN CON EL RELOJ: el único estado con SLA tiene destinatario. Si mañana se declara un
   * SLA sobre un estado sin escalado saliente, esta prueba lo dice — el reloj mediría un retraso que
   * no se le puede comunicar a nadie.
   */
  it('todo estado con SLA declarado tiene a quién escalar', () => {
    const mudos = Object.keys(SLA_HORAS_POR_ESTADO).filter((e) => !destinatarioDelEscalado(e as never).hay)
    expect(mudos, 'estados con SLA y sin destinatario de escalado').toEqual([])
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
