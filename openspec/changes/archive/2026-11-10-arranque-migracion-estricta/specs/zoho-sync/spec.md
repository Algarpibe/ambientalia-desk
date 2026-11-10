# Delta para zoho-sync — puesta al día estricta de la base en el arranque de la App: límite de espera de bloqueo y fallo que detiene (`fuera-del-plan`, `cierra: si`)

Construye el paso 2 de `decision/arranque-bloqueado-por-consola` (Gerencia, 08/11/2026; respuesta en `openspec/config.yaml:6472`, consecuencia (2)
en `openspec/config.yaml:6476-6477`), con los supuestos S-1 a S-6 de `proposal.md`. Numeración comprobada contra `openspec/specs/zoho-sync/spec.md`:
el último requisito vivo es RQ-ZS-51 (`openspec/specs/zoho-sync/spec.md:2696`); los nuevos son RQ-ZS-52 a RQ-ZS-57. Esta spec fija el comportamiento
observable; el mecanismo (cliente propio con `SET lock_timeout` de sesión, o `SET LOCAL` dentro de una transacción), el nombre del módulo y la forma
del error tipado los elige y prueba el diseño. El valor del límite no se fija aquí: es el del supuesto S-3 de `proposal.md` (10 s por sentencia).

**Nota de fusión.** Sólo `## ADDED Requirements`, al **final** de la spec viva: ningún bloque MODIFIED ni REMOVED, ninguna línea viva se mueve.

**Elección entre (a) y (b), y por qué.** Se elige **(a)**: ADDED que declara su precedencia. Razones: (1) es el precedente de la propia spec,
que añadió la §25 de `DEPLOY.md` sin tocar a RQ-ZS-47 (`openspec/specs/zoho-sync/spec.md:2551`, que dice «SHALL terminar» con la §24) y que declaró en RQ-ZS-40 su prevalencia sobre RQ-ZS-31;
(2) RQ-ZS-10 sigue siendo cierto **de la función** `reorgToDesk`, que no cambia para sus otros llamadores, y reescribir su bloque a igual número de
líneas obligaría a copiar un requisito de quince líneas con una frase retocada, con riesgo de desplazar las citas que apuntan a su cuerpo
(`openspec/specs/zoho-sync/spec.md:353-355`); (3) RQ-ZS-51 dice «SHALL terminar» con la §25 y esa frase es histórica (cierto el día que se escribió),
lo mismo que pasó con RQ-ZS-47 al llegar la §25. Las dos contradicciones se declaran en RQ-ZS-56 (RQ-ZS-10) y RQ-ZS-57 (RQ-ZS-51).

## ADDED Requirements

### RQ-ZS-52 · El arranque de la App fija un límite de espera de bloqueo antes de la primera sentencia, y vale para todas

La puesta al día de la base que hace el arranque de la App —la reorganización de esquema (`reorgToDesk`) y la migración (`migrate`), llamadas desde
`apps/desk/server/index.ts:26-27`— **SHALL** correr con un límite de espera de bloqueo (`lock_timeout`) ya vigente **antes** de enviar su primera sentencia
y vigente en **todas**, la reorganización incluida. El valor **SHALL** ser una constante del código (S-2, S-3): **MUST NOT** leerse de ninguna
variable de entorno y **MUST NOT** añadirse ninguna a `.env.example`. Al terminar la puesta al día, bien o mal, la conexión que el pool vuelva a ofrecer a
la App **MUST NOT** conservar el límite ni una transacción abierta.

Fuente: decision/arranque-bloqueado-por-consola (2), `openspec/config.yaml:6472`; el pool no fija límite alguno (`packages/zoho-sync/src/db/pool.ts:4-7`).

#### Scenario: el límite está vigente antes de la primera sentencia y en todas las siguientes
- GIVEN una conexión falsa que registra, por orden, todo lo que recibe, y la puesta al día estricta con `DB_SCHEMA=desk`
- WHEN corre hasta el final sin error
- THEN lo primero que recibe la conexión es el límite de espera, y las sentencias de la reorganización y de la migración llegan todas después, con ese límite aún vigente

#### Scenario: el valor es una constante, sin variable de entorno
- GIVEN el entorno de la prueba sin ninguna variable relativa al límite, y luego con variables de nombre plausible puestas a otro valor
- WHEN corre la puesta al día estricta
- THEN el límite que recibe la conexión es el mismo en los dos casos, y `.env.example` no gana ninguna línea respecto de `97539c73`

