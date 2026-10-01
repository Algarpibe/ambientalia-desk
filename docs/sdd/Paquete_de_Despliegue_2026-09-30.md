# Paquete de despliegue — 2026-09-30

Material para la persona que publica Desk 2.0 en producción. **Este documento no publica nada**: lo
escribe un agente que no despliega ni commitea. La publicación es una acción manual: el CI **no
despliega** (`docs/sdd/Paquete_de_Despliegue_2026-09-10.md:5-6`). `.github/workflows/ci.yml` no cambia
después de `3f9d23b` (`git diff --name-only 3f9d23b..b1347e0 -- .github` → vacío); su único cambio en el
rango sigue siendo el techo del trinquete de avisos de lint (`f7c9dc1`, `.github/workflows/ci.yml:41`).

**Este paquete sustituye al del 2026-09-29 para publicar.** Aquél cubría `ae5aaf4..3f9d23b`, y `3f9d23b`
**nunca llegó a producción**: todo se mide otra vez desde `ae5aaf4`, no desde aquel documento. Aquél es un
registro fechado y no se toca; lo que aquí lo corrige se dice en su sitio.

| Dato | Valor |
|---|---|
| Repositorio | `C:\dev\Desk_2_R1.023`, rama `main` |
| Se publica hasta | `b1347e0` (HEAD de `main` el 2026-09-29, 19:11 −05:00) |
| Base que hoy corre en producción | `ae5aaf4` (2026-09-10 19:20), verificada por sha256 del bundle (`docs/sdd/Paquete_de_Despliegue_2026-09-10.md:22`) |
| Rango medido | **`ae5aaf4..b1347e0`** |
| `git diff --shortstat ae5aaf4..b1347e0` | **443 files changed, 78799 insertions(+), 1486 deletions(-)** |
| Commits del rango | **341** (`git rev-list --count ae5aaf4..b1347e0`) |
| De ellos, tocan `apps/` o `packages/` | **91** (`git rev-list --count ae5aaf4..b1347e0 -- apps packages`); **8** posteriores a `3f9d23b`: siete de código y `2312d34`, que sólo corrige una línea de comentario de `packages/zoho-sync/src/db/migrate.test.ts` |
| Código tocado | **177 ficheros**, +17.195/−613 (`git diff --shortstat ae5aaf4..b1347e0 -- apps/ packages/`); de ellos, desde `3f9d23b`: 40 ficheros, +2.108/−196 |
| Fuera de `apps/` y `packages/` con efecto en la imagen | `Dockerfile` (`COPY scripts ./scripts`) y `package.json` (script `prepare`) — §4.3. **Ninguno cambia después de `3f9d23b`** (`git diff --name-only 3f9d23b..b1347e0 -- Dockerfile package.json package-lock.json scripts .dockerignore DEPLOY.md vitest.config.ts` → vacío) |
| Build, tipos y pruebas en `b1347e0` | `npm run build` → **exit 0** («✓ built in 1.56s») · `npm run typecheck` → **exit 0** (`tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit`, sin salida de error) · `npm test` → «Test Files 159 passed \| 1 skipped (160)», «Tests **1990 passed** \| 2 skipped (1992)», duración 109,79 s, **exit 0**. Ejecutado el 2026-09-29 hacia las 19:30 −05:00, sobre el árbol limpio de `b1347e0` |

El código de `b1347e0` es el de `b159c6b` más una línea de comentario en una prueba: `git diff --name-only
b159c6b..b1347e0 -- apps packages` → sólo `packages/zoho-sync/src/db/migrate.test.ts`.

*Correcciones al paquete anterior* (aquel documento es un registro fechado y no se toca; las correcciones
viven aquí y ninguna cambia su veredicto):

- `docs/sdd/Paquete_de_Despliegue_2026-09-29.md:127` y `:173` hablaban de «siete índices». Son **seis**
  sentencias `CREATE INDEX` (las filas 10, 15, 16, 17, 19 y 20 de su propia tabla de §2.1), y su propia
  consulta de §4.4 esperaba seis filas. Las claves primarias crean índices implícitos, pero no son
  sentencias del bloque.
- Su §5.2 decía que F1B-12 no tenía «ningún consumidor» y su §6.3 que en la app «ninguna pantalla consume
  la tabla». Era cierto en `3f9d23b`; **deja de serlo en este rango**: la pasada de alarmas lee
  `public.calendario_cierres` en cada llamada (`apps/desk/server/db/sla.ts:46`). Sigue sin haber pantalla.

---

## 1 · Resumen para quien publica

**Veredicto: `b1347e0` es DESPLEGABLE**, con las mismas condiciones del 2026-09-29 y tres más, todas
cubiertas por este documento o por tareas de persona que no lo bloquean:

1. La consulta de §4.4 justo después del Deploy **sigue siendo obligatoria**, y ahora es más amplia: una
   columna y dos tablas más. Si falta la columna `desk.tickets.modalidad`, **no se puede crear ningún
   ticket** (§2.2).
2. Los dos cambios nuevos declaraban que «no se despliegan» sin un paquete que recoja S-6 y la nota de
   alarmas (`openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/archive-report.md:32-39`;
   `openspec/changes/archive/2026-09-29-alarmas-horas-habiles/archive-report.md:114`). **Este documento es
   ese paquete**: S-6 va en §5.1 con el recuento «sin medir», y la nota de seis puntos va en §5.1 y §6.
3. **La P.3 de `alarmas-horas-habiles` (ráfaga de lo vencido) se decide ANTES del Deploy.** Sin respuesta,
   se publica apagada, que es lo que hace `b1347e0`. Si Gerencia la quiere encendida, hace falta un cambio
   de código y **`b1347e0` deja de ser el commit a publicar** (§6.1.4).

Las migraciones son todas aditivas e idempotentes (§2), no hay ninguna variable de entorno nueva (§3), no
queda ningún «no se despliega sin X» pendiente fuera de este documento (§7), y build, tipos y pruebas están
en verde. **Hay una incoherencia de documentación que no bloquea pero hay que conocer** (§3): las alarmas
mandan copia a `AVISOS_COPIA_EMAIL`, y `DEPLOY.md:159-160` en `c2b2888` dice que esa variable sólo copia los avisos de
derivación.

**Lo que puede sorprender al equipo, por orden de impacto.**

1. **Aparecen tres alarmas de SLA nuevas en la campana (y por correo, si el canal está encendido)**, todas
   al `Coordinador Comercial`: `Notificado` a las 9 h hábiles, `Remisión creada` a las 27 h hábiles sólo si
   no hay orden de venta, y `Notificación cliente` a las 36 h hábiles, que además pinta en el tablero
   «Esperando aprobación del cliente» (§5.1). En producción hoy **no existe ninguna alarma de SLA**: el
   plazo de 24 h de `Notificado` estaba escrito pero nadie lo llamaba (§5.1, «Lo que cambia de verdad»).
2. **Los tickets `Soporte remoto` que hoy estén en `En Proceso`, `Pendiente` o `Finalizado` cambian de
   botones el día del Deploy** (S-6). Un SR en `Pendiente` deja de ver las salidas de servicio y sólo le
   queda «Continuación soporte». **Cuántos son no está medido** (P.1 de `blueprint-soporte-remoto`, §6.1.2).
3. **Los tickets nuevos de soporte remoto nacen en `Solicitud Soporte`**, con un selector «Modalidad»
   (Remoto / En sitio), y caen en la columna «Otros» del tablero.
4. **El buscador de orden de venta deja de ofrecer órdenes** ya usadas por otro ticket o en cuarentena
   (F1B-11, §5.1 bis). Cuántas caen en cuarentena **no está medido** (P.1 de F1B-11, §6.1.6).
5. **Los tickets de un cliente con contrato vigente nacen en `High`**, en cuanto Comercial registre los
   contratos (P.7 de `registro-contrato`, §6.3.3).
6. **Los tickets «Equipo nuevo» cambian de botones** (F1B-06, cambio 1), también los ya abiertos (R3).
7. **`Por Entregar` y `Por Entregar / Sin facturar` se mudan a «Tickets en espera»** (F1B-08).
8. **La remisión de entrada pregunta si el equipo llega con novedad**, y con «Sí» exige foto (F1B-04).
9. **Comercial recibe avisos nuevos de F1B-11 en la campana** (discrepancia de OV, ritmo de contrato). Son
   sólo de bandeja.

**Las acciones de persona, en orden** (lista completa y paso a paso en §6).

1. **Antes del Deploy:** copia de la base (§4.1); decisión P.3 de alarmas (§6.1.4); recomendado: el
   recuento de SR (§6.1.2), el cargo `Coordinador Comercial` (§6.1.3), localizar el ticket del paso 6 de
   P.2 de alarmas (§6.1.5), la consulta de subOV (§6.1.6) y mirar `AVISOS_COPIA_EMAIL` (§6.1.7).
2. **Deploy, y en los minutos siguientes la consulta de §4.4.** Si falta una tabla o columna, se revierte
   (§4.5). **A los tres minutos, aproximadamente**, corre la primera pasada de alarmas y fija el corte:
   entonces se hace el paso 6 de P.2 de alarmas (§6.3.1).
3. **Después:** verificaciones en la app de las dos tandas nuevas, alta de contratos, `INSERT` de cierres y
   las comprobaciones que siguen pendientes desde el 2026-09-27 (§6.3). Las decisiones de Gerencia de §6.4
   no bloquean el Deploy.

---

## 2 · Cambios de esquema

### 2.1 · `packages/zoho-sync/src/db/schema.sql` — veintitrés sentencias nuevas, todas al final del fichero

`git diff ae5aaf4..b1347e0 -- packages/zoho-sync/src/db/schema.sql` sólo **añade** líneas (+148/−0):
ninguna sentencia existente cambia. La última sentencia que ya existía en `ae5aaf4` es la de
`packages/zoho-sync/src/db/schema.sql:448` (`fecha_aviso_cliente`); todo lo de debajo es nuevo. Desde
`3f9d23b` se añaden 23 líneas al final (`:574-596`), commits `93e8b15` (F1B-06) y `c84f875` (F1B-08): las
veinte sentencias del paquete anterior **no se han movido**.

| # | Sentencia | Línea | Esquema de destino | ¿Calificada? | ¿Idempotente? | Tanda |
|---|---|---|---|---|---|---|
| 1 | `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS history_synced_at timestamptz` | `packages/zoho-sync/src/db/schema.sql:453` | `desk` | No, a propósito (`tickets` está en `DESK_TABLES`) | Sí, `IF NOT EXISTS` | fuera de tanda (historia de Zoho, worker) |
| 2-7 | `ALTER TABLE equipos ADD COLUMN IF NOT EXISTS` `fecha_adquisicion`, `fecha_factura_compra`, `fin_garantia` (`date`), `codigo_interno`, `mantenedor_id`, `drive_url` (`text`) | `packages/zoho-sync/src/db/schema.sql:466-471` | `desk` | No, a propósito | Sí, `IF NOT EXISTS` | F1B-02 |
| 8 | `CREATE TABLE IF NOT EXISTS public.calendario_cierres (fecha date PRIMARY KEY, …)` | `packages/zoho-sync/src/db/schema.sql:478-483` | `public` | **Sí** | Sí, `IF NOT EXISTS` | F1B-12 |
| 9 | `CREATE TABLE IF NOT EXISTS public.equipos_cambios (id bigserial PRIMARY KEY, …)` | `packages/zoho-sync/src/db/schema.sql:496-505` | `public` | **Sí** | Sí, `IF NOT EXISTS` | F1B-14 |
| 10 | `CREATE INDEX IF NOT EXISTS idx_equipos_cambios_equipo ON public.equipos_cambios (equipo_id)` | `packages/zoho-sync/src/db/schema.sql:506` | `public` | **Sí** | Sí, `IF NOT EXISTS` | F1B-14 |
| 11 | `ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS hay_novedad boolean` | `packages/zoho-sync/src/db/schema.sql:509` | `public` | **Sí** | Sí, `IF NOT EXISTS` | F1B-04 |
| 12 | `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ov_elegida_en_app_at timestamptz` | `packages/zoho-sync/src/db/schema.sql:524` | `desk` | No, a propósito (comentario en `:517-518`) | Sí, `IF NOT EXISTS` | F1B-11 (`parche-iv11-orden-venta`) |
| 13 | `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ov_zoho_avisada text` | `packages/zoho-sync/src/db/schema.sql:525` | `desk` | No, a propósito | Sí, `IF NOT EXISTS` | F1B-11 (`parche-iv11-orden-venta`) |
| 14 | `CREATE TABLE IF NOT EXISTS public.ov_asociaciones (id bigserial PRIMARY KEY, …)` | `packages/zoho-sync/src/db/schema.sql:539-551` | `public` | **Sí** | Sí, `IF NOT EXISTS` | F1B-11 (`asociacion-ov-ticket`) |
| 15 | `CREATE UNIQUE INDEX IF NOT EXISTS idx_ov_asoc_numero_vigente … WHERE liberada_at IS NULL` | `packages/zoho-sync/src/db/schema.sql:552` | `public` | **Sí** | Sí, `IF NOT EXISTS` | F1B-11 (`asociacion-ov-ticket`) |
| 16 | `CREATE UNIQUE INDEX IF NOT EXISTS idx_ov_asoc_so_vigente … WHERE liberada_at IS NULL` | `packages/zoho-sync/src/db/schema.sql:553` | `public` | **Sí** | Sí, `IF NOT EXISTS` | F1B-11 (`asociacion-ov-ticket`) |
| 17 | `CREATE INDEX IF NOT EXISTS idx_ov_asoc_ticket ON public.ov_asociaciones (ticket_id)` | `packages/zoho-sync/src/db/schema.sql:554` | `public` | **Sí** | Sí, `IF NOT EXISTS` | F1B-11 (`asociacion-ov-ticket`) |
| 18 | `CREATE TABLE IF NOT EXISTS public.contratos (…, CONSTRAINT contratos_fin_no_antes_de_inicio CHECK (fecha_fin >= fecha_inicio))` | `packages/zoho-sync/src/db/schema.sql:561-571` | `public` | **Sí** | Sí, `IF NOT EXISTS` (el `CHECK` va dentro del `CREATE`) | F1B-11 (`registro-contrato`) |
| 19 | `CREATE UNIQUE INDEX IF NOT EXISTS idx_contratos_lote ON public.contratos (lote)` | `packages/zoho-sync/src/db/schema.sql:572` | `public` | **Sí** | Sí, `IF NOT EXISTS` | F1B-11 (`registro-contrato`) |
| 20 | `CREATE INDEX IF NOT EXISTS idx_contratos_cliente ON public.contratos (client_id)` | `packages/zoho-sync/src/db/schema.sql:573` | `public` | **Sí** | Sí, `IF NOT EXISTS` | F1B-11 (`registro-contrato`) |
| **21** | `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS modalidad text` | `packages/zoho-sync/src/db/schema.sql:576` | `desk` | No, a propósito (comentario en `:574-575`) | Sí, `IF NOT EXISTS` | **F1B-06** (`blueprint-soporte-remoto`) |
| **22** | `CREATE TABLE IF NOT EXISTS public.alarmas_avisadas (ticket_id, estado, entrada_at, avisada_at, avisos_creados, PRIMARY KEY (ticket_id, estado, entrada_at))` | `packages/zoho-sync/src/db/schema.sql:582-589` | `public` | **Sí** | Sí, `IF NOT EXISTS` | **F1B-08** (`alarmas-horas-habiles`) |
| **23** | `CREATE TABLE IF NOT EXISTS public.alarmas_corte (id integer PRIMARY KEY, corte_at timestamptz NOT NULL)` | `packages/zoho-sync/src/db/schema.sql:593-596` | `public` | **Sí** | Sí, `IF NOT EXISTS` | **F1B-08** (`alarmas-horas-habiles`) |

*(Veintitrés sentencias en dieciocho filas: la 2-7 agrupa seis `ALTER` iguales.)*

**Las tres nuevas por dentro, restricción a restricción.**

- **`tickets.modalidad`** (`packages/zoho-sync/src/db/schema.sql:576`): `text`, **anulable, sin `DEFAULT`,
  sin `CHECK` y sin relleno** —la lista blanca vive en `packages/shared/src/flujos.ts:143` y la impone el
  servidor (comentario en `:574-575`)—. Va **sin calificar a propósito**: `tickets` está en `DESK_TABLES`
  (`packages/zoho-sync/src/db/migrate.ts:63-64`), y la conexión de la App fija
  `search_path=desk,public` (`packages/zoho-sync/src/db/pool.ts:5`, comprobado: `options: '-c
  search_path=desk,public'` cuando `config.dbSchema === 'desk'`), así que una `ALTER TABLE tickets` sin
  esquema aterriza en `desk.tickets`. Además `reorgToDesk` corre antes que `migrate`
  (`apps/desk/server/index.ts:26-27`). Queda fuera de `TICKET_COLS`, así que la sincronización no la pisa
  (comentario en `:575`). Todos los tickets existentes quedan con `NULL`; ningún SR heredado se rellena
  (S-9 de `openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/proposal.md:116`).
- **`public.alarmas_avisadas`** (`packages/zoho-sync/src/db/schema.sql:582-589`): `NOT NULL` en las cinco
  columnas (`avisada_at` con `DEFAULT now()`), **clave primaria compuesta** `(ticket_id, estado,
  entrada_at)` (`:588`). La clave es la unicidad de la alarma **en la base**: el servicio inserta sin
  `ON CONFLICT` y trata el `23505` como «ya avisado» (`apps/desk/server/services/alarmasSla.ts:44-55`).
  **Sin clave foránea** a `tickets` (`:580`). Nunca hay `UPDATE` ni `DELETE` (`:581`).
- **`public.alarmas_corte`** (`packages/zoho-sync/src/db/schema.sql:593-596`): una sola fila, `id = 1`,
  escrita **una vez** con `ON CONFLICT (id) DO NOTHING` por la primera pasada
  (`apps/desk/server/services/alarmasSla.ts:61`) y después sólo leída (`:62`). Nace vacía.

