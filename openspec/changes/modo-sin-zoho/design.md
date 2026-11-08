# Diseño — `modo-sin-zoho` (1G-04, `cierra: si`)

Entradas: `proposal.md` (S-a a S-p, CA-1 a CA-13) y la delta `specs/zoho-sync/spec.md` (RQ-ZS-40 a RQ-ZS-47), que manda si un nombre choca.
Líneas medidas en este worktree, sobre `6417fa9b`. Flujo: `loadConfig` lee `MODO_SIN_ZOHO_DESK` una vez → `zohoFetch` corta antes del token, cuenta
y lanza → la App salta lo de Desk en segundo plano, sirve lo local y responde `503` a lo que sólo Zoho da (y lo cuenta como rechazo) → el worker no
programa Desk → un barrido del árbol impide otra salida. Ninguna línea citada se mueve: toda edición en fichero existente va en su MISMA línea física o
al final del fichero (tabla de D-12).

## D-1 · El corte, en la puerta y antes del token (RQ-ZS-40, RQ-ZS-41, S-h)
**Elección.** `packages/zoho-sync/src/zohoClient.ts:29` gana, tras la `{`, `if (config.modoSinZohoDesk === true) registro.cortar(path, init)`: es la
primera instrucción de `zohoFetch`, antes de `getAccessToken` (`:30`) y del reintento del `401` (`:33`). `registro.cortar(...): never` CUENTA y DESPUÉS
lanza `ErrorModoSinZohoDesk` (molde `apps/desk/server/completitud/soloLectura.ts:15-19`); como `zohoFetch` es `async`, el llamador recibe un rechazo.
El error lleva un mensaje fijo (`'modo sin Zoho Desk: la petición a Zoho Desk no salió'`), sin ruta, ids ni query, y la marca `modoSinZohoDesk = true`;
`esCorteModoSinZoho(e)` acepta `instanceof` o la marca, para que lo reconozcan las rutas y el manejador central aunque haya dos copias del módulo.
Inyección: `:11` gana `; registro?: RegistroModoSinZoho`, `:14` desestructura `registro = crearRegistroModoSinZoho()` y `:2` importa, los tres en sitio.
El campo va en `packages/zoho-sync/src/config.ts:66` (`; modoSinZohoDesk: boolean`, antes de la `}`) y `:125` (`modoSinZohoDesk: env.MODO_SIN_ZOHO_DESK === 'true',`,
antes del comentario). `packages/zoho-sync/src/zohoClient.test.ts` no se toca: su `config` (`:5-9`) no trae el campo, `undefined === true` es falso y la
puerta queda la de hoy (CA-1). `tokenManager.ts` no se toca.
**Descartadas.** Cortar en `fetchImpl` (`:18`): `getAccessToken` saldría antes por su propio transporte (`tokenManager.ts:25`). Una `Response` sintética
`503`: se confunde con «Zoho caído» (S-h). Un `createZohoClientSinZoho` elegido en `index.ts` y `hub-sync.ts`: dos cableados que pueden divergir.
**Lo fija** `packages/zoho-sync/src/zohoClientModoSinZoho.test.ts` (nuevo): abierto, ni transporte ni token; con un transporte que daría `401`, cero
llamadas; el error no es `TypeError` ni `Response` y su mensaje no contiene ruta, id ni query marcados; `TRUE`, `1`, vacío y ausente, la de hoy.

## D-2 · El origen: recurso reducido más llamador tomado de la pila (S-i)
`recursoDeRuta(path, init)`: verbo de `init.method` leído por acceso (molde `soloLectura.ts:7`, `:36`) y reducido a `GET|POST|PUT|PATCH|DELETE` u `OTRO`;
ruta sin query (`split('?')[0]`), y cada segmento que no esté en `SEGMENTOS` pasa a `{x}` (molde `apps/desk/server/completitud/lectores.ts:19-21`).
`SEGMENTOS` es el inventario de las rutas que hoy recibe `zohoFetch`, catorce: `tickets`, `archivedTickets`, `search`, `History`, `conversations`,
`contacts`, `accounts`, `tasks`, `attachments`, `threads`, `comments`, `content`, `sendReply`, `mailReplyAddress` (`packages/zoho-sync/src/sync.ts:76`, `:90`,
`:100`, `:140`, `:162`, `:179`, `:250`, `:272`, `:396`; `packages/zoho-sync/src/conversaciones.ts:77`; `apps/desk/server/routes/tickets.ts:199`, `:203`;
`apps/desk/server/routes/attachment.ts:17`). Un recurso nuevo sale como `/{x}` y lo identifica el llamador.
`llamadorDeLaPila(new Error().stack)`: el primer marco que no sea de `modoSinZoho.ts`, `zohoClient.ts` ni `node:`; de él, el fichero desde el último
`apps/`, `packages/` o `scripts/` (barras normalizadas, sin `file://`, sin `:línea:columna`) y la función (último tramo tras `.`; `(anónima)` si no hay).
Sin coincidencia, `desconocido`; con `node_modules`, `dependencia`. Nunca una ruta absoluta del disco.
**Descartadas.** Una etiqueta opcional en `zohoFetch`: tocaría 14 consumidores y líneas citadas, y el llamador que nadie etiquetó —el que se busca— no
la llevaría. Un `AsyncLocalStorage`: el mismo hueco.
**Lo fija** `packages/zoho-sync/src/modoSinZoho.test.ts` con pilas SINTÉTICAS: `at fetchTicket (file:///app/packages/zoho-sync/src/sync.ts:179:31)` ⇒
`packages/zoho-sync/src/sync.ts · fetchTicket`; la misma en ruta de Windows (`C:\…\packages\zoho-sync\src\sync.ts:179:31`, con `Object.` delante); un
primer marco `node:internal/process/task_queues` que se salta; `node_modules/express/…` ⇒ `dependencia`; un marco anónimo ⇒ `(anónima)`; y ninguna
salida contiene `/app/`, `C:` ni `file:`. Y la pila REAL bajo vitest, llamando desde `llamarDesdeAqui` del propio fichero. **Hipótesis H-1:** producción
corre con `npx tsx` (`Dockerfile:29`) y sus marcos llevan la ruta del `.ts`, como bajo vitest; si no, sale `desconocido`, que no filtra nada.

