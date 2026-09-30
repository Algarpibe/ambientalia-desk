# Delta for tickets-core

Cambio `prioridad-top5-cliente` (F1B-07, parte decidida, `cierra: no`). Base `6055c4d`, medido el 2026-09-30. Supuestos
S-1..S-9 de `proposal.md`. Fuentes: `decision/top5-manual` (`openspec/config.yaml:1949-1965`, respuesta `:1954`) y
`decision/anexo-53-contratos` (`:2448-2468`, regla `:2456`). Continúa la numeración `RQ-TC-01..25`. El orden de los
escalones de precedencia (A existencia < B estado y permiso < C contenido < D unicidad) es el de F1B-10.

## ADDED Requirements

### Requirement: RQ-TC-26 · Prioridad del cliente en tabla propia `public.cliente_prioridad`

El sistema SHALL guardar la prioridad del cliente y su pertenencia al Top 5 en la tabla `public.cliente_prioridad`, con
estas columnas: `client_id` (texto, clave primaria, sin clave foránea), `top5` (booleano), `prioridad` (texto),
`actualizado_por` y `actualizado_at`. La sentencia `CREATE TABLE` SHALL llevar el esquema calificado y SHALL ir **al
final** de `packages/zoho-sync/src/db/schema.sql`, sin mover ninguna línea anterior. La tabla MUST NOT modificar
`public.clients` (vista sobre `books.contacts`, que no admite columnas) ni `books.contacts`. `client_id` es el
`contact_id` de Books, el mismo valor que `tickets.client_id`.

#### Scenario: la tabla está calificada y al final
- GIVEN `schema.sql`
- WHEN se recorren sus sentencias `CREATE TABLE`
- THEN la de `cliente_prioridad` es `public.cliente_prioridad`, va detrás de todas las sentencias de `29f65d1` y sólo la sigue la de `public.prioridad_ajustes` (C-2)
- AND el guardián de calificación de `migrate.test.ts` sigue en verde

#### Scenario: una sentencia sin calificar se rechaza
- GIVEN `schema.sql` ensuciado con un `CREATE TABLE cliente_prioridad` sin esquema
- WHEN corre el guardián de `migrate.test.ts`
- THEN el guardián se pone rojo (regla de mutación 2)

### Requirement: RQ-TC-27 · Fijar o quitar el Top 5 y su prioridad sólo con `puedeFijarPrioridadTop5`

El servidor SHALL exponer la lectura y la escritura de `top5` y `prioridad` de un cliente. La escritura SHALL exigir
`puedeFijarPrioridadTop5` (`packages/shared/src/cargos.ts:80-83`), que se CONSUME y MUST NOT reescribirse en el cliente
ni en el servidor (regla invariable 13). Sin el permiso, el servidor SHALL responder `403` y no escribir nada. Un único
predicado SHALL cubrir fijar la prioridad y mantener la lista (supuesto S-5). `prioridad` SHALL pertenecer a la lista
blanca `High | Medium | Low`; cualquier otro valor, incluido `Urgent`, SHALL responder `422` (supuesto S-3). Cuando
`top5` sea verdadero, `prioridad` SHALL ser obligatoria (hipótesis de esta especificación, ver riesgos). `top5` MUST
ser booleano; otro tipo SHALL responder `422`. Cada escritura SHALL registrar `actualizado_por` y `actualizado_at`. La
lectura SHALL estar disponible para cualquier usuario autenticado.

La escritura SHALL respetar el orden de precedencia: `403` (B) antes de todo `422` (C).

#### Scenario: Director Comercial fija un Top 5
- GIVEN un usuario del área `Comercial` con cargo `Director Comercial` y un cliente sin fila
- WHEN marca `top5: true` con `prioridad: 'Medium'`
- THEN responde `200` y `public.cliente_prioridad` guarda la fila con `actualizado_por` y `actualizado_at`

