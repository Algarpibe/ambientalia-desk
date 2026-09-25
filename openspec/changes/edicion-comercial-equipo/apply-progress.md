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

## Estado (lote 1, tal como se cerró)

**50/50 tareas de las Fases 1-13 completas.** `npm test` / `typecheck` / `lint` en verde. Ningún `.tsx`
tocado. Listo para que el orquestador decida el commit del lote 1 (Fase 13.4, fuera de este intento) y
lance el lote 2 (Fases 14-18) como intento de ledger aparte.

---

# Lote 2 (Fases 14-18)

**Fase:** `sdd-apply` · **Intento:** lote 2 (Fases 14-18 de `tasks.md`, más el barrido de citas) ·
**Base:** `f0304ec` (lote 1 ya commiteado) · **Modo:** Standard (los `.tsx` quedan fuera de la red de
pruebas por decisión de Gerencia F0-00, `vitest.config.ts:16-20`; no se propuso `jsdom` ni
`@testing-library`) · **NO se hizo commit ni push** (instrucción explícita del orquestador; Fase 16.4 y
18.4 quedan pendientes, las ejecuta el orquestador tras revisar este informe).

## Tareas completadas (Fases 14-18, 12/13 casillas)

Todas las casillas `[x]` salvo **16.4** (commit del lote 2) y **18.4** (correr el CLI de citas contra un
sha committeado) — las dos reservadas al orquestador por la misma razón que 13.4 del lote 1.

| Fase | Resumen |
|---|---|
| 14 | `EquiposAdmin.tsx`: `EquipoForm` pasa a `export`; nueva prop `areas: string[]`; `restringidosBloqueados = !!equipo && !puedeEditarCamposRestringidos(areas, isAdmin)` — **no bloquea el alta**, sólo la edición de un equipo ya existente (D9); los tres campos restringidos (`fechaFacturaCompra`, `finGarantia`, `mantenedorId`) quedan `disabled` con estilo de solo lectura cuando `restringidosBloqueados` |
| 15 | `HojaDeVida.tsx`: importa `EquipoForm` (ciclo de módulos ya previsto y aceptado por `design.md`) y `useAuth`; botón «Editar» en la cabecera que abre `EquipoForm` en modal (`z-[80]`, por encima de la hoja `z-[75]`); `onSaved` llama a `reload()` de `useAsync`; nueva sección «Cambios» (`SeccionCambios`/`FilaCambio`) que lista `data.cambios`, ya ordenados por el servidor (Fase 11 del lote 1), con `ETIQUETA_CAMPO_COMERCIAL`, `usuarioNombre`, fecha+hora y anterior→nuevo (usa `anteriorTexto`/`nuevoTexto` para el mantenedor) |
| 16 | Cierre: `npm test`, `npm run typecheck`, `npm run lint` en verde (ver evidencia abajo) |
| 17 | Tabla de la regla de mutación 3 confirmada contra el árbol de HOY (no de memoria) — ver tabla abajo |
| 18 | Barrido de citas completo (regla de mutación 4) — 15 citas reapuntadas (8 en la delta, 5 en la spec viva, 1 en `config.yaml`, 3 abreviadas en `migrate.test.ts`/`CLAUDE.md` como hallazgo adicional), `types.ts` confirmado limpio, CLI de citas diferido al orquestador (18.4) |

## Work Unit Evidence

