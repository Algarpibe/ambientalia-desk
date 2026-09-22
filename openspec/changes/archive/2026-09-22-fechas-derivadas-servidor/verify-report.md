```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:ac2fdaac42a2f01adb009a48cf3e854fad0d7df20bcaf4679fdcabbe4e46dda6
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 7/7
scenarios: 21/21
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:f768f6daa7a430bcd9b87015961e2f54dfb7bae6c090fdf0b430c389add0745a
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:17816f0370addd6353417cefda3cd4e3133bd55ab0feee65ce939997eba05e98
```

## Verification Report

**Change**: fechas-derivadas-servidor (F1A-07 - IV-2)
**Version**: worktree f1a-07-r1, HEAD ad927dc5c6eee75d6dffc5164d89671cc562f23e (rama sin publicar)
**Mode**: Strict TDD
**Naturaleza**: RE-VERIFICACION tras remediacion del verify-report.md anterior (commit aadcef5,
verdict FAIL, 2 CRITICAL). Verificacion COMPLETA de unidades A+B, no solo del delta de la remediacion.

### Completeness

| Metrica | Valor |
|---|---|
| Tareas totales (recuento en tasks.md) | 51 (Unidad A: 31, Unidad B: 20) |
| Tareas completas | 51 |
| Tareas incompletas | 0 |
| Comprobaciones de persona (fuera del recuento, regla del ciclo 1) | 2 -- (a) zona horaria en contenedor real, dueno consola EasyPanel; (b) operandos de bodegaje fuera de formato, dueno acceso a produccion. Ninguna la da por hecha este informe, ninguna cuenta como tarea pendiente |

Las 51 casillas de openspec/changes/fechas-derivadas-servidor/tasks.md siguen [x], recontadas con
grep -c "^- [x]" (51) y grep -n "^- [ ]" (0 resultados) contra el arbol actual, ademas de lectura
directa del fichero. Sin cambio respecto al verify anterior.

Ningun fichero de codigo de produccion tiene diff desde el verify FAIL anterior:
git diff --stat aadcef5 HEAD -- apps/desk/server/services/ticketService.ts
apps/desk/server/services/valoresDeTransicion.ts packages/shared/src/fechasDerivadas.ts
resulta vacio (confirmado independientemente en esta sesion). El rango aadcef5..HEAD (5e8c843, 62140e4,
8d4f577, 2e94bf7, c907a32, ad927dc) toca solo 3 ficheros: apps/desk/server/services/valoresDeTransicion.test.ts
(+15), el delta specs/transitions-st/spec.md (+24), y apply-progress.md (+91/-4).
git diff --stat aadcef5 HEAD confirmado: 3 files changed, 126 insertions(+), 4 deletions(-).

---

### Build and Tests Execution -- reproducido en esta sesion (independiente, no reciclado del verify anterior)

**Build**: OK Passed
```
$ npm run build
> tsc -b && vite build
- 107 modules transformed
- built in 2.43s
exit 0
```

**Tests -- foco de la tanda (4 ficheros)**: OK 73 passed / 0 failed (antes 72; +1 por el caso 6 nuevo de RQ-TZ-12)
```
$ npx vitest run packages/shared/src/fechasDerivadas.test.ts packages/shared/src/bodegaje.test.ts apps/desk/server/services/valoresDeTransicion.test.ts apps/desk/src/lib/valoresTransicion.test.ts
fechasDerivadas.test.ts (23 tests)
bodegaje.test.ts (22 tests)
valoresTransicion.test.ts (16 tests)
valoresDeTransicion.test.ts (12 tests)
Test Files  4 passed (4)
     Tests  73 passed (73)
```

**Tests -- fichero remediado, aislado**: OK 12/12, incluido el caso nuevo
```
$ npx vitest run apps/desk/server/services/valoresDeTransicion.test.ts
valoresDeTransicion.test.ts (12 tests) 522ms
Test Files  1 passed (1)
     Tests  12 passed (12)
```
El caso 6 (RQ-TZ-12: recalcular ignora tambien lo que YA hubiera en la columna) precarga
fecha_remision_entrada = '2020-01-01' con UPDATE tickets antes de ejecutar ingreso_a_servicio
con fuente disponible (fecha = '2026-08-01'), y confirma que la columna termina en 2026-08-01, no en
el valor precargado. Es la evidencia de ejecucion que el hallazgo CRITICAL 2 del verify anterior exigia.

