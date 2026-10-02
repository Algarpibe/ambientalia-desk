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