#### Scenario: administrador fija un Top 5
- GIVEN un administrador sin `cargo_permiso`
- WHEN marca `top5: true` con `prioridad: 'High'` sobre un cliente
- THEN responde `200` y la fila queda escrita

#### Scenario: sin permiso, 403 y sin escritura
- GIVEN un usuario de `Comercial` con cargo `Coordinador Comercial`
- WHEN intenta marcar un cliente como Top 5
- THEN responde `403` y no existe fila nueva ni cambiada

#### Scenario: técnico sin permiso
- GIVEN un usuario del área `Servicio Técnico` con cargo `Director Técnico`
- WHEN intenta fijar la prioridad de un cliente
- THEN responde `403`

#### Scenario: valor fuera de la lista blanca
- GIVEN un usuario con permiso
- WHEN envía `prioridad: 'Urgent'` o `prioridad: 'Alta'` para un Top 5
- THEN responde `422` y no se escribe la fila

#### Scenario: Top 5 sin prioridad
- GIVEN un usuario con permiso
- WHEN envía `top5: true` sin `prioridad`
- THEN responde `422`

#### Scenario: 403 antes que 422
- GIVEN un usuario sin permiso y un cuerpo con `prioridad` inválida
- WHEN envía la escritura
- THEN responde `403`, no `422`

#### Scenario: quitar el Top 5
- GIVEN un cliente Top 5 y un usuario con permiso
- WHEN envía `top5: false`
- THEN responde `200` y el cliente deja de ser Top 5

#### Scenario: lectura abierta al autenticado
- GIVEN un usuario autenticado sin cargo de permiso y un cliente Top 5
- WHEN consulta la prioridad del cliente
- THEN ve `top5` y `prioridad`

### Requirement: RQ-TC-28 · Sin nadie con cargo, sólo el administrador fija y ajusta (S-1 de F1C-05)

Mientras ningún usuario tenga `cargo_permiso`, sólo un administrador SHALL poder fijar la prioridad de un cliente,
mantener la lista Top 5 y ajustar la prioridad de un ticket. Sin lista, nadie es Top 5 y la prioridad al nacer SHALL
ser la que resulta hoy (`RQ-TC-24` sin Top 5).

#### Scenario: nadie tiene cargo
- GIVEN una base donde todos los `cargo_permiso` son nulos y ningún cliente es Top 5
- WHEN un no admin de `Comercial` intenta marcar un Top 5, y luego un administrador lo marca
- THEN el primero recibe `403` y el administrador `200`

#### Scenario: sin lista, el alta es la de hoy
- GIVEN una base sin ninguna fila en `cliente_prioridad`
- WHEN se crea un ticket de un cliente sin contrato con `prioridad: 'Low'`
- THEN el ticket queda `Low`, como antes de este cambio

## MODIFIED Requirements

### Requirement: RQ-TC-24 · Prioridad `High` al nacer, por el contrato del cliente, impuesta por el servidor

Cuando el **cliente del ticket** —ya resuelto en el alta (`ticketService.ts:89`)— tenga un contrato
**vigente** hoy (`RQ-TC-22`) **o** sea **Top 5** (`RQ-TC-26`), `createManagedTicket` **SHALL** crear el ticket con
**la más alta** de las prioridades que apliquen, con el orden `Urgent > High > Medium > Low`: `High` por el contrato
(supuesto S-4: «Alta» del maestro ≡ el literal `High` de `packages/shared/src/transitions.ts:84`) y la `prioridad` de
`public.cliente_prioridad` por el Top 5. La prioridad del cuerpo **MUST NOT** intervenir cuando aplica al menos una de
las dos, y también para correctivos cotizados aparte (`decision/anexo-53-contratos`, regla `:2456`: «manda la
prioridad más alta de las dos»). Si el cliente no tiene contrato vigente ni es Top 5, la prioridad **SHALL** ser la
que hoy resulte del cuerpo, o ninguna (`ticketService.ts:106` en `9288779`). La imposición **SHALL** ser del servidor
(regla invariable 13): que el formulario la muestre o no es comodidad.
(Previously: sólo combinaba el contrato; «manda la más alta de las dos» con Top 5 quedaba fuera, para F1B-07.)

