# Delta for `tickets-core`

Cambio `registro-contrato` (F1B-11, cambio 3 de 3, `cierra: no`). Sin capacidad nueva (S-10): el registro
de contrato, su vigencia, el ticket de contrato derivado, la prioridad al nacer y la guarda de contrato
vencido entran aquí, junto al modelo de asociación (`RQ-TC-17`). El alta gana la guarda de vencido en el
escalón C, después de la cuarentena y antes de la unicidad.

## MODIFIED Requirements

### Requirement: RQ-TC-08 · Una orden de venta, un ticket — en la puerta del alta

Ésta es la **primera** de las tres puertas. El alta **SHALL** rechazar con `409` una orden ya asociada
a otro ticket, mirando **tres vías** —`salesorder_id`, `orden_venta` y la asociación vigente de
`public.ov_asociaciones` (`RQ-TC-17`)— (`ticketService.ts:96-100`, con `ticketConOrdenVenta` en
`repo.ts:362-379`, ampliado con la tercera vía).

- La razón **SHALL** quedar escrita: el buscador ya sólo ofrece las libres, «pero una lista no es una
  frontera» — basta mandar el id a mano o llegar con la lista cacheada para duplicar la orden
  (`ticketService.ts:92-95`).
- La **fecha** de la orden **SHALL** viajar con su número y guardarse en el alta
  (`ticketService.ts:32-36`, `:43`; `repo.ts:391-397`): sin ella, `habilitar_servicio` pide una fecha
  que nadie puede rellenar.
- Antes de esta comprobación de unicidad (escalón D), el alta **SHALL** aplicar la guarda de
  cuarentena de `RQ-TC-18` (escalón C) cuando la OV recibida lleve sufijo: una subOV en cuarentena se
  rechaza con `422` sin llegar a comprobar unicidad.
- Inmediatamente **después** de la cuarentena y **antes** de la unicidad, el alta **SHALL** aplicar la
  guarda de contrato vencido de `RQ-TC-25` (escalón C, **última** guarda de contenido de la puerta): una
  subOV de un lote cuyo contrato venció se rechaza con `422` sin llegar a comprobar unicidad. Las guardas
  de contenido anteriores del alta —faltantes (`ticketService.ts:88`), cliente no encontrado (`:90`),
  campos del equipo nuevo (`:91`)— **SHALL** seguir ganándole.
- El alta **SHALL** escribir la asociación (`RQ-TC-17`) en la misma transacción que crea el ticket.

La segunda puerta es de `transitions-st` RQ-TS-14; la tercera es de `remisiones` RQ-RE-16. Las tres
comparten la vía de la asociación vigente y la guarda de vencido. Las pruebas de posición existentes —
`ordenVentaUnTicket.test.ts` y `apps/desk/server/remisiones.test.ts:988`— **MUST NOT** cambiar sus
aserciones actuales.

(Previously: tres vías, cuarentena en C y escritura de asociación, pero sin guarda de contrato vencido;
la última guarda de contenido de la puerta era la cuarentena.)

#### Scenario: El alta sin cambios sigue igual

- GIVEN un alta sin ninguna OV en cuarentena, sin asociación previa y sin contrato registrado para su lote
- WHEN se crea el ticket
- THEN responde `201`, igual que hoy

#### Scenario: La asociación vigente por la tercera vía bloquea el alta

- GIVEN una OV con asociación vigente a otro ticket, sin coincidir por `salesorder_id` ni por
  `orden_venta` en columna
- WHEN se crea un ticket con esa OV
- THEN responde `409`, igual que si coincidiera por columna

#### Scenario: Las pruebas de posición existentes no cambian

- GIVEN `ordenVentaUnTicket.test.ts` y `remisiones.test.ts:988` tal como existen hoy
- WHEN se ejecutan tras este cambio
- THEN pasan sin modificar sus aserciones

#### Scenario: Una subOV de contrato vencido bloquea el alta

- GIVEN una subOV canónica `OV-2026-170-01` de un lote con contrato cuya fecha de fin es anterior a hoy,
  y sin asociación vigente
- WHEN se crea un ticket con esa OV
- THEN responde `422` con el motivo de contrato vencido y no se crea ticket ni asociación

