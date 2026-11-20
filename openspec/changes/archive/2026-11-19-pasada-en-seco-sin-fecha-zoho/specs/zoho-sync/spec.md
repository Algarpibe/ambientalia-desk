# Delta de zoho-sync — `pasada-en-seco-sin-fecha-zoho`

Sólo `ADDED`, al final de la spec viva, a continuación de RQ-ZS-67 (`openspec/specs/zoho-sync/spec.md:3184`). Amplía el informe del ejecutor de RQ-ZS-17 (`openspec/specs/zoho-sync/spec.md:812`). Fuente: la pregunta `s11-migrados-sin-fecha-de-zoho` y `openspec/changes/pasada-en-seco-sin-fecha-zoho/proposal.md`.

## ADDED Requirements

### Requirement: RQ-ZS-68 · El informe de la migración cuenta los migrados que quedarían sin fecha de Zoho (S-11), por regla y con sus números

El informe del ejecutor (`InformeMigracion`, `apps/desk/server/db/migracionTicketsAbiertos.ts:18-26` en `d2a735a4`) **SHALL** llevar el campo `sinFechaDeZoho` con la forma `{ tickets: number; porRegla: { regla: ReglaEquivalencia; tickets: number; numeros: number[] }[] }` **[SUPUESTO S-1]**. Cuenta los tickets a migrar cuyo marcador cambia el estado y deja la secuencia del reloj sin origen por S-11 (`packages/shared/src/marcadorMigracion.ts:58`, `packages/shared/src/marcadorMigracion.ts:69`).

- Entra **sólo** un plan con `accion === 'migrar'` cuyo marcador cambia el estado y cuya `entradaDelMarcador` da `desde` nulo. `porRegla` lleva UNA entrada por cada regla cuyo marcador cambia el estado entre los migrables, en el orden de primera aparición (los planes vienen por número), con `tickets: 0` y `numeros: []` si todos tienen fecha; `tickets` es la suma.
- **MUST NOT** entrar ni figurar: la identidad ni el «Pendiente» de soporte remoto (destino igual al origen, sin entrada), un ticket ya gobernado, uno creado tras el corte, un «Pendiente» de servicio con entrada a «Pendiente» en la historia de Zoho, ni un «Entregado» con `closed_time`.
- «Entregado» → «Finalizado» **SHALL** contarse aparte, con la misma noción, y no remitirse a `cierres.conFechaDeMigracion`: `cierres` da sólo la cifra (`packages/shared/src/migracionTickets.ts:131`) y el campo da además los números **[SUPUESTO S-2]**.
- Sin migrables: `{ tickets: 0, porRegla: [] }`.

Lo prueban P1, P6 y P7, y las unitarias de la regla pura.

#### Scenario: fixture de la propuesta, números literales — ROJO
- GIVEN el corte `2026-12-01T05:00:00Z` y los tickets 4100 «Entregado» sin `closed_time`, 4200 «Entregado» con `closed_time`, 4300 «Pendiente» de servicio sin entrada a «Pendiente» en Zoho, 4400 el mismo con un `TicketUpdated` hacia «Pendiente», 4500 en identidad, 4600 «Pendiente» de soporte remoto, 4700 «Pendiente» de servicio con `managed_by_app = true` y 4800 «Pendiente» de servicio creado tras el corte
- WHEN se pide la pasada en seco
- THEN `sinFechaDeZoho` es `{ tickets: 2, porRegla: [{ regla: 'entregado-a-finalizado', tickets: 1, numeros: [4100] }, { regla: 'pendiente-servicio-a-en-proceso', tickets: 1, numeros: [4300] }] }`, y no figuran 4200, 4400, 4500, 4600, 4700 ni 4800

#### Scenario: sin migrables — ROJO
- GIVEN una base cuyos abiertos no tienen ningún plan `migrar`
- WHEN se pide la pasada en seco
- THEN `sinFechaDeZoho` es `{ tickets: 0, porRegla: [] }`

