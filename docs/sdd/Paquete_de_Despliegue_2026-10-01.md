# Paquete de despliegue — 2026-10-01

Material para la persona que publica Desk 2.0 en producción. **Este documento no publica nada**: lo
escribe un agente que no despliega ni commitea. La publicación es una acción manual: el CI **no
despliega** (`docs/sdd/Paquete_de_Despliegue_2026-09-10.md:5-6`). `.github/workflows/ci.yml` no cambia
después de `3f9d23b` (`git diff --stat b1347e0 e8840e7 -- .github` → vacío, y el paquete anterior ya lo
midió hasta `b1347e0`); su único cambio en el rango sigue siendo el techo del trinquete de avisos de lint
(`f7c9dc1`, `.github/workflows/ci.yml:41`).

**Este paquete sustituye al del 2026-09-30 para publicar.** Aquél cubría `ae5aaf4..b1347e0`, y `b1347e0`
**nunca llegó a producción**: todo se mide otra vez desde `ae5aaf4`, no desde aquel documento. Aquél
(`docs/sdd/Paquete_de_Despliegue_2026-09-30.md`) es un registro fechado y no se toca; lo que aquí lo corrige se
dice en su sitio y se resume abajo. Lo que añade este paquete son las dos tandas archivadas después:
**F1C-05** (`permisos-por-cargo`) y **F1B-07** (`prioridad-top5-cliente`).

| Dato | Valor |
|---|---|
| Repositorio | `C:\dev\Desk_2_R1.023`, rama `main` |
| Se publica hasta | `e8840e7` (HEAD de `main` el 2026-10-01) |
| Base que hoy corre en producción | `ae5aaf4` (2026-09-10 19:20), verificada por sha256 del bundle (`docs/sdd/Paquete_de_Despliegue_2026-09-10.md:22`) |
| Rango medido | **`ae5aaf4..e8840e7`** |
| `git diff --shortstat ae5aaf4..e8840e7` | **486 files changed, 87164 insertions(+), 1552 deletions(-)** |
| Commits del rango | **365** (`git rev-list --count ae5aaf4..e8840e7`) |
| De ellos, tocan `apps/` o `packages/` | **98** (`git rev-list --count ae5aaf4..e8840e7 -- apps packages`); **7** posteriores a `b1347e0`, los siete de código: F1C-05 `db5630f`, `d201fe4`, `e71fd3f`; F1B-07 `1550b07`, `e3d5e90`, `5aab12c`, `0879f20` |
| Código tocado | **196 ficheros**, +19.612/−658 (`git diff --shortstat ae5aaf4..e8840e7 -- apps/ packages/`); de ellos, desde `b1347e0`: 41 ficheros, +2.449/−77 |
| Fuera de `apps/` y `packages/` desde `b1347e0` | Sólo `DEPLOY.md`, +9/−6 (`git diff --stat b1347e0 e8840e7 -- .github Dockerfile package.json package-lock.json DEPLOY.md .env.example` → `DEPLOY.md \| 15 +++++++++------`, una sola línea). **Ni `.github`, ni `Dockerfile`, ni `package.json`, ni `package-lock.json`, ni `.env.example`** |
| Build, tipos y pruebas en `e8840e7` | `npm run build` → **exit 0** («✓ built in 3.57s») · `npm run typecheck` → **exit 0** (`tsc -b && tsc -p apps/desk/tsconfig.server.json --noEmit`, sin salida de error) · `npm test` → «Test Files 165 passed \| 1 skipped (166)», «Tests **2206 passed** \| 2 skipped (2208)», duración 131,55 s, **exit 0**. Ejecutado el 2026-10-01 hacia las 19:10 −05:00 sobre el árbol de `e8840e7`; los únicos ficheros sin trackear eran de `docs/` |

El código de `e8840e7` es el de `0879f20`: `git diff --name-only 0879f20 e8840e7 -- apps packages Dockerfile
package.json package-lock.json` → vacío. Los cinco commits posteriores a `0879f20` son verify, archive, una
cita reapuntada y `RECONCILIACION.md`.

*Correcciones al paquete del 2026-09-30, halladas al revalidarlo contra `e8840e7`* (aquel documento es un
registro fechado y no se toca; ninguna corrección cambia su veredicto):

- **La incoherencia de `AVISOS_COPIA_EMAIL` está cerrada en `DEPLOY.md`.** Aquel paquete decía que
  `DEPLOY.md` no contaba que esa variable copia también las alarmas (su §3 y su R21). Desde `e591454`,
  `DEPLOY.md:159-164` dice que copia «los de **derivación**» y «**todas las alarmas de SLA**», y `:165-170` que,
  olvidada puesta, recibe «cada alarma de SLA vencida de todo el mundo». La acción de persona de mirar la
  variable antes del Deploy se conserva (§6.1.7), pero ya no es una incoherencia de documentación.
- **E-082 y E-083 están DECIDIDAS** desde el 2026-09-28 (`docs/sdd/ENTRADA.md:1190` y `:1197`, «CERRADA 28/09»;
  `openspec/config.yaml` → `decisiones_de_gerencia` → `decision/f1a03-familia-y-gas-patron` y
  `decision/f1a03-certificado-liberacion`). Aquel paquete las tenía como decisiones de Gerencia pendientes (su
  §6.4). R1 y R2 **siguen vivos en el código** —la guarda no está construida: `git grep -niE "gas.?patron|gas
  patrón" e8840e7 -- packages apps` → 0—, pero lo que falta ya es construcción de F1A-03, no una respuesta.
- **R10 —«un técnico puede bajar la prioridad de un ticket de contrato»— está CERRADO** por `e3d5e90` (F1B-07):
  la guarda del técnico (`apps/desk/server/services/ticketService.ts:131`, `packages/shared/src/prioridad.ts:81-86`)
  devuelve 403 a quien cambie la prioridad en «Escalado a Revisión» o «Devolución a corrección» sin el área
  Comercial y el cargo Director Comercial.
- **La marca «Esperando aprobación del cliente» ya no se calcula en la ruta.** Aquel paquete citaba la línea del
  listado de tickets activos como el sitio que la calcula; hoy esa línea delega en la cola del taller
  (`apps/desk/server/routes/tickets.ts:115`), y la marca se calcula en
  `apps/desk/server/db/colaTaller.ts:22-24`, con el mismo resultado más el orden nuevo (§5.0).
- **`prioridadAlNacer` cambia de firma y de regla** (`packages/shared/src/contratos.ts:66-69`): toma un tercer
  argumento, la prioridad del Top 5, y devuelve «la más alta» entre `High` por contrato y la del Top 5; sin
  ninguna, la del cuerpo, como antes.
- **El cargo de las alarmas no es el cargo de permiso.** Las alarmas de SLA buscan al `Coordinador Comercial` en
  `users.cargo`, el de la firma (`apps/desk/server/db/avisos.ts:109`), y F1C-05 añade otro, `users.cargo_permiso`.
  Asignar el cargo de permiso **no** enruta alarmas (§6.1.3). Es la divergencia H5 de E-092
  (`docs/sdd/ENTRADA.md:1274`).

---

## 1 · Resumen para quien publica

**Veredicto: `e8840e7` es DESPLEGABLE**, con las condiciones del 2026-09-30 y tres más, todas cubiertas por
este documento o por tareas de persona que no lo bloquean:

1. La consulta de §4.4 justo después del Deploy **sigue siendo obligatoria y es más amplia**: una columna y
   dos tablas más. **Si falta la columna `public.users.cargo_permiso`, nadie puede usar la aplicación**: la
   sesión se lee en cada petición con esa columna (`apps/desk/server/auth/sessions.ts:17`,
   `apps/desk/server/auth/middleware.ts:18`). Si falta `desk.tickets.modalidad`, `public.contratos` o
   `public.cliente_prioridad`, **no se puede crear ningún ticket** (§2.2). En cualquiera de los dos casos, se
   revierte (§4.5).
2. **CAMBIO VISIBLE de F1C-05 (S-1): desde el Deploy, un usuario de Comercial que no sea administrador deja de
   poder hacer la «Liberación sin factura»** hasta que se le asigne el cargo de permiso `Director Comercial`. La
   columna nace con el Deploy, así que el cargo **no se puede asignar antes**
   (`openspec/changes/archive/2026-09-30-permisos-por-cargo/tasks.md:236`). Antes del Deploy hay que **nombrar
   quién asigna el cargo a quién y aceptar por escrito ese intervalo** (`:238`); la asignación es P.1 de F1C-05,
   **el mismo día** (§6.3.0).
3. **El orden de las tareas del mismo día importa:** P.1 de F1C-05 (asignar `cargo_permiso`) va **antes** que P.1
   de F1B-07 (marcar la lista Top 5), porque sin cargo sólo el administrador puede marcar la lista
   (`packages/shared/src/cargos.ts:80-83`).

Siguen en pie las del 2026-09-30: **la P.3 de `alarmas-horas-habiles` (ráfaga de lo vencido) se decide ANTES
del Deploy** —sin respuesta se publica apagada, que es lo que hace `e8840e7`; no hay decisión registrada en
`openspec/config.yaml` (`git grep -niE "r.faga" e8840e7 -- openspec/config.yaml` → 0)— y si Gerencia la quiere
encendida, **`e8840e7` deja de ser el commit a publicar** (§6.1.4).

Las migraciones son todas aditivas e idempotentes (§2), no hay ninguna variable de entorno nueva (§3), no queda
ningún «no se despliega sin X» pendiente fuera de este documento (§7), y build, tipos y pruebas están en verde.

**Lo que puede sorprender al equipo, por orden de impacto.**

1. **Comercial pierde la «Liberación sin factura»** hasta que se asigne el cargo de permiso (F1C-05, S-1). Deja
   de ver el botón y, por API, recibe 403 «… sólo la ejecuta el cargo Director Comercial»
   (`apps/desk/server/services/ticketService.ts:131`). El administrador la conserva siempre
   (`packages/shared/src/cargos.ts:49`).
2. **Aparecen tres alarmas de SLA nuevas en la campana (y por correo, si el canal está encendido)**, todas al
   `Coordinador Comercial`: `Notificado` a las 9 h hábiles, `Remisión creada` a las 27 h hábiles sólo si no hay
   orden de venta, y `Notificación cliente` a las 36 h hábiles, que además pinta en el tablero «Esperando
   aprobación del cliente» (§5.1). En producción hoy **no existe ninguna alarma de SLA**.
3. **El tablero y «Mis tickets» cambian de orden** (F1B-07, E-099): primero la urgencia —Urgent, High, Medium,
   Low y, al final, sin prioridad— y, dentro de ella, la fecha y hora de «Habilitar Servicio», **del más antiguo
   al más nuevo** (`packages/shared/src/prioridad.ts:101-109`). Antes era del más nuevo al más viejo
   (`openspec/changes/archive/2026-10-01-prioridad-top5-cliente/tasks.md:251`). Las listas de cerrados no cambian.
4. **Los técnicos dejan de poder cambiar la prioridad** en «Escalado a Revisión» y «Devolución a corrección»: el
   campo desaparece de su formulario (`apps/desk/src/components/TransitionPanel.tsx:160`) y, por API, una
   prioridad distinta recibe 403 (`apps/desk/server/services/ticketService.ts:131`). Y como el campo deja de ser
   obligatorio (`packages/shared/src/transitions.ts:84`), **un ticket que nace sin prioridad, de un cliente sin
   Top 5 ni contrato, se queda sin ella al escalar** y cae en «Otra prioridad» del tablero
   (`apps/desk/src/board.ts:45`).
5. **Los tickets `Soporte remoto` que hoy estén en `En Proceso`, `Pendiente` o `Finalizado` cambian de botones el
   día del Deploy** (S-6). **Cuántos son no está medido** (§6.1.2).
6. **Los tickets nuevos de soporte remoto nacen en `Solicitud Soporte`**, con un selector «Modalidad», y caen en
   la columna «Otros» del tablero.
7. **El buscador de orden de venta deja de ofrecer órdenes** ya usadas por otro ticket o en cuarentena (F1B-11,
   §5.1 bis). Cuántas caen en cuarentena **no está medido** (§6.1.6).
8. **Los tickets de un cliente con contrato vigente nacen en `High`**, en cuanto Comercial registre los
   contratos; **los de un cliente Top 5 nacen con la prioridad de la lista**, en cuanto se marque (§6.3.0).
   Manda la más alta de las dos.
9. **Pantallas nuevas sin efecto hasta que alguien las use:** «Cargo de permiso» en la consola de usuarios,
   «Clientes Top 5 y prioridad» en Configuración y el panel de prioridad con «Ajustar» en la ficha del ticket.
10. **Los tickets «Equipo nuevo» cambian de botones** (F1B-06, cambio 1), también los ya abiertos (R3).
11. **`Por Entregar` y `Por Entregar / Sin facturar` se mudan a «Tickets en espera»** (F1B-08).
12. **La remisión de entrada pregunta si el equipo llega con novedad**, y con «Sí» exige foto (F1B-04).
13. **Comercial recibe avisos nuevos de F1B-11 en la campana** (discrepancia de OV, ritmo de contrato).

**Las acciones de persona, en orden** (lista completa y paso a paso en §6).

1. **Antes del Deploy:** copia de la base (§4.1); decisión P.3 de alarmas (§6.1.4); **nombrar quién asigna los
   cargos de permiso y aceptar por escrito el intervalo sólo-administrador** (§6.1.8); recomendado: el recuento
   de SR (§6.1.2), el cargo de firma `Coordinador Comercial` (§6.1.3), localizar el ticket del paso 6 de P.2 de
   alarmas (§6.1.5), la consulta de subOV (§6.1.6), mirar `AVISOS_COPIA_EMAIL` (§6.1.7) y preparar la lista
   Top 5 (§6.1.9).
2. **Deploy, y en los minutos siguientes la consulta de §4.4.** Si falta una tabla o columna, se revierte
   (§4.5). Justo después, **P.1 de F1C-05 y luego P.1 de F1B-07** (§6.3.0). **A los tres minutos,
   aproximadamente**, corre la primera pasada de alarmas y fija el corte: entonces se hace el paso 6 de P.2 de
   alarmas (§6.3.1).
3. **Después:** verificaciones en la app de las cuatro tandas posteriores al 2026-09-29, alta de contratos,
   `INSERT` de cierres y las comprobaciones pendientes desde el 2026-09-27 (§6.3). Las decisiones de Gerencia de
   §6.4 no bloquean el Deploy.

---

## 2 · Cambios de esquema

### 2.1 · `packages/zoho-sync/src/db/schema.sql` — veintisiete sentencias nuevas, todas al final del fichero

`git diff ae5aaf4..e8840e7 -- packages/zoho-sync/src/db/schema.sql` sólo **añade** líneas (`git diff --shortstat`
→ «1 file changed, 174 insertions(+)», ninguna borrada): ninguna sentencia existente cambia. La última
sentencia que ya existía en `ae5aaf4` es la de `packages/zoho-sync/src/db/schema.sql:448`
(`fecha_aviso_cliente`); todo lo de debajo es nuevo. Desde `b1347e0` se añaden 26 líneas al final
(una en blanco y `:598-622`), commits `d201fe4` (F1C-05) y `1550b07` (F1B-07): las veintitrés sentencias del paquete del
2026-09-30 **no se han movido** (el bloque nuevo empieza después de su última línea, `:596`).

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
| 21 | `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS modalidad text` | `packages/zoho-sync/src/db/schema.sql:576` | `desk` | No, a propósito (comentario en `:574-575`) | Sí, `IF NOT EXISTS` | F1B-06 (`blueprint-soporte-remoto`) |
| 22 | `CREATE TABLE IF NOT EXISTS public.alarmas_avisadas (ticket_id, estado, entrada_at, avisada_at, avisos_creados, PRIMARY KEY (ticket_id, estado, entrada_at))` | `packages/zoho-sync/src/db/schema.sql:582-589` | `public` | **Sí** | Sí, `IF NOT EXISTS` | F1B-08 (`alarmas-horas-habiles`) |
| 23 | `CREATE TABLE IF NOT EXISTS public.alarmas_corte (id integer PRIMARY KEY, corte_at timestamptz NOT NULL)` | `packages/zoho-sync/src/db/schema.sql:593-596` | `public` | **Sí** | Sí, `IF NOT EXISTS` | F1B-08 (`alarmas-horas-habiles`) |
| **24** | `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cargo_permiso text` | `packages/zoho-sync/src/db/schema.sql:601` | `public` | **Sí** | Sí, `IF NOT EXISTS` | **F1C-05** (`permisos-por-cargo`) |
| **25** | `CREATE TABLE IF NOT EXISTS public.cliente_prioridad (client_id text PRIMARY KEY, top5 boolean NOT NULL DEFAULT false, prioridad text, actualizado_por text NOT NULL, actualizado_at timestamptz NOT NULL DEFAULT now())` | `packages/zoho-sync/src/db/schema.sql:606-612` | `public` | **Sí** | Sí, `IF NOT EXISTS` | **F1B-07** (`prioridad-top5-cliente`) |
| **26** | `CREATE TABLE IF NOT EXISTS public.prioridad_ajustes (id bigserial PRIMARY KEY, …, motivo text NOT NULL CONSTRAINT prioridad_ajustes_motivo CHECK (motivo <> ''), …)` | `packages/zoho-sync/src/db/schema.sql:613-621` | `public` | **Sí** | Sí, `IF NOT EXISTS` (el `CHECK` va dentro del `CREATE`) | **F1B-07** (`prioridad-top5-cliente`) |
| **27** | `CREATE INDEX IF NOT EXISTS idx_prioridad_ajustes_ticket ON public.prioridad_ajustes (ticket_id)` | `packages/zoho-sync/src/db/schema.sql:622` | `public` | **Sí** | Sí, `IF NOT EXISTS` | **F1B-07** (`prioridad-top5-cliente`) |

