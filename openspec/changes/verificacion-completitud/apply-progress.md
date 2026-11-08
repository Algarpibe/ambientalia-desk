# apply-progress — `verificacion-completitud` (1G-03)

Modo: Strict TDD. Partida de L1: `3de383da` (intento i3). Estado: L1.1-L1.10 hechas; L1.11 (las cinco comprobaciones en 0 y la medida final) pendiente del orquestador.

## Lote L1 — intento i3

### L1.1 · M0 (hecha por el orquestador, cierre de i2 sobre `3de383da`)
`npm test` entero: 346 ficheros pasan, 4 omitidos; 6.037 pruebas pasan, 26 omitidas; 246 s; 13.470 MB libres; código 0. Log `npmtest-vco-i2-190535.log`.

### Safety net (antes de tocar ficheros existentes)
`config.test.ts` 25/25, `deployRellenoAdjuntos.test.ts` 8/8, `deployRellenoConversaciones.test.ts` 4/4: 37 pasan.

### Rojo medido (L1.2-L1.4); ninguna roja por el arnés
- `comparar.test.ts` y `veredicto.test.ts` (nuevos): ROJAS como suite, `Cannot find module './comparar'` y `'./veredicto'`; la causa es que el código no existe (8 y 11 pruebas sin poder cargar).
- `deployVerificacionCompletitud.test.ts` (4 rojas, la §23 no existía): › la sección existe… › `expected -1 to be greater than -1`; › dice qué enciende… › `expected '' not to be ''`; › nace cerrado… › `expected '' to contain '**Nace cerrado**'`; › los pasos nombran la ruta… › `expected '' to contain '/api/admin/verificacion-completitud'`.
- `config.test.ts` (1 roja, al final del fichero): › loadConfig · verificacionCompletitudHabilitada › nace cerrada… › `expected undefined to be false`.

### Verde
- `npx vitest run apps/desk/server/completitud packages/zoho-sync/src/config.test.ts`: 3 ficheros, 45 pasan (comparar 8, veredicto 11, config 26).
- Focal completa (los seis ficheros de la tabla de L1): 6 ficheros, 61 pruebas pasan. `npm run typecheck` 0. `npm run lint -- --max-warnings 165`: 165 avisos contra 165, 0 errores, 0 nuevos.
- L1.8 suite entera, primer plano, `npm test`, 19:16:11 a 19:20:20; memoria libre al arrancar 10.491 MB; código 0; 349 ficheros pasan, 4 omitidos; 6.061 pruebas pasan, 26 omitidas (+3 ficheros, +24 pruebas sobre M0: 8+11+4+1); 245,45 s. Log `npmtest-vco-L1-verde.log`.

### L1.6 · rojo medido de la guarda que cuenta el árbol (con la §23 añadida y antes de tocar la guarda)
`deployRellenoAdjuntos.test.ts` › DEPLOY.md §22 › la sección existe, tras la §21, es la última y tiene sus tres apartados › `expected [ '## 22.', '## 23.' ] to have a length of 1 but got 2` (`:37:42`). 1 roja de 8. La del `:38` (`### \``, 4 contra 3) existe pero queda tapada: la aserción de `:37` lanza antes. Corregida en sitio, 4/4 (`:11`, `:22`, `:34`, `:37`), molde `deployRellenoConversaciones.test.ts:19` y `:25`; vuelve a 8/8.

### L1.9 · Mutaciones (`perl -i -pe '… if $. == N'`; veredicto.ts es nuevo y sin trackear, restaurado con copia y `cmp`)
| Id | Fichero:línea y edición | Rojo (fichero › prueba › aserción) | Restauración |
|---|---|---|---|
| M1 | `packages/zoho-sync/src/config.ts:125`, `s/_HABILITADA === 'true'/_HABILITADA !== 'false'/` | `config.test.ts` › nace cerrada… › `expected true to be false`; `deployVerificacionCompletitud.test.ts` › nace cerrado… › `expected '…' to contain 'env.VERIFICACION_COMPLETITUD_HABILITA…'` (2 rojas) | `git diff` idéntico al de antes, `file` aún CRLF |
| M5 | `apps/desk/server/completitud/veredicto.ts:18` (el `if … return 'incompleto'`), línea vaciada | `veredicto.test.ts` › veredictoGlobal › entidad sin comparar o incompleta / corte / cobertura no completa / escrituras rechazadas › `expected 'verde' to be 'incompleto'` (4 rojas) | `cmp` idéntico, 11/11 |
M5 se ejerce de nuevo en L6 con el motor (corte, error por ticket y parte perdida). Posición: el `if` del «incompleto» es una sola línea y vaciarla deja el fichero válido.