**Tests -- evidencia de posicion (3.8), aislada**: OK, ya en verde antes de esta remediacion
```
$ npx vitest run apps/desk/server/services/valoresDeTransicion.test.ts -t posicion
P-a - sin remision, fecha invalida Y derivado_a inexistente: SOLO el error de fecha
P-b - lo mismo, y ADEMAS sin Codigo Servicio: los dos errores, presencia antes que validez
```

**Tests -- soporte del requisito 3.8 (citas del delta), reejecutados**: OK
```
$ npx vitest run apps/desk/server/contratoErrores.test.ts apps/desk/server/remisiones.test.ts apps/desk/server/services/ticketService.test.ts
contratoErrores.test.ts (2 tests), remisiones.test.ts (55 tests), ticketService.test.ts (36 tests)
Test Files  3 passed (3)
     Tests  93 passed (93)
```

**Tests -- suite completa, en solitario**: OK 1223 passed / 0 failed / 2 skipped
```
$ npm test
Test Files  130 passed | 1 skipped (131)
     Tests  1223 passed | 2 skipped (1225)
Duration  82.12s
exit 0
```
(Antes de la remediacion: 1222; +1 por el caso 6 nuevo de valoresDeTransicion.test.ts. Corrida unica y
limpia en esta sesion, sin el fallo intermitente de hook.bordes.test.ts reportado en el verify anterior.)

**Typecheck**: OK exit 0 (tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit)

**Lint**: OK exit 0 -- 0 errors, 158 warnings, todos preexistentes en packages/zoho-sync
(@typescript-eslint/no-explicit-any). Mismo recuento que el verify anterior; ninguno en ficheros de
esta tanda ni en el fichero de test remediado.

**Citas (detector)**: OK exit 0
```
$ npx tsx apps/desk/server/citas/cli.ts --sha HEAD
comprobadas 2174, abreviadas rotas 11 (informativas, no bloquean, las mismas de siempre, ninguna
en ficheros de esta tanda), cabeceras R-1 invalidas 0, sin bloqueantes
```

---

### Spec Compliance Matrix

#### Domain: transitions-st (delta MODIFIED)

