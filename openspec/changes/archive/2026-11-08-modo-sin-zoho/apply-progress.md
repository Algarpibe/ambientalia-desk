# apply-progress — `modo-sin-zoho` (1G-04)

## Lote L1 — puerta, error, registro y configuración (intento i3) · L1.1 a L1.9 hechas; L1.10 es del orquestador
Partida `2a5602a7`. M0 (L1.1): `npm test` 0, 6199 verdes y 26 omitidas, 236 s (medido por el orquestador).

### Rojo medido (L1.4), sobre el módulo-esqueleto (firmas finales, cuerpos que no cumplen)
Corrida de las tres pruebas con el esqueleto: 52 rojas y 29 verdes de 81 (las verdes son guardas de lo existente o de vacío legítimo).
| Fichero › prueba | Aserción que falla |
|---|---|
| `modoSinZoho.test.ts` › ErrorModoSinZohoDesk › mensaje FIJO y marca | `expected 'sin implementar' to be 'modo sin Zoho Desk: la petición a Zoho Desk no salió'` |
| › acepta la marca de otra copia y rechaza lo que no es corte | `expected false to be true` |
| › recursoDeRuta (4 pruebas + 14 segmentos) | `expected '' to be 'GET /tickets/{x}'` y análogas |
| › llamadorDeLaPila (8 pruebas, pilas sintéticas y REAL) | `expected '' to be 'packages/zoho-sync/src/sync.ts · fetchTicket'` y análogas |
| › registro · cortar (cuenta, primera/última, tragado, orden, copia, reloj) | `expected Error: sin implementar to be an instance of ErrorModoSinZohoDesk`; `expected [] to deeply equal [ {…} ]` |
| › registro · rechazos y marcadores | `expected { cortes: [], rechazos: [] } to deeply equal { …rechazos: [2] }` |
| › registro · avisar (4 pruebas) | `expected [] to deeply equal [ …(2) ]` |
| `zohoClientModoSinZoho.test.ts` › abierto (6 pruebas) | `promise resolved "Response { status: 401 …"` (el transporte SÍ salió); `expected undefined to be an instance of ErrorModoSinZohoDesk` |
| › cerrado `TRUE`, `1`, vacío, ausente, `false` | `expected undefined to be false` (el campo no existe aún) |
| `config.test.ts` › modoSinZohoDesk nace cerrado | `expected undefined to be false` |
Verdes en el esqueleto, a propósito: «cerrado y con 401 reintenta» (puerta de hoy), «abierto exige credenciales» (S-g) y «registro vacío lee vacío».

### Verde (L1.5 a L1.7)
Focal `modoSinZoho.test.ts` + `zohoClientModoSinZoho.test.ts` + `zohoClient.test.ts` + `config.test.ts`: 4 ficheros, 83 pruebas verdes (`zohoClient.test.ts` intacto). `npm run typecheck` salida 0.
`npm run lint -- --max-warnings 165` salida 0, «165 problems (0 errors, 165 warnings)».
Ediciones en sitio: `zohoClient.ts` 4/4 (`:2`, `:11`, `:14`, `:29`), `config.ts` 2/2 (`:66`, `:125`); `config.test.ts` +16 al final. Finales de línea CRLF conservados.

### Mutaciones (L1.8), `perl -i -pe '… if $. == N'`, restauración con la sustitución inversa
| # | Mutación | Pruebas rojas | Restaurado (sha256 igual) |
|---|---|---|---|
| M1 | `config.ts:125` `=== 'true'` → `!== 'false'` | config › nace cerrado; zohoClientModoSinZoho › cerrado `TRUE`, `1`, vacío, ausente, y «cerrado con 401» (6) | sí, `dcc28c31e9b56c1c` |
| M2 | el `if` de `zohoClient.ts:29` movido tras `:30` (`getAccessToken`) | abierto › no sale transporte ni token; › 401 sin reintento; › sin registro inyectado (3) | sí, `a9ff91203d137c41` |
| M3 | quitar el corte de `zohoClient.ts:29` | las cinco de «abierto» salvo la de configuración (5) | sí, `a9ff91203d137c41` |
| M4 | en `cortar`, la cuenta tras el `throw` | cortar CUENTA…, dos cortes, tragado, orden, copia, reloj, avisar×2, marcadores, sin etiqueta y la del registro inyectado (11) | sí, `7e3f76d4aace68a2` |
| M5a | `recursoDeRuta` sin `{x}` | reduce el verbo…, casi-inventario, marcadores y las que usan `/tickets/{x}` (10) | sí |
| M5b | `recursoDeRuta` sin quitar la query | reduce el verbo…, marcadores (2) | sí |
| M6 | `llamadorDeLaPila` sin recortar | las 8 de llamadorDeLaPila salvo `desconocido`, más 5 del registro (13) | sí |
| M7 | `esCorteModoSinZoho` = `instanceof Error` | acepta la marca… y rechaza lo que no es un corte (1) | sí |
| M8 | `avisar` en cada corte | avisa UNA vez por origen nuevo (1) | sí |
Tras cada una, `file` conserva «CRLF line terminators» y `git diff --numstat` vuelve a 4/4, 2/2.

### Regla 13 (L1.9) y medida
`git diff --name-only` no contiene nada bajo `apps/desk/src`. El código nuevo no tiene `method:` literal ni `{ method,`; `MODO_SIN_ZOHO_DESK` sólo está en `config.ts` y en pruebas.
Medida antes de este fichero: `git diff --shortstat --no-renames HEAD` 22 inserciones y 6 borrados (28) + `wc -l` de lo nuevo 622 (146 + 344 + 132) = 650.
Desviación: ninguna del diseño. `recursoDeRuta` conserva las barras y deja `{x}` por segmento; el verbo se lee por acceso (`init?.method`).

### Contraste del orquestador y cierre (L1.10)
Informe contrastado dato a dato: `git diff --numstat` 4/4, 2/2, +16, 9/9; `wc -l` 146 + 344 + 132 + 44; CRLF en los `.ts`; focal repetida, 83 verdes. M3 reproducida por el orquestador (quitar el corte de `zohoClient.ts:29`: 5 rojas de 12, sha256 restaurado `a9ff91203d137c41`, CRLF). Barrido B.1: 15 citas a `zohoClient.ts` (`:2`, `:18`, `:29`, `:29-37`, `:30`, `:33`) y 111 a `config.ts:66`/`:125`, en todo el repositorio con `archive/` y `docs/`; ninguna queda falseada (la edición sólo añade al final de la línea; las de `archive/` son registros fechados, caso B). Las cinco comprobaciones y la medida del intento, en `msz-i3-codes.txt`.

