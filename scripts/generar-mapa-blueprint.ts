/**
 * CLI de escritura del mapa visual del Blueprint (capacidad `mapa-blueprint`, F1A-06 Unidad B).
 *
 * Delgada a propósito (RQ-MB-01): importa el grafo real, invoca la función pura de
 * `packages/shared/src/mapaBlueprint.ts` y vuelca su resultado a disco. Ningún dato del grafo se
 * construye aquí — eso es justo lo que la prueba `mapaBlueprint.test.ts` (RQ-MB-01, escenario «la
 * CLI delega todo el cálculo») exige poder comprobar por inspección de este fichero.
 *
 * Sin prueba propia (`design.md` §9, «Dónde vive la prueba»): `vitest.config.ts:17-20` no incluye
 * `scripts/**`, así que una prueba aquí no se ejecutaría nunca, en silencio.
 */
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  TRANSITIONS,
  TRANSICION_REMISION_CONFIRMADA,
  TRANSICION_REMISION_RETIRADA,
  ESTADOS_SERVICIO,
  ESTADOS_SIN_SALIDA,
  FASES,
  FASE_POR_ESTADO,
  generarMapaBlueprint,
  type PasoSinBoton,
} from '@ambientalia/shared'

const SIN_BOTON: PasoSinBoton[] = [TRANSICION_REMISION_CONFIRMADA, TRANSICION_REMISION_RETIRADA]

const mapa = generarMapaBlueprint({
  transiciones: TRANSITIONS,
  sinBoton: SIN_BOTON,
  estados: ESTADOS_SERVICIO,
  sinSalida: ESTADOS_SIN_SALIDA,
  fases: FASES,
  fasePorEstado: FASE_POR_ESTADO,
})

// F1B-09 (`mapa-blueprint-tres-flujos`): lo que se ESCRIBE sale del registro por flujo de
// `packages/shared` (`mapaPorFlujo.ts`), el mismo que compara la prueba anti-desfase. Esta
// importación va aquí, y no en el bloque de arriba, para no mover las líneas 26 a 35: están
// citadas por número desde ficheros que esta tanda no edita (regla de mutación 4 de `CLAUDE.md`).
import { ficherosDelMapa } from '@ambientalia/shared'

const ficheros = ficherosDelMapa()

// La llamada de servicio de arriba queda como contraste, no como fuente: si deja de decir lo
// mismo que el registro, se para aquí, antes de escribir nada.
for (const [nombre, contenido] of Object.entries(mapa)) {
  if (ficheros[nombre] !== contenido) {
    throw new Error(`generar-mapa-blueprint: ${nombre} difiere entre la llamada de servicio y el registro por flujo`)
  }
}

const raiz = process.cwd()
for (const [nombre, contenido] of Object.entries(ficheros)) {
  // Escrito directamente, nunca por redirección de shell: en PowerShell 5.1 la redirección
  // produce UTF-16 (mismo aviso que `reconciliacion/cli.ts:128`).
  writeFileSync(path.join(raiz, 'docs/artefactos', nombre), contenido, 'utf8')
}

process.stderr.write(`generar-mapa-blueprint: escritos ${String(Object.keys(ficheros).length)} ficheros en docs/artefactos/\n`)
