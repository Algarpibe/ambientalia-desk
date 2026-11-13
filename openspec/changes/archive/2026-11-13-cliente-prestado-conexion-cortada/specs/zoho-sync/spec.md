# Delta para zoho-sync — el cliente prestado por `pool.connect()` escucha su evento `error`: un corte del servidor con una transacción abierta deja una línea y no tumba el proceso (`fuera-del-plan`, `cierra: si`)

Atiende E-290, que nace del aviso W-1 del verify de `pool-conexion-cortada` (`openspec/changes/archive/2026-11-12-pool-conexion-cortada/verify-report.md:147`), con los
hallazgos H-1 a H-4, los criterios CA-1 a CA-10 y los supuestos S-1 a S-8 de `proposal.md`. Numeración comprobada contra `openspec/specs/zoho-sync/spec.md`: el último
requisito vivo es RQ-ZS-62 (`openspec/specs/zoho-sync/spec.md:3013`); los nuevos son RQ-ZS-63 a RQ-ZS-67. Esta spec fija el comportamiento observable; la forma de
poner el oyente, el nombre de los símbolos nuevos y los modos del hijo de la integración (S-8) los elige y prueba el diseño.

**Nota de fusión.** Sólo `## ADDED Requirements`, al **final** de la spec viva: ningún bloque MODIFIED ni REMOVED, ninguna línea viva se mueve.

**Elección (S-6), y por qué.** El límite que fija RQ-ZS-62 (`openspec/specs/zoho-sync/spec.md:3017-3019`: el oyente «no» cubre «un cliente prestado por `pool.connect()`») y la frase
de su escenario (`openspec/specs/zoho-sync/spec.md:3031`) dejan de ser ciertos con este cambio. Se sigue el precedente de la propia spec, que declaró en RQ-ZS-62 su precedencia sobre
RQ-ZS-57 sin modificarlo (`openspec/specs/zoho-sync/spec.md:3021-3022`): la contradicción se declara en RQ-ZS-67 y RQ-ZS-62 no se modifica. Las frases vivas que hoy mencionan
al cliente prestado son exactamente tres, todas de RQ-ZS-62 (`openspec/specs/zoho-sync/spec.md:3018`, `:3031` y `:3034`); no hay otra.

## ADDED Requirements

### RQ-ZS-63 · Un cliente prestado por `pool.connect()` no tumba el proceso si emite `error`

Todo pool que pase por `escucharConexionPerdida` (`packages/zoho-sync/src/db/conexionPerdida.ts:35`) **SHALL** poner, en cada cliente nuevo, un oyente de su evento `error` (desde el
evento `connect` del pool, no en cada sitio que presta el cliente), y **SHALL** llevar la cuenta de los clientes prestados con los eventos `acquire` y `release`. Emitir `error` sobre
un cliente **prestado** **MUST NOT** lanzar ninguna excepción. El oyente **SHALL** registrar **sólo** si el cliente está prestado en ese momento (H-3: un cliente en reposo ya lo
cubre el oyente del pool, y sin filtro saldrían dos líneas) y **sólo la primera vez por cliente** (H-1: un corte con la transacción abierta emite dos errores, el del servidor y
«Connection terminated unexpectedly»); los demás errores de ese cliente se callan. Un corte de varias conexiones prestadas **SHALL** dar una línea por cada una, sin agrupar (S-2).
El cambio **MUST NOT** reintentar, reconectar ni descartar nada por su cuenta: el cliente ya no es consultable, su operación rechaza, quien lo tiene hace su `ROLLBACK` y lo libera, y
el pool lo descarta. **Hipótesis (CA-1):** hoy un `error` sin oyente sobre un cliente prestado lanza; el rojo previo de las pruebas lo comprueba antes de tocar el código.

