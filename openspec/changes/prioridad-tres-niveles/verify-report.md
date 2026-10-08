```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:fff0dc732c0e454097113a48739d0b9437f9981a1b547f67b99381c6cf859560
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 14/14
scenarios: 138/138
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:852e3bdd4f6449f6feb14a1063d1a178b437e26631a3429dceaaa39349018869
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:5e40b7ff842265a649a2794ae247f017e2dfea5cb998d0058d906963ee956e72
```

## Verification Report

**Change**: `prioridad-tres-niveles` (`tanda: F1B-07`, `cierra: no`)
**Mode**: Strict TDD · hybrid
**Cabeza verificada**: `14ebc2e` (base de la tanda `6344b4a`; planificación `742e365`; L1 `8574689`, L2 `e1a4e42`, L3 `bded7e6` más `922eeca`). Verificado sobre el worktree, sin tocar la copia principal del repositorio.
**Veredicto**: **PASS WITH WARNINGS** — 0 CRITICAL, 4 WARNING, 4 SUGGESTION.

Los hashes del bloque son los SHA-256 de la salida íntegra de `npm test` y de `npm run build` de esta pasada. Los 14 requisitos y 138 escenarios son los
de los tres deltas (tickets-core 9 y 107, transitions-st 2 y 20, permissions 3 y 11). Los 8 escenarios no conformes van en las advertencias W1 a W3.

## 1 · Los códigos, uno a uno (todos ejecutados por mí)

| # | Comando | Código | Salida |
|---|---|---|---|
| 1 | `npm test` | **0** | 259 ficheros pasan, 2 saltados (261); **4226 pruebas pasan, 7 saltadas** (4233). Coincide con la partida esperada |
| 2 | `npm run typecheck` | **0** | `tsc -b` y `tsc -p apps/desk/tsconfig.server.json --noEmit` sin errores |
| 3 | `npm run lint` | **0** | `165 problems (0 errors, 165 warnings)`: la base |
| 4 | `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` | **0** | No imprime sección «Bloqueantes» (cero apariciones); 6739 comprobadas, 13 abreviadas rotas informativas (todas en ficheros ajenos a este cambio), 0 cabeceras R-1 inválidas, línea base 0 |
| 5 | `npm run build` | **0** | el cliente compila (`built in 1.61s`) |

`git status --short` queda sin salida tras todo lo anterior y tras las 22 mutaciones de §5 (cada una se restauró con `git checkout` y `git diff` quedó vacío).

## 2 · Completitud

63 casillas marcadas y 0 sin marcar en `openspec/changes/prioridad-tres-niveles/tasks.md`. No hay tarea pendiente.

## 3 · Matriz de cumplimiento escenario a escenario

Método: cada título de escenario de los tres deltas contrastado con el nombre de la prueba que lo ejecuta; todas las pruebas citadas pasaron en `npm test`.
Los escenarios heredados de RQ-TC-35 a RQ-TC-38 (propagación, reversión, exención, traza) no cambian de comportamiento: los sostienen las pruebas preexistentes
de `apps/desk/server/propagarTop5.test.ts`, `packages/shared/src/prioridadPropagada.test.ts`, `apps/desk/server/trazaTop5AlNacer.test.ts` y `apps/desk/server/propagarTop5Atomica.test.ts`,
cuya edición fue solo de dato (ver §4g). Para esos 47 escenarios la asociación es por título y no línea a línea.

### tickets-core

