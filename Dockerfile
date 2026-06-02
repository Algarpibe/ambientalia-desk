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
# El server lee env vars de EasyPanel (DATABASE_URL, ZOHO_*, ENABLE_WRITES, PORT)
CMD ["npx", "tsx", "server/index.ts"]
