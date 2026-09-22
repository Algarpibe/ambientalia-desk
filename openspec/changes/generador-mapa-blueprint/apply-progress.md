# Apply progress — F1A-06 (`generador-mapa-blueprint`)

## Unidad A · datos y motor

**Intento SDD 1**, worktree `f1a-06-r1`, base commit `7670f89` (propuesta + specs + diseño + tareas ya
commiteados). Token de ledger `sha256:a6f3b7...`, confirmado `state: proceed` (mutación cero) antes y
después de leer los artefactos.

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| A.1.1-A.1.2 | `packages/shared/src/fasesBlueprint.test.ts` | Unit | N/A (new) | ✅ Written — import de módulo inexistente, `Cannot find module './fasesBlueprint'` | ✅ 5/5 pasan tras crear `fasesBlueprint.ts` | ✅ 5 casos: cobertura exacta, recuento 4/12/5, y las tres asignaciones no mecánicas (Ingresado, Pendiente, los 4 de ESTADOS_SIN_SALIDA) | ➖ Dato puro, sin lógica que refactorizar |
| A.1.3 | `packages/shared/src/fasesBlueprint.ts` (guarda de compilación) | Compile-time | ✅ typecheck verde antes de mutar | ✅ Mutación: quitar `'Pendiente'` de `FASE_POR_ESTADO` | ✅ `tsc` falla con `TS1360: Property 'Pendiente' is missing...`; revertido y `tsc` vuelve a exit 0 | ➖ N/A (guarda de compilación, no TDD de comportamiento) | ➖ N/A |
| A.2.1-A.2.3 | `packages/shared/src/invariantesGrafo.test.ts` (5b) | Unit | ✅ 7/7 pasando antes de tocar | ✅ Written — 5b reescrito con el par exacto ANTES de tocar `transitions.ts`, falla con `expected [ undefined, undefined ]...` | ✅ 7/7 tras editar `transitions.ts:150-151` en sitio | ➖ Único escenario (par exacto de las dos constantes); triangulación ya la dan las 2 constantes del `for` | ➖ Comentario `:108-119` reescrito junto con el `it`, sin lógica de producción que limpiar |
| A.3.1-A.3.2 | `apps/desk/server/db/estadoPorRemision.test.ts` | Integration (pg-mem + migrate()) | ✅ 13/13 pasando antes de tocar (baseline) | ➖ Refactor de fuente, no cambio de comportamiento (criterio 6, proposal §7) — no aplica ciclo RED nuevo | ✅ 13/13 tras el refactor, **sin tocar ninguna aserción** | ➖ N/A — approval-testing: el fichero de test ya documentaba el comportamiento correcto | ✅ Comentario de línea 17 (cita de código en un comentario, no una aserción) corregido para no quedar falso — hallazgo del barrido A.4.1 extendido |

### Work Unit Evidence

| Evidence | Valor |
|---|---|
| Focused test command y resultado exacto | `npx vitest run packages/shared/src/fasesBlueprint.test.ts packages/shared/src/invariantesGrafo.test.ts apps/desk/server/db/estadoPorRemision.test.ts` → **25/25 passed** (5 + 7 + 13) |
| Runtime harness / escenario real y resultado exacto | `npm test` completo (arnés `pg-mem` + `migrate()` real para `estadoPorRemision.test.ts`, sin credenciales Zoho) → **1232/1235 passed, 1 failed (pre-existente, fuera de alcance — ver abajo), 2 skipped** |
| Rollback boundary | `git revert` del commit de la Unidad A. Sin migración ni dato en base. `transitions.ts:150-151` y `estadoPorRemision.ts` vuelven a su forma de hoy con delta de líneas cero (confirmado por `git diff --shortstat`, ver abajo). `fasesBlueprint.ts`/`fasesBlueprint.test.ts` se borran enteros; `index.ts` pierde su línea 18 |

Detalle completo de la mutación de compilación A.1.3, el barrido A.4.1, el diff exacto y los hallazgos
pre-existentes (ya cerrados por commits posteriores: `registro.test.ts` a 19 capacidades, 165 avisos
ESLint sin cambio) queda en el historial de esta misma sección de intentos anteriores — resumido: los
dos hallazgos de cierre de A NO tocaban ficheros de esta Unidad y quedaron registrados para dueño
externo, cerrados por `54d00f1` antes de arrancar la Unidad B.

