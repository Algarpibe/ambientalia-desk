# Paquete de despliegue — 2026-11-02, adenda: el encendido de los interruptores de conversaciones

Adenda a los paquetes fechados anteriores, que **no se editan**. El último era
`docs/sdd/Paquete_de_Despliegue_2026-10-30.md`. Esta adenda deja constancia del encendido de
`SYNC_CONVERSACIONES_PERIODICA` y `MARCAR_CONVERSACIONES_AUSENTES` en el servicio App, del relleno de conversaciones y de
sus comprobaciones. No hay código nuevo, así que no añade fila a la tabla de publicaciones. Va `fuera-del-plan` con el
mismo motivo que la del 30/10: `decision/excepcion-plazo-rq-kp-26`, punto (4) de su respuesta textual
(`openspec/config.yaml` → `decisiones_de_gerencia_adenda`).

**De dónde sale cada dato.** Todas las horas van en UTC. Ninguna sesión de construcción entra en producción. Hay tres
fuentes, y cada dato dice la suya:

- **Dato de Alfonso**, del 30/10 al 02/11: el encendido, la copia, las consultas SQL, el JSON del relleno, la
  comprobación en Zoho y la captura de Desk 2.0 de §2.
- **Medida del analista**, 2026-10-30, con el conector de Zoho Desk sobre el #958
  (`docs/sdd/Paquete_de_Despliegue_2026-10-30.md:90-91`).
- **Medida de esta sesión**, el 2026-11-02: la conversión de las marcas de tiempo del JSON; que desde `e5f9bbde` `main`
  sólo ha recibido el paquete del 30/10 (`git diff --stat e5f9bbde bdfb455e`); y las rutas y líneas, leídas en `bdfb455e`.

Lo que ninguna de las tres comprueba va marcado como **hipótesis**.

---

## 1 · Estado de hoy en producción

**Cliente y servidor, sin cambio desde el paquete del 30/10** (`docs/sdd/Paquete_de_Despliegue_2026-10-30.md:22-52`):
cliente `index-F1jDYjEU.js`, servidor con el código de `dc6ecd28` y `e5f9bbde`. El redespliegue del 30/10 cambió el
entorno, no el código: desde `e5f9bbde`, `main` sólo ha recibido `bdfb455e`, que es documentación. **Hipótesis:** que
ese redespliegue se construyera desde `main`. El bundle no se ha vuelto a medir después.

**Interruptores: los dos ENCENDIDOS desde el 30/10** en el servicio App (dato de Alfonso):
`SYNC_CONVERSACIONES_PERIODICA=true` (`DEPLOY.md` §18) y `MARCAR_CONVERSACIONES_AUSENTES=true` (`DEPLOY.md` §19).
Sustituye a «no consta que se hayan encendido» (`docs/sdd/Paquete_de_Despliegue_2026-10-30.md:54`).

**Worker `zoho-hub-sync`.** Sin cambio (`docs/sdd/Paquete_de_Despliegue_2026-10-30.md:59-62`). Los interruptores no le
afectan: sólo la App los lee (`apps/desk/server/index.ts:23`).

## 2 · El encendido y el relleno

Los pasos de `DEPLOY.md` §20 (`DEPLOY.md:870-880`), en su orden. Todo es dato de Alfonso salvo donde se indica.

1. **Copia previa** de `desk-db`, antes de tocar nada.
2. **Foto previa por SQL:** 0 conversaciones con `ausente_en_zoho_at`; el #958 con 6 filas sin marcar, 1 `thread` y
   5 `comment`.
3. **Encendido:** las dos variables a `true` en el servicio App, y redespliegue.
4. **Relleno:** `GET /api/admin/backfill-details` (`apps/desk/server/routes/admin.ts:53-58`). JSON final, captura de
   Alfonso:

       {"running":false,"done":true,"ticketsProcessed":258,"errors":0,"startedAt":1793372272698,"finishedAt":1793372537457}

   `startedAt` es el 30/10 a las 14:57:52 y `finishedAt` a las 15:02:17: **4 min 25 s** (264,8 s; conversión de esta
   sesión). 258 tickets, 0 errores.

**Después, por SQL: 2 conversaciones marcadas en total.**

| Ticket | Conversación | Tipo | Marcada |
|---|---|---|---|
| #932 | `495552000057180216` | thread | 30/10 15:00:01 |
| #958 | `495552000057899091` | thread | 30/10 15:00:35 |

- Los cinco comentarios del #958 siguen sin marcar.
- Alfonso comprobó en Zoho que las dos ya no aparecen allí: **0 falsos positivos**.
- En el #958 coincide con la lectura del analista con el conector el 30/10, que devolvía sus 5 comentarios
  (`docs/sdd/Paquete_de_Despliegue_2026-10-30.md:90-91`).
- Las dos marcas caen dentro de la ventana del relleno. **Hipótesis:** que las pusiera el relleno y no la pasada
  periódica, que sólo pide los tickets que Zoho reportó como modificados (`packages/zoho-sync/src/sync.ts:66`, `:176`).

**Desk 2.0** (captura de Alfonso): el #958 muestra «5 CONVERSACIONES», sin el hilo. Es lo que hace la lectura del hilo,
que deja fuera lo marcado (`packages/zoho-sync/src/db/repo.ts:219`).

**Cobertura** (SQL): `desk.tickets` tiene **784** tickets —756 `Closed`, 19 `On Hold`, 9 `Open`— y el relleno
recorrió **258**.

