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
- Barrido B.1: L1 no edita ningún fichero muy citado. `apps/desk/server/routes/attachment.ts` sólo se mutó y se restauró: sus citas `:14`, `:17` y `:21-30` (esta, anclada en `d26ef8a5`) siguen diciendo lo que afirman. Las nueve citas a `almacen.ts` de este fichero (ocho líneas distintas; la 92 dos veces) se comprobaron contra el fichero: `apps/desk/server/adjuntos/almacen.ts:16`, `:32`, `:42`, `:82`, `:88`, `:92`, `:93` y `:129` dicen lo que afirman.

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
`app.ts` conserva las tres subcadenas vigiladas (`apps/desk/server/opcionesConversaciones.test.ts:37-48` verde): `marcar: opcionesConversaciones(config).marcarAusentes === true` en `apps/desk/server/app.ts:50`, la importación de `opcionesConversaciones` en `apps/desk/server/app.ts:9` y `habilitado: config.rellenoConversacionesHabilitado === true` en `apps/desk/server/app.ts:57`; no nombra `config.syncConversacionesPeriodica` ni `config.marcarConversacionesAusentes`.

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
4. Un segundo `stat` en `buscarCopia` (`apps/desk/server/adjuntos/servir.ts:45-47`) da el `Content-Length`; si el fichero desaparece entre el estado y el `stat`, cae a Zoho con `fichero ausente`.
5. Un fallo a mitad de `pipeline` (cliente que corta) llega al manejador de `apps/desk/server/app.ts`, que mira `headersSent`; sin prueba propia.

### Contraste y cierre del lote L2 (L2.8 suite entera y L2.11, orquestador, sobre `a770f4e8`)
- Contraste: la focal da 179 pruebas, 6 ficheros, código 0, con los mismos recuentos por fichero; `git diff --numstat` coincide (`config.ts` 2 2, `appHarness.ts` 2 2, `app.ts` 3 3, `attachment.ts` 8 4, `config.test.ts` 34 0) y los cinco editados siguen en CRLF. `requireAuth` y la guarda siguen en `apps/desk/server/routes/attachment.ts:14` y `apps/desk/server/routes/attachment.ts:17`. Mutación reproducida: **P1b** (`buscarCopia` añadida al final de `apps/desk/server/routes/attachment.ts:15`, antes de la guarda) tumba las mismas 2 pruebas («`/tickets/1/x` con sesión» y el control del espía); restaurada con `git checkout` sobre el commit, `git status` vacío y CRLF.
- `npm run typecheck` 0; `npm run lint -- --max-warnings 165` 0, **165 avisos contra 165**; `npm run build` 0 (`index-F1jDYjEU.js`, el mismo bundle).
- `npm test`, pasada 1: memoria libre al arrancar **9.288 MB**, duración **436 s**, código **0**; 341 ficheros pasan y 4 omitidos; 5.954 pruebas pasan y 26 omitidas (5.909 + 45 nuevas: 39 de `servirLocal.test.ts` y 6 de `config.test.ts`).
- Detector de citas sobre `a770f4e8`: **1**, por dos citas de este fichero escritas en L2 (se nombran en prosa, no en forma de cita, para que el detector no las vuelva a leer): la de las líneas 36 a 48 de la prueba de `opcionesConversaciones`, cuya primera línea está vacía (el bloque vigilado empieza en la 37), y la de las líneas 44 a 46 de `servir.ts` en el supuesto 4, cuya primera línea también está vacía (el segundo `stat` ocupa de la 45 a la 47). Reparadas aquí, junto con las abreviadas del cierre de L1 que el detector atribuía a `attachment.ts` y eran de `almacen.ts`, y las tres de `app.ts` (líneas 50, 9 y 57), que se atribuían a la prueba de `opcionesConversaciones` y ahora van completas.
- Barrido B.1 (regla de mutación 4) sobre todo el repositorio, `openspec/changes/archive/` y `docs/` incluidos: `config.ts`, `app.ts` y `appHarness.ts` se editaron en sitio, así que sus citas (`config.ts:66` y `:125` en `DEPLOY.md:784`, `:794`, `:819`, `:826`, `:845`, `:863`, `:895` y en los archivos; `app.ts:9`, `:50`, `:57`, `:58`; `appHarness.ts:46` y `:49`) siguen apuntando a la misma línea y lo que afirman sigue en ella (caso A). `attachment.ts` desplaza +4 desde la `:21`: las citas a sus líneas posteriores son `:21-30` y `:22-30` del `proposal.md` y del `design.md` y `:26-29` del S-10, todas ancladas en `d26ef8a5` (caso B, ciertas de esa revisión); `:14` y `:17` no se mueven.
- Regla 13: nada bajo `apps/desk/src`.

