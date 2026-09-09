import type { Estado } from './estados'
import { CLAVE_DERIVACION, TRANSITIONS, type Transition } from './transitions'

/**
 * EL RELOJ DEL SLA — corrección C11, punto abierto nº 40.
 *
 * El blueprint de Zoho Desk tiene un SLA de 1 día sobre `Notificado` —el estado en el que un
 * diagnóstico espera revisión— y la aplicación no lo trajo (M1.7, `R08.1.md:1570`). Importa porque
 * `Notificado` es la antesala de todo lo comercial: de ahí salen el reporte por garantía, el escalado
 * a comercial y la devolución a corrección, y un diagnóstico parado ahí retrasa la cotización, que es
 * el reloj que el cliente percibe (`:1571`).
 *
 * SE DECLARA COMO DATO, igual que `ESTADOS_SIN_SALIDA` y por la misma razón: es una decisión de
 * negocio, no una propiedad que el grafo pueda contestar. De las 34 transiciones no se deduce que
 * `Notificado` merezca un día y `Pendiente` no.
 *
 * LA UNIDAD ES LA HORA, no el día. El maestro deja abierto en «24/48 h» el plazo de la otra regla por
 * tiempo que tiene pensada (`:1586`), así que declarar días obligaría a cambiar la unidad —y todas
 * sus pruebas— el día que Gerencia elija 48.
 *
 * ⚠️ ESTE MÓDULO NO DISPARA NADA. Es la regla, y la regla es pura: recibe el instante en que el
 * ticket entró en el estado y el instante actual. Quién la consulta y cada cuánto es otra cosa, y hoy
 * NO EXISTE: `R08.1.md:1588` lo dice como `[ABIERTO — AS-BUILT]` —«no existe hoy ninguna transición
 * por tiempo en el blueprint implementado»— y sigue siendo cierto después de F1A-02. Ver la spec
 * `transitions-st` §3.10.
 *
 * ⚠️ Y ESTE MÓDULO NO ESCALA POR SÍ SOLO, pero SÍ SABE A QUIÉN: `destinatarioDelEscalado`, más
 * abajo, lo deriva de la tabla de derivación por cargo, que es lo que el maestro manda hacer en la
 * línea siguiente a pedir el escalado (`:1575`). Lo que falta para que el escalado ocurra es el
 * planificador, no el destinatario.
 */
export const SLA_HORAS_POR_ESTADO: Partial<Record<Estado, number>> = {
  // El único que el maestro decidió. Un día = 24 h.
  'Notificado': 24,
}

const HORA_EN_MS = 60 * 60 * 1000

/** Cuándo vence el SLA de un ticket que entró en `estado` en `desde`. `null` si ese estado no tiene. */
export function venceSlaEn(estado: Estado, desde: Date): Date | null {
  const horas = SLA_HORAS_POR_ESTADO[estado]
  if (horas === undefined) return null
  return new Date(desde.getTime() + horas * HORA_EN_MS)
}

/**
 * ¿Se pasó el plazo?
 *
 * En el instante EXACTO del vencimiento todavía no: un SLA de «un día» que saltara a las 23:59:59.999
 * no sería un día. La comparación es estricta a propósito.
 */
export function slaVencido(estado: Estado, desde: Date, ahora: Date): boolean {
  const vence = venceSlaEn(estado, desde)
  return vence !== null && ahora.getTime() > vence.getTime()
}

/**
 * A QUIÉN SE ESCALA cuando el SLA de un estado se pasa — la segunda pieza de la ampliación R08 de
 * C11 (`R08.1.md:1574`).
 *
 * **NO hace falta una jerarquía aparte, y el maestro lo dice en la línea siguiente a pedir el
 * escalado:** «Encaja con la derivación de M1.9.2, que ya sabe a qué cargo corresponde cada etapa:
 * el escalado puede apoyarse en esa misma tabla en lugar de mantener una jerarquía aparte»
 * (`:1575`). Y esa tabla ya trae el concepto con las mismas palabras: la primera entrada de
 * `DERIVACION_POR_DEFECTO` lleva escrito «escalar una revisión es **subirla al inmediato superior**»
 * (`transitions.ts:268`).
 *
 * LA REGLA: el destinatario del escalado de un estado es **el cargo que proponen sus transiciones
 * salientes**. Para `Notificado` —el único con SLA— es `escalado_a_comercial` → `Coordinador
 * Comercial` (`transitions.ts:220`, `:271`).
 *
 * TRES CASOS, y ninguno se resuelve inventando:
 *
 * - **Ninguna saliente propone cargo** ⇒ no hay a quién escalar. Se dice, no se inventa. Es lo que
 *   pasa en la mayoría de los 21 estados, y también en `Notificación cliente`, cuya única entrada en
 *   la tabla es `primerDerivado` — que devuelve el trabajo a quien tomó el ticket, es decir, lo
 *   contrario de escalar.
 * - **Un cargo, por una o varias vías** ⇒ ése, y se dicen todas las vías. Dos caminos al mismo
 *   puesto no son una ambigüedad: el destinatario es uno.
 * - **Dos cargos distintos** ⇒ **ambiguo**, y tampoco se elige el primero: eso sería inventar un
 *   orden entre dos puestos, la misma clase de regla que `DerivacionPorDefecto` evita al ser una
 *   unión y no dos campos sueltos (`transitions.ts:38-43`). Hoy no ocurre en ningún estado, y hay
 *   una prueba que lo vigila para cuando F1B-06 añada dos grafos enteros.
 *
 * `transiciones` se inyecta para poder probar los casos que el grafo real todavía no tiene. En
 * producción es siempre `TRANSITIONS`.
 */
export type DestinatarioEscalado =
  | { hay: true; cargo: string; via: string[] }
  | { hay: false; motivo: 'ningun_cargo' | 'ambiguo' }

export function destinatarioDelEscalado(
  estado: Estado,
  transiciones: Transition[] = TRANSITIONS,
): DestinatarioEscalado {
  const via: string[] = []
  const cargos = new Set<string>()
  for (const t of transiciones) {
    if (!t.from.includes(estado)) continue
    const propuesta = t.fields.find((f) => f.key === CLAVE_DERIVACION)?.porDefecto
    // El `tipo` se comprueba a propósito: `primerDerivado` está en la misma tabla y NO es un cargo.
    if (propuesta?.tipo !== 'cargo') continue
    cargos.add(propuesta.cargo)
    via.push(t.id)
  }
  if (cargos.size === 0) return { hay: false, motivo: 'ningun_cargo' }
  if (cargos.size > 1) return { hay: false, motivo: 'ambiguo' }
  return { hay: true, cargo: [...cargos][0]!, via }
}
