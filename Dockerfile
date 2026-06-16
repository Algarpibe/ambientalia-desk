# --- Etapa 1: build del frontend (Vite) ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build          # tsc -b && vite build  →  /app/dist

# --- Etapa 2: runtime (sirve dist + API; el server corre con tsx) ---
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
# Instala dependencias (incluye tsx, que ejecuta el server TypeScript en runtime)
COPY package.json package-lock.json ./
RUN npm ci
# Código del backend + tipos compartidos + frontend ya compilado
COPY server ./server
COPY shared ./shared
COPY --from=build /app/dist ./dist
EXPOSE 3001
# El server lee env vars de EasyPanel (DATABASE_URL, ZOHO_*, ENABLE_WRITES, PORT).
# El entrypoint se elige por APP_ENTRYPOINT (default index.ts = la app web/API).
# El worker zoho-hub-sync usa el MISMO repo/imagen con APP_ENTRYPOINT=hub-sync.ts.
CMD ["sh", "-c", "npx tsx \"server/${APP_ENTRYPOINT:-index.ts}\""]
