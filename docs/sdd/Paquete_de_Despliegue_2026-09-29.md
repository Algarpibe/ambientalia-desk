# Paquete de despliegue — 2026-09-29

Material para la persona que publica Desk 2.0 en producción. **Este documento no publica nada**: lo
escribe un agente que no despliega ni commitea. La publicación es una acción manual: el CI **no
despliega** (`docs/sdd/Paquete_de_Despliegue_2026-09-10.md:5-6`). `.github/workflows/ci.yml` **sí cambia**
en el rango, pero sólo el techo del trinquete de avisos de lint, de 158 a 165 (`f7c9dc1`,
`.github/workflows/ci.yml:41`); no gana ningún paso de despliegue.

*Corrección al paquete anterior:* `docs/sdd/Paquete_de_Despliegue_2026-09-27.md:6` decía que `ci.yml` no
cambiaba en el rango. Era falso ya entonces: `f7c9dc1` (2026-09-23) es anterior a `dcb5c99`
(`git merge-base --is-ancestor f7c9dc1 dcb5c99` → verdadero). Aquel documento es un registro fechado y
no se toca; la corrección vive aquí. No cambia su veredicto.

**Este paquete sustituye al del 2026-09-27 para publicar.** Aquél cubría hasta `dcb5c99`, que **nunca
llegó a producción**: todo se mide otra vez desde `ae5aaf4`, no desde aquel documento.

| Dato | Valor |
|---|---|
| Repositorio | `C:\dev\Desk_2_R1.023`, rama `main` |
| Se publica hasta | `3f9d23b` (HEAD de `main` el 2026-09-29) |
| Base que hoy corre en producción | `ae5aaf4` (2026-09-10 19:20), verificada por sha256 del bundle (`docs/sdd/Paquete_de_Despliegue_2026-09-10.md:22`) |
| Rango medido | **`ae5aaf4..3f9d23b`** |
| `git diff --shortstat ae5aaf4..HEAD` | **407 files changed, 70810 insertions(+), 1283 deletions(-)** |
| Commits del rango | **319** (`git log --oneline ae5aaf4..HEAD`) |
| De ellos, tocan `apps/` o `packages/` | **83** (`git log --oneline ae5aaf4..HEAD -- apps packages`); 16 de ellos posteriores a `dcb5c99` |
| Código tocado | **164 ficheros**, +15.156/−486 (`git diff --shortstat ae5aaf4..HEAD -- apps/ packages/`) |
| Fuera de `apps/` y `packages/` con efecto en la imagen | `Dockerfile` (`COPY scripts ./scripts`) y `package.json` (script `prepare`) — §4.3. Ninguno cambia después de `dcb5c99` |
| Build, tipos y pruebas en `3f9d23b` | `npm run build` → exit 0 · `npm run typecheck` → exit 0 · `npm test` → **155 ficheros y 1.848 pruebas en verde**, 1 fichero y 2 pruebas omitidas (1.850), exit 0 (ejecutado el 2026-09-29) |

El código de `3f9d23b` es el mismo que el de `df28b37`: los dos últimos commits sólo tocan documentación
(`git diff --name-only df28b37..HEAD -- apps packages` → vacío).

---

## 1 · Resumen para quien publica

**Veredicto: `3f9d23b` es DESPLEGABLE, con una comprobación que esta vez es obligatoria y no de
cortesía:** la consulta de §4.4 justo después del Deploy. Las migraciones son todas aditivas e
idempotentes (§2), no hay ninguna variable de entorno nueva (§3), no queda ningún «no se despliega sin X»
pendiente (§7) y build, tipos y pruebas están en verde. Lo que cambia respecto al paquete anterior es el
**coste de que una migración falle en silencio**: con las tablas de F1B-11, si una sentencia se omite,
se rompe el alta de tickets o la sincronización con Zoho, no una pantalla secundaria (§2.2).

**Lo que puede sorprender al equipo, por orden de impacto.**

1. **El buscador de orden de venta deja de ofrecer órdenes.** Ya no salen las que tiene otro ticket
   (por columna o por asociación vigente) ni las de número **en cuarentena** —sufijo no canónico—, y las
   tres puertas rechazan una OV en cuarentena con 422 (§5.1, F1B-11). Cuántas OV caen en cuarentena el
   día uno **no está medido**: lo mide la tarea P.1 de §6.1, que se puede correr **antes** del Deploy.
2. **Los tickets de un cliente con contrato vigente nacen en prioridad `High`**, aunque se elija otra.
   Pero **sólo cuando el contrato esté dado de alta en la app**: hoy la tabla nace vacía, así que el día
   uno no cambia nada hasta que Comercial registre los contratos (P.7, §6.2).
3. **Los tickets de clasificación «Equipo nuevo» cambian de botones** (F1B-06), también los ya abiertos
   (§5.2, riesgo R3).
4. **`Por Entregar` y `Por Entregar / Sin facturar` se mudan de «Tickets abiertos» a «Tickets en
   espera»** (F1B-08, §5.2).
5. **La remisión de entrada pregunta si el equipo llega con novedad**, y con «Sí» exige foto (F1B-04).
6. **Comercial empieza a recibir avisos nuevos en la campana:** discrepancia de orden de venta con Zoho y
   ritmo de consumo de contrato (§5.1). Son sólo de bandeja: no mandan correo.

**Las acciones de persona, en orden.**

1. **Antes del Deploy:** copia de la base (§4.1) y, recomendado, P.1 y P.4 (§6.1), que son de sólo
   lectura y sirven para saber qué va a desaparecer del buscador.
2. **Deploy, y en los minutos siguientes la consulta de §4.4.** Si falta una tabla o columna, se
   revierte (§4.5): no se espera a que alguien la descubra.
3. **Después:** alta de los contratos vigentes (P.7, §6.2), el `INSERT` de los cierres (§6.3) y las
   comprobaciones en la app (§6.4 a §6.6). Las decisiones de Gerencia de §6.5 no bloquean el Deploy.

---

## 2 · Cambios de esquema

### 2.1 · `packages/zoho-sync/src/db/schema.sql` — veinte sentencias nuevas, todas al final del fichero

`git diff ae5aaf4..HEAD -- packages/zoho-sync/src/db/schema.sql` sólo **añade** líneas (+125/−0): ninguna
sentencia existente cambia. La última sentencia que ya existía en `ae5aaf4` es la de
`packages/zoho-sync/src/db/schema.sql:448` (`fecha_aviso_cliente`); todo lo de debajo es nuevo. Commits:
`b7c1ba8`, `3793f87`, `66df3d8`, `f0304ec`, `265cd45` (los que ya recogía el paquete anterior) y
`c289b30`, `4501784`, `9288779` (F1B-11).

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
| 15 | `CREATE UNIQUE INDEX IF NOT EXISTS idx_ov_asoc_numero_vigente ON public.ov_asociaciones (numero) WHERE liberada_at IS NULL` | `packages/zoho-sync/src/db/schema.sql:552` | `public` | **Sí** | Sí, `IF NOT EXISTS` | F1B-11 (`asociacion-ov-ticket`) |
| 16 | `CREATE UNIQUE INDEX IF NOT EXISTS idx_ov_asoc_so_vigente ON public.ov_asociaciones (salesorder_id) WHERE liberada_at IS NULL` | `packages/zoho-sync/src/db/schema.sql:553` | `public` | **Sí** | Sí, `IF NOT EXISTS` | F1B-11 (`asociacion-ov-ticket`) |
| 17 | `CREATE INDEX IF NOT EXISTS idx_ov_asoc_ticket ON public.ov_asociaciones (ticket_id)` | `packages/zoho-sync/src/db/schema.sql:554` | `public` | **Sí** | Sí, `IF NOT EXISTS` | F1B-11 (`asociacion-ov-ticket`) |
| 18 | `CREATE TABLE IF NOT EXISTS public.contratos (id bigserial PRIMARY KEY, …, CONSTRAINT contratos_fin_no_antes_de_inicio CHECK (fecha_fin >= fecha_inicio))` | `packages/zoho-sync/src/db/schema.sql:561-571` | `public` | **Sí** | Sí, `IF NOT EXISTS` (el `CHECK` va dentro del `CREATE`, así que no se reaplica) | F1B-11 (`registro-contrato`) |
| 19 | `CREATE UNIQUE INDEX IF NOT EXISTS idx_contratos_lote ON public.contratos (lote)` | `packages/zoho-sync/src/db/schema.sql:572` | `public` | **Sí** | Sí, `IF NOT EXISTS` | F1B-11 (`registro-contrato`) |
| 20 | `CREATE INDEX IF NOT EXISTS idx_contratos_cliente ON public.contratos (client_id)` | `packages/zoho-sync/src/db/schema.sql:573` | `public` | **Sí** | Sí, `IF NOT EXISTS` | F1B-11 (`registro-contrato`) |

*(Son veinte sentencias en quince filas: la 2-7 agrupa seis `ALTER` iguales.)*

**Las tres de F1B-11 por dentro, restricción a restricción.**

- **`tickets.ov_elegida_en_app_at` y `tickets.ov_zoho_avisada`** van en la tabla `tickets` del esquema
  `desk` (sin calificar, `packages/zoho-sync/src/db/schema.sql:524-525`). Las dos **anulables, sin
  `DEFAULT` y sin `NOT NULL`**. La primera es la marca de fila que protege `orden_venta` y
  `fecha_orden_venta` del sincronizador; la segunda es la marca anti-ruido del aviso de discrepancia
  (comentario en `packages/zoho-sync/src/db/schema.sql:511-515`).
- **`public.ov_asociaciones`** (`packages/zoho-sync/src/db/schema.sql:539-551`): `NOT NULL` en
  `ticket_id`, `numero`, `origen` y `asociada_at` (esta última con `DEFAULT now()`); el resto anulable.
  **Sin clave foránea** hacia `tickets`, a propósito (`:531-532`). Dos índices **únicos parciales**: un
  mismo número de OV (`:552`) o un mismo `salesorder_id` (`:553`) sólo puede estar **vigente**
  (`liberada_at IS NULL`) una vez. Un `salesorder_id` nulo no choca con otro nulo: es la regla de
  PostgreSQL para `NULL` en índices únicos. La tabla no se borra nunca: liberar es un `UPDATE` (`:534-535`).
- **`public.contratos`** (`packages/zoho-sync/src/db/schema.sql:561-571`): `NOT NULL` en `client_id`,
  `lote`, `fecha_inicio`, `fecha_fin`, `creado_por` y `created_at` (`DEFAULT now()`); `ritmo_avisado_trimestre`
  anulable. `CHECK (fecha_fin >= fecha_inicio)` en `:570`. Un solo contrato por lote, por el índice
  único de `:572`. Sin clave foránea a `clients` (`:557`).

**Las cuatro tablas nuevas están clasificadas.** `calendario_cierres`, `equipos_cambios`,
`ov_asociaciones` y `contratos` están en `PUBLIC_TABLES` (`packages/zoho-sync/src/db/migrate.ts:70-73`),
que es lo que exige el guardián de `packages/zoho-sync/src/db/migrate.test.ts`. Las sin calificar
aterrizan en `desk` por las dos vías de siempre: `reorgToDesk` corre antes que `migrate`
(`apps/desk/server/index.ts:26-27`) y la conexión fija `search_path=desk,public`
(`packages/zoho-sync/src/db/pool.ts:5`).

