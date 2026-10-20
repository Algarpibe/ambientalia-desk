# Delta de `permissions` — `control-calidad-liberacion` (F1C-07, `cierra: no`)

Sólo ADDED. La tabla de 14 Decisionales de RQ-PM-29 se lee con RQ-PM-35 y se reescribe en el archive.
Fuente: `decision/f1c07-firma-control-calidad`, `decision/f1c07-supuestos-corregidos`, `decision/c6-qa-liberacion`; M9.1 (`R08.4.md:3244-3256`).
Supuestos (reversibles): **S-4** el administrador tampoco firma si intervino; **S-5** en filas de traza sin `performed_by_id` se compara el nombre con igualdad exacta; **S-6** en tickets de Zoho cuenta sólo lo registrado en Desk y `derivado_a`; **S-9** quien ejecuta el envío (Operativo) intervino.

## ADDED Requirements

### Requirement: RQ-PM-32 · El interruptor `CONTROL_CALIDAD_LIBERACION` nace cerrado, y cerrado todo es como antes

`loadConfig` (`packages/zoho-sync/src/config.ts`) **SHALL** dejar `controlCalidadLiberacion` en `true` sólo con el literal `true` (cualquier otro valor, ausente o vacío da `false`), independiente de `DECISIONALES_POR_CARGO` (RQ-PM-28). Cerrado, o sin configuración, `executeTransition` **MUST** comportarse como antes, sin consultas de más, y la suite anterior sigue verde. `DEPLOY.md` **SHALL** documentarlo en sección propia con las dos frases de la regla de secretos, que se enciende en enero junto con `DECISIONALES_POR_CARGO` y no antes del 14/12/2026, que los `cargo_permiso` se asignan antes (sin Coordinador activo sólo firman administradores, con motivo) y la línea que se añade a mano al fichero de ejemplo de entorno, que esta tanda no toca.

#### Scenario: sólo el literal `true` lo enciende — ROJO
- GIVEN `loadConfig` sin la variable, o con `''`, `'false'`, `'TRUE'`, `'1'` o `'yes'`
- WHEN se lee `controlCalidadLiberacion`
- THEN es `false`; con `'true'` es `true`

#### Scenario: apagado, el flujo de hoy no cambia — CARACTERIZACIÓN
- GIVEN el interruptor cerrado y un ticket en `En Proceso`
- WHEN se ejecuta `finalizacion_servicio`
- THEN pasa a `Por Facturar` como hoy

#### Scenario: `DEPLOY.md` lo documenta — ROJO
- GIVEN `DEPLOY.md`
- WHEN se busca `CONTROL_CALIDAD_LIBERACION`
- THEN aparece con qué enciende, qué se rompe y el 14/12/2026

### Requirement: RQ-PM-33 · Quién puede firmar: un habilitado que no intervino en el trabajo

`packages/shared` **SHALL** tener una regla pura (regla invariable 13, punto 1) que dice quién firma `aprobacion_control_calidad` y `rechazo_control_calidad`, con el interruptor encendido o apagado:

- **Habilitados:** usuarios **activos** con `cargo_permiso` `Coordinador Técnico`; si ninguno está activo (vacante, como `apps/desk/server/services/decisionales.ts:12`), los activos con `Director Técnico` o `Especialista técnico`. Con un Coordinador activo, sólo él firma.
- **Intervino** quien es el técnico asignado (`tickets.derivado_a`, por id) o autor de una fila de la traza con `tipoEventoDeTransicion` `Operativo` (S-9). Decisional, Administrativo, Compras / Logístico y la fila de creación no cuentan.
- **Comparación:** por `performed_by_id` si la fila lo tiene; si no, por nombre (S-5). Un homónimo de una fila vieja bloquea, nunca habilita. Tickets de Zoho: S-6.
- Firma un habilitado que no intervino; ningún otro, salvo RQ-PM-34. Sólo restringe: el área de Servicio Técnico sigue siendo requisito.

#### Scenario: firma el Coordinador que no intervino — ROJO
- GIVEN un Coordinador activo, no asignado y sin Operativas en la traza
- WHEN se evalúa su firma
- THEN puede firmar

