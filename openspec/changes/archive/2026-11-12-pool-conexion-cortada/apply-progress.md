# Progreso de aplicación — `pool-conexion-cortada` (E-285)

## Lote L1 (intento i3) — HECHO salvo L1.1 y L1.9 (los corre el orquestador)

Modo: strict TDD. Partida de la medida: `a98a113d`. Worktree propio. `node_modules` no se cita por ruta.

### Casillas
- [ ] L1.1 M0 (`npm test` entero en la partida): no lo corrió este lote; lo corre el orquestador.
- [x] L1.2 a L1.8 hechas (ver abajo). [ ] L1.9: cierre y commit, del orquestador.

### Red de seguridad
`npx vitest run packages/zoho-sync/src/db/pool.test.ts` antes de tocar nada: 2/2 en verde.

### Rojos anotados (fichero › prueba › aserción)
1. U-1 (con sólo `./pool` importado; rojo por la razón correcta, «lanza», no «módulo inexistente»), 3 pruebas:
   `packages/zoho-sync/src/db/conexionPerdida.test.ts › U-1 … › createPool desk | createPool public | createPoolFromUrl: un oyente de error y emit('error') no lanza › expected [Function] to not throw an error but 'Error: x' was thrown`.
   Primer intento de la prueba (con `listenerCount` antes de `emit`): rojo `expected +0 to be 1`; se invirtió el orden de las dos aserciones para que el rojo fuera el de «lanza» que pide `tasks.md`.
2. Resto, con el esqueleto de `conexionPerdida.ts` sin lógica (16 rojas de 19 en total):
   - U-2, U-3 (dos), U-4, U-5, U-8: `pool.emit('error', …)` sobre un `EventEmitter` sin oyente lanza el propio error (`Connection terminated unexpectedly`, `terminating connection due to administrator command`, `m`, `uno`; U-8: `expected [Function] to not throw … 'Error: x' was thrown`). Rojo por «lanza», no por aserción de contenido: el esqueleto no engancha ningún oyente.
   - U-6: `expected '' to contain '<url omitida>'`.
   - U-7 (cinco entradas): `expected '' to be 'Pool de la base: se perdió una conexi…'`.
   - U-10 › sólo la 1 importa el módulo y sólo la 6 y la 10 envuelven el new Pool: `expected 'import { Pool } from 'pg'' to contain 'from './conexionPerdida''`.
   - U-9 y las dos primeras de U-10 nacen verdes (caracterizan lo que `pool.ts` ya cumple en `96cba5ab`: límites por defecto, 11 líneas, literales); U-9 no es trivial: afirma `max` igual a 10 y la igualdad con un `new Pool` de referencia.
3. Tras el módulo (L1.4): quedan rojas sólo U-1 (3) y U-10 (la tercera): 15 verdes de 19.
4. Tras `pool.ts` (L1.5): 19/19 y `pool.test.ts` 2/2 = 21 en verde.

### Evidencia de `pool.ts` (L1.5)
`git diff --numstat -- packages/zoho-sync/src/db/pool.ts` = `3	3`; `wc -l` = 11; `file` = CRLF (igual que la partida). Sólo las líneas 1, 6 y 10, con el texto de `design.md` §4.

### Mutaciones (protocolo: `git add` antes; `perl -i -pe '… if $. == N'`; restauración con `git checkout --` desde el índice, `git diff --quiet` = 0 y `file` CRLF tras cada una)
Líneas de `packages/zoho-sync/src/db/conexionPerdida.ts` medidas en el momento: 43 (`pool.on`), 15 (mensaje), 38 (`registrar`), 39 (`catch`), 10 (sustitución de URL); `packages/zoho-sync/src/db/pool.ts:10`.
| Mutación | Cambio | Se puso rojo |
|---|---|---|
| M-1 | `// pool.on('error', oyente)` (`:43`) | 9: U-1 (las tres), U-2, U-3 (dos), U-4, U-5, U-8. U-8 también: sin oyente no hay registrar al que llamar. Lo previsto (U-1 a U-5) y U-8 de más |
| M-2 | `pool.ts:10` vuelve a `return new Pool({ connectionString })` | 2: sólo el caso `createPoolFromUrl` de U-1 y la tercera de U-10 |
| M-3 | mensaje pasa a `JSON.stringify(err)` (`:15`) | 7: U-2, U-3 (dos), U-4, U-5, U-6, U-7 (getter). Incluye U-4, que es la prevista; las demás caen porque `JSON.stringify` de un `Error` da `{…}` sin `message` |
| M-4 | `console.error(lineaConexionPerdida(err), err)` en vez de `registrar(…)` (`:38`) | 3: U-2, U-4 (dos argumentos) y U-8 (el registrar inyectado nunca se llama) |
| M-5 | `} catch {` pasa a `} catch (e) { throw e` (`:39`) | 1: U-8 |
| M-6 | se quita el `.replace` de URL (`:10`) | 1: U-6 |
Ninguna mutación quedó sin rojo: no hubo hallazgo de prueba floja.