## Lote L2 — ciclo periódico y arranque de la App (intento i4) · L2.1 a L2.6 hechas; L2.7 es del orquestador
Partida `1c386a5d` (trae L1).

### Rojo medido (L2.3)
`cicloPeriodico.ts` creado primero como esqueleto (firma final, cuerpo `Promise.resolve()`); `index.ts` sin tocar. Corrida de las dos pruebas nuevas: 10 rojas y 2 verdes de 12 (las verdes son guardas de lo existente: `let syncing = false` seguida de `setInterval(() => {`, y migración/resiembra sin el salto).
| Fichero › prueba | Aserción que falla |
|---|---|
| `cicloPeriodico.test.ts` › abierto · corre las cinco y ritmoContratos (2 pruebas) | `expected [] to deeply equal [ 'alarmas', 'reclamaciones', …(4) ]` |
| › cerrado · las seis, actividades y contactos; con actividades apagado; con contactos apagado; con los dos apagados (4) | `expected [] to deeply equal [ 'alarmas', 'reclamaciones', …(6) ]` y análogas |
| › la promesa devuelta · rechaza si un paso falla | `promise resolved "undefined" instead of rejecting` |
| `modoSinZohoIndice.test.ts` › la línea de `cadenaDelCiclo(` lleva las seis pasadas… | `se esperaba UNA línea con «cadenaDelCiclo({»: expected [] to have a length of 1 but got +0` |
| › el backfill, las actividades y los contactos iniciales llevan `!config.modoSinZohoDesk` | `expected '  countTickets(pool)' to contain '!config.modoSinZohoDesk'` |
| › `const registroModo =` UNA vez, con `avisar:`, y `createZohoClient(` pasa `registroModo` | `se esperaba UNA línea con «const registroModo =»: expected [] to have a length of 1 but got +0` |

### Verde (L2.4, L2.5)
`cicloPeriodico.ts` (40 líneas): cinco primeras encadenadas; la sexta es `ritmoContratos` (abierto) o `ritmoYSincronizacion` (cerrado); cerrado, después actividades y contactos según flags.
`index.ts` 8/8 en sitio (`:15`, `:20`, `:61`, `:72`, `:78`, `:88`, `:89`, `:90`); `:49`, `:23`, `:85`, `:93` intactas. `:89` y `:90` son comentarios sin `sync.syncRecent()`. CRLF conservado.
Focal (`cicloPeriodico`, `modoSinZohoIndice`, `services`, `opcionesConversaciones`, `citas/guardianes`): 23 ficheros, 527 pruebas verdes, salida 0; las cuatro de servicios que leen `index.ts` verdes SIN tocarlas. `npm run typecheck` salida 0. `npm run lint -- --max-warnings 165` salida 0, «165 problems (0 errors, 165 warnings)».

### Mutaciones (L2.6), `perl -i -pe '… if $. == N'`, restauración con la sustitución inversa
| # | Mutación | Orden | Pruebas rojas | Restaurado (sha256) |
|---|---|---|---|---|
| M1 | `cicloPeriodico.ts:34` condición → `true` (cerrado también `ritmoContratos`) | focal | cicloPeriodico › cerrado (4: las seis; actividades apagado; contactos apagado; los dos apagados) | sí, `adf99feabb441403` |
| M2 | `cicloPeriodico.ts:34` condición → `false` (abierto también `ritmoYSincronizacion`) | focal | cicloPeriodico › abierto (2) | sí, `adf99feabb441403` |
| M3 | `cicloPeriodico.ts:33` `provisionalesEnBooks` → `undefined` (quitar una evaluación) | focal | cicloPeriodico › abierto (2) y cerrado (4) | sí, `adf99feabb441403` |
| M4 | `index.ts:89` comentario con `sync.syncRecent()` | focal | las cuatro de servicios: `alarmasSla` (orden), `avisoProvisionalEnBooks` (l), `avisoReclamacionProveedor` (línea de la pasada), `avisoRitmoContrato` (encadena antes) | sí, `e03fe6c24d84b67f` |
| M5 | `index.ts:61` sin `if (!config.modoSinZohoDesk) ` | focal | modoSinZohoIndice › el backfill, las actividades y los contactos iniciales llevan… | sí, `e03fe6c24d84b67f` |
| M6 | `index.ts:72` sin `&& !config.modoSinZohoDesk` | focal | ídem (1) | sí, `e03fe6c24d84b67f` |
| M7 | `index.ts:78` sin `&& !config.modoSinZohoDesk` | focal | ídem (1) | sí, `e03fe6c24d84b67f` |
| M8 | `index.ts:85` `setInterval(` envuelto en `if (true) ` | focal | modoSinZohoIndice › `let syncing = false` va seguida de `setInterval(() => {` (1) | sí, `e03fe6c24d84b67f` |
Focal = las cinco rutas del L2.5 salvo `citas/guardianes` (que no depende de estas líneas). Tras cada una, `file` conserva «CRLF line terminators». Los ficheros nuevos se escribieron y se pasaron a CRLF como el resto de los `.ts` del árbol.

### Regla 13 (L2.7, parte del agente) y medida
`git diff --name-only` sólo contiene `apps/desk/server/index.ts`: nada bajo `apps/desk/src`. El código nuevo no tiene `method:` literal ni `{ method,`; `MODO_SIN_ZOHO_DESK` no aparece en producción de este lote.
Medida antes de este fichero: `git diff --shortstat --no-renames HEAD` 8 inserciones y 8 borrados (16) + `wc -l` de lo nuevo 166 (40 + 74 + 52) = 182.
Desviación: ninguna del diseño. `cadenaDelCiclo` usa `Pick<AppConfig, 'modoSinZohoDesk' | 'syncActivities' | 'syncContacts'>`, como se pidió. Dos pruebas de vigilancia (`let syncing` y migración/resiembra) nacen verdes por ser guardas de lo existente; las muta M8.