| Evidencia | Valor |
|---|---|
| Comando de prueba enfocado y resultado exacto | `npm test` → 140 passed \| 1 skipped (141 files); 1383 passed \| 2 skipped (1385 tests). Exit 0. Idéntico al recuento del lote 1: ningún `.test.ts` se rompió ni se añadió (los `.tsx` no tienen red de pruebas, F0-00) |
| Arnés de runtime / escenario real y resultado exacto | `npm run typecheck` → `tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit`, sin salida = 0 errores, exit 0. Compila el ciclo `HojaDeVida.tsx` ↔ `EquiposAdmin.tsx` sin error de tipos (el ciclo es de MÓDULOS, no de tipos: TS lo resuelve). `npm run lint` → 165 warnings, 0 errores — **idéntico al baseline del lote 1** (comprobado por diferencia, no por estimación: mismo recuento antes y después de este lote) |
| Frontera de rollback | Cuatro ficheros de producción: `apps/desk/src/components/EquiposAdmin.tsx`, `apps/desk/src/components/HojaDeVida.tsx` (`git revert` de estos dos deshace el botón «Editar», el bloqueo de campos y la sección «Cambios», sin tocar ningún contrato de servidor); dos comentarios de documentación en código (`apps/desk/server/services/equipoNuevo.ts:64`, `packages/shared/src/equipoComercial.ts:42`) y una autocita en `packages/zoho-sync/src/db/migrate.test.ts:386` — los tres son comentarios, revertirlos no cambia comportamiento. El resto son ficheros de especificación/documentación (`openspec/**`, `CLAUDE.md`) |

Nota de TDD: **no aplica RED→GREEN** a estos cuatro ficheros — son `.tsx` (fuera de la red de pruebas por
decisión de Gerencia, F0-00) o comentarios/documentación (sin comportamiento que un test pueda fallar
antes). El servidor que SÍ impone la regla (RQ-HV-09, guarda de área) ya se implementó con TDD estricto
en el lote 1, Fase 7-9 — este lote sólo consume esa imposición desde el cliente (regla 13.3, comodidad
probada).

## Fase 17 — regla de mutación 3, confirmada contra el árbol de HOY

| Decisión del cliente | Impuesta en (línea verificada hoy) |
|---|---|
| Bloquear los tres restringidos en edición si `!puedeEditarCamposRestringidos` | `apps/desk/server/routes/equipos.ts:107-110` (el `403`, paso 4 de D8) |
| No bloquear nada en el alta (`equipo === null`) | Ninguna, a propósito: el alta es libre (a1, `routes/equipos.ts:48-71`, verificado sin cambios) |
| Mandar los seis campos siempre | `packages/shared/src/equipoComercial.ts:46-55` (`cambiosComerciales` compara contra lo guardado, D2) |
| Botón «Editar» visible para toda sesión | `requireAuth(db)` en `routes/equipos.ts:73` (verificado, línea exacta) |
| Sección «Cambios» visible | `listarCambiosEquipo` (`apps/desk/server/db/equiposCambios.ts`, re-exportada en `db/equipos.ts:409`) + `routes/equipos.ts:41` (`GET /historial` la incluye en la respuesta) |

## Fase 18 — barrido de citas (regla de mutación 4)

Barrido `grep -rnoE "routes/equipos\.ts:[0-9]+(-[0-9]+)?"` y `grep -rnoE "db/equipos\.ts:[0-9]+(-[0-9]+)?"`
sobre el repositorio completo (fuera de `archive/` y de los documentos fechados que `design.md` ya
clasifica como caso B: `Triaje…`, `F0-00…`, `Puntos…`, el plan R01.1, `ENTRADA`, `Parte_*`, `F1B-01…`,
`Paquete_de_Despliegue…`, y la propia `proposal.md`/`design.md`, ambas con «Base medida: `0807a77`»
declarada en su cabecera). Cada resultado se comprobó contra el fichero real, los dos extremos del rango
por separado.

### Citas reapuntadas (caso A — 15 en total)