---

## Unidad B · generador, CLI, artefactos

**Intento SDD 2**, mismo worktree `f1a-06-r1`, base commit `54d00f1` (Unidad A completa y commiteada).
Token de ledger `sha256:cbc246b7d2c6bc05241b87a20071f643c6ad6d69551306e59fa41ec2547856dd`, confirmado
`state: proceed` (mutación cero) antes de tocar nada.

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| B.1.1-B.1.2 | `packages/shared/src/mapaBlueprint.test.ts` | Unit | N/A (new) | ✅ Written — 13 pruebas contra el esqueleto (`generarMapaBlueprint` devuelve `{}`); ejecutado: **9/9 fallan primero** (4 pasaban en falso por bucle fantasma sobre `Object.values({})`, corregidas con guardas `toHaveLength(4)` antes del `for`; **13/13 fallan** tras la corrección) | ✅ **13/13 pasan** tras implementar `generarMapaBlueprint` (una corrección de regex en el camino: `/-->/g` contaba también el `-->` de cierre del comentario HTML de cabecera — ajustado a `/e\d{2} --> e\d{2}/g`) | ✅ 16 casos tras B.4.1: los 13 iniciales + guarda de alias (estado referenciado sin entrada en `estados`), marca de área desconocida (fallback literal), y consolidación posterior a 14 casos sin perder aserciones | ✅ Comentarios de cabecera y JSDoc comprimidos en el cierre (B.4, ver «Presupuesto» abajo) sin tocar lógica ni aserciones |
| B.1.3-B.1.4 | (mismo fichero, guarda de EJECUCIÓN D-1) | Unit | — | ✅ Written — invocar con `fasePorEstado` sin `'Pendiente'`, esperar `throw` | ✅ Pasa: `validarFasePorEstado` lanza `Error` con el nombre del estado | ✅ Segunda guarda distinta añadida en B.4.1: `aliasDe` lanza si un estado referenciado por una arista no está en `estados` (invariante 1 del grafo lo evita con datos reales; se inyecta a propósito) | ➖ N/A |
| B.2.1-B.2.4 | `scripts/generar-mapa-blueprint.ts` (CLI) | N/A — sin prueba propia (RQ-MB-01, `vitest.config.ts:17-20` no incluye `scripts/**`) | — | ➖ N/A por diseño | ✅ `npm run generar-mapa-blueprint` escribe los 4 ficheros; segunda ejecución **byte a byte idéntica** (`sha256sum` comparado, ver abajo) | ➖ N/A | ➖ N/A |
| B.3.1-B.3.4 | `packages/shared/src/mapaBlueprint.test.ts` (bloque RQ-MB-06) | Unit (diff de cadenas contra disco) | ✅ Nace verde (B.2.2 ya generó ficheros correctos) | — | ✅ 1/1 passing tras normalizar `\r\n`→`\n` en la lectura de disco (ver hallazgo CRLF abajo) | ➖ N/A | ➖ N/A |

### Hallazgo — regex de arista contaba el cierre del comentario HTML

Al escribir la primera versión de la prueba RQ-MB-02 (`38 aristas`), el patrón `/-->/g` contaba
**39** en vez de 38: la cabecera `<!-- ... -->` de cada fichero cierra con un `-->` suelto que el
patrón desnudo cuenta como arista fantasma. Verificado con un script de depuración (`npx tsx` sobre
la salida real) que mostró la línea 6 del fichero (`-->` de cierre de comentario) como el resultado
39.º. Corregido exigiendo alias `eNN` a los dos lados: `/e\d{2} --> e\d{2}/g`. Documentado en el
comentario de la propia prueba (`mapaBlueprint.test.ts`, junto a la aserción).

### Hallazgo — CRLF del árbol de trabajo en Windows rompía la prueba anti-desfase

