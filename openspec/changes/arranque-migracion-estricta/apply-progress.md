# apply-progress — `arranque-migracion-estricta`

Se fusiona por lote; nunca se sobrescribe. Partida del cambio: `18ae6188` (rama desde `97539c73`).

## Lote L1 (intento i3) — hecho, pendiente de commit del orquestador

### Tareas
L1.1 a L1.9 hechas (casillas marcadas en `tasks.md`). L1.10: las cinco comprobaciones y la medida están abajo; el commit lo hace el orquestador.

### M0 (L1.1) — `npm test` en el commit de partida, sin cambios
Salida 0 · 373 ficheros pasan y 4 se saltan (377) · 6.435 pruebas pasan, 26 saltadas · 341 s · log `npmtest-M0-L1.log` del scratchpad.

### Rojos anotados (antes de escribir código)
- L1.2 `puestaAlDiaEstricta.test.ts` contra un esqueleto que exporta todo y lanza «no implementado»: 13 en rojo (U-1, U-2, U-4, U-5, U-6, U-6b, U-6c, U-7, U-8, U-10, U-12, «cerrar() es idempotente»; U-9 con `expected Error: no implementado to be an instance of ErrorPuestaAlDia`). U-3 y U-11 salen en verde de entrada: caracterizan `migrate`/`reorgToDesk` tal como están (RQ-ZS-56), no código nuevo.
- L1.3 `arranqueEstrictoIndice.test.ts` contra `index.ts` sin tocar: en rojo `:26 abre la puesta al día…` (`falta abrirPuestaAlDiaEstricta(pool) en :26: expected -1 to be greater than or equal to 0`), `:27 aplica la migración…` (`expected '  await migrate(pool)' to contain 'aplicar(migrate)'`), `fuera de :26 y :27…` (`expected [ '  await migrate(pool)' ] to have a length of +0 but got 1`), `las dos líneas llevan await…`, `el especificador del import() de :26…` (`falta el import() dinámico en :26`). En verde de entrada, a propósito: número de líneas, línea 8 y `app.listen`/`main().catch` (fijan lo que NO debe moverse).
- L1.4 `modoSinZohoIndice.test.ts:42` corregida en sitio (`git diff --numstat` 1/1, CRLF intactos): rojo `se esperaba UNA línea con «puestaAlDia.aplicar(migrate)»: expected [] to have a length of 1 but got +0`.

### Verde
- Módulo `packages/zoho-sync/src/db/puestaAlDiaEstricta.ts` (133 líneas): U-1 a U-12 en verde.
- `apps/desk/server/index.ts:26-27` en sitio (texto de `design.md` §3): `git diff --numstat` = `2 2`, 118 saltos de línea y 118 CRLF antes y después, `file` igual, `:8` intacta.
- Focal (`puestaAlDiaEstricta.test.ts`, `arranqueEstrictoIndice.test.ts`, `modoSinZohoIndice.test.ts`, `migrate.test.ts`): 4 ficheros, 93 pruebas en verde.

### Desviaciones y decisiones de la aplicación (a revisar)
1. **Guarda de orden sin importar valores de `migrate.ts`.** El módulo importa de `migrate.ts` sólo el tipo `Queryable` (L1.5). Para reconocer «el paso reorganización» usa la primera sentencia capturada (`CREATE SCHEMA IF NOT EXISTS desk`, constante `PRIMERA_DE_LA_REORGANIZACION`) en vez de la identidad de la función. U-1 y U-7 la fijan; si un día `reorgToDeskStatements()` cambia su primera sentencia, U-1/U-7 se ponen rojas.
2. El error de «paso no capturable» y el de «sesión cerrada» / «reorganización tras la migración» son `ErrorPuestaAlDia` con `sentencia: ''` y `codigo` indefinido. El `message` de «paso no capturable» es `…paso no capturable (no envía sólo sentencias fijas): <causa>`.
3. `ErrorPuestaAlDia` conserva el error original en `cause` (no estaba en el diseño; no altera el `message`).
4. Los ficheros nuevos están en LF en el árbol hasta que git los toca (autocrlf del repo): tras el primer `git checkout` de una mutación pasan a CRLF, como el resto. No afecta al contenido.
5. Lint: la primera pasada dio 166 (un `any` en `puestaAlDiaEstricta.test.ts`, U-11); se cambió por `Awaited<ReturnType<Queryable["query"]>>` y quedó en 165 contra 165. Tras ese cambio se repitieron `eslint` de los ficheros, el focal de 15 pruebas, el typecheck y el lint completo (todo en 0); `npm test` y `build` no se repitieron entero (el cambio es de tipos en una prueba).

