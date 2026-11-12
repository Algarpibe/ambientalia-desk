# Diseño — `pool-conexion-cortada`

Construye RQ-ZS-58 a RQ-ZS-62 (`specs/zoho-sync/spec.md`) con los supuestos S-1 a S-7 de `proposal.md` y los nuevos D-1 a D-9 (§12). Todo lo
citado se comprobó en el worktree sobre `96cba5ab`; lo que no, lleva «hipótesis». Lo de `node_modules` (no versionado) se nombra en prosa.
No hay variable de entorno nueva ni se tocan `migrate.ts`, `schema.sql` ni `.env.example`. Ninguna sentencia crea tablas: la regla de diseño
de calificar el esquema (`openspec/config.yaml:3128` en `96cba5ab`) no tiene a qué aplicarse.

## 1 · Enfoque en una línea

Un módulo nuevo, `packages/zoho-sync/src/db/conexionPerdida.ts`, exporta una función **pura** que arma la línea y otra que **engancha** el
oyente de `error` en un pool con un `registrar` opcional (por defecto `console.error`); `pool.ts` envuelve en sitio sus dos `new Pool(...)` con
ella, sin pasarle nada. La evidencia contra PostgreSQL real corre en un **proceso hijo**, que es lo único que puede morir sin tumbar a vitest.

## 2 · Decisión 1 — S-1: por dónde sale la línea

| Opción | A favor | En contra | Decisión |
|---|---|---|---|
| **(a)** `console.error` por defecto en el módulo, inyectable; `pool.ts` no pasa nada | Es la convención del paquete para fallos (`packages/zoho-sync/src/db/migrate.ts:33`, `packages/zoho-sync/src/sync.ts:132`); mismo canal que «sentencia omitida», cuya visibilidad ya es la P-2 de la §26 (`DEPLOY.md:1146`); firmas de `pool.ts:4` y `:9` intactas | Que EasyPanel enseñe stderr es **hipótesis** (`docs/sdd/ENTRADA.md:2430` en `96cba5ab`: la ausencia de «sentencia omitida» no lo prueba) | **Elegida** |
| (b) `console.log` (stdout) | El stdout del worker se lee en producción (dato de memoria del analista sobre `apps/hub-sync/src/hub-sync.ts:42`: **hipótesis**) | Un fallo por el canal informativo, contra la convención del paquete | Supuesto reversible (D-1) |
| (c) parámetro `registrar` en `createPool`/`createPoolFromUrl` con valor por defecto | Los llamadores podrían pasar el `logger` de la App | Cambia `pool.ts:4` y `:9`, que la restricción del encargo deja intactas | Descartada |
| (d) pino dentro de `packages/zoho-sync` | Formato igual al de la App (`apps/desk/server/util/logger.ts:5-11`) | El paquete no puede importar el `logger` de la App; meter pino cambiaría también el registro del worker | Descartada |

**Elección: (a).** El objetivo duro —que el proceso siga vivo— no depende del canal; la línea es diagnóstico. El `registrar` opcional sigue
el molde de `avisar?: (linea: string) => void` (`packages/zoho-sync/src/modoSinZoho.ts:89`), y las pruebas lo inyectan o espían `console.error`.
Pasar a stdout es una línea del módulo nuevo, sin tocar `pool.ts` ni llamadores (D-1). La §27 propone a la persona una comprobación opcional
que cierra la hipótesis de stderr para esta línea y para «sentencia omitida» a la vez (§8).

## 3 · Decisión 2 — el módulo, su API y la línea

```ts
import type { EventEmitter } from 'node:events'
export const TEXTO_CONEXION_PERDIDA = 'Pool de la base: se perdió una conexión inactiva; el proceso sigue'
export type Registrar = (linea: string) => void
export function lineaConexionPerdida(err: unknown): string          // pura; nunca lanza
export function escucharConexionPerdida<P extends EventEmitter>(pool: P, registrar: Registrar = (l) => console.error(l)): P
```

- **Forma de la línea (D-2):** `<TEXTO> — <mensaje> [<código>]`; sin `code`, sin corchetes. Ejemplo esperado (**hipótesis** hasta I-1):
  `Pool de la base: se perdió una conexión inactiva; el proceso sigue — terminating connection due to administrator command [57P01]`.
