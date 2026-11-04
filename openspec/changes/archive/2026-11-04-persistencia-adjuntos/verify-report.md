# Informe de verificación — `persistencia-adjuntos` (1G-02, `cierra: si`)

evidence_revision: sha256:cd479922cca8af9a0493be3480f1f9e06bb5004d72fad7f869345da924f5a078

- Receta de `evidence_revision`: `printf '%s' "$(git rev-parse HEAD):$(git rev-parse HEAD^{tree})" | sha256sum`, sobre HEAD `253284361358615eb84f5e62bff61b6523862c6d` y árbol `155a094107f70a806d2cb10fd40d3b479e8d5afb`.
- Cambio: `persistencia-adjuntos`. Rama `persistencia-adjuntos`, partida `d26ef8a5`, lotes L1-L5 (`b0cbae47` a `25328436`). Fecha: 2026-11-04. Intento 7 (verify).
- Modo: `strict_tdd` activo, verificación independiente. `apply-progress.md` se usó como mapa, nunca como prueba: la focal, las 48 mutaciones y la lectura del código se reprodujeron en este árbol.
- Tareas: P.1, L1.1-L5.12 y B.1 marcadas y coherentes con el código (`git diff --numstat d26ef8a5 HEAD`: 6/6 `packages/zoho-sync/src/conversaciones.ts`, 1/1 `packages/zoho-sync/src/sync.ts`, 2/2 `packages/zoho-sync/src/config.ts`, 2/2 `apps/desk/server/index.ts`, 5/5 `apps/desk/server/app.ts`, 2/2 `apps/desk/server/testing/appHarness.ts`, 4/4 `apps/desk/server/deployRellenoConversaciones.test.ts`, 5/5 `debt.md`, 1/1 `apps/desk/server/opcionesConversaciones.test.ts`, 8/4 `apps/desk/server/routes/attachment.ts`, 75/0 `DEPLOY.md`, 34/0 `packages/zoho-sync/src/config.test.ts`). V.3 y A.* siguen sin marcar.

## Veredicto: PASS

0 CRITICAL · 0 WARNING · 7 SUGGESTION. Los 22 escenarios de RQ-ZS-30 a RQ-ZS-33 tienen prueba que los fija: 22 cubiertos, 0 parciales, 0 sin prueba (dos con matiz, S-1 y S-2). De las 48 mutaciones reproducidas (38 de D13 y de `apply-progress.md` en todas sus variantes, más 10 propias) **47 pusieron algo en rojo y 1 es un mutante equivalente** (X4, S-4): ninguna dejó un hueco real. La focal de la tanda da 15 ficheros y 305 pruebas, código 0.

## V.3 · Las cinco comprobaciones

Corridas por el orquestador, en serie, sobre `1e2198c7` (el commit de este informe; el código es el de `25328436`):

- `npm run typecheck` 0.
- `npm run lint -- --max-warnings 165` 0, **165 avisos contra 165**.
- Detector `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD` 0.
- `npm test`, pasada 1: memoria libre al arrancar **16.692 MB**, duración **323 s**, código **0**; 346 ficheros pasan y 4 omitidos; 6.037 pruebas pasan y 26 omitidas.
- `npm run build` 0 (`index-F1jDYjEU.js`, el mismo bundle: la tanda no toca el cliente).

## V.1 · Escenarios contra pruebas (22/22)

«Casa» = la aserción falla si la producción se rompe (comprobado con la mutación citada en V.2). Rutas de prueba completas en cada celda.

