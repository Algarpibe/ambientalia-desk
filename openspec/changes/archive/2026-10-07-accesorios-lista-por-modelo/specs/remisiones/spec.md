# Delta para `remisiones`

Los requisitos nuevos van a continuación de RQ-RE-31 (el último vivo, `openspec/specs/remisiones/spec.md:1441`). Se
modifica un requisito vivo, RQ-RE-21, porque fija el número y la lista de las novedades sembradas. RQ-RE-03 no cambia
de comportamiento —`checklistDeRemision` sigue devolviendo los mismos nombres, en el mismo orden y con el mismo
`origen`—: el detalle es un campo aditivo y lo cubre RQ-RE-32.

Escalones de F1B-10: A existencia < B estado y permiso < C contenido < D unicidad.

## ADDED Requirements

### Requirement: RQ-RE-32 · El formulario de entrada recibe, además de los nombres, el detalle de cada accesorio

`GET /api/remisiones/nueva` **SHALL** devolver, además de `incluye: string[]`, el campo aditivo `incluyeDetalle`: una
lista con el nombre y, cuando lo hay, el SKU de cada ítem (`{ nombre, sku }`, con `sku` nulo si no lo hay).
`incluye` **MUST NOT** cambiar de forma ni de contenido: sigue siendo la lista de nombres que hoy sirve
`apps/desk/server/routes/remision.ts:68` y contra la que el alta valida con `apps/desk/server/routes/remision.ts:194-197`.

- Un ítem **sin SKU** **SHALL** salir en `incluyeDetalle` con el nombre y `sku` nulo; el formulario **SHALL** pintar el
  SKU junto al nombre sólo cuando viene.
- `incluyeDetalle` **SHALL** salir de la misma lectura que `incluye` (`apps/desk/server/db/checklistRemision.ts:31-43`),
  con los mismos nombres y en el mismo orden, sin repetidos: lo que el técnico ve marcable es lo que el servidor acepta
  (regla invariable 13).
- Con origen `perfil` (ticket sin equipo enlazado, `apps/desk/server/db/checklistRemision.ts:35-37`) `incluyeDetalle`
  **SHALL** salir **sin SKU**: la lista por perfil no lo guarda.
- Dos artículos con el mismo nombre **MUST NOT** producir dos entradas en `incluyeDetalle`: una entrada por nombre,
  gana la primera.
- El SKU **MUST NOT** guardarse en la remisión ni viajar a n8n: es dato de presentación del formulario.
- El payload a n8n (`apps/desk/server/remisionWebhook.ts:46`) **MUST** conservar sus claves y valores, sin
  `incluyeDetalle` ni SKU.

*Nota (hipótesis).* Que el SKU de Books haga de «número de parte» es una **hipótesis** (S-1 de la propuesta; el maestro
usa los dos términos como equivalentes pero la decisión lo deja abierto). La spec fija qué se enseña (el SKU), no que sea
el número de parte.

#### Scenario: Accesorio con SKU
- GIVEN un modelo con un accesorio activo de nombre «Cable USB» y SKU «CB-100»
- WHEN se pide `GET /api/remisiones/nueva` de un ticket cuyo equipo es de ese modelo
- THEN `incluye` contiene «Cable USB», y `incluyeDetalle` trae una entrada con nombre «Cable USB» y SKU «CB-100»

#### Scenario: Accesorio sin SKU
- GIVEN un accesorio activo del modelo cuyo artículo no tiene SKU, o una fila sin artículo de Books
- WHEN se pide el formulario
- THEN su entrada de `incluyeDetalle` lleva el nombre y `sku` nulo, y el formulario pinta sólo el nombre

#### Scenario: `incluye` no cambia
- GIVEN cualquier modelo con accesorios
- WHEN se pide el formulario antes y después del cambio
- THEN `incluye` es el mismo `string[]`, con los mismos nombres y en el mismo orden

#### Scenario: Origen perfil sin SKU
- GIVEN un ticket sin equipo enlazado, que cae a la lista por perfil
- WHEN se pide el formulario
- THEN `origenChecklist` es `perfil`, `incluye` es la lista del perfil y todas las entradas de `incluyeDetalle` van sin SKU