**Las seis tablas nuevas están clasificadas.** `calendario_cierres`, `equipos_cambios`, `ov_asociaciones`,
`contratos`, `alarmas_avisadas` y `alarmas_corte` están en `PUBLIC_TABLES`
(`packages/zoho-sync/src/db/migrate.ts:70-73`), que es lo que exige el guardián de
`packages/zoho-sync/src/db/migrate.test.ts`.

**Todas son ADITIVAS.** Seis tablas nuevas, **once** columnas nuevas **anulables y sin `DEFAULT`** sobre
tablas existentes (diez del paquete anterior más `modalidad`), y **seis** índices, todos sobre tablas
nuevas y vacías. No se borra ni se renombra nada, ninguna columna existente cambia de tipo, y **ninguna
restricción nueva recae sobre una tabla que ya tenga datos**: los `NOT NULL`, el `CHECK`, las claves
primarias y los índices únicos son todos de tablas que nacen vacías.

**Ninguna toca las cuatro tablas replicadas** (`desk.activities`, `books.contacts`, `books.sales_orders`,
`books.items`, `DEPLOY.md:42`), así que la regla de orden de `DEPLOY.md:50-51` —DDL primero en el
suscriptor— **no aplica a este paquete**.

**Punto y coma.** `schemaStatements` trocea el fichero por `;` a ciegas
(`packages/zoho-sync/src/db/migrate.ts:19-21`). Comprobado sobre `b1347e0`: las únicas líneas con `;` entre
`:449` y `:596` son las veintitrés sentencias y los cierres `);` (`grep -n ";"` filtrado a partir de la
448). **Ningún comentario del bloque nuevo lleva `;`**, tampoco los de `:574-575`, `:577-581` y `:590-592`.

### 2.2 · Dónde se aplican: al arrancar, idempotentes, y en silencio si algo falla

- **App:** `main()` corre `reorgToDesk` si el esquema es `desk` y luego `await migrate(pool)`
  (`apps/desk/server/index.ts:26-27`), **antes** de montar la API y de escuchar en el puerto
  (`apps/desk/server/index.ts:49`, `:57`). Ninguna petición llega antes de que la migración haya terminado.
- **Idempotencia, sentencia a sentencia:** las veintitrés llevan `IF NOT EXISTS` (§2.1). **No hay ninguna
  que no lo sea.** Cada Deploy vuelve a pasar el fichero entero, y en el segundo arranque cada sentencia es
  una operación vacía (`DEPLOY.md:224` en `c2b2888`, cierto para este rango).
- **Worker `hub-sync`:** `hubBootstrap` llama a `migrate(db)` sobre el hub con **el mismo** `schema.sql`
  (`apps/hub-sync/src/hubSync.ts:13`). Las seis tablas `public.*` nuevas y las columnas nuevas de `tickets`,
  `modalidad` incluida, **también se crean en `zoho-hub`** cuando se redespliegue el worker. Es inocuo: el
  worker no cablea el aviso de discrepancia (`apps/hub-sync/src/hub-sync.ts:21`) ni la pasada de alarmas
  (`git grep -n "pasadaAlarmas\|alarmas" b1347e0 -- apps/hub-sync` → 0).

⚠️ **`migrate` sigue siendo tolerante por sentencia** (`packages/zoho-sync/src/db/migrate.ts:28-33`): si una
sentencia falla, escribe `migrate: sentencia omitida:` en el log y **sigue arrancando**. La consecuencia de
cada omisión, con las tres nuevas:

| Si se omite… | Qué se rompe | Por qué |
|---|---|---|
| **sentencia 21 (`tickets.modalidad`)** | **El alta de cualquier ticket** responde 500, sea de la clasificación que sea | El `INSERT` del alta nombra la columna `modalidad` siempre (`packages/zoho-sync/src/db/repo.ts:420-422`, parámetro `$19`) |
| sentencia 18 (`public.contratos`) | **El alta de cualquier ticket** responde 500 | El alta consulta si el cliente tiene contrato vigente en cada creación (`apps/desk/server/services/ticketService.ts:106` → `apps/desk/server/db/contratos.ts:68-69`) |
| sentencia 14 (`public.ov_asociaciones`) | El **buscador de orden de venta**, las **tres puertas** de «una OV, un ticket», la ficha del ticket y **la alarma de `Remisión creada`** | `soloLibres` lee la tabla (`packages/zoho-sync/src/books/repo.ts:159-162`); la tercera vía de las puertas también (`packages/zoho-sync/src/db/repo.ts:371`); y la pasada de alarmas la consulta para saber si hay OV (`apps/desk/server/db/sla.ts:51`, que llama a la consulta de `:104-110`) |
| sentencia 12 o 13 (columnas de `tickets`) | **La sincronización con Zoho Desk entera** y el alta de tickets | `upsertTicket` lee las dos columnas (`packages/zoho-sync/src/db/repo.ts:67`); el alta escribe la marca en su `INSERT` (`packages/zoho-sync/src/db/repo.ts:418-422`) |
| sentencia 22 o 23 (`alarmas_avisadas`, `alarmas_corte`) | **Las alarmas no suenan** y el tablero sale **sin** la marca «Esperando aprobación del cliente». **Nada más**: ni el tablero ni la sincronización se caen | La pasada escribe el corte antes que nada (`apps/desk/server/services/alarmasSla.ts:86`, `:61`); si falla, lanza, `pasadaAlarmas` lo recoge y deja `pasadaAlarmas falló` en el log (`:141-146`), y la cadena sigue con el ritmo y la sincronización (`apps/desk/server/index.ts:88`). La marca del tablero nunca lanza: deja un `warn` y devuelve vacío (`apps/desk/server/db/alarmasAvisadas.ts:31-34`) |
| sentencias 15-17, 19-20 (índices) | Nada visible de inmediato. Sin los únicos, la base deja de impedir dos asociaciones vigentes de la misma OV o dos contratos del mismo lote en una carrera | La ruta sigue comprobando antes (`apps/desk/server/routes/contratos.ts:55`), pero la carrera la cierra el índice |

Un fallo de migración **no tumba el Deploy ni se ve en pantalla hasta que alguien crea un ticket**. Por eso
§4.4 comprueba, en sólo lectura, las seis tablas, las once columnas, los seis índices, el `CHECK` y las dos
claves primarias nuevas, y §4.5 dice que si falta algo se revierte.

*Hipótesis sobre por qué podría fallar una sentencia:* ninguna razón conocida. Las que fallaban en el pasado
eran índices sobre columnas de esquemas viejos antes del `recreate` (comentario de
`packages/zoho-sync/src/db/migrate.ts:26-28`). Un usuario de base sin permiso de `CREATE` en `public` sería
una causa posible y no está medida.

### 2.3 · Otros ficheros SQL del rango

| Fichero | Qué añade | Dónde corre | ¿Idempotente? |
|---|---|---|---|
| `packages/zoho-sync/src/booksHub/schema-books.sql` | `CREATE TABLE IF NOT EXISTS books.retainer_invoices`, commit `a233e1d` | Sólo en `zoho-hub`, vía `migrateBooks` (`apps/hub-sync/src/hubSync.ts:24`) | Sí |
| `packages/zoho-sync/src/crmHub/schema-crm.sql` | `ALTER TABLE crm.deals ADD COLUMN IF NOT EXISTS stage_detail_synced_at` y `… stage_history_synced_at`, commits `3fc4768` y `030efa7` | Sólo en `zoho-hub`, vía `migrateCrm` (`apps/hub-sync/src/hubSync.ts:80`) | Sí |
| `docs/sdd/Consultas_Recuentos_2026-09-25.sql`, `docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql` | Consultas de recuento | Nadie las ejecuta al desplegar: `docs` no entra en la imagen (`.dockerignore`) | — |
| `docs/sdd/Consulta_SubOV_formato_2026-09-27.sql` | Barrido de sólo lectura de números de OV (bloques 1-4) y de literales de estado de Books (bloque 5). **Cambió en `66ab783`**: el bloque 5 ya lee `raw->>'order_status'` (`:127`, `:129`) | A mano: P.1 y P.4 de F1B-11, §6.1.6 | No escribe nada: bloques 1-4 dentro de `BEGIN READ ONLY … ROLLBACK` (`:50`, `:116`); el bloque 5 queda fuera (`:118-134`) y el propio fichero lo avisa (`:122-123`) |
| `docs/sdd/Alta_Cierres_Fin_de_Año_2026.sql` | El `INSERT` de los cierres | A mano, **después** del Deploy: §6.3.4 | Sí, `ON CONFLICT (fecha) DO NOTHING` |

Las consultas de sólo lectura nuevas de las dos tandas (recuento de SR, cargo, tamaño de lo que se marca en
silencio) no viven en ficheros `.sql`: están en los `tasks.md` archivados y se copian en §6.1.

---

## 3 · Variables de entorno e interruptores

**Ninguna nueva.** Medido sobre el diff entero y sobre el tramo nuevo:

- `git diff ae5aaf4..b1347e0 -- apps packages`: las líneas añadidas con `process.env` siguen estando sólo
  en las siete herramientas de repositorio que listaba el paquete anterior (detector de citas,
  reconciliación y sus pruebas). No las carga ni la App ni el worker.
- **Después de `3f9d23b` no se añade ni una**: en `git diff 3f9d23b..b1347e0 -- apps packages`, las líneas
  añadidas con `process.env`, `import.meta.env`, `VITE_` o `=== 'true'` son **0**, y
  `git diff --name-only -G'process\.env' 3f9d23b..b1347e0 -- apps packages` sale vacío.
- `packages/zoho-sync/src/config.ts` **no cambia** en el rango (`git diff --stat ae5aaf4..b1347e0 --
  packages/zoho-sync/src/config.ts` → vacío).
- `DEPLOY.md` no cambia después de `3f9d23b`. `.env.example` y `apps/desk/.env.example` no aparecen en
  `git diff --stat ae5aaf4..b1347e0 -- '*.env.example'` (salida vacía); **su contenido no se ha leído desde
  esta sesión**, igual que advierte `DEPLOY.md:169-172` en `c2b2888`.

**El escritor nuevo de F1B-08 SÍ manda correo, y no tiene interruptor propio: usa el que ya existe.** Las
alarmas crean avisos en la campana y, **después** de todas las transacciones, los mandan por el canal de
correo de los avisos (`apps/desk/server/services/alarmasSla.ts:126-136`, `dispararAvisos`). Ese canal ya
está gobernado por `N8N_AVISOS_WEBHOOK_URL`, que **nace apagada** (`packages/zoho-sync/src/config.ts:114`,
`|| ''`) y está documentada con sus dos frases en `DEPLOY.md:131-140`. Con la variable vacía,
`dispararAvisos` no manda nada y devuelve el motivo (`apps/desk/server/avisosWebhook.ts:58`); la campana
avisa igual. **Por eso no es un interruptor sin documentar.** Si el canal está encendido en producción hoy
**no está verificado** desde el repositorio: decide si el Coordinador Comercial recibe correo o sólo campana.

⚠️ **Lo que sí queda mal documentado — `AVISOS_COPIA_EMAIL`.** Cada aviso de alarma sale marcado
`conCopia: true` (`apps/desk/server/services/alarmasSla.ts:118`), y `dispararAvisos` manda copia a
`AVISOS_COPIA_EMAIL` de todo aviso con esa marca (`apps/desk/server/avisosWebhook.ts:71-75`).
`DEPLOY.md:159-160` en `c2b2888` dice que esa variable recibe copia «de los avisos de derivación dirigidos a otras
personas». **Desde `ad2b97b` recibe también la copia de todas las alarmas de SLA.** No se ha añadido
ninguna variable, así que no es un interruptor nuevo sin documentar; es el **alcance** de uno documentado
el que creció sin que `DEPLOY.md` lo diga. No bloquea: la variable «vacía —lo normal— no copia nada»
(`DEPLOY.md:161-162` en `c2b2888`). Acción de persona antes del Deploy: §6.1.7. Corregir `DEPLOY.md` queda fuera de este
documento.

**Los escritores de F1B-11 siguen sin interruptor, y sigue sin ser un defecto:** el aviso de discrepancia de
OV (`apps/desk/server/services/avisoDiscrepanciaOV.ts:24-46`, cableado en `apps/desk/server/index.ts:23`) y
el de ritmo de contrato (`apps/desk/server/services/avisoRitmoContrato.ts:25-37`) escriben **sólo** en la
bandeja: «`crearAviso` no rellena `enviado_at` ni llama al canal de correo»
(`apps/desk/server/services/avisoRitmoContrato.ts:21`).

**Lo que sí existe y conviene no confundir:**

- `APP_ENTRYPOINT` elige qué proceso arranca la imagen (`Dockerfile:27-29`). Ya estaba en `ae5aaf4`.
- **La pasada de alarmas y la de ritmo cuelgan del intervalo de sincronización** que ya existía
  (`SYNC_INTERVAL_MS`, `packages/zoho-sync/src/config.ts:88`, 180.000 ms por defecto). La cadena de cada
  ciclo es, en este orden, **alarmas → ritmo de contratos → sincronización** (`apps/desk/server/index.ts:88`).
  No hay llamada al arrancar: la **primera pasada** llega al primer tic del `setInterval`, unos tres minutos
  después de arrancar con el valor por defecto (`apps/desk/server/index.ts:84-93`). Las dos pasadas nunca
  lanzan (`apps/desk/server/services/alarmasSla.ts:141-146`; `apps/desk/server/services/avisoRitmoContrato.ts:70-74`).
- La **zona horaria** de las horas hábiles es `America/Bogota` (`packages/shared/src/fechasDerivadas.ts:13`;
  jornada L-V 08:00-17:00 en `packages/shared/src/calendarioLaboral.ts:13-14`). Es la misma que usan las
  fechas derivadas y la vigencia de contratos; su resolución dentro del contenedor está sin comprobar
  (§6.3.7, tarea de F1A-07).
- Las funciones nuevas del worker cuelgan de credenciales y flags **que ya existían** (`DEPLOY.md:189-198` en `c2b2888`).

---

## 4 · Procedimiento

### 4.1 · Copia de la base ANTES del Deploy

**Es obligatoria y no es higiene: es la única red.** Gerencia decidió no montar copia de pruebas y aceptó
por escrito que todo despliegue se prueba sobre la aplicación que usa la gente
(`openspec/config.yaml:1705-1707`, `decision/e013b-copia-pruebas`), y decidió que haya **copia previa a cada
cambio que se suba**, con responsable **Alfonso (Gerencia)** (`openspec/config.yaml:2253-2259`,
`decision/p55-backup`, consecuencia (1) en `:2261`).

**Esta vez pesa todavía más que el 2026-09-29**, porque a lo que la reversión de código no deshace
(asociaciones, contratos, marcas de fila) se suman tres cosas nuevas: tickets nacidos en `Solicitud Soporte`,
la columna `modalidad` con valores, y las marcas y el corte de las alarmas (§4.5).

**Cómo:** `DEPLOY.md` **no describe** ningún procedimiento de copia. Lo siguiente es **hipótesis**, no
procedimiento verificado: una copia lógica de la base `desk` con `pg_dump` desde un contenedor que llegue al
servicio `desk-db`, con la cadena de conexión que da EasyPanel en la variable `DATABASE_URL` del servicio
App —el **nombre** de la variable, nunca su valor en un chat—:

```bash
# HIPÓTESIS de procedimiento: no está en DEPLOY.md ni verificado contra EasyPanel.
pg_dump --format=custom --file=desk_antes_de_b1347e0.dump "$DATABASE_URL"
```

Criterio de hecho, sea cual sea el método: **existe un fichero de copia con fecha de hoy, fuera del
servidor, y su tamaño no es cero.** La copia nocturna del adelanto de `p55-backup`, si ya estuviera en
marcha, no sustituye a ésta: puede tener horas de antigüedad. Ningún documento del repositorio registra que
esa copia nocturna esté funcionando.

`zoho-hub` **no necesita copia por este paquete** en el mismo sentido: sus cambios son aditivos (§2.2,
§2.3) y su contenido se puede volver a traer de Zoho. Hipótesis: rehacerlo cuesta un backfill completo.

### 4.2 · Publicar

**`DEPLOY.md` ya cubre el mecanismo. No se repite aquí.**

- **App:** `DEPLOY.md` §5 «Desplegar» (`DEPLOY.md:174-177` en `c2b2888`) — botón **Deploy** en EasyPanel; el server corre
  `migrate` en el arranque; luego se abre el dominio.
- **Worker `hub-sync`:** `DEPLOY.md` §7 (`DEPLOY.md:183-202` en `c2b2888`). Mismo repositorio y misma imagen, arranque
  `npm run start:hub-sync`. Desde `3f9d23b` sólo le llega código compartido que no usa (el nacimiento de
  soporte remoto en `createTicket` y las columnas de la migración). Conviene redesplegarlo, pero es
  **independiente** de la App. Qué versión corre hoy el worker **no está verificado** en ningún documento
  del repositorio (hipótesis: la misma época que la App).
- **Idempotencia de la migración:** `DEPLOY.md:224` en `c2b2888`. Cierta para este rango (§2.2), con la salvedad de la
  tolerancia por sentencia.
- **Orden con la replicación lógica:** no aplica (§2.1).
- **Publicar `b1347e0` entero, no un commit intermedio** (§7). Las dos tandas nuevas lo piden por escrito:
  «desplegar los tres lotes juntos»
  (`openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/tasks.md:416`) y «se despliegan los cuatro
  lotes juntos» (`openspec/changes/archive/2026-09-29-alarmas-horas-habiles/tasks.md:333`).

### 4.3 · Lo que este rango cambia en la imagen y `DEPLOY.md` no dice