- **Nunca el objeto de error.** `pg-pool` hace `err.client = client` antes de emitir (líneas 51 a 64 de su `index.js`, `makeIdleListener`) y emite
  `('error', err, client)`: el oyente lee sólo `message` y `code`, ignora el segundo argumento y llama al `registrar` con **un solo argumento**.
- **Saneado del mensaje (D-3):** espacios y saltos colapsados a uno (una línea física) y toda URL (`esquema://…`) sustituida por `<url omitida>`,
  para que una cadena de conexión que algún día venga en un mensaje no llegue al registro (regla de secretos).
- **Código (D-4):** se añade si `code` es una cadena `[A-Za-z0-9_]{1,32}` —SQLSTATE o código de Node como `ECONNRESET`—; otro valor se omite.
- **No es un `Error` (D-5):** una cadena se usa como mensaje, saneada; cualquier otro valor da «valor no Error (<typeof>)», nunca `String()` ni
  `JSON.stringify` de un objeto. Si algo falla al armarla (p. ej. un `message` con getter que lanza), devuelve `<TEXTO> — (sin detalle)`.
- **El oyente no lanza:** `registrar(lineaConexionPerdida(err))` va dentro de `try`; un `catch` con comentario (lo exige `no-empty`) lo ignora,
  porque un registro que lanzara dentro del `emit` volvería a tumbar el proceso. El `pool.on('error', …)` va en **su propia línea** (mutación M-1).
- **Genérico sobre `EventEmitter`:** el `Pool` de `pg` lo extiende, así que `createPool` sigue devolviendo `Pool` sin cambiar `pool.ts:4` ni `:9`, y
  la prueba usa un `EventEmitter` como pool falso. Que `tsc` lo acepte sin aserciones es **hipótesis** que cierra el typecheck de L1.

**Alternativa descartada — cubrir también el cliente prestado** (`pool.on('connect', c => c.on('error', …))`): está fuera del alcance (§3 de la
propuesta), duplicaría la línea de una conexión en reposo (el oyente del cliente y el del pool) y cambiaría lo que ven seis llamadores con
transacción sin pruebas propias. Queda medido como límite (I-4) para un cambio posterior.

## 4 · Decisión 3 — `pool.ts` en sitio (RQ-ZS-61)

Texto de las tres líneas (final CRLF del worktree intacto; 11 líneas antes y después):

```ts
import { Pool } from 'pg'; import { escucharConexionPerdida } from './conexionPerdida'
  return escucharConexionPerdida(new Pool({ connectionString: config.databaseUrl, ...opts }))
  return escucharConexionPerdida(new Pool({ connectionString }))
```

Dos importaciones en una línea física tienen precedente en `apps/hub-sync/src/hub-sync.ts:4`, que pasa el lint. `pool.ts:5` no cambia: las 18
citas a esa línea («`search_path` sólo con `desk`») siguen siendo caso A (§10). La prueba existente sigue en verde sin tocarla:
`packages/zoho-sync/src/db/pool.test.ts` comprueba `typeof query` (`:9`) y `options.options` (`:17`, `:20`), y el envoltorio devuelve el mismo `Pool`. Los cuatro
llamadores (`apps/desk/server/index.ts:18`, `apps/hub-sync/src/hub-sync.ts:18` y `:53`, `apps/hub-sync/src/backfill-items.ts:31`) no cambian.

## 5 · Pruebas unitarias — `packages/zoho-sync/src/db/conexionPerdida.test.ts` (strict_tdd)

Sin base. `vi.spyOn(console, 'error').mockImplementation(() => {})` captura lo que `createPool` registra por defecto; cada pool se cierra con `end()`.

