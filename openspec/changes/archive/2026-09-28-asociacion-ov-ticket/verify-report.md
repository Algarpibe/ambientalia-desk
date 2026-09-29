```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:2630e7af043f0daf26aa7169f25fc0d65d9c4f6b326d515227281ed59c8e8b4b  # sha256 de npm test + npm run build, re-ejecutados por el orquestador tras la remediación (el primer verify, sobre 2c43e5c, dio sha256:e3d4ca40…57f7 y FAIL)
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 10/10
scenarios: 24/24
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:0c79b2a8ae253498dc397581cdab0e2e93b42cd5b4833da6abf7ce6fcef3b9b1
build_command: npm run build
build_exit_code: 0
build_output_hash: sha256:53de2702aee467ce190029a171185e05c2f3152382780c9d1a995a9bae9cf2bf
```

## Verification Report

**Change**: `asociacion-ov-ticket` (F1B-11, cambio 2 de 3, `cierra: no`)
**Versión**: primer verify sobre `2c43e5c` (FAIL, commit `d9f51ae`); re-verify sobre la remediación, que se commitea junto a este informe. Seis lotes: `4501784`, `2fca58c`, `f3e8bdc`, `0537b3f`, `1c1b5d7`, `2c43e5c`
**Modo**: Strict TDD, almacén hybrid
**Único cambio sin commitear**: `design.md:112` (nota de comodidad declarada, del orquestador). No se toca.

Convención de estado, la del precedente (`archive/2026-09-28-parche-iv11-orden-venta/verify-report.md`):
**PASS** = una prueba que pasó en esta sesión afirma el THEN del escenario; **PARTIAL** = el THEN sólo se
sostiene en parte, o por construcción del código, sin prueba que lo afirme entero; **FAIL** = el THEN no se
cumple en el código, o ninguna prueba lo afirma y la lectura muestra que no se cumple.

### Completeness
| Métrica | Valor |
|---|---|
| Lotes (tasks.md) | 6/6 completos |
| Subtareas | 123 `[x]`, 0 `[ ]` (`grep -c` sobre `tasks.md`) |
| Matriz de cobertura de `tasks.md:448-478` | declara 24/24; la matriz cuenta **tareas**, no pruebas que afirmen el THEN (ver CRITICAL 1) |
| Tareas de persona (fuera del recuento, regla del ciclo 1) | P.1, P.2, P.3, P.4: `tasks.md:481-496` |

**Tareas de persona — archivar NO las da por hechas** (`tasks.md:483`):

| # | Dueño | Qué | Destino / dónde queda escrito |
|---|---|---|---|
| P.1 | Alfonso | Ejecutar `docs/sdd/Consulta_SubOV_formato_2026-09-27.sql` (sólo lectura), devolver la salida: cuántas OV caen en cuarentena el día uno | `tasks.md:485-488` y `openspec/config.yaml` |
| P.2 | Gerencia | Relleno retroactivo de asociaciones para tickets/OV existentes (dato de producción) | `tasks.md:489-493`; P.2 del cambio 1, `archive-report.md:78` |
| P.3 | Comercial | Verificar en la app, tras el despliegue del lote 6: lista de OV en la ficha, «liberar» con rol y motivo, cuarentena y saldo | `tasks.md:494-496` |
| P.4 | Alfonso | Consulta 5 del `.sql`: valores distintos de `order_status`/`status` de `books.sales_orders`; confirma los literales `draft`/`void` (S-11) | `tasks.md:498`; `config.yaml` → `adenda_iv11_asociacion_ov_ticket` (`:3141`) |

Reverso de la regla del ciclo 1: ninguna describe trabajo que una tanda pueda hacer en el repositorio
(las cuatro dependen de datos de producción o de la app desplegada). Sacarlas del recuento no maquilla el contador.

### Build & Tests Execution
**Corrida focalizada de este verify** (los once ficheros de prueba que este cambio toca o añade):
`npx vitest run apps/desk/server/db/eliminarTicket.test.ts apps/desk/server/ordenVentaUnTicket.test.ts
apps/desk/server/remisiones.test.ts apps/desk/server/routes/ovAsociaciones.test.ts
apps/desk/server/services/ticketService.test.ts apps/desk/server/transitionExec.test.ts
packages/shared/src/subOV.test.ts packages/zoho-sync/src/books/repo.test.ts
packages/zoho-sync/src/books/subOV.test.ts packages/zoho-sync/src/db/migrate.test.ts
packages/zoho-sync/src/db/ovAsociaciones.test.ts` → **11 ficheros pasan, 299 pruebas pasan, 0 fallan**.

`npm test` completo, `typecheck`, `eslint` y `build`: ver «Cifras re-ejecutadas por el orquestador». Este verify
no los repite.

### Cifras re-ejecutadas por el orquestador
| Comando | Resultado |
|---|---|
| `npm test` | 150 ficheros y 1.614 pruebas en verde; 1 fichero y 2 pruebas omitidos (`migrate.integration.test.ts`, como siempre) |
| `npm run typecheck` | salida 0, limpio |
| `npx eslint . --max-warnings 165` | 165 avisos, 0 errores |
| `npm run build` | salida 0 |

