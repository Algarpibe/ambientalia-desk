# Informe de verificación — `modo-sin-zoho` (1G-04, `cierra: si`)

**Veredicto: PASS con avisos.** 0 CRITICAL, 4 WARNING, 5 SUGGESTION.
**Revisión verificada:** `ebcb8850` (partida de la tanda `e3360dc4`). **Fecha:** 2026-11-08. **Intento:** i10 (verify).
**Escenarios:** 36 de 36 CUMPLE (RQ-ZS-40 a RQ-ZS-47), cuatro con nota. **CA-1 a CA-13:** 12 CUMPLE y 1 PARCIAL (CA-13, por las cinco
comprobaciones de cierre, que son del orquestador y no se corrieron aquí). **Mutaciones:** 16 filas reproducidas (a a o, más e2), todas con rojo y
restauradas con el `sha256sum` de antes. **Focal corrida aquí:** 16 ficheros, 213 pruebas verdes (las de la tanda más `zohoClient.test.ts`,
`config.test.ts`, `superficieSaliente.test.ts`, `deployVerificacionCompletitud.test.ts` y `hubSync*.test.ts`). `npm test` entero, typecheck, lint,
detector y build: del orquestador. Método: se leyó el código de producción de cada punto de D-1 a D-9 y se enfrentó a la prueba que lo fija; las
mutaciones están reproducidas, no copiadas del `apply-progress.md`.

## 1 · Escenarios de la delta, uno a uno

`P` = `packages/zoho-sync/src`; `S` = `apps/desk/server`; `H` = `apps/hub-sync/src`.

### RQ-ZS-40 · el interruptor
| Escenario | Prueba que lo fija | Veredicto y razón |
|---|---|---|
| sólo el literal `true` abre | `P/config.test.ts:207` (cinco valores, `:208-213`) | CUMPLE. `false` con ausente, vacío, `TRUE`, `1` y `false`; `true` sólo con `'true'`. La lectura es `P/config.ts:125` |
| App y worker leen el mismo valor | `P/config.test.ts:207`; `H/hubSyncModoSinZoho.test.ts:122` y `:126`; `S/barridoZohoDesk.test.ts:225` | CUMPLE (indirecta). Los dos llaman a `loadConfig()` (`S/index.ts:17`, `H/hub-sync.ts:17`) y la señal `lectura-modo` del barrido sólo admite `P/config.ts`. Ninguna prueba carga a la vez los dos arranques: es propiedad por construcción (aviso W-2) |
| abierto, prevalece sobre RQ-ZS-31 (adjunto) | `S/modoSinZohoAperturas.test.ts:141` | CUMPLE. Sin copia, 503 con el texto de D-6, `zohoFetch` sin llamadas, línea de log sin nombre |

### RQ-ZS-41 · el corte en la puerta
| Escenario | Prueba | Veredicto y razón |
|---|---|---|
| abierto, no sale transporte ni token | `P/zohoClientModoSinZoho.test.ts:41` | CUMPLE. Tres verbos y rutas; `fetchMock` y `getAccessToken` con cero llamadas |
| tampoco hay reintento tras `401` | `P/zohoClientModoSinZoho.test.ts:51` | CUMPLE. El transporte «respondería 401»; cero llamadas y ningún `getAccessToken(true)` |
| el error se distingue y no filtra datos | `P/zohoClientModoSinZoho.test.ts:60` | CUMPLE. `ErrorModoSinZohoDesk`, no `TypeError` ni `Response`; mensaje igual al fijo y sin marcas de ruta, id ni query |
| cerrado, la puerta es la de hoy | `P/zohoClientModoSinZoho.test.ts:102` (cinco valores) y `:122` (401 reintenta); `P/zohoClient.test.ts` sin tocar | CUMPLE. `git diff e3360dc4 HEAD --stat` no lista `zohoClient.test.ts`, y pasa |
| el corte va antes del token (posición) | mutación (b) de la tabla 4 | CUMPLE. Con el corte tras `getAccessToken`, tres rojas |

