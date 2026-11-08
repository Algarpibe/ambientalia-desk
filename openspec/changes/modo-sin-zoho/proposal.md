---
tanda: 1G-04
motivo: ""
capacidad: [zoho-sync]
maestro: ["M11.3"]
cierra: si
toca_maestro: si
origen_cabecera: declarada
---

# Propuesta — `modo-sin-zoho`

Construye `decision/adelanto-09-11-empezar-1g` (Gerencia, 02/11/2026; `openspec/config.yaml:5569`), citada por clave. Consecuencia (3)
(`openspec/config.yaml:5586-5588`): 1G-04 espera a 1G-03, ya archivada. Consecuencia (5) (`openspec/config.yaml:5591-5592`): lo que escriba en
producción va tras un interruptor que nace cerrado; este cambio no escribe en producción ni en Zoho y aun así va tras uno (S-f).

*Sobre la cabecera.* `tanda: 1G-04`: es el contenido de su fila, «Modo sin Zoho: interruptor que apaga toda salida hacia Zoho Desk. **Es la
tanda que da la garantía**» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md:26`), con el alcance del plan de independencia: «apaga
toda salida hacia Zoho Desk y hace que la app funcione sólo contra PostgreSQL» (`docs/sdd/Plan_Independencia_Zoho_Desk_31-12-2026.md:72`, nota
en `:74`), y su uso en el paso 4 del corte, «una semana en 1G-04 … con Zoho todavía contratado» (`docs/sdd/Plan_Independencia_Zoho_Desk_31-12-2026.md:100`,
`:103`). `maestro: ["M11.3"]`: la fila `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3458-3459` cae en ese
apartado, que empieza en `:3427`. `cierra: si`: el inventario (§2.1) muestra que TODA salida a Zoho Desk del repositorio, de la App y del
worker, pasa por una sola puerta, y el corte va en ella antes del token; la semana en producción es de persona (P-3, S-o). `toca_maestro: si`:
el punto abierto `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3478` pide «darles una pasada periódica propia
antes de 1G-04» a las alarmas y al ritmo de contratos porque «si esa pasada se retira» dejarían de evaluarse; este cambio NO la retira, sólo salta lo de Desk y prueba que esas evaluaciones siguen corriendo (CA-5),
así que el pasaje queda desactualizado al terminar (§9). R-2 no aplica: `zoho-sync` ya está en `openspec/config.yaml:137`.

## 1 · Intención

La prueba de que Desk funciona sin Zoho Desk. Al terminar, una variable abierta en los dos servicios hace que ninguna petición salga hacia Zoho
Desk —ni la renovación del token—; la aplicación sigue sirviendo lo que tiene en PostgreSQL; lo que sólo Zoho puede dar responde de forma
explícita; las evaluaciones periódicas siguen corriendo; y cada intento cortado queda registrado, por origen, para descubrir durante la semana
del paso 4 «la llamada a Zoho que nadie recordaba»
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3459`). Cerrada, todo queda como hoy.

## 2 · Lo que hay hoy (medido en `e3360dc4`)

**2.1 · Una sola puerta a Zoho Desk.** El único transporte hacia la API es `fetchImpl` en `packages/zoho-sync/src/zohoClient.ts:18`, sobre
`https://${config.apiDomain}/api/v1` (`:15`), dentro de `zohoFetch` (`:29-37`), que pide el token en `:30` y otra vez en `:33` ante un `401`. La
renovación OAuth de Desk es el `POST` de `packages/zoho-sync/src/tokenManager.ts:25`, perezosa (`:39-42`), y `getAccessToken` sólo se llama en
`zohoClient.ts:30` y `:33` (búsqueda de `getAccessToken` fuera de pruebas). `createZohoClient` y `createTokenManager` se instancian sólo en
`apps/desk/server/index.ts:19-20` y `apps/hub-sync/src/hub-sync.ts:19-20`, los dos con el mismo `loadConfig` (`packages/zoho-sync/src/config.ts:75`).
Todo lo demás recibe `zohoFetch` por inyección: cero llamadores que reencauzar.

