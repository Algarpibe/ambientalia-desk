# Delta para vistas-tablero

## MODIFIED Requirements

### Requirement: RQ-VT-11 · El listado se busca en el servidor por número de ticket, serial, cliente y código de servicio

`GET /api/tickets` y `GET /api/mis-tickets` **SHALL** aceptar un parámetro `q`. El filtro **SHALL** aplicarlo el
**servidor**, en la consulta, sobre tres poblaciones: los tickets activos (`scope` distinto de `closed`), los
cerrados paginados **y su recuento** (`scope=closed`) y «Mis tickets». Hoy el endpoint sólo lee `scope` y `page`
(`apps/desk/server/routes/tickets.ts:104-116`, medido en la propuesta §1).

**Cómo se normaliza `q`** (una sola función de `packages/shared`, ver `RQ-VT-12`):

1. Se recortan los espacios de los dos extremos; los interiores se conservan **[SUPUESTO S-3]**.
2. Un `q` vacío tras recortar **SHALL** significar «sin búsqueda»: la respuesta es la misma que sin `q`.
3. Más de 64 caracteres tras recortar **SHALL** responder `422` **[SUPUESTO S-7, S-9]**. Un `q` que no es una cadena
   única **SHALL** responder `422` **[SUPUESTO S-10]**. No hay mínimo de caracteres en el servidor **[SUPUESTO S-8]**.

**Cómo coincide el número:** el ticket coincide por número cuando `q`, recortado y quitado **un** `#` inicial, son
sólo dígitos, caben en un `integer` y son **iguales** a `tickets.number` **[SUPUESTO S-1]**: «864» y «#864»
encuentran el 864; «86» no lo encuentra por número. Un `q` de dígitos que no cabe en `integer` **SHALL NOT** romper
la consulta: busca sólo por serial.

**Cómo coincide el serial** (letra: parcial, «los últimos dígitos»): el ticket coincide cuando el texto recortado y
en minúsculas está **contenido** en el serial en minúsculas, sin distinguir mayúsculas **[SUPUESTO S-2]**; `%` y `_`
**no** se escapan, como hoy en el autocompletado **[SUPUESTO S-4]**. El serial se busca en **las dos** columnas: la
copia del ticket (`tickets.serial`) **y** el serial del equipo enlazado por `tickets.equipo_id`. La razón: el serial
de un equipo se puede editar (`apps/desk/server/db/equipos.ts:137`, `apps/desk/server/db/equipos.ts:150`) y la copia
del ticket sólo se rellena una vez (`apps/desk/server/backfillSerial.ts:16`; medido en `exploration.md` §2), así que
buscando sólo en la copia un ticket no aparecería por el serial corregido de su equipo. El serial viejo, el de la
copia, **SHALL** seguir encontrando el ticket.

**Un `q` de sólo dígitos** busca por número **y** por serial, con `OR` **[SUPUESTO S-5]**, y además por cliente y código (`RQ-VT-17`).

**Estructura de la condición:** número, serial, cliente y código se unen con `OR`; ese conjunto **SHALL** ir entre paréntesis y
unido con `AND` al filtro de estado que ya existe, de modo que un ticket cerrado que casa nunca entra en la lista
de activos ni uno activo en la de cerrados. En `scope=closed`, el `total` **SHALL** ser el recuento **filtrado**, y
la página 2 **SHALL** traer los siguientes resultados de la **misma** búsqueda. Una página fuera de rango
**SHALL** devolver `items` vacío con el `total` filtrado.

**Orden y visibilidad.** La búsqueda **SHALL** respetar el `scope` que se pide **[SUPUESTO S-6]**: la vista inicial
es «Todos» (`apps/desk/src/App.tsx:57`), así que por defecto es global. Los resultados **SHALL** conservar el orden
que el listado ya tenía sin `q` (`RQ-VT-09` para activos y «Mis tickets»; `created_time DESC` para cerrados).
«Mis tickets» con `q` **SHALL** aplicar la búsqueda y **después** el predicado `esDeMisTickets`, y devolver sólo los
del usuario de la sesión, en el orden de la cola del taller. **La búsqueda no segmenta la visibilidad:** todo
usuario autenticado ve todos los tickets (`openspec/specs/permissions/spec.md:550` en `373401e`); `q` sólo recorta, no concede ni
niega.

