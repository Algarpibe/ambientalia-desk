# Tareas — `modo-sin-zoho` (1G-04, `cierra: si`)

Entradas: `proposal.md` (S-a a S-p, CA-1 a CA-13), `specs/zoho-sync/spec.md` (RQ-ZS-40 a RQ-ZS-47) y `design.md` (D-1 a D-13; ante un conflicto de nombres manda
la spec). `strict_tdd`: cada prueba nace **roja por la razón correcta** (nunca por el arnés ni por un import que falta) antes de la línea de producción que la
pone verde; las pruebas nuevas van en ficheros nuevos o **al final** de uno existente. Toda edición en un fichero existente va en su MISMA línea física o al
final (D-12): `git diff --numstat` da inserciones = borrados en cada fichero editado en sitio. Comprobaciones de CADA intento, **en serie** y sobre el árbol
commiteado: `npm run typecheck`; `npm run lint -- --max-warnings 165` (N avisos contra 165); detector `node_modules/.bin/tsx apps/desk/server/citas/cli.ts --sha HEAD`;
`npm test` con la salida entera a un log del scratchpad, anotando memoria libre al arrancar, duración y código (repetir sólo si sale 1 SÓLO por «Timeout calling
onTaskUpdate» con todo verde); `npm run build`. Las cinco en 0. Mutaciones con `perl -i -pe '… if $. == N'` (nunca `sed -i`); restaurar y comprobar `git diff`
vacío y `file <fichero>` con sus finales de línea de antes. Medida de cada intento: `git diff --shortstat --no-renames <partida>` más `wc -l` de lo nuevo sin
trackear, ≤ 800, igual a la del registro. `apply-progress.md` se fusiona, nunca se sobrescribe.

## Review Workload Forecast
| Lote | Intento | Estimado | ×1,8 | Techo |
|---|---|---|---|---|
| L1 | i3 | ~370 | ~665 | 800 |
| L2 | i4 | ~285 | ~515 | 800 |
| L3 | i5 | ~355 | ~640 | 800 |
| L4 | i6 | ~230 | ~415 | 800 |
| L5 | i7 | ~185 | ~335 | 800 |
| L6 | i8 | ~310 | ~560 | 800 |
| L7 | i9 | ~150 | ~270 | 800 |

Cada lote es su intento y ninguno pasa de las 800 del preflight (`openspec/config.yaml:29`), con su `apply-progress.md` (~50) dentro; una rama, fusionada por el
analista, sin PRs. Si un lote se desvía de su estimado hacia el techo, se parte antes de seguir. Verify (i10) suma su `verify-report.md` (~350); archive (i11) abre
con techo 2 × la carpeta + 800 (sólo la parte revisable cuenta contra 800). Respecto a D-13 cambian dos asignaciones por compilación, no por diseño:
`apps/desk/server/index.ts:49` va a L3 (el campo `registroModo` de `createApp` nace en `apps/desk/server/app.ts:31`) y `app.ts:52` y `:58` van a L4 (el tipo de
las rutas de tickets y adjunto cambia ahí).
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: High (el presupuesto de esta sesión es 800 por intento, no 400)

