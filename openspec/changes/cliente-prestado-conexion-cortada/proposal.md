---
tanda: fuera-del-plan
motivo: "E-290: el cliente prestado por pool.connect() no escucha su evento error y, si el servidor corta su conexión con una transacción abierta, el proceso se cae (I-4 de pool-conexion-cortada); completa E-285 y va en el mismo despliegue"
capacidad: [zoho-sync]
maestro: []
cierra: si
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta — `cliente-prestado-conexion-cortada`

Atiende E-290, que nace del aviso W-1 del verify de `pool-conexion-cortada`
(`openspec/changes/archive/2026-11-12-pool-conexion-cortada/verify-report.md:147`): el oyente que E-285 puso en los pools no cubre un cliente prestado
por `pool.connect()`, y la integración I-4 (`packages/zoho-sync/src/db/conexionPerdida.integration.test.ts:179`) fija que, si el servidor corta ese
cliente con una transacción abierta, el proceso muere. E-290 se cita por su número: su entrada en la bandeja la escribe Supervisión.

*Sobre la cabecera.* `tanda: fuera-del-plan` con motivo: E-290, como E-285, no tiene fila del plan, y fuera del plan el cambio no entra en el
numerador (`apps/desk/server/reconciliacion/comprobaciones.ts:215`). `maestro: []`: la R08.4.md no trata el pool ni los clientes prestados (búsqueda
sin distinguir mayúsculas de «pool» y «prestad» en la copia citable: 0). `cierra: si`: el cambio deja resuelto el caso que E-285 dejó fuera, en lo
que cubre el §3, y deja escrito lo que no cubre (§4). `toca_maestro: no`. R-2 no aplica: `zoho-sync` ya está en `openspec/config.yaml:137`.

## 1 · Intención

Que ningún proceso —la App, el worker `hub-sync` ni el relleno de artículos— se caiga cuando el servidor corta la conexión de un cliente prestado por
`pool.connect()`. Al terminar, la operación que tenía ese cliente falla como cualquier fallo de base —su `ROLLBACK`, su error y su respuesta de
siempre—, el registro recibe UNA línea por cliente perdido, distinta de la de E-285, y el proceso sigue sirviendo con otra conexión.

## 2 · Lo que hay hoy (medido en `4d7aad75` y con una sonda del 2026-11-13)

**2.1 · Mecánica.** En el `index.js` de `pg-pool` 3.14.0 (instalado, fuera del árbol versionado), el oyente interno de reposo de cada cliente se
añade al conectar (línea 270) y al liberar (línea 385) y se quita al prestar (línea 344); el evento `connect` sale sólo para clientes nuevos (línea
337) y antes de `acquire` (línea 340); `release` (línea 389) sale después de reponer ese oyente; y un cliente que ya no es consultable se descarta al
liberarlo (línea 392). En el `lib/client.js` de `pg` 8.21.0, el cierre del socket sin `end()` emite «Connection terminated unexpectedly» (líneas 192
a 211). Un cliente prestado, por tanto, no tiene ningún oyente de `error`.

**2.2 · Lo medido.** Sonda del orquestador, fuera del repositorio: PostgreSQL 17.10 en un contenedor `postgres:17-alpine`, `pg` 8.21.0 y `pg-pool`
3.14.0; corte con `pg_terminate_backend`. «Con oyente» es un oyente por cliente puesto en el evento `connect` del pool.

| Caso | Hoy | Con oyente por cliente |
|---|---|---|
| **H-1** · Prestado con `BEGIN`, en reposo (I-4) | El proceso muere: salida 1, «Unhandled 'error' event», `57P01` | El cliente emite DOS errores: `57P01` y, al cerrarse el socket, «Connection terminated unexpectedly». La siguiente consulta y el `ROLLBACK` rechazan con «Client has encountered a connection error and is not queryable»; al liberarlo, el pool lo descarta (total 0); el proceso sigue y la siguiente consulta del pool abre otra conexión |
| **H-2** · Prestado con `BEGIN` y una consulta en curso (caso nuevo: el corte pilla a `enTransaccion` dentro de `fn`) | La consulta rechaza con `57P01` y DESPUÉS el proceso muere («Connection terminated unexpectedly» sin oyente) | Un solo error de cliente; el `ROLLBACK` rechaza; el proceso sigue |
| **H-3** · Conexión en reposo en el pool (I-1, I-2) | Una línea de E-285 | El oyente del cliente TAMBIÉN salta, y antes que el del pool: sin filtro saldrían dos líneas |
| **H-4** · `pool.query()` en curso (I-3) | Ningún evento de cliente | Ningún evento de cliente |