### L1.10 · Regla 13
`git diff --name-only`: `DEPLOY.md`, `deployRellenoAdjuntos.test.ts`, `appHarness.ts`, `tasks.md`, `config.test.ts`, `config.ts`; nada bajo `apps/desk/src`. El cliente no gana ninguna decisión.

### B.1 · Barrido de la regla de mutación 4 (parte de L1.11)
Ninguna línea existente se movió: `git diff -U0` da hunks `-N +N` en `config.ts:66` y `:125`, `appHarness.ts:46` y `:49`, `deployRellenoAdjuntos.test.ts:11`, `:22`, `:34`, `:37`, y adiciones puras al final de `DEPLOY.md` (`@@ -987,0 +988,41`) y de `config.test.ts` (`@@ -194,0 +195,10`). Con eso, ninguna cita `ruta:línea` de esos ficheros se desplaza. `grep -rnoE` sobre todo el repositorio (archive y docs incluidos): `zoho-sync/src/config.ts:(66|125)` en 58 citas de 28 ficheros, sin cambio de número; `config.ts:125` sigue diciendo `=== 'true'` (ahora también `VERIFICACION_COMPLETITUD_HABILITADA === 'true'`) y `:66` sigue siendo el tipo; `appHarness.ts:N` y `deployRellenoAdjuntos.test.ts:N` no cambian de número; las de `:37` y `:22` del propio cambio ya describen la guarda corregida. Las citas a `DEPLOY.md:N` no se mueven (añadido al final). Segundo pase de abreviadas: no hecho a mano (sin desplazamiento no hay nada que reapuntar).

### TDD Cycle Evidence
| Tarea | Fichero de prueba | Capa | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| L1.2/L1.5 comparar | `completitud/comparar.test.ts` | Unidad (puras) | N/A (nuevo) | medido (módulo ausente) | 8/8 | 8 casos (ids, orden, repetidos, tamaños) | sin cambios |
| L1.2/L1.5 veredicto | `completitud/veredicto.test.ts` | Unidad (puras) | N/A (nuevo) | medido (módulo ausente) | 11/11 | cada causa de «incompleto» por separado | sin cambios |
| L1.3/L1.5 interruptor | `packages/zoho-sync/src/config.test.ts` | Unidad | 25/25 | medido, 1 roja | 26/26 | `''`, `TRUE`, `1`, ausente cierran; `true` abre | sin cambios |
| L1.3/L1.6 §23 | `deployVerificacionCompletitud.test.ts` | Lectura de `DEPLOY.md` | N/A (nuevo) | medido, 4 rojas | 4/4 | 4 aspectos de la §23 | sin cambios |
| L1.7 guarda | `deployRellenoAdjuntos.test.ts` | Lectura de `DEPLOY.md` | 8/8 | medido, 1 roja | 8/8 | N/A (guarda en sitio) | sin cambios |

### Medida
`git diff --shortstat --no-renames 3de383da`: 6 ficheros, 70 inserciones y 19 borrados (89; incluye 11/11 de `tasks.md`, de ellas 1/1 del orquestador). `wc -l` de lo nuevo sin trackear: `comparar.ts` 32, `veredicto.ts` 20, `comparar.test.ts` 54, `veredicto.test.ts` 67, `deployVerificacionCompletitud.test.ts` 66, este fichero 49 (288). Total 377 contra 800. Binarios: ninguno.

### Cierre del orquestador (i3)
Commit `37aa6dff` sobre `3de383da`: medida `git diff --shortstat --no-renames 3de383da` = 12 ficheros, 358 inserciones y 19 borrados (377), 0 sin trackear; igual a la suma del informe del lote. Cinco comprobaciones en serie sobre el árbol commiteado: typecheck 0; lint 0 (165 avisos contra 165); detector 0 (8.104 comprobadas, 13 abreviadas rotas informativas, las mismas de la base); `npm test` 0 (349 ficheros + 4 omitidos, 6.061 pruebas + 26 omitidas; 256 s; 10.516 MB libres al arrancar; log `npmtest-vco-i3-192344.log` del scratchpad); build 0.