La prioridad se toma del cliente del **ticket**, no de la subOV ni del cliente del contrato ni del de la OV (supuesto
S-9 de F1B-06). Este requisito **SHALL** aplicar sólo **al nacer**: no reevalúa tickets existentes ni cambia lo que una
transición escriba después en `priority` (supuesto S-1 de F1B-07). Un valor desconocido en el cuerpo **MUST** perder
siempre frente al contrato y al Top 5 (supuesto S-3). Un ticket sin `client_id` no hereda de ningún cliente.

#### Scenario: Cliente con contrato vigente → el ticket nace `High` aunque el cuerpo traiga `Low`

- GIVEN un cliente con un contrato vigente, no Top 5, y un alta cuyo cuerpo trae `prioridad: 'Low'`
- WHEN se crea el ticket
- THEN el ticket queda con prioridad `High`

#### Scenario: Cliente con contrato vigente y cuerpo sin prioridad → `High`

- GIVEN un cliente con contrato vigente, no Top 5, y un alta sin prioridad
- WHEN se crea el ticket
- THEN el ticket queda con prioridad `High`

#### Scenario: Combinación 1 · sin contrato y sin Top 5, todo queda como hoy

- GIVEN un cliente sin contrato vigente y no Top 5, y dos altas: una con `prioridad: 'Low'` y otra sin prioridad
- WHEN se crean los tickets
- THEN el primero queda `Low` y el segundo sin prioridad, igual que antes de este cambio

#### Scenario: Combinación 2 · contrato vigente y sin Top 5 → `High`

- GIVEN un cliente con contrato vigente y sin fila Top 5, y un alta con `prioridad: 'Medium'`
- WHEN se crea el ticket
- THEN el ticket queda `High`

#### Scenario: Combinación 3 · Top 5 sin contrato → la del Top 5

- GIVEN un cliente Top 5 con `prioridad: 'Medium'`, sin contrato vigente, y un alta con `prioridad: 'Low'`
- WHEN se crea el ticket
- THEN el ticket queda `Medium`

#### Scenario: Combinación 4 · contrato y Top 5 a la vez → manda la más alta

- GIVEN un cliente con contrato vigente y Top 5 con `prioridad: 'Low'`
- WHEN se crea el ticket
- THEN el ticket queda `High`
- AND con `prioridad: 'High'` en el Top 5 también queda `High`

#### Scenario: Top 5 más alta que el contrato no existe en la lista blanca, pero el orden se respeta

- GIVEN la función pura que combina las prioridades y las entradas `High` (contrato) y `Medium` (Top 5)
- WHEN se evalúa, y luego con las entradas intercambiadas
- THEN el resultado es `High` en ambos órdenes

#### Scenario: `Urgent` del cuerpo pierde frente al contrato y al Top 5 (S-3)

- GIVEN un alta con `prioridad: 'Urgent'` para un cliente Top 5 con `prioridad: 'Medium'` sin contrato, y otra para un cliente con contrato vigente
- WHEN se crean los tickets
- THEN el primero queda `Medium` y el segundo `High`

#### Scenario: `Urgent` del cuerpo sin contrato ni Top 5 se conserva como hoy

- GIVEN un cliente sin contrato vigente ni Top 5 y un alta con `prioridad: 'Urgent'`
- WHEN se crea el ticket
- THEN el ticket queda `Urgent`, como antes de este cambio

#### Scenario: Un contrato vencido o aún no iniciado no da prioridad

- GIVEN un cliente cuyo único contrato tiene fin anterior a hoy, y otro cuyo único contrato empieza mañana, ninguno Top 5
- WHEN se crea un ticket con `prioridad: 'Low'` para cada uno
- THEN ambos quedan `Low`

#### Scenario: El día del fin todavía cuenta

