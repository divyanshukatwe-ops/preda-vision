"""
PenchGuard AI — Pydantic Response Schemas
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Station
# ---------------------------------------------------------------------------
class StationResponse(BaseModel):
    id: int
    dataset_id: int
    station_name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    source_folder: Optional[str] = None
    image_count: int = 0

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Image
# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Detections & Re-ID
# ---------------------------------------------------------------------------
class DetectionResponse(BaseModel):
    id: int
    image_id: int
    species_name: str
    confidence: float
    bbox_x: float
    bbox_y: float
    bbox_w: float
    bbox_h: float
    individual_id: Optional[int] = None
    reid_confidence: Optional[float] = None
    tiger_code: Optional[str] = None
    detected_at: Optional[datetime] = None

class ImageResponse(BaseModel):
    id: int
    dataset_id: int
    filename: str
    relative_path: str
    extension: str
    file_size: int = 0
    width: Optional[int] = None
    height: Optional[int] = None
    filesystem_timestamp: Optional[datetime] = None
    exif_timestamp: Optional[datetime] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    station_id: Optional[int] = None
    station_name: Optional[str] = None
    validation_status: str = "UNKNOWN"
    validation_notes: Optional[str] = None
    is_deleted: int = 0
    is_blank: Optional[int] = None
    blank_confidence: Optional[float] = None
    is_quarantined: int = 0
    processed_at: Optional[datetime] = None
    detections: List[DetectionResponse] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Blank & Species Detection Progress
# ---------------------------------------------------------------------------
class BlankDetectionProgressResponse(BaseModel):
    dataset_id: int
    status: str  # IDLE, PROCESSING, COMPLETED, FAILED
    total_images: int
    processed_images: int
    blank_count: int
    animal_count: int
    quarantined_count: int
    current_file: str = ""
    percent: float = 0.0
    speed_fps: float = 0.0
    time_saved_hours: float = 0.0


class StartBlankDetectionRequest(BaseModel):
    dataset_id: int
    confidence_threshold: float = 0.80  # Default 80% confidence
    auto_quarantine: bool = False


class SpeciesDetectionProgressResponse(BaseModel):
    dataset_id: int
    status: str  # IDLE, PROCESSING, COMPLETED, FAILED
    total_images: int
    processed_images: int
    tiger_count: int
    total_detections: int
    species_counts: dict = {}
    current_file: str = ""
    percent: float = 0.0
    speed_fps: float = 0.0


class SpeciesSummaryResponse(BaseModel):
    dataset_id: int
    dataset_name: str
    total_images: int
    total_detections: int
    tiger_count: int
    tiger_images_count: int
    species_counts: dict = {}


class IndividualTigerResponse(BaseModel):
    id: int
    tiger_code: str
    name: str
    gender: str = "Unknown"
    territory_zone: Optional[str] = None
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    total_sightings: int = 0
    primary_image_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReIDProgressResponse(BaseModel):
    dataset_id: int
    status: str  # IDLE, PROCESSING, COMPLETED, FAILED
    total_tigers_detected: int
    matched_tigers: int
    unique_individuals_count: int
    percent: float = 0.0
    speed_fps: float = 0.0


class SightingTimelineEvent(BaseModel):
    image_id: int
    filename: str
    station_name: str
    timestamp: Optional[datetime] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    confidence: float


class TigerSightingTimelineResponse(BaseModel):
    tiger: IndividualTigerResponse
    total_sightings: int
    stations_visited: List[str]
    timeline: List[SightingTimelineEvent]



# ---------------------------------------------------------------------------
# Dataset
# ---------------------------------------------------------------------------
class DatasetResponse(BaseModel):
    id: int
    name: str
    source_path: str
    imported_at: Optional[datetime] = None
    total_images: int = 0
    valid_images: int = 0
    invalid_images: int = 0
    total_size_bytes: int = 0
    status: str = "PENDING"
    is_demo: int = 0

    class Config:
        from_attributes = True


class DatasetListResponse(BaseModel):
    datasets: List[DatasetResponse]
    total: int


# ---------------------------------------------------------------------------
# Health Report
# ---------------------------------------------------------------------------
class HealthMetric(BaseModel):
    label: str
    value: float  # raw value (count or percentage)
    total: Optional[float] = None  # denominator if applicable
    percent: Optional[float] = None
    status: str = "green"  # green / yellow / red


class DatasetHealthResponse(BaseModel):
    dataset_id: int
    dataset_name: str
    health_score: float  # 0-100
    total_images: int
    valid_images: int
    invalid_images: int
    corrupt_images: int
    stations_count: int
    gps_available_percent: float
    timestamp_available_percent: float
    duplicate_candidates: int
    metrics: List[HealthMetric]


# ---------------------------------------------------------------------------
# Import Progress
# ---------------------------------------------------------------------------
class ImportProgressResponse(BaseModel):
    dataset_id: int
    status: str  # SCANNING, COMPLETED, FAILED
    total_files: int
    scanned_files: int
    current_file: str = ""
    percent: float = 0.0
    errors: int = 0


# ---------------------------------------------------------------------------
# Request Bodies
# ---------------------------------------------------------------------------
class ImportRequest(BaseModel):
    source_path: str
    name: Optional[str] = None


# ---------------------------------------------------------------------------
# Paginated images
# ---------------------------------------------------------------------------
class PaginatedImagesResponse(BaseModel):
    images: List[ImageResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ---------------------------------------------------------------------------
# Security & Threat Alerts
# ---------------------------------------------------------------------------
class AlertResponse(BaseModel):
    id: int
    dataset_id: int
    alert_type: str  # HUMAN_INTRUSION, TERRITORY_BREACH, UNUSUAL_SPEED_VELOCITY, STATION_OFFLINE
    severity: str  # CRITICAL, HIGH, MEDIUM, INFO
    station_name: Optional[str] = None
    tiger_code: Optional[str] = None
    message: str
    timestamp: Optional[datetime] = None
    is_acknowledged: int = 0
    image_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AlertSummaryResponse(BaseModel):
    dataset_id: int
    total_alerts: int
    unacknowledged_count: int
    critical_count: int
    high_count: int
    medium_count: int
    info_count: int
    alerts_by_type: dict = {}
    alerts: List[AlertResponse] = []
