#!/bin/bash

# Setup script for Voice Meter project (Linux/Mac)

echo "Voice Meter Project Setup"
echo "========================="
echo ""

# Check if conda is installed
if ! command -v conda &> /dev/null
then
    echo "Error: Conda is not installed or not in PATH"
    echo "Please install Miniconda or Anaconda first"
    exit 1
fi

echo "Setting up Backend..."
cd ../backend

# Create backend environment
echo "Creating conda environment: voice_meter_backend"
conda env create -f environment.yml

# Copy environment file if not exists
if [ ! -f .env ]; then
    echo "Creating .env file from template"
    cp .env.example .env
    echo "Please update .env with your configuration"
fi

echo ""
echo "Setting up Mobile..."
cd ../mobile

# Create mobile environment
echo "Creating conda environment: voice_meter_mobile"
conda env create -f environment.yml

# Activate mobile environment and install npm packages
echo "Installing npm packages..."
conda run -n voice_meter_mobile npm install --legacy-peer-deps

# Copy environment file if not exists
if [ ! -f .env ]; then
    echo "Creating .env file from template"
    cp .env.example .env
    echo "Please update .env with your API URL"
fi

echo ""
echo "Setup Complete!"
echo ""
echo "To start developing:"
echo "  Backend:"
echo "    conda activate voice_meter_backend"
echo "    cd backend"
echo "    python main.py"
echo ""
echo "  Mobile:"
echo "    conda activate voice_meter_mobile"
echo "    cd mobile"
echo "    npm start"
echo ""

cd ../scripts
