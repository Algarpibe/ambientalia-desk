# Delta de `vistas-tablero` — búsqueda por número de ticket y por serial en el listado

| Dato | Valor |
|---|---|
| Cambio | `busqueda-ticket-serial` (`tanda: F1B-08`, `cierra: no`) |
| Capacidad | `vistas-tablero` (existente; este delta **sólo añade**: no hay bloques MODIFIED) |
| Requisitos nuevos | `RQ-VT-11`, `RQ-VT-12`, `RQ-VT-13`. Libres: el último vivo es `RQ-VT-09` (`openspec/specs/vistas-tablero/spec.md:299`) y ningún otro cambio de `openspec/changes/` los nombra |
| Letra de Gerencia que manda | `decision/trabajo-del-01-10-antes-del-corte-sin-fila` (`openspec/config.yaml:3469`, `respuesta_textual`): «(1) la búsqueda por número de ticket y serial entra en F1B-08, antes del corte». E-133 (`docs/sdd/ENTRADA.md:1579`): «El serial se filtra con búsqueda parcial (por ejemplo, los últimos dígitos), con la misma lógica que el autocompletado por serial de la recepción. En el listado de tickets, la búsqueda por número de ticket y por serial es paridad con Zoho Desk y debe estar antes del corte del 14/12» |
| Maestro | M7.5, `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3061-3062` y `:1152` |

## Qué es letra y qué es supuesto

**Letra de Gerencia** (no se discute aquí): búsqueda por **número de ticket** y por **serial**; el serial es
**parcial** («los últimos dígitos») y con **la misma lógica** que el autocompletado de la recepción; es paridad
con Zoho en el **listado**.

**Supuestos de la propuesta** (`proposal.md` §6), razonables y reversibles, escritos abajo marcados
**[SUPUESTO S-n]**: nadie los decidió. S-1 número exacto · S-2 serial sin distinguir mayúsculas · S-3 recorte
de extremos · S-4 `%` y `_` sin escapar · S-5 dígitos buscan en número y en serial · S-6 la búsqueda respeta la
vista activa · S-7 longitud máxima 64 · S-8 sin mínimo en el servidor.

**Supuestos añadidos por esta fase de especificación** (la propuesta no los fija; mismo criterio de
reversibilidad):

- **[SUPUESTO S-9]** La longitud se mide **después de recortar** (un texto de sólo espacios, aunque sea largo, es
  «vacío» y no da 422).
- **[SUPUESTO S-10]** Un `q` que no es una sola cadena (parámetro repetido, `?q=a&q=b`) se rechaza con `422`, igual
  que un texto demasiado largo.
- **[SUPUESTO S-11]** Un `#` solo, o `#` seguido de algo que no son dígitos, no es un número: no busca por número y
  busca por serial el texto recortado **tal cual**, `#` incluido (sin serial que lo contenga, no devuelve nada).
  `#864` busca por número (864), y por serial el texto literal `#864`.
- **Límite de la letra, no de la implementación:** «número de ticket» se entiende como `tickets.number`, el que
  enseña el DTO como `'#' + number` (`packages/zoho-sync/src/db/mappers.ts:199`).

## ADDED Requirements

### Requirement: RQ-VT-11 · El listado se busca en el servidor por número de ticket y por serial

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

**Un `q` de sólo dígitos** busca por número **y** por serial, con `OR` **[SUPUESTO S-5]**.

**Estructura de la condición:** número y serial se unen con `OR`; ese conjunto **SHALL** ir entre paréntesis y
unido con `AND` al filtro de estado que ya existe, de modo que un ticket cerrado que casa nunca entra en la lista
de activos ni uno activo en la de cerrados. En `scope=closed`, el `total` **SHALL** ser el recuento **filtrado**, y
la página 2 **SHALL** traer los siguientes resultados de la **misma** búsqueda. Una página fuera de rango
**SHALL** devolver `items` vacío con el `total` filtrado.

**Orden y visibilidad.** La búsqueda **SHALL** respetar el `scope` que se pide **[SUPUESTO S-6]**: la vista inicial
es «Todos» (`apps/desk/src/App.tsx:57`), así que por defecto es global. Los resultados **SHALL** conservar el orden
que el listado ya tenía sin `q` (`RQ-VT-09` para activos y «Mis tickets»; `created_time DESC` para cerrados).
«Mis tickets» con `q` **SHALL** aplicar la búsqueda y **después** el predicado `esDeMisTickets`, y devolver sólo los
del usuario de la sesión, en el orden de la cola del taller. **La búsqueda no segmenta la visibilidad:** todo
usuario autenticado ve todos los tickets (`openspec/specs/permissions/spec.md:541`); `q` sólo recorta, no concede ni
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
- No se busca por asunto, cliente ni contacto: la letra dice número y serial.
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

### Requirement: RQ-VT-12 · La búsqueda por serial y el autocompletado de la recepción comparten una sola implementación del patrón

El patrón de búsqueda por serial **SHALL** tener **una sola implementación**, en `packages/shared`, que consumen
**a la vez** la búsqueda de tickets de `RQ-VT-11` y `searchEquipos` (el autocompletado de la recepción,
`apps/desk/server/db/equipos.ts:59-75`; llamado desde `apps/desk/server/routes/equipos.ts:19`). Es la letra
«con la misma lógica que el autocompletado por serial de la recepción» (E-133) hecha comprobable. Dos
implementaciones de la misma noción es el molde H5, y ya existen otras cuatro nociones de serial con otros
fines (`exploration.md` §3): esta **no** debe ser la quinta.

