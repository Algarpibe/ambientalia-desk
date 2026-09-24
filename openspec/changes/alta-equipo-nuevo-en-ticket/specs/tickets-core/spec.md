# Delta for tickets-core

## ADDED Requirements

### Requirement: RQ-TC-15 · Alta con «Equipo nuevo»: el equipo se crea o se reutiliza en el mismo paso

Cuando `clasificaciones === 'Equipo nuevo'` y el cuerpo no trae `equipoId`, el sistema **SHALL**
aceptar los datos del equipo nuevo en el mismo cuerpo del alta — obligatorios: `serial`, `modeloId`
del catálogo y `fechaFacturaCompra` (la fecha de **compra** del equipo, no `tickets.fecha_factura`);
opcionales: fecha de adquisición, fin de garantía, código interno, Drive y mantenedor, con la
validación de F1B-02 (`hojas-vida` RQ-HV-03, RQ-HV-04, RQ-HV-05). Esta guarda **sustituye**, sólo para
esta clasificación, la exigencia de `equipoId` de RQ-TC-04; `Equipo para servicio de mantenimiento` y
`Soporte remoto` siguen exigiéndolo sin cambios.

- Si ya existe un equipo cuyo `serial` normalizado (recortado y en minúsculas) coincide con el
  `serial` recibido, el sistema **SHALL** reutilizar ese equipo y **MUST NOT** crear uno nuevo.
- El `clientId` del equipo, creado o reutilizado, **SHALL** ser el `clientId` ya resuelto del ticket
  (cuerpo o `salesOrderId`, RQ-TC-13).
- El ticket **SHALL** quedar enlazado al equipo —creado o reutilizado— igual que queda enlazado hoy a
  un equipo ya existente (RQ-TC-04).

#### Scenario: Alta con datos válidos crea un equipo nuevo
- GIVEN clasificaciones = 'Equipo nuevo', sin `equipoId`, con `serial`, `modeloId` y
  `fechaFacturaCompra` válidos
- WHEN se crea el ticket
- THEN responde `201`, existe un equipo nuevo con `clientId` igual al del ticket, y el ticket queda
  enlazado a él

#### Scenario: Serial ya existente se reutiliza, sin duplicar
- GIVEN un equipo existente con serial `"SN-1"`, y un alta con serial `" Sn-1 "` (espacios y
  mayúsculas distintos)
- WHEN se crea el ticket
- THEN responde `201`, no se crea un segundo equipo, y el ticket queda enlazado al equipo existente

### Requirement: RQ-TC-16 · La creación del equipo nuevo es atómica con la del ticket

El sistema **SHALL** crear el equipo nuevo sólo después de que todas las guardas del alta hayan
pasado, y **SHALL** escribirlo en la misma transacción que el `INSERT` del ticket (RQ-TC-06), de modo
que **MUST NOT** quede un equipo huérfano cuando una guarda posterior al punto de creación falla.

#### Scenario: Una guarda posterior falla y no queda equipo creado
- GIVEN clasificaciones = 'Equipo nuevo', datos del equipo válidos, y una orden de venta ya asociada a
  otro ticket
- WHEN se crea el ticket
- THEN responde `409` (o el `422` de la guarda que falle) y no queda ningún equipo nuevo escrito

**Bajo `strict_tdd`:** el rojo de esta guarda se obtiene también por mutación — mover la creación del
equipo antes de la última guarda del alta debe poner la suite en rojo (regla de mutación 1 de
`CLAUDE.md`).

## MODIFIED Requirements

### Requirement: RQ-TC-04 · El serial es la llave, y viene del catálogo

El alta **SHALL** exigir un `equipoId` del catálogo, y **MUST NOT** aceptar el equipo como texto
libre (`ticketService.ts:23-27`: `422 'Falta el equipo'` en `:24` y `422 'Equipo no registrado'` en
`:27`). **Excepción:**
con `clasificaciones = 'Equipo nuevo'`, el alta **SHALL** admitir en su lugar los datos del equipo y
registrarlo o reutilizarlo en el mismo paso, según `RQ-TC-15` y `RQ-TC-16`
(`decision/equipo-nuevo-alta-en-ticket`). Tampoco en esa rama se acepta el equipo como texto libre: el
modelo **SHALL** venir del catálogo.

- La marca, el modelo, el tipo y el serial **SHALL** salir del equipo, no del formulario
  (`ticketService.ts:104-105`, leyendo `getEquipo` de `apps/desk/server/db/equipos.ts:77-80`).
- El catálogo **SHALL** poder buscarse por serial, y también por nombre de cliente
  (`equipos.ts:59-71`), y sólo devuelve los activos (`:67`).
- El serial **SHALL** exigirse además en `habilitar_servicio`, porque los tickets sincronizados desde
  Zoho llegan sin él (`transitions.ts:189`; maestro M1.1 `[AS-BUILT]`, `:1046`). La razón está en
  `transitions.ts:174-177`.

(Previously: el alta exigía siempre un `equipoId` ya registrado, sin excepción por clasificación, y la
lectura de marca, modelo, tipo y serial se citaba en `ticketService.ts:64-66`, desfasada respecto del
código.)

#### Scenario: Mantenimiento sin equipo sigue rechazándose

- GIVEN un alta con `clasificaciones = 'Equipo para servicio de mantenimiento'` y sin `equipoId`
- WHEN se envía
- THEN responde `422 'Falta el equipo'`, como antes de este cambio

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

El orden relativo de estas dos guardas frente a las guardas 3-7 de la tabla de arriba, y entre sí, lo
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

(Previously: dos correcciones de citas por el desplazamiento de `9ed5635`, y las filas 4/5 —OV ya
usada antes que la discrepancia equipo↔cliente— en el orden que el código todavía ejecutaba.
`orden-precedencia-guardas` mueve el `409` de la OV al final: deja de ser la guarda 4 y pasa a ser la
7.)

(Previously, tras `orden-precedencia-guardas`: la columna de evidencia de las filas 4-7 apuntaba a
`:65-83`, `:87-92`, `:93-94` y `:45-49`; el rango de la función a `:20-105`; la nota del prefijo a
`:91`; y la del `createTicket` a `:97` — las siete desfasadas por el propio desplazamiento de líneas
de esa tanda, caso A de la regla de mutación 4 de `CLAUDE.md`. `alta-equipo-nuevo-en-ticket` repara
las siete contra el árbol de hoy y añade la subtabla de la rama «Equipo nuevo».)

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

**Bajo `strict_tdd`:** la prueba de «equipo↔cliente gana a la OV ya usada» nace **roja de forma
natural** —hoy el código contesta `409`—; la de «equipo↔cliente gana a los obligatorios» nace
**verde** —el código ya la cumple— y su rojo se obtiene **por mutación**: invertir el orden de las dos
guardas, correr la suite, confirmar el rojo, revertir. Las pruebas de la rama «Equipo nuevo» nacen
**rojas de forma natural**: la rama no existe hoy.
