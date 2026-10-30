# Informe de archivo — `sync-conversaciones-zoho` (`tanda: 1G-01`, `cierra: no`)

Archivado el 2026-10-29 en la rama `sync-conversaciones-zoho` (worktree hermano, base `b4255928`) y **sin fusionar a `main`**: la tanda
para antes de fusionar. Lo escribe el orquestador con cifras medidas. `apply-progress.md` y `verify-report.md` son instantáneas de su
momento; donde difieran, manda este informe. Decisión que construye, citada por clave (`openspec/config.yaml` →
`decisiones_de_gerencia_adenda`, sólo en la copia de trabajo de `main`): `decision/adelanto-1g01-sincronizacion-conversaciones`.

**Cobertura de la fila 1G-01, en una línea:** cubrió el mecanismo —la pasada periódica de conversaciones, la lista entera por páginas y la
verificación contra `commentCount` + `threadCount` que marca lo que Zoho ya no tiene— y el paso de persona para lanzar el relleno; dejó
fuera el relleno verificado de los 986 tickets, que sigue en enero. Por eso `cierra: no`.

## 1. Qué queda construido

`git diff --shortstat --no-renames b4255928 1202ad56`: 27 ficheros, +2.056 −42; fuera de `openspec/`: 20 ficheros, +1.158 −42.

| Pieza | Dónde |
|---|---|
| Lectura paginada, recuento esperado, guardado y marcado; pasada periódica con memoria, pausas y corte por 429 | `packages/zoho-sync/src/conversaciones.ts` (nuevo, 175 líneas) |
| `syncConversations` paginada y con marcado tras interruptor (9 líneas por 9) | `packages/zoho-sync/src/sync.ts:183-191` |
| Opción `conversaciones` de `createSync` y la pasada tras el bucle de persistencia | `packages/zoho-sync/src/sync.ts:7`, `:9`, `:62`, `:66`, `:176`, `:375`, `:411`, `:426`, `:433` (en sitio; `:3` pierde importaciones sin uso) |
| Desmarcado al volver a guardar; el hilo no enseña lo marcado ni sus adjuntos | `packages/zoho-sync/src/db/repo.ts:103`, `:219` (en sitio) |
| Columna `conversations.ausente_en_zoho_at`, `ALTER` sin calificar al final | `packages/zoho-sync/src/db/schema.sql`, últimas 4 líneas |
| Interruptores `SYNC_CONVERSACIONES_PERIODICA` y `MARCAR_CONVERSACIONES_AUSENTES`, `=== 'true'` | `packages/zoho-sync/src/config.ts:66`, `:125` (en sitio) |
| Única lectura de los dos interruptores, llamada sólo desde la App | `apps/desk/server/opcionesConversaciones.ts` (nuevo), `apps/desk/server/index.ts:15`, `:23` (en sitio) |
| Documentación de despliegue | `DEPLOY.md` §18, §19 y §20, al final |

**Colocación:** inserciones = borrados en todos los ficheros citados editados en sitio (`sync.ts` 17/17, `repo.ts` 2/2, `config.ts` 2/2,
`index.ts` 2/2, `migrate.test.ts` 15/15, `registro.test.ts` 2/2, `deploySalidasEsperas.test.ts` 2/2): ninguna línea existente cambió de
número. **El worker no cambia** (`apps/hub-sync/src/hub-sync.ts:21` sigue llamando `createSync` sin la opción). **Cliente:** ningún fichero de
`apps/desk/src`; el bundle sigue siendo `dist/assets/index-F1jDYjEU.js` (427.510 B) + `index-BXv9vVDm.css`, el mismo que producción.

## 2. Intentos del registro, medidas y códigos

Medida = `git diff --shortstat --no-renames` contra la partida del intento + `wc -l` de lo nuevo sin trackear (siempre 0 al asentar).

