# Delta de `permissions` — `liberacion-sin-factura-motivo-fecha` (F1C-05, parte de paridad, `cierra: no`)

Marcas: **ROJO** = nace rojo · **CARACTERIZACIÓN** = ya verde hoy · **GUARDIÁN** = nace verde, se valida por mutación.

## MODIFIED Requirements

### RQ-PM-18 · Posición del 403 de cargo (escalón B)

El `403` de cargo SHALL evaluarse inmediatamente después del `403` de área y después de los `409` de flujo y de
estado, y antes de todo `422`. La suite MUST fallar si se mueve delante del `409` de estado o detrás del `422`
(regla de mutación 1). Esto incluye el `422` de contenido de la lista cerrada de `liberacion_sin_factura`
(`transitions-st` RQ-TS-35): un cuerpo que los activa a la vez recibe el `403`.

#### Scenario: 409 antes que 403 de cargo
- GIVEN un ticket fuera de `Por Facturar` y un Comercial sin cargo
- WHEN ejecuta `liberacion_sin_factura`
- THEN responde `409`, no `403`

#### Scenario: 403 de área antes que el de cargo
- GIVEN un usuario de `Compras` sin cargo y un ticket en `Por Facturar`
- WHEN ejecuta `liberacion_sin_factura`
- THEN el `403` nombra el área, no el cargo

#### Scenario: 403 de cargo antes que 422
- GIVEN un Comercial sin cargo y valores que darían `422`
- WHEN ejecuta `liberacion_sin_factura`
- THEN responde `403`

#### Scenario: 403 de cargo antes que el 422 de la lista cerrada (PL-1, regla de mutación 1)
- GIVEN un Comercial sin cargo, un ticket en `Por Facturar` y un cuerpo con una fecha válida y un motivo fuera de la lista
  de `RQ-TS-35` (las dos guardas activas a la vez)
- WHEN ejecuta `liberacion_sin_factura`
- THEN responde `403` que nombra `Director Comercial`, no el `422` de la lista; con un administrador y el mismo cuerpo
  responde el `422` de la lista. Mover la guarda de contenido delante del `403` de cargo debe poner esta prueba en rojo.
  **CARACTERIZACIÓN** la parte del `403` (verde hoy: sin cargo ya responde `403`) y **ROJO** el control con administrador