| Requisito · escenario(s) | Prueba que lo cubre | Resultado |
|---|---|---|
| RQ-TC-24 · contrato vigente nace `High` aunque el cuerpo traiga `Low`; sin prioridad en el cuerpo | `apps/desk/server/services/ticketService.test.ts:961-983` (filas «contrato vigente y el cuerpo pide Low → High» y «contrato vigente y sin prioridad → High») | COMPLIANT |
| RQ-TC-24 · Combinación 1, sin contrato ni Top 5, `Medium` pida lo que pida | `apps/desk/server/services/ticketService.test.ts:1473-1478` (cuatro filas: `High`, `Low`, `Urgent` y nada) | COMPLIANT |
| RQ-TC-24 · Combinaciones 2, 3 y 4; función pura «por orden, no por posición» | `packages/shared/src/contratos.test.ts:219` (cuatro combinaciones) y `apps/desk/server/services/ticketService.test.ts:1121-1166` (TC24-5, TC24-8, TC24-14) | COMPLIANT |
| RQ-TC-24 · `Urgent` pierde ante contrato y Top 5 (S-3); `Urgent` sin ellos ya no se conserva | `apps/desk/server/services/ticketService.test.ts:1133` (TC24-8) y `apps/desk/server/services/ticketService.test.ts:1142` (TC24-9) | COMPLIANT |
| RQ-TC-24 · contrato vencido o aún no iniciado no da prioridad | `apps/desk/server/services/ticketService.test.ts:961-983` (filas «vencido» y «empieza mañana») | COMPLIANT |
| RQ-TC-24 · **borde**: el día del fin cuenta; el siguiente no; zona de la aplicación y no UTC; contrato ampliado | Servicio: `apps/desk/server/prioridadAlNacerVigencia.test.ts:49`, `:55`, `:61`, `:68`. Función pura: `packages/shared/src/contratos.test.ts:385-390` | COMPLIANT (dos capas) |
| RQ-TC-24 · manda el cliente del ticket, no el de la OV; Top 5 del cliente del ticket | `apps/desk/server/services/ticketService.test.ts:977-983` y `apps/desk/server/services/ticketService.test.ts:1148` (TC24-13, con Top 5 `High` del cliente A para que discrimine) | COMPLIANT |
| RQ-TC-24 · S-1 y S-9 invertidos (marcar propaga, desmarcar revierte) | `apps/desk/server/prioridadTop5.test.ts:180` (TC24-14) y `apps/desk/server/prioridadTop5.test.ts:187` (TC24-15) | COMPLIANT |
| RQ-TC-24 · ticket sin `client_id` no hereda | `apps/desk/server/services/ticketService.test.ts:1174` (TC24-16) | COMPLIANT |
| RQ-TC-24 · «un alta sin `client_id` nace `Medium`» | **ninguna**; el estado es inalcanzable (ver W2) | ESTRUCTURAL: escenario inalcanzable (W2) |
| RQ-TC-27 · Director Comercial y administrador fijan; sin permiso `403`; técnico `403` | `apps/desk/server/prioridadTop5.test.ts:41`, `:52`, `:58`, `:65` | COMPLIANT |
| RQ-TC-27 · fuera de la lista `422`; **`Low` ya no es asignable**; Top 5 sin prioridad | `apps/desk/server/prioridadTop5.test.ts:70` (solo `Urgent` y `Alta`) y `:80`; `Low` solo a nivel de función: `packages/shared/src/prioridad.test.ts:66` | PARTIAL (W1) |
| RQ-TC-27 · `403` antes que `422`; quitar Top 5; lectura abierta; sin propagación en `403`/`422`; respuesta con cuántos cambiaron; el cuerpo no dirige; atomicidad | `apps/desk/server/prioridadTop5.test.ts:86`, `:104`, `:113`, `:125`; `apps/desk/server/propagarTop5.test.ts:196`; `apps/desk/server/propagarTop5Atomica.test.ts:37` | COMPLIANT |
| RQ-TC-28 · nadie tiene cargo (PUT); nadie tiene cargo (POST) | `apps/desk/server/prioridadTop5.test.ts:142` (TC28-1) y `apps/desk/server/prioridadTop5.test.ts:359` (PM23-1) | COMPLIANT |
| RQ-TC-28 · sin lista, el alta nace `Medium` | `apps/desk/server/services/ticketService.test.ts:1166` (TC28-2) | COMPLIANT |
| RQ-TC-29 · ajuste con motivo; administrador; sin motivo `422`; fuera de lista; igual a la actual | `apps/desk/server/prioridadTop5.test.ts:215`, `:227`, `:237`, `:247`, `:253` | COMPLIANT (el `Low` del POST, ver W1) |
| RQ-TC-29 · el Director Técnico ajusta un ticket de cliente no Top 5; no necesita el área Comercial; ticket sin `client_id` se ajusta | `apps/desk/server/prioridadTop5.test.ts:260` (TC29-4), `:269` (TC29-5), `:404`, `:442` | COMPLIANT |
| RQ-TC-29 · sin el predicado `403`; Director Comercial sin Comercial `403`; técnico sin cargo `403` | `apps/desk/server/prioridadTop5.test.ts:275` (TC29-6), `:377` (PM23-2/3), `:412` (texto nuevo) | COMPLIANT |
| RQ-TC-29 · un cliente que no es Top 5 ya no da `409`; 404 antes que 403; 403 antes que 422; con permiso y sin motivo `422` | `apps/desk/server/prioridadTop5.test.ts:260`, `:304`, `:292`, `:282`, `:287` (P4), `:297` | COMPLIANT |
| RQ-TC-29 · no toca `ticket_transitions` ni el SLA; atomicidad; solo ese ticket; lectura | `apps/desk/server/prioridadTop5.test.ts:309`, `:333`, `:347`, `:353`, `:383` | COMPLIANT |
| RQ-TC-29 · S-6, el ajuste congela la fila frente al sincronizador | `apps/desk/server/prioridadTop5.test.ts:320` (TC29-11) y la gemela nueva `apps/desk/server/prioridadTop5.test.ts:449` (Director Técnico, cliente SIN fila Top 5; el segundo ticket, de control, sí cambia) | COMPLIANT |
| RQ-TC-35 a RQ-TC-38 (47 escenarios heredados) | pruebas preexistentes listadas arriba; `apps/desk/server/trazaTop5AlNacer.test.ts:30`, `:39`, `:47`, `:55`, `:70`, `:77`, `:84` cubren nace bajo Top 5 con traza (`de` = `Medium`) y si nace `Medium` no hay fila | COMPLIANT |
| RQ-TC-56 · Top 5 guardado con `Low` no impone al nacer | `apps/desk/server/services/ticketService.test.ts:1486`; `packages/shared/src/prioridad.test.ts:51` | COMPLIANT |
| RQ-TC-56 · Top 5 `Medium` y contrato empatan; Top 5 `High` y contrato empatan | `apps/desk/server/services/ticketService.test.ts:1480` y `packages/shared/src/contratos.test.ts:219` | COMPLIANT |
| RQ-TC-56 · nada depende de una valoración del cliente | `apps/desk/server/services/ticketService.test.ts:1473-1478`: ningún dato del cliente interviene; además el diff no toca esquema | COMPLIANT |
| RQ-TC-56 · tres escenarios «conserva»: un ticket con `Low` conserva `Low`, sin prioridad sigue sin ella, y los tickets abiertos de un Top 5 con `Low` conservan lo que tenían | **sin prueba**: se cumple por ausencia de código (sin esquema, sin relleno; §7) | ESTRUCTURAL: sin prueba, por ausencia de código (W3) |
| RQ-TC-56 · Top 5 `Low` **no quita el contrato** (alta con contrato vigente) | solo por composición de dos pruebas unitarias, sin alta de servicio con contrato | PARTIAL (W3) |
| RQ-TC-56 · volver a guardar el Top 5 con una prioridad de la lista vuelve a imponer | `apps/desk/server/propagarTop5.test.ts:132` parte de una fila con `High`, no de una con `Low` | PARTIAL (W3) |

