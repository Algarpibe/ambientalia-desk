# Apply Progress: RQ-RC-07 declara cinco reglas de lectura, con la (e)

**Cambio**: `rq-rc-07-regla-e` · **Modo**: Strict TDD · **Fichero único tocado**: `apps/desk/server/reconciliacion/registro.test.ts`

## Tareas completadas

- [x] 1.1 Rojo de partida medido (no creado) — confirmado que main está roja desde `be78ef9`.
- [x] 2.1–2.4 GREEN: título `CINCO reglas de lectura`, título del `it` con `a`-`e`, expectativa `['a','b','c','d','e']`; test focal en verde (11/11).
- [x] 3.1–3.2 RED real de M3: expectativas de `:61`/`:62` cambiadas SIN tocar la regex de `:60`; rojo real capturado.
- [x] 4.1–4.3 GREEN: regex de `:60` acotada (D2); suite focal verde completa (11/11); mutación de posición (regla de mutación 1) probada y revertida.
- [x] 5.1–5.4 Suite completa, conteo de líneas, `typecheck` y `lint` — los cuatro en verde.

**Remediación tras verify (2 CRITICAL, verdict `fail` en `verify-report.md`)**:
- [x] R.1 `describe` nuevo al final del fichero (después de `:123`) con `bloqueDeRegla`, reutilizando la regex acotada de M3.
- [x] R.2 Prueba: bloque (d) contiene «por trabajo» y «por dictamen».
- [x] R.3 Control del otro signo de R.2 — RED real capturado y luego invertido a verde.
- [x] R.4 Prueba: bloque (e) contiene «UN SOLO `tanda:`» y «cuenta en parte».
- [x] R.5 Control del otro signo de R.4 — RED real capturado y luego invertido a verde.
- [x] R.6 `git diff` confirma sólo adiciones al final; `:96`/`:101`/`:108` releídas e intactas.
- [x] R.7 `design.md` D4 actualizado con nota de remediación.
- [x] R.8 Focal (15/15), suite completa, `typecheck`, `lint` — los cuatro en verde.

## Fase 1 — Rojo de partida (medido)

Comando: `npx vitest run apps/desk/server/reconciliacion/registro.test.ts` sobre el árbol sin tocar.

```
❯ registro · RQ-RC-07: `unidad_de_avance` declara CUATRO reglas de lectura > los ids son exactamente `a`, `b`, `c` y `d`, en ese orden

AssertionError: expected [ 'a', 'b', 'c', 'd', 'e' ] to deeply equal [ 'a', 'b', 'c', 'd' ]

- Expected
+ Received

  [
    "a",
    "b",
    "c",
    "d",
+   "e",
  ]

 ❯ apps/desk/server/reconciliacion/registro.test.ts:49:48

 Test Files  1 failed (1)
      Tests  1 failed | 10 passed (11)
```
Exit code: 1. Confirma el rojo heredado descrito en la propuesta/diseño; este paso lo mide, no lo crea.

## Fase 3 — Rojo real de M3 (regex SIN tocar, sólo expectativas)

Comando: `npx vitest run apps/desk/server/reconciliacion/registro.test.ts` tras 3.1 (`:61`/`:62` cambiadas, `:60` intacta).

```
FAIL apps/desk/server/reconciliacion/registro.test.ts > registro · RQ-RC-07: `unidad_de_avance` declara CINCO reglas de lectura > M3, control del otro signo: quitando la regla (d) de una COPIA, el guardián se pone rojo

AssertionError: expected [ 'a', 'b', 'c' ] to deeply equal [ 'a', 'b', 'c', 'e' ]

- Expected
+ Received

  [
    "a",
    "b",
    "c",
-   "e",
  ]

 ❯ apps/desk/server/reconciliacion/registro.test.ts:62:41
    60|     const sucio = configReal().replace(/^ {4}- id: d$[\s\S]*?(?=^ {2}[…
    61|     expect(idsDeReglasDeLectura(sucio)).not.toEqual(['a', 'b', 'c', 'd…
    62|     expect(idsDeReglasDeLectura(sucio)).toEqual(['a', 'b', 'c', 'e'])
       |                                         ^
    63|   })
    64| })

 Test Files  1 failed (1)
      Tests  1 failed | 10 passed (11)
```
Exit code: 1. Es el rojo real predicho por el diseño (§ Estrategia de prueba, paso 3): la regex sin acotar borra (d) **y** (e), así que la copia sucia sólo trae `['a','b','c']`.

