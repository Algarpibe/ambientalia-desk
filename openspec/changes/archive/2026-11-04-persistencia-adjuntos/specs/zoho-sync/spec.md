# Delta para zoho-sync — copia propia de los adjuntos de Zoho, servida de local con caída registrada (1G-02, `cierra: si`)

Construye `decision/adelanto-09-11-empezar-1g` (Gerencia, 02/11/2026) con los supuestos S-a a S-c y S-1 a S-15 de `proposal.md`. Numeración
comprobada contra `openspec/specs/zoho-sync/spec.md`: el último requisito vivo es RQ-ZS-29 (`openspec/specs/zoho-sync/spec.md:1887`); los
nuevos son RQ-ZS-30 a RQ-ZS-33. Rutas, nombres de módulos y el tope por ciclo los fija el diseño; las variables son las de la propuesta.

**Nota de fusión.** Sólo `## ADDED Requirements`, al **final** de la spec viva: ningún bloque MODIFIED, ninguna línea viva se mueve.

## ADDED Requirements

### RQ-ZS-30 · Un adjunto se guarda con nombre propio, tamaño comprobado y `rename`, y sólo si hay directorio válido

El guardado **SHALL** nombrar el fichero con el id del adjunto, validado como `^\d+$`; **MUST NOT** tomar el nombre de `name` ni de la
petición; un id no numérico **SHALL** contarse fallido sin escribir (S-5). **SHALL** escribir en un temporal del mismo directorio y hacer
`rename` al nombre final; `storage_path` **SHALL** ser el nombre relativo y **SHALL** fijarse sólo tras el `rename`. Los bytes recibidos
**SHALL** igualar `size`; si difieren, **MUST NOT** quedar fichero final, temporal ni `storage_path`, y cuenta fallido. Sin `size`
**SHALL** compararse con `Content-Length`; sin ninguno, se guarda y cuenta «sin tamaño comprobable» (S-6). `ADJUNTOS_DIR` **SHALL** ser
absoluta y fuera de `dist/` (`apps/desk/server/index.ts:52-54`); sin ella o dentro de `dist/`, **MUST NOT** escribirse nada (S-1).

#### Scenario: guardado correcto
- GIVEN el adjunto `4001` con `size` 1024 y Zoho devolviendo 1024 bytes
- WHEN se guarda
- THEN existe `4001` en `ADJUNTOS_DIR` con esos bytes y `storage_path` es `4001`; relanzar no lo pide

#### Scenario: `name` con `../` no influye; id no numérico no escribe
- GIVEN el adjunto `4002` con `name` `../../etc/x`, y una fila con id `abc1`
- WHEN se guardan
- THEN el fichero es `4002` dentro del directorio y nada fuera de él; `abc1` cuenta fallido sin pedir a Zoho ni escribir

#### Scenario: bytes de menos o fallo a mitad de escritura
- GIVEN `size` 2048 con Zoho devolviendo 1500 bytes, y otro flujo que se corta tras 700 de 2048
- WHEN se guardan
- THEN no hay fichero final ni temporal, `storage_path` sigue nulo y ambos cuentan fallido

#### Scenario: sin `size`
- GIVEN dos filas sin `size`: una con `Content-Length` 900 y 900 bytes, otra sin cabecera
- THEN la primera se guarda comparada con 900; la segunda se guarda y cuenta «sin tamaño comprobable»

#### Scenario: directorio ausente o dentro de `dist/`
- GIVEN `ADJUNTOS_DIR` sin definir, o con una ruta dentro de `dist/`, y los interruptores abiertos
- WHEN corre el relleno o la pasada periódica
- THEN no se escribe ningún fichero ni `storage_path`

### RQ-ZS-31 · `GET /api/attachment` sirve la copia local si es válida, cae a Zoho si no y deja una línea de log

Con `requireAuth` y la guarda de `apps/desk/server/routes/attachment.ts:17` **intactas y antes de buscar el adjunto**, la ruta **SHALL**
buscar la fila cuyo `zoho_href` sea el `path`. Si el fichero de `storage_path` existe, resuelve dentro de `ADJUNTOS_DIR` y mide `size`,
**SHALL** servirlo sin llamar a Zoho, con `Content-Type` de la fila (o `application/octet-stream`), `Content-Disposition` con el nombre
codificado según RFC 5987 (`inline` sólo para imagen raster y PDF; `attachment` para el resto, HTML y SVG incluidos) y
`X-Content-Type-Options: nosniff` (S-10). En otro caso **SHALL** caer a Zoho como hoy y escribir **UNA** línea de log con id, número de
ticket, motivo (sin copia, fichero ausente, tamaño distinto, sin fila, sin directorio) y estado de Zoho, **MUST NOT** incluir nombre de
fichero (S-11). La ruta **MUST NOT** escribir ficheros ni `storage_path`, leer fuera del directorio ni servir un temporal.