| Id | Qué fija | Escenario |
|---|---|---|
| U-1 | **ROJO previo.** Para `createPool` con `desk`, con `public` y `createPoolFromUrl`: `listenerCount('error') === 1` y `emit('error', new Error('x'))` no lanza | RQ-ZS-58.1-3 |
| U-2 | Sin `code`: el espía recibe **una** llamada, con **un** argumento de tipo cadena, sin `\n`, que contiene `TEXTO_CONEXION_PERDIDA` y el mensaje, y no contiene `[` | RQ-ZS-59.1, .2 |
| U-3 | Con `code` `57P01`: la línea termina en `[57P01]` | RQ-ZS-59.2 |
| U-4 | **Mutación 2:** `err.client` falso con `connectionString` `postgres://usuario-testigo:TESTIGO-7Q@host-testigo:5432/db` y `connectionParameters.password` `TESTIGO-7Q`: la línea no contiene `TESTIGO-7Q`, `host-testigo`, `usuario-testigo` ni `postgres://` | RQ-ZS-59.3 |
| U-5 | Tres errores seguidos sobre el mismo pool → tres llamadas, una por evento | RQ-ZS-59.4 |
| U-6 | Mensaje con salto de línea y con una URL con contraseña-testigo → una sola línea física, `<url omitida>` y ningún testigo | D-3 |
| U-7 | `lineaConexionPerdida` con cadena, `undefined`, `null`, objeto con `toString` que devuelve un testigo y `Error` con getter de `message` que lanza: no lanza, contiene el texto fijo y ningún testigo | D-5 |
| U-8 | `escucharConexionPerdida(new EventEmitter(), registrarQueLanza)`: `emit('error', …)` no lanza | §3 |
| U-9 | Tiempos y límites: `max`, `min`, `idleTimeoutMillis`, `statement_timeout` y `connectionTimeoutMillis` de cada pool son iguales a los de un `new Pool` con las mismas opciones que fijaba `96cba5ab` | RQ-ZS-58.5 |
| U-10 | **Forma de `pool.ts`** (molde de la prueba de índice de `arranque-migracion-estricta`): 11 líneas, finales homogéneos (todos `\r\n` o ninguno, vale en Windows y en el CI); las 2-5, 7-9 y 11 idénticas a `96cba5ab` (literales en la prueba); la 1 empieza por `import { Pool } from 'pg'` e importa de `./conexionPerdida`; sólo la 6 y la 10 contienen `escucharConexionPerdida(new Pool(` | RQ-ZS-61.1, CA-5 |

**Orden del rojo:** U-1 se escribe primero importando **sólo** `./pool`, se corre y se anota el rojo («lanza»), no un «módulo inexistente»;
después el módulo, el resto de pruebas y las tres líneas de `pool.ts`.

## 6 · Arnés de integración en proceso hijo (RQ-ZS-60) y las dos mediciones del §7

**Ficheros.** Padre: `packages/zoho-sync/src/db/conexionPerdida.integration.test.ts`. Hijo: `packages/zoho-sync/src/db/testing/hijoConexionCortada.ts`
(no es `.test.ts`, así que vitest no lo ejecuta, `vitest.config.ts:17-20`; `tsc -b` sí lo tipa, `packages/zoho-sync/tsconfig.json:1`).

**Cómo se lanza (D-6).** `spawn(process.execPath, [<raíz>/node_modules/tsx/dist/cli.mjs, <hijo>, <modo>], { cwd: <raíz>, stdio: 'pipe', env })`,
asíncrono y sin shell: el `bin` de tsx 4.22.4 es ese `cli.mjs` (comprobado en el worktree) y es el mismo ejecutor que producción
(`package.json:16-17`). Molde de `process.execPath`: `apps/desk/server/citas/instalador.test.ts:18`. Asíncrono porque un fichero que no cede al
bucle choca con el vencimiento de 60 s de vitest (`vitest.config.ts:65-97`). `env` = el del padre con `TEST_DATABASE_URL` apuntando a la base
propia —la convención de pruebas ya existente, no una variable nueva— y **sin** `NODE_OPTIONS` (defensivo; que vitest lo fije es **hipótesis**).

**Base y esperas.** Molde de `packages/zoho-sync/src/db/puestaAlDiaEstricta.integration.test.ts`: se salta sin `TEST_DATABASE_URL` (`:17-18`), `dormir`/`hasta`/`conPlazo` (`:20-35`),
base propia creada y borrada con `WITH (FORCE)` (`packages/zoho-sync/src/db/puestaAlDiaEstricta.integration.test.ts:62-79`) y `sinSesiones` (`:44-49`). `beforeAll` anota
`SHOW server_version` (`console.info` y `apply-progress.md`). Corre también en el CI (`.github/workflows/ci.yml:45-47`, servicio `postgres:17`, `:11-12`);
cada `it` lleva su plazo propio (60 s), que prevalece sobre el `--testTimeout=20000` del CI.