## Lote L3 — intento i4 (motor del relleno de adjuntos)

Modo: Strict TDD. Partida: `da5c85ca`. Ficheros nuevos, ambos LF como `apps/desk/server/adjuntos/almacen.ts`: `apps/desk/server/adjuntos/rellenoAdjuntos.ts` (191 líneas) y `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts` (386 líneas). No se tocó ningún otro fichero salvo las casillas L3.1 a L3.9 de `tasks.md`. Las constantes `PAUSA_429_MS`, `REINTENTOS_429` y `PAUSA_ENTRE_TICKETS_MS` ya se exportan de `packages/zoho-sync/src/conversaciones.ts`, así que se importan (sin duplicarlas) y una prueba fija sus valores (2.000, 3, 150). `almacen.ts` no se modificó: sus 37 pruebas y las 36 de `rutaAdjunto.test.ts` siguen verdes.

### L3.1 · M0 (hecha por el orquestador)
`npm test` entero en `a770f4e8` (código de L2; `0cf5333b` y `da5c85ca` sólo documentos): memoria libre al arrancar 9.288 MB, 436 s, código 0; 341 ficheros pasan y 4 omitidos; 5.954 pruebas pasan y 26 omitidas.

### Rojo medido (L3.5), contra un esqueleto de `rellenoAdjuntos.ts` con los tipos y las firmas de D8 y valores incorrectos (`lanzar` devuelve `lanzada: false`, `recuento` ceros), no un import roto
Antes de producción: 22 rojas y 1 verde de 23 (la verde es la que fija las tres constantes, que ya existen).
- `rellenoAdjuntos.test.ts` › orden, desde y limite (6 pruebas: orden por ticket e id, reanudable e idempotente, limite cuenta pedidos, clasificación previa, lo guardado entretanto, sin tamaño) › `expected false to be true` (el `terminado` que nunca llega en `fin`, porque el esqueleto no lanza).
- › recuento › `expected { pendientes: +0, bytes: +0, …(4) } to deeply equal { pendientes: 3, bytes: 3145728, … }` (dos pruebas) y, en `dir` nulo, `the given combination of arguments (undefined and string) is invalid` (el esqueleto no deja `error`).
- › 404, 429, otros fallos y disco (8 pruebas: 404, 429 dos veces, 429 agotado, 500 y red, tamaño, disco lleno, directorio inexistente, pausa de 150 ms) › `expected false to be true` en `fin` y en el `fin` del reloj falso.
- › un solo lanzamiento, resumen y log (5 pruebas) › `expected false to be true` (`a.lanzada` en «dos lanzar seguidos») y `expected { enMarcha: false, …(12) } to match object { enMarcha: true, …(3) }` en «el estado durante y después».

### Verde y una corrección que nació de la prueba
Primera pasada con producción: 22 de 23; cayó «lo guardado entretanto por otra vía cuenta yaPresentes» (`expected [ '4001', '4002' ] to deeply equal [ '4001' ]`). Causa real, de producción y no de la prueba: la lista de D3 se fija al lanzar, así que el `storage_path` de la fila es el de entonces y `estadoCopia` daba `sinCopia` al adjunto que otra vía acababa de guardar. Se añadió `copiaActual` (`apps/desk/server/adjuntos/rellenoAdjuntos.ts:80`): si la copia no está `presente` con la fila de la lista, relee el `storage_path` de la base justo antes de pedir y vuelve a evaluar. Es lo que D3 dice («el `stat` va justo antes de pedir»). Después: 23 de 23.

