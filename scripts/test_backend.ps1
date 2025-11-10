# Run Backend Tests
# This script activates the backend conda environment and runs pytest

Write-Host "Running Voice Meter Backend Tests..." -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if conda environment exists
$envExists = conda env list | Select-String "voice_meter_backend"
if (-not $envExists) {
    Write-Host "Error: Backend environment 'voice_meter_backend' not found" -ForegroundColor Red
    Write-Host "Please run setup_all.ps1 first to create the environment" -ForegroundColor Yellow
    exit 1
}

Write-Host "Activating conda environment: voice_meter_backend" -ForegroundColor Green
Write-Host "Running pytest..." -ForegroundColor Green
Write-Host ""

Set-Location ..\backend
conda run -n voice_meter_backend pytest -v

$exitCode = $LASTEXITCODE
Set-Location ..\scripts

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "Tests passed successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Tests failed!" -ForegroundColor Red
}

exit $exitCode
