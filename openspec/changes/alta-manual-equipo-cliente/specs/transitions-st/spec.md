# Delta para transitions-st — guarda de «Habilitar Servicio» (F1B-15)

## ADDED Requirements

### RQ-TS-32 · «Habilitar Servicio» no pasa mientras el cliente sea provisional o el equipo esté pendiente

`habilitar_servicio` **SHALL** responder `422` mientras el cliente del ticket siga siendo provisional (no enlazado con
Books) o su equipo siga pendiente de validar. El predicado **SHALL** vivir en `packages/shared` y el servidor **SHALL**
imponerlo; el botón del cliente es sólo comodidad (regla 13). La guarda es de **estado del sujeto** (escalón B): se
evalúa **después** del permiso de área (RQ-TS-06, guarda 5) y **antes** de los obligatorios (guarda 6), de modo que un
usuario sin permiso recibe `403` y no `422`. El mensaje **SHALL** nombrar qué falta (cliente, equipo o ambos). Tras
el enlace y la validación, la misma transición **SHALL** pasar. Sólo se aplica a esta transición: el flujo de
soporte remoto no la contiene (`transitions.ts:388-397`) y en él la marca se ve pero **no bloquea** (supuesto Q3).
Los demás pasos del ticket no se ven afectados por las marcas.

#### Scenario: Cliente provisional bloquea
- GIVEN un ticket en `Ticket creado` con cliente provisional y equipo validado, y Comercial
- WHEN ejecuta `habilitar_servicio`
- THEN responde `422` nombrando el cliente y el ticket no cambia de estado

#### Scenario: Equipo pendiente bloquea
- GIVEN un ticket con cliente de Books y equipo pendiente
- WHEN Comercial ejecuta `habilitar_servicio`
- THEN responde `422` nombrando el equipo

#### Scenario: Ambos pendientes se nombran juntos
- GIVEN cliente provisional y equipo pendiente
- WHEN se ejecuta la transición
- THEN el `422` nombra los dos

#### Scenario: Tras enlazar y validar, pasa
- GIVEN un ticket antes bloqueado, ya con el cliente enlazado y el equipo validado
- WHEN Comercial ejecuta `habilitar_servicio`
- THEN responde `200` y el ticket avanza

#### Scenario: Posición de la guarda
- GIVEN un ticket con algo pendiente y un usuario sin el área de la transición
- WHEN ejecuta `habilitar_servicio`
- THEN responde `403`, no `422` (mover la guarda antes del permiso pone la prueba en rojo)

#### Scenario: Posición frente a los obligatorios
- GIVEN un ticket con algo pendiente, un usuario de Comercial y un campo obligatorio de la transición ausente
- WHEN ejecuta `habilitar_servicio`
- THEN el `422` que contesta es el de lo pendiente, no el de obligatorios

#### Scenario: Soporte remoto no se bloquea
- GIVEN un ticket de `Soporte remoto` con cliente provisional
- WHEN avanza por las transiciones de su flujo
- THEN ninguna responde `422` por la marca, y la marca sigue visible

## Fuera de alcance — para el `archive-report`

**§3.8 no es un requisito**, así que este delta no la modifica: es el mismo trato que le dio `registro-contrato`
(su delta de `transitions-st`, «Fuera de alcance»), y el arreglo de la tabla lo hace el archivo. Al archivar F1B-15, la
tabla de escalones de §3.8 y la fila `createManagedTicket` de su tabla de puertas (§3.8 a) **SHALL** ganar las guardas
del alta manual, contra `ticketService.ts` en el árbol de ese día (hoy, en `96ec938`):

- **A** `:25` —`exigirEquipoManual` / `exigirEquipoNuevo`: faltan datos del equipo que se va a crear; `exigirEquipoNuevo`
  es de F1B-14 y tampoco está en la tabla— y **A** `:28` —`exigirClienteProvisional`: faltan los cinco datos o el motivo
  del cliente provisional (RQ-TC-30)—. Se distinguen de los obligatorios de C (`:88`), que son los del cuerpo del ticket.
- **C** `:91` —`validarContenidoAltaManual`: serial ≠ confirmación, reservados, provisional junto con `clientId` u OV—.
- **D** `:96` —NIT del provisional ya en Books, `409` con candidatos (P-B)—, **antes** de la OV ya usada, que sigue
  siendo la última (`primerConflictoUnicidad`).
