# Start Mobile App
# This script activates the mobile conda environment and starts the Expo development server

Write-Host "Starting Voice Meter Mobile App..." -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Check if conda environment exists
$envExists = conda env list | Select-String "voice_meter_mobile"
if (-not $envExists) {
    Write-Host "Error: Mobile environment 'voice_meter_mobile' not found" -ForegroundColor Red
    Write-Host "Please run setup_all.ps1 first to create the environment" -ForegroundColor Yellow
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path ..\mobile\node_modules)) {
    Write-Host "Node modules not found. Installing dependencies..." -ForegroundColor Yellow
    Set-Location ..\mobile
    conda run -n voice_meter_mobile npm install --legacy-peer-deps
    Set-Location ..\scripts
}

# Check if .env file exists
if (-not (Test-Path ..\mobile\.env)) {
    Write-Host "Warning: .env file not found" -ForegroundColor Yellow
    Write-Host "Creating .env from template..." -ForegroundColor Yellow
    Copy-Item ..\mobile\.env.example ..\mobile\.env
    Write-Host ""
    Write-Host "IMPORTANT: For Android device/emulator, update API_URL in .env to use your computer's IP address" -ForegroundColor Yellow
    Write-Host "Example: API_URL=http://192.168.1.100:8000/api/v1" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Activating conda environment: voice_meter_mobile" -ForegroundColor Green
Write-Host "Starting Expo development server..." -ForegroundColor Green
Write-Host ""
Write-Host "Available commands:" -ForegroundColor Cyan
Write-Host "  Press 'a' to open on Android" -ForegroundColor White
Write-Host "  Press 'i' to open on iOS" -ForegroundColor White
Write-Host "  Press 'w' to open on web" -ForegroundColor White
Write-Host "  Press 'r' to reload" -ForegroundColor White
Write-Host "  Press 'q' to quit" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Run the mobile app
Set-Location ..\mobile
conda run -n voice_meter_mobile --no-capture-output npm start