| # | Escenario | Prueba (`fichero:línea`) | ¿Casa? |
|---|---|---|---|
| 1 | RQ-ZS-30 guardado correcto, relanzar no lo pide | `apps/desk/server/adjuntos/almacen.test.ts:40` (bytes, nombre `4001`, `storage_path`, una petición), `apps/desk/server/adjuntos/almacen.test.ts:50` (`presente`), `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:110` (el tercer lanzamiento no pide) | Sí (M2a, M2b) |
| 2 | `name` con `../` no influye; id no numérico no escribe | `apps/desk/server/adjuntos/almacen.test.ts:63` (`readdir(base)` solo `volumen`), `apps/desk/server/adjuntos/almacen.test.ts:78` (5 ids, `zohoFetch` no llamada), `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:138` (`abc1` fallido:id) | Sí (M2a, X-nombre13) |
| 3 | bytes de menos o fallo a mitad de escritura | `apps/desk/server/adjuntos/almacen.test.ts:96` (1500 de 2048), `apps/desk/server/adjuntos/almacen.test.ts:109` (cuerpo cortado ⇒ `fallido:red`), `apps/desk/server/adjuntos/almacen.test.ts:159` (700 bytes y `ENOSPC`: ni final ni temporal ni `storage_path`) | Sí (M3-almacen, M2b); matiz S-1 |
| 4 | sin `size`: `Content-Length` 900 y sin cabecera | `apps/desk/server/adjuntos/almacen.test.ts:133`, `apps/desk/server/adjuntos/almacen.test.ts:145`, `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:167` (`sinTamanoComprobable`) | Sí |
| 5 | directorio ausente o dentro de `dist/` | pasada `apps/desk/server/adjuntos/guardadoAlSincronizar.test.ts:160` (3 directorios, sin gancho, sin `storage_path`); relleno `apps/desk/server/adjuntos/rellenoAdjuntosRutas.test.ts:109` y `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:201`; unidad `apps/desk/server/adjuntos/rutaAdjunto.test.ts:60` | Sí (X8) |
| 6 | RQ-ZS-31 copia válida sin llamar a Zoho | `apps/desk/server/adjuntos/servirLocal.test.ts:58` (bytes, `inline`, `nosniff`, `Content-Length`, `zohoFetch` no llamada) | Sí (X2, M3-servir) |
| 7 | HTML o SVG se descargan | `apps/desk/server/adjuntos/servirLocal.test.ts:99` (12 tipos en bucle constante; `text/html`, `image/svg+xml`, `application/xhtml+xml` ⇒ `attachment`) | Sí (X1) |
| 8 | `4003` ausente y `4004` de otro tamaño caen a Zoho con UNA línea | `apps/desk/server/adjuntos/servirLocal.test.ts:159` y `apps/desk/server/adjuntos/servirLocal.test.ts:175` (objeto exacto `{adjunto, ticket, motivo, estadoZoho}` y JSON sin el `name`); los otros motivos en `apps/desk/server/adjuntos/servirLocal.test.ts:189`, `apps/desk/server/adjuntos/servirLocal.test.ts:197`, `apps/desk/server/adjuntos/servirLocal.test.ts:205`, `apps/desk/server/adjuntos/servirLocal.test.ts:223`, `apps/desk/server/adjuntos/servirLocal.test.ts:233` | Sí (M3-servir, M6-servir) |
| 9 | sin sesión o fuera de la guarda | `apps/desk/server/adjuntos/servirLocal.test.ts:250` (401) y `apps/desk/server/adjuntos/servirLocal.test.ts:260` (400), con el espía de `attachments` y su control en `apps/desk/server/adjuntos/servirLocal.test.ts:270` | Sí (P1a, P1b); matiz S-2 |
| 10 | nada fuera del directorio, ningún temporal, ninguna escritura | `apps/desk/server/adjuntos/servirLocal.test.ts:281` (`../secreto`), `apps/desk/server/adjuntos/servirLocal.test.ts:292` y `apps/desk/server/adjuntos/servirLocal.test.ts:302` (temporal), `apps/desk/server/adjuntos/servirLocal.test.ts:310` (Zoho 200: mismo `readdir`, mismo `storage_path`) | Sí (X3, M3-rutaA, M3-rutaB) |
| 11 | RQ-ZS-32 el interruptor sólo abre con `'true'` | `packages/zoho-sync/src/config.test.ts:169`, `packages/zoho-sync/src/config.test.ts:174` (`TRUE`, `True`, `1`, `yes`, blancos), `packages/zoho-sync/src/config.test.ts:182` | Sí (M1a, M1b) |
| 12 | cerrado, `403` antes de validar | `apps/desk/server/adjuntos/rellenoAdjuntosRutas.test.ts:80` (`limite=abc` ⇒ 403 con la variable, `zohoFetch` no llamada), `apps/desk/server/adjuntos/rellenoAdjuntosRutas.test.ts:88`; directorio `apps/desk/server/adjuntos/rellenoAdjuntosRutas.test.ts:109` | Sí (P2a, P2b) |
| 13 | sólo superadministrador; `GET` no lanza; segundo `POST` no lanza otra | `apps/desk/server/adjuntos/rellenoAdjuntosRutas.test.ts:48` (403 en `POST` y `GET`), `apps/desk/server/adjuntos/rellenoAdjuntosRutas.test.ts:185` (`GET` sin pasada), `apps/desk/server/adjuntos/rellenoAdjuntosRutas.test.ts:223`, motor `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:322` | Sí (X5a, X5b, P5-relleno) |
| 14 | `limite=0` sólo cuenta | `apps/desk/server/adjuntos/rellenoAdjuntosRutas.test.ts:157` (cerrado y abierto: 3 pendientes, 3 MB, 1 sin ruta, cero Zoho, `readdir` vacío), motor `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:179` | Sí |
| 15 | reanudable e idempotente | `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:110` (`desde=20` pide 20 y 30 en ese orden; luego ninguno), `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:97` (orden), `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:125` (`limite` cuenta pedidos) | Sí |
| 16 | `404` es ausente y la pasada sigue | `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:218` (`4006` en `ausentes` con ticket 12, `fallidos.http` 0, `4007` guardado) | Sí (P3b) |
| 17 | `429` reintenta y corta; disco corta; otro fallo no | `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:231` (`[2000, 2000]`), `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:243` (`[2000, 2000, 2000]`, cuatro peticiones, el siguiente no se pide), `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:256` (500 y red), `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:280` (disco: el tercero no se pide), `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:301` | Sí (M5-relleno, P3a) |
| 18 | resumen y log sin datos de cliente | `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:343` y `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:357` (5 textos prohibidos en el JSON del estado, de `registrar` y del `logger`); para el gancho `apps/desk/server/adjuntos/guardadoAlSincronizar.test.ts:246` | Sí (M6-relleno, X7) |
| 19 | RQ-ZS-33 la pasada trae los pendientes de lo guardado, hasta el tope | `apps/desk/server/adjuntos/guardadoAlSincronizar.test.ts:85` (25 pendientes: 20 y el ciclo siguiente los 5; el ticket no tocado queda a nulo), `apps/desk/server/adjuntos/guardadoAlSincronizar.test.ts:103`, `apps/desk/server/adjuntos/guardadoAlSincronizar.test.ts:112`, `packages/zoho-sync/src/conversacionesTrasGuardar.test.ts:53` | Sí (M8a, M8c) |
| 20 | interruptor cerrado (`TRUE`, `1`, vacío) o sin periódica | `apps/desk/server/adjuntos/guardadoAlSincronizar.test.ts:123` (`trasGuardar` indefinido y cero descargas), `apps/desk/server/adjuntos/guardadoAlSincronizar.test.ts:133`, control `apps/desk/server/adjuntos/guardadoAlSincronizar.test.ts:141` | Sí (M1b) |
| 21 | el worker y la apertura no descargan | `apps/desk/server/adjuntos/guardadoAlSincronizar.test.ts:261` (`createSync` como el del worker), `apps/desk/server/adjuntos/guardadoAlSincronizar.test.ts:271`, `packages/zoho-sync/src/conversacionesTrasGuardar.test.ts:116`, `apps/hub-sync/src/hubSyncSinConversaciones.test.ts:43` | Sí (M4a, M4b) |
| 22 | un `404` o un tamaño distinto no se repite en el proceso | `apps/desk/server/adjuntos/guardadoAlSincronizar.test.ts:177` (`4007` y `4008` una vez; el `500` sí se repite), `apps/desk/server/adjuntos/guardadoAlSincronizar.test.ts:194` (la memoria es del gancho) | Sí (M8b-1, M8b-2) |