Focal: `npx vitest run apps/desk/server/adjuntos/rellenoAdjuntos.test.ts apps/desk/server/adjuntos/almacen.test.ts apps/desk/server/adjuntos/rutaAdjunto.test.ts` → 3 ficheros, 96 pruebas (23 + 37 + 36), código 0. `npm run typecheck` 0; `npm run lint -- --max-warnings 165` 0, 165 avisos contra 165 (ninguno nuevo).

Pruebas de `rellenoAdjuntos.test.ts` (23): constantes (1); orden, desde y limite (6); recuento y `dir` nulo (3); 404, 429, otros fallos y disco (8); un solo lanzamiento, resumen y log (5).

### Mutaciones (L3.8)
Cada una con perl por número de línea; la línea mutada se imprimió con `sed -n` antes de correr la suite; suite: `rellenoAdjuntos.test.ts` (23 pruebas). Restaurado copiando el respaldo y comparando con `cmp` y `sha256sum` (idéntico, `3298e10d…`).

| Id | Fichero:línea | Mutación | Pruebas que caen | Restaurado |
|---|---|---|---|---|
| M5 | `apps/desk/server/adjuntos/rellenoAdjuntos.ts:117` | `return 'corte'` pasa a `return` (no cortar ante `429` agotado) | 1: 429 agotado corta con cortadoEn tras 3 reintentos y NO pide el siguiente | sí |
| M6 | `apps/desk/server/adjuntos/rellenoAdjuntos.ts:69`, `:72`, `:97` | el `name` viaja del `SELECT` al `adjunto` de `fallidos` | 5: clasificación previa (fallido:id), 500 y red, bytes de menos, el resumen (estado y registrar) y el registrar por defecto | sí |
| P3a | `apps/desk/server/adjuntos/rellenoAdjuntos.ts:115` | línea insertada antes del `429`: todo lo que no sea `404` es `fallido:http` (el `429` queda tras `!res.ok`) | 2: 429 dos veces y luego 200; 429 agotado | sí |
| P3b | `apps/desk/server/adjuntos/rellenoAdjuntos.ts:119` | línea insertada antes del `404`: `fallido:http` | 1: 404 es ausente | sí |
| P5 | `apps/desk/server/adjuntos/rellenoAdjuntos.ts:171` y `:134` | `enMarcha: true` pasa a `false` y `estado.enMarcha = true` tras el primer `await` | 2: dos lanzar seguidos lanzan UNO; el estado durante y después | sí |

Nota de método: M6 hace caer cinco pruebas porque `fallidos` entra en el JSON de las dos comprobaciones y en los `toEqual` de las demás; sólo las dos del resumen ejercen la defensa de fondo (el `name` serializado).

### TDD Cycle Evidence
| Tarea | Fichero de prueba | Capa | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| L3.2 orden, desde, limite, recuento, `dir` nulo | `apps/desk/server/adjuntos/rellenoAdjuntos.test.ts` | Integración (pg-mem + fs real + `zohoFetch` falsa) | N/A (nuevo); `almacen.ts` intacto | medido, 9 rojas | 9/9 tras `copiaActual` | `desde` con y sin; `limite` con presentes; recuento con y sin tamaño | sin cambios |
| L3.3 404, 429, 500, red, disco | ídem (`setTimeout` falso, sólo ése) | Integración | N/A (nuevo) | medido, 8 rojas | 8/8 | 429 dos veces frente a agotado; 500 frente a red; disco frente a directorio inexistente | sin cambios |
| L3.4 un lanzamiento, resumen, log | ídem | Integración | N/A (nuevo) | medido, 5 rojas | 5/5 | `registrar` inyectado frente a `logger.info`; `registrar` que lanza | sin cambios |

### Work Unit Evidence
| Evidencia | Valor |
|---|---|
| Prueba focal | la de arriba, 96 pruebas, código 0 |
| Arnés real | pg-mem + `fs.mkdtemp` + `zohoFetch` falsa; `setTimeout` falso sólo en las pruebas de espera |
| Frontera de vuelta atrás | borrar `apps/desk/server/adjuntos/rellenoAdjuntos.ts` y su prueba; nadie más los importa todavía (rutas en L5, gancho en L4) |

### L3.9 · casilla de la regla 13
`git diff --name-only` → sólo `openspec/changes/persistencia-adjuntos/tasks.md` y este fichero; `git ls-files --others --exclude-standard` → los dos ficheros nuevos. Cero bajo `apps/desk/src`. El cliente no toma decisión alguna en este lote.

