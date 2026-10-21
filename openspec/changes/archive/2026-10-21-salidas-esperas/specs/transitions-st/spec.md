# Delta de `transitions-st` — `salidas-esperas` (F1C-03, `cierra: si`)

ADDED salvo RQ-TS-56, que se MODIFICA con el requisito completo en las mismas 18 líneas del bloque vivo (`spec.md:3215-3232`), para no desplazar citas al archivar. Las cifras vivas (RQ-TS-58, RQ-TS-05/06/26/27/44/50) se leen con RQ-TS-62 y se reescriben en el archive, a igual número de líneas.
Fuente: `decision/c3-salida-esperas` (`openspec/config.yaml:1828-1847`), `medicion/p90-esperas-2026-10-21`; M1.3.4 (`R08.4.md:1297-1342`). Supuestos de la propuesta (reversibles): **S-8** tipos de evento; **S-9** sin botón genérico; **S-11** `Por Facturar` sin `Control de calidad`.

## MODIFIED Requirements

### RQ-TS-56 · Condición (3) como propiedad del grafo: el trabajo terminado pasa por Control de calidad

La condición (3) se lee como «el trabajo terminado pasa por Control de calidad» (S-14, supuesto reversible). Con `CONTROL_CALIDAD_LIBERACION` y `SALIDAS_ESPERAS` encendidos, las únicas entradas a `Por Facturar` alcanzables desde `En Proceso` sin pasar por `Control de calidad` **SHALL** ser cuatro, todas Decisionales sin reparación que liberar: `rechazo_comercial`, `rechazo_cliente`, `rechazo_revision` y `cobro_diagnostico_espera` (S-11 de `salidas-esperas`: desde `En Espera de Repuestos` y `Servicio externo`, que se alcanzan por `solicitud_repuestos` y `cal_sensores_proceso` sin cruzar `Control de calidad`). Es propiedad calculada sobre el catálogo real, en una prueba junto a `invariantesGrafo.test.ts`, que **SHALL** ponerse en rojo si se ensucia el catálogo: un atajo con destino `Por Facturar`, una salida de `Solicitado` o de la espera de SKU a `Por Facturar`, o el interruptor que deja de quitar `finalizacion_servicio`. Con `SALIDAS_ESPERAS` apagado el conjunto es el de F1C-08 (tres). Con el interruptor encendido `finalizacion_servicio` sigue dando `409` (RQ-TS-47).

#### Scenario: el atajo lleva a `Por Facturar` sólo por Control de calidad — ROJO
- GIVEN los dos interruptores encendidos y un ticket «Calibración» con OV en `Ingresado`
- WHEN recorre `calibracion_directa`, `envio_control_calidad` y `aprobacion_control_calidad`
- THEN llega a `Por Facturar`; y `finalizacion_servicio` desde `En Proceso` da `409`

#### Scenario: las entradas sin Control de calidad son cuatro — ROJO
- GIVEN el catálogo real con `SALIDAS_ESPERAS` encendido; y el mismo con ella apagada
- WHEN se calculan las transiciones a `Por Facturar` alcanzables desde `En Proceso` sin entrar en `Control de calidad`
- THEN encendido son `rechazo_comercial`, `rechazo_cliente`, `rechazo_revision` y `cobro_diagnostico_espera`, las cuatro Decisionales; apagado, las tres de F1C-08 (`cobro_diagnostico_espera` da `409` y no cuenta)

#### Scenario: ensuciar el catálogo pone la propiedad en rojo — ROJO (mutación 3 y 5)
- GIVEN el catálogo con un atajo de prueba a `Por Facturar`, o con `Solicitado` o la espera de SKU con salida a `Por Facturar`
- WHEN corre la propiedad
- THEN el conjunto gana una id y la prueba falla; sin esa transición pasa

## ADDED Requirements

### Requirement: RQ-TS-60 · Dos salidas nuevas: `cobro_diagnostico_espera` y `sin_pieza_en_almacen`

Sólo se añade; nada existente cambia ni se reordena, y `anulacion` desde `En Espera de Repuestos` y `Servicio externo` sigue en el catálogo. No se crea ningún estado.

