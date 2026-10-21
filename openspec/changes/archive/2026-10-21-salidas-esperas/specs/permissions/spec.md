# Delta de `permissions` — `salidas-esperas` (F1C-03, `cierra: si`)

Sólo ADDED. Las matrices vivas (RQ-PM-03, RQ-PM-40) se leen con RQ-TS-62 y se reescriben en el archive, a igual número de líneas.
Fuente: `decision/salida-emergencia-quien-la-ejecuta` (`openspec/config.yaml:3426-3440`); M1.9.2 (`R08.4.md:2028`, `:2036`, `:2037`). Supuestos de la propuesta (reversibles): **S-1** persona a cargo = `tickets.derivado_a` activo y del área; **S-2** derivado nulo, inactivo o de otra área = no disponible; **S-3** el administrador cuenta como respaldo; **S-10** la regla rige aunque `DECISIONALES_POR_CARGO` esté apagado. S-1 y S-2 suben al panel 06.

## ADDED Requirements

### Requirement: RQ-PM-42 · Quién ejecuta una salida de las esperas: la persona a cargo, o el respaldo con motivo

Las «salidas de las esperas» son `anulacion` con origen `En Espera de Repuestos` o `Servicio externo`, `cobro_diagnostico_espera` y `sin_pieza_en_almacen`. Con `SALIDAS_ESPERAS` encendido, una regla pura de `packages/shared` **SHALL** decidir, tras el área de la transición, entre tres casos: (a) el usuario es `tickets.derivado_a` del ticket, está activo y tiene el área de la transición (S-1): ejecuta sin motivo; (b) el usuario es Director o Coordinador del área por `cargo_permiso` (`cargosDecisionales`, `decisionales.ts:27-32`, con la vacante del Coordinador Técnico de F1C-05) o administrador (S-3): ejecuta sólo con «Motivo del respaldo» no vacío; (c) cualquier otro: `403`. `derivado_a` nulo, inactivo o de otra área **SHALL** contar como no disponible (S-2): sólo ejecuta el respaldo. Un ticket de Zoho sin derivado sigue el mismo camino.

#### Scenario: la persona a cargo ejecuta sin motivo — ROJO
- GIVEN el interruptor encendido, un ticket en `En Espera de Repuestos` con `derivado_a` un usuario activo de Comercial
- WHEN ese usuario ejecuta `anulacion` con un motivo de la lista cerrada y sin «Motivo del respaldo»
- THEN `200` y el ticket llega a `Anulado`

#### Scenario: el respaldo sin motivo no pasa — ROJO
- GIVEN el mismo ticket y la Directora Comercial, que no es `derivado_a`
- WHEN ejecuta `cobro_diagnostico_espera` sin «Motivo del respaldo»
- THEN `422` y el ticket no cambia

#### Scenario: el respaldo con motivo pasa — ROJO
- GIVEN el mismo ticket y el Coordinador Comercial
- WHEN ejecuta `cobro_diagnostico_espera` con «Motivo del respaldo»
- THEN `200` y el ticket llega a `Por Facturar`

#### Scenario: el administrador es respaldo con motivo — ROJO
- GIVEN un administrador que no es `derivado_a`
- WHEN ejecuta `sin_pieza_en_almacen` sobre un ticket en `Solicitado`, con y sin motivo
- THEN con motivo `200`; sin motivo `422`

#### Scenario: otro usuario del área recibe 403 — ROJO
- GIVEN un técnico de Servicio Técnico sin cargo que no es `derivado_a`
- WHEN ejecuta `sin_pieza_en_almacen`
- THEN `403` y el ticket no cambia

#### Scenario: derivado nulo, inactivo o de otra área = no disponible — ROJO (S-2)
- GIVEN tickets en `Solicitado` con `derivado_a` nulo, con un usuario inactivo y con un usuario de Comercial
- WHEN un técnico de Servicio Técnico sin cargo ejecuta `sin_pieza_en_almacen` en cada uno
- THEN `403` en los tres; el respaldo con motivo pasa en los tres

### Requirement: RQ-PM-43 · La regla del ejecutor sustituye a Decisionales por cargo en estos orígenes; apagado, todo es como hoy

Con `SALIDAS_ESPERAS` encendido, para las salidas de las esperas RQ-PM-42 **SHALL** SUSTITUIR a la regla de Decisionales por cargo (RQ-PM-29, RQ-PM-30) como excepción explícita, molde `IDS_FIRMA_CC` (`decisionales.ts:46`): `cobro_diagnostico_espera` (Decisional) **SHALL NOT** exigir además Director o Coordinador. Rige aunque `DECISIONALES_POR_CARGO` esté apagado (S-10). Las demás Decisionales **SHALL** quedar idénticas. Con `SALIDAS_ESPERAS` apagado, `anulacion` desde ER/SE **SHALL** seguir con la regla de hoy, sin ejecutor ni motivo del respaldo, y las otras dos dan `409` (`transitions-st` RQ-TS-61).

