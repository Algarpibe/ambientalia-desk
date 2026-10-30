# Paquete de despliegue — 2026-10-30, adenda: el despliegue de `dc6ecd28`

Adenda a los paquetes fechados anteriores, que **no se editan**. El último era
`docs/sdd/Paquete_de_Despliegue_2026-10-28.md`. Esta adenda deja constancia del despliegue del servidor de `dc6ecd28`
(`sync-conversaciones-zoho`, tanda 1G-01, `cierra: no`) y añade su fila a la tabla de publicaciones. Va `fuera-del-plan`
con el mismo motivo que la del 28/10: `decision/excepcion-plazo-rq-kp-26`, punto (4) de su respuesta textual
(`openspec/config.yaml` → `decisiones_de_gerencia_adenda`).

**De dónde sale cada dato.** Ninguna sesión de construcción entra en producción. Hay cuatro fuentes, y cada dato dice la
suya:

- **Medida del analista**, 2026-10-30 09:06 (UTC-5), con `curl` contra producción: el cliente de §1.
- **Medida del analista**, 2026-10-30, con el conector de Zoho Desk sobre el ticket #958: la paginación de §2.
- **Dato de Alfonso**, 2026-10-30, antes de las 09:06: el despliegue del servidor y la consulta SQL de §1.
- **Medida de esta sesión**, el 2026-10-30: que `949d394f`, `dc6ecd28` y `e5f9bbde` son antecesores de `main`
  (`git merge-base --is-ancestor`), y las rutas y líneas de §2 y §4, leídas en `e5f9bbde`.

Lo que ninguna de las cuatro comprueba va marcado como **hipótesis**.

---

## 1 · Estado de hoy en producción

**Cliente.** Medida del analista, 2026-10-30 09:06: producción sirve

| Fichero | Bytes | sha256 (prefijo) |
|---|---|---|
| `assets/index-F1jDYjEU.js` | 427.510 | `5e010b12a2e6a031…` |
| `assets/index-BXv9vVDm.css` | — | — |

El analista lo da idéntico a lo medido el 28/10 (`docs/sdd/Paquete_de_Despliegue_2026-10-28.md:24-29`). Es lo esperado:
la tanda no toca ningún fichero de `apps/desk/src`
(`openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/archive-report.md:29-30`).

**Servidor.** Alfonso desplegó la App el 30/10. En `desk-db`, base `desk`, la consulta

    SELECT column_name FROM information_schema.columns
    WHERE table_schema='desk' AND table_name='conversations' AND column_name='ausente_en_zoho_at';

devolvió **1 fila** (dato de Alfonso). Es la **primera medida que distingue el servidor**: hasta el 28/10 no se medía
(`docs/sdd/Paquete_de_Despliegue_2026-10-28.md:34-35`), y el SQL del 26/10 no distinguía
(`docs/sdd/Paquete_de_Despliegue_2026-10-28.md:79`).

- La columna la crea **sólo** la migración que entra en `main` con `dc6ecd28`
  (`packages/zoho-sync/src/db/schema.sql:852`): `git log --first-parent -S ausente_en_zoho_at -- '*.sql'` da ese único
  commit. `migrate` la añade al arrancar
  (`openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/archive-report.md:76-77`).
- `e5f9bbde` sólo añade 4 líneas a `.env.example` (`.env.example:46-49`), así que `dc6ecd28` y `e5f9bbde` tienen el
  mismo código. El servidor corre ese código.
- **Hipótesis:** que se construyera desde un commit exacto. Y una salvedad que la consulta no distingue: la columna
  prueba que **arrancó** un servidor con esa migración; si después se volviera a una versión anterior, la columna se
  quedaría. No consta ninguna vuelta atrás.

**Interruptores.** `SYNC_CONVERSACIONES_PERIODICA` y `MARCAR_CONVERSACIONES_AUSENTES`: no consta que se hayan encendido.
Nacen cerrados (`=== 'true'`, `packages/zoho-sync/src/config.ts:125`). Con los dos apagados, lo único que cambia en
producción es que el hilo de un ticket se pide entero, paginado
(`openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/archive-report.md:76-77`).

**Worker `zoho-hub-sync`.** No consta que se haya redesplegado, y sigue sin constar con qué commit corre
(`docs/sdd/Paquete_de_Despliegue_2026-10-10c.md:45-46`). Esta tanda no lo necesita: el worker llama a `createSync` sin
la opción de conversaciones (`apps/hub-sync/src/hub-sync.ts:21`) y el informe de archivo lo dice expresamente
(`openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/archive-report.md:84`).

## 2 · Qué llevó `dc6ecd28`

Fusión `--no-ff` de la rama `sync-conversaciones-zoho` sobre `b4255928`. Tanda **1G-01**, `cierra: no`. Construye
`decision/adelanto-1g01-sincronizacion-conversaciones`. No toca el cliente.

- **Paginación.** `leerConversaciones` pide la lista entera de un ticket en páginas de 100 hasta la primera con menos de
  100 (`packages/zoho-sync/src/conversaciones.ts:67-93`, la petición en `:77`), con un tope de 20 páginas (`:21`). La
  usa `syncConversations` (`packages/zoho-sync/src/sync.ts:183-191`), que antes se cortaba en 100.
- **Marcado de lo que Zoho ya no devuelve, tras interruptor** (`MARCAR_CONVERSACIONES_AUSENTES`, `DEPLOY.md` §19). Sólo
  marca si la lista llegó completa contra `commentCount` + `threadCount`
  (`packages/zoho-sync/src/conversaciones.ts:119-127`); marca con `ausente_en_zoho_at=now()` (`:136`) y no borra nada.
  El hilo deja de enseñar lo marcado (`packages/zoho-sync/src/db/repo.ts:219`) y una fila que vuelve se desmarca sola,
  con el interruptor puesto o no (`packages/zoho-sync/src/db/repo.ts:103`).
