```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:bd64931ca4f4b79ad6210cbf1c772da14210cca385ddf144dc0e4248cbf4cf60
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 4/4
scenarios: 12/12
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:341e14b3d852e4ceddc75d4175bdfd1fe4ea351c9e93bfc86e5cd3abe4b33a86
build_command: npm run typecheck
build_exit_code: 0
build_output_hash: sha256:f9de8b15b07069fcbf31f4a415061f4b90d66551059b5518c6d53e721545e547
```

## Verification Report

**Change**: alta-equipo-nuevo-en-ticket (F1B-14, primer cambio, `cierra: no`)
**Version**: delta `tickets-core` (RQ-TC-04, RQ-TC-05 modificados; RQ-TC-15, RQ-TC-16 anadidos)
**Mode**: Strict TDD

### Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 40 |
| Tasks complete | 40 |
| Tasks incomplete | 0 |

### Build & Tests Execution
**Build (typecheck)**: Passed - tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit, sin salida, exit 0.
**Lint**: npm run lint -- --max-warnings 165 -> 0 errores, 165 avisos (mismo baseline medido en sdd-apply contra HEAD limpio), exit 0.
**Tests**: 1345 passed / 0 failed / 2 skipped (preexistentes, ajenos a este cambio, migrate.integration.test.ts) - 138 ficheros, 1 fichero completo skip.

Ejecutados de nuevo por esta fase (no solo tomados del contexto del orquestador), mismos resultados que reporto sdd-apply.

### Spec Compliance Matrix
| Requirement | Scenario | Test | Result |
|---|---|---|---|
| RQ-TC-15 | Alta con datos validos crea un equipo nuevo | ticketService.test.ts:511 (criterio 1) | COMPLIANT |
| RQ-TC-15 | Serial ya existente se reutiliza, sin duplicar | ticketService.test.ts:524 (criterio 2) | COMPLIANT |
| RQ-TC-16 | Una guarda posterior falla y no queda equipo creado | ticketService.test.ts:560 (criterio 5) + equipoNuevo.test.ts:79 (ROLLBACK) | COMPLIANT |
| RQ-TC-04 | Mantenimiento sin equipo sigue rechazandose | ticketService.test.ts:573 (criterio 6) | COMPLIANT |
| RQ-TC-05 | El alta sin discrepancia no cambia | ticketService.test.ts:490 | COMPLIANT |
| RQ-TC-05 | OV ya usada deja de ganar a los obligatorios | ticketService.test.ts:345 | COMPLIANT |
| RQ-TC-05 | OV ya usada deja de ganar al cliente no encontrado | ticketService.test.ts:356 | COMPLIANT |
| RQ-TC-05 | Discrepancia equipo-cliente gana a OV ya usada | ticketService.test.ts:323 (N1) | COMPLIANT |
| RQ-TC-05 | Escalon C: equipo-cliente antes que obligatorios | ticketService.test.ts:424 (N2) | COMPLIANT |
| RQ-TC-05 | Rama Equipo nuevo, datos obligatorios ausentes | ticketService.test.ts:537 (criterio 3) + P1 :590 | COMPLIANT |
| RQ-TC-05 | Rama Equipo nuevo, dato opcional invalido | ticketService.test.ts:545 (criterio 4) + P2-P6 :596-648 | COMPLIANT |
| RQ-TC-05 | Las otras dos clasificaciones no cambian | ticketService.test.ts:573 (criterio 6) | COMPLIANT |

**Compliance summary**: 12/12 scenarios compliant (4/4 requisitos: RQ-TC-04, RQ-TC-05, RQ-TC-15, RQ-TC-16).

### Correctness (Static Evidence)
Todas las citas de evidencia de RQ-TC-04/RQ-TC-05 en el delta se verificaron linea a linea contra el arbol real (no solo "la linea existe"):

