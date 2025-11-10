# Voice Meter - Quick Reference Card

## 🚀 Getting Started (First Time)

```powershell
# 1. Setup everything
cd scripts
.\setup_all.ps1

# 2. Configure (edit these files)
# - backend/.env (database credentials)
# - mobile/.env (API URL)

# 3. Start development
.\start_all.ps1
```

## 📱 Daily Development

### Start Everything
```powershell
cd scripts
.\start_all.ps1
```

### Or Start Separately

**Terminal 1 - Backend:**
```powershell
cd scripts
.\start_backend.ps1
```

**Terminal 2 - Web Frontend (Recommended for Development):**
```powershell
cd scripts
.\start_web.ps1
```

**OR Terminal 2 - Mobile App (For Testing on Phone/Emulator):**
```powershell
cd scripts
.\start_mobile.ps1
```## 🧪 Testing

```powershell
cd scripts
.\test_backend.ps1
```

## 🔗 URLs

- Backend API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs
- API Docs (ReDoc): http://localhost:8000/redoc
- **Web Frontend: http://localhost:8081** ⭐
- Mobile: Expo dev server (scan QR code with Expo Go app)

## 🐛 Troubleshooting

### Mobile can't connect to backend (Android)
Edit `mobile/.env`:
```bash
# Find your IP: run `ipconfig` in terminal
API_URL=http://YOUR_LOCAL_IP:8000/api
# Example: API_URL=http://192.168.1.100:8000/api
```

### Port conflicts
Default ports:
- Backend: 8000
- Expo: 8081

Kill processes if needed:
```powershell
# Find process on port
netstat -ano | findstr :8000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

## 📂 Project Structure

```
voice_meter/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/         # API endpoints
│   │   │   └── endpoints/
│   │   ├── core/        # Configuration
│   │   ├── db/          # Database
│   │   ├── models/      # ORM models
│   │   ├── schemas/     # Pydantic schemas
│   │   └── services/    # Business logic
│   ├── tests/           # Tests
│   ├── main.py          # Entry point
│   └── .env             # Config (create from .env.example)
│
├── mobile/              # React Native + Expo
│   ├── app/            # File-based routing
│   ├── src/
│   │   ├── config/     # Configuration
│   │   └── services/   # API client
│   └── .env            # Config (create from .env.example)
│
└── scripts/            # Utility scripts
    ├── setup_all.*     # Setup everything
    ├── start_all.*     # Start both services
    ├── start_backend.* # Start backend only
    ├── start_mobile.*  # Start mobile only
    └── test_backend.*  # Run tests
```

## 🔄 Conda Environments

**Switch environments:**
```bash
conda activate voice_meter_backend  # For backend work
conda activate voice_meter_mobile   # For mobile work
```

**Update environments:**
```bash
# Backend
cd backend
conda env update -f environment.yml

# Mobile
cd mobile
conda env update -f environment.yml
```

## 📝 Common Commands

### Backend
```bash
# Run server
python main.py

# Run tests
pytest

# Run specific test
pytest tests/test_main.py -v
```

### Mobile
```bash
# Start dev server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web
```

## 🎯 Tips

✅ Use `start_all.ps1` for convenience - launches both in separate windows  
✅ Keep both terminal windows open while developing  
✅ Check logs in each terminal for debugging  
✅ Run tests before committing changes  
✅ For Android: use your computer's local IP, not localhost  
✅ For iOS simulator: localhost works fine  

---

**Need help?** Check the README files:
- Main: `README.md`
- Backend: `backend/README.md`
- Mobile: `mobile/README.md`
- Scripts: `scripts/README.md`
