# Apply progress — Unidad A · datos y motor (F1A-06)

**Intento SDD 1**, worktree `f1a-06-r1`, base commit `7670f89` (propuesta + specs + diseño + tareas ya
commiteados). Token de ledger `sha256:a6f3b7...`, confirmado `state: proceed` (mutación cero) antes y
después de leer los artefactos.

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| A.1.1-A.1.2 | `packages/shared/src/fasesBlueprint.test.ts` | Unit | N/A (new) | ✅ Written — import de módulo inexistente, `Cannot find module './fasesBlueprint'` | ✅ 5/5 pasan tras crear `fasesBlueprint.ts` | ✅ 5 casos: cobertura exacta, recuento 4/12/5, y las tres asignaciones no mecánicas (Ingresado, Pendiente, los 4 de ESTADOS_SIN_SALIDA) | ➖ Dato puro, sin lógica que refactorizar |
| A.1.3 | `packages/shared/src/fasesBlueprint.ts` (guarda de compilación) | Compile-time | ✅ typecheck verde antes de mutar | ✅ Mutación: quitar `'Pendiente'` de `FASE_POR_ESTADO` | ✅ `tsc` falla con `TS1360: Property 'Pendiente' is missing...`; revertido y `tsc` vuelve a exit 0 | ➖ N/A (guarda de compilación, no TDD de comportamiento) | ➖ N/A |
| A.2.1-A.2.3 | `packages/shared/src/invariantesGrafo.test.ts` (5b) | Unit | ✅ 7/7 pasando antes de tocar | ✅ Written — 5b reescrito con el par exacto ANTES de tocar `transitions.ts`, falla con `expected [ undefined, undefined ]...` | ✅ 7/7 tras editar `transitions.ts:150-151` en sitio | ➖ Único escenario (par exacto de las dos constantes); triangulación ya la dan las 2 constantes del `for` | ➖ Comentario `:108-119` reescrito junto con el `it`, sin lógica de producción que limpiar |
| A.3.1-A.3.2 | `apps/desk/server/db/estadoPorRemision.test.ts` | Integration (pg-mem + migrate()) | ✅ 13/13 pasando antes de tocar (baseline) | ➖ Refactor de fuente, no cambio de comportamiento (criterio 6, proposal §7) — no aplica ciclo RED nuevo | ✅ 13/13 tras el refactor, **sin tocar ninguna aserción** | ➖ N/A — approval-testing: el fichero de test ya documentaba el comportamiento correcto | ✅ Comentario de línea 17 (cita de código en un comentario, no una aserción) corregido para no quedar falso — hallazgo del barrido A.4.1 extendido |

## Work Unit Evidence

| Evidence | Valor |
|---|---|
| Focused test command y resultado exacto | `npx vitest run packages/shared/src/fasesBlueprint.test.ts packages/shared/src/invariantesGrafo.test.ts apps/desk/server/db/estadoPorRemision.test.ts` → **25/25 passed** (5 + 7 + 13) |
| Runtime harness / escenario real y resultado exacto | `npm test` completo (arnés `pg-mem` + `migrate()` real para `estadoPorRemision.test.ts`, sin credenciales Zoho) → **1232/1235 passed, 1 failed (pre-existente, fuera de alcance — ver abajo), 2 skipped** |
| Rollback boundary | `git revert` del commit de la Unidad A. Sin migración ni dato en base. `transitions.ts:150-151` y `estadoPorRemision.ts` vuelven a su forma de hoy con delta de líneas cero (confirmado por `git diff --shortstat`, ver abajo). `fasesBlueprint.ts`/`fasesBlueprint.test.ts` se borran enteros; `index.ts` pierde su línea 18 |

## Mutación A.1.3 — guarda de COMPILACIÓN de D-1

```
$ npm run typecheck   # con 'Pendiente' quitado de FASE_POR_ESTADO
packages/shared/src/fasesBlueprint.ts(67,3): error TS1360: Type '{...}' does not satisfy the expected
  type 'Record<..., FaseId>'.
  Property 'Pendiente' is missing in type '{...}' but required in type 'Record<..., FaseId>'.
EXIT: 2

$ npm run typecheck   # revertido
EXIT: 0
```

**Hallazgo de wiring, declarado y no escondido.** `npm run typecheck` (`tsc -b && tsc -p
apps/desk/tsconfig.server.json --noEmit`) NO incluye `packages/shared/tsconfig.json` como referencia
directa: `tsc -b` sólo referencia `apps/desk/tsconfig.app.json`, `tsconfig.node.json` y
`apps/hub-sync`. Un fichero de `packages/shared/src` sólo entra en el grafo de tipos de `npm run
typecheck` cuando algo lo importa transitivamente desde `index.ts` (que sí resuelve por
`node_modules/@ambientalia/shared` → `package.json.main` → `src/index.ts`). Verificado por ejecución:
con `FASE_POR_ESTADO` incompleto pero SIN la línea de `index.ts` (A.1.4 aún no aplicada), `npm run
typecheck` daba **exit 0** — la guarda de compilación no se comprobaba. Por eso A.1.4 (añadir `export *
from './fasesBlueprint'` a `index.ts`) se adelantó, delante de A.1.3, para que la mutación se hiciera
contra el grafo real que `npm run typecheck` construye. Las dos tareas quedan completas igual; el orden
de ejecución fue A.1.1 → A.1.2 → A.1.4 → A.1.3(mutar) → A.1.3(revertir), no el literal del `tasks.md`.
Una comprobación directa con `npx tsc -p packages/shared/tsconfig.json --noEmit` habría cazado la
mutación sin este reordenamiento, pero el texto de la tarea pide explícitamente `npm run typecheck`.

## A.4.1 — Barrido regla de mutación 4

`grep -rnoE "invariantesGrafo\.test\.ts:[0-9]+(-[0-9]+)?"` sobre el árbol final, excluyendo
`openspec/changes/archive/`: **28 ocurrencias** en 15 ficheros (dentro del rango ~28-36 medido por el
orquestador antes de esta tanda). Comprobadas una a una contra el fichero:

- Ninguna citación fuera del bloque `:108-127` se vio afectada — A.2.1 preservó exactamente 20 líneas
  en ese bloque y no tocó nada antes de `:108` ni después de `:127` (confirmado leyendo el fichero tras
  el cambio).
- Las citas que apuntan DENTRO de `:108-127` (`proposal.md:63,172,205`, `design.md:163`, delta
  `specs/transitions-st/spec.md:19,30`, `tasks.md:60`) describen la NUEVA forma del bloque (ya
  anticipaban el cambio, al ser artefactos de esta misma tanda) — siguen siendo ciertas.
- `docs/sdd/F0-01_Correcciones_para_el_maestro.md:510` (entrada 16) cita `:120-127` como evidencia de
  que las dos constantes «no tienen `from` ni `to`». **Caso B (histórico)**: era cierto cuando se
  escribió esa entrada, y deja de serlo tras P-2. NO se repara en la Unidad A — es exactamente el
  contenido que la tarea C.2.1 (Unidad C, entrada 17) ya anticipa por diseño («M1.3.3 dice de los dos
  pasos "Lo que no tienen es `from` ni `to`" — tras P-2 es falso»). Tocar F0-01 en la Unidad A se saldría
  de su alcance (fasesBlueprint, P-2, invariante 5b) y duplicaría el trabajo de C.2.1.
- `openspec/specs/transitions-st/spec.md:94` (spec VIVA, no el delta) cita `:120-127` como «prueba de la
  exclusión» — la parte citada («exclusión de `TRANSITIONS`») sigue siendo cierta hoy; la frase
  problemática de esa misma spec viva («Lo que no está en el archivo de transiciones es el `from`/`to`»,
  `:112`) no lleva número de línea de `invariantesGrafo.test.ts` y no la caza este grep. Por instrucción
  explícita del propio `tasks.md` («Para el archive — no es trabajo de `sdd-apply`»), la reconciliación
  de la spec viva con el delta ocurre en `sdd-archive`, no aquí. No se edita `openspec/specs/` en esta
  Unidad.

**Barrido extendido a `transitions.ts` y `estadoPorRemision.ts`** (pedido explícito del prompt de
lanzamiento, más allá de A.4.1): ninguna cita externa quedó rota (`transitions.ts:150-151` sigue
señalando la ubicación correcta de las dos constantes, sólo cambió su contenido interno). **Un
hallazgo real**: `apps/desk/server/db/estadoPorRemision.test.ts:17` citaba en un COMENTARIO (no una
aserción — regla de mutación 4, «una cita en un comentario no la ve ni `tsc`, ni `eslint`, ni las
pruebas») el código EXACTO de la línea 41 antigua (`if (actual !== STATUS_TICKET_CREADO...)`).
Corregido en sitio (1 línea, delta 0), sin tocar ningún `it`/`expect`; las 13 aserciones del fichero
siguen intactas y en verde.

