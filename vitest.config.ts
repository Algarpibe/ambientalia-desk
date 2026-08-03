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
  },
})
