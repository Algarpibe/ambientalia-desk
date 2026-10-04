```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:ecdd7d4b945a37b052305f08016972823cf19a1be45b690610d02717e593edda
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 5/5
scenarios: 45/45
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:ecdd7d4b945a37b052305f08016972823cf19a1be45b690610d02717e593edda
build_command: npm run typecheck
build_exit_code: 0
build_output_hash: sha256:f9de8b15b07069fcbf31f4a415061f4b90d66551059b5518c6d53e721545e547
```

# Informe de verificación — liberacion-sin-factura-motivo-fecha

Cambio `liberacion-sin-factura-motivo-fecha` (`tanda: F1C-05`, `cierra: no`). Modo: `strict_tdd`, `hybrid`.
Rama del mismo nombre, cabeza `7c43479`. Lo propio del cambio se lee con `git diff 8c182fb HEAD` (la fusión `8c182fb`
apila trabajo ajeno ya verificado y no se revisa aquí). Todo lo de abajo se ejecutó en el worktree; de
`apply-progress.md` sólo se contrastó lo que se dice expresamente.

## Veredicto: PASS con avisos

0 CRITICAL, 3 WARNING (W1 y W3 ya cerrados con prueba), 4 SUGGESTION. Las 47 casillas de `tasks.md` están marcadas (0 pendientes). Los cuatro mandatos
salen con código 0. Un hallazgo **refuta una afirmación del apply**: PL-3 sí existe (W1), y esta verificación lo cierra
con una prueba. La ficha enseña de verdad motivo y fecha (§6). Las mutaciones propias cayeron todas en rojo
(ME sólo tras añadir una prueba de esquema), y el árbol quedó limpio.

Conteo del sobre: 5 requisitos (cuatro MODIFIED —RQ-TS-06, RQ-TS-08, RQ-TS-09, RQ-PM-18— y RQ-TS-35 ADDED) y 45
escenarios con cabecera `#### Scenario` (41 en `specs/transitions-st/spec.md`, 4 en `specs/permissions/spec.md`). El
bloque Given/When/Then suelto de RQ-TS-06 sobre `aprobacion` es del requisito vivo y no lleva cabecera: no se cuenta.
`45/45`: el escenario «Aplicar el esquema no toca filas existentes» no tenía prueba y lo cubre la que añadí (§9).

## 1. Ejecución (códigos de salida literales)

| Comando | Salida | Cifras |
|---|---|---|
| `npm test` (cabeza `7c43479`, sin mis pruebas) | **0** | `Test Files 198 passed \| 1 skipped (199)`; `Tests 3151 passed \| 2 skipped (3153)` |
| `npm test` (con las pruebas que añadí, §9) | **0** | `Test Files 200 passed \| 1 skipped (201)`; `Tests 3158 passed \| 2 skipped (3160)` |
| `npm run typecheck` | **0** | `tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit`, sin errores |
| `npm run lint` | **0** | `165 problems (0 errors, 165 warnings)`, antes y después de mis pruebas |
| `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` | **0** | sin bloqueantes; las abreviadas rotas que lista son informativas y de la spec viva (previas al cambio) |

`npm test` no dio el aviso `Timeout calling onTaskUpdate` en ninguna de las dos pasadas: una sola salida cada vez,
las dos con código 0. Contraste con el apply: su cierre del lote 2 dice 3.151 y 2, y la cabeza lo reproduce al dato.
El hash de `npm test` es el de la segunda pasada (con mis pruebas). El hash del `typecheck` es el de la salida sin
errores, que es la misma que en otros informes recientes. El detector de citas se pasó **sobre la cabeza commiteada**;
las pruebas y este informe son nuevos y no estaban en esa revisión: su comprobación de citas es la lectura a mano.

## 2. Matriz de cumplimiento

Claves de fichero: `E` = `apps/desk/server/liberacionSinFactura.test.ts` (HTTP), `S` =
`packages/shared/src/liberacionSinFactura.test.ts`, `X` = `apps/desk/server/transitionExec.test.ts`, `R` =
`packages/zoho-sync/src/db/repo.test.ts`, `M` = `packages/zoho-sync/src/db/migrate.test.ts`, `C` =
`apps/desk/server/cargoPermiso.test.ts`, `V` = prueba añadida por esta verificación (§9). La palabra «línea» seguida
de un número es la de la declaración de la prueba en ese fichero.

