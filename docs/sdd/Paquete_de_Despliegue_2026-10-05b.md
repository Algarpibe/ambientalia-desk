# Paquete de despliegue — 2026-10-05 (b), consolidado

Material para la persona que publica Desk 2.0 en producción. **Este documento no publica nada**: lo escribe una
sesión que no despliega. La publicación es una acción manual: el CI **no despliega**, sólo verifica
(`DEPLOY.md:270-271`).

**Este paquete SUSTITUYE, para publicar, a dos documentos que NO se editan:** el del 2026-10-04 (b)
(`docs/sdd/Paquete_de_Despliegue_2026-10-04b.md`, medido sobre `f619d04`) y el incremental del 2026-10-05
(`docs/sdd/Paquete_de_Despliegue_2026-10-05.md`, `f619d04..64a3797` más su adenda hasta `df52eab`). Los dos son
registros fechados. Éste es **autosuficiente en lo que decide el corte**: las condiciones de parada (§0), el esquema
entero por orden de aplicación (§2), las variables nuevas con su valor inicial (§3) y todas las tareas de persona por
dueño y en orden (§6) están aquí completas. Lo que remite a un paquete anterior es sólo **detalle largo que no
cambia** —el paso a paso de una verificación en la aplicación, una tabla de riesgos antigua—, siempre con ruta y
línea.

Cada dato se contrastó en esta sesión contra el árbol de `36dc352`. Lo que no se pudo contrastar desde el
repositorio lleva la palabra **hipótesis** y está numerado en §9.

| Dato | Valor |
|---|---|
| Repositorio | `C:\dev\Desk_2_R1.023`, rama `main` |
| Se publica hasta | **`36dc352`** (fusión de E-233). Está en `origin/main`, con CI en verde (run `37406083680`). Lo que entre en `main` después de `36dc352` y sea sólo documentación no cambia este paquete |
| Base que consta en producción | `ae5aaf4` — **hipótesis 1** (§9): ningún commit registra un despliegue posterior y se comprueba con el bundle (§4.4) |
| Rango medido | **`ae5aaf4..36dc352`**: **585** commits (`git rev-list --count`), **176** de ellos tocan `apps/` o `packages/` |
| `git diff --shortstat ae5aaf4 36dc352` | 777 files changed, 149035 insertions(+), 2055 deletions(-) |
| Código (`-- apps packages`) | **320 ficheros, +33.416/−1.016**; desde `f619d04`, **59 ficheros, +3.318/−69** |
| Fuera de `apps/`, `packages/`, `docs/` y `openspec/` desde `f619d04` | `CLAUDE.md`, `DEPLOY.md` (+108, apartados 10, 11 y 12) y **`Dockerfile` (+5: instala `postgresql-client`)** |
| Cliente desde `f619d04` | Tres ficheros: `apps/desk/src/api/client.ts`, `apps/desk/src/components/Configuracion.tsx` y `apps/desk/src/components/NovedadesPanel.tsx` (nuevo) |
| Bundle del cliente de `36dc352` | `index-DaET7MaV.js`, 395.917 bytes, sha256 `0a03b37b53d28ac74c364437abd2d0b0193eb50ceeb967e39dc17e4f48c33250` (§4.4) |
| Pruebas, tipos y lint | Ejecutados el 2026-10-05 sobre `36dc352`, con código de salida 0 los cuatro: `npm test` **3.440 en verde y 7 omitidas** (224 ficheros y 2 omitidos), `npm run typecheck` limpio, `npm run lint` 165 avisos y 0 errores, detector de citas (`--sha HEAD`) sin bloqueos |

**Las piezas desde `f619d04`, por orden de llegada a `main`** (cifras: `git diff --shortstat` de `apps` y `packages`
contra el primer padre de cada fusión):

| Pieza (`tanda`, `cierra`) | Fusión | Código | Esquema | Variables |
|---|---|---|---|---|
| `prueba-integracion-mezcla-jsonb` (E-206, `fuera-del-plan`) | `07cf400` | 1 fichero, +155: sólo una prueba | No | No (`TEST_DATABASE_URL` es de pruebas) |
| `migracion-tickets-abiertos` (**F1F-01**, `cierra: no`) | `498b0a6` | 10 ficheros, +1.072/−2: ruta de administración, en seco por defecto | No | No |
| `traspaso-y-trazas` (**F1B-05**, `cierra: no`) | `39609af` | 20 ficheros, +735/−40 | **Sí**: sentencias 58 a 61 | No |
| `audit-f1b` (**F1B-09**, `cierra: no`) | `64a3797` | 1 fichero, +2/−2: una prueba | No | No |
| `interruptor-migracion-tickets` (**F1F-01**, `cierra: no`) | `c156403` | 6 ficheros, +86/−14 | No | **`MIGRACION_TICKETS_HABILITADA`** |
| `respaldo-nocturno-y-previo` (**F1F-02**, `cierra: no`) | `38bc432` | 19 ficheros, +823/−12, y `Dockerfile` | No | **Nueve `RESPALDO_*`** |
| `lista-novedades-mantenible` (**F1B-04**, `cierra: no`) | `df52eab` | 9 ficheros, +449/−8 | No | No |
| E-233 (prueba de equipos) | `36dc352` | 1 fichero, +11/−6: sólo una prueba | No | No |

Lo anterior a `f619d04` —F1A-03, F1C-09, F1C-10, F1B-15, `afa4252`, F1B-03 (dos cambios), F1C-11, F1B-04 (recepción),
F1F-05, F1B-07, F1B-08, F1C-05 y lo que ya traía el paquete del 2026-10-01— entra entero en este rango y en este
paquete.

---

## 0 · Condiciones de parada — leer antes que nada

**Si una de las seis primeras no está cumplida, no se pulsa Deploy sobre `36dc352`.** La séptima es una fecha.

### (a) Copia comprobada de la base `desk` — F1C-09 y `decision/p55-backup`

`decision/f1c09-copia-antes-de-desplegar` (`openspec/config.yaml:3659-3680`), respuesta textual
(`openspec/config.yaml:3665`):

> «No despliegues F1C-09 sin copia previa de la base.»

Antes de desplegar y de ejecutar la migración de F1C-09 se hace una copia de `desk` **y se comprueba que existe**; es
tarea de Alfonso, dueño de `decision/p55-backup` (`openspec/config.yaml:3667-3670`). F1C-09 está dentro de `36dc352`.

**La primera copia es manual, aunque F1F-02 venga en este mismo código.** El respaldo automático de F1F-02 no está
en producción hasta que se publique `36dc352`, y aun publicado **nace apagado**: con `RESPALDO_HABILITADO` ausente no
copia nada y su ruta responde `403` (`apps/desk/server/respaldo/config.ts:31`,
`apps/desk/server/routes/respaldo.ts:21`). Encenderlo exige siete tareas de persona, una de ellas con coste (§6.2).
Así que la copia previa a ESTE despliegue se hace a mano. Procedimiento —**hipótesis**, no está en `DEPLOY.md` ni
verificado contra EasyPanel—:

```bash
# La cadena de conexión es la variable DATABASE_URL del servicio App: el NOMBRE, nunca su valor en un chat.
pg_dump --format=custom --file=desk_antes_de_36dc352.dump "$DATABASE_URL"
```

**Criterio de hecho: existe un fichero de copia con fecha de hoy, fuera del servidor, y su tamaño no es cero.**
Sobre `zoho-hub`: si el barrido está activo y borrando (condición d), decidir antes si se copia también el hub.

### (b) F1C-09 — despliegue y migración EN EL MISMO CORTE

F1C-09 retira «Marcar como pendiente» y las dos «Servicio externo» hacia `Por Facturar`
(`packages/shared/src/transitions.ts:206-207`, `packages/shared/src/transitions.ts:230-233`) y `Pendiente` pasa a
existir sólo en soporte remoto (`packages/shared/src/estados.ts:182`). Entre el Deploy y la migración, un ticket de
servicio en `Pendiente` se queda sin transiciones
(`openspec/changes/archive/2026-10-01-tres-transiciones-cifra-anclada/archive-report.md:66`).

Script: `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql`. Paso 1, sólo lectura, **antes** del Deploy
(`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:32-42`); paso 2, traslado, **tras** el Deploy
(`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:44-53`); recuento posterior, con el grupo 1 a 0
(`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:55`). No se ha ejecutado nunca contra PostgreSQL real
(`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:3-5`): la copia de (a) es la red. Sus avisos —predicado de
soporte remoto más amplio que el de la aplicación, grupo 2 sin mover, reversión que borra todas las filas marcador—
están en `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:100-113`, y el script no ha cambiado desde entonces.

### (c) E-158 y los dos recuentos de F1B-03 — sin ellos no se despliega

Desde la guarda de F1B-03, «Habilitar Servicio» no pasa sin una remisión de entrada vigente. Se llama en
`apps/desk/server/services/ticketService.ts:131`, está en `apps/desk/server/services/ticketService.ts:273-277` y
responde 422 con el texto de `packages/shared/src/remision.ts:131-135`. Alcanza a los tres orígenes de la transición
(`packages/shared/src/transitions.ts:178`) y a toda clasificación que pase por ella, «Equipo nuevo» incluido. **No
tiene interruptor**: publicar `36dc352` es publicarla.

Hacen falta, antes del Deploy:

1. **La respuesta de Gerencia a E-158** (`docs/sdd/ENTRADA.md:1782`): si la guarda alcanza a «Equipo nuevo». Lo
   construido aplica «sí, sin excepciones», **no decidido**. Si la respuesta es «no», hace falta código nuevo y
   **`36dc352` deja de ser el commit a publicar**. Hoy no hay respuesta registrada: `grep -n "E-158"
   openspec/config.yaml` no devuelve nada.
2. **Los dos recuentos ejecutados en producción**, de sólo lectura y ejecutables hoy (leen columnas que ya existen en
   `ae5aaf4`): `docs/sdd/Consulta_Recuento_Habilitables_sin_remision_2026-10-03.sql`
   (`docs/sdd/Consulta_Recuento_Habilitables_sin_remision_2026-10-03.sql:33-59`; su columna `sin_remision_vigente`
   son los tickets que quedarán bloqueados) y `docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql`
   (`docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql:29-77`).

