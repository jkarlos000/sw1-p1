#!/bin/bash

# =====================================================
# SCRIPT DE BACKUP AUTOMÁTICO PARA VPS
# Backup completo de PostgreSQL + datos del proyecto
# =====================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables de configuración
BACKUP_DIR="/backups/docker-uml-flutter"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"
TAR_BACKUP="$BACKUP_DIR/backup_$DATE.tar.gz"
LOG_FILE="$BACKUP_DIR/backup_$DATE.log"

# Crear directorio de backup si no existe
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}INICIANDO BACKUP DE BASE DE DATOS${NC}"
echo -e "${YELLOW}========================================${NC}"
echo "Timestamp: $DATE" | tee "$LOG_FILE"
echo ""

# =====================================================
# BACKUP 1: BACKUP LÓGICO (DUMP SQL)
# =====================================================

echo -e "${YELLOW}[1/4] Iniciando dump SQL completo...${NC}"

if docker-compose exec -T postgres pg_dump -U postgres -d parcial1sw1 > "$BACKUP_FILE" 2>> "$LOG_FILE"; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✓ Dump SQL completado: $BACKUP_SIZE${NC}"
    echo "[✓] Dump SQL completado: $BACKUP_SIZE" >> "$LOG_FILE"
else
    echo -e "${RED}✗ Error en dump SQL${NC}"
    echo "[✗] Error en dump SQL" >> "$LOG_FILE"
    exit 1
fi

echo ""

# =====================================================
# BACKUP 2: BACKUP DE VOLÚMENES DOCKER
# =====================================================

echo -e "${YELLOW}[2/4] Comprimiendo datos de volúmenes...${NC}"

if tar -czf "$TAR_BACKUP" \
    -C /var/lib/docker/volumes sw1-postgres-data \
    -C /var/lib/docker/volumes sw1-backend-uploads \
    2>> "$LOG_FILE"; then
    TAR_SIZE=$(du -h "$TAR_BACKUP" | cut -f1)
    echo -e "${GREEN}✓ Compresión completada: $TAR_SIZE${NC}"
    echo "[✓] Compresión completada: $TAR_SIZE" >> "$LOG_FILE"
else
    echo -e "${RED}✗ Error en compresión${NC}"
    echo "[✗] Error en compresión" >> "$LOG_FILE"
    exit 1
fi

echo ""

# =====================================================
# BACKUP 3: INFORMACIÓN DE MIGRACIÓN
# =====================================================

echo -e "${YELLOW}[3/4] Registrando estado de migraciones...${NC}"

MIGRATION_INFO="$BACKUP_DIR/migrations_$DATE.txt"
{
    echo "=== INFORMACIÓN DE MIGRACIONES ==="
    echo "Fecha: $DATE"
    echo ""
    echo "Migraciones ejecutadas:"
    docker-compose exec -T postgres psql -U postgres -d parcial1sw1 -c "SELECT * FROM migration_log ORDER BY executed_at DESC LIMIT 10;" || echo "Tabla migration_log no encontrada"
    echo ""
    echo "Tablas en BD:"
    docker-compose exec -T postgres psql -U postgres -d parcial1sw1 -c "\dt" || echo "Error al listar tablas"
} > "$MIGRATION_INFO" 2>> "$LOG_FILE"

echo -e "${GREEN}✓ Información de migraciones registrada${NC}"
echo "[✓] Información de migraciones registrada" >> "$LOG_FILE"

echo ""

# =====================================================
# RESUMEN DEL BACKUP
# =====================================================

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}BACKUP COMPLETADO EXITOSAMENTE${NC}"
echo -e "${GREEN}========================================${NC}"

echo "Archivos creados:"
echo "  • Dump SQL: $BACKUP_FILE"
echo "  • Volúmenes: $TAR_BACKUP"
echo "  • Migraciones: $MIGRATION_INFO"
echo "  • Log: $LOG_FILE"
echo ""
echo "Tamaño total: $(du -sh "$BACKUP_DIR" | cut -f1)"
echo ""

# =====================================================
# LIMPIEZA DE BACKUPS ANTIGUOS (MÁS DE 7 DÍAS)
# =====================================================

echo -e "${YELLOW}Limpiando backups antiguos (>7 días)...${NC}"

find "$BACKUP_DIR" -type f -name "backup_*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -type f -name "backup_*.tar.gz" -mtime +7 -delete
find "$BACKUP_DIR" -type f -name "migrations_*.txt" -mtime +7 -delete

echo -e "${GREEN}✓ Limpieza completada${NC}"

echo ""
echo -e "${GREEN}[COMPLETADO] Backup finalizado: $DATE${NC}"
echo "[COMPLETADO] Backup finalizado: $DATE" >> "$LOG_FILE"

# =====================================================
# ENVIAR NOTIFICACIÓN (OPCIONAL)
# =====================================================

# Si tienes un email configurado, descomenta:
# echo "Backup completado el $DATE" | mail -s "Backup VPS - Éxito" admin@example.com

exit 0
