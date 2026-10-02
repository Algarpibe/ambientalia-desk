# Delta para tickets-core — alta manual de equipo y cliente desconocidos (F1B-15)

## ADDED Requirements

### RQ-TC-30 · Cliente provisional: tabla propia `public.clientes_provisionales`, cinco datos obligatorios

El alta del ticket **SHALL** admitir un modo manual de cliente: en lugar de un `clientId` de Books, el cuerpo trae
razón social, NIT, contacto, teléfono y correo, y el servidor crea una fila en `public.clientes_provisionales`
(sentencia `CREATE TABLE` con el esquema calificado, al final de `schema.sql`) con la marca «pendiente de validar»,
quién la creó, cuándo y el **motivo escrito obligatorio** de por qué no se usó el cliente de Books. El ticket
**SHALL** quedar con el identificador del provisional como `client_id`, y ese identificador **MUST NOT** poder
coincidir con el de ningún contacto de Books. Los cinco datos y el motivo son obligatorios (supuesto Q2); si falta
alguno el alta responde `422` listando **todos** los que faltan (escalón C) sin escribir nada. Puede hacer el alta
manual quien hoy puede crear tickets (supuesto Q1). El alta manual **MUST NOT** escribir en `books.*` ni hacia Zoho.
Si el NIT del provisional ya pertenece a un cliente de Books (comparado sin puntos, espacios ni dígito de
verificación), el alta **SHALL** responder `409` (escalón D, unicidad) con el cliente existente (`id` y nombre) para
que se use ése, sin escribir nada (P-B, decidido por el usuario el 2026-10-02).

#### Scenario: Alta con cliente provisional
- GIVEN una sesión que puede crear tickets y los cinco datos y el motivo completos
- WHEN se envía `POST /api/tickets` en modo manual de cliente
- THEN responde `201`, existe una fila en `public.clientes_provisionales` marcada pendiente con autor, fecha y motivo, y el ticket tiene ese id como `client_id`

#### Scenario: Faltan datos del cliente
- GIVEN un cuerpo manual sin NIT ni correo
- WHEN se envía el alta
- THEN responde `422` nombrando NIT y correo en la misma lista y no queda ningún ticket, equipo ni provisional escrito

#### Scenario: Motivo vacío
- GIVEN un cuerpo manual con los cinco datos y un motivo de sólo espacios
- WHEN se envía el alta
- THEN responde `422` y no se escribe nada

#### Scenario: El NIT ya está en Books
- GIVEN un cliente de Books con NIT «900.123.456-7» y un alta manual con NIT «900123456»
- WHEN se envía el alta
- THEN responde `409` con el `id` y el nombre del cliente de Books, y no queda ningún ticket, equipo ni provisional escrito

#### Scenario: El id provisional no se confunde con uno de Books
- GIVEN un cliente provisional creado
- WHEN se compara su identificador con el conjunto de ids de `books.contacts`
- THEN no coincide con ninguno

### RQ-TC-31 · El alta manual conserva el orden de guardas y es atómica con el ticket

El alta manual de cliente y/o equipo **SHALL** crear el provisional, el equipo manual (si lo hay) y el ticket en
**una sola transacción**: un fallo en cualquiera no deja ninguna de las tres filas. Las guardas nuevas **SHALL**
respetar el orden total A < B < C < D de `transitions-st` §3.8: la existencia (A) precede al contenido (C) y éste a
la unicidad (D); en particular el `409` de unicidad de la OV sigue siendo la última guarda antes de la primera
escritura (RQ-TC-05). La guarda equipo↔cliente (RQ-TC-13) **SHALL** seguir coherente: el equipo manual nace con el
mismo `client_id` que el ticket. El ticket **SHALL** nacer en la fase inicial de su flujo: `Ticket creado`, o
`Solicitud Soporte` si la clasificación es `Soporte remoto` (RQ-TC-07).

#### Scenario: Ticket con las dos marcas
- GIVEN un alta manual de cliente y de equipo, clasificación distinta de `Soporte remoto`
- WHEN se envía `POST /api/tickets`
- THEN responde `201`, el ticket queda en `Ticket creado`, y cliente y equipo llevan la marca de pendiente

#### Scenario: Soporte remoto nace en su fase
- GIVEN un alta manual con clasificación `Soporte remoto`
- WHEN se envía `POST /api/tickets`
- THEN el ticket queda en `Solicitud Soporte` con las dos marcas

#### Scenario: Un fallo no deja nada a medias
- GIVEN un alta manual cuyo `INSERT` del ticket falla tras crear el provisional y el equipo
- WHEN la transacción termina
- THEN no existe ninguna fila nueva en `clientes_provisionales`, `equipos` ni `tickets`

#### Scenario: Posición de la unicidad de la OV
- GIVEN un alta manual con una OV ya asociada a otro ticket y, a la vez, un serial que no coincide con su confirmación
- WHEN se envía el alta
- THEN responde `422` (contenido, C) y no `409` (unicidad, D)

### RQ-TC-32 · Enlazar el cliente provisional con Books: sólo Comercial o administrador, en una transacción

