"""
PenchGuard AI — Individual Tiger Re-ID API Endpoints
"""

import asyncio
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.models.database import (
    Dataset, Image, Detection, IndividualTiger, get_db
)
from backend.models.schemas import (
    IndividualTigerResponse, ReIDProgressResponse, TigerSightingTimelineResponse,
    SightingTimelineEvent, PaginatedImagesResponse, ImageResponse, DetectionResponse
)
from backend.services.tiger_identifier import TigerIdentifier, get_reid_progress

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/reid", tags=["reid"])


# ---------------------------------------------------------------------------
# POST /api/reid/start/{dataset_id}
# ---------------------------------------------------------------------------
@router.post("/start/{dataset_id}", response_model=ReIDProgressResponse)
async def start_reid_process(dataset_id: int, db: Session = Depends(get_db)):
    """Trigger background stripe-pattern Re-ID matching for detected tigers in a dataset."""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    identifier = TigerIdentifier()
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, identifier.process_dataset, dataset_id)

    total_tigers = (
        db.query(Detection)
        .join(Image)
        .filter(
            Image.dataset_id == dataset_id,
            Image.is_deleted == 0,
            Detection.species_name == "Tiger",
        )
        .count()
    )

    return ReIDProgressResponse(
        dataset_id=dataset_id,
        status="PROCESSING",
        total_tigers_detected=total_tigers,
        matched_tigers=0,
        unique_individuals_count=0,
        percent=0.0,
    )


# ---------------------------------------------------------------------------
# GET /api/reid/status/{dataset_id}
# ---------------------------------------------------------------------------
@router.get("/status/{dataset_id}", response_model=ReIDProgressResponse)
async def get_reid_status(dataset_id: int, db: Session = Depends(get_db)):
    """Get live progress of the individual tiger Re-ID matching pipeline."""
    prog = get_reid_progress(dataset_id)
    if prog:
        return ReIDProgressResponse(**prog)

    total_tigers = (
        db.query(Detection)
        .join(Image)
        .filter(
            Image.dataset_id == dataset_id,
            Image.is_deleted == 0,
            Detection.species_name == "Tiger",
        )
        .count()
    )

    matched = (
        db.query(Detection)
        .join(Image)
        .filter(
            Image.dataset_id == dataset_id,
            Image.is_deleted == 0,
            Detection.species_name == "Tiger",
            Detection.individual_id.isnot(None),
        )
        .count()
    )

    unique_cnt = db.query(IndividualTiger).count()
    percent = round((matched / total_tigers) * 100, 1) if total_tigers > 0 else 0.0
    status = "COMPLETED" if matched >= total_tigers and total_tigers > 0 else "IDLE"

    return ReIDProgressResponse(
        dataset_id=dataset_id,
        status=status,
        total_tigers_detected=total_tigers,
        matched_tigers=matched,
        unique_individuals_count=unique_cnt,
        percent=percent,
    )


# ---------------------------------------------------------------------------
# GET /api/reid/individuals/{dataset_id}
# ---------------------------------------------------------------------------
@router.get("/individuals/{dataset_id}", response_model=List[IndividualTigerResponse])
async def get_individual_tigers(dataset_id: int, db: Session = Depends(get_db)):
    """Get list of all identified individual tigers with sighting counts."""
    tigers = db.query(IndividualTiger).order_by(IndividualTiger.tiger_code).all()
    return [IndividualTigerResponse.model_validate(t) for t in tigers]


# ---------------------------------------------------------------------------
# GET /api/reid/individual/{tiger_id}
# ---------------------------------------------------------------------------
@router.get("/individual/{tiger_id}", response_model=TigerSightingTimelineResponse)
async def get_individual_tiger_profile(tiger_id: int, db: Session = Depends(get_db)):
    """Get detailed individual tiger profile + camera station sighting timeline."""
    tiger = db.query(IndividualTiger).filter(IndividualTiger.id == tiger_id).first()
    if not tiger:
        raise HTTPException(status_code=404, detail="Individual tiger not found")

    dets = (
        db.query(Detection)
        .join(Image)
        .filter(Detection.individual_id == tiger_id, Image.is_deleted == 0)
        .order_by(Image.exif_timestamp, Image.filesystem_timestamp)
        .all()
    )

    timeline = []
    stations_set = set()

    for d in dets:
        img = d.image
        st_name = img.station.station_name if img.station else "Unknown Station"
        stations_set.add(st_name)
        ts = img.exif_timestamp or img.filesystem_timestamp

        timeline.append(
            SightingTimelineEvent(
                image_id=img.id,
                filename=img.filename,
                station_name=st_name,
                timestamp=ts,
                latitude=img.latitude,
                longitude=img.longitude,
                confidence=d.reid_confidence or d.confidence,
            )
        )

    return TigerSightingTimelineResponse(
        tiger=IndividualTigerResponse.model_validate(tiger),
        total_sightings=len(timeline),
        stations_visited=sorted(list(stations_set)),
        timeline=timeline,
    )


# ---------------------------------------------------------------------------
# GET /api/reid/individual/{tiger_id}/images
# ---------------------------------------------------------------------------
@router.get("/individual/{tiger_id}/images", response_model=PaginatedImagesResponse)
async def get_individual_tiger_images(
    tiger_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Get paginated camera-trap images for an individual tiger."""
    query = (
        db.query(Image)
        .join(Detection)
        .filter(Detection.individual_id == tiger_id, Image.is_deleted == 0)
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