### Mutaciones (protocolo: `git add`, `perl -i -pe '… if $. == N'`, focal, `git checkout`, `git diff --quiet`, `file`)
| Mutación | Fichero:línea | Pruebas en rojo | Restaurada |
|---|---|---|---|
| M-1 · el `SET` tras la primera sentencia del primer `aplicar` | `puestaAlDiaEstricta.ts:82`, `:92`, `:123` | 8: U-1, U-2, U-7, U-4, U-5, U-8, U-9, U-10 | sí (`git diff --quiet`=0) |
| M-2 · intercambiar el contenido de `index.ts:26` y `:27` | `index.ts:26`, `:27` | `arranqueEstrictoIndice.test.ts`: `:26 abre…`, `:27 aplica…`, `las dos líneas llevan await…`, `el especificador del import()…` (4) | sí; `file` igual |
| M-3 · quitar la guarda de orden | `puestaAlDiaEstricta.ts:116` | U-7 (1) | sí |
| M-4 · volver a tolerar (`continue` en el `catch`) | `puestaAlDiaEstricta.ts:125` | 5: U-4, U-5, U-6, U-6b, U-6c | sí |
| M-5a · clasificar por el texto del mensaje | `puestaAlDiaEstricta.ts:67` | U-6b (1; U-6 sigue verde porque el texto coincide, lo caza el caso con `57014`) | sí |
| M-5b · invertir la comparación con `55P03` | `puestaAlDiaEstricta.ts:67` | 4: U-4, U-6, U-6b, U-6c | sí |
| M-6 · quitar el valor del límite del texto | `puestaAlDiaEstricta.ts:69` | U-6 (1) | sí |
| M-7 · `release()` en lugar de `release(true)` | `puestaAlDiaEstricta.ts:86` | 5: U-1, U-7, U-4, U-9, U-10 (I-4 se anota en L2) | sí |
| M-8 · leer el límite de `process.env.LOCK_TIMEOUT` | `puestaAlDiaEstricta.ts:90` | U-8 (1) | sí |
| M-9 · `index.ts:27` vuelve a `await migrate(pool)` | `index.ts:27` | 4: tres de `arranqueEstrictoIndice.test.ts` (`:27 aplica…`, `fuera de :26 y :27…`, `las dos líneas llevan await…`) y `modoSinZohoIndice.test.ts` `la migración y la resiembra no llevan el salto` | sí |

Ninguna mutación dejó todo en verde. Incidente de método: la primera ejecución de M-4 no aplicó la mutación (el patrón `\n$` no casaba con CRLF tras el primer `git checkout`); se detectó porque `git diff --stat` no mostró cambios y se repitió con `(\r?\n)$`. M-10 va en L3.

### Las cinco comprobaciones (cadena `ame-cinco.sh L1pre 18ae6188`, memoria libre al arrancar 5.677 MB)
typecheck=0 · lint=1 en la primera pasada (166 avisos contra 165; corregido, ver desviación 5) y 0 después (165 contra 165) · detector=0 (`--sha HEAD`: sobre lo no commiteado no dice nada; se repite sobre el commit del lote) · `npm test`=0, 393 s · build=0 (`index-F1jDYjEU.js`, el mismo bundle: el cliente no cambia).

