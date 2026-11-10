# Diseño — `arranque-migracion-estricta`

Construye RQ-ZS-52 a RQ-ZS-57 (`specs/zoho-sync/spec.md`) con los supuestos S-1 a S-6 de `proposal.md`. Todo lo citado se comprobó en
el worktree sobre `97539c73`; lo que no, lleva «hipótesis». No hay variable de entorno nueva ni se toca `migrate.ts` ni `schema.sql`.

## 1 · Enfoque en una línea

Un módulo nuevo, `packages/zoho-sync/src/db/puestaAlDiaEstricta.ts`, abre **un cliente propio** del pool, le fija `lock_timeout` de
sesión **antes de nada**, **captura** la lista de sentencias de cada paso tolerante (`reorgToDesk`, `migrate`) llamándolo contra un
grabador que no toca la base, la ejecuta **sentencia a sentencia en autocommit** y se para en la primera que falla con un error tipado;
el cliente se **destruye** al terminar (`release(true)`), bien o mal. `index.ts:26-27` cambian en sitio y siguen nombrando
`reorgToDesk` y `migrate`.

## 2 · Decisión 1 — cliente propio con `SET` de sesión, no `SET LOCAL` en una transacción

| Criterio | Cliente propio, autocommit (**elegido**) | `SET LOCAL` en una transacción única |
|---|---|---|
| Semántica de hoy | Igual: cada sentencia se confirma sola, como en `migrate.ts:29-35` | Cambia a todo o nada: un fallo deshace también la reorganización y lo ya aplicado |
| Duración de los bloqueos | Lo que dura cada sentencia | Cada `ALTER` acumula su `ACCESS EXCLUSIVE` hasta el `COMMIT`: la migración entera congela todas las tablas que toca, incluidas las que llegan por replicación (`books.items`, `schema.sql:376`), y frena al suscriptor durante toda la puesta al día |
| `ALTER TABLE … SET SCHEMA` (`migrate.ts:117-118`) | Uno a uno, como hoy | Válido dentro de transacción, pero el traslado de las diez tablas queda retenido hasta el final |
| `CREATE OR REPLACE VIEW` (`schema.sql:169`, `:176`) | Como hoy | Válido; sin diferencia |
| Sentencias que no admiten transacción | Ninguna restricción | Hoy no hay `CONCURRENTLY` (`proposal.md` §2.3), pero una sentencia así en una publicación futura rompería el arranque |
| Estado del cliente tras un error | Sin transacción abierta (autocommit); conserva el `SET` → se destruye | Transacción abortada (`25P02` en lo que siga): exige `ROLLBACK` antes de devolverlo, y el `SET LOCAL` muere con él |
| Límite vigente | Toda la sesión del cliente | Toda la transacción |

**Elección:** cliente propio. Conserva el autocommit por sentencia de hoy, no alarga ningún bloqueo y no cambia la semántica del esquema;
lo único que añade es la obligación de no devolver al pool una conexión con el límite, y se cumple **por construcción**: el cliente se
devuelve siempre con `release(true)`, que en pg-pool destruye la conexión en vez de reciclarla (API documentada de `pg`; la prueba I-4
lo comprueba por `pg_backend_pid()` contra PostgreSQL real). Se descarta `RESET lock_timeout` + `release()`: un `RESET` que falle
dejaría la conexión con el límite, y `RESET ALL` restablecería además lo que no toca. El coste es una conexión nueva, una vez por arranque.

**La hipótesis del brief** —un `SET` enviado por `pool.query` no garantiza que la consulta siguiente vaya por la misma conexión— no se
resuelve razonando: la demuestra la prueba I-3 (§6), y es además la razón por la que el `SET` de sesión, sin destruir el cliente,
**contaminaría** el pool.

## 3 · Decisión 2 — `index.ts:26-27` en sitio, con captura de la lista y sin tocar `:8`

**Texto de las dos líneas** (sangría de dos espacios, final de línea del fichero intacto):