| Unidad | Meta | Prueba focal | Arnés real | Frontera de vuelta atrás |
|---|---|---|---|---|
| L1 | puerta, error, registro, origen y campo de configuración (D-1 a D-3) | `npx vitest run packages/zoho-sync/src/modoSinZoho.test.ts packages/zoho-sync/src/zohoClientModoSinZoho.test.ts packages/zoho-sync/src/zohoClient.test.ts packages/zoho-sync/src/config.test.ts` | transporte y gestor de token falsos, reloj inyectado | `modoSinZoho.ts`, `zohoClient.ts`, `config.ts` |
| L2 | ciclo periódico y arranque de la App (D-4) | `npx vitest run apps/desk/server/cicloPeriodico.test.ts apps/desk/server/modoSinZohoIndice.test.ts apps/desk/server/services apps/desk/server/opcionesConversaciones.test.ts` | pasos falsos que apuntan su nombre; `index.ts` leído como texto | `cicloPeriodico.ts`, `index.ts` |
| L3 | guarda común, rutas de administración, manejador central y `GET` (D-5, D-6) | `npx vitest run apps/desk/server/modoSinZohoRutas.test.ts apps/desk/server/modoSinZohoIndice.test.ts apps/desk/server/completitud/verificacionRutas.test.ts` | `appHarness.ts` con pg-mem y supertest | `routes/modoSinZohoDesk.ts`, `app.ts`, `admin.ts`, tres rutas, arnés |
| L4 | aperturas, respuesta y adjunto (D-5) | `npx vitest run apps/desk/server/modoSinZohoAperturas.test.ts apps/desk/server/adjuntos` | `appHarness.ts`, espía de `sync` y de `logger.warn` | `tickets.ts`, `attachment.ts`, `app.ts:52`, `:58` |
| L5 | worker (D-7) | `npx vitest run apps/hub-sync/src` | `vi.useFakeTimers`, clientes falsos; `hub-sync.ts` leído como texto | `hubSync.ts`, `hub-sync.ts` |
| L6 | barrido del repositorio (D-8) | `npx vitest run apps/desk/server/barridoZohoDesk.test.ts apps/desk/server/superficieSaliente.test.ts` | árbol sintético en memoria y árbol real del disco | `testing/barridoZohoDesk.ts` |
| L7 | `DEPLOY.md` §24 (D-9) | `npx vitest run apps/desk/server/deployModoSinZoho.test.ts apps/desk/server/deployVerificacionCompletitud.test.ts` | lectura de `DEPLOY.md` y `config.ts` | `DEPLOY.md`, dos pruebas de despliegue |

## Planificación (i1, i2)
- [x] P.1 `proposal.md`, delta `specs/zoho-sync/spec.md` y la guarda que cuenta el árbol en sitio (`apps/desk/server/reconciliacion/registro.test.ts:218` y `:220`, NUEVE con 1G-04), commit `6417fa9b` (i1).
- [x] P.2 `design.md`, contrastado dato a dato con el código de `6417fa9b`; los tres retoques de la delta (`specs/zoho-sync/spec.md:150-151`, excepción de `ENABLE_WRITES` en la respuesta por `apps/desk/server/routes/tickets.ts:196`; `:233`, todo transporte HTTP; `:255`, `## 24.`); `proposal.md:183-186` en sitio (la guarda la corrigió i1) y la nota de D-13 al final de `proposal.md` (i2).
- [x] P.3 Este `tasks.md` (i2).

