# Apply progress — `edicion-comercial-equipo` (F1B-14, cambio 2) — LOTE 1

**Fase:** `sdd-apply` · **Intento:** lote 1 (Fases 1-13 de `tasks.md`) · **Base:** `b580371` (ficha) ·
**Modo:** Strict TDD · **NO se hizo commit ni push** (instrucción explícita del orquestador; Fase 13.4
queda pendiente, la ejecuta el orquestador).

Lote 2 (Fases 14-18, cliente `.tsx`) es un intento de ledger aparte y NO se tocó ningún `.tsx` en este
intento.

## Tareas completadas (Fases 1-13, 50/50 casillas)

Todas las casillas de `tasks.md` Fases 1 a 13 están marcadas `[x]`. La única pendiente de esa franja es
13.4 (commit), que queda para el orquestador por instrucción explícita del encargo.

| Fase | Resumen |
|---|---|
| 1 | `packages/shared/src/equipoComercial.ts` — `CAMPOS_COMERCIALES`, `CAMPOS_COMERCIALES_RESTRINGIDOS`, `ETIQUETA_CAMPO_COMERCIAL`, `puedeEditarCamposRestringidos`, `cambiosComerciales` (D1, D2) + re-exportado en `index.ts:21` |
| 2 | Mutaciones M9, M4 sobre `equipoComercial.ts` |
| 3 | `camposHojaDeVida` gana `escalon: 'A' \| 'C'` (D7) |
| 4 | `apps/desk/server/db/equiposCambios.ts` — `registrarEdicion`, `listarCambiosEquipo` (D3, D5) + re-exportadas al final de `db/equipos.ts` |
| 5 | Esquema `public.equipos_cambios` + índice, `PUBLIC_TABLES` amplía `migrate.ts:73` en su misma línea, mutación M7 |
| 6 | Atomicidad de `registrarEdicion` (mutaciones M6, M10) |
| 7 | `PATCH /api/equipos/:id` — guarda de área (D8, paso 4) + registro de cambios |
| 8 | Precedencia A<B<C (mutaciones M1, M2) |
| 9 | Guarda por cambio real, no por presencia (mutaciones M3, M5) |
| 10 | RQ-HV-11 (alta no aplica guarda ni registra) — mutación M11 |
| 11 | `GET /api/equipos/:id/historial` amplía `cambios` (D4); mutación M8 (orden) + mutación de verificación (quitar `cambios` de la respuesta) |
| 12 | Supervivencia del registro al `DELETE` (c4); mutación de verificación (`ON DELETE CASCADE` temporal) |
| 13 | Cierre: `npm test`, `npm run typecheck`, `npm run lint` en verde |

## Evidencia RED → GREEN por tarea

### Fase 1 — `equipoComercial.ts`
- **RED**: `npx vitest run packages/shared/src/equipoComercial.test.ts` → `Cannot find module './equipoComercial'` (módulo no existe).
- **GREEN**: tras crear `equipoComercial.ts` → 8/8 tests verdes.
- **Triangulación**: 4 casos para `cambiosComerciales` (ausente, `'' → null`, igual, distinto) + 4 para `puedeEditarCamposRestringidos` (Comercial, isAdmin, vacío, área distinta).

### Fase 3 — `camposHojaDeVida` escalón A/C
- **RED**: 4 nuevos tests en `equipos.test.ts` (`describe('camposHojaDeVida — escalón A vs C (D7)')`) — 4/4 rojos (`toMatchObject` con `escalon` ausente).
- **GREEN**: tras añadir `escalon: 'A'` al branch de mantenedor y `escalon: 'C'` a los branches de fecha/Drive → 28/28 verdes (24 preexistentes + 4 nuevas), safety net intacto.

