# Delta de `permissions` — `salidas-esperas` (F1C-03, `cierra: si`)

Sólo ADDED. Las matrices vivas (RQ-PM-03, RQ-PM-40) se leen con RQ-TS-62 y se reescriben en el archive, a igual número de líneas.
Fuente: `decision/salida-emergencia-quien-la-ejecuta` (`openspec/config.yaml:3426-3440`); M1.9.2 (`R08.4.md:2028`, `:2036`, `:2037`). Supuestos de la propuesta (reversibles): **S-1** persona a cargo = `tickets.derivado_a` activo y del área; **S-2** derivado nulo, inactivo o de otra área = no disponible; **S-3** el administrador cuenta como respaldo — los tres **RETIRADOS por `decision/f1c03-quien-ejecuta-salidas` (2026-10-21)**, que fija el ejecutor por cargo (Director o Coordinador Comercial, y el administrador; código en `f00c9c68`), y RQ-PM-42..45 quedan reescritos en sitio con esa regla; **S-10** la regla rige aunque `DECISIONALES_POR_CARGO` esté apagado (sigue vigente). La pregunta de S-1 y S-2 al panel 06 ya la respondió esa decisión.

## ADDED Requirements

### Requirement: RQ-PM-42 · Quién ejecuta una salida de las esperas externas: sólo el Director o el Coordinador Comercial, y el administrador

Corregido por `decision/f1c03-quien-ejecuta-salidas` (Gerencia, 2026-10-21; código en `f00c9c68`). Las «salidas de las esperas externas» son `cobro_diagnostico_espera` y `anulacion` con origen `En Espera de Repuestos` o `Servicio externo` (`esSalidaDeEspera`, `packages/shared/src/salidasEsperas.ts:47-50`; orígenes en `:30`). Con `SALIDAS_ESPERAS` encendido, una regla pura de `packages/shared` (`ejecutorDeSalida`, `salidasEsperas.ts:56-65`) **SHALL** permitirlas sólo al administrador o a quien tenga `cargo_permiso` `Director Comercial` o `Coordinador Comercial` (`CARGOS_EJECUTORES_SALIDA`, `:33`; la comprobación, `:63`); cualquier otro **SHALL** recibir `403` con un mensaje que nombra los dos cargos (`:64`). `tickets.derivado_a` **MUST NOT** decidir: la regla de «persona a cargo» y el «Motivo del respaldo» quedan retirados. La `anulacion` desde `Rev./Diagnostico`, `Notificación Comercial` o `Notificación cliente` **SHALL NOT** entrar en la regla. `sin_pieza_en_almacen` **SHALL NOT** tener regla de ejecutor (supuesto del analista de la misma decisión): la ejecuta quien tenga el área Servicio Técnico, con la lista corta y el `409` del interruptor, como cualquier transición de esa área. Apagado el interruptor, la regla no opina (`null`, `:62`).

#### Scenario: el Coordinador Comercial y el administrador ejecutan — ROJO (`apps/desk/server/salidasEsperas.test.ts:132`; regla pura, `packages/shared/src/salidasEsperas.test.ts:119`)
- GIVEN el interruptor encendido y tickets en `En Espera de Repuestos` y en `Servicio externo`
- WHEN el Coordinador Comercial o un administrador ejecutan `cobro_diagnostico_espera` o `anulacion` con sus motivos
- THEN `200` en los ocho casos

#### Scenario: un Comercial sin cargo recibe 403 — ROJO (`apps/desk/server/salidasEsperas.test.ts:143`)
- GIVEN el mismo interruptor y un usuario con el área Comercial y sin `cargo_permiso`
- WHEN ejecuta `cobro_diagnostico_espera` o `anulacion` desde cualquiera de las dos esperas externas
- THEN `403` cuyo mensaje nombra al Director Comercial y a la Coordinadora Comercial, y el ticket no cambia

#### Scenario: otro cargo tampoco ejecuta — ROJO (`apps/desk/server/salidasEsperas.test.ts:156`; regla pura, `packages/shared/src/salidasEsperas.test.ts:125`)
- GIVEN un Asistente Comercial y un Director Técnico, los dos con el área Comercial
- WHEN ejecutan `cobro_diagnostico_espera` desde `Servicio externo`
- THEN `403`

#### Scenario: `derivado_a` ya no decide — ROJO (`apps/desk/server/salidasEsperas.test.ts:164`; regla pura, `packages/shared/src/salidasEsperas.test.ts:133`)
- GIVEN un ticket en `Servicio externo` cuyo `derivado_a` es un Comercial sin cargo
- WHEN ese usuario ejecuta `cobro_diagnostico_espera` o `anulacion`, aunque mande una clave «Motivo del respaldo»
- THEN `403` del ejecutor

