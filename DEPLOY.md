# Despliegue en EasyPanel (VPS)

El backend Express sirve **a la vez** el frontend compilado (`dist/`) y la API `/api` en un
solo puerto, así que basta **un servicio de Aplicación** en EasyPanel, junto al servicio
Postgres.

Además de la App hay un **segundo servicio de este mismo repositorio**, el worker
`apps/hub-sync`, y una **segunda base de datos**, el hub. Ver §0.

```
                    [ zoho-hub-db ]  ◄── ingesta ──  [ hub-sync (este repo) ]  ◄── Zoho Desk/Books/CRM
                          │                                  worker, sin puerto
                          │ replicación lógica
                          │ zoho_ref_pub → zoho_ref_sub  (4 tablas)
                          ▼
[ App (este repo, Dockerfile) ]  ──red interna──►  [ Postgres (desk-db) ]
        puerto 3001  ▲
                     │ dominio EasyPanel
                  navegador
```

## 0. Topología: dos bases de datos y dos servicios de este repo

Hay **dos** servicios Postgres y **dos** procesos Node, todos del mismo repositorio:

| Servicio | Qué es | Arranque |
|---|---|---|
| `desk-db` | Base `desk`. La que lee y escribe la aplicación. **Suscriptor** de la replicación | Postgres de EasyPanel |
| `zoho-hub-db` | Base `zoho-hub`. Réplica rica de Zoho (Desk, Books, CRM). **Publicador** | Postgres de EasyPanel |
| App (`ambientalia-desk`) | Express + frontend compilado, puerto 3001 | `npm start` |
| Worker `hub-sync` | Ingesta desde Zoho hacia el hub. No expone puerto ni dominio | `npm run start:hub-sync` |

**Quién escribe cada base.** El worker `hub-sync` escribe **sólo** en `zoho-hub`
(`apps/hub-sync/src/hub-sync.ts`): tickets, actividades y contactos de Desk, más `books.*`
(artículos, órdenes de venta, facturas, pagos, órdenes de compra, facturas de anticipo) y `crm.*` cuando sus
credenciales y flags están puestos. La App escribe **sólo** en `desk`.

**Replicación lógica hub → desk.** La publicación `zoho_ref_pub` (en `zoho-hub`) y la suscripción
`zoho_ref_sub` (en `desk`) llevan **cuatro tablas**, verificadas en producción el 2026-08-10 con
`pg_subscription_rel` en estado `r` (`debt.md:298-301`):

    desk.activities · books.contacts · books.sales_orders · books.items

Dos consecuencias operativas:

- **La replicación lógica NO crea la tabla en el suscriptor**: sólo copia filas a una que ya exista,
  emparejando por nombre de columna. La definición en `packages/zoho-sync/src/db/schema.sql` debe ser
  idéntica a la del hub. Una columna que falte deja de llegar **en silencio**
  (`packages/zoho-sync/src/db/schema.sql:376-379`).
- **El orden de despliegue importa:** el DDL va **primero en el suscriptor (`desk`) y después en el
  hub**. Al revés, el apply del suscriptor se atasca.

**Pendiente de verificar en este documento:** el nombre exacto de los servicios de EasyPanel, sus
variables de entorno concretas y el procedimiento de alta del worker no se han confirmado contra la
consola de despliegue en esta revisión. Los pasos 1–6 de abajo describen sólo la App.

## 1. Base de datos (ya creada)
Servicio Postgres en EasyPanel. Copia su **connection string interno** (no expongas el puerto):
```
postgres://postgres:LA_PASSWORD@desk-db:5432/desk
```
(usa el hostname/credenciales exactos que muestra EasyPanel).

## 2. Subir el código a un repositorio Git
EasyPanel construye la App desde un repo Git. Este proyecto aún no tiene remoto, así que:
```bash
# crea un repo privado en GitHub/GitLab y luego:
git remote add origin git@github.com:TU_USUARIO/desk-ambientalia.git
git push -u origin main
```

## 3. Crear el servicio de Aplicación en EasyPanel
- **+ Servicio → Aplicación** (en el proyecto `ambientalia_project`).
- **Fuente:** el repo Git del paso 2, rama `main`.
- **Build:** Dockerfile (EasyPanel detecta el `Dockerfile` de la raíz automáticamente).
- **Puerto:** `3001` (lo que expone el contenedor). Asígnale un dominio en la pestaña Dominios.