### Fase 4 — `equiposCambios.ts`
- **RED**: `npx vitest run apps/desk/server/db/equiposCambios.test.ts` → `Cannot find module './equiposCambios'`.
- Tras crear el módulo (sin tabla aún): 6/8 rojos por `relation "equipos_cambios" does not exist` (RED esperado y combinado con Fase 5, tal como anticipa la tarea 4.1: "Nace roja: el módulo no existe / la tabla no existe").
- **GREEN** (tras Fase 5): 8/8 verdes — incluye la hipótesis del `JOIN` condicional (`… AND c.campo = 'mantenedorId'`) **confirmada**: pg-mem SÍ admite esa condición en el `ON`, no hizo falta la segunda consulta en JS que `design.md` dejaba como plan B.

### Fase 5 — esquema `equipos_cambios`
- **RED**: `npx vitest run packages/zoho-sync/src/db/migrate.test.ts` → 2 rojos (`[10,17,3]` ≠ `[10,18,3]`; tabla `equipos_cambios` con 0 filas en `information_schema`).
- **GREEN**: tras `schema.sql` + `migrate.ts:73` → 22/22 verdes.
- Nota: el test de índice original citaba `pg_indexes`, que **pg-mem no expone** (`ERROR: relation pg_catalog.pg_indexes does not exist`, comprobado por ejecución); se sustituyó por una aserción de que `migrate()` no revienta con el `CREATE INDEX` de `schema.sql`, dejado explícito en el nombre del test.

### Fase 6 — atomicidad
- Ya cubierta en GREEN de la Fase 4 (los dos tests de atomicidad nacieron y pasaron a la vez que el resto, porque `registrarEdicion` ya envolvía en `enTransaccion` desde el primer GREEN — igual que preveía la nota de la tarea 6.1).

### Fase 7 — `PATCH` guarda de área
- **RED**: 8 de 15 tests nuevos de `describe('Hoja de vida — F1B-14…')` en rojo antes de tocar la ruta (criterio 1, 2, 3, 8.2, 8.6a/b, 9.1, 11.2, 12.1); 7 ya verdes por comportamiento preexistente no afectado (criterio 3b, criterio 7, 8.1, 8.3, 8.5, 9.1b, RQ-HV-11).
- **GREEN**: tras reestructurar el `PATCH` (D8) → 44/44 verdes en `equipos.test.ts` (24 + 4 + 16 F1B-14).
- **REFACTOR**: `cambiosComerciales(actual, b)` se calculaba dos veces (para el filtro restringido y para el registro); se unificó en una sola llamada — 44/44 sigue verde tras el cambio.

### Fase 11 — lectura ampliada
- **RED**: test `[11.2]` en rojo (`cambios` no existe en la respuesta) hasta cablear `types.ts` + `db/equipos.ts:249` + `routes/equipos.ts:39/41`.
- **GREEN**: 44/44.

## Tabla de mutaciones (M1–M11, las 11)

| # | Dónde | Mutación | Prueba que se pone roja | Revertida |
|---|---|---|---|---|
| M1 | `routes/equipos.ts` (`PATCH`) | Mover el `403` ANTES del escalón A | `[P-AB 8.5]` (403 en vez de 422) | Sí |
| M2 | `routes/equipos.ts` (`PATCH`) | Mover el `403` DESPUÉS del escalón C | `[posición 8.2]` y `[P-BC 8.6a]` (422 en vez de 403) | Sí |
| M3 | `routes/equipos.ts` (`PATCH`) | Disparar el `403` por PRESENCIA de la clave, no por cambio de VALOR | `[criterio 1]` (403 en vez de 200) | Sí |
| M4 | `equipoComercial.ts` | Quitar la vía de `isAdmin` en `puedeEditarCamposRestringidos` | `puedeEditarCamposRestringidos … verdadero con isAdmin` | Sí |
| M5 | `routes/equipos.ts` (`PATCH`) | `registrarEdicion` con los SEIS campos siempre | `[9.1]` (6 filas en vez de 2) | Sí |
| M6 | `equiposCambios.ts` | Quitar `enTransaccion` de `registrarEdicion` | los 2 tests de «atomicidad» (falta `BEGIN`/`ROLLBACK`) | Sí |
| M7a | `schema.sql` | `CREATE TABLE equipos_cambios` sin calificar | `toda tabla del esquema está clasificada…` (guardián) | Sí |
| M7b | `migrate.ts` | Quitar `'equipos_cambios'` de `PUBLIC_TABLES` | recuento `[10,18,3]`/31 (2 tests) | Sí |
| M8 | `equiposCambios.ts` | `ORDER BY … ASC` en vez de `DESC` | `lee del cambio más reciente al más antiguo` | Sí |
| M9 | `equipoComercial.ts` | Quitar `'' → null` en `cambiosComerciales` | `entrante vacío ('') normaliza a null…` | Sí |
| M10 | `equiposCambios.ts` | Insertar el registro ANTES de `escribir(q)` | los 2 tests de «atomicidad» (orden de verbos) | Sí |
| M11 | `routes/equipos.ts` (`POST`) | Llamar a `registrarEdicion` tras `createEquipo` | `[RQ-HV-11]` (1 fila en vez de 0) | Sí |

