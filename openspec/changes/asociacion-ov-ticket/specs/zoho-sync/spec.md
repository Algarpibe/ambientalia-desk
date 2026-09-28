# Delta for `zoho-sync`

Cambio `asociacion-ov-ticket` (F1B-11, cambio 2 de 3, `cierra: no`). El buscador de órdenes de venta
gana la exclusión por asociación vigente y por cuarentena, y se añade el saldo por lote de subOV. La
marca `ov_elegida_en_app_at` (`RQ-ZS-01`) no cambia en este delta.

## ADDED Requirements

### Requirement: RQ-ZS-14 · `soloLibres` excluye asociaciones vigentes y cuarentena; saldo por lote

`searchSalesOrders` con `soloLibres` **SHALL** excluir toda OV con asociación vigente en
`public.ov_asociaciones` (`tickets-core` RQ-TC-17), además de las que hoy excluye por columna, y
**SHALL** excluir toda OV en cuarentena (`tickets-core` RQ-TC-18), sin excepción por cliente.

El sistema **SHALL** exponer el saldo de un lote de subOV sobre `books.sales_orders`: creadas,
consumidas (con asociación vigente) y libres, y el porcentaje ejecutado. Las subOV en cuarentena
**MUST NOT** contarse en ninguna de las tres categorías del saldo: se listan aparte
(`tickets-core` RQ-TC-18).

#### Scenario: Una OV con asociación vigente no aparece en `soloLibres`

- GIVEN una OV cuya única traza de uso es una fila vigente en `ov_asociaciones`, sin coincidir por
  columna con ningún ticket
- WHEN se pide el buscador con `soloLibres`
- THEN esa OV no aparece en el resultado

#### Scenario: Una subOV en cuarentena no aparece en el buscador ni en el saldo

- GIVEN una subOV con sufijo no canónico
- WHEN se piden `soloLibres` y el saldo del lote
- THEN la subOV no aparece en ninguno de los dos, y sí en la lista de cuarentena

#### Scenario: El saldo del lote cuenta correctamente

- GIVEN un lote con cinco subOV: dos con asociación vigente, dos libres y una en cuarentena
- WHEN se calcula el saldo del lote
- THEN reporta 5 creadas, 2 consumidas, 2 libres y 40 % ejecutado, con la de cuarentena fuera del
  recuento

## Fuera de alcance de este delta

- El relleno retroactivo de asociaciones para OV ya usadas antes de este cambio.
- La marca `ov_elegida_en_app_at` (`RQ-ZS-01`) no cambia en este delta.