#### Scenario: copia válida sin llamar a Zoho
- GIVEN la fila `4001` con `size` 1024, `content_type` `image/png` y el fichero de 1024 bytes
- WHEN un usuario con sesión pide su `path`
- THEN recibe los bytes con `Content-Disposition` `inline` y `nosniff`, y `zohoFetch` no se llama

#### Scenario: HTML o SVG se descargan
- GIVEN dos copias válidas de tipo `text/html` y `image/svg+xml`
- THEN ambas se sirven con `Content-Disposition` `attachment`

#### Scenario: fichero ausente o de otro tamaño cae a Zoho con log
- GIVEN `storage_path` `4003` sin fichero, y otra copia `4004` de 10 bytes con `size` 20
- WHEN se piden
- THEN se sirve lo de Zoho como hoy y cada caída deja una línea con id, ticket, motivo y estado de Zoho, sin nombre de fichero

#### Scenario: sin sesión o fuera de la guarda
- GIVEN una petición sin sesión, y otra con `path` `/tickets/1/x`
- WHEN se piden
- THEN la respuesta es la de hoy y no se consulta la base ni el disco

#### Scenario: nada fuera del directorio, ningún temporal, ninguna escritura
- GIVEN un `storage_path` `../secreto`, un temporal junto a `4005` y una caída a Zoho que devuelve 200
- WHEN se piden
- THEN no se lee fuera de `ADJUNTOS_DIR`, no se sirve el temporal, se cae a Zoho con motivo y no se crea fichero ni cambia `storage_path`

### RQ-ZS-32 · El relleno manual de adjuntos es de superadministrador, reanudable, tolerante a `429` y tras un interruptor cerrado por defecto

`RELLENO_ADJUNTOS_HABILITADO` **SHALL** leerse con `=== 'true'`; cualquier otro valor, o su ausencia, lo deja cerrado (S-1).
`POST /api/admin/relleno-adjuntos` **SHALL** lanzar en segundo plano, sólo a superadministrador; cerrado **SHALL** responder `403` que
nombra la variable **antes** de validar parámetros. `GET` **SHALL** devolver sólo el estado y **MUST NOT** lanzar nunca; un `POST` con
una pasada en marcha **MUST NOT** lanzar otra (S-2). `limite=0` **SHALL** contar pendientes (número y MB por `size`) sin llamar a Zoho ni
escribir y con el interruptor cerrado; `limite=N` cuenta adjuntos y `desde=<número de ticket>` reanuda (S-3). Pendiente es `storage_path`
nulo, fichero ausente o de otro tamaño, por número de ticket y luego id; sin `zoho_href` o fuera de la guarda de
`apps/desk/server/routes/attachment.ts:17` cuenta «sin ruta» y no se pide (S-4). Un `404` **SHALL** contarse ausente, listado por id y
ticket. Un `429` **SHALL** reintentarse tras 2.000 ms hasta 3 veces, **antes** del `404` y de `!res.ok`; agotados, la pasada **SHALL**
cortarse con `cortadoEn`. Un error de disco **SHALL** cortar; otro fallo **SHALL** contarse y seguir (S-8). El resumen **SHALL** llevar
guardados, ya presentes, fallidos por motivo, ausentes, sin ruta, sin tamaño comprobable, bytes, peticiones, `429` y `cortadoEn`; sólo ids
y números de ticket, **MUST NOT** llevar nombre de fichero, asunto, contacto, empresa ni secretos (S-12).

#### Scenario: el interruptor sólo abre con `'true'`
- GIVEN `RELLENO_ADJUNTOS_HABILITADO` con `TRUE`, `1`, vacío o ausente
- WHEN se lee la configuración
- THEN queda cerrado; sólo `true` exacto lo abre

#### Scenario: cerrado, `403` antes de validar
- GIVEN el interruptor cerrado y un superadministrador
- WHEN hace `POST` con `limite=abc`
- THEN responde `403` que nombra `RELLENO_ADJUNTOS_HABILITADO`, no `400`, y no se llama a Zoho

