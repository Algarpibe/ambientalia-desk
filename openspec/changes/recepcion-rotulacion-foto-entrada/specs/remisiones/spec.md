# Delta for remisiones

Segundo cambio de F1B-04 (`cierra: no`), sin accesorios. Añade el catálogo de novedades como dato, el rotulado,
la categoría de la foto y las puertas de la remisión de entrada del formulario nuevo; la remisión de legado
(`novedades` en `NULL`) sigue por la regla anterior. Base verificada `f55b7d9`.

## ADDED Requirements

### Requirement: RQ-RE-21 · El catálogo de novedades de entrada es dato de la base, no constante del código

El sistema **SHALL** guardar los tipos de novedad de la remisión de entrada en `public.catalogo_novedades`, con
las columnas `clave` (llave primaria), `etiqueta`, `orden`, `activo`, `excluye_demas` y `exige_texto`. La tabla
**SHALL** crearse con esquema calificado y figurar en `PUBLIC_TABLES`
(`packages/zoho-sync/src/db/migrate.ts:70-73`), de modo que el guardián de `migrate.test.ts` la reconozca.

- Tras `migrate`, la tabla **SHALL** contener **diez** filas activas, en este orden y con estas etiquetas, que son
  la lista de `decision/f1b04-desplegables` (`openspec/config.yaml:2941`): «Sin novedad» · «Golpe o abolladura en
  la carcasa» · «Rayón o daño estético» · «Pantalla o display dañado» · «Conector o puerto dañado» · «Falta un
  accesorio» · «Embalaje inadecuado o dañado» · «Humedad, suciedad o contaminación visible» · «Sello o precinto
  roto» · «Otro».
- Las dos marcas **SHALL** ser el comportamiento: `excluye_demas` es verdadera sólo en «Sin novedad» y
  `exige_texto` es verdadera sólo en «Otro». El servidor **SHALL** decidir leyendo las marcas y **MUST NOT**
  decidir por la `clave` ni por la `etiqueta`.
- La siembra **SHALL** ser idempotente por `clave`: reaplicar `migrate` **MUST NOT** duplicar filas ni pisar lo
  que alguien haya editado (etiqueta, orden, marcas o `activo`).
- Una novedad **SHALL** retirarse con `activo = false` y **MUST NOT** retirarse borrando la fila: la siembra
  reinsertaría una fila borrada en el siguiente arranque.
- Toda sentencia de `schema.sql` que cree o modifique estas tablas y columnas **SHALL** calificar el esquema
  (`public.`), y la siembra **MUST NOT** rellenar ni actualizar filas existentes de `public.remisiones` ni de
  `public.remision_fotos`.

#### Scenario: Tras migrar quedan las diez novedades, en orden y con las dos marcas
- GIVEN una base vacía a la que se aplica `migrate`
- WHEN se lee `public.catalogo_novedades` ordenada por `orden`
- THEN hay diez filas activas con las etiquetas de la lista, en ese orden
- AND sólo «Sin novedad» tiene `excluye_demas` y sólo «Otro» tiene `exige_texto`

#### Scenario: Reaplicar migrate no duplica ni pisa lo editado
- GIVEN la tabla sembrada, con una fila editada a mano (otra etiqueta, `activo = false`) y otra con una marca cambiada
- WHEN se vuelve a aplicar `migrate`
- THEN siguen diez filas, y las dos filas editadas conservan lo editado

#### Scenario: El guardián conoce la tabla y sus sentencias calificadas
- GIVEN `schema.sql` con `CREATE TABLE public.catalogo_novedades` y las `ALTER TABLE public.…` de las columnas nuevas
- WHEN corre el guardián de `migrate.test.ts`
- THEN `catalogo_novedades` figura en `PUBLIC_TABLES` y pasa; quitar `public.` al `CREATE`, o a una `ALTER` de `remision_fotos`, o quitar el nombre de `PUBLIC_TABLES`, lo pone en rojo

#### Scenario: Una sentencia de relleno sobre filas existentes pone en rojo el guardián
- GIVEN `schema.sql` al que se añade un `UPDATE` sobre `public.remisiones` o `public.remision_fotos` para rellenar las columnas nuevas
- WHEN corre la prueba que vigila el fichero
- THEN se pone en rojo