### Contraste del orquestador y cierre (L2.7)
Informe contrastado: `index.ts` 8/8 con el prefijo de `:15` intacto (sólo crece por el final) y `:88` literal; `wc -l` 40 + 74 + 52; CRLF. Una afirmación del informe era errónea y sin efecto: `apply-progress.md` y `tasks.md` SÍ salen en `git status`. Mutación M4 reproducida por el orquestador (`sync.syncRecent()` en el comentario de `index.ts:89`: rojas las cuatro de servicios; sha256 restaurado `e03fe6c24d84b67f`, CRLF). Barrido B.1 de `index.ts` (citas a `:15`, `:20`, `:61`, `:72`, `:78`, `:88`, `:89`, `:90` y a los rangos que las cubren, con `archive/` y `docs/`): las vivas —seis comentarios de servicios, `avisoRitmoContrato.test.ts:15` y `:177`, `derivacion-avisos/spec.md:816`, `:997`, `:1205`, `:1318`, `transitions-st/spec.md:1410`, `:1452`, `zoho-sync/spec.md:48`, `:264`, `:753`, `ENTRADA.md:1231`, `:1271`— siguen ciertas; las de `archive/`, los paquetes de despliegue y el baseline son registros fechados (caso B). Para Supervisión: `docs/sdd/ENTRADA.md:2059` («no existe interruptor para ello: la aplicación sincroniza siempre») deja de ser cierta con esta tanda; la rama no toca ese fichero.

## Lote L3 (intento i5) — guarda común, administración, manejador central y `GET`

### Rojo medido (L3.1, L3.2)
Estado de partida del rojo: `routes/modoSinZohoDesk.ts` con las firmas exportadas y cuerpos que no cumplen (`activo: false`, `responderModoSinZoho` vacío, `guardaModoSinZoho` siempre `next()`, `esRecuento` y `esConteoHistoria` en `false`, mensajes `''`, `registerModoSinZohoRoutes` vacío), el arnés (`appHarness.ts` 4/4) y ninguna ruta cableada. `npx vitest run modoSinZohoRutas.test.ts modoSinZohoIndice.test.ts`: salida 1, **25 rojas y 25 verdes de 50**. Las verdes son las que ya cumplen el comportamiento de hoy (sin sesión `401`, sin rol `403`, modo cerrado, `GET` de estado de los rellenos).
Rojo por aserción, ninguno por import ni por arnés (fichero › prueba › aserción):
| Prueba | Aserción que cae |
|---|---|
| `modoSinZohoIndice` › `createApp(` pasa `registroModo` | `expected '…createApp({ db: pool, zohoFetch, sync, config, respaldador })' to match /registroModo/` |
| `crearModoSinZoho` › activo exactamente con `true` | `expected false to be true` |
| `esRecuento` y `esConteoHistoria` (2) | `expected [false,…] to deeply equal [true,…]` |
| `responderModoSinZoho` (4: patrón, ruta desconocida, cabeceras enviadas, textos) | `expected [] to deeply equal [ 503, { error: '', … } ]`; `expected [] to deeply equal [ [ 'GET /a', 1 ] ]`; textos `''` frente a los de D-6 |
| `guardaModoSinZoho` › abierto y no libre | `expected 1 to be +0` (siguió) |
| `verificacion-completitud` › con rol, interruptor cerrado y `limite=abc` / interruptor abierto y `limite=abc` | `expected 403 to be 503` / `expected 400 to be 503` |
| `relleno-conversaciones` › interruptor cerrado y `limite=abc` | `expected 403 to be 503` |
| `relleno-adjuntos` › abierto y con rol | `expected 200 to be 503` (la ruta sigue) |
| `admin` › `measure-attachments`, `backfill-details`, `backfill-archived` (3) | `expected [200, undefined, …] to deeply equal [503, 'modo-sin-zoho-desk', …]` |
| `backfill-history` › `limite="abc"`; sin `limite` | `expected 200 to be 503` |
| rechazo patrón / segundo `503` suma (2) | `expected [] to deeply equal [ [ 'GET /api/admin/…', 1 ] ]` |
| manejador central (2) | `expected 500 to be 503` |
| `GET modo-sin-zoho-desk` (3) | `expected 404 to be 401`; `expected 404 to be 200` |

### Verde (L3.3 a L3.5)
`routes/modoSinZohoDesk.ts` (55 líneas). En sitio, misma línea física, `git diff --numstat` con inserciones = borrados: `app.ts` 6/6 (`:22`, `:31`, `:34`, `:50`, `:57`, `:79`; `:52` y `:58` intactas), `admin.ts` 7/7, `rellenoConversaciones.ts` 3/3, `rellenoAdjuntos.ts` 3/3, `verificacionCompletitud.ts` 3/3, `appHarness.ts` 4/4, `index.ts:49` 1/1. Pruebas de L3: `modoSinZohoRutas.test.ts` (nuevo, 44) y 8 líneas **al final** de `modoSinZohoIndice.test.ts` (+1 prueba, 6 en total).
Focal (`modoSinZohoRutas`, `modoSinZohoIndice`, `completitud/verificacionRutas`, `opcionesConversaciones`, `admin`, `auth/routes`, `rellenoConversacionesRutas`, `adjuntos/rellenoAdjuntosRutas`, más `superficieSaliente`): 9 ficheros, 161 pruebas verdes, salida 0; ninguna prueba existente tocada. `npm run typecheck` salida 0. `npm run lint -- --max-warnings 165` salida 0, «165 problems (0 errors, 165 warnings)».
**H-2, observada:** con Express 5 el error que escapa de un manejador asíncrono llega al manejador central CON `req.route`: el rechazo es `POST /api/admin/backfill-history` (patrón, sin query), no `(ruta desconocida)`. La prueba de L3 lo fija con `sync.backfillTicketHistory` rechazando `ErrorModoSinZohoDesk`; la de `GET /api/attachment` es L4.