*Nombres cortos en esta propuesta:* `sync.ts` es `packages/zoho-sync/src/sync.ts`; `tickets.ts`, `admin.ts` y `attachment.ts`, los de
`apps/desk/server/routes/`; `index.ts`, `app.ts`, `measure.ts`, `backfill.ts` y `rellenoConversaciones.ts`, los de `apps/desk/server/`;
`hubSync.ts` y `hub-sync.ts`, los de `apps/hub-sync/src/`; `config.ts`, `packages/zoho-sync/src/config.ts`; `spec.md`,
`openspec/specs/zoho-sync/spec.md`; y `R08.4.md`, `docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md`.

| Llamada a Zoho Desk | Quién la dispara | Hoy, si Zoho falla |
|---|---|---|
| tickets y archivados, `packages/zoho-sync/src/sync.ts:140`, `:162` | arranque de la App (`apps/desk/server/index.ts:61-70`) y del worker (`apps/hub-sync/src/hubSync.ts:15-20`); `POST /api/admin/backfill-archived` (`apps/desk/server/routes/admin.ts:207-212`) | lanza |
| búsqueda, detalle y página reciente, `sync.ts:396`, `:415`, `:174` | `syncRecent`, temporizador de la App (`index.ts:88`) y del worker (`hubSync.ts:93`) | la búsqueda cae a la página reciente (`sync.ts:399`, `:405-406`) |
| detalle, `sync.ts:179` | aperturas (`apps/desk/server/routes/tickets.ts:132`, `:136`), `apps/desk/server/rellenoConversaciones.ts:100`, `apps/desk/server/backfill.ts:46` | `warn` en las aperturas |
| cuenta y contacto por id, `sync.ts:90`, `:100` | dentro de `persistTicket` y `syncContacts` | se traga (`sync.ts:92`, `:107`) |
| conversaciones, `packages/zoho-sync/src/conversaciones.ts:77` | `syncConversations` (`sync.ts:187`): aperturas (`tickets.ts:157`, `:162`), tras responder (`:217`), `backfill.ts:47`, pasada periódica | error aparte (`conversaciones.ts:90-91`) |
| historia, `sync.ts:76` | aperturas (`tickets.ts:177`, `:182`), `POST /api/admin/backfill-history` (`admin.ts:196-204`), historia pendiente del worker (`hubSync.ts:96`) | lanza |
| actividades y contactos, `sync.ts:250`, `:272` | arranque (`index.ts:72-82`; `hubSync.ts:21-22`) y temporizadores (`index.ts:89-90`; `hubSync.ts:97`) | lanza |
| `mailReplyAddress` y `sendReply` (`POST`, la única escritura), `tickets.ts:199`, `:203-210` | `POST /api/tickets/:id/reply`, tras `guardWrites` (`tickets.ts:27-33`, `:196`; `config.ts:84`) | `!ok` ⇒ estado de Zoho (`tickets.ts:211`) |
| contenido del adjunto, `apps/desk/server/routes/attachment.ts:24` | `GET /api/attachment` sin copia válida (`attachment.ts:21-22`) | lanza ⇒ 500 genérico (`apps/desk/server/app.ts:90-92`) |
| contenido del adjunto, `apps/desk/server/adjuntos/almacen.ts:81` | relleno de adjuntos (`apps/desk/server/adjuntos/rellenoAdjuntos.ts:91`) y guardado tras sincronizar (`apps/desk/server/adjuntos/guardadoAlSincronizar.ts:56`) | se traga como `red` (`almacen.ts:85-86`) |
| tickets y conversaciones, `apps/desk/server/measure.ts:38`, `:45-46` | `GET /api/admin/measure-attachments` (`admin.ts:43-49`) | al estado (`measure.ts:63-64`) |
| tickets, `backfill.ts:39` | `GET /api/admin/backfill-details` (`admin.ts:53-58`) | — |
| detalle y páginas, `rellenoConversaciones.ts:67` | relleno de conversaciones (1G-01) | — |
| todas las lecturas de 1G-03, `apps/desk/server/completitud/soloLectura.ts:37` | verificación de completitud | — |

