# Delta de `remisiones` · rotulado-tras-enviar (F1B-04, `cierra: no`)

Medido sobre `a947b48`. Las líneas citadas de `openspec/specs/remisiones/spec.md` son de esa revisión. Cada requisito MODIFIED conserva su número de líneas (regla de mutación 4): se edita en sitio.

## ADDED Requirements

### Requirement: RQ-RE-40 · El rotulado se confirma después de enviar, una sola vez, con traza, y no bloquea nada

Una acción del servidor, `POST /api/remisiones/:id/rotulado`, **SHALL** confirmar el
rotulado de una remisión de **entrada del formulario nuevo** (`novedades` no nulo, RQ-RE-27), **enviada con éxito** (`ok` u
`ok_con_avisos`, RQ-RE-05) y no anulada. **SHALL** escribir `rotulado_at` (reloj del servidor) y `rotulado_por` (nombre del
usuario de la sesión) con **un único `UPDATE` condicional** a `rotulado_at IS NULL`, y responder `200` con la remisión. No se
deshace desde la aplicación (S2) y no lleva cuerpo que validar: el cuerpo **SHALL** ignorarse (el escalón C queda vacío).

Las guardas **SHALL** cortar en este **orden total**, A < B < D (regla de mutación 1). Los códigos siguen a las rutas vecinas
de `apps/desk/server/routes/remision.ts`: `403` como `:91`, `409` de anulada como `:280`, `422` de precondición como `:302`.

| Orden | Escalón | Guarda | Respuesta |
|---|---|---|---|
| 0 | — | Sin sesión (`requireAuth`, `apps/desk/server/auth/middleware.ts:17` y `:19`) | `401` |
| 1 | A | La remisión no existe | `404` |
| 2 | B | Sin el área Servicio Técnico y sin ser administrador (S1) | `403` |
| 3 | B | Anulada | `409` |
| 4 | B | De legado (`novedades` `NULL`) | `422` |
| 5 | B | Sin envío con éxito (`pendiente` o `error`) | `422` |
| 6 | D | Ya confirmada (`rotulado_at` no nulo) | `409` |

Los dos `422` y los dos `409` **SHALL** llevar texto propio que nombre su causa. Una confirmación hecha **MUST NOT** borrarse si
después llega un callback con `error` (S11). **Ninguna** transición, guarda de transición ni alarma **MUST** leer `rotulado_at`
ni `rotulado_por`: confirmar o no confirmar no cambia qué transición se ofrece ni se admite.

#### Scenario: [R40-a] Confirma tras un envío `ok` u `ok_con_avisos` y escribe la traza del servidor
- GIVEN un usuario del área Servicio Técnico, una remisión nueva en `ok` y otra en `ok_con_avisos`, y un cuerpo con `rotuladoPor: 'Otra Persona'` y `rotuladoAt: '2020-01-01T00:00:00Z'`
- WHEN confirma cada una
- THEN responde `200`, `rotuladoPor` es el nombre de la sesión y `rotuladoAt` cae entre el instante anterior y el posterior a la petición

#### Scenario: [R40-b] Un administrador sin área confirma; quien tiene otra área no
- GIVEN una remisión nueva en `ok`, un administrador sin el área Servicio Técnico y un usuario con otra área
- WHEN cada uno confirma
- THEN el administrador recibe `200` y el otro `403` sin escribir nada

#### Scenario: [R40-c] Repetir responde 409 y no reescribe la traza
- GIVEN una remisión ya confirmada por una persona
- WHEN otra persona la confirma de nuevo, o dos confirmaciones llegan a la vez sobre una sin confirmar
- THEN la repetida responde `409` con `rotulado_por` y `rotulado_at` intactos, y de las dos simultáneas exactamente una gana

#### Scenario: [R40-d1] Sin sesión gana a la inexistente — 401 < 404
- GIVEN un id inexistente y una petición sin sesión
- WHEN se llama la acción
- THEN responde `401`, no `404`

#### Scenario: [R40-d2] La inexistente gana al permiso — A < B
- GIVEN un id inexistente y un usuario sin el área ni administrador
- WHEN se llama la acción
- THEN responde `404`, no `403`

#### Scenario: [R40-d3] El permiso gana a la anulada
- GIVEN una remisión anulada y un usuario sin el área ni administrador
- WHEN se llama la acción
- THEN responde `403`, no el `409` de anulada

#### Scenario: [R40-d4] La anulada gana a la de legado
- GIVEN una remisión de legado anulada, y un usuario autorizado
- WHEN se llama la acción
- THEN responde el `409` de anulada, no el `422` de legado

#### Scenario: [R40-d5] La de legado gana a la que no se envió con éxito
- GIVEN una remisión de legado en `pendiente`, y un usuario autorizado
- WHEN se llama la acción
- THEN responde el `422` de legado, no el de «sin envío con éxito»

#### Scenario: [R40-d6] «Sin envío con éxito» gana a «ya confirmada» — B < D
- GIVEN una remisión del formulario nuevo en `error` que conserva `rotulado_at` (S11), y un usuario autorizado
- WHEN se llama la acción
- THEN responde el `422` de «sin envío con éxito», no el `409` de ya confirmada, y la traza no cambia