#### Scenario: una regla con todos fechados figura a cero — ROJO
- GIVEN sólo los tickets 4200 y 4400 del fixture como migrables
- WHEN se pide la pasada en seco
- THEN `sinFechaDeZoho` es `{ tickets: 0, porRegla: [{ regla: 'entregado-a-finalizado', tickets: 0, numeros: [] }, { regla: 'pendiente-servicio-a-en-proceso', tickets: 0, numeros: [] }] }`

#### Scenario: el resto del informe no cambia — CARACTERIZACIÓN
- GIVEN el fixture de arriba
- WHEN se pide la pasada en seco
- THEN `cierres` sigue siendo `{ conFechaDeZoho: 1, conFechaDeMigracion: 1 }` y `negativa` es `null`

### Requirement: RQ-ZS-69 · Una sola noción y una sola lectura de la historia de Zoho

La cifra **SHALL** salir de `entradaDelMarcador` (`packages/shared/src/marcadorMigracion.ts:42-52`), la única noción de «entrada con fecha de Zoho» (`packages/shared/src/marcadorMigracion.ts:10-11`), aplicada a la fila que escribiría el ejecutor (`apps/desk/server/db/migracionTicketsAbiertos.ts:71-91`) y a la historia leída por la MISMA función que usa `conFechaDeZoho` (`apps/desk/server/db/sla.ts:132-146` en `d2a735a4`), exportada al final de `apps/desk/server/db/sla.ts`. **MUST NOT** haber una segunda consulta a `ticket_history` ni una segunda noción de «sin fecha» (p. ej. `closedTime` nulo). La regla pura vive en `packages/shared` (regla invariable 13) y `resolverMarcador` (`packages/shared/src/marcadorMigracion.ts:60-73`) **MUST NOT** cambiar: medir no es corregir. El bucle de escritura no se refactoriza y la coincidencia de la fila simulada con la real la fija una prueba **[SUPUESTO S-4]**. La historia se lee sólo de los migrables **[SUPUESTO S-6]**.

Lo prueban P2, P4, M5 y M8, y las pruebas existentes de `apps/desk/server/migracionMarcadorLectores.test.ts`.

#### Scenario: «entregado-a-finalizado» coincide con `cierres.conFechaDeMigracion` — ROJO
- GIVEN el fixture de RQ-ZS-68
- WHEN se enfrentan la entrada de «entregado-a-finalizado» de `sinFechaDeZoho` y `cierres.conFechaDeMigracion` del mismo informe
- THEN ambas valen 1, y los números de la primera son los de los tickets «Entregado» sin `closed_time`

#### Scenario: la predicción en seco es la realidad tras aplicar — ROJO
- GIVEN el informe en seco del fixture, y después la misma base aplicada con `aplicar=true`
- WHEN se aplica `entradaDelMarcador` a los marcadores reales de `ticket_transitions` con la historia real
- THEN los tickets con `desde` nulo son exactamente los números que el informe en seco previo dio en `sinFechaDeZoho`

#### Scenario: un «Pendiente» con entrada en Zoho no se cuenta — ROJO
- GIVEN el ticket 4400, con un `TicketUpdated` «X» → «Pendiente» en `ticket_history`
- WHEN se calcula `sinFechaDeZoho`
- THEN 4400 no figura, porque la historia se lee por la misma función que `conFechaDeZoho`

#### Scenario: `conFechaDeZoho` da lo mismo que antes — CARACTERIZACIÓN
- GIVEN en `ticket_transitions` un marcador que cambia el estado con fecha de Zoho, otro sin ella y uno de identidad
- WHEN `entradasActuales`, su único llamador (`apps/desk/server/db/sla.ts:93`), lee las entradas de esos tickets
- THEN el primero entra con su fecha de Zoho y los otros dos no dan entrada, como antes de sacar la lectura; y sin marcadores no se consulta `ticket_history`

### Requirement: RQ-ZS-70 · En seco no escribe ni abre transacción; con `aplicar=true` el campo se calcula antes del primer `INSERT`, también con negativa