**2.2 · Lo que sale y NO es Zoho Desk.** Books: token y transporte propios (`packages/zoho-sync/src/books/booksClient.ts:32`, `:45`); CRM, igual
(`packages/zoho-sync/src/crmHub/crmClient.ts:13`, `:22`); los dos sólo en el worker (`hub-sync.ts:24-35`; `apps/hub-sync/src/backfill-items.ts:32`).
Comparten por defecto `clientId`, secreto y dominio de cuentas con Desk (`config.ts:98-108`). n8n: `apps/desk/server/avisosWebhook.ts:80`,
`apps/desk/server/remisionWebhook.ts:83`, `apps/desk/server/respaldo/dependencias.ts:60`. Copias: Drive y almacenamiento de objetos
(`apps/desk/server/respaldo/driveAuth.ts:28`, `apps/desk/server/respaldo/driveApi.ts:36`, `dependencias.ts:75`, `apps/desk/server/respaldo/multiparte.ts:33`).
El navegador no llama a URL absolutas: lo fija la prueba de `apps/desk/server/superficieSaliente.test.ts:91-105`.

**2.3 · La cadena del temporizador de la App** (`index.ts:88`): alarmas → reclamaciones → facturación vencida → salidas de esperas →
provisionales en Books → ritmo de contratos → `sync.syncRecent()`, y después actividades y contactos (`:89-90`). Las seis evaluaciones van
ANTES de la sincronización y ninguna lanza (`apps/desk/server/services/alarmasSla.ts:140-147`; las otras cinco envuelven su trabajo en
`try`, p. ej. `apps/desk/server/services/avisoSalidasEsperas.ts:81-85`). El worker tiene un temporizador por origen: Desk en
`hubSync.ts:90-100`, Books en `:101-105`, CRM en `:106-115`.

**2.4 · El barrido que hay no basta.** `apps/desk/server/testing/superficieSaliente.ts` sólo ve verbos literales (`:55`) y salta los `GET`
(`:91`); lee el texto entero, comentarios incluidos (`:84`); no recorre `scripts/` (`:46`); excluye `testing/` y las pruebas (`:52`, `:206`).
Una llamada nueva a Desk con `GET` implícito no aparece en ninguna de sus listas.

**2.5 · No hay staging** (`decision/e013-staging-f0-04`, `openspec/config.yaml:1521-1532`), aunque el plan dice «Se prueba en staging antes del
corte» (`Plan_Independencia_Zoho_Desk_31-12-2026.md:72`). Se anota la contradicción, no se resuelve (§9).

## 3 · Alcance y enfoque

**Dentro.**
1. **Inventario**: §2.1 es la foto en `e3360dc4`; el inventario vivo es la lista cerrada del barrido (punto 5), que no deja que se desfase.
2. **Un único punto de corte** en `zohoFetch`, ANTES de `getAccessToken` (`zohoClient.ts:30`): abierto, ninguna petición sale, tampoco la del
   token ni la del `401`; falla cerrado para cualquier llamada nueva que use `zohoFetch`. Lanza un error tipado y cuenta ANTES de lanzar (S-h).
3. **Registro de cortes** por origen, y de los rechazos del punto 4 por ruta (S-j): cuenta, primera y última hora; sin ids, query ni cuerpos (S-i). En la App, un `GET` de superadministrador
   (molde `apps/desk/server/routes/verificacionCompletitud.ts:44-46`, que nunca lanza); en el worker, que no tiene HTTP, una línea de log por
   origen nuevo (S-e).
4. **Lo que depende de Desk falla de forma explícita**, con la app sirviendo PostgreSQL: el adjunto sin copia responde claro sin caer a Zoho
   (S-l); el temporizador sigue, las seis evaluaciones corren y la parte de Desk no (S-p); el arranque no lanza backfills ni sincronizaciones
   iniciales de Desk; las aperturas sirven lo local sin llamar a `sync`; respuesta, `measure-attachments`, `backfill-details`, `backfill-history`,
   `backfill-archived`, los dos rellenos y la verificación responden que la app está en modo sin Zoho Desk, con los recuentos `limite=0`, que no
   llaman a Zoho, libres (S-k); el manejador central (`app.ts:78-93`) da la misma respuesta si el error tipado escapa de cualquier ruta; el
   worker salta lo de Desk y sigue con Books y CRM.