### Verificaciones
- Focal: `conexionPerdida.test.ts` + `pool.test.ts`: 2 ficheros, 21/21 en verde.
- `npm run typecheck`: salida 0 (el genérico sobre `EventEmitter` lo acepta `tsc` sin aserciones: hipótesis del diseño cerrada).
- `npm run lint -- --max-warnings 165`: salida 0, **165 avisos contra 165**; ninguno en los ficheros del lote.
- L1.8: `git diff --name-only` sin nada bajo `apps/desk/src`; `git diff --quiet a98a113d -- packages/zoho-sync/src/db/migrate.ts packages/zoho-sync/src/db/schema.sql .env.example` = 0.
- Ficheros nuevos convertidos a CRLF con `perl` y comprobados con `file`.

### Desvíos del diseño (con su porqué)
1. U-2 a U-5 enganchan `escucharConexionPerdida(new EventEmitter())` con el `console.error` por defecto espiado, en vez de `createPool`: así M-2 queda acotado a `createPoolFromUrl` (U-1 y U-10), como pide `design.md` §7. El cableado de `createPool` lo cubre U-1.
2. M-5: no se puede «quitar el `try`» con un cambio de una línea sin romper la sintaxis; se muta el `catch` para que relance (mismo efecto: el registrar que lanza sale por el `emit`).
3. Los rojos de U-2 a U-5 y U-8 con el esqueleto son «lanza» y no de contenido (el esqueleto no tiene oyente); los de contenido se ven en las mutaciones M-3, M-4 y M-6.
4. El módulo separa `sanear`, `mensajeDe` y `codigoDe` como funciones privadas (comportamiento de §3 intacto); el oyente es una constante y `pool.on('error', oyente)` queda en su propia línea (M-1).
5. U-9 compara con un `new Pool` de referencia las cinco claves de `options`; no se pudo observar un rojo previo porque describe lo que ya es cierto (caracterización declarada arriba).

### Medida del intento (i3)
Ver línea final, anotada con todo en el índice.

`git diff --cached --shortstat --no-renames a98a113d` con todo en el índice: 5 ficheros, 324 inserciones y 10 borrados (334 líneas; incluye este fichero y las casillas de `tasks.md`). Sin ficheros nuevos sin trackear fuera del índice (`wc -l` = 0), sin binarios. Muy por debajo de 800.

### Cierre del lote (orquestador)
- **M0 (L1.1):** `npm test` entero en la partida `a98a113d`, la misma del intento i2: salida 0, 376 ficheros y 6.462 pruebas en verde (30 omitidas), 283 s, 5.854 MB libres al arrancar.
- **Las cinco comprobaciones (L1.9)** corren sobre el commit de este lote; su resultado queda en el `settle` del intento i3 y al principio del bloque de L2 de este fichero.

## Lote L2 (intento i4) — HECHO (L2.9, cierre y commit, del orquestador)

**Cierre de L1 (orquestador) sobre el commit `cb278436`:** typecheck 0, lint 0 (165 avisos contra 165), detector de citas 0 (8.751 comprobadas), `npm test` 0 (6.481 pruebas en verde, 30 omitidas, 305 s, 4.298 MB libres al arrancar), build 0 (`index-F1jDYjEU.js`); medida 330 + 12 = 342, igual a lo registrado.

Modo: strict TDD. Partida de la medida: `cb278436`. Worktree propio. Registro: el orquestador abrió el intento i4 (no hubo `acquire` ni `settle` en este lote).

### Contenedor (L2.1, L2.8)
- Imagen local `postgres:17-alpine`, nombre `pcc-pg`. **Desvío de puerto:** el `55433` lo ocupaba `salestracker-postgres-e2e` (otro proyecto, `127.0.0.1:55433->5432`, 8 h arriba); no se tocó. Se usó `-p 55434:5432`, el resto del comando idéntico; `TEST_DATABASE_URL=postgres://postgres:postgres@localhost:55434/postgres`.
- `SHOW server_version` = **17.10** (en contenedor, y mismo mayor que el servicio `postgres:17` del CI).
- `docker stop pcc-pg` (el `--rm` lo borra); `docker ps -a` sin `pcc-pg`. Nunca producción ni otra base: cada ejecución creó `pcc_it_<pid>_<ts>` y la borró con `WITH (FORCE)`.