## D-3 · El registro: un módulo del paquete, en memoria, y con aviso por log en los DOS servicios (S-e, S-j)
`packages/zoho-sync/src/modoSinZoho.ts` (nuevo; el worker no puede importar de `apps/desk`), exportado por `"./*"` (`packages/zoho-sync/package.json:2`).
Dos mapas, `cortes` por `recurso + llamador` y `rechazos` por ruta, cada valor `{ cuenta, primera, ultima }` en ISO; reloj `ahora: () => Date`
inyectable. `leer()` copia, ordena por `recurso`, `llamador` y `ruta` con comparación de código (sin `localeCompare`) y no lanza. El conjunto de claves
es finito (recursos × llamadores del código, patrones de ruta). `avisar?: (linea) => void` se llama UNA vez por origen o ruta nuevos, dentro de un
`try`: `modo sin Zoho Desk: primer corte de <recurso> ← <llamador>` y `… primer rechazo en <ruta>`. **La App también avisa** (`logger.warn`): el `GET`
se vacía al redesplegar y S-e promete que el log conserva la primera aparición; el worker, `console.warn`. Los saltos de fondo no pasan por el
registro: no llaman a `zohoFetch` (D-4, D-5, D-7). **Descartada** la persistencia (tabla y migración, S-e).
**Lo fija** `modoSinZoho.test.ts`: con el reloj en `t1` y `t2`, dos cortes del mismo recurso y llamador dan UN origen con `cuenta: 2`, `primera: t1` y
`ultima: t2`; un llamador que captura el error y sigue suma igual; ids, query y cuerpo con marcadores únicos no aparecen en `JSON.stringify(leer())`;
tres cortes de un origen y uno de otro llaman a `avisar` exactamente dos veces; un `avisar` que lanza no impide el `ErrorModoSinZohoDesk`.

## D-4 · La cadena del temporizador, en una unidad probada, y el cableado del registro (S-p, RQ-ZS-44.1-2)
`apps/desk/server/cicloPeriodico.ts` (nuevo): `cadenaDelCiclo(ev, desk, config)` encadena `alarmas → reclamaciones → facturacionVencida →
salidasEsperas → provisionalesEnBooks` y, como sexta, `ev.ritmoContratos()` con el modo abierto o `ev.ritmoYSincronizacion()` cerrado —una de las
dos por ciclo—; cerrado, después `syncActivities` y `syncContacts` con sus flags. `apps/desk/server/index.ts:88` pasa a:
`const p = cadenaDelCiclo({ alarmas: () => pasadaAlarmas(pool, config), reclamaciones: () => pasadaReclamaciones(pool), facturacionVencida: () => pasadaFacturacionVencida(pool), salidasEsperas: () => pasadaSalidasEsperas(pool, config), provisionalesEnBooks: () => pasadaProvisionalesEnBooks(pool), ritmoContratos: () => pasadaRitmoContratos(pool), ritmoYSincronizacion: () => pasadaRitmoContratos(pool).then(() => sync.syncRecent()) }, { syncActivities: () => sync.syncActivities(), syncContacts: () => sync.syncContacts() }, config)`
**Por qué así (salida a de A-1):** conserva literalmente `pasadaRitmoContratos(pool).then(() => sync.syncRecent())`, y ese encadenado es el que se
ejecuta de verdad cerrado el modo; así las cuatro pruebas que leen `index.ts` (D-10) siguen verdes sin tocarlas y siguen fijando un orden real. Olvidar
una propiedad es error de `tsc`. **Descartada** la salida b (corregir `apps/desk/server/services/avisoRitmoContrato.test.ts:194` por `indexOf`): tocaría una
prueba citada y la dejaría fijando el orden de un literal de objeto, que no es el de ejecución.
`:89` y `:90` pasan a dos líneas de comentario («actividades y contactos los encadena `cadenaDelCiclo`, `cicloPeriodico.ts`, tras la sincronización
reciente; con el modo abierto se saltan»), SIN el texto `sync.syncRecent()`: esas cuatro pruebas exigen UNA sola línea que lo contenga. Las citas
siguen ciertas: `apps/desk/server/services/alarmasSla.ts:140`, `avisoRitmoContrato.ts:64`, `avisoProvisionalEnBooks.ts:102`, `avisoReclamacionProveedor.ts:69`,
`avisoFacturacionVencida.ts:70`, `avisoSalidasEsperas.ts:74` y `avisoRitmoContrato.test.ts:15`, `:177` (la `:88` nombra las seis y `sync.syncRecent()` en
su orden); los rangos `index.ts:85-93` de `openspec/specs/zoho-sync/spec.md:48`, `:264`, `:753` y `docs/sdd/ENTRADA.md:1231` también: el `setInterval`
(`:85`, `:93`) no cambia y sigue siendo el único temporizador, y `:264` («`syncRecent` → `syncActivities` → `syncContacts`, encadenados») es lo que hace
`cadenaDelCiclo` cerrado el modo, que lo fija su prueba. `proposal.md:58` y `:75` citan `:89-90` como foto de `e3360dc4` (caso B).
**Arranque**, en sitio: `:61` antepone `if (!config.modoSinZohoDesk) ` a la sentencia del backfill (`:61-70`); `:72` y `:78` pasan a
`if (config.syncActivities && !config.modoSinZohoDesk) {` y su par. La migración y la resiembra (`:26-29`) no se tocan (CA-6).
**Cableado del registro**, en sitio: `:15` añade `; import { cadenaDelCiclo } from './cicloPeriodico'; import { crearRegistroModoSinZoho } from '@ambientalia/zoho-sync/modoSinZoho'`;
`:20` pasa a `const registroModo = crearRegistroModoSinZoho({ avisar: (linea) => logger.warn(linea) }); const { zohoFetch } = createZohoClient({ config, tokenManager, registro: registroModo })`;
`:49` pasa `registroModo` a `createApp`, que lo recibe en `apps/desk/server/app.ts:31` y `:34` (D-5).
**Descartada** una función al final de `index.ts`: nadie puede importarlo, porque arranca `main()` al cargarse (`apps/desk/server/index.ts:106`;
`apps/desk/server/opcionesConversaciones.test.ts:7-9`).
**Lo fijan** `apps/desk/server/cicloPeriodico.test.ts` (pasos falsos que apuntan su nombre: abierto, las cinco y `ritmoContratos`, en orden, y ni
`ritmoYSincronizacion` ni Desk; cerrado, las cinco, `ritmoYSincronizacion`, actividades y contactos; con un flag apagado, sin su paso) y
`apps/desk/server/modoSinZohoIndice.test.ts`, fichero vigilado (molde `apps/desk/server/opcionesConversaciones.test.ts:23-27`): la línea de
`cadenaDelCiclo(` lleva las seis pasadas y `sync.syncRecent()` en orden por `indexOf` y termina en `}, config)`; `let syncing = false` va seguida de
`setInterval(() => {` (el temporizador de `:85` no queda dentro de ningún `if`); las líneas de `countTickets(pool)`, `if (config.syncActivities` y
`if (config.syncContacts` del arranque llevan `!config.modoSinZohoDesk`, y las de `await migrate(pool)` y `reseedTicketNumber(pool) }` (`:27`, `:29`) no;
`const registroModo =` aparece UNA vez, con `avisar:`, y tanto la línea de `createZohoClient(` como la de `createApp(` pasan `registroModo`: la MISMA instancia.

