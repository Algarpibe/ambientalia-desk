# Informe de verificación — `verificacion-completitud` (1G-03, `cierra: si`)

evidence_revision: sha256:fda39705c8f00a9749d5c9e10aec5751e98916d4b0428f9820d9ff63dd69401c

- Receta de `evidence_revision`: `printf '%s' "$(git rev-parse HEAD):$(git rev-parse HEAD^{tree})" | sha256sum`, sobre HEAD `4724f4faf2737e677a0a135aafc7e05d50975f88` y árbol `7c2d68db14f3bc339b0529f93fef369447d4b6cd`.
- Cambio: `verificacion-completitud`. Rama `verificacion-completitud`, partida de la tanda `03ab82c2`, lotes L1-L6 (`37aa6dff` a `4724f4fa`). Fecha: 2026-11-07. Intento 9 (verify).
- Modo: `strict_tdd` activo, verificación independiente. `apply-progress.md` se usó como mapa, nunca como prueba: la focal y las mutaciones se reprodujeron en este árbol con `perl -i -pe '… if $. == N'`, una a una, con `sha256sum` antes y después.
- Tareas: P.1-P.3 y L1.1-L6.9 marcadas y coherentes con el código (`git diff --numstat 03ab82c2`: 3/3 `apps/desk/server/app.ts`, 2/2 `packages/zoho-sync/src/config.ts`, 2/2 `apps/desk/server/testing/appHarness.ts`, 1/1 `packages/zoho-sync/src/db/history.ts`, 4/4 `apps/desk/server/deployRellenoAdjuntos.test.ts`, 2/2 `apps/desk/server/reconciliacion/registro.test.ts`, 10/0 `packages/zoho-sync/src/config.test.ts`, 41/0 `DEPLOY.md`; nada bajo `apps/desk/src` ni `.env*`). B.1 queda sin marcar a propósito (es de cierre de cada lote); V.3 y A.* siguen sin marcar.

## Veredicto: PASS WITH WARNINGS

0 CRITICAL · 3 WARNING · 5 SUGGESTION. Los 32 escenarios de RQ-ZS-34 a RQ-ZS-39 tienen prueba: 31 cubiertos, 1 parcial (S-1), 0 sin prueba. De las 45 mutaciones reproducidas (31 de D* y de `apply-progress.md` en todas sus variantes, más 14 propias) **todas las del apply pusieron algo en rojo salvo M3 (b) a solas, que el propio diseño declara no discriminante sin escritor**; de las propias, 5 sobreviven: 1 equivalente (X4) y 4 declaradas abajo (W-1 a W-3). Ninguna roja fue por el arnés. La focal de la tanda da 16 ficheros y 203 pruebas, código 0 (19 s). Cada fichero tocado quedó con `sha256sum` idéntico, `file` igual y `git status` limpio tras cada restauración.

## V.3 · Las cinco comprobaciones

PENDIENTES del orquestador (sobre el árbol commiteado): `npm run typecheck`, `npm run lint -- --max-warnings 165`, detector `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`, `npm test` (con log, memoria libre al arrancar y duración) y `npm run build`. Aquí no se corrió la suite entera. Sin herramienta de cobertura en las capacidades: cobertura por fichero omitida (no es fallo).

## V.1 · Escenarios contra pruebas (32/32)

Ficheros de prueba bajo `apps/desk/server/completitud/` salvo los nombrados con su ruta. Siglas: GL = `verificacionGlobal.test.ts`, PT = `verificacionPorTicket.test.ts`, CO = `verificacionContinuacion.test.ts`, RU = `verificacionRutas.test.ts`, LE = `lectores.test.ts`, SL = `soloLectura.test.ts`, VE = `veredicto.test.ts`, CN = `conocidas.test.ts`, CL = `clasificar.test.ts`. «Casa» = la aserción falla si se rompe la producción (mutación citada en V.2).