#### Scenario: El vencido gana al 409 de unicidad — posición fijada por prueba

- GIVEN una subOV de un lote vencido que además tiene asociación vigente a otro ticket
- WHEN se crea un ticket con esa OV
- THEN responde `422` de contrato vencido, no `409` de unicidad; invertir el orden de las dos guardas
  debe poner esta prueba en rojo (regla de mutación 1 de `CLAUDE.md`)

#### Scenario: Los faltantes ganan al vencido

- GIVEN una subOV de un lote vencido y un cuerpo al que le falta el tipo de servicio
- WHEN se crea el ticket
- THEN responde `422` «Faltan campos obligatorios: tipo de servicio», no el motivo de contrato vencido

## ADDED Requirements

### Requirement: RQ-TC-21 · Registro de contrato: cliente, lote, inicio y fin; uno por lote; lo crea Comercial

El sistema **SHALL** persistir el contrato en una tabla propia del esquema `public` (`public.contratos`,
supuesto S-1), con una fila por contrato: cliente (id de `public.clients`, sin clave foránea porque es
réplica de Books), lote (`OV-AAAA-NNN`, mismo formato que acepta `apps/desk/server/routes/ovAsociaciones.ts:21` en `285ecf4`),
fecha de inicio, fecha de fin, y —como traza— persona y fecha de alta. **Ningún** campo del contrato es
opcional. El sistema **SHALL** admitir a lo sumo **un** contrato por lote, impuesto por una restricción de
unicidad de base de datos sobre el lote. El lote **MAY** no existir aún en Books (supuesto S-1): registrar
el contrato no exige que haya subOV creadas.

Crear un contrato **SHALL** exigir en el **servidor** el área Comercial o ser administrador
(supuesto S-2), consumiendo `canExecuteTransition(user.areas, user.isAdmin, 'Comercial')` de
`@ambientalia/shared`, el mismo patrón de `routes/ovAsociaciones.ts:47` (regla invariable 13: el botón
del cliente es comodidad, la imposición es la del servidor). Leer contratos y su ficha **SHALL** estar
abierto a cualquier usuario con sesión (supuesto reversible, como las lecturas de
`routes/ovAsociaciones.ts:13-14`). Editar la fecha de fin es la ampliación: queda fuera por E-086 (`docs/sdd/ENTRADA.md`).

El alta **SHALL** seguir el orden de precedencia de `transitions-st` §3.8: permiso (`403`, escalón B) antes
de contenido (`422`: campo ausente, lote con formato inválido, fecha inválida, cliente inexistente, fecha
de fin anterior a la de inicio; escalón C) antes de unicidad (`409` por lote ya registrado; escalón D).

Ningún flujo **SHALL** ejecutar `DELETE` sobre `public.contratos` en este cambio (supuesto: la baja y la
ampliación quedan fuera; ver «Fuera de alcance»).

#### Scenario: Comercial registra un contrato

- GIVEN un usuario del área Comercial y un cliente existente
- WHEN crea un contrato con lote `OV-2026-170`, inicio `2026-01-15` y fin `2026-12-31`
- THEN responde éxito y el contrato queda guardado con su persona y fecha de alta

#### Scenario: Sin área Comercial ni administración, el alta se rechaza con 403

- GIVEN un usuario con sesión cuya área no incluye Comercial y que no es administrador
- WHEN intenta crear un contrato con datos válidos
- THEN responde `403` y no se crea ninguna fila, aunque el cliente web no le muestre el botón

#### Scenario: Un administrador puede crear

- GIVEN un administrador sin el área Comercial
- WHEN crea un contrato con datos válidos
- THEN responde éxito

#### Scenario: Un segundo contrato para el mismo lote responde 409

- GIVEN un contrato ya registrado para el lote `OV-2026-170`
- WHEN Comercial intenta registrar otro contrato con ese lote, aunque sea de otro cliente
- THEN responde `409` y la fila existente no cambia

#### Scenario: Contenido inválido responde 422

- GIVEN un usuario Comercial
- WHEN crea un contrato con lote `OV-2026-170-01` (formato de subOV), o con fin anterior al inicio, o sin
  fecha de fin, o con un cliente que no existe
- THEN cada caso responde `422` y no se crea ninguna fila

