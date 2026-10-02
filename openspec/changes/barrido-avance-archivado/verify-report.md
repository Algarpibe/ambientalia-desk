# Verify report: barrido-avance-archivado

Cambio `barrido-avance-archivado` (`tanda: fuera-del-plan`, `cierra: no`). Modo `hybrid`, strict TDD activo,
runner `npm test`. Apply en `7f99f07` (planificación `3922433`, base `840a353`). Verificado en el worktree
`C:\dev\Desk_2_R1.023-worktrees\barrido-avance-archivado`, árbol limpio al empezar y al terminar.

**Veredicto: PASS WITH WARNINGS** (0 CRITICAL · 3 WARNING · 2 SUGGESTION).

## Compuertas ejecutadas

| Comando | Resultado |
|---|---|
| `npm test` | exit 0 · 168 ficheros pasan, 1 saltado · **2401 pasan, 2 saltadas** (coincide con apply-progress) |
| `npx vitest run apps/desk/server/reconciliacion` | 4 ficheros, **73/73** |
| `npm run typecheck` | exit 0 |
| `npm run lint` | 0 errores, **165 avisos** (techo 165: en el límite, sin margen) |
| `npm run reconcile` | exit 0 · **10 por archivo · 3 por commit · 6 en curso · denominador 78** · 5 «sin verificar» · 2 «sin fuente» · sin línea de suma · sin «sin declarar» |
| `npx tsx apps/desk/server/citas/cli.ts --sha HEAD` | 0 cabeceras R-1 inválidas; 11 abreviadas rotas, informativas (no bloquean) |

`npm run reconcile` regeneró `docs/sdd/RECONCILIACION.md` sólo en la cabecera (`3922433` y «CON CAMBIOS» pasan a
`7f99f07` y «limpio»); devuelto con `git checkout`, `git status` limpio. Las cifras, tandas y secciones coinciden
con lo commiteado.

Nota de método: una corrida de vitest lanzada desde el subdirectorio `reconciliacion` dio 16 rojos porque las
pruebas dependen del cwd en la raíz; no es un fallo del cambio. Repetida desde la raíz: 73/73 y 2401/2401.

## Completitud de tareas

30 casillas con ID (1.1-1.12, 2.1-2.5, 3.1-3.5, 4.1-4.2, 5.1-5.4, 6.1-6.2), **las 30 marcadas**. Ninguna pendiente.
Ver el juicio (1).

## Cumplimiento de la spec (6 requisitos, 28 escenarios)

Cada escenario tiene una prueba que lo cubre y que pasó en esta corrida (pruebas con el ID del escenario al
principio de su título, en `apps/desk/server/reconciliacion/comprobaciones.test.ts` o `registro.test.ts`).

| RQ | Escenarios | Prueba(s) | Estado |
|---|---|---|---|
| RQ-RC-01 | 01a, 01b | `01a`, `01b` | COMPLIANT |
| RQ-RC-05 | 05a-05g | `05a`..`05g` (05a y 05b también en `registro.test.ts` con ficheros reales) | COMPLIANT |
| RQ-RC-06 | 06a, 06b, 06c | `06a`, `06b`, `06c` (dos pruebas) | COMPLIANT |
| RQ-RC-10 | 10a-10e | `10a`..`10d` (sintéticas), `10e` (config real) | COMPLIANT |
| RQ-RC-11 | 11a-11f | `11a/11b` (una prueba, dos casos), `05d` cubre 11c, `11d`, `11e`, `11f/05g` (árbol real) | COMPLIANT |
| RQ-RC-12 | 12a-12e | `12a`, `12b`, `12c`, `12d` (sintética y real), `12e` | COMPLIANT |

Total: 28/28 COMPLIANT, 0 UNTESTED, 0 FAILING. 11b y 11c no tienen prueba con su propio ID: 11a/11b comparten
prueba y 11c es el escenario 05d (mismo GIVEN/WHEN/THEN). Sin consecuencia.

## Cumplimiento strict TDD

| Comprobación | Resultado |
|---|---|
| Evidencia TDD en apply-progress | Presente, con tabla RED/GREEN por fase (no por tarea, ver WARNING 3) |
| Ficheros de prueba existen y pasan | `comprobaciones.test.ts`, `registro.test.ts`: 73/73 |
| RED real | apply-progress declara 29/43 y 4/23 en rojo antes del código; coherente con +38 pruebas (2363 a 2401) |
| Safety net | 35/35 antes de tocar `reconciliacion` |
| Calidad de aserciones | Sin tautologías ni bucles fantasma observados en las pruebas de escenario; comparan listas y cifras concretas |

## Mutaciones reproducidas por el verificador