- GIVEN un contrato con fin igual a hoy
- WHEN el cliente crea un ticket sin prioridad
- THEN el ticket nace `High`

#### Scenario: Manda el cliente del ticket, no el del contrato

- GIVEN un contrato vigente del cliente A y un alta para el cliente B, que no tiene contrato ni es Top 5, con una subOV del lote de A
- WHEN se crea el ticket
- THEN la prioridad no se fuerza a `High` por el contrato de A

#### Scenario: El Top 5 se toma del cliente del ticket, no del de la OV

- GIVEN un cliente A Top 5 y un alta para el cliente B, no Top 5, con una orden de venta de A
- WHEN se crea el ticket
- THEN la prioridad no hereda el Top 5 de A

#### Scenario: S-1 · marcar Top 5 no cambia los tickets abiertos existentes

- GIVEN un cliente con dos tickets abiertos de prioridad `Low` y un usuario con permiso
- WHEN marca al cliente como Top 5 con `prioridad: 'High'`
- THEN los dos tickets abiertos conservan `Low`
- AND un ticket creado después nace `High`

#### Scenario: S-9 · desmarcar el Top 5 no cambia los tickets ya creados

- GIVEN un ticket nacido `High` por el Top 5 de su cliente
- WHEN se quita el Top 5 del cliente
- THEN el ticket conserva `High`
- AND un ticket nuevo de ese cliente, sin contrato, toma la prioridad del cuerpo

#### Scenario: ticket sin `client_id` no hereda

- GIVEN un ticket de Zoho sin `client_id`
- WHEN se evalúa su prioridad
- THEN ningún Top 5 ni contrato se le aplica

### Requirement: RQ-TC-29 · Ajuste de la prioridad de un ticket de un cliente Top 5, con motivo y traza

Un usuario con `puedeFijarPrioridadTop5` SHALL poder cambiar la prioridad de un ticket concreto cuyo cliente sea Top 5,
aportando un **motivo escrito obligatorio**. Las respuestas SHALL seguir el orden de precedencia, sin solape de
códigos: `404` si el ticket no existe (A); `409` si el cliente del ticket no es Top 5, incluido el ticket sin
`client_id` (B, supuesto S-8: estado del sujeto, que precede al permiso como en `ticketService.ts:126-130`); `403` si
el usuario no cumple el predicado (B); `422` si falta el motivo, si es sólo
espacios o si la prioridad no está en `High | Medium | Low` (C). Cuando el ajuste se aplique, el servidor SHALL, en una
**misma transacción**: actualizar `tickets.priority`, insertar una fila en `public.prioridad_ajustes` (ticket,
prioridad anterior, prioridad nueva, motivo, autor, fecha) y fijar `managed_by_app = true` (supuesto S-6). El ajuste
MUST NOT escribir en `ticket_transitions`, ni cambiar el estado, ni reiniciar el reloj de SLA. La sentencia
`CREATE TABLE` de `public.prioridad_ajustes` SHALL llevar el esquema calificado y SHALL ir al final de `schema.sql`,
después de la de `cliente_prioridad`. Sólo la prioridad de ese ticket cambia; los demás tickets del cliente no.

#### Scenario: ajuste con motivo
- GIVEN un ticket de un cliente Top 5 con prioridad `Medium` y un Director Comercial
- WHEN ajusta a `High` con motivo «Parada de planta»
- THEN responde `200`, el ticket queda `High` y `public.prioridad_ajustes` tiene una fila con anterior `Medium`, nueva `High`, el motivo, el autor y la fecha

#### Scenario: sin motivo, 422
- GIVEN un ticket de un cliente Top 5 y un usuario con permiso
- WHEN envía el ajuste sin motivo, o con motivo de sólo espacios
- THEN responde `422`, la prioridad no cambia y no se inserta traza

#### Scenario: valor fuera de la lista blanca
- GIVEN un ticket de un cliente Top 5 y un usuario con permiso
- WHEN envía `prioridad: 'Urgent'` con motivo
- THEN responde `422`