## 4. Variables de entorno (pestaña Environment del servicio App)
NO subas `.env` al repo. Define estas variables en EasyPanel:
```
DATABASE_URL=postgres://postgres:LA_PASSWORD@desk-db:5432/desk
ZOHO_CLIENT_ID=...
ZOHO_CLIENT_SECRET=...
ZOHO_REFRESH_TOKEN=...
ZOHO_ORG_ID=713448415
ZOHO_DEPARTMENT_ID=495552000000006907
ZOHO_ACCOUNTS_DOMAIN=accounts.zoho.com
ZOHO_API_DOMAIN=desk.zoho.com
ENABLE_WRITES=false
PORT=3001
SYNC_INTERVAL_MS=180000
```

### 4.1 Interruptores de escritores locales: `SYNC_ACTIVITIES` y `SYNC_CONTACTS`

Los dos **nacen encendidos**: `packages/zoho-sync/src/config.ts:89-90` los lee como
`env.SYNC_CONTACTS !== 'false'` y `env.SYNC_ACTIVITIES !== 'false'`, así que **ausentes valen
`true`**. No están fijados aquí a propósito: cambiar su valor depende del diagnóstico de la
replicación, no de este documento.

**`SYNC_ACTIVITIES`**

- *Qué enciende:* el escritor local sobre la tabla `activities` de `desk`.
- *Qué rompe si se pone mal:* `desk.activities` es **además tabla suscriptora** de la replicación
  lógica `zoho_ref_sub` (§0). Dos escritores sobre una tabla suscriptora pueden **detener la
  suscripción entera en silencio**, y no sólo esa tabla: `upsertActivity`
  (`packages/zoho-sync/src/db/activities.ts:12`) usa `ON CONFLICT (id) DO UPDATE` y por eso nunca
  falla, pero el apply de la replicación hace un `INSERT` crudo y sí falla. El escritor local gana
  la carrera sin dar error y la réplica se para detrás.

**`SYNC_CONTACTS`**

- *Qué enciende:* el sync de contactos sobre `desk.contacts`.
- *Qué rompe si se pone mal:* **no hay conflicto con la replicación.** La tabla replicada es
  `books.contacts`, que es otra: `desk.contacts` no está en `zoho_ref_pub`. Y `upsertContact`
  (`packages/zoho-sync/src/db/repo.ts:20-21`) comprueba `managed_by_app` antes de escribir, así que
  no pisa los contactos creados desde la aplicación. Apagarlo sólo deja de refrescar `desk.contacts`
  desde Zoho.

### 4.2 El canal de correo de los avisos: cuatro variables

Las cuatro **nacen apagadas** —`config.ts:114-117` las lee con `|| ''`— y **el sistema funciona sin
ninguna**: la campana de la aplicación es la fuente de verdad y el correo va encima
(spec `derivacion-avisos`, RQ-AV-09). Apagadas, la campana sigue avisando exactamente igual; lo único
que no sale es el correo.

Se documentan aquí porque **F1A-02 es la primera tanda que las va a encender en producción**, y la
regla de secretos de `CLAUDE.md` trata un interruptor no documentado como defecto, no como
configuración.

**`N8N_AVISOS_WEBHOOK_URL`**

- *Qué enciende:* el disparo del correo. Es el webhook de n8n que recibe los avisos ya redactados
  —asunto y enlace se arman en el servidor, no en n8n (`avisosWebhook.ts:60-67`)— y los envía.
- *Qué rompe si se pone mal:* **una URL equivocada no rompe nada visible, y ése es el problema.**
  `dispararAvisos` nunca lanza (`avisosWebhook.ts:53-96`) y la transición ya está escrita cuando se
  llama, así que un fallo sólo deja un `logger.warn` y la columna `avisos.enviado_at` en `NULL`
  —que es la cola de reintento (`schema.sql:145`)—. Nadie recibe correo y nadie se entera. Si se
  apunta a un webhook ajeno, se le mandan a un tercero los asuntos, los números de ticket y los
  nombres de los destinatarios.

**`N8N_AVISOS_TOKEN`**

- *Qué enciende:* el valor de la cabecera `X-Avisos-Token` con la que el webhook autentica la
  llamada.
- *Qué rompe si se pone mal:* n8n rechaza los envíos y se cae en el mismo silencio del punto
  anterior: `enviado_at` en `NULL` y un aviso en el log. Es **secreto**: va en el gestor de secretos
  del despliegue, nunca en un chat ni en una captura. Si aparece en uno, está quemado y se rota.

**`APP_BASE_URL`**

- *Qué enciende:* el enlace del correo hacia el ticket.
- *Qué rompe si se pone mal:* vacía, el correo sale **sin enlace** y quien lo recibe tiene que buscar
  el ticket a mano. Mal puesta —el dominio de pruebas en producción, por ejemplo— es peor que vacía:
  el enlace lleva a otro sitio y parece que funciona.