#### Scenario: la conexión vuelve limpia al pool, bien o mal
- GIVEN un pool de una sola conexión y la puesta al día estricta, una vez terminando bien y otra vez fallando en una sentencia
- WHEN, después de cada una, la App pide otra consulta al mismo pool
- THEN esa consulta no ve el límite de la puesta al día (su `lock_timeout` es el de la base) y no corre dentro de una transacción abierta

### RQ-ZS-53 · Si se agota el límite, el registro nombra la sentencia y dice que fue por el límite

Cuando una sentencia de la puesta al día estricta no obtiene su bloqueo en el límite del RQ-ZS-52, el arranque **SHALL** detenerse (RQ-ZS-54) con una línea del
registro que **SHALL** (a) nombrar la sentencia que lo agotó, (b) decir expresamente que fue por el **límite de espera** y (c) dar su valor. El error por límite
**SHALL** distinguirse de cualquier otro fallo de sentencia. La línea sale por el `logger` de la App, no por `console.error`, para no depender de que el panel
de despliegue muestre stderr (S-6). **Hipótesis:** PostgreSQL señala el límite con el código `55P03` (`lock_not_available`); la prueba de evidencia contra
PostgreSQL real lo comprueba y la prueba unitaria usa un error falso con ese código.

Fuente: decision/arranque-bloqueado-por-consola (2), `openspec/config.yaml:6472` («con rastro en el registro»); el incidente, `packages/zoho-sync/src/db/schema.sql:374`.

#### Scenario: un bloqueo ajeno agota el límite y la línea lo dice
- GIVEN una conexión falsa cuya sentencia `ALTER TABLE public.catalogo_modelos ADD COLUMN IF NOT EXISTS sku text` (`packages/zoho-sync/src/db/schema.sql:374`) falla con `55P03`
- WHEN corre la puesta al día estricta
- THEN rechaza con un error cuyo texto contiene «límite de espera», el comienzo de esa sentencia y el valor del límite, y ese error es distinguible por su tipo de uno que no es de límite

#### Scenario: otro fallo no se presenta como límite
- GIVEN una conexión falsa cuya sentencia falla con un error que no es `55P03`
- WHEN corre la puesta al día estricta
- THEN el error rechazado no contiene «límite de espera» y no se confunde con el de límite

#### Scenario: la línea llega al registro del arranque
- GIVEN el arranque de la App con la puesta al día rechazando por límite
- WHEN el rechazo llega al `catch` de `main` (`apps/desk/server/index.ts:106-109`)
- THEN el `logger` recibe el error con el texto de la sentencia y del límite, y el arranque no llega a escuchar

#### Scenario: evidencia contra PostgreSQL real y desechable
- GIVEN una base vacía de la imagen local `postgres:16-alpine` (nunca producción) y una sesión que retiene un bloqueo sobre `public.catalogo_modelos`
- WHEN corre la puesta al día estricta
- THEN se detiene en torno al límite con la línea del escenario del bloqueo, y sobre una base vacía sin esa sesión pasa dos veces seguidas (idempotente)

### RQ-ZS-54 · En el arranque de la App, una sentencia que falla detiene el arranque con una línea clara y salida distinta de 0

En el arranque de la App, la primera sentencia de la puesta al día que falle —por el límite o por cualquier otro error— **SHALL** detener la puesta al día: las
sentencias siguientes **MUST NOT** ejecutarse, el error rechazado **SHALL** nombrar la sentencia y la causa, y el proceso **SHALL** terminar con código distinto
de 0 por el `catch` que `main` ya tiene (`apps/desk/server/index.ts:106-109`), sin llegar a escuchar (`apps/desk/server/index.ts:57-59`). La sentencia **SHALL**
citarse sin datos (el esquema no contiene ninguno). Esto **SHALL** valer también para la reorganización: un fallo de ella detiene el arranque antes de la migración.

Fuente: decision/arranque-bloqueado-por-consola (2), `openspec/config.yaml:6472` («un cambio de base que falle detenga el arranque»); la tolerancia que se deja de usar aquí, `packages/zoho-sync/src/db/migrate.ts:24-36`.

#### Scenario: la primera que falla corta la secuencia
- GIVEN una conexión falsa que falla en la tercera sentencia de la migración
- WHEN corre la puesta al día estricta
- THEN rechaza con un error que nombra esa sentencia y el error original, y la conexión no recibe ninguna sentencia posterior a la tercera

#### Scenario: un fallo en la reorganización no llega a la migración
- GIVEN `DB_SCHEMA=desk` y una conexión falsa que falla en una sentencia de la reorganización
- WHEN corre la puesta al día estricta
- THEN rechaza, y no se envía ninguna sentencia de la migración