## D-5 · La App: guarda común, aperturas, adjunto y manejador central (RQ-ZS-44)
`apps/desk/server/routes/modoSinZohoDesk.ts` (nuevo) exporta `ModoSinZoho = { activo, registro }`, `crearModoSinZoho(config, registro)` (`activo:
config.modoSinZohoDesk === true`), `responderModoSinZoho(req, res, modo, mensaje?)` —suma el rechazo y responde `503`; con `res.headersSent` sólo
suma (molde `apps/desk/server/app.ts:91`)— y `guardaModoSinZoho(modo, libre?)`, middleware de escalón B (F1B-10): cerrado o `libre(req)`, `next()`; si
no, `responderModoSinZoho`. La ruta del rechazo es `<verbo> ${req.baseUrl}${req.route.path}` (patrón de Express, nunca `req.originalUrl`), o
`(ruta desconocida)`. Se inserta como un argumento más de la cadena, en la MISMA línea del `app.post`/`app.get`:

| Ruta | Línea en sitio | Cadena resultante | Libre |
|---|---|---|---|
| `GET /api/admin/measure-attachments` | `apps/desk/server/routes/admin.ts:43` | `requireAuth(db), requireSuperAdmin, guardaModoSinZoho(modo), (req, res) =>` | — |
| `GET /api/admin/backfill-details` | `admin.ts:53` | ídem | — |
| `POST /api/admin/backfill-history` | `admin.ts:196` | `…, requireSuperAdmin, guardaModoSinZoho(modo, esConteoHistoria), asyncHandler(…)` | `limite` presente y `Number(limite) === 0`, la misma noción que `:197`, `:199` |
| `POST /api/admin/backfill-archived` | `admin.ts:207` | `…, requireSuperAdmin, guardaModoSinZoho(modo), (_req, res) =>` | — |
| `POST /api/admin/relleno-conversaciones` | `apps/desk/server/routes/rellenoConversaciones.ts:36` | `…, requireSuperAdmin, guardaModoSinZoho(modo, esRecuento), interruptorRelleno(habilitado), …` | `limite === '0'` (`:17`, `:39`) |
| `POST /api/admin/relleno-adjuntos` | `apps/desk/server/routes/rellenoAdjuntos.ts:43` | `…, guardaModoSinZoho(modo, esRecuento), interruptorAdjuntos(habilitado, hayDir), …` | ídem (`:19`, `:46`) |
| `POST /api/admin/verificacion-completitud` | `apps/desk/server/routes/verificacionCompletitud.ts:37` | `…, guardaModoSinZoho(modo, esRecuento), interruptorVerificacion(habilitado), validarParametros, …` | ídem (`:19`, `:40`) |
| `POST /api/tickets/:id/reply` | `apps/desk/server/routes/tickets.ts:196` | `guardWrites, requireArea, guardaModoSinZoho(modo), asyncHandler(…)` | — |