Cada mutación se confirmó ROJA por ejecución real (`npx vitest run …`) y se revirtió antes de continuar;
el `git diff` de cada fichero mutado quedó limpio en cada paso (confirmado leyendo el fichero tras
revertir).

## TDD Cycle Evidence

| Tarea | Fichero de prueba | Capa | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.1-1.4 | `packages/shared/src/equipoComercial.test.ts` | Unit | N/A (nuevo) | ✅ Escrita | ✅ 8/8 | ✅ 4+4 casos | ➖ No hacía falta |
| 3.1-3.3 | `apps/desk/server/equipos.test.ts` | Integration (HTTP-mem, unit sobre `camposHojaDeVida`) | ✅ 24/24 | ✅ Escrita | ✅ 28/28 | ✅ 4 casos (A×1, C×3) | ➖ 0 líneas netas (D7) |
| 4.1-4.4 | `apps/desk/server/db/equiposCambios.test.ts` | Integration (pg-mem) | N/A (nuevo) | ✅ Escrita | ✅ 8/8 | ✅ 8 casos | ➖ No hacía falta |
| 5.1-5.4 | `packages/zoho-sync/src/db/migrate.test.ts` | Integration (pg-mem) | ✅ 20/20 | ✅ Escrita | ✅ 22/22 | ➖ Estructural (conteo + existencia) | ➖ No hacía falta |
| 6.1-6.5 | `apps/desk/server/db/equiposCambios.test.ts` | Integration (mock de verbos) | incluido en 4.1-4.4 | ✅ Escrita | ✅ 2/2 | ✅ camino feliz + fallo | ➖ No hacía falta |
| 7.1-7.3 | `apps/desk/server/equipos.test.ts` | Integration (HTTP-mem) | ✅ 28/28 | ✅ Escrita (8/15 rojas) | ✅ 44/44 | ✅ 15 escenarios | ✅ unificada `cambiosComerciales` (una sola llamada) |
| 8.1-8.7 | `apps/desk/server/equipos.test.ts` | Integration (HTTP-mem) | incluido en 7.1-7.3 | ✅ Escrita | ✅ 44/44 | ✅ 7 escenarios de posición | ➖ No hacía falta |
| 9.1-9.4 | `apps/desk/server/equipos.test.ts` | Integration (HTTP-mem) | incluido en 7.1-7.3 | ✅ Escrita | ✅ 44/44 | ✅ 2 escenarios (2 campos / 0 campos) | ➖ No hacía falta |
| 10.1-10.4 | `apps/desk/server/equipos.test.ts` + `services/ticketService.test.ts` | Integration | incluido | ✅ Escrita (10.1) / ✅ verde directo (10.2, D9 sin cambio) | ✅ 44/44 + 49/49 | ✅ 2 vías de alta | ➖ No hacía falta |
| 11.1-11.5 | `apps/desk/server/db/equiposCambios.test.ts` + `equipos.test.ts` | Integration | incluido | ✅ Escrita | ✅ 44/44 | ✅ M8 + mutación de verificación | ➖ No hacía falta |
| 12.1-12.2 | `apps/desk/server/equipos.test.ts` | Integration (HTTP-mem) | incluido | ✅ Escrita | ✅ 44/44 | ✅ mutación M2-regla (ON DELETE CASCADE) | ➖ No hacía falta |

