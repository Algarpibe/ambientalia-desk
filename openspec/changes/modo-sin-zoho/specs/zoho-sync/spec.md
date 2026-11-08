# Delta para zoho-sync — modo sin Zoho Desk: interruptor que apaga toda salida hacia Zoho Desk, con registro y barrido (1G-04, `cierra: si`)

Construye `decision/adelanto-09-11-empezar-1g` (Gerencia, 02/11/2026) con los supuestos S-a a S-p de `proposal.md`. Numeración
comprobada contra `openspec/specs/zoho-sync/spec.md`: el último requisito vivo es RQ-ZS-39 (`openspec/specs/zoho-sync/spec.md:2268`); los
nuevos son RQ-ZS-40 a RQ-ZS-47. Rutas de módulos, nombres de funciones y la forma del error tipado los fija el diseño; sólo se fijan aquí
la variable `MODO_SIN_ZOHO_DESK` y la ruta `GET /api/admin/modo-sin-zoho-desk`.

**Nota de fusión.** Sólo `## ADDED Requirements`, al **final** de la spec viva: ningún bloque MODIFIED ni REMOVED, ninguna línea viva se mueve (S-m).

## ADDED Requirements

### RQ-ZS-40 · `MODO_SIN_ZOHO_DESK` nace cerrado, se lee igual en la App y en el worker, y prevalece sobre todo requisito que llame a Zoho Desk

La configuración **SHALL** exponer `modoSinZohoDesk`, verdadero **sólo** si `MODO_SIN_ZOHO_DESK === 'true'` (S-f). Cualquier otro valor
(`TRUE`, `1`, vacío, ausente) **SHALL** dejar el comportamiento de hoy. La App y el worker `hub-sync` **SHALL** leerlo con el mismo
`loadConfig` (`packages/zoho-sync/src/config.ts:75`), de modo que no puedan divergir en la lectura; se lee al arrancar. Con el interruptor abierto,
este requisito y los RQ-ZS-41 a RQ-ZS-47 **SHALL** prevalecer sobre todo requisito de `zoho-sync` que mande llamar a Zoho Desk, y en particular sobre
RQ-ZS-31 («SHALL caer a Zoho como hoy», `openspec/specs/zoho-sync/spec.md:1982`) (S-m). Cerrado, esos requisitos **SHALL** valer como hoy. `loadConfig`
**SHALL** seguir exigiendo las credenciales de Desk (S-g).

#### Scenario: sólo el literal `true` abre el modo
- GIVEN `MODO_SIN_ZOHO_DESK` con los valores `true`, `TRUE`, `1`, vacío y ausente
- WHEN se carga la configuración
- THEN `modoSinZohoDesk` es verdadero únicamente con `true`, y falso en los otros cuatro casos

#### Scenario: App y worker leen el mismo valor
- GIVEN `MODO_SIN_ZOHO_DESK=true` en el entorno
- WHEN la App y el worker cargan su configuración con `loadConfig`
- THEN los dos obtienen `modoSinZohoDesk` verdadero, sin una segunda lectura propia de la variable

#### Scenario: abierto, el modo prevalece sobre el adjunto que caía a Zoho
- GIVEN el modo abierto y un adjunto sin copia válida en el almacenamiento propio
- WHEN se pide el adjunto
- THEN no se cae a Zoho como dice RQ-ZS-31 y la respuesta es la de RQ-ZS-44

### RQ-ZS-41 · El corte está en la puerta, antes del token, y falla cerrado

Con el modo abierto, `zohoFetch` (`packages/zoho-sync/src/zohoClient.ts:29-37`) **SHALL** lanzar un error tipado **antes** de llamar a
`getAccessToken` (`packages/zoho-sync/src/zohoClient.ts:30`): **MUST NOT** salir ninguna petición hacia Zoho Desk, ni la del transporte ni la de renovación del token
(`packages/zoho-sync/src/tokenManager.ts:25`), y tampoco la reintentada tras un `401` (`packages/zoho-sync/src/zohoClient.ts:33`). El error **SHALL** distinguirse
de un fallo de red y de un `!res.ok`, y su mensaje **SHALL** ser fijo: **MUST NOT** llevar ruta, ids ni query (S-h). El intento **SHALL**
contarse (RQ-ZS-42) **antes** de lanzar. Cualquier llamada nueva que use `zohoFetch` **SHALL** quedar cortada sin tocar el interruptor. Cerrado, `zohoFetch` **SHALL**
comportarse como hoy.

