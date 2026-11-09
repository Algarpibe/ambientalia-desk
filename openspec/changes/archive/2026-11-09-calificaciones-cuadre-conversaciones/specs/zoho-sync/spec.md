# Delta para zoho-sync — las calificaciones de satisfacción dejan de romper el cuadre de conversaciones; resumen guardado del relleno y relance por números (`calificaciones-cuadre-conversaciones`, `cierra: no`)

Construye `decision/calificaciones-y-borrados-de-zoho` (Gerencia, 08/11/2026), precisada por `decision/calificaciones-junto-con-que`, con los supuestos S-1 a S-11 de
`proposal.md`. Numeración comprobada contra `openspec/specs/zoho-sync/spec.md`: el último requisito vivo es RQ-ZS-47 (`openspec/specs/zoho-sync/spec.md:2549`); los nuevos
son RQ-ZS-48 a RQ-ZS-51. Nombres de tabla, columnas, módulos y funciones los fija el diseño; aquí se fija el comportamiento. El predicado de calificación (S-2) es
**hipótesis** hasta que la persona lo compruebe contra producción (P-1 de la propuesta); falla seguro (RQ-ZS-48).

**Nota de fusión.** Dos bloques de `## MODIFIED Requirements` (RQ-ZS-26 y RQ-ZS-28) sustituyen **entero** el bloque vivo con la misma cabecera, **con el mismo número de
líneas y los mismos títulos de escenario en el mismo orden** (RQ-ZS-26: 55 líneas con la blanca final, `openspec/specs/zoho-sync/spec.md:1705-1758`, 8 escenarios; RQ-ZS-28: 65,
`openspec/specs/zoho-sync/spec.md:1822-1885` y su blanca, 10 escenarios), de modo que ninguna línea viva posterior se mueve: `openspec/specs/zoho-sync/spec.md:2314` sigue citando
`openspec/specs/zoho-sync/spec.md:1982` con razón (S-9). Sólo cambian las frases que dejan de ser ciertas: el criterio de `:1710-1711` (RQ-ZS-26) y la verificación de
`:1830` (RQ-ZS-28); en RQ-ZS-26 son las dos líneas físicas `:1710` y `:1711`, y en RQ-ZS-28 sólo `:1830`. Los escenarios nuevos van todos en los ADDED. **RQ-ZS-29 no se
modifica** (empieza en `openspec/specs/zoho-sync/spec.md:1887`): su frase «`GET` **SHALL** devolver sólo el estado» deja de ser exacta con S-5, y RQ-ZS-49 la
precisa («además del estado en memoria, devuelve la última pasada guardada») sin tocar el bloque vivo; el archivo decide si renombra o anota esa frase. Los ADDED van al
**final** de la spec viva, tras RQ-ZS-47. Ninguna línea viva se mueve.

## MODIFIED Requirements

### RQ-ZS-26 · Lo que Zoho ya no devuelve se marca, nunca se borra, y sólo con la lista completa

Con el interruptor `MARCAR_CONVERSACIONES_AUSENTES` encendido (S-1, `=== 'true'`), tras leer la lista de un ticket, las filas de
`conversations` con ese `ticket_id`, `source = 'zoho'` (S-12), sin marca, guardadas antes de empezar a leer (S-15) y cuyo `id`
no vino en la lista **SHALL** recibir `ausente_en_zoho_at = now()` (S-2). **MUST NOT** borrarse ninguna fila de `conversations`
ni de `attachments`. Sólo se marca con la lista **completa**: la paginación terminó sin error ni tope, **y** el número de ids **únicos** recibidos
que no son calificación de satisfacción (RQ-ZS-48) es igual a `commentCount` + `threadCount` del ticket (S-3); para marcar se usan todos los ids recibidos, calificaciones incluidas. Un recuento ausente o no numérico **MUST**
contar como «no coincide», nunca como 0. Si no coincide, **MUST NOT** marcarse nada, y el log **SHALL** decir el ticket, cuántos
ids se recibieron y cuántos cuenta Zoho. Los recuentos salen del detalle recién leído en la pasada periódica y de `tickets.raw`
en `syncConversations` (S-4).

