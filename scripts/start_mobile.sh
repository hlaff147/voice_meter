#!/bin/bash

# Start Mobile App
# This script activates the mobile conda environment and starts the Expo development server

echo "Starting Voice Meter Mobile App..."
echo "==================================="
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
    echo "IMPORTANT: For Android device/emulator, update API_URL in .env to use your computer's IP address"
    echo "Example: API_URL=http://192.168.1.100:8000/api/v1"
    echo ""
fi

echo "Activating conda environment: voice_meter_mobile"
echo "Starting Expo development server..."
echo ""
echo "Available commands:"
echo "  Press 'a' to open on Android"
echo "  Press 'i' to open on iOS"
echo "  Press 'w' to open on web"
echo "  Press 'r' to reload"
echo "  Press 'q' to quit"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run the mobile app
cd ../mobile
conda run -n voice_meter_mobile --no-capture-output npm start
