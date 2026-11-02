---
tanda: 1G-01
motivo: ""
capacidad: [zoho-sync]
maestro: ["M11.3"]
cierra: si
toca_maestro: no
origen_cabecera: declarada
---

# Propuesta — `relleno-completo-conversaciones`

Construye `decision/adelanto-09-11-empezar-1g` (Gerencia, 02/11/2026; `openspec/config.yaml` → `decisiones_de_gerencia_adenda`), citada
por clave: hoy sólo vive en la copia de trabajo de `main`. Consecuencia (2): la primera tanda es lo que queda de 1G-01. Consecuencia (5):
lo que escriba en producción va tras un interruptor que nace cerrado y abre Alfonso.

*Sobre la cabecera.* `tanda: 1G-01`: es el contenido de su fila, «Backfill completo de conversaciones sobre los 986 tickets, con
verificación contra `commentCount` y `threadCount`. Cierra el punto 2 de `debt.md`» (`docs/sdd/Desk2.0_Plan_Fases_y_Tandas_ClaudeCode_R01.3.md:23`).
`maestro: ["M11.3"]`: la épica 1G del maestro vigente, «Trae los comentarios internos y los hilos de correo de todos los tickets (unos 986
desde 2021) y comprueba, contra los recuentos de Zoho, que ningún ticket se queda sin los suyos»
(`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3450`). La R01.1 no tiene fila 1G-01, así que la
comprobación la deja en `sinFuente` (`apps/desk/server/reconciliacion/comprobaciones.ts:229-233`). `cierra: si`: §3 y S-12.
`toca_maestro: no`: el cambio hace lo que el pasaje describe; la cifra «986» es otro asunto (§2.3, §8).

## 1 · Intención

Que Desk tenga las conversaciones y el detalle de **todos** los tickets de Zoho que conoce —archivados incluidos— y que cada ticket diga si
cuadra con los recuentos de Zoho. Al terminar: una persona lanza a propósito una pasada que recorre los ids de `desk.tickets`, y un resumen
dice cuántos cuadran, cuántos no y cuáles, sólo con recuentos y números de ticket.

## 2 · Lo que hay hoy (medido en `a729a371`)

