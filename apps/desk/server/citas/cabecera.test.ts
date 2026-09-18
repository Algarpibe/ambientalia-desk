import { describe, it, expect } from 'vitest'
import { comprobarCabeceras } from './cabecera'

/**
 * Rojo previo de la cabecera R-1 (capacidad `citas-verificables`, RQ-CV-19). §7 del diseño de
 * F0-05, filas 1-5: los siete campos, la forma (nunca el criterio) y el control del otro signo.
 *
 * Ninguna cabecera de estas pruebas lleva un `tanda:` que exista de verdad en el árbol — el propio
 * barrido de cabeceras leería este fichero como una afirmación real si lo hiciera (mismo cuidado que
 * `apps/desk/server/testing/reposDePrueba.ts`).
 */

const SALTO = String.fromCharCode(10)

function bloque(lineas: readonly string[]): string {
  return ['---', ...lineas, '---', ''].join(SALTO)
}

/** Cabecera con forma y dominio válidos de punta a punta — la base que cada prueba desvía en UN campo. */
const VALIDA = [
  'tanda: F9-99',
  'motivo: ""',
  'capacidad: []',
  'maestro: []',
  'cierra: si',
  'toca_maestro: no',
  'origen_cabecera: derivada-17/09',
]

describe('comprobarCabeceras · RQ-CV-19: forma de los siete campos', () => {
  it('sin bloque `---` inicial: el fichero es inválido (R1.1.1)', () => {
    const ficheros = [{ ruta: 'openspec/changes/x/proposal.md', texto: '# Propuesta sin cabecera' + SALTO }]
    const r = comprobarCabeceras(ficheros)
    expect(r.comprobadas).toBe(1)
    expect(r.invalidas).toHaveLength(1)
    expect(r.invalidas[0].fichero).toBe('openspec/changes/x/proposal.md')
    expect(r.invalidas[0].campo).toBeNull()
  })

  it('`fuera-del-plan` con `motivo: ""`: inválida por el campo `motivo` (R1.1.2)', () => {
    const lineas = VALIDA.map((l) => (l.startsWith('tanda:') ? 'tanda: fuera-del-plan' : l))
    const ficheros = [{ ruta: 'openspec/changes/x/proposal.md', texto: bloque(lineas) }]
    const r = comprobarCabeceras(ficheros)
    expect(r.invalidas).toHaveLength(1)
    expect(r.invalidas[0].campo).toBe('motivo')
  })

  it('sin `origen_cabecera`: inválida por ese campo, el más reciente (R1.1.3)', () => {
    const lineas = VALIDA.filter((l) => !l.startsWith('origen_cabecera:'))
    const ficheros = [{ ruta: 'openspec/changes/x/proposal.md', texto: bloque(lineas) }]
    const r = comprobarCabeceras(ficheros)
    expect(r.invalidas).toHaveLength(1)
    expect(r.invalidas[0].campo).toBe('origen_cabecera')
  })

  it('`cierra: quizá`: fuera del dominio cerrado {si, no} (R1.1.4a)', () => {
    const lineas = VALIDA.map((l) => (l.startsWith('cierra:') ? 'cierra: quizá' : l))
    const ficheros = [{ ruta: 'openspec/changes/x/proposal.md', texto: bloque(lineas) }]
    const r = comprobarCabeceras(ficheros)
    expect(r.invalidas).toHaveLength(1)
    expect(r.invalidas[0].campo).toBe('cierra')
  })

  it('`origen_cabecera: heredada`: fuera del dominio cerrado (R1.1.4b)', () => {
    const lineas = VALIDA.map((l) => (l.startsWith('origen_cabecera:') ? 'origen_cabecera: heredada' : l))
    const ficheros = [{ ruta: 'openspec/changes/x/proposal.md', texto: bloque(lineas) }]
    const r = comprobarCabeceras(ficheros)
    expect(r.invalidas).toHaveLength(1)
    expect(r.invalidas[0].campo).toBe('origen_cabecera')
  })

  it('control del otro signo: `tanda: F9-99`, forma y dominio válidos, pasa aunque el contenido sea discutible (R1.1.5)', () => {
    const ficheros = [{ ruta: 'openspec/changes/x/proposal.md', texto: bloque(VALIDA) }]
    const r = comprobarCabeceras(ficheros)
    expect(r.comprobadas).toBe(1)
    expect(r.invalidas).toEqual([])
  })
})