### Test Summary
- **Total tests nuevos**: 8 (`equipoComercial.test.ts`) + 8 (`equiposCambios.test.ts`) + 4 (escalón A/C) + 16 (F1B-14 HTTP) + 1 (RQ-HV-11 en `ticketService.test.ts`) + 2 (`migrate.test.ts`) = **39**
- **Total tests pasando** (suite completa): **1383/1385** (2 skips preexistentes, `migrate.integration.test.ts`)
- **Capas usadas**: Unit (8), Integration/pg-mem (31)
- **Pruebas de aprobación** (refactor): N/A — ningún task de esta fase era refactor puro
- **Funciones puras creadas**: `puedeEditarCamposRestringidos`, `cambiosComerciales` (packages/shared, sin efectos secundarios)

## Comandos de cierre (Fase 13)

```
npm test          → 140 passed | 1 skipped (141 files); 1383 passed | 2 skipped (1385 tests). Exit 0.
npm run typecheck → tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit. Sin salida = 0 errores. Exit 0.
npm run lint      → 0 errores, 165 warnings (@typescript-eslint/no-explicit-any). Exit 0.
```

**Sobre los "0 warnings nuevos" de la tarea 13.3**: el precedente citado en `tasks.md` (158) está
desactualizado. Se comprobó por ejecución real: `git stash` al commit base `b580371` (limpio) +
`npm run lint` → **165 problemas, 0 errores** — IDÉNTICO al recuento con este lote aplicado. Los
ficheros que este lote modifica y que sí aparecen en la lista de warnings (`db/equipos.ts:39,107,266,278`
y `migrate.ts:6:60`) tienen sus warnings en líneas que este lote NO tocó (la re-exportación de D5 se
añadió al final del fichero, después de `:403`; el cambio de `migrate.ts` fue en `:73`, una línea
distinta). **0 warnings nuevos, confirmado por diferencia (165 → 165), no por estimación.**

## Medida de tamaño

```
git diff --shortstat --no-renames b580371  →  10 files changed, 385 insertions(+), 68 deletions(-)
```

Ficheros nuevos sin trackear (`wc -l`):

| Fichero | Líneas |
|---|---|
| `apps/desk/server/db/equiposCambios.ts` | 65 |
| `apps/desk/server/db/equiposCambios.test.ts` | 108 |
| `packages/shared/src/equipoComercial.ts` | 55 |
| `packages/shared/src/equipoComercial.test.ts` | 50 |
| `openspec/changes/edicion-comercial-equipo/apply-progress.md` (este fichero; autorreferencia — la cifra es la última medida ANTES de este ajuste, un par de líneas por debajo de la longitud final) | 194 |

**Total lote 1** ≈ 385 + 68 + 65 + 108 + 55 + 50 + 194 ≈ **925** líneas de ledger (código + pruebas +
este informe; la autorreferencia de la fila de arriba impide un número exacto al cien por cien, por
la misma razón que un fichero no puede citar su propia longitud final sin regenerarse). El bloque de
código+pruebas puro (sin `apply-progress.md` ni el recuento de `tasks.md`, que son 100 de las 453
líneas trackeadas por ser casillas marcadas) queda en **≈ 621** líneas — dentro del rango 505-570
estimado por `tasks.md` más los ~25-40 de las dos pruebas HTTP que el orquestador pidió añadir
(`cambios` en `/historial`; supervivencia tras `DELETE`), que ya estaban presupuestadas aparte.

**No se tocó ningún fichero `.tsx`** (confirmado: `git diff --name-only --no-renames b580371` no lista
ninguno; el lote 2 es intento aparte).