Un ticket bloqueado tiene salida en la aplicación: el botón «Crear remisión» se ofrece en los tres orígenes
(`packages/shared/src/transitions.ts:163-165`; `apps/desk/src/lib/botonRemision.ts:31`), y el recorrido completo
—422, alta, «Habilitar Servicio»— está probado en el servidor
(`apps/desk/server/remisionCreadaSinSalida.test.ts:31-39`).

### (d) `afa4252` — mirar `SWEEP_ENABLED` y `SWEEP_DRY_RUN` antes de redesplegar el worker

`afa4252` añade los pagos de clientes, con su tabla hija, al barrido de Books
(`packages/zoho-sync/src/booksHub/sync.ts:190-192`). Sólo tiene efecto al redesplegar el worker `hub-sync`. El barrido
se programa si `SWEEP_ENABLED` vale `true` (`packages/zoho-sync/src/config.ts:118`, `apps/hub-sync/src/hub-sync.ts:68`)
y sólo borra si además `SWEEP_DRY_RUN` vale `false` (`packages/zoho-sync/src/config.ts:119`,
`packages/zoho-sync/src/sweep/sweep.ts:77`).

> **Si el barrido está activo y borrando, borra las filas de `books.customer_payments` y
> `books.customer_payment_invoices` que Zoho ya no tenga. Una reversión de código no las recupera.**

Lo acota: re-verificación por id en Zoho (`packages/zoho-sync/src/sweep/sweep.ts:65-75`), tope de huérfanos
(`packages/zoho-sync/src/sweep/sweep.ts:62-64`, topes en `packages/zoho-sync/src/config.ts:121-122`) y la tabla hija
primero (`packages/zoho-sync/src/sweep/sweep.ts:81-84`). Su valor en producción no es verificable desde aquí
(hipótesis 6).

### (e) F1B-07 y su `ALTER` — si la sentencia 53 no entra, se revierte ese servicio

La sentencia 53 (`packages/zoho-sync/src/db/schema.sql:710`) crea `tickets.prioridad_en_app_at`, y `upsertTicket` la
lee en el `SELECT` previo que hace por **cada** ticket antes de escribirlo
(`packages/zoho-sync/src/db/repo.ts:66-69`), junto a `ov_elegida_en_app_at` y `ov_zoho_avisada` (sentencias 12 y 13).
`migrate` es tolerante por sentencia: si una falla, escribe `migrate: sentencia omitida` y sigue
(`packages/zoho-sync/src/db/migrate.ts:29-35`). **El proceso arranca igual.** Después, cada ticket falla en
`upsertTicket` y sólo deja `persistTicket(<id>) falló:` en el log (`packages/zoho-sync/src/sync.ts:125-133`): **el
sincronizador de esa base queda roto entero y en silencio**.

Pasa en **las dos bases**: `tickets` existe en `desk` y en `zoho-hub`, no es tabla replicada (`DEPLOY.md:42`), y cada
proceso migra la suya —la App en `apps/desk/server/index.ts:27`, el worker en `apps/hub-sync/src/hubSync.ts:13`—.

**Condición:** justo tras el Deploy de la App, el bloque «Sincronizador» de §4.4 sobre `desk`; justo tras el
redespliegue del worker, el mismo bloque sobre `zoho-hub`. **Si falta una de las tres columnas, se revierte ese
servicio (§4.5)**: no se arregla esperando.

### (f) El interruptor de la migración de F1F-01: `MIGRACION_TICKETS_HABILITADA` ausente al publicar

`36dc352` trae la ruta `POST /api/admin/migrar-tickets-abiertos` (`apps/desk/server/routes/admin.ts:222`). La exige
de administrador —«superadministrador» es en ese fichero un alias de administrador
(`apps/desk/server/routes/admin.ts:17`, E-231)—, y desde `c156403` aplicar exige además
`MIGRACION_TICKETS_HABILITADA=true` (`packages/zoho-sync/src/config.ts:123`): sin ella, `aplicar=true` responde `403`
(`apps/desk/server/routes/admin.ts:250-255`).

**Condición: antes del Deploy, comprobar en el servicio App que `MIGRACION_TICKETS_HABILITADA` NO existe** (o no vale
`true`). Encendida al publicar, **cualquier administrador** puede pasar a gobierno de la aplicación todos los
tickets abiertos con una llamada, y volver al código anterior no lo deshace (`DEPLOY.md:350-353`). Se enciende sólo
el día del corte de F1F-01, que **no es este despliegue** (§6.2).

### (g) F1F-05 — en producción antes del viernes 13/11/2026

F1F-05 tiene que estar desplegada **antes del viernes 13/11/2026** para medir las cuatro semanas desde el 16/11
(`DEPLOY.md:270-271`; E-181, `docs/sdd/ENTRADA.md:1899`). Va en el mismo código que la guarda de F1B-03 y no puede
separarse (§7): **esa fecha queda atada a E-158**. Si E-158 no se responde a tiempo, la única salida es código nuevo,
otro commit y otro paquete.

### Avisos que no son de parada pero se leen antes

1. **`DB_SCHEMA` tiene que valer `desk` en los DOS servicios** (§3). De ella depende dónde aterrizan las
   `ALTER TABLE tickets` y `ALTER TABLE equipos` sin calificar; ausente vale `public`
   (`packages/zoho-sync/src/config.ts:87`). Su valor en producción es hipótesis 4.
2. **`public.users.cargo_permiso`: si la columna falta, nadie entra en la aplicación** (`apps/desk/server/auth/sessions.ts:17`,
   `apps/desk/server/auth/middleware.ts:18`). §4.4 lo comprueba.
3. **Desde el Deploy, quien sea de Comercial y no administrador no puede hacer la «Liberación sin factura»** hasta
   tener el cargo `Director Comercial` (`packages/shared/src/cargos.ts:32`, `packages/shared/src/cargos.ts:49`): hay
   que nombrar antes quién asigna y aceptar por escrito ese intervalo (§6.3).
4. **Orden del mismo día: primero los cargos de permiso, después el Top 5** (`packages/shared/src/cargos.ts:80-83`).
   Marcar un Top 5 escribe en el acto sobre los tickets abiertos del cliente
   (`apps/desk/server/routes/prioridad.ts:44`).
5. **La ráfaga de lo vencido de `alarmas-horas-habiles` sigue sin decisión** (`grep -c -i "r.faga"
   openspec/config.yaml` da 0). Sin respuesta se publica apagada (`apps/desk/server/services/alarmasSla.ts:61`,
   `apps/desk/server/services/alarmasSla.ts:102-104`); si Gerencia la quiere encendida, `36dc352` deja de servir.
6. **E-162 y E-170** son condiciones de publicación de F1C-11 y de F1B-04 (§6.3, §6.7, §6.8). La lista de novedades
   de E-170 (1) ya no sólo se corrige por SQL: desde `df52eab` la mantiene el Director Técnico desde Configuración
   (§1.2).

---

## 1 · Resumen para quien publica

**Veredicto: `36dc352` es DESPLEGABLE sólo cuando se cumplan las condiciones de §0.** Hoy **no** lo es: falta la
respuesta a E-158 y faltan los dos recuentos de F1B-03 (§0 c), y no se puede esquivar apagando nada.

### 1.1 · El corte, en orden

1. **Antes, sin desplegar nada:** los dos recuentos de F1B-03 y la respuesta a E-158; el paso 1 de F1C-09; las
   comprobaciones de variables —`SWEEP_*` en el worker, `MIGRACION_TICKETS_HABILITADA` ausente en la App,
   `DB_SCHEMA=desk` en los dos—; la decisión de la ráfaga; nombrar quién asigna los cargos; E-162 (b); E-170 (1) y
   (2); la consulta P-1 de F1F-05; los recuentos de F1A-03; y las lecturas de E-206 y de producción de §6.1.
2. **Copia manual de `desk` y comprobación de que existe** (§0 a).
3. **Deploy de la App**, y en los minutos siguientes §4.4 entero sobre `desk`, con el bloque «Sincronizador». Si
   falta una tabla o columna, se revierte (§4.5).
4. **En el mismo corte:** paso 2 de F1C-09 y su recuento; asignar los cargos de permiso (con «Especialista técnico»
   y «Director Técnico»); después, el Top 5.
5. **Redespliegue del worker `hub-sync`**, con `SWEEP_*` ya mirados, y justo después el bloque «Sincronizador» de
   §4.4 sobre `zoho-hub`.
6. **Después:** las verificaciones en la aplicación (§6), la siembra de F1A-03 cuando llegue el dato, la medición de
   F1F-05 desde el 16/11 y, cuando el proveedor esté elegido, el encendido del respaldo (§6.2).

**Lo que este corte NO hace:** encender `RESPALDO_HABILITADO`, encender `MIGRACION_TICKETS_HABILITADA` ni ejecutar
la migración de tickets abiertos de F1F-01. Las tres son tareas posteriores con su propio orden (§6.2).

### 1.2 · Lo que puede sorprender al equipo

Producción no tiene nada de esto. De las piezas hasta `f619d04`, la lista de diez cambios visibles de
`docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:398-418` (guarda de «Habilitar Servicio», formulario de recepción,
«Derivado a», octavo cargo, CSV de indicadores, caso sin salida, Top 5 que propaga, vista «Equipos en Remisión
creada», caja de búsqueda, liberación sin factura con motivo y fecha) y la de cinco de
`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:200-210`. Nuevo desde `f619d04`:

11. **El historial del ticket enseña una línea «Traspaso: origen → destino»** antes de cada transición con destino
    resoluble (`apps/desk/server/db/traspaso.ts:43`, `apps/desk/server/db/historial.ts:143`), y una remisión
    restaurada enseña la anulación previa y la restauración (F1B-05).
12. **Configuración gana «Lista de novedades de entrada».** Con área Servicio Técnico y cargo Director Técnico, o
    siendo administrador, se da de alta, se cambia y se retira una novedad; nada se borra
    (`packages/shared/src/mantenimientoNovedades.ts:15-18`, `apps/desk/server/routes/novedades.ts:26-48`). Los demás
    ven la entrada pero no los controles (F1B-04).