### RQ-ZS-42 · el registro
| Escenario | Prueba | Veredicto y razón |
|---|---|---|
| dos cortes suman y conservan primera y última | `P/modoSinZoho.test.ts:183` | CUMPLE. Reloj inyectado en `t1` y `t2`: UN origen, `cuenta: 2` |
| un corte que el llamador se traga suma | `P/modoSinZoho.test.ts:209` | CUMPLE. La cuenta va antes del `throw` (`P/modoSinZoho.ts:109-122`); usa un capturador genérico, no el `persistTicket` real (S-3) |
| un llamador sin etiqueta aparece | `P/modoSinZoho.test.ts:224`; `P/zohoClientModoSinZoho.test.ts:73` | CUMPLE. La pila REAL da `fichero · función`; el recurso sale reducido |
| la cuenta se hace antes de lanzar | `P/modoSinZoho.test.ts:175`; mutación (c) | CUMPLE. Con la cuenta tras el `throw`, 11 rojas |
| ningún origen ni ruta lleva datos | `P/modoSinZoho.test.ts:282`; `S/modoSinZohoRutas.test.ts:262` | CUMPLE. Marcadores en id, query, cuerpo y verbo no aparecen en `JSON.stringify(leer())`, ni en el error ni en los avisos |
| los saltos de fondo no cuentan; rechazos aparte | `S/modoSinZohoRutas.test.ts:262` y `:271`; `S/cicloPeriodico.test.ts:28` | CUMPLE (nota). Un 503 de guarda deja `cortes` VACÍO y `rechazos` con el patrón de ruta; el ciclo abierto no invoca nada de Desk. Ninguna prueba junta las dos cosas; el escenario se cubre con dos |
| el worker deja una línea por origen nuevo | `P/modoSinZoho.test.ts:298` (tres cortes de un origen y uno de otro: dos líneas); `H/hubSyncModoSinZoho.test.ts:130` | CUMPLE (nota). La línea se emite a nivel de registro; el cableado del worker (`H/hub-sync.ts:20`) se vigila por texto, no se ejecuta |

### RQ-ZS-43 · el `GET`
| Escenario | Prueba | Veredicto y razón |
|---|---|---|
| sin sesión y sin rol | `S/modoSinZohoRutas.test.ts:305` | CUMPLE. `401` y `403` |
| cerrado, informa que no está activo | `S/modoSinZohoRutas.test.ts:311` | CUMPLE. `200` con `{ activo: false, cortes: [], rechazos: [] }` |
| abierto, devuelve lo registrado | `S/modoSinZohoRutas.test.ts:316` | CUMPLE. Origen con `cuenta: 2`, rechazo de `GET /api/admin/measure-attachments` y `zohoFetch` sin llamadas; la consulta no se suma a sí misma (`S/routes/modoSinZohoDesk.ts:52`, sin guarda) |

### RQ-ZS-44 · la App
| Escenario | Prueba | Veredicto y razón |
|---|---|---|
| el ciclo corre las seis y salta Desk | `S/cicloPeriodico.test.ts:28` y `:34`; `S/modoSinZohoIndice.test.ts:27` | CUMPLE. Orden real por espías; abierto no corre `ritmoYSincronizacion` ni `syncActivities`/`syncContacts`; el `setInterval` no queda dentro de un `if` (`S/index.ts:85`) |
| quitar una evaluación o adelantar el salto lo detecta | mutaciones (j), (k) y (l) | CUMPLE. Rojas en `cicloPeriodico.test.ts` y en `modoSinZohoIndice.test.ts:18` |
| cerrado, el ciclo es el de hoy | `S/cicloPeriodico.test.ts:42`, `:48`, `:54`, `:60` | CUMPLE. Cinco, `ritmoYSincronizacion`, actividades y contactos según flags |
| el arranque no sincroniza Desk pero migra | `S/modoSinZohoIndice.test.ts:35` y `:41` | CUMPLE (nota, W-1). Fichero vigilado: `index.ts` no se puede importar (arranca `main()`), así que se lee el texto de `:61`, `:72`, `:78` y de las líneas de migración y resiembra. No se ejecuta el arranque |
| las aperturas sirven lo local | `S/modoSinZohoAperturas.test.ts:30` (con datos) y `:46` (sin datos, `404`); cerrado `:56` | CUMPLE. Espía de `sync` sin llamadas en detalle, conversaciones e historia |
| las rutas que dependen de Zoho dan `503` | `S/modoSinZohoRutas.test.ts:212` (tres), `:190` (relleno-adjuntos), `:130` y `:169` (verificación y relleno-conversaciones), `:250` (backfill-history); `S/modoSinZohoAperturas.test.ts:91` (respuesta) | CUMPLE. Cada una: `503`, `motivo: 'modo-sin-zoho-desk'`, mensaje D-6 y `zohoFetch` sin llamadas |
| los recuentos sin Zoho siguen libres | `S/modoSinZohoRutas.test.ts:143`, `:178`, `:199`, `:236` | CUMPLE. `limite=0` da su recuento; la tabla `'0'`, `'00'`, `''` frente a `'abc'` fija que `esConteoHistoria` es la misma noción que el manejador (`S/routes/admin.ts:199`) |
| la posición del `503` está probada | `S/modoSinZohoRutas.test.ts:123`, `:130`, `:138`, `:150`; mutaciones (e), (e2), (f) | CUMPLE. Con la guarda antes de la sesión, tras el interruptor propio o antes de `guardWrites`, rojas |
| adjunto con copia se sirve, sin ella responde claro | `S/modoSinZohoAperturas.test.ts:129` y `:141` | CUMPLE. Con copia, igual que hoy; sin ella, `503`, una línea `logger.warn` sin el `name` ni el `path` de Zoho y cero llamadas |
| el error tipado que escapa da `503` | `S/modoSinZohoRutas.test.ts:282` y `:292`; `S/modoSinZohoAperturas.test.ts:163` (H-2) | CUMPLE. Mutación (o): sin el prefijo de `S/app.ts:79`, 2 rojas |

