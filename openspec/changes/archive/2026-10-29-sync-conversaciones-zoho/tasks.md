# Tareas — `sync-conversaciones-zoho` (1G-01, `cierra: no`)

Entradas: `proposal.md`, `design.md` (D1-D9) y las deltas. `strict_tdd`: cada prueba nace **roja por la razón correcta** antes de
la implementación que la pone verde; las de CARACTERIZACIÓN nacen verdes y su valor está en la mutación de D7. Comprobaciones de
cada intento, **en serie** y sobre el árbol commiteado: `npm run typecheck`, `npm run lint -- --max-warnings 165`, el detector de
citas (`apps/desk/server/citas/cli.ts --sha HEAD`), `npm test` (con `systeminfo` antes: con menos de 12.000 MB disponibles, PARA)
y `npm run build`. Mutaciones con `perl -i -pe '… if $. == N'`, restauradas y comprobadas con `sha256sum` del diff, `git status` y
`file` (CRLF). Medida de cada intento: `git diff --shortstat --no-renames <partida>` más `wc -l` de lo nuevo sin trackear; ≤ 800.

## Lote L1 — paginación, reflejo de lo ausente y el hilo (intento i2)

- [x] L1.1 M0: `npm test` entero en el árbol de partida del lote, con su log; anotar ficheros, pruebas y duración.
- [x] L1.2 ROJO `packages/zoho-sync/src/conversaciones.test.ts`: `esperadoDeZoho` (números, texto numérico, `jsonb` como texto, falta uno, `null`, no numérico, negativo).
- [x] L1.3 ROJO mismo fichero: `leerConversaciones` — 250 en tres páginas con `from=0/100/200` y `limit=100`; 200 exactos con la tercera `204`; `500` en la segunda (devuelve las 100 y el error con el texto de `sync.ts:185`); tope de 20 páginas; `429` una vez con `reintentos429: 3` y `pausa429Ms: 0` (repite la MISMA página); `429` sin reintentos (error, `por429`).
- [x] L1.4 ROJO mismo fichero: `guardarYReflejar` — el #958 (5 comentarios + el hilo `495552000057899091`; recibidos los 5; esperado 5 → marca el hilo y sólo él; ninguna fila borrada, ni de `conversations` ni de `attachments`); recuento distinto con la línea de log; recuento ausente; lista con `error`; `marcar: false`; reaparece y se desmarca (con `marcar` encendido y apagado); fila `source='app'`; fila con `created_at` posterior a `inicio`; id repetido; caso de 151 guardadas y 150 recibidas en dos páginas que marca exactamente 1.
- [x] L1.5 ROJO `packages/zoho-sync/src/sync.conversaciones.test.ts`: `syncConversations` por `createSync` — 250 en tres páginas; `500` guarda las 100 y rechaza nombrando ticket y estado; #958 con `raw` (`commentCount` 5, `threadCount` 0) y `conversaciones: { marcarAusentes: true }` marca el hilo; sin la opción no marca; P1: una fila guardada por otra vía DURANTE la petición (efecto de la `zohoFetch` falsa) no se marca.
- [x] L1.6 ROJO `apps/desk/server/db/conversacionAusentes.test.ts`: RQ-TZ-25 — marcada con adjunto no sale ni su adjunto, las filas siguen en la base; desmarcada vuelve con su adjunto; CARACTERIZACIÓN: transición con comentario y remisión siguen saliendo.
- [x] L1.7 Anotar el rojo medido de L1.2-L1.6 (fichero › prueba › aserción) en `apply-progress.md`; ninguna roja por el arnés.
- [x] L1.8 `schema.sql`, al final: comentario sin punto y coma y `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ausente_en_zoho_at timestamptz;` sin calificar (D5).
- [x] L1.9 `packages/zoho-sync/src/conversaciones.ts` (nuevo): constantes, `ConversacionesDeps`, `esperadoDeZoho`, `leerConversaciones`, `instanteBase`, `guardarYReflejar` (D2). `crearPasadaConversaciones` queda para L2.
- [x] L1.10 `repo.ts:103` y `repo.ts:219` en sitio (D4). Releer las dos líneas antes de editar.
- [x] L1.11 `sync.ts:7`, `:9`, `:62` y `:183-191` en sitio (D3), sin añadir ni quitar líneas: `git diff --numstat` de `sync.ts` con inserciones = borrados.
- [x] L1.12 Verde: los tres ficheros nuevos y la suite entera (M0 posterior) con su log; anotar la diferencia de pruebas.
- [x] L1.13 Mutaciones de L1 con su rojo (D7): M1, M2, M3 (las dos variantes), M4 en `syncConversations`, M7, M9, M10 (las dos variantes) y P1. Tabla en `apply-progress.md`: colocación, rojas (fichero › prueba › aserción), restauración comprobada.
- [x] L1.14 Casilla de la regla 13 (D8): `git diff --name-only` sin nada bajo `apps/desk/src`.
- [x] L1.15 Las cinco comprobaciones en serie en 0 sobre el commit del lote; medida del intento; `apply-progress.md` con todo lo anterior.