13. **Nada visible por F1F-01 ni por F1F-02**: las dos son rutas de administración apagadas o en seco.

---

## 2 · Esquema, por orden de aplicación

### 2.1 · Cómo y dónde se aplica

- **App, base `desk`:** al arrancar, `reorgToDesk` si `DB_SCHEMA=desk` y después `migrate`
  (`apps/desk/server/index.ts:26-27`). `migrate` lee `packages/zoho-sync/src/db/schema.sql`, lo trocea por `;` a
  ciegas (`packages/zoho-sync/src/db/migrate.ts:19-21`) y ejecuta cada trozo **en el orden del fichero**, tolerando
  fallos (`packages/zoho-sync/src/db/migrate.ts:29-35`).
- **Worker, base `zoho-hub`:** `hub-sync.ts` llama a `hubBootstrap` (`apps/hub-sync/src/hub-sync.ts:48`), que ejecuta
  **el mismo** `migrate` en su primera línea (`apps/hub-sync/src/hubSync.ts:13`) y, si Books y CRM están
  configurados, `migrateBooks` (`apps/hub-sync/src/hubSync.ts:24`) y `migrateCrm` (`apps/hub-sync/src/hubSync.ts:80`).
  Sólo después programa sus ciclos (`apps/hub-sync/src/hub-sync.ts:49`). **Las 61 sentencias de §2.2 corren también
  en `zoho-hub`.** *Corrección:* el incremental del 2026-10-05 afirmaba que el worker no llama a `migrate`
  (`docs/sdd/Paquete_de_Despliegue_2026-10-05.md:106-108`); miró sólo `hub-sync.ts`, y `migrate` está en `hubSync.ts`.
- **El orden lo pone cada proceso, no una persona:** migración antes que sincronizador. Lo que sí es tarea de persona
  es **comprobar que entró** (§4.4), porque un fallo no tumba el arranque.
- **Ninguna sentencia toca las cuatro tablas replicadas** (`desk.activities`, `books.contacts`, `books.sales_orders`,
  `books.items`, `DEPLOY.md:42`), así que la regla «DDL primero en el suscriptor» de `DEPLOY.md:50-51` no aplica.

### 2.2 · `packages/zoho-sync/src/db/schema.sql` — 61 sentencias nuevas, todas al final, en este orden

`git diff ae5aaf4 36dc352 -- packages/zoho-sync/src/db/schema.sql` es **un solo bloque** (`@@ -446,3 +446,279 @@`):
276 líneas añadidas, ninguna borrada, de la 449 a la 724. De ellas, **61 caracteres `;`**, uno por sentencia y
ninguno en comentarios (contado por guion: cada sentencia termina en la línea de su `;`).

**Sin calificar a propósito** quiere decir: `tickets` y `equipos` son de `DESK_TABLES`
(`packages/zoho-sync/src/db/migrate.ts:63-64`) y aterrizan donde diga el `search_path`, que con `DB_SCHEMA=desk` es
`desk,public` (`packages/zoho-sync/src/db/pool.ts:5`). Todas las demás van calificadas con `public`.

| # | Sentencia | Líneas | Cambio que la trae | Calificada |
|---|---|---|---|---|
| 1 | `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS history_synced_at timestamptz` | 453 | historia de Zoho del worker (`b7c1ba8`) | No, a propósito |
| 2–7 | `ALTER TABLE equipos ADD COLUMN IF NOT EXISTS` `fecha_adquisicion`, `fecha_factura_compra`, `fin_garantia` (date), `codigo_interno`, `mantenedor_id`, `drive_url` (text) | 466–471 | `hojas-vida` (F1B-02) | No, a propósito |
| 8 | `CREATE TABLE IF NOT EXISTS public.calendario_cierres` | 478–483 | calendario laboral (F1B-12) | Sí |
| 9 | `CREATE TABLE IF NOT EXISTS public.equipos_cambios` | 496–505 | `edicion-comercial-equipo` (F1B-14) | Sí |
| 10 | `CREATE INDEX IF NOT EXISTS idx_equipos_cambios_equipo` | 506 | ídem | Sí |
| 11 | `ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS hay_novedad boolean` | 509 | foto con novedad (F1B-04) | Sí |
| 12 | `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ov_elegida_en_app_at timestamptz` | 524 | `parche-iv11-orden-venta` (F1B-11) | No, a propósito |
| 13 | `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ov_zoho_avisada text` | 525 | ídem | No, a propósito |
| 14 | `CREATE TABLE IF NOT EXISTS public.ov_asociaciones` | 539–551 | `asociacion-ov-ticket` (F1B-11) | Sí |
| 15–17 | `CREATE UNIQUE INDEX` `idx_ov_asoc_numero_vigente`, `idx_ov_asoc_so_vigente`; `CREATE INDEX idx_ov_asoc_ticket` | 552–554 | ídem | Sí |
| 18 | `CREATE TABLE IF NOT EXISTS public.contratos` (con `CHECK contratos_fin_no_antes_de_inicio`) | 561–571 | `registro-contrato` (F1B-11) | Sí |
| 19–20 | `CREATE UNIQUE INDEX idx_contratos_lote`; `CREATE INDEX idx_contratos_cliente` | 572–573 | ídem | Sí |
| 21 | `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS modalidad text` | 576 | `blueprint-soporte-remoto` (F1B-06) | No, a propósito |
| 22 | `CREATE TABLE IF NOT EXISTS public.alarmas_avisadas` | 582–589 | `alarmas-horas-habiles` | Sí |
| 23 | `CREATE TABLE IF NOT EXISTS public.alarmas_corte` | 593–596 | ídem | Sí |
| 24 | `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cargo_permiso text` | 601 | `permisos-por-cargo` (F1C-05) | Sí |
| 25 | `CREATE TABLE IF NOT EXISTS public.cliente_prioridad` | 606–612 | `prioridad-top5-cliente` (F1B-07) | Sí |
| 26 | `CREATE TABLE IF NOT EXISTS public.prioridad_ajustes` (con `CHECK prioridad_ajustes_motivo`) | 613–621 | ídem | Sí |
| 27 | `CREATE INDEX IF NOT EXISTS idx_prioridad_ajustes_ticket` | 622 | ídem | Sí |
| 28 | `ALTER TABLE equipos ADD COLUMN IF NOT EXISTS compuesto text` | 628 | `verificacion-gas-patron-certificado` (F1A-03) | No, a propósito |
| 29 | `ALTER TABLE public.catalogo_modelos ADD COLUMN IF NOT EXISTS compuesto text` | 629 | ídem | Sí |
| 30 | `CREATE TABLE IF NOT EXISTS public.gases_patron` | 632–640 | ídem | Sí |
| 31 | `CREATE UNIQUE INDEX IF NOT EXISTS idx_gases_patron_cilindro` | 641 | ídem | Sí |
| 32 | `CREATE TABLE IF NOT EXISTS public.certificados_fabrica` | 644–653 | ídem | Sí |
| 33 | `CREATE INDEX IF NOT EXISTS idx_certificados_fabrica_ticket` | 654 | ídem | Sí |
| 34 | `CREATE TABLE IF NOT EXISTS public.clientes_provisionales` | 658–673 | `alta-manual-equipo-cliente` (F1B-15) | Sí |
| 35 | `ALTER TABLE equipos ADD COLUMN IF NOT EXISTS pendiente_validar boolean` | 676 | ídem | No, a propósito |
| 36 | `CREATE TABLE IF NOT EXISTS public.catalogo_novedades` | 682–689 | `recepcion-rotulacion-foto-entrada` (F1B-04) | Sí |
| 37–46 | Diez `INSERT INTO public.catalogo_novedades … ON CONFLICT (clave) DO NOTHING` | 690–699 | ídem | Sí |
| 47–50 | `ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS` `novedades` (jsonb), `novedad_otro` (text), `rotulado_at` (timestamptz), `rotulado_por` (text) | 702–705 | ídem | Sí |
| 51–52 | `ALTER TABLE public.remision_fotos ADD COLUMN IF NOT EXISTS` `categoria`, `novedad` (text) | 706–707 | ídem | Sí |
| **53** | `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS prioridad_en_app_at timestamptz` | 710 | `propagar-top5-lista-remision-creada` (F1B-07) | No, a propósito |
| 54 | `ALTER TABLE public.prioridad_ajustes ADD COLUMN IF NOT EXISTS origen text` | 713 | ídem | Sí |
| 55 | `ALTER TABLE public.prioridad_ajustes ALTER COLUMN a DROP NOT NULL` | 714 | ídem | Sí |
| 56 | `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS liberacion_motivo text` | 717 | `liberacion-sin-factura-motivo-fecha` (F1C-05) | No, a propósito |
| 57 | `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS fecha_prevista_facturacion date` | 718 | ídem | No, a propósito |
| 58–61 | `ALTER TABLE public.remisiones ADD COLUMN IF NOT EXISTS` `restaurada_at` (timestamptz), `restaurada_por` (text), `anulacion_previa_at` (timestamptz), `anulacion_previa_por` (text) | 721–724 | `traspaso-y-trazas` (F1B-05) | Sí |

**Totales del rango:** doce tablas nuevas, **29 columnas nuevas** sobre tablas existentes —todas anulables, sin
`DEFAULT` y sin relleno—, nueve índices sobre tablas nuevas, dos `CHECK` en tablas nuevas, **un `NOT NULL`
retirado** (sentencia 55) y diez filas sembradas. Nada se borra ni se renombra.

**Idempotencia:** 60 de 61 llevan `IF NOT EXISTS` u `ON CONFLICT DO NOTHING`. La 55 no lleva `IF`; que repetirla no
dé error en PostgreSQL es **hipótesis 9**. La siembra no restaura una etiqueta editada, pero **sí reinserta una fila
borrada** en cada arranque (`packages/zoho-sync/src/db/schema.sql:677-681`): una novedad se retira con
`activo = false`, nunca borrando.

### 2.3 · Esquemas que sólo aplica el worker, en `zoho-hub`