#### Scenario: Nombres duplicados
- GIVEN dos artículos activos del modelo con el mismo nombre
- WHEN se pide el formulario
- THEN `incluyeDetalle` trae una sola entrada con ese nombre

#### Scenario: Los nombres de `incluyeDetalle` son los de `incluye` sin repetidos
- GIVEN cualquier caso de los anteriores
- WHEN se comparan las dos listas
- THEN los nombres de `incluyeDetalle` son los de `incluye`, sin repetidos y en el mismo orden

### Requirement: RQ-RE-33 · Un artículo de clase `accesorio` exige artículo de Books, en las tres vías por las que nace

El catálogo de equipos **MUST NOT** crear ni dejar pasar a clase `accesorio` un artículo sin `item_id` (sin artículo de
Books). La regla vive en `packages/shared` (fichero nuevo) y el servidor la impone en las tres vías; las demás clases
(`consumible_repuesto` y el resto) **SHALL** seguir admitiendo texto libre. La imposición está en las rutas HTTP, no en la
función de escritura de datos: las filas de legado y la materialización de accesorios siguen pudiendo escribir con y sin
`itemId`.

**Alta.** `POST /api/catalogo/modelos/:id/articulos` con clase `accesorio` y sin `itemId` **SHALL** responder `422`. La
guarda es de escalón C y **SHALL** ir **después** de «Modelo no encontrado» (`apps/desk/server/routes/catalogo.ts:215`,
A) y de «Clase de artículo desconocida» (`apps/desk/server/routes/catalogo.ts:219`), y **antes** de «El nombre es
obligatorio» (`apps/desk/server/routes/catalogo.ts:231`) y del `409` de artículo repetido
(`apps/desk/server/routes/catalogo.ts:238`, D).

**Cambio de clase.** `PATCH /api/catalogo/articulos/:id` que lleve la clase a `accesorio` sobre un artículo que no es ya
accesorio y no tiene `item_id` **SHALL** responder `422` y **MUST NOT** escribir nada. La guarda es de escalón C y
**SHALL** ir **después** de «Clase de artículo desconocida» (`apps/desk/server/routes/catalogo.ts:293`) y **antes** de
la escritura (`apps/desk/server/routes/catalogo.ts:298`). Una fila de legado que **ya es** accesorio sin `item_id`
**MUST** poder seguir desactivándose o reactivándose con un `PATCH` que repita su clase. Con un id inexistente el `PATCH`
**SHALL** seguir respondiendo `200` sin escribir nada, como hoy: la guarda sólo decide si hay algo que proteger.

**Copia entre modelos (S-9).** `POST /api/catalogo/modelos/:id/copiar-articulos` de la clase `accesorio` **SHALL** no
copiar los accesorios activos de origen sin `item_id` y **SHALL** declarar cuántos fueron en un campo aditivo `sinBooks`
de la respuesta, contando cada artículo de **origen** una vez, sin multiplicar por destinos. `omitidos` **SHALL**
conservar su significado actual —artículos que no se copiaron por choque de nombre en el destino
(`apps/desk/server/db/catalogoArticulos.ts:184`)— y **MUST NOT** sumar los excluidos por falta de artículo. Los que sí
tienen `item_id` se copian como hoy. Con cualquier otra clase `sinBooks` **SHALL** valer `0` y la copia **MUST NOT**
cambiar.

**Orden de guardas.** El orden de las guardas del alta y del `PATCH` **SHALL** estar probado **por pares con las dos
guardas activas a la vez** en estos casos:

| Puerta | Par | Caso | Esperado |
|---|---|---|---|
| Alta | A frente a C nueva | modelo inexistente y accesorio sin `itemId` | `404` |
| Alta | permiso frente a C nueva | sujeto no administrador y accesorio sin `itemId` | `403` |
| Alta | C nueva frente a «El nombre es obligatorio» | accesorio sin `itemId` y nombre en blanco | `422` del artículo de Books |
| Alta | C nueva frente a `409` | accesorio sin `itemId` cuyo nombre ya existe en el modelo (fila de legado) | `422`, no `409` |
| `PATCH` | C nueva frente a la escritura | `clase: accesorio` y `activo: false` sobre un artículo sin `item_id` que no es accesorio | `422` y la fila conserva clase y `activo` |