| id | Nombre | De → a | Área | Tipo (S-8) | Campos |
|---|---|---|---|---|---|
| `cobro_diagnostico_espera` | Cobro de diagnóstico | `En Espera de Repuestos`, `Servicio externo` → `Por Facturar` | Comercial | Decisional | comentario opcional y «Motivo del cobro de diagnóstico», texto obligatorio (`decision/f1c03-quien-ejecuta-salidas`; `packages/shared/src/transitions.ts:262`) |
| `sin_pieza_en_almacen` | Sin pieza en almacén | `Solicitado` → `En Espera de Repuestos` | Servicio Técnico | Compras / Logístico | comentario opcional |

#### Scenario: tipos, áreas, recorridos y campos — ROJO
- GIVEN el catálogo de servicio
- WHEN se consultan los dos ids
- THEN tienen área, tipo, `from`, `to` y campos de la tabla; el único obligatorio es el motivo del cobro (`packages/shared/src/salidasEsperas.test.ts:20`, `:28`)

#### Scenario: `cobro_diagnostico_espera` es Decisional — ROJO
- GIVEN `tipoEventoDeTransicion`
- WHEN se resuelve `cobro_diagnostico_espera`
- THEN `Decisional`; `sin_pieza_en_almacen` da `Compras / Logístico`

#### Scenario: las salidas de hoy no cambian — CARACTERIZACIÓN
- GIVEN `anulacion`, `llegada_repuestos`, `retorno_servicio_externo`, `entrega_repuestos` y `notif_cliente_sku`
- WHEN se comparan con el catálogo anterior
- THEN origen, destino, área, tipo y campos son idénticos

### Requirement: RQ-TS-61 · El interruptor `SALIDAS_ESPERAS` nace cerrado; apagado, el flujo es el de hoy

`SALIDAS_ESPERAS` **SHALL** valer `true` sólo con `=== 'true'` (`packages/zoho-sync/src/config.ts`). Apagado, `executeTransition` **SHALL** responder `409` a `cobro_diagnostico_espera` y `sin_pieza_en_almacen` sin escribir nada, una función pura de `packages/shared` **SHALL** quitarlas del panel (molde `visibleConControlCalidad`, `packages/shared/src/controlCalidad.ts:103-111`) y la alarma de `derivacion-avisos` RQ-AV-26 **SHALL NOT** correr. Apagado, `anulacion` desde ER/SE sigue con la regla de hoy (`permissions` RQ-PM-43). Es independiente de `CONTROL_CALIDAD_LIBERACION` y de `DECISIONALES_POR_CARGO`.

#### Scenario: apagado, D1 da 409 — ROJO
- GIVEN el interruptor sin `true` y un ticket en `Servicio externo`
- WHEN un usuario de Comercial ejecuta `cobro_diagnostico_espera`
- THEN `409` cuyo mensaje nombra el interruptor y el ticket no cambia

#### Scenario: apagado, D2 da 409 — ROJO
- GIVEN el interruptor apagado y un ticket en `Solicitado`
- WHEN un usuario de Servicio Técnico ejecuta `sin_pieza_en_almacen`
- THEN `409` y el ticket no cambia

#### Scenario: apagado, el panel no las ofrece — ROJO
- GIVEN la función de visibilidad con el interruptor apagado y con cualquier valor distinto de `'true'`
- WHEN se evalúan las dos y otra cualquiera
- THEN las dos se ocultan; la otra siempre se ve

#### Scenario: encendido pasan — ROJO
- GIVEN el interruptor encendido, el Director Comercial o el administrador para el cobro y un usuario de Servicio Técnico para `sin_pieza_en_almacen` (`permissions` RQ-PM-42)
- WHEN ejecuta `cobro_diagnostico_espera`, con su motivo, o `sin_pieza_en_almacen`
- THEN `200`, el ticket llega a `Por Facturar` o a `En Espera de Repuestos` y queda una fila en `ticket_transitions` (`apps/desk/server/salidasEsperas.test.ts:75`, `:83`, `:118`, `:241`)

### Requirement: RQ-TS-62 · Cifras: servicio 40 transiciones, 23 estados, 49 pasos

Con las dos, el catálogo de servicio **SHALL** pasar de 38 a 40 transiciones y el mapa de 46 a 49 pasos (`cobro_diagnostico_espera` sale de dos estados); los estados quedan en 23. Los vigilantes de tipos de evento, matrices de permisos, salidas únicas y derivación por defecto **SHALL** moverse con los mismos ficheros que movió F1C-08; la lista exacta con sus cifras la fija el diseño contra el árbol (hipótesis).