**2.3 · Los seis sitios que toman un cliente prestado**, todos sin oyente propio:

| Sitio | Qué hace ante el fallo |
|---|---|
| `apps/desk/server/db/transaccion.ts:16` | `ROLLBACK` con el fallo tragado y relanza el original (`apps/desk/server/db/transaccion.ts:23-24`); libera en `finally` (`:26`) |
| `apps/desk/server/db/eliminarTicket.ts:178` | Lo mismo (`apps/desk/server/db/eliminarTicket.ts:184-185`); libera en `:187` |
| `packages/zoho-sync/src/db/repo.ts:336` y `:440` | Lo mismo (`packages/zoho-sync/src/db/repo.ts:342-343` y `:446-447`); liberan en `:345` y `:449` |
| `packages/zoho-sync/src/db/puestaAlDiaEstricta.ts:80` | Destruye el cliente con `release(true)` (`packages/zoho-sync/src/db/puestaAlDiaEstricta.ts:86`) y clasifica el fallo (`:125-126`) |
| `apps/hub-sync/src/hub-sync.ts:55` | Libera en `finally` (`apps/hub-sync/src/hub-sync.ts:59`); su pool `stPool` sale de `createPoolFromUrl` (`:53`) |

Todos los pools salen de `packages/zoho-sync/src/db/pool.ts:6` y `:10`, que ya pasan por `escucharConexionPerdida`
(`packages/zoho-sync/src/db/conexionPerdida.ts:35`, que hoy sólo pone el oyente del pool, en `:43`). La App crea el suyo en `apps/desk/server/index.ts:18`
y abre con él la puesta al día del arranque (`apps/desk/server/index.ts:26`). Un oyente puesto desde el pool alcanza, pues, a los seis. Los rechazos
que siguen al corte ya tienen quien los recoja en el worker: la derivación diaria, `packages/zoho-sync/src/booksHub/schedule.ts:16`, y la inicial,
`apps/hub-sync/src/hub-sync.ts:61`. **Hipótesis:** en la App, el rechazo de `enTransaccion` llega a la ruta como cualquier error de base y recibe su
respuesta de siempre.

## 3 · Alcance y enfoque

**Dentro.**
- **a · Un oyente por cliente, desde el pool.** En `packages/zoho-sync/src/db/conexionPerdida.ts`, el pool que pasa por `escucharConexionPerdida` pone,
  en su evento `connect`, un oyente de `error` en cada cliente nuevo, y lleva la cuenta de los clientes prestados con `acquire` y `release`. El oyente
  registra sólo si el cliente está prestado (H-3) y sólo la primera vez por cliente (H-1); los demás errores los calla. No reintenta ni reconecta: el
  cliente ya no es consultable (H-1), su operación rechaza, quien lo tiene hace su `ROLLBACK` y lo libera, y el pool lo descarta. Sin tocar los seis
  sitios (§2.3) ni `pool.ts`. Si el diseño exigiera tocar alguno, se hace en sitio, sin insertar ni mover líneas, y se dice.
- **b · Su línea**, con un texto fijo propio, distinto del de E-285 (`packages/zoho-sync/src/db/conexionPerdida.ts:3`, «conexión inactiva»), y el
  mismo saneado: mensaje y SQLSTATE si lo hay; nunca el objeto de error ni nada de la conexión (S-1, S-2).
- **c · Rojo primero (strict_tdd).** Unitarias sin base, y la I-4 reescrita en sitio: «el proceso sigue» en vez de «el proceso MUERE»; las dos se ven
  rojas antes del cambio. Casos nuevos contra PostgreSQL: H-2, y el molde del worker (`apps/hub-sync/src/hub-sync.ts:53-55`) si el arnés lo permite.
- **d · Mutación** del oyente nuevo, de su filtro de prestado y de su deduplicación, con restauración byte a byte.
- **e · `DEPLOY.md` §27, la última sección (`DEPLOY.md:1150`), corregida en sitio:** lo que dice del cliente prestado (`DEPLOY.md:1182-1183`) y la
  razón de la precaución de la §26 (`DEPLOY.md:1185-1186`), con su guarda `apps/desk/server/deployPoolConexionCortada.test.ts`.

