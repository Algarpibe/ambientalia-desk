# Delta de `derivacion-avisos` · rotulado-tras-enviar (F1B-04, `cierra: no`)

Medido sobre `a947b48`. Molde: RQ-AV-19 (`openspec/specs/derivacion-avisos/spec.md:786-813`). El último requisito vivo es RQ-AV-21 (`openspec/specs/derivacion-avisos/spec.md:958`).

## ADDED Requirements

### Requirement: RQ-AV-22 · Aviso de «la etiqueta no se generó» al llegar el desenlace de una remisión de entrada, una sola vez por remisión

El sistema **SHALL** crear un aviso cuando llega el callback de una remisión (`POST /api/remisiones/:id/callback`, `remisiones`
RQ-RE-09) con estado `ok` u `ok_con_avisos` y `resultado.dymoId` **vacío**: ausente, `null` o cadena vacía, o sin `resultado`
(SUPUESTO G1, aprobado). La condición **MUST NOT** decidirse comparando el texto de `avisos[].paso` ni ningún otro texto del
flujo. Con estado `error` **MUST NOT** avisar aunque falte la etiqueta. Aplica también a una remisión de legado (S10).

**Destinatarios.** El aviso **SHALL** ir a quien envió (`public.remisiones.enviado_por_id`, `remisiones` RQ-RE-42), si existe y
está activo, y a los usuarios activos con `cargo_permiso` Director Técnico, por la consulta de `cargo_permiso` y no por
`users.cargo` (RQ-AV-19). Si **nadie** lleva el cargo, el aviso **SHALL** caer en el respaldo al área Servicio Técnico. Una persona
**MUST NOT** recibirlo dos veces (S7). Sin `enviado_por_id` el aviso va sólo al cargo (S4). Sin ningún destinatario **MUST NOT**
marcarse ni avisar, se registra una advertencia y se reintenta en el siguiente callback (S8).

**Una sola vez por remisión** (S6). La marca es `public.remisiones.aviso_sin_etiqueta_at timestamptz`, puesta por un `UPDATE`
condicional a `aviso_sin_etiqueta_at IS NULL … RETURNING` en la **misma transacción** que crea los avisos (molde de
`apps/desk/server/services/avisoReclamacionProveedor.ts:26-44`): si la transacción falla no hay marca ni avisos, y sólo quien recibe
la fila crea los avisos. Ni un callback repetido ni un reenvío vuelven a avisar. El aviso **MUST NOT** tumbar el callback: corre en
un `try` que sólo registra el fallo, el callback responde igual y el resultado queda guardado.

**Texto.** «Ticket #N: la remisión de entrada se generó, pero la etiqueta DYMO no quedó en su carpeta de Drive. El equipo (serial S)
sigue sin etiqueta para rotular: hay que generarla a mano.» Si `resultado.avisos` trae algo, se añade «Lo que informó n8n: …» con
cada entrada copiada tal cual, sin seleccionar por el texto del paso. Sin ticket asociado empieza por «La remisión de entrada del
{fecha}». Es sólo de bandeja: `enviado_at` queda `NULL`, **MUST NOT** invocar el canal de correo (RQ-AV-09) y no hay interruptor nuevo
(S9). Lleva el `ticket_id` de la remisión.

#### Scenario: [AV22-a] Las formas de vacío avisan
- GIVEN tres callbacks `ok_con_avisos` a remisiones distintas, con `resultado.dymoId` ausente, `null` y `''`, y otro `ok` sin `resultado`
- WHEN llegan
- THEN cada una crea el aviso con su `ticket_id` y `enviado_at` `NULL`

#### Scenario: [AV22-b] Un `dymoId` presente no avisa
- GIVEN un callback `ok` con `resultado.dymoId` igual a un id de Drive
- WHEN llega
- THEN no se crea ningún aviso ni se pone la marca

#### Scenario: [AV22-c] El estado `error` sin `dymoId` no avisa
- GIVEN un callback `error` sin `dymoId`
- WHEN llega
- THEN no se crea ningún aviso ni se pone la marca

#### Scenario: [AV22-d] La condición no depende del texto del paso
- GIVEN un callback `ok_con_avisos` con `dymoId` `null` y `avisos` de un paso con un nombre distinto del esperado, y otro sin `avisos`
- WHEN llegan
- THEN los dos avisan; el primero copia lo que informó n8n y el segundo no lleva esa frase