**CA-1 a CA-10:** CA-1 filas 1 y 15; CA-2 fila 3; CA-3 filas 3 y 10; CA-4 filas 2 y 10; CA-5 filas 6, 8 y 10; CA-6 filas 13, 16 y 17; CA-7 filas 12 y 14 (y el rol, X5a); CA-8 filas 19 y 21; CA-9 fila 18 (M6-servir, M6-relleno, X7); CA-10 `apps/desk/server/deployRellenoAdjuntos.test.ts:34` (con M7), `debt.md:572` y `debt.md:585`, la focal verde; typecheck, lint y `npm test` quedan en V.3.

**Seguridad (los adjuntos son documentos de clientes), D2, D3 y D6:**
- Nombre en disco sólo del id `^\d+$` (`apps/desk/server/adjuntos/almacen.ts:13`, comprobado en `apps/desk/server/adjuntos/almacen.ts:74` y en `apps/desk/server/adjuntos/almacen.ts:108`; X-nombre13 y X3 lo ponen en rojo). `name` no entra en ninguna ruta: M2a.
- Temporal y `rename`: `apps/desk/server/adjuntos/almacen.ts:90` (`.<id>.<pid>.<uuid>.tmp`, que no casa `^\d+$`), `apps/desk/server/adjuntos/almacen.ts:92` y `apps/desk/server/adjuntos/almacen.ts:93`; `storage_path` sólo después, `apps/desk/server/adjuntos/almacen.ts:99` (P4). Un fallo borra el temporal (`apps/desk/server/adjuntos/almacen.ts:95`).
- Nada se lee fuera de `ADJUNTOS_DIR` ni se sirve un temporal: `apps/desk/server/adjuntos/almacen.ts:108` da `sinCopia` si `storage_path` no es el id, `apps/desk/server/adjuntos/servir.ts:45` arma la ruta con el id validado y `apps/desk/server/adjuntos/servir.ts:76` abre sólo esa ruta.
- Anti-SSRF y sesión: `requireAuth` en `apps/desk/server/routes/attachment.ts:14`, guarda en `apps/desk/server/routes/attachment.ts:17`, búsqueda de la copia en `apps/desk/server/routes/attachment.ts:21`; el orden lo fijan P1a y P1b. `\d+` → `\w+` en esa guarda sólo lo caza la tabla H5 (S-3).
- Cabeceras: `inline` sólo para raster y PDF (`apps/desk/server/adjuntos/servir.ts:53`, X1), `nosniff` (`apps/desk/server/adjuntos/servir.ts:74`, X2), tipo normalizado (`apps/desk/server/adjuntos/servir.ts:56`), nombre RFC 5987 (`apps/desk/server/adjuntos/servir.ts:66`).
- Log y resumen sin `name`: `apps/desk/server/adjuntos/servir.ts:81`, `apps/desk/server/adjuntos/rellenoAdjuntos.ts:56` y `apps/desk/server/adjuntos/guardadoAlSincronizar.ts:71`; M6-servir, M6-relleno y X7 demuestran que añadirlo rompe una prueba.
- La ruta nunca escribe: `apps/desk/server/adjuntos/servir.ts` sólo importa `createReadStream`, `stat` y `pipeline`; M3-rutaA y M3-rutaB lo fijan.
- Interruptores `=== 'true'` (`packages/zoho-sync/src/config.ts:125`) y directorio rechazado en `dist/` (`apps/desk/server/adjuntos/almacen.ts:125`, con la misma `dist` que `apps/desk/server/index.ts:51`).

