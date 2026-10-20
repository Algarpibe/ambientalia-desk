# Delta de `transitions-st` — `control-calidad-liberacion` (F1C-07, `cierra: no`)

Sólo ADDED. Las cifras y tablas vivas (RQ-TS-05, tabla de RQ-TS-06, RQ-TS-26/27/44) se leen con RQ-TS-50 y se reescriben en el archive.
Fuente: `decision/c6-qa-liberacion`, `decision/f1c07-firma-control-calidad`, `decision/f1c07-supuestos-corregidos`; M9.1 (`R08.4.md:3244-3256`).
Supuestos (reversibles): **S-10** el rechazo no rebaja `Urgent` ni exige el permiso de ajuste de prioridad; **S-11** en el rechazo el «Motivo del rechazo» hace de motivo del administrador.

## ADDED Requirements

### Requirement: RQ-TS-46 · Estado `Control de calidad` y tres transiciones de Servicio Técnico

Sólo se añade; nada existente cambia. Las tres son de área `Servicio Técnico`:

| id | Nombre | De → a | Tipo | Campos |
|---|---|---|---|---|
| `envio_control_calidad` | Envío a control de calidad | `En Proceso` → `Control de calidad` | Operativo | los de `finalizacion_servicio` (`transitions.ts:222-223`) |
| `aprobacion_control_calidad` | Control de calidad aprobado | `Control de calidad` → `Por Facturar` | Decisional | comentario; tres casillas obligatorias «Puntos que fallaron en el diagnóstico revisados», «Funcionamiento verificado», «Equipo completo, limpio y listo para embalar» (S-1); casilla «Verificación con gas patrón realizada» y texto «Motivo de la firma del administrador», no obligatorios en el catálogo |
| `rechazo_control_calidad` | Control de calidad rechazado | `Control de calidad` → `En Proceso` | Decisional | comentario; texto obligatorio «Motivo del rechazo» |

`Control de calidad` **SHALL** ser estado de servicio con espera `ninguna`, con columna de tablero y sitio en el mapa (la fase la decide el diseño), **SHALL NOT** ser de cierre y **SHALL** tener exactamente dos salidas. Los tres `Rechazo` a `Por Facturar` no cambian ni pasan por él.

#### Scenario: tipos, áreas, recorridos y campos — ROJO
- GIVEN el catálogo de servicio
- WHEN se consultan los tres ids y sus campos
- THEN tienen tipo, área, `from`, `to` y `required` de la tabla (casilla de gas y texto del administrador sin `required`)

#### Scenario: el estado no es de cierre, tiene columna y dos salidas — ROJO
- GIVEN el registro de estados y el grafo
- WHEN se consulta `Control de calidad`
- THEN no es de cierre, está en una columna y tiene dos transiciones con ese `from`

#### Scenario: los tres «Rechazo» no cambian — CARACTERIZACIÓN
- GIVEN `rechazo_comercial`, `rechazo_cliente` y `rechazo_revision`
- WHEN se comparan con el catálogo anterior
- THEN origen, destino, área y tipo son idénticos

### Requirement: RQ-TS-47 · El interruptor `CONTROL_CALIDAD_LIBERACION` quita una entrada u otra; las salidas no dependen de él

Con la configuración de `permissions` RQ-PM-32, `executeTransition` **SHALL** responder en el escalón B, tras el `409` de estado (`ticketService.ts:126-128`) y antes del `403` de área (`:129-131`), sin escribir nada: apagado (o sin configuración), `envio_control_calidad` da `409`; encendido, `finalizacion_servicio` da `409` con un mensaje que dice que el ticket pasa por Control de calidad, distinto del de «no aplica desde el estado». Las dos salidas **SHALL NOT** depender del interruptor (S-8) y ninguna otra transición se ve afectada. Apagado el flujo **MUST** ser el de hoy, sin consultas de más.

#### Scenario: apagado, `finalizacion_servicio` como hoy — CARACTERIZACIÓN
- GIVEN el interruptor apagado y un ticket en `En Proceso`
- WHEN se ejecuta `finalizacion_servicio`
- THEN pasa a `Por Facturar`