#### Scenario: la persona a cargo ejecuta la Decisional sin ser Director — ROJO
- GIVEN `DECISIONALES_POR_CARGO` encendido, `SALIDAS_ESPERAS` encendido y un `derivado_a` de Comercial sin cargo
- WHEN ejecuta `cobro_diagnostico_espera`
- THEN `200`, no `403` de cargo

#### Scenario: con `DECISIONALES_POR_CARGO` apagado la regla del ejecutor rige — ROJO (S-10)
- GIVEN `DECISIONALES_POR_CARGO` apagado, `SALIDAS_ESPERAS` encendido y un usuario de Comercial que no es `derivado_a` ni respaldo
- WHEN ejecuta `anulacion` desde `Servicio externo`
- THEN `403`

#### Scenario: otras Decisionales no cambian — CARACTERIZACIÓN
- GIVEN `SALIDAS_ESPERAS` encendido y `DECISIONALES_POR_CARGO` encendido
- WHEN un usuario sin cargo ejecuta `rechazo_comercial`
- THEN `403` de cargo, como antes

#### Scenario: apagado, `anulacion` desde ER/SE es como hoy — CARACTERIZACIÓN
- GIVEN `SALIDAS_ESPERAS` apagado y un usuario de Comercial que no es `derivado_a`
- WHEN ejecuta `anulacion` con motivo, sin «Motivo del respaldo»
- THEN `200`, como antes de esta tanda

### Requirement: RQ-PM-44 · El servidor impone el ejecutor y el motivo; la traza los guarda

El `403` del ejecutor **SHALL** ser escalón B, tras el `403` de área (`ticketService.ts:129-130`) y en el lugar de Decisionales por cargo (`:131`); el `422` de «Motivo del respaldo» en blanco, escalón C, en el agregado de `:134` (`transitions-st` RQ-TS-64). «Motivo del respaldo» **SHALL** aceptarse sólo en el caso (b) de RQ-PM-42: cuando el ejecutor es la persona a cargo no se pide ni se descarta en silencio. La fila de `ticket_transitions` **SHALL** guardar `performed_by_id` y, en `values`, el motivo del respaldo cuando lo hubo.

#### Scenario: la traza guarda quién y por qué — ROJO
- GIVEN un respaldo que ejecuta `anulacion` con «Motivo del respaldo»
- WHEN se lee la fila de `ticket_transitions`
- THEN `performed_by_id` es el respaldo y `values` contiene el motivo

#### Scenario: la persona a cargo no deja motivo del respaldo — ROJO
- GIVEN la persona a cargo que ejecuta `sin_pieza_en_almacen`
- WHEN se lee la fila
- THEN `performed_by_id` es esa persona y `values` no trae motivo del respaldo

#### Scenario: un motivo de espacios cuenta como en blanco — ROJO
- GIVEN un respaldo del área
- WHEN ejecuta `cobro_diagnostico_espera` con «Motivo del respaldo» de sólo espacios
- THEN `422` y el ticket no cambia

### Requirement: RQ-PM-45 · El cliente espeja la regla pura; el servidor impone (regla 13)

`TransitionPanel` (filtro de `apps/desk/src/components/TransitionPanel.tsx:56-58`) **SHALL** consumir la misma regla pura de RQ-PM-42: ocultar las salidas de las esperas a quien no es persona a cargo ni respaldo y pedir «Motivo del respaldo» al respaldo. El cliente **SHALL NOT** decidir el interruptor, el ejecutor ni el motivo: los imponen el servidor (RQ-TS-61, RQ-PM-42, RQ-PM-44) y ocultar es comodidad probada (regla 13, punto 3). La tabla decisión a decisión, con línea del servidor, va en el diseño.

#### Scenario: el cliente y el servidor coinciden — ROJO
- GIVEN la tabla interruptor × ejecutor (persona a cargo, Director, Coordinador, administrador, otro) × transición
- WHEN se comparan la regla pura y la respuesta del servidor
- THEN nunca el cliente muestra y el servidor rechaza por ejecutor o interruptor; el cliente puede ocultar de más

#### Scenario (MANUAL, de persona) · El panel de un ticket en espera
- GIVEN un ticket en `En Espera de Repuestos` en la aplicación desplegada, con el interruptor encendido
- WHEN lo abren la persona a cargo, un Director y un usuario ajeno
- THEN la primera no ve el campo del respaldo, el segundo sí, el tercero no ve las salidas. **Dueño:** Supervisión, en las pruebas en la app. **ARCHIVAR NO LO DA POR HECHO.**
