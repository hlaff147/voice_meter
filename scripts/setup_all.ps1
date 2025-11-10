# Setup script for Voice Meter project (Windows PowerShell)

Write-Host "Voice Meter Project Setup" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Check if conda is installed
if (!(Get-Command conda -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Conda is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Miniconda or Anaconda first" -ForegroundColor Yellow
    exit 1
}

Write-Host "Setting up Backend..." -ForegroundColor Green
Set-Location ..\backend

# Create backend environment
Write-Host "Creating conda environment: voice_meter_backend" -ForegroundColor Yellow
conda env create -f environment.yml

# Copy environment file if not exists
if (!(Test-Path .env)) {
    Write-Host "Creating .env file from template" -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "Please update .env with your configuration" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Setting up Mobile..." -ForegroundColor Green
Set-Location ..\mobile

# Create mobile environment
Write-Host "Creating conda environment: voice_meter_mobile" -ForegroundColor Yellow
conda env create -f environment.yml

# Activate mobile environment and install npm packages
Write-Host "Installing npm packages..." -ForegroundColor Yellow
conda run -n voice_meter_mobile npm install --legacy-peer-deps

# Copy environment file if not exists
if (!(Test-Path .env)) {
    Write-Host "Creating .env file from template" -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "Please update .env with your API URL" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start developing:" -ForegroundColor Cyan
Write-Host "  Backend:" -ForegroundColor Yellow
Write-Host "    conda activate voice_meter_backend" -ForegroundColor White
Write-Host "    cd backend" -ForegroundColor White
Write-Host "    python main.py" -ForegroundColor White
Write-Host ""
Write-Host "  Mobile:" -ForegroundColor Yellow
Write-Host "    conda activate voice_meter_mobile" -ForegroundColor White
Write-Host "    cd mobile" -ForegroundColor White
Write-Host "    npm start" -ForegroundColor White
Write-Host ""

Set-Location ..\scripts