### RQ-ZS-45 · el worker
| Escenario | Prueba | Veredicto y razón |
|---|---|---|
| abierto, no programa Desk | `H/hubSyncModoSinZoho.test.ts:53` (arranque) y `:85` (temporizadores) | CUMPLE. Con `useFakeTimers` avanzan 3000 ms: `syncRecent`, `syncPendingHistory`, `syncActivities` y `syncContacts` con cero llamadas |
| Books y CRM siguen como hoy | `H/hubSyncModoSinZoho.test.ts:85` y `:53` | CUMPLE. `booksRecent` y `crmRecent` 3 veces en 3 periodos; en el arranque corren sus backfills. `booksClient.ts` y `crmClient.ts` no importan `zohoClient` ni `modoSinZoho` (grep vacío) |
| cerrado, las tres pasadas | `H/hubSyncModoSinZoho.test.ts:101` (cerrado y sin el campo) | CUMPLE |

### RQ-ZS-46 · el barrido
| Escenario | Prueba | Veredicto y razón |
|---|---|---|
| una llamada a Desk fuera de la puerta, en rojo | `S/barridoZohoDesk.test.ts:110`; mutación (i) | CUMPLE. Una forma por señal en un árbol sintético, cada una nombrada por fichero; sobre el árbol real, un fichero ensuciado puso rojo y se nombró |
| la misma señal en un comentario no cuenta | `S/barridoZohoDesk.test.ts:118` | CUMPLE. Las formas en `//` y `/* */` dan `[]` |
| sobre el repositorio real, verde y sin sitio sin señal | `S/barridoZohoDesk.test.ts:225` y `:230` | CUMPLE. 273 ficheros (274 con mi fichero sucio), `hallazgos` y `sinUso` vacíos |

### RQ-ZS-47 · `DEPLOY.md` §24
| Escenario | Prueba | Veredicto y razón |
|---|---|---|
| la sección existe y cubre lo obligatorio | `S/deployModoSinZoho.test.ts:49` | CUMPLE. `DEPLOY.md:1029` abre `## 24.` y lleva «Qué enciende», «Qué se rompe si se pone mal», los DOS servicios, el `GET` y el log del worker |
| quitar una parte pone la prueba en rojo | `S/deployModoSinZoho.test.ts:54`, `:60`, `:65` | CUMPLE. Copias en memoria sin el worker o sin «Qué se rompe»: la prueba lo nombra |

## 2 · Criterios de aceptación (proposal §6)
| CA | Veredicto | Razón y prueba |
|---|---|---|
| CA-1 | CUMPLE | RQ-ZS-41 arriba; `zohoClient.test.ts` intacto y verde |
| CA-2 | CUMPLE | `P/zohoClientModoSinZoho.test.ts:60`; mensaje fijo `P/modoSinZoho.ts:11` |
| CA-3 | CUMPLE | `P/modoSinZoho.test.ts:183`, `:209`, `:224`, `:282`; `S/modoSinZohoRutas.test.ts:262` |
| CA-4 | CUMPLE | `S/modoSinZohoRutas.test.ts:305`, `:311`, `:316`; `leer()` no lanza (`P/modoSinZoho.ts:135-144`) |
| CA-5 | CUMPLE | `S/cicloPeriodico.test.ts:28`, `:42`; mutaciones (j) y (k) |
| CA-6 | CUMPLE (nota) | App por texto (`S/modoSinZohoIndice.test.ts:35`); worker ejecutado (`H/hubSyncModoSinZoho.test.ts:53`) |
| CA-7 | CUMPLE | `H/hubSyncModoSinZoho.test.ts:85`; línea por origen nuevo a nivel de registro (`P/modoSinZoho.test.ts:298`) |
| CA-8 | CUMPLE | `S/modoSinZohoAperturas.test.ts:30`, `:46` |
| CA-9 | CUMPLE | `S/modoSinZohoRutas.test.ts:212`, `:143`, `:123`; `S/modoSinZohoAperturas.test.ts:91` |
| CA-10 | CUMPLE | `S/modoSinZohoAperturas.test.ts:129`, `:141` |
| CA-11 | CUMPLE | `S/modoSinZohoRutas.test.ts:282`; `S/modoSinZohoAperturas.test.ts:163` |
| CA-12 | CUMPLE | `S/barridoZohoDesk.test.ts:110`, `:118`, `:225` |
| CA-13 | PARCIAL | §24 y su prueba y guardas en sitio (`S/deployVerificacionCompletitud.test.ts` 4/4, `S/reconciliacion/registro.test.ts` 2/2) verdes aquí. Typecheck, lint, detector, `npm test` y build: del orquestador, no corridos |