- **Pasada periódica, tras interruptor** (`SYNC_CONVERSACIONES_PERIODICA`, `DEPLOY.md` §18). En cada ciclo pide las
  conversaciones de los tickets que Zoho reportó como modificados (`packages/zoho-sync/src/sync.ts:66`, `:176`). Sólo la
  App lee los dos interruptores (`apps/desk/server/opcionesConversaciones.ts:9-13`, llamada desde
  `apps/desk/server/index.ts:23`).
- **Columna nueva** `conversations.ausente_en_zoho_at`, `ALTER` sin calificar al final del esquema
  (`packages/zoho-sync/src/db/schema.sql:852`). Aditiva y nula.
- **`DEPLOY.md` §18-§20**: los dos interruptores (`DEPLOY.md:833-868`) y el relleno de conversaciones, paso de persona con
  copia previa (`DEPLOY.md:870-880`).
- **`e5f9bbde`**, después de la fusión: las dos variables en `.env.example` (`.env.example:46-49`), vacías. Cierra la
  tarea P-1 del informe de archivo
  (`openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/archive-report.md:96`).

**Lo que esta adenda responde de H-5.** El informe de archivo dejaba sin probar «que `from` cuente desde 0»
(`openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/archive-report.md:109-110`). Medida del analista con el
conector, sobre el #958: `from=0&limit=100` devuelve sus 5 comentarios, sin error, y `from=1&limit=2` devuelve los dos
primeros, los mismos. **Zoho cuenta desde 1 y trata el 0 como 1.** El código empieza en `from=0` y avanza de 100 en 100
(`packages/zoho-sync/src/conversaciones.ts:75`, `:88`), así que la página 2 (`from=100`) repite la conversación 100. No
se pierde ninguna y la repetida es inocua: se guarda con `ON CONFLICT (id)` (`packages/zoho-sync/src/db/repo.ts:101`) y
se cuenta por id único (`packages/zoho-sync/src/conversaciones.ts:119`). Sólo se solapan las páginas 1 y 2: desde la
3 cada `from` empieza justo detrás de la anterior. La única consecuencia es que el tope de 20 páginas cubre una
conversación menos de lo previsto; por encima del tope, la lectura se corta y no marca nada (`:87`, `:122`).
El resto de H-5 —`created_at < $2` contra Postgres real, el recuento en todos los tickets y la cuota diaria— sigue sin
probar.

## 3 · Publicaciones desde la última del 28/10

Misma tabla que `docs/sdd/Paquete_de_Despliegue_2026-10-28.md:68-81`, desde su última fila.

| Fecha | Commit de `main` | Bundle | Qué llevó |
|---|---|---|---|
| 28/10 | `949d394f` | `index-F1jDYjEU.js` | Código de servicio bloqueado salvo administrador (servidor y cliente) |
| 30/10 | `dc6ecd28` o `e5f9bbde` (mismo código) | `index-F1jDYjEU.js` (sin cambio; sólo servidor) | 1G-01: hilo paginado entero; marcado y pasada periódica tras interruptor, los dos cerrados; columna `conversations.ausente_en_zoho_at`. Medida por SQL a `information_schema` (§1) |

## 4 · Qué falta probar en la app

Gerencia, 18/10: **todas las pruebas en la app quedan para el final**. Esta adenda añade a esa lista acumulada:

- **Abrir un ticket con actividad reciente en Zoho y ver el hilo refrescado.** No necesita ningún interruptor: la apertura
  llama a `syncConversations` (`apps/desk/server/routes/tickets.ts:154-163`). Si el ticket ya tenía conversaciones
  guardadas, el refresco va en segundo plano (`:161-162`) y se ve en la apertura siguiente.
- **Tras encender §18 y §19 y lanzar el relleno, el #958 sin el hilo `495552000057899091` y con sus cinco comentarios**
  (`DEPLOY.md:880`; tarea P-4,
  `openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/archive-report.md:99`).
- **Con §18 encendido, un comentario nuevo en Zoho aparece en Desk en un ciclo como mucho (180 s), sin abrir el ticket**
  (`SYNC_INTERVAL_MS` por omisión, `packages/zoho-sync/src/config.ts:88`; `DEPLOY.md:835-839`).

## 5 · Pendientes de persona

| Tarea | Decide | Lo hace | Dónde |
|---|---|---|---|
| Encender `SYNC_CONVERSACIONES_PERIODICA` y `MARCAR_CONVERSACIONES_AUSENTES` en el servicio App, redesplegar y lanzar una vez el relleno con copia previa de `desk-db` | Gerencia | Alfonso | `DEPLOY.md` §18-§20; tareas P-2 y P-3 (`openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/archive-report.md:97-98`) |
| Averiguar con qué commit corre el worker; el servidor queda acotado al código de `dc6ecd28` (§1) | — | Persona con acceso a producción | `docs/sdd/Paquete_de_Despliegue_2026-10-28.md:99` |
| Redesplegar el worker con las condiciones (h) e (i) y `SWEEP_DRY_RUN=true` (`docs/sdd/Paquete_de_Despliegue_2026-10-10c.md:48-62`) | — | Alfonso | `docs/sdd/Paquete_de_Despliegue_2026-10-28.md:100` |

Las dos últimas son las del paquete del 28/10 y siguen abiertas.
