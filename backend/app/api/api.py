from fastapi import APIRouter
from app.api.endpoints import health

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["health"])

# Add more routers here as you create them
# api_router.include_router(users.router, prefix="/users", tags=["users"])