**Todas son ADITIVAS.** Cuatro tablas nuevas, diez columnas nuevas **anulables y sin `DEFAULT`** sobre
tablas existentes, y siete índices, todos sobre tablas nuevas y vacías. No se borra ni se renombra nada,
ninguna columna existente cambia de tipo, y **ninguna restricción nueva recae sobre una tabla que ya
tenga datos**: los `NOT NULL`, el `CHECK` y los índices únicos son todos de tablas que nacen vacías, así
que ninguna sentencia puede fallar por datos existentes. Consecuencia para la reversión: §4.5.

**Ninguna toca las cuatro tablas replicadas** (`desk.activities`, `books.contacts`, `books.sales_orders`,
`books.items`, `DEPLOY.md:42`), así que la regla de orden de `DEPLOY.md:50-51` —DDL primero en el
suscriptor— **no aplica a este paquete**.

**El aviso del paquete anterior sobre el punto y coma ya no aplica.** Decía que la sentencia 11 no
llevaba `;` final y que la siguiente se pegaría a ella. `c289b30` se lo puso: hoy
`packages/zoho-sync/src/db/schema.sql:509` termina en `;`. Comprobado además que **ningún comentario
del bloque nuevo contiene un punto y coma**: las únicas líneas con `;` entre `:449` y `:573` son las
veinte sentencias y los cierres `);`. Importa porque `schemaStatements` trocea el fichero por ese
carácter a ciegas (`packages/zoho-sync/src/db/migrate.ts:19-21`).

### 2.2 · Dónde se aplican: al arrancar, idempotentes, y en silencio si algo falla

- **App:** `main()` corre `reorgToDesk` si el esquema es `desk` y luego `await migrate(pool)`
  (`apps/desk/server/index.ts:26-27`), **antes** de sembrar el administrador, de montar la API y de
  escuchar en el puerto (`apps/desk/server/index.ts:49`, `:57`). Es lo que `DEPLOY.md:175` en `c2b2888` describe como «el
  server corre `migrate`». Ninguna petición llega antes de que la migración haya terminado.
- **Idempotencia, sentencia a sentencia:** las veinte llevan `IF NOT EXISTS` (§2.1, columna
  «¿Idempotente?»). **No hay ninguna que no lo sea.** Cada Deploy vuelve a pasar el fichero entero, y
  en el segundo arranque cada sentencia es una operación vacía. Es lo que afirma `DEPLOY.md:224` en `c2b2888`, y para
  este rango es cierto.
- **Worker `hub-sync`:** `hubBootstrap` llama a `migrate(db)` sobre el hub con **el mismo** `schema.sql`
  (`apps/hub-sync/src/hubSync.ts:13`). Así que las cuatro tablas `public.*` nuevas y las columnas nuevas de
  `tickets` **también se crean en `zoho-hub`** cuando se redespliegue el worker. Es inocuo: el worker no
  cablea el aviso de discrepancia (`apps/hub-sync/src/hub-sync.ts:21`, sin `alDiscrepanciaOV`; lo fija
  `apps/hub-sync/src/hub-sync.guardian.test.ts:17-20`) y nadie escribe marcas ni asociaciones allí.

⚠️ **`migrate` sigue siendo tolerante por sentencia** (`packages/zoho-sync/src/db/migrate.ts:28-33`): si una
sentencia falla, escribe `migrate: sentencia omitida:` en el log y **sigue arrancando**. El paquete
anterior lo decía, y sigue siendo cierto. **Lo que cambia es la consecuencia**, porque el código nuevo
lee estas tablas en caminos centrales:

| Si se omite… | Qué se rompe | Por qué |
|---|---|---|
| sentencia 18 (`public.contratos`) | **El alta de cualquier ticket** responde 500 | El alta consulta si el cliente tiene contrato vigente en cada creación (`apps/desk/server/services/ticketService.ts:106` → `apps/desk/server/db/contratos.ts:68-69`, `SELECT … FROM contratos`) |
| sentencia 14 (`public.ov_asociaciones`) | El **buscador de orden de venta** para elegir una OV (sale vacío o con error), las **tres puertas** de «una OV, un ticket» y la ficha del ticket | `soloLibres` lee la tabla (`packages/zoho-sync/src/books/repo.ts:159-162`) y la tercera vía de las puertas también (`packages/zoho-sync/src/db/repo.ts:371`) |
| sentencia 12 o 13 (columnas de `tickets`) | **La sincronización con Zoho Desk entera** y el alta de tickets | `upsertTicket` lee las dos columnas de cada ticket que sincroniza (`packages/zoho-sync/src/db/repo.ts:67`); el alta escribe la marca en su `INSERT` (`packages/zoho-sync/src/db/repo.ts:418-422`) |
| sentencias 15-17, 19-20 (índices) | Nada visible de inmediato. Sin los únicos, la base deja de impedir dos asociaciones vigentes de la misma OV o dos contratos del mismo lote en una carrera | La ruta sigue comprobando antes (`apps/desk/server/routes/contratos.ts:55`), pero la carrera la cierra el índice |

Un fallo de migración **no tumba el Deploy ni se ve en pantalla hasta que alguien crea un ticket**. Por
eso §4.4 incluye una consulta de sólo lectura que comprueba que las cuatro tablas, las diez columnas, los
siete índices y el `CHECK` existen, y §4.5 dice que si falta algo se revierte.

*Hipótesis sobre por qué podría fallar una sentencia:* ninguna razón conocida. Las que fallaban en el
pasado eran índices sobre columnas de esquemas viejos antes del `recreate` (comentario de
`packages/zoho-sync/src/db/migrate.ts:26-28`); aquí todas las tablas son nuevas. Un usuario de base sin
permiso de `CREATE` en `public` sería una causa posible y no está medida.

### 2.3 · Otros ficheros SQL del rango

| Fichero | Qué añade | Dónde corre | ¿Idempotente? |
|---|---|---|---|
| `packages/zoho-sync/src/booksHub/schema-books.sql` | `CREATE TABLE IF NOT EXISTS books.retainer_invoices` (facturas de anticipo), commit `a233e1d` | Sólo en `zoho-hub`, vía `migrateBooks` (`apps/hub-sync/src/hubSync.ts:24`) | Sí |
| `packages/zoho-sync/src/crmHub/schema-crm.sql` | `ALTER TABLE crm.deals ADD COLUMN IF NOT EXISTS stage_detail_synced_at` y `… stage_history_synced_at` (`timestamptz`), commits `3fc4768` y `030efa7` | Sólo en `zoho-hub`, vía `migrateCrm` (`apps/hub-sync/src/hubSync.ts:80`) | Sí |
| `docs/sdd/Consultas_Recuentos_2026-09-25.sql`, `docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql` | Consultas de recuento | Nadie las ejecuta al desplegar: `docs` no entra en la imagen (`.dockerignore`) | — |
| `docs/sdd/Consulta_SubOV_formato_2026-09-27.sql` | Barrido de sólo lectura de los números de OV con formato no canónico (bloques 1-4) y de los literales de estado de Books (bloque 5) | A mano: tareas P.1 y P.4 de §6.1 | No escribe nada: bloques 1-4 dentro de `BEGIN READ ONLY … ROLLBACK` (`docs/sdd/Consulta_SubOV_formato_2026-09-27.sql:50`, `:116`). **El bloque 5 queda fuera** de esa transacción (`:118-131`), y el propio fichero lo avisa (`:122-123`) |
| `docs/sdd/Alta_Cierres_Fin_de_Año_2026.sql` | El `INSERT` de los cierres | A mano, **después** del Deploy: §6.3 | Sí, `ON CONFLICT (fecha) DO NOTHING` |

`books.retainer_invoices` es tabla nueva del hub y **no está** en la replicación (`DEPLOY.md:42`): no hace
falta crearla en `desk`.

---

## 3 · Variables de entorno e interruptores

**Ninguna nueva.** Medido sobre el diff entero:

- `git diff ae5aaf4..HEAD -- apps packages` filtrado por `process.env`, `import.meta.env`, `VITE_` y
  `=== 'true'`: las líneas añadidas están en siete ficheros, **todos** del detector de citas, de la
  reconciliación o de sus pruebas (`git diff -G'process\.env' --name-only ae5aaf4..HEAD -- apps packages`
  → `apps/desk/server/citas/cli.ts`, `apps/desk/server/citas/git.ts`, tres `*.test.ts` de `citas/`,
  `apps/desk/server/reconciliacion/cli.ts` y `apps/desk/server/testing/reposDePrueba.ts`). Son herramientas
  de repositorio: no las carga ni la App ni el worker.
- **Después de `dcb5c99` no se añade ni una**: `git diff dcb5c99..HEAD -- apps packages`, líneas
  añadidas con `process.env` → 0. F1B-11 entero no lee ninguna variable.
- `packages/zoho-sync/src/config.ts` **no cambia** en el rango (`git diff ae5aaf4..HEAD -- packages/zoho-sync/src/config.ts` → vacío).
- `.env.example` **no cambia** en el rango: `git diff --name-only ae5aaf4..HEAD` no lo lista. `DEPLOY.md`
  cambia (+21/−2), pero no después de `dcb5c99` y no añade ninguna variable.

**Los dos escritores nuevos de F1B-11 no tienen interruptor, y se dice por qué no es un defecto.** La regla
de secretos de `CLAUDE.md` pide que un interruptor que enciende un escritor nazca cerrado. Aquí no hay
interruptor que documentar porque los dos escritores automáticos nuevos escriben **sólo en la bandeja
interna de la app**, no hacia fuera:

- El **aviso de discrepancia de orden de venta** a Comercial (`apps/desk/server/services/avisoDiscrepanciaOV.ts:24-46`),
  cableado sólo en la App (`apps/desk/server/index.ts:23`). El correo quedó fuera de alcance
  (`openspec/changes/archive/2026-09-28-parche-iv11-orden-venta/archive-report.md:22-23`).
- El **aviso de ritmo de contrato** a Comercial (`apps/desk/server/services/avisoRitmoContrato.ts:25-37`),
  que «sólo es de bandeja: `crearAviso` no rellena `enviado_at` ni llama al canal de correo»
  (`apps/desk/server/services/avisoRitmoContrato.ts:21`).

Ninguno escribe en Zoho ni manda correo. Si alguna tanda posterior les da canal de correo, entonces sí
necesitan interruptor cerrado y documentado.

**Lo que sí existe y conviene no confundir:**

- `APP_ENTRYPOINT` elige qué proceso arranca la imagen (`Dockerfile:27-29`). Ya estaba en `ae5aaf4`.
- La pasada de ritmo cuelga del intervalo de sincronización que ya existía (`SYNC_INTERVAL_MS`,
  `packages/zoho-sync/src/config.ts:88`, 180.000 ms por defecto): corre al principio de cada ciclo
  (`apps/desk/server/index.ts:88`), como mucho una vez por día y proceso
  (`apps/desk/server/services/avisoRitmoContrato.ts:67-69`).
- Las funciones nuevas del worker (historia de tickets, fases de CRM, facturas de anticipo) cuelgan de
  credenciales y flags **que ya existían** (`DEPLOY.md:189-198` en `c2b2888`). Detalle en §5.2.

---

## 4 · Procedimiento

### 4.1 · Copia de la base ANTES del Deploy

**Es obligatoria y no es higiene: es la única red.** Gerencia decidió no montar copia de pruebas y
aceptó por escrito que todo despliegue se prueba sobre la aplicación que usa la gente
(`openspec/config.yaml:1705-1707`, `decision/e013b-copia-pruebas`). Y decidió también que haya **copia
previa a cada cambio que se suba**, con responsable **Alfonso (Gerencia)** (`openspec/config.yaml:2253-2259`,
`decision/p55-backup`, consecuencia (1) en `:2261`).

