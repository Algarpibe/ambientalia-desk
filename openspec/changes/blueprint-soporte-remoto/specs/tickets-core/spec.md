# Delta for tickets-core

## MODIFIED Requirements

### Requirement: RQ-TC-05 · Orden de las guardas del alta, y qué contesta cada una

`POST /api/tickets` (`routes/tickets.ts:124-126`) **SHALL** exigir sesión (`:35`) y **SHALL** aplicar
las guardas de `createManagedTicket` (`ticketService.ts:21-111`) **en este orden**, el que exige el
orden total de precedencia (`transitions-st` §3.8):

| Orden | Guarda | Escalón | Respuesta | Evidencia |
|---|---|---|---|---|
| 1 | Falta el equipo (salvo rama «Equipo nuevo», RQ-TC-15) | A | `422 'Falta el equipo'` | `ticketService.ts:23-24` |
| 2 | El equipo no está en el catálogo | A | `422 'Equipo no registrado'` | `:26-27` |
| 3 | La orden de venta no existe en Books | A | `422 'Orden de venta no encontrada'` | `:37-39` |
| 4 | Discrepancia equipo↔cliente | C | `422`, nombrando al cliente del equipo | `:61-79` |
| 5 | Faltan obligatorios (cliente, tipo de servicio, clasificaciones, prefijo) | C | `422`, con **todos** en una lista | `:83-88` |
| 6 | El cliente no existe en Books | C | `422 'Cliente no encontrado'` | `:89-90` |
| 7 | La orden de venta ya está asociada a otro ticket | D | `409` | `:96-100` |

**Rama «Equipo nuevo» — dos guardas nuevas, mismo escalón.** Cuando la guarda 1 no aplica por
`clasificaciones === 'Equipo nuevo'` (RQ-TC-15), el alta exige en su lugar:

| Guarda nueva | Escalón | Respuesta |
|---|---|---|
| Falta `serial`, `modeloId` o `fechaFacturaCompra` | A | `422` |
| Un campo opcional (fecha, Drive, mantenedor) es inválido | C | `422`, mensaje de F1B-02 |

**Modalidad — una guarda nueva, escalón C.** El alta valida `modalidad` (`transitions-soporte-remoto`
RQ-SR-07 y RQ-SR-09): un valor fuera de `remoto` / `en sitio` con clasificación `Soporte remoto`, o
cualquier `modalidad` enviada con otra clasificación, responde `422` nombrando el campo. Es contenido, así
que gana al `409` de unicidad de la OV (guarda 7, escalón D).

| Guarda nueva | Escalón | Respuesta |
|---|---|---|
| `modalidad` inválida, o enviada fuera de `Soporte remoto` | C | `422`, nombrando `modalidad` |

El orden relativo de estas guardas frente a las guardas 3-7 de la tabla de arriba, y entre sí, lo
fija `design.md`; esta spec sólo impone el escalón: existencia (A) antes que contenido (C), igual que
el resto de la tabla.

- El `422` de obligatorios **SHALL** listar **todos** los que faltan y no de uno en uno (probado en
  `services/ticketService.test.ts:273` en `ad65161`).
- El prefijo **SHALL** validarse contra `PREFIJOS`, no aceptarse libre (`:87`).
- El `409` de unicidad de la OV **SHALL** ser la **última** guarda antes de la primera escritura, sea
  el equipo o el ticket (`crearTicketConEquipo`, `:103`): cumple el orden total A/B/C/D de
  `transitions-st` §3.8.
- La guarda equipo↔cliente **SHALL** ejecutarse inmediatamente después de la existencia de la orden de
  venta en Books (`:39`) —que puede completar `clientId` cuando el cuerpo no lo trae (`:41`)— y antes
  de los obligatorios, del cliente y del `409` de unicidad.

(Previously: dos correcciones de citas por el desplazamiento de `9ed5635`, y las filas 4/5 —OV ya usada
antes que la discrepancia equipo↔cliente— en el orden que el código todavía ejecutaba.
`orden-precedencia-guardas` mueve el `409` de la OV al final: deja de ser la guarda 4 y pasa a ser la
7.)

(Previously, tras `orden-precedencia-guardas`: la columna de evidencia de las filas 4-7 apuntaba a
`:65-83`, `:87-92`, `:93-94` y `:45-49`; el rango de la función a `:20-105`; la nota del prefijo a
`:91`; y la del `createTicket` a `:97` — las siete desfasadas por el propio desplazamiento de líneas
de esa tanda, caso A de la regla de mutación 4 de `CLAUDE.md`. `alta-equipo-nuevo-en-ticket` repara
las siete contra el árbol de hoy y añade la subtabla de la rama «Equipo nuevo».)

