# Delta for transitions-st

Cambio `prioridad-top5-cliente` (F1B-07, parte decidida, `cierra: no`). Base `6055c4d`, medido el 2026-09-30. Supuesto
S-2 de `proposal.md`. Fuente: `decision/top5-manual` (`openspec/config.yaml:1949-1965`, respuesta `:1954`: «el técnico
no puede editarla»). Continúa la numeración `RQ-TS-01..19`. El mapa de campos de `RQ-TS-09` (`priority` → columna
`priority`) no cambia.

## ADDED Requirements

### Requirement: RQ-TS-20 · `priority` deja de ser obligatorio en `escalado_a_revision` y `devolucion_a_correccion`

En `escalado_a_revision` y `devolucion_a_correccion` (las dos de área Servicio Técnico), el campo `priority` SHALL ser
**opcional**: una transición SHALL pasar la validación de campos obligatorios sin él. El campo SHALL seguir declarado
con sus opciones `High | Medium | Low` y con destino `priority`, de modo que, si viene, se aplica como hoy
(`RQ-TS-09`) sujeto a la guarda de `RQ-TS-21`.

#### Scenario: sin `priority` la transición pasa
- GIVEN un ticket en un estado válido de origen de `escalado_a_revision` y un usuario del área `Servicio Técnico`
- WHEN ejecuta la transición sin `priority` y con el resto de campos obligatorios
- THEN responde `200` y la prioridad del ticket no cambia

#### Scenario: sin `priority` en la devolución
- GIVEN un ticket en un estado válido de origen de `devolucion_a_correccion` y un usuario de `Servicio Técnico`
- WHEN ejecuta la transición sin `priority`
- THEN responde `200` y la prioridad no cambia

#### Scenario: el campo sigue declarado
- GIVEN el grafo de transiciones
- WHEN se inspeccionan los campos de las dos transiciones
- THEN `priority` figura con `target: 'priority'`, opciones `High`, `Medium`, `Low` y no obligatorio

#### Scenario: las demás transiciones no cambian
- GIVEN las 34 transiciones
- WHEN se comparan los campos obligatorios con los de antes de este cambio
- THEN sólo difiere `priority` en esas dos

### Requirement: RQ-TS-21 · Guarda de servidor: sólo admin o `puedeFijarPrioridadTop5` cambian la prioridad en una transición

Al ejecutar `escalado_a_revision` o `devolucion_a_correccion`, si `values.priority` **viene** y es **distinta** de la
prioridad actual del ticket, el servidor SHALL responder `403` salvo que el usuario sea administrador o cumpla
`puedeFijarPrioridadTop5` (se CONSUME, regla invariable 13). El mensaje SHALL decir que la prioridad sólo la cambia el
cargo que la gestiona. Si `values.priority` **no viene**, o **viene igual** a la actual, la transición SHALL pasar esta
guarda. Un `403` SHALL no escribir nada: ni estado, ni prioridad, ni fila en `ticket_transitions`. Una transición
distinta de esas dos MUST NOT quedar afectada por esta guarda. Como las dos transiciones son de Servicio Técnico y el
predicado exige además el área `Comercial`, en la práctica sólo el administrador, o un usuario con ambas áreas y cargo
`Director Comercial`, cambia ahí la prioridad (supuesto S-2). Cambio visible desde el despliegue: los técnicos dejan de
poder cambiar la prioridad en esas dos transiciones.

#### Scenario: técnico que cambia la prioridad, 403
- GIVEN un usuario no admin de `Servicio Técnico` y un ticket con prioridad `Low`
- WHEN ejecuta `escalado_a_revision` con `priority: 'High'`
- THEN responde `403` y el ticket no cambia de estado ni de prioridad

#### Scenario: técnico en la devolución, 403
- GIVEN un usuario no admin de `Servicio Técnico` y un ticket con prioridad `High`
- WHEN ejecuta `devolucion_a_correccion` con `priority: 'Low'`
- THEN responde `403`