#### Scenario: [R40-e] El rotulado sin confirmar no bloquea la transición
- GIVEN una remisión nueva sin confirmar y un callback `ok` que cierra el recuento de confirmadas (RQ-RE-11)
- WHEN llega el callback
- THEN el ticket pasa a «Remisión creada» con `rotulado_at` en `NULL`

#### Scenario: [R40-f] Un callback `error` posterior no borra la confirmación
- GIVEN una remisión nueva confirmada y reenviada después
- WHEN llega un callback con `error`
- THEN `rotulado_at` y `rotulado_por` siguen como estaban

### Requirement: RQ-RE-41 · «Pendiente de rotular» la calcula el servidor y no bloquea nada

La remisión que devuelve la API —por ticket (`apps/desk/server/routes/remision.ts:97-102`) y por id (`:110-114`)— **SHALL** llevar un
booleano `pendienteRotular`, calculado por una función pura de `packages/shared`
(regla invariable 13). Es **verdadero** si y sólo si la remisión es del formulario nuevo (`novedades` no nulo), está enviada con
éxito (`ok` u `ok_con_avisos`), no está anulada y `rotulado_at` es `NULL`. El cliente **SHALL** pintarlo y **MUST NOT** recalcularlo.
**MUST NOT** entrar en ninguna guarda ni alarma: informa, no alarma (S3).

| Caso | Resultado |
|---|---|
| `pendiente` o `error`, sin `rotulado_at` | falso |
| `ok`, sin `rotulado_at` | verdadero |
| `ok_con_avisos`, sin `rotulado_at` | verdadero |
| `ok` o `ok_con_avisos`, con `rotulado_at` | falso |
| `ok` anulada, sin `rotulado_at` | falso |
| `ok` de legado (`novedades` `NULL`) | falso |
| Creada antes del despliegue (ya trae `rotulado_at`), enviada después (S5) | falso |

#### Scenario: [R41-a] Cada caso de la tabla da su resultado
- GIVEN una remisión por cada fila de la tabla
- WHEN se calcula `pendienteRotular`
- THEN el resultado es el de la columna «Resultado»

#### Scenario: [R41-b] El campo viaja en las dos lecturas y pasa a falso al confirmar
- GIVEN una remisión nueva en `ok` sin confirmar
- WHEN se lee por ticket y por id, se confirma (RQ-RE-40) y se lee otra vez
- THEN las dos primeras lecturas traen `pendienteRotular = true` y la tercera `false`

#### Scenario: [R41-c] La marca y la acción dicen lo mismo
- GIVEN una remisión por cada fila de la tabla y un usuario del área Servicio Técnico
- WHEN se lee su `pendienteRotular` y se intenta confirmar (RQ-RE-40)
- THEN la acción responde `200` si y sólo si la marca era verdadera

#### Scenario (MANUAL, de persona) · Lo que ve el técnico antes y después de enviar
- GIVEN el formulario de entrada, tras desplegar · WHEN el técnico crea y envía una remisión · THEN no hay casilla de rotulado, la pantalla de resultado dice que el equipo está pendiente de rotular y ofrece «Confirmar rotulado y guardado»
- AND si cierra sin confirmar, la tarjeta de la remisión en el ticket muestra «Pendiente de rotular» con el botón, y tras confirmar muestra quién y cuándo. **Dueño:** Servicio Técnico. **ARCHIVAR ESTE CAMBIO NO LO DA POR HECHO.**

### Requirement: RQ-RE-42 · El envío guarda quién envía

`public.remisiones` **SHALL** tener la columna `enviado_por_id text`, `NULL`-able y sin relleno de lo anterior. El envío que **gana**
la reclamación (`reclamarEnvio`, RQ-RE-07) **SHALL** escribirla con el id del usuario de la sesión; un reenvío **SHALL**
sobrescribirla; el envío que **pierde** la reclamación y la puerta de contenido (RQ-RE-08, orden 4) **MUST NOT** escribirla. Se
guarda el id y no el nombre porque `users.name` no es único (`packages/zoho-sync/src/db/schema.sql:85`).

Al final de `packages/zoho-sync/src/db/schema.sql` **SHALL** haber dos sentencias idempotentes, calificadas y sin relleno:
`ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS enviado_por_id text` y
`ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS aviso_sin_etiqueta_at timestamptz` (esta es de RQ-AV-22). El guardián
de `ALTER TABLE` (`packages/zoho-sync/src/db/migrate.test.ts:322`) **SHALL** ponerse rojo si cualquiera se escribe sin calificar.

#### Scenario: [R42-a] El envío ganador guarda a quien envía y un reenvío lo sobrescribe
- GIVEN una remisión enviada por una persona que acaba en `error`, y otra persona que la reenvía
- WHEN cada una gana su reclamación
- THEN `enviado_por_id` es el de la primera y después el de la segunda

#### Scenario: [R42-b] Quien pierde la reclamación o choca con la puerta de contenido no escribe
- GIVEN dos envíos simultáneos de personas distintas, y un envío al que le faltan fotos
- WHEN se resuelven
- THEN `enviado_por_id` es el de quien ganó, y el envío con el `422` no cambia el valor

#### Scenario: [R42-d] Si el disparo no sale, no queda nadie como quien envió
- GIVEN un envío que gana la reclamación y cuyo disparo a n8n falla, de modo que la reclamación se suelta
- WHEN se lee la remisión
- THEN `enviado_por_id` es `NULL`: se conserva sólo si el envío queda reclamado

