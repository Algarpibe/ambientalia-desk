```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:7da119b371d6088852b4342eba4bcccd59b45180eda54328e7fb924f6358a8db
verdict: pass
blockers: 0
critical_findings: 0
requirements: 2/2
scenarios: 8/8
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:6ef423f9f7939f550d47e710ffc5d63472652a70b69972244b93f1bb39f7097f
build_command: npm run typecheck
build_exit_code: 0
build_output_hash: sha256:f9de8b15b07069fcbf31f4a415061f4b90d66551059b5518c6d53e721545e547
```

> **Nota de procedencia de este fichero.** El espejo original se perdió durante el archivo: era un
> fichero sin trackear, `git mv` movió sólo los trackeados y el borrado de la carpeta de origen se lo
> llevó. Se reconstruyó desde Engram (`sdd/mensaje-422-cliente-duplicado/verify-report`, obs. #424),
> que es la copia canónica del modo `hybrid`. El contenido es el mismo; sólo se añadió esta nota.

## Verification Report

**Change**: mensaje-422-cliente-duplicado
**Version**: delta tickets-core (RQ-TC-05, RQ-TC-13), sobre HEAD 4e0b542 (base del apply: 984b7aa; commit del cambio: c4fc97d)
**Mode**: Strict TDD

### Completeness
| Metric | Value |
|--------|-------|
| Tasks total (unidades contadas) | 25 (incluye 6.1b, hallazgo externo aditivo) |
| Tasks complete | 25 |
| Tasks incomplete | 0 |
| Fuera del recuento, por regla del ciclo (CLAUDE.md, Contexto SDD) | V1 - Fase 8, verificacion manual en produccion, dueno quien despliegue; no bloquea el archivo del cambio |

Confirmado sobre tasks.md en disco: las 25 casillas de las Fases 1-7 estan marcadas como completas. La Fase 8 (V1) es una seccion aparte, con dueno y destino, explicitamente no contada como unidad de trabajo, igual que el patron ya usado en reasignar-desvios-huerfanos.

### Build and Tests Execution
**Build (typecheck)**: PASSED
```text
$ npm run typecheck
> desk-ambientalia@0.1.0 typecheck
> tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit
(sin salida, exit 0)
```

**Tests**: 1003 passed / 2 skipped (0 failed)
```text
$ npm test
Test Files  112 passed | 1 skipped (113)
     Tests  1003 passed | 2 skipped (1005)
     exit 0
```
Baseline b3fc829: 112 ficheros / 999 pruebas, 1 fichero + 2 pruebas omitidas, exit 0.
Observado ahora: 112 ficheros / 1003 pruebas, 1 fichero + 2 pruebas omitidas, exit 0.
+4 pruebas exactas (T1-T4), 0 rotas, 0 borradas, mismas 2 omitidas. Coincide con la cifra que apply-progress y tasks.md (lineas 141-143) reportan.

apps/desk/server/services/ticketService.test.ts: 34/34 (30 preexistentes + T1-T4), confirmado en la misma corrida.

**Lint**: 0 errores / 158 avisos preexistentes (@typescript-eslint/no-explicit-any en packages/zoho-sync). Grep dirigido sobre la salida de npm run lint: cero apariciones de ticketService.ts o ticketService.test.ts, es decir 0 avisos nuevos en los ficheros tocados.

**Coverage**: no disponible - esta verificacion no ejecuto el comando con --coverage; ninguna de las tres compuertas pedidas (npm test, npm run typecheck, npm run lint) lo produce. Informativo, no bloqueante.

### Spec Compliance Matrix

**RQ-TC-05 - Orden de las guardas del alta**

| Escenario | Test | Resultado |
|---|---|---|
| El alta sin discrepancia no cambia | ticketService.test.ts:294-299 (equipo sin client_id enlazado, con clientId propio del cuerpo, responde 201) y :458-464 (equipo con el mismo client_id que el cuerpo, responde 201) | COMPLIANT |

**RQ-TC-13 - La guarda equipo-cliente**

| Escenario | Test | Resultado |
|---|---|---|
| El equipo manda cuando el cuerpo no trae cliente | ticketService.test.ts:391-397 (M5, el equipo manda; t.client_id es cli-A) | COMPLIANT |
| Discrepancia entre el cuerpo y el equipo | ticketService.test.ts:415-425 (T2, comparacion completa del mensaje con dos nombres distintos) | COMPLIANT, ver nota en Issues sobre la clausula AND no se crea ticket |
| Mismo nombre, dos ids | ticketService.test.ts:403-413 (T1, comparacion completa del renderizado 1) | COMPLIANT |
| Respaldo - el equipo no tiene nombre de cliente | ticketService.test.ts:438-448 (T4, comparacion completa con la nota sin nombre en el equipo) | COMPLIANT |
| Respaldo - el cliente solicitado no tiene ficha en Books | ticketService.test.ts:427-436 (T3, comparacion completa con la nota sin ficha en Books, no Cliente no encontrado) | COMPLIANT |
| El 3,4 por ciento sin cliente enlazado no se bloquea | ticketService.test.ts:294-299 y el resto del describe cada guarda por separado (todos usan la funcion equipo, que nunca fija client_id), responde 201, sin 422 nuevo | COMPLIANT |
| La orden de venta manda sobre el equipo cuando el cuerpo calla | ticketService.test.ts:377-387 (OV con cliente cli-B, equipo cli-A, sin clientId en el cuerpo, responde 422) | COMPLIANT |

**Compliance summary**: 8/8 escenarios COMPLIANT (0 PARTIAL, 0 UNTESTED, 0 FAILING). 2/2 requisitos verificados contra el codigo en HEAD.

### Correctness (Static Evidence)

| Elemento | Estado | Nota |
|---|---|---|
| Plantilla del mensaje 422 (design paragraph 1) | Implementado | ticketService.ts:82, cadena literal identica a design y a los tres renderizados |
| Ayudante lado(nombre, id, nota) | Implementado | ticketService.ts:78-79, local al else if, no sube a modulo (design paragraph 2, refactor 3.1 conservado) |
| getClient dentro de la rama (ii) unicamente, tras el logger.warn | Confirmado | ticketService.ts:77; el logger.warn de la linea 74 es byte a byte identico al de antes del cambio, verificado con git show c4fc97d: la linea del warn aparece como linea de contexto sin diff, no modificada |
| Dos respaldos distintos (sin nombre en el equipo / sin ficha en Books) | Implementado | ticketService.ts:80-81 |
| Nombre e id de Books para el destino, siempre | Implementado | paraQuien resuelve con el ayudante lado sobre destino?.name y clientId, sin condicion sobre igualdad de nombres |

### Coherence (Design)

| Decision | Seguida | Notas |
|---|---|---|
| E1 - 4 citas caducas del bloque, corregidas | Si | Verificado citacion por citacion contra el arbol final (ver abajo) |
| E2 - orden 4 (409) antes de 5 (discrepancia) en el delta, sin reabrir 4.1 | Si | spec.md filas 4/5 en el orden que ejecuta el codigo (409 en lineas 45-49 antes de la discrepancia en lineas 65-83); el punto abierto 4.1 sigue igual, sin tocar |
| E3 - respaldo decidido por si hay nombre no vacio, no por comparacion contra null | Si | el ayudante lado usa comprobacion de verdad sobre nombre, coincide con T3 y T4 |
| Paragraph 2 - consulta dentro de la rama (ii), despues del warn | Si | Confirmado por lectura y por git show |
| Paragraph 4 - tabla de mutaciones, las seis ejecutadas de verdad | Si | M-P1, M-C1 a M-C4 dieron ROJA como predicho; M-P2 dio VERDE como predicho. git diff 984b7aa..HEAD --stat sobre ticketService.ts = 12 lineas (+9/-3), sin residuo de mutacion, arbol limpio en estos ficheros |
| Paragraph 5 - M-P2 verde es hallazgo, no defecto | Si | No se escribio ninguna prueba para la precedencia 409/422; correcto por instruccion explicita de esta verificacion y por el punto abierto 4.1 declarado |
| Paragraph 6 - salida de rollback (git revert de la rama ii) | Coherente | Todo lo nuevo vive dentro del else if (lineas 69-83); ninguna migracion ni dato que reparar |

### Reanclaje de citas, verificacion independiente

30 citas de linea revisadas contra el arbol en HEAD (ticketService.ts, ticketService.test.ts, routes/tickets.ts, db/equipos.ts, books/repo.ts, y R08.1.md:2071-2079 del maestro): las 30 son correctas, 0 caducas.

| Fichero | Citas verificadas | Resultado |
|---|---|---|
| openspec/changes/mensaje-422-cliente-duplicado/specs/tickets-core/spec.md (delta) | 25 (funcion lineas 20-105, filas 1-7 de la tabla de guardas, 4 vinetas, RQ-TC-13 puntos 1-3, consecuencia declarada, posicion de la guarda) | Todas correctas |
| ticketService.test.ts, Sitio A (hallazgo externo, lineas 176 y 179) | 2 (ambas debian decir linea 327, y lo dicen) | Correctas |
| ticketService.test.ts, Sitio B (lineas 321-326) | 2 (linea 194 y rango 171-193) | Correctas, sin cambios |
| docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.1.md:2071-2079 (punto abierto numero 52) | 1 | Correcta, la linea 2079 dice literalmente: Ninguna de las tres encaja en un modelo de una OV, un ticket, y las tres son habituales. Punto abierto numero 52. |

No se encontro ninguna cita incorrecta. El reanclaje de la Fase 6 (apply-progress, tasks.md lineas 112-137) se sostiene contra el codigo real, no solo contra lo reportado.

Nota de alcance. Tres commits posteriores al de este cambio (ce0856c, 3c01dbb, 4e0b542, ya en HEAD) tocan el openspec/specs/tickets-core/spec.md canonico (no el delta de este cambio) y otros documentos, por una tanda distinta sobre la cardinalidad OV-ticket. git diff 984b7aa..HEAD --stat confirma que ninguno de esos commits toco ticketService.ts, ticketService.test.ts ni los artefactos de openspec/changes/mensaje-422-cliente-duplicado/: el estado de este cambio es exactamente el que dejo c4fc97d.

### Strict TDD - TDD Compliance
| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | Si | Tabla TDD Cycle Evidence presente en apply-progress |
| All tasks have tests | Si | 1 fila cubre las 8 tareas de RED mas GREEN (1.1 a 1.5, 2.1 a 2.3), con ticketService.test.ts como fichero unico |
| RED confirmado, tests existen | Si | T1 a T4 existen en el fichero, lineas 403 a 448, verificado por lectura directa |
| GREEN confirmado, tests pasan | Si | 34/34 en ticketService.test.ts, confirmado en la corrida real de esta verificacion, no solo en el reporte |
| Triangulacion adecuada | Si | 4 casos (T1 duplicados, T2 distintos, T3 sin ficha, T4 sin nombre), cada uno compara contra una cadena distinta, hay variacion real de valor esperado |
| Safety Net en fichero modificado | Si | 30 pruebas preexistentes mas 4 nuevas dan 34, coincide con lo reportado; el estado RED historico no es reconstruible sin revertir codigo, aceptado como narrativa corroborada por la tabla de mutaciones (Fase 4), que si se reejecuto de verdad hoy en sdd-apply |

**TDD Compliance**: 6/6 checks passed

### Test Layer Distribution
| Layer | Tests | Files | Tools |
|-------|-------|-------|-------|
| Unit / integracion (pg-mem) | 4 (T1-T4) | 1 (ticketService.test.ts) | vitest + pg-mem |
| Integration (HTTP) | 0 nuevos | - | supertest (no usado en esta tanda) |
| E2E | 0 | - | no instalado; .tsx fuera de la red de pruebas por decision de Gerencia (F0-00), no se propone cambiar esto |
| Total nuevos | 4 | 1 | |

### Changed File Coverage
Coverage analysis skipped, no se ejecuto --coverage en esta verificacion (no forma parte de las tres compuertas solicitadas).

### Assertion Quality
Ningun patron vetado encontrado en T1-T4: las cuatro afirman el codigo de estado 422 y ademas comparan el cuerpo del error contra la cadena completa esperada, valor real, no tautologia, no smoke-test, sin acoplamiento a detalle de implementacion (el string es el contrato HTTP, no CSS ni estado interno), sin mocks (usan pg-mem, no vi.mock).

**Assertion quality**: todas las afirmaciones verifican comportamiento real

### Quality Metrics
**Linter**: 0 errores / 158 avisos preexistentes (0 nuevos en ficheros tocados)
**Type Checker**: sin errores, exit 0

### Issues Found

**CRITICAL**: None

**WARNING**: None

**SUGGESTION**:
1. Escenario RQ-TC-13, Discrepancia entre el cuerpo y el equipo: el test que lo cubre (T2, ticketService.test.ts:415-425) verifica 422 y el contenido integro del mensaje mediante comparacion exacta de cadena, lo cual prueba de forma deterministica que la ejecucion paso por el throw de la linea 82 y por tanto nunca alcanzo el createTicket de la linea 97 (no hay ninguna otra sentencia en el codigo que produzca exactamente ese mensaje). Ningun test del describe hace ademas una consulta explicita a la tabla tickets para confirmarlo por separado. Se cuenta como COMPLIANT porque la garantia es estructural y deterministica, no una suposicion; se deja anotado por transparencia, siguiendo el mismo patron que el resto de tests de guarda del fichero, ninguno de los cuales consulta la tabla tras un rechazo.
2. No se ejecuto un comando con --coverage en esta verificacion; no hay cifra de cobertura por fichero para ticketService.ts mas alla de la evidencia de ejecucion real (34/34 en verde). Informativo.
3. Los cinco puntos abiertos de design.md, seccion 9 (precedencia 409/422, cliente_nombre o contact_name vacios, fila de Books con contact_name NULL, duplicados en books.contacts, cita caduca de RQ-TC-04) siguen abiertos, tal y como el diseno los dejo. Se listan aqui solo para que este informe no los omita en silencio; ninguno es un defecto de esta tanda.

### Verdict
**PASS**
2/2 requisitos y 8/8 escenarios COMPLIANT con prueba real en ejecucion (0 PARTIAL, 0 UNTESTED, 0 FAILING); las tres compuertas (npm test, npm run typecheck, npm run lint) dan verde con las cifras exactas esperadas (mas 4 pruebas, mismas 2 omitidas, 0 errores de lint, 0 avisos nuevos); 0 hallazgos CRITICAL; 0 WARNING; 3 SUGGESTION informativas, ninguna bloqueante.