## 3 · Código contra diseño (D-1 a D-9)
| Punto | Comprobado | Resultado |
|---|---|---|
| D-1 corte antes del token | `P/zohoClient.ts:29` es la primera instrucción de `zohoFetch`; `getAccessToken` en `:30` y el reintento en `:33` quedan detrás. Campo en `P/config.ts:66` y `:125` | Conforme. Un config sin `modoSinZohoDesk` (como el de `zohoClient.test.ts`) deja la puerta de hoy |
| D-1 cuenta antes del `throw` | `P/modoSinZoho.ts:109-122`: cuenta en `:114-121`, `throw` en `:122` | Conforme (mutación c) |
| D-1 mensaje fijo | `P/modoSinZoho.ts:11` y `:18`; marca en `:15`; `esCorteModoSinZoho` en `:23-26` | Conforme |
| D-2 origen sin datos | `recursoDeRuta` (`P/modoSinZoho.ts:36-41`: verbo por acceso, sin query, `{x}`); `llamadorDeLaPila` (`:55-71`: ruta desde `apps/`, `packages/` o `scripts/`, `desconocido`, `dependencia`) | Conforme. Los 14 segmentos de `:29-32` son los de D-2 |
| D-3 registro y aviso | dos mapas (`:97-98`), `avisar` dentro de `try` (`:100-106`), una línea por origen nuevo (`:120`) y por ruta (`:132`); la App avisa con `logger.warn` (`S/index.ts:20`), el worker con `console.warn` (`H/hub-sync.ts:20`) | Conforme |
| D-4 ciclo y arranque | `S/cicloPeriodico.ts:28-40`; `S/index.ts:88` sólo llama a `cadenaDelCiclo`; `:61`, `:72`, `:78` con `!config.modoSinZohoDesk`; `:85` intacto; migración y resiembra sin salto | Conforme. `:89` y `:90` son comentarios |
| D-5 guardas | `S/routes/modoSinZohoDesk.ts:37-42`; cadenas en `S/routes/admin.ts:43`, `:53`, `:196`, `:207`; `S/routes/rellenoConversaciones.ts:36`; `S/routes/rellenoAdjuntos.ts:43`; `S/routes/verificacionCompletitud.ts:37`; `S/routes/tickets.ts:196` | Conforme: sesión, rol, modo, interruptor propio, validación. La respuesta respeta la excepción (`guardWrites`, `requireArea`, modo) |
| D-5 aperturas | `S/routes/tickets.ts:132` y `:136` (prefijo), `:149` y `:169` (`servirLocal`, `:226-229`) | Conforme. `servirLocal` usa `getTicketWithRefs`, la misma noción de «sin datos» que el detalle |
| D-5 adjunto | `S/routes/attachment.ts:22` (tras la copia local) y `:39-42` (`adjuntoSinCopiaEnModo`: `logger.warn` con `adjunto`, `ticket`, `motivo`; sin nombre ni `path`) | Conforme |
| D-5 manejador central | `S/app.ts:79` (prefijo `esCorteModoSinZoho`); `modo` creado en `:50`, `GET` registrado en `:57` | Conforme |
| D-6 textos y cuerpo | `S/routes/modoSinZohoDesk.ts:12-13` y `:30` (`{ error, motivo }`) | Conforme |
| D-7 worker | `H/hubSync.ts:15`, `:21`, `:22`, `:90`; `H/hub-sync.ts:48-49` pasan `config.modoSinZohoDesk`; Books y CRM (`H/hubSync.ts:101-115`) intactos | Conforme |
| D-8 barrido | `S/testing/barridoZohoDesk.ts`: 14 señales (`:39-61`) y lista `PERMITIDOS`; no depende de `superficieSaliente.ts` | Conforme. Diferencia de forma ya declarada: la fila «instancias» de D-8 se parte en dos señales |
| D-9 §24 | `DEPLOY.md:1029-1066`, última sección tras la §23 | Conforme |
| D-10 guardas del árbol | `S/deployVerificacionCompletitud.test.ts` 4/4; `S/reconciliacion/registro.test.ts` 2/2 | Conforme. Desviación aceptada: `attachment.ts:1` también se edita (añade tipos) |
| D-11 regla 13 | `git diff --name-only e3360dc4 HEAD` sin nada bajo `apps/desk/src` (§6) | Conforme |

Desviaciones respecto del diseño: ninguna con efecto; dos de forma, ya declaradas en `apply-progress.md`.

