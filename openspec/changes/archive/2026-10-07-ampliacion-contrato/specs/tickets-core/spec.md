# Delta for `tickets-core`

Cambio `ampliacion-contrato` (F1B-11, `cierra: si`). Sin capacidad nueva. Añade la ampliación del contrato: la regla
del tope, quién la registra con qué orden de guardas y con qué traza, y su efecto en las tres puertas del contrato
vencido (`RQ-TC-25`). `RQ-TC-25` no cambia de requisito: ya habla de «la fecha de fin», que tras ampliar es la vigente.
De `RQ-TC-21` sólo cambia en sitio una frase, sin alterar su número de líneas. Supuestos declarados en la propuesta
(S-1 a S-10) y reversibles; los que el texto aplica van nombrados.

## ADDED Requirements

### RQ-TC-53 · La ampliación del contrato: hasta el 31/12 del año natural del vencimiento, sólo alarga, varias veces, con el plazo abierto hasta ese día

El **tope** de una ampliación **SHALL** ser el **31/12 del año natural de la fecha de fin original del contrato**. El año
**SHALL** leerse de los cuatro primeros dígitos de la fecha civil `AAAA-MM-DD`, sin pasarla por un instante UTC (un
vencimiento el 01/01 **MUST NOT** contar en el año anterior). Como el tope cae en el mismo año que el vencimiento, la
fecha original y la vigente tienen siempre el mismo año: ampliar varias veces no mueve el tope.

Una ampliación **SHALL** fijar una nueva fecha de fin que cumpla las **cuatro** condiciones siguientes, y la regla
**SHALL** vivir como función pura de dominio en `packages/shared` —sin base de datos— consumida por la ruta, sin
reescribirse (regla invariable 13; mismo lugar que `estadoContrato`, `packages/shared/src/contratos.ts:41`):

1. la fecha nueva es un día real `AAAA-MM-DD` (mismo criterio que `fechaCalendario`, `packages/shared/src/contratos.ts:34`);
2. la fecha nueva es **estrictamente posterior** a la fecha de fin **vigente** (una ampliación sólo alarga: no acorta, no
   corrige, no repite la misma fecha; supuesto S-3);
3. la fecha nueva **no pasa** del tope (el propio 31/12 es válido);
4. el plazo sigue abierto: **hoy** no es posterior al tope. Hoy es el día civil en la **zona de negocio** de `RQ-TC-22`
   (`hoyEnZona`, `packages/shared/src/contratos.ts:61`), **nunca** el día UTC. El plazo se cierra por el **día** de
   negocio, no por la hora: el 31/12 entero se puede ampliar (supuesto S-10).

Se **PUEDE** ampliar el mismo contrato más de una vez, mientras cada fecha nueva sea posterior a la vigente y no pase del
tope (supuesto S-2). Un contrato **no iniciado**, **vigente** o **vencido** es ampliable por igual: la regla no mira la
fecha de inicio (supuesto S-7). Cuando la regla rechaza, devuelve el mensaje del rechazo; cuando la ampliación cabe, no
devuelve ninguno. Los motivos se evalúan **en este orden**: fecha inválida, no posterior a la vigente, pasa del tope,
plazo cerrado. La fecha de fin vigente es la columna del contrato; la **original** no se pierde (`RQ-TC-54`).

#### Scenario: El vencimiento el 31/12 no admite ampliación

- GIVEN un contrato cuya fecha de fin vigente es `2026-12-31` y un hoy de `2026-12-15`
- WHEN se pide ampliarlo a `2027-01-01`, y luego a `2026-12-31`
- THEN las dos peticiones se rechazan: la primera por pasar del tope (`2026-12-31`), la segunda por no ser posterior a la
  vigente; el tope es el propio día y no cabe ninguna fecha entre ambas condiciones

#### Scenario: El vencimiento el 01/01 tiene tope el 31/12 de ese mismo año

- GIVEN un contrato cuya fecha de fin vigente es `2026-01-01` y un hoy de `2026-01-05`
- WHEN se pide ampliarlo a `2026-12-31`
- THEN la ampliación se acepta, porque el año es `2026` y no `2025`; y una petición a `2027-01-01` se rechaza por pasar del tope

#### Scenario: Una fecha el 01/01 del año siguiente al vencimiento se rechaza

- GIVEN un contrato con fecha de fin `2026-06-30` y un hoy de `2026-07-02`
- WHEN se pide ampliarlo a `2027-01-01`
- THEN se rechaza por pasar del tope, y `2026-12-31` sí se acepta

