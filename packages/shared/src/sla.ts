import type { Estado } from './estados'
import { AREAS, CLAVE_DERIVACION, TRANSITIONS, type Transition } from './transitions'; import { horasHabilesEntre, type DiaCivil } from './calendarioLaboral'

/**
 * EL RELOJ DEL SLA — corrección C11 (punto abierto nº 40), en horas HÁBILES desde F1B-08.
 *
 * Hasta 6516e5f era un solo SLA de reloj: `Notificado`, 24 h (M1.7). `decision/anexo-3-alerta`
 * (`openspec/config.yaml`) lo sustituye por TRES alarmas en horas hábiles: `Notificado` 9 h,
 * `Remisión creada` 27 h y `Notificación cliente` 36 h (4 días hábiles de 9 h). Importan porque son
 * las antesalas de la cotización, de la orden de venta y de la aprobación del cliente, que son los
 * relojes que el cliente percibe.
 *
 * SE DECLARA COMO DATO, igual que `ESTADOS_SIN_SALIDA` y por la misma razón: es una decisión de
 * negocio, no una propiedad que el grafo pueda contestar. De las 31 transiciones no se deduce que
 * `Notificado` merezca 9 h y `Pendiente` ninguna.
 *
 * LA UNIDAD ES LA HORA HÁBIL, no el día ni la hora de reloj: jornada 08:00-17:00 en `ZONA_NEGOCIO`,
 * sin fines de semana, festivos de Colombia ni cierres de empresa. NO se calcula aquí: se consume
 * `horasHabilesEntre` (`calendarioLaboral.ts:174`), como manda `decision/calendario-habil`, y los
 * cierres de `public.calendario_cierres` llegan por parámetro porque este paquete no lee la base.
 *
 * ⚠️ ESTE MÓDULO NO DISPARA NADA. Es la regla, y la regla es pura: recibe el instante en que el
 * ticket entró en el estado, el instante actual y los cierres. Quién la consulta y cada cuánto es el
 * servidor (`apps/desk/server/db/sla.ts`), no este paquete.
 *
 * ⚠️ Y A QUIÉN SE AVISA ES DATO, NO GRAFO (S-8): `ALARMAS_SLA`, al final del fichero, declara el
 * cargo, el área de respaldo y qué más hace cada alarma. `destinatarioDelEscalado`, más abajo, se
 * conserva como comprobación de coherencia: si el grafo propone un cargo para un estado con alarma,
 * tiene que ser el mismo (`sla.test.ts`, «todo estado con alarma declara cargo»).
 *
 */
export const SLA_HORAS_POR_ESTADO: Partial<Record<Estado, number>> = {
  // Horas HÁBILES (decision/anexo-3-alerta). Hasta 6516e5f: { 'Notificado': 24 } de reloj.
  'Notificado': 9, 'Remisión creada': 27, 'Notificación cliente': 36,
}

const HORA_EN_MS = 60 * 60 * 1000

// RETIRADA (F1B-08): aquí vivía `venceSlaEn`, que devolvía `desde + horas` de RELOJ. Con horas
// hábiles esa fecha sería falsa, y nadie la necesita: ni el aviso ni el tablero enseñan una hora
// de vencimiento, sólo si ya venció. Si una tanda futura la pide, se construye `sumarHorasHabiles`
// en `calendarioLaboral.ts` (decision/calendario-habil), no aquí. Estas seis líneas conservan su
// sitio para no desplazar las citas `sla.ts:NN` del repositorio (regla de mutación 4).
// Ver `design.md` D-2 de `alarmas-horas-habiles`.

/**
 * ¿Se pasó el plazo? En horas HÁBILES (`horasHabilesEntre`), con los cierres de empresa.
 *
 * En el instante EXACTO del umbral todavía no: la comparación es estricta a propósito. Se compara en
 * milisegundos redondeados porque sumar tramos fraccionarios de hora arrastra error de coma flotante.
 */
