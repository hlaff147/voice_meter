#!/bin/bash

# Run Backend Tests
# This script activates the backend conda environment and runs pytest

echo "Running Voice Meter Backend Tests..."
echo "====================================="
echo ""

# Check if conda environment exists
if ! conda env list | grep -q "voice_meter_backend"; then
    echo "Error: Backend environment 'voice_meter_backend' not found"
    echo "Please run setup_all.sh first to create the environment"
    exit 1
fi

echo "Activating conda environment: voice_meter_backend"
echo "Running pytest..."
echo ""

cd ../backend
conda run -n voice_meter_backend pytest -v

EXIT_CODE=$?
cd ../scripts

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "Tests passed successfully!"
else
    echo ""
    echo "Tests failed!"
fi

exit $EXIT_CODE