### Supuestos
1. `limite` corta al llegar al primer adjunto pendiente más allá del tope; los clasificados antes (sin ruta, ya presentes, `fallido:id`) cuentan siempre.
2. Un `stat` fallido del directorio deja `cortadoEn` en el número del primer ticket pendiente, `motivoCorte: 'disco'` y `motivoPrimerFallo` con el `code` de Node (probado con `ENOENT`).
3. `recuento` no cuenta los ids no numéricos (ni pendientes ni sin ruta): la pasada los lista como `fallido:id`. Si `estadoCopia` lanza `ErrorDisco` en `recuento`, la promesa rechaza (la ruta de L5 decide la respuesta).
4. `motivoPrimerFallo` de `fallido:base` y de `fallido:id` es un texto fijo, para no volcar un id que no es numérico.
5. Con `dir` nulo, `lanzar` sustituye el estado por uno nuevo con sólo `error`; no deja `terminado`.
6. `lanzar({ limite: 0 })` no pide nada y termina; el contar sin Zoho es de `recuento` (L5), como dice el encargo.

### Contraste y cierre del lote L3 (L3.7 suite entera y L3.10, orquestador, sobre `3daa344e`)
- Contraste: la focal da 96 pruebas (23 + 37 + 36), código 0, con el recuento del informe. El motor se leyó contra D4 y D8: tipo `EstadoRellenoAdjuntos` y `Motivo` iguales a D8; el `429` se repite llamando otra vez a `guardarAdjunto` hasta `REINTENTOS_429` y después corta; el `404` y el `429` van antes del caso general; `enMarcha` se fija en `lanzar` antes de `void pasada(...)`. Mutación reproducida: **M5** (`return 'corte'` → `return` en `apps/desk/server/adjuntos/rellenoAdjuntos.ts:117`) tumba la misma prueba («429 agotado corta con cortadoEn tras 3 reintentos y NO pide el siguiente»); restaurada con `git checkout` sobre el commit y `git status` vacío.
- `npm run typecheck` 0; `npm run lint -- --max-warnings 165` 0, **165 avisos contra 165**; detector de citas 0; `npm run build` 0 (el mismo bundle).
- `npm test`, pasada 1: memoria libre al arrancar **9.810 MB**, duración **437 s**, código **0**; 342 ficheros pasan y 4 omitidos; 5.977 pruebas pasan y 26 omitidas (5.954 + 23 nuevas).
- Barrido B.1: L3 sólo crea ficheros nuevos, no edita ninguno muy citado. Las seis citas a `rellenoAdjuntos.ts` de esta sección (69, 80, 115, 117, 119 y 171) se leyeron contra el fichero y dicen lo que afirman.
- Regla 13: nada bajo `apps/desk/src`.

## Lote L4 — intento i5 (gancho al sincronizar)

Modo: Strict TDD. Partida: `9a5f1890` (código de L3 en `3daa344e`). Ficheros nuevos, los tres en LF como `apps/desk/server/adjuntos/almacen.ts`: `apps/desk/server/adjuntos/guardadoAlSincronizar.ts` (78 líneas), `apps/desk/server/adjuntos/guardadoAlSincronizar.test.ts` (281) y `packages/zoho-sync/src/conversacionesTrasGuardar.test.ts` (129). Editados en sitio, CRLF conservado (`file`) e inserciones = borrados (`git diff --numstat`): `packages/zoho-sync/src/conversaciones.ts` 6 6 (`:34`, `:149`, `:150`, `:154`, `:163`, `:173`), `packages/zoho-sync/src/sync.ts` 1 1 (`:66`), `apps/desk/server/index.ts` 2 2 (`:15`, `:23`), `apps/desk/server/opcionesConversaciones.test.ts` 1 1 (`:25`). Más las casillas L4.1 a L4.10 de `tasks.md`. `apps/hub-sync/src/hub-sync.ts` sólo se mutó y se restauró (`git diff` vacío); `almacen.ts` y `rellenoAdjuntos.ts` no se tocaron.

