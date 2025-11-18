#!/bin/bash

# Script de verificação do ambiente Docker

echo "🔍 Verificando ambiente Docker para Voice Meter..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de erros
ERRORS=0

# Verifica Docker
echo -n "Verificando Docker... "
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
    docker --version
else
    echo -e "${RED}✗${NC}"
    echo "  Docker não está instalado!"
    ERRORS=$((ERRORS+1))
fi
echo ""

# Verifica Docker Compose
echo -n "Verificando Docker Compose... "
if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
    docker-compose --version
else
    echo -e "${RED}✗${NC}"
    echo "  Docker Compose não está instalado!"
    ERRORS=$((ERRORS+1))
fi
echo ""

# Verifica se Docker daemon está rodando
echo -n "Verificando Docker daemon... "
if docker info &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "  Docker daemon não está rodando!"
    ERRORS=$((ERRORS+1))
fi
echo ""

# Verifica arquivos necessários
echo "Verificando arquivos necessários:"

FILES=(
    "docker-compose.yml"
    "backend/Dockerfile"
    "backend/requirements.txt"
    "mobile/Dockerfile"
    "mobile/package.json"
)

for file in "${FILES[@]}"; do
    echo -n "  $file... "
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
        ERRORS=$((ERRORS+1))
    fi
done
echo ""

# Verifica docker-compose.yml
echo -n "Validando docker-compose.yml... "
if docker-compose config > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "  Arquivo docker-compose.yml inválido!"
    ERRORS=$((ERRORS+1))
fi
echo ""

# Verifica portas
echo "Verificando portas disponíveis:"

PORTS=(8000 5432 19000 19006 8081)

for port in "${PORTS[@]}"; do
    echo -n "  Porta $port... "
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠ Em uso${NC}"
    else
        echo -e "${GREEN}✓ Disponível${NC}"
    fi
done
echo ""

# Resumo
echo "========================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✨ Tudo pronto para rodar!${NC}"
    echo ""
    echo "Execute:"
    echo "  docker-compose up"
    echo ""
    echo "Ou use o script de início rápido:"
    echo "  ./start-docker.sh"
else
    echo -e "${RED}❌ Encontrados $ERRORS erro(s)${NC}"
    echo "Corrija os problemas acima antes de continuar."
    exit 1
fi
echo "========================================="