| Fichero:línea de la cita | Antes | Ahora | Motivo |
|---|---|---|---|
| `services/equipoNuevo.ts:64` (comentario) | `routes/equipos.ts:144-189` | `:164-211` | `camposHojaDeVida` creció con `escalon` (Fase 3 del lote 1) |
| delta `spec.md:18` | `:135-137` | `:155-157` | El JSDoc de `camposHojaDeVida` se desplazó por el nuevo parámetro de retorno |
| delta `spec.md:30` | `:147-155` | `:167-177` | El bloque `mantenedorId` ganó el comentario D7/D8 (+2 líneas) |
| delta `spec.md:33` | `:75` | `:76` | El `404` de equipo pasó a dos líneas (`const actual` + `if`) |
| delta `spec.md:75` | `routes/equipos.ts:99` | `:113-119` | La escritura pasó de una línea a un bloque condicional con `registrarEdicion` |
| delta `spec.md:80` | `:105-110` | `:125-130` | El `DELETE` se desplazó por el crecimiento del `PATCH` |
| delta `spec.md:116` | `:144-189` | `:164-211` | Mismo motivo que `equipoNuevo.ts:64` |
| spec viva `spec.md:56` | `:78-95` | `:79-96` | Desplazamiento +1 por el `404` de dos líneas |
| spec viva `spec.md:70` | `:79-95`, abreviada `:99` | `:80-96`, `:113-119` | Mismo desplazamiento +1, más el mismo motivo que `spec.md:75` de la delta |
| spec viva `spec.md:113` | `:80-81` | `:81-82` | Desplazamiento +1 |
| spec viva `spec.md:138` (RQ-HV-07) | `HojaDeVida.tsx:159-165` en `0807a77` | `:200-207` | La cabecera se desplazó por los imports y el estado nuevos de la Fase 15 de este lote |
| spec viva `spec.md:166` (RQ-HV-08) | `EquiposAdmin.tsx:95`, payload `:148` | `:97`, payload `:177-181` | `EquipoForm` ganó 2 líneas de imports/prop; el payload se desplazó por el bloqueo de campos de la Fase 14 |
| `openspec/config.yaml:2784` | Caso B sin revisión nombrada | Revisión `0807a77` nombrada, con nota de que F1B-14 ya restringe | La afirmación («cualquiera edita») dejó de ser cierta desde el lote 1. **Revertido por el orquestador:** campo de una decisión de Gerencia; queda como corrección pendiente en `ENTRADA.md` → E-075 |
| `CLAUDE.md:194` (abreviada) | `migrate.test.ts:319` | `:327` | Fase 5 del lote 1 insertó +8 líneas antes de este punto |
| `CLAUDE.md:201` (abreviada) | `migrate.test.ts:396-398` | `:404-406` | Mismo desplazamiento +8 |
| `migrate.test.ts:386` (autocita, abreviada) | `:319` | `:327` | Mismo desplazamiento +8 |
| `openspec/specs/zoho-sync/spec.md:250` | `migrate.test.ts:337-343` | `:345-351` | Mismo desplazamiento +8 |

(17 filas — la tabla de `design.md` predijo 5 completas + 1 abreviada de la delta/spec viva; el barrido
real de este lote encontró 3 más en la propia spec viva por el mismo desplazamiento +1, y **un hallazgo
NO previsto por `design.md`**: el desplazamiento +8 en `migrate.test.ts` causado por la Fase 5 del lote 1,
que afecta a 4 citas — 3 abreviadas más la de `zoho-sync/spec.md:250`.)

### Confirmadas sin cambio (caso A, contenido verificado igual)

`routes/equipos.ts`: `:38-42`, `:48-71`, `:48` y `:73` (sueltas), `:56-57`, `:79-83`, `:89-95`. `db/equipos.ts`
entero salvo `:249` (ya en su sitio desde el lote 1): las 13 citas completas + 2 abreviadas que
`design.md` listaba como intactas (spec viva `:54`, `:113`/abreviada `:80-81` — ojo, ésta se corrigió
arriba porque SÍ se desplazó; ver tabla de reapuntadas —, `:127`/abreviada `:129`; `types.ts:355`;
`tickets-core/spec.md:105`, `:378`, `:605`×2; `CreateTicket.tsx:205`; `remisiones.test.ts:880`;
`db/equipos.ts:394` autocita) se comprobaron todas contra el árbol final y coinciden byte a byte.

`packages/shared/src/index.ts:6` (única cita viva, `F1A-05_Auditoria_blueprint_audit-F1A.md:111`) — sin
desplazar, confirmado (la reexportación de `equipoComercial` se añadió al final, línea 21, en el lote 1).

