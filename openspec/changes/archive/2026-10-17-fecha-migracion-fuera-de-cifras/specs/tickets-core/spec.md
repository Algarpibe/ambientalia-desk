# Delta para tickets-core

## ADDED Requirements

### Requirement: RQ-TC-69 · La fecha que puso la migración, y su marcador, no entran en ninguna cifra

Fuente: `decision/h1-fechas-migrados` (Gerencia, 2026-10-17): «Los tickets migrados cuentan en Análisis con sus fechas
originales de Zoho: creación, transiciones y cierre. La fecha de la migración queda sólo como marca, y no entra en ningún
indicador.» E-207 (`decision/migracion-e207-e212`, (1)) sigue en pie: la fecha **SHALL** conservarse en `tickets.closed_time`.

Un **cierre puesto por la migración** es el `closed_time` de un ticket igual, como instante, al `closed_time_destino` de una fila
de `ticket_transitions` con `transition_id = 'migracion_f1f01_abiertos'` cuyo `values.cierre_origen` es `'migracion'`
(SUPUESTO S-1). El **paso marcador** es cualquier fila con ese `transition_id`.

El criterio **SHALL** vivir en `packages/shared` (regla invariable 13) y los lectores del servidor **SHALL** consumirlo:

- **Análisis:** `finalizadoAt` **SHALL** ser `fecha_finalizacion_st` si existe; si no, el `closed_time` sólo cuando **no** es un
  cierre puesto por la migración; si lo es, `null`, y el ticket **MUST NOT** contar como finalizado, ni en el tiempo promedio
  ni en el cumplimiento (S-2). Un cierre con `cierre_origen: 'zoho'` **SHALL** contar con su fecha.
- **Ficha de cliente:** la media de resolución **SHALL** calcularla el servidor y llegar en el detalle de contacto y de cuenta;
  un cierre puesto por la migración **MUST NOT** entrar en ella. El `.tsx` **MUST NOT** restar ni promediar: sólo formatea.
- **Informe de contrato:** la llegada a «Finalizado» del paso marcador **MUST NOT** fechar por su `performed_at`; con
  `cierre_origen: 'zoho'` **SHALL** fechar con su `closed_time_destino`; con `'migracion'`, la subOV queda sin fecha (S-3).
- **Indicadores:** el paso marcador **MUST NOT** contar como paso del historial de los nueve indicadores ni de la comparación
  con Zoho (S-5).

#### Scenario: Análisis no cuenta el cierre puesto por la migración — ROJO
- GIVEN un ticket cerrado sin `fecha_finalizacion_st`, con `closed_time` igual al `closed_time_destino` de su marcador con `cierre_origen: 'migracion'`
- WHEN se leen las filas de Análisis
- THEN su `finalizadoAt` es `null` y no cuenta como finalizado
- AND su `closed_time` sigue en la base

#### Scenario: Análisis sí cuenta la fecha de cierre de Zoho de un migrado — ROJO
- GIVEN un ticket migrado con marcador `cierre_origen: 'zoho'` y su `closed_time`
- WHEN se leen las filas de Análisis
- THEN su `finalizadoAt` es ese `closed_time`

#### Scenario: un cierre posterior distinto del de la migración cuenta — ROJO
- GIVEN un marcador con `cierre_origen: 'migracion'` y un `closed_time` del ticket que ya no coincide con su `closed_time_destino`
- WHEN se decide qué cierre cuenta
- THEN cuenta el `closed_time` del ticket

#### Scenario: la ficha de cliente recibe la media sin el cierre de la migración — ROJO
- GIVEN una cuenta con un ticket cerrado normal y otro con cierre puesto por la migración
- WHEN se pide el detalle de la cuenta
- THEN la media de resolución es la del ticket normal sólo

#### Scenario: el informe de contrato no fecha por el marcador — ROJO
- GIVEN una subOV ejecutada cuyo ticket sólo llegó a «Finalizado» por el marcador con `cierre_origen: 'migracion'`
- WHEN se calcula el informe
- THEN la subOV no tiene fecha de ejecución
- AND con `cierre_origen: 'zoho'` la fecha es la del `closed_time_destino`

#### Scenario: el marcador no vuelve «reentrante» falso — ROJO
- GIVEN un ticket cuyo único paso del historial es el marcador
- WHEN se calculan sus indicadores
- THEN `reentrante` es «sin dato», como sin historial