Los `GET` de estado de los rellenos y de la verificación (`rellenoConversaciones.ts:46`, `rellenoAdjuntos.ts:53`, `verificacionCompletitud.ts:44`) no
llevan guarda: sólo leen memoria. `backfill-history` con `limite=0` no llama a Zoho: la tanda es `slice(0, 0)` (`packages/zoho-sync/src/sync.ts:226`).
**La respuesta** aplica la excepción escrita en RQ-ZS-44.4 (`specs/zoho-sync/spec.md:150-151`): su `ENABLE_WRITES` (`tickets.ts:27-33`) precede hoy al
rol (`apps/desk/server/auth/middleware.ts:33-34`), no se reordena, y el `503` va tras los dos.
**Aperturas** (`tickets.ts`, en sitio): `:132` y `:136` anteponen `if (!modo.activo) `; sin sincronizar, `:133-134` dan el `404` de siempre. `:149` y `:169`
añaden tras su `const primero = …` `; if (modo.activo) { await servirLocal(res, db, id, primero.mensajes); return }` (y `primero.eventos`). `servirLocal`,
al final del fichero, responde `404` `Ticket no encontrado` si `getTicketWithRefs(db, id)` (`apps/desk/server/db/ticketsConCliente.ts:35`) es nulo —la
misma noción de «sin datos locales» que el detalle, no una segunda— y si no, lo local. `:13`, `:23` y `:25`: importación, tipo y desestructurado de `modo`.
**Adjunto** (`apps/desk/server/routes/attachment.ts`): `:22` añade tras la copia local `; if (modo.activo) { adjuntoSinCopiaEnModo(req, res, copia, modo); return }`;
`copia` ya es la rama `zoho`. La función, al final: UNA línea `logger.warn({ adjunto, ticket, motivo }, …)` con el molde de `registrarCaida`
(`apps/desk/server/adjuntos/servir.ts:79-82`), sin nombre de fichero ni `path`, y `responderModoSinZoho(…, MENSAJE_ADJUNTO_SIN_COPIA)`. Orden: `401`
(`:14`), `400` de ruta (`:17`), copia válida servida (`:22`), `503`. `:4`, `:8`, `:10`: importación, tipo y desestructurado.
**Manejador central** (`apps/desk/server/app.ts:79`): antepone `if (esCorteModoSinZoho(err)) { responderModoSinZoho(_req, res, modo); return } `. `modo` se crea
al final de `:50` (`; const modo = crearModoSinZoho(config, registroModo)`) y llega a las rutas por `:52`, `:57` y `:58`.
**Descartada** una `Sync` de mentira con `syncTicket` vacío: no daría el `404` de conversaciones e historia, y «sin llamar a `sync`» sería falso.
**Lo fijan** `apps/desk/server/modoSinZohoRutas.test.ts` (rutas de administración y manejador) y `apps/desk/server/modoSinZohoAperturas.test.ts`
(aperturas, respuesta y adjunto): en `verificacion-completitud` y `relleno-conversaciones`, sin sesión `401`, sin rol `403`, y con rol, el interruptor propio
cerrado y `limite=abc`, `503` (ni `403` ni `400`); `limite=0`, su recuento; tabla `'0'`, `'00'`, `''`, `'abc'` de `backfill-history` frente a lo que cuenta el
manejador; tras un `503` de guarda, el registro tiene ese rechazo con su patrón de ruta y `cortes` VACÍO; respuesta: `ENABLE_WRITES` cerrado ⇒ su `403`,
sin área ⇒ `403`, con área ⇒ `503` sin llamar a `zohoFetch`; aperturas con y sin ticket local, con el espía de `sync` sin llamadas; adjunto con copia
servido, sin ella `503` con el texto de D-6, y un `name` con marcador que no aparece en la línea de `logger.warn` (espiada). **H-2:** con el modo
cerrado y un `zohoFetch` que lanza `ErrorModoSinZohoDesk`, el `GET /api/attachment` sin copia escapa por `attachment.ts:24` al manejador central y da
`503`, y `registro.leer().rechazos` es `[{ ruta: 'GET /api/attachment', cuenta: 1, … }]`; si Express 5 no conservara `req.route`, ese aserto lo
enseñaría y la ruta saldría `(ruta desconocida)`, que no lleva datos.

## D-6 · Textos y forma del `GET` (S-k, S-l, RQ-ZS-43)
- `MENSAJE_MODO_SIN_ZOHO_DESK`: «La app está en modo sin Zoho Desk: esta función necesita Zoho Desk y no está disponible mientras dure el modo. Lo
  que ya está en la base de datos sigue disponible.»
- `MENSAJE_ADJUNTO_SIN_COPIA`: «Este adjunto no está en el almacenamiento propio y la app está en modo sin Zoho Desk: no se puede traer de Zoho
  mientras dure el modo.»
- Cuerpo de todo `503`: `{ error, motivo: 'modo-sin-zoho-desk' }` (molde `apps/desk/server/routes/admin.ts:265`). El cliente enseña el cuerpo CRUDO
  (`apps/desk/src/api/client.ts:9`): la persona lee `HTTP 503: {"error":"La app está en modo sin Zoho Desk: …","motivo":"modo-sin-zoho-desk"}`.

`registerModoSinZohoRoutes(app, { db, modo })` registra `GET /api/admin/modo-sin-zoho-desk` con `requireAuth(db), requireSuperAdmin` (`middleware.ts:17`,
`:27`) y `res.json({ activo: modo.activo, ...modo.registro.leer() })`, molde `apps/desk/server/routes/verificacionCompletitud.ts:44-46`; sin guarda, así que
no se suma a sí misma, y no llama a Zoho ni a la base. Cerrado, las listas salen vacías por construcción. Se llama al final de `app.ts:57`.
```json
{ "activo": true,
  "cortes": [{ "recurso": "GET /tickets/{x}", "llamador": "packages/zoho-sync/src/sync.ts · syncTicket", "cuenta": 2, "primera": "2026-11-20T13:00:00.000Z", "ultima": "…" }],
  "rechazos": [{ "ruta": "POST /api/tickets/:id/reply", "cuenta": 1, "primera": "…", "ultima": "…" }] }
```
**Lo fija** `modoSinZohoRutas.test.ts`, los tres escenarios de RQ-ZS-43: sin sesión `401` y con `userCookie` sin rol `403`; cerrado (`appWith()`),
`200` con `{ activo: false, cortes: [], rechazos: [] }`; abierto, con un registro propio pasado a `appWith`, dos `registro.cortar` del mismo origen desde
una función de la prueba y un `503` de `measure-attachments`: `cortes` con UN origen de `cuenta: 2` y `rechazos` con `GET /api/admin/measure-attachments`,
y el espía `zohoFetch` del arnés sin llamadas.