## Diff exacto (git diff --shortstat --no-renames contra `7670f89`)

```
$ git diff --shortstat --no-renames 7670f89
 5 files changed, 23 insertions(+), 22 deletions(-)

apps/desk/server/db/estadoPorRemision.test.ts |  2 +-   (1 línea: cita de comentario corregida)
apps/desk/server/db/estadoPorRemision.ts      | 14 +++++++-------  (7 líneas, delta 0 — A.3.1)
packages/shared/src/index.ts                  |  1 +   (A.1.4, EOF, delta 0 sobre las 17 previas)
packages/shared/src/invariantesGrafo.test.ts  | 24 ++++++++++++------------  (import :3 + bloque 5b, delta 0)
packages/shared/src/transitions.ts            |  4 ++--  (2 líneas, delta 0 — A.2.2)

$ wc -l packages/shared/src/fasesBlueprint.ts packages/shared/src/fasesBlueprint.test.ts
  68 fasesBlueprint.ts
  35 fasesBlueprint.test.ts
 103 total (sin trackear, nuevo)
```

**Total autoría (additions+deletions+nuevo, riesgo de revisión):** 23 + 22 + 103 = **148 líneas** —
dentro del presupuesto de 400 del guard de revisión, y por debajo de la estimación del propio
`tasks.md` (~230-290 para la Unidad A completa).

## `wc -l` delta-cero, confirmado línea a línea

- `transitions.ts`: 2 inserciones + 2 borrados, MISMAS dos líneas (`:150`, `:151`), sin desplazar nada
  alrededor — confirmado por `git diff` mostrando sólo esas dos líneas con `@@ -147,8 +147,8 @@`.
- `estadoPorRemision.ts`: 7 inserciones + 7 borrados, en las líneas 10, 11, 41, 49, 50, 56, 57 exactas
  del diseño — confirmado por `git diff` línea a línea.
- `invariantesGrafo.test.ts`: el bloque `:108-127` sigue midiendo exactamente 20 líneas tras el cambio
  (comprobado con `Read` del fichero después de editar); `:129` (invariante 6) no se movió.

## Resultado de los comandos de cierre (A.4.2/A.4.3)

- `npm run test:coverage` (excluyendo el único test pre-existente roto, ver abajo, para que el reporte
  de cobertura se genere — vitest no emite la tabla de cobertura cuando hay un fallo): exit 0.
  `packages/shared/src/**` → **97.27 % líneas / 88.97 % ramas / 98.68 % funciones / 97.27 % líneas**,
  todas por encima del suelo 92/92/96/78 (`vitest.config.ts:58-63`). `fasesBlueprint.ts` → 100/100/100/100.
  `transitions.ts` → 100/100/100/100 (sin regresión).
- `npm test` (suite completa, sin exclusión): exit 0. **1232/1235 passed, 1 failed, 2 skipped.**
- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0, **0 errores, 165 avisos** (el script de `package.json` no lleva
  `--max-warnings`; ese flag sólo vive en `ci.yml:41`).

### Hallazgos PRE-EXISTENTES, fuera del alcance de la Unidad A (no se tocan aquí)

1. **`apps/desk/server/reconciliacion/registro.test.ts:108`** falla con `expected '19 declaradas' to be
   '18 declaradas'`. Verificado por ejecución con `git stash -u` (Unidad A completa fuera, incluidos los
   ficheros nuevos): el mismo fallo, idéntico mensaje, ya existe en `7670f89` — es decir, ya estaba roto
   ANTES de que esta Unidad tocara una sola línea. Causa: la capacidad `mapa-blueprint` ya se registró en
   `openspec/config.yaml` durante la fase `sdd-spec` de esta misma tanda (confirmado por Engram obs. #879
   y por `config.yaml:271-281`), subiendo el recuento real de capacidades declaradas de 18 a 19; este test
   tiene la cifra `18` escrita a mano y nadie la subió. No es una tarea de la Unidad A (ni siquiera de
   `fasesBlueprint`/P-2/invariante 5b); no lo cubre C.3.1 tampoco (que sólo verifica que la entrada de
   `capabilities` sigue presente, no que este contador ajeno se actualice). Se reporta al orquestador
   para asignar dueño — probablemente un ajuste de una línea en `registro.test.ts` como parte del cierre
   de la Unidad C o de un `apply-progress` posterior, no de esta Unidad.
