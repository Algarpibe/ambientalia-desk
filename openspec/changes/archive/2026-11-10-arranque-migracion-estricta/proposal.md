---
tanda: fuera-del-plan
motivo: "decision/arranque-bloqueado-por-consola (2): límite de espera en la puesta al día de la base con rastro en el registro, y que un cambio de base que falle detenga el arranque"
capacidad: [zoho-sync]
maestro: []
cierra: si
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta — `arranque-migracion-estricta`

Construye el paso 2 de `decision/arranque-bloqueado-por-consola` (Gerencia, 08/11/2026; `openspec/config.yaml:6465`, respuesta en `:6472`),
citada por clave. Consecuencia (2) (`openspec/config.yaml:6476-6477`): trabajo de código con ficha, publicado antes del 12/12, con destino
propuesto `fuera-del-plan`. Consecuencia (3) (`openspec/config.yaml:6478-6481`): se señala y no se discute; aquí va como riesgo (§8).

*Sobre la cabecera.* `tanda: fuera-del-plan` con el motivo de la propia decisión, que no asigna fila del plan (`openspec/config.yaml:6486`).
`maestro: []` porque la decisión no tiene pasaje (`:6484`). `cierra: si`: no hay fila que cerrar; se declara que el cambio deja el paso 2
terminado. `toca_maestro: no`: el maestro no describe la puesta al día de la base. R-2 no aplica: `zoho-sync` ya está en
`openspec/config.yaml:137`. Fuera del plan, el cambio no entra en el numerador (`apps/desk/server/reconciliacion/comprobaciones.ts:215`).

## 1 · Intención

Que el arranque de la App no vuelva a quedarse esperando sin fin y en silencio. Al terminar, la puesta al día de la base que hace el
arranque tiene un límite de espera de bloqueo; si se agota, o si una sentencia falla, el arranque se detiene con una línea en el registro
que dice qué sentencia fue y por qué, y el proceso sale con código distinto de 0. Quien despliega pasa de «servicio en verde que no
responde» a «servicio que no arranca y dice por qué».

## 2 · Lo que hay hoy (medido en `97539c73`)

**2.1 · El incidente (E-268).** `docs/sdd/ENTRADA.md:2424`: el 03/11 la App dio `502` ~1 h 50 min; la pid del arranque llevaba 1 h 46 min
esperando en `ALTER TABLE public.catalogo_modelos ADD COLUMN IF NOT EXISTS sku text` (`packages/zoho-sync/src/db/schema.sql:374`), detrás
de una sesión `psql` en `idle in transaction`, y los arranques siguientes hacían cola detrás de ella. `docs/sdd/ENTRADA.md:2425`: «una
espera de bloqueo no falla, así que no deja línea en el log».

**2.2 · El arranque.** `apps/desk/server/index.ts:26` reorganiza (`reorgToDesk`, sólo con `DB_SCHEMA=desk`); `:27` migra (`migrate`);
`:29` resiembra, best-effort, y no se toca. Todo ocurre antes de escuchar (`:57-59`). `:8` importa `migrate, reorgToDesk, reseedTicketNumber`.
Un rechazo de `main()` ya termina en `logger.error({ err }, 'Fallo al arrancar el servidor')` y `process.exit(1)` (`:106-109`).

**2.3 · La tolerancia.** `migrate()` (`packages/zoho-sync/src/db/migrate.ts:24-36`) y `reorgToDesk()` (`:126-131`) capturan cada error, lo
escriben con `console.error` («sentencia omitida», `:33`, `:129`) y siguen. Las listas de sentencias ya son funciones puras exportadas:
`schemaStatements()` (`:19-21`) y `reorgToDeskStatements()` (`:114-120`). `schema.sql` no tiene `CONCURRENTLY`, bloques `$$`, `BEGIN`
ni `COMMIT` (búsqueda sobre el fichero: 0).

**2.4 · El pool.** `packages/zoho-sync/src/db/pool.ts:4-7`: `new Pool` sin `lock_timeout` ni `statement_timeout`; con `DB_SCHEMA=desk`
fija `search_path` por conexión (`:5`), así que cualquier cliente del pool lo hereda.

