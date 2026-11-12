# Delta para zoho-sync — los pools de la base escuchan su evento `error`: una conexión inactiva cortada por el servidor deja una línea y no tumba el proceso (`fuera-del-plan`, `cierra: si`)

Atiende E-285 (`docs/sdd/ENTRADA.md:2532-2537` en `96cba5ab`), con los supuestos S-1 a S-7 de `proposal.md`. Numeración comprobada contra
`openspec/specs/zoho-sync/spec.md`: el último requisito vivo es RQ-ZS-57 (`openspec/specs/zoho-sync/spec.md:2860`); los nuevos son RQ-ZS-58 a RQ-ZS-62. Esta spec
fija el comportamiento observable; el canal por el que sale la línea (S-1), el nombre del módulo nuevo y la forma de inyectar el registro en las pruebas los
elige y prueba el diseño.

**Nota de fusión.** Sólo `## ADDED Requirements`, al **final** de la spec viva: ningún bloque MODIFIED ni REMOVED, ninguna línea viva se mueve.

**Elección (a), y por qué.** RQ-ZS-57 dice que `DEPLOY.md` «SHALL terminar» con la §26 (`openspec/specs/zoho-sync/spec.md:2862`). Esa frase es histórica: era cierta el día que se
escribió. Se sigue el precedente de la propia spec, que declaró en RQ-ZS-57 su precedencia sobre RQ-ZS-51 sin modificarlo (`openspec/specs/zoho-sync/spec.md:2869-2871`). La
contradicción se declara en RQ-ZS-62 y RQ-ZS-57 no se modifica (S-6).

## ADDED Requirements

### RQ-ZS-58 · Los dos pools de la base escuchan `error`: un error emitido por el pool no lanza y el proceso sigue

`createPool` y `createPoolFromUrl` (`packages/zoho-sync/src/db/pool.ts:6` y `:10`) **SHALL** devolver el pool ya con un oyente de su evento `error`. Emitir `error`
sobre un pool recién creado **MUST NOT** lanzar ninguna excepción, con `dbSchema` `desk`, con `dbSchema` `public` y desde `createPoolFromUrl`. El proceso que los usa
(la App, el worker `hub-sync` y el script de relleno de artículos) **SHALL** seguir vivo tras el evento. El cambio **MUST NOT** reconectar, reintentar ni reiniciar nada
por su cuenta: la siguiente consulta abre otra conexión porque el pool ya saca la muerta. **MUST NOT** cambiar `max`, `min`, `idleTimeoutMillis`, `statement_timeout` ni
`connectionTimeoutMillis`. **Hipótesis (CA-1):** hoy un `error` sin oyente lanza; el rojo previo de la prueba lo comprueba antes de tocar `pool.ts`.

Fuente: E-285, `docs/sdd/ENTRADA.md:2532-2537` en `96cba5ab`; los pools sin oyente, `packages/zoho-sync/src/db/pool.ts:4-11`.

#### Scenario: `createPool` con esquema `desk` sobrevive a un `error` — ROJO
- GIVEN un pool creado con `createPool` y `dbSchema` `desk`, sin base alguna detrás
- WHEN se emite `error` sobre el pool con un error cualquiera
- THEN no se lanza ninguna excepción

#### Scenario: `createPool` con esquema `public` sobrevive a un `error` — ROJO
- GIVEN un pool creado con `createPool` y `dbSchema` `public`
- WHEN se emite `error` sobre el pool
- THEN no se lanza ninguna excepción

#### Scenario: `createPoolFromUrl` sobrevive a un `error` — ROJO
- GIVEN un pool creado con `createPoolFromUrl`
- WHEN se emite `error` sobre el pool
- THEN no se lanza ninguna excepción

#### Scenario: quitar el oyente pone las pruebas en rojo
- GIVEN la lógica del oyente mutada para no registrarlo
- WHEN corren las pruebas de los tres escenarios anteriores y la de PostgreSQL real de RQ-ZS-60
- THEN se ponen rojas, y tras restaurar el fichero byte a byte (`git diff` vacío sobre lo mutado) vuelven a verde

#### Scenario: el pool no cambia sus tiempos ni sus límites
- GIVEN un pool creado por cualquiera de las dos funciones
- WHEN se inspeccionan sus opciones
- THEN no fijan `max`, `min`, `idleTimeoutMillis`, `statement_timeout` ni `connectionTimeoutMillis` más allá de lo que fijaban en `96cba5ab`

### RQ-ZS-59 · Cada error del pool deja UNA línea en el registro del proceso, sin secretos

