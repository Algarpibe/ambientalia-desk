# Delta de tickets-core — `marcador-migracion-lectores`

Fuente: `decision/marcador-migracion-en-pantallas` (`openspec/config.yaml:6766-6782`) y `decision/h1-fechas-migrados`
(`openspec/config.yaml:4863-4881`). Sólo `ADDED`, a continuación de RQ-TC-83. **Precisan** RQ-TC-69 (`openspec/specs/tickets-core/spec.md:4148`)
y RQ-TC-75 (`openspec/specs/tickets-core/spec.md:4424`), sin modificarlos. La regla vive en `packages/shared`, pura, y reconoce el
marcador sólo con `esPasoDeMigracion`. La **fecha de Zoho** es la última entrada en Zoho a `estado_previo`, de `ticket_history`
(`TicketUpdated`) vía `etapasDesdeHistoria` (`packages/shared/src/etapasDesdeHistoria.ts:86`) **[SUPUESTO S-6]**: nunca el
`performed_at` del marcador, ni `values.corte`, ni `created_time`.

## ADDED Requirements

### RQ-TC-84 · Las entradas actuales no toman el instante del marcador: el de identidad no es entrada; el que cambia el estado entra con la fecha de Zoho

`entradasActuales` (`apps/desk/server/db/sla.ts:88` en `e728808d`) **MUST NOT** contar el instante del marcador como la entrada al
estado **[SUPUESTO S-4]**. Con regla de **identidad** (`to_status` nulo) el marcador **SHALL NOT** dar entrada. Con una regla que
cambia el estado (`pendiente-servicio-a-en-proceso`, `entregado-a-finalizado`) el ticket **SHALL** entrar en el destino con la
fecha de Zoho. Sin fecha de Zoho, el ticket **SHALL** quedar sin entrada, y **MUST NOT** usarse la de la migración ni `created_time`.
La lectura de `ticket_history` **SHALL** limitarse a los tickets con ese marcador. Para «Finalizado», qué fecha de Zoho cuenta
**SHALL** fijarlo el diseño. Lo heredan `apps/desk/server/db/alarmasAvisadas.ts:22` y `apps/desk/server/db/listaRemisionCreada.ts:15`.

#### Scenario: marcador de identidad, sin entrada propia — CARACTERIZACIÓN
- GIVEN el ticket `T-202` en `'En Espera de Repuestos'` con un marcador de `to_status` nulo, `performed_at = 2026-12-12T15:00:00Z`, y sin otra transición
- WHEN se llama a `entradasActuales`
- THEN `T-202` queda sin entrada del marcador: no devuelve `2026-12-12T15:00:00Z`

#### Scenario: marcador que cambia el estado entra con la fecha de Zoho — ROJO
- GIVEN `T-201` con un marcador `{ estado_previo: 'Pendiente', estado_destino: 'En Proceso', regla: 'pendiente-servicio-a-en-proceso' }`, `to_status = 'En Proceso'`, `performed_at = 2026-12-12T15:00:00Z`, y en `ticket_history` un `TicketUpdated` a «Pendiente» el `2026-10-20T14:00:00Z`
- WHEN se llama a `entradasActuales` con `T-201` en `'En Proceso'`
- THEN su entrada es `2026-10-20T14:00:00Z`, nunca `2026-12-12T15:00:00Z`

#### Scenario: sin fecha de Zoho, sin entrada — ROJO
- GIVEN el mismo `T-201` sin ninguna fila en `ticket_history`
- WHEN se llama a `entradasActuales`
- THEN no hay entrada para `T-201`: ni la de la migración ni `created_time`

#### Scenario: el marcador de «Finalizado» no fecha con la migración — ROJO
- GIVEN `T-203` con un marcador `{ estado_previo: 'Entregado', estado_destino: 'Finalizado', regla: 'entregado-a-finalizado' }` y fechas de Zoho en `ticket_history` para «Entregado»
- WHEN se llama a `entradasActuales`
- THEN la entrada es la fecha de Zoho que fije el diseño, nunca el `performed_at` del marcador

#### Scenario: las demás filas no cambian — CARACTERIZACIÓN
- GIVEN un ticket sin marcador con dos transiciones reales
- WHEN se llama a `entradasActuales`
- THEN la entrada es la de la última transición, igual que antes del cambio

### RQ-TC-85 · La secuencia del reloj no toma el marcador como paso