- El relleno recorre la lista `/tickets` de Zoho (`apps/desk/server/backfill.ts:36-56`, la petición en `:38-39`).
- **Hipótesis:** esa lista no trae los cerrados antiguos o archivados. `DEPLOY.md:878-879` ya lo daba como hipótesis.
- Los no recorridos **no se marcan**, que es la dirección segura: sólo se marca tras leer la lista completa
  (`packages/zoho-sync/src/conversaciones.ts:119-127`). Se corrigen cuando el ticket se abre en Desk
  (`apps/desk/server/routes/tickets.ts:154-163`) o cuando se modifica en Zoho y lo recoge la pasada.

**Pasada periódica, #1003** (SQL). `commented_time` es la hora de Zoho; `created_at` es la hora en que Desk insertó la
fila (`DEFAULT now()`, `packages/zoho-sync/src/db/schema.sql:48`).

| `commented_time` (Zoho) | `created_at` (Desk) | Retraso |
|---|---|---|
| 31/10 18:01:40 | 31/10 18:03:32 | 1 min 52 s |
| 31/10 18:58:38 | 31/10 19:00:32 | 1 min 54 s |
| 02/11 16:58:26 | 02/11 17:00:43 | 2 min 17 s |

- La tercera es la prueba de Alfonso: un comentario privado, sin abrir el ticket en Desk.
- Las tres quedan por debajo de un ciclo de 180 s (`packages/zoho-sync/src/config.ts:88`).
- **Hipótesis:** que las dos del 31/10 llegaran por la pasada y no por una apertura.

## 3 · Las comprobaciones

Las tres que el paquete del 30/10 añadió a la lista acumulada de pruebas en la app
(`docs/sdd/Paquete_de_Despliegue_2026-10-30.md:110-121`) quedan **HECHAS**:

| Comprobación | Fecha y fuente |
|---|---|
| Abrir un ticket con actividad reciente en Zoho y ver el hilo refrescado (`docs/sdd/Paquete_de_Despliegue_2026-10-30.md:114-116`) | 30/10, captura de Alfonso: al abrir el #958, Desk 2.0 enseña el mismo hilo que Zoho. **Lo que no separa:** el estado de ese hilo lo fijó el relleno a las 15:00:35, así que la captura prueba lo que enseña la apertura, no que la apertura lo refrescara |
| El #958 sin el hilo `495552000057899091` y con sus cinco comentarios (`docs/sdd/Paquete_de_Despliegue_2026-10-30.md:117-119`; tarea P-4) | 30/10: SQL de Alfonso y captura de Desk 2.0 con «5 CONVERSACIONES» (§2); coincide con el conector (`:90-91`) |
| Con §18 encendido, un comentario nuevo en Zoho aparece en Desk en un ciclo como mucho, sin abrir el ticket (`docs/sdd/Paquete_de_Despliegue_2026-10-30.md:120-121`) | 02/11: comentario privado en el #1003, en Desk a los 2 min 17 s, sin abrir el ticket (§2) |

También queda **HECHA** la primera fila de pendientes del paquete del 30/10
(`docs/sdd/Paquete_de_Despliegue_2026-10-30.md:127`): encendido, redespliegue y relleno con copia previa, el 30/10. Con
ella, las tareas P-2 y P-3 del informe de archivo
(`openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/archive-report.md:97-98`). La P-4 (`:99`) es la segunda
comprobación de la tabla.

**Lo no hecho** pasa a §4: la prueba del borrado y la revisión de `429` en los logs.

## 4 · Pendientes

| Tarea | Lo hace | Dónde |
|---|---|---|
| Prueba del borrado: borrar un comentario en Zoho y ver si cambia la fecha de modificación del ticket. Si no cambia, la pasada no trae el borrado y sólo lo reflejan la apertura y el relleno | Alfonso | H-3 (`openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/archive-report.md:106`) |
| Revisar en los logs de la App si hubo `429`. Una pasada que agota los reintentos deja «pasada cortada por 429» con los tickets que quedaron sin pedir | Alfonso | `packages/zoho-sync/src/conversaciones.ts:165`; `DEPLOY.md:837-838` |
| Averiguar con qué commit corre el worker | Persona con acceso a producción | `docs/sdd/Paquete_de_Despliegue_2026-10-30.md:128` |
| Redesplegar el worker con las condiciones (h) e (i) y `SWEEP_DRY_RUN=true` | Alfonso | `docs/sdd/Paquete_de_Despliegue_2026-10-30.md:129` |

Las dos del worker siguen abiertas desde el paquete del 28/10.

**Para la bandeja (R-3), como hipótesis: la cobertura de los cerrados antiguos.** El relleno recorrió 258 de los 784
tickets de `desk.tickets` (§2).

- **Hipótesis:** la lista `/tickets` de Zoho no trae los cerrados antiguos o archivados (`DEPLOY.md:878-879`).
- **Hipótesis también, sin medir:** parte de la diferencia pueden ser tickets nacidos en la app, con id `app-`
  (`packages/shared/src/transitions.ts:124`), que Zoho no conoce y el relleno no puede recorrer.
- Falla del lado seguro: un ticket no recorrido no se marca, y se corrige al abrirse o al modificarse en Zoho (§2).

Esta sesión no da de alta la entrada: `docs/sdd/ENTRADA.md` es de Supervisión.
