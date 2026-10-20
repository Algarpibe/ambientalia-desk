import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * F1C-07 · presencia del interruptor `CONTROL_CALIDAD_LIBERACION` en `DEPLOY.md` §16 (regla de secretos de CLAUDE.md: un interruptor
 * que enciende un escritor nace cerrado y se documenta con dos frases, qué enciende y qué se rompe si se pone mal).
 *
 * QUÉ COMPRUEBA: que la sección existe, que dice las dos frases, la fecha y la línea de entorno, y que el código lo lee con `=== 'true'`.
 * QUÉ NO COMPRUEBA: `.env.example` (lo añade Supervisión) ni que cada línea citada en la sección siga diciendo lo que la frase afirma.
 */
const RAIZ = path.resolve(__dirname, '../../..')
const deploy = readFileSync(path.join(RAIZ, 'DEPLOY.md'), 'utf8')
const seccion = deploy.slice(deploy.indexOf('## 16. `CONTROL_CALIDAD_LIBERACION`'))

describe('DEPLOY.md §16 · CONTROL_CALIDAD_LIBERACION', () => {
  it('la sección existe, tras la §15, y es la última', () => {
    expect(deploy.indexOf('## 15. `DECISIONALES_POR_CARGO`')).toBeGreaterThan(-1)
    expect(deploy.indexOf('## 16. `CONTROL_CALIDAD_LIBERACION`')).toBeGreaterThan(deploy.indexOf('## 15. `DECISIONALES_POR_CARGO`'))
    expect(seccion.match(/^## \d+\./gm)).toHaveLength(1)
  })

  it('dice qué enciende y qué se rompe si se pone mal', () => {
    expect(seccion).toContain('**Qué enciende:**')
    expect(seccion).toContain('**Qué se rompe si se pone mal:**')
  })

  it('nace cerrado, se enciende en enero con DECISIONALES_POR_CARGO y nunca antes del 14/12/2026', () => {
    expect(seccion).toContain('**Nace cerrado**')
    expect(seccion).toContain("`=== 'true'`")
    expect(seccion).toContain('DECISIONALES_POR_CARGO')
    expect(seccion).toContain('14/12/2026')
  })

  it('lleva la línea de entorno, vacía', () => {
    expect(seccion).toMatch(/^> CONTROL_CALIDAD_LIBERACION=\s*$/m)
  })

  it('el código lo lee con === \'true\'', () => {
    const config = readFileSync(path.join(RAIZ, 'packages/zoho-sync/src/config.ts'), 'utf8')
    expect(config).toContain("env.CONTROL_CALIDAD_LIBERACION === 'true'")
  })

  // F1C-08 (RQ-TS-54, RQ-PM-40): la calibración directa y su escape cuelgan de la MISMA variable; no hay otra.
  it('la calibración directa y su escape cuelgan del mismo interruptor, y la sección lo dice con las dos frases', () => {
    expect(seccion).toContain('`calibracion_directa`')
    expect(seccion).toContain('`falla_calibracion`')
    expect(seccion).toContain('**Qué enciende la calibración directa:**')
    expect(seccion).toContain('**Qué se rompe si se pone mal la calibración directa:**')
    expect(seccion).toContain('No tiene variable propia')
  })
})