## Fase 4.2 — GREEN completo tras acotar la regex

Comando: `npx vitest run apps/desk/server/reconciliacion/registro.test.ts`.

```
✓ apps/desk/server/reconciliacion/registro.test.ts (11 tests) 36ms
 Test Files  1 passed (1)
      Tests  11 passed (11)
```
Exit code: 0.

## Fase 4.3 — Mutación de posición (regla de mutación 1)

Se quitó temporalmente la alternativa `^ {4}- id: ` del lookahead (regex vuelta a
`/^ {4}- id: d$[\s\S]*?(?=^ {2}[a-z_]+:)/m`) y se corrió el test focal:

```
× M3, control del otro signo: quitando la regla (d) de una COPIA, el guardián se pone rojo
  → expected [ 'a', 'b', 'c' ] to deeply equal [ 'a', 'b', 'c', 'e' ]
 Test Files  1 failed (1)
      Tests  1 failed | 10 passed (11)
```
Exit code: 1. Confirma que la alternativa discrimina de verdad — sin ella, la regex vuelve a
borrar (d) y (e) a la vez y el rojo reaparece. Se revirtió inmediatamente a la regex acotada
(D2); test focal vuelto a verde (11/11, exit 0). No se añadió prueba nueva — la mutación se
documenta, tal como pide 4.3.

## Fase 5 — Suite completa, línea, typecheck, lint

| Comando | Resultado | Exit code |
|---|---|---|
| `npm test` | 134 test files passed \| 1 skipped (135); 1288 tests passed \| 2 skipped (1290) | 0 |
| `wc -l apps/desk/server/reconciliacion/registro.test.ts` (antes) | 123 | — |
| `wc -l apps/desk/server/reconciliacion/registro.test.ts` (después) | 123 | — |
| `npm run typecheck` | `tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit` sin salida, sin error | 0 |
| `npm run lint -- --max-warnings 165` | `✖ 165 problems (0 errors, 165 warnings)` | 0 |

`git diff --stat` confirma la delta neta: `1 file changed, 6 insertions(+), 6 deletions(-)` — cero
líneas netas, tal como exige el diseño. Las citas externas ancladas en `:96`, `:101` y `:108`
quedan intactas porque no se insertó ni borró ninguna línea (verificado por lectura directa de
esas tres líneas tras el cambio).

## Remediación tras verify — evidencia RED/GREEN real

Los dos escenarios CRITICAL del `verify-report.md` (`el guardián/comprobación no cubre el texto
de (d) ni de (e)`) no tenían ningún test. D4 del diseño seguía siendo correcta para su
alternativa original (insertar en `:52-57` desplaza `:96`/`:101`/`:108`, regla de mutación 4); la
remediación resuelve añadiendo un `describe` nuevo AL FINAL del fichero (tras `:123`), que no
desplaza nada.

### RED real — control de la regla (d), polaridad invertida a propósito

Comando: `npx vitest run apps/desk/server/reconciliacion/registro.test.ts`, con la aserción
escrita primero en polaridad `toContain` (la forma que DEBE fallar sobre la copia sucia):

```
 × registro · RQ-RC-07: el TEXTO de las reglas (d) y (e) está en el registro > control del otro signo: quitando el motivo del bloque (d) de una COPIA, deja de contenerlo
   → expected '    - id: d\n      regla: "El numerad…' to contain 'por trabajo'

 - Expected
 + Received

 - por trabajo
 +     - id: d
 +       regla: "El numerador se publica con el MOTIVO de su cambio: sin decir el motivo."
 +       detalle: >
 +         El 2026-09-17 el numerador pasó de 10 a 11 sin que nadie escribiera
 +         código: lo movió un dictamen. Es correcto, pero quien vea la serie sin
 +         más creerá que fue un día productivo. El denominador ya va fechado por
 +         la regla (a); el numerador necesita lo simétrico.

 ❯ apps/desk/server/reconciliacion/registro.test.ts:141:21
```
Exit code: 1 — 2 failed | 13 passed (15). El texto que la aserción esperaba encontrar ya no
estaba en el bloque (d) de la copia sucia: RED real, no simulado.

