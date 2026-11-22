# Imagen de Grimuca Agua: la API (Fastify con tsx) sirve también el front compilado.
# El contexto de construcción es la RAÍZ del repo:
#   docker compose -f infra/docker-compose.yml build
#
# Distribución dentro de la imagen (igual que en el repo, para que las rutas
# relativas de la API sigan valiendo):
#   /srv/package.json, /srv/package-lock.json, /srv/node_modules
#   /srv/api        código de la API (corre con tsx, sin compilar)
#   /srv/db         migraciones y semillas
#   /srv/app/dist   front compilado

# ---------- Etapa 1: construir el front ----------
FROM node:24-alpine AS construccion

ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    NODE_OPTIONS=--max-old-space-size=1024

WORKDIR /srv

# Primero solo los manifiestos: esta capa se reutiliza mientras no cambien las dependencias.
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY app/package.json app/
RUN npm ci

COPY app/ app/
RUN npm run build -w app

# ---------- Etapa 2: imagen final ----------
FROM node:24-alpine AS final

LABEL proyecto="agua"

ENV NODE_ENV=production \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false

WORKDIR /srv

# Solo las dependencias de producción de la API (tsx está en "dependencies").
# app/package.json se copia porque npm valida todos los espacios de trabajo del candado.
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY app/package.json app/
RUN npm ci --omit=dev -w api \
    && npm cache clean --force

COPY api/ api/
COPY db/ db/
COPY --from=construccion /srv/app/dist app/dist

ENV PUERTO=3070 \
    DIR_ESTATICOS=/srv/app/dist

# Usuario sin privilegios que ya trae la imagen oficial (uid 1000).
USER node

EXPOSE 3070

# Migra (y siembra si la base está vacía) y luego arranca. Si la migración falla,
# el contenedor sale con error y el motivo queda en los logs.
CMD ["sh", "-c", "npm run migrar -w api -- --semilla && exec npm run start -w api"]
