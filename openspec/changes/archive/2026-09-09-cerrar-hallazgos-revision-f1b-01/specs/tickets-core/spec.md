# Delta for tickets-core

## MODIFIED Requirements

### Requirement: Orden de las guardas del alta, y qué contesta cada una

`POST /api/tickets` (`routes/tickets.ts:124-126`) **SHALL** exigir sesión (`:35`) y **SHALL** aplicar
las guardas de `createManagedTicket` (`ticketService.ts:20-71`) **en este orden**, que es observable:

| Orden | Guarda | Respuesta | Evidencia |
|---|---|---|---|
| 1 | Falta el equipo | `422 'Falta el equipo'` | `:22-23` |
| 2 | El equipo no está en el catálogo | `422 'Equipo no registrado'` | `:24-25` |
| 3 | La orden de venta no existe en Books | `422 'Orden de venta no encontrada'` | `:35-37` |
| 4 | La orden de venta ya está asociada a otro ticket | `409` | `:45-49` |
| 5 | **Discrepancia equipo↔cliente** (nueva) | `422`, nombrando al cliente del equipo | `:50-77` |
| 6 | Faltan obligatorios (cliente, tipo de servicio, clasificaciones, prefijo) | `422`, con **todos** en una lista | `:53-58` |
| 7 | El cliente no existe en Books | `422 'Cliente no encontrado'` | `:59-60` |

- El `422` de obligatorios **SHALL** listar **todos** los que faltan y no de uno en uno
  (probado en `services/ticketService.test.ts:247`).
- El prefijo **SHALL** validarse contra `PREFIJOS`, no aceptarse libre (`:57`).
- **El orden 5 antes que 6 sigue siendo la inversión de precedencia conocida** respecto de
  `executeTransition` (`tickets-core` §4.1, `transitions-st` §3.8); esta tanda no la toca.
- La guarda 4 **SHALL** ejecutarse inmediatamente después del bloque de la orden de venta —que puede
  completar `clientId` cuando el cuerpo no lo trae (`:39`)— y antes de las guardas 6 y 7, que dependen
  del `clientId` ya resuelto.

(Previously: la tabla tenía 6 filas y no existía ninguna comparación entre `equipo.clientId` y el
`clientId` del ticket; el orden era 1‑2‑3‑409‑422 obligatorios‑422 cliente.)

#### Scenario: El alta sin discrepancia no cambia
- GIVEN un alta sin equipo con `clientId` propio, o con `clientId` igual al del equipo
- WHEN se crea el ticket
- THEN responde `201` y el comportamiento es idéntico al de hoy

## ADDED Requirements

### Requirement: La guarda equipo↔cliente impone integridad de datos, no autorización

Tras resolver el `clientId` final del bloque de la orden de venta (`ticketService.ts:27`, `:39`) y
antes de escribir el ticket (`:67`), el sistema **SHALL** comparar ese `clientId` final contra
`equipo.clientId` (`db/equipos.ts:41`):

1. Si el `clientId` final es nulo y `equipo.clientId` existe, el sistema **SHALL** usar
   `equipo.clientId` como valor de escritura.
2. Si los dos existen y difieren, el sistema **SHALL** responder `422` y el mensaje **SHALL** nombrar
   al cliente del equipo.
3. Si `equipo.clientId` es `NULL`, el sistema **MUST NOT** alterar ningún comportamiento existente
   (protege al ~3,4 % de equipos que el backfill no enlazó).

La severidad es de **integridad de datos, no de autorización**: `tickets.client_id` no filtra ni
autoriza nada; sólo resuelve el nombre a mostrar (`tickets-core` RQ-TC-12).

**Consecuencia declarada.** Como el `clientId` final puede venir de la orden de venta (`:39`) y no
sólo del cuerpo, un ticket cuya OV pertenece a un cliente distinto del equipo pasa a dar `422` —cuando
el cuerpo no trae su propio `clientId`— donde hoy crea el ticket en silencio. Esto toca el punto
abierto nº 52 del maestro (variantes reales de «una OV, un ticket», `R08.1.md:2071-2079`) y amplía el
límite de alcance que la propuesta había fijado en su §3; se declara aquí como decisión explícita, no
como alcance implícito.

#### Scenario: El equipo manda cuando el cuerpo no trae cliente
- GIVEN un alta sin `clientId` en el cuerpo y un equipo con `equipo.clientId = "cli-A"`
- WHEN se crea el ticket
- THEN responde `201` y la fila escrita en `tickets` tiene `client_id = "cli-A"`

#### Scenario: Discrepancia entre el cuerpo y el equipo
- GIVEN un alta con `clientId = "cli-B"` en el cuerpo y un equipo con `equipo.clientId = "cli-A"`
- WHEN se crea el ticket
- THEN responde `422` y el mensaje nombra al cliente "cli-A"
- AND no se crea ningún ticket

#### Scenario: El 3,4 % sin cliente enlazado no se bloquea
- GIVEN un equipo con `equipo.clientId` `NULL`
- WHEN se crea el ticket con cualquier `clientId` del cuerpo o de la orden de venta
- THEN el alta sigue la vía actual, sin ningún `422` nuevo

#### Scenario: La orden de venta manda sobre el equipo cuando el cuerpo calla
- GIVEN un alta sin `clientId` en el cuerpo, una orden de venta cuyo cliente es "cli-B" y un equipo con
  `equipo.clientId = "cli-A"`
- WHEN se crea el ticket
- THEN responde `422` (regla 2), aunque hoy el ticket se crea en silencio con `client_id = "cli-B"`

### Requirement: Resolución de cliente por identidad

`GET /api/clients/:id` **SHALL** requerir sesión (`requireAuth`, mismo patrón que
`routes/directory.ts:62-67`) y **SHALL** resolver contra `getClient(db, id)`
(`packages/zoho-sync/src/books/repo.ts:129`), respondiendo `404` cuando no exista la fila.

#### Scenario: Cliente encontrado
- GIVEN un `id` de cliente existente en `clients`
- WHEN se pide `GET /api/clients/:id` con sesión válida
- THEN responde `200` con los datos del cliente

#### Scenario: Cliente no encontrado
- GIVEN un `id` que no existe en `clients`
- WHEN se pide `GET /api/clients/:id` con sesión válida
- THEN responde `404`

#### Scenario: Sin sesión
- GIVEN ninguna cookie de sesión válida
- WHEN se pide `GET /api/clients/:id`
- THEN responde `401` y no se consulta la base
