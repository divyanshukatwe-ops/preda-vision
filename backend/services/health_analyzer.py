"""
PenchGuard AI — Health Analyzer
Computes a transparent dataset-health score from concrete metrics.
"""

import json
import logging
from typing import List
from sqlalchemy.orm import Session

from backend.models.database import Dataset, Image, Station, ValidationStatus
from backend.models.schemas import DatasetHealthResponse, HealthMetric

logger = logging.getLogger(__name__)


class HealthAnalyzer:
    """Calculates dataset quality metrics and a composite health score."""

    # Weights for composite score (sum to 1.0)
    WEIGHTS = {
        "valid_ratio": 0.30,
        "gps_ratio": 0.20,
        "timestamp_ratio": 0.20,
        "no_corrupt": 0.20,
        "no_duplicates": 0.10,
    }

    def analyze(self, db: Session, dataset_id: int) -> DatasetHealthResponse:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            raise ValueError(f"Dataset {dataset_id} not found")

        total = dataset.total_images or 0
        valid = dataset.valid_images or 0
        invalid = dataset.invalid_images or 0

        # Count corrupt
        corrupt = (
            db.query(Image)
            .filter(Image.dataset_id == dataset_id,
                    Image.validation_status == ValidationStatus.CORRUPT.value)
            .count()
        )

        # GPS availability
        gps_count = (
            db.query(Image)
            .filter(Image.dataset_id == dataset_id,
                    Image.latitude.isnot(None),
                    Image.longitude.isnot(None))
            .count()
        )

        # Timestamp availability (EXIF or filesystem)
        ts_count = (
            db.query(Image)
            .filter(Image.dataset_id == dataset_id,
                    Image.exif_timestamp.isnot(None))
            .count()
        )

        # Duplicate candidates — same file_size AND same width AND same height
        from sqlalchemy import func
        dup_query = (
            db.query(
                Image.file_size, Image.width, Image.height,
                func.count(Image.id).label("cnt")
            )
            .filter(Image.dataset_id == dataset_id,
                    Image.file_size > 0,
                    Image.width.isnot(None))
            .group_by(Image.file_size, Image.width, Image.height)
            .having(func.count(Image.id) > 1)
            .all()
        )
        duplicate_candidates = sum(row.cnt - 1 for row in dup_query)

        # Station count
        stations_count = (
            db.query(Station)
            .filter(Station.dataset_id == dataset_id)
            .count()
        )

        # ---- Compute ratios ----
        def safe_pct(num, denom):
            return round((num / denom) * 100, 1) if denom > 0 else 0.0

        gps_pct = safe_pct(gps_count, total)
        ts_pct = safe_pct(ts_count, total)
        valid_pct = safe_pct(valid, total)
        corrupt_pct = safe_pct(corrupt, total)
        dup_pct = safe_pct(duplicate_candidates, total)

        # ---- Composite health score ----
        scores = {
            "valid_ratio": valid_pct,
            "gps_ratio": gps_pct,
            "timestamp_ratio": ts_pct,
            "no_corrupt": 100 - corrupt_pct,
            "no_duplicates": 100 - dup_pct,
        }
        health_score = round(
            sum(scores[k] * self.WEIGHTS[k] for k in self.WEIGHTS), 1
        )

        # ---- Build metrics list ----
        def status_for(pct, warn=80, crit=50):
            if pct >= warn:
                return "green"
            elif pct >= crit:
                return "yellow"
            return "red"

        metrics: List[HealthMetric] = [
            HealthMetric(
                label="Valid Images",
                value=valid, total=total,
                percent=valid_pct,
                status=status_for(valid_pct),
            ),
            HealthMetric(
                label="GPS Available",
                value=gps_count, total=total,
                percent=gps_pct,
                status=status_for(gps_pct, warn=70, crit=40),
            ),
            HealthMetric(
                label="EXIF Timestamps",
                value=ts_count, total=total,
                percent=ts_pct,
                status=status_for(ts_pct),
            ),
            HealthMetric(
                label="Corrupted Files",
                value=corrupt, total=total,
                percent=corrupt_pct,
                status="green" if corrupt_pct < 2 else ("yellow" if corrupt_pct < 5 else "red"),
            ),
            HealthMetric(
                label="Duplicate Candidates",
                value=duplicate_candidates, total=total,
                percent=dup_pct,
                status="green" if dup_pct < 3 else ("yellow" if dup_pct < 10 else "red"),
            ),
        ]

        return DatasetHealthResponse(
            dataset_id=dataset_id,
            dataset_name=dataset.name,
            health_score=health_score,
            total_images=total,
            valid_images=valid,
            invalid_images=invalid,
            corrupt_images=corrupt,
            stations_count=stations_count,
            gps_available_percent=gps_pct,
            timestamp_available_percent=ts_pct,
            duplicate_candidates=duplicate_candidates,
            metrics=metrics,
        )