**Esta vez pesa más que el 2026-09-27**, por una razón concreta: F1B-11 escribe datos nuevos en tres
sitios —asociaciones, contratos y marcas de fila— que la reversión de código no deshace (§4.5). Si hubiera
que volver al estado exacto de antes, la copia es el único camino.

**Cómo:** `DEPLOY.md` **no describe** ningún procedimiento de copia. Lo siguiente es **hipótesis**, no
procedimiento verificado: una copia lógica de la base `desk` con `pg_dump` desde un contenedor que llegue
al servicio `desk-db`, con la cadena de conexión que da EasyPanel en la variable `DATABASE_URL` del
servicio App —el **nombre** de la variable, nunca su valor en un chat—:

```bash
# HIPÓTESIS de procedimiento: no está en DEPLOY.md ni verificado contra EasyPanel.
pg_dump --format=custom --file=desk_antes_de_3f9d23b.dump "$DATABASE_URL"
```

Criterio de hecho, sea cual sea el método: **existe un fichero de copia con fecha de hoy, fuera del
servidor, y su tamaño no es cero.** Si la copia automática nocturna del adelanto de `p55-backup` ya está en
marcha, la copia previa sigue siendo necesaria: la nocturna puede tener horas de antigüedad. Ningún
documento del repositorio registra que esa copia nocturna esté ya funcionando.

`zoho-hub` **no necesita copia por este paquete** en el mismo sentido: sus cambios son aditivos (§2.2,
§2.3) y todo su contenido se puede volver a traer de Zoho. Hipótesis: rehacerlo cuesta un backfill completo.

### 4.2 · Publicar

**`DEPLOY.md` ya cubre el mecanismo. No se repite aquí.**

- **App:** `DEPLOY.md` §5 «Desplegar» (`DEPLOY.md:174-177` en `c2b2888`) — botón **Deploy** en EasyPanel; el server corre
  `migrate` en el arranque; luego se abre el dominio.
- **Worker `hub-sync`:** `DEPLOY.md` §7 (`DEPLOY.md:183-202` en `c2b2888`). Mismo repositorio y misma imagen, arranque
  `npm run start:hub-sync`. Trae los cambios del worker de §5.2 y, desde `dcb5c99`, sólo un cambio más en
  código compartido: la devolución opcional del aviso de discrepancia en `packages/zoho-sync/src/sync.ts`,
  que el worker no usa. Conviene redesplegarlo, pero es **independiente** de la App. Qué versión corre hoy
  el worker **no está verificado** en ningún documento del repositorio (hipótesis: la misma época que la
  App).
- **Idempotencia de la migración:** `DEPLOY.md:224` en `c2b2888`. Cierta para este rango (§2.2), con la salvedad de la
  tolerancia por sentencia.
- **Orden con la replicación lógica:** no aplica (§2.1).
- **Publicar `3f9d23b` entero, no un commit intermedio** (§7).

### 4.3 · Lo que este rango cambia en la imagen y `DEPLOY.md` no dice

`f962e81` añadió al `Dockerfile` `COPY scripts ./scripts` antes del `npm ci` de la etapa de ejecución
(`Dockerfile:19-22`), porque `package.json` tiene un script `prepare` (`package.json:11`) que corre
`scripts/instalar-hooks.mjs` en cada `npm ci`. Ese script **nunca falla `npm ci`**: sin `.git` o sin binario
`git` sale con 0 (`scripts/instalar-hooks.mjs:19-23`), y `.git` no entra en la imagen (`.dockerignore`).

**Desde `dcb5c99` no cambia nada de lo que decide cómo se construye la imagen:** `Dockerfile`,
`package.json`, `package-lock.json`, `scripts/` y `.dockerignore` sin cambios en `dcb5c99..HEAD`. La
construcción local del 2026-09-27 sobre `10453a9` (Docker 29.6.2, `--no-cache`, salida 0, `tsx v4.22.4`
dentro de la imagen; `docs/sdd/Paquete_de_Despliegue_2026-09-27.md:196-199`) sigue siendo representativa
**del procedimiento de construcción**. Que la imagen de `3f9d23b` construya igual es **hipótesis**: el
código cambió y la imagen no se ha vuelto a construir. **Si el Deploy falla en el build**, mirar el
`npm ci` y este `COPY`.

### 4.4 · Comprobar que producción está en el commit publicado

**Mismo método que el 2026-09-10** (`docs/sdd/Paquete_de_Despliegue_2026-09-10.md:22`): el bundle principal
que sirve producción tiene que ser **byte a byte** el que sale de construir el commit.

1. Construcción local de `3f9d23b`, hecha el 2026-09-29 con `npm run build`:
   - fichero: `dist/assets/index-BjR4xbDo.js`
   - sha256: `835202ef8c4e1e6af81af6395d58bdef43c9536f1e402d71240df1b9877dad7e`
2. En producción, abrir `https://ambientalia-desk.ambientalia.cloud/`, ver en el código fuente de la
   página qué `index-*.js` carga, descargarlo y calcular su sha256.
3. **Nombre y sha256 iguales ⇒ producción ≡ `3f9d23b`.** Desde ese momento, «sin desplegar» se cuenta desde
   `3f9d23b` y no desde `ae5aaf4`.

*Límite del método, escrito para que nadie lo lea como más de lo que es:* la construcción de referencia se
hizo en Windows y la de producción en `node:22-alpine`. Que den los mismos bytes es **hipótesis**; el
2026-09-10 salieron iguales para `ae5aaf4`. Si el nombre coincide y el sha256 no, no concluir nada:
reconstruir en Linux antes. Y el bundle **sólo prueba el cliente**: el servidor sale de la misma imagen
(`Dockerfile:1-29`), así que se infiere, como el 2026-09-10.

**Y que la migración entró — obligatorio, en los minutos siguientes al Deploy (§2.2).** En la consola de
PostgreSQL de producción, base `desk`, **sólo lectura**:

```sql
SELECT to_regclass('public.calendario_cierres') AS cierres,
       to_regclass('public.equipos_cambios')    AS cambios,
       to_regclass('public.ov_asociaciones')    AS asociaciones,
       to_regclass('public.contratos')          AS contratos;
-- Deben salir los cuatro nombres, ninguno NULL.

SELECT table_schema, table_name, column_name
  FROM information_schema.columns
 WHERE (table_schema, table_name, column_name) IN (
        ('desk','tickets','history_synced_at'),
        ('desk','tickets','ov_elegida_en_app_at'), ('desk','tickets','ov_zoho_avisada'),
        ('desk','equipos','fecha_adquisicion'),    ('desk','equipos','fecha_factura_compra'),
        ('desk','equipos','fin_garantia'),         ('desk','equipos','codigo_interno'),
        ('desk','equipos','mantenedor_id'),        ('desk','equipos','drive_url'),
        ('public','remisiones','hay_novedad'))
 ORDER BY 1, 2, 3;
-- Deben salir 10 filas.

SELECT indexname FROM pg_indexes
 WHERE schemaname = 'public'
   AND indexname IN ('idx_equipos_cambios_equipo', 'idx_ov_asoc_numero_vigente', 'idx_ov_asoc_so_vigente',
                     'idx_ov_asoc_ticket', 'idx_contratos_lote', 'idx_contratos_cliente')
 ORDER BY 1;
-- Deben salir 6 filas.

SELECT conname FROM pg_constraint WHERE conname = 'contratos_fin_no_antes_de_inicio';
-- Debe salir 1 fila.
```

Si falta algo, buscar `migrate: sentencia omitida` en el log del servicio App (§2.2) y **pasar a §4.5**:
con `public.contratos` o las dos columnas de `tickets` ausentes, el alta de tickets o la sincronización
están rotas (§2.2), y no es un estado en el que se pueda dejar la app mientras se investiga.

**Y que la App arrancó sin errores nuevos.** En el log del servicio App no debe aparecer
`pasadaRitmoContratos falló` (`apps/desk/server/services/avisoRitmoContrato.ts:73`) tras el primer ciclo
de sincronización (unos tres minutos con el intervalo por defecto, `packages/zoho-sync/src/config.ts:88`).

### 4.5 · Reversión

**Volver atrás = redesplegar `ae5aaf4` desde EasyPanel** (`DEPLOY.md` §5). **La base no hay que tocarla**
para que `ae5aaf4` funcione, y se ha comprobado sentencia a sentencia por qué:

- Las diez columnas nuevas sobre tablas existentes son **anulables y sin `DEFAULT`** (§2.1). Los `INSERT`
  de `ae5aaf4` nombran sus columnas y no incluyen éstas, así que les llega `NULL` y ninguna restricción se
  queja. No hay **ningún `NOT NULL` nuevo sobre una tabla que `ae5aaf4` escriba**.
- Las cuatro tablas nuevas (`calendario_cierres`, `equipos_cambios`, `ov_asociaciones`, `contratos`) **no
  las nombra `ae5aaf4`**, así que sus `NOT NULL`, su `CHECK` y sus índices únicos no pueden rechazar nada
  que escriba el código viejo.
- Ninguna tabla nueva tiene clave foránea (§2.1), así que el código viejo tampoco puede chocar al borrar
  un ticket.
- El `migrate` de `ae5aaf4` sólo reaplica su `schema.sql`, que es un prefijo del nuevo
  (`packages/zoho-sync/src/db/schema.sql:1-448` no cambia en el rango).

**Lo que la reversión de código NO deshace, y hay que saberlo antes de pulsar:**

- **Un ticket que haya llegado a `Verificación` se queda sin salida.** En `ae5aaf4`,
  `packages/shared/src/transitions.ts` no menciona `Verificación` ni una vez
  (`git show ae5aaf4:packages/shared/src/transitions.ts`, 0 coincidencias). Por eso la reversión, si se
  decide, conviene **antes** de que alguien use la transición «Verificación».
- **La protección de la orden de venta se apaga, pero las marcas se quedan.** El `upsertTicket` de
  `ae5aaf4` no lee `ov_elegida_en_app_at`, así que el sincronizador vuelve a sobrescribir `orden_venta` y
  `fecha_orden_venta` en las filas marcadas: IV-11 vuelve a estar como hoy en producción. Al republicar,
  las marcas siguen ahí y vuelven a proteger, pero con el valor que el sincronizador haya dejado entre medias.
- **Las asociaciones se congelan.** Mientras corra `ae5aaf4`, ni el alta, ni las transiciones, ni la
  remisión escriben en `public.ov_asociaciones`, y la tercera puerta de la remisión desaparece (en
  `ae5aaf4` responde 201 con una OV ya usada, `docs/sdd/Paquete_de_Despliegue_2026-09-27.md:313`). Al
  republicar, *hipótesis*: una OV vigente en `ov_asociaciones` que el código viejo haya puesto en las
  columnas de otro ticket haría que las tres puertas digan «ya asociada» para los dos, y habría que
  liberarla a mano desde la ficha.
- **Las prioridades `High` puestas por contrato se quedan**, y los contratos registrados siguen en
  `public.contratos` sin que nadie los lea. Vuelven a actuar al republicar.
- **Los datos escritos por la versión nueva se quedan** y la vieja no los enseña: los seis campos
  comerciales del equipo, `public.equipos_cambios`, la respuesta de novedad de las remisiones, los cierres
  de `public.calendario_cierres`, las asociaciones y sus liberaciones, los contratos y los avisos ya
  creados en la bandeja (éstos sí los enseña la versión vieja: la bandeja ya existía).
- Un ticket «Equipo nuevo» que avanzó por el flujo nuevo hasta `En Proceso` vuelve a ver las transiciones
  de servicio de `En Proceso`. No se queda varado, pero cambia de camino a mitad.

