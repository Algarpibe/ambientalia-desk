/**
 * Detector de citas (capacidad `citas-verificables`).
 *
 * Este fichero viaja a la imagen de producción como código INERTE: no lo ejecuta el servidor, sólo
 * el hook de `pre-push` bajo `tsx` (RQ-CV-18). NADA de producción lo importa — `guardianes.test.ts`
 * recorre el grafo de imports desde `apps/desk/server/index.ts` y lo comprueba.
 *
 * El mensaje de RQ-CV-10 (§5 del diseño): cuatro cifras, el desglose de las saltadas, «no son citas»
 * fuera de ellas, las listas y las frases fijas. Adónde se escribe lo decide el CLI.
 */
import type { ItemCita, ResultadoDeteccion } from './detector'

export interface ContextoInforme {
  sha: string
  ref: string
  /** `<sha corto>`, `origin/main` o `NO HECHO: <motivo>`: lo resuelve el CLI (unidad 1b). */
  indiceRemoto: string
}

const SALTO = String.fromCharCode(10)

function cifra(etiqueta: string, valor: string | number, nota?: string): string {
  const puntos = '.'.repeat(Math.max(2, 23 - etiqueta.length))
  return `  ${etiqueta} ${puntos} ${valor}${nota ? `   (${nota})` : ''}`
}

function lista(titulo: string, items: readonly ItemCita[]): string[] {
  if (items.length === 0) return []
  return [`${titulo}:`, ...items.map((i) => `  - ${i.fichero}, línea ${i.linea}: ${i.cita} — ${i.motivo}`)]
}

export function informe(r: ResultadoDeteccion, contexto: ContextoInforme): string {
  const s = r.saltadas
  const saltadas = s.sinBarra + s.ambiguas + s.directorios + s.huerfanas
  return [
    `citas · ${contexto.sha} · ${contexto.ref}`,
    cifra('comprobadas', r.comprobadas),
    cifra('saltadas', saltadas, `sin barra y sin resolver ${s.sinBarra} · ambiguas con alguna candidata válida ${s.ambiguas} · directorios ${s.directorios} · abreviadas huérfanas ${s.huerfanas}`),
    cifra('fuera del repositorio', r.fueraDelRepositorio),
    cifra('abreviadas rotas', r.abreviadasRotas.length, 'informativas: no bloquean'),
    cifra('no son citas', r.noSonCitas, 'marcas de hora ISO, horas y puertos de URL; fuera de las cuatro cifras'),
    cifra('índice remoto', contexto.indiceRemoto),
    cifra('línea base', `${r.informadas} informadas · ${r.caducadas.length} caducadas`),
    ...lista('Abreviadas rotas', r.abreviadasRotas),
    ...lista('Bloqueantes', r.bloqueantes),
    ...lista('Caducadas (entradas de la base que ya no están rotas: quítalas)', r.caducadas),
    'El detector NO comprueba que la línea diga lo que la frase afirma: eso sigue siendo lectura humana.',
    'Las abreviadas rotas no bloquean: su referente lo decide quien lee el contexto, no la sintaxis.',
    'Un bloqueo tiene dos salidas legítimas: reparar la cita, o añadirla a mano a la línea base.',
    'El ancla va en la misma línea física que su cita: si el ancla va en la línea siguiente, júntala con su cita.',
  ].join(SALTO)
}