#### Scenario: el fallo termina el proceso con código distinto de 0 — ROJO
- GIVEN el arranque de la App con la puesta al día rechazando
- WHEN `main` rechaza
- THEN el `catch` registra «Fallo al arrancar el servidor» con el error y llama a `process.exit(1)`, y `app.listen` no se llama

#### Scenario: volver a tolerar pone la prueba en rojo
- GIVEN la puesta al día estricta mutada para capturar el error de sentencia y seguir
- WHEN corre la prueba del escenario de la primera que falla
- THEN se pone roja

### RQ-ZS-55 · Orden: el límite antes de la primera sentencia, la reorganización antes que la migración, y todo antes de escuchar

El orden de la puesta al día estricta **SHALL** ser: (1) fijar el límite del RQ-ZS-52; (2) la reorganización, sólo cuando `config.dbSchema === 'desk'`; (3) la
migración; y el arranque **SHALL** completar los tres **antes** de escuchar (`apps/desk/server/index.ts:57-59`). La reorganización **SHALL** seguir yendo antes que la
migración (`apps/desk/server/index.ts:26-27`). Una prueba **SHALL** fijar la POSICIÓN (regla de mutación 1 de `CLAUDE.md`), no sólo la condición: se pone roja si el límite
pasa detrás de la primera sentencia o si se invierte el orden de las dos listas. Los dos identificadores `reorgToDesk` y `migrate` **SHALL** seguir nombrándose en
`apps/desk/server/index.ts:26` y `:27`, respectivamente, sin cambiar el número de líneas del fichero.

Fuente: decision/arranque-bloqueado-por-consola (2), `openspec/config.yaml:6472`; las listas, `packages/zoho-sync/src/db/migrate.ts:19-21` y `:114-120`.

#### Scenario: posición del límite — mutación 1 — ROJO
- GIVEN la conexión falsa que registra el orden de todo lo que recibe
- WHEN corre la puesta al día estricta
- THEN el límite precede a toda sentencia, y una versión mutada que lo envía tras la primera sentencia hace fallar la prueba

#### Scenario: posición de la reorganización respecto de la migración — mutación 1 — ROJO
- GIVEN la conexión falsa y `DB_SCHEMA=desk`
- WHEN corre la puesta al día estricta
- THEN todas las sentencias de `reorgToDeskStatements()` llegan antes que cualquiera de `schemaStatements()`, y una versión mutada con las dos listas invertidas hace fallar la prueba

#### Scenario: sin `DB_SCHEMA=desk` no hay reorganización
- GIVEN `DB_SCHEMA` distinto de `desk` y la conexión falsa
- WHEN corre la puesta al día estricta
- THEN el límite llega primero, después sólo sentencias de la migración, y ninguna de la reorganización

#### Scenario: la puesta al día termina antes de escuchar
- GIVEN el arranque de la App con la puesta al día pendiente de resolverse
- WHEN `main` avanza
- THEN `app.listen` no se llama hasta que la puesta al día haya terminado, y si rechaza no se llama nunca

#### Scenario: `index.ts` conserva sus líneas
- GIVEN `apps/desk/server/index.ts` en `97539c73` y en el árbol del cambio
- WHEN se comparan
- THEN tienen el mismo número de líneas y el mismo final de línea, la línea 8 es idéntica, y las líneas 26 y 27 siguen nombrando `reorgToDesk` y `migrate`

### RQ-ZS-56 · El worker y los demás llamadores de `migrate()` y `reorgToDesk()` siguen tolerantes; en el arranque de la App prevalece lo estricto

`migrate()` (`packages/zoho-sync/src/db/migrate.ts:24-36`) y `reorgToDesk()` (`packages/zoho-sync/src/db/migrate.ts:126-131`) **SHALL** seguir siendo tolerantes por
sentencia —capturan el error, lo escriben con «sentencia omitida» y continúan— para todo llamador que no sea el arranque de la App: el worker
(`apps/hub-sync/src/hubSync.ts:13` y `apps/hub-sync/src/hub-sync.ts:47`), el arnés de pruebas (`apps/desk/server/testing/appHarness.ts:38`) y las pruebas sobre pg-mem (S-1). Su
código, el de `schema.sql` y el de esos llamadores **SHALL** quedar sin cambios.

**Precedencia (contradice RQ-ZS-10 en un punto, y lo dice).** RQ-ZS-10 (`openspec/specs/zoho-sync/spec.md:353-355`) afirma que `reorgToDesk` «SHALL ser tolerante por
sentencia» y que corre en `index.ts:26`. Eso sigue siendo cierto **de la función**, pero **en el arranque de la App** este requisito y los RQ-ZS-52 a RQ-ZS-55 **SHALL**
prevalecer: la puesta al día de ese arranque no es tolerante. RQ-ZS-10 no se modifica (elección (a) de la cabecera).