### Medido (hecho, no hipótesis)
| Dato | Valor |
|---|---|
| SQLSTATE de la línea (I-1, I-2) | **`57P01`** (la hipótesis acertó) |
| Líneas por corte (I-1, I-2) | **exactamente 1**, `Pool de la base: se perdió una conexión inactiva; el proceso sigue — terminating connection due to administrator command [57P01]` |
| Salida del hijo en I-1 e I-2 | 0; pid nuevo tras el corte (p. ej. 96 → 99 en la prueba manual; 112 → 113 en I-3) |
| `application_name` del pool (I-1) | vacío (`''`) |
| `application_name` de `psql` (E-1) | **`psql`** (hipótesis confirmada): la consola se distingue de la App porque la App llega con nombre vacío |
| I-3 (consulta en curso, estado `active`) | la consulta RECHAZA con `57P01` («terminating connection due to administrator command»); el proceso SIGUE (salida 0, vuelve a servir con pid nuevo); **0 líneas** y stderr vacío: el error llega a la consulta, no al evento `error` del pool |
| I-4 (cliente prestado + `BEGIN`, estado `idle in transaction`) | **EL PROCESO MUERE**: salida **1**, `Unhandled 'error' event` sobre `Client`, `code: '57P01'`; **0 líneas** del texto fijo; el hijo no llega a `baja` ni `despues` |

**I-4 cambia la §27 y la respuesta del §7 de la propuesta:** el oyente del pool NO cubre un cliente prestado (`pool.connect()` sin liberar, el caso de `apps/desk/server/db/transaccion.ts:16-26` y del pid raíz de la §26 de `DEPLOY.md`): si el servidor corta esa conexión con la transacción abierta, el proceso sigue muriendo. La §27 debe decir el límite tal cual, y la protección de ese caso (oyente por cliente prestado) queda fuera de este cambio. I-3 no depende del oyente (verde también con M-1).

### Tiempos (anti falso verde)
- I-1: 1.246-1.456 s por prueba; I-2: 1.057-1.456 s; I-3: ~1.1-1.4 s; I-4: ~1.1-1.2 s. Fichero entero 4 pruebas: 5,6 s de pruebas (8,2 s con arranque). Plazo por `it`: 60 s.
- Desde «listo» al corte < 8 s en todas (la ventana real es ~1 s); estado `idle` antes del corte; `pg_terminate_backend` = `true` (aserto) en las cuatro.
- E-1: `docker exec pcc-pg psql -U postgres -c "SELECT application_name FROM pg_stat_activity WHERE pid = pg_backend_pid()"` → `psql`.

### Rojo y verde (fichero › prueba › aserción)
- Rojo (M-1: `// pool.on('error', oyente)` en `packages/zoho-sync/src/db/conexionPerdida.ts:43`, con el contenedor): `packages/zoho-sync/src/db/conexionPerdida.integration.test.ts › I-1 · createPool (desk) … › expect(codigo).toBe(0)` → `expected 1 to be +0`; igual `› I-2 · createPoolFromUrl › expect(codigo).toBe(0)`. El hijo muere con salida 1 por un `error` sin oyente: rojo por aserción, no por conexión.
- Verde con el oyente restaurado: I-1 e I-2 pasan a la primera, con la línea exacta aceptada (SQLSTATE y texto íntegro).
- I-3 e I-4 no tienen rojo previo (caracterización D-7, medida primero con una prueba de medición que se sustituyó por los asertos fijados). Triangulación: dos modos de reposo (`desk` y URL), uno con consulta en curso y uno con cliente prestado: cuatro caminos distintos del hijo.
- Sin `TEST_DATABASE_URL`: 4 omitidas, no rojas (`conexionPerdida.integration.test.ts`: «4 skipped»), junto a `conexionPerdida.test.ts` y `pool.test.ts`: 2 ficheros en verde (21), 1 omitido. Con la variable: 3 ficheros, 25/25 en verde.