5. **Barrido del repositorio** (`apps/desk/server`, `apps/hub-sync`, `packages`, `scripts`), molde `superficieSaliente.ts` sin sus límites:
   quita comentarios, ve `GET` implícitos, `fetch`/`fetchImpl`, dominios y rutas de Desk, el token y toda instancia de `createZohoClient` y
   `createTokenManager`; cada señal sólo vale en su sitio de una lista cerrada. Se pone rojo con una llamada a Desk que no pasa por la puerta.
6. **Interruptor** `MODO_SIN_ZOHO_DESK` (S-f), nace cerrado (`=== 'true'`), en `config.ts:66` y `config.ts:125`, en sitio. **`DEPLOY.md` §24**
   al final, con «Qué enciende», «Qué se rompe si se pone mal» y que va en los DOS servicios (`DEPLOY.md:22`, `:186`). `.env.example` no se
   edita: sus líneas van redactadas en el informe (P-1).

**Spec:** ADDED al final de `zoho-sync`, desde RQ-ZS-40 (el último vivo es RQ-ZS-39, `openspec/specs/zoho-sync/spec.md:2268`); ningún MODIFIED (S-m).

**Límites.** No se borra ni se desactiva código de sincronización: sólo lo corta el interruptor, y cerrarlo lo devuelve todo. Ninguna escritura en
Zoho ni en tablas de negocio. Ni registro, ni `GET`, ni log, ni informe llevan datos de clientes ni secretos.

**Fuera.** Books y CRM (S-b); los flujos de n8n (S-c); quitar las credenciales de Desk (S-g); mover las evaluaciones a otro temporizador (S-p);
avisos en pantalla y `apps/desk/src` (S-n); persistir el registro (S-e); el correo propio (1H); la semana en producción (P-3); en la rama,
`.env.example` y los seis de Supervisión (`CLAUDE.md`, `openspec/config.yaml`, `docs/sdd/ENTRADA.md`, los dos `F0-05_*` y
`docs/sdd/R08.4_Expediente_de_cambios.md`).

**Qué cubre de la fila, en una línea:** el interruptor que corta toda salida a Zoho Desk del repositorio, con registro y barrido; deja fuera la
semana en producción (P-3), n8n (S-c) y la baja de credenciales (S-g).

## 4 · Capacidades

**Nuevas:** ninguna. **Modificadas:** `zoho-sync`, modo sin Zoho Desk (RQ-ZS-40 en adelante, ADDED al final).

## 5 · Supuestos

S-a a S-g los fija el encargo; S-h a S-p, esta propuesta. Todos reversibles.

