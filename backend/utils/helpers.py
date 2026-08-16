"""
PenchGuard AI — Utility helpers
"""

import os
from pathlib import Path


def get_project_root() -> Path:
    """Return the project root directory."""
    return Path(__file__).resolve().parent.parent.parent


def ensure_data_dirs():
    """Create the data directory structure if it doesn't exist."""
    root = get_project_root()
    dirs = [
        root / "data" / "originals",
        root / "data" / "quarantine",
        root / "data" / "processed",
        root / "data" / "processed" / "thumbnails",
        root / "data" / "exports",
        root / "data" / "database",
    ]
    for d in dirs:
        d.mkdir(parents=True, exist_ok=True)


def format_file_size(size_bytes: int) -> str:
    """Human-readable file size."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 ** 2:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 ** 3:
        return f"{size_bytes / (1024 ** 2):.1f} MB"
    else:
        return f"{size_bytes / (1024 ** 3):.2f} GB"