#### Scenario: la anulación desde los otros orígenes no entra — ROJO (`apps/desk/server/salidasEsperas.test.ts:194`; regla pura, `packages/shared/src/salidasEsperas.test.ts:101`, `:112`)
- GIVEN el interruptor encendido y tickets en `Rev./Diagnostico`, `Notificación Comercial` y `Notificación cliente`
- WHEN un Comercial sin cargo ejecuta `anulacion` con su motivo
- THEN `200` en los tres: la regla no opina

#### Scenario: `sin_pieza_en_almacen` no tiene regla de ejecutor — ROJO (`apps/desk/server/salidasEsperas.test.ts:241`)
- GIVEN el interruptor encendido y tickets en `Solicitado`
- WHEN la ejecutan un usuario de Servicio Técnico sin cargo ni derivado y un Director Comercial sin ese área
- THEN el primero `200` y el ticket llega a `En Espera de Repuestos`; el segundo, el `403` de área

### Requirement: RQ-PM-43 · La regla del ejecutor sustituye a Decisionales por cargo en las esperas externas; apagado, no opina

Con `SALIDAS_ESPERAS` encendido, para las salidas de RQ-PM-42 la regla del ejecutor **SHALL** SUSTITUIR a la regla de Decisionales por cargo (RQ-PM-29, RQ-PM-30) como excepción explícita, molde `IDS_FIRMA_CC` (`decisionales.ts:46`): con veredicto, `puedeEjecutarConSalidasEsperas` exige el área y la lista corta y que no sea `denegado` (`packages/shared/src/salidasEsperas.ts:85-86`), y el servidor sólo evalúa Decisionales sin veredicto (`apps/desk/server/services/ticketService.ts:131`, `!ejecutor`). Rige aunque `DECISIONALES_POR_CARGO` esté apagado (S-10). Las demás Decisionales, y la `anulacion` desde los otros tres orígenes, **SHALL** quedar idénticas. Con `SALIDAS_ESPERAS` apagado la regla **SHALL NOT** opinar: `anulacion` desde ER/SE sigue como en F1C-01 (motivo de lista obligatorio y, con `DECISIONALES_POR_CARGO` encendido, Decisional por cargo), y las otras dos dan `409` (`transitions-st` RQ-TS-61).

#### Scenario: con Decisionales encendido, el 403 es el del ejecutor y el Director Comercial cobra — ROJO (`apps/desk/server/salidasEsperas.test.ts:264`, SE-2b; `:230`)
- GIVEN `DECISIONALES_POR_CARGO` encendido, `SALIDAS_ESPERAS` encendido, un Comercial sin cargo y el Director Comercial
- WHEN los dos ejecutan `cobro_diagnostico_espera` desde `Servicio externo`
- THEN el primero recibe el `403` del ejecutor, no el de Decisionales; el segundo, `200`

#### Scenario: con `DECISIONALES_POR_CARGO` apagado la regla del ejecutor rige — ROJO (S-10; `packages/shared/src/salidasEsperas.test.ts:166`; `apps/desk/server/salidasEsperas.test.ts:143`, con la app de pruebas en DPC apagado)
- GIVEN `DECISIONALES_POR_CARGO` apagado, `SALIDAS_ESPERAS` encendido y un usuario de Comercial sin cargo
- WHEN ejecuta `anulacion` desde `Servicio externo`
- THEN `403`

#### Scenario: otras Decisionales no cambian — CARACTERIZACIÓN (`apps/desk/server/salidasEsperas.test.ts:230`, `:202`)
- GIVEN `SALIDAS_ESPERAS` encendido y `DECISIONALES_POR_CARGO` encendido
- WHEN un usuario sin cargo ejecuta `rechazo_comercial`, o `anulacion` desde `Rev./Diagnostico`
- THEN `403` de Decisionales, como antes; el Director Comercial anula desde `Rev./Diagnostico`

#### Scenario: apagado, la regla no opina — CARACTERIZACIÓN (`apps/desk/server/salidasEsperas.test.ts:213`, `:221`)
- GIVEN `SALIDAS_ESPERAS` apagado y un usuario de Comercial sin cargo
- WHEN ejecuta `anulacion` con motivo desde `En Espera de Repuestos` o `Servicio externo`
- THEN `200` con `DECISIONALES_POR_CARGO` apagado; con él encendido, el `403` de Decisionales y no el del ejecutor

### Requirement: RQ-PM-44 · El servidor impone el ejecutor y el motivo del cobro; la traza los guarda

