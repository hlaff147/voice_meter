from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api import api_router
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_PREFIX}/openapi.json"
)

# Set up CORS
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/")
async def root():
    logger.info("Root endpoint called")
    return {"message": "Welcome to Voice Meter API"}


@app.get("/health")
async def health_check():
    logger.info("Health check endpoint called")
    return {"status": "healthy"}


@app.on_event("startup")
async def startup_event():
    logger.info(f"🚀 Voice Meter API started!")
    logger.info(f"📍 API Base URL: {settings.API_PREFIX}")
    logger.info(f"📍 Health: /health")
    logger.info(f"📍 Speech Categories: {settings.API_PREFIX}/v1/speech/categories")
    logger.info(f"📍 Speech Analyze: {settings.API_PREFIX}/v1/speech/analyze")
    logger.info(f"📍 Docs: {settings.API_PREFIX}/openapi.json")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