**Par que no se puede activar a la vez, y se declara.** «Clase de artículo desconocida» y la guarda de accesorio **MUST
NOT** probarse como par: una petición no puede traer una clase desconocida y a la vez ser `accesorio`. Su orden —la clase
desconocida primero— lo fija la dependencia de datos (la guarda de accesorio necesita una clase conocida), no una
convención.

#### Scenario: Alta de accesorio sin artículo de Books
- GIVEN un modelo existente y un super administrador
- WHEN envía `POST /api/catalogo/modelos/:id/articulos` con clase `accesorio` y nombre «Pletinas», sin `itemId`
- THEN responde `422` y no se crea fila

#### Scenario: Alta de accesorio con artículo de Books
- GIVEN un artículo existente en Books
- WHEN el super administrador lo da de alta como `accesorio` con su `itemId`
- THEN responde `201`, y nombre y SKU los escribe el servidor desde Books

#### Scenario: Modelo inexistente gana a la guarda de accesorio
- GIVEN un modelo que no existe y una petición de clase `accesorio` sin `itemId`
- WHEN se envía
- THEN responde `404`

#### Scenario: El permiso gana a la guarda de accesorio
- GIVEN un usuario que no es administrador y una petición de clase `accesorio` sin `itemId`
- WHEN se envía
- THEN responde `403` y no el `422` del artículo

#### Scenario: Posición frente a «El nombre es obligatorio»
- GIVEN una petición de clase `accesorio`, sin `itemId` y con nombre en blanco
- WHEN se envía
- THEN el `422` es el del artículo de Books faltante, no el de «El nombre es obligatorio»

#### Scenario: Posición frente al `409`
- GIVEN un accesorio de legado sin `item_id` ya existente en el modelo y una petición de clase `accesorio` con el mismo nombre y sin `itemId`
- WHEN se envía
- THEN responde `422` y no `409`

#### Scenario: Clase desconocida, orden declarado
- GIVEN una petición con una clase que no existe
- WHEN se envía
- THEN responde el `422` de «Clase de artículo desconocida»; el orden frente a la guarda de accesorio no se prueba como par porque las dos condiciones no pueden darse a la vez

#### Scenario: Las demás clases siguen con texto libre
- GIVEN un modelo existente
- WHEN el super administrador da de alta un artículo de clase `consumible_repuesto` con nombre y sin `itemId`
- THEN responde `201`

#### Scenario: PATCH a accesorio de un artículo sin `item_id`
- GIVEN un artículo de clase `consumible_repuesto` sin `item_id`
- WHEN se envía `PATCH` con clase `accesorio`
- THEN responde `422` y la fila conserva su clase

#### Scenario: PATCH a accesorio de un artículo con `item_id`
- GIVEN un artículo de clase `consumible_repuesto` con `item_id`
- WHEN se envía `PATCH` con clase `accesorio`
- THEN responde `200` y la fila pasa a `accesorio`

#### Scenario: PATCH que repite la clase de un accesorio de legado
- GIVEN un accesorio sin `item_id` ya existente
- WHEN se envía `PATCH` con clase `accesorio` y `activo: false`
- THEN responde `200` y la fila queda desactivada

#### Scenario: PATCH de un id inexistente
- GIVEN un id que no existe en el catálogo
- WHEN se envía `PATCH` con clase `accesorio`
- THEN responde `200`, como antes del cambio, y no se escribe nada

#### Scenario: Copia que no copia los accesorios sin `item_id`
- GIVEN un modelo con dos accesorios activos, uno con `item_id` y otro sin él, y un modelo de destino vacío
- WHEN se copia la clase `accesorio` al destino
- THEN se copia uno, `sinBooks` vale `1`, `omitidos` vale `0`, la respuesta es `200` y el destino no gana ninguna fila sin `item_id`

