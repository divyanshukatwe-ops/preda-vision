"""
PenchGuard AI — Dataset Scanner
Recursively scans a camera-trap folder, extracts metadata, infers stations,
and persists everything to SQLite. Designed to run as a background task with
progress reporting.
"""

import json
import logging
import time
import threading
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

from sqlalchemy.orm import Session

from backend.models.database import (
    Dataset, Image, Station, DatasetStatus, ValidationStatus, SessionLocal,
)
from backend.services.metadata_extractor import MetadataExtractor
from backend.services.station_detector import StationDetector

logger = logging.getLogger(__name__)

# Supported image extensions (case-insensitive)
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# Global progress store — keyed by dataset_id
_progress: Dict[int, dict] = {}
_progress_lock = threading.Lock()


def get_progress(dataset_id: int) -> Optional[dict]:
    with _progress_lock:
        return _progress.get(dataset_id)


def _update_progress(dataset_id: int, **kwargs):
    with _progress_lock:
        if dataset_id not in _progress:
            _progress[dataset_id] = {
                "dataset_id": dataset_id,
                "status": "SCANNING",
                "total_files": 0,
                "scanned_files": 0,
                "current_file": "",
                "percent": 0.0,
                "errors": 0,
            }
        _progress[dataset_id].update(kwargs)


class DatasetScanner:
    """
    Scans a local directory for camera-trap images, extracts metadata,
    infers stations, and writes records to the database.

    Call `scan()` from a background thread / asyncio.to_thread.
    """

    BATCH_SIZE = 50  # commit every N images for progress visibility

    def __init__(self):
        self.extractor = MetadataExtractor()

    def scan(self, dataset_id: int, source_path: str) -> None:
        """Main scan loop — meant to run in a background thread."""
        root = Path(source_path)
        db: Session = SessionLocal()

        try:
            dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
            if not dataset:
                logger.error("Dataset %d not found", dataset_id)
                return

            # 1. Discover all image files
            image_files = self._discover_images(root)
            total = len(image_files)

            dataset.status = DatasetStatus.SCANNING.value
            dataset.total_images = total
            db.commit()

            _update_progress(dataset_id, total_files=total, status="SCANNING")

            if total == 0:
                dataset.status = DatasetStatus.COMPLETED.value
                db.commit()
                _update_progress(dataset_id, status="COMPLETED", percent=100)
                return

            # 2. Set up station detector
            station_detector = StationDetector(root)

            # 3. Process each image
            station_cache: Dict[str, Station] = {}  # station_name → Station ORM
            valid_count = 0
            invalid_count = 0
            total_size = 0
            errors = 0

            for idx, file_path in enumerate(image_files, start=1):
                try:
                    record = self._process_image(
                        db, dataset_id, root, file_path,
                        station_detector, station_cache,
                    )
                    total_size += record.file_size or 0
                    if record.validation_status == ValidationStatus.CORRUPT.value:
                        invalid_count += 1
                    else:
                        valid_count += 1

                except Exception as exc:
                    logger.exception("Error processing %s", file_path)
                    errors += 1
                    invalid_count += 1

                # Progress update
                pct = round((idx / total) * 100, 1)
                _update_progress(
                    dataset_id,
                    scanned_files=idx,
                    current_file=str(file_path.relative_to(root)),
                    percent=pct,
                    errors=errors,
                )

                # Batch commit
                if idx % self.BATCH_SIZE == 0:
                    db.commit()

            # 4. Final commit and update dataset record
            db.commit()

            # Update station image counts
            for station in station_cache.values():
                count = (
                    db.query(Image)
                    .filter(Image.station_id == station.id)
                    .count()
                )
                station.image_count = count
            db.commit()

            dataset.valid_images = valid_count
            dataset.invalid_images = invalid_count
            dataset.total_size_bytes = total_size
            dataset.status = DatasetStatus.COMPLETED.value
            db.commit()

            _update_progress(dataset_id, status="COMPLETED", percent=100)
            logger.info(
                "Dataset %d scan complete: %d valid, %d invalid, %d errors",
                dataset_id, valid_count, invalid_count, errors,
            )

        except Exception as exc:
            logger.exception("Dataset scan %d failed", dataset_id)
            try:
                dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
                if dataset:
                    dataset.status = DatasetStatus.FAILED.value
                    db.commit()
            except Exception:
                pass
            _update_progress(dataset_id, status="FAILED")

        finally:
            db.close()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _discover_images(self, root: Path):
        """Recursively find all supported image files."""
        files = []
        for p in root.rglob("*"):
            if p.is_file() and p.suffix.lower() in SUPPORTED_EXTENSIONS:
                files.append(p)
        files.sort()
        return files

    def _process_image(
        self,
        db: Session,
        dataset_id: int,
        root: Path,
        file_path: Path,
        station_detector: StationDetector,
        station_cache: Dict[str, Station],
    ) -> Image:
        """Process a single image file → extract metadata → create DB record."""

        relative = file_path.relative_to(root)
        meta = self.extractor.extract(file_path)

        # Station detection
        station_info = station_detector.detect(file_path)
        station_name = station_info["station_name"]
        station_orm = self._get_or_create_station(
            db, dataset_id, station_name,
            station_info["source_folder"],
            meta.get("latitude"),
            meta.get("longitude"),
            station_cache,
        )

        # Build image record
        image = Image(
            dataset_id=dataset_id,
            filename=file_path.name,
            relative_path=str(relative),
            extension=file_path.suffix.lower(),
            file_size=meta.get("file_size", 0),
            width=meta.get("width"),
            height=meta.get("height"),
            filesystem_timestamp=meta.get("filesystem_timestamp"),
            exif_timestamp=meta.get("exif_timestamp"),
            latitude=meta.get("latitude"),
            longitude=meta.get("longitude"),
            station_id=station_orm.id if station_orm else None,
            validation_status=meta.get("validation_status", ValidationStatus.UNKNOWN.value),
            validation_notes=json.dumps(meta.get("validation_notes", [])),
            created_at=datetime.utcnow(),
        )
        db.add(image)
        return image

    def _get_or_create_station(
        self,
        db: Session,
        dataset_id: int,
        station_name: str,
        source_folder: str,
        latitude: Optional[float],
        longitude: Optional[float],
        cache: Dict[str, Station],
    ) -> Station:
        """Retrieve or create a Station record, using a local cache."""
        key = f"{dataset_id}:{station_name}"
        if key in cache:
            return cache[key]

        station = Station(
            dataset_id=dataset_id,
            station_name=station_name,
            source_folder=source_folder,
            latitude=latitude,
            longitude=longitude,
            image_count=0,
        )
        db.add(station)
        db.flush()  # get the ID
        cache[key] = station
        return station
