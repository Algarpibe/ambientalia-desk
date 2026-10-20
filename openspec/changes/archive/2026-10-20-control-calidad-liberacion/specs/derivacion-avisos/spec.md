# Delta de `derivacion-avisos` — `control-calidad-liberacion` (F1C-07, `cierra: no`)

Sólo ADDED. Fuente: `decision/f1c07-firma-control-calidad`.
Supuestos (reversibles): **S-12** el actor del envío no recibe el aviso; **S-13** aviso sólo de bandeja, sin correo.

## ADDED Requirements

### Requirement: RQ-AV-24 · Aviso a los administradores activos cuando un ticket llega a `Control de calidad` sin firmante libre

Tras `envio_control_calidad`, **SHALL** crearse un aviso para cada administrador activo (`users.is_admin`) cuando, con `permissions` RQ-PM-33 evaluada sobre el ticket ya con la fila del envío, no queda ningún habilitado que no haya intervenido; si queda alguno, no se avisa a nadie. **SHALL NOT** ir al Director Técnico ni a un cargo por serlo; el actor del envío queda fuera (S-12). Los destinatarios los da una función nueva junto a `apps/desk/server/db/avisos.ts:121-127`; sin destinatarios no falla. Texto: «El ticket #N está en «Control de calidad» y no queda nadie que pueda firmarlo: firma un administrador, con motivo.», con `ticket_id`. Se escribe fuera de la transacción (RQ-AV-08), sólo de bandeja (`enviado_at` `NULL`, S-13), sin ejecutar transiciones.

#### Scenario: sin habilitado libre avisa a los administradores — ROJO
- GIVEN el interruptor encendido, un único Coordinador activo que es el técnico asignado y dos administradores activos
- WHEN se ejecuta `envio_control_calidad`
- THEN cada administrador recibe un aviso con el `ticket_id` y el texto, con `enviado_at` `NULL`

#### Scenario: no va al Director Técnico — ROJO
- GIVEN el mismo caso y un Director Técnico activo que no intervino
- WHEN se ejecuta el envío
- THEN el Director no recibe aviso

#### Scenario: con un habilitado libre no se avisa — ROJO
- GIVEN un Coordinador activo que no intervino
- WHEN se ejecuta el envío
- THEN no se crea ningún aviso

#### Scenario: vacante, el Director libre evita el aviso; si intervino, se avisa — ROJO
- GIVEN ningún Coordinador activo, primero con un Director libre y luego con el Director como técnico asignado
- WHEN se ejecuta el envío
- THEN el primero no avisa; el segundo avisa a los administradores

#### Scenario: sin administradores, el envío se escribe — ROJO
- GIVEN ningún habilitado libre ni administrador activo
- WHEN se ejecuta el envío
- THEN el ticket queda en `Control de calidad`, sin aviso ni error

#### Scenario: el actor no se avisa y un envío rechazado no avisa — ROJO
- GIVEN ningún habilitado libre y dos administradores
- WHEN uno de ellos ejecuta el envío, y en otro caso el envío responde `409` o `403`
- THEN sólo el otro administrador recibe aviso; el envío rechazado no crea ninguno

#### Scenario: un fallo al crear el aviso no deshace el envío — ROJO
- GIVEN la creación de avisos falla
- WHEN se ejecuta el envío
- THEN el ticket queda en `Control de calidad` con su fila de traza
