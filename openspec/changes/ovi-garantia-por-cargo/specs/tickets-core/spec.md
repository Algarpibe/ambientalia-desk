# Delta para tickets-core — guardas de la orden OVI en el alta (F1B-03, `cierra: no`)

Numeración comprobada: el último requisito vivo es RQ-TC-41; los nuevos son RQ-TC-42 y RQ-TC-43. El delta **no
reescribe** RQ-TC-05: sus guardas conservan su orden, y estos requisitos fijan dónde cae cada guarda nueva respecto de
ellas. Supuestos S-1…S-10: los de `proposal.md` §6, aceptados. Marcas: **ROJO** nace rojo; **CARACTERIZACIÓN** nace verde
y la posición se prueba moviendo la guarda (regla de mutación 1).

## ADDED Requirements

### Requirement: RQ-TC-42 · El alta exige el cargo cuando la orden es OVI (escalón B)

El alta SHALL juzgar con RQ-PM-24 y RQ-PM-25 las órdenes que traiga: el número final (`ordenVenta` tecleada, que gana al
de Books) **y** el número de la orden resuelta desde `salesOrderId`. En el alta el ticket nace: toda orden entra. Sin
cargo y sin ser administrador, responde `403`. La guarda cae **después** de «Orden de venta no encontrada» (A) y
**antes** de la discrepancia equipo↔cliente y de los obligatorios (C): ante dos defectos se ve el del escalón anterior.
Si el servicio no recibe al sujeto, se trata como «sin cargo» (SUPUESTO S-10).

#### Scenario: OVI sin cargo — ROJO
- GIVEN un usuario sin cargo ni admin y un cuerpo válido con `salesOrderId` de una orden `OVI-2026-001`
- WHEN crea el ticket
- THEN responde `403` y no se escribe el ticket

#### Scenario: OVI tecleada sin id, y número tecleado distinto del de la orden resuelta — ROJO
- GIVEN un usuario sin cargo y un cuerpo con `ordenVenta: 'OVI-2026-001'` y sin `salesOrderId`; y otro con `salesOrderId` de una orden `OV-` y `ordenVenta: 'ovi-2026-001'`
- WHEN crea el ticket
- THEN en los dos casos responde `403`

#### Scenario: con cargo, y administrador sin cargo
- GIVEN un Director Técnico sin el área Servicio Técnico; y un administrador sin cargo
- WHEN cada uno crea un ticket con una OVI
- THEN el alta no se detiene por el cargo

#### Scenario: sujeto ausente falla cerrado (S-10) — ROJO
- GIVEN una llamada al servicio de alta sin sujeto y con una OVI
- WHEN se ejecuta
- THEN responde `403`

#### Scenario: posición, A «Equipo no registrado» < cargo — CARACTERIZACIÓN
- GIVEN un cuerpo con equipo inexistente y una OVI, de un usuario sin cargo
- WHEN crea el ticket
- THEN responde el `422` «Equipo no registrado», no el `403`

#### Scenario: posición, A «Orden de venta no encontrada» < cargo — CARACTERIZACIÓN
- GIVEN `ordenVenta: 'OVI-2026-001'` tecleada, un `salesOrderId` inexistente y un usuario sin cargo
- WHEN crea el ticket
- THEN responde el `422` «Orden de venta no encontrada», no el `403`

#### Scenario: posición, cargo < C equipo↔cliente — ROJO
- GIVEN una OVI, un usuario sin cargo y un `clientId` que no es el del equipo
- WHEN crea el ticket
- THEN responde el `403` de cargo, no el `422` de la discrepancia

#### Scenario: posición, cargo < C obligatorios — ROJO
- GIVEN una OVI, un usuario sin cargo y faltan campos obligatorios
- WHEN crea el ticket
- THEN responde el `403`, no el `422` de «Faltan campos obligatorios»

### Requirement: RQ-TC-43 · Un ticket de «Garantía» sólo admite una orden `OVI-` en el alta (escalón C)

Si `tipo_servicio` es exactamente «Garantía» (literal de `TIPOS_SERVICIO`, `packages/shared/src/ticketCreate.ts:4`;
SUPUESTO S-7), el alta SHALL responder `422` cuando entre una orden que no es OVI, con el texto «El ticket es de tipo de
servicio Garantía y sólo admite una orden OVI-: la orden {n} no lo es». Es escalón **C** (combina dos datos del
contenido, como RQ-TC-05): va **después** de la cuarentena y del contrato vencido (SUPUESTO S-9) y **antes** de las
guardas de unicidad (**D**, NIT y orden ya asociada). La guarda actúa cuando la orden ENTRA: un ticket de Garantía sin
ninguna orden **nace** (SUPUESTO S-2) y no se revisan tickets ya asociados (SUPUESTO S-1). Una OVI en un ticket que **no**
es de Garantía **se admite** con el cargo: «una OVI sólo va en garantía» está pendiente del Director Técnico y no se
impone.

**Pares no observables, dichos para que nadie los dé por probados:** cargo frente a garantía. La primera guarda salta con
una OVI y la segunda con una orden que no lo es, y el alta trae una sola orden; ninguna prueba puede activar las dos.

#### Scenario: Garantía con una orden `OV-` — ROJO
- GIVEN un ticket con `tipo_servicio` «Garantía» y la orden `OV-2026-001`
- WHEN se crea
- THEN responde `422` con el texto de garantía y no se escribe

#### Scenario: Garantía con OVI y cargo — ROJO
- GIVEN un Director Técnico y un ticket de «Garantía» con `OVI-2026-001`
- WHEN se crea
- THEN se crea con la orden

#### Scenario: Garantía sin orden nace (S-2) — CARACTERIZACIÓN
- GIVEN un ticket de «Garantía» sin ninguna orden
- WHEN se crea
- THEN se crea

#### Scenario: OVI en un ticket que no es de Garantía, con el cargo, se admite — CARACTERIZACIÓN
- GIVEN un Director Técnico y un ticket con otro `tipo_servicio` y `OVI-2026-001`
- WHEN se crea
- THEN se crea con la orden

#### Scenario: posición, C garantía < D orden ya asociada — ROJO
- GIVEN un ticket de «Garantía» con una `OV-` ya asociada a otro ticket
- WHEN se crea
- THEN responde el `422` de garantía, no el `409` de «ya está asociada»