```ts
  const puestaAlDia = await (await import('@ambientalia/zoho-sync/db/puestaAlDiaEstricta')).abrirPuestaAlDiaEstricta(pool); if (config.dbSchema === 'desk') await puestaAlDia.aplicar(reorgToDesk)
  await puestaAlDia.aplicar(migrate).finally(() => puestaAlDia.cerrar())
```

- **`:8` intacta.** `reorgToDesk` y `migrate` se siguen usando —como argumento de `aplicar`—, así que
  `@typescript-eslint/no-unused-vars` (en `error` por `tseslint.configs.recommended`, `eslint.config.js:18-21`, sin relajar en `:29-32`)
  no salta. `reseedTicketNumber` sigue en `:29`, sin tocar.
- **El módulo se importa con `import()` dinámico en `:26`**, dentro de `main`. El especificador usa el mismo patrón que los estáticos
  de `index.ts:7-9`, resuelto por `packages/zoho-sync/package.json:2` (`"./*": "./src/*.ts"`) y por `apps/desk/tsconfig.server.json:4-5`
  (`ESNext` + `Bundler`), así que `tsc -p apps/desk/tsconfig.server.json` lo tipa. `import()` es ES2020, admitido por
  `eslint.config.js:26`. En producción corre con `tsx` (`package.json:16`): que `tsx` resuelva el `import()` igual que los estáticos es
  **hipótesis**, comprobada por la prueba de índice (resuelve el especificador leído de `:26`) y por la evidencia E-3.
- **`:26` sigue siendo «la reorganización» y `:27` «la migración»**: las dos líneas ejecutan su paso, en el mismo orden y con la misma
  condición `config.dbSchema === 'desk'`. Las citas que lo afirman siguen siendo caso A (§9).
- **`modoSinZohoIndice.test.ts:42`** busca UNA línea con `await migrate(pool)` (`:41-42`); ese texto desaparece. Se corrige **en sitio**,
  sólo `:42`: `expect(una('puestaAlDia.aplicar(migrate)')).not.toContain('modoSinZohoDesk')`. El título de `:41` sigue siendo cierto.
- **Cómo se para la secuencia.** `aplicar(paso)` no ejecuta `paso` contra la base: lo llama contra un **grabador** (`Queryable` que
  apunta cada texto y resuelve `{ rows: [] }` sin fallar nunca). Como el grabador no rechaza, la tolerancia de `migrate.ts:30-34` y
  `:128-129` no llega a actuar y **no sale ninguna línea «sentencia omitida»**. Con la lista capturada, el ejecutor estricto la manda por
  el cliente propio una a una; en el primer rechazo deja de iterar y lanza el error tipado: las siguientes **no se envían** a la base.
  Un paso cuyo flujo dependa de lo que lee (p. ej. `reseedTicketNumber`, `migrate.ts:47-48`, que lee `rows[0]`) rompe en la captura y
  `aplicar` rechaza con «paso no capturable» sin enviar nada: falla en las pruebas, no en silencio.
- **Por qué captura y no las otras dos formas.** (a) *Iterar `reorgToDeskStatements()`/`schemaStatements()` eligiendo la lista por
  identidad de la función*: obliga a que `migrate` importado desde `index.ts` sea el mismo objeto que el importado desde el módulo, lo que
  depende de cómo `tsx` resuelva el enlace del espacio de trabajo (**hipótesis**); si fallara, la App no arrancaría por un detalle de
  resolución. (b) *Llamar a `migrate` con un `Queryable` estricto*: `migrate.ts:30-34` captura el rechazo; para que no se envíen las
  siguientes, el envoltorio tendría que rechazar sin tocar la base todas las demás —una línea «omitida» falsa por cada sentencia restante,
  más la de la que falló— o devolver una promesa que no se resuelve nunca y competir con ella, dejando colgado el bucle de `migrate`.
  La captura no tiene ninguno de los dos problemas y ejecuta exactamente lo que enviaría el paso tolerante; la prueba U-3 fija esa
  equivalencia contra las listas puras (`migrate.ts:19-21`, `:114-120`), que es el molde de H5: dos implementaciones de la misma noción,
  enfrentadas por una prueba.