#### Scenario: quien intervino no firma — ROJO
- GIVEN un Coordinador que es el `derivado_a` y otro autor de una fila `Operativo`
- WHEN se evalúa la firma de cada uno
- THEN ninguno puede

#### Scenario: Decisional, Compras / Logístico y Administrativo no son intervención — ROJO
- GIVEN un Coordinador autor de filas de esos tres tipos y no asignado
- WHEN se evalúa su firma
- THEN puede firmar

#### Scenario: con Coordinador activo, ni el Especialista ni el Director firman — ROJO
- GIVEN un Coordinador activo, y un Especialista y un Director que no intervinieron
- WHEN se evalúa la firma de los dos
- THEN ninguno puede

#### Scenario: vacante, firman Director y Especialista, no un Técnico — ROJO
- GIVEN ningún Coordinador activo
- WHEN se evalúa un Director, un Especialista y un Técnico que no intervinieron
- THEN firman los dos primeros y no el Técnico

#### Scenario: fila con id frente a fila sin id — ROJO
- GIVEN una fila Operativa con `performed_by_id` ajeno y el nombre del firmante, y otra sin id con su nombre
- WHEN se evalúa la firma del usuario con ese nombre
- THEN la primera no cuenta como suya y la segunda sí

#### Scenario: ticket de Zoho sin traza de Desk — ROJO
- GIVEN un ticket sin filas de Desk
- WHEN se evalúa un Coordinador activo con `derivado_a` vacío y con su id
- THEN puede firmar y no puede, respectivamente

### Requirement: RQ-PM-34 · El administrador firma sólo de respaldo: sin habilitado libre, sin haber intervenido, con motivo

Un administrador **SHALL** firmar sólo si (1) no queda ningún habilitado que no haya intervenido, (2) él no intervino (S-4) y (3) aporta motivo no vacío tras recortar espacios: en la aprobación «Motivo de la firma del administrador»; en el rechazo el «Motivo del rechazo» (S-11). Si no, **SHALL NOT** firmar aunque pase el área. La falta de motivo es `422` (`transitions-st` RQ-TS-48), no `403`; el motivo queda en el `values` de la traza. Un administrador habilitado que no intervino firma como habilitado, sin motivo extra.

#### Scenario: con un habilitado libre el administrador no firma — ROJO
- GIVEN un Coordinador libre y un administrador que no intervino
- WHEN el administrador aprueba con motivo
- THEN `403`

#### Scenario: sin habilitado libre firma con motivo — ROJO
- GIVEN el único Coordinador es el técnico asignado y un administrador que no intervino
- WHEN aprueba con tres casillas y motivo
- THEN pasa a `Por Facturar` y el motivo queda en `values`

#### Scenario: sin motivo, 422 — ROJO
- GIVEN el mismo caso
- WHEN aprueba con motivo ausente y con motivo de espacios
- THEN `422` que nombra «Motivo de la firma del administrador»

#### Scenario: el administrador que intervino no firma — ROJO
- GIVEN un administrador autor de una fila `Operativo` y ningún habilitado libre
- WHEN aprueba con motivo
- THEN `403`

#### Scenario: rechazo de respaldo — ROJO
- GIVEN ningún habilitado libre
- WHEN un administrador que no intervino rechaza con y sin «Motivo del rechazo»
- THEN con motivo vuelve a `En Proceso` y queda en `values`; sin él, `422`

### Requirement: RQ-PM-35 · Las dos de control de calidad quedan fuera de la regla de Decisionales por cargo

`cargosQueFaltanParaDecisional` (`packages/shared/src/decisionales.ts:39-50`) **SHALL** devolver `null` para `aprobacion_control_calidad` y `rechazo_control_calidad`, con el contexto encendido: su regla propia es más estricta (RQ-PM-33), como la lista corta conserva la suya. El `403` de Decisionales **SHALL NOT** aplicarse a ellas. El barrido de catálogos **SHALL** dar 16 Decisionales (antes 14): las 14 de RQ-PM-29 y estas dos, sin área de decisión.