### L4.1 · M0 (hecha por el orquestador)
`npm test` entero en `3daa344e` (código de L3; `9a5f1890` sólo documentos): memoria libre al arrancar 9.810 MB, 437 s, código 0; 342 ficheros pasan y 4 omitidos; 5.977 pruebas pasan y 26 omitidas.

### Red de seguridad (antes de tocar nada)
La focal ampliada (los ficheros del encargo más los que leen el texto de `index.ts`, `sync.ts` o `conversaciones.ts`, `apps/desk/server/adjuntos/`, `apps/hub-sync/src/`, `packages/zoho-sync/src/` y `registro.test.ts`): 71 ficheros pasan y 2 omitidos; 960 pruebas pasan y 7 omitidas, código 0.

### Rojo medido (L4.5), por la razón correcta: el gancho no existe, no un import roto
- `conversacionesTrasGuardar.test.ts` (nuevo): 4 rojas de 9. Antes de producción la pasada no llamaba a nada: «una sola llamada, con los tres ids…» › `expected [] to deeply equal [ { …(2) } ]`; «el segundo ciclo…», «el 102 falla al guardar…» y «rechaza: syncRecent devuelve su cuenta…» › `expected "spy" to be called 1 times, but got 0 times`. Las 5 verdes (apertura no llama, 429 salta el gancho, periódica apagada, sin gancho, los tres fallan) son de caracterización y las ejercen P5, M4a y M8c.
- `guardadoAlSincronizar.test.ts` (nuevo), contra un esqueleto que sólo exporta `TOPE_ADJUNTOS_POR_CICLO` y `conGuardadoDeAdjuntos` devolviendo `op`: 11 rojas de 21. «un ticket recién guardado con 25 pendientes…», «el tope cuenta peticiones…» y «un adjunto que falla con 500…» › `expected [] to deeply equal [ '5001', '5002', '5003', …(17) ]`; «con ambos abiertos…» y «abrir el ticket (syncConversations)…» › `expected undefined to be type of 'function'`; «el 4007 (404)…», «la memoria vive en el gancho…», «un 429 en el adjunto…» y «un disco que falla…» › `expected [] to deeply equal [ … ]`; «trasGuardar no rechaza…» › `TypeError: conBaseCaida.trasGuardar is not a function`; «la línea de log…» › `expected "noop" to be called 1 times, but got 0 times`. Las 10 verdes («nada se descarga»: interruptor cerrado, directorio inválido, worker) las ejercen M8c, M9 y los controles.
- `apps/desk/server/opcionesConversaciones.test.ts:25` (en sitio): 1 roja de 4 antes de tocar `index.ts` › `expected 'const sync = createSync({ zohoFetch, …' to contain 'conversaciones: conGuardadoDeAdjuntos…'`.

### Verde
Primera pasada de `conversacionesTrasGuardar.test.ts` tras editar `conversaciones.ts`: 5 de 9, porque `sync.ts:66` aún no reenviaba; con esa línea: 9 de 9. `guardadoAlSincronizar.test.ts`: 17 de 21 en la primera pasada; las 4 caídas eran de la PRUEBA y no de producción (la lista `peticiones` se acumulaba entre ciclos y faltaba el ticket `101` en una prueba que llamaba al gancho directo); corregidas en la prueba, 21 de 21. Después de editar `index.ts`, `opcionesConversaciones.test.ts` 4 de 4.

Pruebas de `conversacionesTrasGuardar.test.ts` (9): una sola llamada con los ids en orden y tras las tres listas; segundo ciclo sin cambios no llama; sin `trasGuardar` guarda igual; el 102 falla y llegan el 101 y el 103; fallan los tres y no se llama; gancho que rechaza no rompe el ciclo (mensaje propio del gancho); corte por 429 salta el gancho; la apertura no lo llama; periódica apagada.
Pruebas de `guardadoAlSincronizar.test.ts` (21): tope = 20 (1); 25 pendientes y ticket no tocado, con ciclo siguiente (1); el tope cuenta peticiones y no pendientes (1); un 500 cuenta para el tope (1); `TRUE`, `1` y vacío (3); periódica cerrada (1); control abierto (1); opciones conservadas (1); directorio ausente, relativo y dentro de `dist/` (3); 404 y tamaño no se repiten, el 500 sí (1); la memoria es del gancho (1); 429 corta y se reintenta (1); disco corta (1); no rechaza (1); log sin `name` (1); worker sin gancho (1); apertura sin descarga (1).