Las dos sobre el árbol del worktree, cada una revertida con `git checkout` y `git status` limpio.

| Mutación | Cambio | Resultado |
|---|---|---|
| D5 (patrón de ID) | quitar `1[GH]` del patrón de `comprobaciones.ts:394` | **4 rojas**: `12c`, `12a` y las dos de `registro.test.ts` que mueven el denominador |
| Regla 2 sobre lo vigilado | borrar la línea `prueba:` de F0-02 en el `openspec/config.yaml` REAL | **4 rojas**: `10e`, la de «mutación 2», `11f/05g` y la de P1 sobre ficheros reales |

El guardián discrimina: ensuciar el fichero vigilado lo pone rojo, no sólo retocar el código.

## Juicios pedidos

**(1) 41 tareas anunciadas frente a 30 casillas: es un recuento mal escrito, no falta trabajo.** `tasks.md` NO
contiene la cifra 41; la dice sólo `apply-progress.md:45`. Las 30 casillas corresponden a las seis fases y a la
matriz 28/28: cada escenario apunta a una tarea que existe y está marcada, y ninguna fase está vacía. Las 41 no
corresponden a ninguna lista de tareas. WARNING 2 por la cifra errónea, sin impacto en el trabajo.

**(2) Supuesto D8 (§C ausente informa, sin cambiar el exit code): correcto y coherente.** RQ-RC-03 deja el barrido
como lector que hace visibles los desvíos sin fallar, y el delta corregido (RQ-RC-12 y su escenario «mutar el
fichero vigilado») dice ahora «informar con hallazgo explícito, sin alterar el código de salida (RQ-RC-03)». Spec
y diseño ya no se contradicen; lo respalda la prueba `12d` (sintética y sobre la R01.4 real, que además exige que
no se publique 78). Supuesto reversible, anotado en `apply-progress.md:44`. Sin hallazgo.

**(3) Citas de `comprobaciones.ts` fuera de `archive/`: ancladas y veraces.** Trece citas, todas con `en 840a353`
en su línea física (barrido: ninguna línea con `comprobaciones.ts:N` sin ancla). Leídas contra
`git show 840a353:...`: `:46` es `RUTA_PLAN` a la R01.1 y `:133` el patrón `F[01][A-F]?` (R01.4 `:294` dice «lee el
§5 de la R01.1» y «sólo F0/F1x»: cierto); `:257` es el comentario «por su ausencia» (R01.4 `:175` afirma que
«ausencia» sale en comentarios: cierto); `:49` es `PREFIJO_CHANGES` y `:124` la llamada `listar` (`config.yaml:3339`:
cierto); `:203-207` es el bloque `cerradas`/`derivables` (`Parte_2026-09-21.md:35`: cierto); `design.md:9` cita
`:198-233` (rango de `numerador`). El detector pasa con 0 cabeceras inválidas.

## Cumplimiento del diseño (D1-D11)

Coherente: D1 (`startsWith(PREFIJO_ARCHIVO)`, `comprobaciones.ts:210`), D4/D5 (`tramoDelPlan` y patrón, `:381` y
`:394`), D6/D7 (R01.1 intacta para la guarda (b)), D8, D10 (hallazgo «sin declarar» retirado), D11 (YAML al final).
`informe.ts`, `cli.ts` y el puerto `Arbol` no se tocan.

## Hallazgos

**CRITICAL:** ninguno.

**WARNING**
1. **Lint al borde del techo:** 165 avisos con techo 165; el siguiente aviso nuevo lo rompe. Sin margen.
2. **Recuento de tareas erróneo:** `apply-progress.md:45` habla de 41 tareas; hay 30. Corregir o explicarlo en el
   archive-report.
3. **Evidencia TDD por fase, no por tarea:** la plantilla pide una fila por tarea con RED/GREEN/TRIANGULATE/SAFETY
   NET; apply-progress la da por fase. Verificado igual por ejecución y por las mutaciones propias; sin riesgo.

**SUGGESTION**
1. **Ledger del apply al límite:** 766 de 800 (`apply-progress.md:49`, medida contra `3922433`). El `sdd-archive`
   pasa de 800 con holgura (previsto ≈2.600); su techo ≈3.000 es decisión de Gerencia, listada en «Fuera del
   recuento» de `tasks.md`.
2. **Barrer las 11 abreviadas rotas** informativas que ya existen, en una tanda de limpieza sin relación con este
   cambio.

## Medida del ledger de este intento

`git diff --shortstat --no-renames HEAD`: vacío (0 líneas rastreadas, árbol limpio) · sin trackear: este
`verify-report.md` = **118** líneas (`wc -l`). Binarios: ninguno. Total del intento = **118** de 800.