**Restricciones (regla de mutación 4).** `pool.ts`, `conexionPerdida.ts`, sus dos ficheros de prueba, el hijo de la integración, la guarda de la §27,
`DEPLOY.md` y los seis sitios están citados por línea, sobre todo desde los artefactos archivados de `pool-conexion-cortada` (por ejemplo
`packages/zoho-sync/src/db/conexionPerdida.ts:43`, `packages/zoho-sync/src/db/conexionPerdida.integration.test.ts:179` y `DEPLOY.md:1179-1186`).
No se insertan, borran ni mueven líneas en ellos salvo al final del fichero; una línea citada sólo cambia en sitio. Barrido de citas al cerrar.

**Capacidades.** Nuevas: ninguna. Modificadas: `zoho-sync`, ADDED al final desde **RQ-ZS-63** (el último vivo es RQ-ZS-62,
`openspec/specs/zoho-sync/spec.md:3013`); el límite que fija RQ-ZS-62 (`openspec/specs/zoho-sync/spec.md:3017-3019`) deja de ser cierto (S-6).

**Qué cubre de E-290, en una línea:** un corte del servidor sobre un cliente prestado deja de tumbar el proceso en los seis sitios; su operación
falla con su error de siempre y sale una línea por cliente.

## 4 · Fuera de alcance

- Retirar la precaución de la §26: se plantea (§7), no se retira.
- Reintentar la operación fallida o reconectar por cuenta propia: el pool ya descarta el cliente (H-1).
- Que una `pool.query()` en curso deje línea (H-4): no hay evento que escuchar; sigue como en I-3.
- Cambiar los mensajes, códigos o respuestas de las rutas de la App ante un fallo de base. Nada en `apps/desk/src`.
- `max`, `min`, `idleTimeoutMillis`, `statement_timeout`, `connectionTimeoutMillis`, ni la versión de `pg` o de `pg-pool`.
- Ninguna variable de entorno nueva ni interruptor (S-4). Nada de producción. En la rama no se tocan `openspec/config.yaml`, `docs/sdd/ENTRADA.md`,
  `CLAUDE.md`, los `docs/sdd/F0-05_*`, `docs/sdd/R08.4_Expediente_de_cambios.md`, `.env.example`, `schema.sql` ni `migrate.ts`.

## 5 · Criterios de aceptación

- **CA-1 · Rojo unitario (c).** Al final de `packages/zoho-sync/src/db/conexionPerdida.test.ts`: con un pool de `escucharConexionPerdida`, un cliente
  falso que llega por `connect`, se presta por `acquire` y emite `error` no lanza y deja una línea con el texto nuevo; hoy lanza. Además: un cliente
  no prestado, o ya liberado, no deja línea nueva; dos errores del mismo cliente prestado dejan una; dos clientes, dos; y un error con una URL con
  contraseña-testigo no la filtra (regla de mutación 2).
- **CA-2 · I-4 en sitio (c).** La prueba de `packages/zoho-sync/src/db/conexionPerdida.integration.test.ts:179` pasa a exigir: salida 0, sin
  «Unhandled 'error' event», una línea del texto nuevo con `57P01` y ninguna del de E-285; la siguiente consulta y el `ROLLBACK` rechazan; tras liberar,
  el pool queda en 0 y su siguiente consulta resuelve con otro pid. Se corre y se anota el rojo ANTES del cambio. Mismo número de líneas en la prueba.
- **CA-3 · H-2 contra PostgreSQL (c).** Cliente prestado con `BEGIN` y una consulta larga en curso: rojo antes; después, la consulta rechaza con
  `57P01`, el `ROLLBACK` rechaza, sale una sola línea del texto nuevo y el proceso sigue. **Hipótesis:** esa línea lleva «Connection terminated
  unexpectedly» y ningún código; se fija lo observado.
- **CA-4 · El worker (c).** Lo mismo que CA-2 con un pool de `createPoolFromUrl`, si el arnés lo permite; si no, se dice por qué.
- **CA-5 · Sin regresión.** I-1 e I-2 siguen dejando exactamente una línea de E-285 y ninguna del texto nuevo; I-3, ninguna de las dos.
- **CA-6 · Mutación (d).** Sin el oyente nuevo, CA-1, CA-2 y CA-3 se ponen rojas; sin el filtro de prestado, I-1 e I-2 dan dos líneas y se ponen
  rojas; sin la deduplicación, CA-2 da dos líneas y se pone roja. Restauración byte a byte (`git diff` vacío sobre lo mutado), anotada en el progreso.