### Mutaciones sobre la integración (protocolo: `git add` antes; `perl -i -pe '… if $. == N'`; `git checkout --`; `git diff --quiet` = 0; `file` CRLF tras cada una)
| Mutación | Cambio | Se puso rojo |
|---|---|---|
| M-1 | `// pool.on('error', oyente)` (`conexionPerdida.ts:43`) | I-1 e I-2 (`expected 1 to be +0`, el hijo muere con salida 1). **I-3 sigue verde** (no depende del oyente: la consulta en curso recibe el error y el proceso sigue) e I-4 sigue verde (muere con o sin oyente) |
| M-2 | `pool.ts:10` vuelve a `return new Pool({ connectionString })` | sólo I-2 (`expected 1 to be +0`); I-1, I-3 e I-4 verdes: el cableado es por función |
Ninguna mutación quedó sin rojo; M-2 acotada a `createPoolFromUrl`, como pide el diseño.

### Verificaciones
- Focal con contenedor: 3 ficheros, 25/25 en verde. `npm run typecheck`: salida 0. `npm run lint -- --max-warnings 165`: salida 0, **165 avisos contra 165**; sin `eslint-disable`.
- Ficheros nuevos en CRLF (`file`): hijo e integración. `testing/hijoConexionCortada.ts` no es `.test.ts` (vitest no lo ejecuta, `vitest.config.ts:17-20`) y `tsc -b` lo tipa.
- Sólo ficheros de L2 (`design.md` §9): ni `openspec/config.yaml`, ni `docs/sdd/ENTRADA.md`, ni `.env.example`, `schema.sql`, `migrate.ts`.

### Desvíos del diseño (con su porqué)
1. **Puerto 55434 en vez de 55433:** el 55433 estaba ocupado por un contenedor ajeno; no se paró.
2. El hijo emite además un paso `baja` (`total` del pool tras el corte) y el `app` en «listo»: no rompe el protocolo de §6, sólo añade información.
3. El cierre `rl.on('close')` del hijo sólo sale con 3 si no llegó «cortado» (la primera versión salía con 3 aunque «cortado» y el cierre llegaran juntos; se vio en la prueba manual).
4. La base propia por ejecución se crea con `CREATE DATABASE` aunque el pool no migra nada: así el aislamiento es el mismo que el de `puestaAlDiaEstricta.integration.test.ts`.
5. I-3: el esperado fija «0 líneas» (el diseño dejaba 0 o 1); lo observado es 0.

### Medida del intento (i4)
Ver línea final, anotada con todo en el índice.

`git diff --cached --shortstat --no-renames cb278436` con todo en el índice antes de la nota del orquestador: 4 ficheros, 330 inserciones y 8 borrados (338 líneas; la medida final está en la nota de abajo; incluye este fichero y las casillas de `tasks.md`). Sin ficheros nuevos fuera del índice (`wc -l` = 0), sin binarios. Muy por debajo de 800.

### Nota del orquestador (L2)
- **Reproducción independiente** en un contenedor propio (`pcc-pg-v`, `postgres:17-alpine`, puerto 55435, `SHOW server_version` = 17.10): I-1 a I-4 en verde, 4 de 4. M-1 (comentar `pool.on` en `packages/zoho-sync/src/db/conexionPerdida.ts:43`): 11 rojas, entre ellas U-1 e I-1 e I-2 con «expected 1 to be +0»; I-3 e I-4 siguen verdes. Restaurado con `git checkout --`: mismo sha256, `git diff --quiet` 0 y CRLF. Contenedor retirado.
- **Medida final al commit:** `git diff --shortstat --no-renames cb278436` = 337 + 9 = 346 líneas, sin nada sin trackear. Las cinco comprobaciones (L2.9) quedan en el `settle` del intento i4 y al principio del bloque de L3.

## Lote L3 (intento i5) — HECHO (L3.9, cierre y commit, del orquestador)

**Cierre de L2 (orquestador) sobre el commit `bf4dc0a6`:** typecheck 0, lint 0 (165 avisos contra 165), detector de citas 0 (8.759 comprobadas), `npm test` 0 (6.481 pruebas en verde, 34 omitidas —las 4 de integración sin `TEST_DATABASE_URL`—, 293 s, 3.793 MB libres), build 0 (`index-F1jDYjEU.js`); medida 337 + 9 = 346, igual a lo registrado.

Modo: strict TDD. Partida de la medida: `bf4dc0a6`. Worktree propio. Registro: el orquestador abrió el intento i5 (token `sha256:f2eb27a0…`); no hubo `acquire` ni `settle` en este lote.