**`AVISOS_COPIA_EMAIL`** — *muleta de pruebas, y la que más cuidado pide*

- *Qué enciende:* una dirección que recibe **copia de dos clases de aviso dirigidos a otras
  personas**: los de **derivación** (`ticketService.ts:181-183`) y, desde `alarmas-horas-habiles`
  (F1B-08), **todas las alarmas de SLA** (`alarmasSla.ts:118`); las dos marcan `conCopia`, que es lo
  que `avisosWebhook.ts:11-27` copia. Los avisos de área siguen sin copia. Existe para poder verificar
  que el canal de correo sale de verdad. **Vacía —lo normal— no copia nada**, y se apaga borrando la
  variable, sin tocar código.
- *Qué rompe si se pone mal:* es la única de las cuatro que **manda correo a alguien que no es el
  destinatario**. Dejarla puesta después de las pruebas convierte una dirección en receptora
  permanente de las derivaciones **y de cada alarma de SLA vencida** de todo el mundo —una por cada
  destinatario de la alarma—. No se copia a sí misma si el destinatario ya es esa dirección
  (`avisosWebhook.ts:71-75`), y su texto dice a quién iba dirigido el original, pero ninguna de las
  dos cosas la apaga: eso se hace borrándola.

> **Lo que este apartado NO cubre.** La regla de secretos pide `.env.example` **y** `DEPLOY.md`.
> `.env.example` queda fuera del alcance de lectura de esta sesión —lo mismo le ocurrió a F0-02 al
> escribir la spec `derivacion-avisos` §4.3—, así que **no se afirma nada sobre él**: no se ha
> comprobado si las cuatro variables están, y esa mitad de la regla sigue sin verificar.

## 5. Desplegar
- Pulsa **Deploy**. En el primer arranque el server corre `migrate` (crea las tablas) y,
  si la BD está vacía, lanza el **backfill** desde Zoho (verás los logs "iniciando backfill…").
- Abre el dominio: el tablero debe mostrar tickets reales.

## 6. Activar escrituras (cuando hayas validado lecturas)
Cambia `ENABLE_WRITES=true` en Environment y redeploy. Prueba un cambio de estado en un
ticket de prueba y verifica en Zoho Desk. (Mantenlo en `false` mientras tanto.)

## 7. El worker `hub-sync`

Segundo servicio de EasyPanel, del **mismo repositorio y el mismo Dockerfile**, con el comando de
arranque cambiado a `npm run start:hub-sync` (`package.json` → `"start:hub-sync"`). No expone puerto
ni necesita dominio.

Su `DATABASE_URL` apunta al **hub** (`zoho-hub`), no a `desk`. Comparte con la App las credenciales de
Zoho Desk y añade, si se quieren las réplicas ricas, las de Books (`ZOHO_BOOKS_REFRESH_TOKEN`,
`ZOHO_BOOKS_ORG_ID`) y las de CRM (`ZOHO_CRM_REFRESH_TOKEN`); sin ellas, esos bloques quedan apagados
solos y el worker lo dice en el log (`apps/hub-sync/src/hub-sync.ts:24-35`).

Al arrancar: migra el hub, hace **backfill sólo si está vacío** —es idempotente entre reinicios— y
programa los ciclos incrementales cada `SYNC_INTERVAL_MS`
(`apps/hub-sync/src/hubSync.ts:11-72`). Además, con sus flags puestos, corre dos tareas diarias: la
derivación de `sales_records` (requiere `SALES_TRACKER_DATABASE_URL`) y el *mark-and-sweep*
(`SWEEP_ENABLED`, que **nace apagado**, y `SWEEP_DRY_RUN`, que **nace encendido**).

**Pendiente:** el valor exacto de las variables de este servicio en producción no se ha verificado
contra EasyPanel en esta revisión. Antes de recrearlo, cópialas de la pestaña Environment del
servicio existente.

## 8. El hook de citas (`pre-push`, capacidad `citas-verificables`)

`npm ci` normal lo instala solo, vía el script `prepare` (`package.json`): fija
`git config core.hooksPath .githooks`. Dos casos que necesitan un paso manual.

**Clon con `--ignore-scripts` (el `prepare` no corre):**
```bash
git config core.hooksPath .githooks
```

