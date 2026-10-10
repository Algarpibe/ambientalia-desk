## ADDED Requirements

### Requirement: RQ-VT-14 · Las listas de tickets traen la marca de garantía calculada por el servidor, por lote

Fuente: E-105 (`docs/sdd/ENTRADA.md:1396-1400`): distintivo «en cabecera, lista y tablero»; maestro R08.4 (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1611-1614`). Mismo molde que `RQ-VT-07`.

Toda lista de tickets que sirve el servidor **SHALL** traer, en cada ticket con equipo, la marca de garantía del predicado de `RQ-TC-58` (nombre y forma los fija el diseño, el mismo campo que el detalle de `RQ-TC-59`). Los productores son tres, y **los tres** la llevan:

1. la cola del taller (`GET /api/tickets` activos y todos, y `GET /api/mis-tickets`);
2. los cerrados de `GET /api/tickets`;
3. la lista de «Remisión creada» (`RQ-VT-10`).

- **Por lote.** El fin de garantía de todos los equipos de la página **SHALL** obtenerse con **una sola** consulta aparte, no una por ticket, y **sin unir `equipos`** en las consultas de tickets. Si la consulta falla, la lista **MUST** servirse igual, sin marcas.
- **Sin equipo, sin marca.** Un ticket sin `equipo_id` no lleva el campo. Un ticket **cerrado** lo lleva igual que uno abierto.
- **Fuera del orden y del contenido.** La marca **MUST NOT** cambiar qué tickets salen, su orden (`RQ-VT-09`, `RQ-VT-10`) ni la paginación o la búsqueda (`RQ-VT-11`).
- **Regla invariable 13.** El servidor decide la marca; el cliente **MUST NOT** recalcularla.

#### Scenario: la cola del taller trae la marca
- GIVEN dos tickets activos, uno de un equipo en garantía y otro de un equipo sin fin de garantía
- WHEN se pide `GET /api/tickets`
- THEN el primero trae `en_garantia` y el segundo `sin_dato`

#### Scenario: «Mis tickets» trae la marca
- GIVEN un ticket del usuario cuyo equipo está en garantía
- WHEN se pide `GET /api/mis-tickets`
- THEN el ticket trae `en_garantia`

#### Scenario: los cerrados traen la marca
- GIVEN un ticket cerrado creado dentro de la garantía de su equipo
- WHEN se pide la vista de cerrados de `GET /api/tickets`
- THEN el ticket trae `en_garantia`

#### Scenario: la lista de «Remisión creada» trae la marca
- GIVEN un ticket en `Remisión creada` con equipo en garantía
- WHEN se pide la lista de «Remisión creada»
- THEN el ticket trae `en_garantia`

#### Scenario: ticket sin equipo, sin marca en la lista
- GIVEN un ticket sin `equipo_id`
- WHEN se pide cualquiera de las tres listas
- THEN el ticket no trae el campo

#### Scenario: instante frontera en la lista
- GIVEN un equipo con fin `2026-03-15` y dos tickets, creados el `2026-03-15T20:00:00-05:00` y el `2026-03-16T00:30:00-05:00`
- WHEN se piden en una lista
- THEN el primero trae `en_garantia` y el segundo trae `vencida`

#### Scenario: una consulta por lote
- GIVEN una página de veinte tickets de equipos distintos
- WHEN se pide la lista
- THEN el fin de garantía se lee con una sola consulta (no veinte)

#### Scenario: la consulta falla, la lista se sirve
- GIVEN un fallo al leer `equipos`
- WHEN se pide la lista
- THEN responde con los mismos tickets y el mismo orden, sin marcas

#### Scenario: un productor sin la marca se detecta
- GIVEN la mutación que quita la marca de uno de los tres productores
- WHEN corre la suite
- THEN falla la prueba de ese productor

### Requirement: RQ-VT-15 · Tarjeta, lista, tabla y cabecera pintan «En garantía» y «Garantía sin dato», y se verifican a mano (`.tsx` fuera de la red)

Fuente: E-105 (`docs/sdd/ENTRADA.md:1396-1400`); maestro R08.4 (`R08.4.md:1611-1614`). Precedente: `RQ-VT-08`, `RQ-VT-13`.

El cliente **SHALL** pintar la marca de `RQ-VT-14` y `RQ-TC-59` como distintivo visible, con texto en español, en la tarjeta del tablero (`TicketCard.tsx`), la lista (`TicketList.tsx`), la tabla (`TicketTable.tsx`) y la cabecera del ticket (`TicketDetailView.tsx`):

- `en_garantia`: distintivo «En garantía» (verde, supuesto S2).
- `sin_dato`: distintivo «Garantía sin dato» (gris neutro, supuesto S2), con título que diga que Comercial lo completa en la hoja de vida del equipo (supuesto S6); **MUST NOT** enlazar ni exigir permiso nuevo.
- `vencida` o marca ausente: **ningún** distintivo (supuestos S1 y S3).
- **No ámbar:** el ámbar es de la espera (`RQ-VT-04`) y se confundiría.
- El cliente **MUST NOT** calcular la marca ni leer fechas de garantía para estas cuatro vistas: sólo pinta el campo que manda el servidor.
- Un ticket cerrado conserva el distintivo.

Los cuatro ficheros son `.tsx` y quedan **fuera de la red de pruebas** por decisión de Gerencia (F0-00, `vitest.config.ts:16-20`): este requisito **no admite escenario automatizado**; la prueba automatizada vive en el servidor (`RQ-VT-14`, `RQ-TC-58`, `RQ-TC-59`). **No** se propone `jsdom` ni `@testing-library`. Verificación por persona, **tras el despliegue** y sin contar como tarea de la tanda (regla del ciclo 1): **archivar este cambio no la da por hecha.**

#### Scenario: manual — tarjeta del tablero
- GIVEN el tablero en `ambientalia-desk.ambientalia.cloud`, tras el despliegue, con un ticket de equipo en garantía y otro de equipo sin fin registrado
- WHEN se inspeccionan sus tarjetas
- THEN la primera muestra «En garantía» en verde y la segunda «Garantía sin dato» en gris

#### Scenario: manual — lista y tabla
- GIVEN los mismos tickets
- WHEN se abre la vista de lista y la de tabla
- THEN cada uno muestra su distintivo, y un ticket de garantía vencida o sin equipo no muestra ninguno

#### Scenario: manual — cabecera del ticket
- GIVEN el detalle de un ticket de equipo en garantía
- WHEN se mira la fila de chips de la cabecera
- THEN aparece «En garantía»; en un ticket con equipo sin fin aparece «Garantía sin dato» con el título que remite a Comercial

#### Scenario: manual — un ticket cerrado conserva el distintivo
- GIVEN un ticket cerrado creado dentro de la garantía de su equipo
- WHEN se abre en la vista «Todos» o en su detalle
- THEN muestra «En garantía»

#### Scenario: manual — el color no se confunde con la espera
- GIVEN un ticket en espera y otro «En garantía» en el mismo tablero
- WHEN se comparan sus tarjetas
- THEN el distintivo de garantía no es ámbar
- Verificación anotada con su resultado por una persona, no por una prueba automatizada
