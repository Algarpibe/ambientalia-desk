import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * relleno-completo-conversaciones (1G-01, D8) · presencia del interruptor `RELLENO_CONVERSACIONES_HABILITADO` en `DEPLOY.md` §21 (regla de
 * secretos de CLAUDE.md: un interruptor que enciende un escritor nace cerrado y se documenta con dos frases, qué enciende y qué se rompe si
 * se pone mal). Molde: `deployConversaciones.test.ts`.
 *
 * QUÉ COMPRUEBA: que la §21 existe tras la §20 y que la §22 va detrás, que dice las dos frases, que nace cerrada y lleva su línea de entorno vacía,
 * que pide la copia previa de `desk-db` y nombra la ruta, `limite=0`, la pasada corta y `desde=`, y que el código lo lee con `=== 'true'`.
 * QUÉ NO COMPRUEBA: `.env.example` (lo añade una persona, P-1) ni que cada línea citada siga diciendo lo que la frase afirma.
 */
const RAIZ = path.resolve(__dirname, '../../..')
const deploy = readFileSync(path.join(RAIZ, 'DEPLOY.md'), 'utf8')
const config = readFileSync(path.join(RAIZ, 'packages/zoho-sync/src/config.ts'), 'utf8')
const s20 = deploy.indexOf('## 20. Relleno de conversaciones')
const s21 = deploy.indexOf('## 21. `RELLENO_CONVERSACIONES_HABILITADO`')
const seccion = s21 === -1 ? '' : deploy.slice(s21, deploy.indexOf('## 22. ') >= 0 ? deploy.indexOf('## 22. ') : undefined) // 1G-02 añadió la §22: la §21 se para en ella; en una línea para no desplazar citas

describe('DEPLOY.md §21 · RELLENO_CONVERSACIONES_HABILITADO (1G-01)', () => {
  it('la sección existe, tras la §20, y la §22 va detrás', () => {
    expect(s21).toBeGreaterThan(-1)
    expect(s21).toBeGreaterThan(s20)
    expect(seccion.match(/^## \d+\./gm)).toHaveLength(1); expect(deploy.indexOf('## 22. ')).toBeGreaterThan(s21)
  })

  it('dice qué enciende y qué se rompe si se pone mal', () => {
    expect(seccion).toContain('**Qué enciende:**')
    expect(seccion).toContain('**Qué se rompe si se pone mal:**')
  })

  it("nace cerrado con `=== 'true'`, lleva su línea de entorno vacía y el código lo lee así", () => {
    expect(seccion).toContain('**Nace cerrado**')
    expect(seccion).toContain("`=== 'true'`")
    expect(seccion).toMatch(/^> RELLENO_CONVERSACIONES_HABILITADO=\s*$/m)
    expect(config).toContain("env.RELLENO_CONVERSACIONES_HABILITADO === 'true'")
  })

  it('pide la copia previa de desk-db y nombra la ruta, el recuento, la pasada corta y la reanudación', () => {
    expect(seccion).toContain('Copia previa de `desk-db`')
    expect(seccion).toContain('/api/admin/relleno-conversaciones')
    expect(seccion).toContain('limite=0')
    expect(seccion).toContain('limite=20')
    expect(seccion).toContain('desde=')
  })
})