#### Scenario: [R42-c] El guardián ve una sentencia sin calificar en el fichero vigilado
- GIVEN `schema.sql` con una de las dos sentencias escrita sin `public.`
- WHEN corre `migrate.test.ts`
- THEN el guardián se pone rojo

## MODIFIED Requirements

### RQ-RE-05 · Los cuatro estados, y qué cuenta como confirmada

El estado de una remisión **SHALL** ser uno de cuatro —`pendiente`, `ok`, `ok_con_avisos`, `error`—
declarados en un solo sitio (`packages/shared/src/remision.ts:60`), con etiqueta en español **en
shared y no en la capa de presentación**, porque la necesitan las dos orillas: las pantallas de
remisiones y la historia del ticket, que se compone en el servidor (`:63-67`; mapa en `:78-83`).

- El mapa de etiquetas **SHALL** llevar la anotación `Record<string, string>` **y** el `satisfies
  Record<EstadoRemision, string>` a la vez, y las dos razones **SHALL** quedar escritas: `estado` sale
  de Postgres con un cast sin validar y la columna no tiene `CHECK`, así que indexarlo debe poder
  fallar sin lanzar; y el `satisfies` impide que falte uno de los cuatro conocidos
  (`remision.ts:69-77`).
- `ok_con_avisos` **SHALL** contar como éxito: la remisión se generó pero falló algún paso no crítico —un aviso por
  correo o Telegram, o la etiqueta .dymo, según leyó el analista el 2026-10-12—, y por decisión de producto eso NO invalida la remisión (`db/remisiones.ts:129-131`).

### Requirement: RQ-RE-08 · El cerrojo de reenvío tiene SEIS puertas, en este orden

`POST /:id/enviar` **SHALL** cortar en el orden observable siguiente:

| Orden | Guarda | Respuesta | Evidencia |
|---|---|---|---|
| 1 | La remisión no existe | `404` | `routes/remision.ts:276` |
| 2 | Está anulada | `409` | `:279-281` |
| 3 | Ya está cerrada (`ok` u `ok_con_avisos`) | `409` | `:284-286` |
| 4 | **Contenido del registro de entrada**: en el formulario nuevo, fotos mínimas → foto de cada novedad (RQ-RE-26); en legado, novedad declarada y cero fotos (RQ-RE-27) | `422` | entre la de orden 3 (`:284-286`) y `reclamarEnvio` (`:297`) |
| 5 | Reclamación perdida | `409` | `:297-299` |
| 6 | Sin ticket asociado | `422` | `:302` |

La anulación **SHALL** cortar **antes** de mirar el estado del flujo, porque «generar un documento en Drive de
algo que se acaba de anular sería absurdo» (`:277-278`; probado en `remisiones.test.ts:662`).

La puerta de orden 4 **SHALL** ejecutarse **antes** de `reclamarEnvio` (orden 5) y **MUST NOT** escribir nada ni
reclamar el envío: `reclamarEnvio` es el único `UPDATE` que fija `enviado_at` (`db/remisiones.ts:170-182`), y un
`422` posterior a esa reclamación dejaría la remisión bloqueada durante toda la ventana de reenvío
(`VENTANA_REENVIO_SEGUNDOS`, 120 s). Sigue siendo **una sola** puerta, con una sola posición: lo que cambia es
la regla que aplica según la remisión sea del formulario nuevo o de legado. Encaja en el orden A<B<C<D de
F1B-10: existencia (404), estado y permiso (anulada, ya enviada), **contenido** (fotos mínimas y foto por novedad, o novedad sin
foto), unicidad (reclamación).

#### Scenario: Novedad sin fotos bloquea sin reclamar el envío
- GIVEN una remisión de legado pendiente con `hay_novedad = true` y cero fotos
- WHEN se llama `POST /:id/enviar`
- THEN responde `422`, no dispara a n8n, y `enviado_at` sigue `NULL`

#### Scenario: Reintento inmediato tras subir la foto tiene éxito
- GIVEN el `422` del escenario anterior
- WHEN se sube una foto y se reintenta `POST /:id/enviar` de inmediato
- THEN responde `200`, porque la reclamación nunca se había tomado

#### Scenario: La anulación gana a la puerta de contenido
- GIVEN una remisión anulada, de legado con `hay_novedad = true` y cero fotos, o del formulario nuevo incompleta
- WHEN se llama `POST /:id/enviar`
- THEN responde `409` de anulada, no `422`

#### Scenario: Ya enviada gana a la puerta de contenido
- GIVEN una remisión en `ok`, de legado con `hay_novedad = true` y cero fotos, o del formulario nuevo incompleta
- WHEN se llama `POST /:id/enviar`
- THEN responde `409` de ya enviada, no `422`

#### Scenario: Sin novedad o histórica, cero fotos, se envía como hoy
- GIVEN una remisión de legado con `hay_novedad` en `false` o `null`, y cero fotos
- WHEN se llama `POST /:id/enviar` sin otros bloqueos
- THEN responde `200`, igual que antes de este cambio

#### Scenario: La puerta de contenido va antes de reclamar, también con el formulario nuevo
- GIVEN una remisión del formulario nuevo sin las fotos mínimas
- WHEN se llama `POST /:id/enviar` y, tras el `422`, se completan las fotos y se reintenta de inmediato
- THEN el segundo intento responde `200` y dispara a n8n; mover la puerta detrás de `reclamarEnvio` pone esta prueba en rojo

