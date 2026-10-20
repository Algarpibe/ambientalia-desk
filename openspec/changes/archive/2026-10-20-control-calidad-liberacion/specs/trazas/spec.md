# Delta de `trazas` — `control-calidad-liberacion` (F1C-07, `cierra: no`)

Sólo ADDED. RQ-TZ-01 («nueve columnas», cobertura por transición, `repo.ts:314-318`) se lee con RQ-TZ-22: diez columnas y tres ejecuciones más; RQ-TZ-16 no cambia (el id es opcional). Se reescriben en el archive.
Fuente: `decision/f1c07-firma-control-calidad`; M9.1 (`R08.4.md:3244-3256`).

## ADDED Requirements

### Requirement: RQ-TZ-22 · La fila de traza guarda el id de la persona: `performed_by_id`, aditiva, sin relleno

`ticket_transitions` **SHALL** tener `performed_by_id text`, anulable, añadida al final de `packages/zoho-sync/src/db/schema.sql` con `ALTER TABLE ticket_transitions ADD COLUMN IF NOT EXISTS performed_by_id text`, sin calificar (es de `DESK_TABLES`) y sin relleno. `applyTransition` **SHALL** escribirla con el id de la sesión en el mismo `INSERT` y transacción (`NULL` si no hay id); `performed_by` sigue como hoy. Los demás escritores no están obligados. El historial que ve el cliente no cambia.

#### Scenario: una transición guarda nombre e id — ROJO
- GIVEN un usuario con id `u1` y nombre `Ana`
- WHEN ejecuta una transición
- THEN la fila tiene `performed_by = 'Ana'` y `performed_by_id = 'u1'`; sin id en la sesión, `NULL`

#### Scenario: migración aditiva y sin relleno — ROJO
- GIVEN el `schema.sql` y una base con filas previas
- WHEN corre la migración dos veces
- THEN la columna existe, las filas previas siguen en `NULL`, no falla y el guardián de `ALTER TABLE` queda verde

#### Scenario: el barrido de escritores sigue verde — ROJO
- GIVEN el barrido de RQ-TZ-16
- WHEN corre tras añadir la columna
- THEN los escritores nombran `performed_by` y uno sintético sin él sigue en rojo

### Requirement: RQ-TZ-23 · La firma de control de calidad deja en la traza quién firmó y con qué motivo

Las filas de `aprobacion_control_calidad` y `rechazo_control_calidad` **SHALL** llevar en `values` el rastro de RQ-TZ-03: casillas marcadas, casilla de gas si se envió, «Motivo del rechazo» y, si firmó un administrador de respaldo (`permissions` RQ-PM-34), su motivo; y la persona en `performed_by` y `performed_by_id`.

#### Scenario: la aprobación del administrador lleva su motivo y el checklist — ROJO
- GIVEN un administrador que aprueba de respaldo con las tres casillas y un motivo
- WHEN termina la transición
- THEN `values` tiene las tres casillas y el motivo, y `performed_by_id` es el del administrador

#### Scenario: el rechazo deja su motivo — ROJO
- GIVEN un rechazo con motivo
- WHEN termina la transición
- THEN `values` de la fila tiene el motivo

### Requirement: RQ-TZ-24 · El retrabajo es contable: una función pura cuenta las filas de rechazo

El retrabajo **SHALL** quedar registrado por la fila `rechazo_control_calidad`, sin contador ni columna nuevos. `packages/shared` **SHALL** tener `contarRetrabajos(traza)`, que devuelve cuántas filas tienen `transition_id = 'rechazo_control_calidad'`, sin contar otras ni lanzar con traza vacía o filas sin `transition_id`. El indicador de M7.1 es de la tanda de KPI.

#### Scenario: cuenta sólo los rechazos — ROJO
- GIVEN una traza con envío, rechazo, envío, rechazo y aprobación
- WHEN se llama `contarRetrabajos`
- THEN devuelve 2

#### Scenario: traza vacía, sin rechazos o con ids nulos — ROJO
- GIVEN una traza vacía, una sin rechazos y una con `transition_id` nulo
- WHEN se llama `contarRetrabajos`
- THEN devuelve 0 en las tres sin lanzar
