/**
 * Extractor de escritores de `ticket_transitions` (RQ-TZ-16). Puro: recibe texto y devuelve lo que encuentra;
 * quien lee el árbol es `escritoresTransiciones.test.ts`.
 *
 * Patrón: `INSERT INTO [esquema.]ticket_transitions`, sin importar mayúsculas ni saltos de línea, con o sin lista
 * de columnas entre paréntesis. Sin lista (`columnas: null`) cuenta como infractor: no se puede saber qué nombra.
 * Límite (S-6): no ve un nombre de tabla interpolado, y lee el texto tal cual, comentarios incluidos.
 */
export interface EscritorTransicion { ruta: string; columnas: string[] | null }

const PATRON = /INSERT\s+INTO\s+(?:[a-z_][a-z0-9_]*\.)?ticket_transitions\b\s*(?:\(([^)]*)\))?/gi

export function escritoresDeTransiciones(ficheros: ReadonlyArray<{ ruta: string; texto: string }>): EscritorTransicion[] {
  return ficheros.flatMap(({ ruta, texto }) =>
    [...texto.matchAll(PATRON)].map((m): EscritorTransicion => ({
      ruta,
      columnas: m[1] === undefined ? null : m[1].split(',').map((c) => c.trim().replace(/"/g, '').toLowerCase()).filter(Boolean),
    })),
  )
}

export const nombraActor = (e: EscritorTransicion): boolean => e.columnas?.includes('performed_by') ?? false