#### Scenario: abierto, no sale transporte ni token
- GIVEN el modo abierto y un transporte y un gestor de token falsos
- WHEN se llama a `zohoFetch` con cualquier ruta
- THEN lanza el error tipado, y ni el transporte ni `getAccessToken` fueron invocados

#### Scenario: tampoco hay reintento tras un `401`
- GIVEN el modo abierto y un transporte falso que respondería `401`
- WHEN se llama a `zohoFetch`
- THEN el transporte no se invoca ni una vez y no se pide un segundo token

#### Scenario: el error se distingue y no filtra datos
- GIVEN el modo abierto y una llamada a una ruta con id y query reconocibles
- WHEN `zohoFetch` lanza
- THEN el error es reconocible como corte (no como fallo de red ni como `!res.ok`) y su mensaje no contiene la ruta, el id ni la query

#### Scenario: cerrado, la puerta es la de hoy
- GIVEN el modo cerrado (`TRUE`, `1`, vacío o ausente)
- WHEN se ejecutan las pruebas existentes de `packages/zoho-sync/src/zohoClient.test.ts`
- THEN pasan sin cambios, con el token pedido y la petición enviada

#### Scenario: el corte va antes del token (mutación de posición)
- GIVEN el corte movido después de `getAccessToken`
- WHEN corren las pruebas del escenario «abierto, no sale transporte ni token»
- THEN alguna se pone roja

### RQ-ZS-42 · El registro cuenta cortes por origen y rechazos por ruta, sin datos de clientes

El sistema **SHALL** llevar, en memoria y por proceso, un registro de **cortes** por origen (S-e). El origen **SHALL** ser el recurso de
Zoho reducido a un conjunto cerrado de segmentos, más quién llamó (S-i); un llamador que nadie etiquetó **SHALL** aparecer igual, con su recurso.
Cada origen **SHALL** llevar cuenta, primera hora y última hora. Cuentan también los cortes cuyo error se traga el llamador. Lo que se salta a
propósito en segundo plano (temporizadores, arranque, aperturas) **MUST NOT** entrar (S-j). Cada `503` que una persona recibe por RQ-ZS-44
**SHALL** sumar a su ruta como **rechazo**, en un apartado separado de los cortes. Ni un origen ni una ruta **MUST** llevar id, query, cuerpo,
nombre de cliente ni secreto (S-i). El registro **SHALL** vaciarse al reiniciar. En el worker, que no tiene HTTP, **SHALL** emitirse una línea de log por cada origen **nuevo**, sin
repetirse en los siguientes cortes del mismo origen.

#### Scenario: dos cortes del mismo origen suman y conservan primera y última
- GIVEN el modo abierto y dos intentos del mismo recurso y llamador en horas distintas
- WHEN se lee el registro
- THEN hay un origen con cuenta 2, la primera hora del primer intento y la última hora del segundo

#### Scenario: un corte que el llamador se traga también cuenta
- GIVEN el modo abierto y un llamador que captura el error y sigue (como la cuenta o el contacto por id de la sincronización)
- WHEN se produce el corte
- THEN el origen suma uno aunque el llamador no relance el error

#### Scenario: un llamador sin etiqueta aparece igual
- GIVEN un llamador a `zohoFetch` sin etiqueta de origen
- WHEN se corta
- THEN el registro lo muestra con su recurso en el origen

#### Scenario: la cuenta se hace antes de lanzar
- GIVEN la cuenta movida después del `throw`
- WHEN corren las pruebas del registro
- THEN alguna se pone roja

#### Scenario: ningún origen ni ruta lleva datos de clientes
- GIVEN intentos y rechazos con ids, queries y cuerpos marcados con marcadores únicos
- WHEN se serializa el registro completo
- THEN ningún marcador aparece en ningún origen, ruta ni valor

