---
tanda: 1G-01
motivo: ""
capacidad: [zoho-sync, trazas]
maestro: []
cierra: no
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta — `sync-conversaciones-zoho`

Construye `decision/adelanto-1g01-sincronizacion-conversaciones` (Gerencia, 29/10/2026; `openspec/config.yaml` →
`decisiones_de_gerencia_adenda`). Se cita por clave: hoy sólo vive en la copia de trabajo de `main`, sin commitear.

*Sobre la cabecera.* `tanda: 1G-01`: es contenido de su fila, «Backfill completo de conversaciones … con verificación contra
`commentCount` y `threadCount`» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md:23`;
`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.4.md:130`), consecuencia (2) de la decisión. `cierra: no`: el relleno
verificado de los 986 tickets sigue en enero; esto adelanta el mecanismo. `maestro: []` y `toca_maestro: no`: la decisión
declara `maestro_pasaje: "ninguno"`. La excepción al plazo de «ninguna tanda nueva antes del 09/11» es la consecuencia (1).

## 1 · Intención

Que el hilo de un ticket de Zoho esté al día **sin que nadie lo abra**, que no se corte en las cien primeras conversaciones, y
que lo que Zoho ya no tiene **deje de mostrarse** sin borrarse. Al terminar: con dos interruptores que nacen cerrados, la App
trae en cada ciclo las conversaciones de los tickets que Zoho dio por modificados, pagina hasta el final, y marca —nunca borra—
las filas de Zoho que una lista **completa** del ticket ya no devuelve.

## 2 · Lo que hay hoy (medido en `b4255928`)

- **La pasada periódica no pide conversaciones.** La App llama a `sync.syncRecent()` en su bucle (`apps/desk/server/index.ts:85-93`,
  `:88`); `syncRecent` (`packages/zoho-sync/src/sync.ts:173-177`) delega en `sincronizarModificados` (`:377-434`), que relee cada
  ticket modificado por detalle (`:412-432`) y sólo persiste su fila (`persistTicket`, `:112-123`).
- **Sólo se piden al abrir el ticket**, en segundo plano si ya hay datos (`apps/desk/server/routes/tickets.ts:161-162`) o en primer
  plano si no hay (`:157`), según `planSyncZoho` (`apps/desk/server/db/ticketFuentes.ts:44-47`); y tras responder un correo
  (`apps/desk/server/routes/tickets.ts:217`). En el #958 (evidencia del analista, 29/10): cuatro comentarios del 01/10 al 06/10
  guardados el 29/10 a las 20:19 UTC, al recargar el ticket.
- **Sin paginar.** `syncConversations` hace UNA petición sin `from` ni `limit` (`packages/zoho-sync/src/sync.ts:183-191`). Zoho fija
  para `/api/v1/tickets/{ticket_id}/conversations` un `limit` de **1 a 200, con 100 por omisión** (anuncio de Zoho Desk,
  <https://help.zoho.com/portal/en/community/topic/introducing-limit-ranges-for-list-comments-conversations-apis>, leído el 29/10):
  un ticket con más de 100 conversaciones queda cortado hoy, sin aviso. Que `from` empiece en **0** es **hipótesis**: el anuncio no
  lo dice; lo declara así (mínimo 0, por omisión 0) el esquema del conector de Zoho Desk que publica Zoho (`getTicketConversations`).
- **Nada refleja lo borrado.** `upsertConversation` sólo inserta o actualiza (`packages/zoho-sync/src/db/repo.ts:97-106`) y no hay
  ningún `DELETE FROM conversations` en el código. El lector del hilo es `getConversations` (`repo.ts:218-227`), que devuelve todas
  las filas del ticket (`:219`) y les cuelga sus adjuntos (`:220-226`); su único consumidor es el compositor del hilo
  (`apps/desk/server/db/conversacion.ts:133`). En el #958, `desk.conversations` guarda 5 comentarios y el hilo `495552000057899091`
  (WEB, 11/06), y el ticket en Zoho cuenta `commentCount` 5 y `threadCount` 0: ese hilo ya no está en Zoho y Desk lo enseña.
- **Un comentario nuevo mueve el `modifiedTime` del ticket** (conclusión 1 del analista sobre el #958: último comentario
  `2026-10-06 18:40:33+00`, `modified_time` `2026-10-06 18:40:34+00`). Basta como criterio de «qué ticket pedir».
- **Quién escribe.** `desk.conversations` no es tabla replicada (`DEPLOY.md:38-42`); la escribe la App. El worker construye su
  propio `createSync` sin opciones (`apps/hub-sync/src/hub-sync.ts:21`) y también llama a `syncRecent` (`apps/hub-sync/src/hubSync.ts:93`),
  así que **cualquier interruptor leído de `config` dentro de `sync.ts` lo encendería también en el worker**. El molde para lo que
  sólo hace la App es la dependencia opcional que sólo cablea `index.ts` (`alDiscrepanciaOV`, `apps/desk/server/index.ts:23`,
  `packages/zoho-sync/src/sync.ts:120-122`).
- **Zoho y el 429.** `zohoFetch` no reintenta ante un 429 (`packages/zoho-sync/src/sync.ts:36`); el relleno de detalle espera 2 s y
  repite (`apps/desk/server/backfill.ts:40`) y pausa 150 ms entre tickets (`:29`); la pasada de modificados corta el ciclo
  (`packages/zoho-sync/src/sync.ts:418`).
- **El relleno ya existe.** `GET /api/admin/backfill-details`, sólo superadministrador (`apps/desk/server/routes/admin.ts:53-58`),
  recorre todos los tickets y por cada uno llama `syncTicket` y `syncConversations` (`apps/desk/server/backfill.ts:46-47`).
- `sync.ts` y `repo.ts` están citados por número en casi toda su longitud (barrido del 29/10: 33 líneas o rangos distintos de
  `sync.ts` y más de 90 de `repo.ts`), así que **ninguna línea de los dos puede moverse**.

## 3 · Alcance y enfoque

**Dentro.**
1. **B · Paginación** (sin interruptor, S-9): un módulo nuevo `packages/zoho-sync/src/conversaciones.ts` trae la lista entera por
   `from`/`limit` hasta una página corta, con tope de páginas. `syncConversations` lo usa, editada en sitio sin cambiar su número
   de líneas. Lo recibido se guarda aunque una página falle (S-10); el fallo se sigue propagando como hoy.
2. **C · Reflejo de lo ausente** (interruptor propio): columna aditiva `conversations.ausente_en_zoho_at` (S-2). Con lista
   **completa** —paginación terminada sin error **y** ids únicos recibidos = `commentCount` + `threadCount` (S-3, S-4)—, las filas
   `source = 'zoho'` del ticket que no vinieron se marcan (S-12, S-15); si no coincide, no se marca nada y se registra en el log.
   Una fila que Zoho vuelve a devolver se desmarca en `upsertConversation` (S-11). El hilo deja de mostrar las marcadas y sus
   adjuntos (S-13).
3. **A · Pasada periódica** (interruptor propio, sólo en la App): tras leer los modificados del ciclo, la App trae las
   conversaciones de esos tickets, con los recuentos del detalle recién leído, pausa entre tickets (S-6), 429 como el relleno (S-5)
   y sin repetir un `modifiedTime` ya traído (S-7). Va por una dependencia opcional de `createSync` que sólo pasa `index.ts`; el
   worker no la pasa (S-1b).
4. **D · Despliegue**: los dos interruptores en `DEPLOY.md` con sus dos frases, y el paso de persona del relleno (P-2, P-3). El
   relleno no necesita código nuevo (S-14).
5. Specs: ADDED al **final** de `zoho-sync` (RQ-ZS-25 a RQ-ZS-27) y de `trazas` (RQ-TZ-25); ningún bloque MODIFIED.

**Fuera** (consecuencia (3) de la decisión y encargo, apartado E): escribir en Zoho; persistir adjuntos (1G-02); cambiar el worker
o la replicación; la papelera del administrador (`debt.md:446-468`, que es otra cosa: una ocultación decidida por una persona);
el proxy `/api/attachment`; `openspec/config.yaml`, `docs/sdd/ENTRADA.md` y `.env.example` en la rama.
**Qué cubre de la fila, en una línea:** el mecanismo (pasada periódica, paginación, verificación contra `commentCount` y
`threadCount`) y el paso de persona para lanzarlo; queda fuera el relleno verificado de los 986 tickets, que sigue en enero.

## 4 · Capacidades

**Nuevas:** ninguna. **Modificadas:** `zoho-sync` — la pasada periódica de conversaciones, la paginación y el reflejo de lo
ausente (RQ-ZS-25 a RQ-ZS-27); `trazas` — el relato de conversaciones no enseña lo que Zoho ya no tiene (RQ-TZ-25).

## 5 · Supuestos reversibles

| Id | Supuesto | Por qué es razonable |
|---|---|---|
| S-1 | Interruptores `SYNC_CONVERSACIONES_PERIODICA` (pasada periódica) y `MARCAR_CONVERSACIONES_AUSENTES` (marcado), los dos `=== 'true'`, al final de la última línea de `AppConfig` y de `loadConfig` (`packages/zoho-sync/src/config.ts:66`, `:125`), como los de F1C | Molde de los interruptores vigentes; no desplaza citas |
| S-1b | El cableado va como dependencia opcional `conversaciones` de `createSync`, que **sólo** pasa `apps/desk/server/index.ts:23`. `sync.ts` **nunca** lee esos dos campos de `config` | El worker comparte `loadConfig` y `syncRecent`; leerlos de `config` lo encendería allí |
| S-2 | `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ausente_en_zoho_at timestamptz;` al final de `schema.sql`, **sin calificar**: `conversations` es de `DESK_TABLES` y el guardián lo exige así (`packages/zoho-sync/src/db/migrate.test.ts:314-316`). Nula = presente | Columna aditiva, sin relleno; el worker la crea también en el hub y no la usa |
| S-3 | Se cuentan **ids únicos** recibidos. `commentCount` o `threadCount` ausentes o no numéricos ⇒ la lista no se da por completa (nunca valen 0 por omisión) | Un duplicado entre páginas suele venir con un hueco; un recuento ausente no es «cero» |
| S-4 | Recuentos: la pasada periódica usa el detalle que acaba de leer; `syncConversations` (apertura, relleno, tras responder) usa `tickets.raw`. En los tickets `managed_by_app`, `upsertTicket` no refresca `raw` (`packages/zoho-sync/src/db/repo.ts:71`): ahí el relleno y la apertura no marcarán (cotejo distinto, al log) y la pasada periódica sí | Evita una petición más por ticket en la apertura; el fallo es por defecto, no por exceso |
| S-5 | 429 en la pasada periódica: pausa de 2.000 ms y repetir la misma página, como `backfill.ts:40`, con **3 reintentos** por página; agotados, se corta la pasada del ciclo y se registran los tickets que quedaron sin traer. `syncConversations` no reintenta (la vía «ahora» espera la respuesta, `tickets.ts:157`) | `backfill.ts` no tiene tope, pero un ciclo bloqueado bloquea los siguientes (`index.ts:86`) |
| S-6 | Pausa de 150 ms entre tickets en la pasada, la de `backfill.ts:29` | Mismo freno que el relleno ya usado contra Zoho |
| S-7 | Memoria **de proceso**: un ticket cuyo `modifiedTime` ya se trajo con lista guardada en este proceso no se vuelve a pedir. Un redespliegue la vacía: una petición de más, nada peor | El solape de 15 minutos (`sync.ts:368`) vuelve a encontrar los mismos tickets ciclo tras ciclo |
| S-8 | Si el ciclo cae a la página 1 por `-recentThread` (`sync.ts:174`; `:383` sin marca, `:404-406` si la búsqueda falla), la pasada de conversaciones **no corre** ese ciclo; la caída por búsqueda ya la registra `:405`, y la de sin marca (réplica vacía) sigue en silencio, como hoy | Sin detalle no hay recuentos, y sin búsqueda no hay «modificados» |
| S-9 | Paginación sin interruptor, `from` desde 0, `limit=100`, tope de 20 páginas (2.000); en el tope la lista es incompleta. Corrige la lectura del escritor que ya existe; no es un escritor nuevo | La decisión pone tras interruptor la pasada, el marcado y el relleno, no la lectura |
| S-10 | Lo recibido antes de un fallo de página se guarda (existe en Zoho); sólo el marcado exige la lista completa | Hoy, sin paginar, ya se guarda la única página |
| S-11 | El desmarcado lo hace `upsertConversation` en sitio (`repo.ts:103`), con o sin interruptor | Devolver a la vista lo que Zoho devuelve es la dirección segura |
| S-12 | Sólo se marcan filas `source = 'zoho'` del ticket; nunca las de la App (`'app'`, `repo.ts:290-291`) | Las de la App no están en Zoho por construcción |
| S-13 | El filtro va en `getConversations` (`repo.ts:219`, en sitio). Los adjuntos de una marcada desaparecen solos: sólo se cuelgan de filas devueltas (`:221-226`) | Un solo consumidor; un filtro, un sitio |
| S-14 | El relleno de la decisión es el `backfill-details` que ya existe: hereda paginación y marcado por `syncConversations`, sin código nuevo | `backfill.ts:46-47` llama `syncTicket` (refresca `raw`) y luego `syncConversations` |
| S-15 | Sólo se marcan filas guardadas **antes** de empezar a leer la lista (`created_at` contra el `now()` de la base al empezar) | Una conversación que otra vía guarde mientras se lee no se marca por error |

## 6 · Tareas de persona (no son tareas de esta tanda; archivar no las da por hechas)

| Id | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Añadir a `.env.example` las dos líneas de los interruptores (la rama no puede leer `.env*`); van en el informe de cierre | Alfonso | informe de cierre de la tanda |
| P-2 | Encender los interruptores en el servicio App y redesplegar; decidir cuándo | Gerencia / Alfonso | `DEPLOY.md`, secciones nuevas |
| P-3 | Con copia previa de `desk-db` (botón de EasyPanel), lanzar una vez `GET /api/admin/backfill-details` | Alfonso | `DEPLOY.md`, sección nueva |
| P-4 | Tras P-3, comprobar en producción que el hilo `495552000057899091` del #958 queda marcado y sólo él | Analista | lista acumulada de pruebas en la app |

## 7 · Riesgos

- **Peticiones a Zoho.** Con la pasada encendida, cada ticket modificado cuesta al menos una petición más por ciclo; S-6 y S-7 lo
  acotan. La cuota diaria de Zoho Desk para esta cuenta no está medida: **hipótesis** que cabe.
- **Un borrado que no mueva el `modifiedTime`** no lo trae la pasada periódica hasta que el ticket se toque, se abra o se rellene
  (que un borrado mueva la fecha es **hipótesis** sin medir). La apertura y el relleno sí lo reflejan.
- **Tickets cuya pasada se corta** (S-5) o falla no vuelven a salir hasta su siguiente modificación; los cubre la apertura.
- **El cableado de `index.ts` no lo ve ninguna prueba** (el fichero de entrada no lo importa ninguna), igual que `alDiscrepanciaOV`.
  Lo cubren: la prueba de `loadConfig`, la de `createSync` con y sin la opción, y una guarda sobre `hub-sync.ts`.

## 8 · Método y cierre

Worktree propio desde `b4255928`; `strict_tdd` con rojo previo; pruebas de posición y mutaciones con M0 (encargo, apartado
Método); barrido de la regla de mutación 4 sobre `sync.ts`, `repo.ts`, `schema.sql`, `config.ts` e `index.ts` al cerrar. Intentos
≤ 800 líneas medidas con `git diff --shortstat --no-renames` más `wc -l` de lo nuevo sin trackear. Para antes de fusionar.
