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
  ESTADOS,
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
  estados: ESTADOS,
  sinSalida: ESTADOS_SIN_SALIDA,
  fases: FASES,
  fasePorEstado: FASE_POR_ESTADO,
})

const raiz = process.cwd()
for (const [nombre, contenido] of Object.entries(mapa)) {
  // Escrito directamente, nunca por redirección de shell: en PowerShell 5.1 la redirección
  // produce UTF-16 (mismo aviso que `reconciliacion/cli.ts:128`).
  writeFileSync(path.join(raiz, 'docs/artefactos', nombre), contenido, 'utf8')
}

process.stderr.write(`generar-mapa-blueprint: escritos ${String(Object.keys(mapa).length)} ficheros en docs/artefactos/\n`)
