"""
PenchGuard AI — Movement Analyzer Service
Calculates spatial movement trajectories, Haversine distances, corridor passage density,
and territory home range bounds for Pench Tiger Reserve individuals.
"""

import math
import logging
from datetime import datetime
from typing import Dict, List, Optional

from sqlalchemy.orm import Session
from backend.models.database import (
    Dataset, Image, Station, Detection, IndividualTiger, SessionLocal
)

logger = logging.getLogger(__name__)


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate Great Circle distance between two GPS coordinates in kilometers."""
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


class MovementAnalyzer:
    """
    Offline local GIS spatial movement analyzer for Pench Tiger Reserve wildlife.
    """

    def analyze_dataset_movement(self, dataset_id: int) -> dict:
        """
        Analyzes all tiger sightings in a dataset, returning spatial trajectories,
        corridor transition counts, and station activity metrics.
        """
        db: Session = SessionLocal()
        try:
            dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
            if not dataset:
                return {}

            # Fetch all stations
            stations = db.query(Station).filter(Station.dataset_id == dataset_id).all()
            station_map = {s.id: s for s in stations}

            # Fetch all individual tigers
            tigers = db.query(IndividualTiger).order_by(IndividualTiger.tiger_code).all()

            trajectories = []
            corridor_transitions: Dict[str, int] = {}
            total_distance_all = 0.0

            for tiger in tigers:
                # Query all sightings for this tiger ordered chronologically
                dets = (
                    db.query(Detection)
                    .join(Image)
                    .filter(
                        Detection.individual_id == tiger.id,
                        Image.dataset_id == dataset_id,
                        Image.is_deleted == 0,
                    )
                    .order_by(Image.exif_timestamp, Image.filesystem_timestamp)
                    .all()
                )

                sightings_list = []
                tiger_distance = 0.0
                prev_sight = None

                for d in dets:
                    img = d.image
                    st = img.station
                    if not st or st.latitude is None or st.longitude is None:
                        continue

                    ts = img.exif_timestamp or img.filesystem_timestamp or datetime.utcnow()
                    sight_item = {
                        "detection_id": d.id,
                        "image_id": img.id,
                        "filename": img.filename,
                        "station_id": st.id,
                        "station_name": st.station_name,
                        "latitude": st.latitude,
                        "longitude": st.longitude,
                        "timestamp": ts.isoformat() if ts else None,
                        "reid_confidence": d.reid_confidence or d.confidence,
                    }

                    if prev_sight:
                        dist = haversine_km(
                            prev_sight["latitude"], prev_sight["longitude"],
                            st.latitude, st.longitude
                        )

                        # Record corridor transition if moving between different stations
                        if prev_sight["station_name"] != st.station_name:
                            corridor_key = f"{prev_sight['station_name']} -> {st.station_name}"
                            corridor_transitions[corridor_key] = (
                                corridor_transitions.get(corridor_key, 0) + 1
                            )
                            tiger_distance += dist

                    sightings_list.append(sight_item)
                    prev_sight = sight_item

                total_distance_all += tiger_distance

                # Calculate bounding box territory range
                lats = [s["latitude"] for s in sightings_list]
                lons = [s["longitude"] for s in sightings_list]

                territory_bounds = None
                if lats and lons:
                    territory_bounds = {
                        "min_lat": min(lats),
                        "max_lat": max(lats),
                        "min_lon": min(lons),
                        "max_lon": max(lons),
                    }

                trajectories.append({
                    "tiger_id": tiger.id,
                    "tiger_code": tiger.tiger_code,
                    "tiger_name": tiger.name,
                    "gender": tiger.gender,
                    "territory_zone": tiger.territory_zone,
                    "total_sightings": len(sightings_list),
                    "total_distance_km": round(tiger_distance, 1),
                    "territory_bounds": territory_bounds,
                    "sightings": sightings_list,
                })

            # Top active corridors sorted by passage frequency
            top_corridors = [
                {"corridor": k, "passages": v}
                for k, v in sorted(corridor_transitions.items(), key=lambda x: x[1], reverse=True)
            ]

            return {
                "dataset_id": dataset_id,
                "dataset_name": dataset.name,
                "total_tigers_tracked": len(tigers),
                "total_distance_tracked_km": round(total_distance_all, 1),
                "active_corridors_count": len(top_corridors),
                "top_corridors": top_corridors[:10],
                "trajectories": trajectories,
            }

        finally:
            db.close()