(Previously, tras `alta-equipo-nuevo-en-ticket`: sin la guarda de `modalidad`; la añade
`blueprint-soporte-remoto`, F1B-06.)

#### Scenario: El alta sin discrepancia no cambia
- GIVEN un alta sin equipo con `clientId` propio, o con `clientId` igual al del equipo
- WHEN se crea el ticket
- THEN responde `201` y el comportamiento es idéntico al de hoy

#### Scenario: La orden de venta ya usada deja de ganar a los obligatorios que faltan
- GIVEN un alta con los obligatorios sin completar y una orden de venta ya asociada a otro ticket
- WHEN se crea el ticket
- THEN responde `422` (obligatorios, escalón C) y no `409` (OV, escalón D)

#### Scenario: La orden de venta ya usada deja de ganar al cliente no encontrado
- GIVEN un alta cuyo `clientId` no existe en Books y cuya orden de venta ya está asociada a otro
  ticket
- WHEN se crea el ticket
- THEN responde `422` (`'Cliente no encontrado'`, escalón C) y no `409` (OV, escalón D)

#### Scenario: La discrepancia equipo↔cliente gana a la orden de venta ya usada
- GIVEN un alta cuyo equipo es de un cliente distinto del solicitado, y cuya orden de venta ya está
  asociada a otro ticket
- WHEN se crea el ticket
- THEN responde `422` (equipo↔cliente, escalón C) y no `409` (OV, escalón D)

#### Scenario: Dentro del escalón C, la discrepancia equipo↔cliente se resuelve antes de contar los obligatorios
- GIVEN un alta sin `clientId` propio, con un equipo cuyo `clientId` sí resuelve al cliente correcto,
  y con los demás obligatorios sin completar
- WHEN se crea el ticket
- THEN responde `422` listando los obligatorios que faltan, sin incluir «cliente» entre ellos

#### Scenario: Rama «Equipo nuevo», datos obligatorios ausentes
- GIVEN clasificaciones = 'Equipo nuevo', sin `equipoId`, y sin `serial` (o sin `modeloId`, o sin
  `fechaFacturaCompra`)
- WHEN se crea el ticket
- THEN responde `422` (escalón A) y no se escribe nada

#### Scenario: Rama «Equipo nuevo», dato opcional inválido
- GIVEN clasificaciones = 'Equipo nuevo', sin `equipoId`, datos obligatorios completos, y un campo
  opcional con formato inválido (fecha o Drive)
- WHEN se crea el ticket
- THEN responde `422` con el mensaje de F1B-02 (`hojas-vida` RQ-HV-03/RQ-HV-04) y no se escribe nada

#### Scenario: Las otras dos clasificaciones no cambian
- GIVEN clasificaciones = 'Equipo para servicio de mantenimiento' o 'Soporte remoto', sin `equipoId`
- WHEN se crea el ticket
- THEN responde `422 'Falta el equipo'`, igual que hoy — la guarda 1 no cambia para estas dos ramas

#### Scenario: Modalidad inválida en un alta de soporte remoto
- GIVEN un alta `Soporte remoto` con equipo existente y `modalidad = 'presencial'`
- WHEN se crea el ticket
- THEN responde `422` nombrando `modalidad` (escalón C) y no se escribe nada

#### Scenario: Modalidad enviada con otra clasificación
- GIVEN un alta `Equipo nuevo` (datos válidos) con `modalidad = 'remoto'`
- WHEN se crea el ticket
- THEN responde `422` nombrando `modalidad` y no se escribe nada

#### Scenario: La guarda de modalidad gana a la orden de venta ya usada
- GIVEN un alta `Soporte remoto` con `modalidad` inválida y una OV ya asociada a otro ticket
- WHEN se crea el ticket
- THEN responde `422` (escalón C) y no `409` (escalón D)

**Bajo `strict_tdd`:** la prueba de «equipo↔cliente gana a la OV ya usada» nace **roja de forma
natural** —hoy el código contesta `409`—; la de «equipo↔cliente gana a los obligatorios» nace
**verde** —el código ya la cumple— y su rojo se obtiene **por mutación**: invertir el orden de las dos
guardas, correr la suite, confirmar el rojo, revertir. Las pruebas de la rama «Equipo nuevo» nacen
**rojas de forma natural**: la rama no existe hoy. Las de `modalidad` también: el campo no existe hoy;
su posición frente al `409` se fija por mutación (regla de mutación 1 de `CLAUDE.md`).