### Medida (regla del ledger)
`git diff --shortstat --no-renames 18ae6188` con todo en el índice: 5 ficheros, 446 inserciones y 3 borrados = 449; sin trackear: 0 (todo trackeado en el índice); binarios: ninguno. Más este `apply-progress.md` y las 9 casillas de `tasks.md` (9/9): ≈ 520 en total, por debajo de 800.

### Comprobaciones de L1.9
- Regla 13: `git diff --name-only 18ae6188 | grep -c apps/desk/src` = 0.
- CA-5: `git diff --quiet 97539c73 -- migrate.ts schema.sql hubSync.ts hub-sync.ts pool.ts .env.example` sale 0.
- No se tocaron `openspec/config.yaml`, `docs/sdd/ENTRADA.md` ni otros ficheros de Supervisión.

### Queda para L2 y L3
- L2: integración contra PostgreSQL real (I-1 a I-4), M-7 contra Postgres, E-3 a mano, S-7 sólo si E-3 no ve la línea. Hipótesis aún abiertas: `55P03` como código del límite (U-6 usa un error falso), el `SET` por `pool.query` (I-3), `import()` dinámico con `tsx` (la prueba de índice sólo comprueba el especificador bajo vitest), y que pino vacíe la línea antes de `process.exit(1)`. **Tipado:** `tsc` acepta `Pool` como `FuenteDeConexiones` en `index.ts` (typecheck=0).
- L3: `DEPLOY.md` §26, `deployArranqueEstricto.test.ts`, guarda de la §25 en sitio (`deployCalificacionesConversaciones.test.ts:9,23,24,67,68`), M-10. Hoy `DEPLOY.md` no cambia, así que la guarda actual sigue verde.
- Barrido de la regla de mutación 4 (B.1 a B.3) tras L3.

## Lote L2 (intento i4) — hecho, pendiente de commit del orquestador

### Tareas
L2.1 a L2.6 hechas (casillas marcadas en `tasks.md`). L2.7: las cinco comprobaciones y la medida están abajo; el commit lo hace el orquestador.

### Contenedor y rojo (L2.1, L2.2)
- Contenedor desechable `ame-pg` (`postgres:16-alpine`, imagen local, `--rm`, puerto 55432). Versión medida: **PostgreSQL 16.14** (musl). Borrado al final con `docker rm -f ame-pg`; `docker ps -a` ya no lo lista. No se tocó ningún otro contenedor.
- `packages/zoho-sync/src/db/puestaAlDiaEstricta.integration.test.ts` (nuevo, 180 líneas, se salta sin `TEST_DATABASE_URL`, base propia `ame_it_<pid>_<ts>` creada y borrada, esperas con `conPlazo`/`hasta`). **Desviación honesta sobre el «rojo previo»:** el módulo ya existía desde L1, así que I-1 a I-4 salen en VERDE de entrada (son caracterización contra Postgres real, no código nuevo). El rojo que prueba que discriminan viene de M-7 (abajo). El diseño decía «rojo por aserción, no por conexión»: la conexión se verificó antes de escribirlas.
- Resultado: 4 pruebas en verde, 22,5 s (I-1 1,5 s · I-2 10,4 s · I-3 0,03 s · I-4 10,4 s).

