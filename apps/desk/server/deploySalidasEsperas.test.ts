import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * F1C-03 · presencia del interruptor `SALIDAS_ESPERAS` en `DEPLOY.md` §17 y en `.env.example` (regla de secretos de CLAUDE.md: un
 * interruptor que enciende un escritor nace cerrado y se documenta con dos frases, qué enciende y qué se rompe si se pone mal).
 *
 * QUÉ COMPRUEBA: que la sección existe tras la §16, que dice las dos frases, la fecha, quién decide y la línea de entorno; que
 * `.env.example` trae la variable vacía tras la de `CONTROL_CALIDAD_LIBERACION`, con su comentario; y que el código lo lee con `=== 'true'`.
 * QUÉ NO COMPRUEBA: que cada línea citada en la sección siga diciendo lo que la frase afirma (regla de mutación 4, lectura humana).
 */
const RAIZ = path.resolve(__dirname, '../../..')
const deploy = readFileSync(path.join(RAIZ, 'DEPLOY.md'), 'utf8')
const entorno = readFileSync(path.join(RAIZ, '.env.example'), 'utf8')
const inicio = deploy.indexOf('## 17. `SALIDAS_ESPERAS`')
const seccion = inicio === -1 ? '' : deploy.slice(inicio)

describe('DEPLOY.md §17 · SALIDAS_ESPERAS', () => {
  it('la sección existe, tras la §16, y es la última', () => {
    expect(inicio).toBeGreaterThan(-1)
    expect(inicio).toBeGreaterThan(deploy.indexOf('## 16. `CONTROL_CALIDAD_LIBERACION`'))
    expect(seccion.match(/^## \d+\./gm)).toHaveLength(1)
  })

  it('dice qué enciende y qué se rompe si se pone mal', () => {
    expect(seccion).toContain('**Qué enciende:**')
    expect(seccion).toContain('**Qué se rompe si se pone mal:**')
  })

  it('nace cerrado, lo decide Gerencia y no se enciende antes del 14/12/2026', () => {
    expect(seccion).toContain('**Nace cerrado**')
    expect(seccion).toContain("`=== 'true'`")
    expect(seccion).toContain('Gerencia')
    expect(seccion).toContain('14/12/2026')
  })

  it('lleva la línea de entorno, vacía', () => {
    expect(seccion).toMatch(/^> SALIDAS_ESPERAS=\s*$/m)
  })

  it('nombra las dos transiciones nuevas y «Motivo del respaldo»', () => {
    for (const x of ['`cobro_diagnostico_espera`', '`sin_pieza_en_almacen`', '«Motivo del respaldo»']) expect(seccion, x).toContain(x)
  })
})

describe('.env.example · SALIDAS_ESPERAS', () => {
  const lineas = entorno.split(/\r?\n/)
  const i = lineas.findIndex((l) => /^SALIDAS_ESPERAS=\s*$/.test(l))

  it('la variable está, vacía (ausente = apagado), tras la de CONTROL_CALIDAD_LIBERACION', () => {
    expect(i).toBeGreaterThan(-1)
    expect(i).toBeGreaterThan(lineas.findIndex((l) => /^CONTROL_CALIDAD_LIBERACION=/.test(l)))
  })

  it('la línea anterior es su comentario: qué enciende con `true` y la fecha', () => {
    const c = lineas[i - 1] ?? ''
    expect(c).toMatch(/^# SALIDAS_ESPERAS:/)
    expect(c).toContain('`true`')
    expect(c).toContain('14/12/2026')
  })

  it('no hay ninguna línea que la deje en true', () => {
    expect(entorno).not.toMatch(/^SALIDAS_ESPERAS=\s*true/m)
  })
})

describe('el código lo lee con === \'true\'', () => {
  it('packages/zoho-sync/src/config.ts', () => {
    const config = readFileSync(path.join(RAIZ, 'packages/zoho-sync/src/config.ts'), 'utf8')
    expect(config).toContain("env.SALIDAS_ESPERAS === 'true'")
  })
})