*(Veintisiete sentencias en veintidós filas: la 2-7 agrupa seis `ALTER` iguales.)*

**Las cuatro nuevas por dentro, restricción a restricción.**

- **`public.users.cargo_permiso`** (`packages/zoho-sync/src/db/schema.sql:601`): `text`, **anulable, sin
  `DEFAULT`, sin `CHECK` y sin relleno**, a propósito (comentario en `:598-600`): la lista cerrada de siete
  cargos vive en `packages/shared/src/cargos.ts:12-15`, y un valor de la base que no esté en ella se lee como
  «sin cargo» (`apps/desk/server/auth/users.ts:30`, `esCargo`). Es **distinta** de `users.cargo`, la de la
  firma de la remisión, que sigue siendo texto libre. Va **calificada** (`users` está en `PUBLIC_TABLES`,
  `packages/zoho-sync/src/db/migrate.ts:70`). Es la **única** de las cuatro nuevas que recae sobre una tabla
  que ya tiene datos, y no lleva ninguna restricción: todos los usuarios existentes quedan con `NULL`.
- **`public.cliente_prioridad`** (`packages/zoho-sync/src/db/schema.sql:606-612`): una fila por cliente,
  **clave primaria** `client_id` (`:607`) **sin clave foránea**, como `public.contratos`. `top5` es `NOT NULL
  DEFAULT false` y `prioridad` es anulable **sin `CHECK`**: la lista blanca (`High`, `Medium`, `Low`) vive en
  `packages/shared/src/prioridad.ts:13` y un valor de la base fuera de ella no impone nada (`:34-36`, falla
  cerrado). Se escribe con un solo `INSERT … ON CONFLICT (client_id) DO UPDATE`
  (`apps/desk/server/db/prioridadCliente.ts:57-65`). Nace vacía.
- **`public.prioridad_ajustes`** (`packages/zoho-sync/src/db/schema.sql:613-621`): la traza de cada ajuste a
  mano, **clave primaria** `id bigserial` (`:614`), **sin clave foránea** a `tickets` (`:615`). El **`CHECK`
  `prioridad_ajustes_motivo`** (`:618`) impide un motivo vacío **en la base**; la ruta lo rechaza antes con 422
  tras recortarlo (`packages/shared/src/prioridad.ts:69`, `:72`). El ajuste y su traza van en una sola
  transacción (`apps/desk/server/db/prioridadCliente.ts:91-96`). Nace vacía.
- **`idx_prioridad_ajustes_ticket`** (`packages/zoho-sync/src/db/schema.sql:622`): índice no único sobre
  `ticket_id`, para leer la traza de un ticket (`apps/desk/server/db/prioridadCliente.ts:80`).

**Y las tres del paquete del 2026-09-30, sin cambios:**

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

**Las ocho tablas nuevas están clasificadas.** `calendario_cierres`, `equipos_cambios`, `ov_asociaciones`,
`contratos`, `alarmas_avisadas`, `alarmas_corte`, `cliente_prioridad` y `prioridad_ajustes` están en
`PUBLIC_TABLES` (`packages/zoho-sync/src/db/migrate.ts:70-73`; las dos últimas, añadidas por `1550b07` al final
de `:73`), que es lo que exige el guardián de `packages/zoho-sync/src/db/migrate.test.ts`.

**Todas son ADITIVAS.** Ocho tablas nuevas, **doce** columnas nuevas **anulables y sin `DEFAULT`** sobre
tablas existentes (las once del paquete del 2026-09-30 más `users.cargo_permiso`), y **siete** índices,
todos sobre tablas nuevas y vacías. No se borra ni se renombra nada, ninguna columna existente cambia de
tipo, y **ninguna restricción nueva recae sobre una tabla que ya tenga datos**: los `NOT NULL`, los dos
`CHECK`, las claves primarias y los índices únicos son todos de tablas que nacen vacías.

**Ninguna toca las cuatro tablas replicadas** (`desk.activities`, `books.contacts`, `books.sales_orders`,
`books.items`, `DEPLOY.md:42`), así que la regla de orden de `DEPLOY.md:50-51` —DDL primero en el
suscriptor— **no aplica a este paquete**.

**Punto y coma.** `schemaStatements` trocea el fichero por `;` a ciegas
(`packages/zoho-sync/src/db/migrate.ts:19-21`). Comprobado sobre `e8840e7`: debajo de
`packages/zoho-sync/src/db/schema.sql:448` y hasta `:622` hay **exactamente 27 líneas con `;`**, una por sentencia
(la última línea de cada una: su `;` o su cierre `);`). En el bloque nuevo son `:601`, `:612`, `:621` y `:622`. **Ningún comentario del bloque nuevo lleva `;`**,
tampoco los de `:598-600` y `:603-605`, ni los comentarios en línea de `:607`, `:609` y `:615`. El `''` del
`CHECK` de `:618` no lleva `;`.

### 2.2 · Dónde se aplican: al arrancar, idempotentes, y en silencio si algo falla

- **App:** `main()` corre `reorgToDesk` si el esquema es `desk` y luego `await migrate(pool)`
  (`apps/desk/server/index.ts:26-27`), **antes** de montar la API y de escuchar en el puerto
  (`apps/desk/server/index.ts:49`, `:57`). Ninguna petición llega antes de que la migración haya terminado.
- **Idempotencia, sentencia a sentencia:** las veintisiete llevan `IF NOT EXISTS` (§2.1). **No hay ninguna
  que no lo sea.** Cada Deploy vuelve a pasar el fichero entero, y en el segundo arranque cada sentencia es
  una operación vacía (`DEPLOY.md:227`, cierto para este rango).
- **Worker `hub-sync`:** `hubBootstrap` llama a `migrate(db)` sobre el hub con **el mismo** `schema.sql`
  (`apps/hub-sync/src/hubSync.ts:13`). Las ocho tablas `public.*` nuevas, las columnas nuevas de `tickets`
  y la de `public.users` **también se crean en `zoho-hub`** cuando se redespliegue el worker (`public.users`
  existe allí porque la crea el mismo fichero, `packages/zoho-sync/src/db/schema.sql:82`). Es inocuo: el
  worker no cablea el aviso de discrepancia (`apps/hub-sync/src/hub-sync.ts:21`), ni la pasada de alarmas,
  ni nada de F1C-05 o F1B-07 (`git grep -n "cargo_permiso\|cliente_prioridad\|prioridad_ajustes\|colaDelTaller\|prioridadTop5" e8840e7 -- apps/hub-sync` → 0).

⚠️ **`migrate` sigue siendo tolerante por sentencia** (`packages/zoho-sync/src/db/migrate.ts:28-33`): si una
sentencia falla, escribe `migrate: sentencia omitida:` en el log y **sigue arrancando**. La consecuencia de
cada omisión, con las siete de las cuatro tandas posteriores al 2026-09-29:

| Si se omite… | Qué se rompe | Por qué |
|---|---|---|
| **sentencia 24 (`public.users.cargo_permiso`)** | **TODA la aplicación**: cualquier petición con sesión responde 500, y la consola de usuarios tampoco carga. Nadie puede trabajar | `requireAuth` relee el usuario de la base en cada petición (`apps/desk/server/auth/middleware.ts:18`) con una consulta que nombra la columna (`apps/desk/server/auth/sessions.ts:17`); la lista y la ficha de usuarios usan `USER_SELECT`, que también la nombra (`apps/desk/server/auth/users.ts:14`) |
| **sentencia 25 (`public.cliente_prioridad`)** | **El alta de cualquier ticket** responde 500; además, la pantalla «Clientes Top 5 y prioridad» y el panel de prioridad de la ficha | El alta lee la prioridad del Top 5 del cliente en cada creación (`apps/desk/server/services/ticketService.ts:106` → `apps/desk/server/db/prioridadCliente.ts:40-43`, consulta en `:35`); la lista lee la tabla (`:46-52`) |
| sentencia 26 (`public.prioridad_ajustes`) | El **panel de prioridad de la ficha** del ticket y el **«Ajustar»** responden 500. El alta, el tablero y las transiciones **no** | La lectura de la traza (`apps/desk/server/db/prioridadCliente.ts:80`) va en cada `GET /api/tickets/:id/prioridad` (`apps/desk/server/routes/prioridad.ts:52`, `:59`); el ajuste inserta en ella (`apps/desk/server/db/prioridadCliente.ts:94`), dentro de la misma transacción que cambia la prioridad, así que no queda a medias |
| sentencia 27 (índice de `prioridad_ajustes`) | Nada visible | Es un índice no único, sólo acelera la lectura de la traza |
| **sentencia 21 (`tickets.modalidad`)** | **El alta de cualquier ticket** responde 500, sea de la clasificación que sea | El `INSERT` del alta nombra la columna `modalidad` siempre (`packages/zoho-sync/src/db/repo.ts:420-422`, parámetro `$19`) |
| sentencia 18 (`public.contratos`) | **El alta de cualquier ticket** responde 500 | El alta consulta si el cliente tiene contrato vigente en cada creación (`apps/desk/server/services/ticketService.ts:106` → `apps/desk/server/db/contratos.ts:68-69`) |
| sentencia 14 (`public.ov_asociaciones`) | El **buscador de orden de venta**, las **tres puertas** de «una OV, un ticket», la ficha del ticket y **la alarma de `Remisión creada`** | `soloLibres` lee la tabla (`packages/zoho-sync/src/books/repo.ts:159-162`); la tercera vía de las puertas también (`packages/zoho-sync/src/db/repo.ts:371`); y la pasada de alarmas la consulta para saber si hay OV (`apps/desk/server/db/sla.ts:51`, que llama a la consulta de `:104-110`) |
| sentencia 12 o 13 (columnas de `tickets`) | **La sincronización con Zoho Desk entera** y el alta de tickets | `upsertTicket` lee las dos columnas (`packages/zoho-sync/src/db/repo.ts:67`); el alta escribe la marca en su `INSERT` (`packages/zoho-sync/src/db/repo.ts:418-422`) |
| sentencia 22 o 23 (`alarmas_avisadas`, `alarmas_corte`) | **Las alarmas no suenan** y el tablero sale **sin** la marca «Esperando aprobación del cliente». **Nada más**: ni el tablero ni la sincronización se caen | La pasada escribe el corte antes que nada (`apps/desk/server/services/alarmasSla.ts:86`, `:61`); si falla, lanza, `pasadaAlarmas` lo recoge y deja `pasadaAlarmas falló` en el log (`:141-146`), y la cadena sigue con el ritmo y la sincronización (`apps/desk/server/index.ts:88`). La marca del tablero nunca lanza: deja un `warn` y devuelve vacío (`apps/desk/server/db/alarmasAvisadas.ts:31-34`) |
| sentencias 15-17, 19-20 (índices) | Nada visible de inmediato. Sin los únicos, la base deja de impedir dos asociaciones vigentes de la misma OV o dos contratos del mismo lote en una carrera | La ruta sigue comprobando antes (`apps/desk/server/routes/contratos.ts:55`), pero la carrera la cierra el índice |

Un fallo de migración **no tumba el Deploy**: salvo la sentencia 24, que se nota en cuanto alguien entra,
**no se ve en pantalla hasta que alguien crea un ticket**. Por eso §4.4 comprueba, en sólo lectura, las ocho
tablas, las doce columnas, los siete índices, los dos `CHECK` y las cuatro claves primarias de las tablas de
las tandas posteriores al 2026-09-29, y §4.5 dice que si falta algo se revierte.

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

Ninguno de estos ficheros cambia en `b1347e0..e8840e7` (`git diff --stat b1347e0 e8840e7 -- docs/sdd` no lista
ningún `.sql`). Las consultas de sólo lectura de las tandas posteriores al 2026-09-29 (recuento de SR, cargo,
tamaño de lo que se marca en silencio, usuarios para asignar el cargo de permiso) no viven en ficheros `.sql`:
están en los `tasks.md` archivados y se copian en §6.1 y §6.3.0.

---

## 3 · Variables de entorno e interruptores

**Ninguna nueva.** Medido sobre el diff entero y sobre el tramo nuevo:

- `git diff ae5aaf4..e8840e7 -- apps packages`: las líneas añadidas con `process.env` siguen estando sólo
  en las siete herramientas de repositorio que listaban los paquetes anteriores (detector de citas,
  reconciliación y sus pruebas). No las carga ni la App ni el worker.
- **Después de `b1347e0` no se añade ni una**: en `git diff b1347e0 e8840e7 -- apps packages`, las líneas
  añadidas con `process.env`, `import.meta.env`, `VITE_` o `=== 'true'` son **0**, y
  `git diff --name-only -G'process\.env' b1347e0 e8840e7 -- apps packages` sale vacío. Lo mismo medía el
  paquete del 2026-09-30 para `3f9d23b..b1347e0`.
- `packages/zoho-sync/src/config.ts` **no cambia** en el rango (`git diff --stat ae5aaf4..e8840e7 --
  packages/zoho-sync/src/config.ts` → vacío).
- **`.env.example` no cambia en el rango**: `git diff --stat ae5aaf4..e8840e7 -- '*.env.example'` sale vacío,
  y desde `b1347e0` tampoco (cabecera). **Su contenido no se ha leído desde esta sesión**, igual que advierte
  `DEPLOY.md:172-175`.
- **`DEPLOY.md` sí cambia desde `b1347e0`, y sólo en el apartado de `AVISOS_COPIA_EMAIL`** (`e591454`, +9/−6;
  hoy `DEPLOY.md:157-170`). Ningún otro apartado se toca: las citas a `DEPLOY.md` anteriores a la línea 157 no
  se mueven, y las posteriores se corren **tres líneas** (por eso este documento cita `DEPLOY.md` con la
  línea de hoy, y el del 2026-09-30 las llevaba ancladas en `c2b2888`).

**F1C-05 y F1B-07 no añaden ningún escritor hacia fuera.** El cargo de permiso, la lista Top 5 y los
ajustes escriben **sólo** en la base de la App (`apps/desk/server/auth/users.ts:40-42`, `:98`;
`apps/desk/server/db/prioridadCliente.ts:57-65`, `:91-96`): ni avisos, ni correo, ni Zoho. Ninguna de las
dos tandas tiene interruptor, y no lo necesita: no encienden ningún escritor.

**El escritor nuevo de F1B-08 SÍ manda correo, y no tiene interruptor propio: usa el que ya existe.** Las
alarmas crean avisos en la campana y, **después** de todas las transacciones, los mandan por el canal de
correo de los avisos (`apps/desk/server/services/alarmasSla.ts:126-136`, `dispararAvisos`). Ese canal ya
está gobernado por `N8N_AVISOS_WEBHOOK_URL`, que **nace apagada** (`packages/zoho-sync/src/config.ts:114`,
`|| ''`) y está documentada con sus dos frases en `DEPLOY.md:131-140`. Con la variable vacía,
`dispararAvisos` no manda nada y devuelve el motivo (`apps/desk/server/avisosWebhook.ts:58`); la campana
avisa igual. **Por eso no es un interruptor sin documentar.** Si el canal está encendido en producción hoy
**no está verificado** desde el repositorio: decide si el Coordinador Comercial recibe correo o sólo campana.

**`AVISOS_COPIA_EMAIL` — documentada desde `e591454`; ya no es una incoherencia.** Cada aviso de alarma
sale marcado `conCopia: true` (`apps/desk/server/services/alarmasSla.ts:118`), y `dispararAvisos` manda copia a
`AVISOS_COPIA_EMAIL` de todo aviso con esa marca (`apps/desk/server/avisosWebhook.ts:71-75`). El paquete del
2026-09-30 avisaba de que `DEPLOY.md` sólo hablaba de derivaciones. Hoy `DEPLOY.md:159-164` dice que copia
«dos clases de aviso dirigidos a otras personas»: los de derivación y, «desde `alarmas-horas-habiles`
(F1B-08), **todas las alarmas de SLA**», y que los avisos de área siguen sin copia; y `DEPLOY.md:165-170`, que
dejarla puesta convierte una dirección en receptora «de las derivaciones **y de cada alarma de SLA vencida**
de todo el mundo —una por cada destinatario de la alarma—». La variable «vacía —lo normal— no copia nada»
(`DEPLOY.md:163-164`). **El código no cambia en ese punto desde `b1347e0`**: lo que cambió es el documento,
que ahora dice lo que hace. La acción de persona de mirarla antes del Deploy se conserva (§6.1.7), porque
lo que no está verificado es su **valor** en producción.

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
- Las funciones nuevas del worker cuelgan de credenciales y flags **que ya existían** (`DEPLOY.md:192-201`).
- **El cargo de permiso no es una variable**: se asigna por usuario en la consola de usuarios y vive en la
  base (`public.users.cargo_permiso`, §2.1). Nada de F1C-05 ni de F1B-07 se configura en EasyPanel.

---

## 4 · Procedimiento

### 4.1 · Copia de la base ANTES del Deploy

**Es obligatoria y no es higiene: es la única red.** Gerencia decidió no montar copia de pruebas y aceptó
por escrito que todo despliegue se prueba sobre la aplicación que usa la gente
(`openspec/config.yaml:1705-1707`, `decision/e013b-copia-pruebas`), y decidió que haya **copia previa a cada
cambio que se suba**, con responsable **Alfonso (Gerencia)** (`openspec/config.yaml:2253-2259`,
`decision/p55-backup`, consecuencia (1) en `:2261`).

**Esta vez pesa todavía más que el 2026-09-30**, porque a lo que la reversión de código no deshace
(asociaciones, contratos, marcas de fila, tickets nacidos en `Solicitud Soporte`, la columna `modalidad` con
valores, y las marcas y el corte de las alarmas) se suman cuatro cosas nuevas: los cargos de permiso
asignados, la lista Top 5, los ajustes de prioridad con su traza, y la prioridad que ya quedó escrita en los
tickets (§4.5).

