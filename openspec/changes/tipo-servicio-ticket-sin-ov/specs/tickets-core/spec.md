# Delta para tickets-core — la OVI de garantía en la puerta del alta (F1B-03, parte L, lote 3)

> ## PENDIENTE DE Q1 — no construible hasta la respuesta
>
> **Este delta es un BORRADOR CONDICIONADO, no un requisito firme.** Depende de la respuesta de Gerencia a Q1 («¿qué es
> crear la OVI de garantía dentro de Desk?») y sólo vale bajo la **opción A** de la propuesta (restricción al asociar; las
> OVI se siguen creando en Books). Con B o C, o sin respuesta, **se descarta** y `tickets-core` sale del cambio. La
> definición del permiso y las otras dos puertas están en el borrador de `permissions` (RQ-PM-24); **`sdd-tasks` SHALL
> tratarlo como lote bloqueado.**

## ADDED Requirements — BORRADOR, condicionado a Q1 = A

### RQ-TC-35 · El alta del ticket rechaza una orden `OVI-` a quien no puede asociarla *(borrador)*

`POST /api/tickets` con una `salesOrderId` cuya orden sea `OVI-` **SHALL** responder `403` cuando el usuario no cumpla
`puedeCrearOVIGarantia` (`permissions` RQ-PM-24; hoy sin llamador, `packages/shared/src/cargos.ts:71-74`). La guarda
**SHALL** ser de escalón B: se evalúa **después** de comprobar que la orden existe (`422` «Orden de venta no encontrada»,
`apps/desk/server/services/ticketService.ts:37-44`, escalón A) y **antes** de las guardas de contenido y de la unicidad (D) del alta
(RQ-TC-05, RQ-TC-31), que conservan su orden. Un alta sin `salesOrderId` **MUST NOT** verse afectada: el ticket sin OV sigue
siendo válido (construido, `apps/desk/server/services/ticketService.ts:37-44`). No cambia la guarda equipo↔cliente ni
añade vías de escritura de la orden (IV-11). Regla 13: si `CreateTicket` oculta u ofrece distinto la `OVI-`, la imposición es
esta guarda del servidor.

#### Scenario: Director Técnico da de alta un ticket con OVI *(borrador)*
- GIVEN un usuario de Servicio Técnico con cargo Director Técnico y una orden `OVI-` existente
- WHEN envía `POST /api/tickets` con esa orden
- THEN responde `201`

#### Scenario: Un usuario sin el cargo recibe 403 *(borrador)*
- GIVEN un usuario de Comercial sin cargo y una orden `OVI-` existente
- WHEN envía `POST /api/tickets` con esa orden
- THEN responde `403` y no se escribe ningún ticket

#### Scenario: La existencia gana al permiso *(borrador)*
- GIVEN un usuario sin cargo y una orden `OVI-` que no existe
- WHEN envía el alta
- THEN responde `422` «Orden de venta no encontrada» y no `403`

#### Scenario: El permiso gana al contenido y a la unicidad *(borrador)*
- GIVEN un usuario sin cargo, una orden `OVI-` ya asociada a otro ticket y un campo de contenido inválido
- WHEN envía el alta
- THEN responde `403`, no `422` ni `409`

#### Scenario: El alta sin OV no se ve afectada *(borrador)*
- GIVEN un usuario sin cargo y un alta sin `salesOrderId`
- WHEN envía `POST /api/tickets`
- THEN responde `201`, como hoy