### Auditoría de calidad de las aserciones (paso 5f)

0 tautologías, 0 bucles fantasma (los `for` recorren constantes no vacías: `apps/desk/server/adjuntos/servirLocal.test.ts:99`, `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:351`, `apps/desk/server/adjuntos/rellenoAdjuntosRutas.test.ts:138`), 0 `vi.mock`, 0 `toBeDefined/toBeTruthy` (grep sobre los ficheros nuevos de prueba). Los `toEqual([])` de «no se escribe nada» tienen compañera no vacía (`apps/desk/server/adjuntos/almacen.test.ts:40`, `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:97`). Cada regla tiene varios casos con valores esperados distintos. **Aserciones: 0 CRITICAL, 0 WARNING.**

### Cumplimiento de TDD (paso 5a) y capas

| Comprobación | Resultado | Detalle |
|---|---|---|
| Evidencia de TDD reportada | ✅ | tablas «TDD Cycle Evidence» por lote en `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:33`, `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:142`, `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:209`, `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:285` y `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:370` |
| Todas las tareas tienen pruebas | ✅ | los ficheros de prueba nuevos y los 3 editados en sitio existen en HEAD |
| ROJO confirmado | ✅ | rojo medido por aserción en cada lote (esqueletos o producción sin tocar), no por import roto |
| VERDE confirmado | ✅ | focal: 15 ficheros y 305 pruebas, código 0; cada mutación restaurada deja el árbol limpio |
| Triangulación y red de seguridad | ✅ | varios casos por regla; ficheros modificados con red previa (19/19, 4/4, 134) |

Capas: todo vitest en nodo; unidad (`apps/desk/server/adjuntos/rutaAdjunto.test.ts`, `packages/zoho-sync/src/config.test.ts`), integración con pg-mem, `fs.mkdtemp`, `supertest` y `createSync` real, y estáticas sobre ficheros (`apps/desk/server/deployRellenoAdjuntos.test.ts`). Sin E2E ni de interfaz (decisión F0-00). Cobertura no ejecutada (informativa).

## V.2 · Mutaciones (48; ninguna verde salvo el equivalente X4)

Método: `perl -i -pe '… if $. == N'` (nunca `sed -i`); respaldo en el scratchpad, línea impresa y `cmp` contra el respaldo ANTES de correr (si no cambia, aborta), prueba focal del grupo, restauración con `cp`, `cmp` y `sha256sum` iguales. Líneas del árbol de HEAD; logs y JSON por mutación en `verify/` del scratchpad.

