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
