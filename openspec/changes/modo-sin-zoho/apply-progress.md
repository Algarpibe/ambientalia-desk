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
