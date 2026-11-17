```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:cf1a5a582c3710bee3d69e9566ceb6cbc36429f4da2b4eb509da9786864b918e
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 8/8
scenarios: 24/24
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:0fa1695341172c4cfab721bf7a815a1bb2e4be8ca1775bae82b53c7752440428
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:1810f158de795ab9ff2e0ed245d2f370493bb7ccf820e26b8696d1b7ce564c3d
```

## Verification Report

**Change**: `marcador-migracion-lectores` (F1F-01, `cierra: no`)
**Mode**: Strict TDD (hybrid). Rama `marcador-migracion-lectores`, HEAD `2d7cc888`, partida `e728808d`.
Verificación independiente: todo se comprobó contra el código y ejecutando; `apply-progress.md` sólo se usó como índice.

### Completeness
| Métrica | Valor |
|---|---|
| Casillas de `openspec/changes/marcador-migracion-lectores/tasks.md` | 54 (1.1 a 1.26 y 2.1 a 2.28) |
| Completas / pendientes | 54 / 0 (el recuento de casillas sin marcar da 0) |
| Requisitos / escenarios de las tres deltas | 8 / 24 (15 ROJO, 9 CARACTERIZACIÓN) |

### Build & Tests (cadena `set -o pipefail` con `&&`, sobre `2d7cc888`)
Memoria física libre al arrancar: 9.852 MB. Cadena entera: salida 0.

| # | Comprobación | Salida | Duración |
|---|---|---|---|
| 1 | `npm run typecheck` | 0 | 19 s |
| 2 | `npm run lint -- --max-warnings 165` | 0; 165 avisos, 0 errores (igual que la partida) | 19 s |
| 3 | `tsx apps/desk/server/citas/cli.ts --sha HEAD < /dev/null` | 0; 8.953 comprobadas, 13 abreviadas rotas informativas, 0 bloqueos | 9 s |
| 4 | `npm test` (log entero en el scratchpad, `npmtest-verify-1.log`) | 0; 379 ficheros pasan, 6 saltados; 6.529 pruebas pasan, 36 saltadas; `Duration` de vitest 148,28 s | ~150 s |
| 5 | `npm run build` | 0; `index-F1jDYjEU.js` 427,51 kB (igual que la partida; sólo se despliega el servidor) | 10 s |

Sin «[vitest-worker]: Timeout calling "onTaskUpdate"» en el log. Cobertura: no se midió (no se exige en este cambio): N/A.
`git status --short` del worktree tras la cadena y las mutaciones: sólo este informe.

### TDD Compliance
| Check | Resultado | Detalle |
|---|---|---|
| Tabla «TDD Cycle Evidence» | ✅ | dos tablas en `openspec/changes/marcador-migracion-lectores/apply-progress.md` (L1 y L2) |
| Ficheros de prueba existen | ✅ | tres ficheros reescritos o ampliados y uno nuevo, todos presentes |
| RED confirmado POR MÍ | ✅ | ver abajo: 15 pruebas rojas y 1 fichero por importación contra `e728808d` |
| GREEN | ✅ | `npm test` 0; las 15 pasan en HEAD |
| Triangulación | ✅ | dos tickets por prueba donde hacía falta; reglas con y sin fecha |
| Red de seguridad | ✅ | los ficheros editados ya tenían pruebas verdes en la partida (traspaso, historialTipoEvento, migracionTicketsAbiertos) |

**RED reproducido.** `git worktree add --detach` de `e728808d` (temporal, con `node_modules` enlazado por unión; del HEAD sólo se copiaron los tres ficheros de prueba; retirado con `git worktree remove --force` y `prune`, sin rama creada). Orden: `npx vitest run packages/shared/src/marcadorMigracion.test.ts apps/desk/server/migracionMarcadorLectores.test.ts apps/desk/server/db/migracionTicketsAbiertos.test.ts apps/desk/server/db/traspaso.test.ts apps/desk/server/db/historialTipoEvento.test.ts`.
Contra el código de partida: **15 pruebas rojas, 48 verdes (63)**, y `packages/shared/src/marcadorMigracion.test.ts` cae entero por importación (el módulo no existe).
Rojas: R1 (`apps/desk/server/migracionMarcadorLectores.test.ts:41`), R2 (`:62`), R3 (`:73`), R4 (`apps/desk/server/db/migracionTicketsAbiertos.test.ts:142`), P1, P2, P4, P5, P6, P7, P8, P10, P11, P12, P13.
Verdes ya en la partida, como caracterización (coincide con el diseño): P3 (`apps/desk/server/migracionMarcadorLectores.test.ts:134`), P9 (`apps/desk/server/migracionMarcadorLectores.test.ts:182`), las de `apps/desk/server/db/traspaso.test.ts` y `apps/desk/server/db/historialTipoEvento.test.ts`.