#### Scenario: [AV22-e] Un callback repetido no repite el aviso
- GIVEN el aviso ya creado y la marca puesta, y dos callbacks nuevos a la vez
- WHEN llegan
- THEN no se crea ningún aviso más; si la marca estaba libre, sólo una de las dos transacciones la recibe y crea los avisos

#### Scenario: [AV22-f] Un reenvío tras el aviso no lo repite
- GIVEN la marca puesta y la remisión reenviada después
- WHEN llega un nuevo callback sin `dymoId`
- THEN no se crea ningún aviso

#### Scenario: [AV22-g] Quien envió y es Director Técnico recibe uno solo
- GIVEN `enviado_por_id` de un usuario activo con el cargo, y otro Director Técnico
- WHEN llega el callback sin `dymoId`
- THEN se crean dos avisos, uno por persona, y ninguna recibe dos

#### Scenario: [AV22-h] Quien envió y quien lleva el cargo son personas distintas
- GIVEN `enviado_por_id` de un usuario activo sin el cargo, y un Director Técnico activo
- WHEN llega el callback sin `dymoId`
- THEN reciben el aviso las dos personas y nadie del área

#### Scenario: [AV22-i] Sin `enviado_por_id`, o con una persona dada de baja, sólo el cargo
- GIVEN una remisión sin `enviado_por_id` y otra cuya persona está inactiva, con un Director Técnico activo
- WHEN llegan los callbacks sin `dymoId`
- THEN el aviso va sólo al Director Técnico

#### Scenario: [AV22-j] Sin nadie con el cargo, cae al área Servicio Técnico
- GIVEN ningún usuario activo con el cargo y usuarios del área Servicio Técnico
- WHEN llega el callback sin `dymoId`
- THEN se avisa a quien envió y a cada destinatario del área, sin repetir

#### Scenario: [AV22-k] Sin destinatarios no se marca y se reintenta
- GIVEN una remisión sin `enviado_por_id`, sin nadie con el cargo y sin nadie en el área
- WHEN llega el callback sin `dymoId`
- THEN no hay avisos, la marca queda libre y se registra una advertencia; cuando aparece un destinatario, el siguiente callback avisa

#### Scenario: [AV22-l] Si el aviso falla, el callback responde igual
- GIVEN un fallo de base de datos al crear los avisos
- WHEN llega el callback sin `dymoId`
- THEN el callback responde como sin fallo, el resultado queda guardado, no queda marca ni avisos y el fallo se registra

#### Scenario: [AV22-m] El aviso sólo va a la bandeja
- GIVEN cualquier aviso de esta remisión
- WHEN se crea
- THEN `enviado_at` queda `NULL` y no se invoca el canal de correo de `RQ-AV-09`

#### Scenario (MANUAL, de persona) · La etiqueta .dymo en Drive y el aviso
- GIVEN una remisión de entrada real enviada tras desplegar · WHEN n8n termina con la etiqueta subida y, en otra prueba, con la etiqueta fallida · THEN con la etiqueta en su carpeta de Drive no llega aviso, y sin ella llega a quien envió y al Director Técnico, y el ticket avanza igual. **Dueño:** quien administra n8n, con Servicio Técnico. **ARCHIVAR ESTE CAMBIO NO LO DA POR HECHO.**

## Trazabilidad

- `decision/e167-rotulado-tras-enviar-12-10` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`): si la etiqueta no se genera se avisa a quien envió y al Director Técnico (RQ-AV-22, párrafos de condición y destinatarios).
- G1 (qué es «no se generó», aprobado): `AV22-a` a `AV22-d`. S4: `AV22-i`. S6: `AV22-e` y `AV22-f`. S7: `AV22-g`. S8: `AV22-j` y `AV22-k`. S9: `AV22-m`. S10: el último enunciado del primer párrafo.
- Datos de n8n (la etiqueta es un paso no crítico; `resultado.dymoId` llega `null` si falla la subida o el movimiento a la carpeta): **segunda mano**, leídos por el analista el 2026-10-12 en el nodo «Code Resumen Entrada»; sin ejecución real contra la que contrastar. Hipótesis; si `dymoId` llegara vacío en un envío bueno, el aviso saltaría siempre.
- No se tocan, y siguen ciertos: RQ-AV-19 (su marca y su consulta por `cargo_permiso` se reutilizan como molde, no se modifican) y RQ-AV-09 (el correo sigue siendo la capa de encima; este aviso no la usa).
