---
tanda: fuera-del-plan
motivo: "E-285 (docs/sdd/ENTRADA.md): los pools de la base no escuchan su evento error, y si el servidor corta una conexión inactiva la App puede caerse; va antes del despliegue que trae el arranque estricto (decision/arranque-bloqueado-por-consola)"
capacidad: [zoho-sync]
maestro: []
cierra: si
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta — `pool-conexion-cortada`

Atiende E-285 (`docs/sdd/ENTRADA.md:2532-2537` en `96cba5ab`), cuyo destino propuesto es «un cambio corto fuera del plan, de la terminal»
(`docs/sdd/ENTRADA.md:2537` en `96cba5ab`). Va antes del despliegue que trae el arranque estricto de `decision/arranque-bloqueado-por-consola`
(`openspec/config.yaml:6465` en `96cba5ab`), porque la §26 de `DEPLOY.md` manda cortar sesiones con `pg_terminate_backend` (`DEPLOY.md:1143-1144`).

*Sobre la cabecera.* `tanda: fuera-del-plan` con motivo: E-285 no tiene fila del plan, y fuera del plan el cambio no entra en el numerador
(`apps/desk/server/reconciliacion/comprobaciones.ts:215`). `maestro: []`: la R08.4.md no trata el pool de conexiones (búsqueda de «pool»,
«pg_terminate» y «conexión inactiva» en la copia citable: 0). `cierra: si`: se declara que el cambio deja E-285 resuelto en lo que cubre (§3) y
deja escrito lo que no cubre (§7). `toca_maestro: no`. R-2 no aplica: `zoho-sync` ya está en `openspec/config.yaml:137` en `96cba5ab`.

## 1 · Intención

Que un corte de una conexión inactiva desde el servidor —un reinicio de `desk-db` o un `pg_terminate_backend`— no tumbe la App ni el worker. Al
terminar, los dos pools que crea `packages/zoho-sync/src/db/pool.ts` escuchan su evento `error`: cuando el servidor les mata una conexión en reposo,
dejan UNA línea en el registro que dice que se perdió una conexión inactiva y el mensaje del error, sin ningún secreto, y el proceso sigue vivo; la
siguiente consulta abre otra conexión.

## 2 · Lo que hay hoy (medido en `96cba5ab`)

**2.1 · El hallazgo, todavía hipótesis.** E-285 afirma que el proceso «se cae en vez de abrir otra conexión», y lo marca como «hipótesis del
analista, no probada en ejecución» (`docs/sdd/ENTRADA.md:2534` en `96cba5ab`). Esta propuesta la mantiene como **hipótesis** hasta CA-1 (rojo) y
CA-3 (PostgreSQL real con la mutación de CA-4).

**2.2 · Los pools.** `packages/zoho-sync/src/db/pool.ts:4-11`: `createPool` (`:6`) y `createPoolFromUrl` (`:10`) devuelven un `new Pool` sin ningún
oyente y sin fijar `max`, `min` ni `idleTimeoutMillis`.

**2.3 · Qué hace `pg-pool` (3.14.0 instalado, fuera del árbol versionado; fichero index.js).** Cada cliente en reposo lleva un oyente propio
(makeIdleListener, líneas 51 a 64): ante un error, adjunta el cliente al error (línea 53, `err.client = client`), se quita y deja otro silencioso
(55 a 58), saca el cliente del pool (59) y emite `error` en el pool (62). Un `EventEmitter` sin oyente de `error` lanza la excepción (comportamiento
de Node; lo comprueba el rojo de CA-1). El oyente del cliente en reposo se quita al prestarlo con `pool.connect()` (línea 344) y se repone al
devolverlo (385); `pool.query()` pone el suyo mientras dura la consulta (464) y lo quita al acabar (469). Valores por defecto: `max` 10 (89), `min` 0
(90) e `idleTimeoutMillis` 10.000 ms (98 y 99), así que una conexión en reposo vive unos 10 s antes de que el propio pool la cierre (409 a 415).