**Protocolo** (una línea JSON por paso en el stdout del hijo; el padre lee el stderr entero):

```
padre (vitest)                                   hijo (node + CLI de tsx, pool de la función REAL, sin oyente propio)
                                                 crea el pool según <modo>; consulta pg_backend_pid()
  <── {"paso":"listo","pid":N,"total":1,"reposo":1} ──
  pg_stat_activity(N): estado y application_name   (anti falso verde: «idle», o lo que pida el modo)
  pg_terminate_backend(N) debe dar true; espera acotada a que N desaparezca
  ── "cortado\n" por stdin ──>                     espera acotada a pool.totalCount === 0; nueva consulta
  <── {"paso":"despues","pid":M} ──                pool.end(); sale 0
  salida 0 · una línea con el texto fijo en stderr · M ≠ N · SQLSTATE leído de la línea
```

El hijo sale con 3 si se cierra su stdin sin «cortado» y con 4 por un temporizador propio de 40 s (`unref`): no queda huérfano aunque el padre
mate al CLI de tsx en Windows. **Anti falso verde** (riesgo §9 de la propuesta): estado `idle` justo antes del corte, `pg_terminate_backend` igual a
`true` (sobre un pid ya cerrado por inactividad daría `false`) y menos de 8 s entre «listo» y el corte, dentro de los 10 s de `idleTimeoutMillis`
por defecto (líneas 98 a 100 del `index.js` de pg-pool), que `pool.ts` no cambia. El arranque de tsx no cuenta: la ventana empieza en «listo».

| Id | Modo del hijo | Qué afirma |
|---|---|---|
| I-1 | `reposo-desk` (`createPool`, `dbSchema` `desk`) | RQ-ZS-60.1: salida 0, **una** línea, `[57P01]` (**hipótesis**; se fija lo observado), pid nuevo |
| I-2 | `reposo-url` (`createPoolFromUrl`) | RQ-ZS-60.2: lo mismo |
| I-3 | `en-curso`: tras el pid, `pool.query('SELECT pg_sleep(30)')`; el padre espera estado `active` | «CARACTERIZACIÓN · consulta en curso»: la consulta rechaza (código observado), el proceso sigue y el número de líneas observado (0 o 1: tras el rechazo, `pg-pool` repone su oyente en la liberación, líneas 384 a 397, pero el cierre posterior puede no emitir nada) queda fijado |
| I-4 | `prestado`: `pool.connect()`, `BEGIN` y pid, sin liberar; el padre espera `idle in transaction` | «LÍMITE · cliente prestado con transacción abierta» (el caso de `apps/desk/server/db/transaccion.ts:16-26` y del pid raíz de la §26): **hipótesis** salida ≠ 0 con el `57P01` en stderr y ninguna línea del texto fijo; se fija lo observado |

I-3 e I-4 son caracterización (D-7): se corren primero como medición y su valor esperado se fija a lo observado; no tienen rojo previo y su
título lo dice. Responden con evidencia la pregunta del §7.
**E-1, a mano en L2:** `docker exec pcc-pg psql -U postgres -c "SELECT application_name FROM pg_stat_activity WHERE pid = pg_backend_pid()"`,
para saber cómo se distingue la consola de la App (que `psql` se anuncie como `psql` es **hipótesis**); I-1 anota el `application_name` del pool.

**Contenedor (S-5, D-9):** `docker run --rm -d --name pcc-pg -p 55433:5432 -e POSTGRES_PASSWORD=postgres postgres:17-alpine`, espera a
`pg_isready`, `TEST_DATABASE_URL=postgres://postgres:postgres@localhost:55433/postgres npx vitest run packages/zoho-sync/src/db/conexionPerdida.integration.test.ts`,
y `docker stop pcc-pg` al terminar (el `--rm` lo borra). Nunca producción. Si la imagen no se puede traer, rige el «cómo se deshace» de S-5.

## 7 · Mutaciones (CA-4) y restauración

Cada una se aplica con `perl -i -pe '... if $. == N'` (nunca `sed -i`, que pasa a LF), se corre, se anota el rojo y se restaura. **Antes de mutar,
`git add` del fichero** (módulo y prueba son nuevos y sin seguimiento, así que `git diff` no los vería; `pool.ts` ya difiere de `HEAD` tras L1):
tras restaurar, `git diff --quiet -- <fichero>` compara contra el índice, y `file` confirma el CRLF.