## Lote L1 — puerta, error, registro y configuración (intento i3)
Escenarios: RQ-ZS-40 sólo el literal abre; RQ-ZS-41 los cinco; RQ-ZS-42 suma con primera y última, tragado cuenta, sin etiqueta aparece, cuenta antes de lanzar, sin datos de clientes, aviso por origen nuevo (a nivel del registro).
- [x] L1.1 M0: `npm test` entero en el commit de partida del intento, con su log; anotar ficheros, pruebas y duración. Hecho: `npm test` 0 sobre `2a5602a7`, 6199 verdes y 26 omitidas, 236 s.
- [x] L1.2 ROJO `packages/zoho-sync/src/modoSinZoho.test.ts` (nuevo, D-2 y D-3): `cortar` con reloj en `t1` y `t2` ⇒ un origen `cuenta: 2`, `primera: t1`, `ultima: t2`; un llamador que captura y sigue suma igual; `recursoDeRuta` (verbo por acceso reducido a `GET|POST|PUT|PATCH|DELETE|OTRO`, sin query, segmento fuera de los 14 de D-2 ⇒ `{x}`); `llamadorDeLaPila` con las pilas sintéticas de D-2 (POSIX, Windows con `Object.`, `node:` saltado, `node_modules` ⇒ `dependencia`, anónima ⇒ `(anónima)`, ninguna salida con `/app/`, `C:` ni `file:`) y la pila REAL bajo vitest; marcadores únicos en id, query y cuerpo ausentes de `JSON.stringify(leer())`; `avisar` dos veces con tres cortes de un origen y uno de otro, y una vez por ruta rechazada nueva; un `avisar` que lanza no impide el error; `esCorteModoSinZoho` acepta la instancia y la marca, y rechaza `TypeError`, `Error` y `Response`.
- [x] L1.3 ROJO `packages/zoho-sync/src/zohoClientModoSinZoho.test.ts` (nuevo, D-1): abierto, ni transporte ni `getAccessToken`; con un transporte que daría `401`, cero llamadas y ningún segundo token; el error no es `TypeError` ni `Response` y su mensaje no contiene ruta, id ni query marcados; el corte suma en el registro inyectado; `TRUE`, `1`, vacío y ausente: la puerta de hoy. Y **al final** de `packages/zoho-sync/src/config.test.ts`: `modoSinZohoDesk` verdadero sólo con `'true'`.
- [x] L1.4 Anotar el rojo medido de L1.2-L1.3 (fichero › prueba › aserción) en `apply-progress.md`.
- [x] L1.5 `packages/zoho-sync/src/modoSinZoho.ts` (nuevo): `ErrorModoSinZohoDesk`, `esCorteModoSinZoho`, `recursoDeRuta`, `llamadorDeLaPila`, `crearRegistroModoSinZoho({ ahora?, avisar? })` con `cortar(...): never` que CUENTA y DESPUÉS lanza, `rechazar(ruta)` y `leer()`. Sin `method:` literal ni `{ method,` (`apps/desk/server/testing/superficieSaliente.ts:55`, `:57`), sin `MODO_SIN_ZOHO_DESK` en el código (D-8).
- [x] L1.6 En sitio: `packages/zoho-sync/src/zohoClient.ts:2`, `:11`, `:14`, `:29` (4/4) y `packages/zoho-sync/src/config.ts:66`, `:125` (2/2). `packages/zoho-sync/src/zohoClient.test.ts` y `tokenManager.ts` no se tocan.
- [x] L1.7 Verde: la prueba focal, `npm run typecheck` y suite entera con su log.
- [x] L1.8 Mutaciones con su rojo (tabla en `apply-progress.md`): `config.ts:125` `=== 'true'` → `!== 'false'`; el `if` de `zohoClient.ts:29` movido tras `:30`; **quitar el corte de `:29`** (rojas todas las de RQ-ZS-41); en `cortar`, la cuenta tras el `throw`; `recursoDeRuta` sin `{x}` y sin quitar la query; `llamadorDeLaPila` sin recortar; `esCorteModoSinZoho` = `instanceof Error`; `avisar` en cada corte.
- [x] L1.9 Casilla de la regla 13: `git diff --name-only` sin nada bajo `apps/desk/src`.
- [x] L1.10 Cierre del lote: las cinco comprobaciones en 0, la medida, el barrido (B.1) y `apply-progress.md`.