#### Scenario: apagado, el envío da 409 y el estado no aparece — ROJO
- GIVEN el interruptor apagado y un ticket en `En Proceso`
- WHEN se ejecuta `envio_control_calidad`
- THEN `409` y el ticket no cambia

#### Scenario: encendido, el envío lleva a `Control de calidad` — ROJO
- GIVEN el interruptor encendido y un ticket en `En Proceso`
- WHEN se ejecuta `envio_control_calidad`
- THEN queda en `Control de calidad` con su fila de traza

#### Scenario: encendido, `finalizacion_servicio` da 409 — ROJO
- GIVEN el interruptor encendido y un ticket en `En Proceso`
- WHEN se ejecuta `finalizacion_servicio`
- THEN `409` con el mensaje de Control de calidad

#### Scenario: apagar con tickets dentro no los vara — ROJO
- GIVEN dos tickets en `Control de calidad`, el interruptor apagado y un firmante válido
- WHEN aprueba uno y rechaza el otro
- THEN llegan a `Por Facturar` y a `En Proceso` sin `409` de interruptor

### Requirement: RQ-TS-48 · Checklist, gas patrón y motivos: `422` de contenido (escalón C)

Dentro del `422` agregado (`ticketService.ts:134`), **SHALL** rechazarse: la aprobación con una casilla del checklist sin marcar (lo impone el obligatorio de casilla de hoy, `transitionExec.ts:76-77`, sin guarda nueva); la aprobación sin la casilla de gas marcada cuando el compuesto del equipo tiene patrón vigente (`tienePatronVigente`, `gasPatron.ts:43-47`, con `leerContextoGas`, `gasesPatron.ts:14-26`; sin patrón vigente, sin equipo o con compuesto no reconocido **SHALL NOT** exigirse); el rechazo sin «Motivo del rechazo» o con sólo espacios; y la firma de respaldo del administrador sin motivo (`permissions` RQ-PM-34). El rechazo no exige checklist ni gas. Los errores **SHALL** ir juntos en una respuesta.

#### Scenario: falta una casilla — ROJO
- GIVEN un ticket en `Control de calidad` y un firmante válido
- WHEN aprueba con «Funcionamiento verificado» sin marcar (y cada una de las otras dos por separado)
- THEN `422` que nombra la casilla y el ticket no cambia

#### Scenario: sin patrón vigente la casilla de gas no se exige — ROJO
- GIVEN equipo con patrón vencido, ticket sin equipo y compuesto no reconocido
- WHEN se aprueba con las tres casillas y sin la de gas
- THEN ninguno da `422` por el gas

#### Scenario: con patrón vigente se exige — ROJO
- GIVEN un equipo con patrón vigente y un firmante válido
- WHEN aprueba sin la casilla de gas y luego con ella
- THEN `422` la primera; pasa la segunda

#### Scenario: el rechazo exige motivo y nada más — ROJO
- GIVEN un ticket en `Control de calidad` y un firmante válido
- WHEN rechaza sin motivo, con motivo en blanco y con motivo sin checklist ni gas
- THEN las dos primeras dan `422`; la tercera pasa

#### Scenario: los errores van juntos — ROJO
- GIVEN un equipo con patrón vigente
- WHEN se aprueba sin una casilla y sin la de gas
- THEN un único `422` lista los dos

### Requirement: RQ-TS-49 · Aprobado lleva a `Por Facturar`; el rechazo vuelve a `En Proceso` con prioridad `High`

La aprobación **SHALL** dejar el ticket en `Por Facturar`. El rechazo **SHALL** dejarlo en `En Proceso` y fijar `priority = 'High'` (`prioridad.ts:13`) en su mismo `UPDATE`, aunque el cuerpo no la traiga o traiga otra (S-10). Su fila de traza, con el motivo en `values`, es el registro del retrabajo (`trazas` RQ-TZ-24). El ciclo **MAY** repetirse sin límite.

#### Scenario: aprobado lleva a `Por Facturar` — ROJO
- GIVEN un ticket en `Control de calidad`, tres casillas y un firmante válido
- WHEN aprueba
- THEN el estado es `Por Facturar` con la fila `aprobacion_control_calidad`

#### Scenario: el rechazo sube la prioridad — ROJO
- GIVEN un ticket con prioridad `Medium` y un firmante válido
- WHEN rechaza con motivo, con y sin `priority: 'Medium'` en el cuerpo
- THEN queda en `En Proceso` con `High`

