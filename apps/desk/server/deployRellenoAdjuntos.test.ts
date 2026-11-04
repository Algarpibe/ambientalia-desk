import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * persistencia-adjuntos (1G-02, D10) · presencia de las tres variables de adjuntos en `DEPLOY.md` §22 (regla de secretos de CLAUDE.md: un
 * interruptor que enciende un escritor nace cerrado y se documenta con dos frases, qué enciende y qué se rompe si se pone mal; el
 * directorio no es un interruptor, pero la ruta donde se escribe se documenta igual). Molde: `deployConversaciones.test.ts` y
 * `deployRellenoConversaciones.test.ts`.
 *
 * QUÉ COMPRUEBA: que la §22 existe tras la §21 y es la última; que CADA uno de sus tres apartados `###` (comprobados por separado, de un
 * `###` al siguiente) dice las dos frases y lleva su línea de entorno vacía; que los dos interruptores nacen cerrados con `=== 'true'` y el
 * código los lee así; que el directorio no tiene valor por defecto y se rechaza dentro de `dist/`; y que los pasos piden el espacio libre
 * (`df -h`), la copia previa de `desk-db` y nombran la ruta, el recuento, la pasada corta y la reanudación.
 * QUÉ NO COMPRUEBA: `.env.example` (lo añade una persona, P-5) ni que cada línea citada siga diciendo lo que la frase afirma.
 */
const RAIZ = path.resolve(__dirname, '../../..')
const deploy = readFileSync(path.join(RAIZ, 'DEPLOY.md'), 'utf8')
const config = readFileSync(path.join(RAIZ, 'packages/zoho-sync/src/config.ts'), 'utf8')
const s21 = deploy.indexOf('## 21. `RELLENO_CONVERSACIONES_HABILITADO`')
const s22 = deploy.indexOf('## 22. Adjuntos en el volumen propio')
const seccion = s22 === -1 ? '' : deploy.slice(s22)

/** El tramo de un apartado `###` hasta el siguiente `###` o `##` (o el final): cada apartado se prueba por separado. */
const apartado = (nombre: string): string => {
  const desde = seccion.indexOf(`### \`${nombre}\``)
  if (desde === -1) return ''
  const resto = seccion.slice(desde + 4)
  const fin = resto.search(/^##+ /m)
  return fin === -1 ? seccion.slice(desde) : seccion.slice(desde, desde + 4 + fin)
}

describe('DEPLOY.md §22 · adjuntos en el volumen propio (1G-02)', () => {
  it('la sección existe, tras la §21, es la última y tiene sus tres apartados', () => {
    expect(s22).toBeGreaterThan(-1)
    expect(s22).toBeGreaterThan(s21)
    expect(seccion.match(/^## \d+\./gm)).toHaveLength(1)
    expect(seccion.match(/^### `/gm)).toHaveLength(3)
  })

  for (const nombre of ['ADJUNTOS_DIR', 'RELLENO_ADJUNTOS_HABILITADO', 'GUARDAR_ADJUNTOS_AL_SINCRONIZAR']) {
    it(`${nombre}: tiene su apartado, dice qué enciende y qué se rompe si se pone mal, y lleva su línea de entorno vacía`, () => {
      const tramo = apartado(nombre)
      expect(tramo).not.toBe('')
      expect(tramo).toContain('**Qué enciende:**')
      expect(tramo).toContain('**Qué se rompe si se pone mal:**')
      expect(tramo).toMatch(new RegExp(`^> ${nombre}=\\s*$`, 'm'))
    })
  }

  for (const nombre of ['RELLENO_ADJUNTOS_HABILITADO', 'GUARDAR_ADJUNTOS_AL_SINCRONIZAR']) {
    it(`${nombre}: nace cerrado con \`=== 'true'\` y el código lo lee así`, () => {
      const tramo = apartado(nombre)
      expect(tramo).toContain('**Nace cerrado**')
      expect(tramo).toContain("`=== 'true'`")
      expect(config).toContain(`env.${nombre} === 'true'`)
    })
  }

  it('ADJUNTOS_DIR: no tiene valor por defecto y se rechaza dentro de dist/', () => {
    const tramo = apartado('ADJUNTOS_DIR')
    expect(tramo).toContain('**Sin valor por defecto**')
    expect(tramo).toContain('`dist/`')
    expect(tramo).not.toContain('**Nace cerrado**')
  })

  it('pide el espacio libre y la copia previa de desk-db, y nombra la ruta, el recuento, la pasada corta y la reanudación', () => {
    expect(seccion).toContain('df -h')
    expect(seccion).toContain('Copia previa de `desk-db`')
    expect(seccion).toContain('/api/admin/relleno-adjuntos')
    expect(seccion).toContain('limite=0')
    expect(seccion).toContain('limite=20')
    expect(seccion).toContain('desde=')
  })
})