| # | Escenario | Prueba (fichero › describe › it) | ¿Casa? |
|---|---|---|---|
| 1 | RQ-ZS-34 diferencia cubierta sale conocida con causa y entrada | CL › por id › el #1017…; PT › herencia › el #1017 ausente de Zoho… | Sí (M7a, extra E-999999) |
| 2 | quitar la entrada la vuelve «sin explicar» | CL › por id › quitar la entrada…; PT › herencia › sin la entrada del #1017… (entidad roja) | Sí (M7a) |
| 3 | un ticket ausente transmite su clase a sus hijos | CL › por herencia (4 pruebas); PT › herencia › el #1017… y las conversaciones de un ticket presente… | Sí (M9, P6) |
| 4 | copia ensuciada no deja lanzar y nombra la entrada; el real carga | CN › real › carga sin error; CN › copias ensuciadas (13 casos, índice y sin eco); GL › la lista inválida impide lanzar | Sí (M6a, M6b, M7b) |
| 5 | entrada sin efecto sale «conocida sin uso» y no altera el veredicto | CL › conocidasSinUso; CO › fase C › una diferencia del volumen cubierta… (sin uso con índice); CO › todas íntegras (lista real con entradas sin uso, global verde) | Sí (P5) |
| 6 | RQ-ZS-35 falta en cada lado, ordenado, vacías si idénticas | GL › CA-1 (4 pruebas, también contactos y cuentas) | Sí (X13) |
| 7 | la lista incluye archivados | GL › archivados… › un archivado ausente… | Sí (X13) |
| 8 | re-verificación por id antes de «falta en Zoho» | GL › S-l (404 contra vivo); borrado o papelera; error 500 por id | Sí (P4) |
| 9 | lo nacido en la app sólo se excluye por regla; `app-` no se pide por id | GL › lo nacido en la app (ticket `app-` sin petición; contacto `managed_by_app` sí por id) | Sí (X1, M6b) |
| 10 | la lista de cuentas falla ⇒ «sin comparar» y global no verde | GL › una lista que falla… (cuentas 500; tickets 500 arrastra a las tres por ticket) | Sí (M5) |
| 11 | RQ-ZS-36 igual cantidad con ids distintos | comparar.test.ts › compararIds; PT › CA-2 › Zoho a1, a2 y Desk a1, a3 | Sí (M2) |
| 12 | el recuento declarado no decide (E-266) | PT › CA-2 › E-266 (declara 5, devuelve 4) | PARCIAL, ver S-1 |
| 13 | adjunto por las dos vías cuenta una vez y `size` distinto es diferencia | comparar.test.ts › unirPorId y compararAdjuntos; PT › CA-3 (bytes por lado) | Sí (M12 unir) |
| 14 | el volumen se juzga sin descargar | CO › fase C › sin copia, ausente y otro tamaño…; fallo de disco; conocida por id | Sí (M12 estadoCopia) |
| 15 | la historia casa por el id derivado | LE › historia (upsert real); PT › CA-4 | Sí (la clave `eventId`) |
| 16 | sin `ADJUNTOS_DIR` el volumen queda «sin comparar» | CO › fase C › sin ADJUNTOS_DIR… (adjuntos no verde, global incompleto) | Sí (X3, M5) |
| 17 | RQ-ZS-37 sólo `GET` y ninguna escritura de negocio | SL (8 pruebas); GL › una pasada completa no escribe nada; PT › CA-10 (grabadora) | Sí (M3c, M3a, M3ab) |
| 18 | `429` antes del `404` y del `!res.ok` | LE › leerPorId (429,429,404 tras DOS pausas; 429,500) y leerPaginas | Sí (P3 ×3) |
| 19 | `429` agotado corta y `desde` reanuda | PT › corte 429 en la B; CO › continuación › 429 agotado en el 20… | Sí (P8, M10, X6) |
| 20 | `limite=0` cuenta y estima sin Zoho | GL › limite=0 (2 pruebas); RU › limite=0 sólo cuenta (cerrado y abierto) | Sí (M11) |
| 21 | una pasada a la vez y recuentos por entidad | GL › una pasada a la vez; GL › corte 429 en la A (peticiones y 429 por entidad); RU › POST en segundo plano | Sí (P7) |
| 22 | informe, `GET` y log sin datos de clientes | GL › sólo lectura… (marcadores) y › el log por omisión; PT › CA-11; LE (motivos cerrados) | Sí (M4a, M4b) |
| 23 | RQ-ZS-38 cero «sin explicar» y cobertura completa es verde | VE › todo verde; CO › los mismos datos sin corte…; CO › todas íntegras | Sí (M5, X5) |
| 24 | una sola «sin explicar» quita el verde de su entidad y del global; las demás conservan | VE › un rojo da rojo; PT › CA-2 (conversaciones roja); CO › ?limite=2… (global rojo) | Por composición (S-2) |
| 25 | cortada, error por ticket o parte previa perdida ⇒ «incompleto» | CO › CA-7 (4 pruebas, con contraejemplo verde); CO › redespliegue | Sí (M5, M10, X5) |
| 26 | dos pasadas iguales dan el mismo informe | CO › CA-12 (ids 9, 10, 100; esquema y versión de lista) | Sí (`ordenar`) |
| 27 | RQ-ZS-39 orden rol, interruptor, validación | RU › P2 (rol) y P1 (`limite=abc` cerrado ⇒ 403 con la variable; abierto ⇒ 400) | Sí (P1, P2) |
| 28 | sólo la cadena `true` abre | RU › sólo `true` abre; `packages/zoho-sync/src/config.test.ts` › verificacionCompletitudHabilitada; RU › el literal de app.ts | Sí (M1, M8, X9, X10) |
| 29 | `limite=0` libre con el interruptor cerrado | RU › limite=0 (it.each cerrado y abierto) | Sí (X10) |
| 30 | `desde` o `limite` no enteros ⇒ 400 sin Zoho | RU › validación (1.5, x, signo, vacío, decimal) | Sí (P1) |
| 31 | `GET` no lanza ni falla; no superadministrador 403 | RU › GET sin pasada; GET con error; POST y GET 403 | Sí |
| 32 | `DEPLOY.md` documenta variable y pasos de persona | `apps/desk/server/deployVerificacionCompletitud.test.ts` › §23 (4 pruebas) | Sí (M1) |