### Requirement: RQ-RE-19 · El formulario pide lista de novedades y fotos por categoría, y no deja crear ni continuar sin ellas

`CrearRemision.tsx` **SHALL** presentar, en lugar de la pregunta «¿El equipo llega con novedad?» y del texto libre
de observaciones:

- la lista de novedades servida por RQ-RE-22, de selección múltiple y sin ninguna marcada por defecto; marcar la
  novedad que excluye a las demás desmarca el resto y marcar otra la desmarca; marcar la que exige texto abre su
  campo de texto;
- ninguna casilla de rotulado: el rotulado se confirma después de enviar (RQ-RE-40);
- las fotos por categoría —equipo, accesorios y embalaje— y, por cada novedad marcada, la de esa novedad.

El formulario **SHALL** impedir crear la remisión sin lista contestada y sin el texto
exigido, y **MUST NOT** ofrecer «Continuar sin fotos» cuando aceptarlo dejaría sin foto alguna categoría mínima o
alguna novedad marcada. Todas las comprobaciones **SHALL** salir de las funciones compartidas de RQ-RE-18.

**Regla 13, decisión a decisión.** Cada decisión del formulario tiene su contrapartida en el servidor, con lo
que el formulario es comodidad probada: claves válidas y activas, lista vacía, exclusión de «Sin novedad» y
texto de «Otro», en el alta (RQ-RE-23); categoría y novedad de la foto, en la subida
(RQ-RE-25); fotos mínimas y foto por novedad, en `/enviar` (RQ-RE-26). La persona, la fecha y la hora del
rotulado (RQ-RE-40), `hay_novedad` y `observaciones` los decide el servidor y el formulario no los decide.

#### Comprobaciones de persona de RQ-RE-19 — NO son escenarios automáticos
> Los `.tsx` quedan fuera de la red de pruebas por decisión de Gerencia (F0-00, `vitest.config.ts:16-20`).
> **Dueño:** Servicio Técnico, en la app. **ARCHIVAR ESTE CAMBIO NO LAS DA POR HECHAS.**

- **Persona-1.** GIVEN el formulario de alta · WHEN se abre · THEN muestra la lista de novedades de la base, sin
  ninguna marcada, y ninguna casilla de rotulado; no hay campo de observaciones libre.
- **Persona-2.** GIVEN «Sin novedad» marcada · WHEN se marca otra novedad · THEN «Sin novedad» se desmarca; y
  al revés.
- **Persona-3.** GIVEN «Otro» marcada y sin texto · WHEN se intenta crear · THEN el
  formulario lo impide.
- **Persona-4.** GIVEN una novedad marcada y sin su foto, o alguna categoría mínima sin foto · WHEN se intenta
  crear o continuar · THEN el formulario lo impide y no ofrece «Continuar sin fotos».
- **Persona-5.** GIVEN un envío bloqueado por el `422` de RQ-RE-26 · WHEN el técnico lo lee · THEN el mensaje
  dice qué categoría o novedad falta.

### Requirement: RQ-RE-23 · El alta valida las novedades marcadas y deriva `hay_novedad` y `observaciones`

Cuando el cuerpo de `POST /api/remisiones` trae `novedades` (la clave presente con cualquier valor distinto de
`undefined`; ver RQ-RE-27), el alta **SHALL** tratarlo como la lista de claves de novedad marcadas y **SHALL**
rechazar con `422`, sin crear la remisión ni escribir nada en el ticket, cualquiera de estos casos:

- `novedades` no es una lista de textos, o es una lista vacía. «Sin contestar» y «Sin novedad» **MUST NOT**
  confundirse: la lista vacía se rechaza.
- Una clave no existe en `public.catalogo_novedades` o está inactiva (`activo = false`).
- Una novedad con `excluye_demas` verdadera viene combinada con cualquier otra.
- Una novedad con `exige_texto` verdadera está marcada y `novedadOtro` falta o es sólo espacios.

Una clave repetida **SHALL** contar una sola vez. Con todas las comprobaciones superadas, el alta **SHALL**:

- guardar en `public.remisiones.novedades` (`jsonb`) una **instantánea** de lo marcado —cada elemento con su
  `clave` y su `etiqueta`—, en el orden de `orden` del catálogo, de modo que corregir después una etiqueta del
  catálogo **MUST NOT** cambiar lo que la remisión guardó (RQ-RE-01);
- guardar en `novedad_otro` el texto recortado cuando haya una novedad marcada con `exige_texto`, y `NULL` en
  otro caso;
- **derivar** `hay_novedad`: `true` si hay al menos una novedad marcada sin `excluye_demas`, `false` si sólo está
  la que excluye a las demás. El `hayNovedad` del cuerpo **SHALL** ignorarse;
- **componer** `observaciones` con las etiquetas de lo marcado, en el mismo orden y separadas por `; `, y con
  `{etiqueta}: {texto}` para la novedad con `exige_texto`. Ejemplo: «Rayón o daño estético; Otro: pantalla
  rota». Las `observaciones` del cuerpo **SHALL** ignorarse. Así el listado, el CSV, el hilo y el documento
  siguen leyendo `observaciones` como hoy.

