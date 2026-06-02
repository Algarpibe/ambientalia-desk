# Despliegue en EasyPanel (VPS)

El backend Express sirve **a la vez** el frontend compilado (`dist/`) y la API `/api` en un
solo puerto, así que basta **un servicio de Aplicación** en EasyPanel, junto al servicio
Postgres.

```
[ App (este repo, Dockerfile) ]  ──red interna──►  [ Postgres (desk-db) ]
        puerto 3001  ▲
                     │ dominio EasyPanel
                  navegador
```

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

## 5. Desplegar
- Pulsa **Deploy**. En el primer arranque el server corre `migrate` (crea las tablas) y,
  si la BD está vacía, lanza el **backfill** desde Zoho (verás los logs "iniciando backfill…").
- Abre el dominio: el tablero debe mostrar tickets reales.

## 6. Activar escrituras (cuando hayas validado lecturas)
Cambia `ENABLE_WRITES=true` en Environment y redeploy. Prueba un cambio de estado en un
ticket de prueba y verifica en Zoho Desk. (Mantenlo en `false` mientras tanto.)

## Notas
- **Migraciones:** `migrate` es idempotente (`CREATE TABLE IF NOT EXISTS`); cada deploy es seguro.
- **Backfill grande:** si hay miles de tickets, el primer backfill tarda; corre en segundo
  plano (la app responde mientras tanto, con el tablero llenándose progresivamente).
- **Healthcheck (opcional):** puedes apuntar el healthcheck de EasyPanel a `/api/tickets`.
- **tsx en runtime:** la imagen ejecuta el server TypeScript con `tsx` (no requiere paso de
  compilación del backend). Por eso el `Dockerfile` instala todas las dependencias.