### Mutaciones y posiciones (L3.6), `perl -i -pe '… if $. == N'`, restauración con la sustitución inversa
Orden de cada una: `modoSinZohoRutas.test.ts` + `modoSinZohoIndice.test.ts` (50). `sha256sum` (12 primeros) idéntico antes y después en todas, y `file` con «CRLF line terminators».
| # | Mutación | Pruebas rojas | sha256 |
|---|---|---|---|
| M1 | `verificacionCompletitud.ts:37` guarda ANTES de `requireAuth(db)` | verificación › sin sesión 401 y sin rol 403 (1) | `55c9a03243ac` |
| M2 | ídem, guarda TRAS `interruptorVerificacion` | verificación › interruptor cerrado y `limite=abc` (1; da `403`) | `55c9a03243ac` |
| M3 | ídem, guarda TRAS `validarParametros` | verificación › interruptor cerrado y `limite=abc`; interruptor abierto y `limite=abc` (2; dan `403` y `400`) | `55c9a03243ac` |
| M4 | `rellenoConversaciones.ts:36` guarda ANTES de `requireAuth(db)` | relleno-conversaciones › sin sesión 401 y sin rol 403 (1) | `462e8df1eca6` |
| M5 | ídem, guarda TRAS `interruptorRelleno` | relleno-conversaciones › interruptor cerrado y `limite=abc` (1; da `403`) | `462e8df1eca6` |
| M6 | `verificacionCompletitud.ts:37` sin `esRecuento` | verificación › `limite=0` da su recuento (1; da `503`) | `55c9a03243ac` |
| M7 | `rellenoConversaciones.ts:36` sin `esRecuento` | relleno-conversaciones › `limite=0` (1) | `462e8df1eca6` |
| M8 | `admin.ts:196` sin `esConteoHistoria` | backfill-history › `"0"`, `"00"`, `""` (3) | `290df3011ca6` |
| M9 | `app.ts:79` sin el prefijo `if (esCorteModoSinZoho(err)) …` | manejador central (2; dan `500`) | `23f8f4f6a063` |
| M10 | `modoSinZohoDesk.ts:27` `req.originalUrl` en lugar de `baseUrl + route.path` | responder › patrón; cabeceras enviadas; guarda abierta; verificación 503; rechazo patrón con marcadores en `rechazos`; manejador central (6) | `a6df289d46c7` |
| M11 | `modoSinZohoDesk.ts:28` sin `rechazar(ruta)` | `rechazos` vacío: 13 rojas (responder, guarda, verificación, admin, rechazo patrón, manejador central, `GET` de estado) | `a6df289d46c7` |
| M12 | `index.ts:49` `registroModo: crearRegistroModoSinZoho()` (segunda instancia) | modoSinZohoIndice › `createApp(` pasa `registroModo` (1). **Hallazgo:** la primera redacción de la prueba (`\bregistroModo\b`) NO la cazaba (la clave `registroModo:` la satisface); se afinó a `,\s*registroModo\s*\}\)` y `crearRegistroModoSinZoho(` en UNA línea | `d3d58c5ea78b` |
| M13 | `rellenoAdjuntos.ts:43` guarda TRAS `interruptorAdjuntos` | relleno-adjuntos › abierto y con rol (1; da `403`) | `d39869623860` |
| M14 | `modoSinZohoDesk.ts:39` sin `!modo.activo` | cerrado: guarda, verificación, relleno-conversaciones, relleno-adjuntos, admin (3), backfill-history (8 rojas en total) | `a6df289d46c7` |

### Regla 13 y medida
`git diff --name-only` sin nada bajo `apps/desk/src`. Código nuevo de producción sin `method:` literal ni `{ method,`; `MODO_SIN_ZOHO_DESK` aparece SÓLO dentro de `MENSAJE_MODO_SIN_ZOHO_DESK` (identificador pedido por D-6; con `\b` el barrido de L6 no lo casa, a vigilar allí).
Medida antes de este bloque: `git diff --shortstat --no-renames HEAD` 35 inserciones y 27 borrados (62) + `wc -l` de lo nuevo 386 (331 + 55) = 448.

### Contraste del orquestador y cierre (L3.7)
Informe contrastado: `git diff --numstat` (6/6, 1/1, +8, 7/7, 3/3 ×3, 4/4), `wc -l` 331 + 55, CRLF; cada línea editada en sitio comparada por prefijo y sufijo con la de `a0660bb7`: sólo añade (y en `app.ts:57` conserva literales los cuatro `habilitado: … === true`), sin cambiar el número de líneas de ningún fichero. Posición reproducida por el orquestador (guarda tras `interruptorVerificacion` en `routes/verificacionCompletitud.ts:37`: la prueba de posición recibe `403` en vez de `503`; sha256 restaurado `55c9a03243ac7e42`, CRLF). Barrido B.1 de `app.ts`, `routes/admin.ts`, las tres rutas, `testing/appHarness.ts` e `index.ts:49`: las citas vivas que caen en líneas editadas son `DEPLOY.md:874` (`admin.ts:53-58`, cierto con el modo cerrado; abierto lo documenta la §24), `openspec/specs/zoho-sync/spec.md:2271` (`rellenoAdjuntos.ts:17-55`) y `:665` (`appHarness.ts:46`), ciertas; las de `archive/`, los paquetes de despliegue y el plan del 19/06 son registros fechados (caso B). Aviso para L6: `MENSAJE_MODO_SIN_ZOHO_DESK` contiene la variable como subcadena; la señal del barrido va con `\b`.

## Lote L4 (intento i6) — aperturas, respuesta y adjunto · L4.1 a L4.5 hechas; L4.6 es del orquestador

### Rojo medido (L4.1, L4.2)
Cableado previo SÓLO de tipos (`modo: ModoSinZoho` en los `deps` de `tickets.ts:23` y `attachment.ts:8`, import de tipo y `, modo` en `app.ts:52`, `:58`), sin lógica; `npm run typecheck` salida 0. `npx vitest run apps/desk/server/modoSinZohoAperturas.test.ts` salida 1: 4 rojas por aserción, 7 verdes (las verdes son las que fijan el comportamiento de hoy o ya cubierto: cerrado sigue a `sync`, `403` de `ENABLE_WRITES`, `403` de área, copia válida, `401`/`400`, H-2 por el manejador de L3).
| Prueba | Aserción |
|---|---|
| aperturas › detalle, conversaciones e historia del ticket con datos locales | `expected "spy" to not be called at all, but actually been called 1 times` |
| aperturas › el ticket sin datos locales: 404 en las tres aperturas | `expected [ '/conversations', 200, [] ] to deeply equal [ '/conversations', 404, … ]` |
| reply › con ENABLE_WRITES y área: 503 | `expected [ 200, { ok: true } ] to deeply equal [ 503, { … } ]` |
| attachment › sin copia: 503 con el texto de D-6 | `expected [ 200, {} ] to deeply equal [ 503, { … } ]` |