#### Scenario: los saltos de fondo no cuentan y los rechazos van aparte
- GIVEN el modo abierto, un ciclo del temporizador que salta lo de Desk y una persona que recibe un `503` por RQ-ZS-44
- WHEN se lee el registro
- THEN los cortes no incluyen el salto del temporizador, y el `503` figura como rechazo de su ruta, no como corte

#### Scenario: el worker deja una línea por origen nuevo
- GIVEN el modo abierto en el worker y tres cortes de un origen y uno de otro
- WHEN se revisa el log
- THEN hay exactamente dos líneas de origen nuevo, sin ids ni query

### RQ-ZS-43 · `GET /api/admin/modo-sin-zoho-desk` enseña el registro al superadministrador

La App **SHALL** exponer `GET /api/admin/modo-sin-zoho-desk` (S-f), con el molde de
`apps/desk/server/routes/verificacionCompletitud.ts:44-46`. Sin sesión **SHALL** responder `401`; con sesión y sin rol de superadministrador, `403`
(`apps/desk/server/auth/middleware.ts:17`, `:27`). Con el modo abierto **SHALL** devolver `activo: true`, los cortes por origen y los rechazos por ruta; con el modo
cerrado, `activo: false` y listas vacías. **MUST NOT** lanzar, **MUST NOT** llamar a Zoho y **MUST NOT** escribir en PostgreSQL. La ruta **MUST NOT**
sumarse a sí misma como rechazo.

#### Scenario: sin sesión y sin rol
- GIVEN una petición sin sesión y otra de un usuario sin rol de superadministrador
- WHEN piden `GET /api/admin/modo-sin-zoho-desk`
- THEN la primera recibe `401` y la segunda `403`

#### Scenario: cerrado, informa que no está activo
- GIVEN el modo cerrado y un superadministrador
- WHEN pide la ruta
- THEN recibe `200` con `activo: false` y listas vacías

#### Scenario: abierto, devuelve lo registrado
- GIVEN el modo abierto, dos cortes de un origen y un rechazo de una ruta
- WHEN el superadministrador pide la ruta
- THEN la respuesta lleva el origen con cuenta 2 y la ruta rechazada, sin que `zohoFetch` se haya invocado por la consulta

### RQ-ZS-44 · La App sirve lo local y responde de forma explícita a lo que sólo Zoho puede dar

Con el modo abierto, la App **SHALL** seguir sirviendo lo que tiene en PostgreSQL. Concretamente:

1. **Temporizador (S-p).** La cadena periódica (`apps/desk/server/index.ts:88`) **SHALL** seguir corriendo con las seis evaluaciones (alarmas,
   reclamaciones, facturación vencida, salidas de esperas, provisionales en Books, ritmo de contratos) en el **mismo orden** y **antes** del salto de lo de
   Desk; la sincronización reciente, actividades y contactos de Desk **SHALL** saltarse. El temporizador **MUST NOT** detenerse.
2. **Arranque.** **MUST NOT** lanzarse ningún backfill ni sincronización inicial de Desk; la migración y la resiembra **SHALL** correr.
3. **Aperturas.** Detalle, conversaciones e historia de un ticket **SHALL** servir lo local sin llamar a `sync`; sin datos locales, `404`.
4. **Respuesta y rutas de administración.** `POST /api/tickets/:id/reply`, `GET /api/admin/measure-attachments`, `GET /api/admin/backfill-details`,
   `POST /api/admin/backfill-history`, `POST /api/admin/backfill-archived`, los dos rellenos y la verificación de completitud **SHALL** responder `503` con un
   mensaje que nombra el modo sin Zoho Desk (S-k). Los recuentos con `limite=0` que no llaman a Zoho **SHALL** seguir libres. El `503` **SHALL** ir **después** de la
   sesión y el rol, y **antes** del interruptor propio de cada ruta y de validar el cuerpo; las guardas que ya existen **MUST NOT** reordenarse.
