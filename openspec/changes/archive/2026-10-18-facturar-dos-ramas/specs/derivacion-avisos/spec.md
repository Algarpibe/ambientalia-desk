# Delta para derivacion-avisos

## ADDED Requirements

### Requirement: RQ-AV-23 · Aviso al Director Comercial cuando vence la fecha prevista de facturación de un ticket en `Pendiente de facturar`, una sola vez por ticket y fecha

Fuente: `decision/anexo-33-checkbox` («Si esa fecha pasa y el ticket sigue en «Pendiente de facturar», el sistema avisa
al Director Comercial», `openspec/config.yaml:2378`) y maestro M1.3.5 (`R08.4.md:1360`).

El sistema **SHALL** crear un aviso cuando un ticket esté en `Pendiente de facturar` (`transitions-st` RQ-TS-42) y su
`fecha_prevista_facturacion` (la escrita por «Liberación sin factura», `transitions-st` RQ-TS-35) sea **anterior al día de
hoy** en día civil de Bogotá (supuesto S-4): el mismo día de la fecha prevista no avisa y el siguiente sí. La regla de
vencimiento **SHALL** ser una función pura de `packages/shared`, no una comparación suelta en el servidor. **No es una
alarma de SLA:** no cuenta horas desde la entrada al estado y **MUST NOT** declararse en `SLA_HORAS_POR_ESTADO`.

**No avisa** un ticket sin fecha prevista (las liberaciones anteriores al 09/09 y las del histórico, que no se
reescriben), un ticket que ya salió de `Pendiente de facturar` (facturado, en `Finalizado`) ni un ticket en cualquier
otro estado, aunque tenga fecha prevista vencida.

**Destinatarios.** El aviso **SHALL** ir a los usuarios activos cuyo `cargo_permiso` es Director Comercial
(`destinatariosDeCargoPermiso`, `apps/desk/server/db/avisos.ts:121-127`); si nadie lo lleva, al **área Comercial** de
respaldo (`destinatariosDeArea`); si tampoco hay nadie, **MUST NOT** marcar y la pasada siguiente reintenta (supuesto S-7).

**Un solo aviso por ticket y fecha prevista** (supuesto S-6). La marca es una columna de la propia fila,
`tickets.facturacion_avisada_para` (`date`, anulable, **fuera de `TICKET_COLS`** para que el sincronizador no la pise),
que guarda la fecha prevista ya avisada. El `UPDATE … RETURNING` que la pone **SHALL** exigir en su `WHERE` que el ticket
siga en `Pendiente de facturar`, que la fecha prevista sea la evaluada y que la marca no sea ya esa fecha, y **SHALL** ir en
la **misma transacción** que la creación de los avisos (molde `avisoReclamacionProveedor.ts`): sin marca no hay avisos, y
con marca los hay. Una segunda pasada, o una concurrente, devuelve cero filas y no crea nada.

El aviso **SHALL** nombrar el número del ticket, la fecha prevista y que sigue sin facturar (texto: «El ticket #N sigue
en «Pendiente de facturar»: la fecha prevista de facturación era el D.»), llevar el ticket en su `ticket_id` y ser sólo de
bandeja (supuesto S-11): **MUST NOT** disparar el canal de correo y `enviado_at` **SHALL** quedar `NULL`. **MUST NOT**
ejecutar ninguna transición ni cambiar el ticket más allá de su marca.

**La pasada.** El servicio **SHALL** engancharse a la pasada periódica del servidor (`apps/desk/server/index.ts:88`),
con **una evaluación por día civil** (supuesto S-5), y **MUST NOT** lanzar: un error propio se registra y no interrumpe la
cadena. Un fallo en un ticket no para a los demás.

**Migración.** Una sola sentencia aditiva al final de `packages/zoho-sync/src/db/schema.sql`: `ALTER TABLE tickets ADD
COLUMN IF NOT EXISTS facturacion_avisada_para date`, **sin calificar** (`tickets` es de `DESK_TABLES`). Sin relleno.

#### Scenario: fecha vencida en `Pendiente de facturar` avisa al Director Comercial — ROJO
- GIVEN un ticket en `Pendiente de facturar` con fecha prevista `2027-01-10`, hoy `2027-01-11`, y un usuario activo con
  `cargo_permiso` Director Comercial
- WHEN corre la pasada
- THEN se crea un aviso a ese usuario con el `ticket_id` del ticket y `enviado_at` `NULL`, y la marca vale `2027-01-10`

#### Scenario: con la fecha aún no vencida no avisa — ROJO
- GIVEN el mismo ticket y hoy `2027-01-10` (o antes)
- WHEN corre la pasada
- THEN no se crea ningún aviso ni se marca

#### Scenario: un ticket facturado no avisa — ROJO
- GIVEN un ticket que ejecutó «Facturar» y está en `Finalizado`, con fecha prevista vencida
- WHEN corre la pasada
- THEN no se crea ningún aviso

#### Scenario: dos pasadas sobre el mismo vencimiento dan un solo aviso — ROJO
- GIVEN un ticket vencido ya avisado por una pasada
- WHEN corre otra pasada (también otro día)
- THEN no se crea un segundo aviso

#### Scenario: sin Director Comercial, avisa al área Comercial — ROJO
- GIVEN un ticket vencido, nadie con el cargo y un usuario activo del área Comercial
- WHEN corre la pasada
- THEN el aviso va a ese usuario

#### Scenario: sin nadie, no marca y reintenta — ROJO
- GIVEN un ticket vencido y nadie ni en el cargo ni en el área
- WHEN corre la pasada
- THEN no se marca; y cuando aparece un destinatario, la pasada siguiente avisa

#### Scenario: la alarma nunca mueve el ticket — ROJO
- GIVEN un ticket vencido
- WHEN corre la pasada
- THEN el ticket sigue en `Pendiente de facturar`, sin fila nueva en `ticket_transitions`

#### Scenario: el sincronizador no pisa la marca — ROJO
- GIVEN `TICKET_COLS`
- WHEN se busca `facturacion_avisada_para`
- THEN no está