#### Scenario: Cambiar una marca de la tabla cambia lo que el servidor acepta
- GIVEN la fila «Otro» con `exige_texto` apagada en la tabla
- WHEN se crea una remisión del formulario nuevo con «Otro» y sin texto
- THEN el alta se acepta, porque el servidor lee el dato y no una constante

### Requirement: RQ-RE-22 · La lista de novedades activas se sirve al formulario desde la base

El sistema **SHALL** exponer una ruta de lectura, accesible con sesión, que devuelva las novedades con
`activo = true`, ordenadas por `orden`, cada una con su `clave`, su `etiqueta` y sus dos marcas
(`excluye_demas`, `exige_texto`). La ruta **MUST NOT** devolver las novedades inactivas, y sin sesión **SHALL**
responder `401`. El formulario **SHALL** pintar esa lista y **MUST NOT** llevar una copia propia de las etiquetas
ni de las marcas.

#### Scenario: La ruta devuelve las activas en orden con sus marcas
- GIVEN la lista sembrada, con una novedad pasada a `activo = false`
- WHEN un usuario con sesión pide la lista
- THEN recibe sólo las activas, en orden de `orden`, con `clave`, `etiqueta`, `excluye_demas` y `exige_texto`

#### Scenario: Sin sesión no hay lista
- GIVEN una petición sin sesión
- WHEN pide la lista de novedades
- THEN responde `401`

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

**Posición en el orden de guardas.** La validación de las novedades —y, detrás de ella, la del rotulado
(RQ-RE-24)— **SHALL** ejecutarse **después** del `422` del serial (`routes/remision.ts:154-157`, escalón A) y
**antes** del `409` de remisión pendiente (`:174-183`, escalón D): A < C < D. Entre las dos nuevas, la de
novedades corre primero. **MUST NOT** moverse ninguna guarda existente del alta, y IV-12 sigue sin corregirse:
al ir antes del `409`, las guardas nuevas corren también antes de «Ítems fuera del checklist» (`:197`) y de la
comprobación de la orden de venta (`:220`), y la fecha inválida (`:127`) sigue corriendo antes que ellas.

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

#### Scenario: Las novedades corren antes que el rotulado
- GIVEN una lista de novedades inválida y `rotulado` ausente
- WHEN se crea la remisión
- THEN el `422` es el de las novedades

#### Scenario: Con la lista de novedades sin filas activas no se puede crear una remisión del formulario nuevo
- GIVEN `public.catalogo_novedades` sin ninguna fila activa
- WHEN se crea una remisión con cualquier lista de claves
- THEN responde `422` y no se crea ninguna remisión

### Requirement: RQ-RE-24 · El rotulado es una confirmación obligatoria con persona, fecha y hora del servidor

Con `novedades` presente en el cuerpo (RQ-RE-27), el alta **SHALL** exigir la confirmación «Rotulado y guardado»
(`decision/f1b04-rotulacion`, `openspec/config.yaml:2925`; maestro,
`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1239`): `rotulado` **SHALL** valer
exactamente `true`, y en cualquier otro caso —ausente, `false` u otro tipo— el alta **SHALL** responder `422`
sin crear la remisión.

- La persona **SHALL** ser el usuario autenticado y la fecha y hora **SHALL** ser el reloj del servidor: se
  guardan en `public.remisiones.rotulado_por` y `rotulado_at`. El cuerpo **MUST NOT** decidir ninguno de los dos:
  cualquier `rotuladoPor` o `rotuladoAt` que traiga **SHALL** ignorarse.
- La remisión devuelta por el alta y por la lectura **SHALL** exponer `rotuladoPor` y `rotuladoAt`.
- El alta **MUST NOT** registrar ubicación de almacén: lo decidido es una confirmación, no una ubicación.
- La remisión de legado (RQ-RE-27) **SHALL** quedar con `rotulado_por` y `rotulado_at` en `NULL`.

#### Scenario: Sin confirmación de rotulado, el alta se rechaza
- GIVEN una lista de novedades válida
- WHEN `rotulado` falta, es `false` o no es booleano
- THEN responde `422` y no se crea ninguna remisión