**Re-verify, tras la remediación:** `npm test` 150 ficheros y 1.622 pruebas en verde (1 y 2 omitidos, los de siempre); `typecheck` salida 0; `eslint --max-warnings 165` 165 avisos, 0 errores; `build` salida 0. Hashes en la cabecera.

### Mutaciones reproducidas por el orquestador
Todas revertidas y comprobadas con `cmp`.

| Mutación | Resultado |
|---|---|
| Puerta 1, alta: la guarda de cuarentena de `ticketService.ts:96` movida DETRÁS del `409` de unicidad | 1 roja: «4.5 · POSICIÓN alta…: gana el 422 (C), no el 409 (D)» |
| Puerta 2, transición: los errores de cuarentena de `ticketService.ts:134` sacados del `422` y evaluados DETRÁS del `409` de `:150-151` | 1 roja: «4.9 · POSICIÓN habilitar_servicio…» |
| Puerta 3, remisión: la cuarentena de `remision.ts:220` movida DETRÁS del `409` de la tercera puerta | 1 roja: «4.13 · OV en cuarentena y YA usada por otro ticket: 422 de cuarentena, no 409…» |
| **Sonda del CRITICAL 1** (prueba temporal, borrada tras ejecutarla): ticket con `orden_venta`/`salesorder_id` = OV-2026-900, asociación vigente, `liberarAsociacion`, y `ticketConOrdenVenta` desde otro ticket | `expected { id: 't-a', number: 9001 } to be null`: **tras liberar, la puerta sigue encontrando la OV en las columnas del ticket que la liberó**. Confirma el CRITICAL por ejecución, no sólo por lectura |

La mutación que el CRITICAL echaba en falta, **reproducida en el re-verify**:

| Mutación (remediación) | Resultado |
|---|---|
| Quitar la limpieza de columnas de `liberarAsociacion` (`if (liberada && false)`) | 5 rojas: las tres puertas (`RUT:181-183`), el buscador (`RUT:193`) y la estructural de liberar (`RUT:241`) |
| Remisión: `asociarOV(db, …)` en vez del cliente de la transacción `q` | 1 roja: `RUT:248`, las dos sentencias ya no comparten cliente |

Ambas revertidas y comprobadas con `cmp`. **Límite declarado:** pg-mem no deshace un `ROLLBACK`, así que la atomicidad no se prueba; lo que se prueba es que las dos sentencias de liberar y las dos de la remisión van por el MISMO cliente entre `BEGIN` y `COMMIT` (`RUT:240-254`, pool envoltorio que registra cliente y sentencia).

---

## a) Los escenarios, uno por uno

Diez requisitos, 24 escenarios (más RQ-TS-09, sin escenarios, verificado por sus afirmaciones). Rutas de prueba
abreviadas: `TS` = `apps/desk/server/services/ticketService.test.ts`; `OVU` = `apps/desk/server/ordenVentaUnTicket.test.ts`;
`REM` = `apps/desk/server/remisiones.test.ts`; `RUT` = `apps/desk/server/routes/ovAsociaciones.test.ts`;
`OA` = `packages/zoho-sync/src/db/ovAsociaciones.test.ts`; `BR` = `packages/zoho-sync/src/books/repo.test.ts`;
`BS` = `packages/zoho-sync/src/books/subOV.test.ts`; `SO` = `packages/shared/src/subOV.test.ts`;
`TX` = `apps/desk/server/transitionExec.test.ts`; `EL` = `apps/desk/server/db/eliminarTicket.test.ts`.

### tickets-core