**Reversión de urgencia** (quitar la imposición del hook en un clon, sin tocar el fichero):
```bash
git config --unset core.hooksPath
```
El hook `.githooks/pre-push` sigue versionado en el repositorio; esto sólo deja de apuntarlo desde
`core.hooksPath`, así que `git push` vuelve a usar (o a no usar) `.git/hooks/pre-push` local, como
antes de instalarlo. `--no-verify` **nunca** es la salida legítima de un push bloqueado por el
detector de citas: repara la cita o añádela a mano a `apps/desk/server/citas/lineaBase.jsonl`.

## Notas
- **Migraciones:** `migrate` es idempotente (`CREATE TABLE IF NOT EXISTS`); cada deploy es seguro.
- **Backfill grande:** si hay miles de tickets, el primer backfill tarda; corre en segundo
  plano (la app responde mientras tanto, con el tablero llenándose progresivamente).
- **Healthcheck (opcional):** puedes apuntar el healthcheck de EasyPanel a `/api/tickets`.
- **tsx en runtime:** la imagen ejecuta el server TypeScript con `tsx` (no requiere paso de
  compilación del backend). Por eso el `Dockerfile` instala todas las dependencias.

## Comprobación de lectura tras desplegar F1B-04 (recepción: rotulado, novedades y foto por categoría)

Hazla **antes de dar el cambio por publicado**. Son dos consultas de sólo lectura, en la base `desk` (esquema `public`).
La migración corre al arrancar y es tolerante por sentencia: un fallo se registra como «sentencia omitida» y **no**
tumba el arranque, así que un despliegue puede quedar «verde» con una columna sin crear.

```sql
-- 1. La lista de novedades: diez filas.
SELECT count(*) FROM public.catalogo_novedades;

-- 2. Las seis columnas nuevas: seis filas.
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND ((table_name = 'remisiones' AND column_name IN ('novedades', 'novedad_otro', 'rotulado_at', 'rotulado_por'))
    OR (table_name = 'remision_fotos' AND column_name IN ('categoria', 'novedad')))
ORDER BY table_name, column_name;
```

- **Qué se rompe si falta una columna de `public.remisiones`:** **toda** alta de remisión falla, también la de
  legado, porque el `INSERT` de `createRemision` las nombra todas (`apps/desk/server/db/remisiones.ts:47`).
- **Si falta una de `public.remision_fotos`:** falla la subida de fotos y la lectura de la remisión.
- **Si la tabla tiene menos de diez filas:** el formulario muestra una lista incompleta; con cero filas el alta de
  remisión responde `422` «La lista de novedades no está cargada».
- **Sin interruptores nuevos:** `.env.example` no cambia. Para volver atrás basta revertir y redesplegar; tabla y
  columnas quedan sin uso y no se borran.
- **Condiciones de publicación que no son de este fichero** (de persona): que Servicio Técnico confirme la lista de
  diez y que quien administra n8n compruebe que la etiqueta lleva el código del ticket (E-170 de `docs/sdd/ENTRADA.md`).

## 9. Continuidad de los nueve indicadores (F1F-05, `cierra: no`)

- **Sin esquema y sin variables nuevas.** Ningún `CREATE` ni `ALTER`, ninguna clave en la configuración ni en
  `.env.example`, ningún escritor: la ruta nueva `GET /api/indicadores` sólo lee. Reversión: quitar el registro de
  la ruta en `apps/desk/server/app.ts` y el enlace de descarga de `apps/desk/src/components/Analisis.tsx`.
- **Quién la usa.** Sólo administradores: sin sesión responde 401, sin ser administrador 403. En la pantalla
  «Análisis» aparece el enlace «Descargar indicadores (CSV)» (CSV con `;`, BOM UTF-8 y fin de línea CRLF).
- **Fecha límite: desplegar antes del viernes 13/11/2026** para medir las cuatro semanas desde el 16/11. El CI
  no despliega, sólo verifica.
- **P-1 · consulta de SÓLO LECTURA, antes de fiarse de la comparación.** Base `desk`, tabla `desk.tickets`, columnas
  `custom_fields` y `raw`. Sólo `SELECT`, dentro de una transacción de sólo lectura que se deshace. Dice si los valores
  de Zoho de las columnas 47 a 59 y la calificación de satisfacción llegan sincronizados y dónde:

```sql
BEGIN TRANSACTION READ ONLY;
-- 1. Campos de custom_fields y en cuántos tickets.
SELECT k AS campo, count(*) AS tickets
FROM desk.tickets t,
     jsonb_object_keys(CASE WHEN jsonb_typeof(t.custom_fields) = 'object' THEN t.custom_fields ELSE '{}'::jsonb END) AS k
GROUP BY k ORDER BY k;
-- 2. Claves de primer nivel de la carga cruda, y las de su customFields.
SELECT k AS clave_raw, count(*) AS tickets
FROM desk.tickets t,
     jsonb_object_keys(CASE WHEN jsonb_typeof(t.raw) = 'object' THEN t.raw ELSE '{}'::jsonb END) AS k
GROUP BY k ORDER BY k;
SELECT k AS campo_raw, count(*) AS tickets
FROM desk.tickets t,
     jsonb_object_keys(CASE WHEN jsonb_typeof(t.raw -> 'customFields') = 'object' THEN t.raw -> 'customFields' ELSE '{}'::jsonb END) AS k
GROUP BY k ORDER BY k;
-- 3. Recuento dirigido: ¿algún nombre de indicador o de satisfacción?
SELECT count(*) AS tickets,
       count(*) FILTER (WHERE custom_fields::text ~* 'tiempo|cumplimiento|calificaci|satisf') AS en_custom_fields,
       count(*) FILTER (WHERE raw::text ~* 'tiempo permane|tiempo de servicio|cumplimiento del tiempo|calificaci|happiness') AS en_raw
FROM desk.tickets;
ROLLBACK;
```

  No se probó contra la versión de producción (hipótesis: `jsonb_object_keys` y `BEGIN TRANSACTION READ ONLY` son
  estándar de PostgreSQL). Si ninguna de las consultas trae los nombres de los indicadores, el resumen no tiene con
  qué comparar y se abre la pregunta E-173 de `docs/sdd/ENTRADA.md`.
- **Qué se ve si los valores de Zoho no llegan.** Cada indicador dice «sin valor de Zoho con que comparar» y
  no da porcentaje; si llegan pero ningún par es comparable, dice «sin pares comparables». Ninguno de los dos casos es
  un fallo: la tabla de los nueve indicadores sale igual, con el 51 y el 55 «sin dato» hasta que Gerencia responda E-171
  y E-172.
- **Comprobar en la aplicación (P-4, de personas):** con un administrador, que el enlace descarga el CSV y que la hoja
  de cálculo lo abre sin asistente; con otro usuario, que el enlace no aparece. Detalle en `docs/sdd/ENTRADA.md` → E-181.

## 10. `DB_SCHEMA`: en qué esquema viven las tablas de Zoho Desk

Va al final para no desplazar las líneas ya citadas de este documento. Se documenta el 2026-10-04: el paquete de
despliegue de ese día (`docs/sdd/Paquete_de_Despliegue_2026-10-04b.md:1031`, riesgo R51) registró que la variable
se lee y no estaba escrita aquí. No es un secreto ni un interruptor de escritor; es una variable de topología, y va
en la App y en el worker `hub-sync` **con el mismo valor**.

**Qué decide.** Con `DB_SCHEMA=desk`, el arranque mueve las diez tablas de Zoho Desk de `public` a `desk`
(`apps/desk/server/index.ts:26`, `apps/hub-sync/src/hub-sync.ts:47`; las sentencias, en
`packages/zoho-sync/src/db/migrate.ts:114-120`) y cada conexión fija `search_path=desk,public`
(`packages/zoho-sync/src/db/pool.ts:5`), que es lo que hace que las consultas y las sentencias sin calificar
aterricen en `desk`. Ausente, vale `public` (`packages/zoho-sync/src/config.ts:87`), y la comparación es exacta: cualquier
valor que no sea literalmente `desk` se comporta como `public`. Así corren el desarrollo local y las pruebas.

**Qué se rompe si se pone mal.** Si en producción falta, o no dice exactamente `desk`, en cualquiera de los dos
servicios, ese servicio deja de ver `desk.tickets` y las otras nueve tablas: las consultas sin calificar resuelven
contra `public`, y `migrate` crea ahí tablas nuevas y vacías (`packages/zoho-sync/src/db/schema.sql:20` no califica
el esquema), con lo que el tablero arranca sin tickets y las `ALTER` sin calificar de cada despliegue aterrizan en el
esquema equivocado. Hipótesis, no comprobada contra producción: que con esas tablas vacías se dispare además el
backfill inicial del apartado 5. Quitar la variable **no** devuelve las tablas a `public`: la mudanza no se deshace sola.

**El valor en producción es hipótesis.** Que los dos servicios tengan hoy `DB_SCHEMA=desk` lo afirman documentos del
repositorio (`debt.md:824`, `docs/runbooks/verificaciones-pendientes-F0.md:9`), no una lectura del gestor de
despliegue. Comprobarlo es tarea de persona: pestaña Environment de `ambientalia-desk` y de `zoho-hub-sync`.