#### Scenario: Persona y hora salen del servidor aunque el cuerpo traiga otras
- GIVEN un usuario autenticado y un cuerpo con `rotulado: true`, `rotuladoPor: 'Otra Persona'` y `rotuladoAt: '2020-01-01T00:00:00Z'`
- WHEN se crea la remisión
- THEN `rotuladoPor` es el nombre del usuario autenticado y `rotuladoAt` cae entre el instante anterior y el posterior a la petición

#### Scenario: Una remisión de legado no lleva rotulado
- GIVEN un alta sin `novedades`
- WHEN se crea la remisión
- THEN `rotulado_por` y `rotulado_at` quedan en `NULL` y la petición no se rechaza por ello

### Requirement: RQ-RE-25 · La foto lleva categoría, y la subida la valida

La subida `POST /api/remisiones/:id/fotos` **SHALL** aceptar los campos `categoria` y `novedad` y guardarlos en
`public.remision_fotos.categoria` y `novedad` (columnas calificadas, aditivas y `NULL`-ables, sin relleno). Las
categorías válidas **SHALL** ser cuatro: `equipo`, `accesorios`, `embalaje` y `novedad`.

- La categoría **SHALL** validarse **detrás** del `415` del tipo de imagen (`routes/remision.ts:383`): el orden
  de la subida es remisión inexistente `404`, archivo ausente `400`, tipo no permitido `415`, categoría
  `422`.
- Una `categoria` presente y fuera de las cuatro **SHALL** responder `422` y **MUST NOT** guardar la foto.
- Con `categoria = 'novedad'`, `novedad` **SHALL** ser la `clave` de una novedad marcada en la propia remisión
  (en su instantánea `novedades`); en otro caso —ausente, o no marcada, o la remisión sin `novedades`— **SHALL**
  responder `422` y no guardar la foto.
- Con cualquier otra categoría, el campo `novedad` **SHALL** ignorarse y guardarse como `NULL`.
- Una subida **sin** `categoria` **SHALL** aceptarse y guardar `categoria = NULL`: es lo que sube un cliente
  anterior a este cambio. Esa foto cuenta para la regla de legado (RQ-RE-27) y **MUST NOT** contar para ninguna
  categoría ni novedad de las puertas de RQ-RE-26.
- El listado de fotos de la remisión **SHALL** exponer `categoria` y `novedad` y **MUST NOT** devolver el
  base64 (RQ-RE-13).

#### Scenario: Una foto con categoría válida se guarda con ella
- GIVEN una remisión del formulario nuevo
- WHEN se sube una imagen permitida con `categoria = 'embalaje'`
- THEN responde `201` y el listado de fotos muestra `categoria = 'embalaje'` y `novedad` nula

#### Scenario: Una categoría desconocida se rechaza
- GIVEN una remisión
- WHEN se sube una imagen permitida con `categoria = 'otra'`
- THEN responde `422` y no se guarda ninguna foto

#### Scenario: El tipo de imagen gana a la categoría — posición del 415
- GIVEN un archivo de tipo no permitido y una `categoria` inválida a la vez
- WHEN se sube
- THEN responde `415`, no `422`; mover la validación de la categoría antes del `415` debe poner esta prueba en rojo

#### Scenario: Una foto de novedad exige una novedad marcada en la remisión
- GIVEN una remisión con las novedades «Rayón o daño estético» y «Otro» marcadas
- WHEN se sube una foto con `categoria = 'novedad'` y la clave de «Rayón o daño estético»
- THEN responde `201` y la foto queda con esa `novedad`
- AND con la clave de una novedad no marcada, o sin `novedad`, responde `422` y no se guarda

#### Scenario: Una foto de novedad en una remisión de legado se rechaza
- GIVEN una remisión con `novedades` en `NULL`
- WHEN se sube una foto con `categoria = 'novedad'`
- THEN responde `422`

#### Scenario: Una subida sin categoría sigue funcionando
- GIVEN una remisión cualquiera
- WHEN se sube una imagen permitida sin `categoria`
- THEN responde `201` y la foto queda con `categoria = NULL`

### Requirement: RQ-RE-26 · Una remisión del formulario nuevo no se envía sin rotulado, sin las tres fotos mínimas y sin la foto de cada novedad