**Ciclo de vida.** `abrir…` hace `pool.connect()` y envía el `SET`; si el `SET` falla, destruye el cliente y rechaza. `aplicar` rechaza
si la sesión está cerrada o si `reorgToDesk` llega después de `migrate` (guarda de orden). Ante cualquier fallo, `aplicar` destruye el
cliente antes de rechazar. `cerrar()` es idempotente. Si `:26` rechaza, `:27` no se ejecuta; si `:27` rechaza, `.finally` cierra (ya
cerrado) y el rechazo sigue hasta `main().catch` (`index.ts:106-109`): `logger.error({ err }, 'Fallo al arrancar el servidor')` y
`process.exit(1)`, sin llegar a `app.listen` (`:57`).

## 4 · Decisión 3 — el módulo, su API y la línea del registro

**Dónde:** `packages/zoho-sync/src/db/puestaAlDiaEstricta.ts`, junto a `migrate.ts`, del que importa sólo el **tipo** `Queryable`
(`migrate.ts:5-7`). Importable sin tocar `packages/zoho-sync/package.json:2`. No va en `apps/desk/server` porque es lógica de la base y
la pareja natural de `migrate.ts`; el worker no lo importa (S-1).

```ts
export const LIMITE_ESPERA_BLOQUEO_MS = 10_000            // S-3; constante, ningún process.env (S-2)
export interface ConexionDedicada { query(texto: string): Promise<unknown>; release(destruir: true): void }
export interface FuenteDeConexiones { connect(): Promise<ConexionDedicada> }   // `Pool` de pg encaja estructuralmente (lo comprueba tsc)
export type PasoTolerante = (db: Queryable) => Promise<void>
export class ErrorPuestaAlDia extends Error { readonly sentencia: string; readonly codigo: string | undefined }
export class ErrorLimiteEspera extends ErrorPuestaAlDia { readonly limiteMs: number }
export interface PuestaAlDiaEstricta { aplicar(paso: PasoTolerante): Promise<void>; cerrar(): void }
export function abrirPuestaAlDiaEstricta(pool: FuenteDeConexiones): Promise<PuestaAlDiaEstricta>
export function recortarSentencia(sql: string): string   // pura, exportada para su prueba
```

- **Sentencia del límite:** `SET lock_timeout = '10000ms'`, construida desde la constante. `SET` no admite parámetros; el valor es una
  constante numérica del módulo, no entrada de nadie.
- **Clasificación:** el error de `pg` lleva el SQLSTATE en `code`. `code === '55P03'` (`lock_not_available`) → `ErrorLimiteEspera`;
  cualquier otro, o sin `code` → `ErrorPuestaAlDia`. Que el límite agotado dé `55P03` es **hipótesis** hasta I-2. En este contexto no hay
  otra fuente de `55P03`: `schema.sql` no contiene `NOWAIT` (búsqueda: 0) y el pool no fija `statement_timeout` (`pool.ts:4-7`), cuyo
  código sería otro.
- **Recorte:** quita las líneas `--` iniciales (los trozos de `schema.sql` arrastran comentarios: `:373` precede a `:374`, y `:376-379` a `:380`), colapsa espacios y
  corta a 160 caracteres con `…`. Los 60 y 50 de `migrate.ts:33` y `:129` cortarían ya la sentencia del incidente (`schema.sql:374`, 69).
- **Texto exacto del `message`** (es lo que pino imprime de `err`):
  - Límite: `Puesta al día de la base detenida: se agotó el límite de espera de bloqueo (lock_timeout 10000 ms) en la sentencia «ALTER TABLE public.catalogo_modelos ADD COLUMN IF NOT EXISTS sku text» [55P03] canceling statement due to lock timeout`
  - Otro: `Puesta al día de la base detenida: falló la sentencia «<recorte>» [<código o «sin código»>] <mensaje original>`
