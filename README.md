# Voice Meter

A full-stack application with FastAPI backend and React Native (Expo) mobile frontend.

## Project Structure

```
voice_meter/
├── backend/          # FastAPI backend
├── mobile/           # React Native (Expo) mobile app
└── database/         # Database scripts and migrations
```

## 🐳 Quick Start com Docker (Recomendado)

### Pré-requisitos

- [Docker](https://www.docker.com/get-started) instalado
- [Docker Compose](https://docs.docker.com/compose/install/) instalado

### Rodar tudo com um comando

```bash
docker-compose up
```

✨ **Pronto!** Isso vai iniciar:
- **Backend API (FastAPI)** → http://localhost:8000
- **API Docs** → http://localhost:8000/docs
- **Mobile/Web (Expo)** → http://localhost:19006
- **PostgreSQL Database** → localhost:5432

### Comandos úteis

```bash
# Verificar se está tudo pronto
./check-docker.sh

# Iniciar com script interativo
./start-docker.sh

# Ver logs
docker-compose logs -f

# Parar tudo
docker-compose down

# Usar Makefile (mais fácil)
make up      # Inicia
make down    # Para
make logs    # Logs
make help    # Ver todos comandos
```

📖 **Documentação completa**: 
- [Guia Docker](DOCKER.md) - Setup completo
- [Quick Reference](DOCKER-QUICKREF.md) - Referência rápida
- [Troubleshooting](TROUBLESHOOTING-DOCKER.md) - Resolver problemas

---

## 🔧 Development Without Docker

If you need to run without Docker, you can manually set up conda environments. See the individual component READMEs:
- [Backend Setup](backend/README.md)
- [Mobile Setup](mobile/README.md)

## Development

### Backend (FastAPI)
- **Framework**: FastAPI
- **Database**: PostgreSQL (via SQLAlchemy)
- **API Docs**: http://localhost:8000/docs
- **Testing**: Run `make test` or `docker-compose exec backend pytest`

### Frontend (React Native + Expo)
- **Framework**: React Native with Expo
- **Routing**: Expo Router (file-based)
- **Language**: TypeScript
- **HTTP Client**: Axios
- **Platforms**: Web, iOS, Android

Access the running app:
- **Web Browser**: http://localhost:19006
- **Mobile**: Scan QR code with Expo Go app
- **iOS Simulator**: Press `i` in the mobile container logs
- **Android Emulator**: Press `a` in the mobile container logs

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Docker Commands

Quick reference for common Docker operations:

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild containers
docker-compose up --build

# Run backend tests
make test

# See all available commands
make help
```

For more Docker commands, see [QUICKSTART.md](QUICKSTART.md) or run `make help`.

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request
