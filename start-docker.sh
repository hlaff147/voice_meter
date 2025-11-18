#!/bin/bash

# Script de inicialização rápida do Voice Meter com Docker

echo "🚀 Iniciando Voice Meter com Docker..."
echo ""

# Verifica se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado!"
    echo "Instale Docker em: https://www.docker.com/get-started"
    exit 1
fi

# Verifica se Docker Compose está disponível
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado!"
    echo "Instale Docker Compose em: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker encontrado"
echo "✅ Docker Compose encontrado"
echo ""

# Verifica se há containers rodando
if docker-compose ps | grep -q "Up"; then
    echo "⚠️  Containers já estão rodando!"
    echo ""
    read -p "Deseja reiniciar? (s/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo "🔄 Reiniciando containers..."
        docker-compose down
    else
        echo "Mantendo containers existentes..."
        exit 0
    fi
fi

# Inicia os containers
echo "🐳 Iniciando containers..."
docker-compose up -d

# Aguarda alguns segundos para os serviços iniciarem
echo ""
echo "⏳ Aguardando serviços iniciarem..."
sleep 5

# Mostra status dos containers
echo ""
echo "📊 Status dos containers:"
docker-compose ps

echo ""
echo "✨ Pronto! Serviços disponíveis em:"
echo ""
echo "  🔹 Backend API: http://localhost:8000"
echo "  🔹 API Docs: http://localhost:8000/docs"
echo "  🔹 Mobile/Web: http://localhost:19006"
echo "  🔹 PostgreSQL: localhost:5432"
echo ""
echo "📝 Comandos úteis:"
echo "  • Ver logs: docker-compose logs -f"
echo "  • Parar: docker-compose down"
echo "  • Reiniciar: docker-compose restart"
echo ""
echo "💡 Use 'make help' para ver todos os comandos disponíveis"