### RQ-TS-35 (ADDED)

| Escenario | Prueba | Resultado |
|---|---|---|
| Catálogo declara motivo, fecha, texto y ninguna casilla | `S` línea 142 | COMPLIANT |
| Las tres opciones, a la letra y en orden | `S` línea 142 | COMPLIANT |
| `transitions.ts` conserva su número de líneas | comprobación de cierre: 397 líneas, numstat 1/1 (§8) | COMPLIANT |
| Sin motivo: 422 de presencia, el ticket no se mueve | `E` línea 42 | COMPLIANT |
| Sin fecha: 422 de presencia | `E` línea 42 y `E` línea 140 (PL-4) | COMPLIANT |
| Motivo fuera de la lista se rechaza | `E` línea 49 | COMPLIANT |
| La igualdad con la lista es exacta | `E` línea 49 (mayúsculas) | COMPLIANT |
| Fecha que no es día real | `E` línea 55 (`2026-02-30`) | COMPLIANT |
| Fecha en otra forma | `E` línea 55 (`04/10/2026` y el ISO con hora) | COMPLIANT |
| Fecha pasada se acepta (SP-1) | `E` línea 61 | COMPLIANT |
| Autorización excepcional sin texto | `E` línea 68 | COMPLIANT |
| Autorización excepcional con texto de sólo espacios | `E` línea 68 | COMPLIANT |
| Autorización excepcional con texto se acepta | `E` línea 74 | COMPLIANT |
| Los otros dos motivos no exigen texto | `E` línea 79 | COMPLIANT |
| Errores de contenido salen juntos y detrás de los de presencia | `E` línea 159 (V, el caso literal: tercer motivo sin texto y sin fecha) y `E` línea 140 | COMPLIANT |
| Con 200 se escriben columnas, texto y traza, y no la casilla | `E` línea 86 | COMPLIANT |
| El texto no se guarda en columna | `packages/zoho-sync/src/db/liberacionFicha.test.ts:14` (V) y `X` línea 302 | COMPLIANT |
| Las dos columnas fuera de `TICKET_COLS` (GUARDIÁN) | primera prueba del bloque nuevo de `R` (líneas 522 a 551); la mutación M6 es del apply y no la reproduje | COMPLIANT |
| El sincronizador no pisa motivo ni fecha | segunda prueba del bloque de `R` y `E` línea 109 | COMPLIANT |
| El esquema añade las dos columnas sin calificar; 55 / 29 / 26 (GUARDIÁN) | `M` líneas 374 a 378 y 652; la mutación M5 es del apply y no la reproduje | COMPLIANT |
| Aplicar el esquema no toca filas existentes | `packages/zoho-sync/src/db/liberacionFicha.test.ts:31` (V) | COMPLIANT sólo por V |
| PL-1 · 403 de cargo antes que la lista | `E` línea 121 (control con administrador incluido) | COMPLIANT |
| PL-1 bis · 403 de área antes que la lista | `E` línea 130 | COMPLIANT |
| PL-2 · 409 de estado antes que la lista | `E` línea 136 | COMPLIANT |
| PL-3 · la lista gana a la persona derivada inexistente | no existía; `E` línea 165 (V) | COMPLIANT sólo por V (W1) |
| PL-4 · presencia delante del contenido, un solo 422 | `E` línea 140 | COMPLIANT |
| Segunda liberación exige de nuevo motivo y fecha | `E` línea 149 (V, la mitad sin motivo ni fecha) y `E` línea 97 | COMPLIANT |
| Segunda liberación por otro motivo y sin texto: `null` | `E` línea 97 | COMPLIANT |
| El cliente no bloquea ni prellena (PERSONA) | predicado probado en `S` líneas 131 y 155; el `.tsx` es de persona | PERSONA |
| La ficha enseña motivo y fecha (PERSONA) | lectura de extremo a extremo en §6; el extremo `.ts`, por `packages/zoho-sync/src/db/liberacionFicha.test.ts:22` (V) | PERSONA |
| El cargo sigue siendo Director Comercial | `C` línea 112 y el barrido de `C` línea 250, en verde | COMPLIANT |
| Reentrancia: once campos, nueve obligatorios | `packages/shared/src/reentrancia.test.ts:92` | COMPLIANT |
| Lo que queda fuera no se construye | las líneas añadidas de código no tocan «Pendiente de facturar», alarma ni Decisionales (0 coincidencias) | COMPLIANT |