### Spec Compliance Matrix (24 escenarios)
Pruebas en `apps/desk/server/migracionMarcadorLectores.test.ts` salvo que se diga otra cosa (línea tras `:`).

| Req | Escenario | Tipo | Prueba | Aserción real | Resultado |
|---|---|---|---|---|---|
| RQ-TC-84 | identidad, sin entrada propia | CAR | R1 `:41` | las claves devueltas son `[]` para z1 (identidad) y z2; compañera no vacía: P1 | ✅ |
| RQ-TC-84 | cambia el estado, fecha de Zoho | ROJO | P1 `:113` | T-201 igual a 2026-10-20T14:00Z con tres entradas a «Pendiente» (gana la última) | ✅ |
| RQ-TC-84 | sin fecha de Zoho, sin entrada | ROJO | P1 `:113` (T-205 sin historia no entra) y R4 `apps/desk/server/db/migracionTicketsAbiertos.test.ts:142` (escritura real) | claves `['T-201']` y `[]` | ✅ |
| RQ-TC-84 | «Finalizado» no fecha con la migración | ROJO | P2 `:124` y unitarias `packages/shared/src/marcadorMigracion.test.ts:26` y `:32` | T-203 entra el 30/11 (D-3); T-208 con `cierre_origen: 'migracion'` sin dato | ✅ |
| RQ-TC-84 | las demás filas no cambian | CAR | P3 `:134` | gana la última de dos reales (03/10) | ✅ |
| RQ-TC-85 | identidad, misma secuencia que sin marcador | ROJO | P4 `:141` | igual a `sin`, que es no nulo y de dos pasos | ✅ |
| RQ-TC-85 | renombra con la fecha de Zoho | ROJO | P5 `:150` | último paso `{En Proceso, 20/10 14:00Z}`, penúltimo «Pendiente», longitud 5 | ✅ |
| RQ-TC-85 | sin fecha, `null` | ROJO | P6 `:161` y unitaria `packages/shared/src/marcadorMigracion.test.ts:86` | `null`; la historia llega a «En Proceso» sin «Pendiente», así que el `null` no es el del hueco (M7 lo confirma) | ✅ |
| RQ-TC-85 | un migrado que cierra conserva su reloj | ROJO | P7 `:167` | `{ slaHoras: 18, totalHoras: 18 }` (valor, no sólo no nulo) | ✅ |
| RQ-TC-86 | migrado en espera con historia | ROJO | P8 `:176` | `{id, estado, desde: 2026-10-05T09:00Z}` exacto | ✅ |
| RQ-TC-86 | sin historia, sin dato | CAR | P9 `:182` | `ticketsEnEspera` es `[]` (compañera no vacía: P8) | ✅ |
| RQ-TC-87 | informe de contrato | CAR | `apps/desk/server/cierreMigracionEnCifras.test.ts:87` (sin tocar) | la fecha de la subOV es nula y `sinFecha` la lista | ✅ |
| RQ-TC-87 | indicadores | CAR | `:54` (sin tocar) | el historial de z1 es indefinido y `reentrante` es `[null]` | ✅ |
| RQ-TC-87 | lectores que no lo ven | CAR | `:46` (sin tocar) | cinco lectores devuelven nulo, 0 o vacío | ✅ |
| RQ-TZ-26 | regla que cambia el estado | ROJO | P10 `:209` | `details` igual a 5 pares exactos con la regla en español; ninguna etiqueta fuera de la lista blanca; título sin «Transición:» | ✅ |
| RQ-TZ-26 | identidad, destino nulo | ROJO | P10 `:209` (T-202) y R2 `:62` | título `TITULO_MARCADOR_MIGRACION`, «Regla aplicada» en español, sin lanzar | ✅ |
| RQ-TZ-26 | conserva `eventName` | CAR | P10 (`AppTransition`), `apps/desk/server/db/traspaso.test.ts:139` y `apps/desk/server/db/historialTipoEvento.test.ts:31` (sin tocar) | `['AppTransition','AppTransition']`; `tipoEvento` nulo | ✅ |
| RQ-TZ-27 | identidad oculto | ROJO | P11 `:230` (T-202) | un solo mensaje, el de «Habilitar Servicio:» | ✅ |
| RQ-TZ-27 | destino relleno oculto, fila en la base | ROJO | P11 (T-201 sin mensajes; `count(*)` = 4) y R2 `:62` | oculta y no borra | ✅ |
| RQ-TZ-28 | ninguna comparación propia | ROJO | P13 `:252` | los únicos cuatro ficheros de D-12; `traspaso.ts` ya no figura | ✅ |
| RQ-TZ-28 | el traspaso sigue apartando el marcador | CAR | `apps/desk/server/db/traspaso.test.ts:139` y la de exclusiones (sin tocar) | M12 las pone rojas | ✅ |
| RQ-HV-20 | identidad oculto | ROJO | R3 `:73` (z1, nulo) y P12 `:242` | `[]` de etapas del marcador; «Habilitar Servicio» sí (ver SUGGESTION 1) | ✅ |
| RQ-HV-20 | destino relleno oculto | ROJO | R3 `:73` (z2) y P12 (T-211, `values` completos) | sin etapa del marcador | ✅ |
| RQ-HV-20 | creación y etapas reales no cambian | CAR | P12 `:242` (T-212) | `['Ticket creado','Habilitar Servicio','Aprobar']` en orden | ✅ |

