"""
PenchGuard AI — FastAPI Application Entry Point
Offline Wildlife Intelligence & Tiger Movement Early-Warning System
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.models.database import init_db
from backend.utils.helpers import ensure_data_dirs, get_project_root
from backend.api.datasets import router as datasets_router
from backend.api.images import router as images_router
from backend.api.processing import router as processing_router
from backend.api.detections import router as detections_router
from backend.api.reid import router as reid_router
from backend.api.movement import router as movement_router
from backend.api.alerts import router as alerts_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown lifecycle."""
    logger.info("PenchGuard AI starting up...")
    ensure_data_dirs()
    init_db()
    logger.info("Database initialized. Data directories ready.")
    yield
    logger.info("PenchGuard AI shutting down.")


app = FastAPI(
    title="PenchGuard AI",
    description="Offline Wildlife Intelligence & Tiger Movement Early-Warning System",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(datasets_router)
app.include_router(images_router)
app.include_router(processing_router)
app.include_router(detections_router)
app.include_router(reid_router)
app.include_router(movement_router)
app.include_router(alerts_router)

# Mount static file directories for preda_vision_data and demo_dataset
project_root = get_project_root()
preda_dir = project_root / "preda_vision_data"
demo_dir = project_root / "data" / "demo_dataset"

if preda_dir.exists():
    app.mount("/data_images", StaticFiles(directory=str(preda_dir)), name="data_images")

if demo_dir.exists():
    app.mount("/demo_images", StaticFiles(directory=str(demo_dir)), name="demo_images")


@app.get("/")
async def root():
    return {
        "name": "PenchGuard AI",
        "version": "1.0.0",
        "description": "Offline Wildlife Intelligence & Tiger Movement Early-Warning System",
        "status": "operational",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