La cifra «744 combinaciones» que cita la spec no la localicé en `C` (su barrido habla de 93 celdas): **hipótesis** de que es de una tanda anterior.

### RQ-TS-06, RQ-TS-08, RQ-TS-09 (MODIFIED) y RQ-PM-18

| Escenario | Prueba | Resultado |
|---|---|---|
| RQ-TS-06 · fecha derivada inválida, vencido (9), guarda de flujo (3) | previos, en verde en la suite completa | COMPLIANT |
| RQ-TS-06 · contenido de la liberación (7 bis) detrás de los 403, dentro del 422 | `E` líneas 121 a 145 | COMPLIANT |
| RQ-TS-08 · `transitionExec.ts` sólo cambia un comentario | numstat 1/1 de `apps/desk/server/transitionExec.ts` (línea 73) | COMPLIANT |
| RQ-TS-08 · casilla obligatoria exigida marcada (sintética) | `X` línea 290; la mutación M10 es del apply | COMPLIANT |
| RQ-TS-09 · motivo y fecha a columna, texto a `customFields` | `X` línea 302 (sintética) y `apps/desk/server/liberacionVerificacion.test.ts:7` (V, catálogo real) | COMPLIANT |
| RQ-TS-09 · el mapa gana dos entradas al final y conserva la histórica | `packages/zoho-sync/src/db/liberacionFicha.test.ts:14` (V) | COMPLIANT sólo por V |
| RQ-PM-18 · 409 antes que 403; 403 de área antes que cargo | `C` líneas 211 y 220 | COMPLIANT |
| RQ-PM-18 · 403 de cargo antes que 422 y antes que la lista (PL-1) | `C` línea 102 y `E` línea 121 | COMPLIANT |

**Resumen:** 45 de 45 escenarios con prueba, comprobación de cierre o lectura de persona; 0 UNTESTED (uno sólo por una prueba añadida aquí).

## 3. Punto 3 — posición de la guarda y PL-3

Lectura de `apps/desk/server/services/ticketService.ts` contra el orden A < B < C < D:

| Línea | Guarda | Escalón |
|---|---|---|
| `apps/desk/server/services/ticketService.ts:125` | 404 del ticket y `exigirMismoFlujo` (409 de flujo) | A y B |
| `apps/desk/server/services/ticketService.ts:126` | 409 de estado (`from`) | B |
| `apps/desk/server/services/ticketService.ts:129` | 403 de área | B |
| `apps/desk/server/services/ticketService.ts:131` | 403 de cargo, y a continuación prioridad, gas y remisión vigente | B |
| `apps/desk/server/services/ticketService.ts:133` | `buildTransitionPlan` y `txtLib` (D7: el texto o `null`) | C, sólo cálculo |
| `apps/desk/server/services/ticketService.ts:134` | un solo 422 agregado: presencia, fechas, cuarentena, certificado y, el último, `errLiberacion` | C |
| `apps/desk/server/services/ticketService.ts:138` | persona derivada (422) | C |
| `apps/desk/server/services/ticketService.ts:147` | contrato vencido (422) | C |
| `apps/desk/server/services/ticketService.ts:150` | OV ya asociada (409) | D |

Confirmado: el 409 de estado y los 403 de área y de cargo van antes del 422 de contenido, y la presencia va delante de
la lista dentro del mismo 422 (`plan.errors` precede a `errLiberacion` en la línea 134).

**PL-3: el apply se equivoca, y lo refuto.** El apply declara que la transición no declara derivación porque la
línea 247 de `packages/shared/src/transitions.ts` no usa el ayudante. Es cierto de `TRANSICIONES_BASE` y falso del
catálogo real: `TRANSITIONS` se construye con `TRANSICIONES_BASE.map(...)` y añade `derivacion(...)` a **toda**
transición (`packages/shared/src/transitions.ts:297`; el campo es `derivado_a`, con destino `derivacion`, definido en
`packages/shared/src/transitions.ts:98`). `buildTransitionPlan` la escribe en `plan.columns` cuando la clave llega.
O sea que con un `derivado_a` inexistente la guarda de la persona (`apps/desk/server/services/ticketService.ts:140`)
**sí** se activa en esta transición, y el par lista-contra-persona existe. Sin prueba, nada fijaba que la lista fuera
antes que la persona más allá del efecto colateral de PL-4. Añadí la prueba (`E` línea 165): con un administrador, el
control con motivo válido y persona inexistente da `422` con el mensaje de la persona, y con motivo fuera de la lista
da **sólo** el de la lista. **Mutación M3 reproducida** (guarda de la lista tras la persona): ahora caen PL-3, PL-4 y
mi caso del tercer motivo; antes sólo PL-4.