#### Scenario: `omitidos` conserva su significado
- GIVEN un destino que ya tiene un accesorio con el mismo nombre que uno de origen con `item_id`
- WHEN se copia la clase `accesorio`
- THEN `omitidos` cuenta ese choque de nombre y `sinBooks` no lo cuenta

### Requirement: RQ-RE-34 · «Accesorio fuera de lista» es una novedad sembrada que exige texto

El catálogo de novedades (RQ-RE-21) **SHALL** contener la novedad de clave `accesorio_fuera_de_lista`, con etiqueta
«Accesorio fuera de lista», `orden` 65, `exige_texto = true` y `excluye_demas = false`, que sustituye al texto libre de
accesorios en el formulario: un accesorio que no está en la lista del modelo es una novedad, no un ítem escrito a mano
(`decision/e232-accesorios-lista-por-modelo`).

- La siembra **SHALL** ser idempotente (`ON CONFLICT (clave) DO NOTHING`), como las diez existentes
  (`packages/zoho-sync/src/db/schema.sql:690-699`), con esquema calificado (`public.`), y la fila va **al final** de
  `schema.sql`, sin renumerar el `orden` de las demás.
- Una base ya desplegada **SHALL** recibirla en el arranque por la siembra, sin migración ni relleno.
- El alta de remisión **MUST NOT** ganar ninguna guarda: la novedad pasa por la validación de recepción que ya existe
  (RQ-RE-23): marcada, exige texto (`packages/shared/src/recepcion.ts:97-99`) y, como toda novedad marcada, exige su foto
  (RQ-RE-26).
- Si se marcan a la vez «Otro» y esta novedad, comparten el **mismo** texto (S-10): `validarRecepcion` no cambia.
- Las diez novedades anteriores **MUST NOT** cambiar.
- La novedad **SHALL** poder retirarse con `activo = false` desde RQ-RE-29, como cualquier otra que no excluya a las demás.

#### Scenario: La novedad existe tras migrar
- GIVEN una base migrada
- WHEN se lee `public.catalogo_novedades`
- THEN hay una fila con clave `accesorio_fuera_de_lista`, orden 65, `exige_texto = true` y `excluye_demas = false`, y las diez de antes siguen igual

#### Scenario: Migrar dos veces no duplica ni pisa
- GIVEN la fila sembrada, con su etiqueta cambiada por el Director Técnico
- WHEN se vuelve a ejecutar la migración
- THEN sigue habiendo una sola fila con `accesorio_fuera_de_lista` y conserva la etiqueta editada

#### Scenario: Marcada sin texto
- GIVEN un alta de remisión con `accesorio_fuera_de_lista` marcada y sin texto
- WHEN se envía
- THEN responde `422` con el mensaje de la validación de recepción de «exige describir la novedad»

#### Scenario: Marcada con texto
- GIVEN un alta con `accesorio_fuera_de_lista` marcada y texto «Cable de red»
- WHEN se envía con los demás campos válidos
- THEN el alta se acepta, `hay_novedad` queda en verdad y el texto entra en las observaciones compuestas

#### Scenario: Exige foto como toda novedad marcada
- GIVEN una remisión guardada con `accesorio_fuera_de_lista` marcada y sin foto de esa novedad
- WHEN se intenta enviar
- THEN `/enviar` responde `422` por la regla de RQ-RE-26

### Requirement: RQ-RE-35 · El Director Técnico añade a la lista de un modelo un artículo de Books como accesorio

Quien tenga el permiso `puedeMantenerNovedades` (área Servicio Técnico y cargo Director Técnico; el administrador pasa,
`packages/shared/src/mantenimientoNovedades.ts:15-18`) **SHALL** poder **añadir** a la lista de accesorios de un modelo un
artículo de Books por `POST /api/catalogo/modelos/:id/accesorios`, ruta nueva en un fichero propio que no sustituye las
del super administrador. Responde `201 { id }`. El servidor **SHALL** fijar la clase en `accesorio`; la ruta **MUST NOT**
aceptar clase ni nombre del navegador —los ignora—: el artículo se identifica por su `itemId` y su nombre y SKU los
escribe el servidor desde Books.

