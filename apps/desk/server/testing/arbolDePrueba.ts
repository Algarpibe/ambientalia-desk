import type { Arbol } from '../reconciliacion/comprobaciones'

/**
 * Arnés del barrido de reconciliación (capacidad `reconciliacion`, R2 de F0-05).
 *
 * `Arbol` es el ÚNICO puerto que el núcleo conoce del entorno (§5 del diseño): cuatro operaciones y
 * ninguna de ellas git ni fs. Aquí se dan en memoria, para que las pruebas del núcleo corran sin
 * lanzar un proceso.
 *
 * Vive en `testing/` y NO en `reconciliacion/` a propósito: el guardián de cabecera que R2.2.6
 * extiende exige las dos frases de código inerte a todo `.ts` no de prueba de la carpeta del módulo,
 * y un arnés de pruebas no es código del módulo.
 */

export interface DatosArbol {
  /** Ruta de disco → contenido completo. */
  ficheros?: Record<string, string>
  /** Prefijo → rutas sin trackear bajo él. */
  sinTrackear?: Record<string, readonly string[]>
  head?: { sha: string; fecha: string; limpio: boolean }
}

/** Una fecha que NO es la de hoy: si el render leyera el reloj, la prueba de D7 lo vería. */
export const HEAD_DE_PRUEBA = { sha: 'abc1234', fecha: '2020-01-02', limpio: true }

export function arbolEnMemoria(datos: DatosArbol = {}): Arbol {
  const ficheros = datos.ficheros ?? {}
  const sinTrackear = datos.sinTrackear ?? {}
  const head = datos.head ?? HEAD_DE_PRUEBA
  return {
    leer: (ruta: string) => ficheros[ruta] ?? null,
    // Devuelve en el orden de declaración, NUNCA ordenado: ordenar es trabajo del núcleo (RQ-RC-02),
    // y un arnés que ya entregue la lista ordenada no distingue si el núcleo lo hace o no.
    listar: (prefijo: string) => Object.keys(ficheros).filter((r) => r.startsWith(prefijo)),
    sinTrackear: (prefijo: string) => [...(sinTrackear[prefijo] ?? [])],
    head: () => ({ ...head }),
  }
}