Una fila que Zoho vuelve a devolver **SHALL** quedar con `ausente_en_zoho_at` nulo al guardarse, con el interruptor encendido o
apagado (S-11). Con el interruptor apagado, **MUST NOT** marcarse nada.

#### Scenario: el #958 — se marca el hilo y sólo el hilo — ROJO
- GIVEN el ticket 958 con cinco comentarios y un hilo guardados de Zoho, y `raw` con `commentCount` 5 y `threadCount` 0
- AND Zoho devuelve sólo los cinco comentarios
- WHEN se ejecuta `syncConversations` con el interruptor encendido
- THEN el hilo queda con `ausente_en_zoho_at` no nulo, los cinco comentarios siguen con él nulo y no se borra ninguna fila

#### Scenario: un recuento que no coincide no marca nada y lo dice — ROJO
- GIVEN el mismo ticket con `commentCount` 5 y `threadCount` 1 y Zoho devolviendo cinco elementos
- WHEN se ejecuta `syncConversations` con el interruptor encendido
- THEN ninguna fila queda marcada y el log nombra el ticket, 5 recibidos y 6 contados

#### Scenario: un recuento ausente no vale cero — ROJO
- GIVEN un ticket sin conversaciones en Zoho, con dos filas guardadas y un `raw` sin `commentCount`
- WHEN se ejecuta `syncConversations` con el interruptor encendido
- THEN ninguna fila queda marcada

#### Scenario: una lista parcial no marca — ROJO
- GIVEN un ticket con 150 conversaciones guardadas, `commentCount` 150, y la segunda página respondiendo `500`
- WHEN se ejecuta `syncConversations` con el interruptor encendido
- THEN ninguna fila queda marcada

#### Scenario: con el interruptor apagado no se marca nada — ROJO
- GIVEN el caso del #958 con la lista completa
- WHEN se ejecuta `syncConversations` con el interruptor apagado
- THEN ninguna fila queda marcada

#### Scenario: una fila que reaparece se desmarca — ROJO
- GIVEN una fila de Zoho marcada como ausente
- WHEN Zoho la vuelve a devolver, con el interruptor encendido o apagado
- THEN queda con `ausente_en_zoho_at` nulo

#### Scenario: las filas de la App y las guardadas mientras se leía no se marcan — ROJO
- GIVEN un ticket con una fila `source = 'app'` y una fila de Zoho guardada después de empezar a leer la lista, ninguna de las dos en ella
- WHEN se ejecuta `syncConversations` con el interruptor encendido y la lista completa
- THEN ninguna de las dos queda marcada

#### Scenario: un id repetido entre páginas cuenta una vez — ROJO
- GIVEN un ticket con `commentCount` 2 y `threadCount` 0 cuya lista trae el mismo id en dos páginas y otro id
- WHEN se lee y se coteja
- THEN se cuentan 2 ids únicos y la lista se da por completa

### RQ-ZS-28 · La pasada recorre los ids de Desk, verifica cada ticket contra el detalle fresco y resume sin datos de cliente

La pasada **SHALL** recorrer los ids de `desk.tickets` salvo los que empiezan por `app-`, en orden ascendente de `tickets.number`
y sin distinguir archivados (son ids; la lista `/tickets` de Zoho no se usa) (S-4). `desde=<número>` **SHALL** omitir los números
menores y `limite=N` **SHALL** acotar cuántos tickets se recorren. Por ticket **SHALL** pedirse un detalle fresco (S-5). Si responde
`404`, o `isDeleted` o `isTrashed` vienen a true, el ticket **SHALL** clasificarse «no está en Zoho» y **MUST NOT** escribirse ni
marcarse nada (S-6). En otro caso el detalle **SHALL** persistirse por la vía de hoy, de modo que una fila `managed_by_app` conserva
su fila (S-7); se **SHALL** leer, guardar y, sólo con `MARCAR_CONVERSACIONES_AUSENTES` encendido, marcar la lista entera de
conversaciones (S-8). La verificación **SHALL** hacerse **después** de guardar y marcar: los ids únicos con `source = 'zoho'`, sin calificación de satisfacción (RQ-ZS-48), y
`ausente_en_zoho_at` nulo se comparan con `commentCount` + `threadCount` del detalle fresco, **nunca** con `tickets.raw` (S-5, S-9).
Clases: **completo** (igual), **descuadrado** (distinto), **sin recuento** (falta alguno de los dos), **con error** (lectura fallida),
**no está en Zoho**. El resumen **SHALL** llevar recuentos por clase, los **números** de ticket de las clases no completas, el motivo
del primer fallo, las peticiones hechas, los `429` vistos y dónde se cortó; **MUST NOT** contener asunto, contacto, empresa ni
contenido (S-10).

