import type { IndiceDrive } from './incremental'

/**
 * Retención de 12 meses (F1F-02, RQ-ZS-21), PURA y guiada por el índice. Candidata: una versión superada hace ≥ 12 meses
 * de calendario (UTC), o TODAS las de un documento desaparecido de Drive hace ≥ 12 meses. La última versión de un
 * documento vivo no lo es nunca, aunque el índice diga otra cosa: una guarda explícita, no sólo la construcción.
 */
export interface Retirada { id: string; clave: string; versionId?: string; motivo: 'superada' | 'desaparecido' }

/** Instante a partir del cual (inclusive) algo ya cumplió 12 meses. */
const umbral = (ahora: Date | string): number => {
  const d = new Date(ahora)
  return Date.UTC(d.getUTCFullYear() - 1, d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds())
}
const vencido = (fecha: string | undefined, limite: number): boolean => !!fecha && new Date(fecha).getTime() <= limite

export function aRetirar(indice: IndiceDrive, ahora: Date | string): Retirada[] {
  const limite = umbral(ahora)
  return Object.entries(indice.documentos).flatMap(([id, e]) => {
    const desaparecido = vencido(e.desaparecidoEn, limite)
    return e.versiones.flatMap((x, i): Retirada[] => {
      const ultimaDeVivo = !e.desaparecidoEn && i === e.versiones.length - 1
      if (desaparecido) return [{ id, clave: x.clave, versionId: x.versionId, motivo: 'desaparecido' }]
      return !ultimaDeVivo && vencido(x.superadaEn, limite) ? [{ id, clave: x.clave, versionId: x.versionId, motivo: 'superada' }] : []
    })
  })
}

/** Quita del índice lo que se borró de verdad; el documento que se queda sin versiones sale también. */
export function quitarRetirados(indice: IndiceDrive, retiradas: Array<{ clave: string }>): IndiceDrive {
  const fuera = new Set(retiradas.map((r) => r.clave))
  const documentos = Object.fromEntries(Object.entries(indice.documentos)
    .map(([id, e]) => [id, { ...e, versiones: e.versiones.filter((x) => !fuera.has(x.clave)) }] as const)
    .filter(([, e]) => e.versiones.length > 0))
  return { ...indice, documentos }
}