| Id | Fichero:línea | Mutación | Pruebas que caen | Coincide con apply-progress | Restaurado |
|---|---|---|---|---|---|
| M1a | `packages/zoho-sync/src/config.ts:125` | `RELLENO_ADJUNTOS_HABILITADO === 'true'` → `!== 'false'` | 4 (3 de `packages/zoho-sync/src/config.test.ts`, 1 de `apps/desk/server/deployRellenoAdjuntos.test.ts`) | Sí (4) | sí |
| M1b | `packages/zoho-sync/src/config.ts:125` | ídem con `GUARDAR_ADJUNTOS_AL_SINCRONIZAR` | 7 (las 4 de M1a y 3 de `apps/desk/server/adjuntos/guardadoAlSincronizar.test.ts`: `TRUE`, `1`, vacío) | Sí (4 más 3 de un fichero que L5 no corrió) | sí |
| M2a | `apps/desk/server/adjuntos/almacen.ts:93` | `join(d.dir, String(fila.name ?? fila.id))` | 4 (guarda bytes; copia ya guardada; `name` con `../`; otro `name`) | Sí | sí |
| M2b | `apps/desk/server/adjuntos/almacen.ts:92` | `writeFile` directo al nombre final | 11 (incluye fallo a mitad de escritura y `rename` que falla) | Sí | sí |
| M3-almacen | `apps/desk/server/adjuntos/almacen.ts:88` | sin comparar con `size` | 3 (bytes de menos, de más, `Content-Length` distinto) | Sí | sí |
| M3-servir | `apps/desk/server/adjuntos/servir.ts:43` | `otroTamano` ya no cae | 1 (`4004`, `apps/desk/server/adjuntos/servirLocal.test.ts:175`) | Sí | sí |
| M3-rutaA | `apps/desk/server/routes/attachment.ts:25` | tras Zoho 200, `UPDATE storage_path` | 1 (`apps/desk/server/adjuntos/servirLocal.test.ts:310`) | Sí | sí |
| M3-rutaB | `apps/desk/server/routes/attachment.ts:25` | tras Zoho 200, escribe un fichero en `dir` | 2 (`apps/desk/server/adjuntos/servirLocal.test.ts:310` y «sin directorio»: con `dir` nulo mi mutante escribe en `null/zz` y da 500) | Sí (1); la 2.ª es de la forma de mi mutante | sí |
| M4a | `packages/zoho-sync/src/sync.ts:189` | `syncConversations` llama a `trasGuardar` | 2 (`packages/zoho-sync/src/conversacionesTrasGuardar.test.ts:116` y `apps/desk/server/adjuntos/guardadoAlSincronizar.test.ts:271`) | Sí | sí |
| M4b | `apps/hub-sync/src/hub-sync.ts:21` | `createSync` recibe `conversaciones` | 1 (`apps/hub-sync/src/hubSyncSinConversaciones.test.ts:43`) | Sí | sí |
| M5-relleno | `apps/desk/server/adjuntos/rellenoAdjuntos.ts:117` | `return 'corte'` → `return` | 1 (`apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:243`) | Sí | sí |
| M5-gancho | `apps/desk/server/adjuntos/guardadoAlSincronizar.ts:58` | el `429` sin `break` | 1 (`apps/desk/server/adjuntos/guardadoAlSincronizar.test.ts:206`) | Sí | sí |
| M6-servir | `apps/desk/server/adjuntos/servir.ts:36` y `apps/desk/server/adjuntos/servir.ts:81` | el `name` viaja a la línea de caída | 6 (todas las de caída; sólo `apps/desk/server/adjuntos/servirLocal.test.ts:159` serializa el JSON) | Sí | sí |
| M6-relleno | `apps/desk/server/adjuntos/rellenoAdjuntos.ts:69`, `apps/desk/server/adjuntos/rellenoAdjuntos.ts:72` y `apps/desk/server/adjuntos/rellenoAdjuntos.ts:97` | el `name` al resumen | 5 (clasificación, 500/red, bytes de menos, resumen, `registrar` por defecto) | Sí | sí |
| M7a-925 | `DEPLOY.md:925` | quita «Qué se rompe si se pone mal» de `ADJUNTOS_DIR` | 1 (`apps/desk/server/deployRellenoAdjuntos.test.ts:42`, sólo ese apartado) | Sí | sí, CRLF |
| M7a-944 | `DEPLOY.md:944` | ídem en `RELLENO_ADJUNTOS_HABILITADO` | 1 (sólo ese apartado) | Sí | sí, CRLF |
| M7a-962 | `DEPLOY.md:962` | ídem en `GUARDAR_ADJUNTOS_AL_SINCRONIZAR` | 1 (sólo ese apartado) | Sí | sí, CRLF |
| M7b-904 | `DEPLOY.md:904` | «Copia previa de» → «Hacer copia de» en la '21 (la '22 lleva la frase) | 1 (`apps/desk/server/deployRellenoConversaciones.test.ts:40`) | Sí | sí, CRLF |
| M7-almacen-todas | `apps/desk/server/adjuntos/almacen.ts:16` | `\d+` → `\w+` en las tres | 5 (literal igual a la copia; 3 rutas; `abc` en `apps/desk/server/adjuntos/almacen.test.ts:85`) | Sí (5) | sí |
| M7-almacen-1.ª | `apps/desk/server/adjuntos/almacen.ts:16` | `\d+` → `\w+` sólo la 1.ª | 3 (literal; `/tickets/abc/…` en la copia y en `apps/desk/server/adjuntos/almacen.test.ts:85`) | extra | sí |
| M7-attach-todas | `apps/desk/server/routes/attachment.ts:17` | `\d+` → `\w+` en las tres | 4, todas de `apps/desk/server/adjuntos/rutaAdjunto.test.ts` (S-3) | Sí (4) | sí, CRLF |
| M7-attach-1.ª | `apps/desk/server/routes/attachment.ts:17` | sólo la 1.ª | 2 (`apps/desk/server/adjuntos/rutaAdjunto.test.ts:33` y `apps/desk/server/adjuntos/rutaAdjunto.test.ts:39`) | Sí (2, contraste del orquestador) | sí, CRLF |
| M8a | `apps/desk/server/adjuntos/guardadoAlSincronizar.ts:53` | tope a `1e9` | 3 (25 pendientes; el tope cuenta peticiones; el 500 cuenta) | Sí | sí |
| M8b-1 | `apps/desk/server/adjuntos/guardadoAlSincronizar.ts:59` | el `404` no entra en el `Set` | 1 (`apps/desk/server/adjuntos/guardadoAlSincronizar.test.ts:177`) | Sí | sí |
| M8b-2 | `apps/desk/server/adjuntos/guardadoAlSincronizar.ts:62` | el tamaño no entra en el `Set` | 1 (la misma) | Sí | sí |
| M8c | `packages/zoho-sync/src/sync.ts:66` | sin `, trasGuardar: conversaciones.trasGuardar` | 13 (4 de `packages/zoho-sync/src/conversacionesTrasGuardar.test.ts` y 9 de `apps/desk/server/adjuntos/guardadoAlSincronizar.test.ts`) | Sí (13) | sí, CRLF |
| M9 | `apps/desk/server/index.ts:23` | vuelve a `conversaciones: opcionesConversaciones(config)` | 1 (`apps/desk/server/opcionesConversaciones.test.ts:23`) | Sí | sí, CRLF |
| P1a | `apps/desk/server/routes/attachment.ts:14` | consulta a `attachments` antes de `requireAuth` | 3 (sin sesión; `/tickets/1/x`; control) | Sí | sí, CRLF |
| P1b | `apps/desk/server/routes/attachment.ts:15` | `buscarCopia` antes de la guarda | 2 (`/tickets/1/x`; control) | Sí | sí, CRLF |
| P2a | `apps/desk/server/routes/rellenoAdjuntos.ts:43` y `apps/desk/server/routes/rellenoAdjuntos.ts:46` | el interruptor de la variable después de validar | 3 (`apps/desk/server/adjuntos/rellenoAdjuntosRutas.test.ts:69`, `apps/desk/server/adjuntos/rellenoAdjuntosRutas.test.ts:80`, `apps/desk/server/adjuntos/rellenoAdjuntosRutas.test.ts:88`) | Sí | sí |
| P2b | `apps/desk/server/routes/rellenoAdjuntos.ts:43` y `apps/desk/server/routes/rellenoAdjuntos.ts:46` | el de directorio después de validar | 3 (`apps/desk/server/adjuntos/rellenoAdjuntosRutas.test.ts:109`, tres directorios) | Sí | sí |
| P3a | `apps/desk/server/adjuntos/rellenoAdjuntos.ts:115` | el `429` después de `!res.ok` | 3 (`apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:231`, `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:243` y `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:256`, esta por el texto de mi mutante) | Sí (las 2 de apply) | sí |
| P3b | `apps/desk/server/adjuntos/rellenoAdjuntos.ts:119` | el `404` después de `!res.ok` | 2 (`apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:218` y `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:256`, esta por el texto de mi mutante) | Sí (la de apply) | sí |
| P4 | `apps/desk/server/adjuntos/almacen.ts:92` | `UPDATE storage_path` antes del `rename` | 4 (mitad de escritura, `rename`, dir ausente, UPDATE falla) | Sí | sí |
| P5-relleno | `apps/desk/server/adjuntos/rellenoAdjuntos.ts:171` y `apps/desk/server/adjuntos/rellenoAdjuntos.ts:134` | `enMarcha` tras el primer `await` | 2 (`apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:322` y `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:375`) | Sí | sí |
| P5-push | `packages/zoho-sync/src/conversaciones.ts:163` | `guardados.push` antes de `guardarYReflejar` | 2 (`packages/zoho-sync/src/conversacionesTrasGuardar.test.ts:78` y `packages/zoho-sync/src/conversacionesTrasGuardar.test.ts:87`) | Sí | sí, CRLF |
| Mx-catch | `packages/zoho-sync/src/conversaciones.ts:173` | sin el `?.catch` del gancho | 1 (`packages/zoho-sync/src/conversacionesTrasGuardar.test.ts:96`) | Sí | sí, CRLF |
| Mx-disco | `apps/desk/server/adjuntos/guardadoAlSincronizar.ts:68` | `ErrorDisco` sin `break` | 1 (`apps/desk/server/adjuntos/guardadoAlSincronizar.test.ts:221`) | Sí | sí |