### Evidencia medida
- **I-2 · SQLSTATE real: `55P03`** (el que prevé el diseño; no hubo contradicción). Tiempo hasta el corte: **10.105 ms** (límite 10.000 ms). La sentencia que agotó el límite NO fue el `ALTER TABLE … ADD COLUMN sku` del incidente, sino la primera que toca la tabla bloqueada: `CREATE INDEX IF NOT EXISTS idx_catalogo_modelos_marca ON catalogo_modelos (marca_id)`. Con la tabla ya creada, `CREATE INDEX IF NOT EXISTS` pide su bloqueo antes de comprobar que el índice existe. El mensaje contiene «límite de espera», `catalogo_modelos` y `10000`. La sesión bloqueadora se cierra con `ROLLBACK` en `finally`.
- **I-3 (hipótesis del brief): CONFIRMADA.** Con `Pool({ max: 2 })`, tras `pool.query("SET lock_timeout = '1234ms'")`, dos `connect()` simultáneos ven `1234ms` y `0`: el `SET` vive en una conexión y esa conexión vuelve al pool contaminada. Es la razón del cliente propio con `release(true)`.
- **I-4:** con `Pool({ max: 1 })` y la fuente envuelta para anotar `pg_backend_pid()`, tras terminar bien y tras el corte por el límite, `current_setting('lock_timeout')` por el pool da `0`, el pid es distinto del anotado y los pids anotados desaparecen de `pg_stat_activity`.
- I-1: base vacía, reorganización + migración estrictas dos veces seguidas, las dos resuelven (la consecuencia (3) sobre base vacía: 0 sentencias fallan; sobre producción sigue siendo P-2, de persona).

### M-7 contra PostgreSQL real (L2.3)
`git add`, `perl -i -pe 's/release\(true\)/release()/ if $. == 86'` en `puestaAlDiaEstricta.ts` (CRLF; `file` y `git diff --stat` 1/1 comprobados), focal de integración: **I-4 en rojo** (`AssertionError: expected '10s' to be '0'`, es decir, la conexión con el límite volvió al pool); I-1, I-2 e I-3 siguen verdes. Restaurado con `git checkout`; `git diff --quiet` = 0; `file` igual.

### E-3 · el arranque de verdad (L2.4)
- Base `ame_e3` en el contenedor con el esquema ya aplicado (script del scratchpad); el bloqueo `LOCK TABLE public.catalogo_modelos IN ACCESS EXCLUSIVE MODE` se abrió con `psql` desatendido dentro del contenedor (comprobado en `pg_locks`: 1 bloqueo).
- `cwd` = directorio NUEVO y vacío del scratchpad (comprobado: sin `.env`), `node_modules/.bin/tsx` del worktree sobre `apps/desk/server/index.ts` con `timeout 60`; sólo variables ficticias de entorno del proceso: `DATABASE_URL` al contenedor, `DB_SCHEMA=desk`, las cinco `ZOHO_*` con relleno, `PORT=53011`. Nada de Zoho ni de producción.
- **Código de salida: 1**, a los **14 s** (10 s del límite + arranque), sin necesitar el `timeout`. El registro (pino-pretty, stdout) enseña `ERROR: Fallo al arrancar el servidor` y `err` con `type: ErrorLimiteEspera`, el `message` «Puesta al día de la base detenida: se agotó el límite de espera de bloqueo (lock_timeout 10000 ms) en la sentencia «CREATE INDEX IF NOT EXISTS idx_catalogo_modelos_marca ON catalogo_modelos (marca_id)» [55P03] canceling statement due to lock timeout: canceling statement due to lock timeout», más `sentencia`, `codigo: "55P03"` y `limiteMs: 10000`. Pila: `main (index.ts:27)`. Ninguna línea «API en http» (0 coincidencias). Cierra las hipótesis: `import()` dinámico con `tsx` resuelve, pino serializa `err` con el `message` y las propiedades propias, y la línea se vacía antes de `process.exit(1)`.
- Observación menor: el serializador de pino añade `: <mensaje de la causa>` al final, así que «canceling statement due to lock timeout» sale dos veces. Es cosmético y viene de `cause`; no se toca.
- Puerto 53011 sin escucha tras la corrida; el directorio de E-3 se borró.

### S-7 (L2.5)
**S-7 no aplicó**: E-3 vio la línea. No se escribió código ni U-13; `index.ts:106-109` sin tocar.