## Lote L2 — intento i4 (partida `52175178`)

Estado: L2.1-L2.7 hechas; L2.8 (las cinco comprobaciones sobre el árbol commiteado) pendiente del orquestador.

### L2.1 · M0 (orquestador, cierre de i3 sobre `37aa6dff`; `52175178` sólo añadió documentos)
`npm test`: 349 ficheros pasan, 4 omitidos; 6.061 pruebas pasan, 26 omitidas; 256 s; 10.516 MB libres; código 0. Log `npmtest-vco-i3-192344.log`.

### Rojo medido (L2.2-L2.4); ninguna roja por el arnés
- `conocidas.test.ts` y `clasificar.test.ts` (nuevos): ROJAS como suite, `Cannot find module './conocidas'` (la causa es que el código no existe).
- `deployVerificacionCompletitud.test.ts` (al final; `import()` dinámico para que sólo caiga la nueva): › conocidas.json · las entradas citadas existen › cada entrada del fichero real existe… › `Cannot find module './completitud/conocidas'`. Las cuatro de la §23 y el comprobador (› discrimina) pasan: 5 verdes, 1 roja.

### Verde
- Focal (tres ficheros): 47 pruebas pasan (conocidas 22, clasificar 19, deploy 6). `npm run typecheck` 0. `npm run lint -- --max-warnings 165`: 165 avisos contra 165, 0 errores (un primer lint dio 1 error `no-useless-escape` en mi `\.` del `RegExp` de la prueba: corregido a `[.]`, 0 nuevos).
- L2.6 suite entera. Primera pasada INVÁLIDA (log `npmtest-vco-L2-verde-1-invalida.log`, 19:36:25, 9.074 MB, 260 s): 1 roja en `conocidas.test.ts › copias ensuciadas › id con espacios`; causa mía, no del código: edité ese fichero de prueba (hacerlo perezoso, `() => sucia(…)`) mientras corría la suite y el worker lo leyó a medias. Segunda pasada, sin tocar nada mientras corría: 19:41:22 a 19:47:19, 11.018 MB libres al arrancar, código 0, 351 ficheros pasan, 4 omitidos; 6.104 pruebas pasan, 26 omitidas (+2 ficheros, +43 pruebas sobre M0); 351,15 s. Log `npmtest-vco-L2-verde.log`.

### L2.7 · Mutaciones (`perl -i -pe '… if $. == N'`; los tres ficheros de producción son nuevos y sin trackear: restaurados con copia y `cmp`, `file` sin cambio; el JSON, LF)
| Id | Fichero:línea y edición | Rojo (fichero › prueba › aserción) | Restauración |
|---|---|---|---|
| M6a | `conocidas.json:6`, `s/"causa": "[^"]*", //` | `conocidas.test.ts` › real › carga sin error / #1017 va por número… › `entrada 2 (tickets, E-267): falta \`causa\``; `clasificar.test.ts` (suite, mismo error); `deployVerificacionCompletitud.test.ts` › cada entrada del fichero real… | `cmp` idéntico |
| M6b | `conocidas.json:4`, `s/nacidoEnLaApp/nacidoEnApp/` | `conocidas.test.ts` › real › carga sin error › `entrada 0 (tickets, DEPLOY.md §23): \`regla\` desconocida para esa entidad` | idem |
| M7a | `conocidas.json:6`, `$_ = ""` (el JSON sigue válido; no es la última) | `clasificar.test.ts` › por id › el #1017 ausente de Zoho sale conocido… › `expected { clase: 'sin explicar', …(1) } to deeply equal { clase: 'conocida', entrada: 'E-267' }` (NO error de lectura); › conocidasSinUso › `to have a length of 5 but got 6`; `conocidas.test.ts` › real › `expected 7 … got 6` y `expected -1 to be greater than 0` | idem |
| M7b | `conocidas.ts:19`, línea de `conversacionAusenteEnZoho` vaciada en `REGLAS` | `conocidas.test.ts` › real › carga sin error › `entrada 6 (conversaciones, DEPLOY.md §19): \`regla\` desconocida…`; › las parejas de REGLAS son las cinco › `to deeply equal` de 4 contra 5; `clasificar.test.ts` y `deployVerificacionCompletitud.test.ts` › cada entrada… (el real deja de cargar) | idem |
| M9 | `clasificar.ts:40`, quitar `porHerencia(f) ?? ` | `clasificar.test.ts` › por herencia › un hijo de un ticket ausente copia clase… › `expected { clase: 'sin explicar' } to deeply equal { clase: 'conocida', …(4) }`; › un padre «sin explicar» transmite…; › un adjunto hereda antes de su conversación…; › orden › P6 (4 rojas) | `cmp` idéntico |
| P5 | `clasificar.ts:40`, `porRegla(f) ?? porId(f) ?? porHerencia(f) ?? SIN_EXPLICAR` | `clasificar.test.ts` › orden › P5: un ticket app- con entrada propia… › `expected { clase: 'conocida', …(3) } to match object { causa: 'propia', …(2) }`; › P6 (2 rojas) | idem |
| P6 | `clasificar.ts:40`, `porId(f) ?? porRegla(f) ?? porHerencia(f) ?? SIN_EXPLICAR` | `clasificar.test.ts` › orden › P6: una conversación nacida en la app bajo el #1017 sale con E-267 › `expected { clase: 'conocida', …(3) } to match object { entrada: 'E-267', …(1) }` (1 roja) | idem |
| (extra, regla de mutación 2) | `conocidas.json:6`, `"E-267"` → `"E-999999"` | `deployVerificacionCompletitud.test.ts` › cada entrada del fichero real existe… › `expected [ 'E-999999' ] to deeply equal []` | idem |
Posiciones: la clasificación es UNA línea (`clasificar.ts:40`); las tres variantes de orden (herencia fuera, regla primero, regla antes de herencia) las distingue cada una por una prueba distinta. `REGLAS` va una pareja por línea (`conocidas.ts:15-19`); el #1017 es la entrada 2 de 7, no la última, así que borrar su línea deja JSON válido.

