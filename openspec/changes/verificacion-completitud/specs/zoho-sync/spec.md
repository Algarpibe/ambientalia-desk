# Delta para zoho-sync — verificación de completitud de Zoho Desk contra PostgreSQL y el volumen de adjuntos (1G-03, `cierra: si`)

Construye `decision/adelanto-09-11-empezar-1g` (Gerencia, 02/11/2026) con los supuestos S-a a S-n de `proposal.md`. Numeración
comprobada contra `openspec/specs/zoho-sync/spec.md`: el último requisito vivo es RQ-ZS-33 (`openspec/specs/zoho-sync/spec.md:2062`); los
nuevos son RQ-ZS-34 a RQ-ZS-39. Rutas de ficheros, nombres de módulos y de funciones los fija el diseño; sólo se fijan aquí la variable
`VERIFICACION_COMPLETITUD_HABILITADA` y la ruta `/api/admin/verificacion-completitud`.

**Nota de fusión.** Sólo `## ADDED Requirements`, al **final** de la spec viva: ningún bloque MODIFIED ni REMOVED, ninguna línea viva se mueve.

## ADDED Requirements

### RQ-ZS-34 · Las discrepancias conocidas son datos versionados y validados al cargar; lo que no explican queda «sin explicar»

Cada diferencia hallada **SHALL** salir «conocida», con causa y entrada, o «sin explicar» (S-j). Las conocidas **SHALL** vivir en un
fichero de datos versionado, no en constantes del código. Cada entrada **SHALL** llevar entidad, causa, entrada de la bandeja (o apartado
de `DEPLOY.md`) y, o bien ids concretos (el ticket #1017, E-267; los adjuntos `495552000061185001` del #881 y `495552000057838002` del
#925, 1G-02), o bien el nombre de una regla de un conjunto **cerrado** en el código: nacido en la app (S-g) y conversación marcada con
`ausente_en_zoho_at` junto con sus adjuntos (`DEPLOY.md` §19). Lo de un ticket conocido como ausente **SHALL** heredar su clase. La lista
se valida al cargar: sin causa, sin entrada, regla o entidad desconocida ⇒ la pasada **MUST NOT** lanzarse y el error **SHALL** nombrar la
entrada. Una entrada que no explica ninguna diferencia **SHALL** salir «conocida sin uso».

#### Scenario: una diferencia cubierta sale conocida con causa y entrada
- GIVEN el ticket #1017 presente en Desk y ausente de Zoho, y una entrada con ese número, su causa y E-267
- WHEN corre la pasada
- THEN la diferencia sale «conocida» con esa causa y esa entrada, y no cuenta como «sin explicar»

#### Scenario: quitar la entrada vuelve la misma diferencia «sin explicar»
- GIVEN los mismos datos y la lista sin la entrada del #1017
- WHEN corre la pasada
- THEN el #1017 sale «sin explicar» y el veredicto de tickets deja de ser verde

#### Scenario: un ticket ausente transmite su clase a sus hijos
- GIVEN un ticket conocido como ausente en Zoho con conversaciones y adjuntos guardados en Desk
- WHEN corre la pasada
- THEN las conversaciones y los adjuntos de ese ticket salen «conocidos» con la clase del ticket y no «sin explicar»

#### Scenario: una copia ensuciada de la lista real impide lanzar y nombra la entrada
- GIVEN copias del fichero real a las que se les quita la causa, la entrada, o se les pone una regla desconocida o una entidad desconocida
- WHEN se carga cada una
- THEN ninguna deja lanzar la pasada y el error nombra la entrada defectuosa; el fichero real carga sin error

#### Scenario: una entrada sin efecto sale «conocida sin uso»
- GIVEN una entrada válida cuyos ids no aparecen en ninguna diferencia
- WHEN corre la pasada
- THEN figura «conocida sin uso» y no altera el veredicto

### RQ-ZS-35 · Las entidades globales se comparan por ids en las dos direcciones, y la ausencia se confirma por id

La pasada **SHALL** comparar **tickets** (lista del departamento más archivados, del mismo `departmentId` que la sincronización, que el
informe declara; S-k), **contactos** y **cuentas** (S-f) de Zoho frente a sus tablas de PostgreSQL, devolviendo qué falta en Desk y qué
falta en Zoho, con los ids **ordenados**. Leer las listas **MUST NOT** escribir en PostgreSQL: **MUST NOT** reutilizarse las listas de la
sincronización, que escriben mientras leen. Un id de Desk ausente de la lista de Zoho **SHALL** pedirse por id **antes** de clasificarlo:
`404`, borrado o en papelera ⇒ «falta en Zoho»; vivo ⇒ «hueco de lista», que no es ausencia (S-l). Las filas nacidas en la app
**SHALL** excluirse de «falta en Zoho» sólo por la regla escrita en la lista editable (S-g). Excepción a la re-verificación: un id de Desk que no es un id de Zoho (prefijo `app-`, `apps/desk/server/db/ticketFuentes.ts:30`) **MUST NOT** pedirse por id; se clasifica sólo por la regla «nacido en la app», y sin ella sale «sin explicar». Si una lista de Zoho falla, esa entidad
**SHALL** quedar «sin comparar».

#### Scenario: un id que falta en cada lado sale en su lado y ordenado
- GIVEN Zoho con los tickets 3, 1 y 5, y Desk con 1, 2 y 5, y el 2 confirmado borrado por id
- WHEN corre la pasada
- THEN «falta en Desk» es `[3]` y «falta en Zoho» es `[2]`; con datos idénticos ambas salen vacías

#### Scenario: la lista incluye archivados
- GIVEN un ticket archivado en Zoho, ausente de la lista del departamento, y presente en Desk
- WHEN corre la pasada
- THEN no sale «falta en Zoho» y se compara contra la unión de ambas listas

#### Scenario: la re-verificación por id va antes de «falta en Zoho»
- GIVEN un contacto de Desk ausente de la lista de Zoho, y otro igual
- WHEN el primero responde `404` por id y el segundo responde vivo
- THEN el primero sale «falta en Zoho» y el segundo «hueco de lista»; ningún id se clasifica sin haberse pedido

#### Scenario: lo nacido en la app sólo se excluye por regla
- GIVEN un ticket `app-` y un contacto con `managed_by_app`, ausentes de Zoho
- WHEN corre con la regla «nacido en la app» y luego sin ella
- THEN con la regla salen «conocidos»; sin ella, «sin explicar»

#### Scenario: la lista de cuentas falla
- GIVEN `GET /accounts` respondiendo error persistente
- WHEN corre la pasada
- THEN cuentas figura «sin comparar» y el veredicto global no es verde

### RQ-ZS-36 · Las entidades por ticket se comparan como listas de ids, y los adjuntos también contra el volumen

**Conversaciones** **SHALL** compararse como LISTAS de ids: igual número con ids distintos ⇒ discrepancia; recuento declarado distinto
con listas iguales ⇒ ninguna, porque el recuento declarado sólo es dato y nunca juez (E-266). **Adjuntos** en Zoho **SHALL** ser la unión,
por id y contada una vez, de los `attachments` de las conversaciones de la lista del ticket y de `GET /tickets/{id}/attachments` (S-e);
se comparan frente a `desk.attachments` por id y `size`, con los bytes por lado en el informe; un `404` o un fallo de esa segunda
fuente **SHALL** ser error de ese ticket, no ausencia. `desk.attachments` frente al volumen **SHALL** juzgarse con `estadoCopia`
(`apps/desk/server/adjuntos/almacen.ts:107-119`): sin copia, ausente u otro tamaño ⇒ discrepancia, **sin descargar nada**. **Historia**
**SHALL** compararse con `desk.ticket_history` por el mismo id derivado que escribe `packages/zoho-sync/src/db/history.ts:8-11`: un evento
guardado casa, uno no guardado falta. Sin `ADJUNTOS_DIR` válida, la parte del volumen **SHALL** quedar «sin comparar».

#### Scenario: igual cantidad con ids distintos es discrepancia
- GIVEN un ticket con las conversaciones `a1, a2` en Zoho y `a1, a3` en Desk
- WHEN corre la pasada
- THEN `a2` falta en Desk y `a3` falta en Zoho

#### Scenario: el recuento declarado no decide
- GIVEN un ticket cuya lista de Zoho declara 5 conversaciones pero devuelve 4, y Desk guarda esas mismas 4
- WHEN corre la pasada
- THEN no hay discrepancia de conversaciones para ese ticket (E-266)

#### Scenario: un adjunto por las dos vías cuenta una vez y `size` distinto es diferencia
- GIVEN el adjunto `4001` en una conversación y en `GET /tickets/{id}/attachments`, y el `4002` con `size` distinto en Desk
- WHEN corre la pasada
- THEN `4001` cuenta una vez y casa; `4002` sale como diferencia de tamaño, con los bytes de cada lado

#### Scenario: el volumen se juzga sin descargar
- GIVEN tres filas con `storage_path` sin fichero, con fichero de otro tamaño y con fichero íntegro
- WHEN corre la pasada con `ADJUNTOS_DIR` válida
- THEN las dos primeras son discrepancia, la tercera no, y ninguna petición descarga un adjunto

#### Scenario: la historia casa por el id derivado
- GIVEN un evento guardado con el id de `packages/zoho-sync/src/db/history.ts:8-11` y otro de Zoho sin guardar
- WHEN corre la pasada
- THEN el primero casa y el segundo sale «falta en Desk»

#### Scenario: sin `ADJUNTOS_DIR`
- GIVEN `ADJUNTOS_DIR` sin definir
- WHEN corre la pasada
- THEN adjuntos frente al volumen figura «sin comparar» y el veredicto de adjuntos no es verde

### RQ-ZS-37 · La pasada sólo lee, tolera `429` antes de decidir nada, se corta de forma reanudable y no filtra datos de clientes

Toda petición a Zoho **SHALL** ser `GET` y ninguna sentencia **SHALL** escribir en tablas de negocio. Ante `429`, **SHALL** reintentarse
tres veces con pausa de 2.000 ms **antes** de tratar un `404` o un `!res.ok`; agotados, **SHALL** cortarse con `cortadoEn` y `desde`
**SHALL** reanudar desde ahí la fase por ticket (B); un corte en la fase de listas globales (A) **SHALL** reanudarse relanzando sin `desde`, que rehace esa fase entera. **SHALL** ejecutarse una pasada a la vez. Las peticiones y los `429` **SHALL** contarse por entidad y
constar en el informe (S-i). Con `limite=0` **SHALL** contar y estimar el mínimo de peticiones sin llamar a Zoho. Informe, `GET` y log
**MUST NOT** llevar nombres, correos, asuntos, contenido ni secretos: sólo ids, números de ticket y recuentos.

#### Scenario: sólo `GET` y ninguna escritura de negocio
- GIVEN una pasada completa con Zoho falso y una `Queryable` que sólo admite `SELECT` sobre tablas de negocio
- WHEN termina
- THEN todas las peticiones registradas son `GET` y ninguna sentencia escribió en esas tablas

#### Scenario: `429` se reintenta antes del `404` y del `!res.ok`
- GIVEN una petición por id que responde `429` dos veces y luego `404`, y otra que responde `429` y luego `500`
- WHEN se procesan
- THEN la primera se clasifica «falta en Zoho» tras dos pausas de 2.000 ms, no antes; la segunda es error de ese ticket tras el reintento

#### Scenario: `429` agotado corta y `desde` reanuda
- GIVEN el ticket 20 con `429` en las tres repeticiones, y los tickets 10, 20 y 30
- WHEN corre, y luego se repite con `desde=20` cuando Zoho responde bien
- THEN la primera termina con `cortadoEn` en 20 sin pedir el 30; la segunda pide sólo 20 y 30 en ese orden

#### Scenario: `limite=0` cuenta y estima sin llamar a Zoho
- GIVEN 3 tickets en Desk
- WHEN se lanza con `limite=0`
- THEN devuelve el recuento y la estimación mínima de peticiones, con cero llamadas a Zoho

#### Scenario: una pasada a la vez y recuentos por entidad
- GIVEN una pasada en marcha
- WHEN llega otro `POST`
- THEN devuelve el estado sin iniciar otra; el informe final trae peticiones y `429` desglosados por entidad

#### Scenario: informe, `GET` y log sin datos de clientes
- GIVEN fixtures con asunto, nombre, correo, contenido y un secreto marcados, y un ticket con error
- WHEN se serializa el informe, el `GET` y se escribe al log
- THEN llevan el id y el número del ticket con error y ninguno de esos marcadores

### RQ-ZS-38 · El veredicto es por entidad y global, verde exige cobertura completa y es comparable entre pasadas

El informe **SHALL** dar un veredicto por entidad (tickets, conversaciones, adjuntos, historia, contactos, cuentas) y uno global. Verde
**SHALL** exigir cero «sin explicar» y cobertura completa: todos los tickets comparados y sin errores por ticket (S-c). Una pasada
cortada, parcial, con error por ticket, con una entidad «sin comparar» o con la parte previa perdida (por ejemplo un redespliegue entre
el corte y la reanudación; S-m) **SHALL** ser «incompleto» y **MUST NOT** ser verde jamás. Dos pasadas sobre los mismos datos
**SHALL** dar el mismo informe salvo instantes y peticiones: ids ordenados y orden fijo. El informe **SHALL** llevar la versión de su
esquema y la de la lista de conocidas aplicada.

#### Scenario: cero «sin explicar» y cobertura completa es verde
- GIVEN datos idénticos a ambos lados y todas las entidades comparadas
- WHEN termina la pasada
- THEN cada entidad y el global son verdes

#### Scenario: una sola diferencia «sin explicar» quita el verde de su entidad y del global
- GIVEN una conversación que falta en Desk sin entrada en la lista
- WHEN termina la pasada
- THEN conversaciones y el global no son verdes; las demás entidades conservan su veredicto

#### Scenario: cortada, con error por ticket o con parte previa perdida es «incompleto»
- GIVEN una pasada cortada por `429`; otra con un ticket en error; y una reanudación con `desde` tras perderse el estado previo
- WHEN terminan
- THEN las tres son «incompleto» aunque no haya ningún «sin explicar»

#### Scenario: dos pasadas iguales dan el mismo informe
- GIVEN dos pasadas sobre los mismos datos, con instantes y peticiones distintos
- WHEN se comparan sus informes sin esos campos
- THEN son idénticos, con ids ordenados, y ambos llevan la versión de esquema y la de la lista

### RQ-ZS-39 · La pasada se lanza desde una ruta de superadministrador tras un interruptor que nace cerrado

`POST /api/admin/verificacion-completitud` lanza la pasada en segundo plano y `GET` da su estado, con el molde de
`/api/admin/relleno-adjuntos` (`apps/desk/server/routes/rellenoAdjuntos.ts:17-55`). Sólo un superadministrador **SHALL** acceder. El
interruptor `VERIFICACION_COMPLETITUD_HABILITADA` **SHALL** nacer cerrado y abrirse sólo con `'true'`: `TRUE`, `1`, vacío y ausente
cierran. Cerrado, el `POST` **SHALL** responder `403` que nombra la variable, **después** de la guarda de rol y **antes** de validar los
parámetros. `limite=0` **MUST NOT** necesitar el interruptor. `desde` y `limite` no enteros ⇒ `400`. El `GET` **MUST NOT** lanzar una
pasada ni lanzar excepción. `DEPLOY.md` **SHALL** llevar una §23 al final, con «Qué enciende», «Qué se rompe si se pone mal» y los pasos
de persona: contar primero, pasada completa, reanudar con `desde`, cerrar el interruptor y repetir el día del corte.

#### Scenario: el orden de las guardas es rol, interruptor, validación
- GIVEN el interruptor cerrado; un usuario sin rol y un superadministrador, ambos con `limite=abc`
- WHEN hacen `POST`
- THEN el primero recibe `403` de rol; el segundo, `403` que nombra `VERIFICACION_COMPLETITUD_HABILITADA`, no `400`; con el interruptor abierto, el `400`

#### Scenario: sólo `'true'` abre
- GIVEN `VERIFICACION_COMPLETITUD_HABILITADA` con `TRUE`, `1`, vacío y ausente, y luego con `true`
- WHEN un superadministrador hace `POST` con `limite` válido y mayor que 0
- THEN los cuatro primeros dan `403` y el último lanza

#### Scenario: `limite=0` es libre con el interruptor cerrado
- GIVEN el interruptor cerrado
- WHEN un superadministrador hace `POST` con `limite=0`
- THEN responde el recuento y la estimación, con cero peticiones a Zoho

#### Scenario: `desde` o `limite` no enteros
- GIVEN el interruptor abierto
- WHEN llega `desde=1.5` y luego `limite=x`
- THEN ambas responden `400` sin llamar a Zoho

#### Scenario: `GET` no lanza ni falla
- GIVEN sin pasada previa, y otra con la pasada en error
- WHEN un superadministrador hace `GET`
- THEN devuelve «sin pasada» o el estado con su error, sin lanzar una pasada y sin excepción; un usuario que no es superadministrador recibe `403`

#### Scenario: `DEPLOY.md` documenta la variable y los pasos de persona
- GIVEN `DEPLOY.md` tras el cambio
- WHEN se lee su última sección
- THEN es la §23, nombra la variable con «Qué enciende» y «Qué se rompe si se pone mal», y trae contar, pasada completa, reanudar, cerrar y repetir el día del corte