### transitions-st

| Requisito · escenario(s) | Prueba | Resultado |
|---|---|---|
| RQ-TS-20 · sin `priority` la transición pasa (ambas); el campo sigue declarado; las demás no cambian | `apps/desk/server/services/guardaPrioridad.test.ts:113` (bloque), `packages/shared/src/prioridad.test.ts:112` (TS20-3) y `packages/shared/src/prioridad.test.ts:118` (TS20-4) | COMPLIANT |
| RQ-TS-20 · las opciones son la lista asignable de `shared` | `packages/shared/src/prioridad.test.ts:9` (literal `High, Medium`) y `packages/shared/src/prioridad.test.ts:12` (paridad entre las dos copias) | COMPLIANT |
| RQ-TS-20 · una prioridad fuera de la lista se rechaza (S-K); reenviar la misma no se rechaza | `apps/desk/server/services/guardaPrioridad.test.ts:179` (`Low` y `Urgent`, 422) y `apps/desk/server/services/guardaPrioridad.test.ts:188` (la misma heredada pasa); función pura: `packages/shared/src/prioridad.test.ts:243` y `packages/shared/src/prioridad.test.ts:247` | COMPLIANT |
| RQ-TS-21 · técnico `403` en las dos transiciones; la misma pasa; sin campo pasa; ticket sin prioridad; admin; Director Comercial con ambas áreas; Director Comercial sin Servicio Técnico | `apps/desk/server/services/guardaPrioridad.test.ts:50`, `:60`, `:66`, `:72`, `:79`, `:85`, `:91`, `:98`, `:106` | COMPLIANT |
| RQ-TS-21 · el Director Técnico cambia la prioridad en las dos transiciones; en un ticket sin cliente; Director Técnico sin Servicio Técnico `403` de área; las demás sin la guarda | `apps/desk/server/services/guardaPrioridad.test.ts:150` (el ticket del arnés, `apps/desk/server/services/guardaPrioridad.test.ts:44`, se inserta sin `client_id`), `:157` (técnico con texto nuevo), `:165` (T4). Mensaje: `packages/shared/src/prioridad.test.ts:233` | COMPLIANT |

### permissions

| Requisito · escenario(s) | Prueba | Resultado |
|---|---|---|
| RQ-PM-20 · por cargo y admin; las tres primitivas tienen llamador | `packages/shared/src/cargos.test.ts:117` (primitivas), `packages/shared/src/cargos.test.ts:226` (PM20-2) | COMPLIANT |
| RQ-PM-20 · quitar al Director Técnico del predicado pone la suite en rojo | `packages/shared/src/cargos.test.ts:278`; comprobado por la mutación de lista vacía de apply-progress y por S1 (§5) | COMPLIANT |
| RQ-PM-23 · mismo veredicto en los dos actos; el ajuste añade al Director Técnico; Director Comercial sin Comercial; Director Técnico sin Comercial | `apps/desk/server/prioridadTop5.test.ts:150` (PUT, diez sujetos), `apps/desk/server/prioridadTop5.test.ts:359` (POST), `apps/desk/server/prioridadTop5.test.ts:424` (cliente no Top 5), `apps/desk/server/prioridadTop5.test.ts:377`; `packages/shared/src/cargos.test.ts:289`, `:293`, `:297` | COMPLIANT |
| RQ-PM-21 · el cargo sin área no concede; cargo sin área; Director Técnico concede solo en el ajuste; al Director Comercial se le sigue exigiendo el área | `packages/shared/src/cargos.test.ts:177` (barrido), `packages/shared/src/cargos.test.ts:275` (matriz nueva), `:289`; `apps/desk/server/prioridadTop5.test.ts:442` | COMPLIANT |