## 4. Punto 4 — regla 13, las siete filas del diseño §11, releídas

| # | Decide el cliente | Línea del servidor que la impone | Veredicto |
|---|---|---|---|
| 1 | Motivo obligatorio, asterisco en `apps/desk/src/components/TransitionPanel.tsx:209` | `apps/desk/server/transitionExec.ts:77` y 422 en `apps/desk/server/services/ticketService.ts:134`; `E` línea 42 | espejo legítimo |
| 2 | Fecha obligatoria | la misma; `E` líneas 42 y 140 | espejo legítimo |
| 3 | Sólo tres motivos, desplegable en `apps/desk/src/components/TransitionPanel.tsx:257` | `packages/shared/src/liberacionSinFactura.ts:31`, cableada en `apps/desk/server/services/ticketService.ts:134`; `E` línea 49 | espejo legítimo (imposición probada) |
| 4 | La fecha es un día, `input type="date"` en `apps/desk/src/components/TransitionPanel.tsx:254` | `packages/shared/src/liberacionSinFactura.ts:32`; `E` línea 55 | espejo legítimo |
| 5 | Texto con el tercer motivo: el cliente no decide | `packages/shared/src/liberacionSinFactura.ts:33`; `E` línea 68 | el cliente no decide: bien |
| 6 | Quién ve el botón, `apps/desk/src/components/TransitionPanel.tsx:56` | `apps/desk/server/services/ticketService.ts:129` y `apps/desk/server/services/ticketService.ts:131`; `E` líneas 121 y 130 | espejo legítimo |
| 7 | No prellenar ni bloquear al re-liberar, `apps/desk/src/components/TransitionPanel.tsx:33` | sin contrapartida necesaria: el servidor exige en cada ejecución y lee sólo el cuerpo; reescribe el texto en `apps/desk/server/services/ticketService.ts:133`; `E` línea 149 | comodidad |

Ninguna decisión del cliente queda sin línea de servidor. Matiz de la fila 5: el cliente pinta el texto siempre y sin
asterisco (comprobación de persona); no hay regla de dominio escondida en el `.tsx`.

## 5. Punto 5 — el arnés (`emularMezclaJsonb`)

`apps/desk/server/testing/appHarness.ts` sustituye en pruebas la sentencia de
`packages/zoho-sync/src/db/repo.ts:309` (la mezcla `custom_fields || $n::jsonb`) porque pg-mem trata `jsonb || jsonb`
como texto. La emulación ocupa las líneas 105 a 117 y se engancha en la línea 37.

**¿Fiel a PostgreSQL?** En lo que se puede razonar, sí. La mezcla de la línea 111
(`apps/desk/server/testing/appHarness.ts:111`) es **superficial**, con la clave nueva ganando, igual que el operador
`||` sobre objetos `jsonb`; un `null` JSON se conserva como clave con valor `null` y no borra el resto de claves
(`E` línea 97 lo ejerce, y la mutación MF, que invierte el orden de la mezcla, la pone en rojo). El caso en que
PostgreSQL daría `NULL || x = NULL` no puede ocurrir: la columna es `NOT NULL DEFAULT` de objeto vacío
(`packages/zoho-sync/src/db/schema.sql:40`), de modo que tratar ausente como objeto vacío no se aparta de PostgreSQL.

**¿Puede tapar un defecto de producción?** Poco, y en voz alta. La emulación sólo actúa si la sentencia casa con la
expresión regular de la línea 107; si alguien cambia el SQL de producción (otro orden de operandos, `jsonb_set`, quitar
la conversión), la regex deja de casar y pg-mem revienta, no se calla. Lo que **no** se comprueba en este repositorio
es que el operador real se comporte así contra un servidor PostgreSQL: **hipótesis** (la sentencia de producción no
cambió y es la de siempre). Desvío menor, sin efecto en pruebas: la emulación lee y escribe en dos sentencias, sin
bloqueo de fila (línea 110), así que no es atómica; el operador de producción sí lo es.

