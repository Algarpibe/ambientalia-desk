// Los tres bodegajes de M1.10 — corrección C9, punto abierto nº 41.
//
// Bodegaje es el tiempo que un equipo pasa en Ambientalia esperando una respuesta del cliente
// (`R08.1.md:1686`). No mide el desempeño del taller: mide la demora del cliente, y por eso nunca
// debe sumarse a un indicador de servicio. Son exactamente los periodos que C7 tiene que descontar
// del reloj del SLA (`:1706`).
//
// ⚠️ ESTE MÓDULO NO LEE `tickets.*`, Y NO ES UNA PREFERENCIA DE ESTILO. Es la regla que F0-04 dejó
// escrita en `reentrancia.ts:24` —«Los KPIs de G.6 se calculan sobre `ticket_transitions.values`, no
// sobre `tickets.*`»— y éste es el primer módulo obligado a obedecerla. CUATRO de los cinco
// operandos que ya existían son reentrantes: `Fecha Orden De Venta`, `Fecha Orden de Compra`,
// `Fecha de Cotización` y `Fecha Remisión de Salida` están en los diez del invariante 6
// (`invariantesGrafo.test.ts:137-149`), y los cuatro son además OBLIGATORIOS, así que la segunda
// pasada por el ciclo PISA SIEMPRE. La columna guarda el último valor; el historial, todos.
//
// El efecto es cuantificable y sale en `bodegaje.test.ts` nº 6: un ticket que da dos vueltas al ciclo
// de cotización tiene DOS bodegajes de proceso. Leído por columna sale uno, el de la última vuelta,
// y el tiempo de la primera desaparece.

import { TRANSITIONS } from './transitions'

export type ClaseBodegaje = 'entrada' | 'proceso' | 'salida'

/**
 * Una fila de la tabla de M1.10 (`R08.1.md:1687-1702`), como dato.
 *
 * Va DECLARADA y no derivada, igual que `SLA_HORAS_POR_ESTADO` (`sla.ts:32`) y `ESTADOS_SIN_SALIDA`
 * (`estados.ts:140`), y por la misma razón: de las 34 transiciones no se deduce que la espera del
 * cliente empiece en la remisión de entrada y no en la fecha de creación del ticket. Es una decisión
 * de negocio, la firma la R08, y derivarla sería inventarla.
 */
export interface DefinicionBodegaje {
  clase: ClaseBodegaje
  /** Etiqueta del campo de fecha cuyo valor ABRE el periodo. */
  abre: string
  /** Etiqueta del campo de fecha cuyo valor lo CIERRA. */
  cierra: string
  /** El hecho del mundo que abre el periodo, con la línea del maestro que lo dice. */
  empiezaCuando: string
  terminaCuando: string
}

/**
 * EL CAMPO QUE FALTABA. `:1704` — «No hay ninguna columna que registre cuándo se avisó al cliente de
 * que el equipo estaba listo. La columna 51 lo aproxima con la hora del último cambio de estado, que
 * no es lo mismo: si el aviso se demora dos días respecto a la finalización, esos dos días son de
 * Ambientalia y el indicador se los atribuye al cliente.»
 *
 * Lo escribe `habilitado_para_entrega` (`transitions.ts:252`), que es «la propia transición que
 * habilita la entrega» del mismo párrafo, y va OBLIGATORIO: ver la prueba nº 4.
 */
export const CAMPO_AVISO_CLIENTE = 'Fecha de aviso al cliente'

/**
 * Los tres, en el orden de la tabla del maestro. Es también el orden en que se devuelven los
 * periodos, que resulta ser el cronológico de un ticket normal sin que haya que ordenarlo.
 */
