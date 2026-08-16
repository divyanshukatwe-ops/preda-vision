"""
PenchGuard AI — Movement & Territory Analysis API Endpoints
"""

import logging
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.models.database import Dataset, Station, Image, Detection, IndividualTiger, get_db
from backend.services.movement_analyzer import MovementAnalyzer

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/movement", tags=["movement"])


# ---------------------------------------------------------------------------
# GET /api/movement/summary/{dataset_id}
# ---------------------------------------------------------------------------
@router.get("/summary/{dataset_id}")
async def get_movement_summary(dataset_id: int, db: Session = Depends(get_db)):
    """Get overall movement summary and trajectory telemetry for a dataset."""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    analyzer = MovementAnalyzer()
    return analyzer.analyze_dataset_movement(dataset_id)


# ---------------------------------------------------------------------------
# GET /api/movement/stations/{dataset_id}
# ---------------------------------------------------------------------------
@router.get("/stations/{dataset_id}")
async def get_movement_stations(dataset_id: int, db: Session = Depends(get_db)):
    """Get camera stations with spatial coordinates and tiger sighting counts."""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    stations = db.query(Station).filter(Station.dataset_id == dataset_id).all()

    result = []
    for st in stations:
        tiger_sightings = (
            db.query(Detection)
            .join(Image)
            .filter(
                Image.station_id == st.id,
                Image.is_deleted == 0,
                Detection.species_name == "Tiger",
            )
            .count()
        )

        result.append({
            "id": st.id,
            "station_name": st.station_name,
            "latitude": st.latitude,
            "longitude": st.longitude,
            "total_images": st.image_count,
            "tiger_sightings": tiger_sightings,
        })

    return {"stations": result}
