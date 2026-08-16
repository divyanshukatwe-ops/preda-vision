"""
PenchGuard AI — Database Models & Engine
SQLite-backed persistence for camera-trap datasets.
"""

import os
from datetime import datetime
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, DateTime,
    ForeignKey, Text, BigInteger, Enum as SAEnum
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
import enum

# ---------------------------------------------------------------------------
# Database path — lives in data/database/ relative to project root
# ---------------------------------------------------------------------------
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DB_DIR = os.path.join(PROJECT_ROOT, "data", "database")
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, "penchguard.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------
class DatasetStatus(str, enum.Enum):
    PENDING = "PENDING"
    SCANNING = "SCANNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class ValidationStatus(str, enum.Enum):
    VALID = "VALID"
    INVALID = "INVALID"
    CORRUPT = "CORRUPT"
    UNKNOWN = "UNKNOWN"


# ---------------------------------------------------------------------------
# ORM Models
# ---------------------------------------------------------------------------
class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    source_path = Column(Text, nullable=False)
    imported_at = Column(DateTime, default=datetime.utcnow)
    total_images = Column(Integer, default=0)
    valid_images = Column(Integer, default=0)
    invalid_images = Column(Integer, default=0)
    total_size_bytes = Column(BigInteger, default=0)
    status = Column(String(20), default=DatasetStatus.PENDING.value)
    is_demo = Column(Integer, default=0)  # 1 = demo dataset

    images = relationship("Image", back_populates="dataset", cascade="all, delete-orphan")
    stations = relationship("Station", back_populates="dataset", cascade="all, delete-orphan")


class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    relative_path = Column(Text, nullable=False)
    extension = Column(String(10), nullable=False)
    file_size = Column(BigInteger, default=0)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    filesystem_timestamp = Column(DateTime, nullable=True)
    exif_timestamp = Column(DateTime, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    station_id = Column(Integer, ForeignKey("stations.id", ondelete="SET NULL"), nullable=True)
    validation_status = Column(String(20), default=ValidationStatus.UNKNOWN.value)
    validation_notes = Column(Text, nullable=True)  # JSON list of warning strings
    is_deleted = Column(Integer, default=0)  # 0 = active, 1 = soft-deleted
    is_blank = Column(Integer, nullable=True)  # 0 = animal, 1 = blank
    blank_confidence = Column(Float, nullable=True)  # 0.0 - 1.0
    is_quarantined = Column(Integer, default=0)  # 0 = active queue, 1 = quarantined
    processed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("Dataset", back_populates="images")
    station = relationship("Station", back_populates="images")
    detections = relationship("Detection", back_populates="image", cascade="all, delete-orphan")


class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    station_name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    source_folder = Column(Text, nullable=True)
    image_count = Column(Integer, default=0)

    dataset = relationship("Dataset", back_populates="stations")
    images = relationship("Image", back_populates="station")


class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    image_id = Column(Integer, ForeignKey("images.id", ondelete="CASCADE"), nullable=False)
    species_name = Column(String(100), nullable=False)  # Tiger, Leopard, Sloth Bear, Deer, Gaur, etc.
    confidence = Column(Float, nullable=False)  # 0.0 - 1.0
    bbox_x = Column(Float, nullable=False)  # Normalized 0.0 - 1.0
    bbox_y = Column(Float, nullable=False)
    bbox_w = Column(Float, nullable=False)
    bbox_h = Column(Float, nullable=False)
    individual_id = Column(Integer, ForeignKey("individual_tigers.id", ondelete="SET NULL"), nullable=True)
    reid_confidence = Column(Float, nullable=True)
    detected_at = Column(DateTime, default=datetime.utcnow)

    image = relationship("Image", back_populates="detections")
    individual_tiger = relationship("IndividualTiger", back_populates="detections")


class IndividualTiger(Base):
    __tablename__ = "individual_tigers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tiger_code = Column(String(50), unique=True, index=True, nullable=False)  # T-01, T-15, etc.
    name = Column(String(100), nullable=False)  # e.g., "Raiyyakasa Male", "Collarwali Lineage"
    gender = Column(String(20), default="Unknown")  # Male, Female, Unknown
    territory_zone = Column(String(100), nullable=True)  # e.g., "Turia Range", "Karmajhiri"
    stripe_signature = Column(Text, nullable=True)  # Pattern feature hash / descriptor
    first_seen = Column(DateTime, nullable=True)
    last_seen = Column(DateTime, nullable=True)
    total_sightings = Column(Integer, default=0)
    primary_image_id = Column(Integer, ForeignKey("images.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    detections = relationship("Detection", back_populates="individual_tiger")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    alert_type = Column(String(50), nullable=False)  # HUMAN_INTRUSION, TERRITORY_BREACH, UNUSUAL_SPEED_VELOCITY, STATION_OFFLINE
    severity = Column(String(20), nullable=False)  # CRITICAL, HIGH, MEDIUM, INFO
    station_name = Column(String(100), nullable=True)
    tiger_code = Column(String(50), nullable=True)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    is_acknowledged = Column(Integer, default=0)  # 0 = false, 1 = true
    image_id = Column(Integer, ForeignKey("images.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("Dataset")
    image = relationship("Image")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def init_db():
    """Create all tables if they don't exist and perform light migrations."""
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        from sqlalchemy import text
        res = conn.execute(text("PRAGMA table_info(images)"))
        columns = [row[1] for row in res.fetchall()]
        if "is_deleted" not in columns:
            conn.execute(text("ALTER TABLE images ADD COLUMN is_deleted INTEGER DEFAULT 0"))
        if "is_blank" not in columns:
            conn.execute(text("ALTER TABLE images ADD COLUMN is_blank INTEGER"))
        if "blank_confidence" not in columns:
            conn.execute(text("ALTER TABLE images ADD COLUMN blank_confidence FLOAT"))
        if "is_quarantined" not in columns:
            conn.execute(text("ALTER TABLE images ADD COLUMN is_quarantined INTEGER DEFAULT 0"))
        if "processed_at" not in columns:
            conn.execute(text("ALTER TABLE images ADD COLUMN processed_at DATETIME"))

        res_det = conn.execute(text("PRAGMA table_info(detections)"))
        det_cols = [row[1] for row in res_det.fetchall()]
        if "individual_id" not in det_cols:
            conn.execute(text("ALTER TABLE detections ADD COLUMN individual_id INTEGER"))
        if "reid_confidence" not in det_cols:
            conn.execute(text("ALTER TABLE detections ADD COLUMN reid_confidence FLOAT"))

        conn.commit()


def get_db():
    """Dependency for FastAPI — yields a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