## Lote L2 — ciclo periódico y arranque de la App (intento i4)
Escenarios: RQ-ZS-44 el ciclo corre las seis y salta Desk, quitar una o adelantar el salto lo detecta, cerrado el de hoy, el arranque no sincroniza pero migra.
- [x] L2.1 ROJO `apps/desk/server/cicloPeriodico.test.ts` (nuevo, D-4): abierto, las cinco y `ritmoContratos` en orden, sin `ritmoYSincronizacion` ni Desk; cerrado, las cinco, `ritmoYSincronizacion`, actividades y contactos; con cada flag apagado, sin su paso.
- [x] L2.2 ROJO `apps/desk/server/modoSinZohoIndice.test.ts` (nuevo, fichero vigilado, molde `apps/desk/server/opcionesConversaciones.test.ts:23-27`): la línea de `cadenaDelCiclo(` lleva las seis pasadas y `sync.syncRecent()` en orden por `indexOf` y termina en `}, config)`; `let syncing = false` seguida de `setInterval(() => {`; las líneas de `countTickets(pool)`, `if (config.syncActivities` y `if (config.syncContacts` del arranque llevan `!config.modoSinZohoDesk` y las de `await migrate(pool)` y `reseedTicketNumber(pool) }` no; `const registroModo =` aparece UNA vez, con `avisar:`, y la línea de `createZohoClient(` pasa `registroModo`.
- [x] L2.3 Anotar el rojo medido en `apply-progress.md`.
- [x] L2.4 `apps/desk/server/cicloPeriodico.ts` (nuevo) y, en sitio, `apps/desk/server/index.ts:15`, `:20`, `:61`, `:72`, `:78`, `:88`, `:89`, `:90` (8/8; `:89` y `:90` pasan a comentario SIN el texto `sync.syncRecent()`). `:49` NO se toca en este lote.
- [x] L2.5 Verde: la focal (incluye las cuatro de servicios que leen `index.ts`: `avisoRitmoContrato.test.ts:185-195`, `alarmasSla.test.ts:252-263`, `avisoProvisionalEnBooks.test.ts:299-310`, `avisoReclamacionProveedor.test.ts:251-260`, intactas), typecheck y suite con log.
- [x] L2.6 Mutaciones: `ritmoContratos` también cerrado o `ritmoYSincronizacion` abierto; quitar una evaluación; `sync.syncRecent()` en el comentario de `:89` (rojas las cuatro de servicios); quitar `!config.modoSinZohoDesk` de `:61`, `:72` o `:78`; envolver el `setInterval` de `:85` en un `if`.
- [x] L2.7 Regla 13 y cierre del lote (las cinco, medida, B.1, `apply-progress.md`).

## Lote L3 — guarda común, administración, manejador central y `GET` (intento i5)
Escenarios: RQ-ZS-43 los tres; RQ-ZS-44 `503` que nombra el modo en las seis rutas de administración, recuentos libres, posición probada, el error que escapa da `503`; RQ-ZS-42 el `503` es rechazo y no corte.
- [x] L3.1 ROJO `apps/desk/server/modoSinZohoRutas.test.ts` (nuevo, D-5 y D-6): en `verificacion-completitud` y `relleno-conversaciones`, sin sesión `401`, sin rol `403`, con rol, el interruptor propio cerrado y `limite=abc` ⇒ `503` (ni `403` ni `400`); `limite=0` da su recuento; `measure-attachments`, `backfill-details`, `backfill-archived` y `relleno-adjuntos` ⇒ `503` sin llamar a `zohoFetch`; tabla `'0'`, `'00'`, `''`, `'abc'` de `backfill-history` frente a lo que cuenta su manejador; tras un `503` de guarda, `rechazos` con el patrón de ruta y `cortes` VACÍO; un manejador que deja escapar `ErrorModoSinZohoDesk` ⇒ `503` y no `500`, con su rechazo; el `GET /api/admin/modo-sin-zoho-desk`: `401`, `403`, cerrado `{ activo: false, cortes: [], rechazos: [] }`, abierto con dos cortes de un origen y un rechazo, sin llamar a `zohoFetch` y sin sumarse a sí mismo. Y en `modoSinZohoIndice.test.ts`, **al final**: la línea de `createApp(` de `index.ts` pasa `registroModo` (la misma instancia).
- [x] L3.2 Anotar el rojo medido en `apply-progress.md`.
- [x] L3.3 `apps/desk/server/routes/modoSinZohoDesk.ts` (nuevo): `crearModoSinZoho`, `responderModoSinZoho`, `guardaModoSinZoho`, `registerModoSinZohoRoutes`, los dos mensajes de D-6 y el cuerpo `{ error, motivo: 'modo-sin-zoho-desk' }`.
- [x] L3.4 En sitio: `apps/desk/server/app.ts:22`, `:31`, `:34`, `:50`, `:57`, `:79` (6/6); `apps/desk/server/routes/admin.ts:19`, `:37`, `:40`, `:43`, `:53`, `:196`, `:207` (7/7); `routes/rellenoConversaciones.ts:4`, `:34`, `:36`; `routes/rellenoAdjuntos.ts:4`, `:41`, `:43`; `routes/verificacionCompletitud.ts:4`, `:36`, `:37` (9/9); `apps/desk/server/testing/appHarness.ts:4`, `:46`, `:49`, `:52` (4/4); `apps/desk/server/index.ts:49` (1/1).
- [x] L3.5 Verde: la focal (incluye `opcionesConversaciones.test.ts:37-48` y `verificacionRutas.test.ts:83-88`, intactas), typecheck y suite con log.
- [x] L3.6 Mutaciones y posiciones: en `verificacionCompletitud.ts:37` y `rellenoConversaciones.ts:36`, la guarda antes de `requireAuth(db)` (`503` sin sesión), tras el interruptor (`403`) o tras `validarParametros` (`400`); sin `esRecuento` ni `esConteoHistoria` (`limite=0` da `503`); vaciar el prefijo de `app.ts:79` (`500`); la ruta del rechazo con `originalUrl` (marcadores en `rechazos`); la guarda sin sumar (`rechazos` vacío); un segundo `crearRegistroModoSinZoho` en `index.ts:49`.
- [x] L3.7 Regla 13 y cierre del lote.