La primera versión de la prueba RQ-MB-06 comparaba `readFileSync(...)` directo contra la salida del
generador y fallaba: `.gitattributes` (`* text=auto`, sección «Fin de línea») fija el fin de línea del
**índice** en LF pero deja el del **árbol de trabajo** a `core.autocrlf` de cada máquina — en Windows,
CRLF (confirmado con `cat -A` sobre el fichero generado: `^M$` en cada línea). El generador es
determinista y produce LF siempre (D-5). Se normaliza `\r\n` → `\n` al leer de disco en la prueba, que
compara así por contenido y no por terminador — estable en las dos plataformas del equipo, mismo
criterio que usa `git diff`.

### Mutaciones B.3.2/B.3.3 — comando y salida exactos

**B.3.2 · regla de mutación 2 (`CLAUDE.md`): se ensucia el fichero VIGILADO.**

```
$ sed -i '33s/.*/    e19 --> e12 : Habilitar Servicio EDITADO A MANO [C]/' docs/artefactos/blueprint-completo.md
$ npx vitest run packages/shared/src/mapaBlueprint.test.ts -t "igual al commiteado en disco"
FAIL … el contenido regenerado desde el import real es igual al commiteado en disco
AssertionError: expected '<!--\n  GENERADO ...' to be '<!--\n  GENERADO ...'
- e19 --> e12 : Habilitar Servicio [C]              (regenerado)
+ e19 --> e12 : Habilitar Servicio EDITADO A MANO [C] (en disco)
1 failed | 13 skipped
```

Revertido: `git checkout -- docs/artefactos/blueprint-completo.md` → `git diff docs/artefactos/blueprint-completo.md` da **0 líneas** (vacío) → prueba vuelve a **1 passed | 13 skipped**.

**B.3.3 · transición sintética añadida sin regenerar.** Ejecutado vía script `tsx` aparte (no queda
como prueba permanente que mute disco, mismo molde que A.1.3): se construye un `EntradaMapa` con
`TRANSITIONS` más una transición sintética (`sintetica_b33`, `Finalizado → Ingresado`) y se compara el
regenerado contra el `.md` YA commiteado (sin tocarlo):

```
coincide (debe ser false): false
contiene la transición sintética el regenerado? true
contiene la transición sintética el commiteado? false
OK: la mutación B.3.3 pone la prueba anti-desfase en rojo, como exige RQ-MB-06
```

### Work Unit Evidence

| Evidence | Valor |
|---|---|
| Focused test command y resultado exacto | `npx vitest run packages/shared/src/mapaBlueprint.test.ts` → **14/14 passed** (motor puro + guarda de alias + área desconocida + anti-desfase) |
| Runtime harness / escenario real y resultado exacto | `npm run generar-mapa-blueprint` (CLI real, `tsx`) ejecutado dos veces seguidas; `sha256sum` de los cuatro `docs/artefactos/blueprint-*.md` **idéntico byte a byte** entre las dos ejecuciones (determinismo D-5, criterio 1 de propuesta §14) |
| Rollback boundary | `git revert` del commit de la Unidad B. Borra `mapaBlueprint.ts`, `mapaBlueprint.test.ts`, la CLI, los cuatro `.md` generados y la entrada de `package.json`; `index.ts` pierde su línea 19; no toca nada de la Unidad A |

### Hallazgo fuera de alcance declarado, corregido por necesidad de cierre — `estadoPorRemision.ts:41`, `npm run typecheck`

**Verificado por ejecución, dos veces, con `git stash`/`git stash pop` para aislar la causa.**
`npm run typecheck` (`tsc -p apps/desk/tsconfig.server.json --noEmit`) fallaba con
`TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'` en
`estadoPorRemision.ts:55` (el argumento `actual` pasado a `applyTransition`). Confirmado **pre-existente
a TODA la tanda F1A-06**, no sólo a la Unidad B: `git show 125ae3e:apps/desk/server/db/estadoPorRemision.ts`
(el commit base de la propuesta, ANTES de la Unidad A) ya tenía el mismo patrón (`actual` sin narrow,
pasado directo a `applyTransition`). El apply-progress de la Unidad A afirmó `npm run typecheck: exit 0`
— no se puede reconciliar esa afirmación con lo verificado aquí más que declarando la discrepancia: el
`git stash` con SOLO el commit `54d00f1` en el árbol (Unidad B fuera por completo) reproduce el mismo
error, así que no lo introdujo la Unidad B.

