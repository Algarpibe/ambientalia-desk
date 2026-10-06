# Delta para transitions-st — guardas de la orden OVI en las transiciones con campo de orden (F1B-03, `cierra: no`)

Numeración comprobada: el último requisito vivo es RQ-TS-35; los nuevos son RQ-TS-36 a RQ-TS-38. El delta **no modifica**
RQ-TS-06: su tabla de guardas conserva su orden y estos requisitos fijan dónde cae cada guarda nueva. No entra ninguna
transición nueva. Las tres transiciones con campo de orden son «Habilitar Servicio» (`habilitar_servicio`) y la «OV
adicional» de `aprobacion` y de `aprobacion_y_repuestos`; comparten puerta (`executeTransition`) y cada prueba corre por
transición. Supuestos S-1…S-10: los de `proposal.md` §6, aceptados. Marcas: **ROJO** / **CARACTERIZACIÓN**.

## ADDED Requirements

### RQ-TS-36 · Las transiciones con campo de orden exigen el cargo cuando entra una OVI (escalón B)

Para cada una de las tres transiciones, una orden OVI que **entra** (RQ-PM-25) SHALL exigir el cargo (RQ-PM-24); sin él
responde `403` con el texto de cargo. La guarda cae **después** de los `403`/`409` de existencia, flujo, estado y área, y
del `403` de prioridad, y **antes** de los demás escalones B (verificación `409`, alta validada `422`, remisión vigente
`422`) y de todo escalón C y D. Ninguna transición con campo de orden activa a la vez el `403` de cargo de excepción ni el
de prioridad (HIPÓTESIS para `liberacion_sin_factura`, cuyos campos no se leyeron): ese par **no es observable** y no
lleva escenario.

#### Scenario: OVI nueva sin cargo, en cada transición — ROJO
- GIVEN un usuario de área Comercial sin cargo y un ticket sin esa orden
- WHEN envía `OVI-2026-001` en «Habilitar Servicio», en la «OV adicional» de `aprobacion` y en la de `aprobacion_y_repuestos`
- THEN las tres responden `403` de cargo

#### Scenario: con cargo y administrador sin cargo pasan la guarda; Director Técnico sin área Servicio Técnico también
- GIVEN un Director Técnico con sólo el área Comercial; y un administrador sin cargo
- WHEN envían una OVI nueva en «Habilitar Servicio»
- THEN la guarda de cargo no los detiene

#### Scenario: OVI en un ticket que no es de Garantía, con el cargo, se admite — CARACTERIZACIÓN
- GIVEN un Director Técnico y un ticket con otro `tipo_servicio`
- WHEN envía una OVI nueva en una de las tres transiciones
- THEN se admite

#### Scenario: posición, B estado `409` < cargo — CARACTERIZACIÓN
- GIVEN un ticket en un estado desde el que la transición no aplica, y una OVI de un usuario sin cargo
- WHEN la ejecuta
- THEN responde el `409` «no aplica desde el estado», no el `403` de cargo

#### Scenario: posición, B área `403` < cargo — CARACTERIZACIÓN
- GIVEN un usuario de Servicio Técnico sin cargo y «Habilitar Servicio» con una OVI nueva
- WHEN la ejecuta
- THEN responde el `403` de área («Tu rol no tiene permiso…»), no el de cargo

#### Scenario: posición, cargo < B remisión vigente — ROJO
- GIVEN un ticket sin remisión de entrada vigente y una OVI nueva, de un usuario de Comercial sin cargo
- WHEN ejecuta «Habilitar Servicio»
- THEN responde el `403` de cargo, no el `422` de remisión vigente

#### Scenario: posición, cargo < C obligatorios (`aprobacion_y_repuestos`) — ROJO
- GIVEN una OVI adicional nueva de un usuario sin cargo y falta una fecha obligatoria
- WHEN ejecuta la transición
- THEN responde el `403`, no el `422` agregado de obligatorios

#### Scenario: posición, cargo < D orden ya asociada — ROJO
- GIVEN una OVI que ya tiene otro ticket, de un usuario sin cargo
- WHEN la envía en cualquiera de las tres transiciones
- THEN responde el `403`, no el `409` de «ya está asociada»

### RQ-TS-37 · Un ticket de «Garantía» sólo admite órdenes `OVI-` en las transiciones (escalón C)

Para las tres transiciones, si `tipo_servicio` es exactamente «Garantía» (SUPUESTO S-7) y entra una orden que no es OVI,
SHALL responder `422` con el texto de garantía de `tickets-core` RQ-TC-43. Alcanza también a la «OV adicional»: un ticket
de garantía no admite una orden de cobro adicional (SUPUESTO S-5). Es escalón **C**: va dentro del `422` agregado, tras
las guardas B y **antes** del contrato vencido y de la unicidad (**D**). Sólo juzga las órdenes que entran (SUPUESTO S-1).
Cargo frente a garantía **no es observable** (una OVI activa la primera y una orden que no lo es la segunda, y cada
transición trae una sola orden): sin escenario inventado.

#### Scenario: Garantía con una orden `OV-` en cada transición — ROJO
- GIVEN un ticket de «Garantía» y un usuario con el cargo
- WHEN envía `OV-2026-001` en «Habilitar Servicio», o como «OV adicional» en las dos aprobaciones
- THEN responde `422` de garantía

#### Scenario: Garantía con OVI y cargo se admite — ROJO
- GIVEN un ticket de «Garantía» y un Director Técnico
- WHEN envía `OVI-2026-001` como orden nueva
- THEN se admite

#### Scenario: posición, C garantía < D orden ya asociada — ROJO
- GIVEN un ticket de «Garantía» y una `OV-` ya asociada a otro ticket
- WHEN la envía un usuario con el cargo
- THEN responde el `422` de garantía, no el `409`

### RQ-TS-38 · Reconfirmar la orden del ticket en una transición no pide el cargo ni la garantía

Cuando la orden enviada es la que el ticket ya tiene (RQ-PM-25), las guardas de OVI (cargo y garantía) **MUST NOT**
actuar, en tickets de Zoho y de la aplicación. El panel reenvía siempre la orden que el ticket ya trae
(`apps/desk/src/components/TransitionPanel.tsx:76-80`), así que ése es el camino normal de «Habilitar Servicio», que es
de área Comercial.

#### Scenario: Zoho con OVI reconfirmada en «Habilitar Servicio» pasa sin cargo — ROJO
- GIVEN un ticket de id numérico con `orden_venta` `OVI-2026-001`, y un usuario de Comercial sin cargo que no es administrador
- WHEN ejecuta «Habilitar Servicio» enviando `OVI-2026-001`
- THEN no recibe el `403` de cargo

#### Scenario: ticket de la aplicación con la OVI que asoció el Director Técnico — ROJO
- GIVEN un ticket con `PREFIJO_TICKET_APP` cuya OVI ya está asociada
- WHEN un usuario de Comercial sin cargo la reenvía
- THEN no recibe el `403` de cargo

#### Scenario: un ticket de Garantía ya asociado a una orden que no es OVI reconfirma sin `422` (S-1) — CARACTERIZACIÓN
- GIVEN un ticket de «Garantía» con `orden_venta` `OV-2026-001` desde antes de este cambio
- WHEN se reenvía esa misma orden
- THEN no recibe el `422` de garantía

#### Scenario: la asociación vigente también cuenta como «ya la tiene»
- GIVEN un ticket con `orden_venta` vacía y una asociación vigente de `OVI-2026-001`
- WHEN un usuario sin cargo envía esa orden
- THEN no recibe el `403` de cargo