### Verde (L4.3, L4.4)
En sitio, misma línea física: `tickets.ts` 14/8 (8 líneas editadas `:13`, `:23`, `:25`, `:132`, `:136`, `:149`, `:169`, `:196` + 6 al final: línea en blanco, comentario y `servirLocal`), `attachment.ts` 11/5 (editadas `:1`, `:4`, `:8`, `:10`, `:22` + 6 al final con `adjuntoSinCopiaEnModo`), `app.ts` 2/2 (`:52`, `:58`). `wc -l`: `tickets.ts` 223→229, `attachment.ts` 36→42. Prueba nueva `modoSinZohoAperturas.test.ts` (173 líneas, 11 pruebas, CRLF).
**Desviación (ruta:línea):** `attachment.ts:1` también se edita (`import type { Express }` → `{ Express, Request, Response }`): `adjuntoSinCopiaEnModo` necesita los dos tipos y la tarea no listaba esa línea. Misma línea física, sin cambiar el número de líneas.
Focal (`modoSinZohoAperturas`, `modoSinZohoRutas`, `modoSinZohoIndice`, `adjuntos/` entero —incluye `rutaAdjunto.test.ts:8-13` intacta—, `tickets`, `busquedaTickets`, `busquedaTicketsHuecos`, `misTickets`, `ordenVentaUnTicket`, `opcionesConversaciones`, `rellenoConversacionesRutas`, `migracionTicketsAbiertosRuta`, `superficieSaliente`): 18 ficheros, 376 pruebas verdes, salida 0. `npm run typecheck` salida 0. `npm run lint -- --max-warnings 165` salida 0, «165 problems (0 errors, 165 warnings)». Ninguna prueba existente tocada. No hay pruebas de historia ni de respuesta con nombre propio: se cubrieron las de `tickets.test.ts` (historia y conversaciones).
**H-2, observada:** con el modo CERRADO y `zohoFetch` rechazando `new ErrorModoSinZohoDesk()`, el adjunto sin copia sale por `attachment.ts:24` (rama `throw e`) al manejador central: `503` con el cuerpo de D-6 y `registro.leer().rechazos` = `[{ ruta: 'GET /api/attachment', cuenta: 1, … }]` (patrón, no `(ruta desconocida)`). Pasa desde el rojo porque lo da el manejador de L3.
**Hallazgo en la prueba del log:** la aserción del marcador del `name` sola no cazaría una fuga del `path` de Zoho; se añadió `not.toContain(HREF('5002'))` (M9).

### Mutaciones (L4.5), `perl -i -pe '… if $. == N'`, restauración con la sustitución inversa
Orden de cada una: `modoSinZohoAperturas.test.ts`. `sha256sum` idéntico antes y después en todas (`tickets.ts` `657d37d6b972…`, `attachment.ts` `5e448f3a71a9…`) y `file` con CRLF.
| # | Mutación | Pruebas rojas |
|---|---|---|
| M1 | `tickets.ts:132` sin `if (!modo.activo) ` | aperturas › sin datos locales (1) |
| M2 | `tickets.ts:136` sin `if (!modo.activo) ` | aperturas › con datos locales (1) |
| M3 | `tickets.ts:149` sin el añadido | aperturas › con datos locales; sin datos locales (2) |
| M4 | `tickets.ts:169` sin el añadido | aperturas › con datos locales; sin datos locales (2) |
| M5 | `tickets.ts:196` guarda ANTES de `guardWrites` | reply › `ENABLE_WRITES` cerrado; abierto y sin área (2; dan `503`) |
| M6 | `tickets.ts:196` guarda entre `guardWrites` y `requireArea` | reply › abierto y sin área (1; da `503`) |
| M7 | `attachment.ts:22` sin el añadido | attachment › sin copia (1; llama a `zohoFetch`) |
| M8 | línea de `logger.warn` (`attachment.ts:40`) con `name` | attachment › sin copia (1; el marcador aparece) |
| M9 | ídem con `path` | attachment › sin copia (1; aparece el href) |

### Regla 13 y medida
`git diff --name-only` sin nada bajo `apps/desk/src`. Código nuevo de producción sin `method:` ni `{ method,` nuevos (el `method: 'POST'` de `tickets.ts:204` es preexistente) y sin `MODO_SIN_ZOHO_DESK`.
Medida: `git diff --shortstat --no-renames HEAD` 27 inserciones y 15 borrados (42) + `wc -l` de lo nuevo sin trackear 173 = 215 (estimado ~415).

### Contraste del orquestador y cierre (L4.6)
Informe contrastado: `git diff --numstat` 2/2, 11/5, 14/8; `wc -l` del nuevo 173; CRLF; cada línea editada en sitio comparada con la de `c5b6cd2d`: sólo añade, y lo nuevo (`servirLocal`, `adjuntoSinCopiaEnModo`) va al final. Desviación declarada y aceptada: `routes/attachment.ts:1` también en sitio (añade los tipos `Request` y `Response`). La medida del informe (215) no contaba `apply-progress.md` ni `tasks.md`; la del intento la da el commit. Posición reproducida por el orquestador (guarda entre `guardWrites` y `requireArea` en `routes/tickets.ts:196`: sin área se recibe `503` en vez del `403` del área; sha256 restaurado `657d37d6b972eda4`, CRLF). Barrido B.1 de `routes/tickets.ts` y `routes/attachment.ts`: las citas vivas a líneas editadas son cuatro a `tickets.ts:196` (`openspec/specs/permissions/spec.md:658`, `openspec/specs/zoho-sync/spec.md:244`, `:604`, `:755`) y siguen ciertas; las de `attachment.ts` apuntan sólo a `:17`, que no cambia.

## Lote L5 (intento i7) — el worker · L5.1 a L5.5 hechas; L5.6 es del orquestador

### Rojo medido (L5.1, L5.2)
Antes de medir se añadió sólo `modoSinZohoDesk?: boolean` a los dos tipos (`hubSync.ts:11`, `:86`), para que la prueba compile. `npx vitest run apps/hub-sync/src/hubSyncModoSinZoho.test.ts`: 9 pruebas, 5 rojas por aserción, 4 verdes (las de cerrado y sin campo, que fijan el comportamiento de hoy).
| Fichero › prueba | Aserción |
|---|---|
| hubSyncModoSinZoho › hubBootstrap › abierto y con el hub vacío | `expected "spy" to not be called at all, but actually been called 1 times` (`backfillTickets`) |
| hubSyncModoSinZoho › scheduleHubSync › abierto: no programa la pasada de Desk | `expected "spy" to not be called at all, but actually been called 3 times` (`syncRecent`) |
| hubSyncModoSinZoho › hub-sync.ts › hubBootstrap lleva el modo | `expected '  await hubBootstrap({ db: pool, sync…' to contain 'modoSinZohoDesk: config.modoSinZohoDesk'` |
| hubSyncModoSinZoho › hub-sync.ts › scheduleHubSync lleva el modo | ídem con `scheduleHubSync({ sync, booksHubSyn…` |
| hubSyncModoSinZoho › hub-sync.ts › createZohoClient recibe registro y aviso | `expected 'const { zohoFetch } = createZohoClien…' to contain 'registro:'` |