### Las cinco comprobaciones (cadena `ame-cinco.sh L2pre efe78667`, memoria libre al arrancar 4.220 MB)
typecheck=0 · lint=0 (**165 avisos contra 165**) · detector=0 (`--sha HEAD`) · `npm test`=0, 302 s (sin `TEST_DATABASE_URL`: la integración queda omitida) · build=0 (`index-F1jDYjEU.js`, mismo bundle). El script imprimió la medida vacía; se midió a mano.

### Medida (regla del ledger)
`git diff --shortstat --no-renames efe78667` con todo en el índice: ficheros de código 1 (nuevo), **180 inserciones**; `tasks.md` 6/6 (12); sin trackear: 0; binarios: ninguno. Más este bloque de `apply-progress.md` (~45): ≈ 240 en total, por debajo de 800.

### Cierre del lote
- No se tocaron `index.ts`, `migrate.ts`, `schema.sql`, `pool.ts`, `.env.example`, `openspec/config.yaml`, `docs/sdd/ENTRADA.md` ni otros ficheros de Supervisión. `puestaAlDiaEstricta.ts` quedó igual que en L1 (`git diff --quiet` tras M-7).
- Queda para L3: `DEPLOY.md` §26 (conviene que diga que la sentencia que agota el límite puede ser el primer `CREATE INDEX`/`ALTER` sobre la tabla bloqueada, no necesariamente la del incidente), `deployArranqueEstricto.test.ts`, guarda de la §25 en sitio, M-10; después el barrido B.

## Lote L3 + barrido B (intento i5) — hecho, pendiente de commit del orquestador

### Tareas
L3.1 a L3.5 y B.1, B.2 hechas (casillas marcadas en `tasks.md`). L3.6 y B.3: las cinco comprobaciones y la medida están abajo; el commit lo hace el orquestador.

### Rojos anotados (antes de escribir la §26)
- L3.1 `apps/desk/server/deployArranqueEstricto.test.ts` (nuevo, 57 líneas) contra el `DEPLOY.md` sin §26: 4 en rojo, por aserción: `el DEPLOY.md real no tiene faltas` (`expected -1 to be greater than 82333`), `sin pg_terminate_backend…` y `sin el apartado…` (`expected '# Despliegue…' not to be '# Despliegue…'`: la copia ensuciada no cambia nada porque no hay §26) y `discrimina por posición…` (`expected [ 'la sección ## 26. ' ] to deeply equal [ 'la §26 como última sección' ]`).
- L3.3 rojo MEDIDO que la §26 causa en la guarda de la §25, antes de tocarla: `deployCalificacionesConversaciones.test.ts` 5 en rojo de 6 (`el DEPLOY.md real no tiene faltas`: `expected [ 'la §25 como última sección' ] to deeply equal []`; `sin la mención a numeros`; `quitar numeros sólo del apartado…`; `sin el apartado «Qué se rompe…»`; `sin la afirmación de que no hay interruptor nuevo`). La de posición sigue verde (la `## 26. Otra` añadida produce la misma falta). `deployControlCalidad.test.ts` y `deployModoSinZoho.test.ts` verdes.

