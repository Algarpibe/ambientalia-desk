# Delta for tickets-core

Contexto: `openspec/specs/tickets-core/spec.md`. Mismo cambio, mismo anclaje: **toda cita `ruta:línea`
se lee contra `ad65161`** (Caso B, regla de mutación 4) — `:45-49` es la posición **actual** del
bloque que esta tanda mueve, no una numeración futura.

**MODIFICA:** `RQ-TC-05` (tabla de guardas del alta: el `409` de la OV pasa a ser la última), `4.1`
(cerrada: las dos puertas del motor evalúan ya en el mismo orden) y `RQ-TC-13` (**hallazgo de
verificación, no heredado del encargo**: su frase sobre la posición de la guarda equipo↔cliente —«tras
el `409` de la OV»— deja de ser cierta en cuanto la OV pasa a ser la última guarda del alta; se corrige
en el mismo acto que la rompe, no se deja para un barrido posterior). El orden total, la tabla de las
siete guardas por puerta y el contrato 404/422 viven en `transitions-st` §3.8; aquí sólo se refleja el
orden ya corregido. El barrido de cierre de citas (cinco sitios, ninguno en `tickets-core`) está
registrado en el delta de `transitions-st`.

## MODIFIED Requirements

### Requirement: RQ-TC-05 · Orden de las guardas del alta, y qué contesta cada una

`POST /api/tickets` (`routes/tickets.ts:124-126`) **SHALL** exigir sesión (`:35`) y **SHALL** aplicar
las guardas de `createManagedTicket` (`ticketService.ts:20-105`) **en este orden**, el que exige el
orden total de precedencia (`transitions-st` §3.8):

| Orden | Guarda | Escalón | Respuesta | Evidencia |
|---|---|---|---|---|
| 1 | Falta el equipo | A | `422 'Falta el equipo'` | `ticketService.ts:22-23` |
| 2 | El equipo no está en el catálogo | A | `422 'Equipo no registrado'` | `:24-25` |
| 3 | La orden de venta no existe en Books | A | `422 'Orden de venta no encontrada'` | `:35-37` |
| 4 | Discrepancia equipo↔cliente | C | `422`, nombrando al cliente del equipo | `:65-83` |
| 5 | Faltan obligatorios (cliente, tipo de servicio, clasificaciones, prefijo) | C | `422`, con **todos** en una lista | `:87-92` |
| 6 | El cliente no existe en Books | C | `422 'Cliente no encontrado'` | `:93-94` |
| 7 | La orden de venta ya está asociada a otro ticket | D | `409` | `:45-49` (movida detrás de la guarda 6) |

- El `422` de obligatorios **SHALL** listar **todos** los que faltan y no de uno en uno (probado en
  `services/ticketService.test.ts:273`).
- El prefijo **SHALL** validarse contra `PREFIJOS`, no aceptarse libre (`:91`).
- El `409` de unicidad de la OV **SHALL** ser la **última** guarda antes de la primera escritura
  (`createTicket`, `:97`): cumple el orden total A/B/C/D de `transitions-st` §3.8.
- La guarda equipo↔cliente **SHALL** ejecutarse inmediatamente después de la existencia de la orden de
  venta en Books (`:37`) —que puede completar `clientId` cuando el cuerpo no lo trae (`:39`)— y antes
  de los obligatorios, del cliente y del `409` de unicidad.

(Previously: dos correcciones de citas por el desplazamiento de `9ed5635`, y las filas 4/5 —OV ya usada
antes que la discrepancia equipo↔cliente— en el orden que el código todavía ejecutaba.
`orden-precedencia-guardas` mueve el `409` de la OV al final: deja de ser la guarda 4 y pasa a ser la
7.)

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

**Bajo `strict_tdd`:** la prueba de «equipo↔cliente gana a la OV ya usada» nace **roja de forma
natural** —hoy el código contesta `409`—; la de «equipo↔cliente gana a los obligatorios» nace **verde**
—el código ya la cumple— y su rojo se obtiene **por mutación**: invertir el orden de las dos guardas,
correr la suite, confirmar el rojo, revertir.

### Requirement: 4.1 · La precedencia del `409` de la OV frente al `422` de obligatorios — cerrada por `orden-precedencia-guardas`

**Cerrado.** El `409` de unicidad de la orden de venta deja de ganar en el alta: pasa a ser la
**última** guarda antes de la primera escritura (`ticketService.ts:97`), detrás de las guardas de
contenido — igual que en `habilitar_servicio`. Las dos puertas de la misma regla evalúan ahora en el
**mismo** orden (`transitions-st` §3.8(a)).

**Talla, contada de nuevo.** De las 12 pruebas de precedencia cambian **3**:
`ticketService.test.ts:327`, `:336` (el error doble ya no lo gana la OV) y `:205` (par distinto, la
OV frente a la derivación, cerrado en `executeTransition` por obs. #702). Las otras **9**, más
`remisiones.test.ts:957`, quedan intactas.

(Previously: «Sin tanda: falta una fila en el plan», con la talla contada en «6 de 12» bajo un orden
natural que nunca llegó a aplicarse. `orden-precedencia-guardas` es esa fila, y la cifra real,
verificada contra el cambio efectivamente aplicado, es 3.)

#### Scenario: El mismo error doble responde igual en las dos puertas del motor
- GIVEN un ticket con obligatorios sin completar y una orden de venta ya usada por otro ticket
- WHEN se manda por `POST /api/tickets`
- THEN responde `422` (los obligatorios ganan)
- WHEN el mismo error doble se manda por `habilitar_servicio`
- THEN responde también `422` — el mismo par de errores, el mismo resultado en las dos puertas

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
   - Si `getClient(db, clientId)` devuelve `null` —alcanzable, porque «Cliente no encontrado» es
     guarda posterior (`:94`)— el lado solicitado **SHALL** mostrar sólo el id, con la nota «sin
     ficha en Books» (`books/repo.ts:129-131`).
3. Si `equipo.clientId` es `NULL`, el sistema **MUST NOT** alterar comportamiento existente (protege
   al ~3,4 % de equipos sin enlazar); esta rama **SHALL** quedar fuera de la comparación del punto 2.

La posición de la guarda —tras la existencia de la orden de venta en Books (`:37`) y antes de los
obligatorios (`:87-92`)— y el `422` **SHALL** seguir igual. El `409` de unicidad de la orden de
venta —antes en `:45-49`, inmediatamente antes de esta guarda— pasa a evaluarse **después** de los
obligatorios y del cliente, como última guarda del alta (`transitions-st` §3.8; `RQ-TC-05`): la
posición RELATIVA de esta guarda frente al `409` de unicidad se invierte; frente a los obligatorios no
cambia.

La severidad es de **integridad de datos, no de autorización**: `tickets.client_id` no autoriza nada,
sólo resuelve el nombre a mostrar (`tickets-core` RQ-TC-12).

**Consecuencia declarada.** El `clientId` final puede venir de la orden de venta y no sólo del cuerpo
(`:39`): un ticket cuya OV es de un cliente distinto del equipo pasa a dar `422` donde antes creaba el
ticket en silencio. Toca el punto abierto nº 52 del maestro (`R08.1.md:2071-2079`).

(Previously: «tras el `409` de la OV (`:45-49`) y antes de los obligatorios (`:87-92`)».
`orden-precedencia-guardas` mueve el `409` de la OV al final del alta, así que esta guarda deja de ir
después de él y pasa a ir antes.)

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
- THEN responde `422` (regla 2), aunque antes de la guarda equipo↔cliente el ticket se creaba en
  silencio con `client_id = "cli-B"`