**Es un falso negativo de tipos, no un bug de comportamiento**: la guarda de la línea 41
(`.some((s) => s === actual)`) YA excluía en tiempo de ejecución el caso `actual === undefined` —
ningún elemento de los dos `.from` es `undefined`—, pero `.some()` no es un type guard para TypeScript.
**Corrección de una línea, delta de líneas CERO** (`wc -l` idéntico antes/después, confirmado):

```diff
- if (![...TRANSICION_REMISION_CONFIRMADA.from, ...TRANSICION_REMISION_RETIRADA.from].some((s) => s === actual)) return
+ if (actual === undefined || ![...TRANSICION_REMISION_CONFIRMADA.from, ...TRANSICION_REMISION_RETIRADA.from].some((s) => s === actual)) return
```

Verificado sin regresión: `npx vitest run apps/desk/server/db/estadoPorRemision.test.ts` → **13/13
passed**, sin tocar ninguna aserción, antes y después del cambio. La cita del comentario de
`estadoPorRemision.test.ts:17` (regla de mutación 4 — cita en comentario, invisible a `tsc`/`eslint`)
se actualizó en la misma línea, delta cero, para no quedar dando el texto viejo de la línea 41 como
literal.

**Por qué se corrigió en vez de sólo reportar:** B.4.3 exige `npm run typecheck` verde como criterio de
cierre de la Unidad B, y el fallo afecta a `apps/desk/server/db/estadoPorRemision.ts`, fichero que
Unidad B no tenía asignado tocar. El precedente lo fija la propia Unidad A (A.4.1, corrección de una
cita en comentario fuera de la lista literal de tareas, «hallazgo del barrido extendido»): un hallazgo
que bloquea un criterio de cierre obligatorio y tiene una corrección de una línea, delta cero, cien por
cien verificada sin regresión, se corrige y se declara — no se esconde y no se deja bloqueando sin
más. Se anota aquí explícitamente para que quede trazable a quién decidió tocar un fichero fuera de la
asignación literal de la Unidad B, y por qué.

### Repaso de citas (regla de mutación 4)

| Fichero desplazado | Citas repasadas | Resultado |
|---|---|---|
| `package.json` (+1 línea en `scripts`, `:57`→`:58` para `@vitest/coverage-v8`) | `openspec/config.yaml:60`, `docs/sdd/F1A-05_Auditoria_blueprint_audit-F1A.md:221` | **Reparadas** a `package.json:58`. `docs/sdd/Parte_2026-09-21.md:4` (`:20`) y las propias citas de esta tanda a `:43` (caso B, `125ae3e`) — sin cambios, siguen siendo ciertas |
| `packages/shared/src/index.ts` (+1 línea EOF, `:19`) | `tasks.md:55,136` (ya anticipaban `:18`/`:19`) | Confirmadas exactas contra el fichero final, sin reparación necesaria |
| `apps/desk/server/db/estadoPorRemision.ts:41` (contenido cambia, línea NO se mueve) | `estadoPorRemision.test.ts:17` (cita literal del código — reparada), `remisiones/spec.md:277`, `transitions-st/spec.md:81,106`, `zoho-sync/spec.md:79` (describen COMPORTAMIENTO, sigue siendo cierto tras el cambio, sin reparación) | Una reparada (cita literal), cuatro confirmadas sin cambio (describen comportamiento, no texto) |
| `transitions.ts` (sin tocar en esta Unidad) | `grep -rnoE "transitions\.ts:[0-9]+(-[0-9]+)?"` sobre el árbol final | Sin roturas nuevas — la Unidad B no editó este fichero |

### Presupuesto — diff exacto y `wc -l` de lo nuevo sin trackear

