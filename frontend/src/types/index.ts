/**
 * PenchGuard AI — TypeScript type definitions
 */

export interface Dataset {
  id: number;
  name: string;
  source_path: string;
  imported_at: string | null;
  total_images: number;
  valid_images: number;
  invalid_images: number;
  total_size_bytes: number;
  status: 'PENDING' | 'SCANNING' | 'COMPLETED' | 'FAILED';
  is_demo: number;
}

export interface Detection {
  id: number;
  image_id: number;
  species_name: string;
  confidence: number;
  bbox_x: number;
  bbox_y: number;
  bbox_w: number;
  bbox_h: number;
  detected_at: string | null;
}

export interface ImageRecord {
  id: number;
  dataset_id: number;
  filename: string;
  relative_path: string;
  extension: string;
  file_size: number;
  width: number | null;
  height: number | null;
  filesystem_timestamp: string | null;
  exif_timestamp: string | null;
  latitude: number | null;
  longitude: number | null;
  station_id: number | null;
  station_name: string | null;
  validation_status: 'VALID' | 'INVALID' | 'CORRUPT' | 'UNKNOWN';
  validation_notes: string | null;
  is_deleted: number;
  is_blank: number | null;
  blank_confidence: number | null;
  is_quarantined: number;
  processed_at: string | null;
  detections?: Detection[];
  created_at: string | null;
}

export interface BlankDetectionProgress {
  dataset_id: number;
  status: 'IDLE' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  total_images: number;
  processed_images: number;
  blank_count: number;
  animal_count: number;
  quarantined_count: number;
  current_file: string;
  percent: number;
  speed_fps: number;
  time_saved_hours: number;
}

export interface SpeciesDetectionProgress {
  dataset_id: number;
  status: 'IDLE' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  total_images: number;
  processed_images: number;
  tiger_count: number;
  total_detections: number;
  species_counts: Record<string, number>;
  current_file: string;
  percent: number;
  speed_fps: number;
}

export interface SpeciesSummary {
  dataset_id: number;
  dataset_name: string;
  total_images: number;
  total_detections: number;
  tiger_count: number;
  tiger_images_count: number;
  species_counts: Record<string, number>;
}

export interface Station {
  id: number;
  dataset_id: number;
  station_name: string;
  latitude: number | null;
  longitude: number | null;
  source_folder: string | null;
  image_count: number;
}

export interface HealthMetric {
  label: string;
  value: number;
  total: number | null;
  percent: number | null;
  status: 'green' | 'yellow' | 'red';
}

export interface DatasetHealth {
  dataset_id: number;
  dataset_name: string;
  health_score: number;
  total_images: number;
  valid_images: number;
  invalid_images: number;
  corrupt_images: number;
  stations_count: number;
  gps_available_percent: number;
  timestamp_available_percent: number;
  duplicate_candidates: number;
  metrics: HealthMetric[];
}

export interface PaginatedImages {
  images: ImageRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface IndividualTiger {
  id: number;
  tiger_code: string;
  name: string;
  gender: string;
  territory_zone: string | null;
  first_seen: string | null;
  last_seen: string | null;
  total_sightings: number;
  primary_image_id: number | null;
  created_at: string | null;
}

export interface ReIDProgress {
  dataset_id: number;
  status: 'IDLE' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  total_tigers_detected: number;
  matched_tigers: number;
  unique_individuals_count: number;
  percent: number;
  speed_fps: number;
}

export interface SightingTimelineEvent {
  image_id: number;
  filename: string;
  station_name: string;
  timestamp: string | null;
  latitude: number | null;
  longitude: number | null;
  confidence: number;
}

export interface TigerSightingTimeline {
  tiger: IndividualTiger;
  total_sightings: number;
  stations_visited: string[];
  timeline: SightingTimelineEvent[];
}

export interface MovementSighting {
  detection_id: number;
  image_id: number;
  filename: string;
  station_id: number;
  station_name: string;
  latitude: number;
  longitude: number;
  timestamp: string | null;
  reid_confidence: number;
}

export interface TigerTrajectory {
  tiger_id: number;
  tiger_code: string;
  tiger_name: string;
  gender: string;
  territory_zone: string | null;
  total_sightings: number;
  total_distance_km: number;
  territory_bounds: {
    min_lat: number;
    max_lat: number;
    min_lon: number;
    max_lon: number;
  } | null;
  sightings: MovementSighting[];
}

export interface CorridorMetric {
  corridor: string;
  passages: number;
}

export interface MovementSummary {
  dataset_id: number;
  dataset_name: string;
  total_tigers_tracked: number;
  total_distance_tracked_km: number;
  active_corridors_count: number;
  top_corridors: CorridorMetric[];
  trajectories: TigerTrajectory[];
}

export interface AlertItem {
  id: number;
  dataset_id: number;
  alert_type: 'HUMAN_INTRUSION' | 'TERRITORY_BREACH' | 'UNUSUAL_SPEED_VELOCITY' | 'STATION_OFFLINE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  station_name: string | null;
  tiger_code: string | null;
  message: string;
  timestamp: string | null;
  is_acknowledged: number;
  image_id: number | null;
  created_at: string | null;
}

export interface AlertSummary {
  dataset_id: number;
  total_alerts: number;
  unacknowledged_count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  info_count: number;
  alerts_by_type: Record<string, number>;
  alerts: AlertItem[];
}

export type NavPage =
  | 'overview'
  | 'import'
  | 'health'
  | 'processing'
  | 'tigers'
  | 'movement'
  | 'alerts'
  | 'review'
  | 'reports'
  | 'settings';