### Regla 13 y barrido
`git diff --name-only`: sólo `apps/desk/server/deployVerificacionCompletitud.test.ts` (+26, al final) y los de este cambio; nada bajo `apps/desk/src`. B.1: ningún fichero muy citado editado en sitio; las 26 líneas añadidas al final de `deployVerificacionCompletitud.test.ts` (nuevo en L1) no desplazan nada y `grep -rnoE "deployVerificacionCompletitud\.test\.ts:[0-9]+"` da 0 citas.

### TDD Cycle Evidence
| Tarea | Fichero de prueba | Capa | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| L2.2/L2.5 conocidas | `completitud/conocidas.test.ts` | Unidad + fichero real | N/A (nuevo) | medido (módulo ausente) | 22/22 | 13 copias ensuciadas, 2 de repetidos, JSON roto | sin cambios |
| L2.3/L2.5 clasificar | `completitud/clasificar.test.ts` | Unidad (pura) | N/A (nuevo) | medido (módulo ausente) | 19/19 | por id, regla, herencia y orden, con contraejemplo cada una | sin cambios |
| L2.3 entradas existen | `deployVerificacionCompletitud.test.ts` | Lectura de `ENTRADA.md` y `DEPLOY.md` | 4/4 | medido (1 roja) | 6/6 | el comprobador con ausentes y mal formadas | sin cambios |

### Medida
`git diff --shortstat --no-renames 52175178` (tracked): 3 ficheros, 75 inserciones y 8 borrados (83; `deployVerificacionCompletitud.test.ts` +26, `tasks.md` 8/8, este fichero +41 en el momento de medir, ahora 93 líneas en total y +41 contra la partida más esta línea). `wc -l` de lo nuevo sin trackear: `conocidas.json` 12, `conocidas.ts` 69, `clasificar.ts` 47, `conocidas.test.ts` 121, `clasificar.test.ts` 139 (388). Total 471 contra 800. Binarios: ninguno.

### Cierre del orquestador (i4)
Commit `d5443ef1` sobre `52175178`: medida `git diff --shortstat --no-renames 52175178` = 8 ficheros, 463 inserciones y 8 borrados (471), 0 sin trackear; igual a la suma del informe del lote. Cinco comprobaciones en serie sobre el árbol commiteado: typecheck 0; lint 0 (165 avisos contra 165); detector 0 (8.114 comprobadas, 13 abreviadas rotas informativas, las de la base); `npm test` 0 (351 ficheros + 4 omitidos, 6.104 pruebas + 26 omitidas; 354 s; 11.752 MB libres al arrancar; log `npmtest-vco-i4-195127.log` del scratchpad); build 0.