| Req | Escenario | Prueba que afirma el THEN | Estado |
|---|---|---|---|
| RQ-TC-08 | El alta sin cambios sigue igual | `OVU:246` «2.9 · regresión: el alta con una OV libre y sin ninguna asociación previa sigue en 201» (`expect(res.status).toBe(201)`) | PASS |
| RQ-TC-08 | La asociación vigente por la tercera vía bloquea el alta | `OVU:233` «2.9 · la asociación vigente sin coincidencia por columna bloquea el alta con 409 y no escribe nada» (409, texto con `7001`, 1 ticket, 1 fila vigente) | PASS |
| RQ-TC-08 | Las pruebas de posición existentes no cambian | `git diff 8a46998^ HEAD` sobre `OVU` y `REM`: 268 inserciones y **2 borrados, los dos son la línea `import`** (se añade `asociarOV`); ningún `it` ni `expect` previo cambia. `REM:988` sigue siendo «serial vacío y remisión pendiente a la vez: 422 por el serial, no 409 por la pendiente». Corrida verde | PASS |
| RQ-TC-17 | Escribir la OV crea la asociación en la misma transacción | `TS:681` (alta: `ticket_id`, `numero`, `salesorder_id`, origen alta, `asociada_por` Admin, `liberada_at` nulo), `TS:693` (rama «Equipo nuevo», transacción propia), `TS:705` (sin OV no asocia, S-4) | PASS (ver SUGGESTION 1) |
| RQ-TC-17 | Segunda asociación vigente rechazada por la base | `OA:33` (23505 → `OvYaAsociadaError`, status 409) y `RUT:256` «carrera en la remisión: otro commit se cuela entre la guarda y el INSERT → 409 …, no 500». *Primer verify: PARTIAL (salía 500).* | PASS |
| RQ-TC-18 | subOV con sufijo no canónico rechazada antes de la unicidad | Las tres puertas: alta `TS:887` y posición `TS:896`; transición `TS:910` y posición `TS:920` (más OV adicional `TS:933`); remisión `REM:1260`, con control de población `REM:1273` y A antes que C `REM:1281`. Cada posición activa las dos guardas a la vez y contrasta con el 409 de la subOV canónica | PASS |
| RQ-TC-18 | OV simple y OVI no entran en cuarentena | `SO:31` `it.each(ordinarias)`, que incluye `OV-2026-001` y `OVI-2026-001` (`SO:29-30`); `esCuarentena` es falso | PASS |
| RQ-TC-19 | Liberar conserva la fila con su motivo | `OA:64` (fecha, persona, motivo, `liberada_at`), `RUT:80` «liberar conserva la fila (el recuento no cambia) y guarda quién y por qué» | PASS |
| RQ-TC-19 | Sin rol Comercial, la liberación se rechaza | `RUT:31` matriz por área: Servicio Técnico y Compras sola dan 403 y la fila queda con `liberada_at` y `motivo_liberacion` en NULL (`RUT:47-51`); `RUT:98` «sin Comercial Y motivo vacío → 403, no 422» | PASS |
| RQ-TC-19 | Tras liberar, la OV es reasociable | `RUT:179-191` con un ticket que TIENE la OV en columnas y asociación: tras liberar por la ruta, las tres puertas la aceptan (alta 201, `habilitar_servicio` 200, remisión 201); `RUT:193` `soloLibres` la vuelve a ofrecer, el ticket liberador queda sin OV y con `ov_elegida_en_app_at`, y un ticket con OTRA OV no se limpia. *Primer verify: FAIL (CRITICAL 1).* | PASS |
| RQ-TC-20 | La ficha devuelve las dos listas | `RUT:63` «devuelve las vigentes y las liberadas, distinguibles por liberada_at» (2 filas, `liberada_at` nulo y no nulo, la del otro ticket fuera) | PASS |

### transitions-st

| Req | Escenario | Prueba que afirma el THEN | Estado |
|---|---|---|---|
| RQ-TS-14 | `habilitar_servicio` sin cuarentena sigue igual | Asociación escrita: `TS:711` (por número, `salesorder_id` resuelto), `TS:722` (S-12, NULL), `TS:732` (idempotente). 200 «igual que hoy»: `OVU:291` «excluye al propio ticket» (status 200) | PASS |
| RQ-TS-14 | OV en cuarentena bloquea antes de la unicidad | `TS:910` (422 en `errors`, `orden_venta` sigue NULL) y `TS:920` POSICIÓN (dueño con la OV por columna y asociación: 422; con subOV canónica, 409) | PASS |
| RQ-TS-18 | Tras `Aprobación` con OV nueva, la de entrada no cambia | `TS:766` (dos vigentes exactas, `orden_venta`/`fecha_orden_venta` intactas, jsonb sin la OV), `TS:787` (`aprobacion_y_repuestos`), `TS:819` S-10; guardianes del catálogo `TX:193`, `TX:244`, `TX:267`, `TX:271` | PASS |
| RQ-TS-18 | La fecha de OC vive en la asociación nueva | THEN corregido en la spec (S-5): `TS:804` afirma la fecha en la asociación, `fecha_orden_compra` del ticket NULL, `fecha_orden_compra_final` conservada y `orden_venta`/`fecha_orden_venta` de entrada intactas (las dos últimas aserciones las añadió el orquestador en el re-verify; nacen verdes porque afirman el comportamiento vigente). *Primer verify: PARTIAL.* | PASS |

**RQ-TS-09 (MODIFIED en el lote 6, sin escenarios).** Sus afirmaciones, una a una:
- Fila `ovAdicional` a `plan.ovAdicional`, nunca columna ni `custom_fields`: `transitionExec.ts:88` la contiene; `TX:193` (`columns` y `customFields` vacíos) y `TX:200` la fijan. PASS.
- La clave `OV adicional` no está en `PROMOTED_COLUMNS`: `TX:220`. PASS.
- `aprobacion_y_repuestos` sin `campoFecha`, `aprobacion` con `Fecha Orden de Venta Final`: `TX:267`, `TX:271`. PASS.
- «27 etiquetas … de las 39 que ese mapa declara»: ninguna prueba cuenta 27 ni 39, y la spec viva añade justo ahí el paréntesis «F1A-04: 28 de 40» (`openspec/specs/transitions-st/spec.md:306-307`); un MODIFIED que reemplaza el requisito completo lo pierde. `rows.ts` declara hoy 40 entradas de `PROMOTED_COLUMNS` (conté las líneas `{ col:`); el 28 no lo re-medí: hipótesis. Ver WARNING 3. Estado del requisito: PASS con WARNING.

### remisiones