#### Scenario: El permiso gana al contenido, y el contenido a la unicidad — posición fijada por prueba

- GIVEN un lote ya registrado
- WHEN un usuario sin Comercial manda un alta con contenido inválido para ese lote
- THEN responde `403`; y cuando un usuario Comercial manda un alta con contenido inválido para ese mismo
  lote ya registrado, responde `422`, no `409`

#### Scenario: Cualquier usuario con sesión lee, sin sesión no

- GIVEN un contrato registrado
- WHEN lo consulta un usuario con sesión sin área Comercial, y luego una petición sin sesión
- THEN la primera devuelve el contrato y la segunda responde `401`

### Requirement: RQ-TC-22 · Vigencia del contrato: por fecha, extremos incluidos

Un contrato **SHALL** estar **vigente** en una fecha cuando esa fecha es mayor o igual que su fecha de
inicio y menor o igual que su fecha de fin: **ambos extremos incluidos** (supuesto S-4). Un contrato
**SHALL** estar **vencido** cuando su fecha de fin es **anterior** a hoy (supuesto S-5), y **aún no
iniciado** cuando su fecha de inicio es posterior a hoy. Un contrato aún no iniciado **MUST NOT** bloquear
nada (`RQ-TC-25`) ni dar prioridad (`RQ-TC-24`). La regla **SHALL** vivir como función pura de dominio en
`packages/shared` —sin base de datos— y todas las puertas la **SHALL** consumir, sin reescribirla
(regla invariable 13). «Hoy» **SHALL** ser la fecha civil del servidor en una única zona horaria, que fija
el diseño (hipótesis: `America/Bogota`, la de `calendario-laboral` RQ-CL-01).

#### Scenario: El día del fin, el contrato sigue vigente

- GIVEN un contrato con fin `2026-12-31`
- WHEN se evalúa con hoy = `2026-12-31`
- THEN está vigente y no vencido

#### Scenario: El día siguiente al fin, está vencido

- GIVEN el mismo contrato
- WHEN se evalúa con hoy = `2027-01-01`
- THEN está vencido y no vigente

#### Scenario: El día del inicio ya está vigente; el anterior, aún no iniciado

- GIVEN un contrato con inicio `2026-10-01`
- WHEN se evalúa con hoy = `2026-10-01` y con hoy = `2026-09-30`
- THEN el primero está vigente y el segundo está aún no iniciado, ni vigente ni vencido

### Requirement: RQ-TC-23 · Ticket de contrato: derivado al leer, nunca guardado

Un ticket **SHALL** ser **de contrato** cuando tiene al menos una asociación **vigente** en
`public.ov_asociaciones` (`RQ-TC-17`) a una subOV canónica (`packages/shared/src/subOV.ts:32-36`) cuyo lote
tiene un contrato **vigente** hoy (`RQ-TC-22`). Nadie lo marca a mano. El sistema **SHALL** calcularlo al
leer y **MUST NOT** guardarlo como columna de `tickets` (supuesto S-3): así, si el contrato vence o la
asociación se libera (`RQ-TC-19`), el ticket deja de serlo sin ninguna escritura. La lectura del ticket
(`RQ-TC-20`) **SHALL** exponer si es de contrato y, en ese caso, el lote y el contrato que lo hacen serlo.

Este requisito **MUST NOT** comparar el cliente del contrato con el del ticket: pueden diferir (mantenedor,
IV-8; supuesto S-9).

#### Scenario: Asociación vigente a subOV de contrato vigente → es de contrato

- GIVEN un ticket con asociación vigente a `OV-2026-170-01` y un contrato vigente para `OV-2026-170`
- WHEN se consulta su detalle
- THEN se marca como de contrato, con el lote `OV-2026-170`

#### Scenario: Con el contrato vencido, deja de serlo sin escribir nada

- GIVEN el ticket anterior y el contrato con fin anterior a hoy
- WHEN se consulta su detalle
- THEN no se marca como de contrato, y ninguna columna de `tickets` ni fila de `ov_asociaciones` ha cambiado

#### Scenario: Una asociación liberada no cuenta

- GIVEN un ticket cuya única asociación a la subOV fue liberada
- WHEN se consulta su detalle
- THEN no se marca como de contrato

#### Scenario: Una OV ordinaria o un lote sin contrato no lo convierten en de contrato