Propias, no listadas en D13:

| Id | Fichero:línea | Mutación | Pruebas que caen |
|---|---|---|---|
| X-nombre13 | `apps/desk/server/adjuntos/almacen.ts:13` | `NOMBRE_ADJUNTO` con `\w+` | 5 (`apps/desk/server/adjuntos/almacen.test.ts:78` ×2, `apps/desk/server/adjuntos/almacen.test.ts:219`, `apps/desk/server/adjuntos/rutaAdjunto.test.ts:45` ×2) |
| X1 | `apps/desk/server/adjuntos/servir.ts:53` | `svg+xml` dentro de `INLINE` | 1 (`apps/desk/server/adjuntos/servirLocal.test.ts:99`, `image/svg+xml`) |
| X2 | `apps/desk/server/adjuntos/servir.ts:74` | `nosniff` → `sniff` | 1 (`apps/desk/server/adjuntos/servirLocal.test.ts:58`) |
| X3 | `apps/desk/server/adjuntos/almacen.ts:108` | quitar `storage_path !== id` | 7 (`apps/desk/server/adjuntos/almacen.test.ts:215`, `apps/desk/server/adjuntos/servirLocal.test.ts:189`, …) |
| X4 | `apps/desk/server/adjuntos/almacen.ts:129` | quitar `rel === ''` | **0: mutante equivalente** (la rama general ya rechaza la cadena vacía; S-4) |
| X5a | `apps/desk/server/routes/rellenoAdjuntos.ts:43` | `POST` sin `requireSuperAdmin` | 4 (`apps/desk/server/adjuntos/rellenoAdjuntosRutas.test.ts:48`, `apps/desk/server/adjuntos/rellenoAdjuntosRutas.test.ts:59`, …) |
| X5b | `apps/desk/server/routes/rellenoAdjuntos.ts:53` | `GET` sin `requireSuperAdmin` | 1 (`apps/desk/server/adjuntos/rellenoAdjuntosRutas.test.ts:48`) |
| X6 | `apps/desk/server/adjuntos/almacen.ts:76` | quitar la guarda `sinRuta` | 4 (`apps/desk/server/adjuntos/almacen.test.ts:85`, cuatro hrefs) |
| X7 | `apps/desk/server/adjuntos/guardadoAlSincronizar.ts:43`, `apps/desk/server/adjuntos/guardadoAlSincronizar.ts:60` y `apps/desk/server/adjuntos/guardadoAlSincronizar.ts:63` | el `name` a la línea de log del gancho | 1 (`apps/desk/server/adjuntos/guardadoAlSincronizar.test.ts:246`) |
| X8 | `apps/desk/server/adjuntos/rellenoAdjuntos.ts:167` | quitar el rechazo de `dir` nulo | 1 (`apps/desk/server/adjuntos/rellenoAdjuntos.test.ts:201`) |

