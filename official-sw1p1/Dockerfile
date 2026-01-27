# Frontend - Angular 18 + Nginx
# Multi-stage build: Compila Angular, luego sirve con Nginx

# STAGE 1: Compilar Angular
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Compilar para PRODUCCIÓN (usa environment.prod.ts)
RUN npm run build

# STAGE 2: Servir con Nginx
FROM nginx:1.26-alpine

# Copiar configuración Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar aplicación compilada desde stage anterior
COPY --from=builder /app/dist/client-socket/browser /usr/share/nginx/html

# Crear script para generar config.json dinámicamente
RUN mkdir -p /etc/nginx/scripts && \
    cat > /etc/nginx/scripts/generate-config.sh << 'EOF'
#!/bin/sh
cat > /usr/share/nginx/html/assets/config.json << CONFIGEOF
{
  "apiUrl": "${API_URL:-https://uml.jkhoster.com/api}",
  "wsUrl": "${WS_URL:-https://uml.jkhoster.com}"
}
CONFIGEOF
EOF
chmod +x /etc/nginx/scripts/generate-config.sh

# Crear directorios de caché y dar permisos a usuario nginx
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    mkdir -p /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp \
             /var/cache/nginx/fastcgi_temp /var/cache/nginx/uwsgi_temp \
             /var/cache/nginx/scgi_temp && \
    chown -R nginx:nginx /var/cache/nginx && \
    chmod -R 755 /var/cache/nginx && \
    touch /tmp/nginx.pid && \
    chown nginx:nginx /tmp/nginx.pid

# Script para generar config.json y iniciar nginx
RUN cat > /start.sh << 'EOF'
#!/bin/sh
/etc/nginx/scripts/generate-config.sh
nginx -g "daemon off;"
EOF
chmod +x /start.sh

USER nginx

# Puerto
EXPOSE 80

# Generar config.json dinámicamente y iniciar Nginx
CMD ["/start.sh"]