**Volver al estado exacto de la base anterior** —no sólo al código— es restaurar la copia de §4.1. Se
pierde **todo** lo escrito después del Deploy: tickets creados en la app, remisiones, transiciones,
asociaciones, contratos, avisos. Los tickets que vienen de Zoho los vuelve a traer la sincronización
(hipótesis: la siguiente pasada incremental; un backfill completo sólo si la tabla queda vacía,
`apps/desk/server/index.ts:61-69`). El procedimiento es **hipótesis**, igual que el de la copia:

```bash
# HIPÓTESIS: no está en DEPLOY.md ni verificado contra EasyPanel. Con la App PARADA.
pg_restore --clean --if-exists --dbname="$DATABASE_URL" desk_antes_de_3f9d23b.dump
```

Sólo tiene sentido **junto con** redesplegar `ae5aaf4`: si se restaura la base y sigue corriendo
`3f9d23b`, su `migrate` vuelve a crear las tablas vacías en el siguiente arranque, que es inocuo pero no
es lo que se pretendía. Orden: parar la App, restaurar, desplegar `ae5aaf4`.

**Señales que obligan a volver atrás:**

| Señal observable | Dónde se ve | Qué significa |
|---|---|---|
| Falta una tabla, columna, índice o el `CHECK` en la consulta de §4.4 | Consola de PostgreSQL | Migración omitida (§2.2). Revertir y leer el log |
| El tablero se queda en blanco tras el Deploy | Cualquier vista | Fallo de arranque o del `dist/`. Revisar logs del servicio App |
| El build falla en EasyPanel | Pestaña de despliegue | Ver §4.3. Producción sigue en `ae5aaf4`: no hay nada que revertir |
| **No se puede crear ningún ticket** (500) | Alta de ticket → Guardar | Falta `public.contratos` o la marca de `tickets` (§2.2), o la rama de equipo nuevo del alta (`apps/desk/server/services/ticketService.ts:24`) rechaza lo que no debe |
| **El buscador de orden de venta sale siempre vacío**, también con órdenes que nadie usa | Alta de ticket, remisión o transición con orden de venta | Falta `public.ov_asociaciones` (`packages/zoho-sync/src/books/repo.ts:159-162`). Ojo: que falten las de cuarentena o las ya usadas es lo esperado |
| **Los tickets dejan de actualizarse desde Zoho** y el log repite errores de `upsertTicket` | Tablero, y log del servicio App | Faltan las columnas de `tickets` (`packages/zoho-sync/src/db/repo.ts:67`) |
| **No se puede crear ninguna remisión** | Ficha de ticket → «Crear remisión» | La guarda de novedad (`apps/desk/server/routes/remision.ts:290-291`) o la pregunta obligatoria del formulario (`apps/desk/src/components/CrearRemision.tsx:100`) bloquean de más |
| **Un ticket de servicio NO «Equipo nuevo» ve los botones del flujo de equipo nuevo** | Ficha del ticket | El enrutado de flujos (`packages/shared/src/flujos.ts:56-61`) está fallando |
| Errores 500 al guardar un equipo | Equipos → Editar | Falta una columna de §2.1: comprobar con §4.4 |

**Señales que NO son motivo de reversión:** una OV que ya no sale en el buscador porque está en otro
ticket o en cuarentena (§5.1, es lo que se publica); un 422 con «tiene un sufijo que no es canónico» o
«su contrato nº N venció» (reglas nuevas); un ticket nuevo que nace `High` (tiene contrato vigente); un
ticket «Equipo nuevo» que ofrece «Ingreso equipo nuevo» en vez de «Ingreso a Servicio»; un ticket en
`Verificación` en la columna «Otros»; el 422 «El equipo llegó con novedad y la remisión no tiene fotos».

---

## 5 · Cambios de comportamiento

Producción no tiene **ninguno** de los de esta sección. La tanda de cada cambio sale de la cabecera
`tanda:` de su `proposal.md` archivado.

### 5.1 · F1B-11 — los tres cambios posteriores al paquete del 2026-09-27

Los tres llevan `tanda: F1B-11` y `cierra: no`: la fila sigue abierta porque falta la ampliación de
contrato, bloqueada por E-086 (`openspec/changes/archive/2026-09-29-registro-contrato/archive-report.md:21-23`).

| Cambio archivado (`cierra`) | Qué ve el usuario | Ruta:línea que lo produce |
|---|---|---|
| `2026-09-28-parche-iv11-orden-venta` (`cierra: no`) | **Nada en pantalla, salvo un aviso nuevo.** Una orden de venta elegida en la app —en el alta, en «Habilitar Servicio» o en la remisión de entrada— deja de ser sobrescrita por la sincronización con Zoho. Si Zoho trae otra distinta, Comercial recibe en la campana: «Zoho trae la orden de venta X para el ticket #N, pero la aplicación tiene Y. Se conserva la de la aplicación: revise cuál es la correcta.» Un solo aviso por ticket mientras el valor de Zoho no cambie | Marca: alta `packages/zoho-sync/src/db/repo.ts:418`, transición `:305`, remisión `apps/desk/server/routes/remision.ts:240`. Protección: `packages/zoho-sync/src/db/repo.ts:73-78`. Detección: `:79`. Aviso: `apps/desk/server/services/avisoDiscrepanciaOV.ts:38`, anti-ruido `:30`. Cableado: `apps/desk/server/index.ts:23` |
| `2026-09-28-asociacion-ov-ticket` (`cierra: no`) | **(1) El buscador de orden de venta ya no ofrece** las OV que tiene otro ticket (por columna o por asociación vigente) **ni las OV en cuarentena** —número con sufijo no canónico—. **(2) Las tres puertas rechazan una OV en cuarentena** con 422 «La orden de venta N tiene un sufijo que no es canónico (se espera OV-AAAA-NNN-NN, con dos dígitos): corrige el número en Books antes de asociarla». **(3) «Aprobación» y «Aprobación y S. Repuestos» añaden un campo opcional «OV adicional»** que asocia otra OV sin tocar la de entrada. **(4) Nueva sección plegada «ÓRDENES DE VENTA (N vigentes, M liberadas)»** en la ficha del ticket, con origen, fecha y quién. **(5) Botón «Liberar»** sólo para Comercial y administradores: pide motivo; el servidor responde 403 «Liberar una orden de venta requiere el área Comercial», 409 «La asociación ya estaba liberada» o 422 «El motivo de la liberación es obligatorio». Liberar conserva la fila y vacía la OV de las columnas del ticket. **(6) En Configuración → «Administración de datos», entrada nueva «Órdenes de venta: cuarentena y saldo por lote»**: lista de OV en cuarentena y consulta de saldo de un lote (creadas, consumidas, libres, % consumido). **(7) Eliminar un ticket libera sus asociaciones** con motivo «Ticket eliminado» | Buscador: `packages/zoho-sync/src/books/repo.ts:159-162` y `:176`; parámetro en `apps/desk/server/routes/directory.ts:57`. Cuarentena: `packages/shared/src/subOV.ts:39`; puertas: alta `apps/desk/server/services/ticketService.ts:96`, transición `:134`, remisión `apps/desk/server/routes/remision.ts:220`. OV adicional: `packages/shared/src/transitions.ts:199`, `:203`, `:374`. Ficha: `apps/desk/src/components/TicketDetailView.tsx:320`, `apps/desk/src/components/PanelOvAsociaciones.tsx:89`. Liberar: `apps/desk/server/routes/ovAsociaciones.ts:40-55`, limpieza de columnas `packages/zoho-sync/src/db/ovAsociaciones.ts:112-120`. Configuración: `apps/desk/src/components/Configuracion.tsx:127`, `:165`. Borrado: `apps/desk/server/db/eliminarTicket.ts:154` |
| `2026-09-29-registro-contrato` (`cierra: no`) | **(1) En Configuración → «Administración de datos», entrada nueva «Contratos por lote»**: lista de contratos (lote, cliente, fechas, nº) y, para Comercial y administradores, botón «Nuevo contrato» con Cliente, Lote (OV madre, `OV-AAAA-NNN`), Inicio y Fin. **No hay editar ni borrar** un contrato desde la app. **(2) Ficha del contrato**: estado (No iniciado / Vigente / Vencido), saldo del lote, informe por trimestre con «% ejecutado acumulado» y botón «Exportar CSV». **(3) Prioridad `High` al nacer**: si el cliente del ticket tiene un contrato vigente hoy, el servidor pone `High` aunque se elija otra. **(4) Guarda de contrato vencido en las tres puertas**: una subOV de un lote cuyo contrato venció se rechaza con 422 «La orden de venta N es del lote L, y su contrato nº C venció el F: no se puede asociar a ningún ticket». **(5) Marca «DE CONTRATO»** en la ficha del ticket cuando alguna OV vigente del ticket es subOV de un contrato vigente. **(6) Aviso de ritmo a Comercial** en la campana: «El contrato nº C del lote L (cliente) lleva E de N subOV ejecutadas y vence el F: al ritmo actual no se consumirán todas. Conviene proponer la ampliación.» Sólo desde el segundo trimestre del contrato y una vez por trimestre | Pantallas: `apps/desk/src/components/Configuracion.tsx:127`, `:165`; `apps/desk/src/components/ContratosPanel.tsx:24`, `:36`, `:95-116`; `apps/desk/src/components/ContratoFicha.tsx:41`, `:66`. Rutas: `apps/desk/server/routes/contratos.ts` (§5.1 bis). Prioridad: `apps/desk/server/services/ticketService.ts:106`, regla `packages/shared/src/contratos.ts:66-69`. Vencido: alta `apps/desk/server/services/ticketService.ts:96`, transición `:147`, remisión `apps/desk/server/routes/remision.ts:220`; mensaje `packages/shared/src/contratos.ts:57`. Marca: `apps/desk/src/components/MarcaContrato.tsx:16`, derivada en `apps/desk/server/db/contratos.ts:106-115`. Ritmo: `apps/desk/server/services/avisoRitmoContrato.ts:41`, `:49`, pasada en `apps/desk/server/index.ts:88` |

**§5.1 bis · Las dos rutas nuevas, con su guarda.** Todas cuelgan de `requireAuth(db)`, que responde 401
sin sesión o con sesión caducada (`apps/desk/server/auth/middleware.ts:17`, `:19`). Se montan en
`apps/desk/server/app.ts:61`, **antes** del 404 JSON de `/api` (`apps/desk/server/app.ts:73`). El permiso
se consume de `canExecuteTransition(areas, isAdmin, 'Comercial')` de `@ambientalia/shared`, que deja pasar
siempre a los administradores (`packages/shared/src/permissions.ts:4-7`).

