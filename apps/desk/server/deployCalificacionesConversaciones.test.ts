import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * calificaciones-cuadre-conversaciones (D-9, RQ-ZS-51) · contenido de `DEPLOY.md` §25 (regla de secretos de CLAUDE.md: qué enciende y qué se rompe si se
 * pone mal). Molde: `deployModoSinZoho.test.ts`.
 *
 * QUÉ COMPRUEBA: que la §25 existe tras la §24 y es la última; los dos apartados en negrita; `numeros` con el orden «primero `limite=0`, después sin él»;
 * el resumen guardado (`ultimaGuardada` y la tabla); el límite de las peticiones (contacto y cuenta no contados); el canal `FEEDBACK`; y que NO hay
 * interruptor nuevo (las dos variables que ya gobiernan).
 * QUÉ NO COMPRUEBA: que cada línea citada siga diciendo lo que la frase afirma ni `.env.example` (no cambia).
 */
const RAIZ = path.resolve(__dirname, '../../..')

/** Lo que falta en la §25 de `texto`: lista vacía si está todo. Pura: se aplica al `DEPLOY.md` real y a copias mutadas. */
export const faltasSeccion25 = (texto: string): string[] => {
  const s24 = texto.indexOf('## 24. ')
  const s25 = texto.indexOf('## 25. ')
  if (s25 === -1) return ['la sección `## 25. `']
  const faltas: string[] = []
  if (s25 <= s24) faltas.push('la §25 detrás de la §24')
  const seccion = texto.slice(s25)
  if ((seccion.match(/^## \d+\./gm) ?? []).length !== 1) faltas.push('la §25 como última sección')
  for (const cadena of ['**Qué enciende:**', '**Qué se rompe si se pone mal:**', '`numeros`', 'limite=0', 'ultimaGuardada', 'relleno_conversaciones_pasadas', 'FEEDBACK',
    'RELLENO_CONVERSACIONES_HABILITADO', 'MARCAR_CONVERSACIONES_AUSENTES', 'No hay interruptor nuevo', 'contacto y cuenta']) {
    if (!seccion.includes(cadena)) faltas.push(cadena)
  }
  const desde = seccion.indexOf('**Qué se rompe si se pone mal:**'); const resto = desde === -1 ? '' : seccion.slice(desde + 4)
  const tramo = desde === -1 ? '' : seccion.slice(desde, desde + 4 + (resto.search(/^#+ /m) === -1 ? resto.length : resto.search(/^#+ /m)))
  for (const cadena of ['`numeros`', 'noEncontrados', '`400`', '`503`']) if (desde !== -1 && !tramo.includes(cadena)) faltas.push(`${cadena} en «Qué se rompe si se pone mal»`)
  const a = seccion.indexOf('limite=0'); const b = seccion.indexOf('sin `limite`', a)
  if (a !== -1 && b === -1) faltas.push('el orden: primero `limite=0`, después sin él')
  return faltas
}

const deploy = readFileSync(path.join(RAIZ, 'DEPLOY.md'), 'utf8')

describe('DEPLOY.md §25 · calificaciones, numeros y resumen guardado (RQ-ZS-51)', () => {
  it('el DEPLOY.md real no tiene faltas', () => {
    expect(deploy.indexOf('## 25. ')).toBeGreaterThan(deploy.indexOf('## 24. '))
    expect(faltasSeccion25(deploy)).toEqual([])
  })

  it('sin la mención a `numeros`, se pone roja y la nombra', () => {
    const sin = deploy.split('`numeros`').join('`otros`')
    expect(sin).not.toBe(deploy)
    expect(faltasSeccion25(sin)).toEqual(['`numeros`', '`numeros` en «Qué se rompe si se pone mal»'])
  })

  it('quitar `numeros` sólo del apartado «Qué se rompe si se pone mal» también la pone roja', () => {
    const i = deploy.indexOf('**Qué se rompe si se pone mal:**')
    const sin = deploy.slice(0, i) + deploy.slice(i).replace('`numeros` mal escrito', '`otros` mal escrito')
    expect(faltasSeccion25(sin)).toEqual(['`numeros` en «Qué se rompe si se pone mal»'])
  })

  it('sin el apartado «Qué se rompe si se pone mal», se pone roja y lo nombra', () => {
    const sin = deploy.split('**Qué se rompe si se pone mal:**').join('**Otra cosa:**')
    expect(faltasSeccion25(sin)).toEqual(['**Qué se rompe si se pone mal:**'])
  })

  it('sin la afirmación de que no hay interruptor nuevo, se pone roja', () => {
    const sin = deploy.split('No hay interruptor nuevo').join('Hay uno')
    expect(faltasSeccion25(sin)).toEqual(['No hay interruptor nuevo'])
  })

  it('discrimina por posición: una §25 que no es la última, o que no existe, tiene falta', () => {
    expect(faltasSeccion25(`${deploy}\n## 26. Otra\n`)).toEqual(['la §25 como última sección'])
    expect(faltasSeccion25(deploy.slice(0, deploy.indexOf('## 25. ')))).toEqual(['la sección `## 25. `'])
  })
})