El `403` del ejecutor **SHALL** ser escalón B, tras el `403` de área (`ticketService.ts:129-130`) y la lista corta, y antes de Decisionales por cargo (`:131`). `cobro_diagnostico_espera` **SHALL** llevar en el catálogo el campo de texto obligatorio «Motivo del cobro de diagnóstico» (`CLAVE_MOTIVO_COBRO`, `packages/shared/src/salidasEsperas.ts:39`; `packages/shared/src/transitions.ts:262`): ausente o vacío da el `422` del obligatorio (`apps/desk/server/transitionExec.ts:77`) y de sólo espacios el de `erroresMotivoCobro` (`salidasEsperas.ts:68-72`), los dos escalón C, en el agregado de `ticketService.ts:134` (`transitions-st` RQ-TS-64). El motivo **SHALL** ir a la traza y **MUST NOT** quedar en `tickets.custom_fields` (`ticketService.ts:133`). La `anulacion` **SHALL** conservar su motivo de lista obligatorio de F1C-01 (`erroresAnulacion`, mismo agregado). La fila de `ticket_transitions` **SHALL** guardar `performed_by_id`. Ningún campo del catálogo es ya «Motivo del respaldo» (`packages/shared/src/salidasEsperas.test.ts:158`).

#### Scenario: la traza guarda quién y por qué, y `custom_fields` no — ROJO (`apps/desk/server/salidasEsperas.test.ts:118`)
- GIVEN el Director Comercial que ejecuta `cobro_diagnostico_espera` desde `Servicio externo` con «Motivo del cobro de diagnóstico»
- WHEN se leen la fila de `ticket_transitions` y el ticket
- THEN `performed_by_id` es el Director, `values` contiene el motivo y `tickets.custom_fields` no lleva la clave

#### Scenario: la anulación conserva su motivo de lista — ROJO (`apps/desk/server/salidasEsperas.test.ts:186`)
- GIVEN el Director Comercial y un ticket en `Servicio externo`
- WHEN ejecuta `anulacion` sin «Motivo»
- THEN `422` «Falta el campo obligatorio: Motivo»

#### Scenario: el cobro sin motivo, o con motivo de espacios, da 422 — ROJO (`apps/desk/server/salidasEsperas.test.ts:174`; regla pura, `packages/shared/src/salidasEsperas.test.ts:145`)
- GIVEN el Director Comercial y un ticket en `En Espera de Repuestos`
- WHEN ejecuta `cobro_diagnostico_espera` sin «Motivo del cobro de diagnóstico» o con ese motivo de sólo espacios
- THEN `422` que nombra el motivo y el ticket no cambia

### Requirement: RQ-PM-45 · El cliente espeja la regla pura; el servidor impone (regla 13)

`TransitionPanel` (filtro de `apps/desk/src/components/TransitionPanel.tsx:57`, contexto en `:55`) **SHALL** consumir la misma regla pura de RQ-PM-42 (`puedeEjecutarConSalidasEsperas`): con el interruptor encendido, ocultar el cobro y la anulación desde ER/SE a quien no es administrador, Director Comercial ni Coordinador Comercial; el «Motivo del cobro de diagnóstico» lo pide como cualquier campo del catálogo. El contexto que lee (`GET /api/permisos/salidas-esperas`, `apps/desk/server/routes/permisosSalidasEsperas.ts:17`) es sólo el interruptor y lo calcula la misma función que la guarda (`contextoSalidasEsperas`, `apps/desk/server/services/decisionales.ts:20`). El cliente **SHALL NOT** decidir el interruptor, el ejecutor ni el motivo: los imponen el servidor (RQ-TS-61, RQ-PM-42, RQ-PM-44) y ocultar es comodidad probada (regla 13, punto 3). La tabla decisión a decisión, con línea del servidor, va en el diseño.

#### Scenario: el cliente y el servidor coinciden — ROJO (`packages/shared/src/salidasEsperas.test.ts:164`, la compuesta; `apps/desk/server/salidasEsperas.test.ts:311`, el contexto)
- GIVEN la tabla interruptor × ejecutor (Director Comercial, Coordinador Comercial, administrador, Comercial sin cargo, otro cargo) × transición
- WHEN se comparan la regla pura y la respuesta del servidor
- THEN nunca el cliente muestra y el servidor rechaza por ejecutor o interruptor; el cliente puede ocultar de más

#### Scenario (MANUAL, de persona) · El panel de un ticket en espera
- GIVEN un ticket en `En Espera de Repuestos` en la aplicación desplegada, con el interruptor encendido
- WHEN lo abren el Director Comercial, un Comercial sin cargo que es el derivado del ticket y un usuario ajeno
- THEN el primero ve el cobro, con su motivo obligatorio, y la anulación; los otros dos no ven ninguna de las dos. **Dueño:** Supervisión, en las pruebas en la app. **ARCHIVAR NO LO DA POR HECHO.**