| Id | Supuesto | Cómo se deshace |
|---|---|---|
| S-a | No hay staging (`openspec/config.yaml:1521-1532`): la tanda se prueba con pruebas automáticas; la semana en producción es de persona con decisión de Gerencia (P-3) | — |
| S-b | Books y CRM quedan fuera del corte: la fila habla de Zoho Desk y tienen cliente y token propios (§2.2) | Ampliar con una decisión |
| S-c | Los flujos de n8n (`Remisiones`, `_Desk`) están fuera del repositorio; sólo hay llamadas de la App a n8n (`avisosWebhook.ts:80`, `remisionWebhook.ts:83`). **Hipótesis:** si n8n llama a Zoho Desk, el interruptor no lo corta. Va como nota | — |
| S-d | El código HTTP y el mensaje de cada función en modo sin Zoho son criterio de la tanda (S-k, S-l) | Cambiar la respuesta |
| S-e | Registro en memoria, por proceso, como el informe de 1G-03: sin tabla ni `ALTER`. El `GET` enseña los cortes de la App; los del worker van a su log. Un reinicio lo vacía; el log conserva la primera aparición de cada origen | Persistirlo, con tabla y migración |
| S-f | Nombre `MODO_SIN_ZOHO_DESK` (campo `modoSinZohoDesk`); ruta `GET /api/admin/modo-sin-zoho-desk`. Se lee al arrancar: abrir o cerrar pide redesplegar los dos servicios | Renombrar |
| S-g | `loadConfig` sigue exigiendo las credenciales de Desk (`config.ts:77-81`); quitarlas es del paso 5 del corte (`Plan_Independencia_Zoho_Desk_31-12-2026.md:101`). Nota para Supervisión | — |
| S-h | El corte lanza un error tipado de mensaje fijo, sin ruta, ids ni query: `e.message` acaba en logs y estados (`sync.ts:399`, `:405`, `:238`; `measure.ts:64`; `conversaciones.ts:91`). Una `Response` sintética se confundiría con «Zoho caído». Cuenta ANTES de lanzar, porque hay quien se traga el error (`sync.ts:92`, `:107`; `almacen.ts:85-86`; molde `soloLectura.ts:6`). La forma la fija el diseño | Otra forma de corte |
| S-i | El origen es el recurso de Zoho reducido a un conjunto cerrado de segmentos (molde `apps/desk/server/completitud/lectores.ts:19-21`) más quién llamó; requisito: un llamador que nadie etiquetó aparece igual, con su recurso. **Hipótesis:** el diseño puede tomar al llamador de la pila o de un contexto | Cambiar el origen |
| S-j | Lo que se salta a propósito en segundo plano (temporizadores, arranque, aperturas) no es un intento y no entra en el registro. Lo que una persona pide y recibe el `503` del punto 4 (respuesta, adjunto sin copia, rutas de administración) SÍ entra, como **rechazo** por ruta, separado de los **cortes** de la puerta: el registro de la semana del paso 4 enseña lo que nadie recordaba y lo que alguien necesitó y no tuvo, sin el ruido de fondo (ajuste del orquestador sobre la primera redacción) | Contar también los saltos, o no contar los rechazos |
| S-k | Respuesta `503` con un mensaje que nombra el modo sin Zoho Desk, igual en todas las rutas. Va tras la sesión y el rol, antes del interruptor propio y de validar; no se reordenan las guardas que ya existen; cada posición la fija una prueba (regla de mutación 1) | Otro código o posición |
| S-l | El adjunto sin copia válida responde `503`, «no está en el almacenamiento propio y la app está en modo sin Zoho Desk», y deja su línea de log con ese motivo y sin nombre de fichero (molde RQ-ZS-31, `spec.md:1982-1984`) | — |
| S-m | Spec: ADDED desde RQ-ZS-40; el requisito nuevo declara que, abierto el interruptor, prevalece sobre todo requisito de `zoho-sync` que mande llamar a Zoho Desk —el más visible, «SHALL caer a Zoho como hoy», `spec.md:1982`— | MODIFIED de RQ-ZS-31 |
| S-n | Ningún aviso en pantalla; `apps/desk/src` no se toca: el mensaje es del servidor y el cliente ya enseña el texto del error (`apps/desk/src/api/client.ts:9`). Regla 13: el cliente no decide nada nuevo | Una tanda de interfaz |
| S-o | `cierra: si`: el corte cubre toda salida a Zoho Desk del repositorio (§2.1); la semana en producción es de persona (CLAUDE.md, «Regla del ciclo 1»), como S-n de 1G-03. Si Supervisión entiende que la fila exige la semana o n8n, pasa a `no` antes de archivar | Cambiar la cabecera |
| S-p | Las evaluaciones siguen en el MISMO temporizador; la cadena de `index.ts:88` pasa a una unidad que se puede probar, en el mismo orden, y la línea `:88` se queda en sitio llamándola: la citan `alarmasSla.ts:140`, `apps/desk/server/services/avisoRitmoContrato.ts:64` y `apps/desk/server/services/avisoProvisionalEnBooks.ts:102` | Pasada propia, si Gerencia la pide |

**Ronda de preguntas:** no se hace. El preflight es `auto` (`openspec/config.yaml:26`) y ninguna duda da causa de parada de la «Regla de
ejecución»: no cambia el alcance, no cuesta dinero, no toca datos de producción y nace cerrado. Las que habría hecho —si basta con probar que las
evaluaciones corren o se quiere una pasada propia (S-p), si la app debe avisar en pantalla (S-n) y qué ve el usuario ante lo que sólo tiene Zoho
(S-k, S-l)— van a la lista semanal de supuestos (`decision/preguntas-de-detalle-sin-llegar`).

## 6 · Criterios de aceptación

- **CA-1** Abierto: `zohoFetch` lanza el error tipado y ni el transporte ni `getAccessToken` se llaman, tampoco tras un `401`. Cerrado (`TRUE`,
  `1`, vacío o ausente): lo de hoy, con `packages/zoho-sync/src/zohoClient.test.ts` intacto.