**Posición de la validación:** la comprobación de `q` **SHALL** correr **después** de `requireAuth`
(`apps/desk/server/routes/tickets.ts:35`): sin sesión, un `q` inválido responde `401`, no `422`.

**Regla invariable 13, decisión a decisión** (`proposal.md` §5): el cliente **SHALL** enviar sólo el texto tal
cual lo escribió la persona. **MUST NOT** quitar `#`, pasar a minúsculas, recortar, ni filtrar por `q` los tickets
que recibe; el filtro de vista de `applyBoardView` (`apps/desk/src/lib/boardView.ts:33-37`) no es guarda y no cambia.
El `maxLength` de la caja es comodidad con imposición probada (el `422`). Volver a la página 1 al cambiar el texto
es comodidad: aunque no lo hiciera, una página fuera de rango devuelve `items` vacío.

**Límites declarados (no son fallos):**

- Un ticket **sin serial** —ni en su columna ni en el equipo enlazado— **no se encuentra por serial**. Los tickets
  de Zoho sin serial en sus campos ni en el asunto caen aquí (`packages/zoho-sync/src/db/mappers.ts:61-66`). El
  relleno de `tickets.serial` en filas históricas es dato de producción y queda **fuera**.
- No se busca por asunto ni contacto (`decision/e198-busqueda-cliente-y-codigo`); cliente y código, en `RQ-VT-17`.
- No hay índice nuevo: `LIKE '%x%'` recorre la tabla (hipótesis: miles de filas; la propuesta §10 pide el recuento
  real al desplegar).

#### Scenario: [ROJO] el número coincide exacto, con y sin «#»
- GIVEN tickets con los números 86, 864 y 8640
- WHEN se pide `GET /api/tickets?q=864` y `GET /api/tickets?q=%23864`
- THEN las dos respuestas incluyen el ticket 864
- AND no incluyen el 86 ni el 8640 por número

#### Scenario: [ROJO] un número parcial no encuentra por número
- GIVEN el ticket 864 y ningún serial que contenga «86»
- WHEN se pide `q=86`
- THEN el 864 no aparece

#### Scenario: [ROJO] los últimos dígitos de un serial encuentran el ticket
- GIVEN un ticket con serial `SN-0042517`
- WHEN se pide `q=2517`
- THEN el ticket aparece

#### Scenario: [ROJO] mayúsculas y espacios a los lados no cambian el resultado
- GIVEN un ticket con serial `AbC-123`
- WHEN se pide `q=abc-123` y `q=%20%20ABC-123%20%20`
- THEN las dos respuestas incluyen el ticket y son iguales entre sí

#### Scenario: [ROJO] el espacio interior se conserva
- GIVEN un ticket con serial `AB 12` y otro con `AB12`
- WHEN se pide `q=ab 12`
- THEN aparece el primero y no el segundo **[SUPUESTO S-3]**

#### Scenario: [ROJO] el serial se busca en el equipo enlazado, también tras editarlo
- GIVEN un ticket cuya copia `tickets.serial` es `VIEJO-77` y cuyo equipo enlazado cambió su serial a `NUEVO-88`
- WHEN se piden `q=NUEVO-88` y `q=VIEJO-77`
- THEN las dos respuestas incluyen el ticket

#### Scenario: [ROJO] un ticket sin serial en ningún sitio no se encuentra por serial
- GIVEN un ticket sin `tickets.serial` y sin equipo enlazado
- WHEN se pide `q=` con cualquier fragmento de serial
- THEN no aparece
- AND sí aparece si se pide por su número (límite declarado)

#### Scenario: [ROJO] un texto de dígitos busca en número y en serial
- GIVEN el ticket 864 y, aparte, otro ticket con serial `X-864-Z`
- WHEN se pide `q=864`
- THEN aparecen los dos **[SUPUESTO S-5]**