| Req | Escenario | Prueba que afirma el THEN | Estado |
|---|---|---|---|
| RQ-RE-16 | Orden ya asociada a otro ticket, rechazada antes de escribir | Vía columna: `OVU:161` (409, `7001`, sin filas nuevas por id ni por número). Vía asociación: `REM:1199` (409, texto con `7700`, columnas del destino en NULL, 1 fila vigente) | PASS |
| RQ-RE-16 | El 422 del serial gana al 409 nuevo | `REM:1060` (IV-4, cambio anterior, intacta) y `REM:1214` POSICIÓN: sin serial y OV asociada por tercera vía da 422 «Falta el serial»; con serial, 409 | PASS |
| RQ-RE-16 | Reenviar la misma orden al propio ticket | `OVU:185` «reenviar la misma orden al propio ticket no se rechaza a sí mismo: 201 y el UPDATE es no-op» (`despues` igual a `antes`) | PASS |
| RQ-RE-16 | El UPDATE deja la orden protegida del sincronizador | Marca: `REM:229` (`ov_elegida_en_app_at` nulo antes, no nulo después). El sync no pisa: `packages/zoho-sync/src/db/repo.test.ts:300` (cambio 1, sin tocar aquí) | PASS |
| RQ-RE-16 | OV en cuarentena bloquea la remisión antes del 409 | `REM:1260` (422 con el número, destino sin escribir, el dueño ya tiene la OV) y control `REM:1273` (subOV canónica, 409) | PASS |
| RQ-RE-16 | El UPDATE también crea la fila de asociación | `REM:1168` (una fila con origen remisión, `liberada_at` nulo), `REM:1184` (ticket que ya tenía OV: no asocia) | PASS (ver WARNING 2) |

### zoho-sync

| Req | Escenario | Prueba que afirma el THEN | Estado |
|---|---|---|---|
| RQ-ZS-14 | Una OV con asociación vigente no aparece en `soloLibres` | `BR:91` (asociada por id y sólo por número fuera; la libre dentro; sin `soloLibres` salen las tres) | PASS |
| RQ-ZS-14 | Una subOV en cuarentena no aparece en el buscador ni en el saldo | `BS:79` (`OV-2026-170-X9` fuera de `soloLibres` y del saldo, `creadas` 5, dentro de `listarCuarentena` con su motivo); `BR:119` con y sin `soloLibres`; `BR:125` el límite cuenta tras quitar la cuarentena | PASS |
| RQ-ZS-14 | El saldo del lote cuenta correctamente | `BS:46` «cinco subOV canónicas (2 vigentes, 3 libres) y una sexta en cuarentena → 5/2/3/40» (`toEqual` exacto con `consumido` 40); `BS:51` S-11; `BS:58` liberada cuenta como libre; `BS:72` lote vacío sin división por cero | PASS |

### Recuento

| Estado | N | Escenarios |
|---|---|---|
| PASS | 24 | todos |
| PARTIAL | 0 | — (en el primer verify: RQ-TC-17 y RQ-TS-18, resueltos por la remediación) |
| FAIL | 0 | — (en el primer verify: RQ-TC-19, resuelto por la remediación) |

Requisitos: 10, los 10 sin escenario PARTIAL ni FAIL.

---

## b) Las tres puertas

| Puerta | Cuarentena (C) | Unicidad (D), tercera vía | Escritor de la asociación |
|---|---|---|---|
| Alta | `ticketService.ts:96` (`motivoCuarentena` a 422, en la misma línea que abre el 409) | `ticketService.ts:96-100` (`ticketConOrdenVenta` con `salesorderId` y número) | `equipoNuevo.ts:86-99` dentro de `enTransaccion` (sólo con `salesorderId` y `ordenVenta`, S-4) |
| Transición | `ticketService.ts:134` (`erroresCuarentena` junto a los errores del plan, 422 en `errors`) | `ticketService.ts:148-152` (`plan.columns.orden_venta ?? plan.ovAdicional`, excluye el propio ticket) | `repo.ts:311` (`asociarDesdeTransicion` tras el `UPDATE`, dentro del `BEGIN` de `applyTransition`, `repo.ts:338`) |
| Remisión | `remision.ts:220` (`!ov || motivoCuarentena`, A y luego C) | `remision.ts:230-235` | `remision.ts:243` (`asociarOV(db, …)` si el `UPDATE` devolvió fila) |

La tercera vía vive en un solo sitio, `repo.ts:362-379` (`ticketConOrdenVenta`: subconsulta sobre `ov_asociaciones` con `liberada_at IS NULL`, línea `:371`), y las tres puertas la consumen. Su prueba unitaria: `OA:128` (por número y por id), `OA:137` (excluye al propio ticket), `OA:145` (la liberada ya no cuenta).

**Pruebas de posición, con nombre y línea:**