**Orden de guardas** (F1B-10), con el molde de `apps/desk/server/routes/novedades.ts:39-48`:

| Orden | Guarda | Código | Escalón |
|---|---|---|---|
| 1 | El modelo no existe | `404` | A |
| 2 | El usuario no tiene `puedeMantenerNovedades` | `403` | B |
| 3 | Falta `itemId` (cuerpo sin artículo) | `422` | C |
| 4 | El artículo no está en Books | `422` | C |
| 5 | El artículo ya está en la lista del modelo | `409` | D |

- La unicidad **SHALL** salir de la misma regla que ya usa el catálogo (`ArticuloRepetido`, traducida a `409`).
- La ruta **MUST** sólo añadir: retirar, reordenar, copiar y borrar siguen siendo del super administrador.
- El `201` **SHALL** dejar el accesorio activo y visible en la lista del modelo y en el formulario de entrada (RQ-RE-32).
- **Pares probados con las dos guardas activas a la vez** (regla de mutación 1): A frente a B (modelo inexistente y
  técnico sin cargo: `404`); A frente a C (modelo inexistente y cuerpo vacío: `404`); B frente a C-falta (técnico sin
  cargo y cuerpo vacío: `403`); B frente a C-no-en-Books (técnico sin cargo y `itemId` inexistente: `403`); B frente a D
  (técnico sin cargo y artículo ya en la lista: `403`, sin fila nueva).
- **Pares que NO se pueden activar a la vez, y se declaran en vez de fingir la prueba:** C-falta frente a
  C-no-en-Books (sin `itemId` no hay artículo que buscar en Books), y C frente a D (el `409` necesita el nombre que da
  Books, y sólo se conoce tras resolver el artículo). Su orden lo fija la dependencia de datos, no una convención.
- IV-12 no se amplía: esta ruta no toca el alta de remisión ni su orden de guardas.

#### Scenario: El Director Técnico añade un artículo de Books
- GIVEN un usuario con área Servicio Técnico y cargo Director Técnico, un modelo existente y un artículo existente en Books
- WHEN añade ese artículo por `POST /api/catalogo/modelos/:id/accesorios`
- THEN responde `201 { id }`, el artículo queda como `accesorio` activo con nombre y SKU de Books, y aparece en el formulario de entrada de un equipo de ese modelo

#### Scenario: Otro cargo no puede
- GIVEN un usuario de Servicio Técnico con cargo Técnico, o un Director Técnico de otra área
- WHEN intenta añadir un artículo
- THEN responde `403` y la lista del modelo no cambia

#### Scenario: Modelo inexistente gana al permiso
- GIVEN un modelo que no existe y un usuario sin permiso
- WHEN envía la petición
- THEN responde `404`, no `403`

#### Scenario: Modelo inexistente gana al contenido
- GIVEN un modelo que no existe y un cuerpo vacío
- WHEN envía la petición
- THEN responde `404`, no `422`

#### Scenario: Permiso gana a «falta el artículo»
- GIVEN un modelo existente, un usuario sin permiso y un cuerpo vacío
- WHEN envía la petición
- THEN responde `403`, no `422`

#### Scenario: Permiso gana a «no está en Books»
- GIVEN un modelo existente, un usuario sin permiso y un `itemId` que no existe en Books
- WHEN envía la petición
- THEN responde `403`, no `422`

#### Scenario: Permiso gana a la unicidad
- GIVEN un usuario sin permiso y un artículo que ya está en la lista del modelo
- WHEN lo añade otra vez
- THEN responde `403` y no se crea fila

#### Scenario: Falta el artículo
- GIVEN un usuario con permiso, un modelo existente y un cuerpo sin `itemId`
- WHEN envía la petición
- THEN responde `422` y no se crea fila