**Cómo:** `DEPLOY.md` **no describe** ningún procedimiento de copia. Lo siguiente es **hipótesis**, no
procedimiento verificado: una copia lógica de la base `desk` con `pg_dump` desde un contenedor que llegue al
servicio `desk-db`, con la cadena de conexión que da EasyPanel en la variable `DATABASE_URL` del servicio
App —el **nombre** de la variable, nunca su valor en un chat—:

```bash
# HIPÓTESIS de procedimiento: no está en DEPLOY.md ni verificado contra EasyPanel.
pg_dump --format=custom --file=desk_antes_de_e8840e7.dump "$DATABASE_URL"
```

Criterio de hecho, sea cual sea el método: **existe un fichero de copia con fecha de hoy, fuera del
servidor, y su tamaño no es cero.** La copia nocturna del adelanto de `p55-backup`, si ya estuviera en
marcha, no sustituye a ésta: puede tener horas de antigüedad. Ningún documento del repositorio registra que
esa copia nocturna esté funcionando.

`zoho-hub` **no necesita copia por este paquete** en el mismo sentido: sus cambios son aditivos (§2.2,
§2.3) y su contenido se puede volver a traer de Zoho. Hipótesis: rehacerlo cuesta un backfill completo.

### 4.2 · Publicar

**`DEPLOY.md` ya cubre el mecanismo. No se repite aquí.**

- **App:** `DEPLOY.md` §5 «Desplegar» (`DEPLOY.md:177-180`) — botón **Deploy** en EasyPanel; el server corre
  `migrate` en el arranque; luego se abre el dominio.
- **Worker `hub-sync`:** `DEPLOY.md` §7 (`DEPLOY.md:186-205`). Mismo repositorio y misma imagen, arranque
  `npm run start:hub-sync`. Desde `3f9d23b` sólo le llega código compartido que no usa (el nacimiento de
  soporte remoto en `createTicket`, los cargos y la prioridad de `shared`) y las sentencias de la migración
  (§2.2). Conviene redesplegarlo, pero es **independiente** de la App. Qué versión corre hoy el worker **no
  está verificado** en ningún documento del repositorio (hipótesis: la misma época que la App).
- **Idempotencia de la migración:** `DEPLOY.md:227`. Cierta para este rango (§2.2), con la salvedad de la
  tolerancia por sentencia.
- **Orden con la replicación lógica:** no aplica (§2.1).
- **Publicar `e8840e7` entero, no un commit intermedio** (§7). Las dos tandas del 2026-09-29 lo piden por
  escrito: «desplegar los tres lotes juntos»
  (`openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/tasks.md:416`) y «se despliegan los cuatro
  lotes juntos» (`openspec/changes/archive/2026-09-29-alarmas-horas-habiles/tasks.md:333`). Las dos nuevas no
  lo escriben así, pero sus tramos intermedios dejan pantallas sin servidor o servidor sin pantalla (§7).

### 4.3 · Lo que este rango cambia en la imagen y `DEPLOY.md` no dice

`f962e81` añadió al `Dockerfile` `COPY scripts ./scripts` antes del `npm ci` de la etapa de ejecución
(`Dockerfile:19-22`), porque `package.json` tiene un script `prepare` (`package.json:11`) que corre
`scripts/instalar-hooks.mjs` en cada `npm ci`. Ese script **nunca falla `npm ci`**: sin `.git` o sin
binario `git` sale con 0 (`scripts/instalar-hooks.mjs:19-23`), y `.git` no entra en la imagen
(`.dockerignore`).

**Desde `dcb5c99` no cambia nada de lo que decide cómo se construye la imagen**, tampoco después de
`b1347e0` (cabecera: ni `Dockerfile`, ni `package.json`, ni `package-lock.json`). La construcción local del
2026-09-27 sobre `10453a9` (Docker 29.6.2, `--no-cache`, salida 0;
`docs/sdd/Paquete_de_Despliegue_2026-09-27.md:196-199`) sigue siendo representativa **del procedimiento de
construcción**. Que la imagen de `e8840e7` construya igual es **hipótesis**: el código cambió y la imagen no se
ha vuelto a construir (lo que sí se ejecutó es `npm run build`, cabecera). **Si el Deploy falla en el build**, mirar el `npm ci` y este
`COPY`.

### 4.4 · Comprobar que producción está en el commit publicado

**Mismo método que el 2026-09-10** (`docs/sdd/Paquete_de_Despliegue_2026-09-10.md:22`): el bundle principal
que sirve producción tiene que ser **byte a byte** el que sale de construir el commit.

1. Construcción local de `e8840e7`, hecha el 2026-10-01 con `npm run build`:
   - fichero: `dist/assets/index-BRgjbhPT.js` (378,22 kB; 378.222 bytes)
   - sha256: `68eaeda2db1efb5b092b13f09cfa0ce8cee3845d6249f166a47a5332a0ff4ac3`
2. En producción, abrir `https://ambientalia-desk.ambientalia.cloud/`, ver en el código fuente de la página
   qué `index-*.js` carga, descargarlo y calcular su sha256.
3. **Nombre y sha256 iguales ⇒ producción ≡ `e8840e7`.** Desde ese momento, «sin desplegar» se cuenta desde
   `e8840e7` y no desde `ae5aaf4`. Si sale `index-D1PHIhoj.js`, es el bundle de `b1347e0` (paquete del
   2026-09-30): se publicó el commit equivocado.

*Límite del método:* la construcción de referencia se hizo en Windows y la de producción en
`node:22-alpine`. Que den los mismos bytes es **hipótesis**; el 2026-09-10 salieron iguales para `ae5aaf4`.
Si el nombre coincide y el sha256 no, no concluir nada: reconstruir en Linux antes. Y el bundle **sólo
prueba el cliente**: el servidor sale de la misma imagen (`Dockerfile:1-29`), así que se infiere.

**Y que la migración entró — obligatorio, en los minutos siguientes al Deploy (§2.2).** En la consola de
PostgreSQL de producción, base `desk` (las tablas de Desk viven en el esquema `desk`; el catálogo, los
usuarios y todas las tablas nuevas, en `public`), **sólo lectura**:

```sql
BEGIN READ ONLY;

SELECT to_regclass('public.calendario_cierres') AS cierres,
       to_regclass('public.equipos_cambios')    AS cambios,
       to_regclass('public.ov_asociaciones')    AS asociaciones,
       to_regclass('public.contratos')          AS contratos,
       to_regclass('public.alarmas_avisadas')   AS alarmas_avisadas,
       to_regclass('public.alarmas_corte')      AS alarmas_corte,
       to_regclass('public.cliente_prioridad')  AS cliente_prioridad,
       to_regclass('public.prioridad_ajustes')  AS prioridad_ajustes;
-- Deben salir los ocho nombres, ninguno NULL. Si sale NULL en cliente_prioridad, no se puede crear
-- ningún ticket (§2.2).

SELECT table_schema, table_name, column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
 WHERE (table_schema, table_name, column_name) IN (
        ('desk','tickets','history_synced_at'),
        ('desk','tickets','ov_elegida_en_app_at'), ('desk','tickets','ov_zoho_avisada'),
        ('desk','tickets','modalidad'),
        ('desk','equipos','fecha_adquisicion'),    ('desk','equipos','fecha_factura_compra'),
        ('desk','equipos','fin_garantia'),         ('desk','equipos','codigo_interno'),
        ('desk','equipos','mantenedor_id'),        ('desk','equipos','drive_url'),
        ('public','remisiones','hay_novedad'),
        ('public','users','cargo_permiso'))
 ORDER BY 1, 2, 3;
-- Deben salir 12 filas, todas con is_nullable = YES y column_default vacío.
-- Si falta ('public','users','cargo_permiso'), NADIE puede usar la aplicación (§2.2): revertir ya (§4.5).
-- Si falta ('desk','tickets','modalidad'), no se puede crear ningún ticket (§2.2).
-- La de users debe salir con data_type = text.

SELECT indexname FROM pg_indexes
 WHERE schemaname = 'public'
   AND indexname IN ('idx_equipos_cambios_equipo', 'idx_ov_asoc_numero_vigente', 'idx_ov_asoc_so_vigente',
                     'idx_ov_asoc_ticket', 'idx_contratos_lote', 'idx_contratos_cliente',
                     'idx_prioridad_ajustes_ticket')
 ORDER BY 1;
-- Deben salir 7 filas.

SELECT conrelid::regclass AS tabla, conname, pg_get_constraintdef(oid) AS definicion
  FROM pg_constraint
 WHERE contype = 'c'
   AND conname IN ('contratos_fin_no_antes_de_inicio', 'prioridad_ajustes_motivo')
 ORDER BY 2;
-- Deben salir 2 filas: contratos_fin_no_antes_de_inicio, CHECK (fecha_fin >= fecha_inicio),
-- y prioridad_ajustes_motivo, sobre public.prioridad_ajustes, CHECK con motivo <> ''.

SELECT conrelid::regclass AS tabla, pg_get_constraintdef(oid) AS clave
  FROM pg_constraint
 WHERE contype = 'p'
   AND conrelid IN (to_regclass('public.alarmas_avisadas'), to_regclass('public.alarmas_corte'),
                    to_regclass('public.cliente_prioridad'), to_regclass('public.prioridad_ajustes'))
 ORDER BY 1;
-- Deben salir 4 filas: alarmas_avisadas con PRIMARY KEY (ticket_id, estado, entrada_at),
-- alarmas_corte con PRIMARY KEY (id), cliente_prioridad con PRIMARY KEY (client_id)
-- y prioridad_ajustes con PRIMARY KEY (id).

SELECT (SELECT count(*) FROM public.cliente_prioridad) AS filas_top5,
       (SELECT count(*) FROM public.prioridad_ajustes) AS filas_ajustes,
       (SELECT count(*) FROM public.users WHERE cargo_permiso IS NOT NULL) AS usuarios_con_cargo;
-- Justo después del Deploy, las tres a 0: nacen vacías y sin relleno. Crecen con P.1 de F1C-05
-- y P.1 de F1B-07 (§6.3.0).

SELECT count(*) AS filas_corte, min(corte_at) AS corte FROM public.alarmas_corte;
-- 0 filas justo después del Deploy; 1 fila tras la primera pasada (unos 3 minutos).
-- Nunca más de 1. Anotar el valor de `corte`: es el instante que separa lo que se marca
-- en silencio de lo que avisa (§5.1).

ROLLBACK;
```

Si falta algo, buscar `migrate: sentencia omitida` en el log del servicio App (§2.2) y **pasar a §4.5**: sin
`users.cargo_permiso` nadie puede trabajar; con `modalidad`, `public.contratos`, `public.cliente_prioridad` o
las columnas de `tickets` de F1B-11 ausentes, el alta de tickets o la sincronización están rotas. No es un
estado en el que se pueda dejar la app mientras se investiga.

**Y que se puede entrar.** Antes que nada de lo demás: iniciar sesión en
`https://ambientalia-desk.ambientalia.cloud/` y abrir el tablero. Si el inicio de sesión funciona pero el
tablero y cualquier otra pantalla devuelven error, es casi seguro la columna `users.cargo_permiso`
(§2.2): comprobarla con la segunda consulta de arriba.

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

- Las doce columnas nuevas sobre tablas existentes son **anulables y sin `DEFAULT`** (§2.1). Los `INSERT` de
  `ae5aaf4` nombran sus columnas y no incluyen éstas, así que les llega `NULL`. No hay **ningún `NOT NULL`
  nuevo sobre una tabla que `ae5aaf4` escriba**. `public.users.cargo_permiso` incluida: el alta de usuario y la
  lectura de la sesión de `ae5aaf4` nombran sus columnas una a una, y ésta no está entre ellas.
- Las ocho tablas nuevas **no las nombra `ae5aaf4`**: `git grep` de sus nombres sobre `ae5aaf4 -- apps
  packages` no da ninguna coincidencia (para las tres piezas de F1C-05 y F1B-07, `git grep -c
  "cargo_permiso\|cliente_prioridad\|prioridad_ajustes" ae5aaf4 -- apps packages` → sin resultados), y su
  `schema.sql` termina en la línea 448. Sus restricciones no pueden rechazar nada que escriba el código viejo.
  Ninguna tiene clave foránea.
- El `migrate` de `ae5aaf4` sólo reaplica su `schema.sql`, que es un prefijo del nuevo
  (`packages/zoho-sync/src/db/schema.sql:1-448` no cambia en el rango).

**Lo que la reversión de código NO deshace, y hay que saberlo antes de pulsar.** Los cuatro primeros son
nuevos en este paquete (F1C-05 y F1B-07); (a), (b) y (c) venían del 2026-09-30, y el resto del 2026-09-29,
re-comprobados.

- **(d) Los cargos de permiso asignados se quedan en `public.users.cargo_permiso`**, y nadie los lee:
  `ae5aaf4` no conoce la columna. **Con el código viejo, la «Liberación sin factura» vuelve a ser de toda el
  área Comercial** —en `ae5aaf4` sólo se exige el área (`liberacion_sin_factura`, área `Comercial`, en la
  línea 246 de su `packages/shared/src/transitions.ts`)— y nadie necesita cargo. Al republicar `e8840e7`, los
  cargos asignados vuelven a valer tal cual, sin reasignar. Si se quisieran retirar sin desplegar código, la
  propia tanda lo deja escrito: `UPDATE public.users SET cargo_permiso = NULL`
  (`openspec/changes/archive/2026-09-30-permisos-por-cargo/tasks.md:239`); es **dato de producción y decisión
  de persona**, no de este documento.
- **(e) La lista Top 5 se queda en `public.cliente_prioridad`**, y nadie la lee: con el código viejo, los
  tickets nuevos de un cliente Top 5 **dejan de nacer con su prioridad** y vuelven a nacer con la del alta, o
  `High` si tienen contrato vigente. La pantalla «Clientes Top 5 y prioridad» desaparece. Al republicar, la
  lista vuelve a valer para los tickets que nazcan desde entonces; los nacidos durante la ventana no se
  corrigen solos (es el mismo límite S-1 de E-109: el Top 5 no se propaga a lo ya abierto).
- **(f) Los ajustes y su traza se quedan en `public.prioridad_ajustes`**, y la vieja no los enseña. **Y los
  tickets ajustados se quedan con `managed_by_app = true`**: el ajuste lo pone en la misma transacción
  (`apps/desk/server/db/prioridadCliente.ts:93`), y el sincronizador no toca una fila así
  (`packages/zoho-sync/src/db/repo.ts:71`; el `upsertTicket` de `ae5aaf4` hace lo mismo con esa bandera). O
  sea que **un ticket ajustado deja de recibir cambios desde Zoho Desk para siempre**, con o sin reversión.
  Es el mismo efecto que ya tiene cualquier transición hecha en la app; se anota porque el ajuste es una vía
  nueva de llegar a él (R25, §5.3).
- **(g) La prioridad que ya quedó escrita en los tickets se queda**: la de los nacidos con Top 5, la de los
  ajustados y la de los que se escalaron **sin** prioridad (que siguen sin ella). Con el código viejo, el
  campo «Prioridad» vuelve a ser **obligatorio** en «Escalado a Revisión» y «Devolución a corrección» (en
  `ae5aaf4`, `required: true` en la línea 84 de su `packages/shared/src/transitions.ts`) y el técnico vuelve
  a poder cambiarlo: puede pisar la prioridad de un Top 5 o de un contrato, que es exactamente lo que F1B-07
  cerró (R10). Y el tablero y «Mis tickets» vuelven al orden viejo.

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
  alternativa sin tocar datos es no revertir mientras haya alguno, o volver a publicar `e8840e7` en cuanto se
  pueda: con el código nuevo recuperan «Asignación».
  Los SR **heredados** que S-6 pasó al flujo remoto no se quedan varados al revertir: `En Proceso`,
  `Pendiente` y `Finalizado` son estados del grafo de servicio de `ae5aaf4` (por ejemplo, `from: ['En
  Proceso']` y `from: ['Pendiente']` en `ae5aaf4:packages/shared/src/transitions.ts:206` y `:230`), así que
  vuelven a ver las salidas de servicio. Cambian de camino por segunda vez, que es lo que hay que avisar.
- **(b) Las marcas y el corte de las alarmas se quedan congelados — y al volver a publicar, lo vencido entre
  medias AVISA.** Mientras corra `ae5aaf4`, nadie lee ni escribe `public.alarmas_avisadas` ni
  `public.alarmas_corte` (las dos nacen en este rango; el `ticketsConSlaVencido` de `ae5aaf4` no tiene
  ningún llamador, `git grep` sobre `ae5aaf4` sólo lo encuentra en su propia definición). El tablero pierde
  la marca «Esperando aprobación del cliente», porque la calcula el servidor nuevo (el listado de
  `apps/desk/server/routes/tickets.ts:115` la toma de `apps/desk/server/db/colaTaller.ts:22-24`). **Al volver a
  publicar `e8840e7`**, la primera pasada **no
  reescribe el corte**: el `INSERT` lleva `ON CONFLICT (id) DO NOTHING` y luego se lee la fila que ya había
  (`apps/desk/server/services/alarmasSla.ts:61-63`). Una entrada sólo se marca en silencio si **ya estaba
  vencida en ese corte viejo** (`apps/desk/server/db/sla.ts:59`, `vencidoEnCorte`; `apps/desk/server/services/alarmasSla.ts:102-104`).
  Todo lo que venció **durante** la ventana revertida no estaba vencido en el corte y no tiene marca
  (`:100`), así que **avisa en la primera pasada tras republicar, con correo si el canal está encendido**.
  Esto se razona leyendo el código; **cuántos avisos serían depende de cuánto dure la reversión y no es
  comprobable desde aquí (hipótesis sobre el volumen)**. Si la reversión dura días, conviene saberlo antes
  de republicar; qué hacer con esa ráfaga (aceptarla o tocar el corte a mano) es decisión de persona sobre
  datos de producción.