En seco el campo **SHALL** calcularse sobre `db` sin `BEGIN` ni escritura alguna (`apps/desk/server/db/migracionTicketsAbiertos.ts:15`; `apps/desk/server/db/migracionTicketsAbiertos.ts:67` en `d2a735a4`). Con `aplicar=true` el informe **SHALL** llevar el mismo campo, calculado dentro de la transacción y ANTES del primer `INSERT INTO ticket_transitions` (`apps/desk/server/db/migracionTicketsAbiertos.ts:69` en `d2a735a4`), y también cuando hay negativa. El campo **MUST NOT** cambiar `negativa`, `aplicado` ni `avisos`, ni bloquear la aplicación **[SUPUESTO S-5]**. La cifra vale en el instante de la pasada; cuenta la pasada en seco inmediatamente anterior a aplicar **[SUPUESTO S-7]**.

Lo prueban P1, P3, P5 y M6 (posición: el campo tras el bucle pone roja P3).

#### Scenario: en seco, sin transacción ni escritura — ROJO
- GIVEN el fixture de RQ-ZS-68 y un espía sobre las sentencias
- WHEN corre la pasada sin `aplicar`
- THEN el informe trae el campo del ejemplo y el espía no ve `BEGIN`, `INSERT` ni `UPDATE`

#### Scenario: con `aplicar=true`, mismo campo y lectura antes del primer `INSERT` — ROJO
- GIVEN el fixture, `aplicar=true` y el espía
- WHEN corre la migración
- THEN el informe trae el mismo `sinFechaDeZoho` que en seco, `aplicado` es `true`, y la consulta a `ticket_history` precede al primer `INSERT INTO ticket_transitions`

#### Scenario: con negativa devuelve el campo y no escribe — ROJO
- GIVEN un ticket abierto con un estado sin equivalencia y `aplicar=true`
- WHEN corre la migración
- THEN el informe trae `sinFechaDeZoho` y `negativa` no nula, `aplicado` es `false` y no hubo `INSERT`

#### Scenario: `negativa`, `aplicado` y `avisos` no cambian — CARACTERIZACIÓN
- GIVEN el fixture sin estados sin equivalencia
- WHEN corre la pasada en seco
- THEN `negativa` es `null`, `aplicado` es `false` y `avisos` es el de siempre (la copia previa y la sincronización completa), sin ninguna línea por el campo

### Requirement: RQ-ZS-71 · `DEPLOY.md` §14 nombra `sinFechaDeZoho` en la viñeta de la pasada en seco, y una guarda lo exige

La viñeta de la pasada en seco de `DEPLOY.md` §14 (`DEPLOY.md:672`, `DEPLOY.md:673` en `d2a735a4`) **SHALL** nombrar `sinFechaDeZoho` al final de una línea existente, sin insertar ni mover líneas del fichero, y decir qué cuenta, que no impide aplicar y que es el dato de la pregunta `s11-migrados-sin-fecha-de-zoho`. Una prueba nueva **SHALL** exigir ese nombre en esa viñeta. La tanda **MUST NOT** añadir interruptor, variable de entorno, migración de esquema ni cambio de cliente: el campo no enciende ningún escritor. S-11 no cambia (`packages/shared/src/marcadorMigracion.ts:60-73`).

Lo prueban P8 y M7 (ensuciar el fichero vigilado, quitando el nombre).

#### Scenario: la viñeta nombra el campo — ROJO
- GIVEN `DEPLOY.md` leído como texto
- WHEN la guarda busca `sinFechaDeZoho` en la viñeta «Una pasada en seco» de §14
- THEN lo encuentra dentro de esa viñeta, y no en otra sección

#### Scenario: sin el nombre la guarda se pone roja — ROJO
- GIVEN `DEPLOY.md` con `sinFechaDeZoho` quitado de la viñeta
- WHEN corre la guarda
- THEN falla

#### Scenario: S-11 y el entorno no cambian — CARACTERIZACIÓN
- GIVEN un marcador que cambia el estado y no tiene fecha de Zoho
- WHEN corre `resolverMarcador`
- THEN devuelve `null`, como hoy; y `.env.example` y `schema.sql` no ganan ninguna entrada por esta tanda