## Lote L4 — aperturas, respuesta y adjunto (intento i6)
Escenarios: RQ-ZS-40 el adjunto que caía a Zoho; RQ-ZS-44 las aperturas sirven lo local, la respuesta da `503` con su posición, el adjunto con copia se sirve y sin ella responde claro.
- [x] L4.1 ROJO `apps/desk/server/modoSinZohoAperturas.test.ts` (nuevo): detalle, conversaciones e historia con y sin ticket local (lo local sin llamar a `sync`; sin datos, `404`); respuesta con `ENABLE_WRITES` cerrado ⇒ su `403`, sin área ⇒ `403`, con área ⇒ `503` sin `zohoFetch`; adjunto con copia válida servido igual, sin ella `503` con el texto de D-6 y una línea de `logger.warn` (espiada) sin el `name` marcado; H-2: cerrado y `zohoFetch` que lanza `ErrorModoSinZohoDesk`, el adjunto sin copia da `503` por el manejador central con rechazo `GET /api/attachment`.
- [x] L4.2 Anotar el rojo medido en `apply-progress.md`.
- [x] L4.3 En sitio: `apps/desk/server/routes/tickets.ts:13`, `:23`, `:25`, `:132`, `:136`, `:149`, `:169`, `:196` (8/8) y `servirLocal` al final; `apps/desk/server/routes/attachment.ts:4`, `:8`, `:10`, `:22` (4/4) y `adjuntoSinCopiaEnModo` al final; `apps/desk/server/app.ts:52`, `:58` (2/2).
- [x] L4.4 Verde: la focal (incluye `adjuntos/rutaAdjunto.test.ts:8-13`, intacta), typecheck y suite con log.
- [x] L4.5 Mutaciones: quitar `if (!modo.activo) ` de `tickets.ts:132` o `:136`, o el añadido de `:149` o `:169`; en `:196`, la guarda antes de `guardWrites` o antes de `requireArea`; quitar el añadido de `attachment.ts:22`; meter `name` en la línea de log.
- [x] L4.6 Regla 13 y cierre del lote.

## Lote L5 — el worker (intento i7)
Escenarios: RQ-ZS-45 los tres; RQ-ZS-42 el worker deja una línea por origen nuevo (cableado).
- [x] L5.1 ROJO `apps/hub-sync/src/hubSyncModoSinZoho.test.ts` (nuevo, molde `apps/hub-sync/src/hubSync.test.ts:128-131`): abierto, ni `backfillTickets`, ni `backfillArchivedTickets`, ni `syncActivities`, ni `syncContacts`, ni `syncRecent` tras avanzar el reloj, y Books y CRM sí, con su periodo; `migrate` corre; cerrado, las tres pasadas. Fichero vigilado (molde `apps/hub-sync/src/hub-sync.guardian.test.ts:17-19`): las líneas de `hubBootstrap(` y `scheduleHubSync(` llevan `modoSinZohoDesk: config.modoSinZohoDesk` y la de `createZohoClient(`, `registro:` y `avisar:`.
- [x] L5.2 Anotar el rojo medido en `apply-progress.md`.
- [x] L5.3 En sitio: `apps/hub-sync/src/hubSync.ts:11`, `:12`, `:15`, `:21`, `:22`, `:86`, `:87`, `:90` (8/8) y `apps/hub-sync/src/hub-sync.ts:4`, `:20`, `:48`, `:49` (4/4).
- [x] L5.4 Verde: la focal (incluye `hub-sync.guardian.test.ts` y `hubSyncSinConversaciones.test.ts:43-45`, intactas), typecheck y suite con log.
- [x] L5.5 Mutaciones: quitar el prefijo de `hubSync.ts:90`, de `:15`, `:21` o `:22`; quitar el campo de `hub-sync.ts:48` o `:49`, o el `avisar:` de `:20`.
- [x] L5.6 Regla 13 y cierre del lote.

