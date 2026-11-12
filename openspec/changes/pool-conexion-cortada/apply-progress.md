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