### Verde (L5.3, L5.4)
En sitio, misma línea física: `hubSync.ts` 8/8 (`:11`, `:12`, `:15`, `:21`, `:22`, `:86`, `:87`, `:90`), `hub-sync.ts` 4/4 (`:4`, `:20`, `:48`, `:49`); `createSync(` (`:21`) intacta. Books y CRM sin cambio; `migrate` y la resiembra siguen corriendo. Focal `npx vitest run apps/hub-sync/src`: 4 ficheros, 26 pruebas verdes (`hub-sync.guardian.test.ts`, `hubSyncSinConversaciones.test.ts` y `hubSync.test.ts` intactas). `npm run typecheck` salida 0. Lint `--max-warnings 165`: salida 0, «165 problems (0 errors, 165 warnings)».

### Mutaciones (L5.5), `perl -i -pe '… if $. == N'`, restauración con la sustitución inversa
`sha256sum` idéntico antes y después en todas (`hubSync.ts` `66fd1bf72a03…`, `hub-sync.ts` `647152a1f51a…`) y `file` con CRLF. Cada una pone rojas EXACTAMENTE 1 prueba de las 26.
| # | Mutación | Prueba roja |
|---|---|---|
| M1 | `hubSync.ts:90` sin `if (!modoSinZohoDesk) ` | scheduleHubSync › abierto: no programa la pasada de Desk |
| M2 | `hubSync.ts:15` sin `!modoSinZohoDesk && ` | hubBootstrap › abierto y con el hub vacío |
| M3 | `hubSync.ts:21` sin el prefijo | hubBootstrap › abierto y con el hub vacío |
| M4 | `hubSync.ts:22` sin el prefijo | hubBootstrap › abierto y con el hub vacío |
| M5 | `hub-sync.ts:48` sin el campo | hub-sync.ts › hubBootstrap lleva el modo |
| M6 | `hub-sync.ts:49` sin el campo | hub-sync.ts › scheduleHubSync lleva el modo |
| M7 | `hub-sync.ts:20` sin `avisar:` | hub-sync.ts › createZohoClient recibe registro y aviso |

### Regla 13 y medida
`git diff --name-only` sin nada bajo `apps/desk/src`. Código nuevo sin `method:` ni `MODO_SIN_ZOHO_DESK`.
Medida: `git diff --shortstat --no-renames HEAD` 47 inserciones y 17 borrados (64, con `apply-progress.md` y `tasks.md`) + `wc -l` de lo nuevo sin trackear 135 = 199 (estimado ~335).

### Contraste del orquestador y cierre (L5.6)
Informe contrastado: `git diff --numstat` 8/8 y 4/4 (cada línea sólo añade, comparada con la de `7c081f63`), `wc -l` 135, CRLF. Mutación M1 reproducida por el orquestador (sin el prefijo de `apps/hub-sync/src/hubSync.ts:90` se programa Desk: 1 roja de 26; sha256 restaurado `66fd1bf72a03529f`, CRLF). Barrido B.1 de `hubSync.ts` y `hub-sync.ts`: siguen ciertas `openspec/specs/zoho-sync/spec.md:272` (`hub-sync.ts:49`), `:376` (`hubSync.ts:10-20`) y `DEPLOY.md:199` (`hubSync.ts:11-72`); el `hubSync.ts:90` de `packages/zoho-sync/src/modoSinZoho.test.ts:127` es una pila sintética. Preexistente y NO causado por esta tanda (no mueve líneas): `openspec/specs/zoho-sync/spec.md:48` y `:753` (`hubSync.ts:79-95`), `:266` (`:87-89`, Books) y `:270` (`:88-95`) apuntan a posiciones anteriores a `244c237c` y siguientes; hoy Desk está en `:90-100` y Books en `:101-105`. Nota para Supervisión.

## Lote L6 (intento i8) — barrido del repositorio · L6.1 a L6.5 hechas; L6.6 es del orquestador

