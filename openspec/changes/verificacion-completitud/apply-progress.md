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