### RED real — control de la regla (e), misma técnica

```
 × registro · RQ-RC-07: el TEXTO de las reglas (d) y (e) está en el registro > control del otro signo: quitando la regla (e) completa de una COPIA, su bloque deja de contener el texto
   → expected '' to contain 'UN SOLO `tanda:`'

 ❯ apps/desk/server/reconciliacion/registro.test.ts:154:21
```
Exit code: 1 — mismo run, 2 failed | 13 passed (15). Al borrar el bloque (e) completo de la
copia, `bloqueDeRegla(sucio, 'e')` da cadena vacía: el `toContain` no puede encontrar el texto —
RED real.

### GREEN — polaridad invertida a `not.toContain`

Comando: `npx vitest run apps/desk/server/reconciliacion/registro.test.ts`.

```
 ✓ apps/desk/server/reconciliacion/registro.test.ts (15 tests) 66ms
  Test Files  1 passed (1)
       Tests  15 passed (15)
```
Exit code: 0. Las 4 pruebas nuevas (2 principales + 2 de control) pasan junto con las 11
preexistentes.

## Ficheros modificados

| Fichero | Acción | Qué |
|---|---|---|
| `apps/desk/server/reconciliacion/registro.test.ts` | Modificado | `:47`, `:48`, `:49` (título y expectativa a cinco reglas); `:60`, `:61`, `:62` (regex M3 acotada + expectativas `['a','b','c','e']`); **remediación**: `:125-158` nuevas — `bloqueDeRegla` + `describe` con 4 `it` (bloque (d), control (d), bloque (e), control (e)) |
| `openspec/changes/rq-rc-07-regla-e/design.md` | Modificado | Nota de remediación añadida a D4 (no se renumera la decisión, se documenta el cambio de alcance) |
| `openspec/changes/rq-rc-07-regla-e/tasks.md` | Modificado | Sección «Remediación tras verify» con 8 tareas R.1-R.8, todas `[x]` |

No se tocó ningún otro fichero. `openspec/changes/rq-rc-07-regla-e/specs/reconciliacion/spec.md`
y `proposal.md` ya estaban escritos por fases previas (fuera del alcance de `sdd-apply`).
`openspec/config.yaml` no se tocó, como exige el diseño.

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 2.1–2.4 | `apps/desk/server/reconciliacion/registro.test.ts` | Unit | ✅ 10/11 pre-existentes en verde (1 rojo heredado medido en Fase 1) | ✅ Medido (heredado de `be78ef9`, no escrito por esta tanda) | ✅ Passed (11/11) | ➖ Single — sólo cambia el nº de ids esperado, escenario único de la spec | ➖ None needed |
| 3.1–4.2 | `apps/desk/server/reconciliacion/registro.test.ts` | Unit | ✅ 11/11 antes de tocar M3 | ✅ Written (expectativas cambiadas antes que la regex; rojo real capturado) | ✅ Passed (11/11 tras acotar regex) | ✅ 2 casos — `not.toEqual` (control de que ya no coincide con la lista vieja) + `toEqual(['a','b','c','e'])` (discriminación real) | ➖ None needed — regex mínima que satisface D2 |
| 4.3 | `apps/desk/server/reconciliacion/registro.test.ts` | Unit | ✅ 11/11 antes de mutar | ✅ Mutación de posición ejecutada y revertida (regla de mutación 1) | ✅ Rojo confirmado con la alternativa quitada, verde confirmado tras revertir | ➖ No aplica — es una comprobación de robustez, no una tarea nueva | ➖ None needed |
| R.2–R.3 | `apps/desk/server/reconciliacion/registro.test.ts` | Unit | ✅ 11/11 antes de remediar | ✅ Written — control (R.3) escrito primero en polaridad `toContain` sobre la copia sucia, ejecutado, rojo real capturado (ver evidencia RED arriba) | ✅ Passed — invertido a `not.toContain`, 15/15 | ✅ 2 casos — bloque real (contiene) + copia mutada (no contiene) es la triangulación: mismo `bloqueDeRegla`, dos entradas distintas | ➖ None needed |
| R.4–R.5 | `apps/desk/server/reconciliacion/registro.test.ts` | Unit | ✅ 11/11 antes de remediar | ✅ Written — control (R.5) escrito primero en polaridad `toContain` sobre la copia con el bloque (e) borrado, ejecutado, rojo real capturado (ver evidencia RED arriba) | ✅ Passed — invertido a `not.toContain`, 15/15 | ✅ 2 casos — bloque real (contiene) + copia con bloque (e) borrado (cadena vacía, no contiene) | ➖ None needed |

