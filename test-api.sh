#!/bin/bash

# Script to test the Voice Meter API with a sample audio file

echo "🎤 Voice Meter API Test Script"
echo "=============================="
echo ""

# Check if backend is running
echo "Checking if backend is running..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running. Please start it first."
    echo "   Run: docker-compose up"
    echo "   Or: cd scripts && ./start_backend.sh"
    exit 1
fi

echo ""
echo "📋 Testing /api/v1/speech/categories endpoint..."
curl -s http://localhost:8000/api/v1/speech/categories | python3 -m json.tool

echo ""
echo ""
echo "To test audio analysis, you need to record an audio file first."
echo "You can use the mobile app or test with curl:"
echo ""
echo "curl -X POST http://localhost:8000/api/v1/speech/analyze \\"
echo "  -F 'audio_file=@your_audio.wav' \\"
echo "  -F 'category=presentation'"
echo ""
echo "📱 Or use the mobile app at http://localhost:19006"