**2.4 · Qué hace `pg` (8.21.0 instalado; fichero lib/client.js).** Un mensaje de error del servidor sin consulta en curso (líneas 415 a 428) y el
cierre del socket (192 a 218) acaban en `_handleErrorEvent` (405 a 412), que emite `error` en el cliente. **Hipótesis:** un `pg_terminate_backend`
sobre una conexión en reposo produce dos errores seguidos —el del servidor (SQLSTATE `57P01`) y el del socket cerrado— y el segundo cae en el
oyente silencioso de `pg-pool`, así que sale una sola línea por conexión perdida. CA-3 lo mide.

**2.5 · Quién usa los pools.** La App (`apps/desk/server/index.ts:18`, `createPool`), el worker `hub-sync` (`createPool` en `apps/hub-sync/src/hub-sync.ts:18`
y `createPoolFromUrl` en `apps/hub-sync/src/hub-sync.ts:53`) y el script de relleno de artículos (`apps/hub-sync/src/backfill-items.ts:31`). Fuera de
las pruebas no hay otro `new Pool(` en `apps/` ni en `packages/` (búsqueda en el worktree).

**2.6 · Clientes prestados sin oyente propio, en código de producción.** `apps/desk/server/db/transaccion.ts:16`, `apps/desk/server/db/eliminarTicket.ts:178`,
`packages/zoho-sync/src/db/repo.ts:336` y `:440`, `packages/zoho-sync/src/db/puestaAlDiaEstricta.ts:80` y `apps/hub-sync/src/hub-sync.ts:55`. En
código de producción sólo `apps/desk/server/respaldo/dependencias.ts:49` escucha `error`, y es de un proceso hijo, no de `pg`.

**2.7 · Registro.** La App registra con pino (`apps/desk/server/util/logger.ts:5-11`), que `packages/zoho-sync` no puede importar; el worker usa
`console.log`, `console.warn` y `console.error` (`apps/hub-sync/src/hub-sync.ts:27`, `:39`, `:61`). **Hipótesis sin confirmar:** que EasyPanel
enseña stderr (`docs/sdd/ENTRADA.md:2430` en `96cba5ab`).

## 3 · Alcance y enfoque

**Dentro.**
- **a · Oyente en los dos pools.** `createPool` y `createPoolFromUrl` devuelven el pool ya con su oyente de `error`. Al dispararse, deja UNA línea
  que dice que se perdió una conexión inactiva, con el mensaje del error y, si lo trae, su código SQLSTATE; nunca el objeto de error (arrastra
  `err.client`, §2.3), ni la cadena de conexión, ni usuario, contraseña o host. El proceso sigue vivo. Sirve a la App, al worker y al script.
- **b · Rojo primero (strict_tdd).** Una prueba por función emite `error` sobre un pool recién creado y espera que no lance. Hoy lanza.
- **c · Evidencia contra PostgreSQL real**, con el molde de `packages/zoho-sync/src/db/puestaAlDiaEstricta.integration.test.ts:17-18` (se salta sin `TEST_DATABASE_URL`),
  de su base propia creada y borrada (`packages/zoho-sync/src/db/puestaAlDiaEstricta.integration.test.ts:62-79`) y de sus esperas acotadas (`:23-35`).
- **d · Mutación** del oyente (CA-4), con restauración byte a byte.
- **e · `DEPLOY.md` §27, al final** (hoy la última es la §26, `DEPLOY.md:1112`): cómo es la línea y que no hay que hacer nada salvo que se repita.
- **La lógica, en un módulo nuevo** de `packages/zoho-sync/src/db/`, importable por `packages/zoho-sync/package.json:2` (`"./*": "./src/*.ts"`).

