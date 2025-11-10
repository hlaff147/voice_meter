# Voice Meter Backend (FastAPI)

## Setup

### 1. Create Conda Environment

```bash
conda env create -f environment.yml
conda activate voice_meter_backend
```

### 2. Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

### 3. Run the Application

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Access the API

- API: http://localhost:8000
- Interactive API docs (Swagger UI): http://localhost:8000/docs
- Alternative API docs (ReDoc): http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── endpoints/
│   │   │   └── health.py
│   │   └── api.py
│   ├── core/
│   │   └── config.py
│   ├── db/
│   │   └── base.py
│   ├── models/
│   ├── schemas/
│   └── services/
├── tests/
├── main.py
├── environment.yml
├── requirements.txt
└── .env.example
```

## Development

The API follows a modular structure:
- `app/api/endpoints/` - API endpoint handlers
- `app/core/` - Core configuration and settings
- `app/db/` - Database setup and session management
- `app/models/` - SQLAlchemy ORM models
- `app/schemas/` - Pydantic schemas for request/response validation
- `app/services/` - Business logic layer