#### Scenario: orden, filtro `app-` y archivados incluidos
- GIVEN `desk.tickets` con los números 30, 10 y 20, el 20 con `raw->>'isArchived'` true, y un ticket `app-…`
- WHEN se ejecuta la pasada con un `zohoFetch` falso
- THEN se pide el detalle de 10, 20 y 30 en ese orden, ninguna petición nombra el id `app-…` ni la lista `/tickets`

#### Scenario: `desde` y `limite` acotan el recorrido
- GIVEN cinco tickets con números 1 a 5
- WHEN se ejecuta con `desde=3` y `limite=2`
- THEN sólo se piden los detalles de 3 y 4

#### Scenario: un ticket que cuadra sale completo
- GIVEN un detalle fresco con `commentCount` "7" y `threadCount` "1", y 8 conversaciones distintas en Zoho
- WHEN se ejecuta la pasada
- THEN quedan 8 filas `source = 'zoho'` sin marca y el ticket sale «completo»

#### Scenario: un recuento que no cuadra sale descuadrado
- GIVEN un detalle con recuentos que suman 8 y Zoho devuelve 7 conversaciones
- WHEN se ejecuta la pasada
- THEN el ticket sale «descuadrado» y su número figura en el resumen

#### Scenario: falta un recuento
- GIVEN un detalle sin `threadCount`
- WHEN se ejecuta la pasada
- THEN el ticket sale «sin recuento», nunca «completo» ni «descuadrado»

#### Scenario: lectura fallida
- GIVEN una página de conversaciones que responde `500`
- WHEN se ejecuta la pasada con dos tickets más
- THEN ese ticket sale «con error», el resumen guarda ese motivo como primer fallo y la pasada sigue con los demás

#### Scenario: el ticket ya no está en Zoho
- GIVEN un ticket cuyo detalle responde `404`, y otro con `isTrashed` true
- WHEN se ejecuta la pasada
- THEN ambos salen «no está en Zoho», no se escribe ninguna fila de `tickets` ni de `conversations` y no se marca nada

#### Scenario: un `managed_by_app` se juzga por el detalle fresco
- GIVEN una fila `managed_by_app` con `raw` de recuentos viejos (3) y un detalle fresco con recuentos que suman 8, con 8 conversaciones en Zoho
- WHEN se ejecuta la pasada
- THEN el ticket sale «completo», y su fila de `tickets` conserva los valores de la app

#### Scenario: la verificación mira lo guardado y visible, tras marcar
- GIVEN `MARCAR_CONVERSACIONES_AUSENTES` encendido, un hilo guardado antes y que Zoho ya no devuelve, y recuentos que suman lo que Zoho devuelve hoy
- WHEN se ejecuta la pasada
- THEN el hilo queda marcado y el ticket sale «completo»; con el interruptor apagado el mismo ticket sale «descuadrado»

#### Scenario: el resumen no lleva datos de cliente
- GIVEN tickets con asunto, contacto y empresa conocidos y uno descuadrado
- WHEN se serializa el resumen
- THEN contiene el número del descuadrado y ninguno de esos textos

## ADDED Requirements

### RQ-ZS-48 · Las calificaciones de satisfacción no cuentan en el cuadre: un solo predicado para las cuatro comparaciones