| Orden | Fichero | Sentencia | Cuándo corre |
|---|---|---|---|
| tras las 61 | `packages/zoho-sync/src/booksHub/schema-books.sql` | `CREATE TABLE IF NOT EXISTS books.retainer_invoices` (`a233e1d`) | Si Books está configurado (`apps/hub-sync/src/hubSync.ts:23-24`) |
| después | `packages/zoho-sync/src/crmHub/schema-crm.sql` | `ALTER TABLE crm.deals ADD COLUMN IF NOT EXISTS stage_detail_synced_at timestamptz` (`3fc4768`; ya no se usa, no se borra) y `… stage_history_synced_at timestamptz` (`030efa7`) | Si CRM está configurado (`apps/hub-sync/src/hubSync.ts:80`) |

Las tres son idempotentes, van calificadas y no tocan tablas replicadas.

### 2.4 · Qué se rompe si una sentencia se omite (las que rompen algo visible)

Leído en el código de `36dc352`, **no ejecutado** (hipótesis 10).

| Si falta… | Se rompe | Por qué |
|---|---|---|
| 24 `users.cargo_permiso` | **Nadie entra en la aplicación** | La sesión se lee con esa columna en cada petición (`apps/desk/server/auth/sessions.ts:17`) |
| 12, 13 o **53** en `tickets` | **El sincronizador de esa base, entero y en silencio**; en `desk`, además, guardar un Top 5 | `packages/zoho-sync/src/db/repo.ts:66-69`, `packages/zoho-sync/src/sync.ts:125-133`, `apps/desk/server/db/prioridadCliente.ts:118` |
| 35 o 28 en `equipos` | Leer cualquier equipo por su id: alta de ticket con equipo, «Habilitar Servicio», hoja de vida | `apps/desk/server/db/equipos.ts:78`, `apps/desk/server/db/equipos.ts:164-167` |
| 30 `public.gases_patron` | Toda «Liberación» de un ticket con equipo | `apps/desk/server/db/gasesPatron.ts:17` |
| 47 a 50 en `public.remisiones` | **Toda alta de remisión**, también la de legado | El `INSERT` de `createRemision` las nombra todas (`apps/desk/server/db/remisiones.ts:47`) |
| 36, 51 o 52 | La lista del formulario, la subida de fotos y **todo envío** de remisión | `apps/desk/server/db/novedades.ts:13`, `apps/desk/server/routes/remision.ts:289` |
| 54 `prioridad_ajustes.origen` | Guardar la prioridad de cualquier cliente y leer la de un ticket | `apps/desk/server/db/prioridadCliente.ts:80`, `apps/desk/server/db/prioridadCliente.ts:111` |
| 56 o 57 | **Toda «Liberación sin factura»** | Las dos claves van a columna (`packages/zoho-sync/src/db/rows.ts:131`) |
| 58 a 61 | Restaurar una remisión y leer el historial | `apps/desk/server/db/remisiones.ts:152`, `apps/desk/server/db/historial.ts:151` |
| 21 `tickets.modalidad` | Crear tickets desde la aplicación | El `INSERT` del alta nombra la columna (`packages/zoho-sync/src/db/repo.ts:420`) |

El detalle de las demás está en `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:509-518`,
`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:261-270` y `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:250-290`.

### 2.5 · Ficheros SQL que ejecuta una persona (no corren al desplegar)

`docs` no entra en la imagen (`Dockerfile:16-21`). Nueve ficheros en el rango:

| Fichero | Quién y cuándo | ¿Escribe? |
|---|---|---|
| `docs/sdd/Consulta_Recuento_Habilitables_sin_remision_2026-10-03.sql` | Gerencia, **antes** (§0 c) | No |
| `docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql` | Gerencia, **antes** (§0 c) | No |
| `docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql` | Alfonso, en el corte (§0 b) | **Sí** |
| `docs/sdd/Siembra_Compuestos_y_Gases_Patron_2026-10-01.sql` | Alfonso, con el dato del Director Técnico (§6.1) | **Sí** |
| `docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql` | La persona con acceso a producción, el día del corte de F1F-01, **no en éste** (§6.2) | Lo que escribe es la ruta; el fichero trae la reversión comentada |
| `docs/sdd/Consultas_Recuentos_2026-09-25.sql`, `docs/sdd/Consulta_SubOV_formato_2026-09-27.sql` | Alfonso, antes (§6.1) | No |
| `docs/sdd/Alta_Cierres_Fin_de_Año_2026.sql` | Alfonso, antes del 24/12 (§6.1) | **Sí** |

---

## 3 · Variables de entorno

**Diez variables nuevas en el rango, y ninguna se pone a `true` al publicar.** Comprobado comparando los nombres que
el código lee en `ae5aaf4` y en `36dc352` (`git grep` de `env.NOMBRE` sobre `apps` y `packages`, sin pruebas): salen
nuevas `MIGRACION_TICKETS_HABILITADA` y las nueve `RESPALDO_*`; `DATABASE_URL` aparece sólo porque ahora la lee
también el respaldo. `packages/zoho-sync/src/config.ts` sólo gana una línea en todo el rango
(`packages/zoho-sync/src/config.ts:123`).

| Variable | Servicio | Valor inicial al publicar | Lee | Documentada |
|---|---|---|---|---|
| `MIGRACION_TICKETS_HABILITADA` | App | **Ausente** (apagada). `=== 'true'`; cualquier otro valor la deja cerrada. Se pone a `true` sólo el día del corte de F1F-01 y se quita al terminar | `packages/zoho-sync/src/config.ts:123` | `DEPLOY.md:345-361` |
| `RESPALDO_HABILITADO` | App | **Ausente** (apagado). `=== 'true'`. Se enciende tras las tareas de §6.2 | `apps/desk/server/respaldo/config.ts:31` | `DEPLOY.md:370-374` |
| `RESPALDO_HORA` | App | `3` por defecto (hora del contenedor) | `apps/desk/server/respaldo/config.ts:32` | `DEPLOY.md:378` |
| `RESPALDO_S3_ENDPOINT`, `RESPALDO_S3_REGION`, `RESPALDO_S3_BUCKET` | App | Vacías hasta elegir proveedor | `apps/desk/server/respaldo/config.ts:33-35` | `DEPLOY.md:379-381` |
| `RESPALDO_S3_ACCESS_KEY_ID`, `RESPALDO_S3_SECRET_ACCESS_KEY` | App | Vacías; **sólo en el gestor de secretos**, credenciales propias del respaldo | `apps/desk/server/respaldo/config.ts:36-37` | `DEPLOY.md:382` |
| `RESPALDO_CLAVE_CIFRADO` | App | Vacía; 32 bytes en base64, en el gestor **y además fuera de él** | `apps/desk/server/respaldo/config.ts:38` | `DEPLOY.md:383` |
| `RESPALDO_AVISO_EMAIL` | App | Vacía; el correo del responsable | `apps/desk/server/respaldo/config.ts:39` | `DEPLOY.md:384` |
| `DB_SCHEMA` (**no es nueva**) | App **y** worker | **`desk`** en los dos, con el mismo valor. Ausente vale `public` | `packages/zoho-sync/src/config.ts:87` | `DEPLOY.md:310-343` desde `f0cc676` |

*Corrección:* la adenda del 2026-10-05 habla de «las diez de `DEPLOY.md` §12»
(`docs/sdd/Paquete_de_Despliegue_2026-10-05.md:262`); el apartado 12 trae **nueve** líneas `RESPALDO_*`
(`DEPLOY.md:390-398`). Las diez nuevas son ésas nueve más `MIGRACION_TICKETS_HABILITADA`.

**El fichero de ejemplo de entorno.** Ninguna sesión lo lee (`DEPLOY.md:335-336`). Las líneas que hay que añadirle a
mano están en `DEPLOY.md:339-343` (`DB_SCHEMA`), `DEPLOY.md:358-361` (`MIGRACION_TICKETS_HABILITADA`) y
`DEPLOY.md:388-399` (respaldo). Tarea de persona (§6.2). Que hoy no estén es **hipótesis 5**.

**Las que no son nuevas pero el corte obliga a mirar:** `SWEEP_ENABLED` y `SWEEP_DRY_RUN` en el worker (§0 d);
`N8N_AVISOS_WEBHOOK_URL`, que además lleva el aviso de fallo del respaldo (`DEPLOY.md:384`), y `AVISOS_COPIA_EMAIL`,
que recibe copia de todas las alarmas si tiene valor. Sus valores en producción son **hipótesis 6**.

---

## 4 · Procedimiento

### 4.1 · Copia

§0 (a). Manual para este corte.

### 4.2 · Publicar

`DEPLOY.md` cubre el mecanismo: App en `DEPLOY.md:177-180`, worker en `DEPLOY.md:186-205`.

- **Publicar `36dc352` entero**, no un commit intermedio (§7).
- **La imagen cambia**: `RUN apk add --no-cache postgresql-client` (`Dockerfile:34`). App y worker usan **la misma
  imagen** (`Dockerfile:27-29`), así que el worker también la estrena al redesplegarse. Que construya en EasyPanel es
  **hipótesis 7**.
- **Orden:** copia comprobada → paso 1 de F1C-09 → Deploy de la App → §4.4 sobre `desk` → paso 2 de F1C-09 y recuento
  → cargos → Top 5 → worker → bloque «Sincronizador» de §4.4 sobre `zoho-hub`.
- **App y worker no tienen que publicarse a la vez por el esquema:** cada uno migra su base y `tickets` no se replica.
  *Hipótesis 3:* que el worker escriba sólo en `zoho-hub` y la App sólo en `desk`, como dice `DEPLOY.md:33-36`.

### 4.3 · Comprobar que producción está en el commit publicado

1. Referencia local de `36dc352`, construida el 2026-10-05 dos veces, con la salida fuera del repositorio:
   **`index-DaET7MaV.js`, 395.917 bytes, sha256 `0a03b37b53d28ac74c364437abd2d0b0193eb50ceeb967e39dc17e4f48c33250`**,
   iguales las dos veces.