### Rojos anotados (fichero › prueba › aserción)
1. Primero la prueba, sin §27: `apps/desk/server/deployPoolConexionCortada.test.ts` (5 pruebas, 5 rojas):
   - `el DEPLOY.md real no tiene faltas › expected -1 to be greater than 86145` (no hay `## 27. `);
   - las tres pruebas de mutación sobre copias (`salvo que se repita`, `pool.connect()`, texto fijo) caen en su primera aserción, `expected '# Despliegue en EasyPanel (VPS)…' not to be …`: sin §27 la copia no cambia (no hay nada que mutar);
   - `discrimina por posición › expected [ 'la sección ## 27. ' ] to deeply equal [ 'la §27 como última sección' ]`.
2. Tras escribir la §27 en `DEPLOY.md`, el rojo que la §27 causa en la guarda de la §26, MEDIDO antes de corregirla: `apps/desk/server/deployArranqueEstricto.test.ts`, 3 rojas de 4:
   `el DEPLOY.md real no tiene faltas › expected [ 'la §26 como última sección' ] to deeply equal []`; `sin pg_terminate_backend… › expected [ 'la §26 como última sección', …(1) ] to deeply equal [ 'pg_terminate_backend' ]`; `sin el apartado «Qué hacer si la App no arranca tras desplegar»… › expected [ 'la §26 como última sección', …(1) ] to deeply equal [ Array(1) ]`. La cuarta (`discrimina por posición`) queda verde porque ya añade una sección detrás.
3. Verde: `deployPoolConexionCortada.test.ts` 5/5 con la §27; tras corregir la guarda, `deployArranqueEstricto.test.ts` 4/4.

### Casillas
- [x] L3.1 a L3.8 hechas (abajo). [ ] L3.9: cierre y commit, del orquestador.

### `DEPLOY.md` §27 (L3.2)
`git diff --numstat -- DEPLOY.md` = `38 0` (38 líneas añadidas al final, ninguna borrada ni movida; `## 27.` en `DEPLOY.md:1150`, el fichero pasa de 1.148 a 1.186); CRLF conservados (`file`). Dice: párrafo (los dos pools de `pool.ts` escuchan `error`; App, worker `hub-sync` y relleno de artículos; **No hay interruptor nuevo**, ni variable, ni línea para `.env.example`); «### Cómo es la línea del registro» (stderr, una por conexión, la línea medida en I-1 con `57P01` y PostgreSQL 17.10, dicho que es contenedor local y no producción); «### Qué hacer» (nada, salvo que se repita; ráfaga tras un reinicio de `desk-db`; si se repite sin reinicio ni corte, al analista; comprobación opcional de persona de que EasyPanel muestra stderr, que cierra también la P-2 de la §26); «### Lo que no cubre» (I-3: consulta en curso, falla con `57P01`, sin línea; I-4: cliente prestado por `pool.connect()` con transacción abierta, el proceso muere; la precaución de la §26 sigue vigente: comprobar `application_name` «psql» antes de cortar el pid raíz, y un pid de la App con transacción abierta no se corta).

### Prueba nueva (L3.1)
`apps/desk/server/deployPoolConexionCortada.test.ts` (CRLF, `file`): `faltasSeccion27` pura. Exige la §27 detrás de la §26 y como última; los tres apartados; `57P01`, `salvo que se repita`, `conexiones en reposo`, `pool.connect()`, `stderr`, `§26`, `No hay interruptor nuevo`; y el texto fijo (`TEXTO_CONEXION_PERDIDA`) y la línea medida (`lineaConexionPerdida` sobre un error con `57P01`) IMPORTADOS de `@ambientalia/zoho-sync/db/conexionPerdida`, no copiados. Cinco pruebas: real sin faltas; sin «salvo que se repita» ⇒ esa falta exacta; sin `pool.connect()` ⇒ esa falta exacta; texto fijo mutado ⇒ las dos faltas del código; `## 28. Otra` detrás ⇒ `la §27 como última sección`, y sin §27 ⇒ `la sección ## 27. `.

### La guarda de la §26 en sitio (L3.3)
`git diff --numstat -- apps/desk/server/deployArranqueEstricto.test.ts` = **`5 5`**; `wc -l` = 57 antes y después; 57 de 57 con CRLF (`file`). Líneas: `:9` «es la última hasta la §27»; `:23` acota con `texto.indexOf('## 27. ')` (molde `apps/desk/server/deployCalificacionesConversaciones.test.ts:23`); `:24` y `:54` la falta pasa a `la §26 sola hasta la §27`; `:53` título «que no es la que precede a la §27»; `:54` la entrada es `deploy.replace('## 27. ', '## 99. Otra\n## 27. ')`. Verde: esa prueba (4), `deployCalificacionesConversaciones.test.ts` (6), `deployControlCalidad.test.ts` (6), `deployModoSinZoho.test.ts` (5), `deployPoolConexionCortada.test.ts` (5), `registro.test.ts` y `conexionPerdida.test.ts` (19): 7 ficheros, 68/68.