#### Scenario: Artículo que no está en Books
- GIVEN un usuario con permiso, un modelo existente y un `itemId` que no existe en Books
- WHEN envía la petición
- THEN responde `422` y no se crea fila

#### Scenario: Artículo repetido
- GIVEN un artículo de Books ya presente en la lista del modelo
- WHEN el Director Técnico lo añade otra vez
- THEN responde `409` y no se crea fila

#### Scenario: Orden declarado, no probado como par
- GIVEN la ruta con sus cinco guardas
- WHEN se revisa el orden de «falta el artículo», «no está en Books» y «repetido»
- THEN el orden es el de la tabla porque cada guarda necesita el dato que la anterior resuelve; no existe una petición que active dos de ellas a la vez

#### Scenario: La clase y el nombre no vienen del navegador
- GIVEN una petición con `clase` distinta de `accesorio` y un `nombre` propio, junto a un `itemId` válido
- WHEN se envía
- THEN el artículo se crea de clase `accesorio` y con el nombre que tiene en Books

#### Scenario: Sólo añade
- GIVEN un usuario con `puedeMantenerNovedades` que no es administrador
- WHEN intenta retirar, reordenar, copiar o borrar artículos del catálogo
- THEN las rutas del super administrador responden como hoy, y no hay ruta nueva para esas operaciones

### Requirement: RQ-RE-36 · Lo ya guardado y lo ya sembrado se sigue leyendo y aceptando igual

El cambio **MUST NOT** requerir migración ni escribir datos. **SHALL** conservarse:

- Una **remisión guardada** cuyo `incluye` contenga texto libre que hoy no está en ninguna lista **SHALL** leerse y
  reenviarse a n8n tal cual (`apps/desk/server/remisionWebhook.ts:46`), sin revalidar contra el catálogo.
- Las **filas de `catalogo_articulos` de clase `accesorio` con `item_id NULL`** ya existentes **SHALL** seguir en la lista
  del modelo, **SHALL** ofrecerse en el formulario sin SKU y el alta de remisión **SHALL** aceptarlas
  (`apps/desk/server/routes/remision.ts:194-197`). Se pueden desactivar, reactivar, reordenar y borrar; lo que se cierra
  es **crear** otra (RQ-RE-33).
- La **lista por perfil** (`remision_checklist`) de los tickets sin equipo **SHALL** devolver lo de antes
  (`apps/desk/server/db/checklistRemision.ts:35-37`).
- **`incluye`** y el **payload a n8n** **SHALL** conservar sus claves y valores (RQ-RE-32).
- Las **diez novedades anteriores** **SHALL** quedar intactas (RQ-RE-34).

#### Scenario: Remisión guardada con un ítem de texto libre
- GIVEN una remisión de entrada guardada con un ítem en `incluye` que no está en la lista de ningún modelo
- WHEN se lee y se reenvía
- THEN se lee y se envía sin error, con ese ítem tal cual

#### Scenario: Fila `item_id NULL` ya existente
- GIVEN un modelo con un accesorio activo de clase `accesorio` y `item_id NULL`, creado antes del cambio
- WHEN se pide el formulario y se crea la remisión marcando ese accesorio
- THEN el formulario lo ofrece en `incluye` y en `incluyeDetalle` con `sku` nulo, y el alta responde con éxito, sin `422` de «Ítems fuera del checklist»

#### Scenario: Gestión de una fila `item_id NULL`
- GIVEN esa misma fila
- WHEN el super administrador la desactiva, la reactiva, la reordena o la borra
- THEN cada operación responde como antes del cambio

#### Scenario: Lista por perfil intacta
- GIVEN un ticket sin equipo enlazado
- WHEN se pide el formulario
- THEN `incluye` es la lista del perfil, igual que antes del cambio

#### Scenario: El payload a n8n conserva sus claves
- GIVEN una remisión que se envía
- WHEN se arma el payload a n8n
- THEN conserva las mismas claves y valores que antes del cambio, sin SKU ni `incluyeDetalle`

## MODIFIED Requirements

### Requirement: RQ-RE-21 · El catálogo de novedades de entrada es dato de la base, no constante del código