**Compliance summary: 24/24 escenarios con prueba que pasa y aserción de valor.** Ninguno UNTESTED.

### Mutaciones reproducidas por mí
Protocolo: `file` (CRLF) antes; `perl -i -pe` con sustitución `\Q…\E` y las cadenas en variables de entorno, sólo en la línea N (texto nuevo nunca vacío; línea localizada con `grep -n` antes); `npx vitest run <focal>`; `git checkout -- <f>` (rama limpia antes); después `numstat` vacío y `file` con CRLF (las siete restauraciones lo cumplieron).

| # | Fichero:línea | Mutación | Pruebas rojas observadas | Esperado (design §7) |
|---|---|---|---|---|
| M1 | `apps/desk/server/db/sla.ts:93` | `(await conFechaDeZoho(...))` vuelve a `r.rows` | R1, P1, P2, R4 | P1, R1, R4 ✅ |
| M3 | `apps/desk/server/db/relojSla.ts:43` | `resuelto.filasApp` a `filasApp` | P4, P5, P7, P8 | P4, P7, P8 ✅ |
| M7 | `packages/shared/src/marcadorMigracion.ts:69` | `return null` a `continue` | P6 y unitaria `packages/shared/src/marcadorMigracion.test.ts:86` | P6 y su unitaria ✅ |
| M9 | `apps/desk/server/db/historial.ts:143` | sólo `eventoTransicion(f, nombres)` | P10 y R2 | P10, R2 ✅ |
| M11 | `apps/desk/server/db/equipos.ts:278` | sin `.filter(...)` (`tr.rows as any[]`) | P12 y R3 | P12, R3 ✅ |
| M12 | `apps/desk/server/db/traspaso.ts:26` | sustituida por un comentario | dos de `apps/desk/server/db/traspaso.test.ts` (exclusión con destino relleno y «no da traspaso») | la del bloque 139 ✅ |
| M14 | `apps/desk/server/db/equipos.ts:278` | comparación propia con el literal del id en vez de `esPasoDeMigracion` | **sólo P13** `:252`; R3 y P12 siguen verdes | P13 único detector ✅ |

Todas caen por la causa correcta (valor del lector, o la lista de ficheros de P13), no por compilación. No repetí M2, M4, M5, M6, M8, M10 ni M13 (fuera del mínimo pedido): hipótesis, tomadas de `apply-progress.md`.

### Regla 13 / RQ-TZ-28
`git grep -n` de `ID_TRANSICION_MIGRACION` y del literal del id, en `*.ts` y `*.tsx` sin `*.test.ts`, da sólo: `apps/desk/server/db/cierresDeMigracion.ts:2` y `:10` (filtro SQL), `apps/desk/server/db/migracionTicketsAbiertos.ts:4` y `:81` (escritura), `packages/shared/src/cierreEnCifras.ts:1`, `:18` y `:20` (`esPasoDeMigracion`), `packages/shared/src/migracionTickets.ts:14` (definición). `apps/desk/server/db/traspaso.ts` ya no figura: ningún lector compara por su cuenta ✅. `git diff --stat e728808d -- apps/desk/src` vacío: el cliente no decide nada sobre el marcador (regla de mutación 3, design §9).

