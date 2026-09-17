```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:9694e61c26e7657d42c105b671bfca96fecb01f1451fd2f9a23a1161f912d9ab
verdict: pass
blockers: 0
critical_findings: 0
requirements: 2/2
scenarios: 4/4
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:5710ea5b1c9648e0eb3868f5753778535fd328e0d9022a9297a64514ca08d129
build_command: npm run typecheck
build_exit_code: 0
build_output_hash: sha256:f9de8b15b07069fcbf31f4a415061f4b90d66551059b5518c6d53e721545e547
```

## Verification Report

**Change**: tercera-puerta-orden-venta (IV-4)
**Version**: R1 `79cf09b` + R2 `f367186` + R3 `f2a3555` (HEAD de `main`, sin empujar; `origin/main` sigue en `f9c85de`)
**Mode**: Strict TDD
**Segunda pasada.** El `sdd-verify` de `f9c85de` salio `fail` con 1 CRITICAL (escenario 3 de RQ-RE-16 sin prueba). Este informe reemplaza al anterior por completo y verifica R3 (`f2a3555`) con evidencia propia, no por transcripcion del `apply`.

### Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 28 |
| Tasks complete | 28 |
| Tasks incomplete | 0 |

Confirmado por conteo directo: `grep -c "^- \[x\]" tasks.md` -> 28; `grep -cE "^- \[[x ]\]" tasks.md` -> 28 (mismo total, 0 sin marcar).

### Build & Tests Execution

**Build**: Passed
```text
npm run typecheck  (tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit)
exit 0, sin salida (solo el banner de npm)
```

**Tests**: 1132 passed / 0 failed / 2 skipped
```text
npm test
Test Files  121 passed | 1 skipped (122)
Tests  1132 passed | 2 skipped (1134)
exit 0
```

**Coverage**: No disponible (el runner de este repositorio no tiene herramienta de cobertura configurada; no es un fallo, es lo que hay)

### Spec Compliance Matrix

| Requirement | Scenario | Test | Result |
|---|---|---|---|
| RQ-RE-16 | Una orden ya asociada a otro ticket se rechaza antes de escribir nada | `ordenVentaUnTicket.test.ts` puerta 3 (linea 155) - it "rechaza con 409 una orden de venta que ya esta en otro ticket" (161-176) | COMPLIANT |
| RQ-RE-16 | El 422 del serial gana al 409 nuevo | `remisiones.test.ts` describe IV-4 el 422 del serial gana al 409 nuevo de la OV (1028) - it "ticket destino sin serial y con una OV ya usada por otro: 422 falta el serial, no 409" (1029-1053) | COMPLIANT |
| RQ-RE-16 | Reenviar la misma orden al propio ticket no se rechaza a si mismo | `ordenVentaUnTicket.test.ts` puerta 3 - it "reenviar la misma orden al propio ticket no se rechaza a si mismo: 201 y el UPDATE es no-op" (185-205) - NUEVA, anadida en R3 (tarea 3.1) | COMPLIANT - cierra el CRITICAL de f9c85de |
| tickets-core 4.2 | La cardinalidad OV-ticket, resuelta en la misma direccion en las dos specs | Sin cambio de texto; escenario narrativo sobre una decision de Gerencia. Cubierto conjuntamente por las tres puertas: puerta 1 (117-133), puerta 2 (135-153) y puerta 3 (155-206, ver filas de arriba) | COMPLIANT |

**Compliance summary**: 4/4 scenarios compliant (antes 3/4; el escenario 3 pasa de UNTESTED a COMPLIANT con la prueba nueva de R3).

### Correctness (Static Evidence)

| Requirement | Status | Notes |
|---|---|---|
| RQ-RE-16 | Implemented | `remision.ts:230-234` guarda por las dos vias (salesorderId: ov.id, numero: ov.number), propio ticket excluido (ticketId como tercer argumento), despues del 422 de :220 y antes del UPDATE de :235-239. Sin diff neto desde f9c85de |
| tickets-core 4.2 | Implemented | Narrativa corregida en el delta; codigo sin cambios en esta tanda porque las puertas 1 y 2 ya existian (ticketService.ts:45-49, :132-136) |

### Coherence (Design)

