# Delta para `permissions`

## MODIFIED Requirements

### RQ-PM-20 · Primitivas del cargo: OVI de garantía y Top 5, las dos con llamador

`shared` SHALL exportar tres primitivas de cargo, todas con llamador: `puedeCrearOVIGarantia` (Director Técnico o
admin), `puedeFijarPrioridadTop5` (Director Comercial o admin) y el predicado de ajuste de la prioridad de un ticket
(Director Comercial con área `Comercial`, Director Técnico por cargo o admin), que es `puedeAjustarPrioridadTicket`
(`packages/shared/src/cargos.ts`) y que se añade sin cambiar las dos anteriores. `puedeFijarPrioridadTop5` **tiene llamadores** desde F1B-07: la ruta de prioridad
del cliente (`tickets-core` RQ-TC-27). El predicado de ajuste por ticket **tiene llamadores** en la ruta de ajuste por
ticket (`tickets-core` RQ-TC-29) y en la guarda de las transiciones (`transitions-st` RQ-TS-21).
`puedeCrearOVIGarantia` **tiene llamadores** desde F1B-03: la guarda de cargo de las cuatro entradas de una orden (RQ-PM-24; `tickets-core` RQ-TC-42, `transitions-st` RQ-TS-36, `remisiones` RQ-RE-30).
`puedeCrearOVIGarantia` **no exige área** (SUPUESTO S-4 en lo que toca al administrador): basta el cargo Director Técnico o ser administrador.
El predicado de ajuste por ticket **no exige área al Director Técnico** y **sí al Director Comercial** (supuesto S-F de la
propuesta `prioridad-tres-niveles`). La prueba de las primitivas SHALL decir que las tres tienen llamador. El acto que
se construye es **asociar** una orden OVI a un ticket, no crear la OVI en Books.
(Previously: `puedeCrearOVIGarantia` «sigue sin llamador», con el área Servicio Técnico dentro del predicado, y «Este
cambio MUST NOT construir el acto de la OVI de garantía». Y: dos primitivas; `puedeFijarPrioridadTop5` también
decidía el ajuste por ticket y la guarda de transición.)

#### Scenario: por cargo y admin
- GIVEN cada uno de los ocho cargos, «sin cargo» y admin, con y sin área `Comercial`
- WHEN se evalúan las tres primitivas
- THEN sólo Director Técnico (y admin) pasa la primera; sólo Director Comercial con área `Comercial` (y admin) pasa la segunda; y sólo Director Comercial con área `Comercial`, Director Técnico con cualquier área o sin ella, y admin pasan la tercera

#### Scenario: las tres primitivas tienen llamador
- GIVEN el código de `apps/` y `packages/`, sin pruebas
- WHEN se buscan llamadores de las tres primitivas
- THEN cada una tiene al menos uno en el servidor

#### Scenario: quitar al Director Técnico del predicado de ajuste pone la suite en rojo
- GIVEN la matriz de los ocho cargos, «sin cargo» y admin del predicado de ajuste por ticket
- WHEN se retira el Director Técnico del predicado
- THEN la prueba de la matriz se pone roja

### RQ-PM-23 · Un solo predicado para fijar prioridad, mantener la lista Top 5 y ajustar por ticket

Los dos actos del Top 5 sobre el **cliente** —fijar la prioridad de un cliente y marcar o desmarcar el Top 5— SHALL
decidirse con `puedeFijarPrioridadTop5` (`packages/shared/src/cargos.ts:80-83`) y con nada más (supuesto S-5). El acto
sobre el **ticket** —ajustar su prioridad, en la ruta y en la guarda de las transiciones— SHALL decidirse con el
predicado de ajuste por ticket (`RQ-PM-20`), que añade al Director Técnico por cargo (supuesto S-E de la propuesta
`prioridad-tres-niveles`). Ninguna ruta del servidor MUST reescribir la regla por su cuenta. El cliente MAY ocultar esos
controles con el mismo predicado como comodidad, porque la imposición del servidor está probada (regla invariable 13,
punto 3). `puedeFijarPrioridadTop5` conserva el área `Comercial` (supuesto S-4): un Director Comercial sin área
`Comercial` queda fuera de los tres actos, y el Director Técnico queda fuera de los dos actos del cliente.
(Previously: «Un solo predicado» decidía los tres actos, y el escenario de las tres rutas recorría siete cargos.)

#### Scenario: los dos actos del cliente dan el mismo veredicto
- GIVEN cada uno de los ocho cargos, «sin cargo» y admin, con área `Comercial`
- WHEN cada uno intenta fijar la prioridad de un cliente y marcar el Top 5
- THEN sólo Director Comercial y admin reciben `200` en las dos, y el resto `403` en las dos, incluido el Director Técnico

#### Scenario: el ajuste por ticket añade al Director Técnico
- GIVEN cada uno de los ocho cargos, «sin cargo» y admin, con área `Comercial`
- WHEN cada uno intenta ajustar la prioridad de un ticket
- THEN sólo Director Comercial, Director Técnico y admin reciben `200`, y el resto `403`

#### Scenario: Director Comercial sin área Comercial
- GIVEN un usuario con cargo `Director Comercial` y sólo el área `Servicio Técnico`
- WHEN intenta cualquiera de los tres actos
- THEN responde `403`

#### Scenario: el Director Técnico ajusta un ticket sin el área Comercial
- GIVEN un usuario con cargo `Director Técnico` sin el área `Comercial`
- WHEN intenta ajustar la prioridad de un ticket
- THEN responde `200`, y los dos actos del cliente le responden `403`

#### Scenario: el cargo sin área no concede (RQ-PM-21)
- GIVEN un usuario de `Compras` con cargo `Director Comercial`
- WHEN intenta marcar un cliente como Top 5
- THEN responde `403`

### RQ-PM-21 · El cargo sólo restringe

El cargo MUST NOT conceder lo que el área niega. Un cargo SHALL únicamente añadir una condición a una transición que
el área ya permite. Excepción declarada: `puedeAjustarPrioridadTicket` concede al Director Técnico **por cargo, sin
exigir área**, igual que `puedeCrearOVIGarantia`; ambas quedan fuera de este barrido. Al Director Comercial el mismo
predicado le sigue exigiendo el área `Comercial`. En la guarda de las transiciones el `403` de área sigue ganando
(`transitions-st` RQ-TS-22): la excepción no abre ninguna transición de otra área.
(Previously: sin la excepción de `puedeAjustarPrioridadTicket`; el texto decía sólo que el cargo no concede lo que el
área niega.)

#### Scenario: cargo sin área
- GIVEN un usuario de área `Servicio Técnico` con cargo `Director Comercial`
- WHEN ejecuta `liberacion_sin_factura`, de área `Comercial`
- THEN `403`

#### Scenario: el Director Técnico concede por cargo sólo en el ajuste de prioridad
- GIVEN un usuario con cargo `Director Técnico` sin el área `Comercial`
- WHEN intenta ajustar la prioridad de un ticket, y luego fijar la prioridad de un cliente
- THEN el primero responde `200` y el segundo `403`

#### Scenario: al Director Comercial se le sigue exigiendo el área
- GIVEN un usuario con cargo `Director Comercial` sin el área `Comercial`
- WHEN intenta ajustar la prioridad de un ticket
- THEN responde `403`
