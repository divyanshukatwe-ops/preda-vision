"""
PenchGuard AI — Species & Tiger Detection API Endpoints
"""

import asyncio
import logging
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.models.database import Dataset, Image, Detection, get_db
from backend.models.schemas import (
    SpeciesDetectionProgressResponse, SpeciesSummaryResponse, DetectionResponse,
    PaginatedImagesResponse, ImageResponse
)
from backend.services.tiger_detector import TigerDetector, get_tiger_progress

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/detections", tags=["detections"])


# ---------------------------------------------------------------------------
# POST /api/detections/start
# ---------------------------------------------------------------------------
@router.post("/start", response_model=SpeciesDetectionProgressResponse)
async def start_tiger_detection(
    dataset_id: int = Query(...),
    min_confidence: float = Query(0.70, ge=0.5, le=1.0),
    db: Session = Depends(get_db),
):
    """Trigger the offline wildlife species & tiger detection pipeline for a dataset."""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    detector = TigerDetector()
    loop = asyncio.get_event_loop()
    loop.run_in_executor(
        None,
        detector.process_dataset,
        dataset_id,
        min_confidence,
    )

    return SpeciesDetectionProgressResponse(
        dataset_id=dataset_id,
        status="PROCESSING",
        total_images=dataset.total_images or 0,
        processed_images=0,
        tiger_count=0,
        total_detections=0,
        percent=0.0,
    )


# ---------------------------------------------------------------------------
# GET /api/detections/status/{dataset_id}
# ---------------------------------------------------------------------------
@router.get("/status/{dataset_id}", response_model=SpeciesDetectionProgressResponse)
async def get_detection_status(dataset_id: int, db: Session = Depends(get_db)):
    """Get live progress of the species detection pipeline."""
    prog = get_tiger_progress(dataset_id)
    if prog:
        return SpeciesDetectionProgressResponse(**prog)

    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    total = db.query(Image).filter(Image.dataset_id == dataset_id, Image.is_deleted == 0, Image.is_quarantined == 0).count()
    processed = db.query(Image).filter(
        Image.dataset_id == dataset_id, Image.is_deleted == 0, Image.is_quarantined == 0, Image.processed_at.isnot(None)
    ).count()

    total_dets = (
        db.query(Detection)
        .join(Image)
        .filter(Image.dataset_id == dataset_id, Image.is_deleted == 0)
        .count()
    )

    tiger_cnt = (
        db.query(Detection)
        .join(Image)
        .filter(Image.dataset_id == dataset_id, Image.is_deleted == 0, Detection.species_name == "Tiger")
        .count()
    )

    # Group by species
    species_rows = (
        db.query(Detection.species_name, func.count(Detection.id))
        .join(Image)
        .filter(Image.dataset_id == dataset_id, Image.is_deleted == 0)
        .group_by(Detection.species_name)
        .all()
    )
    species_counts = {r[0]: r[1] for r in species_rows}

    percent = round((processed / total) * 100, 1) if total > 0 else 0.0
    status = "COMPLETED" if processed >= total and total > 0 else "IDLE"

    return SpeciesDetectionProgressResponse(
        dataset_id=dataset_id,
        status=status,
        total_images=total,
        processed_images=processed,
        tiger_count=tiger_cnt,
        total_detections=total_dets,
        species_counts=species_counts,
        percent=percent,
    )


# ---------------------------------------------------------------------------
# GET /api/detections/summary/{dataset_id}
# ---------------------------------------------------------------------------
@router.get("/summary/{dataset_id}", response_model=SpeciesSummaryResponse)
async def get_detection_summary(dataset_id: int, db: Session = Depends(get_db)):
    """Get species breakdown summary and tiger sighting metrics for a dataset."""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    total_images = db.query(Image).filter(Image.dataset_id == dataset_id, Image.is_deleted == 0).count()

    species_rows = (
        db.query(Detection.species_name, func.count(Detection.id))
        .join(Image)
        .filter(Image.dataset_id == dataset_id, Image.is_deleted == 0)
        .group_by(Detection.species_name)
        .all()
    )
    species_counts = {r[0]: r[1] for r in species_rows}

    total_dets = sum(species_counts.values())
    tiger_cnt = species_counts.get("Tiger", 0)

    tiger_images_cnt = (
        db.query(Image.id)
        .join(Detection)
        .filter(Image.dataset_id == dataset_id, Image.is_deleted == 0, Detection.species_name == "Tiger")
        .distinct()
        .count()
    )

    return SpeciesSummaryResponse(
        dataset_id=dataset_id,
        dataset_name=dataset.name,
        total_images=total_images,
        total_detections=total_dets,
        tiger_count=tiger_cnt,
        tiger_images_count=tiger_images_cnt,
        species_counts=species_counts,
    )


# ---------------------------------------------------------------------------
# GET /api/detections/image/{image_id}
# ---------------------------------------------------------------------------
@router.get("/image/{image_id}", response_model=List[DetectionResponse])
async def get_image_detections(image_id: int, db: Session = Depends(get_db)):
    """Get all species bounding boxes for a specific image."""
    dets = db.query(Detection).filter(Detection.image_id == image_id).all()
    return [DetectionResponse.model_validate(d) for d in dets]


# ---------------------------------------------------------------------------
# GET /api/detections/tigers/{dataset_id}
# ---------------------------------------------------------------------------
@router.get("/tigers/{dataset_id}", response_model=PaginatedImagesResponse)
async def get_tiger_images(
    dataset_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=100),
    species: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Get paginated images containing detected tigers (or filtered species)."""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    target_species = species if species else "Tiger"

    query = (
        db.query(Image)
        .join(Detection)
        .filter(
            Image.dataset_id == dataset_id,
            Image.is_deleted == 0,
            Detection.species_name == target_species,
        )
        .distinct()
    )

    total = query.count()
    total_pages = max(1, (total + page_size - 1) // page_size)
    offset = (page - 1) * page_size

    images = query.order_by(Image.id).offset(offset).limit(page_size).all()

    result = []
    for img in images:
        resp = ImageResponse.model_validate(img)
        if img.station:
            resp.station_name = img.station.station_name
        resp.detections = [DetectionResponse.model_validate(d) for d in img.detections]
        result.append(resp)

    return PaginatedImagesResponse(
        images=result,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )
