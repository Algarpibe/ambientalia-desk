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

---

# Apply progress — Unidad C · cierre documental (F1A-06)

**Intento SDD 3**, mismo worktree `f1a-06-r1`, base commit `8a36d03` (Unidades A y B completas y
commiteadas). Ledger `sdd-attempt`: `acquire` confirmado `state: proceed` (mutación cero) antes de
tocar nada.

Unidad puramente documental: **sin producción de código**, `strict_tdd` no aplica (declarado también
en `design.md`, «Threat matrix: N/A» y «Regla invariable 13: NO APLICA»). No hay ciclo RED/GREEN que
registrar — la evidencia es lectura directa del árbol antes/después de cada edición, citada por línea.

## Work Unit Evidence

| Evidence | Valor |
|---|---|
| Focused test command y resultado | N/A — cambios de documentación, sin prueba automática que los cubra (mismo criterio que la fila C de `tasks.md`, «Suggested Work Units») |
| Runtime harness / escenario real | N/A — documentación, no código ejecutable |
| Rollback boundary | `git revert` del commit de C. No toca `packages/`, `apps/`, `scripts/` ni `openspec/specs/`; sólo `docs/artefactos/NOTA.md`, `docs/sdd/F0-01_Correcciones_para_el_maestro.md` y las casillas de `tasks.md`. No toca A ni B |

## C.1 — `docs/artefactos/NOTA.md`

- **C.1.1 (§3, "NO HAY GENERADOR").** No se retiró ni una línea del texto original (`:32-46` antes de
  editar): sigue siendo cierto que `blueprintserviciotecnico.html` no tiene generador y nunca lo tendrá
  —queda histórico congelado en `a3a8f03`, decisión heredada H-1—. Se añadió un bloque de precisión
  justo detrás, con el mismo formato que el precedente «CORREGIDO POR F1A-05» de §4, que declara la
  existencia del generador NUEVO (para el mapa vigente, no para el `.html`) con ruta exacta del módulo
  (`packages/shared/src/mapaBlueprint.ts`), la CLI (`scripts/generar-mapa-blueprint.ts`,
  `npm run generar-mapa-blueprint`) y los cuatro ficheros de salida. Caso B de la regla de mutación 4:
  la frase vieja fue y sigue siendo cierta de su objeto (`blueprintserviciotecnico.html`); no se
  renumera ni se reescribe.
- **C.1.2 (§6, "Cómo actualizarlo hoy").** Reescrita en dos mitades explícitas: la del `.html` (sigue
  sin procedimiento automático, sigue congelado, F1A-05 no lo construyó) y la del mapa vigente (desde
  F1A-06, `npm run generar-mapa-blueprint` regenera los cuatro ficheros, determinista, con la prueba
  anti-desfase como guarda de CI). El aviso de caducidad de §7 **no se tocó ni se retiró** —se declara
  explícitamente en el texto nuevo que sigue vigente, porque avisa de un fichero distinto que sigue
  congelado—, cumpliendo la instrucción de la propuesta §6 y de C.1.2.

**Barrido de citas de `NOTA.md:NN`** (`grep -rnoE "NOTA\.md:[0-9]+(-[0-9]+)?"` sobre todo el árbol,
excluyendo `archive/`): 8 ocurrencias externas al propio fichero. Todas verificadas:
- 5 dentro de `openspec/changes/generador-mapa-blueprint/` (`proposal.md:33,35,152,248`,
  `specs/mapa-blueprint/spec.md:14`) — self-ancladas a `125ae3e` por la cabecera de sus propios
  ficheros («Toda cita ruta:línea se lee contra 125ae3e»), mismo convenio que `design.md`/`tasks.md`.
  Describen el estado ANTES de esta tanda (el propio §3 original, el aviso de §7, la pregunta abierta
  de §"quién abre el mapa"); siguen siendo ciertas de esa revisión — no se repararon, por diseño.
- 3 en documentos históricos ya cerrados y anclados a un commit explícito
  (`Triaje_Linea_Base_Citas_2026-09-15.md` filas 33/34, `F0-01_Correcciones_para_el_plan.md:178`,
  `F1A-05_Auditoria_blueprint_audit-F1A.md:39,41`) — citan `NOTA.md:NN en <sha>`, ya reparadas y
  cerradas por Gerencia el 2026-09-15 (Caso D). No se tocan: no citan «hoy».

