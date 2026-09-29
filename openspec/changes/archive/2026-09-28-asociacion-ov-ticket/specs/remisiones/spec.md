# Delta for `remisiones`

Cambio `asociacion-ov-ticket` (F1B-11, cambio 2 de 3, `cierra: no`). La tercera puerta gana la vía de
la asociación vigente y la guarda de cuarentena, y el `UPDATE` que ya escribe la OV sobre el ticket
destino escribe también la fila de asociación, junto a la marca `ov_elegida_en_app_at` que ya ponía.

## MODIFIED Requirements

### Requirement: RQ-RE-16 · La tercera puerta: una orden de venta no puede quedar en dos tickets

Antes de escribir `orden_venta`, `fecha_orden_venta` y `salesorder_id` sobre el ticket destino,
`POST /api/remisiones` **SHALL** comprobar, por **tres vías** —`salesorder_id`, número y la asociación
vigente de `public.ov_asociaciones` (`tickets-core` RQ-TC-17)—, que la orden no pertenezca ya a otro
ticket, excluyendo el propio ticket destino
(`ticketConOrdenVenta(db, { salesorderId, numero }, ticketId)`,
`packages/zoho-sync/src/db/repo.ts:362-379`, ampliado con la tercera vía). La comprobación **SHALL**
ejecutarse dentro del bloque `if (b.salesOrderId)` de `remision.ts:218-244`, **después** del `422`
«Orden de venta no encontrada» (`:220`) y **antes** del `UPDATE` (`:239-243`).

Antes de esta comprobación de unicidad (escalón D), el alta de remisión **SHALL** aplicar la misma
guarda de cuarentena que las otras dos puertas (`tickets-core` RQ-TC-18, escalón C) cuando la OV
recibida lleve sufijo: una subOV en cuarentena se rechaza con `422` sin llegar a comprobar unicidad.
Esto no reordena ninguna guarda existente del alta de remisión (IV-12 sigue sin corregirse aquí): la
guarda de cuarentena se añade en su propio escalón, junto a la comprobación de unicidad que ya vive en
ese mismo bloque.

Si la orden ya pertenece a otro ticket, la respuesta **SHALL** ser `409`, con el texto de
`ticketService.ts:151` («La orden de venta {ov} ya está asociada al ticket #{n}»), y **ninguna** de
las tres columnas **SHALL** quedar escrita. El `422` del serial (`remision.ts:152-157`) **SHALL**
seguir ganando al `409` nuevo, sin mover ninguna de las guardas. La condición
`WHERE ... COALESCE(orden_venta,'') = ''` (`:241`) **SHALL** mantenerse intacta: protege la carrera de
dos remisiones sobre el **mismo** ticket, una pregunta distinta de la que resuelve este requisito.

**Las tres vías son requisito, no preferencia.** La divergencia `orden_venta`/`salesorder_id` por
sincronización (IV-11) puede dejar a un ticket con sólo una de las dos columnas vigente; la asociación
vigente cubre además el caso en que ninguna columna coincide pero la OV sigue en uso. El mismo `UPDATE`
que escribe las tres columnas y la marca `ov_elegida_en_app_at` **SHALL** además insertar la fila de
asociación (`tickets-core` RQ-TC-17), en la misma transacción.

**Tercer punto de captura legítimo.** La remisión de entrada **SHALL** contarse como el tercer punto
de captura de la orden de venta, junto con el alta del ticket (`tickets-core` RQ-TC-08) y
`habilitar_servicio` (`transitions-st` RQ-TS-14).

**Guardas de aplicación, todavía necesarias.** Las tres guardas —alta, `habilitar_servicio` y ésta—
**MUST NOT** retirarse: `public.ov_asociaciones` sólo cubre lo que sus escritores hayan asociado desde
este cambio; sin relleno retroactivo de los tickets existentes (dato de persona pendiente, fuera de
alcance) el histórico quedaría sin protección si se retiraran. Retirar sólo una de las tres sería el
defecto.

(Previously: dos vías, sin cuarentena ni escritura de asociación; la nota de retiro apuntaba al día en
que existiera la tabla propia, y hoy esa tabla existe pero el relleno retroactivo sigue pendiente, así
que las tres guardas de aplicación se quedan.)

#### Scenario: Una orden ya asociada a otro ticket se rechaza antes de escribir nada
- GIVEN una orden de venta ya asociada al ticket 7001
- WHEN se crea una remisión de entrada sobre otro ticket con esa misma orden
- THEN responde `409`, con el texto que nombra la orden y el ticket 7001
- AND ninguna de las tres columnas del ticket destino queda escrita

#### Scenario: El 422 del serial gana al 409 nuevo
- GIVEN un ticket destino sin serial —ni equipo con serial— y una orden ya asociada a otro ticket
- WHEN se crea la remisión de entrada
- THEN responde `422` «Falta el serial», no `409`
- AND ninguna de las tres columnas del destino queda escrita, y el ticket dueño de la orden sigue
  siendo el único

#### Scenario: Reenviar la misma orden al propio ticket no se rechaza a sí mismo
- GIVEN un ticket cuya orden de venta ya es la que llega en la remisión (reintento de red, doble clic)
- WHEN se crea la remisión de entrada
- THEN la comprobación excluye al propio ticket destino y no llega al `409`
- AND el `UPDATE` es no-op porque `orden_venta` ya no está vacía (`:237`), y la remisión se crea con
  `201`

#### Scenario: El UPDATE deja la orden protegida del sincronizador
- GIVEN una remisión de entrada que captura una orden de venta libre para su ticket
- WHEN el `UPDATE` de `remision.ts:239-243` escribe `orden_venta`, `fecha_orden_venta` y
  `salesorder_id`
- THEN la misma sentencia deja la marca `ov_elegida_en_app_at` puesta sobre la fila
- AND una pasada posterior del sincronizador no pisa `orden_venta` ni `fecha_orden_venta` de ese
  ticket

#### Scenario: Una OV en cuarentena bloquea la remisión antes del 409 de unicidad
- GIVEN una OV con sufijo no canónico, sin asociación vigente
- WHEN se crea una remisión de entrada con esa OV
- THEN responde `422` de cuarentena, no `409` de unicidad, y no se escribe nada

#### Scenario: El UPDATE también crea la fila de asociación
- GIVEN una remisión de entrada que captura una OV libre para su ticket
- WHEN el `UPDATE` escribe las tres columnas y la marca `ov_elegida_en_app_at`
- THEN también existe una fila vigente en `public.ov_asociaciones` para ese ticket y esa OV

## Fuera de alcance de este delta

- Cambio 3 de F1B-11 — registro de contrato y prioridad, que cierra la fila del plan (`cierra: si`).
- Filas de remisiones anteriores a este cambio: sin relleno de asociación (decisión de persona).
- IV-12 (orden del alta de remisión): no se reordena `remision.ts`.