| Requirement | Scenario | Test / Evidencia | Resultado |
|---|---|---|---|
| RQ-TS-06 | La fecha derivada invalida sin fuente responde 422, detras de los obligatorios | valoresDeTransicion.test.ts caso 4 (it.each, 422 con el mensaje) + P-b (orden presencia-validez) -- reejecutado, verde | COMPLIANT |
| RQ-TS-06 | Tabla de 8 filas, orden A menor B menor C menor D | Lectura directa ticketService.ts:121,123,124-126,127-129,132,132,136-140,146-150 -- las 8 evidencias coinciden con la tabla del delta; sin diff desde el verify anterior | COMPLIANT (estatica, releida) |
| RQ-TS-08 | transitionExec.ts no cambia | git diff --stat aadcef5 HEAD -- apps/desk/server/transitionExec.ts resulta vacio (verificado en esta sesion) | COMPLIANT |
| 3.8 | La guarda equipo-cliente (C) gana a la unicidad de OV (D) | ticketService.test.ts:323 (N1) -- reejecutado, verde | COMPLIANT |
| 3.8 | Dentro de B, estado de origen precede al area | ticketService.test.ts:158 -- reejecutado, verde | COMPLIANT |
| 3.8 | Sujeto de la URL da 404; referencia del cuerpo da 422 | contratoErrores.test.ts:71,77 (N3/N4) -- reejecutado, verde | COMPLIANT |
| 3.8 | Alta de remision incumple el orden total (IV-12), registrado sin corregir | remisiones.test.ts:1081 (describe IV-12) -- reejecutado, verde; remision.ts sin diff | COMPLIANT |
| 3.8 (REMEDIADO, commit 5e8c843) | Fecha derivada sin fuente invalida es C, no altera la escalera, ni con una OV en D en la misma peticion | El delta enmienda el escenario (spec.md:221-243) a "garantia estructural documentada, no escenario con test de ejecucion pendiente", con cita verificada: transitions.ts:178-189 (habilitar_servicio, unica transicion que declara cfOrdenVenta, NO declara ninguna fecha derivada) y :190-191 (ingreso_a_servicio, unica que declara fechas derivadas junto a otros campos, NO declara cfOrdenVenta). Reverificado independientemente en esta sesion: grep de cfOrdenVenta( en transitions.ts da una sola ocurrencia, linea 189; lectura directa de :178-191 confirma el contenido exacto citado. El GIVEN (fecha invalida + OV duplicada, misma peticion) sigue sin ser alcanzable con las 34 transiciones reales. La garantia queda sostenida por P-a/P-b (valoresDeTransicion.test.ts, reejecutados en verde), que fijan por mutacion que :130-132 (C) precede incondicionalmente a :146-150 (D). El texto incluye una nota de reapertura explicita si una transicion futura combina ambos campos | COMPLIANT-STRUCTURAL (ver WARNING en Issues Found; resuelto por enmienda de spec coherente con el codigo citado, no por test de ejecucion directo del GIVEN exacto) |

#### Domain: trazas (delta MODIFIED + ADDED)

| Requirement | Scenario | Test / Evidencia | Resultado |
|---|---|---|---|
| RQ-TZ-03 | El historial guarda el derivado, no lo que mando el navegador | valoresDeTransicion.test.ts casos 1a/1b (D-1) -- reejecutado, verde | COMPLIANT |
| RQ-TZ-03 | Una fecha derivada fuera de su transicion no llega al historial | valoresDeTransicion.test.ts caso 5 (P-2) -- reejecutado, verde | COMPLIANT |
| RQ-TZ-11 | El servidor impone la fecha derivada aunque el navegador no la mande | valoresDeTransicion.test.ts caso 3 -- reejecutado, verde | COMPLIANT |
| RQ-TZ-12 | Con fuente, el derivado gana aunque el navegador mande otro | valoresDeTransicion.test.ts casos 1a/1b -- reejecutado, verde | COMPLIANT |
| RQ-TZ-12 | Fecha Remision Entrada es la entrada vigente mas reciente | valoresDeTransicion.test.ts caso 2 -- reejecutado, verde | COMPLIANT |
| RQ-TZ-12 | El instante se reduce al dia de zona de negocio, no UTC | valoresDeTransicion.test.ts casos 1a/1b + fechasDerivadas.test.ts bloques zona -- reejecutado, verde | COMPLIANT |
| RQ-TZ-12 | Con fuente, pasa aunque el navegador no mande el campo | valoresDeTransicion.test.ts caso 3 -- reejecutado, verde | COMPLIANT |
| RQ-TZ-12 (REMEDIADO, commit 62140e4) | Recalcular ignora tambien lo que YA hubiera en la columna | Caso runtime nuevo valoresDeTransicion.test.ts caso 6: precarga fecha_remision_entrada = 2020-01-01 via UPDATE, ejecuta ingreso_a_servicio con fuente disponible (remision 2026-08-01), confirma columna final igual a 2026-08-01. Ejecutado en esta sesion, en solitario y dentro de la suite acotada: 12/12 verde. Es exactamente la evidencia de ejecucion que el hallazgo CRITICAL 2 del verify anterior pedia: test que precarga la columna y comprueba que el derivado la pisa | COMPLIANT |
| RQ-TZ-12 | Sin fuente, tecleado valido pasa / invalido da 422 | valoresDeTransicion.test.ts caso 4 -- reejecutado, verde | COMPLIANT |
| RQ-TZ-12 | Fecha derivada fuera de su transicion no llega al historial | valoresDeTransicion.test.ts caso 5 (mismo que RQ-TZ-03) -- reejecutado, verde | COMPLIANT |
| RQ-TZ-13 | Una YYYY-MM-DD nunca se desplaza de dia | fechasDerivadas.test.ts caso 1 -- reejecutado, verde | COMPLIANT |
| RQ-TZ-13 | Un instante se reduce al dia de zona de negocio | fechasDerivadas.test.ts caso 3 + bloques zona -- reejecutado, verde | COMPLIANT |
| RQ-TZ-13 | Fecha-hora sin desplazamiento da null | fechasDerivadas.test.ts caso 4 -- reejecutado, verde | COMPLIANT |
| RQ-TZ-13 | dia() de bodegaje consume la misma nocion, YYYY-MM-DD no cambia | bodegaje.test.ts caso 2026-02-09 + resto del fichero -- reejecutado, verde | COMPLIANT |

**Compliance summary**: 20/21 escenarios COMPLIANT con test de ejecucion cubriendo exactamente el
GIVEN/WHEN/THEN (todos reejecutados de forma independiente en esta sesion, no reciclados del informe
anterior). 1/21 (3.8, "fecha derivada sin fuente invalida es C") COMPLIANT-STRUCTURAL: resuelto por
enmienda de spec verificada coherente con el codigo citado (transitions.ts:178-191) y sostenida por
mutacion de posicion ya bajo prueba (P-a/P-b), pero sin un test de integracion que ejerza el GIVEN
exacto, porque ese GIVEN sigue sin ser alcanzable con datos reales, verificado independientemente.
0 escenarios CRITICAL/FAILING/UNTESTED sin evidencia alguna. Requisitos: 7/7 con toda su cobertura
resuelta (RQ-TZ-12 paso de PARTIAL a COMPLIANT integro; 3.8 paso de PARTIAL/CRITICAL a
COMPLIANT-STRUCTURAL con caveat documentado, ver Issues Found > WARNING).

---

### Correctness (Static Evidence) -- contratos de design.md

Sin cambio desde el verify anterior: ningun fichero de codigo de produccion tiene diff (git diff
--stat aadcef5 HEAD confirma que solo cambiaron el spec delta, un fichero de test y apply-progress.md).
Los contratos reverificados en esta sesion:

| Contrato | Estado | Nota |
|---|---|---|
| Section 3 -- 4 lineas exactas de ticketService.ts (:6,:7,:130,:132) | Implementado | Sin diff desde el verify anterior; texto literal identico al diseno |
| Section 4.1 -- fechasDerivadas.ts (firmas, ZONA_NEGOCIO, FUENTE_DE_FECHA, diaEnZona, fechasDerivadas, fuentesQueNecesita, valoresEfectivos) | Implementado | Sin diff; 23/23 tests reejecutados verdes |
| Section 4.2 -- valoresDeTransicion.ts (servidor) | Implementado | Sin diff; fuentesQueNecesita(t) vacio da 0 consultas (P-2) |
| Section 4.3 -- cliente valoresTransicion.ts | Implementado | Sin diff; 16/16 tests reejecutados verdes |
| A-1/A-2 -- ticketService.ts sin mover linea | Cumplido | Confirmado, sin diff |
| A-7 -- Intl.DateTimeFormat construido una vez a nivel de modulo | Cumplido | Sin diff |
| A-8 -- demostracion de zona permanente con vi.stubEnv | Cumplido | vitest.config.ts sin diff en todo b3c089b..HEAD |
| A-9 -- bodegaje.ts en sitio | Cumplido | Sin diff; 22/22 tests reejecutados verdes |
| Section 6.5 -- tarea docker | Ejecutada (evidencia en apply-progress.md, no repetida en esta sesion; no forma parte del recuento de tareas del repositorio) | Sin cambio |

---

### Coherence (Design) -- decisiones clave

Sin cambio desde el verify anterior (cero diff de produccion). Reconfirmado por ausencia de diff, no
por nueva lectura completa de design.md:

| Decision | Seguida? | Notas |
|---|---|---|
| A-3 -- regla en shared, lectura en el servidor (regla invariable 13.1) | Si | Sin diff |
| A-4 -- 422 unico, fecha detras de obligatorios y delante de derivacion | Si | ticketService.ts:132 sin diff; P-a/P-b reejecutados verdes |
| A-5 -- diaEnZona rechaza fecha-hora sin desplazamiento y fecha irreal | Si | 5 ramas, fechasDerivadas.test.ts reejecutado verde |
| A-6 -- iso() normaliza created_time | Si | Sin diff |
| Section 9 -- regla de mutacion 3 | Si | Sin diff en apply-progress.md B.2; TransitionPanel.tsx sin diff |
| Invariantes de Section 7 (desplazamiento por fichero) | Si | transitionExec.ts, packages/zoho-sync/src/db/repo.ts, vitest.config.ts sin diff en todo b3c089b..HEAD |

---

### TDD Compliance

| Check | Resultado | Detalle |
|---|---|---|
| TDD Evidence reportada | Si | apply-progress.md trae ahora ademas la seccion "Remediacion del verdict FAIL" con la nota estricta sobre el caso 6: RED por AUSENCIA (el codigo ya era correcto, fechasDerivadas.ts/valoresDeTransicion.ts nunca leen las columnas derivadas), no por asercion fallida; documentado explicitamente como el ciclo que aplica a este escenario concreto |
| Todas las tareas con test | Si | Sin cambio |
| RED confirmado | Si | Caso 6: RED-por-ausencia documentado y coherente (11 casos antes, 12 despues, sin modificar codigo de produccion en el intervalo) |
| GREEN confirmado (pasan en ejecucion) | Si | 73/73 en la corrida acotada (esta sesion); 1223/1223 en la suite completa (esta sesion, corrida unica limpia) |
| Triangulacion adecuada | Si | executeTransition pasa de 11 a 12 casos: 5 criterios + P-a/P-b + zona + el caso 6 de recalculo sobre columna precargada |
| Safety Net para ficheros modificados | Si | Ningun fichero de produccion modificado en la remediacion; suite completa (130 ficheros) en verde |
| Mutaciones de posicion/contenido (regla de mutacion 1) | Si | Sin cambio; P-a/P-b siguen protegiendo la posicion de la guarda de fecha frente a la guarda de OV, reejecutados verdes en esta sesion |

**TDD Compliance**: 7/7 checks passed

---

### Test Layer Distribution

| Layer | Tests | Files | Tools |
|---|---|---|---|
| Unit | 39 | 2 (fechasDerivadas.test.ts, bodegaje.test.ts) | vitest, sin arnes |
| Integracion (pg-mem) | 12 (antes 11) | 1 (valoresDeTransicion.test.ts) | instalarArnes() / appHarness.ts |
| Unit (cliente, modulo puro) | 16 | 1 (valoresTransicion.test.ts) | vitest, sin arnes |
| E2E | 0 | 0 | no instalado |
| Total (foco de la tanda) | 73 (dentro de las 1223 de la suite) | 4 | |

---

### Assertion Quality

El caso 6 nuevo de valoresDeTransicion.test.ts auditado linea a linea: usa el mismo patron que los 11
casos preexistentes (arnes pg-mem real, sin mocks), precarga con un UPDATE directo contra la base de
pruebas (no una funcion auxiliar que pudiera enmascarar el efecto) y afirma un valor de columna
concreto via el mismo helper fechaColumna que usan los demas casos. Sin patrones vetados: sin
tautologias, sin toBeDefined() en solitario, sin acoplamiento a detalle de implementacion.

**Assertion quality**: All assertions verify real behavior

---

### Quality Metrics

**Linter**: No errors (0 en los ficheros de esta tanda; 158 warnings preexistentes en packages/zoho-sync, sin cambio)
**Type Checker**: No errors

---

### Issues Found

**CRITICAL**: None. Los 2 hallazgos CRITICAL del verify anterior (commit aadcef5) quedaron resueltos:

1. Requisito RQ-TZ-12, escenario "Recalcular siempre ignora tambien lo que ya hubiera en la columna":
   resuelto con evidencia de ejecucion (test nuevo, valoresDeTransicion.test.ts caso 6, 12/12 verde,
   reejecutado independientemente en esta sesion). Cumple el criterio explicito de la re-verificacion:
   "el hallazgo RQ-TZ-12 SI debe tener ahora un test que pase en runtime".
2. Requisito 3.8, escenario "La fecha derivada sin fuente invalida es escalon C": resuelto por enmienda
   del escenario de spec, verificada coherente con el codigo citado en esta sesion
   (transitions.ts:178-189 / :190-191, confirmado con grep y lectura directa: una sola declaracion de
   cfOrdenVenta en todo el fichero, en habilitar_servicio, que no declara fechas derivadas; e
   ingreso_a_servicio declara fechas derivadas sin declarar cfOrdenVenta). Cumple el criterio explicito
   de la re-verificacion: "el hallazgo 3.8 debe tener el escenario de spec enmendado y coherente con el
   codigo citado". No se reclasifica como CRITICAL de nuevo porque el propio texto del delta ya no
   reclama un escenario testeable en runtime; reclama, explicitamente, una garantia estructural
   documentada, con nota de reapertura si el codigo cambia.

**WARNING**:
1. specs/transitions-st/spec.md:221-243 -- el escenario "fecha derivada sin fuente invalida es escalon
   C" sigue sin un test de integracion que ejerza su GIVEN/WHEN/THEN literal (fecha invalida + OV
   duplicada, misma peticion). Esto no es un defecto funcional: el GIVEN esta verificado como no
   alcanzable con las 34 transiciones reales de transitions.ts, y la garantia subyacente (orden
   C-antes-de-D) esta bajo prueba de mutacion de posicion (P-a/P-b). Se deja como WARNING, no CRITICAL,
   porque la re-verificacion aplico el criterio que el propio encargo de remediacion fijo para este
   hallazgo (enmienda coherente, no test), y porque exigir un test de un GIVEN que no se puede construir
   con datos reales convertiria este hallazgo en un bloqueo permanente sin remediacion posible salvo
   cambiar codigo de produccion sin necesidad funcional. Accion de seguimiento, no bloqueante: si una
   transicion futura llega a declarar a la vez un campo de fecha derivada y cfOrdenVenta, este WARNING
   se reabre como CRITICAL hasta que se anada el caso de integracion; la propia nota del delta de spec
   ya lo advierte.

