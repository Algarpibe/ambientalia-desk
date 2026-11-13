# Informe de archivo — `pool-conexion-cortada`

Cabecera R-1 (`openspec/changes/archive/2026-11-12-pool-conexion-cortada/proposal.md:1-9`): `tanda: fuera-del-plan`, motivo E-285
(«los pools de la base no escuchan su evento error…»), `capacidad: [zoho-sync]`, `maestro: []`, `cierra: si`, `toca_maestro: no`,
`origen_cabecera: declarada`.

**Qué cubre de E-285, en una línea:** el pool deja de tumbar el proceso cuando el servidor corta una conexión en reposo (una línea en el
registro y la siguiente consulta abre otra); deja fuera, medido y escrito, el cliente prestado por `pool.connect()` con una transacción
abierta, que sigue tumbando el proceso.

Partida: `main` en `96cba5ab`. Rama `pool-conexion-cortada`, worktree propio. Verify: PASS WITH WARNINGS, 0 CRITICAL
(`openspec/changes/archive/2026-11-12-pool-conexion-cortada/verify-report.md:158`).

## 1 · Qué se construyó

| Pieza | Dónde |
|---|---|
| Módulo nuevo: texto fijo, línea pura sin secretos (sólo `message` y `code`; URL sustituidas) y oyente con `registrar` opcional, por defecto `console.error` | `packages/zoho-sync/src/db/conexionPerdida.ts:3`, `:27`, `:35`, `:43` |
| `pool.ts` en sitio: sólo cambian la 1, la 6 y la 10; 11 líneas, firmas de `:4` y `:9` intactas | `packages/zoho-sync/src/db/pool.ts:1`, `:6`, `:10` |
| Pruebas unitarias U-1 a U-10 | `packages/zoho-sync/src/db/conexionPerdida.test.ts` |
| Integración en proceso hijo contra PostgreSQL real, I-1 a I-4 | `packages/zoho-sync/src/db/conexionPerdida.integration.test.ts:132`, `:141`, `:164`, `:179`; hijo en `packages/zoho-sync/src/db/testing/hijoConexionCortada.ts` |
| `DEPLOY.md` §27 al final: la línea medida, «nada, salvo que se repita» y lo que no cubre | `DEPLOY.md:1150`, `:1179-1186` |
| Prueba de la §27, con el texto fijo importado del módulo | `apps/desk/server/deployPoolConexionCortada.test.ts:40` |
| Guarda de la §26 acotada en sitio (5 líneas cambiadas, 57 antes y después) | `apps/desk/server/deployArranqueEstricto.test.ts:23` |
| Spec viva: RQ-ZS-58 a RQ-ZS-62, añadidos al final | `openspec/specs/zoho-sync/spec.md:2891`, `:2926`, `:2955`, `:2987`, `:3013` |

Sin variable de entorno nueva ni interruptor (S-3); `.env.example`, `schema.sql`, `migrate.ts` y los ficheros de Supervisión, sin tocar.

## 2 · Intentos del registro (medida = `git diff --shortstat --no-renames` del intento más lo nuevo sin trackear)

| Intento | Unidad | Commit | Medida = registro |
|---|---|---|---|
| i1 | propuesta y delta | `498d501a` | 347 |
| i2 | diseño y tareas | `a98a113d` | 351 |
| i3 | L1 módulo, U-1 a U-10, `pool.ts` en sitio, M-1 a M-6 | `cb278436` | 342 |
| i4 | L2 integración contra PostgreSQL 17, mediciones del §7 | `bf4dc0a6` | 346 |
| i5 | L3 `DEPLOY.md` §27, su prueba, guarda de la §26, barrido | `bdde29b3` | 239 |
| i6 | verify | `972e4ee5` | 162 |
| i7 | archivo | este commit | techo 3.000 (2 × 1.079 + 800, redondeado); se mide al cerrar |

Ningún intento pasó de 800. En cada uno, las cinco comprobaciones salieron con 0 sobre el commit del intento: typecheck,
`npm run lint -- --max-warnings 165` (165 avisos contra 165), detector de citas, `npm test` con log y build (`index-F1jDYjEU.js`, el bundle
de `main`: no cambia el cliente). **Pasadas fallidas**, que quedan como evidencia en el `settle`: en i1, la primera cadena la cortó el arnés por
falta de memoria (3,9 GB libres) durante `npm test`, y se relanzó con permiso del usuario; en i6, el detector salió con 1 sobre `689f1c6f` porque
una cita del `verify-report.md` empezaba en una línea vacía de `DEPLOY.md`, y se reparó en sitio (`972e4ee5`).

## 3 · Integración y mutación

**PostgreSQL 17.10** (contenedor desechable `postgres:17-alpine`; producción es 17.11), medido tres veces con contenedores propios
(apply, orquestador y verify), siempre 4 de 4:

| Caso | Resultado medido |
|---|---|
| I-1 `createPool` · I-2 `createPoolFromUrl`, conexión en reposo cortada con `pg_terminate_backend` | El hijo sigue vivo y sale con 0; **una** línea `… — terminating connection due to administrator command [57P01]`; la siguiente consulta usa otro pid |
| I-3 consulta en curso | La consulta falla con `57P01`, el proceso sigue y no sale la línea |
| I-4 cliente prestado por `pool.connect()` con `BEGIN` | **El proceso muere**: salida 1, «Unhandled 'error' event», `57P01`, sin línea |

