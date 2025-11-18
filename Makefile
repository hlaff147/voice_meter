.PHONY: help up down build logs clean restart backend-logs mobile-logs db-logs backend-shell mobile-shell test

help: ## Mostra esta mensagem de ajuda
	@echo "Voice Meter - Comandos Docker"
	@echo ""
	@echo "Uso: make [comando]"
	@echo ""
	@echo "Comandos disponíveis:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

up: ## Inicia todos os serviços
	docker-compose up

up-d: ## Inicia todos os serviços em background
	docker-compose up -d

down: ## Para todos os serviços
	docker-compose down

build: ## Reconstrói as imagens
	docker-compose build

rebuild: ## Reconstrói e inicia tudo
	docker-compose up --build

logs: ## Mostra logs de todos os serviços
	docker-compose logs -f

backend-logs: ## Mostra logs do backend
	docker-compose logs -f backend

mobile-logs: ## Mostra logs do mobile
	docker-compose logs -f mobile

db-logs: ## Mostra logs do banco de dados
	docker-compose logs -f db

backend-shell: ## Acessa shell do container backend
	docker-compose exec backend bash

mobile-shell: ## Acessa shell do container mobile
	docker-compose exec mobile sh

db-shell: ## Acessa shell do PostgreSQL
	docker-compose exec db psql -U voice_meter_user -d voice_meter_db

test: ## Roda os testes do backend
	docker-compose exec backend pytest

clean: ## Remove containers, volumes e imagens
	docker-compose down -v --rmi all

restart: ## Reinicia todos os serviços
	docker-compose restart

restart-backend: ## Reinicia apenas o backend
	docker-compose restart backend

restart-mobile: ## Reinicia apenas o mobile
	docker-compose restart mobile

restart-db: ## Reinicia apenas o banco
	docker-compose restart db

status: ## Mostra status dos containers
	docker-compose ps

prune: ## Remove recursos Docker não utilizados
	docker system prune -f