**CA-1 a CA-13:** CA-1 filas 6-8; CA-2 filas 11-12; CA-3 fila 13; CA-4 fila 15; CA-5 filas 1-2; CA-6 fila 4; CA-7 fila 25; CA-8 filas 20, 21, 27, 31; CA-9 filas 8, 18, 19; CA-10 fila 17; CA-11 fila 22; CA-12 fila 26; CA-13 fila 32 y las guardas del árbol en sitio (`apps/desk/server/deployRellenoAdjuntos.test.ts` 8/8 en la focal; `apps/desk/server/reconciliacion/registro.test.ts` 2/2 en sitio, entra en V.3), más las cinco comprobaciones (V.3, pendiente).

**Seguridad y estructura, leídas contra la spec:**
- Sólo `GET` a Zoho y sólo `SELECT` a Desk: `apps/desk/server/completitud/verificacion.ts:115` (`soloGet`), `apps/desk/server/completitud/verificacion.ts:117` (`soloSelect`), `apps/desk/server/completitud/verificacion.ts:329` (recuento); el rechazo se registra antes de lanzar (`apps/desk/server/completitud/soloLectura.ts:36`). El motor no recibe `sync`.
- Verde sólo con cobertura completa: `apps/desk/server/completitud/verificacion.ts:306` (`hechaA && desdeInicial === null && hechaB && hechaC`, UNA línea) y `apps/desk/server/completitud/veredicto.ts:18` (`!g.completa`, corte y escrituras rechazadas, UNA línea). La C corre sólo sin corte (`apps/desk/server/completitud/verificacion.ts:297`); la continuación sólo con `desde` igual al número retenido (`apps/desk/server/completitud/verificacion.ts:322`).
- Sin datos de clientes: los lectores devuelven motivos de un conjunto cerrado (`apps/desk/server/completitud/lectores.ts:49`, `apps/desk/server/completitud/lectores.ts:56`); la fila de ticket de la A sale de `filaDe`, sin acceso al registro de Zoho; `apps/desk/server/completitud/verificacion.ts:93` registra una línea sin ids. `estado.error` es un código (`base`, `interno`, `escritura`) o el texto de `ErrorLista` (índice, entidad y entrada, nunca el valor).
- Lista conocida = datos validados al cargar, nunca al arrancar: `apps/desk/server/completitud/conocidas.ts:60` y `apps/desk/server/completitud/verificacion.ts:108` (se lee en cada `lanzar` y `recuento`).
- Orden de guardas: `apps/desk/server/routes/verificacionCompletitud.ts:37` (`requireAuth`, `requireSuperAdmin`, `interruptorVerificacion`, `validarParametros`); la lectura estricta del interruptor en `packages/zoho-sync/src/config.ts:125` y en `apps/desk/server/app.ts:57`. `REINTENTOS_429` vale 3 y `PAUSA_429_MS` 2000 (`packages/zoho-sync/src/conversaciones.ts:23`, `packages/zoho-sync/src/conversaciones.ts:24`).
- Regla 13: nada bajo `apps/desk/src`; rol, interruptor y validación los impone el servidor y están probados (P1, P2, M8). Sin espejo en el cliente.

