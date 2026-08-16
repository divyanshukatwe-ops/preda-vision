"""
PenchGuard AI — Image API endpoints
"""

import io
import logging
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from PIL import Image as PILImage

from backend.models.database import Dataset, Image, get_db
from backend.models.schemas import ImageResponse
from backend.utils.helpers import get_project_root

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["images"])

THUMBNAIL_SIZE = (300, 300)
THUMBNAIL_DIR = get_project_root() / "data" / "processed" / "thumbnails"


# ---------------------------------------------------------------------------
# GET /api/images/{id}
# ---------------------------------------------------------------------------
@router.get("/images/{image_id}", response_model=ImageResponse)
async def get_image(image_id: int, db: Session = Depends(get_db)):
    """Get metadata for a single image."""
    img = db.query(Image).filter(Image.id == image_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")

    resp = ImageResponse.model_validate(img)
    if img.station:
        resp.station_name = img.station.station_name
    return resp


# ---------------------------------------------------------------------------
# GET /api/images/{id}/thumbnail
# ---------------------------------------------------------------------------
@router.get("/images/{image_id}/thumbnail")
async def get_image_thumbnail(image_id: int, db: Session = Depends(get_db)):
    """Serve a thumbnail for an image. Generates and caches on first request."""
    img = db.query(Image).filter(Image.id == image_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")

    dataset = db.query(Dataset).filter(Dataset.id == img.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Build full path to original image
    source_path = Path(dataset.source_path)
    image_path = source_path / img.relative_path

    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Original image file not found")

    # Check cached thumbnail
    THUMBNAIL_DIR.mkdir(parents=True, exist_ok=True)
    thumb_path = THUMBNAIL_DIR / f"{image_id}.jpg"

    if not thumb_path.exists():
        try:
            with PILImage.open(image_path) as pil_img:
                pil_img.thumbnail(THUMBNAIL_SIZE)
                # Convert to RGB if necessary (handles RGBA, P modes)
                if pil_img.mode not in ("RGB", "L"):
                    pil_img = pil_img.convert("RGB")
                pil_img.save(str(thumb_path), "JPEG", quality=75)
        except Exception as e:
            logger.warning("Cannot generate thumbnail for image %d: %s", image_id, e)
            # Return a placeholder response
            raise HTTPException(status_code=422, detail=f"Cannot generate thumbnail: {e}")

    # Stream the thumbnail
    def iter_file():
        with open(thumb_path, "rb") as f:
            yield from f

    return StreamingResponse(iter_file(), media_type="image/jpeg")


# ---------------------------------------------------------------------------
# GET /api/images/{id}/full
# ---------------------------------------------------------------------------
@router.get("/images/{image_id}/full")
async def get_image_full(image_id: int, db: Session = Depends(get_db)):
    """Serve the full original image (read-only, never modified)."""
    img = db.query(Image).filter(Image.id == image_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")

    dataset = db.query(Dataset).filter(Dataset.id == img.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    source_path = Path(dataset.source_path)
    image_path = source_path / img.relative_path

    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Original image file not found")

    # Determine media type
    ext = img.extension.lower()
    media_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }
    media_type = media_types.get(ext, "image/jpeg")

    def iter_file():
        with open(image_path, "rb") as f:
            yield from f

    return StreamingResponse(iter_file(), media_type=media_type)


# ---------------------------------------------------------------------------
# POST /api/images/{id}/delete (Soft Delete)
# ---------------------------------------------------------------------------
@router.post("/images/{image_id}/delete", response_model=ImageResponse)
@router.delete("/images/{image_id}", response_model=ImageResponse)
async def delete_image(image_id: int, db: Session = Depends(get_db)):
    """Soft-delete an image record in the database. Original file is NOT deleted."""
    img = db.query(Image).filter(Image.id == image_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")

    img.is_deleted = 1
    db.commit()
    db.refresh(img)

    resp = ImageResponse.model_validate(img)
    if img.station:
        resp.station_name = img.station.station_name
    return resp


# ---------------------------------------------------------------------------
# POST /api/images/{id}/restore (Retrieve / Un-delete)
# ---------------------------------------------------------------------------
@router.post("/images/{image_id}/restore", response_model=ImageResponse)
async def restore_image(image_id: int, db: Session = Depends(get_db)):
    """Restore a previously deleted image record in SQLite back to the active dataset."""
    img = db.query(Image).filter(Image.id == image_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")

    img.is_deleted = 0
    db.commit()
    db.refresh(img)

    resp = ImageResponse.model_validate(img)
    if img.station:
        resp.station_name = img.station.station_name
    return resp

