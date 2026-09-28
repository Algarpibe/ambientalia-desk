# Delta for `remisiones`

Cambio `parche-iv11-orden-venta` (F1B-11, `cierra: no`). El `UPDATE` que ya escribe la orden de venta
sobre el ticket destino gana la marca de fila que protege esas columnas del sincronizador (`zoho-sync`
RQ-ZS-01 modificado). RQ-RE-16 deja de nombrar esta vía como fuera del alcance de IV-11.

## MODIFIED Requirements

### Requirement: RQ-RE-16 · La tercera puerta: una orden de venta no puede quedar en dos tickets

Antes de escribir `orden_venta`, `fecha_orden_venta` y `salesorder_id` sobre el ticket destino,
`POST /api/remisiones` **SHALL** comprobar contra `ticketConOrdenVenta(db, { salesorderId, numero },
ticketId)` (`packages/zoho-sync/src/db/repo.ts:330-347`) que la orden no pertenezca ya a otro ticket,
por las **dos vías** —`salesorder_id` y número— y **excluyendo el propio ticket destino**. La
comprobación **SHALL** ejecutarse dentro del bloque `if (b.salesOrderId)` de `remision.ts:218-240`,
**después** del `422` «Orden de venta no encontrada» (`:220`) y **antes** del `UPDATE` (`:235-239`).

Si la orden ya pertenece a otro ticket, la respuesta **SHALL** ser `409`, con el texto de
`ticketService.ts:151` («La orden de venta {ov} ya está asociada al ticket #{n}»), y **ninguna** de
las tres columnas **SHALL** quedar escrita. El `422` del serial (`remision.ts:152-157`) **SHALL**
seguir ganando al `409` nuevo, sin mover ninguna de las dos guardas. La condición
`WHERE ... COALESCE(orden_venta,'') = ''` (`:237`) **SHALL** mantenerse intacta: protege la carrera de
dos remisiones sobre el **mismo** ticket, una pregunta distinta de la que resuelve este requisito.

**Las dos vías son requisito, no preferencia.** La divergencia `orden_venta`/`salesorder_id` por
sincronización (IV-11) puede dejar a un ticket con sólo una de las dos columnas vigente; comprobar
sólo por número dejaría ese ticket sin protección. **Esta vía deja de estar fuera del alcance del
parche de IV-11**: el mismo `UPDATE` que escribe las tres columnas (`remision.ts:235-239`) **SHALL**
poner también la marca de fila `ov_elegida_en_app_at` (**supuesto S-1**; `zoho-sync` RQ-ZS-01
modificado), de modo que la orden capturada aquí quede protegida de la siguiente pasada del
sincronizador. El resto de IV-11 —filas previas sin marca, y la asociación 1:N propia entre orden y
ticket— sigue fuera (cambios 2 y 3 de F1B-11, fuera de alcance de este delta).

**Tercer punto de captura legítimo.** La remisión de entrada **SHALL** contarse como el tercer punto
de captura de la orden de venta, junto con el alta del ticket (`tickets-core` RQ-TC-08) y
`habilitar_servicio` (`ticketService.ts:150-151`). La lista de
`docs/sdd/Decisiones_Gerencia_2026-09-10.md:156-164`, que sólo nombraba los dos primeros, quedó
incompleta por omisión de redacción, no por decisión (decisión 1 de la ronda de preguntas del
2026-09-16).

**Guarda transitoria.** Esta guarda **SHALL** retirarse el día en que la tabla propia con
`salesorder_id` como `PRIMARY KEY` (`Decisiones_Gerencia_2026-09-10.md:147-150`) sustituya a las tres
guardas de aplicación; retirar sólo ésta sin retirar las otras dos sería el defecto.

(Previously: el `UPDATE` no dejaba ninguna marca sobre la fila; la orden capturada aquí quedaba
expuesta a que la siguiente pasada del sincronizador la sobrescribiera, y esta vía se nombraba como
fuera del alcance de IV-11.)

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
- WHEN el `UPDATE` de `remision.ts:235-239` escribe `orden_venta`, `fecha_orden_venta` y
  `salesorder_id`
- THEN la misma sentencia deja la marca `ov_elegida_en_app_at` puesta sobre la fila
- AND una pasada posterior del sincronizador no pisa `orden_venta` ni `fecha_orden_venta` de ese
  ticket

## Fuera de alcance de este delta

- **Cambio 2 de F1B-11** — asociación OV↔ticket 1:N propia de la aplicación y subOV de lote. No se
  toca ninguna tabla puente ni cardinalidad aquí.
- **Cambio 3 de F1B-11** — registro de contrato y prioridad, que cierra la fila del plan
  (`cierra: si`). No cubierto por este delta.
- Filas de remisiones anteriores a este cambio: sin relleno de marca (decisión de persona).