**¿Cambia el resultado de otras suites?** Antes de F1C-05 ninguna transición HTTP escribía una clave fuera de
`PROMOTED_COLUMNS`, así que la sentencia no se ejecutaba y la emulación no se activaba; ahora la dispara únicamente la
liberación, y sólo cuando `plan.customFields` no está vacío. Las dos pasadas completas de `npm test` salen en verde con
el arnés tocado, y la suite de `packages/zoho-sync`, que no usa el arnés, no cambia. La emulación se instala en
**todas** las suites HTTP por la línea 37; no encuentro otra sentencia de producción con ese patrón: la búsqueda de
`custom_fields ||` sobre código que no es de prueba da sólo `packages/zoho-sync/src/db/repo.ts:309`.

**¿Qué camino de producción sólo se prueba a través de ella?** Uno: la mezcla de `custom_fields` en `writeTransition`
cuando el plan lleva texto (el texto de la autorización y su `null` de D7; `E` líneas 74, 97 y 109). Alcance exacto:
el resultado «una segunda liberación sin texto deja `null`, y la anterior no sobrevive» depende de la emulación en CI y
de PostgreSQL real en producción, y ninguna prueba los enfrenta. Es el aviso **W2**. Antes de desplegar conviene que
una persona lo compruebe en una base real (comprobación P3 del paquete: liberar, devolver y liberar de nuevo sin
texto, y mirar `custom_fields`).

## 6. Punto 6 — la ficha, de extremo a extremo

1. **Escritura.** El plan manda el motivo y la fecha a `plan.columns` porque sus etiquetas están en `PROMOTED_COLUMNS`
   (`packages/zoho-sync/src/db/rows.ts:131`), y `writeTransition` hace `UPDATE` de esas columnas
   (`packages/zoho-sync/src/db/repo.ts:302`). `E` línea 86 lo prueba: las dos columnas escritas y el texto en
   `custom_fields`.
2. **Lectura.** `getTicketWithRefs` hace `SELECT t.*` (`packages/zoho-sync/src/db/repo.ts:192`), así que las dos
   columnas viajan en la fila, y la ruta `apps/desk/server/routes/tickets.ts:144` llama a `rowToTicketDetail`.
3. **Resolución de la etiqueta.** `customFieldsFromRow` (`packages/zoho-sync/src/db/mappers.ts:222`) parte de
   `custom_fields` y recorre `PROMOTED_COLUMNS` escribiendo `out[label]` desde la **columna**. Por eso `cf` (definida en
   `apps/desk/src/components/TicketProperties.tsx:15` y usada para el motivo en la línea 184) encuentra el valor aunque
   no esté en `custom_fields`. Mismo camino para la fecha, que además pasa por `dateOnly` (las `date` de pg llegan como
   `Date`).
4. **Pintado.** El motivo sale en «Información adicional» (la sección abre en
   `apps/desk/src/components/TicketProperties.tsx:178` y el campo está en la línea 184); la fecha, en `TIME_FIELDS`
   (`apps/desk/src/components/TicketProperties.tsx:76`), dentro de «Control de tiempos»
   (`apps/desk/src/components/TicketProperties.tsx:172`).
5. **Prueba propia.** `packages/zoho-sync/src/db/liberacionFicha.test.ts:22` construye una fila con las dos columnas y
   comprueba que `rowToTicketDetail` da el motivo y `2026-10-10`, y `null` con las columnas vacías. La mutación MC
   (fecha promovida como texto) la pone en rojo.

**Veredicto del punto: la ficha enseña de verdad motivo y fecha. No hay CRITICAL.** Dos matices de presentación (S1,
S2): la fecha cae en una sección **plegada por defecto** y el texto de la autorización no sale en la ficha (sólo en el
historial, por la traza). La spec sólo exige motivo y fecha (S-5).

## 7. Punto 7 — D7 y el sincronizador

- **Segunda liberación sin texto deja `null`:** `E` línea 97. La variante con `if (txtLib)` en la línea 133 la
  reprodujo el orquestador; la mutación MF (arnés) la hace caer en mi ejecución.
- **`upsertTicket` no borra el texto:** `E` línea 109. La razón la leí: `writeTransition` marca `managed_by_app` y
  `upsertTicket` sale entero con esa marca (`packages/zoho-sync/src/db/repo.ts:71`).
