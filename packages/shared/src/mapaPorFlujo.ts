// Registro del mapa visual por flujo (F1B-09, `mapa-blueprint-tres-flujos`, RQ-MB-08). Función pura: sin
// `fs`, sin `process`. Construye la `EntradaMapa` de CADA clave de `CATALOGO_POR_FLUJO` y devuelve los
// ficheros Markdown que ese motor (`mapaBlueprint.ts`) produce para ella. Lo consumen por igual el guion
// `scripts/generar-mapa-blueprint.ts` (que ESCRIBE) y la prueba anti-desfase de `mapaBlueprint.test.ts`
// (que COMPARA): una sola construcción de la entrada, no dos (molde H5 de `CLAUDE.md`).
//
// Imports sólo de `flujos.ts`, `transitions.ts`, `estados.ts`, `fasesBlueprint.ts` y `mapaBlueprint.ts`:
// ninguno de los cinco importa este fichero (sin ciclos).

import { CATALOGO_POR_FLUJO, type Flujo } from './flujos'
import { TRANSICION_REMISION_CONFIRMADA, TRANSICION_REMISION_RETIRADA, type Transition } from './transitions'
import { ESTADOS_SERVICIO, ESTADOS_SIN_SALIDA } from './estados'
import { FASES, FASE_POR_ESTADO } from './fasesBlueprint'
import { generarMapaBlueprint, type EntradaMapa } from './mapaBlueprint'

/** Lo que el catálogo no puede dar: los estados (sólo servicio, que no se deriva), los pasos sin botón, las fases y el nombre. */
type ComplementoMapa = Omit<EntradaMapa, 'transiciones' | 'estados'> & { estados?: readonly string[] }

/**
 * Un complemento por flujo; un cuarto miembro de `Flujo` rompe `tsc` aquí, como en la tabla privada de
 * `flujos.ts`. `servicio` NO se deriva del catálogo (derivarlo reordenaría los alias `eNN` y cambiaría los
 * cuatro ficheros de servicio, RQ-MB-03); los dos flujos nuevos no tienen pasos sin botón, estados sin
 * salida ni fases, y sus estados salen del catálogo.
 */
const COMPLEMENTO_POR_FLUJO: Record<Flujo, ComplementoMapa> = {
  servicio: {
    estados: ESTADOS_SERVICIO,
    sinBoton: [TRANSICION_REMISION_CONFIRMADA, TRANSICION_REMISION_RETIRADA],
    sinSalida: ESTADOS_SIN_SALIDA,
    fases: FASES,
    fasePorEstado: FASE_POR_ESTADO,
  },
  'equipo-nuevo': {
    sinBoton: [],
    sinSalida: [],
    fases: [],
    fasePorEstado: {},
    nombreFlujo: 'Equipo nuevo',
    nombreFicheroCompleto: 'blueprint-equipo-nuevo.md',
    fuentes: '`TRANSITIONS_EQUIPO_NUEVO` de `transitions.ts`, a través de `CATALOGO_POR_FLUJO` de `flujos.ts`',
  },
  'soporte-remoto': {
    sinBoton: [],
    sinSalida: [],
    fases: [],
    fasePorEstado: {},
    nombreFlujo: 'Soporte remoto',
    nombreFicheroCompleto: 'blueprint-soporte-remoto.md',
    fuentes: '`TRANSITIONS_SOPORTE_REMOTO` de `transitions.ts`, a través de `CATALOGO_POR_FLUJO` de `flujos.ts`',
  },
}

/**
 * Los estados de un catálogo por primera aparición, recorriendo cada transición como «sus orígenes y luego
 * su destino». Es la misma expresión con que `flujos.ts` decide qué estados son de un catálogo
 * (`flatMap` de `from` y `to`), y da el orden del recorrido del flujo, no el alfabético ni el de `ESTADOS`.
 */
export function estadosDelCatalogo(catalogo: readonly Transition[]): string[] {
  return [...new Set(catalogo.flatMap((t) => [...t.from, t.to]))]
}

/** La entrada del generador para un flujo. El catálogo es opcional para que una prueba inyecte uno mutado. */
export function entradaMapaDelFlujo(flujo: Flujo, catalogo: readonly Transition[] = CATALOGO_POR_FLUJO[flujo]): EntradaMapa {
  // `vitest` no comprueba tipos: quien ejecute sin compilar con un flujo sin complemento recibe este error y no un `undefined`.
  const complemento = COMPLEMENTO_POR_FLUJO[flujo] as ComplementoMapa | undefined
  if (complemento === undefined) {
    throw new Error(`mapaPorFlujo: el flujo "${flujo}" está en CATALOGO_POR_FLUJO pero no tiene complemento en COMPLEMENTO_POR_FLUJO`)
  }
  const { estados, ...resto } = complemento
  return { ...resto, transiciones: [...catalogo], estados: estados ?? estadosDelCatalogo(catalogo) }
}

/** Flujo → (nombre de fichero → contenido). Recorre las claves del catálogo recibido, no una lista aparte. */
export function mapasPorFlujo(
  catalogos: Readonly<Record<Flujo, readonly Transition[]>> = CATALOGO_POR_FLUJO,
): Record<Flujo, Record<string, string>> {
  const salida = {} as Record<Flujo, Record<string, string>>
  for (const flujo of Object.keys(catalogos) as Flujo[]) {
    salida[flujo] = generarMapaBlueprint(entradaMapaDelFlujo(flujo, catalogos[flujo]))
  }
  return salida
}

/** Todos los ficheros de todos los flujos en un solo mapa. Lanza si dos flujos producen el mismo nombre. */
export function ficherosDelMapa(
  mapas: Readonly<Record<string, Record<string, string>>> = mapasPorFlujo(),
): Record<string, string> {
  const salida: Record<string, string> = {}
  for (const [flujo, ficheros] of Object.entries(mapas)) {
    for (const [nombre, contenido] of Object.entries(ficheros)) {
      if (nombre in salida) {
        throw new Error(`mapaPorFlujo: el fichero "${nombre}" lo producen dos flujos (uno de ellos "${flujo}"); cada flujo necesita su nombreFicheroCompleto`)
      }
      salida[nombre] = contenido
    }
  }
  return salida
}