#### Scenario: la misma prioridad pasa
- GIVEN un ticket con prioridad `High` y un técnico no admin
- WHEN ejecuta `escalado_a_revision` con `priority: 'High'`
- THEN responde `200`

#### Scenario: sin el campo pasa
- GIVEN un técnico no admin
- WHEN ejecuta `escalado_a_revision` sin `priority`
- THEN responde `200`

#### Scenario: ticket sin prioridad y campo informado
- GIVEN un ticket con prioridad nula y un técnico no admin
- WHEN ejecuta `escalado_a_revision` con `priority: 'Medium'`
- THEN responde `403`, porque `Medium` es distinta de la actual

#### Scenario: administrador cambia la prioridad
- GIVEN un administrador y un ticket con prioridad `Low`
- WHEN ejecuta `escalado_a_revision` con `priority: 'High'`
- THEN responde `200` y el ticket queda `High`

#### Scenario: usuario con ambas áreas y cargo Director Comercial
- GIVEN un usuario con áreas `Servicio Técnico` y `Comercial` y cargo `Director Comercial`
- WHEN ejecuta `escalado_a_revision` con una prioridad distinta
- THEN responde `200` y la prioridad cambia

#### Scenario: Director Comercial sin área de Servicio Técnico
- GIVEN un usuario sólo del área `Comercial` con cargo `Director Comercial`
- WHEN ejecuta `escalado_a_revision`
- THEN responde `403` por el área, no por esta guarda

#### Scenario: nadie tiene cargo
- GIVEN una base donde todos los `cargo_permiso` son nulos
- WHEN un no admin de `Servicio Técnico` ejecuta `escalado_a_revision` con una prioridad distinta, y un administrador hace lo mismo
- THEN el primero recibe `403` y el administrador `200`

#### Scenario: otras transiciones no llevan la guarda
- GIVEN una transición distinta de las dos, que no declara `priority`
- WHEN un no admin la ejecuta con un valor `priority` cualquiera en el cuerpo
- THEN la guarda no interviene y el valor se ignora como hoy

### Requirement: RQ-TS-22 · Posición de la guarda de prioridad

La guarda de `RQ-TS-21` SHALL evaluarse **inmediatamente después** del `403` de cargo y **antes** de todo `422`
(escalón B, F1B-10), y por tanto después de los `409` de flujo y de estado y del `403` de área. El `403` de área SHALL
ganar a esta guarda; esta guarda SHALL ganar al `422`. La suite MUST fallar si la guarda se mueve delante del `403` de
área o detrás del `422` (regla de mutación 1), con pruebas que activen las dos guardas a la vez.

#### Scenario: el 403 de área gana a la guarda de prioridad
- GIVEN un usuario sin el área `Servicio Técnico` y un cuerpo con `priority` distinta de la actual
- WHEN ejecuta `escalado_a_revision`
- THEN el `403` nombra el área, no la prioridad

#### Scenario: la guarda de prioridad gana al 422
- GIVEN un técnico no admin, `priority` distinta de la actual y valores que además darían `422`
- WHEN ejecuta `escalado_a_revision`
- THEN responde `403` de prioridad, no `422`

#### Scenario: el 409 de estado gana a la guarda
- GIVEN un ticket fuera de los estados de origen de la transición y un técnico con `priority` distinta
- WHEN ejecuta `escalado_a_revision`
- THEN responde `409`, no `403`

## Fuera de alcance

- Mover la prioridad fuera de las transiciones: el ajuste por ticket de un Top 5 es `tickets-core` RQ-TC-29.
- Quién cambia la prioridad de un ticket de un cliente que no es Top 5: pregunta 3.b abierta
  (`docs/sdd/Preguntas_Gerencia_2026-09-29.md:69-89`).
- Retirar el campo `priority` del grafo: se descarta; se declara opcional y con guarda (S-2).
- Orden de «Mis tickets»: sin decisión (`apps/desk/src/lib/boardView.ts:15`).