| Intento | Commit | Medida | Qué | Códigos (typecheck · lint · citas · test · build) |
|---|---|---|---|---|
| i1 | `e05526ff`, `d38391f8` | 522 | planificación; S-16 (`registro.test.ts:218`, `:220`) | 0 · 0 · 0 · 0 · 0 (la 1.ª pasada sobre `e05526ff` dio 1 por una roja REAL, 1G-01 «en curso», corregida) |
| i2 | `226bc2ee` | 708 | L1: paginación, marcado, hilo | 0 · 0 · 0 · 0 · 0 |
| i2b | `9500f076` | 109 | registro de L1 | 0 · 0 · 0 · 0 · 0 |
| i3 | `25350a28` | 395 | L2: pasada, interruptores, `DEPLOY.md` | 0 · 0 · 0 · 0 · 0 |
| i3b | `e91d7962` | 118 | registro de L2 y barrido de la regla 4 | 0 · 0 · 0 · 0 · 0 |
| i4 | `ba17f5d3` | 190 | `verify-report.md` | 0 · 0 · 0 · 0 · 0 (el verificador: 1 sólo por «onTaskUpdate», 0 al repetir) |
| i4b | `1202ad56` | 120 | corrección de W-1 y W-2 | 0 · 0 · 0 · 0 · 0 |
| i5 | este commit | ver §3 | archivo | ver §3 |

Lint siempre 165 avisos contra 165. Suite final antes de archivar: 337 ficheros (333 pasan, 4 saltados), 5.802 pruebas (5.776 pasan, 26
saltadas); de partida eran 5.732. Memoria física antes de cada `npm test`: entre 14.097 y 16.124 MB. Logs en el scratchpad de la sesión.

## 3. Archivo

Fusión por script (`fusiona.mjs`, sólo ADDED, al final) con comprobación de identidad bloque a bloque: `openspec/specs/trazas/spec.md`
916 → 940 (+24, RQ-TZ-25, 3 de 3 escenarios) y `openspec/specs/zoho-sync/spec.md` 1.674 → 1.820 (+146, RQ-ZS-25 a RQ-ZS-27, 21 de 21
escenarios); CRLF conservado; ninguna línea viva se mueve. Las cabeceras de las dos specs traen recuentos de F0-02 que ninguna tanda
posterior actualizó; no se tocan. Las capacidades ya estaban en `capabilities` (R-2 no aplica). La carpeta pasa a
`openspec/changes/archive/2026-10-29-sync-conversaciones-zoho/`.

## 4. Verificación y estado final

`verify-report.md` (sobre `e91d7962`): **PASS WITH WARNINGS**, 0 CRITICAL; reprodujo las nueve mutaciones del encargo. **Estado posterior,
que manda sobre aquel informe:** W-1 (las esperas sin prueba de conducta) y W-2 (el cableado de `index.ts:23` sin prueba) quedaron
**cerrados en `1202ad56`**: `conversacionesPausas.test.ts` y `opcionesConversaciones.test.ts`, con X1, X2, W2a y W2b en rojo. W-3 (formato
de la evidencia TDD) y W-4 («onTaskUpdate» de la máquina) no piden código.