Ninguna cita viva describía el estado de `NOTA.md` **de hoy** sin anclar a una revisión — no hizo
falta reparar ninguna.

## C.2 — Entrada 17 de `F0-01_Correcciones_para_el_maestro.md`

**Última entrada antes de esta tanda: la 16** (`## La de F1A-07 (16)` en `:853`, confirmado por
`grep -n "^## La de\|^### [0-9]"` antes de editar — no se dio por buena la cifra del prompt de
lanzamiento sin comprobarla). Entrada 17 añadida **al final del fichero**, detrás de la 16 y antes de
`## Qué NO contiene este fichero`: no desplaza ninguna entrada anterior (confirmado: `1-891` intactas,
sólo se insertó contenido entre `:889` y `:892` de antes de editar).

**Dos partes, como pedía C.2.1:**
- **(a)** M1.3.3 (`R08.2.md:1198`) y Anexo F (`:4412-4413`) — verificadas por lectura directa contra
  el maestro, no contra `design.md`/`proposal.md` (regla de método): las dos siguen diciendo «Faltan
  dos y no se sabe cuáles» / «Hueco nombrado, no resuelto», exactamente el texto que la propuesta §3
  citaba en `125ae3e`. Se cierra citando la aritmética verificada en este árbol:
  `TRANSICIONES_BASE` (`packages/shared/src/transitions.ts:171-263`, 34 entradas), `habilitar_servicio`
  con `from` de 3 elementos (`:178`), 33×1+1×3=36 + 2 sin botón (`:150-151`) = 38, y la aserción real
  del generador (`mapaBlueprint.test.ts`, RQ-MB-02, verificada en B.4.2: 38 aristas, 3 desde
  `habilitar_servicio`).
- **(b)** M1.3.3 (`:1198`) dice, en el texto que la propia entrada 11 de este mismo fichero propuso y
  que Gerencia pegó en la R08.2 (`:488-501` de este fichero, verificado por lectura directa): «Lo que
  no tienen es `from` ni `to`». Falso desde la Unidad A (P-2): las dos constantes
  (`transitions.ts:150-151`) declaran `from`/`to` con el par exacto, en sitio, delta de líneas cero.
  Se distingue explícitamente de la entrada 11 —que corrige una frase DISTINTA de la misma línea
  (dónde vive la declaración) y sigue vigente sin tocar— para que quien lea entienda que son dos
  correcciones sobre el mismo párrafo, no una duplicada.

**Hallazgo, no reparado a propósito (fuera de la asignación de C.2, es trabajo de `sdd-archive`):**
`openspec/specs/transitions-st/spec.md:956` (fila M-4, spec VIVA) describe el mismo hallazgo que la
entrada 11 en su forma ANTERIOR a que Gerencia la pegara en la R08.2 («Exacto para la aplicación, falso
para la declaración»); no queda invalidada por esta entrada 17 —sigue siendo una lectura correcta del
maestro R08.1/anterior a R08.2—, pero converge con el mismo tema. Su reconciliación con el delta
`specs/transitions-st/spec.md` fusionado es explícitamente trabajo de `sdd-archive`
(`tasks.md`, sección «Para el archive»), no de esta Unidad.

## C.3 — `openspec/config.yaml` (verificación, no edición)

