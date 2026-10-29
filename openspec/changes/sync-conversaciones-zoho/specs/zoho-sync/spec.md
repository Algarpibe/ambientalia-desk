# Delta para zoho-sync — conversaciones de Zoho al día, enteras y con lo ausente reflejado (1G-01, `cierra: no`)

Construye `decision/adelanto-1g01-sincronizacion-conversaciones` (Gerencia, 29/10/2026) con los supuestos S-1 a S-15 de
`proposal.md`; las tareas de persona P-1 a P-4 no se redefinen aquí. Numeración comprobada contra
`openspec/specs/zoho-sync/spec.md` en `b4255928`: el último requisito vivo es RQ-ZS-24; los nuevos son RQ-ZS-25 a RQ-ZS-27.
Marcas bajo `strict_tdd`: **ROJO** nace rojo; **CARACTERIZACIÓN** fija lo que ya hay y su valor está en la mutación.

**Nota de fusión.** Sólo `## ADDED Requirements`, al **final** de la spec viva: ningún bloque MODIFIED, ninguna línea viva se
mueve. Lo que el hilo enseña está en la delta de `trazas` (RQ-TZ-25).

## ADDED Requirements

### RQ-ZS-25 · La lista de conversaciones de un ticket se pide entera, por páginas

`syncConversations` **SHALL** pedir `/tickets/{id}/conversations` con `from` y `limit` explícitos, desde `from=0` y con
`limit=100`, avanzando `from` de cien en cien hasta recibir una página con menos de cien elementos (S-9). Zoho fija para ese
recurso un `limit` de 1 a 200 y 100 por omisión (anuncio de Zoho Desk citado en `proposal.md` §2); que `from` cuente desde 0 es
**hipótesis**. La lectura **MUST** parar en un tope de 20 páginas: al alcanzarlo, la lista **MUST** darse por incompleta. Lo
recibido antes de un fallo de página **SHALL** guardarse igual que hoy (S-10), y el fallo **MUST** seguir propagándose a quien
llamó. Esto vale con los dos interruptores apagados: corrige la lectura del escritor que ya existe.

#### Scenario: un ticket con 250 conversaciones se trae entero — ROJO
- GIVEN un ticket cuyo Zoho devuelve 250 conversaciones en páginas de 100
- WHEN se ejecuta `syncConversations`
- THEN se piden `from=0`, `from=100` y `from=200`, todas con `limit=100`, y quedan guardadas las 250

#### Scenario: una última página exacta pide una más y termina con la vacía — ROJO
- GIVEN un ticket con exactamente 200 conversaciones, y la tercera página responde `204` sin cuerpo
- WHEN se ejecuta `syncConversations`
- THEN se hacen tres peticiones, quedan guardadas las 200 y la lista se da por completa

#### Scenario: una página que falla deja lo recibido guardado y propaga el fallo — ROJO
- GIVEN un ticket cuya primera página trae 100 conversaciones y la segunda responde `500`
- WHEN se ejecuta `syncConversations`
- THEN las 100 de la primera quedan guardadas y `syncConversations` rechaza con un error que nombra el ticket y el `500`

#### Scenario: el tope de páginas da la lista por incompleta — ROJO
- GIVEN un ticket cuyo Zoho devuelve siempre páginas llenas de 100
- WHEN se lee su lista
- THEN se hacen 20 peticiones y ninguna más, y la lista se da por incompleta

### RQ-ZS-26 · Lo que Zoho ya no devuelve se marca, nunca se borra, y sólo con la lista completa

Con el interruptor `MARCAR_CONVERSACIONES_AUSENTES` encendido (S-1, `=== 'true'`), tras leer la lista de un ticket, las filas de
`conversations` con ese `ticket_id`, `source = 'zoho'` (S-12), sin marca, guardadas antes de empezar a leer (S-15) y cuyo `id`
no vino en la lista **SHALL** recibir `ausente_en_zoho_at = now()` (S-2). **MUST NOT** borrarse ninguna fila de `conversations`
ni de `attachments`. Sólo se marca con la lista **completa**: la paginación terminó sin error ni tope, **y** el número de ids
**únicos** recibidos es igual a `commentCount` + `threadCount` del ticket (S-3). Un recuento ausente o no numérico **MUST**
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

### RQ-ZS-27 · La App trae en cada ciclo las conversaciones de los tickets que Zoho dio por modificados

