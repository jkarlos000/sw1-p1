#!/bin/bash

# =====================================================
# SCRIPT DE ROLLBACK DE MIGRACIÓN FLUTTER SCREENS
# Permite revertir cambios si algo falla en VPS
# =====================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}ROLLBACK DE MIGRACIÓN FLUTTER SCREENS${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Opciones
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    echo "Uso: ./rollback-flutter.sh [OPCIÓN]"
    echo ""
    echo "Opciones:"
    echo "  full       - Rollback completo (elimina tablas Flutter)"
    echo "  safe       - Rollback seguro (solo migración, preserva datos)"
    echo "  show       - Mostrar estado actual"
    echo "  restore    - Restaurar desde backup"
    echo ""
    exit 0
fi

ROLLBACK_TYPE="${1:-safe}"

# =====================================================
# MOSTRAR ESTADO ACTUAL
# =====================================================

show_status() {
    echo -e "${BLUE}Estado actual de la base de datos:${NC}"
    echo ""
    
    docker-compose exec -T postgres psql -U postgres -d parcial1sw1 << EOF
        \echo '--- MIGRACIONES EJECUTADAS ---'
        SELECT migration_name, executed_at, status FROM migration_log ORDER BY executed_at DESC LIMIT 5;
        
        \echo ''
        \echo '--- TABLAS FLUTTER ---'
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' AND tablename LIKE 'flutter%' 
        ORDER BY tablename;
        
        \echo ''
        \echo '--- REGISTRO DE DATOS ---'
        SELECT 
            'flutter_screen' as tabla, COUNT(*) as registros FROM flutter_screen
        UNION ALL
        SELECT 'flutter_component', COUNT(*) FROM flutter_component;
EOF
}

# =====================================================
# ROLLBACK SEGURO (Recomendado)
# Solo elimina la migración, preserva tablas y datos
# =====================================================

rollback_safe() {
    echo -e "${YELLOW}[ROLLBACK SEGURO] Preservando datos Flutter...${NC}"
    echo ""
    
    docker-compose exec -T postgres psql -U postgres -d parcial1sw1 << EOF
        -- Registrar rollback
        INSERT INTO migration_log (migration_name, status, details) 
        VALUES ('Flutter Screens Rollback (Safe)', 'success', 'Migración revertida. Tablas y datos preservados.');
        
        -- Mostrar resumen
        SELECT 'Rollback Completado' as resultado;
        SELECT COUNT(*) as flutter_screens FROM flutter_screen;
        SELECT COUNT(*) as flutter_components FROM flutter_component;
EOF

    echo -e "${GREEN}✓ Rollback seguro completado${NC}"
    echo "Las tablas Flutter han sido preservadas con todos sus datos"
}

# =====================================================
# ROLLBACK COMPLETO (Peligroso)
# Elimina todas las tablas Flutter y datos
# =====================================================

rollback_full() {
    echo -e "${RED}⚠️  ADVERTENCIA: ROLLBACK COMPLETO${NC}"
    echo -e "${RED}Esto eliminará TODOS los datos Flutter (IRREVERSIBLE)${NC}"
    echo ""
    read -p "Escriba 'confirm' para continuar: " confirmation
    
    if [ "$confirmation" != "confirm" ]; then
        echo "Rollback cancelado"
        exit 1
    fi
    
    echo -e "${YELLOW}[ROLLBACK COMPLETO] Eliminando tablas Flutter...${NC}"
    
    docker-compose exec -T postgres psql -U postgres -d parcial1sw1 << EOF
        -- Hacer backup de datos antes de eliminar
        CREATE TABLE flutter_screen_backup AS SELECT * FROM flutter_screen;
        CREATE TABLE flutter_component_backup AS SELECT * FROM flutter_component;
        
        -- Eliminar dependencias
        DROP INDEX IF EXISTS idx_flutter_component_screen;
        DROP INDEX IF EXISTS idx_flutter_screen_fecha;
        DROP INDEX IF EXISTS idx_flutter_screen_clase;
        
        -- Eliminar vistas
        DROP VIEW IF EXISTS flutter_screens_con_clase;
        
        -- Eliminar tablas
        DROP TABLE IF EXISTS flutter_component;
        DROP TABLE IF EXISTS flutter_screen;
        
        -- Registrar rollback
        INSERT INTO migration_log (migration_name, status, details) 
        VALUES (
            'Flutter Screens Rollback (Full)', 
            'warning', 
            'Tablas eliminadas. Backups creados en flutter_screen_backup y flutter_component_backup'
        );
        
        SELECT 'Rollback Completo Ejecutado' as resultado;
EOF

    echo -e "${GREEN}✓ Rollback completo ejecutado${NC}"
    echo -e "${YELLOW}NOTA: Los datos están en: flutter_screen_backup y flutter_component_backup${NC}"
}

# =====================================================
# RESTAURAR DESDE BACKUP
# =====================================================

restore_from_backup() {
    BACKUP_FILE="${2:-}"
    
    if [ -z "$BACKUP_FILE" ]; then
        echo "Backups disponibles:"
        ls -lh /backups/docker-uml-flutter/backup_*.sql 2>/dev/null || echo "No hay backups disponibles"
        echo ""
        read -p "Ingrese la ruta del backup SQL: " BACKUP_FILE
    fi
    
    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}✗ Archivo de backup no encontrado: $BACKUP_FILE${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Restaurando desde: $BACKUP_FILE${NC}"
    read -p "Esto sobrescribirá la BD actual. Escriba 'confirm': " confirmation
    
    if [ "$confirmation" != "confirm" ]; then
        echo "Restauración cancelada"
        exit 1
    fi
    
    # Parar contenedores
    echo "Deteniendo contenedores..."
    docker-compose down
    
    # Eliminar volumen
    docker volume rm sw1-postgres-data || true
    
    # Recrear
    docker-compose up -d postgres
    sleep 10
    
    # Restaurar
    echo "Restaurando datos..."
    docker-compose exec -T postgres psql -U postgres < "$BACKUP_FILE"
    
    echo -e "${GREEN}✓ Restauración completada${NC}"
    
    # Reiniciar todos
    docker-compose up -d
}

# =====================================================
# EJECUTAR OPCIÓN SELECCIONADA
# =====================================================

case $ROLLBACK_TYPE in
    show)
        show_status
        ;;
    safe)
        rollback_safe
        ;;
    full)
        rollback_full
        ;;
    restore)
        restore_from_backup "$2"
        ;;
    *)
        echo "Opción no reconocida: $ROLLBACK_TYPE"
        echo "Use: ./rollback-flutter.sh --help"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Operación finalizada${NC}"
echo -e "${GREEN}========================================${NC}"

exit 0
