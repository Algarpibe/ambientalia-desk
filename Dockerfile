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
# Instala dependencias del workspace (crea los symlinks de packages/* + apps/*).
# tsx es devDep: con NODE_ENV=production `npm ci` lo omite, pero el CMD usa `npx tsx`,
# que lo descarga en runtime si falta (mismo comportamiento que el setup actual).
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps ./apps
RUN npm ci
# Frontend ya compilado (debe quedar en /app/dist porque el server sirve desde process.cwd()/dist).
COPY --from=build /app/dist ./dist
EXPOSE 3001
# El server lee env vars de EasyPanel (DATABASE_URL, ZOHO_*, ENABLE_WRITES, PORT).
# El entrypoint se elige por APP_ENTRYPOINT (default = la app web/API en apps/desk).
# El worker zoho-hub-sync usa la MISMA imagen con APP_ENTRYPOINT=apps/hub-sync/src/hub-sync.ts.
CMD ["sh", "-c", "npx tsx \"${APP_ENTRYPOINT:-apps/desk/server/index.ts}\""]
