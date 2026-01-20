# Backend - Node.js + TypeScript
# Build locally and copy dist/

FROM node:20-alpine
WORKDIR /app

# Copiar solo lo necesario para producción
COPY package*.json ./
RUN npm install --production

# Copiar código compilado (debe existir dist/ localmente)
# IMPORTANTE: Ejecutar 'npm run build' localmente ANTES de docker build
COPY dist ./dist
COPY package*.json ./

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

# Ejecutar JavaScript compilado
CMD ["node", "dist/index.js"]