- **CA-7 · En sitio.** `git diff` vacío sobre `pool.ts` y los seis sitios (o, si el diseño toca alguno, sólo líneas cambiadas en sitio y declaradas);
  en `conexionPerdida.ts`, sólo cambios en sitio y lo nuevo al final; U-10 (la forma de `pool.ts`) sigue en verde.
- **CA-8 · `DEPLOY.md` §27 (e).** Corregida en sitio, sin mover líneas citadas: el cliente prestado queda cubierto, con su línea —texto importado del
  código, como `apps/desk/server/deployPoolConexionCortada.test.ts:18-20` hace con la de E-285— y con la advertencia de que su operación falla; la
  precaución de la §26 se conserva con su razón corregida y la pregunta del §7 abierta. La guarda se amplía en sitio o al final, con la mutación del
  fichero vigilado (regla de mutación 2).
- **CA-9 · Sin variable nueva.** `.env.example` sin cambios y nada depende de una variable.
- **CA-10 · Las cinco comprobaciones** en una cadena: typecheck, `npm run lint -- --max-warnings 165`, detector de citas, `npm test` con log y build.

## 6 · Riesgos

- **Mecánica interna de `pg-pool`** (§2.1). Los eventos `connect`, `acquire` y `release` son públicos; su orden relativo y el momento en que se quita y
  se repone el oyente de reposo son lo medido, no un contrato (**hipótesis**). Una versión nueva podría romperlo: CA-2, CA-3 y CA-5 lo cazan.
- **Dos líneas por corte** si falla el filtro (H-3) o la deduplicación (H-1): CA-5 y CA-6.
- **El error queda callado en el evento** y sólo aflora en la siguiente consulta del cliente. Un código que retuviera un cliente prestado sin volver a
  consultarlo ni liberarlo no se enteraría; los seis sitios liberan en `finally` o destruyen el cliente (§2.3).
- **Verde falso en la integración**, si el corte no pilla el estado buscado (`idle in transaction` o `active`). Se mantienen la espera acotada del estado
  antes de cortar (`packages/zoho-sync/src/db/conexionPerdida.integration.test.ts:155`) y el `true` de `pg_terminate_backend` (`:156`).
- **Rechazos sin quien los recoja.** El proceso deja de morir por el evento, pero un rechazo que nadie recoja lo tumbaría por otra vía. Los del §2.3 lo
  tienen (**hipótesis** para las rutas de la App).
- **La integración se salta en local** sin `TEST_DATABASE_URL`; en el CI corre, porque la fija (`.github/workflows/ci.yml:47`).
- **La línea no se ve** si EasyPanel no enseña stderr (hipótesis heredada de E-285, S-3).
- **Ficheros muy citados** (§3). La I-4 y la §27 cambian lo que afirman: las frases archivadas que dicen «el proceso muere» son caso B y lo anota el barrido.

## 7 · La pregunta de la §26, planteada (la responden el apply y el verify con lo medido)

¿Puede retirarse ya la precaución que la §27 mantiene de la §26 —antes de cortar con `pg_terminate_backend` el pid raíz de una cadena de bloqueos
(`DEPLOY.md:1142-1144`), comprobar que es de la consola, y no cortar un pid de la App con transacción abierta (`DEPLOY.md:1185-1186`)—?

| A favor de retirarla | En contra, o sin medir |
|---|---|
| Su razón escrita es que el proceso muere (`DEPLOY.md:1182-1183`); si CA-2 a CA-4 pasan, deja de ser cierta | Cortar un pid de la App con transacción abierta sigue haciendo fallar la operación de un usuario (un alta, una transición, un borrado): su transacción no llega a confirmarse y, **hipótesis**, el usuario ve un error |
| Mientras no se corte, el arranque se sigue deteniendo por el límite de espera (`DEPLOY.md:1142`) | Si el pid raíz es la puesta al día del arranque (`packages/zoho-sync/src/db/puestaAlDiaEstricta.ts:80`), cortarlo detiene ese arranque con la salida 1 de la §26 |
| | Sin medir en producción: el `application_name` de la App, que EasyPanel enseñe la línea y el comportamiento sobre PostgreSQL 17.11 |

Este cambio **no la retira**: corrige su razón en la §27 y la deja vigente. Retirarla es una decisión sobre un procedimiento de persona, y su traza
vive en E-285 («Afecta a»), en un fichero de Supervisión (§10).

## 8 · Supuestos

Todos reversibles; van a la lista semanal (`decision/preguntas-de-detalle-sin-llegar`).

