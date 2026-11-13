import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * arranque-migracion-estricta (RQ-ZS-57) · contenido de `DEPLOY.md` §26 (regla de secretos de CLAUDE.md: qué cambia y qué se rompe si se pone mal;
 * aquí no hay interruptor: el límite es una constante del código). Molde: `deployModoSinZoho.test.ts`.
 *
 * QUÉ COMPRUEBA: que la §26 existe tras la §25 y es la última hasta la §27; los tres apartados; las dos formas de la línea del registro; el procedimiento con
 * `pg_blocking_pids` y `pg_terminate_backend` del pid raíz; la constante `LIMITE_ESPERA_BLOQUEO_MS` y su valor; y que NO hay interruptor nuevo.
 * QUÉ NO COMPRUEBA: que el texto de la línea coincida con el del módulo (lo fija `puestaAlDiaEstricta.test.ts`) ni que cada línea citada siga
 * diciendo lo que la frase afirma.
 */
const RAIZ = path.resolve(__dirname, '../../..')

/** Lo que falta en la §26 de `texto`: lista vacía si está todo. Pura: se aplica al `DEPLOY.md` real y a copias mutadas. */
export const faltasSeccion26 = (texto: string): string[] => {
  const s25 = texto.indexOf('## 25. ')
  const s26 = texto.indexOf('## 26. ')
  if (s26 === -1) return ['la sección `## 26. `']
  const faltas: string[] = []
  if (s26 <= s25) faltas.push('la §26 detrás de la §25')
  const seccion = texto.slice(s26, texto.indexOf('## 27. ') > s26 ? texto.indexOf('## 27. ') : undefined)
  if ((seccion.match(/^## \d+\./gm) ?? []).length !== 1) faltas.push('la §26 sola hasta la §27')
  for (const cadena of ['### Qué cambia', '### Cómo es la línea del registro', '### Qué hacer si la App no arranca tras desplegar',
    'Fallo al arrancar el servidor', 'Puesta al día de la base detenida', 'límite de espera', 'pg_blocking_pids', 'pg_terminate_backend', 'pid raíz',
    'LIMITE_ESPERA_BLOQUEO_MS', '10 s', 'No hay interruptor nuevo']) {
    if (!seccion.includes(cadena)) faltas.push(cadena)
  }
  return faltas
}

const deploy = readFileSync(path.join(RAIZ, 'DEPLOY.md'), 'utf8')

describe('DEPLOY.md §26 · arranque estricto (RQ-ZS-57)', () => {
  it('el DEPLOY.md real no tiene faltas', () => {
    expect(deploy.indexOf('## 26. ')).toBeGreaterThan(deploy.indexOf('## 25. '))
    expect(faltasSeccion26(deploy)).toEqual([])
  })

  it('sin `pg_terminate_backend`, se pone roja y lo nombra', () => {
    const sin = deploy.split('pg_terminate_backend').join('otra_cosa')
    expect(sin).not.toBe(deploy)
    expect(faltasSeccion26(sin)).toEqual(['pg_terminate_backend'])
  })

  it('sin el apartado «Qué hacer si la App no arranca tras desplegar», se pone roja y lo nombra', () => {
    const sin = deploy.split('### Qué hacer si la App no arranca tras desplegar').join('### Otra cosa')
    expect(sin).not.toBe(deploy)
    expect(faltasSeccion26(sin)).toEqual(['### Qué hacer si la App no arranca tras desplegar'])
  })

  it('discrimina por posición: una §26 que no es la que precede a la §27, o que no existe, tiene falta', () => {
    expect(faltasSeccion26(deploy.replace('## 27. ', '## 99. Otra\n## 27. '))).toEqual(['la §26 sola hasta la §27'])
    expect(faltasSeccion26(deploy.slice(0, deploy.indexOf('## 26. ')))).toEqual(['la sección `## 26. `'])
  })
})