#### Scenario: Un instante que en UTC ya es 01/01 y en la zona de negocio sigue siendo 31/12 todavía permite ampliar

- GIVEN un contrato con fecha de fin `2026-12-20` y el reloj en el instante `2027-01-01T03:00:00Z`, que en la zona de
  negocio (UTC-5) es el `2026-12-31` a las 22:00
- WHEN se pide ampliarlo a `2026-12-31`
- THEN la ampliación se acepta, porque hoy en la zona de negocio es `2026-12-31` y no es posterior al tope; y con el reloj
  en `2027-01-01T05:00:00Z` (ya `2027-01-01` en la zona de negocio) la misma petición se rechaza por plazo cerrado

#### Scenario: Una ampliación sólo alarga

- GIVEN un contrato con fecha de fin vigente `2026-06-30` y un hoy anterior al tope
- WHEN se pide fijar la fecha de fin a `2026-06-30` (la misma), a `2026-06-01` (anterior), y luego a `2026-07-31`
- THEN las dos primeras se rechazan por no ser posteriores a la vigente y la tercera se acepta

#### Scenario: Se puede ampliar varias veces dentro del tope, y el tope no se mueve

- GIVEN un contrato con fecha de fin original `2026-03-31` ya ampliado a `2026-06-30`
- WHEN se pide una segunda ampliación a `2026-12-31`, y después otra a `2027-01-01`
- THEN la segunda se acepta, la tercera se rechaza por pasar del tope (`2026-12-31`, el mismo de la original), y la
  fecha de fin vigente queda en `2026-12-31`

#### Scenario: Con el plazo vencido no se amplía, aunque la fecha pedida cupiera

- GIVEN un contrato con fecha de fin `2026-06-30` y un hoy de `2027-01-02` en la zona de negocio
- WHEN se pide ampliarlo a `2026-09-30`, que es posterior a la vigente y no pasa del tope
- THEN se rechaza por plazo cerrado

#### Scenario: Una fecha que no es un día real se rechaza

- GIVEN un contrato ampliable
- WHEN se pide ampliarlo a `2026-02-30`, a un texto libre, o sin fecha
- THEN cada caso se rechaza como fecha inválida

#### Scenario: El orden de los motivos está fijado por prueba

- GIVEN una petición que cumple a la vez dos motivos de rechazo
- WHEN se evalúa
- THEN gana el que va antes en el orden de la regla: una fecha inválida antes que cualquier otro; «no posterior» antes que
  «pasa del tope»; y «pasa del tope» antes que «plazo cerrado»

#### Scenario: Un contrato no iniciado o ya vencido también se amplía

- GIVEN un contrato aún no iniciado y otro vencido hace un mes, ambos con tope en el futuro
- WHEN se pide una fecha nueva válida para cada uno
- THEN las dos ampliaciones se aceptan

### RQ-TC-54 · `POST /api/contratos/:id/ampliar`: lo registra Comercial, con la escalera A < B < C < D, y deja traza sin borrar la fecha original

El sistema **SHALL** exponer `POST /api/contratos/:id/ampliar` con cuerpo `{ fechaFin, motivo }`. Se **SHALL** registrar
en el **servidor** únicamente por el área Comercial o un administrador, consumiendo el mismo predicado
`canExecuteTransition(user.areas, user.isAdmin, 'Comercial')` de `@ambientalia/shared` que ya usa el alta del contrato
(`apps/desk/server/routes/contratos.ts:43`; regla invariable 13: el botón del cliente es comodidad, la imposición es la del
servidor). La ruta **SHALL** seguir el orden de precedencia de `transitions-st` §3.8, **fijado por prueba para cada par
vecino con las dos guardas activas a la vez**:

| Escalón | Guarda | Respuesta |
|---|---|---|
| A · existencia | el id no es numérico o el contrato no existe (mismo criterio que `apps/desk/server/routes/contratos.ts:31`) | `404` |
| B · permiso | sin área Comercial ni administrador | `403` |
| C · contenido | el rechazo de la regla de `RQ-TC-53`, en su orden; y después el motivo vacío | `422` |
| D · unicidad | la fecha de fin vigente cambió entre la lectura y la escritura | `409` |

El **motivo SHALL ser obligatorio**: un motivo ausente o de sólo espacios se rechaza con `422`, y se guarda recortado y sin
límite de longitud (supuestos S-1 y S-9; **la fuente no lo exige**, se pide por coherencia con liberar y reasignar). Es
la última guarda de C: una fecha inválida y un motivo vacío a la vez dan el mensaje de la fecha. El permiso **SHALL**
decidirse antes de leer el cuerpo.

