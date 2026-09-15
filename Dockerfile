# --- Etapa 1: build del frontend (Vite) en el monorepo ---
FROM node:22-alpine AS build
WORKDIR /app
# Copia todo el workspace para que `npm ci` pueda cablear los workspaces (packages/* + apps/*).
COPY . .
RUN npm ci
RUN npm run build          # npm --workspace @ambientalia/desk run build  →  /app/dist

# --- Etapa 2: runtime (sirve dist + API; el server corre con tsx) ---
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
# Instala dependencias del workspace (symlinks de packages/* + apps/*). `tsx` va en `dependencies`
# A PROPÓSITO: el CMD lo usa en runtime (`npx tsx`). En devDependencies, `npm ci` lo omitiría aquí y
# `npx` bajaría del registro un tsx sin versión fijada al arrancar: sin red, el arranque falla.
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps ./apps
# `scripts/` tiene que estar ANTES de `npm ci`: el `prepare` nuevo (capacidad `citas-verificables`)
# invoca `scripts/instalar-hooks.mjs`, y `npm ci` lo dispara. Sin este COPY, el build fallaría aquí.
COPY scripts ./scripts
RUN npm ci
# Frontend ya compilado (debe quedar en /app/dist porque el server sirve desde process.cwd()/dist).
COPY --from=build /app/dist ./dist
EXPOSE 3001
# El server lee env vars de EasyPanel (DATABASE_URL, ZOHO_*, ENABLE_WRITES, PORT).
# El entrypoint se elige por APP_ENTRYPOINT (default = la app web/API en apps/desk).
# El worker zoho-hub-sync usa la MISMA imagen con APP_ENTRYPOINT=apps/hub-sync/src/hub-sync.ts.
CMD ["sh", "-c", "npx tsx \"${APP_ENTRYPOINT:-apps/desk/server/index.ts}\""]