## D-7 · El worker (RQ-ZS-45)
`apps/hub-sync/src/hubSync.ts`, en sitio: `:11` y `:86` ganan `modoSinZohoDesk?: boolean` en el tipo; `:12` y `:87`, `modoSinZohoDesk = false` en el
desestructurado; `:15` pasa a `if (!modoSinZohoDesk && (await countTickets(db)) === 0) {` (todo el bloque `:15-20`); `:21` y `:22` anteponen
`if (!modoSinZohoDesk) `; `:90` antepone `if (!modoSinZohoDesk) ` al `timers.push(setInterval(…))` de Desk, que no se programa (`:90-100`). Books
(`:101-105`) y CRM (`:106-115`) no cambian; `migrate` y la resiembra (`:13-14`) corren. `apps/hub-sync/src/hub-sync.ts`: `:4` importa; `:20` crea
`crearRegistroModoSinZoho({ avisar: (linea) => console.warn(linea) })` y lo pasa como `registro`; `:48` y `:49` pasan `modoSinZohoDesk: config.modoSinZohoDesk`.
**Descartada** una `Sync` vacía: el intervalo seguiría programado y RQ-ZS-45 pide que no.
**Lo fija** `apps/hub-sync/src/hubSyncModoSinZoho.test.ts` (molde `apps/hub-sync/src/hubSync.test.ts:128-131`, `vi.useFakeTimers`): abierto, ningún
`backfillTickets`, `syncActivities` ni `syncRecent` tras avanzar el reloj, y Books y CRM sí; cerrado, los tres; y fichero vigilado de `hub-sync.ts`
(molde `apps/hub-sync/src/hub-sync.guardian.test.ts:17-19`): las líneas de `hubBootstrap(` y `scheduleHubSync(` llevan `modoSinZohoDesk: config.modoSinZohoDesk`
y la de `createZohoClient(`, `registro:` y `avisar:`.

## D-8 · El barrido del repositorio (RQ-ZS-46)
`apps/desk/server/testing/barridoZohoDesk.ts` (arnés, como `superficieSaliente.ts`) y `apps/desk/server/barridoZohoDesk.test.ts`. Puras:
`sinComentarios(texto)` —máquina de estados sobre cadenas `'` `"`, plantillas, literales regex (tras `( , = : [ ! & | ? { } ;` o inicio) y comentarios
`//` y `/* */`; conserva los saltos de línea y no rompe un `https://` dentro de una cadena—, y `barrer(ficheros, permitidos)` → `{ hallazgos, sinUso }`.
`leerArbol(raiz, raices)` lee del disco `apps/desk/server`, `apps/hub-sync`, `packages` y `scripts`: `.ts`, `.tsx`, `.js`, `.mjs`, `.cjs` sin comentarios, y
`.sh` tal cual (ante la duda, rojo); fuera `*.test.ts`, `testing/` (el propio barrido y el `http.request` de prueba de `apps/desk/server/testing/appHarness.ts:136`)
y el `IGNORAR` de `superficieSaliente.ts:52`.

| Señal | Expresión | Sitios permitidos (lista cerrada; medidos con grep en `6417fa9b`) |
|---|---|---|
| transporte HTTP | `\b(fetch\|fetchImpl)\s*\(` | los diez de hoy: `packages/zoho-sync/src/zohoClient.ts` (`:18`), `tokenManager.ts` (`:25`), `books/booksClient.ts` (`:32`, `:45`), `crmHub/crmClient.ts` (`:13`, `:22`), `apps/desk/server/avisosWebhook.ts` (`:80`), `remisionWebhook.ts` (`:83`), `respaldo/dependencias.ts` (`:60`, `:75`), `respaldo/driveApi.ts` (`:36`), `respaldo/driveAuth.ts` (`:28`), `respaldo/multiparte.ts` (`:33`, `:38`, `:43`, `:99`) |
| clientes de `node:http`/`https` y otros | `\bhttps?\.(request\|get)\s*\(`, importación o `require` de `'(node:)?http'`, `'(node:)?https'`, `undici`, `axios`, `node-fetch`, `got` | ninguno (fuera de pruebas y `testing/`, cero) |
| dominio de Desk | `desk\.zoho\.` | `packages/zoho-sync/src/config.ts` (`:83`) |
| base de la API | `/api/v1\b` | `zohoClient.ts` (`:15`) |
| ruta de Desk en `zohoapis` | `/desk/v\d` | ninguno |
| campo de dominio de Desk | `\b(apiDomain\|accountsDomain)\b` (no casa `booksAccountsDomain` ni `crmAccountsDomain`) | `config.ts`, `zohoClient.ts`, `tokenManager.ts` (`:18`) |
| dominio de cuentas | `accounts\.zoho\.` | `config.ts` |
| petición de token | `oauth/v2/token` | `tokenManager.ts`, `books/booksClient.ts` (`:25`), `crmHub/crmClient.ts` (`:11`), por nombre (S-b) |
| cabecera del token | `Zoho-oauthtoken` | `zohoClient.ts`, `books/booksClient.ts` (`:47`), `crmHub/crmClient.ts` (`:22`) |
| variables de Desk | `\bZOHO_(API_DOMAIN\|ACCOUNTS_DOMAIN\|REFRESH_TOKEN\|ORG_ID\|DEPARTMENT_ID\|CLIENT_ID\|CLIENT_SECRET)\b` | `config.ts` |
| lectura del modo | `MODO_SIN_ZOHO_DESK` | `config.ts` (una sola lectura, RQ-ZS-40) |
| instancias | `\bcreateZohoClient\s*\(`, `\bcreateTokenManager\s*\(` | su definición, `apps/desk/server/index.ts` y `apps/hub-sync/src/hub-sync.ts` |
| token | `\bgetAccessToken\s*\(` | `tokenManager.ts`, `zohoClient.ts` |

