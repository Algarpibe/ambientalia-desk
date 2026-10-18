# Delta para tickets-core

## ADDED Requirements

### Requirement: RQ-TC-71 · Los anulados no cuentan en las tres métricas de servicios cumplidos

Fuente: `decision/c2-anulado`, consecuencia (5); maestro M1.10 (`R08.4.md:2130-2136`, `:2152`). Las tres métricas son
servicios finalizados, tiempo promedio de servicio y cumplimiento (OTD), y salen de una sola condición de
`computeAnalisis` (`packages/shared/src/analisis.ts:59`).

Un ticket en `Anulado` **MUST NOT** contar en ninguna de las tres, ni en la tendencia mensual de finalizados, aunque tenga
`finalizadoAt` en el periodo. **SHALL** seguir contando como creado **[SUPUESTO S-7]** y **MUST NOT** contar como activo,
porque es cerrado. La exclusión **SHALL** vivir en `packages/shared` (`esAnulado`, regla invariable 13), y la pantalla de
Análisis sólo pinta. La media de resolución de la ficha de cliente (RQ-TC-70) **MUST NOT** contar los anulados
**[SUPUESTO S-5]**.

Los tickets históricos que una persona marque como abandonados (consecuencia 3 de c2) quedan fuera de este requisito:
la marca no existe todavía, y marcarlos es dato de producción.

#### Scenario: un anulado no cuenta como finalizado — ROJO
- GIVEN un anulado y un finalizado, los dos con `finalizadoAt` en el periodo
- WHEN se calcula el análisis
- THEN `finalizados` es 1 y la tendencia del mes cuenta 1

#### Scenario: un anulado no entra en el tiempo promedio — ROJO
- GIVEN un anulado con 2 días de servicio y un finalizado con 10
- WHEN se calcula el análisis
- THEN `tiempoPromedioDias` es 10

#### Scenario: un anulado no entra en el cumplimiento — ROJO
- GIVEN un anulado dentro de su promesa y un finalizado fuera de ella
- WHEN se calcula el análisis
- THEN `cumplimientoPct` es 0

#### Scenario: un anulado sigue contando como creado — ROJO
- GIVEN un anulado creado en el periodo
- WHEN se calcula el análisis
- THEN cuenta en `creados` y no en `activos`

#### Scenario: la ficha de cliente no promedia los anulados — ROJO
- GIVEN un cliente con un ticket finalizado y otro anulado, los dos cerrados en la ventana
- WHEN se calcula la media de resolución
- THEN es la del finalizado sólo

### Requirement: RQ-TC-72 · Histórico abandonado: una consulta de lectura lista los candidatos y no escribe

Fuente: `decision/c2-anulado` («se marca, no se reescribe», consecuencia 3); maestro M1.10 (`R08.4.md:2147-2151`).

`docs/sdd/Consulta_Candidatos_Anulado_2026-10-18.sql` **SHALL** listar los candidatos por la huella del apaño: tickets
que pasaron por una transición «Rechazo» y están en `Finalizado`. Leerá las dos fuentes del bloque A de
`docs/sdd/Consultas_Recuentos_2026-09-25.sql`: `desk.ticket_transitions` y `desk.ticket_history`. Por candidato
**SHALL** dar número, fecha del Rechazo, fecha de llegada a `Finalizado` y origen (aplicación, Zoho o los dos).

La consulta **SHALL** ir envuelta en `BEGIN TRANSACTION READ ONLY … ROLLBACK` y **MUST NOT** contener ninguna sentencia
que escriba: `INSERT`, `UPDATE`, `DELETE`, `ALTER` ni `CREATE`. Ejecutarla en producción, confirmar los candidatos y
marcarlos es tarea de persona: el cambio **MUST NOT** escribir ninguna marca ni cambiar el estado de ningún ticket cerrado
(auditoría inmutable, M11.4).

#### Scenario: la consulta sólo lee — ROJO
- GIVEN el fichero de la consulta
- WHEN lo lee su guardián
- THEN está envuelto en `READ ONLY` y `ROLLBACK`, y no contiene ninguna sentencia que escriba
- AND escribir un `UPDATE` en el fichero pone el guardián en rojo (regla de mutación 2)

#### Scenario: lista los candidatos por la huella (verificación de persona)
- GIVEN la base de producción
- WHEN una persona ejecuta la consulta
- THEN obtiene un candidato por fila y confirma a mano cuáles se abandonaron
