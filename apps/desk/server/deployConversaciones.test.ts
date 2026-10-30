import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * 1G-01 · presencia de los dos interruptores de conversaciones en `DEPLOY.md` §18 y §19, y del paso de persona en la §20 (regla de
 * secretos de CLAUDE.md: un interruptor que enciende un escritor nace cerrado y se documenta con dos frases, qué enciende y qué se
 * rompe si se pone mal). Molde de `deploySalidasEsperas.test.ts`.
 *
 * QUÉ COMPRUEBA: que las tres secciones existen tras la §17 y en orden, que las dos de interruptor dicen las dos frases, que nacen
 * cerradas y llevan su línea de entorno vacía, que la §20 pide la copia previa y nombra la ruta del relleno, y que el código lee las
 * dos variables con `=== 'true'`.
 * QUÉ NO COMPRUEBA: `.env.example` (lo añade una persona, P-1) ni que cada línea citada siga diciendo lo que la frase afirma.
 */
const RAIZ = path.resolve(__dirname, '../../..')
const deploy = readFileSync(path.join(RAIZ, 'DEPLOY.md'), 'utf8')
const config = readFileSync(path.join(RAIZ, 'packages/zoho-sync/src/config.ts'), 'utf8')
const en = (t: string) => deploy.indexOf(t)
const s18 = en('## 18. `SYNC_CONVERSACIONES_PERIODICA`'), s19 = en('## 19. `MARCAR_CONVERSACIONES_AUSENTES`'), s20 = en('## 20. Relleno de conversaciones')
const tramo = (desde: number, hasta?: number) => (desde === -1 ? '' : deploy.slice(desde, hasta))

describe('DEPLOY.md §18-§20 · conversaciones de Zoho (1G-01)', () => {
  it('las tres secciones existen tras la §17, en orden, y la §20 es la última', () => {
    expect(s18).toBeGreaterThan(en('## 17. `SALIDAS_ESPERAS`'))
    expect(s19).toBeGreaterThan(s18)
    expect(s20).toBeGreaterThan(s19)
    expect(tramo(s20).match(/^## \d+\./gm)).toHaveLength(1)
  })

  for (const [nombre, seccion] of [['SYNC_CONVERSACIONES_PERIODICA', tramo(s18, s19)], ['MARCAR_CONVERSACIONES_AUSENTES', tramo(s19, s20)]] as const) {
    it(`${nombre}: dice qué enciende y qué se rompe, nace cerrado y lleva su línea de entorno vacía`, () => {
      expect(seccion).toContain('**Qué enciende:**')
      expect(seccion).toContain('**Qué se rompe si se pone mal:**')
      expect(seccion).toContain('**Nace cerrado**')
      expect(seccion).toContain("`=== 'true'`")
      expect(seccion).toMatch(new RegExp(`^> ${nombre}=\\s*$`, 'm'))
      expect(config).toContain(`env.${nombre} === 'true'`)
    })
  }

  it('la §20 pide la copia previa de desk-db y nombra la ruta del relleno', () => {
    expect(tramo(s20)).toContain('Copia previa de `desk-db`')
    expect(tramo(s20)).toContain('/api/admin/backfill-details')
  })
})