Anti falso verde: estado `idle` antes del corte, `pg_terminate_backend` igual a `true` y corte a ~1 s de «listo», dentro de los 10 s de
`idleTimeoutMillis`. **Mutación del oyente (M-1):** con `pool.on('error', oyente)` comentado se ponen rojas U-1 (las tres funciones) e I-1 e
I-2 («expected 1 to be +0»: el hijo muere); I-3 e I-4 siguen verdes, porque no dependen de él. Restaurado byte a byte (mismo sha256, CRLF). Las
otras cinco (M-2 a M-6) y las del fichero vigilado de la §27 dieron todas rojo (`openspec/changes/archive/2026-11-12-pool-conexion-cortada/apply-progress.md:30`,
`:100`, `:155`). En el CI la integración corre, porque fija `TEST_DATABASE_URL`; en local, sin la variable, queda omitida (34 omitidas).

## 4 · Barrido de citas (regla de mutación 4)

`pool.ts` no movió ninguna línea, así que el detector no podía ponerse rojo; cambia lo que afirman. De las **34** citas de `96cba5ab` (22 fuera
del archivo y 12 dentro), **33 son A y 1 es B**: la de E-285 en `docs/sdd/ENTRADA.md:2533` en `96cba5ab`, fichero de Supervisión que la rama no
toca. En los artefactos propios, cuatro B se repararon en sitio con su ancla, sin mover líneas. Detalle en
`openspec/changes/archive/2026-11-12-pool-conexion-cortada/apply-progress.md:164`. Las frases de RQ-ZS-57 que dicen que `DEPLOY.md` termina con
la §26 (`openspec/specs/zoho-sync/spec.md:2862`, `:2870`) son históricas: RQ-ZS-62 declara que la §27 la sucede, sin modificarlas (S-6).

## 5 · Supuestos para la lista semanal (reversibles)

S-1 a S-7 de la propuesta (`openspec/changes/archive/2026-11-12-pool-conexion-cortada/proposal.md:99-105`) y D-1 a D-9 del diseño
(`openspec/changes/archive/2026-11-12-pool-conexion-cortada/design.md:239-247`). Los que más conviene que lea Gerencia: **D-1** (la línea sale por
stderr, y que EasyPanel la muestre es hipótesis) y **D-7** (I-3 e I-4 quedan como pruebas de caracterización: si una versión futura de `pg`
cambia ese comportamiento, se ponen rojas a propósito).

## 6 · Tareas de persona — archivar NO las da por hechas

| Id | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Desplegar App y worker con este cambio, en el mismo despliegue que el arranque estricto o antes | Alfonso | `DEPLOY.md:1150`; `openspec/changes/archive/2026-11-12-pool-conexion-cortada/tasks.md:80` |
| P-2 | Opcional: cortar una conexión en reposo de la App y buscar la línea; si no aparece, EasyPanel no enseña stderr (cierra también la P-2 de la §26) | Alfonso con el analista | `openspec/changes/archive/2026-11-12-pool-conexion-cortada/tasks.md:81` |

## 7 · La pregunta de la §7 de la propuesta, respondida con lo medido

**La precaución de la §26 sigue siendo necesaria.** Este cambio quita el riesgo de un reinicio de `desk-db` y de cortar una conexión en reposo
(I-1, I-2), y una consulta en curso tampoco tumba el proceso (I-3). Pero el pid raíz de una cadena de bloqueos tiene una transacción abierta: si es
de la App, es un cliente prestado, y cortarlo **sigue tumbando el proceso** (I-4). Antes de cortarlo hay que comprobar que es de la consola:
`application_name` «psql», frente al nombre vacío del pool de la App, medido en el contenedor local y no en producción.

## 8 · Para Supervisión (la rama no toca sus ficheros)

- **Traza de E-285** (`docs/sdd/ENTRADA.md:2532-2537` en `96cba5ab`): construida por `pool-conexion-cortada` (`fuera-del-plan`, `cierra: si`).
  La hipótesis del analista queda **medida**: sin oyente, cortar una conexión en reposo tumbaba el proceso (M-1); con él, no. La cita de su
  «Qué» (`docs/sdd/ENTRADA.md:2533` en `96cba5ab`) pasa a caso B. Su «Afecta a» (`docs/sdd/ENTRADA.md:2536` en `96cba5ab`) sigue en pie:
  la precaución de la §26 no se retira (§7 de este informe).
- **Entrada nueva propuesta** (W-1 del verify, `openspec/changes/archive/2026-11-12-pool-conexion-cortada/verify-report.md:147`): un oyente
  para el cliente prestado por `pool.connect()`, que hoy sigue tumbando el proceso. Lo usan `apps/desk/server/db/transaccion.ts:16`,
  `packages/zoho-sync/src/db/repo.ts:336`, `:440`, `apps/hub-sync/src/hub-sync.ts:55` y `apps/desk/server/db/eliminarTicket.ts:178`.
- `CLAUDE.md:199` (`packages/zoho-sync/src/db/pool.ts:5`) sigue siendo cierta.