- **(c) `tickets.modalidad` se queda con valores**, y la columna y las ocho tablas nuevas **no se borran**.
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
  la modalidad, las marcas de alarma, los cargos de permiso, la lista Top 5 y los ajustes. Los avisos ya creados en la campana **sí** los enseña la vieja (la
  bandeja ya existía), y **los correos de alarma ya enviados no se recuperan**.
- Un ticket «Equipo nuevo» que avanzó por el flujo nuevo hasta `En Proceso` vuelve a ver las transiciones de
  servicio. No se queda varado, pero cambia de camino a mitad.

**No es una salida probada volver a `b1347e0` ni a `3f9d23b`** (los dos paquetes anteriores) para quitar sólo
lo nuevo: esos commits **nunca estuvieron en producción**, así que no hay nada verificado sobre ellos en el
entorno real. Además, `b1347e0` sobre una base ya migrada por `e8840e7` dejaría la «Liberación sin factura»
otra vez a toda el área y la prioridad otra vez en manos del técnico, como (d) y (g). La salida
documentada es `ae5aaf4`.

**Volver al estado exacto de la base anterior** —no sólo al código— es restaurar la copia de §4.1. Se pierde
**todo** lo escrito después del Deploy. Los tickets que vienen de Zoho los vuelve a traer la sincronización
(hipótesis: la siguiente pasada incremental; un backfill completo sólo si la tabla queda vacía,
`apps/desk/server/index.ts:61-69`). El procedimiento es **hipótesis**:

```bash
# HIPÓTESIS: no está en DEPLOY.md ni verificado contra EasyPanel. Con la App PARADA.
pg_restore --clean --if-exists --dbname="$DATABASE_URL" desk_antes_de_e8840e7.dump
```

Sólo tiene sentido **junto con** redesplegar `ae5aaf4`. Orden: parar la App, restaurar, desplegar `ae5aaf4`.
Restaurar la copia también borra `public.alarmas_corte`: si después se vuelve a publicar `e8840e7`, la
primera pasada fija un corte **nuevo** y todo lo vencido en ese momento se marca en silencio, sin ráfaga. Y
borra también los cargos de permiso, la lista Top 5 y los ajustes: al republicar habría que repetir P.1 de
F1C-05 y P.1 de F1B-07.

**Señales que obligan a volver atrás:**

| Señal observable | Dónde se ve | Qué significa |
|---|---|---|
| Falta una tabla, columna, índice, uno de los `CHECK` o una clave primaria en la consulta de §4.4 | Consola de PostgreSQL | Migración omitida (§2.2). Revertir y leer el log |
| **Se inicia sesión pero ninguna pantalla carga**, o todo responde error a cualquier usuario | Cualquier vista | Falta `public.users.cargo_permiso` (`apps/desk/server/auth/sessions.ts:17`, leída en cada petición desde `apps/desk/server/auth/middleware.ts:18`). Revertir **ya** |
| El tablero se queda en blanco tras el Deploy | Cualquier vista | Fallo de arranque, del `dist/` o la fila anterior. Revisar logs del servicio App |
| El build falla en EasyPanel | Pestaña de despliegue | Ver §4.3. Producción sigue en `ae5aaf4`: no hay nada que revertir |
| **No se puede crear ningún ticket** (500), de ninguna clasificación | «Nuevo ticket» → «Crear ticket» | Falta `desk.tickets.modalidad` (`packages/zoho-sync/src/db/repo.ts:420-422`), `public.contratos`, `public.cliente_prioridad` (`apps/desk/server/db/prioridadCliente.ts:35`) o la marca de `tickets` (§2.2) |
| **El administrador no puede guardar el cargo de permiso** de un usuario, o la consola de usuarios no carga | Configuración → «Usuarios» | Falta `public.users.cargo_permiso` (`apps/desk/server/auth/users.ts:14`, `:98`) |
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
Comercial». **Y, de F1C-05 y F1B-07:** un usuario de Comercial que no es administrador y ya no ve
«Liberación sin factura», o que recibe 403 «… sólo la ejecuta el cargo Director Comercial» (S-1, hasta P.1 de
F1C-05); un técnico que ya no ve el campo «Prioridad» al escalar, o que recibe 403 «La prioridad del ticket la
fija el Director Comercial…» (`packages/shared/src/prioridad.ts:55`); un ticket que se queda en «Otra
prioridad» tras escalar; el tablero o «Mis tickets» en otro orden; un 409 «El cliente del ticket no es Top 5…»
al ajustar (`apps/desk/server/routes/prioridad.ts:69`); la lista Top 5 vacía antes de P.1 de F1B-07.

---

## 5 · Cambios de comportamiento

Producción no tiene **ninguno** de los de esta sección. La tanda de cada cambio sale de la cabecera `tanda:`
de su `proposal.md` o `archive-report.md` archivado.

### 5.0 · Las dos tandas posteriores al paquete del 2026-09-30

| Cambio archivado (`tanda`, `cierra`) | Commits | Qué ve el usuario | Ruta:línea que lo produce |
|---|---|---|---|
| `2026-09-30-permisos-por-cargo` (**F1C-05**, `cierra: no`: cubre el nivel CARGO y deja fuera la regla de las transiciones Decisionales y el nivel de propietario del registro, `openspec/changes/archive/2026-09-30-permisos-por-cargo/archive-report.md:17-22`) | `db5630f`, `d201fe4`, `e71fd3f` | **(1) Selector «Cargo de permiso»** en la consola de usuarios (alta y edición), con siete cargos en lista cerrada; sólo el administrador gestiona usuarios. Es **distinto** del «cargo» de firma, que sigue siendo texto libre. Un valor fuera de la lista → 422. **(2) CAMBIO VISIBLE (S-1): la «Liberación sin factura» exige el área Comercial Y el cargo `Director Comercial`**. Un Comercial sin ese cargo deja de ver el botón y, por API, recibe 403 «La transición "Liberación sin factura" sólo la ejecuta el cargo Director Comercial». El administrador pasa siempre. **Mientras nadie tenga cargo, sólo el administrador libera sin factura**: no hay respaldo al área (S-1, `openspec/changes/archive/2026-09-30-permisos-por-cargo/archive-report.md:79-80`). **(3) El cargo surte efecto en la SIGUIENTE petición**, sin volver a entrar; con la pantalla ya abierta puede hacer falta recargar para ver el botón (hipótesis de la tanda, su P.2). **(4)** Las otras dos restricciones por cargo (crear OVI de garantía → `Director Técnico`; prioridad Top 5 → `Director Comercial`): la primera sigue **sin llamador** hasta F1B-03; la segunda la usa F1B-07 (fila siguiente) | Lista: `packages/shared/src/cargos.ts:12-15`. Excepción: `packages/shared/src/cargos.ts:32` (`liberacion_sin_factura` → `Director Comercial`), sobre la transición de `packages/shared/src/transitions.ts:246`. Regla: `packages/shared/src/cargos.ts:45-58` (el admin pasa en `:49`). 403 del servidor: `apps/desk/server/services/ticketService.ts:131`, **después** del 403 de área (`:129-130`) y de los 409 (`:125-128`), **antes** de todo 422 (`:134`). Botón: `apps/desk/src/components/TransitionPanel.tsx:57`. Sesión: la columna se lee en `apps/desk/server/auth/sessions.ts:17` en cada petición (`apps/desk/server/auth/middleware.ts:18`) y se valida con `esCargo` en `apps/desk/server/auth/users.ts:30`. Alta y edición: `apps/desk/server/auth/routes.ts:70-72` y `:99-100` (422 antes de escribir), bajo `requireAdmin` (`:55`, `:76`). Selector: `apps/desk/src/components/UsersAdmin.tsx:122-125` (alta) y `:182-185` (edición). OVI de garantía sin llamador: `packages/shared/src/cargos.ts:67-74` |
| `2026-10-01-prioridad-top5-cliente` (**F1B-07**, `cierra: no`: deja fuera la calificación de los clientes sin contrato ni Top 5 —pregunta 3.b—, quién ajusta fuera de los Top 5 —3.b.3—, E-108 y E-109, `openspec/changes/archive/2026-10-01-prioridad-top5-cliente/archive-report.md:9-17`) | `1550b07`, `e3d5e90`, `5aab12c`, `0879f20` | **(1) «Clientes Top 5 y prioridad»** en Configuración → «Administración de datos»: buscar un cliente, elegir prioridad (`High`, `Medium`, `Low`) y marcarlo; cambiar o quitar. Sólo editan el administrador y quien tenga el área Comercial **y** el cargo `Director Comercial`; los demás la ven en sólo lectura. **(2) «Manda la más alta» al nacer**: un ticket nuevo nace con la más alta entre `High` por contrato vigente y la prioridad Top 5 de su cliente; sin ninguna de las dos, con la que traiga el alta, como hoy. Los tickets **ya abiertos no heredan** la del Top 5 (S-1, E-109). **(3) Panel de prioridad en la ficha del ticket** con la traza de ajustes, y **«Ajustar»** sólo si el cliente es Top 5 y el usuario puede; exige motivo y una prioridad distinta (409 si el cliente no es Top 5; 403 sin permiso; 422 sin motivo). **(4) CAMBIO VISIBLE (a): el técnico pierde la prioridad** en «Escalado a Revisión» y «Devolución a corrección»: el campo desaparece de su formulario y, por API, una prioridad distinta recibe 403. **(5) CAMBIO VISIBLE (b):** como el campo deja de ser obligatorio, un ticket que nace sin prioridad, de un cliente sin Top 5 ni contrato, **queda en «Otra prioridad» al escalar** y al final de la cola. **(6) CAMBIO VISIBLE (c), E-099: el tablero y «Mis tickets» se ordenan en el servidor** por urgencia (Urgent, High, Medium, Low, sin prioridad) y, dentro de ella, por la **última** fecha y hora de «Habilitar Servicio» —o la de creación si no hay ninguna—, **del más antiguo al más nuevo**. Antes, del más nuevo al más viejo. Las listas de cerrados no cambian | Lista blanca: `packages/shared/src/prioridad.ts:13`; la más alta: `:22-28`; Top 5 que falla cerrado: `:34-36`. Al nacer: `apps/desk/server/services/ticketService.ts:106` → `packages/shared/src/contratos.ts:66-69` y `apps/desk/server/db/prioridadCliente.ts:40-43`. Permiso: `packages/shared/src/cargos.ts:80-83`. Rutas: `apps/desk/server/routes/prioridad.ts:20-87`, montadas en `apps/desk/server/app.ts:61` (tabla de abajo). Ajuste en una transacción: `apps/desk/server/db/prioridadCliente.ts:91-96`. Guarda del técnico: `packages/shared/src/prioridad.ts:81-86`, aplicada en `apps/desk/server/services/ticketService.ts:131`; las dos transiciones con campo de prioridad, `packages/shared/src/transitions.ts:192-195`; campo opcional, `:84`; filtro del formulario, `apps/desk/src/components/TransitionPanel.tsx:160`. Orden: `packages/shared/src/prioridad.ts:95-109`, aplicado en `apps/desk/server/db/colaTaller.ts:21-25` (habilitación, `:13-18`) para `apps/desk/server/routes/tickets.ts:115` y `apps/desk/server/routes/prioridad.ts:83-86`; cliente de «Mis tickets», `apps/desk/src/App.tsx:69`. «Otra prioridad»: `apps/desk/src/board.ts:35`, `:45`. Pantallas: `apps/desk/src/components/Configuracion.tsx:127`, `:165`; `apps/desk/src/components/Top5Panel.tsx:20`, `:46`; `apps/desk/src/components/PanelPrioridad.tsx:27`, `:59-60`, montado en `apps/desk/src/components/TicketDetailView.tsx:320` |

**Las rutas nuevas de F1B-07, con su guarda.** Todas cuelgan de `requireAuth(db)` y se montan en
`apps/desk/server/app.ts:61`, antes del 404 JSON de `/api`. El permiso sale de `puedeFijarPrioridadTop5`
(`packages/shared/src/cargos.ts:80-83`), que se consume, no se reescribe. El orden de las guardas sigue la
escalera de F1B-10 (`apps/desk/server/routes/prioridad.ts:16`, `:47-49`).

| Método y ruta | Guarda, en orden | Ruta:línea |
|---|---|---|
| `GET /api/top5` | Sólo sesión | `apps/desk/server/routes/prioridad.ts:23-25` |
| `GET /api/clients/:id/prioridad` | Sesión → **404** cliente inexistente (`:30`) | `apps/desk/server/routes/prioridad.ts:27-32` |
| `PUT /api/clients/:id/prioridad` | Sesión → **404** (`:38`) → **403** sin área Comercial y cargo `Director Comercial` (`:40`) → **422** cuerpo (`:43`) | `apps/desk/server/routes/prioridad.ts:34-45` |
| `GET /api/tickets/:id/prioridad` | Sesión → **404** (`:58`) | `apps/desk/server/routes/prioridad.ts:55-60` |
| `POST /api/tickets/:id/prioridad` | Sesión → **404** (`:66`) → **409** sin cliente (`:68`) → **409** cliente no Top 5 (`:69`) → **403** (`:71`) → **422** (`:74`) → transacción (`:75`) | `apps/desk/server/routes/prioridad.ts:62-77` |
| `GET /api/mis-tickets` | Sólo sesión; filtra por el propio usuario y ordena con la cola del taller | `apps/desk/server/routes/prioridad.ts:83-86` |

**F1C-05 no añade rutas**: amplía `POST /api/users` y `PATCH /api/users/:id`, que ya exigían administrador
(`apps/desk/server/auth/routes.ts:55`, `:76`), con el campo `cargoPermiso` y su 422.

**Regla 13, decisión a decisión, de los `.tsx` que cambian después de `b1347e0`** (`TransitionPanel.tsx`,
`UsersAdmin.tsx`, `Top5Panel.tsx`, `PanelPrioridad.tsx`, `Configuracion.tsx`, `TicketDetailView.tsx`,
`App.tsx`):

| Decisión del cliente | Línea del servidor que la impone |
|---|---|
| Ocultar «Liberación sin factura» a quien no tenga el cargo (`apps/desk/src/components/TransitionPanel.tsx:57`, con `puedeEjecutarTransicion` de `shared`) | `apps/desk/server/services/ticketService.ts:131`: 403 nombrando el cargo |
| Ocultar el campo «Prioridad» al técnico (`apps/desk/src/components/TransitionPanel.tsx:160`, con `puedeFijarPrioridadTop5`) | `apps/desk/server/services/ticketService.ts:131` → `packages/shared/src/prioridad.ts:81-86`: 403 si cambia la prioridad sin permiso |
| Ofrecer sólo los siete cargos (`apps/desk/src/components/UsersAdmin.tsx:125`, `:185`, con `CARGOS` de `shared`) | `apps/desk/server/auth/routes.ts:71` y `:100`: 422 con otro valor |
| Enseñar «Cargo de permiso» sólo al administrador (la consola de usuarios ya era sólo suya) | `apps/desk/server/auth/routes.ts:55`, `:76`: `requireAdmin` |
| Enseñar los controles de «Clientes Top 5» sólo a quien puede (`apps/desk/src/components/Top5Panel.tsx:20`, `:46`) | `apps/desk/server/routes/prioridad.ts:40`: 403 |
| Ofrecer sólo `High`, `Medium`, `Low` (`apps/desk/src/components/Top5Panel.tsx:86`, `:122`; `apps/desk/src/components/PanelPrioridad.tsx`, con `PRIORIDADES_ASIGNABLES`) | `apps/desk/server/routes/prioridad.ts:42-43` y `:73-74`: 422 |
| Enseñar «Ajustar» sólo si el cliente es Top 5 y el usuario puede (`apps/desk/src/components/PanelPrioridad.tsx:27`) | `apps/desk/server/routes/prioridad.ts:69` (409) y `:71` (403) |
| No validar el motivo en el navegador (`apps/desk/src/components/PanelPrioridad.tsx:13`: enseña los `errors[]` del 422) | `apps/desk/server/routes/prioridad.ts:73-74` → `packages/shared/src/prioridad.ts:65-74`; y en la base, el `CHECK` de `packages/zoho-sync/src/db/schema.sql:618` |
| Pedir «Mis tickets» al servidor y no reordenar (`apps/desk/src/App.tsx:69`) | `apps/desk/server/routes/prioridad.ts:83-86`: filtra y ordena el servidor |
| Volver a filtrar «Mis tickets» en la vista (`apps/desk/src/lib/boardView.ts:45`, con `esDeMisTickets` de `shared`) | No decide nada nuevo: es el **mismo** predicado que aplica el servidor (`packages/shared/src/prioridad.ts:112-114`, consumido en `apps/desk/server/routes/prioridad.ts:85`) |
| Entradas de menú y paneles (`apps/desk/src/components/Configuracion.tsx:127`, `:165`; `apps/desk/src/components/TicketDetailView.tsx:320`) | Sólo abren pantallas; cada acción la decide su ruta (tabla de arriba) |

### 5.1 · Las dos tandas del paquete del 2026-09-30

