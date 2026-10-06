# Delta para derivacion-avisos — aviso de 60 días de una reclamación sin resolver (F1B-13, `cierra: no`)

Numeración comprobada contra `openspec/specs/derivacion-avisos/spec.md`: el último requisito vivo es RQ-AV-18; el nuevo es
RQ-AV-19. El delta **no modifica** ningún requisito vivo. Supuestos S-1…S-12: los de `proposal.md` §6, todos reversibles,
aceptados. Marcas: **ROJO** nace rojo; **CARACTERIZACIÓN** nace verde.

## ADDED Requirements

### RQ-AV-19 · Aviso a los 60 días naturales de una reclamación al fabricante sin resolver, una sola vez por ficha

El sistema **SHALL** crear un aviso cuando una ficha de `public.garantia_proveedor` (`tickets-core` RQ-TC-45) **no esté
resuelta** y lleve **más de 60 días naturales** abierta, contados desde su fecha de apertura (SUPUESTO S-7, reversible):
el día 60 no avisa y el 61 sí, como dicen la decisión y el maestro («lleva más de 60 días abierta»). El 60 **SHALL**
ser una constante con nombre en `packages/shared` (`DIAS_AVISO_RECLAMACION`), no un número suelto; los días son
**naturales**, no laborables, porque el fabricante no sigue el calendario laboral de Ambientalia. Una ficha «abierta» y
una «enviada» cuentan igual; una **resuelta MUST NOT** avisar, aunque haya pasado el plazo, y una respuesta «no» (que no
es ficha) tampoco.

**Destinatarios.** El aviso **SHALL** ir a los usuarios activos cuyo **`cargo_permiso`** es Director Técnico, el mismo
cargo que gestiona la reclamación (`permissions` RQ-PM-26), con una consulta propia por `cargo_permiso`: la de
`destinatariosDeCargo` (`apps/desk/server/db/avisos.ts:104-113`) compara `users.cargo`, el cargo de firma de la remisión,
que es otra columna, y **MUST NOT** reutilizarse para esto. Si **nadie** lleva el cargo, el aviso **SHALL** caer en el
**respaldo al área Servicio Técnico** con `destinatariosDeArea` (`apps/desk/server/db/avisos.ts:74-93`).

**Un solo aviso por ficha** (SUPUESTO S-12): una ficha **MUST NOT** recibir un segundo aviso, aunque la pasada la evalúe
muchas veces. La **marca** de «ya avisada» es una columna de la propia ficha, y el `UPDATE … RETURNING` que la pone
**SHALL** ir en la **misma transacción** que la creación de los avisos, con el patrón de `marcarYAvisarRitmo` de
`avisoRitmoContrato.ts`: si la transacción falla, ni hay marca ni hay avisos; si hay marca, hay avisos. Una ficha que ya
tiene la marca no se vuelve a marcar ni avisa.

El aviso **SHALL** nombrar la OVI, el fabricante, la fecha de apertura y que la reclamación «lleva más de 60 días
abierta» y sigue en su estado (texto: «La reclamación al fabricante F por la orden OVI lleva más de 60 días abierta: se
abrió el D y sigue «E».»), llevar el ticket de origen en su `ticket_id` y ser sólo de bandeja:
**MUST NOT** disparar el canal de correo (`RQ-AV-09`) y `enviado_at` **SHALL** quedar `NULL` (SUPUESTO S-9, sin
interruptor: no hay escritor externo). Se origina únicamente desde el proceso `ambientalia-desk`, no desde
`apps/hub-sync`.

**La pasada.** El servicio **SHALL** engancharse a la pasada periódica del servidor, en la cadena de
`apps/desk/server/index.ts:88` (junto a la pasada de ritmo de contratos, `RQ-AV-14`), con **una evaluación por día
civil**, y **MUST NOT lanzar**: un error propio se registra y no interrumpe la cadena (la sincronización con Zoho que
sigue en esa cadena corre igual). Depende, como el aviso de ritmo, de que corra la pasada de sincronización; el maestro ya
anota ese punto abierto y no se agrava.

#### Scenario: ficha abierta a los 61 días avisa al cargo — ROJO
- GIVEN una ficha «abierta» con 61 días naturales desde su apertura y un usuario activo con `cargo_permiso` Director Técnico
- WHEN corre la pasada
- THEN se crea un aviso a ese usuario que nombra la OVI, el fabricante y la fecha de apertura, con el `ticket_id` de la ficha y `enviado_at` `NULL`

