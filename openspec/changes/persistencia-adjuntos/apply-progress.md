# apply-progress — `persistencia-adjuntos` (1G-02)

Modo: Strict TDD. Partida: `ad404b30`. Estado tras el intento i2 (lote L1): L1.1-L1.5, L1.7 y L1.8 hechas; L1.6 (suite entera) y L1.9 (cierre) pendientes del orquestador.

## Lote L1 — intento i2

### L1.1 · M0 (hecha por el orquestador)
`npm test` entero en `ad404b30`: 338 ficheros pasan, 4 omitidos; 5.836 pruebas pasan, 26 omitidas; 466,24 s; código 0.

### Rojo medido (L1.4), contra un esqueleto de `almacen.ts` con las firmas y valores incorrectos (no un import roto)
`rutaAdjunto.test.ts` (10 rojas, esqueleto con `RUTA_ADJUNTO_ZOHO = /^$/` y `dirAdjuntos` → `'x'`):
- › el literal de attachment.ts se encuentra y tiene el mismo texto que la copia › `expected '^\/tickets\/\d+\/(comments|threads)\/…' to be '^$'`
- › `/tickets/100/comments/200/attachments/300/content` → true en la copia › `expected false to be true`
- › `/tickets/1/threads/2/attachments/3/content` → true en la copia › `expected false to be true`
- › (ruta vacía) → false en la copia › `expected true to be false`
- dirAdjuntos (D7) › ausente/vacía, relativa, la propia dist y lo que cuelga, válida, hermana/«..x», sin segundo argumento (6) › `expected 'x' to be null` / `to be '<ruta>'`

`almacen.test.ts` (30 rojas según el informe del agente; el esqueleto devolvía `{estado:'sinRuta'}` y `'sinCopia'`):
- guardarAdjunto › guardado correcto (3), nombre sale del id (2) › `expected { estado: 'sinRuta' } to deeply equal { estado: 'guardado', …}` / `expected [] to deeply equal [ '4002' ]`
- id no numérico (5 casos) › `expected { estado: 'sinRuta' } to deeply equal { estado: 'fallido', motivo: 'id' }`
- bytes contra size (5), sin size (4), UPDATE falla (1) › `expected { estado: 'sinRuta' } to deeply equal {…}`
- fallo a mitad de escritura, rename que falla, directorio ausente › `promise resolved "{ estado: 'sinRuta' }" instead of rejecting`
- ErrorDisco es un Error con name y code › `expected 'Error' to be 'ErrorDisco'`
- estadoCopia (6) › `expected 'sinCopia' to be 'ausente'|'otroTamano'|'presente'`, y `promise resolved "'sinCopia'" instead of rejecting`
- Las que pasaban contra el esqueleto: los 4 casos `sinRuta` (el esqueleto devolvía `sinRuta`; los casos de ruta válida de las demás pruebas triangulan que la guarda discrimina) y los 3 `sinCopia` de `estadoCopia` (triangulados por las pruebas de `ausente`/`presente`). Las pruebas de `NOMBRE_ADJUNTO` pasaron con el esqueleto porque la constante ya era la definitiva (estructural, una sola salida por entrada).

### Verde (L1.5/L1.6 parcial)
- `npx vitest run apps/desk/server/adjuntos/almacen.test.ts apps/desk/server/adjuntos/rutaAdjunto.test.ts` → 2 ficheros pasan, **73 pruebas pasan** (código 0).
- `npm run typecheck` → código 0.
- `npm run lint -- --max-warnings 165` → 165 avisos contra 165 (0 errores), código 0; 0 avisos nuevos.
- La suite entera (resto de L1.6) y las cinco comprobaciones de L1.9 las corre el orquestador.

### TDD Cycle Evidence
| Tarea | Fichero de prueba | Capa | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| L1.2/L1.5 guardarAdjunto | `apps/desk/server/adjuntos/almacen.test.ts` | Integración (pg-mem + fs real) | N/A (nuevo) | medido, 30 rojas | 73/73 | varios casos por regla (ids, hrefs, tamaños) | sin cambios |
| L1.2/L1.5 estadoCopia | `apps/desk/server/adjuntos/almacen.test.ts` | Integración (fs real) | N/A (nuevo) | medido | pasa | 9 casos | sin cambios |
| L1.3/L1.5 dirAdjuntos y tabla H5 | `apps/desk/server/adjuntos/rutaAdjunto.test.ts` | Unidad | N/A (nuevo) | medido, 10 rojas | pasa | 11 rutas × 2 expresiones, 6 de dirAdjuntos | sin cambios |