**Posición en el orden de guardas.** La validación de las novedades **SHALL** ejecutarse **después** del `422` del
serial (`routes/remision.ts:154-157`, escalón A) y **antes** del `409` de remisión pendiente (`:174-183`, escalón D):
A < C < D. El rotulado (RQ-RE-24) ya no es una guarda del alta: no hay un paso detrás de las novedades.
**MUST NOT** moverse ninguna guarda existente del alta, y IV-12 sigue sin corregirse:
al ir antes del `409`, la guarda de novedades corre también antes de «Ítems fuera del checklist» (`:197`) y de la
comprobación de la orden de venta (`:220`), y la fecha inválida (`:127`) sigue corriendo antes que ella.

El texto del `422` **SHALL** nombrar la causa (la clave desconocida o inactiva, la combinación con la novedad
que excluye, o la falta de texto) y el servidor **MUST NOT** aceptar del cuerpo `hay_novedad`/`hayNovedad` ni
`observaciones` como fuente de verdad cuando `novedades` está presente.

#### Scenario: Una lista correcta se guarda como instantánea y deriva los dos campos
- GIVEN un ticket con serial y las novedades «Rayón o daño estético» y «Otro» activas
- WHEN se crea la remisión con esas dos claves, `novedadOtro: " pantalla rota "`, `hayNovedad: false` y unas `observaciones` cualesquiera
- THEN responde `201` y la fila guarda `novedades` con las dos claves y etiquetas, `novedad_otro = 'pantalla rota'`, `hay_novedad = true` y `observaciones = 'Rayón o daño estético; Otro: pantalla rota'`

#### Scenario: Sólo «Sin novedad» deriva hay_novedad en false
- GIVEN un ticket con serial
- WHEN se crea la remisión con la lista de la novedad que excluye a las demás
- THEN `hay_novedad = false`, `observaciones = 'Sin novedad'` y `novedad_otro` es `NULL`

#### Scenario: La lista vacía se rechaza
- GIVEN un ticket con serial
- WHEN se crea la remisión con `novedades: []`
- THEN responde `422` y no se crea ninguna remisión

#### Scenario: Una clave desconocida o inactiva se rechaza
- GIVEN una clave que no existe en el catálogo, y otra de una novedad con `activo = false`
- WHEN se crea una remisión con cada una
- THEN responde `422` las dos veces y no se crea ninguna remisión

#### Scenario: «Sin novedad» no convive con otra
- GIVEN la novedad con `excluye_demas` y otra cualquiera
- WHEN se crea la remisión con las dos marcadas
- THEN responde `422`

#### Scenario: «Otro» sin texto se rechaza
- GIVEN la novedad con `exige_texto` marcada
- WHEN `novedadOtro` falta, está vacío o es sólo espacios
- THEN responde `422`

#### Scenario: Una instantánea no cambia cuando se edita el catálogo
- GIVEN una remisión creada con una novedad cuya etiqueta se corrige después en la tabla
- WHEN se lee la remisión
- THEN `novedades` y `observaciones` conservan la etiqueta con la que se creó

#### Scenario: El serial gana a las novedades — posición A < C
- GIVEN un ticket sin serial resuelto y una lista de novedades inválida
- WHEN se crea la remisión
- THEN responde el `422` «Falta el serial», no el de las novedades

#### Scenario: Las novedades ganan a la remisión pendiente — posición C < D
- GIVEN un ticket con una remisión pendiente vigente y una lista de novedades inválida
- WHEN se crea otra remisión sin `permitirSegunda`
- THEN responde el `422` de las novedades, no el `409`, y no se crea ninguna remisión

#### Scenario: El rotulado del cuerpo se ignora en el alta
- GIVEN una lista de novedades válida y un cuerpo con `rotulado` ausente, `false` o `true`
- WHEN se crea la remisión
- THEN responde `201` las tres veces y `rotulado_at` y `rotulado_por` quedan en `NULL`

#### Scenario: Con la lista de novedades sin filas activas no se puede crear una remisión del formulario nuevo
- GIVEN `public.catalogo_novedades` sin ninguna fila activa
- WHEN se crea una remisión con cualquier lista de claves
- THEN responde `422` y no se crea ninguna remisión

### Requirement: RQ-RE-24 · El rotulado ya no se exige en el alta: se confirma después de enviar, con persona, fecha y hora del servidor

Con `novedades` presente en el cuerpo (RQ-RE-27), el alta **MUST NOT** exigir la confirmación «Rotulado y guardado»
(`decision/e167-rotulado-tras-enviar-12-10`, que sustituye a `decision/f1b04-rotulacion`, `openspec/config.yaml:2925`; el maestro,
`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1239`, aún la llama obligatoria): el valor de `rotulado`
**SHALL** ignorarse sea cual sea —ausente, `false`, `true` u otro tipo—, y el alta **MUST NOT** rechazar por él ni escribir
`rotulado_at` ni `rotulado_por`. La confirmación se hace después del envío (RQ-RE-40).

- La persona **SHALL** ser el usuario autenticado y la fecha y hora **SHALL** ser el reloj del servidor, y se guardan
  en `public.remisiones.rotulado_por` y `rotulado_at` sólo al confirmar tras el envío (RQ-RE-40), una vez. El cuerpo
  **MUST NOT** decidir ninguno de los dos: cualquier `rotuladoPor` o `rotuladoAt` que traiga **SHALL** ignorarse.