> **Lo que este apartado NO cubre.** La regla de secretos pide `.env.example` **y** `DEPLOY.md`. `.env.example` queda
> fuera del alcance de lectura de toda sesión, así que no se afirma nada sobre él. Las líneas que hay que añadirle a
> mano son estas tres (vacía a propósito: el desarrollo local corre en `public`):
>
> ```
> # DB_SCHEMA: con `desk`, el arranque mueve las tablas de Zoho Desk de public a desk y fija search_path=desk,public; vacía o ausente, todo vive en public (desarrollo y pruebas).
> # Si en producción falta o no dice exactamente `desk` en la App y en el worker, el servicio deja de ver desk.tickets y migrate crea tablas vacías en public.
> DB_SCHEMA=
> ```

## 11. `MIGRACION_TICKETS_HABILITADA`: el interruptor que deja APLICAR la migración de F1F-01 (E-231)

**Qué enciende:** con `MIGRACION_TICKETS_HABILITADA=true` en el servicio App, `POST /api/admin/migrar-tickets-abiertos`
acepta `aplicar=true` y migra de verdad todos los tickets abiertos de Zoho Desk; apagada —ausente o con cualquier otro
valor— esa llamada responde `403` sin tocar la base, y la pasada en seco sigue disponible
(`packages/zoho-sync/src/config.ts:123`, `apps/desk/server/routes/admin.ts:222`, `:250-255`). **Qué se rompe si se pone mal:**
encendida fuera del día del corte, cualquier administrador —no sólo el superadministrador, que hoy es un alias
(E-231)— puede pasar a gobierno de la aplicación todos los tickets abiertos con una sola llamada, y volver al código
anterior no lo deshace; apagada el día del corte, la migración responde `403` y no se aplica.

Se enciende **sólo el día del corte**, para la pasada con `aplicar=true`, y se **apaga** en cuanto termina, con un
redespliegue en cada cambio. La línea que hay que añadir al fichero de ejemplo de entorno, tal cual:

> ```
> # MIGRACION_TICKETS_HABILITADA: con `true`, la migración de tickets abiertos de F1F-01 acepta aplicar=true y escribe en producción; encender sólo el día del corte y apagar después. Ausente o con otro valor, sólo pasada en seco (403 al aplicar).
> MIGRACION_TICKETS_HABILITADA=
> ```

## 12. Respaldo: la copia nocturna y la previa a cada cambio (F1F-02, `decision/p55-backup`)

La App vuelca la base `desk` con `pg_dump`, la **cifra en el servidor** (AES-256-GCM) y la sube a un almacenamiento de
objetos S3 compatible de un proveedor distinto de Google y de Hostinger (`decision/p55b-destino-copia`). Las fotos,
adjuntos y firmas viven en la base (`packages/zoho-sync/src/db/schema.sql:293-294`), así que el volcado los incluye.
Código: `apps/desk/server/respaldo/`.

**`RESPALDO_HABILITADO`. Qué enciende:** con `true`, la App programa la copia nocturna a la hora `RESPALDO_HORA` y acepta
`POST /api/admin/respaldo` para la copia previa; ausente o con cualquier otro valor, no se vuelca ni se sube nada y la ruta
responde `403` (`apps/desk/server/respaldo/config.ts:31`). **Qué se rompe si se pone mal:** encendido sin el destino, las
credenciales o la clave, cada copia falla y manda un correo al responsable nombrando la variable que falta; apagado por
descuido, **no hay copia** y nadie recibe aviso, porque un respaldo apagado no es un fallo.

| Variable | Qué es |
|---|---|
| `RESPALDO_HORA` | Hora de la copia nocturna, en la hora del contenedor (por defecto `3`) |
| `RESPALDO_S3_ENDPOINT` | URL del almacenamiento, p. ej. `https://<cuenta>.r2.cloudflarestorage.com` o `https://s3.<región>.backblazeb2.com` |
| `RESPALDO_S3_REGION` | Región que pide el proveedor (`auto` en R2) |
| `RESPALDO_S3_BUCKET` | Nombre del almacenamiento |
| `RESPALDO_S3_ACCESS_KEY_ID` / `RESPALDO_S3_SECRET_ACCESS_KEY` | Credenciales **propias del respaldo**, que no se usan para trabajar |
| `RESPALDO_CLAVE_CIFRADO` | 32 bytes en base64 (`openssl rand -base64 32`). Sin ella **no se puede restaurar nada**: se guarda además fuera del gestor de secretos |
| `RESPALDO_AVISO_EMAIL` | Correo del responsable (Gerencia). El aviso sale por `N8N_AVISOS_WEBHOOK_URL` |