## V.2 · Mutaciones reproducidas

Cada fila: sha antes igual al sha tras restaurar, `git status` vacío, `file` sin cambio. Las líneas de L4 y L5 del `apply-progress.md` se refieren al `verificacion.ts` de aquel lote; aquí van las de hoy.

| Id | Fichero y línea (hoy) y edición | Rojo medido (fichero › prueba › aserción) |
|---|---|---|
| M1 | `packages/zoho-sync/src/config.ts:125`, la lectura estricta pasa a `!== "false"` sólo en el campo nuevo | config.test.ts › nace cerrada › `expected true to be false`; deployVerificacionCompletitud › nace cerrado › `to contain env.VERIFICACION_COMPLETITUD_HABILITA…` (2) |
| M5 | `apps/desk/server/completitud/veredicto.ts:18` vaciada | 16 rojas en 3 ficheros: VE (corte, cobertura, escrituras), CO (8: corte, error por ticket, parte previa, redespliegue, sin dir, disco…), GL (4); `expected verde to be incompleto` |
| M6a / M6b | `apps/desk/server/completitud/conocidas.json:6` sin `causa`; `apps/desk/server/completitud/conocidas.json:4` con la regla renombrada | 66 y 70 rojas: el real deja de cargar (`entrada 2 … falta causa`; `entrada 0 … regla desconocida`); CN › real › carga sin error |
| M7a | `apps/desk/server/completitud/conocidas.json:6` línea vaciada (JSON válido) | 16 rojas: CL › por id › el #1017… sale «sin explicar» (NO error de lectura); CN › real; conocidasSinUso |
| M7b | `apps/desk/server/completitud/conocidas.ts:19` pareja vaciada | 62 rojas: CN › las parejas de REGLAS son las cinco; el real deja de cargar |
| M9 | `apps/desk/server/completitud/clasificar.ts:40` sin `porHerencia(f) ?? ` | 6 rojas: CL › por herencia (3), P6, PT › herencia (2) |
| P5 / P6 | `apps/desk/server/completitud/clasificar.ts:40` regla primero; regla antes que herencia | P5: CL › orden › P5 y P6 (2); P6: CL › orden › P6 `expected … to match object { entrada: E-267 }` (1) |
| Extra | `apps/desk/server/completitud/conocidas.json:6` la entrada E-267 pasa a E-999999 | deployVerificacionCompletitud › cada entrada del fichero real existe… `expected [ E-999999 ] to deeply equal []`; CN y CL (4) |
| M3 (c) | `apps/desk/server/completitud/soloLectura.ts:36` vaciada | SL › soloGet › init con POST `expected { total: +0, tipos: [] } to deeply equal { total: 2…` (2) |
| M4 (b) | `apps/desk/server/completitud/lectores.ts:56` y, aparte, `apps/desk/server/completitud/lectores.ts:73`: `catch (e)` con `String(e)` | LE › leerPaginas y leerPorId › motivos cerrados `motivo: Error: marcador-secreto-9921` (1 cada una) |
| P3 | `apps/desk/server/completitud/lectores.ts:44`, `apps/desk/server/completitud/lectores.ts:66` y `apps/desk/server/completitud/lectores.ts:67`: copia de `!res.ok` antes de 429, 429 y 404 | 2, 4 y 2 rojas: `expected … to match object { estado: ok }`; `to deeply equal { estado: noEsta }` |
| M3 (a) | `apps/desk/server/completitud/verificacion.ts:137` + importación dinámica y `createSync(…).backfillTickets()` | GL › una pasada completa no escribe nada `expected 8 to be +0`; PT › CA-10 `[ 4, escritura, 1 ]` (7; el resto, peticiones de más) |
| M3 (a)+(b) | además `apps/desk/server/completitud/verificacion.ts:117` con `lee: db` | PT › CA-10 `expected [ …(4) ] to deeply equal []` (la grabadora ve el `INSERT`); 7 |
| M3 (b) sola | `apps/desk/server/completitud/verificacion.ts:117` con `lee: db` | **VERDE (41/41)**, ver W-3 |
| M11 | `apps/desk/server/completitud/verificacion.ts:329` + `await faseA(estadoInicial()); ` | GL › limite=0 › 3 tickets… `expected [ …(9) ] to deeply equal []` (la 2ª roja es la lista inválida, consecuencia real) |
| P4 | `apps/desk/server/completitud/verificacion.ts:148` `await leerPorId(…)` pasa a `({ estado: noEsta })` | GL › S-l `expected [ c1, c2 ] to deeply equal [ c1 ]`; error por id; contacto `managed_by_app` (3) |
| P7 | `apps/desk/server/completitud/verificacion.ts:323` con `enMarcha: false` y `apps/desk/server/completitud/verificacion.ts:290` + `await Promise.resolve(); estado.enMarcha = true; ` | GL › una pasada a la vez `expected [ true, true, false ] to deeply equal [ true, false, true ]` (1) |
| M2 | `apps/desk/server/completitud/porTicket.ts:72` condición por igual número | PT › CA-2 `expected [ [], [], 2, 2, 2, +0 ] to deeply equal [ [ a2 ], [ a3 ], 1, 2, 2, 2 ]`; CA-11 (2) |
| M4 (a) | `apps/desk/server/completitud/verificacion.ts:140` + `Object.assign(en, { asunto: it.subject })` | PT › CA-11 y GL › el estado, el informe y el log… `not to contain marcador-secreto-4417` (2) |
| M12 (unir) | `apps/desk/server/completitud/porTicket.ts:79` con `[...deConversaciones, ...segunda]` | PT › CA-3 `[ [ 4003 ], [], 1, 4, 2, {…} ]` contra `…, 3, 2, …` (1) |
| P8 | `apps/desk/server/completitud/verificacion.ts:232` + `i.cobertura.comparados++; ` y `apps/desk/server/completitud/verificacion.ts:233` vaciada | PT › corte 429 en la B; CO › CA-7 cortada; CO › 429 agotado en el 20 (3) |
| M10 | `apps/desk/server/completitud/verificacion.ts:306` sin `desdeInicial === null && ` | CO › parte previa perdida `[ 20, 2, true, … ]` contra `false`; desde distinto; redespliegue (3) |
| M12 (copia) | `apps/desk/server/completitud/verificacion.ts:265` pasa a `fila.storage_path ? presente : sinCopia` | CO › fase C › sin copia, ausente y otro tamaño `[ [ 4004 ], [], [], 4, rojo ]` contra la ausente 4002; disco; conocida (3) |
| M8 | `apps/desk/server/app.ts:57` pasa a `habilitado: true` (CRLF intacto) | RU (4): P1 `[ 400, false, false ]` contra `[ 403, true, true ]`; sólo true abre; cerrado sin parámetros; el literal. `opcionesConversaciones.test.ts` 4/4 |
| P1 | `apps/desk/server/routes/verificacionCompletitud.ts:37` interruptor tras la validación | RU › P1 `expected [ 400, false, false ] to deeply equal [ 403, true, true ]` (1) |
| P2 | misma línea, interruptor antes del rol | RU › P2 `not to contain VERIFICACION_COMPLETITUD_HABILITADA` (1) |