- La remisión devuelta por el alta y por la lectura **SHALL** exponer `rotuladoPor` y `rotuladoAt`; tras el alta valen `NULL`.
- El alta **MUST NOT** registrar ubicación de almacén: lo decidido es una confirmación, no una ubicación.
- La remisión de legado (RQ-RE-27) **SHALL** quedar con `rotulado_por` y `rotulado_at` en `NULL`.

#### Scenario: Un alta sin `rotulado` se acepta
- GIVEN una lista de novedades válida
- WHEN `rotulado` falta, es `false` o no es booleano
- THEN responde `201`, se crea la remisión y `rotulado_at` y `rotulado_por` quedan en `NULL`

#### Scenario: Un `rotulado: true` con persona y hora del cuerpo no escribe la traza
- GIVEN un usuario autenticado y un cuerpo con `rotulado: true`, `rotuladoPor: 'Otra Persona'` y `rotuladoAt: '2020-01-01T00:00:00Z'`
- WHEN se crea la remisión
- THEN responde `201` y `rotuladoPor` y `rotuladoAt` quedan en `NULL`: ni el cuerpo ni la sesión se escriben en el alta

#### Scenario: Una remisión de legado no lleva rotulado
- GIVEN un alta sin `novedades`
- WHEN se crea la remisión
- THEN `rotulado_por` y `rotulado_at` quedan en `NULL` y la petición no se rechaza por ello

### Requirement: RQ-RE-26 · Una remisión del formulario nuevo no se envía sin las tres fotos mínimas y sin la foto de cada novedad

Para una remisión con `novedades` no nulo (RQ-RE-27), la sexta puerta de `POST /:id/enviar` (RQ-RE-08)
**SHALL** responder `422` —sin reclamar el envío, sin disparar a n8n y sin escribir nada— en cuanto falte alguna
de estas dos cosas, evaluadas **en este orden**:

1. **Fotos mínimas:** no hay al menos una foto de cada categoría `equipo`, `accesorios` y `embalaje`. El registro
   fotográfico es siempre obligatorio, haya o no novedad (E-123, `docs/sdd/ENTRADA.md:1515`; maestro,
   `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1241`), con dos excepciones por
   casilla (RQ-RE-38): la foto de `accesorios` **MUST NOT** exigirse si la remisión lleva «Llegó sin accesorios»
   (`sin_accesorios_at` no nulo), ni la de `embalaje` si lleva «Llegó sin embalaje» (`sin_embalaje_at` no nulo).
   Las casillas son independientes y la foto de `equipo` **SHALL** exigirse **siempre**. El `422` **SHALL**
   nombrar las categorías que faltan.
2. **Foto de cada novedad:** alguna novedad marcada, sin `excluye_demas` y sin `exenta_de_foto` (RQ-RE-37), no
   tiene al menos una foto con `categoria = 'novedad'` y `novedad` igual a su clave. Cada novedad marcada y no
   exenta exige la suya: una foto no sirve para dos novedades. La novedad con `excluye_demas` y la que lleva
   `exenta_de_foto` **MUST NOT** exigir foto; la exención se decide **siempre por la marca**, nunca por la clave
   ni por la etiqueta. El `422` **SHALL** nombrar las novedades que faltan.

Una foto cuenta sólo para su propia categoría: una foto de `equipo` **MUST NOT** contar para `accesorios` ni
para ninguna novedad, y una foto sin categoría **MUST NOT** contar para ninguna. Las marcas de cada novedad
marcada **SHALL** leerse del catálogo por su `clave` aunque la fila esté hoy inactiva: retirar una novedad
(`activo = false`) afecta a las altas nuevas y **MUST NOT** relajar la exigencia de una remisión que ya la marcó.

**Posición.** La puerta **SHALL** ir detrás de «anulada» y «ya enviada» (`routes/remision.ts:279-286`, escalón B)
y **antes** de `reclamarEnvio` (`:297`, escalón D). Corregir y reenviar de inmediato **SHALL** tener éxito, porque
la reclamación nunca se tomó; un `422` posterior a la reclamación dejaría `enviado_at` fijado y bloquearía el
reintento durante `VENTANA_REENVIO_SEGUNDOS`.
El rotulado sin confirmar (RQ-RE-40) **MUST NOT** impedir el envío: la puerta no lee `rotulado_at`.

#### Scenario: Sin rotulado, se envía
- GIVEN una remisión del formulario nuevo con las fotos completas y `rotulado_at` en `NULL`
- WHEN se llama `POST /:id/enviar`
- THEN responde `200`, dispara a n8n y `enviado_at` queda fijado

#### Scenario: Faltan fotos mínimas y el 422 nombra las categorías
- GIVEN una remisión del formulario nuevo, con sólo una foto de `equipo`
- WHEN se llama `POST /:id/enviar`
- THEN responde `422`, nombra `accesorios` y `embalaje`, no dispara y `enviado_at` sigue `NULL`

#### Scenario: Sin novedad con las tres fotos mínimas se envía
- GIVEN una remisión del formulario nuevo con sólo la novedad que excluye a las demás, con una foto de cada categoría mínima
- WHEN se llama `POST /:id/enviar`
- THEN responde `200`

#### Scenario: Cada novedad marcada exige su foto
- GIVEN una remisión del formulario nuevo, con las tres categorías mínimas, y dos novedades marcadas con foto sólo de una
- WHEN se llama `POST /:id/enviar`
- THEN responde `422` y nombra la novedad que falta
- AND subir la foto de la segunda y reintentar de inmediato responde `200`