**Mutaciones del encargo, todas en rojo** (detalle en `apply-progress.md` y `verify-report.md`): quitar la paginación — la lista parcial
NO marca nada (`marcadas: []` en el caso de 151 guardadas y 150 recibidas); quitar la guarda de lista completa y, aparte, el cotejo con
`commentCount` + `threadCount`; quitar cada interruptor (M4, M5, M6a, M6b); una fila que reaparece se desmarca (M7); el worker no empieza
a pedir conversaciones (M8a', conductual, y M8b sobre `hub-sync.ts`, el fichero vigilado). Posiciones: P1 (`inicio` antes de leer), P2
(429 antes de `!res.ok`) y P3 (la pasada tras el bucle).

**Regla invariable 13:** nada bajo `apps/desk/src`; ocultar lo ausente lo decide el servidor (`repo.ts:219`). **Regla de mutación 4:** 248
citas a líneas editadas barridas (`apply-progress.md`, L2.14); ninguna viva rota.

## 5. Interruptores y despliegue

Nacen cerrados; con los dos apagados, lo único que cambia en producción es que `syncConversations` pide la lista entera (hoy se corta en
100) y que `migrate` añade la columna al arrancar. Líneas que hay que añadir a `.env.example` (la rama no puede leer `.env*`, P-1):

    SYNC_CONVERSACIONES_PERIODICA=
    MARCAR_CONVERSACIONES_AUSENTES=

Pasos (`DEPLOY.md` §18-§20): desplegar la App (el servidor cambia; el cliente no); encender los interruptores cuando Gerencia lo decida y
redesplegar; con copia previa de `desk-db`, lanzar una vez `GET /api/admin/backfill-details` como superadministrador (`?restart=1` si ya
corrió en ese proceso); comprobar el #958. El worker no necesita redespliegue por esta tanda.

## 6. Supuestos reversibles (S-1 a S-16 de `proposal.md`)

Aplicados tal cual. S-11 (desmarcado sin interruptor) lo aprobó el analista el 29/10. S-16 (1G-01 «en curso» en `registro.test.ts`) se
añadió al cerrar el intento 1. Desde `1202ad56`, la «única lectura» de los interruptores de S-1b y `design.md` D5 es
`opcionesConversaciones`, llamada sólo desde `index.ts:23`.

## 7. Tareas de persona — fuera del recuento; archivar NO las da por hechas

| Id | Qué | Dueño | Dónde queda escrito |
|---|---|---|---|
| P-1 | Las dos líneas de §5 en `.env.example` | Alfonso | este informe |
| P-2 | Encender los interruptores en el servicio App y redesplegar | Gerencia / Alfonso | `DEPLOY.md` §18, §19 |
| P-3 | Copia previa de `desk-db` y una vez `backfill-details` | Alfonso | `DEPLOY.md` §20 |
| P-4 | Comprobar en producción el #958 (hilo `495552000057899091` oculto, los cinco comentarios visibles) | Analista | lista acumulada de pruebas en la app |

## 8. Para la bandeja (R-3), sin destino asignado

- **H-1 · Memoria con recuento distinto** (S-3 del verificador): un ticket cuya lista llegó entera pero con recuento distinto se recuerda
  y no se repide hasta que cambie su `modifiedTime` (`packages/zoho-sync/src/conversaciones.ts:169`). Falla del lado seguro (no marca).
- **H-2 · Tickets cortados o fallidos en la pasada** (S-5) no vuelven a salir hasta su siguiente modificación; los cubre la apertura.
- **H-3 · Un borrado en Zoho que no mueva `modifiedTime`** no lo trae la pasada (hipótesis sin medir); lo reflejan la apertura y el relleno.
- **H-4 · Tickets `managed_by_app`:** su `raw` no se refresca (`packages/zoho-sync/src/db/repo.ts:71`), así que el relleno y la apertura no
  marcan en ellos; la pasada periódica sí.
- **H-5 · Sin probar contra Postgres real:** `created_at < $2` con un `Date` enlazado (sólo pg-mem); que `from` cuente desde 0 (esquema del
  conector de Zoho); que el detalle traiga `commentCount` y `threadCount` en todos los tickets; la cuota diaria de Zoho Desk.
- **H-6 · `sync.ts:433`:** el `.catch` de la pasada es redundante (la pasada nunca rechaza); ninguna prueba lo fija (S-1 del verificador).
- **H-7 · 166 citas archivadas** a `registro.test.ts:218-220` y `migrate.test.ts` sin ancla, en carpetas fechadas de 33 tandas: caso B por
  la fecha de su carpeta, sin reanclar, como hizo cada tanda previa.

La rama no toca `openspec/config.yaml` ni `docs/sdd/ENTRADA.md`.
