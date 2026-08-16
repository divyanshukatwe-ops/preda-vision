"""
PenchGuard AI — Processing & Quarantine API Endpoints
"""

import asyncio
import logging
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.models.database import Dataset, Image, get_db
from backend.models.schemas import (
    StartBlankDetectionRequest, BlankDetectionProgressResponse, ImageResponse
)
from backend.services.blank_detector import BlankDetector, get_blank_progress

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/processing", tags=["processing"])


# ---------------------------------------------------------------------------
# POST /api/processing/start-blank-detection
# ---------------------------------------------------------------------------
@router.post("/start-blank-detection", response_model=BlankDetectionProgressResponse)
async def start_blank_detection(req: StartBlankDetectionRequest, db: Session = Depends(get_db)):
    """Trigger the offline blank-image detection pipeline for a dataset."""
    dataset = db.query(Dataset).filter(Dataset.id == req.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    detector = BlankDetector()
    loop = asyncio.get_event_loop()
    loop.run_in_executor(
        None,
        detector.process_dataset,
        req.dataset_id,
        req.confidence_threshold,
        req.auto_quarantine,
    )

    return BlankDetectionProgressResponse(
        dataset_id=req.dataset_id,
        status="PROCESSING",
        total_images=dataset.total_images or 0,
        processed_images=0,
        blank_count=0,
        animal_count=0,
        quarantined_count=0,
        percent=0.0,
    )


# ---------------------------------------------------------------------------
# GET /api/processing/status/{dataset_id}
# ---------------------------------------------------------------------------
@router.get("/status/{dataset_id}", response_model=BlankDetectionProgressResponse)
async def get_processing_status(dataset_id: int, db: Session = Depends(get_db)):
    """Get live progress of the blank-image detection pipeline."""
    prog = get_blank_progress(dataset_id)
    if prog:
        return BlankDetectionProgressResponse(**prog)

    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Compute from DB records if no background job active
    total = db.query(Image).filter(Image.dataset_id == dataset_id, Image.is_deleted == 0).count()
    processed = db.query(Image).filter(
        Image.dataset_id == dataset_id, Image.is_deleted == 0, Image.is_blank.isnot(None)
    ).count()
    blanks = db.query(Image).filter(
        Image.dataset_id == dataset_id, Image.is_deleted == 0, Image.is_blank == 1
    ).count()
    animals = db.query(Image).filter(
        Image.dataset_id == dataset_id, Image.is_deleted == 0, Image.is_blank == 0
    ).count()
    quarantined = db.query(Image).filter(
        Image.dataset_id == dataset_id, Image.is_deleted == 0, Image.is_quarantined == 1
    ).count()

    percent = round((processed / total) * 100, 1) if total > 0 else 0.0
    status = "COMPLETED" if processed >= total and total > 0 else "IDLE"

    return BlankDetectionProgressResponse(
        dataset_id=dataset_id,
        status=status,
        total_images=total,
        processed_images=processed,
        blank_count=blanks,
        animal_count=animals,
        quarantined_count=quarantined,
        percent=percent,
        time_saved_hours=round((blanks * 2.0) / 60.0, 1),
    )


# ---------------------------------------------------------------------------
# POST /api/processing/quarantine/{image_id}
# ---------------------------------------------------------------------------
@router.post("/quarantine/{image_id}", response_model=ImageResponse)
async def quarantine_image(image_id: int, db: Session = Depends(get_db)):
    """Quarantine an image (isolate from active animal processing queue)."""
    img = db.query(Image).filter(Image.id == image_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")

    img.is_quarantined = 1
    db.commit()
    db.refresh(img)

    resp = ImageResponse.model_validate(img)
    if img.station:
        resp.station_name = img.station.station_name
    return resp


# ---------------------------------------------------------------------------
# POST /api/processing/restore-quarantine/{image_id}
# ---------------------------------------------------------------------------
@router.post("/restore-quarantine/{image_id}", response_model=ImageResponse)
async def restore_quarantined_image(image_id: int, db: Session = Depends(get_db)):
    """Restore a quarantined image back to the active animal queue (false positive recovery)."""
    img = db.query(Image).filter(Image.id == image_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")

    img.is_quarantined = 0
    img.is_blank = 0  # Reclassify as animal upon forest guard recovery
    db.commit()
    db.refresh(img)

    resp = ImageResponse.model_validate(img)
    if img.station:
        resp.station_name = img.station.station_name
    return resp


# ---------------------------------------------------------------------------
# POST /api/processing/batch-quarantine/{dataset_id}
# ---------------------------------------------------------------------------
@router.post("/batch-quarantine/{dataset_id}")
async def batch_quarantine_blanks(
    dataset_id: int,
    min_confidence: float = Query(0.80, ge=0.5, le=1.0),
    db: Session = Depends(get_db),
):
    """Batch quarantine all AI-flagged blank images above a confidence threshold."""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    updated = (
        db.query(Image)
        .filter(
            Image.dataset_id == dataset_id,
            Image.is_deleted == 0,
            Image.is_blank == 1,
            Image.blank_confidence >= min_confidence,
            Image.is_quarantined == 0,
        )
        .update({Image.is_quarantined: 1}, synchronize_session=False)
    )

    db.commit()
    return {"dataset_id": dataset_id, "quarantined_count": updated}
