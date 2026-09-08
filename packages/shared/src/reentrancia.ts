// La tabla de reentrancia: qué ciclos tiene el grafo de transiciones, qué campos de fecha se
// escriben dentro de ellos y qué indicadores de G.6 los consumen.
//
// POR QUÉ ESTO ES CÓDIGO Y NO UN DOCUMENTO. La tabla ya estaba calculada a mano en el proposal
// F0-04. Una tabla escrita a mano envejece en silencio: F1B-06 añade dos grafos al motor, y el día
// que uno de ellos cierre un ciclo nuevo sobre un campo de fecha, el documento seguiría diciendo
// «tres ciclos, nueve casos» y nadie se enteraría. Derivada del grafo, esa misma tanda da rojo.
//
// ⚠️ F0-04 NO DISEÑA LA SOLUCIÓN. Produce el dato de entrada de F1C-02, F1C-06, C9 y la spec `kpis`.

import { TRANSITIONS, type Transition } from './transitions'

/**
 * LO QUE SALVA EL CASO, Y POR QUÉ ESTO NO ES DISEÑO (§3.4 del proposal).
 *
 * `ticket_transitions.values` es `jsonb` y guarda TODOS los valores de cada transición
 * (`db/schema.sql:57-61` declara la columna, `db/repo.ts:282-286` la escribe en cada paso). O sea:
 *
 *   **Las columnas de `tickets` guardan el ÚLTIMO valor; el historial guarda TODOS.**
 *
 * No se pierde ningún dato por reentrancia. Lo que se pierde es el dato *si se lee por la columna*.
 * De ahí la regla para F1C-06 y la spec `kpis`:
 *
 *   **Los KPIs de G.6 se calculan sobre `ticket_transitions.values`, no sobre `tickets.*`.**
 *
 * P34 ya nombra la solución —«campo nuevo que no se sobreescriba, o evento en el historial»— y la
 * segunda escala a los diez campos sin añadir diez columnas. Es además la propuesta de Gerencia para
 * C7: en el as-built toda pausa es un estado pleno, luego el periodo queda delimitado por dos filas
 * de `ticket_transitions`, y calcular los bodegajes sobre ese registro *append-only* implementa
 * M1.10 al pie de la letra y arregla la reentrancia en el mismo movimiento.
 *
 * Elegir entre las dos es F1C-02 desde M1.3.5 y P34. Aquí sólo queda escrito que se puede.
 */
export interface TransicionReentrante {
  id: string
  /** El estado de origen que está DENTRO del ciclo (una transición puede tener varios `from`). */
  from: string
  to: string
  /** Etiquetas de los campos de fecha que la transición escribe, en orden de declaración. */
  campos: string[]
}

/** Un ciclo del grafo con lo que se reescribe al recorrerlo otra vez. */
export interface ComponenteReentrante {
  /** Los estados del componente, en orden de primera aparición en `TRANSITIONS`. */
  estados: string[]
  /**
   * Sólo las transiciones internas al ciclo QUE ESCRIBEN ALGUNA FECHA. Una transición interna sin
   * fecha se puede repetir sin consecuencias, y meterla aquí haría leer «reentrante» como
   * «peligrosa», que no es lo mismo: C3 es un ciclo entero sin un solo campo.
   */
  transiciones: TransicionReentrante[]
}

/** Un indicador del informe de Gerencia (G.6) que consume campos reentrantes. */
export interface IndicadorG6 {
  /** Columna(s) del informe. Dos columnas comparten fila cuando miden lo mismo por dos caminos. */
  columnas: number[]
  nombre: string
  /** Campos reentrantes que usa. La prueba comprueba que siguen siéndolo. */
  campos: string[]
  /** Qué corrección de la Fase 1 lo cubre, o `null` si NO tiene dueño. */
  alcance: 'C4' | 'C9' | null
}

