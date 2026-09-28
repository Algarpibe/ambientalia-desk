# Delta for `transitions-st`

Cambio `asociacion-ov-ticket` (F1B-11, cambio 2 de 3, `cierra: no`). `habilitar_servicio` (puerta 2)
gana la tercera vía y la cuarentena de `tickets-core`, y escribe la asociación. `Aprobación` y
`Aprobación y S. Repuestos` ganan la capacidad de añadir una OV sin sustituir la de entrada, con su
fecha de OC guardada en la asociación.

## MODIFIED Requirements

### Requirement: RQ-TS-14 · Una orden de venta, un ticket — en la puerta de la transición

`habilitar_servicio` es la segunda de las tres puertas por las que una OV entra en un ticket. Al
escribir `orden_venta`, la transición **SHALL** rechazar con `409` una orden ya asociada a otro
ticket, mirando ahora **tres vías** —`salesorder_id`, `orden_venta` y la asociación vigente de
`public.ov_asociaciones` (`tickets-core` RQ-TC-17)—, excluyendo el propio ticket
(`ticketService.ts:95-102`, con `ticketConOrdenVenta` en `packages/zoho-sync/src/db/repo.ts:362-379`,
ampliado con la tercera vía).

Antes de esta comprobación de unicidad (escalón D), `habilitar_servicio` **SHALL** aplicar la misma
guarda de cuarentena que el alta (`tickets-core` RQ-TC-18, escalón C) cuando la OV recibida lleve
sufijo. La transición **SHALL** escribir la asociación (`tickets-core` RQ-TC-17) en la misma
transacción que escribe `orden_venta`.

La tercera puerta —el alta de remisión— está construida (`remisiones` RQ-RE-16,
`tercera-puerta-orden-venta`) y gana aquí la misma tercera vía y la misma cuarentena. Las otras dos
puertas y la regla completa pertenecen a las specs `tickets-core` y `remisiones`.

(Previously: dos vías, sin cuarentena ni escritura de asociación; y describía la tercera puerta como
no construida, lo que §3.4 de esta misma spec ya había corregido por separado.)

#### Scenario: `habilitar_servicio` sin OV en cuarentena sigue igual

- GIVEN una transición `habilitar_servicio` con una OV libre y sin sufijo
- WHEN se ejecuta
- THEN responde `200`, igual que hoy, y queda escrita la asociación

#### Scenario: OV en cuarentena bloquea `habilitar_servicio` antes de la unicidad

- GIVEN una OV con sufijo no canónico
- WHEN se ejecuta `habilitar_servicio` con esa OV
- THEN responde `422` de cuarentena, no `409` de unicidad

## ADDED Requirements

### Requirement: RQ-TS-18 · `Aprobación` y `Aprobación y S. Repuestos` añaden una OV, no la sustituyen

Las transiciones `Aprobación` y `Aprobación y S. Repuestos` **SHALL** poder recibir una OV nueva y
**SHALL** crear una asociación adicional (`tickets-core` RQ-TC-17) sin tocar la OV de entrada —
`orden_venta`/`fecha_orden_venta` del ticket, protegidas por `ov_elegida_en_app_at` (`zoho-sync`
RQ-ZS-01, sin cambios en este delta)—. La fecha de orden de compra (OC) que acompañe a esta OV
**SHALL** guardarse en la propia asociación y **MUST NOT** escribirse sobre columnas del ticket. Las
dos transiciones **SHALL** aplicar las mismas guardas de cuarentena y unicidad que `RQ-TS-14`.

#### Scenario: Tras `Aprobación` con OV nueva, la de entrada no cambia

- GIVEN un ticket con su OV de entrada ya asociada
- WHEN se ejecuta `Aprobación` con una OV distinta y su fecha de OC
- THEN el ticket queda con dos asociaciones vigentes, y `orden_venta`/`fecha_orden_venta` del ticket
  no cambian

#### Scenario: La fecha de OC vive en la asociación nueva

- GIVEN la ejecución del escenario anterior
- WHEN se consulta la asociación creada por `Aprobación`
- THEN tiene la fecha de OC, y ninguna columna del ticket la guarda

## Fuera de alcance de este delta

- El campo «añade OV» no reordena las guardas existentes de `Aprobación` fuera de las ya declaradas en
  `transitions.ts`.
- IV-12 (orden del alta de remisión): no se toca `remision.ts` para reordenarla.
