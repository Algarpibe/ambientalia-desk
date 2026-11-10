import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * modo-sin-zoho (1G-04, D-9, RQ-ZS-47) · presencia de `MODO_SIN_ZOHO_DESK` en `DEPLOY.md` §24 (regla de secretos de CLAUDE.md: un interruptor
 * nace cerrado y se documenta con dos frases, qué enciende y qué se rompe si se pone mal). Molde: `deployVerificacionCompletitud.test.ts`.
 *
 * QUÉ COMPRUEBA: que la §24 existe tras la §23 y va antes de la §25; que el apartado de la variable dice las dos frases, que nace cerrada con
 * `=== 'true'` (y el código lo lee así) y que lleva su línea de entorno con `false`; que nombra los DOS servicios (`ambientalia-desk`,
 * `zoho-hub-sync`, el worker `hub-sync`), la ruta del `GET`, el log del worker, `cortes` frente a `rechazos` y «redesplegar los dos».
 * QUÉ NO COMPRUEBA: `.env.example` (lo añade una persona, P-1) ni que cada línea citada siga diciendo lo que la frase afirma.
 */
const RAIZ = path.resolve(__dirname, '../../..')
const VARIABLE = 'MODO_SIN_ZOHO_DESK'

/** Lo que falta en la §24 de `texto`: lista vacía si está todo. Pura: la misma función se aplica al `DEPLOY.md` real y a copias mutadas. */
export const faltasSeccion24 = (texto: string): string[] => {
  const faltas: string[] = []
  const s23 = texto.indexOf('## 23. ')
  const s24 = texto.indexOf('## 24. ')
  if (s24 === -1) return ['la sección `## 24. `']
  if (s24 <= s23) faltas.push('la §24 detrás de la §23')
  const seccion = texto.slice(s24, texto.indexOf("## 25. ") > s24 ? texto.indexOf("## 25. ") : undefined)
  if ((seccion.match(/^## \d+\./gm) ?? []).length !== 1) faltas.push('la §24 sola hasta la §25')
  const desde = seccion.indexOf(`### \`${VARIABLE}\``)
  const resto = desde === -1 ? '' : seccion.slice(desde + 4)
  const fin = resto.search(/^##+ /m)
  const tramo = desde === -1 ? '' : fin === -1 ? seccion.slice(desde) : seccion.slice(desde, desde + 4 + fin)
  if (tramo === '') faltas.push(`el apartado \`${VARIABLE}\``)
  const exige = (donde: string, cadena: string, nombre: string = cadena): void => {
    if (!donde.includes(cadena)) faltas.push(nombre)
  }
  exige(tramo, '**Qué enciende:**')
  exige(tramo, '**Qué se rompe si se pone mal:**')
  exige(tramo, '**Nace cerrado**')
  exige(tramo, "`=== 'true'`")
  if (!/^> MODO_SIN_ZOHO_DESK=false\s*$/m.test(tramo)) faltas.push('la línea `> MODO_SIN_ZOHO_DESK=false`')
  for (const cadena of ['ambientalia-desk', 'zoho-hub-sync', 'worker `hub-sync`', '/api/admin/modo-sin-zoho-desk', 'log del worker', 'cortes', 'rechazos', 'redesplegar los dos']) {
    exige(seccion, cadena)
  }
  return faltas
}

const deploy = readFileSync(path.join(RAIZ, 'DEPLOY.md'), 'utf8')
const config = readFileSync(path.join(RAIZ, 'packages/zoho-sync/src/config.ts'), 'utf8')

describe('DEPLOY.md §24 · MODO_SIN_ZOHO_DESK (1G-04, RQ-ZS-47)', () => {
  it('el DEPLOY.md real no tiene faltas', () => {
    expect(deploy.indexOf('## 24. ')).toBeGreaterThan(deploy.indexOf('## 23. ')); expect(deploy.indexOf("## 25. ")).toBeGreaterThan(deploy.indexOf("## 24. "))
    expect(faltasSeccion24(deploy)).toEqual([])
  })

  it('sin la mención al worker, la prueba se pone roja y la nombra', () => {
    const sinWorker = deploy.split('worker `hub-sync`').join('el otro servicio').split('zoho-hub-sync').join('el otro')
    expect(sinWorker).not.toBe(deploy)
    expect(faltasSeccion24(sinWorker)).toEqual(['zoho-hub-sync', 'worker `hub-sync`'])
  })

  it('sin el apartado «Qué se rompe si se pone mal», se pone roja y lo nombra', () => {
    const sin = deploy.split('**Qué se rompe si se pone mal:**').join('**Otra cosa:**')
    expect(faltasSeccion24(sin)).toEqual(['**Qué se rompe si se pone mal:**'])
  })

  it('discrimina por posición: una §24 que no es la que precede a la §25, o que no existe, tiene falta', () => {
    expect(faltasSeccion24(deploy.replace('## 25. ', '## 99. Otra\n## 25. '))).toEqual(['la §24 sola hasta la §25'])
    expect(faltasSeccion24(deploy.slice(0, deploy.indexOf('## 24. ')))).toEqual(['la sección `## 24. `'])
  })

  it("nace cerrado con `=== 'true'` y el código lo lee así", () => {
    expect(config).toContain(`env.${VARIABLE} === 'true'`)
  })
})
