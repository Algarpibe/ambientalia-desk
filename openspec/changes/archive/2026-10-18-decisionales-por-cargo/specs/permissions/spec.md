# Delta de `permissions` — `decisionales-por-cargo` (F1C-05, `cierra: no`)

## ADDED Requirements

### Requirement: RQ-PM-28 · El interruptor `DECISIONALES_POR_CARGO` nace cerrado, y cerrado todo es como antes

Fuente: `decision/f1c05-decisionales-por-cargo` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`), consecuencia 3,
y la regla de secretos de `CLAUDE.md` («un interruptor que enciende un escritor nace cerrado (`=== 'true'`)»).

`loadConfig` (`packages/zoho-sync/src/config.ts`) **SHALL** leer `DECISIONALES_POR_CARGO` y dejar `decisionalesPorCargo`
en `true` **sólo** con el literal exacto `true`; ausente, vacío o cualquier otro valor (`'TRUE'`, `'1'`, `'yes'`,
`'false'`) **SHALL** dar `false`.

Con el interruptor cerrado, `executeTransition` **MUST** comportarse exactamente como antes de este cambio: ninguna
respuesta distinta y **ninguna consulta más** a la base. Toda la suite anterior **SHALL** seguir verde sin tocar sus pruebas.

`DEPLOY.md` **SHALL** documentar el interruptor con las dos frases de la regla de secretos —qué enciende y qué se rompe si se
pone mal—, que **no se enciende antes del 14/12/2026**, que los cargos de permiso se asignan antes de encenderlo, y la línea
que hay que añadir a mano al fichero de ejemplo de entorno.

#### Scenario: sólo el literal `true` lo enciende — ROJO
- GIVEN `loadConfig` sin la variable, o con `''`, `'false'`, `'TRUE'`, `'1'` o `'yes'`
- WHEN se lee `decisionalesPorCargo`
- THEN es `false`; y con `'true'` es `true`

#### Scenario: apagado, un Técnico ejecuta una Decisional técnica como hoy — CARACTERIZACIÓN
- GIVEN el interruptor cerrado, un usuario no administrador del área Servicio Técnico con cargo `Técnico` y un ticket en
  `Rev./Diagnostico`
- WHEN ejecuta `escalado_a_revision`
- THEN la respuesta es la de hoy (no `403`) y el ticket avanza

---

### Requirement: RQ-PM-29 · Quién ejecuta una Decisional: el Director o el Coordinador del área de la decisión

Fuente: `decision/c10-permisos-cargo` (`openspec/config.yaml:1935`), `decision/f1c04-tabla-tipos-validada` (14
Decisionales) y `decision/f1c05-decisionales-por-cargo` (consecuencias 1 y 2).

`packages/shared` **SHALL** tener una regla pura, única fuente para servidor y cliente (regla invariable 13, punto 1), que
recibe la transición, el sujeto (`areas`, `isAdmin`, `cargoPermiso`) y un contexto `{ activo, coordinadorTecnicoVacante }`
y dice qué cargos faltan:

- Con `activo` = `false`, **SHALL NOT** restringir nada.
- Sólo afecta a las transiciones cuyo tipo de evento, resuelto por id (`tipoEventoDeTransicion`, `transitions-st`
  RQ-TS-45), es `Decisional`. Las demás **SHALL NOT** cambiar.
- Las transiciones de la lista corta (`EXCEPCIONES_POR_CARGO.transiciones`) **SHALL** conservar su cargo más estricto y
  **SHALL NOT** recibir la regla de Decisionales: `liberacion_sin_factura` sigue siendo sólo de `Director Comercial`.
- **Área de la decisión:** `rechazo_revision` → Servicio Técnico; `rechazo_comercial` → Comercial; `rechazo_garantia` →
  Comercial (excepción a la regla del origen: su origen, `Notificación a Compras`, es de Compras, que no tiene Director ni
  Coordinador). Las demás, su `area` del catálogo cuando es `Comercial` o `Servicio Técnico`.
- **Cargos:** Servicio Técnico → `Director Técnico`, `Coordinador Técnico` y, **mientras `coordinadorTecnicoVacante`**,
  `Especialista técnico`. Comercial → `Director Comercial`, `Coordinador Comercial`.
- Una Decisional sin área de decisión resoluble **SHALL** fallar cerrada: ningún cargo la ejecuta.
- El administrador **SHALL** pasar. Un sujeto sin cargo, o con uno fuera de la lista, **SHALL NOT** ejecutar ninguna
  Decisional con el interruptor encendido, sin respaldo al área (como RQ-PM-22).
- La regla **sólo restringe**: la compuesta exige primero el área (`canExecuteTransition`) y la excepción de cargo de hoy; el
  cargo nunca concede lo que el área niega.

#### Scenario: las 14 Decisionales con su área de decisión — ROJO
- GIVEN la tabla escrita a mano de las 14 Decisionales con su área de decisión (seis de Servicio Técnico, siete de
  Comercial y `liberacion_sin_factura` en la lista corta)
- WHEN se barre `CATALOGO_POR_FLUJO`
- THEN las Decisionales son exactamente esas 14 y cada una resuelve el área de la tabla

#### Scenario: encendido, un Técnico no ejecuta una Decisional técnica — ROJO
- GIVEN el contexto encendido y un sujeto de Servicio Técnico con cargo `Técnico`
- WHEN se evalúa `escalado_a_revision`
- THEN faltan `Director Técnico` y `Coordinador Técnico` (y `Especialista técnico` si el Coordinador está vacante)

#### Scenario: el Especialista técnico sólo mientras el Coordinador esté vacante — ROJO
- GIVEN un sujeto de Servicio Técnico con cargo `Especialista técnico`
- WHEN se evalúa una Decisional técnica con `coordinadorTecnicoVacante` = `true` y luego con `false`
- THEN la primera pasa y la segunda no

#### Scenario: las mixtas por su área de decisión — ROJO
- GIVEN el contexto encendido
- WHEN un `Director Comercial` con las áreas Comercial y Servicio Técnico evalúa `rechazo_revision`, y un `Director
  Técnico` con las mismas áreas evalúa `rechazo_comercial` y `rechazo_garantia`
- THEN ninguno de los tres pasa; `rechazo_revision` la pasa el `Director Técnico` y `rechazo_garantia` el `Coordinador
  Comercial`

#### Scenario: la lista corta manda en `liberacion_sin_factura` — ROJO
- GIVEN el contexto encendido y un sujeto de Comercial con cargo `Coordinador Comercial`
- WHEN se evalúa `liberacion_sin_factura` con la compuesta
- THEN no pasa, y la regla de Decisionales no la reclama (la decide `cargoQueFaltaParaTransicion`)

#### Scenario: administrador, sin cargo y no Decisional
- GIVEN el contexto encendido
- WHEN un administrador sin cargo evalúa cualquier Decisional; un sujeto de Comercial sin cargo evalúa `aprobacion`; y un
  `Técnico` evalúa una transición Operativa de su área
- THEN el administrador pasa, el sujeto sin cargo no, y la Operativa pasa

---

### Requirement: RQ-PM-30 · El servidor impone la regla, escalón B, detrás del `403` de cargo de hoy

`executeTransition` (`apps/desk/server/services/ticketService.ts`) **SHALL**, sólo con el interruptor encendido, responder
`403` cuando la regla de RQ-PM-29 diga que faltan cargos, con un mensaje que nombre la transición y los cargos que la
ejecutan, y sin escribir nada. El contexto **SHALL** calcularlo el servidor: `coordinadorTecnicoVacante` es `true` cuando
ningún usuario activo tiene `cargo_permiso` = `Coordinador Técnico`.

**Posición** (orden total de F1B-10, regla de mutación 1): el `403` nuevo **SHALL** ir después del `409` de estado, del
`403` de área y del `403` de cargo de la lista corta, y antes de todo `422`. La suite **MUST** ponerse roja si se mueve
delante de cualquiera de los tres primeros o detrás de un `422`.

#### Scenario: encendido, un Técnico recibe 403 en una Decisional técnica — ROJO
- GIVEN el interruptor encendido, un Técnico de Servicio Técnico y un ticket en `Rev./Diagnostico`
- WHEN ejecuta `escalado_a_revision`
- THEN `403` que nombra `Director Técnico`, y el ticket no cambia

#### Scenario: el Especialista técnico con y sin Coordinador activo — ROJO
- GIVEN el interruptor encendido y un `Especialista técnico` de Servicio Técnico
- WHEN ejecuta una Decisional técnica sin ningún `Coordinador Técnico` activo, y otra vez con uno activo
- THEN la primera no responde `403`; la segunda responde `403`

#### Scenario: 409 de estado antes que el 403 nuevo — ROJO por posición
- GIVEN el interruptor encendido, un Técnico y un ticket fuera de `Rev./Diagnostico`
- WHEN ejecuta `escalado_a_revision`
- THEN `409`

#### Scenario: 403 de área antes que el 403 nuevo
- GIVEN el interruptor encendido, un usuario de Compras sin cargo y un ticket en `Rev./Diagnostico`
- WHEN ejecuta `escalado_a_revision`
- THEN el `403` nombra el área, no los cargos

#### Scenario: 403 de cargo de la lista corta antes que el 403 nuevo
- GIVEN el interruptor encendido, un Comercial sin cargo y un ticket en `Por Facturar`
- WHEN ejecuta `liberacion_sin_factura`
- THEN el `403` es el de hoy, que nombra sólo `Director Comercial`

#### Scenario: el 403 nuevo antes que un 422
- GIVEN el interruptor encendido, un Técnico, un ticket en `Rev./Diagnostico` y un cuerpo que daría `422`
- WHEN ejecuta `escalado_a_revision`
- THEN `403`; con un `Director Técnico` y el mismo cuerpo, `422`

---

### Requirement: RQ-PM-31 · El cliente filtra con la misma regla y con el contexto que le da el servidor

`GET /api/permisos/decisionales` **SHALL** exigir sesión (`401` sin ella) y devolver `{ activo, coordinadorTecnicoVacante }`
calculado como en RQ-PM-30; apagado, `{ activo: false, coordinadorTecnicoVacante: false }` sin consultar la base.

`TransitionPanel` **SHALL** filtrar las transiciones con la regla compartida de RQ-PM-29 y ese contexto; mientras no lo
tenga, o si la llamada falla, **SHALL** usar el contexto apagado. El cliente **SHALL NOT** decidir por su cuenta si el
interruptor está encendido ni si el Coordinador está vacante: el filtro es comodidad, la guarda es el `403` de RQ-PM-30.

#### Scenario: la ruta dice lo mismo que la guarda — ROJO
- GIVEN el interruptor apagado, y luego encendido con y sin un `Coordinador Técnico` activo
- WHEN una sesión pide `GET /api/permisos/decisionales`
- THEN recibe `{ activo: false, coordinadorTecnicoVacante: false }`, luego `{ activo: true, coordinadorTecnicoVacante:
  true }` y `{ activo: true, coordinadorTecnicoVacante: false }`; sin sesión, `401`
