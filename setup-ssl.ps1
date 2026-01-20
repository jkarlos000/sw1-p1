# Script para configurar SSL con Let's Encrypt (PowerShell)
# Dominio: uml.jkhoster.com

$DOMAIN = "uml.jkhoster.com"
$EMAIL = "tu-email@ejemplo.com"  # CAMBIAR ESTO

Write-Host "🔐 Configurando SSL para $DOMAIN" -ForegroundColor Cyan

# 1. Crear directorios para Certbot
Write-Host "📁 Creando directorios..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path ".\certbot\conf" | Out-Null
New-Item -ItemType Directory -Force -Path ".\certbot\www" | Out-Null

# 2. Obtener certificado SSL (primera vez)
Write-Host "🔄 Obteniendo certificado SSL de Let's Encrypt..." -ForegroundColor Yellow
docker-compose run --rm certbot certonly --webroot `
  --webroot-path=/var/www/certbot `
  --email $EMAIL `
  --agree-tos `
  --no-eff-email `
  -d $DOMAIN

# 3. Verificar que se crearon los certificados
if (Test-Path ".\certbot\conf\live\$DOMAIN\fullchain.pem") {
    Write-Host "✅ Certificados SSL creados exitosamente en:" -ForegroundColor Green
    Write-Host "   - .\certbot\conf\live\$DOMAIN\fullchain.pem" -ForegroundColor Green
    Write-Host "   - .\certbot\conf\live\$DOMAIN\privkey.pem" -ForegroundColor Green
} else {
    Write-Host "❌ Error: No se pudieron crear los certificados" -ForegroundColor Red
    exit 1
}

# 4. Reiniciar Nginx para cargar los certificados
Write-Host "🔄 Reiniciando Nginx..." -ForegroundColor Yellow
docker-compose restart nginx

# 5. Verificar que Nginx está corriendo con SSL
Write-Host "🔍 Verificando configuración..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
docker-compose exec nginx nginx -t
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Nginx configurado correctamente con SSL" -ForegroundColor Green
} else {
    Write-Host "❌ Error en la configuración de Nginx" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 ¡SSL configurado exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Visita https://$DOMAIN en tu navegador"
Write-Host "   2. Verifica que el candado SSL aparece en la barra de direcciones"
Write-Host "   3. El certificado se renovará automáticamente cada 12 horas"
Write-Host ""
Write-Host "🔄 Para renovar manualmente:" -ForegroundColor Yellow
Write-Host "   docker-compose run --rm certbot renew"
Write-Host ""