| Método y ruta | Guarda, en orden | Ruta:línea |
|---|---|---|
| `GET /api/tickets/:id/ov-asociaciones` | Sólo sesión | `apps/desk/server/routes/ovAsociaciones.ts:26-28` |
| `GET /api/ov-asociaciones/cuarentena` | Sólo sesión | `apps/desk/server/routes/ovAsociaciones.ts:30-32` |
| `GET /api/ov-asociaciones/saldo/:lote` | Sesión → 422 si el lote no es `OV-AAAA-NNN` | `apps/desk/server/routes/ovAsociaciones.ts:34-38` (422 en `:36`) |
| `PUT /api/ov-asociaciones/:id/liberar` | Sesión → **404** asociación inexistente (`:45`) → **403** sin Comercial (`:47`) → **409** ya liberada (`:48`) → **422** motivo vacío tras `trim` (`:51`) → transacción (`:53`) → 409 si otra petición la liberó entre medias (`:54`) | `apps/desk/server/routes/ovAsociaciones.ts:40-56` |
| `GET /api/contratos` | Sólo sesión | `apps/desk/server/routes/contratos.ts:24-26` |
| `GET /api/contratos/:id` | Sesión → 404 si no existe o el id no es numérico | `apps/desk/server/routes/contratos.ts:28-34` (404 en `:32`) |
| `GET /api/tickets/:id/contrato` | Sólo sesión | `apps/desk/server/routes/contratos.ts:36-38` |
| `POST /api/contratos` | Sesión → **403** sin Comercial, **antes de leer el cuerpo** (`:43`) → **422** lote mal formado (`:49`), fechas ausentes (`:50`), fin antes que inicio (`:51`), cliente inexistente (`:52`) → **409** lote ya registrado (`:55`) → **409** carrera cazada por el índice único (`:59`) → 201 | `apps/desk/server/routes/contratos.ts:40-62` |
| `GET /api/contratos/:id/informe` | Sesión → 404 si no existe | `apps/desk/server/routes/contratos.ts:65-70` (404 en `:68`) |

**No existe** `PUT` ni `DELETE` sobre `/api/contratos`. El `409` de una carrera en asociaciones sale por el
manejador central (`OvYaAsociadaError`, `packages/zoho-sync/src/db/ovAsociaciones.ts:49-50`;
`apps/desk/server/app.ts:79`). En `liberar`, el 404 va antes que el 403 a propósito, por la escalera de
precedencia de F1B-10 (`apps/desk/server/routes/ovAsociaciones.ts:16-17`): un usuario sin Comercial puede
así saber si un id de asociación existe. Es una lectura que cualquier usuario con sesión ya tiene por
`GET /api/tickets/:id/ov-asociaciones`, así que no abre nada nuevo.

**Regla 13, decisión a decisión de los `.tsx` nuevos.** El botón «Liberar» sólo se enseña con permiso
(`apps/desk/src/components/PanelOvAsociaciones.tsx:82`) y lo impone `apps/desk/server/routes/ovAsociaciones.ts:47`;
el motivo no se comprueba en el cliente (`apps/desk/src/components/PanelOvAsociaciones.tsx:14-16`) y lo
impone `apps/desk/server/routes/ovAsociaciones.ts:51`. El botón «Nuevo contrato» sólo se enseña con permiso
(`apps/desk/src/components/ContratosPanel.tsx:24`, `:36`) y lo impone `apps/desk/server/routes/contratos.ts:43`.
La ficha del contrato no calcula ninguna cifra (`apps/desk/src/components/ContratoFicha.tsx:10`): las da
el servidor. La prioridad `High` no la decide el cliente: `apps/desk/server/services/ticketService.ts:106`.

### 5.2 · Los demás cambios del rango que tocan `apps/` o `packages/`

Todos venían ya en el paquete del 2026-09-27; se re-comprobaron sus citas contra `3f9d23b`. Los ficheros
de cliente que citan no han cambiado desde `dcb5c99`; las citas de servidor que se movieron llevan aquí su
línea de hoy.

**Las cinco tandas del encargo anterior, con efecto visible:**

| Tanda | Cambio archivado (`cierra`) | Qué ve el usuario | Ruta:línea que lo produce |
|---|---|---|---|
| **F1B-12** | `2026-09-24-calendario-laboral` (`cierra: si`) | **Nada todavía.** Módulo de calendario hábil, tabla de cierres y lector, sin ningún consumidor (`openspec/changes/archive/2026-09-24-calendario-laboral/archive-report.md:15-19`) | Lector: `apps/desk/server/db/calendarioCierres.ts:31-34`. Módulo: `packages/shared/src/calendarioLaboral.ts` |
| **F1B-14** (1) | `2026-09-24-alta-equipo-nuevo-en-ticket` (`cierra: no`) | **Alta de ticket con equipo que aún no existe**: bloque «Equipo nuevo» cuando la clasificación es «Equipo nuevo» y no hay equipo elegido. Errores nuevos: «Faltan datos del equipo nuevo: …» y «Modelo no encontrado» (422) | Cliente: `apps/desk/src/components/CreateTicket.tsx:55`, bloque `:367-409`. Servidor: `apps/desk/server/services/ticketService.ts:24`, `apps/desk/server/services/equipoNuevo.ts:41` y `:44` |
| **F1B-14** (2) | `2026-09-25-edicion-comercial-equipo` (`cierra: si`) | **Botón «Editar» en la hoja de vida y sección «Cambios».** Sin Comercial ni administrador, tres campos en sólo lectura y 403 en el servidor | Cliente: `apps/desk/src/components/HojaDeVida.tsx:204`, `:162`. Servidor: `apps/desk/server/routes/equipos.ts:107-108` (403) y `:115` (registro) |
| **F1B-04** | `2026-09-25-foto-solo-con-novedad` (`cierra: no`) | **La remisión de entrada pregunta «¿El equipo llega con novedad?»**; con «Sí» exige foto; 422 del servidor al enviar sin fotos | Cliente: `apps/desk/src/components/CrearRemision.tsx:61`, `:100`, `:101`, `:353`. Servidor: `apps/desk/server/routes/remision.ts:290-291` |
| **F1B-06** | `2026-09-25-blueprint-equipo-nuevo` (`cierra: no`) | **Flujo propio para los tickets «Equipo nuevo»** en `Ingresado`, `En Proceso`, `Notificado`, `Verificación` y `Finalizado`; `Verificación` cae en «Otros»; 409 al mezclar flujos | Enrutado: `packages/shared/src/flujos.ts:56-61`. Catálogo: `packages/shared/src/transitions.ts:350-363`. Botones: `apps/desk/src/components/TransitionPanel.tsx:56`. Servidor: `apps/desk/server/services/ticketService.ts:125`. Columna: `packages/shared/src/estados.ts:105`. SLA: `apps/desk/server/db/sla.ts:49` |
| **F1A-03** | `2026-09-27-salidas-verificacion` (`cierra: no`) | **`Verificación` tiene dos salidas:** «Liberación» a `Finalizado` y «Rechazo de verificación» a `Notificado` | `packages/shared/src/transitions.ts:359` y `:361` |

**Y F1B-02** (`2026-09-23-hojas-vida`, `cierra: si`): la hoja de vida enseña seis campos comerciales
(`apps/desk/src/components/HojaDeVida.tsx:210-222`) y el servidor los valida con 422 (el de Drive en
`apps/desk/server/routes/equipos.ts:206`). Son las columnas 2-7 de §2.1.

**Otros con efecto visible en la App — cuatro:**

| Tanda | Cambio archivado (`cierra`) | Qué ve el usuario | Ruta:línea que lo produce |
|---|---|---|---|
| **F1B-08** | `2026-09-12-por-entregar-es-espera` (`cierra: no`) | **`Por Entregar` y `Por Entregar / Sin facturar` pasan a «Tickets en espera»**, y la pestaña «EN ESPERA» de la ficha de cliente cuenta los once estados de la lista. El color no cambia (IV-9) | `packages/shared/src/estados.ts:72-73`. Ficha: `apps/desk/src/components/ClienteDetalle.tsx:36` y `:115`, vía `apps/desk/src/lib/enEspera.ts:14`. Color: `apps/desk/src/components/ClienteDetalle.tsx:41` |
| **F1A-08** | `2026-09-17-tercera-puerta-orden-venta` (`cierra: si`) | **Remisión con una OV que ya está en otro ticket → 409** «La orden de venta N ya está asociada al ticket #M». En producción hoy responde 201 | `apps/desk/server/routes/remision.ts:230-234` (409 en `:232`). Desde F1B-11 la puerta mira también la asociación vigente (`packages/zoho-sync/src/db/repo.ts:371`) |
| **F1B-10** | `2026-09-21-orden-precedencia-guardas` (`cierra: si`) | **Cambia qué error sale primero**: en el alta y en «Habilitar Servicio», el 409 de OV ya asociada sale después de los 422. El alta de remisión no cambia (IV-12) | Alta: `apps/desk/server/services/ticketService.ts:78`, `:88`, y el 409 en `:99`. Transición: `:134`, `:141`, `:147` y el 409 en `:151` |
| **F1A-07** | `2026-09-22-fechas-derivadas-servidor` (`cierra: si`) | **El servidor fija tres fechas derivadas** y pisa lo tecleado; sin fuente, 422 «Fecha inválida en el campo: …» | `apps/desk/server/services/ticketService.ts:132`. Fórmula y mensaje: `packages/shared/src/fechasDerivadas.ts:63` y `:130`. Cliente: `apps/desk/src/lib/valoresTransicion.ts:42` |

**Sin efecto visible en la App:**

| Qué | Commits o cambio archivado | Por qué no se ve |
|---|---|---|
| F1A-06, generador del mapa del blueprint | `2026-09-22-generador-mapa-blueprint` | Sólo lo usa su script (`package.json:25`) y sus pruebas |
| Detector de citas y hook `pre-push` | `2026-09-15-hook-citas-pre-push`, `2026-09-16-detector-citas-extremos`, `2026-09-24-rq-rc-07-regla-e` | Código de `apps/desk/server/citas/`: no lo importa el servidor. Su único efecto en la imagen es el `prepare` de §4.3 |
| Reconciliación (`npm run reconcile`) | `2026-09-20-F0-05` | Comando de línea (`package.json:20`): no lo importa el servidor |
| Pruebas, comentarios y barridos de citas | `f337a96`, `62140e4`, `0808fdf`, `5ce8e2c`, `094eaa4`, `6e471a8`, `ca56c62` y los barridos | Sólo pruebas o comentarios. `ca56c62` toca una línea de comentario en cinco ficheros de `packages/shared/src/` |

**Sólo en el worker `hub-sync` — sin archivo, escriben en `zoho-hub` y la App no los lee:**

| Qué | Commits | Qué hace | ¿Configuración nueva? |
|---|---|---|---|
| Facturas de anticipo de Books | `ea3dbc1`, `a233e1d`, `7cfd198`, `8d03c0d`, `d041b1c` | Trae `/retainerinvoices` a `books.retainer_invoices`, con relleno si la tabla está vacía (`apps/hub-sync/src/hubSync.ts:67-77`) | No: `SYNC_BOOKS_RICH` (`packages/zoho-sync/src/config.ts:92`) |
| Historia pendiente de tickets | `b7c1ba8`, `42172d7`, `244c237` | Hasta 50 tickets por ciclo, marcados con `tickets.history_synced_at` (`apps/hub-sync/src/hubSync.ts:96`) | No: `SYNC_INTERVAL_MS` (`packages/zoho-sync/src/config.ts:88`) |
| Hora de entrada en la fase ganada, CRM | `3fc4768`, `226f98e`, `d598146`, `0a38911`, `030efa7` | Rellena `crm.deals.stage_modified_time` (`apps/hub-sync/src/hubSync.ts:107-113`); consumidor SalesTracker (`packages/zoho-sync/src/crmHub/sync.ts:189`) | No: `SYNC_CRM` (`packages/zoho-sync/src/config.ts:109`) |

Hipótesis sin verificar, igual que el 2026-09-27: que el token de Books de producción tenga permiso sobre
`/retainerinvoices`. Si no, el relleno falla con un error en el log y no tumba el worker
(`apps/hub-sync/src/hubSync.ts:74-76`).

### 5.3 · Riesgos que se publican a sabiendas

