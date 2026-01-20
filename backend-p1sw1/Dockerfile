# Backend - Node.js + TypeScript
# Single-stage simplified build para evitar problemas de DNS/compilación

FROM node:20-alpine
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm install --production=false

# Copiar código fuente completo
COPY . .

# Usuario no-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    mkdir -p /app/uploads && \
    chown -R nodejs:nodejs /app

USER nodejs

# Puerto
EXPOSE 3000

# Variables de entorno
ENV NODE_ENV=production

# Ejecutar directamente con ts-node usando npx
CMD ["npx", "-y", "ts-node", "index.ts"]