| Puerta | Prueba | Qué fija |
|---|---|---|
| Alta | `TS:896` «4.5 · POSICIÓN alta: la OV en cuarentena YA está en otro ticket (columna y asociación): gana el 422 (C), no el 409 (D)» | C antes que D, con control de población (subOV canónica, 409) |
| Alta | `OVU:258` «POSICIÓN · faltan obligatorios (C) y la OV está asociada por tercera vía (D): gana el 422; con todo completo, el 409» | obligatorios (C) antes que la tercera vía (D) |
| Transición | `TS:920` «4.9 · POSICIÓN habilitar_servicio: la OV en cuarentena YA está en otro ticket: gana el 422 (C), no el 409 (D)» | C antes que D |
| Transición | `OVU:305` «POSICIÓN · falta un obligatorio (C) y la OV está asociada por tercera vía (D): gana el 422; completo, el 409» | obligatorio (C) antes que la tercera vía (D) |
| Remisión | `REM:1214` «POSICIÓN · sin serial (A) y OV asociada por tercera vía (D)» | el 422 del serial gana al 409 |
| Remisión | `REM:1229` «POSICIÓN · OV inexistente en Books (A) pero asociada por id a otro ticket (D)» | «no encontrada» antes que el 409 |
| Remisión | `REM:1260` y `REM:1281` | C antes que D, y A antes que C |

Cada una activa las dos guardas a la vez y contrasta con la población de control (regla de mutación 1). Las tres mutaciones de posición (`apply-progress.md:379-381`) las reproduce el orquestador.

**IV-12, registrado y no corregido.** La cuarentena de la remisión (`remision.ts:220`) corre detrás del 409 de remisión pendiente (`remision.ts:177`, escalón D también): una subOV en cuarentena sobre un ticket con remisión sin desenlace ve el 409 de la pendiente y no el 422 de cuarentena. Ninguna prueba fija ese par, a propósito: fijarlo lo declararía correcto. Está escrito en `REM:1249-1254`, en `apply-progress.md:388` y en la fila IV-12 de `CLAUDE.md`. Mismo molde que IV-12 (`remision.ts:127` antes que `:155`). No es un defecto de este cambio.

---

## c) Regla invariable 13: decisiones del cliente contra la tabla del lote 6

Ficheros de cliente tocados (`git diff --stat 4501784^ HEAD -- apps/desk/src`): `api/client.ts`, `Configuracion.tsx`, `OvCuarentenaSaldo.tsx` (nuevo), `PanelOvAsociaciones.tsx` (nuevo), `TicketDetailView.tsx` (5 líneas). La tabla del lote 6 es `apply-progress.md:480-490`. Cada línea de servidor citada se leyó contra el fichero:

| Decisión del cliente | Línea citada | ¿Existe y dice lo que la tabla afirma? | Estado |
|---|---|---|---|
| Botón «Liberar» sólo Comercial/admin (`PanelOvAsociaciones.tsx:82`, `canExecuteTransition`) | `ovAsociaciones.ts:47` | Sí: 403 si no `canExecuteTransition(user.areas, user.isAdmin, 'Comercial')`. Probada por `RUT:31` | PASS, espejo probado |
| Motivo obligatorio (el cliente no comprueba) | `ovAsociaciones.ts:51` | Sí: 422 si el motivo recortado es vacío. `RUT:117-122` | PASS |
| Asociación ya liberada (el cliente no comprueba) | `:47` (409), carrera `:53` | Sí. `RUT:106`, `RUT:115` | PASS |
| La lista de OV del ticket la ve cualquier usuario con sesión | `:25` | Sí: `requireAuth`, sin rol. `RUT:41-49` | PASS, comodidad |
| Cuarentena y saldo | `:29`, `:33`, `:35` | Sí: `requireAuth` y 422 de formato del lote. `RUT:152` | PASS |
| El desplegable oculta usadas y cuarentena | `books/repo.ts:159-162`, `:176` | Sí: `libresFilter` y filtro `esCuarentena`. `BR:91`, `BR:119` | PASS |
| `aprobacion_y_repuestos`: `Fecha Orden De Venta` tecleable y obligatoria | `transitionExec.ts:77` con `cfDate` `required = true` (`transitions.ts:75`) | Sí. `TX:267` fija que el catálogo no declara `campoFecha` | PASS |
| `aprobacion`: al elegir la OV adicional se autorrellena y bloquea `Fecha Orden de Venta Final` (`TransitionPanel.tsx:103`, `:174`) | ninguna; `transitionExec.ts:91` sólo la guarda como fecha (`convert`, `:33`) | Sí: el servidor no autorrellena ni contrasta la fecha | **COMODIDAD DECLARADA** (`design.md:112`, decidida en la revisión del lote 6). No es defecto: el servidor no rechaza nada que el cliente permita |
| Filtro del desplegable por cliente | ninguna (`books/repo.ts:148-149` sólo filtra si el cliente lo manda; `directory.ts:57-58`) | Sí | **COMODIDAD DECLARADA** (IV-8: el código no conoce al mantenedor; una guarda estricta bloquearía justo su caso) |

Ninguna guarda vive sólo en el cliente; las dos filas sin línea de servidor son las dos comodidades declaradas. `TransitionPanel.tsx` no cambia (sin diff); lo que el panel da por supuesto del catálogo lo fija `TX:264-274`.

Lo que el cliente da a entender y el servidor no cumple: el panel ofrece «Liberar» como si la OV quedara libre. Ver CRITICAL 1.