**R6 · IV-11 queda REDUCIDO, no cerrado — y por eso el buscador y las puertas no ven todo.** La marca
`ov_elegida_en_app_at` y la asociación sólo existen para las órdenes que un escritor de la app fije
**desde el Deploy**. Las filas cuya orden se eligió antes —todas las de producción hoy— **no tienen ni marca
ni asociación**: no hay relleno retroactivo (S-1 de `parche-iv11-orden-venta`, y P.2 de
`asociacion-ov-ticket`, `openspec/changes/archive/2026-09-28-asociacion-ov-ticket/archive-report.md:108-109`).
Consecuencias concretas: (a) el sincronizador puede seguir dejando esas filas a medias —vaciar
`orden_venta` y conservar `salesorder_id`—, exactamente como describe la fila de IV-11 en `CLAUDE.md`;
(b) mientras la columna conserve la OV, las puertas y el buscador la ven, porque leen también las
columnas (`packages/zoho-sync/src/db/repo.ts:369-371`); si el sincronizador la vacía, esa OV **vuelve a
aparecer como libre**. Registro: `openspec/config.yaml` → `adenda_iv11_asociacion_ov_ticket`
(`openspec/config.yaml:3141-3160`). Lo decide Gerencia (P.2, §6.5).

**R7 · IV-12 sigue vivo, y F1B-11 le añade un caso del mismo molde.** El alta de remisión no cumple el
orden total de precedencia: «Fecha inválida» (`apps/desk/server/routes/remision.ts:127`, escalón C) antes
que «Falta el serial» (`:155`, A), y «Orden de venta no encontrada» (`:220`, A) después de `:127` y de `:197`
(C). Ahora la cuarentena y el contrato vencido comparten ese mismo `if` de `:220`, así que también corren
**detrás** del 409 de remisión pendiente (`:177`, D). Lo fija `apps/desk/server/remisiones.test.ts`
(comentario en `:1246`) y no se corrige: sin destino, fila IV-12 de `CLAUDE.md`. **Qué significa en la
app:** un técnico con una remisión pendiente y una OV en cuarentena oye primero «ya tienes una remisión
sin desenlace».

**R8 · Contratos vivos sin registrar el día uno.** Hasta que Comercial dé de alta los contratos vigentes,
la prioridad `High` y el bloqueo de vencidos **no actúan**. La propuesta lo registra con probabilidad
**Alta** (`openspec/changes/archive/2026-09-29-registro-contrato/proposal.md:140`). Tarea P.7 (§6.2).

**R9 · Un contrato mal tecleado sólo se corrige en la base.** No hay ruta de edición ni de borrado
(`apps/desk/server/routes/contratos.ts:24-70`, sólo `GET` y `POST`), y la tabla está pensada sin `UPDATE`
de datos ni `DELETE` (`packages/zoho-sync/src/db/schema.sql:559`). Un lote equivocado ocupa además ese lote
para siempre (índice único, `:572`). Por eso P.7 pide revisar antes de pulsar «Registrar».

**R10 · Un técnico puede bajar la prioridad de un ticket de contrato** con las transiciones que llevan
campo de prioridad (`packages/shared/src/transitions.ts:193`, `:195`). Registrado con probabilidad media y
destino F1B-07 (`openspec/changes/archive/2026-09-29-registro-contrato/proposal.md:139`).

**R11 · Cuántas OV caen en cuarentena el día uno no está medido.** Desaparecen del buscador
(`packages/zoho-sync/src/books/repo.ts:176`) y las tres puertas las rechazan. Si son muchas, el equipo
comercial se encuentra de golpe con órdenes que «no existen». Lo mide P.1 (§6.1), que conviene correr
**antes** del Deploy.

**R12 · El «saldo» y las «creadas» de un lote dependen de dos literales sin confirmar.** `saldoPorLote`
descarta las subOV con estado `draft` o `void` (`packages/zoho-sync/src/books/subOV.ts:18`, `:39`), y
esos literales son **hipótesis** (`:12-14`). Lo confirma P.4 (§6.1). Si están mal, el saldo por lote y el
«% ejecutado» del informe cuentan de más.

**R13 · Riesgos menores de F1B-11 anotados en los archivos**, que no piden acción al publicar:

- La atomicidad de liberar, de la remisión y del aviso de ritmo se prueba **por estructura**, no por filas:
  pg-mem no deshace un `ROLLBACK` (`openspec/changes/archive/2026-09-28-asociacion-ov-ticket/archive-report.md:83-84`;
  W2 de `openspec/changes/archive/2026-09-29-registro-contrato/archive-report.md:38`). La primera prueba
  real es Postgres de producción.
- El 409 de una carrera en asociaciones dice «ya está asociada a otro ticket» sin el número
  (`openspec/changes/archive/2026-09-28-asociacion-ov-ticket/archive-report.md:81-82`).
- La exportación CSV del informe (botón, BOM, `Blob`) no tiene prueba automática: es `.tsx` y queda fuera
  de la red por F0-00 (escenario 67 PARTIAL,
  `openspec/changes/archive/2026-09-29-registro-contrato/archive-report.md:30-33`). La cubre P.6.
- Si la pasada de ritmo falla un día, no se reintenta hasta el día siguiente: la marca del día se fija
  antes de intentarlo (`apps/desk/server/services/avisoRitmoContrato.ts:68-69`). No tumba la sincronización
  (`:70-74`).
- La lista de contratos enseña el identificador del cliente, no su nombre
  (`apps/desk/src/components/ContratosPanel.tsx:50`). Cosmético.

**Los riesgos del paquete anterior, re-comprobados uno a uno:**

**R1 · Se puede liberar un analizador sin pasar por Verificación (E3 sin construir). SIGUE VIVO.** Gerencia
decidió que la Verificación es obligatoria para analizadores de gases y convertidores cuando hay gas patrón
(`openspec/config.yaml:1972-1973`). La guarda no existe: `grep -rniE "gas.?patron|gas patrón" packages/ apps/ --include=*.ts`
sigue dando **0** el 2026-09-29. E-082 sigue `NUEVA` (`docs/sdd/ENTRADA.md:1190`). «Liberación» desde
`En Proceso` está disponible para cualquier «Equipo nuevo» (`packages/shared/src/transitions.ts:359`).

**R2 · Sin guarda de certificado en Liberación desde Verificación. SIGUE VIVO:** E-083 sigue `NUEVA`
(`docs/sdd/ENTRADA.md:1197`).

**R3 · Tickets «Equipo nuevo» ya abiertos cambian de flujo el día del Deploy. SIGUE VIVO** y sin medir.
El enrutado mira clasificación y estado actual (`packages/shared/src/flujos.ts:56-61`). Hipótesis de
consulta, sólo lectura:

```sql
SELECT status, count(*) FROM desk.tickets
 WHERE lower(classification) = 'equipo nuevo'
   AND status IN ('Ingresado','En Proceso','Notificado','Verificación')
 GROUP BY status;
```

*(Hipótesis: el enrutado normaliza la clasificación con más que `lower`
—`packages/shared/src/flujos.ts:40-43`—, así que la consulta puede contar de menos.)*

**R4 · Sólo Servicio Técnico mueve el flujo de equipo nuevo. SIGUE VIVO.** Área supuesta, no decidida
(`packages/shared/src/transitions.ts:347`;
`openspec/changes/archive/2026-09-25-blueprint-equipo-nuevo/proposal.md:104`).

**R5 · Menores del paquete anterior. SIGUEN VIVOS**, sin cambio de código que los toque:
`equipos.serial` no es único
(`openspec/changes/archive/2026-09-24-alta-equipo-nuevo-en-ticket/proposal.md:81`); dos ediciones
simultáneas pueden registrar un «valor anterior» desfasado
(`openspec/changes/archive/2026-09-25-edicion-comercial-equipo/design.md:185`); la respuesta de novedad
sólo la exige el cliente
(`openspec/changes/archive/2026-09-25-foto-solo-con-novedad/proposal.md:79-82`); y una remisión pendiente
con novedad y sin fotos sólo sale reintentando o con anulación de un administrador (`:84-87`).

---

## 6 · Tareas de persona

Todas se hacen sobre `https://ambientalia-desk.ambientalia.cloud/`, con sesión iniciada, salvo las de la
base (§6.1, §6.3). **Archivar los cambios no las dio por hechas** (regla del ciclo 1 de `CLAUDE.md`). No
hay copia de pruebas: todo se hace en la aplicación en uso (`openspec/config.yaml:1705-1707`).

**Ninguna de las del paquete del 2026-09-27 consta como hecha.** Se buscó evidencia en `docs/sdd/ENTRADA.md`,
`openspec/config.yaml`, `docs/sdd/RECONCILIACION.md` y la memoria del proyecto: no hay registro de que se
ejecutara el `INSERT` de cierres ni ninguna comprobación en la app. Y no podían estarlo: todas eran
«después del Deploy», y `dcb5c99` no llegó a publicarse. Siguen pendientes, en §6.3 y §6.6.

**Numeración: las tres tareas de F1B-11 chocan entre sí.** Cada cambio numeró sus tareas de persona desde
P.1, y los números se repiten con contenidos distintos. En este documento se nombran siempre con su cambio:

| Número | `parche-iv11-orden-venta` | `asociacion-ov-ticket` | `registro-contrato` | ¿Es la misma tarea? |
|---|---|---|---|---|
| P.1 | Consulta de subOV, Alfonso | Igual | Igual («heredada») | **Sí**: una sola ejecución cubre las tres. §6.1 |
| P.2 | Relleno retroactivo de la **marca** `ov_elegida_en_app_at`, Gerencia | Relleno retroactivo de las **asociaciones**, Gerencia | — | **No**, pero van juntas: son las dos mitades del mismo hueco (R6). §6.5 |
| P.3 | Ver el **aviso de discrepancia** en la campana, Comercial | Ver la **ficha de OV**, «Liberar», cuarentena y saldo, Comercial | — | **No**. §6.4 |
| P.4 | — | Consulta 5 (literales de Books), Alfonso | Igual («heredada») | **Sí**. §6.1 |
| P.5 | — | — | Responder E-086, Gerencia | §6.5 |
| P.6 | — | — | Verificar contratos en la app, Comercial | §6.4 |
| P.7 | — | — | **Dar de alta los contratos vigentes hoy**, Comercial | §6.2 |

Fuentes: `openspec/changes/archive/2026-09-28-parche-iv11-orden-venta/tasks.md:162-171`,
`openspec/changes/archive/2026-09-28-asociacion-ov-ticket/tasks.md:490-505` y
`openspec/changes/archive/2026-09-29-registro-contrato/tasks.md:445-453`.

### 6.1 · Antes del Deploy (recomendado): P.1 y P.4 de F1B-11, la consulta de subOV — Alfonso

| Dato | Valor |
|---|---|
| Fichero | `docs/sdd/Consulta_SubOV_formato_2026-09-27.sql` |
| Quién | **Alfonso** (`docs/sdd/Consulta_SubOV_formato_2026-09-27.sql:25`) |
| Dónde | Consola de PostgreSQL de producción, base `desk` (`:30-36`) |
| Cuándo | **Antes del Deploy, si se puede.** Sólo lee `books.sales_orders` y `desk.tickets`, que ya existen en `ae5aaf4`. Hecha antes, dice cuántas OV van a desaparecer del buscador el día uno (R11) y deja avisar a Comercial. Después también sirve |
| ¿Escribe? | No. Bloques 1-4 dentro de `BEGIN READ ONLY … ROLLBACK` (`:50`, `:116`) |

Paso a paso, que es el del propio fichero (`:31-37`):

1. Conectarse con `psql` a la base `desk` como siempre. **No pegar la cadena de conexión ni la contraseña
   en ningún chat, captura ni documento** (`:31-32`).
