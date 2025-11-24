#!/usr/bin/env python3
"""
Script to initialize the database with tables and mock data
Run this script to set up the database for the first time
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.init_db import init_db

if __name__ == "__main__":
    print("=" * 60)
    print("  Voice Meter - Database Initialization")
    print("=" * 60)
    print()
    
    init_db()
    
    print()
    print("=" * 60)
    print("  Database is ready! You can now:")
    print("  1. Start the backend: docker-compose up")
    print("  2. Access the API docs: http://localhost:8000/docs")
    print("  3. View recordings: GET /api/v1/recordings/recordings")
    print("  4. View statistics: GET /api/v1/recordings/statistics")
    print("=" * 60)
