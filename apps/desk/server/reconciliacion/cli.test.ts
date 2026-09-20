import { describe, expect, it } from 'vitest'
import { HEAD_DE_PRUEBA, arbolEnMemoria } from '../testing/arbolDePrueba'
import type { DatosArbol } from '../testing/arbolDePrueba'
import { ejecutar } from './cli'

const SALTO = String.fromCharCode(10)

/** `ESTADOS_EN_ESPERA` se deriva de esta tabla: cinco `externa` + seis `interna` = ONCE. */
const ESTADOS_CON_ONCE = [
  'export const CLASIFICACION_EN_ESPERA = {',
  "  'uno': 'externa',",
  "  'dos': 'externa',",
  "  'tres': 'externa',",
  "  'cuatro': 'externa',",
  "  'cinco': 'externa',",
  "  'seis': 'interna',",
  "  'siete': 'interna',",
  "  'ocho': 'interna',",
  "  'nueve': 'interna',",
  "  'diez': 'interna',",
  "  'once': 'interna',",
  "  'doce': 'ninguna',",
  '} as const',
].join(SALTO)

/** El maestro dice cuatro y la entrada declara la divergencia LEGÍTIMA: informa, no bloquea. */
const CONFIG_SANO = [
  'capabilities:',
  '  - alfa',
  'cifras_ancladas:',
  '  - id: esperas',
  '    maestro: "4 — M1.3.4 y glosario del Anexo E"',
  '    codigo: "ESTADOS_EN_ESPERA de packages/shared/src/estados.ts"',
  '    divergencia: "LEGITIMA. El código va por delante del maestro."',
].join(SALTO)

/** Se construye en ejecución: un `tanda:` literal de un ID real lo leería el barrido de cabeceras. */
const proposal = (tanda: string, motivo: string): string =>
  ['---', 'tanda: ' + tanda, 'motivo: "' + motivo + '"', 'capacidad: []', 'maestro: []',
    'cierra: no', 'toca_maestro: no', 'origen_cabecera: declarada', '---', '', '# Propuesta'].join(SALTO)

const FUERA_DEL_PLAN = 'fuera-del' + '-plan'

function correr(datos: DatosArbol) {
  const escritos = new Map<string, string>()
  const salida = ejecutar({ arbol: arbolEnMemoria(datos), escribir: (r, t) => void escritos.set(r, t) })
  return { salida, escritos }
}

describe('cli · RQ-RC-03: el código de salida lo mueven SÓLO la comprobación 1 y la 3 (R2.1.2)', () => {
  it('una spec en disco que no está en `capabilities` es huérfana y rompe el comando', () => {
    const { salida } = correr({
      ficheros: {
        'openspec/config.yaml': CONFIG_SANO,
        'openspec/specs/alfa/spec.md': '# alfa',
        'openspec/specs/huerfana/spec.md': '# huerfana',
        'packages/shared/src/estados.ts': ESTADOS_CON_ONCE,
      },
      head: HEAD_DE_PRUEBA,
    })
    expect(salida.codigo).not.toBe(0)
  })

  it('un cambio ' + FUERA_DEL_PLAN + ' sin motivo escrito rompe el comando', () => {
    const { salida } = correr({
      ficheros: {
        'openspec/config.yaml': CONFIG_SANO,
        'openspec/specs/alfa/spec.md': '# alfa',
        'openspec/changes/sin-motivo/proposal.md': proposal(FUERA_DEL_PLAN, ''),
        'packages/shared/src/estados.ts': ESTADOS_CON_ONCE,
      },
      head: HEAD_DE_PRUEBA,
    })
    expect(salida.codigo).not.toBe(0)
  })

  it('la divergencia LEGÍTIMA de `esperas` (once frente a cuatro) informa y NO toca el código de salida', () => {
    const { salida, escritos } = correr({
      ficheros: {
        'openspec/config.yaml': CONFIG_SANO,
        'openspec/specs/alfa/spec.md': '# alfa',
        'openspec/changes/con-motivo/proposal.md': proposal(FUERA_DEL_PLAN, 'lo pidió Gerencia'),
        'packages/shared/src/estados.ts': ESTADOS_CON_ONCE,
      },
      sinTrackear: { 'docs/sdd': ['docs/sdd/uno.md', 'docs/sdd/dos.md'] },
      head: HEAD_DE_PRUEBA,
    })
    expect(salida.codigo).toBe(0)
    // Y la divergencia SÍ sale en el fichero: informar no es callar.
    const texto = escritos.get('docs/sdd/RECONCILIACION.md') ?? ''
    expect(texto).toContain('11')
    expect(texto).toContain('4')
  })

  it('escribe UN solo fichero, y es `docs/sdd/RECONCILIACION.md` (RQ-RC-01)', () => {
    const { escritos } = correr({
      ficheros: { 'openspec/config.yaml': CONFIG_SANO, 'openspec/specs/alfa/spec.md': '# alfa' },
      head: HEAD_DE_PRUEBA,
    })
    expect([...escritos.keys()]).toEqual(['docs/sdd/RECONCILIACION.md'])
  })
})