Aceptada la petición, el sistema **SHALL** escribir, en **una sola transacción** (`enTransaccion`,
`apps/desk/server/db/transaccion.ts:13`), dos cosas: la nueva fecha de fin **condicionada a la fecha leída** (si otra
ampliación cambió la fecha entre la lectura y la escritura, no se escribe nada y responde `409`) y una **fila de traza** en una
tabla propia del esquema `public` (`public.contrato_ampliaciones`, creada con `CREATE` calificado), con: quién (la
persona de la **sesión**, nunca la del cuerpo), cuándo, fecha anterior, fecha nueva y motivo. La traza **MUST NOT** tener
`DELETE` ni clave foránea hacia el contrato, como `public.reasignaciones`. La fecha de fin del contrato **SHALL**
pasar a ser la **vigente**; la **original no se borra**: es la fecha anterior de la primera fila de traza del contrato.

`GET /api/contratos/:id` **SHALL** devolver, además de `contrato`, `estado` y `saldo` —que **MUST NOT** cambiar—, dos
campos aditivos: `ampliaciones` (la traza del contrato, en el orden en que ocurrieron, con quién, cuándo, fecha
anterior, fecha nueva y motivo) y `fechaFinOriginal`. Sin ampliaciones, `fechaFinOriginal` es igual a la fecha de fin
y **nunca** es nulo (supuesto S-8). La traza la lee cualquier usuario con sesión, como la ficha (supuesto S-6;
`apps/desk/server/routes/contratos.ts:28`).

#### Scenario: Comercial amplía un contrato y queda la traza

- GIVEN un usuario del área Comercial y un contrato con fecha de fin `2026-06-30`, con un hoy anterior al tope
- WHEN pide ampliarlo a `2026-09-30` con el motivo «Prórroga acordada con el cliente»
- THEN responde éxito, la fecha de fin vigente pasa a `2026-09-30` y queda una fila de traza con la persona de la
  sesión, la hora, fecha anterior `2026-06-30`, fecha nueva `2026-09-30` y ese motivo

#### Scenario: Un administrador puede ampliar sin ser de Comercial

- GIVEN un administrador sin el área Comercial
- WHEN pide una ampliación válida
- THEN responde éxito

#### Scenario: Sin área Comercial ni administración se rechaza con 403 y no se escribe nada

- GIVEN un usuario con sesión sin Comercial y que no es administrador, sobre un contrato existente
- WHEN pide una ampliación válida
- THEN responde `403`, la fecha de fin no cambia y no se crea ninguna fila de traza, aunque el cliente web no le muestre el botón

#### Scenario: El 404 gana al 403 — posición fijada por prueba

- GIVEN un id de contrato que no existe, y un usuario sin Comercial ni administración
- WHEN manda una petición de ampliación
- THEN responde `404`, no `403`; un id no numérico responde `404` sin llegar a la base

#### Scenario: El 403 gana al 422 — posición fijada por prueba

- GIVEN un contrato existente
- WHEN un usuario sin Comercial manda una ampliación con cuerpo inválido (fecha mala y motivo vacío)
- THEN responde `403`; y cuando un usuario Comercial manda ese mismo cuerpo, responde `422`

#### Scenario: El 422 gana al 409 — posición fijada por prueba

- GIVEN un contrato al que otra ampliación cambia la fecha de fin entre la lectura y la escritura
- WHEN un usuario Comercial manda un cuerpo de contenido inválido
- THEN responde `422`, no `409`; y con un cuerpo válido sobre esa misma carrera responde `409`

#### Scenario: Dos ampliaciones simultáneas — la segunda responde 409 y la traza no miente

- GIVEN dos peticiones válidas leídas contra la misma fecha de fin vigente
- WHEN la primera escribe y la segunda intenta escribir con la fecha que leyó
- THEN la segunda responde `409`, no pisa la fecha de la primera y no deja fila de traza

#### Scenario: Un motivo vacío o sólo de espacios se rechaza con 422

- GIVEN un usuario Comercial y una fecha válida
- WHEN manda el motivo ausente, vacío o de espacios
- THEN responde `422` y no se escribe nada; con una fecha inválida y el motivo vacío, el mensaje es el de la fecha

#### Scenario: El motivo se guarda recortado, sin límite de longitud

- GIVEN una ampliación válida con el motivo `  Prórroga  ` seguido de un texto de varios miles de caracteres
- WHEN se acepta
- THEN la traza guarda el motivo sin espacios en los extremos y sin truncar su longitud

#### Scenario: Quién amplía es la sesión, no el cuerpo