**2.5 · Otros llamadores, que siguen tolerantes.** Worker: `apps/hub-sync/src/hubSync.ts:13` (`migrate`) y `apps/hub-sync/src/hub-sync.ts:47`
(`reorgToDesk`). Arnés de pruebas: `apps/desk/server/testing/appHarness.ts:38`. **123** ficheros `*.test.ts` llaman a `migrate(`
(búsqueda en el worktree), la mayoría sobre pg-mem. Hay pruebas contra PostgreSQL real que se saltan sin `TEST_DATABASE_URL`
(`apps/desk/server/db/migracionConcurrente.integration.test.ts:17-21`, que llama a los dos en `:90-91`).

**2.6 · Registro.** El `logger` es pino con `pino-pretty` (`apps/desk/server/util/logger.ts:7-11`); **hipótesis:** escribe a stdout, y las
líneas «omitida» van a stderr por `console.error`.

**2.7 · Medida del analista (10/11, registro de la App pegado por Alfonso; de segunda mano, no comprobable desde el repositorio).** En
el arranque del 08/11 a las 13:47:41 UTC no aparece ninguna línea «migrate: sentencia omitida» ni «reorgToDesk: sentencia omitida»
antes de «API en http» (`apps/desk/server/index.ts:58`). **Hipótesis:** que EasyPanel enseña stderr; si no lo enseña, la ausencia no
dice nada. Las sentencias de E-266 (`abc632ca`) aún no se han desplegado y no están medidas.

## 3 · Alcance y enfoque

**Dentro.**
- **a · Límite de espera.** La puesta al día del arranque (`index.ts:26-27`) corre con un `lock_timeout` fijado ANTES de su primera
  sentencia y vigente en todas, reorganización incluida. Si se agota, el arranque se detiene con una línea que nombra la sentencia y dice
  que se agotó el límite de espera y cuál es. **Hipótesis:** PostgreSQL lo señala con el código `55P03` (`lock_not_available`); la prueba
  de evidencia (CA-7) lo comprueba.
- **b · Un fallo detiene el arranque.** En el arranque de la App, la primera sentencia que falla detiene la puesta al día: no se ejecutan
  las siguientes, sale una línea con la sentencia y el error, y el proceso termina con código distinto de 0 (por `index.ts:106-109`).
- **Módulo nuevo** en `packages/zoho-sync/src/db/`, importable sin tocar `packages/zoho-sync/package.json:2` (`"./*": "./src/*.ts"`). Consume
  las dos listas puras (§2.3); `migrate.ts` no se toca.
- **`DEPLOY.md` §26, al final** (hoy la última es la §25, `DEPLOY.md:1068`): qué cambia en el arranque, cómo es la línea del registro, el
  valor del límite (S-2) y qué hacer si la App no arranca tras desplegar: buscar esa línea; si es un bloqueo, localizar la sesión con
  `pg_blocking_pids` y cortarla con `pg_terminate_backend` del pid raíz; si es otra sentencia que falla, volver a la imagen anterior (§10 de esta propuesta).
  Sin interruptor nuevo: lo dice la sección.

**Pregunta que resuelve y prueba el diseño, sin decidirla aquí.** **Hipótesis:** un `SET lock_timeout` de sesión enviado por `pool.query`
no garantiza que la sentencia siguiente vaya por la misma conexión. Dos salidas, no equivalentes:
1. **Cliente propio** (`pool.connect()`): `SET lock_timeout` de sesión y las sentencias una a una, en autocommit, como hoy. Obliga a devolver
   el cliente limpio (sin el `SET`) al pool, que la App sigue usando después.
2. **`SET LOCAL` dentro de una transacción**: el límite muere con el `COMMIT`, pero la puesta al día pasa a ser todo o nada y los bloqueos
   de cada `ALTER` se mantienen hasta el final, que puede frenar a otros lectores durante toda la migración.

**Restricciones sobre `index.ts`** (regla de mutación 4; 20 citas apuntan a `:26`, `:27` o `:26-27`).
- Sólo cambian `:26` y `:27`, **en sitio**: mismo número de líneas y mismo final de línea. Preferible que `:26` siga siendo «la
  reorganización» y `:27` «la migración», para que las citas que lo afirman sigan siendo caso A (`DEPLOY.md:318`, `docs/sdd/ENTRADA.md:2425`).