Una corrección dentro del lote: tras el verde, `FilaAdjunto` ganó `name?` y el arnés de pruebas lo pasa en la fila, porque sin él M2a no habría tenido de dónde leer `name` y la prueba «`name` con `../` no influye» no habría sido capaz de caer (mutar el sitio equivocado). `apps/desk/server/adjuntos/almacen.ts:32`.

### Work Unit Evidence
| Evidencia | Valor |
|---|---|
| Prueba focal | `npx vitest run apps/desk/server/adjuntos/almacen.test.ts apps/desk/server/adjuntos/rutaAdjunto.test.ts` → código 0, 73 pasan |
| Arnés real | `fs.mkdtemp` en `os.tmpdir()` por prueba, pg-mem con `migrate`, `zohoFetch` falsa; sin frontera HTTP en este lote |
| Frontera de vuelta atrás | borrar `apps/desk/server/adjuntos/` (los tres ficheros nuevos) y revertir los `[x]` de L1 en `tasks.md` |

### Mutaciones (L1.7)
Líneas medidas sobre el `almacen.ts` final (131 líneas, sha256 `7c28c32d…d8e2` idéntico antes y después de cada mutación).

| Id | Fichero:línea mutada | Mutación | Pruebas que caen | Restaurado |
|---|---|---|---|---|
| M2a | `apps/desk/server/adjuntos/almacen.ts:93` | `join(d.dir, fila.id)` → `join(d.dir, String(fila.name ?? fila.id))` | 4: guarda los bytes con el id como nombre…; con la copia ya guardada…; **name con ../ no influye…**; otro name… | sí, copia byte a byte + sha256 igual |
| M2b | `apps/desk/server/adjuntos/almacen.ts:92` | `writeFile(tmp, …)` → `writeFile(join(d.dir, fila.id), …)` | 11, entre ellas name con ../ no influye, **fallo a mitad de escritura (fs inyectado)…** y rename que falla | sí, sha256 igual |
| M3 | `apps/desk/server/adjuntos/almacen.ts:88` | `datos.length !== anunciado` → `false` | 3: **bytes de menos…**, bytes de más…, Content-Length distinto… | sí, sha256 igual |
| M7a | `apps/desk/server/adjuntos/almacen.ts:16` | `\d+` → `\w+` en `RUTA_ADJUNTO_ZOHO` (todas) | 5: el literal de attachment.ts… mismo texto que la copia; 3 rutas «→ false en la copia»; zoho_href `/tickets/abc/…` → sinRuta | sí, sha256 igual |
| P4 | `apps/desk/server/adjuntos/almacen.ts:92` | `UPDATE storage_path` antepuesto a `writeFile`/`rename` | 4: fallo a mitad de escritura; **rename que falla…storage_path sigue nulo (P4)**; directorio ausente; UPDATE falla | sí, sha256 igual |
| M7b | `apps/desk/server/routes/attachment.ts:17` | `\d+` → `\w+` (todas) | 4: el literal… mismo texto que la copia; 3 rutas «→ false en el literal leído de attachment.ts» | sí: mutación revertida con perl por línea; `git diff --stat -- apps/desk/server/routes/attachment.ts` vacío y `file` dice «with CRLF line terminators» |

Script de la tanda: fuera del repositorio, en el scratchpad de la sesión (perl por número de línea, nunca `sed -i`).