- GIVEN un cuerpo que además de `fechaFin` y `motivo` trae un campo con otro nombre de persona
- WHEN se acepta la ampliación
- THEN la traza guarda el nombre de la persona de la sesión

#### Scenario: Lo que falla no deja a medias fecha y traza

- GIVEN una ampliación cuya escritura de la traza falla, o cuya escritura de la fecha no cambia ninguna fila
- WHEN se procesa
- THEN no queda ni la fecha nueva sin traza ni la traza sin fecha nueva

#### Scenario: La ficha enseña la traza y la fecha original

- GIVEN un contrato con fecha de fin original `2026-03-31`, ampliado a `2026-06-30` y después a `2026-09-30`
- WHEN un usuario con sesión pide `GET /api/contratos/:id`
- THEN `ampliaciones` trae dos filas en orden, con quién, cuándo, fecha anterior, fecha nueva y motivo; `fechaFinOriginal`
  es `2026-03-31` (la fecha anterior de la **primera** fila, no de la última); y `contrato`, `estado` y `saldo` son los de hoy

#### Scenario: Sin ampliaciones, la fecha original es la de fin

- GIVEN un contrato nunca ampliado
- WHEN un usuario sin área Comercial pide su ficha
- THEN `ampliaciones` viene vacío y `fechaFinOriginal` es igual a la fecha de fin, nunca nulo; sin sesión responde `401`

#### Scenario: Ningún flujo borra una ampliación

- GIVEN el código de este cambio
- WHEN se busca una sentencia `DELETE` sobre `public.contrato_ampliaciones`
- THEN no existe ninguna

### RQ-TC-55 · Una ampliación desbloquea las tres puertas del contrato vencido hasta la fecha nueva, y al pasarla vuelven a bloquear, sin tocar las puertas

Las tres puertas de la guarda de contrato vencido de `RQ-TC-25` —el **alta** del ticket
(`apps/desk/server/services/ticketService.ts:96`), las **transiciones**
(`apps/desk/server/services/ticketService.ts:147`) y la **remisión** de entrada (`apps/desk/server/routes/remision.ts:220`)—
**SHALL** leer la fecha de fin **vigente**, de modo que un contrato vencido y después ampliado **MUST NOT** dar «contrato
vencido» en ninguna de las tres **hasta** la fecha nueva, y pasada esa fecha **SHALL** volver a bloquear en las tres. Ninguna
puerta cambia de código ni de escalón: el efecto es una consecuencia de que la fecha de fin vigente cambia. El informe
trimestral y el aviso de ritmo calculan desde esa misma fecha vigente y no se alteran.

La ampliación **MUST NOT** reiniciar la marca del aviso de ritmo del contrato: la marca sólo sube, y una ampliación
corta **alarga el trimestre ya avisado** en vez de abrir otro, así que en ese tramo no habrá aviso nuevo (supuesto S-4,
declarado, pregunta abierta de Gerencia). Ampliar **MUST NOT** generar un aviso (supuesto S-5). Las pruebas de posición
existentes —`apps/desk/server/remisiones.test.ts:988` y `ordenVentaUnTicket.test.ts`— **MUST NOT** cambiar sus aserciones.

#### Scenario: Un contrato vencido y ampliado deja pasar la subOV en el alta

- GIVEN una subOV canónica de un lote con contrato vencido, y el contrato ampliado con la ruta real a una fecha futura
- WHEN se crea un ticket con esa OV antes de la fecha nueva
- THEN no responde `422` por contrato vencido y el alta sigue su curso

#### Scenario: Un contrato vencido y ampliado deja pasar la subOV en la transición

- GIVEN un ticket cuya OV adicional es una subOV de un lote con contrato vencido, ampliado con la ruta real
- WHEN se ejecuta la transición antes de la fecha nueva
- THEN no responde `422` por contrato vencido

#### Scenario: Un contrato vencido y ampliado deja pasar la subOV en la remisión

- GIVEN una remisión de entrada con una subOV de un lote con contrato vencido, ampliado con la ruta real
- WHEN se registra antes de la fecha nueva
- THEN no responde `422` por contrato vencido

#### Scenario: Pasada la fecha nueva, las tres puertas vuelven a bloquear

- GIVEN un contrato ampliado hasta `2026-09-30`
- WHEN el día de negocio es `2026-10-01` y se intenta el alta, la transición y la remisión con una subOV de ese lote
- THEN las tres responden `422` con el motivo de contrato vencido, que cita la fecha de fin vigente

#### Scenario: El día de la fecha nueva todavía no bloquea

