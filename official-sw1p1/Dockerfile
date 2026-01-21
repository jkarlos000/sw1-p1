# Frontend - Nginx serving pre-built static files
# Build Angular LOCALLY before docker build

FROM nginx:1.26-alpine

# Copiar configuración Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar aplicación pre-compilada
# IMPORTANTE: Ejecutar 'npm run build' localmente ANTES de docker build
COPY dist/client-socket/browser /usr/share/nginx/html

# Copiar config.json para runtime
COPY src/assets/config.json /usr/share/nginx/html/assets/config.json

# Crear directorios de caché y dar permisos a usuario nginx
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    mkdir -p /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp \
             /var/cache/nginx/fastcgi_temp /var/cache/nginx/uwsgi_temp \
             /var/cache/nginx/scgi_temp && \
    chown -R nginx:nginx /var/cache/nginx && \
    chmod -R 755 /var/cache/nginx && \
    touch /tmp/nginx.pid && \
    chown nginx:nginx /tmp/nginx.pid

USER nginx

# Puerto
EXPOSE 80

# Nginx
CMD ["nginx", "-g", "daemon off;"]
