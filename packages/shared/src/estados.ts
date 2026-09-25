// Registro de los estados del Blueprint de Servicio Técnico.
//
// Hasta F0-04 los 21 estados NO existían como lista: se derivaban de los strings `from`/`to` de las
// 34 transiciones, y sólo tres tenían constante (`transitions.ts:142-144`). Derivarlos basta para
// recorrer el grafo, pero no para responder a la única pregunta que la vista y los KPIs le hacen al
// estado: «¿este ticket está parado, y esperando a quién?».
//
// ⚠️ Declarar la lista a mano tiene un riesgo propio: se cambia una regex frágil por una lista
// frágil, que es PEOR porque parece rigurosa. Lo que lo evita es el invariante 1 de
// `invariantesGrafo.test.ts` —declarados == derivados—, y sin él este fichero no debería existir.

/**
 * TRES CRITERIOS DISTINTOS USAN LA PALABRA «ESPERA», Y SE NOMBRAN DISTINTO A PROPÓSITO.
 *
 * Es la corrección más importante que trajo la R03. Mezclarlos mete la misma palabra significando
 * lo contrario en dos párrafos de la misma spec, y entonces nadie sabe cuál se está implementando:
 *
 * | Nombre        | Criterio                                                                   | Fuente          | Alcance                          |
 * |---------------|----------------------------------------------------------------------------|-----------------|----------------------------------|
 * | `sin_salida`  | Su única transición de salida depende de algo que la aplicación no controla | M1.3.4          | 4 estados                        |
 * | `en_espera`   | El ticket está parado esperando el acto de un tercero y el área dueña no    | Vista del       | 11 estados — LO QUE DECLARA ESTE |
 * |               | puede hacer nada por su cuenta                                             | tablero         | módulo                           |
 * | `bodegaje`    | El tiempo que un equipo pasa en Ambientalia esperando una respuesta del     | M1.10           | 3 PERIODOS ENTRE FECHAS,         |
 * |               | cliente — tiempo que no depende de nosotros                                | `[DEFINIDO R08]`| no estados                       |
 *
 * DE AQUÍ SALE LA REGLA QUE SEPARA LA VISTA DEL RELOJ, y si no queda explícita F1C-06 la pierde:
 *
 *   **La vista muestra las once. El reloj del SLA NO lee esta clasificación.**
 *
 * El reloj para en los tres bodegajes de M1.10, que son periodos delimitados por dos fechas y no
 * estados del grafo. Un estado puede estar `en_espera` y no parar ningún reloj, y un bodegaje puede
 * transcurrir sin que el ticket pase por ningún estado de esta lista. Este módulo NO declara los
 * bodegajes: no son estados, y meterlos aquí sería justo el error que la tabla evita.
 *
 * `sin_salida` SÍ se declara aquí, más abajo, y como dato: es la otra clasificación de negocio de
 * este módulo. Es un subconjunto de `en_espera` con el criterio más estrecho de M1.3.4, y quién
 * tiene que ofrecerle un escape a cada uno sigue siendo F1C-03 — pero la lista ya no está en
 * discusión, así que dejarla sin declarar era esconder un dato cerrado.
 */
export type EnEspera = 'externa' | 'interna' | 'ninguna' | 'sin_clasificar'

/**
 * EL DISCRIMINADOR, escrito, para que el próximo estado se clasifique solo y no haya que discutirlo
 * estado a estado:
 *
 *   **Espera = el ticket está parado esperando el acto de un tercero, y el área dueña no puede hacer
 *   nada por su cuenta.**
 *
 * - `externa`: ese tercero está FUERA de Ambientalia — el cliente, el proveedor, el laboratorio.
 * - `interna`: ese tercero es otra área de la casa. Sigue siendo espera: el área dueña no puede
 *   desatascarlo sola.
 * - `ninguna`: el trabajo está en manos de quien tiene el ticket. Que sea lento no lo hace espera.
 * - `sin_clasificar`: nadie ha decidido todavía. Es VALOR VÁLIDO, no un hueco: obligar a clasificar
 *   forzaría a inventar la respuesta, y la vista enseñaría una promesa que nadie ha hecho.
 *
 * Va agrupado por clase y no por orden alfabético porque la lista se lee para comprobar la
 * clasificación, no para buscar un estado suelto.
 */