### Ninguna línea existente se movió
`git diff -U0 e728808d -- apps packages`: todo hunk de fichero existente es `-N +N` o va al final. `apps/desk/server/db/sla.ts` (2, 88, 93 y +21 tras la 125), `apps/desk/server/db/relojSla.ts` (3, 40, 43, 45, 77), `apps/desk/server/db/esperasVencidas.ts` (36), `apps/desk/server/db/historial.ts` (3, 143 y +8 tras la 162), `apps/desk/server/db/conversacion.ts` (1, 140, 143), `apps/desk/server/db/equipos.ts` (6, 274, 278), `apps/desk/server/db/traspaso.ts` (2, 26), `packages/shared/src/index.ts` (+1, la 57). Pruebas con el mismo número de líneas por bloque (R1 41-44, R2 62-71, R3 73-77, R4 142-147); el último hunk de `apps/desk/server/migracionMarcadorLectores.test.ts` es de la línea 76 a 192 líneas nuevas, al final. Total: 12 ficheros, 498 inserciones, 35 borrados (código y pruebas).
`git diff --stat e728808d -- openspec/config.yaml docs/sdd/ENTRADA.md apps/desk/src`: vacío ✅.

### Barrido de citas (muestreo de 10 de la tabla de `apply-progress.md`)
Cada una leída contra el fichero actual y contra lo que afirma la frase:
1. `apps/desk/server/db/sla.ts:88`: el `SELECT` de `entradasActuales`, ya con `transition_id` ✅ A.
2. `apps/desk/server/db/historial.ts:137`: el `SELECT` de `ticket_transitions` del historial ✅ A.
3. `apps/desk/server/db/conversacion.ts:140`: el `SELECT` de la conversación ✅ A.
4. `apps/desk/server/db/equipos.ts:275`: `FROM ticket_transitions WHERE ticket_id IN (...)` ✅ A.
5. `apps/desk/server/db/relojSla.ts:48`: la guarda de hueco que cita el diseño ✅.
6. `apps/desk/server/db/traspaso.ts:26`: la guarda con `esPasoDeMigracion` ✅ A, misma conducta.
7. `apps/desk/server/db/esperasVencidas.ts:36`: `SELECT` con `transition_id` ✅.
8. `packages/shared/src/cierreEnCifras.ts:19`: `esPasoDeMigracion` ✅.
9. `apps/desk/server/db/cierresDeMigracion.ts:10` y `apps/desk/server/db/migracionTicketsAbiertos.ts:81`: filtro SQL y escritura, que se quedan ✅.
10. `openspec/specs/zoho-sync/spec.md:936` (`entradasActuales`, rango de la consulta) y `openspec/config.yaml:6775` (medido «sobre `d182230e`», caso B ya anclado) ✅. La traza de E-215 a E-217 queda sólo listada en `apply-progress.md`, no escrita en `docs/sdd/ENTRADA.md`.
El detector (comprobación 3) sale 0 con 13 abreviadas rotas informativas. Hipótesis: que sean las mismas 13 de la partida (lo dice `apply-progress.md`; no medí la partida).

### Regresión E-213 / E-214 y lectores (a)/(b)
`apps/desk/server/db/informeContrato.ts`, `apps/desk/server/indicadores.ts`, `apps/desk/server/db/primerDerivado.ts`, `apps/desk/server/db/colaTaller.ts` y `apps/desk/server/db/fechasTicket.ts` no aparecen en el diff; `apps/desk/server/cierreMigracionEnCifras.test.ts:87` y las pruebas `apps/desk/server/migracionMarcadorLectores.test.ts:46` y `apps/desk/server/migracionMarcadorLectores.test.ts:54` siguen verdes sin tocarlas (CA-6) ✅.

### Coherence (Design)
| Decisión | ¿Seguida? | Notas |
|---|---|---|
| D-1 y S-8: módulo nuevo en `packages/shared`, cliente sin importarlo | ✅ | bundle idéntico `index-F1jDYjEU.js` 427,51 kB |
| D-2 normalización y última entrada | ✅ | `ultimaEntradaA` en `packages/shared/src/marcadorMigracion.ts`; unitaria `:49` de su prueba |
| D-3 «Finalizado» con `llegadaQueCuenta` | ✅ | P2; S-10 |
| D-4 cuatro ramas, regla desconocida sin fecha (S-13) | ✅ | unitarias de `packages/shared/src/marcadorMigracion.test.ts` |
| D-5 sintética al final | ✅ | P5 (orden con «Pendiente» del mismo instante) |
| D-6 una consulta a `ticket_history` sólo si hay marcadores | ✅ | `conFechaDeZoho` sale sin consultar si no hay marcador |
| D-8 evento propio con `eventName` `AppTransition` | ✅ | `eventoMigracion` en `apps/desk/server/db/historial.ts` |
| D-12 cuatro ficheros con el id | ✅ | `git grep` de arriba |
| Desviaciones declaradas (`conFechaDeZoho` no exportada; `tipoEvento` en `eventoMigracion`; `trim()` en detalles) | ✅ | ninguna de regla; la de `tipoEvento` la exige `apps/desk/server/db/historialTipoEvento.test.ts:31` |