## Lote L3 — intento i5 (partida `c67bef09`)

Estado: L3.1-L3.7 hechas; L3.8 (las cinco comprobaciones sobre el árbol commiteado) pendiente del orquestador.

### L3.1 · M0 (orquestador, cierre de i4 sobre `d5443ef1`; `c67bef09` sólo añadió documentos)
`npm test`: 351 ficheros pasan, 4 omitidos; 6.104 pruebas pasan, 26 omitidas; 354 s; 11.752 MB libres; código 0. Log `npmtest-vco-i4-195127.log`.

### Rojo medido (L3.2-L3.4); ninguna roja por el arnés
Safety net de lo existente que se toca: `packages/zoho-sync/src/db/history.test.ts` 1/1.
- `soloLectura.test.ts` y `lectores.test.ts` (nuevos): ROJAS como suite, `Cannot find module './soloLectura'` y `'./lectores'` (la causa es que el código no existe).
- CA-4 (con `lectores.ts` ya escrito, antes de exportar `eventId`): `lectores.test.ts` › historia › el evento guardado casa por el id derivado… › `TypeError: (0 , eventId) is not a function`; 1 roja de 16, las otras 15 verdes.

### Verde
Focal (`soloLectura.test.ts` 8, `lectores.test.ts` 16, `history.test.ts` 1): 25 pasan. `npm run typecheck` 0. `npm run lint -- --max-warnings 165`: 165 contra 165, 0 errores, 0 nuevos.
L3.6 suite entera, primer plano, `npm test`, 20:10:57 a 20:16:51, 11.816 MB libres al arrancar, 354 s, log `npmtest-vco-L3-verde.log`. **Código 1, y real**: 352 ficheros pasan, 1 falla, 4 omitidos; 6.127 pruebas pasan, 1 falla, 26 omitidas. La roja: `superficieSaliente.test.ts` › las llamadas no-GET… doce › `expected [ 'apps/desk/server/completitud/soloLectura.ts' ] to deeply equal []` (`verboDinamico`). Causa mía: el COMENTARIO de cabecera de `soloLectura.ts` escribía la subcadena `{ method,` que el barrido clasifica (`superficieSaliente.ts:57`); el código no la tenía. Arreglado reescribiendo el comentario sin ella. NO repetí la suite entera (una sola vez, por encargo): tras el arreglo, focal `superficieSaliente.test.ts` + `completitud/` = 7 ficheros, 86 pruebas verdes; typecheck 0; lint 165 contra 165. Esperado de la suite entera ahora: 353 ficheros + 4 omitidos, 6.128 pruebas (+2 ficheros y +24 sobre M0).

### L3.7 · Mutaciones (`perl -i -pe '… if $. == N'`; ficheros nuevos y sin trackear: restaurados con copia y `cmp` idéntico, LF sin cambio)
| Id | Fichero:línea y edición | Rojo (fichero › prueba › aserción) |
|---|---|---|
| M3 (c) | `soloLectura.ts:36`, línea de la comprobación de `soloGet` vaciada | `soloLectura.test.ts` › soloGet › un init con POST se rechaza y se cuenta… › `expected { total: +0, tipos: [] } to deeply equal { total: 2, …(1) }`; › el mismo registro suma… (2 rojas) |
| M4 (b) | `lectores.ts:56` (`leerPaginas`) y, aparte, `:73` (`leerPorId`): `catch (e) { return … motivo: String(e) }` | `lectores.test.ts` › leerPaginas › motivos cerrados… y › leerPorId › motivos cerrados… › `expected { estado: 'error', …(1) } to deeply equal { estado: 'error', motivo: 'red' }` (1 roja cada una) |
| P3 | `lectores.ts:44` (`leerPaginas`, copia de `!res.ok` antes de la del `429`) | › 429 se reintenta la MISMA petición… › `expected { estado: 'error', …(1) } to match object { estado: 'ok' }`; › en una lista, 404 y 500… (2 rojas) |
| P3 | `lectores.ts:66` (`leerPorId`, ídem antes de la del `429`) | › 429, 429, 404 ⇒ «no está» tras DOS pausas… › `expected [ '/tickets/1' ] to have a length of 2 but got 1`; › 429, 500…; › 404 a la primera…; › 429 agotado… (4 rojas) |
| P3 | `lectores.ts:67` (`leerPorId`, ídem antes de la del `404`) | › 429, 429, 404… y › 404 a la primera… › `expected { estado: 'error', …(1) } to deeply equal { estado: 'noEsta' }` (2 rojas) |
Un primer intento de P3 dio falsos verdes por mi `perl` (faltaba el `;` tras el `return` y el fichero no cargaba): rehecho con `; ` y el rojo salió de la guarda. `leerConversacionesDe` no tiene guardas propias (el orden vive en `leerConversaciones`, intacto), así que P3 son tres, una por lector.