/**
 * EL CRUCE CON G.6. Dato externo —viene del informe de Gerencia, no del grafo—, y por eso es lo
 * único de este módulo que va escrito a mano. Lo que sí se comprueba por código es que cada campo
 * que nombra siga siendo reentrante (ver `reentrancia.test.ts`).
 *
 * G.8 limita C4 a una fila y C9 a tres columnas. CUATRO indicadores —50, 53, 57 y 58— quedan rotos
 * y sin dueño: ése es el hallazgo de esta tanda.
 *
 * No están aquí las columnas 48, 49 y 56 (inicio de servicio, diagnóstico y bodegaje de ingreso):
 * también están rotas, pero por creación anticipada del ticket y no por reentrancia, y su dueño es
 * C9. Meterlas confundiría las dos averías, que se arreglan en sitios distintos.
 */
export const INDICADORES_G6: IndicadorG6[] = [
  { columnas: [47], nombre: 'Tiempo permanencia', campos: ['Fecha Remisión de Salida'], alcance: 'C4' },
  { columnas: [50, 53], nombre: 'Tiempo de servicio', campos: ['Fecha Orden De Venta', 'Fecha Recepción de repuestos'], alcance: null },
  { columnas: [57], nombre: 'Tiempo de cotización', campos: ['Fecha de Cotización'], alcance: null },
  { columnas: [58], nombre: 'Tiempo de orden de compra', campos: ['Fecha Orden de Compra', 'Fecha de Cotización'], alcance: null },
]

/**
 * Los campos de fecha que una transición escribe.
 *
 * Cuenta también el `campoFecha` del buscador de órdenes de venta: no se teclea, pero se ESCRIBE
 * igual —lo rellena la OV elegida— y por tanto se pisa igual al repetir. Hoy ninguna transición
 * reentrante lleva buscador de OV, así que no cambia la tabla; dejarlo fuera haría que la tabla
 * mintiera el día que F1B-06 meta uno dentro de un ciclo.
 */
function camposDeFecha(t: Transition): string[] {
  const campos: string[] = []
  for (const f of t.fields) {
    if (f.kind === 'date') campos.push(f.label)
    else if (f.kind === 'ordenVenta' && f.campoFecha) campos.push(f.campoFecha)
  }
  return [...new Set(campos)]
}

/** Un campo de fecha es obligatorio en una transición si `required`. El `campoFecha` de la OV no lo es. */
function esObligatorio(t: Transition, campo: string): boolean {
  return t.fields.some((f) => f.kind === 'date' && f.label === campo && f.required)
}

/** Los estados en orden de primera aparición recorriendo `TRANSITIONS`: `from`s y luego `to`. */
function ordenDeAparicion(transiciones: Transition[]): string[] {
  const orden: string[] = []
  const vistos = new Set<string>()
  const ver = (e: string) => { if (!vistos.has(e)) { vistos.add(e); orden.push(e) } }
  for (const t of transiciones) {
    for (const f of t.from) ver(f)
    ver(t.to)
  }
  return orden
}

/**
 * Componentes fuertemente conexos del grafo de transiciones, por Tarjan.
 *
 * Se devuelven SÓLO los que son un ciclo de verdad: más de un estado, o uno solo con transición a sí
 * mismo. Los 12 estados restantes son componentes de un elemento sin bucle y no aportan nada a una
 * tabla de reentrancia.
 *
 * Orden: por tamaño descendente, y a igualdad por el estado que aparece antes en `TRANSITIONS`. Es
 * un orden derivado y estable, no una lista escrita a mano — de eso se trata todo este módulo.
 */