Fuente: H-1, H-3, S-2 y CA-1 de `proposal.md`; E-290 y W-1 del verify citado arriba. La mecánica de `pg-pool` 3.14.0 (el oyente de reposo se quita al prestar el cliente, línea 344 de su
`index.js`; `connect` sale antes de `acquire`) es lo medido, no un contrato.

#### Scenario: un cliente prestado que emite `error` no lanza y deja una línea — ROJO
- GIVEN un pool de `escucharConexionPerdida` con un registro capturado, y un cliente falso que llega por `connect` y se presta por `acquire`
- WHEN el cliente emite `error`
- THEN no se lanza ninguna excepción y el registro recibe exactamente una línea

#### Scenario: un cliente en reposo no deja línea del oyente de cliente — ROJO
- GIVEN un cliente falso que llegó por `connect` y no se ha prestado
- WHEN emite `error`
- THEN no se lanza ninguna excepción y el registro no recibe ninguna línea del texto nuevo (la del pool, si el pool también emite, es la de E-285)

#### Scenario: un cliente ya liberado no deja línea — ROJO
- GIVEN un cliente falso prestado con `acquire` y devuelto con `release`
- WHEN emite `error`
- THEN no se lanza ninguna excepción y el registro no recibe ninguna línea nueva

#### Scenario: dos errores del mismo cliente prestado dejan una línea — ROJO
- GIVEN un cliente falso prestado
- WHEN emite `error` dos veces seguidas (el segundo con «Connection terminated unexpectedly» y sin código)
- THEN el registro recibe exactamente una línea, la del primero

#### Scenario: dos clientes prestados dejan dos líneas — ROJO
- GIVEN dos clientes falsos distintos, los dos prestados
- WHEN cada uno emite `error` una vez
- THEN el registro recibe exactamente dos líneas

### RQ-ZS-64 · La línea del cliente prestado tiene texto propio y el mismo saneado que la de E-285

La línea que el oyente de RQ-ZS-63 deja en el registro **SHALL** empezar por un texto fijo propio, exportado por el módulo de `packages/zoho-sync/src/db/conexionPerdida.ts` para que lo importen
las pruebas y la `DEPLOY.md` (S-1): «Pool de la base: se perdió la conexión de un cliente prestado; su operación falla y el proceso sigue», seguido de « — », el mensaje del error y, si el
error trae `code` válido, su SQLSTATE entre corchetes. Ese texto **MUST NOT** contener el texto de la línea de E-285 (`packages/zoho-sync/src/db/conexionPerdida.ts:3`), de modo que
una prueba que cuente las líneas de una clase no cuente las de la otra. El saneado **SHALL** ser el de E-285: sólo `message` y `code`; las URL del mensaje sustituidas; nunca el objeto
de error ni `err.client` ni la cadena de conexión, el usuario, la contraseña o el host. La línea **SHALL** salir por el `registrar` de `escucharConexionPerdida`, por defecto stderr
(S-3); un `registrar` que lance **MUST NOT** propagar la excepción al emit.

Fuente: S-1 y S-3 de `proposal.md`; regla de secretos de `CLAUDE.md`; E-290.

#### Scenario: el texto es el propio y no contiene el de E-285 — ROJO
- GIVEN el texto fijo del cliente prestado exportado por el código
- WHEN se compara con `TEXTO_CONEXION_PERDIDA`
- THEN ninguno contiene al otro, y la línea de un error con `code` `57P01` contiene el texto nuevo, el mensaje y `[57P01]`

#### Scenario: sin `code` no hay corchetes — ROJO
- GIVEN un error «Connection terminated unexpectedly» sin `code`
- WHEN el cliente prestado lo emite
- THEN la línea lleva el mensaje y no lleva ningún SQLSTATE

#### Scenario: ningún secreto llega a la línea — mutación 2 — ROJO
- GIVEN un error cuyo mensaje trae una URL con una contraseña-testigo y cuyo `client` lleva otra
- WHEN un cliente prestado lo emite
- THEN la línea no contiene ninguna de las dos contraseñas ni la cadena de conexión, y una versión mutada que vuelque el objeto de error hace fallar la prueba