`schema.sql`: 506 líneas totales hoy (483 antes del lote 1 + 23 de `equipos_cambios`, todo AL FINAL).
Ninguna de las ~90 citas vivas a `schema.sql` (tablas `avisos`, `remisiones`, `permissions`,
`zoho-sync`, etc., todas por debajo de línea 448) se desplaza — confirmado con el barrido completo.

`migrate.ts:73` y `:80`: confirmadas sin desplazar — `equipos_cambios` se añadió a `PUBLIC_TABLES` EN LA
MISMA línea 73 (D3), y `BOOKS_TABLES` sigue en la línea 80, tal como diseñó `design.md`.

### `types.ts` (Fase 18.3)

Barrido repetido sobre el árbol final: la cita viva de mayor número sigue siendo `:542-546`
(`EquipoHistorial`). Ninguna cita apunta a partir de `:547` (donde vive el nuevo `CambioEquipo`/
`CampoComercial` del lote 1) — confirmado, `types.ts` no se tocó en este lote 2.

### CLI de citas (Fase 18.4) — diferido al orquestador

`apps/desk/server/citas/cli.ts` sólo admite tres modos (`:109-118`): `--sha <rev>` (exige que `rev` pele
a un árbol YA COMMITEADO, `repo.arbol(rev)`), `--generar-base`, o HOOK (lee `stdin` de `pre-push`).
**No existe modo para comprobar el working tree sin commit**, y `--help` no imprime nada (no es una opción
reconocida por `parseArgv`, `:113-118`). Por instrucción explícita del orquestador de no commitear en este
intento, esta tarea queda pendiente: **el orquestador debe correr
`node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha <sha-del-commit-del-lote-2>` tras commitear**,
y confirmar código de salida 0 antes de lanzar `sdd-verify`.

## Deviaciones del diseño

Ninguna decisión de `design.md` (D1-D10) cambió. Una precisión de implementación no prevista por
`tasks.md` ni `design.md`: **el bloqueo de los tres campos restringidos en `EquipoForm` se ató a
`!!equipo` (edición) y no sólo al área/rol**, porque D9 exige explícitamente que el alta quede libre —
sin esa condición, crear un equipo nuevo sin sesión Comercial habría bloqueado los tres campos en el
formulario aunque el servidor los acepte sin guarda (RQ-HV-11). Está reflejado en la Fase 17 de `tasks.md`
y en la Fase 17 de este informe. Ningún test lo prueba porque los `.tsx` quedan fuera de la red de
pruebas (F0-00) — es Persona-2 de RQ-HV-12 en la tabla de comprobaciones de persona, sin cambiar su
alcance (sigue siendo «sin Comercial, los tres restringidos en solo lectura», y este supuesto es
consistente con esa comprobación: al ABRIR el formulario ya se sabe si es alta o edición).

## Medida de tamaño (lote 2, sobre `f0304ec`)

```
git diff --shortstat --no-renames f0304ec  →  10 files changed, 98 insertions(+), 31 deletions(-)
```

(incluye el propio `tasks.md`, 42 inserciones + 25 borrados, de las 98/31 totales — no hay ficheros
nuevos sin trackear en este lote: los cuatro de producción + `tasks.md` + cinco `.md`/`.yaml` de
documentación son ediciones sobre ficheros ya trackeados). Muy por debajo del techo de 800 del preflight
y de la estimación de `tasks.md` (~70-90 para el lote 2 de código; el resto son citas y documentación,
no anticipadas como «lote» pero necesarias por la regla de mutación 4).

## Ningún fichero nuevo. Ningún `.test.ts` tocado en este lote.

## Estado (lote 2)

**12/13 tareas de las Fases 14-18 completas.** `npm test` / `typecheck` / `lint` en verde, idéntico al
baseline. Pendientes, reservadas al orquestador: **16.4** (commit del lote 2) y **18.4** (CLI de citas
contra el sha del commit). Cambio `edicion-comercial-equipo` (F1B-14, cambio 2) completo en cuanto a
código y documentación — listo para `sdd-verify` tras el commit y la ejecución de 18.4.