---

## d) Criterios de éxito de `proposal.md:157-164`

| # | Criterio | Estado | Prueba |
|---|---|---|---|
| 1 | Un ticket con dos OV vigentes; la de entrada no cambia tras `Aprobación` | PASS | `TS:766`, `TS:787` |
| 2 | Segunda asociación vigente de la misma OV, 409 en las tres puertas y rojo en la base | PASS | base `OA:33`; puertas `OVU:233`, `OVU:275`, `REM:1199` |
| 3 | Liberar: fila conservada con motivo; la OV vuelve al desplegable y es reasociable; sólo Comercial | PASS (primer verify: FAIL) | `OA:64`, `RUT:31`, `RUT:179-193` |
| 4 | OV con sufijo no canónico fuera del desplegable y del saldo, en la lista; `OV-AAAA-NNN` y `OVI-` intactas | PASS | `BS:79`, `BR:119`, `SO:31`, `SO:56` |
| 5 | Saldo por lote correcto con subOV libres, consumidas y en cuarentena | PASS | `BS:46` (5/2/3/40) |
| 6 | `remisiones.test.ts:988` y `ordenVentaUnTicket.test.ts` en verde sin cambios en sus casos | PASS | diff con sólo la línea `import` (ver RQ-TC-08); corrida verde |

---

## e) R-1 y cierre

**R-1 (una línea, para el `archive-report.md`):** este cambio cubre de F1B-11 (cambio 2 de 3) la asociación 1:N propia (`public.ov_asociaciones` con índices únicos parciales), la subOV con su cuarentena, la liberación con motivo y el saldo por lote con `consumido`, y deja al cambio 3 el registro de contrato, la prioridad por contrato y el «% ejecutado» de `decision/anexo-53-contratos` (`proposal.md:49`; cabecera `cierra: no`, `proposal.md:6`); la fila del plan no se cierra.

IV-11 sigue **REDUCIDO, no cerrado** (`proposal.md:76-78`; `config.yaml:1100` remite a `adenda_iv11_asociacion_ov_ticket`, `:3141`). Expuestas quedan las filas previas sin marca ni asociación (P.2 de Gerencia) y, por el CRITICAL 1, las que sí tienen asociación pero no recuperan la OV al liberarla.

---

## f) Supuestos y desviaciones arrastrados

| Ref | Qué | Estado |
|---|---|---|
| S-8 | `OVI-` con sufijo, a cuarentena | Probado (`SO:56`, casos `OVI-…-01` y `OVI-…-X9`), declarado |
| S-9 | Sólo se liberan filas de asociación; la OV sólo en columna de un ticket previo no es liberable | Declarado (`design.md:210-212`). Depende de S-7, que no se cumple (CRITICAL 1) |
| S-10 | «OV adicional» opcional en las dos aprobaciones | `TX:224`, `TS:819` |
| S-11 | Literales `draft`/`void` del saldo | **Hipótesis**, sin verificar contra datos reales; P.4 (`tasks.md:498`). `BS:51` prueba la lógica con esos literales, no que Books los use |
| S-12 | En transiciones la asociación se escribe aunque el número no resuelva (`salesorder_id` NULL) | `TS:722` |
| `limit * 3` | Se aplica siempre, no sólo con `soloLibres` (`books/repo.ts:163`); si más de dos tercios de la página son cuarentena, devuelve menos de `limit` | Aceptado por Gerencia en la revisión del lote 4; `BR:125` fija el caso normal |
| Saldo 5/2/3/40 | La spec decía 5/2/2/40, incoherente; corregido en sitio (`specs/zoho-sync/spec.md:35-38`) | Supuesto del orquestador, aprobado por Gerencia en la revisión del lote 5 |
| `consumido` | `ejecutado` renombrado (`books/subOV.ts:22`, `:47`); el «% ejecutado» de `decision/anexo-53-contratos` es del cambio 3 | `BS:46`, `RUT:144` |
| Mayúsculas | `ov-2026-001-X9` en minúsculas cae como ordinaria | Aceptado (`design.md:135`), `SO:29` |
| Remisión, OC | `fecha_orden_compra` de la asociación de remisión queda NULL, no `ov.date` (`apply-progress.md:283`) | Declarado, reversible (S-5) |
| IV-11 | REDUCIDO, no cerrado | `CLAUDE.md` en sitio, `config.yaml:3141` |

---

## g) Coherencia de diseño