- **`:8` no se puede tocar**, y eso condiciona el diseño. `apps/desk/tsconfig.server.json:2-11` NO activa `noUnusedLocals` (sólo lo hacen
  `apps/desk/tsconfig.node.json:18`, que incluye sólo `vite.config.ts`, `:23-25`, y `apps/desk/tsconfig.app.json:25`, que incluye sólo
  `src`, `:30-31`), así que el typecheck no se queja.
  Pero eslint sí: `eslint.config.js:18-21` aplica `tseslint.configs.recommended` a todo `**/*.{ts,tsx}`, que fija
  `@typescript-eslint/no-unused-vars` en `error` (línea 42 de `dist/configs/flat/recommended.js` del paquete instalado
  `@typescript-eslint/eslint-plugin`, fuera del árbol versionado), y
  `eslint.config.js:29-32` no lo relaja. Si las líneas 26 y 27 de `index.ts` dejan de nombrar `reorgToDesk` o `migrate`, el lint sale con
  **error**, no con un aviso más contra 165. El diseño tiene que mantener los dos identificadores en uso desde esas dos líneas.
- `apps/desk/server/modoSinZohoIndice.test.ts:42` en `97539c73` exige UNA línea con el texto `await migrate(pool)`: si la línea 27 de `index.ts` cambia ese
  texto, se rompe por construcción y se corrige en sitio.

**Spec:** ADDED al final de `zoho-sync`, desde **RQ-ZS-52** (el último vivo es RQ-ZS-51, `openspec/specs/zoho-sync/spec.md:2696`) (S-5).

**Fuera.** El worker (`hubSync.ts:13`, `hub-sync.ts:47`) y las pruebas siguen tolerantes (S-1). `migrate()` y `reorgToDesk()` no cambian
para el resto de llamadores. `schema.sql` no se toca. `statement_timeout` y `connectionTimeoutMillis` (E-268, `docs/sdd/ENTRADA.md:2425`):
una sentencia lenta que no espera bloqueo no es el incidente. El paso 1 de la decisión (`idle_in_transaction_session_timeout` en la base de
producción, `openspec/config.yaml:6474-6475`), que es tarea de persona. Ninguna variable de entorno nueva (S-2). Nada de producción: ni
bases, ni EasyPanel, ni Zoho. En la rama, los seis de Supervisión (`CLAUDE.md`, `openspec/config.yaml`, `docs/sdd/ENTRADA.md`, los
`docs/sdd/F0-05_*` y `docs/sdd/R08.4_Expediente_de_cambios.md`).

**Qué cubre de la decisión, en una línea:** el paso 2 entero (límite de espera con rastro y fallo que detiene el arranque de la App);
deja fuera el paso 1, configuración de la base de producción, que es tarea de persona y no de esta tanda, y la medida previa de (3) (P-2).

## 4 · Capacidades

**Nuevas:** ninguna. **Modificadas:** `zoho-sync`, puesta al día estricta en el arranque de la App (RQ-ZS-52 en adelante, ADDED al final).

## 5 · Supuestos

Todos reversibles; van a la lista semanal (`decision/preguntas-de-detalle-sin-llegar`).

| Id | Supuesto | Cómo se deshace |
|---|---|---|
| S-1 | Sólo el arranque de la App es estricto. El worker y las pruebas siguen tolerantes: 123 ficheros de prueba usan `migrate()` sobre pg-mem, que omite sentencias que no soporta, y el worker migra otra base | Extender lo estricto al worker con otra ficha |
| S-2 | El límite es una constante del código, no una variable de entorno (`.env.example` lo edita Alfonso), y su valor se documenta en `DEPLOY.md` §26. Cambiarlo pide publicar | Convertirlo en variable, con su línea en `.env.example` |
| S-3 | **`lock_timeout` de 10 s por sentencia.** Razón: una sentencia que espera un bloqueo exclusivo pone en cola detrás de sí a todo lector posterior de esa tabla —fue la cola del 03/11, `docs/sdd/ENTRADA.md:2424`—, así que el límite es también lo más que la propia migración puede congelar una tabla a los demás. 10 s es mucho más que una transacción corta normal de la App (**hipótesis:** milisegundos) y frente a las 1 h 46 min deja la parada en segundos. No es un tope total: cada sentencia espera como mucho eso, y la primera que lo agota detiene el arranque | Cambiar la constante |
| S-4 | La decisión dice «corrección de migrate.ts» (`openspec/config.yaml:6472`); se lee como el comportamiento decidido y se construye en un módulo nuevo que reutiliza las listas de `migrate.ts`, porque `migrate.ts` está muy citado (regla de mutación 4) y lo usan llamadores que siguen tolerantes (S-1) | Llevar la lógica a `migrate.ts`, en sitio |
| S-5 | Spec: ADDED desde RQ-ZS-52, sin MODIFIED. RQ-ZS-10 sigue diciendo que `reorgToDesk` «SHALL ser tolerante por sentencia» y que corre en `index.ts:26` (`openspec/specs/zoho-sync/spec.md:353-355`): sigue siendo cierto de la función, pero el requisito nuevo declara que en el arranque de la App prevalece lo estricto. RQ-ZS-51 dice que `DEPLOY.md` «SHALL terminar» con la §25 (`spec.md:2698`), como RQ-ZS-47 lo decía de la §24 (`spec.md:2551`) y se dejó así al añadir la §25; la fase de spec decide si sigue ese precedente | MODIFIED de RQ-ZS-10 y RQ-ZS-51 |
| S-6 | La línea del fallo sale por el `logger` (pino) a través del `main().catch` que ya existe (`index.ts:106-109`), no por `console.error`, para no depender de que EasyPanel enseñe stderr (§2.7). Lleva la sentencia (sin datos: el esquema no contiene ninguno), el error y, si es el límite, el valor | Otra vía de registro |
| S-7 | Si E-3 (`design.md` §6) no ve la línea en el registro (**hipótesis:** pino con transporte en hilo aparte puede no vaciarse antes de `process.exit(1)`), el módulo escribe ADEMÁS la misma línea por `console.error`, síncrona, justo antes de lanzar; `index.ts:106-109` no se toca. Se aplica y se sigue, sin parar | Quitar el `console.error` del módulo |