| Cita del delta | Codigo real (ticketService.ts) | Coincide |
|---|---|---|
| :23-24 "Falta el equipo" | :23 declara equipoId, :24 throw ... Falta el equipo | OK |
| :26-27 "Equipo no registrado" | :26 getEquipo, :27 throw ... Equipo no registrado | OK |
| :37-39 OV inexistente | :37 getSalesOrder, :38 throw, :39 cierre natural del bloque | OK |
| :61-79 equipo-cliente | bloque if (!clientId && equipo.clientId) completo | OK |
| :83-88 obligatorios | declaraciones + if (missing.length) throw | OK |
| :89-90 cliente no existe | getClient + throw Cliente no encontrado | OK |
| :96-100 OV ya usada (409) | ticketConOrdenVenta + throw HttpError(409) | OK |
| :104-105 marca/modelo/serial del equipo | crearTicketConEquipo con equipo.marca/modelo/serial | OK |
| repo.ts:380 / :404 (opts.transaccionAbierta) | firma en :380, condicion en :404 | OK exacto |
| db/equipos.ts:391 getEquipoBySerial | anadida al final, sin desplazar nada previo | OK |
| routes/equipos.ts:144 export camposHojaDeVida | unica edicion de ese fichero, misma linea | OK |

### Design Coherence
| Decision de design.md | Seguida | Notas |
|---|---|---|
| Atomicidad via enTransaccion generico + opts.transaccionAbierta | Si | db/transaccion.ts, equipoNuevo.ts:88-91 |
| getEquipoBySerial al final de equipos.ts, sin desplazar | Si | confirmado por diff -U0 |
| Validacion C aparte de exigirEquipoNuevo, tardia | Si, con hallazgo declarado | apply-progress.md documenta fusion de fases 4/5 (razon tecnica valida) |
| trim() en SQL (design.md S3) | Desviado, declarado | pg-mem no soporta trim(); se movio a JS, convencion ya usada en el repo |
| Desplazamiento neto cero en ticketService.ts (design.md S6) | Desviado, decision del orquestador en tasks.md | se prefirio legibilidad; obligo a extender la Fase 10.4 a los 4 ficheros citados, hecho y verificado |
| P1-P7 (mutacion 1) | Si, con hallazgo | P2-P4 rompieron mas de un it por cadena anidada, investigado y explicado; P5-P7 aislan perfectamente |

### TDD Compliance
| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | OK | Tabla "TDD Cycle Evidence" en apply-progress.md, 8 filas |
| All tasks have tests | OK | 40/40, incluida Fase 9 (cliente, sin red de pruebas por F0-00, marcada N/A correctamente) |
| RED confirmado (ficheros existen) | OK | equipoNuevo.ts/.test.ts, transaccion.ts/.test.ts, getEquipoBySerial - verificados por lectura directa |
| GREEN confirmado (pasan hoy) | OK | 1345/1345 en la ejecucion de esta fase |
| Triangulacion | OK / advertencia leve | adecuada en general; ver SUGGESTION sobre fechas opcionales |
| Safety Net ficheros modificados | OK | repo.ts 19/19, equipos.ts 26/26, ticketService.ts 24/24, todas previas al cambio |

**TDD Compliance**: 6/6 checks passed

### Test Layer Distribution
| Layer | Tests | Files | Tools |
|---|---|---|---|
| Integration (pg-mem) | 20 | 3 (ticketService, equipos, repo) | pg-mem |
| Unit (rastreador de verbos, sin BD) | 4 | 2 (transaccion, equipoNuevo) | fake Queryable |
| Total nuevo | 24 | 5 | |

### Assertion Quality
Revisados equipoNuevo.test.ts, transaccion.test.ts, db/equipos.test.ts (bloque getEquipoBySerial) y las 18 it nuevas de ticketService.test.ts. Todas las aserciones ejercitan codigo de produccion real (estado en BD, secuencia de verbos SQL, codigos de estado, mensajes exactos), con valores distintos entre casos. No se encontraron tautologias, bucles fantasma sobre colecciones vacias, ni smoke-tests sin asercion de comportamiento.

**Assertion quality**: Sin hallazgos - todas las aserciones verifican comportamiento real

### Issues Found

**CRITICAL**: None

