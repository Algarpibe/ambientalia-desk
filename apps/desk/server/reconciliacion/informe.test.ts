import { describe, expect, it } from 'vitest'
import { HEAD_DE_PRUEBA, arbolEnMemoria } from '../testing/arbolDePrueba'
import { reconciliar } from './comprobaciones'
import { informe } from './informe'

const SALTO = String.fromCharCode(10)

/** `capabilities` declara dos; en disco hay cuatro specs, así que `delta` y `gamma` son huérfanas. */
const CONFIG = [
  'capabilities:',
  '  - alfa',
  '  - beta',
].join(SALTO)

/** Las huérfanas se declaran DESORDENADAS a propósito: ordenarlas es trabajo del núcleo. */
const arbol = arbolEnMemoria({
  ficheros: {
    'openspec/config.yaml': CONFIG,
    'openspec/specs/beta/spec.md': '# beta',
    'openspec/specs/delta/spec.md': '# delta',
    'openspec/specs/alfa/spec.md': '# alfa',
    'openspec/specs/gamma/spec.md': '# gamma',
  },
  head: HEAD_DE_PRUEBA,
})

describe('informe · RQ-RC-02: dos pasadas sobre un árbol quieto dan un fichero IDÉNTICO (R2.1.1)', () => {
  it('dos llamadas seguidas devuelven exactamente el mismo texto', () => {
    const primera = informe(reconciliar(arbol), arbol.head())
    const segunda = informe(reconciliar(arbol), arbol.head())
    expect(segunda).toBe(primera)
  })

  it('la cabecera lleva el sha y la FECHA DEL COMMIT medido, no la del reloj (D7)', () => {
    const texto = informe(reconciliar(arbol), arbol.head())
    const hoy = new Date().toISOString().slice(0, 10)
    expect(texto).toContain(HEAD_DE_PRUEBA.sha)
    expect(texto).toContain(HEAD_DE_PRUEBA.fecha)
    // Si el render leyera el reloj, la fecha de hoy aparecería y el fichero cambiaría solo cada día.
    expect(texto).not.toContain(hoy)
  })

  it('las listas salen ORDENADAS, no en el orden en que el entorno las entregó', () => {
    const texto = informe(reconciliar(arbol), arbol.head())
    expect(texto.indexOf('gamma')).toBeGreaterThan(-1)
    expect(texto.indexOf('delta')).toBeGreaterThan(-1)
    expect(texto.indexOf('delta')).toBeLessThan(texto.indexOf('gamma'))
  })
})