Una conversación **SHALL** reconocerse como calificación de satisfacción cuando el objeto que Zoho devuelve en la lista tiene `channel === 'FEEDBACK'` (S-2, **hipótesis**
hasta la comprobación de la persona). El predicado **SHALL** ser **uno solo** y aceptar el objeto o el `jsonb` como texto (S-3). Lo **SHALL** usar cada una de las cuatro
comparaciones: el relleno, la pasada periódica, `syncConversations` y la verificación del relleno (RQ-ZS-28). Una conversación con otro canal, sin canal o con `raw` nulo
**MUST NOT** contarse como calificación: ante la duda se comporta como hoy y no se marca de más (falla seguro). Una lista es **completa** cuando no hubo error ni tope, hay
recuento y los ids únicos recibidos que **no** son calificación igualan `commentCount` + `threadCount` (S-1); **MUST NOT** aceptarse «recibido mayor o igual a contado». Para
marcar se usan todos los ids recibidos, calificaciones incluidas: una calificación recibida **MUST NOT** marcarse nunca. Una calificación guardada que, con la lista completa,
ya no viene **SHALL** marcarse como cualquier fila de Zoho y desmarcarse si reaparece (S-4). Si no cuadra, el log **SHALL** decir el ticket, cuántos ids se recibieron y cuántos
cuenta Zoho.

#### Scenario: (a) ticket con calificación y lista completa, en el relleno — ROJO
- GIVEN un ticket con `commentCount` 2 y `threadCount` 0, tres filas guardadas (dos comentarios y una calificación) y una cuarta fila de Zoho que ya no viene
- WHEN la lista trae los dos comentarios y la calificación y se ejecuta el relleno con el marcado encendido
- THEN la cuarta fila queda con `ausente_en_zoho_at` no nulo y el ticket sale «completo»

#### Scenario: (a) ticket con calificación y lista completa, en la pasada periódica — ROJO
- GIVEN el mismo ticket con los recuentos del detalle recién leído
- WHEN se ejecuta la pasada periódica de conversaciones con el marcado encendido
- THEN la cuarta fila queda con `ausente_en_zoho_at` no nulo

#### Scenario: (a) ticket con calificación y lista completa, en `syncConversations` — ROJO
- GIVEN el mismo ticket con esos recuentos en `tickets.raw`
- WHEN se ejecuta `syncConversations` con el marcado encendido
- THEN la cuarta fila queda con `ausente_en_zoho_at` no nulo

#### Scenario: (b) una real ausente con el tamaño cuadrando no marca nada, en las tres vías — ROJO
- GIVEN Zoho cuenta 3 (2 comentarios y 1 hilo), la lista trae 2 reales y 1 calificación, y falta una real que sigue guardada
- WHEN se ejecuta el relleno, la pasada periódica y `syncConversations`, cada una por separado
- THEN en las tres ninguna fila queda marcada (2 ids que no son calificación frente a 3 contados) y el log dice el ticket, 2 recibidos y 3 contados

#### Scenario: una calificación recibida nunca se marca — ROJO
- GIVEN un ticket con lista completa en el que la calificación viene en la lista
- WHEN se marca lo ausente
- THEN la calificación conserva `ausente_en_zoho_at` nulo

#### Scenario: una calificación guardada que ya no viene se marca y al reaparecer se desmarca — ROJO
- GIVEN una calificación guardada que la lista completa ya no trae
- WHEN se marca y después Zoho la vuelve a devolver
- THEN queda marcada tras la primera pasada y con `ausente_en_zoho_at` nulo tras la segunda

#### Scenario: la verificación del relleno da «completo» con calificación — ROJO
- GIVEN un ticket con una calificación visible y recuentos que suman las demás filas visibles
- WHEN el relleno lo verifica tras guardar y marcar
- THEN el ticket sale «completo»; si la verificación no usara el predicado, saldría «descuadrado»