export const BODEGAJES: DefinicionBodegaje[] = [
  {
    clase: 'entrada',
    abre: 'Fecha Remisión Entrada',
    cierra: 'Fecha Orden De Venta',
    empiezaCuando: 'El equipo llega a las instalaciones (:1692)',
    terminaCuando: 'Llega la orden de compra del cliente y se genera la orden de venta (:1693)',
  },
  {
    clase: 'proceso',
    abre: 'Fecha de Cotización',
    cierra: 'Fecha Orden de Compra',
    empiezaCuando: 'Se envía al cliente la cotización de la reparación (:1696)',
    terminaCuando: 'El cliente la aprueba con su orden de compra (:1697)',
  },
  {
    clase: 'salida',
    abre: CAMPO_AVISO_CLIENTE,
    cierra: 'Fecha Remisión de Salida',
    empiezaCuando: 'Se avisa al cliente de que puede recoger el equipo (:1700)',
    terminaCuando: 'El cliente lo recoge (:1701)',
  },
]

/**
 * EL HITO DE LOS OTROS DOS INDICADORES ROTOS, que NO son bodegajes.
 *
 * `:2330` nombra tres averiados por la creación anticipada de tickets: el bodegaje de ingreso (56),
 * el tiempo de inicio de servicio (48) y el tiempo de diagnóstico (49). El 56 lo resuelve la tabla de
 * arriba; los otros dos siguen necesitando un ancla, y ésa sí es la marca de tiempo de esta
 * transición (`:1684`, `:3062`) — la que «registra la llegada física y exige adjuntar la remisión de
 * entrada».
 *
 * Se declara por `id` y no por `name` a propósito: hay dos pares de transiciones que comparten
 * nombre (`cal_sensores_*`, `servicio_externo_*`), así que el nombre no identifica.
 */
export const HITO_INDICADORES_ROTOS = 'ingreso_a_servicio'

/**
 * Un paso del historial: una fila de `ticket_transitions` tal como la escribe `repo.ts:282-286`.
 *
 * NO se reutiliza `HistorialTransition` (`types.ts:421`) aunque se parezca: aquella es el tipo de la
 * línea de tiempo de la pantalla —lleva comentario y adjuntos, y NO lleva `values` ni `transitionId`,
 * que es justo lo que este módulo necesita—. Compartirlo obligaría a una de las dos a cargar con
 * campos que no usa.
 */
export interface PasoDelHistorial {
  transitionId: string
  /** Marca de tiempo de la ejecución, en ISO. Es la que ordena el recorrido. */
  performedAt: string
  /** `ticket_transitions.values`, `jsonb`: lo que se escribió en esa etapa. */
  values: Record<string, unknown>
}

/** Un periodo cerrado. Las fechas son las de los CAMPOS, no las de las marcas de tiempo. */
export interface PeriodoBodegaje {
  clase: ClaseBodegaje
  desde: string
  hasta: string
  dias: number
}

const MS_POR_DIA = 86_400_000

/**
 * El día de un valor de `values`, o `null` si no hay fecha legible.
 *
 * `values` es `jsonb` y nadie garantiza su forma. Lo ilegible se ignora en vez de convertirse en
 * `NaN` o en el epoch: un bodegaje de veinte mil días es un fallo que se cuela en un promedio, y un
 * `NaN` envenena la suma entera sin decir cuál lo hizo.
 */
function dia(valor: unknown): string | null {
  if (typeof valor !== 'string' || !valor.trim()) return null
  const t = Date.parse(valor)
  return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10)
}

/** Días completos entre dos días. Nunca negativo: ver `periodosDeBodegaje`. */
function diasEntre(desde: string, hasta: string): number {
  const d = Math.floor((Date.parse(hasta) - Date.parse(desde)) / MS_POR_DIA)
  return d > 0 ? d : 0
}

/** El historial ordenado por marca de tiempo, sin tocar la lista que llega. */
function enOrden(historial: PasoDelHistorial[]): PasoDelHistorial[] {
  return [...historial].sort((a, b) => Date.parse(a.performedAt) - Date.parse(b.performedAt))
}

