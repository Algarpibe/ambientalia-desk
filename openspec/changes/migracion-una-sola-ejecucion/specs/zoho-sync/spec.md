## ADDED Requirements

### RQ-ZS-23 · Dos ejecuciones simultáneas de la migración de tickets abiertos: a lo sumo una confirma

De dos ejecuciones de `migrarTicketsAbiertos` con `aplicar === true` que se solapan sobre los mismos tickets, **a lo sumo una
MUST confirmar**. La otra **SHALL** rechazarse con el error de `apps/desk/server/db/migracionTicketsAbiertos.ts:90` («El ticket N
pasó a estar gobernado entre la lectura y la escritura: se deshace la migración entera») y su transacción se deshace
entera: no deja ningún marcador en `ticket_transitions` ni ninguna fila de `tickets` modificada por ella.

Tras las dos, cada ticket migrado **MUST** tener exactamente un marcador (transición `ID_TRANSICION_MIGRACION`) y el
`ejecutado_por` de sus `values` **SHALL** ser el de la ejecución que confirmó.

Este requisito caracteriza el mecanismo que ya existe y no pide construir nada: una transacción por ejecución y el
`UPDATE … WHERE id = $1 AND managed_by_app = false RETURNING id`
(`apps/desk/server/db/migracionTicketsAbiertos.ts:84-90`). No hay bloqueo explícito y el requisito no lo exige: la
ejecución perdedora espera el bloqueo de fila de la ganadora y, al confirmarse ésta, su `UPDATE` ya no casa.

Una ejecución **posterior** a otra ya confirmada **no** es un rechazo: no encuentra nada que migrar y no escribe
(RQ-ZS-17; `apps/desk/server/db/migracionTicketsAbiertos.test.ts:121-131`). La pasada en seco (sin `aplicar` o con
`aplicar=false`) no participa: no abre transacción ni escribe.

**Nota de método.** El solape sólo se prueba de verdad con PostgreSQL real y dos conexiones (prueba de integración, que se
salta donde no exista `TEST_DATABASE_URL`). pg-mem únicamente fija el rechazo, el `ROLLBACK` y la ausencia de `COMMIT` por el
espía de SQL, porque no revierte de verdad (`apps/desk/server/db/migracionTicketsAbiertos.test.ts:13-15`).

**Fuera de este requisito (nota declarada, no requisito).** Qué responde la ruta HTTP a la ejecución rechazada. Por lectura
de `apps/desk/server/app.ts:90-92`, hoy es un `500` genérico («Error interno»), no medido por HTTP; queda pendiente de
decisión de Gerencia.

#### Scenario: Solape, una confirma y la otra se rechaza sin dejar nada
- GIVEN tickets abiertos migrables y dos ejecuciones con `aplicar === true` sobre los mismos tickets, solapadas en el tiempo
- WHEN ambas llegan a escribir
- THEN una confirma con `aplicado: true`
- AND la otra se rechaza con el mensaje de `apps/desk/server/db/migracionTicketsAbiertos.ts:90`
- AND la rechazada no deja ningún marcador en `ticket_transitions` ni ninguna fila de `tickets` modificada por ella

#### Scenario: Un marcador por ticket, y de quién es
- GIVEN el solape del escenario anterior ya resuelto
- WHEN se leen los marcadores `ID_TRANSICION_MIGRACION` de los tickets migrados
- THEN cada ticket migrado tiene exactamente un marcador
- AND el `ejecutado_por` de sus `values` es el actor de la ejecución que confirmó
- AND cada ticket migrado queda con `managed_by_app = true`

#### Scenario: Una ejecución posterior no es un rechazo y no escribe
- GIVEN una ejecución con `aplicar === true` ya confirmada
- WHEN, después de su `COMMIT`, se lanza otra con `aplicar === true` sobre los mismos tickets
- THEN termina sin error: no encuentra nada que migrar
- AND no emite ningún `INSERT` ni `UPDATE`, y los marcadores existentes no cambian

#### Scenario: La pasada en seco no participa
- GIVEN una ejecución con `aplicar === true` en curso
- WHEN se lanza otra sin `aplicar` o con `aplicar=false`
- THEN no abre transacción (ni `BEGIN`) y no escribe
- AND no se rechaza ni altera a la ejecución en curso
