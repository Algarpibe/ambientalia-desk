// Generador determinista del mapa visual del Blueprint de Servicio Técnico (F1A-06, Unidad B).
// Función pura: sin `fs`, sin `process`. Recorre el grafo de `transitions.ts` y la partición de
// fases de `fasesBlueprint.ts` (Unidad A) y devuelve el Markdown de los cuatro ficheros. Escribe a
// disco `scripts/generar-mapa-blueprint.ts`; lee disco para comparar `mapaBlueprint.test.ts`
// (RQ-MB-06). Ver `design.md` §1. `AREAS`/`areasForTransition` se importan directo (utilidades
// estables); `EntradaMapa` lleva sólo lo que una prueba necesita mutar (guarda de D-1, RQ-MB-06).

import { AREAS, areasForTransition, type Transition } from './transitions'
import type { Fase, FaseId } from './fasesBlueprint'

/** Las dos sin botón (`TRANSICION_REMISION_CONFIRMADA`/`RETIRADA`, `transitions.ts:150-151`). No
 * son `Transition`: sin `fields` (`design.md` §3) — la marca real de «no es un botón». */
export interface PasoSinBoton {
  id: string
  name: string
  from: string[]
  to: string
  area: string
}

/** El grafo declarado. `fasePorEstado` es `Record<string, FaseId>`, no `Record<Estado, FaseId>`:
 * así la guarda de EJECUCIÓN de D-1 es testeable inyectando una tabla incompleta. */
export interface EntradaMapa {
  transiciones: Transition[]
  sinBoton: PasoSinBoton[]
  estados: readonly string[]
  sinSalida: readonly string[]
  fases: readonly Fase[]
  fasePorEstado: Record<string, FaseId>
}

const NOMBRE_FICHERO_COMPLETO = 'blueprint-completo.md'
const NOMBRE_FICHERO_FASE: Record<FaseId, string> = {
  entrada: 'blueprint-fase-1-entrada.md',
  diagnostico: 'blueprint-fase-2-diagnostico.md',
  cierre: 'blueprint-fase-3-cierre.md',
}

/** Marca visual de cada área base en la etiqueta de la arista (D-6). Compuestas llevan varias. */
const MARCA_AREA: Record<string, string> = {
  Comercial: 'C',
  'Servicio Técnico': 'ST',
  Compras: 'CO',
}

interface Arista {
  from: string
  to: string
  nombre: string
  area: string
  conBoton: boolean
}

const CABECERA_GENERADO = [
  '<!--',
  '  GENERADO por `npm run generar-mapa-blueprint` (`scripts/generar-mapa-blueprint.ts`) a partir de',
  '  `transitions.ts`, `estados.ts` y `fasesBlueprint.ts`. NO EDITAR A MANO: la prueba anti-desfase',
  '  (`mapaBlueprint.test.ts`, RQ-MB-06) lo detecta.',
  '-->',
  '',
].join('\n')

/** Cadena determinista para el alias Mermaid de un estado: `e01`..`e21`, por posición en ESTADOS. */
function aliasDe(indicePorEstado: Map<string, string>, estado: string): string {
  const alias = indicePorEstado.get(estado)
  if (!alias) throw new Error(`mapaBlueprint: estado sin alias asignado: "${estado}"`)
  return alias
}

function construirAlias(estados: readonly string[]): Map<string, string> {
  const mapa = new Map<string, string>()
  estados.forEach((estado, i) => mapa.set(estado, `e${String(i + 1).padStart(2, '0')}`))
  return mapa
}

/** Descompone el área en sus marcas base, unidas sin separador: `[C]`, o `[C][CO]` si es compuesta. */
function marcasArea(area: string): string {
  return areasForTransition(area)
    .map((a) => `[${MARCA_AREA[a] ?? a}]`)
    .join('')
}

function etiquetaArista(arista: Arista, esFrontera: boolean): string {
  const partes = [arista.nombre]
  if (!arista.conBoton) partes.push('(sin botón)')
  if (esFrontera) partes.push('[frontera]')
  partes.push(marcasArea(arista.area))
  return partes.join(' ')
}

/** Todas las aristas del grafo, en orden determinista: TRANSITIONS (por `from`) y luego sinBoton. */
function construirAristas(entrada: EntradaMapa): Arista[] {
  const aristas: Arista[] = []
  for (const t of entrada.transiciones) {
    for (const origen of t.from) {
      aristas.push({ from: origen, to: t.to, nombre: t.name, area: t.area, conBoton: true })
    }
  }
  for (const p of entrada.sinBoton) {
    for (const origen of p.from) {
      aristas.push({ from: origen, to: p.to, nombre: p.name, area: p.area, conBoton: false })
    }
  }
  return aristas
}

/** Guarda de EJECUCIÓN de D-1: todo estado referenciado por el grafo debe tener fase asignada. */
function validarFasePorEstado(entrada: EntradaMapa, aristas: Arista[]): void {
  const referenciados = new Set<string>(entrada.estados)
  for (const a of aristas) {
    referenciados.add(a.from)
    referenciados.add(a.to)
  }
  for (const estado of referenciados) {
    if (entrada.fasePorEstado[estado] === undefined) {
      throw new Error(
        `mapaBlueprint: el estado "${estado}" no tiene fase asignada en FASE_POR_ESTADO — ` +
          'el generador no puede continuar sin clasificarlo (D-1, guarda de ejecución, RQ-MB-04).',
      )
    }
  }
}

