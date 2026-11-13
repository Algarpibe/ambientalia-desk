import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { TEXTO_CONEXION_PERDIDA, lineaConexionPerdida } from '@ambientalia/zoho-sync/db/conexionPerdida'

/**
 * pool-conexion-cortada (E-285, RQ-ZS-62) · contenido de `DEPLOY.md` §27 (regla de secretos de CLAUDE.md: qué enciende y qué se rompe si se pone mal;
 * aquí no hay interruptor). Molde: `deployArranqueEstricto.test.ts`.
 *
 * QUÉ COMPRUEBA: que la §27 existe tras la §26 y es la última; los tres apartados; el SQLSTATE `57P01`; «salvo que se repita»; la ráfaga de «conexiones en reposo»;
 * el límite del cliente prestado por `pool.connect()`; el canal `stderr`; la remisión a la §26; que NO hay interruptor nuevo; y que el texto fijo y la línea
 * medida de la §27 son LOS DEL CÓDIGO (se importan de `conexionPerdida`, no se copian: si el código cambia la línea, la §27 se pone roja).
 * QUÉ NO COMPRUEBA: que el procedimiento descrito sea el adecuado ni que cada línea citada siga diciendo lo que la frase afirma.
 */
const RAIZ = path.resolve(__dirname, '../../..')

/** La línea tal como la midió I-1 en PostgreSQL 17.10, construida con el código y no copiada. */
export const LINEA_MEDIDA = lineaConexionPerdida(
  Object.assign(new Error('terminating connection due to administrator command'), { code: '57P01' }),
)

/** Lo que falta en la §27 de `texto`: lista vacía si está todo. Pura: se aplica al `DEPLOY.md` real y a copias mutadas. */
export const faltasSeccion27 = (texto: string): string[] => {
  const s26 = texto.indexOf('## 26. ')
  const s27 = texto.indexOf('## 27. ')
  if (s27 === -1) return ['la sección `## 27. `']
  const faltas: string[] = []
  if (s27 <= s26) faltas.push('la §27 detrás de la §26')
  const seccion = texto.slice(s27)
  if ((seccion.match(/^## \d+\./gm) ?? []).length !== 1) faltas.push('la §27 como última sección')
  for (const cadena of ['### Cómo es la línea del registro', '### Qué hacer', '### Lo que no cubre', '57P01', 'salvo que se repita', 'conexiones en reposo',
    'pool.connect()', 'stderr', '§26', 'No hay interruptor nuevo', TEXTO_CONEXION_PERDIDA, LINEA_MEDIDA]) {
    if (!seccion.includes(cadena)) faltas.push(cadena)
  }
  return faltas
}

const deploy = readFileSync(path.join(RAIZ, 'DEPLOY.md'), 'utf8')

describe('DEPLOY.md §27 · conexión de la base cortada (RQ-ZS-62)', () => {
  it('el DEPLOY.md real no tiene faltas', () => {
    expect(deploy.indexOf('## 27. ')).toBeGreaterThan(deploy.indexOf('## 26. '))
    expect(faltasSeccion27(deploy)).toEqual([])
  })

  it('sin la frase «salvo que se repita», se pone roja y la nombra', () => {
    const sin = deploy.split('salvo que se repita').join('otra cosa')
    expect(sin).not.toBe(deploy)
    expect(faltasSeccion27(sin)).toEqual(['salvo que se repita'])
  })

  it('sin la mención del cliente prestado por `pool.connect()`, se pone roja y la nombra', () => {
    const sin = deploy.split('pool.connect()').join('otra cosa')
    expect(sin).not.toBe(deploy)
    expect(faltasSeccion27(sin)).toEqual(['pool.connect()'])
  })

  it('el texto fijo del código es el de la §27: si el código lo cambia, se pone roja', () => {
    const sin = deploy.split(TEXTO_CONEXION_PERDIDA).join('Otro texto')
    expect(sin).not.toBe(deploy)
    expect(faltasSeccion27(sin)).toEqual([TEXTO_CONEXION_PERDIDA, LINEA_MEDIDA])
  })

  it('discrimina por posición: una §27 que no es la última, o que no existe, tiene falta', () => {
    expect(faltasSeccion27(`${deploy}\n## 28. Otra\n`)).toEqual(['la §27 como última sección'])
    expect(faltasSeccion27(deploy.slice(0, deploy.indexOf('## 27. ')))).toEqual(['la sección `## 27. `'])
  })
})