- **No pisa las dos columnas:** están fuera de `TICKET_COLS` (`packages/zoho-sync/src/db/repo.ts:44` abre la lista y
  llega a la línea 54). `R` lo prueba con una fila **no gestionada**, que es la única forma de que la prueba pruebe algo.
- Lo que D7 no resuelve y la spec ya admite: la traza guarda el texto **sin recortar** (`ticket_transitions.values`
  recibe `values` tal cual) y `custom_fields` lo guarda recortado (S3).

## 8. Punto 8 — líneas y citas

`git diff --numstat 8c182fb HEAD` sobre lo que interesa:

| Fichero | + / − | Lectura |
|---|---|---|
| `packages/shared/src/transitions.ts` | 1 / 1 | sólo la línea 247; `wc -l` 397, igual que antes |
| `apps/desk/server/services/ticketService.ts` | 3 / 3 | líneas 6, 133 y 134, en su sitio |
| `apps/desk/server/transitionExec.ts` | 1 / 1 | sólo el comentario de la línea 73 |
| `packages/zoho-sync/src/db/rows.ts` | 3 / 3 | la línea 131 conserva su número; 132 líneas |
| `packages/shared/src/fechasDerivadas.ts` | 1 / 1 | sólo el `export` |
| `apps/desk/src/components/TicketProperties.tsx` y `apps/desk/src/components/TransitionPanel.tsx` | 2 / 2 y 5 / 5 | en su sitio |
| `apps/desk/server/testing/appHarness.ts` | 23 / 1 | los hunks de `git diff -U0` son el de la línea 37 en su sitio y uno nuevo que empieza en la 96; el fichero queda en 117 líneas: las líneas 1 a 95 no se desplazan |
| `packages/zoho-sync/src/db/schema.sql` | 4 / 0 | al final: las dos `ALTER` en las líneas 717 y 718, sin calificar |
| `packages/shared/src/index.ts` | 1 / 0 | línea nueva al final |

Todos los ficheros muy citados tienen inserciones = borrados, o las inserciones van al final. El barrido de la regla de
mutación 4 sobre la línea 247 de `transitions.ts` lo hizo el apply (su §2.23) y la salida del detector sobre la cabeza
es 0.

## 9. Pruebas añadidas por esta verificación (sin `as any`, lint en 165 exactos)

| Prueba | Fichero y línea | Por qué |
|---|---|---|
| PL-3 con control (persona inexistente sola, y con motivo fuera de la lista) | `apps/desk/server/liberacionSinFactura.test.ts:165` | W1: el par existe y no estaba probado |
| Segunda liberación sin motivo ni fecha vuelve a dar 422 | `apps/desk/server/liberacionSinFactura.test.ts:149` | escenario de RQ-TS-35 cubierto a medias |
| Tercer motivo sin texto y sin fecha: presencia de la fecha delante del texto | `apps/desk/server/liberacionSinFactura.test.ts:159` | escenario literal de RQ-TS-35 |
| Plan con el catálogo real: columnas y `customFields` | `apps/desk/server/liberacionVerificacion.test.ts:7` | las del lote 1 usan una transición sintética |
| `PROMOTED_COLUMNS`: 42, las dos nuevas al final, histórica presente, texto fuera | `packages/zoho-sync/src/db/liberacionFicha.test.ts:14` | dos escenarios sin prueba |
| El detalle del ticket enseña motivo y fecha desde sus columnas | `packages/zoho-sync/src/db/liberacionFicha.test.ts:22` | extremo `.ts` de la ficha |
| Aplicar el esquema otra vez no toca filas, las dos columnas nacen en NULL y la fecha es `date` | `packages/zoho-sync/src/db/liberacionFicha.test.ts:31` | escenario sin prueba; mata la mutación ME |

Dos ficheros nuevos (14 y 42 líneas) y 30 líneas añadidas **al final** de `E` (de 146 a 176): ninguna línea citada se
desplaza. Más este informe.

## 10. Mutaciones propias (distintas de M1 a M10 y de las tres del orquestador)

Cada una se aplicó por sustitución de texto, se corrió el conjunto de pruebas del cambio y se revirtió con
`git checkout`.