| Cambio archivado (`tanda`, `cierra`) | Commits | Qué ve el usuario | Ruta:línea que lo produce |
|---|---|---|---|
| `2026-09-29-blueprint-soporte-remoto` (**F1B-06**, `cierra: si`: cambio 2 de 2, cierra la fila, `openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/archive-report.md:7-8`) | `8fb8efd`, `93e8b15`, `30b2019` | **(1) Flujo propio para los tickets «Soporte remoto»**, con cuatro transiciones de `Servicio Técnico`: «Asignación» (`Solicitud Soporte` → `En Proceso`), «Ejecutar» (`En Proceso` → `Finalizado`), «Soporte pendiente» (`En Proceso` → `Pendiente`) y «Continuación soporte» (`Pendiente` → `En Proceso`). **(2) Nacimiento en `Solicitud Soporte`**: un alta de clasificación «Soporte remoto» nace ahí; las demás siguen naciendo en `Ticket creado`. **(3) Selector «Modalidad»** (Remoto / En sitio), visible sólo con esa clasificación y preseleccionado en «Remoto»; la ficha enseña «· Modalidad: …». Sin selector, el servidor pone `remoto`; un valor distinto de `remoto` o `en sitio`, o una modalidad en otra clasificación, → 422. La modalidad no se edita después. **(4) `Solicitud Soporte` cae en la columna «Otros»** del tablero (S-10). **(5) S-6, cambio visible sobre tickets existentes: abajo** | Catálogo: `packages/shared/src/transitions.ts:388-397` (áreas en `:389`, `:391`, `:393`, `:395`). Enrutado: `packages/shared/src/flujos.ts:57`. Nacimiento: `packages/shared/src/flujos.ts:138-139`, usado en `packages/zoho-sync/src/db/repo.ts:418-422`. Modalidad: dominio `packages/shared/src/flujos.ts:143`, regla `:151-162`, guarda del alta `apps/desk/server/services/ticketService.ts:91`; selector `apps/desk/src/components/CreateTicket.tsx:422`, envío `:230`; lectura `apps/desk/src/components/TicketProperties.tsx:144`. Estado: `packages/shared/src/estados.ts:105`, excluido del grafo de servicio en `:182` |
| `2026-09-29-alarmas-horas-habiles` (**F1B-08**, `cierra: no`: deja fuera las «vistas equivalentes a Zoho», `openspec/changes/archive/2026-09-29-alarmas-horas-habiles/archive-report.md:16-20`) | `55eac92`, `c84f875`, `ad2b97b`, `b159c6b` (+ `1843dff`, `2d2805c`, sólo documentación) | **(1) Tres alarmas de SLA en horas hábiles** (L-V 08:00-17:00 en `America/Bogota`, sin festivos de Colombia ni cierres de `public.calendario_cierres`): `Notificado` **9 h**, `Remisión creada` **27 h** —sólo si el ticket no tiene orden de venta por **ninguna** vía: columna, `salesorder_id` o asociación vigente— y `Notificación cliente` **36 h**. **(2) Aviso en la campana** al usuario activo con cargo `Coordinador Comercial` (texto: «El ticket #N lleva más de H horas hábiles en «Estado» (entró el …)», con «y sigue sin orden de venta» o «, esperando aprobación del cliente» según el caso), y **correo** por el canal de avisos si está encendido. **Si nadie tiene ese cargo**, al área Comercial —y, por cómo está hecho ese reparto, a **todos los administradores activos**— con un `warn` en el log. **(3) Una alarma por entrada**: reentrar en el estado vuelve a avisar; dos pasadas no duplican. **(4) En el tablero, la tarjeta de un ticket vencido en `Notificación cliente` muestra «Esperando aprobación del cliente»** (reloj de arena ámbar); deja de mostrarlo al salir del estado. No es un estado nuevo. **(5) El día del Deploy, corte (S-13): abajo.** Sólo cuentan los tickets del flujo de servicio que tienen foto de entrada en `ticket_transitions`, es decir, los que esta app ha movido | Umbrales: `packages/shared/src/sla.ts:32-35`; destinatarios: `:137-141`; reloj: `:52-55` sobre `packages/shared/src/calendarioLaboral.ts:174`, jornada `:13-14`. Consulta: `apps/desk/server/db/sla.ts:40-63` (sólo servicio `:48-49`, sin foto no se mide `:56`, cierres en cada llamada `:46`, OV por tres vías `:57`). Pasada: `apps/desk/server/services/alarmasSla.ts:80-138`, cableada en `apps/desk/server/index.ts:88`. Cargo: `apps/desk/server/db/avisos.ts:104-113`; respaldo al área con administradores `:68`, `:89`. Texto: `apps/desk/server/services/alarmasSla.ts:66-70`. Marca de tablero: servidor `apps/desk/server/db/alarmasAvisadas.ts:16-35`, aplicada hoy en `apps/desk/server/db/colaTaller.ts:22-24` y servida por `apps/desk/server/routes/tickets.ts:115`; pintura `apps/desk/src/components/TicketCard.tsx:98-101` |

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
Re-comprobados contra `e8840e7`: de los ficheros que citan, cambian después de `b1347e0`
`apps/desk/server/services/ticketService.ts`, `packages/shared/src/contratos.ts`,
`packages/shared/src/transitions.ts`, `apps/desk/src/components/Configuracion.tsx`,
`apps/desk/src/components/TicketDetailView.tsx` y `apps/desk/server/app.ts`, y **ninguna de las líneas citadas
se ha movido** (F1C-05 y F1B-07 escribieron en la misma línea o al final, a propósito). Cambia lo que dicen
cinco de ellas: la del alta que fija la prioridad al nacer (ahora con el Top 5), la regla
`prioridadAlNacer` (ahora «la más alta»), las dos de Configuración (ahora también con «Clientes Top 5 y
prioridad»), la de la ficha (ahora también con el panel de prioridad) y la del montaje de rutas (ahora
también con las de prioridad). Se dice en cada fila.

| Cambio archivado (`cierra`) | Qué ve el usuario | Ruta:línea que lo produce |
|---|---|---|
| `2026-09-28-parche-iv11-orden-venta` (`cierra: no`) | **Nada en pantalla, salvo un aviso nuevo.** Una orden de venta elegida en la app deja de ser sobrescrita por la sincronización. Si Zoho trae otra distinta, Comercial recibe en la campana: «Zoho trae la orden de venta X para el ticket #N, pero la aplicación tiene Y. Se conserva la de la aplicación: revise cuál es la correcta.» Un solo aviso por ticket mientras el valor de Zoho no cambie | Marca: alta `packages/zoho-sync/src/db/repo.ts:418` (la misma línea calcula hoy también el estado inicial del alta), transición `:305`, remisión `apps/desk/server/routes/remision.ts:240`. Protección: `packages/zoho-sync/src/db/repo.ts:73-78`. Detección: `:79`. Aviso: `apps/desk/server/services/avisoDiscrepanciaOV.ts:38`, anti-ruido `:30`. Cableado: `apps/desk/server/index.ts:23` |
| `2026-09-28-asociacion-ov-ticket` (`cierra: no`) | **(1)** El buscador de OV ya no ofrece las OV de otro ticket ni las OV en cuarentena. **(2)** Las tres puertas rechazan una OV en cuarentena con 422. **(3)** «Aprobación» y «Aprobación y S. Repuestos» añaden un campo opcional «OV adicional». **(4)** Sección «ÓRDENES DE VENTA (N vigentes, M liberadas)» en la ficha. **(5)** Botón «Liberar» sólo para Comercial y administradores (403 / 409 / 422). **(6)** En Configuración → «Administración de datos», «Órdenes de venta: cuarentena y saldo por lote». **(7)** Eliminar un ticket libera sus asociaciones | Buscador: `packages/zoho-sync/src/books/repo.ts:159-162` y `:176`; `apps/desk/server/routes/directory.ts:57`. Cuarentena: `packages/shared/src/subOV.ts:39`; puertas: alta `apps/desk/server/services/ticketService.ts:96`, transición `:134`, remisión `apps/desk/server/routes/remision.ts:220`. OV adicional: `packages/shared/src/transitions.ts:199`, `:203`, `:374`. Ficha: `apps/desk/src/components/TicketDetailView.tsx:320`, `apps/desk/src/components/PanelOvAsociaciones.tsx:89`. Liberar: `apps/desk/server/routes/ovAsociaciones.ts:40-55`, limpieza `packages/zoho-sync/src/db/ovAsociaciones.ts:112-120`. Configuración: `apps/desk/src/components/Configuracion.tsx:127`, `:165`. Borrado: `apps/desk/server/db/eliminarTicket.ts:154` |
| `2026-09-29-registro-contrato` (`cierra: no`) | **(1)** «Contratos por lote» en Configuración, con «Nuevo contrato» para Comercial y administradores; **no hay editar ni borrar**. **(2)** Ficha del contrato con estado, saldo, informe trimestral y «Exportar CSV». **(3)** Prioridad `High` al nacer si el cliente tiene contrato vigente; **desde `1550b07`, «la más alta» entre ésa y la del Top 5** (§5.0). **(4)** Guarda de contrato vencido en las tres puertas (422). **(5)** Marca «DE CONTRATO» en la ficha. **(6)** Aviso de ritmo a Comercial, desde el segundo trimestre y una vez por trimestre | Pantallas: `apps/desk/src/components/Configuracion.tsx:127`, `:165`; `apps/desk/src/components/ContratosPanel.tsx:24`, `:36`, `:95-116`; `apps/desk/src/components/ContratoFicha.tsx:41`, `:66`. Rutas: §5.1 ter. Prioridad: `apps/desk/server/services/ticketService.ts:106`, regla `packages/shared/src/contratos.ts:66-69`. Vencido: `apps/desk/server/services/ticketService.ts:96`, `:147`, `apps/desk/server/routes/remision.ts:220`; mensaje `packages/shared/src/contratos.ts:57`. Marca: `apps/desk/src/components/MarcaContrato.tsx:16`, `apps/desk/server/db/contratos.ts:106-115`. Ritmo: `apps/desk/server/services/avisoRitmoContrato.ts:41`, `:49`, pasada en `apps/desk/server/index.ts:88` —que desde `ad2b97b` corre **después** de la de alarmas— |

**§5.1 ter · Las rutas nuevas de F1B-11, con su guarda.** Sin cambios desde el 2026-09-29: ni
`apps/desk/server/routes/ovAsociaciones.ts` ni `apps/desk/server/routes/contratos.ts` cambian en
`3f9d23b..e8840e7`. Todas cuelgan de `requireAuth(db)` (`apps/desk/server/auth/middleware.ts:17`, `:19`), se
montan en `apps/desk/server/app.ts:61` —la misma línea monta hoy también las de prioridad, §5.0—, antes del
404 JSON de `/api` (`:73`), y el permiso sale de `canExecuteTransition(areas, isAdmin, 'Comercial')`
(`packages/shared/src/permissions.ts:4-7`). **Ninguna de estas rutas exige cargo**: F1C-05 sólo pone cargo a
la «Liberación sin factura» (§5.0), así que liberar una OV o registrar un contrato sigue siendo de toda el
área Comercial.

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

**Las dos tandas del 2026-09-30 no añaden rutas.** La marca del tablero va como un campo más del listado de
tickets activos (`apps/desk/server/routes/tickets.ts:115`, hoy a través de la cola del taller), y la
modalidad entra por el alta que ya existía.

**Regla 13, decisión a decisión, de los `.tsx` que cambiaron en `3f9d23b..b1347e0`** (`CreateTicket.tsx`,
`TicketProperties.tsx`, `TicketCard.tsx`; ninguno de los tres cambia después de `b1347e0`):

| Decisión del cliente | Línea del servidor que la impone |
|---|---|
| Enseñar el selector de Modalidad sólo para «Soporte remoto» (`apps/desk/src/components/CreateTicket.tsx:45`, con el predicado de `shared`) | `apps/desk/server/services/ticketService.ts:91` → `packages/shared/src/flujos.ts:162`: una modalidad en otra clasificación es 422 |
| Preseleccionar «Remoto» (`apps/desk/src/components/CreateTicket.tsx:45`) | `packages/shared/src/flujos.ts:156`: sin valor, el servidor pone `remoto` |
| Ofrecer sólo `remoto` / `en sitio` (`apps/desk/src/components/CreateTicket.tsx:422`, `MODALIDADES`) | `packages/shared/src/flujos.ts:157-159`: otro valor es 422 |
| Enseñar la modalidad en la ficha (`apps/desk/src/components/TicketProperties.tsx:144`) | Sólo pinta lo que guarda el servidor; no decide nada |
| Pintar «Esperando aprobación del cliente» sólo si el campo es `true` (`apps/desk/src/components/TicketCard.tsx:98`) | `apps/desk/server/db/alarmasAvisadas.ts:16-35`, aplicado en `apps/desk/server/db/colaTaller.ts:22-24` y servido en `apps/desk/server/routes/tickets.ts:115`. El cliente no calcula vencimientos |

### 5.2 · Los demás cambios del rango que tocan `apps/` o `packages/`

Todos venían ya en los paquetes del 2026-09-29 y del 2026-09-30; se re-comprobaron sus citas contra
`e8840e7`. Ninguna línea citada se ha movido; cambia lo que dicen dos, y se dice en su fila (F1B-06 cambio 1 y
F1B-10).

**Las tandas con efecto visible:**

| Tanda | Cambio archivado (`cierra`) | Qué ve el usuario | Ruta:línea que lo produce |
|---|---|---|---|
| **F1B-12** | `2026-09-24-calendario-laboral` (`cierra: si`) | **Nada en pantalla.** Pero **ya tiene consumidor**: los cierres dados de alta retrasan las alarmas de F1B-08, porque no cuentan como horas hábiles | Lector: `apps/desk/server/db/calendarioCierres.ts:31-34`, llamado desde `apps/desk/server/db/sla.ts:46`. Módulo: `packages/shared/src/calendarioLaboral.ts` |
| **F1B-14** (1) | `2026-09-24-alta-equipo-nuevo-en-ticket` (`cierra: no`) | Alta de ticket con equipo que aún no existe; errores «Faltan datos del equipo nuevo: …» y «Modelo no encontrado» (422) | Cliente: `apps/desk/src/components/CreateTicket.tsx:55`, bloque `:367-409`. Servidor: `apps/desk/server/services/ticketService.ts:24`, `apps/desk/server/services/equipoNuevo.ts:41` y `:44` |
| **F1B-14** (2) | `2026-09-25-edicion-comercial-equipo` (`cierra: si`) | Botón «Editar» en la hoja de vida y sección «Cambios»; sin Comercial ni administrador, tres campos en sólo lectura y 403 | Cliente: `apps/desk/src/components/HojaDeVida.tsx:204`, `:162`. Servidor: `apps/desk/server/routes/equipos.ts:107-108` y `:115` |
| **F1B-04** | `2026-09-25-foto-solo-con-novedad` (`cierra: no`) | La remisión de entrada pregunta «¿El equipo llega con novedad?»; con «Sí» exige foto; 422 sin fotos | Cliente: `apps/desk/src/components/CrearRemision.tsx:61`, `:100`, `:101`, `:353`. Servidor: `apps/desk/server/routes/remision.ts:290-291` |
| **F1B-06** (cambio 1) | `2026-09-25-blueprint-equipo-nuevo` (`cierra: no`) | Flujo propio para «Equipo nuevo» en `Ingresado`, `En Proceso`, `Notificado`, `Verificación` y `Finalizado`; `Verificación` cae en «Otros»; 409 al mezclar flujos | Enrutado: `packages/shared/src/flujos.ts:56-61` (desde `8fb8efd`, la línea `:57` evalúa **antes** el flujo de soporte remoto). Catálogo: `packages/shared/src/transitions.ts:350-363`. Botones: `apps/desk/src/components/TransitionPanel.tsx:56-57` (desde `e71fd3f`, el filtro de `:57` usa la compuesta de área y cargo). Servidor: `apps/desk/server/services/ticketService.ts:125`. Columna: `packages/shared/src/estados.ts:105` (la misma línea declara hoy también `Solicitud Soporte`). Fuera de las alarmas: `apps/desk/server/db/sla.ts:48-49` |
| **F1A-03** | `2026-09-27-salidas-verificacion` (`cierra: no`) | `Verificación` tiene dos salidas: «Liberación» a `Finalizado` y «Rechazo de verificación» a `Notificado` | `packages/shared/src/transitions.ts:359` y `:361` |
| **F1B-02** | `2026-09-23-hojas-vida` (`cierra: si`) | Seis campos comerciales en la hoja de vida, validados con 422 | `apps/desk/src/components/HojaDeVida.tsx:210-222`; `apps/desk/server/routes/equipos.ts:206` |
| **F1B-08** | `2026-09-12-por-entregar-es-espera` (`cierra: no`) | `Por Entregar` y `Por Entregar / Sin facturar` pasan a «Tickets en espera»; el color no cambia (IV-9) | `packages/shared/src/estados.ts:72-73`. Ficha: `apps/desk/src/components/ClienteDetalle.tsx:36`, `:115`, vía `apps/desk/src/lib/enEspera.ts:14`. Color: `apps/desk/src/components/ClienteDetalle.tsx:41` |
| **F1A-08** | `2026-09-17-tercera-puerta-orden-venta` (`cierra: si`) | Remisión con una OV que ya está en otro ticket → 409 «La orden de venta N ya está asociada al ticket #M». En producción hoy responde 201 | `apps/desk/server/routes/remision.ts:230-234` (409 en `:232`); tercera vía en `packages/zoho-sync/src/db/repo.ts:371` |
| **F1B-10** | `2026-09-21-orden-precedencia-guardas` (`cierra: si`) | Cambia qué error sale primero en el alta y en «Habilitar Servicio». El alta de remisión no cambia (IV-12) | Alta: `apps/desk/server/services/ticketService.ts:78`, `:88`, 409 en `:99`. Transición: `:134`, `:141`, `:147`, 409 en `:151`. **Desde `d201fe4` y `e3d5e90`**, la línea `:131` añade dos 403 del escalón B —cargo y prioridad— entre el 403 de área y el primer 422, sin desplazar ninguna línea |
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

**Nuevos, de F1C-05 y F1B-07.**

**R24 · Hueco sin cargo: entre el Deploy y P.1 de F1C-05, sólo el administrador libera sin factura (S-1).** Es
cambio visible, no sólo riesgo (§5.0). No hay respaldo al área, a diferencia de las alarmas
(`openspec/changes/archive/2026-09-30-permisos-por-cargo/archive-report.md:79-80`), y el hueco es inevitable:
la columna nace con el Deploy y el cargo no se puede asignar antes
(`openspec/changes/archive/2026-09-30-permisos-por-cargo/tasks.md:236`). **Cuántas liberaciones sin factura
hace Comercial al día no está medido**: decide cuánto duele cada hora de hueco. Se acota con P.1 el mismo día
(§6.3.0). El mismo hueco deja la lista Top 5 y los ajustes sólo al administrador (R27).

**R25 · Un ticket ajustado a mano deja de recibir cambios desde Zoho Desk, para siempre.** El ajuste pone
`managed_by_app = true` en la misma transacción (`apps/desk/server/db/prioridadCliente.ts:93`, con la razón en
`:87-89`: que el sincronizador no pise la prioridad), y el sincronizador no toca una fila así
(`packages/zoho-sync/src/db/repo.ts:71`). Es **el mismo efecto** que ya tiene cualquier transición hecha en la
app; lo nuevo es que el ajuste es otra vía de llegar a él, y sólo afecta a tickets de clientes Top 5. Una
reversión no lo deshace (§4.5, f).

**R26 · El alta acepta la prioridad que traiga el cuerpo, sin lista blanca ni permiso, cuando el cliente no es
Top 5 ni tiene contrato vigente (S-3, pregunta 3.b).** `prioridadAlNacer` devuelve la del cuerpo tal cual si
ninguna de las dos impone nada (`packages/shared/src/contratos.ts:66-69`, llamada en
`apps/desk/server/services/ticketService.ts:106`). O sea: el técnico ya no puede cambiar la prioridad al
escalar (§5.0), pero quien crea el ticket sí puede elegir cualquiera al nacer, y por API cualquier texto. Lo
declaran la tanda y su nota de despliegue
(`openspec/changes/archive/2026-10-01-prioridad-top5-cliente/archive-report.md:51-54`;
`openspec/changes/archive/2026-10-01-prioridad-top5-cliente/tasks.md:252`). Depende de la pregunta 3.b de
Gerencia; no se corrige en este paquete.

**R27 · Hasta que alguien tenga el cargo `Director Comercial`, sólo el administrador marca la lista Top 5,
ajusta tickets y cambia la prioridad al escalar** (`packages/shared/src/cargos.ts:80-83`;
`openspec/changes/archive/2026-10-01-prioridad-top5-cliente/tasks.md:253`). Y aun con el cargo, cambiar la
prioridad **al escalar** exige además poder ejecutar la transición, que es de Servicio Técnico
(`packages/shared/src/transitions.ts:192`, `:194`): en la práctica, el administrador o quien tenga **las dos
áreas** y el cargo (`openspec/changes/archive/2026-10-01-prioridad-top5-cliente/tasks.md:249`). Quién ajusta
fuera de los Top 5 —el maestro dice superadministrador o Director Técnico— es la pregunta 3.b.3, sin respuesta
(`docs/sdd/Preguntas_Gerencia_2026-09-29.md:87`). Sin excepción para el Director Técnico
(`packages/shared/src/prioridad.ts:79`).

**R28 · Marcar un cliente Top 5 no cambia sus tickets ya abiertos (S-1 de F1B-07, W1 de su verify).** Sólo
nacen con la prioridad los tickets nuevos; para los abiertos está el ajuste por ticket, con motivo
(`openspec/changes/archive/2026-10-01-prioridad-top5-cliente/tasks.md:254`). Es la P.3 de la tanda, en la
bandeja como **E-109** (`docs/sdd/ENTRADA.md:1422`, `NUEVA`).

**R29 · Dos supuestos del orden de la cola sin confirmar (E-110).** La cola usa la **última** habilitación de
cada ticket y, sin ninguna, su fecha de creación (`packages/shared/src/prioridad.ts:92-93`); la respuesta de
Gerencia no cierra ninguno de los dos casos. Están en la bandeja como **E-110** (`docs/sdd/ENTRADA.md:1430`,
`NUEVA`), P.4 de la tanda.

**R30 · Dos «cargo» en `public.users`, y cada uno sirve para una cosa (H5, E-092).** El de **firma**
(`users.cargo`, texto libre) es el que leen las alarmas de SLA (`apps/desk/server/db/avisos.ts:109`) y el que
imprime la remisión; el de **permiso** (`users.cargo_permiso`, lista cerrada) es el que exige la «Liberación
sin factura» y el Top 5. **Asignar uno no sirve para el otro**: un Coordinador Comercial con el cargo de
permiso puesto y el de firma vacío **no recibe alarmas**. Registrado sin destino como **E-092**
(`docs/sdd/ENTRADA.md:1274`), P.3 de F1C-05. §6.1.3 y §6.3.0 lo recuerdan donde importa.

**R31 · Menores de F1C-05 y F1B-07.** La matriz HTTP de permisos calcula su `esperado` con la misma compuesta
que prueba, así que frente al cargo es tautológica; lo detectan otras pruebas (W1,
`openspec/changes/archive/2026-09-30-permisos-por-cargo/archive-report.md:70-73`). Los `.tsx` de las dos tandas
no tienen prueba posible por F0-00; su respaldo es la tabla de la regla 13 (§5.0) y las P.2 (W4,
`openspec/changes/archive/2026-10-01-prioridad-top5-cliente/archive-report.md:46-47`). Con la pantalla ya
abierta, puede hacer falta recargar para ver el botón tras asignar un cargo (hipótesis de la tanda, P.2 de
F1C-05).

**Del paquete del 2026-09-30, re-comprobados contra `e8840e7`.**

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
Lo comprueba la P.1 de `alarmas-horas-habiles` (§6.1.3). **Asignar el cargo de permiso `Coordinador
Comercial` no lo resuelve**: las alarmas leen el de firma (R30).

**R21 · Las alarmas copian a `AVISOS_COPIA_EMAIL`. YA DOCUMENTADO; el riesgo que queda es el valor.** La parte
de documentación la cerró `e591454` (§3, `DEPLOY.md:159-164`). Si esa variable estuviera puesta en
producción —es una «muleta de pruebas», `DEPLOY.md:157`—, esa dirección recibiría copia de **todas** las
alarmas. §6.1.7.

**R22 · Dos escenarios de las alarmas quedan PARTIAL y uno MANUAL**
(`openspec/changes/archive/2026-09-29-alarmas-horas-habiles/archive-report.md:32-36`): S27 (config de correo
vacía, sin prueba a nivel de pasada; sin destino), S33 (que la marca silenciosa del corte saque la marca de
tablero; la cubre el paso 6 de P.2) y S45 (la tarjeta, `.tsx` fuera de la red por F0-00; la cubre P.2).

**R23 · Sólo se miden los tickets que esta aplicación ha movido.** Un ticket cuya entrada al estado no está en
`ticket_transitions` —por ejemplo, uno que llegó a `Notificado` sólo desde Zoho— **no tiene alarma**
(`apps/desk/server/db/sla.ts:31-32`, `:56`). Es de diseño y viene de C11; se anota para que la ausencia de un
aviso no se lea como fallo.

**Los riesgos del paquete del 2026-09-29, re-comprobados contra `e8840e7`:**

**R1 · Se puede liberar un analizador sin pasar por Verificación (E3 sin construir). SIGUE VIVO EN EL CÓDIGO,
pero ya DECIDIDO.** `openspec/config.yaml:1972-1973`. `git grep -niE "gas.?patron|gas patrón" e8840e7 --
packages apps` da **0**. **Cambio respecto al 2026-09-30:** E-082 está **cerrada desde el 2026-09-28**
(`docs/sdd/ENTRADA.md:1190`), con respuesta en `openspec/config.yaml` → `decisiones_de_gerencia` →
`decision/f1a03-familia-y-gas-patron`: compuesto heredado del modelo y tabla de gases patrón. Lo que falta es
construirlo (segunda parte de F1A-03) y la siembra, que ejecuta Alfonso. «Liberación» desde `En Proceso`
sigue disponible para cualquier «Equipo nuevo» (`packages/shared/src/transitions.ts:359`).

**R2 · Sin guarda de certificado en Liberación desde Verificación. SIGUE VIVO EN EL CÓDIGO, pero ya DECIDIDO:**
E-083 está **cerrada desde el 2026-09-28** (`docs/sdd/ENTRADA.md:1197`), con respuesta en
`decision/f1a03-certificado-liberacion`: número del certificado de fábrica obligatorio, PDF opcional, no
retroactiva. Falta construirlo (F1A-03).

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
`3f9d23b..e8840e7`.

**R8 · Contratos vivos sin registrar el día uno. SIGUE VIVO.** Probabilidad **Alta**
(`openspec/changes/archive/2026-09-29-registro-contrato/proposal.md:140`). P.7 (§6.3.3).

**R9 · Un contrato mal tecleado sólo se corrige en la base. SIGUE VIVO, y ya está en la bandeja** como
**E-088** (`docs/sdd/ENTRADA.md:1238`, `NUEVA`, sin destino). Rutas sólo `GET` y `POST`
(`apps/desk/server/routes/contratos.ts:24-70`); un lote equivocado queda ocupado por el índice único
(`packages/zoho-sync/src/db/schema.sql:572`).

**R10 · Un técnico puede bajar la prioridad de un ticket de contrato. CERRADO por `e3d5e90` (F1B-07), que era
su destino** (`openspec/changes/archive/2026-09-29-registro-contrato/proposal.md:139`). Las dos transiciones
siguen declarando el campo (`packages/shared/src/transitions.ts:193`, `:195`), pero cambiar la prioridad sin el
área Comercial y el cargo `Director Comercial` es 403 (`apps/desk/server/services/ticketService.ts:131`,
`packages/shared/src/prioridad.ts:81-86`) y el formulario ya no lo enseña
(`apps/desk/src/components/TransitionPanel.tsx:160`). Lo que queda abierto es otra cosa: R26 y R27.

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

Todas las tareas de persona de los cambios archivados cuyos commits están en `ae5aaf4..e8840e7` y que **no
tienen resultado**: las de la §6 del 2026-09-30, revalidadas, más las de `permisos-por-cargo` (F1C-05) y
`prioridad-top5-cliente` (F1B-07), sacadas de sus `tasks.md` y `archive-report.md`
(`openspec/changes/archive/2026-09-30-permisos-por-cargo/tasks.md:278-280`,
`openspec/changes/archive/2026-10-01-prioridad-top5-cliente/tasks.md:300-302`, y la P.4 de su
`openspec/changes/archive/2026-10-01-prioridad-top5-cliente/archive-report.md:78`). **Ninguna consta como
hecha**: no hay resultado en `docs/sdd/` versionado; los huecos «Resultado (a rellenar)» de los `tasks.md`
siguen vacíos; y `openspec/config.yaml` sólo añade en `b1347e0..e8840e7` decisiones que **no** responden a
ninguna tarea de esta lista —las cinco del 2026-09-28 (E-078 a E-080, E-082 y E-083) y la de E-099, que es la
que F1B-07 construye—. Dos de las del 2026-09-28, E-082 y E-083, **sí** respondían decisiones que el paquete
del 2026-09-30 tenía en su §6.4: salen de la lista de decisiones y pasan a construcción pendiente (§5.3, R1 y
R2). Y no podían estar hechas las de «después del Deploy»: nada de este rango ha llegado a producción. **Archivar no las dio por hechas** (regla del
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

Y las dos tandas nuevas, que **también** empiezan por P.1:

| Número | `permisos-por-cargo` (F1C-05) | `prioridad-top5-cliente` (F1B-07) |
|---|---|---|
| P.1 | **Asignar `cargo_permiso`** a cada usuario real, empezando por el Director Comercial, **el mismo día** del Deploy, y aceptar por escrito el intervalo sólo-administrador | **Marcar la lista Top 5** y sus prioridades en producción; **depende de P.1 de F1C-05** |
| P.2 | **Verificación en la app** (4 pasos) | **Verificación en la app** (5 pasos) |
| P.3 | Decidir qué pasa con los dos «cargo» (**E-092**, H5) | ¿Se propaga el Top 5 a los tickets abiertos? (**E-109**, S-1) |
| P.4 | — | Confirmar S-10a y S-10b del orden de la cola (**E-110**) |

Fuentes: `openspec/changes/archive/2026-09-30-permisos-por-cargo/tasks.md:278-280` y
`openspec/changes/archive/2026-09-30-permisos-por-cargo/archive-report.md:107-111`;
`openspec/changes/archive/2026-10-01-prioridad-top5-cliente/tasks.md:300-302` y
`openspec/changes/archive/2026-10-01-prioridad-top5-cliente/archive-report.md:73-78`.

### 6.0 · La lista, por orden y por dueño

| Orden | Dueño | Tarea (con su cambio) | Qué desbloquea | Paso a paso |
|---|---|---|---|---|
| **Antes** | Alfonso (Gerencia) | Copia de la base | La única vuelta atrás completa | §4.1 |
| **Antes** | Alfonso | **P.1 de `blueprint-soporte-remoto`** — recuento de SR por estado | Saber a cuántos tickets afecta S-6 y decidir si es aceptable; convierte el «sin medir» de §5.1 en cifra | §6.1.2 |
| **Antes** | Alfonso (administración) | **P.1 de `alarmas-horas-habiles`** — hay al menos un usuario activo con cargo `Coordinador Comercial` | Que las alarmas lleguen a esa persona y no al área con administradores (R20). No bloquea | §6.1.3 |
| **Antes** | Alfonso | **Preparación del paso 6 de P.2 de `alarmas-horas-habiles`** — localizar un ticket ya vencido en `Notificación cliente` | Poder hacer el paso 6 (S33) tras la primera pasada | §6.1.5 |
| **Antes** (recomendado) | Alfonso | **P.1 y P.4 de F1B-11** (`parche-iv11-orden-venta`, `asociacion-ov-ticket`, `registro-contrato`) — consulta de subOV | Saber qué OV desaparecen del buscador (R11) y confirmar los literales del saldo (R12) | §6.1.6 |
| **Antes** (recomendado) | Quien administre EasyPanel (hipótesis: Alfonso) | **Mirar `AVISOS_COPIA_EMAIL`** — la añadió el paquete del 2026-09-30, no viene de ningún archivo | Que nadie reciba sin querer copia de todas las alarmas (R21) | §6.1.7 |
| **Antes — decisión** | **Gerencia** | **P.3 de `alarmas-horas-habiles`** — ¿se enciende la ráfaga de lo vencido? Por defecto, apagada | Si la respuesta es «encender», hace falta código nuevo antes de publicar | §6.1.4 |
| **Antes** | **Gerencia o administración** | **Precondición de P.1 de F1C-05** — nombrar quién asigna `Director Comercial` a quién justo tras el Deploy, preparar la lista de cargos por usuario y **aceptar por escrito** el intervalo en que sólo el administrador libera sin factura | Que el hueco de S-1 dure minutos y no días (R24) | §6.1.8 |
| **Antes** (recomendado) | Director Comercial | **Preparar la lista Top 5** de P.1 de F1B-07, fuera de la app: cliente y prioridad | Que P.1 de F1B-07 sea teclear, no decidir | §6.1.9 |
| **Antes** (recomendado) | Gerencia o administración | **Avisar a Comercial** de que la «Liberación sin factura» desaparece unos minutos, y **a Servicio Técnico** de que ya no fija la prioridad al escalar y de que el tablero cambia de orden | Que S-1 y los cambios visibles de F1B-07 no se lean como fallos | §6.1.8 |
| **Deploy** | Quien publica | Comprobación de §4.4 (bundle, entrar en la app, esquema, log) | Seguir o revertir | §4.4 |
| **Después, el mismo día, lo primero** | Administrador de la aplicación (Gerencia o administración) | **P.1 de `permisos-por-cargo`** — asignar `cargo_permiso`, empezando por el Director Comercial | Que Comercial recupere la «Liberación sin factura» y que el Director Comercial pueda hacer P.1 de F1B-07 | §6.3.0 |
| **Después, el mismo día, tras P.1 de F1C-05** | Director Comercial (o un administrador, si aún no tiene cargo) | **P.1 de `prioridad-top5-cliente`** — marcar la lista Top 5 | Que los tickets nuevos de esos clientes nazcan con su prioridad | §6.3.0 |
| **Después, el mismo día** | Alfonso / Comercial | **Paso 6 de P.2 de `alarmas-horas-habiles`** — el ticket ya vencido muestra la marca y NO avisa | Cierra el PARTIAL de S33 | §6.3.1 |
| **Después** | Alfonso / Comercial | **P.2 de `alarmas-horas-habiles`**, pasos 1-5 | S45 (tarjeta), W4 (atomicidad en Postgres real) | §6.3.1 |
| **Después** | Alfonso / Servicio Técnico | **P.2 de `blueprint-soporte-remoto`**, siete pasos | Verificación en la app de F1B-06 cambio 2 | §6.3.2 |
| **Después, el mismo día** | Comercial | **P.7 de `registro-contrato`** — alta de los contratos vigentes | Que la prioridad `High` y el bloqueo de vencidos actúen (R8) | §6.3.3 |
| **Después** | Alfonso | `INSERT` de los cierres de fin de año (F1B-12, `docs/sdd/Alta_Cierres_Fin_de_Año_2026.sql`) | Que las alarmas no cuenten el 24/12, 30/12, 31/12, 01/01 y 02/01 como hábiles. **Antes del 24/12** | §6.3.4 |
| **Después** | Comercial | **P.3 de `parche-iv11-orden-venta`** — aviso de discrepancia | Verificación de F1B-11 | §6.3.5 |
| **Después** | Comercial | **P.3 de `asociacion-ov-ticket`** — ficha de OV, liberar, cuarentena, saldo | Verificación de F1B-11 | §6.3.5 |
| **Después** | Comercial | **P.6 de `registro-contrato`** — contratos en la app (tras P.7) | Cierra W2, W3 y W4 de su verify | §6.3.5 |
| **Después** (tras P.1 de F1C-05) | Comercial, con quien decida Gerencia | **P.2 de `permisos-por-cargo`** — botón oculto sin cargo, visible con él sin volver a entrar | Verificación en la app de F1C-05 | §6.3.8 |
| **Después** (tras P.1 de F1B-07) | Comercial y Servicio Técnico, con quien decida Gerencia | **P.2 de `prioridad-top5-cliente`**, cinco puntos | Verificación en la app de F1B-07 | §6.3.8 |
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
| Sin orden | Gerencia (propuesto) | **P.3 de `permisos-por-cargo`** — E-092, los dos «cargo» | Cerrar H5 (R30) | §6.4 |
| Sin orden | Gerencia | **P.3 de `prioridad-top5-cliente`** — E-109, propagar el Top 5 a lo abierto | R28 | §6.4 |
| Sin orden | Gerencia | **P.4 de `prioridad-top5-cliente`** — E-110, S-10a y S-10b de la cola | R29 | §6.4 |
| Sin orden | Gerencia | **Preguntas 3.b y 3.b.3** — calificación de los clientes sin contrato ni Top 5, y quién ajusta fuera de los Top 5 | R26 y R27 | §6.4 |

*Sale de esta lista respecto al 2026-09-30:* «E-082 y E-083 (`salidas-verificacion`)», que estaba **sin orden**
como decisión de Gerencia con Calidad. Las dos están **decididas** desde el 2026-09-28 (cabecera; §5.3, R1 y R2):
lo que queda es construcción de F1A-03 y la siembra que ejecuta Alfonso, que **no** son tareas de este rango.

**Agrupado por dueño:** **Alfonso** — copia, P.1 de `blueprint-soporte-remoto`, P.1 de `alarmas-horas-habiles`,
preparación del paso 6, P.1/P.4 de F1B-11, `INSERT` de cierres, y co-dueño de las dos P.2 de las tandas del
2026-09-29. **Gerencia o administración (administrador de la aplicación)** — precondición y P.1 de
`permisos-por-cargo`, el mismo día y lo primero. **Director Comercial** — lista Top 5 (preparación y P.1 de
`prioridad-top5-cliente`; un administrador mientras no tenga cargo). **Comercial** — P.7 y P.6 de
`registro-contrato`, P.3 de `parche-iv11-orden-venta`, P.3 de `asociacion-ov-ticket`, P.2 de
`alarmas-horas-habiles` (con Alfonso), P.2 de `permisos-por-cargo`, P.2 de `prioridad-top5-cliente` (con
Servicio Técnico), RQ-HV-12 (con Gerencia), F1B-02 (con Gerencia). **Servicio Técnico** — P.2 de
`blueprint-soporte-remoto` (con Alfonso), P.2 de `prioridad-top5-cliente` (con Comercial), RQ-RE-19,
comprobaciones de `blueprint-equipo-nuevo` y de `salidas-verificacion`. **Gerencia** — P.3 de
`alarmas-horas-habiles` (antes del Deploy) y las decisiones sin orden de §6.4. **Quien publica** — §4.4. **Sin
dueño** — F1B-14 (1) y la pestaña «EN ESPERA».

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

⚠️ **Nuevo en este paquete: este cargo NO es el «Cargo de permiso» de F1C-05.** Después del Deploy, la consola de
usuarios enseña dos campos: el «cargo» de siempre (texto libre, el de la firma) y el «Cargo de permiso»
(lista cerrada). **Las alarmas leen el primero** (`apps/desk/server/db/avisos.ts:109`). Elegir `Coordinador
Comercial` en el selector de permiso **no** hace que a esa persona le lleguen las alarmas (R30). Esta consulta
se puede correr antes del Deploy porque sólo lee `users.cargo`, que ya existe en `ae5aaf4`.

#### 6.1.4 · P.3 de `alarmas-horas-habiles`: ¿se enciende la ráfaga? — Gerencia (decisión ANTES del Deploy)

Fuente: `openspec/changes/archive/2026-09-29-alarmas-horas-habiles/tasks.md:406-413`.

| Dato | Valor |
|---|---|
| Qué decide | Si el día del Deploy se avisa (campana y correo) de todo lo que **ya** estaba vencido, o sólo se marca en silencio |
| Por defecto | **Apagada**: es lo que hace `e8840e7` (`apps/desk/server/services/alarmasSla.ts:21-23`, `:102-104`; el fichero no cambia desde `b1347e0`) |
| Sin respuesta | Se despliega apagada (`openspec/changes/archive/2026-09-29-alarmas-horas-habiles/tasks.md:413`) |
| Si la respuesta es «encender» | Hace falta **cambiar código antes de publicar** (sólo afecta a la primera pasada); si hiciera falta un interruptor, nace cerrado (`=== 'true'`) y va a `.env.example` y `DEPLOY.md` con sus dos frases (`openspec/changes/archive/2026-09-29-alarmas-horas-habiles/tasks.md:406`). **Entonces `e8840e7` deja de ser el commit a publicar** y este paquete no vale para el nuevo |
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

#### 6.1.7 · Mirar `AVISOS_COPIA_EMAIL` — quien administre EasyPanel (añadida por el paquete del 2026-09-30)

No viene de ningún archivo: la añadió el paquete del 2026-09-30 por una incoherencia de `DEPLOY.md` que hoy
está cerrada (§3). Se conserva porque lo que sigue sin verificar es su **valor** en producción.

1. En EasyPanel, servicio App → variables de entorno. Mirar **sólo si existe y si tiene valor**
   `AVISOS_COPIA_EMAIL`. **No copiar su valor ni el de ninguna otra variable a ningún chat ni documento.**
2. **Vacía o ausente:** nada que hacer.
3. **Con valor:** esa dirección recibirá copia de **todas** las alarmas de SLA además de las derivaciones
   (`apps/desk/server/services/alarmasSla.ts:118`, `apps/desk/server/avisosWebhook.ts:71-75`). Decidir antes
   del Deploy si se deja; `DEPLOY.md:163-164` dice cómo se apaga: borrando la variable, sin tocar código.
4. Anotar de paso **si `N8N_AVISOS_WEBHOOK_URL` tiene valor** (sin copiarlo): dice si las alarmas saldrán por
   correo o sólo en la campana (§3).

#### 6.1.8 · Precondición de P.1 de `permisos-por-cargo` — Gerencia o administración (ANTES del Deploy)

Fuente: `openspec/changes/archive/2026-09-30-permisos-por-cargo/tasks.md:238` («nombrar quién asigna
`Director Comercial` a quién justo tras desplegar y aceptar ese intervalo por escrito») y `:278` (P.1).
**El cargo no se puede asignar antes del Deploy**: la columna nace con él (`:236`). Lo que sí se puede hacer
antes es todo lo demás, para que la asignación del mismo día dure minutos.

1. **Nombrar a la persona que asigna**: un administrador de la aplicación, porque la consola de usuarios es
   sólo suya (`apps/desk/server/auth/routes.ts:55`, `:76`). *Hipótesis* de la tanda: quien administra hoy los
   usuarios de la aplicación (`openspec/changes/archive/2026-09-30-permisos-por-cargo/tasks.md:240`).
2. **Preparar la lista de cargos por usuario**, fuera de la app. Ayuda de sólo lectura en `psql`, base `desk`
   —sólo lee columnas que ya existen en `ae5aaf4`, así que se puede correr antes—:

   ```sql
   BEGIN READ ONLY;
   SELECT u.name, u.email, u.is_admin, u.cargo AS cargo_firma, r.name AS rol, r.areas
     FROM public.users u LEFT JOIN public.roles r ON r.id = u.role_id
    WHERE u.active
    ORDER BY u.name;
   ROLLBACK;
   ```

   Los siete cargos posibles son `Director Técnico`, `Coordinador Técnico`, `Técnico`, `Técnico de campo`,
   `Director Comercial`, `Coordinador Comercial` y `Asistente Comercial`
   (`packages/shared/src/cargos.ts:12-15`). **El `Director Comercial` necesita además un rol con el área
   Comercial**: el cargo nunca amplía lo que el área niega (`packages/shared/src/cargos.ts:55-57`, `:80-83`).
   Mirar en la columna `areas` que la tiene. La columna `cargo_firma` es la del texto libre: **no** decide
   nada de esto (R30).
3. **Aceptar por escrito el intervalo** en que, desde el Deploy hasta la primera asignación, **sólo el
   administrador** libera sin factura (S-1, R24). La aceptación de la tanda la dio el usuario el 2026-09-30
   (`openspec/changes/archive/2026-09-30-permisos-por-cargo/archive-report.md:79-80`); la de Gerencia sobre
   este Deploy concreto es esta tarea.
4. **Avisar a Comercial** de que la «Liberación sin factura» desaparece hasta que se asigne el cargo, y **a
   Servicio Técnico** de que ya no fija la prioridad al escalar y de que el tablero y «Mis tickets» cambian de
   orden (§5.0). Así los cambios visibles no se reportan como fallos.

#### 6.1.9 · Preparar la lista Top 5 — Director Comercial (recomendado, ANTES del Deploy)

Fuente: P.1 de `prioridad-top5-cliente`
(`openspec/changes/archive/2026-10-01-prioridad-top5-cliente/tasks.md:300`). Fuera de la app: para cada cliente,
**su nombre o NIT como sale en Books** (el buscador busca por los dos, `apps/desk/src/components/Top5Panel.tsx:112`)
y **su prioridad**, una de `High`, `Medium` o `Low` (`packages/shared/src/prioridad.ts:13`). Marcar Top 5 sin
prioridad es un 422 (`packages/shared/src/prioridad.ts:51`). **No hay tope de cinco**: el servidor guarda los que
se marquen (`apps/desk/server/db/prioridadCliente.ts:45`, S-7); que sean cinco es criterio de quien la prepara.

### 6.2 · Deploy y comprobación inmediata — quien publica

§4.2 y §4.4: bundle, **entrar en la app**, esquema y log. La consulta de §4.4 se repite a los tres o cuatro
minutos para ver `filas_corte = 1` y anotar el corte.

### 6.3 · Después del Deploy

#### 6.3.0 · P.1 de `permisos-por-cargo` y P.1 de `prioridad-top5-cliente` — el mismo día, lo primero, EN ESTE ORDEN

**Por qué en este orden:** marcar la lista Top 5 exige el área Comercial **y** el cargo `Director Comercial`
(`packages/shared/src/cargos.ts:80-83`; la ruta, `apps/desk/server/routes/prioridad.ts:40`). Mientras nadie
tenga cargo, sólo un administrador puede marcarla
(`openspec/changes/archive/2026-10-01-prioridad-top5-cliente/tasks.md:253`, `:255`). Por eso P.1 de F1C-05 va
**antes**: después, el Director Comercial marca su lista él mismo.

**Paso A · P.1 de `permisos-por-cargo` — administrador de la aplicación.** Fuente:
`openspec/changes/archive/2026-09-30-permisos-por-cargo/tasks.md:278`. Hacerlo **en cuanto §4.4 salga bien**.

| # | Paso a paso | Resultado esperado |
|---|---|---|
| 1 | Entrar como administrador → engranaje «Configuración» → «Administración de usuarios» → **«Usuarios»** | La lista de usuarios (`apps/desk/src/components/Configuracion.tsx:84-86`, sólo para administradores) |
| 2 | Abrir «Editar usuario» del Director Comercial → **«Cargo de permiso»** → `Director Comercial` → **«Guardar»** | Se guarda sin error (`apps/desk/src/components/UsersAdmin.tsx:182-185`, `:195`). Un valor fuera de la lista daría 422 (`apps/desk/server/auth/routes.ts:100`) |
| 3 | Repetir con el resto de la lista de §6.1.8 | Uno por usuario |
| 4 | En la consola, sólo lectura: `SELECT name, cargo_permiso FROM public.users WHERE cargo_permiso IS NOT NULL ORDER BY name;` | Una fila por usuario asignado, con el cargo exacto |
| 5 | Pedir al Director Comercial que **recargue** la página (sin cerrar sesión) y abra un ticket en `Por Facturar` | Ve «Liberación sin factura». La asignación surte efecto en la siguiente petición (`apps/desk/server/auth/middleware.ts:18`); recargar es por la pantalla ya abierta (hipótesis de la tanda) |

**Resultado a devolver:** cuántos usuarios quedaron con cargo y la hora de la primera asignación (cierra el
hueco de R24). Sin correos ni nombres en ningún documento.

**Paso B · P.1 de `prioridad-top5-cliente` — Director Comercial** (o un administrador, si el paso A no se pudo
hacer). Fuente: `openspec/changes/archive/2026-10-01-prioridad-top5-cliente/tasks.md:300`.

| # | Paso a paso | Resultado esperado |
|---|---|---|
| 1 | Engranaje «Configuración» → «Administración de datos» → **«Clientes Top 5 y prioridad»** | Pantalla con «Marcar un cliente como Top 5» y la lista «Clientes Top 5 · 0 clientes» (`apps/desk/src/components/Top5Panel.tsx:46`, `:54`, `:57`). Si no sale el bloque de marcar, el usuario no tiene el área Comercial y el cargo (`:20`): volver al paso A |
| 2 | Buscar el cliente (dos letras como mínimo) → elegirlo → «Prioridad» → **«Marcar Top 5»** | El cliente aparece en la lista con su prioridad y «por …» (`apps/desk/src/components/Top5Panel.tsx:60-68`) |
| 3 | Repetir con cada cliente de la lista de §6.1.9 | Uno por cliente |
| 4 | En la consola, sólo lectura: `SELECT client_id, prioridad, actualizado_por FROM public.cliente_prioridad WHERE top5 ORDER BY 1;` | Una fila por cliente marcado |

⚠️ **Los tickets ya abiertos de esos clientes NO cambian de prioridad** (R28): sólo los que nazcan desde ahora.
Para uno abierto, la ficha del ticket tiene «Ajustar», con motivo obligatorio, y deja traza. Y ajustar un ticket
lo saca de la sincronización con Zoho Desk (R25): **ajustar sólo lo que haga falta**.

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
`3f9d23b..e8840e7`, salvo dos líneas que ganan contenido sin moverse: la del alta, que ahora consulta también
el Top 5, y la regla de prioridad al nacer (§5.1 bis). Por eso el paso 1 de P.6 sigue valiendo: con contrato
vigente el ticket nace en `High`, porque ninguna prioridad del Top 5 es más alta. Hacer primero §6.3.3, porque
P.6 necesita un contrato real.

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

Sin cambios de contenido; fuentes re-comprobadas contra `e8840e7` (`openspec/specs/hojas-vida/spec.md` sólo
cambia en `b1347e0..e8840e7` dos líneas de cita, la 185 y la 190, sin desplazar nada;
`openspec/specs/remisiones/spec.md` no cambia en `3f9d23b..e8840e7`).

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

#### 6.3.8 · Verificación en la app de F1C-05 y F1B-07 — Comercial y Servicio Técnico

Hacer **después** de §6.3.0. Sobre `https://ambientalia-desk.ambientalia.cloud/`, con sesión iniciada.

**P.2 de `permisos-por-cargo` — Comercial, con quien decida Gerencia.** Fuente:
`openspec/changes/archive/2026-09-30-permisos-por-cargo/tasks.md:279`.

| # | Paso a paso | Resultado esperado |
|---|---|---|
| 1 | Un usuario de Comercial **no administrador y sin cargo** abre un ticket en `Por Facturar` | **No** ve «Liberación sin factura» (`apps/desk/src/components/TransitionPanel.tsx:57`) |
| 2 | Un administrador le asigna `Director Comercial` (§6.3.0, paso A); el usuario recarga **sin cerrar sesión** | Ahora la ve y la puede ejecutar. Si hizo falta recargar, anotarlo: es la hipótesis de la tanda |
| 3 | Un usuario con cargo `Director Comercial` pero **sin** el área Comercial | **No** la ve: el cargo no amplía lo que el área niega (`packages/shared/src/cargos.ts:57`) |
| 4 | Un administrador | La ve siempre (`packages/shared/src/cargos.ts:49`) |

⚠️ Los pasos 1 y 2 sólo **miran**; ejecutar la liberación mueve un ticket real a `Por Entregar / Sin facturar`.
Hacerlo sólo con uno que de verdad haya que liberar.

**P.2 de `prioridad-top5-cliente` — Comercial y Servicio Técnico, con quien decida Gerencia.** Fuente:
`openspec/changes/archive/2026-10-01-prioridad-top5-cliente/tasks.md:301`.

| # | Paso a paso | Resultado esperado |
|---|---|---|
| 1 | Con un cliente ya marcado Top 5 (§6.3.0, paso B), crear un ticket de prueba para él eligiendo «Low» | Nace con la prioridad del Top 5; con contrato vigente además, la más alta de las dos (`packages/shared/src/contratos.ts:66-69`) |
| 2 | Un técnico ejecuta «Escalado a Revisión» o «Devolución a corrección» | **No** ve el campo «Prioridad»; un administrador sí (`apps/desk/src/components/TransitionPanel.tsx:160`) |
| 3 | Ficha de un ticket → panel de prioridad | «Ajustar» sólo aparece si el cliente es Top 5 y el usuario puede (`apps/desk/src/components/PanelPrioridad.tsx:27`); sin motivo, el servidor lo rechaza (`apps/desk/server/routes/prioridad.ts:74`) |
| 4 | Un ticket nuevo sin prioridad, de un cliente sin Top 5 ni contrato, tras escalar | Queda en «Otra prioridad» en el modo de prioridad del tablero (`apps/desk/src/board.ts:45`) |
| 5 | «Mis tickets» de un técnico con tickets de varias prioridades | Urgent/High arriba, sin prioridad al final; dentro de cada una, del habilitado más antiguo al más nuevo (`packages/shared/src/prioridad.ts:101-109`). Las listas de cerrados conservan su orden |

⚠️ El paso 1 crea un ticket: con uno de prueba, y borrarlo al terminar con «Eliminar ticket» (sólo
administrador). El paso 3, si se llega a guardar un ajuste, **saca ese ticket de la sincronización con Zoho**
(R25): hacerlo sobre el ticket de prueba.

### 6.4 · Decisiones de Gerencia sin orden

No bloquean el Deploy. Sin ellas, lo publicado queda a medias o apoyado en supuestos.

| Tarea | Qué decide | Qué desbloquea | Dónde está escrita |
|---|---|---|---|
| **P.2 de `parche-iv11-orden-venta`** | Si se rellena la **marca** `ov_elegida_en_app_at` en las filas anteriores al Deploy | Proteger esas filas del sincronizador (R6) | `openspec/changes/archive/2026-09-28-parche-iv11-orden-venta/tasks.md:168-169` |
| **P.2 de `asociacion-ov-ticket`** | Si se rellenan las **asociaciones** anteriores | Que las puertas, el buscador y la alarma de `Remisión creada` no dependan de columnas que el sincronizador puede vaciar (R6) | `openspec/changes/archive/2026-09-28-asociacion-ov-ticket/tasks.md:497-500`; `openspec/config.yaml:3156-3160` en `e3d5e90` |
| **P.5 de `registro-contrato`** | E-086: año y tope de la ampliación | La ampliación, lo único que falta para cerrar F1B-11 | `docs/sdd/ENTRADA.md:1222`; `openspec/changes/archive/2026-09-29-registro-contrato/tasks.md:451`; `docs/sdd/Preguntas_Gerencia_2026-09-29.md:16` |
| **P.3 de `blueprint-soporte-remoto`** | E-090: área de «Asignación», «Ejecutar», «Soporte pendiente» y «Continuación soporte» | Cerrar S-1 como decisión (R15); si alguna es de Comercial, se cambia un dato por transición y la matriz de `apps/desk/server/permisos.test.ts` | `docs/sdd/ENTRADA.md:1253`; `openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/tasks.md:408-409` |
| **P.4 de `alarmas-horas-habiles`** | Si `Notificado` escala al `Coordinador Comercial` (S-3) | Si es otro cargo, se cambia un literal de `ALARMAS_SLA` (`packages/shared/src/sla.ts:138`) y su prueba | `openspec/changes/archive/2026-09-29-alarmas-horas-habiles/tasks.md:414`; `openspec/changes/archive/2026-09-29-alarmas-horas-habiles/archive-report.md:135` |
| **P.3 de `permisos-por-cargo`** | E-092: si los dos «cargo» de `public.users` se unifican o se quedan separados a propósito (H5) | Que asignar un cargo sirva para lo que se espera (R30) | `docs/sdd/ENTRADA.md:1274`; `openspec/changes/archive/2026-09-30-permisos-por-cargo/tasks.md:280` |
| **P.3 de `prioridad-top5-cliente`** | E-109: si el Top 5 se propaga a los tickets abiertos que ya existen, y cómo | R28 | `docs/sdd/ENTRADA.md:1422`; `openspec/changes/archive/2026-10-01-prioridad-top5-cliente/tasks.md:302` |
| **P.4 de `prioridad-top5-cliente`** | E-110: confirmar S-10a (última habilitación) y S-10b (sin habilitación, la fecha de creación) | R29 | `docs/sdd/ENTRADA.md:1430`; `openspec/changes/archive/2026-10-01-prioridad-top5-cliente/archive-report.md:78` |
| **Preguntas 3.b y 3.b.3** | La calificación de los clientes sin contrato ni Top 5, y quién ajusta a mano la prioridad fuera de los Top 5 | R26 (el alta acepta cualquier prioridad) y R27 | `docs/sdd/Preguntas_Gerencia_2026-09-29.md:87`; `openspec/changes/archive/2026-10-01-prioridad-top5-cliente/archive-report.md:13-15` |

*E-082 y E-083 salen de esta tabla respecto al 2026-09-30:* están decididas (`docs/sdd/ENTRADA.md:1190`,
`:1197`; `openspec/config.yaml` → `decisiones_de_gerencia` → `decision/f1a03-familia-y-gas-patron` y
`decision/f1a03-certificado-liberacion`). R1 y R2 siguen vivos, pero como construcción pendiente (§5.3).

Cualquiera de los dos rellenos de F1B-11 toca **datos de producción**: es una de las cinco razones para parar y
preguntar de la regla de ejecución de `CLAUDE.md`. Lo mismo E-109 si la respuesta es propagar. La P.3 de
`alarmas-horas-habiles` y la precondición de P.1 de `permisos-por-cargo` no están en esta tabla porque **sí
tienen orden**: antes del Deploy (§6.1.4, §6.1.8).

---

## 7 · Lo que NO es desplegable

**Nada en `e8840e7`.** Lo comprobado, una condición por fila:

| Condición que haría `e8840e7` no desplegable | Resultado | Evidencia |
|---|---|---|
| Una migración no idempotente | **No hay.** Las veintisiete sentencias nuevas llevan `IF NOT EXISTS`; las cuatro de F1C-05 y F1B-07 también (`packages/zoho-sync/src/db/schema.sql:601`, `:606`, `:613`, `:622`) | §2.1, §2.2 |
| Una restricción nueva que rompa datos existentes o los `INSERT` de `ae5aaf4` | **No hay.** Las restricciones (incluidos los dos `CHECK` y las cuatro claves primarias de tablas nuevas) son de tablas nuevas y vacías; las doce columnas nuevas son anulables y sin `DEFAULT`; ni `modalidad` ni `cargo_permiso` llevan `CHECK` | §2.1, §4.5 |
| Una sentencia sin calificar que aterrice en el esquema equivocado | **No hay.** Las cuatro nuevas van calificadas `public.` (`packages/zoho-sync/src/db/schema.sql:601`, `:606`, `:613`, `:622`), y las dos tablas nuevas están en `PUBLIC_TABLES` (`packages/zoho-sync/src/db/migrate.ts:73`) | §2.1 |
| Un `;` en un comentario que parta una sentencia | **No hay.** 27 líneas con `;` debajo de la última sentencia de `ae5aaf4`, una por sentencia | §2.1 |
| Un interruptor de escritor sin documentar | **No hay variable nueva** (0 líneas añadidas con `process.env` en `b1347e0..e8840e7`, y tampoco en `3f9d23b..b1347e0`). F1C-05 y F1B-07 no escriben hacia fuera (§3). El único escritor hacia fuera del rango, el correo de las alarmas, va por `N8N_AVISOS_WEBHOOK_URL`, que nace apagada y está documentada (`DEPLOY.md:131-140`). **Y la incoherencia de `AVISOS_COPIA_EMAIL` que señalaba el 2026-09-30 está cerrada** (`DEPLOY.md:159-164`) | §3 |
| Un fichero que la imagen no incluya | **No hay.** Todo el código nuevo está en `apps/` y `packages/`, que la imagen ya copiaba; `Dockerfile`, `package.json`, `package-lock.json` y `.dockerignore` no cambian desde `b1347e0` (cabecera). El build de `e8840e7` sale con exit 0 | Cabecera, §4.3 |
| Trabajo a medias en el código | **No hay.** En `git diff b1347e0 e8840e7 -- apps packages`, las líneas añadidas con `it.fails`, `.skip(`, `it.todo`, `FIXME` o `XXX` son **0**; las que casan con `TODO` son la palabra española «todo/todos» en comentarios y en el título de una prueba. Las dos tandas cierran su `apply` y su `verify` (`pass_with_warnings`, 0 críticos) | `openspec/changes/archive/2026-09-30-permisos-por-cargo/archive-report.md:65-68`; `openspec/changes/archive/2026-10-01-prioridad-top5-cliente/archive-report.md:40` |
| Un estado sin salida en cualquiera de los TRES flujos | **No hay.** En la unión de los tres catálogos (servicio, equipo nuevo y soporte remoto: 44 transiciones, `packages/shared/src/invariantesGrafo.test.ts:172`) el único estado sin salida es `Finalizado` (`packages/shared/src/invariantesGrafo.test.ts:177-181`); la salida de `Solicitud Soporte` es exactamente «Asignación» (`:249-251`). F1C-05 y F1B-07 no añaden ni quitan transiciones: sólo hacen opcional un campo (`packages/shared/src/transitions.ts:84`) y piden cargo en una (`packages/shared/src/cargos.ts:32`). Y la prueba pasa en la ejecución de la cabecera | `packages/shared/src/invariantesGrafo.test.ts:160-181`, `:226-251` |
| Un build, un typecheck o una suite en rojo | **No.** Build y typecheck exit 0; 2.206 pruebas en verde, 2 omitidas | Cabecera |
| Un cambio archivado «no se despliega sin X» con X fuera de `main` o fuera del paquete | **No.** Los del 2026-09-30, re-comprobados: F1B-06 cambio 1 («no se despliega sin F1A-03», `openspec/changes/archive/2026-09-25-blueprint-equipo-nuevo/archive-report.md:32`): F1A-03 es `c373bcc`, en `main`. **`blueprint-soporte-remoto`** (`openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/archive-report.md:32-39`): S-6 con «sin medir» y la columna `modalidad`, en §5.1 y §2.1. **`alarmas-horas-habiles`** (`openspec/changes/archive/2026-09-29-alarmas-horas-habiles/archive-report.md:114`): los seis puntos, en §5.1. **Nuevos:** **`permisos-por-cargo`** y **`prioridad-top5-cliente`** dicen los dos «Antes de desplegar hace falta un paquete de despliegue NUEVO» (`openspec/changes/archive/2026-09-30-permisos-por-cargo/tasks.md:233`; `openspec/changes/archive/2026-10-01-prioridad-top5-cliente/tasks.md:246`): es este documento. Los puntos de sus notas están en §2.1 (esquema), §5.0 (cambios visibles), §5.3 (R24-R28) y §6.3.0 (P.1 de cada una, en su orden) | Barrido de «no se despliega», «bloquea el despliegue» y «antes de desplegar» en los `archive-report.md`, `tasks.md` y `design.md` de las dos tandas nuevas (`git grep -n -i` sobre `e8840e7`) |
| Una decisión que haya que tomar antes y sin la cual lo publicado sería otro | **Sólo la P.3 de `alarmas-horas-habiles`**, y su falta de respuesta tiene valor por defecto escrito: apagada, que es `e8840e7` (§6.1.4). La precondición de P.1 de F1C-05 (§6.1.8) **no cambia lo publicado**: sólo decide cuánto dura el hueco de S-1 | `openspec/changes/archive/2026-09-29-alarmas-horas-habiles/tasks.md:413` |

**El orden importa. Publicar `e8840e7` entero, no un commit intermedio.** Los tramos, del más peligroso al
menos:

- **Siguen siendo peores que los extremos, de los paquetes anteriores:** entre `1b90a80` (F1B-06 cambio 1) y
  `c373bcc` (F1A-03), los tickets en `Verificación` quedaban sin transición; entre `2c43e5c` y `9de5a96`
  (`asociacion-ov-ticket`), liberar una OV no vaciaba las columnas del ticket
  (`openspec/changes/archive/2026-09-28-asociacion-ov-ticket/archive-report.md:63-65`).
- **Nuevo · entre `d201fe4` y `e71fd3f` (F1C-05): PEOR que los extremos.** `d201fe4` pone en el servidor el 403
  de cargo y la columna, pero el selector «Cargo de permiso» de la consola llega con `e71fd3f`. Publicar
  `d201fe4` deja a Comercial **sin «Liberación sin factura» y sin pantalla para devolvérsela**: el cargo sólo
  se podría asignar por SQL sobre datos de producción. Y el botón tampoco se oculta todavía, así que el
  Comercial lo ve y recibe 403. `db5630f` solo no tiene efecto visible (primitivas sin llamador).
- **Nuevo · entre `1550b07` y `0879f20` (F1B-07): incompleto, y en un tramo peor.** `1550b07` crea las tablas y
  hace nacer los tickets con el Top 5, pero la lista sólo se puede marcar por API, sin pantalla: sin efecto
  práctico. `e3d5e90` añade la guarda del técnico **en el servidor** sin quitar el campo del formulario, que
  se oculta con `0879f20`: en ese tramo un técnico **ve** el campo «Prioridad», lo rellena y recibe 403 «La
  prioridad del ticket la fija el Director Comercial…». `5aab12c` reordena el tablero y crea la ruta de «Mis
  tickets»; el cliente la usa desde `0879f20`, que trae también las tres pantallas. (Ficheros por commit:
  `git show --name-only` de cada uno.)
- **Entre `8fb8efd` y `30b2019` (soporte remoto): incompleto, no peor.** `8fb8efd` sólo toca `packages/shared`:
  activa S-6 sobre los SR heredados sin que ningún SR nazca todavía en `Solicitud Soporte`
  (`openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/tasks.md:142`). `93e8b15` añade la columna y
  el nacimiento, y el cliente viejo manda altas SR sin `modalidad`: el servidor pone `remoto`
  (`packages/shared/src/flujos.ts:156`; `openspec/changes/archive/2026-09-29-blueprint-soporte-remoto/tasks.md:416`).
  En ningún intermedio queda un estado sin salida. Pero la propia tanda pide desplegar los tres juntos.
- **Entre `55eac92` y `b159c6b` (alarmas): incompleto, no peor, con una trampa.** `ad2b97b` activa las alarmas
  y **fija el corte** en su primera pasada, pero sin `b159c6b` el tablero no enseña la marca. **La trampa es
  que el corte no se vuelve a fijar**: publicar `ad2b97b` y más tarde `e8840e7` deja el corte en la fecha de
  `ad2b97b`, no en la del Deploy completo.

*Lo que dicen los tramos nuevos es lectura del orden de los commits y de sus ficheros (§5.0), no una
ejecución:* ninguno de los commits intermedios se ha construido ni probado por separado (hipótesis sobre su
comportamiento exacto). Cualquier commit entre `0879f20` y `e8840e7` da el mismo código (cabecera).

**Lo que no bloquea pero no se ha podido comprobar:** la versión que corre hoy el worker (§4.2); que la
imagen de `e8840e7` construya en EasyPanel (§4.3); la forma de `books.sales_orders` en la base `desk` de
producción para el bloque 5 (§6.1.6); si el canal de correo de avisos y `AVISOS_COPIA_EMAIL` están puestos en
producción (§3, §6.1.7); que `America/Bogota` se resuelva en el contenedor (§6.3.7); quién tiene hoy el área
Comercial entre los candidatos a `Director Comercial` (§6.1.8); y cuántas liberaciones sin factura caben en
el hueco de S-1 (R24).

---

## 8 · Nota de método

Las citas `ruta:línea` de este documento se comprobaron contra el árbol en `e8840e7`, con un script que
cosecha las citas igual que el detector de `pre-push` (`apps/desk/server/citas/cosecha.ts`) y lee cada
extremo —el inicial y el final de cada rango— en la revisión que toca: la de su ancla si lleva «en
`<sha>`», `e8840e7` si no. Las nuevas se leyeron además una a una para comprobar que la línea **dice** lo
que la frase afirma.

Las del paquete del 2026-09-30 se re-leyeron así: para cada cita sin ancla a un fichero que cambia en
`b1347e0..e8840e7` (42 ficheros: 41 de código más `DEPLOY.md`), se calculó su línea de hoy a partir de los
tramos de `git diff -U0 b1347e0 e8840e7` y se marcó toda cita cuya línea cayera en un tramo cambiado.
**Ninguna cita de código se ha desplazado**: F1C-05 y F1B-07 insertaron al final de los ficheros o en la
misma línea, a propósito. Lo que sí cambió es **lo que dicen** unas cuantas, y se nombran en prosa para que
nadie las lea como citas: la línea del alta que fija la prioridad al nacer, que ahora consulta también el Top
5; la función que decide la prioridad al nacer, que ahora devuelve «la más alta»; la línea del listado de
tickets activos, que ya no calcula la marca de alarma sino que delega en la cola del taller; la última línea
de la lista de tablas públicas, con dos nombres más; las dos líneas de Configuración que montan las entradas
de «Administración de datos», con «Clientes Top 5 y prioridad»; la línea de la ficha que monta los paneles,
con el de prioridad; y la línea que monta las rutas de F1B-11, con las de prioridad. Cada una se dice en su
sitio.

Las citas a `DEPLOY.md` posteriores a la línea 157 se corren tres líneas desde `e591454`; aquí se citan con
la línea de hoy, y las del paquete del 2026-09-30, ancladas en `c2b2888`, siguen siendo ciertas de esa
revisión. Las dos citas a `docs/sdd/ENTRADA.md` que cambiaron de contenido son las cabeceras de E-082 y
E-083, hoy «CERRADA 28/09»: se citan con ese contenido. Las citas a `openspec/config.yaml` no se movieron: las
decisiones nuevas del rango se añadieron al final de su bloque o del fichero, y aquí se nombran por su
clave. Las de `ae5aaf4`, `3f9d23b`, `c2b2888`, `ca56c62` y `e3d5e90` llevan la revisión escrita.

Las cifras de build, typecheck y pruebas, y el sha256 del bundle, son de una ejecución local del 2026-10-01
sobre `e8840e7`.

Todo lo que no se pudo comprobar lleva «hipótesis» o dice «no está medido»: el recuento de SR de S-6 (R14),
el recuento de «Equipo nuevo» de R3, cuántas OV caen en cuarentena (R11), los literales de Books (R12), el
tamaño de lo que se marca en silencio el día del Deploy (§6.1.4), el volumen de la ráfaga tras una reversión
larga (§4.5), si hay alguien con el cargo de firma `Coordinador Comercial` (§6.1.3), cuántas liberaciones sin
factura caen en el hueco de S-1 (R24), si hace falta recargar para ver el botón tras asignar un cargo (R31),
el estado del canal de correo y de `AVISOS_COPIA_EMAIL` en producción, la versión del worker, la construcción
de la imagen de `e8840e7`, el comportamiento de los commits intermedios (§7), la forma de `books.sales_orders`
en producción, la zona horaria del contenedor, los procedimientos de copia y de restauración, el efecto de
una pasada lenta de alarmas sobre la sincronización, y la igualdad de bytes entre la construcción de Windows
y la de Alpine.