#### Scenario: cliente que no es Top 5, 409
- GIVEN un ticket de un cliente sin fila Top 5 (o con `top5: false`) y un usuario con permiso
- WHEN envía el ajuste con motivo
- THEN responde `409` y no cambia nada

#### Scenario: ticket sin `client_id`, 409
- GIVEN un ticket sin `client_id` y un usuario con permiso
- WHEN envía el ajuste con motivo
- THEN responde `409`

#### Scenario: sin el predicado, 403
- GIVEN un ticket de un cliente Top 5 y un usuario de `Comercial` con cargo `Coordinador Comercial`
- WHEN envía el ajuste con motivo
- THEN responde `403` y no cambia nada

#### Scenario: 409 antes que 403 y que 422 (C-3)
- GIVEN un usuario sin permiso, un ticket de un cliente que no es Top 5 y un cuerpo sin motivo
- WHEN envía el ajuste
- THEN responde `409`, no `403` ni `422`

#### Scenario: 409 antes que 422
- GIVEN un usuario con permiso, un ticket de un cliente que no es Top 5 y un cuerpo sin motivo
- WHEN envía el ajuste
- THEN responde `409`, no `422`

#### Scenario: ticket inexistente
- GIVEN un identificador de ticket que no existe
- WHEN un usuario con permiso envía el ajuste
- THEN responde `404`

#### Scenario: el ajuste no toca `ticket_transitions` ni el SLA
- GIVEN un ticket de un cliente Top 5 con una última transición de entrada al estado actual
- WHEN se ajusta su prioridad
- THEN `ticket_transitions` no gana ninguna fila
- AND el instante de entrada al estado que lee el SLA es el mismo de antes

#### Scenario: S-6 · el ajuste congela la fila frente al sincronizador
- GIVEN un ticket de Zoho con `managed_by_app = false` de un cliente Top 5
- WHEN se ajusta su prioridad
- THEN `managed_by_app` pasa a `true` en la misma transacción
- AND una pasada posterior de `upsertTicket` no sobrescribe `priority`

#### Scenario: atomicidad
- GIVEN un ajuste cuya inserción en `prioridad_ajustes` falla
- WHEN se ejecuta
- THEN `tickets.priority` y `managed_by_app` conservan su valor anterior

#### Scenario: sólo ese ticket cambia
- GIVEN un cliente Top 5 con dos tickets abiertos
- WHEN se ajusta uno
- THEN el otro conserva su prioridad

#### Scenario: la tabla de trazas está calificada y al final
- GIVEN `schema.sql`
- WHEN se recorren sus sentencias `CREATE TABLE`
- THEN `public.prioridad_ajustes` es la última y está calificada

## Fuera de alcance

- Calificación de los clientes sin contrato ni Top 5, número de niveles y quién ajusta fuera del Top 5: pregunta 3.b
  abierta (`docs/sdd/Preguntas_Gerencia_2026-09-29.md:69-89`). Por eso `cierra: no`.
- Orden de «Mis tickets» (`apps/desk/src/lib/boardView.ts:15`, filtro `:44-46`): ningún `decision/*` lo decide;
  `R08.2.md:1711` está en M1.9.1 y no es acuerdo. No se ordena y `boardView.ts` no se toca.
- Propagación del Top 5 a los tickets abiertos que ya existan (S-1): punto abierto con dueño Gerencia, sin destino.
- Tope numérico de la lista (S-7): «Top 5» se toma como nombre (hipótesis).
- Tickets sin `client_id` (tickets de Zoho no enlazados): no heredan.
- `upsertTicket`, `TICKET_COLS` y el sincronizador (IV-11) y `remision.ts` (IV-12): no se tocan.
- La interfaz de usuario (`.tsx`) no lleva requisitos de comportamiento propios: queda fuera de la red de pruebas
  (F0-00) y sus decisiones se enumeran contra el servidor en el cierre (regla de mutación 3).