**Ronda de preguntas:** no se hace. El preflight es `auto` (`openspec/config.yaml:26`) y ninguna duda da causa de parada de la «Regla de
ejecución»: no cambia el alcance de una fila, no cuesta dinero, no toca datos de producción ni contradice la decisión. Las que habría hecho
—si 10 s es el valor (S-3), si el worker debe ser estricto también (S-1) y si la §26 basta como procedimiento ante un arranque detenido—
van a la lista semanal.

## 6 · Criterios de aceptación

- **CA-1 · Posición (regla de mutación 1).** El límite se fija ANTES de la primera sentencia y la reorganización va ANTES que la migración.
  Una prueba registra el orden de lo que recibe la conexión y se pone roja si el `SET` pasa detrás de la primera sentencia o si se invierte
  el orden de las dos listas; las dos mutaciones se reproducen y se anotan.
- **CA-2 · Fallo que detiene.** Ante una sentencia que falla, la puesta al día rechaza con un error que nombra la sentencia y la causa, y las
  siguientes no se ejecutan (mutación: volver a tolerar ⇒ rojo). En el arranque, ese rechazo llega a `index.ts:106-109`: salida 1.
- **CA-3 · Límite agotado.** El error por límite se distingue de otro fallo y su texto dice «límite de espera», la sentencia y el valor.
- **CA-4 · Conexión limpia.** Al terminar, bien o mal, el pool no queda con una conexión que conserve el límite ni con una transacción
  abierta (según la salida que elija el diseño).
- **CA-5 · Lo tolerante sigue igual.** `git diff` vacío sobre `packages/zoho-sync/src/db/migrate.ts` y `packages/zoho-sync/src/db/schema.sql`;
  `apps/hub-sync/src/hubSync.ts:13` y `apps/hub-sync/src/hub-sync.ts:47` intactos; los 123 ficheros de prueba, en verde.
- **CA-6 · `index.ts` en sitio.** Mismo número de líneas y mismo final de línea; sólo cambian `:26` y `:27`; `:8` intacta; sin errores
  nuevos de lint; `apps/desk/server/modoSinZohoIndice.test.ts:42` en verde (corregida en sitio si hace falta).
- **CA-7 · Evidencia contra PostgreSQL real y desechable** (imagen local `postgres:16-alpine`, nunca producción): sobre una base vacía la
  puesta al día estricta pasa dos veces seguidas (idempotencia); con una sesión que retiene un bloqueo en `public.catalogo_modelos` se
  detiene en torno al límite con la línea de CA-3. Dentro de la suite con el molde `TEST_DATABASE_URL` o fuera de ella: lo decide el diseño.
- **CA-8 · `DEPLOY.md` §26** al final, con su prueba de contenido; la guarda «la §25 es la última»
  (`apps/desk/server/deployCalificacionesConversaciones.test.ts:24`, `:67-68`) corregida en sitio con el molde «es la última hasta la §N»
  de `apps/desk/server/deployControlCalidad.test.ts:17`, sin desplazar líneas.
- **CA-9 · Las cinco comprobaciones** en una cadena: typecheck, `npm run lint -- --max-warnings 165`, detector de citas, `npm test` con log
  y build.