`f962e81` añadió al `Dockerfile` `COPY scripts ./scripts` antes del `npm ci` de la etapa de ejecución
(`Dockerfile:19-22`), porque `package.json` tiene un script `prepare` (`package.json:11`) que corre
`scripts/instalar-hooks.mjs` en cada `npm ci`. Ese script **nunca falla `npm ci`**: sin `.git` o sin
binario `git` sale con 0 (`scripts/instalar-hooks.mjs:19-23`), y `.git` no entra en la imagen
(`.dockerignore`).

**Desde `dcb5c99` no cambia nada de lo que decide cómo se construye la imagen**, tampoco después de
`3f9d23b` (cabecera). La construcción local del 2026-09-27 sobre `10453a9` (Docker 29.6.2, `--no-cache`,
salida 0; `docs/sdd/Paquete_de_Despliegue_2026-09-27.md:196-199`) sigue siendo representativa **del
procedimiento de construcción**. Que la imagen de `b1347e0` construya igual es **hipótesis**: el código
cambió y la imagen no se ha vuelto a construir. **Si el Deploy falla en el build**, mirar el `npm ci` y este
`COPY`.

### 4.4 · Comprobar que producción está en el commit publicado

**Mismo método que el 2026-09-10** (`docs/sdd/Paquete_de_Despliegue_2026-09-10.md:22`): el bundle principal
que sirve producción tiene que ser **byte a byte** el que sale de construir el commit.

1. Construcción local de `b1347e0`, hecha el 2026-09-29 con `npm run build`:
   - fichero: `dist/assets/index-D1PHIhoj.js` (374,20 kB)
   - sha256: `69794759a44cd85677abebcee6a3cf2397e06f0bbe3f570c087db15cd8d71cbb`
2. En producción, abrir `https://ambientalia-desk.ambientalia.cloud/`, ver en el código fuente de la página
   qué `index-*.js` carga, descargarlo y calcular su sha256.
3. **Nombre y sha256 iguales ⇒ producción ≡ `b1347e0`.** Desde ese momento, «sin desplegar» se cuenta desde
   `b1347e0` y no desde `ae5aaf4`.

*Límite del método:* la construcción de referencia se hizo en Windows y la de producción en
`node:22-alpine`. Que den los mismos bytes es **hipótesis**; el 2026-09-10 salieron iguales para `ae5aaf4`.
Si el nombre coincide y el sha256 no, no concluir nada: reconstruir en Linux antes. Y el bundle **sólo
prueba el cliente**: el servidor sale de la misma imagen (`Dockerfile:1-29`), así que se infiere.

**Y que la migración entró — obligatorio, en los minutos siguientes al Deploy (§2.2).** En la consola de
PostgreSQL de producción, base `desk`, **sólo lectura**:

```sql
BEGIN READ ONLY;

SELECT to_regclass('public.calendario_cierres') AS cierres,
       to_regclass('public.equipos_cambios')    AS cambios,
       to_regclass('public.ov_asociaciones')    AS asociaciones,
       to_regclass('public.contratos')          AS contratos,
       to_regclass('public.alarmas_avisadas')   AS alarmas_avisadas,
       to_regclass('public.alarmas_corte')      AS alarmas_corte;
-- Deben salir los seis nombres, ninguno NULL.

SELECT table_schema, table_name, column_name
  FROM information_schema.columns
 WHERE (table_schema, table_name, column_name) IN (
        ('desk','tickets','history_synced_at'),
        ('desk','tickets','ov_elegida_en_app_at'), ('desk','tickets','ov_zoho_avisada'),
        ('desk','tickets','modalidad'),
        ('desk','equipos','fecha_adquisicion'),    ('desk','equipos','fecha_factura_compra'),
        ('desk','equipos','fin_garantia'),         ('desk','equipos','codigo_interno'),
        ('desk','equipos','mantenedor_id'),        ('desk','equipos','drive_url'),
        ('public','remisiones','hay_novedad'))
 ORDER BY 1, 2, 3;
-- Deben salir 11 filas. Si falta ('desk','tickets','modalidad'), no se puede crear ningún ticket (§2.2).

SELECT indexname FROM pg_indexes
 WHERE schemaname = 'public'
   AND indexname IN ('idx_equipos_cambios_equipo', 'idx_ov_asoc_numero_vigente', 'idx_ov_asoc_so_vigente',
                     'idx_ov_asoc_ticket', 'idx_contratos_lote', 'idx_contratos_cliente')
 ORDER BY 1;
-- Deben salir 6 filas.

SELECT conname FROM pg_constraint WHERE conname = 'contratos_fin_no_antes_de_inicio';
-- Debe salir 1 fila.

SELECT conrelid::regclass AS tabla, pg_get_constraintdef(oid) AS clave
  FROM pg_constraint
 WHERE contype = 'p'
   AND conrelid IN (to_regclass('public.alarmas_avisadas'), to_regclass('public.alarmas_corte'))
 ORDER BY 1;
-- Deben salir 2 filas: alarmas_avisadas con PRIMARY KEY (ticket_id, estado, entrada_at)
-- y alarmas_corte con PRIMARY KEY (id).

SELECT count(*) AS filas_corte, min(corte_at) AS corte FROM public.alarmas_corte;
-- 0 filas justo después del Deploy; 1 fila tras la primera pasada (unos 3 minutos).
-- Nunca más de 1. Anotar el valor de `corte`: es el instante que separa lo que se marca
-- en silencio de lo que avisa (§5.1).

ROLLBACK;
```

Si falta algo, buscar `migrate: sentencia omitida` en el log del servicio App (§2.2) y **pasar a §4.5**: con
`modalidad`, `public.contratos` o las columnas de `tickets` de F1B-11 ausentes, el alta de tickets o la
sincronización están rotas, y no es un estado en el que se pueda dejar la app mientras se investiga.

**Y que la App arrancó sin errores nuevos.** Tras el primer ciclo (unos tres minutos,
`packages/zoho-sync/src/config.ts:88`), en el log del servicio App:

- **No** debe aparecer `pasadaAlarmas falló` (`apps/desk/server/services/alarmasSla.ts:145`), ni
  `alarma de SLA: falló un ticket` (`:121`), ni `pasadaRitmoContratos falló`
  (`apps/desk/server/services/avisoRitmoContrato.ts:73`), ni el `warn` «no se pudo leer la marca «esperando
  aprobación del cliente»» (`apps/desk/server/db/alarmasAvisadas.ts:32`).
- **Puede** aparecer, **una vez**, `alarmas de SLA vencidas antes del corte: marcadas sin avisar (S-13)`
  (`apps/desk/server/services/alarmasSla.ts:124`). Es lo esperado si había tickets ya vencidos.
- **Puede** aparecer `Alarma de SLA sin Coordinador Comercial: aviso al área Comercial` (`:114`). Es lo
  esperado si P.1 de `alarmas-horas-habiles` salió vacía (§6.1.3); no es un error.

### 4.5 · Reversión

**Volver atrás = redesplegar `ae5aaf4` desde EasyPanel** (`DEPLOY.md` §5). **La base no hay que tocarla**
para que `ae5aaf4` funcione, y se ha comprobado sentencia a sentencia por qué:

- Las once columnas nuevas sobre tablas existentes son **anulables y sin `DEFAULT`** (§2.1). Los `INSERT` de
  `ae5aaf4` nombran sus columnas y no incluyen éstas, así que les llega `NULL`. No hay **ningún `NOT NULL`
  nuevo sobre una tabla que `ae5aaf4` escriba**.
- Las seis tablas nuevas **no las nombra `ae5aaf4`**: `git grep` de sus seis nombres sobre `ae5aaf4 -- apps
  packages` no da ninguna coincidencia, y su `schema.sql` termina en la línea 448. Sus restricciones no pueden
  rechazar nada que escriba el código viejo. Ninguna tiene clave foránea.
- El `migrate` de `ae5aaf4` sólo reaplica su `schema.sql`, que es un prefijo del nuevo
  (`packages/zoho-sync/src/db/schema.sql:1-448` no cambia en el rango).

**Lo que la reversión de código NO deshace, y hay que saberlo antes de pulsar.** Las tres primeras son
nuevas en este paquete; el resto venía del 2026-09-29, re-comprobado.

- **(a) Los tickets en `Solicitud Soporte` se quedan sin salida.** En `ae5aaf4` ese estado **no existe**:
  `git show ae5aaf4:packages/shared/src/transitions.ts` tiene **0** coincidencias de `Solicitud Soporte`, y
  `git grep "Solicitud Soporte" ae5aaf4 -- packages apps` también **0** (en `3f9d23b`, igual: 0). Ninguna
  transición parte de ahí, así que **con el código viejo un técnico no ve ningún botón** en esos tickets, y
  el tablero los pone en la columna «Otros», que recoge todo estado sin columna propia
  (`packages/shared/src/columns.ts:34`, `:45-47` en `ae5aaf4`). Son **todos los SR creados desde la app
  después del Deploy**, porque ahí nacen (`packages/shared/src/flujos.ts:138-139`). **Qué hacer:** antes de
  revertir, contarlos con `SELECT count(*) FROM desk.tickets WHERE status = 'Solicitud Soporte';`
  (`openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/tasks.md:414-415`). Moverlos a otro estado
  es **dato de producción y decisión de persona** (Gerencia con Servicio Técnico), no de este documento. La
  alternativa sin tocar datos es no revertir mientras haya alguno, o volver a publicar `b1347e0` en cuanto se
  pueda: con el código nuevo recuperan «Asignación».
  Los SR **heredados** que S-6 pasó al flujo remoto no se quedan varados al revertir: `En Proceso`,
  `Pendiente` y `Finalizado` son estados del grafo de servicio de `ae5aaf4` (por ejemplo, `from: ['En
  Proceso']` y `from: ['Pendiente']` en `ae5aaf4:packages/shared/src/transitions.ts:206` y `:230`), así que
  vuelven a ver las salidas de servicio. Cambian de camino por segunda vez, que es lo que hay que avisar.
- **(b) Las marcas y el corte de las alarmas se quedan congelados — y al volver a publicar, lo vencido entre
  medias AVISA.** Mientras corra `ae5aaf4`, nadie lee ni escribe `public.alarmas_avisadas` ni
  `public.alarmas_corte` (las dos nacen en este rango; el `ticketsConSlaVencido` de `ae5aaf4` no tiene
  ningún llamador, `git grep` sobre `ae5aaf4` sólo lo encuentra en su propia definición). El tablero pierde
  la marca «Esperando aprobación del cliente», porque la calcula el servidor nuevo
  (`apps/desk/server/routes/tickets.ts:115`). **Al volver a publicar `b1347e0`**, la primera pasada **no
  reescribe el corte**: el `INSERT` lleva `ON CONFLICT (id) DO NOTHING` y luego se lee la fila que ya había
  (`apps/desk/server/services/alarmasSla.ts:61-63`). Una entrada sólo se marca en silencio si **ya estaba
  vencida en ese corte viejo** (`apps/desk/server/db/sla.ts:59`, `vencidoEnCorte`; `apps/desk/server/services/alarmasSla.ts:102-104`).
  Todo lo que venció **durante** la ventana revertida no estaba vencido en el corte y no tiene marca
  (`:100`), así que **avisa en la primera pasada tras republicar, con correo si el canal está encendido**.
  Esto se razona leyendo el código; **cuántos avisos serían depende de cuánto dure la reversión y no es
  comprobable desde aquí (hipótesis sobre el volumen)**. Si la reversión dura días, conviene saberlo antes
  de republicar; qué hacer con esa ráfaga (aceptarla o tocar el corte a mano) es decisión de persona sobre
  datos de producción.
- **(c) `tickets.modalidad` se queda con valores**, y la columna y las seis tablas nuevas **no se borran**.
  El código viejo no la nombra: sus `INSERT` la dejan en `NULL` y su lectura no la usa. Hipótesis de
  `openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/tasks.md:413`: `SELECT t.*` sólo añade una
  propiedad que nadie consume. Al republicar, los SR creados con `ae5aaf4` durante la ventana tendrán
  `modalidad` `NULL` y habrán nacido en `Ticket creado` (el nacimiento viejo); siguen en servicio, porque
  `Ticket creado` no es estado del catálogo remoto (`packages/shared/src/flujos.ts:57`, `:122-124`).
- **Un ticket que haya llegado a `Verificación` se queda sin salida.** En `ae5aaf4`,
  `packages/shared/src/transitions.ts` no menciona `Verificación` ni una vez. Igual que (a): la reversión, si
  se decide, conviene **antes** de que alguien use esa transición.
- **La protección de la orden de venta se apaga, pero las marcas se quedan.** El `upsertTicket` de `ae5aaf4`
  no lee `ov_elegida_en_app_at`, así que el sincronizador vuelve a sobrescribir `orden_venta` y
  `fecha_orden_venta` en las filas marcadas. Al republicar, las marcas vuelven a proteger, con el valor que
  el sincronizador haya dejado entre medias.
- **Las asociaciones se congelan.** Mientras corra `ae5aaf4`, nadie escribe en `public.ov_asociaciones`, y la
  tercera puerta de la remisión desaparece (en `ae5aaf4` responde 201 con una OV ya usada,
  `docs/sdd/Paquete_de_Despliegue_2026-09-27.md:313`). Al republicar, *hipótesis*: una OV vigente que el
  código viejo haya puesto en las columnas de otro ticket haría que las tres puertas digan «ya asociada»
  para los dos, y habría que liberarla a mano desde la ficha.
- **Las prioridades `High` puestas por contrato se quedan**, y los contratos siguen en `public.contratos` sin
  que nadie los lea.
- **Los datos escritos por la versión nueva se quedan** y la vieja no los enseña: campos comerciales del
  equipo, `public.equipos_cambios`, la respuesta de novedad, los cierres, las asociaciones, los contratos,
  la modalidad y las marcas de alarma. Los avisos ya creados en la campana **sí** los enseña la vieja (la
  bandeja ya existía), y **los correos de alarma ya enviados no se recuperan**.
- Un ticket «Equipo nuevo» que avanzó por el flujo nuevo hasta `En Proceso` vuelve a ver las transiciones de
  servicio. No se queda varado, pero cambia de camino a mitad.

**No es una salida probada volver a `3f9d23b`** (el paquete anterior) para quitar sólo lo nuevo: ese commit
**nunca estuvo en producción**, así que no hay nada verificado sobre él en el entorno real. La salida
documentada es `ae5aaf4`.

**Volver al estado exacto de la base anterior** —no sólo al código— es restaurar la copia de §4.1. Se pierde
**todo** lo escrito después del Deploy. Los tickets que vienen de Zoho los vuelve a traer la sincronización
(hipótesis: la siguiente pasada incremental; un backfill completo sólo si la tabla queda vacía,
`apps/desk/server/index.ts:61-69`). El procedimiento es **hipótesis**:

```bash
# HIPÓTESIS: no está en DEPLOY.md ni verificado contra EasyPanel. Con la App PARADA.
pg_restore --clean --if-exists --dbname="$DATABASE_URL" desk_antes_de_b1347e0.dump
```

Sólo tiene sentido **junto con** redesplegar `ae5aaf4`. Orden: parar la App, restaurar, desplegar `ae5aaf4`.
Restaurar la copia también borra `public.alarmas_corte`: si después se vuelve a publicar `b1347e0`, la
primera pasada fija un corte **nuevo** y todo lo vencido en ese momento se marca en silencio, sin ráfaga.

**Señales que obligan a volver atrás:**

| Señal observable | Dónde se ve | Qué significa |
|---|---|---|
| Falta una tabla, columna, índice, el `CHECK` o una clave primaria en la consulta de §4.4 | Consola de PostgreSQL | Migración omitida (§2.2). Revertir y leer el log |
| El tablero se queda en blanco tras el Deploy | Cualquier vista | Fallo de arranque o del `dist/`. Revisar logs del servicio App |
| El build falla en EasyPanel | Pestaña de despliegue | Ver §4.3. Producción sigue en `ae5aaf4`: no hay nada que revertir |
| **No se puede crear ningún ticket** (500), de ninguna clasificación | «Nuevo ticket» → «Crear ticket» | Falta `desk.tickets.modalidad` (`packages/zoho-sync/src/db/repo.ts:420-422`), `public.contratos` o la marca de `tickets` (§2.2) |
| **El buscador de orden de venta sale siempre vacío**, también con órdenes que nadie usa | Alta de ticket, remisión o transición con OV | Falta `public.ov_asociaciones` (`packages/zoho-sync/src/books/repo.ts:159-162`) |
| **Los tickets dejan de actualizarse desde Zoho** y el log repite errores de `upsertTicket` | Tablero, y log del servicio App | Faltan las columnas de `tickets` de F1B-11 (`packages/zoho-sync/src/db/repo.ts:67`) |
| **No se puede crear ninguna remisión** | Ficha de ticket → «Crear remisión» | La guarda de novedad (`apps/desk/server/routes/remision.ts:290-291`) o la pregunta obligatoria (`apps/desk/src/components/CrearRemision.tsx:100`) bloquean de más |
| **Un ticket de servicio que no es «Equipo nuevo» ni «Soporte remoto» ve botones de otro flujo** | Ficha del ticket | El enrutado de flujos (`packages/shared/src/flujos.ts:56-61`) está fallando |
| **Un alta que no es de soporte remoto responde 422 «La modalidad sólo aplica a los tickets de soporte remoto»** | «Crear ticket» | El cliente manda `modalidad` donde no debe (`packages/shared/src/flujos.ts:162`; el cliente sólo la manda si el selector es visible, `apps/desk/src/components/CreateTicket.tsx:230`) |
| Errores 500 al guardar un equipo | Equipos → Editar | Falta una columna de §2.1: comprobar con §4.4 |

**Señal que NO obliga a revertir pero sí a investigar en el momento:** que la **primera** pasada mande
correos de alarma a la vez por tickets que ya estaban vencidos antes del Deploy. No debería ocurrir (el
corte los marca en silencio, S-13); si ocurre, el corte no se escribió como se espera. Revertir **no
recupera** los correos enviados, y detendría las alarmas: mirar `public.alarmas_corte` y el log primero.