**2.1 · El relleno de hoy no llega a los archivados.** `GET /api/admin/backfill-details` recorre la lista `/tickets` de Zoho
(`apps/desk/server/backfill.ts:36-56`, la petición en `:38-39`). El 30/10 recorrió 258 tickets con 0 errores
(`docs/sdd/Paquete_de_Despliegue_2026-11-02.md:49`, `:71-72`). `desk.tickets` tiene 784: 756 `Closed`, 19 `On Hold`, 9 `Open`; 523 con
`raw->>'isArchived' = true`, todos `Closed`; 1 nacido en la app; todos del departamento 495552000000006907 (SQL de Alfonso, 02/11; E-257).
784 − 1 − 523 = 260 frente a 258 recorridos. **Hipótesis**, que esas cifras sostienen: la lista no trae los archivados; las 2 restantes
serían un `raw` desfasado o el id que la búsqueda de Zoho no cuenta (§2.3). El código no lee `isArchived` en ningún sitio (cero apariciones en `apps/` y `packages/`).
- El detalle por id **sí** sirve los archivados: `GET /tickets/495552000016775001` (#300) responde con `isArchived` true, `isTrashed` y
  `isDeleted` false, `commentCount` "7", `threadCount` "1" (medida de la terminal, 02/11, conector de Zoho Desk, sólo lectura). Su lista de
  conversaciones devuelve 8: 7 comentarios y 1 hilo con `isDescriptionThread` true; 7 + 1 = 8 (medida del analista, 02/11).
- `POST /api/admin/backfill-archived` trae filas de tickets archivados, no conversaciones (`apps/desk/server/routes/admin.ts:206-212`,
  `packages/zoho-sync/src/sync.ts:158-172`); y los 523 ya están en Desk.

**2.2 · La verificación de hoy mira lo recibido, con recuentos que pueden estar viejos, y no deja informe.**
- `guardarYReflejar` da la lista por completa comparando los ids únicos **recibidos** con el recuento
  (`packages/zoho-sync/src/conversaciones.ts:119-120`), no lo guardado y visible. `syncConversations` descarta ese resultado y toma el
  recuento de `tickets.raw` (`packages/zoho-sync/src/sync.ts:183-191`, `:188`), que en los `managed_by_app` no se refresca
  (`packages/zoho-sync/src/db/repo.ts:71`): es H-4 del informe anterior.
- Un fallo es un `errors++` anónimo (`apps/desk/server/backfill.ts:48-49`) y `ticketsProcessed` cuenta aciertos y fallos (`:51`).
- `429`: sólo reintenta la página de la lista (`apps/desk/server/backfill.ts:40`). `syncTicket` lanza ante cualquier respuesta no `ok`
  (`packages/zoho-sync/src/sync.ts:180`) y `syncConversations` lee sin reintentos (`:187`; `packages/zoho-sync/src/conversaciones.ts:70`).
  `debt.md:614` afirma «reintento ante 429»: sólo es cierto de la lista.
- Arranca solo: el primer `GET` lo lanza (`apps/desk/server/routes/admin.ts:54-56`).

**2.3 · «986» no es un recuento.** Su fuente dice «El ticket más reciente es el nº 986 (03/09/2026)»
(`docs/sdd/Plan_Independencia_Zoho_Desk_31-12-2026.md:15`): era el número más alto, no el total. Medida de la terminal, 02/11: la búsqueda
sobre el único departamento cuenta **782** tickets, archivados incluidos, del #171 (09/09/2021, archivado) al #1018 (28/10/2026): 848
números para 782 tickets, porque la numeración tiene huecos. Desk tiene 784 = 783 ids de Zoho + 1 `app-`. **Hipótesis:** el id de Desk que
la búsqueda no cuenta fue borrado, enviado a la papelera o marcado como spam en Zoho después de su última sincronización; la pasada lo mide
(clase «no está en Zoho», S-6).

**2.4 · Zoho.** Cuenta `from` desde 1 y trata el 0 como 1 (`docs/sdd/Paquete_de_Despliegue_2026-10-30.md:89-96`). Los recuentos llegan
como texto (`packages/shared/src/types.ts:92-93`) y `esperadoDeZoho` acepta texto o número (`packages/zoho-sync/src/conversaciones.ts:40-57`).
La cuota de la API no está medida (E-254).

## 3 · Alcance y enfoque

**Dentro.**
1. **Recorrido sobre Desk**, no sobre la lista de Zoho: los ids de `desk.tickets` salvo los `app-` (molde `backfillTicketHistory`,
   `packages/zoho-sync/src/sync.ts:214-243`, filtro en `:224`), en orden estable por número (S-4).
2. **Por ticket:** detalle fresco (S-5); si Zoho ya no lo tiene, «no está en Zoho» y nada más (S-6); persistir ese detalle por la vía de
   hoy (S-7); lista entera de conversaciones con reintentos de `429`, guardado y marcado tras el interruptor de siempre (S-8).
3. **Verificación por ticket** contra `commentCount` + `threadCount` del detalle fresco, sobre lo **guardado y visible** (S-9).
4. **Resumen legible** al terminar o al cortarse: recuentos por clase y números de ticket, nada de datos de cliente (S-10).
5. **`429` y pausas:** reintento con pausa; si persiste, la pasada se corta y dice dónde; relanzar es idempotente y reanuda (S-4, S-11).
6. **Lanzamiento de persona** tras un interruptor nuevo que nace cerrado; nunca arranca solo; modo de sólo recuento sin Zoho (S-1 a S-3).
7. **Despliegue:** sección nueva de `DEPLOY.md` con sus dos frases y su prueba; la línea de `.env.example`, al informe (P-1).
8. **`debt.md` §2**, en sitio: cerrado por este cambio, y corregida la frase del `429` (S-13).
9. **Spec:** ADDED al final de `zoho-sync` (RQ-ZS-28); ningún bloque MODIFIED.

**Fuera.** Los bytes de los adjuntos (1G-02; sus metadatos se guardan como hoy, `packages/zoho-sync/src/conversaciones.ts:117`); la
completitud Zoho↔Desk de tickets y demás entidades, incluidos tickets que Zoho tenga y Desk no (1G-03); `apps/desk/src`; cambiar o retirar
`backfill-details` y `DEPLOY.md` §20; la pasada periódica y la lectura al abrir un ticket (H-4 sigue ahí); la historia (`ticket_history`);
escribir en Zoho; cambios de esquema; `openspec/config.yaml`, `docs/sdd/ENTRADA.md` y `.env.example` en la rama.

**Qué cubre de la fila, en una línea:** el relleno de conversaciones y detalle de todos los tickets de Zoho que Desk conoce, archivados
incluidos, con verificación por ticket contra `commentCount` + `threadCount`, resumen y el punto 2 de `debt.md`; deja fuera su ejecución en
producción (P-2, de persona) y la completitud de tickets entre Zoho y Desk (1G-03).

## 4 · Capacidades

**Nuevas:** ninguna. **Modificadas:** `zoho-sync` — el relleno completo y verificado de conversaciones, lanzado por una persona
(RQ-ZS-28, ADDED al final).

## 5 · Qué responde del informe anterior (`openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/archive-report.md:101-113`)

- **H-2** (tickets cortados o fallidos en la pasada periódica) y **H-3** (un borrado que no mueve `modifiedTime`): los recoge la pasada
  completa, **bajo demanda**; la periódica no cambia.
- **H-4** (`managed_by_app`): en esta pasada se verifica y se marca con el recuento del detalle fresco. La lectura al abrir sigue igual.
- **H-5**, dos partes: si el detalle trae los dos recuentos en todos los tickets (clase «sin recuento»); y el consumo de la pasada
  (peticiones y `429` contados). La cuota diaria sigue sin medirse. H-1, H-6 y H-7 no se tocan.

## 6 · Supuestos reversibles

| Id | Supuesto | Cómo se deshace |
|---|---|---|
| S-1 | Interruptor `RELLENO_CONVERSACIONES_HABILITADO`, `=== 'true'`, al final de `packages/zoho-sync/src/config.ts:66` y `:125`, en sitio. Se lee en `apps/desk/server/app.ts:57` y llega a las rutas como `migracionTicketsHabilitada` (E-231). El worker no registra rutas de administración: sólo `apps/desk/server/app.ts:57` llama a `registerAdminRoutes` | Quitar la variable |
| S-2 | `POST` lanza en segundo plano; `GET` sólo devuelve el estado y nunca arranca. Las dos, sólo superadministrador (`apps/desk/server/auth/middleware.ts:26-29`). Interruptor cerrado ⇒ `403` que nombra la variable (molde `apps/desk/server/routes/admin.ts:252`), antes de validar parámetros (escalón B antes que C, `:246-249`). Un `POST` con la pasada en marcha devuelve el estado y no lanza otra | Retirar la ruta |
| S-3 | `limite=0` es sólo recuento: cuántos ids se recorrerían y cuántos `app-` se saltan, sin llamar a Zoho ni escribir; libre de interruptor (molde `apps/desk/server/routes/admin.ts:199` y la pasada en seco de E-231) | Quitar el modo |
| S-4 | Orden por `tickets.number` (`packages/zoho-sync/src/db/schema.sql:22`), ascendente. `desde=<número>` reanuda donde el resumen dijo que se cortó; `limite=N` permite una primera pasada corta de tanteo | Quitar los parámetros |
| S-5 | Un detalle fresco por ticket, la misma petición que `syncTicket` (`packages/zoho-sync/src/sync.ts:179`); el recuento sale siempre de él, nunca de `tickets.raw`. Cómo llega a la persistencia sin pedirlo dos veces ni añadir métodos a `Sync` (`openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/design.md:10-12`) lo decide el diseño | Volver a `syncTicket` + `raw` |
| S-6 | «No está en Zoho»: el detalle responde `404`, o `isDeleted`/`isTrashed` vienen a true. No se escribe ni se marca nada; se lista por número. **Hipótesis:** que `404` sea la respuesta de Zoho para un borrado | Cambiar la clasificación |
| S-7 | El detalle se persiste por la vía de hoy (`persistTicket`, `packages/zoho-sync/src/sync.ts:112-123`), así que un `managed_by_app` conserva su fila (`packages/zoho-sync/src/db/repo.ts:71`): la App manda sobre su fila | Dejar de persistir |
| S-8 | Marcar sigue tras `MARCAR_CONVERSACIONES_AUSENTES` (`DEPLOY.md` §19), por `guardarYReflejar` con el `inicio` tomado antes de leer (`packages/zoho-sync/src/conversaciones.ts:99-102`). El interruptor nuevo no marca por sí solo | — |
| S-9 | Tras guardar y marcar: ids únicos con `source = 'zoho'` y `ausente_en_zoho_at` nulo igual al recuento ⇒ completo; distinto ⇒ descuadrado; recuento ausente ⇒ sin recuento; lectura fallida ⇒ con error. Con el marcado apagado, lo borrado en Zoho sale descuadrado, a propósito | Cambiar la regla |
| S-10 | Resumen: recuentos por clase, números de ticket de las clases no completas (nunca asunto, contacto, empresa ni contenido), motivo del primer fallo (molde `motivoPrimerFallo`, `packages/zoho-sync/src/sync.ts:228`, `:238`), peticiones hechas, `429` vistos y dónde se cortó. Vive en memoria y va al log al terminar o cortarse | Cambiar el formato |
| S-11 | `429`, en el detalle y en cada página: pausa de 2.000 ms y repetir la misma petición hasta 3 veces (`packages/zoho-sync/src/conversaciones.ts:23-24`); agotados, se corta la pasada entera. Otro fallo se cuenta y se sigue (molde `packages/zoho-sync/src/sync.ts:229-239`). Pausa de 150 ms entre tickets (`packages/zoho-sync/src/conversaciones.ts:26`) | Cambiar las constantes |
| S-12 | `cierra: si`: la fila queda construida; correr la pasada en producción es tarea de persona (CLAUDE.md, «Regla del ciclo 1»). Si Supervisión entiende que la fila exige la pasada hecha, pasa a `no` antes de archivar | Cambiar la cabecera |
| S-13 | `debt.md` §2 (`debt.md:602-605`) se da por cerrado y `debt.md:614` se corrige, en sitio y sin mover líneas. I-3 (`debt.md:631-634`) no se toca | Revertir el commit |
| S-14 | «Los 986 tickets» se lee como «todos los tickets de Zoho», que es lo que dice el maestro (§2.3): no cambia el alcance de la fila | — |
| S-15 | La planificación no toca `apps/desk/server/reconciliacion/registro.test.ts:220`, donde 1G-01 ya está «en curso». Al archivar con `cierra: si`, en sitio y con el mismo número de líneas: NUEVE en `apps/desk/server/reconciliacion/registro.test.ts:218`, y en `:220` 1G-01 sale de «en curso» y entra en «cerradas por archivo» | — |

**Ronda de preguntas:** no aplica. El preflight es `auto` y ninguna de las cinco causas de parada de la «Regla de ejecución» se da: la
escritura en producción ya la decide la consecuencia (5) y la abre Alfonso.

## 7 · Tareas de persona (no son tareas de esta tanda; archivar no las da por hechas)

| Id | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Añadir a `.env.example` la línea del interruptor (la rama no puede leer `.env*`) | Alfonso | informe de cierre |
| P-2 | Copia previa de `desk-db`; abrir el interruptor y redesplegar; `limite=0`, una pasada corta y la completa; cerrarlo después si se quiere | Alfonso | `DEPLOY.md`, sección nueva |
| P-3 | Pasar el resumen al analista; los descuadrados y los «no está en Zoho», a la bandeja | Alfonso / analista | bandeja (R-3), Supervisión |

## 8 · Riesgos

- **Cuota de Zoho (E-254).** **Hipótesis:** ~782 tickets × (1 detalle + ≥ 1 página) ≈ 1.600 peticiones, más contacto y cuenta la primera
  vez que aparecen en el proceso (`packages/zoho-sync/src/sync.ts:86-110`). Lo acotan la pausa, el corte por `429`, el tanteo con
  `limite` y la reanudación con `desde`.
- **Concurrencia** con la pasada periódica y con las aperturas: escriben las mismas filas con `upsert` idempotente, y el marcado sólo
  mira filas anteriores al `inicio` (`packages/zoho-sync/src/conversaciones.ts:128-131`). Las dos gastan cuota a la vez.
- **Avisos de discrepancia de OV** al persistir: `persistTicket` puede avisar a Comercial (`packages/zoho-sync/src/sync.ts:119-122`), sólo
  en filas con `ov_elegida_en_app_at` (`packages/zoho-sync/src/db/repo.ts:73`, `:79`). **Hipótesis:** ningún ticket archivado la lleva.
- **Un redespliegue a mitad** pierde el estado en memoria; queda el log y se reanuda con `desde`.
- **Para la bandeja (R-3):** el «unos 986» del maestro (`docs/Manifesto/Desk2.0_Documento_Maestro_Ideas_y_Funcionalidades_R08.4.md:3450`)
  es el número más alto de un día, no un total; la corrección es de Supervisión.

## 9 · Vuelta atrás

Cerrar el interruptor detiene nuevas pasadas. Lo escrito son datos de Zoho por `upsert`, los mismos que ya escribe la sincronización; las
marcas se revierten con `UPDATE conversations SET ausente_en_zoho_at = NULL`, con copia previa (`DEPLOY.md:860-861`). La copia de
`desk-db` previa a la pasada (P-2) es la red. Revertir el commit retira la ruta, el interruptor y la sección de `DEPLOY.md`.

## 10 · Método y cierre

Worktree propio desde `a729a371`; `strict_tdd` con rojo previo. Lo nuevo va en ficheros nuevos; los citados por número (`config.ts`,
`app.ts`, `sync.ts`, `repo.ts`) sólo en sitio. Mutaciones con rojo esperado: recuento desde `raw` (cae el caso `managed_by_app`); contar lo
recibido en vez de lo guardado y visible; quitar el filtro `app-`; `!== 'false'` en el interruptor; un `GET` que lanza; no cortar ante `429`
agotado; marcar sin `MARCAR_CONVERSACIONES_AUSENTES`. Posiciones: el interruptor antes de validar parámetros; la guarda del `429` antes de
`!res.ok`; el `inicio` antes de leer. Guardas que cuentan el árbol: la §21 de `DEPLOY.md` exige acotar la §20 en la misma línea
(`apps/desk/server/deployConversaciones.test.ts:27`, molde `apps/desk/server/deploySalidasEsperas.test.ts:17`); `registro.test.ts`, S-15;
`migrate.test.ts` no se toca (sin cambio de esquema). Barrido de la regla de mutación 4 al cerrar. Intentos ≤ 800 líneas medidas con
`git diff --shortstat --no-renames` más `wc -l` de lo nuevo sin trackear.
