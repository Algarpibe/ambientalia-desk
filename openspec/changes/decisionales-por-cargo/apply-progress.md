# Progreso de aplicación — `decisionales-por-cargo` (F1C-05, `cierra: no`)

`strict_tdd` activo. Cada verde lleva delante su rojo, visto en la terminal; las salidas son las de vitest, recortadas.

## Lote 1 — packages/shared y el interruptor (intento 3, desde `3c691e0`)

**Línea base (1.1):** `npx vitest run packages/shared packages/zoho-sync/src/config.test.ts` → 56 ficheros, 1.497 pruebas en
verde; `npm run typecheck` → 0; `npx eslint .` → 0 errores, 165 avisos.

| Tarea | Rojo | Verde |
|---|---|---|
| 1.2 → 1.3 regla pura (RQ-PM-29) | `decisionales.test.ts`: `Error: Cannot find module './decisionales'` · 1 fichero fallido, sin pruebas | `packages/shared/src/decisionales.ts` y `export * from './decisionales'` al final de `index.ts` → 18 pruebas en verde |
| 1.4 → 1.5 interruptor (RQ-PM-28) | `config.test.ts`: `AssertionError: expected undefined to be false` · 1 fallida, 11 en verde | `config.ts`: la interfaz en la línea 66 (sin desplazar) y la carga tras `:123` → 12 en verde |

**Refuerzo antes de mutar.** Al preparar M6 se vio que quitar la exclusión de la lista corta sobrevivía: el `Coordinador
Comercial` ya estaba entre los permitidos de Comercial y la compuesta lo seguía rechazando por la lista corta. Se añadió la
aserción que discrimina —un Comercial **sin cargo** en `liberacion_sin_factura`: la regla nueva no la reclama—, y M6a pasó a rojo.

**Mutaciones (1.6)**, con `herramientas/mut.mjs` (aplica, corre, restaura y comprueba; `restaurado=true` en las nueve):

| Id | Mutación | Resultado |
|---|---|---|
| M1a | `=== 'true'` → `!== 'false'` | ROJO, 1 fallida (`config.test.ts`) |
| M1b | `?.trim().toLowerCase() === 'true'` | ROJO, 1 fallida |
| M3 | `Técnico` en la lista técnica | ROJO, 3 fallidas |
| M4a | vacante siempre `true` | ROJO, 3 fallidas (Especialista con Coordinador activo) |
| M4b | vacante siempre `false` | ROJO, 3 fallidas (Especialista sin Coordinador) |
| M5a | `rechazo_revision` → Comercial | ROJO, 5 fallidas |
| M5b | `rechazo_garantia` fuera de la tabla (cae a `Comercial / Compras`) | ROJO, 4 fallidas |
| M6a | la regla nueva reclama la lista corta | ROJO, 1 fallida |
| M6b | además, la compuesta sin `puedeEjecutarTransicion` | ROJO, 2 fallidas |

**Guarda de citas.** `config.ts` +2 −1: la línea 66 cambia en su sitio y la carga entra tras `:123`; sólo se mueven las dos
últimas líneas del fichero, que nadie cita. `index.ts` y `config.test.ts` sólo crecen al final. `cargos.ts` no se toca.
