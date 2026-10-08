## MODIFIED Requirements

### Requirement: RQ-SR-03 · `Solicitud Soporte` se registra, sólo de soporte remoto

`Solicitud Soporte` **SHALL** registrarse en `ESTADOS` y en `CLASIFICACION_EN_ESPERA`
(`packages/shared/src/estados.ts:59-112`) con clase `sin_clasificar` (S-2, valor válido del tipo,
`:40`), y **SHALL** quedar **excluido** de `ESTADOS_SERVICIO` (`:182-190`), igual que `Verificación`
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
- THEN devuelve `sin_clasificar`
