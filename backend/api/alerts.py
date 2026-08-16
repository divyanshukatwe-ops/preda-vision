"""
FastAPI Router — Security & Threat Alert Engine Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.models.database import get_db, Alert
from backend.models.schemas import AlertResponse, AlertSummaryResponse
from backend.services.alert_engine import AlertEngine

router = APIRouter(prefix="/api/alerts", tags=["Threat Alerts"])


@router.post("/generate/{dataset_id}", response_model=AlertSummaryResponse)
def generate_dataset_alerts(dataset_id: int, db: Session = Depends(get_db)):
    """Runs threat rules and generates security/territory alert notifications."""
    engine = AlertEngine(db)
    summary = engine.get_alert_summary(dataset_id)
    return summary


@router.get("/summary/{dataset_id}", response_model=AlertSummaryResponse)
def get_alerts_summary(dataset_id: int, db: Session = Depends(get_db)):
    """Retrieves alert summary and active security alerts for a dataset."""
    engine = AlertEngine(db)
    summary = engine.get_alert_summary(dataset_id)
    return summary


@router.post("/acknowledge/{alert_id}", response_model=AlertResponse)
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    """Toggles acknowledgement status for an alert."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_acknowledged = 1 if alert.is_acknowledged == 0 else 0
    db.commit()
    db.refresh(alert)
    return alert