2. **165 avisos de ESLint contra el trinquete de 158 de `ci.yml:41`** (`npm run lint -- --max-warnings
   158` falla con "ESLint found too many warnings"). Verificado por ejecución con `git stash -u`: el
   mismo recuento exacto, 165, ya existe en `7670f89` — pre-existente, no introducido por la Unidad A
   (0 avisos nuevos, confirmado comparando el recuento exacto antes/después). Ningún fichero tocado por
   la Unidad A aparece en la lista de avisos. Fuera del alcance de `fasesBlueprint`/P-2/invariante 5b.

Ninguno de los dos hallazgos bloquea el cierre de la Unidad A: ninguno de los dos toca los ficheros que
esta Unidad crea o modifica, y los dos son verificablemente anteriores a esta tanda.

---

# Apply progress — Unidad B · generador, CLI, artefactos (F1A-06)

**Intento SDD 2**, mismo worktree `f1a-06-r1`, base commit `54d00f1` (Unidad A completa y commiteada).
Token `sha256:cbc246b7...`, `state: proceed` confirmado antes de tocar nada.

## TDD Cycle Evidence

| Task | Test File | Layer | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|
| B.1.1-B.1.2 | `mapaBlueprint.test.ts` | Unit | ✅ 13 pruebas contra esqueleto (`{}`); 4 pasaban en falso por bucle fantasma sobre `Object.values({})` — corregidas con `toHaveLength(4)` antes del `for`; **13/13 rojas** | ✅ 13/13 tras implementar `generarMapaBlueprint` (regex `/-->/g` contaba también el cierre del comentario HTML de cabecera; corregido a `/e\d{2} --> e\d{2}/g`) | ✅ +guarda de alias, +área desconocida; consolidado a 14 casos sin perder aserciones | ✅ Comentarios comprimidos en cierre, sin tocar lógica |
| B.1.3-B.1.4 | (guarda EJECUCIÓN D-1) | Unit | ✅ `fasePorEstado` sin `'Pendiente'` → esperar `throw` | ✅ `validarFasePorEstado` lanza con el nombre del estado | ✅ Segunda guarda: `aliasDe` lanza si un estado referenciado no está en `estados` | ➖ N/A |
| B.2.1-B.2.4 | CLI, sin prueba propia (RQ-MB-01) | N/A | ➖ Por diseño | ✅ `npm run generar-mapa-blueprint` escribe 4 ficheros; 2ª ejecución **byte a byte idéntica** (`sha256sum`) | ➖ N/A | ➖ N/A |
| B.3.1-B.3.4 | bloque RQ-MB-06 | Unit (diff vs disco) | ✅ Nace verde | ✅ 1/1 tras normalizar `\r\n`→`\n` (CRLF de Windows, ver hallazgo) | ➖ N/A | ➖ N/A |

## Hallazgos de implementación y mutaciones

- **Regex de arista contaba el `<!-- -->`.** `/-->/g` daba 39, no 38 (cierre del comentario de
  cabecera). Corregido a `/e\d{2} --> e\d{2}/g` (alias a los dos lados).
- **CRLF en Windows.** `.gitattributes` fija LF en el índice, CRLF en el árbol de Windows
  (`core.autocrlf`, confirmado `cat -A`: `^M$`). El generador produce LF (D-5); la prueba normaliza al
  leer disco.
- **B.3.2 (fichero vigilado).** `sed -i` muta una línea de `blueprint-completo.md` commiteado →
  `vitest -t "igual al commiteado en disco"` → **1 failed**, diff señala la línea exacta. `git
  checkout --` → diff vacío → **1 passed**.
- **B.3.3 (transición sintética sin regenerar).** Script `tsx` aparte: `EntradaMapa` con una
  transición sintética extra, comparado contra el `.md` YA commiteado → mismatch confirmado.

## Work Unit Evidence

| Evidence | Valor |
|---|---|
| Focused test | `mapaBlueprint.test.ts` → **14/14 passed** |
| Runtime harness | `npm run generar-mapa-blueprint` × 2 → `sha256sum` idéntico (determinismo D-5, criterio 1 §14) |
| Rollback | `git revert` del commit de B; borra los 3 ficheros nuevos + los 4 `.md` + entrada de `package.json`; no toca A |