#### Scenario: sin calificaciones todo es como hoy
- GIVEN tickets sin ninguna calificación, con las pruebas existentes de las tres vías y del relleno
- WHEN se ejecutan
- THEN dan el mismo resultado que antes de este cambio

#### Scenario: el predicado acepta objeto y texto
- GIVEN un `raw` con `channel` `FEEDBACK` entregado como objeto y otro entregado como texto
- WHEN se aplica el predicado
- THEN los dos son calificación

#### Scenario: canal distinto, ausente o `raw` nulo no es calificación
- GIVEN un `raw` con otro canal, otro sin `channel` y otro nulo
- WHEN se aplica el predicado
- THEN ninguno es calificación y cuentan como hoy

### RQ-ZS-49 · El resumen de cada pasada del relleno se guarda y sobrevive a un redespliegue

Cada pasada del relleno con `limite` distinto de 0 **SHALL** guardar su resumen en `public.relleno_conversaciones_pasadas` (S-5): una fila **al lanzar** y completada **al
terminar**, de modo que un redespliegue a mitad deje rastro. El resumen guardado **SHALL** llevar `peticiones`, `vistos429`, `inicio`, `fin`, los parámetros de la pasada
(`desde`, `limite` y `numeros`, RQ-ZS-50) y **SHALL** declarar el límite de S-6: las lecturas de contacto y cuenta del `Sync` compartido no se cuentan. **MUST NOT** contener
asunto, contacto, empresa ni contenido, sólo números de ticket y recuentos (RQ-ZS-28, S-10). `GET /api/admin/relleno-conversaciones` **SHALL** devolver el estado en memoria
**y además** la última pasada guardada, también desde una instancia nueva sobre la misma base, y **MUST NOT** lanzar nunca la pasada ni lanzar un error si la lectura falla
(precisa «devolver sólo el estado» de RQ-ZS-29). Un fallo al escribir **MUST NOT** cortar la pasada ni dejar un rechazo sin manejar. Con `limite=0` **MUST NOT** escribirse.
`db/schema.sql` **SHALL** crear la tabla con `CREATE TABLE IF NOT EXISTS public.…` calificado, al final del fichero; el guardián de
`packages/zoho-sync/src/db/migrate.test.ts` **SHALL** ponerse en rojo si ese `.sql` lleva un `CREATE TABLE` sin calificar.

#### Scenario: fila al lanzar y completada al terminar — ROJO
- GIVEN una base vacía y una pasada con dos tickets
- WHEN se lanza el relleno y se espera a que termine
- THEN existió una fila de esa pasada desde el lanzamiento y, al terminar, está completa con `peticiones`, `vistos429`, `inicio`, `fin`, `desde`, `limite` y `numeros`

#### Scenario: una instancia nueva devuelve la última pasada — ROJO
- GIVEN una pasada terminada en una instancia y otra instancia nueva sobre la misma base
- WHEN la nueva atiende `GET`
- THEN devuelve su estado propio «sin pasada» y además la última pasada guardada, y no llama a Zoho

#### Scenario: un fallo al escribir no corta la pasada — ROJO
- GIVEN una escritura del resumen que falla
- WHEN se ejecuta la pasada con tres tickets
- THEN los tres se procesan, el fallo se registra en el log y no queda ningún rechazo sin manejar

#### Scenario: `limite=0` no escribe, y un fallo de lectura no tumba el `GET` — ROJO
- GIVEN un `POST` con `limite=0` y, aparte, una lectura de la base que falla
- WHEN se hacen el `POST` y el `GET`
- THEN no se escribe ninguna fila y el `GET` responde con el estado en memoria sin lanzar

#### Scenario: el resumen guardado no lleva datos de cliente — ROJO
- GIVEN tickets con asunto, contacto y empresa que son marcadores conocidos
- WHEN se guarda y se lee el resumen
- THEN no aparece ninguno de esos textos

#### Scenario: la tabla se crea calificada y el guardián discrimina — ROJO
- GIVEN `db/schema.sql` con la tabla y, en una copia, un `CREATE TABLE` sin calificar añadido
- WHEN corre el guardián de `packages/zoho-sync/src/db/migrate.test.ts`
- THEN pasa con el fichero real y se pone en rojo con la copia ensuciada