## 4 · Mutaciones reproducidas (V.2)
Método: `sha256sum` antes, `perl -i -pe '… if $. == N'` (nunca `sed -i`), prueba focal, restauración con la sustitución inversa, `sha256sum` y `file`
después. Los `sha256` volvieron al de antes en todas y los ficheros conservan «CRLF line terminators». La (i) crea y borra un fichero.
| # | Mutación | Línea | Prueba focal | Rojo observado | Restaurado (`sha256`) |
|---|---|---|---|---|---|
| a | quitar el corte | `P/zohoClient.ts:29` | `zohoClientModoSinZoho` + `zohoClient` | 5 rojas de 14 (las cinco de «abierto») | sí, `a9ff91203d137c41` |
| b | corte tras `getAccessToken` | `P/zohoClient.ts:29-30` | ídem | 3 rojas: `:41`, `:51` y la del registro por omisión | sí, `a9ff91203d137c41` |
| c | contar tras el `throw` | `P/modoSinZoho.ts:109` | `modoSinZoho` + `zohoClientModoSinZoho` | 11 rojas de 53 (cortar CUENTA, dos cortes, tragado, sin etiqueta, ordenado, reloj, copia, marcadores, `avisar` x2, registro inyectado) | sí, `7e3f76d4aace68a2` |
| d | `!== 'false'` sólo en `modoSinZohoDesk` | `P/config.ts:125` | `config` + `zohoClientModoSinZoho` + `deployModoSinZoho` | 7 rojas: `config.test.ts:207`; cerrado `TRUE`, `1`, vacío, ausente y con 401 (5); `deployModoSinZoho.test.ts:70` | sí, `dcc28c31e9b56c1c` |
| e | guarda antes de `requireAuth(db)` | `S/routes/verificacionCompletitud.ts:37` | `modoSinZohoRutas` + `verificacionRutas` | 1 roja: `modoSinZohoRutas.test.ts:123` | sí, `55c9a03243ac7e42` |
| e2 | guarda tras `interruptorVerificacion` | `S/routes/verificacionCompletitud.ts:37` | `modoSinZohoRutas` | 1 roja: `modoSinZohoRutas.test.ts:130` (da 403 y no 503) | sí, `55c9a03243ac7e42` |
| f | guarda antes de `guardWrites` | `S/routes/tickets.ts:196` | `modoSinZohoAperturas` | 2 rojas: `:73` y `:82` | sí, `657d37d6b972eda4` |
| g | quitar `if (!modo.activo) ` | `S/routes/tickets.ts:132` | `modoSinZohoAperturas` | 1 roja: `:46` (`sync` llamado sin datos locales) | sí, `657d37d6b972eda4` |
| h | quitar `if (!modoSinZohoDesk) ` | `H/hubSync.ts:90` | `apps/hub-sync/src` | 1 roja de 26: `hubSyncModoSinZoho.test.ts:85` | sí, `66fd1bf72a03529f` |
| i | fichero vigilado: fichero nuevo con `fetchImpl(url)` y `desk.zoho.com` bajo `packages/zoho-sync/src/` | `llamadaOlvidadaVerify.ts` (creado y borrado) | `barridoZohoDesk` | 1 roja (`:225`): `transporte`, `dominio-desk` y `base-api` en `packages/zoho-sync/src/llamadaOlvidadaVerify.ts:2`; «ficheros recorridos: 274». Borrado: 23 verdes | fichero borrado, sin rastro |
| j | quitar una evaluación (`salidasEsperas`) | `S/cicloPeriodico.ts:32` | `cicloPeriodico` | 6 rojas de 7 | sí, `adf99feabb441403` |
| k | salto de Desk adelantado (sale antes de las evaluaciones) | `S/cicloPeriodico.ts:29` | `cicloPeriodico` | 2 rojas (`:28` y `:34`) | sí, `adf99feabb441403` |
| l | quitar `salidasEsperas` del literal | `S/index.ts:88` | `modoSinZohoIndice` + `services` | 1 roja de 500: `modoSinZohoIndice.test.ts:18` | sí, `d3d58c5ea78b1c01` |
| m | quitar el salto del backfill inicial | `S/index.ts:61` | `modoSinZohoIndice` | 1 roja: `:35` | sí, `d3d58c5ea78b1c01` |
| n | quitar el añadido del adjunto | `S/routes/attachment.ts:22` | `modoSinZohoAperturas` | 1 roja: `:141` | sí, `5e448f3a71a9e655` |
| o | quitar el prefijo del manejador central | `S/app.ts:79` | `modoSinZohoRutas` | 2 rojas (`:282` y `:292`) | sí, `5f21d6866b023330` |

Al acabar, `git status --porcelain` no enseñó nada salvo este informe. Nota de método: un intento de ejecutar `tsx` para medir los marcos de pila
reales (H-1) se colgó pasados 120 s; se mató, se borró su fichero temporal y no se repitió (aviso W-3).