**Restricciones sobre `pool.ts`** (regla de mutación 4: 34 citas en el repositorio, 24 a la línea 5 y las demás a los rangos 4-7, 9-11, 4-11 y a la
línea 6). No se insertan, borran ni mueven líneas: la lógica cambia sólo `packages/zoho-sync/src/db/pool.ts:6` y `:10`, en sitio, y el import nuevo
va en la línea 1, en la misma línea física. Las afirmaciones que citan esas líneas («sin límites», «sin `search_path`») siguen siendo ciertas (caso A).

**Fuera.**
- Los clientes prestados por `pool.connect()` (§2.6): el oyente del pool no los cubre mientras están prestados (§2.3). Se registra como límite (§7).
- Reconectar, reintentar o reiniciar: `pg-pool` ya saca el cliente muerto (§2.3) y la siguiente consulta abre otro (lo prueba CA-3).
- Cambiar `max`, `min`, `idleTimeoutMillis`, `statement_timeout` o `connectionTimeoutMillis`.
- Ninguna variable de entorno nueva, ningún interruptor (S-3). Nada de producción. En la rama no se tocan `openspec/config.yaml`,
  `docs/sdd/ENTRADA.md`, `CLAUDE.md`, los `docs/sdd/F0-05_*`, `docs/sdd/R08.4_Expediente_de_cambios.md`, `.env.example`, `schema.sql` ni `migrate.ts`.

**Qué cubre de E-285, en una línea:** el pool deja de caerse por una conexión en reposo cortada; deja fuera el cliente prestado, que queda escrito.

## 4 · Capacidades

**Nuevas:** ninguna. **Modificadas:** `zoho-sync`, ADDED al final desde **RQ-ZS-58** (el último vivo es RQ-ZS-57,
`openspec/specs/zoho-sync/spec.md:2860`) (S-6).

## 5 · Supuestos

Todos reversibles; van a la lista semanal (`decision/preguntas-de-detalle-sin-llegar`).

| Id | Supuesto | Cómo se deshace |
|---|---|---|
| S-1 | **Por dónde sale la línea: abierto, lo cierra el diseño.** Datos: `packages/zoho-sync` no puede importar el `logger` de la App; el worker registra con `console.*`; cambiar la firma de `createPool` tocaría las líneas 4 y 9 de `pool.ts` y sus llamadores (§2.5), aunque un parámetro con valor por defecto los dejaría intactos (**hipótesis**); `console.error` y `console.warn` van a stderr y que EasyPanel lo enseñe es **hipótesis** (§2.7) | Cambiar la vía de registro |
| S-2 | La línea lleva un texto fijo, el mensaje y el código SQLSTATE si lo hay; nada más. Ni el objeto de error ni nada de la conexión | Añadir campos, sin secretos |
| S-3 | Sin interruptor: el oyente no enciende ningún escritor, así que la regla de secretos no pide uno; ninguna variable nueva | Añadir variable con su línea en `.env.example` y en `DEPLOY.md` |
| S-4 | Una línea por cada conexión perdida, sin agrupar ráfagas. Un reinicio de `desk-db` daría como mucho tantas líneas como conexiones en reposo tenga cada pool (`max` 10 por defecto, §2.3) | Agrupar con una ventana de tiempo |
| S-5 | La integración corre en un contenedor desechable `postgres:17-alpine`, nunca contra producción, que es PostgreSQL 17.11 (`docs/sdd/ENTRADA.md:2430` en `96cba5ab`); la §26 se midió contra PostgreSQL 16 (`DEPLOY.md:1127`) | Otra imagen |
| S-6 | Spec: ADDED desde RQ-ZS-58, sin MODIFIED. RQ-ZS-57 dice que `DEPLOY.md` «SHALL terminar» con la §26 (`openspec/specs/zoho-sync/spec.md:2862`); se sigue su propio precedente, que declaró la precedencia sobre RQ-ZS-51 sin modificarlo (`openspec/specs/zoho-sync/spec.md:2869-2871`). La fase de spec decide | MODIFIED de RQ-ZS-57 |
| S-7 | La lógica va en un módulo nuevo porque `pool.ts` no admite líneas nuevas (§3) | Llevarla a `pool.ts`, con barrido de citas |