Producción: `apps/desk/server/adjuntos/guardadoAlSincronizar.ts`. `conGuardadoDeAdjuntos` devuelve `op` tal cual si el interruptor no es `true` o `dirAdjuntos` da `null` (`apps/desk/server/adjuntos/guardadoAlSincronizar.ts:33`, `apps/desk/server/adjuntos/guardadoAlSincronizar.ts:34`); el `Set` se crea una vez (`apps/desk/server/adjuntos/guardadoAlSincronizar.ts:35`); `estadoCopia` descarta lo presente antes de pedir (`apps/desk/server/adjuntos/guardadoAlSincronizar.ts:52`); el tope en `apps/desk/server/adjuntos/guardadoAlSincronizar.ts:53`; el `429` en `apps/desk/server/adjuntos/guardadoAlSincronizar.ts:58`; el `404` en `apps/desk/server/adjuntos/guardadoAlSincronizar.ts:59` y el tamaño en `apps/desk/server/adjuntos/guardadoAlSincronizar.ts:62`; `ErrorDisco` corta en `apps/desk/server/adjuntos/guardadoAlSincronizar.ts:68`; una línea de log (`apps/desk/server/adjuntos/guardadoAlSincronizar.ts:71`) con ids y cuentas, sin `name`.

Focal final: `npx vitest run` sobre los ficheros del encargo, los que leen el texto, `apps/desk/server/adjuntos/`, `apps/hub-sync/src/`, `packages/zoho-sync/src/` y `registro.test.ts` → 73 ficheros pasan y 2 omitidos; 990 pruebas pasan y 7 omitidas (960 + 21 + 9), código 0. Mínima del encargo: `guardadoAlSincronizar.test.ts` 21, `conversacionesTrasGuardar.test.ts` 9, `conversaciones.test.ts` 33, `hubSyncSinConversaciones.test.ts` 2, `opcionesConversaciones.test.ts` 4. `npm run typecheck` 0; `npm run lint -- --max-warnings 165` 0, **165 avisos contra 165** (ninguno nuevo).

### Mutaciones (L4.9)
Cada una con perl por número de línea; la línea mutada se imprimió con `sed -n` antes de correr la suite (5 ficheros, 69 pruebas). Restauradas copiando un respaldo del fichero ya editado (sin `git checkout`) y comprobando `cmp` igual al respaldo y su `sha256sum`.

| Id | Fichero:línea | Mutación | Pruebas que caen | Restaurado |
|---|---|---|---|---|
| M4a | `packages/zoho-sync/src/sync.ts:189` | `syncConversations` llama a `conversaciones?.trasGuardar?.([id])` | 2: «la apertura (syncConversations) guarda la lista y nunca llama a trasGuardar» y «abrir el ticket (syncConversations) guarda la lista y no pide ningún adjunto…» | sí |
| M4b | `apps/hub-sync/src/hub-sync.ts:21` | `createSync` recibe `conversaciones: { periodica: true }` | 1: `hub-sync.ts no pasa conversaciones a createSync (fichero vigilado)` (`hubSyncSinConversaciones.test.ts`) | sí |
| M5 | `apps/desk/server/adjuntos/guardadoAlSincronizar.ts:58` | el `429` no hace `break` | 1: «un 429 en el adjunto corta sólo ese guardado…» | sí |
| M8a | `apps/desk/server/adjuntos/guardadoAlSincronizar.ts:53` | el tope pasa a `1e9` | 3: 25 pendientes, el tope cuenta peticiones y el 500 cuenta para el tope | sí |
| M8b-1 | `apps/desk/server/adjuntos/guardadoAlSincronizar.ts:59` | el `404` no entra en el `Set` | 1: «el 4007 (404) y el 4008 (tamaño) se piden una vez…» | sí |
| M8b-2 | `apps/desk/server/adjuntos/guardadoAlSincronizar.ts:62` | el tamaño no entra en el `Set` | 1: la misma | sí |
| M8c | `packages/zoho-sync/src/sync.ts:66` | sin `, trasGuardar: conversaciones.trasGuardar` | 13: 4 de `conversacionesTrasGuardar.test.ts` y 9 de `guardadoAlSincronizar.test.ts` | sí |
| M9 | `apps/desk/server/index.ts:23` | vuelve a `conversaciones: opcionesConversaciones(config)` | 1: `index.ts pasa esas opciones a createSync y no lee los interruptores por su cuenta` | sí |
| P5 | `packages/zoho-sync/src/conversaciones.ts:163` | `guardados.push(id)` antes de `guardarYReflejar` | 2: «el 102 falla al guardar…» y «si fallan los tres…» | sí |
| Mx-catch | `packages/zoho-sync/src/conversaciones.ts:173` | sin el `?.catch(...)` del gancho | 1: «rechaza: syncRecent devuelve su cuenta…» (ver la nota) | sí |
| Mx-disco | `apps/desk/server/adjuntos/guardadoAlSincronizar.ts:68` | `ErrorDisco` no hace `break` | 1: «un disco que falla corta el guardado…» | sí |