- **CA-2** El error tipado se distingue de un fallo de red y de un `!res.ok`; su mensaje no lleva ruta, ids ni query.
- **CA-3** Cada intento suma a su origen (cuenta, primera, última); también los que el llamador se traga; un llamador sin etiqueta aparece; cada
  `503` del punto 4 suma a su ruta como rechazo, aparte de los cortes; los saltos de fondo no suman; ningún origen ni ruta lleva id, query ni cuerpo (fixtures con marcadores).
- **CA-4** `GET` de superadministrador (`apps/desk/server/auth/middleware.ts:17`, `:27`): sin sesión `401`, sin rol `403`; cerrado, `activo: false` y lista vacía; nunca lanza.
- **CA-5** Ciclo de la App abierto: las seis evaluaciones corren en su orden y `zohoFetch` no se llama; el temporizador sigue. Cerrado: la cadena de hoy.
- **CA-6** Arranque abierto, App y worker: ningún backfill ni sincronización inicial de Desk; migración y resiembra, sí.
- **CA-7** Worker abierto: la pasada de Desk no se programa; Books y CRM, como hoy; una línea de log por origen nuevo.
- **CA-8** Aperturas abiertas: detalle, conversaciones e historia sirven lo local sin llamar a `sync`; sin datos locales, `404`.
- **CA-9** Respuesta, medida, backfills, rellenos y verificación: `503` que nombra el modo, sin Zoho; los `limite=0` siguen; posición probada.
- **CA-10** Adjunto: la copia válida se sirve igual; sin ella, `503` claro, sin Zoho, con su línea de log.
- **CA-11** El error tipado que escape de cualquier ruta da `503`, no `500`.
- **CA-12** Barrido: rojo sobre un árbol sintético con una llamada a Desk fuera de la puerta (`GET` implícito, `fetchImpl`, dominio, token o
  instancia nueva); verde con lo mismo en un comentario; verde sobre el repositorio real.
- **CA-13** `DEPLOY.md` §24 y su prueba; guardas del árbol en sitio (§8); `npm test`, typecheck y `npm run lint -- --max-warnings 165`.

## 7 · Tareas de persona (no son tareas de esta tanda; archivar no las da por hechas)

| Id | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Añadir a `.env.example` las líneas de la variable, redactadas en el informe de cierre | Alfonso | informe de cierre |
| P-2 | Desplegar con el interruptor cerrado, que no cambia nada visible, poniendo la variable en los DOS servicios, App y worker `hub-sync` | Alfonso | `DEPLOY.md` §24 |
| P-3 | La semana en modo sin Zoho (paso 4 del corte, `Plan_Independencia_Zoho_Desk_31-12-2026.md:100`), con decisión de Gerencia: abrir en los dos, leer el `GET` y el log del worker, cerrar | Alfonso; decide Gerencia | `DEPLOY.md` §24 |

## 8 · Riesgos

- **Guardas que se rompen por construcción, y una ya está roja.** `apps/desk/server/reconciliacion/registro.test.ts:218` y `:220`: con este
  fichero fuera de `archive/`, «en curso» pasa de OCHO a NUEVE, con `1G-04` el primero (`ordenar` es `.sort()`,
  `apps/desk/server/reconciliacion/comprobaciones.ts:59`, `:222-224`). **La suite está roja desde esta fase** hasta el lote que lo corrige:
  `tasks.md` lo pone el primero. Al archivar se rompe otra vez (sale de «en curso», entra en «cerradas por archivo»). La §24 rompe
  `apps/desk/server/deployVerificacionCompletitud.test.ts:20` (`slice(s23)` hasta el final), `:36` (un solo `## `) y `:37` (dos `### `).
- **Ficheros muy citados** (regla de mutación 4): `routes/tickets.ts`, `index.ts:88`, `config.ts:66` y `:125`, `app.ts:57` y `:78-93`,
  `attachment.ts:17` y `:24` (los citan RQ-ZS-31 y `almacen.ts:15`), `zohoClient.ts`. Se edita en la misma línea o al final, y se barre al cerrar.