#### Scenario: un registro que lanza no tumba el proceso — ROJO
- GIVEN un `registrar` que lanza
- WHEN un cliente prestado emite `error`
- THEN no se lanza ninguna excepción

### RQ-ZS-65 · Contra PostgreSQL real, cortar un cliente prestado deja una línea, la operación falla y el proceso sigue

Contra PostgreSQL real, en un proceso hijo (el molde de `packages/zoho-sync/src/db/conexionPerdida.integration.test.ts`), cortar con `pg_terminate_backend` un cliente prestado con
una transacción abierta **SHALL** dejar el proceso vivo con salida 0, **SHALL NOT** dejar «Unhandled 'error' event» en su stderr y **SHALL** dejar exactamente **una** línea del texto de
RQ-ZS-64 con `57P01` y **ninguna** del texto de E-285. La siguiente consulta del cliente y su `ROLLBACK` **SHALL** rechazar; tras liberarlo, el pool **SHALL** quedar en 0 clientes y su
siguiente consulta **SHALL** resolver con otro pid. La prueba I-4 (`packages/zoho-sync/src/db/conexionPerdida.integration.test.ts:179`) **SHALL** reescribirse en sitio, de «el proceso
MUERE» a «el proceso sigue», con el mismo número de líneas (S-7, CA-2). Un caso nuevo (H-2, CA-3), con una consulta en curso dentro de la transacción, **SHALL** dar: la consulta
rechaza con `57P01`, el `ROLLBACK` rechaza, una sola línea del texto nuevo y el proceso sigue; **hipótesis:** esa línea lleva «Connection terminated unexpectedly» y ningún código, y se fija lo observado. Un caso con
un pool de `createPoolFromUrl` (el molde de `apps/hub-sync/src/hub-sync.ts:53-55`, CA-4) **SHALL** repetir el de I-4 si el arnés lo permite; si no, el informe dice por qué. Sin regresión
(CA-5): I-1 e I-2 siguen dejando exactamente una línea de E-285 y ninguna del texto nuevo; I-3, ninguna de las dos. Antes de cortar, cada caso **SHALL** comprobar el estado del backend
(`idle in transaction` o `active`, la espera acotada de `packages/zoho-sync/src/db/conexionPerdida.integration.test.ts:155`) y que `pg_terminate_backend` devolvió `true` (`:156`). Sin
`TEST_DATABASE_URL`, la integración se salta y la suite no falla (en el CI corre: `.github/workflows/ci.yml:47`). El hijo
(`packages/zoho-sync/src/db/testing/hijoConexionCortada.ts:51-54` en `4d7aad75`, cuyo modo `prestado` no liberaba el cliente) gana los modos que hagan falta, en sitio o al final (S-8).

Fuente: H-1, H-2, H-4, CA-2 a CA-5, S-5, S-7 y S-8 de `proposal.md`; E-290.

#### Scenario: I-4 reescrita, cliente prestado en reposo con `BEGIN` — ROJO
- GIVEN un hijo con un cliente prestado con `BEGIN`, en `idle in transaction`, cortado con `pg_terminate_backend` (`true`)
- WHEN el hijo continúa
- THEN sale con 0, su stderr no contiene «Unhandled 'error' event», contiene una sola línea del texto nuevo con `57P01` y ninguna de E-285; la siguiente consulta y el `ROLLBACK` rechazan; tras liberar, el total del pool es 0 y su siguiente consulta resuelve con otro pid

#### Scenario: H-2, consulta en curso dentro de la transacción — ROJO
- GIVEN un cliente prestado con `BEGIN` y una consulta larga en estado `active`, cortado con `pg_terminate_backend` (`true`)
- WHEN el corte llega
- THEN la consulta rechaza con `57P01`, el `ROLLBACK` rechaza, el proceso sale con 0 sin «Unhandled 'error' event» y deja una sola línea del texto nuevo