### Requirement: RQ-TC-06 · El alta es atómica y deja dos filas

`createTicket` **SHALL** escribir el ticket y la fila de su creación en **una transacción** cuando el
pool lo permita, con `ROLLBACK` ante cualquier fallo (`repo.ts:412-452`, `:438-450`).

1. **La fila del ticket** (`repo.ts:420-423`): estado inicial `Ticket creado` —o `Solicitud Soporte` si
   `clasificaciones = 'Soporte remoto'` (`transitions-soporte-remoto` RQ-SR-04)—, `status_type='Open'`,
   `managed_by_app=true`, `source='app'`, `created_time`, `modified_time` y `updated_at` a `now()`, y
   `modalidad` según `transitions-soporte-remoto` RQ-SR-07 a RQ-SR-09 (`NULL` fuera de `Soporte remoto`).
2. **La foto de la creación** en `ticket_transitions` (`repo.ts:428-436`): `transition_id='enviar'`,
   `transition_name='Enviar'`, `from_status='(creación)'`, `to_status` igual al estado inicial de la fila
   del ticket (`Ticket creado` o `Solicitud Soporte`), `area='Comercial'`, `performed_by` = actor,
   `comment_id=null`.

`values` de esa segunda fila **SHALL** guardar el payload completo con el que nació el ticket —orden
de venta, marca, modelo, serial, equipo, tipo de servicio, clasificación, prioridad, código de
servicio y `client_id`— y **MUST NOT** limitarse a `{ orden_venta }` (`repo.ts:431-435`). Cuando la
clasificación es `Soporte remoto`, el payload **SHALL** incluir también `modalidad` (supuesto de esta
spec, reversible: la historia no puede reconstruir la modalidad de creación desde la columna). La razón
está escrita: las columnas de `tickets` son **estado actual**, así que la historia no puede apoyarse
en ellas para contar la creación (`repo.ts:424-427`).

(Previously: el estado inicial y el `to_status` de la foto eran siempre `Ticket creado`.)

> **Given** un ticket creado en la app antes de que `createTicket` guardara el payload completo
> **When** se compone su historia
> **Then** la foto no existe y la historia cae a la fila del ticket, sin forma de reconstruirla
> (`repo.ts:425-427`; el discriminador está en `ticketFuentes.ts:63-75`).

#### Scenario: Alta de soporte remoto deja las dos filas con `Solicitud Soporte`
- GIVEN un alta válida `Soporte remoto` con `modalidad = 'en sitio'`
- WHEN se crea el ticket
- THEN la fila del ticket tiene `status = 'Solicitud Soporte'` y `modalidad = 'en sitio'`, y la foto
  tiene `to_status = 'Solicitud Soporte'` y `values.modalidad = 'en sitio'`

#### Scenario: Alta de otra clasificación no cambia
- GIVEN un alta `Equipo para servicio de mantenimiento`
- WHEN se crea el ticket
- THEN el estado y el `to_status` son `Ticket creado` y `modalidad` es `NULL`

#### Scenario: Un fallo posterior revierte las dos filas
- GIVEN un alta `Soporte remoto` cuyo segundo `INSERT` falla
- WHEN se ejecuta `createTicket`
- THEN hay `ROLLBACK` y no queda ninguna de las dos filas

### Requirement: RQ-TC-07 · La fase inicial tiene dos nombres, y no se cruzan

El ticket nacido en la app **SHALL** nacer en `Ticket creado` y **MUST NOT** nacer en `OV asignada`,
que es el nombre que esa misma fase tiene en Zoho (`repo.ts:405-410`, `:422`). **Excepción:** un ticket
`Soporte remoto` **SHALL** nacer en `Solicitud Soporte` (`transitions-soporte-remoto` RQ-SR-04), y
tampoco **MUST** nacer en `OV asignada`.

La regla completa —que ningún camino lleva de una a la otra, y por qué— es de `transitions-st`
RQ-TS-02. Aquí sólo se fija de dónde arranca el ticket.

(Previously: todo ticket nacido en la app nacía en `Ticket creado`, sin excepción.)

#### Scenario: Ningún ticket de la app nace en `OV asignada`
- GIVEN un alta de cada una de las tres clasificaciones
- WHEN se crean los tres tickets
- THEN ninguno tiene `status = 'OV asignada'`