| Decision | Followed? | Notes |
|---|---|---|
| D1 - fusionar :141-159 en el ex-it.fails | Si | El bloque :141-159 no existe; el describe de la puerta 3 lo sustituye |
| D2 - posicion de la guarda dentro del bloque OV | Si | Verificado linea a linea (seccion 2 del detalle) |
| D3 - forma de la llamada y de la respuesta 409 | Si | ov.id/ov.number/ticketId, res.status(409).json(); return, sin HttpError (0 coincidencias en remision.ts) |
| D4 - prueba de posicion al final de remisiones.test.ts | Si | remisiones.test.ts:1028-1053, pegada a M5 |
| Escenario 3 de RQ-RE-16 (remediacion R3) | Si | Prueba nueva sin RED clasico (guarda ya construida en R1); verificada por MUTACION M-c en vez de RED, desviacion declarada y correcta bajo la regla de mutacion 1 de CLAUDE.md |
| Citas re-ancladas por Caso A/B/C (regla de mutacion 4) | Con matiz, heredado de R1/R2 | Sin cambios en R3 (diff del fichero es puramente aditivo, lineas 1-174 identicas a f9c85de); matiz ya documentado en el verify de f9c85de y no reabierto aqui |

### Issues Found

**CRITICAL**: Ninguno.

**WARNING**: Ninguno.

**SUGGESTION**: Ninguna.

### Verdict

**PASS**

El unico CRITICAL del verify anterior (f9c85de) - el escenario 3 de RQ-RE-16 sin prueba de cobertura - esta cerrado: ordenVentaUnTicket.test.ts:185-205 lo ejercita con aserciones de valor reales (201, sin 409, y comparacion campo a campo antes/despues con toEqual, no solo conteo de filas). remision.ts no tiene diff neto desde el veredicto anterior. npm test en 1132/1132 verdes, typecheck limpio, detector de citas en 0 bloqueantes con linea base en cero, y el cierre de IV-4/registro de IV-11 verificados linea a linea contra el arbol de hoy, no por transcripcion del apply. El detalle completo, criterio a criterio, sigue debajo.

---

## Detalle extendido - criterio a criterio, evidencia propia

**Fecha:** 2026-09-16 - **Arbol verificado:** `f2a3555`
**Metodo:** evidencia propia leida del arbol de hoy. Cada veredicto lleva el comando que lo sostiene o la cita ruta:linea que lo demuestra. Lo que no se pudo reproducir sin abrir otro intento del ledger va marcado como LIMITE, no como aprobado.

### 1. El CRITICAL, cerrado de verdad

`ordenVentaUnTicket.test.ts:185-205` (nuevo en R3, +29 lineas, diff puramente aditivo confirmado con `git diff f9c85de f2a3555 -- apps/desk/server/ordenVentaUnTicket.test.ts`):

- Inserta un ticket t-propia (7003) cuya orden_venta/salesorder_id YA son la orden que llega (OV-2026-300/soX).
- Envia POST /api/remisiones con ese mismo salesOrderId al propio ticket.
- Afirma res.status a 201 y res.body.error indefinido.
- La asercion de no-op compara VALORES, no solo el numero de filas: lee orden_venta, salesorder_id, fecha_orden_venta antes y despues del POST, y hace expect(despues).toEqual(antes), con el comentario propio de la prueba diciendolo por escrito (linea 204: "no-op: mismos valores antes y despues, no solo el mismo numero de filas"). Responde exactamente a la pregunta del encargo: compara los tres valores, no cuenta filas.

Este escenario era exactamente el declarado con SHALL en specs/remisiones/spec.md:74-80 y que el verify de f9c85de marco UNTESTED. Hoy tiene cobertura real de ejecucion (pasa dentro de los 1132 tests verdes).

### 2. Los cuatro escenarios de los dos deltas, uno a uno

Ver "Spec Compliance Matrix" arriba. El envelope del verify anterior decia scenarios: 3/4; el de hoy es 4/4: el unico cambio es el escenario 3 de RQ-RE-16, que pasa de UNTESTED a COMPLIANT con la prueba nueva de la seccion 1. Los otros tres escenarios no cambiaron de cobertura respecto al verify anterior, y se comprobo de nuevo con lectura directa de cada fichero de prueba citado (no por transcripcion):

