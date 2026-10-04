# Delta para permissions — el octavo cargo, «Especialista técnico» (F1C-11)

## MODIFIED Requirements

### RQ-PM-12 · Ocho cargos, lista cerrada en `shared`

El sistema SHALL declarar en `packages/shared` una lista cerrada de exactamente ocho cargos, con estos nombres
exactos y en este orden: `Director Técnico`, `Coordinador Técnico`, `Técnico`, `Técnico de campo`,
`Director Comercial`, `Coordinador Comercial`, `Asistente Comercial`, `Especialista técnico`. Los siete primeros son
los de `decision/c10b-gerente-director`; el octavo, el de `decision/cargo-encargado-de-inventario`. «Gerente
comercial» MUST NOT figurar: es el nombre informal de Director Comercial. La lista SHALL existir en un solo sitio y
el cliente la MUST consumir. «Especialista técnico» MUST NOT recibir excepción de permiso ni respaldo por ausencia:
tiene los mismos permisos que cualquier cargo sin excepción.
(Previously: exactamente siete cargos, sin «Especialista técnico».)

#### Scenario: la lista tiene ocho entradas exactas
- GIVEN la lista de cargos de `shared`
- WHEN se enumera
- THEN tiene ocho elementos, y los siete primeros son iguales y en ese orden a los de `decision/c10b-gerente-director`
- AND el octavo es «Especialista técnico», el de `decision/cargo-encargado-de-inventario`
- AND «Gerente comercial» no pertenece a ella

#### Scenario: «Especialista técnico» va al final
- GIVEN la lista de cargos de `shared`
- WHEN se lee su último elemento
- THEN es «Especialista técnico», y los siete anteriores conservan su orden

#### Scenario: el guardián lee las dos decisiones
- GIVEN `openspec/config.yaml` con las decisiones `decision/c10b-gerente-director` y `decision/cargo-encargado-de-inventario`
- WHEN la prueba de `cargos` compara la lista de `shared` con ellas
- THEN la lista coincide con los siete nombres de la primera más el de la segunda, y cambiar un nombre en cualquiera de las dos hace fallar la prueba

#### Scenario: el octavo cargo no concede ni quita nada
- GIVEN un usuario con `cargo_permiso = 'Especialista técnico'` y las áreas de otro usuario de referencia sin cargo
- WHEN se evalúa cada transición de `TRANSITIONS`
- THEN el veredicto es el mismo que el de un cargo sin excepción: sólo lo que ya decide el área, y `liberacion_sin_factura` responde `403` como a cualquier cargo distinto de Director Comercial

#### Scenario: el octavo cargo no pasa las primitivas con cargo exigido
- GIVEN un usuario con `cargo_permiso = 'Especialista técnico'`
- WHEN se evalúan `puedeCrearOVIGarantia` y `puedeFijarPrioridadTop5`
- THEN ninguna pasa

#### Scenario: el alta de un usuario acepta el octavo cargo
- GIVEN un administrador autenticado
- WHEN da de alta o edita un usuario con `cargoPermiso: 'Especialista técnico'`
- THEN la fila se escribe y el usuario público devuelve ese cargo

### RQ-PM-20 · Primitivas sin llamador: OVI de garantía y Top 5

`shared` SHALL exportar `puedeCrearOVIGarantia` (Director Técnico o admin) y `puedeFijarPrioridadTop5` (Director
Comercial o admin). `puedeFijarPrioridadTop5` **tiene llamadores** desde F1B-07: las rutas de prioridad del cliente y
de ajuste por ticket (`tickets-core` RQ-TC-27 y RQ-TC-29) y la guarda de las transiciones (`transitions-st` RQ-TS-21).
`puedeCrearOVIGarantia` **sigue sin llamador**: el acto de crear OVI de garantía es de F1B-03 y no existe en el código.
La prueba de las primitivas SHALL decir cuál tiene llamador y cuál no. Este cambio MUST NOT construir el acto de la OVI
de garantía.
(Previously: «Hoy no las llama nadie», las dos sin llamador, con el Top 5 de F1B-07 aún sin construir; y el escenario
por cargo recorría siete cargos.)

#### Scenario: por cargo y admin
- GIVEN cada uno de los ocho cargos, «sin cargo» y admin
- WHEN se evalúan las dos primitivas
- THEN sólo Director Técnico (y admin) pasa la primera y sólo Director Comercial (y admin) la segunda

#### Scenario: sólo la del Top 5 tiene llamador
- GIVEN el código de `apps/` y `packages/`, sin pruebas
- WHEN se buscan llamadores de las dos primitivas
- THEN `puedeFijarPrioridadTop5` tiene al menos uno en el servidor y `puedeCrearOVIGarantia` ninguno

### RQ-PM-23 · Un solo predicado para fijar prioridad, mantener la lista Top 5 y ajustar por ticket

Los tres actos del Top 5 —fijar la prioridad de un cliente, marcar o desmarcar el Top 5 y ajustar la prioridad de un
ticket— SHALL decidirse con `puedeFijarPrioridadTop5` (`packages/shared/src/cargos.ts:80-83`) y con nada más (supuesto
S-5). Ninguna ruta del servidor MUST reescribir la regla por su cuenta. El cliente MAY ocultar esos controles con el
mismo predicado como comodidad, porque la imposición del servidor está probada (regla invariable 13, punto 3). El
predicado conserva el área `Comercial` (supuesto S-4): un Director Comercial sin área `Comercial` queda fuera.
(Previously: el escenario de las tres rutas recorría siete cargos.)

#### Scenario: las tres rutas dan el mismo veredicto
- GIVEN cada uno de los ocho cargos, «sin cargo» y admin, con área `Comercial`
- WHEN cada uno intenta fijar la prioridad de un cliente, marcar el Top 5 y ajustar un ticket
- THEN sólo Director Comercial y admin reciben `200` en las tres, y el resto `403` en las tres

#### Scenario: Director Comercial sin área Comercial
- GIVEN un usuario con cargo `Director Comercial` y sólo el área `Servicio Técnico`
- WHEN intenta cualquiera de los tres actos
- THEN responde `403`

#### Scenario: el cargo sin área no concede (RQ-PM-21)
- GIVEN un usuario de `Compras` con cargo `Director Comercial`
- WHEN intenta marcar un cliente como Top 5
- THEN responde `403`
