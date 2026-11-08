import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * verificacion-completitud (1G-03, D13, RQ-ZS-39) · presencia de `VERIFICACION_COMPLETITUD_HABILITADA` en `DEPLOY.md` §23 (regla de secretos de
 * CLAUDE.md: un interruptor que enciende un lector costoso nace cerrado y se documenta con dos frases, qué enciende y qué se rompe si se pone mal).
 * Molde: `deployRellenoConversaciones.test.ts`.
 *
 * QUÉ COMPRUEBA: que la §23 existe tras la §22 y es la última, con UN apartado `###` de la variable y los pasos; que dice las dos frases, que nace
 * cerrada con `=== 'true'` (y el código lo lee así), que lleva su línea de entorno vacía y que los pasos nombran la ruta, el recuento, la pasada
 * corta, la reanudación, cerrar y repetir el día del corte.
 * QUÉ NO COMPRUEBA: `.env.example` (lo añade una persona, P-5) ni que cada línea citada siga diciendo lo que la frase afirma.
 */
const RAIZ = path.resolve(__dirname, '../../..')
const deploy = readFileSync(path.join(RAIZ, 'DEPLOY.md'), 'utf8')
const config = readFileSync(path.join(RAIZ, 'packages/zoho-sync/src/config.ts'), 'utf8')
const s22 = deploy.indexOf('## 22. Adjuntos en el volumen propio')
const s23 = deploy.indexOf('## 23. Verificación de completitud')
const seccion = s23 === -1 ? '' : deploy.slice(s23)
const VARIABLE = 'VERIFICACION_COMPLETITUD_HABILITADA'

/** El tramo de un apartado `###` hasta el siguiente `###` o `##` (o el final). */
const apartado = (nombre: string): string => {
  const desde = seccion.indexOf(`### \`${nombre}\``)
  if (desde === -1) return ''
  const resto = seccion.slice(desde + 4)
  const fin = resto.search(/^##+ /m)
  return fin === -1 ? seccion.slice(desde) : seccion.slice(desde, desde + 4 + fin)
}

describe('DEPLOY.md §23 · VERIFICACION_COMPLETITUD_HABILITADA (1G-03)', () => {
  it('la sección existe, tras la §22, es la última y tiene el apartado de la variable y los pasos', () => {
    expect(s23).toBeGreaterThan(-1)
    expect(s23).toBeGreaterThan(s22)
    expect(seccion.match(/^## \d+\./gm)).toHaveLength(1)
    expect(seccion.match(/^### /gm)).toHaveLength(2)
    expect(seccion).toContain('### Pasos')
  })

  it('dice qué enciende y qué se rompe si se pone mal, y que TRUE, 1 o vacía la dejan cerrada', () => {
    const tramo = apartado(VARIABLE)
    expect(tramo).not.toBe('')
    expect(tramo).toContain('**Qué enciende:**')
    expect(tramo).toContain('**Qué se rompe si se pone mal:**')
    expect(tramo).toContain('`TRUE`')
  })

  it("nace cerrado con `=== 'true'`, lleva su línea de entorno vacía y el código lo lee así", () => {
    const tramo = apartado(VARIABLE)
    expect(tramo).toContain('**Nace cerrado**')
    expect(tramo).toContain("`=== 'true'`")
    expect(tramo).toMatch(new RegExp(`^> ${VARIABLE}=\\s*$`, 'm'))
    expect(config).toContain(`env.${VARIABLE} === 'true'`)
  })

  it('los pasos nombran la ruta, el recuento, la pasada corta, la reanudación, cerrar y repetir el día del corte', () => {
    expect(seccion).toContain('/api/admin/verificacion-completitud')
    expect(seccion).toContain('limite=0')
    expect(seccion).toContain('limite=20')
    expect(seccion).toContain('terminado: true')
    expect(seccion).toContain('desde=')
    expect(seccion).toContain('cerrar')
    expect(seccion).toContain('día del corte')
  })
})