### Coherencia con las decisiones registradas
- Criterio de Gerencia (`openspec/config.yaml:6766-6782`): «se conserva como rastro» (la fila sigue en la base, P11); «no cuenta ni se muestra como etapa» (hoja de vida, conversación, relojes y entradas lo apartan); «donde se enseñe, texto en español» (el historial lo redacta, P10, sin claves de `values`) ✅.
- Consecuencia (4) (`openspec/config.yaml:6777`): la alarma de un migrado con cambio de estado toma la entrada de las fechas de Zoho (P1, P5, P8) ✅.
- `decision/h1-fechas-migrados` (`openspec/config.yaml:4863-4881`): «la fecha de la migración no entra en ningún indicador» y «cuentan con sus fechas originales de Zoho». S-10 (cierre puesto por la migración queda sin dato) y S-6 (sin fecha, sin dato) no la contradicen: son su lectura estricta. Ningún supuesto S-1 a S-13 contradice lo que contrasté de `openspec/config.yaml`; S-1 (título «Migración desde Zoho Desk»), S-10, S-11 y S-12 son criterio que la decisión deja al diseño y van a la lista semanal.

### Issues
**CRITICAL**: ninguno.

**WARNING**
1. Hipótesis sin medir: las siete mutaciones que no repetí (M2, M4, M5, M6, M8, M10, M13) y el «mismas 13 abreviadas rotas que la partida» se toman de `apply-progress.md`. No bloquea: las siete que sí repetí cubren cada lector y cada guarda.
2. S-11 cambia observablemente el reloj de un «Pendiente» a «En Proceso» migrado cuya historia de Zoho no tenga «Pendiente»: la secuencia ENTERA pasa a `null`, también si después hay transiciones reales. Es supuesto reversible (`resolverMarcador`) y va a la lista semanal; conviene que Gerencia lo vea antes del 12/12 porque toca tickets de producción (número afectado no medido).
3. Las 86 citas del archivo que cayeron en líneas editadas (64 caso A y 22 caso B listadas sin ancla) no las releí una a una: sólo el muestreo de 10. El detector no comprueba lo que la frase afirma (`CLAUDE.md`, regla de mutación 4).

**SUGGESTION**
1. RQ-HV-20, «identidad oculto»: ninguna prueba combina en un mismo ticket un marcador de destino nulo con una transición real. R3 (z1, nulo) y P12 (T-211, destino relleno más «Habilitar Servicio») lo cubren por separado y M11 las pone rojas; un caso combinado lo haría literal.
2. P13 (`apps/desk/server/migracionMarcadorLectores.test.ts:252`) vigila a granularidad de fichero y sólo reconoce el id entre comillas o como `ID_TRANSICION_MIGRACION`; una comparación armada con plantilla no la vería. Está declarado en su propio título (D-12).
3. La traza de E-215 a E-217 en `docs/sdd/ENTRADA.md` y en `openspec/config.yaml:6775` queda a cargo de la supervisión, como preveía la tarea 2.16.
4. Medida: la rama completa son 498 inserciones y 35 borrados de código y pruebas más casillas y `apply-progress.md`; cada lote midió 466 y 383, muy por debajo del techo de 800 (cifras de `apply-progress.md`, no remedidas).

### Verdict
**PASS WITH WARNINGS**: 24/24 escenarios con prueba que pasa y aserción de valor, RED reproducido (15 rojas contra `e728808d`), siete mutaciones cazadas por la causa correcta, cinco comprobaciones en 0, bundle idéntico, ninguna línea movida y `openspec/config.yaml`, `docs/sdd/ENTRADA.md` y `apps/desk/src` intactos. Siguiente paso: `sdd-archive`.

## Key Learnings
- Un worktree temporal con `node_modules` enlazado por unión sirve para el rojo de la partida, pero se retira con `rmdir node_modules` ANTES de `git worktree remove --force`, para que el borrado no siga el enlace hasta el `node_modules` real.
- Una cadena lanzada con `&` dentro de un script devuelve el control al instante: se espera por el `CADENA exit` del log, no por la notificación de la tarea.
- Una aserción de vacío sólo vale con su compañera no vacía (R1/P1, P9/P8, R3/P12): aquí las tres parejas existen.
- La mutación sobre el fichero vigilado (M14) demuestra que P13 es el único detector de una comparación propia del id: R3 y P12 siguen verdes por construcción.