### Regla 13 y barrido (B.1)
`git diff --name-only`: `proposal.md`, `history.ts`, `tasks.md`, este fichero; nada bajo `apps/desk/src`. En sitio, 1/1: `history.ts:8` (`export function eventId(`, CRLF intacto) y `proposal.md:47` (caso B: «en `03ab82c2`»). Ninguna línea se movió, así que ninguna cita `history.ts:N` cambia de número. `grep -rnoE "history\.ts:[0-9]+(-[0-9]+)?"` sobre todo el repositorio (archive y docs incluidos): 16 grupos. Leídas contra lo que afirman: las de sus líneas 8, 8 a 11 (4 ficheros de este cambio) y 17 siguen siendo `eventId` y su uso en el `upsert` (A); `proposal.md:132`, `spec.md:90`, `:114` igual; `openspec/specs/trazas/spec.md:126` (que cita las líneas 13 a 19 de `history.ts`, el upsert) y `openspec/specs/trazas/spec.md:131` (que cita su línea 16, el `ON CONFLICT`) aciertan; `openspec/changes/archive/2026-10-19-reloj-sla-esperas/proposal.md:67` (que cita su línea 15, el `INSERT`) y `Paquete_de_Despliegue_2026-09-10.md:456` (que cita sus líneas 14 a 18) acertan; `F0-00_Baseline_as-built.md:429` (que cita sus líneas 22 a 30, el comentario de `getZohoHistoryEvents`) acierta. Con revisión escrita y fuera de alcance (no se editan): `Triaje_Linea_Base_Citas_2026-09-15.md:74` y `2026-08-05-historia-unificada-ticket.md:290` (que citan sus líneas 21 a 36 en 9cea347, caso B). Caducas de antes, sin relación con este cambio y NO editadas: `docs/superpowers/specs/2026-08-05-historia-unificada-ticket-design.md:20` (que cita su línea 24 por `getTicketHistory`, hoy comentario) y `openspec/specs/trazas/spec.md:499` (que cita su línea 24, histórica con «hoy están en la 412»). Segundo pase de abreviadas: sin desplazamiento no hay nada que reapuntar.

### TDD Cycle Evidence
| Tarea | Fichero de prueba | Capa | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| L3.2/L3.5 soloLectura | `completitud/soloLectura.test.ts` | Unidad | N/A (nuevo) | medido (módulo ausente) | 8/8 | SELECT, INSERT, UPDATE/DELETE, VARIAS, `;` final, GET/POST/DELETE/PUT, registro compartido | guardas separadas en líneas propias (M3 c) |
| L3.3/L3.5 lectores | `completitud/lectores.test.ts` | Unidad, reloj falso | N/A (nuevo) | medido (módulo ausente) | 15/15 | por id y por lista, cada guarda con su contraejemplo | sin cambios |
| L3.3/L3.5 CA-4 | `completitud/lectores.test.ts` | pg-mem, `upsertHistoryEvent` real | 1/1 | medido (`eventId is not a function`) | 16/16 | guardado, nuevo y repetido | sin cambios |

### Decisiones de forma (el diseño no las fija)
`soloSelect(db, registro?)` y `soloGet(f, registro?)` reciben el registro (`crearRegistroEscrituras()`, `{ total, tipos }` con tipos únicos y ordenados); sin él crean uno propio. Los lectores devuelven `{ estado: 'ok' | 'error' | 'corte' | 'vivo' | 'noEsta' }` (P4 de L4 usa `estado`). `leerPaginas` admite `clave` para deduplicar (la historia no trae `id`: se pasa `eventId`). Motivos: `red`, `json`, `tope`, `forma` (ítem sin clave), `<recurso> http <n>` y `conversaciones http <n>|tope|red`; el `<recurso>` sale de la ruta sólo con segmentos de un conjunto cerrado (un id nunca entra). La pausa `PAUSA_ENTRE_TICKETS_MS` entre peticiones NO está en los lectores: la pone el motor (L4) al envolver `zohoFetch`.