| Mutación | Lote | Se pone roja |
|---|---|---|
| M-1 · comentar la línea `pool.on('error', …)` del módulo | L1 y L2 | U-1 (las tres), U-2 a U-5; I-1 e I-2 (el hijo muere: salida ≠ 0); se anota qué hace I-3 sin oyente |
| M-2 · `pool.ts:10` vuelve a `return new Pool({ connectionString })` | L1 y L2 | sólo los casos de `createPoolFromUrl` de U-1, U-10 e I-2: el cableado es por función |
| M-3 · el mensaje de la línea pasa a `JSON.stringify(err)` | L1 | U-4 |
| M-4 · el oyente llama `console.error(linea, err)` en vez de `registrar(linea)` | L1 | U-2 y U-4 (dos argumentos) |
| M-5 · quitar el `try` del oyente | L1 | U-8 |
| M-6 · quitar la sustitución de URL | L1 | U-6 |

## 8 · `DEPLOY.md` §27 y la guarda de la §26 en sitio (RQ-ZS-62)

**§27, al final** (la última es hoy la §26, `DEPLOY.md:1112`; nada se mueve). Se escribe en L3, **después** de las mediciones de L2:

```
## 27. Conexión de la base cortada por el servidor: una línea en el registro y el proceso sigue (E-285)
  párrafo: los dos pools de `pool.ts` escuchan su evento `error`; sirve a la App, al worker `hub-sync` y al relleno de artículos.
  **No hay interruptor nuevo** ni variable de entorno nueva ni línea para `.env.example`.
### Cómo es la línea del registro
  por stderr (`console.error`), una por conexión perdida; el texto fijo y el ejemplo medido en I-1, con su SQLSTATE y la versión
### Qué hacer
  nada, salvo que se repita; un reinicio de `desk-db` da hasta tantas líneas como conexiones en reposo tenga cada pool (S-4);
  si se repite sin reinicio ni corte, pasar la línea al analista. Opcional, de persona: cortar una conexión `idle` de la App y buscar la
  línea; si no aparece, EasyPanel no enseña stderr (cierra también la P-2 de la §26) y se aplica D-1
### Lo que no cubre
  un cliente prestado por `pool.connect()` (transacción en curso): lo medido en I-4; la precaución de la §26 sigue vigente para las
  sesiones de la App con bloqueos: cortar sólo la de la consola (cómo distinguirla: lo medido en E-1)
```

**Prueba nueva** `apps/desk/server/deployPoolConexionCortada.test.ts` (molde `apps/desk/server/deployArranqueEstricto.test.ts:17-31`): pura
`faltasSeccion27(texto)` que exige la §27 detrás de la §26 y como última; «### Cómo es la línea del registro», «### Qué hacer», «### Lo que no
cubre», `57P01`, `salvo que se repita`, `conexiones en reposo`, `pool.connect()`, `stderr`, `§26` y `No hay interruptor nuevo`; y el texto fijo
**importado** de `@ambientalia/zoho-sync/db/conexionPerdida` (`packages/zoho-sync/package.json:2`), no copiado: si el código cambia la línea, la
§27 se pone roja (molde H5: dos copias de la misma noción enfrentadas). Mutación 2 sobre copias: sin «salvo que se repita», sin `pool.connect()`
y con `## 28. Otra` detrás; más la copia sin §27. Cada una da su falta exacta.

**Guarda de la §26, en sitio** (`apps/desk/server/deployArranqueEstricto.test.ts`; molde `apps/desk/server/deployCalificacionesConversaciones.test.ts:9`, `:23-24`, `:67-68`):
- `:9` «es la última» pasa a «es la última hasta la §27».
- `:23` `const seccion = texto.slice(s26, texto.indexOf('## 27. ') > s26 ? texto.indexOf('## 27. ') : undefined)`. Hace falta acotar: sin ello
  las cadenas de la §27 (`pg_terminate_backend`, `No hay interruptor nuevo`) satisfarían las de la §26 y la prueba dejaría de discriminar.
