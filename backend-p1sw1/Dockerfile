# Backend - Node.js + TypeScript + Socket.IO
# Multi-stage build optimizado para producción

# Etapa 1: Dependencias
FROM node:20-alpine AS deps
WORKDIR /app

# Instalar solo dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# Etapa 2: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar dependencias
COPY package*.json tsconfig.json ./
RUN npm ci --ignore-scripts

# Copiar código fuente y compilar
COPY . .
RUN npm run build || npx tsc

# Etapa 3: Runtime
FROM node:20-alpine AS runtime
WORKDIR /app

# Instalar wget para health checks
RUN apk add --no-cache wget

# Usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar dependencias y build
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Cambiar a usuario no-root
USER nodejs

# Puerto
EXPOSE 3000

# Variables de entorno
ENV NODE_ENV=production \
    PORT=3000 \
    NODE_OPTIONS="--max-old-space-size=512"

# Health check con wget
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Iniciar aplicación
CMD ["node", "dist/index.js"]