Cuando el pool emite `error`, el oyente del RQ-ZS-58 **SHALL** escribir en el registro del proceso exactamente **una** línea por evento. La línea **SHALL** llevar un texto fijo
que diga que se perdió una conexión inactiva, el mensaje del error y, solo si el error trae `code`, su código SQLSTATE. **MUST NOT** llevar el objeto de error ni nada de
la conexión: ni `err.client`, ni la cadena de conexión, ni el usuario, la contraseña o el host. Los eventos sucesivos **SHALL** dar una línea cada uno, sin agrupar ráfagas (S-4).
El canal concreto por el que sale la línea lo cierra el diseño (S-1); este requisito exige sólo que sea el registro del proceso y que la prueba pueda capturarlo.

Fuente: S-2 y S-4 de `proposal.md`; regla de secretos de `CLAUDE.md`; el error que `pg-pool` emite arrastra al cliente (`proposal.md` §2.3).

#### Scenario: una línea con el texto fijo y el mensaje
- GIVEN un pool y un registro capturado por la prueba
- WHEN se emite `error` con un error de mensaje conocido y sin `code`
- THEN el registro recibe exactamente una línea, que contiene el texto fijo y ese mensaje

#### Scenario: con `code`, la línea lo lleva
- GIVEN un error con `code` `57P01`
- WHEN se emite `error` sobre el pool
- THEN la línea única contiene `57P01`, y con un error sin `code` la línea no contiene ninguno

#### Scenario: ningún secreto llega a la línea — mutación 2
- GIVEN un error cuyo `client` lleva una cadena de conexión y una contraseña-testigo
- WHEN se emite `error` sobre el pool
- THEN la línea no contiene ni la cadena de conexión ni la contraseña-testigo, y una versión mutada que vuelque el objeto de error en la línea hace fallar la prueba

#### Scenario: un evento, una línea
- GIVEN tres errores emitidos seguidos sobre el mismo pool
- WHEN se lee el registro capturado
- THEN contiene exactamente tres líneas, una por evento

### RQ-ZS-60 · Contra PostgreSQL real, cortar una conexión EN REPOSO deja una línea y la siguiente consulta funciona

Una prueba de integración **SHALL** correr contra un PostgreSQL real y desechable —una base propia, creada y borrada por la prueba, con la imagen `postgres:17-alpine`; nunca
producción (S-5)—, y **SHALL** saltarse limpiamente cuando no exista `TEST_DATABASE_URL`, como `packages/zoho-sync/src/db/puestaAlDiaEstricta.integration.test.ts:17-18`. Para un
pool creado por `createPool` y otro por `createPoolFromUrl`: una consulta **SHALL** anotar su `pg_backend_pid()`; con esa conexión ya en reposo, otra sesión **SHALL** cortarla
con `pg_terminate_backend`, dentro de la ventana de `idleTimeoutMillis` del pool (10 s por defecto) y con espera acotada. Tras el corte: el proceso **SHALL** seguir vivo,
el registro **SHALL** recibir una sola línea (RQ-ZS-59) y la siguiente consulta **SHALL** resolver con un pid distinto. La prueba **SHALL** anotar `SHOW server_version` y el
SQLSTATE observado (**hipótesis:** `57P01`). **Hipótesis (CA-3):** el corte produce dos errores seguidos, el del servidor y el del socket cerrado, y el segundo cae en el
oyente silencioso del cliente de `pg-pool`; la prueba mide cuántas líneas salen y fija la cifra observada.

Fuente: CA-3 y S-5 de `proposal.md`; el molde de la base propia y de las esperas acotadas, `packages/zoho-sync/src/db/puestaAlDiaEstricta.integration.test.ts:62-79` y `:23-35`.

#### Scenario: corte en reposo con `createPool`
- GIVEN un pool de `createPool` con una conexión en reposo y su pid anotado
- WHEN otra sesión ejecuta `pg_terminate_backend` sobre ese pid antes de que el pool la cierre por inactividad
- THEN el proceso de la prueba sigue vivo, el registro recibe una sola línea y la siguiente consulta del pool resuelve con otro pid

#### Scenario: corte en reposo con `createPoolFromUrl`
- GIVEN un pool de `createPoolFromUrl` en la misma situación
- WHEN se corta su conexión en reposo
- THEN ocurre lo mismo que en el escenario anterior

#### Scenario: la prueba no pasa en falso
- GIVEN la lógica del oyente mutada para no registrarlo
- WHEN corre esta prueba
- THEN se pone roja (excepción no capturada o ausencia de la línea), y un corte llegado después de la ventana de inactividad no se da por probado

#### Scenario: sin base de pruebas se salta
- GIVEN el entorno sin `TEST_DATABASE_URL`
- WHEN corre `npm test`
- THEN la prueba de integración se salta y la suite no falla por ello

### RQ-ZS-61 · `pool.ts` se edita en sitio, la lógica vive en un módulo nuevo y no hay variable de entorno nueva