Fuente: decision/arranque-bloqueado-por-consola (2), `openspec/config.yaml:6478-6481` (la tolerancia de `migrate.ts` es deliberada); S-1 de `proposal.md`.

#### Scenario: `migrate()` y `reorgToDesk()` siguen omitiendo y continuando
- GIVEN una conexión falsa cuya segunda sentencia falla, y `migrate()` / `reorgToDesk()` llamadas directamente como las llama el worker
- WHEN corren
- THEN registran «sentencia omitida», ejecutan las sentencias siguientes y resuelven sin error

#### Scenario: los ficheros tolerantes no cambian
- GIVEN el árbol del cambio y el commit de partida `97539c73`
- WHEN se diferencian `packages/zoho-sync/src/db/migrate.ts`, `packages/zoho-sync/src/db/schema.sql`, `apps/hub-sync/src/hubSync.ts` y `apps/hub-sync/src/hub-sync.ts`
- THEN la diferencia es vacía

#### Scenario: el worker no recibe el límite
- GIVEN el worker llamando a `migrate(db)` con una conexión falsa
- WHEN corre
- THEN no se envía ningún `lock_timeout` por esa vía

### RQ-ZS-57 · `DEPLOY.md` §26 documenta el arranque estricto y qué hacer si la App no arranca, sin variable nueva

`DEPLOY.md` **SHALL** terminar con una sección `## 26.` con dos apartados: «Qué cambia» y «Qué hacer si la App no arranca tras desplegar». **SHALL** decir qué
cambia en el arranque (límite de espera de bloqueo y fallo que detiene, solo en la App); cómo es la línea del registro (sentencia, error y, si es el límite, su valor y la
expresión «límite de espera»); el valor del límite como constante del código (S-3); que **no** hay interruptor ni variable nueva, y que cambiar el valor pide publicar (S-2); y el
procedimiento: buscar esa línea en el registro de la App; si es un bloqueo, localizar la sesión con `pg_blocking_pids` y cortarla con `pg_terminate_backend` del pid raíz; si es
otra sentencia que falla, volver a la imagen anterior. La sección **SHALL** añadirse al final, sin mover las §21 a §25. Una prueba **SHALL** fijar el contenido
de la sección.

**Precedencia (contradice RQ-ZS-51 en un punto, y lo dice).** RQ-ZS-51 (`openspec/specs/zoho-sync/spec.md:2698`) dice que `DEPLOY.md` «SHALL terminar» con la §25. Eso era cierto el
día que se escribió; desde este cambio la última es la §26, igual que RQ-ZS-47 (`openspec/specs/zoho-sync/spec.md:2551`) dejó de ser la última al llegar la §25. RQ-ZS-51 no se
modifica (elección (a) de la cabecera). La guarda de `apps/desk/server/deployCalificacionesConversaciones.test.ts:24` en `97539c73`, `:67-68` («la §25 es la última») se corrige en sitio con el
molde «es la última hasta la §N» de `apps/desk/server/deployControlCalidad.test.ts:17`, sin desplazar líneas.

Fuente: decision/arranque-bloqueado-por-consola (2), `openspec/config.yaml:6472`; regla de secretos de `CLAUDE.md` (qué enciende y qué se rompe).

#### Scenario: la sección existe, es la última y cubre lo obligatorio — ROJO
- GIVEN `DEPLOY.md` leído por la prueba
- WHEN busca la sección 26
- THEN la encuentra detrás de la §25 y como última, con los dos apartados, `pg_blocking_pids`, `pg_terminate_backend`, el pid raíz, la expresión «límite de espera», el valor del límite y la afirmación de que no hay variable ni interruptor nuevo

#### Scenario: ensuciar el fichero vigilado pone la prueba en rojo
- GIVEN copias de `DEPLOY.md` sin `pg_terminate_backend`, sin el apartado «Qué hacer si la App no arranca tras desplegar», o con una `## 27.` detrás de la §26
- WHEN corre la prueba de la sección 26 sobre cada copia
- THEN se pone roja en las tres

#### Scenario: la guarda de la §25 sigue verde en sitio
- GIVEN `apps/desk/server/deployCalificacionesConversaciones.test.ts` corregido en sitio con «es la última hasta la §26»
- WHEN corre contra el `DEPLOY.md` con la §26
- THEN pasa, y el número de líneas del fichero de prueba no cambia