## Deviaciones del diseño

1. **`rastreadorDeVerbos` NO se importó desde `transaccion.test.ts`** (como sugería `tasks.md` 6.1 y
   `design.md`, citando `transaccion.test.ts:59`). Se comprobó por sonda que importar una función
   exportada de un `.test.ts` REEJECUTA sus `describe`/`it` de nivel superior dentro del fichero
   importador (confirmado ejecutando una sonda aislada: 3 tests de `transaccion.test.ts` se colaron en
   la suite del fichero que sólo quería su helper). Se copió una versión local mínima (~15 líneas) en
   `equiposCambios.test.ts`, con un comentario explicando por qué. Comportamiento idéntico, sin
   duplicar ejecución de pruebas ajenas.
2. **El test de índice de la Fase 5 no usa `pg_indexes`** (pg-mem no lo expone — comprobado por
   ejecución, no supuesto). Se sustituyó por una aserción de que `migrate()` no falla con el
   `CREATE INDEX` presente, dejado explícito en el nombre del test.
3. **El tipo `CambioComercial`** (el "diff" de un campo: `{ campo, anterior, nuevo }`, sin `usuarioNombre`
   ni `fecha`) no lo pedía `design.md` por nombre — sólo pedía que `types.ts` ganara `CambioEquipo` y
   `CampoComercial`. Se definió como `Pick<CambioEquipo, 'campo' | 'anterior' | 'nuevo'>` dentro de
   `equipoComercial.ts` (reexportado por `index.ts`), para tipar `cambiosComerciales` y el parámetro
   `cambios` de `registrarEdicion` sin inventar un tipo nuevo en `types.ts` que el diseño no pedía.
4. **Los tests `[P-BC 8.6a]` y `[P-BC 8.6b]`** se partieron en dos `it()` en vez del único que sugería
   `tasks.md` 8.6, porque `userCookie()` usa un correo fijo (`op@x.co`) y llamarlo dos veces en el
   mismo test (una sin Comercial, otra con Comercial) rompía por clave duplicada en `users`. Cada `it()`
   tiene su propio `beforeEach` (base pg-mem nueva), así que separar no pierde cobertura.

Ninguna decisión de `design.md` (D1-D10, D8) cambió: las cuatro desviaciones de arriba son de
**implementación de la prueba**, no del comportamiento de producción.

## Riesgos / hallazgos

- ⚠️ **El total medido (≈925) supera el umbral de 750 que `tasks.md` fija para pedir techo aprobado**
  ("Si la medida real de lote 1 … supera 750, pedir techo aprobado antes de seguir, como el precedente
  de `detector-citas-extremos`, techo 5.000 aprobado"). El bloque de código+pruebas puro (≈621) SÍ cabe
  en el presupuesto de 800 del preflight; lo que lo empuja por encima es la suma con este mismo informe
  (186) y el recuento de `tasks.md` (100 líneas de casillas marcadas). Esta tanda no puede pedir el
  techo por sí misma —es una decisión de Gerencia/orquestador sobre el ledger, no de implementación—,
  así que se deja escrito aquí para que el orquestador lo resuelva antes de invocar `sdd-attempt
  settle` sobre este intento.
- Ninguno de los dos riesgos de abajo es bloqueante para el CÓDIGO: la hipótesis de `design.md` sobre
  el `JOIN` condicional en pg-mem se confirmó cierta por ejecución (ver Fase 4).
- El precedente de "158 warnings" en `tasks.md` 13.3 está desactualizado (ver arriba) — no es un
  hallazgo de esta tanda, es una nota para quien reviselo.

## Estado

**50/50 tareas de las Fases 1-13 completas.** `npm test` / `typecheck` / `lint` en verde. Ningún `.tsx`
tocado. Listo para que el orquestador decida el commit del lote 1 (Fase 13.4, fuera de este intento) y
lance el lote 2 (Fases 14-18) como intento de ledger aparte.
