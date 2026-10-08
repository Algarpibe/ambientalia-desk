# Delta para `transitions-st`

## MODIFIED Requirements

### RQ-TS-20 · `priority` deja de ser obligatorio en `escalado_a_revision` y `devolucion_a_correccion`

En `escalado_a_revision` y `devolucion_a_correccion` (las dos de área Servicio Técnico), el campo `priority`
SHALL ser **opcional**: una transición SHALL pasar la validación de campos obligatorios sin él. El campo SHALL
seguir declarado con sus opciones `High | Medium` y con destino `priority`, de modo que, si viene, se
aplica como hoy (`RQ-TS-09`) sujeto a la guarda de `RQ-TS-21`. Las opciones SHALL ser exactamente la lista asignable de
`packages/shared` que usan las rutas de prioridad (`tickets-core` RQ-TC-27 y RQ-TC-29): las dos listas no pueden
diverger. El servidor MUST rechazar con `422` y el mensaje `La prioridad debe ser una de: High, Medium` toda
`priority` pedida que declare la transición, no sea vacía, sea distinta de la actual y no esté en esa lista, aunque quien
la pide tenga permiso (supuesto S-K, reversible). Una `priority` igual a la que el ticket ya tiene no se rechaza, aunque
sea `Low` o `Urgent` heredada. Lo decide una función pura de `packages/shared` que recibe la prioridad actual
(`erroresPrioridadPedida`) y se suma al `422` agregado del servicio de tickets (regla invariable 13).
(Previously: las opciones eran `High | Medium | Low`, y el servidor no validaba el valor de `priority` pedido.)

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
- THEN `priority` figura con `target: 'priority'`, opciones `High` y `Medium` y no obligatorio

#### Scenario: las opciones son la lista asignable de `shared`
- GIVEN la lista asignable de `packages/shared` y las opciones del campo `priority` de las dos transiciones
- WHEN se comparan
- THEN son iguales, y devolver `Low` a una sola de las dos listas pone la suite en rojo

#### Scenario: una prioridad fuera de la lista pedida en una transición se rechaza (S-K)
- GIVEN un usuario con permiso para cambiar la prioridad (Director Técnico de `Servicio Técnico`, o administrador) y un ticket con prioridad `Medium`
- WHEN ejecuta `escalado_a_revision` con `priority: 'Low'` (o `'Urgent'`) en un cuerpo hecho a mano
- THEN responde `422` con el mensaje `La prioridad debe ser una de: High, Medium` y el ticket no cambia de estado ni de prioridad

#### Scenario: reenviar la misma prioridad no se rechaza aunque no sea asignable
- GIVEN un ticket con prioridad `Low` (o `Urgent`) heredada y un técnico no admin
- WHEN ejecuta `escalado_a_revision` con `priority` igual a la que el ticket ya tiene
- THEN responde `200`: el valor es igual a la actual y no se evalúa contra la lista asignable

#### Scenario: las demás transiciones no cambian
- GIVEN las 31 transiciones
- WHEN se comparan los campos obligatorios con los de antes de este cambio
- THEN sólo difiere `priority` en esas dos
(Previously: «las 34 transiciones».)

### RQ-TS-21 · Guarda de servidor: sólo admin o `puedeFijarPrioridadTop5` cambian la prioridad en una transición

Al ejecutar `escalado_a_revision` o `devolucion_a_correccion`, si `values.priority` **viene** y es **distinta** de la
prioridad actual del ticket, el servidor SHALL responder `403` salvo que el usuario sea administrador o cumpla el
predicado de ajuste por ticket de `packages/shared` (Director Comercial con su área `Comercial`, o Director Técnico por
cargo; `permissions` RQ-PM-20 y RQ-PM-23), que se CONSUME (regla invariable 13). La guarda no mira el cliente del
ticket: se aplica igual a un ticket de un cliente que no es Top 5 o sin `client_id` (supuestos S-G y S-H de la
propuesta). El mensaje SHALL ser `La prioridad del ticket la ajustan el Director Comercial o el Director Técnico: tu cargo no puede cambiarla en esta etapa`. Si `values.priority`
**no viene**, o **viene igual** a la actual, la transición SHALL pasar esta
guarda. Un `403` SHALL no escribir nada: ni estado, ni prioridad, ni fila en `ticket_transitions`. Una transición
distinta de esas dos MUST NOT quedar afectada por esta guarda. Como las dos transiciones son de Servicio Técnico, el
`403` de área sigue ganando (`RQ-TS-22`): el Director Técnico cambia ahí la prioridad por su cargo, y un Director
Comercial sólo si además tiene el área Servicio Técnico (supuesto S-2). Cambio visible desde el despliegue: el Director
Técnico pasa a poder cambiar la prioridad en esas dos transiciones; el resto de los técnicos sigue sin poder.
(Previously: el predicado era `puedeFijarPrioridadTop5`, que exige además el área `Comercial`, y por eso en la práctica
sólo el administrador, o un usuario con ambas áreas y cargo `Director Comercial`, cambiaba ahí la prioridad.)

#### Scenario: técnico que cambia la prioridad, 403
- GIVEN un usuario no admin de `Servicio Técnico`, sin cargo de dirección, y un ticket con prioridad `Medium`
- WHEN ejecuta `escalado_a_revision` con `priority: 'High'`
- THEN responde `403` y el ticket no cambia de estado ni de prioridad

#### Scenario: técnico en la devolución, 403
- GIVEN un usuario no admin de `Servicio Técnico`, sin cargo de dirección, y un ticket con prioridad `High`
- WHEN ejecuta `devolucion_a_correccion` con `priority: 'Medium'`
- THEN responde `403`

#### Scenario: el Director Técnico cambia la prioridad en las dos transiciones
- GIVEN un usuario del área `Servicio Técnico` con cargo `Director Técnico` y un ticket con prioridad `Medium`
- WHEN ejecuta `escalado_a_revision` con `priority: 'High'`, y en otro ticket `devolucion_a_correccion` con una prioridad distinta de la actual
- THEN responde `200` en las dos y las prioridades cambian

#### Scenario: el Director Técnico cambia la prioridad de un ticket sin cliente
- GIVEN un ticket sin `client_id` y un Director Técnico de `Servicio Técnico`
- WHEN ejecuta `escalado_a_revision` con una prioridad distinta
- THEN responde `200`

#### Scenario: la misma prioridad pasa
- GIVEN un ticket con prioridad `High` y un técnico no admin
- WHEN ejecuta `escalado_a_revision` con `priority: 'High'`
- THEN responde `200`

#### Scenario: sin el campo pasa
- GIVEN un técnico no admin
- WHEN ejecuta `escalado_a_revision` sin `priority`
- THEN responde `200`

#### Scenario: ticket sin prioridad y campo informado
- GIVEN un ticket con prioridad nula y un técnico no admin, sin cargo de dirección
- WHEN ejecuta `escalado_a_revision` con `priority: 'Medium'`
- THEN responde `403`, porque `Medium` es distinta de la actual

#### Scenario: administrador cambia la prioridad
- GIVEN un administrador y un ticket con prioridad `Medium`
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

#### Scenario: Director Técnico sin área de Servicio Técnico
- GIVEN un usuario sólo del área `Comercial` con cargo `Director Técnico`
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