### Mutaciones del fichero vigilado (L3.4; protocolo: `git add` antes; `perl -i -ne 'print unless $. == N'`; `git checkout --`; `git diff --quiet` = 0; `file` CRLF tras cada una)
| Mutación | Cambio | Se puso rojo |
|---|---|---|
| Copias en memoria (regla 2) | sin `salvo que se repita`; sin `pool.connect()`; texto fijo cambiado; `## 28. Otra` detrás; sin §27 | las cinco pruebas de `apps/desk/server/deployPoolConexionCortada.test.ts` las fijan, cada una con su falta exacta (`['salvo que se repita']`, `['pool.connect()']`, `[TEXTO_CONEXION_PERDIDA, LINEA_MEDIDA]`, `['la §27 como última sección']`, `['la sección ## 27. ']`) |
| DEPLOY-1 (real) | borrar `DEPLOY.md:1171` (la línea de «Nada, salvo que se repita…», que lleva también «conexiones en reposo») | 5 de 5 rojas de la prueba de la §27: `expected [ 'salvo que se repita', …(1) ] to deeply equal []`. Se borra la línea entera, así que cae también `conexiones en reposo` |
| DEPLOY-2 (real) | borrar `DEPLOY.md:1182` (la viñeta del cliente prestado por `pool.connect()`) | 5 de 5 rojas: `expected [ 'pool.connect()' ] to deeply equal []` |
| POS-1 (regla 1) | quitar la acotación de `apps/desk/server/deployArranqueEstricto.test.ts:23` (`texto.slice(s26)`) | 3 rojas de 4: `expected [ 'la §26 sola hasta la §27' ] to deeply equal []`. La acotación está probada |
Ninguna mutación quedó sin rojo. Restauración tras cada una: `git diff --quiet` = 0 y CRLF.

### Barrido de citas de `pool.ts` (L3.6, regla de mutación 4)
`grep -rnoE "pool\.ts:[0-9]+(-[0-9]+)?" .` en el worktree (sin `node_modules`, `.git`, `.codegraph`, `dist`), CON `openspec/changes/archive/` y `docs/`: **47** citas, **12 dentro** del archivo y **35 fuera**. Explicación de 26 frente a 34: `git grep` en `96cba5ab` da **34** = 22 fuera del archivo + 12 dentro (la 34 de la propuesta es la cifra con archivo); las 26 del diseño eran las 22 fuera del archivo más las 4 de `proposal.md` y del delta de la spec (que ya existían al escribir el diseño). Hoy 47 = 34 + 13 de los artefactos de este cambio (`design.md` 5, `apply-progress.md` 3, `proposal.md` 2, delta de la spec 2, `tasks.md` 1). `pool.ts` hoy: líneas 1, 6 y 10 cambiadas; 4, 5, 7 a 9 y 11 idénticas.