export function slaVencido(estado: Estado, desde: Date, ahora: Date, cierres: ReadonlySet<DiaCivil>): boolean {
  const horas = SLA_HORAS_POR_ESTADO[estado]
  return horas !== undefined && Math.round(horasHabilesEntre(desde, ahora, cierres) * HORA_EN_MS) > horas * HORA_EN_MS
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
 * (`transitions.ts:275`).
 *
 * LA REGLA: el destinatario del escalado de un estado es **el cargo que proponen sus transiciones
 * salientes**. Para `Notificado` —de las tres alarmas, la única cuyo grafo propone cargo— es `escalado_a_comercial` → `Coordinador
 * Comercial` (`transitions.ts:220`, `:278`), el mismo que declara `ALARMAS_SLA`.
 *
 * TRES CASOS, y ninguno se resuelve inventando:
 *
 * - **Ninguna saliente propone cargo** ⇒ no hay a quién escalar. Se dice, no se inventa. Es lo que
 *   pasa en la mayoría de los 20 estados, y también en `Notificación cliente`, cuya única entrada en
 *   la tabla es `primerDerivado` — que devuelve el trabajo a quien tomó el ticket, es decir, lo
 *   contrario de escalar.
 * - **Un cargo, por una o varias vías** ⇒ ése, y se dicen todas las vías. Dos caminos al mismo
 *   puesto no son una ambigüedad: el destinatario es uno.
 * - **Dos cargos distintos** ⇒ **ambiguo**, y tampoco se elige el primero: eso sería inventar un
 *   orden entre dos puestos, la misma clase de regla que `DerivacionPorDefecto` evita al ser una
 *   unión y no dos campos sueltos (`transitions.ts:38-43`). Hoy no ocurre en ningún estado, y hay
 *   una prueba que lo vigila para cuando el registro de flujos (`flujos.ts`) sume un catálogo nuevo.
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

/**
 * F1B-08 — QUÉ SE HACE CUANDO VENCE CADA ALARMA (`alarmas-horas-habiles`, RQ-TS-16).
 *
 * El destinatario es DATO de esta tabla, no se deriva del grafo (S-8). Las tres van al cargo
 * `Coordinador Comercial`: `Remisión creada` lo fijan `decision/escalado-remision-creada` y
 * `decision/escalado-destinatario-doble`; `Notificación cliente`, `decision/anexo-3-alerta`;
 * `Notificado` es supuesto (S-3, pregunta P.4 a Gerencia) y coincide con lo que propone su grafo.
 *
 * `areaRespaldo` existe porque `users.cargo` es texto libre que se escribe para FIRMAR la remisión,
 * no para repartir avisos: un «Coord. Comercial» no casa con el cargo. Si nadie lo tiene, el servidor
 * avisa al área (S-4, segunda revisión) en vez de dejar la alarma muda.
 *
 * Las claves son EXACTAMENTE las de `SLA_HORAS_POR_ESTADO`: una alarma sin umbral o un umbral sin
 * alarma se ponen rojos en `sla.test.ts`.
 */
export interface AlarmaSla {
  /** Cargo que recibe el aviso (`users.cargo`, comparado sin mayúsculas ni espacios en los extremos). */
  cargo: string
  /** Área que recibe el aviso si nadie tiene el cargo. */
  areaRespaldo: (typeof AREAS)[number]
  /** Sólo avisa si el ticket no tiene orden de venta por ninguna vía (`decision/escalado-remision-creada`). */
  soloSinOrdenVenta?: boolean
  /** Al vencer, el tablero señala el ticket «esperando aprobación del cliente»: marca de vista, no estado. */
  marcaTablero?: boolean
}

export const ALARMAS_SLA: Partial<Record<Estado, AlarmaSla>> = {
  'Notificado': { cargo: 'Coordinador Comercial', areaRespaldo: 'Comercial' },
  'Remisión creada': { cargo: 'Coordinador Comercial', areaRespaldo: 'Comercial', soloSinOrdenVenta: true },
  'Notificación cliente': { cargo: 'Coordinador Comercial', areaRespaldo: 'Comercial', marcaTablero: true },
}

/** Estados con alarma cuyo cargo está vacío o es sólo espacios. Vacío es lo correcto. */
export function estadosConAlarmaSinCargo(alarmas: Partial<Record<Estado, AlarmaSla>> = ALARMAS_SLA): Estado[] {
  return (Object.keys(alarmas) as Estado[]).filter((e) => !alarmas[e]?.cargo?.trim())
}