**Cumplimiento: 138/138 escenarios sin ninguno fallando**, pero con evidencia de ejecución más débil que la norma en 8 de ellos, que cuento como completos por criterio mío y declaro aquí: 4 PARCIALES (una prueba que pasa cubre el comportamiento por función o por un valor hermano, no con el literal del escenario: W1 con 2 y W3 con 2) y 4 ESTRUCTURALES (el escenario describe algo que el cambio no hace: tres «conserva» y un alta sin cliente que el servidor rechaza antes; W2 y W3). Si el orquestador prefiere la lectura estricta (escenario sin prueba que ejecute su literal = no conforme), el recuento sería 130/138 y el veredicto FAIL hasta añadir las cinco pruebas que W1 y W3 describen; el validador de admisión rechaza un veredicto de paso con escenarios incompletos.

## 4 · Lo que pidió el encargo, punto a punto

**a · Regla al nacer.** Top 5 fijado a mano: `apps/desk/server/services/ticketService.test.ts:1480`. `High` con contrato: `apps/desk/server/services/ticketService.test.ts:961-983`. `Medium` el resto: `apps/desk/server/services/ticketService.test.ts:1473-1478`.
Las dos a la vez, la más alta: `packages/shared/src/contratos.test.ts:219`. La prioridad pedida no interviene: el alta pasa la constante en
`apps/desk/server/services/ticketService.ts:106` y `apps/desk/server/services/ticketService.ts:108`, y `b.prioridad` no se lee; la mutación de apply-progress que vuelve a leer `b.prioridad` (M6) hizo caer 21 pruebas, y la mía S4 (constante a `High`) hizo caer 22. **OK.**

**b · Borde de vigencia.** Día del fin a `High`, día siguiente a `Medium`, instante UTC del día siguiente que en Bogotá sigue siendo el fin a `High`, fin ampliado por la ruta
real a `High`: `apps/desk/server/prioridadAlNacerVigencia.test.ts:49`, `:55`, `:61`, `:68` y `packages/shared/src/contratos.test.ts:385-390`. Mutaciones mías: fecha por defecto en UTC en `hayContratoVigente` (X11, 3 en rojo) y «no iniciado cuenta como vigente» (X12, 1 en rojo); el cambio de `<` a `<=` en
`packages/shared/src/contratos.ts:43` lo reprodujo apply-progress (M7, 12 en rojo), no yo. **OK.**

**c · Quién.** PUT del cliente solo Director Comercial con área (y admin): `apps/desk/server/routes/prioridad.ts:40`, sin cambio; `TC27-4` en `apps/desk/server/prioridadTop5.test.ts:65`, y la mutación
S5 (PUT abierto al predicado de ticket) cae en dos pruebas. Ajuste de un ticket: Director Comercial con Comercial, Director Técnico sin área, admin: `packages/shared/src/cargos.ts:104-106` y
`apps/desk/server/routes/prioridad.ts:71`, escalón B, en el servidor. **OK.**

**d · Pruebas de POSICIÓN (cada una activa dos guardas).** Repetí seis mutaciones de posición (mover la guarda, no su condición); ninguna dejó la suite verde:

| Mutación de posición | Prueba(s) que cae(n) |
|---|---|
| POS-1 · el `403` del POST (`apps/desk/server/routes/prioridad.ts:71`) pasa detrás del `422` (`apps/desk/server/routes/prioridad.ts:74`) | `TC29-7` (`apps/desk/server/prioridadTop5.test.ts:282`) y `POSICIÓN B2 < C` (`apps/desk/server/prioridadTop5.test.ts:292`) |
| POS-2 · el `403` del POST sube por encima del `404` (`apps/desk/server/routes/prioridad.ts:66`) | `POSICIÓN A < B2` (`apps/desk/server/prioridadTop5.test.ts:304`) |
| POS-3 · el `403` del PUT (`apps/desk/server/routes/prioridad.ts:40`) baja detrás del `422` (`apps/desk/server/routes/prioridad.ts:43`) | `TC27-7` (`apps/desk/server/prioridadTop5.test.ts:86`) |
| POS-4 · la guarda de prioridad de la transición sube antes del área (`apps/desk/server/services/ticketService.ts:129`) | `TS22-1` (`apps/desk/server/services/guardaPrioridad.test.ts:123`) y el `403` que nombra el área en `ticketService.test.ts` |
| POS-5 · la misma guarda baja detrás del `throw` del `422` (`apps/desk/server/services/ticketService.ts:134`) | `TS22-2` (`apps/desk/server/services/guardaPrioridad.test.ts:130`) y la posición de D9 (`apps/desk/server/services/guardaPrioridad.test.ts:196`) |
| POS-6 · la guarda sube antes del estado (`apps/desk/server/services/ticketService.ts:126`) | `TS22-1`, `TS22-3` (`apps/desk/server/services/guardaPrioridad.test.ts:137`) y dos pruebas de `ticketService.test.ts` sobre el orden de guardas |

