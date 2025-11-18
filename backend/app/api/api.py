from fastapi import APIRouter
from app.api.endpoints import health, speech

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(speech.router, prefix="/speech", tags=["speech"])

# Add more routers here as you create them
# api_router.include_router(users.router, prefix="/users", tags=["users"])