- **Salida:** el módulo no escribe nada: rechaza. El rechazo llega al `main().catch` existente (`index.ts:106-109`), que lo pasa a
  `logger` (pino, `apps/desk/server/util/logger.ts:7-11`), no a `console.error` (S-6). **Hipótesis:** que el serializador `err` de pino
  incluya el `message` y las propiedades propias, que `pino-pretty` escriba a stdout y que la línea se vacíe antes de `process.exit(1)`
  con el transporte en hilo aparte. Las tres las comprueba E-3; si E-3 no ve la línea, rige S-7 de `proposal.md`: el módulo escribe
  además la misma línea por `console.error`, síncrona, antes de lanzar (afectaría también al «Fallo al arrancar el servidor» de hoy).

## 5 · Pruebas unitarias (strict_tdd, rojo previo)

`packages/zoho-sync/src/db/puestaAlDiaEstricta.test.ts`, con una `FuenteDeConexiones` falsa que registra **en un solo arreglo**, por
orden, cada texto recibido y cada `release` con su argumento, y que puede fallar en la sentencia N o en una sentencia dada con un `code`.

| Id | Qué fija | Escenario |
|---|---|---|
| U-1 | **Posición:** `registro[0]` es el `SET`; después, exactamente `[...reorgToDeskStatements(), ...schemaStatements()]`; al final `release(true)` y nada más | RQ-ZS-52.1, RQ-ZS-55.1-2 |
| U-2 | Sin reorganización (sólo `aplicar(migrate)`): `SET` y luego sólo `schemaStatements()` | RQ-ZS-55.3 |
| U-3 | Equivalencia: `migrate(grabador)` y `reorgToDesk(grabador)` envían exactamente las listas puras, en orden (H5) | RQ-ZS-56 |
| U-4 | Corte: falla la 3.ª de la migración con `42P01` → rechaza `ErrorPuestaAlDia`, no `ErrorLimiteEspera`; el registro termina en esa sentencia y `release(true)`; un `aplicar` posterior rechaza sin enviar | RQ-ZS-54.1, RQ-ZS-53.2 |
| U-5 | Falla una de la reorganización → ninguna de `schemaStatements()` se envía | RQ-ZS-54.2 |
| U-6 | `55P03` en `schema.sql:374` → `ErrorLimiteEspera` con «límite de espera», la sentencia entera, `10000` y `codigo === '55P03'` | RQ-ZS-53.1 |
| U-7 | Guarda de orden: `aplicar(migrate)` y luego `aplicar(reorgToDesk)` → rechaza sin enviar la reorganización | RQ-ZS-55 |
| U-8 | Constante: con `LOCK_TIMEOUT`, `LIMITE_ESPERA_BLOQUEO_MS` y `PG_LOCK_TIMEOUT` puestos a otro valor, el `SET` es idéntico; el fuente del módulo no contiene `process.env` y `.env.example` no contiene `lock_timeout` ni `LIMITE_ESPERA` (fichero vigilado) | RQ-ZS-52.2 |
| U-9 | El `SET` falla → `abrir…` rechaza y `release(true)` | RQ-ZS-52.3 |
| U-10 | `aplicar(reseedTicketNumber)` → rechaza «paso no capturable» y no envía nada | §3 |
| U-11 | Lo tolerante sigue igual: `migrate(falso)` con la 2.ª fallando registra «sentencia omitida» (espía de `console.error`), envía todas y resuelve; el falso no recibe `lock_timeout` | RQ-ZS-56.1, .3 |
| U-12 | `recortarSentencia`: quita comentarios iniciales, colapsa espacios, corta a 160 con `…` | RQ-ZS-53 |

**Prueba de índice** — `apps/desk/server/arranqueEstrictoIndice.test.ts`, que lee el texto (molde de `modoSinZohoIndice.test.ts:5-15`:
`index.ts` no se importa porque arranca `main()` al cargarse):
- número de líneas (`split(/\r?\n/).length`) igual al medido en `97539c73` al aplicar; finales homogéneos (o ningún `\r\n`, o todos), para
  que valga en el checkout CRLF de Windows y en el LF del CI (el worktree da 118 líneas con `\r`);
- la línea 8 es idéntica, carácter a carácter, a la de `97539c73`;
- la 26 contiene `abrirPuestaAlDiaEstricta(pool)` antes de `if (config.dbSchema === 'desk')` y éste antes de `aplicar(reorgToDesk)`; la 27
  contiene `aplicar(migrate)` y `cerrar()`; fuera de esas dos, ninguna línea contiene `aplicar(`, y ninguna contiene `migrate(pool)` ni `reorgToDesk(pool)`;