Un endpoint de enlace **SHALL** reasignar un cliente provisional a un contacto de Books ya existente. Sólo un usuario
del área Comercial o un administrador **SHALL** poder usarlo; cualquier otro recibe `403` sin escribir nada. Las
respuestas siguen el orden de precedencia: `404` si el provisional no existe o el contacto de Books no existe (A);
`403` por permiso (B); `409` si el provisional ya está enlazado (B); `422` si falta el contacto destino (C). Al
aplicarse, el servidor **SHALL**, en **una transacción**, reescribir el `client_id` de todos los tickets y todos los
equipos del provisional al id de Books, marcar el provisional como enlazado (quién, cuándo) y quitar la marca de
cliente pendiente. Un fallo en cualquier escritura **MUST NOT** dejar nada reescrito. Tras el enlace, los tickets
y equipos se resuelven por el contacto de Books (RQ-TC-14) y el enlace **MUST NOT** escribir hacia Zoho: el contacto
lo crea Comercial a mano en Books.

#### Scenario: Enlace correcto
- GIVEN un provisional con dos tickets y un equipo, un contacto de Books existente y una sesión de Comercial
- WHEN se enlaza
- THEN responde `200`, los dos tickets y el equipo tienen `client_id` de Books, y el provisional queda enlazado con autor y fecha

#### Scenario: Sin permiso
- GIVEN una sesión que no es de Comercial ni administradora
- WHEN intenta enlazar
- THEN responde `403` y ningún `client_id` cambia

#### Scenario: Fallo a mitad
- GIVEN un enlace cuya reescritura de equipos falla tras reescribir los tickets
- WHEN la transacción termina
- THEN los tickets conservan el id provisional y el provisional sigue pendiente

#### Scenario: Contacto de Books inexistente
- GIVEN un contacto destino que no existe en Books
- WHEN se enlaza
- THEN responde `404` y no se escribe nada

#### Scenario: Doble enlace
- GIVEN un provisional ya enlazado
- WHEN se vuelve a enlazar a otro contacto
- THEN responde `409` y nada cambia

### RQ-TC-33 · Nada del alta manual se escribe en Zoho

Ni el alta manual, ni el enlace, ni la validación **SHALL** escribir en Zoho ni en `books.*` (`decision/p44-escritura-zoho`).
El único destino de escritura **SHALL** ser `public.clientes_provisionales`, `desk.equipos`, `desk.tickets` y sus trazas.

#### Scenario: Ninguna salida hacia Zoho
- GIVEN un alta manual, un enlace y una validación ejecutados con los clientes de escritura de Zoho y de `books.*` sustituidos por espías
- WHEN terminan los tres flujos
- THEN los espías registran cero llamadas

### RQ-TC-34 · El servidor de la app resuelve también los clientes provisionales, sin tocar la vista `public.clients`

La capa de servicio de `apps/desk/server` **SHALL** consultar `public.clientes_provisionales` con una **segunda
consulta**, además de la de Books (`public.clients`, que no cambia: RQ-ZS-16), en tres puntos: (1) la **búsqueda de
clientes**, (2) la **ficha de cliente** y (3) el **nombre del cliente en los listados** de tickets. En los tres, los
provisionales **no enlazados** **SHALL** aparecer **marcados como provisionales** (campo `provisional: true`); los
clientes de Books **SHALL** resolverse **exactamente igual que antes**, con `provisional: false`. Un provisional ya
enlazado **MUST NOT** aparecer como provisional: sus tickets y equipos llevan ya el `client_id` de Books y se
resuelven por el contacto (RQ-TC-32). Un identificador que exista en Books **MUST** tener prioridad y resolverse por
Books (los ids de ambos orígenes no coinciden: RQ-TC-30). Esta resolución **MUST NOT** modificar
`packages/zoho-sync/src/books/repo.ts`, la vista ni el worker del hub, y **MUST NOT** escribir en `books.*`.

#### Scenario: La búsqueda devuelve provisionales marcados
- GIVEN un provisional no enlazado con razón social «Acme Provisional» y un cliente de Books «Acme SAS»
- WHEN se busca «Acme»
- THEN la respuesta incluye ambos, el de Books con `provisional: false` y el provisional con `provisional: true`

#### Scenario: Un provisional enlazado no se lista como provisional
- GIVEN un provisional ya enlazado a un contacto de Books
- WHEN se busca por su razón social provisional
- THEN no aparece como provisional, y el cliente se resuelve únicamente por el contacto de Books

#### Scenario: La ficha de un provisional
- GIVEN un provisional no enlazado
- WHEN se pide la ficha de cliente con su id
- THEN responde `200` con razón social, NIT, contacto, teléfono, correo y `provisional: true`

#### Scenario: La ficha de un id de Books no cambia
- GIVEN un contacto de Books existente
- WHEN se pide su ficha de cliente
- THEN devuelve los mismos valores que antes del cambio y `provisional: false`

#### Scenario: Un id inexistente sigue siendo 404
- GIVEN un id que no está en Books ni en `clientes_provisionales`
- WHEN se pide la ficha de cliente
- THEN responde `404`, como antes

#### Scenario: El listado de tickets muestra el nombre del provisional
- GIVEN un ticket con `client_id` de un provisional no enlazado y otro con `client_id` de Books
- WHEN se consulta el listado de tickets
- THEN ambos muestran el nombre de su cliente, y el del provisional va marcado como provisional

#### Scenario: Prioridad de Books
- GIVEN un id presente en Books
- WHEN el servicio resuelve el nombre del cliente
- THEN usa el valor de Books y no consulta la tabla de provisionales para ese id