#### Scenario: el worker, con `createPoolFromUrl` — ROJO
- GIVEN un pool de `createPoolFromUrl` y el caso de I-4 sobre él
- WHEN se corta el cliente prestado
- THEN el resultado es el de I-4; si el arnés no lo permite, el informe del apply dice por qué

#### Scenario: sin regresión en I-1, I-2 e I-3
- GIVEN I-1 e I-2 (conexión en reposo) e I-3 (consulta en curso por `pool.query()`)
- WHEN corren contra el árbol del cambio
- THEN I-1 e I-2 dejan exactamente una línea de E-285 y ninguna del texto nuevo, e I-3 no deja ninguna de las dos

#### Scenario: verde falso evitado
- GIVEN cualquiera de los casos de este requisito
- WHEN el backend no llega al estado esperado o `pg_terminate_backend` no devuelve `true`
- THEN la prueba falla en vez de pasar sin haber cortado

### RQ-ZS-66 · Cambio en sitio, sin variable de entorno, y las mutaciones del oyente lo delatan

`packages/zoho-sync/src/db/pool.ts` y los seis sitios que toman un cliente prestado (`apps/desk/server/db/transaccion.ts:16`, `apps/desk/server/db/eliminarTicket.ts:178`,
`packages/zoho-sync/src/db/repo.ts:336` y `:440`, `packages/zoho-sync/src/db/puestaAlDiaEstricta.ts:80`, `apps/hub-sync/src/hub-sync.ts:55`) **SHALL** quedar sin cambios (CA-7); si el diseño exige tocar
alguno, sólo líneas cambiadas en sitio y declaradas, sin insertar ni mover ninguna. En `packages/zoho-sync/src/db/conexionPerdida.ts` **SHALL** haber sólo cambios en sitio y lo nuevo al
final del fichero; las pruebas existentes de `pool.ts` (RQ-ZS-61) **SHALL** seguir en verde. El cambio **MUST NOT** añadir variable de entorno ni interruptor y **MUST NOT** tocar
`.env.example`, `schema.sql` ni `migrate.ts` (S-4, CA-9). **Mutación (CA-6):** sin el oyente nuevo, los escenarios de RQ-ZS-63 y RQ-ZS-65 se ponen rojos; sin el filtro de prestado, I-1 e I-2 dan dos
líneas y se ponen rojas; sin la deduplicación, I-4 da dos líneas y se pone roja; tras cada mutación, restauración byte a byte (`git diff` vacío sobre lo mutado).

Fuente: CA-6, CA-7, CA-9 y S-4 de `proposal.md`; regla de mutación 4 de `CLAUDE.md`; E-290.

#### Scenario: los siete ficheros no cambian
- GIVEN el árbol del cambio y `4d7aad75`
- WHEN se compara `git diff` sobre `pool.ts` y los seis sitios
- THEN está vacío, o sus cambios son sólo líneas modificadas en sitio y declaradas

#### Scenario: `conexionPerdida.ts` conserva sus líneas citadas
- GIVEN `packages/zoho-sync/src/db/conexionPerdida.ts` en `4d7aad75` y en el árbol del cambio
- WHEN se comparan
- THEN las líneas anteriores a la última de `4d7aad75` sólo difieren en sitio, y lo nuevo está después de ella

#### Scenario: sin variable ni interruptor
- GIVEN `.env.example`, `schema.sql` y `migrate.ts` en `4d7aad75` y en el árbol del cambio
- WHEN se comparan
- THEN no difieren, y el comportamiento de RQ-ZS-63 no depende de ninguna variable de entorno

#### Scenario: quitar el oyente, el filtro o la deduplicación pone rojas las pruebas
- GIVEN tres mutaciones del código, una por cada pieza
- WHEN corren las pruebas de RQ-ZS-63 y RQ-ZS-65 y I-1 e I-2
- THEN la primera pone rojas las de RQ-ZS-63 y RQ-ZS-65, la segunda I-1 e I-2 (dos líneas) y la tercera I-4 (dos líneas); tras restaurar, `git diff` vacío y todo en verde

