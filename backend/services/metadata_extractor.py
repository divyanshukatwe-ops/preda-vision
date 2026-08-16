"""
PenchGuard AI — Metadata Extractor
Extracts EXIF data, GPS coordinates, dimensions, and timestamps from images.
Gracefully handles missing/corrupt metadata.
"""

import os
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

from PIL import Image, ExifTags
from PIL.ExifTags import TAGS, GPSTAGS

logger = logging.getLogger(__name__)


class MetadataExtractor:
    """Extracts metadata from a single image file without modifying it."""

    # Common EXIF date formats
    EXIF_DATE_FORMATS = [
        "%Y:%m:%d %H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y/%m/%d %H:%M:%S",
        "%Y:%m:%d",
        "%Y-%m-%d",
    ]

    def extract(self, file_path: Path) -> Dict[str, Any]:
        """
        Extract all available metadata from an image file.

        Returns a dict with:
            width, height, exif_timestamp, latitude, longitude,
            file_size, filesystem_timestamp, validation_status,
            validation_notes (list of warning strings)
        """
        result: Dict[str, Any] = {
            "width": None,
            "height": None,
            "exif_timestamp": None,
            "latitude": None,
            "longitude": None,
            "file_size": 0,
            "filesystem_timestamp": None,
            "validation_status": "VALID",
            "validation_notes": [],
        }

        warnings: List[str] = []

        # ---- File-level metadata ----
        try:
            stat = file_path.stat()
            result["file_size"] = stat.st_size
            # Use modification time as the filesystem timestamp
            result["filesystem_timestamp"] = datetime.fromtimestamp(stat.st_mtime)
        except Exception as e:
            warnings.append(f"Cannot stat file: {e}")

        # ---- Open image and extract dimensions + EXIF ----
        try:
            with Image.open(file_path) as img:
                result["width"] = img.width
                result["height"] = img.height

                # Extract EXIF
                exif_data = self._get_exif(img)
                if exif_data:
                    # Timestamp
                    ts = self._extract_timestamp(exif_data)
                    if ts:
                        result["exif_timestamp"] = ts
                    else:
                        warnings.append("Missing EXIF timestamp")

                    # GPS
                    gps = self._extract_gps(exif_data)
                    if gps:
                        result["latitude"] = gps[0]
                        result["longitude"] = gps[1]
                    else:
                        warnings.append("Missing GPS data")
                else:
                    warnings.append("No EXIF data found")
                    warnings.append("Missing GPS data")
                    warnings.append("Missing EXIF timestamp")

        except Exception as e:
            result["validation_status"] = "CORRUPT"
            warnings.append(f"Corrupted image: {e}")
            logger.warning("Corrupt image %s: %s", file_path, e)

        result["validation_notes"] = warnings
        if result["validation_status"] != "CORRUPT" and not warnings:
            result["validation_status"] = "VALID"
        elif result["validation_status"] != "CORRUPT" and warnings:
            # Still valid but with warnings
            result["validation_status"] = "VALID"

        return result

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _get_exif(self, img: Image.Image) -> Optional[Dict[str, Any]]:
        """Get decoded EXIF dict from a PIL Image."""
        try:
            raw_exif = img._getexif()
            if not raw_exif:
                return None
            decoded = {}
            for tag_id, value in raw_exif.items():
                tag_name = TAGS.get(tag_id, tag_id)
                decoded[tag_name] = value
            return decoded
        except Exception:
            return None

    def _extract_timestamp(self, exif: Dict[str, Any]) -> Optional[datetime]:
        """Try multiple EXIF date fields."""
        for field in ("DateTimeOriginal", "DateTimeDigitized", "DateTime"):
            raw = exif.get(field)
            if raw and isinstance(raw, str):
                for fmt in self.EXIF_DATE_FORMATS:
                    try:
                        return datetime.strptime(raw.strip(), fmt)
                    except ValueError:
                        continue
        return None

    def _extract_gps(self, exif: Dict[str, Any]) -> Optional[Tuple[float, float]]:
        """Extract GPS coordinates from EXIF GPSInfo field."""
        gps_info = exif.get("GPSInfo")
        if not gps_info:
            return None

        try:
            # Decode GPS tags
            decoded_gps = {}
            for key, val in gps_info.items():
                tag = GPSTAGS.get(key, key)
                decoded_gps[tag] = val

            lat = self._dms_to_decimal(
                decoded_gps.get("GPSLatitude"),
                decoded_gps.get("GPSLatitudeRef", "N"),
            )
            lon = self._dms_to_decimal(
                decoded_gps.get("GPSLongitude"),
                decoded_gps.get("GPSLongitudeRef", "E"),
            )
            if lat is not None and lon is not None:
                return (lat, lon)
        except Exception as e:
            logger.debug("GPS extraction failed: %s", e)

        return None

    @staticmethod
    def _dms_to_decimal(dms, ref: str) -> Optional[float]:
        """Convert DMS (degrees-minutes-seconds) tuple to decimal degrees."""
        if not dms or len(dms) < 3:
            return None
        try:
            degrees = float(dms[0])
            minutes = float(dms[1])
            seconds = float(dms[2])
            decimal = degrees + minutes / 60.0 + seconds / 3600.0
            if ref in ("S", "W"):
                decimal = -decimal
            return round(decimal, 6)
        except (TypeError, ValueError, ZeroDivisionError):
            return None
