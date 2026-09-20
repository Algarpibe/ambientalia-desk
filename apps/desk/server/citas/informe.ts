/**
 * Detector de citas (capacidad `citas-verificables`).
 *
 * Este fichero viaja a la imagen de producción como código INERTE: no lo ejecuta el servidor, sólo
 * el hook de `pre-push` bajo `tsx` (RQ-CV-18). NADA de producción lo importa — `guardianes.test.ts`
 * recorre el grafo de imports desde `apps/desk/server/index.ts` y lo comprueba.
 *
 * El mensaje de RQ-CV-10 (§5 del diseño): CINCO cifras desde F0-05 R1 —la quinta, cabeceras R-1
 * inválidas—, el desglose de las saltadas, «no son citas» fuera de ellas, las listas y las frases
 * fijas. Adónde se escribe lo decide el CLI.
 */
import type { ItemCita, ResultadoDeteccion } from './detector'
import type { CabeceraInvalida, ResultadoCabeceras } from './cabecera'

export interface ContextoInforme {
  sha: string
  ref: string
  /** `<sha corto>`, `origin/main` o `NO HECHO: <motivo>`: lo resuelve el CLI (unidad 1b). */
  indiceRemoto: string
  /** RQ-CV-10 (decisión b): ficheros de texto que git trata como binarios, no barridos (tarea 2.25). */
  binarios?: number
  /** RQ-CV-19/RQ-CV-20 (F0-05, R1): la quinta cifra. Sin ella, cero cabeceras inválidas — D4: el
   *  resultado de cabeceras NO entra en el invariante de conservación de citas de `detector.ts`, se
   *  suma aparte y sólo en `informe()` y en el código de salida (OR). */
  cabeceras?: ResultadoCabeceras
}

const SALTO = String.fromCharCode(10)
const SIN_CABECERAS: ResultadoCabeceras = { comprobadas: 0, invalidas: [] }

function cifra(etiqueta: string, valor: string | number, nota?: string): string {
  const puntos = '.'.repeat(Math.max(2, 23 - etiqueta.length))
  return `  ${etiqueta} ${puntos} ${valor}${nota ? `   (${nota})` : ''}`
}

function lista(titulo: string, items: readonly ItemCita[]): string[] {
  if (items.length === 0) return []
  return [`${titulo}:`, ...items.map((i) => `  - ${i.fichero}, línea ${i.linea}: ${i.cita} — ${i.motivo}`)]
}

/** RQ-CV-10: fichero y campo que falla; `campo: null` es «falta el bloque entero» (RQ-CV-10). */
function listaCabeceras(items: readonly CabeceraInvalida[]): string[] {
  if (items.length === 0) return []
  return [
    'Cabeceras R-1 inválidas:',
    ...items.map((i) => `  - ${i.fichero}${i.campo !== null ? `, campo '${i.campo}'` : ''}: ${i.motivo}`),
  ]
}

export function informe(r: ResultadoDeteccion, contexto: ContextoInforme): string {
  const s = r.saltadas
  const saltadas = s.sinBarra + s.ambiguas + s.directorios + s.huerfanas + s.anclasSinResolver + s.noLegibles
  const cabeceras = contexto.cabeceras ?? SIN_CABECERAS
  return [
    `citas · ${contexto.sha} · ${contexto.ref}`,
    cifra('comprobadas', r.comprobadas),
    cifra('saltadas', saltadas, `sin barra y sin resolver ${s.sinBarra} · ambiguas con alguna candidata válida ${s.ambiguas} · directorios ${s.directorios} · abreviadas huérfanas ${s.huerfanas} · anclas sin resolver ${s.anclasSinResolver} · no legibles ${s.noLegibles}`),
    cifra('fuera del repositorio', r.fueraDelRepositorio),
    cifra('abreviadas rotas', r.abreviadasRotas.length, 'informativas: no bloquean'),
    cifra('cabeceras R-1 inválidas', cabeceras.invalidas.length, 'la única salida es escribirla: no hay línea base'),
    cifra('no son citas', r.noSonCitas, 'marcas de hora ISO, horas y puertos de URL; fuera de las cuatro cifras'),
    cifra('texto que git cree binario', contexto.binarios ?? 0, 'no barridos'),
    cifra('índice remoto', contexto.indiceRemoto),
    cifra('línea base', `${r.informadas} informadas · ${r.caducadas.length} caducadas`),
    ...lista('Abreviadas rotas', r.abreviadasRotas),
    ...lista('Bloqueantes', r.bloqueantes),
    ...lista('Caducadas (entradas de la base que ya no están rotas: quítalas)', r.caducadas),
    ...listaCabeceras(cabeceras.invalidas),
    'El detector NO comprueba que la línea diga lo que la frase afirma, ni que el tanda: de una cabecera sea el que le corresponde: eso sigue siendo lectura humana.',
    'Las abreviadas rotas no bloquean: su referente lo decide quien lee el contexto, no la sintaxis.',
    'Un bloqueo de cita tiene dos salidas legítimas: reparar la cita, o añadirla a mano a la línea base.',
    'Una cabecera inválida tiene una sola salida legítima: escribirla — no hay línea base para cabeceras.',
    'El ancla va en la misma línea física que su cita: si el ancla va en la línea siguiente, júntala con su cita.',
  ].join(SALTO)
}