`packages/zoho-sync/src/db/pool.ts` **SHALL** conservar su número de líneas y su final de línea; **SHALL** cambiar sólo las líneas 1 (el import, en la misma línea física), 6
y 10 (las dos funciones, en sitio). Las líneas 4, 5, 7 a 9 y 11 **SHALL** quedar idénticas, de modo que las afirmaciones que las citan («sin límites», «sin `search_path`») siguen
siendo ciertas (caso A de la regla de mutación 4). La lógica del oyente y de la línea **SHALL** vivir en un módulo nuevo de `packages/zoho-sync/src/db/`, importable por la
exportación `./*` del paquete. El cambio **MUST NOT** añadir ninguna variable de entorno ni interruptor, **MUST NOT** tocar `.env.example`, `schema.sql` ni `migrate.ts`, y los
llamadores del pool (`apps/desk/server/index.ts:18`, `apps/hub-sync/src/hub-sync.ts:18` y `:53`, `apps/hub-sync/src/backfill-items.ts:31`) **SHALL** quedar sin cambios, salvo, si el diseño
elige esa vía (S-1), la línea en la que cada uno crea su pool, en sitio.

Fuente: S-3 y S-7 de `proposal.md`; regla de mutación 4 de `CLAUDE.md` (34 citas a `pool.ts`); el paquete, `packages/zoho-sync/package.json:2`.

#### Scenario: `pool.ts` conserva sus líneas
- GIVEN `packages/zoho-sync/src/db/pool.ts` en `96cba5ab` y en el árbol del cambio
- WHEN se comparan
- THEN tienen el mismo número de líneas y el mismo final de línea, y sólo difieren las líneas 1, 6 y 10

#### Scenario: la prueba existente de `pool.ts` sigue en verde
- GIVEN `packages/zoho-sync/src/db/pool.test.ts` sin modificar
- WHEN corre contra el árbol del cambio
- THEN pasa

#### Scenario: sin variable ni interruptor nuevos
- GIVEN `.env.example` en `96cba5ab` y en el árbol del cambio
- WHEN se comparan
- THEN no difieren, y el comportamiento del RQ-ZS-58 no depende de ninguna variable de entorno

### RQ-ZS-62 · `DEPLOY.md` §27 documenta la línea y su límite, sin variable nueva

`DEPLOY.md` **SHALL** terminar con una sección `## 27.`, añadida al final sin mover las §21 a §26. **SHALL** decir cómo es la línea del registro (texto fijo, mensaje y,
si lo hay, el SQLSTATE) y que **no hace falta hacer nada salvo que se repita**; que un reinicio de `desk-db` puede dar hasta tantas líneas como conexiones en reposo tenga
cada pool, para que no se lea como avería (S-4); que no hay interruptor ni variable nueva; y el **límite**: el oyente cubre las conexiones **en reposo** en el pool y **no** un
cliente prestado por `pool.connect()`, de modo que la precaución de la §26 de cortar sólo la sesión de la consola sigue vigente para las sesiones de la App con bloqueos
(CA-7). Una prueba **SHALL** fijar el contenido de la sección.

**Precedencia (contradice RQ-ZS-57 en un punto, y lo dice).** RQ-ZS-57 (`openspec/specs/zoho-sync/spec.md:2862`) dice que `DEPLOY.md` «SHALL terminar» con la §26. Eso era cierto
el día que se escribió; desde este cambio la última es la §27, igual que RQ-ZS-51 dejó de ser la última al llegar la §26. RQ-ZS-57 no se modifica (elección (a) de la
cabecera). La guarda «la §26 es la última» de `apps/desk/server/deployArranqueEstricto.test.ts:23-24` y `:54` se corrige en sitio con el molde de
`apps/desk/server/deployCalificacionesConversaciones.test.ts:23-24` y `:68`, sin cambiar el número de líneas del fichero de prueba.

Fuente: CA-6 y CA-7 de `proposal.md`; la §26 actual, `DEPLOY.md:1112`; regla de secretos de `CLAUDE.md`.

#### Scenario: la sección existe, es la última y cubre lo obligatorio — ROJO
- GIVEN `DEPLOY.md` leído por la prueba
- WHEN busca la sección 27
- THEN la encuentra detrás de la §26 y como última, con la descripción de la línea, la frase de que no hace falta hacer nada salvo que se repita, la afirmación de que no hay variable ni interruptor nuevo, y el límite del cliente prestado por `pool.connect()`

#### Scenario: ensuciar el fichero vigilado pone la prueba en rojo — mutación 2
- GIVEN copias de `DEPLOY.md` sin la frase «salvo que se repita», sin la mención del cliente prestado o con una `## 28.` detrás de la §27
- WHEN corre la prueba de la sección 27 sobre cada copia
- THEN se pone roja en las tres

#### Scenario: la guarda de la §26 sigue verde en sitio
- GIVEN `apps/desk/server/deployArranqueEstricto.test.ts` corregido en sitio con «es la última hasta la §27»
- WHEN corre contra el `DEPLOY.md` con la §27
- THEN pasa, y el número de líneas del fichero de prueba no cambia