## 5 · Inventario de llamadas a Zoho Desk con el modo abierto
Búsqueda: `grep -rnE "zohoFetch"` sobre `apps`, `packages` y `scripts`, sin `*.test.ts` ni `testing/`, más las llamadas a `sync.*` desde rutas y
temporizadores. `scripts/` no contiene ninguna. Las dos únicas instancias de `createZohoClient` son `S/index.ts:20` y `H/hub-sync.ts:20`.
| Llamada | Quién la dispara | Con el modo abierto |
|---|---|---|
| `P/sync.ts:140`, `:162` (tickets, archivados) | arranque App (`S/index.ts:61`) y worker (`H/hubSync.ts:15`) | no se llega a llamar (arranque saltado) |
| `P/sync.ts:162` | `POST /api/admin/backfill-archived` (`S/routes/admin.ts:207`) | 503 de la guarda |
| `P/sync.ts:174`, `:396`, `:415` (reciente, búsqueda, detalle) | temporizador App (`S/index.ts:88`) y worker (`H/hubSync.ts:93`) | no se llega a llamar: `S/cicloPeriodico.ts:34` elige `ritmoContratos`; el `setInterval` de Desk del worker no se programa (`H/hubSync.ts:90`) |
| `P/sync.ts:179` (detalle) | aperturas (`S/routes/tickets.ts:132`, `:136`) | no se llega a llamar (apertura saltada) |
| `P/sync.ts:179` | `S/rellenoConversaciones.ts:100`; `S/backfill.ts:46` | 503 de la guarda (`S/routes/rellenoConversaciones.ts:36`; `S/routes/admin.ts:53`) |
| `P/sync.ts:90`, `:100` (cuenta y contacto por id) | dentro de `persistTicket` y `syncContacts` | no se llega a llamar; si se alcanzara, cortada y registrada (el llamador la traga, `P/sync.ts:92` y `:107`, con la cuenta ya hecha) |
| `P/conversaciones.ts:77` | aperturas (`S/routes/tickets.ts:157`, `:162`) | no se llega a llamar (`:149` sirve lo local) |
| `P/conversaciones.ts:77` | tras responder (`S/routes/tickets.ts:217`); `S/backfill.ts:47` | no se llega a llamar (la respuesta da 503 en `:196`); `backfill.ts`: 503 de la guarda |
| `P/conversaciones.ts:77` | pasada periódica (dentro de `syncRecent`) | no se llega a llamar (temporizador saltado) |
| `P/sync.ts:76` (historia) | aperturas (`S/routes/tickets.ts:177`, `:182`) | no se llega a llamar (`:169`) |
| `P/sync.ts:76` | `POST /api/admin/backfill-history` (`S/routes/admin.ts:196`) | 503 de la guarda; con `limite=0` pasa y no llama (`S/routes/admin.ts:199`, tanda vacía) |
| `P/sync.ts:76` | historia pendiente del worker (`H/hubSync.ts:96`) | no se llega a llamar (temporizador no programado) |
| `P/sync.ts:250`, `:272` (actividades, contactos) | arranque (`S/index.ts:72`, `:78`; `H/hubSync.ts:21`, `:22`) y temporizadores (`S/cicloPeriodico.ts:35-38`; `H/hubSync.ts:97`) | no se llega a llamar |
| `S/routes/tickets.ts:199`, `:203` (`mailReplyAddress`, `sendReply`) | `POST /api/tickets/:id/reply` | 503 de la guarda (`S/routes/tickets.ts:196`) |
| `S/routes/attachment.ts:24` | `GET /api/attachment` sin copia válida | 503 propio (`S/routes/attachment.ts:22`, `:39-42`); si escapara el error, 503 del manejador central (`S/app.ts:79`) |
| `S/adjuntos/almacen.ts:81` | relleno de adjuntos (`S/adjuntos/rellenoAdjuntos.ts:91`) | 503 de la guarda (`S/routes/rellenoAdjuntos.ts:43`); libre sólo con `limite=0` (recuento, sin Zoho) |
| `S/adjuntos/almacen.ts:81` | guardado tras sincronizar (`S/adjuntos/guardadoAlSincronizar.ts:56`) | no se llega a llamar (sólo tras una sincronización saltada); si se alcanzara, cortada y registrada (`S/adjuntos/almacen.ts:85-86` la traga como `red`) |
| `S/measure.ts:38`, `:45`, `:46` | `GET /api/admin/measure-attachments` | 503 de la guarda (`S/routes/admin.ts:43`) |
| `S/backfill.ts:39` | `GET /api/admin/backfill-details` | 503 de la guarda (`S/routes/admin.ts:53`) |
| `S/rellenoConversaciones.ts:67` | `POST /api/admin/relleno-conversaciones` | 503 de la guarda (`S/routes/rellenoConversaciones.ts:36`); `limite=0` libre |
| `S/completitud/soloLectura.ts:37` | `POST /api/admin/verificacion-completitud` | 503 de la guarda (`S/routes/verificacionCompletitud.ts:37`); `limite=0` libre |

Ninguna llamada queda sin destino. Cualquier llamada nueva a `zohoFetch` queda «cortada y registrada» por la puerta (`P/zohoClient.ts:29`) sin tocar el
interruptor. Fuera de Zoho Desk y sin cortar, por diseño (S-b, S-c): Books (`booksClient.ts`), CRM (`crmClient.ts`), n8n, Drive y almacenamiento de
objetos; el barrido los lista a propósito en la señal `transporte`.