**Contraste del orquestador (antes del commit de L1):** recuento medido con la prueba focal fichero a fichero: `apps/desk/server/adjuntos/almacen.test.ts` 37 pruebas y `apps/desk/server/adjuntos/rutaAdjunto.test.ts` 36 (el informe del agente decía 40 y 33; el total, 73, coincide). Mutaciones reproducidas: **M3** (`apps/desk/server/adjuntos/almacen.ts:88`, `datos.length !== anunciado` → `false`) tumba las mismas 3 pruebas (bytes de menos, bytes de más, `Content-Length` distinto) y el sha256 vuelve a `7c28c32d72d2e991…`; **M7b sólo en la primera aparición** de `\d+` en `apps/desk/server/routes/attachment.ts:17` tumba 2 (igualdad del literal con la copia y `/tickets/abc/…` → false en el literal leído); restaurado con `git checkout`, `git diff --stat` vacío y `file` con CRLF. Ojo de método: en esta terminal un `perl -pe 's/\\d\+/…/'` entre comillas simples NO casó el texto `\d+` y dejó el fichero sin mutar; con `\x5c` (`s/\x5cd[+]/\x5cw+/`) sí. Una mutación que no muta da verde y parece «sin detector»: se comprueba con `sed -n Np` antes de correr la suite.

### L1.8 · casilla de la regla 13
`git diff --name-only` → sólo `openspec/changes/persistencia-adjuntos/tasks.md` (las casillas). `git ls-files --others --exclude-standard` → `apps/desk/server/adjuntos/{almacen.test.ts, almacen.ts, rutaAdjunto.test.ts}` y este `apply-progress.md`. Nada bajo `apps/desk/src`.

### Supuestos
1. Respuesta no ok de Zoho: `guardarAdjunto` devuelve `{ estado: 'respuesta', status }` sin escribir; el motor (L3, D4) decide `429`/`404`/otros. Variante no listada en D2: `apps/desk/server/adjuntos/almacen.ts:42` y `:82`.
2. `dirAdjuntos`: «fuera de dist» se decide con `rel === '..' || rel.startsWith('..' + sep)` en vez de «empieza por `..`» del diseño (`apps/desk/server/adjuntos/almacen.ts:129`). *Corregido por el orquestador al contrastar:* el efecto real es que una carpeta HIJA de `dist` llamada `..x` (relativa `..x`) se rechaza, cuando la lectura literal de D7 la daría por buena; la prueba de `apps/desk/server/adjuntos/rutaAdjunto.test.ts:70-75` fija una hermana (`dist-otro`) y una `..x` HERMANA (relativa `../..x`), que salen fuera con las dos lecturas. La hija `..x` no tiene prueba; la variante es más estricta que D7, no menos.
3. `guardarAdjunto` captura cualquier error de `zohoFetch`/`arrayBuffer` como `fallido:red` (incluida la lectura del cuerpo).
4. Se añade `name?` a `FilaAdjunto` sólo para poder probar que no interviene.

### Cierre del lote L1 (L1.6 y L1.9, orquestador, sobre `b0cbae47`)
- `npm run typecheck` 0; `npm run lint -- --max-warnings 165` 0, **165 avisos contra 165**; detector `tsx apps/desk/server/citas/cli.ts --sha HEAD` 0; `npm run build` 0 (`index-F1jDYjEU.js` 427,51 kB, el mismo bundle: L1 no toca el cliente).
- `npm test`, pasada 1: memoria libre al arrancar **10.863 MB**, duración **463 s**, código **0**; 340 ficheros pasan y 4 omitidos; 5.909 pruebas pasan y 26 omitidas (las 5.836 de M0 más las 73 nuevas). Desde el 04/11 no hay compuerta de memoria (corrección del usuario al encargo 17): se anotan memoria al arrancar, duración y código de cada pasada. Una pasada anterior, con la compuerta aún vigente, no se lanzó con 9.160 MB.
- Medida del intento i2 contra `ad404b30` (`git diff --shortstat --no-renames`): el commit de L1 son 5 ficheros, +541 −7 = 548; este cierre suma `tasks.md` y `apply-progress.md`, y la medida final va en la evidencia del asiento. Sin trackear: 0.
- Barrido B.1: L1 no edita ningún fichero muy citado. `apps/desk/server/routes/attachment.ts` sólo se mutó y se restauró: sus citas `:14`, `:17` y `:21-30` (esta, anclada en `d26ef8a5`) siguen diciendo lo que afirman. Las nueve citas `apps/desk/server/adjuntos/almacen.ts:NN` de este fichero (ocho líneas distintas; `:92` dos veces) se comprobaron contra el fichero: `:16`, `:32`, `:42`, `:82`, `:88`, `:92`, `:93` y `:129` dicen lo que afirman.

## Lote L2 — intento i3 (la ruta sirve de local; configuración)

