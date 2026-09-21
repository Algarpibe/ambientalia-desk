```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:41c3cd92e6228f7ea0b54a68151f04600079cabac8ceec6d8ad3b38537c6cb36
verdict: fail
blockers: 1
critical_findings: 1
requirements: 5/6
scenarios: 17/18
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:139bbfcd55ce1112fe6c7b4b3621cd59db8eb4e2d574505ab91ea4dabf3711a5
build_command: npm run typecheck
build_exit_code: 0
build_output_hash: sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

## Verification Report

**Change**: orden-precedencia-guardas (F1B-10)
**Version**: HEAD e841343 (worktree f1b-10-r1, arbol limpio)
**Mode**: Strict TDD

evidence_revision es sha256 de la salida de git rev-parse HEAD; el commit real es
e84134384d45d2cf5237b87d81d89d303eba0320.

### Completeness
| Metrica | Valor |
|---|---|
| Tareas totales | 37 |
| Tareas completas | 37 |
| Tareas incompletas | 0 |

### Build & Tests Execution

npm test (unica ejecucion, sola, sin nada en paralelo) -- exit 0
```text
Test Files  128 passed | 1 skipped (129)
     Tests  1182 passed | 2 skipped (1184)
  Duration  152.09s
```
El apply-progress.md del cambio reportaba 1136/1138 al cerrar sdd-apply; la cifra sube a 1182/1184
porque, tras sdd-apply, la rama fusiono main (227624d, F0-05) y heredo su propia bateria de pruebas --
ningun fichero de este cambio cambio tras 7daedf4, confirmado con git diff --stat 7daedf4 HEAD sobre
ticketService.ts, que dio vacio.

npm run typecheck -- exit 0, sin salida (tsc -b y tsc -p apps/desk/tsconfig.server.json --noEmit).

npm run lint -- exit 0, 158 problemas (0 errores, 158 warnings) -- coincide exactamente con la cifra
esperada por el encargo.

Coverage: no disponible -- no hay herramienta de cobertura configurada en vitest.config.ts ni en
package.json de este proyecto.

### Spec Compliance Matrix

Deltas leidos: openspec/changes/orden-precedencia-guardas/specs/transitions-st/spec.md (3 Requirement
MODIFIED, 5 escenarios con encabezado Scenario) y specs/tickets-core/spec.md (3 Requirement MODIFIED,
13 escenarios), contados con grep sobre esos dos encabezados. Total: 6 requisitos, 18 escenarios.

| Requirement | Scenario | Test | Resultado |
|---|---|---|---|
| RQ-TS-06 | orden de las 7 guardas (GWT embebido, sin encabezado Scenario propio) | ticketService.test.ts, describe el ORDEN, L147-227, mas transicionesEjecucion.test.ts | COMPLIANT |
| 3.4 | Las dos primeras puertas de la OV evaluan ya la misma regla en el mismo orden | ticketService.test.ts:195,345 | COMPLIANT |
| 3.8 | La guarda de contenido equipo-cliente gana a la guarda de unicidad de la OV | ticketService.test.ts:323 (N1) | COMPLIANT |
| 3.8 | Dentro del escalon B, el estado de origen sigue precediendo al area | ticketService.test.ts:158 | COMPLIANT |
| 3.8 | El sujeto direccionado por la URL responde 404, la referencia del cuerpo responde 422 | contratoErrores.test.ts:71 (N3), :77 (N4) | COMPLIANT |
| 3.8 | El alta de remision no cumple el orden total, desvio registrado sin corregirse (IV-12) | ninguno encontrado | UNTESTED |
| RQ-TC-05 | El alta sin discrepancia no cambia | ticketService.test.ts:490 | COMPLIANT |
| RQ-TC-05 | La OV ya usada deja de ganar a los obligatorios que faltan | ticketService.test.ts:345 | COMPLIANT |
| RQ-TC-05 | La OV ya usada deja de ganar al cliente no encontrado | ticketService.test.ts:356 | COMPLIANT |
| RQ-TC-05 | La discrepancia equipo-cliente gana a la OV ya usada | ticketService.test.ts:323 (N1) | COMPLIANT |
| RQ-TC-05 | Dentro del escalon C, equipo-cliente se resuelve antes de contar obligatorios | ticketService.test.ts:424 (N2) | COMPLIANT |
| 4.1 | El mismo error doble responde igual en las dos puertas del motor | ticketService.test.ts:195,345 | COMPLIANT |
| RQ-TC-13 | El equipo manda cuando el cuerpo no trae cliente | ticketService.test.ts:412 (M5) | COMPLIANT |
| RQ-TC-13 | Discrepancia entre el cuerpo y el equipo | ticketService.test.ts:383 | COMPLIANT |
| RQ-TC-13 | Mismo nombre, dos ids | ticketService.test.ts:435 (T1) | COMPLIANT |
| RQ-TC-13 | Respaldo, el equipo no tiene nombre de cliente | ticketService.test.ts:470 (T4) | COMPLIANT |
| RQ-TC-13 | Respaldo, el cliente solicitado no tiene ficha en Books | ticketService.test.ts:459 (T3) | COMPLIANT |
| RQ-TC-13 | El 3,4 por ciento sin cliente enlazado no se bloquea | ticketService.test.ts:295 | COMPLIANT |
| RQ-TC-13 | La OV manda sobre el equipo cuando el cuerpo calla | ticketService.test.ts:398 | COMPLIANT |

Compliance summary: 17/18 escenarios compliant.

Hallazgo CRITICAL, escenario sin prueba que lo cubra. El delta de transitions-st (parrafo 3.8, lineas
266-269) declara un encabezado Scenario formal para el incumplimiento IV-12 del alta de remision
(fecha invalida, escalon C, responde antes que la falta de serial, escalon A). Verificado contra el
codigo real: un grep de Fecha invalida y Falta el serial en apps/desk/server/routes/remision.ts da
linea 127 (fecha invalida) antes que linea 155 (falta el serial), la afirmacion es cierta. Pero un
grep de it( en apps/desk/server/remisiones.test.ts no tiene ninguna prueba que mande a la vez fecha
invalida y ticket sin serial para fijar cual gana. tasks.md (Fases 7-10) tampoco asigna esa prueba, es
coherente con que IV-12 esta registrado sin corregirse, pero un bloque Scenario formal en un delta
MODIFIED es, por la regla dura de sdd-verify, una afirmacion comprobable en runtime; sin prueba queda
UNTESTED, no COMPLIANT por descripcion.

### Correctness (Static Evidence)

| Requisito | Estado | Nota |
|---|---|---|
| Orden de guardas de createManagedTicket (RQ-TC-05) | Implementado | Leido ticketService.ts:22-97, escalon A en 22,24,36, luego C en 59,82,87, luego D en 94, coincide con la tabla |
| Orden de guardas de executeTransition (RQ-TS-06) | Implementado | Leido ticketService.ts:117-149, escalon A en 121,123, luego B en 124,127, luego C en 132,139, luego D en 148, coincide |
| Contrato 404/422 (P3, parrafo 3.8c) | Implementado, sin tocar produccion | git diff 7daedf4 HEAD sobre ticketService.ts vacio; contratoErrores.test.ts solo anade pruebas |
| Citas de evidencia de las tablas normativas (RQ-TS-06, RQ-TC-05) | Correctas, Caso B declarado | Verificadas contra git show ad65161 del fichero, coinciden con el ancla que el propio delta declara en su cabecera |

### Coherence (Design)

| Decision de design.md | Seguida | Nota |
|---|---|---|
| Mover G4 (OV, alta) y el bloque OV de executeTransition al final de su puerta | Si | Confirmado en codigo |
| P3 no toca produccion | Si | git diff --stat vacio, reconfirmado en este verify |
| No reordenar el alta de remision, IV-12 se registra, no se corrige | Si | remision.ts sin cambios; registrado en CLAUDE.md y openspec/config.yaml |
| Barrido de citas de cierre por fichero citado mas segundo pase abreviado | Parcial | Ver WARNING-2/3 abajo, dos artefactos propios del cambio quedaron con citas propias desactualizadas |

### TDD Compliance
| Comprobacion | Resultado | Detalle |
|---|---|---|
| Evidencia TDD reportada | Parcial | Tabla formal solo para Fase 7 (N3/N4) en apply-progress.md final; la de Fases 1-6 (N1,N2) existia en la revision de R1 y quedo resumida en prosa al fusionar |
| Todas las tareas tienen test | Si | N1,N2,N3,N4 existen y se identifican por nombre en los dos ficheros de test |
| RED confirmado (ficheros existen) | Si | Los cuatro ficheros o tests leidos y confirmados en el arbol |
| GREEN confirmado (pasan ahora) | Si | npm test exit 0, 1182/1184 passed |
| Triangulacion adecuada | N/A | Un caso por guion (N1-N4), consistente con lo declarado |
| Safety Net en ficheros modificados | Segun apply-progress.md de R1 | No re-ejecutado en este verify, evidencia historica, no reproducida |

TDD Compliance: 4/6 comprobaciones directas, 2 parciales (ver WARNING-1).

### Test Layer Distribution
| Capa | Tests | Ficheros | Herramienta |
|---|---|---|---|
| Unidad/servicio | 4 nuevos (N1-N4) mas preexistentes de la misma suite | ticketService.test.ts, contratoErrores.test.ts | vitest mas pg-mem |
| Integracion/HTTP | 0 nuevos para este cambio | (ninguno) | supertest (usado en otros ficheros del repo) |

Changed File Coverage: no disponible, no hay herramienta de cobertura configurada.

### Assertion Quality
Revisados ticketService.test.ts (N1, N2 y su entorno inmediato) y contratoErrores.test.ts (N3, N4)
contra las reglas de strict-tdd.md: todas las aserciones llaman a createManagedTicket o
executeTransition y comparan status, body.error o body.errors contra valores concretos derivados del
spec; ninguna tautologia, ninguna asercion huerfana de tipo, ningun bucle fantasma.

Assertion quality: todas las aserciones verifican comportamiento real.

Quality Metrics. Linter: 0 errores, 158 warnings preexistentes (ninguno en ficheros tocados por este
cambio, segun apply-progress.md; no reverificado fichero a fichero en este verify por presupuesto).
Type Checker: sin errores.

### Issues Found

CRITICAL:
1. Encabezado Scenario, El alta de remision no cumple el orden total (IV-12,
   specs/transitions-st/spec.md:266-269) no tiene prueba que lo cubra, ver detalle en la matriz de
   arriba. Bloquea el veredicto pass.

WARNING:
1. Evidencia TDD incompleta en el artefacto final. El apply-progress.md combinado (R1+R2) solo trae
   la tabla formal TDD Cycle Evidence de la Fase 7 (N3/N4). La de las Fases 1-6 (N1, N2, movimientos
   de G4/OV) existia en la revision de R1 (commit 3f2bb7c) y se resumio en prosa al fusionar con R2,
   perdiendo la forma tabular que exige strict-tdd.md. La evidencia en si no se perdio (recuperable
   del historial de git), pero el artefacto canonico actual no la trae en la forma exigida.
2. Cita rota del propio apply-progress.md: el commit R2 que declara no es el commit R2 real. La linea
   6 del fichero dice Commit R2 = cc6aa1d. git branch --all --contains cc6aa1d no devuelve ninguna
   rama, y git merge-base --is-ancestor cc6aa1d HEAD confirma que NO es ancestro de HEAD, es un commit
   huerfano (mismo padre 3f2bb7c, mismo mensaje, mismo timestamp que el commit real 7daedf4; git diff
   --stat cc6aa1d 7daedf4 muestra que solo difieren en 227 lineas del propio apply-progress.md,
   consistente con un amend posterior que no actualizo su propia autorreferencia). El commit REAL de
   R2, verificado con git log --oneline --all sobre apply-progress.md, es 7daedf4. Es el mismo patron
   que CLAUDE.md documenta como regla de mutacion 4 (una tanda que mueve o rehace su propio commit
   tiene que barrer sus propias citas, no solo el codigo), aplicado esta vez a un hash de commit en
   lugar de a una linea.
3. Deriva de linea en tasks.md 10.1. La lista de 9 pruebas que quedan intactas cita las lineas
   144,149,154,160,166,194,218,316,343; en el arbol actual los it( correspondientes estan en
   148,153,158,164,170,195,219 (verificado leyendo ticketService.test.ts), desfase de +4/+5 lineas,
   coherente con ediciones posteriores a cuando se escribio esa lista. No afecta al resultado (las
   pruebas existen y pasan), solo a la trazabilidad de la cita.
4. Discrepancia de magnitud entre Engram y disco para apply-progress/tasks. La observacion de Engram
   sdd/orden-precedencia-guardas/apply-progress (id 726) declara commit R2 7daedf4 y total R1+R2 = 701
   lineas; el apply-progress.md en disco (HEAD) declara cc6aa1d y 474 lineas. Ambos no pueden ser
   ciertos a la vez del mismo estado; el artefacto de disco es el mas reciente por fecha de commit,
   pero el desacuerdo entre las dos copias del modo hybrid no se resolvio antes de este verify.

SUGGESTION: Ninguna.

### Verdict
FAIL. 37/37 tareas completas y 1182/1184 pruebas en verde, pero 1 escenario formal del delta (IV-12,
alta de remision) no tiene prueba que lo cubra, y eso basta para no dar pass bajo la regla dura de
sdd-verify: un escenario del spec es conforme solo cuando una prueba que lo cubre paso en runtime.
Las 4 advertencias no bloquean por si solas, pero registran una perdida de trazabilidad en los propios
artefactos del cambio que conviene cerrar antes de sdd-archive.