- `:24` sólo cambia la falta: `'la §26 sola hasta la §27'`.
- `:53` título: `discrimina por posición: una §26 que no es la que precede a la §27, o que no existe, tiene falta`.
- `:54` `expect(faltasSeccion26(deploy.replace('## 27. ', '## 99. Otra\n## 27. '))).toEqual(['la §26 sola hasta la §27'])`.
- El fichero conserva sus 57 líneas. `:42` sigue sirviendo: el `split` global de `pg_terminate_backend` toca también la §27, pero sólo se mira la §26.

`deployCalificacionesConversaciones.test.ts` ya corta en la `## 26. ` (`:23`) y no cambia. `apps/desk/server/reconciliacion/registro.test.ts`
no se ve afectado: lo `fuera-del-plan` no entra en «en curso» (`apps/desk/server/reconciliacion/comprobaciones.ts:215`).

## 9 · Ficheros

| Fichero | Acción | Lote |
|---|---|---|
| `packages/zoho-sync/src/db/conexionPerdida.ts` | Crear (§3) | L1 |
| `packages/zoho-sync/src/db/conexionPerdida.test.ts` | Crear (U-1 a U-10) | L1 |
| `packages/zoho-sync/src/db/pool.ts` | Modificar en sitio `:1`, `:6`, `:10` | L1 |
| `packages/zoho-sync/src/db/testing/hijoConexionCortada.ts` | Crear (hijo, §6) | L2 |
| `packages/zoho-sync/src/db/conexionPerdida.integration.test.ts` | Crear (I-1 a I-4) | L2 |
| `DEPLOY.md` | Añadir §27 al final | L3 |
| `apps/desk/server/deployPoolConexionCortada.test.ts` | Crear (§8) | L3 |
| `apps/desk/server/deployArranqueEstricto.test.ts` | Modificar en sitio `:9`, `:23`, `:24`, `:53`, `:54` | L3 |
| `pool.test.ts`, llamadores del pool, `migrate.ts`, `schema.sql`, `.env.example` | Sin cambios | — |

## 10 · Barrido de citas de `pool.ts` (regla de mutación 4, en L3)

Búsqueda completa en el worktree, fuera de `openspec/changes/archive/` (excluido del detector): **26** citas, no las 34 de la propuesta (que
incluyen, **hipótesis**, el archivo; L3 lo remide). Ninguna línea se mueve, así que el detector no puede ponerse rojo; cambia lo que afirman:
- **Caso A (siguen ciertas).** Las 18 a la línea 5: `DEPLOY.md:320`, `CLAUDE.md:199`, `packages/zoho-sync/src/db/migrate.ts:88`, `packages/zoho-sync/src/db/migrate.test.ts:395`,
  `openspec/specs/zoho-sync/spec.md:357`, `:418`, `:706`, `openspec/specs/tickets-core/spec.md:1503` y diez en `docs/sdd/Paquete_de_Despliegue_*`.
  `openspec/specs/zoho-sync/spec.md:2721` (rango 4-7, «no fija límite alguno»); `docs/sdd/ENTRADA.md:2425` y `:2430` en `96cba5ab` (línea 6, sin
  `lock_timeout` ni `statement_timeout`); `openspec/changes/pool-conexion-cortada/proposal.md:76` y
  `openspec/changes/pool-conexion-cortada/specs/zoho-sync/spec.md:18`, que citan la 6 y la 10 como las líneas a editar.
- **Caso B (ciertas en `96cba5ab`, falsas desde este cambio), en artefactos propios:** `openspec/changes/pool-conexion-cortada/proposal.md:35` y
  `openspec/changes/pool-conexion-cortada/specs/zoho-sync/spec.md:24` citan el rango 4-11 como pools «sin oyente»: L3 añade en sitio
  «en `96cba5ab`» a esas dos citas, sin mover líneas (el delta se fusiona a la spec viva al archivar).
- **Seis de Supervisión: se LISTAN, no se editan.** `docs/sdd/ENTRADA.md:2533` en `96cba5ab` (E-285, «crea los dos pools sin escuchar su evento
  `error`»): **B**; su «Afecta a» (`:2536`) se mantiene o se retira según I-4. `CLAUDE.md:199`: A. `openspec/config.yaml` no cita `pool.ts`.
- **Segundo pase humano** de la forma abreviada en los ficheros que citan `pool.ts`, y de las citas a `deployArranqueEstricto.test.ts:23-24` y `:54`.

## 11 · Lotes para `sdd-tasks`