- las dos llevan `await`; `app.listen(` aparece después de la 27; `main().catch` conserva `Fallo al arrancar el servidor` y `process.exit(1)`;
- el especificador del `import()` de la 26 se importa de verdad y exporta `abrirPuestaAlDiaEstricta`.

**Mutaciones que reproduce `sdd-apply`** (cada una se aplica, se corre, se anota el rojo y se restaura byte a byte; editar con `perl`,
no con `sed`, para conservar los CRLF):

| Mutación | Se pone roja |
|---|---|
| M-1 · el `SET` se envía tras la primera sentencia del primer `aplicar` | U-1, U-2 |
| M-2 · `index.ts`: intercambiar el contenido de las líneas 26 y 27 | prueba de índice (y U-7 lo rechazaría en ejecución) |
| M-3 · quitar la guarda de orden del módulo | U-7 |
| M-4 · volver a tolerar: `catch` que sigue con la siguiente | U-4, U-5 |
| M-5 · clasificar por el texto del mensaje, o invertir la comparación con `55P03` | U-6 y, por la clase, U-4 |
| M-6 · quitar el valor del límite del texto | U-6 |
| M-7 · `release()` en lugar de `release(true)` | U-1, U-4, U-9; contra PostgreSQL, I-4 |
| M-8 · leer el límite de `process.env` | U-8 |
| M-9 · `index.ts:27` vuelve a `await migrate(pool)` | prueba de índice |
| M-10 · `DEPLOY.md` sin `pg_terminate_backend` / sin el apartado / con `## 27.` detrás (copias) | prueba de la §26 |

## 6 · Evidencia contra PostgreSQL real — `packages/zoho-sync/src/db/puestaAlDiaEstricta.integration.test.ts`

Molde: `apps/desk/server/db/migracionConcurrente.integration.test.ts:17-21` (se salta sin `TEST_DATABASE_URL`), con base propia
creada y borrada (`:83-98`, `sinSesiones` en `:246-248`), `CREATE SCHEMA IF NOT EXISTS books` (`:89`) y
`options: '-c search_path=desk,public'` (`:88`). **`TEST_DATABASE_URL` no es variable nueva ni va en `.env.example`**: es la convención
de pruebas, definida en el CI (`.github/workflows/ci.yml:45-47`, servicio `postgres:17`, `:11-12`) y leída por las pruebas de
integración (`packages/zoho-sync/src/db/migrate.integration.test.ts:5`); `.env.example` sólo tiene `DATABASE_URL` (`.env.example:10`).
Así que **también corre en el CI**, y las esperas van acotadas (`conPlazo`/`hasta` del molde).

| Id | Caso | Aserción |
|---|---|---|
| I-1 | Base vacía: puesta al día estricta (reorganización + migración) dos veces seguidas | las dos resuelven (idempotencia; mide sobre base vacía la consecuencia (3)) |
| I-2 | Una sesión aparte hace `BEGIN; LOCK TABLE public.catalogo_modelos IN ACCESS EXCLUSIVE MODE` y se queda abierta (reproduce E-268); se lanza la puesta al día | rechaza `ErrorLimiteEspera`, `codigo === '55P03'` (**cierra la hipótesis**), mensaje con «límite de espera», `catalogo_modelos` y `10000`; tiempo transcurrido ≥ 10 s y < 25 s; la sesión se cierra con `ROLLBACK` en `finally` |
| I-3 | Hipótesis del brief: `Pool({ max: 2 })`, `pool.query("SET lock_timeout = '1234ms'")`, luego dos `connect()` simultáneos y `SHOW lock_timeout` en cada uno | uno ve `1234ms` y el otro `0`: el `SET` vive en una conexión, el pool da otra, y la que lo tiene vuelve al pool contaminada |
| I-4 | `Pool({ max: 1 })`, con la fuente envuelta para anotar el `pg_backend_pid()` del cliente de la puesta al día; tras terminar bien y tras I-2 | `SHOW lock_timeout` por el pool da `0`, el pid es otro y el anotado desaparece de `pg_stat_activity` (espera acotada) |

