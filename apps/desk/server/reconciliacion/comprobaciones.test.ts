import { describe, expect, it } from 'vitest'
import { HEAD_DE_PRUEBA, arbolEnMemoria } from '../testing/arbolDePrueba'
import { reconciliar } from './comprobaciones'

const SALTO = String.fromCharCode(10)

/** Cinco `externa` + seis `interna` = ONCE. Las `ninguna` no cuentan, y los comentarios tampoco. */
const ESTADOS_CON_ONCE = [
  'export const CLASIFICACION_EN_ESPERA = {',
  '  // externa (5)',
  "  'uno': 'externa',",
  "  'dos': 'externa',",
  "  'tres': 'externa',",
  "  'cuatro': 'externa',",
  "  'cinco': 'externa',",
  '  // interna (6) — este comentario nombra una clase y NO debe contarse',
  "  'seis': 'interna',",
  "  'siete': 'interna',",
  "  'ocho': 'interna',",
  "  'nueve': 'interna',",
  "  'diez': 'interna',",
  "  'once': 'interna',",
  '  // ninguna (2)',
  "  'doce': 'ninguna',",
  "  'trece': 'ninguna',",
  '} as const',
].join(SALTO)

/**
 * La trampa que `RQ-RC-04` existe para cerrar: el propio `config.yaml` AFIRMA una cifra de código
 * distinta de la real. El 2026-09-17 un hallazgo salió falso exactamente así, por leer este fichero
 * en vez de `packages/shared`.
 */
const CONFIG_QUE_MIENTE = [
  'capabilities:',
  '  - alfa',
  'cifras_ancladas:',
  '  - id: esperas',
  '    maestro: "4 — M1.3.4 y glosario del Anexo E"',
  '    codigo: "SIETE, segun este documento — y es FALSO: estados.ts declara once"',
  '    divergencia: "LEGITIMA. El código va por delante del maestro."',
].join(SALTO)

const arbol = arbolEnMemoria({
  ficheros: {
    'openspec/config.yaml': CONFIG_QUE_MIENTE,
    'openspec/specs/alfa/spec.md': '# alfa',
    'packages/shared/src/estados.ts': ESTADOS_CON_ONCE,
  },
  head: HEAD_DE_PRUEBA,
})

const comprobacion5 = () => reconciliar(arbol).find((c) => c.id === 5)

describe('comprobaciones · RQ-RC-04: la 5 saca la cifra de `packages/shared`, NUNCA del registro (R2.1.3)', () => {
  it('cuenta ONCE leyendo `estados.ts`, aunque `config.yaml` afirme otra cosa', () => {
    const c = comprobacion5()
    expect(c).toBeDefined()
    expect(c?.cifras.join(' ')).toContain('11')
  })

  it('no toma la cifra del documento: la SIETE que el registro afirma no aparece como cifra del código', () => {
    const c = comprobacion5()
    expect(c?.cifras.join(' ')).not.toContain('SIETE')
  })

  it('enfrenta las dos cifras: el 4 del maestro sigue apareciendo al lado del 11 del código', () => {
    const c = comprobacion5()
    expect(c?.cifras.join(' ')).toContain('4')
  })

  it('la divergencia declarada LEGÍTIMA no convierte la 5 en bloqueante (RQ-RC-03)', () => {
    expect(comprobacion5()?.bloqueante).toBe(false)
  })
})
