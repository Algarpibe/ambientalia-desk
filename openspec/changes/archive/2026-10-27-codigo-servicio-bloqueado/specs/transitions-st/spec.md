# Delta para transitions-st — guarda de servidor del código de servicio, su traza y su posición (`fuera-del-plan`, `cierra: no`)

Construye `decision/ingreso-servicio-reescribe-codigo` (Gerencia, 16/10/2026) con los supuestos S-1 a S-8 de `proposal.md`
y las tareas de persona P-1 a P-5 (no se redefinen aquí). Numeración comprobada contra `openspec/specs/transitions-st/spec.md`:
el último requisito vivo es RQ-TS-64; los nuevos son RQ-TS-65 a RQ-TS-67. Moldes: RQ-TS-21 y RQ-TS-22 (la guarda de prioridad,
`cambiaPrioridadSinPermiso`, `packages/shared/src/prioridad.ts:81-86`). Marcas bajo `strict_tdd`: **ROJO** nace rojo;
**CARACTERIZACIÓN** fija lo que ya hay; **ROJO por posición** se pone rojo si la guarda se mueve (regla de mutación 1).

**Nota de fusión.** Sólo `## ADDED Requirements`, al **final** de la spec viva: **ningún bloque MODIFIED**. La tabla de
RQ-TS-06 (orden de las guardas, fila 5) **no se edita**: la guarda nueva se nombra y se sitúa aquí, en RQ-TS-67, y se lee junto
a esa tabla. Así ninguna línea de la spec viva se mueve y las citas a ella siguen valiendo. La regla de dominio y la propuesta
están en el delta de `tickets-core` (RQ-TC-81 a RQ-TC-83).

## ADDED Requirements

### RQ-TS-65 · Guarda de servidor: con código de servicio ya fijado, sólo un administrador lo cambia, en cualquier transición que lo lleve

En **toda** transición del catálogo de servicio cuyo cuerpo pueda llevar `Código Servicio` —hoy `ingreso_a_servicio`
(`packages/shared/src/transitions.ts:190-191`) y `calibracion_directa` (`packages/shared/src/transitions.ts:262`)— el servidor
**SHALL** responder `403` cuando concurran tres cosas (SUPUESTOS S-4 y S-7): (1) el ticket **ya tiene** código, es decir, el
guardado recortado no es vacío; (2) `values['Código Servicio']` **viene**, no vacío, y es **distinto** del guardado
**comparados ambos recortados**; (3) el usuario **no es administrador**. La guarda **SHALL** aplicarse por **llevar el campo**,
no por el id de la transición: una transición futura que declare `Código Servicio` queda cubierta sin tocar la guarda. Es del
**escalón B** (permiso sobre el sujeto, F1B-10), igual que la de prioridad.

- La excepción es **sólo `isAdmin`**: un cargo de dirección (Director Técnico, Director Comercial) **MUST NOT** eximir.
- El predicado es el de `packages/shared` (`tickets-core` RQ-TC-81), **consumido** por el servidor (regla invariable 13).
- Si `Código Servicio` **no viene**, o viene **vacío** con la misma definición que el plan (`undefined`, `null` o `''`,
  `apps/desk/server/transitionExec.ts:44`), o viene **igual** recortado al guardado, la transición **SHALL** pasar esta guarda.
  (Un vacío en una transición donde el campo es obligatorio lo para el `422` de obligatorios, escalón C; la guarda no se
  adelanta a él.) Un valor de **sólo espacios** no es vacío para el plan y se escribiría tal cual sobre el código fijado: por
  eso **SHALL** contar como **distinto** y dar `403`.
- Si el ticket **no tiene** código, **cualquier** valor pasa: es la única corrección que la regla admite (SUPUESTOS S-2 y S-3).
- Un `403` **SHALL** no escribir nada: ni estado, ni código, ni `managed_by_app`, ni fila en `ticket_transitions`.
- El mensaje **SHALL** nombrar la causa y la salida: el código de servicio ya está fijado y sólo un administrador puede
  cambiarlo. El texto literal lo fija el diseño y vive en `packages/shared`, como `MENSAJE_PRIORIDAD_BLOQUEADA`.
- **Sin interruptor** (SUPUESTO S-8): restringe, no enciende un escritor.
- Una transición que **no** lleva `Código Servicio` **MUST NOT** quedar afectada, aunque el cuerpo traiga esa clave: se ignora
  como hoy.