#### Scenario: sólo superadministrador; `GET` no lanza; un segundo `POST` tampoco
- GIVEN el interruptor abierto; un usuario que no es superadministrador recibe `403` en `POST` y `GET`
- WHEN un superadministrador hace `GET`, luego `POST`, y otro `POST` con la pasada en marcha
- THEN el `GET` devuelve «sin pasada» sin llamar a Zoho; el primer `POST` lanza; el segundo devuelve el estado sin iniciar otra

#### Scenario: `limite=0` sólo cuenta
- GIVEN el interruptor cerrado, 3 adjuntos pendientes de 1 MB y 1 sin `zoho_href`
- WHEN un superadministrador hace `POST` con `limite=0`
- THEN responde 3 pendientes (3 MB) y 1 sin ruta, con cero peticiones a Zoho y cero ficheros escritos

#### Scenario: reanudable e idempotente
- GIVEN adjuntos de los tickets 10, 20 y 30, el del 10 ya guardado
- WHEN se ejecuta con `desde=20` y luego sin `desde`
- THEN la primera pide sólo 20 y 30 en ese orden; la segunda no pide ninguno

#### Scenario: `404` es ausente y la pasada sigue
- GIVEN el adjunto `4006` del ticket 12 que responde `404` y otro que responde `200`
- THEN `4006` figura ausente con su ticket, no se guarda, y el otro se guarda

#### Scenario: `429` se reintenta y, agotado, corta; error de disco corta; otro fallo no
- GIVEN un adjunto con `429` dos veces y luego `200`; otro con `429` siempre; en otra pasada uno con `500`, uno con disco lleno y un tercero
- THEN el primero se guarda tras pausas de 2.000 ms; el segundo corta con `cortadoEn` tras 3 reintentos sin pedir el siguiente; el `500` cuenta fallido y se sigue; el disco lleno corta y el tercero no se pide

#### Scenario: resumen y log sin datos de cliente
- GIVEN adjuntos con `name` `contrato_empresaX.pdf`, un ticket con asunto y contacto conocidos y un fallido
- WHEN se serializa el resumen y se escribe al log
- THEN llevan el id y el número de ticket del fallido y ninguno de esos textos

### RQ-ZS-33 · La pasada periódica de la App guarda los adjuntos pendientes de lo que acaba de guardar, con tope; nadie más descarga

Con `GUARDAR_ADJUNTOS_AL_SINCRONIZAR` (`=== 'true'`) y `SYNC_CONVERSACIONES_PERIODICA` abiertos y `ADJUNTOS_DIR` válida, la pasada
periódica de la App **SHALL** guardar los adjuntos pendientes (S-4) de los tickets cuyas conversaciones acaba de guardar, hasta el tope
que fija el diseño por ciclo (S-9). El worker y la lectura al abrir un ticket **MUST NOT** descargar adjuntos. Un id que dio `404` o
falló por tamaño **MUST NOT** repetirse en el mismo proceso (S-7). Con cualquiera de los dos interruptores cerrado, **MUST NOT**
descargarse nada.

#### Scenario: la pasada trae los pendientes de lo guardado, hasta el tope
- GIVEN ambos interruptores abiertos, un ticket recién guardado con más pendientes que el tope y otro ticket no tocado con uno
- WHEN corre la pasada periódica
- THEN se guardan pendientes del primero hasta el tope y ninguno del segundo

#### Scenario: interruptor cerrado (`TRUE`, `1`, vacío) o sin periódica
- GIVEN `GUARDAR_ADJUNTOS_AL_SINCRONIZAR` con `TRUE`, `1` o vacío, o `SYNC_CONVERSACIONES_PERIODICA` cerrado
- WHEN corre la pasada
- THEN no se descarga ningún adjunto

#### Scenario: el worker y la apertura no descargan
- GIVEN ambos interruptores abiertos y pendientes en un ticket
- WHEN corre el `createSync` del worker y se abre ese ticket
- THEN ninguna vía pide un adjunto a Zoho

#### Scenario: un `404` o un tamaño distinto no se repite en el proceso
- GIVEN el adjunto `4007` que dio `404` y el `4008` que falló por tamaño en un ciclo
- WHEN corre el ciclo siguiente en el mismo proceso
- THEN ninguno de los dos se vuelve a pedir