## 6 · Regla invariable 13
`git diff --name-only e3360dc4 HEAD` no contiene nada bajo `apps/desk/src`, ni `CLAUDE.md`, `openspec/config.yaml`, `docs/sdd/ENTRADA.md`, los `F0-05_*`,
`docs/sdd/R08.4_Expediente_de_cambios.md` ni `.env*` (grep vacío). Decisiones que la app toma por el modo y la línea del SERVIDOR que cada una impone:
| Decisión | Línea del servidor | ¿Decide el cliente? |
|---|---|---|
| no sale ninguna petición a Zoho Desk | `P/zohoClient.ts:29` | no |
| el temporizador salta Desk y conserva las seis | `S/cicloPeriodico.ts:34-38` | no |
| el arranque no sincroniza Desk | `S/index.ts:61`, `:72`, `:78`; `H/hubSync.ts:15`, `:21`, `:22` | no |
| el worker no programa la pasada de Desk | `H/hubSync.ts:90` | no |
| las aperturas sirven lo local, `404` sin datos | `S/routes/tickets.ts:132`, `:136`, `:149`, `:169`, `:226-229` | no |
| respuesta, medida, backfills, rellenos y verificación dan `503` | `S/routes/admin.ts:43`, `:53`, `:196`, `:207`; `S/routes/rellenoConversaciones.ts:36`; `S/routes/rellenoAdjuntos.ts:43`; `S/routes/verificacionCompletitud.ts:37`; `S/routes/tickets.ts:196` | no |
| el adjunto sin copia da `503` | `S/routes/attachment.ts:22` | no |
| el error tipado que escapa da `503` | `S/app.ts:79` | no |
| qué enseña el `GET` de estado | `S/routes/modoSinZohoDesk.ts:52` | no |

El cliente no conoce el modo (grep de `modoSinZoho` y `modo-sin-zoho` en `apps/desk/src` vacío) y ante un `503` enseña el cuerpo crudo, `HTTP 503: …`
(`apps/desk/src/api/client.ts:9`). Es el caso de la regla 13 sin espejo: no hay decisión en el navegador.

## 7 · Supuestos S-a a S-p
| Id | ¿Lo respeta el código? | Nota |
|---|---|---|
| S-a (sin staging) | sí | la tanda se prueba con automáticas; la semana es de persona (P-3) |
| S-b (Books y CRM fuera) | sí | `H/hubSyncModoSinZoho.test.ts:85`; el barrido los lista |
| S-c (n8n fuera) | sí | **hipótesis:** si los flujos de n8n llaman a Zoho Desk, el interruptor no lo corta; no verificable desde el repositorio |
| S-d (códigos y mensajes a criterio) | sí | `503` y los dos textos de `S/routes/modoSinZohoDesk.ts:12-13` |
| S-e (registro en memoria) | sí | sin tabla ni `ALTER`; la App deja además una línea de log por origen nuevo |
| S-f (nombre y ruta) | sí | `P/config.ts:125`; `S/routes/modoSinZohoDesk.ts:52` |
| S-g (credenciales siguen exigidas) | sí | `P/config.test.ts:216` |
| S-h (error tipado, mensaje fijo, cuenta antes) | sí | `P/modoSinZoho.ts:11`, `:109-122` |
| S-i (origen = recurso cerrado + llamador) | sí, con **hipótesis H-1** abierta | bajo `tsx` los marcos de pila podrían no llevar la ruta del `.ts`; el llamador saldría `desconocido`, que no filtra datos |
| S-j (saltos no cuentan, rechazos aparte) | sí | las aperturas sin datos (`404`) tampoco suman como rechazo (W-4) |
| S-k (`503` tras sesión y rol, antes del interruptor propio) | sí | mutaciones (e), (e2), (f) |
| S-l (adjunto sin copia: `503` y log sin nombre) | sí | `S/routes/attachment.ts:40`; prueba `S/modoSinZohoAperturas.test.ts:141` |
| S-m (sólo ADDED) | sí | la delta no tiene bloques MODIFIED ni REMOVED |
| S-n (cliente sin tocar) | sí | §6 |
| S-o (`cierra: si`) | sí, con la salvedad de la semana en producción (P-3, de persona) | |
| S-p (mismo temporizador, mismo orden) | sí | `S/cicloPeriodico.ts:29-34`, `S/index.ts:88` |

**Para la lista semanal de supuestos (Gerencia, una semana para corregir):** S-j (si las aperturas sin datos locales deben contarse como rechazo, para que
la semana del paso 4 las vea), S-k y S-l (código `503` y textos: es lo que verá el técnico, crudo con la forma `HTTP 503: {…}`), S-p (si basta probar que
las evaluaciones corren o se quiere una pasada propia) y S-n (aviso en pantalla). Ninguno cambia el alcance de la fila.

