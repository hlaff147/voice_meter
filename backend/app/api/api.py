from fastapi import APIRouter
from app.api.endpoints import health, speech, recordings

api_router = APIRouter()

api_router.include_router(health.router, prefix="/v1/health", tags=["health"])
api_router.include_router(speech.router, prefix="/v1/speech", tags=["speech"])
api_router.include_router(recordings.router, prefix="/v1/recordings", tags=["recordings"])

# Add more routers here as you create them
# api_router.include_router(users.router, prefix="/users", tags=["users"])
