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
(artículos, órdenes de venta, facturas, pagos, órdenes de compra) y `crm.*` cuando sus
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

- *Qué enciende:* una dirección que recibe **copia de los avisos de derivación dirigidos a otras
  personas** (`ticketService.ts:141`, `avisosWebhook.ts:11-27`). Existe para poder verificar que el
  canal de correo sale de verdad. **Vacía —lo normal— no copia nada**, y se apaga borrando la
  variable, sin tocar código.
- *Qué rompe si se pone mal:* es la única de las cuatro que **manda correo a alguien que no es el
  destinatario**. Dejarla puesta después de las pruebas convierte una dirección en receptora
  permanente de las derivaciones de todo el mundo. No se copia a sí misma si el destinatario ya es
  esa dirección (`avisosWebhook.ts:71-75`), y su texto dice a quién iba dirigido el original, pero
  ninguna de las dos cosas la apaga: eso se hace borrándola.

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