**Mutaciones propias (revisión independiente), regla de mutación 2:**

| Id | Edición | Resultado |
|---|---|---|
| X1 | `apps/desk/server/completitud/verificacion.ts:148` sin el filtro `!esApp(x)` | ROJO: GL › lo nacido en la app `expected 2 to be +0` |
| X3 | `apps/desk/server/completitud/verificacion.ts:306` sin `&& hechaC` | ROJO: CO › sin ADJUNTOS_DIR… |
| X5a-c | `apps/desk/server/completitud/veredicto.ts:18` sin `!g.completa`, sin el corte, o sin las escrituras (por separado) | ROJO en cada una: VE › cobertura, corte y escrituras |
| X6 | `apps/desk/server/completitud/verificacion.ts:322` continuar con cualquier `desde` | ROJO: CO › un desde distinto del cortadoEn… `[ null, false, … ]` |
| X9, X10 | `apps/desk/server/routes/verificacionCompletitud.ts:19` interruptor siempre abierto; bypass con cualquier `limite` | ROJO (3 y 2): RU › sólo true abre, P1 |
| X13 | `apps/desk/server/completitud/verificacion.ts:102` sin la ruta de archivados | ROJO (3): GL › archivados, CA-10, pausa |
| X4 | `apps/desk/server/completitud/verificacion.ts:306` sin `hechaA && ` | VERDE, equivalente: hechaB implica hechaA |
| X2 | `apps/desk/server/completitud/verificacion.ts:306` sin `&& hechaB` | **VERDE**, ver W-2 |
| X7, X8 | `apps/desk/server/completitud/verificacion.ts:115` sin `soloGet`; `apps/desk/server/completitud/verificacion.ts:329` recuento sin `soloSelect` | **VERDE**, ver W-3 |
| X14 | `apps/desk/server/completitud/verificacion.ts:102` sin `departmentId` en `params` | **VERDE**, ver W-1 |