### RQ-ZS-67 · `DEPLOY.md` §27 corregida en sitio: el cliente prestado queda cubierto y la precaución de la §26 se conserva con su razón corregida

La sección `## 27.` de `DEPLOY.md` (`DEPLOY.md:1150`) **SHALL** corregirse en sitio, sin insertar ni mover líneas de `DEPLOY.md` salvo al final del fichero. El apartado «Lo que no cubre»
(`DEPLOY.md:1179-1183`) **SHALL** dejar de decir que el cliente prestado con transacción abierta «sigue muriendo» (`DEPLOY.md:1182-1183`) y **SHALL** decir que ese caso queda cubierto:
el proceso sigue, sale **una** línea con el texto de RQ-ZS-64 (importado del código, no copiado) y **su operación falla** (el usuario recibe el error de base de siempre, **hipótesis** para
las rutas de la App). Una consulta en curso por `pool.query()` sigue sin línea (H-4). La precaución de la §26 (`DEPLOY.md:1185-1186`: cortar sólo el pid raíz de la consola, no un
pid de la App con transacción abierta) **SHALL CONSERVARSE**, con su razón corregida: ya no es que el proceso muera, sino que la operación de un usuario falla y su transacción no se confirma.
La §26 no se retira en este cambio; retirarla es una decisión de persona fuera de alcance.

**Precedencia (deja sin efecto un límite de RQ-ZS-62, y lo dice).** RQ-ZS-62 (`openspec/specs/zoho-sync/spec.md:3017-3019`) fija como **límite** que el oyente «no» cubre un cliente prestado por
`pool.connect()` y que, por eso, la precaución de la §26 «sigue vigente». Desde este cambio ese límite deja de ser cierto en lo que toca al cliente prestado: el cliente prestado está
cubierto, y la precaución de la §26 sigue vigente por otra razón. RQ-ZS-62 no se modifica (elección de la cabecera); en lo demás —línea de E-285, ráfaga de reposo, ausencia de variable, §27
como última— sigue en vigor.

La guarda `apps/desk/server/deployPoolConexionCortada.test.ts` **SHALL** ampliarse (en sitio o al final) para exigir en la §27 el texto fijo del cliente prestado importado de
`conexionPerdida` (como hace con el de E-285, `apps/desk/server/deployPoolConexionCortada.test.ts:18-20`), la conservación de la precaución de la §26 y la ausencia de la frase «sigue muriendo».

Fuente: S-6 de `proposal.md`, §7 y CA-8; `DEPLOY.md:1182-1186` en `4d7aad75`; E-290 y W-1 del verify citado arriba.

#### Scenario: la §27 declara el cliente prestado cubierto — ROJO
- GIVEN `DEPLOY.md` corregido y la guarda ampliada
- WHEN la guarda lee la §27
- THEN encuentra el texto fijo de RQ-ZS-64 importado del código, la mención de que la operación falla, la precaución de la §26 conservada y ninguna frase «sigue muriendo»

#### Scenario: ensuciar el fichero vigilado pone la guarda en rojo — mutación 2
- GIVEN copias de `DEPLOY.md` con la frase «sigue muriendo» devuelta a la §27, sin el texto fijo del cliente prestado, o sin la mención de la precaución de la §26
- WHEN corre la comprobación de la §27 sobre cada copia
- THEN se pone roja en las tres, y sigue roja ante una `## 28.` detrás de la §27 (comportamiento de RQ-ZS-62)

#### Scenario: `DEPLOY.md` no mueve líneas
- GIVEN `DEPLOY.md` en `4d7aad75` y en el árbol del cambio
- WHEN se compara
- THEN las líneas anteriores a la §27 son idénticas y las de la §27 sólo cambian en sitio o se añaden al final del fichero
