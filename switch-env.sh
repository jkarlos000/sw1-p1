#!/bin/bash

# Script para cambiar entre configuración de desarrollo y producción

MODE=$1

if [ "$MODE" != "dev" ] && [ "$MODE" != "prod" ]; then
    echo "❌ Uso: ./switch-env.sh [dev|prod]"
    echo ""
    echo "Ejemplos:"
    echo "  ./switch-env.sh dev   - Configurar para desarrollo local"
    echo "  ./switch-env.sh prod  - Configurar para producción (uml.jkhoster.com)"
    exit 1
fi

if [ "$MODE" == "dev" ]; then
    echo "🔧 Configurando para DESARROLLO LOCAL..."
    
    # Config.json para desarrollo
    cat > ./official-sw1p1/src/assets/config.json << EOF
{
  "apiUrl": "http://localhost:3000",
  "wsUrl": "http://localhost:3000"
}
EOF
    
    echo "✅ config.json actualizado → http://localhost:3000"
    echo ""
    echo "📋 Para desarrollo local:"
    echo "   1. Terminal 1: cd backend-p1sw1 && npm start"
    echo "   2. Terminal 2: cd official-sw1p1 && ng serve"
    echo "   3. Visita: http://localhost:4200"
    
elif [ "$MODE" == "prod" ]; then
    echo "🚀 Configurando para PRODUCCIÓN (uml.jkhoster.com)..."
    
    # Config.json para producción
    cat > ./official-sw1p1/src/assets/config.json << EOF
{
  "apiUrl": "https://uml.jkhoster.com/api",
  "wsUrl": "https://uml.jkhoster.com"
}
EOF
    
    echo "✅ config.json actualizado → https://uml.jkhoster.com/api"
    echo ""
    echo "📋 Para desplegar en producción:"
    echo "   1. Asegúrate de tener .env configurado"
    echo "   2. ./setup-ssl.sh  (si no tienes SSL aún)"
    echo "   3. docker-compose up -d --build"
    echo "   4. Visita: https://uml.jkhoster.com"
fi

echo ""