/**
 * Los periodos de bodegaje de un ticket, recorriendo su historial.
 *
 * LAS TRES REGLAS DEL RECORRIDO, escritas para que no se descubran tropezando:
 *
 * 1. **El periodo lo abre la PRIMERA fecha, y sólo un cierre lo vuelve a dejar libre.** Recotizar
 *    (`notif_recotizacion`, `transitions.ts:254`) escribe otra `Fecha de Cotización` sin que haya
 *    llegado ninguna orden de compra. Si eso abriera un periodo nuevo, el tiempo entre la primera
 *    cotización y la segunda desaparecería del cómputo — y el equipo lo pasó en Ambientalia igual.
 *
 * 2. **Un cierre sin periodo abierto se guarda, y el primer `abre` posterior produce cero días.**
 *    Es el caso que rompió el indicador en 2026: Comercial da de alta el ticket con su orden de venta
 *    ANTES de que el equipo llegue (`:1682`), así que el hecho que cierra ocurrió antes que el que
 *    abre. Cero días es un dato —el equipo no esperó—; devolver «nada» sacaría estos tickets del
 *    promedio y lo dejaría midiendo sólo a los que sí esperaron, que es un sesgo, no una ausencia.
 *
 * 3. **Un periodo sin cierre no se cierra con «hoy».** Sigue corriendo, y este módulo es puro: igual
 *    que `sla.ts`, recibe los datos y no consulta el reloj. Cerrarlo con la fecha de consulta daría
 *    un número distinto cada vez que alguien mira.
 */
export function periodosDeBodegaje(historial: PasoDelHistorial[]): PeriodoBodegaje[] {
  const pasos = enOrden(historial)
  const periodos: PeriodoBodegaje[] = []

  for (const def of BODEGAJES) {
    let abierto: string | null = null
    let cierreAnticipado: string | null = null

    for (const paso of pasos) {
      const cierra = dia(paso.values[def.cierra])
      if (cierra) {
        if (abierto) {
          periodos.push({ clase: def.clase, desde: abierto, hasta: cierra, dias: diasEntre(abierto, cierra) })
          abierto = null
        } else {
          // Regla 2: se guarda el más reciente, que es el que de verdad precede a la apertura.
          cierreAnticipado = cierra
        }
      }

      const abre = dia(paso.values[def.abre])
      if (abre && !abierto) {
        if (cierreAnticipado) {
          periodos.push({ clase: def.clase, desde: abre, hasta: cierreAnticipado, dias: 0 })
          cierreAnticipado = null
        } else {
          abierto = abre
        }
      }
    }
  }

  return periodos
}

/**
 * Los días de bodegaje de un ticket: de una clase, o de las tres.
 *
 * La suma de las tres es el tiempo que NO es de Ambientalia, y es exactamente lo que C7 tiene que
 * descontar del reloj del SLA. `:1706` — «Conviene construir C7 y C9 juntas, porque son la misma
 * idea vista desde dos sitios.»
 */
export function diasDeBodegaje(historial: PasoDelHistorial[], clase?: ClaseBodegaje): number {
  return periodosDeBodegaje(historial)
    .filter((p) => !clase || p.clase === clase)
    .reduce((suma, p) => suma + p.dias, 0)
}

/**
 * La marca de tiempo del `Ingreso a Servicio`, o `null` si el ticket todavía no entró.
 *
 * Es el ancla de los indicadores 48 y 49. Se devuelve la PRIMERA: `ingreso_a_servicio` no está en
 * ningún ciclo del grafo, así que hoy ocurre una vez, pero si F1B-06 la metiera en uno, la llegada
 * física del equipo seguiría siendo la primera y no la última.
 *
 * ⚠️ NO devuelve `Fecha creación ticket`, que la escribe esta MISMA transición
 * (`transitions.ts:191`) y está por tanto a un carácter de distancia. Ésa es la avería: desde que
 * Comercial da de alta los tickets por anticipado, las dos se separan meses.
 */
export function marcaIngresoAServicio(historial: PasoDelHistorial[]): string | null {
  return enOrden(historial).find((p) => p.transitionId === HITO_INDICADORES_ROTOS)?.performedAt ?? null
}

/**
 * Las transiciones que escriben cada operando, para que la tabla de arriba no pueda quedarse huérfana
 * en silencio. La prueba nº 2 la usa; se exporta porque el día que un operando deje de escribirse,
 * saber QUIÉN lo escribía es la mitad del diagnóstico.
 */
export function transicionesQueEscriben(etiqueta: string): string[] {
  return TRANSITIONS.filter((t) => t.fields.some((f) => f.kind === 'date' && f.label === etiqueta)).map((t) => t.id)
}