#### Scenario: El estado inicial depende de la clasificación
- GIVEN un alta `Soporte remoto` y una `Equipo nuevo`
- WHEN se crean
- THEN la primera nace en `Solicitud Soporte` y la segunda en `Ticket creado`

### Requirement: RQ-TC-10 · Las clasificaciones son el disparador de rama

`CLASIFICACIONES` **SHALL** ser exactamente tres, y **SHALL** ser obligatoria en el alta
(`packages/shared/src/ticketCreate.ts:5`; obligatoriedad en `ticketService.ts:86`):

`Equipo para servicio de mantenimiento` · `Equipo nuevo` · `Soporte remoto`

Es el campo que activa los distintos flujos de trabajo (maestro Anexo G col. 11, `:4325-4326`; M1.2
`[AS-IS — R05]`, `:1096`). El **tipo de servicio** es una segunda dimensión, distinta de la rama
(Anexo G col. 27, `:4337-4338`), y `TIPOS_SERVICIO` **SHALL** declararlo aparte
(`ticketCreate.ts:4`).

**Las tres ramas tienen grafo tras este cambio.** `Equipo para servicio de mantenimiento` usa el grafo de
servicio (`transitions-st`); `Equipo nuevo` tiene su propio catálogo, capacidad `transitions-equipo-nuevo`
(F1B-06, primer cambio, `blueprint-equipo-nuevo`); y `Soporte remoto` tiene el suyo, capacidad
`transitions-soporte-remoto` (F1B-06, segundo cambio, `blueprint-soporte-remoto`). El flujo aplicable de un
ticket lo decide su clasificación y su estado actual (`transitions-equipo-nuevo` RQ-EN-04); un ticket
heredado en un estado ajeno a su catálogo sigue en el grafo de servicio.

(Previously: «Dos de las tres ramas tienen grafo… `Soporte remoto` sigue sin grafo… y sus tickets siguen
cayendo en el grafo de servicio técnico.»)

#### Scenario: Un ticket `Equipo nuevo` deja de caer en el grafo de servicio
- GIVEN un ticket con `clasificaciones = 'Equipo nuevo'` recién creado y llevado a `Ingresado`
- WHEN se listan las transiciones que puede ejecutar
- THEN son las del catálogo `transitions-equipo-nuevo`, nunca las de `TRANSITIONS`

#### Scenario: Un ticket `Soporte remoto` deja de caer en el grafo de servicio
- GIVEN un ticket con `clasificaciones = 'Soporte remoto'` recién creado, en `Solicitud Soporte`
- WHEN se listan sus transiciones
- THEN son las del catálogo `transitions-soporte-remoto` (`Asignación`), nunca las de `TRANSITIONS`

#### Scenario: La prueba que fijaba «soporte remoto siempre enruta a servicio» se invierte
- GIVEN la prueba de `packages/shared/src/flujos.test.ts:42-45` en `66ab783` («SIEMPRE servicio»)
- WHEN se calcula `flujoDelTicket` para `Soporte remoto` en `Solicitud Soporte`
- THEN devuelve `soporte-remoto`; y para `Soporte remoto` en `Ticket creado` devuelve `servicio`

## Nota sobre prosa no-Requirement — sección «4.3 · Dos ramas de `Clasificaciones` sin grafo · destino F1B-06»

Con este cambio las tres ramas tienen grafo y F1B-06 queda cerrada (`cierra: si`). Al archivar, la sección
4.3 de `tickets-core` **SHALL** reescribirse (no borrarse) para declararse **CERRADA**: `Equipo nuevo` por
`blueprint-equipo-nuevo` y `Soporte remoto` por `blueprint-soporte-remoto`, con la misma disciplina de
«Previously» que usa el resto de la spec y el criterio de `transitions-st` §3 para entradas cerradas.

## Fuera de alcance de este delta

- **Selector de Modalidad en `CreateTicket.tsx` y su lectura en la ficha:** `.tsx`, fuera de la red de
  pruebas (F0-00); no se propone `jsdom`. La imposición está en el servidor y se prueba en node.
- **Relleno de `modalidad` en heredados** y migración de datos.
- **Rama de servicio en sitio** (2027 T2) y **guarda de remisión** (F1B-03).
- **Columna propia de tablero para `Solicitud Soporte`** → F1B-09.
- Resto de requisitos de `tickets-core` (incluidos RQ-TC-15, RQ-TC-16 y la puerta de OV RQ-TC-08): no
  cambian.