Clasificación de las 34 de `96cba5ab`: **33 A, 1 B, 0 C**.
| Cita | Qué AFIRMA | Clase |
|---|---|---|
| `CLAUDE.md:199`, `DEPLOY.md:320`, `packages/zoho-sync/src/db/migrate.ts:88`, `packages/zoho-sync/src/db/migrate.test.ts:395`, `openspec/specs/tickets-core/spec.md:1503`, `openspec/specs/zoho-sync/spec.md:357`, `:418`, `:706` — `pool.ts:5` | el `search_path=desk,public` se fija ahí y `books` nunca está | A (la línea 5 no cambia) |
| `docs/sdd/Paquete_de_Despliegue_2026-09-10.md:111`, `:393`; `docs/sdd/Paquete_de_Despliegue_2026-09-27.md:78`; `docs/sdd/Paquete_de_Despliegue_2026-09-29.md:125`; `docs/sdd/Paquete_de_Despliegue_2026-09-30.md:139`; `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:213`; `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:239`; `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:473`; `docs/sdd/Paquete_de_Despliegue_2026-10-05b.md:267`; `docs/sdd/Paquete_de_Despliegue_2026-10-09.md:407` — `pool.ts:5` | el mismo `search_path` (paquetes fechados) | A; no se reescriben |
| `openspec/specs/zoho-sync/spec.md:2721` — `pool.ts:4-7` | «el pool no fija límite alguno» | A (siguen sin límites) |
| `docs/sdd/ENTRADA.md:2425`, `:2430` — `pool.ts:6` | el pool no fija `lock_timeout`, `statement_timeout` ni `connectionTimeoutMillis` | A (la línea 6 sigue sin ellos) |
| `docs/sdd/ENTRADA.md:2533` — `pool.ts:4-11` | «crea los dos pools sin escuchar su evento `error`» | **B** (cierta en `96cba5ab`, falsa desde este cambio) |
| `openspec/changes/archive/2026-09-09-cerrar-hallazgos-revision-f1b-01/design.md:150`, `exploration.md:77`, `proposal.md:94`, `:154`, `specs/zoho-sync/spec.md:30`; `openspec/changes/archive/2026-09-17-tercera-puerta-orden-venta/design.md:10` — `pool.ts:5` | el `search_path` | A |
| `openspec/changes/archive/2026-10-11-migracion-una-sola-ejecucion/design.md:116`, `tasks.md:20`, `verify-report.md:49` — `pool.ts:9-11` | `createPoolFromUrl` no fija `search_path` (el `verify-report` sólo lista la cita) | A |
| `openspec/changes/archive/2026-11-10-arranque-migracion-estricta/design.md:101`, `proposal.md:45`, `specs/zoho-sync/spec.md:28` — `pool.ts:4-7` | `new Pool` sin `lock_timeout` ni `statement_timeout` | A |

Las 13 de este cambio: `openspec/changes/pool-conexion-cortada/design.md:18`, `:20`, `:49` (`pool.ts:4`), `:66` (`pool.ts:5`), `:150` (`pool.ts:10`); `apply-progress.md:31`, `:35`, `:104` (`pool.ts:10`); `tasks.md:41` (`pool.ts:10`); `proposal.md:76` (`pool.ts:6`); `specs/zoho-sync/spec.md:18` (`pool.ts:6`): todas **A** (afirman que esas líneas se editan, o que las firmas de 4 y 9 no cambian; ciertas). **B, 2, reparadas en sitio** añadiendo «en `96cba5ab`», sin mover líneas (`git diff --numstat` = `1 1` cada una, CRLF): `openspec/changes/pool-conexion-cortada/proposal.md:35` y `openspec/changes/pool-conexion-cortada/specs/zoho-sync/spec.md:24` (`pool.ts:4-11`, «sin oyente»; las abreviadas `:6` y `:10` de `proposal.md:35` heredan el ancla).

**Segundo pase de la forma abreviada** (líneas que citan `pool.ts` con `:N` sueltos): `design.md:18`, `:20`, `:49` (`:9`), `proposal.md:35`, `:76` (`:10`), `specs/zoho-sync/spec.md:18` (`:10`), todas de este cambio: A salvo `proposal.md:35`, ya reparada. Citas a la guarda de la §26 (`apps/desk/server/deployArranqueEstricto.test.ts:23-24`, `:54`, `:17-31`): `design.md:175`, `:222`, `proposal.md:127`, `:162`, `specs/zoho-sync/spec.md:148`, `tasks.md:63`, `:68`, todas de este cambio: **A** (siguen señalando la misma guarda y las mismas líneas; no hay ninguna en el archivo ni en Supervisión).

**Afirmaciones de que la §26 es la última** (`grep -rn "§26" --include=*.md --include=*.ts`):
| Dónde | Qué afirma | Clase |
|---|---|---|
| `openspec/changes/pool-conexion-cortada/proposal.md:72` y `openspec/changes/pool-conexion-cortada/design.md:158` («hoy la última es la §26, `DEPLOY.md:1112`») | la §26 era la última | **B**, reparadas en sitio: «en `96cba5ab` la última es la §26, `DEPLOY.md:1112` en `96cba5ab`», `1 1` cada una |
| `openspec/specs/zoho-sync/spec.md:2862` («SHALL terminar» con la §26) y `:2870` («desde este cambio la última es la §26») | RQ-ZS-57 | **B**, declarada: elección (a) de la propuesta (S-6), RQ-ZS-62 la contradice a propósito; la spec viva no se toca hasta el archivo |
| `openspec/specs/zoho-sync/spec.md:2887` («es la última hasta la §26»), `apps/desk/server/deployCalificacionesConversaciones.test.ts:9` | la §25 es la última hasta la §26 | A |
| `openspec/changes/archive/2026-11-10-arranque-migracion-estricta/` (`apply-progress.md:107-112`, `design.md:190`, `:211`, `:224`, `proposal.md:72`, `:150`, `specs/zoho-sync/spec.md:177`, `tasks.md:66-69`, `verify-report.md:59`, `archive-report.md:22`) | la §26 se escribió al final, era la última | B históricas; no se reescriben (paquete fechado) |
| `openspec/changes/pool-conexion-cortada/specs/zoho-sync/spec.md:10`, `:146-148`, `proposal.md:104`, `:126`, `design.md:176`, `:185`, `:189` | describen la elección y la guarda | A |
| `DEPLOY.md:1185`, `apps/desk/server/deployPoolConexionCortada.test.ts:10` | la §27 es la última | A (nuevas) |
| `docs/sdd/ENTRADA.md:2536` | el procedimiento de la §26 en `DEPLOY.md:1112` corta sesiones con `pg_terminate_backend` | A |

