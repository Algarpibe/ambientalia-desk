# Delta para transitions-soporte-remoto

## MODIFIED Requirements

### Requirement: RQ-SR-03 · `Solicitud Soporte` se registra, sólo de soporte remoto

`Solicitud Soporte` **SHALL** registrarse en `ESTADOS` y en `CLASIFICACION_EN_ESPERA`
(`packages/shared/src/estados.ts:59-112`) con clase `ninguna` (`decision/e226-espera-y-areas-equipo-nuevo`, supuesto del
analista: nacimiento y cola propia; era `sin_clasificar`, S-2), y **SHALL** quedar **excluido** de `ESTADOS_SERVICIO` (`:182-190`), igual que `Verificación`
lo está por ser sólo de equipo nuevo. La unión de los estados derivados de `from`/`to` de los tres
catálogos **SHALL** ser exactamente `ESTADOS`.

- `Finalizado` **SHALL** seguir siendo el **único** estado sin salida de la unión de los tres catálogos:
  `sinSalida = ['Finalizado']` exactamente (`packages/shared/src/invariantesGrafo.test.ts`).
- El tablero **SHALL** tener columna propia `solicitud_soporte` para `Solicitud Soporte`, inmediatamente
  después de `ticket_creado` (`columns.ts:15`), por `decision/e225-columna-propia-dos-estados`.

#### Scenario: La unión de los tres catálogos deriva exactamente ESTADOS
- GIVEN `TRANSITIONS`, `TRANSITIONS_EQUIPO_NUEVO` y el catálogo de soporte remoto
- WHEN se calculan los estados de sus `from`/`to`
- THEN el conjunto es exactamente `ESTADOS`, con `Solicitud Soporte` dentro

#### Scenario: Solicitud Soporte no es un estado de servicio
- GIVEN `ESTADOS_SERVICIO`
- WHEN se comprueba si contiene `Solicitud Soporte`
- THEN no lo contiene, y sí contiene `Solicitud Soporte` la lista de estados sólo de soporte remoto

#### Scenario: Finalizado sigue siendo el único sin salida
- GIVEN la unión de los tres catálogos
- WHEN se calcula `sinSalida`
- THEN es exactamente `['Finalizado']`

#### Scenario: Quitar `Ejecutar` deja a `Finalizado` sin entrada de soporte remoto (mutación)
- GIVEN la prueba de pares que fija las entradas y salidas del catálogo
- WHEN se borra `Ejecutar` del catálogo
- THEN esa prueba falla, aunque `sinSalida` siga en `['Finalizado']` (el invariante no distingue una
  entrada retirada)

#### Scenario: Clase de espera de Solicitud Soporte
- GIVEN el registro `CLASIFICACION_EN_ESPERA`
- WHEN se consulta `Solicitud Soporte`
- THEN devuelve `ninguna`, y el tablero la enseña en «Abiertos»

### Requirement: RQ-SR-12 · `Pendiente` es estado sólo de soporte remoto

La lista de estados sólo de soporte remoto (`ESTADOS_SOLO_SOPORTE_REMOTO`) **SHALL** ser exactamente
`Solicitud Soporte` y `Pendiente`. `Pendiente` **SHALL** seguir en `ESTADOS` y en `CLASIFICACION_EN_ESPERA`
con clase `externa` (`decision/e226-espera-y-areas-equipo-nuevo`: «Pendiente: espera (sólo tickets antiguos)»; era
`sin_clasificar`), y **SHALL** quedar excluido de `ESTADOS_SERVICIO`. El bucle
`En Proceso ↔ Pendiente` de `RQ-SR-01` **SHALL** funcionar sin cambio, y los cuatro estados del catálogo de
`Soporte remoto` **SHALL** seguir siendo `Solicitud Soporte`, `En Proceso`, `Pendiente` y `Finalizado`. La
prueba de estados sólo de soporte remoto (`invariantesGrafo.test.ts`) **SHALL** fijar la lista de dos.

#### Scenario: la lista sólo-SR tiene exactamente dos estados
- GIVEN `ESTADOS_SOLO_SOPORTE_REMOTO` tras el cambio
- WHEN se lee
- THEN es exactamente `['Solicitud Soporte', 'Pendiente']` (en el orden que fija el registro)

#### Scenario: `Pendiente` no está en el catálogo de servicio
- GIVEN `ESTADOS_SERVICIO` y `TRANSITIONS`
- WHEN se busca `Pendiente` como `from`, `to` o miembro
- THEN no aparece, y el catálogo de `Soporte remoto` sigue cubriendo sus cuatro estados

#### Scenario: un `Soporte remoto` heredado en `Pendiente` sigue en su flujo
- GIVEN un ticket `Soporte remoto` en `Pendiente`
- WHEN se listan sus transiciones ejecutables
- THEN es exactamente `Continuación soporte` y el flujo aplicable es `soporte-remoto`

#### Scenario: un ticket en `Pendiente` se enseña en «Espera»
- GIVEN un ticket abierto en `Pendiente`
- WHEN el tablero calcula «Abiertos» y «Espera»
- THEN sale en «Espera» y no en «Abiertos»