Las líneas que hay que añadir al fichero de ejemplo de entorno, tal cual:

> ```
> # RESPALDO_HABILITADO: con `true`, la App vuelca la base cada noche y antes de cada cambio, la cifra y la sube al almacenamiento S3; ausente u otro valor, no se copia nada. Sin destino, credenciales o clave, cada copia falla y avisa por correo.
> RESPALDO_HABILITADO=
> RESPALDO_HORA=3
> RESPALDO_S3_ENDPOINT=
> RESPALDO_S3_REGION=
> RESPALDO_S3_BUCKET=
> RESPALDO_S3_ACCESS_KEY_ID=
> RESPALDO_S3_SECRET_ACCESS_KEY=
> RESPALDO_CLAVE_CIFRADO=
> RESPALDO_AVISO_EMAIL=
> ```

**Retención (7 diarias, 4 semanales, 12 mensuales).** La copia nocturna del día 1 va a `mensual/`, la del domingo a
`semanal/` y el resto a `diaria/`; la previa, a `previa/` (`apps/desk/server/respaldo/respaldo.ts:29-33`). La aplicación
**no borra nada**: en el almacenamiento se configuran el bloqueo de borrado y una regla de ciclo de vida por prefijo
(`diaria/` 7 días, `semanal/` 28, `mensual/` 365; `previa/`, a decidir).

**La copia previa, antes de cada publicación:** con sesión de administrador, desde la consola del navegador en la
aplicación, `fetch('/api/admin/respaldo', { method: 'POST' })`. Responde `202` al arrancar; si falla, llega el correo.

**Prueba de restauración:** bajar un objeto, descifrarlo con
`RESPALDO_CLAVE_CIFRADO=… npx tsx apps/desk/server/respaldo/descifrarCli.ts <objeto> <salida.dump>` y restaurarlo con
`pg_restore` en una base **aparte**, nunca sobre `desk`.

**Pendiente de persona, y ninguna sesión lo hace:** elegir el proveedor (cuesta dinero); crear el almacenamiento con el
bloqueo de borrado y las reglas por prefijo; guardar credenciales y clave en el gestor de secretos; comprobar que la
versión de `pg_dump` de la imagen (`Dockerfile:34`) es igual o mayor que la del servidor (`SELECT version();`); encender;
lanzar la primera copia y hacer la primera prueba de restauración.

## 13. Respaldo: la copia semanal de la carpeta de Drive (F1F-02, `decision/p55b-destino-copia`)

Una vez por semana la App copia la carpeta de Drive de documentación de servicio (y sus subcarpetas) al **mismo**
almacenamiento S3 de la §12, cifrada con la misma clave y **sin pasar por el disco del servidor**; sólo sube lo nuevo o
cambiado y aplica ella misma la retención de 12 meses. Código: `apps/desk/server/respaldo/` (`copiaDrive.ts`). Está
**adelantada con el interruptor cerrado** (`decision/f1f02-copia-semanal-drive-adelantada`): encenderla espera a
`p55c-proveedor-copia` (elegir el proveedor, que cuesta dinero).

**`RESPALDO_DRIVE_HABILITADO`. Qué enciende:** con `true` exacto, la App programa la pasada semanal a la hora
`RESPALDO_DRIVE_HORA` del día `RESPALDO_DRIVE_DIA`; ausente, vacío o con cualquier otro valor no se pide token a Google ni
se lista, descarga o sube nada, y no hay aviso. **Qué se rompe si se pone mal:** encendido sin la credencial, la carpeta, el
destino o la clave, cada pasada falla y manda un correo nombrando la variable que falta; apagado por descuido, **no hay
copia de Drive** y nadie recibe aviso, porque un respaldo apagado no es un fallo.

| Variable | Qué es |
|---|---|
| `RESPALDO_DRIVE_CREDENCIAL` | JSON de la cuenta de servicio de Google en **base64** (con `client_email` y `private_key`). Sólo en el gestor de secretos: **nunca en un chat, una captura o un prompt**; si aparece en uno, está quemada y se rota |
| `RESPALDO_DRIVE_CARPETA_ID` | Id de la carpeta raíz de Drive (sólo letras, números, `_` y `-`). Lo de fuera de ella no se copia |
| `RESPALDO_DRIVE_DIA` | Día de la semana, 0-6 (0 = domingo; por defecto `0`) |
| `RESPALDO_DRIVE_HORA` | Hora de la pasada, 0-23, en la hora del contenedor (por defecto `5`, después de la nocturna) |