export const CLASIFICACION_EN_ESPERA = {
  // ── externa (5) — esperamos a alguien de fuera ────────────────────────────────────────────────
  'En Espera de Repuestos': 'externa',
  'Servicio externo': 'externa',
  // El cliente tiene la cotización y no ha contestado. Tiene salida de escape (`rechazo_cliente`),
  // por eso está aquí y NO en los cuatro de `sin_salida`.
  'Notificación cliente': 'externa',
  // El equipo ya fue avisado y espera a que el CLIENTE venga a recogerlo (M1.10, «Los tres
  // bodegajes», bodegaje de salida). Decisión de Gerencia, `decision/por-entregar-es-espera`,
  // 2026-09-12: hasta entonces clasificaba `'ninguna'`, y un ticket ya listo para el cliente se
  // enseñaba como «abierto», no como «en espera». Las DOS entradas se MUEVEN aquí físicamente, no
  // se reetiquetan en el sitio: la lista va agrupada por clase (`:56-57`), y dejarlas en el bloque
  // `ninguna` contradiría esa convención en el mismo fichero.
  'Por Entregar': 'externa',
  'Por Entregar / Sin facturar': 'externa',

  // ── interna (6) — esperamos a otra área de la casa ────────────────────────────────────────────
  'Notificación a Compras': 'interna',
  'Notificación Comercial': 'interna',
  'En espera de SKU inventario': 'interna',
  'Solicitado': 'interna',
  // Entra por `facturado` y sale por `habilitado_para_entrega`, las dos de Comercial: Servicio
  // Técnico no puede moverla. El Anexo B.1 del maestro también la lista bajo Comercial.
  'Liberación Comercial': 'interna',
  // Entra por `facturado`/similar y su única salida es `habilitar_servicio` (`transitions.ts:178`),
  // área Comercial: Servicio Técnico no puede moverla. Mismo criterio que `Liberación Comercial`, dos
  // filas arriba — el tercero del que depende es otra área de la casa, no alguien de fuera.
  'Remisión creada': 'interna',

  // ── ninguna (9) — el trabajo está en manos de quien tiene el ticket ───────────────────────────
  'Ingresado': 'ninguna',
  'Rev./Diagnostico': 'ninguna',
  'Notificado': 'ninguna',
  'En Proceso': 'ninguna',
  'Continuación del proceso': 'ninguna',
  'Por Facturar': 'ninguna',
  'Finalizado': 'ninguna',
  // Las dos formas de nombrar la fase inicial —Zoho y la app—. Ver `STATUS_OV_ASIGNADA` y compañía
  // en `transitions.ts:142-144`.
  'OV asignada': 'ninguna',
  'Ticket creado': 'ninguna',

  // ── sin clasificar (2) ───────────────────────────────────────────────────────────────────────
  // Pendiente de Servicio Técnico (11/09). Sale por `servicio_externo_pendiente` y por
  // `diagnostico_complementario`, las dos suyas, lo que apunta a `ninguna` — pero apuntar no es
  // decidir, y quien decide es Servicio Técnico.
  'Pendiente': 'sin_clasificar', 'Verificación': 'sin_clasificar', // Verificación: flujo equipo-nuevo (F1B-06, RQ-EN-07), sin fuente que clasifique su espera
} as const satisfies Record<string, EnEspera>

/** Un estado del Blueprint. Es un tipo cerrado: lo que no está en el registro no es un estado. */
export type Estado = keyof typeof CLASIFICACION_EN_ESPERA

/** Los 22 estados, en el orden en que están clasificados. */
export const ESTADOS: Estado[] = Object.keys(CLASIFICACION_EN_ESPERA) as Estado[]

/**
 * Las ONCE que la vista del tablero enseña bajo «En espera»: externa + interna.
 *
 * ⚠️ Es la lista de la VISTA. El reloj del SLA no la lee — para en los tres bodegajes de M1.10, que
 * son periodos entre fechas. Ver la tabla de los tres criterios arriba.
 */
export const ESTADOS_EN_ESPERA: Estado[] = ESTADOS.filter((e) => {
  const clase: EnEspera = CLASIFICACION_EN_ESPERA[e]
  return clase === 'externa' || clase === 'interna'
})