### Test Summary
- **Total tests escritos/modificados**: 6 — 2 (`it` de `:48` y `it` de M3, `:59`) + 4 nuevos de remediación (bloque (d), control (d), bloque (e), control (e)); 9 `it` restantes del fichero original sin tocar
- **Total tests pasando**: 15/15 (fichero focal, tras remediación); 1292/1294 (suite completa, 2 skipped preexistentes sin relación — antes 1288/1290, +4 por esta remediación)
- **Layers usados**: Unit (6)
- **Approval tests**: N/A — no es tarea de refactorización de código de producción, es un guardián de configuración ya existente
- **Pure functions creadas**: 0 — no se tocó `comprobaciones.ts` ni el núcleo; se añadió `bloqueDeRegla`, una función pura de sólo pruebas (extrae un bloque de texto con la regex acotada de M3, parametrizada por `id`)

## Work Unit Evidence

| Evidence | Valor |
|---|---|
| Focused test command and exact result | `npx vitest run apps/desk/server/reconciliacion/registro.test.ts` → 15/15 passed, exit 0 (tras remediación; ver evidencia GREEN arriba) |
| Runtime harness command/scenario and exact result | N/A — guardián de fichero de configuración estático, sin servicios ni datos externos (según Work Unit del `tasks.md`) |
| Rollback boundary | `git revert` del commit devuelve `registro.test.ts`, `design.md` y `tasks.md` al estado previo a la remediación (14/14 tareas originales, verify `fail`) |

## Desviaciones del diseño

Ninguna funcional. Una discrepancia documental detectada y NO corregida (fuera del límite de
edición de esta tanda, que sólo permite tocar `registro.test.ts` y los artefactos de esta carpeta
de cambio): `tasks.md:50` y `design.md:30` (implícito) dicen que el fichero "debe seguir en 124
líneas"; la medición real con `wc -l`, tanto ANTES como DESPUÉS de los cambios, da **123** líneas.
El invariante que la regla de mutación 4 protege —misma cuenta antes y después, para no desplazar
`:96`/`:101`/`:108`— se cumple igual (123 = 123); lo que está desactualizado es el número absoluto
citado en `tasks.md`, no el comportamiento. No se editó `tasks.md` más allá de marcar `[x]` porque
corregir esa cifra no es una de las 14 tareas asignadas y `design.md` está fuera del límite de
edición de esta tanda.

## Problemas encontrados

Ninguno.

## Tareas restantes

Ninguna — 14/14 tareas originales + 8/8 tareas de remediación (R.1-R.8) completas (22/22 en total).

## Workload / PR Boundary

- Mode: single PR
- Current work unit: Unit 1 (único) — `Alinear registro.test.ts con el registro real`, extendido con la remediación del verify
- Boundary: empieza y termina en el mismo commit de trabajo; toca `registro.test.ts` (código) más `design.md`/`tasks.md` de esta misma carpeta de cambio (documental)
- Estimated review budget impact: `registro.test.ts` — 46 líneas de diff (`+40/-6`, ver `git diff --stat`) sobre el estado previo a esta remediación; `tasks.md` y `design.md` son adiciones documentales de la propia carpeta del cambio. Muy por debajo del presupuesto de 800 fijado en el preflight

## Estado

22/22 tareas completas (14 originales + 8 de remediación). El `verify-report.md` anterior (`fail`,
2 CRITICAL) queda superado por esta remediación: los dos escenarios de la spec delta que estaban
`UNTESTED` ahora tienen prueba directa y su control del otro signo. Listo para `sdd-verify`.