Reutiliza, sin variables nuevas: `RESPALDO_S3_*` (destino), `RESPALDO_CLAVE_CIFRADO` (misma clave) y `RESPALDO_AVISO_EMAIL`
(el responsable que recibe el correo). Las líneas que **añade el usuario** al fichero de ejemplo de entorno, tal cual:

> ```
> # RESPALDO_DRIVE_HABILITADO: con `true`, la App copia cada semana la carpeta de Drive configurada, cifrada, al almacenamiento S3 del respaldo; ausente u otro valor, no se pide token ni se copia nada. Sin credencial, carpeta, destino o clave, cada pasada falla y avisa por correo.
> RESPALDO_DRIVE_HABILITADO=
> RESPALDO_DRIVE_CREDENCIAL=
> RESPALDO_DRIVE_CARPETA_ID=
> RESPALDO_DRIVE_DIA=0
> RESPALDO_DRIVE_HORA=5
> ```

**Dónde quedan los objetos.** `drive/archivos/<fileId>/<AAAA-MM-DDTHH-MM-SSZ>.enc` (una por versión; el nombre del
documento va en el índice cifrado, no en la clave) y `drive/indice.json.enc` (el mapa nombre → objeto y la retención). Los
documentos nativos de Google se exportan a Office (`.docx`, `.xlsx`, `.pptx`; Drawings a `.pdf`); los demás nativos y los
accesos directos se omiten y se avisan.

**Restaurar un documento.** Bajar el objeto de la versión que se quiera y descifrarlo con
`RESPALDO_CLAVE_CIFRADO=… npx tsx apps/desk/server/respaldo/descifrarCli.ts <objeto> <salida>`. Sirve para cualquier objeto
`DESKR1`, aunque su texto de uso hable de `.dump`. El índice (`drive/indice.json.enc`) se descifra del mismo modo: dice qué
objeto es cada documento, con su nombre y su ruta. Si el índice no se puede leer, la pasada **se detiene y avisa** sin copiar ni borrar nada: hace falta una persona
que restaure una versión anterior del índice del almacenamiento.

**Pendiente de persona, y ninguna sesión lo hace:** (1) crear la cuenta de servicio de Google con **lectura** de la carpeta
y guardar su credencial en el gestor de secretos; (2) el almacenamiento tiene que ser **VERSIONADO** y con **bloqueo de
borrado de 12 meses**: la App borra por versión (`?versionId=`) sólo cuando el plazo vence, y un borrado denegado por el
bloqueo se avisa y se reintenta la semana siguiente; (3) añadir al almacenamiento la regla de ciclo de vida
`AbortIncompleteMultipartUpload` (p. ej. 7 días), para que una subida cortada no deje partes huérfanas; (4) añadir las
líneas de arriba al fichero de ejemplo de entorno; (5) elegir el proveedor (`p55c`) y encender. **La prueba mensual de
restauración** incluye recuperar un documento de la carpeta con el procedimiento anterior, y es tarea de persona.

## Comprobación de lectura tras desplegar F1B-13 (ficha de reclamación al fabricante)

**Sin variables de entorno nuevas** (`.env.example` no cambia) y sin interruptor: la ficha y su aviso están activos desde que se
publica. El cambio añade **una tabla**, `public.garantia_proveedor`, que `migrate` crea al arrancar. No toca la replicación ni el hub:
la tabla no es de `books`.

Hazla **antes de dar el cambio por publicado**. Es una consulta de sólo lectura, en la base `desk` (esquema `public`). La migración es
tolerante por sentencia: un fallo se registra como «sentencia omitida» y **no** tumba el arranque, así que un despliegue puede quedar
«verde» con la tabla sin crear.

```sql
-- La tabla existe: una fila. Con cero filas, la migración omitió la sentencia.
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'garantia_proveedor';
```

- **Qué se rompe si la tabla falta:** responder, editar y avanzar una reclamación, y la lectura del panel de garantía de un ticket,
  fallan, porque sus consultas nombran la tabla (`apps/desk/server/db/garantiaProveedor.ts:144`, la de la lectura).
- **Condición de persona, antes de publicar:** asignar el cargo Director Técnico. Sin él, sólo un administrador responde la pregunta
  y el aviso de 60 días cae al área Servicio Técnico.
- **Lo que se verá el día de publicar:** toda OVI ya asociada a un ticket aparece «Pendiente de respuesta», porque no hay relleno.
- **Para volver atrás** basta revertir y redesplegar; la tabla queda sin uso y no se borra.