Toda petición necesita un transporte, así que la señal de transporte ve cualquier verbo, literal, variable o el `GET` implícito, sin depender de
`superficieSaliente.ts:55` ni `:91`; los no-GET los sigue fijando además `apps/desk/server/superficieSaliente.test.ts:44-76`. Un transporte nuevo, sea a
Desk o a otro tercero, tiene que entrar en la lista a propósito. Un `fetch` pasado por valor con otro nombre (`fetchImpl = fetch`) no es una llamada:
lo cubren las señales de destino, porque llegar a Desk exige su dominio, su base, su campo o su token. `sinUso` lista cada pareja permitida sin
coincidencia real y tiene que salir vacía. El número de ficheros recorridos lo mide L6 y sale en el mensaje de la prueba, que exige más de cero. El
código nuevo no escribe `method:` literal ni `{ method,` (`superficieSaliente.ts:55`, `:57`). **Hipótesis H-3:** la heurística de literales regex basta
para el árbol real; si L6 da un falso rojo, se afina la máquina, nunca la lista.

## D-9 · `DEPLOY.md` §24 y las líneas de `.env.example` (RQ-ZS-47)
Al final, tras `DEPLOY.md:1028`: `## 24. \`MODO_SIN_ZOHO_DESK\`: el modo sin Zoho Desk (1G-04, \`decision/adelanto-09-11-empezar-1g\`)`; un párrafo (paso 4
del corte, `docs/sdd/Plan_Independencia_Zoho_Desk_31-12-2026.md:100`; Books, CRM y n8n fuera); `### \`MODO_SIN_ZOHO_DESK\`` con **Qué enciende:**,
**Qué se rompe si se pone mal:** (en un solo servicio el otro sigue llamando y la semana no prueba nada: va en los DOS, la App `ambientalia-desk` y el
worker `hub-sync`, `zoho-hub-sync` en EasyPanel, `DEPLOY.md:31`, `:333`; abierta no se responde por correo; `TRUE`, `1` o vacía la dejan cerrada), **Nace
cerrado** (`=== 'true'`, `config.ts:125`; abrir o cerrar pide redesplegar los dos) y `> MODO_SIN_ZOHO_DESK=false`; `### Cómo leer el registro` (`GET` y log
de la App, log del worker; cortes frente a rechazos; los saltos de fondo no cuentan); `### Pasos` (P-2, P-3). El valor explícito `false` se aparta del
vacío de §21-§23 a propósito: la persona ve la variable en la pestaña Environment de los dos servicios, que es el riesgo de esta.
**Prueba** `apps/desk/server/deployModoSinZoho.test.ts` (molde `deployVerificacionCompletitud.test.ts`): `faltasSeccion24(texto)` devuelve lo que falta
de esta lista: la sección `## 24. ` detrás de la §23 y última; el apartado de la variable con **Qué enciende:** y **Qué se rompe si se pone mal:**,
`**Nace cerrado**`, `` `=== 'true'` `` y `> MODO_SIN_ZOHO_DESK=false`; `ambientalia-desk`, `zoho-hub-sync` y «worker `hub-sync`»; `/api/admin/modo-sin-zoho-desk`;
«log del worker»; `cortes` y `rechazos`; «redesplegar los dos». Sobre el real, `[]`; sobre copias en memoria sin el worker o sin «Qué se rompe», no vacío;
y `config.ts` contiene `env.MODO_SIN_ZOHO_DESK === 'true'`.
**Guarda en sitio** `apps/desk/server/deployVerificacionCompletitud.test.ts` (molde `deployRellenoAdjuntos.test.ts:22`, `:37`): `:20` acota hasta `## 24. `;
`:36` añade `; expect(deploy.indexOf('## 24. ')).toBeGreaterThan(s23)`; `:10` y `:33` dejan de decir «es la última». `:37` (dos `###`) vuelve a ser
cierta con `:20` acotada: no se toca.
**Para el informe (P-1), tal cual:**
```
# 1G-04 · Con true, ninguna petición sale hacia Zoho Desk (ni la del token) y la app sirve sólo lo que hay en PostgreSQL; va en los DOS servicios, App y worker hub-sync (DEPLOY.md §24). Puesta en uno solo el otro sigue llamando a Zoho, y abierta no se puede responder a un cliente por correo desde la app; sólo abre con el literal true.
MODO_SIN_ZOHO_DESK=false
```

## D-10 · Guardas que cuentan el árbol y pruebas que leen como texto los ficheros editados en sitio
- `apps/desk/server/reconciliacion/registro.test.ts:218`, `:220`: ya dicen NUEVE con `1G-04` en `6417fa9b`; ningún lote de apply las toca. Al archivar
  vuelven a OCHO y `1G-04` entra en «cerradas por archivo»: se corrigen en sitio en el intento de archive.
- `apps/desk/server/testing/appHarness.ts:4` (tipo importado), `:46` (campo y cuarto parámetro `registroModo?`), `:49` (`modoSinZohoDesk: false,` antes
  de `...overrides`) y `:52` (`registroModo` a `createApp`), en L3.
