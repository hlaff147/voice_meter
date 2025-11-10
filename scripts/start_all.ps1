# Start both Backend and Mobile in separate terminals
# This script opens two new PowerShell windows to run backend and mobile concurrently

Write-Host "Starting Voice Meter - Full Stack" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Get the scripts directory
$scriptsDir = $PSScriptRoot
if (-not $scriptsDir) {
    $scriptsDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}

Write-Host "Starting Backend in new window..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-File", "$scriptsDir\start_backend.ps1"

Write-Host "Waiting 3 seconds for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "Starting Mobile in new window..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-File", "$scriptsDir\start_mobile.ps1"

Write-Host ""
Write-Host "Both services are starting in separate windows" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Mobile:   Expo development server" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop services, close the respective terminal windows" -ForegroundColor Yellow