#### Scenario: una ficha «enviada» también avisa — ROJO
- GIVEN una ficha «enviada» con 75 días desde su apertura
- WHEN corre la pasada
- THEN se crea el aviso

#### Scenario: a los 59 y a los 60 días no avisa — ROJO
- GIVEN una ficha «abierta» con 59 días naturales desde su apertura, y otra con exactamente 60
- WHEN corre la pasada
- THEN no se crea ningún aviso (el día 60 no avisa)

#### Scenario: una ficha resuelta no avisa — ROJO
- GIVEN una ficha «resuelta» con 90 días desde su apertura y sin la marca
- WHEN corre la pasada
- THEN no se crea ningún aviso

#### Scenario: una respuesta «no» no avisa — ROJO
- GIVEN una respuesta «no» con más de 60 días
- WHEN corre la pasada
- THEN no se crea ningún aviso

#### Scenario: los días son naturales, no laborables (S-7) — ROJO
- GIVEN una ficha abierta un sábado, evaluada exactamente 60 días naturales después y otra vez al día natural siguiente (61), con fines de semana de por medio
- WHEN corre la pasada
- THEN a los 60 no se crea aviso y a los 61 sí, sin descontar días no laborables

#### Scenario: un solo aviso por ficha (S-12) — ROJO
- GIVEN el aviso ya creado y la marca puesta
- WHEN corre la pasada otra vez, en el mismo día y en los días siguientes
- THEN no se crea ningún aviso nuevo

#### Scenario: la marca y los avisos van en la misma transacción — ROJO
- GIVEN una ficha pendiente de aviso y un fallo al crear uno de los avisos
- WHEN corre la pasada
- THEN la marca no queda puesta y no queda ningún aviso; la pasada siguiente lo reintenta

#### Scenario: la marca ya puesta no se vuelve a poner — ROJO
- GIVEN dos pasadas concurrentes sobre la misma ficha
- WHEN las dos intentan marcar con `UPDATE … RETURNING`
- THEN sólo una recibe la fila y sólo esa crea avisos

#### Scenario: el destinatario es por `cargo_permiso`, no por `users.cargo` — ROJO
- GIVEN un usuario con `users.cargo` «Director Técnico» (texto de firma) y sin `cargo_permiso`, y otro con `cargo_permiso` Director Técnico
- WHEN corre la pasada
- THEN el aviso va sólo al segundo

#### Scenario: nadie lleva el cargo, cae al área Servicio Técnico — ROJO
- GIVEN ningún usuario activo con `cargo_permiso` Director Técnico y usuarios del área Servicio Técnico
- WHEN corre la pasada
- THEN se crea un aviso a cada destinatario de `destinatariosDeArea(db, 'Servicio Técnico', …)`

#### Scenario: con cargo asignado no se avisa también al área — CARACTERIZACIÓN
- GIVEN un usuario con `cargo_permiso` Director Técnico y otros del área Servicio Técnico
- WHEN corre la pasada
- THEN el aviso va sólo a quien lleva el cargo

#### Scenario: sin destinatarios ni en el cargo ni en el área, no se marca y se reintenta — ROJO
- GIVEN una ficha vencida y ningún usuario activo con `cargo_permiso` Director Técnico ni del área Servicio Técnico
- WHEN corre la pasada
- THEN no se crea ningún aviso, la marca de la ficha queda sin poner y se registra una advertencia; cuando aparece un destinatario, la pasada siguiente avisa

#### Scenario: la pasada no lanza — ROJO
- GIVEN un fallo de base de datos dentro del servicio del aviso
- WHEN corre la cadena periódica
- THEN el error se registra y la sincronización con Zoho que sigue en la cadena corre igual

#### Scenario: una evaluación por día civil — ROJO
- GIVEN la pasada invocada varias veces el mismo día civil
- WHEN se evalúa
- THEN el servicio sólo evalúa las fichas la primera vez ese día

#### Scenario: el aviso no dispara correo — ROJO
- GIVEN cualquier aviso de la reclamación
- WHEN se crea
- THEN `enviado_at` queda `NULL` y no se invoca el canal de correo de `RQ-AV-09`