2. En producción, abrir `https://ambientalia-desk.ambientalia.cloud/`, ver qué `index-*.js` carga, descargarlo y
   calcular su sha256.
3. **Nombre y sha256 iguales ⇒ producción ≡ `36dc352` en el cliente.** Referencias anteriores: `index-DjybFcf5.js` es
   `f619d04` (`docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:39`); `index-DZ1geyGk.js`, `5f68822`
   (`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:357`).

*Límites:* construido en Windows con `vite build`, sin el `tsc -b` de `npm run build`; producción construye en
`node:22-alpine`. Que den los mismos bytes es **hipótesis 8**. Y el bundle sólo prueba el cliente.

### 4.4 · Que la migración entró — obligatorio, justo tras cada arranque

**No se ha ejecutado** (hipótesis 10). Sólo lectura.

**Bloque 1, base `desk`, tras el Deploy de la App:**

```sql
BEGIN READ ONLY;

SELECT to_regclass('public.calendario_cierres')     AS cierres,
       to_regclass('public.equipos_cambios')        AS cambios,
       to_regclass('public.ov_asociaciones')        AS asociaciones,
       to_regclass('public.contratos')              AS contratos,
       to_regclass('public.alarmas_avisadas')       AS alarmas_avisadas,
       to_regclass('public.alarmas_corte')          AS alarmas_corte,
       to_regclass('public.cliente_prioridad')      AS cliente_prioridad,
       to_regclass('public.prioridad_ajustes')      AS prioridad_ajustes,
       to_regclass('public.gases_patron')           AS gases_patron,
       to_regclass('public.certificados_fabrica')   AS certificados_fabrica,
       to_regclass('public.clientes_provisionales') AS clientes_provisionales,
       to_regclass('public.catalogo_novedades')     AS catalogo_novedades;
-- Deben salir los DOCE nombres, ninguno NULL.

SELECT table_schema, table_name, column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
 WHERE (table_schema, table_name, column_name) IN (
        ('desk','tickets','history_synced_at'),
        ('desk','tickets','ov_elegida_en_app_at'),  ('desk','tickets','ov_zoho_avisada'),
        ('desk','tickets','modalidad'),             ('desk','tickets','prioridad_en_app_at'),
        ('desk','tickets','liberacion_motivo'),     ('desk','tickets','fecha_prevista_facturacion'),
        ('desk','equipos','fecha_adquisicion'),     ('desk','equipos','fecha_factura_compra'),
        ('desk','equipos','fin_garantia'),          ('desk','equipos','codigo_interno'),
        ('desk','equipos','mantenedor_id'),         ('desk','equipos','drive_url'),
        ('desk','equipos','compuesto'),             ('desk','equipos','pendiente_validar'),
        ('public','catalogo_modelos','compuesto'),  ('public','users','cargo_permiso'),
        ('public','prioridad_ajustes','origen'),
        ('public','remisiones','hay_novedad'),
        ('public','remisiones','novedades'),        ('public','remisiones','novedad_otro'),
        ('public','remisiones','rotulado_at'),      ('public','remisiones','rotulado_por'),
        ('public','remision_fotos','categoria'),    ('public','remision_fotos','novedad'),
        ('public','remisiones','restaurada_at'),    ('public','remisiones','restaurada_por'),
        ('public','remisiones','anulacion_previa_at'), ('public','remisiones','anulacion_previa_por'))
 ORDER BY 1, 2, 3;
-- Deben salir 29 filas, todas con is_nullable = YES y column_default vacío.
-- Falta cargo_permiso: NADIE entra. Revertir ya.
-- Falta una de las tres de tickets del bloque 2: sincronizador roto. Revertir ya.
-- Falta una de public.remisiones o public.remision_fotos: no se crean, envían ni restauran remisiones. Revertir.
-- Falta liberacion_motivo o fecha_prevista_facturacion: ninguna «Liberación sin factura». Revertir.
-- Falta origen: no se guarda la prioridad de ningún cliente. Revertir.
-- Falta compuesto o pendiente_validar de equipos: no se lee ningún equipo. Revertir.

SELECT is_nullable FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'prioridad_ajustes' AND column_name = 'a';
-- Debe salir YES (sentencia 55).

SELECT count(*) AS indices FROM pg_indexes
 WHERE schemaname = 'public'
   AND indexname IN ('idx_equipos_cambios_equipo', 'idx_ov_asoc_numero_vigente', 'idx_ov_asoc_so_vigente',
                     'idx_ov_asoc_ticket', 'idx_contratos_lote', 'idx_contratos_cliente',
                     'idx_prioridad_ajustes_ticket', 'idx_gases_patron_cilindro', 'idx_certificados_fabrica_ticket');
-- Debe salir 9.

SELECT count(*) AS novedades, count(*) FILTER (WHERE activo) AS activas FROM public.catalogo_novedades;
-- Deben salir 10 y 10 justo tras el primer Deploy.

SELECT (SELECT count(*) FROM public.cliente_prioridad)                       AS filas_top5,
       (SELECT count(*) FROM public.users WHERE cargo_permiso IS NOT NULL)   AS usuarios_con_cargo,
       (SELECT count(*) FROM desk.tickets WHERE prioridad_en_app_at IS NOT NULL) AS tickets_prioridad_en_app,
       (SELECT count(*) FROM public.remisiones WHERE restaurada_at IS NOT NULL)  AS remisiones_restauradas;
-- Justo tras el Deploy, las cuatro a 0. Si filas_top5 no es 0, hay Top 5 marcados antes: volver a guardarlos (§6.5).

SELECT count(*) AS filas_corte, min(corte_at) AS corte FROM public.alarmas_corte;
-- 0 filas justo después; 1 tras la primera pasada (unos 3 minutos). Anotar el corte.

SELECT (SELECT count(*) FROM desk.tickets) AS tickets, (SELECT count(*) FROM desk.equipos) AS equipos;
-- Dato que pide F1B-08: anotar y devolver al panel.

ROLLBACK;
```

**Bloque 2, «Sincronizador» — DOS veces: en `desk` tras la App y en `zoho-hub` tras el worker.** No nombra el
esquema a propósito: en qué esquema vive `tickets` dentro de `zoho-hub` es hipótesis 3.

```sql
BEGIN READ ONLY;
SELECT current_database() AS base, table_schema, column_name, data_type, is_nullable
  FROM information_schema.columns
 WHERE table_name = 'tickets'
   AND column_name IN ('prioridad_en_app_at', 'ov_elegida_en_app_at', 'ov_zoho_avisada')
 ORDER BY table_schema, column_name;
-- TRES filas del mismo table_schema. Si falta una: ese sincronizador está roto. Revertir ESE servicio (§4.5).
-- Sin ninguna fila y con la tabla existente: comprobar el rol; information_schema sólo enseña lo que el rol ve.
ROLLBACK;
```

Si algo falta, buscar en el log del servicio `migrate: sentencia omitida`
(`packages/zoho-sync/src/db/migrate.ts:33`) y, para el bloque 2, `persistTicket(` seguido de `falló:`
(`packages/zoho-sync/src/sync.ts:132`). **Y que F1C-09 entró:** su recuento posterior, con el grupo 1 a 0 (§0 b).

### 4.5 · Reversión

**Volver atrás = redesplegar el commit anterior, por servicio.** Si producción estaba en `ae5aaf4`, es `ae5aaf4`. La
base no se toca: las 29 columnas nuevas son anulables y sin `DEFAULT`, las tablas nuevas no las nombra el código viejo
y el `NOT NULL` retirado es de una tabla que `ae5aaf4` no conoce. Si lo que falla es el bloque 2 sobre `zoho-hub`, se
revierte el worker, no la App.

**Lo que la reversión NO deshace:**

- Pagos borrados por el barrido (§0 d).
- La migración de F1C-09 ya ejecutada: tiene su propia reversión comentada
  (`docs/sdd/Migracion_Pendiente_a_En_Proceso_F1C-09.sql:57-65`).
- Las prioridades propagadas por el Top 5: tras revertir, el sincronizador vuelve a escribir la de Zoho sobre los
  tickets que no sean `managed_by_app`.
- Los tickets liberados por la vía nueva se quedan sin la casilla marcada.
- Si alguien llegó a aplicar la migración de F1F-01, los tickets siguen gobernados por la aplicación; su reversión es
  `docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql:58-95`, sólo probada sobre pg-mem.

El detalle de cada pieza: `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:797-849` y
`docs/sdd/Paquete_de_Despliegue_2026-10-05.md:180-192`.

**No son motivo de reversión:** el 422 de la guarda de F1B-03; los 422 del formulario de recepción, de la liberación
y de la búsqueda; el 403 de `/api/indicadores` a quien no es administrador; el 403 de la migración de F1F-01 y el del
respaldo mientras sus interruptores estén apagados; y un ticket que **baja** de prioridad al marcar su cliente Top 5
(E-190).

---

## 5 · Cambios de comportamiento y riesgos

**Hasta `f619d04`:** la tabla de comportamiento de `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:857-868`, la de
rutas de `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:902-911`, la de la regla 13 de
`docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:913-935` y los riesgos R39 a R51 de
`docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:956-1032`, con los R32 a R38 que arrastra. **Un riesgo cambia:**
R49 (e) —la mezcla de `custom_fields` sin probar contra PostgreSQL real— queda probado en el CI por `07cf400`
(`docs/sdd/ENTRADA.md:2031-2035`), salvo una fila con `null` de JSON, que se comprueba con una lectura (§6.1).

**Desde `f619d04`:**