#### Scenario: [ROJO] un número que no cabe en `integer` no rompe la consulta
- GIVEN un ticket con serial `99999999999-A`
- WHEN se pide `q=99999999999`
- THEN responde `200`, el ticket aparece por serial y no hay error de base de datos

#### Scenario: [ROJO] un «#» solo no es un número
- GIVEN tickets cualesquiera sin serial que contenga «#»
- WHEN se pide `q=%23`
- THEN responde `200` con `items` vacío **[SUPUESTO S-11]**

#### Scenario: [CARACTERIZACIÓN] sin `q`, o con `q` vacío o de espacios, la respuesta es la de hoy
- GIVEN una base con tickets activos y cerrados
- WHEN se pide el listado sin `q`, con `q=` y con `q=%20%20` (activos, `scope=closed` y «Mis tickets»)
- THEN las tres respuestas de cada población son iguales entre sí, byte a byte, y coinciden con la respuesta
  anterior al cambio

#### Scenario: [ROJO] los cerrados paginados traen el recuento filtrado
- GIVEN 120 cerrados, 60 de los cuales casan con `q`, y `pageSize = 50`
- WHEN se piden `scope=closed&q=…&page=1` y `page=2`
- THEN `total` es 60, la página 1 trae 50 y la página 2 trae los otros 10 de la misma búsqueda
- AND quitar `q` del recuento (`countClosedTickets`) pone la prueba en rojo (mutación)

#### Scenario: [ROJO] una página fuera de rango devuelve vacío con el total filtrado
- GIVEN los mismos 60 cerrados que casan
- WHEN se pide `page=9`
- THEN `items` es vacío y `total` es 60

#### Scenario: [ROJO] un cerrado que casa no sale entre los activos, y al revés (posición de la condición)
- GIVEN un cerrado y un activo que casan con el mismo `q` por serial
- WHEN se piden los activos y, aparte, `scope=closed`
- THEN los activos incluyen sólo el activo y los cerrados sólo el cerrado
- AND sacar el `OR` de sus paréntesis, o ponerlo antes del filtro de estado, pone la prueba en rojo (mutación)

#### Scenario: [ROJO] «Mis tickets» con `q` devuelve sólo los del usuario, en el orden de la cola
- GIVEN tres tickets que casan con `q`: dos derivados al usuario de la sesión (prioridades distintas) y uno a otro
- WHEN el usuario pide `GET /api/mis-tickets?q=…`
- THEN llegan sólo sus dos, en el orden de `RQ-VT-09`

#### Scenario: [ROJO] un `q` demasiado largo responde `422`, con sesión
- GIVEN un usuario autenticado
- WHEN pide el listado con un `q` de 65 caracteres no blancos, y con uno de 64
- THEN el primero responde `422` y el segundo `200` **[SUPUESTO S-7]**

#### Scenario: [ROJO] un `q` largo de sólo espacios es vacío
- GIVEN un usuario autenticado
- WHEN pide el listado con 80 espacios
- THEN responde `200`, igual que sin `q` **[SUPUESTO S-9]**

#### Scenario: [ROJO] un `q` repetido responde `422`
- GIVEN un usuario autenticado
- WHEN pide `?q=a&q=b`
- THEN responde `422` **[SUPUESTO S-10]**

#### Scenario: [CARACTERIZACIÓN que se vuelve guarda de posición] sin sesión, un `q` largo responde `401`
- GIVEN una petición sin sesión con un `q` de 65 caracteres
- WHEN se envía a `GET /api/tickets` y a `GET /api/mis-tickets`
- THEN responde `401`, no `422`
- AND montar la validación de `q` delante de `requireAuth` pone la prueba en rojo (mutación de posición,
  regla de mutación 1). Hoy da `401` porque `q` no se lee; la prueba nace verde y fija la posición cuando
  la validación existe

#### Scenario: [CARACTERIZACIÓN] la búsqueda no segmenta la visibilidad
- GIVEN dos usuarios autenticados de áreas distintas y un ticket que casa con `q`
- WHEN cada uno busca ese `q` en el listado general
- THEN los dos lo reciben