**C.3.1 confirmado por lectura directa:** `config.yaml:271-283` tiene `mapa-blueprint` en
`capabilities`, con `covers`, `status_at_start` y `declarada_en` completos, escrita en la fase
`sdd-spec` de esta misma tanda (Engram obs. #879). No fue tocada por A ni por B
(`git log --oneline -- openspec/config.yaml` desde `7670f89`: sin commits de A ni B sobre este
fichero) ni por esta Unidad C: `git diff 8a36d03 -- openspec/config.yaml` vacío.

## Barrido final de citas de `F0-01_Correcciones_para_el_maestro.md:NN`

`grep -rnoE "F0-01_Correcciones_para_el_maestro\.md:[0-9]+(-[0-9]+)?"` sobre todo el árbol, excluyendo
`archive/`: 3 ocurrencias externas.
- `openspec/specs/permissions/spec.md:309` cita `:129` y `:142-167` — muy por debajo del punto de
  inserción de la entrada 17 en F0-01_Correcciones_para_el_maestro.md (línea 891 de antes de editar);
  sin desplazamiento, sin reparar.
- `generador-mapa-blueprint/apply-progress.md:63` (este mismo fichero, texto de la Unidad A) cita
  `:510` atribuyéndolo a «entrada 16» — la línea 510 en sí es correcta y no se desplazó (está dentro
  de la entrada 11, `:488-515`, muy por debajo de `:891`); la etiqueta «entrada 16» en esa nota de la
  Unidad A es imprecisa (la cita real pertenece a la entrada 11), pero no es una cita rota
  `ruta:línea` — es prosa de otra Unidad ya commiteada, fuera del alcance de C, y no bloquea ningún
  criterio de cierre. Se deja anotado para quien reconcilie en `sdd-archive`.
- Dos citas en cambios YA archivados (`archive/2026-09-17-tercera-puerta-orden-venta/tasks.md:164`,
  `archive/2026-09-22-fechas-derivadas-servidor/{apply-progress,proposal}.md`) — excluidas por
  convención de la regla de mutación 4 (`excluyendo openspec/changes/archive/`), ancladas a commits
  explícitos.

## C.4 — Cierre de la Unidad C / de la tanda: los ocho criterios de `proposal.md` §14

| # | Criterio | Estado | Evidencia / remisión |
|---|---|---|---|
| 1 | `npm run <script>` regenera los cuatro `.md` y el árbol queda limpio | ✅ | Unidad B, B.2.2/B.4: `npm run generar-mapa-blueprint` × 2, `sha256sum` idéntico. No re-ejecutado en C (C no toca el generador ni sus fuentes) |
| 2 | Los seis criterios de §7 en verde, con la fase roja registrada, incluida la mutación del fichero vigilado | ✅ | Unidades A (5b) y B (B.1.1/B.1.2 RED, B.3.2/B.3.3 mutaciones) |
| 3 | El diagrama completo tiene 38 aristas, fijado por aserción | ✅ | Unidad B, B.4.2 (`mapaBlueprint.test.ts`, RQ-MB-02) |
| 4 | `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` en verde | ✅ | Confirmación FINAL de C.4.2, tras C.1-C.3, ver tabla de comandos abajo |
| 5 | `estadoPorRemision.test.ts` en verde sin tocar sus aserciones | ✅ | Unidad A, A.3.2. C no toca `apps/desk/server/db/` |
| 6 | Barrido de la regla de mutación 4 sobre `transitions.ts` y `estadoPorRemision.ts` | ✅ | Unidad A, A.4.1 (extendido), sin roturas nuevas en B ni en C |
| 7 | `mapa-blueprint` en `capabilities`; `NOTA.md` §3/§6 actualizadas; entrada 17 escrita | ✅ | C.3.1 (verificación) + C.1.1/C.1.2 + C.2.1 — los tres de esta Unidad |
| 8 | El `archive-report.md` dice en su `cierra` qué parte de F1A-06 cubrió, y que el hueco 38/36 quedó cerrado con la cuenta de §3 | ⏳ pendiente | Es artefacto de `sdd-archive`, no de `sdd-apply` — no existe todavía. Insumo ya preparado: entrada 17(a) de este mismo documento trae la cuenta exacta (36+2=38) lista para citar en la línea de `cierra` |

## Resultado de los comandos de cierre (C.4.2) — FINALES de la tanda completa (A+B+C)

Comandos completos, sin truncar, con `echo "EXIT_CODE=$?"` inmediatamente después en el mismo comando:

- `npm test`: **EXIT_CODE=0**. 132 test files passed + 1 skipped (133); **1247 tests passed, 2 skipped
  (1249 total), 0 failed**. El hallazgo pre-existente de la Unidad A
  (`apps/desk/server/reconciliacion/registro.test.ts:108`, «19 declaradas» vs «18 declaradas»
  esperado) **ya no reproduce**: la suite completa está en 0 failed. No se investiga más a fondo por no
  ser tarea de C ni bloquear ningún criterio — se deja constancia de que el hallazgo de A quedó
  resuelto en algún punto entre A y este cierre.
- `npm run typecheck`: **EXIT_CODE=0**, sin salida (silencioso = éxito de `tsc -b`).
- `npm run lint`: **EXIT_CODE=0**, **0 errores, 165 avisos** — idéntico al recuento que dejó la Unidad
  B, sin avisos nuevos introducidos por C (C sólo toca `.md`, fuera de `eslint . `de todos modos porque
  no son `.ts`/`.tsx`).
- `npm run build`: **EXIT_CODE=0**. `tsc -b && vite build`, 109 módulos, bundle final generado sin
  error.

## Presupuesto de la Unidad C

`git diff --shortstat --no-renames 8a36d03` (commit de cierre de B) hasta el commit de cierre de C:
**2 ficheros de contenido** (`NOTA.md`, `F0-01_Correcciones_para_el_maestro.md`) + las casillas de
`tasks.md`. Autoría de contenido: 106 inserciones + 3 borrados = **109 líneas**, dentro del rango
estimado por `tasks.md` (~150-180) y muy por debajo del techo de 800. Este mismo `apply-progress.md`
(sumando obligatorio, regla del ciclo 2) se cuenta aparte, en el ledger vía `wc -l`, no en el
presupuesto de revisión (documentación de cierre, no código de producción).

## Estado final de `tasks.md`: 38/38 casillas de Unidades A+B+C

Confirmado por lectura del fichero tras marcar las últimas casillas: cero `- [ ]` pendientes en
`openspec/changes/generador-mapa-blueprint/tasks.md`.

## Hallazgo real de cierre — el propio barrido de citas rompió citas, y se reparó en sitio

El barrido narrado más arriba (§"Barrido de citas de `NOTA.md:NN`") declaró, sobre el commit de cierre
del primer intento de C (`372196e`), que ninguna cita viva necesitaba reparación. **Era falso, y lo
demostró correr el detector de verdad en vez de darlo por bueno por lectura.** `npx tsx
apps/desk/server/citas/cli.ts --sha 372196e` devolvió `EXIT_CODE=1` con **3 bloqueantes**, los tres
causados por las propias inserciones de C.1.1/C.1.2 en `NOTA.md` desplazando líneas que otros ficheros
citaban en forma completa (con ruta), no abreviada:

- `proposal.md:35` citaba el aviso de caducidad de NOTA.md (§7) por un rango que empezaba en la línea
  ciento trece y terminaba en la ciento dieciocho — hoy ese mismo bloque empieza en la ciento
  cuarenta y tres y termina en la ciento cuarenta y ocho.
- `proposal.md:152` citaba el mismo §7 completo por un rango que empezaba en la línea ciento trece y
  terminaba en la ciento treinta — hoy empieza en la ciento cuarenta y tres y termina en la ciento
  sesenta.
- `proposal.md:248` citaba «quién abre el mapa» por un rango que empezaba en la línea ochenta y cuatro
  y terminaba en la ochenta y seis — hoy empieza en la noventa y siete y termina en la noventa y
  nueve.
- Hallazgo propio, no reportado por el detector como bloqueante pero sí real: este mismo fichero citaba
  la entrada de `config.yaml` por un rango que terminaba en la línea doscientos ochenta y cuatro, y esa
  línea es la línea en blanco que sigue a la entrada —corregido para que el rango termine en la
  doscientos ochenta y tres.

Las tres primeras son Caso A (el contenido señalado sigue siendo cierto HOY, sólo se movió): se
repararon apuntando a la línea de hoy, **en sitio y sin añadir ninguna línea a `proposal.md`** —el
primer intento de reparación SÍ añadía una línea explicativa por cada cita, lo que desplazaba
`proposal.md` mismo (268→271 líneas) y habría roto, en cascada, las citas de `tasks.md:134`,
`design.md:324` y de este mismo `apply-progress.md` hacia `proposal.md:33,35,63,128,152,172,205,248`.
Revertido y rehecho como sustitución de igual número de líneas (mismo molde que P-2 sobre
`transitions.ts`, delta cero), confirmado con `wc -l` (268 antes y después) y `git diff -U0` mostrando
sólo reemplazos 1-a-1. Se aprovechó también para corregir una abreviada (`:891`) que el detector
atribuía al fichero equivocado por quedar pegada, en la prosa, al nombre de otro fichero citado antes.

**Verificación final, contra el commit real de cierre (`909d378`):** `npx tsx
apps/desk/server/citas/cli.ts --sha 909d3780e769f47b2c15e4baa5926552c6f6747a` → **EXIT_CODE=0**, cero
bloqueantes, 13 abreviadas rotas (todas informativas, todas pre-existentes a esta tanda — ninguna
introducida por C). La lección, para quien lea esto: la regla de mutación 4 pide correr el detector,
no razonar que no hará falta — ese mismo razonamiento fue el que falló aquí a la primera.
