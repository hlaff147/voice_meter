#!/bin/bash

# Start Web Frontend
# This script activates the mobile conda environment and starts the Expo web server

echo "Starting Voice Meter Web Frontend..."
echo "===================================="
echo ""

# Check if conda environment exists
if ! conda env list | grep -q "voice_meter_mobile"; then
    echo "Error: Mobile environment 'voice_meter_mobile' not found"
    echo "Please run setup_all.sh first to create the environment"
    exit 1
fi

# Check if node_modules exists
if [ ! -d ../mobile/node_modules ]; then
    echo "Node modules not found. Installing dependencies..."
    cd ../mobile
    conda run -n voice_meter_mobile npm install --legacy-peer-deps
    cd ../scripts
fi

# Check if .env file exists
if [ ! -f ../mobile/.env ]; then
    echo "Warning: .env file not found"
    echo "Creating .env from template..."
    cp ../mobile/.env.example ../mobile/.env
    echo ""
fi

echo "Activating conda environment: voice_meter_mobile"
echo "Starting Expo web server..."
echo ""
echo "The web app will open automatically in your browser at:"
echo "  http://localhost:8081"
echo ""
echo "If it doesn't open automatically, press 'w' or visit the URL above"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run the web version
cd ../mobile
conda run -n voice_meter_mobile --no-capture-output npx expo start --web