#### Scenario: con Decisionales por cargo encendido quedan fuera — ROJO
- GIVEN `DECISIONALES_POR_CARGO` encendido y un Especialista con Coordinador activo
- WHEN se evalúa la regla para las dos de QA y para otra Decisional técnica
- THEN `null` en las dos de QA; la otra sigue restringida

#### Scenario: el barrido da 16 — ROJO
- GIVEN la tabla escrita a mano de Decisionales
- WHEN se barre `CATALOGO_POR_FLUJO`
- THEN son 16: las 14 de F1C-05 y las dos de QA marcadas fuera de la regla por área

#### Scenario: el 403 es el de firmante — ROJO
- GIVEN ambos interruptores encendidos y un Técnico de Servicio Técnico
- WHEN aprueba
- THEN el `403` es el de RQ-PM-36 y no dice «es Decisional»

### Requirement: RQ-PM-36 · El servidor impone la firma, escalón B

`executeTransition` (`ticketService.ts`) **SHALL** responder `403` sin escribir nada cuando RQ-PM-33 y RQ-PM-34 digan que el usuario no puede firmar. El mensaje **SHALL** nombrar la transición y distinguir la causa: no es cargo habilitado, intervino en el trabajo, o hay un habilitado libre. Posición (`transitions-st` RQ-TS-51): tras el `403` de área (`:129-131`) y el de cargo, contiguo al de Decisionales (`:131`, que para estas dos devuelve `null`), y antes del `403` de prioridad y de todo `422`.

#### Scenario: un Técnico no firma — ROJO
- GIVEN un ticket en `Control de calidad` y un Técnico de Servicio Técnico
- WHEN aprueba
- THEN `403` que nombra los cargos que firman y el ticket no cambia

#### Scenario: quien intervino recibe su causa — ROJO
- GIVEN un Coordinador que es el técnico asignado
- WHEN rechaza
- THEN `403` cuyo mensaje dice que intervino

#### Scenario: el administrador con un habilitado libre — ROJO
- GIVEN un habilitado libre y un administrador
- WHEN el administrador aprueba
- THEN `403` cuyo mensaje dice que firma un habilitado

#### Scenario: un firmante válido pasa con el interruptor apagado y encendido — ROJO
- GIVEN un ticket en `Control de calidad` y un Coordinador que no intervino
- WHEN aprueba con las tres casillas, con el interruptor apagado y luego encendido
- THEN pasa en los dos casos

### Requirement: RQ-PM-37 · El cliente sólo pinta el estado del interruptor que da el servidor

`GET /api/permisos/control-calidad` **SHALL** exigir sesión (`401`) y devolver `{ activo }` igual a `config.controlCalidadLiberacion === true` (molde `permisosDecisionales.ts:16`). `TransitionPanel` **SHALL** ocultar `envio_control_calidad` con `activo` falso y `finalizacion_servicio` con `activo` verdadero, mediante una función pura de `packages/shared`; sin respuesta o con error, `activo = false`. El cliente **SHALL NOT** decidir interruptor, firmante, checklist, gas, motivos ni prioridad: los impone el servidor (RQ-TS-47, RQ-TS-48, RQ-PM-36) y ocultar es comodidad probada (regla 13, punto 3).

#### Scenario: la ruta dice lo mismo que la guarda — ROJO
- GIVEN el interruptor apagado y luego encendido
- WHEN una sesión pide la ruta
- THEN recibe `{ activo: false }` y luego `{ activo: true }`; sin sesión, `401`

#### Scenario: la función de visibilidad — ROJO
- GIVEN la función pura
- WHEN se evalúan `envio_control_calidad`, `finalizacion_servicio`, las dos de firma y otra transición con `activo` falso y verdadero
- THEN el envío sólo se ve con `activo`, `finalizacion_servicio` sólo sin él, y las demás siempre

#### Scenario (MANUAL, de persona) · El panel con el interruptor encendido y apagado
- GIVEN un ticket en `En Proceso` en la aplicación desplegada
- WHEN se abre el panel con el interruptor apagado y luego encendido
- THEN apagado se ve «finalización de servicio»; encendido, el envío. **Dueño:** Supervisión, en las pruebas en la app. **ARCHIVAR NO LO DA POR HECHO.**
