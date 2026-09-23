import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // `coverage` se añadió en F1A-05. Es salida generada por `npm run test:coverage`, está en
  // `.gitignore:18` —así que no se versiona— pero SÍ se lintaba: el informe de v8 trae tres
  // `eslint-disable` que aquí no aplican, y `eslint .` pasaba de 158 avisos a 161 en cualquier
  // máquina que hubiera corrido la cobertura alguna vez.
  //
  // Lo que arregla: que la cifra deje de depender del estado local de la máquina. Lo que NO
  // arregla: el techo del CI (165 desde el 23/09) sigue SIN HOLGURA a propósito (`ci.yml:28-41`).
  globalIgnores(['dist', '.agent', 'tmp-app', 'docs', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // `any` aparece deliberadamente en fronteras con JSON de Zoho y filas de Postgres.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
])