2. Dentro de `psql`: `\o salida_subov_2026-09-27.txt`, luego `\i Consulta_SubOV_formato_2026-09-27.sql`,
   luego `\o`.
3. Comprobar que la salida termina con `ROLLBACK` (`:37`).
4. **P.1** — devolver los cuatro bloques (`:39-47`): recuento por clase de formato, OV de Books con formato
   no reconocido, tickets con orden de formato no reconocido y números base que existen como OV propia.
   Un bloque vacío también es resultado.
5. **P.4** — el bloque 5 (`:118-131`) va **fuera** de la transacción de sólo lectura. Si se ejecuta suelto,
   envolverlo a mano en `BEGIN READ ONLY;` … `ROLLBACK;` (`:122-123`).

⚠️ **Hipótesis a comprobar al ejecutar el bloque 5:** consulta `so.order_status` sobre `books.sales_orders`
(`:124`), y la `books.sales_orders` que crea `desk` no tiene esa columna
(`packages/zoho-sync/src/db/schema.sql:160-165`); la tiene la del hub
(`packages/zoho-sync/src/booksHub/schema-books.sql:45`). Si en la base `desk` de producción el bloque 5 da
«column so.order_status does not exist», cambiar `books.sales_orders so` por `public.sales_orders so` en
las dos mitades de la consulta: esa vista expone `order_status` desde el JSON de Books
(`packages/zoho-sync/src/db/schema.sql:176-182`), y es lo que lee de verdad `saldoPorLote`
(`packages/zoho-sync/src/books/subOV.ts:35`, `sales_orders` sin calificar, que el `search_path` resuelve a
esa vista). Qué forma tiene la tabla en producción **no se ha podido comprobar** desde aquí.

**Cómo se verifica:** la salida se devuelve; la decide quien construye. P.1 confirma el clasificador de
subOV (`packages/shared/src/subOV.ts:32-41`); P.4 confirma S-11, los literales de R12. Registro:
`openspec/config.yaml` → `adenda_iv11_asociacion_ov_ticket` → `P4_estados_de_books`
(`openspec/config.yaml:3161-3168`).

### 6.2 · P.7 de `registro-contrato`: dar de alta los contratos vigentes hoy — Comercial

Fuente: `openspec/changes/archive/2026-09-29-registro-contrato/tasks.md:453`. **Es la tarea que hace que
F1B-11 actúe**: sin ella, ni la prioridad `High` ni el bloqueo de vencidos hacen nada (R8). No hay relleno
automático. Hacerla **el mismo día del Deploy**, después de §4.4.

| # | Paso a paso | Resultado esperado |
|---|---|---|
| 0 | Preparar, fuera de la app, la lista de contratos vigentes: cliente, **lote** (la OV madre, `OV-AAAA-NNN`, sin sufijo), fecha de inicio y fecha de fin | Una lista revisada. **Revisarla antes**: un contrato no se puede editar ni borrar desde la app (R9) |
| 1 | Entrar con un usuario de **Comercial** (o administrador) → icono de engranaje «Configuración» (arriba a la derecha) → «Administración de datos» → **«Contratos por lote»** | Pantalla «Contratos registrados», vacía, con el botón **«Nuevo contrato»** (`apps/desk/src/components/ContratosPanel.tsx:36`) |
| 2 | «Nuevo contrato» → en «Cliente», buscar por nombre o NIT y elegirlo; «Lote (OV madre)»: `OV-AAAA-NNN`; «Inicio» y «Fin» → **«Registrar»** | El contrato aparece en la lista. Errores posibles, del servidor: «El lote debe tener el formato OV-AAAA-NNN (la OV madre, sin sufijo)», «La fecha de fin no puede ser anterior a la de inicio», «El cliente no existe», «El lote … ya tiene un contrato registrado» (`apps/desk/server/routes/contratos.ts:49-55`) |
| 3 | Repetir por cada contrato | Uno por lote |
| 4 | Pulsar un contrato de la lista | Ficha con estado **«Vigente»**, saldo del lote e informe por trimestre (`apps/desk/src/components/ContratoFicha.tsx:5`, `:47`, `:58`) |

**Cómo se verifica que surtió efecto:** crear un ticket de prueba para uno de esos clientes, elegir otra
prioridad al crearlo, y comprobar que **nace en `High`**. Borrarlo al terminar con «Eliminar ticket»
(sólo administrador), como se hizo con el #10002 (`docs/sdd/Paquete_de_Despliegue_2026-09-10.md:459-467`).
Eliminar ahora libera también sus órdenes de venta con motivo «Ticket eliminado»
(`apps/desk/server/db/eliminarTicket.ts:154`). Es el primer paso de P.6 (§6.4).

⚠️ Un error de lote o de fechas **sólo se corrige en la base**, con una sentencia a mano y la copia de §4.1
detrás (R9). Si ocurre, anotarlo y avisar a quien tenga acceso a la base; no crear un segundo contrato
«bueno», porque el lote ya está ocupado (`packages/zoho-sync/src/db/schema.sql:572`).

### 6.3 · El `INSERT` de los cierres de fin de año — Alfonso (pendiente desde el 2026-09-27)

| Dato | Valor |
|---|---|
| Fichero | `docs/sdd/Alta_Cierres_Fin_de_Año_2026.sql` (commit `ea23634`, sin cambios desde entonces) |
| Quién | **Alfonso** (`docs/sdd/Alta_Cierres_Fin_de_Año_2026.sql:2`; comentario en `packages/zoho-sync/src/db/schema.sql:473`) |
| Dónde | Consola de PostgreSQL de producción, base `desk` (`docs/sdd/Alta_Cierres_Fin_de_Año_2026.sql:12`) |
| Cuándo | **Después** del Deploy y de §4.4. Antes, la tabla no existe (`:7-10`) |
| ¿Idempotente? | **Sí.** `ON CONFLICT (fecha) DO NOTHING` (`:28`), dentro de una transacción (`:20` y `:36`) |
| Qué da de alta | Cinco fechas: 24/12, 30/12 y 31/12 de 2026, y 01/01 y 02/01 de 2027 (`:22-27`) |

1. `SELECT to_regclass('public.calendario_cierres') AS tabla;` (`:17`). **Si devuelve NULL, parar** y ver §4.4.
2. Ejecutar el bloque `BEGIN` … `INSERT` (`:20-28`).
3. Ejecutar el `SELECT` de comprobación (`:31-33`): **deben salir cinco filas**, de 2026-12-24 a 2027-01-02.
4. Si salen las cinco, `COMMIT;`. Si no, `ROLLBACK;` (`:35-36`).

**Cómo se verifica:** en la app, hoy, no se puede; ninguna pantalla consume la tabla (§5.2, fila F1B-12).
La única comprobación es el `SELECT` del paso 3, repetido fuera de la transacción. Discrepancia ya anotada
el 2026-09-27: el `archive-report.md` de F1B-12 decía que no había fechas decididas
(`openspec/changes/archive/2026-09-24-calendario-laboral/archive-report.md:54`); manda el `.sql`, que es
posterior (`docs/sdd/Alta_Cierres_Fin_de_Año_2026.sql:3-5`).

### 6.4 · Comprobaciones en la app de F1B-11 — Comercial

Las tres dependen de la app desplegada. Hacer primero §6.2, porque P.6 necesita un contrato real.

**P.3 de `parche-iv11-orden-venta` — el aviso de discrepancia.** Fuente:
`openspec/changes/archive/2026-09-28-parche-iv11-orden-venta/tasks.md:170-171`.

| # | Paso a paso | Resultado esperado |
|---|---|---|
| 1 | Esperar a que ocurra de forma natural: un ticket con orden elegida en la app **después del Deploy**, al que en Zoho Desk alguien le ponga otra orden de venta | En la campana de los usuarios de Comercial aparece «Zoho trae la orden de venta X para el ticket #N, pero la aplicación tiene Y. Se conserva la de la aplicación: revise cuál es la correcta.» (`apps/desk/server/services/avisoDiscrepanciaOV.ts:38`) |
| 2 | Abrir ese ticket en la app | Conserva la orden **de la app**, no la de Zoho |
| 3 | Esperar al siguiente ciclo de sincronización (unos tres minutos) | **No** llega un segundo aviso igual (`:30`) |

*No provocarlo a propósito* salvo con un ticket de prueba: cambiar la orden en Zoho de un ticket real
genera una discrepancia real. Un ticket anterior al Deploy **no** avisa: no tiene marca (R6).

**P.3 de `asociacion-ov-ticket` — ficha de OV, liberar, cuarentena y saldo.** Fuente:
`openspec/changes/archive/2026-09-28-asociacion-ov-ticket/tasks.md:501-503`.

| # | Paso a paso | Resultado esperado |
|---|---|---|
| 1 | Crear un ticket (o usar uno creado tras el Deploy) con orden de venta → abrir su ficha → sección plegada **«ÓRDENES DE VENTA»** sobre la caja de transiciones | «1 vigentes, 0 liberadas»; al desplegar, la OV con «Vigente», origen, fecha y quién (`apps/desk/src/components/PanelOvAsociaciones.tsx:44-51`, `:89`) |
| 2 | Con un usuario **sin** Comercial ni administrador, abrir la misma sección | No aparece el botón «Liberar» (`:52`, `:82`) |
| 3 | Con un usuario de Comercial → «Liberar» → dejar el motivo vacío → «Confirmar» | Error en rojo: «El motivo de la liberación es obligatorio» (`apps/desk/server/routes/ovAsociaciones.ts:51`) |
| 4 | Escribir un motivo → «Confirmar» | La fila pasa a «Liberada», con fecha, quién y motivo; la cabecera dice «0 vigentes, 1 liberadas» |
| 5 | En otro ticket, abrir el buscador de orden de venta y buscar la OV liberada | **Vuelve a salir** como libre |
| 6 | Configuración → «Administración de datos» → **«Órdenes de venta: cuarentena y saldo por lote»** | Lista «Órdenes de venta en cuarentena» (su tamaño debe cuadrar con P.1) y consulta «Saldo por lote» con creadas, consumidas, libres y % consumido (`apps/desk/src/components/OvCuarentenaSaldo.tsx:38-63`) |

⚠️ Los pasos 3-5 **liberan una orden real**: hacerlo con un ticket de prueba y borrarlo al terminar.
Liberar no tiene «deshacer»: la fila se queda liberada para siempre, y volver a asociarla crea otra.

**P.6 de `registro-contrato` — contratos en la app.** Fuente:
`openspec/changes/archive/2026-09-29-registro-contrato/tasks.md:452`. Cierra W2, W3 y W4 del verify
(`openspec/changes/archive/2026-09-29-registro-contrato/archive-report.md:119`).

| # | Paso a paso | Resultado esperado |
|---|---|---|
| 1 | Con un contrato vigente registrado en §6.2, crear un ticket de prueba para ese cliente eligiendo prioridad «Low» | Nace en **`High`** (`apps/desk/server/services/ticketService.ts:106`) |
| 2 | Asociarle una subOV del lote del contrato (`OV-AAAA-NNN-SS`) → abrir la ficha del ticket | Aparece la marca **«DE CONTRATO · lote … (subOV …) · contrato nº …, vigente hasta el …»** (`apps/desk/src/components/MarcaContrato.tsx:16`) |
| 3 | Si existe un contrato **vencido** registrado: intentar asociar una subOV de su lote en el alta, en una transición o en una remisión | 422 «La orden de venta … es del lote …, y su contrato nº … venció el …: no se puede asociar a ningún ticket» (`packages/shared/src/contratos.ts:57`). Si no hay ninguno vencido, este paso **no se puede hacer sin crear un contrato falso**, que después no se puede borrar (R9): dejarlo pendiente y decirlo |
| 4 | Ficha del contrato → «Informe al …» → **«Exportar CSV»** | Se descarga un CSV que abre en Excel con las tildes bien y las mismas cifras que la pantalla (escenario 67, sin prueba automática) |
| 5 | Al día siguiente del Deploy, en el log del servicio App | No aparece `pasadaRitmoContratos falló` (`apps/desk/server/services/avisoRitmoContrato.ts:73`). Es la comprobación de W4: que la pasada de ritmo corre en producción (`apps/desk/server/index.ts:88`) |
| 6 | Sólo si algún contrato está ya en su segundo trimestre o posterior y va lento | En la campana de Comercial, el aviso de ritmo (`apps/desk/server/services/avisoRitmoContrato.ts:41`), **una vez** por trimestre. Si ningún contrato cumple las condiciones (`:49`), que no llegue aviso es lo correcto |