```
$ git diff --stat --no-renames 54d00f1
 apps/desk/server/db/estadoPorRemision.test.ts      |  4 +-
 apps/desk/server/db/estadoPorRemision.ts           |  2 +-
 docs/artefactos/blueprint-completo.md              | 79 ++++++++++++++++++++++
 docs/artefactos/blueprint-fase-1-entrada.md        | 22 ++++++
 docs/artefactos/blueprint-fase-2-diagnostico.md    | 52 ++++++++++++++
 docs/artefactos/blueprint-fase-3-cierre.md         | 34 ++++++++++
 docs/sdd/F1A-05_Auditoria_blueprint_audit-F1A.md   |  2 +-
 openspec/changes/generador-mapa-blueprint/tasks.md | 30 ++++----
 openspec/config.yaml                               |  2 +-
 package.json                                       |  3 +-
 packages/shared/src/index.ts                       |  1 +
 11 files changed, 210 insertions(+), 21 deletions(-)

$ wc -l packages/shared/src/mapaBlueprint.ts packages/shared/src/mapaBlueprint.test.ts scripts/generar-mapa-blueprint.ts
  231 packages/shared/src/mapaBlueprint.ts
  178 packages/shared/src/mapaBlueprint.test.ts
   44 scripts/generar-mapa-blueprint.ts
  453 total (sin trackear, nuevo)
```

**Total ledger (git diff + wc -l de lo nuevo sin trackear): 231 + 453 = 684**, contra el techo de 700
del intento (`--max-changed-lines 700`) — **16 líneas de margen**. Los cuatro `.md` generados (188
líneas de las 231 del diff tracked: 79+22+52+34+1 nota... exactamente 79+22+52+34 = 187) no cuentan en
el presupuesto de **revisión** (400/800 líneas, excluidos por convención de `sdd-phase-common.md` §E),
pero sí en el ledger de `sdd-attempt` vía este cálculo, tal como exige `CLAUDE.md` (regla del ciclo 2).

**Autoría revisable (additions+deletions, excluyendo los cuatro `.md` generados):** 210 - 187 = 23
(tracked, código+specs+config) + 453 (untracked: `mapaBlueprint.ts` + su prueba + la CLI) = **476**.
Por debajo del techo de revisión de 800 del proyecto (`openspec/config.yaml:29`); el forecast de
`tasks.md` había estimado B en ~480-560, así que el gasto real quedó dentro del rango previsto.

### Resultado de los comandos de cierre (B.4.1-B.4.3)

- `npm run test:coverage` (suite completa): **exit 0**. `packages/shared/src/**` →
  **97,68 % líneas / 89,86 % ramas / 98,87 % funciones / 97,68 % statements**, todas por encima del
  suelo `92/92/96/78` (`vitest.config.ts:58-63`). `mapaBlueprint.ts` → **100 % líneas / 97,82 % ramas /
  100 % funciones / 100 % statements** (única rama sin ejercitar: el fallback `MARCA_AREA[area] ?? area`
  de la leyenda del completo, línea 153 — defensivo contra un `AREAS` futuro no mapeado; `AREAS` es una
  constante cerrada de tres elementos que siempre casa con `MARCA_AREA` hoy, así que la rama no es
  alcanzable con datos reales sin mockear el import).
- **38 aristas, fijado por aserción** (`mapaBlueprint.test.ts`, `RQ-MB-02 · el diagrama completo tiene
  38 aristas...`): confirmado `14/14 passed`, incluida la aserción de **3** con origen
  `habilitar_servicio` y **2** marcadas `(sin botón)`.
- `npm test` (suite completa, 132/133 ficheros, 1 skip): **exit 0**, **1247/1249 passed, 2 skipped**
  (2 menos que la Unidad A por la consolidación de dos pares de pruebas de `mapaBlueprint.test.ts` en
  una sola cada uno, sin perder ninguna aserción — verificado antes/después de la consolidación).
- `npm run typecheck`: **exit 0** (tras la corrección declarada arriba de `estadoPorRemision.ts:41`).
- `npm run lint`: **exit 0**, **0 errores, 165 avisos** — idéntico al trinquete que dejó la Unidad A
  (`ci.yml:41` fija 158 con `--max-warnings`, que `npm run lint` sin flags no aplica; el número no subió).
- `npm run build`: **exit 0**, bundle de producción generado sin errores.

### Criterio 1 de propuesta §14 — regeneración e idempotencia

`npm run generar-mapa-blueprint` ejecutado dos veces seguidas. Segunda ejecución: `git status --short
docs/artefactos/` sigue mostrando los cuatro ficheros como `??` (nuevos, sin commitear todavía) pero
**`sha256sum` de los cuatro ficheros es idéntico entre la primera y la segunda ejecución** — confirmado
por comparación directa de sumas, no por inspección visual. Cumple determinismo D-5 y criterio 1.
