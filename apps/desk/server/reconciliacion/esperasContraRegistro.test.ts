import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { ESTADOS_EN_ESPERA } from '@ambientalia/shared'
import { esperasDelCodigo } from './comprobaciones'

/**
 * Molde H5 (RQ-RC-04, RQ-TS-39): la comprobación 5 cuenta las esperas leyendo `estados.ts` COMO TEXTO
 * (`comprobaciones.ts:162`) y la vista las cuenta con `ESTADOS_EN_ESPERA`. Son dos implementaciones de la misma cifra y
 * ninguna está rota por separado: una entrada `externa` compartiendo línea, o con un comentario detrás, la ve el código
 * y no el barrido. Esta prueba las enfrenta sobre el fichero real.
 */
const ESTADOS_TS = fileURLToPath(new URL('../../../../packages/shared/src/estados.ts', import.meta.url))

describe('la comprobación 5 y ESTADOS_EN_ESPERA cuentan lo mismo', () => {
  it('el lector de texto sobre el estados.ts real da la longitud del registro', () => {
    expect(esperasDelCodigo(readFileSync(ESTADOS_TS, 'utf8'))).toBe(ESTADOS_EN_ESPERA.length)
  })
})