## Lote L6 — barrido del repositorio (intento i8)
Escenarios: RQ-ZS-46 los tres.
- [x] L6.1 ROJO `apps/desk/server/barridoZohoDesk.test.ts` (nuevo): `sinComentarios` (cadenas, plantillas, regex, `//` y `/* */`, saltos conservados, `https://` en cadena intacto); árbol sintético en memoria con un fichero por forma —`fetch('https://desk.zoho.com/api/v1/tickets')`, `fetchImpl(url)`, dominio de Desk, `oauth/v2/token`, `createZohoClient` nuevo, `http.request` de `node:http`—, cada uno rojo y nombrado; las mismas formas sólo en comentarios, verde; el árbol real del disco, verde, con `sinUso` vacío y más de cero ficheros recorridos (el número en el mensaje).
- [x] L6.2 Anotar el rojo medido en `apply-progress.md`.
- [x] L6.3 `apps/desk/server/testing/barridoZohoDesk.ts` (nuevo): `sinComentarios`, `barrer`, `leerArbol` y la lista cerrada de D-8, medida otra vez sobre el árbol de este lote (incluye los ficheros nuevos de L1-L5).
- [x] L6.4 Verde: la focal (incluye `superficieSaliente.test.ts`, intacta), typecheck y suite con log.
- [x] L6.5 Mutaciones, **fichero vigilado (regla 2)**: añadir al final de `apps/desk/server/measure.ts` `fetch('https://desk.zoho.com/api/v1/tickets')` (rojo y nombra el fichero) y restaurar; quitar un sitio de la lista (rojo en el real); añadir uno sin señal (`sinUso` no vacío). Si el árbol real da un falso rojo, se afina `sinComentarios`, nunca la lista (H-3).
- [x] L6.6 Regla 13 y cierre del lote.

## Lote L7 — `DEPLOY.md` §24 (intento i9)
Escenarios: RQ-ZS-47 los dos.
- [ ] L7.1 ROJO `apps/desk/server/deployModoSinZoho.test.ts` (nuevo, molde `apps/desk/server/deployVerificacionCompletitud.test.ts`): `faltasSeccion24` con la lista de D-9; sobre el real, `[]`; sobre copias en memoria sin el worker o sin «Qué se rompe», no vacío; `config.ts` contiene `env.MODO_SIN_ZOHO_DESK === 'true'`.
- [ ] L7.2 Anotar el rojo medido en `apply-progress.md`.
- [ ] L7.3 `DEPLOY.md`, tras `:1028`: la §24 de D-9. Antes de tocar la guarda, **medir el rojo** que causa en `apps/desk/server/deployVerificacionCompletitud.test.ts:36` y `:37` (`seccion` llega al final) y anotarlo.
- [ ] L7.4 Guarda que cuenta el árbol, en sitio, 4/4, molde `apps/desk/server/deployRellenoAdjuntos.test.ts:22` y `:37`: `deployVerificacionCompletitud.test.ts:20` acota hasta `## 24. `; `:36` añade que la §24 va detrás; `:10` y `:33` dejan de decir «es la última».
- [ ] L7.5 Verde: la focal, typecheck y suite con log.
- [ ] L7.6 Mutaciones: en el real, borrar con `perl` la línea que nombra el worker en la §24 (rojo) y restaurar.
- [ ] L7.7 Regla 13 y cierre del lote.