- Búsqueda de `readFileSync` en `*.test.ts` sobre los nueve ficheros editados en sitio; todas siguen verdes:
  - `index.ts`: `apps/desk/server/services/avisoRitmoContrato.test.ts:185-195` (importación, UNA línea del `setInterval` con `sync.syncRecent()` y la
    expresión de `:194`), `alarmasSla.test.ts:252-263` (alarmas < ritmo < sincronización por `indexOf`), `avisoProvisionalEnBooks.test.ts:299-310`
    (reclamaciones < provisionales < ritmo < sincronización, distintas) y `avisoReclamacionProveedor.test.ts:251-260` (reclamaciones antes): verdes con la
    `:88` de D-4 y los comentarios sin el texto; `apps/desk/server/opcionesConversaciones.test.ts:23-27` (línea de `createSync({`, `:23`, intacta);
    `apps/desk/server/citas/guardianes.test.ts:50-55`, `:69-73` (el grafo de importaciones no alcanza `citas/` ni `reconciliacion/`: los módulos nuevos no los importan).
  - `app.ts`: `opcionesConversaciones.test.ts:37-48` y `apps/desk/server/completitud/verificacionRutas.test.ts:83-88`: subcadenas de `:22`, `:50` y `:57`, que se amplían sin cambiar.
  - `attachment.ts`: `apps/desk/server/adjuntos/rutaAdjunto.test.ts:8-13` lee la línea de `.test(path)` (`:17`, intacta).
  - `hub-sync.ts`: `hub-sync.guardian.test.ts:15-19` y `apps/hub-sync/src/hubSyncSinConversaciones.test.ts:43-45` (`createSync(`, `:21`, intacta).
  - `config.ts`: los seis `deploy*.test.ts` buscan `env.<VARIABLE> === 'true'` en `:125`; el campo nuevo va antes del comentario y no toca las otras.
  - `tickets.ts`, `admin.ts`, `hubSync.ts` y `zohoClient.ts`: ninguna prueba los lee como texto.
- `superficieSaliente.test.ts:44-76`: cero verbos literales nuevos. Ninguna prueba cuenta las rutas de `app.ts` ni los campos de `AppConfig`.

## D-11 · Regla 13: el cliente no gana ninguna decisión
`apps/desk/src` no cambia (S-n). Decisiones del cliente sobre el modo: **ninguna** —no lo conoce—; ante un `503` enseña el cuerpo crudo que manda el
servidor, `HTTP 503: {…}` (`apps/desk/src/api/client.ts:9`). Lo que decide cada caso vive en el servidor: corte (`zohoClient.ts:29`), `503` (las líneas de
D-5), aperturas (`tickets.ts:132`, `:136`, `:149`, `:169`), adjunto (`attachment.ts:22`), ciclo (`index.ts:88`).

## D-12 · Contabilidad de líneas (regla de mutación 4)
| Fichero | Líneas en sitio | Antes → después |
|---|---|---|
| `packages/zoho-sync/src/config.ts` | `:66`, `:125` | 127 → 127 |
| `packages/zoho-sync/src/zohoClient.ts` | `:2`, `:11`, `:14`, `:29` | 39 → 39 |
| `apps/desk/server/index.ts` | `:15`, `:20`, `:49`, `:61`, `:72`, `:78`, `:88`, `:89`, `:90` | 118 → 118 |
| `apps/desk/server/app.ts` | `:22`, `:31`, `:34`, `:50`, `:52`, `:57`, `:58`, `:79` | 96 → 96 |
| `apps/desk/server/routes/admin.ts` | `:19`, `:37`, `:40`, `:43`, `:53`, `:196`, `:207` | 266 → 266 |
| `apps/desk/server/routes/tickets.ts` | `:13`, `:23`, `:25`, `:132`, `:136`, `:149`, `:169`, `:196`; `servirLocal` al final | 223 → ~231 |
| `apps/desk/server/routes/attachment.ts` | `:4`, `:8`, `:10`, `:22`; `adjuntoSinCopiaEnModo` al final | 36 → ~43 |
| `routes/rellenoConversaciones.ts` · `routes/rellenoAdjuntos.ts` · `routes/verificacionCompletitud.ts` | `:4`, `:34`, `:36` · `:4`, `:41`, `:43` · `:4`, `:36`, `:37` | 49 · 56 · 47, iguales |
| `apps/hub-sync/src/hubSync.ts` | `:11`, `:12`, `:15`, `:21`, `:22`, `:86`, `:87`, `:90` | 131 → 131 |
| `apps/hub-sync/src/hub-sync.ts` | `:4`, `:20`, `:48`, `:49` | 81 → 81 |
| `apps/desk/server/testing/appHarness.ts` | `:4`, `:46`, `:49`, `:52` | 141 → 141 |
| `apps/desk/server/deployVerificacionCompletitud.test.ts` | `:10`, `:20`, `:33`, `:36` | 92 → 92 |
| `DEPLOY.md` · `packages/zoho-sync/src/config.test.ts` | sólo al final | 1028 → ~1062 · 204 → ~214 |

Sin tocar: `tokenManager.ts`, `auth/middleware.ts`, el módulo `apps/desk/server/rellenoConversaciones.ts`, `adjuntos/rellenoAdjuntos.ts`, `sync.ts`, las
cuatro pruebas de servicios de D-10, `apps/desk/src`, `.env.example` y los seis de Supervisión. Nuevos: `modoSinZoho.ts`, `cicloPeriodico.ts`,
`routes/modoSinZohoDesk.ts`, el barrido y nueve pruebas. **Barrido de cierre**, cada cita contra lo que afirma: `index.ts:88`, `:89-90`, y los rangos
`index.ts:85-93` de `openspec/specs/zoho-sync/spec.md:48`, `:264`, `:753` y `docs/sdd/ENTRADA.md:1231`; las seis citas de servicios de D-4;
`zohoClient.ts:29-37`, `:30`, `:33`; `attachment.ts:21-22`, `:24`; `app.ts:57`, `:78-93`; `hubSync.ts:15-20`, `:90-100`; `config.ts:66`, `:125`.