Para una remisión con `novedades` no nulo (RQ-RE-27), la sexta puerta de `POST /:id/enviar` (RQ-RE-08)
**SHALL** responder `422` —sin reclamar el envío, sin disparar a n8n y sin escribir nada— en cuanto falte alguna
de estas tres cosas, evaluadas **en este orden**:

1. **Rotulado:** `rotulado_at` es `NULL`.
2. **Fotos mínimas:** no hay al menos una foto de cada categoría `equipo`, `accesorios` y `embalaje`. El registro
   fotográfico es siempre obligatorio, haya o no novedad (E-123, `docs/sdd/ENTRADA.md:1515`; maestro,
   `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:1241`). El `422` **SHALL**
   nombrar las categorías que faltan.
3. **Foto de cada novedad:** alguna novedad marcada sin `excluye_demas` no tiene al menos una foto con
   `categoria = 'novedad'` y `novedad` igual a su clave. Cada novedad marcada exige la suya: una foto no sirve
   para dos novedades. La novedad con `excluye_demas` **MUST NOT** exigir foto. El `422` **SHALL** nombrar las
   novedades que faltan.

Una foto cuenta sólo para su propia categoría: una foto de `equipo` **MUST NOT** contar para `accesorios` ni
para ninguna novedad, y una foto sin categoría **MUST NOT** contar para ninguna. Las marcas de cada novedad
marcada **SHALL** leerse del catálogo por su `clave` aunque la fila esté hoy inactiva: retirar una novedad
(`activo = false`) afecta a las altas nuevas y **MUST NOT** relajar la exigencia de una remisión que ya la marcó.

**Posición.** La puerta **SHALL** ir detrás de «anulada» y «ya enviada» (`routes/remision.ts:279-286`, escalón B)
y **antes** de `reclamarEnvio` (`:297`, escalón D). Corregir y reenviar de inmediato **SHALL** tener éxito, porque
la reclamación nunca se tomó; un `422` posterior a la reclamación dejaría `enviado_at` fijado y bloquearía el
reintento durante `VENTANA_REENVIO_SEGUNDOS`.

#### Scenario: Sin rotulado, no se envía
- GIVEN una remisión del formulario nuevo con las fotos completas y `rotulado_at` en `NULL`
- WHEN se llama `POST /:id/enviar`
- THEN responde `422`, no dispara a n8n y `enviado_at` sigue `NULL`

#### Scenario: Faltan fotos mínimas y el 422 nombra las categorías
- GIVEN una remisión del formulario nuevo, rotulada, con sólo una foto de `equipo`
- WHEN se llama `POST /:id/enviar`
- THEN responde `422`, nombra `accesorios` y `embalaje`, no dispara y `enviado_at` sigue `NULL`

#### Scenario: Sin novedad con las tres fotos mínimas se envía
- GIVEN una remisión del formulario nuevo con sólo la novedad que excluye a las demás, rotulada, con una foto de cada categoría mínima
- WHEN se llama `POST /:id/enviar`
- THEN responde `200`

#### Scenario: Cada novedad marcada exige su foto
- GIVEN una remisión rotulada, con las tres categorías mínimas, y dos novedades marcadas con foto sólo de una
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

#### Scenario: El orden interno es rotulado, fotos mínimas, foto por novedad
- GIVEN una remisión sin rotulado, sin fotos mínimas y con una novedad sin foto
- WHEN se llama `POST /:id/enviar`
- THEN el `422` es el del rotulado
- AND con el rotulado hecho, el `422` es el de las fotos mínimas
- AND con las mínimas subidas, el `422` es el de la foto de la novedad; permutar cualquier par de las tres guardas pone la prueba en rojo

#### Scenario: La anulación y «ya enviada» ganan a la puerta de contenido
- GIVEN una remisión del formulario nuevo anulada, o en `ok`, sin rotulado y sin fotos
- WHEN se llama `POST /:id/enviar`
- THEN responde el `409` de anulada o de ya enviada, no el `422`

#### Scenario: El 422 de contenido no reclama el envío
- GIVEN una remisión del formulario nuevo incompleta
- WHEN se llama `POST /:id/enviar`, se completa lo que faltaba y se reintenta de inmediato
- THEN el primer intento responde `422` con `enviado_at` en `NULL` y el segundo responde `200`

