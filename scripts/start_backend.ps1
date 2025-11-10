# Start Backend Server
# This script activates the backend conda environment and starts the FastAPI server

Write-Host "Starting Voice Meter Backend..." -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

# Check if conda environment exists
$envExists = conda env list | Select-String "voice_meter_backend"
if (-not $envExists) {
    Write-Host "Error: Backend environment 'voice_meter_backend' not found" -ForegroundColor Red
    Write-Host "Please run setup_all.ps1 first to create the environment" -ForegroundColor Yellow
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ..\backend\.env)) {
    Write-Host "Warning: .env file not found" -ForegroundColor Yellow
    Write-Host "Creating .env from template..." -ForegroundColor Yellow
    Copy-Item ..\backend\.env.example ..\backend\.env
    Write-Host "Please update .env with your configuration" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Activating conda environment: voice_meter_backend" -ForegroundColor Green
Write-Host "Starting FastAPI server on http://localhost:8000" -ForegroundColor Green
Write-Host ""
Write-Host "API Documentation:" -ForegroundColor Cyan
Write-Host "  Swagger UI: http://localhost:8000/docs" -ForegroundColor White
Write-Host "  ReDoc:      http://localhost:8000/redoc" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Run the backend
Set-Location ..\backend
conda run -n voice_meter_backend --no-capture-output python main.py