`secuenciaDelReloj` (`apps/desk/server/db/relojSla.ts:77` en `e728808d`) **MUST NOT** tratar el marcador como un paso **[SUPUESTO S-5]**.
Con regla de identidad, la secuencia **SHALL** ser la misma que sin él: hoy el marcador de `to_status` nulo la anula
(`apps/desk/server/db/relojSla.ts:48` en `e728808d`). Con regla que cambia el estado, la entrada al destino **SHALL** llevar la fecha de
Zoho; sin ella, la secuencia **SHALL** ser `null` **[SUPUESTO S-6]**. Precisa RQ-TC-75.

#### Scenario: identidad, la misma secuencia que sin marcador — ROJO
- GIVEN `T-202` con una etapa de Zoho a `'En Espera de Repuestos'` el `2026-10-05T09:00:00Z`, un marcador de identidad y estado actual `'En Espera de Repuestos'`
- WHEN se arma su secuencia
- THEN es igual a la del mismo ticket sin marcador y no es `null`

#### Scenario: el que cambia el estado renombra con la fecha de Zoho — ROJO
- GIVEN `T-201` con estado actual `'En Proceso'`, un marcador `pendiente-servicio-a-en-proceso` y un `TicketUpdated` a «Pendiente» el `2026-10-20T14:00:00Z`
- WHEN se arma su secuencia
- THEN el último paso es `{ estado: 'En Proceso', desde: 2026-10-20T14:00:00Z }`, no `2026-12-12T15:00:00Z`

#### Scenario: sin fecha de Zoho, sin secuencia — ROJO
- GIVEN `T-201` sin fila de «Pendiente» en `ticket_history`
- WHEN se arma su secuencia
- THEN el resultado es `null`

#### Scenario: un migrado que luego cierra conserva su reloj — ROJO
- GIVEN `T-202` con marcador de identidad y una transición real posterior a `'Finalizado'`
- WHEN se calculan sus tiempos de Análisis
- THEN `slaHoras` y `totalHoras` no son `null`

### RQ-TC-86 · Un migrado en espera sigue midiéndose en la alarma de esperas

`ticketsEnEspera` (`apps/desk/server/db/esperasVencidas.ts:36`) **SHALL** medir a un ticket migrado que está en una de las
cuatro esperas (`packages/shared/src/estados.ts:151`) con su marcador de identidad, tomando de `secuenciaDelReloj` (RQ-TC-85) la
entrada con fecha de Zoho. Sin fecha de Zoho **SHALL** quedar sin dato, y **MUST NOT** salir de la alarma por tener marcador.

#### Scenario: migrado en espera con historia de Zoho — ROJO
- GIVEN `T-202` en `'En Espera de Repuestos'`, marcador de identidad y una entrada de Zoho a ese estado el `2026-10-05T09:00:00Z`
- WHEN se consultan los tickets en espera
- THEN `T-202` figura medido desde `2026-10-05T09:00:00Z`

#### Scenario: migrado en espera sin historia de Zoho — CARACTERIZACIÓN
- GIVEN `T-204` en `'En Espera de Repuestos'`, con marcador de identidad y sin fila de historia
- WHEN se consultan los tickets en espera
- THEN `T-204` queda sin dato, sin fecha inventada ni la de la migración

### RQ-TC-87 · Regresión: las lecturas ya corregidas de E-213 y E-214 siguen apartando el marcador

Los lectores que ya apartan el marcador **MUST NOT** cambiar: el informe de contrato (`apps/desk/server/db/informeContrato.ts:35`,
E-213) y los indicadores (`apps/desk/server/indicadores.ts:81`, E-214), más los lectores que no lo ven por construcción.
Precisa RQ-TC-69. El criterio del marcador **SHALL** seguir siendo `esPasoDeMigracion`.

#### Scenario: el informe de contrato no fecha con la migración — CARACTERIZACIÓN
- GIVEN `T-203` con un marcador a «Finalizado» con `performed_at = 2026-12-12T15:00:00Z`
- WHEN se compone el informe de contrato
- THEN la llegada a «Finalizado» no es `2026-12-12T15:00:00Z`; es la que fija `llegadaQueCuenta`

#### Scenario: los indicadores apartan el marcador — CARACTERIZACIÓN
- GIVEN `T-201` con un marcador y una transición real
- WHEN se calculan los indicadores
- THEN el marcador no entra como paso

#### Scenario: los lectores que no lo ven siguen igual — CARACTERIZACIÓN
- GIVEN `T-201` con marcador y las lecturas de `apps/desk/server/db/primerDerivado.ts:26`, `apps/desk/server/db/colaTaller.ts:14` y `apps/desk/server/db/fechasTicket.ts:28`
- WHEN se ejecutan
- THEN su resultado es el mismo que sin el marcador
