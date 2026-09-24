```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:fd11f8b6b4c50202dfddfd45171c9ed5d2f9782c098d046dcc87d4f9d778fa33
verdict: pass
blockers: 0
critical_findings: 0
requirements: 1/1
scenarios: 3/3
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:376241cd08892dc2a4a64afe5cb7c892623ba83a40bca3bdced6edcfea61e0d5
build_command: npm run typecheck
build_exit_code: 0
build_output_hash: sha256:f9de8b15b07069fcbf31f4a415061f4b90d66551059b5518c6d53e721545e547
```

## Verification Report

**Change**: `rq-rc-07-regla-e`
**Version**: RQ-RC-07 delta (base `ce93480`) — re-verificación tras remediación
**Mode**: Strict TDD

### Verify anterior (fail) y su remediación

El verify previo (`fail`, 2 CRITICAL, Engram #1019) marcó 2/3 escenarios de la spec delta como
UNTESTED: «un cierre por dictamen se distingue de uno por trabajo» y «un cambio... lleva un único
`tanda:`». D4 del diseño había decidido no cubrirlos para no desplazar las citas externas ancladas en
`registro.test.ts:96/:101/:108` (regla de mutación 4). La remediación (tareas R.1-R.8) añadió un
`describe` nuevo AL FINAL del fichero (`:125-157`, después de la línea 123 de `HEAD`), con
`bloqueDeRegla` y 4 `it`: bloque (d) contiene «por trabajo»/«por dictamen» + control del otro signo;
bloque (e) contiene «UN SOLO `tanda:`»/«cuenta en parte» + control del otro signo. `git diff HEAD`
(ejecutado por este verify) confirma que sólo se insertaron líneas tras `:123`; `:96/:101/:108`
quedan byte a byte iguales a `HEAD`. Los dos CRITICAL quedan cerrados con test que pasa en runtime.

### Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 22 (14 originales + 8 de remediación R.1-R.8) |
| Tasks complete | 22 |
| Tasks incomplete | 0 |

### Build & Tests Execution
**Build (typecheck)**: ✅ Passed — `npm run typecheck` (`tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit`), exit 0, sin salida.

**Tests**: ✅ 1292 passed / 0 failed / 2 skipped (preexistentes, sin relación)
- Focal: `npx vitest run apps/desk/server/reconciliacion/registro.test.ts` → 15/15 passed, exit 0 (antes de la remediación: 11/11).
- Completa: `npm test` → 134 test files passed | 1 skipped (135); 1292 tests passed | 2 skipped (1294), exit 0.

**Lint**: `npm run lint -- --max-warnings 165` → 0 errores, 165 warnings (preexistentes; ninguno en `registro.test.ts`), exit 0.

**Coverage**: no solicitada por el objetivo de esta verificación; no ejecutada.

### Spec Compliance Matrix
| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| RQ-RC-07 | un cierre por dictamen se distingue de uno por trabajo | `registro.test.ts:132-136` + control `:138-143` | ✅ COMPLIANT |
| RQ-RC-07 | un cambio que realiza contenido de dos filas lleva un único `tanda:` | `registro.test.ts:145-149` + control `:151-156` | ✅ COMPLIANT |
| RQ-RC-07 | el guardián discrimina la (e) sin arrastrar la (d) | `registro.test.ts:59-63` (M3) | ✅ COMPLIANT |

**Compliance summary**: 3/3 scenarios compliant (antes: 1/3).

### Correctness (Static Evidence)
| Requirement | Status | Notes |
|------------|--------|-------|
| 5 ids `a`..`e` en orden | ✅ Implementado | `:49` |
| Reglas (a)-(c) intactas | ✅ Implementado | `:53-56` |
| Texto (d): motivo `por trabajo`/`por dictamen` | ✅ Implementado y probado | `:132-136`, control `:138-143` |
| Texto (e): `UN SOLO tanda:` / `cuenta en parte` | ✅ Implementado y probado | `:145-149`, control `:151-156` |
| Cabecera delta = cabecera viva | ✅ Implementado | Idéntica byte a byte a `openspec/specs/reconciliacion/spec.md:225` (comprobado en este verify) |

### Coherence (Design)
| Decision | Followed? | Notes |
|----------|-----------|-------|
| D1-D3 | ✅ Sí | Sin cambios desde el verify anterior |
| D4 (no añadir control de texto) | ✅ Sí, para su alternativa original | Superada por la nota de remediación en `design.md`: el control SÍ se añadió, en posición distinta (fin de fichero) que no desplaza citas |

### Mutación de control — verificación independiente (regla de mutación 2)
Script Node ejecutado por este verify (scratchpad, sin tocar el repo), reproduciendo `bloqueDeRegla`
con una construcción de regex distinta (flag `s`/dotAll en vez de `[\s\S]`), contra el `config.yaml`
real:
- bloque (d) real contiene «por trabajo» y «por dictamen»; copia con el motivo sustituido no contiene ninguno de los dos.
- bloque (e) real contiene «UN SOLO `tanda:`» y «cuenta en parte»; copia con el bloque (e) borrado da cadena vacía y no contiene ninguno.

Coincide con el RED/GREEN real reportado en `apply-progress.md`.

### Alcance y límite de edición
`git status --short` y `git diff --stat` (ejecutados por este verify) confirman que sólo cambiaron
`registro.test.ts` (+40/-6), `design.md` (+13) y `tasks.md` (+45/-20) — los tres dentro del fichero de
prueba declarado o la carpeta del cambio. Los cuatro ficheros sin trackear en `docs/sdd/` ya existían
al inicio de la sesión, ajenos a esta tanda. `git diff HEAD -- registro.test.ts` muestra que las
líneas 1-43 y 64-123 son idénticas a `HEAD`; sólo `:44-63` (cambio original, ya verificado antes) y lo
posterior a `:123` (remediación) difieren. `:96/:101/:108` releídas y byte a byte iguales a `HEAD`.

### TDD Compliance
| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ✅ | Tabla en `apply-progress.md`, 5 filas (incluye R.2-R.3, R.4-R.5) |
| All tasks have tests | ✅ | Único fichero de prueba es también el objeto del cambio |
| RED confirmed | ✅ | RED real de R.3 y R.5 documentado con salida textual; polaridad `toContain` capturada en rojo antes de invertir |
| GREEN confirmed | ✅ | 15/15 al ejecutar el test focal en este verify |
| Triangulation adequate | ✅ | (d) y (e): bloque real + control mutado, 2 casos cada uno |
| Safety Net | ✅ | 11/11 preexistentes en verde antes de remediar |

**TDD Compliance**: 6/6 checks passed.

### Assertion Quality
Sin tautologías, sin bucles fantasma, con control del otro signo para cada aserción nueva (regla de
mutación 2 aplicada dentro del propio fichero, y reproducida de forma independiente por este verify).

### Issues Found

**CRITICAL**: None — los 2 del verify anterior quedan cerrados por R.1-R.8 (ver arriba).

**WARNING**: None

**SUGGESTION**:
- La observación Engram `sdd/rq-rc-07-regla-e/spec` (#1016) sigue trayendo una cabecera de RQ-RC-07
  distinta de la que hay en disco (`openspec/changes/rq-rc-07-regla-e/specs/reconciliacion/spec.md`,
  que SÍ coincide con la viva). No afecta al archive, que usa el fichero. Fuera del alcance de este
  verify; corrección del orquestador.

### Verdict
**PASS** — 22/22 tareas completas, suite completa 1292/1294 (2 skips preexistentes sin relación),
typecheck y lint en verde, alcance de edición respetado, invariante de citas externas verificado
byte a byte, 3/3 escenarios de la spec delta con test que pasa en runtime, y mutación de control M3
más los dos controles de remediación reproducidos de forma independiente. Los 2 CRITICAL del verify
anterior están cerrados.
