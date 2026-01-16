# Frontend - Angular 18 Standalone + Nginx
# Multi-stage build optimizado

# Etapa 1: Dependencias
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts && \
    npm cache clean --force

# Etapa 2: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Build arg para configurar URL del backend
ARG BACKEND_URL=http://localhost:3000
ENV BACKEND_URL=$BACKEND_URL

# Copiar dependencias
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build de producción
RUN npm run build -- \
    --configuration production \
    --output-path=dist/browser \
    --optimization=true \
    --source-map=false

# Etapa 3: Runtime con Nginx
FROM nginx:1.26-alpine AS runtime

# Copiar configuración Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar archivos compilados
COPY --from=builder /app/dist/browser /usr/share/nginx/html

# Crear directorio para logs
RUN mkdir -p /var/log/nginx && \
    chown -R nginx:nginx /var/log/nginx /usr/share/nginx/html

# Puerto
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Usuario nginx (no-root)
USER nginx

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