| # | Qué se cambia | Resultado |
|---|---|---|
| MA | `packages/shared/src/liberacionSinFactura.ts:32`: la fecha se evalúa tras recortar a diez caracteres (acepta ISO con hora) | CAE: 3 (dos en `S` y el HTTP del ISO con hora) |
| MB | `packages/shared/src/liberacionSinFactura.ts:43`: el texto se guarda sin recortar | CAE: 2 (`E` línea 74 y `S` línea 119) |
| MC | `packages/zoho-sync/src/db/rows.ts:131`: la fecha promovida con tipo texto | CAE: 2 (`packages/zoho-sync/src/db/liberacionFicha.test.ts:22` y la guarda de `R`) |
| MF | `apps/desk/server/testing/appHarness.ts:111`: la mezcla emulada deja ganar lo viejo | CAE: 1 (`E` línea 97, D7) |
| M3 (con PL-3) | la guarda de la lista pasa tras la persona derivada | CAE: 3 (PL-3, PL-4 y mi caso del tercer motivo); antes sólo PL-4 |
| ME | `packages/zoho-sync/src/db/schema.sql:718`: la columna de la fecha como texto en vez de `date` | NO CAÍA con las pruebas del apply (143 de 143 en verde); con mi prueba de `packages/zoho-sync/src/db/liberacionFicha.test.ts:31` CAE: 1 |

## 11. Coherencia con el diseño

Se cumplen D2 a D9 y D12: clave y etiqueta del motivo en la línea 247 de `packages/shared/src/transitions.ts`, guarda por campo
(`packages/shared/src/liberacionSinFactura.ts:24`), lista desde las `options` (línea 26), cableado último en el 422
(`apps/desk/server/services/ticketService.ts:134`), texto siempre escrito (línea 133 del mismo fichero), fecha estricta
(MA) y mapa sin desplazar. Donde spec y diseño difieren manda el diseño; PL-1 bis sólo está en la spec y el apply la incluyó.

## 12. Hallazgos

**CRITICAL:** ninguno.

**WARNING**
- **W1 · PL-3 sí existe y no estaba probado.** `apply-progress.md` (sección Desviaciones, punto 1) afirma lo
  contrario. El catálogo real añade el campo de derivación a toda transición en
  `packages/shared/src/transitions.ts:297`. Cerrado aquí con `apps/desk/server/liberacionSinFactura.test.ts:165`. Al
  archivar **hay que corregir dos frases falsas**: la del apply y la de la cabecera de
  `apps/desk/server/liberacionSinFactura.test.ts` (líneas 16 y 17, que dicen que PL-3 no existe). Si se edita la
  cabecera, que sea en su sitio, sin añadir líneas.
- **W2 · Una ruta de producción sólo se prueba con la emulación.** La mezcla de `custom_fields` de
  `packages/zoho-sync/src/db/repo.ts:309`, para el texto de la autorización y su `null`. La emulación es fiel en lo
  que se puede razonar (§5), pero contra PostgreSQL real es **hipótesis**. Mitigación ya escrita: comprobación P3 de
  persona.
- **W3 · Cerrado en esta verificación.** El tipo de la columna y «aplicar el esquema no toca filas» no estaban fijados:
  la mutación ME (`date` por texto) pasaba las 143 pruebas del cambio, porque leen la fecha como día (`E` línea 38). Lo
  cubre `packages/zoho-sync/src/db/liberacionFicha.test.ts:31`. Queda como aviso para el archivo: el apply no tenía esta red.

**SUGGESTION**
- **S1.** La ficha no enseña el texto de la autorización (sólo motivo y fecha, como pide S-5): el texto vive en
  `custom_fields` y en el historial. Si Gerencia lo quiere en la ficha, es otro cambio.
- **S2.** La fecha prevista cae en «Control de tiempos», que arranca **plegada**
  (`apps/desk/src/components/TicketProperties.tsx:172`): la comprobación P4 de persona debe abrirla. No es defecto.
- **S3.** La traza guarda el texto sin recortar y `custom_fields` lo guarda recortado: coherente con que la fuente de verdad
  sea la fila de traza; se anota por si una consulta compara los dos.
- **S4.** El paquete de despliegue debe recordar que las liberaciones nuevas no marcan `liberacion_sin_facturar`
  (pregunta 3 de la bandeja del apply): quien cuente por esa columna verá vacío tras el despliegue.

## 13. Lo que queda de persona (archivar NO lo da por hecho)

Las dos de `.tsx` del delta (no prellenar ni bloquear en una segunda liberación; la ficha enseña motivo y fecha) y las
cinco comprobaciones del paquete de despliegue (P1 a P5). Ninguna se registra como carencia de pruebas de interfaz.