- GIVEN un ticket con asociación vigente a `OV-2026-170` (ordinaria), y otro a `OV-2026-180-01` cuyo lote
  no tiene contrato
- WHEN se consulta el detalle de cada uno
- THEN ninguno se marca como de contrato

#### Scenario: Contrato y ticket de clientes distintos: sigue siendo de contrato

- GIVEN un contrato del cliente A y un ticket del cliente B con asociación vigente a una subOV de ese lote
- WHEN se consulta el detalle del ticket
- THEN se marca como de contrato y no se rechaza ninguna operación por la diferencia de clientes

### Requirement: RQ-TC-24 · Prioridad `High` al nacer, por el contrato del cliente, impuesta por el servidor

Cuando el **cliente del ticket** —ya resuelto en el alta (`ticketService.ts:89`)— tenga un contrato
**vigente** hoy (`RQ-TC-22`), `createManagedTicket` **SHALL** crear el ticket con prioridad `High`
(supuesto S-4: «Alta» del maestro ≡ el literal `High` de `packages/shared/src/transitions.ts:84`), **aunque
el cuerpo traiga otra prioridad** y también para correctivos cotizados aparte. Si el cliente no tiene
ningún contrato vigente, la prioridad **SHALL** ser la que hoy resulte del cuerpo, o ninguna
(`ticketService.ts:106` en `9288779`). La imposición **SHALL** ser del servidor (regla invariable 13): que el formulario
la muestre o no es comodidad.

La prioridad se toma del cliente del **ticket**, no de la subOV ni del cliente del contrato (supuesto S-9).
Este requisito **SHALL** aplicar sólo **al nacer**: no reevalúa tickets existentes ni cambia lo que una
transición escriba después en `priority`. Queda fuera «manda la más alta de las dos» con Top 5 (F1B-07).

#### Scenario: Cliente con contrato vigente → el ticket nace `High` aunque el cuerpo traiga `Low`

- GIVEN un cliente con un contrato vigente y un alta cuyo cuerpo trae `prioridad: 'Low'`
- WHEN se crea el ticket
- THEN el ticket queda con prioridad `High`

#### Scenario: Cliente con contrato vigente y cuerpo sin prioridad → `High`

- GIVEN un cliente con contrato vigente y un alta sin prioridad
- WHEN se crea el ticket
- THEN el ticket queda con prioridad `High`

#### Scenario: Sin contrato, todo queda como hoy

- GIVEN un cliente sin ningún contrato, y dos altas: una con `prioridad: 'Low'` y otra sin prioridad
- WHEN se crean los tickets
- THEN el primero queda `Low` y el segundo sin prioridad, igual que antes de este cambio

#### Scenario: Un contrato vencido o aún no iniciado no da prioridad

- GIVEN un cliente cuyo único contrato tiene fin anterior a hoy, y otro cuyo único contrato empieza mañana
- WHEN se crea un ticket con `prioridad: 'Low'` para cada uno
- THEN ambos quedan `Low`

#### Scenario: El día del fin todavía cuenta

- GIVEN un contrato con fin igual a hoy
- WHEN el cliente crea un ticket sin prioridad
- THEN el ticket nace `High`

#### Scenario: Manda el cliente del ticket, no el del contrato

- GIVEN un contrato vigente del cliente A y un alta para el cliente B, que no tiene contrato, con una subOV del lote de A
- WHEN se crea el ticket
- THEN la prioridad no se fuerza a `High` por el contrato de A

### Requirement: RQ-TC-25 · Guarda de contrato vencido: una subOV de un contrato vencido no se consume

Una subOV canónica cuyo lote tenga un contrato **vencido** (`RQ-TC-22`) **MUST NOT** poder asociarse a
ningún ticket por ninguna de las tres puertas —alta (`RQ-TC-08`), transición (`transitions-st` RQ-TS-14
y RQ-TS-18) y remisión de entrada (`remisiones` RQ-RE-16)—: cada una **SHALL** rechazarla con `422` que
nombre el lote, el contrato y su fecha de fin (supuesto S-5: se rechaza, no se avisa). La guarda **SHALL**
evaluarse sobre el **mismo número** de OV que la cuarentena y la unicidad de esa puerta, y **SHALL**
comprobar sólo lotes con contrato registrado:

- Una subOV cuyo lote **no tiene contrato** **SHALL** consumirse como hoy.
- Una subOV de un contrato **aún no iniciado** **SHALL** consumirse como hoy (`RQ-TC-22`).
- Una OV ordinaria u `OVI-` (`clasificarOV` → `ordinaria`) **MUST NOT** ser afectada.

**Precedencia (F1B-10).** La guarda es **escalón C** (contenido): se juzga un **valor aportado**, la subOV,
no el estado del sujeto (`transitions-st` §3.8, escalón B); es el mismo caso que la persona derivada que
existe pero está de baja. Dentro del escalón C es la **última** guarda de cada puerta —después de la
cuarentena y de cualquier otra guarda de contenido— y antes de la unicidad (D). Como una subOV en
cuarentena no tiene lote canónico (`packages/shared/src/subOV.ts:36`), la cuarentena y el vencido **son
excluyentes para un mismo número**: el orden entre ambas queda fijado por dependencia de datos, no
por prueba de posición sobre un solo número.

#### Scenario: Un lote vencido se rechaza en cada puerta

- GIVEN una subOV libre de un lote con contrato vencido
- WHEN se intenta asociar por el alta, por una transición y por una remisión de entrada
- THEN las tres responden `422` con el motivo de contrato vencido y no escriben asociación

#### Scenario: Un lote sin contrato se consume como hoy

- GIVEN una subOV libre de un lote sin contrato registrado
- WHEN se asocia por cualquiera de las tres puertas
- THEN se asocia igual que hoy

#### Scenario: Un contrato aún no iniciado no bloquea

- GIVEN una subOV libre de un lote cuyo contrato empieza mañana
- WHEN se asocia por cualquiera de las tres puertas
- THEN se asocia igual que hoy

#### Scenario: El último día de vigencia todavía se consume

- GIVEN una subOV libre de un lote con contrato cuyo fin es hoy
- WHEN se asocia por cualquiera de las tres puertas
- THEN se asocia sin `422`

#### Scenario: Una OV ordinaria o `OVI-` no la activa

- GIVEN el lote `OV-2026-170` con contrato vencido y una OV ordinaria `OV-2026-170` (la madre) sin asociación
- WHEN se asocia por el alta
- THEN la guarda de vencido no interviene

#### Scenario: Vencido y unicidad a la vez — el vencido gana

- GIVEN una subOV de un lote vencido con asociación vigente a otro ticket
- WHEN se intenta asociar por cualquiera de las tres puertas
- THEN responde `422` de vencido y no `409`

#### Scenario: Cuarentena y vencido son excluyentes para un mismo número

- GIVEN el número `OV-2026-170-X9` (sufijo no canónico) y un contrato vencido para el lote `OV-2026-170`
- WHEN se intenta asociar por cualquiera de las tres puertas
- THEN responde `422` de **cuarentena**, y el motivo no menciona contrato vencido (hipótesis: no hay
  petición de las tres puertas que aporte a la vez un número en cuarentena y otro de lote vencido, porque
  ninguna transición del catálogo trae `Orden de Venta` y `OV adicional` juntas, `transitions.ts:189`,
  `:199`, `:203`)

## Fuera de alcance de este delta

- **Ampliación del contrato**: pendiente de E-086 (`docs/sdd/ENTRADA.md`); no hay edición de fechas por
  ampliación ni baja de contratos.
- **Top 5 y «manda la prioridad más alta de las dos»**, y bloquear la edición de prioridad del técnico
  (`transitions.ts:193`, `:195`): F1B-07.
- **Relleno retroactivo** de contratos vivos y de asociaciones: dato de persona (P.7 y P.2 del cambio 2).
- **IV-8** (guarda cliente↔contrato): no se añade ninguna; el contrato y el ticket pueden ser de clientes
  distintos (S-9).
- **Cargos** de `decision/c10-permisos-cargo`: F1C-05; el permiso es por área (S-2).
- Un número tecleado en `ordenVenta` sin `salesOrderId` **no** crea asociación en el alta
  (`apps/desk/server/services/equipoNuevo.ts:91`): ese ticket no será «de contrato» por esa vía; no se
  cambia aquí.