### Para Supervisión (L3.7): NO se editan
| Fichero y línea | Afirma | Clase | Nota |
|---|---|---|---|
| `docs/sdd/ENTRADA.md:2533` | `pool.ts:4-11` «crea los dos pools sin escuchar su evento `error`» | **B** | cierta en `96cba5ab`; falsa desde este cambio. Pedir «en `96cba5ab`» |
| `docs/sdd/ENTRADA.md:2536` («Afecta a») | la App y el worker; la §26 manda cortar sólo la sesión de la consola | A, con matiz | I-4: el oyente NO cubre el cliente prestado, así que la precaución de la §26 sigue vigente (así lo dice la §27) |
| `docs/sdd/ENTRADA.md:2425`, `:2430` | `pool.ts:6` sin límites de tiempo | A | |
| `CLAUDE.md:199` | `pool.ts:5` fija `search_path=desk,public` | A | |
| `openspec/config.yaml`, `docs/sdd/F0-05_*`, `docs/sdd/R08.4_Expediente_de_cambios.md` | no citan `pool.ts:N` | — | |
Las de `openspec/specs/zoho-sync/spec.md:2862` y `:2870` (B declarada) las resuelve el archivo.

### L3.8 (CA-6 / CA-8)
`apps/desk/server/reconciliacion/registro.test.ts` en verde sin tocarlo (en los 7 ficheros, 68/68). `git diff --quiet bf4dc0a6 -- .env.example packages/zoho-sync/src/db/schema.sql packages/zoho-sync/src/db/migrate.ts` = 0.

### Verificaciones
`npm run typecheck`: salida 0. `npm run lint -- --max-warnings 165`: salida 0, **165 avisos contra 165**; sin `eslint-disable` en lo nuevo. Ficheros nuevos y editados en CRLF (`file`).

### Desvíos del diseño (con su porqué)
1. La sección «Lo que no cubre» recoge I-3 (consulta en curso, sin línea) además de I-4, porque `tasks.md` lo pide («I-3 e I-4 tal como se midieron»).
2. DEPLOY-1 borra la línea entera, que contiene también `conexiones en reposo`: el rojo trae dos faltas y no una (la exactitud de la falta se fija sobre copias).
3. Las tres pruebas de copia salen rojas en su primera aserción (`not.toBe`) antes de existir la §27 (no hay nada que mutar): rojo por la razón correcta para esa prueba.
4. Dos B más de artefactos propios (`proposal.md:72`, `design.md:158`, «hoy la última es la §26») reparadas en sitio, no previstas en `tasks.md` L3.5.

### Medida del intento (i5)
Ver línea final, anotada con todo en el índice.

`git diff --cached --shortstat --no-renames bf4dc0a6` con todo en el índice antes de esta línea: 8 ficheros, 214 inserciones y 17 borrados (231 líneas; incluye este fichero y las casillas de `tasks.md`). Sin ficheros nuevos fuera del índice (`wc -l` = 0), sin binarios. Muy por debajo de 800.

### Nota del orquestador (L3)
- La §27 (`DEPLOY.md:1150`) se leyó contra lo medido en L2: la línea, el `57P01`, la versión 17.10 y los límites I-3 e I-4 coinciden con el bloque de L2.
- **Medida final al commit:** `git diff --shortstat --no-renames bf4dc0a6` = 221 + 18 = 239 líneas, sin nada sin trackear. Las cinco comprobaciones (L3.9) quedan en el `settle` del intento i5 y en el `verify-report.md`.