### RQ-ZS-50 · `numeros` acota el relleno a un conjunto exacto de tickets

`POST /api/admin/relleno-conversaciones` **SHALL** aceptar `numeros`, una lista de números de ticket separados por comas (S-7). La pasada **SHALL** recorrer sólo esos números, en
orden ascendente, saltando los `app-`. Con `limite=0` **SHALL** limitarse a contar, sin llamar a Zoho ni escribir, y con el interruptor cerrado, como RQ-ZS-29. **SHALL** nombrar
en la respuesta del recuento y en el resumen los números que no están en `desk.tickets`, que no se recorren (S-10). `numeros` vacío, mal formado o junto a `desde` **SHALL**
responder `400`. El `400` de `numeros` es de contenido y **SHALL** ir detrás de `401` (sin sesión), `403` de rol, `503` del modo sin Zoho (RQ-ZS-44) y `403` del interruptor,
en ese orden.

#### Scenario: recorre sólo esos números, en orden ascendente — ROJO
- GIVEN tickets con números 10 a 15, el 12 nacido en la App (id `app-…`), y `numeros=14,12,11`
- WHEN se ejecuta la pasada con un `zohoFetch` falso
- THEN se piden los detalles de 11 y 14, en ese orden, y de ningún otro

#### Scenario: `limite=0` cuenta y nombra los inexistentes, sin Zoho ni escritura — ROJO
- GIVEN el interruptor cerrado, `numeros=11,14,999` y 999 ausente de `desk.tickets`
- WHEN un superadministrador hace `POST` con `limite=0`
- THEN responde que recorrería 2, nombra el 999, no llama a Zoho y no escribe

#### Scenario: vacío, mal formado o junto a `desde` es `400` — ROJO
- GIVEN el interruptor abierto y un superadministrador
- WHEN hace `POST` con `numeros=` vacío, con `numeros=1,x`, y con `numeros=1&desde=1`
- THEN cada uno responde `400` y no se llama a Zoho

#### Scenario: posición de las guardas, con dos activas a la vez — ROJO
- GIVEN un `POST` con `numeros=x` (que activaría el `400`) hecho, por separado: sin sesión; con un rol sin permiso; con el modo sin Zoho abierto; con el interruptor cerrado
- WHEN se envía en cada uno de esos cuatro casos
- THEN responde, respectivamente, `401`, `403` de rol, `503` y `403` del interruptor, y nunca `400`

### RQ-ZS-51 · `DEPLOY.md` §25 documenta `numeros` y el resumen guardado, sin interruptor nuevo

`DEPLOY.md` **SHALL** terminar con una sección `## 25.` sobre `numeros` y el resumen guardado, con dos apartados: «Qué enciende» y «Qué se rompe si se pone mal» (regla de secretos,
`CLAUDE.md`). **SHALL** decir cómo relanzar sobre un conjunto de tickets (primero `limite=0`, después sin él), cómo leer el resumen guardado con `GET` y cuál es su límite
(S-6), y que **no** hay interruptor nuevo: todo queda tras `RELLENO_CONVERSACIONES_HABILITADO` y `MARCAR_CONVERSACIONES_AUSENTES` (S-8). La sección **SHALL** añadirse al final
sin mover las §21 a §24. Una prueba **SHALL** fijar el contenido de la sección.

#### Scenario: la sección existe y cubre lo obligatorio — ROJO
- GIVEN `DEPLOY.md` leído por la prueba
- WHEN busca la sección 25
- THEN encuentra los dos apartados, `numeros`, el resumen guardado y el límite de las peticiones, y la afirmación de que no hay interruptor nuevo

#### Scenario: quitar una parte de la sección pone la prueba en rojo
- GIVEN una copia de `DEPLOY.md` sin la mención a `numeros` o sin el apartado «Qué se rompe si se pone mal»
- WHEN corre la prueba de la sección 25
- THEN se pone roja