#### Scenario: no administrador, código distinto, `ingreso_a_servicio`, 403 y nada escrito — ROJO
- GIVEN un técnico no administrador de `Servicio Técnico` y un ticket en `Ingresado` con código `MT_A_B_261001`
- WHEN ejecuta `ingreso_a_servicio` con `Código Servicio` igual a `MT_A_C_261001`
- THEN responde `403`, el ticket sigue en `Ingresado` con su código, y no hay fila nueva en `ticket_transitions`

#### Scenario: lo mismo en `calibracion_directa` — ROJO
- GIVEN un técnico no administrador, un ticket en `Ingresado` de tipo `Calibración` con orden de venta asignada y código `CG_A_B_261001`
- WHEN ejecuta `calibracion_directa` con un código distinto
- THEN responde `403` y no se escribe nada

#### Scenario: el mismo valor, con espacios alrededor, pasa — ROJO
- GIVEN un no administrador y un ticket con código `MT_A_B_261001`
- WHEN ejecuta `ingreso_a_servicio` con `Código Servicio` igual a `  MT_A_B_261001  `
- THEN responde `200`

#### Scenario: el administrador cambia el código — ROJO
- GIVEN un administrador y un ticket en `Ingresado` con código `MT_A_B_261001`
- WHEN ejecuta `ingreso_a_servicio` con `MT_A_C_261001`
- THEN responde `200` y el ticket queda con el código nuevo

#### Scenario: un ticket sin código acepta cualquier valor — ROJO
- GIVEN un no administrador y un ticket con código nulo, y otro con código vacío
- WHEN ejecuta `ingreso_a_servicio` en cada uno con un código cualquiera
- THEN responde `200` en los dos y los tickets quedan con ese código

#### Scenario: un cargo de dirección no exime — ROJO
- GIVEN un usuario no administrador de `Servicio Técnico` con cargo `Director Técnico` y un ticket con código
- WHEN ejecuta `ingreso_a_servicio` con un código distinto
- THEN responde `403`

#### Scenario: un código vacío no dispara la guarda — CARACTERIZACIÓN
- GIVEN un no administrador y un ticket con código
- WHEN ejecuta `ingreso_a_servicio` con `Código Servicio` igual a `''`
- THEN responde `422` de campo obligatorio, no `403`

#### Scenario: un código de sólo espacios es un cambio — ROJO
- GIVEN un no administrador y un ticket con código
- WHEN ejecuta `ingreso_a_servicio` con `Código Servicio` igual a `'   '`
- THEN responde `403` y el código guardado no cambia

#### Scenario: sin la clave, o en una transición que no la lleva, la guarda no interviene — CARACTERIZACIÓN
- GIVEN un no administrador y un ticket con código
- WHEN ejecuta una transición que no declara `Código Servicio` con ese campo en el cuerpo, y otra que sí la declara sin la clave
- THEN la guarda no interviene en ninguna y la primera ignora el valor como hoy

#### Scenario: la guarda no depende del cliente — ROJO
- GIVEN una petición construida a mano con un código distinto sobre un ticket con código
- WHEN la envía un no administrador
- THEN responde `403`, sin pasar por la pantalla

### RQ-TS-66 · Traza del cambio del administrador: valor previo y valor nuevo, en la fila que ya existe

Cuando un administrador cambia un código **ya fijado** a uno **distinto** (comparados recortados), la fila de
`ticket_transitions` de esa transición —que ya guarda quién, cuándo y el valor nuevo
(`packages/zoho-sync/src/db/repo.ts:317`)— **SHALL** guardar además el **valor previo** en sus `values` (SUPUESTO S-5). El
valor previo **SHALL** ser el del ticket leído en el servidor —nunca el que envía el cliente—, en la misma lectura que usan
las guardas de la transición; la traza **SHALL** escribirse en la misma transacción que el cambio (RQ-TS-10). **MUST NOT** añadirse tabla ni columna (SUPUESTO S-5; la tabla
propia y la ruta propia son P-3). La clave concreta de `values` la fija el diseño.

La traza **SHALL NOT** registrar valor previo cuando no hubo cambio: el primer código de un ticket sin él, el reenvío del mismo
valor recortado y la transición de un administrador que no toca el código. En esos casos la fila queda como hoy.

Un cambio hecho por la **vía normal de fijar el primero** (ticket sin código) no es un cambio de administrador y no lleva
valor previo, lo ejecute quien lo ejecute.

#### Scenario: el administrador cambia el código y la traza guarda el previo y el nuevo — ROJO
- GIVEN un administrador y un ticket con código `MT_A_B_261001`
- WHEN ejecuta `ingreso_a_servicio` con `MT_A_C_261001`
- THEN la fila nueva de `ticket_transitions` trae quién y cuándo, el valor nuevo `MT_A_C_261001` y el previo `MT_A_B_261001`

