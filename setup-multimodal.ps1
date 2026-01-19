# ================================================================
# SCRIPT DE INSTALACIÓN Y SETUP - CHAT MULTIMODAL (PowerShell)
# ================================================================

Write-Host "🚀 Iniciando setup de Chat Multimodal..." -ForegroundColor Green

# ================================================================
# 1. BACKEND - Dependencias NPM
# ================================================================

Write-Host ""
Write-Host "📦 Instalando dependencias del backend..." -ForegroundColor Cyan
Set-Location backend-p1sw1

npm install multer @types/multer form-data axios

# Opcional: Google Cloud Speech
$install_google = Read-Host "¿Instalar Google Cloud Speech? (s/n)"
if ($install_google -eq "s") {
    npm install @google-cloud/speech
}

# Opcional: Sharp
$install_sharp = Read-Host "¿Instalar Sharp (procesamiento de imágenes)? (s/n)"
if ($install_sharp -eq "s") {
    npm install sharp
}

Write-Host "✅ Dependencias del backend instaladas" -ForegroundColor Green

# ================================================================
# 2. BASE DE DATOS - Aplicar Schema
# ================================================================

Write-Host ""
Write-Host "🗄️  Aplicando schema de base de datos..." -ForegroundColor Cyan

# Detectar contenedor de PostgreSQL
$containers = docker ps --filter "name=postgres" --format "{{.Names}}"
$POSTGRES_CONTAINER = $containers | Select-Object -First 1

if ([string]::IsNullOrEmpty($POSTGRES_CONTAINER)) {
    Write-Host "⚠️  No se encontró contenedor de PostgreSQL" -ForegroundColor Yellow
    Write-Host "Ejecuta: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "Contenedor encontrado: $POSTGRES_CONTAINER" -ForegroundColor Green

# Aplicar schema multimodal
Get-Content database\multimodal-schema.sql | docker exec -i $POSTGRES_CONTAINER psql -U postgres -d parcial1sw1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Schema multimodal aplicado exitosamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error aplicando schema" -ForegroundColor Red
    exit 1
}

# ================================================================
# 3. VARIABLES DE ENTORNO
# ================================================================

Write-Host ""
Write-Host "🔧 Configurando variables de entorno..." -ForegroundColor Cyan

if (-not (Test-Path .env)) {
    Write-Host "Creando archivo .env..." -ForegroundColor Yellow
    
    $envContent = @"
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
# GOOGLE_CLOUD_KEY_PATH=C:\path\to\service-account.json

# Servidor
PORT=3000
"@
    
    Set-Content -Path .env -Value $envContent
    
    Write-Host "✅ Archivo .env creado. Por favor edítalo con tus API keys:" -ForegroundColor Green
    Write-Host "   notepad .env" -ForegroundColor White
} else {
    Write-Host "⚠️  .env ya existe. Asegúrate de agregar:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "# Transcripción (agregar una de estas líneas)" -ForegroundColor White
    Write-Host "TRANSCRIPTION_PROVIDER=assemblyai" -ForegroundColor White
    Write-Host "ASSEMBLYAI_API_KEY=tu_api_key_aqui" -ForegroundColor White
    Write-Host ""
}

# ================================================================
# 4. CREAR DIRECTORIO DE UPLOADS
# ================================================================

Write-Host ""
Write-Host "📁 Creando directorio de uploads..." -ForegroundColor Cyan
if (-not (Test-Path uploads)) {
    New-Item -ItemType Directory -Path uploads | Out-Null
}
Write-Host "✅ Directorio uploads creado" -ForegroundColor Green

# ================================================================
# 5. FRONTEND (verificar)
# ================================================================

Write-Host ""
Write-Host "🎨 Verificando frontend..." -ForegroundColor Cyan
Set-Location ..\official-sw1p1

if (-not (Test-Path node_modules)) {
    Write-Host "📦 Instalando dependencias del frontend..." -ForegroundColor Yellow
    npm install
}

Write-Host "✅ Frontend listo" -ForegroundColor Green

# ================================================================
# 6. RESUMEN
# ================================================================

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "✅ SETUP COMPLETADO" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Archivos creados:" -ForegroundColor White
Write-Host "  ✅ backend-p1sw1\database\multimodal-schema.sql" -ForegroundColor Green
Write-Host "  ✅ backend-p1sw1\services\transcription.service.ts" -ForegroundColor Green
Write-Host "  ✅ backend-p1sw1\middleware\upload.middleware.ts" -ForegroundColor Green
Write-Host "  ✅ backend-p1sw1\controller\chat-ia-multimodal.controller.ts" -ForegroundColor Green
Write-Host "  ✅ official-sw1p1\src\app\diagramador\chat-ia\audio-recorder.service.ts" -ForegroundColor Green
Write-Host "  ✅ official-sw1p1\src\app\diagramador\chat-ia\chat-attachments.component.ts" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Editar backend-p1sw1\.env con tus API keys" -ForegroundColor White
Write-Host "   - ANTHROPIC_API_KEY (requerido)" -ForegroundColor Gray
Write-Host "   - ASSEMBLYAI_API_KEY o OPENAI_API_KEY (para transcripción)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Iniciar backend:" -ForegroundColor White
Write-Host "   cd backend-p1sw1" -ForegroundColor Gray
Write-Host "   npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Iniciar frontend (en otra terminal):" -ForegroundColor White
Write-Host "   cd official-sw1p1" -ForegroundColor Gray
Write-Host "   npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Abrir http://localhost:4200" -ForegroundColor White
Write-Host ""
Write-Host "5. Probar funcionalidad:" -ForegroundColor White
Write-Host "   - Entrar a una sala" -ForegroundColor Gray
Write-Host "   - Abrir chat IA (botón flotante)" -ForegroundColor Gray
Write-Host "   - Click en 🎤 para grabar audio" -ForegroundColor Gray
Write-Host "   - Click en 📷 para subir imagen" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 Documentación:" -ForegroundColor Yellow
Write-Host "   - README.md (actualizado)" -ForegroundColor Gray
Write-Host "   - INSTALACION_MULTIMODAL.md" -ForegroundColor Gray
Write-Host "   - GUIA_USO_MULTIMODAL.md" -ForegroundColor Gray
Write-Host "   - RESUMEN_IMPLEMENTACION.md" -ForegroundColor Gray
Write-Host "   - EJEMPLO_INTEGRACION.ts" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 ¡Listo para usar!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan

# Volver al directorio raíz
Set-Location ..