### 6.5 · Decisiones de Gerencia que F1B-11 deja abiertas — Gerencia

No bloquean el Deploy. Se listan porque sin ellas lo publicado queda a medias, y porque las dos P.2 son la
misma pregunta vista desde dos cambios.

| Tarea | Qué decide | Qué desbloquea | Dónde está escrita |
|---|---|---|---|
| **P.2 de `parche-iv11-orden-venta`** | Si se rellena la **marca** `ov_elegida_en_app_at` en las filas cuya orden se eligió en la app antes del Deploy | Proteger del sincronizador esas filas (R6) | `openspec/changes/archive/2026-09-28-parche-iv11-orden-venta/tasks.md:168-169` |
| **P.2 de `asociacion-ov-ticket`** | Si se rellenan las **asociaciones** de los tickets y OV anteriores | Que las tres puertas y el buscador no dependan de las columnas que el sincronizador puede vaciar (R6) | `openspec/changes/archive/2026-09-28-asociacion-ov-ticket/tasks.md:497-500`; `openspec/config.yaml:3156-3160` |
| **P.5 de `registro-contrato`** | E-086: año y tope de la ampliación de contrato | La ampliación, que es lo único que falta para cerrar F1B-11 | `docs/sdd/ENTRADA.md:1222`; `openspec/changes/archive/2026-09-29-registro-contrato/tasks.md:451` |

Cualquiera de los dos rellenos toca **datos de producción**: es una de las cinco razones para parar y
preguntar de la regla de ejecución de `CLAUDE.md`. No lo hace ninguna tanda sin esa decisión.

### 6.6 · Comprobaciones pendientes del paquete del 2026-09-27

Sin cambios de contenido; se mantienen con sus fuentes, re-comprobadas contra el árbol de hoy.

**RQ-HV-12, botón «Editar» de la hoja de vida — Comercial / Gerencia.** Fuente:
`openspec/specs/hojas-vida/spec.md:298-309` (dueño en `:301-302`).

| # | Paso a paso | Resultado esperado |
|---|---|---|
| 1 | Equipos → hoja de vida de cualquier equipo | Hay un botón «Editar» que abre el formulario (`openspec/specs/hojas-vida/spec.md:304-305`) |
| 2 | Usuario **sin** Comercial ni administrador → «Editar» | Factura de compra, Fin de garantía y Mantenedor en sólo lectura (`:306-307`) |
| 3 | Usuario de Comercial → cambiar un campo → guardar → reabrir | La sección «Cambios» enseña la fila (`:308-309`). Las dos ediciones quedan registradas: la tabla es de sólo inserción (`packages/zoho-sync/src/db/schema.sql:485-488`) |

**RQ-RE-19, formulario de novedad — Servicio Técnico.** Fuente: `openspec/specs/remisiones/spec.md:476-485`
en `ca56c62`.

| # | Paso a paso | Resultado esperado |
|---|---|---|
| 1 | Ficha de un ticket → «Crear remisión» | «¿El equipo llega con novedad?» visible y sin opción preseleccionada |
| 2 | Marcar «Sí», sin fotos, intentar continuar | «El equipo llega con novedad: sube al menos una foto antes de crear la remisión.» (`apps/desk/src/components/CrearRemision.tsx:101`) |
| 3 | Leer el 422 de envío | El técnico lo entiende sin explicación; texto literal de `apps/desk/server/routes/remision.ts:291` |

**Comprobación 2 de F1B-06, y las otras dos — Servicio Técnico.** Fuente:
`openspec/changes/archive/2026-09-25-blueprint-equipo-nuevo/archive-report.md:84-89`; F1A-03 la hereda
(`openspec/changes/archive/2026-09-27-salidas-verificacion/archive-report.md:89`).

| Paso a paso | Resultado esperado |
|---|---|
| Tablero → un ticket «Equipo nuevo» en `Verificación` (o llevar uno de prueba desde `En Proceso`) | Cae en la columna **«Otros»** (`packages/shared/src/estados.ts:105`) |
| Un «Equipo nuevo» en `Ingresado` | Sólo ve «Ingreso equipo nuevo» |
| Ejecutar una transición del otro flujo | El 409 se entiende sin explicación |

**Verificación en la app de F1A-03 — Servicio Técnico / Gerencia.** Fuente:
`openspec/changes/archive/2026-09-27-salidas-verificacion/archive-report.md:88`, resultados de
`openspec/changes/archive/2026-09-27-salidas-verificacion/proposal.md:110-112`.

| # | Paso a paso | Resultado esperado |
|---|---|---|
| 1 | Servicio Técnico → ticket «Equipo nuevo» en `Verificación` | Dos botones: «Liberación» y «Rechazo de verificación» |
| 2 | «Liberación» (en un ticket que de verdad haya que liberar) | Pasa a `Finalizado` |
| 3 | Otro ticket en `Verificación` → «Rechazo de verificación» | Pasa a `Notificado` y ve «Análisis y acciones» |
| 4 | Usuario **sólo de Comercial** → ticket en `Verificación` | No ve ninguno de los dos botones |

⚠️ Los pasos 2 y 3 mueven tickets reales. Sin ticket real, crear uno de prueba y borrarlo al terminar.

**Resto de pendientes del mismo rango** (no bloquean nada):

- F1B-14 (1): probar el alta con serie nueva y con serie ya registrada
  (`openspec/changes/archive/2026-09-24-alta-equipo-nuevo-en-ticket/tasks.md:46`) y medir series
  duplicadas (`:225`). Sin dueño con nombre.
- F1B-02: comprobaciones de RQ-HV-07 y carga retroactiva de los seis campos, dueño Comercial/Gerencia
  (`openspec/changes/archive/2026-09-23-hojas-vida/archive-report.md:78-90`).
- F1A-03: E-082 y E-083, decisiones de Gerencia con Calidad
  (`openspec/changes/archive/2026-09-27-salidas-verificacion/archive-report.md:86-87`), las dos `NUEVA`
  (`docs/sdd/ENTRADA.md:1190`, `:1197`).
- F1B-08: en la ficha de un cliente, pestaña «EN ESPERA», comprobar que un ticket en `Por Entregar` aparece
  ahí. Sin dueño asignado
  (`openspec/changes/archive/2026-09-12-por-entregar-es-espera/archive-report.md:72-79`).
- F1A-07: comprobar en el contenedor que `America/Bogota` se resuelve —quien tenga la consola de
  EasyPanel— y contar en `desk.ticket_transitions.values` los instantes sin desplazamiento horario —quien
  tenga acceso a la base— (`openspec/changes/archive/2026-09-22-fechas-derivadas-servidor/archive-report.md:126-133`).
  Es la misma zona que usa ahora la vigencia de contratos (`hoyEnZona`, `apps/desk/server/routes/contratos.ts:33`),
  así que la comprobación vale para las dos.

---

## 7 · Lo que NO es desplegable

**Nada en `3f9d23b`.** Lo comprobado, una condición por fila:

| Condición que haría `3f9d23b` no desplegable | Resultado | Evidencia |
|---|---|---|
| Una migración no idempotente | **No hay.** Las veinte sentencias nuevas llevan `IF NOT EXISTS` | §2.1, §2.2 |
| Una restricción nueva que rompa datos existentes o los `INSERT` de `ae5aaf4` | **No hay.** Todas las restricciones son de tablas nuevas y vacías; las columnas nuevas son anulables | §2.1, §4.5 |
| Un interruptor de escritor sin documentar | **No hay.** Ninguna variable nueva; los dos escritores nuevos sólo escriben en la bandeja interna | §3 |
| Un estado sin salida | **No hay.** En el flujo de equipo nuevo, el único estado sin salida es `Finalizado`, y lo fija una prueba | `packages/shared/src/invariantesGrafo.test.ts:177-181` |
| Un build, un typecheck o una suite en rojo | **No.** Build y typecheck exit 0; 1.848 pruebas en verde | cabecera de este documento |
| Un cambio archivado «no se despliega sin X» con X fuera de `main` | **No.** El único sigue siendo F1B-06 («no se despliega sin F1A-03», `openspec/changes/archive/2026-09-25-blueprint-equipo-nuevo/archive-report.md:32`), y F1A-03 es `c373bcc`, en `main`. Los tres `archive-report.md` de F1B-11 no ponen condición de despliegue | barrido de `despliegue` en los `archive-report.md` del rango |

**El orden importa, y por eso se escribe. Publicar `3f9d23b` entero, no un commit intermedio.** Hay dos
tramos donde un intermedio es peor que cualquiera de los dos extremos:

- Entre `1b90a80` (F1B-06) y `c373bcc` (F1A-03): los tickets en `Verificación` quedaban sin transición.
- Entre `2c43e5c` (lote 6 de `asociacion-ov-ticket`) y `9de5a96` (su remediación): liberar una OV no
  vaciaba las columnas del ticket, así que la OV liberada seguía ocupada en las tres puertas
  (`openspec/changes/archive/2026-09-28-asociacion-ov-ticket/archive-report.md:63-65`).

Cualquier commit entre `df28b37` y `3f9d23b` da el mismo código (cabecera).

**Lo que no bloquea pero no se ha podido comprobar:** la versión que corre hoy el worker (§4.2), que la
imagen de `3f9d23b` construya en EasyPanel (§4.3), y la forma de `books.sales_orders` en la base `desk` de
producción para el bloque 5 de P.4 (§6.1).

---

## 8 · Nota de método

Las citas `ruta:línea` de este documento se comprobaron contra el árbol en `3f9d23b`, leyendo la línea. Las
del paquete del 2026-09-27 se re-leyeron una a una: las de ficheros que no cambiaron desde `dcb5c99` se
conservan; las que se movieron llevan su línea de hoy. Se movieron cinco, y se nombran en prosa para que
nadie las lea como citas vigentes: la guarda de novedad del alta de remisión bajó cuatro líneas, la tercera
puerta ganó una línea al final de su rango, la llamada a `migrate` del arranque bajó tres, y los dos `409`
de orden de venta ya usada —el del alta y el de la transición— bajaron tres y dos. Las de `ae5aaf4` y
las de `ca56c62` llevan la revisión escrita. Las cifras de build, typecheck y pruebas son de una ejecución
local del 2026-09-29.

Todo lo que no se pudo comprobar lleva «hipótesis» o dice «no está medido»: el recuento de tickets de R3,
cuántas OV caen en cuarentena (R11), los literales de estado de Books (R12), la versión del worker, la
construcción de la imagen de `3f9d23b`, la forma de `books.sales_orders` en producción, los procedimientos
de copia y de restauración, el comportamiento de las asociaciones tras una reversión y republicación, y la
igualdad de bytes entre la construcción de Windows y la de Alpine.
