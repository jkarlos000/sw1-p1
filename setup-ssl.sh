#!/bin/bash

# Script para configurar SSL con Let's Encrypt
# Dominio: uml.jkhoster.com

set -e

DOMAIN="uml.jkhoster.com"
EMAIL="tu-email@ejemplo.com"  # CAMBIAR ESTO

echo "🔐 Configurando SSL para $DOMAIN"

# 1. Crear directorios para Certbot
echo "📁 Creando directorios..."
mkdir -p ./certbot/conf
mkdir -p ./certbot/www

# 2. Obtener certificado SSL (primera vez)
echo "🔄 Obteniendo certificado SSL de Let's Encrypt..."
docker-compose run --rm certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  -d $DOMAIN

# 3. Verificar que se crearon los certificados
if [ -f "./certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
    echo "✅ Certificados SSL creados exitosamente en:"
    echo "   - ./certbot/conf/live/$DOMAIN/fullchain.pem"
    echo "   - ./certbot/conf/live/$DOMAIN/privkey.pem"
else
    echo "❌ Error: No se pudieron crear los certificados"
    exit 1
fi

# 4. Reiniciar Nginx para cargar los certificados
echo "🔄 Reiniciando Nginx..."
docker-compose restart nginx

# 5. Verificar que Nginx está corriendo con SSL
echo "🔍 Verificando configuración..."
sleep 5
if docker-compose exec nginx nginx -t; then
    echo "✅ Nginx configurado correctamente con SSL"
else
    echo "❌ Error en la configuración de Nginx"
    exit 1
fi

echo ""
echo "🎉 ¡SSL configurado exitosamente!"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Visita https://$DOMAIN en tu navegador"
echo "   2. Verifica que el candado SSL aparece en la barra de direcciones"
echo "   3. El certificado se renovará automáticamente cada 12 horas"
echo ""
echo "🔄 Para renovar manualmente:"
echo "   docker-compose run --rm certbot renew"
echo ""