| Pieza | Qué hace | Ruta:línea |
|---|---|---|
| F1F-01, herramienta | `POST /api/admin/migrar-tickets-abiertos`: en seco por defecto; con `aplicar=true` y el interruptor encendido, marca cada ticket abierto de Zoho como gobernado por la aplicación | `apps/desk/server/routes/admin.ts:222-231`, `apps/desk/server/db/migracionTicketsAbiertos.ts:86-87` |
| F1F-01, interruptor | `aplicar=true` responde 403 sin `MIGRACION_TICKETS_HABILITADA=true`; la pasada en seco sigue libre | `apps/desk/server/routes/admin.ts:250-255` |
| F1B-05 | Línea de traspaso en el historial; la restauración guarda quién y cuándo y copia la anulación que deshace; borrar un ticket anota quién liberó sus OV | `apps/desk/server/db/traspaso.ts:43`, `apps/desk/server/db/remisiones.ts:151-152`, `packages/zoho-sync/src/db/ovAsociaciones.ts:134` |
| F1F-02 | Con `RESPALDO_HABILITADO=true`: copia nocturna programada y `POST /api/admin/respaldo` para la previa (administrador). `pg_dump`, cifrado en el servidor, subida S3. La contraseña va por el entorno del hijo, no por los argumentos | `apps/desk/server/index.ts:96-98`, `apps/desk/server/routes/respaldo.ts:20-21`, `apps/desk/server/respaldo/dependencias.ts:34` |
| F1B-04, lista | Alta, cambio y retirada de novedades desde Configuración, con 404 → 403 → 422 → 409 | `apps/desk/server/routes/novedades.ts:26-48` |

**Riesgos nuevos:**

- **R52 · El respaldo apagado no avisa.** Con `RESPALDO_HABILITADO` ausente no hay copia y nadie recibe correo, porque
  un respaldo apagado no es un fallo (`DEPLOY.md:373-374`). Hasta completar §6.2, la red sigue siendo la copia manual.
- **R53 · La migración de F1F-01 la puede aplicar cualquier administrador** el tiempo que el interruptor esté
  encendido (E-231, `docs/sdd/ENTRADA.md:2167`). La mitigación es la disciplina de §0 (f) y §6.2: encender, aplicar y
  apagar en el mismo corte.
- **R54 · La versión de `pg_dump` de la imagen no está comprobada** frente a la del servidor; si es menor, cada copia
  falla y avisa por correo (`DEPLOY.md:413-416`). Hipótesis 11.
- **R55 · F1B-04: tres supuestos de la lista mantenible sin decidir** —área Servicio Técnico, el administrador también
  puede, «excluye a las demás» no se edita
  (`openspec/changes/archive/2026-10-05-lista-novedades-mantenible/archive-report.md:37`)—. No bloquean.

---

## 6 · Tareas de persona — por dueño y en orden de ejecución

Todas las tareas de persona de los cambios archivados del rango que no tienen resultado. **Archivar no las dio por
hechas** (regla del ciclo 1 de `CLAUDE.md`). Una tarea se nombra con su cambio, porque las P.n chocan. Donde el paso a
paso es largo y no ha cambiado, se remite a él con ruta y línea; la tarea, su dueño y su orden están aquí.

### 6.0 · La lista entera, en orden

| # | Cuándo | Dueño | Tarea (con su cambio) | Desbloquea |
|---|---|---|---|---|
| 1 | **Antes — PARADA** | Gerencia (con Servicio Técnico) | **Responder E-158** | Publicar (§0 c) |
| 2 | **Antes — PARADA** | Gerencia / Alfonso | **Los dos recuentos de F1B-03** en producción, y con ellos leer **E-185** | Publicar (§0 c) |
| 3 | **Antes — PARADA** | Quien administra el despliegue | **`MIGRACION_TICKETS_HABILITADA` ausente** en el servicio App | Publicar sin que nadie pueda aplicar la migración (§0 f) |
| 4 | **Antes** | Quien administra el despliegue | **`DB_SCHEMA=desk`** en App y worker | Que las `ALTER` sin calificar aterricen en `desk` |
| 5 | **Antes** | Alfonso (o quien administre EasyPanel) | **`SWEEP_ENABLED` y `SWEEP_DRY_RUN`** del worker | Saber si el worker borrará pagos (§0 d) |
| 6 | **Antes** | Alfonso | **Paso 1 de F1C-09** | La migración del corte |
| 7 | **Antes** | Gerencia | **P.3 de `alarmas-horas-habiles`** — la ráfaga. Sin respuesta, apagada | Si es «encender», `36dc352` no vale |
| 8 | **Antes** | Gerencia o administración | **Precondición de P.1 de `permisos-por-cargo`**: nombrar quién asigna, preparar la lista y aceptar por escrito el intervalo | Que el hueco de la liberación dure minutos |
| 9 | **Antes** | Administrador de la aplicación | **E-162 (b)**: el cargo de firma del Director Técnico escrito «Director Técnico» | Que la derivación de F1C-11 proponga a alguien |
| 10 | **Antes — PARADA de F1B-04** | Servicio Técnico | **E-170 (1)**: confirmar la lista de diez novedades | Lo que ve el técnico desde el primer minuto |
| 11 | **Antes — PARADA de F1B-04** | Quien administra n8n | **E-170 (2)**: la etiqueta lleva el código del ticket | Que «Rotulado y guardado» signifique algo |
| 12 | **Antes** | Alfonso | **P-1 de `continuidad-indicadores`** | Saber si la comparación tendrá valores de Zoho |
| 13 | **Antes** | Alfonso | **P.3 de `verificacion-gas-patron-certificado`** (recuentos) y avisar a Servicio Técnico y Calidad | Saber a cuántos alcanza el certificado obligatorio |
| 14 | **Antes** | Alfonso | P.1 de `blueprint-soporte-remoto`; P.1 de `alarmas-horas-habiles`; preparar el paso 6 de P.2 de `alarmas-horas-habiles`; P.1 y P.4 de F1B-11 (recomendado); mirar `AVISOS_COPIA_EMAIL` y `N8N_AVISOS_WEBHOOK_URL` (recomendado) | Lo que dice cada una |
| 15 | **Antes** | Quien tenga la consola de producción | **Lectura de E-206**: `jsonb_typeof(custom_fields)` | Cerrar E-206 |
| 16 | **Antes** (recomendado) | Director Comercial | Preparar la lista Top 5 fuera de la aplicación | Que marcarla sea teclear |
| 17 | **Antes** | Quien publica | Bundle de producción (§4.3) | Saber desde dónde se publica |
| 18 | **Antes — PARADA** | Alfonso | **Copia manual de `desk` y comprobar que existe** | El Deploy (§0 a) |
| 19 | **Corte** | Quien publica | **Deploy de la App y §4.4 entero sobre `desk`** | Seguir o revertir |
| 20 | **Corte** | Alfonso | **Paso 2 de F1C-09 y recuento posterior**; paso 6 de P.2 de `alarmas-horas-habiles` | Que ningún ticket quede sin botones |
| 21 | **Corte, lo primero tras 19 y 20** | Administrador de la aplicación | **P.1 de `permisos-por-cargo`**, empezando por el Director Comercial; con ella **E-162 (a)** («Especialista técnico» a Johny Luna) y el **«Director Técnico»** de quien mantenga la lista de novedades | Comercial recupera la liberación; la lista tiene quien la mantenga |
| 22 | **Corte, tras 21** | Director Comercial | **P.1 de `prioridad-top5-cliente`**; si `filas_top5` no era 0, volver a guardar esos clientes | El Top 5 propagado |
| 23 | **Corte** | Quien publica | **Redespliegue del worker** y bloque 2 de §4.4 sobre `zoho-hub` | Que el sincronizador del hub no esté roto |
| 24 | **Corte** | Quien publica | Devolver el tamaño de `desk.tickets` y `desk.equipos` | Dato de F1B-08 |
| 25 | **Después** | Alfonso / Servicio Técnico | Verificación en la aplicación de F1C-09 | Verificación de F1C-09 |
| 26 | **Después**, cuando llegue el dato | Alfonso, con el Director Técnico | **P.2 de `verificacion-gas-patron-certificado`** (siembra) | La guarda de Verificación |
| 27 | **Después, antes del 24/12** | Alfonso | `INSERT` de los cierres de fin de año (F1B-12) | Que las alarmas no cuenten esos días |
| 28 | **Después** | Comercial | P.7 y P.6 de `registro-contrato`; P.3 de `parche-iv11-orden-venta`; P.3 de `asociacion-ov-ticket`; P.2 de `permisos-por-cargo`; F1B-15 (cuatro); F1C-10; RQ-HV-12 y `hojas-vida` | Verificaciones de esas tandas |
| 29 | **Después** | Comercial | **Las siete de F1B-07** | Verificación de F1B-07 |
| 30 | **Después, en la primera liberación real** | Gerencia o quien opere con cargo Director Comercial | **Las cinco de F1C-05** | Verificación de F1C-05 |
| 31 | **Después** | Quien verifica en la aplicación | Caso sin salida de F1B-03; F1B-03 (Comercial); F1B-08 (seis escenarios) | Verificaciones de esas tandas |
| 32 | **Después** | Servicio Técnico y Calidad | **E-170 (3)** (nueve pasos); P.4 de `verificacion-gas-patron-certificado`; las arrastradas | Verificaciones de F1B-04 y F1A-03 |
| 33 | **Después** | Usuario Director Técnico de Servicio Técnico | **Lista de novedades desde Configuración**: alta, cambio y retirada; el formulario deja de ofrecer lo retirado | Verificación de `lista-novedades-mantenible` |
| 34 | **Después** | Quien publica | **F1B-05**: las cuatro columnas (§4.4), la línea de traspaso y anular y restaurar una remisión | Verificación de F1B-05 |
| 35 | **Después** | Administrador | P-4 de `continuidad-indicadores`; verificación de F1C-11 | Verificaciones |
| 36 | **Después**, con el proveedor elegido | Ver §6.2 | **Encendido del respaldo**, siete pasos en orden | La copia automática |
| 37 | **Después**, el día que fije Gerencia | Ver §6.2 | **Migración de tickets abiertos de F1F-01**, con su interruptor | La migración |
| 38 | **Desde el 16/11** | Gerencia, con Servicio Técnico y Comercial | **P-3 de `continuidad-indicadores`** | Dar los nueve indicadores por buenos |
| 39 | Sin orden | Gerencia | Las decisiones de §6.4 | Lo que dice cada una |

### 6.1 · Alfonso (Gerencia) y quien administra el despliegue

**Antes, en este orden: 2, 3, 4, 5, 6, 12, 13, 14, 15 y 18.** Paso a paso:

