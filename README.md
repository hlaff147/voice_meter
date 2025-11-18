# Voice Meter

A full-stack application with FastAPI backend and React Native (Expo) mobile frontend.

## Project Structure

```
voice_meter/
├── backend/          # FastAPI backend
├── mobile/           # React Native (Expo) mobile app
├── database/         # Database scripts and migrations
└── scripts/          # Utility scripts
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

## 🔧 Quick Start sem Docker (Conda)

### Prerequisites

- [Conda](https://docs.conda.io/en/latest/miniconda.html) installed
- [Git](https://git-scm.com/)

### Automated Setup (Recommended)

**One command to set up everything:**

Windows PowerShell:
```powershell
cd scripts
.\setup_all.ps1
```

Linux/Mac:
```bash
cd scripts
./setup_all.sh
```

This will create both conda environments and install all dependencies.

### Running the Application

**Option 1: Start both services together (Recommended)**

Windows:
```powershell
cd scripts
.\start_all.ps1
```

Linux/Mac:
```bash
cd scripts
./start_all.sh
```

This opens two terminal windows - one for backend, one for mobile.

**Option 2: Start services separately**

Backend only (Terminal 1):
```powershell
cd scripts
.\start_backend.ps1  # or ./start_backend.sh
```

Web Frontend (Terminal 2):
```powershell
cd scripts
.\start_web.ps1  # or ./start_web.sh
```

Or Mobile App (Terminal 2):
```powershell
cd scripts
.\start_mobile.ps1  # or ./start_mobile.sh
```

### Access Points

- **Backend API**: http://localhost:8000
- **API Documentation (Swagger)**: http://localhost:8000/docs
- **API Documentation (ReDoc)**: http://localhost:8000/redoc
- **Web Frontend**: http://localhost:8081 (when using `start_web.ps1` or press 'w' in `start_mobile.ps1`)
- **Mobile App**: Scan QR code with Expo Go or press 'a'/'i' in `start_mobile.ps1`

### Manual Setup

If you prefer to set up manually:

<details>
<summary>Backend Setup</summary>

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate the conda environment:
```bash
conda env create -f environment.yml
conda activate voice_meter_backend
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Run the backend:
```bash
python main.py
```

See [backend/README.md](backend/README.md) for more details.
</details>

<details>
<summary>Mobile Setup</summary>

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Create and activate the conda environment:
```bash
conda env create -f environment.yml
conda activate voice_meter_mobile
```

3. Install dependencies:
```bash
npm install
```

4. Copy environment variables:
```bash
cp .env.example .env
```

5. Start the mobile app:
```bash
npm start
```

See [mobile/README.md](mobile/README.md) for more details.
</details>

## Development

### Backend (FastAPI)
- **Framework**: FastAPI
- **Database**: PostgreSQL (via SQLAlchemy)
- **API Docs**: http://localhost:8000/docs
- **Testing**: pytest

### Frontend (React Native + Expo)
- **Framework**: React Native with Expo
- **Routing**: Expo Router (file-based)
- **Language**: TypeScript
- **HTTP Client**: Axios
- **Platforms**: Web, iOS, Android

#### Running the Frontend

You have **3 options** to run the frontend:

**1. Web Browser (Easiest for Development) 🌐**
```powershell
cd scripts
.\start_web.ps1  # Opens http://localhost:8081
```
- Perfect for rapid development
- No mobile device needed
- Same codebase as mobile

**2. Mobile Phone 📱**
```powershell
cd scripts
.\start_mobile.ps1  # Shows QR code
```
- Install Expo Go on your phone
- Scan QR code with Expo Go (Android) or Camera (iOS)
- Test on real device

**3. Emulator/Simulator 📲**
```powershell
cd scripts
.\start_mobile.ps1
# Then press 'a' for Android or 'i' for iOS
```
- Requires Android Studio or Xcode
- Test without physical device

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Environment Management

This project uses separate conda environments for backend and frontend:

- **Backend**: `voice_meter_backend` (Python 3.11 + FastAPI)
- **Mobile**: `voice_meter_mobile` (Node.js 20.9.0)

Switch between environments:
```bash
conda activate voice_meter_backend  # For backend development
conda activate voice_meter_mobile   # For mobile development
```

## Utility Scripts

All development scripts are located in the `scripts/` directory. Each script has both Windows (`.ps1`) and Linux/Mac (`.sh`) versions.

| Script | Purpose | Command (Windows) | Command (Linux/Mac) |
|--------|---------|-------------------|---------------------|
| **setup_all** | Complete project setup | `.\setup_all.ps1` | `./setup_all.sh` |
| **start_all** | Start both services | `.\start_all.ps1` | `./start_all.sh` |
| **start_backend** | Start backend only | `.\start_backend.ps1` | `./start_backend.sh` |
| **start_mobile** | Start mobile only | `.\start_mobile.ps1` | `./start_mobile.sh` |
| **start_web** | Start web frontend only | `.\start_web.ps1` | `./start_web.sh` |
| **test_backend** | Run backend tests | `.\test_backend.ps1` | `./test_backend.sh` |

See [scripts/README.md](scripts/README.md) for detailed documentation.

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request

## Troubleshooting

Having issues? Check the [Troubleshooting Guide](TROUBLESHOOTING.md) for common problems and solutions.

## License

MIT