**Señales que NO son motivo de reversión:** una OV que ya no sale en el buscador porque está en otro ticket o
en cuarentena; un 422 con «tiene un sufijo que no es canónico» o «su contrato nº N venció»; un ticket nuevo
que nace `High`; un ticket «Equipo nuevo» con «Ingreso equipo nuevo»; un ticket en `Verificación` o en
`Solicitud Soporte` en la columna «Otros»; un SR en `Pendiente` que sólo ofrece «Continuación soporte»
(S-6); un usuario sólo de Comercial que recibe 403 en las cuatro transiciones de soporte remoto (S-1,
§5.3); el 422 «El equipo llegó con novedad y la remisión no tiene fotos»; avisos de alarma a partir del
segundo ciclo por tickets que vencen **después** del corte; el `warn` «Alarma de SLA sin Coordinador
Comercial».

---

## 5 · Cambios de comportamiento

Producción no tiene **ninguno** de los de esta sección. La tanda de cada cambio sale de la cabecera `tanda:`
de su `proposal.md` o `archive-report.md` archivado.

### 5.1 · Las dos tandas posteriores al paquete del 2026-09-29

| Cambio archivado (`tanda`, `cierra`) | Commits | Qué ve el usuario | Ruta:línea que lo produce |
|---|---|---|---|
| `2026-09-29-blueprint-soporte-remoto` (**F1B-06**, `cierra: si`: cambio 2 de 2, cierra la fila, `openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/archive-report.md:7-8`) | `8fb8efd`, `93e8b15`, `30b2019` | **(1) Flujo propio para los tickets «Soporte remoto»**, con cuatro transiciones de `Servicio Técnico`: «Asignación» (`Solicitud Soporte` → `En Proceso`), «Ejecutar» (`En Proceso` → `Finalizado`), «Soporte pendiente» (`En Proceso` → `Pendiente`) y «Continuación soporte» (`Pendiente` → `En Proceso`). **(2) Nacimiento en `Solicitud Soporte`**: un alta de clasificación «Soporte remoto» nace ahí; las demás siguen naciendo en `Ticket creado`. **(3) Selector «Modalidad»** (Remoto / En sitio), visible sólo con esa clasificación y preseleccionado en «Remoto»; la ficha enseña «· Modalidad: …». Sin selector, el servidor pone `remoto`; un valor distinto de `remoto` o `en sitio`, o una modalidad en otra clasificación, → 422. La modalidad no se edita después. **(4) `Solicitud Soporte` cae en la columna «Otros»** del tablero (S-10). **(5) S-6, cambio visible sobre tickets existentes: abajo** | Catálogo: `packages/shared/src/transitions.ts:388-397` (áreas en `:389`, `:391`, `:393`, `:395`). Enrutado: `packages/shared/src/flujos.ts:57`. Nacimiento: `packages/shared/src/flujos.ts:138-139`, usado en `packages/zoho-sync/src/db/repo.ts:418-422`. Modalidad: dominio `packages/shared/src/flujos.ts:143`, regla `:151-162`, guarda del alta `apps/desk/server/services/ticketService.ts:91`; selector `apps/desk/src/components/CreateTicket.tsx:422`, envío `:230`; lectura `apps/desk/src/components/TicketProperties.tsx:144`. Estado: `packages/shared/src/estados.ts:105`, excluido del grafo de servicio en `:182` |
| `2026-09-29-alarmas-horas-habiles` (**F1B-08**, `cierra: no`: deja fuera las «vistas equivalentes a Zoho», `openspec/changes/archive/2026-09-29-alarmas-horas-habiles/archive-report.md:16-20`) | `55eac92`, `c84f875`, `ad2b97b`, `b159c6b` (+ `1843dff`, `2d2805c`, sólo documentación) | **(1) Tres alarmas de SLA en horas hábiles** (L-V 08:00-17:00 en `America/Bogota`, sin festivos de Colombia ni cierres de `public.calendario_cierres`): `Notificado` **9 h**, `Remisión creada` **27 h** —sólo si el ticket no tiene orden de venta por **ninguna** vía: columna, `salesorder_id` o asociación vigente— y `Notificación cliente` **36 h**. **(2) Aviso en la campana** al usuario activo con cargo `Coordinador Comercial` (texto: «El ticket #N lleva más de H horas hábiles en «Estado» (entró el …)», con «y sigue sin orden de venta» o «, esperando aprobación del cliente» según el caso), y **correo** por el canal de avisos si está encendido. **Si nadie tiene ese cargo**, al área Comercial —y, por cómo está hecho ese reparto, a **todos los administradores activos**— con un `warn` en el log. **(3) Una alarma por entrada**: reentrar en el estado vuelve a avisar; dos pasadas no duplican. **(4) En el tablero, la tarjeta de un ticket vencido en `Notificación cliente` muestra «Esperando aprobación del cliente»** (reloj de arena ámbar); deja de mostrarlo al salir del estado. No es un estado nuevo. **(5) El día del Deploy, corte (S-13): abajo.** Sólo cuentan los tickets del flujo de servicio que tienen foto de entrada en `ticket_transitions`, es decir, los que esta app ha movido | Umbrales: `packages/shared/src/sla.ts:32-35`; destinatarios: `:137-141`; reloj: `:52-55` sobre `packages/shared/src/calendarioLaboral.ts:174`, jornada `:13-14`. Consulta: `apps/desk/server/db/sla.ts:40-63` (sólo servicio `:48-49`, sin foto no se mide `:56`, cierres en cada llamada `:46`, OV por tres vías `:57`). Pasada: `apps/desk/server/services/alarmasSla.ts:80-138`, cableada en `apps/desk/server/index.ts:88`. Cargo: `apps/desk/server/db/avisos.ts:104-113`; respaldo al área con administradores `:68`, `:89`. Texto: `apps/desk/server/services/alarmasSla.ts:66-70`. Marca de tablero: servidor `apps/desk/server/db/alarmasAvisadas.ts:16-35` y `apps/desk/server/routes/tickets.ts:115`; pintura `apps/desk/src/components/TicketCard.tsx:98-101` |

**S-6 — cambio visible sobre tickets que YA existen (`blueprint-soporte-remoto`, W1 de su
`openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/archive-report.md:32-39`).** El enrutado decide el flujo por clasificación **y** estado actual: un ticket
«Soporte remoto» va al flujo remoto si su estado es uno de los cuatro del catálogo
(`packages/shared/src/flujos.ts:57`, `:122-124`). Por tanto, **el día del Deploy, sin tocar ningún dato**:

| SR heredado en… | Hoy ve (servicio, `ae5aaf4`) | Desde el Deploy ve |
|---|---|---|
| `En Proceso` | Las salidas de servicio de `En Proceso` (solicitud de repuestos, marcar pendiente, finalización de servicio, calibración…) | Sólo «Ejecutar» y «Soporte pendiente» |
| `Pendiente` | Las salidas de servicio de `Pendiente` («Servicio externo», «Diagnóstico complementario»…) | **Sólo «Continuación soporte»** |
| `Finalizado` | Nada | Nada (sin cambio práctico) |
| Cualquier otro estado | Servicio | **Servicio, sin cambio** |

**Recuento: SIN MEDIR.** La P.1 de `blueprint-soporte-remoto` no tiene resultado: su `openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/tasks.md:404` dice
«Resultado (a rellenar por Alfonso): `_________`», su `openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/archive-report.md:97` la da por pendiente, y en
`docs/sdd/` no hay ningún fichero versionado con ese recuento (`grep -rln "criterio_codigo" docs/sdd/` →
vacío). La consulta de sólo lectura está en §6.1.2. La propia propuesta dice que **P.1 no bloquea**, «S-6 no
toca datos, sólo cómo se leen» (`openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/proposal.md:133`).

**Las alarmas el día del Deploy — corte de S-13, ráfaga APAGADA.** La primera pasada (unos tres minutos
después de arrancar, §3) escribe el corte en `public.alarmas_corte` (`apps/desk/server/services/alarmasSla.ts:61`).
Todo lo que **ya estaba vencido en ese instante** se marca con **cero avisos y sin correo**
(`apps/desk/server/services/alarmasSla.ts:102-104`), pero **la marca de tablero sí sale**, porque se lee de la
marca (`apps/desk/server/db/alarmasAvisadas.ts:24-28`). Lo que venza después avisa con normalidad. Un
reinicio o un redespliegue **no mueven el corte** (`apps/desk/server/services/alarmasSla.ts:61`, `ON CONFLICT (id) DO NOTHING`).
Encender la ráfaga es la P.3 de `alarmas-horas-habiles` (§6.1.4).

**Lo que cambia de verdad en `Notificado`, y una precisión a la nota de despliegue de la tanda.** La nota
(`openspec/changes/archive/2026-09-29-alarmas-horas-habiles/tasks.md:327`) dice que `Notificado` «pasa de 24 h
de reloj a 9 h HÁBILES». Es cierto **del código**: `SLA_HORAS_POR_ESTADO` valía `{ 'Notificado': 24 }`
(`packages/shared/src/sla.ts:32-35` en `3f9d23b`). **No lo es de lo que ve un usuario de producción**: en
`ae5aaf4` y en `3f9d23b` la consulta `ticketsConSlaVencido` **no tenía ningún llamador** (`git grep
ticketsConSlaVencido ae5aaf4 -- apps packages ':!*.test.ts'` sólo encuentra su definición,
`apps/desk/server/db/sla.ts:40` en `ae5aaf4`; ídem en `3f9d23b`). El plazo de 24 h nunca avisó a nadie. **Para
el equipo, las tres alarmas son nuevas**, `Notificado` incluida. Lo que sí vale de la nota: en días
laborables la de `Notificado` salta antes que 24 h, y en fin de semana más tarde.

**La nota de despliegue de `alarmas-horas-habiles`, sus seis puntos, y dónde está cada uno en este
paquete** (literal en `openspec/changes/archive/2026-09-29-alarmas-horas-habiles/tasks.md:324-333`):

| Punto de la nota | Dónde está aquí |
|---|---|
| 1 · Dos tablas nuevas, sin relleno | §2.1 (sentencias 22-23), §4.4 |
| 2 · `Notificado` a 9 h hábiles | §5.1, con la precisión de arriba |
| 3 · Dos alarmas nuevas y la marca de tablero | §5.1 |
| 4 · Corte de S-13 | §5.1, §4.4 (`filas_corte`), paso 6 de P.2 en §6.3.1 |
| 5 · A quién, y el `warn` sin Coordinador Comercial | §5.1, §4.4, P.1 en §6.1.3 |
| 6 · P.1, P.3 y P.4 de la tanda | §6.1.3, §6.1.4, §6.4 |

### 5.1 bis · F1B-11 — los tres cambios que ya recogía el paquete del 2026-09-29

Los tres llevan `tanda: F1B-11` y `cierra: no`: la fila sigue abierta porque falta la ampliación de
contrato, bloqueada por E-086 (`openspec/changes/archive/2026-09-29-registro-contrato/archive-report.md:21-23`).
Re-comprobados contra `b1347e0`: de los ficheros que citan, sólo `apps/desk/server/index.ts`,
`apps/desk/server/services/ticketService.ts` y `packages/zoho-sync/src/db/repo.ts` cambian después de
`3f9d23b`, y **ninguna de las líneas citadas se ha movido** (los cambios caen en las mismas líneas o
después). Cambia lo que dicen dos de ellas, y se dice abajo.

| Cambio archivado (`cierra`) | Qué ve el usuario | Ruta:línea que lo produce |
|---|---|---|
| `2026-09-28-parche-iv11-orden-venta` (`cierra: no`) | **Nada en pantalla, salvo un aviso nuevo.** Una orden de venta elegida en la app deja de ser sobrescrita por la sincronización. Si Zoho trae otra distinta, Comercial recibe en la campana: «Zoho trae la orden de venta X para el ticket #N, pero la aplicación tiene Y. Se conserva la de la aplicación: revise cuál es la correcta.» Un solo aviso por ticket mientras el valor de Zoho no cambie | Marca: alta `packages/zoho-sync/src/db/repo.ts:418` (la misma línea calcula hoy también el estado inicial del alta), transición `:305`, remisión `apps/desk/server/routes/remision.ts:240`. Protección: `packages/zoho-sync/src/db/repo.ts:73-78`. Detección: `:79`. Aviso: `apps/desk/server/services/avisoDiscrepanciaOV.ts:38`, anti-ruido `:30`. Cableado: `apps/desk/server/index.ts:23` |
| `2026-09-28-asociacion-ov-ticket` (`cierra: no`) | **(1)** El buscador de OV ya no ofrece las OV de otro ticket ni las OV en cuarentena. **(2)** Las tres puertas rechazan una OV en cuarentena con 422. **(3)** «Aprobación» y «Aprobación y S. Repuestos» añaden un campo opcional «OV adicional». **(4)** Sección «ÓRDENES DE VENTA (N vigentes, M liberadas)» en la ficha. **(5)** Botón «Liberar» sólo para Comercial y administradores (403 / 409 / 422). **(6)** En Configuración → «Administración de datos», «Órdenes de venta: cuarentena y saldo por lote». **(7)** Eliminar un ticket libera sus asociaciones | Buscador: `packages/zoho-sync/src/books/repo.ts:159-162` y `:176`; `apps/desk/server/routes/directory.ts:57`. Cuarentena: `packages/shared/src/subOV.ts:39`; puertas: alta `apps/desk/server/services/ticketService.ts:96`, transición `:134`, remisión `apps/desk/server/routes/remision.ts:220`. OV adicional: `packages/shared/src/transitions.ts:199`, `:203`, `:374`. Ficha: `apps/desk/src/components/TicketDetailView.tsx:320`, `apps/desk/src/components/PanelOvAsociaciones.tsx:89`. Liberar: `apps/desk/server/routes/ovAsociaciones.ts:40-55`, limpieza `packages/zoho-sync/src/db/ovAsociaciones.ts:112-120`. Configuración: `apps/desk/src/components/Configuracion.tsx:127`, `:165`. Borrado: `apps/desk/server/db/eliminarTicket.ts:154` |
| `2026-09-29-registro-contrato` (`cierra: no`) | **(1)** «Contratos por lote» en Configuración, con «Nuevo contrato» para Comercial y administradores; **no hay editar ni borrar**. **(2)** Ficha del contrato con estado, saldo, informe trimestral y «Exportar CSV». **(3)** Prioridad `High` al nacer si el cliente tiene contrato vigente. **(4)** Guarda de contrato vencido en las tres puertas (422). **(5)** Marca «DE CONTRATO» en la ficha. **(6)** Aviso de ritmo a Comercial, desde el segundo trimestre y una vez por trimestre | Pantallas: `apps/desk/src/components/Configuracion.tsx:127`, `:165`; `apps/desk/src/components/ContratosPanel.tsx:24`, `:36`, `:95-116`; `apps/desk/src/components/ContratoFicha.tsx:41`, `:66`. Rutas: §5.1 ter. Prioridad: `apps/desk/server/services/ticketService.ts:106`, regla `packages/shared/src/contratos.ts:66-69`. Vencido: `apps/desk/server/services/ticketService.ts:96`, `:147`, `apps/desk/server/routes/remision.ts:220`; mensaje `packages/shared/src/contratos.ts:57`. Marca: `apps/desk/src/components/MarcaContrato.tsx:16`, `apps/desk/server/db/contratos.ts:106-115`. Ritmo: `apps/desk/server/services/avisoRitmoContrato.ts:41`, `:49`, pasada en `apps/desk/server/index.ts:88` —que desde `ad2b97b` corre **después** de la de alarmas— |

**§5.1 ter · Las rutas nuevas de F1B-11, con su guarda.** Sin cambios desde el 2026-09-29: ni
`apps/desk/server/routes/ovAsociaciones.ts` ni `apps/desk/server/routes/contratos.ts` cambian en
`3f9d23b..b1347e0`. Todas cuelgan de `requireAuth(db)` (`apps/desk/server/auth/middleware.ts:17`, `:19`), se
montan en `apps/desk/server/app.ts:61`, antes del 404 JSON de `/api` (`:73`), y el permiso sale de
`canExecuteTransition(areas, isAdmin, 'Comercial')` (`packages/shared/src/permissions.ts:4-7`).

| Método y ruta | Guarda, en orden | Ruta:línea |
|---|---|---|
| `GET /api/tickets/:id/ov-asociaciones` | Sólo sesión | `apps/desk/server/routes/ovAsociaciones.ts:26-28` |
| `GET /api/ov-asociaciones/cuarentena` | Sólo sesión | `apps/desk/server/routes/ovAsociaciones.ts:30-32` |
| `GET /api/ov-asociaciones/saldo/:lote` | Sesión → 422 si el lote no es `OV-AAAA-NNN` | `apps/desk/server/routes/ovAsociaciones.ts:34-38` (422 en `:36`) |
| `PUT /api/ov-asociaciones/:id/liberar` | Sesión → **404** (`:45`) → **403** sin Comercial (`:47`) → **409** ya liberada (`:48`) → **422** motivo vacío (`:51`) → transacción (`:53`) → 409 por carrera (`:54`) | `apps/desk/server/routes/ovAsociaciones.ts:40-56` |
| `GET /api/contratos` | Sólo sesión | `apps/desk/server/routes/contratos.ts:24-26` |
| `GET /api/contratos/:id` | Sesión → 404 | `apps/desk/server/routes/contratos.ts:28-34` (404 en `:32`) |
| `GET /api/tickets/:id/contrato` | Sólo sesión | `apps/desk/server/routes/contratos.ts:36-38` |
| `POST /api/contratos` | Sesión → **403** sin Comercial antes de leer el cuerpo (`:43`) → **422** (`:49`-`:52`) → **409** lote ya registrado (`:55`) → **409** carrera (`:59`) → 201 | `apps/desk/server/routes/contratos.ts:40-62` |
| `GET /api/contratos/:id/informe` | Sesión → 404 | `apps/desk/server/routes/contratos.ts:65-70` (404 en `:68`) |

**Las dos tandas nuevas no añaden rutas.** La marca del tablero va como un campo más del listado de tickets
activos (`apps/desk/server/routes/tickets.ts:115`), y la modalidad entra por el alta que ya existía.

**Regla 13, decisión a decisión, de los `.tsx` que cambian después de `3f9d23b`** (`CreateTicket.tsx`,
`TicketProperties.tsx`, `TicketCard.tsx`):

| Decisión del cliente | Línea del servidor que la impone |
|---|---|
| Enseñar el selector de Modalidad sólo para «Soporte remoto» (`apps/desk/src/components/CreateTicket.tsx:45`, con el predicado de `shared`) | `apps/desk/server/services/ticketService.ts:91` → `packages/shared/src/flujos.ts:162`: una modalidad en otra clasificación es 422 |
| Preseleccionar «Remoto» (`apps/desk/src/components/CreateTicket.tsx:45`) | `packages/shared/src/flujos.ts:156`: sin valor, el servidor pone `remoto` |
| Ofrecer sólo `remoto` / `en sitio` (`apps/desk/src/components/CreateTicket.tsx:422`, `MODALIDADES`) | `packages/shared/src/flujos.ts:157-159`: otro valor es 422 |
| Enseñar la modalidad en la ficha (`apps/desk/src/components/TicketProperties.tsx:144`) | Sólo pinta lo que guarda el servidor; no decide nada |
| Pintar «Esperando aprobación del cliente» sólo si el campo es `true` (`apps/desk/src/components/TicketCard.tsx:98`) | `apps/desk/server/db/alarmasAvisadas.ts:16-35`, servido en `apps/desk/server/routes/tickets.ts:115`. El cliente no calcula vencimientos |

### 5.2 · Los demás cambios del rango que tocan `apps/` o `packages/`

Todos venían ya en el paquete del 2026-09-29; se re-comprobaron sus citas contra `b1347e0`. Sólo cambian
tres filas, y se dice en cada una.

**Las tandas con efecto visible:**

| Tanda | Cambio archivado (`cierra`) | Qué ve el usuario | Ruta:línea que lo produce |
|---|---|---|---|
| **F1B-12** | `2026-09-24-calendario-laboral` (`cierra: si`) | **Nada en pantalla.** Pero **ya tiene consumidor**: los cierres dados de alta retrasan las alarmas de F1B-08, porque no cuentan como horas hábiles | Lector: `apps/desk/server/db/calendarioCierres.ts:31-34`, llamado desde `apps/desk/server/db/sla.ts:46`. Módulo: `packages/shared/src/calendarioLaboral.ts` |
| **F1B-14** (1) | `2026-09-24-alta-equipo-nuevo-en-ticket` (`cierra: no`) | Alta de ticket con equipo que aún no existe; errores «Faltan datos del equipo nuevo: …» y «Modelo no encontrado» (422) | Cliente: `apps/desk/src/components/CreateTicket.tsx:55`, bloque `:367-409`. Servidor: `apps/desk/server/services/ticketService.ts:24`, `apps/desk/server/services/equipoNuevo.ts:41` y `:44` |
| **F1B-14** (2) | `2026-09-25-edicion-comercial-equipo` (`cierra: si`) | Botón «Editar» en la hoja de vida y sección «Cambios»; sin Comercial ni administrador, tres campos en sólo lectura y 403 | Cliente: `apps/desk/src/components/HojaDeVida.tsx:204`, `:162`. Servidor: `apps/desk/server/routes/equipos.ts:107-108` y `:115` |
| **F1B-04** | `2026-09-25-foto-solo-con-novedad` (`cierra: no`) | La remisión de entrada pregunta «¿El equipo llega con novedad?»; con «Sí» exige foto; 422 sin fotos | Cliente: `apps/desk/src/components/CrearRemision.tsx:61`, `:100`, `:101`, `:353`. Servidor: `apps/desk/server/routes/remision.ts:290-291` |
| **F1B-06** (cambio 1) | `2026-09-25-blueprint-equipo-nuevo` (`cierra: no`) | Flujo propio para «Equipo nuevo» en `Ingresado`, `En Proceso`, `Notificado`, `Verificación` y `Finalizado`; `Verificación` cae en «Otros»; 409 al mezclar flujos | Enrutado: `packages/shared/src/flujos.ts:56-61` (desde `8fb8efd`, la línea `:57` evalúa **antes** el flujo de soporte remoto). Catálogo: `packages/shared/src/transitions.ts:350-363`. Botones: `apps/desk/src/components/TransitionPanel.tsx:56`. Servidor: `apps/desk/server/services/ticketService.ts:125`. Columna: `packages/shared/src/estados.ts:105` (la misma línea declara hoy también `Solicitud Soporte`). Fuera de las alarmas: `apps/desk/server/db/sla.ts:48-49` |
| **F1A-03** | `2026-09-27-salidas-verificacion` (`cierra: no`) | `Verificación` tiene dos salidas: «Liberación» a `Finalizado` y «Rechazo de verificación» a `Notificado` | `packages/shared/src/transitions.ts:359` y `:361` |
| **F1B-02** | `2026-09-23-hojas-vida` (`cierra: si`) | Seis campos comerciales en la hoja de vida, validados con 422 | `apps/desk/src/components/HojaDeVida.tsx:210-222`; `apps/desk/server/routes/equipos.ts:206` |
| **F1B-08** | `2026-09-12-por-entregar-es-espera` (`cierra: no`) | `Por Entregar` y `Por Entregar / Sin facturar` pasan a «Tickets en espera»; el color no cambia (IV-9) | `packages/shared/src/estados.ts:72-73`. Ficha: `apps/desk/src/components/ClienteDetalle.tsx:36`, `:115`, vía `apps/desk/src/lib/enEspera.ts:14`. Color: `apps/desk/src/components/ClienteDetalle.tsx:41` |
| **F1A-08** | `2026-09-17-tercera-puerta-orden-venta` (`cierra: si`) | Remisión con una OV que ya está en otro ticket → 409 «La orden de venta N ya está asociada al ticket #M». En producción hoy responde 201 | `apps/desk/server/routes/remision.ts:230-234` (409 en `:232`); tercera vía en `packages/zoho-sync/src/db/repo.ts:371` |
| **F1B-10** | `2026-09-21-orden-precedencia-guardas` (`cierra: si`) | Cambia qué error sale primero en el alta y en «Habilitar Servicio». El alta de remisión no cambia (IV-12) | Alta: `apps/desk/server/services/ticketService.ts:78`, `:88`, 409 en `:99`. Transición: `:134`, `:141`, `:147`, 409 en `:151` |
| **F1A-07** | `2026-09-22-fechas-derivadas-servidor` (`cierra: si`) | El servidor fija tres fechas derivadas y pisa lo tecleado; sin fuente, 422 «Fecha inválida en el campo: …» | `apps/desk/server/services/ticketService.ts:132`. `packages/shared/src/fechasDerivadas.ts:63` y `:130`. Cliente: `apps/desk/src/lib/valoresTransicion.ts:42` |

La guarda nueva de modalidad se añadió a la línea `:91` del alta, y a propósito en la misma línea para no
desplazar las citas del fichero (`openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/archive-report.md:103-104`):
por eso las citas de `ticketService.ts` de esta tabla siguen valiendo.

**Sin efecto visible en la App:**

| Qué | Commits o cambio archivado | Por qué no se ve |
|---|---|---|
| F1A-06, generador del mapa del blueprint | `2026-09-22-generador-mapa-blueprint` | Sólo lo usa su script (`package.json:25`) y sus pruebas |
| Detector de citas y hook `pre-push` | `2026-09-15-hook-citas-pre-push`, `2026-09-16-detector-citas-extremos`, `2026-09-24-rq-rc-07-regla-e` | Código de `apps/desk/server/citas/`: no lo importa el servidor. Su único efecto en la imagen es el `prepare` de §4.3 |
| Reconciliación (`npm run reconcile`) | `2026-09-20-F0-05` | Comando de línea (`package.json:20`) |
| Pruebas, comentarios y barridos de citas | `f337a96`, `62140e4`, `0808fdf`, `5ce8e2c`, `094eaa4`, `6e471a8`, `ca56c62`, `2312d34` y los barridos | Sólo pruebas o comentarios |

**Sólo en el worker `hub-sync`** — sin cambios desde el 2026-09-29: facturas de anticipo de Books (`ea3dbc1`,
`a233e1d`, `7cfd198`, `8d03c0d`, `d041b1c`; relleno en `apps/hub-sync/src/hubSync.ts:67-77`; `SYNC_BOOKS_RICH`,
`packages/zoho-sync/src/config.ts:92`), historia pendiente de tickets (`b7c1ba8`, `42172d7`, `244c237`;
`apps/hub-sync/src/hubSync.ts:96`) y hora de entrada en la fase ganada de CRM (`3fc4768`, `226f98e`,
`d598146`, `0a38911`, `030efa7`; `apps/hub-sync/src/hubSync.ts:107-113`; `SYNC_CRM`,
`packages/zoho-sync/src/config.ts:109`). Hipótesis sin verificar: que el token de Books de producción tenga
permiso sobre `/retainerinvoices`; si no, el relleno falla con un error en el log y no tumba el worker
(`apps/hub-sync/src/hubSync.ts:74-76`).

### 5.3 · Riesgos que se publican a sabiendas

**Nuevos, de las dos tandas posteriores al 2026-09-29.**

**R14 · S-6 cambia en vuelo el grafo de los SR heredados, SIN MEDIR.** Es cambio visible, no sólo riesgo
(§5.1). Un técnico que tenga un SR en `Pendiente` pierde las salidas de servicio el día del Deploy. La
propuesta lo registra con probabilidad **Media** y mitigación «P.1 antes de desplegar»
(`openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/proposal.md:150`). P.1 sin resultado (§6.1.2).

**R15 · El área de las cuatro transiciones de soporte remoto es un supuesto (S-1).** Las cuatro son de
`Servicio Técnico` por equivalencia, no por decisión (`packages/shared/src/transitions.ts:384-385`, `:389`):
un usuario sólo de Comercial recibe 403 en las cuatro (matriz de `apps/desk/server/permisos.test.ts:300-306`).
La pregunta está en la bandeja como **E-090** (`docs/sdd/ENTRADA.md:1253`, `NUEVA`); con la respuesta
pendiente, el sistema funciona con Servicio Técnico (`docs/sdd/ENTRADA.md:1259`). Es la P.3 de
`blueprint-soporte-remoto` (§6.4).

**R16 · `Solicitud Soporte` no tiene columna propia** y cae en «Otros» (S-10; columna propia destinada a
F1B-09, `openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/archive-report.md:25-26`). Las
solicitudes nuevas de soporte se mezclan con cualquier otro estado sin columna, incluida `Verificación`.

**R17 · Las alarmas dependen de la pasada de la sincronización con Zoho (adenda a E-087).** Se evalúan en el
único `setInterval` del proceso, encadenadas antes del ritmo de contratos y de la sincronización
(`apps/desk/server/index.ts:88`). Si esa pasada se retira sin trasladar la llamada, las alarmas **callan sin
que nada se ponga rojo** en producción (`apps/desk/server/services/alarmasSla.ts:141-146`, nunca lanza); lo
vigilan dos guardianes de prueba que leen `index.ts` (`docs/sdd/ENTRADA.md:1269-1272`). Sin destino
asignado. *Hipótesis, no medida:* como la pasada de alarmas va **delante** de la sincronización en la misma
cadena, una pasada de alarmas lenta retrasaría la sincronización de ese ciclo (la bandera `syncing` de
`apps/desk/server/index.ts:84-87` evita solapes, no retrasos). Hace cuatro consultas fijas sin N+1
(`apps/desk/server/db/sla.ts:34-38`, comentario).

**R18 · Atomicidad de marca y aviso probada por estructura, no por filas (W4).** pg-mem no deshace un
`ROLLBACK`, así que que la marca y los avisos vayan o no juntos lo fija la prueba por estructura
(`apps/desk/server/services/alarmasSla.ts:15-19`;
`openspec/changes/archive/2026-09-29-alarmas-horas-habiles/archive-report.md:43`). La primera prueba real es
Postgres de producción, dentro de la P.2 de la tanda.

**R19 · El prefiltro de marcas no lo detecta ninguna prueba (W5).** `apps/desk/server/services/alarmasSla.ts:88-94`
lee de una vez las marcas ya existentes para saltarse lo avisado. Si se rompiera, la unicidad **sigue**
garantizada por la clave primaria (`:44-55`); lo que se perdería es la optimización. Superviviente declarado
(`openspec/changes/archive/2026-09-29-alarmas-horas-habiles/archive-report.md:44`).

**R20 · Si nadie tiene el cargo `Coordinador Comercial`, las alarmas van al área Comercial y a todos los
administradores activos, con un `warn`.** El cargo es texto libre escrito para firmar la remisión: un «Coord.
Comercial» **no casa** (`apps/desk/server/db/avisos.ts:96-113`, compara en minúsculas y sin espacios en los
extremos). El respaldo reutiliza `destinatariosDeArea`, que incluye a los administradores
(`apps/desk/server/db/avisos.ts:68`, `:89`). Nada queda mudo, pero puede llegar a más gente de la prevista.
Lo comprueba la P.1 de `alarmas-horas-habiles` (§6.1.3).

**R21 · Las alarmas copian a `AVISOS_COPIA_EMAIL` y `DEPLOY.md` no lo dice** (§3). Si esa variable estuviera
puesta en producción —es una «muleta de pruebas», `DEPLOY.md:157` en `c2b2888`—, esa dirección recibiría copia de **todas**
las alarmas. §6.1.7.

**R22 · Dos escenarios de las alarmas quedan PARTIAL y uno MANUAL**
(`openspec/changes/archive/2026-09-29-alarmas-horas-habiles/archive-report.md:32-36`): S27 (config de correo
vacía, sin prueba a nivel de pasada; sin destino), S33 (que la marca silenciosa del corte saque la marca de
tablero; la cubre el paso 6 de P.2) y S45 (la tarjeta, `.tsx` fuera de la red por F0-00; la cubre P.2).

**R23 · Sólo se miden los tickets que esta aplicación ha movido.** Un ticket cuya entrada al estado no está en
`ticket_transitions` —por ejemplo, uno que llegó a `Notificado` sólo desde Zoho— **no tiene alarma**
(`apps/desk/server/db/sla.ts:31-32`, `:56`). Es de diseño y viene de C11; se anota para que la ausencia de un
aviso no se lea como fallo.

**Los riesgos del paquete del 2026-09-29, re-comprobados contra `b1347e0`:**

**R1 · Se puede liberar un analizador sin pasar por Verificación (E3 sin construir). SIGUE VIVO.**
`openspec/config.yaml:1972-1973`. `grep -rniE "gas.?patron|gas patrón" packages/ apps/ --include=*.ts` da
**0** el 2026-09-29 sobre `b1347e0`. E-082 sigue `NUEVA` (`docs/sdd/ENTRADA.md:1190`). «Liberación» desde
`En Proceso` está disponible para cualquier «Equipo nuevo» (`packages/shared/src/transitions.ts:359`).

**R2 · Sin guarda de certificado en Liberación desde Verificación. SIGUE VIVO:** E-083 sigue `NUEVA`
(`docs/sdd/ENTRADA.md:1197`).

**R3 · Tickets «Equipo nuevo» ya abiertos cambian de flujo el día del Deploy. SIGUE VIVO** y sin medir. El
enrutado mira clasificación y estado actual (`packages/shared/src/flujos.ts:56-61`). Hipótesis de consulta,
sólo lectura (puede contar de menos: el código normaliza también espacios internos,
`packages/shared/src/flujos.ts:32-34`, `:40-43`):

```sql
SELECT status, count(*) FROM desk.tickets
 WHERE lower(trim(classification)) = 'equipo nuevo'
   AND status IN ('Ingresado','En Proceso','Notificado','Verificación')
 GROUP BY status;
```

**R4 · Sólo Servicio Técnico mueve el flujo de equipo nuevo. SIGUE VIVO.** Área supuesta
(`packages/shared/src/transitions.ts:347`; `openspec/changes/archive/2026-09-25-blueprint-equipo-nuevo/proposal.md:104`).
R15 es el mismo molde para soporte remoto.

**R5 · Menores. SIGUEN VIVOS**, sin cambio de código que los toque: `equipos.serial` no es único
(`openspec/changes/archive/2026-09-24-alta-equipo-nuevo-en-ticket/proposal.md:81`); dos ediciones simultáneas
pueden registrar un «valor anterior» desfasado
(`openspec/changes/archive/2026-09-25-edicion-comercial-equipo/design.md:185`); la respuesta de novedad sólo la
exige el cliente (`openspec/changes/archive/2026-09-25-foto-solo-con-novedad/proposal.md:79-82`); y una remisión
pendiente con novedad y sin fotos sólo sale reintentando o con anulación de un administrador (`:84-87`).

**R6 · IV-11 queda REDUCIDO, no cerrado. SIGUE VIVO.** Las filas cuya orden se eligió antes del Deploy no
tienen ni marca ni asociación; si el sincronizador vacía la columna, esa OV vuelve a aparecer como libre
(`packages/zoho-sync/src/db/repo.ts:369-371`). Registro: `openspec/config.yaml:3141-3160` en `e3d5e90`. Lo decide Gerencia
(las dos P.2, §6.4). **Añadido en este rango:** la alarma de `Remisión creada` usa la misma definición de «tiene
OV» por las tres vías (`apps/desk/server/db/sla.ts:112-125`), así que una fila a medias por IV-11 puede **no
dar alarma** mientras conserve `salesorder_id`.

**R7 · IV-12 sigue vivo**, con la cuarentena y el contrato vencido detrás del 409 de remisión pendiente
(`apps/desk/server/routes/remision.ts:127`, `:155`, `:177`, `:197`, `:220`; comentario en
`apps/desk/server/remisiones.test.ts:1246`). Sin destino. Ni `remision.ts` ni esa prueba cambian en
`3f9d23b..b1347e0`.

**R8 · Contratos vivos sin registrar el día uno. SIGUE VIVO.** Probabilidad **Alta**
(`openspec/changes/archive/2026-09-29-registro-contrato/proposal.md:140`). P.7 (§6.3.3).

**R9 · Un contrato mal tecleado sólo se corrige en la base. SIGUE VIVO, y ya está en la bandeja** como
**E-088** (`docs/sdd/ENTRADA.md:1238`, `NUEVA`, sin destino). Rutas sólo `GET` y `POST`
(`apps/desk/server/routes/contratos.ts:24-70`); un lote equivocado queda ocupado por el índice único
(`packages/zoho-sync/src/db/schema.sql:572`).

**R10 · Un técnico puede bajar la prioridad de un ticket de contrato. SIGUE VIVO**
(`packages/shared/src/transitions.ts:193`, `:195`; destino F1B-07,
`openspec/changes/archive/2026-09-29-registro-contrato/proposal.md:139`).

**R11 · Cuántas OV caen en cuarentena el día uno no está medido. SIGUE VIVO**
(`packages/zoho-sync/src/books/repo.ts:176`). P.1 de F1B-11 (§6.1.6).

**R12 · El saldo de un lote depende de dos literales sin confirmar. SIGUE VIVO** (`packages/zoho-sync/src/books/subOV.ts:18`,
`:39`, hipótesis en `:12-14`). P.4 de F1B-11 (§6.1.6). **Cambia la consulta que lo confirma**: desde `66ab783`
el bloque 5 lee `raw->>'order_status'` (§2.3), así que la hipótesis del 2026-09-29 sobre una columna
inexistente queda resuelta en el fichero.

**R13 · Menores de F1B-11. SIGUEN VIVOS:** atomicidad de liberar, remisión y aviso de ritmo probada por
estructura (`openspec/changes/archive/2026-09-28-asociacion-ov-ticket/archive-report.md:83-84`; W2 de
`openspec/changes/archive/2026-09-29-registro-contrato/archive-report.md:38`); el 409 de carrera sin número
(`openspec/changes/archive/2026-09-28-asociacion-ov-ticket/archive-report.md:81-82`); el CSV sin prueba
automática (`openspec/changes/archive/2026-09-29-registro-contrato/archive-report.md:30-33`); la pasada de ritmo
no se reintenta el mismo día (`apps/desk/server/services/avisoRitmoContrato.ts:68-69`); la lista de contratos
enseña el identificador del cliente (`apps/desk/src/components/ContratosPanel.tsx:50`).

---

## 6 · Tareas de persona — lista única de todo lo pendiente de desplegar

Todas las tareas de persona de los cambios archivados cuyos commits están en `ae5aaf4..b1347e0` y que **no
tienen resultado**. Se barrieron los 21 `archive-report.md` añadidos en el rango (`git diff --name-only
--diff-filter=A ae5aaf4..b1347e0 -- 'openspec/changes/archive/*/archive-report.md'`), sus `tasks.md` y la §6
del 2026-09-29. **Ninguna consta como hecha**: no hay resultado en `docs/sdd/` versionado, ni en
`openspec/config.yaml` (sus cambios en `3f9d23b..b1347e0` son cuatro líneas de cita, sin decisiones nuevas),
ni en los `tasks.md` (los huecos «Resultado (a rellenar)» siguen vacíos). Y no podían estarlo las de
«después del Deploy»: nada de este rango ha llegado a producción. **Archivar no las dio por hechas** (regla del
ciclo 1 de `CLAUDE.md`). No hay copia de pruebas: todo se hace en la aplicación en uso
(`openspec/config.yaml:1705-1707`). Las comprobaciones en la app se hacen sobre
`https://ambientalia-desk.ambientalia.cloud/`, con sesión iniciada.

**Numeración: las P.n chocan entre cambios.** Cada cambio numeró desde P.1. **En este documento una tarea se
nombra siempre con su cambio.**

| Número | `parche-iv11-orden-venta` | `asociacion-ov-ticket` | `registro-contrato` | `blueprint-soporte-remoto` | `alarmas-horas-habiles` |
|---|---|---|---|---|---|
| P.1 | Consulta de subOV (una sola ejecución cubre las tres de F1B-11) | Igual | Igual («heredada») | **Recuento de SR por estado** | **Cargo `Coordinador Comercial` activo** |
| P.2 | Relleno de la **marca** (decisión) | Relleno de las **asociaciones** (decisión) | — | **Verificación en la app** (7 pasos) | **Verificación en la app** (6 pasos) |
| P.3 | Aviso de discrepancia en la campana | Ficha de OV, liberar, cuarentena, saldo | — | **Área de las cuatro transiciones (E-090)** | **Ráfaga de lo vencido: ¿se enciende?** |
| P.4 | — | Consulta 5 (literales de Books) | Igual («heredada») | — | **¿`Notificado` escala al Coordinador Comercial?** |
| P.5 | — | — | E-086 (ampliación) | — | — |
| P.6 | — | — | Verificar contratos en la app | — | — |
| P.7 | — | — | Alta de los contratos vigentes | — | — |

Fuentes: `openspec/changes/archive/2026-09-28-parche-iv11-orden-venta/tasks.md:162-171`,
`openspec/changes/archive/2026-09-28-asociacion-ov-ticket/tasks.md:490-505`,
`openspec/changes/archive/2026-09-29-registro-contrato/tasks.md:445-453`,
`openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/tasks.md:388-409` y
`openspec/changes/archive/2026-09-29-alarmas-horas-habiles/tasks.md:394-414`.

### 6.0 · La lista, por orden y por dueño

| Orden | Dueño | Tarea (con su cambio) | Qué desbloquea | Paso a paso |
|---|---|---|---|---|
| **Antes** | Alfonso (Gerencia) | Copia de la base | La única vuelta atrás completa | §4.1 |
| **Antes** | Alfonso | **P.1 de `blueprint-soporte-remoto`** — recuento de SR por estado | Saber a cuántos tickets afecta S-6 y decidir si es aceptable; convierte el «sin medir» de §5.1 en cifra | §6.1.2 |
| **Antes** | Alfonso (administración) | **P.1 de `alarmas-horas-habiles`** — hay al menos un usuario activo con cargo `Coordinador Comercial` | Que las alarmas lleguen a esa persona y no al área con administradores (R20). No bloquea | §6.1.3 |
| **Antes** | Alfonso | **Preparación del paso 6 de P.2 de `alarmas-horas-habiles`** — localizar un ticket ya vencido en `Notificación cliente` | Poder hacer el paso 6 (S33) tras la primera pasada | §6.1.5 |
| **Antes** (recomendado) | Alfonso | **P.1 y P.4 de F1B-11** (`parche-iv11-orden-venta`, `asociacion-ov-ticket`, `registro-contrato`) — consulta de subOV | Saber qué OV desaparecen del buscador (R11) y confirmar los literales del saldo (R12) | §6.1.6 |
| **Antes** (recomendado) | Quien administre EasyPanel (hipótesis: Alfonso) | **Mirar `AVISOS_COPIA_EMAIL`** — añadida por este paquete, no viene de ningún archivo | Que nadie reciba sin querer copia de todas las alarmas (R21) | §6.1.7 |
| **Antes — decisión** | **Gerencia** | **P.3 de `alarmas-horas-habiles`** — ¿se enciende la ráfaga de lo vencido? Por defecto, apagada | Si la respuesta es «encender», hace falta código nuevo antes de publicar | §6.1.4 |
| **Deploy** | Quien publica | Comprobación de §4.4 (bundle, esquema, log) | Seguir o revertir | §4.4 |
| **Después, el mismo día** | Alfonso / Comercial | **Paso 6 de P.2 de `alarmas-horas-habiles`** — el ticket ya vencido muestra la marca y NO avisa | Cierra el PARTIAL de S33 | §6.3.1 |
| **Después** | Alfonso / Comercial | **P.2 de `alarmas-horas-habiles`**, pasos 1-5 | S45 (tarjeta), W4 (atomicidad en Postgres real) | §6.3.1 |
| **Después** | Alfonso / Servicio Técnico | **P.2 de `blueprint-soporte-remoto`**, siete pasos | Verificación en la app de F1B-06 cambio 2 | §6.3.2 |
| **Después, el mismo día** | Comercial | **P.7 de `registro-contrato`** — alta de los contratos vigentes | Que la prioridad `High` y el bloqueo de vencidos actúen (R8) | §6.3.3 |
| **Después** | Alfonso | `INSERT` de los cierres de fin de año (F1B-12, `docs/sdd/Alta_Cierres_Fin_de_Año_2026.sql`) | Que las alarmas no cuenten el 24/12, 30/12, 31/12, 01/01 y 02/01 como hábiles. **Antes del 24/12** | §6.3.4 |
| **Después** | Comercial | **P.3 de `parche-iv11-orden-venta`** — aviso de discrepancia | Verificación de F1B-11 | §6.3.5 |
| **Después** | Comercial | **P.3 de `asociacion-ov-ticket`** — ficha de OV, liberar, cuarentena, saldo | Verificación de F1B-11 | §6.3.5 |
| **Después** | Comercial | **P.6 de `registro-contrato`** — contratos en la app (tras P.7) | Cierra W2, W3 y W4 de su verify | §6.3.5 |
| **Después** | Comercial / Gerencia | **RQ-HV-12** de `edicion-comercial-equipo` — botón «Editar» de la hoja de vida | Verificación de F1B-14 (2) | §6.3.6 |
| **Después** | Servicio Técnico | **RQ-RE-19** de `foto-solo-con-novedad` — formulario de novedad | Verificación de F1B-04 | §6.3.6 |
| **Después** | Servicio Técnico | **Comprobación 2 de `blueprint-equipo-nuevo`** y sus dos compañeras | Verificación de F1B-06 cambio 1 | §6.3.6 |
| **Después** | Servicio Técnico / Gerencia | **Verificación en la app de `salidas-verificacion`** | Verificación de F1A-03 | §6.3.6 |
| **Después** | Sin dueño con nombre | Alta con serie nueva y con serie registrada, y medir series duplicadas (`alta-equipo-nuevo-en-ticket`) | Verificación de F1B-14 (1) | §6.3.7 |
| **Después** | Comercial / Gerencia | Comprobaciones de RQ-HV-07 y carga retroactiva de los seis campos (`hojas-vida`) | Verificación de F1B-02 | §6.3.7 |
| **Después** | Sin dueño asignado | Pestaña «EN ESPERA» con un ticket en `Por Entregar` (`por-entregar-es-espera`) | Verificación de F1B-08 (2026-09-12) | §6.3.7 |
| **Después** | Quien tenga la consola de EasyPanel / quien tenga acceso a la base | Zona `America/Bogota` en el contenedor y recuento de instantes sin desplazamiento (`fechas-derivadas-servidor`) | Verificación de F1A-07; **ahora también de las horas hábiles de las alarmas** | §6.3.7 |
| Sin orden | Gerencia | **P.2 de `parche-iv11-orden-venta`** — relleno de la marca | R6 | §6.4 |
| Sin orden | Gerencia | **P.2 de `asociacion-ov-ticket`** — relleno de las asociaciones | R6 | §6.4 |
| Sin orden | Gerencia | **P.5 de `registro-contrato`** — E-086 | La ampliación de contrato y el cierre de F1B-11 | §6.4 |
| Sin orden | Gerencia / Servicio Técnico | **P.3 de `blueprint-soporte-remoto`** — E-090, área de las cuatro transiciones | Cerrar S-1 como decisión (R15) | §6.4 |
| Sin orden | Gerencia | **P.4 de `alarmas-horas-habiles`** — ¿`Notificado` escala al Coordinador Comercial? | Cerrar S-3 como decisión | §6.4 |
| Sin orden | Gerencia con Calidad | E-082 y E-083 (`salidas-verificacion`) | R1 y R2 | §6.4 |

**Agrupado por dueño:** **Alfonso** — copia, P.1 de `blueprint-soporte-remoto`, P.1 de `alarmas-horas-habiles`,
preparación del paso 6, P.1/P.4 de F1B-11, `INSERT` de cierres, y co-dueño de las dos P.2 nuevas.
**Comercial** — P.7 y P.6 de `registro-contrato`, P.3 de `parche-iv11-orden-venta`, P.3 de
`asociacion-ov-ticket`, P.2 de `alarmas-horas-habiles` (con Alfonso), RQ-HV-12 (con Gerencia), F1B-02 (con
Gerencia). **Servicio Técnico** — P.2 de `blueprint-soporte-remoto` (con Alfonso), RQ-RE-19, comprobaciones de
`blueprint-equipo-nuevo` y de `salidas-verificacion`. **Gerencia** — P.3 de `alarmas-horas-habiles` (antes del
Deploy) y las decisiones sin orden de §6.4. **Quien publica** — §4.4. **Sin dueño** — F1B-14 (1) y la pestaña
«EN ESPERA».

### 6.1 · Antes del Deploy

#### 6.1.1 · Copia de la base — Alfonso

§4.1.

#### 6.1.2 · P.1 de `blueprint-soporte-remoto`: recuento de SR por estado — Alfonso

Fuente: `openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/tasks.md:392-404`. **Sólo lectura.**
Sólo lee `desk.tickets`, que ya existe en `ae5aaf4`: se puede correr **antes** del Deploy, que es cuando sirve.

1. Conectarse con `psql` a la base `desk` de producción como siempre. **No pegar la cadena de conexión ni la
   contraseña en ningún chat, captura ni documento.**
2. Ejecutar:

   ```sql
   BEGIN READ ONLY;
   SELECT status,
          count(*) FILTER (WHERE lower(trim(classification)) = 'soporte remoto')                                   AS criterio_propuesta,
          count(*) FILTER (WHERE regexp_replace(lower(trim(classification)), '\s+', ' ', 'g') = 'soporte remoto') AS criterio_codigo
     FROM desk.tickets
    GROUP BY status
   HAVING count(*) FILTER (WHERE regexp_replace(lower(trim(classification)), '\s+', ' ', 'g') = 'soporte remoto') > 0
    ORDER BY status;
   ROLLBACK;
   ```

3. **Qué mirar:** las filas `En Proceso`, `Pendiente` y `Finalizado` son las que cambian de flujo (S-6); las
   demás siguen en servicio. Manda `criterio_codigo`, que es el que aplica `normalizar`
   (`packages/shared/src/flujos.ts:32-34`); si las dos columnas difieren, decirlo.
4. **Devolver** la salida. Si hay SR en `Pendiente`, avisar a Servicio Técnico **antes** del Deploy de que
   esos tickets sólo tendrán «Continuación soporte». Mover datos por S-6 es decisión de persona, no de este
   documento (`openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/tasks.md:392`, «decidir si S-6 es aceptable o hay que mover datos»).

#### 6.1.3 · P.1 de `alarmas-horas-habiles`: cargo `Coordinador Comercial` — Alfonso (administración)

Fuente: `openspec/changes/archive/2026-09-29-alarmas-horas-habiles/tasks.md:398-403`. **Sólo lectura. No
bloquea.** El cargo es texto libre que se escribe en el perfil para firmar la remisión
(`apps/desk/server/auth/routes.ts:67-68`).

1. En `psql`, base `desk`:

   ```sql
   BEGIN READ ONLY;
   SELECT id, email, name, active, cargo FROM public.users
    WHERE lower(trim(cargo)) = 'coordinador comercial';
   -- Y, para ver si hay variantes que NO casarán («Coord. Comercial», etc.):
   SELECT cargo, count(*) FROM public.users WHERE cargo IS NOT NULL GROUP BY cargo ORDER BY cargo;
   ROLLBACK;
   ```

2. **Qué debe verse:** al menos una fila con `active = true` en la primera consulta. Si no hay ninguna, las
   alarmas irán al área Comercial y a todos los administradores activos, con un `warn` (R20). Si en la segunda
   aparece una variante («Coord. Comercial»), corregir el cargo de esa persona **en la app** antes del Deploy
   hace que las alarmas le lleguen a ella; es un dato de producción y lo decide quien administra usuarios.
3. **Devolver** el número de filas activas de la primera consulta (no hace falta pegar correos en ningún
   documento).

#### 6.1.4 · P.3 de `alarmas-horas-habiles`: ¿se enciende la ráfaga? — Gerencia (decisión ANTES del Deploy)

Fuente: `openspec/changes/archive/2026-09-29-alarmas-horas-habiles/tasks.md:406-413`.

| Dato | Valor |
|---|---|
| Qué decide | Si el día del Deploy se avisa (campana y correo) de todo lo que **ya** estaba vencido, o sólo se marca en silencio |
| Por defecto | **Apagada**: es lo que hace `b1347e0` (`apps/desk/server/services/alarmasSla.ts:21-23`, `:102-104`) |
| Sin respuesta | Se despliega apagada (`openspec/changes/archive/2026-09-29-alarmas-horas-habiles/tasks.md:413`) |
| Si la respuesta es «encender» | Hace falta **cambiar código antes de publicar** (sólo afecta a la primera pasada); si hiciera falta un interruptor, nace cerrado (`=== 'true'`) y va a `.env.example` y `DEPLOY.md` con sus dos frases (`openspec/changes/archive/2026-09-29-alarmas-horas-habiles/tasks.md:406`). **Entonces `b1347e0` deja de ser el commit a publicar** y este paquete no vale para el nuevo |
| Dónde se registra la respuesta | `openspec/config.yaml` → `decisiones_de_gerencia` |
| Por qué importa decidirlo antes | El corte se escribe una sola vez en la primera pasada y un correo enviado no se recupera: después del Deploy ya no hay decisión que tomar |

**Tamaño de lo que se marcaría en silencio: SIN MEDIR.** Cota superior de sólo lectura (no aplica horas
hábiles ni la condición de OV, así que **sobreestima**), que Alfonso puede correr antes para informar la
decisión (`openspec/changes/archive/2026-09-29-alarmas-horas-habiles/tasks.md:407-412`):

```sql
BEGIN READ ONLY;
SELECT t.status, count(*) FROM desk.tickets t
 WHERE t.status IN ('Notificado', 'Remisión creada', 'Notificación cliente')
   AND EXISTS (SELECT 1 FROM desk.ticket_transitions tt WHERE tt.ticket_id = t.id AND tt.to_status = t.status)
 GROUP BY t.status;
ROLLBACK;
```

#### 6.1.5 · Preparar el paso 6 de P.2 de `alarmas-horas-habiles` — Alfonso

El paso 6 pide un ticket **que ya estuviera vencido** en `Notificación cliente` **antes de la primera pasada**
(`openspec/changes/archive/2026-09-29-alarmas-horas-habiles/archive-report.md:137-140`). La primera pasada
llega unos tres minutos después de arrancar (§3), así que el candidato se busca **antes** del Deploy:

```sql
BEGIN READ ONLY;
SELECT t.number, max(tt.performed_at) AS entro
  FROM desk.tickets t
  JOIN desk.ticket_transitions tt ON tt.ticket_id = t.id AND tt.to_status = t.status
 WHERE t.status = 'Notificación cliente'
 GROUP BY t.number
 ORDER BY entro;
ROLLBACK;
```

Elegir uno que entrase **hace más de cuatro días hábiles completos** (36 h hábiles = cuatro jornadas de 9 h,
L-V 08:00-17:00, sin festivos). Con margen, para no depender de la cuenta exacta: por ejemplo, uno que entrase
hace más de una semana y media. Anotar su número. Si la consulta sale vacía, el paso 6 **no se puede hacer** y
se dice así en el resultado.

#### 6.1.6 · P.1 y P.4 de F1B-11: la consulta de subOV — Alfonso (recomendado)

| Dato | Valor |
|---|---|
| Fichero | `docs/sdd/Consulta_SubOV_formato_2026-09-27.sql` (cambió en `66ab783`: bloque 5) |
| Quién | **Alfonso** (`docs/sdd/Consulta_SubOV_formato_2026-09-27.sql:25`) |
| Dónde | Consola de PostgreSQL de producción, base `desk` (`:30`) |
| Cuándo | **Antes del Deploy, si se puede.** Sólo lee `books.sales_orders` y `desk.tickets`, que ya existen en `ae5aaf4`. Dice cuántas OV van a desaparecer del buscador (R11) |
| ¿Escribe? | No. Bloques 1-4 dentro de `BEGIN READ ONLY … ROLLBACK` (`:50`, `:116`) |

1. Conectarse con `psql` a la base `desk`. **No pegar la cadena de conexión ni la contraseña en ningún chat,
   captura ni documento** (`:31-32`).
2. Dentro de `psql`: `\o salida_subov_2026-09-27.txt`, luego `\i Consulta_SubOV_formato_2026-09-27.sql`,
   luego `\o`.
3. Comprobar que la salida de los bloques 1-4 termina con `ROLLBACK` (`:37`).
4. **P.1** — devolver los cuatro bloques (`:39-47`). Un bloque vacío también es resultado.
5. **P.4** — el bloque 5 (`:118-134`) va **fuera** de la transacción de sólo lectura. Si se ejecuta suelto,
   envolverlo a mano en `BEGIN READ ONLY;` … `ROLLBACK;` (`:122-123`). Desde `66ab783` lee
   `raw->>'order_status'` (`:127`, `:129`), que es como lo expone la vista `public.sales_orders`
   (`packages/zoho-sync/src/db/schema.sql:181`); `raw` es columna de `books.sales_orders` en el esquema de la
   App (`packages/zoho-sync/src/db/schema.sql:164`). **Que la tabla de producción tenga esa forma no se ha
   podido comprobar desde aquí** (hipótesis): si el bloque 5 da error de columna, devolver el error tal cual.

Registro: `openspec/config.yaml` → `adenda_iv11_asociacion_ov_ticket` → `P4_estados_de_books`
(`openspec/config.yaml:3161-3168` en `e3d5e90`).

#### 6.1.7 · Mirar `AVISOS_COPIA_EMAIL` — quien administre EasyPanel (añadida por este paquete)

No viene de ningún archivo: la añade este documento por lo que se midió en §3.

1. En EasyPanel, servicio App → variables de entorno. Mirar **sólo si existe y si tiene valor**
   `AVISOS_COPIA_EMAIL`. **No copiar su valor ni el de ninguna otra variable a ningún chat ni documento.**
2. **Vacía o ausente:** nada que hacer.
3. **Con valor:** esa dirección recibirá copia de **todas** las alarmas de SLA además de las derivaciones
   (`apps/desk/server/services/alarmasSla.ts:118`, `apps/desk/server/avisosWebhook.ts:71-75`). Decidir antes
   del Deploy si se deja; `DEPLOY.md:161-162` en `c2b2888` dice cómo se apaga: borrando la variable, sin tocar código.
4. Anotar de paso **si `N8N_AVISOS_WEBHOOK_URL` tiene valor** (sin copiarlo): dice si las alarmas saldrán por
   correo o sólo en la campana (§3).

### 6.2 · Deploy y comprobación inmediata — quien publica

§4.2 y §4.4. La consulta de §4.4 se repite a los tres o cuatro minutos para ver `filas_corte = 1` y anotar el
corte.

### 6.3 · Después del Deploy

#### 6.3.1 · P.2 de `alarmas-horas-habiles` — Alfonso / Comercial

Fuente: `openspec/changes/archive/2026-09-29-alarmas-horas-habiles/tasks.md:404-405` (pasos 1-5) y
`openspec/changes/archive/2026-09-29-alarmas-horas-habiles/archive-report.md:137-140` (paso 6). Cubre S33,
S45 y W4.

| # | Cuándo | Paso a paso | Resultado esperado |
|---|---|---|---|
| **6** | **El mismo día, en cuanto `filas_corte = 1` (§4.4)** | Con el ticket localizado en §6.1.5: abrir el **tablero** (vista de tickets abiertos) y buscar su tarjeta. Luego, en la consola, sólo lectura: `SELECT a.created_at, a.texto FROM public.avisos a JOIN desk.tickets t ON t.id = a.ticket_id WHERE t.number = <N> AND a.created_at >= (SELECT corte_at FROM public.alarmas_corte);` y `SELECT estado, entrada_at, avisos_creados FROM public.alarmas_avisadas m JOIN desk.tickets t ON t.id = m.ticket_id WHERE t.number = <N>;` | La tarjeta muestra **«Esperando aprobación del cliente»** (`apps/desk/src/components/TicketCard.tsx:98-101`). La primera consulta **no devuelve ninguna fila** (sin aviso en la campana) y la segunda devuelve una fila con **`avisos_creados = 0`** (marcada en silencio, `apps/desk/server/services/alarmasSla.ts:103`). Nadie recibe correo por ese ticket. **Anotar el número de ticket y el resultado** |
| 1 | Cuando venza de forma natural un `Notificado` **después** del corte (9 h hábiles tras entrar) | Entrar como el usuario con cargo `Coordinador Comercial` → campana | Aviso «El ticket #N lleva más de 9 horas hábiles en «Notificado» (entró el …).» (`apps/desk/server/services/alarmasSla.ts:69`). Si P.1 salió vacía, el aviso lo reciben Comercial y los administradores, y el log lleva el `warn` (`:114`) |
| 2 | Cuando haya un vencido y un no vencido en `Notificación cliente` | Tablero → mirar las dos tarjetas | El vencido muestra «Esperando aprobación del cliente»; el no vencido, no |
| 3 | Cuando haya un ticket en `Remisión creada` **con** orden de venta más de 27 h hábiles | Campana del Coordinador Comercial | **No** hay aviso por ese ticket (`apps/desk/server/db/sla.ts:57`) |
| 4 | Con el ticket vencido del paso 2 | Moverlo fuera de `Notificación cliente` con su transición normal → volver al tablero | La marca **desaparece** (`apps/desk/server/db/alarmasAvisadas.ts:28`, sólo cuenta la entrada actual) |
| 5 | Tras el primer aviso real | Mirar el correo del Coordinador Comercial; o, en la consola, `SELECT id, enviado_at FROM public.avisos WHERE texto LIKE 'El ticket #% horas hábiles%' ORDER BY created_at DESC LIMIT 5;` | El correo llega; o, si el canal está apagado, `enviado_at` queda vacío y **nada se rompe** (`apps/desk/server/services/alarmasSla.ts:128-135`). W4: si algún aviso existe, su marca existe también en `public.alarmas_avisadas` (y al revés, salvo las de `avisos_creados = 0`) |

⚠️ No provocar vencimientos moviendo tickets reales hacia atrás: los pasos 1-5 se hacen **cuando ocurran**. Un
ticket de prueba no sirve para el paso 6 (tiene que estar vencido antes del corte).

#### 6.3.2 · P.2 de `blueprint-soporte-remoto` — Alfonso / Servicio Técnico

Fuente: `openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/tasks.md:405-407`.

| # | Paso a paso | Resultado esperado |
|---|---|---|
| 1 | Botón **«Nuevo ticket»** (`apps/desk/src/App.tsx:108`) → en «Clasificaciones *» elegir **«Soporte remoto»** | Aparece un selector con «Modalidad: Remoto» ya elegido (`apps/desk/src/components/CreateTicket.tsx:422`). Cambiar a otra clasificación lo hace desaparecer |
| 2 | Completar el alta (cliente, equipo, tipo de servicio) → **«Crear ticket»** → abrir la ficha | El ticket está en **`Solicitud Soporte`** y la ficha muestra «Soporte remoto · Modalidad: Remoto» (`apps/desk/src/components/TicketProperties.tsx:144`) |
| 3 | Con un usuario de **Servicio Técnico**, en la ficha, caja de transiciones | Sólo el botón **«Asignación»**. Con un usuario sólo de Comercial: ningún botón (S-1, R15) |
| 4 | «Asignación» → `En Proceso` → «Soporte pendiente» → `Pendiente` → «Continuación soporte» → `En Proceso` → «Ejecutar» | Recorre el bucle y termina en `Finalizado`, **sin más salidas** |
| 5 | «Nuevo ticket» con «Equipo nuevo» o «Equipo para servicio de mantenimiento» | **No** aparece el selector; el ticket queda sin modalidad |
| 6 | Tablero, con el ticket del paso 2 aún en `Solicitud Soporte` | Cae en la columna **«Otros»** (S-10) |
| 7 | Si P.1 (§6.1.2) encontró algún SR en `Pendiente`: abrir uno | Ve **sólo «Continuación soporte»** (S-6) |

⚠️ Los pasos 2-4 crean y mueven un ticket: hacerlo con uno de prueba y borrarlo al terminar con «Eliminar
ticket» (sólo administrador), como el #10002 (`docs/sdd/Paquete_de_Despliegue_2026-09-10.md:459-467`).

#### 6.3.3 · P.7 de `registro-contrato`: dar de alta los contratos vigentes hoy — Comercial

Fuente: `openspec/changes/archive/2026-09-29-registro-contrato/tasks.md:453`. **Es la tarea que hace que
F1B-11 actúe** (R8). Hacerla **el mismo día del Deploy**, después de §4.4.

| # | Paso a paso | Resultado esperado |
|---|---|---|
| 0 | Preparar, fuera de la app, la lista de contratos vigentes: cliente, **lote** (`OV-AAAA-NNN`, sin sufijo), inicio y fin | Una lista **revisada**: un contrato no se puede editar ni borrar desde la app (R9, E-088) |
| 1 | Usuario de **Comercial** (o administrador) → engranaje «Configuración» → «Administración de datos» → **«Contratos por lote»** | Pantalla «Contratos registrados», vacía, con **«Nuevo contrato»** (`apps/desk/src/components/ContratosPanel.tsx:36`) |
| 2 | «Nuevo contrato» → Cliente, «Lote (OV madre)», «Inicio», «Fin» → **«Registrar»** | El contrato aparece en la lista. Errores posibles del servidor en `apps/desk/server/routes/contratos.ts:49-55` |
| 3 | Repetir por cada contrato | Uno por lote |
| 4 | Pulsar un contrato de la lista | Ficha con estado **«Vigente»**, saldo e informe por trimestre (`apps/desk/src/components/ContratoFicha.tsx:5`, `:47`, `:58`) |

**Cómo se verifica:** es el paso 1 de P.6 (§6.3.5). ⚠️ Un error de lote o de fechas **sólo se corrige en la
base**, con la copia de §4.1 detrás; no crear un segundo contrato «bueno», porque el lote ya está ocupado
(`packages/zoho-sync/src/db/schema.sql:572`).

#### 6.3.4 · El `INSERT` de los cierres de fin de año — Alfonso (pendiente desde el 2026-09-27)

| Dato | Valor |
|---|---|
| Fichero | `docs/sdd/Alta_Cierres_Fin_de_Año_2026.sql` (sin cambios en el rango desde `ea23634`) |
| Quién | **Alfonso** (`docs/sdd/Alta_Cierres_Fin_de_Año_2026.sql:2`) |
| Dónde | Consola de PostgreSQL de producción, base `desk` (`:12`) |
| Cuándo | **Después** del Deploy y de §4.4 (antes, la tabla no existe, `:7-10`), y **antes del 24/12/2026**: desde este rango las alarmas leen los cierres (`apps/desk/server/db/sla.ts:46`) |
| ¿Idempotente? | **Sí.** `ON CONFLICT (fecha) DO NOTHING` (`:28`), dentro de una transacción (`:20` y `:36`) |
| Qué da de alta | 24/12, 30/12 y 31/12 de 2026, y 01/01 y 02/01 de 2027 (`:22-27`) |

1. `SELECT to_regclass('public.calendario_cierres') AS tabla;` (`:17`). **Si devuelve NULL, parar** y ver §4.4.
2. Ejecutar el bloque `BEGIN` … `INSERT` (`:20-28`).
3. Ejecutar el `SELECT` de comprobación (`:31-33`): **deben salir cinco filas**, de 2026-12-24 a 2027-01-02.
4. Si salen las cinco, `COMMIT;`. Si no, `ROLLBACK;` (`:35-36`).

**Cómo se verifica:** sigue sin haber pantalla que lo enseñe. El efecto se ve en las alarmas: un cierre dado de
alta cuenta desde la pasada siguiente, sin reiniciar (`apps/desk/server/db/sla.ts:46`).

#### 6.3.5 · Comprobaciones en la app de F1B-11 — Comercial

Sin cambios de contenido respecto al 2026-09-29; las rutas y ficheros que citan no cambian en
`3f9d23b..b1347e0`. Hacer primero §6.3.3, porque P.6 necesita un contrato real.

**P.3 de `parche-iv11-orden-venta` — el aviso de discrepancia.** Fuente:
`openspec/changes/archive/2026-09-28-parche-iv11-orden-venta/tasks.md:170-171`.

| # | Paso a paso | Resultado esperado |
|---|---|---|
| 1 | Esperar a que ocurra: un ticket con orden elegida en la app **después del Deploy**, al que en Zoho Desk alguien le ponga otra OV | En la campana de Comercial: «Zoho trae la orden de venta X para el ticket #N, pero la aplicación tiene Y. …» (`apps/desk/server/services/avisoDiscrepanciaOV.ts:38`) |
| 2 | Abrir ese ticket | Conserva la orden **de la app** |
| 3 | Esperar al siguiente ciclo (unos tres minutos) | **No** llega un segundo aviso igual (`:30`) |

*No provocarlo a propósito* salvo con un ticket de prueba. Un ticket anterior al Deploy **no** avisa (R6).

**P.3 de `asociacion-ov-ticket` — ficha de OV, liberar, cuarentena y saldo.** Fuente:
`openspec/changes/archive/2026-09-28-asociacion-ov-ticket/tasks.md:501-503`.

| # | Paso a paso | Resultado esperado |
|---|---|---|
| 1 | Ticket con OV creado tras el Deploy → ficha → sección **«ÓRDENES DE VENTA»** | «1 vigentes, 0 liberadas»; la OV con «Vigente», origen, fecha y quién (`apps/desk/src/components/PanelOvAsociaciones.tsx:44-51`, `:89`) |
| 2 | Usuario **sin** Comercial ni administrador → misma sección | Sin botón «Liberar» (`:52`, `:82`) |
| 3 | Comercial → «Liberar» → motivo vacío → «Confirmar» | «El motivo de la liberación es obligatorio» (`apps/desk/server/routes/ovAsociaciones.ts:51`) |
| 4 | Escribir un motivo → «Confirmar» | La fila pasa a «Liberada»; «0 vigentes, 1 liberadas» |
| 5 | En otro ticket, buscar la OV liberada | **Vuelve a salir** como libre |
| 6 | Configuración → «Administración de datos» → **«Órdenes de venta: cuarentena y saldo por lote»** | Lista de cuarentena (debe cuadrar con P.1) y «Saldo por lote» (`apps/desk/src/components/OvCuarentenaSaldo.tsx:38-63`) |

⚠️ Los pasos 3-5 **liberan una orden real**: hacerlo con un ticket de prueba y borrarlo al terminar. Liberar no
tiene «deshacer».

**P.6 de `registro-contrato` — contratos en la app.** Fuente:
`openspec/changes/archive/2026-09-29-registro-contrato/tasks.md:452`; cierra W2, W3 y W4 de su verify
(`openspec/changes/archive/2026-09-29-registro-contrato/archive-report.md:119`).

| # | Paso a paso | Resultado esperado |
|---|---|---|
| 1 | Con un contrato vigente de §6.3.3, crear un ticket de prueba para ese cliente eligiendo «Low» | Nace en **`High`** (`apps/desk/server/services/ticketService.ts:106`) |
| 2 | Asociarle una subOV del lote → ficha | Marca **«DE CONTRATO · …»** (`apps/desk/src/components/MarcaContrato.tsx:16`) |
| 3 | Si existe un contrato **vencido**: asociar una subOV de su lote | 422 «… su contrato nº … venció el …» (`packages/shared/src/contratos.ts:57`). Si no hay ninguno vencido, este paso **no se puede hacer sin crear un contrato falso** que después no se puede borrar: dejarlo pendiente y decirlo |
| 4 | Ficha del contrato → **«Exportar CSV»** | Un CSV con las tildes bien y las mismas cifras que la pantalla |
| 5 | Al día siguiente, en el log del servicio App | No aparece `pasadaRitmoContratos falló` (`apps/desk/server/services/avisoRitmoContrato.ts:73`) |
| 6 | Sólo si algún contrato está en su segundo trimestre o posterior y va lento | Aviso de ritmo en la campana de Comercial (`apps/desk/server/services/avisoRitmoContrato.ts:41`), **una vez** por trimestre |

#### 6.3.6 · Comprobaciones pendientes desde el 2026-09-27

Sin cambios de contenido; fuentes re-comprobadas contra `b1347e0` (`openspec/specs/hojas-vida/spec.md` sólo
cambia en dos líneas de cita de `:182-190`, sin desplazar nada; `openspec/specs/remisiones/spec.md` no cambia
en `3f9d23b..b1347e0`).

**RQ-HV-12, botón «Editar» de la hoja de vida — Comercial / Gerencia.** Fuente:
`openspec/specs/hojas-vida/spec.md:298-309` (dueño en `:301-302`).

| # | Paso a paso | Resultado esperado |
|---|---|---|
| 1 | Equipos → hoja de vida de cualquier equipo | Botón «Editar» (`openspec/specs/hojas-vida/spec.md:304-305`) |
| 2 | Usuario **sin** Comercial ni administrador → «Editar» | Factura de compra, Fin de garantía y Mantenedor en sólo lectura (`:306-307`) |
| 3 | Comercial → cambiar un campo → guardar → reabrir | La sección «Cambios» enseña la fila (`:308-309`) |

**RQ-RE-19, formulario de novedad — Servicio Técnico.** Fuente: `openspec/specs/remisiones/spec.md:476-485` en
`ca56c62`.

| # | Paso a paso | Resultado esperado |
|---|---|---|
| 1 | Ficha de un ticket → «Crear remisión» | «¿El equipo llega con novedad?» sin opción preseleccionada |
| 2 | «Sí», sin fotos, continuar | «El equipo llega con novedad: sube al menos una foto antes de crear la remisión.» (`apps/desk/src/components/CrearRemision.tsx:101`) |
| 3 | Leer el 422 de envío | Se entiende sin explicación (`apps/desk/server/routes/remision.ts:291`) |

**Comprobación 2 de `blueprint-equipo-nuevo`, y las otras dos — Servicio Técnico.** Fuente:
`openspec/changes/archive/2026-09-25-blueprint-equipo-nuevo/archive-report.md:84-89`; F1A-03 la hereda
(`openspec/changes/archive/2026-09-27-salidas-verificacion/archive-report.md:89`).

| Paso a paso | Resultado esperado |
|---|---|
| Tablero → un «Equipo nuevo» en `Verificación` | Columna **«Otros»** (`packages/shared/src/estados.ts:105`) |
| Un «Equipo nuevo» en `Ingresado` | Sólo «Ingreso equipo nuevo» |
| Ejecutar una transición del otro flujo | El 409 se entiende sin explicación |

**Verificación en la app de `salidas-verificacion` (F1A-03) — Servicio Técnico / Gerencia.** Fuente:
`openspec/changes/archive/2026-09-27-salidas-verificacion/archive-report.md:88`.

| # | Paso a paso | Resultado esperado |
|---|---|---|
| 1 | Servicio Técnico → «Equipo nuevo» en `Verificación` | «Liberación» y «Rechazo de verificación» |
| 2 | «Liberación» (en uno que de verdad haya que liberar) | Pasa a `Finalizado` |
| 3 | Otro en `Verificación` → «Rechazo de verificación» | Pasa a `Notificado` y ve «Análisis y acciones» |
| 4 | Usuario **sólo de Comercial** → ticket en `Verificación` | Ningún botón |

⚠️ Los pasos 2 y 3 mueven tickets reales. Sin ticket real, uno de prueba, y borrarlo al terminar. **Nuevo en
este rango:** un «Equipo nuevo» que llegue a `Notificado` por el rechazo **no** entra en la alarma de 9 h, que
sólo mide el flujo de servicio (`apps/desk/server/db/sla.ts:48-49`).

#### 6.3.7 · Resto de pendientes del rango (no bloquean nada)

- **`alta-equipo-nuevo-en-ticket` (F1B-14, 1)** — probar el alta con serie nueva y con serie ya registrada
  (`openspec/changes/archive/2026-09-24-alta-equipo-nuevo-en-ticket/tasks.md:46`) y medir series duplicadas
  (`:225`). Sin dueño con nombre.
- **`hojas-vida` (F1B-02)** — comprobaciones de RQ-HV-07 y carga retroactiva de los seis campos, dueño
  Comercial/Gerencia (`openspec/changes/archive/2026-09-23-hojas-vida/archive-report.md:78-90`).
- **`por-entregar-es-espera` (F1B-08, 2026-09-12)** — ficha de un cliente → pestaña «EN ESPERA»: un ticket en
  `Por Entregar` aparece ahí. Sin dueño asignado
  (`openspec/changes/archive/2026-09-12-por-entregar-es-espera/archive-report.md:72-79`).
- **`fechas-derivadas-servidor` (F1A-07)** — en el contenedor, que `America/Bogota` se resuelve (quien tenga
  la consola de EasyPanel); y en `desk.ticket_transitions.values`, contar los instantes sin desplazamiento
  horario (quien tenga acceso a la base)
  (`openspec/changes/archive/2026-09-22-fechas-derivadas-servidor/archive-report.md:126-133`). **Ahora vale para
  tres cosas**: las fechas derivadas, la vigencia de contratos (`apps/desk/server/routes/contratos.ts:33`) y
  las horas hábiles de las alarmas (`packages/shared/src/calendarioLaboral.ts:150`). *Hipótesis:* la imagen
  `node:22-alpine` trae los datos de zona de ICU; no está comprobado.

### 6.4 · Decisiones de Gerencia sin orden

No bloquean el Deploy. Sin ellas, lo publicado queda a medias o apoyado en supuestos.

| Tarea | Qué decide | Qué desbloquea | Dónde está escrita |
|---|---|---|---|
| **P.2 de `parche-iv11-orden-venta`** | Si se rellena la **marca** `ov_elegida_en_app_at` en las filas anteriores al Deploy | Proteger esas filas del sincronizador (R6) | `openspec/changes/archive/2026-09-28-parche-iv11-orden-venta/tasks.md:168-169` |
| **P.2 de `asociacion-ov-ticket`** | Si se rellenan las **asociaciones** anteriores | Que las puertas, el buscador y la alarma de `Remisión creada` no dependan de columnas que el sincronizador puede vaciar (R6) | `openspec/changes/archive/2026-09-28-asociacion-ov-ticket/tasks.md:497-500`; `openspec/config.yaml:3156-3160` en `e3d5e90` |
| **P.5 de `registro-contrato`** | E-086: año y tope de la ampliación | La ampliación, lo único que falta para cerrar F1B-11 | `docs/sdd/ENTRADA.md:1222`; `openspec/changes/archive/2026-09-29-registro-contrato/tasks.md:451`; `docs/sdd/Preguntas_Gerencia_2026-09-29.md:16` |
| **P.3 de `blueprint-soporte-remoto`** | E-090: área de «Asignación», «Ejecutar», «Soporte pendiente» y «Continuación soporte» | Cerrar S-1 como decisión (R15); si alguna es de Comercial, se cambia un dato por transición y la matriz de `apps/desk/server/permisos.test.ts` | `docs/sdd/ENTRADA.md:1253`; `openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/tasks.md:408-409` |
| **P.4 de `alarmas-horas-habiles`** | Si `Notificado` escala al `Coordinador Comercial` (S-3) | Si es otro cargo, se cambia un literal de `ALARMAS_SLA` (`packages/shared/src/sla.ts:138`) y su prueba | `openspec/changes/archive/2026-09-29-alarmas-horas-habiles/tasks.md:414`; `openspec/changes/archive/2026-09-29-alarmas-horas-habiles/archive-report.md:135` |
| **E-082 y E-083** (`salidas-verificacion`) | Familia y gases patrón de la verificación obligatoria; certificado en «Liberación» | R1 y R2 | `docs/sdd/ENTRADA.md:1190`, `:1197`; `docs/sdd/Preguntas_Gerencia_2026-09-29.md:125`, `:129` |

Cualquiera de los dos rellenos de F1B-11 toca **datos de producción**: es una de las cinco razones para parar y
preguntar de la regla de ejecución de `CLAUDE.md`. La P.3 de `alarmas-horas-habiles` no está en esta tabla
porque **sí tiene orden**: antes del Deploy (§6.1.4).

---

## 7 · Lo que NO es desplegable

**Nada en `b1347e0`.** Lo comprobado, una condición por fila:

| Condición que haría `b1347e0` no desplegable | Resultado | Evidencia |
|---|---|---|
| Una migración no idempotente | **No hay.** Las veintitrés sentencias nuevas llevan `IF NOT EXISTS` | §2.1, §2.2 |
| Una restricción nueva que rompa datos existentes o los `INSERT` de `ae5aaf4` | **No hay.** Las restricciones (incluidas las dos claves primarias nuevas) son de tablas nuevas y vacías; las once columnas nuevas son anulables y sin `DEFAULT`; `modalidad` no lleva `CHECK` | §2.1, §4.5 |
| Un interruptor de escritor sin documentar | **No hay variable nueva** (0 líneas añadidas con `process.env` en `3f9d23b..b1347e0`). El único escritor nuevo hacia fuera, el correo de las alarmas, va por `N8N_AVISOS_WEBHOOK_URL`, que nace apagada y está documentada (`DEPLOY.md:131-140`). **Pero** `AVISOS_COPIA_EMAIL` amplió su alcance y `DEPLOY.md:159-160` en `c2b2888` no lo dice: incoherencia documental, **no bloquea** (§3, §6.1.7) | §3 |
| Un estado sin salida en cualquiera de los TRES flujos | **No hay.** En la unión de los tres catálogos (servicio, equipo nuevo y soporte remoto: 44 transiciones, `packages/shared/src/invariantesGrafo.test.ts:172`) el único estado sin salida es `Finalizado` (`packages/shared/src/invariantesGrafo.test.ts:177-181`); la salida de `Solicitud Soporte` es exactamente «Asignación» (`:249-251`). Y la prueba pasa en la ejecución de la cabecera | `packages/shared/src/invariantesGrafo.test.ts:160-181`, `:226-251` |
| Un build, un typecheck o una suite en rojo | **No.** Build y typecheck exit 0; 1.990 pruebas en verde, 2 omitidas | Cabecera |
| Un cambio archivado «no se despliega sin X» con X fuera de `main` o fuera del paquete | **No.** F1B-06 cambio 1 («no se despliega sin F1A-03», `openspec/changes/archive/2026-09-25-blueprint-equipo-nuevo/archive-report.md:32`): F1A-03 es `c373bcc`, en `main`. **`blueprint-soporte-remoto`** («S-6 bloquea el DESPLIEGUE», `openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/archive-report.md:32-39`): lo que pide es que el paquete lleve S-6 con el recuento o «sin medir», y la columna `modalidad` — está en §5.1 y §2.1. **`alarmas-horas-habiles`** («Antes de desplegar hace falta un paquete de despliegue NUEVO», `openspec/changes/archive/2026-09-29-alarmas-horas-habiles/archive-report.md:114`): es este documento, con los seis puntos (§5.1). Los tres de F1B-11 no ponen condición | Barrido de «no se despliega», «bloquea el despliegue» y «antes de desplegar» en los 21 `archive-report.md` del rango |
| Una decisión que haya que tomar antes y sin la cual lo publicado sería otro | **Sólo la P.3 de `alarmas-horas-habiles`**, y su falta de respuesta tiene valor por defecto escrito: apagada, que es `b1347e0` (§6.1.4) | `openspec/changes/archive/2026-09-29-alarmas-horas-habiles/tasks.md:413` |

**El orden importa. Publicar `b1347e0` entero, no un commit intermedio.** Los tramos, del más peligroso al
menos:

- **Siguen siendo peores que los extremos, del paquete anterior:** entre `1b90a80` (F1B-06 cambio 1) y
  `c373bcc` (F1A-03), los tickets en `Verificación` quedaban sin transición; entre `2c43e5c` y `9de5a96`
  (`asociacion-ov-ticket`), liberar una OV no vaciaba las columnas del ticket
  (`openspec/changes/archive/2026-09-28-asociacion-ov-ticket/archive-report.md:63-65`).
- **Entre `8fb8efd` y `30b2019` (soporte remoto): incompleto, no peor.** `8fb8efd` sólo toca `packages/shared`:
  activa S-6 sobre los SR heredados sin que ningún SR nazca todavía en `Solicitud Soporte`
  (`openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/tasks.md:142`). `93e8b15` añade la columna y
  el nacimiento, y el cliente viejo manda altas SR sin `modalidad`: el servidor pone `remoto`
  (`packages/shared/src/flujos.ts:156`; `openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/tasks.md:416`). En ningún intermedio queda un estado sin salida:
  «Asignación» existe desde `8fb8efd`, que es el mismo commit que crea `Solicitud Soporte`. Pero la propia
  tanda pide desplegar los tres juntos.
- **Entre `55eac92` y `b159c6b` (alarmas): incompleto, no peor, con una trampa.** `55eac92` y `c84f875` no
  tienen efecto visible (la regla y las tablas, sin llamador). `ad2b97b` activa las alarmas y **fija el corte**
  en su primera pasada, pero sin `b159c6b` el tablero no enseña la marca: lo vencido antes del corte quedaría
  marcado **sin aviso y sin marca visible** hasta publicar `b159c6b` (la marca se lee después de la fila, así
  que aparecería entonces). **La trampa es que el corte no se vuelve a fijar**: publicar `ad2b97b` y más tarde
  `b1347e0` deja el corte en la fecha de `ad2b97b`, no en la del Deploy completo.

Cualquier commit entre `b159c6b` y `b1347e0` da el mismo código salvo una línea de comentario de prueba
(cabecera).

**Lo que no bloquea pero no se ha podido comprobar:** la versión que corre hoy el worker (§4.2); que la
imagen de `b1347e0` construya en EasyPanel (§4.3); la forma de `books.sales_orders` en la base `desk` de
producción para el bloque 5 (§6.1.6); si el canal de correo de avisos y `AVISOS_COPIA_EMAIL` están puestos en
producción (§3, §6.1.7); y que `America/Bogota` se resuelva en el contenedor (§6.3.7).

---

## 8 · Nota de método

Las citas `ruta:línea` de este documento se comprobaron contra el árbol en `b1347e0`, leyendo la línea. Las
del paquete del 2026-09-29 se re-leyeron así: se listaron los ficheros de `apps/` y `packages/` que cambian en
`3f9d23b..b1347e0` (40), y para cada cita a uno de ellos se calculó su línea de hoy a partir de los tramos de
`git diff -U0 3f9d23b b1347e0` y se volvió a leer. **Ninguna de las citas que trae de aquel documento se ha
desplazado**: las tandas nuevas insertaron al final de los ficheros o en la misma línea, a propósito. Lo que sí
cambió es **lo que dicen** cinco de esas líneas, y se nombran en prosa para que nadie las lea como citas:
la llamada periódica del arranque, que ahora pasa primero por las alarmas y después por el ritmo de contratos;
la línea que calcula la marca de orden de venta en el alta, que ahora calcula también el estado inicial; la
línea de estados sin clasificar de espera, que ahora declara también `Solicitud Soporte`; la línea de
enrutado de flujos, que ahora evalúa antes el soporte remoto; y la del filtro de flujo de la consulta de SLA,
que ahora forma parte de un filtro de dos líneas. Además, la lista de tablas públicas del guardián gana dos
nombres en su última línea, y el `INSERT` del alta nombra una columna más (`modalidad`) sin cambiar de
líneas. Las citas
a `openspec/config.yaml` no se movieron: sus cambios del rango son sustituciones en la misma línea. Las citas
de `docs/sdd/Consulta_SubOV_formato_2026-09-27.sql` hasta la línea 123 no se movieron; el bloque 5 creció tres
líneas y se cita con su extensión de hoy. Las de `ae5aaf4`, `3f9d23b` y `ca56c62` llevan la revisión escrita.

Las cifras de build, typecheck y pruebas son de una ejecución local del 2026-09-29 sobre `b1347e0`.

Todo lo que no se pudo comprobar lleva «hipótesis» o dice «no está medido»: el recuento de SR de S-6 (R14),
el recuento de «Equipo nuevo» de R3, cuántas OV caen en cuarentena (R11), los literales de Books (R12), el
tamaño de lo que se marca en silencio el día del Deploy (§6.1.4), el volumen de la ráfaga tras una reversión
larga (§4.5), si hay alguien con el cargo `Coordinador Comercial` (§6.1.3), el estado del canal de correo y
de `AVISOS_COPIA_EMAIL` en producción, la versión del worker, la construcción de la imagen de `b1347e0`, la
forma de `books.sales_orders` en producción, la zona horaria del contenedor, los procedimientos de copia y de
restauración, el efecto de una pasada lenta de alarmas sobre la sincronización, y la igualdad de bytes entre
la construcción de Windows y la de Alpine.