### Rojo medido (L6.1, L6.2)
Antes de medir se creó `apps/desk/server/testing/barridoZohoDesk.ts` con las firmas finales y cuerpos que no cumplen (`sinComentarios` devolvía el texto tal cual, `barrer` `{ hallazgos: [], sinUso: [] }`, `leerArbol` `[]`, `PERMITIDOS` `{}`). `npx vitest run apps/desk/server/barridoZohoDesk.test.ts`: 23 pruebas, 17 rojas por aserción, 6 verdes (las que un cuerpo vacío cumple por casualidad: «sólo en comentarios no cuenta», «no casa lo vecino», raíz inexistente y tres del árbol real que dependen de que haya hallazgos).
| Fichero › prueba | Aserción |
|---|---|
| barridoZohoDesk › sinComentarios › quita el comentario de línea | `expected 'const a = 1 // fetch(x)\nconst b = 2' not to contain 'fetch'` |
| › quita el comentario de bloque | `expected 'a\n/* desk.zoho.com…' not to contain 'desk.zoho'` |
| › no rompe un https:// dentro de una cadena | `expected "const u = 'https://x.test' // nota" not to contain 'nota'` |
| › respeta las comillas escapadas | `… not to contain 'sí lo es'` |
| › conserva las plantillas anidadas | `… not to contain 'nota'` |
| › quita un comentario dentro de `${…}` | `… not to contain 'fetch'` |
| › un literal regex con // y comillas | `… not to contain 'nota'` |
| › una regex tras ( , : ! & … | `f(: expected 'f( /\'/ // nota' not to contain 'nota'` |
| barrer › cada forma fuera de la lista pone el barrido en rojo | `sint/get-implicito.ts: expected [] to include 'transporte'` |
| barrer › la línea del hallazgo es la del código | `expected [] to deeply equal [ { senal: 'transporte', …(2) } ]` |
| barrer › una señal vale sólo en los ficheros de su lista | `expected [] to deeply equal [ { senal: 'transporte', …(2) } ]` |
| barrer › sinUso lista la pareja permitida sin coincidencia | `expected [] to deeply equal [ { senal: 'transporte', …(1) }, …(1) ]` |
| barrer › la lectura del modo va con límites de palabra | `expected [] to include 'lectura-modo'` |
| barrer › las señales de destino se ven dentro de cadenas | `expected [] to deeply equal ArrayContaining{…}` |
| leerArbol › lee las cuatro raíces… | `expected [] to deeply equal [ 'apps/desk/server/a.ts', …(4) ]` |
| leerArbol › los .ts pasan por sinComentarios… | `the given combination of arguments (undefined and string) is invalid for this assertion` (el fichero no se lee) |
| barrido real › recorre ficheros de verdad | `ficheros recorridos: 0: expected 0 to be greater than 0` |

### Verde (L6.3, L6.4)
`testing/barridoZohoDesk.ts` (nuevo): `sinComentarios`, `barrer`, `leerArbol`, `SENALES` (14, no exportada), `RAICES` y `PERMITIDOS`. `npx vitest run apps/desk/server/barridoZohoDesk.test.ts apps/desk/server/superficieSaliente.test.ts`: 2 ficheros, 25 pruebas verdes, salida 0 (`superficieSaliente.test.ts` intacta). Sobre el árbol real: **273 ficheros recorridos**, 0 hallazgos, `sinUso` vacío; sin lista (`barrer(arbol, {})`) hay 57 coincidencias en 32 parejas señal-fichero, y la lista tiene esas 32. Sin falso rojo: `sinComentarios` no se afinó. `npm run typecheck` salida 0. `npm run lint -- --max-warnings 165` salida 0, «165 problems (0 errors, 165 warnings)». La suite entera la corre el orquestador.

### La lista `PERMITIDOS`, medida otra vez (L6.3)
Orden usada, desde la raíz del worktree, para cada señal (la expresión es la de D-8; salida ordenada, antes de quitar comentarios, que luego deja el barrido):
`grep -rlE --include=*.ts --include=*.tsx --include=*.js --include=*.mjs --include=*.cjs --include=*.sh --exclude=*.test.ts --exclude=*.test.tsx --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build --exclude-dir=coverage --exclude-dir=testing --exclude-dir=.codegraph "<expresión>" apps/desk/server apps/hub-sync packages scripts`
| Señal | Ficheros (grep) | Lista |
|---|---|---|
| transporte `\b(fetch\|fetchImpl)\s*\(` | `avisosWebhook.ts`, `remisionWebhook.ts`, `respaldo/{dependencias,driveApi,driveAuth,multiparte}.ts`, `books/booksClient.ts`, `crmHub/crmClient.ts`, `tokenManager.ts`, `zohoClient.ts` (10) | los 10 |
| cliente-http (`http(s).request/get`, importación de `http`, `https`, `undici`, `axios`, `node-fetch`, `got`) | ninguno | `[]` |
| dominio-desk `desk\.zoho\.` | `config.ts` | `config.ts` |
| base-api `/api/v1\b` | `zohoClient.ts` | `zohoClient.ts` |
| ruta-desk-zohoapis `/desk/v\d` | ninguno | `[]` |
| campo-dominio `\b(apiDomain\|accountsDomain)\b` | `config.ts`, `tokenManager.ts`, `zohoClient.ts` | los 3 |
| dominio-cuentas `accounts\.zoho\.` | `config.ts` | `config.ts` |
| token-peticion `oauth/v2/token` | `books/booksClient.ts`, `crmHub/crmClient.ts`, `tokenManager.ts` | los 3 |
| token-cabecera `Zoho-oauthtoken` | `books/booksClient.ts`, `crmHub/crmClient.ts`, `zohoClient.ts` | los 3 |
| variables-desk `\bZOHO_(…)\b` | `config.ts` | `config.ts` |
| lectura-modo `\bMODO_SIN_ZOHO_DESK\b` | `config.ts` | `config.ts` |
| instancia-cliente `\bcreateZohoClient\s*\(` | `apps/desk/server/index.ts`, `apps/hub-sync/src/hub-sync.ts`, `zohoClient.ts` | los 3 |
| instancia-token `\bcreateTokenManager\s*\(` | `apps/desk/server/index.ts`, `apps/hub-sync/src/hub-sync.ts`, `tokenManager.ts` | los 3 |
| token `\bgetAccessToken\s*\(` | `tokenManager.ts`, `zohoClient.ts` | los 2 |
(Todas las rutas sin prefijo son de `packages/zoho-sync/src/`.) **Idéntica a la tabla de D-8**, con una sola diferencia de forma: la fila «instancias» de D-8 se parte en dos señales (`instancia-cliente` e `instancia-token`) porque `createTokenManager` no se llama en `zohoClient.ts` y `createZohoClient` no se llama en `tokenManager.ts`: con una sola señal, una de las dos parejas saldría en `sinUso`. Los tres ficheros nuevos de L1 a L5 (`modoSinZoho.ts`, `cicloPeriodico.ts`, `routes/modoSinZohoDesk.ts`) no tienen ninguna señal y no figuran; `MENSAJE_MODO_SIN_ZOHO_DESK` (`routes/modoSinZohoDesk.ts:12`) no casa por el límite de palabra. Fijado por la prueba «los ficheros nuevos de 1G-04 no figuran en ninguna lista».

### Mutaciones (L6.5), `perl -i -pe '… if $. == N'`, restauración con la sustitución inversa
(a) sobre el fichero vigilado `apps/desk/server/measure.ts` (copia en el scratchpad, línea añadida con `printf "…\r\n" >>`, restaurado con `cp`): `sha256sum` antes y después `4b082e9996…`, `git diff --stat` vacío, `file` con CRLF. (b)-(e) sobre `testing/barridoZohoDesk.ts`: `sha256sum` antes y después `c7aeafaf729b2e71`, `file` sin cambios (LF).
| # | Mutación | Rojo observado |
|---|---|---|
| a | `fetch('https://desk.zoho.com/api/v1/tickets')` al final de `measure.ts` | 1 roja (barrido real › ninguna señal fuera de su lista): `"transporte en apps/desk/server/measure.ts:83"`, `dominio-desk` y `base-api` en la misma línea; el mensaje trae «ficheros recorridos: 273» |
| b | quitar de `PERMITIDOS` (`:73`) `books/booksClient.ts` en `transporte` | 1 roja (ninguna señal fuera de su lista): señal `transporte` en `packages/zoho-sync/src/books/booksClient.ts:32` y `:45` |
| c | `'cliente-http': []` (`:82`) → `['apps/desk/server/measure.ts']` | 1 roja (la lista no contiene un sitio sin señal): `cliente-http sin uso en apps/desk/server/measure.ts` |
| d | `sinComentarios` sin quitar los `//` (`:210`, `if (false && …)`) | 8 rojas, las de `sinComentarios` y las formas en comentario (p. ej. «quita el comentario de línea»: `const a = 1 // fetch(x)` sigue ahí) |
| e | señal de transporte sin `fetchImpl` (`:40`, `(?:fetch)`) | 3 rojas: «cada forma fuera de la lista» (la forma `fetchImpl(url)`), «la línea del hallazgo es la del código» y, en el real, «la lista cerrada no contiene un sitio sin señal real» (los sitios que sólo llamaban por `fetchImpl(` quedan en `sinUso`); la de hallazgos del real sigue verde |

### Regla 13 y medida
`git diff --name-only` sin nada bajo `apps/desk/src`; ningún fichero de producción modificado (sólo `measure.ts`, restaurado). Código nuevo sin `method:` literal ni `{ method,`. 
Medida: `git diff --shortstat --no-renames HEAD` 67 inserciones y 5 borrados (72, `apply-progress.md` y `tasks.md`) + `wc -l` de lo nuevo sin trackear 565 (243 la prueba, 322 el arnés) = 637 (estimado ~560; techo de parada 720).

### Contraste del orquestador y cierre (L6.6)
Informe contrastado: sólo dos ficheros nuevos (`wc -l` 243 + 322) y ningún fichero de producción tocado; las 14 señales de `apps/desk/server/testing/barridoZohoDesk.ts:39-61` son las de la tabla de D-8 (la fila «instancias» partida en dos, sin cambiar sitios) y `PERMITIDOS` coincide con el grep del orquestador al contrastar el diseño. Los 273 ficheros recorridos cuadran con los 270 medidos entonces más los tres de producción nuevos de L1 a L3. Fichero vigilado reproducido por el orquestador con una forma distinta a la del lote: un fichero nuevo `apps/hub-sync/src/llamadaOlvidada.ts` con un `GET` implícito a `https://desk.zoho.com/api/v1/tickets/count` pone rojo el barrido real y lo nombra en su línea 2 (transporte, dominio y base); borrado, verde. Sin barrido B.1: el lote no edita ningún fichero existente.

## Lote L7 — `DEPLOY.md` §24 (intento i9)

### Safety net
`npx vitest run apps/desk/server/deploy`: 6 ficheros, 37 pruebas verdes, antes de tocar nada. `DEPLOY.md` CRLF, 1028 líneas, 1028 con `\r`, sha256 `94a821d3…`.

### Rojo (L7.1, L7.2)
`apps/desk/server/deployModoSinZoho.test.ts` (nuevo, 73 líneas, CRLF; `faltasSeccion24` exportada). Contra el `DEPLOY.md` de hoy, sin §24: `npx vitest run apps/desk/server/deployModoSinZoho.test.ts` salió 1 con 4 rojas y 1 verde (la de `config.ts`): `expected -1 to be greater than 75435` (el real), y las tres de copias devolvían `['la sección `## 24. `']` en vez de lo que cada una debía nombrar.

### Verde de la prueba nueva y rojo de la guarda de la §23 (L7.3)
Con la §24 escrita (38 líneas, tras `:1028`, 0 borrados, 38 `\r` añadidos: 1066 líneas y 1066 con `\r`), la prueba nueva pasó 5/5. Antes de tocar la guarda, medido: `npx vitest run apps/desk/server/deployModoSinZoho.test.ts apps/desk/server/deployVerificacionCompletitud.test.ts` → 1 roja, `deployVerificacionCompletitud.test.ts:36` (`expected [ '## 23.', '## 24.' ] to have a length of 1 but got 2`); `:37` (tres `###` en vez de dos) quedaba detrás de `:36` en la misma prueba y se habría puesto roja igual.

### Guarda en sitio (L7.4)
`deployVerificacionCompletitud.test.ts` 4 inserciones y 4 borrados, 4/4: `:20` acota `seccion` hasta `## 24. ` en la misma línea (molde `deployRellenoAdjuntos.test.ts:22`), `:36` añade `expect(deploy.indexOf('## 24. ')).toBeGreaterThan(s23)`, `:10` y `:33` dejan de decir «es la última». `:37` intacta. CRLF conservado.

### Verde (L7.5)
Focal (`deployModoSinZoho`, `deployVerificacionCompletitud`, `deployRellenoAdjuntos`): 3 ficheros, 19 pruebas, salida 0. `npx vitest run apps/desk/server/deploy`: 7 ficheros, 42 pruebas, salida 0. `npm run typecheck` salida 0. `npm run lint -- --max-warnings 165`: 165 avisos, 0 errores, salida 0.

### Mutación (L7.6)
Copia previa `…/scratchpad/DEPLOY.md.bak.s24` (sha256 `de21ffc0…`).
| # | Mutación | Rojo observado |
|---|---|---|
| a | `perl -i -ne 'print unless $. == 1044' DEPLOY.md` (la línea de la §24 con `ambientalia-desk` y el worker `hub-sync`) | 3 rojas en `deployModoSinZoho.test.ts`; la del real: `expected [ 'worker `hub-sync`' ] to deeply equal []` |
Restaurado con `cp`: sha256 `de21ffc0…` igual al de antes, `file` con CRLF, `git diff --numstat DEPLOY.md` 38/0, prueba 5/5 verde.

### Regla 13 y medida
`git diff --name-only` sin nada bajo `apps/desk/src`. Citas de la §24 comprobadas con `sed -n`: `DEPLOY.md:31` y `:333` (worker, pestaña Environment), `packages/zoho-sync/src/config.ts:125`, `docs/sdd/Plan_Independencia_Zoho_Desk_31-12-2026.md:100`.

### Contraste del orquestador y cierre (L7.7)
Informe contrastado: `DEPLOY.md` 38/0 (1028 → 1066, CRLF), guarda 4/4 (cada línea sólo cambia lo dicho), prueba nueva 73. La §24 leída entera contra el código y los documentos: el paso 4 del plan es literal (`docs/sdd/Plan_Independencia_Zoho_Desk_31-12-2026.md:100`, «por si acaso» incluido), `DEPLOY.md:31` y `:333` nombran el worker y `zoho-hub-sync`, `packages/zoho-sync/src/config.ts:125` lee `=== 'true'`, las rutas que responden `503` son las de L3 y L4, la línea del log del worker es la de `packages/zoho-sync/src/modoSinZoho.ts:120`, y las §21 a §23 usan, en efecto, el valor vacío; sin mención a reuniones. Mutación reproducida por el orquestador, distinta de la del lote: la línea de entorno `> MODO_SIN_ZOHO_DESK=false` vaciada en `DEPLOY.md:1052` pone rojas 4 de las 5 pruebas de la §24; sha256 restaurado `de21ffc04f8deaf4`, CRLF. Barrido B.1: `DEPLOY.md` sólo crece por el final (ninguna línea citada se mueve) y no hay citas vivas a las líneas editadas de `deployVerificacionCompletitud.test.ts`.