function etiquetaNodo(estado: string, sinSalida: ReadonlySet<string>, marcaFrontera?: string): string {
  const partes = [estado]
  if (sinSalida.has(estado)) partes.push('·espera·')
  if (marcaFrontera) partes.push(marcaFrontera)
  return partes.join(' ')
}

function declaracionNodo(alias: string, etiqueta: string): string {
  return `    state "${etiqueta}" as ${alias}`
}

function lineaArista(aliasFrom: string, aliasTo: string, etiqueta: string): string {
  return `    ${aliasFrom} --> ${aliasTo} : ${etiqueta}`
}

/** El diagrama completo: los 21 estados y las 38 aristas, sin partición por fase. */
function generarCompleto(entrada: EntradaMapa, alias: Map<string, string>, aristas: Arista[], sinSalida: ReadonlySet<string>): string {
  const lineas = ['```mermaid', 'stateDiagram-v2']
  for (const estado of entrada.estados) {
    lineas.push(declaracionNodo(aliasDe(alias, estado), etiquetaNodo(estado, sinSalida)))
  }
  for (const a of aristas) {
    lineas.push(lineaArista(aliasDe(alias, a.from), aliasDe(alias, a.to), etiquetaArista(a, false)))
  }
  lineas.push('```')

  const leyenda = [
    '## Leyenda de áreas',
    '',
    ...AREAS.map((area) => `- **[${MARCA_AREA[area] ?? area}]** — ${area}`),
    '',
    'Una transición de área compartida (p. ej. `Comercial / Compras`) lleva las dos marcas, una por',
    'cada área que interviene.',
  ]

  return [
    CABECERA_GENERADO,
    '# Mapa del Blueprint de Servicio Técnico — diagrama completo',
    '',
    lineas.join('\n'),
    '',
    leyenda.join('\n'),
    '',
  ].join('\n')
}

/**
 * La vista de una fase: sus estados nativos, más el extremo ajeno de cada frontera —marcado
 * `→faseAjena` si esta fase es el origen de la frontera, `←faseAjena` si es el destino—, y la
 * arista de frontera anotada `[frontera]` en las dos vistas que participan (§7 del diseño).
 */
function generarVistaFase(
  fase: Fase,
  entrada: EntradaMapa,
  alias: Map<string, string>,
  aristas: Arista[],
  sinSalida: ReadonlySet<string>,
): string {
  const faseDe = (estado: string): FaseId => entrada.fasePorEstado[estado]

  const aristasDeLaVista = aristas.filter((a) => faseDe(a.from) === fase.id || faseDe(a.to) === fase.id)

  const marcaForaneo = new Map<string, string>()
  for (const a of aristasDeLaVista) {
    const faseOrigen = faseDe(a.from)
    const faseDestino = faseDe(a.to)
    if (faseOrigen === faseDestino) continue // arista interna, sin marca de frontera
    if (faseOrigen === fase.id) marcaForaneo.set(a.to, `→${faseDestino}`)
    else marcaForaneo.set(a.from, `←${faseOrigen}`)
  }

  const estadosDeLaVista = entrada.estados.filter((estado) => faseDe(estado) === fase.id || marcaForaneo.has(estado))

  const lineas = ['```mermaid', 'stateDiagram-v2']
  for (const estado of estadosDeLaVista) {
    lineas.push(declaracionNodo(aliasDe(alias, estado), etiquetaNodo(estado, sinSalida, marcaForaneo.get(estado))))
  }
  for (const a of aristasDeLaVista) {
    const esFrontera = faseDe(a.from) !== faseDe(a.to)
    lineas.push(lineaArista(aliasDe(alias, a.from), aliasDe(alias, a.to), etiquetaArista(a, esFrontera)))
  }
  lineas.push('```')

  return [
    CABECERA_GENERADO,
    `# Mapa del Blueprint de Servicio Técnico — fase «${fase.nombre}»`,
    '',
    lineas.join('\n'),
    '',
  ].join('\n')
}

/** Devuelve nombre de fichero → contenido Markdown. Cuatro entradas, siempre las mismas. */
export function generarMapaBlueprint(entrada: EntradaMapa): Record<string, string> {
  const aristas = construirAristas(entrada)
  validarFasePorEstado(entrada, aristas)

  const alias = construirAlias(entrada.estados)
  const sinSalida = new Set(entrada.sinSalida)

  const salida: Record<string, string> = {
    [NOMBRE_FICHERO_COMPLETO]: generarCompleto(entrada, alias, aristas, sinSalida),
  }
  for (const fase of entrada.fases) {
    salida[NOMBRE_FICHERO_FASE[fase.id]] = generarVistaFase(fase, entrada, alias, aristas, sinSalida)
  }
  return salida
}
