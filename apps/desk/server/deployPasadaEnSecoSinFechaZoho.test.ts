import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * pasada-en-seco-sin-fecha-zoho (F1F-01, RQ-ZS-71) · `DEPLOY.md` §14 nombra `sinFechaDeZoho` en la viñeta de la pasada en seco, y dice que no impide
 * aplicar y qué pregunta de Gerencia decide. Molde: `deployPoolConexionCortada.test.ts`.
 *
 * QUÉ COMPRUEBA: que, dentro de la viñeta «Una pasada en seco» de la §14 (y no en otro sitio del fichero), están los tres textos pedidos.
 * QUÉ NO COMPRUEBA: que la frase describa bien el campo ni que el procedimiento sea el adecuado.
 */
const RAIZ = path.resolve(__dirname, '../../..')

/** Lo que falta en la viñeta de la pasada en seco de la §14 de `texto`. Pura: se aplica al `DEPLOY.md` real y a copias mutadas. */
export const faltasPasadaEnSeco = (texto: string): string[] => {
  const t = texto.replace(/\r\n/g, '\n')
  const ini = t.indexOf('## 14. ')
  const fin = t.indexOf('## 15. ')
  if (ini === -1 || fin <= ini) return ['la sección `## 14. `']
  const seccion = t.slice(ini, fin)
  const v = seccion.indexOf('- **Una pasada en seco**')
  if (v === -1) return ['la viñeta «Una pasada en seco»']
  const resto = seccion.slice(v)
  const corte = resto.indexOf('\n\n')
  const vineta = (corte === -1 ? resto : resto.slice(0, corte)).replace(/\s+/g, ' ')
  return ['sinFechaDeZoho', 's11-migrados-sin-fecha-de-zoho', 'no impide aplicar'].filter((c) => !vineta.includes(c))
}

const deploy = readFileSync(path.join(RAIZ, 'DEPLOY.md'), 'utf8')

describe('DEPLOY.md §14 · sinFechaDeZoho en la viñeta de la pasada en seco (RQ-ZS-71)', () => {
  it('P8a · el DEPLOY.md real no tiene faltas', () => {
    expect(faltasPasadaEnSeco(deploy)).toEqual([])
  })

  it('P8b · sin el nombre del campo, se pone roja y lo nombra', () => {
    const sin = deploy.split('sinFechaDeZoho').join('sinFecha')
    expect(sin).not.toBe(deploy)
    expect(faltasPasadaEnSeco(sin)).toEqual(['sinFechaDeZoho'])
  })

  it('P8c · posición: el nombre fuera de la viñeta no la satisface', () => {
    expect(deploy).toContain('sinFechaDeZoho') // precondición: hay un nombre que sacar de la viñeta
    const sin = deploy.split('sinFechaDeZoho').join('sinFecha')
    expect(faltasPasadaEnSeco(`${sin}\nsinFechaDeZoho\n`)).toEqual(['sinFechaDeZoho'])
    const antesDeLosPasos = sin.replace('**Los cinco pasos, en este orden', 'sinFechaDeZoho\n\n**Los cinco pasos, en este orden')
    expect(antesDeLosPasos).not.toBe(sin)
    expect(faltasPasadaEnSeco(antesDeLosPasos)).toEqual(['sinFechaDeZoho'])
  })
})