Nota de método: la primera versión de «rechaza…» sólo comprobaba el texto `volumen lleno`, y Mx-catch la dejaba en verde porque `sincronizarModificados` ya recoge el rechazo de la pasada con su propio `catch` (`trasLeer`, en `packages/zoho-sync/src/sync.ts`). Se afinó para exigir el mensaje propio del gancho (`el gancho trasGuardar falló: volumen lleno`) y entonces Mx-catch cae. El `catch` de `packages/zoho-sync/src/conversaciones.ts:173` no cambia el resultado del ciclo, sólo QUIÉN lo anota.

### TDD Cycle Evidence
| Tarea | Fichero de prueba | Capa | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| L4.2 gancho de la pasada | `packages/zoho-sync/src/conversacionesTrasGuardar.test.ts` | Integración (`createSync` real + pg-mem) | focal 71 ficheros, 960 pruebas | medido, 4 rojas | 9/9 | llamada y no llamada (tres tickets, fallo de uno, de tres, 429, apertura, periódica apagada, ciclo repetido) | sin cambios |
| L4.3 + L4.7 guardado al sincronizar | `apps/desk/server/adjuntos/guardadoAlSincronizar.test.ts` | Integración (`createSync` real + pg-mem + `fs.mkdtemp`) | N/A (nuevo) | medido, 11 rojas | 21/21 | tope con y sin ya presentes; `TRUE`/`1`/vacío; tres directorios inválidos; 404/tamaño frente a 500; 429 frente a disco | sin cambios |
| L4.4 + L4.6 fichero vigilado | `apps/desk/server/opcionesConversaciones.test.ts` | Estática sobre `index.ts` | 4/4 | medido, 1 roja | 4/4 | M9 lo ejerce | sin cambios |

### Work Unit Evidence
| Evidencia | Valor |
|---|---|
| Prueba focal | la de arriba, 73 ficheros y 990 pruebas, código 0 |
| Arnés real | `createSync` real con `zohoFetch` enrutada, pg-mem y `fs.mkdtemp` |
| Frontera de vuelta atrás | `apps/desk/server/adjuntos/guardadoAlSincronizar.ts` y sus dos pruebas; las seis líneas de `conversaciones.ts`, `sync.ts:66`, las dos de `index.ts` y `opcionesConversaciones.test.ts:25` |

### L4.10 · casilla de la regla 13
`git diff --name-only` → `apps/desk/server/index.ts`, `apps/desk/server/opcionesConversaciones.test.ts`, `packages/zoho-sync/src/conversaciones.ts`, `packages/zoho-sync/src/sync.ts` y `tasks.md`; cero bajo `apps/desk/src`. El cliente no toma decisión alguna: interruptores, directorio, tope y cortes los decide el servidor.