| Lote | Contenido | Bruto | ×1,8 |
|---|---|---|---|
| L1 | U-1 rojo; módulo; U-2 a U-10; `pool.ts` en sitio; M-1 a M-6; `pool.test.ts` en verde; typecheck y lint | ~240 | ~430 |
| L2 | Hijo; integración I-1 a I-4; contenedor; M-1 y M-2 sobre la integración; E-1; versión y SQLSTATE en `apply-progress.md` | ~310 | ~560 |
| L3 | §27 con lo medido; su prueba y sus copias; guarda de la §26 en sitio; barrido §10; las cinco comprobaciones (CA-8) | ~180 | ~325 |

Orden obligado: L2 necesita el oyente de L1, y la §27 de L3 escribe lo medido en L2. Cada lote cierra con `git diff --shortstat --no-renames`
contra su partida más `wc -l` de lo nuevo sin trackear.

## 12 · Supuestos del diseño (a la lista semanal)

| Id | Supuesto | Cómo se deshace |
|---|---|---|
| D-1 | La línea sale por `console.error` (stderr) | Cambiar el `registrar` por defecto del módulo a `console.log` y la frase de la §27 |
| D-2 | Texto fijo y forma `<texto> — <mensaje> [<código>]` | Cambiar la constante; la prueba de la §27 la importa y obliga a reescribirla |
| D-3 | El mensaje se colapsa a una línea y sus URL se sustituyen por `<url omitida>` | Quitar el saneado y U-6 |
| D-4 | El código entra si es `[A-Za-z0-9_]{1,32}` (SQLSTATE o código de Node) | Restringirlo a SQLSTATE, `[0-9A-Z]{5}` |
| D-5 | Un valor no `Error` da «valor no Error (<typeof>)»; un fallo interno, «(sin detalle)»; un `registrar` que lanza se ignora | Otra redacción |
| D-6 | El hijo corre con `process.execPath` y el CLI de tsx; la URL va por `TEST_DATABASE_URL`; sin `NODE_OPTIONS` | `node --import tsx`, un solo proceso |
| D-7 | Las dos situaciones del §7 se miden como pruebas de caracterización I-3 e I-4 | Dejarlas como medición anotada y borrar las dos pruebas |
| D-8 | Nombres: `conexionPerdida*`, `testing/hijoConexionCortada.ts`, `deployPoolConexionCortada.test.ts` | Renombrar (nadie los cita aún) |
| D-9 | Contenedor `pcc-pg` en el puerto 55433 | Otro nombre o puerto |

## 13 · Matriz de amenazas

El producto no cambia enrutado, órdenes de shell, subprocesos, VCS/PR ni clasificación de ejecutables. Sólo la prueba lanza un subproceso:
argv fijo, sin shell, `cwd` y `env` controlados, URL de una base desechable creada por la propia prueba.

| Frontera | Aplicabilidad |
|---|---|
| Rutas con aspecto de documentación | N/A: no se clasifica ni ejecuta ningún fichero por su nombre |
| Selección de repositorio Git | N/A: ningún `git` en código ni en pruebas nuevas (los `git add`/`git diff` de §7 son del protocolo manual) |
| Estado de commit / de push / órdenes de PR | N/A: sin automatización de VCS ni de PR |

## 14 · Despliegue, vuelta atrás y riesgos

Sin migración, columna ni variable; cambia sólo el servidor (App y worker), el bundle del cliente no. Regla 13: no toca `apps/desk/src`.
Vuelta atrás: revertir el commit (`proposal.md` §11).
- **I-3 e I-4 parten de hipótesis**; si I-4 muestra que el proceso NO muere, cambian la §27 y la respuesta del §7, no el código.
- **Arranque lento de tsx** con la máquina cargada: el plazo de «listo» es de 30 s y la ventana de 10 s empieza en «listo», no en el arranque.
- **El CI gana ~15-20 s** (cuatro hijos) y corre la integración: plazos explícitos por prueba.
- **Una versión futura de pg-pool** podría quitar el oyente silencioso del cliente y dar dos líneas por corte: I-1 fija «una» y lo cazaría.
- **Ráfaga** de hasta 10 líneas por pool en un reinicio (S-4): la §27 lo dice.
- **Discrepancia de recuento** de citas (26 frente a 34): L3 la resuelve midiendo.
- Sin preguntas que bloqueen.