| Decisión de `design.md` | Código | Estado |
|---|---|---|
| §1 tabla en `public`, dos índices parciales, nunca `DELETE` | `schema.sql:539`, `:552-553`; búsqueda de `DELETE FROM ov_asociaciones` en `apps` y `packages`: 0 | Cumple, por construcción |
| §2 `eliminarTicket` libera las vigentes | `eliminarTicket.ts:154`; `EL:173`, `EL:189` | Cumple |
| **§3 S-7: `liberarAsociacion` limpia `orden_venta`/`salesorder_id`/`fecha_orden_venta` y fija la marca** | `ovAsociaciones.ts:74-86` en `2c43e5c` sólo hace `UPDATE ov_asociaciones`; la ruta (`ovAsociaciones.ts:52` en `2c43e5c`) no toca `tickets` | **NO cumple** (CRITICAL 1) |
| §4 destino `ovAdicional`, sin `campoFecha` en `aprobacion_y_repuestos` | `transitionExec.ts:88`, `transitions.ts:199`, `TX:244` | Cumple |
| §5 clasificador: sufijo = resto que empieza por no-dígito | `subOV.ts:24-25`; `SO:31`, `SO:56` | Cumple |
| Riesgos: la carrera puerta/`INSERT` sale como 500 | el 23505 no se atrapa en ningún sitio fuera de pruebas | Declarado en el diseño, ver WARNING 1 |
| Escritores «en la misma transacción» (RQ-TC-17, RQ-RE-16) | Alta y transición sí; remisión no (WARNING 2) | Desviación |

---

## Issues Found

### CRITICAL

Ninguno tras la remediación. El del primer verify, conservado como historia:

**1. [RESUELTO por la remediación] RQ-TC-19, escenario «Tras liberar, la OV es reasociable», y criterio de éxito 3: liberar NO deja la OV libre.**
- **Qué exige la spec** (`specs/tickets-core/spec.md:142-143`): tras liberar, la asociación se crea sin que el índice único parcial la rechace, «y ninguna de las tres vías de las puertas la encuentra ya en el ticket que la liberó (S-7: liberar limpia sus columnas)». El diseño (`design.md:89-97`, `:213`) precisa que `liberarAsociacion` hace el `UPDATE` de la fila y además pone a NULL `orden_venta`, `salesorder_id` y `fecha_orden_venta` del ticket si guardan esa OV, con `ov_elegida_en_app_at = now()`. `design.md:184` lo repite («`liberarAsociacion` con limpieza de columna»).
- **Qué hace el código** (lectura, sin ejecutar una sonda): `packages/zoho-sync/src/db/ovAsociaciones.ts:74-86` en `2c43e5c` ejecuta un único `UPDATE ov_asociaciones`; la ruta que lo llama, `apps/desk/server/routes/ovAsociaciones.ts:52` en `2c43e5c`, no toca `tickets`. La tarea 1.10 (`tasks.md:81-83`) ya omitió la limpieza y ninguna tarea posterior la recoge.
- **Por qué es real:** los tres escritores dejan la OV también en las columnas del ticket (alta con `ordenVenta`/`salesorderId`; `repo.ts:311`; `remision.ts:240`). Tras liberar, `ticketConOrdenVenta` (`repo.ts:366-372`) sigue encontrando ese ticket por `salesorder_id` y por `orden_venta`, así que un ticket nuevo con esa OV recibe el 409 de las tres puertas; y `libresFilter` (`books/repo.ts:159-162`) sigue excluyéndola del desplegable por las columnas de `tickets`. La OV liberada de un ticket real no vuelve.
- **Por qué ninguna prueba se puso roja:** las pruebas que tocan «reasociable» usan tickets sin columnas: `OA:86` sólo llama a `asociarOV`, `OA:145` usa un ticket sin columnas y `BR:101` no crea ningún ticket. La matriz de `tasks.md:448-478` cuenta la tarea 1.8 como cobertura, pero la 1.8 sólo pide «no lanza 23505» (`tasks.md:78-79`), la mitad fácil del THEN. Es el molde de la regla de mutación 2: la prueba no sabe distinguir.
- **Consecuencia sobre S-9:** su límite presupone que liberar sí limpia; sin la limpieza, ni las filas nuevas son liberables de verdad.
- **Arreglo propuesto (no se aplica aquí):** un `apply` acotado. RED con un ticket que lleve la OV en columna y en asociación: liberar por la ruta, luego `soloLibres` la devuelve y el alta la acepta con 201. GREEN según `design.md` §3. Mutación de cierre: quitar la limpieza y exigir rojo.

### WARNING