## Hallazgos

### CRITICAL
Ninguno.

### WARNING
- **W-1 · `departmentId` sin guarda (RQ-ZS-35, S-k).** Quitar `params: { departmentId }` de `apps/desk/server/completitud/verificacion.ts:102` deja las 153 pruebas en verde (X14): ninguna comprueba que `/tickets` salga con `departmentId`; sólo la prueba genérica de `leerPaginas` en LE lo hace para una ruta suelta. La spec dice que la lista es la del departamento de la sincronización «que el informe declara». Falla hacia el ROJO (tickets de otros departamentos saldrían «falta en Desk»), nunca hacia el verde; por eso no lo elevo a CRITICAL, pero es un SHALL sin guarda. Arreglo: una aserción en GL sobre la ruta pedida (`/tickets?departmentId=77&…`; `departmentId: 77` ya está en `montar`). Recomendado antes de archivar.
- **W-2 · `cobertura.completa` miente si la lista de tickets falla (X2).** Sin `&& hechaB` en `apps/desk/server/completitud/verificacion.ts:306`, con `GET /tickets` en 500 y ADJUNTOS_DIR válida, el informe diría `completa: true` con la B sin correr. El veredicto sigue «incompleto» porque tickets queda «sin comparar»: el SHALL del verde lo sostiene un mecanismo redundante, pero GL › la lista de tickets que falla no afirma `cobertura.completa === false`. Arreglo: una aserción.
- **W-3 · las tres envolturas de sólo lectura sobreviven una a una (M3 (b) sola, X7, X8).** `lee: soloSelect` (`apps/desk/server/completitud/verificacion.ts:117`), `soloGet` (`apps/desk/server/completitud/verificacion.ts:115`) y `soloSelect(db)` del recuento (`apps/desk/server/completitud/verificacion.ts:329`) pueden quitarse sin que nada se ponga rojo: hoy no hay ningún escritor en la ruta de código, así que no hay nada que rechazar (mutante casi equivalente). M3 (b) sola está declarada en `apply-progress.md` y en el diseño («además»); sólo (a)+(b) discrimina. Las envolturas están probadas en SL; lo que no está probado a nivel de motor es que estén CABLEADAS (para `soloGet` y para el recuento, ni siquiera combinadas con un escritor). Es defensa en profundidad de CA-10, no un hueco de comportamiento actual.

### SUGGESTION
- **S-1 · escenario 12 (E-266) PARCIAL.** PT › CA-2 › E-266 declara 5 y devuelve 4, y la implementación no lee el campo; pero ninguna otra variante lo distingue de un contador leído (M2 cae por la prueba de ids, no por ésta). Una segunda variante (declara 3, devuelve 4, listas iguales) lo fijaría.
- **S-2 · escenario 24 por composición.** Ninguna prueba de motor afirma a la vez entidad roja, global rojo y «las demás conservan su veredicto» (VE, PT y CO lo cubren por partes). Una aserción en PT › sin la entrada del #1017 cerraría el escenario literal.
- **S-3 · `limite=00` con el interruptor abierto.** La excepción es literal estricto en `apps/desk/server/routes/verificacionCompletitud.ts:19`; `limite=00` pasa la validación (sólo dígitos), no es el recuento y lanza una pasada con `limite` 0 (A completa, B cortada en el primer ticket). Sólo con el interruptor abierto y por un superadministrador; inocuo. Normalizar con `Number(...) === 0` si se quiere uniforme.
- **S-4 · registro del apply.** Las líneas de `verificacion.ts` de las tablas de L4 y L5 del `apply-progress.md` (127, 129, 132, 138, 166, 188, 224, 225…) ya no son las de hoy (137, 140, 148, 290, 323, 232, 233): son del lote (caso B de la regla de mutación 4). No hay citas `ruta:línea` rotas porque están en prosa.
- **S-5 · TDD, forma del rojo.** L4 (`verificacionGlobal.test.ts`) y L5 (`porTicket.ts` redactado antes de correr la prueba) no tuvieron un rojo por aserción previo al código, sólo módulo ausente o motor sin cablear; el apply lo declara (desvío de orden TDD). Las mutaciones de este informe suplen la prueba de que cada aserción discrimina.