**Ronda de preguntas:** no se hace. El preflight es `auto` (`openspec/config.yaml:26` en `96cba5ab`) y ninguna duda da causa de parada de la «Regla
de ejecución»: no cambia el alcance de una fila, no cuesta dinero, no toca datos de producción ni contradice una decisión. Las que habría hecho —si
una ráfaga debe agruparse (S-4), si la línea debe llegar por stdout aunque cueste tocar la firma (S-1) y si el cliente prestado merece su propio
cambio (§7)— van a la lista semanal.

## 6 · Criterios de aceptación

- **CA-1 · Rojo (b).** Por cada función —`createPool` con `dbSchema` `desk` y `public`, y `createPoolFromUrl`—, una prueba sin base emite `error`
  sobre el pool y espera que no lance. Se corre y se anota el rojo ANTES de tocar `pool.ts`.
- **CA-2 · La línea (a, S-2).** La prueba captura lo registrado: exactamente una línea por evento, con el texto fijo y el mensaje; con un error que
  trae `code`, también el código. Regla de mutación 2: el error inyectado lleva un `client` con una cadena de conexión y una contraseña-testigo, y la
  línea no contiene ninguna de las dos.
- **CA-3 · PostgreSQL real (c, S-5).** Con un pool creado por cada función, una consulta anota su `pg_backend_pid()`; con esa conexión ya en reposo,
  otra sesión la corta con `pg_terminate_backend` ANTES de que el pool la cierre por inactividad (§2.3). El proceso sigue vivo, sale una sola línea,
  y la siguiente consulta funciona con otro pid. Se anotan `SHOW server_version` y el SQLSTATE observado (**hipótesis:** `57P01`).
- **CA-4 · Mutación (d).** Sin el oyente, CA-1 y CA-3 se ponen rojas; con el objeto de error en la línea, CA-2 se pone roja. Se restaura byte a byte
  (`git diff` vacío sobre lo mutado) y se anota en el progreso.
- **CA-5 · `pool.ts` en sitio.** Mismo número de líneas y mismo final de línea; sólo cambian las líneas 1, 6 y 10; `packages/zoho-sync/src/db/pool.test.ts`
  en verde. Los llamadores (§2.5) no cambian, o sólo en sitio su línea de creación del pool si el diseño elige esa vía (S-1).
- **CA-6 · `DEPLOY.md` §27 (e)** al final, con su prueba de contenido y su mutación del fichero vigilado. La guarda «la §26 es la última»
  (`apps/desk/server/deployArranqueEstricto.test.ts:23-24` y `:54`) se corrige en sitio con el molde de
  `apps/desk/server/deployCalificacionesConversaciones.test.ts:23-24` y `:68`, sin cambiar el número de líneas.
- **CA-7 · Límite escrito.** La §27 dice que el oyente cubre las conexiones en reposo y no un cliente prestado; el informe final responde la pregunta
  del §7 con lo medido.
- **CA-8 · Las cinco comprobaciones** en una cadena: typecheck, `npm run lint -- --max-warnings 165`, detector de citas, `npm test` con log y build.

## 7 · La pregunta que el informe final responde con evidencia

¿Deja de ser necesaria la precaución de la §26 —cortar sólo la sesión de la consola (E-285, «Afecta a», `docs/sdd/ENTRADA.md:2536` en `96cba5ab`)—?