- **Los dos recuentos de F1B-03 (tarea 2).** Conectarse a `desk` como siempre —**sin pegar la cadena de conexión
  ni la contraseña en ningún chat, captura ni documento**—, ejecutar enteros los dos ficheros de §0 (c) y devolver: de
  la primera, el total de `sin_remision_vigente` y, aparte, las filas de «Equipo nuevo» y las de `Remisión creada`
  (esta última es E-185, `docs/sdd/ENTRADA.md:1921`, informativa); de la segunda, `llegaron` y
  `sin_remision_al_llegar` (`docs/sdd/Consulta_Recuento_Ingresado_sin_remision_2026-09-25.sql:68-75`).
- **Variables (tareas 3, 4 y 5).** En EasyPanel, pestaña de variables de cada servicio. **Mirar sólo si existen y
  qué valor tienen; no copiar ningún valor a ningún sitio.** Devolver: App — `MIGRACION_TICKETS_HABILITADA` «ausente»
  o «presente» (si está presente, **quitarla antes de publicar**), `DB_SCHEMA` «desk» o «otra cosa»; worker —
  `DB_SCHEMA`, y `SWEEP_*` como «activo y borrando», «activo en simulacro» o «apagado»
  (`docs/sdd/Paquete_de_Despliegue_2026-10-03.md:685-695`). Si `DB_SCHEMA` no vale `desk` en alguno, **no publicar**
  y consultar: `DEPLOY.md:324-329` dice qué se rompe.
- **F1C-09 (tareas 6 y 20):** `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:657-668`. Si una clasificación de la
  tercera consulta del paso 1 no se reconoce, parar y consultar.
- **P-1 de F1F-05 (tarea 12):** el bloque de `DEPLOY.md:276-298`; devolver si aparecen, y dónde, los nombres de los
  nueve indicadores y de la satisfacción.
- **P.3 de F1A-03 (tarea 13):** `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:680-683`.
- **Tarea 14:** `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1264-1408`.
- **E-206 (tarea 15):** en sólo lectura, `SELECT jsonb_typeof(custom_fields) AS forma, count(*) FROM desk.tickets
  GROUP BY 1;`. Se espera una sola fila, `object`; cualquier otra forma se devuelve con su recuento antes de decidir
  nada (`docs/sdd/ENTRADA.md:2037-2038`). No condiciona el despliegue.
- **Copia (tarea 18):** §0 (a).

**Después (tareas 25 a 27):** verificación de F1C-09 en `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:670-678`;
siembra en `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:697-718` —con la pregunta abierta de si puede correr en
parte, que decide Gerencia—; cierres en `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1550-1567`.

### 6.2 · Las dos tareas posteriores con interruptor: respaldo y migración de F1F-01

**Encendido del respaldo (F1F-02), siete pasos en este orden.** Ninguna sesión los hace; ninguna copia se ha lanzado
contra producción
(`openspec/changes/archive/2026-10-05-respaldo-nocturno-y-previo/archive-report.md:53-59`).

| Paso | Dueño | Qué |
|---|---|---|
| 1 | **El usuario / Gerencia** — **cuesta dinero** | Elegir el proveedor entre Backblaze B2, Cloudflare R2 y Amazon S3 (`decision/p55b-destino-copia`, `openspec/config.yaml:2616`) |
| 2 | La persona con acceso al proveedor | Crear el almacenamiento con bloqueo de borrado y las reglas por prefijo: `diaria/` 7 días, `semanal/` 28, `mensual/` 365; `previa/`, a decidir (`DEPLOY.md:401-404`) |
| 3 | La persona que publica | Guardar credenciales y `RESPALDO_CLAVE_CIFRADO` (`openssl rand -base64 32`) en el gestor de secretos, la clave **además fuera de él**, y añadir las líneas al fichero de ejemplo (`DEPLOY.md:388-399`) |
| 4 | La persona con acceso a producción | `SELECT version();` en el servidor frente a `pg_dump --version` en la imagen publicada: la de `pg_dump`, igual o mayor |
| 5 | La persona con acceso a producción | `RESPALDO_HABILITADO=true` y redesplegar la App |
| 6 | La persona con acceso a producción | Primera copia: con sesión de administrador, `fetch('/api/admin/respaldo', { method: 'POST' })` desde la consola del navegador; responde `202` y el objeto aparece bajo `previa/` (`DEPLOY.md:406-407`) |
| 7 | La persona con acceso a producción | Primera restauración en una base **aparte**, nunca sobre `desk` (`DEPLOY.md:409-411`) |

Desde entonces, la copia previa se lanza **antes de cada publicación** (paso 6), y sustituye a la copia manual de §0 (a).

**Migración de tickets abiertos (F1F-01), el día del corte que fije Gerencia — NO en este despliegue.**

| Paso | Dueño | Qué |
|---|---|---|
| 0 | Gerencia | Responder E-207 a E-212, que condicionan la ejecución, y fijar la fecha de corte |
| 1 | La persona con acceso a producción | Copia de la base antes de aplicar |
| 2 | La que Gerencia designe (E-208) | Sincronización completa y reciente justo antes |
| 3 | La persona con acceso a producción | Pasada en seco (sin `aplicar`), con un `corte` con desfase: `negativa` nula y `numeracion.arrastra` falso (`apps/desk/server/db/migracionTicketsAbiertos.ts:52-54`). Si no, no se aplica y se consulta. En un `+hh:mm` el signo se escribe `%2B` (`docs/sdd/Migracion_Tickets_Abiertos_F1F-01.sql:31`) |
| 4 | La persona con acceso a producción | Añadir al fichero de ejemplo la línea de `DEPLOY.md:358-361`; **encender** `MIGRACION_TICKETS_HABILITADA=true` y redesplegar |
| 5 | La persona con acceso a producción | Pasada con `aplicar=true`, con la aplicación en reposo |
| 6 | La persona con acceso a producción | **Apagar** la variable y redesplegar en cuanto termine |
| 7 | Gerencia (E-218) | Averiguación de la hoja de Google y cotejo una a una |

Fuentes: `openspec/changes/archive/2026-10-04-migracion-tickets-abiertos/archive-report.md:63-71` y
`openspec/changes/archive/2026-10-05-interruptor-migracion-tickets/archive-report.md:37-42`.

### 6.3 · Administrador de la aplicación

| Cuándo | Tarea | Paso a paso |
|---|---|---|
| **Antes** | **E-162 (b)** — el cargo de firma del Director Técnico | Pantalla de usuarios: leer el cargo de firma de esa persona; un texto distinto («Director de Servicio Técnico») no casa con la propuesta (`apps/desk/src/lib/personas.ts:74-79`) |
| **Antes** (con Gerencia) | Precondición de P.1 de `permisos-por-cargo` | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1410-1444` |
| **Corte, lo primero** | **P.1 de `permisos-por-cargo`**, empezando por el Director Comercial; **«Especialista técnico» a Johny Luna** (E-162 a); y **«Director Técnico»** a quien mantenga la lista de novedades, si no lo tiene | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1462-1496` (paso A). Son ocho cargos (`packages/shared/src/cargos.ts:12-15`). El de la lista exige además el área Servicio Técnico (`packages/shared/src/mantenimientoNovedades.ts:15-18`) |
| **Después** | P-4 de `continuidad-indicadores` y verificación de F1C-11 | `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:1123-1139` |

### 6.4 · Gerencia (decisiones)

| Cuándo | Decisión | Qué desbloquea | Dónde |
|---|---|---|---|
| **Antes — PARADA** | **E-158** | Publicar `36dc352` | `docs/sdd/ENTRADA.md:1782` |
| **Antes** | P.3 de `alarmas-horas-habiles` (ráfaga); precondición de P.1 de `permisos-por-cargo`; qué lectura de la siembra vale | Lo que dice cada una | `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:724-726` |
| **Antes del encendido** | **Proveedor del respaldo** (cuesta dinero) | §6.2 | `openspec/config.yaml:2616` |
| **Antes de la migración de F1F-01** | E-207 a E-212 y la fecha de corte; E-218 | §6.2 | `openspec/changes/archive/2026-10-04-migracion-tickets-abiertos/archive-report.md:61` |
| Sin orden | E-089, E-219, E-220, la corrección 26 del maestro y si se rellenan las restauraciones y liberaciones anteriores (F1B-05) | Alcance de F1B-05 | `openspec/changes/archive/2026-10-05-traspaso-y-trazas/archive-report.md:62` |
| Sin orden | Destino de E-222 y E-228; E-223; E-090; M11.6 en el maestro (E-230) (F1B-09) | Alcance de la épica 1B | `docs/sdd/Paquete_de_Despliegue_2026-10-05.md:221-225` |
| Sin orden | S-1 a S-3 de la lista mantenible (F1B-04) | Alcance | `openspec/changes/archive/2026-10-05-lista-novedades-mantenible/archive-report.md:37` |
| Sin orden | S-2 del respaldo: ¿copia previa automática al arrancar? | Alcance de F1F-02 | `openspec/changes/archive/2026-10-05-respaldo-nocturno-y-previo/archive-report.md:49` |
| Sin orden | E-160, E-163 a E-167, E-171 a E-180, E-157, E-184, E-188 a E-193, E-195 a E-199, E-201 a E-205 | Alcance de F1C-11, F1B-04, F1F-05, F1B-03, F1B-07, F1B-08 y F1C-05. **No bloquean** | `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:1095-1106` |
| Sin orden | P-1 de `tres-transiciones-cifra-anclada`; Q1/Q2 de `alta-manual-equipo-cliente`; E-154; E-155; los dos rellenos de F1B-11; E-086; E-090; P.4 de `alarmas-horas-habiles`; E-092; preguntas 3.b y 3.b.3 | Lo que dice cada una | `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:727-731` |
| **Desde el 16/11** | P-3 de `continuidad-indicadores` | Dar los indicadores por buenos | `docs/sdd/ENTRADA.md:1899` |

### 6.5 · Director Comercial