#### Scenario: las cifras del catálogo — ROJO
- GIVEN el catálogo de servicio y el mapa del blueprint regenerado
- WHEN se cuentan
- THEN 40 transiciones, 23 estados y 49 pasos

#### Scenario: la derivación por defecto no cambia — ROJO
- GIVEN la tabla de derivación por defecto
- WHEN se consultan las dos nuevas
- THEN ninguna propone persona; heredan

### Requirement: RQ-TS-63 · `Solicitado` y la espera de SKU no se abandonan ni se anulan (invariantes de c3)

`Solicitado` **SHALL** tener como únicas salidas `entrega_repuestos` y `sin_pieza_en_almacen`; `En espera de SKU inventario` **SHALL** tener como única salida `notif_cliente_sku`. Ninguna de las dos **SHALL** tener transición a `Anulado` ni a `Por Facturar`, con o sin interruptor (`decision/c3-salida-esperas`). La propiedad se calcula sobre el catálogo real, junto a `invariantesGrafo.test.ts`.

#### Scenario: las salidas de `Solicitado` y SKU — ROJO
- GIVEN el catálogo real con y sin interruptor
- WHEN se listan las transiciones con origen `Solicitado` y con origen `En espera de SKU inventario`
- THEN `{entrega_repuestos, sin_pieza_en_almacen}` (la segunda sólo encendido) y `{notif_cliente_sku}`; ninguna con destino `Anulado` ni `Por Facturar`

#### Scenario: ensuciar el catálogo lo pone en rojo — ROJO (mutación 5)
- GIVEN el catálogo con `anulacion` también desde `Solicitado`, o `cobro_diagnostico_espera` también desde la espera de SKU
- WHEN corre la propiedad
- THEN la prueba falla; sin esa arista pasa

### Requirement: RQ-TS-64 · Orden de las guardas nuevas, fijado por pruebas de posición

Orden (A < B < C < D, RQ-TS-06, F1B-10): `409` de estado (A/B); `409` de `SALIDAS_ESPERAS` (B, junto al de Control de calidad, `ticketService.ts:128`); `403` de área (B, `:129-130`); `403` del ejecutor (B, tras la lista corta y antes de Decisionales por cargo, a la que sustituye para estos orígenes, `:131`, `permissions` RQ-PM-43); `422` del «Motivo del cobro de diagnóstico» ausente o en blanco (C, en el agregado de `:134`, antes de la persona derivada; corregido por `decision/f1c03-quien-ejecuta-salidas`). Las posiciones exactas las fija el diseño. Cada posición **MUST** tener una prueba que active DOS guardas a la vez y se ponga roja si se mueve (regla de mutación 1).

#### Scenario: SE-1 el 409 del interruptor gana al 403 de área — ROJO por posición
- GIVEN el interruptor apagado y un usuario sin el área de Comercial
- WHEN ejecuta `cobro_diagnostico_espera`
- THEN `409`, no `403`

#### Scenario: SE-2 el 403 de área gana al 403 del ejecutor — ROJO por posición
- GIVEN el interruptor encendido y un usuario de Servicio Técnico sin cargo (`apps/desk/server/salidasEsperas.test.ts:255`)
- WHEN ejecuta `cobro_diagnostico_espera` desde `Servicio externo`
- THEN `403` cuyo mensaje es el de área, no el del ejecutor

#### Scenario: SE-3 el 403 del ejecutor gana al 422 del motivo — ROJO por posición
- GIVEN el interruptor encendido, un Comercial sin cargo y el «Motivo» de anulación ausente o el del cobro en blanco (`apps/desk/server/salidasEsperas.test.ts:273`)
- WHEN ejecuta `anulacion` o `cobro_diagnostico_espera` desde `Servicio externo`
- THEN `403`, no `422`

#### Scenario: SE-4 el 422 del motivo llega cuando las demás pasan — ROJO
- GIVEN el interruptor encendido y el Director Comercial (`apps/desk/server/salidasEsperas.test.ts:174`)
- WHEN ejecuta `cobro_diagnostico_espera` sin motivo o con el motivo en blanco
- THEN `422` y el ticket no cambia