Modo: Strict TDD. Partida: `103e5f6d` (código de L1 en `b0cbae47`). Hechas L2.1 a L2.10; L2.11 (cierre: las cinco comprobaciones, la medida y el barrido) y la suite entera de L2.8 son del orquestador.

### L2.1 · M0 (hecha por el orquestador)
`npm test` entero en `b0cbae47` (`103e5f6d` sólo añade documentos): memoria libre al arrancar 10.863 MB, 463 s, código 0; 340 ficheros pasan y 4 omitidos; 5.909 pruebas pasan y 26 omitidas.

### Safety net
`npx vitest run apps/desk/server/admin.test.ts packages/zoho-sync/src/config.test.ts apps/desk/server/opcionesConversaciones.test.ts apps/desk/server/adjuntos/almacen.test.ts apps/desk/server/adjuntos/rutaAdjunto.test.ts` antes de tocar nada: 5 ficheros, 134 pruebas pasan. No hay otra prueba que monte `registerAttachmentRoutes` (grep: sólo `apps/desk/server/app.ts`); `apps/desk/server/admin.test.ts:436` ejerce la guarda SSRF por `createApp` y sigue verde.

### Rojo medido (L2.4), contra el código de producción sin tocar
Sin esqueleto: `servirLocal.test.ts` sólo importa el arnés y el `logger`, que ya existen; el rojo es por aserción.

`packages/zoho-sync/src/config.test.ts` (6 rojas de 6 nuevas; las 19 anteriores siguen verdes):
- › RELLENO_ADJUNTOS_HABILITADO / GUARDAR_ADJUNTOS_AL_SINCRONIZAR nace cerrado › `expected undefined to be false`
- › … sólo el literal "true" lo abre › `false: expected undefined to be false`
- › los dos interruptores son independientes › `expected [ undefined, undefined, false ] to deeply equal [ true, false, false ]`
- › ADJUNTOS_DIR no tiene valor por defecto › `expected undefined to be ''`

`apps/desk/server/adjuntos/servirLocal.test.ts` (39 pruebas; 33 rojas, 6 verdes sin producción):
- copia válida (2 de 3): sirve los bytes sin llamar a Zoho / sin size sirve la copia › `expected Buffer[ 122, 111, 104, 111, 58, … ] to deeply equal Buffer[ 7, 7, 7, … ]` (Zoho respondió en vez de la copia)
- Content-Type y Content-Disposition (12 tipos, 5 normalizaciones, 4 de filename) › `expected 'text/plain' to be 'image/png'` y `expected undefined to be 'inline; filename="…'`
- caída a Zoho con UNA línea (8) › `expected [] to deeply equal [ { adjunto: '4011', … } ]` / `expected [] to have a length of 1 but got +0`
- P1, control del espía: en la primera pasada cayó por una aserción mía mal puesta (`consultas.length > 0` sin sesión, donde no hay consulta alguna); corregida antes del verde.
- `../secreto` › `expected [] to deeply equal [ 'sin copia' ]`
- Verdes sin producción (fijan lo que la ruta ya hacía, no son rojos; las discrimina la mutación): sin sesión → 401 sin consultar `attachments`, `/tickets/1/x` → 400 sin consultar, una copia válida no deja línea de caída, el temporal no se sirve (2 pruebas), la caída que devuelve 200 no escribe.

### Verde y triangulación
- `npx vitest run apps/desk/server/adjuntos/servirLocal.test.ts apps/desk/server/admin.test.ts packages/zoho-sync/src/config.test.ts apps/desk/server/opcionesConversaciones.test.ts apps/desk/server/adjuntos/almacen.test.ts apps/desk/server/adjuntos/rutaAdjunto.test.ts` → 6 ficheros, **179 pruebas pasan**, código 0. Por fichero: `servirLocal.test.ts` 39, `admin.test.ts` 38, `config.test.ts` 25, `opcionesConversaciones.test.ts` 4, `almacen.test.ts` 37, `rutaAdjunto.test.ts` 36.
- `npm run typecheck` código 0 (no hizo falta tocar `apps/desk/server/index.ts`: el `dir` sale de `config.adjuntosDir` dentro de `createApp`). Un primer intento falló sólo por el tipo del analizador binario de la prueba (`Response` de superagent).
- `npm run lint -- --max-warnings 165` código 0: **165 avisos contra 165**, 0 errores, 0 avisos nuevos.