#### Scenario: el firmante sin permiso de prioridad puede rechazar — ROJO
- GIVEN un Coordinador que no cumple el predicado de ajuste de prioridad
- WHEN rechaza con motivo
- THEN no hay `403` de prioridad y queda `High`

#### Scenario: `Urgent` no se rebaja — ROJO
- GIVEN un ticket de Zoho con prioridad `Urgent`
- WHEN un firmante válido lo rechaza
- THEN sigue en `Urgent`

### Requirement: RQ-TS-50 · Cifras: servicio 36 transiciones, 23 estados, 44 pasos; tipos 50 con 17 / 16 / 13 / 4

El catálogo de servicio **SHALL** tener 36 transiciones (antes 33), 23 estados (antes 22) y 44 pasos del mapa (antes 41). La tabla de tipos (RQ-TS-44) **SHALL** tener 50 filas (antes 47), 36 / 7 / 5 / 2 por catálogo, y 17 Operativo · 16 Decisional · 13 Compras / Logístico · 4 Administrativo (antes 16 · 14 · 13 · 4). `cifras_ancladas` y los guardianes llevan las cifras en el mismo commit (RQ-TS-26, RQ-TS-27). Los 23 estados **SHALL** seguir alcanzables y `Control de calidad` **SHALL NOT** entrar en `ESTADOS_DE_CIERRE` (`invariantesGrafo.test.ts:339`).

#### Scenario: cifras de servicio y de tipos — ROJO
- GIVEN el catálogo, el registro y la tabla de tipos
- WHEN se cuentan
- THEN 36 / 23 / 44, 50 filas con 36 / 7 / 5 / 2 y 17 / 16 / 13 / 4, y `cifras_ancladas` coincide

#### Scenario: alcanzabilidad e invariantes — ROJO
- GIVEN el grafo con 23 estados
- WHEN corren los barridos de alcanzabilidad y de ciclos
- THEN los 23 son alcanzables y `Control de calidad` no es cierre

### Requirement: RQ-TS-51 · Orden de las guardas nuevas, fijado por pruebas de posición

Orden (A < B < C < D, RQ-TS-06): `409` del interruptor (B) tras el `409` de estado y antes del `403` de área; `403` de firmante (`permissions` RQ-PM-36, B) tras el `403` de área y el de cargo y antes del `403` de prioridad y de todo `422`; los `422` de RQ-TS-48 (C) tras los `403` y antes de la persona derivada (`ticketService.ts:138-142`). Cada posición **MUST** tener prueba que se ponga roja si se mueve (regla de mutación 1).

#### Scenario: CC-1 el 409 de estado gana al del interruptor — ROJO por posición
- GIVEN el interruptor encendido y un ticket en `Rev./Diagnostico`
- WHEN se ejecuta `finalizacion_servicio`
- THEN el mensaje es el de «no aplica desde el estado»

#### Scenario: CC-2 el 409 del interruptor gana al 403 de área — ROJO por posición
- GIVEN el interruptor apagado y un usuario sin área de Servicio Técnico
- WHEN ejecuta `envio_control_calidad`
- THEN `409`, no `403`

#### Scenario: CC-3 el 403 de área gana al de firmante — ROJO por posición
- GIVEN un usuario de Comercial con cargo `Coordinador Técnico` y un ticket en `Control de calidad`
- WHEN aprueba
- THEN el `403` nombra el área

#### Scenario: CC-4 el 403 de firmante gana a todo 422 — ROJO por posición
- GIVEN quien intervino y un cuerpo con el checklist vacío
- WHEN aprueba
- THEN `403`; con un firmante válido, `422`

#### Scenario: CC-5 el 403 de firmante gana al 422 del motivo del administrador — ROJO por posición
- GIVEN un administrador que no puede firmar de respaldo y un cuerpo sin motivo
- WHEN aprueba
- THEN `403`, no `422`

#### Scenario: CC-6 el 422 de contenido gana a la persona derivada — ROJO por posición
- GIVEN un firmante válido, el checklist incompleto y una persona derivada inexistente
- WHEN aprueba
- THEN el `422` es el de las casillas