1. **[RESUELTO: `OvYaAsociadaError` → 409, `OA:33`, `RUT:256`] RQ-TC-17 «Segunda asociación vigente rechazada» (PARTIAL en el primer verify).** La base rechaza (`OA:33`) y en el camino normal las guardas dan 409 (`OVU:233`, `OVU:275`, `REM:1199`). Falta la traducción del 23505: en una carrera puerta/`INSERT` sale como 500. El diseño lo declara en «Riesgos» y lo acepta; la spec dice que «la aplicación traduce el conflicto». O se implementa el `catch` o se suaviza el THEN antes de archivar.
2. **[RESUELTO: `remision.ts:239-243` dentro de `enTransaccion`, prueba estructural `RUT:248`] La remisión no escribía la asociación en la misma transacción.** `remision.ts:239-243` hace el `UPDATE` de `tickets` y después `asociarOV`, dos sentencias sueltas sobre `db` (el pool), sin `BEGIN`; y `createRemision` va aparte. La spec exige lo contrario (`specs/tickets-core/spec.md:69-71`; `specs/remisiones/spec.md:37-38`). Si `asociarOV` falla tras el `UPDATE`, el ticket queda con la OV en columna y sin fila de asociación. El escenario pasa (`REM:1168`) porque sólo mira el caso feliz. Alta y transición sí van en transacción (`equipoNuevo.ts:86-99`, `repo.ts:338`).
3. **[RESUELTO: nota «F1A-04: 28 de 40» restituida en el delta] RQ-TS-09: la frase de las «27 etiquetas de las 39» era rancia.** El delta la reescribe sin el paréntesis «F1A-04: 28 de 40» de la spec viva (`openspec/specs/transitions-st/spec.md:306-307`), y `rows.ts` declara hoy 40 entradas. Al fusionar en el archive, el requisito vigente pierde una afirmación actual y recupera una caducada. Ninguna prueba cuenta esas etiquetas.
4. **[RESUELTO: THEN corregido según S-5 y aserción completa en `TS:804`] RQ-TS-18 «La fecha de OC vive en la asociación nueva» (PARTIAL en el primer verify).** El THEN dice «ninguna columna del ticket la guarda»; en `aprobacion` la fecha se guarda además en `fecha_orden_compra_final` (campo preexistente; lo admite `TS:812-813`), y la prueba sólo afirma que `fecha_orden_compra` sigue NULL. S-5 (`proposal.md:104`) dice lo correcto; la spec sobreafirma. Conviene reescribir el THEN a «la asociación tiene la fecha y la columna de entrada no se toca».
5. **[RESUELTO: cita a `:148-152`] Cita defectuosa en el delta de `transitions-st`.** RQ-TS-14 cita `ticketService.ts:95-102` para el 409 de la transición; esas líneas son el alta. La guarda de la transición está en `:148-152` (caso A de la regla de mutación 4).
6. **La cuarentena de la remisión queda detrás del 409 de remisión pendiente (`remision.ts:177`).** IV-12, registrado y no corregido (ver b). No bloquea. **Sigue vivo.**
7. **NUEVO, de la remediación: el 409 de la carrera dice «ya está asociada a otro ticket», sin el número.** Tras un `23505` la transacción real de Postgres queda abortada y la consulta del ticket dueño fallaría; con SAVEPOINT se podría, pero no se verificó en pg-mem (hipótesis). Diferencia de texto con las puertas, declarada; el código (409) es el mismo. No bloquea.
8. **NUEVO, límite de prueba: la atomicidad es estructural.** pg-mem no deshace `ROLLBACK`; se prueba el cliente compartido entre `BEGIN`/`COMMIT`, no la reversión. No bloquea.

### SUGGESTION

1. RQ-TC-17, escenario 1: `TS:681` afirma persona pero no `asociada_at`, y ninguna prueba fuerza un fallo del alta tras la asociación para probar que ambas escrituras se deshacen juntas; se sostiene por construcción (`equipoNuevo.ts:86-99`).
2. `liberarAsociacionesDeTicket` (`ovAsociaciones.ts`, la función que sigue a `liberarAsociacion`) no fija `liberada_por`: al eliminar un ticket la liberación queda sin persona; el motivo sí.
3. RQ-ZS-14 dice «sin excepción por cliente» y ninguna prueba llama a `searchSalesOrders` con `clientId` y cuarentena a la vez; se sostiene porque el filtro de cuarentena (`books/repo.ts:176`) es independiente de `clientFilter` (`:148-149`).
4. Los guardianes del catálogo (`TX:212-274`) nacen verdes por diseño y se ponen rojos con la mutación M2 del lote 6, no con una prueba de comportamiento. Sin otros patrones de aserción débil en los ficheros tocados.

---

## TDD Compliance
| Check | Resultado | Detalle |
|---|---|---|
| Evidencia TDD reportada | OK | Tablas por lote en `apply-progress.md` (`:8-17`, `:235-246`, `:297-306`, `:359-371`, `:465-470`) |
| RED capturado | OK | El RED de 1.8 se escribió contra la mitad fácil del escenario; la remediación capturó el RED completo (`expected 409 to be 201` en las tres puertas) antes del arreglo |
| GREEN | OK | 299/299 en la corrida focalizada de este verify |
| Nacidas verdes | OK | Cada lote las enumera y justifica como control de población o regresión |
| Mutaciones declaradas | Reproducidas | Sección «Mutaciones reproducidas por el orquestador»: tres de posición (una por puerta) y dos de la remediación |
| Desviación de proceso | Declarada | Lote 1: `liberarAsociacion` escrita antes de su RED y corregida en el mismo turno (`apply-progress.md:19-29`) |

## Verdict

**PASS WITH WARNINGS** — re-verify tras la remediación: 10 requisitos y 24 escenarios, **24 PASS, 0 PARTIAL, 0 FAIL**; 0 CRITICAL, 3 WARNING vivos (6, 7 y 8), 4 SUGGESTION. El primer verify (`d9f51ae`) dio **FAIL** —21 PASS, 2 PARTIAL, 1 FAIL— por el CRITICAL 1, que la remediación cierra con RED previo (la puerta seguía dando 409 tras liberar) y con la mutación de la limpieza reproducida en rojo por el orquestador.

El archive queda desbloqueado por este verify; su techo lo aprueba Gerencia aparte.