### Ediciones en sitio (`git diff --numstat`) y finales de línea
| Fichero | numstat | `wc -l` | CRLF |
|---|---|---|---|
| `packages/zoho-sync/src/config.ts` (`:66`, `:125`) | 2 2 | 127 | sí |
| `apps/desk/server/testing/appHarness.ts` (`:46`, `:49`) | 2 2 | 141 | sí |
| `apps/desk/server/app.ts` (`:9`, `:50`, `:58`) | 3 3 | 96 | sí |
| `apps/desk/server/routes/attachment.ts` (`:4`, `:8`, `:10`, `:21`) | 8 4 | 36 | sí |
| `packages/zoho-sync/src/config.test.ts` (sólo al final) | 34 0 | 194 | sí |
| `apps/desk/server/adjuntos/servir.ts` (nuevo) | — | 82 | LF, como `almacen.ts` |
| `apps/desk/server/adjuntos/servirLocal.test.ts` (nuevo) | — | 323 | LF |

Desvío contra el encargo: `attachment.ts` borra **4** líneas, no 3, porque D6 reescribe también la `:21` (`const zres = await zohoFetch(path)` pasa a `try { zres = … } catch …`). `requireAuth` (`:14`) y la guarda (`:17-20`) quedan byte a byte iguales y en sus líneas; lo nuevo va desde la `:21`.
`app.ts` conserva las tres subcadenas vigiladas (`opcionesConversaciones.test.ts:36-48` verde): `marcar: opcionesConversaciones(config).marcarAusentes === true` en la línea `:50`, la importación de `opcionesConversaciones` en la `:9` y `habilitado: config.rellenoConversacionesHabilitado === true` en la `:57`; no nombra `config.syncConversacionesPeriodica` ni `config.marcarConversacionesAusentes`.

### Mutaciones (L2.9)
Cada una con perl por número de línea; la línea mutada se imprimió con `sed -n` antes de correr la suite; restaurado copiando el fichero de respaldo y comparando `sha256` (idéntico en las ocho). Suite: `servirLocal.test.ts` + `config.test.ts` (64 pruebas).

| Id | Fichero:línea | Mutación | Pruebas que caen | Restaurado |
|---|---|---|---|---|
| M1a | `packages/zoho-sync/src/config.ts:125` | `RELLENO_ADJUNTOS_HABILITADO === 'true'` → `!== 'false'` | 3: RELLENO… nace cerrado; RELLENO… sólo el literal "true"; los dos interruptores son independientes | sí, sha256 igual |
| M1b | `packages/zoho-sync/src/config.ts:125` | ídem con `GUARDAR_ADJUNTOS_AL_SINCRONIZAR` | 3: GUARDAR… nace cerrado; GUARDAR… sólo el literal "true"; los dos interruptores son independientes | sí, sha256 igual |
| M3a | `apps/desk/server/adjuntos/servir.ts:43` | `otroTamano` ya no cae (`&& false`): se sirve local | 1: tamaño distinto (4004, 10 bytes con size 20) | sí, sha256 igual |
| M3b | `apps/desk/server/routes/attachment.ts:25` | tras Zoho 200 hace `UPDATE attachments SET storage_path` | 1: una caída a Zoho que devuelve 200 no crea ficheros ni cambia storage_path | sí, sha256 igual |
| M3c | `apps/desk/server/routes/attachment.ts:25` | tras Zoho 200 escribe un fichero en `dir` | 1: la misma | sí, sha256 igual |
| M6 | `apps/desk/server/adjuntos/servir.ts:36` y `:81` | el `name` de la fila viaja hasta la línea de `registrarCaida` | 6: fichero ausente (4003, la que compara el JSON serializado con el `name` del fixture), tamaño distinto, sin copia, sin directorio, 404, no responde | sí, sha256 igual |
| P1a | `apps/desk/server/routes/attachment.ts:14` | consulta a `attachments` ANTES de `requireAuth` | 3: sin sesión; `/tickets/1/x`; control (cuenta dos consultas en vez de una) | sí, sha256 igual |
| P1b | `apps/desk/server/routes/attachment.ts:15` | `buscarCopia` ANTES de la guarda | 2: `/tickets/1/x` con sesión; control | sí, sha256 igual |

