"""
PenchGuard AI — Demo Dataset Generator
Creates a realistic synthetic camera-trap dataset for demonstration.
"""

import io
import json
import logging
import os
import random
import struct
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from PIL import Image as PILImage
from PIL.ExifTags import Base as ExifBase

logger = logging.getLogger(__name__)

# Pench Tiger Reserve approximate center
PENCH_LAT = 21.72
PENCH_LON = 79.30

# Camera station names — realistic for a tiger reserve
STATION_NAMES = [
    "CAM_001", "CAM_002", "CAM_003", "CAM_004", "CAM_005",
    "CAM_006", "CAM_007", "CAM_008", "CAM_009", "CAM_010",
]

# Station GPS offsets (jitter around Pench center)
STATION_OFFSETS = [
    (0.01, 0.02), (-0.015, 0.01), (0.005, -0.018), (-0.02, -0.005),
    (0.018, 0.008), (-0.008, 0.015), (0.012, -0.01), (-0.005, 0.022),
    (0.003, -0.015), (-0.018, -0.012),
]

# Colors for generated images (simulates different scene conditions)
SCENE_COLORS = [
    (34, 85, 34),    # forest green
    (20, 50, 20),    # dark forest
    (60, 120, 60),   # bright canopy
    (45, 90, 45),    # midtone green
    (80, 80, 50),    # dry grass
    (30, 30, 30),    # night shot
    (100, 90, 70),   # trail/mud
    (50, 70, 40),    # mixed vegetation
]


class DemoGenerator:
    """Generates a demo camera-trap dataset with realistic metadata."""

    def __init__(self, output_dir: Optional[str] = None):
        if output_dir:
            self.output_dir = Path(output_dir)
        else:
            project_root = Path(__file__).resolve().parent.parent.parent
            self.output_dir = project_root / "data" / "demo_dataset"

    def generate(self, num_images: int = 600) -> str:
        """
        Generate the demo dataset.
        Returns the absolute path to the generated dataset folder.
        """
        logger.info("Generating demo dataset with %d images at %s", num_images, self.output_dir)

        # Clean up previous demo if exists
        if self.output_dir.exists():
            import shutil
            shutil.rmtree(self.output_dir)

        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Base timestamp — simulate a 30-day survey window
        base_time = datetime(2026, 7, 1, 5, 0, 0)

        images_per_station = num_images // len(STATION_NAMES)
        remainder = num_images % len(STATION_NAMES)
        image_idx = 0

        for station_idx, station_name in enumerate(STATION_NAMES):
            station_dir = self.output_dir / station_name
            station_dir.mkdir(parents=True, exist_ok=True)

            count = images_per_station + (1 if station_idx < remainder else 0)
            lat_offset, lon_offset = STATION_OFFSETS[station_idx]
            station_lat = PENCH_LAT + lat_offset
            station_lon = PENCH_LON + lon_offset

            for i in range(count):
                image_idx += 1
                filename = f"IMG_{image_idx:05d}.JPG"
                filepath = station_dir / filename

                # Randomize timestamp within survey window
                delta = timedelta(
                    days=random.randint(0, 29),
                    hours=random.randint(0, 23),
                    minutes=random.randint(0, 59),
                    seconds=random.randint(0, 59),
                )
                timestamp = base_time + delta

                # Decide what kind of image to create
                roll = random.random()

                if roll < 0.02:
                    # ~2% corrupt files
                    self._create_corrupt_file(filepath)
                elif roll < 0.05:
                    # ~3% missing timestamp
                    self._create_image(
                        filepath, station_lat, station_lon,
                        timestamp=None,
                        include_gps=True,
                    )
                elif roll < 0.10:
                    # ~5% missing GPS
                    self._create_image(
                        filepath, station_lat, station_lon,
                        timestamp=timestamp,
                        include_gps=False,
                    )
                else:
                    # Normal image with full metadata
                    gps_jitter_lat = station_lat + random.uniform(-0.001, 0.001)
                    gps_jitter_lon = station_lon + random.uniform(-0.001, 0.001)
                    self._create_image(
                        filepath, gps_jitter_lat, gps_jitter_lon,
                        timestamp=timestamp,
                        include_gps=True,
                    )

        logger.info("Demo dataset generated: %d images in %s", image_idx, self.output_dir)
        return str(self.output_dir)

    def _create_image(
        self,
        filepath: Path,
        lat: float, lon: float,
        timestamp: Optional[datetime],
        include_gps: bool = True,
    ):
        """Create a small valid JPEG with optional EXIF data."""
        import piexif

        # Create a small colored image
        color = random.choice(SCENE_COLORS)
        w = random.choice([320, 640, 480])
        h = random.choice([240, 480, 360])
        img = PILImage.new("RGB", (w, h), color)

        # Add some random noise/variation
        pixels = img.load()
        for _ in range(50):
            rx, ry = random.randint(0, w - 1), random.randint(0, h - 1)
            rc = tuple(max(0, min(255, c + random.randint(-30, 30))) for c in color)
            pixels[rx, ry] = rc

        # Build EXIF
        exif_dict = {"0th": {}, "Exif": {}, "GPS": {}, "1st": {}}

        if timestamp:
            ts_str = timestamp.strftime("%Y:%m:%d %H:%M:%S")
            exif_dict["Exif"][piexif.ExifIFD.DateTimeOriginal] = ts_str.encode()
            exif_dict["Exif"][piexif.ExifIFD.DateTimeDigitized] = ts_str.encode()
            exif_dict["0th"][piexif.ImageIFD.DateTime] = ts_str.encode()

        if include_gps:
            exif_dict["GPS"] = self._build_gps_ifd(lat, lon)

        exif_dict["0th"][piexif.ImageIFD.Make] = b"CameraTrap"
        exif_dict["0th"][piexif.ImageIFD.Model] = b"PenchCam v2"

        try:
            exif_bytes = piexif.dump(exif_dict)
            img.save(str(filepath), "JPEG", quality=70, exif=exif_bytes)
        except Exception:
            # Fallback — save without EXIF if piexif fails
            img.save(str(filepath), "JPEG", quality=70)

    def _create_corrupt_file(self, filepath: Path):
        """Create a truncated/corrupt file that looks like a JPEG but isn't."""
        with open(filepath, "wb") as f:
            f.write(b"\xff\xd8\xff\xe0")  # JPEG magic bytes
            f.write(os.urandom(random.randint(100, 500)))  # garbage

    @staticmethod
    def _build_gps_ifd(lat: float, lon: float) -> dict:
        """Build a piexif GPS IFD dict from decimal coordinates."""
        import piexif

        def to_dms_rational(value):
            """Convert decimal degrees to DMS as rational tuples for piexif."""
            abs_val = abs(value)
            d = int(abs_val)
            m = int((abs_val - d) * 60)
            s = int(((abs_val - d) * 60 - m) * 60 * 10000)
            return ((d, 1), (m, 1), (s, 10000))

        lat_ref = b"N" if lat >= 0 else b"S"
        lon_ref = b"E" if lon >= 0 else b"W"

        return {
            piexif.GPSIFD.GPSLatitudeRef: lat_ref,
            piexif.GPSIFD.GPSLatitude: to_dms_rational(lat),
            piexif.GPSIFD.GPSLongitudeRef: lon_ref,
            piexif.GPSIFD.GPSLongitude: to_dms_rational(lon),
        }