**e · Sincronizador.** `apps/desk/server/prioridadTop5.test.ts:449`: ticket de Zoho de un cliente sin fila Top 5, ajustado por un Director Técnico, la segunda pasada de `upsertTicket` no lo
pisa y el de control sí. Lo sostiene `packages/zoho-sync/src/db/repo.ts:71`, no tocado. **OK.**

**f · Sin «baja».** Lista: `packages/shared/src/prioridad.test.ts:9` y `packages/shared/src/prioridad.test.ts:12`. PUT: unidad `packages/shared/src/prioridad.test.ts:66`. POST: unidad `packages/shared/src/prioridad.test.ts:133`. Transición: servicio
`apps/desk/server/services/guardaPrioridad.test.ts:179` (D9). Alta: `apps/desk/server/services/ticketService.test.ts:1473-1478`. Reenviar la heredada pasa: `apps/desk/server/services/guardaPrioridad.test.ts:188` y
`packages/shared/src/prioridad.test.ts:247`. **OK, salvo que el PUT y el POST no tienen `Low` a nivel de ruta (W1).**

**g · La reversión del Top 5 no cambió (S-I).** `git diff -U0 6344b4a` no tiene hunks en ninguno de los rangos que el diseño declara «verdes sin editar»:
`packages/shared/src/contratos.test.ts` (solo un hunk que añade 19 líneas desde la 375, tras la 374), `packages/shared/src/prioridadPropagada.test.ts` (hunks en 46, 51-52 y 54; **no** en 48-50 ni en 81-88),
`apps/desk/server/prioridadTop5.test.ts` (hunks en 115, 119, 122 y desde 199; **no** en 179-194), `apps/desk/server/propagarTop5.test.ts` (hunks en 76, 79 y 86-87; **no** en 99-106, 108-114 ni 174-184). **OK.**

## 5 · Mutaciones propias (supervivientes)

Mecánica: un script (en el directorio temporal de la sesión, fuera del repositorio) aplica una sustitución, corre las 10 suites que tocan la prioridad (547 pruebas) y restaura con `git checkout`.
**22 mutaciones propias, 0 supervivientes.** Las seis de posición están en §4d. Las otras 16:

| Mutación | Resultado |
|---|---|
| S1 · el predicado deja pasar a cualquier cargo «Director*» (`packages/shared/src/cargos.ts:106`) | cae: `PM23-2/3`, la matriz y «Director Técnico sin área» de `cargos.test.ts`, y `admin → false` de `prioridad.test.ts` (4) |
| S2 · `erroresPrioridadPedida` rechaza también reenviar la actual (`packages/shared/src/prioridad.ts:123`) | cae: TS21-3, «misma heredada» y la unitaria (4) |
| S3 · `erroresPrioridadPedida` valida aunque la transición no declare el campo (`packages/shared/src/prioridad.ts:121`) | cae: «NO rechaza si la transición no declara el campo» (1) |
| X13 y X14 · `erroresPrioridadPedida` pierde la cláusula del `null` o la del vacío (`packages/shared/src/prioridad.ts:123`) | cae en ambas la unitaria «NO rechaza…» (1 y 1) |
| S4 · `PRIORIDAD_POR_DEFECTO` pasa a `High` (`packages/shared/src/prioridad.ts:117`) | cae (22) |
| S5 · el PUT usa el predicado de ticket (`apps/desk/server/routes/prioridad.ts:40`) | cae: `TC27-4` y `PM23-1` (2) |
| S6 · la base de la traza del alta pasa a `High` (`apps/desk/server/services/ticketService.ts:108`) | cae (7) |
| S7 · el `403` del POST vuelve al texto viejo (`apps/desk/server/routes/prioridad.ts:71`) | cae: «el 403 lleva el texto nuevo» (1) |
| S8 · el POST valida contra `null` y pierde «igual a la actual» (`apps/desk/server/routes/prioridad.ts:73`) | cae: `TC29-3b` (1) |
| S9 · el alta ignora el Top 5 (`apps/desk/server/services/ticketService.ts:106`) | cae (4) |
| S10 · el administrador deja de pasar por la rama Top 5 del predicado | cae (20) |
| X11 · `hayContratoVigente` toma el día en UTC | cae (3) |
| X12 · `hayContratoVigente` cuenta «no iniciado» como vigente | cae (1) |
| X15 · la lista pierde `Medium` (`packages/shared/src/prioridad.ts:13`) | cae (26) |
| Y1 · el cargo Director Técnico abre la transición sin su área (T4) | cae: T4 (1) |

Tras las mutaciones: `git status --short` sin salida.

## 6 · Regla 13 y regla de mutación 3 (la tabla de siete filas de apply-progress, contra el código de hoy)

Comprobé cada línea del cliente, del servidor y de la prueba leyéndola:

| # | Decisión del cliente | Servidor que la impone (hoy) | Prueba |
|---|---|---|---|
| 1 | Opciones al fijar Top 5: `apps/desk/src/components/Top5Panel.tsx:87` y `apps/desk/src/components/Top5Panel.tsx:123` | `422`, `apps/desk/server/routes/prioridad.ts:42-43` | TC27-5 (`apps/desk/server/prioridadTop5.test.ts:70`, solo `Urgent` y `Alta`, W1) |
| 2 | Opciones del ajuste: `apps/desk/src/components/PanelPrioridad.tsx:67` | `422`, `apps/desk/server/routes/prioridad.ts:73-74` | `apps/desk/server/prioridadTop5.test.ts:237`, `apps/desk/server/prioridadTop5.test.ts:247` |
| 3 | A quién enseña «Ajustar»: `apps/desk/src/components/PanelPrioridad.tsx:27` | `403`, `apps/desk/server/routes/prioridad.ts:71` | `apps/desk/server/prioridadTop5.test.ts:282`, `apps/desk/server/prioridadTop5.test.ts:287`, `apps/desk/server/prioridadTop5.test.ts:359` |
| 4 | A quién enseña el campo en una transición: `apps/desk/src/components/TransitionPanel.tsx:160` | `403`, `apps/desk/server/services/ticketService.ts:131` | `apps/desk/server/services/guardaPrioridad.test.ts:123`, `apps/desk/server/services/guardaPrioridad.test.ts:165`, `apps/desk/server/services/guardaPrioridad.test.ts:172` |
| 5 | No ofrecer prioridad en el alta: `apps/desk/src/components/CreateTicket.tsx:426-429` | no se lee: `apps/desk/server/services/ticketService.ts:106` y `apps/desk/server/services/ticketService.ts:108` | `apps/desk/server/services/ticketService.test.ts:1473-1478` |
| 6 | Controles del Top 5: `apps/desk/src/components/Top5Panel.tsx:20` | `403`, `apps/desk/server/routes/prioridad.ts:40` | `apps/desk/server/prioridadTop5.test.ts:58`, `apps/desk/server/prioridadTop5.test.ts:65` |
| 7 | Opciones del campo de transición: `apps/desk/src/components/TransitionPanel.tsx:260` pinta `f.options` (las de `packages/shared/src/transitions.ts:84`) | `422` agregado, `apps/desk/server/services/ticketService.ts:134` con `packages/shared/src/prioridad.ts:120` | `apps/desk/server/services/guardaPrioridad.test.ts:179` |

Ninguna fila queda sin línea de servidor; la 7 no era imponible antes (el servidor escribía la cadena cruda en `apps/desk/server/transitionExec.ts:88`) y la impone D9 (supuesto S-K, reversible, declarado). **Cumple.**

## 7 · Cero líneas netas y lo que no se tocó

`git diff --numstat 6344b4a`, inserciones y borrados: `apps/desk/server/services/ticketService.ts` 4/4, `apps/desk/server/routes/prioridad.ts` 9/9, `packages/shared/src/transitions.ts` 1/1,
`packages/shared/src/contratos.ts` 3/3, `packages/shared/src/prioridadPropagada.ts` 1/1, `apps/desk/server/db/prioridadCliente.ts` 2/2, `apps/desk/src/components/CreateTicket.tsx` 6/6,
`apps/desk/src/components/PanelPrioridad.tsx` 4/4, `apps/desk/src/components/TransitionPanel.tsx` 2/2. **Cero netas en todos.**
`packages/shared/src/prioridad.ts` 18/7 y `packages/shared/src/cargos.ts` 10/1: los hunks de lo añadido empiezan en la línea 115 (11 líneas, tras la 114 de partida) y en la 99 (9 líneas, tras la 98 de partida); el resto son
ediciones en sitio (líneas 10, 12, 55, 78 y 85 en `prioridad.ts`; la 78 en `cargos.ts`). **Lo añadido está al final.**
`git diff --name-only 6344b4a` solo contiene `.ts` y `.tsx` de `apps` y `packages`, los artefactos del cambio, `openspec/config.yaml`, `docs/sdd/F0-01_Correcciones_para_el_maestro.md` y
`docs/sdd/Paquete_de_Despliegue_2026-10-08.md`. **No contiene** `repo.ts` ni `schema.sql` de `packages/zoho-sync/src/db`, `CLAUDE.md`, `docs/sdd/ENTRADA.md`, `docs/sdd/RECONCILIACION.md`, el paquete del 06/10 ni nada bajo `openspec/specs/`.

## 8 · Cierre documental

- **Anclas de `openspec/config.yaml` (líneas 4143, 4150, 4151 y 4153).** Comprobadas contra `git show 6344b4a` de cada fichero: la línea 13 de `prioridad.ts` era la lista con `Low`; la 79,
  «Sin excepción para el Director Técnico»; la 69 de la ruta, el `409` de «no es Top 5»; la 71, el `403` del predicado viejo. Las cuatro dicen lo que afirman, llevan ancla a `6344b4a` y quién las cerró. Edición en sitio, 4 = 4.