## Lote L2 — pasada periódica, interruptores, worker y despliegue (intento i3)

- [x] L2.1 M0 del lote: `npm test` en el commit de L1.
- [x] L2.2 ROJO `packages/zoho-sync/src/config.test.ts`, al final: sin las variables, los dos campos `false`; con `'1'`, `'TRUE'` y `'yes'`, `false`; con `'true'`, `true`; cada uno independiente del otro.
- [x] L2.3 ROJO `packages/zoho-sync/src/sync.conversacionesPeriodicas.test.ts`: con `conversaciones: { periodica: true, pausaMs: 0, pausa429Ms: 0 }` se piden las de los dos modificados y no la del tercero; apagado y sin opción, cero `/conversations`; gestionado por la App con `raw` viejo y detalle nuevo (marca con el detalle); `429` una vez y luego `200` (repite); cuatro `429` seguidos (corta, no pide el segundo, log con los pendientes); memoria (mismo `modifiedTime` no se repide; otro sí); caída por búsqueda `500` sin pasada; lista `500` y `syncRecent` resuelve con el número de leídos.
- [x] L2.4 CARACTERIZACIÓN `apps/hub-sync/src/hubSyncSinConversaciones.test.ts`: `createSync` como `apps/hub-sync/src/hub-sync.ts:21` con `loadConfig` y las dos variables a `'true'` → cero `/conversations` tras `syncRecent` con modificados; la llamada a `createSync` de `hub-sync.ts` no contiene `conversaciones`.
- [x] L2.5 Anotar el rojo medido de L2.2-L2.4.
- [x] L2.6 `conversaciones.ts`: `crearPasadaConversaciones` (D2), al final del fichero.
- [x] L2.7 `sync.ts:66`, `:176`, `:375`, `:411`, `:426`, `:433` en sitio (D3); `git diff --numstat` de `sync.ts` con inserciones = borrados.
- [x] L2.8 `config.ts:66` y `:125` en sitio (D5); literales completos de `AppConfig` que pida `typecheck`, en sitio.
- [x] L2.9 `apps/desk/server/index.ts:23` en sitio (D5).
- [x] L2.10 `DEPLOY.md`, al final: §18, §19 y §20 (D5), con las dos frases de la regla de secretos y la línea de entorno de cada interruptor.
- [x] L2.11 Verde: los ficheros nuevos y la suite entera (M0 posterior) con su log.
- [x] L2.12 Mutaciones de L2 con su rojo (D7): M4 en la pasada, M5, M6 (las dos variables), M8a, M8b (en `hub-sync.ts`, el fichero vigilado), M11, P2 y P3. Tabla en `apply-progress.md`.
- [x] L2.13 Casilla de la regla 13 (D8) otra vez.
- [x] L2.14 Barrido de la regla de mutación 4 sobre `sync.ts`, `repo.ts`, `schema.sql`, `config.ts`, `index.ts` y `DEPLOY.md`: cada cita `<fichero>:N` del repositorio a una línea editada en sitio se lee contra lo que afirma; resultado en `apply-progress.md`.
- [x] L2.15 Las cinco comprobaciones en serie en 0 sobre el commit del lote; medida del intento; `apply-progress.md`.

## Tareas de persona — fuera del recuento; archivar NO las da por hechas

| Id | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Añadir a `.env.example` las líneas `SYNC_CONVERSACIONES_PERIODICA=` y `MARCAR_CONVERSACIONES_AUSENTES=` | Alfonso | informe de cierre |
| P-2 | Encender los interruptores en el servicio App y redesplegar | Gerencia / Alfonso | `DEPLOY.md` §18 y §19 |
| P-3 | Copia previa de `desk-db` y una vez `GET /api/admin/backfill-details` | Alfonso | `DEPLOY.md` §20 |
| P-4 | Comprobar en producción el #958 tras P-3 | Analista | lista acumulada de pruebas en la app |
