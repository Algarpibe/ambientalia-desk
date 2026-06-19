# Diseño — App de prueba `hub-test-app`: validar el ciclo end-to-end de lectura del hub

**Fecha:** 2026-06-18
**Estado:** Aprobado para planificación
**Repo destino:** `https://github.com/Algarpibe/hub-test-app` (privado, nuevo).
**Objetivo:** validar end-to-end que `@algarpibe/zoho-sync@1.0.0` + el usuario `hub_reader` permiten a una app NUEVA conectarse y leer `zoho-hub-db` en un entorno real (EasyPanel).

## Por qué se despliega (no es local)
El hub solo es accesible por el host interno `ambientalia_project_zoho-hub-db:5432`, inalcanzable desde local. La validación real exige correr la app DENTRO del proyecto EasyPanel. Esto prueba además: (a) instalar el paquete privado desde GitHub Packages con auth de registro en el build, (b) conectar con `hub_reader`, (c) leer datos reales.

## Forma — micro-servicio Express
- `GET /health` → `{ ok: true }` (sin tocar BD; liveness).
- `GET /resumen` → conteos vía `query()`: `crm.deals`, `books.invoices`, `desk.tickets` → `{ deals, invoices, tickets }`.
- `GET /deals?stage=Ganado` → `getDealsByStage(db, stage)` del paquete → JSON de deals (stage por query param, default `Ganado`).
- Escucha en `PORT` (default 3001; EasyPanel inyecta).
- Conexión: `createPoolFromUrl(process.env.HUB_DB_URL)` al arrancar (un Pool reutilizado).
- Manejo de error: cada endpoint en try/catch → 500 con `{ error }` si la consulta falla (no tumba el server).

## Estructura del repo `Algarpibe/hub-test-app`
```
hub-test-app/
├── package.json     # type module; deps: @algarpibe/zoho-sync, express; devDeps: tsx, typescript, @types/*
├── tsconfig.json
├── .npmrc           # @algarpibe:registry=https://npm.pkg.github.com + _authToken=${NPM_TOKEN}
├── .gitignore       # node_modules
├── Dockerfile       # node:22-alpine; ARG NPM_TOKEN para npm ci del paquete privado; corre con tsx
├── README.md
└── src/server.ts    # Express + los 3 endpoints
```

## Dockerfile (clave: auth de registro en build)
- `node:22-alpine`, `WORKDIR /app`.
- `ARG NPM_TOKEN` → `ENV NPM_TOKEN=$NPM_TOKEN` para que `npm ci` resuelva `@algarpibe/zoho-sync` desde GitHub Packages (vía `.npmrc`). El token llega como **build secret/arg de EasyPanel**, NO se hornea en la imagen final (usar solo en la etapa de instalación; o aceptar que es una app de prueba interna).
- `COPY package*.json .npmrc ./` → `npm ci` → `COPY . .` → `CMD npx tsx src/server.ts`.

## Despliegue en EasyPanel (pasos del usuario)
1. Crear repo `Algarpibe/hub-test-app` (privado, vacío).
2. (Tras push del código) Crear un **App service** en el proyecto, source = ese repo, build = Dockerfile.
3. **Build arg `NPM_TOKEN`** = un PAT `read:packages`.
4. **Env `HUB_DB_URL`** = `postgres://hub_reader:<pwd>@ambientalia_project_zoho-hub-db:5432/zoho-hub`.
5. Exponer el puerto / dominio → abrir `/resumen` y `/deals?stage=Ganado`.

## Validación (criterio de éxito)
- El build del servicio descarga `@algarpibe/zoho-sync@1.0.0` desde GitHub Packages (auth OK).
- `GET /resumen` devuelve conteos > 0 (lee el hub real con `hub_reader`).
- `GET /deals?stage=Ganado` devuelve deals tipados.
- → ciclo end-to-end (publicar → instalar con auth → conectar read-only → leer) **validado**.

## Pruebas (código)
- Test mínimo del server con `supertest` + un `Queryable` falso (mock) inyectado: `/resumen` y `/deals` devuelven lo que el mock retorna; `/health` ok. (No se conecta a BD real en tests.)
- Para test, `createServer(db: Queryable)` separa la construcción de la app del Pool real (inyección de dependencia).

## Fuera de alcance
- Auth/UI; más endpoints; tipar más tablas; que sea permanente (es validación — se puede borrar tras validar). Rotación de secretos.
