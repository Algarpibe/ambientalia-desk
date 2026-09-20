import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Los contenedores corren en UTC (el Dockerfile no fija TZ). Fijarlo aquí hace que los tests
// reproduzcan producción en vez de la zona de quien los ejecuta: sin esto, un formateo de fechas
// sin zona explícita pasaría en una máquina colombiana y fallaría en el servidor.
process.env.TZ = 'UTC'

export default defineConfig({
  resolve: {
    alias: {
      '@ambientalia/shared': fileURLToPath(new URL('./packages/shared/src/index.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: [
      'apps/**/*.test.ts',
      'packages/**/*.test.ts',
    ],
    /*
     * ⚠️ QUÉ NO PUEDE VER ESTE NÚMERO. Léelo antes de sacar conclusiones del porcentaje.
     *
     * `permissions.ts` son SIETE líneas y ya estaban al 100 % con los cuatro casos sintéticos que
     * había antes de F0-04. `transitions.ts` son 327 líneas de las que 86 son el array de datos:
     * queda «cubierto» por cualquier prueba que lo importe, sin ejecutar ninguna transición.
     *
     * Todo lo que F0-04 añadió —los siete invariantes del grafo, la tabla de reentrancia, la matriz
     * de 102 casos área × transición, el par que fija C1, las 34 transiciones ejecutadas— suma cerca
     * de CERO puntos de cobertura, porque esas líneas ya se ejecutaban antes.
     *
     * El hueco de este repositorio no son líneas sin ejecutar: son CASOS SIN NOMBRAR. Que nadie lea
     * este porcentaje como señal de que el motor está protegido; lo que lo protege son los
     * invariantes y las matrices, y esos no aparecen aquí.
     *
     * EL UMBRAL ES UN TRINQUETE, igual que `--max-warnings` en `ci.yml`: es lo medido menos un
     * margen pequeño, no una aspiración. Un umbral por encima del estado real falla el primer día y
     * acaba desactivado. Si esto rompe: mira qué dejaste sin cubrir. Si subiste la cobertura, sube
     * también el suelo. Bajarlo exige una línea de justificación en el mensaje del commit.
     *
     * Medido el 2026-09-08 sobre 884 pruebas: líneas 94,19 % · ramas 80,73 % · funciones 98,52 %.
     *
     * El alcance es la LÓGICA DE DOMINIO, esté donde esté: `packages/shared`, `apps/desk/server`, y
     * los `.ts` del cliente que la contienen (`src/lib`, `src/board.ts`), que están probados y
     * cuentan. Los `.tsx` quedan fuera del denominador porque la interfaz está excluida de la red de
     * pruebas POR DECISIÓN de Gerencia (F0-00, §9.3): incluirlos mediría esa decisión como si fuera
     * un fallo.
     */
    coverage: {
      provider: 'v8',
      include: [
        'packages/shared/src/**',
        'apps/desk/server/**',
        'apps/desk/src/lib/**',
        'apps/desk/src/board.ts',
      ],
      exclude: ['**/*.test.ts', '**/testing/**', '**/*.tsx'],
      thresholds: {
        lines: 92,
        statements: 92,
        functions: 96,
        branches: 78,
      },
    },
    /*
     * ⚠️ UMBRAL DURO, NO UNA PREFERENCIA. No subas este número sin volver a medir.
     *
     * El RPC interno de vitest (birpc) vence a los 60 s y NO se puede configurar: el `6e4` está
     * en la línea 3 del chunk `index.B521nVV-.js` de vitest —vive en `node_modules`, que git
     * ignora, así que se nombra en prosa y NO con ruta y línea: el detector de citas lo daría
     * por fichero inexistente y bloquearía el push—, y ni `createRuntimeRpc` ni
     * `createForksRpcOptions` le pasan un `timeout` propio. Un fichero de prueba que tarde más
     * de 60 s produce un unhandled error y la suite sale 1 SIN NINGUNA PRUEBA ROTA.
     * Medido: el número de `Errors` es EXACTAMENTE el de ficheros por encima de 60 s.
     *
     * Con los 16 workers por defecto sobre 16 CPUs, las pruebas del hook de citas —que lanzan
     * subprocesos git— sobresuscriben la máquina y los dos ficheros pesados se arrastran hasta
     * 53-57 s, a un suspiro del umbral. Bajar a 4 no cuesta tiempo, LO AHORRA: la suite baja de
     * 63,0 s a 41,3 s de media y ningún fichero pasa de 35 s (24 corridas, 2026-09-20).
     *
     * Va aquí y no en un script porque tiene que cubrir `npm test` —lo que corre verify— Y
     * `npm run test:coverage` —lo que corre el CI—. Un flag sólo cubriría uno de los dos.
     *
     * Partir los ficheros pesados ya se intentó (`058e4e7`) y duró CUATRO DÍAS: volvieron a
     * cruzar el umbral sin que nadie los tocara, sólo porque la suite creció. No repitas eso.
     */
    maxWorkers: 4,
  },
})