#### Scenario: [ROJO] mutaciones del predicado, cada una con su rojo
- GIVEN las pruebas anteriores
- WHEN se muta el predicado de serial de «contiene» a «empieza por», se quita `LOWER`, o la igualdad del número
  pasa a `LIKE`
- THEN cada mutación pone en rojo al menos una prueba distinta

#### Scenario: [VERIFICACIÓN DE PERSONA] el cliente sólo envía el texto
- GIVEN el cliente de la caja (`RQ-VT-13`)
- WHEN se lee su código
- THEN no quita `#`, no cambia mayúsculas, no recorta, y no filtra por `q` los tickets recibidos (lectura del `.tsx`,
  fuera de la red por F0-00)

## ADDED Requirements

### Requirement: RQ-VT-17 · El listado se busca también por cliente y por código de servicio, con una sola regla de normalización

`decision/e198-busqueda-cliente-y-codigo` (Gerencia, 2026-10-17): «la búsqueda cubre número de ticket, serial, cliente
y código de servicio; el contacto no». El mismo `q` de `RQ-VT-11`, en las mismas tres poblaciones (activos, cerrados
paginados con su recuento, «Mis tickets»), **SHALL** encontrar también un ticket:

- **por código de servicio**, cuando el patrón está contenido en `tickets.codigo_servicio`;
- **por cliente**, cuando está contenido en el nombre de la cuenta de Zoho Desk del ticket (`accounts.name` por
  `tickets.account_id`) o en el del cliente de Books (`clients.name` por `tickets.client_id`) **[SUPUESTO S-2: casa
  cualquiera de los dos]**. Del cliente sólo cuenta el nombre, no `company_name` ni el NIT **[SUPUESTO S-3]**;
- **por cliente provisional**, cuando está contenido en `razon_social` de un `public.clientes_provisionales` **no
  enlazado** cuyo `id` es el `client_id` del ticket. Es el mismo provisional que `conProvisionales`
  (`apps/desk/server/db/ticketsConCliente.ts:15-24`) rellena después de la consulta: si la búsqueda no lo mirase, el
  listado enseñaría un nombre por el que no se puede buscar.

**MUST NOT** buscar por contacto ni por asunto **[SUPUESTO S-4]**. El número **SHALL** seguir siendo exacto y el serial
**SHALL** seguir como en `RQ-VT-11` y `RQ-VT-12`.

**Regla de normalización, una sola para los cuatro campos de texto** (serial, código, cliente y provisional): la de
`patronSerial` (`packages/shared/src/busquedaTickets.ts:15-17`), que ya consumen `RQ-VT-11` y `RQ-VT-12`:

1. se recortan los espacios de los extremos; los interiores se conservan;
2. no se distinguen mayúsculas: el texto pasa a minúsculas en `packages/shared` y la columna con `LOWER` en el SQL;
3. «contiene»: `%texto%`; `%` y `_` no se escapan;
4. **no se pliegan acentos ni puntuación ni formas societarias [SUPUESTO S-1]**: «energia» no encuentra «Energía» y
   «ambientalia sas» no encuentra «Ambientalia S.A.S.». Plegar exige `translate` o `unaccent` en el SQL, y pg-mem no
   tiene ni `translate` ni `replace` (medido en `proposal.md` §2): quedaría sin prueba.

**Molde H5, enfrentado por prueba.** Es la misma regla que el criterio de nombre de `searchClients`
(`packages/zoho-sync/src/books/repo.ts:117-127`) y **distinta a propósito** de `normalizarNombreCliente`
(`apps/desk/server/backfillClientId.ts:47-68`), que empareja grafías para enlazar equipos. Una prueba **SHALL** fijar
las dos cosas sobre la misma tabla de casos: que la búsqueda de tickets y `searchClients` dan el mismo veredicto por
nombre, y que los casos en que `normalizarNombreCliente` converge y la búsqueda no son exactamente los declarados.

**Estructura de la condición.** Las tres vías nuevas **SHALL** ir dentro del MISMO paréntesis que número y serial,
cada una como subconsulta `IN (SELECT …)`: no hay `JOIN` nuevo, así que el recuento de cerrados
(`packages/zoho-sync/src/db/repo.ts:173`, sin `JOIN`) usa el mismo fragmento y ninguna fila se duplica.

