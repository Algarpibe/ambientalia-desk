# Delta for `remisiones`

Cambio `registro-contrato` (F1B-11, cambio 3 de 3, `cierra: no`). La tercera puerta gana la guarda de
contrato vencido de `tickets-core` RQ-TC-25: escalón C, después de la cuarentena y antes de la unicidad,
dentro del mismo bloque de la orden de venta. No se reordena ninguna guarda existente.

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
recibida lleve sufijo: una subOV en cuarentena se rechaza con `422` sin llegar a comprobar unicidad
(`remision.ts:220`).

Inmediatamente **después** de la cuarentena y **antes** de la unicidad (`:230`), el alta de remisión
**SHALL** aplicar la guarda de contrato vencido (`tickets-core` RQ-TC-25, escalón C): una subOV de un
lote cuyo contrato venció se rechaza con `422` sin llegar a comprobar unicidad, sin escribir las tres
columnas ni la asociación, y sin crear la remisión. La guarda **SHALL** ir dentro del mismo bloque
`if (b.salesOrderId)`, junto a las otras dos, y **MUST NOT** reordenar ninguna guarda existente del alta
de remisión.

**IV-12 queda intacto y a propósito.** El alta de remisión sigue incumpliendo el orden total de F1B-10 en
dos puntos (`remision.ts:127` C antes que A `:155`; `:220` A después de C `:127`, `:197`), y el `409` de
remisión pendiente (`:177`, escalón D) sigue corriendo **antes** de todo el bloque de la orden de venta.
La consecuencia observable, que este requisito fija en vez de esconder: una remisión pendiente en el
ticket gana **también** a la guarda de vencido (`:177` precede a `:220`); el vencido sólo le gana al `409`
de **unicidad de la OV** (`:232`).

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
el cambio `asociacion-ov-ticket`; sin relleno retroactivo de los tickets existentes (dato de persona
pendiente, fuera de alcance) el histórico quedaría sin protección si se retiraran. Retirar sólo una de
las tres sería el defecto.

(Previously: tres vías, cuarentena en C y escritura de asociación, sin guarda de contrato vencido; el
escenario de reenvío citaba `:237`, que hoy es un comentario, y el `WHERE` de `orden_venta` vacía está en
`:241`, que es la línea que cita ahora.)

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
- AND el `UPDATE` es no-op porque `orden_venta` ya no está vacía (`:241`), y la remisión se crea con
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

#### Scenario: Una subOV de contrato vencido bloquea la remisión
- GIVEN una subOV libre de un lote con contrato cuya fecha de fin es anterior a hoy, y un ticket destino
  con serial y sin remisión pendiente
- WHEN se crea una remisión de entrada con esa OV
- THEN responde `422` de contrato vencido, no se escriben las tres columnas ni la asociación y no se crea
  la remisión

#### Scenario: El vencido gana al 409 de unicidad de la OV — posición fijada por prueba
- GIVEN una subOV de un lote vencido con asociación vigente a otro ticket, y un ticket destino sin
  remisión pendiente
- WHEN se crea la remisión de entrada con esa OV
- THEN responde `422` de vencido, no `409`; invertir el orden de las dos guardas debe poner esta prueba
  en rojo (regla de mutación 1 de `CLAUDE.md`)

#### Scenario: La remisión pendiente (409, `:177`) gana al vencido — IV-12 conservado
- GIVEN un ticket con una remisión pendiente sin desenlace y una subOV de un lote vencido
- WHEN se crea otra remisión de entrada con esa OV y sin `permitirSegunda`
- THEN responde el `409` de remisión pendiente, no el `422` de vencido, y `remisiones.test.ts:988` sigue
  pasando sin cambios

#### Scenario: Los ítems fuera del checklist ganan al vencido
- GIVEN una subOV de un lote vencido y un ítem `incluye` que no está en el checklist
- WHEN se crea la remisión de entrada
- THEN responde el `422` «Ítems fuera del checklist» (`:197`), no el de vencido

#### Scenario: Un lote sin contrato o con contrato aún no iniciado no bloquea la remisión
- GIVEN una subOV libre de un lote sin contrato, y otra de un lote cuyo contrato empieza mañana
- WHEN se crea una remisión de entrada con cada una
- THEN ambas responden `201`, igual que hoy

## Fuera de alcance de este delta

- IV-12 (orden del alta de remisión): no se reordena `remision.ts`; el vencido se coloca entre `:220` y
  `:230` sin mover nada más.
- Filas de remisiones anteriores a `asociacion-ov-ticket`: sin relleno de asociación (decisión de persona).
- Ampliación del contrato (E-086), Top 5 y prioridad (F1B-07).