### Verde
- `DEPLOY.md` §26 (38 líneas añadidas al final, `## 26.` en `DEPLOY.md:1112`, el fichero pasa de 1.110 a 1.148; `git diff --numstat` = `38 0`; CRLF conservados, `file` igual). Dice: qué cambia (límite de 10 s por sentencia, constante `LIMITE_ESPERA_BLOQUEO_MS` en `puestaAlDiaEstricta.ts`, sin variable ni interruptor, salida 1, worker tolerante); la línea REAL medida en E-3 (`ErrorLimiteEspera`, `[55P03]`, `limiteMs: 10000`) y la de `ErrorPuestaAlDia`; el aviso de que la sentencia nombrada es la PRIMERA que toca la tabla bloqueada (medido: `CREATE INDEX IF NOT EXISTS … ON catalogo_modelos`, no el `ALTER … ADD COLUMN sku`); y el procedimiento (buscar la línea; si es `55P03`, `psql -c "…"` con `pg_stat_activity` y `pg_blocking_pids`, `pg_terminate_backend` del pid raíz, referencia a E-268; si es otra sentencia, volver a la imagen anterior; P-2; nada de secretos en registros ni chats).
- Guarda de la §25 corregida EN SITIO (`git diff --numstat` = `5 5`, 71 líneas antes y después, 71 de 71 con CRLF): `:9` («es la última hasta la §26»), `:23` (acota con `texto.indexOf("## 26. ")`), `:24` y `:68` (falta `la §25 sola hasta la §26`), `:67` (título) y `:68` (la copia con `## 99. Otra` antes de la §26). Nota: la expresión de `:68` quedó con el molde de `deployModoSinZoho.test.ts:66` (copia con `## 99. Otra`), no con la forma de añadir `## 26. Otra` al final, porque esa forma ya no discrimina.
- Focal: `deployArranqueEstricto`, `deployCalificacionesConversaciones`, `deployControlCalidad` y `deployModoSinZoho`: 4 ficheros, 21 pruebas en verde.
- L3.5: `registro.test.ts` no se tocó y salió verde en la suite completa; `.env.example` y `schema.sql` sin diff.

### Mutaciones (protocolo: `git add`, `perl -i -pe '… if $. == N'`, focal, `git checkout`, `git diff --quiet`, `file`)
| Mutación | Fichero:línea | Pruebas en rojo | Restaurada |
|---|---|---|---|
| M-10 · `pg_terminate_backend` por `otra_cosa` en el `DEPLOY.md` REAL | `DEPLOY.md:1144` | las 4 de `deployArranqueEstricto.test.ts` (la real, con `expected [ 'pg_terminate_backend' ] to deeply equal []`; las ensuciadas también, porque la cadena ya falta en la base) | sí (`git diff --quiet`=0, `file` igual) |
| L3.4 · quitar la acotación de `:23` | `deployCalificacionesConversaciones.test.ts:23` | 5 de 6 (`expected [ 'la §25 sola hasta la §26' ] to deeply equal []`): sin acotar, la sección incluye la §26 y cuenta dos encabezados | sí (`git diff --quiet`=0, `file` igual) |

M-10 sobre copias en memoria está dentro de `deployArranqueEstricto.test.ts` (dos pruebas ensucian el texto y exigen la falta exacta); la mutación de posición de la §26 (con `## 27. ` detrás) también.

### Barrido B (regla de mutación 4)
Método: `git grep -noE` de la forma completa (`apps/desk/server/<fichero>:N[-M]`) y de la bare (`<fichero>:N`) sobre TODO el worktree, sin excluir `openspec/changes/archive/`: 935 coincidencias del patrón amplio (muchas son de otros `index.ts`), 725 del estrecho; filtradas por intersección de rango con las líneas que cambiaron de contenido (`index.ts:26`, `:27`; `modoSinZohoIndice.test.ts:42`; `deployCalificacionesConversaciones.test.ts:9`, `:23`, `:24`, `:67`, `:68`): **45** citas completas. Segundo pase de abreviadas (`:26`, `:27`, `:26-27`, `:42`, `:24`, `:67-68`…) en los 93 ficheros que ya citan alguno de los cuatro: sólo una pertenece a `index.ts` (`archive/2026-11-08-modo-sin-zoho/design.md:82`); el resto son de otros ficheros. Rangos bare que incluyen 26 o 27: los mismos de la forma completa. **`DEPLOY.md`:** 489 citas con línea; ninguna línea existente se movió (`38 0`), así que todas dicen lo que decían (caso A por construcción), salvo la afirmación «al final» que se lista abajo.