### Requirement: RQ-RE-27 · El formulario nuevo se reconoce por `novedades`; lo anterior sigue por la regla de legado

El alta **SHALL** tratar la remisión como del **formulario nuevo** cuando el cuerpo trae la clave `novedades` con
cualquier valor distinto de `undefined`, y las reglas de RQ-RE-23 y RQ-RE-24 **SHALL** aplicarse sólo entonces
(un `null` o cualquier valor que no sea una lista se rechaza con `422`, no se toma por ausente). `/enviar` y la
subida **SHALL** reconocerla por `public.remisiones.novedades IS NOT NULL`.

Una remisión con `novedades` en `NULL` —las históricas, las pendientes anteriores a este cambio, las que sube
un cliente anterior que no manda `novedades`— **SHALL** ser de **legado** y **SHALL** comportarse como antes:

- el alta guarda `hay_novedad` y `observaciones` como los trae el cuerpo (RQ-RE-17), sin exigir rotulado ni
  lista y sin escribir `novedades`, `novedad_otro`, `rotulado_por` ni `rotulado_at`;
- `/enviar` aplica sólo el predicado `faltaFotoPorNovedad` (RQ-RE-18), con el mismo `422` y el mismo texto
  (`routes/remision.ts:291`): `hay_novedad = true` y cero fotos bloquea; con una foto, de cualquier categoría
  o sin ella, no bloquea; `hay_novedad` en `false` o `null` no bloquea ni con cero fotos;
- la subida acepta fotos sin categoría (RQ-RE-25).

#### Scenario: Un alta de cliente viejo, sin `novedades`, se crea como hoy
- GIVEN un cuerpo con `hayNovedad: true`, unas `observaciones` y sin `novedades` ni `rotulado`
- WHEN se crea la remisión
- THEN responde `201`, `hay_novedad = true`, `observaciones` es la del cuerpo y `novedades`, `rotulado_por` y `rotulado_at` son `NULL`

#### Scenario: La remisión de legado con novedad y cero fotos sigue bloqueada por la regla anterior
- GIVEN una remisión con `novedades` en `NULL`, `hay_novedad = true` y cero fotos
- WHEN se llama `POST /:id/enviar`
- THEN responde `422` con el texto de legado y no reclama el envío
- AND con una foto sin categoría y el reintento inmediato responde `200`

#### Scenario: La remisión de legado sin novedad se envía con cero fotos
- GIVEN una remisión con `novedades` en `NULL`, `hay_novedad` en `false` o `null` y cero fotos
- WHEN se llama `POST /:id/enviar` sin otros bloqueos
- THEN responde `200`

#### Scenario: Una remisión histórica no queda sujeta a las reglas nuevas
- GIVEN una remisión de `origen = 'historico'`
- WHEN se llama `POST /:id/enviar` o se lee
- THEN no se le aplican el rotulado ni las fotos por categoría

#### Scenario: `novedades` nulo o que no es lista se rechaza, no se toma por legado
- GIVEN un cuerpo con `novedades: null`, o con `novedades: 'x'`
- WHEN se crea la remisión
- THEN responde `422`

## MODIFIED Requirements

### Requirement: RQ-RE-08 · El cerrojo de reenvío tiene SEIS puertas, en este orden

`POST /:id/enviar` **SHALL** cortar en el orden observable siguiente:

| Orden | Guarda | Respuesta | Evidencia |
|---|---|---|---|
| 1 | La remisión no existe | `404` | `routes/remision.ts:276` |
| 2 | Está anulada | `409` | `:279-281` |
| 3 | Ya está cerrada (`ok` u `ok_con_avisos`) | `409` | `:284-286` |
| 4 | **Contenido del registro de entrada**: en el formulario nuevo, rotulado → fotos mínimas → foto de cada novedad (RQ-RE-26); en legado, novedad declarada y cero fotos (RQ-RE-27) | `422` | entre la de orden 3 (`:284-286`) y `reclamarEnvio` (`:297`) |
| 5 | Reclamación perdida | `409` | `:297-299` |
| 6 | Sin ticket asociado | `422` | `:302` |

