#!/bin/bash

# =====================================================
# SCRIPT DE VERIFICACIÓN PRE-DEPLOY
# Verifica que todo esté listo antes de desplegar a VPS
# =====================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       VERIFICACIÓN PRE-DEPLOY PARA VPS                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Contadores
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# =====================================================
# FUNCIÓN: Verificar
# =====================================================

check() {
    local name="$1"
    local cmd="$2"
    local required="${3:-true}"  # true o false
    
    printf "%-50s" "$name"
    
    if eval "$cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        ((CHECKS_PASSED++))
        return 0
    else
        if [ "$required" == "true" ]; then
            echo -e "${RED}✗${NC}"
            ((CHECKS_FAILED++))
        else
            echo -e "${YELLOW}⚠${NC}"
            ((CHECKS_WARNING++))
        fi
        return 1
    fi
}

# =====================================================
# VERIFICACIONES: HERRAMIENTAS
# =====================================================

echo -e "${YELLOW}[HERRAMIENTAS]${NC}"

check "Git instalado" "git --version" true
check "Node.js 18+" "node -v | grep -E 'v(1[8-9]|[2-9][0-9])'" true
check "npm instalado" "npm -v" true
check "Docker instalado" "docker --version" true
check "Docker Compose instalado" "docker-compose --version" true

echo ""

# =====================================================
# VERIFICACIONES: CÓDIGO
# =====================================================

echo -e "${YELLOW}[CÓDIGO FUENTE]${NC}"

# Backend
check "Backend existe" "[ -d 'backend-p1sw1' ]" true
check "Backend package.json existe" "[ -f 'backend-p1sw1/package.json' ]" true
check "Backend Dockerfile existe" "[ -f 'backend-p1sw1/Dockerfile' ]" true
check "Backend puede instalar" "cd backend-p1sw1 && npm install > /dev/null 2>&1 && cd .." true
check "Backend puede compilar" "cd backend-p1sw1 && npm run build > /dev/null 2>&1 && cd .." true

echo ""

# Frontend
check "Frontend existe" "[ -d 'official-sw1p1' ]" true
check "Frontend package.json existe" "[ -f 'official-sw1p1/package.json' ]" true
check "Frontend Dockerfile existe" "[ -f 'official-sw1p1/Dockerfile' ]" true
check "Frontend puede instalar" "cd official-sw1p1 && npm install > /dev/null 2>&1 && cd .." true
check "Frontend puede compilar" "cd official-sw1p1 && npm run build > /dev/null 2>&1 && cd .." true

echo ""

# =====================================================
# VERIFICACIONES: BASE DE DATOS
# =====================================================

echo -e "${YELLOW}[BASE DE DATOS]${NC}"

check "Database folder existe" "[ -d 'backend-p1sw1/database' ]" true
check "schema.sql existe" "[ -f 'backend-p1sw1/database/schema.sql' ]" true
check "migration-flutter-screens.sql existe" "[ -f 'backend-p1sw1/database/migration-flutter-screens.sql' ]" true
check "backup-vps.sh existe" "[ -f 'backend-p1sw1/database/backup-vps.sh' ]" true
check "rollback-flutter.sh existe" "[ -f 'backend-p1sw1/database/rollback-flutter.sh' ]" true

echo ""

# =====================================================
# VERIFICACIONES: CONFIGURACIÓN
# =====================================================

echo -e "${YELLOW}[CONFIGURACIÓN]${NC}"

check "docker-compose.yml existe" "[ -f 'docker-compose.yml' ]" true
check "Docker Compose valido" "docker-compose config > /dev/null 2>&1" true
check "nginx.conf existe" "[ -f 'nginx/nginx.conf' ]" true
check ".gitignore existe" "[ -f '.gitignore' ]" true

# .env (puede no existir)
if [ -f '.env' ]; then
    check ".env existe" "[ -f '.env' ]" false
else
    echo -e "%-50s${YELLOW}⚠${NC} (.env no encontrado, usará valores por defecto)" ".env"
    ((CHECKS_WARNING++))
fi

echo ""

# =====================================================
# VERIFICACIONES: DOCUMENTACIÓN
# =====================================================

echo -e "${YELLOW}[DOCUMENTACIÓN]${NC}"

check "README.md existe" "[ -f 'README.md' ]" false
check "DEPLOY_VPS_MIGRACION.md existe" "[ -f 'DEPLOY_VPS_MIGRACION.md' ]" false
check "INDICE_DOCUMENTACION.md existe" "[ -f 'INDICE_DOCUMENTACION.md' ]" false
check "START.md existe" "[ -f 'START.md' ]" false

echo ""

# =====================================================
# VERIFICACIONES: GIT
# =====================================================

echo -e "${YELLOW}[GIT]${NC}"

check "Es repositorio Git" "git rev-parse --git-dir > /dev/null 2>&1" true
check "Cambios commiteados" "[ -z \"\$(git status --porcelain)\" ]" false

if [ -z "$(git status --porcelain)" ]; then
    echo -e "%-50s${GREEN}✓${NC}" "Cambios commiteados"
else
    echo -e "%-50s${YELLOW}⚠${NC} (Hay cambios sin commitear)" "Cambios commiteados"
    ((CHECKS_WARNING++))
fi

check "Conectado a origin" "git remote -v | grep -q origin" true

echo ""

# =====================================================
# VERIFICACIONES: PERMISOS
# =====================================================

echo -e "${YELLOW}[PERMISOS Y SEGURIDAD]${NC}"

check "Scripts ejecutables" "[ -x 'backend-p1sw1/database/backup-vps.sh' ] || [ -f 'backend-p1sw1/database/backup-vps.sh' ]" false
check ".env no está en git" "! git ls-files | grep -q '^\\.env$'" false
check "node_modules no en git" "! git ls-files | grep -q 'node_modules'" false
check "Documentación protegida" "[ -f '.gitignore' ] && grep -q '^\\.env$' .gitignore" false

echo ""

# =====================================================
# VERIFICACIONES: CALIDAD DE CÓDIGO
# =====================================================

echo -e "${YELLOW}[CALIDAD DE CÓDIGO]${NC}"

check "Backend sin errores TypeScript" "cd backend-p1sw1 && npx tsc --noEmit > /dev/null 2>&1 && cd .." false
check "Frontend sin errores TypeScript" "cd official-sw1p1 && npx tsc --noEmit > /dev/null 2>&1 && cd .." false

echo ""

# =====================================================
# RESUMEN FINAL
# =====================================================

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    RESUMEN                                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

TOTAL=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_WARNING))

echo -e "Total verificaciones: $TOTAL"
echo -e "${GREEN}✓ Pasadas: $CHECKS_PASSED${NC}"
echo -e "${YELLOW}⚠ Advertencias: $CHECKS_WARNING${NC}"
echo -e "${RED}✗ Fallidas: $CHECKS_FAILED${NC}"

echo ""

# =====================================================
# DECISIÓN FINAL
# =====================================================

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✓ LISTO PARA DESPLEGAR A VPS                             ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "1. Hacer commit de cambios finales"
    echo "2. Push a origin/main (si no está)"
    echo "3. En VPS: git pull"
    echo "4. En VPS: ./backend-p1sw1/database/backup-vps.sh"
    echo "5. En VPS: docker-compose down && docker-compose up -d"
    echo "6. En VPS: Verificar migraciones en DEPLOY_VPS_MIGRACION.md"
    echo ""
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ✗ NO ESTÁ LISTO PARA DESPLEGAR                           ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Soluciona los errores marcados con ✗ antes de desplegar"
    echo ""
    exit 1
fi