### Medida
`git diff --shortstat --no-renames c67bef09` (rastreado): 4 ficheros, 52 inserciones y 10 borrados (62: este fichero +42, `tasks.md` 8/8, `proposal.md` 1/1, `history.ts` 1/1). `wc -l` de lo nuevo sin trackear: `soloLectura.ts` 39, `lectores.ts` 90, `soloLectura.test.ts` 81, `lectores.test.ts` 154 (364). Total 426 contra 800. Binarios: ninguno.

### Cierre del orquestador (i5)
Commit `9cec0871` sobre `c67bef09`: medida 8 ficheros, 416 inserciones y 10 borrados (426), 0 sin trackear; igual al informe del lote. Cinco comprobaciones en serie: typecheck 0; lint 0 (165 contra 165); `npm test` 0 (353 ficheros + 4 omitidos, 6.128 pruebas + 26 omitidas; 351 s; 11.818 MB libres al arrancar; log `npmtest-vco-i5-202013.log`), que es el verde completo que faltaba en L3.6 tras corregir el comentario; build 0; **detector 1**: la línea 125 de este fichero citaba una ruta abreviada inexistente (la propuesta archivada de `reloj-sla-esperas`) y una abreviada mal atribuida. Corregida en sitio (1/1, prosa o ruta completa) en el commit de cierre; el detector se repite sobre él.

## Lote L4 — intento i6 (partida `36f7ca51`)

Estado: L4.1-L4.6 hechas; L4.7 (las cinco comprobaciones sobre el árbol commiteado) pendiente del orquestador.

### L4.1 · M0 (orquestador, cierre de i5 sobre `9cec0871`; `36f7ca51` sólo añadió documentos)
`npm test`: 353 ficheros pasan, 4 omitidos; 6.128 pruebas pasan, 26 omitidas; 351 s; 11.818 MB libres; código 0. Log `npmtest-vco-i5-202013.log`.

### Rojo medido (L4.2-L4.3); ninguna roja por el arnés
`verificacionGlobal.test.ts` (nuevo, 25 pruebas): ROJA como suite, `Failed to load url ./verificacion (Does the file exist?)` (la causa es que el motor no existe). Con `verificacion.ts` escrito, las 25 pasaron a la primera: la triangulación ya estaba escrita (cada escenario con su contraejemplo) y las mutaciones de L4.6 son la prueba de que cada una discrimina.

### Verde
Focal (`completitud/` entera, 7 ficheros): 109 pasan; con `superficieSaliente.test.ts`, 27 de 27 en los dos. `npm run typecheck` 0. `npm run lint -- --max-warnings 165`: 165 contra 165, 0 errores, 0 nuevos.
L4.5 suite entera, primer plano, `npm test`, 20:39:51 a 20:45:19, 11.848 MB libres al arrancar, 329 s (325,12 s de vitest), código 0: 354 ficheros pasan, 4 omitidos; 6.153 pruebas pasan, 26 omitidas (+1 fichero y +25 pruebas sobre M0). Log `npmtest-vco-L4-verde.log`. Una sola pasada, sin tocar nada mientras corría.