**Corrida manual** contra un contenedor desechable de la imagen local, nunca producción, con un puerto que no choque:
`docker run --rm -d --name ame-pg -p 55432:5432 -e POSTGRES_PASSWORD=postgres postgres:16-alpine`, y
`TEST_DATABASE_URL=postgres://postgres:postgres@localhost:55432/postgres npx vitest run packages/zoho-sync/src/db/puestaAlDiaEstricta.integration.test.ts`;
`docker stop ame-pg` al terminar. Se anota en `apply-progress.md`: versión, tiempos, SQLSTATE y la sentencia exacta que agotó el límite.

**E-3 · el arranque de verdad (fuera de la suite, a mano).** Con el bloqueo de I-2 abierto en el contenedor, desde un directorio de
trabajo fuera del repositorio (para que `dotenv/config`, `index.ts:1`, no lea ningún `.env`) y sólo con variables que ya existen —
`DATABASE_URL` al contenedor, `DB_SCHEMA=desk` y valores de relleno, no secretos, para las cinco `ZOHO_*` que exige
`packages/zoho-sync/src/config.ts:77-81`—: `npx tsx <ruta absoluta>/apps/desk/server/index.ts`. Se espera: salida 1, la línea
«Fallo al arrancar el servidor» con el mensaje de límite en stdout, y ninguna «API en http». Cierra las hipótesis de `import()` con `tsx`
y de pino (§4). Sin bloqueo no se corre: la App arrancaría e intentaría hablar con Zoho.

## 7 · `DEPLOY.md` §26 y las guardas de sección

**§26, al final** (hoy termina en la §25, `DEPLOY.md:1068`, con 1.110 líneas; ninguna línea existente se mueve):

```
## 26. Arranque de la App: límite de espera de bloqueo y fallo que detiene (`decision/arranque-bloqueado-por-consola`)
  párrafo: qué hace y dónde (`puestaAlDiaEstricta.ts`, `index.ts:26-27`); sólo la App: el worker sigue tolerante (S-1);
  **No hay interruptor nuevo** ni variable nueva; el valor es la constante `LIMITE_ESPERA_BLOQUEO_MS`, 10 s por sentencia (S-3), y
  cambiarlo pide publicar (S-2)
### Qué cambia
  antes: una sentencia que falla se omite y la App arranca; una espera de bloqueo no tiene fin. Ahora: la primera que falla, o la
  que agota el límite de espera, detiene el arranque con salida 1 y el servicio no escucha (502)
### Cómo es la línea del registro
  los dos textos de §4 de este diseño, tras «Fallo al arrancar el servidor»
### Qué hacer si la App no arranca tras desplegar
  1. buscar en el log de la App «Puesta al día de la base detenida»
  2. si dice «límite de espera»: en `psql -c` sobre `desk-db`, `pg_stat_activity` con `pg_blocking_pids` para localizar la cadena, y
     `pg_terminate_backend` del pid raíz (la sesión que no espera a nadie); el siguiente reinicio arranca solo
  3. si es otra sentencia: volver a la imagen anterior y pasar la línea al analista
  4. antes de desplegar, P-2: si el log enseña stderr, buscar «sentencia omitida» en arranques recientes
```

**Prueba nueva** `apps/desk/server/deployArranqueEstricto.test.ts`, molde `deployCalificacionesConversaciones.test.ts:17-35`: una función
pura `faltasSeccion26(texto)` que exige la §26 detrás de la §25 y como última sección, los apartados «Qué cambia» y «Qué hacer si la App
no arranca tras desplegar», `pg_blocking_pids`, `pg_terminate_backend`, `pid raíz`, `límite de espera`, `LIMITE_ESPERA_BLOQUEO_MS`, `10 s`,
`No hay interruptor nuevo` y `Fallo al arrancar el servidor`; se aplica al `DEPLOY.md` real y a tres copias ensuciadas (regla de
mutación 2): sin `pg_terminate_backend`, sin el apartado y con `## 27. ` detrás. Cada una da su falta exacta.