Al terminar: `git status --short` vacío (ningún fichero de código modificado) y `file` sigue diciendo «with CRLF line terminators» en `config.ts`, `attachment.ts`, `conversaciones.ts`, `sync.ts`, `index.ts`, `hub-sync.ts`, `DEPLOY.md` y `app.ts`. Prefijo de 8 del sha256 del árbol de trabajo, igual antes y después: almacen 7c28c32d, servir 79bc58bf, attachment a1d51adf, rellenoAdjuntos 02feb3ff, guardadoAlSincronizar 8d4660a8, routes/rellenoAdjuntos 5ce4c59b, config bb098a01, sync cad31295, conversaciones 194a8262, index 8805db75, hub-sync d0871a0c, DEPLOY 87412889.

**Nota de método propia, sin consecuencias en el árbol.** Dos mutantes salieron mal escritos (un `$1` interpolado por perl dentro de un `UPDATE` y un `\+` mal escapado en X1): dieron 0 pruebas cargadas o 0 rojas. Se vio por la línea mutada impresa y se repitieron bien (M3-rutaA, X1). Una mutación que no muta, o que rompe la carga, no prueba nada.

## Diseño y reglas

- **Regla 13:** `git diff --name-only d26ef8a5 HEAD` no contiene nada bajo `apps/desk/src` (0 coincidencias); el cliente sigue pidiendo `/api/attachment` con el `zoho_href` y no decide nada nuevo.
- **Regla de mutación 3, decisión a decisión, con la línea del servidor que la impone:** local o Zoho, `apps/desk/server/adjuntos/servir.ts:28` (`buscarCopia`) llamada desde `apps/desk/server/routes/attachment.ts:21`; validez de la copia, `apps/desk/server/adjuntos/almacen.ts:107`; cabeceras, `apps/desk/server/adjuntos/servir.ts:53`, `apps/desk/server/adjuntos/servir.ts:56`, `apps/desk/server/adjuntos/servir.ts:62` y `apps/desk/server/adjuntos/servir.ts:74`; sesión, `apps/desk/server/routes/attachment.ts:14`; rol del relleno, `apps/desk/server/routes/rellenoAdjuntos.ts:43` y `apps/desk/server/routes/rellenoAdjuntos.ts:53`; interruptor, `apps/desk/server/routes/rellenoAdjuntos.ts:20` con `apps/desk/server/app.ts:57` y `packages/zoho-sync/src/config.ts:125`; directorio, `apps/desk/server/routes/rellenoAdjuntos.ts:24`, `apps/desk/server/app.ts:50` y `apps/desk/server/adjuntos/almacen.ts:125`; `limite=0` libre, `apps/desk/server/routes/rellenoAdjuntos.ts:19` y `apps/desk/server/routes/rellenoAdjuntos.ts:46`; tope por ciclo, `apps/desk/server/adjuntos/guardadoAlSincronizar.ts:18` y `apps/desk/server/adjuntos/guardadoAlSincronizar.ts:53`; gancho condicionado al interruptor y al directorio, `apps/desk/server/adjuntos/guardadoAlSincronizar.ts:33` y `apps/desk/server/adjuntos/guardadoAlSincronizar.ts:34`. Ninguna decisión queda sin línea de servidor.
- **Escalón B antes que C:** el `403` del interruptor y el del directorio van en la cadena (`apps/desk/server/routes/rellenoAdjuntos.ts:43`) antes de validar (`apps/desk/server/routes/rellenoAdjuntos.ts:45`); P2a y P2b lo fijan con 3 rojas cada una.
- **Orden de las guardas del motor:** el `429` y el `404` van antes del caso general (`apps/desk/server/adjuntos/rellenoAdjuntos.ts:115` y `apps/desk/server/adjuntos/rellenoAdjuntos.ts:119`); P3a y P3b lo fijan.
- **Supervisión y `.env.example`:** 0 ficheros de `CLAUDE.md`, `openspec/config.yaml`, `docs/sdd/` ni `.env*` en el diff; `.env.example` sin tocar (P-5 es tarea de persona, declarada aparte en `openspec/changes/persistencia-adjuntos/tasks.md`).
- **Medida del diff completo:** `git diff --numstat --no-renames d26ef8a5 HEAD` = 3.535 inserciones y 34 borrados con `openspec/` incluido; el tope de 800 es por intento y cada lote cerró con su medida en `openspec/changes/persistencia-adjuntos/apply-progress.md`.

