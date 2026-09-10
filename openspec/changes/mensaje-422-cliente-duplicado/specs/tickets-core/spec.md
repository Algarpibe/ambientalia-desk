# Delta para `tickets-core`

> **Nota de procedencia de las citas.** Los números de línea de este delta se verificaron primero
> contra HEAD `984b7aa`, antes de que este cambio insertara la llamada a `getClient` dentro de la
> rama (ii). Esa inserción desplazó toda línea posterior en `ticketService.ts` (+6 líneas a partir de
> la antigua `:78`) y amplió el bloque de la guarda 5 de `:65-77` a `:65-83`. Las citas de `RQ-TC-05`
> y `RQ-TC-13` que dependían de ese bloque **ya están reancladas** contra el árbol final, como último
> paso del `apply`, tal y como lo ordenó `sdd-tasks`.

## MODIFIED Requirements

### Requirement: RQ-TC-05 · Orden de las guardas del alta, y qué contesta cada una

`POST /api/tickets` (`routes/tickets.ts:124-126`) **SHALL** exigir sesión (`:35`) y **SHALL** aplicar
las guardas de `createManagedTicket` (`ticketService.ts:20-105`) **en este orden**, que es observable:

| Orden | Guarda | Respuesta | Evidencia |
|---|---|---|---|
| 1 | Falta el equipo | `422 'Falta el equipo'` | `ticketService.ts:22-23` |
| 2 | El equipo no está en el catálogo | `422 'Equipo no registrado'` | `:24-25` |
| 3 | La orden de venta no existe en Books | `422 'Orden de venta no encontrada'` | `:35-37` |
| 4 | La orden de venta ya está asociada a otro ticket | `409` | `:45-49` |
| 5 | Discrepancia equipo↔cliente (nueva) | `422`, nombrando al cliente del equipo | `:65-83` |
| 6 | Faltan obligatorios (cliente, tipo de servicio, clasificaciones, prefijo) | `422`, con **todos** en una lista | `:87-92` |
| 7 | El cliente no existe en Books | `422 'Cliente no encontrado'` | `:93-94` |

- El `422` de obligatorios **SHALL** listar **todos** los que faltan y no de uno en uno
  (probado en `services/ticketService.test.ts:273`).
- El prefijo **SHALL** validarse contra `PREFIJOS`, no aceptarse libre (`:91`).
- **El orden 4 antes que 6 sigue siendo la inversión de precedencia conocida** respecto de
  `executeTransition` (`tickets-core` §4.1, `transitions-st` §3.8); esta tanda no la toca.
- La guarda 5 **SHALL** ejecutarse inmediatamente después del `409` de la orden de venta —que puede
  completar `clientId` cuando el cuerpo no lo trae (`:39`)— y antes de las guardas 6 y 7.

(Previously: dos correcciones distintas, no una. **(a) Citas.** Cinco números de línea desactualizados
por el desplazamiento que introdujo la guarda equipo↔cliente en `9ed5635` —la cabecera, las filas 6 y
7, y dos de las cuatro viñetas—. **(b) Orden.** Las filas 4 y 5 estaban invertidas: el código ejecuta
primero el `409` de la OV (`:48`) y después la discrepancia equipo↔cliente (`:82`), no al revés; se
renumeran para que el orden numerado sea el que el código ejecuta. **Esto no reabre el punto abierto
§4.1** —que pregunta qué orden DEBERÍA existir entre el `409` y el `422` de obligatorios, y sigue sin
decidirse—: sólo corrige una descripción errónea del orden que ya existe.)

#### Scenario: El alta sin discrepancia no cambia
- GIVEN un alta sin equipo con `clientId` propio, o con `clientId` igual al del equipo
- WHEN se crea el ticket
- THEN responde `201` y el comportamiento es idéntico al de hoy

### Requirement: RQ-TC-13 · La guarda equipo↔cliente impone integridad de datos, no autorización

Tras resolver el `clientId` final del bloque de la orden de venta (`ticketService.ts:27`, `:39`) y
antes de crear el ticket (`:97`), el sistema **SHALL** comparar ese `clientId` final contra
`equipo.clientId` (`db/equipos.ts:41`):

1. Si el `clientId` final es nulo y `equipo.clientId` existe, el sistema **SHALL** usar
   `equipo.clientId` como valor de escritura.
