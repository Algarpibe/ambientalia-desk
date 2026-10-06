# Delta para remisiones — guardas de la orden OVI en la remisión de entrada (F1B-03, `cierra: no`)

Numeración comprobada: el último requisito vivo es RQ-RE-29; los nuevos son RQ-RE-30 y RQ-RE-31. **No se reordena
ninguna guarda existente de la remisión** y **no se reescribe ningún requisito de orden vivo** (RQ-RE-16 y los demás
conservan su texto): IV-12 sigue sin destino. Supuestos S-1…S-10: los de `proposal.md` §6, aceptados. Marcas: **ROJO** /
**CARACTERIZACIÓN**.

## ADDED Requirements

### RQ-RE-30 · La remisión de entrada exige el cargo cuando la orden recibida es OVI (escalón B)

En el bloque de la orden de venta (`apps/desk/server/routes/remision.ts:218-243`), una orden resuelta desde
`salesOrderId` cuyo número es OVI y que **entra** (RQ-PM-25: no coincide con `orden_venta`, `salesorder_id` ni una
asociación vigente del ticket) SHALL exigir el cargo (RQ-PM-24); sin él responde `403`. Las guardas actúan aunque el
`UPDATE` no vaya a escribir porque el ticket ya tenga otra orden (SUPUESTO S-8, falla cerrado).

**Dónde cae, sin reordenar nada.** El `if` de `remision.ts:220` reúne hoy «Orden de venta no encontrada» (A) y la
cuarentena (C), y detrás van el vencido (C) y la unicidad (D). La guarda de cargo se intercala **entre** «no encontrada»
y la cuarentena: A → cargo → cuarentena → vencido → garantía (RQ-RE-31) → unicidad. El orden relativo de las guardas
que ya existen **no cambia**. Como el número sólo se conoce tras leer Books, el `403` corre **detrás** de la fecha
(`:127`, C), la recepción (`:158`, C), la remisión pendiente (`:177`, D) y el checklist (`:197`, C). Es un **cuarto punto
de IV-12** (B después de C y D), del mismo molde que los tres registrados: se anota y **no se corrige aquí**; los dos
últimos pares de abajo lo caracterizan.

**Par no observable:** «Orden de venta no encontrada» frente a cargo: sin orden no hay número que juzgar.

#### Scenario: OVI sin cargo — ROJO
- GIVEN un usuario sin cargo ni admin y un `salesOrderId` de una orden `OVI-2026-001` que el ticket no tiene
- WHEN crea la remisión de entrada
- THEN responde `403` de cargo y no se escribe orden alguna

#### Scenario: con cargo, administrador sin cargo, y Director Técnico sin el área Servicio Técnico pasan
- GIVEN cada uno de los tres, con una OVI nueva
- WHEN crean la remisión
- THEN la guarda de cargo no los detiene

#### Scenario: reconfirmar la OVI que el ticket ya tiene no pide cargo — ROJO
- GIVEN un ticket de Zoho cuyo `salesorder_id` ya es el de `OVI-2026-001`, y un usuario sin cargo
- WHEN crea la remisión con ese mismo `salesOrderId`
- THEN no recibe el `403` de cargo

#### Scenario: ticket con otra orden, OVI distinta sin cargo (S-8) — ROJO
- GIVEN un ticket con `orden_venta` `OV-2026-001` y una OVI distinta, de un usuario sin cargo
- WHEN crea la remisión con esa OVI
- THEN responde `403`, aunque el `UPDATE` no fuera a escribir

#### Scenario: posición, cargo < C cuarentena — ROJO
- GIVEN `OVI-2026-001-01` (con sufijo) y un usuario sin cargo
- WHEN crea la remisión
- THEN responde el `403`, no el `422` de cuarentena; con cargo responde el `422` de cuarentena de siempre

#### Scenario: posición, cargo < D orden ya asociada — ROJO
- GIVEN una OVI ya asociada a otro ticket y un usuario sin cargo
- WHEN crea la remisión
- THEN responde el `403`, no el `409`

#### Scenario: posición, D remisión pendiente < cargo (caracterización del punto de IV-12) — CARACTERIZACIÓN
- GIVEN un ticket con remisión pendiente y una OVI de un usuario sin cargo
- WHEN crea la remisión
- THEN responde el `409` de remisión pendiente, no el `403`

#### Scenario: posición, C checklist < cargo (caracterización del punto de IV-12) — CARACTERIZACIÓN
- GIVEN un ítem fuera del checklist y una OVI de un usuario sin cargo
- WHEN crea la remisión
- THEN responde el `422` de «Ítems fuera del checklist», no el `403`

### RQ-RE-31 · Un ticket de «Garantía» sólo admite una orden `OVI-` en la remisión de entrada (escalón C)

Si `tipo_servicio` es exactamente «Garantía» (SUPUESTO S-7) y entra una orden que no es OVI, la remisión SHALL responder
`422` con el texto de garantía de `tickets-core` RQ-TC-43. Cae **después** del contrato vencido (C, `:220`) y **antes** de
la unicidad (D, `:232`), sin tocar el orden de las guardas existentes. Una OVI en un ticket que no es de Garantía se
admite con el cargo. Cargo frente a garantía **no es observable** aquí: la remisión trae una sola orden.

#### Scenario: Garantía con una orden `OV-` — ROJO
- GIVEN un ticket de «Garantía» y un usuario con el cargo
- WHEN crea la remisión con `salesOrderId` de `OV-2026-001`
- THEN responde `422` de garantía y no se asocia

#### Scenario: Garantía con OVI y cargo, y OVI en un ticket que no es de Garantía, se admiten
- GIVEN un Director Técnico, con un ticket de «Garantía» y una OVI, y con un ticket de otro tipo y una OVI
- WHEN crea la remisión
- THEN se admite en los dos casos

#### Scenario: posición, C garantía < D orden ya asociada — ROJO
- GIVEN un ticket de «Garantía» y una `OV-` ya asociada a otro ticket
- WHEN un usuario con el cargo crea la remisión
- THEN responde el `422` de garantía, no el `409`

#### Scenario: la remisión de un ticket de Garantía que ya tiene su orden no se revisa (S-1) — CARACTERIZACIÓN
- GIVEN un ticket de «Garantía» cuya `orden_venta` ya es una `OV-` y la misma orden reenviada
- WHEN crea la remisión
- THEN no recibe el `422` de garantía