## 8 · Avisos y riesgos (ninguno bloquea; no se arregló nada)
**CRITICAL:** ninguno.

**WARNING**
- W-1 · **Escenarios cubiertos por construcción, no por ejecución.** El arranque de la App se vigila leyendo `index.ts` (`S/modoSinZohoIndice.test.ts:35`,
  `:41`) y el cableado del worker, leyendo `hub-sync.ts` (`H/hubSyncModoSinZoho.test.ts:122-130`). Es lo que D-4 y D-7 aceptaron, pero una refactorización que
  mantuviera el texto y cambiara el comportamiento no se vería. Las mutaciones (m) y las del lote L2 detectan el texto, no la ejecución.
- W-2 · **«App y worker leen el mismo valor» (RQ-ZS-40) no tiene prueba que ejecute los dos arranques.** Se sostiene en que los dos llaman a
  `loadConfig()` (`S/index.ts:17`, `H/hub-sync.ts:17`) y en que el barrido prohíbe otra lectura de la variable. Suficiente, pero indirecto.
- W-3 · **H-1 sin cerrar.** El llamador del origen sale de la pila (`P/modoSinZoho.ts:111`) y sólo se probó con pilas sintéticas y bajo vitest. Si bajo `tsx`
  en producción (`Dockerfile:29`) el marco no lleva la ruta, el registro mostrará `desconocido` en `llamador` y la semana del paso 4 perderá la pista de quién
  llamó (el `recurso` sí se vería). No filtra datos. Conviene mirar el primer `GET` de la semana.
- W-4 · **El 404 de las aperturas sin datos no deja rastro.** Quien abre un ticket que no está en PostgreSQL recibe `404` (`S/routes/tickets.ts:226-229`) y no suma
  como rechazo; la semana no enseñará «lo que alguien necesitó y no tuvo» en ese caso. Es lo que S-j escribe; se anota por si Gerencia quiere contarlos.

**SUGGESTION**
- S-1 · La respuesta no tiene prueba propia de «sin sesión» con el modo abierto; el `401` lo da `app.use('/api/tickets', requireAuth(db))` (`S/routes/tickets.ts:35`),
  anterior a toda la cadena, así que la posición queda cubierta por construcción.
- S-2 · `H/hub-sync.ts:20` crea el registro en la misma línea que el cliente; la prueba vigilada exige `registro:` y `avisar:` en esa línea, pero no que haya UNA
  sola instancia, como sí hace `S/modoSinZohoIndice.test.ts:48` para la App.
- S-3 · `P/modoSinZoho.test.ts:209` prueba el corte tragado con un capturador genérico; ninguna prueba ejercita el `persistTicket` real con el modo abierto (no es
  alcanzable, porque la sincronización está saltada). Coherente con el inventario.
- S-4 · La lista cerrada del barrido (`S/testing/barridoZohoDesk.ts`) permite por fichero: una llamada a Desk añadida dentro de un fichero ya permitido para otra
  señal (por ejemplo `booksClient.ts`) sólo la cazarían las señales de destino (dominio, base, token) y no la de transporte. Documentado en D-8.
- S-5 · No hay prueba de que el log del worker lleve la línea con el literal `modo sin Zoho Desk: primer corte de` fuera del registro (`P/modoSinZoho.ts:120`,
  fijada por `P/modoSinZoho.test.ts:298`); `DEPLOY.md:1060` la promete.

**Tareas de persona (fuera del recuento; archivar no las da por hechas):** P-1 (líneas de `.env.example`), P-2 (desplegar cerrado, variable en los DOS
servicios) y P-3 (la semana, con decisión de Gerencia). Para Supervisión: el pasaje del maestro sobre la pasada de ritmo de contratos y alarmas queda
desactualizado (`toca_maestro: si`) y `docs/sdd/ENTRADA.md:2059` deja de ser cierto con esta tanda.

## Nota del orquestador al cierre de verify (H-1 y W-3)
El intento de medir la H-1 de este verify dejó un shell colgado; el orquestador detuvo la tarea y comprobó que no quedaban procesos ni el fichero temporal `h1-verify-tmp.ts` en el árbol. Medida repetida fuera del árbol con `node_modules/.bin/tsx` (1,3 s): el marco bajo `tsx` es `at fetchTicket (<ruta absoluta del .ts>:2:41)`, con el nombre de la función y la ruta del fuente, el mismo formato que fijan las pilas sintéticas de `packages/zoho-sync/src/modoSinZoho.test.ts` (POSIX y Windows). La H-1 queda **confirmada en el formato**; sigue siendo **hipótesis** la ruta exacta del contenedor Linux de producción (`/app/…`, `Dockerfile:29`), que sin staging (S-a) sólo se verá la semana del paso 4. Si no lleva `apps/`, `packages/` o `scripts/`, sale `desconocido`, que no filtra datos.