### L4.6 · Mutaciones (`perl -i -pe '… if $. == N'`; `verificacion.ts` es nuevo y sin trackear: restaurado con copia y `cmp` idéntico, LF sin cambio)
| Id | Fichero:línea y edición | Rojo (fichero › prueba › aserción) |
|---|---|---|
| M3 (a) | `apps/desk/server/completitud/verificacion.ts:127` (la lista de la A), anteponer `const { createSync } = await import('@ambientalia/zoho-sync/sync'); await createSync({ zohoFetch: f, db: lee, config: { departmentId } as never }).backfillTickets(); ` (importación dinámica en la misma línea, un solo N) | › sólo lectura… › una pasada completa no escribe nada… › `expected 8 to be +0` (`escriturasRechazadas.total`, tipos `INSERT`; la excepción se la traga `persistEach`). Las otras 5 rojas son peticiones de más |
| M11 | `apps/desk/server/completitud/verificacion.ts:194` (primera de `recuento`), anteponer `await faseA(estadoInicial()); ` | › limite=0… › 3 tickets en Desk… › `expected [ …(9) ] to deeply equal []` (9 rutas pedidas a Zoho); la segunda roja es la lista inválida que la fase A carga por omisión |
| P4 | `apps/desk/server/completitud/verificacion.ts:138` (el bucle por id, UNA línea), `await leerPorId(…)` → `({ estado: 'noEsta' })` | › S-l… › `expected [ 'c1', 'c2' ] to deeply equal [ 'c1' ]` (el vivo sale «falta en Zoho»); › un error por id… ; › un contacto con managed_by_app sí se pide por id… › `expected +0 to be 1` (3 rojas) |
| P7 | `apps/desk/server/completitud/verificacion.ts:188` (`enMarcha: true` → `false`) y su línea 166 (primera de `pasada`), anteponer `await Promise.resolve(); estado.enMarcha = true; ` | › una pasada a la vez › dos lanzar seguidos… › `expected [ true, true, false ] to deeply equal [ true, false, true ]` (1 roja) |
Posiciones: el bucle de re-verificación es UNA línea (su línea 138); en `lanzar` la línea de `estado` con `enMarcha: true` (su línea 188) va seguida de `void pasada(lista)` (su línea 189) y ambas antes de todo `await`. El texto del bucle es `await leerPorId(f, \`${s.porId}${id}\`, { pausa429Ms })`: el `perl` de P4 usa `s/await leerPorId\([^)]*\)/…/`.

### Regla 13 y barrido (B.1)
`git diff --name-only`: sólo `tasks.md` y este fichero; nada bajo `apps/desk/src`. Ningún fichero muy citado se editó en sitio, así que no hay desplazamiento que barrer; `grep -rnoE "verificacion\.ts:[0-9]+"` sobre el repositorio no cita el módulo nuevo fuera de este fichero.

### API de `verificacion.ts` para L5 y L6
`crearVerificacionCompletitud({ zohoFetch, db, departmentId, dir, leerLista?, pausaMs?, pausa429Ms?, registrar? })` ⇒ `{ lanzar({ desde?, limite? }), recuento({ desde? }), estado() }`. Exporta los tipos `Fila`, `InformeEntidad`, `Informe`, `EstadoVerificacion`, `RecuentoVerificacion` y `DepsVerificacion` (L6 añade `fs`). Internos: `abrirContexto(estado, lista)` ⇒ `Contexto { f, lee, lista, informe, entidad, pedidas, clases }` (`f` cuenta peticiones y `429` por `ctx.entidad` y pone la pausa salvo en la primera; `lee` y `f` registran en `informe.escriturasRechazadas`); `entidadA(ctx, s)` por entidad global; `faseA(estado, ctx?)`; `pasada(lista)`; `listaValida()`. Corte en la A: `informe.cortadoEn = { fase: 'A', numero: null }`, `motivoCorte: '429'`, las entidades no alcanzadas siguen «sin comparar» con motivo `no alcanzada`. Las tres por ticket quedan «sin comparar» (`no alcanzada`, o `sin lista de tickets`), `cobertura.completa` es `false` fija y `aComparar` ya viene de la A. Faltan para L5: ordenar `errores` por entidad, número e id, el bucle de la B y `comparados`; para L6: la línea `completa:`, la C y la continuación (hoy no se guarda nada de la A cortada: se relanza sin `desde`).

### TDD Cycle Evidence
| Tarea | Fichero de prueba | Capa | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| L4.2/L4.4 fase A | `completitud/verificacionGlobal.test.ts` | pg-mem + Zoho falsa | N/A (nuevo) | medido (módulo ausente) | 25/25 | ids ordenados, idénticos, 3 entidades, archivados, hueco, 404/vivo/borrado/500, `app-` con y sin regla, lista y `429` | sin cambios |
| L4.2/L4.4 `lanzar`, `recuento`, `estado` | ídem | ídem | N/A (nuevo) | ídem | ídem | dos `lanzar`, tercera tras terminar, lista inválida y corregida, `desde`, copia del estado | sin cambios |

### Medida
`git diff --shortstat --no-renames 36f7ca51` (rastreado): 2 ficheros, 45 inserciones y 7 borrados (52: este fichero +38, `tasks.md` 7/7). `wc -l` de lo nuevo sin trackear: `verificacion.ts` 209, `verificacionGlobal.test.ts` 277 (486). Total 538 contra 800. Binarios: ninguno.