El sistema **SHALL** guardar los tipos de novedad de la remisión de entrada en `public.catalogo_novedades`, con
las columnas `clave` (llave primaria), `etiqueta`, `orden`, `activo`, `excluye_demas` y `exige_texto`. La tabla
**SHALL** crearse con esquema calificado y figurar en `PUBLIC_TABLES`
(`packages/zoho-sync/src/db/migrate.ts:70-73`), de modo que el guardián de `migrate.test.ts` la reconozca.

- Tras `migrate`, la tabla **SHALL** contener **once** filas activas, en este orden y con estas etiquetas: las diez de
  `decision/f1b04-desplegables` (`openspec/config.yaml:2941`) —«Sin novedad» · «Golpe o abolladura en la carcasa» · «Rayón o
  daño estético» · «Pantalla o display dañado» · «Conector o puerto dañado» · «Falta un accesorio» · «Embalaje inadecuado o
  dañado» · «Humedad, suciedad o contaminación visible» · «Sello o precinto roto» · «Otro»— y «Accesorio fuera de lista»
  (`accesorio_fuera_de_lista`, `orden` 65, de `decision/e232-accesorios-lista-por-modelo`), entre «Falta un accesorio» y «Embalaje inadecuado o dañado».
- Las dos marcas **SHALL** ser el comportamiento: `excluye_demas` es verdadera sólo en «Sin novedad» y
  `exige_texto` es verdadera sólo en «Otro» y en «Accesorio fuera de lista». El servidor **SHALL** decidir leyendo las
  marcas y **MUST NOT** decidir por la `clave` ni por la `etiqueta`.
- La siembra **SHALL** ser idempotente por `clave`: reaplicar `migrate` **MUST NOT** duplicar filas ni pisar lo
  que alguien haya editado (etiqueta, orden, marcas o `activo`).
- Una novedad **SHALL** retirarse con `activo = false` y **MUST NOT** retirarse borrando la fila: la siembra
  reinsertaría una fila borrada en el siguiente arranque.
- Toda sentencia de `schema.sql` que cree o modifique estas tablas y columnas **SHALL** calificar el esquema
  (`public.`), y la siembra **MUST NOT** rellenar ni actualizar filas existentes de `public.remisiones` ni de
  `public.remision_fotos`.

#### Scenario: Tras migrar quedan las once novedades, en orden y con las marcas
- GIVEN una base vacía a la que se aplica `migrate`
- WHEN se lee `public.catalogo_novedades` ordenada por `orden`
- THEN hay once filas activas con las etiquetas de la lista, en ese orden
- AND sólo «Sin novedad» tiene `excluye_demas` y sólo «Otro» y «Accesorio fuera de lista» tienen `exige_texto`

#### Scenario: Reaplicar migrate no duplica ni pisa lo editado
- GIVEN la tabla sembrada, con una fila editada a mano (otra etiqueta, `activo = false`) y otra con una marca cambiada
- WHEN se vuelve a aplicar `migrate`
- THEN siguen once filas, y las dos filas editadas conservan lo editado

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

## Notas — lo que esta delta no construye

- **No hay foto del accesorio.** Los documentos cuelgan del modelo, no del artículo
  (`packages/zoho-sync/src/db/schema.sql:359-361`), y la réplica de artículos no promueve imagen
  (`packages/zoho-sync/src/booksHub/mappers.ts:34-39`): no hay dónde guardarla. E-165 y E-166 siguen abiertas.
- **El SKU como «número de parte» es una hipótesis** (S-1): se enseña el SKU, no se afirma que sea el número de parte.
- **S-4:** un accesorio real que no es artículo de Books ya no se puede añadir; los existentes se conservan.
- **IV-12 no se amplía ni se corrige**: ningún requisito de esta delta añade, quita ni mueve guardas del alta de remisión
  (`apps/desk/server/routes/remision.ts`); sólo cambia lo que sirve el formulario.
- La consulta de «modelos sin ningún accesorio activo» es una entrega documental de sólo lectura, no un requisito de
  comportamiento.