La anulación **SHALL** cortar **antes** de mirar el estado del flujo, porque «generar un documento en Drive de
algo que se acaba de anular sería absurdo» (`:277-278`; probado en `remisiones.test.ts:662`).

La puerta de orden 4 **SHALL** ejecutarse **antes** de `reclamarEnvio` (orden 5) y **MUST NOT** escribir nada ni
reclamar el envío: `reclamarEnvio` es el único `UPDATE` que fija `enviado_at` (`db/remisiones.ts:170-182`), y un
`422` posterior a esa reclamación dejaría la remisión bloqueada durante toda la ventana de reenvío
(`VENTANA_REENVIO_SEGUNDOS`, 120 s). Sigue siendo **una sola** puerta, con una sola posición: lo que cambia es
la regla que aplica según la remisión sea del formulario nuevo o de legado. Encaja en el orden A<B<C<D de
F1B-10: existencia (404), estado y permiso (anulada, ya enviada), **contenido** (rotulado y fotos, o novedad sin
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

### Requirement: RQ-RE-13 · Las fotos son datos de la app, con dos guardas propias

Las fotos **SHALL** guardarse en `public.remision_fotos` como base64 sobre `text`
(`schema.sql:294-303`), y su subida **SHALL** aceptar sólo cuatro tipos de imagen, **con SVG fuera**
porque permite script embebido (`routes/remision.ts:19-20` y subida en `:378-388`).

- La lectura **SHALL** servirlas con `X-Content-Type-Options: nosniff` (`:394`).
- El listado del panel **MUST NOT** devolver el base64; sólo la ruta de contenido lo sirve
  (`db/remisiones.ts:202` y `:226`; probado en `remisiones.test.ts:550`). Lo que el listado SÍ devuelve de cada
  foto es su metadato, incluidas `categoria` y `novedad` (RQ-RE-25).
- Cada foto **SHALL** poder llevar una categoría (`equipo`, `accesorios`, `embalaje` o `novedad`) y, para la de
  novedad, la clave de la novedad que documenta; la subida valida las dos (RQ-RE-25) y las puertas de
  `/enviar` las leen (RQ-RE-26). Las columnas son aditivas, `NULL`-ables y sin relleno: las fotos anteriores
  quedan con `categoria = NULL`.
- La categoría de la foto **MUST NOT** viajar a n8n: el cuerpo que arma `buildRemisionPayload` sigue llevando de
  cada foto sólo `fileName`, `mimeType` y `data` (`remisionWebhook.ts:23`).
- `urlSegura` **SHALL** exigir `https://` y rechazar la comilla doble antes de que `carpetaUrl` llegue
  a un `href` (`packages/shared/src/remision.ts:100-101`). Las dos razones están escritas y son
  distintas: el `javascript:` que se ejecutaría al clic si el secreto del callback se filtrara
  (`:87-90`), y la comilla que se saldría del atributo en el HTML que la historia del ticket devuelve
  por la API, «y dejaría la seguridad entera en manos de quien lo pinte» (`:94-98`).

#### Scenario: El listado de fotos trae categoría y novedad y no el base64
- GIVEN una remisión con una foto de categoría `novedad` y su clave
- WHEN se lista con `GET /api/remisiones/:id`
- THEN la foto trae `categoria` y `novedad` y no trae el base64

#### Scenario: Las fotos de n8n no ganan la categoría
- GIVEN una remisión con fotos categorizadas
- WHEN se arma el cuerpo con `buildRemisionPayload` a partir de `listFotosConContenido`
- THEN cada foto del cuerpo tiene exactamente las claves `fileName`, `mimeType` y `data`

### Requirement: RQ-RE-17 · La remisión de entrada declara si el equipo llega con novedad

El alta **SHALL** persistir en `public.remisiones.hay_novedad boolean` (columna calificada, aditiva y
`NULL`-able) si el equipo llega con novedad, de dos maneras según el origen del cuerpo:

- **Formulario nuevo** (`novedades` presente, RQ-RE-27): `hay_novedad` lo **deriva** el servidor de las
  novedades marcadas (RQ-RE-23) y el `hayNovedad` del cuerpo **SHALL** ignorarse. El servidor exige que la
  lista venga contestada —la lista vacía se rechaza—, de modo que «sin contestar» y «Sin novedad» dejan de
  confundirse.
- **Legado** (sin `novedades`): `hayNovedad` **SHALL** guardarse como `true` o `false` cuando el cuerpo trae
  exactamente eso, y como `null` en cualquier otro caso —ausente, `undefined` u otro tipo—, sin rechazar la
  petición por ese campo. La obligación de contestar no la impone el servidor en el legado.

Las remisiones **anteriores** a esta columna y las de `origen: 'historico'` **SHALL** leerse con
`hay_novedad = null` —«sin declarar»— y **MUST NOT** quedar sujetas a la guarda de RQ-RE-08 que exige foto por
novedad ni a las del formulario nuevo: la regla no es retroactiva.

El envío a n8n (`remisionWebhook.ts:5-24`) **MUST NOT** ganar ningún campo nuevo: ni `hayNovedad`, ni
`novedades`, ni `novedadOtro`, ni `rotulado*`. `observaciones` sigue viajando como hasta ahora; en el formulario
nuevo lleva el texto compuesto de RQ-RE-23.

#### Scenario: El alta de legado persiste el valor declarado
- GIVEN una remisión de entrada sin `novedades` y con `hayNovedad: true`
- WHEN se crea con `POST /api/remisiones`
- THEN la fila queda con `hay_novedad = true`

#### Scenario: En legado, cualquier valor que no sea true/false se guarda como no declarado
- GIVEN una remisión sin `novedades` y sin `hayNovedad` en el cuerpo, o con un valor que no es booleano
- WHEN se crea
- THEN la fila queda con `hay_novedad = null`, y la petición no se rechaza por ese campo

#### Scenario: En el formulario nuevo el hayNovedad del cuerpo no manda
- GIVEN una remisión con `novedades` de una novedad real y `hayNovedad: false`
- WHEN se crea
- THEN la fila queda con `hay_novedad = true`

#### Scenario: El payload a n8n no cambia
- GIVEN una remisión del formulario nuevo, con novedades, rotulado y fotos categorizadas
- WHEN se envía con `POST /:id/enviar`
- THEN el payload que construye `buildRemisionPayload` tiene exactamente las mismas claves que sin este cambio: no incluye `hayNovedad`, `novedades`, `novedadOtro`, `rotuladoPor`, `rotuladoAt` ni la categoría de las fotos
- AND `observaciones` lleva el texto compuesto

### Requirement: RQ-RE-18 · Predicados compartidos de exigencia de foto y de validación de novedades

`packages/shared` **SHALL** conservar el predicado puro `faltaFotoPorNovedad` (`packages/shared/src/remision.ts:110`)
con su comportamiento actual, como la regla de las remisiones de legado (RQ-RE-27), y **SHALL** exportar además,
en un módulo propio, las reglas puras del formulario nuevo, que dependen sólo de sus argumentos (la lista de
novedades con sus marcas, la selección, el texto y las fotos):

- la **validación de la selección**: lista no vacía, claves conocidas y activas, la novedad con `excluye_demas`
  no combinada con otra, y texto presente cuando alguna marcada tiene `exige_texto` (RQ-RE-23);
- la **derivación de `hay_novedad`** y la **composición de `observaciones`** (RQ-RE-23);
- el cálculo de **lo que falta** para enviar: las categorías mínimas sin foto y las novedades marcadas sin la
  suya (RQ-RE-26).

El servidor (RQ-RE-23, RQ-RE-25, RQ-RE-26) y el formulario (RQ-RE-19) **SHALL** consumir las MISMAS funciones —
regla invariable 13, punto 1: el cliente no reescribe la regla del servidor—. Ningún `.tsx` **MUST** llevar su
propia copia de las reglas de selección ni de fotos.

#### Scenario: Con novedad y cero fotos, el predicado de legado bloquea
- GIVEN `hayNovedad = true` y `fotos.length = 0`
- WHEN se evalúa `faltaFotoPorNovedad`
- THEN devuelve que la remisión está bloqueada

#### Scenario: Sin novedad, o con al menos una foto, el predicado de legado no bloquea
- GIVEN `hayNovedad` en `false` o `null`, o `fotos.length >= 1` con `hayNovedad = true`
- WHEN se evalúa `faltaFotoPorNovedad`
- THEN devuelve que la remisión no está bloqueada

#### Scenario: La validación de la selección distingue cada causa
- GIVEN una lista con sus marcas
- WHEN se valida una selección vacía, una con clave desconocida, una con clave inactiva, una con la novedad que excluye combinada con otra y una con «Otro» sin texto
- THEN cada una se rechaza con su causa propia, y una selección correcta se acepta

#### Scenario: La derivación y la composición siguen las marcas, no las claves
- GIVEN una selección de dos novedades, una con `exige_texto`, y el texto
- WHEN se derivan `hay_novedad` y `observaciones`
- THEN `hay_novedad` es `true` y `observaciones` junta las etiquetas con `; ` y añade `: {texto}` a la que exige texto
- AND cambiar las marcas, no las claves, cambia el resultado

#### Scenario: Lo que falta para enviar se calcula por categoría y por novedad
- GIVEN fotos con categorías y claves de novedad
- WHEN se calcula lo que falta para dos novedades marcadas
- THEN devuelve las categorías mínimas sin foto y las novedades sin la suya; una foto de una categoría no cubre otra; la novedad con `excluye_demas` no exige foto

### Requirement: RQ-RE-19 · El formulario pide rotulado, lista de novedades y fotos por categoría, y no deja crear ni continuar sin ellas

`CrearRemision.tsx` **SHALL** presentar, en lugar de la pregunta «¿El equipo llega con novedad?» y del texto libre
de observaciones:

- la lista de novedades servida por RQ-RE-22, de selección múltiple y sin ninguna marcada por defecto; marcar la
  novedad que excluye a las demás desmarca el resto y marcar otra la desmarca; marcar la que exige texto abre su
  campo de texto;
- la casilla «Rotulado y guardado», sin marcar por defecto;
- las fotos por categoría —equipo, accesorios y embalaje— y, por cada novedad marcada, la de esa novedad.

El formulario **SHALL** impedir crear la remisión sin lista contestada, sin la casilla marcada y sin el texto
exigido, y **MUST NOT** ofrecer «Continuar sin fotos» cuando aceptarlo dejaría sin foto alguna categoría mínima o
alguna novedad marcada. Todas las comprobaciones **SHALL** salir de las funciones compartidas de RQ-RE-18.

**Regla 13, decisión a decisión.** Cada decisión del formulario tiene su contrapartida en el servidor, con lo
que el formulario es comodidad probada: claves válidas y activas, lista vacía, exclusión de «Sin novedad», texto
de «Otro» y rotulado, en el alta (RQ-RE-23, RQ-RE-24); categoría y novedad de la foto, en la subida
(RQ-RE-25); fotos mínimas y foto por novedad, en `/enviar` (RQ-RE-26). La persona, la fecha y la hora del
rotulado y `hay_novedad` y `observaciones` los decide el servidor y el formulario no los decide.

#### Comprobaciones de persona de RQ-RE-19 — NO son escenarios automáticos
> Los `.tsx` quedan fuera de la red de pruebas por decisión de Gerencia (F0-00, `vitest.config.ts:16-20`).
> **Dueño:** Servicio Técnico, en la app. **ARCHIVAR ESTE CAMBIO NO LAS DA POR HECHAS.**

- **Persona-1.** GIVEN el formulario de alta · WHEN se abre · THEN muestra la lista de novedades de la base, sin
  ninguna marcada, y la casilla «Rotulado y guardado» sin marcar; no hay campo de observaciones libre.
- **Persona-2.** GIVEN «Sin novedad» marcada · WHEN se marca otra novedad · THEN «Sin novedad» se desmarca; y
  al revés.
- **Persona-3.** GIVEN «Otro» marcada y sin texto, o la casilla sin marcar · WHEN se intenta crear · THEN el
  formulario lo impide.
- **Persona-4.** GIVEN una novedad marcada y sin su foto, o alguna categoría mínima sin foto · WHEN se intenta
  crear o continuar · THEN el formulario lo impide y no ofrece «Continuar sin fotos».
- **Persona-5.** GIVEN un envío bloqueado por el `422` de RQ-RE-26 · WHEN el técnico lo lee · THEN el mensaje
  dice qué categoría o novedad falta.
