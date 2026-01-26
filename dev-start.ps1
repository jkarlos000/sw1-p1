# Script para iniciar desarrollo local en Windows

Write-Host "🚀 Iniciando entorno de desarrollo..." -ForegroundColor Cyan

# Verificar que estamos en la raíz del proyecto
if (-not (Test-Path "backend-p1sw1") -or -not (Test-Path "official-sw1p1")) {
    Write-Host "❌ Error: Ejecuta este script desde la raíz del proyecto" -ForegroundColor Red
    exit 1
}

# Verificar PostgreSQL
Write-Host "📊 Verificando PostgreSQL..." -ForegroundColor Yellow
$postgresRunning = $false

# Verificar Docker
$dockerPs = docker ps 2>$null | Select-String "postgres"
if ($dockerPs) {
    Write-Host "✅ PostgreSQL corriendo en Docker" -ForegroundColor Green
    $postgresRunning = $true
}

# Verificar PostgreSQL local
if (-not $postgresRunning) {
    $pgTest = Test-NetConnection -ComputerName localhost -Port 5432 -InformationLevel Quiet
    if ($pgTest) {
        Write-Host "✅ PostgreSQL corriendo localmente" -ForegroundColor Green
        $postgresRunning = $true
    }
}

# Si no está corriendo, iniciar con Docker
if (-not $postgresRunning) {
    Write-Host "⚠️  PostgreSQL no detectado. Iniciando con Docker..." -ForegroundColor Yellow
    docker-compose up -d postgres
    Start-Sleep -Seconds 3
}

# Crear carpeta de logs si no existe
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

# Iniciar backend en nueva ventana de PowerShell
Write-Host "🔧 Iniciando backend en nueva ventana..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend-p1sw1; Write-Host '🔧 BACKEND' -ForegroundColor Cyan; npm run dev"

# Esperar a que backend esté listo
Write-Host "⏳ Esperando backend..." -ForegroundColor Yellow
$backendReady = $false
for ($i = 1; $i -le 15; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 1 -ErrorAction SilentlyContinue
        Write-Host "✅ Backend listo en http://localhost:3000" -ForegroundColor Green
        $backendReady = $true
        break
    } catch {
        Write-Host "   Intento $i/15..." -NoNewline
        Start-Sleep -Seconds 1
        Write-Host "`r" -NoNewline
    }
}

if (-not $backendReady) {
    Write-Host "⚠️  Backend no responde. Verifica la ventana del backend." -ForegroundColor Yellow
}

# Iniciar frontend
Write-Host "🎨 Iniciando frontend..." -ForegroundColor Cyan
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "  FRONTEND (este terminal)" -ForegroundColor White
Write-Host "  http://localhost:4200" -ForegroundColor Blue
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

cd official-sw1p1
ng serve
