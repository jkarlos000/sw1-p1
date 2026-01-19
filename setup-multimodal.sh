#!/bin/bash

# ================================================================
# SCRIPT DE INSTALACIÓN Y SETUP - CHAT MULTIMODAL
# ================================================================

echo "🚀 Iniciando setup de Chat Multimodal..."

# ================================================================
# 1. BACKEND - Dependencias NPM
# ================================================================

echo ""
echo "📦 Instalando dependencias del backend..."
cd backend-p1sw1

npm install multer @types/multer form-data axios

# Opcional: Google Cloud Speech
read -p "¿Instalar Google Cloud Speech? (s/n): " install_google
if [ "$install_google" = "s" ]; then
    npm install @google-cloud/speech
fi

# Opcional: Sharp para procesamiento de imágenes
read -p "¿Instalar Sharp (procesamiento de imágenes)? (s/n): " install_sharp
if [ "$install_sharp" = "s" ]; then
    npm install sharp
fi

echo "✅ Dependencias del backend instaladas"

# ================================================================
# 2. BASE DE DATOS - Aplicar Schema
# ================================================================

echo ""
echo "🗄️  Aplicando schema de base de datos..."

# Detectar contenedor de PostgreSQL
POSTGRES_CONTAINER=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -n 1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo "⚠️  No se encontró contenedor de PostgreSQL"
    echo "Ejecuta: docker-compose up -d"
    exit 1
fi

echo "Contenedor encontrado: $POSTGRES_CONTAINER"

# Aplicar schema multimodal
docker exec -i $POSTGRES_CONTAINER psql -U postgres -d parcial1sw1 < database/multimodal-schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema multimodal aplicado exitosamente"
else
    echo "❌ Error aplicando schema"
    exit 1
fi

# ================================================================
# 3. VARIABLES DE ENTORNO
# ================================================================

echo ""
echo "🔧 Configurando variables de entorno..."

if [ ! -f .env ]; then
    echo "Creando archivo .env..."
    cat > .env << 'EOF'
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=parcial1sw1
DB_USER=postgres
DB_PASSWORD=your_password

# IA Principal (requerido para análisis de imágenes)
ANTHROPIC_API_KEY=

# Transcripción de Audio (elige UNO)
TRANSCRIPTION_PROVIDER=assemblyai
ASSEMBLYAI_API_KEY=
# O
# OPENAI_API_KEY=
# O
# DEEPGRAM_API_KEY=
# O
# GOOGLE_CLOUD_KEY_PATH=/path/to/service-account.json

# Servidor
PORT=3000
EOF
    echo "✅ Archivo .env creado. Por favor edítalo con tus API keys:"
    echo "   nano .env"
else
    echo "⚠️  .env ya existe. Asegúrate de agregar:"
    echo ""
    echo "# Transcripción (agregar una de estas líneas)"
    echo "TRANSCRIPTION_PROVIDER=assemblyai"
    echo "ASSEMBLYAI_API_KEY=tu_api_key_aqui"
    echo ""
fi

# ================================================================
# 4. CREAR DIRECTORIO DE UPLOADS
# ================================================================

echo ""
echo "📁 Creando directorio de uploads..."
mkdir -p uploads
chmod 755 uploads
echo "✅ Directorio uploads creado"

# ================================================================
# 5. FRONTEND (verificar)
# ================================================================

echo ""
echo "🎨 Verificando frontend..."
cd ../official-sw1p1

if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias del frontend..."
    npm install
fi

echo "✅ Frontend listo"

# ================================================================
# 6. RESUMEN
# ================================================================

echo ""
echo "================================================================"
echo "✅ SETUP COMPLETADO"
echo "================================================================"
echo ""
echo "Archivos creados:"
echo "  ✅ backend-p1sw1/database/multimodal-schema.sql"
echo "  ✅ backend-p1sw1/services/transcription.service.ts"
echo "  ✅ backend-p1sw1/middleware/upload.middleware.ts"
echo "  ✅ backend-p1sw1/controller/chat-ia-multimodal.controller.ts"
echo "  ✅ official-sw1p1/src/app/diagramador/chat-ia/audio-recorder.service.ts"
echo "  ✅ official-sw1p1/src/app/diagramador/chat-ia/chat-attachments.component.ts"
echo ""
echo "Próximos pasos:"
echo ""
echo "1. Editar backend-p1sw1/.env con tus API keys"
echo "   - ANTHROPIC_API_KEY (requerido)"
echo "   - ASSEMBLYAI_API_KEY o OPENAI_API_KEY (para transcripción)"
echo ""
echo "2. Iniciar backend:"
echo "   cd backend-p1sw1"
echo "   npm start"
echo ""
echo "3. Iniciar frontend:"
echo "   cd official-sw1p1"
echo "   npm start"
echo ""
echo "4. Abrir http://localhost:4200"
echo ""
echo "5. Probar funcionalidad:"
echo "   - Entrar a una sala"
echo "   - Abrir chat IA (botón flotante)"
echo "   - Click en 🎤 para grabar audio"
echo "   - Click en 📷 para subir imagen"
echo ""
echo "📚 Documentación:"
echo "   - README.md (actualizado)"
echo "   - INSTALACION_MULTIMODAL.md"
echo "   - GUIA_USO_MULTIMODAL.md"
echo "   - RESUMEN_IMPLEMENTACION.md"
echo "   - EJEMPLO_INTEGRACION.ts"
echo ""
echo "🎉 ¡Listo para usar!"
echo "================================================================"