#### Scenario: Una foto de otra categoría no sustituye a la de la novedad
- GIVEN una remisión con una novedad marcada y varias fotos de `equipo`, `accesorios` y `embalaje`, pero ninguna con `categoria = 'novedad'`
- WHEN se llama `POST /:id/enviar`
- THEN responde `422`

#### Scenario: Una foto sin categoría no cuenta
- GIVEN una remisión del formulario nuevo con tres fotos sin categoría
- WHEN se llama `POST /:id/enviar`
- THEN responde `422` por las fotos mínimas

#### Scenario: Una novedad retirada después sigue exigiendo su foto
- GIVEN una remisión que marcó una novedad, y esa novedad pasada después a `activo = false` en la tabla
- WHEN se llama `POST /:id/enviar` sin la foto de esa novedad
- THEN responde `422` por esa novedad

#### Scenario: El orden interno es fotos mínimas, foto por novedad
- GIVEN una remisión sin fotos mínimas y con una novedad sin foto
- WHEN se llama `POST /:id/enviar`
- THEN el `422` es el de las fotos mínimas
- AND con las mínimas subidas, el `422` es el de la foto de la novedad
- AND permutar las dos guardas pone la prueba en rojo

#### Scenario: La anulación y «ya enviada» ganan a la puerta de contenido
- GIVEN una remisión del formulario nuevo anulada, o en `ok`, sin fotos
- WHEN se llama `POST /:id/enviar`
- THEN responde el `409` de anulada o de ya enviada, no el `422`

#### Scenario: El 422 de contenido no reclama el envío
- GIVEN una remisión del formulario nuevo incompleta
- WHEN se llama `POST /:id/enviar`, se completa lo que faltaba y se reintenta de inmediato
- THEN el primer intento responde `422` con `enviado_at` en `NULL` y el segundo responde `200`

#### Scenario: Una novedad exenta no exige foto
- GIVEN una remisión con las tres fotos mínimas, y sólo «Falta un accesorio» marcada, sin foto de esa novedad
- WHEN se llama `POST /:id/enviar`
- THEN responde `200`

#### Scenario: Exenta y no exenta a la vez, sólo falta la segunda
- GIVEN una remisión con las tres fotos mínimas, con «Falta un accesorio» y otra novedad no exenta, sin foto de ninguna
- WHEN se llama `POST /:id/enviar`
- THEN responde `422` y nombra sólo la no exenta
- AND subir la foto de la no exenta y reintentar de inmediato responde `200`

#### Scenario: La exención sigue a la marca, no a la clave
- GIVEN el catálogo con `exenta_de_foto = true` en otra clave y en `false` en `falta_accesorio`
- WHEN se evalúa lo que falta con cada una marcada y sin foto
- THEN la de la marca queda exenta y `falta_accesorio` exige su foto

#### Scenario: Una casilla exime sólo la foto de su categoría
- GIVEN una remisión con casilla de accesorios marcada, foto de `equipo`, sin fotos de `accesorios` ni de `embalaje`
- WHEN se llama `POST /:id/enviar`
- THEN responde `422` y nombra sólo `embalaje`
- AND con sólo la casilla de embalaje marcada, nombra sólo `accesorios`

#### Scenario: Con las dos casillas, sólo se exige la foto del equipo
- GIVEN una remisión con las dos casillas marcadas y sin ninguna foto
- WHEN se llama `POST /:id/enviar`
- THEN responde `422` y nombra sólo `equipo`
- AND con una foto de `equipo` y el reintento inmediato responde `200`

#### Scenario: Una remisión creada antes del cambio sigue exigiendo las tres
- GIVEN una remisión del formulario nuevo con `sin_accesorios_at` y `sin_embalaje_at` en `NULL`
- WHEN se llama `POST /:id/enviar` sin fotos de `accesorios` ni de `embalaje`
- THEN responde `422` y las nombra

### Requirement: RQ-RE-38 · «Llegó sin accesorios» y «Llegó sin embalaje» sustituyen su foto mínima, con traza

`public.remisiones` **SHALL** tener cuatro columnas `NULL`-ables, calificadas y sin relleno de lo histórico:
`sin_accesorios_at`, `sin_accesorios_por`, `sin_embalaje_at` y `sin_embalaje_por`.

- El alta con `novedades` presente (RQ-RE-27) **SHALL** aceptar dos marcas booleanas independientes,
  `sinAccesorios` y `sinEmbalaje`; cada una marcada con exactamente `true` **SHALL** guardar la hora del
  **servidor** y el usuario de la **sesión** del alta en sus dos columnas, sin pasar por el rotulado (G2, RQ-RE-40). El cuerpo **MUST NOT** decidir ni la hora ni la
  persona (RQ-RE-24). Sin marcar, sus columnas **SHALL** quedar en `NULL`.
- Cada casilla marcada **SHALL** añadir su frase a `observaciones`: «Llegó sin accesorios» y «Llegó sin
  embalaje».
- «Llegó sin accesorios» con alguno de los accesorios marcados en «Incluye» **SHALL** responder `422` sin crear
  la remisión; «Llegó sin embalaje» no tiene esa incompatibilidad. Que el alta lo rechace es comportamiento del
  servidor, no del formulario, y **MUST NOT** alterar el orden relativo de las demás respuestas del alta.