| Situación de la conexión de la App que se corta | ¿La cubre este cambio? | Evidencia esperada |
|---|---|---|
| En reposo en el pool | Sí | CA-3 |
| En una `pool.query()` en curso | **Hipótesis:** sí; la consulta rechaza y el error siguiente cae en el oyente del pool tras la liberación (§2.3) | La mide el diseño o queda como hipótesis |
| Prestada por `pool.connect()` sin consulta en curso (p. ej. entre sentencias de `enTransaccion`, `apps/desk/server/db/transaccion.ts:16-26`) | No (§3, Fuera). **Hipótesis:** excepción no capturada | La mide el diseño o queda como hipótesis |

**Hipótesis que conviene contrastar:** el pid raíz de una cadena de bloqueos tiene una transacción abierta, así que, si es de la App, es un cliente
prestado, que es el caso no cubierto. Si el informe no lo mide, su respuesta por defecto es que la precaución **sigue siendo necesaria** para las
sesiones de la App con bloqueos, y que lo que deja de tumbar la App es el corte de conexiones en reposo (un reinicio de `desk-db`).

## 8 · Tareas de persona (no son tareas de esta tanda; archivar no las da por hechas)

| Id | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Desplegar App y worker con este cambio en el mismo despliegue que el arranque estricto, o antes, y comprobar que la App escucha | Alfonso | `DEPLOY.md` §27 |

## 9 · Riesgos

- **Verde falso en la integración.** Si el corte llega después de los ~10 s de inactividad, el pool ya cerró la conexión y no hay nada que cortar:
  la prueba pasa sin probar nada. Lo caza CA-4 (sin oyente debe ponerse roja) y lo evita cortar con espera acotada por debajo de ese plazo.
- **La mutación de CA-3 lanza una excepción no capturada** dentro del proceso de vitest. **Hipótesis:** vitest lo da por fallo, pero puede tumbar el
  worker de pruebas; el diseño decide si la integración corre en un proceso hijo.
- **La línea no se ve** si sale por stderr y EasyPanel no lo enseña (S-1, §2.7).
- **Ráfaga** de hasta 10 líneas por pool en un reinicio de `desk-db` (S-4). La §27 lo dice para que no se lea como avería.
- **El caso no cubierto sigue vivo** (§7): un corte sobre un cliente prestado puede seguir tumbando la App (**hipótesis**).
- **Guardas que se rompen por construcción:** `apps/desk/server/deployArranqueEstricto.test.ts:23-24` y `:54` (CA-6).
- **Ficheros muy citados** (regla de mutación 4): `pool.ts` y `DEPLOY.md`. Edición en sitio o al final, y barrido de citas al cerrar.

## 10 · Notas para Supervisión (lo que sólo Supervisión escribe en sus ficheros)

- E-285 (`docs/sdd/ENTRADA.md:2532-2537` en `96cba5ab`) puede anotarse en sitio con lo medido en CA-3 y la respuesta del §7.
- La precaución de «Afecta a» (`docs/sdd/ENTRADA.md:2536` en `96cba5ab`) se mantiene o se retira según esa respuesta.

## 11 · Vuelta atrás

Revertir el commit devuelve los pools sin oyente: no hay migración, ni columna, ni variable de entorno. Si la línea inunda el registro, se revierte y
se redespliega la imagen anterior; el comportamiento vuelve a ser el de hoy.

## 12 · Método y cierre

Worktree propio desde `96cba5ab`; `strict_tdd` con rojo previo (CA-1); vitest sin base para CA-1 y CA-2, y PostgreSQL 17 desechable para CA-3.
**Mutaciones:** quitar el oyente; volcar el objeto de error en la línea; ensuciar la §27 de una copia de `DEPLOY.md`. Regla 13: no toca
`apps/desk/src`. Barrido de citas al cerrar sobre `pool.ts` y `DEPLOY.md`; cada intento ≤ 800 con `git diff --shortstat --no-renames` más `wc -l`
de lo no trackeado. Estimado de código y pruebas: unas 250 líneas (450 con ×1,8), un solo intento de aplicar; aparte, los artefactos y el
`verify-report.md`, que es sumando obligatorio.