#### Scenario: el primer código no deja valor previo — ROJO
- GIVEN un ticket sin código y cualquier usuario
- WHEN ejecuta `ingreso_a_servicio` con un código
- THEN la fila de `ticket_transitions` trae el valor nuevo y ningún valor previo

#### Scenario: el administrador reenvía el mismo valor y no se anota previo — ROJO
- GIVEN un administrador y un ticket con código `MT_A_B_261001`
- WHEN ejecuta `ingreso_a_servicio` con `  MT_A_B_261001  `
- THEN responde `200` y la fila no trae valor previo

#### Scenario: el 403 no deja traza — ROJO
- GIVEN un no administrador que manda un código distinto
- WHEN el servidor responde `403`
- THEN no hay fila en `ticket_transitions` ni valor previo guardado en ningún sitio

#### Scenario: el valor previo es el del ticket leído en el servidor, no el que mandó el cliente — ROJO
- GIVEN un administrador cuyo cuerpo incluye un campo extra que simula un «valor previo»
- WHEN ejecuta `ingreso_a_servicio` con un código distinto
- THEN el valor previo guardado es el del ticket y no el del cuerpo

### RQ-TS-67 · Posición de la guarda del código de servicio, fijada por pruebas de posición

La guarda de RQ-TS-65 **SHALL** evaluarse como **`403` de escalón B** (A < B < C < D, RQ-TS-06, F1B-10): **después** de los
`409` de flujo y de estado, de los de interruptor (Control de calidad y `SALIDAS_ESPERAS`) y del de la condición (1) de la
calibración directa (RQ-TS-54), y **después** del `403` de área; **antes** de todo `422` (el agregado de contenido) y antes de
los `409` de unicidad (escalón D). El sitio exacto entre el `403` de área y el primer `422`, frente a los demás `403` de cargo
y de firmante, **lo fija el diseño**, sin desplazar las líneas citadas de `apps/desk/server/services/ticketService.ts`; sólo
las cinco posiciones de abajo son normativas y **MUST** tener prueba que **active las dos guardas a la vez** y se ponga roja si
la guarda se mueve (regla de mutación 1), con M0 verde primero.

Frente a `cambiaPrioridadSinPermiso` (RQ-TS-22) el orden **no es observable**: ninguna transición lleva a la vez `priority` y
`Código Servicio`, así que no hay prueba que lo fije y **MUST NOT** fingirse una; queda dicho en el diseño. Esta tabla no
edita la de RQ-TS-06: la guarda se lee como una más del escalón B en su fila 5.

#### Scenario: PCS-1 el 403 de área gana al del código — ROJO por posición
- GIVEN un usuario sin el área `Servicio Técnico` y un ticket con código
- WHEN ejecuta `ingreso_a_servicio` con un código distinto
- THEN el `403` nombra el área, no el código

#### Scenario: PCS-2 el 403 del código gana al 422 del agregado — ROJO por posición
- GIVEN un no administrador de `Servicio Técnico`, un ticket con código, un código distinto y además un campo obligatorio ausente (p. ej. una fecha requerida)
- WHEN ejecuta `ingreso_a_servicio`
- THEN responde `403` del código, no `422`; con el mismo código y un administrador, o con el código igual, responde el `422`

#### Scenario: PCS-3 el 409 de la condición (1) de `calibracion_directa` gana al 403 del código — ROJO por posición
- GIVEN un no administrador, un ticket con código **sin** orden de venta asignada (condición (1) incumplida), y un código distinto
- WHEN ejecuta `calibracion_directa`
- THEN responde el `409` de la condición, no `403`; con la condición cumplida responde el `403` del código

#### Scenario: PCS-4 el 409 de estado gana al 403 del código — ROJO por posición
- GIVEN un ticket fuera de los estados de origen de la transición y un no administrador con un código distinto
- WHEN ejecuta `ingreso_a_servicio`
- THEN responde `409`, no `403`

#### Scenario: PCS-5 el 409 del interruptor del atajo gana al 403 del código — ROJO por posición
- GIVEN un no administrador, un ticket con código, un código distinto y el interruptor de `calibracion_directa` apagado
- WHEN ejecuta `calibracion_directa`
- THEN responde el `409` del interruptor, no `403`

Frente a los `409` de unicidad (escalón D) el orden **tampoco es observable** hoy: ni `ingreso_a_servicio` ni
`calibracion_directa` llevan orden de venta (`packages/shared/src/transitions.ts:191`, `:262`), así que la posición
«antes de D» la da el orden total de RQ-TS-06 y **MUST NOT** fingirse una prueba.