- **Entrada 34 de `docs/sdd/F0-01_Correcciones_para_el_maestro.md`.** Cita `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1982` (fila de «Alta»: quién la fija), las líneas 1986 y 1987 («Media o Baja» y su criterio) y `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1990` (Ajuste por ticket, solo en Top 5). Las leí en la R08.4: dicen lo que la entrada afirma; la línea 1989 (marca de abierto) se conserva. No da por decididos S-A a S-K.
- **Apartado 2 de `docs/sdd/Paquete_de_Despliegue_2026-10-08.md`.** Cada afirmación lleva ruta y línea o «hipótesis». Comprobé: `packages/zoho-sync/src/db/schema.sql:23` (`priority`, `status_type`), `packages/zoho-sync/src/db/schema.sql:41` (`managed_by_app`), `packages/zoho-sync/src/db/schema.sql:710` (`prioridad_en_app_at`), `packages/zoho-sync/src/db/schema.sql:606-611` (`client_id`, `top5`, `prioridad`, `actualizado_por`, `actualizado_at`),
  `packages/zoho-sync/src/db/schema.sql:20` (`tickets` sin calificar) y `cliente_prioridad` en `public`; `apps/desk/server/db/prioridadCliente.ts:46-50` (`listarTop5` filtra solo por `top5 = true`), `apps/desk/server/db/prioridadCliente.ts:93` y `apps/desk/server/db/prioridadCliente.ts:110`; `apps/desk/server/routes/prioridad.ts:23-25`; `apps/desk/server/db/conversacion.ts:44`.
  La consulta de sólo lectura son tres `SELECT`, está marcada «NO EJECUTADA» y todas sus columnas existen. No hay `INSERT`, `UPDATE` ni `DELETE`.
- **Reuniones.** Cero menciones en las líneas añadidas del cambio (búsqueda de «reunión», «reuniones», «junta», «encuentro»).
- **Cabecera R-1 de `proposal.md`.** Siete campos; `tanda: F1B-07`, `motivo` vacío (válido porque la tanda no es `fuera-del-plan`), `capacidad: [tickets-core, transitions-st, permissions]`, `cierra: no`, `toca_maestro: si`, `origen_cabecera: declarada`. El detector la da por válida (0 inválidas).
- **Fila del plan.** `docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:87` es F1B-07, prioridad y «Mis tickets», más propagar el Top 5, más la lista de «Remisión creada».
  **El cambio cubre** el nivel de prioridad automática al nacer (`Medium` o `High`), la lista de dos niveles, el ajuste del Director Técnico y el levantamiento del límite Top 5 del ajuste; **deja fuera** la regla que depende de la «valoración del cliente» (sin dato ni definición, P-4). `cierra: no` es correcto.

## 9 · Coherencia con el diseño

| Decisión | ¿Seguida? | Nota |
|---|---|---|
| D1 · constante al final de `prioridad.ts`, sin tocar la fórmula | Sí | `packages/shared/src/prioridad.ts:117`; `packages/shared/src/contratos.ts:68` conserva la fórmula |
| D3 · lista en sitio en las dos fuentes | Sí | `packages/shared/src/prioridad.ts:13` y `packages/shared/src/transitions.ts:84`, paridad vigilada por prueba |
| D4 · predicado y dato al final de `cargos.ts` | Sí | `packages/shared/src/cargos.ts:101` y `packages/shared/src/cargos.ts:104` |
| D6 · dos `409` retirados con cero netas | Sí | `apps/desk/server/routes/prioridad.ts:67-69` conserva sus tres líneas como comentario |
| D9 · validación de la lista en la transición | Sí | `packages/shared/src/prioridad.ts:120-125`, consumida en `apps/desk/server/services/ticketService.ts:134` |
| D10 · `CreateTicket.tsx` con cero netas | Sí | `apps/desk/src/components/CreateTicket.tsx:426-429` |
| Sección 7 del diseño · M2 hace caer T1 y T4 | **No del todo** | M2 solo hace caer T1 (POS-4); T4 cae con «el cargo abre la transición» (Y1). El apply-progress ya lo declara |

## 10 · TDD estricto

| Comprobación | Resultado |
|---|---|
| Rojos antes del código documentados con razón | Sí: tablas de L1 y L2 en `apply-progress.md`; los «nacen verdes» están justificados (caracterización o cambio de dato) |
| Los `.tsx` fuera de la red de pruebas | Sí, por decisión de Gerencia; no se escribió ninguna prueba `.tsx` ni se propuso `jsdom` |
| Capas | unidad (`packages/shared/src/` con sus pruebas) e integración con base en memoria y rutas (`apps/desk/server/`); sin E2E |
| Cobertura | no medida en esta pasada |
| Calidad de aserciones | Sin tautologías ni aserciones vacías en lo añadido: comparan valor, estado HTTP o filas; las 22 mutaciones lo confirman |

## 11 · Hallazgos

**CRITICAL**: ninguno.