**Guarda de la §25, en sitio** (`deployCalificacionesConversaciones.test.ts`), con el molde que ya se usó cuando llegó la §25 —
`deployModoSinZoho.test.ts:24-25` y `:65-66`, «la §24 sola hasta la §25»—, que es el mismo de `deployControlCalidad.test.ts:14`, `:17`:
- `:23` acota la sección hasta la §26: `const seccion = texto.slice(s25, texto.indexOf('## 26. ') > s25 ? texto.indexOf('## 26. ') : undefined)`.
  Hace falta además de `:24`: sin acotar, las cadenas de la §26 (p. ej. «No hay interruptor nuevo») satisfarían las de la §25 y la
  prueba dejaría de discriminar.
- `:24` cambia sólo el texto de la falta: `'la §25 sola hasta la §26'`.
- `:67` título: `discrimina por posición: una §25 que no es la que precede a la §26, o que no existe, tiene falta`.
- `:68`: `expect(faltasSeccion25(deploy.replace('## 26. ', '## 99. Otra\n## 26. '))).toEqual(['la §25 sola hasta la §26'])`.
- `:9` (comentario) pasa de «es la última» a «es la última hasta la §26». El fichero conserva su número de líneas.

`apps/desk/server/reconciliacion/registro.test.ts:218-220` no cambia: lo `fuera-del-plan` no entra en «en curso»
(`apps/desk/server/reconciliacion/comprobaciones.ts:215`). `migrate.test.ts` no se ve afectado: `schema.sql` no se toca.

## 8 · Ficheros

| Fichero | Acción |
|---|---|
| `packages/zoho-sync/src/db/puestaAlDiaEstricta.ts` | Crear (módulo, §4) |
| `packages/zoho-sync/src/db/puestaAlDiaEstricta.test.ts` | Crear (U-1 a U-12) |
| `packages/zoho-sync/src/db/puestaAlDiaEstricta.integration.test.ts` | Crear (I-1 a I-4) |
| `apps/desk/server/arranqueEstrictoIndice.test.ts` | Crear (prueba de índice) |
| `apps/desk/server/deployArranqueEstricto.test.ts` | Crear (§26) |
| `apps/desk/server/index.ts` | Modificar en sitio `:26`, `:27` |
| `apps/desk/server/modoSinZohoIndice.test.ts` | Modificar en sitio `:42` |
| `apps/desk/server/deployCalificacionesConversaciones.test.ts` | Modificar en sitio `:9`, `:23`, `:24`, `:67`, `:68` |
| `DEPLOY.md` | Añadir §26 al final |
| `migrate.ts`, `schema.sql`, `hubSync.ts`, `hub-sync.ts`, `pool.ts`, `.env.example` | Sin cambios (CA-5) |

## 9 · Barrido de citas (regla de mutación 4)

Ningún fichero muy citado inserta, borra ni mueve líneas: `index.ts` cambia el **contenido** de `:26-27`; `DEPLOY.md` sólo crece al
final; las dos pruebas de guarda cambian en sitio. El detector (existencia y línea no vacía) no puede ponerse rojo por esto; lo que sí
puede cambiar es lo que **afirma** la frase. Clasificación de las citas a `apps/desk/server/index.ts:26`, `:27` o `:26-27`:

- **Caso A** —siguen siendo ciertas porque `:26` reorganiza con `DB_SCHEMA=desk`, `:27` migra y las dos van antes de escuchar—:
  `DEPLOY.md:318`; `openspec/specs/zoho-sync/spec.md:355`, `:705`; `docs/sdd/Paquete_de_Despliegue_2026-09-29.md:124`, `:147`;
  `docs/sdd/Paquete_de_Despliegue_2026-09-30.md:142`, `:177`; `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:216`, `:253`;
  `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:256`; `docs/sdd/Paquete_de_Despliegue_2026-10-04.md:327`;
  `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:296`, `:499`, `:613`; `docs/sdd/Paquete_de_Despliegue_2026-10-05.md:106`;
  `docs/sdd/Paquete_de_Despliegue_2026-10-05b.md:149`; `docs/sdd/Paquete_de_Despliegue_2026-10-09.md:255`; y los artefactos de este cambio.
