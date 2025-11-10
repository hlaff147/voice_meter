# Start Web Frontend
# This script activates the mobile conda environment and starts the Expo web server

Write-Host "Starting Voice Meter Web Frontend..." -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
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
}

Write-Host "Activating conda environment: voice_meter_mobile" -ForegroundColor Green
Write-Host "Starting Expo web server..." -ForegroundColor Green
Write-Host ""
Write-Host "The web app will open automatically in your browser at:" -ForegroundColor Cyan
Write-Host "  http://localhost:8081" -ForegroundColor White
Write-Host ""
Write-Host "If it doesn't open automatically, press 'w' or visit the URL above" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Run the web version
Set-Location ..\mobile
conda run -n voice_meter_mobile --no-capture-output npx expo start --web
