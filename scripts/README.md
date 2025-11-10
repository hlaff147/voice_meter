# Voice Meter Scripts

This directory contains utility scripts to manage the Voice Meter project. All scripts are available for both Windows (PowerShell) and Linux/Mac (Bash).

## 📋 Available Scripts

### Setup Scripts

#### `setup_all` - Complete Project Setup
Sets up both backend and mobile environments with all dependencies.

**Windows:**
```powershell
.\setup_all.ps1
```

**Linux/Mac:**
```bash
./setup_all.sh
```

**What it does:**
- Creates `voice_meter_backend` conda environment
- Creates `voice_meter_mobile` conda environment
- Installs all Python dependencies for backend
- Installs all npm packages for mobile
- Installs web support (react-native-web, react-dom)
- Creates `.env` files from templates

---

### Start Scripts

#### `start_backend` - Start Backend Only
Starts the FastAPI backend server on http://localhost:8000

**Windows:**
```powershell
.\start_backend.ps1
```

**Linux/Mac:**
```bash
./start_backend.sh
```

**Features:**
- Automatically activates the backend conda environment
- Creates `.env` if missing
- Shows API documentation URLs
- Non-blocking terminal output

---

#### `start_mobile` - Start Mobile Only
Starts the Expo development server for the React Native app

**Windows:**
```powershell
.\start_mobile.ps1
```

**Linux/Mac:**
```bash
./start_mobile.sh
```

**Features:**
- Automatically activates the mobile conda environment
- Installs npm packages if missing
- Creates `.env` if missing
- Provides helpful Android/iOS connection instructions
- Shows QR code for Expo Go
- Supports web, Android, and iOS

---

#### `start_web` - Start Web Frontend Only
Starts the Expo web server and opens the app in your browser

**Windows:**
```powershell
.\start_web.ps1
```

**Linux/Mac:**
```bash
./start_web.sh
```

**Features:**
- Automatically activates the mobile conda environment
- Opens the app in your default browser at http://localhost:8081
- Perfect for quick testing without mobile devices
- Same codebase as mobile app (React Native Web)

---

#### `start_all` - Start Both Services
Opens two separate terminal windows running backend and mobile concurrently

**Windows:**
```powershell
.\start_all.ps1
```

**Linux/Mac:**
```bash
./start_all.sh
```

**Features:**
- Launches backend in new terminal window
- Launches mobile in new terminal window after 3s delay
- Keeps both services running independently
- Easy to manage and monitor each service separately

---

### Test Scripts

#### `test_backend` - Run Backend Tests
Runs the pytest test suite for the backend

**Windows:**
```powershell
.\test_backend.ps1
```

**Linux/Mac:**
```bash
./test_backend.sh
```

**Features:**
- Automatically activates the backend conda environment
- Runs all tests with verbose output
- Shows clear pass/fail status

---

## 🚀 Quick Start Workflow

### First Time Setup

1. **Setup everything:**
   ```powershell
   .\setup_all.ps1
   ```

2. **Configure environments:**
   - Edit `backend/.env` with your database credentials
   - Edit `mobile/.env` with your API URL (use local IP for Android)

3. **Start development:**
   ```powershell
   .\start_all.ps1
   ```

### Daily Development

**Option 1: Start everything together**
```powershell
.\start_all.ps1
```

**Option 2: Start services separately**

Backend (Terminal 1):
```powershell
.\start_backend.ps1
```

Web Frontend (Terminal 2):
```powershell
.\start_web.ps1
```

Or Mobile App (Terminal 2):
```powershell
.\start_mobile.ps1
```

### Running Tests

```powershell
.\test_backend.ps1
```

---

## 📝 Script Organization

```
scripts/
├── setup_all.ps1         # Windows setup
├── setup_all.sh          # Linux/Mac setup
├── start_backend.ps1     # Windows backend starter
├── start_backend.sh      # Linux/Mac backend starter
├── start_mobile.ps1      # Windows mobile starter
├── start_mobile.sh       # Linux/Mac mobile starter
├── start_web.ps1         # Windows web frontend starter
├── start_web.sh          # Linux/Mac web frontend starter
├── start_all.ps1         # Windows start both services
├── start_all.sh          # Linux/Mac start both services
├── test_backend.ps1      # Windows backend tests
├── test_backend.sh       # Linux/Mac backend tests
└── README.md            # This file
```

## 🔧 Troubleshooting

### "conda not found"
Make sure conda is installed and in your PATH. Restart your terminal after installation.

### "environment not found"
Run `setup_all.ps1` (or `.sh`) first to create the conda environments.

### Mobile app can't connect to backend (Android)
Update `mobile/.env` with your computer's local IP address instead of `localhost`:
```
API_URL=http://192.168.1.XXX:8000/api
```

Find your IP:
- **Windows:** `ipconfig`
- **Linux/Mac:** `ifconfig` or `ip addr`

### Port already in use
Make sure no other service is using:
- Port 8000 (backend)
- Port 8081 (Expo)

---

## 💡 Tips

1. **Use `start_all` for convenience** - It launches both services in separate windows, making it easy to monitor logs independently.

2. **Keep terminals open** - Don't close the terminal windows while the services are running.

3. **Check logs** - Each service shows its own logs in its terminal window for easy debugging.

4. **Run tests before commits** - Use `test_backend` to ensure your changes don't break existing functionality.

5. **For Linux/Mac users** - Make scripts executable:
   ```bash
   chmod +x *.sh
   ```
