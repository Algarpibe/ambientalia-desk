## MODIFIED Requirements

### RQ-ZS-23 · Dos ejecuciones simultáneas de la migración de tickets abiertos: a lo sumo una confirma

De dos ejecuciones de `migrarTicketsAbiertos` con `aplicar === true` que se solapan sobre los mismos tickets, **a lo sumo una
MUST confirmar**. La otra **SHALL** rechazarse con el error de `apps/desk/server/db/migracionTicketsAbiertos.ts:90` («El ticket N
pasó a estar gobernado entre la lectura y la escritura: se deshace la migración entera»), que es de tipo propio,
`MigracionAdelantadaError`, y conserva el mismo texto, y su transacción se deshace
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

La ruta `POST /api/admin/migrar-tickets-abiertos` **MUST** responder `409` a la ejecución rechazada, con cuerpo
`{ error, motivo: 'otra-ejecucion' }` y este mensaje exacto (N = número del ticket): «Otra ejecución de la migración está en
curso o acaba de confirmarse (o el ticket N cambió en la aplicación mientras ésta escribía). Esta ejecución no escribió
nada. Compruébalo con una pasada en seco —la misma llamada sin `aplicar`— antes de volver a lanzarla.» La distinción
**MUST** hacerse por el tipo del error, no por su texto. Cualquier otro error **MUST** seguir llegando al manejador central
y dar `500` «Error interno» (`apps/desk/server/app.ts:90-92`). Este `409` **MUST** distinguirse del de la negativa de
RQ-ZS-17: aquél trae el informe completo (con `negativa` rellena, sin clave `error`); éste trae `error` y `motivo` y no
trae informe. El interruptor de RQ-ZS-19 va delante: apagado, la respuesta es su `403`.

**Nota de método.** El solape sólo se prueba de verdad con PostgreSQL real y dos conexiones (prueba de integración, que se
salta donde no exista `TEST_DATABASE_URL`). pg-mem únicamente fija el rechazo, el `ROLLBACK` y la ausencia de `COMMIT` por el
espía de SQL, porque no revierte de verdad (`apps/desk/server/db/migracionTicketsAbiertos.test.ts:13-15`). La respuesta HTTP
se prueba en la prueba de ruta sobre pg-mem (estado y cuerpo); «no escribió nada» lo sostiene la integración con PostgreSQL
real.

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

#### Scenario: La ejecución rechazada responde 409 con su cuerpo
- GIVEN una ejecución con `aplicar === true` cuyo ticket N pasa a estar gobernado entre la lectura y la escritura
- WHEN la ruta recibe el error `MigracionAdelantadaError`
- THEN responde `409` con `{ error, motivo: 'otra-ejecucion' }` y el mensaje exacto del requisito, con N el número del ticket
- AND la respuesta no trae informe

#### Scenario: Otro error cualquiera sigue dando 500
- GIVEN una ejecución con `aplicar === true` que falla con un error que no es `MigracionAdelantadaError`
- WHEN el error sale de la ruta
- THEN llega al manejador central y responde `500` con «Error interno»

#### Scenario: Con el interruptor apagado se ve el 403, no este 409
- GIVEN el interruptor de RQ-ZS-19 apagado
- WHEN se lanza la ruta con `aplicar === true`
- THEN responde el `403` del interruptor
- AND no responde el `409` de la ejecución rechazada

#### Scenario: Con negativa se ve el 409 del informe, no éste
- GIVEN una ejecución con `aplicar === true` que la negativa de RQ-ZS-17 detiene
- WHEN la ruta responde
- THEN responde `409` con el informe completo, con `negativa` rellena y sin clave `error`
- AND el cuerpo no trae `motivo: 'otra-ejecucion'`