## Barrido de la regla de mutación 4 (tarea de cierre de cada lote)
- [ ] B.1 `grep -rnoE "<fichero>:[0-9]+(-[0-9]+)?"` sobre TODO el repositorio, incluidos `openspec/changes/archive/` y `docs/`, para cada fichero muy citado editado en el lote: `packages/zoho-sync/src/config.ts`, `zohoClient.ts`, `apps/desk/server/index.ts`, `app.ts`, `routes/admin.ts`, `routes/tickets.ts`, `routes/attachment.ts`, los tres de rutas de L3, `apps/hub-sync/src/hubSync.ts`, `hub-sync.ts`, `testing/appHarness.ts`, `deployVerificacionCompletitud.test.ts` y `DEPLOY.md`. Leer cada hallazgo contra lo que AFIRMA (casos A/B/C de `CLAUDE.md`), con atención a las de D-12 (`index.ts:88`, `:89-90`, `:85-93`; `zohoClient.ts:29-37`, `:30`, `:33`; `attachment.ts:21-22`, `:24`; `app.ts:57`, `:78-93`; `hubSync.ts:15-20`, `:90-100`; `config.ts:66`, `:125`); segundo pase para las abreviadas en los ficheros que ya citan el módulo. Resultado en `apply-progress.md`.

## Verificación (intento i10)
- [ ] V.1 Verify independiente: `verify-report.md` con cada escenario de RQ-ZS-40 a RQ-ZS-47 contra su prueba, y CA-1 a CA-13.
- [ ] V.2 Reproducir las mutaciones y posiciones de `apply-progress.md` con `perl`, restauración comprobada; al menos: quitar el corte de la puerta, una de posición de L3 y la del fichero vigilado de L6.
- [ ] V.3 Las cinco comprobaciones en 0 y la medida del intento (el `verify-report.md` suma).

## Archivo (intento i11)
- [ ] A.1 Techo del intento = 2 × `wc -l` de la carpeta del cambio + 800. Medir antes de aplicar la parte revisable (fusión del delta más `archive-report.md`) con `git diff --shortstat --no-renames`; si supera 800, parar y consultar.
- [ ] A.2 Fusión por script de los ocho ADDED (RQ-ZS-40 a RQ-ZS-47) al **final** de `openspec/specs/zoho-sync/spec.md`; identidad bloque a bloque, finales de línea de la spec viva conservados (`file`) y ensayo `--dry` antes.
- [ ] A.3 `archive-report.md` con la línea de R-1 (qué cubrió de 1G-04 y qué dejó fuera), el inventario de llamadas a Zoho Desk y las tareas de persona aparte; sus citas, contrastadas con un script que lea cada extremo en su ancla (el detector excluye `archive/`).
- [ ] A.4 `apps/desk/server/reconciliacion/registro.test.ts:218` («NUEVE» → «OCHO», 1G-04 cerrada por archivo por `modo-sin-zoho`, `cierra: si`) y `:220` (fuera de «en curso», `toContain('1G-04')` en «cerradas por archivo»), en sitio, con su rojo medido al mover la carpeta.
- [ ] A.5 Cinco comprobaciones en 0 y commit que contiene sólo este cambio: `git show --numstat`.

## Tareas de persona — fuera del recuento; archivar NO las da por hechas
| Id | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Añadir a `.env.example` las líneas de la variable (D-9, redactadas en el informe de cierre): la terminal no puede leer ese fichero | Alfonso | informe de cierre |
| P-2 | Desplegar con el interruptor cerrado (`MODO_SIN_ZOHO_DESK=false`) en los DOS servicios, App y worker `hub-sync` | Alfonso | `DEPLOY.md` §24 |
| P-3 | La semana en modo sin Zoho (paso 4 del corte, `docs/sdd/Plan_Independencia_Zoho_Desk_31-12-2026.md:100`): abrir en los dos, leer el `GET` y el log del worker, cerrar; con decisión de Gerencia | Alfonso; decide Gerencia | `DEPLOY.md` §24 |
