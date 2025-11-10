#!/bin/bash

# Start both Backend and Mobile in separate terminals
# This script opens two new terminal windows to run backend and mobile concurrently

echo "Starting Voice Meter - Full Stack"
echo "=================================="
echo ""

# Get the scripts directory
SCRIPTS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Starting Backend in new terminal..."
# Detect the terminal emulator and open accordingly
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    osascript <<EOF
tell application "Terminal"
    do script "cd '$SCRIPTS_DIR' && bash start_backend.sh"
    activate
end tell
EOF
elif command -v gnome-terminal &> /dev/null; then
    # Linux with GNOME
    gnome-terminal -- bash -c "cd '$SCRIPTS_DIR' && bash start_backend.sh; exec bash"
elif command -v xterm &> /dev/null; then
    # Linux with xterm
    xterm -e "cd '$SCRIPTS_DIR' && bash start_backend.sh; exec bash" &
else
    echo "Warning: Could not detect terminal emulator. Please run start_backend.sh manually."
fi

echo "Waiting 3 seconds for backend to initialize..."
sleep 3

echo "Starting Mobile in new terminal..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    osascript <<EOF
tell application "Terminal"
    do script "cd '$SCRIPTS_DIR' && bash start_mobile.sh"
    activate
end tell
EOF
elif command -v gnome-terminal &> /dev/null; then
    # Linux with GNOME
    gnome-terminal -- bash -c "cd '$SCRIPTS_DIR' && bash start_mobile.sh; exec bash"
elif command -v xterm &> /dev/null; then
    # Linux with xterm
    xterm -e "cd '$SCRIPTS_DIR' && bash start_mobile.sh; exec bash" &
else
    echo "Warning: Could not detect terminal emulator. Please run start_mobile.sh manually."
fi

echo ""
echo "Both services are starting in separate windows"
echo ""
echo "Backend:  http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo "Mobile:   Expo development server"
echo ""
echo "To stop services, close the respective terminal windows"