**WARNING**:
1. openspec/specs/transitions-st/spec.md:185 cita services/ticketService.ts:112-221 para executeTransition; la funcion real empieza hoy en :114 (desplazamiento +2 de este cambio). No es tarea de esta tanda repararlo: CLAUDE.md y apply-progress.md declaran a proposito que la fusion del delta en openspec/specs/ es trabajo de sdd-archive. Queda a cargo de esa fase.
2. proposal.md declara en "Capacidades -> Modificadas" que este cambio toca hojas-vida ("el equipo nace desde el ticket"), pero no existe ningun delta specs/hojas-vida/ en esta carpeta. La capacidad hojas-vida (RQ-HV-01 a RQ-HV-08) describe la validacion de los 6 campos solo en terminos de POST/PATCH /api/equipos; no documenta que ahora tambien se puede crear un equipo con esos mismos campos desde POST /api/tickets (aunque reutiliza camposHojaDeVida y es funcionalmente correcto). exploration.md:33 y :109 ya habian anotado que hojas-vida/spec.md necesita actualizarse, pero lo asignan al SEGUNDO cambio de F1B-14 (edicion-comercial-equipo, permisos/auditoria), no a este. Recomendado: que el segundo cambio, al tocar esa spec, anada tambien la mencion del alta-desde-ticket como via de escritura, o que se corrija la lista de "Modificadas" de este proposal.md si se considera que no aplica.
3. RQ-TC-15 afirma en su prosa que "el clientId del equipo, creado o reutilizado, SHALL ser el clientId ya resuelto del ticket". Para el caso CREADO esta impuesto literalmente (equipoNuevo.ts:89, clientId: input.clientId). Para el caso REUTILIZADO con equipo.clientId ya NULL en BD (el ~3,4% de equipos huerfanos de backfillClientId.ts, por CLAUDE.md), el guardia equipo-cliente (ticketService.ts:61-79, comentario "(iii)") deja ese caso fuera a proposito - comportamiento PREEXISTENTE a este cambio, no introducido por el - y el equipo reutilizado NO se actualiza con el clientId del ticket. Ni el criterio 2 de proposal.md ni el escenario "Serial ya existente se reutiliza" de spec.md exigen esa igualdad explicitamente (solo piden "no duplicar" y "quedar enlazado"), asi que a nivel de escenario el cumplimiento se sostiene; la prosa del requisito es mas amplia que lo que sus propios escenarios prueban.

**SUGGESTION**:
1. El resumen de apply-progress.md sobre la reparacion de citas en CLAUDE.md dice "cuatro :39 -> :41"; verificado contra git show 817eba3 y el arbol actual, lo que en realidad se hizo fue mas riguroso: 3 de esas 4 citas se fijaron como Caso B con revision anclada (:39 en 817eba3, exacto contra ese commit) y solo 1 (el punto abierto de IV-8, presente) se reaunto a :41. El resultado en el fichero es correcto; solo la frase que lo resume en apply-progress.md es imprecisa sobre su propio trabajo.
2. El escenario "dato opcional invalido" de la rama Equipo nuevo solo se triangula con Drive (criterio 4); las tres fechas comparten la misma funcion reutilizada (camposHojaDeVida), ya cubierta en general por packages/shared/src/hojaDeVida.test.ts, pero no hay un caso que ejercite, por ejemplo, fechaAdquisicion invalida a traves de este camino concreto. Riesgo bajo, dado que la funcion es literalmente la misma.

### Verdict
**PASS WITH WARNINGS** - 40/40 tareas, 12/12 escenarios del delta cubiertos por pruebas que pasan hoy (1345/1345, typecheck y lint limpios), citas de evidencia verificadas linea a linea sin discrepancias en el codigo de produccion. Las tres advertencias son de alcance documental (fusion de spec pendiente para sdd-archive, un delta de capacidad declarado pero no escrito, y una clausula de requisito mas amplia que sus propios escenarios) - ninguna bloquea el archivado de este cambio, pero la numero 2 conviene resolverla (repartir la mencion o escribir el delta) antes o durante sdd-archive.