/**
 * LOS CUATRO `sin_salida` DE M1.3.4. Se DECLARAN, igual que `en_espera`, y por la misma razón: es
 * una clasificación de negocio, no una propiedad que el grafo pueda contestar.
 *
 * EL DISCRIMINADOR, literal, para que el próximo estado se clasifique solo:
 *
 *   **El suceso del que depende la única salida ocurre FUERA de la aplicación —una entrega física,
 *   un retorno de laboratorio, un alta en otro sistema—, frente a un acto que alguien realiza DENTRO
 *   de la aplicación.**
 *
 * POR QUÉ `Liberación Comercial` y `Remisión creada` NO ENTRAN, aunque tengan salida única. Son los
 * dos casos que distinguen el criterio, y por eso van escritos y no sobreentendidos: sus únicas
 * salidas son `habilitado_para_entrega` y `habilitar_servicio`, las dos área Comercial, y las DOS SON
 * UN ACTO QUE SE EJECUTA EN LA APLICACIÓN — alguien pulsa el botón. No hay ningún suceso del mundo
 * que esperar: hay una persona que todavía no ha entrado. Los cuatro de abajo esperan un camión, un
 * laboratorio o un alta en otro sistema.
 *
 * ⚠️ LA LECCIÓN DE MÉTODO, que vale más que la lista: «SALIDA ÚNICA» NO ES PROXY DE NADA. Hay DOCE
 * estados con una sola transición de salida —entre ellos `Ingresado` y `Ticket creado`, que son
 * trabajo corriente y no esperan a nadie—. Y cruzarla con `en_espera`, que es el intento fino,
 * tampoco: da SEIS, con `Liberación Comercial` y `Remisión creada` dentro. Por eso la prueba de
 * coherencia de `estados.test.ts` sólo comprueba que los cuatro son estados DECLARADOS, y no intenta
 * derivarlos.
 *
 * Fuente: M1.3.4 del maestro. Criterio cerrado por Gerencia.
 */
export const ESTADOS_SIN_SALIDA: Estado[] = [
  // Esperamos al proveedor: los repuestos llegan o no llegan, y no depende de nosotros.
  'En Espera de Repuestos',
  // Esperamos el alta del SKU en el otro sistema, que es un hecho que ocurre fuera de esta app.
  'Solicitado',
  // Esperamos el retorno del laboratorio externo con el equipo o el sensor.
  'Servicio externo',
  // Esperamos a que el inventario del otro sistema tenga el SKU disponible.
  'En espera de SKU inventario',
]

/**
 * La clase de espera de un estado, o `undefined` si el estado no está en el registro.
 *
 * Devuelve `undefined` y no `'ninguna'` a propósito: un estado desconocido es un fallo de datos —o
 * un estado nuevo que nadie clasificó— y confundirlo con «no está en espera» lo esconde justo donde
 * el invariante 1 quiere que se vea.
 */
export function enEsperaDe(estado: string): EnEspera | undefined {
  return Object.prototype.hasOwnProperty.call(CLASIFICACION_EN_ESPERA, estado)
    ? CLASIFICACION_EN_ESPERA[estado as Estado]
    : undefined
}

/**
 * `Verificación` (F1B-06) es del flujo `equipo-nuevo` y no del Blueprint de Servicio Técnico: no
 * debe aparecer en el mapa generado ni en la partición de fases (`fasesBlueprint.ts`), las dos
 * cosas que sólo conocen el flujo de servicio. Se declara aquí, junto al registro, y no en
 * `flujos.ts` porque `fasesBlueprint.ts`/`mapaBlueprint.ts` no dependen de ese fichero (D1 de
 * `design.md`).
 */
export const ESTADOS_SOLO_EQUIPO_NUEVO = ['Verificación'] as const satisfies readonly Estado[]

/** Un estado del Blueprint de Servicio Técnico: todos menos los exclusivos de `equipo-nuevo`. */
export type EstadoServicio = Exclude<Estado, (typeof ESTADOS_SOLO_EQUIPO_NUEVO)[number]>

/** `ESTADOS` menos `ESTADOS_SOLO_EQUIPO_NUEVO`, en el mismo orden — los 21 de siempre. */
export const ESTADOS_SERVICIO: EstadoServicio[] = ESTADOS.filter(
  (e): e is EstadoServicio => !(ESTADOS_SOLO_EQUIPO_NUEVO as readonly string[]).includes(e),
)
