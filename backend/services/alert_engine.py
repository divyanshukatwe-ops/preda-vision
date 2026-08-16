"""
PenchGuard AI — Security & Threat Alert Engine
Analyzes camera-trap detections, spatial movement vectors, EXIF timestamps,
and station telemetry to generate real-time security & ecological risk alerts.
"""

import logging
from datetime import datetime, time
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from backend.models.database import Image, Detection, IndividualTiger, Station, Alert

logger = logging.getLogger(__name__)

# Dominant territory mapping for rule evaluation
TERRITORY_CAMERAS: Dict[str, List[str]] = {
    'T-01': ['CAM_001', 'CAM_002', 'CAM_003'],  # Turia & Karmajhiri
    'T-15': ['CAM_004', 'CAM_005'],             # Raiyyakasa River Zone
    'T-30': ['CAM_006'],                        # Sitaghat / Mowgli Zone
    'T-42': ['CAM_007', 'CAM_008'],             # Northern Pench Border
    'T-54': ['CAM_009'],                        # Telia Dam / Bichhia Nalla
    'T-61': ['CAM_010'],                        # Gumtara Buffer Territory
}

class AlertEngine:
    def __init__(self, db: Session):
        self.db = db

    def generate_alerts_for_dataset(self, dataset_id: int) -> List[Alert]:
        """Runs security and ecological rule checks and creates Alert records in DB."""
        # Check existing alerts to avoid duplicate spamming
        existing_count = self.db.query(Alert).filter(Alert.dataset_id == dataset_id).count()
        if existing_count > 0:
            return self.db.query(Alert).filter(Alert.dataset_id == dataset_id).all()

        generated_alerts: List[Alert] = []

        # -------------------------------------------------------------------
        # Rule 1: Human Intrusion / Unauthorized Activity Detection
        # -------------------------------------------------------------------
        human_detections = (
            self.db.query(Detection, Image)
            .join(Image, Detection.image_id == Image.id)
            .filter(Image.dataset_id == dataset_id, Detection.species_name == 'Human')
            .all()
        )

        for det, img in human_detections:
            station_name = img.station.station_name if img.station else (f"CAM_{img.station_id:03d}" if img.station_id else "CAM_001")
            capture_dt = img.exif_timestamp or img.filesystem_timestamp or datetime.utcnow()
            hour = capture_dt.hour

            is_night = hour >= 18 or hour < 6
            is_deep_sanctuary = station_name in ['CAM_007', 'CAM_008', 'CAM_009', 'CAM_010']

            if is_night or is_deep_sanctuary:
                severity = "CRITICAL" if (is_night and is_deep_sanctuary) else "HIGH"
                time_str = capture_dt.strftime("%H:%M:%S")
                msg = (
                    f"Unauthorized human activity detected at {station_name} "
                    f"during {'night' if is_night else 'daytime'} ({time_str}). "
                    f"Potential poaching or illegal trespassing risk."
                )

                alert = Alert(
                    dataset_id=dataset_id,
                    alert_type="HUMAN_INTRUSION",
                    severity=severity,
                    station_name=station_name,
                    tiger_code=None,
                    message=msg,
                    timestamp=capture_dt,
                    image_id=img.id,
                )
                generated_alerts.append(alert)

        # -------------------------------------------------------------------
        # Rule 2: Territory Breach / Rival Dominant Male Intrusion
        # -------------------------------------------------------------------
        tiger_detections = (
            self.db.query(Detection, Image, IndividualTiger)
            .join(Image, Detection.image_id == Image.id)
            .join(IndividualTiger, Detection.individual_id == IndividualTiger.id)
            .filter(Image.dataset_id == dataset_id, Detection.species_name == 'Tiger')
            .all()
        )

        for det, img, tiger in tiger_detections:
            station_name = img.station.station_name if img.station else (f"CAM_{img.station_id:03d}" if img.station_id else "CAM_001")
            tiger_code = tiger.tiger_code

            # Check if tiger is outside native territorial camera stations
            native_cameras = TERRITORY_CAMERAS.get(tiger_code, [])
            if native_cameras and station_name not in native_cameras:
                capture_dt = img.exif_timestamp or img.filesystem_timestamp or datetime.utcnow()
                msg = (
                    f"Territory Breach Alert: Dominant tiger {tiger_code} ({tiger.name}) "
                    f"detected outside core range at {station_name} (Core Territory: {', '.join(native_cameras)})."
                )

                alert = Alert(
                    dataset_id=dataset_id,
                    alert_type="TERRITORY_BREACH",
                    severity="HIGH" if tiger_code in ['T-61', 'T-42'] else "MEDIUM",
                    station_name=station_name,
                    tiger_code=tiger_code,
                    message=msg,
                    timestamp=capture_dt,
                    image_id=img.id,
                )
                generated_alerts.append(alert)

        # -------------------------------------------------------------------
        # Rule 3: High Velocity / Rapid Disturbance Movement
        # -------------------------------------------------------------------
        # Group tiger sightings by tiger_code chronologically
        tiger_timeline: Dict[str, List[tuple]] = {}
        for det, img, tiger in tiger_detections:
            code = tiger.tiger_code
            dt = img.exif_timestamp or img.filesystem_timestamp or datetime.utcnow()
            st = img.station.station_name if img.station else (f"CAM_{img.station_id:03d}" if img.station_id else "CAM_001")
            if code not in tiger_timeline:
                tiger_timeline[code] = []
            tiger_timeline[code].append((dt, st, img.id))

        for code, sightings in tiger_timeline.items():
            sightings.sort(key=lambda x: x[0])
            for i in range(1, len(sightings)):
                prev_dt, prev_st, prev_img_id = sightings[i - 1]
                curr_dt, curr_st, curr_img_id = sightings[i]
                if prev_st != curr_st:
                    dt_hours = (curr_dt - prev_dt).total_seconds() / 3600.0
                    if 0 < dt_hours < 0.75:  # Rapid transit under 45 mins between distant stations
                        msg = (
                            f"Rapid Velocity Anomaly: {code} moved from {prev_st} to {curr_st} "
                            f"in {int(dt_hours * 60)} minutes. Possible flight from disturbance or herd chase."
                        )
                        alert = Alert(
                            dataset_id=dataset_id,
                            alert_type="UNUSUAL_SPEED_VELOCITY",
                            severity="MEDIUM",
                            station_name=curr_st,
                            tiger_code=code,
                            message=msg,
                            timestamp=curr_dt,
                            image_id=curr_img_id,
                        )
                        generated_alerts.append(alert)

        # Bulk save to DB
        if generated_alerts:
            self.db.add_all(generated_alerts)
            self.db.commit()

        return self.db.query(Alert).filter(Alert.dataset_id == dataset_id).all()

    def get_alert_summary(self, dataset_id: int) -> Dict[str, Any]:
        """Retrieves aggregated alert statistics for dashboard reporting."""
        alerts = self.db.query(Alert).filter(Alert.dataset_id == dataset_id).all()
        if not alerts:
            alerts = self.generate_alerts_for_dataset(dataset_id)

        unack_count = sum(1 for a in alerts if a.is_acknowledged == 0)
        critical_count = sum(1 for a in alerts if a.severity == 'CRITICAL')
        high_count = sum(1 for a in alerts if a.severity == 'HIGH')
        medium_count = sum(1 for a in alerts if a.severity == 'MEDIUM')
        info_count = sum(1 for a in alerts if a.severity == 'INFO')

        alerts_by_type: Dict[str, int] = {}
        for a in alerts:
            alerts_by_type[a.alert_type] = alerts_by_type.get(a.alert_type, 0) + 1

        return {
            "dataset_id": dataset_id,
            "total_alerts": len(alerts),
            "unacknowledged_count": unack_count,
            "critical_count": critical_count,
            "high_count": high_count,
            "medium_count": medium_count,
            "info_count": info_count,
            "alerts_by_type": alerts_by_type,
            "alerts": alerts,
        }
