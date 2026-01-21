# Backend - Node.js + TypeScript
# Build locally and copy dist/

FROM node:20-alpine
WORKDIR /app

# Copiar dependencias ya instaladas localmente
COPY package*.json ./
COPY node_modules ./node_modules

# Copiar código compilado (debe existir dist/ localmente)
# IMPORTANTE: 
# 1. Ejecutar 'npm install' localmente ANTES de docker build
# 2. Ejecutar 'npm run build' localmente ANTES de docker build
COPY dist ./dist

# Usuario no-root y permisos
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    mkdir -p /app/uploads && \
    chown -R nodejs:nodejs /app && \
    chmod -R 755 /app/node_modules

USER nodejs

# Puerto
EXPOSE 3000

# Variables de entorno
ENV NODE_ENV=production

# Ejecutar JavaScript compilado
CMD ["node", "dist/index.js"]

