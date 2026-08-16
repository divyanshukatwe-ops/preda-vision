"""
PenchGuard AI — Station Detector
Infers camera station identity from directory structure.
"""

import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# Folder names too generic to be a station identifier
GENERIC_NAMES = {
    "images", "photos", "pics", "camera", "data", "raw",
    "originals", "import", "dataset", "dcim", "100media",
    "100andro", "camera roll", "misc", "temp", "tmp",
}


class StationDetector:
    """Infers camera-station names from the folder hierarchy of each image."""

    def __init__(self, dataset_root: Path):
        self.dataset_root = dataset_root

    def detect(self, image_path: Path) -> dict:
        """
        Determine the station for a given image path.

        Returns:
            {
                "station_name": str,
                "source_folder": str,     # relative folder path
                "is_unknown": bool,
            }
        """
        try:
            relative = image_path.relative_to(self.dataset_root)
        except ValueError:
            return {
                "station_name": "UNKNOWN_STATION",
                "source_folder": str(image_path.parent),
                "is_unknown": True,
            }

        parts = relative.parts  # e.g. ("CAM_001", "sub", "IMG.jpg")

        # If the image sits directly in the root, we can't infer a station
        if len(parts) <= 1:
            return {
                "station_name": "UNKNOWN_STATION",
                "source_folder": ".",
                "is_unknown": True,
            }

        # Use the first subfolder as the station name by default.
        # If there are nested folders (e.g. Cycle/CAM_001/img.jpg),
        # prefer the immediate parent of the image if it looks specific,
        # otherwise fall back to the first subfolder.
        immediate_parent = parts[-2]
        first_subfolder = parts[0]

        # Check if immediate parent is a meaningful name
        if self._is_station_name(immediate_parent):
            station = immediate_parent
            source_folder = str(Path(*parts[:-1]))
        elif self._is_station_name(first_subfolder):
            station = first_subfolder
            source_folder = first_subfolder
        else:
            station = immediate_parent  # fallback — use whatever we have
            source_folder = str(Path(*parts[:-1]))

        return {
            "station_name": station,
            "source_folder": source_folder,
            "is_unknown": False,
        }

    @staticmethod
    def _is_station_name(name: str) -> bool:
        """Heuristic: a folder name is likely a station if it's not generic."""
        return name.lower().strip() not in GENERIC_NAMES