## TDD Compliance (strict_tdd)

| Check | Resultado | Detalle |
|---|---|---|
| Tabla «TDD Cycle Evidence» | ✅ | seis tablas, una por lote |
| Todas las tareas tienen prueba | ✅ | 10 ficheros nuevos en `apps/desk/server/completitud/`, `apps/desk/server/deployVerificacionCompletitud.test.ts`, y 1 prueba en `packages/zoho-sync/src/config.test.ts` |
| RED confirmado (el fichero existe) | ✅ | 12/12 existen; el rojo por aserción de L1, L2, L3 (CA-4), L5 y L6 consta en el apply |
| GREEN confirmado | ✅ | focal 16 ficheros, 203 pruebas, código 0; +160 pruebas sobre M0 coincide con 6.037 a 6.197 |
| Triangulación | ✅ | cada guarda con contraejemplo; las 160 pruebas nuevas discriminan salvo W-1 y W-2 |
| Safety net de lo modificado | ✅ | `config.test.ts` 25/25, `deployRellenoAdjuntos.test.ts` 8/8, `history.test.ts` 1/1 antes de tocar |

**TDD Compliance**: 6/6. Capas: Unidad ≈ 84 pruebas (comparar, veredicto, conocidas, clasificar, soloLectura, lectores, config), Integración ≈ 70 (pg-mem con Zoho falsa y `fs` falso: Global 25, PorTicket 16, Continuacion 14; supertest con `createApp`: Rutas 14; `upsertHistoryEvent` real 1), lectura de documentos 6. E2E: no aplica.

**Assertion quality:** ✅ sin tautologías, sin `toBeDefined` ni pruebas de humo; los bucles `for … of` recorren literales no vacíos; cada `[]` esperado va con un caso positivo gemelo. 0 CRITICAL, 0 WARNING. Calidad (linter, tipos): no corridos aquí, son de V.3.

## Resumen para el orquestador
- V.1 y V.2 marcadas en `tasks.md`; V.3 queda para el orquestador. Árbol: `git status` sin cambios salvo este informe y `tasks.md`.
- `next_recommended`: `sdd-archive`, tras decidir si se corrigen W-1 y W-2 (una aserción cada una, sin tocar producción). Ninguno bloquea.

## Corrección del orquestador en i9 — W-1 y W-2 cerradas con prueba, W-3 queda
Única corrección acotada del intento, sólo de pruebas y sin tocar producción: dos pruebas nuevas al FINAL de `apps/desk/server/completitud/verificacionGlobal.test.ts` (15 líneas; el fichero pasa de 25 a 27 pruebas, 27/27 en verde).
- **W-1 cerrada.** «las dos listas de tickets salen con el departmentId de la sincronización (S-k)». Rojo medido con X14 (`params: {}` en la línea 102 de `apps/desk/server/completitud/verificacion.ts`): `expected [ null, null ] to deeply equal [ '77', '77' ]`, 1 roja de 27.
- **W-2 cerrada.** «con la lista de tickets en 500 y ADJUNTOS_DIR válida la fase B no corre y la cobertura no es completa». Rojo medido con X2 (sin `&& hechaB` en la línea 306 del mismo fichero): `expected [ true, 'incompleto' ] to deeply equal [ false, 'incompleto' ]`, 1 roja de 27. Sin directorio la prueba no discrimina (con `dir` nulo `hechaC` ya es falso): por eso lleva un directorio sin filas, como la de la fase B.
- Las dos mutaciones se restauraron con `sha256sum` idéntico y `file` sin cambios; `git status` sin el fichero de producción.
- **W-3 sigue abierta, a propósito:** hoy no hay ningún escritor en la ruta de la pasada, así que quitar una envoltura no tiene comportamiento observable; las envolturas están probadas en `apps/desk/server/completitud/soloLectura.test.ts`. Probar su cableado exigiría espiar el módulo, que ata la prueba a la implementación. Queda como defensa en profundidad de CA-10, declarada.
- Recuento tras la corrección: 0 CRITICAL · 1 WARNING (W-3) · 5 SUGGESTION.