Notas de método: M3b y M3c las discrimina sólo la prueba de «no escribe». M6 hace caer seis pruebas por la forma del objeto del log, pero sólo la de 4003 ejerce la defensa de fondo (el `name` serializado). P1a: «sin sesión» cae porque el espía de `attachments` ya ve la consulta antes de que `requireAuth` responda.

### TDD Cycle Evidence
| Tarea | Fichero de prueba | Capa | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| L2.3/L2.5 config | `packages/zoho-sync/src/config.test.ts` | Unidad | 19/19 | medido, 6 rojas | 25/25 | 2 interruptores × (vacío, 7 valores, 'true') | sin cambios |
| L2.2/L2.6 `servirLocal` | `apps/desk/server/adjuntos/servirLocal.test.ts` | Integración HTTP (pg-mem + fs real + supertest) | 134 (admin 38 incl. guarda SSRF) | medido, 33 rojas | 39/39 | 12 tipos, 5 normalizaciones, 4 filenames, 5 motivos y 3 variantes, 3 de P1, 4 de seguridad | sin cambios |
| L2.7 `app.ts`/`appHarness.ts` | las dos anteriores + `opcionesConversaciones.test.ts` | Integración | 4/4 | cubierto por las rojas de arriba | 4/4 | — | sin cambios |

### L2.10 · casilla de la regla 13 y regla de mutación 3
`git diff --name-only` → `apps/desk/server/app.ts`, `apps/desk/server/routes/attachment.ts`, `apps/desk/server/testing/appHarness.ts`, `packages/zoho-sync/src/config.test.ts`, `packages/zoho-sync/src/config.ts`, `openspec/changes/persistencia-adjuntos/tasks.md`; cero bajo `apps/desk/src`. El cliente no toma decisión alguna en este lote; las del servidor, una a una:
- Quién puede pedir: `requireAuth(db)` en `apps/desk/server/routes/attachment.ts:14` (probado por «sin sesión» y P1a).
- Qué paths se aceptan: la guarda de `apps/desk/server/routes/attachment.ts:17-20` (P1b).
- Si hay copia y es válida: `buscarCopia` en `apps/desk/server/adjuntos/servir.ts:28-47` (fila por `zoho_href`, `:37` sin directorio, `:40-43` estado de D3, tamaño en `estadoCopia`).
- `Content-Type`: `tipoBase` en `apps/desk/server/adjuntos/servir.ts:56-58`.
- `inline` frente a `attachment` y el nombre RFC 5987: `INLINE` (`apps/desk/server/adjuntos/servir.ts:53`) y `disposicion` (`:62-66`).
- `nosniff` y `Content-Length`: `apps/desk/server/adjuntos/servir.ts:74-75`.
- Qué se registra al caer a Zoho: `registrarCaida`, `apps/desk/server/adjuntos/servir.ts:80-81`, llamada desde `apps/desk/server/routes/attachment.ts:24-25`.
- Interruptores y directorio: `packages/zoho-sync/src/config.ts:125` (`=== 'true'`) y `dirAdjuntos` desde `apps/desk/server/app.ts:50`.

### Supuestos
1. Si `estadoCopia` lanza `ErrorDisco` al servir (p. ej. `EACCES`), la ruta cae a Zoho con motivo `fichero ausente` en vez de responder 500 (`apps/desk/server/adjuntos/servir.ts:40`): una descarga no debe romperse por un volumen ilegible. Sin prueba propia.
2. `sin fila`: el `adjunto` del log es el último número del `path` y el `ticket` es `null`: el primer número del `path` es el id de Zoho del ticket, no el número que usa Desk.
3. Sin `name` (o vacío), el `filename` es el id del adjunto (`apps/desk/server/adjuntos/servir.ts:63`); la spec no dice nada.
4. Un segundo `stat` en `buscarCopia` (`apps/desk/server/adjuntos/servir.ts:44-46`) da el `Content-Length`; si el fichero desaparece entre el estado y el `stat`, cae a Zoho con `fichero ausente`.
5. Un fallo a mitad de `pipeline` (cliente que corta) llega al manejador de `apps/desk/server/app.ts`, que mira `headersSent`; sin prueba propia.