2. Si los dos existen y difieren, el sistema **SHALL** responder `422` con el nombre y el id de los
   **dos** clientes — el del equipo y el solicitado —, siempre, nunca sólo uno ni sólo cuando los
   nombres difieren: dos filas de `books.contacts` pueden compartir nombre con ids distintos
   (`getClient` no filtra por `contact_type`, a propósito — `packages/zoho-sync/src/books/repo.ts:111-116`),
   y ocultar el id ahí ocultaría justo el caso que hace falta distinguir.
   - Si `equipo.clienteNombre` es nulo, el lado del equipo **SHALL** mostrar sólo el id, con la nota
     «sin nombre en el equipo».
   - Si `getClient(db, clientId)` devuelve `null` —alcanzable, porque «Cliente no encontrado» es guarda
     posterior (`:94`)— el lado solicitado **SHALL** mostrar sólo el id, con la nota «sin ficha en
     Books» (`books/repo.ts:129-131`).
3. Si `equipo.clientId` es `NULL`, el sistema **MUST NOT** alterar comportamiento existente (protege
   al ~3,4 % de equipos sin enlazar); esta rama **SHALL** quedar fuera de la comparación del punto 2.

La posición de la guarda —tras el `409` de la OV (`:45-49`) y antes de los obligatorios
(`:87-92`)— y el `422` **SHALL** seguir igual.

La severidad es de **integridad de datos, no de autorización**: `tickets.client_id` no autoriza nada,
sólo resuelve el nombre a mostrar (`tickets-core` RQ-TC-12).

**Consecuencia declarada.** El `clientId` final puede venir de la orden de venta y no sólo del cuerpo
(`:39`): un ticket cuya OV es de un cliente distinto del equipo pasa a dar `422` donde hoy crea el
ticket en silencio. Toca el punto abierto nº 52 del maestro (`R08.1.md:2071-2079`) y amplía el alcance
que la propuesta fijó en su §3; se declara como decisión explícita.

(Previously: el mensaje sólo nombraba al cliente del equipo, sin id ni identificar al solicitado.)

#### Scenario: El equipo manda cuando el cuerpo no trae cliente
- GIVEN un alta sin `clientId`, con equipo `equipo.clientId = "cli-A"`
- WHEN se crea el ticket
- THEN responde `201` y `tickets.client_id = "cli-A"`

#### Scenario: Discrepancia entre el cuerpo y el equipo
- GIVEN un alta con `clientId = "cli-B"`, equipo `equipo.clientId = "cli-A"` y
  `clienteNombre = "ACME"`, y `"cli-B"` en Books con nombre `"Beta"`
- WHEN se crea el ticket
- THEN responde `422` y el mensaje contiene `"ACME"`, `"cli-A"`, `"Beta"` y `"cli-B"`
- AND no se crea ticket

#### Scenario: Mismo nombre, dos ids
- GIVEN equipo `equipo.clientId = "cli-A"` con `clienteNombre = "Gecelca S.A. E.S.P."`, y `"cli-B"`
  en Books con el MISMO nombre —el helper `cliente(id)` (`ticketService.test.ts:246-248`) inserta ese
  nombre literal para cualquier id
- WHEN se crea el ticket con `clientId = "cli-B"`
- THEN responde `422` y el mensaje contiene `"cli-A"` **y** `"cli-B"`, distinguibles pese al nombre
  repetido

#### Scenario: Respaldo — el equipo no tiene nombre de cliente
- GIVEN equipo `equipo.clientId = "cli-A"`, `clienteNombre` nulo, y `"cli-B"` en Books con nombre
  `"Beta"`
- WHEN se crea el ticket con `clientId = "cli-B"`
- THEN responde `422` y el mensaje muestra `"cli-A"` con la nota «sin nombre en el equipo», y nombre
  e id del lado solicitado

#### Scenario: Respaldo — el cliente solicitado no tiene ficha en Books
- GIVEN equipo `equipo.clientId = "cli-A"` con `clienteNombre = "ACME"`, y un `clientId` del cuerpo
  que **no** existe en `books.contacts`
- WHEN se crea el ticket
- THEN responde `422` y el mensaje muestra el id con la nota «sin ficha en Books», no «Cliente no
  encontrado»

#### Scenario: El 3,4 % sin cliente enlazado no se bloquea
- GIVEN un equipo con `equipo.clientId` `NULL`
- WHEN se crea el ticket con cualquier `clientId` del cuerpo o de la orden de venta
- THEN sigue la vía actual, sin ningún `422` nuevo

#### Scenario: La orden de venta manda sobre el equipo cuando el cuerpo calla
- GIVEN sin `clientId` en el cuerpo, OV cuyo cliente es `"cli-B"`, y equipo `equipo.clientId = "cli-A"`
- WHEN se crea el ticket
- THEN responde `422` (regla 2), aunque hoy el ticket se crea en silencio con `client_id = "cli-B"`