- **Caso B** —lo que dicen de `:26-27` sigue siendo cierto, pero la frase añade la tolerancia en el arranque, cierta en su fecha y falsa
  desde este cambio para la App—: `docs/sdd/Paquete_de_Despliegue_2026-10-09.md:384-386`,
  `docs/sdd/Paquete_de_Despliegue_2026-10-05b.md:244-246` (mismo texto) y `docs/sdd/Paquete_de_Despliegue_2026-10-10b.md:201-203`.
  Son paquetes fechados: no se reescriben; su tolerancia apunta a `migrate.ts`, que no cambia.
- **Fuera del detector:** `openspec/changes/archive/` (excluido). Las de `2026-10-01-prioridad-top5-cliente` y
  `2026-10-01-verificacion-gas-patron-certificado` nombran otro `index.ts`, no este.
- **Segundo pase humano** de la forma abreviada (`:26`, `:27`) en los ficheros que ya citan `index.ts`, y en los que citan
  `modoSinZohoIndice.test.ts:41-42` y `deployCalificacionesConversaciones.test.ts:24`, `:67-68` (este cambio y su spec): las líneas siguen
  existiendo con el mismo papel.

**Seis de Supervisión: se LISTAN, no se editan.** Sólo `docs/sdd/ENTRADA.md` cita `index.ts` (búsqueda en los seis: `CLAUDE.md`,
`openspec/config.yaml`, `docs/sdd/F0-05_*` y `docs/sdd/R08.4_Expediente_de_cambios.md` dan 0):
- `docs/sdd/ENTRADA.md:2425` — `index.ts:27`, «el arranque migra antes de escuchar»: **A**. En la misma frase, «sólo registra las que fallan»
  (`migrate.ts:28-34`) pasa a ser cierto sólo del worker y las pruebas: **B** para el arranque de la App.
- `docs/sdd/ENTRADA.md:2430` — `index.ts:27` y `:57`, «la migración se espera antes de `app.listen`»: **A**. Su «consecuencia que (1) no dice»
  (con un `lock_timeout` el arranque no fallaría, `migrate.ts:28-34`) queda **C**: la cierra este cambio.
- `openspec/config.yaml:6478-6479` (tolerancia deliberada de `migrate.ts`): sigue cierta de la función (S-1). Sin cita a `index.ts`.

## 10 · Matriz de amenazas

No aplica: no hay enrutado, órdenes de shell, subprocesos, automatización de VCS/PR ni clasificación de ejecutables en el código del
cambio. E-3 lanza un proceso a mano, fuera del producto.

## 11 · Despliegue y vuelta atrás

Sin migración de datos, sin columna, sin variable. Lo desplegable es el servidor (`index.ts` y el módulo); el bundle del cliente no
cambia. Vuelta atrás: revertir el commit o redesplegar la imagen anterior (`proposal.md` §10).

## 12 · Riesgos y preguntas abiertas

- **Consecuencia (3)** (`proposal.md` §8): I-1 la mide sobre base vacía, no sobre producción; P-2 sigue siendo de persona.
- **Hipótesis que cierran I-2/I-3/E-3:** `55P03`; el `SET` por `pool.query`; `import()` con `tsx`; que pino vacíe la línea antes de
  `process.exit(1)`. Si E-3 no ve la línea, rige S-7 (`console.error` síncrono en el módulo); `index.ts:106-109` no se cambia.
- **Paso no capturable:** si un día `migrate` pasara a decidir según lo que lee, la captura sólo rechaza cuando rompe con `rows: []`
  (U-10); si no rompiera, lo caza U-3 en cuanto la lista capturada difiera de `schemaStatements()`.
- **Código insertado entre `:26` y `:27`** en el futuro dejaría el cliente abierto si lanzara; el proceso termina igual. Lo vigila la
  prueba de índice (las dos líneas contiguas).
- **I-2 añade ~10 s al CI** (espera real del límite).
- Sin preguntas que bloqueen.
