#!/bin/bash
# Script para iniciar desarrollo local en Linux/Mac

echo "🚀 Iniciando entorno de desarrollo..."

# Verificar que estamos en la raíz del proyecto
if [ ! -d "backend-p1sw1" ] || [ ! -d "official-sw1p1" ]; then
    echo "❌ Error: Ejecuta este script desde la raíz del proyecto"
    exit 1
fi

# Verificar PostgreSQL
echo "📊 Verificando PostgreSQL..."
if docker ps | grep -q postgres; then
    echo "✅ PostgreSQL corriendo en Docker"
elif pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "✅ PostgreSQL corriendo localmente"
else
    echo "⚠️  PostgreSQL no detectado. Iniciando con Docker..."
    docker-compose up -d postgres
    sleep 3
fi

# Iniciar backend en background
echo "🔧 Iniciando backend..."
cd backend-p1sw1
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "   PID: $BACKEND_PID"
cd ..

# Esperar a que backend esté listo
echo "⏳ Esperando backend..."
for i in {1..10}; do
    if curl -s http://localhost:3000 > /dev/null; then
        echo "✅ Backend listo en http://localhost:3000"
        break
    fi
    sleep 1
done

# Iniciar frontend
echo "🎨 Iniciando frontend..."
cd official-sw1p1
ng serve

# Cleanup cuando se cierra el script
trap "echo '🛑 Deteniendo servicios...'; kill $BACKEND_PID 2>/dev/null; exit" INT TERM
