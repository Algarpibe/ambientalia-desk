# Delta de `permissions` — `calibracion-directa` (F1C-08, `cierra: si`)

Sólo ADDED. La matriz de áreas viva (108 combinaciones: 65 prohibidas, 43 permitidas), la compuesta y el recuento cargo × área × transición se leen con RQ-PM-40 y se reescriben en el archive, a igual número de líneas.
Fuente: `decision/p15-p59-rutas`, `decision/f1c08-ov-calibracion`, `decision/f1c07-supuestos-corregidos`; M2.1 (`R08.4.md:2285-2288`).
Supuestos de la propuesta (reversibles, citados como tales): **S-1** mismo interruptor que Control de calidad; **S-2** condición (1) declarativa; **S-3** el atajo es Operativo; **S-4** el escape lo ve cualquier ticket «Calibración» en `En Proceso`; **S-8** `409` para lo que quita el interruptor; **S-9** quien ejecuta el atajo «intervino».

## ADDED Requirements

### Requirement: RQ-PM-38 · La elegibilidad la impone el servidor: interruptor, tipo y orden de venta (regla 13)

`executeTransition` **SHALL** responder `409` sin escribir nada cuando `calibracion_directa` se ofrezca a un ticket de tipo distinto de «Calibración» o sin orden de venta asignada, y cuando `falla_calibracion` se ofrezca a un tipo distinto de «Calibración» (S-4), además del `409` del interruptor apagado (S-1, S-8; `transitions-st` RQ-TS-53). Los `409` **SHALL** preceder al `403` de área en el escalón B (`transitions-st` RQ-TS-59) y distinguir la causa en el mensaje: interruptor, tipo u orden de venta. Estas guardas **SHALL** ser la única imposición: ocultar en el cliente nunca las sustituye (RQ-PM-39). Esta spec no fija la fuente de «orden de venta asignada»; la fija el diseño con las vías que leen las puertas de «una OV, un ticket».

#### Scenario: el atajo a un tipo que no es Calibración da 409 — ROJO (mutación 5)
- GIVEN el interruptor encendido y un ticket «Mantenimiento» con OV en `Ingresado`
- WHEN un usuario de Servicio Técnico ejecuta `calibracion_directa`
- THEN `409` cuyo mensaje nombra el tipo y el ticket no cambia

#### Scenario: el atajo sin orden de venta da 409 — ROJO (mutación 1)
- GIVEN el interruptor encendido y un ticket «Calibración» sin OV en `Ingresado`
- WHEN un usuario de Servicio Técnico ejecuta `calibracion_directa`
- THEN `409` cuyo mensaje nombra la orden de venta

#### Scenario: el escape a un tipo que no es Calibración da 409 — ROJO
- GIVEN el interruptor encendido y un ticket «Mantenimiento» en `En Proceso`
- WHEN se ejecuta `falla_calibracion` con descripción
- THEN `409` y el ticket no cambia

#### Scenario: los mensajes distinguen la causa — ROJO
- GIVEN el interruptor apagado, otro con tipo ajeno y otro sin OV
- WHEN se ejecuta `calibracion_directa` en cada uno
- THEN los tres `409` tienen mensajes distintos

#### Scenario: un usuario sin el área recibe el 409 antes que el 403 — ROJO por posición
- GIVEN un usuario sin área de Servicio Técnico y un ticket que incumple la condición (1)
- WHEN ejecuta `calibracion_directa`
- THEN `409`, no `403`

### Requirement: RQ-PM-39 · El cliente oculta con la misma regla pura; el servidor impone

`packages/shared` **SHALL** exportar una función pura de visibilidad, la misma que usa el servidor para decidir elegibilidad, y `TransitionPanel` (filtro de `apps/desk/src/components/TransitionPanel.tsx:56-58`) **SHALL** ocultar `calibracion_directa` con el interruptor apagado o si el ticket no es «Calibración» con orden de venta asignada, y `falla_calibracion` con el interruptor apagado o si el ticket no es «Calibración». El interruptor lo da `GET /api/permisos/control-calidad` (RQ-PM-37, sin ruta nueva); sin respuesta o con error, `activo = false`. El cliente **SHALL NOT** decidir interruptor, tipo, orden de venta ni descripción: los impone el servidor (RQ-TS-53, RQ-TS-54, RQ-TS-55, RQ-PM-38) y ocultar es comodidad probada (regla 13, punto 3). La tabla decisión a decisión, con línea del servidor, va en el diseño.

#### Scenario: la función de visibilidad — ROJO
- GIVEN la función pura
- WHEN se evalúan las dos transiciones y otra cualquiera con interruptor apagado y encendido, y con tickets de tipo Calibración con y sin OV y de otro tipo
- THEN `calibracion_directa` sólo se ve con interruptor, tipo y OV; `falla_calibracion` sólo con interruptor y tipo; las demás siempre

