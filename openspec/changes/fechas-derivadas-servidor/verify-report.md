```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:d3a81b78c34165cd06cd54bdf1ebac1919b3ce14ee76b5554965534d89b29f13
verdict: fail
blockers: 0
critical_findings: 2
requirements: 5/7
scenarios: 19/21
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:651282ea58d651df0a47c998bc997f79d4528a8fa9f6aee4802a6bd22b97466c
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:94300f934c9b128f4eeaf2a7c70dfaab8041fa27a9b654dc7f7a3ef275aaa2d6
```

## Verification Report

**Change**: fechas-derivadas-servidor (F1A-07 · IV-2)
**Version**: worktree `f1a-07-r1`, HEAD `2f9d78c696caf4afaccb6af377a28bdde6956c42` (rama sin publicar)
**Mode**: Strict TDD

### Completeness

| Metrica | Valor |
|---|---|
| Tareas totales (recuento en `tasks.md`) | 51 (Unidad A: 31, Unidad B: 20) |
| Tareas completas | 51 |
| Tareas incompletas | 0 |
| Comprobaciones de persona (fuera del recuento, regla del ciclo 1) | 2 -- (a) zona horaria en contenedor real, dueno consola EasyPanel; (b) operandos de bodegaje fuera de formato, dueno acceso a produccion. Ninguna la da por hecha este informe, ninguna cuenta como tarea pendiente |

Las 51 casillas de `openspec/changes/fechas-derivadas-servidor/tasks.md` (Fases A.1-A.7 y B.1-B.7) estan
`[x]`, verificado leyendo el fichero completo linea a linea, no por conteo automatico. `A.7.6` y `B.7.5`
(los commits) tambien estan marcados, y coinciden con commits reales en el log
(`98cbda7` unidad A, `b4c3bcf`/`7e64c30`/`2f9d78c` unidad B).

---

### Build & Tests Execution -- reproducido en esta sesion

**Build**: OK Passed
```
$ npm run build
> tsc -b && vite build
- 107 modules transformed.
- built in 1.96s
exit 0
```

**Tests -- foco de la tanda (4 ficheros)**: OK 72 passed / 0 failed
```
$ npx vitest run packages/shared/src/fechasDerivadas.test.ts packages/shared/src/bodegaje.test.ts \
    apps/desk/server/services/valoresDeTransicion.test.ts apps/desk/src/lib/valoresTransicion.test.ts
fechasDerivadas.test.ts (23 tests)
bodegaje.test.ts (22 tests)
valoresTransicion.test.ts (16 tests)
valoresDeTransicion.test.ts (11 tests)
Test Files  4 passed (4)
     Tests  72 passed (72)
```

