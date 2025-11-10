#!/bin/bash

# Start Backend Server
# This script activates the backend conda environment and starts the FastAPI server

echo "Starting Voice Meter Backend..."
echo "==============================="
echo ""

# Check if conda environment exists
if ! conda env list | grep -q "voice_meter_backend"; then
    echo "Error: Backend environment 'voice_meter_backend' not found"
    echo "Please run setup_all.sh first to create the environment"
    exit 1
fi

# Check if .env file exists
if [ ! -f ../backend/.env ]; then
    echo "Warning: .env file not found"
    echo "Creating .env from template..."
    cp ../backend/.env.example ../backend/.env
    echo "Please update .env with your configuration"
    echo ""
fi

echo "Activating conda environment: voice_meter_backend"
echo "Starting FastAPI server on http://localhost:8000"
echo ""
echo "API Documentation:"
echo "  Swagger UI: http://localhost:8000/docs"
echo "  ReDoc:      http://localhost:8000/redoc"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run the backend
cd ../backend
conda run -n voice_meter_backend --no-capture-output python main.py
