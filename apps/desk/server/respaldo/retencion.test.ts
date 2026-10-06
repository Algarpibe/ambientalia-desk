import { describe, it, expect } from 'vitest'
import { aRetirar, quitarRetirados } from './retencion'
import type { EntradaIndice, IndiceDrive, VersionCopiada } from './incremental'

/** F1F-02 (RQ-ZS-21): la retención es pura y la guía el índice. 12 meses de calendario en UTC. */
const AHORA = new Date('2026-10-04T05:00:00.000Z')
const v = (clave: string, copiadaEn: string, superadaEn?: string): VersionCopiada => ({ clave, versionId: `id-${clave}`, copiadaEn, huella: clave, ...(superadaEn ? { superadaEn } : {}) })
const entrada = (versiones: VersionCopiada[], desaparecidoEn?: string): EntradaIndice => ({ nombre: 'a.pdf', ruta: 'a.pdf', mimeType: 'application/pdf', versiones, ...(desaparecidoEn ? { desaparecidoEn } : {}) })
const indice = (documentos: Record<string, EntradaIndice>): IndiceDrive => ({ formato: 1, actualizado: '2026-10-04T05:00:00.000Z', documentos })
const claves = (r: Array<{ clave: string }>) => r.map((x) => x.clave).sort()

describe('aRetirar', () => {
  it('versión superada: borra la de hace más de 12 meses, conserva la de hace menos y la última', () => {
    const i = indice({ d1: entrada([v('a', '2025-01-01T00:00:00Z', '2025-06-01T00:00:00Z'), v('b', '2025-06-01T00:00:00Z', '2026-03-01T00:00:00Z'), v('c', '2026-03-01T00:00:00Z')]) })
    expect(aRetirar(i, AHORA)).toEqual([{ id: 'd1', clave: 'a', versionId: 'id-a', motivo: 'superada' }])
  })
  it('el límite es de calendario y UTC: justo a los 12 meses ya vence, un segundo antes no', () => {
    const al = (sup: string) => aRetirar(indice({ d: entrada([v('a', '2025-01-01T00:00:00Z', sup), v('b', '2025-10-04T00:00:00Z')]) }), AHORA)
    expect(al('2025-10-04T05:00:00.000Z')).toHaveLength(1)
    expect(al('2025-10-04T05:00:00.001Z')).toHaveLength(0)
  })
  it('documento desaparecido hace más de 12 meses: se borran TODAS sus copias; hace menos, se conservan', () => {
    const vs = [v('a', '2024-01-01T00:00:00Z', '2025-12-01T00:00:00Z'), v('b', '2025-12-01T00:00:00Z')]
    expect(aRetirar(indice({ d: entrada(vs, '2025-10-01T00:00:00Z') }), AHORA).map((r) => `${r.clave}:${r.motivo}`).sort()).toEqual(['a:desaparecido', 'b:desaparecido'])
    expect(aRetirar(indice({ d: entrada(vs, '2025-11-01T00:00:00Z') }), AHORA)).toEqual([])
  })
  it('última copia: un documento vivo que no cambia desde hace años no pierde su única copia', () => {
    expect(aRetirar(indice({ d: entrada([v('a', '2020-01-01T00:00:00Z')]) }), AHORA)).toEqual([])
  })
  it('PROPIEDAD: la última versión de un documento vivo nunca es candidata, ni con un índice con datos absurdos', () => {
    let s = 7
    const azar = (n: number) => { s = (s * 1103515245 + 12345) % 2147483648; return s % n }
    const fecha = () => new Date(Date.UTC(2020 + azar(7), azar(12), 1 + azar(28))).toISOString()
    for (let caso = 0; caso < 300; caso++) {
      const documentos: Record<string, EntradaIndice> = {}
      for (let d = 0; d < 1 + azar(4); d++) {
        const n = 1 + azar(5)
        // Incluye `superadaEn` en la ÚLTIMA versión a propósito: por construcción no debería existir y aun así no se retira.
        documentos[`d${d}`] = entrada(Array.from({ length: n }, (_, k) => v(`d${d}-${k}`, fecha(), azar(2) ? fecha() : undefined)), azar(3) === 0 ? fecha() : undefined)
      }
      const retiradas = claves(aRetirar(indice(documentos), AHORA))
      for (const [, e] of Object.entries(documentos)) {
        if (e.desaparecidoEn) continue
        expect(retiradas, JSON.stringify(e)).not.toContain(e.versiones.at(-1)!.clave)
      }
    }
  })
  it('no muta el índice de entrada', () => {
    const i = indice({ d: entrada([v('a', '2020-01-01T00:00:00Z', '2020-02-01T00:00:00Z'), v('b', '2020-02-01T00:00:00Z')]) })
    const antes = structuredClone(i)
    aRetirar(i, AHORA)
    expect(i).toEqual(antes)
  })
})

describe('quitarRetirados', () => {
  it('quita sólo las versiones borradas y suelta el documento que se queda sin ninguna', () => {
    const i = indice({ d1: entrada([v('a', '2025-01-01T00:00:00Z', '2025-02-01T00:00:00Z'), v('b', '2025-02-01T00:00:00Z')]), d2: entrada([v('c', '2024-01-01T00:00:00Z')], '2024-02-01T00:00:00Z') })
    const antes = structuredClone(i)
    const r = quitarRetirados(i, [{ clave: 'a' }, { clave: 'c' }])
    expect(Object.keys(r.documentos)).toEqual(['d1'])
    expect(r.documentos.d1.versiones.map((x) => x.clave)).toEqual(['b'])
    expect(i).toEqual(antes)
  })
})
