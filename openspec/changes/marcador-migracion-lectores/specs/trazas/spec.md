# Delta de trazas — `marcador-migracion-lectores`

Fuente: `decision/marcador-migracion-en-pantallas` (`openspec/config.yaml:6766-6784`) y `decision/h1-fechas-migrados`
(`openspec/config.yaml:4863-4881`). Sólo `ADDED`, a continuación de RQ-TZ-25. El **marcador** es toda fila de
`ticket_transitions` con `transition_id = 'migracion_f1f01_abiertos'` (`packages/shared/src/migracionTickets.ts:14`).

## ADDED Requirements

### RQ-TZ-26 · El historial enseña el marcador de la migración con texto en español, sin claves técnicas

El historial (`apps/desk/server/db/historial.ts:137` en `e728808d`) **SHALL** devolver el marcador como un evento propio, con
título en español **[SUPUESTO S-1]** y **sin** el prefijo «Transición:». El evento **SHALL** llevar: el estado en Zoho
(`estado_previo`), el estado en Desk (`estado_destino`), la regla traducida al español, el corte y quién la ejecutó
(`ejecutado_por`). **MUST NOT** enseñar `status_type_previo` ni `managed_by_app_previo`, y ninguna etiqueta **MUST** ser una
clave de `values` en crudo. El evento **SHALL** conservar `eventName` (el cliente no cambia). La regla y su texto **SHALL**
vivir en `packages/shared`, pura. Las demás filas del historial **MUST NOT** cambiar. La fila **SHALL** seguir en la base.

#### Scenario: marcador con regla que cambia el estado — ROJO
- GIVEN el ticket `T-201` con un marcador `{ estado_previo: 'Pendiente', estado_destino: 'En Proceso', regla: 'pendiente-servicio-a-en-proceso', corte: '2026-12-12T00:00:00.000Z', ejecutado_por: 'Migración F1F-01', status_type_previo: 'Open', managed_by_app_previo: false }`
- WHEN se compone su historial
- THEN el evento del marcador no empieza por «Transición:», nombra «Pendiente», «En Proceso», el corte y «Migración F1F-01»
- AND la regla sale como texto en español, no como `pendiente-servicio-a-en-proceso`
- AND ninguna etiqueta del evento es `regla`, `estado_previo`, `estado_destino`, `status_type_previo` ni `managed_by_app_previo`

#### Scenario: marcador de identidad, con destino nulo — ROJO
- GIVEN el ticket `T-202` con un marcador de `regla: 'identidad'`, `to_status` nulo, `estado_previo` y `estado_destino` `'En Espera de Repuestos'`
- WHEN se compone su historial
- THEN el evento sale con el mismo texto en español y el mismo estado en Zoho y en Desk, sin lanzar

#### Scenario: el evento conserva `eventName` — CARACTERIZACIÓN
- GIVEN el marcador de `T-201`
- WHEN se compone su historial
- THEN el evento lleva `eventName` y las pruebas de `apps/desk/server/db/traspaso.test.ts:139-144` y
  `apps/desk/server/db/historialTipoEvento.test.ts:31-36` en `e728808d` siguen valiendo sin tocarlas

### RQ-TZ-27 · El hilo de conversación no enseña el marcador de la migración

El relato de conversación (`apps/desk/server/db/conversacion.ts:140` en `e728808d`) **MUST NOT** incluir el marcador, tenga
`to_status` nulo o relleno **[SUPUESTO S-2]**. Ocultar no es borrar: la fila **SHALL** seguir en `ticket_transitions`. Las
transiciones reales y las demás entradas (creación, remisiones, conversaciones de Zoho de RQ-TZ-25) **MUST NOT** cambiar. Precisa RQ-TZ-25.

#### Scenario: marcador de identidad oculto — ROJO
- GIVEN el ticket `T-202` con un marcador de `to_status` nulo y una transición real «Habilitar Servicio» con comentario
- WHEN se compone su hilo
- THEN sale la transición con su comentario y no sale ninguna entrada del marcador

#### Scenario: marcador con destino relleno oculto — ROJO
- GIVEN el ticket `T-201` con el marcador de `to_status = 'En Proceso'`
- WHEN se compone su hilo
- THEN no sale ninguna entrada del marcador, ni con sus claves de `values`
- AND la fila sigue en la base

### RQ-TZ-28 · El marcador se reconoce con una sola función, `esPasoDeMigracion`

Fuera de pruebas, **ningún** lector en TypeScript **MUST** comparar `transition_id` con `ID_TRANSICION_MIGRACION` ni con su
literal: **SHALL** usar `esPasoDeMigracion` (`packages/shared/src/cierreEnCifras.ts:19`) **[SUPUESTO S-9]**. El traspaso
(`apps/desk/server/db/traspaso.ts:26` en `e728808d`) **SHALL** apartar el marcador con esa función y con la **misma conducta**
de hoy. Se quedan el filtro SQL de `apps/desk/server/db/cierresDeMigracion.ts:10` y la escritura de
`apps/desk/server/db/migracionTicketsAbiertos.ts:81` en `e728808d`. Regla invariable 13, punto 1.

#### Scenario: ninguna comparación propia fuera de `esPasoDeMigracion` — ROJO
- GIVEN los ficheros `.ts` y `.tsx` del repositorio sin los `*.test.ts`
- WHEN se buscan comparaciones con `ID_TRANSICION_MIGRACION` o con `'migracion_f1f01_abiertos'`
- THEN las únicas son la definición, `esPasoDeMigracion` y la escritura; `apps/desk/server/db/traspaso.ts` no figura

#### Scenario: el traspaso sigue apartando el marcador — CARACTERIZACIÓN
- GIVEN un historial con el marcador de `T-201` y una transición real
- WHEN se calcula el traspaso
- THEN el marcador no entra y la transición real sí, igual que antes del cambio