- GIVEN un contrato ampliado hasta `2026-09-30`
- WHEN el día de negocio es `2026-09-30`
- THEN ninguna de las tres puertas lo da por vencido, porque la fecha de fin está incluida (`RQ-TC-22`)

#### Scenario: Las pruebas existentes de las puertas no cambian

- GIVEN `apps/desk/server/remisiones.test.ts:988` y las pruebas de contratos tal como existen hoy
- WHEN se ejecutan tras este cambio
- THEN pasan sin modificar sus casos

## MODIFIED Requirements

### RQ-TC-21 · Registro de contrato: cliente, lote, inicio y fin; uno por lote; lo crea Comercial

El sistema **SHALL** persistir el contrato en una tabla propia del esquema `public` (`public.contratos`,
supuesto S-1), con una fila por contrato: cliente (id de `public.clients`, sin clave foránea porque es
réplica de Books), lote (`OV-AAAA-NNN`, mismo formato que acepta `apps/desk/server/routes/ovAsociaciones.ts:21` en `285ecf4`),
fecha de inicio, fecha de fin, y —como traza— persona y fecha de alta. **Ningún** campo del contrato es
opcional. El sistema **SHALL** admitir a lo sumo **un** contrato por lote, impuesto por una restricción de
unicidad de base de datos sobre el lote. El lote **MAY** no existir aún en Books (supuesto S-1): registrar
el contrato no exige que haya subOV creadas.

Crear un contrato **SHALL** exigir en el **servidor** el área Comercial o ser administrador
(supuesto S-2), consumiendo `canExecuteTransition(user.areas, user.isAdmin, 'Comercial')` de
`@ambientalia/shared`, el mismo patrón de `routes/ovAsociaciones.ts:47` (regla invariable 13: el botón
del cliente es comodidad, la imposición es la del servidor). Leer contratos y su ficha **SHALL** estar
abierto a cualquier usuario con sesión (supuesto reversible, como las lecturas de
`routes/ovAsociaciones.ts:13-14`). La fecha de fin sólo cambia por la ampliación de `RQ-TC-53`; no hay otra edición del contrato.

El alta **SHALL** seguir el orden de precedencia de `transitions-st` §3.8: permiso (`403`, escalón B) antes
de contenido (`422`: campo ausente, lote con formato inválido, fecha inválida, cliente inexistente, fecha
de fin anterior a la de inicio; escalón C) antes de unicidad (`409` por lote ya registrado; escalón D).

Ningún flujo **SHALL** ejecutar `DELETE` sobre `public.contratos` (supuesto: la baja queda fuera; la
ampliación de `RQ-TC-53` cambia la fecha de fin y no borra nada).

#### Scenario: Comercial registra un contrato

- GIVEN un usuario del área Comercial y un cliente existente
- WHEN crea un contrato con lote `OV-2026-170`, inicio `2026-01-15` y fin `2026-12-31`
- THEN responde éxito y el contrato queda guardado con su persona y fecha de alta

#### Scenario: Sin área Comercial ni administración, el alta se rechaza con 403

- GIVEN un usuario con sesión cuya área no incluye Comercial y que no es administrador
- WHEN intenta crear un contrato con datos válidos
- THEN responde `403` y no se crea ninguna fila, aunque el cliente web no le muestre el botón

#### Scenario: Un administrador puede crear

- GIVEN un administrador sin el área Comercial
- WHEN crea un contrato con datos válidos
- THEN responde éxito

#### Scenario: Un segundo contrato para el mismo lote responde 409

- GIVEN un contrato ya registrado para el lote `OV-2026-170`
- WHEN Comercial intenta registrar otro contrato con ese lote, aunque sea de otro cliente
- THEN responde `409` y la fila existente no cambia

#### Scenario: Contenido inválido responde 422

- GIVEN un usuario Comercial
- WHEN crea un contrato con lote `OV-2026-170-01` (formato de subOV), o con fin anterior al inicio, o sin
  fecha de fin, o con un cliente que no existe
- THEN cada caso responde `422` y no se crea ninguna fila

#### Scenario: El permiso gana al contenido, y el contenido a la unicidad — posición fijada por prueba

- GIVEN un lote ya registrado
- WHEN un usuario sin Comercial manda un alta con contenido inválido para ese lote
- THEN responde `403`; y cuando un usuario Comercial manda un alta con contenido inválido para ese mismo
  lote ya registrado, responde `422`, no `409`

#### Scenario: Cualquier usuario con sesión lee, sin sesión no

- GIVEN un contrato registrado
- WHEN lo consulta un usuario con sesión sin área Comercial, y luego una petición sin sesión
- THEN la primera devuelve el contrato y la segunda responde `401`