#### Scenario: el cliente y el servidor coinciden en cada combinación — ROJO
- GIVEN la tabla de combinaciones interruptor × tipo × OV
- WHEN se comparan la función pura y la respuesta del servidor
- THEN lo que el cliente oculta, el servidor lo rechaza con `409`, y lo que muestra, lo acepta

#### Scenario (MANUAL, de persona) · El panel con el interruptor encendido y apagado
- GIVEN un ticket «Calibración» con OV en `Ingresado` y otro en `En Proceso` en la aplicación desplegada
- WHEN se abre el panel con el interruptor apagado y luego encendido
- THEN apagado no se ven las dos transiciones; encendido se ve el atajo en el primero y la falla en el segundo. **Dueño:** Supervisión, en las pruebas en la app. **ARCHIVAR NO LO DA POR HECHO.**

### Requirement: RQ-PM-40 · Matriz de áreas: 114 combinaciones; las dos nuevas son de Servicio Técnico

Con las dos transiciones, la matriz de áreas **SHALL** pasar de 108 a 114 combinaciones (65 prohibidas y 43 permitidas antes; 69 y 45 después) y el recuento cargo × área × transición de 972 a 1.026. La matriz compuesta (cargo de lista corta) **SHALL** pasar de 108 (66 / 42) a 114 (70 / 44) [hipótesis: sin cargo de lista corta; el diseño lo mide]. Las dos son Operativas, así que los Decisionales **SHALL** seguir en 16 y `cargosQueFaltanParaDecisional` (`decisionales.ts:39-50`) **SHALL NOT** aplicarles regla. Un usuario de otra área **SHALL** recibir `403` de área, y uno de Servicio Técnico con el interruptor, tipo y OV correctos pasa.

#### Scenario: la matriz por área — ROJO
- GIVEN las dos transiciones y las áreas
- WHEN se barre la matriz de `permisos.test.ts`
- THEN 114 combinaciones: 69 prohibidas y 45 permitidas

#### Scenario: Servicio Técnico pasa, los demás reciben 403 — ROJO
- GIVEN el interruptor encendido, un ticket elegible y usuarios de cada área
- WHEN cada uno ejecuta `calibracion_directa`
- THEN sólo Servicio Técnico (y quien por regla ya cubra el área) pasa; los demás `403`

#### Scenario: no son Decisionales — ROJO
- GIVEN el barrido de `CATALOGO_POR_FLUJO` y `DECISIONALES_POR_CARGO` encendido
- WHEN se evalúa la regla por cargo para las dos
- THEN `null` y los Decisionales siguen en 16

#### Scenario: el recuento compuesto y cargo × área × transición — ROJO
- GIVEN el barrido compuesto y el de cargo × área × transición
- WHEN se cuentan
- THEN 114 (70 / 44, a medir) y 1.026

### Requirement: RQ-PM-41 · Quien ejecuta el atajo «intervino» a efectos de la firma del Control de calidad (S-9)

`calibracion_directa` es Operativa, así que su autor **SHALL** contar como quien intervino según RQ-PM-33 (S-9; `controlCalidad.ts:38-43`): el atajo **SHALL NOT** abrir una vía para que quien lo ejecutó firme después `aprobacion_control_calidad` ni `rechazo_control_calidad`, y `falla_calibracion`, también Operativa, **SHALL** contar igual. La regla es consecuencia de `tipoEventoDeTransicion` y **SHALL NOT** introducir excepción ni código nuevo en la regla de firma; RQ-PM-34 aplica sin cambios al administrador. Es un supuesto, no una decisión cerrada.

#### Scenario: quien ejecutó el atajo no firma — ROJO
- GIVEN un Coordinador autor de la fila `calibracion_directa` y un ticket en `Control de calidad`
- WHEN aprueba
- THEN `403` cuyo mensaje dice que intervino

#### Scenario: quien ejecutó el escape tampoco firma — ROJO
- GIVEN un Coordinador autor de la fila `falla_calibracion` en el mismo ticket
- WHEN rechaza
- THEN `403` cuyo mensaje dice que intervino

#### Scenario: otro habilitado que no intervino firma — ROJO
- GIVEN el ticket del atajo y otro Coordinador activo sin filas Operativas
- WHEN aprueba con las tres casillas
- THEN pasa a `Por Facturar`

#### Scenario: el administrador que ejecutó el atajo tampoco firma — ROJO
- GIVEN un administrador autor de la fila `calibracion_directa` y ningún habilitado libre
- WHEN aprueba con motivo
- THEN `403` (S-4 de F1C-07)