| Id | Supuesto | Cómo se deshace |
|---|---|---|
| S-1 | Texto fijo: «Pool de la base: se perdió la conexión de un cliente prestado; su operación falla y el proceso sigue», seguido, como en E-285, de « — », el mensaje y, si lo hay, `[SQLSTATE]`. No contiene el texto de E-285, para que las pruebas que cuentan una línea no cuenten la otra | Otro texto; la §27 y su guarda lo leen del código |
| S-2 | Una línea por cliente, la de su primer error; los siguientes del mismo cliente se callan (H-1). Un corte de varias conexiones prestadas da una línea por cada una, sin agrupar | Una línea por evento, o agrupar |
| S-3 | Mismo canal que E-285: el `registrar` de `escucharConexionPerdida`, por defecto `console.error`, es decir stderr (D-1, `openspec/changes/archive/2026-11-12-pool-conexion-cortada/design.md:239`). Que EasyPanel lo enseñe sigue siendo hipótesis | Otro `registrar` |
| S-4 | Sin interruptor ni variable: el oyente no enciende ningún escritor, así que la regla de secretos no pide uno | Variable con su línea en `.env.example` y `DEPLOY.md` |
| S-5 | Integración en un contenedor desechable `postgres:17-alpine` (17.10), nunca contra producción (17.11) | Otra imagen |
| S-6 | Spec: ADDED desde RQ-ZS-63. Como RQ-ZS-62 es el último bloque del fichero, un MODIFIED suyo no mueve líneas de los anteriores. La fase de spec elige entre ese MODIFIED y una precedencia declarada, como la de RQ-ZS-62 sobre RQ-ZS-57 (`openspec/specs/zoho-sync/spec.md:3021-3022`) | La otra vía |
| S-7 | I-4 deja de ser caracterización (D-7, `openspec/changes/archive/2026-11-12-pool-conexion-cortada/design.md:245`) y pasa a requisito; se reescribe en sitio y los casos nuevos van al final | Dejar I-4 y añadir otra prueba |
| S-8 | El hijo de la integración gana los modos que hagan falta, en sitio o al final, o se crea otro hijo: lo decide el diseño. Hoy su modo `prestado` no libera nunca el cliente (`packages/zoho-sync/src/db/testing/hijoConexionCortada.ts:51-54`) | Otro hijo |

**Ronda de preguntas:** no se hace. El preflight es `auto` (`openspec/config.yaml:26`) y ninguna duda da causa de parada de la «Regla de ejecución»:
no cambia el alcance de una fila, no cuesta dinero, no toca datos de producción ni contradice una decisión. Las que habría hecho —el texto de la
línea (S-1), si un corte de varias conexiones debe agruparse (S-2) y si la precaución de la §26 se retira (§7)— van a la lista semanal o a Supervisión.

## 9 · Cómo se mide

Worktree propio desde `4d7aad75` (regla del ciclo 3). Cada intento ≤ 800 líneas, medidas con `git diff --shortstat --no-renames` contra el commit
de partida más `wc -l` de lo nuevo sin trackear, y se registra esa medida (`decision/ledger-ficheros-nuevos`). `strict_tdd`: rojo previo de CA-1
(vitest sin base) y de CA-2 y CA-3 (PostgreSQL 17 en contenedor desechable); en el CI la integración corre porque fija `TEST_DATABASE_URL`
(`.github/workflows/ci.yml:47`). Mutaciones de CA-6 y del fichero vigilado de la §27. Regla 13: no toca `apps/desk/src`. Barrido de citas al cerrar
sobre los ficheros del §3. Estimado de código y pruebas: unas 200 líneas (360 con ×1,8), un solo intento de aplicar; aparte, los artefactos y el
`verify-report.md`, que es sumando obligatorio.

## 10 · Tareas de persona y notas para Supervisión

| Id | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Desplegar App y worker con este cambio en el mismo despliegue que `pool-conexion-cortada` | Alfonso | `DEPLOY.md` §27 |

Archivar no da P-1 por hecha. Para Supervisión (la rama no toca sus ficheros): registrar E-290 con su origen (W-1 del verify citado arriba) y, al
cerrar, anotar en E-285 la respuesta del §7.

## 11 · Vuelta atrás

Revertir el commit devuelve los clientes prestados sin oyente: un corte sobre uno vuelve a tumbar el proceso, como mide hoy la I-4. No hay migración,
ni columna, ni variable de entorno.