## Hallazgos

### CRITICAL
Ninguno.

### WARNING
Ninguno.

### SUGGESTION
- **S-1 · El «flujo cortado tras 700 de 2048 bytes» se prueba con un cuerpo que rechaza** (`apps/desk/server/adjuntos/almacen.test.ts:109`), no con 700 bytes entregados. La ruta de código es la misma (`apps/desk/server/adjuntos/almacen.ts:86`), y el fallo a mitad de escritura con 700 bytes sí está (`apps/desk/server/adjuntos/almacen.test.ts:159`), pero ese lanza `ErrorDisco` y corta, no «cuenta fallido» como pide el THEN literal; es coherente con D2 y S-8. Tampoco hay prueba del `fallido:base` en el relleno (`apps/desk/server/adjuntos/rellenoAdjuntos.ts:113`), sólo en `apps/desk/server/adjuntos/almacen.test.ts:196`.
- **S-2 · «Sin sesión o fuera de la guarda: no se consulta la base ni el disco»** (`apps/desk/server/adjuntos/servirLocal.test.ts:250`): el espía mira sólo `attachments`; el disco no se espía. P1a y P1b cubren la base; para el disco el hueco es teórico, porque el disco sólo se toca después de `buscarCopia`.
- **S-3 · La rigidez de dígitos de la guarda anti-SSRF no se prueba por HTTP.** M7-attach-todas deja verdes `apps/desk/server/adjuntos/servirLocal.test.ts:260` y `apps/desk/server/admin.test.ts:436`; sólo la tabla H5 de `apps/desk/server/adjuntos/rutaAdjunto.test.ts:39` (que lee el texto de `apps/desk/server/routes/attachment.ts:17`) la guarda. Es el diseño (D13, M7) y `\w` no deja pasar `.` ni `/`, así que no abre un recorrido de rutas; una petición con `/tickets/abc/comments/1/attachments/1/content` y `zohoFetch` no llamada la cerraría de punta a punta.
- **S-4 · Cláusula muerta:** `rel === ''` en `apps/desk/server/adjuntos/almacen.ts:129` es redundante (X4: la rama general ya rechaza la cadena vacía). Inofensiva e indistinguible por prueba.
- **S-5 · Un error de disco al LEER la copia se etiqueta «fichero ausente»** (`apps/desk/server/adjuntos/servir.ts:40`; supuesto 1 de L2 en `openspec/changes/archive/2026-11-04-persistencia-adjuntos/apply-progress.md:161`), sin prueba propia. La descarga no se rompe, pero el log no distingue un volumen ilegible de un fichero que falta.
- **S-6 · `estado.error` guarda el `message` de una excepción inesperada** (`apps/desk/server/adjuntos/rellenoAdjuntos.ts:153`) y el gancho lo registra igual (`apps/desk/server/adjuntos/guardadoAlSincronizar.ts:73`). Con consultas de sólo lectura el riesgo es bajo (hipótesis: un mensaje de `pg` puede traer el host de la base, no datos de cliente), pero CA-9 pide ni datos ni secretos y ninguna prueba provoca una excepción de base en el relleno.
- **S-7 · Esperas fijas en pruebas negativas:** `apps/desk/server/adjuntos/rellenoAdjuntosRutas.test.ts:185` y otras `esperar(20-30)` antes de afirmar «Zoho no se llamó». Válido hoy; en una máquina cargada una llamada tardía podría escaparse y dar un falso verde (hipótesis, sin reproducir).

## Resumen

La tanda cumple los 22 escenarios, CA-1 a CA-10 y la seguridad de D2, D3 y D6. Las 48 mutaciones se reprodujeron y cada una pone en rojo lo que `apply-progress.md` dice; las diferencias de recuento son de la forma de mi mutante o de ficheros extra que corrí, y están anotadas. La única verde es equivalente. Regla 13 y regla de mutación 3 respetadas, árbol limpio y CRLF intacto. Quedan para el orquestador las cinco comprobaciones (V.3) y, para personas, P-1 a P-5 (fuera del recuento).

**Recomendación:** `sdd-archive`.