- Escenario 1 - ordenVentaUnTicket.test.ts:161-176, sin cambios desde f9c85de (fuera del rango que R3 toco).
- Escenario 2 - remisiones.test.ts:1028-1053, sin cambios desde f9c85de (R3 no toco este fichero: no aparece en el --stat de la seccion 3, es decir, diff vacio).
- Escenario tickets-core 4.2 - cubierto por las tres puertas conjuntamente, sin cambio de texto en el propio escenario (asi lo declara el delta de tickets-core, lineas 15-20).

### 3. La guarda sigue donde estaba

`git diff f9c85de f2a3555 -- apps/desk/server/routes/remision.ts` -> salida vacia, exit 0. R3 no toco este fichero, tal como exigia su alcance. Confirmado tambien por lectura directa de remision.ts:140-240: el 422 del serial esta en :154-157, la remision pendiente en :174-183, el checklist en :191-197, y el bloque de la orden de venta en :218-240 con la guarda en :230-234 (despues del 422 de :220, antes del UPDATE de :235-239), por las dos vias (ov.id, ov.number) y con ticketId como tercer argumento de exclusion.

`git diff --stat f9c85de f2a3555` completo, para que quede constancia de que SI cambio R3:
```text
 apps/desk/server/ordenVentaUnTicket.test.ts        | 29 +++++++
 .../tercera-puerta-orden-venta/apply-progress.md   | 91 +++++++++++++++++++++-
 .../specs/remisiones/spec.md                       |  2 +-
 .../changes/tercera-puerta-orden-venta/tasks.md    | 46 +++++++++++
 .../tercera-puerta-orden-venta/verify-report.md    |  2 +-
 5 files changed, 164 insertions(+), 6 deletions(-)
```
Ni remision.ts ni remisiones.test.ts aparecen: confirma por si solo que R3 no toco codigo de produccion ni las pruebas de los escenarios 1 y 2.

### 4. La mutacion M-c

LIMITE declarado, no reproducido en esta fase. El apply (obs. 660) registra el literal "AssertionError: expected 409 to be 201" al quitar el tercer argumento (ticketId) de la llamada a ticketConOrdenVenta en remision.ts:230, y su reversion limpia (git diff --exit-code sin salida, confirmado tambien por esta fase en la seccion 3). Reproducirlo exigiria abrir otro intento del ledger sobre el mismo arbol (regla del ciclo 2 de CLAUDE.md), fuera del mandato de esta fase.

Lo que si se comprobo sin mutar, por lectura de packages/zoho-sync/src/db/repo.ts:328-344 (ticketConOrdenVenta): sin excluirTicketId, la clausula AND id <> $N no se anade a la consulta, asi que el SELECT encontraria al propio t-propia como "el ticket que ya tiene la orden" (coincide por salesorder_id y por orden_venta) y remision.ts responderia 409 contra si mismo. Esto corrobora por lectura de codigo, no por ejecucion, que la mutacion descrita produciria el rojo declarado.

La asercion de la prueba nueva SI distingue de verdad 201 de 409 (dos ramas de codigo distintas en remision.ts:231-239, una devuelve y corta con return, la otra sigue al UPDATE) y su asercion de no-op FALLARIA si el UPDATE escribiera algo distinto a los valores ya presentes - esta protegida por el WHERE COALESCE(orden_venta,'') = '' de :237, que es justamente lo que el propio escenario 3 del delta declara (linea 79, ya corregida a :237 por la tarea 3.3).

### 5. Detector sobre la punta - CONDICION DURA

```text
node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha f2a3555
comprobadas ............ 1962
linea base ............. 0 informadas . 0 caducadas
abreviadas rotas ....... 12   (informativas: no bloquean)
codigo de salida ....... 0
```

CUMPLE exactamente la condicion dura del encargo: 0 bloqueantes, codigo de salida 0, linea base en cero. Las 12 abreviadas rotas son las mismas informativas ya conocidas de R2 (sin cambio); son informativas y no bloquean, segun el propio detector.

### 6. Criterios de aceptacion de proposal.md 13, uno a uno