5. **Adjunto.** Con copia válida, **SHALL** servirse igual. Sin ella, `503` con el mensaje «no está en el almacenamiento propio y la app está en modo sin
   Zoho Desk», una línea de log con ese motivo y **sin** nombre de fichero, y sin llamar a Zoho (S-l).
6. **Manejador central.** El error tipado de RQ-ZS-41 que escape de cualquier ruta (`apps/desk/server/app.ts:78-93`) **SHALL** dar `503` con la misma respuesta, no `500`.

Cada `503` de los puntos 4, 5 y 6 **SHALL** sumar a su ruta como rechazo (RQ-ZS-42). `apps/desk/src` **MUST NOT** cambiar (S-n).

#### Scenario: el ciclo corre las seis evaluaciones y salta Desk
- GIVEN el modo abierto y una pasada del temporizador con evaluaciones y `zohoFetch` falsos
- WHEN corre el ciclo
- THEN las seis evaluaciones corren en su orden, `zohoFetch` no se llama y el temporizador sigue programado

#### Scenario: quitar una evaluación o adelantar el salto lo detecta una prueba
- GIVEN una evaluación quitada del ciclo, o el salto de Desk puesto antes de las evaluaciones
- WHEN corren las pruebas del ciclo
- THEN alguna se pone roja

#### Scenario: cerrado, el ciclo es el de hoy
- GIVEN el modo cerrado
- WHEN corre el ciclo
- THEN corren las seis evaluaciones y después la sincronización reciente, actividades y contactos

#### Scenario: el arranque no sincroniza Desk pero sí migra
- GIVEN el modo abierto y el arranque de la App
- WHEN termina el arranque
- THEN no hubo backfill ni sincronización inicial de Desk, y la migración y la resiembra corrieron

#### Scenario: las aperturas sirven lo local
- GIVEN el modo abierto, un ticket con datos locales y otro sin ellos
- WHEN se abren detalle, conversaciones e historia de ambos
- THEN el primero responde con lo local sin llamar a `sync`, y el segundo responde `404`

#### Scenario: las rutas que dependen de Zoho responden `503` y nombran el modo
- GIVEN el modo abierto y un usuario con el rol que cada ruta exige
- WHEN invoca la respuesta, `measure-attachments`, `backfill-details`, `backfill-history`, `backfill-archived`, los dos rellenos y la verificación
- THEN cada una recibe `503` con un mensaje que nombra el modo sin Zoho Desk, y Zoho no se llamó

#### Scenario: los recuentos sin Zoho siguen libres
- GIVEN el modo abierto y una petición de recuento con `limite=0`
- WHEN se procesa
- THEN responde su recuento habitual y no recibe `503`

#### Scenario: la posición del `503` está probada
- GIVEN el modo abierto, una petición sin sesión, otra sin rol, y otra con rol y cuerpo inválido
- WHEN llegan a una ruta de administración
- THEN las dos primeras reciben `401` y `403` y la tercera recibe `503`, no el error de validación ni el del interruptor propio; con el `503` movido antes de la sesión o después de la validación, alguna prueba se pone roja

#### Scenario: el adjunto con copia se sirve y sin copia responde claro
- GIVEN el modo abierto, un adjunto con copia válida y otro sin ella
- WHEN se piden los dos
- THEN el primero se sirve igual que hoy, y el segundo recibe `503` con el mensaje del punto 5, una línea de log sin nombre de fichero y ninguna llamada a Zoho

#### Scenario: el error tipado que escapa da `503`
- GIVEN el modo abierto y una ruta cuyo código deja escapar el error tipado
- WHEN se pide
- THEN el manejador central responde `503` con la respuesta del modo, no `500`

### RQ-ZS-45 · El worker salta lo de Desk y sigue con Books y CRM

Con el modo abierto, el worker `hub-sync` **SHALL** no programar la pasada de Desk (tickets, actividades, contactos e historia pendiente) y **MUST NOT**
lanzar su sincronización inicial de Desk. Los temporizadores de Books y de CRM **SHALL** correr como hoy (S-b): Books y CRM tienen cliente y token
propios, y **MUST NOT** quedar cortados por este interruptor. El corte de RQ-ZS-41 **SHALL** valer también aquí, con el log de RQ-ZS-42. Cerrado, el worker **SHALL**
programar las tres pasadas como hoy.