- **El barrido viejo**: el código nuevo no escribe `method:` literal (molde `soloLectura.ts:7`), o `superficieSaliente.ts` lo clasificaría.
- **Respuestas y correo entrante en la semana.** Abierto, la respuesta por Zoho da `503`, y hoy el correo con el cliente sale por Zoho Desk
  (`R08.4.md:3431`); lo que entre por correo a Zoho tampoco llega. El plan pone el paso 3, el correo a Gmail (`docs/sdd/Plan_Independencia_Zoho_Desk_31-12-2026.md:99`), antes del 4.
- **Un solo servicio con la variable**: el otro sigue llamando a Zoho y la semana no prueba nada. Lo dice la §24.
- **El tráfico a `accounts.zoho.com` sigue** por Books y CRM (`booksClient.ts:32`, `crmClient.ts:13`): la prueba es el registro, no una traza de red.
- **n8n** (S-c) y el **registro en memoria** (S-e). **Presupuesto:** ningún lote pasa de 800 (§11).

## 9 · Notas para Supervisión (lo que sólo Supervisión escribe en los seis ficheros)

- **Maestro, al expediente R08.x:** `R08.4.md:3478`, el nº 73 del Anexo D (`:5575-5579`, «Plazo: antes del modo sin Zoho (1G-04)»), `:1879`
  (M1.7), `:2659` (M4.4) y `:6576` parten de que la pasada se retira; al terminar, sigue y sólo salta Desk, con CA-5. Si eso cierra el nº 73 o
  Gerencia quiere además una pasada propia (S-p), lo decide Supervisión.
- **`R08.4.md:4084-4088`, «Sin empezar»:** cierto de su fecha, como lo dio 1G-03 (`openspec/changes/archive/2026-11-07-verificacion-completitud/proposal.md:25-26`).
  `:3459`, «apaga toda llamada a Zoho Desk»: cierto del repositorio; n8n queda fuera (S-c).
- **Plan:** «Se prueba en staging» (`docs/sdd/Plan_Independencia_Zoho_Desk_31-12-2026.md:72`) contradice `decision/e013-staging-f0-04` (S-a).
- **Credenciales** (S-g): quitarlas es del paso 5. **Orden del corte** (§8): el paso 4 presupone el 3.

## 10 · Vuelta atrás

Cerrar el interruptor (vacío o distinto de `true`) en los dos servicios y redesplegar devuelve el comportamiento de hoy: no se borra ni se
desactiva código. Revertir el commit retira puerta, registro, `GET`, barrido y §24. No hay datos de negocio que restaurar: el cambio no escribe.

## 11 · Método y cierre

Worktree propio desde `e3360dc4`; `strict_tdd` con rojo previo; vitest, pg-mem y supertest con `fetchImpl` y `tokenManager` falsos.
**Mutaciones:** `!== 'false'`; el corte después de `getAccessToken`; contar después de lanzar; un id o una query en el origen; quitar el salto del
temporizador; quitar una evaluación. **Posición:** sesión y rol antes del corte; las evaluaciones antes del salto de Desk. **Fichero vigilado:**
el barrido corre sobre un árbol sintético ensuciado (regla de mutación 2). Regla 13: el cliente no decide nada nuevo. Barrido de citas al
cerrar; cada intento ≤ 800 con `git diff --shortstat --no-renames` más `wc -l` de lo no trackeado.

| Lote | Contenido | Estimado | ×1,8 |
|---|---|---|---|
| L1 | guardas del árbol (`registro.test.ts:218`, `:220`, en sitio); `config.ts:66` y `:125`; puerta, error y registro; pruebas | 190 | 342 |
| L2 | App: ciclo periódico (`index.ts:88` en sitio) y arranque; pruebas de las seis evaluaciones | 170 | 306 |
| L3 | App: aperturas, respuesta, adjunto, rutas de administración, manejador central y `GET`; pruebas con posición | 330 | 594 |
| L4 | worker: arranque y temporizadores; pruebas | 120 | 216 |
| L5 | barrido del repositorio, árbol sintético y real | 170 | 306 |
| L6 | `DEPLOY.md` §24, su prueba y `deployVerificacionCompletitud.test.ts:20`, `:36`, `:37` | 110 | 198 |
| | **Código y pruebas** | **1.090** | **1.962** |

Aparte, los artefactos: spec ≈150, diseño ≈150, tareas ≈120, `verify-report.md` ≈350 (sumando obligatorio) y `archive-report.md` ≈200 más la mudanza.