## 7 · Tareas de persona (no son tareas de esta tanda; archivar no las da por hechas)

| Id | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Desplegar antes del 12/12 y comprobar que la App escucha | Alfonso | `DEPLOY.md` §26 |
| P-2 | Antes de desplegar, la medida de la consecuencia (3): confirmar si el registro de la App enseña stderr y, si lo enseña, buscar líneas «sentencia omitida» en arranques recientes | analista, con el registro de Alfonso | `DEPLOY.md` §26 |
| P-3 | El paso 1 de la decisión (`idle_in_transaction_session_timeout`), con copia previa | Alfonso | `openspec/config.yaml:6474-6475` |

## 8 · Riesgos

- **Consecuencia (3), que no se resuelve aquí.** Si alguna sentencia falla en CADA arranque de producción y hoy se omite en silencio, con
  este cambio la App deja de arrancar. La medida del analista (§2.7) no lo descarta: depende de la hipótesis de stderr, y las sentencias de
  E-266 no están medidas. Lo que sí hace el cambio: la caída diría qué sentencia es, y la vuelta atrás es la imagen anterior (§10).
- **Bucle de reinicios. Hipótesis:** EasyPanel reinicia el contenedor al salir con 1; cada intento espera como mucho el límite y se detiene
  con su línea mientras el bloqueo siga. El `502` dura lo que tarde una persona en cortar la sesión, como el 03/11, pero ahora con rastro.
- **El límite corta pronto.** Con 10 s (S-3), una transacción legítima larga de otra instancia durante el despliegue detendría el arranque.
  **Hipótesis:** no existe en la App; la línea lo diría y el siguiente reinicio lo reintentaría.
- **Salida de diseño.** La transacción única (opción 2) retiene bloqueos hasta el `COMMIT`; el cliente propio (opción 1) exige limpiar la
  sesión. El diseño elige y lo prueba (CA-4).
- **Guardas que se rompen por construcción:** `deployCalificacionesConversaciones.test.ts:24`, `:67-68` (CA-8) y, según el texto de la línea 27
  de `index.ts`, `modoSinZohoIndice.test.ts:42` (CA-6). `apps/desk/server/reconciliacion/registro.test.ts:218-220` NO cambia: lo `fuera-del-plan` no
  entra en «en curso» (`comprobaciones.ts:215`).
- **Ficheros muy citados** (regla de mutación 4): `index.ts`, `DEPLOY.md`. Edición en sitio o al final, y barrido de citas al cerrar.

## 9 · Notas para Supervisión (lo que sólo Supervisión escribe en los seis ficheros)

- `docs/sdd/ENTRADA.md:2425` cita `index.ts:27` como «el arranque migra antes de escuchar» y `migrate.ts` como el que «sólo registra las que
  fallan»: lo primero seguirá siendo cierto; lo segundo pasa a ser cierto sólo del worker y las pruebas. E-268 puede anotarse en sitio.
- La consecuencia (3) cita la tolerancia de `migrate.ts` (`openspec/config.yaml:6478-6479`): sigue siendo cierta de la función (S-1).
- S-3 (10 s) y S-1 (worker tolerante) son los supuestos que más conviene que Gerencia lea en la lista semanal.

## 10 · Vuelta atrás

Revertir el commit devuelve el arranque tolerante: no hay migración de datos, ni columna nueva, ni variable de entorno. Si tras desplegar
la App no arranca por una sentencia que falla siempre, la salida inmediata es redesplegar la imagen anterior, que la omite como hoy; si es
un bloqueo, basta cortar la sesión (`DEPLOY.md` §26) y el siguiente reinicio arranca.

## 11 · Método y cierre

Worktree propio desde `97539c73`; `strict_tdd` con rojo previo; vitest con una conexión falsa que registra lo que recibe, y la evidencia de
CA-7 contra PostgreSQL real local. **Mutaciones:** el `SET` detrás de la primera sentencia; las dos listas en orden inverso; volver a
tolerar; quitar el valor del texto de la línea. **Fichero vigilado** (regla de mutación 2): la prueba de la §26 ensucia una copia de
`DEPLOY.md`. Regla 13: no toca `apps/desk/src`. Barrido de citas al cerrar; cada intento ≤ 800 con `git diff --shortstat --no-renames`
más `wc -l` de lo no trackeado. Estimado de código y pruebas: unas 300 líneas (540 con ×1,8), un solo intento de aplicar; aparte, los
artefactos y el `verify-report.md`, que es sumando obligatorio.
