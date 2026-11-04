import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { RUTA_ADJUNTO_ZOHO, NOMBRE_ADJUNTO, dirAdjuntos } from './almacen'

// Literal de la guarda de la ruta, leído del TEXTO de attachment.ts (H5: dos implementaciones de la misma noción).
function literalDeLaRuta(): RegExp {
  const texto = readFileSync(join(__dirname, '..', 'routes', 'attachment.ts'), 'utf8')
  const linea = texto.split(/\r?\n/).find((l) => l.includes('.test(path)'))
  if (!linea) throw new Error('no se encontró la guarda de attachment.ts')
  const lit = linea.slice(linea.indexOf('(!') + 2, linea.indexOf('.test(path)'))
  return new RegExp(lit.slice(1, lit.lastIndexOf('/')))
}

const BASE = '/tickets/100/comments/200/attachments/300/content'
// [ruta, ¿la acepta la guarda?]
const TABLA: [string, boolean][] = [
  [BASE, true],
  ['/tickets/1/threads/2/attachments/3/content', true],
  ['/tickets/1/x', false],
  ['/tickets/abc/comments/1/attachments/1/content', false],
  ['/tickets/1/comments/x/attachments/1/content', false],
  ['/tickets/1/comments/1/attachments/y/content', false],
  ['/tickets/1/other/1/attachments/1/content', false],
  ['/tickets/1/comments/1/attachments/1/content/extra', false],
  ['/tickets/1/comments/1/attachments/1/content?x=1', false],
  ['/../tickets/1/comments/1/attachments/1/content', false],
  ['', false],
]

describe('RUTA_ADJUNTO_ZOHO frente a la guarda de attachment.ts (H5)', () => {
  it('el literal de attachment.ts se encuentra y tiene el mismo texto que la copia', () => {
    expect(literalDeLaRuta().source).toBe(RUTA_ADJUNTO_ZOHO.source)
  })
  it.each(TABLA)('%s → %s en la copia', (ruta, ok) => {
    expect(RUTA_ADJUNTO_ZOHO.test(ruta)).toBe(ok)
  })
  it.each(TABLA)('%s → %s en el literal leído de attachment.ts', (ruta, ok) => {
    expect(literalDeLaRuta().test(ruta)).toBe(ok)
  })
})

describe('NOMBRE_ADJUNTO', () => {
  it.each([['4001', true], ['0', true], ['abc1', false], ['12a', false], ['', false], ['../7', false], ['1.5', false]])(
    '%s → %s', (id, ok) => { expect(NOMBRE_ADJUNTO.test(id)).toBe(ok) })
})

describe('dirAdjuntos (D7)', () => {
  const dist = resolve(tmpdir(), 'app', 'dist')
  const fuera = resolve(tmpdir(), 'volumen', 'adjuntos')
  it('ausente, vacía o sin definir → null', () => {
    expect(dirAdjuntos(undefined, dist)).toBeNull()
    expect(dirAdjuntos('', dist)).toBeNull()
  })
  it('relativa → null', () => {
    expect(dirAdjuntos('adjuntos', dist)).toBeNull()
    expect(dirAdjuntos('./adjuntos', dist)).toBeNull()
  })
  it('la propia dist y lo que cuelga de ella → null', () => {
    expect(dirAdjuntos(dist, dist)).toBeNull()
    expect(dirAdjuntos(join(dist, 'adjuntos'), dist)).toBeNull()
    expect(dirAdjuntos(join(dist, 'a', 'b'), dist)).toBeNull()
    expect(dirAdjuntos(join(dist, 'x', '..'), dist)).toBeNull()
  })
  it('válida → la ruta resuelta', () => {
    expect(dirAdjuntos(fuera, dist)).toBe(fuera)
    expect(dirAdjuntos(join(fuera, 'x', '..'), dist)).toBe(fuera)
  })
  it('hermana de dist con prefijo parecido y carpeta «..x» cuentan como fuera', () => {
    const hermana = dist + '-otro'
    expect(dirAdjuntos(hermana, dist)).toBe(hermana)
    const raro = resolve(dist, '..', '..x')
    expect(dirAdjuntos(raro, dist)).toBe(raro)
  })
  it('sin segundo argumento, la dist es la de process.cwd()', () => {
    const porDefecto = resolve(process.cwd(), 'dist')
    expect(dirAdjuntos(join(porDefecto, 'a'))).toBeNull()
    expect(dirAdjuntos(fuera)).toBe(fuera)
  })
})