## Hallazgo fuera de asignación, corregido por bloquear el cierre — `estadoPorRemision.ts:41`

`npm run typecheck` fallaba (`TS2345`, `actual: string | undefined` pasado a `applyTransition`).
Verificado con `git stash`/`git stash pop`: **pre-existente a TODA la tanda**, confirmado contra
`git show 125ae3e:...` (antes de la Unidad A). Falso negativo de tipos, no de comportamiento — el
`.some(...)` de la línea 41 ya excluía `undefined` en ejecución, pero no es un type guard. Corrección
de una línea, delta cero:

```diff
- if (![...CONFIRMADA.from, ...RETIRADA.from].some((s) => s === actual)) return
+ if (actual === undefined || ![...CONFIRMADA.from, ...RETIRADA.from].some((s) => s === actual)) return
```

Sin regresión: `estadoPorRemision.test.ts` → 13/13 antes y después, ninguna aserción tocada. Cita del
comentario `:17` (regla de mutación 4) actualizada en sitio, delta cero. Se corrige y no sólo se
reporta porque B.4.3 exige typecheck verde y la corrección es de una línea, cero riesgo, verificada —
mismo precedente que el barrido extendido de la Unidad A (A.4.1).

## Repaso de citas (regla de mutación 4)

- `package.json` (+1 línea, `:57`→`:58` para `@vitest/coverage-v8`): reparadas `config.yaml:60` y
  `F1A-05...md:221`. `Parte_2026-09-21.md:4` (`:20`) y las citas de esta tanda a `:43` — sin cambio,
  siguen ciertas (caso B, `125ae3e`).
- `index.ts` (+1 línea EOF, `:19`): `tasks.md:55,136` ya la anticipaban, confirmadas sin reparar.
- `estadoPorRemision.ts:41` (contenido cambia, línea no se mueve): cita literal de
  `estadoPorRemision.test.ts:17` reparada; `remisiones/spec.md:277`, `transitions-st/spec.md:81,106`,
  `zoho-sync/spec.md:79` describen comportamiento — sigue siendo cierto, sin reparar.
- `transitions.ts` (sin tocar en B): `grep` sobre el árbol final — sin roturas nuevas.

## Presupuesto

`git diff --shortstat --no-renames 54d00f1 HEAD` incluye los cuatro `.md` generados (~187 líneas,
excluidos del presupuesto de **revisión** por convención de `sdd-phase-common.md` §E, pero contados
en el ledger) y este mismo `apply-progress.md` como sumando obligatorio (`CLAUDE.md`, regla del ciclo
2). Autoría de código+prueba+CLI: `mapaBlueprint.ts` 231 + su prueba 178 + la CLI 44 = 453 líneas
nuevas, dentro del rango estimado por `tasks.md` (~480-560) y del techo de revisión de 800 del
proyecto (`openspec/config.yaml:29`).

## Resultado de los comandos de cierre (B.4.1-B.4.3)

- `npm run test:coverage`: **exit 0**. `packages/shared/src/**` → 97,68 % líneas / 89,86 % ramas /
  98,87 % funciones / 97,68 % statements (suelo `92/92/96/78`). `mapaBlueprint.ts` → 100/97,82/100/100
  (única rama sin ejercitar: el fallback defensivo `MARCA_AREA[area] ?? area` de la leyenda —
  inalcanzable con datos reales porque `AREAS` es una constante cerrada de tres elementos).
- **38 aristas fijadas por aserción** (`RQ-MB-02`), 3 desde `habilitar_servicio`, 2 `(sin botón)`.
- `npm test`: **exit 0**, 1247/1249 passed, 2 skipped (2 menos que A por consolidar 2 pares de pruebas
  en 1 cada uno, sin perder aserciones).
- `npm run typecheck`: **exit 0** (tras la corrección declarada arriba).
- `npm run lint`: **exit 0**, 0 errores, 165 avisos — idéntico al recuento que dejó la Unidad A.
- `npm run build`: **exit 0**.

Criterio 1 de propuesta §14 (regeneración e idempotencia): `npm run generar-mapa-blueprint` × 2,
`sha256sum` de los cuatro ficheros idéntico entre ejecuciones.
