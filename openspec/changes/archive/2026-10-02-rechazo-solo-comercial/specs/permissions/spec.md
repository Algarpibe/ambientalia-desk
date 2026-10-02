# Delta para `permissions` — matriz de 93 casos, 55 prohibidos y 38 permitidos (F1C-10)

Cambio `rechazo-solo-comercial`. `rechazo_cliente` (`Notificación cliente` → `Por Facturar`) pasa de
`Comercial / Servicio Técnico` a `Comercial` (E-114, `docs/sdd/ENTRADA.md:1460-1464`; maestro vigente
`R08.4.md:1616`). Las cifras de este delta son las posteriores a F1C-10; las de F1C-09 (54/39, 23 simples
+ 8 compartidas) quedan nombradas en cada `(Previously: …)`, que es el caso B de la regla de mutación 4.

## MODIFIED Requirements

### Requirement: RQ-PM-03 · La matriz completa, probada contra el servidor

La matriz de área × transición **SHALL** ser **31 × 3 = 93 casos: 55 prohibidos y 38 permitidos**
(24 transiciones de área simple × 2 áreas prohibidas + 7 compartidas × 1)
(`apps/desk/server/permisos.test.ts`). La función pura de área conserva el mismo reparto 55/38.
(Previously, tras F1C-09 y hasta F1C-10: 31 × 3 = 93 casos, 54 prohibidos y 39 permitidos, con 23 de área
simple y 8 compartidas. Antes de F1C-09: 34 × 3 = 102 casos, 60 prohibidos y 42 permitidos, con 26 de área
simple; el barrido de cargo pasa de 816 a 744 combinaciones y **no** cambia en F1C-10.)

- La matriz **MUST** derivarse del grafo y no escribirse a mano: escrita a mano, la transición que añada una
  tanda futura no tendría fila y nadie se enteraría (`permisos.test.ts:24-27`).
- El **total** sí **SHALL** ir escrito a mano, porque una matriz derivada de un grafo vacío también daría
  verde (`permisos.test.ts:26-27`, `:70`).
- **MUST** probarse contra el servidor y no contra la función pura: el `403` lo lanza
  `ticketService.ts:129-130`, y hay tres guardas por delante que se comen la respuesta
  (`permisos.test.ts:29-33`). Cada ticket se coloca en `t.from[0]`, un estado válido.
- Un administrador **MAY** ejecutar las 31 sin que su área importe (`permissions.ts:5`; probado contra el
  servidor en `permisos.test.ts:89-109`, con un usuario cuyo rol **no** cubre ninguna transición).
  (Previously: las 34.)
- La matriz HTTP con cargo **SHALL** diferir de la matriz de área en **exactamente UN** caso: Comercial sin
  cargo × `liberacion_sin_factura` (200 en área, 403 con cargo). Esa diferencia **MUST** estar afirmada, para
  que el `esperado` no sea tautológico. El barrido cargo × área × transición **SHALL** seguir siendo de 744
  combinaciones.
- La matriz compuesta sin cargo (área y cargo a la vez) **SHALL** repartirse en **56 prohibidos y 37
  permitidos** sobre las mismas 93 celdas. (Previously: 55 prohibidos y 38 permitidos.)
- `rechazo_cliente` **SHALL** ser de área simple `Comercial`: un usuario cuyo rol sólo tenga `Servicio
  Técnico` **MUST** recibir `403` al ejecutarla. `rechazo_comercial` y `rechazo_revision` **SHALL**
  conservar `Comercial / Servicio Técnico`.

**Y de aquí sale la legitimidad del espejo del cliente.** Con esta matriz probada,
`apps/desk/src/components/TransitionPanel.tsx:56-58` es **comodidad legítima** bajo la regla invariable 13:
la frontera está impuesta y probada en el servidor (`permisos.test.ts:35-39`). F1C-10 no toca ningún `.tsx`:
el panel consume `puedeEjecutarTransicion` de `@ambientalia/shared` y el cambio de área le llega por el
catálogo.

#### Scenario: la matriz de área tiene 93 casos
- GIVEN la matriz de área sin cargo
- WHEN se cuenta
- THEN son 93 casos, 55 prohibidos y 38 permitidos

#### Scenario: prohibición por área
- GIVEN un usuario cuyo rol sólo tiene el área `Compras`
- WHEN intenta ejecutar `facturado`, de área `Comercial`, desde `Por Facturar`
- THEN el servidor responde `403` y el mensaje nombra el área que hacía falta

#### Scenario: exactamente un caso difiere
- GIVEN la matriz HTTP con cargo y la matriz de área
- WHEN se comparan las 93 celdas
- THEN difiere una sola: Comercial sin cargo × `liberacion_sin_factura`, de 200 a 403

#### Scenario: el reparto por área simple tiene siete compartidas
- GIVEN las 31 transiciones
- WHEN se clasifican por área
- THEN 24 son de área simple y 7 compartidas, y 24×2 + 7 = 55 prohibidos
  (Previously: 23 de área simple y 8 compartidas, 23×2 + 8 = 54)

#### Scenario: la matriz compuesta sin cargo reparte 56 y 37
- GIVEN la matriz compuesta de área y cargo, con usuarios sin cargo
- WHEN se cuentan sus 93 celdas
- THEN son 56 prohibidos y 37 permitidos
  (Previously: 55 prohibidos y 38 permitidos)

#### Scenario: Servicio Técnico recibe 403 en rechazo_cliente
- GIVEN un ticket en `Notificación cliente` y un usuario cuyo rol sólo tiene el área `Servicio Técnico`
- WHEN ejecuta `rechazo_cliente`
- THEN el servidor responde `403`, el ticket no cambia de estado y no se inserta fila en `ticket_transitions`

#### Scenario: Comercial y administrador ejecutan rechazo_cliente
- GIVEN un ticket en `Notificación cliente`
- WHEN un usuario del área `Comercial`, y por separado un administrador, ejecutan `rechazo_cliente`
- THEN ambos reciben `200` y el ticket pasa a `Por Facturar`

#### Scenario: las otras dos Rechazo siguen admitiendo a Servicio Técnico
- GIVEN un usuario cuyo rol sólo tiene el área `Servicio Técnico`
- WHEN ejecuta `rechazo_comercial` desde `Notificación Comercial` y `rechazo_revision` desde `Rev./Diagnostico`
- THEN las dos responden `200`

#### Scenario: una de las tres retiradas ya no tiene fila de matriz
- GIVEN la matriz derivada del grafo
- WHEN se busca una fila de `marcar_pendiente`
- THEN no existe, y la mutación de reponerla sube el total a 96 y pone el total escrito a mano en rojo

#### Scenario: mutación — devolver rechazo_cliente a Comercial / Servicio Técnico pone la matriz en rojo
- GIVEN `rechazo_cliente.area` devuelta a `Comercial / Servicio Técnico`
- WHEN corre la suite
- THEN fallan el total de la matriz de área (54/39 en lugar de 55/38), el de la matriz compuesta (55/38 en lugar de 56/37) y la prueba del `403`