### Supuestos
1. Un `429` en un adjunto corta el guardado de ese ciclo SIN reintentar la misma petición (a diferencia del relleno, que repite `REINTENTOS_429` veces): el ciclo siguiente lo reintenta y no entra en la memoria de descartados. D5 dice que `429` y `ErrorDisco` «cortan sólo ese guardado».
2. La pausa entre peticiones de adjuntos es `op.pausaMs ?? PAUSA_ENTRE_TICKETS_MS` (150 ms en producción; 0 en las pruebas): una sola perilla para las dos pasadas.
3. Sólo se consideran pendientes las filas con id numérico y `zoho_href` que casa con la ruta permitida; las demás no gastan petición ni se anotan (es asunto del relleno, que las cuenta).
4. `trasGuardar` consulta con `IN ($1, …)` y no con `= ANY($1)`, para no depender de cómo pg-mem trata el arreglo; el número de ids es el de los tickets recién guardados en el ciclo.
5. El `catch` de `packages/zoho-sync/src/conversaciones.ts:173` va en la forma del encargo (`trasGuardar?.(guardados)?.catch(...)`): protege de un rechazo, no de un gancho que lance de forma síncrona; el de `conGuardadoDeAdjuntos` es `async` y no puede.
6. La línea de log es `logger.info` y sólo sale si hubo alguna petición; lleva `tickets`, `peticiones`, `guardados`, `ausentes`, `fallidos` (id y motivo) y `corte`.

### Pendiente del cierre (orquestador)
L4.8 suite entera (`npm test` con log), `npm run build`, el detector de citas sobre el commit, la medida del intento y el barrido B.1 (`packages/zoho-sync/src/conversaciones.ts:163` sigue siendo la llamada a `guardarYReflejar` seguida de `guardados.push(id)` y `packages/zoho-sync/src/conversaciones.ts:166` el `return` del corte por `429`; `packages/zoho-sync/src/sync.ts:66`, `apps/desk/server/index.ts:15` y `apps/desk/server/index.ts:23` en su sitio) — casilla L4.11.

### Contraste y cierre del lote L4 (L4.8 suite entera y L4.11, orquestador, sobre `9f5f3512`)
- Contraste: `git diff --numstat` coincide (`conversaciones.ts` 6 6, `sync.ts` 1 1, `index.ts` 2 2, `opcionesConversaciones.test.ts` 1 1) y los cuatro siguen en CRLF; la línea 163 de `packages/zoho-sync/src/conversaciones.ts` sigue siendo la llamada a `guardarYReflejar` y la 166 el `return` del corte por `429`. La focal ampliada del orquestador (todo `apps/desk/server/adjuntos`, `packages/zoho-sync/src`, `apps/hub-sync/src` y las pruebas que leen el texto de `index.ts`, `sync.ts` y `conversaciones.ts`) da 67 ficheros y 783 pruebas, código 0. Mutaciones reproducidas: **M9** (`apps/desk/server/index.ts:23` de vuelta a `conversaciones: opcionesConversaciones(config)`) tumba 1 prueba de `apps/desk/server/opcionesConversaciones.test.ts`; **M8c** (`packages/zoho-sync/src/sync.ts:66` sin `trasGuardar`) tumba 13 de las 30 de los dos ficheros nuevos de prueba. Las dos restauradas con `git checkout` sobre el commit; `git status` vacío y CRLF.
- `npm run typecheck` 0; `npm run lint -- --max-warnings 165` 0, **165 avisos contra 165**; detector de citas 0; `npm run build` 0 (el mismo bundle).
- `npm test`, pasada 1: memoria libre al arrancar **7.721 MB**, duración **438 s**, código **0**; 344 ficheros pasan y 4 omitidos; 6.007 pruebas pasan y 26 omitidas (5.977 + 30 nuevas: 21 + 9).
- Barrido B.1 sobre todo el repositorio (archivos y `docs/` incluidos): `conversaciones.ts`, `sync.ts` e `index.ts` se editaron en sitio. Las citas a las líneas tocadas siguen diciendo lo que afirman (caso A): `conversaciones.ts:163` (`esperadoDeZoho(t)`) y `conversaciones.ts:149` (parámetros con valor por omisión) en el `verify-report.md` y el `design.md` archivados; `sync.ts:66` (la pasada se crea sólo con `periodica === true`) en los paquetes de despliegue del 30/10 y del 02/11 y en el archivo de `sync-conversaciones-zoho`; `index.ts:23` (el cableado de `createSync` que sólo hace la App) en `DEPLOY.md:839` y en los paquetes; `index.ts:15` (importaciones). La de `index.ts:23-24` del paquete del 27/09 va anclada en `dcb5c99` (caso B).
- Regla 13: nada bajo `apps/desk/src`.