| Fichero:línea | Cita | Qué AFIRMA | Caso | Acción |
|---|---|---|---|---|
| `DEPLOY.md:318` | `index.ts:26` | con `DB_SCHEMA=desk` el arranque mueve las tablas | A (`:26` sigue siendo el reorg) | — |
| `DEPLOY.md:1114` | `index.ts:26-27` | (§26 nueva) reorganización y migración | A | — |
| `openspec/specs/zoho-sync/spec.md:355`, `:705` | `index.ts:26` (bare) | el reorg corre con `DB_SCHEMA=desk` | A | — |
| `Paquete_de_Despliegue_2026-09-29.md:124` | `index.ts:26-27` | `reorgToDesk` antes que `migrate` | A | — |
| `…2026-09-29.md:147` | `index.ts:26-27` | `main()` corre el reorg «y luego `await migrate(pool)`», antes de escuchar | B (cita literal) | anclada «en 97539c73» |
| `…2026-09-30.md:142` | `index.ts:26-27` | reorg antes de migrate | A | — |
| `…2026-09-30.md:177` | `index.ts:26-27` | idem 09-29:147 | B | anclada |
| `…2026-10-01.md:216` | `index.ts:26-27` | reorg antes de migrate | A | — |
| `…2026-10-01.md:253` | `index.ts:26-27` | idem | B | anclada |
| `…2026-10-03.md:256`, `…2026-10-04.md:327`, `…2026-10-04b.md:499` | `index.ts:26-27` | se aplican solas al arrancar la App | A | — |
| `…2026-10-04b.md:296` | `index.ts:27` | «la App hace `await migrate(pool)`» antes de crear la aplicación | B (cita literal) | anclada |
| `…2026-10-04b.md:613` | `index.ts:27` | el orden lo hace cada proceso al arrancar | A | — |
| `…2026-10-05.md:106`, `…2026-10-05b.md:149`, `…2026-10-09.md:255` | `index.ts:27` | la App migra su base al arrancar | A | — |
| `…2026-10-05b.md:245`, `…2026-10-09.md:385` | `index.ts:26-27` | reorg y migrate, «tolerando fallos» en la misma frase | B (la tolerancia ya no es del arranque de la App) | ancladas |
| `…2026-10-10b.md:203` | `index.ts:27` | «la migración es tolerante por sentencia y sigue aunque fallen todas» | B | anclada |
| `archive/2026-10-05-traspaso-y-trazas/design.md:247` | `index.ts:27` | las columnas las aplica `migrate` al arrancar | A | — |
| `archive/2026-11-08-modo-sin-zoho/design.md:82` | `:27` (abreviada) | las líneas de `await migrate(pool)` y de la resiembra no llevan el salto | B (cita literal) | anclada |
| `archive/2026-11-09-calificaciones-cuadre-conversaciones/verify-report.md:51` | `deployCalificacionesConversaciones.test.ts:67` | prueba de posición de la §25 «última» | B (la prueba ahora fija «precede a la §26») | anclada |
| `archive/2026-11-09-calificaciones-cuadre-conversaciones/apply-progress.md:127` | `DEPLOY.md:1068-1110` | «§25 añadida al final» | B (ya no es el final) | anclada |
| `archive/2026-11-09-calificaciones-cuadre-conversaciones/design.md:174`, `…/archive-report.md:23` | `DEPLOY.md:1066`, `:1068` | dónde entra / empieza la §25 | A | — |
| `archive/2026-11-08-modo-sin-zoho/verify-report.md:56` | `modoSinZohoIndice.test.ts:35`, `:41` | el arranque migra (la prueba `:41` conserva su título) | A | — |
| `arranque-migracion-estricta/proposal.md:95` | `modoSinZohoIndice.test.ts:42` | exige UNA línea con `await migrate(pool)` | B (propia, redactada antes del cambio) | anclada |
| `arranque-migracion-estricta/design.md:55` | `modoSinZohoIndice.test.ts:42` | idem | B | anclada (se quitó la negrita para que el ancla vaya pegada) |
| `arranque-migracion-estricta/specs/zoho-sync/spec.md:178` | `deployCalificacionesConversaciones.test.ts:24`, `:67-68` | «la §25 es la última» | B | anclada en `:24`; `:67-68` hereda |
| Las demás propias (`proposal.md:36`, `:146`, `:151`, `:175`, `:176`; `design.md:210`, `:248`, `:263`; `spec.md:23`, `:108`, `:110`; `tasks.md` y este fichero) | `index.ts:26`, `:26-27`, `modoSinZohoIndice.test.ts:42`, `deployCalificacionesConversaciones.test.ts:24`, `:67-68` | lo que se iba a hacer, o lo ya hecho en esas líneas | A | — |