Con el interruptor `SYNC_CONVERSACIONES_PERIODICA` encendido (S-1), `syncRecent` **SHALL**, después de leer y persistir los
tickets modificados del ciclo (RQ-ZS-22), traer la lista de conversaciones de **esos** tickets y sólo de ellos, guardarla y, con
`MARCAR_CONVERSACIONES_AUSENTES` encendido, reflejar lo ausente (RQ-ZS-26) con los recuentos del detalle que acaba de leer (S-4).
**SHALL** pausar 150 ms entre tickets (S-6). Ante un `429` **SHALL** esperar 2.000 ms y repetir la misma página, hasta 3 veces
(S-5); agotadas, **SHALL** cortar la pasada del ciclo y registrar los tickets que quedaron sin traer. Un ticket cuyo
`modifiedTime` ya se trajo en este proceso con la lista guardada **MUST NOT** pedirse otra vez (S-7). Si el ciclo cae a la
página 1 por `-recentThread`, la pasada **MUST NOT** correr (S-8). Un fallo de la pasada **MUST NOT** rechazar `syncRecent` ni
cambiar el número que devuelve.

Los interruptores **SHALL** llegar a `createSync` como la dependencia opcional `conversaciones`, que **sólo** pasa la App
(`apps/desk/server/index.ts`). `sync.ts` **MUST NOT** leerlos de `config` (S-1b): el worker `hub-sync` construye `createSync` sin
esa opción y **MUST NOT** pedir conversaciones aunque las dos variables valgan `'true'` en su entorno.

#### Scenario: con el interruptor encendido se piden las de los modificados y sólo ésas — ROJO
- GIVEN una marca de agua y dos tickets que `/tickets/search` da por modificados, y un tercero guardado que no
- WHEN se ejecuta `syncRecent` con `conversaciones.periodica` encendido
- THEN se pide la lista de conversaciones de los dos modificados y ninguna del tercero, y sus conversaciones quedan guardadas

#### Scenario: con el interruptor apagado no se pide ninguna — ROJO
- GIVEN los mismos tickets
- WHEN se ejecuta `syncRecent` con `conversaciones.periodica` apagado, o sin la opción
- THEN no hay ninguna petición a `/conversations`

#### Scenario: el worker no pide conversaciones aunque su entorno encienda las dos variables — CARACTERIZACIÓN
- GIVEN un `createSync` construido como el del worker (sin la opción) con un `config` de `loadConfig` en el que `SYNC_CONVERSACIONES_PERIODICA` y `MARCAR_CONVERSACIONES_AUSENTES` valen `'true'`
- WHEN se ejecuta `syncRecent` con tickets modificados
- THEN no hay ninguna petición a `/conversations`
- AND `apps/hub-sync/src/hub-sync.ts` no pasa la opción `conversaciones` a `createSync`

#### Scenario: la pasada marca con los recuentos del detalle, también en un ticket gestionado por la App — ROJO
- GIVEN un ticket `managed_by_app` cuyo `raw` guardado dice `threadCount` 1, cuyo detalle del ciclo dice `commentCount` 5 y `threadCount` 0, y el caso del #958
- WHEN corre la pasada con los dos interruptores encendidos
- THEN el hilo queda marcado

#### Scenario: un 429 espera y repite; tres seguidos cortan la pasada — ROJO
- GIVEN dos tickets modificados y una lista de conversaciones que responde `429` una vez y luego `200`
- WHEN corre la pasada
- THEN la página se repide tras la espera y el ticket queda traído
- AND si responde `429` cuatro veces seguidas, la pasada se corta, el segundo ticket no se pide y el log nombra los que quedaron sin traer

#### Scenario: un modifiedTime ya traído no se repide — ROJO
- GIVEN un ticket cuya lista ya se trajo en un ciclo anterior del mismo proceso con el mismo `modifiedTime`
- WHEN el solape lo vuelve a encontrar en el ciclo siguiente
- THEN no se pide su lista; y si su `modifiedTime` cambió, sí

#### Scenario: la caída a la página 1 no corre la pasada — ROJO
- GIVEN una marca de agua y una búsqueda que responde `500`
- WHEN se ejecuta `syncRecent` con `conversaciones.periodica` encendido
- THEN no hay ninguna petición a `/conversations`

#### Scenario: un fallo de la pasada no tumba syncRecent — ROJO
- GIVEN un ticket modificado cuya lista responde `500`
- WHEN se ejecuta `syncRecent` con `conversaciones.periodica` encendido
- THEN `syncRecent` resuelve con el número de tickets leídos, como sin la pasada

#### Scenario: los dos interruptores nacen cerrados — ROJO
- GIVEN un entorno sin las dos variables, y otro con cada una en `'1'`, `'TRUE'` o `'yes'`
- WHEN se ejecuta `loadConfig`
- THEN los dos campos valen `false`; sólo `'true'` los abre