**SUGGESTION**:
1. Cobertura de lineas por fichero no se remidio en esta sesion (no cambio codigo de produccion desde
   el verify anterior, que ya la midio sobre el subconjunto de 4 ficheros de la tanda); si se necesita
   la cifra global exacta de ticketService.ts, correr npm run test:coverage completo por separado.
2. El fichero apps/desk/server/citas/hook.bordes.test.ts mostro el margen de 60s de RPC bajo carga de
   suite completa en el verify anterior (no reproducido en esta sesion, corrida unica limpia); sigue sin
   ser un defecto de esta tanda. Considerar, fuera de esta tanda, si ese margen necesita revision de
   infraestructura.

---

### Verdict

**PASS WITH WARNINGS**

Los siete requisitos de los dos deltas de spec estan implementados y coinciden linea a linea con el
codigo (sin diff de produccion desde el verify FAIL anterior); las 51 tareas de tasks.md estan
completas; la suite completa pasa limpia en solitario (1223/1223, exit 0, +1 test respecto al verify
anterior), typecheck y lint limpios (0 errores), build del cliente limpio, detector de citas exit 0. Los
2 hallazgos CRITICAL del verify anterior quedaron resueltos: RQ-TZ-12 con un test runtime nuevo que
precarga la columna y comprueba que el derivado la pisa (evidencia de ejecucion exigida, entregada); 3.8
con el escenario de spec enmendado a garantia estructural documentada, verificada coherente con el
codigo citado en esta sesion de forma independiente. Queda 1 WARNING no bloqueante: el escenario 3.8
remediado sigue sin un test de integracion que ejerza su GIVEN literal, porque ese GIVEN no es
alcanzable con las 34 transiciones reales; riesgo funcional bajo, con condicion de reapertura ya
escrita en el propio delta de spec. No hay ningun comportamiento observado incorrecto ni codigo de
produccion sin cubrir. Recomendacion: sdd-archive puede proceder; el WARNING queda registrado para
seguimiento si el catalogo de transiciones cambia.