Desvío frente a `design.md` §9: este clasifica A las cuatro citas que citan el texto literal `await migrate(pool)` (09-29:147, 09-30:177, 10-01:253, 10-04b:296). Aquí van como **B anclada** porque lo que cita es una forma de código que ya no existe (el efecto, reorg y luego migración antes de escuchar, es el mismo). Anclar es inocuo si fuera A.
Edición de las 13 líneas ancladas: una cada vez, en su misma línea física, `git diff --numstat` = `1 1` por fichero, CRLF conservados (perl; la cuenta de `\r\n` igual antes y después). Los paquetes fechados y `archive/` no se reescriben: sólo se les pega «en 97539c73».

### Citas de los seis ficheros de Supervisión: se LISTAN, no se editan
| Fichero:línea | Cita | Qué afirma | Caso |
|---|---|---|---|
| `docs/sdd/ENTRADA.md:2425` | `index.ts:27`, `index.ts:57` | el arranque migra antes de escuchar | A |
| `docs/sdd/ENTRADA.md:2425` | `migrate.ts:28-34` | «sólo registra las que fallan» | B para el arranque de la App (sigue cierto de la función y del worker) |
| `docs/sdd/ENTRADA.md:2430` | `index.ts:27` y `:57` | la migración se espera antes de `app.listen` | A |
| `docs/sdd/ENTRADA.md:2430` | `migrate.ts:28-34` | «con un `lock_timeout` el arranque no fallaría» | C: lo cierra este cambio |
| `docs/sdd/ENTRADA.md:2414` | `DEPLOY.md:1068` | la §25 empieza en la 1068 | A |
| `docs/sdd/ENTRADA.md:1231`, `:1271`, `:2059` | `index.ts:85-93`, `:88`, `:88` | la pasada periódica | A (líneas no tocadas; `index.ts` conserva sus 118 líneas) |
| `openspec/config.yaml:6478-6481` | `migrate.ts:25-34` (sin cita a `index.ts`) | tolerancia deliberada; «con el cambio la App dejaría de arrancar» | A de la función; el segundo enunciado es ahora lo construido |

`CLAUDE.md`, `docs/sdd/F0-05_Bloques*`, `docs/sdd/F0-05_Mecanismo_de_Reconciliacion.md` y `docs/sdd/R08.4_Expediente_de_cambios.md`: 0 citas a los cuatro ficheros. Nada de Supervisión se editó.

### Las cinco comprobaciones (cadena `ame-cinco.sh L3pre 19c2a898`, memoria libre al arrancar 4.130 MB)
typecheck=0 · lint=0 (**165 avisos contra 165**) · detector=0 (`--sha HEAD`: sobre lo no commiteado no dice nada; las 13 anclas se comprueban al commit) · `npm test`=0, 314 s (sin `TEST_DATABASE_URL`) · build=0 (`index-F1jDYjEU.js`, mismo bundle). El script imprimió la medida vacía; se midió a mano.

### Medida (regla del ledger)
`git diff --shortstat --no-renames 19c2a898` con todo en el índice: 18 ficheros, 196 inserciones y 25 borrados = **221**; sin trackear que cuente: 0 (los `Parte_*` y demás sin trackear son ajenos); binarios: ninguno. Por debajo de 800. `git diff --name-only` sin nada bajo `apps/desk/src`; `index.ts`, `migrate.ts`, `schema.sql`, `pool.ts` y `.env.example` sin diff frente a `19c2a898`.