- La remisión de legado (`novedades` `NULL`) **MUST NOT** admitirlas: se ignoran y quedan sus cuatro columnas
  en `NULL` y sus `observaciones` sin la frase. Una remisión creada antes del cambio queda con las cuatro
  columnas en `NULL`.
- El cálculo de lo que falta para enviar (RQ-RE-18) **SHALL** recibir las dos casillas y las marcas
  `exentaDeFoto` de las novedades, y servidor y formulario **SHALL** consumir esa misma función.
- El payload hacia n8n (RQ-RE-13) **MUST NOT** ganar ninguna clave por las casillas: llegan como texto dentro de
  `observaciones` y, resumidas, dentro de `aplica` (RQ-RE-39), que es la única clave que gana sobre las de esta tanda; no viajan como claves propias.

#### Scenario: Cada casilla se guarda con su traza
- GIVEN un usuario autenticado y un alta sin `rotulado`, con `sinEmbalaje: true`, y `sinAccesorios` ausente
- WHEN se crea la remisión
- THEN `sin_embalaje_at` cae entre el instante anterior y el posterior a la petición, `sin_embalaje_por` es ese usuario y las dos columnas de accesorios son `NULL`

#### Scenario: Hora y persona salen del servidor
- GIVEN un alta con `sinAccesorios: true`, `sinAccesoriosPor: 'Otra Persona'` y `sinAccesoriosAt: '2020-01-01T00:00:00Z'`
- WHEN se crea la remisión
- THEN la persona es la de la sesión y la hora la del servidor

#### Scenario: Cada casilla deja su frase en las observaciones
- GIVEN un alta con las dos casillas marcadas
- WHEN se crea la remisión
- THEN `observaciones` contiene «Llegó sin accesorios» y «Llegó sin embalaje», y con una sola, solo su frase

#### Scenario: Sin accesorios y con accesorios marcados, el alta se rechaza
- GIVEN un alta con `sinAccesorios: true` y un accesorio marcado en «Incluye»
- WHEN se crea la remisión
- THEN responde `422` y no se crea ninguna
- AND con `sinEmbalaje: true` y accesorios marcados el alta se acepta

#### Scenario: Un alta de legado ignora las casillas
- GIVEN un alta sin `novedades` y con `sinAccesorios: true`
- WHEN se crea la remisión
- THEN se crea como legado, con las cuatro columnas en `NULL` y `observaciones` sin la frase

#### Scenario: Casilla de accesorios marcada y falta la foto de embalaje
- GIVEN una remisión guardada con sólo la casilla de accesorios, con foto de `equipo`
- WHEN se llama `POST /:id/enviar`
- THEN responde `422` por `embalaje`

#### Scenario: El payload no gana claves por las casillas
- GIVEN una remisión con las dos casillas marcadas
- WHEN se arma el payload a n8n
- THEN tiene las claves de antes más `aplica` (RQ-RE-39), sin `sinAccesorios` ni `sinEmbalaje`, y las frases sólo aparecen en el valor de `observaciones`

## Trazabilidad

- `decision/e167-rotulado-tras-enviar-12-10` (`openspec/config.yaml` → `decisiones_de_gerencia_adenda`): el rotulado se confirma tras el envío, con traza y sin bloquear transiciones. Respaldan RQ-RE-40, RQ-RE-41, RQ-RE-19, RQ-RE-23, RQ-RE-24, RQ-RE-26 y RQ-RE-08.
- G2 (traza de las casillas = usuario y hora del alta, aprobado): RQ-RE-38 y su escenario «Cada casilla se guarda con su traza». S1 (confirma Servicio Técnico o administrador): RQ-RE-40, escenario `R40-b` y escalón B. S2 (una sola vez, repetir `409`): `R40-c`. S3 (se pinta en la tarjeta y la pantalla de resultado, no alarma): RQ-RE-41. S5 (creada antes, enviada después): última fila de la tabla de RQ-RE-41. S10 (legado ni marca ni confirma): tabla de RQ-RE-41 y `R40-d4`/`R40-d5`. S11 (una confirmación no se borra con un `error`): `R40-d6` y `R40-f`. S12 (la frase falsa de `ok_con_avisos`): RQ-RE-05.
- Datos de n8n (que la etiqueta es un paso no crítico y que `ok_con_avisos` puede llevar `dymoId` en `null`): **segunda mano**, los leyó el analista el 2026-10-12 en el nodo «Code Resumen Entrada»; no se contrastaron con una ejecución real. Hipótesis hasta entonces.
- Códigos HTTP de RQ-RE-40: decisión de esta especificación por analogía con las rutas vecinas (`apps/desk/server/routes/remision.ts:91`, `:280`, `:302`); el diseño puede cambiarlos sólo si cambia la prueba de posición.
- No se tocan, y siguen ciertos: RQ-RE-27 (`openspec/specs/remisiones/spec.md:1209-1250`: «sin exigir rotulado» y `rotulado_por`/`rotulado_at` en `NULL` en legado siguen siendo verdad; que RQ-RE-24 se aplique «sólo entonces» sigue cierto); RQ-RE-17 (`:523` y `:542-544`: el payload no lleva `rotulado*`, y no lo gana); RQ-RE-07 (`reclamarEnvio` sigue siendo un único `UPDATE` condicional; RQ-RE-42 le añade una columna).