**Tests -- suite completa, en solitario**: OK 1222 passed / 0 failed / 2 skipped
```
$ npm test
Test Files  130 passed | 1 skipped (131)
     Tests  1222 passed | 2 skipped (1224)
Duration  89.84s
exit 0
```
Nota de reproducibilidad: una corrida previa de la suite completa dio `1 failed` en
`apps/desk/server/citas/hook.bordes.test.ts` con `Error: [vitest-worker]: Timeout calling "onTaskUpdate"`
(60s de techo de RPC). Ese fichero **no pertenece** a esta tanda (no esta en la lista de ficheros a
inspeccionar ni lo toca ningun commit del rango `b3c089b..2f9d78c`). Ejecutado en aislamiento
(`npx vitest run apps/desk/server/citas/hook.bordes.test.ts`), pasa limpio: `9 passed (9)`, 27.4s --
coincide con la nota que el propio `apply-progress.md` ya deja para el cierre de la unidad B (\`repetida
en solitario, limpia\`). Se repitio `npm test` una segunda vez, en solitario, y dio limpio: el resultado
reportado en el YAML de cabecera (`test_output_hash`) es el de esa segunda corrida limpia.

**Typecheck**: OK exit 0 (`tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit`)

**Lint**: OK exit 0 -- 0 errors, 158 warnings, los 158 preexistentes en `packages/zoho-sync` (todos
`@typescript-eslint/no-explicit-any`). **Ninguno** en los ficheros de esta tanda, comprobado con
`npm run lint 2>&1 | grep -iE "fechasDerivadas|valoresDeTransicion|valoresTransicion|bodegaje\.ts|ticketService\.ts"`
-> sin salida.

**Coverage** (`npx vitest run --coverage` acotado a los 4 ficheros de foco -- no representa el global,
que necesita la suite completa): `fechasDerivadas.ts` 100% lineas / 96.07% ramas - `valoresDeTransicion.ts`
(servidor) 100/100/100 - `valoresTransicion.ts` (cliente) 100% lineas / 83.33% ramas - `bodegaje.ts` 97.43%
lineas (unica linea sin cubrir, `:235`, es `transicionesQueEscriben`, funcion preexistente que esta tanda
no toca). `ticketService.ts` sale bajo (38%) en esta corrida acotada porque su cobertura real viene de
`ticketService.test.ts`/`contratoErrores.test.ts`, fuera de este subconjunto -- no es una medida fiable de
ese fichero. Informativo, no bloqueante: no se corrio `--coverage` sobre la suite completa por tiempo.

---

### Spec Compliance Matrix

#### Domain: `transitions-st` (delta MODIFIED)

| Requirement | Scenario | Test / Evidencia | Resultado |
|---|---|---|---|
| RQ-TS-06 (orden de guardas, fila 6 nueva) | La fecha derivada invalida sin fuente responde 422, detras de los obligatorios | `valoresDeTransicion.test.ts` caso 4 (it.each, 422 con el mensaje) + P-b (orden presencia->validez) | COMPLIANT |
| RQ-TS-06 | Tabla de 8 filas, orden A<B<C<D | Lectura directa `ticketService.ts:121,123,124-126,127-129,132,132,136-140,146-150` -- las 8 evidencias coinciden exactamente con la tabla del delta | COMPLIANT (estatica, confirmada linea a linea) |
| RQ-TS-08 (validacion de contenido fuera de `buildTransitionPlan`) | `transitionExec.ts` no cambia | `git diff --stat b3c089b 2f9d78c -- apps/desk/server/transitionExec.ts` -> vacio (verificado directamente, no solo por el informe de apply) | COMPLIANT |
| 3.8 (orden total de precedencia) | La guarda equipo<->cliente (C) gana a la unicidad de OV (D) | `ticketService.test.ts:323` (`N1`) -- preexistente, sigue en verde | COMPLIANT |
| 3.8 | Dentro de B, estado de origen precede al area | `ticketService.test.ts:158` -- preexistente, sigue en verde | COMPLIANT |
| 3.8 | Sujeto de la URL -> 404; referencia del cuerpo -> 422 | `apps/desk/server/contratoErrores.test.ts:71,77` (`N3`/`N4`) -- preexistente, sigue en verde | COMPLIANT |
| 3.8 | Alta de remision incumple el orden total (IV-12), registrado sin corregir | `apps/desk/server/remisiones.test.ts:1081` (describe `IV-12`) -- preexistente, sigue en verde; `remision.ts` sin diff en esta tanda (confirmado) | COMPLIANT |
| 3.8 | Fecha derivada sin fuente invalida es C, no altera la escalera, ni con una OV en D en la misma peticion | Ninguna prueba de integracion combina "fecha derivada invalida" + "OV ya asociada a otro ticket" en la misma llamada -- ninguna transicion real declara a la vez un campo de fecha derivada y el campo `orden_venta` (`habilitar_servicio`, la unica que toca OV, no declara ninguna de las tres fechas; verificado en `transitions.ts:178-186`), asi que el GIVEN del escenario no es alcanzable con datos reales. La garantia es posicional: `:130-132` (C, fecha) preceden incondicionalmente a `:146-150` (D, OV) en el cuerpo lineal de `executeTransition`, sin ninguna rama que pueda invertirlos, y esa MISMA posicion esta bajo guarda de mutacion (P-a/P-b, regla de mutacion 1) frente a la guarda de derivacion que si comparte linea | PARTIAL -- cierto por inspeccion y por la mutacion de posicion ya probada, pero sin un test de integracion que ejercite el GIVEN exacto (porque no hay transicion real que lo permita) |

#### Domain: `trazas` (delta MODIFIED + ADDED)

| Requirement | Scenario | Test / Evidencia | Resultado |
|---|---|---|---|
| RQ-TZ-03 | El historial guarda el derivado, no lo que mando el navegador | `valoresDeTransicion.test.ts` casos 1a/1b (D-1) | COMPLIANT |
| RQ-TZ-03 | Una fecha derivada fuera de su transicion no llega al historial | `valoresDeTransicion.test.ts` caso 5 (P-2) | COMPLIANT |
| RQ-TZ-11 | El servidor impone la fecha derivada aunque el navegador no la mande | `valoresDeTransicion.test.ts` caso 3 | COMPLIANT |
| RQ-TZ-12 | Con fuente, el derivado gana aunque el navegador mande otro | `valoresDeTransicion.test.ts` casos 1a/1b | COMPLIANT |
| RQ-TZ-12 | `Fecha Remision Entrada` = entrada vigente mas reciente | `valoresDeTransicion.test.ts` caso 2 | COMPLIANT |
| RQ-TZ-12 | El instante se reduce al dia de zona de negocio, no UTC | `valoresDeTransicion.test.ts` casos 1a/1b (`2026-09-10T00:30:00Z`->`2026-09-09`) + `fechasDerivadas.test.ts` bloques `zona` | COMPLIANT |
| RQ-TZ-12 | Con fuente, pasa aunque el navegador no mande el campo | `valoresDeTransicion.test.ts` caso 3 | COMPLIANT |
| RQ-TZ-12 | Recalcular ignora tambien lo que YA HUBIERA en la columna | Sin test dedicado. Los 11 casos de `valoresDeTransicion.test.ts` parten siempre de un ticket recien insertado con la columna derivada en `NULL`; ninguno pre-carga un valor en `fecha_creacion_ticket`/`fecha_remision_entrada`/`fecha_revision_informe` y vuelve a ejecutar una transicion que la declare para comprobar que se pisa. La garantia es de codigo: `valoresConFechasDerivadas`/`valoresEfectivos` (`fechasDerivadas.ts:108-134`, `valoresDeTransicion.ts:14-32`) no leen `current.row.fecha_creacion_ticket` ni las otras dos columnas en ningun punto -- solo `created_time`, remisiones y `instanteUltimaTransicion` -- asi que no existe ruta de codigo que devuelva el valor viejo de la columna | PARTIAL -- comportamiento correcto por construccion (sin lectura de la columna en el codigo), pero sin un test runtime que lo demuestre re-ejecutando sobre una columna ya poblada |
| RQ-TZ-12 | Sin fuente, tecleado valido pasa / invalido da 422 | `valoresDeTransicion.test.ts` caso 4 | COMPLIANT |
| RQ-TZ-12 | Fecha derivada fuera de su transicion no llega al historial | `valoresDeTransicion.test.ts` caso 5 (mismo que RQ-TZ-03) | COMPLIANT |
| RQ-TZ-13 | Una `YYYY-MM-DD` nunca se desplaza de dia | `fechasDerivadas.test.ts` caso 1 | COMPLIANT |
| RQ-TZ-13 | Un instante se reduce al dia de zona de negocio | `fechasDerivadas.test.ts` caso 3 + bloques `zona` | COMPLIANT |
| RQ-TZ-13 | Fecha-hora sin desplazamiento da `null` | `fechasDerivadas.test.ts` caso 4 | COMPLIANT |
| RQ-TZ-13 | `dia()` de bodegaje consume la misma nocion, `YYYY-MM-DD` no cambia | `bodegaje.test.ts:419-432` (no 21, campo `Fecha Orden De Venta: '2026-02-09'` pasado tal cual a `hasta`) + las pruebas preexistentes del fichero, todas en verde | COMPLIANT |

**Compliance summary**: 19/21 escenarios COMPLIANT con test de ejecucion cubriendo exactamente el
`GIVEN/WHEN/THEN`; 2/21 PARTIAL (correctos por inspeccion de codigo y por garantias estructurales ya
bajo prueba de mutacion, pero sin un test de integracion que ejercite el GIVEN exacto del escenario).
0 escenarios FAILING o UNTESTED sin evidencia alguna.

---

### Correctness (Static Evidence) -- contratos de `design.md`

| Contrato | Estado | Nota |
|---|---|---|
| Section 3 -- 4 lineas exactas de `ticketService.ts` (`:6`,`:7`,`:130`,`:132`) | Implementado | Texto literal identico al diseno, confirmado por lectura directa; `:131`/`:153` intactas |
| Section 4.1 -- `fechasDerivadas.ts` (firmas, `ZONA_NEGOCIO`, `FUENTE_DE_FECHA`, `diaEnZona`, `fechasDerivadas`, `fuentesQueNecesita`, `valoresEfectivos`) | Implementado | Firmas y comportamiento coinciden exactamente con el contrato; `diaEnZona` cubre las 5 ramas de A-5 |
| Section 4.2 -- `valoresDeTransicion.ts` (servidor) | Implementado | `fuentesQueNecesita(t)` vacio -> 0 consultas (P-2); lectura condicional de `createdAt`/`remisiones`/`escaladoARevisionAt` |
| Section 4.3 -- cliente `valoresTransicion.ts` | Implementado | `diaLocal` borrado, `valoresConocidos` consume `fechasDerivadas`; regla 13 punto 3 (espejo legitimo) sostenida por la imposicion probada del servidor |
| A-1/A-2 -- `ticketService.ts` sin mover linea, imports fundidos en `:6` | Cumplido | `wc -l` identico antes/despues (221->221), `+4/-4` |
| A-7 -- `Intl.DateTimeFormat` construido UNA vez a nivel de modulo | Cumplido | `fechasDerivadas.ts:46-48`, fuera de cualquier funcion |
| A-8 -- demostracion de zona permanente con `vi.stubEnv`, sin tocar `vitest.config.ts` | Cumplido | `git diff --stat` de `vitest.config.ts` vacio en todo el rango `b3c089b..2f9d78c` |
| A-9 -- `bodegaje.ts` en sitio, `:19` import, `:129-133` delega en `diaEnZona` | Cumplido | `wc -l` identico (236->236), `+4/-4` |
| Section 6.5 -- tarea docker (ICU completo en `node:22-alpine`) | Ejecutada (comprobacion de persona aparte para produccion) | Salida `2026-09-09`, registrada en `apply-progress.md`; docker no se re-ejecuto en esta verificacion (evidencia ya registrada y no forma parte del recuento de tareas del repositorio) |

---

### Coherence (Design) -- decisiones clave

| Decision | Seguida? | Notas |
|---|---|---|
| A-3 -- regla en `shared`, lectura en el servidor (regla invariable 13.1) | Si | `valoresDeTransicion.ts` solo lee fuentes; `valoresEfectivos`/`fechasDerivadas` (la regla) viven en `packages/shared` |
| A-4 -- 422 unico, fecha detras de obligatorios y delante de derivacion | Si | `ticketService.ts:132` (`[...plan.errors, ...erroresFecha]`) antes de `:136-140`; probado por P-a/P-b |
| A-5 -- `diaEnZona` rechaza fecha-hora sin desplazamiento y fecha irreal | Si | 5 ramas cubiertas en `fechasDerivadas.test.ts` |
| A-6 -- `iso()` normaliza `created_time` (`Date` vs `string`) | Si | `valoresDeTransicion.ts:25` |
| Section 9 -- regla de mutacion 3 (comodidad del cliente probada en servidor) | Si | Tabla transcrita en `apply-progress.md` B.2, releida contra el arbol final; `TransitionPanel.tsx:32-36`,`:174`,`:254` sin diff, coherentes con las citas |
| Invariantes de Section 7 (desplazamiento por fichero) | Si | `transitionExec.ts`, `packages/zoho-sync/src/db/repo.ts`, `vitest.config.ts` sin diff en todo el rango `b3c089b..2f9d78c` (verificado directamente); `ticketService.ts`/`bodegaje.ts` neto 0 |

---

### TDD Compliance

| Check | Resultado | Detalle |
|---|---|---|
| TDD Evidence reportada | Si | `apply-progress.md` trae tabla "TDD Cycle Evidence" para Unidad A (4 filas) y evidencia RED/GREEN narrada para Unidad B (B.1) |
| Todas las tareas con test | Si | Los 4 ficheros nuevos/tocados con test (`fechasDerivadas.ts`, `valoresDeTransicion.ts`, `bodegaje.ts`, `valoresTransicion.ts`) tienen su `.test.ts` correspondiente, confirmados por lectura directa |
| RED confirmado (ficheros existen) | Si | Los 4 ficheros de test existen en el arbol y sus casos coinciden con los descritos en `apply-progress.md` |
| GREEN confirmado (pasan en ejecucion) | Si | 72/72 en la corrida acotada; 1222/1222 en la suite completa (segunda corrida, limpia) |
| Triangulacion adecuada | Si | `diaEnZona` 5 ramas + zona; `valoresEfectivos` D-1/D-3/P-2/vacio/no-objeto (7 casos); `executeTransition` 5 criterios + P-a/P-b + zona (11 casos) |
| Safety Net para ficheros modificados | Si | `ticketService.ts`/`bodegaje.ts`/`valoresTransicion.ts` modificados con neto 0 de lineas; su suite completa (130 ficheros) pasa en verde |
| Mutaciones de posicion/contenido (regla de mutacion 1) | Si | 5 mutaciones (P-a, P-b, P-2, `diaEnZona` dia UTC, `diaEnZona` nocion vieja) confirmadas en rojo y revertidas -- `git status` limpio al cierre de esta verificacion, sin restos |

**TDD Compliance**: 7/7 checks passed

---

### Test Layer Distribution

| Layer | Tests | Files | Tools |
|---|---|---|---|
| Unit | 39 | 2 (`fechasDerivadas.test.ts`, `bodegaje.test.ts` caso nuevo) | vitest, sin arnes |
| Integracion (pg-mem) | 11 | 1 (`valoresDeTransicion.test.ts`) | `instalarArnes()`/`appHarness.ts` |
| Unit (cliente, modulo puro) | 16 | 1 (`valoresTransicion.test.ts`) | vitest, sin arnes -- `.tsx` excluido de la red por F0-00, este modulo SI esta en la red por ser `.ts` |
| E2E | 0 | 0 | no instalado en el repositorio |
| **Total (foco de la tanda)** | **72** (dentro de las 1222 de la suite) | **4** | |

---

### Assertion Quality

Auditados los 4 ficheros de test de la tanda completos, linea a linea. **Ningun patron vetado
encontrado**: sin tautologias, sin bucles vacios, sin aserciones sin llamada a codigo de produccion, sin
`toBeDefined()`/`not.toBeNull()` en solitario, sin acoplamiento a detalle de implementacion (clases CSS,
conteo de mocks). Cada `it` llama a una funcion de produccion real (`diaEnZona`, `fechasDerivadas`,
`valoresEfectivos`, `executeTransition` via HTTP simulado con `pg-mem`, `valoresConocidos`) y afirma un
valor concreto, no solo presencia. Proporcion mock/asercion: 0 mocks en los 4 ficheros -- `pg-mem` es un
arnes de base de datos real, no un mock de la funcion bajo prueba.

**Assertion quality**: All assertions verify real behavior

---

### Quality Metrics

**Linter**: No errors (0 en los ficheros de esta tanda; 158 warnings preexistentes en `packages/zoho-sync`)
**Type Checker**: No errors

---


### Issues Found

**CRITICAL**:
1. `openspec/specs/transitions-st` (delta) -- el escenario "La fecha derivada sin fuente invalida es
   escalon C, y no altera la escalera A-B-C-D" (bajo el requisito `3.8`) no tiene un test de integracion
   que ejercite el `GIVEN` exacto (fecha invalida + OV ya asociada, en la misma peticion). Per la regla
   dura del propio protocolo de verificacion, "a spec scenario is compliant only when a covering test
   passed at runtime" -- este no lo tiene, y se clasifica CRITICAL por ese criterio, aunque el riesgo
   real medido es bajo: ninguna transicion real declara a la vez un campo de fecha derivada y el campo
   de orden de venta (`habilitar_servicio` es la unica que toca OV y no declara ninguna de las tres
   fechas -- `packages/shared/src/transitions.ts:178-186`), asi que el `GIVEN` del escenario no es
   alcanzable con datos reales de las 34 transiciones existentes hoy. La garantia queda sostenida por
   inspeccion de codigo (orden lineal incondicional `ticketService.ts:130-132` antes de `:146-150`, sin
   ninguna rama que pueda invertirlos) y por la mutacion de posicion ya probada sobre esas mismas lineas
   (P-a/P-b, regla de mutacion 1). Remediacion sugerida: si en el futuro una transicion real llega a
   declarar ambos campos, anadir un caso a `valoresDeTransicion.test.ts` que los combine; hasta entonces,
   el escenario documenta una garantia estructural sin caso de prueba directo.
2. `openspec/changes/fechas-derivadas-servidor/specs/trazas/spec.md` -- el escenario "Recalcular siempre
   ignora tambien lo que ya hubiera en la columna" (bajo `RQ-TZ-12`) no tiene un test que pre-cargue la
   columna con un valor distinto y vuelva a ejecutar la transicion para comprobar que se sobrescribe.
   Se clasifica CRITICAL por el mismo criterio de cobertura runtime, con el mismo matiz de riesgo bajo:
   `fechasDerivadas.ts:108-134` y `valoresDeTransicion.ts:14-32` nunca leen
   `current.row.fecha_creacion_ticket`/`fecha_remision_entrada`/`fecha_revision_informe` -- solo fuentes
   externas (`created_time`, remisiones, `instanteUltimaTransicion`) --, asi que no hay ruta de codigo
   que pudiera devolver el valor viejo; el defecto tendria que introducirse activamente (leer la columna
   en la formula) para que este escenario dejara de cumplirse, y ese cambio de codigo seria visible en
   cualquier revision del propio `fechasDerivadas.ts`/`valoresDeTransicion.ts`. Remediacion sugerida:
   anadir a `valoresDeTransicion.test.ts` un caso que haga un `UPDATE` directo de la columna con un
   valor distinto antes de ejecutar una segunda transicion que la vuelva a declarar, y comprobar que se
   sobrescribe con el nuevo derivado.

**WARNING**: None mas alla de las dos CRITICAL de arriba (reclasificadas segun la regla dura de
verificacion: "a spec scenario is compliant only when a covering test passed at runtime" -- un hueco de
cobertura sobre un escenario de spec formal no puede quedar en WARNING aunque el riesgo funcional medido
sea bajo).

**SUGGESTION**:
1. Cobertura de lineas por fichero solo se midio sobre el subconjunto de 4 ficheros de la tanda (no
   sobre la suite completa, por tiempo de ejecucion); si se necesita la cifra global exacta de
   `ticketService.ts`, correr `npm run test:coverage` completo por separado.
2. El fichero `apps/desk/server/citas/hook.bordes.test.ts` sigue mostrando el margen de 60s de RPC
   documentado en `design.md` Section 10 nota 2 bajo carga de la suite completa (no es un defecto de
   esta tanda, ya registrado por el propio `apply-progress.md` de la unidad B); considerar, fuera de
   esta tanda, si ese margen necesita revision de infraestructura.

---

### Verdict

**FAIL**

Los siete requisitos de los dos deltas de spec estan implementados y coinciden linea a linea con el
codigo (`design.md` Section 3-4 cumplido al literal); las 51 tareas de `tasks.md` estan completas y cada
una se confirmo contra el codigo real, no solo contra la casilla; la suite completa pasa limpia en
solitario (1222/1222, exit 0), typecheck y lint limpios (0 errores), build del cliente limpio. Pero 2 de
21 escenarios de spec formal no tienen un test de ejecucion que cubra exactamente su `GIVEN/WHEN/THEN`
-- les falta un caso de integracion dedicado, aunque el comportamiento subyacente es correcto por
inspeccion de codigo (sin ruta que pueda devolver el valor viejo, en un caso; sin transicion real que
alcance el `GIVEN`, en el otro) y por garantias de posicion ya bajo prueba de mutacion. Bajo la regla
dura de este protocolo -- "a spec scenario is compliant only when a covering test passed at runtime" --
esos dos huecos son motivo de FAIL, no de advertencia. El riesgo funcional medido es bajo y no hay
ningun comportamiento observado incorrecto: la recomendacion es anadir los dos casos de prueba senalados
en "Issues Found" > CRITICAL (remediacion sugerida en cada uno) y volver a correr `sdd-verify`, sin
necesidad de reabrir `sdd-apply` para nada mas: no hay codigo de produccion que cambiar, solo dos test
cases nuevos.
