# Delta para `permissions` — matriz de 93 casos (F1C-09)

## MODIFIED Requirements

### Requirement: RQ-PM-03 · La matriz completa, probada contra el servidor

La matriz de área × transición **SHALL** ser **31 × 3 = 93 casos: 54 prohibidos y 39 permitidos**
(23 transiciones de área simple × 2 áreas prohibidas + 8 compartidas × 1)
(`apps/desk/server/permisos.test.ts`). La función pura de área conserva el mismo reparto 54/39.
(Previously: 34 × 3 = 102 casos, 60 prohibidos y 42 permitidos, con 26 de área simple; el barrido de cargo
pasa de 816 a 744 combinaciones.)

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
  que el `esperado` no sea tautológico.

**Y de aquí sale la legitimidad del espejo del cliente.** Con esta matriz probada,
`apps/desk/src/components/TransitionPanel.tsx:56-58` es **comodidad legítima** bajo la regla invariable 13:
la frontera está impuesta y probada en el servidor (`permisos.test.ts:35-39`).

#### Scenario: la matriz de área tiene 93 casos
- GIVEN la matriz de área sin cargo
- WHEN se cuenta
- THEN son 93 casos, 54 prohibidos y 39 permitidos

#### Scenario: prohibición por área
- GIVEN un usuario cuyo rol sólo tiene el área `Compras`
- WHEN intenta ejecutar `facturado`, de área `Comercial`, desde `Por Facturar`
- THEN el servidor responde `403` y el mensaje nombra el área que hacía falta

#### Scenario: exactamente un caso difiere
- GIVEN la matriz HTTP con cargo y la matriz de área
- WHEN se comparan las 93 celdas
- THEN difiere una sola: Comercial sin cargo × `liberacion_sin_factura`, de 200 a 403

#### Scenario: el reparto por área simple conserva ocho compartidas
- GIVEN las 31 transiciones
- WHEN se clasifican por área
- THEN 23 son de área simple y 8 compartidas, y 23×2 + 8 = 54 prohibidos

#### Scenario: una de las tres retiradas ya no tiene fila de matriz
- GIVEN la matriz derivada del grafo
- WHEN se busca una fila de `marcar_pendiente`
- THEN no existe, y la mutación de reponerla sube el total a 96 y pone el total escrito a mano en rojo

## REMOVED Requirements

Ninguno.