| # | Criterio | Veredicto | Evidencia propia |
|---|---|---|---|
| 1 | .fails de :161 quitado y visto rojo por "expected 201 to be 409" | LIMITE, no reproducible sin mutar | Confirmado que no queda ningun it.fails( activo: grep de .fails solo encuentra menciones en prosa/comentarios (lineas 59-86), ninguna como llamada real. El rojo original no se reprodujo (exigiria abrir otro intento del ledger); el registro vive en apply-progress.md (tabla R1, fila 1.1) |
| 2 | Prueba de :141-159 invertida, afirma 409 | CUMPLE | Ese bloque no existe. ordenVentaUnTicket.test.ts:161-176 afirma res.status a 409 (linea 172). Verde en los 1132 tests pasados |
| 3 | Guarda llama a ticketConOrdenVenta por las dos vias, propio ticket excluido, despues del 422 de :220 y antes del UPDATE | CUMPLE | remision.ts:230 llama ticketConOrdenVenta(db, { salesorderId: ov.id, numero: ov.number }, ticketId). :220 es el 422, :230-234 la guarda, :235-239 el UPDATE. Sin diff neto desde f9c85de |
| 4 | 409 con res.status(409).json(...); return, texto de ticketService.ts:135 | CUMPLE | remision.ts:232-233, mismo patron y texto (La orden de venta X ya esta asociada al ticket #N) que ticketService.ts:135. HttpError no aparece en remision.ts (0 coincidencias) |
| 5 | WHERE COALESCE(orden_venta,'') = '' intacto | CUMPLE | remision.ts:237, sin cambios de comportamiento |
| 6 | Prueba de posicion existe, afirma 422 "Falta el serial" (no 409), tres columnas sin escribir | CUMPLE | remisiones.test.ts:1029-1053. Afirma status 422, error que casa /serial/i, tres columnas en null, ticket dueno unico (toEqual([7010])). Verde |
| 7 | Cinco citas caducas re-ancladas como Caso B/A/C, sin tocar aserciones, ancla en la misma linea fisica | CUMPLE, heredado sin cambios | git diff f9c85de f2a3555 sobre ordenVentaUnTicket.test.ts muestra que las lineas 1-174 (donde viven las cinco citas) son byte-identicas a f9c85de; R3 solo anadio al final. El matiz ya documentado en el verify de f9c85de (3xA + 2xC en vez de 5xB) no se reabre porque nada lo toco |
| 8 | npm test verde y npm run typecheck sin errores | CUMPLE | Ver Build & Tests Execution arriba: 1132/1132, exit 0; typecheck exit 0 |
| 9 | CLAUDE.md/config.yaml registran IV-11 y el recuento concuerda con la tabla | CUMPLE | Ver seccion 7 abajo |

### 7. IV-4 cerrado e IV-11 vivo

IV-4, en CLAUDE.md (leido directamente del fichero en disco, no de un resumen de sesion): encabezado (linea 255) dice "Cuatro desvios vivos"; la tabla de "Incumplimientos vivos" (lineas 275-280) tiene exactamente 4 filas de datos (valoresTransicion.ts, ticketService.ts:39 clientId, por-entregar-es-espera/IV-9, y la divergencia de sincronizacion/IV-11) y ninguna es IV-4; el parrafo (lineas 259-266) cuenta los DOS movimientos fechados (alta de IV-11 el 2026-09-16, baja de IV-4 en 79cf09b); y el parrafo dedicado (lineas 298-304) dice literalmente "IV-4 esta CERRADO y ya no cuenta", con la cita a remision.ts:218-240, RQ-RE-16 y las dos pruebas que lo fijan. Cumple los cuatro sub-puntos.

IV-4, en openspec/config.yaml (bloque id: IV-4, lineas 444-508): tiene estado: CERRADO, cerrado_por: tercera-puerta-orden-venta, cerrado_verificado_en: 2026-09-16 base 79cf09b, y por_que_esta_cerrado apuntando a RQ-RE-16. ubicacion (linea 446) esta actualizado a :218-240, el rango real de hoy. Los campos destino/matiz_de_verificacion conservan texto historico (CONSTRUIBLE...) que la tarea 2.7 no pedia tocar - no es una tarea incumplida, es el mismo patron de preservar el registro historico que usan los bloques id: IV-5/id: IV-6 ya cerrados.

IV-11, vivo: CLAUDE.md linea 280 (fila de "Incumplimientos vivos") y openspec/config.yaml bloque id: IV-11 (lineas 930 en adelante): sin estado: CERRADO, destino: "SIN DESTINO ASIGNADO - a proposito", y la advertencia de poblacion 1 presente palabra por palabra: "CON POBLACION 1, UN 0 NO DICE QUE NO OCURRA". Cumple.

Nota de metodo, fuera del alcance de esta verificacion pero digna de registro: el CLAUDE.md inyectado en el contexto inicial de esta sesion (bloque "Contents of ... CLAUDE.md") mostraba la fila de IV-4 todavia abierta ("CONSTRUIBLE desde el 2026-09-10..."), contradiciendo lo que el apply declaraba cerrado. La lectura directa del fichero en disco confirma que el archivo SI tiene a IV-4 cerrado y coincide con apply-progress. Es decir: el snapshot inyectado en el prompt de esta sesion estaba desactualizado respecto al arbol de trabajo real; esta verificacion se sostiene en la lectura directa del fichero, no en ese snapshot, tal como exige la regla de metodo de CLAUDE.md ("toda afirmacion sobre el comportamiento del codigo lleva ruta y linea... una cita de segunda mano es una hipotesis").

### 8. Las 28 casillas

tasks.md: grep -c de lineas marcadas [x] da 28, y el total de lineas de tarea (marcadas o no) tambien da 28 (0 sin marcar). La seccion "Rebanada R3" (lineas 285-297) dice por escrito, sin adornos: "El hueco NO es de la ejecucion, es del plan... Ninguna planifico una prueba para el escenario 3, asi que el apply no se la salto: nunca se la pidieron." Esto coincide con la evidencia de codigo: remision.ts no tiene diff neto desde f9c85de (seccion 3), lo que confirma que la guarda ya estaba completa y solo faltaba la prueba.

## Divergencias entre el verify y el registro del apply

Ninguna. Se contrasto cada afirmacion de apply-progress.md (obs. 660) contra el arbol de hoy:

- El diff declarado (5 files, +164/-6 vs f9c85de) coincide exactamente con git diff --stat (seccion 3).
- La reversion de la mutacion M-c (git diff --exit-code limpio sobre remision.ts) se confirmo de forma independiente con git diff f9c85de f2a3555 -- apps/desk/server/routes/remision.ts -> vacio.
- La correccion de la cita specs/remisiones/spec.md linea 79 (de :223 a :237) se confirmo por diff exacto de una sola linea (seccion 3, diff mostrado en el detalle del punto 1 de este informe).
- La reparacion del propio verify-report.md linea 107 (anclar a "en f9c85de" en vez de renumerar) se confirmo por diff exacto: solo esas cuatro palabras cambiaron, el veredicto CUMPLE y el resto de la evidencia de esa fila son byte-identicos entre f9c85de y f2a3555.
- El detector final (1962 comprobadas, 0 bloqueantes, codigo 0, 12 abreviadas rotas informativas, linea base en cero) coincide con lo que apply-progress declara.
- npm test (1132/1132) y typecheck (exit 0) coinciden con lo declarado.

No se encontro ninguna afirmacion del apply que esta verificacion no pudiera sostener con evidencia propia.

## Limites de esta verificacion

1. No se reprodujo el rojo original de la tarea 1.1 ni las mutaciones M-a/M-b/M-c sin abrir otro intento del ledger - fuera del mandato de esta fase (regla del ciclo 2 de CLAUDE.md: una tanda SDD por arbol de trabajo). Para M-c se corroboro por lectura de codigo que la mutacion descrita produciria el rojo declarado (seccion 4).
2. No se re-audito cita a cita el barrido completo de las poblaciones A (34) y B (26) de design.md 8.3/8.4: ese barrido no cambio entre f9c85de y f2a3555 (R3 es aditivo puro sobre ordenVentaUnTicket.test.ts y de una sola linea sobre specs/remisiones/spec.md), y ya fue verificado por muestreo dirigido en el verify anterior sin encontrar divergencias.
3. sdd-archive no se ejecuto ni se preparo, conforme al alcance de esta fase. La seccion 5.1 de openspec/specs/remisiones/spec.md (viva) sigue describiendo el defecto ya cerrado como "DECIDIDA, y se construye" - es deuda declarada, no un hallazgo nuevo, y solo se resuelve al fundirse el delta.
4. El caso (c), la guarda equipo-cliente (IV-8) y las puertas 1 y 2 quedan fuera de alcance, tal como fija el encargo.
5. npm run lint se corrio como verificacion adicional (no exigida por 13 de proposal.md): exit 0, 158 warnings preexistentes de no-explicit-any, ninguno en los ficheros tocados por esta tanda.
6. f2a3555 (HEAD verificado) no esta empujado a origin/main al momento de este informe; el push queda a cargo de una persona, segun el encargo.

---

## TDD Compliance (Strict TDD)

| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | Si | apply-progress.md tiene tabla "TDD Cycle Evidence (R3)" (lineas 244-250) |
| All tasks have tests | Si | 3.1 tiene prueba propia; 3.2 es verificacion por mutacion (sin fichero de prueba nuevo, por diseno); 3.3 es correccion documental (cita en spec.md, sin codigo) |
| RED confirmado (test existe) | Si | ordenVentaUnTicket.test.ts:185-205 existe y se ejecuta dentro de la suite |
| GREEN confirmado (test pasa) | Si | 1132/1132 verdes hoy, exit 0 |
| Triangulacion adecuada | Escenario unico | RQ-RE-16 solo declara un escenario para el reenvio a si mismo; un solo it es proporcional |
| Safety Net de ficheros modificados | Si | Unico fichero de prueba tocado por R3: ordenVentaUnTicket.test.ts, apendice puro (+29/-0); el resto de la suite (1131 tests previos) sirvio de red de seguridad y siguio verde |

Desviacion declarada, no penalizada: la tarea 3.1 no sigue el ciclo clasico RED-GREEN porque la guarda de produccion ya existia (construida en R1, remision.ts:230). apply-progress.md lo declara por escrito y sustituye el RED por la mutacion M-c (seccion 4 de este informe), que es exactamente lo que exige la regla de mutacion 1 de CLAUDE.md para probar una exclusion ya construida. No es una tarea saltada.

TDD Compliance: 6/6 checks pasan (1 con desviacion declarada y verificada, no un fallo)

---

### Test Layer Distribution

| Layer | Tests | Files | Tools |
|-------|-------|-------|-------|
| Unit | 0 | 0 | - |
| Integration | 3 (las tres puertas) | 2 (ordenVentaUnTicket.test.ts, remisiones.test.ts) | vitest + supertest + Postgres de pruebas |
| E2E | 0 | 0 | no instalado |
| Total (ficheros tocados por el cambio) | 3 | 2 | |

Distribucion informativa (nivel SUGGESTION, sin impacto en el veredicto): las tres pruebas que cubren RQ-RE-16 son de integracion real contra HTTP + base de datos, no unitarias con mocks - apropiado para una guarda de backend que depende de una consulta SQL.

---

### Changed File Coverage

Coverage analysis skipped - no coverage tool detected (mismo estado que el verify anterior; no es un fallo, el runner de este repositorio no tiene herramienta configurada).

---

### Assertion Quality

Auditados ordenVentaUnTicket.test.ts completo (207 lineas) y las secciones de remisiones.test.ts citadas en este cambio (M5 lineas 990-1006, posicion lineas 1008-1053). Sin patrones vetados: sin tautologias, sin bucles fantasma, sin aserciones huerfanas de tipo sin acompanamiento de valor, sin acoplamiento a detalle de implementacion, sin exceso de mocks (0 vi.mock() en estos ficheros - son pruebas de integracion contra HTTP y base de datos reales). La prueba nueva de la seccion 1 combina asercion de estado (201), de ausencia de error, y de igualdad de valores completos antes/despues (toEqual), con comentario propio que declara por que compara valores y no solo conteo.

Assertion quality: Todas las aserciones verifican comportamiento real

---

### Quality Metrics

Linter: 0 errores (158 warnings preexistentes de no-explicit-any, ninguno en ficheros tocados por esta tanda)
Type Checker: 0 errores