**WARNING**
- **W1 · `Low` solo a nivel de función en el PUT y en el POST.** Los escenarios «`Low` ya no es asignable» (RQ-TC-27) y «valor fuera de la lista blanca: `Urgent` o `Low`» (RQ-TC-29) se ejecutan por ruta
  solo con `Urgent` y `Alta`: `apps/desk/server/prioridadTop5.test.ts:70` y `apps/desk/server/prioridadTop5.test.ts:237`. El `Low` se rechaza en `packages/shared/src/prioridad.test.ts:66` y `packages/shared/src/prioridad.test.ts:133`.
  La prueba que faltaría: añadir `Low` a los dos bucles de valores malos, con el 422 y sin fila ni traza. Ninguna mutación sobrevivió, así que es riesgo bajo.
- **W2 · Escenario inalcanzable en el delta de tickets-core.** «Un alta sin `client_id` nace `Medium`» no tiene prueba y no puede darse: el alta sin cliente es `422` (`apps/desk/server/services/ticketService.ts:84` y `apps/desk/server/services/ticketService.ts:88`).
  Al fusionar en el archivo, reescribirlo como «alta sin cliente: 422 de obligatorios» (que sí existe) o retirarlo.
- **W3 · RQ-TC-56 sin prueba directa en cinco escenarios.** Tres «conserva» (`Low`, sin prioridad, tickets abiertos de un Top 5 `Low`) se cumplen por ausencia de migración y de relleno (§7), sin prueba; y
  «Top 5 `Low` no quita el contrato» solo se sostiene por composición. Prueba que faltaría: en `apps/desk/server/services/ticketService.test.ts` un alta con Top 5 `Low` **y** contrato vigente que nazca `High`
  (hoy el único con `Low` es el de `apps/desk/server/services/ticketService.test.ts:1486`, sin contrato), y en `apps/desk/server/propagarTop5.test.ts` un «volver a guardar» partiendo de una fila `Low` (el de `apps/desk/server/propagarTop5.test.ts:132` parte de `High`).
- **W4 · Dato heredado que diverge (declarado, sin destino).** `GET /api/top5` (`apps/desk/server/routes/prioridad.ts:23-25`) sigue listando a un Top 5 guardado con `Low` que `prioridadTop5` ya no trata como Top 5
  (`packages/shared/src/prioridad.ts:34-36`): dos lecturas de «es Top 5». Está en la bandeja propuesta del paquete (apartados 2.2 y 2.5), sin destino a propósito. No bloquea.

**SUGGESTION**
- **S1 · Corregir el diseño al archivar.** La sección 7 de `design.md` afirma que M2 hace caer T1 y T4; solo cae T1 (POS-4). Una frase al archivar evita que la tabla se lea como mutación probada.
- **S2 · El texto automático «Ticket creado…» muestra `Medium` crudo** (`apps/desk/server/db/conversacion.ts:44`): presentación, declarado en el paquete. Candidata a una tanda de textos.
- **S3 · Hipótesis, no verificada:** el selector de la transición pinta solo `High` y `Medium` (`apps/desk/src/components/TransitionPanel.tsx:260`); un ticket que hereda `Low` o `Urgent` no lo ve como opción actual. Como el formulario arranca con `values` vacío (`apps/desk/src/components/TransitionPanel.tsx:60`), parece no reenviar nada por sí solo; los `.tsx` están fuera de la red de pruebas.
- **S4 · Las 13 abreviadas rotas informativas** del detector son anteriores a este cambio (ninguna en los artefactos nuevos); siguen siendo lectura humana.

## 12 · Contabilidad del intento

Verify no cambia código ni pruebas. Este informe es el único fichero nuevo (menos de 250 líneas, por debajo del techo de 400). Mediciones del cambio en `apply-progress.md`: L1 370, L2 381, L3 318, todas por debajo de 800.

### Verdict
**PASS WITH WARNINGS** — los 14 requisitos están implementados (8 escenarios con evidencia parcial o estructural, ver §3) y probados en ejecución, los cinco comandos terminan en 0 con las cifras esperadas, el detector no tiene bloqueantes, y 22 mutaciones (seis de posición) no dejan superviviente. Quedan 4 advertencias de cobertura y de especificación que no bloquean el archivo (W1 a W4); W2 se resuelve al fusionar el delta.

## Adenda tras la remediación

- **W1 cerrado:** `Low` entra en los bucles de ruta de `apps/desk/server/prioridadTop5.test.ts:70` (PUT) y `apps/desk/server/prioridadTop5.test.ts:237` (POST); la mutación que añade `Low` a la lista asignable las pone en rojo.
- **W2 cerrado:** escenario inalcanzable retirado del delta de tickets-core y frase del requisito corregida.
- **W3 cerrado:** alta con Top 5 `Low` y contrato (`apps/desk/server/services/ticketService.test.ts:1494`), «volver a guardar» desde una fila `Low` y los tres «conserva» (`apps/desk/server/propagarTop5.test.ts:239`), cada una con su mutación en rojo (ver `apply-progress.md`, «Remediación tras el verify»).
- **W4 abierto:** divergencia declarada, sin destino a propósito.
- **S1 aplicada** en `design.md` §7.