| Cuándo | Tarea | Paso a paso |
|---|---|---|
| **Antes** (recomendado) | Preparar la lista Top 5 | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1446-1453` |
| **Corte, tras los cargos** | Marcar el Top 5, **sabiendo que cada guardado cambia en el acto la prioridad de los tickets abiertos del cliente** | El panel dice «N tickets abiertos actualizados» |
| **Corte, sólo si `filas_top5` no era 0** | Volver a guardar cada cliente Top 5 marcado antes del Deploy | `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:1157-1162` |

### 6.6 · Comercial

| Cuándo | Tarea | Paso a paso |
|---|---|---|
| **Después, el mismo día** | P.7 de `registro-contrato` | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1533-1548` |
| **Después** | F1B-15 (cuatro comprobaciones) y F1C-10 | `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:767-791` |
| **Después** | F1B-03 (Comercial) | `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:1174-1183` |
| **Después** | Las siete de F1B-07 | `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:1197-1212` |
| **Después, en la primera liberación real** | Las cinco de F1C-05 (Gerencia o quien opere con cargo Director Comercial) | `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:1214-1251`. La tercera ya no es la prueba de E-206: ésta quedó probada en el CI (§5) |
| **Después** | P.3 de `parche-iv11-orden-venta`, P.3 de `asociacion-ov-ticket`, P.6 de `registro-contrato`, P.2 de `permisos-por-cargo`, P.2 de `prioridad-top5-cliente` (con Servicio Técnico), RQ-HV-12 y `hojas-vida` (con Gerencia) | `docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1569-1712` |

### 6.7 · Servicio Técnico y Calidad

| Cuándo | Tarea | Paso a paso |
|---|---|---|
| **Antes — PARADA de F1B-04** | **E-170 (1)**: confirmar la lista de diez (`packages/zoho-sync/src/db/schema.sql:690-699`). Si hay que cambiarla, desde `df52eab` se hace en Configuración tras el Deploy, sin SQL | — |
| **Antes** | Enterarse de los cambios visibles | §1.2 |
| **Después** | **E-170 (3)**, nueve pasos | `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:1267-1281` |
| **Después** | **Lista de novedades** (tarea 33), con un usuario Director Técnico: alta, cambio y retirada; el formulario de la remisión de entrada deja de ofrecer lo retirado; un usuario sin el cargo ve la entrada pero no los controles | — |
| **Después** | P.4 de `verificacion-gas-patron-certificado` y las arrastradas | `docs/sdd/Paquete_de_Despliegue_2026-10-03.md:793-813` |

### 6.8 · Quien administra n8n

**Antes — PARADA de F1B-04:** E-170 (2), la etiqueta lleva el código del ticket (`docs/sdd/ENTRADA.md:1842`).

### 6.9 · Quien publica

| Cuándo | Tarea | Paso a paso |
|---|---|---|
| **Antes** | Bundle de producción | §4.3 |
| **Corte** | Deploy de la App; §4.4 entero sobre `desk`; avisar a Alfonso para el paso 2 de F1C-09 | §4.2, §4.4 |
| **Corte** | Worker **sólo después** de mirar `SWEEP_*`; bloque 2 de §4.4 sobre `zoho-hub` | §0 (d), §0 (e) |
| **Corte** | Devolver el tamaño de `desk.tickets` y `desk.equipos` | §4.4 |
| **Después** | **F1B-05**: anular y restaurar una remisión de prueba (con el visto bueno de Servicio Técnico) y ver la línea de traspaso | `docs/sdd/Paquete_de_Despliegue_2026-10-05.md:145-167` |
| **Después** | Seis escenarios de F1B-08 y el caso sin salida de F1B-03 | `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:1185-1195`, `docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:1299-1311` |

### 6.10 · Sin dueño con nombre

Alta con serie nueva y con serie registrada, pestaña «EN ESPERA» y zona `America/Bogota` en el contenedor
(`docs/sdd/Paquete_de_Despliegue_2026-10-01.md:1664-1680`); la comprobación de Drive y n8n sobre los prefijos de
F1B-03 (`openspec/changes/archive/2026-10-03-tipo-servicio-ticket-sin-ov/archive-report.md:117`). Y, de la sesión de
construcción, repasar la auditoría de F1B-09 al cerrar la épica 1B.

---

## 7 · Lo que NO es desplegable, y por qué no se puede partir

**`36dc352` no es desplegable hoy**, por §0 (c). Cumplido §0, nada más lo impide:

| Condición | Resultado |
|---|---|
| Migración no idempotente | 60 de 61 con `IF NOT EXISTS` u `ON CONFLICT`; la 55, hipótesis 9 |
| Restricción nueva que rompa datos existentes | No: columnas anulables y sin `DEFAULT`; los `NOT NULL` y `CHECK` son de tablas nuevas; la única que se toca se relaja |
| Sentencia sin calificar en el esquema equivocado | No, si `DB_SCHEMA=desk` (§0, aviso 1) |
| Un interruptor de escritor sin documentar | No: las dos variables nuevas que encienden algo nacen cerradas y están en `DEPLOY.md` §11 y §12 |
| Trabajo a medias | No: `git diff f619d04 36dc352 -- apps packages` no añade `it.fails`, `.skip(`, `it.todo`, `FIXME` ni `XXX` |

**No se puede publicar una parte.** Una sola imagen para los dos servicios (`Dockerfile:27-29`); la guarda de F1B-03
se llama sin condición (`apps/desk/server/services/ticketService.ts:131`); y en `main` la fusión de F1B-03 (`a4bfc85`)
es la primera después de `5f68822`, así que **todo lo posterior va detrás de ella**: F1F-05, F1B-07, F1C-05, F1F-01,
F1B-05, F1F-02 y la lista de novedades incluidos. El único punto publicable sin esperar a E-158 sigue siendo
`5f68822`, con su paquete (`docs/sdd/Paquete_de_Despliegue_2026-10-03.md`), y no lleva F1F-05.

El worker sí: con `36dc352`, sólo espera a `SWEEP_*` (§0 d) y a la comprobación del bloque 2 (§0 e). No carga la
guarda de F1B-03.

---

## 8 · Nota de método

- **Las citas `ruta:línea` se leyeron contra `36dc352`**, una a una, con un guion que imprime el texto de cada
  extremo, y además pasaron por el detector de `pre-push` sobre el commit de este paquete. Las citas a los paquetes
  anteriores apuntan a su texto fechado, que no cambia.
- **El esquema se contó por guion** (sentencia = `;`, con su línea de inicio y fin), no a mano.
- **Las variables se compararon por nombre** entre `ae5aaf4` y `36dc352`, no por la cadena de paquetes: la cadena
  decía «ninguna nueva» hasta `f619d04` y lo confirma.
- **Lo que se cita de los informes y no se reprodujo:** veredictos, mutaciones y recuentos de escenarios de los
  cambios archivados. Lo que este paquete afirma del código se leyó en el código.
- **Dos afirmaciones del incremental del 2026-10-05 eran falsas y se corrigen aquí**, sin editar aquel documento: que
  el worker no migra (§2.1) y que las variables de `DEPLOY.md` §12 son diez (§3).

---

## 9 · Hipótesis de este paquete

Lo que no está en esta lista se leyó en el árbol de `36dc352`, con ruta y línea.

1. **Que producción siga en `ae5aaf4`.** Lo dice el bundle (§4.3), no el repositorio.
2. **Qué versión corre el worker** y cómo lo arranca EasyPanel (`APP_ENTRYPOINT`, `Dockerfile:27-29`, o el comando de
   `DEPLOY.md:188-190`).
3. **Que el worker escriba sólo en `zoho-hub` y la App sólo en `desk`** (`DEPLOY.md:33-36`), y en qué esquema vive
   `tickets` dentro de `zoho-hub`.
4. **El valor de `DB_SCHEMA` en los dos servicios.** Que la App tenga `desk` lo afirman `debt.md:824` y
   `docs/runbooks/verificaciones-pendientes-F0.md:9`, de segunda mano; para el worker, nadie.
5. **El contenido del fichero de ejemplo de entorno**: ninguna sesión lo lee.
6. **Los valores de `SWEEP_ENABLED`, `SWEEP_DRY_RUN`, `N8N_AVISOS_WEBHOOK_URL`, `AVISOS_COPIA_EMAIL` y
   `MIGRACION_TICKETS_HABILITADA` en producción.**
7. **Que la imagen de `36dc352` construya en EasyPanel**, con `postgresql-client` de Alpine.
8. **Que el bundle de Windows y el de `node:22-alpine` sean idénticos**, y que anteponer `tsc -b` no lo cambie.
9. **Que repetir `ALTER COLUMN a DROP NOT NULL` no dé error** en PostgreSQL.
10. **Que las 61 sentencias corran sin error contra la base de producción**, que las consultas de §4.4 devuelvan lo
    dicho con el rol con que se ejecuten, y las consecuencias de §2.4 de omitir cada una: leídas en el código, no
    ejecutadas.
11. **Que la versión de `pg_dump` de la imagen sea igual o mayor que la del servidor** (R54).
12. **El procedimiento de copia manual con `pg_dump`** de §0 (a).
13. **Que no haya Top 5 marcados en producción** y que el panel deje volver a guardar sin cambiar nada.
14. **Que no exista en producción ninguna fila con `custom_fields` igual al `null` de JSON** (E-206; tarea 15).
15. **Cuántos tickets bloqueará la guarda de F1B-03**, cuántos son de «Equipo nuevo» y si hay alguno en `Remisión
    creada` sin remisión vigente (E-185).
16. **Que la consulta P-1 de F1F-05, la etiqueta de n8n y el cargo de firma del Director Técnico** sean como se
    describen (§0, §6).
17. **Todo lo que «ve el usuario»** de §1.2 y de las verificaciones de §6: leído en el código; los `.tsx` están fuera
    de la red de pruebas por decisión de Gerencia.
18. **El comportamiento de los commits intermedios**: no se mide ninguno; sólo `36dc352`.
19. **Lo que los paquetes del 2026-10-01, 2026-10-03 y 2026-10-04 (b) dejaron sin comprobar y sigue igual**
    (`docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:1476-1566`), salvo lo que este paquete mide de nuevo: tipos,
    lint, pruebas, bundle, esquema y variables.