export function componentesFuertementeConexos(transiciones: Transition[] = TRANSITIONS): string[][] {
  const nodos = ordenDeAparicion(transiciones)
  const indiceDe = new Map(nodos.map((n, i) => [n, i]))
  const salidas = new Map<string, string[]>(nodos.map((n) => [n, []]))
  let conBucle = false
  for (const t of transiciones) {
    for (const f of t.from) {
      salidas.get(f)!.push(t.to)
      if (f === t.to) conBucle = true
    }
  }

  // Tarjan iterativo: 21 nodos caben de sobra en la pila del intérprete, pero un grafo lo recorre
  // quien no sabe cuánto va a crecer —F1B-06 añade dos— y la versión iterativa no tiene ese techo.
  const indice = new Map<string, number>()
  const bajo = new Map<string, number>()
  const enPila = new Set<string>()
  const pila: string[] = []
  const componentes: string[][] = []
  let siguiente = 0

  for (const raiz of nodos) {
    if (indice.has(raiz)) continue
    const trabajo: { nodo: string; i: number }[] = [{ nodo: raiz, i: 0 }]
    indice.set(raiz, siguiente); bajo.set(raiz, siguiente); siguiente++
    pila.push(raiz); enPila.add(raiz)

    while (trabajo.length) {
      const marco = trabajo[trabajo.length - 1]
      const vecinos = salidas.get(marco.nodo)!
      if (marco.i < vecinos.length) {
        const v = vecinos[marco.i++]
        if (!indice.has(v)) {
          indice.set(v, siguiente); bajo.set(v, siguiente); siguiente++
          pila.push(v); enPila.add(v)
          trabajo.push({ nodo: v, i: 0 })
        } else if (enPila.has(v)) {
          bajo.set(marco.nodo, Math.min(bajo.get(marco.nodo)!, indice.get(v)!))
        }
        continue
      }
      trabajo.pop()
      const padre = trabajo[trabajo.length - 1]
      if (padre) bajo.set(padre.nodo, Math.min(bajo.get(padre.nodo)!, bajo.get(marco.nodo)!))
      if (bajo.get(marco.nodo) === indice.get(marco.nodo)) {
        const componente: string[] = []
        let w: string
        do { w = pila.pop()!; enPila.delete(w); componente.push(w) } while (w !== marco.nodo)
        componente.sort((a, b) => indiceDe.get(a)! - indiceDe.get(b)!)
        const esCiclo = componente.length > 1
          || (conBucle && salidas.get(componente[0])!.includes(componente[0]))
        if (esCiclo) componentes.push(componente)
      }
    }
  }

  return componentes.sort((a, b) => b.length - a.length || indiceDe.get(a[0])! - indiceDe.get(b[0])!)
}

/** La tabla: cada ciclo con las transiciones internas que escriben fecha. */
export function tablaDeReentrancia(transiciones: Transition[] = TRANSITIONS): ComponenteReentrante[] {
  return componentesFuertementeConexos(transiciones).map((estados) => {
    const dentro = new Set(estados)
    const internas: TransicionReentrante[] = []
    for (const t of transiciones) {
      if (!dentro.has(t.to)) continue
      const campos = camposDeFecha(t)
      if (!campos.length) continue
      for (const f of t.from) {
        if (dentro.has(f)) internas.push({ id: t.id, from: f, to: t.to, campos })
      }
    }
    return { estados, transiciones: internas }
  })
}

/** El ciclo al que pertenece un estado, o `undefined` si ese estado no está en ninguno. */
export function componenteQueContiene(
  estado: string,
  transiciones: Transition[] = TRANSITIONS,
): ComponenteReentrante | undefined {
  return tablaDeReentrancia(transiciones).find((c) => c.estados.includes(estado))
}

/**
 * Los campos de fecha que un ciclo puede volver a escribir, sin repetir y en orden de declaración.
 *
 * Es el conjunto que el invariante 6 congela: no puede crecer sin que alguien lo declare.
 */
export function camposFechaReentrantes(transiciones: Transition[] = TRANSITIONS): string[] {
  const dentro = new Set(tablaDeReentrancia(transiciones).flatMap((c) => c.transiciones).map((t) => t.id))
  const campos: string[] = []
  for (const t of transiciones) {
    if (dentro.has(t.id)) campos.push(...camposDeFecha(t))
  }
  return [...new Set(campos)]
}

/**
 * Los reentrantes que además son OBLIGATORIOS. `cfDate` es `required = true` por omisión
 * (`transitions.ts:75-76`), y ahí está la diferencia que importa: en un campo opcional la segunda
 * pasada PUEDE dejar el valor anterior; en uno obligatorio no puede — pisa siempre.
 */
export function camposFechaReentrantesObligatorios(transiciones: Transition[] = TRANSITIONS): string[] {
  const dentro = new Set(tablaDeReentrancia(transiciones).flatMap((c) => c.transiciones).map((t) => t.id))
  const internas = transiciones.filter((t) => dentro.has(t.id))
  return camposFechaReentrantes(transiciones).filter((c) => internas.some((t) => esObligatorio(t, c)))
}