La implementación compartida **SHALL**: recortar los extremos, pasar a minúsculas y envolver en `%…%`; no escapar
`%` ni `_` **[SUPUESTO S-4]**.

**Efecto colateral declarado [SUPUESTO S-3]:** al compartir la función, el autocompletado de la recepción también
**recorta** los extremos de su texto, cosa que hoy no hace (`apps/desk/server/db/equipos.ts:60`). Se comprobó que
ningún requisito vivo fija lo contrario: `RQ-HV-06` (`openspec/specs/hojas-vida/spec.md:125-134`) exige que
`searchEquipos` encuentre por código interno «con el mismo criterio —insensible a mayúsculas, por coincidencia
parcial— con el que ya busca por serial», y recortar los extremos no contradice nada de eso; los demás pasajes
que nombran «Autocompletado» (`openspec/specs/tickets-core/spec.md:1341`) son filas de discrepancia con el
maestro, no comportamiento. **No hay bloque MODIFIED:** ningún requisito vivo cambia de letra. Reversión: quitar
el recorte del patrón compartido afecta a las dos búsquedas a la vez.

**Alcance de la noción compartida:** es el **patrón** (qué texto se busca y cómo se normaliza). `searchEquipos`
sigue buscando además en cliente, marca, modelo, tipo y código interno (`apps/desk/server/db/equipos.ts:67-69`);
eso no cambia y la búsqueda de tickets no lo hereda.

#### Scenario: [ROJO] los dos buscadores dan el mismo veredicto para la misma tabla de casos
- GIVEN una tabla de seriales y de casos de texto: últimos dígitos, centro del serial, mayúsculas, espacios a los
  lados, `%`, `_` y vacío
- WHEN se evalúa cada caso en `searchEquipos` y en la búsqueda de tickets (los equipos de prueba sin otro campo que
  contenga el texto, para aislar el serial)
- THEN el conjunto de seriales que coincide es el mismo en los dos, caso a caso
- AND devolver `searchEquipos` a su patrón propio (`%${q.toLowerCase()}%`) pone la prueba en rojo (mutación M-4)

#### Scenario: [ROJO] el autocompletado de la recepción recorta los extremos
- GIVEN un equipo con serial `ABC-123`
- WHEN se llama a `searchEquipos` con `'  abc-123  '`
- THEN devuelve el equipo (hoy no lo devuelve: el patrón conserva los espacios) **[SUPUESTO S-3]**

#### Scenario: [CARACTERIZACIÓN] el autocompletado conserva su comportamiento de «contiene», sin distinguir mayúsculas
- GIVEN las pruebas vivas de `apps/desk/server/db/equipos.test.ts` y `RQ-HV-06`
- WHEN se corren tras el cambio
- THEN siguen en verde sin modificar su letra

#### Scenario: [ROJO] una sola función de patrón
- GIVEN el árbol tras el cambio
- WHEN se busca el patrón `%…%` de serial en `apps/desk/server` y `packages/zoho-sync`
- THEN todas las rutas de búsqueda por serial de tickets y de equipos llaman a la función de `packages/shared`;
  ninguna construye el patrón por su cuenta (comprobación por lectura al verificar)

### Requirement: RQ-VT-13 · La caja de búsqueda del listado se verifica a mano (`.tsx` fuera de la red)

La cabecera del listado (hoy sin caja de búsqueda; `apps/desk/src/App.tsx:98-110` según la exploración, a
remedir al aplicar) **SHALL** tener una caja de búsqueda con texto en español que envíe `q` al servidor tras una
espera corta entre pulsaciones, y **SHALL** volver a la página 1 al cambiar el texto. El fichero de la caja es
`.tsx` y queda **fuera de la red de pruebas** por decisión de Gerencia (F0-00, `vitest.config.ts:16-20`): este
requisito **no admite escenario automatizado**. **No** se propone `jsdom` ni `@testing-library`. Lo que sí es
lógica se prueba en `.ts`: la construcción de la URL con `q` (`apps/desk/src/lib/`), cubierta por la prueba de
`RQ-VT-11`. El `maxLength` de 64 es comodidad; el `422` de `RQ-VT-11` es la imposición.

Verificación por persona, dueño QA / quien despliegue, **tras el despliegue** y sin contar como tarea de la tanda
(regla del ciclo 1): **archivar este cambio no la da por hecha.**

#### Scenario: manual — número con y sin «#»
- GIVEN el listado en `ambientalia-desk.ambientalia.cloud`, tras el despliegue
- WHEN se escribe un número de ticket con «#» y sin él
- THEN en los dos casos aparece ese ticket

#### Scenario: manual — últimos dígitos y mayúsculas de un serial
- GIVEN un ticket con serial conocido
- WHEN se escriben sus últimos dígitos, y luego el serial completo en minúsculas
- THEN el ticket aparece en las dos búsquedas

#### Scenario: manual — un cerrado de una página que no es la primera
- GIVEN un texto que casa con más de 50 cerrados, en la vista «Todos»
- WHEN se pasa a la página 2
- THEN el contador de la paginación muestra el total filtrado y la página trae los siguientes resultados

#### Scenario: manual — «Mis tickets» y borrar el texto
- GIVEN la vista «Mis tickets» con texto en la caja
- WHEN se busca y luego se borra el texto
- THEN al buscar sólo salen los del usuario y al borrar vuelve el listado completo

## Nota — sin bloques MODIFIED

Este delta no trae sección `MODIFIED Requirements` a propósito. Comprobado con `grep -i "searchEquipos|autocompletado" openspec/specs/`: sólo `RQ-HV-06`
(`openspec/specs/hojas-vida/spec.md:127`) nombra `searchEquipos`, y no fija el tratamiento de los espacios.
