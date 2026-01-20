# Script para cambiar entre configuración de desarrollo y producción (PowerShell)

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "prod")]
    [string]$Mode
)

if ($Mode -eq "dev") {
    Write-Host "🔧 Configurando para DESARROLLO LOCAL..." -ForegroundColor Cyan
    
    # Config.json para desarrollo
    @"
{
  "apiUrl": "http://localhost:3000",
  "wsUrl": "http://localhost:3000"
}
"@ | Out-File -FilePath ".\official-sw1p1\src\assets\config.json" -Encoding utf8
    
    Write-Host "✅ config.json actualizado → http://localhost:3000" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Para desarrollo local:" -ForegroundColor Yellow
    Write-Host "   1. Terminal 1: cd backend-p1sw1; npm start"
    Write-Host "   2. Terminal 2: cd official-sw1p1; ng serve"
    Write-Host "   3. Visita: http://localhost:4200"
    
} elseif ($Mode -eq "prod") {
    Write-Host "🚀 Configurando para PRODUCCIÓN (uml.jkhoster.com)..." -ForegroundColor Cyan
    
    # Config.json para producción
    @"
{
  "apiUrl": "https://uml.jkhoster.com/api",
  "wsUrl": "https://uml.jkhoster.com"
}
"@ | Out-File -FilePath ".\official-sw1p1\src\assets\config.json" -Encoding utf8
    
    Write-Host "✅ config.json actualizado → https://uml.jkhoster.com/api" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Para desplegar en producción:" -ForegroundColor Yellow
    Write-Host "   1. Asegúrate de tener .env configurado"
    Write-Host "   2. .\setup-ssl.ps1  (si no tienes SSL aún)"
    Write-Host "   3. docker-compose up -d --build"
    Write-Host "   4. Visita: https://uml.jkhoster.com"
}

Write-Host ""