**Regla invariable 13.** El cliente no toma ninguna decisión nueva: la caja (`apps/desk/src/components/BuscadorTickets.tsx`)
sólo cambia su texto a «Buscar por número, serial, cliente o código» y sigue enviando el texto tal cual.

#### Scenario: [ROJO] el código de servicio se encuentra por una parte
- GIVEN un ticket con `codigo_servicio` `MT_18A19042_EDM180C_260301` y otro con `CG_77B_OTRO`
- WHEN se pide `q=edm180c`
- THEN sale sólo el primero

#### Scenario: [ROJO] el cliente se encuentra por la cuenta de Desk y por el cliente de Books
- GIVEN un ticket con cuenta de Desk «Gecelca S.A. E.S.P.», otro con cliente de Books «Camposol Colombia» y un tercero sin cliente
- WHEN se pide `q=gecelca` y después `q=CAMPOSOL`
- THEN la primera da sólo el de Gecelca y la segunda sólo el de Camposol

#### Scenario: [ROJO] el cliente provisional también se encuentra
- GIVEN un ticket cuyo `client_id` es un provisional no enlazado con razón social «Zeta Provisional»
- WHEN se pide `q=zeta`
- THEN el ticket sale, y el listado lo trae con `accountName` «Zeta Provisional» y `clienteProvisional`

#### Scenario: [ROJO] un provisional ya enlazado no se encuentra por su razón social vieja
- GIVEN un provisional enlazado a un cliente de Books de otro nombre y un ticket que sigue apuntando a él
- WHEN se pide su razón social vieja
- THEN el ticket no sale por esa vía

#### Scenario: [ROJO] el contacto no se busca
- GIVEN un ticket cuyo contacto se llama «Ana Ruiz» y que no casa por nada más
- WHEN se pide `q=ruiz`
- THEN no sale

#### Scenario: [ROJO] un cerrado que casa por cliente no sale entre los activos (posición del paréntesis)
- GIVEN un ticket cerrado y uno activo del mismo cliente
- WHEN se piden los activos, los cerrados y su recuento con el nombre del cliente
- THEN los activos traen sólo el activo, los cerrados sólo el cerrado y el recuento es 1
- AND sacar del paréntesis la vía del cliente, o el `OR` entero, pone esta prueba en rojo (regla de mutación 1)

#### Scenario: [ROJO] número exacto, sin cambio
- GIVEN el ticket 864 y un cliente llamado «Cliente 8640»
- WHEN se pide `q=864`
- THEN sale el 864 por número y el del cliente por contener «864»: la vía nueva suma, no sustituye

#### Scenario: [ROJO] la regla de normalización enfrentada a `searchClients` y a `normalizarNombreCliente`
- GIVEN una tabla de nombres y textos con mayúsculas, espacios en los extremos y en el interior, acentos y formas societarias
- WHEN se busca cada texto en los tickets y en `searchClients`, y se normaliza cada par con `normalizarNombreCliente`
- THEN la búsqueda de tickets y `searchClients` dan el mismo veredicto en todos los casos
- AND los casos en que `normalizarNombreCliente` converge y la búsqueda no casa son exactamente los tres declarados (un acento, una forma societaria y un espacio interior)

#### Scenario: [ROJO] mutaciones de las vías nuevas, cada una con su rojo
- GIVEN las pruebas anteriores
- WHEN se quita `LOWER` de una vía nueva, se quita el `enlazado_a IS NULL` del provisional, o una vía pasa de «contiene» a «empieza por»
- THEN cada mutación pone en rojo al menos una prueba

#### Scenario: [VERIFICACIÓN DE PERSONA] la caja dice lo que busca
- GIVEN el listado en `ambientalia-desk.ambientalia.cloud`, tras el despliegue
- WHEN se lee la caja y se busca un cliente y un código de servicio conocidos
- THEN la caja dice «Buscar por número, serial, cliente o código» y las dos búsquedas encuentran su ticket
- AND es lectura del `.tsx`, fuera de la red por F0-00; archivar no la da por hecha (regla del ciclo 1)