#### Scenario: abierto, el worker no programa Desk
- GIVEN el modo abierto y un worker con temporizadores y clientes falsos
- WHEN arranca
- THEN no se programa la pasada de Desk ni se lanza su sincronización inicial, y no se llama a Zoho Desk

#### Scenario: Books y CRM siguen como hoy
- GIVEN el modo abierto en el worker
- WHEN arranca
- THEN los temporizadores de Books y de CRM están programados con su periodo de siempre y sus clientes no quedan cortados

#### Scenario: cerrado, las tres pasadas
- GIVEN el modo cerrado
- WHEN arranca el worker
- THEN se programan las pasadas de Desk, Books y CRM como hoy

### RQ-ZS-46 · Un barrido del repositorio prohíbe llamadas a Zoho Desk fuera de la puerta

Una prueba **SHALL** recorrer `apps/desk/server`, `apps/hub-sync`, `packages` y `scripts`, sin los comentarios, y buscar las señales de una salida a Zoho Desk:
verbos HTTP literales y `GET` implícitos, `fetch`, `fetchImpl`, dominios y rutas de Desk, el token, y toda instancia de `createZohoClient` y de `createTokenManager`.
Cada señal **SHALL** valer sólo en su sitio dentro de una **lista cerrada** de sitios permitidos. Una señal fuera de la lista **SHALL** poner la prueba en rojo y nombrar
el fichero. El barrido **MUST NOT** depender de los límites de `apps/desk/server/testing/superficieSaliente.ts` (`:55`, `:84`, `:91`, `:46`). El código nuevo **MUST NOT**
escribir un `method:` literal que clasifique el barrido viejo.

#### Scenario: una llamada a Desk fuera de la puerta pone el barrido en rojo
- GIVEN un árbol sintético ensuciado con cada una de estas formas fuera de la lista: `GET` implícito, `fetchImpl`, dominio de Desk, petición de token e instancia nueva de `createZohoClient`
- WHEN corre el barrido sobre él
- THEN se pone rojo con cada una, y nombra el fichero ensuciado

#### Scenario: la misma señal en un comentario no cuenta
- GIVEN el árbol sintético con esas mismas formas escritas sólo en comentarios
- WHEN corre el barrido
- THEN queda en verde

#### Scenario: sobre el repositorio real queda verde
- GIVEN el repositorio tal como está
- WHEN corre el barrido
- THEN queda en verde y la lista cerrada no contiene un sitio sin señal real

### RQ-ZS-47 · `DEPLOY.md` §24 documenta el interruptor, que va en los dos servicios

`DEPLOY.md` **SHALL** terminar con una sección `### 24` sobre `MODO_SIN_ZOHO_DESK` con dos apartados: «Qué enciende» y «Qué se rompe si se pone mal» (regla de secretos,
`CLAUDE.md`). **SHALL** decir que la variable va en los **DOS** servicios, la App y el worker `hub-sync`, y que con uno solo el otro sigue llamando a Zoho y la semana no
prueba nada; que abrir o cerrar pide redesplegar los dos (S-f); y cómo leer el registro durante la semana del paso 4 del corte: el `GET /api/admin/modo-sin-zoho-desk`
para la App y el log para el worker, distinguiendo cortes de rechazos (S-j). Una prueba **SHALL** fijar el contenido de la sección.

#### Scenario: la sección existe y cubre lo obligatorio
- GIVEN `DEPLOY.md` leído por la prueba
- WHEN busca la sección 24
- THEN encuentra los apartados «Qué enciende» y «Qué se rompe si se pone mal», la mención a los dos servicios y las dos vías para leer el registro

#### Scenario: quitar una parte de la sección pone la prueba en rojo
- GIVEN una copia de `DEPLOY.md` sin la mención al worker, o sin el apartado «Qué se rompe si se pone mal»
- WHEN corre la prueba de la sección 24
- THEN se pone roja