## D-13 · Lotes (strict TDD: el rojo antes de cada línea de producción; ×1,8 con ~50 de `apply-progress.md`)
**Sustituye a §11 de la propuesta:** pasa de 6 a 7 lotes y de unas 1.090 a unas 1.885 líneas, porque cada lote suma ya su `apply-progress.md`, las
aperturas, la respuesta y el adjunto se separan de las rutas de administración para que L3 no pase de 800, y el barrido gana la máquina de comentarios,
la señal de transporte y su árbol sintético. M0 = suite verde. Mutaciones con `perl -i -pe '… if $. == N'` (CRLF) y restauración con `git diff` vacío.

| Lote | Producción y pruebas | Mutaciones y posiciones que se reproducen (rojo esperado) | Est. | ×1,8 |
|---|---|---|---|---|
| L1 | `modoSinZoho.ts`, `zohoClient.ts` (4/4), `config.ts` (2/2); `modoSinZoho.test.ts`, `zohoClientModoSinZoho.test.ts`, final de `config.test.ts` | `config.ts:125` `=== 'true'` → `!== 'false'` (ausente abre); mover el `if` de `:29` al final de `:30` (se pidió token); **quitar el corte de `:29`** (todas las de RQ-ZS-41); en `cortar`, la cuenta tras el `throw` (el corte tragado no suma); `recursoDeRuta` sin `{x}` o sin quitar la query (marcadores); `llamadorDeLaPila` sin recortar (ruta absoluta en las pilas sintéticas); `esCorteModoSinZoho` = `instanceof Error`; `avisar` en cada corte (tres de un origen dan tres líneas) | ~370 | ~665 |
| L2 | `cicloPeriodico.ts`, `index.ts` (9/9); `cicloPeriodico.test.ts`, `modoSinZohoIndice.test.ts` | elegir `ritmoContratos` también cerrado o `ritmoYSincronizacion` abierto (corre o falta `syncRecent`); quitar una evaluación (falta su nombre; en `:88`, `tsc`); poner `sync.syncRecent()` en el comentario de `:89` (las cuatro de servicios); quitar `!config.modoSinZohoDesk` de `:61`, `:72` o `:78`; envolver `:85` en un `if`; un segundo `crearRegistroModoSinZoho` en `:49` (misma instancia) | ~290 | ~520 |
| L3 | `routes/modoSinZohoDesk.ts`, `app.ts` (8/8), `admin.ts` (7/7), los tres de rutas (9/9), `appHarness.ts` (4/4); `modoSinZohoRutas.test.ts`, y `app.ts` en `modoSinZohoIndice.test.ts` | en `verificacionCompletitud.ts:37` y `rellenoConversaciones.ts:36`: la guarda antes de `requireAuth(db)` (sin sesión, `503`), tras el interruptor (`403`) o tras `validarParametros` (`400`); sin `esRecuento`/`esConteoHistoria` (`limite=0` da `503`); vaciar el prefijo de `app.ts:79` (`500`); `rutaPatron` con `originalUrl` (marcadores en `rechazos`); la guarda sin sumar (`rechazos` vacío) | ~350 | ~630 |
| L4 | `tickets.ts` (8/8 + final), `attachment.ts` (4/4 + final); `modoSinZohoAperturas.test.ts` | quitar `if (!modo.activo) ` de `tickets.ts:132` o `:136`, o el añadido de `:149`/`:169` (el espía de `sync` se llama); respuesta: la guarda antes de `guardWrites` (cerrado `ENABLE_WRITES` daría `503`) o antes de `requireArea` (sin área, `503`); quitar el añadido de `attachment.ts:22` (se llama a `zohoFetch`); meter `name` en la línea de log (marcador) | ~230 | ~415 |
| L5 | `hubSync.ts` (8/8), `hub-sync.ts` (4/4); `hubSyncModoSinZoho.test.ts` | quitar el prefijo de `hubSync.ts:90` (se programa Desk), de `:15`, `:21` o `:22` (se llama a Desk); quitar el campo de `hub-sync.ts:48`/`:49` o el `avisar:` de `:20` (fichero vigilado) | ~185 | ~335 |
| L6 | `testing/barridoZohoDesk.ts`; `barridoZohoDesk.test.ts` | **fichero vigilado (regla 2):** árbol sintético en memoria, un fichero por forma —`GET` implícito (`fetch('https://desk.zoho.com/api/v1/tickets')`), `fetchImpl(url)` a secas, dominio de Desk, petición de token, `createZohoClient` nuevo y `http.request` de `node:http`—, cada uno rojo y nombrado; los mismos en comentarios, verde; en el árbol real, añadir al final de `apps/desk/server/measure.ts` `fetch('https://desk.zoho.com/api/v1/tickets')` (rojo) y restaurar; quitar un sitio de la lista (rojo en el real); añadir uno sin señal (`sinUso`) | ~310 | ~560 |
| L7 | `DEPLOY.md` §24, `deployModoSinZoho.test.ts`, `deployVerificacionCompletitud.test.ts` (4/4) | copias en memoria sin el worker o sin «Qué se rompe» (rojo); en el real, borrar con `perl` la línea del worker (rojo) y restaurar | ~150 | ~270 |

Cada lote cierra con `npm run typecheck` y su prueba focal; verify corre `npm test` entero y `npm run lint -- --max-warnings 165`.

## Matriz de amenazas
Las cinco filas, N/A: no hay documentación ejecutable (el barrido lee `.sh` como texto y no ejecuta nada), ni selección de repositorio, commit, push ni
PR. El límite real va en D-1 (fallo cerrado), D-2 y D-3 (sin datos de clientes) y D-5 (posición).

## Riesgos y puntos abiertos
- H-1 (marcos de `tsx`), H-2 (`req.route` en el manejador central) y H-3 (literales regex) se prueban en L1, L3 y L6; ninguna bloquea.
- Abierta, la App sigue sin responder correo y sin recibir lo que entra a Zoho (propuesta §8); n8n queda fuera (S-c). Ninguna causa de parada.
