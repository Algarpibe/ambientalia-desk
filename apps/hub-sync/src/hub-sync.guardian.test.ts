import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * parche-iv11-orden-venta (RQ-AV-13) · remediación del verify (WARNING 3): el worker de hub-sync
 * NUNCA cablea el aviso de discrepancia de orden de venta; sólo `apps/desk/server/index.ts` lo hace
 * (spec `derivacion-avisos`). `hub-sync.ts` arranca `main()` al importarse (conecta pool real), así
 * que ejercitarlo en runtime no es viable: guardián ESTÁTICO sobre el FICHERO VIGILADO real (regla de
 * mutación 2, mismo molde que `apps/desk/server/citas/guardianes.test.ts`), fichero nuevo para no
 * desplazar ninguna cita existente. La mutación se
 * comprueba ensuciando `hub-sync.ts` a mano, no con una prueba en memoria (sería tautológica).
 */
describe('RQ-AV-13 · hub-sync.ts nunca cablea alDiscrepanciaOV', () => {
  const real = readFileSync(fileURLToPath(new URL('./hub-sync.ts', import.meta.url)), 'utf8')

  it('createSync se invoca de verdad en el fichero real, y su cableado no incluye alDiscrepanciaOV', () => {
    expect(real).toContain('createSync(')
    expect(real).not.toContain('alDiscrepanciaOV')
  })

})
