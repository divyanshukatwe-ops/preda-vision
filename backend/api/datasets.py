"""
PenchGuard AI — Dataset API endpoints
"""

import asyncio
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.models.database import (
    Dataset, Image, Station, DatasetStatus, get_db, SessionLocal
)
from backend.models.schemas import (
    DatasetResponse, DatasetListResponse, DatasetHealthResponse,
    ImportRequest, ImportProgressResponse, StationResponse,
    PaginatedImagesResponse, ImageResponse,
)
from backend.services.dataset_scanner import DatasetScanner, get_progress
from backend.services.health_analyzer import HealthAnalyzer
from backend.services.demo_generator import DemoGenerator

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["datasets"])


# ---------------------------------------------------------------------------
# POST /api/datasets/import
# ---------------------------------------------------------------------------
@router.post("/datasets/import", response_model=DatasetResponse)
async def import_dataset(req: ImportRequest, db: Session = Depends(get_db)):
    """Start importing a camera-trap dataset from a local folder."""
    source = Path(req.source_path).resolve()

    if not source.exists():
        raise HTTPException(status_code=400, detail=f"Path does not exist: {source}")
    if not source.is_dir():
        raise HTTPException(status_code=400, detail=f"Path is not a directory: {source}")

    # Create dataset record
    name = req.name or source.name
    dataset = Dataset(
        name=name,
        source_path=str(source),
        imported_at=datetime.utcnow(),
        status=DatasetStatus.PENDING.value,
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    # Launch scan in background thread
    scanner = DatasetScanner()
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, scanner.scan, dataset.id, str(source))

    return dataset


# ---------------------------------------------------------------------------
# POST /api/datasets/demo
# ---------------------------------------------------------------------------
@router.post("/datasets/demo", response_model=DatasetResponse)
async def generate_demo_dataset(db: Session = Depends(get_db)):
    """Generate and import a demo camera-trap dataset."""
    generator = DemoGenerator()

    # Generate demo images (runs synchronously — small dataset)
    loop = asyncio.get_event_loop()
    demo_path = await loop.run_in_executor(None, generator.generate, 600)

    # Create dataset record
    dataset = Dataset(
        name="DEMO DATASET",
        source_path=demo_path,
        imported_at=datetime.utcnow(),
        status=DatasetStatus.PENDING.value,
        is_demo=1,
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    # Launch scan
    scanner = DatasetScanner()
    loop.run_in_executor(None, scanner.scan, dataset.id, demo_path)

    return dataset


# ---------------------------------------------------------------------------
# GET /api/datasets
# ---------------------------------------------------------------------------
@router.get("/datasets", response_model=DatasetListResponse)
async def list_datasets(db: Session = Depends(get_db)):
    """List all imported datasets."""
    datasets = db.query(Dataset).order_by(Dataset.imported_at.desc()).all()
    return DatasetListResponse(
        datasets=[DatasetResponse.model_validate(d) for d in datasets],
        total=len(datasets),
    )


# ---------------------------------------------------------------------------
# GET /api/datasets/{id}
# ---------------------------------------------------------------------------
@router.get("/datasets/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(dataset_id: int, db: Session = Depends(get_db)):
    """Get a single dataset's details."""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset


# ---------------------------------------------------------------------------
# GET /api/datasets/{id}/health
# ---------------------------------------------------------------------------
@router.get("/datasets/{dataset_id}/health", response_model=DatasetHealthResponse)
async def get_dataset_health(dataset_id: int, db: Session = Depends(get_db)):
    """Get the health report for a dataset."""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if dataset.status != DatasetStatus.COMPLETED.value:
        raise HTTPException(status_code=400, detail="Dataset scan not yet complete")

    analyzer = HealthAnalyzer()
    return analyzer.analyze(db, dataset_id)


# ---------------------------------------------------------------------------
# GET /api/datasets/{id}/images
# ---------------------------------------------------------------------------
@router.get("/datasets/{dataset_id}/images", response_model=PaginatedImagesResponse)
async def get_dataset_images(
    dataset_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=100),
    status: Optional[str] = None,
    station_id: Optional[int] = None,
    only_deleted: bool = Query(False),
    is_quarantined: Optional[bool] = Query(None),
    is_blank: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    """Get paginated images for a dataset with optional filters."""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    query = db.query(Image).filter(Image.dataset_id == dataset_id)

    if only_deleted:
        query = query.filter(Image.is_deleted == 1)
    else:
        query = query.filter(Image.is_deleted == 0)

    if is_quarantined is not None:
        query = query.filter(Image.is_quarantined == (1 if is_quarantined else 0))

    if is_blank is not None:
        query = query.filter(Image.is_blank == (1 if is_blank else 0))

    if status:
        query = query.filter(Image.validation_status == status.upper())
    if station_id:
        query = query.filter(Image.station_id == station_id)

    total = query.count()
    total_pages = max(1, (total + page_size - 1) // page_size)
    offset = (page - 1) * page_size

    images = query.order_by(Image.id).offset(offset).limit(page_size).all()

    # Enrich with station name
    result = []
    for img in images:
        resp = ImageResponse.model_validate(img)
        if img.station:
            resp.station_name = img.station.station_name
        result.append(resp)

    return PaginatedImagesResponse(
        images=result,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


# ---------------------------------------------------------------------------
# GET /api/datasets/{id}/stations
# ---------------------------------------------------------------------------
@router.get("/datasets/{dataset_id}/stations", response_model=list[StationResponse])
async def get_dataset_stations(dataset_id: int, db: Session = Depends(get_db)):
    """Get all stations for a dataset."""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    stations = (
        db.query(Station)
        .filter(Station.dataset_id == dataset_id)
        .order_by(Station.station_name)
        .all()
    )
    return [StationResponse.model_validate(s) for s in stations]


# ---------------------------------------------------------------------------
# GET /api/datasets/{id}/progress
# ---------------------------------------------------------------------------
@router.get("/datasets/{dataset_id}/progress", response_model=ImportProgressResponse)
async def get_dataset_progress(dataset_id: int, db: Session = Depends(get_db)):
    """Get live scan progress for a dataset."""
    progress = get_progress(dataset_id)
    if progress:
        return ImportProgressResponse(**progress)

    # Fallback to DB status
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    return ImportProgressResponse(
        dataset_id=dataset_id,
        status=dataset.status,
        total_files=dataset.total_images,
        scanned_files=dataset.total_images if dataset.status == DatasetStatus.COMPLETED.value else 0,
        percent=100.0 if dataset.status == DatasetStatus.COMPLETED.value else 0.0,
    )
